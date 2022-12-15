"use strict";

class GB_MAPPER_none {
    /**
     * @param {GB_bus} bus
     * @param {GB_clock} clock
     */
    constructor(clock, bus) {
        this.clock = clock;
        this.bus = bus;

        this.bus.CPU_read = this.CPU_read.bind(this);
        this.bus.CPU_write = this.CPU_write.bind(this);

        this.ROM = new Uint8Array(0);

        this.BIOS_big = 0;

        // This changes on other mappers for banking
        this.ROM_bank_offset = 16384;

        this.generic = new GB_GENERIC_MEM(clock, bus);
        this.bus.PPU_read = this.generic.PPU_read.bind(this.generic);

        this.cartRAM = new Uint8Array(0)
        this.RAM_mask = 0;
        this.has_RAM = false;

        this.bus.mapper = this;
        /**
         * @type {null|GB_cart}
         */
        this.cart = null;
    }

    reset() {
        // This changes on other mappers for banking
        this.ROM_bank_offset = 16384;
        this.generic.reset()
    }

    CPU_read(addr, val, has_effect=true) {
        let f = this.generic.CPU_read(addr, val, has_effect);
        if (f === null) {
            if (addr < 0x4000) // ROM lo bank
                return this.ROM[addr];
            if (addr < 0x8000) // ROM hi bank
                return this.ROM[(addr & 0x3FFF) + this.ROM_bank_offset];
            if ((addr >= 0xA000) && (addr < 0xC000)) { // // cart RAM if it's there
                if (!this.has_RAM) return 0xFF;
                return this.cartRAM[(addr - 0xA000) & this.RAM_mask];
            }
            debugger;
            return 0xFF;
        }
        return f;
    }

    CPU_write(addr, val) {
        if (!this.generic.CPU_write(addr, val)) {
           if ((addr >= 0xA000) && (addr < 0xC000)) { // cart RAM
                if (!this.has_RAM) return;
                this.cartRAM[(addr - 0xA000) & this.RAM_mask] = val;
                return;
            }
        }
    }

    /**
     * @param {GB_cart} cart
     * @param {Uint8Array} BIOS
     */
    set_cart(cart, BIOS) {
        this.cart = cart;
        this.generic.set_cart(cart, BIOS);
        this.ROM = new Uint8Array(cart.header.ROM_size);
        this.ROM.set(cart.ROM);
        this.cartRAM = new Uint8Array(cart.header.RAM_size);
        this.RAM_mask = cart.header.RAM_mask;
        this.has_RAM = this.cartRAM.byteLength > 0;
    }
}