import {NES_mapper} from "./interface";
import {NES_cart} from "../nes_cart";
import {NES_bus, NES_clock} from "../nes_common";

export class NES_mapper_UXROM implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    CHR_ROM: StaticArray<u8> = new StaticArray<u8>(0x2000);
    PRG_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    CIRAM: StaticArray<u8> = new StaticArray<u8>(0x2000); // PPU RAM
    CPU_RAM: StaticArray<u8> = new StaticArray<u8>(0x800); // CPU RAM

    ppu_mirror: i32 = 0;
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

    @inline mirror_ppu_addr(addr: u32): u32 {
        addr &= 0xFFF;
        if (this.ppu_mirror === 0) {
            if ((addr >= 0x400) && (addr < 0x800)) return addr - 0x400;
            if ((addr >= 0xC00)) return addr - 0x400;
        } else {
            if (addr >= 0x800) return addr - 0x800;
        }
        return addr;
    }

    @inline PPU_read_effect(addr: u32): u32 {
        if (addr < 0x2000) return unchecked(this.CHR_ROM[addr]);
        return unchecked(this.CIRAM[this.mirror_ppu_addr(addr)]);
    }

    PPU_read_noeffect(addr: u32): u32 {
        return this.PPU_read_effect(addr);
    }

    PPU_write(addr: u32, val: u32): void {
        if (addr < 0x2000) return;
        unchecked(this.CIRAM[this.mirror_ppu_addr(addr)] = <u8>val);
    }

    @inline CPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        addr &= 0xFFFF;
        if (addr < 0x2000)
            return unchecked(this.CPU_RAM[addr & 0x7FF]);
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
            unchecked(this.CPU_RAM[addr & 0x7FF] = <u8>val);
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

    set_cart(cart: NES_cart): void {
        for (let i = 0; i < 0x2000; i++) {
            this.CHR_ROM[i] = cart.CHR_ROM[i];
        }
        this.PRG_ROM = new StaticArray<u8>(cart.PRG_ROM.byteLength);
        for (let i = 0, k = cart.PRG_ROM.byteLength; i < k; i++) {
            this.PRG_ROM[i] = cart.PRG_ROM[i];
        }
        this.PRG_ROM_size = cart.header.prg_rom_size;
        this.num_PRG_banks = cart.header.prg_rom_size / 16384;

        this.ppu_mirror = cart.header.mirroring;

        this.prg_bank_offset = 0;
        this.last_bank_offset = (this.num_PRG_banks - 1) * 16384;
    }
}