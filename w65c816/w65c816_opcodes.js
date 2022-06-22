"use strict";

let MAX_OPCODE = 0x103;

class OPCODE_MNEMONICS_t {
    constructor() {
        this.ADC = 0;
        this.AND = 1;
        this.ASL = 2;
        this.BCC = 3;
        this.BCS = 4;
        this.BEQ = 5;
        this.BIT = 6;
        this.BMI = 7;
        this.BNE = 8;
        this.BPL = 9;
        this.BRA = 10;
        this.BRK = 11;
        this.BRL = 12;
        this.BVC = 13;
        this.BVS = 14;
        this.CLC = 15;
        this.CLD = 16;
        this.CLI = 17;
        this.CLV = 18;
        this.CMP = 19;
        this.COP = 20;
        this.CPX = 21;
        this.CPY = 22;
        this.DEC = 23;
        this.DEX = 24;
        this.DEY = 25;
        this.EOR = 26;
        this.INC = 27;
        this.INX = 28;
        this.INY = 29;
        this.JML = 30;
        this.JMP = 31;
        this.JSL = 32;
        this.JSR = 33;
        this.LDA = 34;
        this.LDX = 35;
        this.LDY = 36;
        this.LSR = 37;
        this.MVN = 38;
        this.MVP = 39;
        this.NOP = 40;
        this.ORA = 41;
        this.PEA = 42;
        this.PEI = 43;
        this.PER = 44;
        this.PHA = 45;
        this.PHB = 46;
        this.PHD = 47;
        this.PHK = 48;
        this.PHP = 49;
        this.PHX = 50;
        this.PHY = 51;
        this.PLA = 52;
        this.PLB = 53;
        this.PLD = 54;
        this.PLP = 55;
        this.PLX = 56;
        this.PLY = 57;
        this.REP = 58;
        this.ROL = 59;
        this.ROR = 60;
        this.RTI = 61;
        this.RTL = 62;
        this.RTS = 63;
        this.SBC = 64;
        this.SEP = 65;
        this.SEC = 66;
        this.SED = 67;
        this.SEI = 68;
        this.STA = 69;
        this.STP = 70;
        this.STX = 71;
        this.STY = 72;
        this.STZ = 73;
        this.TAX = 74;
        this.TAY = 75;
        this.TCD = 76;
        this.TCS = 77;
        this.TDC = 78;
        this.TRB = 79;
        this.TSB = 80;
        this.TSC = 81;
        this.TSX = 82;
        this.TXA = 83;
        this.TXS = 84;
        this.TXY = 85;
        this.TYA = 86;
        this.TYX = 87;
        this.WAI = 88;
        this.WDM = 89;
        this.XBA = 90;
        this.XCE = 91;
        // These aren't 658c16 instructions but they need to be here
        this.S_RESET = 92;
        this.S_NMI = 93;
        this.S_IRQ = 94;
        this.S_ABORT = 95;
        this.DCB = 96; // Assembler mnemonic
        this.ASC = 97;
    }
}

const MAX_INS = 95;

const OM = Object.freeze(new OPCODE_MNEMONICS_t());

const opcode_MN = Object.freeze({
    [OM.ADC]: 'ADC',
    [OM.AND]: 'AND',
    [OM.ASL]: 'ASL',
    [OM.BCC]: 'BCC',
    [OM.BCS]: 'BCS',
    [OM.BEQ]: 'BEQ',
    [OM.BIT]: 'BIT',
    [OM.BMI]: 'BMI',
    [OM.BNE]: 'BNE',
    [OM.BPL]: 'BPL',
    [OM.BRA]: 'BRA',
    [OM.BRK]: 'BRK',
    [OM.BRL]: 'BRL',
    [OM.BVC]: 'BVC',
    [OM.BVS]: 'BVS',
    [OM.CLC]: 'CLC',
    [OM.CLD]: 'CLD',
    [OM.CLI]: 'CLI',
    [OM.CLV]: 'CLV',
    [OM.CMP]: 'CMP',
    [OM.COP]: 'COP',
    [OM.CPX]: 'CPX',
    [OM.CPY]: 'CPY',
    [OM.DEC]: 'DEC',
    [OM.DEX]: 'DEX',
    [OM.DEY]: 'DEY',
    [OM.EOR]: 'EOR',
    [OM.INC]: 'INC',
    [OM.INX]: 'INX',
    [OM.INY]: 'INY',
    [OM.JML]: 'JML',
    [OM.JMP]: 'JMP',
    [OM.JSL]: 'JSL',
    [OM.JSR]: 'JSR',
    [OM.LDA]: 'LDA',
    [OM.LDX]: 'LDX',
    [OM.LDY]: 'LDY',
    [OM.LSR]: 'LSR',
    [OM.MVN]: 'MVN',
    [OM.MVP]: 'MVP',
    [OM.NOP]: 'NOP',
    [OM.ORA]: 'ORA',
    [OM.PEA]: 'PEA',
    [OM.PEI]: 'PEI',
    [OM.PER]: 'PER',
    [OM.PHA]: 'PHA',
    [OM.PHB]: 'PHB',
    [OM.PHD]: 'PHD',
    [OM.PHK]: 'PHK',
    [OM.PHP]: 'PHP',
    [OM.PHX]: 'PHX',
    [OM.PHY]: 'PHY',
    [OM.PLA]: 'PLA',
    [OM.PLB]: 'PLB',
    [OM.PLD]: 'PLD',
    [OM.PLP]: 'PLP',
    [OM.PLX]: 'PLX',
    [OM.PLY]: 'PLY',
    [OM.REP]: 'REP',
    [OM.ROL]: 'ROL',
    [OM.ROR]: 'ROR',
    [OM.RTI]: 'RTI',
    [OM.RTL]: 'RTL',
    [OM.RTS]: 'RTS',
    [OM.SBC]: 'SBC',
    [OM.SEP]: 'SEP',
    [OM.SEC]: 'SEC',
    [OM.SED]: 'SED',
    [OM.SEI]: 'SEI',
    [OM.STA]: 'STA',
    [OM.STP]: 'STP',
    [OM.STX]: 'STX',
    [OM.STY]: 'STY',
    [OM.STZ]: 'STZ',
    [OM.TAX]: 'TAX',
    [OM.TAY]: 'TAY',
    [OM.TCD]: 'TCD',
    [OM.TCS]: 'TCS',
    [OM.TDC]: 'TDC',
    [OM.TRB]: 'TRB',
    [OM.TSB]: 'TSB',
    [OM.TSC]: 'TSC',
    [OM.TSX]: 'TSX',
    [OM.TXA]: 'TXA',
    [OM.TXS]: 'TXS',
    [OM.TXY]: 'TXY',
    [OM.TYA]: 'TYA',
    [OM.TYX]: 'TYX',
    [OM.WAI]: 'WAI',
    [OM.WDM]: 'WDM',
    [OM.XBA]: 'XBA',
    [OM.XCE]: 'XCE',
    [OM.S_RESET]: 'S_RESET',
    [OM.S_NMI]: 'S_NMI',
    [OM.S_IRQ]: 'S_IRQ',
    [OM.S_ABORT]: 'S_ABORT',
    [OM.DCB]: 'DCB', // Assembler directive
    [OM.ASC]: 'ASC' // Assembler directive
});

class ADDRESS_MODES_t {
	constructor() {
		this.A = 0;                     // a        absolute
        this.Ab = 101;                  // a        absolute, JMP  0x4C
        this.Ac = 102;                  // a        absolute, JSR
        this.Ad = 103;                  // a        RMW (ASL, DEC, INC, LSR, ROL, ROR, TRB, TSB)
        this.ACCUM = 1;                 // A        accumulator
        this.A_INDEXED_X = 2;           // a,x      absolute indexed X
        this.A_INDEXED_Xb = 201;        // a,x      RMW (ASL, DEC, INC, LSR, ROL, ROR)
        this.A_INDEXED_Y = 3;           // a,y      absolute indexed Y
        this.AL = 4;                    // al       absolute long
        this.ALb = 400;                 // al       absolute long JMP
        this.ALc = 401;                 // al       absoltue long JSL
        this.AL_INDEXED_X = 5;          // al,x     absolute long indexed
        this.A_IND = 6;                 // (a)      absolute indirect, JML
        this.A_INDb = 600;              // (a)      absolute indirect, JMP
        this.A_INDEXED_IND = 7;         // (a,x)    absolute indexed indirect, JMP
        this.A_INDEXED_INDb = 701;      // (a,x)    absolute indexed indirect, JSR
        this.D = 8;                     // d        direct
        this.Db = 801;                  // d        Direct RMW (ASL, DEC, INC, LSR, ROL, ROR, TRB, TSB)s
        this.STACK_R = 9;               // r        stack-relative
        this.D_INDEXED_X = 10;          // d,x      direct indexed X
        this.D_INDEXED_Xb = 1001;       // d,x      direct indexed X RMW (ASL, DEC, INC, LSR, ROL, ROR)
        this.D_INDEXED_Y = 11;          // d,y      direct indexed Y
        this.D_IND = 12;                // (d)      direct indirect
        this.D_IND_L = 13;              // [d]      direct indirect long
        this.STACK_R_IND_INDEXED = 14;  // (d,s),y  stack-relative indirect indexed
        this.D_INDEXED_IND = 15;        // (d,x)    direct indexed indirect
        this.D_IND_INDEXED = 16;        // (d),y    direct indirect indexed
        this.D_IND_L_INDEXED = 17;      // [d],y    direct indirect long indexed
        this.I = 18;                    // i        implied
        this.Ib = 1801;                 // i        implied XBA
        this.Ic = 1802;                 // i        implied STP
        this.Id = 1803;                 // i        implied WAI
        this.PC_R = 19;                 // r        PC Relative
        this.PC_RL = 20;                // rl       PC Relative long
        this.STACK = 21;                // s        Stack ABORT, IRQ, NMI, RES
        this.STACKb = 2101;             // s        Stack PLA, PLB, PLD, PLP, PLX, PLY
        this.STACKc = 2102;             // s        Stack PHA, PHB, PHP, PHD, PHK, PHX, PHY
        this.STACKd = 2103;             // s        Stack PEA
        this.STACKe = 2104;             // s        Stack PEI
        this.STACKf = 2105;             // s        Stack PER
        this.STACKg = 2106;             // s        Stack RTI
        this.STACKh = 2107;             // s        Stack RTS
        this.STACKi = 2108;             // s        Stack RTL
        this.STACKj = 2109;             // s        Stack BRK, COP
        this.XYC = 22;                  // xyc      block move negative
        this.XYCb = 2201;               // xyc      block move positive
        this.IMM = 23;                  // #        immediate
        this.DCB = 24;                  // DCB      for assembly
        this.ASC = 25;                  // ASC      for assembly
	}
}
const AM = Object.freeze(new ADDRESS_MODES_t());


const AM_operand_regexes = Object.freeze({
    [AM.A]: /^[!|]?\$?[0-9a-zA-Z_]+$/,
    [AM.Ab]: /^[!|]?\$?[0-9a-zA-Z_]+$/,
    [AM.Ac]: /^[!|]\$?[0-9a-zA-Z_]+$/,
    [AM.Ad]: /^[!|]\$?[0-9a-zA-Z_]+$/,
    [AM.ACCUM]: /^A$/,
     [AM.A_INDEXED_X]:  /^[!|]\$?[0-9a-zA-Z_]+, ?x$/,
     [AM.A_INDEXED_Xb]: /^[!|]\$?[0-9a-zA-Z_]+, ?x$/,
     [AM.A_INDEXED_Y]:  /^[!|]\$?[0-9a-zA-Z_]+, ?y$/,
     [AM.AL]:  /^>?\$?[0-9a-zA-Z_]+$/,
     [AM.ALb]: /^>?\$?[0-9a-zA-Z_]+$/,
     [AM.ALc]: /^>?\$?[0-9a-zA-Z_]+$/,
     [AM.AL_INDEXED_X]: /^>?\$?[0-9a-zA-Z_]+, ?x$/,
     [AM.A_IND]:  /^\([!|]?\$?[0-9a-zA-Z_]+\)$/,
     [AM.A_INDb]: /^\([!|]?\$?[0-9a-zA-Z_]+\)$/,
     [AM.A_INDEXED_IND]:  /^\([!|]?\$?[0-9a-zA-Z_]+, ?x\)$/,
     [AM.A_INDEXED_INDb]: /^\([!|]?\$?[0-9a-zA-Z_]+, ?x\)$/,
     [AM.D]:  /^<?\$?[0-9a-zA-Z_]+$/,
     [AM.Db]: /^<?\$?[0-9a-zA-Z_]+$/,
     [AM.STACK_R]: /^\$?[0-9a-zA-Z_]+, ?s$/,
     [AM.D_INDEXED_X]:  /^<?\$?[a-zA-Z0-9_]+, ?x$/,
     [AM.D_INDEXED_Xb]: /^<?\$?[a-zA-Z0-9_]+, ?x$/,
     [AM.D_INDEXED_Y]:  /^<?\$?[a-zA-Z0-9_]+, ?y$/,
     [AM.D_IND]:   /^\(<?\$?[a-zA-Z0-9_]+\)$/,
     [AM.D_IND_L]: /^\[<?\$?[a-zA-Z0-9_]+]$/,
     [AM.STACK_R_IND_INDEXED]: /^\(>?\$?[0-9a-zA-Z_]+, ?s\), ?y$/,
     [AM.D_INDEXED_IND]: /^\(<?\$?[0-9a-zA-Z_]+, ?x\)$/,
     [AM.D_IND_INDEXED]: /^\(<?\$?[0-9a-zA-Z_]+\), ?y$/,
     [AM.D_IND_L_INDEXED]: /^\[<?\$?[0-9a-zA-Z_]+], ?y$/,
     [AM.I]: /^$/,
     [AM.Ib]: /^$/,
     [AM.Ic]: /^$/,
     [AM.Id]: /^$/,
     [AM.IMM]: /^#[<>^]?\$?[0-9a-zA-Z_]+$/,
     [AM.PC_R]:  /^-?\$?-?[0-9a-zA-Z_]+$/,
     [AM.PC_RL]: /^-?\$?-?[0-9a-zA-Z_]+$/,
     [AM.STACK]: /^$/,
     [AM.STACKb]: /^$/,
     [AM.STACKc]: /^$/,
     [AM.STACKd]: /^#>?\$?[0-9a-zA-Z_]+$/, // basically immediate but only one size
     [AM.STACKe]: /^<?\$?[0-9a-zA-Z_]+$/, // basically d
     [AM.STACKf]: /^-?\$?-?[0-9a-zA-Z_]+$/, // basically PC_R
     [AM.STACKg]: /^$/,
     [AM.STACKh]: /^$/,
     [AM.STACKi]: /^$/,
     [AM.STACKj]: /^\$?[0-9a-zA-Z_]+$/, // basically one hex number
     [AM.XYC]: /^\$?[0-9a-zA-Z_]+, ?\$?[0-9a-zA-Z_]+$/,
     [AM.XYCb]: /^\$?[0-9a-zA-Z_]+, ?\$?[0-9a-zA-Z_]+$/
});
// where d is 8 bits
// a is 16
// al is 24
const AM_operand_allowed_types = Object.freeze({
    [AM.A]: ['a'],
    [AM.Ab]: ['a'],
    [AM.Ac]: ['a'],
    [AM.Ad]: ['a'],
    [AM.ACCUM]: [],
     [AM.A_INDEXED_X]:  ['d', 'a'],
     [AM.A_INDEXED_Xb]: ['d', 'a'],
     [AM.A_INDEXED_Y]:  ['d', 'a'],
     [AM.AL]:  ['d', 'a', 'al'],
     [AM.ALb]: ['d', 'a', 'al'],
     [AM.ALc]: ['d', 'a', 'al'],
     [AM.AL_INDEXED_X]: ['d', 'a', 'al'],
     [AM.A_IND]:  ['d', 'a'],
     [AM.A_INDb]: ['d', 'a'],
     [AM.A_INDEXED_IND]:  ['d', 'a'],
     [AM.A_INDEXED_INDb]: ['d', 'a'],
     [AM.D]:  ['d'],
     [AM.Db]: ['d'],
     [AM.STACK_R]: ['d'],
     [AM.D_INDEXED_X]:  ['d'],
     [AM.D_INDEXED_Xb]: ['d'],
     [AM.D_INDEXED_Y]:  ['d'],
     [AM.D_IND]:   ['d'],
     [AM.D_IND_L]: ['d'],
     [AM.STACK_R_IND_INDEXED]: ['d'],
     [AM.D_INDEXED_IND]: ['d'],
     [AM.D_IND_INDEXED]: ['d'],
     [AM.D_IND_L_INDEXED]: ['d'],
     [AM.I]: [],
     [AM.Ib]: [],
     [AM.Ic]: [],
     [AM.Id]: [],
     [AM.PC_R]:  ['d'],
     [AM.PC_RL]: ['d'],
     [AM.STACK]: [],
     [AM.STACKb]: [],
     [AM.STACKc]: [],
     [AM.STACKd]: ['d', 'a'],
     [AM.STACKe]: ['d'],
     [AM.STACKf]: ['d', 'a'],
     [AM.STACKg]: [],
     [AM.STACKh]: [],
     [AM.STACKi]: [],
     [AM.STACKj]: ['d'],
     [AM.XYC]: ['d'],
     [AM.XYCb]: ['d'],
     [AM.IMM]: ['d', 'a']
});


// Hand-made instruction matrix
const opcode_MN_R = Object.freeze({
   [OM.ADC]: [0x61, 0x63, 0x65, 0x67, 0x69, 0x6D, 0x6F, 0x71, 0x72, 0x73, 0x75, 0x77, 0x79, 0x7D, 0x7F],
   [OM.AND]: [0x21, 0x23, 0x25, 0x27, 0x29, 0x2D, 0x2F, 0x31, 0x32, 0x33, 0x35, 0x37, 0x39, 0x3D, 0x3F],
   [OM.ASL]: [0x06, 0x0A, 0x0E, 0x16, 0x1E],
   [OM.BCC]: [0x90],
   [OM.BCS]: [0xB0],
   [OM.BEQ]: [0xF0],
   [OM.BIT]: [0x24, 0x2C, 0x34, 0x3C, 0x89],
   [OM.BMI]: [0x30],
   [OM.BNE]: [0xD0],
   [OM.BPL]: [0x10],
   [OM.BRA]: [0x80],
   [OM.BRK]: [0x00],
   [OM.BRL]: [0x82],
   [OM.BVC]: [0x50],
   [OM.BVS]: [0x70],
   [OM.CLC]: [0x18],
   [OM.CLD]: [0xD8],
   [OM.CLI]: [0x58],
   [OM.CLV]: [0xB8],
   [OM.CMP]: [0xC1, 0xC3, 0xC5, 0xC7, 0xC9, 0xCD, 0xCF, 0xD1, 0xD2, 0xD3, 0xD5, 0xD7, 0xD9, 0xDD, 0xDF],
   [OM.COP]: [0x02],
   [OM.CPX]: [0xE0, 0xE4, 0xEC],
   [OM.CPY]: [0xC0, 0xC4, 0xCC],
   [OM.DEC]: [0x3A, 0xC6, 0xCE, 0xD6, 0xDE],
   [OM.DEX]: [0xCA],
   [OM.DEY]: [0x88],
   [OM.EOR]: [0x41, 0x43, 0x45, 0x47, 0x49, 0x4D, 0x4F, 0x51, 0x52, 0x53, 0x55, 0x57, 0x59, 0x5D, 0x5F],
   [OM.INC]: [0x1A, 0xE6, 0xEE, 0xF6, 0xFE],
   [OM.INX]: [0xE8],
   [OM.INY]: [0xC8],
   [OM.JML]: [0xDC],
   [OM.JMP]: [0x4C, 0x5C, 0x6C, 0x7C],
   [OM.JSL]: [0x22],
   [OM.JSR]: [0x20, 0xFC],
   [OM.LDA]: [0xA1, 0xA3, 0xA5, 0xA7, 0xA9, 0xAD, 0xAF, 0xB1, 0xB2, 0xB3, 0xB5, 0xB7, 0xB9, 0xBD, 0xBF],
   [OM.LDX]: [0xA2, 0xA6, 0xAE, 0xB6, 0xBE],
   [OM.LDY]: [0xA0, 0xA4, 0xAC, 0xB4, 0xBC],
   [OM.LSR]: [0x46, 0x4A, 0x4E, 0x56, 0x5E],
   [OM.MVN]: [0x54],
   [OM.MVP]: [0x44],
   [OM.NOP]: [0xEA],
   [OM.ORA]: [0x01, 0x03, 0x05, 0x07, 0x09, 0x0D, 0x0F, 0x11, 0x12, 0x13, 0x15, 0x17, 0x19, 0x1D, 0x1F],
   [OM.PEA]: [0xF4],
   [OM.PEI]: [0xD4],
   [OM.PER]: [0x62],
   [OM.PHA]: [0x48],
   [OM.PHB]: [0x8B],
   [OM.PHD]: [0x0B],
   [OM.PHK]: [0x4B],
   [OM.PHP]: [0x08],
   [OM.PHX]: [0xDA],
   [OM.PHY]: [0x5A],
   [OM.PLA]: [0x68],
   [OM.PLB]: [0xAB],
   [OM.PLD]: [0x2B],
   [OM.PLP]: [0x28],
   [OM.PLX]: [0xFA],
   [OM.PLY]: [0x7A],
   [OM.REP]: [0xC2],
   [OM.ROL]: [0x26, 0x2A, 0x2E, 0x36, 0x3E],
   [OM.ROR]: [0x66, 0x6A, 0x6E, 0x76, 0x7E],
   [OM.RTI]: [0x40],
   [OM.RTL]: [0x6B],
   [OM.RTS]: [0x60],
   [OM.SBC]: [0xE1, 0xE3, 0xE5, 0xE7, 0xE9, 0xED, 0xEF, 0xF1, 0xF2, 0xF3, 0xF5, 0xF7, 0xF9, 0xFD, 0xFF],
   [OM.SEC]: [0x38],
   [OM.SED]: [0xF8],
   [OM.SEI]: [0x78],
   [OM.SEP]: [0xE2],
   [OM.STA]: [0x81, 0x83, 0x85, 0x87, 0x8D, 0x8F, 0x91, 0x92, 0x93, 0x95, 0x97, 0x99, 0x9D, 0x9F],
   [OM.STP]: [0xDB],
   [OM.STX]: [0x86, 0x8E, 0x96],
   [OM.STY]: [0x84, 0x8C, 0x94],
   [OM.STZ]: [0x64, 0x74, 0x9C, 0x9E],
   [OM.TAX]: [0xAA],
   [OM.TAY]: [0xA8],
   [OM.TCD]: [0x5B],
   [OM.TCS]: [0x1B],
   [OM.TDC]: [0x7B],
   [OM.TRB]: [0x14, 0x1C],
   [OM.TSB]: [0x04, 0x0C],
   [OM.TSC]: [0x3B],
   [OM.TSX]: [0xBA],
   [OM.TXA]: [0x8A],
   [OM.TXS]: [0x9A],
   [OM.TXY]: [0x9B],
   [OM.TYA]: [0x98],
   [OM.TYX]: [0xBB],
   [OM.WAI]: [0xCB],
   [OM.WDM]: [0x42],
   [OM.XBA]: [0xEB],
   [OM.XCE]: [0xFB],
   [OM.S_RESET]: [0x100],
   [OM.S_ABORT]: [0x101],
   [OM.S_IRQ]: [0x102],
   [OM.S_NMI]: [0x103]
});

// This addressing matrix is made by hand. The "non-reverse" one is generated with a function below
const opcode_AM_R = Object.freeze({
    [AM.A]: [0x0C, 0x0D, 0x0E, 0x1C, 0x20, 0x2C, 0x2D, 0x2E, 0x4C, 0x4D, 0x4E, 0x6D, 0x6E, 0x8C, 0x8D, 0x8E, 0x9C, 0xAC, 0xAD, 0xAE, 0xCC, 0xCD, 0xCE, 0xEC, 0xED, 0xEE],
    [AM.ACCUM]: [0x0A, 0x1A, 0x2A, 0x3A, 0x4A, 0x6A],
    [AM.A_INDEXED_X]: [0x1D, 0x1E, 0x3C, 0x3D, 0x3E, 0x5D, 0x5E, 0x7D, 0x7E, 0x9D, 0x9E, 0xBC, 0xBD, 0xDD, 0xDE, 0xFD, 0xFE],
    [AM.A_INDEXED_Y]: [0x19, 0x39, 0x59, 0x79, 0x99, 0xB9, 0xBE, 0xD9, 0xF9],
    [AM.AL]: [0x0F, 0x22, 0x2F, 0x4F, 0x5C, 0x6F, 0x8F, 0xAF, 0xCF, 0xEF],
    [AM.AL_INDEXED_X]: [0x1F, 0x3F, 0x5F, 0x7F, 0x9F, 0xBF, 0xDF, 0xFF],
    [AM.A_IND]: [0x6C, 0xDC],
    [AM.A_INDEXED_IND]: [0x7C, 0xFC],
    [AM.D]: [0x04, 0x05, 0x06, 0x14, 0x24, 0x25, 0x26, 0x45, 0x46, 0x64, 0x65, 0x66, 0x84, 0x85, 0x86, 0xA4, 0xA5, 0xA6, 0xC4, 0xC5, 0xC6, 0xE4, 0xE5, 0xE6],
    [AM.STACK_R]: [0x03, 0x23, 0x43, 0x63, 0x83, 0xA3, 0xC3, 0xE3],
    [AM.D_INDEXED_X]: [0x15, 0x16, 0x34, 0x35, 0x36, 0x55, 0x56, 0x74, 0x75, 0x76, 0x94, 0x95, 0xB4, 0xB5, 0xD5, 0xD6, 0xF5, 0xF6],
    [AM.D_INDEXED_Y]: [0x96, 0xB6],
    [AM.D_IND]: [0x12, 0x32, 0x52, 0x72, 0x92, 0xB2, 0xD2, 0xF2],
    [AM.D_IND_L]: [0x07, 0x27, 0x47, 0x67, 0x87, 0xA7, 0xC7, 0xE7],
    [AM.STACK_R_IND_INDEXED]: [0x13, 0x33, 0x53, 0x73, 0x93, 0xB3, 0xD3, 0xF3],
    [AM.D_INDEXED_IND]: [0x01, 0x21, 0x41, 0x61, 0x81, 0xA1, 0xC1, 0xE1],
    [AM.D_IND_INDEXED]: [0x11, 0x31, 0x51, 0x71, 0x91, 0xB1, 0xD1, 0xF1],
    [AM.D_IND_L_INDEXED]: [0x17, 0x37, 0x57, 0x77, 0x97, 0xB7, 0xD7, 0xF7],
    [AM.I]: [0x18, 0x1B, 0x38, 0x3B, 0x42, 0x58, 0x5B, 0x78, 0x7B, 0x88, 0x8A, 0x98, 0x9A, 0x9B, 0xA8, 0xAA, 0xB8, 0xBA, 0xBB, 0xC8, 0xCA, 0xCB, 0xD8, 0xDB, 0xE8, 0xEA, 0xEB, 0xF8, 0xFB],
    [AM.PC_R]: [0x10, 0x30, 0x50, 0x70, 0x80, 0x90, 0xB0, 0xD0, 0xF0],
    [AM.PC_RL]: [0x82],
    [AM.STACK]: [0x00, 0x02, 0x08, 0x0B, 0x28, 0x2B, 0x40, 0x48, 0x4B, 0x5A, 0x60, 0x62, 0x68, 0x6B, 0x7A, 0x8B, 0xAB, 0xD4, 0xDA, 0xF4, 0xFA, 0x100, 0x101, 0x102, 0x103],
    [AM.XYC]: [0x44, 0x54],
    [AM.IMM]: [0x09, 0x29, 0x49, 0x69, 0x89, 0xA0, 0xA2, 0xA9, 0xC0, 0xC2, 0xC9, 0xE0, 0xE2, 0xE9],
});

const opcode_AM_SPLIT_R = Object.freeze({
    [AM.A]: [0x0D, 0x2C, 0x2D, 0x4D, 0x6D, 0x8C, 0x8D, 0x8E, 0x9C, 0xAC, 0xAD, 0xAE, 0xCC, 0xCD, 0xEC, 0xED],
    [AM.Ab]: [0x4C],
    [AM.Ac]: [0x20],
    [AM.Ad]: [0x0C, 0x0E, 0x1C, 0x2E, 0xCE, 0xEE, 0x4E, 0x6E], // RMW ASL DEC INC LSR ROL ROR TRB TSB
    [AM.ACCUM]: [0x0A, 0x1A, 0x2A, 0x3A, 0x4A, 0x6A],
    [AM.A_INDEXED_X]: [0x1D, 0x3C, 0x3D, 0x5D, 0x7D, 0x9D, 0x9E, 0xBC, 0xBD, 0xDD, 0xFD],
    [AM.A_INDEXED_Xb]: [0x1E, 0x3E, 0x5E, 0x7E, 0xDE, 0xFE], // rmw. ASL, DEC, INC, LSR, ROL, ROR
    [AM.A_INDEXED_Y]: [0x19, 0x39, 0x59, 0x79, 0x99, 0xB9, 0xBE, 0xD9, 0xF9],
    [AM.AL]: [0x0F, 0x2F, 0x4F, 0x6F, 0x8F, 0xAF, 0xCF, 0xEF],
    [AM.ALb]: [0x5C], // JMP al
    [AM.ALc]: [0x22], // JSL al
    [AM.AL_INDEXED_X]: [0x1F, 0x3F, 0x5F, 0x7F, 0x9F, 0xBF, 0xDF, 0xFF],
    [AM.A_IND]: [0xDC],   // JML (a)
    [AM.A_INDb]: [0x6C],        // JMP (a)
    [AM.A_INDEXED_IND]: [0x7C], // JMP (a,x)
    [AM.A_INDEXED_INDb]: [0xFC], // JSR (a,x)
    [AM.D]: [0x05, 0x24, 0x25, 0x45, 0x64, 0x65, 0x84, 0x85, 0x86, 0xA4, 0xA5, 0xA6, 0xC4, 0xC5, 0xE4, 0xE5],
    [AM.Db]: [0x04, 0x06, 0x14, 0x26, 0x46, 0x66, 0xC6, 0xE6], // rmw ASL DEC INC LSR ROL ROR TRB TSB
    [AM.STACK_R]: [0x03, 0x23, 0x43, 0x63, 0x83, 0xA3, 0xC3, 0xE3],
    [AM.D_INDEXED_X]: [0x15, 0x34, 0x35, 0x55, 0x74, 0x75, 0x94, 0x95, 0xB4, 0xB5, 0xD5, 0xF5],
    [AM.D_INDEXED_Xb]: [0x16, 0x36, 0x56, 0x76, 0xD6, 0xF6], // rmw. ASL DEC INC LSR ROL ROR
    [AM.D_INDEXED_Y]: [0x96, 0xB6],
    [AM.D_IND]: [0x12, 0x32, 0x52, 0x72, 0x92, 0xB2, 0xD2, 0xF2],
    [AM.D_IND_L]: [0x07, 0x27, 0x47, 0x67, 0x87, 0xA7, 0xC7, 0xE7],
    [AM.STACK_R_IND_INDEXED]: [0x13, 0x33, 0x53, 0x73, 0x93, 0xB3, 0xD3, 0xF3],
    [AM.D_INDEXED_IND]: [0x01, 0x21, 0x41, 0x61, 0x81, 0xA1, 0xC1, 0xE1],
    [AM.D_IND_INDEXED]: [0x11, 0x31, 0x51, 0x71, 0x91, 0xB1, 0xD1, 0xF1],
    [AM.D_IND_L_INDEXED]: [0x17, 0x37, 0x57, 0x77, 0x97, 0xB7, 0xD7, 0xF7],
    [AM.I]: [0x18, 0x1B, 0x38, 0x3B, 0x42, 0x58, 0x5B, 0x78, 0x7B, 0x88, 0x8A, 0x98, 0x9A, 0x9B, 0xA8, 0xAA, 0xB8, 0xBA, 0xBB, 0xC8, 0xCA, 0xD8, 0xE8, 0xEA, 0xF8, 0xFB],
    [AM.Ib]: [0xEB], // XBA
    [AM.Ic]: [0xDB], // STP
    [AM.Id]: [0xCB], // WAI
    [AM.PC_R]: [0x10, 0x30, 0x50, 0x70, 0x80, 0x90, 0xB0, 0xD0, 0xF0],
    [AM.PC_RL]: [0x82],
    [AM.STACK]: [0x100, 0x101, 0x102, 0x103], // ABORT, IRQ, NMI, RES... "special" instructions
    [AM.STACKb]: [0x28, 0x2B, 0x68, 0x7A, 0xAB, 0xFA], // PLA, PLB, PLD, PLP, PLX, PLY
    [AM.STACKc]: [0x08, 0x0B, 0x48, 0x4B, 0x5A, 0x8B, 0xDA], // PHA, PHB, PHP, PHD, PHK, PHX, PHY
    [AM.STACKd]: [0xF4], // PEA
    [AM.STACKe]: [0xD4], // PEI
    [AM.STACKf]: [0x62], // PER
    [AM.STACKg]: [0x40], // RTI
    [AM.STACKh]: [0x60], // RTS
    [AM.STACKi]: [0x6B], // RTL
    [AM.STACKj]: [0x00, 0x02], // BRK, COP
    [AM.XYC]: [0x54], // MVN
    [AM.XYCb]: [0x44], // MVP
    [AM.IMM]: [0x09, 0x29, 0x49, 0x69, 0x89, 0xA0, 0xA2, 0xA9, 0xC0, 0xC2, 0xC9, 0xE0, 0xE2, 0xE9]
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
    for (let i = 0; i <= MAX_OPCODE; i++) {
        let j = array_of_array_contains(opcode_MN_R, i);
        if (on_line === per_line) {
            on_line = 0;
            if (!first) ostr += ',\n' + indent;
            else ostr += indent;
            first = false;
        }
        else {
            ostr += ', ';
        }
        ostr += '0x' + hex2(i) + ": OM." + opcode_MN[j];
        on_line++;
    }
    ostr += '});';
    return ostr;
}


// this isn't needed, it was used
//console.log(generate_opcode_R('    '));
const opcode_R = Object.freeze({
    0x00: OM.BRK, 0x01: OM.ORA, 0x02: OM.COP, 0x03: OM.ORA,
    0x04: OM.TSB, 0x05: OM.ORA, 0x06: OM.ASL, 0x07: OM.ORA,
    0x08: OM.PHP, 0x09: OM.ORA, 0x0A: OM.ASL, 0x0B: OM.PHD,
    0x0C: OM.TSB, 0x0D: OM.ORA, 0x0E: OM.ASL, 0x0F: OM.ORA,
    0x10: OM.BPL, 0x11: OM.ORA, 0x12: OM.ORA, 0x13: OM.ORA,
    0x14: OM.TRB, 0x15: OM.ORA, 0x16: OM.ASL, 0x17: OM.ORA,
    0x18: OM.CLC, 0x19: OM.ORA, 0x1A: OM.INC, 0x1B: OM.TCS,
    0x1C: OM.TRB, 0x1D: OM.ORA, 0x1E: OM.ASL, 0x1F: OM.ORA,
    0x20: OM.JSR, 0x21: OM.AND, 0x22: OM.JSL, 0x23: OM.AND,
    0x24: OM.BIT, 0x25: OM.AND, 0x26: OM.ROL, 0x27: OM.AND,
    0x28: OM.PLP, 0x29: OM.AND, 0x2A: OM.ROL, 0x2B: OM.PLD,
    0x2C: OM.BIT, 0x2D: OM.AND, 0x2E: OM.ROL, 0x2F: OM.AND,
    0x30: OM.BMI, 0x31: OM.AND, 0x32: OM.AND, 0x33: OM.AND,
    0x34: OM.BIT, 0x35: OM.AND, 0x36: OM.ROL, 0x37: OM.AND,
    0x38: OM.SEC, 0x39: OM.AND, 0x3A: OM.DEC, 0x3B: OM.TSC,
    0x3C: OM.BIT, 0x3D: OM.AND, 0x3E: OM.ROL, 0x3F: OM.AND,
    0x40: OM.RTI, 0x41: OM.EOR, 0x42: OM.WDM, 0x43: OM.EOR,
    0x44: OM.MVP, 0x45: OM.EOR, 0x46: OM.LSR, 0x47: OM.EOR,
    0x48: OM.PHA, 0x49: OM.EOR, 0x4A: OM.LSR, 0x4B: OM.PHK,
    0x4C: OM.JMP, 0x4D: OM.EOR, 0x4E: OM.LSR, 0x4F: OM.EOR,
    0x50: OM.BVC, 0x51: OM.EOR, 0x52: OM.EOR, 0x53: OM.EOR,
    0x54: OM.MVN, 0x55: OM.EOR, 0x56: OM.LSR, 0x57: OM.EOR,
    0x58: OM.CLI, 0x59: OM.EOR, 0x5A: OM.PHY, 0x5B: OM.TCD,
    0x5C: OM.JMP, 0x5D: OM.EOR, 0x5E: OM.LSR, 0x5F: OM.EOR,
    0x60: OM.RTS, 0x61: OM.ADC, 0x62: OM.PER, 0x63: OM.ADC,
    0x64: OM.STZ, 0x65: OM.ADC, 0x66: OM.ROR, 0x67: OM.ADC,
    0x68: OM.PLA, 0x69: OM.ADC, 0x6A: OM.ROR, 0x6B: OM.RTL,
    0x6C: OM.JMP, 0x6D: OM.ADC, 0x6E: OM.ROR, 0x6F: OM.ADC,
    0x70: OM.BVS, 0x71: OM.ADC, 0x72: OM.ADC, 0x73: OM.ADC,
    0x74: OM.STZ, 0x75: OM.ADC, 0x76: OM.ROR, 0x77: OM.ADC,
    0x78: OM.SEI, 0x79: OM.ADC, 0x7A: OM.PLY, 0x7B: OM.TDC,
    0x7C: OM.JMP, 0x7D: OM.ADC, 0x7E: OM.ROR, 0x7F: OM.ADC,
    0x80: OM.BRA, 0x81: OM.STA, 0x82: OM.BRL, 0x83: OM.STA,
    0x84: OM.STY, 0x85: OM.STA, 0x86: OM.STX, 0x87: OM.STA,
    0x88: OM.DEY, 0x89: OM.BIT, 0x8A: OM.TXA, 0x8B: OM.PHB,
    0x8C: OM.STY, 0x8D: OM.STA, 0x8E: OM.STX, 0x8F: OM.STA,
    0x90: OM.BCC, 0x91: OM.STA, 0x92: OM.STA, 0x93: OM.STA,
    0x94: OM.STY, 0x95: OM.STA, 0x96: OM.STX, 0x97: OM.STA,
    0x98: OM.TYA, 0x99: OM.STA, 0x9A: OM.TXS, 0x9B: OM.TXY,
    0x9C: OM.STZ, 0x9D: OM.STA, 0x9E: OM.STZ, 0x9F: OM.STA,
    0xA0: OM.LDY, 0xA1: OM.LDA, 0xA2: OM.LDX, 0xA3: OM.LDA,
    0xA4: OM.LDY, 0xA5: OM.LDA, 0xA6: OM.LDX, 0xA7: OM.LDA,
    0xA8: OM.TAY, 0xA9: OM.LDA, 0xAA: OM.TAX, 0xAB: OM.PLB,
    0xAC: OM.LDY, 0xAD: OM.LDA, 0xAE: OM.LDX, 0xAF: OM.LDA,
    0xB0: OM.BCS, 0xB1: OM.LDA, 0xB2: OM.LDA, 0xB3: OM.LDA,
    0xB4: OM.LDY, 0xB5: OM.LDA, 0xB6: OM.LDX, 0xB7: OM.LDA,
    0xB8: OM.CLV, 0xB9: OM.LDA, 0xBA: OM.TSX, 0xBB: OM.TYX,
    0xBC: OM.LDY, 0xBD: OM.LDA, 0xBE: OM.LDX, 0xBF: OM.LDA,
    0xC0: OM.CPY, 0xC1: OM.CMP, 0xC2: OM.REP, 0xC3: OM.CMP,
    0xC4: OM.CPY, 0xC5: OM.CMP, 0xC6: OM.DEC, 0xC7: OM.CMP,
    0xC8: OM.INY, 0xC9: OM.CMP, 0xCA: OM.DEX, 0xCB: OM.WAI,
    0xCC: OM.CPY, 0xCD: OM.CMP, 0xCE: OM.DEC, 0xCF: OM.CMP,
    0xD0: OM.BNE, 0xD1: OM.CMP, 0xD2: OM.CMP, 0xD3: OM.CMP,
    0xD4: OM.PEI, 0xD5: OM.CMP, 0xD6: OM.DEC, 0xD7: OM.CMP,
    0xD8: OM.CLD, 0xD9: OM.CMP, 0xDA: OM.PHX, 0xDB: OM.STP,
    0xDC: OM.JML, 0xDD: OM.CMP, 0xDE: OM.DEC, 0xDF: OM.CMP,
    0xE0: OM.CPX, 0xE1: OM.SBC, 0xE2: OM.SEP, 0xE3: OM.SBC,
    0xE4: OM.CPX, 0xE5: OM.SBC, 0xE6: OM.INC, 0xE7: OM.SBC,
    0xE8: OM.INX, 0xE9: OM.SBC, 0xEA: OM.NOP, 0xEB: OM.XBA,
    0xEC: OM.CPX, 0xED: OM.SBC, 0xEE: OM.INC, 0xEF: OM.SBC,
    0xF0: OM.BEQ, 0xF1: OM.SBC, 0xF2: OM.SBC, 0xF3: OM.SBC,
    0xF4: OM.PEA, 0xF5: OM.SBC, 0xF6: OM.INC, 0xF7: OM.SBC,
    0xF8: OM.SED, 0xF9: OM.SBC, 0xFA: OM.PLX, 0xFB: OM.XCE,
    0xFC: OM.JSR, 0xFD: OM.SBC, 0xFE: OM.INC, 0xFF: OM.SBC,
    0x100: OM.S_RESET, 0x101: OM.S_ABORT, 0x102: OM.S_IRQ,
    0x103: OM.S_NMI
});

const A_OR_M_X = Object.freeze(new Set([OM.CPX, OM.CPY, OM.STX, OM.STY, OM.LDX, OM.LDY]));
const STACK_X = Object.freeze(new Set([OM.PLX, OM.PLY, OM.PHX, OM.PHY]));
const STACK_M = Object.freeze(new Set([OM.PHA, OM.PLA]));
const STACK_8 = Object.freeze(new Set([OM.PHP, OM.PHB, OM.PHK, OM.PLP, OM.PLP]));
const STACK_16 = Object.freeze(new Set([OM.PLD, OM.PHD]));

const A_R_INS = Object.freeze(new Set([OM.ADC, OM.AND, OM.BIT, OM.CMP, OM.CPX, OM.CPY, OM.EOR, OM.LDA, OM.LDX, OM.LDY, OM.ORA, OM.SBC]));
