import {SMSGG_variants} from "./sms_gg";
import {heapArray8} from "../nes/nes_cart";

class SMSGG_mapper_sega_cart {
    ram_80_enabled: u32 = 0
    ram_C0_enabled: u32 = 0

    num_ROM_banks: u32 = 0

    rom_00_bank: u32 = 0
    rom_40_bank: u32 = 0x4000
    rom_80_bank: u32 = 0x8000
}

class SMSGG_mapper_sega_bios {
    rom_00_bank: u32 = 0
    rom_40_bank: u32 = 0x4000
    rom_80_bank: u32 = 0x8000
    num_banks: u32 = 1
}

export class SMSGG_mapper_sega {
    variant: SMSGG_variants

    ROM: StaticArray<u8> = new StaticArray<u8>(0);
    RAM: StaticArray<u8> = new StaticArray<u8>(16384);

    BIOS: StaticArray<u8> = new StaticArray<u8>(0);

    enable_RAM: u32 = 1;
    enable_bios: u32
    enable_cart: u32

    cart: SMSGG_mapper_sega_cart = new SMSGG_mapper_sega_cart();
    bios: SMSGG_mapper_sega_bios = new SMSGG_mapper_sega_bios();

    constructor(variant: SMSGG_variants) {
        this.variant = variant;

        this.enable_bios = (variant === SMSGG_variants.GG) ? 0 : 1;
        this.enable_cart = (variant === SMSGG_variants.GG) ? 1 : 0;
    }

    reset(): void {
        this.bios.rom_00_bank = 0;
        this.bios.rom_40_bank = 0x4000;
        this.bios.rom_80_bank = 0x8000;
        this.cart.rom_00_bank = 0;
        this.cart.rom_40_bank = 0x4000;
        this.cart.rom_80_bank = 0x8000;
        this.cart.ram_80_enabled = 0;
        this.cart.ram_C0_enabled = 0;
        this.enable_cart = (this.variant === SMSGG_variants.GG) ? 1 : 0;
        for (let i = 0; i < this.RAM.length; i++) {
            this.RAM[i] = 0;
        }
    }

    //  0 slot 0
    // 40 slot 1
    // 80 ROM slot 2/RAM slot
    // C0 sytem RAM
    // E0 system RAM mirror

    set_bios(to: u32): void {
        this.enable_bios = to;
        if (this.BIOS.length === 0) this.enable_bios = 0;
    }

    @inline
    bios_read(addr: u32, val: u32): u32 {
        if (this.BIOS.length === 0) return val;
        if (addr < 0x400) return <u32>unchecked(this.BIOS[addr]);
        if (addr < 0x4000) return <u32>unchecked(this.BIOS[this.bios.rom_00_bank | (addr & 0x3FFF)]);
        if (addr < 0x8000) return <u32>unchecked(this.BIOS[this.bios.rom_40_bank | (addr & 0x3FFF)]);
        if (addr < 0xC000) return <u32>unchecked(this.BIOS[this.bios.rom_80_bank | (addr & 0x3FFF)]);
        return val;
    }

    @inline
    read(addr: u32, val: u32): u32 {
        addr &= 0xFFFF;
        if ((addr >= 0xC000) && (this.enable_RAM)) val = <u32>unchecked(this.RAM[addr & 0x1FFF]);
        if ((this.variant !== SMSGG_variants.GG) && this.enable_bios) val = this.bios_read(addr, val);
        if (this.enable_cart) val = this.cart_read(addr, val);
        return val;
    }

    bios_write(addr: u32, val: u32): void {
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

    @inline
    cart_read(addr: u32, val: u32): u32 {
        if (addr < 0x400) return <u32>unchecked(this.ROM[addr]);
        else if (addr < 0x4000) return <u32>unchecked(this.ROM[this.cart.rom_00_bank | (addr & 0x3FFF)]);
        else if (addr < 0x8000) return <u32>unchecked(this.ROM[this.cart.rom_40_bank | (addr & 0x3FFF)]);
        else if (addr < 0xC000) return <u32>unchecked(this.ROM[this.cart.rom_80_bank | (addr & 0x3FFF)]);
        return val;
    }

    cart_write(addr: u32, val: u32): void {
        switch(addr) {
            case 0xFFFC: // various stuff
                this.cart.ram_C0_enabled = (val & 0x10) >>> 4;
                this.cart.ram_80_enabled = (val & 0x08) >>> 3;
                return;
            case 0xFFFD: // ROM 0x0400-0x3FFF
                this.cart.rom_00_bank = (val % this.cart.num_ROM_banks) << 14;
                return;
            case 0xFFFE: // ROM 0x4000-0x7FFF
                this.cart.rom_40_bank = (val % this.cart.num_ROM_banks) << 14;
                return;
            case 0xFFFF: // ROM 0x8000-0xBFFF
                this.cart.rom_80_bank = (val % this.cart.num_ROM_banks) << 14;
                return;
        }
    }


    write(addr: u32, val: u32): void {
        addr &= 0xFFFF;
        if ((addr >= 0xC000) && this.enable_RAM) unchecked(this.RAM[addr & 0x1FFF] = <u8>val);
        if ((this.variant !== SMSGG_variants.GG) && this.enable_bios) this.bios_write(addr, val);
        if ((this.variant === SMSGG_variants.GG) && this.enable_bios && (addr < 0x400)) this.bios_write(addr, val);
        if ((this.variant !== SMSGG_variants.GG) && this.enable_cart) this.cart_write(addr, val);
        if ((this.variant === SMSGG_variants.GG) && ((addr >= 0x400) || (!this.enable_bios))) this.cart_write(addr, val);
    }

    load_BIOS_from_RAM(what: usize, sz: u32): void {
        let rh: heapArray8 = new heapArray8(what, sz);
        this.BIOS = new StaticArray<u8>(sz);
        for (let i: u32 = 0; i < sz; i++) {
            // @ts-ignore
            this.BIOS[i] = rh[i];
        }
        this.enable_bios = 1;
        this.bios.num_banks = (sz >>> 14);
        if (this.bios.num_banks === 0) this.bios.num_banks = 1;
        console.log('Loaded BIOS of size ' + sz.toString());
    }

    load_ROM_from_RAM(name: string, what: usize, sz: u32): void {
        let rh: heapArray8 = new heapArray8(what, sz);
        this.ROM = new StaticArray<u8>(sz);
        console.log('LOADING CART... ' + sz.toString() + ' bytes!');
        for (let i: u32 = 0; i < sz; i++) {
            // @ts-ignore
            this.ROM[i] = rh[i];
        }
        this.cart.num_ROM_banks = (sz / 0x4000);
        if (this.cart.num_ROM_banks === 0) this.cart.num_ROM_banks = 1;
    }
}
