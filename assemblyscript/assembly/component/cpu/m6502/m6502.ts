import {M6502_opcode_functions} from "./m6502_opcodes";
import {mksigned8} from "../../../helpers/helpers";

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
    P: m6502_P = new m6502_P()
    TCU: u32 = 0
    IR: u32 = 0
    TA: i32 = 0
    TR: i32 = 0
    skipped_cycle: bool = false
    HLT: bool = false
    IRQ_pending: bool = false
    NMI_pending: bool = false
}

export class m6502_pins {
    Addr: u32 = 0
    D: u32 = 0
    RW: bool = 0

    IRQ: bool = 0
    NMI: bool = 0
    RST: bool = 0
}

export class m6502 {
    regs: m6502_regs
    pins: m6502_pins

    IRQ_ack: bool = false
    opcode_set: Array<M6502_opcode_functions>
    constructor(opcode_set: Array<M6502_opcode_functions>) {
        this.regs = new m6502_regs();
        this.pins = new m6502_pins();
        this.opcode_set = opcode_set
    }

    reset(): void {

    }

    cycle(): void {

    }
}

let a:u32 = 10;
let b:u32 = a + mksigned8(0xFE);
let c:u32 = a + (<i8>0xFE);
console.log(b.toString() + " " + c.toString());
