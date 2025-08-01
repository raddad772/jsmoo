"use strict";

import {GB_mapper} from "./interface";
import {GB_bus, GB_clock} from "../gb";
import {GB_cart} from "../gb_cart";
import {GB_variants} from "../gb_common";

const RTC_START_TIME = 1000 * 1668634714;

class GB_mapper_MBC3_regs {
    ext_RAM_enable: bool = false
    ROM_bank_lo: u32 = 0
    ROM_bank_hi: u32 = 1
    RAM_bank: u32 = 0
    last_RTC_latch_write: u32 = 0xFF
    RTC_latched: Uint16Array = new Uint16Array(5) // addr - 0x08
    RTC_start: u32 = 0
}

export class GB_mapper_MBC3 implements GB_mapper {
    clock: GB_clock
    bus: GB_bus
    ROM: StaticArray<u8> = new StaticArray<u8>(0)
    BIOS_big: u32 = 0;
    ROM_bank_offset_hi: u32 = 16384;
    RAM_bank_offset: u32 = 0;
    ROM_bank_offset_lo: u32 = 0;
    num_ROM_banks: u32 = 0;
    num_RAM_banks: u32 = 0;
    VRAM_bank_offset: u32 = 0;
    WRAM_bank_offset: u32 = 0x1000;
    cartRAM: StaticArray<u8> = new StaticArray<u8>(0)
    WRAM: StaticArray<u8> = new StaticArray<u8>(8192*8)
    HRAM: StaticArray<u8> = new StaticArray<u8>(128)
    VRAM: StaticArray<u8> = new StaticArray<u8>(32768);
    BIOS: StaticArray<u8> = new StaticArray<u8>(0);
    cart: GB_cart

    RAM_mask: u32 = 0
    has_RAM: bool = false;

    regs: GB_mapper_MBC3_regs = new GB_mapper_MBC3_regs()

    constructor(clock: GB_clock, bus: GB_bus) {
        this.clock = clock;
        this.bus = bus;

        this.cart = new GB_cart(GB_variants.DMG, clock, bus);
        this.bus.mapper = this;

    }

    reset(): void {
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

    latch_RTC(): void {
        console.log('NO RTC LATCH YET!')
    }

    remap(): void {
        this.regs.ROM_bank_hi %= this.num_ROM_banks;

        this.ROM_bank_offset_hi = this.regs.ROM_bank_hi * 16384;
        let rb: u32 = this.regs.RAM_bank;
        if (this.cart.header.timer_present) {
            if ((this.regs.RAM_bank <= 3) && this.has_RAM) this.regs.RAM_bank %= this.num_RAM_banks;
            if (rb <= 3) {
                if (this.has_RAM) this.RAM_bank_offset = rb * 8192;
            } else {
                console.log('SET TO RTC! ' + rb.toString());
                // RTC registers handled during read/write ops to the area
            }
        }
        else {
            if ((this.regs.RAM_bank <= 3) && this.has_RAM) this.regs.RAM_bank %= this.num_RAM_banks;
            if (this.has_RAM) this.RAM_bank_offset = this.regs.RAM_bank * 8192;
        }
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
            return this.ROM[(addr & 0x3FFF) + this.ROM_bank_offset_lo];
        if (addr < 0x8000) // ROM hi bank
            return this.ROM[(addr & 0x3FFF) + this.ROM_bank_offset_hi];
        if (addr < 0xA000) { // VRAM, banked
            if (this.clock.CPU_can_VRAM)
                return this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset];
            return 0xFF;
        } // cart RAM if it's there
        if (addr < 0xC000) {
            if (!this.has_RAM) return 0xFF;
            if (this.regs.RAM_bank < 4)
                return this.cartRAM[(addr & 0x1FFF) + this.RAM_bank_offset];
            else if ((this.regs.RAM_bank >= 8) && (this.regs.RAM_bank <= 0x0C) && this.cart.header.timer_present) {
                return this.regs.last_RTC_latch_write;
            }
            return 0xFF;
        }
        // Adjust address for mirroring
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

    CPU_write(addr: u32, val: u32): void {
        if ((addr >= 0xE000) && (addr < 0xFE00)) addr -= 0x2000; // WRAM mirror
        if (addr < 0x8000) { // ROMs {
            switch(addr & 0xE000) {
                case 0x0000: // RAM and timer enable, write-only
                    // A on, 0 off
                    this.regs.ext_RAM_enable = val === 0x0A;
                    return;
                case 0x2000: // 16KB hi ROM bank number, 7 bits. 0 = 1, otherwise it's normal.
                             // extended to 4MB 8 bits
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
            if (this.clock.CPU_can_VRAM)
                this.VRAM[(addr & 0x1FFF) + this.VRAM_bank_offset] = <u8>val;
            return;
        }
        if (addr < 0xC000) { // cart RAM
            if (!this.has_RAM) return;
            if (this.regs.RAM_bank < 4)
                this.cartRAM[(addr & 0x1FFF) + this.RAM_bank_offset] = <u8>val;
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
       console.log('Loading MBC3 cart')
        this.cart = cart;
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
        this.num_ROM_banks = cart.header.ROM_size >>> 14;
        this.cartRAM = new StaticArray<u8>(cart.header.RAM_size);
        this.num_ROM_banks = cart.header.ROM_size / 16384;
        this.RAM_mask = cart.header.RAM_mask;
        this.has_RAM = cart.header.RAM_size > 0;
        this.num_RAM_banks = cart.header.RAM_size / 8192;
    }
}