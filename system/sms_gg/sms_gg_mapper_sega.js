"use strict";

class SMSGG_mapper_sega {
    constructor(variant) {
        this.ROM = new Uint8Array(1);
        this.RAM = new Uint8Array(16384)
        this.variant = variant;

        /**
         * @type {Uint8Array|null}
         */
        this.BIOS = null;

        this.enable_1k_BIOS = 0;
        this.enable_8k_BIOS = 0;
        this.enable_RAM = 1;
        this.enable_cart = (this.variant === SMSGG_variants.GG) ? 1 : 0;

        this.cart = {
            ram_80_enabled: 0,
            ram_C0_enabled: 0,

            num_banks: 0,
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
        if (this.BIOS === null) this.enable_bios = false;
    }

    bios_read(addr, val) {
        if (this.BIOS === null) return val;
        if (addr < 0x400) return this.BIOS[addr];
        if (addr < 0x4000) return this.BIOS[this.bios.rom_00_bank | (addr & 0x3FFF)];
        if (addr < 0x8000) return this.BIOS[this.bios.rom_40_bank | (addr & 0x3FFF)];
        if (addr < 0xC000) return this.BIOS[this.bios.rom_80_bank | (addr & 0x3FFF)];
    }

    read(addr, val, has_effect) {
        addr &= 0xFFFF;
        if ((addr >= 0xC000) && (this.enable_RAM)) val = this.RAM[addr & 0x1FFF];
        if ((this.variant !== SMSGG_variants.GG) && this.enable_bios) val = this.bios_read(addr, val);
        if ((this.variant !== SMSGG_variants.GG) && this.enable_cart) val = this.cart_read(addr, val);
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
                this.bios.rom_80_bank = (val % this.bios.num_banks) << 14;
                return;
        }
    }

    cart_read(addr, val) {
        if (addr < 0x400) return this.ROM[addr];
        if (addr < 0x4000) return this.ROM[this.cart.rom_00_bank | (addr & 0x3FFF)];
        if (addr < 0x8000) return this.ROM[this.cart.rom_40_bank | (addr & 0x3FFF)];
        if (addr < 0xC000) return this.ROM[this.cart.rom_80_bank | (addr & 0x3FFF)];
        return val;
    }

    cart_write(addr, val) {
        switch(addr) {
            case 0xFFFC: // various stuff
                //this.cart.ram_
                this.cart.ram_C0_enabled = (val & 0x10) >>> 4;
                this.cart.ram_80_enabled = (val & 0x08) >>> 3;
                return;
            case 0xFFFD: // ROM 0x0400-0x3FFF
                this.cart.rom_00_bank = (val % this.cart.num_banks) << 14;
                return;
            case 0xFFFE: // ROM 0x4000-0x7FFF
                this.cart.rom_40_bank = (val % this.cart.num_banks) << 14;
                return;
            case 0xFFFF: // ROM 0x8000-0xBFFF
                this.cart.rom_80_bank = (val % this.cart.num_banks) << 14;
                return;
        }
    }


    write(addr, val) {
        addr &= 0xFFFF;
        /*if (addr < 0x8000) return;
        if (addr < 0xC000) { // 8000-C000
            if (this.cart.ram_80_enabled)
                this.RAM[(addr & 0x1FFF) | 0x2000] = val; // Cart RAM is only 8KB, so we mirror
            return;
        }
        if (addr < 0xE000) { // C000-E000
            if (this.cart.ram_C0_enabled)
                this.RAM[(addr & 0x1FFF) | 0x2000] = val; // Cart RAM is only 8KB, so we mirror
            else
                this.RAM[addr - 0xC000] = val; // Write to real RAM
            return;
        }
        this.RAM[addr - 0xE000] = val;
        if (addr < 0xFFFC) return;

        console.log('MAPPER REGS', hex4(addr), hex2(val));

        switch(addr) {
            case 0xFFFC: // RAM mapping and misc. functions
                this.cart.ram_C0_enabled = (val & 0x10) >>> 4;
                this.cart.ram_80_enabled = (val & 0x08) >>> 3;
                this.cart.rom_shift = val & 3; // this is ignored
                if (val & 4) console.log('ALERT! add RAM bank swapping!');
                return;
            case 0xFFFD: // ROM 0x0400-0x3FFF
                this.cart.rom_00_bank = (val % this.cart.num_banks) << 14;
                return;
            case 0xFFFE: // ROM 0x4000-0x7FFF
                this.cart.rom_40_bank = (val % this.cart.num_banks) << 14;
                return;
            case 0xFFFF: // ROM 0x8000-0xBFFF
                this.cart.rom_80_bank = (val % this.cart.num_banks) << 14;
                return;
        }*/
        /*if(address >= 0xc000 && bus.ramEnable) ram.write(address, data);
        if(Device::MasterSystem() && bus.biosEnable) bios.write(address, data);
        if(Device::GameGear() && bus.biosEnable && address < 0x400) bios.write(address, data);
        if(Device::MasterSystem() && bus.cartridgeEnable) cartridge.write(address, data);
        if(Device::GameGear() && (address >= 0x400 || !bus.biosEnable)) cartridge.write(address, data);*/
        if ((addr >= 0xC000) && this.enable_RAM) this.RAM[addr & 0x1FFF] = val;
        if ((this.variant !== SMSGG_variants.GG) && this.enable_bios) this.bios_write(addr, val);
        if ((this.variant !== SMSGG_variants.GG) && this.enable_cart) this.cart_write(addr, val);
    }


    load_BIOS_from_RAM(inp) {
        this.BIOS = new Uint8Array(inp.byteLength);
        this.BIOS.set(new Uint8Array(inp));
        //this.enable_1k_BIOS = 1;
        this.enable_bios = 1;
        //if (this.BIOS.byteLength > 1024) this.enable_8k_BIOS = 1;
        this.bios.num_banks = (this.BIOS.byteLength >>> 14);
        if (this.bios.num_banks === 0) this.bios.num_banks = 1;
        console.log('Loaded BIOS of size', this.BIOS.byteLength);
    }

    load_ROM_from_RAM(inbuf) {
        let ibuf = new Uint8Array(inbuf);
        this.ROM = new Uint8Array(ibuf.byteLength);
        console.log('LOADING CART...', this.ROM.byteLength, 'bytes!');
        this.ROM.set(ibuf);
        this.cart.num_banks = Math.ceil((this.ROM.byteLength / 0x4000));
        if (this.cart.num_banks === 0) this.cart.num_banks = 1;
    }
}
