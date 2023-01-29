import {m6502} from "../component/cpu/m6502/m6502";
import {nesm6502_opcodes_decoded} from "../system/nes/cpu/nesm6502_generated_opcodes";
import {z80_register_F_t, z80_t} from "../component/cpu/z80/z80";

class TST_Z80_IO {
    A: u32 = 0
    B: u32 = 0
    C: u32 = 0
    D: u32 = 0
    E: u32 = 0
    H: u32 = 0;
    L: u32 = 0;
    F: u32 = 0;
    I: u32 = 0; // Iforget
    R: u32 = 0; // Refresh counter
    AF_: u32 = 0;
    BC_: u32 = 0;
    DE_: u32 = 0;
    HL_: u32 = 0;
    PC: u32 = 0;
    SP: u32 = 0;
    IX: u32 = 0;
    IY: u32 = 0;
    WZ: u32 = 0
    EI: u32 = 0
    P: u32 = 0
    Q: u32 = 0
    IR: u32 = 0
    IFF1: u32 = 0
    IFF2: u32 = 0
    IM: u32 = 0
    pins_D: u32 = 0
    pins_Addr: u32 = 0
    pins_RD: u32 = 0
    pins_WR: u32 = 0
    pins_IO: u32 = 0
    pins_MRQ: u32 = 0
    prefix: u32 = 0
    rprefix: u32 = 0
    TCU: i32 = 0
}

class TST_M6502_IO {
    A: u32 = 0
    X: u32 = 0
    Y: u32 = 0
    PC: u32 = 0
    S: u32 = 0
    P: u32 = 0
    IR: u32 = 0
    pins_D: u32 = 0;
    pins_Addr: u32 = 0
    pins_RW: u32 = 0
    TCU: u32 = 0
    RES_pending: u32 = 0
}

class TST_M6502 {
    cpu: m6502
    constructor() {
        this.cpu = new m6502(nesm6502_opcodes_decoded);
    }

    cycle(): void {
        this.cpu.cycle();
    }

    set_cpu(to: TST_M6502_IO): void {
        this.cpu.regs.A = to.A;
        this.cpu.regs.X = to.X;
        this.cpu.regs.Y = to.Y;
        this.cpu.regs.PC = to.PC;
        this.cpu.regs.S = to.S;
        this.cpu.regs.P.setbyte(to.P);
        this.cpu.regs.IR = to.IR;
        this.cpu.pins.D = to.pins_D;
        this.cpu.pins.Addr = to.pins_Addr;
        this.cpu.regs.TCU = to.TCU;
        this.cpu.pins.RW = to.pins_RW;
    }

    get_cpu(): TST_M6502_IO {
        let o = new TST_M6502_IO();
        o.A = this.cpu.regs.A;
        o.X = this.cpu.regs.X;
        o.Y = this.cpu.regs.Y;
        o.PC = this.cpu.regs.PC;
        o.S = this.cpu.regs.S;
        o.P = this.cpu.regs.P.getbyte();
        o.IR = this.cpu.regs.IR;
        o.pins_D = this.cpu.pins.D;
        o.pins_Addr = this.cpu.pins.Addr;
        o.TCU = this.cpu.regs.TCU;
        o.pins_RW = this.cpu.pins.RW;
        return o;
    }
}

class TST_Z80 {
    cpu: z80_t

    constructor() {
        this.cpu = new z80_t(false);
    }

    cycle(): void {
        this.cpu.cycle();
    }

    set_cpu(to: TST_Z80_IO): void {
        let r = this.cpu.regs;
        r.prefix = to.prefix;
        r.rprefix = to.rprefix;
        r.A = to.A;
        r.B = to.B;
        r.C = to.C;
        r.D = to.D;
        r.E = to.E;
        r.F.setbyte(to.F);
        r.I = to.I;
        r.R = to.R;
        r.H = to.H;
        r.L = to.L;
        r.IR = to.IR;
        r.AF_ = to.AF_;
        r.BC_ = to.BC_;
        r.DE_ = to.DE_;
        r.HL_ = to.HL_;
        r.PC = to.PC;
        r.SP = to.SP;
        r.IX = to.IX;
        r.IY = to.IY;
        r.WZ = to.WZ;
        r.EI = to.EI;
        r.P = to.P;
        r.Q = to.Q;
        r.IFF1 = to.IFF1;
        r.IFF2 = to.IFF2;
        r.IM = to.IM;
        r.TCU = to.TCU;
        let p = this.cpu.pins;
        p.D = to.pins_D;
        p.Addr = to.pins_Addr;
        p.RD = to.pins_RD;
        p.WR = to.pins_WR;
        p.IO = to.pins_IO;
        p.MRQ = to.pins_MRQ;
    }

    get_cpu(): TST_Z80_IO {
        let r = new TST_Z80_IO();
        let to = this.cpu.regs;
        r.A = to.A;
        r.B = to.B;
        r.C = to.C;
        r.D = to.D;
        r.E = to.E;
        r.F = to.F.getbyte();
        r.I = to.I;
        r.R = to.R;
        r.IR = to.IR;
        r.AF_ = to.AF_;
        r.BC_ = to.BC_;
        r.DE_ = to.DE_;
        r.HL_ = to.HL_;
        r.PC = to.PC;
        r.SP = to.SP;
        r.IX = to.IX;
        r.IY = to.IY;
        r.WZ = to.WZ;
        r.EI = to.EI;
        r.P = to.P;
        r.Q = to.Q;
        r.IFF1 = to.IFF1;
        r.IFF2 = to.IFF2;
        r.IM = to.IM;
        r.TCU = to.TCU;
        r.H = to.H;
        r.L = to.L;
        r.prefix = to.prefix;
        r.rprefix = to.rprefix;
        let p = this.cpu.pins;
        r.pins_D = p.D;
        r.pins_Addr = p.Addr;
        r.pins_RD = p.RD;
        r.pins_WR = p.WR;
        r.pins_IO = p.IO;
        r.pins_MRQ = p.MRQ;
        return r;
    }

}

export function TST_M6502_new(): TST_M6502 {
    return new TST_M6502();
}

export function TST_M6502_set(obj: TST_M6502, to: TST_M6502_IO): void {
    obj.set_cpu(to);
}

export function TST_M6502_get(obj: TST_M6502): TST_M6502_IO {
    return obj.get_cpu();
}

export function TST_M6502_cycle(obj: TST_M6502): void {
    obj.cycle();
}

export function TST_Z80_new(): TST_Z80 {
    return new TST_Z80();
}

export function TST_Z80_set(obj: TST_Z80, to: TST_Z80_IO): void {
    obj.set_cpu(to);
}

export function TST_Z80_get(obj: TST_Z80): TST_Z80_IO {
    return obj.get_cpu();
}

export function TST_Z80_cycle(obj: TST_Z80): void {
    obj.cycle();
}
