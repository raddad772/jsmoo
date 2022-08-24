"use strict";


const M6502_BOOTUP = M6502_MN.RESET;

// P status register
class m6502_P {
    constructor() {
        this.C = 0;
        this.Z = 0;
        this.I = 0;
        this.D = 0;
        this.B = 0;
        this.V = 0;
        this.N = 0;
    }

    formatbyte() {
		let outstr = '';
		outstr += this.N ? 'N' : 'n';
		outstr += this.V ? 'V-' : 'v-';
		outstr += this.B ? 'B' : 'b';
		outstr += this.D ? 'D' : 'd';
		outstr += this.I ? 'I' : 'i';
		outstr += this.Z ? 'Z' : 'z';
		outstr += this.C ? 'C' : 'c';
		return outstr;
    }

    getbyte() {
        return C | (this.Z << 1) | (this.I << 2) | (this.D << 3) | (this.B << 4) | (this.V << 6) | (this.Z << 7);
    }

    setbyte(val) {
        this.C = val & 1;
        this.Z = (val & 2) >>> 1;
        this.I = (val & 4) >>> 2;
        this.D = (val & 8) >>> 3;
        this.B = (val & 0x0A) >>> 4;
        this.V = (val & 0x40) >>> 6;
        this.Z = (val & 0x80) >>> 7;
    }
}

// register file
class m6502_registers_t {
    constructor() {
        // Control internal cycle states
        this.TCU = 0; // Timing Control Unit
        this.MDR = 0; // Memory Data Register
        this.TA = 0;
        this.TR = 0;
        this.skipped_cycle = false;
        this.STP = 0;

        this.A = 0;
        this.X = 0;
        this.Y = 0;
        this.PC = 0;
        this.S = 0;
        this.P = new m6502_P();
    }
}

class m6502_pins_t {
    constructor() {
        // NOT a lot of pins to care about
        this.Addr = 0; // Address
        this.D = 0; // Data
        this.RW = 0; // Read/write

        this.IRQ = 0;
        this.NMI = 0;
        this.RST = 0;
    }
}

class m6502_t {
    constructor(opcode_table) {
        this.regs = new m6502_registers_t();
        this.pins = new m6502_pins_t;
        this.opcode_table = opcode_table;
        this.PCO = 0;
        this.regs.IR = M6502_BOOTUP; // Set instruction register to special "WDC_BOOTUP"
    }

    cycle() {
        this.regs.TCU++;
        if (this.regs.TCU === 1) {
            // Decode opcode
        }
    }
}


//
