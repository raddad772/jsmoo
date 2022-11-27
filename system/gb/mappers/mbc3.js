"use strict";

const RTC_START_TIME = 1000 * 1668634714;

class GB_MAPPER_MBC3 {
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
        this.ROM_bank_offset_hi = 16384;

        this.cartRAM = new Uint8Array(0)
        this.RAM_mask = 0;
        this.has_RAM = false;

        this.bus.mapper = this;
        /**
         * @type {null|GB_cart}
         */
        this.cart = null;

        this.regs = {
            ext_RAM_enable: false,
            ROM_bank_lo: 0,
            ROM_bank_hi: 1,
            RAM_bank: 0,
            last_RTC_latch_write: 0xFF,
            RTC_latched: [0, 0, 0, 0, 0], // addr - 0x08
            RTC_start: Date.now()
        }
        this.RAM_bank_offset = 0;
        this.ROM_bank_offset_lo = 0;
        this.num_ROM_banks = 0;
        this.num_RAM_banks = 0;
    }

    reset() {
        // This changes on other mappers for banking
        this.ROM_bank_offset_hi = 16384;
        this.generic.reset();

        this.regs.ext_RAM_enable = false;
        this.regs.ROM_bank_hi = 1;
        this.regs.ROM_bank_lo = 0;
        this.ROM_bank_offset_lo = 0;
        this.regs.RAM_bank = 0;
        this.RAM_bank_offset = 0;
        this.regs.last_RTC_latch_write = 0xFF;
    }

    latch_RTC() {
        console.log('NO RTC LATCH YET!')
    }

    remap() {
        this.regs.ROM_bank_hi %= this.num_ROM_banks;

        this.ROM_bank_offset_hi = this.regs.ROM_bank_hi * 16384;
        let rb = this.regs.RAM_bank;
        if (this.cart.header.timer_present) {
            if (this.regs.RAM_bank <= 3) this.regs.RAM_bank %= this.num_RAM_banks;
            if (rb <= 3) {
                if (this.has_RAM) this.RAM_bank_offset = rb * 8192;
            } else {
                console.log('SET TO RTC!', rb);
                // RTC registers handled during read/write ops to the area
            }
            if (this.has_RAM) this.RAM_bank_offset = rb * 8192;

        }
        else {
            rb &= 3;
            if (this.has_RAM) this.RAM_bank_offset = rb * 8192;
        }
    }

    CPU_read(addr, val, has_effect=true) {
        let f = this.generic.CPU_read(addr, val, has_effect);
        if (f === null) {
            if (addr < 0x4000) // ROM lo bank
                return this.ROM[(addr & 0x3FFF) + this.ROM_bank_offset_lo];
            if (addr < 0x8000) // ROM hi bank
                return this.ROM[(addr & 0x3FFF) + this.ROM_bank_offset_hi];
            if ((addr >= 0xA000) && (addr < 0xC000)) { // cartRAM if there
                if (!this.has_RAM) return 0xFF;
                if (this.regs.RAM_bank < 4)
                    return this.cartRAM[(addr & 0x1FFF) + this.RAM_bank_offset];
                else if ((this.regs.RAM_bank >= 8) && (this.regs.RAM_bank <= 0x0C) && this.cart.header.timer_present) {
                    return this.regs.last_RTC_latch_write[this.regs.RAM_bank - 8];
                }
                return 0xFF;
            }
            debugger;
            return 0xFF;
        }
        return f;
    }

    CPU_write(addr, val) {
        if (!this.generic.CPU_write(addr, val)) {
            if (addr < 0x8000) { // ROMs {
                switch (addr & 0xE000) {
                    case 0x0000: // RAM and timer enable, write-only
                        // A on, 0 off
                        this.regs.ext_RAM_enable = val === 0x0A;
                        return;
                    case 0x2000: // 16KB hi ROM bank number, 7 bits. 0 = 1, otherwise it's normal
                        val &= 0xFF;
                        if (val === 0) val = 1;
                        this.regs.ROM_bank_hi = val;
                        this.remap();
                        return;
                    case 0x4000: // RAM bank, 0-3. 8-C maps RTC in the same range
                        this.regs.RAM_bank = val & 0x0F;
                        this.remap();
                        return;
                    case 0x6000: // Write 0 then 1 to latch RTC clock data, no effect if no clock
                        if ((this.regs.last_RTC_latch_write === 0) && (val === 1))
                            this.latch_RTC();
                        this.regs.last_RTC_latch_write = val;
                        return;
                }
            }

            if ((addr >= 0xA000) && (addr < 0xC000)) { // cart RAM
                if ((this.has_RAM) && (this.regs.RAM_bank < 4))
                    this.cartRAM[(addr & 0x1FFF) + this.RAM_bank_offset] = val;
                return;
            }
        }
    }

    /**
     * @param {GB_cart} cart
     * @param {Uint8Array} BIOS
     */
    set_cart(cart, BIOS) {
        console.log('Loading MBC3')
        this.cart = cart;
        this.ROM = new Uint8Array(cart.header.ROM_size);
        this.num_ROM_banks = cart.header.ROM_size >>> 14;
        this.ROM.set(cart.ROM);
        this.cartRAM = new Uint8Array(cart.header.RAM_size);
        this.RAM_mask = cart.header.RAM_mask;
        this.has_RAM = this.cartRAM.byteLength > 0;
        this.num_RAM_banks = cart.header.RAM_size / 8192;
    }
}