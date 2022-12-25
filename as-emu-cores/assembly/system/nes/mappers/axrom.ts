import {
    NES_mapper,
    NES_mirror_ppu_Aonly, NES_mirror_ppu_Bonly, NES_mirror_ppu_four,
    NES_mirror_ppu_horizontal,
    NES_mirror_ppu_vertical,
    NES_PPU_mirror_modes
} from "./interface";
import {NES_cart} from "../nes_cart";
import {NES_bus, NES_clock} from "../nes_common";

export class NES_mapper_AXROM implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    PRG_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    CHR_RAM: StaticArray<u8> = new StaticArray<u8>(0x2000);
    CIRAM: StaticArray<u8> = new StaticArray<u8>(0x800); // PPU RAM
    CPU_RAM: StaticArray<u8> = new StaticArray<u8>(0x800); // CPU RAM

    ppu_mirror: NES_PPU_mirror_modes = NES_PPU_mirror_modes.ScreenAOnly;
    mirror_ppu_addr: (addr: u32) => u32 = NES_mirror_ppu_Aonly;
    num_PRG_banks: u32 = 0;
    prg_bank_offset: u32 = 0;

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

    PPU_write(addr: u32, val: u32): void {
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
        return this.PRG_ROM[(addr - 0x8000) + this.prg_bank_offset];
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

        this.prg_bank_offset = ((val & 15) % this.num_PRG_banks) * 32768;
        this.ppu_mirror = (val & 0x10) ? NES_PPU_mirror_modes.ScreenBOnly : NES_PPU_mirror_modes.ScreenAOnly;
        this.set_mirroring();
    }

    reset(): void {
        this.prg_bank_offset = (this.num_PRG_banks - 1) * 32768;
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
        this.num_PRG_banks = cart.header.prg_rom_size / 32768;

        this.ppu_mirror = cart.header.mirroring;
        this.set_mirroring();

        this.prg_bank_offset = 0;
    }
}