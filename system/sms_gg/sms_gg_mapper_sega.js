"use strict";

const SER_SMSGG_mapper_sega = [
    'ROM', 'RAM', 'variant', 'BIOS',
    'enable_RAM', 'enable_bios', 'enable_cart',
    'cart', 'bios'
]
class SMSGG_mapper_sega {
    constructor(variant) {
        this.ROM = new Uint8Array(1);
        this.RAM = new Uint8Array(16384)
        this.variant = variant;

        /**
         * @type {Uint8Array|null}
         */
        this.BIOS = null;

        this.enable_RAM = 1;
        this.enable_bios = (this.variant === SMSGG_variants.GG) ? 0 : 1;
        this.enable_cart = (this.variant === SMSGG_variants.GG) ? 1 : 0;

        this.cart = {
            ram_80_enabled: 0,
            ram_C0_enabled: 0,

            num_ROM_banks: 0,
            rom_shift: 0,

            rom_bank_upper: 0,

            rom_00_bank: 0,
            rom_40_bank: 0x4000,
            rom_80_bank: 0x8000
        }

        this.bios = {
            rom_00_bank: 0,
            rom_40_bank: 0x4000,
            rom_80_bank: 0x8000,
            num_banks: 1
        }
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_SMSGG_mapper_sega);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG SMSGG_mapper_sega version');
            return false;
        }
        return deserialization_helper(this, from, SER_SMSGG_mapper_sega);
    }

    reset() {
        this.bios.rom_00_bank = 0;
        this.bios.rom_40_bank = 0x4000;
        this.bios.rom_80_bank = 0x8000;
        this.cart.rom_00_bank = 0;
        this.cart.rom_40_bank = 0x4000;
        this.cart.rom_80_bank = 0x8000;
        this.cart.ram_80_enabled = 0;
        this.cart.ram_C0_enabled = false;
        this.enable_cart = (this.variant === SMSGG_variants.GG) ? 1 : 0;
        for (let i = 0; i < this.RAM.byteLength; i++) {
            this.RAM[i] = 0;
        }
    }

    //  0 slot 0
    // 40 slot 1
    // 80 ROM slot 2/RAM slot
    // C0 sytem RAM
    // E0 system RAM mirror

    set_bios(to) {
        /*if (!to) {
            this.enable_1k_BIOS = this.enable_8k_BIOS = 0;
        } else {
            if (this.BIOS === null) return;
            if (this.BIOS.byteLength > 1024) this.enable_8k_BIOS = 1;
            this.enable_1k_BIOS = 1;
        }*/
        this.enable_bios = to;
        if (this.BIOS === null) this.enable_bios = 0;
    }

    bios_read(addr, val) {
        if (this.BIOS === null) return val;
        if (addr < 0x400) return this.BIOS[addr];
        if (addr < 0x4000) return this.BIOS[this.bios.rom_00_bank | (addr & 0x3FFF)];
        if (addr < 0x8000) return this.BIOS[this.bios.rom_40_bank | (addr & 0x3FFF)];
        if (addr < 0xC000) return this.BIOS[this.bios.rom_80_bank | (addr & 0x3FFF)];
        return val;
    }

    ram_read(addr, val) {
        return this.RAM[addr & 0x1FFF];
    }

    read(addr, val, has_effect) {
        addr &= 0xFFFF;
        if ((addr >= 0xC000) && (this.enable_RAM)) val = this.ram_read(addr, val);
        if ((this.variant !== SMSGG_variants.GG) && this.enable_bios) val = this.bios_read(addr, val);
        if (this.enable_cart) val = this.cart_read(addr, val);
        return val;
    }

    bios_write(addr, val) {
        switch(addr) {
            case 0xFFFD: // ROM 0x0400-0x3FFF
                this.bios.rom_00_bank = (val % this.bios.num_banks) << 14;
                return;
            case 0xFFFE: // ROM 0x4000-0x7FFF
                this.bios.rom_40_bank = (val % this.bios.num_banks) << 14;
                return;
            case 0xFFFF: // ROM 0x8000-0xBFFF
                //console.log('BIOS PAGE', val % this.bios.num_banks, hex4((val % this.bios.num_banks) << 14));
                this.bios.rom_80_bank = (val % this.bios.num_banks) << 14;
                return;
        }
    }

    cart_read(addr, val) {
        // DBG VER
        let r = null;
        if (addr < 0x400) r = this.ROM[addr];
        else if (addr < 0x4000) r = this.ROM[this.cart.rom_00_bank | (addr & 0x3FFF)];
        else if (addr < 0x8000) r = this.ROM[this.cart.rom_40_bank | (addr & 0x3FFF)];
        else if (addr < 0xC000) r = this.ROM[this.cart.rom_80_bank | (addr & 0x3FFF)];
        if (r !== null) {
            //console.log('ROM READ', hex4(addr), hex2(r))
            //if (addr === 0x7FEF) dbg.break();
            return r;
        }

        // REAL VER
        /*if (addr < 0x400) return this.ROM[addr];
        if (addr < 0x4000) return this.ROM[this.cart.rom_00_bank | (addr & 0x3FFF)];
        if (addr < 0x8000) return this.ROM[this.cart.rom_40_bank | (addr & 0x3FFF)];
        if (addr < 0xC000) return this.ROM[this.cart.rom_80_bank | (addr & 0x3FFF)];*/
        return val;
    }

    cart_write(addr, val) {
        //if (addr >= 0xFFFC) console.log(hex4(addr), hex2(val));
        switch(addr) {
            case 0xFFFC: // various stuff
                //this.cart.ram_
                this.cart.ram_C0_enabled = (val & 0x10) >>> 4;
                this.cart.ram_80_enabled = (val & 0x08) >>> 3;
                return;
            case 0xFFFD: // ROM 0x0400-0x3FFF
                //console.log('ROM CART PAGE0', val % this.cart.num_ROM_banks);
                this.cart.rom_00_bank = (val % this.cart.num_ROM_banks) << 14;
                return;
            case 0xFFFE: // ROM 0x4000-0x7FFF
                this.cart.rom_40_bank = (val % this.cart.num_ROM_banks) << 14;
                return;
            case 0xFFFF: // ROM 0x8000-0xBFFF
                //console.log('CART PAGE', this.cpu.trace_cycles, val % this.cart.num_ROM_banks, hex4((val % this.cart.num_ROM_banks) << 14));
                //if (val === 15) dbg.break();
                this.cart.rom_80_bank = (val % this.cart.num_ROM_banks) << 14;
                return;
        }
    }

    ram_write(addr, val) {
        this.RAM[addr & 0x1FFF] = val;
    }

    write(addr, val) {
        addr &= 0xFFFF;
        if ((addr >= 0xC000) && this.enable_RAM) this.ram_write(addr, val);
        if ((this.variant !== SMSGG_variants.GG) && this.enable_bios) this.bios_write(addr, val);
        if ((this.variant === SMSGG_variants.GG) && this.enable_bios && (addr < 0x400)) this.bios_write(addr, val);
        if ((this.variant !== SMSGG_variants.GG) && this.enable_cart) this.cart_write(addr, val);
        if ((this.variant === SMSGG_variants.GG) && ((addr >= 0x400) || (!this.enable_bios))) this.cart_write(addr, val);
    }


    load_BIOS_from_RAM(inp) {
        this.BIOS = new Uint8Array(inp.byteLength);
        this.BIOS.set(new Uint8Array(inp));
        this.enable_bios = 1;
        this.bios.num_banks = (this.BIOS.byteLength >>> 14);
        if (this.bios.num_banks === 0) this.bios.num_banks = 1;
        console.log('Loaded BIOS of size', this.BIOS.byteLength);
    }

    load_ROM_from_RAM(name, inbuf) {
        let ibuf = new Uint8Array(inbuf);
        this.ROM = new Uint8Array(ibuf.byteLength);
        console.log('LOADING CART...', this.ROM.byteLength, 'bytes!');
        this.ROM.set(ibuf);
        this.cart.num_ROM_banks = Math.ceil((this.ROM.byteLength / 0x4000));
        if (this.cart.num_ROM_banks === 0) this.cart.num_ROM_banks = 1;
        console.log('num ROM banks ' + this.cart.num_ROM_banks.toString())
    }
}
