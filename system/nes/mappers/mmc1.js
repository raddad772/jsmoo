"use strict";

const SER_NES_mapper_MMC1 = [
    'CHR_ROM', 'PRG_ROM', 'CIRAM', 'CPU_RAM',
    'PRG_RAM', 'CHR_RAM', 'has_chr_ram', 'has_prg_ram',
    'prg_ram_size', 'chr_ram_size', 'last_cycle_write',
    'io', 'ppu_mirror', 'PRG_map', 'CHR_map',
    'num_PRG_banks', 'num_CHR_banks'
]
class NES_mapper_MMC1 {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.CHR_ROM = [];
        this.PRG_ROM = [];
        this.CIRAM = new Uint8Array(0x2000); // Standard PPU RAM
        this.CPU_RAM = new Uint8Array(0x800); // Standard CPU RAM
        this.PRG_RAM = []; // Extra CPU RAM
        this.CHR_RAM = []; // Character RAM
        this.has_chr_ram = false;
        this.has_prg_ram = false;
        this.cart = null;

        this.prg_ram_size = 0;
        this.chr_ram_size = 0;

        this.clock = clock;
        this.bus = bus;

        this.bus.CPU_read = this.cpu_read.bind(this);
        this.bus.CPU_write = this.cpu_write.bind(this);
        this.bus.PPU_read = this.ppu_read.bind(this);
        this.bus.PPU_write = this.ppu_write.bind(this);
        this.bus.mapper = this;
        this.last_cycle_write = 0;

        this.io = {
            shift: {
                pos: 0,
                value: 0,
            },
            swapped_banks: 0,
            ppu_bank00: 0,
            ppu_bank10: 0,
            bank: 0,
            ctrl: 0,
            prg_bank_mode: 3,
            chr_bank_mode: 0
        }
        this.ppu_mirror = 0;
        /**
         * @type {MMC3b_map[]}
         */
        this.PRG_map = [];
        /**
         * @type {MMC3b_map[]}
         */
        this.CHR_map = []
        for (let i = 0; i < 2; i++) { // 16KB banks
            this.PRG_map[i] = new MMC3b_map();
        }
        for (let i = 0; i < 2; i++) { // 4KB banks
            this.CHR_map[i] = new MMC3b_map();
        }
        this.num_PRG_banks = 0;
        this.num_CHR_banks = 0;
    }

    serialize() {
        let o = {version: 1}
        serialization_helper(o, this, SER_NES_mapper_MMC1);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG NES MAPPER MMC1 VERSION');
            return false;
        }
        return deserialization_helper(this, from, SER_NES_mapper_MMC1);
    }

    a12_watch() {}

    cycle() {}

    remap(boot=false) {
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

    mirror_ppu_addr(addr) {
        switch(this.ppu_mirror) {
            case 0:
                return (addr & 0x3FF);
            case 1:
                return (addr & 0x3FF) | 0x400;
            case 3:
                return (addr >>> 1 & 0x0400) | (addr & 0x03ff);
            case 2:
                return (addr & 0x0400) | (addr & 0x03ff);
        }
    }

    ppu_write(addr, val) {
        addr &= 0x3FFF;
        if (addr < 0x2000) {
            if (this.has_chr_ram) this.CHR_RAM[addr] = val;
            return;
        }
        this.CIRAM[this.mirror_ppu_addr(addr)] = val;
    }

    ppu_read(addr, val, has_effect=true) {
        addr &= 0x3FFF;
        if (addr < 0x2000) {
            if (this.has_chr_ram) return this.CHR_RAM[addr];
            return this.CHR_map[addr >>> 12].read(addr, val, has_effect);
        }
        return this.CIRAM[this.mirror_ppu_addr(addr)];
    }

    cpu_write(addr, val) {
        // Conventional CPU map
        // 0x0000-0x1FFF 4 mirrors of 2KB banks
        if (addr < 0x2000) {
            this.CPU_RAM[addr & 0x7FF] = val;
            return;
        }
        // 0x2000-0x3FFF mirrored PPU registers
        if (addr <= 0x3FFF) {
            this.bus.PPU_reg_write(addr, val);
            return;
        }
        // 0x4000-0x401F CPU registers
        if (addr < 0x4020) {
            this.bus.CPU_reg_write(addr, val);
            return;
        }
        if (addr < 0x6000) return;
        if (addr < 0x8000) {
            if (this.has_prg_ram) this.PRG_RAM[addr - 0x6000] = val;
            return;
        }

        // MMC1 stuff

        // 8000-FFFF register
        // Clear with bit 7 set
        if (val & 0x80) {
            // Writes ctrl | 0x0C
            this.io.shift.pos = 4;
            this.io.shift.value = this.io.ctrl | 0x0C;
            this.last_cycle_write = this.clock.cpu_master_clock;
            addr = 0x8000;
        } else {
            if (this.clock.cpu_master_clock === (this.last_cycle_write + this.clock.timing.cpu_divisor)) {
                // writes on consecutive cycles fail
                this.last_cycle_write = this.clock.cpu_master_clock;
                return;
            } else {
                this.io.shift.value = (this.io.shift.value >>> 1) | ((val & 1) << 4);
            }
        }

        this.last_cycle_write = this.clock.cpu_master_clock;

        this.io.shift.pos++;
        if (this.io.shift.pos === 5) {
            addr &= 0xE000;
            val = this.io.shift.value;
            switch (addr) {
                case 0x8000: // control register
                    this.io.ctrl = this.io.shift.value;
                    this.ppu_mirror = val & 3;
                    this.io.prg_bank_mode = (val >>> 2) & 3;
                    this.io.chr_bank_mode = (val >>> 4) & 1;
                    this.remap();
                    break;
                case 0xA000: // CHR bank 0x0000
                    this.io.ppu_bank00 = this.io.shift.value;
                    this.remap();
                    break;
                case 0xC000: // CHR bank 1
                    this.io.ppu_bank10 = this.io.shift.value;
                    this.remap();
                    break;
                case 0xE000: // PRG bank
                    this.io.bank = this.io.shift.value & 0x0F;
                    if (this.io.shift.value & 0x10) console.log('WARNING!');
                    this.remap();
                    break;
            }
            this.io.shift.value = 0;
            this.io.shift.pos = 0;
        }
    }

    cpu_read(addr, val, has_effect=true) {
        if (addr < 0x2000)
            return this.CPU_RAM[addr & 0x7FF];
        if (addr < 0x4000)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        if (addr < 0x6000) return val;
        if (addr < 0x8000) {
            if (this.has_prg_ram) return this.PRG_RAM[addr - 0x6000];
            return val;
        }
        return this.PRG_map[(addr - 0x8000) >>> 14].read(addr, val, has_effect);
    }

    reset() {
        this.io.prg_bank_mode = 3;
        this.remap(true);
    }

    set_CHR_ROM(addr, bank_num) {
        let b = (addr >>> 12);
        this.CHR_map[b].addr = addr;
        this.CHR_map[b].offset = (bank_num % this.num_CHR_banks) * 0x1000;
    }

    set_PRG_ROM(addr, bank_num) {
        bank_num %= this.num_PRG_banks;
        let b = (addr - 0x8000) >>> 14;
        this.PRG_map[b].addr = addr;
        this.PRG_map[b].offset = (bank_num % this.num_PRG_banks) * 0x4000;
    }


    /**
     * @param {NES_cart} cart
     */
    set_cart(cart) {
        this.CHR_ROM = cart.CHR_ROM;
        this.PRG_ROM = cart.PRG_ROM;

        this.prg_ram_size = cart.header.prg_ram_size;
        console.log('MMC1 PRG RAM SIZE', cart.header.prg_ram_size);
        this.chr_ram_size = cart.header.chr_ram_size;
        console.log('MMC1 CHR RAM SIZE', cart.header.chr_ram_size);
        if (this.prg_ram_size !== 0) {
            this.PRG_RAM = new Uint8Array(this.prg_ram_size);
            this.has_prg_ram = true;
        } else {
            this.PRG_RAM = [];
            this.has_prg_ram = false;
        }
        if (this.chr_ram_size !== 0) {
            this.CHR_RAM = new Uint8Array(this.chr_ram_size);
            this.has_chr_ram = true;
        } else {
            this.CHR_RAM = [];
            this.has_chr_ram = false;
        }

        this.ppu_mirror = cart.header.mirroring;
        this.num_PRG_banks = (this.PRG_ROM.byteLength / 16384);
        this.num_CHR_banks = (this.CHR_ROM.byteLength / 4096);
        console.log('Num PRG banks', this.num_PRG_banks);
        console.log('Num CHR banks', this.num_CHR_banks);
        this.remap(true);
    }
}