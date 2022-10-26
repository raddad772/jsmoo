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
    let per_line = 4;
    let mn = 'const M68K_MN = Object.freeze({';
    let mn_r = 'const M68K_MN_R = Object.freeze({';
    let cnt = 0;
    let on_line = 0;
    for (let i in M68K_MN_LIST) {
        if (on_line === 0) {
            mn += '\n    ';
            mn_r += '\n    ';
        }
        mn += M68K_MN_LIST[i] + ': ' + cnt + ', ';
        mn_r += cnt + ": '" + M68K_MN_LIST[i] + "', ";
        on_line++;
        if (on_line > per_line) on_line = 0;

        cnt++;
    }
    return mn + '\n});\n\n' + mn_r + '\n});\n';
}
console.log(m68k_mn_gen());*/


const M68K_MN = Object.freeze({
    ABCD: 0, ADD: 1, ADD_B_EA_DR: 2, ADD_W_EA_DR: 3, ADD_L_EA_DR: 4,
    ADD_B_DR_EA: 5, ADD_W_DR_EA: 6, ADD_L_DR_EA: 7, ADDA: 8, ADDA_W: 9,
    ADDA_L: 10, ADDI: 11, ADDI_B: 12, ADDI_W: 13, ADDI_L: 14,
    ADDQ: 15, ADDQ_B_EA: 16, ADDQ_W_EA: 17, ADDQ_L_EA: 18, ADDQ_W_AR: 19,
    ADDQ_L_AR: 20, ADDX: 21, ADDX_B: 22, ADDX_W: 23, ADDX_L: 24,
    AND: 25, AND_B_EA_DR: 26, AND_W_EA_DR: 27, AND_L_EA_DR: 28, AND_B_DR_EA: 29,
    AND_W_DR_EA: 30, AND_L_DR_EA: 31, ANDI: 32, ANDI_B: 33, ANDI_W: 34,
    ANDI_L: 35, ANDI_TO_CCR: 36, ANDI_TO_SR: 37, ASL: 38, ASL_B_IMM: 39,
    ASL_W_IMM: 40, ASL_L_IMM: 41, ASL_B_REG: 42, ASL_W_REG: 43, ASL_L_REG: 44,
    ASL_EA: 45, ASR: 46, ASR_B_IMM: 47, ASR_W_IMM: 48, ASR_L_IMM: 49,
    ASR_B_REG: 50, ASR_W_REG: 51, ASR_L_REG: 52, ASR_EA: 53, BCC: 54,
    BCHG: 55, BCHG_B_REG: 56, BCHG_L_REG: 57, BCHG_B_IMM: 58, BCHG_L_IMM: 59,
    BCLR: 60, BCLR_B_REG: 61, BCLR_L_REG: 62, BCLR_B_IMM: 63, BCLR_L_IMM: 64,
    BRA: 65, BSET: 66, BSET_B_REG: 67, BSET_L_REG: 68, BSET_B_IMM: 69,
    BSET_L_IMM: 70, BSR: 71, BTST: 72, BTST_B_REG: 73, BTST_L_REG: 74,
    BTST_B_IMM: 75, BTST_L_IMM: 76, CHK: 77, CLR: 78, CLR_B: 79,
    CLR_W: 80, CLR_L: 81, CMP: 82, CMP_B: 83, CMP_W: 84,
    CMP_L: 85, CMPA: 86, CMPA_W: 87, CMPA_L: 88, CMPI: 89,
    CMPI_B: 90, CMPI_W: 91, CMPI_L: 92, CMPM: 93, CMPM_B: 94,
    CMPM_W: 95, CMPM_L: 96, DBCC: 97, DIVS: 98, DIVU: 99,
    EOR: 100, EOR_B: 101, EOR_W: 102, EOR_L: 103, EORI: 104,
    EORI_B: 105, EORI_W: 106, EORI_L: 107, EORI_TO_CCR: 108, EORI_TO_SR: 109,
    EXG: 110, EXG_DR_DR: 111, EXG_AR_AR: 112, EXG_DR_AR: 113, EXT: 114,
    EXT_W: 115, EXT_L: 116, ILLEGAL: 117, JMP: 118, JSR: 119,
    LEA: 120, LINK: 121, LSL: 122, LSL_B_IMM: 123, LSL_W_IMM: 124,
    LSL_L_IMM: 125, LSL_B_REG: 126, LSL_W_REG: 127, LSL_L_REG: 128, LSL_EA: 129,
    LSR: 130, LSR_B_IMM: 131, LSR_W_IMM: 132, LSR_L_IMM: 133, LSR_B_REG: 134,
    LSR_W_REG: 135, LSR_L_REG: 136, LSR_EA: 137, MOVE: 138, MOVE_B: 139,
    MOVE_W: 140, MOVE_L: 141, MOVEA: 142, MOVEA_W: 143, MOVEA_L: 144,
    MOVE_FROM_SR: 145, MOVE_TO_CCR: 146, MOVE_TO_SR: 147, MOVE_FROM_USP: 148, MOVE_TO_USP: 149,
    MOVEM: 150, MOVEM_TO_MEM_W: 151, MOVEM_TO_MEM_L: 152, MOVEM_TO_REG_W: 153, MOVEM_TO_REG_L: 154,
    MOVEP: 155, MOVEP_W_DR_EA: 156, MOVEP_L_DR_EA: 157, MOVEP_W_EA_DR: 158, MOVEP_L_EA_DR: 159,
    MOVEQ: 160, MULS: 161, MULU: 162, NBCD: 163, NEG: 164,
    NEG_B: 165, NEG_W: 166, NEG_L: 167, NEGX: 168, NEGX_B: 169,
    NEGX_W: 170, NEGX_L: 171, NOP: 172, NOT: 173, NOT_B: 174,
    NOT_W: 175, NOT_L: 176, OR: 177, OR_B_EA_DR: 178, OR_W_EA_DR: 179,
    OR_L_EA_DR: 180, OR_B_DR_EA: 181, OR_W_DR_EA: 182, OR_L_DR_EA: 183, ORI: 184,
    ORI_B: 185, ORI_W: 186, ORI_L: 187, ORI_TO_CCR: 188, ORI_TO_SR: 189,
    PEA: 190, RESET: 191, ROL: 192, ROL_B_IMM: 193, ROL_W_IMM: 194,
    ROL_L_IMM: 195, ROL_B_REG: 196, ROL_W_REG: 197, ROL_L_REG: 198, ROL_EA: 199,
    ROR: 200, ROR_B_IMM: 201, ROR_W_IMM: 202, ROR_L_IMM: 203, ROR_B_REG: 204,
    ROR_W_REG: 205, ROR_L_REG: 206, ROR_EA: 207, ROXL: 208, ROXL_B_IMM: 209,
    ROXL_W_IMM: 210, ROXL_L_IMM: 211, ROXL_B_REG: 212, ROXL_W_REG: 213, ROXL_L_REG: 214,
    ROXL_EA: 215, ROXR: 216, ROXR_B_IMM: 217, ROXR_W_IMM: 218, ROXR_L_IMM: 219,
    ROXR_B_REG: 220, ROXR_W_REG: 221, ROXR_L_REG: 222, ROXR_EA: 223, RTE: 224,
    RTR: 225, RTS: 226, SBCD: 227, SCC: 228, STOP: 229,
    SUB: 230, SUB_B_EA_DR: 231, SUB_W_EA_DR: 232, SUB_L_EA_DR: 233, SUB_B_DR_EA: 234,
    SUB_W_DR_EA: 235, SUB_L_DR_EA: 236, SUBA: 237, SUBA_W: 238, SUBA_L: 239,
    SUBI: 240, SUBI_B: 241, SUBI_W: 242, SUBI_L: 243, SUBQ: 244,
    SUBQ_B_IMM_EA: 245, SUBQ_W_IMM_EA: 246, SUBQ_L_IMM_EA: 247, SUBQ_W_IMM_AR: 248, SUBQ_L_IMM_AR: 249,
    SUBX: 250, SUBX_B: 251, SUBX_W: 252, SUBX_L: 253, SWAP: 254,
    TAS: 255, TRAP: 256, TRAPV: 257, TST: 258, TST_B: 259,
    TST_W: 260, TST_L: 261, UNLK: 262, });

const M68K_MN_R = Object.freeze({
    0: 'ABCD', 1: 'ADD', 2: 'ADD_B_EA_DR', 3: 'ADD_W_EA_DR', 4: 'ADD_L_EA_DR',
    5: 'ADD_B_DR_EA', 6: 'ADD_W_DR_EA', 7: 'ADD_L_DR_EA', 8: 'ADDA', 9: 'ADDA_W',
    10: 'ADDA_L', 11: 'ADDI', 12: 'ADDI_B', 13: 'ADDI_W', 14: 'ADDI_L',
    15: 'ADDQ', 16: 'ADDQ_B_EA', 17: 'ADDQ_W_EA', 18: 'ADDQ_L_EA', 19: 'ADDQ_W_AR',
    20: 'ADDQ_L_AR', 21: 'ADDX', 22: 'ADDX_B', 23: 'ADDX_W', 24: 'ADDX_L',
    25: 'AND', 26: 'AND_B_EA_DR', 27: 'AND_W_EA_DR', 28: 'AND_L_EA_DR', 29: 'AND_B_DR_EA',
    30: 'AND_W_DR_EA', 31: 'AND_L_DR_EA', 32: 'ANDI', 33: 'ANDI_B', 34: 'ANDI_W',
    35: 'ANDI_L', 36: 'ANDI_TO_CCR', 37: 'ANDI_TO_SR', 38: 'ASL', 39: 'ASL_B_IMM',
    40: 'ASL_W_IMM', 41: 'ASL_L_IMM', 42: 'ASL_B_REG', 43: 'ASL_W_REG', 44: 'ASL_L_REG',
    45: 'ASL_EA', 46: 'ASR', 47: 'ASR_B_IMM', 48: 'ASR_W_IMM', 49: 'ASR_L_IMM',
    50: 'ASR_B_REG', 51: 'ASR_W_REG', 52: 'ASR_L_REG', 53: 'ASR_EA', 54: 'BCC',
    55: 'BCHG', 56: 'BCHG_B_REG', 57: 'BCHG_L_REG', 58: 'BCHG_B_IMM', 59: 'BCHG_L_IMM',
    60: 'BCLR', 61: 'BCLR_B_REG', 62: 'BCLR_L_REG', 63: 'BCLR_B_IMM', 64: 'BCLR_L_IMM',
    65: 'BRA', 66: 'BSET', 67: 'BSET_B_REG', 68: 'BSET_L_REG', 69: 'BSET_B_IMM',
    70: 'BSET_L_IMM', 71: 'BSR', 72: 'BTST', 73: 'BTST_B_REG', 74: 'BTST_L_REG',
    75: 'BTST_B_IMM', 76: 'BTST_L_IMM', 77: 'CHK', 78: 'CLR', 79: 'CLR_B',
    80: 'CLR_W', 81: 'CLR_L', 82: 'CMP', 83: 'CMP_B', 84: 'CMP_W',
    85: 'CMP_L', 86: 'CMPA', 87: 'CMPA_W', 88: 'CMPA_L', 89: 'CMPI',
    90: 'CMPI_B', 91: 'CMPI_W', 92: 'CMPI_L', 93: 'CMPM', 94: 'CMPM_B',
    95: 'CMPM_W', 96: 'CMPM_L', 97: 'DBCC', 98: 'DIVS', 99: 'DIVU',
    100: 'EOR', 101: 'EOR_B', 102: 'EOR_W', 103: 'EOR_L', 104: 'EORI',
    105: 'EORI_B', 106: 'EORI_W', 107: 'EORI_L', 108: 'EORI_TO_CCR', 109: 'EORI_TO_SR',
    110: 'EXG', 111: 'EXG_DR_DR', 112: 'EXG_AR_AR', 113: 'EXG_DR_AR', 114: 'EXT',
    115: 'EXT_W', 116: 'EXT_L', 117: 'ILLEGAL', 118: 'JMP', 119: 'JSR',
    120: 'LEA', 121: 'LINK', 122: 'LSL', 123: 'LSL_B_IMM', 124: 'LSL_W_IMM',
    125: 'LSL_L_IMM', 126: 'LSL_B_REG', 127: 'LSL_W_REG', 128: 'LSL_L_REG', 129: 'LSL_EA',
    130: 'LSR', 131: 'LSR_B_IMM', 132: 'LSR_W_IMM', 133: 'LSR_L_IMM', 134: 'LSR_B_REG',
    135: 'LSR_W_REG', 136: 'LSR_L_REG', 137: 'LSR_EA', 138: 'MOVE', 139: 'MOVE_B',
    140: 'MOVE_W', 141: 'MOVE_L', 142: 'MOVEA', 143: 'MOVEA_W', 144: 'MOVEA_L',
    145: 'MOVE_FROM_SR', 146: 'MOVE_TO_CCR', 147: 'MOVE_TO_SR', 148: 'MOVE_FROM_USP', 149: 'MOVE_TO_USP',
    150: 'MOVEM', 151: 'MOVEM_TO_MEM_W', 152: 'MOVEM_TO_MEM_L', 153: 'MOVEM_TO_REG_W', 154: 'MOVEM_TO_REG_L',
    155: 'MOVEP', 156: 'MOVEP_W_DR_EA', 157: 'MOVEP_L_DR_EA', 158: 'MOVEP_W_EA_DR', 159: 'MOVEP_L_EA_DR',
    160: 'MOVEQ', 161: 'MULS', 162: 'MULU', 163: 'NBCD', 164: 'NEG',
    165: 'NEG_B', 166: 'NEG_W', 167: 'NEG_L', 168: 'NEGX', 169: 'NEGX_B',
    170: 'NEGX_W', 171: 'NEGX_L', 172: 'NOP', 173: 'NOT', 174: 'NOT_B',
    175: 'NOT_W', 176: 'NOT_L', 177: 'OR', 178: 'OR_B_EA_DR', 179: 'OR_W_EA_DR',
    180: 'OR_L_EA_DR', 181: 'OR_B_DR_EA', 182: 'OR_W_DR_EA', 183: 'OR_L_DR_EA', 184: 'ORI',
    185: 'ORI_B', 186: 'ORI_W', 187: 'ORI_L', 188: 'ORI_TO_CCR', 189: 'ORI_TO_SR',
    190: 'PEA', 191: 'RESET', 192: 'ROL', 193: 'ROL_B_IMM', 194: 'ROL_W_IMM',
    195: 'ROL_L_IMM', 196: 'ROL_B_REG', 197: 'ROL_W_REG', 198: 'ROL_L_REG', 199: 'ROL_EA',
    200: 'ROR', 201: 'ROR_B_IMM', 202: 'ROR_W_IMM', 203: 'ROR_L_IMM', 204: 'ROR_B_REG',
    205: 'ROR_W_REG', 206: 'ROR_L_REG', 207: 'ROR_EA', 208: 'ROXL', 209: 'ROXL_B_IMM',
    210: 'ROXL_W_IMM', 211: 'ROXL_L_IMM', 212: 'ROXL_B_REG', 213: 'ROXL_W_REG', 214: 'ROXL_L_REG',
    215: 'ROXL_EA', 216: 'ROXR', 217: 'ROXR_B_IMM', 218: 'ROXR_W_IMM', 219: 'ROXR_L_IMM',
    220: 'ROXR_B_REG', 221: 'ROXR_W_REG', 222: 'ROXR_L_REG', 223: 'ROXR_EA', 224: 'RTE',
    225: 'RTR', 226: 'RTS', 227: 'SBCD', 228: 'SCC', 229: 'STOP',
    230: 'SUB', 231: 'SUB_B_EA_DR', 232: 'SUB_W_EA_DR', 233: 'SUB_L_EA_DR', 234: 'SUB_B_DR_EA',
    235: 'SUB_W_DR_EA', 236: 'SUB_L_DR_EA', 237: 'SUBA', 238: 'SUBA_W', 239: 'SUBA_L',
    240: 'SUBI', 241: 'SUBI_B', 242: 'SUBI_W', 243: 'SUBI_L', 244: 'SUBQ',
    245: 'SUBQ_B_IMM_EA', 246: 'SUBQ_W_IMM_EA', 247: 'SUBQ_L_IMM_EA', 248: 'SUBQ_W_IMM_AR', 249: 'SUBQ_L_IMM_AR',
    250: 'SUBX', 251: 'SUBX_B', 252: 'SUBX_W', 253: 'SUBX_L', 254: 'SWAP',
    255: 'TAS', 256: 'TRAP', 257: 'TRAPV', 258: 'TST', 259: 'TST_B',
    260: 'TST_W', 261: 'TST_L', 262: 'UNLK',
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

