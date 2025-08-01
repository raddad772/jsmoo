import {GB_mapper} from "./interface";
import {GB_bus, GB_clock} from "../gb";
import {GB_cart} from "../gb_cart";
import {GB_variants} from "../gb_common";

class GB_mapper_MBC5_regs {
    ROMB0: u32 = 0
    ROMB1: u32 = 0
    RAMB: u32 = 0
    ext_RAM_enable: u32 = 0
}

export class GB_mapper_MBC5 implements GB_mapper {
    clock: GB_clock
    bus: GB_bus
    ROM: StaticArray<u8> = new StaticArray<u8>(0)
    BIOS_big: u32 = 0;

    ROM_bank_lo_offset: u32 = 0;
    ROM_bank_hi_offset: u32 = 16384;
    VRAM_bank_offset: u32 = 0;
    WRAM_bank_offset: u32 = 0x1000;

    cartRAM: StaticArray<u8> = new StaticArray<u8>(0)
    cartRAM_offset: u32 = 0;
    WRAM: StaticArray<u8> = new StaticArray<u8>(8192*8)
    HRAM: StaticArray<u8> = new StaticArray<u8>(128)
    VRAM: StaticArray<u8> = new StaticArray<u8>(32768);
    BIOS: StaticArray<u8> = new StaticArray<u8>(0);
    has_RAM: bool = false
    RAM_mask: u32 = 0

    cart: GB_cart

    num_ROM_banks: u32 = 0;
    num_RAM_banks: u32 = 0;

    regs: GB_mapper_MBC5_regs = new GB_mapper_MBC5_regs()

    constructor(clock:GB_clock, bus: GB_bus) {
        this.clock = clock;
        this.bus = bus;

        this.cart = new GB_cart(GB_variants.DMG, clock, bus);
        this.bus.mapper = this;
    }

    reset(): void {
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

    CPU_read(addr: u32, val: u32): u32 {
        if ((addr >= 0xE000) && (addr < 0xFE00)) addr -= 0x2000; // WRAM mirror
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
            if (this.clock.CPU_can_VRAM)
                return this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset];
            return 0xFF;
        } // cart RAM if it's there
        if (addr < 0xC000) {
            if ((!this.has_RAM) || (!this.regs.ext_RAM_enable))
                return 0xFF;
            return this.cartRAM[((addr - 0xA000) & this.RAM_mask) + this.cartRAM_offset];
        }
        if (addr < 0xD000) // WRAM lo bank
            return this.WRAM[addr & 0xFFF];
        if (addr < 0xE000) // WRAM hi bank
            return this.WRAM[(addr & 0xFFF) + this.WRAM_bank_offset];
        if (addr < 0xFF00) // OAM
            return this.bus.ppu!.read_OAM(addr);
        if (addr < 0xFF80) // registers
            return this.bus.CPU_read_IO(addr, val);
        if (addr < 0xFFFF) // HRAM always accessible
            return this.HRAM[addr - 0xFF80];
        return this.bus.CPU_read_IO(addr, val); // 0xFFFF register
    }

    // Update ROM banks
    update_banks(): void {
        if (this.num_RAM_banks > 0)
            this.cartRAM_offset = (this.regs.RAMB % this.num_RAM_banks) * 8192;
        this.ROM_bank_lo_offset = 0;
        this.ROM_bank_hi_offset = (((this.regs.ROMB1 << 8) | this.regs.ROMB0) % this.num_ROM_banks) * 16384;
    }

    CPU_write(addr: u32, val: u32): void {
        if ((addr >= 0xE000) && (addr < 0xFE00)) addr -= 0x2000; // WRAM mirror
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
            if (this.clock.CPU_can_VRAM)
                this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset] = <u8>val;
            return;
        }
        if (addr < 0xC000) { // cart RAM
            if (this.has_RAM && this.regs.ext_RAM_enable)
                this.cartRAM[((addr - 0xA000) & this.RAM_mask) + this.cartRAM_offset] = <u8>val;
            return;
        }
        if (addr < 0xD000) { // WRAM lo bank
            this.WRAM[addr & 0xFFF] = <u8>val;
            return;
        }
        if (addr < 0xE000) { // WRAM hi bank
            this.WRAM[(addr & 0xFFF) + this.WRAM_bank_offset] = <u8>val;
            return;
        }
        if (addr < 0xFF00) // OAM
            return this.bus.ppu!.write_OAM(addr, val);
        if (addr < 0xFF80) // registers
            return this.bus.CPU_write_IO(addr, val);
        if (addr < 0xFFFF) { // HRAM always accessible
            this.HRAM[addr - 0xFF80] = <u8>val;
            return;
        }
        this.bus.CPU_write_IO(addr, val); // 0xFFFF register
    }

    PPU_read(addr: u32): u32 {
        if ((addr < 0x8000) || (addr > 0x9FFF)) return 0xFF;
        return this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset];
    }

    set_cart(cart: GB_cart, BIOS: Uint8Array): void {
        console.log('Loading MBC5 cart');
        this.cart = cart;
        this.BIOS = new StaticArray<u8>(BIOS.byteLength);
        for (let i = 0, k = BIOS.byteLength; i < k; i++) {
            this.BIOS[i] = BIOS[i];
        }
        this.BIOS_big = +(BIOS.byteLength > 256);
        this.ROM = new StaticArray<u8>(cart.header.ROM_size);
        for (let i: u32 = 0, k: u32 = cart.header.ROM_size; i < k; i++) {
            this.ROM[i] = cart.ROM[i];
        }
        this.cartRAM = new StaticArray<u8>(cart.header.RAM_size);
        this.num_RAM_banks = (cart.header.RAM_size / 8192);
        this.num_ROM_banks = cart.header.ROM_size / 16384;
        this.RAM_mask = cart.header.RAM_mask;
        this.has_RAM = cart.header.RAM_size > 0;
    }
}
