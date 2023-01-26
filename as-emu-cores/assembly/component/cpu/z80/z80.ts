import {D_RESOURCE_TYPES, dbg} from "../../../helpers/debug";
import {Z80_MN, Z80_opcode_functions, Z80_opcode_info, Z80_S_DECODE, Z80_S_IRQ, Z80_S_RESET} from "./z80_opcodes";
import {mksigned8} from "../../../helpers/helpers";

export enum Z80P {
    HL,
    IX,
    IY
}

const Z80_INS_BRK = 0x0A; // NOP

export class z80_register_F_t {
    S: u32 = 0;
    Z: u32 = 0;
    Y: u32 = 0;
    H: u32 = 0;
    X: u32 = 0;
    PV: u32 = 0;
    N: u32 = 0;
    C: u32 = 0;

    getbyte(): u32 {
        return this.C | (this.N << 1) | (this.PV << 2) | (this.X << 3) | (this.H << 4) | (this.Y << 5) | (this.Z << 6) | (this.S << 7);
    }

    setbyte(val: u32): void {
        this.C = val & 1;
        this.N = (val & 2) >>> 1;
        this.PV = (val & 4) >>> 2;
        this.X = (val & 8) >>> 3;
        this.H = (val & 0x10) >>> 4;
        this.Y = (val & 0x20) >>> 5;
        this.Z = (val & 0x40) >>> 6;
        this.S = (val & 0x80) >>> 7;
    }

    formatbyte(): string {
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

export class z80_regs {
    IR: u32 = 0;
    TCU: i32 = 0;

    // 8-bit registers
    A: u32 = 0;
    B: u32 = 0;
    C: u32 = 0;
    D: u32 = 0;
    E: u32 = 0;
    H: u32 = 0;
    L: u32 = 0;
    F: z80_register_F_t = new z80_register_F_t();
    I: u32 = 0; // Iforget
    R: u32 = 0; // Refresh counter

    // Shadow registers
    AF_: u32 = 0;
    BC_: u32 = 0;
    DE_: u32 = 0;
    HL_: u32 = 0;
    // For junk calculations
    junkvar: u32 = 0;

    // Temp registers for swapping
    AFt: u32 = 0;
    BCt: u32 = 0;
    DEt: u32 = 0;
    HLt: u32 = 0;
    Ht: u32 = 0;
    Lt: u32 = 0;

    // 16-bit registers
    PC: u32 = 0;
    SP: u32 = 0;
    IX: u32 = 0;
    IY: u32 = 0;

    data: u32 = 0; // For specific special shenanigans

    t: StaticArray<i32> = new StaticArray<i32>(8);
    WZ: u32 = 0; // ?
    EI: u32 = 0; //"ei" executed last
    P: u32 = 0; //"ld a,i" or "ld a,r executed last
    Q: u32 = 0; // Opcode that updated flag registers executed last
    IFF1: u32 = 0; // IRQ flipflip 1
    IFF2: u32 = 0; // IRQ flipflop 2
    IM: u32 = 0; // Interrupt Mode
    HALT: u32 = 0; // If HALT was executed

    TR: u32 = 0; // Temporary Register
    TA: u32 = 0; // Temporary Address

    // Internal registers
    IRQ_vec: u32 = 0;
    rprefix: u32 = Z80P.HL;
    prefix: u32 = 0x00;

    poll_IRQ: bool = false;

    inc_R(): void {
        this.R = (this.R & 0x80) | ((this.R + 1) & 0x7F);
    }

    exchange_shadow(): void {
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

    exchange_de_hl(): void {
        this.Ht = this.H;
        this.Lt = this.L;
        this.H = this.D;
        this.L = this.E;
        this.D = this.Ht;
        this.E = this.Lt;
    }

    exchange_shadow_af(): void {
        this.AFt = (this.A << 8) | this.F.getbyte();

        this.A = (this.AF_ & 0xFF00) >>> 8;
        this.F.setbyte(this.AF_ & 0xFF);

        this.AF_ = this.AFt;
    }
}

export class z80_pins {
    RES: u32 = 0; // RESET
    NMI: u32 = 0; // NMI
    IRQ: u32 = 0; // IRQ
    Addr: u32 = 0; // Address/port number
    D: u32 = 0; // Data

    IRQ_maskable: bool = 1; // Ummm

    RD: u32 = 0; // Read
    WR: u32 = 0; // Write
    IO: u32 = 0; // IO request
    MRQ: u32 = 0; // Memory request
}

export class z80_t {
    regs: z80_regs = new z80_regs();
    pins: z80_pins = new z80_pins();
    CMOS: bool = false;

    prefix_was: u32 = 0; // For serial

    IRQ_pending: bool = false;
    IRQ_ack: bool = false;

    NMI_pending: bool = false;
    NMI_ack: bool = false;

    trace_on: bool = false;
    trace_cycles: u32 = 0;
    last_trace_cycle: u32 = 0;

    current_instruction: Z80_opcode_functions = new Z80_opcode_functions(new Z80_opcode_info(0, Z80_MN.UKN, 'FAIL'), function(regs: z80_regs, pins: z80_pins): void {});

    trace_peek: (addr: u32, val: u32) => u32 = function(addr, val): u32 { return 0xCD;}
    PCO: u32 = 0;

    constructor(CMOS: bool) {
        this.CMOS = CMOS;
    }

    /*enable_tracing(trace_peek=null) {
        this.trace_on = true;
        //this.trace_cycles = 0;
        if (trace_peek !== null)
            this.trace_peek = trace_peek;
    }

    disable_tracing() {
        if (!this.trace_on) return;
        this.trace_on = false;
    }*/

    reset(PC_VEC: u32=0): void {
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
        this.IRQ_ack = false;
        this.regs.IRQ_vec = 0;

        this.regs.IR = Z80_S_RESET;
        //this.current_instruction = Z80_fetch_decoded(this.regs.IR, 0x00);
        this.regs.TCU = 0;
    }

    notify_IRQ(level: bool): void {
        this.IRQ_pending = !!level;
        if (!this.IRQ_pending) this.IRQ_ack = false;
    }

    notify_NMI(level: bool): void {
        if (!level && this.NMI_ack) { this.NMI_ack = false; }// level 0, NMI already ack'd
        this.NMI_pending = (this.NMI_pending || level);
    }

    set_pins_opcode(): void {
        this.pins.RD = 0;
        this.pins.MRQ = 0;
        this.pins.WR = 0;
        this.pins.IO = 0;
        this.pins.Addr = this.regs.PC;
        this.regs.PC = (this.regs.PC + 1) & 0xFFFF;
    }

    set_pins_nothing(): void {
        this.pins.RD = this.pins.MRQ = 0;
        this.pins.WR = this.pins.IO = 0;
    }

    set_instruction(to: u32): void {
        this.regs.IR = to;
        //this.current_instruction = Z80_fetch_decoded(this.regs.IR, this.regs.prefix);
        this.prefix_was = this.regs.prefix;
        this.regs.TCU = 0;
        this.regs.prefix = 0;
        this.regs.rprefix = Z80P.HL;
    }

    ins_cycles(): void {
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
                    } else if (this.IRQ_pending && !this.IRQ_ack) {
                        if (this.pins.IRQ_maskable && ((!this.regs.IFF1) || this.regs.EI)) {
                            this.IRQ_pending = false;
                        } else {
                            this.IRQ_pending = false;
                            this.IRQ_ack = false;
                            this.pins.D = 0xFF;
                            this.regs.PC = (this.regs.PC - 1) & 0xFFFF;
                            this.pins.IRQ_maskable = true;
                            this.regs.IRQ_vec = 0x38;
                            this.pins.D = 0xFF;
                            this.set_instruction(Z80_S_IRQ);
                            break;
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

	/*trace_format(da_out, PCO) {
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
	}*/

    cycle(): void {
        this.regs.TCU++;
        this.trace_cycles++;
        if (this.regs.IR === Z80_S_DECODE) {
            // Long logic to decode opcodes and decide what to do
            if ((this.regs.TCU === 1) && (this.regs.prefix === 0)) this.PCO = this.pins.Addr;
            this.ins_cycles();
        } else {
            /*if (this.trace_on && this.regs.TCU === 1) {
                this.last_trace_cycle = this.PCO;
                dbg.traces.add(TRACERS.Z80, this.trace_cycles, this.trace_format(Z80_disassemble(this.PCO, this.trace_peek(this.PCO, 0, false), this.trace_peek), this.PCO));
            }*/
            // Execute an actual opcode
            this.current_instruction.exec_func(this.regs, this.pins);
        }
    }
}