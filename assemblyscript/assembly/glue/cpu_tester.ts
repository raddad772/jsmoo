import {m6502} from "../component/cpu/m6502/m6502";
import {nesm6502_opcodes_decoded} from "../system/nes/cpu/nesm6502_generated_opcodes";

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
