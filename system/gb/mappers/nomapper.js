"use strict";

class GB_MAPPER_none {
    /**
     * @param {GB_cart} cart
     * @param {bios_t} bios
     * @param {GB_bus} bus
     * @param {GB_clock} clock
     */
    constructor(cart, bios, clock, bus) {
        this.clock = clock;
        this.bus = bus;

        this.bus.CPU_read = this.CPU_read.bind(this);
        this.bus.CPU_write = this.CPU_write.bind(this);

        this.ROM = new Uint8Array(0);

        // This changes on other mappers for banking
        this.ROM_bank_offset = 16384;
        // This changes on CGB
        this.VRAM_bank_offset = 0;
        // This changes on CGB
        this.WRAM_bank_offset = 0x1000;

        this.cartRAM = new Uint8Array(0)
        this.WRAM = new Uint8Array(8192*8);
        this.HRAM = new Uint8Array(128);
        this.RAM_mask = 0;
        this.has_RAM = false;
        this.VRAM = new Uint8Array(32768);

        this.bus.mapper = this;
        this.bios = bios;
        this.BIOS = new Uint8Array(0);
        this.BIOS_big = 0;

        this.cart = cart;
        this.set_cart(cart);
    }

    reset() {
        // This changes on other mappers for banking
        this.ROM_bank_offset = 16384;
        // This changes on CGB
        this.VRAM_bank_offset = 0;
        // This changes on CGB
        this.WRAM_bank_offset = 0x1000;
    }

    CPU_read(addr, val, has_effect=true) {
        if (this.clock.bootROM_enabled) {
            if (addr < 0x100)
                return this.BIOS[addr];
            if (this.BIOS_big && (addr >= 0x200) && (addr < 0x900))
                return this.bios[addr - 0x100];
        }
        if (addr < 0x4000) // ROM low bank
            return this.ROM[addr];
        if (addr < 0x8000) // ROM hi bank
            return this.ROM[(addr & 0x3FFF) + this.ROM_bank_offset];
        if (addr < 0xA000) { // VRAM
            if (this.clock.CPU_can_VRAM)
                return this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset];
            return 0xFF;
        } // cart RAM if it's there
        if (addr < 0xC000) {
            if (!this.has_RAM) return;
            return this.cartRAM[(addr - 0xA000) & this.RAM_mask];
        }
        // Adjust address for mirroring
        if ((addr > 0xE000) && (addr < 0xFE00)) addr -= 0x2000;
        if (addr < 0xD000) // WRAM low bank
            return this.WRAM[addr & 0xFFF];
        if (addr < 0xE000) // WRAM hi bank
            return this.WRAM[(addr & 0xFFF) + this.WRAM_bank_offset]
        if (addr < 0xFF00) // OAM
            return this.bus.CPU_read_OAM(addr, val, has_effect);
        if (addr < 0xFF80) // registers
            return this.bus.CPU_read_IO(addr, val, has_effect);
        if (addr < 0xFFFF) // HRAM always accessible
            return this.HRAM[addr - 0xFF80];
        return this.bus.CPU_read_IO(addr, val, has_effect); // 0xFFFF register
    }

    CPU_write(addr, val) {
        if (addr < 0x8000) // ROMs
            return;
        if (addr < 0xA000) { // VRAM
            if (this.clock.CPU_can_VRAM)
                this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset] = val;
            return;
        }
        if (addr < 0xC000) { // cart RAM
            if (!this.has_RAM) return;
            this.cartRAM[(addr - 0xA000) & this.RAM_mask] = val;
            return;
        }
        // adjust address for mirroring
        if ((addr > 0xE000) && (addr < 0xFE00)) addr -= 0x2000;

        if (addr < 0xD000) { // WRAM low bank
            this.WRAM[addr & 0xFFF] = val;
            return;
        }
        if (addr < 0xE000) { // WRAM hi bank
            this.WRAM[(addr & 0xFFF) + this.WRAM_bank_offset] = val;
            return;
        }
        if (addr < 0xFF00) // OAM
            return this.bus.CPU_write_OAM(addr, val);
        if (addr < 0xFF80) // registers
            return this.bus.CPU_write_IO(addr, val);
        if (addr < 0xFFFF) { // HRAM always accessible
            this.HRAM[addr - 0xFF80] = val;
            return;
        }
        this.bus.CPU_write_IO(addr, val); // 0xFFFF register
    }

    PPU_read(addr) {
        if ((addr < 0x8000) || (addr > 0x9FFF)) return 0xFF;
        return this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset];
    }

    /**
     * @param {GB_cart} cart
     */
    set_cart(cart) {
        this.cart = cart;
        this.ROM = new Uint8Array(cart.header.RAM_size);
        this.ROM.set(cart.ROM);
        this.cartRAM = new Uint8Array(cart.header.RAM_size);
        this.RAM_mask = cart.header.RAM_mask;
        this.has_RAM = this.cartRAM.byteLength > 0;
    }

    /**
     * @param {Uint8Array} inp
     */
    load_BIOS_from_RAM(inp) {
        this.BIOS = new Uint8Array(inp.byteLength);
        this.BIOS.set(inp);
        this.BIOS_big = this.BIOS.byteLength > 256;
    }
}