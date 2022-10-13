import {M6502_AM, M6502_OP_IRQ, M6502_OP_NMI, M6502_OP_RESET, M6502_opcode_functions} from "./m6502_opcodes";
import {dbg} from "../../../helpers/debug";

class m6502_P {
    C: u32
    Z: u32
    I: u32
    D: u32
    B: u32
    V: u32
    N: u32

    constructor() {
        this.C = this.Z = this.I = this.D = this.B = this.V = this.N = 0;
    }

    setbyte(val: u32): void {
        this.C = val & 1;
        this.Z = (val & 0x02) >>> 1;
        this.I = (val & 0x04) >>> 2;
        this.D = (val & 0x08) >>> 3;
        this.B = 1; // Confirmed via Visual6502
        this.V = (val & 0x40) >>> 6;
        this.N = (val & 0x80) >>> 7;
    }

    getbyte(): u32 {
        return this.C | (this.Z << 1) | (this.I << 2) | (this.D << 3) | (this.B << 4) | 0x20 | (this.V << 6) | (this.N << 7);
    }
}

export class m6502_regs {
    A: u32 = 0
    X: u32 = 0
    Y: u32 = 0
    PC: u32 = 0
    S: u32 = 0
    old_I: u32 = 0
    P: m6502_P = new m6502_P()
    TCU: u32 = 0
    IR: u32 = 0
    TA: i32 = 0
    TR: i32 = 0
    skipped_cycle: u32 = 0
    HLT: u32 = 0
    IRQ_pending: u32 = 0
    NMI_pending: u32 = 0
    WAI: u32 = 0
    STP: u32 = 0
}

export class m6502_pins {
    Addr: u32 = 0
    D: u32 = 0
    RW: u32 = 0

    IRQ: u32 = 0
    NMI: u32 = 0
    RST: u32 = 0
}

export class m6502 {
    regs: m6502_regs
    pins: m6502_pins

    IRQ_ack: bool = false
    NMI_ack: bool = false
    NMI_old: u32 = 0;
    IRQ_count: u64 = 0;

    PCO: u32 = 0;

    opcode_set: Array<M6502_opcode_functions>
    first_reset: bool = true
    current_instruction: M6502_opcode_functions

    constructor(opcode_set: Array<M6502_opcode_functions>) {
        this.regs = new m6502_regs();
        this.pins = new m6502_pins();
        this.opcode_set = opcode_set;
        this.current_instruction = opcode_set[0];
    }

    reset(): void {
        this.pins.RST = 0;
        this.regs.TCU = 0;
        this.pins.D = M6502_OP_RESET;
        this.pins.RW = 1;
        this.regs.P.B = 1;
        this.regs.P.D = 0;
        this.regs.P.I = 1;
        this.regs.WAI = 0;
        this.regs.STP = 0;
        if (this.first_reset) this.power_on();
        this.first_reset = false;
    }

    power_on(): void {
        // Initial values from Visual6502
        this.regs.A = 0xCC;
        this.regs.S = 0xFD;
        this.pins.D = 0x60;
        this.pins.RW = 0;
        this.regs.X = this.regs.Y = 0;
        this.regs.P.I = 1;
        this.regs.P.Z = 1;
        this.regs.PC = 0;
    }

    cycle(): void {
        if (this.regs.HLT || this.regs.STP) return;
        if (this.pins.IRQ) {
            this.IRQ_count++;
            if (this.IRQ_count >= 1) {
                this.pins.IRQ = 0;
                this.IRQ_count = 0;
                this.regs.IRQ_pending = 1;
                this.IRQ_ack = false;
            }
        }
        else this.IRQ_count = 0;

        // Edge-sensitive 0->1
        if (this.pins.NMI !== this.NMI_old) {
            if (this.pins.NMI === 0) { // Reset NMI status
                this.NMI_ack = false;
            }
            else { // Make NMI pending
                this.NMI_ack = false;
                this.regs.NMI_pending = 1;
            }
            this.NMI_old = this.pins.NMI;
        }

        this.regs.TCU++;
        if (this.regs.TCU === 1) {
            this.PCO = this.pins.Addr; // Capture PC before it runs away
            this.regs.IR = this.pins.D;
            if (this.regs.NMI_pending && !this.NMI_ack) {
                this.NMI_ack = true;
                this.regs.NMI_pending = 0;
                this.regs.IR = M6502_OP_NMI;
                if (dbg.brk_on_NMIRQ) dbg.break();
            } else if (this.regs.IRQ_pending && !this.IRQ_ack && !this.regs.old_I) {
                this.IRQ_ack = true;
                this.regs.IRQ_pending = 0;
                this.regs.IR = M6502_OP_IRQ;
            }
            this.regs.old_I = this.regs.P.I;
			this.current_instruction = this.opcode_set[this.regs.IR];
            if (this.current_instruction.addr_mode == M6502_AM.NONE) {
                console.log('INVALID OPCODE');
                dbg.break();
            }
            /*if (this.trace_on) {
                dbg.traces.add(TRACERS.M6502, this.clock.trace_cycles-1, this.trace_format(this.disassemble(), this.PCO));
            }*/
        }
        this.IRQ_ack = false;
        this.NMI_ack = false;

        this.current_instruction.exec_func(this.regs, this.pins);
    }
}

