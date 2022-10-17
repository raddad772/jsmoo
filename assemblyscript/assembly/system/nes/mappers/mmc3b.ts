import {NES_a12_watcher_edge, NES_a12_watcher_t, NES_mapper} from "./interface";
import {NES_bus, NES_clock} from "../nes_common";
import {NES_cart} from "../nes_cart";

export class MMC3b_map {
    addr: i32 = 0
    offset: i32 = 0;
    ROM: bool = false;
    RAM: bool = false;
    data: StaticArray<u8> = new StaticArray<u8>(0);

    set(addr: i32, offset: i32, ROM: bool, RAM: bool): void {
        this.addr = addr;
        this.offset = offset;
        this.ROM = ROM;
        this.RAM = RAM;
    }

    @inline write(addr: u32, val: u32): void {
        if (this.ROM) return;
        this.data[(addr - this.addr) + this.offset] = <u8>val;
    }

    @inline read(addr: u32, val: u32, has_effect: u32): u32 {
        return this.data[(addr - this.addr) + this.offset];
    }
}

class NES_MMC3b_regs {
    rC000: u32 = 0;
    bank_select: u32 = 0;
    bank: StaticArray<u32> = new StaticArray<u32>(8);
}

class NES_MMC3b_status {
    ROM_bank_mode: u32 = 0;
    CHR_mode: u32 = 0;
    PRG_mode: u32 = 0;
}


export class NES_MMC3b implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    a12_watcher: NES_a12_watcher_t
    CHR_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    PRG_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    CIRAM: StaticArray<u8> = new StaticArray<u8>(0x2000); // PPU RAM
    CPU_RAM: StaticArray<u8> = new StaticArray<u8>(0x800); // CPU RAM
    PRG_RAM: StaticArray<u8> = new StaticArray<u8>(0);
    prg_ram_size: u32 = 0
    regs: NES_MMC3b_regs = new NES_MMC3b_regs();
    status: NES_MMC3b_status = new NES_MMC3b_status();

    irq_enable: u32 = 0;
    irq_counter: i32 = 0;
    irq_reload: bool = false;

    ppu_mirror: i32 = 0;
    PRG_map: StaticArray<MMC3b_map> = new StaticArray<MMC3b_map>(5);
    CHR_map: StaticArray<MMC3b_map> = new StaticArray<MMC3b_map>(8);
    num_PRG_banks: u32 = 0;
    num_CHR_banks: u32 = 0;

    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;
        this.a12_watcher = new NES_a12_watcher_t(clock);
        for (let i = 0; i < this.PRG_map.length; i++) {
            this.PRG_map[i] = new MMC3b_map();
        }
        for (let i = 0; i < this.CHR_map.length; i++) {
            this.CHR_map[i] = new MMC3b_map();
        }

        this.bus.mapper = this;
    }

    // MMC3 no cycle counter
    cycle(howmany: u32) : void {}

    a12_watch(addr: u32): void {
        if (this.a12_watcher.update(addr) === NES_a12_watcher_edge.rise) {
            if ((this.irq_counter === 0) || (this.irq_reload))
                this.irq_counter = <i32>this.regs.rC000;
            else {
                this.irq_counter--;
                if (this.irq_counter < 0) this.irq_counter = 0;
            }

            if ((this.irq_counter === 0) && (this.irq_enable))
                this.bus.CPU_notify_IRQ(1);
            this.irq_reload = false;
        }
    }

    set_PRG_ROM(addr: u32, bank_num: u32): void {
        let b: u32 = (addr - 0x6000) >>> 13;
        unchecked(this.PRG_map[b].addr = <i32>addr);
        unchecked(this.PRG_map[b].offset = (bank_num % this.num_PRG_banks) * 0x2000);
    }

    set_CHR_ROM_1k(b: u32, bank_num: u32): void {
        unchecked(this.CHR_map[b].offset = (bank_num % this.num_CHR_banks) * 0x0400);
    }

    remap(boot: bool = false): void {
        if (boot) {
            for (let i: u32 = 0; i < 5; i++) {
                this.PRG_map[i].data = this.PRG_ROM;
                this.PRG_map[i].ROM = true;
                this.PRG_map[i].RAM = false;
            }
            for (let i: u32 = 0; i < 8; i++) {
                this.CHR_map[i].data = this.CHR_ROM;
                this.CHR_map[i].addr = 0x400 * i;
                this.CHR_map[i].ROM = true;
                this.CHR_map[i].RAM = false;
            }
            if (this.PRG_RAM.length > 0) {
                this.PRG_map[0].set(0x6000, 0, false, true);
                this.PRG_map[0].data = this.PRG_RAM;
                this.PRG_map[0].RAM = true;
                this.PRG_map[0].ROM = false;
            }
            this.set_PRG_ROM(0xE000, this.num_PRG_banks-1);
        }

        if (this.status.PRG_mode === 0) {
            // 0 = 8000-9FFF swappable,
            //     C000-DFFF fixed to second-last bank
            // 1 = 8000-9FFF fixed to second-last bank
            //     C000-DFFF swappable
            this.set_PRG_ROM(0x8000, unchecked(this.regs.bank[6]));
            this.set_PRG_ROM(0xC000, this.num_PRG_banks-2);
        }
        else {
            this.set_PRG_ROM(0x8000, this.num_PRG_banks-2);
            this.set_PRG_ROM(0xC000, unchecked(this.regs.bank[6]));
        }
        this.set_PRG_ROM(0xA000, unchecked(this.regs.bank[7]));

        if (this.status.CHR_mode === 0) {
            // 2KB CHR banks 0, 1KB CHR banks at 1000
            this.set_CHR_ROM_1k(0, unchecked(this.regs.bank[0]) & 0xFE);
            this.set_CHR_ROM_1k(1, unchecked(this.regs.bank[0]) | 0x01);
            this.set_CHR_ROM_1k(2, unchecked(this.regs.bank[1]) & 0xFE);
            this.set_CHR_ROM_1k(3, unchecked(this.regs.bank[1]) | 0x01);
            this.set_CHR_ROM_1k(4, unchecked(this.regs.bank[2]));
            this.set_CHR_ROM_1k(5, unchecked(this.regs.bank[3]));
            this.set_CHR_ROM_1k(6, unchecked(this.regs.bank[4]));
            this.set_CHR_ROM_1k(7, unchecked(this.regs.bank[5]));
        }
        else {
            // 1KB CHR banks at 0, 2KB CHR banks at 1000
            this.set_CHR_ROM_1k(0, unchecked(this.regs.bank[2]));
            this.set_CHR_ROM_1k(1, unchecked(this.regs.bank[3]));
            this.set_CHR_ROM_1k(2, unchecked(this.regs.bank[4]));
            this.set_CHR_ROM_1k(3, unchecked(this.regs.bank[5]));
            this.set_CHR_ROM_1k(4, unchecked(this.regs.bank[0]) & 0xFE);
            this.set_CHR_ROM_1k(5, unchecked(this.regs.bank[0]) | 0x01);
            this.set_CHR_ROM_1k(6, unchecked(this.regs.bank[1]) & 0xFE);
            this.set_CHR_ROM_1k(7, unchecked(this.regs.bank[1]) | 0x01);
        }
    }

    @inline mirror_ppu_addr(addr: u32): u32 {
        if (this.ppu_mirror === -1) // 4-way mirror
            return addr;
        if (this.ppu_mirror === 1)
            return ((addr >>> 1) & 0x0400) | (addr & 0x03FF);
        return (addr & 0x0400) | (addr & 0x03FF);
    }

    CPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        if (addr < 0x2000)
            return unchecked(this.CPU_RAM[addr & 0x7FF]);
        if (addr < 0x4000)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        if (addr >= 0x6000)
            return unchecked(this.PRG_map[(addr - 0x6000) >>> 13]).read(addr, val, has_effect);
        return val;
    }

    CPU_write(addr: u32, val: u32): void {
        if (addr < 0x2000) {
            unchecked(this.CPU_RAM[addr & 0x7FF] = <u8>val);
            return;
        }
        if (addr < 0x4000)
            return this.bus.PPU_reg_write(addr, val);
        if (addr < 0x4020)
            return this.bus.CPU_reg_write(addr, val);

        if (addr < 0x6000) return;

        if (addr < 0x8000)
            return unchecked(this.PRG_map[(addr - 0x6000) >>> 13]).write(addr, val);

        switch(addr & 0xE001) {
            case 0x8000:
                this.regs.bank_select = val & 7;
                this.status.PRG_mode = (val & 0x40) >>> 6;
                this.status.CHR_mode = (val & 0x80) >>> 7;
                return;
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
    }

    @inline PPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        if (has_effect) this.a12_watch(addr);

        if (addr < 0x2000) return unchecked(this.CHR_map[addr >>> 10]).read(addr, val, has_effect);

        return unchecked(this.CIRAM[this.mirror_ppu_addr(addr)]);
    }

    PPU_write(addr: u32, val: u32): void {
        this.a12_watch(addr);
        if (addr < 0x2000) return;
        unchecked(this.CIRAM[this.mirror_ppu_addr(addr)] = <u8>val);
    }

    reset(): void {
        this.remap(true);
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
        console.log('MMC3 PRG RAM SIZE ' + cart.header.prg_ram_size.toString());
        this.PRG_RAM = new StaticArray<u8>(this.prg_ram_size);

        this.ppu_mirror = cart.header.mirroring;

        this.num_PRG_banks = cart.PRG_ROM.byteLength / 8192;
        this.num_CHR_banks = cart.CHR_ROM.byteLength / 1024;
        console.log('NUM CHR BANKS ' + this.num_CHR_banks.toString());
        this.remap(true);
    }
}
