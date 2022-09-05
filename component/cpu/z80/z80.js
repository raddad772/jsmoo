"use strict";

class z80_register_F_t {
    constructor() {
        this.S = 0;
        this.Z = 0;
        this.Y = 0;
        this.H = 0;
        this.X = 0;
        this.PV = 0;
        this.N = 0;
        this.C = 0;
    }

    getbyte() {
        return this.C | (this.N << 1) | (this.PV << 2) | (this.X << 3) | (this.H << 4) | (this.Y << 5) | (this.Z << 6) | (this.S << 7);
    }

    setbyte(val) {
        this.C = val & 1;
        this.N = (val & 2) >>> 1;
        this.PV = (val & 4) >>> 2;
        this.X = (val & 8) >>> 3;
        this.H = (val & 0x10) >>> 4;
        this.Y = (val & 0x20) >>> 5;
        this.Z = (val & 0x40) >>> 6;
        this.S = (val & 0x80) >>> 7;
    }

    formatbyte() {
		let outstr = '';
		outstr += this.S ? 'S' : 's';
		outstr += this.Z ? 'Z' : 'z';
		outstr += this.Y ? 'Y' : 'y';
		outstr += this.H ? 'H' : 'h';
		outstr += this.X ? 'X' : 'x';
		outstr += this.PV ? 'P' : 'p';
		outstr += this.N ? 'N' : 'n';
		outstr += this.C ? 'C' : 'c';
		return outstr;
    }
}

class z80_registers_t {
    constructor() {
        this.IR = 0;
        this.TCU = 0;

        // 8-bit registers
        this.A = 0;
        this.B = 0;
        this.C = 0;
        this.D = 0;
        this.E = 0;
        this.H = 0;
        this.L = 0;
        this.F = new z80_register_F_t();
        this.I = 0; // Iforget
        this.R = 0; // Refresh counter

        // Shadow registers
        this.Bs = 0;
        this.Cs = 0;
        this.Ds = 0;
        this.Es = 0;
        this.Hs = 0;
        this.Ls = 0;
        this.As = 0;
        this.Fs = 0;
        // For junk calculations
        this.junkvar = 0;

        // Temp registers for swapping
        this.Bt = 0;
        this.Ct = 0;
        this.Dt = 0;
        this.Et = 0;
        this.Ht = 0;
        this.Lt = 0;
        this.At = 0;
        this.Ft = 0;

        // 16-bit registers
        this.PC = 0;
        this.SP = 0;
        this.IX = 0;
        this.IY = 0;

        // Temporary registers
        this.t = new Int32Array(10);
        this.WZ = 0; // ?
        this.EI = 0; //"ei" executed last
        this.P = 0; //"ld a,i" or "ld a,r executed last
        this.Q = 0; // Opcode that updated flag registers executed last
        this.IFF1 = 0; // IRQ flipflip 1
        this.IFF2 = 0; // IRQ flipflop 2
        this.IM = 0; // Interrupt Mode
        this.HALT = 0; // If HALT was executed
    }

    exchange_shadow() {
        this.Bt = this.B;
        this.Ct = this.C;
        this.Dt = this.D;
        this.Et = this.E;
        this.Ht = this.H;
        this.Lt = this.L;

        this.B = this.Bs;
        this.C = this.Cs;
        this.D = this.Ds;
        this.E = this.Es;
        this.H = this.Hs;
        this.L = this.Ls;

        this.Bs = this.Bt;
        this.Cs = this.Ct;
        this.Ds = this.Dt;
        this.Es = this.Et;
        this.Hs = this.Ht;
        this.Ls = this.Lt;
    }

    exchange_shadow_af() {
        this.At = this.A;
        this.Ft = this.F;

        this.A = this.As;
        this.F = this.Fs;

        this.As = this.At;
        this.Fs = this.Ft;
    }
}

class z80_pins_t {
    constructor() {
        this.RES = 0;
        this.NMI = 0;
        this.Addr = 0;
        this.D = 0;

        this.RD = 0; // Read
        this.WR = 0; // Write
        this.IO = 0; // IO (1) or RAM (0) on low 8 bits of address bus
    }
}

class z80_t {
    constructor() {
        this.regs = new z80_registers_t();
        this.pins = new z80_pins_t();
    }
}