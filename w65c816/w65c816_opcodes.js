"use strict";

// 0x100-0x103 are "internal opcodes"
let WDC_MAX_OPCODE = 0x103;

// WDC65c816 opcode mnemonics
const WDC_OM = Object.freeze({
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
    BRA: 10,
    BRK: 11,
    BRL: 12,
    BVC: 13,
    BVS: 14,
    CLC: 15,
    CLD: 16,
    CLI: 17,
    CLV: 18,
    CMP: 19,
    COP: 20,
    CPX: 21,
    CPY: 22,
    DEC: 23,
    DEX: 24,
    DEY: 25,
    EOR: 26,
    INC: 27,
    INX: 28,
    INY: 29,
    JML: 30,
    JMP: 31,
    JSL: 32,
    JSR: 33,
    LDA: 34,
    LDX: 35,
    LDY: 36,
    LSR: 37,
    MVN: 38,
    MVP: 39,
    NOP: 40,
    ORA: 41,
    PEA: 42,
    PEI: 43,
    PER: 44,
    PHA: 45,
    PHB: 46,
    PHD: 47,
    PHK: 48,
    PHP: 49,
    PHX: 50,
    PHY: 51,
    PLA: 52,
    PLB: 53,
    PLD: 54,
    PLP: 55,
    PLX: 56,
    PLY: 57,
    REP: 58,
    ROL: 59,
    ROR: 60,
    RTI: 61,
    RTL: 62,
    RTS: 63,
    SBC: 64,
    SEP: 65,
    SEC: 66,
    SED: 67,
    SEI: 68,
    STA: 69,
    STP: 70,
    STX: 71,
    STY: 72,
    STZ: 73,
    TAX: 74,
    TAY: 75,
    TCD: 76,
    TCS: 77,
    TDC: 78,
    TRB: 79,
    TSB: 80,
    TSC: 81,
    TSX: 82,
    TXA: 83,
    TXS: 84,
    TXY: 85,
    TYA: 86,
    TYX: 87,
    WAI: 88,
    WDM: 89,
    XBA: 90,
    XCE: 91,
    // These aren't 658c16 instructions but they need to be here
    S_RESET: 92,
    S_NMI: 93,
    S_IRQ: 94,
    S_ABORT: 95,
    DCB: 96, // Assembler mnemonic
    ASC: 97,
});

const MAX_INS = 95;

// String form of the opcodes
const WDC_OP_MN_str = Object.freeze({
    [WDC_OM.ADC]: 'ADC',
    [WDC_OM.AND]: 'AND',
    [WDC_OM.ASL]: 'ASL',
    [WDC_OM.BCC]: 'BCC',
    [WDC_OM.BCS]: 'BCS',
    [WDC_OM.BEQ]: 'BEQ',
    [WDC_OM.BIT]: 'BIT',
    [WDC_OM.BMI]: 'BMI',
    [WDC_OM.BNE]: 'BNE',
    [WDC_OM.BPL]: 'BPL',
    [WDC_OM.BRA]: 'BRA',
    [WDC_OM.BRK]: 'BRK',
    [WDC_OM.BRL]: 'BRL',
    [WDC_OM.BVC]: 'BVC',
    [WDC_OM.BVS]: 'BVS',
    [WDC_OM.CLC]: 'CLC',
    [WDC_OM.CLD]: 'CLD',
    [WDC_OM.CLI]: 'CLI',
    [WDC_OM.CLV]: 'CLV',
    [WDC_OM.CMP]: 'CMP',
    [WDC_OM.COP]: 'COP',
    [WDC_OM.CPX]: 'CPX',
    [WDC_OM.CPY]: 'CPY',
    [WDC_OM.DEC]: 'DEC',
    [WDC_OM.DEX]: 'DEX',
    [WDC_OM.DEY]: 'DEY',
    [WDC_OM.EOR]: 'EOR',
    [WDC_OM.INC]: 'INC',
    [WDC_OM.INX]: 'INX',
    [WDC_OM.INY]: 'INY',
    [WDC_OM.JML]: 'JML',
    [WDC_OM.JMP]: 'JMP',
    [WDC_OM.JSL]: 'JSL',
    [WDC_OM.JSR]: 'JSR',
    [WDC_OM.LDA]: 'LDA',
    [WDC_OM.LDX]: 'LDX',
    [WDC_OM.LDY]: 'LDY',
    [WDC_OM.LSR]: 'LSR',
    [WDC_OM.MVN]: 'MVN',
    [WDC_OM.MVP]: 'MVP',
    [WDC_OM.NOP]: 'NOP',
    [WDC_OM.ORA]: 'ORA',
    [WDC_OM.PEA]: 'PEA',
    [WDC_OM.PEI]: 'PEI',
    [WDC_OM.PER]: 'PER',
    [WDC_OM.PHA]: 'PHA',
    [WDC_OM.PHB]: 'PHB',
    [WDC_OM.PHD]: 'PHD',
    [WDC_OM.PHK]: 'PHK',
    [WDC_OM.PHP]: 'PHP',
    [WDC_OM.PHX]: 'PHX',
    [WDC_OM.PHY]: 'PHY',
    [WDC_OM.PLA]: 'PLA',
    [WDC_OM.PLB]: 'PLB',
    [WDC_OM.PLD]: 'PLD',
    [WDC_OM.PLP]: 'PLP',
    [WDC_OM.PLX]: 'PLX',
    [WDC_OM.PLY]: 'PLY',
    [WDC_OM.REP]: 'REP',
    [WDC_OM.ROL]: 'ROL',
    [WDC_OM.ROR]: 'ROR',
    [WDC_OM.RTI]: 'RTI',
    [WDC_OM.RTL]: 'RTL',
    [WDC_OM.RTS]: 'RTS',
    [WDC_OM.SBC]: 'SBC',
    [WDC_OM.SEP]: 'SEP',
    [WDC_OM.SEC]: 'SEC',
    [WDC_OM.SED]: 'SED',
    [WDC_OM.SEI]: 'SEI',
    [WDC_OM.STA]: 'STA',
    [WDC_OM.STP]: 'STP',
    [WDC_OM.STX]: 'STX',
    [WDC_OM.STY]: 'STY',
    [WDC_OM.STZ]: 'STZ',
    [WDC_OM.TAX]: 'TAX',
    [WDC_OM.TAY]: 'TAY',
    [WDC_OM.TCD]: 'TCD',
    [WDC_OM.TCS]: 'TCS',
    [WDC_OM.TDC]: 'TDC',
    [WDC_OM.TRB]: 'TRB',
    [WDC_OM.TSB]: 'TSB',
    [WDC_OM.TSC]: 'TSC',
    [WDC_OM.TSX]: 'TSX',
    [WDC_OM.TXA]: 'TXA',
    [WDC_OM.TXS]: 'TXS',
    [WDC_OM.TXY]: 'TXY',
    [WDC_OM.TYA]: 'TYA',
    [WDC_OM.TYX]: 'TYX',
    [WDC_OM.WAI]: 'WAI',
    [WDC_OM.WDM]: 'WDM',
    [WDC_OM.XBA]: 'XBA',
    [WDC_OM.XCE]: 'XCE',
    [WDC_OM.S_RESET]: 'S_RESET',
    [WDC_OM.S_NMI]: 'S_NMI',
    [WDC_OM.S_IRQ]: 'S_IRQ',
    [WDC_OM.S_ABORT]: 'S_ABORT',
    [WDC_OM.DCB]: 'DCB', // Assembler directive
    [WDC_OM.ASC]: 'ASC' // Assembler directive
});

// 65c816 address modes
const WDC_AM = Object.freeze({
		A: 0,                     // a        absolute
        Ab: 101,                  // a        absolute, JMP  0x4C
        Ac: 102,                  // a        absolute, JSR
        Ad: 103,                  // a        RMW (ASL, DEC, INC, LSR, ROL, ROR, TRB, TSB)
        ACCUM: 1,                 // A        accumulator
        A_INDEXED_X: 2,           // a,x      absolute indexed X
        A_INDEXED_Xb: 201,        // a,x      RMW (ASL, DEC, INC, LSR, ROL, ROR)
        A_INDEXED_Y: 3,           // a,y      absolute indexed Y
        AL: 4,                    // al       absolute long
        ALb: 400,                 // al       absolute long JMP
        ALc: 401,                 // al       absoltue long JSL
        AL_INDEXED_X: 5,          // al,x     absolute long indexed
        A_IND: 6,                 // (a)      absolute indirect, JML
        A_INDb: 600,              // (a)      absolute indirect, JMP
        A_INDEXED_IND: 7,         // (a,x)    absolute indexed indirect, JMP
        A_INDEXED_INDb: 701,      // (a,x)    absolute indexed indirect, JSR
        D: 8,                     // d        direct
        Db: 801,                  // d        Direct RMW (ASL, DEC, INC, LSR, ROL, ROR, TRB, TSB)s
        STACK_R: 9,               // r        stack-relative
        D_INDEXED_X: 10,          // d,x      direct indexed X
        D_INDEXED_Xb: 1001,       // d,x      direct indexed X RMW (ASL, DEC, INC, LSR, ROL, ROR)
        D_INDEXED_Y: 11,          // d,y      direct indexed Y
        D_IND: 12,                // (d)      direct indirect
        D_IND_L: 13,              // [d]      direct indirect long
        STACK_R_IND_INDEXED: 14,  // (d,s),y  stack-relative indirect indexed
        D_INDEXED_IND: 15,        // (d,x)    direct indexed indirect
        D_IND_INDEXED: 16,        // (d),y    direct indirect indexed
        D_IND_L_INDEXED: 17,      // [d],y    direct indirect long indexed
        I: 18,                    // i        implied
        Ib: 1801,                 // i        implied XBA
        Ic: 1802,                 // i        implied STP
        Id: 1803,                 // i        implied WAI
        Ie: 1804,                 // i        implied SEI, CLI
        PC_R: 19,                 // r        PC Relative
        PC_RL: 20,                // rl       PC Relative long
        STACK: 21,                // s        Stack ABORT, IRQ, NMI, RES
        STACKb: 2101,             // s        Stack PLA, PLB, PLD, PLP, PLX, PLY
        STACKc: 2102,             // s        Stack PHA, PHB, PHP, PHD, PHK, PHX, PHY
        STACKd: 2103,             // s        Stack PEA
        STACKe: 2104,             // s        Stack PEI
        STACKf: 2105,             // s        Stack PER
        STACKg: 2106,             // s        Stack RTI
        STACKh: 2107,             // s        Stack RTS
        STACKi: 2108,             // s        Stack RTL
        STACKj: 2109,             // s        Stack BRK, COP
        XYC: 22,                  // xyc      block move negative
        XYCb: 2201,               // xyc      block move positive
        IMM: 23,                  // #        immediate
        IMMb: 24,                 // #        immediate for REP, SEP timing
        DCB: 26,                  // DCB      for assembly
        ASC: 27,                  // ASC      for assembly
});

// Regexes to help narrow down possible operand types
const WDC_AM_operand_regexes = Object.freeze({
    [WDC_AM.A]: /^[!|]?\$?[0-9a-zA-Z_]+$/,
    [WDC_AM.Ab]: /^[!|]?\$?[0-9a-zA-Z_]+$/,
    [WDC_AM.Ac]: /^[!|]\$?[0-9a-zA-Z_]+$/,
    [WDC_AM.Ad]: /^[!|]\$?[0-9a-zA-Z_]+$/,
    [WDC_AM.ACCUM]: /^A$/,
     [WDC_AM.A_INDEXED_X]:  /^[!|]\$?[0-9a-zA-Z_]+, ?x$/,
     [WDC_AM.A_INDEXED_Xb]: /^[!|]\$?[0-9a-zA-Z_]+, ?x$/,
     [WDC_AM.A_INDEXED_Y]:  /^[!|]\$?[0-9a-zA-Z_]+, ?y$/,
     [WDC_AM.AL]:  /^>?\$?[0-9a-zA-Z_]+$/,
     [WDC_AM.ALb]: /^>?\$?[0-9a-zA-Z_]+$/,
     [WDC_AM.ALc]: /^>?\$?[0-9a-zA-Z_]+$/,
     [WDC_AM.AL_INDEXED_X]: /^>?\$?[0-9a-zA-Z_]+, ?x$/,
     [WDC_AM.A_IND]:  /^\([!|]?\$?[0-9a-zA-Z_]+\)$/,
     [WDC_AM.A_INDb]: /^\([!|]?\$?[0-9a-zA-Z_]+\)$/,
     [WDC_AM.A_INDEXED_IND]:  /^\([!|]?\$?[0-9a-zA-Z_]+, ?x\)$/,
     [WDC_AM.A_INDEXED_INDb]: /^\([!|]?\$?[0-9a-zA-Z_]+, ?x\)$/,
     [WDC_AM.D]:  /^<?\$?[0-9a-zA-Z_]+$/,
     [WDC_AM.Db]: /^<?\$?[0-9a-zA-Z_]+$/,
     [WDC_AM.STACK_R]: /^\$?[0-9a-zA-Z_]+, ?s$/,
     [WDC_AM.D_INDEXED_X]:  /^<?\$?[a-zA-Z0-9_]+, ?x$/,
     [WDC_AM.D_INDEXED_Xb]: /^<?\$?[a-zA-Z0-9_]+, ?x$/,
     [WDC_AM.D_INDEXED_Y]:  /^<?\$?[a-zA-Z0-9_]+, ?y$/,
     [WDC_AM.D_IND]:   /^\(<?\$?[a-zA-Z0-9_]+\)$/,
     [WDC_AM.D_IND_L]: /^\[<?\$?[a-zA-Z0-9_]+]$/,
     [WDC_AM.STACK_R_IND_INDEXED]: /^\(>?\$?[0-9a-zA-Z_]+, ?s\), ?y$/,
     [WDC_AM.D_INDEXED_IND]: /^\(<?\$?[0-9a-zA-Z_]+, ?x\)$/,
     [WDC_AM.D_IND_INDEXED]: /^\(<?\$?[0-9a-zA-Z_]+\), ?y$/,
     [WDC_AM.D_IND_L_INDEXED]: /^\[<?\$?[0-9a-zA-Z_]+], ?y$/,
     [WDC_AM.I]: /^$/,
     [WDC_AM.Ib]: /^$/,
     [WDC_AM.Ic]: /^$/,
     [WDC_AM.Id]: /^$/,
     [WDC_AM.Ie]: /^$/,
     [WDC_AM.IMM]: /^#[<>^]?\$?[0-9a-zA-Z_]+$/,
     [WDC_AM.IMMb]: /^#[<>^]?\$?[0-9a-zA-Z_]+$/,
     [WDC_AM.PC_R]:  /^-?\$?-?[0-9a-zA-Z_]+$/,
     [WDC_AM.PC_RL]: /^-?\$?-?[0-9a-zA-Z_]+$/,
     [WDC_AM.STACK]: /^$/,
     [WDC_AM.STACKb]: /^$/,
     [WDC_AM.STACKc]: /^$/,
     [WDC_AM.STACKd]: /^#>?\$?[0-9a-zA-Z_]+$/, // basically immediate but only one size
     [WDC_AM.STACKe]: /^<?\$?[0-9a-zA-Z_]+$/, // basically d
     [WDC_AM.STACKf]: /^-?\$?-?[0-9a-zA-Z_]+$/, // basically PC_R
     [WDC_AM.STACKg]: /^$/,
     [WDC_AM.STACKh]: /^$/,
     [WDC_AM.STACKi]: /^$/,
     [WDC_AM.STACKj]: /^\$?[0-9a-zA-Z_]+$/, // basically one hex number
     [WDC_AM.XYC]: /^\$?[0-9a-zA-Z_]+, ?\$?[0-9a-zA-Z_]+$/,
     [WDC_AM.XYCb]: /^\$?[0-9a-zA-Z_]+, ?\$?[0-9a-zA-Z_]+$/
});
// where d is 8 bits
// a is 16
// al is 24

// Allowed types of data for differentaddressing modes
const WDC_AM_operand_allowed_types = Object.freeze({
    [WDC_AM.A]: ['a'],
    [WDC_AM.Ab]: ['a'],
    [WDC_AM.Ac]: ['a'],
    [WDC_AM.Ad]: ['a'],
    [WDC_AM.ACCUM]: [],
     [WDC_AM.A_INDEXED_X]:  ['d', 'a'],
     [WDC_AM.A_INDEXED_Xb]: ['d', 'a'],
     [WDC_AM.A_INDEXED_Y]:  ['d', 'a'],
     [WDC_AM.AL]:  ['d', 'a', 'al'],
     [WDC_AM.ALb]: ['d', 'a', 'al'],
     [WDC_AM.ALc]: ['d', 'a', 'al'],
     [WDC_AM.AL_INDEXED_X]: ['d', 'a', 'al'],
     [WDC_AM.A_IND]:  ['d', 'a'],
     [WDC_AM.A_INDb]: ['d', 'a'],
     [WDC_AM.A_INDEXED_IND]:  ['d', 'a'],
     [WDC_AM.A_INDEXED_INDb]: ['d', 'a'],
     [WDC_AM.D]:  ['d'],
     [WDC_AM.Db]: ['d'],
     [WDC_AM.STACK_R]: ['d'],
     [WDC_AM.D_INDEXED_X]:  ['d'],
     [WDC_AM.D_INDEXED_Xb]: ['d'],
     [WDC_AM.D_INDEXED_Y]:  ['d'],
     [WDC_AM.D_IND]:   ['d'],
     [WDC_AM.D_IND_L]: ['d'],
     [WDC_AM.STACK_R_IND_INDEXED]: ['d'],
     [WDC_AM.D_INDEXED_IND]: ['d'],
     [WDC_AM.D_IND_INDEXED]: ['d'],
     [WDC_AM.D_IND_L_INDEXED]: ['d'],
     [WDC_AM.I]: [],
     [WDC_AM.Ib]: [],
     [WDC_AM.Ic]: [],
     [WDC_AM.Id]: [],
     [WDC_AM.Ie]: [],
     [WDC_AM.PC_R]:  ['d'],
     [WDC_AM.PC_RL]: ['d'],
     [WDC_AM.STACK]: [],
     [WDC_AM.STACKb]: [],
     [WDC_AM.STACKc]: [],
     [WDC_AM.STACKd]: ['d', 'a'],
     [WDC_AM.STACKe]: ['d'],
     [WDC_AM.STACKf]: ['d', 'a'],
     [WDC_AM.STACKg]: [],
     [WDC_AM.STACKh]: [],
     [WDC_AM.STACKi]: [],
     [WDC_AM.STACKj]: ['d'],
     [WDC_AM.XYC]: ['d'],
     [WDC_AM.XYCb]: ['d'],
     [WDC_AM.IMM]: ['d', 'a'],
     [WDC_AM.IMMb]: ['d'] // REP/SEP can only have one byte
});


// Hand-made instruction matrix
const WDC_opcode_MN_R = Object.freeze({
   [WDC_OM.ADC]: [0x61, 0x63, 0x65, 0x67, 0x69, 0x6D, 0x6F, 0x71, 0x72, 0x73, 0x75, 0x77, 0x79, 0x7D, 0x7F],
   [WDC_OM.AND]: [0x21, 0x23, 0x25, 0x27, 0x29, 0x2D, 0x2F, 0x31, 0x32, 0x33, 0x35, 0x37, 0x39, 0x3D, 0x3F],
   [WDC_OM.ASL]: [0x06, 0x0A, 0x0E, 0x16, 0x1E],
   [WDC_OM.BCC]: [0x90],
   [WDC_OM.BCS]: [0xB0],
   [WDC_OM.BEQ]: [0xF0],
   [WDC_OM.BIT]: [0x24, 0x2C, 0x34, 0x3C, 0x89],
   [WDC_OM.BMI]: [0x30],
   [WDC_OM.BNE]: [0xD0],
   [WDC_OM.BPL]: [0x10],
   [WDC_OM.BRA]: [0x80],
   [WDC_OM.BRK]: [0x00],
   [WDC_OM.BRL]: [0x82],
   [WDC_OM.BVC]: [0x50],
   [WDC_OM.BVS]: [0x70],
   [WDC_OM.CLC]: [0x18],
   [WDC_OM.CLD]: [0xD8],
   [WDC_OM.CLI]: [0x58],
   [WDC_OM.CLV]: [0xB8],
   [WDC_OM.CMP]: [0xC1, 0xC3, 0xC5, 0xC7, 0xC9, 0xCD, 0xCF, 0xD1, 0xD2, 0xD3, 0xD5, 0xD7, 0xD9, 0xDD, 0xDF],
   [WDC_OM.COP]: [0x02],
   [WDC_OM.CPX]: [0xE0, 0xE4, 0xEC],
   [WDC_OM.CPY]: [0xC0, 0xC4, 0xCC],
   [WDC_OM.DEC]: [0x3A, 0xC6, 0xCE, 0xD6, 0xDE],
   [WDC_OM.DEX]: [0xCA],
   [WDC_OM.DEY]: [0x88],
   [WDC_OM.EOR]: [0x41, 0x43, 0x45, 0x47, 0x49, 0x4D, 0x4F, 0x51, 0x52, 0x53, 0x55, 0x57, 0x59, 0x5D, 0x5F],
   [WDC_OM.INC]: [0x1A, 0xE6, 0xEE, 0xF6, 0xFE],
   [WDC_OM.INX]: [0xE8],
   [WDC_OM.INY]: [0xC8],
   [WDC_OM.JML]: [0xDC],
   [WDC_OM.JMP]: [0x4C, 0x5C, 0x6C, 0x7C],
   [WDC_OM.JSL]: [0x22],
   [WDC_OM.JSR]: [0x20, 0xFC],
   [WDC_OM.LDA]: [0xA1, 0xA3, 0xA5, 0xA7, 0xA9, 0xAD, 0xAF, 0xB1, 0xB2, 0xB3, 0xB5, 0xB7, 0xB9, 0xBD, 0xBF],
   [WDC_OM.LDX]: [0xA2, 0xA6, 0xAE, 0xB6, 0xBE],
   [WDC_OM.LDY]: [0xA0, 0xA4, 0xAC, 0xB4, 0xBC],
   [WDC_OM.LSR]: [0x46, 0x4A, 0x4E, 0x56, 0x5E],
   [WDC_OM.MVN]: [0x54],
   [WDC_OM.MVP]: [0x44],
   [WDC_OM.NOP]: [0xEA],
   [WDC_OM.ORA]: [0x01, 0x03, 0x05, 0x07, 0x09, 0x0D, 0x0F, 0x11, 0x12, 0x13, 0x15, 0x17, 0x19, 0x1D, 0x1F],
   [WDC_OM.PEA]: [0xF4],
   [WDC_OM.PEI]: [0xD4],
   [WDC_OM.PER]: [0x62],
   [WDC_OM.PHA]: [0x48],
   [WDC_OM.PHB]: [0x8B],
   [WDC_OM.PHD]: [0x0B],
   [WDC_OM.PHK]: [0x4B],
   [WDC_OM.PHP]: [0x08],
   [WDC_OM.PHX]: [0xDA],
   [WDC_OM.PHY]: [0x5A],
   [WDC_OM.PLA]: [0x68],
   [WDC_OM.PLB]: [0xAB],
   [WDC_OM.PLD]: [0x2B],
   [WDC_OM.PLP]: [0x28],
   [WDC_OM.PLX]: [0xFA],
   [WDC_OM.PLY]: [0x7A],
   [WDC_OM.REP]: [0xC2],
   [WDC_OM.ROL]: [0x26, 0x2A, 0x2E, 0x36, 0x3E],
   [WDC_OM.ROR]: [0x66, 0x6A, 0x6E, 0x76, 0x7E],
   [WDC_OM.RTI]: [0x40],
   [WDC_OM.RTL]: [0x6B],
   [WDC_OM.RTS]: [0x60],
   [WDC_OM.SBC]: [0xE1, 0xE3, 0xE5, 0xE7, 0xE9, 0xED, 0xEF, 0xF1, 0xF2, 0xF3, 0xF5, 0xF7, 0xF9, 0xFD, 0xFF],
   [WDC_OM.SEC]: [0x38],
   [WDC_OM.SED]: [0xF8],
   [WDC_OM.SEI]: [0x78],
   [WDC_OM.SEP]: [0xE2],
   [WDC_OM.STA]: [0x81, 0x83, 0x85, 0x87, 0x8D, 0x8F, 0x91, 0x92, 0x93, 0x95, 0x97, 0x99, 0x9D, 0x9F],
   [WDC_OM.STP]: [0xDB],
   [WDC_OM.STX]: [0x86, 0x8E, 0x96],
   [WDC_OM.STY]: [0x84, 0x8C, 0x94],
   [WDC_OM.STZ]: [0x64, 0x74, 0x9C, 0x9E],
   [WDC_OM.TAX]: [0xAA],
   [WDC_OM.TAY]: [0xA8],
   [WDC_OM.TCD]: [0x5B],
   [WDC_OM.TCS]: [0x1B],
   [WDC_OM.TDC]: [0x7B],
   [WDC_OM.TRB]: [0x14, 0x1C],
   [WDC_OM.TSB]: [0x04, 0x0C],
   [WDC_OM.TSC]: [0x3B],
   [WDC_OM.TSX]: [0xBA],
   [WDC_OM.TXA]: [0x8A],
   [WDC_OM.TXS]: [0x9A],
   [WDC_OM.TXY]: [0x9B],
   [WDC_OM.TYA]: [0x98],
   [WDC_OM.TYX]: [0xBB],
   [WDC_OM.WAI]: [0xCB],
   [WDC_OM.WDM]: [0x42],
   [WDC_OM.XBA]: [0xEB],
   [WDC_OM.XCE]: [0xFB],
   [WDC_OM.S_RESET]: [0x100],
   [WDC_OM.S_ABORT]: [0x101],
   [WDC_OM.S_IRQ]: [0x102],
   [WDC_OM.S_NMI]: [0x103]
});

// This addressing matrix is made by hand. The "non-reverse" one is generated with a function below
const WDC_opcode_AM_R = Object.freeze({
    [WDC_AM.A]: [0x0C, 0x0D, 0x0E, 0x1C, 0x20, 0x2C, 0x2D, 0x2E, 0x4C, 0x4D, 0x4E, 0x6D, 0x6E, 0x8C, 0x8D, 0x8E, 0x9C, 0xAC, 0xAD, 0xAE, 0xCC, 0xCD, 0xCE, 0xEC, 0xED, 0xEE],
    [WDC_AM.ACCUM]: [0x0A, 0x1A, 0x2A, 0x3A, 0x4A, 0x6A],
    [WDC_AM.A_INDEXED_X]: [0x1D, 0x1E, 0x3C, 0x3D, 0x3E, 0x5D, 0x5E, 0x7D, 0x7E, 0x9D, 0x9E, 0xBC, 0xBD, 0xDD, 0xDE, 0xFD, 0xFE],
    [WDC_AM.A_INDEXED_Y]: [0x19, 0x39, 0x59, 0x79, 0x99, 0xB9, 0xBE, 0xD9, 0xF9],
    [WDC_AM.AL]: [0x0F, 0x22, 0x2F, 0x4F, 0x5C, 0x6F, 0x8F, 0xAF, 0xCF, 0xEF],
    [WDC_AM.AL_INDEXED_X]: [0x1F, 0x3F, 0x5F, 0x7F, 0x9F, 0xBF, 0xDF, 0xFF],
    [WDC_AM.A_IND]: [0x6C, 0xDC],
    [WDC_AM.A_INDEXED_IND]: [0x7C, 0xFC],
    [WDC_AM.D]: [0x04, 0x05, 0x06, 0x14, 0x24, 0x25, 0x26, 0x45, 0x46, 0x64, 0x65, 0x66, 0x84, 0x85, 0x86, 0xA4, 0xA5, 0xA6, 0xC4, 0xC5, 0xC6, 0xE4, 0xE5, 0xE6],
    [WDC_AM.STACK_R]: [0x03, 0x23, 0x43, 0x63, 0x83, 0xA3, 0xC3, 0xE3],
    [WDC_AM.D_INDEXED_X]: [0x15, 0x16, 0x34, 0x35, 0x36, 0x55, 0x56, 0x74, 0x75, 0x76, 0x94, 0x95, 0xB4, 0xB5, 0xD5, 0xD6, 0xF5, 0xF6],
    [WDC_AM.D_INDEXED_Y]: [0x96, 0xB6],
    [WDC_AM.D_IND]: [0x12, 0x32, 0x52, 0x72, 0x92, 0xB2, 0xD2, 0xF2],
    [WDC_AM.D_IND_L]: [0x07, 0x27, 0x47, 0x67, 0x87, 0xA7, 0xC7, 0xE7],
    [WDC_AM.STACK_R_IND_INDEXED]: [0x13, 0x33, 0x53, 0x73, 0x93, 0xB3, 0xD3, 0xF3],
    [WDC_AM.D_INDEXED_IND]: [0x01, 0x21, 0x41, 0x61, 0x81, 0xA1, 0xC1, 0xE1],
    [WDC_AM.D_IND_INDEXED]: [0x11, 0x31, 0x51, 0x71, 0x91, 0xB1, 0xD1, 0xF1],
    [WDC_AM.D_IND_L_INDEXED]: [0x17, 0x37, 0x57, 0x77, 0x97, 0xB7, 0xD7, 0xF7],
    [WDC_AM.I]: [0x18, 0x1B, 0x38, 0x3B, 0x42, 0x58, 0x5B, 0x78, 0x7B, 0x88, 0x8A, 0x98, 0x9A, 0x9B, 0xA8, 0xAA, 0xB8, 0xBA, 0xBB, 0xC8, 0xCA, 0xCB, 0xD8, 0xDB, 0xE8, 0xEA, 0xEB, 0xF8, 0xFB],
    [WDC_AM.PC_R]: [0x10, 0x30, 0x50, 0x70, 0x80, 0x90, 0xB0, 0xD0, 0xF0],
    [WDC_AM.PC_RL]: [0x82],
    [WDC_AM.STACK]: [0x00, 0x02, 0x08, 0x0B, 0x28, 0x2B, 0x40, 0x48, 0x4B, 0x5A, 0x60, 0x62, 0x68, 0x6B, 0x7A, 0x8B, 0xAB, 0xD4, 0xDA, 0xF4, 0xFA, 0x100, 0x101, 0x102, 0x103],
    [WDC_AM.XYC]: [0x44, 0x54],
    [WDC_AM.IMM]: [0x09, 0x29, 0x49, 0x69, 0x89, 0xA0, 0xA2, 0xA9, 0xC0, 0xC2, 0xC9, 0xE0, 0xE2, 0xE9]
});

const WDC_opcode_AM_SPLIT_R = Object.freeze({
    [WDC_AM.A]: [0x0D, 0x2C, 0x2D, 0x4D, 0x6D, 0x8C, 0x8D, 0x8E, 0x9C, 0xAC, 0xAD, 0xAE, 0xCC, 0xCD, 0xEC, 0xED],
    [WDC_AM.Ab]: [0x4C],
    [WDC_AM.Ac]: [0x20],
    [WDC_AM.Ad]: [0x0C, 0x0E, 0x1C, 0x2E, 0xCE, 0xEE, 0x4E, 0x6E], // RMW ASL DEC INC LSR ROL ROR TRB TSB
    [WDC_AM.ACCUM]: [0x0A, 0x1A, 0x2A, 0x3A, 0x4A, 0x6A],
    [WDC_AM.A_INDEXED_X]: [0x1D, 0x3C, 0x3D, 0x5D, 0x7D, 0x9D, 0x9E, 0xBC, 0xBD, 0xDD, 0xFD],
    [WDC_AM.A_INDEXED_Xb]: [0x1E, 0x3E, 0x5E, 0x7E, 0xDE, 0xFE], // rmw. ASL, DEC, INC, LSR, ROL, ROR
    [WDC_AM.A_INDEXED_Y]: [0x19, 0x39, 0x59, 0x79, 0x99, 0xB9, 0xBE, 0xD9, 0xF9],
    [WDC_AM.AL]: [0x0F, 0x2F, 0x4F, 0x6F, 0x8F, 0xAF, 0xCF, 0xEF],
    [WDC_AM.ALb]: [0x5C], // JMP al
    [WDC_AM.ALc]: [0x22], // JSL al
    [WDC_AM.AL_INDEXED_X]: [0x1F, 0x3F, 0x5F, 0x7F, 0x9F, 0xBF, 0xDF, 0xFF],
    [WDC_AM.A_IND]: [0xDC],   // JML (a)
    [WDC_AM.A_INDb]: [0x6C],        // JMP (a)
    [WDC_AM.A_INDEXED_IND]: [0x7C], // JMP (a,x)
    [WDC_AM.A_INDEXED_INDb]: [0xFC], // JSR (a,x)
    [WDC_AM.D]: [0x05, 0x24, 0x25, 0x45, 0x64, 0x65, 0x84, 0x85, 0x86, 0xA4, 0xA5, 0xA6, 0xC4, 0xC5, 0xE4, 0xE5],
    [WDC_AM.Db]: [0x04, 0x06, 0x14, 0x26, 0x46, 0x66, 0xC6, 0xE6], // rmw ASL DEC INC LSR ROL ROR TRB TSB
    [WDC_AM.STACK_R]: [0x03, 0x23, 0x43, 0x63, 0x83, 0xA3, 0xC3, 0xE3],
    [WDC_AM.D_INDEXED_X]: [0x15, 0x34, 0x35, 0x55, 0x74, 0x75, 0x94, 0x95, 0xB4, 0xB5, 0xD5, 0xF5],
    [WDC_AM.D_INDEXED_Xb]: [0x16, 0x36, 0x56, 0x76, 0xD6, 0xF6], // rmw. ASL DEC INC LSR ROL ROR
    [WDC_AM.D_INDEXED_Y]: [0x96, 0xB6],
    [WDC_AM.D_IND]: [0x12, 0x32, 0x52, 0x72, 0x92, 0xB2, 0xD2, 0xF2],
    [WDC_AM.D_IND_L]: [0x07, 0x27, 0x47, 0x67, 0x87, 0xA7, 0xC7, 0xE7],
    [WDC_AM.STACK_R_IND_INDEXED]: [0x13, 0x33, 0x53, 0x73, 0x93, 0xB3, 0xD3, 0xF3],
    [WDC_AM.D_INDEXED_IND]: [0x01, 0x21, 0x41, 0x61, 0x81, 0xA1, 0xC1, 0xE1],
    [WDC_AM.D_IND_INDEXED]: [0x11, 0x31, 0x51, 0x71, 0x91, 0xB1, 0xD1, 0xF1],
    [WDC_AM.D_IND_L_INDEXED]: [0x17, 0x37, 0x57, 0x77, 0x97, 0xB7, 0xD7, 0xF7],
    [WDC_AM.I]: [0x18, 0x1B, 0x38, 0x3B, 0x42, 0x5B, 0x7B, 0x88, 0x8A, 0x98, 0x9A, 0x9B, 0xA8, 0xAA, 0xB8, 0xBA, 0xBB, 0xC8, 0xCA, 0xD8, 0xE8, 0xEA, 0xF8, 0xFB],
    [WDC_AM.Ib]: [0xEB], // XBA
    [WDC_AM.Ic]: [0xDB], // STP
    [WDC_AM.Id]: [0xCB], // WAI
    [WDC_AM.Ie]: [0x58, 0x78],
    [WDC_AM.PC_R]: [0x10, 0x30, 0x50, 0x70, 0x80, 0x90, 0xB0, 0xD0, 0xF0],
    [WDC_AM.PC_RL]: [0x82],
    [WDC_AM.STACK]: [0x100, 0x101, 0x102, 0x103], // ABORT, IRQ, NMI, RES... "special" instructions
    [WDC_AM.STACKb]: [0x28, 0x2B, 0x68, 0x7A, 0xAB, 0xFA], // PLA, PLB, PLD, PLP, PLX, PLY
    [WDC_AM.STACKc]: [0x08, 0x0B, 0x48, 0x4B, 0x5A, 0x8B, 0xDA], // PHA, PHB, PHP, PHD, PHK, PHX, PHY
    [WDC_AM.STACKd]: [0xF4], // PEA
    [WDC_AM.STACKe]: [0xD4], // PEI
    [WDC_AM.STACKf]: [0x62], // PER
    [WDC_AM.STACKg]: [0x40], // RTI
    [WDC_AM.STACKh]: [0x60], // RTS
    [WDC_AM.STACKi]: [0x6B], // RTL
    [WDC_AM.STACKj]: [0x00, 0x02], // BRK, COP
    [WDC_AM.XYC]: [0x54], // MVN
    [WDC_AM.XYCb]: [0x44], // MVP
    [WDC_AM.IMM]: [0x09, 0x29, 0x49, 0x69, 0x89, 0xA0, 0xA2, 0xA9, 0xC0, 0xC9, 0xE0, 0xE9],
    [WDC_AM.IMMb]: [0xC2, 0xE2]
});

function array_of_array_contains(array, el) {
    for (let j in array) {
        if (!(typeof(array[j].find(value => value === el)) === 'undefined')) {
            return j;
        }
    }
    return -1;
}

function generate_opcode_R(indent) {
    let ostr = 'const opcode_R = Object.freeze({\n';
    let per_line = 4;
    let on_line = per_line;
    let first = true;
    for (let i = 0; i <= WDC_MAX_OPCODE; i++) {
        let j = array_of_array_contains(WDC_opcode_MN_R, i);
        if (on_line === per_line) {
            on_line = 0;
            if (!first) ostr += ',\n' + indent;
            else ostr += indent;
            first = false;
        }
        else {
            ostr += ', ';
        }
        ostr += '0x' + hex2(i) + ": OM." + WDC_OP_MN_str[j];
        on_line++;
    }
    ostr += '});';
    return ostr;
}


// this isn't needed, it was used
//console.log(generate_opcode_R('    '));
const opcode_R = Object.freeze({
    0x00: WDC_OM.BRK, 0x01: WDC_OM.ORA, 0x02: WDC_OM.COP, 0x03: WDC_OM.ORA,
    0x04: WDC_OM.TSB, 0x05: WDC_OM.ORA, 0x06: WDC_OM.ASL, 0x07: WDC_OM.ORA,
    0x08: WDC_OM.PHP, 0x09: WDC_OM.ORA, 0x0A: WDC_OM.ASL, 0x0B: WDC_OM.PHD,
    0x0C: WDC_OM.TSB, 0x0D: WDC_OM.ORA, 0x0E: WDC_OM.ASL, 0x0F: WDC_OM.ORA,
    0x10: WDC_OM.BPL, 0x11: WDC_OM.ORA, 0x12: WDC_OM.ORA, 0x13: WDC_OM.ORA,
    0x14: WDC_OM.TRB, 0x15: WDC_OM.ORA, 0x16: WDC_OM.ASL, 0x17: WDC_OM.ORA,
    0x18: WDC_OM.CLC, 0x19: WDC_OM.ORA, 0x1A: WDC_OM.INC, 0x1B: WDC_OM.TCS,
    0x1C: WDC_OM.TRB, 0x1D: WDC_OM.ORA, 0x1E: WDC_OM.ASL, 0x1F: WDC_OM.ORA,
    0x20: WDC_OM.JSR, 0x21: WDC_OM.AND, 0x22: WDC_OM.JSL, 0x23: WDC_OM.AND,
    0x24: WDC_OM.BIT, 0x25: WDC_OM.AND, 0x26: WDC_OM.ROL, 0x27: WDC_OM.AND,
    0x28: WDC_OM.PLP, 0x29: WDC_OM.AND, 0x2A: WDC_OM.ROL, 0x2B: WDC_OM.PLD,
    0x2C: WDC_OM.BIT, 0x2D: WDC_OM.AND, 0x2E: WDC_OM.ROL, 0x2F: WDC_OM.AND,
    0x30: WDC_OM.BMI, 0x31: WDC_OM.AND, 0x32: WDC_OM.AND, 0x33: WDC_OM.AND,
    0x34: WDC_OM.BIT, 0x35: WDC_OM.AND, 0x36: WDC_OM.ROL, 0x37: WDC_OM.AND,
    0x38: WDC_OM.SEC, 0x39: WDC_OM.AND, 0x3A: WDC_OM.DEC, 0x3B: WDC_OM.TSC,
    0x3C: WDC_OM.BIT, 0x3D: WDC_OM.AND, 0x3E: WDC_OM.ROL, 0x3F: WDC_OM.AND,
    0x40: WDC_OM.RTI, 0x41: WDC_OM.EOR, 0x42: WDC_OM.WDM, 0x43: WDC_OM.EOR,
    0x44: WDC_OM.MVP, 0x45: WDC_OM.EOR, 0x46: WDC_OM.LSR, 0x47: WDC_OM.EOR,
    0x48: WDC_OM.PHA, 0x49: WDC_OM.EOR, 0x4A: WDC_OM.LSR, 0x4B: WDC_OM.PHK,
    0x4C: WDC_OM.JMP, 0x4D: WDC_OM.EOR, 0x4E: WDC_OM.LSR, 0x4F: WDC_OM.EOR,
    0x50: WDC_OM.BVC, 0x51: WDC_OM.EOR, 0x52: WDC_OM.EOR, 0x53: WDC_OM.EOR,
    0x54: WDC_OM.MVN, 0x55: WDC_OM.EOR, 0x56: WDC_OM.LSR, 0x57: WDC_OM.EOR,
    0x58: WDC_OM.CLI, 0x59: WDC_OM.EOR, 0x5A: WDC_OM.PHY, 0x5B: WDC_OM.TCD,
    0x5C: WDC_OM.JMP, 0x5D: WDC_OM.EOR, 0x5E: WDC_OM.LSR, 0x5F: WDC_OM.EOR,
    0x60: WDC_OM.RTS, 0x61: WDC_OM.ADC, 0x62: WDC_OM.PER, 0x63: WDC_OM.ADC,
    0x64: WDC_OM.STZ, 0x65: WDC_OM.ADC, 0x66: WDC_OM.ROR, 0x67: WDC_OM.ADC,
    0x68: WDC_OM.PLA, 0x69: WDC_OM.ADC, 0x6A: WDC_OM.ROR, 0x6B: WDC_OM.RTL,
    0x6C: WDC_OM.JMP, 0x6D: WDC_OM.ADC, 0x6E: WDC_OM.ROR, 0x6F: WDC_OM.ADC,
    0x70: WDC_OM.BVS, 0x71: WDC_OM.ADC, 0x72: WDC_OM.ADC, 0x73: WDC_OM.ADC,
    0x74: WDC_OM.STZ, 0x75: WDC_OM.ADC, 0x76: WDC_OM.ROR, 0x77: WDC_OM.ADC,
    0x78: WDC_OM.SEI, 0x79: WDC_OM.ADC, 0x7A: WDC_OM.PLY, 0x7B: WDC_OM.TDC,
    0x7C: WDC_OM.JMP, 0x7D: WDC_OM.ADC, 0x7E: WDC_OM.ROR, 0x7F: WDC_OM.ADC,
    0x80: WDC_OM.BRA, 0x81: WDC_OM.STA, 0x82: WDC_OM.BRL, 0x83: WDC_OM.STA,
    0x84: WDC_OM.STY, 0x85: WDC_OM.STA, 0x86: WDC_OM.STX, 0x87: WDC_OM.STA,
    0x88: WDC_OM.DEY, 0x89: WDC_OM.BIT, 0x8A: WDC_OM.TXA, 0x8B: WDC_OM.PHB,
    0x8C: WDC_OM.STY, 0x8D: WDC_OM.STA, 0x8E: WDC_OM.STX, 0x8F: WDC_OM.STA,
    0x90: WDC_OM.BCC, 0x91: WDC_OM.STA, 0x92: WDC_OM.STA, 0x93: WDC_OM.STA,
    0x94: WDC_OM.STY, 0x95: WDC_OM.STA, 0x96: WDC_OM.STX, 0x97: WDC_OM.STA,
    0x98: WDC_OM.TYA, 0x99: WDC_OM.STA, 0x9A: WDC_OM.TXS, 0x9B: WDC_OM.TXY,
    0x9C: WDC_OM.STZ, 0x9D: WDC_OM.STA, 0x9E: WDC_OM.STZ, 0x9F: WDC_OM.STA,
    0xA0: WDC_OM.LDY, 0xA1: WDC_OM.LDA, 0xA2: WDC_OM.LDX, 0xA3: WDC_OM.LDA,
    0xA4: WDC_OM.LDY, 0xA5: WDC_OM.LDA, 0xA6: WDC_OM.LDX, 0xA7: WDC_OM.LDA,
    0xA8: WDC_OM.TAY, 0xA9: WDC_OM.LDA, 0xAA: WDC_OM.TAX, 0xAB: WDC_OM.PLB,
    0xAC: WDC_OM.LDY, 0xAD: WDC_OM.LDA, 0xAE: WDC_OM.LDX, 0xAF: WDC_OM.LDA,
    0xB0: WDC_OM.BCS, 0xB1: WDC_OM.LDA, 0xB2: WDC_OM.LDA, 0xB3: WDC_OM.LDA,
    0xB4: WDC_OM.LDY, 0xB5: WDC_OM.LDA, 0xB6: WDC_OM.LDX, 0xB7: WDC_OM.LDA,
    0xB8: WDC_OM.CLV, 0xB9: WDC_OM.LDA, 0xBA: WDC_OM.TSX, 0xBB: WDC_OM.TYX,
    0xBC: WDC_OM.LDY, 0xBD: WDC_OM.LDA, 0xBE: WDC_OM.LDX, 0xBF: WDC_OM.LDA,
    0xC0: WDC_OM.CPY, 0xC1: WDC_OM.CMP, 0xC2: WDC_OM.REP, 0xC3: WDC_OM.CMP,
    0xC4: WDC_OM.CPY, 0xC5: WDC_OM.CMP, 0xC6: WDC_OM.DEC, 0xC7: WDC_OM.CMP,
    0xC8: WDC_OM.INY, 0xC9: WDC_OM.CMP, 0xCA: WDC_OM.DEX, 0xCB: WDC_OM.WAI,
    0xCC: WDC_OM.CPY, 0xCD: WDC_OM.CMP, 0xCE: WDC_OM.DEC, 0xCF: WDC_OM.CMP,
    0xD0: WDC_OM.BNE, 0xD1: WDC_OM.CMP, 0xD2: WDC_OM.CMP, 0xD3: WDC_OM.CMP,
    0xD4: WDC_OM.PEI, 0xD5: WDC_OM.CMP, 0xD6: WDC_OM.DEC, 0xD7: WDC_OM.CMP,
    0xD8: WDC_OM.CLD, 0xD9: WDC_OM.CMP, 0xDA: WDC_OM.PHX, 0xDB: WDC_OM.STP,
    0xDC: WDC_OM.JML, 0xDD: WDC_OM.CMP, 0xDE: WDC_OM.DEC, 0xDF: WDC_OM.CMP,
    0xE0: WDC_OM.CPX, 0xE1: WDC_OM.SBC, 0xE2: WDC_OM.SEP, 0xE3: WDC_OM.SBC,
    0xE4: WDC_OM.CPX, 0xE5: WDC_OM.SBC, 0xE6: WDC_OM.INC, 0xE7: WDC_OM.SBC,
    0xE8: WDC_OM.INX, 0xE9: WDC_OM.SBC, 0xEA: WDC_OM.NOP, 0xEB: WDC_OM.XBA,
    0xEC: WDC_OM.CPX, 0xED: WDC_OM.SBC, 0xEE: WDC_OM.INC, 0xEF: WDC_OM.SBC,
    0xF0: WDC_OM.BEQ, 0xF1: WDC_OM.SBC, 0xF2: WDC_OM.SBC, 0xF3: WDC_OM.SBC,
    0xF4: WDC_OM.PEA, 0xF5: WDC_OM.SBC, 0xF6: WDC_OM.INC, 0xF7: WDC_OM.SBC,
    0xF8: WDC_OM.SED, 0xF9: WDC_OM.SBC, 0xFA: WDC_OM.PLX, 0xFB: WDC_OM.XCE,
    0xFC: WDC_OM.JSR, 0xFD: WDC_OM.SBC, 0xFE: WDC_OM.INC, 0xFF: WDC_OM.SBC,
    0x100: WDC_OM.S_RESET, 0x101: WDC_OM.S_ABORT, 0x102: WDC_OM.S_IRQ,
    0x103: WDC_OM.S_NMI
});

// List of instructions that use access size depends on X instead of M. If not in here they depend on M.
const WDC_A_OR_M_X = Object.freeze(new Set([WDC_OM.CPX, WDC_OM.CPY, WDC_OM.STX, WDC_OM.STY, WDC_OM.LDX, WDC_OM.LDY]));

// used to figure out if stack will be 8- or 16-bit push for some instructions
const WDC_STACK_X = Object.freeze(new Set([WDC_OM.PLX, WDC_OM.PLY, WDC_OM.PHX, WDC_OM.PHY]));
const WDC_STACK_M = Object.freeze(new Set([WDC_OM.PHA, WDC_OM.PLA]));
const WDC_STACK_8 = Object.freeze(new Set([WDC_OM.PHP, WDC_OM.PHB, WDC_OM.PHK, WDC_OM.PLP, WDC_OM.PLP]));
const WDC_STACK_16 = Object.freeze(new Set([WDC_OM.PLD, WDC_OM.PHD]));

// List of instructions that are Read for R/W types. If not in here, they are Write.
const WDC_A_R_INS = Object.freeze(new Set([WDC_OM.ADC, WDC_OM.AND, WDC_OM.BIT, WDC_OM.CMP, WDC_OM.CPX, WDC_OM.CPY, WDC_OM.EOR, WDC_OM.LDA, WDC_OM.LDX, WDC_OM.LDY, WDC_OM.ORA, WDC_OM.SBC]));
