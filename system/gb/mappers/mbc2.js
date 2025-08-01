"use strict";

class GB_MAPPER_MBC2 {
    /**
     * @param {GB_bus} bus
     * @param {GB_clock} clock
     */
    constructor(clock, bus) {
        this.clock = clock;
        this.bus = bus;

        this.bus.CPU_read = this.CPU_read.bind(this);
        this.bus.CPU_write = this.CPU_write.bind(this);
        this.generic = new GB_GENERIC_MEM(clock, bus);
        this.bus.PPU_read = this.generic.PPU_read.bind(this.generic);

        this.ROM = new Uint8Array(0);

        // This changes on other mappers for banking
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = 16384;

        this.cartRAM = new Uint8Array(512)

        this.bus.mapper = this;
        /**
         * @type {null|GB_cart}
         */
        this.cart = null;

        // MMBC2-specific
        this.num_ROM_banks = 0;
        this.regs = {
            ROMB: 1,
        }
    }

    reset() {
        // This changes on other mappers for banking
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = 16384;
        this.cartRAM_offset = 0;
        this.regs.BANK1 = 1;
        this.regs.BANK2 = 0;
        this.regs.ext_RAM_enable = 0;
        this.regs.cartRAM_bank = 0;
        this.generic.reset();
        this.update_banks();
    }

    CPU_read(addr, val, has_effect=true) {
        let f = this.generic.CPU_read(addr, val, has_effect);
        if (f === null) {
            if (addr < 0x4000) // ROM lo bank
                return this.ROM[addr + this.ROM_bank_lo_offset];
            if (addr < 0x8000) // ROM hi bank
                return this.ROM[(addr & 0x3FFF) + this.ROM_bank_hi_offset];
            if ((addr >= 0xA000) && (addr < 0xC000)) {
                if (!this.regs.ext_RAM_enable)
                    return 0xFF;
                return this.cartRAM[addr & 0x1FF] | 0xF0;
            }
        }
    }

    // Update ROM banks
    update_banks()
    {
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = (this.regs.ROMB % this.num_ROM_banks) * 16384;
    }

    CPU_write(addr, val) {
        if (!this.generic.CPU_write(addr, val)) {
            if (addr < 0x4000) {
                switch (addr & 0x100) {
                    case 0x0000: // RAM write enable
                        this.regs.ext_RAM_enable = +((val & 0x0F) === 0x0A);
                        return;
                    case 0x0100: // ROM bank number
                        val &= 0x0F; // 5 bits
                        if (val === 0) val = 1; // can't be 0
                        this.regs.ROMB = val;
                        this.update_banks();
                        return;
                }
            }
            if ((addr >= 0xA000) && (addr < 0xC000)) { // cart RAM
                if (!this.regs.ext_RAM_enable) return;
                this.cartRAM[addr & 0x1FF] = val & 0x0F;
                return;
            }
        }
    }

    /**
     * @param {GB_cart} cart
     * @param {Uint8Array} BIOS
     */
    set_cart(cart, BIOS) {
        console.log('Loading MBC2')
        this.cart = cart;
        this.ROM = new Uint8Array(cart.header.ROM_size);
        this.ROM.set(cart.ROM);
        this.cartRAM = new Uint8Array(512);
        this.num_ROM_banks = this.ROM.byteLength / 16384;
        this.RAM_mask = 0x1FF;
        console.log('NUMBER OF ROM BANKS', this.num_ROM_banks);
    }
}