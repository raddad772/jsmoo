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
        this.bus.PPU_read = this.PPU_read.bind(this);

        this.ROM = new Uint8Array(0);

        this.BIOS_big = 0;

        // This changes on other mappers for banking
        this.ROM_bank_offset_hi = 16384;
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
        /**
         * @type {null|GB_cart}
         */
        this.cart = null;

        this.BIOS = new Uint8Array(0);

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
        // This changes on CGB
        this.VRAM_bank_offset = 0;
        // This changes on CGB
        this.WRAM_bank_offset = 0x1000;


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
        if (this.clock.bootROM_enabled) {
            if (addr < 0x100) {
                let r = this.bus.BIOS[addr];
                return r;
            }
            if (this.BIOS_big && (addr >= 0x200) && (addr < 0x900))
                return this.bus.BIOS[addr - 0x100];
        }
        if (addr < 0x4000) // ROM lo bank
            return this.ROM[(addr & 0x3FFF) + this.ROM_bank_offset_lo];
        if (addr < 0x8000) // ROM hi bank
            return this.ROM[(addr & 0x3FFF) + this.ROM_bank_offset_hi];
        if (addr < 0xA000) { // VRAM, banked
            //if (this.clock.CPU_can_VRAM)
                return this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset];
            return 0xFF;
        } // cart RAM if it's there
        if (addr < 0xC000) {
            if (!this.has_RAM) return 0xFF;
            if (this.regs.RAM_bank < 4)
                return this.cartRAM[(addr & 0x1FFF) + this.RAM_bank_offset];
            else if ((this.regs.RAM_bank >= 8) && (this.regs.RAM_bank <= 0x0C) && this.cart.header.timer_present) {
                return this.regs.last_RTC_latch_write[this.regs.RAM_bank - 8];
            }
            return 0xFF;
        }
        // Adjust address for mirroring
        if ((addr > 0xE000) && (addr < 0xFE00)) addr -= 0x2000;
        if (addr < 0xD000) // WRAM lo bank
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
        if (addr < 0x8000) { // ROMs {
            switch(addr & 0xE000) {
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

        if (addr < 0xA000) { // VRAM
            //if (this.clock.CPU_can_VRAM) {
                this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset] = val;
            /*}
            else {
                console.log('VRAM WRITE BLOCKED!', this.bus.ppu.enabled, this.bus.ppu.io.bg_window_enable, this.clock.ly, this.bus.ppu.line_cycle);
                //if (this.clock.ly === 0) dbg.break();
                //console.log('YAR.')
                //this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset] = val;
            }*/
            return;
        }
        if (addr < 0xC000) { // cart RAM
            if (!this.has_RAM) return;
            if (this.regs.RAM_bank < 4) {
                this.cartRAM[(addr & 0x1FFF) + this.RAM_bank_offset] = val;
                return;
            }
            return;
        }
        // adjust address for mirroring
        if ((addr > 0xE000) && (addr < 0xFE00)) addr -= 0x2000;

        if (addr < 0xD000) { // WRAM lo bank
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
     * @param {Uint8Array} BIOS
     */
    set_cart(cart, BIOS) {
        this.cart = cart;
        this.BIOS = BIOS;
        this.BIOS_big = this.BIOS.byteLength > 256;
        this.ROM = new Uint8Array(cart.header.ROM_size);
        this.num_ROM_banks = cart.header.ROM_size >>> 14;
        this.ROM.set(cart.ROM);
        this.cartRAM = new Uint8Array(cart.header.RAM_size);
        this.RAM_mask = cart.header.RAM_mask;
        this.has_RAM = this.cartRAM.byteLength > 0;
        this.num_RAM_banks = cart.header.RAM_size / 8192;
        console.log('RAM amount', cart.header.RAM_size, this.RAM_mask, this.has_RAM, this.RAM_bank_offset);
    }
}