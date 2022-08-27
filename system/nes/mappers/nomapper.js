"use strict";

class NES_mapper_none {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.CHR_ROM = new Uint8Array(0x2000);
        this.PRG_ROM = new Uint8Array(0x8000);
        this.CIRAM = new Uint8Array(0x2000); // PPU RAM
        this.CPU_RAM = new Uint8Array(0x800);
        this.cart = null;

        this.clock = clock;
        this.bus = bus;

        this.bus.CPU_read = this.cpu_read.bind(this);
        this.bus.CPU_write = this.cpu_write.bind(this);
        this.bus.PPU_read = this.ppu_read.bind(this);
        this.bus.PPU_write = this.ppu_write.bind(this);

        this.ppu_mirror = 0; // 0= RAM at 0x2000 and 0x2800; 0x2400 and 0x2C00 are mirrors.
                             // 1= RAM at 0x2000 and 0x2400; 0x2800 and 0x2C00 are mirrors
    }

    mirror_ppu_addr(addr) {
        if (this.ppu_mirror === 0) {
            if ((addr >= 0x2400) && (addr < 0x2800)) return addr - 0x400;
            if ((addr >= 0x2C00)) return addr - 0x400;
        } else {
            if (addr >= 0x2800) return addr - 0x800;
        }
        return addr;
    }

    ppu_write(addr, val) {
        if (addr < 0x2000) return; // can't write ROM
        this.CIRAM[this.mirror_ppu_addr(addr)-0x2000] = val;
    }

    ppu_read(addr, val, has_effect=true) {
        if (addr < 0x2000)
            return this.CHR_ROM[addr];
        // TODO: implement mirroring
        return this.CIRAM[this.mirror_ppu_addr(addr)-0x2000];
    }

    cpu_write(addr, val) {
        if (addr < 0x2000) {
            addr &= 0x7FFF;
            this.CPU_RAM[addr] = val;
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
        if (addr > 0x8000) // ROM!
            return;
        //DOMORE
    }

    cpu_read(addr, val, has_effect=true) {
        if (addr < 0x2000) {
            addr &= 0x7FFF;
            return this.CPU_RAM[addr];
        }
        if (addr < 0x3FFF)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        if (addr > 0x8000) {
            addr -= 0x8000;
            while(addr >= this.PRG_ROM.byteLength) addr -= this.PRG_ROM.byteLength;
            return this.PRG_ROM[addr];
        }
        // DOMORE
    }

    /**
     * @param {NES_cart} cart
     */
    set_cart(cart) {
        this.CHR_ROM.set(cart.CHR_ROM);
        this.PRG_ROM = new Uint8Array(cart.PRG_ROM.byteLength);
        this.PRG_ROM.set(cart.PRG_ROM);

        this.ppu_mirror = cart.header.mirroring;
    }
}