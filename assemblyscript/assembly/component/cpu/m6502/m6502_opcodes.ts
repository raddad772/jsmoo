import {m6502_pins, m6502_regs} from "./m6502";

const M6502_OP_RESET = 0x100;
const M6502_OP_NMI = 0x101;
const M6502_OP_IRQ = 0x102;

export const M6502_MAX_OPCODE = 0x102;

export enum M6502_VARIANTS {
    STOCK = 0, STOCK_UNDOCUMENTED, CMOS, INVALID
}

export enum M6502_MN {
    ADC = 0, AND, ASL, BCC, BCS, BEQ,
    BIT, BMI, BNE, BPL, BRK, BVC,
    BVS, CLC, CLD, CLI, CLV, CMP,
    CPX, CPY, DEC, DEX, DEY, EOR,
    INC, INX, INY, JMP, JSR, LDA,
    LDX, LDY, LSR, NOP, ORA, PHA,
    PHP, PLA, PLP, ROL, ROR, RTI,
    RTS, SBC, SEC, SED, SEI, STA,
    STX, STY, TAX, TAY, TSX, TXA,
    TXS, TYA, NONE, S_RESET, S_NMI, S_IRQ
}

export enum M6502_AM {
    ACCUM, ABSr, ABSm, ABSw, ABSjmp, ABSjsr,
    ABS_Xr, ABS_Xm, ABS_Xw, ABS_Xsya,
    ABS_Yr, ABS_Ym, ABS_Yw, ABS_Yxas, ABS_Ysxa,
    IMM, IMPLIED, IND, INDjmp,
    X_INDr, X_INDm, X_INDw,
    IND_Yr, IND_Ym, IND_Yw,
    PC_REL, PC_REL_ZP,
    ZPr, ZPm, ZPw,
    ZP_Xr, ZP_Xm, ZP_Xw,
    ZP_Yr, ZP_Ym, ZP_Yw, NONE,

    ABS_IND_Xr, ZP_INDr, ZP_INDw
}

class M6502_opcode_info {
    opcode: u32 = 0
    ins: u32 = 0
    addr_mode: M6502_AM = M6502_AM.NONE
    mnemonic: String = ''
    variant: M6502_VARIANTS = M6502_VARIANTS.STOCK

    constructor(opcode: u32, ins: u32, addr_mode: M6502_AM, mnemonic: String, variant: M6502_VARIANTS = M6502_VARIANTS.STOCK) {
        this.opcode = opcode;
        this.ins = ins;
        this.addr_mode = addr_mode;
        this.mnemonic = mnemonic;
        this.variant = variant;
    }
}

export class M6502_opcode_functions {
    ins: u32 = 0
    opcode: u32 = 0
    addr_mode: M6502_AM = M6502_AM.NONE
    mnemonic: String = ''
    exec_func: (regs: m6502_regs, pins: m6502_pins) => void;
    constructor(opcode_info: M6502_opcode_info, exec_func: (regs: m6502_regs, pins: m6502_pins) => void) {
        this.opcode = opcode_info.opcode;
        this.ins = opcode_info.ins;
        this.addr_mode = opcode_info.addr_mode;
        this.mnemonic = opcode_info.mnemonic;
        this.exec_func = exec_func;
    }
}

export var M6502_stock_matrix: Map<u32, M6502_opcode_info> = new Map<u32, M6502_opcode_info>();
export var M6502_invalid_matrix: Map<u32, M6502_opcode_info> = new Map<u32, M6502_opcode_info>();
for (let i = 0; i < 0x100; i++) {
    M6502_invalid_matrix.set(i, new M6502_opcode_info(i, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID));
}

function M6502_get_stock_matrix_item(i: u32): M6502_opcode_info {
    let y: M6502_opcode_info;
    switch(i) {
        case 0x00: y = new M6502_opcode_info(0x00, M6502_MN.BRK, M6502_AM.IMPLIED, 'BRK', M6502_VARIANTS.STOCK); break;
        case 0x01: y = new M6502_opcode_info(0x01, M6502_MN.ORA, M6502_AM.X_INDr, 'ORA (d,x)', M6502_VARIANTS.STOCK); break;
        case 0x05: y = new M6502_opcode_info(0x05, M6502_MN.ORA, M6502_AM.ZPr, 'ORA d', M6502_VARIANTS.STOCK); break;
        case 0x06: y = new M6502_opcode_info(0x06, M6502_MN.ASL, M6502_AM.ZPm, 'ASL d', M6502_VARIANTS.STOCK); break;
        case 0x08: y = new M6502_opcode_info(0x08, M6502_MN.PHP, M6502_AM.IMPLIED, 'PHP', M6502_VARIANTS.STOCK); break;
        case 0x09: y = new M6502_opcode_info(0x09, M6502_MN.ORA, M6502_AM.IMM, 'ORA #', M6502_VARIANTS.STOCK); break;
        case 0x0A: y = new M6502_opcode_info(0x0A, M6502_MN.ASL, M6502_AM.ACCUM, 'ASL A', M6502_VARIANTS.STOCK); break;
        case 0x0D: y = new M6502_opcode_info(0x0D, M6502_MN.ORA, M6502_AM.ABSr, 'ORA a', M6502_VARIANTS.STOCK); break;
        case 0x0E: y = new M6502_opcode_info(0x0E, M6502_MN.ASL, M6502_AM.ABSm, 'ASL a', M6502_VARIANTS.STOCK); break;

        case 0x10: y = new M6502_opcode_info(0x10, M6502_MN.BPL, M6502_AM.PC_REL, 'BPL r', M6502_VARIANTS.STOCK); break;
        case 0x11: y = new M6502_opcode_info(0x11, M6502_MN.ORA, M6502_AM.IND_Yr, 'ORA (d),y', M6502_VARIANTS.STOCK); break;
        case 0x15: y = new M6502_opcode_info(0x15, M6502_MN.ORA, M6502_AM.ZP_Xr, 'ORA d,x', M6502_VARIANTS.STOCK); break;
        case 0x16: y = new M6502_opcode_info(0x16, M6502_MN.ASL, M6502_AM.ZP_Xm, 'ASL d,x', M6502_VARIANTS.STOCK); break;
        case 0x18: y = new M6502_opcode_info(0x18, M6502_MN.CLC, M6502_AM.IMPLIED, 'CLC i', M6502_VARIANTS.STOCK); break;
        case 0x19: y = new M6502_opcode_info(0x19, M6502_MN.ORA, M6502_AM.ABS_Yr, 'ORA a,y', M6502_VARIANTS.STOCK); break;
        case 0x1D: y = new M6502_opcode_info(0x1D, M6502_MN.ORA, M6502_AM.ABS_Xr, 'ORA a,x', M6502_VARIANTS.STOCK); break;
        case 0x1E: y = new M6502_opcode_info(0x1E, M6502_MN.ASL, M6502_AM.ABS_Xm, 'ASL a,x', M6502_VARIANTS.STOCK); break;

        case 0x20: y = new M6502_opcode_info(0x20, M6502_MN.JSR, M6502_AM.ABSjsr, 'JSR a', M6502_VARIANTS.STOCK); break;
        case 0x21: y = new M6502_opcode_info(0x21, M6502_MN.AND, M6502_AM.X_INDr, 'AND (d,x)', M6502_VARIANTS.STOCK); break;
        case 0x24: y = new M6502_opcode_info(0x24, M6502_MN.BIT, M6502_AM.ZPr, 'BIT d', M6502_VARIANTS.STOCK); break;
        case 0x25: y = new M6502_opcode_info(0x25, M6502_MN.AND, M6502_AM.ZPr, 'AND d', M6502_VARIANTS.STOCK); break;
        case 0x26: y = new M6502_opcode_info(0x26, M6502_MN.ROL, M6502_AM.ZPm, 'ROL d', M6502_VARIANTS.STOCK); break;
        case 0x28: y = new M6502_opcode_info(0x28, M6502_MN.PLP, M6502_AM.IMPLIED, 'PLP', M6502_VARIANTS.STOCK); break;
        case 0x29: y = new M6502_opcode_info(0x29, M6502_MN.AND, M6502_AM.IMM, 'AND #', M6502_VARIANTS.STOCK); break;
        case 0x2A: y = new M6502_opcode_info(0x2A, M6502_MN.ROL, M6502_AM.ACCUM, 'ROL A', M6502_VARIANTS.STOCK); break;
        case 0x2C: y = new M6502_opcode_info(0x2C, M6502_MN.BIT, M6502_AM.ABSr, 'BIT a', M6502_VARIANTS.STOCK); break;
        case 0x2D: y = new M6502_opcode_info(0x2D, M6502_MN.AND, M6502_AM.ABSr, 'AND a', M6502_VARIANTS.STOCK); break;
        case 0x2E: y = new M6502_opcode_info(0x2E, M6502_MN.ROL, M6502_AM.ABSm, 'ROL a', M6502_VARIANTS.STOCK); break;

        case 0x30: y = new M6502_opcode_info(0x30, M6502_MN.BMI, M6502_AM.PC_REL, 'BMI r', M6502_VARIANTS.STOCK); break;
        case 0x31: y = new M6502_opcode_info(0x31, M6502_MN.AND, M6502_AM.IND_Yr, 'AND (d),x', M6502_VARIANTS.STOCK); break;
        case 0x35: y = new M6502_opcode_info(0x35, M6502_MN.AND, M6502_AM.ZP_Xr, 'AND d,x', M6502_VARIANTS.STOCK); break;
        case 0x36: y = new M6502_opcode_info(0x36, M6502_MN.ROL, M6502_AM.ZP_Xm, 'ROL d,x', M6502_VARIANTS.STOCK); break;
        case 0x38: y = new M6502_opcode_info(0x38, M6502_MN.SEC, M6502_AM.IMPLIED, 'SEC', M6502_VARIANTS.STOCK); break;
        case 0x39: y = new M6502_opcode_info(0x39, M6502_MN.AND, M6502_AM.ABS_Yr, 'AND a,y', M6502_VARIANTS.STOCK); break;
        case 0x3D: y = new M6502_opcode_info(0x3D, M6502_MN.AND, M6502_AM.ABS_Xr, 'AND a,x', M6502_VARIANTS.STOCK); break;
        case 0x3E: y = new M6502_opcode_info(0x3E, M6502_MN.ROL, M6502_AM.ABS_Xm, 'ROL a,x', M6502_VARIANTS.STOCK); break;

        case 0x40: y = new M6502_opcode_info(0x40, M6502_MN.RTI, M6502_AM.IMPLIED, 'RTI', M6502_VARIANTS.STOCK); break;
        case 0x41: y = new M6502_opcode_info(0x41, M6502_MN.EOR, M6502_AM.X_INDr, 'EOR (d,x)', M6502_VARIANTS.STOCK); break;
        case 0x45: y = new M6502_opcode_info(0x45, M6502_MN.EOR, M6502_AM.ZPr, 'EOR d', M6502_VARIANTS.STOCK); break;
        case 0x46: y = new M6502_opcode_info(0x46, M6502_MN.LSR, M6502_AM.ZPm, 'LSR d', M6502_VARIANTS.STOCK); break;
        case 0x48: y = new M6502_opcode_info(0x48, M6502_MN.PHA, M6502_AM.IMPLIED, 'PHA', M6502_VARIANTS.STOCK); break;
        case 0x49: y = new M6502_opcode_info(0x49, M6502_MN.EOR, M6502_AM.IMM, 'EOR #', M6502_VARIANTS.STOCK); break;
        case 0x4A: y = new M6502_opcode_info(0x4A, M6502_MN.LSR, M6502_AM.ACCUM, 'LSR A', M6502_VARIANTS.STOCK); break;
        case 0x4C: y = new M6502_opcode_info(0x4C, M6502_MN.JMP, M6502_AM.ABSjmp, 'JMP a', M6502_VARIANTS.STOCK); break;
        case 0x4D: y = new M6502_opcode_info(0x4D, M6502_MN.EOR, M6502_AM.ABSr, 'EOR a', M6502_VARIANTS.STOCK); break;
        case 0x4E: y = new M6502_opcode_info(0x4E, M6502_MN.LSR, M6502_AM.ABSm, 'LSR a', M6502_VARIANTS.STOCK); break;

        case 0x50: y = new M6502_opcode_info(0x50, M6502_MN.BVC, M6502_AM.PC_REL, 'BVC r', M6502_VARIANTS.STOCK); break;
        case 0x51: y = new M6502_opcode_info(0x51, M6502_MN.EOR, M6502_AM.IND_Yr, 'EOR (d),y', M6502_VARIANTS.STOCK); break;
        case 0x55: y = new M6502_opcode_info(0x55, M6502_MN.EOR, M6502_AM.ZP_Xr, 'EOR d,x', M6502_VARIANTS.STOCK); break;
        case 0x56: y = new M6502_opcode_info(0x56, M6502_MN.LSR, M6502_AM.ZP_Xm, 'LSR d,x', M6502_VARIANTS.STOCK); break;
        case 0x58: y = new M6502_opcode_info(0x58, M6502_MN.CLI, M6502_AM.IMPLIED, 'CLI', M6502_VARIANTS.STOCK); break;
        case 0x59: y = new M6502_opcode_info(0x59, M6502_MN.EOR, M6502_AM.ABS_Yr, 'EOR a,y', M6502_VARIANTS.STOCK); break;
        case 0x5D: y = new M6502_opcode_info(0x5D, M6502_MN.EOR, M6502_AM.ABS_Xr, 'EOR a,x', M6502_VARIANTS.STOCK); break;
        case 0x5E: y = new M6502_opcode_info(0x5E, M6502_MN.LSR, M6502_AM.ABS_Xm, 'LSR a,x', M6502_VARIANTS.STOCK); break;

        case 0x60: y = new M6502_opcode_info(0x60, M6502_MN.RTS, M6502_AM.IMPLIED, 'RTS', M6502_VARIANTS.STOCK); break;
        case 0x61: y = new M6502_opcode_info(0x61, M6502_MN.ADC, M6502_AM.X_INDr, 'ADC (d,x)', M6502_VARIANTS.STOCK); break;
        case 0x65: y = new M6502_opcode_info(0x65, M6502_MN.ADC, M6502_AM.ZPr, 'ADC d', M6502_VARIANTS.STOCK); break;
        case 0x66: y = new M6502_opcode_info(0x66, M6502_MN.ROR, M6502_AM.ZPm, 'ROR d', M6502_VARIANTS.STOCK); break;
        case 0x68: y = new M6502_opcode_info(0x68, M6502_MN.PLA, M6502_AM.IMPLIED, 'PLA', M6502_VARIANTS.STOCK); break;
        case 0x69: y = new M6502_opcode_info(0x69, M6502_MN.ADC, M6502_AM.IMM, 'ADC #', M6502_VARIANTS.STOCK); break;
        case 0x6A: y = new M6502_opcode_info(0x6A, M6502_MN.ROR, M6502_AM.ACCUM, 'ROR A', M6502_VARIANTS.STOCK); break;
        case 0x6C: y = new M6502_opcode_info(0x6C, M6502_MN.JMP, M6502_AM.INDjmp, 'JMP (d)', M6502_VARIANTS.STOCK); break;
        case 0x6D: y = new M6502_opcode_info(0x6D, M6502_MN.ADC, M6502_AM.ABSr, 'ADC a', M6502_VARIANTS.STOCK); break;
        case 0x6E: y = new M6502_opcode_info(0x6E, M6502_MN.ROR, M6502_AM.ABSm, 'ROR a', M6502_VARIANTS.STOCK); break;

        case 0x70: y = new M6502_opcode_info(0x70, M6502_MN.BVS, M6502_AM.PC_REL, 'BVS r', M6502_VARIANTS.STOCK); break;
        case 0x71: y = new M6502_opcode_info(0x71, M6502_MN.ADC, M6502_AM.IND_Yr, 'ADC (d),y', M6502_VARIANTS.STOCK); break;
        case 0x75: y = new M6502_opcode_info(0x75, M6502_MN.ADC, M6502_AM.ZP_Xr, 'ADC d,x', M6502_VARIANTS.STOCK); break;
        case 0x76: y = new M6502_opcode_info(0x76, M6502_MN.ROR, M6502_AM.ZP_Xm, 'ROR d,x', M6502_VARIANTS.STOCK); break;
        case 0x78: y = new M6502_opcode_info(0x78, M6502_MN.SEI, M6502_AM.IMPLIED, 'SEI', M6502_VARIANTS.STOCK); break;
        case 0x79: y = new M6502_opcode_info(0x79, M6502_MN.ADC, M6502_AM.ABS_Yr, 'ADC a,y', M6502_VARIANTS.STOCK); break;
        case 0x7D: y = new M6502_opcode_info(0x7D, M6502_MN.ADC, M6502_AM.ABS_Xr, 'ADC a,x', M6502_VARIANTS.STOCK); break;
        case 0x7E: y = new M6502_opcode_info(0x7E, M6502_MN.ROR, M6502_AM.ABS_Xm, 'ROR a,x', M6502_VARIANTS.STOCK); break;

        case 0x81: y = new M6502_opcode_info(0x81, M6502_MN.STA, M6502_AM.X_INDw, 'STA (d,x)', M6502_VARIANTS.STOCK); break;
        case 0x84: y = new M6502_opcode_info(0x84, M6502_MN.STY, M6502_AM.ZPw, 'STY d', M6502_VARIANTS.STOCK); break;
        case 0x85: y = new M6502_opcode_info(0x85, M6502_MN.STA, M6502_AM.ZPw, 'STA d', M6502_VARIANTS.STOCK); break;
        case 0x86: y = new M6502_opcode_info(0x86, M6502_MN.STX, M6502_AM.ZPw, 'STX d', M6502_VARIANTS.STOCK); break;
        case 0x88: y = new M6502_opcode_info(0x88, M6502_MN.DEY, M6502_AM.IMPLIED, 'DEY', M6502_VARIANTS.STOCK); break;
        case 0x8A: y = new M6502_opcode_info(0x8A, M6502_MN.TXA, M6502_AM.IMPLIED, 'TXA', M6502_VARIANTS.STOCK); break;
        case 0x8C: y = new M6502_opcode_info(0x8C, M6502_MN.STY, M6502_AM.ABSw, 'STY a', M6502_VARIANTS.STOCK); break;
        case 0x8D: y = new M6502_opcode_info(0x8D, M6502_MN.STA, M6502_AM.ABSw, 'STA a', M6502_VARIANTS.STOCK); break;
        case 0x8E: y = new M6502_opcode_info(0x8E, M6502_MN.STX, M6502_AM.ABSw, 'STX a', M6502_VARIANTS.STOCK); break;

        case 0x90: y = new M6502_opcode_info(0x90, M6502_MN.BCC, M6502_AM.PC_REL, 'BCC', M6502_VARIANTS.STOCK); break;
        case 0x91: y = new M6502_opcode_info(0x91, M6502_MN.STA, M6502_AM.IND_Yw, 'STA (d),y', M6502_VARIANTS.STOCK); break;
        case 0x94: y = new M6502_opcode_info(0x94, M6502_MN.STY, M6502_AM.ZP_Xw, 'STY d,x', M6502_VARIANTS.STOCK); break;
        case 0x95: y = new M6502_opcode_info(0x95, M6502_MN.STA, M6502_AM.ZP_Xw, 'STA d,x', M6502_VARIANTS.STOCK); break;
        case 0x96: y = new M6502_opcode_info(0x96, M6502_MN.STX, M6502_AM.ZP_Yw, 'STX d,y', M6502_VARIANTS.STOCK); break;
        case 0x98: y = new M6502_opcode_info(0x98, M6502_MN.TYA, M6502_AM.IMPLIED, 'TYA', M6502_VARIANTS.STOCK); break;
        case 0x99: y = new M6502_opcode_info(0x99, M6502_MN.STA, M6502_AM.ABS_Yw, 'STA a,y', M6502_VARIANTS.STOCK); break;
        case 0x9A: y = new M6502_opcode_info(0x9A, M6502_MN.TXS, M6502_AM.IMPLIED, 'TXS', M6502_VARIANTS.STOCK); break;
        case 0x9D: y = new M6502_opcode_info(0x9D, M6502_MN.STA, M6502_AM.ABS_Xw, 'STA a,x', M6502_VARIANTS.STOCK); break;

        case 0xA0: y = new M6502_opcode_info(0xA0, M6502_MN.LDY, M6502_AM.IMM, 'LDY #', M6502_VARIANTS.STOCK); break;
        case 0xA1: y = new M6502_opcode_info(0xA1, M6502_MN.LDA, M6502_AM.X_INDr, 'LDA (d,x)', M6502_VARIANTS.STOCK); break;
        case 0xA2: y = new M6502_opcode_info(0xA2, M6502_MN.LDX, M6502_AM.IMM, 'LDX #', M6502_VARIANTS.STOCK); break;
        case 0xA4: y = new M6502_opcode_info(0xA4, M6502_MN.LDY, M6502_AM.ZPr, 'LDY d', M6502_VARIANTS.STOCK); break;
        case 0xA5: y = new M6502_opcode_info(0xA5, M6502_MN.LDA, M6502_AM.ZPr, 'LDA d', M6502_VARIANTS.STOCK); break;
        case 0xA6: y = new M6502_opcode_info(0xA6, M6502_MN.LDX, M6502_AM.ZPr, 'LDX d', M6502_VARIANTS.STOCK); break;
        case 0xA8: y = new M6502_opcode_info(0xA8, M6502_MN.TAY, M6502_AM.IMPLIED, 'TAY', M6502_VARIANTS.STOCK); break;
        case 0xA9: y = new M6502_opcode_info(0xA9, M6502_MN.LDA, M6502_AM.IMM, 'LDA #', M6502_VARIANTS.STOCK); break;
        case 0xAA: y = new M6502_opcode_info(0xAA, M6502_MN.TAX, M6502_AM.IMPLIED, 'TAX', M6502_VARIANTS.STOCK); break;
        case 0xAC: y = new M6502_opcode_info(0xAC, M6502_MN.LDY, M6502_AM.ABSr, 'LDY a', M6502_VARIANTS.STOCK); break;
        case 0xAD: y = new M6502_opcode_info(0xAD, M6502_MN.LDA, M6502_AM.ABSr, 'LDA a', M6502_VARIANTS.STOCK); break;
        case 0xAE: y = new M6502_opcode_info(0xAE, M6502_MN.LDX, M6502_AM.ABSr, 'LDX a', M6502_VARIANTS.STOCK); break;

        case 0xB0: y = new M6502_opcode_info(0xB0, M6502_MN.BCS, M6502_AM.PC_REL, 'BCS r', M6502_VARIANTS.STOCK); break;
        case 0xB1: y = new M6502_opcode_info(0xB1, M6502_MN.LDA, M6502_AM.IND_Yr, 'LDA (d),y', M6502_VARIANTS.STOCK); break;
        case 0xB4: y = new M6502_opcode_info(0xB4, M6502_MN.LDY, M6502_AM.ZP_Xr, 'LDY d,x', M6502_VARIANTS.STOCK); break;
        case 0xB5: y = new M6502_opcode_info(0xB5, M6502_MN.LDA, M6502_AM.ZP_Xr, 'LDA d,x', M6502_VARIANTS.STOCK); break;
        case 0xB6: y = new M6502_opcode_info(0xB6, M6502_MN.LDX, M6502_AM.ZP_Yr, 'LDX d,y', M6502_VARIANTS.STOCK); break;
        case 0xB8: y = new M6502_opcode_info(0xB8, M6502_MN.CLV, M6502_AM.IMPLIED, 'CLV', M6502_VARIANTS.STOCK); break;
        case 0xB9: y = new M6502_opcode_info(0xB9, M6502_MN.LDA, M6502_AM.ABS_Yr, 'LDA a,y', M6502_VARIANTS.STOCK); break;
        case 0xBA: y = new M6502_opcode_info(0xBA, M6502_MN.TSX, M6502_AM.IMPLIED, 'TSX', M6502_VARIANTS.STOCK); break;
        case 0xBC: y = new M6502_opcode_info(0xBC, M6502_MN.LDY, M6502_AM.ABS_Xr, 'LDY a,x', M6502_VARIANTS.STOCK); break;
        case 0xBD: y = new M6502_opcode_info(0xBD, M6502_MN.LDA, M6502_AM.ABS_Xr, 'LDA a,x', M6502_VARIANTS.STOCK); break;
        case 0xBE: y = new M6502_opcode_info(0xBE, M6502_MN.LDX, M6502_AM.ABS_Yr, 'LDX a,y', M6502_VARIANTS.STOCK); break;

        case 0xC0: y = new M6502_opcode_info(0xC0, M6502_MN.CPY, M6502_AM.IMM, 'CPY #', M6502_VARIANTS.STOCK); break;
        case 0xC1: y = new M6502_opcode_info(0xC1, M6502_MN.CMP, M6502_AM.X_INDr, 'CMP (d,x)', M6502_VARIANTS.STOCK); break;
        case 0xC4: y = new M6502_opcode_info(0xC4, M6502_MN.CPY, M6502_AM.ZPr, 'CPY d', M6502_VARIANTS.STOCK); break;
        case 0xC5: y = new M6502_opcode_info(0xC5, M6502_MN.CMP, M6502_AM.ZPr, 'CMP d', M6502_VARIANTS.STOCK); break;
        case 0xC6: y = new M6502_opcode_info(0xC6, M6502_MN.DEC, M6502_AM.ZPm, 'DEC d', M6502_VARIANTS.STOCK); break;
        case 0xC8: y = new M6502_opcode_info(0xC8, M6502_MN.INY, M6502_AM.IMPLIED, 'INY', M6502_VARIANTS.STOCK); break;
        case 0xC9: y = new M6502_opcode_info(0xC9, M6502_MN.CMP, M6502_AM.IMM, 'CMP #', M6502_VARIANTS.STOCK); break;
        case 0xCA: y = new M6502_opcode_info(0xCA, M6502_MN.DEX, M6502_AM.IMPLIED, 'DEX', M6502_VARIANTS.STOCK); break;
        case 0xCC: y = new M6502_opcode_info(0xCC, M6502_MN.CPY, M6502_AM.ABSr, 'CPY a', M6502_VARIANTS.STOCK); break;
        case 0xCD: y = new M6502_opcode_info(0xCD, M6502_MN.CMP, M6502_AM.ABSr, 'CMP a', M6502_VARIANTS.STOCK); break;
        case 0xCE: y = new M6502_opcode_info(0xCE, M6502_MN.DEC, M6502_AM.ABSm, 'DEC a', M6502_VARIANTS.STOCK); break;

        case 0xD0: y = new M6502_opcode_info(0xD0, M6502_MN.BNE, M6502_AM.PC_REL, 'BNE r', M6502_VARIANTS.STOCK); break;
        case 0xD1: y = new M6502_opcode_info(0xD1, M6502_MN.CMP, M6502_AM.IND_Yr, 'CMP (d),y', M6502_VARIANTS.STOCK); break;
        case 0xD5: y = new M6502_opcode_info(0xD5, M6502_MN.CMP, M6502_AM.ZP_Xr, 'CMP d,x', M6502_VARIANTS.STOCK); break;
        case 0xD6: y = new M6502_opcode_info(0xD6, M6502_MN.DEC, M6502_AM.ZP_Xm, 'DEC d,x', M6502_VARIANTS.STOCK); break;
        case 0xD8: y = new M6502_opcode_info(0xD8, M6502_MN.CLD, M6502_AM.IMPLIED, 'CLD', M6502_VARIANTS.STOCK); break;
        case 0xD9: y = new M6502_opcode_info(0xD9, M6502_MN.CMP, M6502_AM.ABS_Yr, 'CMP a,y', M6502_VARIANTS.STOCK); break;
        case 0xDD: y = new M6502_opcode_info(0xDD, M6502_MN.CMP, M6502_AM.ABS_Xr, 'CMP a,x', M6502_VARIANTS.STOCK); break;
        case 0xDE: y = new M6502_opcode_info(0xDE, M6502_MN.DEC, M6502_AM.ABS_Xm, 'DEC a,x', M6502_VARIANTS.STOCK); break;

        case 0xE0: y = new M6502_opcode_info(0xE0, M6502_MN.CPX, M6502_AM.IMM, 'CPX #', M6502_VARIANTS.STOCK); break;
        case 0xE1: y = new M6502_opcode_info(0xE1, M6502_MN.SBC, M6502_AM.X_INDr, 'SBC (d,x)', M6502_VARIANTS.STOCK); break;
        case 0xE4: y = new M6502_opcode_info(0xE4, M6502_MN.CPX, M6502_AM.ZPr, 'CPX d', M6502_VARIANTS.STOCK); break;
        case 0xE5: y = new M6502_opcode_info(0xE5, M6502_MN.SBC, M6502_AM.ZPr, 'SBC d', M6502_VARIANTS.STOCK); break;
        case 0xE6: y = new M6502_opcode_info(0xE6, M6502_MN.INC, M6502_AM.ZPm, 'INC d', M6502_VARIANTS.STOCK); break;
        case 0xE8: y = new M6502_opcode_info(0xE8, M6502_MN.INX, M6502_AM.IMPLIED, 'INX', M6502_VARIANTS.STOCK); break;
        case 0xE9: y = new M6502_opcode_info(0xE9, M6502_MN.SBC, M6502_AM.IMM, 'SBC #', M6502_VARIANTS.STOCK); break;
        case 0xEA: y = new M6502_opcode_info(0xEA, M6502_MN.NOP, M6502_AM.IMPLIED, 'NOP', M6502_VARIANTS.STOCK); break;
        case 0xEC: y = new M6502_opcode_info(0xEC, M6502_MN.CPX, M6502_AM.ABSr, 'CPX a', M6502_VARIANTS.STOCK); break;
        case 0xED: y = new M6502_opcode_info(0xED, M6502_MN.SBC, M6502_AM.ABSr, 'SBC a', M6502_VARIANTS.STOCK); break;
        case 0xEE: y = new M6502_opcode_info(0xEE, M6502_MN.INC, M6502_AM.ABSm, 'INC a', M6502_VARIANTS.STOCK); break;

        case 0xF0: y = new M6502_opcode_info(0xF0, M6502_MN.BEQ, M6502_AM.PC_REL, 'BEQ r', M6502_VARIANTS.STOCK); break;
        case 0xF1: y = new M6502_opcode_info(0xF1, M6502_MN.SBC, M6502_AM.IND_Yr, 'SBC (d),y', M6502_VARIANTS.STOCK); break;
        case 0xF5: y = new M6502_opcode_info(0xF5, M6502_MN.SBC, M6502_AM.ZP_Xr, 'SBC d,x', M6502_VARIANTS.STOCK); break;
        case 0xF6: y = new M6502_opcode_info(0xF6, M6502_MN.INC, M6502_AM.ZP_Xm, 'INC d,X', M6502_VARIANTS.STOCK); break;
        case 0xF8: y = new M6502_opcode_info(0xF8, M6502_MN.SED, M6502_AM.IMPLIED, 'SED', M6502_VARIANTS.STOCK); break;
        case 0xF9: y = new M6502_opcode_info(0xF9, M6502_MN.SBC, M6502_AM.ABS_Yr, 'SBC a,y', M6502_VARIANTS.STOCK); break;
        case 0xFD: y = new M6502_opcode_info(0xFD, M6502_MN.SBC, M6502_AM.ABS_Xr, 'SBC a,x', M6502_VARIANTS.STOCK); break;
        case 0xFE: y = new M6502_opcode_info(0xFE, M6502_MN.INC, M6502_AM.ABS_Xm, 'INC a,x', M6502_VARIANTS.STOCK); break;
        case M6502_OP_RESET: y = new M6502_opcode_info(M6502_OP_RESET, M6502_MN.S_RESET, M6502_AM.IMPLIED, 'RESET', M6502_VARIANTS.STOCK); break;
        case M6502_OP_NMI: y = new M6502_opcode_info(M6502_OP_NMI, M6502_MN.S_NMI, M6502_AM.IMPLIED, 'NMI', M6502_VARIANTS.STOCK); break;
        case M6502_OP_IRQ: y = new M6502_opcode_info(M6502_OP_IRQ, M6502_MN.S_IRQ, M6502_AM.IMPLIED, 'IRQ', M6502_VARIANTS.STOCK); break;
        default:
            y = new M6502_opcode_info(i, M6502_MN.NONE, M6502_AM.NONE, 'NONE', M6502_VARIANTS.STOCK);
            break;
    }
    return y;
}

for (let i = 0; i < M6502_MAX_OPCODE; i++) {
    M6502_stock_matrix.set(i, M6502_get_stock_matrix_item(i));
}
