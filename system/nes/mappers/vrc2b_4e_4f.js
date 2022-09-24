"use strict";

class NES_mapper_VRC2B_4E_4F {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.CHR_ROM = [];
        this.PRG_ROM = [];
        this.CIRAM = new Uint8Array(0x2000); // Standard PPU RAM

        this.CPU_RAM = new Uint8Array(8192);

        this.PRG_map = [];
        this.CHR_map = [];

        /**
         * @type {MMC3b_map[]}
         */
        this.PRG_map = [];
        /**
         * @type {MMC3b_map[]}
         */
        this.CHR_map = []
        for (let i = 0; i < 8; i++) { // in 8k chunks
            this.PRG_map[i] = new MMC3b_map();
        }
        for (let i = 0; i < 8; i++) { // in 1k chunks
            this.CHR_map[i] = new MMC3b_map();
        }
        this.num_PRG_banks = 0;
        this.num_CHR_banks = 0;

        this.clock = clock;
        this.bus = bus;
        this.bus.CPU_read = this.cpu_read.bind(this);
        this.bus.CPU_write = this.cpu_write.bind(this);
        this.bus.PPU_read = this.ppu_read.bind(this);
        this.bus.PPU_write = this.ppu_write.bind(this);

        this.is_vrc4 = false;
        this.is_vrc2a = false;
        this.ppu_mirror = 0;
        this.irq = {
            cycle_mode: 0, // 1 = cycle mode, 0 = scanline mode
            enable: 0,
            enable_after_ack: 0,
            reload: 0,
            prescaler: 341,
            counter: 0,
        }

        this.io = {
            wram_enabled: 0,
            latch60: 0,
            vrc4: {
                banks_swapped: 0,
            },
            ppu: {
                banks: new Uint32Array(8)
            },
            cpu: {
                bank80: 0,
                banka0: 0,
            }
        }
    }

    cycle() {
        if (!this.is_vrc4) return;
        if (this.irq.enable) {
            this.irq.prescaler -= 3;
            if (this.irq.cycle_mode || ((this.irq.prescaler <= 0) && !this.irq.cycle_mode)) {
                if (this.irq.counter === 0xFF) {
                    this.irq.counter = this.irq.reload;
                    this.bus.CPU_notify_IRQ(1);
                } else {
                    this.irq.counter++;
                }
                this.irq.prescaler += 341;
            }
        }
    }

    a12_watch() {};

    remap(boot=false) {
        if (boot) {
            // VRC2 maps last c0 and e0 to last 2 banks
            this.io.vrc4.banks_swapped = 0;
            for (let i = 0; i < 8; i++) {
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

        if (this.is_vrc4 && this.io.vrc4.banks_swapped) {
            this.set_PRG_ROM(0x8000, this.num_PRG_banks - 2);
            this.set_PRG_ROM(0xA000, this.io.cpu.banka0);
            this.set_PRG_ROM(0xC000, this.io.cpu.bank80);
        } else {
            // VRC2
            this.set_PRG_ROM(0x8000, this.io.cpu.bank80);
            this.set_PRG_ROM(0xA000, this.io.cpu.banka0);
            this.set_PRG_ROM(0xC000, this.num_PRG_banks - 2);
        }
        this.set_CHR_ROM_1k(0, this.io.ppu.banks[0]);
        this.set_CHR_ROM_1k(1, this.io.ppu.banks[1]);
        this.set_CHR_ROM_1k(2, this.io.ppu.banks[2]);
        this.set_CHR_ROM_1k(3, this.io.ppu.banks[3]);
        this.set_CHR_ROM_1k(4, this.io.ppu.banks[4]);
        this.set_CHR_ROM_1k(5, this.io.ppu.banks[5]);
        this.set_CHR_ROM_1k(6, this.io.ppu.banks[6]);
        this.set_CHR_ROM_1k(7, this.io.ppu.banks[7]);
    }

    set_CHR_ROM_1k(b, bank_num) {
        this.CHR_map[b].offset = (bank_num % this.num_CHR_banks) * 0x0400;
    }

    set_PRG_ROM(addr, bank_num) {
        let b = addr >>> 13;
        this.PRG_map[b].addr = addr;
        this.PRG_map[b].offset = (bank_num % this.num_PRG_banks) * 0x2000;
    }

    mirror_ppu_addr(addr) {
        switch(this.ppu_mirror) {
            case 0: //vertical mirroring
                return (addr & 0x0400) | (addr & 0x03ff);
            case 1: //horizontal mirroring
                return (addr >>> 1 & 0x0400) | (addr & 0x03ff);
            case 2: // one-screen first
                 return addr & 0x03ff;
            case 3: // one-screen second
                return 0x0400 | (addr & 0x03ff);
        }
    }

    ppu_write(addr, val) {
        if (addr < 0x2000) return;
        this.CIRAM[this.mirror_ppu_addr(addr)] = val;
    }

    ppu_read(addr, val, has_effect=true) {
        if (addr < 0x2000)
            return this.CHR_map[addr >>> 10].read(addr, val, has_effect)
        return this.CIRAM[this.mirror_ppu_addr(addr)];
    }

    set_ppu_lo(bank, val) {
        let b = this.io.ppu.banks[bank];
        if (this.is_vrc2a) b <<= 1;

        b = (b & 0x1F0) | (val & 0x0F);

        if (this.is_vrc2a) b >>>= 1;
        this.io.ppu.banks[bank] = b;
        this.remap();
    }

    set_ppu_hi(bank, val) {
        let b = this.io.ppu.banks[bank];
        if (this.is_vrc2a) b <<= 1;
        if (this.is_vrc4) val = (val & 0x1F) << 4;
        else val = (val & 0x0F) << 4;
        b = (b & 0x0F) | val;
        if (this.is_vrc2a) b >>>= 1;
        this.io.ppu.banks[bank] = b;
        this.remap();
    }

    mess_up_addr(addr) {
        // Thanks Mesen! NESdev is not correct!
        let A0 = addr & 0x01;
        let A1 = (addr >>> 1) & 0x01;

        //VRC4e
        A0 |= (addr >> 2) & 0x01;
        A1 |= (addr >> 3) & 0x01;
        return (addr & 0xFF00) | (A1 << 1) | A0;
    }

    cpu_write(addr, val) {
        // Conventional CPU map
        if (addr < 0x2000) { // 0x0000-0x1FFF 4 mirrors of 2KB banks
            this.CPU_RAM[addr & 0x7FF] = val;
            return;
        }
        if (addr < 0x4000) { // 0x2000-0x3FFF mirrored PPU registers
            this.bus.PPU_reg_write(addr, val);
            return;
        }
        if (addr < 0x4020) { // 0x4000-0x401F CPU registers
            this.bus.CPU_reg_write(addr, val);
            return;
        }
        if (addr < 0x6000) return;
        if (addr < 0x8000) {
            if (this.io.wram_enabled) {
                this.PRG_RAM[addr - 0x6000] = val;
                return;
            }
            else if (!this.is_vrc4) {
                this.io.latch60 = val & 1;
                return;
            }
        }

        addr = this.mess_up_addr(addr) & 0xF00F;
        switch(addr) {
            case 0x8000:
            case 0x8001:
            case 0x8002:
            case 0x8003:
            case 0x8004:
            case 0x8005:
            case 0x8006:
                this.io.cpu.bank80 = val & 0x1F;
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
                    this.io.vrc4.banks_swapped = (val & 2) >>> 1;
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
                this.io.cpu.banka0 = val & 0x1F;
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
                //_loCHRRegs[regNumber] = value & 0x0F;
            } else {
                //One reg contains the high 5 bits
                //_hiCHRRegs[regNumber] = value & 0x1F;
                this.set_ppu_hi(rn, val);
            }
        }

    }

    cpu_read(addr, val, has_effect=true) {
        // Conventional CPU map
        if (addr < 0x2000)
            return this.CPU_RAM[addr & 0x7FF];
        if (addr < 0x4000)
            return this.bus.PPU_reg_read(addr, val, has_effect);
        if (addr < 0x4020)
            return this.bus.CPU_reg_read(addr, val, has_effect);
        // VRC mapping
        if (addr < 0x6000) return val;
        if (addr < 0x8000) {
            if (this.io.wram_enabled) return this.PRG_RAM[addr - 0x6000];
            if (!this.io.vrc4) return (val & 0xFE) | this.io.latch60;
        }
        return this.PRG_map[addr >>> 13].read(addr, val, has_effect);
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
        console.log('VRC2/4 PRG RAM SIZE', cart.header.prg_ram_size);
        if (this.prg_ram_size !== 0) {
            this.PRG_RAM = new Uint8Array(this.prg_ram_size);
        }
        else {
            this.PRG_RAM = [];
        }

        this.num_PRG_banks = (this.PRG_ROM.byteLength / 8192);
        this.num_CHR_banks = (this.CHR_ROM.byteLength / 1024);
        console.log('Num PRG banks', this.num_PRG_banks);
        console.log('Num CHR banks', this.num_CHR_banks);
        this.remap(true);
    }

}
