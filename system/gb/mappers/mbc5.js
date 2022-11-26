"use strict";

class GB_MAPPER_MBC5 {
    /**
     * @param {GB_cart} cart
     * @param {bios_t} bios
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
        this.num_RAM_banks = 0;
        this.regs = {
            ROMB0: 0,
            ROMB1: 0,
            RAMB: 0,
        }
        this.cartRAM_offset = 0;
    }

    reset() {
        // This changes on other mappers for banking
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = 16384;
        this.cartRAM_offset = 0;
        this.regs.ROMB0 = 1;
        this.regs.ROMB1 = 0;
        this.regs.ext_RAM_enable = 0;
        this.regs.RAMB = 0;
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
            if ((addr >= 0xA000) && (addr < 0xC000)) { // cart RAM if it's there
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
        this.cartRAM_offset = (this.regs.RAMB % this.num_RAM_banks) * 8192;
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = (((this.regs.ROMB1 << 8) | this.regs.ROMB0) % this.num_ROM_banks) * 16384;
    }

    CPU_write(addr, val) {
        if (!this.generic.CPU_write(addr, val)) {
            if (addr < 0x8000) {
                switch(addr & 0xF000) {
                    case 0x0000: // RAM write enable
                    case 0x1000:
                        this.regs.ext_RAM_enable = +(val === 0x0A);
                        return;
                    case 0x2000: // ROM bank number0
                        this.regs.ROMB0 = val;
                        this.update_banks();
                        return;
                    case 0x3000: // ROM bank number1, 1 bit
                        this.regs.ROMB1 = val & 1;
                        this.update_banks();
                        return;
                    case 0x4000: // RAMB bank number, 4 bits
                    case 0x5000:
                        if (this.cart.header.rumble_present)
                            this.regs.RAMB = val & 0x07;
                        else
                            this.regs.RAMB = val & 0x0F;
                        this.update_banks();
                        return;
                }
            }
            if ((addr >= 0xA000) && (addr < 0xC000)) { // cart RAM
                if ((!this.has_RAM) || (!this.regs.ext_RAM_enable)) return;
                this.cartRAM[((addr - 0xA000) & this.RAM_mask) + this.cartRAM_offset] = val;
            }
        }

    }

    /**
     * @param {GB_cart} cart
     * @param {Uint8Array} BIOS
     */
    set_cart(cart, BIOS) {
        console.log('MBC5!');
        this.cart = cart;
        this.ROM = new Uint8Array(cart.header.ROM_size);
        this.ROM.set(cart.ROM);
        this.cartRAM = new Uint8Array(cart.header.RAM_size);
        this.num_RAM_banks = (cart.header.RAM_size / 8192);
        this.RAM_mask = cart.header.RAM_mask;
        this.has_RAM = this.cartRAM.byteLength > 0;
        this.num_ROM_banks = this.ROM.byteLength / 16384;
    }
}