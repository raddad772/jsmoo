
class m6502_P {
  C: bool
  Z: bool
  I: bool
  D: bool
  B: bool
  V: bool
  N: bool
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
    return this.C | (this.Z << 1) | (this.I << 2) | (this.D << 3) | (this.B << 4) | 0x20 | (this.V << 6) | (this.N << 7) | 0x20;
  }
}

class m6502_regs {
    A: u32
    X: u32
    Y: u32
    PC: u32
    S: u32
    P: m6502_P
    TCU: u32
    IR: u32
    TA: u32
    TR: u32
    skipped_cycle: bool
    HLT: bool
    IRQ_pending: bool
    NMI_pending: bool
    constructor() {
        this.P = new m6502_P();
        this.skipped_cycle = this.IRQ_pending = this.NMI_pending = this.HLT = false;
    }
}

class m6502_pins {
    Addr: u32 = 0
    D: u32 = 0
    RW: bool = 0

    IRQ: bool = 0
    NMI: bool = 0
    RST: bool = 0
    constructor() {

    }
}

export class m6502 {
    regs: m6502_regs
    pins: m6502_pins

    IRQ_ack: bool = false
    constructor() {
        this.regs = new m6502_regs();
        this.pins = new m6502_pins();
    }

    reset(): void {

    }

    cycle(): void {

    }
}
