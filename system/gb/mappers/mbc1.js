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
        this.bus.PPU_read = this.PPU_read.bind(this);

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
        // This changes on CGB
        this.VRAM_bank_offset = 0;
        // This changes on CGB
        this.WRAM_bank_offset = 0x1000;
        this.update_banks();
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
            if ((!this.has_RAM) || (!this.regs.ext_RAM_enable))
                return 0xFF;
            return this.cartRAM[((addr - 0xA000) & this.RAM_mask) + this.cartRAM_offset];
        }
        // Adjust address for mirroring
        if ((addr > 0xE000) && (addr < 0xFE00)) return 0xFF; //addr -= 0x2000;
        if (addr < 0xD000) // WRAM lo bank
            return this.WRAM[addr & 0xFFF];
        if (addr < 0xE000) // WRAM hi bank
            return this.WRAM[(addr & 0xFFF) + this.WRAM_bank_offset]
        if (addr < 0xFF00) // OAM
            return this.bus.CPU_read_OAM(addr, val, has_effect);
        if (addr < 0xFF80) // registers
            return this.bus.CPU_read_IO(addr, val, has_effect);
        if (addr < 0xFFFF) {// HRAM always accessible
            let v = this.HRAM[addr - 0xFF80];
            //console.log('READ', hex4(addr), hex2(v));
            return v;
        }
        return this.bus.CPU_read_IO(addr, val, has_effect); // 0xFFFF register
    }

    // Update ROM banks
    update_banks() {
        let rb;
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
        let rb;
        if (addr < 0x8000) {
            switch(addr & 0xE000) {
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
        if ((addr > 0xE000) && (addr < 0xFE00)) return; //addr -= 0x2000;

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
            //console.log('WRITE', hex4(addr), hex2(val))
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
        this.num_RAM_banks = (cart.header.RAM_size / 8192);
        console.log('Cart RAM banks', this.num_RAM_banks);
        this.RAM_mask = cart.header.RAM_mask;
        console.log('RAM mask', hex4(this.RAM_mask));
        this.has_RAM = this.cartRAM.byteLength > 0;
        this.num_ROM_banks = this.ROM.byteLength / 16384;
        console.log('NUMBER OF ROM BANKS', this.num_ROM_banks);
    }
}