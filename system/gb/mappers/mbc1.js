"use strict";

class GB_MAPPER_MBC1 {
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

        this.ROM = new Uint8Array(0);

        this.BIOS_big = 0;

        // This changes on other mappers for banking
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = 16384;
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

        // MMBC1-specific
        this.num_ROM_banks = 0;
        this.cartRAM32k = 0;
        this.regs = {
            ROM_bank_lo: 0,
            ROM_bank_hi: 1,
            ext_RAM_enable: 0,
            cartRAM_bank: 0,
            banking_mode: 0,

        }
        this.cartRAM_offset = 0;
    }

    reset() {
        // This changes on other mappers for banking
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = 16384;
        this.cartRAM_offset = 0;
        this.regs.banking_mode = 0;
        this.regs.ext_RAM_enable = 0;
        this.regs.ROM_bank_hi = 1;
        this.regs.ROM_bank_lo = 0;
        this.regs.cartRAM_bank = 0;
        // This changes on CGB
        this.VRAM_bank_offset = 0;
        // This changes on CGB
        this.WRAM_bank_offset = 0x1000;
    }

    CPU_read(addr, val, has_effect=true) {
        if (this.clock.bootROM_enabled) {
            if (addr < 0x100)
                return this.bus.BIOS[addr];
            if (this.BIOS_big && (addr >= 0x200) && (addr < 0x900))
                return this.bus.BIOS[addr - 0x100];
        }
        if (addr < 0x4000) // ROM lo bank
            return this.ROM[addr + this.ROM_bank_lo_offset];
        if (addr < 0x8000) // ROM hi bank
            return this.ROM[(addr & 0x3FFF) + this.ROM_bank_hi_offset];
        if (addr < 0xA000) { // VRAM, banked
            //if (this.clock.CPU_can_VRAM)
                return this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset];
            return 0xFF;
        } // cart RAM if it's there
        if (addr < 0xC000) {
            if (!this.has_RAM) return 0xFF;
            return this.cartRAM[((addr - 0xA000) & this.RAM_mask) + this.cartRAM_offset];
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

    // Update ROM banks
    update_banks() {
        if (this.regs.banking_mode === 1) {
            let rbl = (32 * this.regs.ROM_bank_lo) % this.num_ROM_banks;
            this.ROM_bank_lo_offset = rbl * 16384;
            if (this.cartRAM32k) {
                this.cartRAM_offset = this.regs.cartRAM_bank * 8192;
            } else {
                this.ROM_bank_lo_offset = 0;
                this.cartRAM_offset = 0;
            }

        }
        this.ROM_bank_hi_offset = (this.regs.ROM_bank_hi % this.regs.num_ROM_banks) * 16384;
    }

    CPU_write(addr, val) {
        let rb;
        if (addr < 0x8000) {
            //console.log(hex4(addr), hex2(val));
            switch(addr & 0x2000) {
                case 0x0000: // RAM write enable
                    this.regs.ext_RAM_enable = +((val & 0x0A) === 0x0A);
                    return;
                case 0x2000: // ROM bank number
                    rb = val & 0x1F;
                    if (rb === 0) this.rb = 1;
                    rb %= this.num_ROM_banks;
                    this.regs.ROM_bank_hi = (this.regs.ROM_bank_hi & 0xE0) | rb;
                    this.ROM_bank_hi_offset = this.regs.ROM_bank_hi * 16384;
                    return;
                case 0x4000: // RAM or ROM banks...
                    if (this.num_ROM_banks > 31) {
                        rb = (val & 3) << 5;
                        this.regs.ROM_bank_hi = (this.regs.ROM_bank_hi & 0x1F) | rb;
                    }
                    if (this.regs.banking_mode === 1) {
                        if (this.num_ROM_banks > 31) {
                            this.regs.ROM_bank_lo = val & 3;
                        }
                        if (this.cartRAM32k) {
                            this.regs.cartRAM_bank = val & 3;
                        }
                    }
                    this.update_banks();
                    return;
                case 0x6000: // Control
                    this.regs.banking_mode = val & 1;
                    this.update_banks();
                    return;
            }
        }
        if (addr < 0xA000) { // VRAM
            //if (this.clock.CPU_can_VRAM) {
                this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset] = val;
            /*}
            else {
                //console.log('VRAM WRITE BLOCKED!', this.clock.ly, this.bus.ppu.line_cycle);
                //if (this.clock.ly === 0) dbg.break();
                //console.log('YAR.')
                //this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset] = val;
            }*/
            return;
        }
        if (addr < 0xC000) { // cart RAM
            if ((!this.has_RAM) || (!this.regs.ext_RAM_enable)) return;
            this.cartRAM[((addr - 0xA000) & this.RAM_mask) + this.cartRAM_offset] = val;
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
        console.log('GOT CART', cart);
        this.cart = cart;
        this.BIOS = BIOS;
        this.BIOS_big = this.BIOS.byteLength > 256;
        this.ROM = new Uint8Array(cart.header.ROM_size);
        this.ROM.set(cart.ROM);
        this.cartRAM = new Uint8Array(cart.header.RAM_size);
        this.cartRAM32k = cart.header.RAM_size === 32768;
        this.RAM_mask = cart.header.RAM_mask;
        this.has_RAM = this.cartRAM.byteLength > 0;
        this.num_ROM_banks = this.ROM.byteLength / 16384;
        console.log('NUMBER OF ROM BANKS', this.num_ROM_banks);
    }
}