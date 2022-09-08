"use strict";

const Z80P = Object.freeze({
    HL: 0,
    IX: 1,
    IY: 2
});


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

        // Internal registers
        this.IRQ_vec = null;
        this.rprefix = Z80P.HL;
        this.prefix = 0x00;
    }

    inc_R() {
        this.R = (this.R + 1) & 0x7F;
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
        this.RES = 0; // RESET
        this.NMI = 0; // NMI
        this.IRQ = 0; // IRQ
        this.Addr = 0; // Address/port number
        this.D = 0; // Data

        this.RD = 0; // Read
        this.WR = 0; // Write
        this.IO = 0; // IO request
        this.MRQ = 0; // Memory request
    }
}

class z80_t {
    constructor(CMOS) {
        this.regs = new z80_registers_t();
        this.pins = new z80_pins_t();
        this.CMOS = CMOS;

        this.IRQ_pending = false;
        this.IRQ_ack = false;

        this.NMI_pending = false;
        this.NMI_ack = false;

        this.trace_on = false;
        this.trace_cycles = 0;

        this.trace_peek = function(addr, val, has_effect) { return 0xCD; }
        this.PCO = 0;
    }

    enable_tracing(trace_peek) {
        if (this.trace_on) return;
        this.trace_on = false;
        this.trace_cycles = 0;
        this.trace_peek = trace_peek;
    }

    disable_tracing() {
        if (!this.trace_on) return;
        this.trace_on = false;
    }

    reset() {
        this.regs.rprefix = Z80P.HL;
        this.regs.prefix = 0x00;
        this.regs.A = 0xFF;
        this.regs.F.setbyte(0xFF);
        this.regs.B = this.regs.C = this.regs.D = this.regs.E = 0;
        this.regs.H = this.regs.L = this.regs.IX = this.regs.IY = 0;
        this.regs.WZ = this.regs.PC = 0;
        this.regs.SP = 0xFFFF;
        this.regs.EI = this.regs.P = this.regs.Q = 0;
        this.regs.HALT = this.regs.IFF1 = this.regs.IFF2 = 0;
        this.regs.IM = 1;

        this.regs.As = this.regs.Fs = this.regs.Bs = this.regs.Cs = 0;
        this.regs.Ds = this.regs.Es = this.regs.Hs = this.regs.Ls = 0;

        this.IRQ_pending = this.NMI_pending = this.IRQ_ack = this.NMI_ack = false;
        this.regs.IRQ_vec = null;

        this.regs.IR = Z80_S_RESET;
        this.current_instruction = Z80_fetch_decoded(this.regs.IR, 0x00);
        this.regs.TCU = 0;
    }

    notify_IRQ(){
        this.irq();
    }

    irq(irq_vec=0x0000) {
        if (this.regs.IRQ_vec === null) this.regs.IRQ_vec = irq_vec;
        this.IRQ_pending = true;
        this.IRQ_ack = false;
    }

    set_pins_opcode() {
        this.pins.RD = 1;
        this.pins.MRQ = 1;
        this.pins.WR = 0;
        this.pins.IO = 0;
        this.pins.Addr = this.regs.PC;
        this.regs.PC = (this.regs.PC + 1) & 0xFFFF;
    }

    set_pins_nothing() {
        this.pins.RD = this.pins.MRQ = 0;
        this.pins.WR = this.pins.IO = 0;
    }

    set_instruction(to) {
        this.IR = to;
        this.current_instruction = Z80_fetch_decoded(this.IR, this.regs.prefix);
        this.regs.TCU = 0;
    }

    ins_cycles() {
        switch(this.regs.TCU) {
            // 1-4 is fetch next thing and interpret
            case 0: // already handled by fetch of next instruction starting
                break;
            case 1:
                if (this.regs.HALT) { this.regs.TCU = 0; break; }
                if (this.NMI_pending && !this.NMI_ack) {
                    console.log('NMI not implemented yet')
                    this.NMI_ack = true;
                    if (dbg.brk_on_NMIRQ) dbg.break(D_RESOURCE_TYPES.Z80);
                }
                else if (this.IRQ_pending && !this.IRQ_ack) {
                    this.IRQ_ack = true;
                    this.pins.D = 0xFF;
                    this.regs.PC = (this.regs.PC - 1) & 0xFFFF;
                    this.set_instruction(Z80_S_IRQ);
                    if (dbg.brk_on_NMIRQ) dbg.break();
                    break;
                }
                this.regs.t[0] = this.pins.D;
                this.pins.RD = 0;
                this.pins.MRQ = 0;
                break;
            case 2:
                this.regs.inc_R();
                break;
            case 3:
                // If we need to fetch another, start that and set TCU back to 1
                if (this.regs.t[0] === 0xDD) { this.regs.prefix = 0xDD; this.regs.rprefix = Z80P.IX; this.set_pins_opcode(); this.regs.TCU = 0; break; }
                if (this.regs.t[0] === 0xfD) { this.regs.prefix = 0xFD; this.regs.rprefix = Z80P.IY; this.set_pins_opcode(); this. regs.TCU = 0; break; }
                // elsewise figure out what to do next
                // this gets a little tricky
                // 4, 5, 6, 7, 8, 9, 10, 11, 12 = rprefix != HL and is CB, execute CBd
                if ((this.regs.t[0] === 0xCB) && (this.regs.rprefix !== Z80P.HL)) {
                    this.regs.prefix = (this.regs.prefix << 8) | 0xCB;
                    break;
                }
                // . so 13, 14, 15, 16. opcode, then immediate execution CB
                else if (this.regs.t[0] === 0xCB) {
                    this.regs.prefix = 0xCB;
                    this.regs.TCU = 12;
                    break;
                }
                // reuse 13-16
                else if (this.regs.t[0] === 0xED) {
                    this.regs.prefix = 0xED;
                    this.regs.TCU = 12;
                    break;
                }
                else {
                    this.set_instruction(this.regs.t[0]);
                    break;
                }
            case 4: // CBd begins here, as does operand()
                this.regs.WZ = (this.regs.H << 8) | this.regs.L;
                this.set_pins_opcode();
                break;
            case 5:
                this.regs.WZ = (this.regs.WZ + mksigned8(this.pins.D)) & 0xFFFF;
                this.set_pins_nothing();
                break;
            case 6: // last step of operand
                break;
            case 7: // wait a cycle
                break;
            case 8: // wait one more cycle
                break;
            case 9: // start opcode fetch
                this.set_pins_opcode();
                break;
            case 10:
                this.set_pins_nothing();
                this.regs.t[0] = this.pins.D;
                break;
            case 11: // cycle 3 of opcode tech
                break;
            case 12: // cycle 4 of opcode fetch. execute instruction!
                this.set_instruction(this.regs.t[0]);
                break;
            case 13: // CB regular and ED regular starts here
                this.regs.inc_R();
                this.set_pins_opcode();
                break;
            case 14:
                this.regs.t[0] = this.pins.D;
                this.set_pins_nothing();
                break;
            case 15:
                break;
            case 16:
                // execute from ED now
                this.set_instruction(this.regs.t[0]);
                break;
            default:
                console.log('HOW DID WE GET HERE!?');
                break;
        }
    }

	trace_format(da_out, PCO) {
		let outstr = trace_start_format('Z80', Z80_COLOR, this.trace_cycles-1, ' ', PCO);
		// General trace format is...
		outstr += da_out.disassembled;
		let sp = da_out.disassembled.length;
		while(sp < TRACE_INS_PADDING) {
			outstr += ' ';
			sp++;
		}

		outstr += 'PC:' + hex4(this.regs.PC) + ' ';
		outstr += ' A:' + hex2(this.regs.A);
		outstr += ' B:' + hex2(this.regs.B);
		outstr += ' C:' + hex2(this.regs.C);
		outstr += ' D:' + hex2(this.regs.D);
		outstr += ' E:' + hex2(this.regs.E);
		outstr += ' H:' + hex2(this.regs.H);
		outstr += ' L:' + hex2(this.regs.L);
		outstr += ' SP:' + hex4(this.regs.SP);
		outstr += ' IX:' + hex4(this.regs.IX);
		outstr += ' IY:' + hex4(this.regs.IY);
		outstr += ' F:' + this.regs.F.formatbyte();
        return outstr;
	}

    cycle() {
        this.regs.TCU++;
        if (this.regs.IR === Z80_S_DECODE) {
            // Long logic to decode opcodes and decide what to do
            if (this.regs.TCU === 1) this.PCO = (this.pins.Addr - 1) & 0xFFFF;
            this.ins_cycles();
            if ((this.trace_on) && (this.regs.TCU === 1)) {
                dbg.traces.add(TRACERS.Z80, this.trace_cycles-1, this.trace_format(Z80_disassemble(this.PCO, this.IR, this.trace_peek), this.PCO));
            }
        } else {
            // Execute an actual opcode
            this.current_instruction.exec_func(this.regs, this.pins);
        }
    }
}