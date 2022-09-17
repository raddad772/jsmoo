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

        this.num_banks = 0;

        this.enable_1k_BIOS = 0;
        this.enable_8k_BIOS = 0;
        this.enable_cart = (this.variant === SMSGG_variants.GG) ? 1 : 0;

        this.io = {
            ram_80_enabled: 0,
            ram_C0_enabled: 0,
            rom_shift: 0,

            rom_00_bank: 0,
            rom_40_bank: 0x4000,
            rom_80_bank: 0x8000
        }
    }

    reset() {
        this.io.rom_00_bank = 0;
        this.io.rom_40_bank = 0x4000;
        this.io.rom_80_bank = 0x8000;
        this.io.ram_80_enabled = 0;
        this.io.ram_C0_enabled = false;
        this.enable_cart = (this.variant === SMSGG_variants.GG) ? 1 : 0;
    }

    //  0 slot 0
    // 40 slot 1
    // 80 ROM slot 2/RAM slot
    // C0 sytem RAM
    // E0 system RAM mirror

    set_bios(to) {
        if (to === 0) {
            this.enable_1k_BIOS = this.enable_8k_BIOS = 0;
        } else {
            if (this.BIOS === null) return;
            if (this.BIOS.byteLength > 1024) this.enable_8k_BIOS = 1;
            this.enable_1k_BIOS = 1;
        }
    }

    read(addr, val, has_effect) {
        addr &= 0xFFFF;
        if (addr < 0x400) {
            if (this.enable_1k_BIOS || this.enable_8k_BIOS) return this.BIOS[addr];
            return this.ROM[addr];
        } // 0000-03FF is not paged
        if ((this.enable_8k_BIOS) && (addr < 0x2000)) return this.BIOS[addr];
        if ((!this.enable_cart) && (addr < 0xC000)) return val; // No cartridge enabled
        if (addr < 0x4000) return this.ROM[addr + this.io.rom_00_bank]; // 0400-3FFF
        if (addr < 0x8000) return this.ROM[(addr - 0x4000) + this.io.rom_40_bank]; // 4000-7FFF
        if (addr < 0xC000) { // 8000-BFFF
            if (this.io.ram_80_enabled)
                return this.RAM[(addr & 0x1FFF) | 0x2000];
            return this.ROM[(addr - 0x8000) + this.io.rom_80_bank];
        }
        // C000-FFFF
        if (this.io.ram_C0_enabled)
            return this.RAM[(addr & 0x1FFF) | 0x2000];

        return this.RAM[addr - 0xC000];
    }

    write(addr, val) {
        addr &= 0xFFFF;
        if (addr < 0x8000) return;
        if (addr < 0xC000) { // 8000-C000
            if (this.io.ram_80_enabled)
                this.RAM[(addr & 0x1FFF) | 0x2000] = val; // Cart RAM is only 8KB, so we mirror
            return;
        }
        if (addr < 0xE000) { // C000-E000
            if (this.io.ram_C0_enabled)
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
                this.io.ram_C0_enabled = (val & 0x10) >>> 4;
                this.io.ram_80_enabled = (val & 0x08) >>> 3;
                this.io.rom_shift = val & 3; // this is ignored
                if (val & 4) console.log('ALERT! add RAM bank swapping!');
                return;
            case 0xFFFD: // ROM 0x0400-0x3FFF
                this.io.rom_00_bank = (val % this.num_banks) * 0x4000;
                return;
            case 0xFFFE: // ROM 0x4000-0x7FFF
                this.io.rom_40_bank = (val % this.num_banks) * 0x4000;
                return;
            case 0xFFFF: // ROM 0x8000-0xBFFF
                this.io.rom_80_bank = (val % this.num_banks) * 0x4000;
                return;
        }
    }

    load_BIOS_from_RAM(inp) {
        this.BIOS = new Uint8Array(inp.byteLength);
        this.BIOS.set(new Uint8Array(inp));
        this.enable_1k_BIOS = 1;
        if (this.BIOS.byteLength > 1024) this.enable_8k_BIOS = 1;
        console.log('Loaded BIOS of size', this.BIOS.byteLength);
    }

    load_ROM_from_RAM(inbuf) {
        let ibuf = new Uint8Array(inbuf);
        this.ROM = new Uint8Array(ibuf.byteLength);
        console.log('LOADING CART...', this.ROM.byteLength, 'bytes!');
        this.ROM.set(ibuf);
        this.num_banks = Math.ceil((this.ROM.byteLength / 0x4000));
    }
}
