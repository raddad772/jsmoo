import {NES_bus, NES_clock} from "../nes_common";
import {
    NES_mapper, NES_mirror_ppu_Aonly, NES_mirror_ppu_Bonly,
    NES_mirror_ppu_four,
    NES_mirror_ppu_horizontal,
    NES_mirror_ppu_vertical,
    NES_PPU_mirror_modes
} from "./interface";
import {NES_cart} from "../nes_cart";

class CD_regs {
    select: u32 = 0
    prg_banks: StaticArray<u32> = new StaticArray<u32>(4);
    chr_banks: StaticArray<u32> = new StaticArray<u32>(8);
}

export class NES_mapper_DXROM implements NES_mapper {
    bus: NES_bus;
    clock: NES_clock;
    regs: CD_regs = new CD_regs();
    num_PRG_banks: u32 = 0;
    num_CHR_banks: u32 = 0;

    ppu_mirror: NES_PPU_mirror_modes = NES_PPU_mirror_modes.Horizontal;
    mirror_ppu_addr: (addr: u32) => u32 = NES_mirror_ppu_horizontal;

    CHR_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    PRG_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    CIRAM: StaticArray<u8> = new StaticArray<u8>(0x2000); // PPU RAM
    CPU_RAM: StaticArray<u8> = new StaticArray<u8>(0x800); // CPU RAM

    last_bank_offset: u32 = 0;
    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;
    }

    @inline cycle(howmany: u32): void {}

    @inline PPU_read_effect(addr: u32): u32 {
        if (addr < 0x2000)
            return unchecked(this.CHR_ROM[unchecked(this.regs.chr_banks[addr >>> 10]) + (addr & 0x3FF)]);

        return unchecked(this.CIRAM[this.mirror_ppu_addr(addr)]);
    }

    PPU_read_noeffect(addr: u32): u32 {
        return this.PPU_read_effect(addr);
    }

    @inline PPU_write(addr: u32, val: u32): void {
        if (addr < 0x2000) return;
        unchecked(this.CIRAM[this.mirror_ppu_addr(addr)] = <u8>val);
    }

    @inline CPU_write(addr: u32, val: u32): void {
        if (addr < 0x2000) {
            unchecked(this.CPU_RAM[addr & 0x7FF] = <u8>val);
            return;
        }
        if (addr < 0x4000)
            return this.bus.PPU_reg_write(addr, val);
        if (addr < 0x4020)
            return this.bus.CPU_reg_write(addr, val);

        if ((addr < 0x8000) || (addr > 0xA000)) return;
        switch(addr & 1) {
            case 0: // 8000-FFFF even
                this.regs.select = val & 7;
                return;
            case 1:
                switch(this.regs.select) {
                    case 0:
                        return this.set_CHR_ROM_2k(0x0000, val & 0x3E);
                    case 1:
                        return this.set_CHR_ROM_2k(0x0800, val & 0x3E);
                    case 2:
                        return this.set_CHR_ROM_1k(0x1000, val & 0x3F);
                    case 3:
                        return this.set_CHR_ROM_1k(0x1400, val & 0x3F);
                    case 4:
                        return this.set_CHR_ROM_1k(0x1800, val & 0x3F);
                    case 5:
                        return this.set_CHR_ROM_1k(0x1C00, val & 0x3F);
                    case 6:
                        return this.set_PRG_ROM_8k(0x8000, val & 0x0F);
                    case 7:
                        return this.set_PRG_ROM_8k(0xA000, val & 0x0F);
                }
                return;
        }
    }

    @inline CPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        if (addr < 0x2000)
            return unchecked(this.CPU_RAM[addr & 0x7FF]);
        if (addr < 0x4000)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        if (addr < 0x8000) return val;
        return unchecked(this.PRG_ROM[unchecked(this.regs.prg_banks[(addr - 0x8000) >>> 13]) + (addr & 0x1FFF)]);
    }

    set_PRG_ROM_8k(addr: u32, bank_num: u32): void {
        this.regs.prg_banks[(addr === 0x8000) ? 0 : 1] = (bank_num % this.num_PRG_banks) * 8192;
    }

    set_CHR_ROM_2k(addr: u32, bank_num: u32): void {
        let bn: u32 = (addr >>> 10);
        bank_num = (bank_num % this.num_CHR_banks);
        this.regs.chr_banks[bn] = bank_num * 1024;
        this.regs.chr_banks[bn+1] = (bank_num+1) * 1024;
    }

    set_CHR_ROM_1k(addr: u32, bank_num: u32): void {
        let bn: u32 = (addr >>> 10);
        this.regs.chr_banks[bn] = (bank_num % this.num_CHR_banks) * 1024;
    }

    reset(): void {
        this.remap(true);
    }

    remap(boot: bool = false): void {
        if (boot) {
            this.set_PRG_ROM_8k(0x8000, 0);
            this.set_PRG_ROM_8k(0xA000, 1);
            // 0xC000-0xFFFF fixed to last two banks
            this.regs.prg_banks[2] = (this.num_PRG_banks - 2) * 8192;
            this.regs.prg_banks[3] = (this.num_PRG_banks - 1) * 8192;

            this.set_CHR_ROM_2k(0x0000, 0);
            this.set_CHR_ROM_2k(0x0800, 2);
            this.set_CHR_ROM_1k(0x1000, 4);
            this.set_CHR_ROM_1k(0x1400, 5);
            this.set_CHR_ROM_1k(0x1800, 6);
            this.set_CHR_ROM_1k(0x1C00, 7);
        }
    }

    set_mirroring(): void {
        switch(this.ppu_mirror) {
            case NES_PPU_mirror_modes.Vertical:
                this.mirror_ppu_addr = NES_mirror_ppu_vertical;
                return;
            case NES_PPU_mirror_modes.Horizontal:
                this.mirror_ppu_addr = NES_mirror_ppu_horizontal;
                return;
            case NES_PPU_mirror_modes.FourWay:
                this.mirror_ppu_addr = NES_mirror_ppu_four;
                return;
            case NES_PPU_mirror_modes.ScreenAOnly:
                this.mirror_ppu_addr = NES_mirror_ppu_Aonly;
                return;
            case NES_PPU_mirror_modes.ScreenBOnly:
                this.mirror_ppu_addr = NES_mirror_ppu_Bonly;
                return;
        }
    }

    set_cart(cart: NES_cart): void {
        this.CHR_ROM = new StaticArray<u8>(cart.CHR_ROM.byteLength);
        for (let i: u32 = 0, k: u32 = cart.CHR_ROM.byteLength; i < k; i++) {
            this.CHR_ROM[i] = cart.CHR_ROM[i];
        }
        this.PRG_ROM = new StaticArray<u8>(cart.PRG_ROM.byteLength);
        for (let i: u32 = 0, k: u32 = cart.PRG_ROM.byteLength; i < k; i++) {
            this.PRG_ROM[i] = cart.PRG_ROM[i];
        }

        this.ppu_mirror = cart.header.mirroring;
        this.set_mirroring();

        this.num_PRG_banks = cart.PRG_ROM.byteLength / 8192;
        this.num_CHR_banks = cart.CHR_ROM.byteLength / 1024;
        this.remap(true);
    }

}