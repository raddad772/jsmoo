"use strict";

class GB_GENERIC_MEM {
    /**
     * @param {GB_bus} bus
     * @param {GB_clock} clock
     */
    constructor(clock, bus) {
        this.clock = clock;
        this.bus = bus;
        this.WRAM = new Uint8Array(8192 * 8);
        this.HRAM = new Uint8Array(128);
        this.VRAM = new Uint8Array(16384);

        this.VRAM_bank_offset = 0;
        this.WRAM_bank_offset = 0x1000;

        this.BIOS_big = false;
    }

    reset() {
        // This changes on CGB
        this.VRAM_bank_offset = 0;
        // This changes on CGB
        this.WRAM_bank_offset = 0x1000;
    }

    PPU_read(addr) {
        if ((addr < 0x8000) || (addr >= 0xC000)) {
            console.log('WAIT WHAT BAD READ?');
            return 0xFF;
        }
        return this.VRAM[(addr - 0x8000) & 0x3FFF];
    }

    CPU_write(addr, val) {
        if ((addr >= 0x4000) && (addr < 0x4020)) {
            console.log('W!', hex4(addr), hex2(val));
        }
        if ((addr >= 0xE000) && (addr < 0xFE00)) addr -= 0x2000;  // Mirror WRAM

        if ((addr >= 0x8000) && (addr < 0xA000)) { // VRAM
            //if (this.clock.CPU_can_VRAM) {
                this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset] = val;
                return true;
            //} else {
                //console.log('VRAM WRITE BLOCKED!', this.bus.ppu.enabled, this.bus.ppu.io.bg_window_enable, this.clock.ly, this.bus.ppu.line_cycle);
                //return true;
            //}
        }

        if ((addr >= 0xC000) && (addr < 0xD000)) { // WRAM lo bank
            this.WRAM[addr & 0xFFF] = val;
            return true;
        }
        if ((addr >= 0xD000) && (addr < 0xE000)) { // WRAM hi bank
            this.WRAM[(addr & 0xFFF) + this.WRAM_bank_offset] = val;
            return true;
        }
        if ((addr >= 0xFE00) && (addr < 0xFF00)) { // OAM
            this.bus.CPU_write_OAM(addr, val);
            return true;
        }
        if ((addr >= 0xFF00) && (addr < 0xFF80)) {// registers
            this.bus.CPU_write_IO(addr, val);
            return true;
        }
        if ((addr >= 0xFF80) && (addr < 0xFFFF)) { // HRAM always accessible
            this.HRAM[addr - 0xFF80] = val;
            return true;
        }
        if (addr === 0xFFFF) {  // 0xFFFF register
            this.bus.CPU_write_IO(addr, val);
            return true;
        }
        return false;
    }

    CPU_read(addr, val, has_effect=true) {
        if ((addr >= 0xE000) && (addr < 0xFE00)) addr -= 0x2000; // Mirror WRAM
        if (this.clock.bootROM_enabled) {
            if (addr < 0x100) {
                return this.bus.BIOS[addr];
            }
            if (this.BIOS_big && (addr >= 0x200) && (addr < 0x900))
                return this.bus.BIOS[addr - 0x100];
        }

        if ((addr >= 0x8000) && (addr < 0xA000)) { // VRAM, banked
            //if (this.clock.CPU_can_VRAM)
                return this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset];
            return 0xFF;
        }

        if ((addr >= 0xC000) && (addr < 0xD000)) // WRAM lo bank
            return this.WRAM[addr & 0xFFF];
        if ((addr >= 0xD000) && (addr < 0xE000)) // WRAM hi bank
            return this.WRAM[(addr & 0xFFF) + this.WRAM_bank_offset]
        if ((addr >= 0xFE00) && (addr < 0xFF00)) // OAM
            return this.bus.CPU_read_OAM(addr, val, has_effect);
        if ((addr >= 0xFF00) && (addr < 0xFF80)) // registers
            return this.bus.CPU_read_IO(addr, val, has_effect);
        if ((addr >= 0xFF80) && (addr < 0xFFFF)) // HRAM always accessible
            return this.HRAM[addr - 0xFF80];
        if (addr === 0xFFFF)
            return this.bus.CPU_read_IO(0xFFFF, val, has_effect); // 0xFFFF register

        return null;
    }

    /**
     * @param {GB_cart} cart
     * @param {Uint8Array} BIOS
     */
    set_cart(cart, BIOS) {
        this.cart = cart;
        this.BIOS_big = this.bus.BIOS.byteLength > 256;
    }
}
