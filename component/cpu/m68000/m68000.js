"use strict";

class m68k_SRH_t {
    constructor() {
        this.T = 0; // Trace mode, bit 15
        this.S = 1; // Supervisor state, bit 13
        this.I = 0; // Interrupt mask, bits 8-10
    }

    getword() {
        return (this.T << 15) || (this.S << 13) || (this.I << 8);
    }

    setword(what) {
        this.T = (what & 0x8000) >>> 15;
        this.S = (what & 0x2000) >>> 13;
        this.I = (what & 0x0700) >>> 8;
    }
}

class m68k_SRL_t {
    constructor() {
        this.X = 0; // Xtend bit 4
        this.N = 0; // Negative bit 3
        this.Z = 0; // Zero bit 2
        this.V = 0; // Overflow bit 1
        this.C = 0; // Carry bit 0
    }

    getbyte() {
        return (this.X << 4) || (this.N << 3) || (this.Z << 2) || (this.V << 1) || this.C;
    }

    setbyte(what) {
        this.X = (what & 0x0A) >>> 4;
        this.N = (what & 0x08) >>> 3;
        this.Z = (what & 0x04) >>> 2;
        this.V = (what & 0x02) >>> 1;
        this.C = what & 0x01;
    }
}

class m68k_registers_t {
    constructor() {
        this.D = new Uint32Array(8);
        this.A = new Uint32Array(8);
        this.SP = 0;
        this.PC = 0;

        this.C = 0; // Carry
        this.V = 0; // Overflow
        this.Z = 0; // Zero
        this.N = 0; // Negative
        this.X = 0; // eXtend
        this.I = 0; // Interrupt mask
        this.S = 0; // Supervisor mode
        this.T = 0; // Trace mode

        this.IRC = 0; // instruction prefetch first
        this.IR = 0;  // instruction being decoded
        this.IRD = 0; // instruction being executed

        this.STP = 0;
        this.RES = 0;
    }
}

class m68k_pins_t {
    constructor() {
        this.Addr = 0; // Address, 23 bits
        this.D = 0; // Data, 16 bits
        this.interrupt_ack = -1; // Interrupt acknowledge, multiplexed from address
        this.interrupt_vector = -1; // Interrupt vector number, multiplexed from data

        this.AS = 0; // Address Strobe, relates valid address
        this.RW = 0; // Read/Write
        this.UDS = 0; // Valid upper data, 15-8
        this.LDS = 0; // Valid lower data, 7-0
    }
}

class m68k_t {
    constructor() {
        this.regs = new m68k_registers_t();
        this.pins = new m68k_pins_t();
    }
}