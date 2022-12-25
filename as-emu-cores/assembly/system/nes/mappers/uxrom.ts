import {
    NES_mapper, NES_mirror_ppu_Aonly, NES_mirror_ppu_Bonly,
    NES_mirror_ppu_four,
    NES_mirror_ppu_horizontal,
    NES_mirror_ppu_vertical,
    NES_PPU_mirror_modes
} from "./interface";
import {NES_cart} from "../nes_cart";
import {NES_bus, NES_clock} from "../nes_common";

export class NES_mapper_UXROM implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    CHR_RAM: StaticArray<u8> = new StaticArray<u8>(0x2000);
    PRG_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    CIRAM: StaticArray<u8> = new StaticArray<u8>(0x2000); // PPU RAM
    CPU_RAM: StaticArray<u8> = new StaticArray<u8>(0x800); // CPU RAM

    ppu_mirror: NES_PPU_mirror_modes = NES_PPU_mirror_modes.Horizontal;
    mirror_ppu_addr: (addr: u32) => u32 = NES_mirror_ppu_horizontal;

    num_PRG_banks: u32 = 0;
    PRG_ROM_size: u32 = 0;
    prg_bank_offset: u32 = 0;
    last_bank_offset: u32 = 0;

    is_unrom: u32 = 0;
    is_uorom: u32 = 0;

    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;
    }

    @inline cycle(howmany: u32): void {}

    @inline a12_watch(addr: u32): void {}

    @inline PPU_read_effect(addr: u32): u32 {
        if (addr < 0x2000) return this.CHR_RAM[addr];
        return this.CIRAM[this.mirror_ppu_addr(addr)];
    }

    PPU_read_noeffect(addr: u32): u32 {
        return this.PPU_read_effect(addr);
    }

    @inline PPU_write(addr: u32, val: u32): void {
        if (addr < 0x2000) this.CHR_RAM[addr] = <u8>val;
        else this.CIRAM[this.mirror_ppu_addr(addr)] = <u8>val;
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
        if (addr < 0xC000) return this.PRG_ROM[(addr - 0x8000) + this.prg_bank_offset];
        return this.PRG_ROM[(addr - 0xC000) + this.last_bank_offset];
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
        if (this.is_unrom)
            val &= 7;
        if (this.is_uorom)
            val &= 15;
        this.prg_bank_offset = 16384 * (val % this.num_PRG_banks);
    }

    reset(): void {
        this.prg_bank_offset = 0;
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
        this.PRG_ROM = new StaticArray<u8>(cart.PRG_ROM.byteLength);
        for (let i = 0, k = cart.PRG_ROM.byteLength; i < k; i++) {
            this.PRG_ROM[i] = cart.PRG_ROM[i];
        }
        this.PRG_ROM_size = cart.header.prg_rom_size;
        this.num_PRG_banks = cart.header.prg_rom_size / 16384;

        this.ppu_mirror = cart.header.mirroring;
        this.set_mirroring();

        this.prg_bank_offset = 0;
        this.last_bank_offset = (this.num_PRG_banks - 1) * 16384;
    }
}