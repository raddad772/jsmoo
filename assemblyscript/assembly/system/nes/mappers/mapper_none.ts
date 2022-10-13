import {NES_a12_watcher_t, NES_mapper} from "./interface";
import {NES_bus, NES_clock} from "../nes_common";
import {NES_cart} from "../nes_cart";

export class NES_mapper_none implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    a12_watcher: NES_a12_watcher_t
    CHR_ROM: Uint8Array
    PRG_ROM: Uint8Array
    CIRAM: Uint8Array
    CPU_RAM: Uint8Array
    ppu_mirror: u32
    PRG_ROM_size: u32
    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;
        this.a12_watcher = new NES_a12_watcher_t(clock);

        this.CHR_ROM = new Uint8Array(0x2000);
        this.PRG_ROM = new Uint8Array(0x8000);
        this.PRG_ROM_size = 0
        this.CIRAM = new Uint8Array(0x2000); // PPU RAM
        this.CPU_RAM = new Uint8Array(0x800);
        this.ppu_mirror = 0
    }

    mirror_ppu_addr(addr: u32): u32 {
        addr &= 0xFFF;
        if (this.ppu_mirror === 0) {
            if ((addr >= 0x400) && (addr < 0x800)) return addr - 0x400;
            if ((addr >= 0xC00)) return addr - 0x400;
        } else {
            if (addr >= 0x800) return addr - 0x800;
        }
        return addr;
    }

    cycle(howmany: u32) : void {}

    CPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        addr &= 0xFFFF;
        if (addr < 0x2000)
            return this.CPU_RAM[addr & 0x7FF];
        if (addr < 0x3FFF)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        if (addr >= 0x8000)
            return this.PRG_ROM[(addr - 0x8000) % this.PRG_ROM_size];
        return val;
    }

    CPU_write(addr: u32, val: u32): void {
        addr &= 0xFFFF;
        if (addr < 0x2000) {
            this.CPU_RAM[addr & 0x7FF] = val;
            return;
        }
        if (addr < 0x3FFF) {
            this.bus.PPU_reg_write(addr, val);
            return;
        }
        if (addr < 0x4020) {
            this.bus.CPU_reg_write(addr, val);
            return;
        }
    }

    PPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        if (addr < 0x2000)
            return this.CHR_ROM[addr];
        return this.CIRAM[this.mirror_ppu_addr(addr)];
    }

    PPU_write(addr: u32, val: u32): void {
        if (addr < 0x2000) return;
        this.CIRAM[this.mirror_ppu_addr(addr)] = val;
    }

    reset(): void { } // naught to do on reset

    set_cart(cart: NES_cart): void {
        this.CHR_ROM.set(cart.CHR_ROM);
        this.PRG_ROM = new Uint8Array(cart.PRG_ROM.byteLength);
        this.PRG_ROM.set(cart.PRG_ROM);
        this.PRG_ROM_size = cart.header.prg_rom_size;

        this.ppu_mirror = cart.header.mirroring;
    }
}