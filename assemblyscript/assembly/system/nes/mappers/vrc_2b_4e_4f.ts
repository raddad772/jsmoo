import {NES_mapper} from "./interface";
import {NES_bus, NES_clock} from "../nes_common";
import {MMC3b_map} from "./mmc3b";
import {NES_cart} from "../nes_cart";


// @ts-ignore
@inline function mess_up_addr(addr: u32): u32 {
    // Thanks Mesen! NESdev is not correct!
    let A0: u32 = addr & 0x01;
    let A1: u32 = (addr >>> 1) & 0x01;

    //VRC4e
    A0 |= (addr >> 2) & 0x01;
    A1 |= (addr >> 3) & 0x01;
    return (addr & 0xFF00) | (A1 << 1) | A0;
}

export class NES_VRC_IRQ {
    cycle_mode: u32 = 0
    enable: u32 = 0
    enable_after_ack: u32 = 0
    reload: i32 = 0
    prescaler: i32 = 341
    counter: i32 = 0
    bus: NES_bus

    constructor(bus: NES_bus) {
        this.bus = bus;
    }

    @inline cycle(): void {
        if (this.enable) {
            this.prescaler -= 3;
            if (this.cycle_mode || ((this.prescaler <= 0) && !this.cycle_mode)) {
                if (this.counter === 0xFF) {
                    this.counter = this.reload;
                    this.bus.CPU_notify_IRQ(1);
                } else {
                    this.counter++;
                }
                this.prescaler += 341;
            }
        }
    }
}

class mapper_io {
    wram_enabled: u32 = 0
    latch60: u32 = 0
    vrc4_banks_swapped: u32 = 0
    ppu_banks: StaticArray<u32> = new StaticArray<u32>(8);
    cpu_bank80: u32 = 0;
    cpu_banka0: u32 = 0;
}

export class NES_mapper_VRC2B_4E_4F implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    CHR_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    PRG_ROM: StaticArray<u8> = new StaticArray<u8>(0);
    CIRAM: StaticArray<u8> = new StaticArray<u8>(0x2000); // PPU RAM
    CPU_RAM: StaticArray<u8> = new StaticArray<u8>(8192); // CPU RAM
    PRG_RAM: StaticArray<u8> = new StaticArray<u8>(0);
    prg_ram_size: u32 = 0;


    PRG_map: StaticArray<MMC3b_map> = new StaticArray<MMC3b_map>(8);
    CHR_map: StaticArray<MMC3b_map> = new StaticArray<MMC3b_map>(8);

    num_CHR_banks: u32 = 0
    num_PRG_banks: u32 = 0

    is_vrc4: bool = false
    ppu_mirror: u32 = 0
    is_vrc2a: bool = false

    irq: NES_VRC_IRQ
    io: mapper_io = new mapper_io();

    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;

        this.irq = new NES_VRC_IRQ(bus);

        for (let i: u32 = 0; i < 8; i++) {
            this.PRG_map[i] = new MMC3b_map();
            this.CHR_map[i] = new MMC3b_map();
        }
    }

    @inline cycle(): void {
        if (!this.is_vrc4) return;
        this.irq.cycle();
    }

    set_CHR_ROM_1k(b: u32, bank_num: u32): void {
        this.CHR_map[b].offset = (bank_num % this.num_CHR_banks) * 0x0400;
    }

    set_PRG_ROM(addr: u32, bank_num: u32): void {
        let b = addr >>> 13;
        this.PRG_map[b].addr = addr;
        this.PRG_map[b].offset = (bank_num % this.num_PRG_banks) * 0x2000;
    }

    @inline PPU_read_effect(addr: u32): u32 {
        if (addr < 0x2000){
            const b = this.CHR_map[addr >>> 10];
            return unchecked(b.data[(addr - b.addr) + b.offset]);
        }
        return unchecked(this.CIRAM[this.mirror_ppu_addr(addr)]);
    }

    PPU_read_noeffect(addr: u32): u32 {
        return this.PPU_read_effect(addr);
    }

    PPU_write(addr: u32, val: u32): void {
        if (addr < 0x2000) return;
        unchecked(this.CIRAM[this.mirror_ppu_addr(addr)] = <u8>val);
    }

    set_ppu_lo(bank: u32, val: u32): void {
        let b: u32 = this.io.ppu_banks[bank];
        if (this.is_vrc2a) b <<= 1;

        b = (b & 0x1F0) | (val & 0x0F);

        if (this.is_vrc2a) b >>>= 1;
        this.io.ppu_banks[bank] = b;
        this.remap();
    }

    set_ppu_hi(bank: u32, val: u32): void {
        let b = this.io.ppu_banks[bank];
        if (this.is_vrc2a) b <<= 1;
        if (this.is_vrc4) val = (val & 0x1F) << 4;
        else val = (val & 0x0F) << 4;
        b = (b & 0x0F) | val;
        if (this.is_vrc2a) b >>>= 1;
        this.io.ppu_banks[bank] = b;
        this.remap();
    }

    @inline CPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        // Conventional RAM addr
        if (addr < 0x2000)
            return unchecked(this.CPU_RAM[addr & 0x7FF]);
        if (addr < 0x4000)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        // VRC mapping
        if (addr < 0x6000) return val;
        if (addr < 0x8000) {
            if (this.io.wram_enabled) return unchecked(this.PRG_RAM[addr - 0x6000]);
            // HMMMM....
            if (!this.is_vrc4) return (val & 0xFE) | this.io.latch60;
        }
        return unchecked(this.PRG_map[addr >>> 13]).read(addr);
    }

    CPU_write(addr: u32, val: u32): void {
        // Conventional CPU map
        if (addr < 0x2000) { // 0x0000-0x1FFF 4 mirrors of 2KB banks
            unchecked(this.CPU_RAM[addr & 0x7FF] = <u8>val);
            return;
        }
        if (addr < 0x4000) // 0x2000-0x3FFF mirrored PPU registers
            return this.bus.PPU_reg_write(addr, val);
        if (addr < 0x4020)
            return this.bus.CPU_reg_write(addr, val);
        if (addr < 0x6000) return;
        if (addr < 0x8000) {
            if (this.io.wram_enabled) {
                unchecked(this.PRG_RAM[addr - 0x6000] = <u8>val);
            }
            else if (!this.is_vrc4) {
                this.io.latch60 = val & 1;
            }
            return;
        }

        addr = mess_up_addr(addr) & 0xF00F;
        switch(addr) {
            case 0x8000:
            case 0x8001:
            case 0x8002:
            case 0x8003:
            case 0x8004:
            case 0x8005:
            case 0x8006:
                this.io.cpu_bank80 = val & 0x1F;
                this.remap();
                return;
            case 0x9000:
            case 0x9001:
            case 0x9002:
            case 0x9003:
            case 0x9004:
            case 0x9005:
            case 0x9006:
                if (this.is_vrc4 && (addr === 0x9002)) {
                    console.log('a1');
                    // wram control
                    this.io.wram_enabled = (val & 1);
                    // swap mode
                    this.io.vrc4_banks_swapped = (val & 2) >>> 1;
                }
                if (this.is_vrc4 && (addr === 0x9003)) {
                    console.log('a2');
                    return;
                }
                if (this.is_vrc4) this.ppu_mirror = val & 3;
                else this.ppu_mirror = val & 1;
                return;
            case 0xA000:
            case 0xA001:
            case 0xA002:
            case 0xA003:
            case 0xA004:
            case 0xA005:
            case 0xA006:
                this.io.cpu_banka0 = val & 0x1F;
                this.remap();
                return;
            case 0xF000: // IRQ latch low 4
                if (!this.is_vrc4) return;
                this.irq.reload = (this.irq.reload & 0xF0) | (val & 0x0F);
                return;
            case 0xF001: // IRQ latch hi 4
                if (!this.is_vrc4) return;
                this.irq.reload = (this.irq.reload & 0x0F) | ((val & 0x0F) << 4);
                return;
            case 0xF002: // IRQ control
                if (!this.is_vrc4) return;
                this.irq.prescaler = 341;
                if (val & 2) this.irq.counter = this.irq.reload;
                this.irq.cycle_mode = (val & 4) >>> 2;
                this.irq.enable = (val & 2) >>> 1;
                this.irq.enable_after_ack = (val & 1);
                return;
            case 0xF003: // IRQ ack
                if (!this.is_vrc4) return;
                this.irq.enable = this.irq.enable_after_ack;
                return;
        }
        // Thanks Messen! NESdev wiki was wrong here...
        if ((addr >= 0xB000) && (addr <= 0xE006)) {
            let rn = ((((addr >>> 12) & 0x07) - 3) << 1) + ((addr >>> 1) & 0x01);
            let lowBits = (addr & 0x01) === 0;
            if (lowBits) {
                //The other reg contains the low 4 bits
                this.set_ppu_lo(rn, val)
            } else {
                //One reg contains the high 5 bits
                this.set_ppu_hi(rn, val);
            }
        }
    }

    reset(): void {
        this.remap(true);
    }

    remap(boot: bool = false): void {
        if (boot) {
            this.io.vrc4_banks_swapped = 0;
            for (let i: u32 = 0; i < 8; i++) {
                this.PRG_map[i].data = this.PRG_ROM;
                this.PRG_map[i].addr = 0x2000 * i;
                this.PRG_map[i].ROM = true;
                this.PRG_map[i].RAM = false;

                this.CHR_map[i].data = this.CHR_ROM;
                this.CHR_map[i].addr = 0x400 * i;
                this.CHR_map[i].ROM = true;
                this.CHR_map[i].RAM = false;
            }

            this.PRG_map[0x6000 >>> 13].ROM = false;
            this.PRG_map[0x6000 >>> 13].RAM = true;
            this.PRG_map[0x6000 >>> 13].offset = 0;
            this.PRG_map[0x6000 >>> 13].data = this.PRG_RAM;
            this.set_PRG_ROM(0xE000, this.num_PRG_banks - 1);
        }

        if (this.is_vrc4 && this.io.vrc4_banks_swapped) {
            this.set_PRG_ROM(0x8000, this.num_PRG_banks - 2);
            this.set_PRG_ROM(0xA000, this.io.cpu_banka0);
            this.set_PRG_ROM(0xC000, this.io.cpu_bank80);
        } else {
            // VRC2
            this.set_PRG_ROM(0x8000, this.io.cpu_bank80);
            this.set_PRG_ROM(0xA000, this.io.cpu_banka0);
            this.set_PRG_ROM(0xC000, this.num_PRG_banks - 2);
        }
        this.set_CHR_ROM_1k(0, this.io.ppu_banks[0]);
        this.set_CHR_ROM_1k(1, this.io.ppu_banks[1]);
        this.set_CHR_ROM_1k(2, this.io.ppu_banks[2]);
        this.set_CHR_ROM_1k(3, this.io.ppu_banks[3]);
        this.set_CHR_ROM_1k(4, this.io.ppu_banks[4]);
        this.set_CHR_ROM_1k(5, this.io.ppu_banks[5]);
        this.set_CHR_ROM_1k(6, this.io.ppu_banks[6]);
        this.set_CHR_ROM_1k(7, this.io.ppu_banks[7]);
    }

    mirror_ppu_addr(addr: u32): u32 {
        switch(this.ppu_mirror) {
            case 0: //vertical mirroring
                return (addr & 0x0400) | (addr & 0x03FF);
            case 1: //horizontal mirroring
                return (addr >>> 1 & 0x0400) | (addr & 0x03FF);
            case 2: // one-screen first
                 return addr & 0x03FF;
            case 3: // one-screen second
                return 0x0400 | (addr & 0x03FF);
        }
        return 0;
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
        console.log('VRC2/4 PRG RAM SIZE ' + cart.header.prg_ram_size.toString());
        this.PRG_RAM = new StaticArray<u8>(this.prg_ram_size);

        this.num_PRG_banks = (cart.PRG_ROM.byteLength / 8192);
        this.num_CHR_banks = (cart.CHR_ROM.byteLength / 1024);
        console.log('Num PRG banks ' + this.num_PRG_banks.toString());
        console.log('Num CHR banks ' + this.num_CHR_banks.toString());
        this.remap(true);
    }

}