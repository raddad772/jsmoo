"use strict";

//let Z80_TRACE_BRK = 37451979;
let Z80_TRACE_BRK = -1;
let Z80_INS_BRK = 0x0A; // NOP
//let Z80_PC_BRK = 0x0EDF; //0x0C0A;

let Z80_PC_BRK = -1; //5713457;
//let Z80_PC_BRK = 0x082A;

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

    serialize() {
        return this.getbyte();
    }

    deserialize(from) {
        this.setbyte(from);
        return true;
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

const SER_z80_registers_t = [
    'IR', 'TCU', 'A', 'B', 'C', 'D', 'E', 'F', 'H', 'L',
    'I', 'R', 'AF_', 'BC_', 'DE_', 'HL_', 'junkvar',
    'AFt', 'BCt', 'DEt', 'HLt', 'Ht', 'Lt',
    'PC', 'SP', 'IX', 'IY',
    't', 'WZ', 'EI', 'P', 'Q', 'IFF1', 'IFF2', 'IM', 'HALT',
    'IRQ_vec', 'rprefix', 'prefix', 'poll_IRQ'
]

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
        this.AF_ = 0;
        this.BC_ = 0;
        this.DE_ = 0;
        this.HL_ = 0;
        // For junk calculations
        this.junkvar = 0;

        // Temp registers for swapping
        this.AFt = 0;
        this.BCt = 0;
        this.DEt = 0;
        this.HLt = 0;
        this.Ht = 0;
        this.Lt = 0;

        // 16-bit registers
        this.PC = 0;
        this.SP = 0;
        this.IX = 0;
        this.IY = 0;

        this.t = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.WZ = 0; // ?
        this.EI = 0; //"ei" executed last
        this.P = 0; //"ld a,i" or "ld a,r executed last
        this.Q = 0; // Opcode that updated flag registers executed last
        this.IFF1 = 0; // IRQ flipflip 1
        this.IFF2 = 0; // IRQ flipflop 2
        this.IM = 0; // Interrupt Mode
        this.HALT = 0; // If HALT was executed

        this.data = 0;

        // Internal registers
        this.IRQ_vec = null;
        this.rprefix = Z80P.HL;
        this.prefix = 0x00;

        this.poll_IRQ = false;
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_z80_registers_t);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG Z80 VERSION');
            return false;
        }
        return deserialization_helper(this, from, SER_z80_registers_t);
    }

    inc_R() {
        this.R = (this.R & 0x80) | ((this.R + 1) & 0x7F);
    }

    exchange_shadow() {
        this.BCt = (this.B << 8) | this.C;
        this.DEt = (this.D << 8) | this.E;
        this.HLt = (this.H << 8) | this.L;

        this.B = (this.BC_ & 0xFF00) >>> 8;
        this.C = this.BC_ & 0xFF;
        this.D = (this.DE_ & 0xFF00) >>> 8;
        this.E = this.DE_ & 0xFF;
        this.H = (this.HL_ & 0xFF00) >>> 8;
        this.L = this.HL_ & 0xFF;

        this.BC_ = this.BCt;
        this.DE_ = this.DEt;
        this.HL_ = this.HLt;
    }

    exchange_de_hl() {
        this.Ht = this.H;
        this.Lt = this.L;
        this.H = this.D;
        this.L = this.E;
        this.D = this.Ht;
        this.E = this.Lt;
    }

    exchange_shadow_af() {
        this.AFt = (this.A << 8) | this.F.getbyte();

        this.A = (this.AF_ & 0xFF00) >>> 8;
        this.F.setbyte(this.AF_ & 0xFF);

        this.AF_ = this.AFt;
    }
}

const SER_z80_pins_t = [
    'RES', 'NMI', 'IRQ', 'Addr', 'D',
    'IRQ_maskable', 'RD', 'WR', 'IO', 'MRQ'
];

class z80_pins_t {
    constructor() {
        this.RES = 0; // RESET
        this.NMI = 0; // NMI
        this.IRQ = 0; // IRQ
        this.Addr = 0; // Address/port number
        this.D = 0; // Data

        this.IRQ_maskable = 1; // Ummm

        this.RD = 0; // Read
        this.WR = 0; // Write
        this.IO = 0; // IO request
        this.MRQ = 0; // Memory request
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_z80_pins_t);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG Z80 PINS VERSION');
            return false;
        }
        return deserialization_helper(this, from, SER_z80_pins_t);
    }
}

const SER_z80_t = [
    'regs', 'pins', 'CMOS', 'IRQ_pending',
    'NMI_pending', 'NMI_ack', 'PCO', 'prefix_was'
];

class z80_t {
    constructor(CMOS) {
        this.regs = new z80_registers_t();
        this.pins = new z80_pins_t();
        this.CMOS = CMOS;

        this.prefix_was = 0; // For serial

        this.IRQ_pending = false;

        this.NMI_pending = false;
        this.NMI_ack = false;

        this.trace_on = false;
        this.trace_cycles = 0;
        this.last_trace_cycle = 0;

        this.current_instruction = null;

        this.trace_peek = function(addr, val, has_effect) { debugger; return 0xCD;}
        this.PCO = 0;
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_z80_t);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG Z80 version');
            return false;
        }
        let r = deserialization_helper(this, from, SER_z80_pins_t);
        if (this.regs.IR !== Z80_S_DECODE) {
            this.current_instruction = Z80_fetch_decoded(this.regs.IR, this.prefix_was);
        }
        return r;
    }

    enable_tracing(trace_peek=null) {
        this.trace_on = true;
        //this.trace_cycles = 0;
        if (trace_peek !== null)
            this.trace_peek = trace_peek;
    }

    disable_tracing() {
        if (!this.trace_on) return;
        this.trace_on = false;
    }

    reset(PC_VEC=0) {
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

        this.IRQ_pending = this.NMI_pending = this.NMI_ack = false;
        this.regs.IRQ_vec = null;

        this.regs.IR = Z80_S_RESET;
        this.current_instruction = Z80_fetch_decoded(this.regs.IR, 0x00);
        this.regs.TCU = 0;
    }

    notify_IRQ(level) {
        this.IRQ_pending = !!level;
    }

    notify_NMI(level) {
        if (!level && this.NMI_ack) { this.NMI_ack = false; }// level 0, NMI already ack'd
        this.NMI_pending ||= level;
    }

    set_pins_opcode() {
        this.pins.RD = 0;
        this.pins.MRQ = 0;
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
        this.regs.IR = to;
        if ((to === Z80_INS_BRK) && dbg.watch_on) {
            console.log('Z80 INS BRK');
            dbg.break();
        }
        this.current_instruction = Z80_fetch_decoded(this.regs.IR, this.regs.prefix);
        this.prefix_was = this.regs.prefix;
        if (this.PCO === Z80_PC_BRK) dbg.break();
        this.regs.TCU = 0;
        this.regs.prefix = 0;
        this.regs.rprefix = Z80P.HL;
    }

    ins_cycles() {
        switch(this.regs.TCU) {
            // 1-4 is fetch next thing and interpret
            // addr T0-1
            // REFRESH on addr T2-3
            // MREQ on T1
            // RD on T1
            // data latch T2
            case 0: // already handled by fetch of next instruction starting
                this.set_pins_opcode();
                //this.regs.rprefix = Z80P.HL;
                //this.regs.prefix = 0;
                break;
            case 1: // T1 MREQ, RD
                if (this.regs.HALT) { this.regs.TCU = 0; break; }
                if (this.regs.poll_IRQ) {
                    // Make sure we only do this at start of an instruction
                    this.regs.poll_IRQ = false;
                    if (this.NMI_pending && !this.NMI_ack) {
                        this.NMI_pending = false;
                        this.NMI_ack = true;
                        this.regs.IRQ_vec = 0x66;
                        this.pins.IRQ_maskable = false;
                        this.set_instruction(Z80_S_IRQ);
                        if (dbg.brk_on_NMIRQ) {
                            console.log('NMI', this.trace_cycles);
                            dbg.break(D_RESOURCE_TYPES.Z80);
                        }
                    } else if (this.IRQ_pending && this.regs.IFF1 && (!(this.regs.EI))) {
                        this.pins.D = 0xFF;
                        this.regs.PC = (this.regs.PC - 1) & 0xFFFF;
                        this.pins.IRQ_maskable = true;
                        this.regs.IRQ_vec = 0x38;
                        this.pins.D = 0xFF;
                        this.set_instruction(Z80_S_IRQ);
                        if (dbg.brk_on_NMIRQ) {
                            //console.log(this.trace_cycles);
                            dbg.break();
                        }
                    }
                }
                this.pins.RD = 1;
                this.pins.MRQ = 1;
                break;
            case 2: // T2, RD to 0 and data latch, REFRESH and MRQ=1 for REFRESH
                this.pins.RD = 0;
                this.pins.MRQ = 0;
                this.regs.t[0] = this.pins.D;
                this.pins.Addr = (this.regs.I << 8) | this.regs.R;
                break;
            case 3: // T3 not much here
                //this.pins.MRQ = 0;
                // If we need to fetch another, start that and set TCU back to 1
                this.regs.inc_R();
                if (this.regs.t[0] === 0xDD) { this.regs.prefix = 0xDD; this.regs.rprefix = Z80P.IX; this.regs.TCU = -1; break; }
                if (this.regs.t[0] === 0xfD) { this.regs.prefix = 0xFD; this.regs.rprefix = Z80P.IY; this.regs.TCU = -1; break; }
                // elsewise figure out what to do next
                // this gets a little tricky
                // 4, 5, 6, 7, 8, 9, 10, 11, 12 = rprefix != HL and is CB, execute CBd
                if ((this.regs.t[0] === 0xCB) && (this.regs.rprefix !== Z80P.HL)) {
                    this.regs.prefix = ((this.regs.prefix << 8) | 0xCB) & 0xFFFF;
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
                    //this.regs.prefix = 0x00;
                    this.set_instruction(this.regs.t[0]);
                    break;
                }
            case 4: // CBd begins here, as does operand()
                //
                switch(this.regs.rprefix) {
                    case Z80P.HL:
                        this.regs.WZ = (this.regs.H << 8) | this.regs.L;
                        break;
                    case Z80P.IX:
                        this.regs.WZ = this.regs.IX;
                        break;
                    case Z80P.IY:
                        this.regs.WZ = this.regs.IY;
                        break;
                }
                this.set_pins_opcode();
                break;
            case 5: // operand() middle
                this.pins.RD = 1;
                this.pins.MRQ = 1;
                break;
            case 6: // operand() end
                this.regs.WZ = (this.regs.WZ + mksigned8(this.pins.D)) & 0xFFFF;
                this.set_pins_nothing();
                this.regs.TCU += 2;
                break;
            case 7: // wait a cycle
                break;
            case 8: // wait one more cycle
                break;
            case 9: // start opcode fetch
                this.set_pins_opcode();
                break;
            case 10:
                this.pins.RD = 1;
                this.pins.MRQ = 1;
                break;
            case 11: // cycle 3 of opcode tech
                this.set_pins_nothing();
                this.regs.t[0] = this.pins.D;
                this.set_instruction(this.regs.t[0]);
                break;
            case 12: // cycle 4 of opcode fetch. execute instruction!
                //this.set_instruction(this.regs.t[0]);
                break;
            case 13: // CB regular and ED regular starts here
                this.set_pins_opcode();
                break;
            case 14:
                this.pins.MRQ = 1;
                this.pins.RD = 1;
                break;
            case 15:
                this.pins.Addr = (this.regs.I << 8) | this.regs.R;
                this.regs.inc_R();
                this.regs.t[0] = this.pins.D;
                this.set_pins_nothing();
                break;
            case 16:
                // execute from CB or ED now
                this.set_instruction(this.regs.t[0]);
                break;
            default:
                console.log('HOW DID WE GET HERE!?');
                break;
        }
    }

	trace_format(da_out, PCO) {
		let outstr = trace_start_format('Z80', Z80_COLOR, this.trace_cycles, ' ', PCO);
		// General trace format is...
		outstr += da_out.disassembled;
		let sp = da_out.disassembled.length;
		while(sp < TRACE_INS_PADDING) {
			outstr += ' ';
			sp++;
		}

		outstr += 'TCU:' + this.regs.TCU + ' ';
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
        outstr += ' I:' + hex2(this.regs.I);
        outstr += ' R:' + hex2(this.regs.R);
        outstr += ' WZ:' + hex4(this.regs.WZ);
		outstr += ' F:' + this.regs.F.formatbyte();
        return outstr;
	}

    cycle() {
        this.regs.TCU++;
        this.trace_cycles++;
        if (this.trace_cycles === Z80_TRACE_BRK) {
            console.log('TRACE BREAK')
            dbg.break();
        }
        if (this.regs.IR === Z80_S_DECODE) {
            // Long logic to decode opcodes and decide what to do
            if ((this.regs.TCU === 1) && (this.regs.prefix === 0)) this.PCO = this.pins.Addr;
            this.ins_cycles();
        } else {
            if (this.trace_on && this.regs.TCU === 1) {
                this.last_trace_cycle = this.PCO;
                dbg.traces.add(TRACERS.Z80, this.trace_cycles, this.trace_format(Z80_disassemble(this.PCO, this.trace_peek(this.PCO, 0, false), this.trace_peek), this.PCO));
            }
            // Execute an actual opcode
            this.current_instruction.exec_func(this.regs, this.pins);
        }
    }
}