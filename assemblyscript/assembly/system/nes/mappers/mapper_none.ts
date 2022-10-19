import {
    NES_a12_watcher_t,
    NES_mapper,
    NES_mirror_ppu_Aonly,
    NES_mirror_ppu_Bonly,
    NES_mirror_ppu_four,
    NES_mirror_ppu_horizontal,
    NES_mirror_ppu_vertical, NES_PPU_mirror_modes
} from "./interface";
import {NES_bus, NES_clock} from "../nes_common";
import {NES_cart} from "../nes_cart";

export class NES_mapper_none implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    a12_watcher: NES_a12_watcher_t
    CHR_ROM: StaticArray<u8>
    PRG_ROM: StaticArray<u8>
    CIRAM: StaticArray<u8>
    CPU_RAM: StaticArray<u8>
    ppu_mirror: NES_PPU_mirror_modes = NES_PPU_mirror_modes.Horizontal;
    PRG_ROM_size: u32
    mirror_ppu_addr: (addr: u32) => u32 = NES_mirror_ppu_horizontal;
    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;
        this.a12_watcher = new NES_a12_watcher_t(clock);

        this.CHR_ROM = new StaticArray<u8>(0x2000);
        this.PRG_ROM = new StaticArray<u8>(0x8000);
        this.PRG_ROM_size = 0
        this.CIRAM = new StaticArray<u8>(0x2000); // PPU RAM
        this.CPU_RAM = new StaticArray<u8>(0x800);
        this.ppu_mirror = 0;
    }

    cycle(howmany: u32) : void {}

    @inline CPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        addr &= 0xFFFF;
        if (addr < 0x2000)
            return unchecked(this.CPU_RAM[addr & 0x7FF]);
        if (addr < 0x3FFF)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        if (addr >= 0x8000)
            return unchecked(this.PRG_ROM[(addr - 0x8000) % this.PRG_ROM_size]);
        return val;
    }

    @inline CPU_write(addr: u32, val: u32): void {
        addr &= 0xFFFF;
        if (addr < 0x2000) {
            unchecked(this.CPU_RAM[addr & 0x7FF] = <u8>val);
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

    @inline PPU_read_effect(addr: u32): u32 {
        if (addr < 0x2000)
            return unchecked(this.CHR_ROM[addr]);
        return unchecked(this.CIRAM[this.mirror_ppu_addr(addr)]);
    }

    PPU_read_noeffect(addr: u32): u32 {
        return this.PPU_read_effect(addr);
    }

    @inline PPU_write(addr: u32, val: u32): void {
        if (addr < 0x2000) return;
        unchecked(this.CIRAM[this.mirror_ppu_addr(addr)] = <u8>val);
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

    reset(): void { } // naught to do on reset

    set_cart(cart: NES_cart): void {
        for (let i = 0; i < 0x2000; i++) {
            this.CHR_ROM[i] = cart.CHR_ROM[i];
        }
        this.PRG_ROM = new StaticArray<u8>(cart.PRG_ROM.byteLength);
        for (let i = 0, k = cart.PRG_ROM.byteLength; i < k; i++) {
            this.PRG_ROM[i] = cart.PRG_ROM[i];
        }
        this.PRG_ROM_size = cart.header.prg_rom_size;

        this.ppu_mirror = cart.header.mirroring;
        this.set_mirroring();
    }
}