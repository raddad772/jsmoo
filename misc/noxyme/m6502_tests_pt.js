"use strict";

import MCS6502 from "/misc/noxyme/mcs6502.js";

const M6502_VARIANTS = Object.freeze({
    STOCK: 0,
    STOCK_UNDOCUMENTED: 1,
    CMOS: 2,
    INVALID: 3
});

class M6502_opcode_info {
    constructor(opcode, ins, addr_mode, mnemonic, variant=M6502_VARIANTS.STOCK) {
        this.opcode = opcode;
        this.ins = ins;
        this.addr_mode = addr_mode;
        this.mnemonic = mnemonic;
        this.variant = variant;
    }
}

const M6502_MN = Object.freeze({
    // Stock opcodes
    ADC: 0,
    AND: 1,
    ASL: 2,
    BCC: 3,
    BCS: 4,
    BEQ: 5,
    BIT: 6,
    BMI: 7,
    BNE: 8,
    BPL: 9,
    BRK: 10,
    BVC: 11,
    BVS: 12,
    CLC: 13,
    CLD: 14,
    CLI: 15,
    CLV: 16,
    CMP: 17,
    CPX: 18,
    CPY: 19,
    DEC: 20,
    DEX: 21,
    DEY: 22,
    EOR: 23,
    INC: 24,
    INX: 25,
    INY: 26,
    JMP: 27,
    JSR: 28,
    LDA: 29,
    LDX: 30,
    LDY: 31,
    LSR: 32,
    NOP: 33,
    ORA: 34,
    PHA: 35,
    PHP: 36,
    PLA: 37,
    PLP: 38,
    ROL: 39,
    ROR: 40,
    RTI: 41,
    RTS: 42,
    SBC: 43,
    SEC: 44,
    SED: 45,
    SEI: 46,
    STA: 47,
    STX: 48,
    STY: 49,
    TAX: 50,
    TAY: 51,
    TSX: 52,
    TXA: 53,
    TXS: 54,
    TYA: 55,
    NONE: 56, // Empty slot in matrix
    S_RESET: 57,
    S_NMI: 58,
    S_IRQ: 59,

    // Undocumented 6502 opcodes
    AAC: 60,
    ANC: 60,

    AAX: 61,
    //SAX: 61,
    //AXS: 61,

    ARR: 62,

    ASR: 63,
    ALR: 63,

    ATX: 64,
    LXA: 64,
    OAL: 64,

    AXA: 65,
    SHA: 65,

    AXS: 66,
    //SBX: 66,
    //SAX: 66,

    DCP: 67,
    DCM: 67,

    DOP: 68,
    SKB: 68,

    ISC: 69,
    ISB: 69,
    INS: 69,

    KIL: 70,
    JAM: 70,
    HLT: 70,

    LAR: 71,
    LAE: 71,
    LAS: 71,

    LAX: 72,

    RLA: 73,

    RRA: 74,

    SLO: 75,
    ASO: 75,

    SRE: 76,
    LSE: 76,

    SXA: 77,
    SHX: 77,
    //XAS: 77,

    SYA: 78,
    SHY: 78,
    SAY: 78,

    TOP: 79,
    SKW: 79,

    XAA: 80,
    ANE: 80,

    XAS: 81,
    SHS: 81,
    TAS: 81,

    //CMOS instructions
    NOP11: 82, // X....
    NOP22: 83,
    NOP24: 84,
    NOP34: 85,
    NOP38: 86, // ...

    BBR0: 87, // X...
    BBR1: 88,
    BBR2: 89,
    BBR3: 90,
    BBR4: 91,
    BBR5: 92,
    BBR6: 93,
    BBR7: 94,
    BBS0: 95,
    BBS1: 96,
    BBS2: 97,
    BBS3: 98,
    BBS4: 99,
    BBS5: 100,
    BBS6: 101,
    BBS7: 102, // ...

    PHX: 103, // X
    PHY: 104, // X

    RMB0: 105, // X...
    RMB1: 106,
    RMB2: 107,
    RMB3: 108,
    RMB4: 109,
    RMB5: 110,
    RMB6: 111,
    RMB7: 112,
    SMB0: 113,
    SMB1: 114,
    SMB2: 115,
    SMB3: 116,
    SMB4: 117,
    SMB5: 118,
    SMB6: 119,
    SMB7: 120, // ...

    PLX: 121, // X ...
    PLY: 122,
    BITZ: 123,

    TRB: 124,
    TSB: 125, // ...

    STP: 126,
    WAI: 127,

    NOPL: 128, // X
});



//console.log(m6502_am_gen());
const M6502_AM = Object.freeze({
    ACCUM: 0, // X
    ABSr: 1, // X
    ABSm: 101, // X
    ABSw: 102, // X
    ABSjmp: 103, // X
    ABSjsr: 104, // X

    ABS_Xr: 2, // X
    ABS_Xm: 201, // X
    ABS_Xw: 202, // X
    ABS_Xsya: 203, // undocumented

    ABS_Yr: 3, // X
    ABS_Ym: 301, // X
    ABS_Yw: 302, // X
    ABS_Yxas: 303, // undocumented
    ABS_Ysxa: 304, // undocumented

    IMM: 4, // X
    IMPLIED: 5, // X
    IND: 6, // X
    INDjmp: 601, // X
    X_INDr: 7, // X
    X_INDm: 701, // undocumented
    X_INDw: 702, // X
    IND_Yr: 8, // X
    IND_Ym: 801, // undocumented
    IND_Yw: 802, // X

    PC_REL: 9, // X
    PC_REL_ZP: 901,
    ZPr: 10, // X
    ZPm: 1001, // X
    ZPw: 1002, // X
    ZP_Xr: 11, // X
    ZP_Xm: 1101, // X
    ZP_Xw: 1102, // X
    ZP_Yr: 12, // X
    ZP_Ym: 1201, // X
    ZP_Yw: 1202, // X
    NONE: 13, // X

    ABS_IND_Xr: 14, // X 65C02

    ZP_INDr: 15, // X 65C02
    ZP_INDw: 1501, // X 65C02
});


const M6502_stock_matrix = Object.freeze({
    0x00: new M6502_opcode_info(0x00, M6502_MN.BRK, M6502_AM.IMPLIED, 'BRK', M6502_VARIANTS.STOCK),
    0x01: new M6502_opcode_info(0x01, M6502_MN.ORA, M6502_AM.X_INDr, 'ORA (d,x)', M6502_VARIANTS.STOCK),
    0x05: new M6502_opcode_info(0x05, M6502_MN.ORA, M6502_AM.ZPr, 'ORA d', M6502_VARIANTS.STOCK),
    0x06: new M6502_opcode_info(0x06, M6502_MN.ASL, M6502_AM.ZPm, 'ASL d', M6502_VARIANTS.STOCK),
    0x08: new M6502_opcode_info(0x08, M6502_MN.PHP, M6502_AM.IMPLIED, 'PHP', M6502_VARIANTS.STOCK),
    0x09: new M6502_opcode_info(0x09, M6502_MN.ORA, M6502_AM.IMM, 'ORA #', M6502_VARIANTS.STOCK),
    0x0A: new M6502_opcode_info(0x0A, M6502_MN.ASL, M6502_AM.ACCUM, 'ASL A', M6502_VARIANTS.STOCK),
    0x0D: new M6502_opcode_info(0x0D, M6502_MN.ORA, M6502_AM.ABSr, 'ORA a', M6502_VARIANTS.STOCK),
    0x0E: new M6502_opcode_info(0x0E, M6502_MN.ASL, M6502_AM.ABSm, 'ASL a', M6502_VARIANTS.STOCK),

    0x10: new M6502_opcode_info(0x10, M6502_MN.BPL, M6502_AM.PC_REL, 'BPL r', M6502_VARIANTS.STOCK),
    0x11: new M6502_opcode_info(0x11, M6502_MN.ORA, M6502_AM.IND_Yr, 'ORA (d),y', M6502_VARIANTS.STOCK),
    0x15: new M6502_opcode_info(0x15, M6502_MN.ORA, M6502_AM.ZP_Xr, 'ORA d,x', M6502_VARIANTS.STOCK),
    0x16: new M6502_opcode_info(0x16, M6502_MN.ASL, M6502_AM.ZP_Xm, 'ASL d,x', M6502_VARIANTS.STOCK),
    0x18: new M6502_opcode_info(0x18, M6502_MN.CLC, M6502_AM.IMPLIED, 'CLC i', M6502_VARIANTS.STOCK),
    0x19: new M6502_opcode_info(0x19, M6502_MN.ORA, M6502_AM.ABS_Yr, 'ORA a,y', M6502_VARIANTS.STOCK),
    0x1D: new M6502_opcode_info(0x1D, M6502_MN.ORA, M6502_AM.ABS_Xr, 'ORA a,x', M6502_VARIANTS.STOCK),
    0x1E: new M6502_opcode_info(0x1E, M6502_MN.ASL, M6502_AM.ABS_Xm, 'ASL a,x', M6502_VARIANTS.STOCK),

    0x20: new M6502_opcode_info(0x20, M6502_MN.JSR, M6502_AM.ABSjsr, 'JSR a', M6502_VARIANTS.STOCK),
    0x21: new M6502_opcode_info(0x21, M6502_MN.AND, M6502_AM.X_INDr, 'AND (d,x)', M6502_VARIANTS.STOCK),
    0x24: new M6502_opcode_info(0x24, M6502_MN.BIT, M6502_AM.ZPr, 'BIT d', M6502_VARIANTS.STOCK),
    0x25: new M6502_opcode_info(0x25, M6502_MN.AND, M6502_AM.ZPr, 'AND d', M6502_VARIANTS.STOCK),
    0x26: new M6502_opcode_info(0x26, M6502_MN.ROL, M6502_AM.ZPm, 'ROL d', M6502_VARIANTS.STOCK),
    0x28: new M6502_opcode_info(0x28, M6502_MN.PLP, M6502_AM.IMPLIED, 'PLP', M6502_VARIANTS.STOCK),
    0x29: new M6502_opcode_info(0x29, M6502_MN.AND, M6502_AM.IMM, 'AND #', M6502_VARIANTS.STOCK),
    0x2A: new M6502_opcode_info(0x2A, M6502_MN.ROL, M6502_AM.ACCUM, 'ROL A', M6502_VARIANTS.STOCK),
    0x2C: new M6502_opcode_info(0x2C, M6502_MN.BIT, M6502_AM.ABSr, 'BIT a', M6502_VARIANTS.STOCK),
    0x2D: new M6502_opcode_info(0x2D, M6502_MN.AND, M6502_AM.ABSr, 'AND a', M6502_VARIANTS.STOCK),
    0x2E: new M6502_opcode_info(0x2E, M6502_MN.ROL, M6502_AM.ABSm, 'ROL a', M6502_VARIANTS.STOCK),

    0x30: new M6502_opcode_info(0x30, M6502_MN.BMI, M6502_AM.PC_REL, 'BMI r', M6502_VARIANTS.STOCK),
    0x31: new M6502_opcode_info(0x31, M6502_MN.AND, M6502_AM.IND_Yr, 'AND (d),x', M6502_VARIANTS.STOCK),
    0x35: new M6502_opcode_info(0x35, M6502_MN.AND, M6502_AM.ZP_Xr, 'AND d,x', M6502_VARIANTS.STOCK),
    0x36: new M6502_opcode_info(0x36, M6502_MN.ROL, M6502_AM.ZP_Xm, 'ROL d,x', M6502_VARIANTS.STOCK),
    0x38: new M6502_opcode_info(0x38, M6502_MN.SEC, M6502_AM.IMPLIED, 'SEC', M6502_VARIANTS.STOCK),
    0x39: new M6502_opcode_info(0x39, M6502_MN.AND, M6502_AM.ABS_Yr, 'AND a,y', M6502_VARIANTS.STOCK),
    0x3D: new M6502_opcode_info(0x3D, M6502_MN.AND, M6502_AM.ABS_Xr, 'AND a,x', M6502_VARIANTS.STOCK),
    0x3E: new M6502_opcode_info(0x3E, M6502_MN.ROL, M6502_AM.ABS_Xm, 'ROL a,x', M6502_VARIANTS.STOCK),

    0x40: new M6502_opcode_info(0x40, M6502_MN.RTI, M6502_AM.IMPLIED, 'RTI', M6502_VARIANTS.STOCK),
    0x41: new M6502_opcode_info(0x41, M6502_MN.EOR, M6502_AM.X_INDr, 'EOR (d,x)', M6502_VARIANTS.STOCK),
    0x45: new M6502_opcode_info(0x45, M6502_MN.EOR, M6502_AM.ZPr, 'EOR d', M6502_VARIANTS.STOCK),
    0x46: new M6502_opcode_info(0x46, M6502_MN.LSR, M6502_AM.ZPm, 'LSR d', M6502_VARIANTS.STOCK),
    0x48: new M6502_opcode_info(0x48, M6502_MN.PHA, M6502_AM.IMPLIED, 'PHA', M6502_VARIANTS.STOCK),
    0x49: new M6502_opcode_info(0x49, M6502_MN.EOR, M6502_AM.IMM, 'EOR #', M6502_VARIANTS.STOCK),
    0x4A: new M6502_opcode_info(0x4A, M6502_MN.LSR, M6502_AM.ACCUM, 'LSR A', M6502_VARIANTS.STOCK),
    0x4C: new M6502_opcode_info(0x4C, M6502_MN.JMP, M6502_AM.ABSjmp, 'JMP a', M6502_VARIANTS.STOCK),
    0x4D: new M6502_opcode_info(0x4D, M6502_MN.EOR, M6502_AM.ABSr, 'EOR a', M6502_VARIANTS.STOCK),
    0x4E: new M6502_opcode_info(0x4E, M6502_MN.LSR, M6502_AM.ABSm, 'LSR a', M6502_VARIANTS.STOCK),

    0x50: new M6502_opcode_info(0x50, M6502_MN.BVC, M6502_AM.PC_REL, 'BVC r', M6502_VARIANTS.STOCK),
    0x51: new M6502_opcode_info(0x51, M6502_MN.EOR, M6502_AM.IND_Yr, 'EOR (d),y', M6502_VARIANTS.STOCK),
    0x55: new M6502_opcode_info(0x55, M6502_MN.EOR, M6502_AM.ZP_Xr, 'EOR d,x', M6502_VARIANTS.STOCK),
    0x56: new M6502_opcode_info(0x56, M6502_MN.LSR, M6502_AM.ZP_Xm, 'LSR d,x', M6502_VARIANTS.STOCK),
    0x58: new M6502_opcode_info(0x58, M6502_MN.CLI, M6502_AM.IMPLIED, 'CLI', M6502_VARIANTS.STOCK),
    0x59: new M6502_opcode_info(0x59, M6502_MN.EOR, M6502_AM.ABS_Yr, 'EOR a,y', M6502_VARIANTS.STOCK),
    0x5D: new M6502_opcode_info(0x5D, M6502_MN.EOR, M6502_AM.ABS_Xr, 'EOR a,x', M6502_VARIANTS.STOCK),
    0x5E: new M6502_opcode_info(0x5E, M6502_MN.LSR, M6502_AM.ABS_Xm, 'LSR a,x', M6502_VARIANTS.STOCK),

    0x60: new M6502_opcode_info(0x60, M6502_MN.RTS, M6502_AM.IMPLIED, 'RTS', M6502_VARIANTS.STOCK),
    0x61: new M6502_opcode_info(0x61, M6502_MN.ADC, M6502_AM.X_INDr, 'ADC (d,x)', M6502_VARIANTS.STOCK),
    0x65: new M6502_opcode_info(0x65, M6502_MN.ADC, M6502_AM.ZPr, 'ADC d', M6502_VARIANTS.STOCK),
    0x66: new M6502_opcode_info(0x66, M6502_MN.ROR, M6502_AM.ZPm, 'ROR d', M6502_VARIANTS.STOCK),
    0x68: new M6502_opcode_info(0x68, M6502_MN.PLA, M6502_AM.IMPLIED, 'PLA', M6502_VARIANTS.STOCK),
    0x69: new M6502_opcode_info(0x69, M6502_MN.ADC, M6502_AM.IMM, 'ADC #', M6502_VARIANTS.STOCK),
    0x6A: new M6502_opcode_info(0x6A, M6502_MN.ROR, M6502_AM.ACCUM, 'ROR A', M6502_VARIANTS.STOCK),
    0x6C: new M6502_opcode_info(0x6C, M6502_MN.JMP, M6502_AM.INDjmp, 'JMP (d)', M6502_VARIANTS.STOCK),
    0x6D: new M6502_opcode_info(0x6D, M6502_MN.ADC, M6502_AM.ABSr, 'ADC a', M6502_VARIANTS.STOCK),
    0x6E: new M6502_opcode_info(0x6E, M6502_MN.ROR, M6502_AM.ABSm, 'ROR a', M6502_VARIANTS.STOCK),

    0x70: new M6502_opcode_info(0x70, M6502_MN.BVS, M6502_AM.PC_REL, 'BVS r', M6502_VARIANTS.STOCK),
    0x71: new M6502_opcode_info(0x71, M6502_MN.ADC, M6502_AM.IND_Yr, 'ADC (d),y', M6502_VARIANTS.STOCK),
    0x75: new M6502_opcode_info(0x75, M6502_MN.ADC, M6502_AM.ZP_Xr, 'ADC d,x', M6502_VARIANTS.STOCK),
    0x76: new M6502_opcode_info(0x76, M6502_MN.ROR, M6502_AM.ZP_Xm, 'ROR d,x', M6502_VARIANTS.STOCK),
    0x78: new M6502_opcode_info(0x78, M6502_MN.SEI, M6502_AM.IMPLIED, 'SEI', M6502_VARIANTS.STOCK),
    0x79: new M6502_opcode_info(0x79, M6502_MN.ADC, M6502_AM.ABS_Yr, 'ADC a,y', M6502_VARIANTS.STOCK),
    0x7D: new M6502_opcode_info(0x7D, M6502_MN.ADC, M6502_AM.ABS_Xr, 'ADC a,x', M6502_VARIANTS.STOCK),
    0x7E: new M6502_opcode_info(0x7E, M6502_MN.ROR, M6502_AM.ABS_Xm, 'ROR a,x', M6502_VARIANTS.STOCK),

    0x81: new M6502_opcode_info(0x81, M6502_MN.STA, M6502_AM.X_INDw, 'STA (d,x)', M6502_VARIANTS.STOCK),
    0x84: new M6502_opcode_info(0x84, M6502_MN.STY, M6502_AM.ZPw, 'STY d', M6502_VARIANTS.STOCK),
    0x85: new M6502_opcode_info(0x85, M6502_MN.STA, M6502_AM.ZPw, 'STA d', M6502_VARIANTS.STOCK),
    0x86: new M6502_opcode_info(0x86, M6502_MN.STX, M6502_AM.ZPw, 'STX d', M6502_VARIANTS.STOCK),
    0x88: new M6502_opcode_info(0x88, M6502_MN.DEY, M6502_AM.IMPLIED, 'DEY', M6502_VARIANTS.STOCK),
    0x8A: new M6502_opcode_info(0x8A, M6502_MN.TXA, M6502_AM.IMPLIED, 'TXA', M6502_VARIANTS.STOCK),
    0x8C: new M6502_opcode_info(0x8C, M6502_MN.STY, M6502_AM.ABSw, 'STY a', M6502_VARIANTS.STOCK),
    0x8D: new M6502_opcode_info(0x8D, M6502_MN.STA, M6502_AM.ABSw, 'STA a', M6502_VARIANTS.STOCK),
    0x8E: new M6502_opcode_info(0x8E, M6502_MN.STX, M6502_AM.ABSw, 'STX a', M6502_VARIANTS.STOCK),

    0x90: new M6502_opcode_info(0x90, M6502_MN.BCC, M6502_AM.PC_REL, 'BCC', M6502_VARIANTS.STOCK),
    0x91: new M6502_opcode_info(0x91, M6502_MN.STA, M6502_AM.IND_Yw, 'STA (d),y', M6502_VARIANTS.STOCK),
    0x94: new M6502_opcode_info(0x94, M6502_MN.STY, M6502_AM.ZP_Xw, 'STY d,x', M6502_VARIANTS.STOCK),
    0x95: new M6502_opcode_info(0x95, M6502_MN.STA, M6502_AM.ZP_Xw, 'STA d,x', M6502_VARIANTS.STOCK),
    0x96: new M6502_opcode_info(0x96, M6502_MN.STX, M6502_AM.ZP_Yw, 'STX d,y', M6502_VARIANTS.STOCK),
    0x98: new M6502_opcode_info(0x98, M6502_MN.TYA, M6502_AM.IMPLIED, 'TYA', M6502_VARIANTS.STOCK),
    0x99: new M6502_opcode_info(0x99, M6502_MN.STA, M6502_AM.ABS_Yw, 'STA a,y', M6502_VARIANTS.STOCK),
    0x9A: new M6502_opcode_info(0x9A, M6502_MN.TXS, M6502_AM.IMPLIED, 'TXS', M6502_VARIANTS.STOCK),
    0x9D: new M6502_opcode_info(0x9D, M6502_MN.STA, M6502_AM.ABS_Xw, 'STA a,x', M6502_VARIANTS.STOCK),

    0xA0: new M6502_opcode_info(0xA0, M6502_MN.LDY, M6502_AM.IMM, 'LDY #', M6502_VARIANTS.STOCK),
    0xA1: new M6502_opcode_info(0xA1, M6502_MN.LDA, M6502_AM.X_INDr, 'LDA (d,x)', M6502_VARIANTS.STOCK),
    0xA2: new M6502_opcode_info(0xA2, M6502_MN.LDX, M6502_AM.IMM, 'LDX #', M6502_VARIANTS.STOCK),
    0xA4: new M6502_opcode_info(0xA4, M6502_MN.LDY, M6502_AM.ZPr, 'LDY d', M6502_VARIANTS.STOCK),
    0xA5: new M6502_opcode_info(0xA5, M6502_MN.LDA, M6502_AM.ZPr, 'LDA d', M6502_VARIANTS.STOCK),
    0xA6: new M6502_opcode_info(0xA6, M6502_MN.LDX, M6502_AM.ZPr, 'LDX d', M6502_VARIANTS.STOCK),
    0xA8: new M6502_opcode_info(0xA8, M6502_MN.TAY, M6502_AM.IMPLIED, 'TAY', M6502_VARIANTS.STOCK),
    0xA9: new M6502_opcode_info(0xA9, M6502_MN.LDA, M6502_AM.IMM, 'LDA #', M6502_VARIANTS.STOCK),
    0xAA: new M6502_opcode_info(0xAA, M6502_MN.TAX, M6502_AM.IMPLIED, 'TAX', M6502_VARIANTS.STOCK),
    0xAC: new M6502_opcode_info(0xAC, M6502_MN.LDY, M6502_AM.ABSr, 'LDY a', M6502_VARIANTS.STOCK),
    0xAD: new M6502_opcode_info(0xAD, M6502_MN.LDA, M6502_AM.ABSr, 'LDA a', M6502_VARIANTS.STOCK),
    0xAE: new M6502_opcode_info(0xAE, M6502_MN.LDX, M6502_AM.ABSr, 'LDX a', M6502_VARIANTS.STOCK),

    0xB0: new M6502_opcode_info(0xB0, M6502_MN.BCS, M6502_AM.PC_REL, 'BCS r', M6502_VARIANTS.STOCK),
    0xB1: new M6502_opcode_info(0xB1, M6502_MN.LDA, M6502_AM.IND_Yr, 'LDA (d),y', M6502_VARIANTS.STOCK),
    0xB4: new M6502_opcode_info(0xB4, M6502_MN.LDY, M6502_AM.ZP_Xr, 'LDY d,x', M6502_VARIANTS.STOCK),
    0xB5: new M6502_opcode_info(0xB5, M6502_MN.LDA, M6502_AM.ZP_Xr, 'LDA d,x', M6502_VARIANTS.STOCK),
    0xB6: new M6502_opcode_info(0xB6, M6502_MN.LDX, M6502_AM.ZP_Yr, 'LDX d,y', M6502_VARIANTS.STOCK),
    0xB8: new M6502_opcode_info(0xB8, M6502_MN.CLV, M6502_AM.IMPLIED, 'CLV', M6502_VARIANTS.STOCK),
    0xB9: new M6502_opcode_info(0xB9, M6502_MN.LDA, M6502_AM.ABS_Yr, 'LDA a,y', M6502_VARIANTS.STOCK),
    0xBA: new M6502_opcode_info(0xBA, M6502_MN.TSX, M6502_AM.IMPLIED, 'TSX', M6502_VARIANTS.STOCK),
    0xBC: new M6502_opcode_info(0xBC, M6502_MN.LDY, M6502_AM.ABS_Xr, 'LDY a,x', M6502_VARIANTS.STOCK),
    0xBD: new M6502_opcode_info(0xBD, M6502_MN.LDA, M6502_AM.ABS_Xr, 'LDA a,x', M6502_VARIANTS.STOCK),
    0xBE: new M6502_opcode_info(0xBE, M6502_MN.LDX, M6502_AM.ABS_Yr, 'LDX a,y', M6502_VARIANTS.STOCK),

    0xC0: new M6502_opcode_info(0xC0, M6502_MN.CPY, M6502_AM.IMM, 'CPY #', M6502_VARIANTS.STOCK),
    0xC1: new M6502_opcode_info(0xC1, M6502_MN.CMP, M6502_AM.X_INDr, 'CMP (d,x)', M6502_VARIANTS.STOCK),
    0xC4: new M6502_opcode_info(0xC4, M6502_MN.CPY, M6502_AM.ZPr, 'CPY d', M6502_VARIANTS.STOCK),
    0xC5: new M6502_opcode_info(0xC5, M6502_MN.CMP, M6502_AM.ZPr, 'CMP d', M6502_VARIANTS.STOCK),
    0xC6: new M6502_opcode_info(0xC6, M6502_MN.DEC, M6502_AM.ZPm, 'DEC d', M6502_VARIANTS.STOCK),
    0xC8: new M6502_opcode_info(0xC8, M6502_MN.INY, M6502_AM.IMPLIED, 'INY', M6502_VARIANTS.STOCK),
    0xC9: new M6502_opcode_info(0xC9, M6502_MN.CMP, M6502_AM.IMM, 'CMP #', M6502_VARIANTS.STOCK),
    0xCA: new M6502_opcode_info(0xCA, M6502_MN.DEX, M6502_AM.IMPLIED, 'DEX', M6502_VARIANTS.STOCK),
    0xCC: new M6502_opcode_info(0xCC, M6502_MN.CPY, M6502_AM.ABSr, 'CPY a', M6502_VARIANTS.STOCK),
    0xCD: new M6502_opcode_info(0xCD, M6502_MN.CMP, M6502_AM.ABSr, 'CMP a', M6502_VARIANTS.STOCK),
    0xCE: new M6502_opcode_info(0xCE, M6502_MN.DEC, M6502_AM.ABSm, 'DEC a', M6502_VARIANTS.STOCK),

    0xD0: new M6502_opcode_info(0xD0, M6502_MN.BNE, M6502_AM.PC_REL, 'BNE r', M6502_VARIANTS.STOCK),
    0xD1: new M6502_opcode_info(0xD1, M6502_MN.CMP, M6502_AM.IND_Yr, 'CMP (d),y', M6502_VARIANTS.STOCK),
    0xD5: new M6502_opcode_info(0xD5, M6502_MN.CMP, M6502_AM.ZP_Xr, 'CMP d,x', M6502_VARIANTS.STOCK),
    0xD6: new M6502_opcode_info(0xD6, M6502_MN.DEC, M6502_AM.ZP_Xm, 'DEC d,x', M6502_VARIANTS.STOCK),
    0xD8: new M6502_opcode_info(0xD8, M6502_MN.CLD, M6502_AM.IMPLIED, 'CLD', M6502_VARIANTS.STOCK),
    0xD9: new M6502_opcode_info(0xD9, M6502_MN.CMP, M6502_AM.ABS_Yr, 'CMP a,y', M6502_VARIANTS.STOCK),
    0xDD: new M6502_opcode_info(0xDD, M6502_MN.CMP, M6502_AM.ABS_Xr, 'CMP a,x', M6502_VARIANTS.STOCK),
    0xDE: new M6502_opcode_info(0xDE, M6502_MN.DEC, M6502_AM.ABS_Xm, 'DEC a,x', M6502_VARIANTS.STOCK),

    0xE0: new M6502_opcode_info(0xE0, M6502_MN.CPX, M6502_AM.IMM, 'CPX #', M6502_VARIANTS.STOCK),
    0xE1: new M6502_opcode_info(0xE1, M6502_MN.SBC, M6502_AM.X_INDr, 'SBC (d,x)', M6502_VARIANTS.STOCK),
    0xE4: new M6502_opcode_info(0xE4, M6502_MN.CPX, M6502_AM.ZPr, 'CPX d', M6502_VARIANTS.STOCK),
    0xE5: new M6502_opcode_info(0xE5, M6502_MN.SBC, M6502_AM.ZPr, 'SBC d', M6502_VARIANTS.STOCK),
    0xE6: new M6502_opcode_info(0xE6, M6502_MN.INC, M6502_AM.ZPm, 'INC d', M6502_VARIANTS.STOCK),
    0xE8: new M6502_opcode_info(0xE8, M6502_MN.INX, M6502_AM.IMPLIED, 'INX', M6502_VARIANTS.STOCK),
    0xE9: new M6502_opcode_info(0xE9, M6502_MN.SBC, M6502_AM.IMM, 'SBC #', M6502_VARIANTS.STOCK),
    0xEA: new M6502_opcode_info(0xEA, M6502_MN.NOP, M6502_AM.IMPLIED, 'NOP', M6502_VARIANTS.STOCK),
    0xEC: new M6502_opcode_info(0xEC, M6502_MN.CPX, M6502_AM.ABSr, 'CPX a', M6502_VARIANTS.STOCK),
    0xED: new M6502_opcode_info(0xED, M6502_MN.SBC, M6502_AM.ABSr, 'SBC a', M6502_VARIANTS.STOCK),
    0xEE: new M6502_opcode_info(0xEE, M6502_MN.INC, M6502_AM.ABSm, 'INC a', M6502_VARIANTS.STOCK),

    0xF0: new M6502_opcode_info(0xF0, M6502_MN.BEQ, M6502_AM.PC_REL, 'BEQ r', M6502_VARIANTS.STOCK),
    0xF1: new M6502_opcode_info(0xF1, M6502_MN.SBC, M6502_AM.IND_Yr, 'SBC (d),y', M6502_VARIANTS.STOCK),
    0xF5: new M6502_opcode_info(0xF5, M6502_MN.SBC, M6502_AM.ZP_Xr, 'SBC d,x', M6502_VARIANTS.STOCK),
    0xF6: new M6502_opcode_info(0xF6, M6502_MN.INC, M6502_AM.ZP_Xm, 'INC d,X', M6502_VARIANTS.STOCK),
    0xF8: new M6502_opcode_info(0xF8, M6502_MN.SED, M6502_AM.IMPLIED, 'SED', M6502_VARIANTS.STOCK),
    0xF9: new M6502_opcode_info(0xF9, M6502_MN.SBC, M6502_AM.ABS_Yr, 'SBC a,y', M6502_VARIANTS.STOCK),
    0xFD: new M6502_opcode_info(0xFD, M6502_MN.SBC, M6502_AM.ABS_Xr, 'SBC a,x', M6502_VARIANTS.STOCK),
    0xFE: new M6502_opcode_info(0xFE, M6502_MN.INC, M6502_AM.ABS_Xm, 'INC a,x', M6502_VARIANTS.STOCK),
});

const getJSON = async url => {
    const response = await fetch(url);
    if (!response.ok) { // check if response worked (no 404 errors etc...)
        console.log(response);
    }
    //throw new Error(response.statusText);

    const data = response.json(); // get JSON from the response
    return data; // returns a promise, which resolves to this data value
}
let JAMESM6502local_server_url;


let JAMESM6502testRAM = new Uint8Array(65536);

function JAMESfmt_test(tst) {
    let oute = JSON.parse(JSON.stringify(tst));
    oute.initial.pc = hex4(oute.initial.pc);
    oute.initial.a = hex2(oute.initial.a);
    oute.initial.s = hex2(oute.initial.s);
    oute.initial.x = hex2(oute.initial.x);
    oute.initial.y = hex2(oute.initial.y);
    oute.initial.p = hex2(oute.initial.p);
    for (let j in oute.initial.ram) {
        let ro = oute.initial.ram[j]
        ro[0] = hex4(ro[0]);
        if (ro[1] !== null) ro[1] = hex2(ro[1]);
    }
    for (let ci in oute.cycles) {
        let cycle = oute.cycles[ci];
        cycle[0] = hex4(cycle[0]);
        if (cycle[1] !== null) cycle[1] = hex2(cycle[1]);
    }
    oute.final.pc = hex4(oute.final.pc);
    oute.final.a = hex2(oute.final.a);
    oute.final.s = hex2(oute.final.s);
    oute.final.x = hex2(oute.final.x);
    oute.final.y = hex2(oute.final.y);
    oute.final.p = hex2(oute.final.p);
    return oute;
}

class JAMESM6502test_return {
    constructor(passed, ins, messages, addr_io_mismatches, length_mismatches, failed_test_struct) {
        this.passed = passed;
        this.ins = ins;
        this.hex_ins = hex0x2(ins);
        this.messages = messages;
        this.addr_io_mismatches = addr_io_mismatches;
        this.length_mismatches = length_mismatches;
        this.failed_test_struct = failed_test_struct;
    }
}


function M6502_PARSEP(w) {
    let outstr;
    //if (E === 0) {
        outstr = 'C' + + (w & 0x01);
        outstr += ' Z' + ((w & 0x02) >>> 1);
        outstr += ' I' + ((w & 0x04) >>> 2);
        outstr += ' D' + ((w & 0x08) >>> 3);
        outstr += ' B' + ((w & 0x10) >>> 4);
        outstr += ' --';
        outstr += ' V' + ((w & 0x40) >>> 6);
        outstr += ' N' + ((w & 0x80) >>> 7);
    //}
    return outstr;
}

const M6502_TEST_DO_TRACING = true;

function faddr(addr) {
    return (addr & 0xFFFF);
}

const M65C02_ADCSBC = [0x61, 0x65, 0x69, 0x6D, 0x71, 0x72, 0x75, 0x79, 0x7D, 0xE1, 0xE5, 0xE9, 0xED, 0xF1, 0xF2, 0xF5, 0xF9, 0xFD]
function M65C02_IS_ADCSBC(ins) {
    return (M65C02_ADCSBC.indexOf(ins) !== -1);
}

/**
 * @param {MCS6502} cpu
 * @param tests
 * @returns {JAMESM6502test_return}
 */
function JAMESM6502test_it_automated(cpu, tests) {
    let padl = function(what, howmuch) {
        while(what.length < howmuch) {
            what = ' ' + what;
        }
        return what;
    }
    let cpin = function(what, from) {
        return (from.indexOf(what) !== -1);
    }

    //cpu.clock.trace_cycles = 1;
    let cyclei;
    let last_pc;
    let ins;
    let messages = [];
    let addr_io_mismatched = 0;
    let length_mismatch = 0;
    for (let i in tests) {
        let initial = tests[i].initial;
        let final = tests[i].final;
        cpu.pc = initial.pc//+1) & 0xFFFF;
        cpu.sp = initial.s;
        cpu.a = initial.a;
        cpu.ix = initial.x;
        cpu.iy = initial.y;
        cpu.ccr = initial.p;
        for (let j in initial.ram) {
            JAMESM6502testRAM[faddr(initial.ram[j][0])] = initial.ram[j][1];
        }

        ins = JAMESM6502testRAM[initial.pc];
        let addr;
        let passed = true;
        let numcycles = tests[i].cycles.length;
        cpu._execute();
        let testregs = function(name, mine, theirs) {
            if (mine !== theirs) {
                if (name === 'P') {
                    //if (M65C02_ADCSBC.indexOf(ins) !== -1)
                    /*cpu.regs.P.B = +(!cpu.regs.P.B);
                    if (cpu.regs.P.getbyte() === theirs) {
                        return true;
                    }
                    // If 0x61 and D is set, see if V is the problem*/
                    if (M65C02_IS_ADCSBC(ins) && (cpu.ccr & 8)) {
                        cpu.ccr ^= 0x40;
                        if (cpu.ccr === theirs) {
                            return true;
                        }
                        let cmp = (cpu.ccr & 0xBE);
                        if (cmp === (theirs & 0xBE)) return true;
                    }
                    messages.push('A: ' + hex0x2(cpu.a));
                    messages.push('ourP   ' + M6502_PARSEP(cpu.ccr));
                    messages.push('theirP ' + M6502_PARSEP(theirs));
                }
                messages.push('F ' + name + ' MISMATCH! MINE:' + hex0x2(mine) + ' THEIRS:' + hex0x2(theirs));
                return false;
            }
            return true;
        }
        //let JMP_INS = [];
        //let JMP_INS = [0x00, 0x02, 0x10, 0x20, 0x30, 0x40, 0x4C, 0x50, 0x6C, 0x70, 0x7C, 0x80, 0x90, 0xB0, 0xD0, 0xF0, 0xFC, 0x54, 0x44];
        let JMP_INS = [];
        if (JMP_INS.indexOf(ins) !== -1) {
            passed &= testregs('PC', (cpu.pc - 1) & 0xFFFF, final.pc)
        } else passed &= testregs('PC', cpu.pc, final.pc);
        passed &= testregs('ACCUMULATOR', cpu.a, final.a);
        passed &= testregs('X', cpu.ix, final.x);
        passed &= testregs('Y', cpu.iy, final.y);
        passed &= testregs('S', cpu.sp, final.s);
        passed &= testregs('P', cpu.ccr, final.p);

        for (let j in final.ram) {
            if (JAMESM6502testRAM[faddr(final.ram[j][0])] !== final.ram[j][1]) {
                passed = false;
                messages.push('RAM failed! ' + hex0x4(final.ram[j][0]) + ' supposed to be ' + hex0x2(final.ram[j][1]) + ' but is ' + hex0x2(JAMESM6502testRAM[final.ram[j][0]]));
            }
        }

        if (!passed) {
            messages.push('FAILED AT ENDING!');
            //if (cpu.regs.P.D === 0)
                return new JAMESM6502test_return(false, ins, messages, addr_io_mismatched, length_mismatch, JAMESfmt_test(tests[i]));
        }
        dbg.traces.clear();

    }
    return new JAMESM6502test_return(true, ins, messages, addr_io_mismatched, length_mismatch, null);
}

let JAMESM6502_io_mismatches = [];

export async function JAMEStest_pt_m65c02() {
    JAMESM6502local_server_url = 'http://[::1]:8000/misc/tests/ProcessorTests/wdc65c02/v1/'
    await JAMEStest_pt_m6502(M6502_stock_matrix, true);
}

async function JAMEStest_pt_m6502_ins(cpu, ins) {
    let opc = hex2(ins).toLowerCase();
    let data = await getJSON(JAMESM6502local_server_url + opc + '.json');
    let ADC8_TESTS = [0x61, 0x65, 0x69, 0x6D, 0x71, 0x75, 0x79, 0x7D];
    console.log(JAMESM6502local_server_url + opc + '.json')
    console.log('TESTING', hex0x2(ins));
    let result = JAMESM6502test_it_automated(cpu, data);
    if (!result.passed) {
        tconsole.addl(txf('{r}TEST FOR {/b}' + hex0x2(ins) + ' {/r*}FAILED!{/} See console for test deets'));
        console.log(result.failed_test_struct);
    }
    if (result.messages.length !== 0) {
        tconsole.addl(null, '------Messages:');
        for (let i in result.messages) {
            tconsole.addl(i, result.messages[i]);
        }
    }
    if (result.addr_io_mismatches !== 0) {
        tconsole.addl(txf('{r}ADDR MISMATCHES ON IO: {/}' + result.addr_io_mismatches))
        JAMESM6502_io_mismatches.push(hex0x2(ins));
    }
    if (result.length_mismatches !== 0) {
        tconsole.addl(txf('{r}POTENTIAL CYCLE LENGTH MISMATCHES: {/}' + result.length_mismatches))
    }
    /*
    .then(data => {
        console.log('GOT IT, TESTING')
        test_it(data);
        console.log('DONE!')
        in_testing = false;
    });
     */
    return result.passed;
}

async function JAMEStest_pt_m6502(opcodes, skip65c02brr=false) {
    console.log('TRYIN TO GET ME SOME JSON')
     let read8 = function(addr) {
        return JAMESM6502testRAM[addr];
    }

    //let cpu = new m6502_t(opcodes, {});
    let cpu = new MCS6502(Math.floor(20790000 / 10));
    cpu.read8 = function(addr) { return JAMESM6502testRAM[addr]; }
    cpu.write8 = function(addr, data) { JAMESM6502testRAM[addr] = data; }
    let start_test = 0x00;
    let skip_tests = []; // Tests do not correctly set B after BRK
    /*if (skip65c02brr) {
        skip_tests = [0x0F, 0x1F, 0x2F, 0x3F, 0x4F, 0x5F, 0x6F, 0x7F, 0x8F, 0x9F, 0xAF, 0xBF, 0xCF, 0xDF, 0xEF, 0xFF,
            0xCB, 0xDB,
        ];
    }*/
    //if (M6502_TEST_DO_TRACING) cpu.enable_tracing(read8);
    //console.log('DO TRACING?', WDC_TEST_DO_TRACING);
    for (let i = start_test; i < 256; i++) {
        if (skip_tests.indexOf(i) !== -1) {
            tconsole.addl(txf('Test for ' + hex0x2(i) + ' {b}skipped{/}!'));
            continue;
        }
        if (typeof opcodes[i] === 'undefined') {
            console.log('Skipping empty instruction', hex0x2(i));
            continue;
        }
        let result = await JAMEStest_pt_m6502_ins(cpu,i);
        if (!result) break;
        tconsole.addl(null, 'Test for ' + hex0x2(i) + ' passed!');
    }
    if (JAMESM6502_io_mismatches.length > 0) console.log('IO mismatches occured for', JAMESM6502_io_mismatches);
}

//window.onload = JAMEStest_pt_m65c02();
