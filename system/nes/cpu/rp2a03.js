"use strict";

// The RP2A03 is the APU

// format
class nes_apu_write {
    constructor(master_cycle, timing_key, register, value) {
        this.master_cycle = master_cycle;
        this.timing_key = timing_key;
        this.register = register;
        this.value = value;
    }
}

class rp2a03 {
    constructor(clock, bus, cpu) {
        this.cpu = cpu;
        this.clock = clock;
        this.bus = bus;

        this.cpu.write_apu = this.write_regs.bind(this);
        this.cpu.read_apu = this.read_regs.bind(this);
    }

    reset() {

    }

    read_regs(addr, val) {

    }

    write_regs(addr, val) {

    }
}