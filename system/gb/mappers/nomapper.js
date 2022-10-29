"use strict";

class GB_MAPPER_none {
    /**
     * @param {GB_cart} cart
     * @param {GB_bus} bus
     * @param {GB_clock} clock
     */
    constructor(cart, clock, bus) {
        this.clock = clock;
        this.bus = bus;

        this.bus.CPU_read = this.CPU_read.bind(this);
        this.bus.CPU_write = this.CPU_write.bind(this);

        this.ROM = new Uint8Array(0);
        this.cartRAM = new Uint8Array(0)
        this.WRAM = new Uint8Array(8192);
        this.HRAM = new Uint8Array(128);
        this.RAM_mask = 0;
        this.has_RAM = false;
        this.VRAM = new Uint8Array(16384);
        this.VRAM_offset = 0; // 8k offset for bank 1 in CGB

        this.bus.mapper = this;

        this.cart = cart;
        this.set_cart(cart);
    }

    CPU_read(addr, val, has_effect=true) {
        if (addr < 0x8000)
            return this.ROM[addr];
        if (addr < 0xA000) {
            if (this.clock.CPU_can_VRAM)
                return this.VRAM[addr - 0x8000];
            return 0xFF;
        }
        if (addr < 0xC000) {
            if (!this.has_RAM) return;
            return this.cartRAM[(addr - 0xA000) & this.RAM_mask];
        }
        if (addr < 0xFE00)
            return this.WRAM[(addr - 0xC000) & 0x1FFF];
        if (addr < 0xFF00)
            return this.bus.CPU_read_OAM(addr, val, has_effect);
        if (addr < 0xFF80)
            return this.bus.CPU_read_IO(addr, val, has_effect);
        if (addr < 0xFFFF)
            return this.HRAM[addr - 0xFF80];
        return this.bus.CPU_read_IO(addr, val, has_effect);
    }

    CPU_write(addr, val) {
        if (addr < 0x8000) // ROM
            return;
        if (addr < 0xA000) { // VRAM
            if (this.clock.CPU_can_VRAM)
                this.VRAM[addr - 0x8000] = val;
            return;
        }
        if (addr < 0xC000) { // cart RAM
            if (!this.has_RAM) return;
            this.cartRAM[(addr - 0xA000) & this.RAM_mask] = val;
            return;
        }
        if (addr < 0xFE00) {
            this.WRAM[(addr - 0xC000) & 0x1FFF] = val;
        }
        if (addr < 0xFF00)
            return this.bus.CPU_write_OAM(addr, val);
        if (addr < 0xFF80)
            return this.bus.CPU_write_IO(addr, val);
        if (addr < 0xFFFF) {
            this.HRAM[addr - 0xFF80] = val;
            return;
        }
        this.bus.CPU_write_IO(addr, val);
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
}