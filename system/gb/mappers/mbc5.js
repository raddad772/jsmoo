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
            return v;
        }
        return this.bus.CPU_read_IO(addr, val, has_effect); // 0xFFFF register
    }

    // Update ROM banks
    update_banks() {
        this.cartRAM_offset = (this.regs.RAMB % this.num_RAM_banks) * 8192;
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = (((this.regs.ROMB1 << 8) | this.regs.ROMB0) % this.num_ROM_banks) * 16384;
    }

    CPU_write(addr, val) {
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
            if (addr === 0xD6FE) {
                console.log('W', hex4(addr), hex2(val));
            }
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
        console.log('MBC5!');
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