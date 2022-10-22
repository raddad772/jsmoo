"use strict";

/*
const M68K_MN_LIST = Object.freeze([
    'ABCD',

    'ADD',
    'ADD_B_EA_DR', 'ADD_W_EA_DR', 'ADD_L_EA_DR',
    'ADD_B_DR_EA', 'ADD_W_DR_EA', 'ADD_L_DR_EA',

    'ADDA',
    'ADDA_W', 'ADDA_L',

    'ADDI',
    'ADDI_B', 'ADDI_W', 'ADDI_L',

    'ADDQ',
    'ADDQ_B_EA', 'ADDQ_W_EA', 'ADDQ_L_EA',
    'ADDQ_W_AR', 'ADDQ_L_AR',

    'ADDX',
    'ADDX_B', 'ADDX_W', 'ADDX_L',

    'AND',
    'AND_B_EA_DR', 'AND_W_EA_DR', 'AND_L_EA_DR',
    'AND_B_DR_EA', 'AND_W_DR_EA', 'AND_L_DR_EA',

    'ANDI',
    'ANDI_B', 'ANDI_W', 'ANDI_L',

    'ANDI_TO_CCR',

    'ANDI_TO_SR',

    'ASL',
    'ASL_B_IMM', 'ASL_W_IMM', 'ASL_L_IMM',
    'ASL_B_REG', 'ASL_W_REG', 'ASL_L_REG',
    'ASL_EA',

    'ASR',
    'ASR_B_IMM', 'ASR_W_IMM', 'ASR_L_IMM',
    'ASR_B_REG', 'ASR_W_REG', 'ASR_L_REG',
    'ASR_EA',

    'BCC',

    'BCHG',
    'BCHG_B_REG', 'BCHG_L_REG',
    'BCHG_B_IMM', 'BCHG_L_IMM',

    'BCLR',
    'BCLR_B_REG', 'BCLR_L_REG',
    'BCLR_B_IMM', 'BCLR_L_IMM',


    'BRA',

    'BSET',
    'BSET_B_REG', 'BSET_L_REG',
    'BSET_B_IMM', 'BSET_L_IMM',

    'BSR',

    'BTST',
    'BTST_B_REG', 'BTST_L_REG',
    'BTST_B_IMM', 'BTST_L_IMM',

    'CHK',

    'CLR',
    'CLR_B', 'CLR_W', 'CLR_L',

    'CMP',
    'CMP_B', 'CMP_W', 'CMP_L',

    'CMPA',
    'CMPA_W', 'CMPA_L',

    'CMPI',
    'CMPI_B', 'CMPI_W', 'CMPI_L',

    'CMPM',
    'CMPM_B', 'CMPM_W', 'CMPM_L',

    'DBCC',

    'DIVS',

    'DIVU',

    'EOR',
    'EOR_B', 'EOR_W', 'EOR_L',

    'EORI',
    'EORI_B', 'EORI_W', 'EORI_L',

    'EORI_TO_CCR',

    'EORI_TO_SR',

    'EXG',
    'EXG_DR_DR', 'EXG_AR_AR', 'EXG_DR_AR',

    'EXT',
    'EXT_W', 'EXT_L',

    'ILLEGAL',

    'JMP',

    'JSR',

    'LEA',

    'LINK',

    'LSL',
    'LSL_B_IMM', 'LSL_W_IMM', 'LSL_L_IMM',
    'LSL_B_REG', 'LSL_W_REG', 'LSL_L_REG',
    'LSL_EA',

    'LSR',
    'LSR_B_IMM', 'LSR_W_IMM', 'LSR_L_IMM',
    'LSR_B_REG', 'LSR_W_REG', 'LSR_L_REG',
    'LSR_EA',

    'MOVE',
    'MOVE_B', 'MOVE_W', 'MOVE_L',

    'MOVEA',
    'MOVEA_W', 'MOVEA_L',

    'MOVE_FROM_SR',
    'MOVE_TO_CCR',
    'MOVE_TO_SR',
    'MOVE_FROM_USP',
    'MOVE_TO_USP',

    'MOVEM',
    'MOVEM_TO_MEM_W', 'MOVEM_TO_MEM_L',
    'MOVEM_TO_REG_W', 'MOVEM_TO_REG_L',

    'MOVEP',
    'MOVEP_W_DR_EA', 'MOVEP_L_DR_EA',
    'MOVEP_W_EA_DR', 'MOVEP_L_EA_DR',

    'MOVEQ',

    'MULS',

    'MULU',

    'NBCD',

    'NEG',
    'NEG_B', 'NEG_W', 'NEG_L',

    'NEGX',
    'NEGX_B', 'NEGX_W', 'NEGX_L',

    'NOP',

    'NOT',
    'NOT_B', 'NOT_W', 'NOT_L',

    'OR',
    'OR_B_EA_DR', 'OR_W_EA_DR', 'OR_L_EA_DR',
    'OR_B_DR_EA', 'OR_W_DR_EA', 'OR_L_DR_EA',

    'ORI',
    'ORI_B', 'ORI_W', 'ORI_L',

    'ORI_TO_CCR',
    'ORI_TO_SR',

    'PEA',

    'RESET',

    'ROL',
    'ROL_B_IMM', 'ROL_W_IMM', 'ROL_L_IMM',
    'ROL_B_REG', 'ROL_W_REG', 'ROL_L_REG',
    'ROL_EA',

    'ROR',
    'ROR_B_IMM', 'ROR_W_IMM', 'ROR_L_IMM',
    'ROR_B_REG', 'ROR_W_REG', 'ROR_L_REG',
    'ROR_EA',

    'ROXL',
    'ROXL_B_IMM', 'ROXL_W_IMM', 'ROXL_L_IMM',
    'ROXL_B_REG', 'ROXL_W_REG', 'ROXL_L_REG',
    'ROXL_EA',

    'ROXR',
    'ROXR_B_IMM', 'ROXR_W_IMM', 'ROXR_L_IMM',
    'ROXR_B_REG', 'ROXR_W_REG', 'ROXR_L_REG',
    'ROXR_EA',

    'RTE',

    'RTR',

    'RTS',

    'SBCD',

    'SCC',

    'STOP',

    'SUB',
    'SUB_B_EA_DR', 'SUB_W_EA_DR', 'SUB_L_EA_DR',
    'SUB_B_DR_EA', 'SUB_W_DR_EA', 'SUB_L_DR_EA',

    'SUBA',
    'SUBA_W', 'SUBA_L',

    'SUBI',
    'SUBI_B', 'SUBI_W', 'SUBI_L',

    'SUBQ',
    'SUBQ_B_IMM_EA', 'SUBQ_W_IMM_EA', 'SUBQ_L_IMM_EA',
    'SUBQ_W_IMM_AR', 'SUBQ_L_IMM_AR',

    'SUBX',
    'SUBX_B', 'SUBX_W', 'SUBX_L',

    'SWAP',

    'TAS',

    'TRAP',

    'TRAPV',

    'TST',
    'TST_B', 'TST_W', 'TST_L',

    'UNLK'
]);


function m68k_mn_gen() {

    let outstr = 'const M68K_MN = Object.freeze({\n';
    let cnt = 0;
    for (let i in M68K_MN_LIST) {
        outstr += '    ' + M68K_MN_LIST[i] + ': ' + cnt + ',\n';
        cnt++;
    }
    return outstr + '});\n';
}
console.log(m68k_mn_gen());
*/


const M68K_MN = Object.freeze({
    ABCD: 0,
    ADD: 1,
    ADD_B_EA_DR: 2,
    ADD_W_EA_DR: 3,
    ADD_L_EA_DR: 4,
    ADD_B_DR_EA: 5,
    ADD_W_DR_EA: 6,
    ADD_L_DR_EA: 7,
    ADDA: 8,
    ADDA_W: 9,
    ADDA_L: 10,
    ADDI: 11,
    ADDI_B: 12,
    ADDI_W: 13,
    ADDI_L: 14,
    ADDQ: 15,
    ADDQ_B_EA: 16,
    ADDQ_W_EA: 17,
    ADDQ_L_EA: 18,
    ADDQ_W_AR: 19,
    ADDQ_L_AR: 20,
    ADDX: 21,
    ADDX_B: 22,
    ADDX_W: 23,
    ADDX_L: 24,
    AND: 25,
    AND_B_EA_DR: 26,
    AND_W_EA_DR: 27,
    AND_L_EA_DR: 28,
    AND_B_DR_EA: 29,
    AND_W_DR_EA: 30,
    AND_L_DR_EA: 31,
    ANDI: 32,
    ANDI_B: 33,
    ANDI_W: 34,
    ANDI_L: 35,
    ANDI_TO_CCR: 36,
    ANDI_TO_SR: 37,
    ASL: 38,
    ASL_B_IMM: 39,
    ASL_W_IMM: 40,
    ASL_L_IMM: 41,
    ASL_B_REG: 42,
    ASL_W_REG: 43,
    ASL_L_REG: 44,
    ASL_EA: 45,
    ASR: 46,
    ASR_B_IMM: 47,
    ASR_W_IMM: 48,
    ASR_L_IMM: 49,
    ASR_B_REG: 50,
    ASR_W_REG: 51,
    ASR_L_REG: 52,
    ASR_EA: 53,
    BCC: 54,
    BCHG: 55,
    BCHG_B_REG: 56,
    BCHG_L_REG: 57,
    BCHG_B_IMM: 58,
    BCHG_L_IMM: 59,
    BCLR: 60,
    BCLR_B_REG: 61,
    BCLR_L_REG: 62,
    BCLR_B_IMM: 63,
    BCLR_L_IMM: 64,
    BRA: 65,
    BSET: 66,
    BSET_B_REG: 67,
    BSET_L_REG: 68,
    BSET_B_IMM: 69,
    BSET_L_IMM: 70,
    BSR: 71,
    BTST: 72,
    BTST_B_REG: 73,
    BTST_L_REG: 74,
    BTST_B_IMM: 75,
    BTST_L_IMM: 76,
    CHK: 77,
    CLR: 78,
    CLR_B: 79,
    CLR_W: 80,
    CLR_L: 81,
    CMP: 82,
    CMP_B: 83,
    CMP_W: 84,
    CMP_L: 85,
    CMPA: 86,
    CMPA_W: 87,
    CMPA_L: 88,
    CMPI: 89,
    CMPI_B: 90,
    CMPI_W: 91,
    CMPI_L: 92,
    CMPM: 93,
    CMPM_B: 94,
    CMPM_W: 95,
    CMPM_L: 96,
    DBCC: 97,
    DIVS: 98,
    DIVU: 99,
    EOR: 100,
    EOR_B: 101,
    EOR_W: 102,
    EOR_L: 103,
    EORI: 104,
    EORI_B: 105,
    EORI_W: 106,
    EORI_L: 107,
    EORI_TO_CCR: 108,
    EORI_TO_SR: 109,
    EXG: 110,
    EXG_DR_DR: 111,
    EXG_AR_AR: 112,
    EXG_DR_AR: 113,
    EXT: 114,
    EXT_W: 115,
    EXT_L: 116,
    ILLEGAL: 117,
    JMP: 118,
    JSR: 119,
    LEA: 120,
    LINK: 121,
    LSL: 122,
    LSL_B_IMM: 123,
    LSL_W_IMM: 124,
    LSL_L_IMM: 125,
    LSL_B_REG: 126,
    LSL_W_REG: 127,
    LSL_L_REG: 128,
    LSL_EA: 129,
    LSR: 130,
    LSR_B_IMM: 131,
    LSR_W_IMM: 132,
    LSR_L_IMM: 133,
    LSR_B_REG: 134,
    LSR_W_REG: 135,
    LSR_L_REG: 136,
    LSR_EA: 137,
    MOVE: 138,
    MOVE_B: 139,
    MOVE_W: 140,
    MOVE_L: 141,
    MOVEA: 142,
    MOVEA_W: 143,
    MOVEA_L: 144,
    MOVE_FROM_SR: 145,
    MOVE_TO_CCR: 146,
    MOVE_TO_SR: 147,
    MOVE_FROM_USP: 148,
    MOVE_TO_USP: 149,
    MOVEM: 150,
    MOVEM_TO_MEM_W: 151,
    MOVEM_TO_MEM_L: 152,
    MOVEM_TO_REG_W: 153,
    MOVEM_TO_REG_L: 154,
    MOVEP: 155,
    MOVEP_W_DR_EA: 156,
    MOVEP_L_DR_EA: 157,
    MOVEP_W_EA_DR: 158,
    MOVEP_L_EA_DR: 159,
    MOVEQ: 160,
    MULS: 161,
    MULU: 162,
    NBCD: 163,
    NEG: 164,
    NEG_B: 165,
    NEG_W: 166,
    NEG_L: 167,
    NEGX: 168,
    NEGX_B: 169,
    NEGX_W: 170,
    NEGX_L: 171,
    NOP: 172,
    NOT: 173,
    NOT_B: 174,
    NOT_W: 175,
    NOT_L: 176,
    OR: 177,
    OR_B_EA_DR: 178,
    OR_W_EA_DR: 179,
    OR_L_EA_DR: 180,
    OR_B_DR_EA: 181,
    OR_W_DR_EA: 182,
    OR_L_DR_EA: 183,
    ORI: 184,
    ORI_B: 185,
    ORI_W: 186,
    ORI_L: 187,
    ORI_TO_CCR: 188,
    ORI_TO_SR: 189,
    PEA: 190,
    RESET: 191,
    ROL: 192,
    ROL_B_IMM: 193,
    ROL_W_IMM: 194,
    ROL_L_IMM: 195,
    ROL_B_REG: 196,
    ROL_W_REG: 197,
    ROL_L_REG: 198,
    ROL_EA: 199,
    ROR: 200,
    ROR_B_IMM: 201,
    ROR_W_IMM: 202,
    ROR_L_IMM: 203,
    ROR_B_REG: 204,
    ROR_W_REG: 205,
    ROR_L_REG: 206,
    ROR_EA: 207,
    ROXL: 208,
    ROXL_B_IMM: 209,
    ROXL_W_IMM: 210,
    ROXL_L_IMM: 211,
    ROXL_B_REG: 212,
    ROXL_W_REG: 213,
    ROXL_L_REG: 214,
    ROXL_EA: 215,
    ROXR: 216,
    ROXR_B_IMM: 217,
    ROXR_W_IMM: 218,
    ROXR_L_IMM: 219,
    ROXR_B_REG: 220,
    ROXR_W_REG: 221,
    ROXR_L_REG: 222,
    ROXR_EA: 223,
    RTE: 224,
    RTR: 225,
    RTS: 226,
    SBCD: 227,
    SCC: 228,
    STOP: 229,
    SUB: 230,
    SUB_B_EA_DR: 231,
    SUB_W_EA_DR: 232,
    SUB_L_EA_DR: 233,
    SUB_B_DR_EA: 234,
    SUB_W_DR_EA: 235,
    SUB_L_DR_EA: 236,
    SUBA: 237,
    SUBA_W: 238,
    SUBA_L: 239,
    SUBI: 240,
    SUBI_B: 241,
    SUBI_W: 242,
    SUBI_L: 243,
    SUBQ: 244,
    SUBQ_B_IMM_EA: 245,
    SUBQ_W_IMM_EA: 246,
    SUBQ_L_IMM_EA: 247,
    SUBQ_W_IMM_AR: 248,
    SUBQ_L_IMM_AR: 249,
    SUBX: 250,
    SUBX_B: 251,
    SUBX_W: 252,
    SUBX_L: 253,
    SWAP: 254,
    TAS: 255,
    TRAP: 256,
    TRAPV: 257,
    TST: 258,
    TST_B: 259,
    TST_W: 260,
    TST_L: 261,
    UNLK: 262,
});

/*const M68K_AM_LIST = [
    'DataRegisterDirect', 'AddressRegisterDirect',
    'AddressRegisterIndirect', 'AddressRegisterIndirectWithPostIncrement',
    'AddressRegisterIndirectWithPreDecrement', 'AddressRegisterIndirectWithDisplacement',
    'AddressRegisterIndirectWithIndex', 'AbsoluteShortIndirect',
    'AbsoluteLongIndirect', 'ProgramCounterIndirectWithDisplacement',
    'ProgramCounterIndirectWithIndex', 'Immediate'
]

function m68k_am_gen() {
    let outstr = 'const M68K_AM = Object.freeze({\n';
    let cnt = 0;
    for (let i in M68K_AM_LIST) {
        outstr += '    ' + M68K_AM_LIST[i] + ': ' + cnt + ',\n';
        cnt++;
    }
    return outstr + '});\n';
}
console.log(m68k_am_gen());*/

const M68K_AM = Object.freeze({
    DataRegisterDirect: 0,
    AddressRegisterDirect: 1,
    AddressRegisterIndirect: 2,
    AddressRegisterIndirectWithPostIncrement: 3,
    AddressRegisterIndirectWithPreDecrement: 4,
    AddressRegisterIndirectWithDisplacement: 5,
    AddressRegisterIndirectWithIndex: 6,
    AbsoluteShortIndirect: 7,
    AbsoluteLongIndirect: 8,
    ProgramCounterIndirectWithDisplacement: 9,
    ProgramCounterIndirectWithIndex: 10,
    Immediate: 11,
});

/*const M68K_EX_LIST = [
    'Illegal', 'DivisionByZero', 'BoundsCheck',
    'Overflow','Unprivileged', 'Trap', 'Interrupt'
]

function m68k_ex_gen() {
    let outstr = 'const M68K_EX = Object.freeze({\n';
    let cnt = 0;
    for (let i in M68K_EX_LIST) {
        outstr += '    ' + M68K_EX_LIST[i] + ': ' + cnt + ',\n';
        cnt++;
    }
    return outstr + '});\n';
}
console.log(m68k_ex_gen());*/

const M68K_EX = Object.freeze({
    Illegal: 0,
    DivisionByZero: 1,
    BoundsCheck: 2,
    Overflow: 3,
    Unprivileged: 4,
    Trap: 5,
    Interrupt: 6,
});

const M68K_SZ = Object.freeze({
    Byte: 0,
    Word: 1,
    Long: 2
});

const M68K_UM = Object.freeze({
    User: 0,
    Supervisor: 1
});

const M68K_Reverse = 1;
const M68K_Extend = 1;
const M68K_Hold = 1;
const M68K_Fast = 1;

/*const M68K_VEC_LIST = [
    'ResetSP', 'ResetPC', 'BusError', 'AddressError',
    'IllegalInstruction', 'DivisonByZero', 'BoundsCheck', 'Overflow',
    'Unprivileged', 'Trace', 'IllegalLineA', 'IllegalLineF',
    'Spurious', 'Level1', 'Level2', 'Level3',
    'Level4', 'Level5', 'Level6', 'Level7',
    'Trap'
]

function m68k_vec_gen() {
    let outstr = 'const M68K_VEC = Object.freeze({\n';
    let cnt = 0;
    for (let i in M68K_VEC_LIST) {
        outstr += '    ' + M68K_VEC_LIST[i] + ': ' + cnt + ',\n';
        cnt++;
    }
    return outstr + '});\n';
}
console.log(m68k_vec_gen());*/

const M68K_VEC = Object.freeze({
    ResetSP: 0,
    ResetPC: 1,
    BusError: 2,
    AddressError: 3,
    IllegalInstruction: 4,
    DivisonByZero: 5,
    BoundsCheck: 6,
    Overflow: 7,
    Unprivileged: 8,
    Trace: 9,
    IllegalLineA: 10,
    IllegalLineF: 11,
    Spurious: 12,
    Level1: 13,
    Level2: 14,
    Level3: 15,
    Level4: 16,
    Level5: 17,
    Level6: 18,
    Level7: 19,
    Trap: 20, // lots of these
});

class M68K_EA {
    constructor(mode, reg) {
        if (mode === 7) mode += reg; // Convert modes 7:0-4 to 7-11
        this.mode = mode;
        this.reg = reg;
        this.valid = false;
        this.address = 0;
    }
}

class M68K_ins {
    constructor(opcode, ins_name, arg1 = null, arg2 = null, arg3 = null) {
        this.opcode = opcode;
        //this.MN = M68K_MN[ins_name];
        //this.SZ = SZ;
        this.ins_name = ins_name;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.arg3 = arg3;
    }
}

class M68K_DR {
    constructor(reg_num) {
        this.number = reg_num;
    }
}

class M68K_AR {
    constructor(reg_num) {
        this.number = reg_num;
    }
}


/**
 * {Array<M68K_ins>} M68K_INS_TEST
 */
let M68K_INS_TEST;

function fill_m68k_opcode_table(table) {
    function bind(opcodei, ins_name, arg1=null, arg2=null, arg3=null) {
        table[opcodei] = new M68K_ins(opcodei, ins_name, arg1, arg2, arg3);
    }

    let opcode;

    // ABCD
    let opcode_base = 0xC100; // 1100 ---1 0000 -----
    for (let treg = 0; treg < 8; treg++) {
        for (let sreg = 0; sreg < 8; sreg++) {
            opcode = opcode_base | (treg << 9) | sreg;
            let dataWith = new M68K_EA(M68K_AM.DataRegisterDirect, treg);
            let dataFrom = new M68K_EA(M68K_AM.DataRegisterDirect, sreg);
            bind(opcode | (0 << 3), M68K_MN.ABCD, dataFrom, dataWith);

            let addressWith = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPreDecrement, treg);
            let addressFrom = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPreDecrement, sreg);
            bind(opcode | (1 << 3), M68K_MN.ABCD, addressFrom, addressWith);
        }
    }

    // ADD
    opcode_base = 0xD000; // 1101 ---0 ++-- ----
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                opcode = opcode_base | (dreg << 9) | (mode << 3) | reg;
                if ((mode === 7) && (reg >= 5)) continue;

                let from = new M68K_EA(mode, reg);
                let mwith = new M68K_DR(dreg);
                if (mode !== 1) bind(opcode | (0 << 6), M68K_MN.ADD_B_EA_DR, from, mwith);
                bind(opcode | (1 << 6), M68K_MN.ADD_W_EA_DR, from, mwith);
                bind(opcode | (2 << 6), M68K_MN.ADD_L_EA_DR, from, mwith);
            }
        }
    }

    // ADD again
    opcode_base = 0xD100; // 1101 0001 ++-- ----
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                opcode = opcode_base | (dreg << 9)  (mode << 3) | reg;
                if ((mode <= 1) || ((mode === 7) && (reg >= 2))) continue;

                let from = new M68K_DR(dreg);
                let mwith = new M68K_EA(mode, reg);
                bind(opcode | (0 << 6), M68K_MN.ADD_B_DR_EA, from, mwith);
                bind(opcode | (1 << 6), M68K_MN.ADD_W_DR_EA, from, mwith);
                bind(opcode | (2 << 6), M68K_MN.ADD_L_DR_EA, from, mwith);
            }
        }
    }

    //ADDA
    opcode_base = 0xD0C0; // 1101 ---+ 11-- ----
    for (let areg = 0; areg < 8; areg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                opcode = opcode_base | (areg << 9) | (mode < 3) | reg;
                if ((mode === 7) && (reg >= 5)) continue;

                let mwith = new M68K_AR(areg);
                let from = new M68K_EA(mode, reg);
                bind(opcode | (0 << 8), M68K_MN.ADDA_W, from, mwith);
                bind(opcode | (1 << 8), M68K_MN.ADDA_L, from, mwith);
            }
        }
    }

    // ADDI
    opcode_base = 0x0600; // 0000 0110 ++-- ----
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            opcode = opcode_base | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;
            let mwith = new M68K_EA(mode, reg);
            bind(opcode | (0 << 6), M68K_MN.ADDI_B, mwith);
            bind(opcode | (1 << 6), M68K_MN.ADDI_W, mwith);
            bind(opcode | (2 << 6), M68K_MN.ADDI_L, mwith);
        }
    }

    // ADDQ
    opcode_base = 0x5000; // 0101 ---0 ++-- ----
    for (let data = 0; data < 8; data++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                opcode = opcode_base | (data << 9) | (mode << 3) | reg;
                if ((mode === 7) && (reg >= 2)) continue;

                let immediate = data ? data : 8;
                if (mode !== 1) {
                    let mwith = new M68K_EA(mode, reg);
                    bind(opcode | (0 << 6), M68K_MN.ADDQ_B_EA, immediate, mwith);
                    bind(opcode | (1 << 6), M68K_MN.ADDQ_W_EA, immediate, mwith);
                    bind(opcode | (2 << 6), M68K_MN.ADDQ_L_EA, immediate, mwith);
                } else {
                    let mwith = new M68K_AR(reg);
                    bind(opcode | (1 << 6), M68K_MN.ADDQ_W_AR, immediate, mwith);
                    bind(opcode | (2 << 6), M68K_MN.ADDQ_L_AR, immediate, mwith);
                }
            }
        }
    }

    // ADDX
    opcode_base = 0xD100;
    for (let xreg = 0; xreg < 8; xreg++) {
        for (let yreg = 0; yreg < 8; yreg++) {
            opcode = opcode_base | (xreg << 9) | yreg;

            let dataWith = new M68K_EA(M68K_AM.DataRegisterDirect, xreg);
            let dataFrom = new M68K_EA(M68K_AM.DataRegisterDirect, yreg);
            bind(opcode | (0 << 6) | (0 << 3), M68K_MN.ADDX_B, dataFrom, dataWith);
            bind(opcode | (1 << 6) | (0 << 3), M68K_MN.ADDX_W, dataFrom, dataWith);
            bind(opcode | (2 << 6) | (0 << 3), M68K_MN.ADDX_L, dataFrom, dataWith);

            let addressWith = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPreDecrement, xreg);
            let addressFrom = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPreDecrement, yreg);
            bind(opcode | (0 << 6) | (1 << 3), M68K_MN.ADDX_B, addressFrom, addressWith);
            bind(opcode | (1 << 6) | (1 << 3), M68K_MN.ADDX_W, addressFrom, addressWith);
            bind(opcode | (2 << 6) | (1 << 3), M68K_MN.ADDX_L, addressFrom, addressWith);
        }
    }

    // AND EA DR
    opcode_base = 0xC000; // 1100 ---0 ++-- ----
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                opcode = opcode_base | (dreg << 9) | (mode << 3) | reg;
                if ((mode === 1) || ((mode === 7) && (reg >= 5))) continue;

                let from = new M68K_EA(mode, reg);
                let mwith = new M68K_DR(dreg);
                bind(opcode | (0 << 6), M68K_MN.AND_B_EA_DR, from, mwith);
                bind(opcode | (1 << 6), M68K_MN.AND_W_EA_DR, from, mwith);
                bind(opcode | (2 << 6), M68K_MN.AND_L_EA_DR, from, mwith);
            }
        }
    }

    // AND DR EA
    opcode_base = 0xC100; // 1100 ---1 ++-- ----
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                opcode = opcode_base | (dreg << 9) | (mode << 3) | reg;
                if ((mode <= 1) || ((mode === 7) && (reg >= 2))) continue;

                let from = new M68K_DR(dreg);
                let mwith = new M68K_EA(mode, reg);
                bind(opcode | (0 << 6), M68K_MN.AND_B_DR_EA, from, mwith);
                bind(opcode | (1 << 6), M68K_MN.AND_W_DR_EA, from, mwith);
                bind(opcode | (2 << 6), M68K_MN.AND_L_DR_EA, from, mwith);
            }
        }
    }

    // ANDI
    opcode_base = 0x0200; // 0000 0010 ++-- ----
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            opcode = opcode_base | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

            let mwith = new M68K_EA(mode, reg);
            bind(opcode | (0 << 6), M68K_MN.ANDI_B, mwith);
            bind(opcode | (1 << 6), M68K_MN.ANDI_W, mwith);
            bind(opcode | (2 << 6), M68K_MN.ANDI_L, mwith);
        }
    }

    // ANDI_TO_CCR   0000 0010 0011 1100
    bind(0x023C, M68K_MN.ANDI_TO_CCR);

    // ANDI_TO_SR    0000 0010 0111 1100
    bind(0x027C, M68K_MN.ANDI_TO_SR);

    // ASL, ASR (immediate, register, EA)
    for (let reg1 = 0; reg1 < 8; reg1++) {
        for (let reg2 = 0; reg2 < 8; reg2++) {
            // ASL Immediate
            let opcode = 0xE100 | (reg1 << 9) | reg2;
            let count = reg1 ? reg1 : 8;
            let dr_with = new M68K_DR(reg2);
            bind(opcode | (0 << 6), M68K_MN.ASL_B_IMM, count, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ASL_W_IMM, count, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ASL_L_IMM, count, dr_with);

            // ASL register
            opcode = 0xE120 | (reg1 << 9) | reg2;
            let dr_from = new M68K_DR(reg1);
            dr_with = new M68K_DR(reg2);
            bind(opcode | (0 << 6), M68K_MN.ASL_B_REG, dr_from, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ASL_W_REG, dr_from, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ASL_L_REG, dr_from, dr_with);

            // ASL EA
            opcode = 0xE1C0 | (reg1 << 3) | reg2;
            if (!((reg1 <= 1) || ((reg1 === 7) && (reg2 >= 2)))) {
                let ea_with = new M68K_EA(reg1, reg2);
                bind(opcode, M68K_MN.ASL_EA, ea_with)
            }

            // ASR Immediate
            opcode = 0xE000 | (reg1 << 9) | reg2;
            count = reg1 ? reg1 : 8;
            dr_with = new M68K_DR(reg2);
            bind(opcode | (0 << 6), M68K_MN.ASR_B_IMM, count, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ASR_W_IMM, count, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ASR_L_IMM, count, dr_with);

            // ASR register
            opcode = 0xE020 | (reg1 << 9) | reg2;
            dr_from = new M68K_DR(reg1);
            dr_with = new M68K_DR(reg2);
            bind(opcode | (0 << 6), M68K_MN.ASR_B_REG, dr_from, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ASR_W_REG, dr_from, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ASR_L_REG, dr_from, dr_with);

            // ASR EA
            opcode = 0xE0C0 | (reg1 << 3) | reg2;
            if (!((reg1 <= 1) || ((reg1 === 7) && (reg2 >= 2)))) {
                let ea_with = new M68K_EA(reg1, reg2);
                bind(opcode, M68K_MN.ASR_EA, ea_with);
            }
        }
    }

    // BCC
    opcode_base = 0x6000;
    for (let test = 0; test < 16; test++) {
        for (let displacement = 0; displacement < 256; displacement++) {
            if (test <= 1) continue;
            opcode = opcode_base | (test << 8) | displacement;
            bind(opcode, M68K_MN.BCC, test, displacement);
        }
    }

    // BCHG reg, BCLR reg
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if ((mode === 1) || (((mode === 7) && (reg >= 2)))) continue;

                // BCHG reg
                let opcode = 0x0140 | (dreg << 9) | (mode << 3) | reg;
                let bit = new M68K_DR(reg);
                let mwith = new M68K_EA(mode, reg);
                if (mode === 0) bind(opcode, M68K_MN.BCHG_L_REG, bit, mwith);
                else bind(opcode, M68K_MN.BCHG_B_REG, bit, mwith);

                // BCLR reg
                opcode = 0x0180 | (dreg << 9) | (mode << 3) | reg;
                bit = new M68K_DR(reg);
                mwith = new M68K_EA(mode, reg);
                if (mode === 0) bind(opcode, M68K_MN.BCLR_L_REG, bit, mwith);
                else bind(opcode, M68K_MN.BCLR_B_REG, bit, mwith);
            }
        }
    }

    // BCHG immediate, BCLR immediate
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            // BCHG immediate
            let opcode = 0x0840 | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

            let ea_with = new M68K_EA(mode, reg);
            if (mode === 0) bind(opcode, M68K_MN.BCHG_L_IMM, ea_with);

            // BCLR immediate
            opcode = 0x0880 | (mode << 3) | reg;

            ea_with = new M68K_EA(mode, reg);
            if (mode === 0) bind(opcode, M68K_MN.BCLR_L_IMM, ea_with);
            else bind(opcode, M68K_MN.BCLR_B_IMM, ea_with);
        }
    }

    // BRA
    for (let displacement = 0; displacement < 256; displacement++) {
        let opcode = 0x6000 | displacement;
        bind(opcode, M68K_MN.BRA, displacement);
    }

    // BSET reg
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                let opcode = 0x01C0 | (dreg << 9) | (mode << 3) | reg;

                if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

                let bit = new M68K_DR(dreg);
                let ea_with = new M68K_EA(mode, reg);
                if (mode === 0) bind(opcode, M68K_MN.BSET_L_REG, bit, ea_with);
                else bind(opcode, M68K_MN.BSET_B_REG, bit, ea_with);
            }
        }
    }

    // BSET imm
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            let opcode = 0x08C0 | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

            let ea_with = new M68K_EA(mode, reg);
            if (mode === 0) bind(opcode, M68K_MN.BSET_L_IMM, ea_with);
            else bind(opcode, M68K_MN.BSET_B_IMM, ea_with);
        }
    }

    // BSR
    for (let displacement = 0; displacement < 256; displacement++) {
        let opcode = 0x6100 | displacement;
        bind(opcode, M68K_MN.BSR, displacement);
    }

    // BTST REG, CHK
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if ((mode === 1) || ((mode === 7) && (reg >= 5))) continue;

                // BTST REG
                let opcode = 0x0100 | (dreg << 9) | (mode << 3) | reg;
                let bit = new M68K_DR(dreg);
                let ea_with = new M68K_EA(mode, reg);
                if (mode === 0) bind(opcode, M68K_MN.BTST_L_REG, bit, ea_with);
                else bind(opcode, M68K_MN.BTST_B_REG, bit, ea_with);

                // CHK
                opcode = 0x4180 | (dreg << 9) | (mode << 3) | reg;
                let compare = new M68K_DR(dreg);
                let maximum = new M68K_EA(mode, reg);
                bind(opcode, M68K_MN.CHK, compare, maximum);
            }
        }
    }

    // BTST imm, CLR
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            // BTST imm
            let opcode = 0x0800 | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 4))) continue;

            let ea_with = new M68K_EA(mode, reg);
            if (mode === 0) bind(opcode, M68K_MN.BTST_L_IMM, ea_with);
            else bind(opcode, M68K_MN.BTST_B_IMM, ea_with);

            // CLR
            opcode = 0x4200 | (mode << 3) | reg;
            if ((mode === 7) && (reg >= 2)) continue;
            ea_with = new M68K_EA(mode, reg);
            bind(opcode | (0 << 6), M68K_MN.CLR_B, ea_with);
            bind(opcode | (1 << 6), M68K_MN.CLR_W, ea_with);
            bind(opcode | (2 << 6), M68K_MN.CLR_L, ea_with);
        }
    }

    // CMP
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                let opcode = 0xB000 | (dreg << 9) | (mode << 3) | reg
                if ((mode === 7) && (reg >= 5)) continue;

                let dr_with = new M68K_DR(dreg);
                let ea_from = new M68K_EA(mode, reg);
                if (mode !== 1) bind(opcode | (0 << 6), M68K_MN.CMP_B, ea_from, dr_with);
                bind(opcode | (1 << 6), M68K_MN.CMP_W, ea_from, dr_with);
                bind(opcode | (2 << 6), M68K_MN.CMP_L, ea_from, dr_with);
            }
        }
    }

    // CMPA B0C0
    for (let areg = 0; areg < 8; areg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                let opcode = 0xB0C0 | (areg << 9) | (mode << 3) | reg
                if ((mode === 7) && (reg >= 5)) continue;

                let ar_with = new M68K_AR(areg);
                let ea_from = new M68K_EA(mode, reg);
                bind(opcode | (0 << 8), M68K_MN.CMPA_W, ea_from, ar_with);
                bind(opcode | (1 << 8), M68K_MN.CMPA_L, ea_from, ar_with);
            }
        }
    }

    // CMPI, CMPM
    for (let reg1 = 0; reg1 < 8; reg1++) {
        for (let reg2 = 0; reg2 < 8; reg2++) {
            // CMPM
            let opcode = 0xB108 | (reg1 << 9) | reg2;
            let ea_with = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPostIncrement, reg1);
            let ea_from = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPostIncrement, reg2);
            bind(opcode | (0 << 6), M68K_MN.CMPM_B, ea_from, ea_with);
            bind(opcode | (1 << 6), M68K_MN.CMPM_W, ea_from, ea_with);
            bind(opcode | (2 << 6), M68K_MN.CMPM_L, ea_from, ea_with);

            // CMPI
            if ((reg1 === 1) || ((reg1 === 7) && (reg2 >= 2))) continue;
            opcode = 0x0C00 | (reg1 << 3) | reg2;
            ea_with = M68K_EA(reg1, reg2);
            bind(opcode | (0 << 6), M68K_MN.CMPI_B, ea_with);
            bind(opcode | (1 << 6), M68K_MN.CMPI_W, ea_with);
            bind(opcode | (2 << 6), M68K_MN.CMPI_L, ea_with);
        }
    }

    // DBCC
    for (let condition = 0; condition < 16; condition++) {
        for (let dreg = 0; dreg < 8; dreg++) {
            let opcode = 0x50C8 | (condition << 8) | dreg;

            let dr_with = new M68K_DR(dreg);
            bind(opcode, M68K_MN.DBCC, condition, dr_with);
        }
    }

    // DIVS, DIVU, EOR
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                //DIVS
                let opcode = 0x81C0 | (dreg << 9) | (mode << 3) | reg;
                if ((mode === 1) && ((mode === 7) && (reg >= 5))) continue;

                let dr_with = new M68K_DR(dreg);
                let ea_from = new M68K_EA(mode, reg);
                bind(opcode, M68K_MN.DIVS, ea_from, dr_with);

                // DIVU
                opcode = 0x80C0 | (dreg << 9) | (mode << 3) | reg;

                dr_with = new M68K_DR(dreg);
                ea_from = new M68K_EA(mode, reg)
                bind(opcode, M68K_MN.DIVU, ea_from, dr_with)

                // EOR
                if ((mode === 7) && (reg >= 2)) continue;
                opcode = 0xB100 | (dreg << 9) | (mode << 3) | reg;

                let dr_from = new M68K_DR(dreg);
                let ea_with = new M68K_EA(mode, reg);
                bind(opcode | (0 << 6), M68K_MN.EOR_B, dr_from, ea_with);
                bind(opcode | (1 << 6), M68K_MN.EOR_W, dr_from, ea_with);
                bind(opcode | (2 << 6), M68K_MN.EOR_L, dr_from, ea_with);
            }
        }
    }

    // EORI
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            let opcode = 0x0A00 | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

            let ea_with = new M68K_EA(mode, reg);
            bind(opcode | (0 << 6), M68K_MN.EORI_B, ea_with);
            bind(opcode | (1 << 6), M68K_MN.EORI_W, ea_with);
            bind(opcode | (2 << 6), M68K_MN.EORI_L, ea_with);
        }
    }

    bind(0x0A3C, M68K_MN.EORI_TO_CCR);
    bind(0x0A7C, M68K_MN.EORI_TO_SR);

    // EXG x3
    for (let xreg = 0; xreg < 8; xreg++) {
        for (let yreg = 0; yreg < 8; yreg++) {
            let opcode = 0xC140 | (xreg << 9) | yreg;

            let dr1 = new M68K_DR(xreg);
            let dr2 = new M68K_DR(yreg);
            bind(opcode, M68K_MN.EXG_DR_DR, dr1, dr2);

            opcode = 0xC148 | (xreg << 9) | yreg;
            let ar1 = new M68K_AR(xreg);
            let ar2 = new M68K_AR(yreg);
            bind(opcode, M68K_MN.EXG_AR_AR, ar1, ar2);

            opcode = 0xC188 | (xreg << 9) | yreg;
            dr1 = new M68K_DR(xreg);
            ar1 = new M68K_AR(yreg);
            bind(opcode, M68K_MN.EXG_DR_AR, dr1, ar1);
        }
    }

    for (let dreg = 0; dreg < 8; dreg++) {
        let opcode = 0x4880 | dreg;
        let dr_with = new M68K_DR(dreg);
        bind(opcode | (0 << 6), M68K_MN.EXT_W, dr_with);
        bind(opcode | (1 << 6), M68K_MN.EXT_L, dr_with);
    }

    bind(0x4AFC, M68K_MN.ILLEGAL, 0x4AFC);

    // JMP, JSR
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            if ((mode <= 1) || (mode === 3) || (mode === 4) | ((mode === 7) && (reg >= 4))) continue;

            // JMP
            opcode = 0x4EC0 | (mode << 3) | reg;
            let from = new M68K_EA(mode, reg);
            bind(opcode, M68K_MN.JMP, from);

            // JSR
            opcode = 0x4E80 | (mode << 3) | reg;
            from = new M68K_EA(mode, reg);
            bind(opcode, M68K_MN.JSR, from);
        }
    }

    // LEA
    for (let areg = 0; areg < 8; areg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                let opcode = 0x41C0 | (areg << 9) | (mode << 3) | reg;
                if ((mode <= 1) || (mode === 3) || (mode === 4) || ((mode === 7) && (reg >= 4))) continue;

                let ar_to = new M68K_AR(areg);
                let ea_from = new M68K_EA(mode, reg);
                bind(opcode, M68K_MN.LEA, ea_from, ar_to);
            }
        }
    }

    // LINK
    for (let areg = 0; areg < 8; areg++) {
        let opcode = 0x4E50 | areg;
        let ar_with = new M68K_AR(areg);
        bind(opcode, M68K_MN.LINK, ar_with);
    }

    // LSL immediate reg ea
    // LSR immediate reg ea
    for (let reg1 = 0; reg1 < 8; reg1++) {
        for (let reg2 = 0; reg2 < 8; reg2++) {
            // LSL immediate
            let opcode = 0xE108 | (reg1 << 9) | reg2;

            let count = reg1 ? reg1 : 8;
            let dr_with = new M68K_DR(reg2);
            bind(opcode | (0 << 6), M68K_MN.LSL_B_IMM, count, dr_with);
            bind(opcode | (1 << 6), M68K_MN.LSL_W_IMM, count, dr_with);
            bind(opcode | (2 << 6), M68K_MN.LSL_L_IMM, count, dr_with);

            // LSL register
            opcode = 0xE128 | (reg1 << 9) | reg2;

            let dr_from = new M68K_DR(reg1);
            dr_with = new M68K_DR(reg2);
            bind(opcode | (0 << 6), M68K_MN.LSL_B_REG, dr_from, dr_with);
            bind(opcode | (1 << 6), M68K_MN.LSL_W_REG, dr_from, dr_with);
            bind(opcode | (2 << 6), M68K_MN.LSL_L_REG, dr_from, dr_with);

            // LSR immediate
            opcode = 0xE008 | (reg1 << 9) | reg2;
            count = reg1 ? reg1 : 8;
            dr_with = new M68K_DR(reg2);
            bind(opcode | (0 << 6), M68K_MN.LSR_B_IMM, count, dr_with);
            bind(opcode | (1 << 6), M68K_MN.LSR_W_IMM, count, dr_with);
            bind(opcode | (2 << 6), M68K_MN.LSR_L_IMM, count, dr_with);

            // LSR register
            opcode = 0xE028 | (reg1 << 9) | reg2;
            dr_from = new M68K_DR(reg1);
            dr_with = new M68K_DR(reg2);
            bind(opcode | (0 << 6), M68K_MN.LSR_B_REG, dr_from, dr_with);
            bind(opcode | (1 << 6), M68K_MN.LSR_W_REG, dr_from, dr_with);
            bind(opcode | (2 << 6), M68K_MN.LSR_L_REG, dr_from, dr_with);

            // LSL EA
            opcode = 0xE3C0 | (reg1 << 3) | reg2;
            if ((reg1 <= 1) || ((reg1 === 7) && (reg2 >= 2))) continue;
            let ea_with = new M68K_EA(reg1, reg2);
            bind(opcode, M68K_MN.LSL_EA, ea_with);

            // LSR EA
            opcode = 0xE2C0 | (reg1 << 3) | reg2;

            ea_with = new M68K_EA(reg1, reg2);
            bind(opcode, M68K_MN.LSR_EA, ea_with);
        }
    }

    // MOVE
    for (let toReg = 0; toReg < 8; toReg++) {
        for (let toMode = 0; toMode < 8; toMode++) {
            for (let fromMode = 0; fromMode < 8; fromMode++) {
                for (let fromReg = 0; fromReg < 8; fromReg++) {
                    let opcode = 0x0000 | (toReg << 9) | (toMode << 6) | (fromMode << 3) | fromReg;
                    if ((toMode === 1) || ((toMode === 7) && (toReg >= 2))) continue;
                    if ((fromMode === 7) && (fromReg >= 5)) continue;

                    let ea_to = new M68K_EA(toMode, toReg);
                    let ea_from = new M68K_EA(fromMode, fromReg);
                    if (fromMode !== 1) bind(opcode | (1 << 12), M68K_MN.MOVE_B, ea_from, ea_to);
                    bind(opcode | (3 << 12), M68K_MN.MOVE_W, ea_from, ea_to);
                    bind(opcode | (2 << 12), M68K_MN.MOVE_L, ea_from, ea_to);
                }
            }
        }
    }

    // MOVEA
    for (let areg = 0; areg < 8; areg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                let opcode = 0x0040 | (areg << 9) | (mode << 3) | reg;
                if ((mode === 7) && (reg >= 5)) continue;

                let ar_to = new M68K_AR(areg);
                let ea_from = new M68K_EA(mode, reg);
                bind(opcode | (3 << 12), M68K_MN.MOVEA_W, ea_from, ar_to);
                bind(opcode | (2 << 12), M68K_MN.MOVEA_L, ea_from, ar_to);
            }
        }
    }

    // MOVEM
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            if ((mode <= 1) || ((mode === 7) && (reg >= 2))) continue;

            if (mode !== 3) {
                let opcode = 0x4880 | (mode << 3) | reg;
                let ea_to = new M68K_EA(mode, reg);
                bind(opcode | (0 << 6), M68K_MN.MOVEM_TO_MEM_W, ea_to);
                bind(opcode | (1 << 6), M68K_MN.MOVEM_TO_MEM_L, ea_to);
            }
            if (mode !== 4) {
                let opcode = 0x4C80 | (mode << 3) | reg;
                let ea_from = new M68K_EA(mode, reg);
                bind(opcode | (0 << 6), M68K_MN.MOVEM_TO_REG_W, ea_from);
                bind(opcode | (1 << 6), M68K_MN.MOVEM_TO_REG_L, ea_from);
            }
        }
    }

    // MOVEP
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let areg = 0; areg < 8; areg++) {
            let opcode = 0x0188 | (dreg << 9) | areg;
            let dr_from = new M68K_DR(dreg);
            let ea_to = new M68K_EA(M68K_AM.AddressRegisterIndirectWithDisplacement, areg);
            bind(opcode | (0 << 6), M68K_MN.MOVEP_W_DR_EA, dr_from, ea_to);
            bind(opcode | (1 << 6), M68K_MN.MOVEP_L_DR_EA, dr_from, ea_to);

            opcode = 0x0108 | (dreg << 9) | areg;

            let dr_to = new M68K_DR(dreg);
            let ea_from = new M68K_EA(M68K_AM.AddressRegisterIndirectWithDisplacement, areg);
            bind(opcode | (0 << 6), M68K_MN.MOVEP_W_EA_DR, ea_from, dr_to);
            bind(opcode | (0 << 6), M68K_MN.MOVEP_L_EA_DR, ea_from, dr_to);
        }
    }

    // MOVEQ
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let immediate = 0; immediate < 256; immediate++) {
            let opcode = 0x7000 | (dreg << 9) | immediate;

            let dr_to = new M68K_DR(dreg);
            bind(opcode, M68K_MN.MOVEQ, immediate, dr_to);
        }
    }

    // MOVE_FROM_SR, MOVE_TO_CCR, MOVE_TO_SR
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            if (mode === 1) continue;

            // MOVE_FROM_SR
            if (!((mode === 7) && (reg >= 2))) {
                let opcode = 0x40C0 | (mode << 3) | reg;
                let ea_to = new M68K_EA(mode, reg);
                bind(opcode, M68K_MN.MOVE_FROM_SR, ea_to);
            }

            // MOVE_TO_CCR
            if (!((mode === 7) && (reg >= 5))) {
                let opcode = 0x44C0 | (mode << 3) | reg;
                let ea_from = new M68K_EA(mode, reg);
                bind(opcode, M68K_MN.MOVE_TO_CCR, ea_from);
            }

            // MOVE_TO_SR
            if (!((mode === 7) && (reg >= 5))) {
                let opcode = 0x46C0 | (mode << 3) | reg;
                let ea_from = new M68K_EA(mode, reg);
                bind(opcode, M68K_MN.MOVE_TO_SR, ea_from);
            }
        }

        // MOVE_FROM_USP, MOVE_TO_USP
        for (let areg = 0; areg < 8; areg++) {
            // MOVE_FROM_USP
            let opcode = 0x4E68 | areg;
            let ar_to = new M68K_AR(areg);
            bind(opcode, M68K_MN.MOVE_FROM_USP, ar_to);

            // MOVE_TO_USP
            opcode = 0x4E60 | areg;
            let ar_from = new M68K_AR(areg);
            bind(opcode, M68K_MN.MOVE_TO_USP, ar_from);
        }
    }

    // MULS, MULU
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                // MULS
                let opcode = 0xC1C0 | (dreg << 9) | (mode << 3) | reg;
                if ((mode === 1) || ((mode === 7) && (reg >= 5))) continue;

                let dr_with = new M68K_DR(dreg);
                let ea_from = new M68K_EA(mode, reg);
                bind(opcode, M68K_MN.MULS, ea_from, dr_with);

                // MULU
                opcode = 0xC0C0 | (dreg << 9) | (mode << 3) | reg;
                dr_with = new M68K_DR(dreg);
                ea_from = new M68K_EA(mode, reg);
                bind(opcode, M68K_MN.MULU, ea_from, dr_with);
            }
        }
    }

    // NBCD, NEG, NEGX, NOT
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

            // NBCD
            let opcode = 0x4800 | (mode << 3) | reg;
            let ea_with = new M68K_EA(mode, reg);
            bind(opcode, M68K_MN.NBCD, ea_with);

            // NEG
            opcode = 0x4400 | (mode << 3) | reg;
            ea_with = new M68K_EA(mode, reg);
            bind(opcode | (0 << 6), M68K_MN.NEG_B, ea_with);
            bind(opcode | (1 << 6), M68K_MN.NEG_W, ea_with);
            bind(opcode | (2 << 6), M68K_MN.NEG_L, ea_with);

            // NEGX
            opcode = 0x4000 | (mode << 3) | reg;
            ea_with = new M68K_EA(mode, reg);
            bind(opcode | (0 << 6), M68K_MN.NEGX_B, ea_with);
            bind(opcode | (1 << 6), M68K_MN.NEGX_W, ea_with);
            bind(opcode | (2 << 6), M68K_MN.NEGX_L, ea_with);

            // NOT
            opcode = 0x4600 | (mode << 3) | reg;
            ea_with = new M68K_EA(mode, reg);
            bind(opcode | (0 << 6), M68K_MN.NOT_B, ea_with);
            bind(opcode | (1 << 6), M68K_MN.NOT_W, ea_with);
            bind(opcode | (2 << 6), M68K_MN.NOT_L, ea_with);
        }
    }

    bind(0x4E71, M68K_MN.NOP);

    // OR EA_DR and DR_EA
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1) continue;

                if (!((mode === 1) || ((mode === 7) && (reg >= 5)))) {
                    let opcode = 0x8000 | (dreg << 9) | (mode << 3) | reg;
                    let ea_from = new M68K_EA(mode, reg);
                    let dr_with = new M68K_DR(dreg);
                    bind(opcode | (0 << 6), M68K_MN.OR_B_EA_DR, ea_from, dr_with);
                    bind(opcode | (1 << 6), M68K_MN.OR_W_EA_DR, ea_from, dr_with);
                    bind(opcode | (2 << 6), M68K_MN.OR_L_EA_DR, ea_from, dr_with);
                }

                if (!((mode <= 1) || ((mode === 7) && (reg >= 2)))) {
                    let opcode = 0x8100 | (dreg << 9) | (mode << 3) | reg;
                    let dr_from = new M68K_DR(dreg);
                    let ea_with = new M68K_EA(mode, reg);
                    bind(opcode | (0 << 6), M68K_MN.OR_B_DR_EA, dr_from, ea_with);
                    bind(opcode | (1 << 6), M68K_MN.OR_W_DR_EA, dr_from, ea_with);
                    bind(opcode | (2 << 6), M68K_MN.OR_L_DR_EA, dr_from, ea_with);
                }
            }
        }
    }

    // ORI
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            let opcode = 0 | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

            let ea_with = new M68K_EA(mode, reg);
            bind(opcode | (0 << 6), M68K_MN.ORI_B, ea_with);
            bind(opcode | (1 << 6), M68K_MN.ORI_W, ea_with);
            bind(opcode | (2 << 6), M68K_MN.ORI_L, ea_with);
        }
    }

    bind(0x003C, M68K_MN.ORI_TO_CCR);
    bind(0x007C, M68K_MN.ORI_TO_SR);

    // PEA
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            let opcode = 0x4840 | (mode << 3) | reg;
            if ((mode <= 1) || (mode === 3) || (mode === 4) || ((mode === 7) && (reg >= 4))) continue;

            let ea_from = new M68K_EA(mode, reg);
            bind(opcode, M68K_MN.PEA, ea_from);
        }
    }

    bind(0x4E70, M68K_MN.RESET);

    // ROL IMM, ROR IMM, ROXL IMM, ROXR IMM
    for (let immediate = 0; immediate < 8; immediate++) {
        for (let dreg = 0; dreg < 8; dreg++) {
            let opcode = 0xE118 | (immediate << 9) | dreg;

            // ROL imm
            let count = immediate? immediate : 8;
            let dr_with = new M68K_DR(dreg);
            bind(opcode | (0 << 6), M68K_MN.ROL_B_IMM, count, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ROL_W_IMM, count, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ROL_L_IMM, count, dr_with);

            // ROR imm
            opcode = 0xE018 | (immediate << 9) | dreg;
            bind(opcode | (0 << 6), M68K_MN.ROR_B_IMM, count, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ROR_W_IMM, count, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ROR_L_IMM, count, dr_with);

            // ROXL imm
            opcode = 0xE110 | (immediate << 9) | dreg;
            bind(opcode | (0 << 6), M68K_MN.ROXL_B_IMM, count, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ROXL_W_IMM, count, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ROXL_L_IMM, count, dr_with);

            // ROXR imm
            opcode = 0xE010 | (immediate << 9) | dreg;
            bind(opcode | (0 << 6), M68K_MN.ROXR_B_IMM, count, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ROXR_W_IMM, count, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ROXR_L_IMM, count, dr_with);
        }
    }

    // ROL reg, ROR reg, ROXL reg, ROXR reg
    for (let sreg = 0; sreg < 8; sreg++) {
        for (let dreg = 0; dreg < 8; dreg++) {
            // ROL reg
            let opcode = 0xE138 | (sreg << 9) | dreg;

            let dr_from = new M68K_DR(sreg);
            let dr_with = new M68K_DR(dreg);
            bind(opcode | (0 << 6), M68K_MN.ROL_B_REG, dr_from, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ROL_W_REG, dr_from, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ROL_L_REG, dr_from, dr_with);

            // ROR reg
            opcode = 0xE038 | (sreg << 9) | dreg;
            bind(opcode | (0 << 6), M68K_MN.ROR_B_REG, dr_from, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ROR_W_REG, dr_from, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ROR_L_REG, dr_from, dr_with);

            // ROXL reg
            opcode = 0xE130 | (sreg << 9) | dreg;
            bind(opcode | (0 << 6), M68K_MN.ROXL_B_REG, dr_from, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ROXL_W_REG, dr_from, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ROXL_L_REG, dr_from, dr_with);

            // ROXR reg
            opcode = 0xE030 | (sreg << 9) | dreg;
            bind(opcode | (0 << 6), M68K_MN.ROXR_B_REG, dr_from, dr_with);
            bind(opcode | (1 << 6), M68K_MN.ROXR_W_REG, dr_from, dr_with);
            bind(opcode | (2 << 6), M68K_MN.ROXR_L_REG, dr_from, dr_with);
        }
    }

    // ROL EA, ROR EA, ROXL EA, ROXR EA
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            if ((mode <= 1) || ((mode === 7) && (reg >= 2))) continue;

            // ROL
            let opcode = 0xE7C0 | (mode << 3) | reg;
            let ea_with = new M68K_EA(mode, reg);
            bind(opcode, M68K_MN.ROL_EA, ea_with);

            // ROR
            opcode = 0xE6C0 | (mode << 3) | reg;
            bind(opcode, M68K_MN.ROR_EA, ea_with);

            // ROXL
            opcode = 0xE5C0 | (mode << 3) | reg;
            bind(opcode, M68K_MN.ROXL_EA, ea_with);

            // ROXR
            opcode = 0xE4C0 | (mode << 3) | reg;
            bind(opcode, M68K_MN.ROXR_EA, ea_with);
        }
    }

    bind(0x4E73, M68K_MN.RTE);
    bind(0x4E77, M68K_MN.RTR);
    bind(0x4E75, M68K_MN.RTS);

    // SBCD
    for (let treg = 0; treg < 8; treg++) {
        for (let sreg = 0; sreg < 8; sreg++) {
            let opcode = 0x8100 | (treg << 9) | sreg;

            let dataWith = new M68K_EA(M68K_AM.DataRegisterDirect, treg);
            let dataFrom = new M68K_EA(M68K_AM.DataRegisterDirect, sreg);
            bind(opcode | (0 << 3), M68K_MN.SBCD, dataFrom, dataWith);

            let addressWith = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPreDecrement, treg);
            let addressFrom = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPreDecrement, sreg);
            bind(opcode | (1 << 3), M68K_MN.SBCD, addressFrom, addressWith);
        }
    }

    // SCC
    for (let test = 0; test < 16; test++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                let opcode = 0x50C0 | (test << 8) | (mode << 3) | reg;
                if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

                let ea_to = new M68K_EA(mode, reg);
                bind(opcode, M68K_MN.SCC, test, ea_to);
            }
        }
    }

    bind(0x4E72, M68K_MN.STOP);
    //SUB EA_DR, SUB DR_EA
    for (let dreg = 0; dreg < 8; dreg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                let opcode = 0x9000 | (dreg << 9) | (mode << 3) | reg;
                if ((mode === 7) && (reg >= 5)) continue;

                let ea_from = new M68K_EA(mode, reg);
                let dr_to = new M68K_DR(dreg);
                if (mode !== 1) bind(opcode | (0 << 6), M68K_MN.SUB_B_EA_DR, ea_from, dr_to);
                bind(opcode | (1 << 6), M68K_MN.SUB_W_EA_DR, ea_from, dr_to);
                bind(opcode | (2 << 6), M68K_MN.SUB_L_EA_DR, ea_from, dr_to);

                opcode = 0x9100 | (dreg << 9) | (mode << 3) | reg;
                if ((mode <= 1) || ((mode === 7) && (reg >= 2))) continue;
                let dr_from = new M68K_DR(dreg);
                let ea_to = new M68K_EA(mode, reg);
                bind(opcode | (0 << 6), M68K_MN.SUB_B_DR_EA, dr_from, ea_to);
                bind(opcode | (1 << 6), M68K_MN.SUB_W_DR_EA, dr_from, ea_to);
                bind(opcode | (2 << 6), M68K_MN.SUB_L_DR_EA, dr_from, ea_to);
            }
        }
    }

    // SUBA
    for (let areg = 0; areg < 8; areg++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                let opcode = 0x90C0 | (areg << 9) | (mode << 3) | reg;
                if ((mode === 7) && (reg >= 5)) continue;

                let ar_to = new M68K_AR(areg);
                let ea_from = new M68K_EA(mode, reg);
                bind(opcode | (0 << 8), M68K_MN.SUBA_W, ea_from, ar_to);
                bind(opcode | (1 << 8), M68K_MN.SUBA_L, ea_from, ar_to);
            }
        }
    }

    // SUBI
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            let opcode = 0x0400 | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

            let ea_with = new M68K_EA(mode, reg);
            bind(opcode | (0 << 6), M68K_MN.SUBI_B, ea_with);
            bind(opcode | (1 << 6), M68K_MN.SUBI_W, ea_with);
            bind(opcode | (2 << 6), M68K_MN.SUBI_L, ea_with);
        }
    }

    // SUBQ
    for (let data = 0; data < 8; data++) {
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                let opcode = 0x5100 | (data << 9) | (mode << 3) | reg;
                if ((mode === 7) && (reg >= 2)) continue;

                let immediate = data ? data : 8;
                if (mode !== 1) {
                    let ea_with = new M68K_EA(mode, reg);
                    bind(opcode | (0 << 6), M68K_MN.SUBQ_B_IMM_EA, immediate, ea_with);
                    bind(opcode | (1 << 6), M68K_MN.SUBQ_W_IMM_EA, immediate, ea_with);
                    bind(opcode | (2 << 6), M68K_MN.SUBQ_L_IMM_EA, immediate, ea_with);
                } else {
                    let ar_with = new M68K_AR(reg);
                    bind(opcode | (1 << 6), M68K_MN.SUBQ_W_IMM_AR, immediate, ar_with);
                    bind(opcode | (2 << 6), M68K_MN.SUBQ_L_IMM_AR, immediate, ar_with);
                }
            }
        }
    }

    // SUBX
    for (let treg = 0; treg < 8; treg++) {
        for (let sreg = 0; sreg < 8; sreg++) {
            let opcode = 0x9100 | (treg << 9) | sreg;

            let dataWith = new M68K_EA(M68K_AM.DataRegisterDirect, treg);
            let dataFrom = new M68K_EA(M68K_AM.DataRegisterDirect, sreg);
            bind(opcode | (0 << 6) | (0 << 3), M68K_MN.SUBX_B, dataFrom, dataWith);
            bind(opcode | (1 << 6) | (0 << 3), M68K_MN.SUBX_W, dataFrom, dataWith);
            bind(opcode | (2 << 6) | (0 << 3), M68K_MN.SUBX_L, dataFrom, dataWith);

            let addressWith = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPreDecrement, treg);
            let addressFrom = new M68K_EA(M68K_AM.AddressRegisterIndirectWithPreDecrement, sreg);
            bind (opcode | (0 << 6) | (1 << 3), M68K_MN.SUBX_B, addressFrom, addressWith);
            bind (opcode | (1 << 6) | (1 << 3), M68K_MN.SUBX_W, addressFrom, addressWith);
            bind (opcode | (2 << 6) | (1 << 3), M68K_MN.SUBX_L, addressFrom, addressWith);
        }
    }

    // SWAP
    for (let dreg = 0; dreg < 8; dreg++) {
        let opcode = 0x4840 | dreg;
        let dr_with = new M68K_DR(dreg);
        bind(opcode, M68K_MN.SWAP, dr_with);
    }

    // TAS
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            let opcode = 0x4AC0 | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

            let ea_with = new M68K_EA(mode, reg);
            bind(opcode, M68K_MN.TAS, ea_with);
        }
    }

    // TRAP
    for (let vector = 0; vector < 16; vector++) {
        let opcode = 0x4E40 | vector;
        bind(opcode, M68K_MN.TRAP, vector);
    }

    // TRAPV
    bind(0x4E76, M68K_MN.TRAPV);

    // TST
    for (let mode = 0; mode < 8; mode++) {
        for (let reg = 0; reg < 8; reg++) {
            let opcode = 0x4A00 | (mode << 3) | reg;
            if ((mode === 1) || ((mode === 7) && (reg >= 2))) continue;

            let ea_from = new M68K_EA(mode, reg);
            if (mode !== 1) bind(opcode | (0 << 6), M68K_MN.TST_B, ea_from);
            bind(opcode | (1 << 6), M68K_MN.TST_W, ea_from);
            bind(opcode | (2 << 6), M68K_MN.TST_L, ea_from);
        }
    }

    // UNLK
    for (let areg = 0; areg < 8; areg++) {
        let opcode = 0x4E58 | areg;
        let ar_with = new M68K_AR(areg);
        bind(opcode, M68K_MN.UNLK, ar_with);
    }

    for (let opc = 0; opc < 65536; opc++) {
        if (typeof table[opc] === 'undefined') {
            bind(opc, M68K_MN.ILLEGAL, opc);
        }
    }
}


/* So...This just takes a string and does 1 or 0 if it is 1 or 0
   and then does 0 if it's anything other than a space
 */
function M68K_test(s, sum, i=0) {
    if (i === 16) return sum;
    return (
     (s[i] === '0' || s[i] === '1') ? M68K_test(s, (sum << 1) | ((s[i] === '0') ? 0 : 1), i+1) :
         (s[i] === ' ' || s[i] === '_') ? M68K_test(s, sum, i+1) :
             M68K_test(s, sum << 1, i + 1)
    );
}