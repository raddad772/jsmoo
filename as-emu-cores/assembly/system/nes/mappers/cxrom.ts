import {
    NES_mapper, NES_mirror_ppu_Aonly, NES_mirror_ppu_Bonly,
    NES_mirror_ppu_four,
    NES_mirror_ppu_horizontal,
    NES_mirror_ppu_vertical,
    NES_PPU_mirror_modes
} from "./interface";
import {NES_cart} from "../nes_cart";
import {NES_bus, NES_clock} from "../nes_common";

export class NES_mapper_CXROM implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    CHR_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    PRG_ROM: StaticArray<u8> = new StaticArray<u8>(0x8000);
    CIRAM: StaticArray<u8> = new StaticArray<u8>(0x2000); // PPU RAM
    CPU_RAM: StaticArray<u8> = new StaticArray<u8>(0x800); // CPU RAM

    ppu_mirror: NES_PPU_mirror_modes = NES_PPU_mirror_modes.Horizontal;
    mirror_ppu_addr: (addr: u32) => u32 = NES_mirror_ppu_horizontal;
    num_CHR_banks: u32 = 0;
    PRG_ROM_size: u32 = 0;
    PRG_ROM_mask: u32 = 0
    chr_bank_offset: u32 = 0;

    is_cnrom: u32 = 0;

    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;
    }

    @inline cycle(howmany: u32): void {}

    @inline a12_watch(addr: u32): void {}

    @inline PPU_read_effect(addr: u32): u32 {
        if (addr < 0x2000) return this.CHR_ROM[addr + this.chr_bank_offset];
        return this.CIRAM[this.mirror_ppu_addr(addr)];
    }

    PPU_read_noeffect(addr: u32): u32 {
        return this.PPU_read_effect(addr);
    }

    @inline PPU_write(addr: u32, val: u32): void {
        if (addr < 0x2000) return;
        this.CIRAM[this.mirror_ppu_addr(addr)] = <u8>val;
    }

    @inline CPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        addr &= 0xFFFF;
        if (addr < 0x2000)
            return this.CPU_RAM[addr & 0x7FF];
        if (addr < 0x3FFF)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        if (addr < 0x8000) return val;
        return this.PRG_ROM[(addr - 0x8000) & this.PRG_ROM_mask];
    }

    @inline CPU_write(addr: u32, val: u32): void {
        addr &= 0xFFFF;
        if (addr < 0x2000) {
            this.CPU_RAM[addr & 0x7FF] = <u8>val;
            return;
        }
        if (addr < 0x3FFF)
            return this.bus.PPU_reg_write(addr, val);
        if (addr < 0x4020)
            return this.bus.CPU_reg_write(addr, val);

        if (addr < 0x8000) return;
        if (this.is_cnrom) val &= 3;
        else val &= 7;
        this.chr_bank_offset = (val % this.num_CHR_banks) * 8192;
    }

    reset(): void {
        this.chr_bank_offset = 0;
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
        for (let i = 0, k = cart.PRG_ROM.byteLength; i < k; i++) {
            this.PRG_ROM[i] = cart.PRG_ROM[i];
        }
        if (cart.PRG_ROM.byteLength === 16384) this.PRG_ROM_mask = 0x3FFF;
        else this.PRG_ROM_mask = 0x7FFF;

        this.num_CHR_banks = cart.header.chr_rom_size / 8192;

        this.ppu_mirror = cart.header.mirroring;
        this.set_mirroring();
        this.chr_bank_offset = 0;
    }
}