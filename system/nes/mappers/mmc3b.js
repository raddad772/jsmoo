"use strict";

/*
CPU $6000-$7FFF: 8 KB PRG RAM bank (optional)
CPU $8000-$9FFF (or $C000-$DFFF): 8 KB switchable PRG ROM bank
CPU $A000-$BFFF: 8 KB switchable PRG ROM bank
CPU $C000-$DFFF (or $8000-$9FFF): 8 KB PRG ROM bank, fixed to the second-last bank
CPU $E000-$FFFF: 8 KB PRG ROM bank, fixed to the last bank
PPU $0000-$07FF (or $1000-$17FF): 2 KB switchable CHR bank
PPU $0800-$0FFF (or $1800-$1FFF): 2 KB switchable CHR bank
PPU $1000-$13FF (or $0000-$03FF): 1 KB switchable CHR bank
PPU $1400-$17FF (or $0400-$07FF): 1 KB switchable CHR bank
PPU $1800-$1BFF (or $0800-$0BFF): 1 KB switchable CHR bank
PPU $1C00-$1FFF (or $0C00-$0FFF): 1 KB switchable CHR bank
 */

const SER_NES_MMC3b_map = ['addr', 'offset', 'ROM', 'RAM'];
class MMC3b_map {
    constructor() {
        this.addr = 0
        this.offset = 0;
        this.ROM = false;
        this.RAM = false;
        this.data = null;
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_NES_MMC3b_map);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD MMC3b map version');
            return false;
        }
        return deserialization_helper(this, from, SER_NES_MMC3b_map);
    }

    set(addr, offset, ROM, RAM) {
        this.addr = addr;
        this.offset = offset;
        this.ROM = ROM;
        this.RAM = RAM;
    }

    write(addr, val) {
        if (this.ROM) return;
        this.data[(addr - this.addr) + this.offset] = val;
    }

    read(addr, val, has_effect=true) {
        return this.data[(addr - this.addr) + this.offset];
    }
}

const SER_NES_a12_watcher = [
    'cycles_down', 'last_cycle', 'delay',
    'nothing', 'rise', 'fall'];
class a12_watcher {
    /**
     * @param {NES_clock} clock
     */
    constructor(clock) {
        this.cycles_down = 0;
        this.last_cycle = 0;
        this.clock = clock;
        this.delay = 3;

        this.nothing = 0;
        this.rise = 1;
        this.fall = 2;
    }

    serialize() {
        let o = {version:1};
        serialization_helper(o, this, SER_NES_a12_watcher);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD NES A12 WATCHER VERSION');
            return false;
        }
        return deserialization_helper(this, from, SER_NES_a12_watcher);
    }

    update(addr) {
        let result = this.nothing;
        if (this.cycles_down > 0) {
            if (this.last_cycle > this.clock.ppu_frame_cycle) {
                this.cycles_down += (89342 - this.last_cycle) + this.clock.ppu_frame_cycle;
            } else {
                this.cycles_down += this.clock.ppu_frame_cycle - this.last_cycle;
            }
        }

        if ((addr & 0x1000) === 0) {
            if (this.cycles_down === 0) {
                this.cycles_down = 1;
                result = this.fall;
            }
        }
        else if (addr & 0x1000) {
            if (this.cycles_down > this.delay) {
                result = this.rise;
            }
            this.cycles_down = 0;
        }
        this.last_cycle = this.clock.ppu_frame_cycle;

        return result;
    }
}

const SER_NES_MMC3b = [
    'CHR_ROM', 'PRG_ROM', 'CIRAM', 'CPU_RAM', 'PRG_RAM',
    'a12_watcher', 'regs', 'PRG_map', 'CHR_map',
    'irq_enable', 'irq_counter', 'irq_reload',
    'status', 'ppu_mirror', 'num_PRG_banks', 'num_CHR_banks'
]

class NES_mapper_MMC3b {
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
        this.cart = null;
        this.a12_watcher = new a12_watcher(clock);

        this.clock = clock;
        this.bus = bus;

        this.bus.CPU_read = this.cpu_read.bind(this);
        this.bus.CPU_write = this.cpu_write.bind(this);
        this.bus.PPU_read = this.ppu_read.bind(this);
        this.bus.PPU_write = this.ppu_write.bind(this);

        this.regs = {
            rC000: 0,
            bank_select: 0,
            bank: [0, 0, 0, 0, 0, 0, 0, 0]
        }

        this.irq_enable = 0; // IRQs start disabled
        this.irq_counter = 0;
        this.irq_reload = false;

        this.status = {
            ROM_bank_mode: 0,
            CHR_mode: 0,
            PRG_mode: 0
        }

        this.ppu_mirror = 0; // -1= no mirroring
                             // 0= RAM at 0x2000 and 0x2800; 0x2400 and 0x2C00 are mirrors.
                             // 1= RAM at 0x2000 and 0x2400; 0x2800 and 0x2C00 are mirrors
        // 89, AB, CD, EF
        /**
         * @type {MMC3b_map[]}
         */
        this.PRG_map = [];
        /**
         * @type {MMC3b_map[]}
         */
        this.CHR_map = []
        for (let i = 0; i < 5; i++) {
            this.PRG_map[i] = new MMC3b_map();
        }
        for (let i = 0; i < 8; i++) {
            this.CHR_map[i] = new MMC3b_map();
        }
        this.num_PRG_banks = 0;
        this.num_CHR_banks = 0;

    }

    serialize() {
        let o = {version: 1}
        serialization_helper(o, this, SER_NES_MMC3b);
    }

    cycle() {}

    a12_watch(addr) {
        if (this.a12_watcher.update(addr) === this.a12_watcher.rise) {
            let count = this.irq_counter;
            if ((this.irq_counter === 0) || (this.irq_reload)) {
                this.irq_counter = this.regs.rC000;
            } else {
                this.irq_counter--;
                if (this.irq_counter < 0) this.irq_counter = 0;
            }

            if ((this.irq_counter === 0) && (this.irq_enable)) {
                this.bus.CPU_notify_IRQ(1);
            }
            this.irq_reload = false;
        }
    }

    set_PRG_ROM(addr, bank_num) {
        let b = (addr - 0x6000) >>> 13;
        this.PRG_map[b].addr = addr;
        this.PRG_map[b].offset = (bank_num % this.num_PRG_banks) * 0x2000;
    }

    set_CHR_ROM_1k(b, bank_num) {
        this.CHR_map[b].offset = (bank_num % this.num_CHR_banks) * 0x0400;
    }

    pprint() {
        for (let i = 0; i < 8; i++) {
            console.log(hex0x4(this.CHR_map[i].addr) + ': ' + hex0x4(this.CHR_map[i].offset))
        }
    }

    remap(boot=false) {
        // slot 0 - 0x6-7000, PRG RAM or not
        // slot 1 - 0x8-9000
        // slot 2 - 0xA-B000
        // slot 3 - 0xC-D000
        // slot 5 - 0xE-F000,
        if (boot) {
            for (let i = 1; i < 5; i++) {
                this.PRG_map[i].data = this.PRG_ROM;
                this.PRG_map[i].ROM = true;
                this.PRG_map[i].RAM = false;
            }
            for (let i = 0; i < 8; i++) {
                this.CHR_map[i].data = this.CHR_ROM;
                this.CHR_map[i].addr = 0x400 * i;
                this.CHR_map[i].ROM = true;
                this.CHR_map[i].RAM = false;
            }
            this.PRG_map[0].set(0x6000, 0, false, true);
            this.PRG_map[0].data = this.PRG_RAM;
            this.PRG_map[0].RAM = true;
            this.PRG_map[0].ROM = false;
            this.set_PRG_ROM(0xE000, this.num_PRG_banks-1);
        }

        if (this.status.PRG_mode === 0) {
            // 0 = 8000-9FFF swappable,
            //     C000-DFFF fixed to second-last bank
            // 1 = 8000-9FFF fixed to second-last bank
            //     C000-DFFF swappable
            this.set_PRG_ROM(0x8000, this.regs.bank[6]);
            this.set_PRG_ROM(0xC000, this.num_PRG_banks-2);
        }
        else {
            this.set_PRG_ROM(0x8000, this.num_PRG_banks-2);
            this.set_PRG_ROM(0xC000, this.regs.bank[6]);
        }
        this.set_PRG_ROM(0xA000, this.regs.bank[7]);

        if (this.status.CHR_mode === 0) {
            // 2KB CHR banks 0, 1KB CHR banks at 1000
            this.set_CHR_ROM_1k(0, this.regs.bank[0] & 0xFE);
            this.set_CHR_ROM_1k(1, this.regs.bank[0] | 0x01);
            this.set_CHR_ROM_1k(2, this.regs.bank[1] & 0xFE);
            this.set_CHR_ROM_1k(3, this.regs.bank[1] | 0x01);
            this.set_CHR_ROM_1k(4, this.regs.bank[2]);
            this.set_CHR_ROM_1k(5, this.regs.bank[3]);
            this.set_CHR_ROM_1k(6, this.regs.bank[4]);
            this.set_CHR_ROM_1k(7, this.regs.bank[5]);
        }
        else {
            //console.log(this.regs.bank[5]);
            // 1KB CHR banks at 0, 2KB CHR banks at 1000
            this.set_CHR_ROM_1k(0, this.regs.bank[2]);
            this.set_CHR_ROM_1k(1, this.regs.bank[3]);
            this.set_CHR_ROM_1k(2, this.regs.bank[4]);
            this.set_CHR_ROM_1k(3, this.regs.bank[5]);
            this.set_CHR_ROM_1k(4, this.regs.bank[0] & 0xFE);
            this.set_CHR_ROM_1k(5, this.regs.bank[0] | 0x01);
            this.set_CHR_ROM_1k(6, this.regs.bank[1] & 0xFE);
            this.set_CHR_ROM_1k(7, this.regs.bank[1] | 0x01);
        }
    }

    mirror_ppu_addr(addr) {
        if (this.ppu_mirror === -1) {  // 4-way mirror
            return addr;
        }
        if (this.ppu_mirror === 1)
            return (addr >>> 1 & 0x0400) | (addr & 0x03ff);
        else
            return (addr & 0x0400) | (addr & 0x03ff);
    }

    ppu_write(addr, val) {
        this.a12_watch(addr);
        if (addr < 0x2000) // can't write ROM
            return;
        this.CIRAM[this.mirror_ppu_addr(addr)] = val;
    }

    ppu_read(addr, val, has_effect=true) {
        if (has_effect) this.a12_watch(addr);
        if (addr < 0x2000) {
            return this.CHR_map[addr >>> 10].read(addr, val, has_effect);
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

        // MMC3 map
        // 0x4020-0x5FFF nothing
        if (addr < 0x6000) return;

        if (addr < 0x8000) { this.PRG_map[(addr - 0x6000) >>> 13].write(addr, val); return; }

        switch(addr & 0xE001) {
            case 0x8000: // Bank select
                this.regs.bank_select = (val & 7);
                this.status.PRG_mode = (val & 0x40) >>> 6;
                this.status.CHR_mode = (val & 0x80) >>> 7;
                break;
            case 0x8001: // Bank data
                this.regs.bank[this.regs.bank_select] = val;
                this.remap();
                break;
            case 0xA000:
                this.ppu_mirror = val & 1;
                break;
            case 0xA001:
                break;
            case 0xC000:
                this.regs.rC000 = val;
                break;
            case 0xC001:
                this.irq_reload = true;
                break;
            case 0xE000:
                this.irq_enable = 0;
                break;
            case 0xE001:
                this.irq_enable = 1;
                break;
        }
        //DOMORE
    }

    cpu_read(addr, val, has_effect=true) {
        if (addr < 0x2000)
            return this.CPU_RAM[addr & 0x7FF];
        if (addr < 0x4000)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        if (addr >= 0x6000)
            return this.PRG_map[(addr - 0x6000) >>> 13].read(addr, val, has_effect);
        return val;
    }

    reset() {
        this.remap(true);
    }

    /**
     * @param {NES_cart} cart
     */
    set_cart(cart) {
        this.CHR_ROM = cart.CHR_ROM;
        this.PRG_ROM = cart.PRG_ROM;

        this.prg_ram_size = cart.header.prg_ram_size;
        console.log('MMC3 PRG RAM SIZE', cart.header.prg_ram_size);
        if (this.prg_ram_size !== 0) {
            this.PRG_RAM = new Uint8Array(this.prg_ram_size);
        } else {
            this.PRG_RAM = 0;
        }

        this.ppu_mirror = cart.header.mirroring;
        this.num_PRG_banks = (this.PRG_ROM.byteLength / 8192);
        this.num_CHR_banks = (this.CHR_ROM.byteLength / 1024);
        console.log('Num CHR banks', this.num_CHR_banks);
        this.remap(true);
    }
}