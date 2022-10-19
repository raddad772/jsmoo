import {
    NES_mapper,
    NES_mirror_ppu_Aonly,
    NES_mirror_ppu_Bonly,
    NES_mirror_ppu_four,
    NES_mirror_ppu_horizontal,
    NES_mirror_ppu_vertical,
    NES_PPU_mirror_modes
} from "./interface";
import {NES_bus, NES_clock} from "../nes_common";
import {MMC3b_map} from "./mmc3b";
import {NES_cart} from "../nes_cart";

class io {
    shift_pos: u32 = 0;
    shift_value: u32 = 0;
    swapped_banks: u32 = 0;
    ppu_bank00: u32 = 0;
    ppu_bank10: u32 = 0;
    bank: u32 = 0;
    ctrl: u32 = 0;
    prg_bank_mode: u32 = 3;
    chr_bank_mode: u32 = 0;
}

export class NES_mapper_MMC1 implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    CHR_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    PRG_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    CIRAM: StaticArray<u8> = new StaticArray<u8>(0x2000); // PPU RAM
    CPU_RAM: StaticArray<u8> = new StaticArray<u8>(0x800); // CPU RAM
    PRG_RAM: StaticArray<u8> = new StaticArray<u8>(0);
    CHR_RAM: StaticArray<u8> = new StaticArray<u8>(0);
    prg_ram_size: u32 = 0;
    chr_ram_size: u32 = 0;
    has_chr_ram: bool = false;
    has_prg_ram: bool = false;

    last_cycle_write: u64 = 0;

    PRG_map: StaticArray<MMC3b_map> = new StaticArray<MMC3b_map>(2);
    CHR_map: StaticArray<MMC3b_map> = new StaticArray<MMC3b_map>(2);

    num_CHR_banks: u32 = 0
    num_PRG_banks: u32 = 0
    ppu_mirror: NES_PPU_mirror_modes = NES_PPU_mirror_modes.Horizontal;
    mirror_ppu_addr: (addr: u32) => u32 = NES_mirror_ppu_horizontal;

    io: io = new io();

    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;
        for (let i: u32 = 0; i < 2; i++) {
            this.PRG_map[i] = new MMC3b_map();
            this.CHR_map[i] = new MMC3b_map();
        }
    }

    @inline cycle(howmany: u32): void { }

    remap(boot: bool = false): void {
        if (boot) {
            for (let i = 0; i < 2; i++) {
                this.PRG_map[i].data = this.PRG_ROM;
                this.PRG_map[i].ROM = true;
                this.PRG_map[i].RAM = false;
                this.PRG_map[i].addr = (0x8000) + (i * 0x4000);

                this.CHR_map[i].data = this.CHR_ROM;
                this.CHR_map[i].addr = 0x1000 * i;
                this.CHR_map[i].ROM = true;
                this.CHR_map[i].RAM = false;
            }
        }

        switch(this.io.prg_bank_mode) {
            case 0:
            case 1: // 32k at 0x8000
                this.set_PRG_ROM(0x8000, this.io.bank & 0xFE);
                this.set_PRG_ROM(0xC000, this.io.bank | 1);
                break;
            case 2:
                this.set_PRG_ROM(0x8000, 0);
                this.set_PRG_ROM(0xC000, this.io.bank);
                break;
            case 3:
                this.set_PRG_ROM(0x8000, this.io.bank);
                this.set_PRG_ROM(0xC000, this.num_PRG_banks - 1);
                break;
        }

        if (!this.has_chr_ram) {
            switch (this.io.chr_bank_mode) {
                case 0: // 8kb switch at a time
                    this.set_CHR_ROM(0x0000, this.io.ppu_bank00 & 0xFE);
                    this.set_CHR_ROM(0x1000, this.io.ppu_bank00 | 1);
                    break;
                case 1: // 4kb switch at a time
                    this.set_CHR_ROM(0x0000, this.io.ppu_bank00);
                    this.set_CHR_ROM(0x1000, this.io.ppu_bank10);
                    break;
            }
        }
    }

    PPU_write(addr: u32, val: u32): void {
        addr &= 0x3FFF;
        if (addr < 0x2000) {
            if (this.has_chr_ram) unchecked(this.CHR_RAM[addr] = <u8>val);
            return;
        }
        unchecked(this.CIRAM[this.mirror_ppu_addr(addr)] = <u8>val);
    }

    @inline PPU_read_effect(addr: u32): u32 {
        addr &= 0x3FFF;
        if (addr < 0x2000) {
            if (this.has_chr_ram) return unchecked(this.CHR_RAM[addr]);
            return unchecked(this.CHR_map[addr >>> 12]).read(addr);
        }
        return unchecked(this.CIRAM[this.mirror_ppu_addr(addr)]);
    }

    PPU_read_noeffect(addr: u32): u32 {
        return this.PPU_read_effect(addr);
    }

    CPU_write(addr: u32, val: u32): void {
        // Conventional CPU map
        if (addr < 0x2000) {
            unchecked(this.CPU_RAM[addr & 0x7FF] = <u8>val);
            return;
        }
        if (addr < 0x4000)
            return this.bus.PPU_reg_write(addr, val);
        if (addr < 0x4020)
            return this.bus.CPU_reg_write(addr, val);
        if (addr < 0x6000) return;
        if (addr < 0x8000) {
            if (this.has_prg_ram) unchecked(this.PRG_RAM[addr - 0x6000] = <u8>val);
            return;
        }

        // MMC1 stuff

        // 8000-FFFF register
        // Clear with bit 7 set
        if (val & 0x80) {
            // Writes ctrl | 0x0C
            this.io.shift_pos = 4;
            this.io.shift_value = this.io.ctrl | 0x0C;
            this.last_cycle_write = this.clock.cpu_master_clock;
            addr = 0x8000;
        } else {
            if (this.clock.cpu_master_clock === (this.last_cycle_write + this.clock.timing.cpu_divisor)) {
                // writes on consecutive cycles fail
                this.last_cycle_write = this.clock.cpu_master_clock;
                return;
            } else {
                this.io.shift_value = (this.io.shift_value >>> 1) | ((val & 1) << 4);
            }
        }

        this.last_cycle_write = this.clock.cpu_master_clock;

        this.io.shift_pos++;
        if (this.io.shift_pos === 5) {
            addr &= 0xE000;
            val = this.io.shift_value;
            switch (addr) {
                case 0x8000: // control register
                    this.io.ctrl = this.io.shift_value;
                    switch(val & 3) {
                        case 0: this.ppu_mirror = NES_PPU_mirror_modes.ScreenAOnly; break;
                        case 1: this.ppu_mirror = NES_PPU_mirror_modes.ScreenBOnly; break;
                        case 2: this.ppu_mirror = NES_PPU_mirror_modes.Vertical; break;
                        case 3: this.ppu_mirror = NES_PPU_mirror_modes.Horizontal; break;
                    }
                    this.set_mirroring();
                    this.io.prg_bank_mode = (val >>> 2) & 3;
                    this.io.chr_bank_mode = (val >>> 4) & 1;
                    this.remap();
                    break;
                case 0xA000: // CHR bank 0x0000
                    this.io.ppu_bank00 = this.io.shift_value;
                    this.remap();
                    break;
                case 0xC000: // CHR bank 1
                    this.io.ppu_bank10 = this.io.shift_value;
                    this.remap();
                    break;
                case 0xE000: // PRG bank
                    this.io.bank = this.io.shift_value & 0x0F;
                    if (this.io.shift_value & 0x10) console.log('WARNING50!');
                    this.remap();
                    break;
            }
            this.io.shift_value = 0;
            this.io.shift_pos = 0;
        }
    }

    @inline CPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        if (addr < 0x2000)
            return unchecked(this.CPU_RAM[addr & 0x7FF]);
        if (addr < 0x4000)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        if (addr < 0x6000) return val;
        if (addr < 0x8000) {
            if (this.has_prg_ram) return unchecked(this.PRG_RAM[addr - 0x6000]);
            return val;
        }
        return unchecked(this.PRG_map[(addr - 0x8000) >>> 14]).read(addr);
    }

    reset(): void {
        this.io.prg_bank_mode = 3;
        this.remap(true);
    }

    set_CHR_ROM(addr: u32, bank_num: u32): void {
        bank_num %= this.num_CHR_banks;
        let b = (addr >>> 12);
        this.CHR_map[b].addr = addr;
        this.CHR_map[b].offset = (bank_num % this.num_CHR_banks) * 0x1000;
    }

    set_PRG_ROM(addr: u32, bank_num: u32): void {
        bank_num %= this.num_PRG_banks;
        let b = (addr - 0x8000) >>> 14;
        this.PRG_map[b].addr = addr;
        this.PRG_map[b].offset = (bank_num % this.num_PRG_banks) * 0x4000;
    }

    set_mirroring(): void {
        switch(this.ppu_mirror) {
            case NES_PPU_mirror_modes.Vertical:
                this.mirror_ppu_addr = NES_mirror_ppu_vertical;
                return;
            case NES_PPU_mirror_modes.Horizontal:
                this.mirror_ppu_addr = NES_mirror_ppu_horizontal;
                return;
            case NES_PPU_mirror_modes.FourWay:
                this.mirror_ppu_addr = NES_mirror_ppu_four;
                return;
            case NES_PPU_mirror_modes.ScreenAOnly:
                this.mirror_ppu_addr = NES_mirror_ppu_Aonly;
                return;
            case NES_PPU_mirror_modes.ScreenBOnly:
                this.mirror_ppu_addr = NES_mirror_ppu_Bonly;
                return;
        }
    }

    set_cart(cart: NES_cart): void {
        this.CHR_ROM = new StaticArray<u8>(cart.CHR_ROM.byteLength);
        for (let i: u32 = 0, k: u32 = cart.CHR_ROM.byteLength; i < k; i++) {
            this.CHR_ROM[i] = cart.CHR_ROM[i];
        }
        this.PRG_ROM = new StaticArray<u8>(cart.PRG_ROM.byteLength);
        for (let i: u32 = 0, k: u32 = cart.PRG_ROM.byteLength; i < k; i++) {
            this.PRG_ROM[i] = cart.PRG_ROM[i];
        }

        this.prg_ram_size = cart.header.prg_ram_size;
        console.log('MMC1 PRG RAM SIZE ' + cart.header.prg_ram_size.toString());
        this.chr_ram_size = cart.header.chr_ram_size;
        console.log('MMC1 CHR RAM SIZE ' + cart.header.chr_ram_size.toString());

        this.PRG_RAM = new StaticArray<u8>(this.prg_ram_size);
        this.has_prg_ram = this.prg_ram_size !== 0;

        this.CHR_RAM = new StaticArray<u8>(this.chr_ram_size);
        this.has_chr_ram = this.chr_ram_size !== 0;

        this.ppu_mirror = cart.header.mirroring;
        this.set_mirroring();
        this.num_PRG_banks = (cart.PRG_ROM.byteLength / 16384);
        this.num_CHR_banks = (cart.CHR_ROM.byteLength / 4096);
        console.log('Num PRG banks ' + this.num_PRG_banks.toString());
        console.log('Num CHR banks ' + this.num_CHR_banks.toString());
        this.remap(true);
    }
}
