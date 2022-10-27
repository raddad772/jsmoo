"use strict";

class SM83_regs_F {
    constructor() {
        this.Z = 0;
        this.N = 0;
        this.H = 0;
        this.C = 0;
    }

    getbyte() {
        return (this.C << 4) | (this.H << 5) | (this.N << 6) | (this.Z << 7);
    }

    setbyte(val) {
        this.C = (val & 0x10) >>> 4;
        this.H = (val & 0x20) >>> 5;
        this.N = (val & 0x40) >>> 6;
        this.Z = (val & 0x80) >>> 7;
    }
}

class SM83_regs_t {
    constructor() {
        // CPU registers
        this.A = 0;
        this.F = new SM83_regs_F();
        this.B = 0;
        this.C = 0;
        this.D = 0;
        this.E = 0;
        this.H = 0;
        this.L = 0;
        this.SP = 0;
        this.PC = 0;

        this.EI = 0;
        this.HLT = 0;
        this.STP = 0;
        this.IME = 0;

        this.halt_bug = 0;

        this.interrupt_latch = 0;
        this.interrupt_flag = 0;


        // internal/speculative
        this.TCU = 0; // "Timing Control Unit" basically which cycle of an op we're on
        this.IR = 0; // "Instruction Register" currently-executing register

        this.TR = 0; // Temporary Register
        this.TA = 0; // Temporary Address
        this.RR = 0; // Remorary Register

    }

    stoppable() {
        return false;
    }
}

class SM83_pins_t {
    constructor() {
        this.RD = 0; // External read request
        this.WR = 0; // External write request
        this.MRQ = 0; // Extermal memory request
        this.IRQ0 = 0;
        this.IRQ0_ack = 0;
        this.IRQ1 = 0;
        this.IRQ1_ack = 0;
        this.IRQ2 = 0;
        this.IRQ2_ack = 0;
        this.IRQ3 = 0;
        this.IRQ3_ack = 0;
        this.IRQ4 = 0;
        this.IRQ4_ack = 0;
        // IRQ5-7 are not connected in gameboy

        this.D = 0; // Data; 8 bits
        this.Addr = 0; // Address; 16 bits
    }
}

class SM83_t {
    constructor() {
        this.regs = new SM83_regs_t();
        this.pins = new SM83_pins_t();
    }

    cycle() {

    }
}