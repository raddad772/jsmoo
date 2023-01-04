"use strict";

class NES_mapper_AXROM {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.clock = clock;
        this.bus = bus;

        this.PRG_ROM = [];
        this.CHR_RAM = [];
        this.CIRAM = new Uint8Array(0x2000);
        this.CPU_RAM = new Uint8Array(0x800);

        this.ppu_mirror = NES_PPU_mirror_modes.ScreenAOnly;
        this.mirror_ppu_addr = NES_mirror_ppu_Aonly;
        this.num_PRG_banks = 0;
        this.prg_bank_offset = 0;

        this.bus.CPU_read = this.CPU_read.bind(this);
        this.bus.CPU_write = this.CPU_write.bind(this);
        this.bus.PPU_read = this.PPU_read.bind(this);
        this.bus.PPU_write = this.PPU_write.bind(this);
        this.bus.mapper = this;


    }

    cycle(howmany) {}

    a12_watch(addr) {}

    PPU_read(addr, val, has_effect=true) {
        if (addr < 0x2000) return this.CHR_RAM[addr];
        return this.CIRAM[this.mirror_ppu_addr(addr)];
    }

    PPU_read_noeffect(addr) {
        return this.PPU_read_effect(addr);
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
        return this.PRG_ROM[(addr - 0x8000) + this.prg_bank_offset];
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

        this.prg_bank_offset = ((val & 15) % this.num_PRG_banks) * 32768;
        this.ppu_mirror = (val & 0x10) ? NES_PPU_mirror_modes.ScreenBOnly : NES_PPU_mirror_modes.ScreenAOnly;
        this.set_mirroring();
    }

    reset() {
        this.prg_bank_offset = (this.num_PRG_banks - 1) * 32768;
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

    set_cart(cart) {
        this.PRG_ROM = cart.PRG_ROM;
        this.num_PRG_banks = cart.header.prg_rom_size / 32768;

        this.ppu_mirror = cart.header.mirroring;
        this.set_mirroring();

        this.prg_bank_offset = 0;
    }
}