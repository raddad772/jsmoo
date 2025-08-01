"use strict";

const M6502_OP_RESET = 0x100;
const M6502_OP_NMI = 0x101;
const M6502_OP_IRQ = 0x102;

const M6502_MAX_OPCODE = 0x102;

const M6502_VARIANTS = Object.freeze({
    STOCK: 0,
    STOCK_UNDOCUMENTED: 1,
    CMOS: 2,
    INVALID: 3
});

const M6502_VARIANTS_R = Object.freeze({
    0: 'stock',
    1: 'stock_undocumented',
    2: 'cmos',
    3: 'invalid'
});

//console.log(m6502_mn_gen());
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

function M6502_gen_MN_R() {
    let o = {};
    let ostr = "const M6502_MN_R = {\n";
    for (let a in M6502_MN) {
        ostr += '    ' + M6502_MN[a] + ': "' + a + '",\n'
        o[M6502_MN[a]] = a;
    }
    ostr += "\n};"
    return(ostr);
}
//console.log(M6502_gen_MN_R());

const M6502_MN_R = {
    0: "ADC",
    1: "AND",
    2: "ASL",
    3: "BCC",
    4: "BCS",
    5: "BEQ",
    6: "BIT",
    7: "BMI",
    8: "BNE",
    9: "BPL",
    10: "BRK",
    11: "BVC",
    12: "BVS",
    13: "CLC",
    14: "CLD",
    15: "CLI",
    16: "CLV",
    17: "CMP",
    18: "CPX",
    19: "CPY",
    20: "DEC",
    21: "DEX",
    22: "DEY",
    23: "EOR",
    24: "INC",
    25: "INX",
    26: "INY",
    27: "JMP",
    28: "JSR",
    29: "LDA",
    30: "LDX",
    31: "LDY",
    32: "LSR",
    33: "NOP",
    34: "ORA",
    35: "PHA",
    36: "PHP",
    37: "PLA",
    38: "PLP",
    39: "ROL",
    40: "ROR",
    41: "RTI",
    42: "RTS",
    43: "SBC",
    44: "SEC",
    45: "SED",
    46: "SEI",
    47: "STA",
    48: "STX",
    49: "STY",
    50: "TAX",
    51: "TAY",
    52: "TSX",
    53: "TXA",
    54: "TXS",
    55: "TYA",
    56: "NONE",
    57: "S_RESET",
    58: "S_NMI",
    59: "S_IRQ",
};

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

function M6502_gen_AM_R() {
    let o = {};
    let ostr = "const M6502_AM_R = {\n";
    for (let a in M6502_AM) {
        ostr += '    ' + M6502_AM[a] + ': "' + a + '",\n'
        o[M6502_AM[a]] = a;
    }
    ostr += "\n};"
    return(ostr);
}
//console.log(M6502_gen_AM_R());

const M6502_AM_R = {
    0: "ACCUM",
    1: "ABSr",
    101: "ABSm",
    102: "ABSw",
    103: "ABSjmp",
    104: "ABSjsr",
    2: "ABS_Xr",
    201: "ABS_Xm",
    202: "ABS_Xw",
    203: "ABS_Xsya",
    3: "ABS_Yr",
    301: "ABS_Ym",
    302: "ABS_Yw",
    303: "ABS_Yxas",
    304: "ABS_Ysxa",
    4: "IMM",
    5: "IMPLIED",
    6: "IND",
    601: "INDjmp",
    7: "X_INDr",
    701: "X_INDm",
    702: "X_INDw",
    8: "IND_Yr",
    801: "IND_Ym",
    802: "IND_Yw",
    9: "PC_REL",
    901: "PC_REL_ZP",
    10: "ZPr",
    1001: "ZPm",
    1002: "ZPw",
    11: "ZP_Xr",
    1101: "ZP_Xm",
    1102: "ZP_Xw",
    12: "ZP_Yr",
    1201: "ZP_Ym",
    1202: "ZP_Yw",
    13: "NONE",
    14: "ABS_IND_Xr",
    15: "ZP_INDr",
    1501: "ZP_INDw",
};


class M6502_opcode_info {
    constructor(opcode, ins, addr_mode, mnemonic, variant=M6502_VARIANTS.STOCK) {
        this.opcode = opcode;
        this.ins = ins;
        this.addr_mode = addr_mode;
        this.mnemonic = mnemonic;
        this.variant = variant;
    }
}

function generate_om_to_fill(name, default_mn='', default_am='', default_variant='STOCK') {
    let ostr = 'const ' + name + ' = Object.freeze({\n';
    for (let i = 0; i < 256; i++) {
        ostr += '    ' + hex0x2(i) + ': new M6502_opcode_info(' + hex0x2(i) + ', M6502_MN.' + default_mn + ', M6502_AM.' + default_am + ', \'\', M6502_VARIANTS.' + default_variant + '),\n'
    }
    return ostr + '});\n';
}

function generate_om_to_fill_holes(name, default_mn='', default_am='', default_variant='STOCK', holes_from=[]) {
    let ostr = 'const ' + name + ' = Object.freeze({\n';
    for (let i = 0; i < 256; i++) {
        if (typeof holes_from[i] !== 'undefined') continue;
        ostr += '    ' + hex0x2(i) + ': new M6502_opcode_info(' + hex0x2(i) + ', M6502_MN.' + default_mn + ', M6502_AM.' + default_am + ', \'\', M6502_VARIANTS.' + default_variant + '),\n'
    }
    return ostr + '});\n';
}


//console.log(generate_om_to_fill('M6502_invalid_matrix', 'NONE', 'NONE', 'INVALID'));

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
    [M6502_OP_RESET]: new M6502_opcode_info(M6502_OP_RESET, M6502_MN.S_RESET, M6502_AM.IMPLIED, 'RESET', M6502_VARIANTS.STOCK),
    [M6502_OP_NMI]: new M6502_opcode_info(M6502_OP_NMI, M6502_MN.S_NMI, M6502_AM.IMPLIED, 'NMI', M6502_VARIANTS.STOCK),
    [M6502_OP_IRQ]: new M6502_opcode_info(M6502_OP_IRQ, M6502_MN.S_IRQ, M6502_AM.IMPLIED, 'IRQ', M6502_VARIANTS.STOCK),
});

function generate_undoc_om_to_fill(name, default_mn='', default_am='', default_variant='STOCK') {
    let ostr = 'const ' + name + ' = Object.freeze({\n';
    for (let i = 0; i < 256; i++) {
        if (M6502_stock_matrix.hasOwnProperty(i)) continue;
        ostr += '    ' + hex0x2(i) + ': new M6502_opcode_info(' + hex0x2(i) + ', M6502_MN.' + default_mn + ', M6502_AM.' + default_am + ', \'\', M6502_VARIANTS.' + default_variant + '),\n'
    }
    return ostr + '});\n';
}


//console.log(generate_undoc_om_to_fill('M6502_undocumented_matrix', '', '', 'STOCK'));

const M6502_undocumented_matrix = Object.freeze({
    0x02: new M6502_opcode_info(0x02, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x03: new M6502_opcode_info(0x03, M6502_MN.SLO, M6502_AM.X_INDm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x04: new M6502_opcode_info(0x04, M6502_MN.DOP, M6502_AM.ZPr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x07: new M6502_opcode_info(0x07, M6502_MN.SLO, M6502_AM.ZPm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x0B: new M6502_opcode_info(0x0B, M6502_MN.AAC, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x0C: new M6502_opcode_info(0x0C, M6502_MN.TOP, M6502_AM.ABSr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x0F: new M6502_opcode_info(0x0F, M6502_MN.SLO, M6502_AM.ABSm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x12: new M6502_opcode_info(0x12, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x13: new M6502_opcode_info(0x13, M6502_MN.SLO, M6502_AM.IND_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x14: new M6502_opcode_info(0x14, M6502_MN.DOP, M6502_AM.ZP_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x17: new M6502_opcode_info(0x17, M6502_MN.SLO, M6502_AM.ZP_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x1A: new M6502_opcode_info(0x1A, M6502_MN.NOP, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x1B: new M6502_opcode_info(0x1B, M6502_MN.SLO, M6502_AM.ABS_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x1C: new M6502_opcode_info(0x1C, M6502_MN.TOP, M6502_AM.ABS_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x1F: new M6502_opcode_info(0x1F, M6502_MN.SLO, M6502_AM.ABS_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x22: new M6502_opcode_info(0x22, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x23: new M6502_opcode_info(0x23, M6502_MN.RLA, M6502_AM.X_INDm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x27: new M6502_opcode_info(0x27, M6502_MN.RLA, M6502_AM.ZPm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x2B: new M6502_opcode_info(0x2B, M6502_MN.AAC, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x2F: new M6502_opcode_info(0x2F, M6502_MN.RLA, M6502_AM.ABSm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x32: new M6502_opcode_info(0x32, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x33: new M6502_opcode_info(0x33, M6502_MN.RLA, M6502_AM.IND_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x34: new M6502_opcode_info(0x34, M6502_MN.DOP, M6502_AM.ZP_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x37: new M6502_opcode_info(0x37, M6502_MN.RLA, M6502_AM.ZP_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x3A: new M6502_opcode_info(0x3A, M6502_MN.NOP, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x3B: new M6502_opcode_info(0x3B, M6502_MN.RLA, M6502_AM.ABS_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x3C: new M6502_opcode_info(0x3C, M6502_MN.TOP, M6502_AM.ABS_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x3F: new M6502_opcode_info(0x3F, M6502_MN.RLA, M6502_AM.ABS_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x42: new M6502_opcode_info(0x42, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x43: new M6502_opcode_info(0x43, M6502_MN.SRE, M6502_AM.X_INDm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x44: new M6502_opcode_info(0x44, M6502_MN.DOP, M6502_AM.ZPr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x47: new M6502_opcode_info(0x47, M6502_MN.SRE, M6502_AM.ZPm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x4B: new M6502_opcode_info(0x4B, M6502_MN.ASR, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x4F: new M6502_opcode_info(0x4F, M6502_MN.SRE, M6502_AM.ABSm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x52: new M6502_opcode_info(0x52, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x53: new M6502_opcode_info(0x53, M6502_MN.SRE, M6502_AM.IND_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x54: new M6502_opcode_info(0x54, M6502_MN.DOP, M6502_AM.ZP_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x57: new M6502_opcode_info(0x57, M6502_MN.SRE, M6502_AM.ZP_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x5A: new M6502_opcode_info(0x5A, M6502_MN.NOP, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x5B: new M6502_opcode_info(0x5B, M6502_MN.SRE, M6502_AM.ABS_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x5C: new M6502_opcode_info(0x5C, M6502_MN.TOP, M6502_AM.ABS_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x5F: new M6502_opcode_info(0x5F, M6502_MN.SRE, M6502_AM.ABS_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x62: new M6502_opcode_info(0x62, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x63: new M6502_opcode_info(0x63, M6502_MN.RRA, M6502_AM.X_INDm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x64: new M6502_opcode_info(0x64, M6502_MN.DOP, M6502_AM.ZPr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x67: new M6502_opcode_info(0x67, M6502_MN.RRA, M6502_AM.ZPm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x6B: new M6502_opcode_info(0x6B, M6502_MN.ARR, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x6F: new M6502_opcode_info(0x6F, M6502_MN.RRA, M6502_AM.ABSm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x72: new M6502_opcode_info(0x72, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x73: new M6502_opcode_info(0x73, M6502_MN.RRA, M6502_AM.IND_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x74: new M6502_opcode_info(0x74, M6502_MN.DOP, M6502_AM.ZP_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x77: new M6502_opcode_info(0x77, M6502_MN.RRA, M6502_AM.ZP_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x7A: new M6502_opcode_info(0x7A, M6502_MN.NOP, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x7B: new M6502_opcode_info(0x7B, M6502_MN.RRA, M6502_AM.ABS_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x7C: new M6502_opcode_info(0x7C, M6502_MN.TOP, M6502_AM.ABS_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x7F: new M6502_opcode_info(0x7F, M6502_MN.RRA, M6502_AM.ABS_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x80: new M6502_opcode_info(0x80, M6502_MN.DOP, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x82: new M6502_opcode_info(0x82, M6502_MN.DOP, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x83: new M6502_opcode_info(0x83, M6502_MN.AAX, M6502_AM.X_INDw, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x87: new M6502_opcode_info(0x87, M6502_MN.AAX, M6502_AM.ZPw, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x89: new M6502_opcode_info(0x89, M6502_MN.DOP, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x8B: new M6502_opcode_info(0x8B, M6502_MN.XAA, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x8F: new M6502_opcode_info(0x8F, M6502_MN.AAX, M6502_AM.ABSw, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x92: new M6502_opcode_info(0x92, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x93: new M6502_opcode_info(0x93, M6502_MN.AXA, M6502_AM.IND_Yw, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x97: new M6502_opcode_info(0x97, M6502_MN.AAX, M6502_AM.ZP_Xw, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x9B: new M6502_opcode_info(0x9B, M6502_MN.XAS, M6502_AM.ABS_Yxas, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x9C: new M6502_opcode_info(0x9C, M6502_MN.SYA, M6502_AM.ABS_Xsya, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x9E: new M6502_opcode_info(0x9E, M6502_MN.SXA, M6502_AM.ABS_Ysxa, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0x9F: new M6502_opcode_info(0x9F, M6502_MN.AXA, M6502_AM.ABS_Yw, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xA3: new M6502_opcode_info(0xA3, M6502_MN.LAX, M6502_AM.X_INDr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xA7: new M6502_opcode_info(0xA7, M6502_MN.LAX, M6502_AM.ZPr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xAB: new M6502_opcode_info(0xAB, M6502_MN.ATX, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xAF: new M6502_opcode_info(0xAF, M6502_MN.LAX, M6502_AM.ABSr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xB2: new M6502_opcode_info(0xB2, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xB3: new M6502_opcode_info(0xB3, M6502_MN.LAX, M6502_AM.IND_Yr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xB7: new M6502_opcode_info(0xB7, M6502_MN.LAX, M6502_AM.ZP_Yr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xBB: new M6502_opcode_info(0xBB, M6502_MN.LAR, M6502_AM.ABS_Yr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xBF: new M6502_opcode_info(0xBF, M6502_MN.LAX, M6502_AM.ABS_Yr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xC2: new M6502_opcode_info(0xC2, M6502_MN.DOP, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xC3: new M6502_opcode_info(0xC3, M6502_MN.DCP, M6502_AM.X_INDm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xC7: new M6502_opcode_info(0xC7, M6502_MN.DCP, M6502_AM.ZPm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xCB: new M6502_opcode_info(0xCB, M6502_MN.AXS, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xCF: new M6502_opcode_info(0xCF, M6502_MN.DCP, M6502_AM.ABSm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xD2: new M6502_opcode_info(0xD2, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xD3: new M6502_opcode_info(0xD3, M6502_MN.DCP, M6502_AM.IND_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xD4: new M6502_opcode_info(0xD4, M6502_MN.DOP, M6502_AM.ZP_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xD7: new M6502_opcode_info(0xD7, M6502_MN.DCP, M6502_AM.ZP_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xDA: new M6502_opcode_info(0xDA, M6502_MN.NOP, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xDB: new M6502_opcode_info(0xDB, M6502_MN.DCP, M6502_AM.ABS_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xDC: new M6502_opcode_info(0xDC, M6502_MN.TOP, M6502_AM.ABS_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xDF: new M6502_opcode_info(0xDF, M6502_MN.DCP, M6502_AM.ABS_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xE2: new M6502_opcode_info(0xE2, M6502_MN.DOP, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xE3: new M6502_opcode_info(0xE3, M6502_MN.ISC, M6502_AM.X_INDm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xE7: new M6502_opcode_info(0xE7, M6502_MN.ISC, M6502_AM.ZPm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xEB: new M6502_opcode_info(0xEB, M6502_MN.SBC, M6502_AM.IMM, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xEF: new M6502_opcode_info(0xEF, M6502_MN.ISC, M6502_AM.ABSm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xF2: new M6502_opcode_info(0xF2, M6502_MN.KIL, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xF3: new M6502_opcode_info(0xF3, M6502_MN.ISC, M6502_AM.IND_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xF4: new M6502_opcode_info(0xF4, M6502_MN.DOP, M6502_AM.ZP_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xF7: new M6502_opcode_info(0xF7, M6502_MN.ISC, M6502_AM.ZP_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xFA: new M6502_opcode_info(0xFA, M6502_MN.NOP, M6502_AM.IMPLIED, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xFB: new M6502_opcode_info(0xFB, M6502_MN.ISC, M6502_AM.ABS_Ym, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xFC: new M6502_opcode_info(0xFC, M6502_MN.TOP, M6502_AM.ABS_Xr, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
    0xFF: new M6502_opcode_info(0xFF, M6502_MN.ISC, M6502_AM.ABS_Xm, '', M6502_VARIANTS.STOCK_UNDOCUMENTED),
});

const M6502_invalid_matrix = Object.freeze({
    0x00: new M6502_opcode_info(0x00, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x01: new M6502_opcode_info(0x01, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x02: new M6502_opcode_info(0x02, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x03: new M6502_opcode_info(0x03, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x04: new M6502_opcode_info(0x04, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x05: new M6502_opcode_info(0x05, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x06: new M6502_opcode_info(0x06, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x07: new M6502_opcode_info(0x07, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x08: new M6502_opcode_info(0x08, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x09: new M6502_opcode_info(0x09, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x0A: new M6502_opcode_info(0x0A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x0B: new M6502_opcode_info(0x0B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x0C: new M6502_opcode_info(0x0C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x0D: new M6502_opcode_info(0x0D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x0E: new M6502_opcode_info(0x0E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x0F: new M6502_opcode_info(0x0F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x10: new M6502_opcode_info(0x10, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x11: new M6502_opcode_info(0x11, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x12: new M6502_opcode_info(0x12, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x13: new M6502_opcode_info(0x13, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x14: new M6502_opcode_info(0x14, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x15: new M6502_opcode_info(0x15, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x16: new M6502_opcode_info(0x16, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x17: new M6502_opcode_info(0x17, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x18: new M6502_opcode_info(0x18, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x19: new M6502_opcode_info(0x19, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x1A: new M6502_opcode_info(0x1A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x1B: new M6502_opcode_info(0x1B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x1C: new M6502_opcode_info(0x1C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x1D: new M6502_opcode_info(0x1D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x1E: new M6502_opcode_info(0x1E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x1F: new M6502_opcode_info(0x1F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x20: new M6502_opcode_info(0x20, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x21: new M6502_opcode_info(0x21, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x22: new M6502_opcode_info(0x22, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x23: new M6502_opcode_info(0x23, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x24: new M6502_opcode_info(0x24, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x25: new M6502_opcode_info(0x25, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x26: new M6502_opcode_info(0x26, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x27: new M6502_opcode_info(0x27, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x28: new M6502_opcode_info(0x28, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x29: new M6502_opcode_info(0x29, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x2A: new M6502_opcode_info(0x2A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x2B: new M6502_opcode_info(0x2B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x2C: new M6502_opcode_info(0x2C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x2D: new M6502_opcode_info(0x2D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x2E: new M6502_opcode_info(0x2E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x2F: new M6502_opcode_info(0x2F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x30: new M6502_opcode_info(0x30, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x31: new M6502_opcode_info(0x31, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x32: new M6502_opcode_info(0x32, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x33: new M6502_opcode_info(0x33, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x34: new M6502_opcode_info(0x34, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x35: new M6502_opcode_info(0x35, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x36: new M6502_opcode_info(0x36, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x37: new M6502_opcode_info(0x37, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x38: new M6502_opcode_info(0x38, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x39: new M6502_opcode_info(0x39, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x3A: new M6502_opcode_info(0x3A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x3B: new M6502_opcode_info(0x3B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x3C: new M6502_opcode_info(0x3C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x3D: new M6502_opcode_info(0x3D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x3E: new M6502_opcode_info(0x3E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x3F: new M6502_opcode_info(0x3F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x40: new M6502_opcode_info(0x40, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x41: new M6502_opcode_info(0x41, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x42: new M6502_opcode_info(0x42, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x43: new M6502_opcode_info(0x43, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x44: new M6502_opcode_info(0x44, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x45: new M6502_opcode_info(0x45, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x46: new M6502_opcode_info(0x46, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x47: new M6502_opcode_info(0x47, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x48: new M6502_opcode_info(0x48, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x49: new M6502_opcode_info(0x49, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x4A: new M6502_opcode_info(0x4A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x4B: new M6502_opcode_info(0x4B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x4C: new M6502_opcode_info(0x4C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x4D: new M6502_opcode_info(0x4D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x4E: new M6502_opcode_info(0x4E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x4F: new M6502_opcode_info(0x4F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x50: new M6502_opcode_info(0x50, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x51: new M6502_opcode_info(0x51, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x52: new M6502_opcode_info(0x52, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x53: new M6502_opcode_info(0x53, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x54: new M6502_opcode_info(0x54, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x55: new M6502_opcode_info(0x55, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x56: new M6502_opcode_info(0x56, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x57: new M6502_opcode_info(0x57, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x58: new M6502_opcode_info(0x58, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x59: new M6502_opcode_info(0x59, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x5A: new M6502_opcode_info(0x5A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x5B: new M6502_opcode_info(0x5B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x5C: new M6502_opcode_info(0x5C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x5D: new M6502_opcode_info(0x5D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x5E: new M6502_opcode_info(0x5E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x5F: new M6502_opcode_info(0x5F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x60: new M6502_opcode_info(0x60, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x61: new M6502_opcode_info(0x61, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x62: new M6502_opcode_info(0x62, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x63: new M6502_opcode_info(0x63, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x64: new M6502_opcode_info(0x64, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x65: new M6502_opcode_info(0x65, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x66: new M6502_opcode_info(0x66, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x67: new M6502_opcode_info(0x67, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x68: new M6502_opcode_info(0x68, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x69: new M6502_opcode_info(0x69, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x6A: new M6502_opcode_info(0x6A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x6B: new M6502_opcode_info(0x6B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x6C: new M6502_opcode_info(0x6C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x6D: new M6502_opcode_info(0x6D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x6E: new M6502_opcode_info(0x6E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x6F: new M6502_opcode_info(0x6F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x70: new M6502_opcode_info(0x70, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x71: new M6502_opcode_info(0x71, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x72: new M6502_opcode_info(0x72, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x73: new M6502_opcode_info(0x73, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x74: new M6502_opcode_info(0x74, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x75: new M6502_opcode_info(0x75, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x76: new M6502_opcode_info(0x76, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x77: new M6502_opcode_info(0x77, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x78: new M6502_opcode_info(0x78, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x79: new M6502_opcode_info(0x79, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x7A: new M6502_opcode_info(0x7A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x7B: new M6502_opcode_info(0x7B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x7C: new M6502_opcode_info(0x7C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x7D: new M6502_opcode_info(0x7D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x7E: new M6502_opcode_info(0x7E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x7F: new M6502_opcode_info(0x7F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x80: new M6502_opcode_info(0x80, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x81: new M6502_opcode_info(0x81, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x82: new M6502_opcode_info(0x82, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x83: new M6502_opcode_info(0x83, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x84: new M6502_opcode_info(0x84, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x85: new M6502_opcode_info(0x85, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x86: new M6502_opcode_info(0x86, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x87: new M6502_opcode_info(0x87, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x88: new M6502_opcode_info(0x88, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x89: new M6502_opcode_info(0x89, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x8A: new M6502_opcode_info(0x8A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x8B: new M6502_opcode_info(0x8B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x8C: new M6502_opcode_info(0x8C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x8D: new M6502_opcode_info(0x8D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x8E: new M6502_opcode_info(0x8E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x8F: new M6502_opcode_info(0x8F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x90: new M6502_opcode_info(0x90, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x91: new M6502_opcode_info(0x91, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x92: new M6502_opcode_info(0x92, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x93: new M6502_opcode_info(0x93, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x94: new M6502_opcode_info(0x94, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x95: new M6502_opcode_info(0x95, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x96: new M6502_opcode_info(0x96, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x97: new M6502_opcode_info(0x97, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x98: new M6502_opcode_info(0x98, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x99: new M6502_opcode_info(0x99, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x9A: new M6502_opcode_info(0x9A, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x9B: new M6502_opcode_info(0x9B, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x9C: new M6502_opcode_info(0x9C, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x9D: new M6502_opcode_info(0x9D, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x9E: new M6502_opcode_info(0x9E, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0x9F: new M6502_opcode_info(0x9F, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA0: new M6502_opcode_info(0xA0, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA1: new M6502_opcode_info(0xA1, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA2: new M6502_opcode_info(0xA2, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA3: new M6502_opcode_info(0xA3, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA4: new M6502_opcode_info(0xA4, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA5: new M6502_opcode_info(0xA5, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA6: new M6502_opcode_info(0xA6, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA7: new M6502_opcode_info(0xA7, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA8: new M6502_opcode_info(0xA8, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xA9: new M6502_opcode_info(0xA9, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xAA: new M6502_opcode_info(0xAA, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xAB: new M6502_opcode_info(0xAB, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xAC: new M6502_opcode_info(0xAC, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xAD: new M6502_opcode_info(0xAD, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xAE: new M6502_opcode_info(0xAE, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xAF: new M6502_opcode_info(0xAF, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB0: new M6502_opcode_info(0xB0, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB1: new M6502_opcode_info(0xB1, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB2: new M6502_opcode_info(0xB2, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB3: new M6502_opcode_info(0xB3, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB4: new M6502_opcode_info(0xB4, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB5: new M6502_opcode_info(0xB5, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB6: new M6502_opcode_info(0xB6, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB7: new M6502_opcode_info(0xB7, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB8: new M6502_opcode_info(0xB8, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xB9: new M6502_opcode_info(0xB9, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xBA: new M6502_opcode_info(0xBA, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xBB: new M6502_opcode_info(0xBB, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xBC: new M6502_opcode_info(0xBC, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xBD: new M6502_opcode_info(0xBD, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xBE: new M6502_opcode_info(0xBE, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xBF: new M6502_opcode_info(0xBF, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC0: new M6502_opcode_info(0xC0, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC1: new M6502_opcode_info(0xC1, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC2: new M6502_opcode_info(0xC2, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC3: new M6502_opcode_info(0xC3, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC4: new M6502_opcode_info(0xC4, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC5: new M6502_opcode_info(0xC5, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC6: new M6502_opcode_info(0xC6, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC7: new M6502_opcode_info(0xC7, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC8: new M6502_opcode_info(0xC8, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xC9: new M6502_opcode_info(0xC9, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xCA: new M6502_opcode_info(0xCA, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xCB: new M6502_opcode_info(0xCB, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xCC: new M6502_opcode_info(0xCC, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xCD: new M6502_opcode_info(0xCD, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xCE: new M6502_opcode_info(0xCE, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xCF: new M6502_opcode_info(0xCF, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD0: new M6502_opcode_info(0xD0, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD1: new M6502_opcode_info(0xD1, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD2: new M6502_opcode_info(0xD2, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD3: new M6502_opcode_info(0xD3, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD4: new M6502_opcode_info(0xD4, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD5: new M6502_opcode_info(0xD5, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD6: new M6502_opcode_info(0xD6, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD7: new M6502_opcode_info(0xD7, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD8: new M6502_opcode_info(0xD8, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xD9: new M6502_opcode_info(0xD9, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xDA: new M6502_opcode_info(0xDA, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xDB: new M6502_opcode_info(0xDB, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xDC: new M6502_opcode_info(0xDC, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xDD: new M6502_opcode_info(0xDD, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xDE: new M6502_opcode_info(0xDE, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xDF: new M6502_opcode_info(0xDF, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE0: new M6502_opcode_info(0xE0, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE1: new M6502_opcode_info(0xE1, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE2: new M6502_opcode_info(0xE2, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE3: new M6502_opcode_info(0xE3, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE4: new M6502_opcode_info(0xE4, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE5: new M6502_opcode_info(0xE5, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE6: new M6502_opcode_info(0xE6, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE7: new M6502_opcode_info(0xE7, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE8: new M6502_opcode_info(0xE8, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xE9: new M6502_opcode_info(0xE9, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xEA: new M6502_opcode_info(0xEA, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xEB: new M6502_opcode_info(0xEB, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xEC: new M6502_opcode_info(0xEC, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xED: new M6502_opcode_info(0xED, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xEE: new M6502_opcode_info(0xEE, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xEF: new M6502_opcode_info(0xEF, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF0: new M6502_opcode_info(0xF0, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF1: new M6502_opcode_info(0xF1, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF2: new M6502_opcode_info(0xF2, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF3: new M6502_opcode_info(0xF3, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF4: new M6502_opcode_info(0xF4, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF5: new M6502_opcode_info(0xF5, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF6: new M6502_opcode_info(0xF6, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF7: new M6502_opcode_info(0xF7, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF8: new M6502_opcode_info(0xF8, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xF9: new M6502_opcode_info(0xF9, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xFA: new M6502_opcode_info(0xFA, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xFB: new M6502_opcode_info(0xFB, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xFC: new M6502_opcode_info(0xFC, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xFD: new M6502_opcode_info(0xFD, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xFE: new M6502_opcode_info(0xFE, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
    0xFF: new M6502_opcode_info(0xFF, M6502_MN.NONE, M6502_AM.NONE, '', M6502_VARIANTS.INVALID),
});

//console.log(generate_om_to_fill_holes('M6502_cmos_matrix', '', '', 'CMOS', M6502_stock_matrix));
const M6502_cmos_matrix = Object.freeze({
    0x02: new M6502_opcode_info(0x02, M6502_MN.NOP22, M6502_AM.IMPLIED, 'NOP22', M6502_VARIANTS.CMOS),
    0x03: new M6502_opcode_info(0x03, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x04: new M6502_opcode_info(0x04, M6502_MN.TSB, M6502_AM.ZPm, 'TSB d', M6502_VARIANTS.CMOS),
    0x07: new M6502_opcode_info(0x07, M6502_MN.RMB0, M6502_AM.ZPm, 'RMB0', M6502_VARIANTS.CMOS),
    0x0B: new M6502_opcode_info(0x0B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x0C: new M6502_opcode_info(0x0C, M6502_MN.TSB, M6502_AM.ABSm, 'TSB abs', M6502_VARIANTS.CMOS),
    0x0F: new M6502_opcode_info(0x0F, M6502_MN.BBR0, M6502_AM.PC_REL_ZP, 'BBR0', M6502_VARIANTS.CMOS),
    0x12: new M6502_opcode_info(0x12, M6502_MN.ORA, M6502_AM.ZP_INDr, 'ORA (d)', M6502_VARIANTS.CMOS),
    0x13: new M6502_opcode_info(0x13, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x14: new M6502_opcode_info(0x14, M6502_MN.TRB, M6502_AM.ZPm, 'TRB d', M6502_VARIANTS.CMOS),
    0x17: new M6502_opcode_info(0x17, M6502_MN.RMB1, M6502_AM.ZPm, 'RMB1', M6502_VARIANTS.CMOS),
    0x1A: new M6502_opcode_info(0x1A, M6502_MN.INC, M6502_AM.ACCUM, 'INC A', M6502_VARIANTS.CMOS),
    0x1B: new M6502_opcode_info(0x1B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x1C: new M6502_opcode_info(0x1C, M6502_MN.TRB, M6502_AM.ABSm, 'TRB abs', M6502_VARIANTS.CMOS),
    0x1F: new M6502_opcode_info(0x1F, M6502_MN.BBR1, M6502_AM.PC_REL_ZP, 'BBR1', M6502_VARIANTS.CMOS),
    0x22: new M6502_opcode_info(0x22, M6502_MN.NOP22, M6502_AM.IMPLIED, 'NOP22', M6502_VARIANTS.CMOS),
    0x23: new M6502_opcode_info(0x23, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x27: new M6502_opcode_info(0x27, M6502_MN.RMB2, M6502_AM.ZPm, 'RMB2', M6502_VARIANTS.CMOS),
    0x2B: new M6502_opcode_info(0x2B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x2F: new M6502_opcode_info(0x2F, M6502_MN.BBR2, M6502_AM.PC_REL_ZP, 'BBR2', M6502_VARIANTS.CMOS),
    0x32: new M6502_opcode_info(0x32, M6502_MN.AND, M6502_AM.ZP_INDr, 'AND (d)', M6502_VARIANTS.CMOS),
    0x33: new M6502_opcode_info(0x33, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x34: new M6502_opcode_info(0x34, M6502_MN.BIT, M6502_AM.ZP_Xr, 'BIT d,x', M6502_VARIANTS.CMOS),
    0x37: new M6502_opcode_info(0x37, M6502_MN.RMB3, M6502_AM.ZPm, 'RMB3', M6502_VARIANTS.CMOS),
    0x3A: new M6502_opcode_info(0x3A, M6502_MN.DEC, M6502_AM.ACCUM, 'DEC A', M6502_VARIANTS.CMOS),
    0x3B: new M6502_opcode_info(0x3B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x3C: new M6502_opcode_info(0x3C, M6502_MN.BIT, M6502_AM.ABS_Xr, 'BIT abs,x', M6502_VARIANTS.CMOS),
    0x3F: new M6502_opcode_info(0x3F, M6502_MN.BBR3, M6502_AM.PC_REL_ZP, 'BBR3', M6502_VARIANTS.CMOS),
    0x42: new M6502_opcode_info(0x42, M6502_MN.NOP22, M6502_AM.IMPLIED, 'NOP22', M6502_VARIANTS.CMOS),
    0x43: new M6502_opcode_info(0x43, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x44: new M6502_opcode_info(0x44, M6502_MN.NOPL, M6502_AM.ZPr, 'NOP zp', M6502_VARIANTS.CMOS),
    0x47: new M6502_opcode_info(0x47, M6502_MN.RMB4, M6502_AM.ZPm, 'RMB4', M6502_VARIANTS.CMOS),
    0x4B: new M6502_opcode_info(0x4B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x4F: new M6502_opcode_info(0x4F, M6502_MN.BBR4, M6502_AM.PC_REL_ZP, 'BBR4', M6502_VARIANTS.CMOS),
    0x52: new M6502_opcode_info(0x52, M6502_MN.EOR, M6502_AM.ZP_INDr, 'EOR (d)', M6502_VARIANTS.CMOS),
    0x53: new M6502_opcode_info(0x53, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x54: new M6502_opcode_info(0x54, M6502_MN.NOP24, M6502_AM.ZP_Xr, 'NOP24', M6502_VARIANTS.CMOS),
    0x57: new M6502_opcode_info(0x57, M6502_MN.RMB5, M6502_AM.ZPm, 'RMB5', M6502_VARIANTS.CMOS),
    0x5A: new M6502_opcode_info(0x5A, M6502_MN.PHY, M6502_AM.IMPLIED, 'PHY', M6502_VARIANTS.CMOS),
    0x5B: new M6502_opcode_info(0x5B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x5C: new M6502_opcode_info(0x5C, M6502_MN.NOP38, M6502_AM.IMPLIED, 'NOP38', M6502_VARIANTS.CMOS),
    0x5F: new M6502_opcode_info(0x5F, M6502_MN.BBR5, M6502_AM.PC_REL_ZP, 'BBR5', M6502_VARIANTS.CMOS),
    0x62: new M6502_opcode_info(0x62, M6502_MN.NOP22, M6502_AM.IMPLIED, 'NOP22', M6502_VARIANTS.CMOS),
    0x63: new M6502_opcode_info(0x63, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x64: new M6502_opcode_info(0x64, M6502_MN.STZ, M6502_AM.ZPw, 'STZ d', M6502_VARIANTS.CMOS),
    0x67: new M6502_opcode_info(0x67, M6502_MN.RMB6, M6502_AM.ZPm, 'RMB6', M6502_VARIANTS.CMOS),
    0x6B: new M6502_opcode_info(0x6B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x6F: new M6502_opcode_info(0x6F, M6502_MN.BBR6, M6502_AM.PC_REL_ZP, 'BBR6', M6502_VARIANTS.CMOS),
    0x72: new M6502_opcode_info(0x72, M6502_MN.ADC, M6502_AM.ZP_INDr, 'ADC (d)', M6502_VARIANTS.CMOS),
    0x73: new M6502_opcode_info(0x73, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x74: new M6502_opcode_info(0x74, M6502_MN.STZ, M6502_AM.ZP_Xw, 'STZ d,x', M6502_VARIANTS.CMOS),
    0x77: new M6502_opcode_info(0x77, M6502_MN.RMB7, M6502_AM.ZPm, 'RMB7', M6502_VARIANTS.CMOS),
    0x7A: new M6502_opcode_info(0x7A, M6502_MN.PLY, M6502_AM.IMPLIED, 'PLY', M6502_VARIANTS.CMOS),
    0x7B: new M6502_opcode_info(0x7B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x7C: new M6502_opcode_info(0x7C, M6502_MN.JMP, M6502_AM.ABS_IND_Xr, 'JMP (a,x)', M6502_VARIANTS.CMOS),
    0x7F: new M6502_opcode_info(0x7F, M6502_MN.BBR7, M6502_AM.PC_REL_ZP, 'BBR7', M6502_VARIANTS.CMOS),
    0x80: new M6502_opcode_info(0x80, M6502_MN.BRA, M6502_AM.PC_REL, 'BRA', M6502_VARIANTS.CMOS),
    0x82: new M6502_opcode_info(0x82, M6502_MN.NOP22, M6502_AM.IMPLIED, 'NOP22', M6502_VARIANTS.CMOS),
    0x83: new M6502_opcode_info(0x83, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x87: new M6502_opcode_info(0x87, M6502_MN.SMB0, M6502_AM.ZPm, 'SMB0', M6502_VARIANTS.CMOS),
    0x89: new M6502_opcode_info(0x89, M6502_MN.BITZ, M6502_AM.IMM, 'BIT #', M6502_VARIANTS.CMOS),
    0x8B: new M6502_opcode_info(0x8B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x8F: new M6502_opcode_info(0x8F, M6502_MN.BBS0, M6502_AM.PC_REL_ZP, 'BBS0', M6502_VARIANTS.CMOS),
    0x92: new M6502_opcode_info(0x92, M6502_MN.STA, M6502_AM.ZP_INDw, 'STA (d)', M6502_VARIANTS.CMOS),
    0x93: new M6502_opcode_info(0x93, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x97: new M6502_opcode_info(0x97, M6502_MN.SMB1, M6502_AM.ZPm, 'SMB1', M6502_VARIANTS.CMOS),
    0x9B: new M6502_opcode_info(0x9B, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0x9C: new M6502_opcode_info(0x9C, M6502_MN.STZ, M6502_AM.ABSw, 'STZ abs', M6502_VARIANTS.CMOS),
    0x9E: new M6502_opcode_info(0x9E, M6502_MN.STZ, M6502_AM.ABS_Xw, 'STZ abs,x', M6502_VARIANTS.CMOS),
    0x9F: new M6502_opcode_info(0x9F, M6502_MN.BBS1, M6502_AM.PC_REL_ZP, 'BBS1', M6502_VARIANTS.CMOS),
    0xA3: new M6502_opcode_info(0xA3, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xA7: new M6502_opcode_info(0xA7, M6502_MN.SMB2, M6502_AM.ZPm, 'SMB2', M6502_VARIANTS.CMOS),
    0xAB: new M6502_opcode_info(0xAB, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xAF: new M6502_opcode_info(0xAF, M6502_MN.BBS2, M6502_AM.PC_REL_ZP, 'BBS2', M6502_VARIANTS.CMOS),
    0xB2: new M6502_opcode_info(0xB2, M6502_MN.LDA, M6502_AM.ZP_INDr, 'LDA (d)', M6502_VARIANTS.CMOS),
    0xB3: new M6502_opcode_info(0xB3, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xB7: new M6502_opcode_info(0xB7, M6502_MN.SMB3, M6502_AM.ZPm, 'SMB3', M6502_VARIANTS.CMOS),
    0xBB: new M6502_opcode_info(0xBB, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xBF: new M6502_opcode_info(0xBF, M6502_MN.BBS3, M6502_AM.PC_REL_ZP, 'BBS3', M6502_VARIANTS.CMOS),
    0xC2: new M6502_opcode_info(0xC2, M6502_MN.NOP22, M6502_AM.IMPLIED, 'NOP22', M6502_VARIANTS.CMOS),
    0xC3: new M6502_opcode_info(0xC3, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xC7: new M6502_opcode_info(0xC7, M6502_MN.SMB4, M6502_AM.ZPm, 'SMB4', M6502_VARIANTS.CMOS),
    0xCB: new M6502_opcode_info(0xCB, M6502_MN.WAI, M6502_AM.IMPLIED, 'WAI', M6502_VARIANTS.CMOS),
    0xCF: new M6502_opcode_info(0xCF, M6502_MN.BBS4, M6502_AM.PC_REL_ZP, 'BBS4', M6502_VARIANTS.CMOS),
    0xD2: new M6502_opcode_info(0xD2, M6502_MN.CMP, M6502_AM.ZP_INDr, 'CMP (d)', M6502_VARIANTS.CMOS),
    0xD3: new M6502_opcode_info(0xD3, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xD4: new M6502_opcode_info(0xD4, M6502_MN.NOP24, M6502_AM.ZP_Xr, 'NOP24', M6502_VARIANTS.CMOS),
    0xD7: new M6502_opcode_info(0xD7, M6502_MN.SMB5, M6502_AM.ZPm, 'SMB5', M6502_VARIANTS.CMOS),
    0xDA: new M6502_opcode_info(0xDA, M6502_MN.PHX, M6502_AM.IMPLIED, 'PHX', M6502_VARIANTS.CMOS),
    0xDB: new M6502_opcode_info(0xDB, M6502_MN.STP, M6502_AM.IMPLIED, 'STP', M6502_VARIANTS.CMOS),
    0xDC: new M6502_opcode_info(0xDC, M6502_MN.NOP34, M6502_AM.IMPLIED, 'NOP34', M6502_VARIANTS.CMOS),
    0xDF: new M6502_opcode_info(0xDF, M6502_MN.BBS5, M6502_AM.PC_REL_ZP, 'BBS5', M6502_VARIANTS.CMOS),
    0xE2: new M6502_opcode_info(0xE2, M6502_MN.NOP22, M6502_AM.IMPLIED, 'NOP22', M6502_VARIANTS.CMOS),
    0xE3: new M6502_opcode_info(0xE3, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xE7: new M6502_opcode_info(0xE7, M6502_MN.SMB6, M6502_AM.ZPm, 'SMB6', M6502_VARIANTS.CMOS),
    0xEB: new M6502_opcode_info(0xEB, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xEF: new M6502_opcode_info(0xEF, M6502_MN.BBS6, M6502_AM.PC_REL_ZP, 'BBS6', M6502_VARIANTS.CMOS),
    0xF2: new M6502_opcode_info(0xF2, M6502_MN.SBC, M6502_AM.ZP_INDr, 'SBC (d)', M6502_VARIANTS.CMOS),
    0xF3: new M6502_opcode_info(0xF3, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xF4: new M6502_opcode_info(0xF4, M6502_MN.NOP24, M6502_AM.ZP_Xr, 'NOP24', M6502_VARIANTS.CMOS),
    0xF7: new M6502_opcode_info(0xF7, M6502_MN.SMB7, M6502_AM.ZPm, 'SMB7', M6502_VARIANTS.CMOS),
    0xFA: new M6502_opcode_info(0xFA, M6502_MN.PLX, M6502_AM.IMPLIED, 'PLX', M6502_VARIANTS.CMOS),
    0xFB: new M6502_opcode_info(0xFB, M6502_MN.NOP11, M6502_AM.IMPLIED, 'NOP11', M6502_VARIANTS.CMOS),
    0xFC: new M6502_opcode_info(0xFC, M6502_MN.NOP34, M6502_AM.IMPLIED, 'NOP34', M6502_VARIANTS.CMOS),
    0xFF: new M6502_opcode_info(0xFF, M6502_MN.BBS7, M6502_AM.PC_REL_ZP, 'BBS7', M6502_VARIANTS.CMOS),
});

class M6502_opcode_functions {
    constructor(opcode_info, exec_func) {
        this.opcode = opcode_info.opcode;
        this.ins = opcode_info.ins;
        this.addr_mode = opcode_info.addr_mode;
        this.mnemonic = opcode_info.mnemonic;
        this.exec_func = exec_func;
    }
}

function M6502_C_func_name(mo) {
    return 'M6502_ins_' + hex2(mo.opcode) + '_' + M6502_MN_R[mo.ins];
}

function M6502_C_func_signature(mo) {
    return 'void ' + M6502_C_func_name(mo) + '(struct M6502_regs *regs, struct M6502_pins *pins)';
}

function M6502_C_func_dec(mo) {
    return M6502_C_func_signature(mo) + '; // ' + mo.mnemonic + '\n';
}

