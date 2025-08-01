"use strict";

function NES_mirror_ppu_four(addr) {
    return addr & 0xFFF;
}

function NES_mirror_ppu_vertical(addr) {
    return (addr & 0x0400) | (addr & 0x03FF);
}

function NES_mirror_ppu_horizontal(addr) {
    return ((addr >>> 1) & 0x0400) | (addr & 0x03FF);
}

function NES_mirror_ppu_Aonly(addr) {
    return addr & 0x3FF;
}

function NES_mirror_ppu_Bonly(addr) {
    return 0x400 | (addr & 0x3FF);
}


const NES_PPU_mirror_modes = Object.freeze({
    Horizontal: 0,
    Vertical: 1,
    FourWay: 2,
    ScreenAOnly: 3,
    ScreenBOnly: 4
})

class NES_mapper_UXROM {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.clock = clock
        this.bus = bus

        this.bus.mapper = this;

        this.bus.CPU_read = this.CPU_read.bind(this);
        this.bus.CPU_write = this.CPU_write.bind(this);
        this.bus.PPU_read = this.PPU_read.bind(this);
        this.bus.PPU_write = this.PPU_write.bind(this);

        this.CHR_RAM = new Uint8Array(0x2000);
        this.PRG_ROM = new Uint8Array(0);
        this.CIRAM = new Uint8Array(0x2000); // PPU RAM
        this.CPU_RAM = new Uint8Array(0x800); // CPU RAM

        this.ppu_mirror = NES_PPU_mirror_modes.Horizontal;
        this.mirror_ppu_addr = NES_mirror_ppu_horizontal;

        this.num_PRG_banks = 0;
        this.PRG_ROM_size = 0;
        this.prg_bank_offset = 0;
        this.last_bank_offset = 0;

        this.is_unrom = 0;
        this.is_uorom = 0;
    }

    cycle(howmany) {}

    a12_watch(addr) {}

    PPU_read(addr, val, has_effect) {
        if (addr < 0x2000) return this.CHR_RAM[addr];
        return this.CIRAM[this.mirror_ppu_addr(addr)];
    }

    PPU_write(addr, val) {
        if (addr < 0x2000) this.CHR_RAM[addr] = val;
        else this.CIRAM[this.mirror_ppu_addr(addr)] = val;
    }

    CPU_read(addr, val, has_effect) {
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

    CPU_write(addr, val) {
        addr &= 0xFFFF;
        if (addr < 0x2000) {
            this.CPU_RAM[addr & 0x7FF] = val;
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

    reset() {
        this.prg_bank_offset = 0;
    }

    set_mirroring() {
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


    /**
     * @param {NES_cart} cart
     */
    set_cart(cart) {
        this.PRG_ROM = cart.PRG_ROM;
        this.PRG_ROM_size = cart.header.prg_rom_size;
        this.num_PRG_banks = cart.header.prg_rom_size / 16384;

        this.ppu_mirror = cart.header.mirroring;
        this.set_mirroring();

        this.prg_bank_offset = 0;
        this.last_bank_offset = (this.num_PRG_banks - 1) * 16384;
    }
}