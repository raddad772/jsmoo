"use strict";

class GB_MAPPER_MBC1 {
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

        this.cartRAM = new Uint8Array(0)
        this.RAM_mask = 0;
        this.has_RAM = false;

        this.bus.mapper = this;
        /**
         * @type {null|GB_cart}
         */
        this.cart = null;

        // MMBC1-specific
        this.num_ROM_banks = 0;
        this.num_RAM_banks = 1;
        this.regs = {
            banking_mode: 0,
            BANK1: 1,
            BANK2: 0
        }
        this.cartRAM_offset = 0;
    }

    reset() {
        // This changes on other mappers for banking
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = 16384;
        this.cartRAM_offset = 0;
        this.regs.BANK1 = 1;
        this.regs.BANK2 = 0;
        this.regs.banking_mode = 0;
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
                if ((!this.has_RAM) || (!this.regs.ext_RAM_enable))
                    return 0xFF;
                return this.cartRAM[((addr - 0xA000) & this.RAM_mask) + this.cartRAM_offset];
            }
            debugger;
            return 0xFF;
        }
        return f;
    }

    // Update ROM banks
    update_banks() {
        if (this.regs.banking_mode === 0) {
            // Mode 0, easy-mode
            this.ROM_bank_lo_offset = 0;
            this.cartRAM_offset = 0;
        } else {
            // Mode 1, hard-mode!
            this.ROM_bank_lo_offset = ((32 * this.regs.BANK2) % this.num_ROM_banks) * 16384;
            this.cartRAM_offset = (this.regs.BANK2 % this.num_RAM_banks) * 8192;
        }
        this.ROM_bank_hi_offset = (((this.regs.BANK2 << 5) | this.regs.BANK1) % this.num_ROM_banks) * 16384;
    }

    CPU_write(addr, val) {
        if (!this.generic.CPU_write(addr, val)) {
            if (addr < 0x8000) {
                switch (addr & 0xE000) {
                    case 0x0000: // RAM write enable
                        this.regs.ext_RAM_enable = +((val & 0x0F) === 0x0A);
                        return;
                    case 0x2000: // ROM bank number
                        val &= 0x1F; // 5 bits
                        if (val === 0) val = 1; // can't be 0
                        this.regs.BANK1 = val;
                        this.update_banks();
                        return;
                    case 0x4000: // RAM or ROM banks...
                        this.regs.BANK2 = val & 3;
                        this.update_banks();
                        return;
                    case 0x6000: // Control
                        this.regs.banking_mode = val & 1;
                        this.update_banks();
                        return;
                }
            }
            if ((addr >= 0xA000) && (addr < 0xC000)) { // cart RAM
                if (this.has_RAM && this.regs.ext_RAM_enable)
                    this.cartRAM[((addr - 0xA000) & this.RAM_mask) + this.cartRAM_offset] = val;
                return;
            }
        }
    }

    /**
     * @param {GB_cart} cart
     * @param {Uint8Array} BIOS
     */
    set_cart(cart, BIOS) {
        console.log('Loading MBC1 cart')
        this.cart = cart;
        this.ROM = new Uint8Array(cart.header.ROM_size);
        this.ROM.set(cart.ROM);
        this.cartRAM = new Uint8Array(cart.header.RAM_size);
        this.num_RAM_banks = (cart.header.RAM_size / 8192);
        console.log('Cart RAM banks', this.num_RAM_banks);
        this.RAM_mask = cart.header.RAM_mask;
        console.log('RAM mask', hex4(this.RAM_mask));
        this.has_RAM = this.cartRAM.byteLength > 0;
        this.num_ROM_banks = this.ROM.byteLength / 16384;
        console.log('NUMBER OF ROM BANKS', this.num_ROM_banks);
    }
}