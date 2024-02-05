"use strict";

const SM83_MN_LIST = Object.freeze([
    'NONE',
    'ADC_di_da', 'ADC_di_di', 'ADC_di_ind',
    'ADD_di_da', 'ADD_di_di', 'ADD16_di_di', 'ADD_di_ind', 'ADD_di_rel',
    'AND_di_da', 'AND_di_di', 'AND_di_ind', 
    'BIT_idx_di', 'BIT_idx_ind', 
    'CALL_cond_addr', 
    'CCF', 
    'CP_di_da', 'CP_di_di', 'CP_di_ind', 
    'CPL', 
    'DAA', 
    'DEC_di', 'DEC16_di', 'DEC_ind',
    'DI', 'EI', 
    'HALT', 
    'INC_di', 'INC16_di', 'INC_ind',
    'JP_cond_addr', 'JP_di', 'JR_cond_rel', 
    'LD_addr_di', 'LD16_addr_di', 'LD_di_addr', 'LD_di_da',
    'LD16_di_da', 'LD_di_di', 'LD16_di_di', 'LD_di_di_rel',
    'LD_di_ind', 'LD_di_ind_dec', 'LD_di_ind_inc', 'LD_ind_da', 
    'LD_ind_di', 'LD_ind_dec_di', 'LD_ind_inc_di', 
    'LDH_addr_di', 'LDH_di_addr', 'LDH_di_ind', 'LDH_ind_di', 
    'NOP', 
    'OR_di_da', 'OR_di_di', 'OR_di_ind', 
    'POP_di', 'POP_di_AF', 
    'PUSH_di', 
    'RES_idx_di', 'RES_idx_ind', 
    'RET', 'RET_cond', 
    'RETI', 
    'RL_di', 'RL_ind', 
    'RLA', 
    'RLC_di', 'RLC_ind', 
    'RLCA', 
    'RR_di', 'RR_ind', 
    'RRA', 
    'RRC_di', 'RRC_ind', 
    'RRCA', 
    'RST_imp', 
    'SBC_di_da', 'SBC_di_di', 'SBC_di_ind', 
    'SCF', 
    'SET_idx_di', 'SET_idx_ind', 
    'SLA_di', 'SLA_ind', 
    'SRA_di', 'SRA_ind', 
    'SRL_di', 'SRL_ind', 
    'SUB_di_da', 'SUB_di_di', 'SUB_di_ind', 
    'SWAP_di', 'SWAP_ind', 
    'STOP', 
    'XOR_di_da', 'XOR_di_di', 'XOR_di_ind',
    'RESET', 'S_IRQ'
]);

function sm83_mn_gen() {
    let per_line = 4;
    let mn = 'const SM83_MN = Object.freeze({';
    let mn_r = 'const SM83_MN_R = Object.freeze({';
    let cnt = 0;
    let on_line = 0;
    for (let i in SM83_MN_LIST) {
        if (on_line === 0) {
            mn += '\n    ';
            mn_r += '\n    ';
        }
        mn += SM83_MN_LIST[i] + ': ' + cnt + ', ';
        mn_r += cnt + ": '" + SM83_MN_LIST[i] + "', ";
        on_line++;
        if (on_line > per_line) on_line = 0;

        cnt++;
    }
    return mn + '\n});\n\n' + mn_r + '\n});\n';
}

//console.log(sm83_mn_gen());
function sm83_mn_gen_as() {
    let mn = 'export enum SM83_MN {\n';
    let mn_r = 'export var SM83_MN_R: Map<u32, string> = new Map<u32, string>();\n';
    let cnt = 0;
    for (let i in SM83_MN_LIST) {
        mn += '    ' + SM83_MN_LIST[i] + ' = ' + i.toString() + ',\n';
        mn_r += 'SM83_MN_R.set(' + cnt + ", '" + SM83_MN_LIST[i] + "');\n";
        cnt++;
    }
    return mn + '}\n\n' + mn_r + '\n\n';

}
//console.log(sm83_mn_gen_as());

const SM83_MN = Object.freeze({
    NONE: 0, ADC_di_da: 1, ADC_di_di: 2, ADC_di_ind: 3, ADD_di_da: 4,
    ADD_di_di: 5, ADD16_di_di: 6, ADD_di_ind: 7, ADD_di_rel: 8, AND_di_da: 9,
    AND_di_di: 10, AND_di_ind: 11, BIT_idx_di: 12, BIT_idx_ind: 13, CALL_cond_addr: 14,
    CCF: 15, CP_di_da: 16, CP_di_di: 17, CP_di_ind: 18, CPL: 19,
    DAA: 20, DEC_di: 21, DEC16_di: 22, DEC_ind: 23, DI: 24,
    EI: 25, HALT: 26, INC_di: 27, INC16_di: 28, INC_ind: 29,
    JP_cond_addr: 30, JP_di: 31, JR_cond_rel: 32, LD_addr_di: 33, LD16_addr_di: 34,
    LD_di_addr: 35, LD_di_da: 36, LD16_di_da: 37, LD_di_di: 38, LD16_di_di: 39,
    LD_di_di_rel: 40, LD_di_ind: 41, LD_di_ind_dec: 42, LD_di_ind_inc: 43, LD_ind_da: 44,
    LD_ind_di: 45, LD_ind_dec_di: 46, LD_ind_inc_di: 47, LDH_addr_di: 48, LDH_di_addr: 49,
    LDH_di_ind: 50, LDH_ind_di: 51, NOP: 52, OR_di_da: 53, OR_di_di: 54,
    OR_di_ind: 55, POP_di: 56, POP_di_AF: 57, PUSH_di: 58, RES_idx_di: 59,
    RES_idx_ind: 60, RET: 61, RET_cond: 62, RETI: 63, RL_di: 64,
    RL_ind: 65, RLA: 66, RLC_di: 67, RLC_ind: 68, RLCA: 69,
    RR_di: 70, RR_ind: 71, RRA: 72, RRC_di: 73, RRC_ind: 74,
    RRCA: 75, RST_imp: 76, SBC_di_da: 77, SBC_di_di: 78, SBC_di_ind: 79,
    SCF: 80, SET_idx_di: 81, SET_idx_ind: 82, SLA_di: 83, SLA_ind: 84,
    SRA_di: 85, SRA_ind: 86, SRL_di: 87, SRL_ind: 88, SUB_di_da: 89,
    SUB_di_di: 90, SUB_di_ind: 91, SWAP_di: 92, SWAP_ind: 93, STOP: 94,
    XOR_di_da: 95, XOR_di_di: 96, XOR_di_ind: 97, RESET: 98, S_IRQ: 99,
});

const SM83_MN_R = Object.freeze({
    0: 'NONE', 1: 'ADC_di_da', 2: 'ADC_di_di', 3: 'ADC_di_ind', 4: 'ADD_di_da',
    5: 'ADD_di_di', 6: 'ADD16_di_di', 7: 'ADD_di_ind', 8: 'ADD_di_rel', 9: 'AND_di_da',
    10: 'AND_di_di', 11: 'AND_di_ind', 12: 'BIT_idx_di', 13: 'BIT_idx_ind', 14: 'CALL_cond_addr',
    15: 'CCF', 16: 'CP_di_da', 17: 'CP_di_di', 18: 'CP_di_ind', 19: 'CPL',
    20: 'DAA', 21: 'DEC_di', 22: 'DEC16_di', 23: 'DEC_ind', 24: 'DI',
    25: 'EI', 26: 'HALT', 27: 'INC_di', 28: 'INC16_di', 29: 'INC_ind',
    30: 'JP_cond_addr', 31: 'JP_di', 32: 'JR_cond_rel', 33: 'LD_addr_di', 34: 'LD16_addr_di',
    35: 'LD_di_addr', 36: 'LD_di_da', 37: 'LD16_di_da', 38: 'LD_di_di', 39: 'LD16_di_di',
    40: 'LD_di_di_rel', 41: 'LD_di_ind', 42: 'LD_di_ind_dec', 43: 'LD_di_ind_inc', 44: 'LD_ind_da',
    45: 'LD_ind_di', 46: 'LD_ind_dec_di', 47: 'LD_ind_inc_di', 48: 'LDH_addr_di', 49: 'LDH_di_addr',
    50: 'LDH_di_ind', 51: 'LDH_ind_di', 52: 'NOP', 53: 'OR_di_da', 54: 'OR_di_di',
    55: 'OR_di_ind', 56: 'POP_di', 57: 'POP_di_AF', 58: 'PUSH_di', 59: 'RES_idx_di',
    60: 'RES_idx_ind', 61: 'RET', 62: 'RET_cond', 63: 'RETI', 64: 'RL_di',
    65: 'RL_ind', 66: 'RLA', 67: 'RLC_di', 68: 'RLC_ind', 69: 'RLCA',
    70: 'RR_di', 71: 'RR_ind', 72: 'RRA', 73: 'RRC_di', 74: 'RRC_ind',
    75: 'RRCA', 76: 'RST_imp', 77: 'SBC_di_da', 78: 'SBC_di_di', 79: 'SBC_di_ind',
    80: 'SCF', 81: 'SET_idx_di', 82: 'SET_idx_ind', 83: 'SLA_di', 84: 'SLA_ind',
    85: 'SRA_di', 86: 'SRA_ind', 87: 'SRL_di', 88: 'SRL_ind', 89: 'SUB_di_da',
    90: 'SUB_di_di', 91: 'SUB_di_ind', 92: 'SWAP_di', 93: 'SWAP_ind', 94: 'STOP',
    95: 'XOR_di_da', 96: 'XOR_di_di', 97: 'XOR_di_ind', 98: 'RESET', 99: 'S_IRQ',
});

/*function SM83_generate_opcode_matrix()
{
    let outstr = 'const SM83_opcode_matrix = Object.freeze({\n';
    for (let i = 0; i <= 0xFF; i++) {
        outstr += '    ' + hex0x2(i) + ': new SM83_opcode_info(' + hex0x2(i) + ', SM83_MN.),\n'
    }
    outstr += '});'
    return outstr;
}

console.log(SM83_generate_opcode_matrix());*/


/*function SM83_generate_opcode_matrixCB()
{
    let outstr = 'const SM83_opcode_matrix = Object.freeze({\n';
    for (let i = 0; i <= 0xFF; i++) {
        outstr += '    ' + hex0x2(i) + ': new SM83_opcode_info(' + hex0x2(i) + ', SM83_MN.),\n'
    }

    outstr += '});'
    return outstr;
}

console.log(SM83_generate_opcode_matrixCB());*/

class SM83_opcode_info {
    constructor(opcode, ins, arg1=null, arg2=null) {
        this.opcode = opcode;
        this.ins = ins;
        this.arg1 = arg1;
        this.arg2 = arg2;
    }
}

const SM83_S_RESET = 0x101;
const SM83_S_IRQ = 0x100;

const SM83_opcode_matrix = Object.freeze({
    0x00: new SM83_opcode_info(0x00, SM83_MN.NOP),
    0x01: new SM83_opcode_info(0x01, SM83_MN.LD16_di_da, 'BC'),
    0x02: new SM83_opcode_info(0x02, SM83_MN.LD_ind_di, 'BC', 'A'),
    0x03: new SM83_opcode_info(0x03, SM83_MN.INC16_di, 'BC'),
    0x04: new SM83_opcode_info(0x04, SM83_MN.INC_di, 'B'),
    0x05: new SM83_opcode_info(0x05, SM83_MN.DEC_di, 'B'),
    0x06: new SM83_opcode_info(0x06, SM83_MN.LD_di_da, 'B'),
    0x07: new SM83_opcode_info(0x07, SM83_MN.RLCA),
    0x08: new SM83_opcode_info(0x08, SM83_MN.LD16_addr_di, 'SP'),
    0x09: new SM83_opcode_info(0x09, SM83_MN.ADD16_di_di, 'HL', 'BC'),
    0x0A: new SM83_opcode_info(0x0A, SM83_MN.LD_di_ind, 'A', 'BC'),
    0x0B: new SM83_opcode_info(0x0B, SM83_MN.DEC16_di, 'BC'),
    0x0C: new SM83_opcode_info(0x0C, SM83_MN.INC_di, 'C'),
    0x0D: new SM83_opcode_info(0x0D, SM83_MN.DEC_di, 'C'),
    0x0E: new SM83_opcode_info(0x0E, SM83_MN.LD_di_da, 'C'),
    0x0F: new SM83_opcode_info(0x0F, SM83_MN.RRCA),

    0x10: new SM83_opcode_info(0x10, SM83_MN.STOP),
    0x11: new SM83_opcode_info(0x11, SM83_MN.LD16_di_da, 'DE'),
    0x12: new SM83_opcode_info(0x12, SM83_MN.LD_ind_di, 'DE', 'A'),
    0x13: new SM83_opcode_info(0x13, SM83_MN.INC16_di, 'DE'),
    0x14: new SM83_opcode_info(0x14, SM83_MN.INC_di, 'D'),
    0x15: new SM83_opcode_info(0x15, SM83_MN.DEC_di, 'D'),
    0x16: new SM83_opcode_info(0x16, SM83_MN.LD_di_da, 'D'),
    0x17: new SM83_opcode_info(0x17, SM83_MN.RLA),
    0x18: new SM83_opcode_info(0x18, SM83_MN.JR_cond_rel, '1'),
    0x19: new SM83_opcode_info(0x19, SM83_MN.ADD16_di_di, 'HL', 'DE'),
    0x1A: new SM83_opcode_info(0x1A, SM83_MN.LD_di_ind, 'A', 'DE'),
    0x1B: new SM83_opcode_info(0x1B, SM83_MN.DEC16_di, 'DE'),
    0x1C: new SM83_opcode_info(0x1C, SM83_MN.INC_di, 'E'),
    0x1D: new SM83_opcode_info(0x1D, SM83_MN.DEC_di, 'E'),
    0x1E: new SM83_opcode_info(0x1E, SM83_MN.LD_di_da, 'E'),
    0x1F: new SM83_opcode_info(0x1F, SM83_MN.RRA),

    0x20: new SM83_opcode_info(0x20, SM83_MN.JR_cond_rel, 'regs.F.Z ' + GENEQO + ' 0'),
    0x21: new SM83_opcode_info(0x21, SM83_MN.LD16_di_da, 'HL'),
    0x22: new SM83_opcode_info(0x22, SM83_MN.LD_ind_inc_di, 'HL', 'A'),
    0x23: new SM83_opcode_info(0x23, SM83_MN.INC16_di, 'HL'),
    0x24: new SM83_opcode_info(0x24, SM83_MN.INC_di, 'H'),
    0x25: new SM83_opcode_info(0x25, SM83_MN.DEC_di, 'H'),
    0x26: new SM83_opcode_info(0x26, SM83_MN.LD_di_da, 'H'),
    0x27: new SM83_opcode_info(0x27, SM83_MN.DAA),
    0x28: new SM83_opcode_info(0x28, SM83_MN.JR_cond_rel, 'regs.F.Z ' + GENEQO + ' 1'),
    0x29: new SM83_opcode_info(0x29, SM83_MN.ADD16_di_di, 'HL', 'HL'),
    0x2A: new SM83_opcode_info(0x2A, SM83_MN.LD_di_ind_inc, 'A', 'HL'),
    0x2B: new SM83_opcode_info(0x2B, SM83_MN.DEC16_di, 'HL'),
    0x2C: new SM83_opcode_info(0x2C, SM83_MN.INC_di, 'L'),
    0x2D: new SM83_opcode_info(0x2D, SM83_MN.DEC_di, 'L'),
    0x2E: new SM83_opcode_info(0x2E, SM83_MN.LD_di_da, 'L'),
    0x2F: new SM83_opcode_info(0x2F, SM83_MN.CPL),

    0x30: new SM83_opcode_info(0x30, SM83_MN.JR_cond_rel, 'regs.F.C ' + GENEQO + ' 0'),
    0x31: new SM83_opcode_info(0x31, SM83_MN.LD16_di_da, 'SP'),
    0x32: new SM83_opcode_info(0x32, SM83_MN.LD_ind_dec_di, 'HL', 'A'),
    0x33: new SM83_opcode_info(0x33, SM83_MN.INC16_di, 'SP'),
    0x34: new SM83_opcode_info(0x34, SM83_MN.INC_ind, 'HL'),
    0x35: new SM83_opcode_info(0x35, SM83_MN.DEC_ind, 'HL'),
    0x36: new SM83_opcode_info(0x36, SM83_MN.LD_ind_da, 'HL'),
    0x37: new SM83_opcode_info(0x37, SM83_MN.SCF),
    0x38: new SM83_opcode_info(0x38, SM83_MN.JR_cond_rel, 'regs.F.C ' + GENEQO + ' 1'),
    0x39: new SM83_opcode_info(0x39, SM83_MN.ADD16_di_di, 'HL', 'SP'),
    0x3A: new SM83_opcode_info(0x3A, SM83_MN.LD_di_ind_dec, 'A', 'HL'),
    0x3B: new SM83_opcode_info(0x3B, SM83_MN.DEC16_di, 'SP'),
    0x3C: new SM83_opcode_info(0x3C, SM83_MN.INC_di, 'A'),
    0x3D: new SM83_opcode_info(0x3D, SM83_MN.DEC_di, 'A'),
    0x3E: new SM83_opcode_info(0x3E, SM83_MN.LD_di_da, 'A'),
    0x3F: new SM83_opcode_info(0x3F, SM83_MN.CCF),

    0x40: new SM83_opcode_info(0x40, SM83_MN.LD_di_di, 'B', 'B'),
    0x41: new SM83_opcode_info(0x41, SM83_MN.LD_di_di, 'B', 'C'),
    0x42: new SM83_opcode_info(0x42, SM83_MN.LD_di_di, 'B', 'D'),
    0x43: new SM83_opcode_info(0x43, SM83_MN.LD_di_di, 'B', 'E'),
    0x44: new SM83_opcode_info(0x44, SM83_MN.LD_di_di, 'B', 'H'),
    0x45: new SM83_opcode_info(0x45, SM83_MN.LD_di_di, 'B', 'L'),
    0x46: new SM83_opcode_info(0x46, SM83_MN.LD_di_ind, 'B', 'HL'),
    0x47: new SM83_opcode_info(0x47, SM83_MN.LD_di_di, 'B', 'A'),
    0x48: new SM83_opcode_info(0x48, SM83_MN.LD_di_di, 'C', 'B'),
    0x49: new SM83_opcode_info(0x49, SM83_MN.LD_di_di, 'C', 'C'),
    0x4A: new SM83_opcode_info(0x4A, SM83_MN.LD_di_di, 'C', 'D'),
    0x4B: new SM83_opcode_info(0x4B, SM83_MN.LD_di_di, 'C', 'E'),
    0x4C: new SM83_opcode_info(0x4C, SM83_MN.LD_di_di, 'C', 'H'),
    0x4D: new SM83_opcode_info(0x4D, SM83_MN.LD_di_di, 'C', 'L'),
    0x4E: new SM83_opcode_info(0x4E, SM83_MN.LD_di_ind, 'C', 'HL'),
    0x4F: new SM83_opcode_info(0x4F, SM83_MN.LD_di_di, 'C', 'A'),

    0x50: new SM83_opcode_info(0x50, SM83_MN.LD_di_di, 'D', 'B'),
    0x51: new SM83_opcode_info(0x51, SM83_MN.LD_di_di, 'D', 'C'),
    0x52: new SM83_opcode_info(0x52, SM83_MN.LD_di_di, 'D', 'D'),
    0x53: new SM83_opcode_info(0x53, SM83_MN.LD_di_di, 'D', 'E'),
    0x54: new SM83_opcode_info(0x54, SM83_MN.LD_di_di, 'D', 'H'),
    0x55: new SM83_opcode_info(0x55, SM83_MN.LD_di_di, 'D', 'L'),
    0x56: new SM83_opcode_info(0x56, SM83_MN.LD_di_ind, 'D', 'HL'),
    0x57: new SM83_opcode_info(0x57, SM83_MN.LD_di_di, 'D', 'A'),
    0x58: new SM83_opcode_info(0x58, SM83_MN.LD_di_di, 'E', 'B'),
    0x59: new SM83_opcode_info(0x59, SM83_MN.LD_di_di, 'E', 'C'),
    0x5A: new SM83_opcode_info(0x5A, SM83_MN.LD_di_di, 'E', 'D'),
    0x5B: new SM83_opcode_info(0x5B, SM83_MN.LD_di_di, 'E', 'E'),
    0x5C: new SM83_opcode_info(0x5C, SM83_MN.LD_di_di, 'E', 'H'),
    0x5D: new SM83_opcode_info(0x5D, SM83_MN.LD_di_di, 'E', 'L'),
    0x5E: new SM83_opcode_info(0x5E, SM83_MN.LD_di_ind, 'E', 'HL'),
    0x5F: new SM83_opcode_info(0x5F, SM83_MN.LD_di_di, 'E', 'A'),

    0x60: new SM83_opcode_info(0x60, SM83_MN.LD_di_di, 'H', 'B'),
    0x61: new SM83_opcode_info(0x61, SM83_MN.LD_di_di, 'H', 'C'),
    0x62: new SM83_opcode_info(0x62, SM83_MN.LD_di_di, 'H', 'D'),
    0x63: new SM83_opcode_info(0x63, SM83_MN.LD_di_di, 'H', 'E'),
    0x64: new SM83_opcode_info(0x64, SM83_MN.LD_di_di, 'H', 'H'),
    0x65: new SM83_opcode_info(0x65, SM83_MN.LD_di_di, 'H', 'L'),
    0x66: new SM83_opcode_info(0x66, SM83_MN.LD_di_ind, 'H', 'HL'),
    0x67: new SM83_opcode_info(0x67, SM83_MN.LD_di_di, 'H', 'A'),
    0x68: new SM83_opcode_info(0x68, SM83_MN.LD_di_di, 'L', 'B'),
    0x69: new SM83_opcode_info(0x69, SM83_MN.LD_di_di, 'L', 'C'),
    0x6A: new SM83_opcode_info(0x6A, SM83_MN.LD_di_di, 'L', 'D'),
    0x6B: new SM83_opcode_info(0x6B, SM83_MN.LD_di_di, 'L', 'E'),
    0x6C: new SM83_opcode_info(0x6C, SM83_MN.LD_di_di, 'L', 'H'),
    0x6D: new SM83_opcode_info(0x6D, SM83_MN.LD_di_di, 'L', 'L'),
    0x6E: new SM83_opcode_info(0x6E, SM83_MN.LD_di_ind, 'L', 'HL'),
    0x6F: new SM83_opcode_info(0x6F, SM83_MN.LD_di_di, 'L', 'A'),

    0x70: new SM83_opcode_info(0x70, SM83_MN.LD_ind_di, 'HL', 'B'),
    0x71: new SM83_opcode_info(0x71, SM83_MN.LD_ind_di, 'HL', 'C'),
    0x72: new SM83_opcode_info(0x72, SM83_MN.LD_ind_di, 'HL', 'D'),
    0x73: new SM83_opcode_info(0x73, SM83_MN.LD_ind_di, 'HL', 'E'),
    0x74: new SM83_opcode_info(0x74, SM83_MN.LD_ind_di, 'HL', 'H'),
    0x75: new SM83_opcode_info(0x75, SM83_MN.LD_ind_di, 'HL', 'L'),
    0x76: new SM83_opcode_info(0x76, SM83_MN.HALT),
    0x77: new SM83_opcode_info(0x77, SM83_MN.LD_ind_di, 'HL', 'A'),
    0x78: new SM83_opcode_info(0x78, SM83_MN.LD_di_di, 'A', 'B'),
    0x79: new SM83_opcode_info(0x79, SM83_MN.LD_di_di, 'A', 'C'),
    0x7A: new SM83_opcode_info(0x7A, SM83_MN.LD_di_di, 'A', 'D'),
    0x7B: new SM83_opcode_info(0x7B, SM83_MN.LD_di_di, 'A', 'E'),
    0x7C: new SM83_opcode_info(0x7C, SM83_MN.LD_di_di, 'A', 'H'),
    0x7D: new SM83_opcode_info(0x7D, SM83_MN.LD_di_di, 'A', 'L'),
    0x7E: new SM83_opcode_info(0x7E, SM83_MN.LD_di_ind, 'A', 'HL'),
    0x7F: new SM83_opcode_info(0x7F, SM83_MN.LD_di_di, 'A', 'A'),

    0x80: new SM83_opcode_info(0x80, SM83_MN.ADD_di_di, 'A', 'B'),
    0x81: new SM83_opcode_info(0x81, SM83_MN.ADD_di_di, 'A', 'C'),
    0x82: new SM83_opcode_info(0x82, SM83_MN.ADD_di_di, 'A', 'D'),
    0x83: new SM83_opcode_info(0x83, SM83_MN.ADD_di_di, 'A', 'E'),
    0x84: new SM83_opcode_info(0x84, SM83_MN.ADD_di_di, 'A', 'H'),
    0x85: new SM83_opcode_info(0x85, SM83_MN.ADD_di_di, 'A', 'L'),
    0x86: new SM83_opcode_info(0x86, SM83_MN.ADD_di_ind, 'A', 'HL'),
    0x87: new SM83_opcode_info(0x87, SM83_MN.ADD_di_di, 'A', 'A'),
    0x88: new SM83_opcode_info(0x88, SM83_MN.ADC_di_di, 'A', 'B'),
    0x89: new SM83_opcode_info(0x89, SM83_MN.ADC_di_di, 'A', 'C'),
    0x8A: new SM83_opcode_info(0x8A, SM83_MN.ADC_di_di, 'A', 'D'),
    0x8B: new SM83_opcode_info(0x8B, SM83_MN.ADC_di_di, 'A', 'E'),
    0x8C: new SM83_opcode_info(0x8C, SM83_MN.ADC_di_di, 'A', 'H'),
    0x8D: new SM83_opcode_info(0x8D, SM83_MN.ADC_di_di, 'A', 'L'),
    0x8E: new SM83_opcode_info(0x8E, SM83_MN.ADC_di_ind, 'A', 'HL'),
    0x8F: new SM83_opcode_info(0x8F, SM83_MN.ADC_di_di, 'A', 'A'),

    0x90: new SM83_opcode_info(0x90, SM83_MN.SUB_di_di, 'A', 'B'),
    0x91: new SM83_opcode_info(0x91, SM83_MN.SUB_di_di, 'A', 'C'),
    0x92: new SM83_opcode_info(0x92, SM83_MN.SUB_di_di, 'A', 'D'),
    0x93: new SM83_opcode_info(0x93, SM83_MN.SUB_di_di, 'A', 'E'),
    0x94: new SM83_opcode_info(0x94, SM83_MN.SUB_di_di, 'A', 'H'),
    0x95: new SM83_opcode_info(0x95, SM83_MN.SUB_di_di, 'A', 'L'),
    0x96: new SM83_opcode_info(0x96, SM83_MN.SUB_di_ind, 'A', 'HL'),
    0x97: new SM83_opcode_info(0x97, SM83_MN.SUB_di_di, 'A', 'A'),
    0x98: new SM83_opcode_info(0x98, SM83_MN.SBC_di_di, 'A', 'B'),
    0x99: new SM83_opcode_info(0x99, SM83_MN.SBC_di_di, 'A', 'C'),
    0x9A: new SM83_opcode_info(0x9A, SM83_MN.SBC_di_di, 'A', 'D'),
    0x9B: new SM83_opcode_info(0x9B, SM83_MN.SBC_di_di, 'A', 'E'),
    0x9C: new SM83_opcode_info(0x9C, SM83_MN.SBC_di_di, 'A', 'H'),
    0x9D: new SM83_opcode_info(0x9D, SM83_MN.SBC_di_di, 'A', 'L'),
    0x9E: new SM83_opcode_info(0x9E, SM83_MN.SBC_di_ind, 'A', 'HL'),
    0x9F: new SM83_opcode_info(0x9F, SM83_MN.SBC_di_di, 'A', 'A'),

    0xA0: new SM83_opcode_info(0xA0, SM83_MN.AND_di_di, 'A', 'B'),
    0xA1: new SM83_opcode_info(0xA1, SM83_MN.AND_di_di, 'A', 'C'),
    0xA2: new SM83_opcode_info(0xA2, SM83_MN.AND_di_di, 'A', 'D'),
    0xA3: new SM83_opcode_info(0xA3, SM83_MN.AND_di_di, 'A', 'E'),
    0xA4: new SM83_opcode_info(0xA4, SM83_MN.AND_di_di, 'A', 'H'),
    0xA5: new SM83_opcode_info(0xA5, SM83_MN.AND_di_di, 'A', 'L'),
    0xA6: new SM83_opcode_info(0xA6, SM83_MN.AND_di_ind, 'A', 'HL'),
    0xA7: new SM83_opcode_info(0xA7, SM83_MN.AND_di_di, 'A', 'A'),
    0xA8: new SM83_opcode_info(0xA8, SM83_MN.XOR_di_di, 'A', 'B'),
    0xA9: new SM83_opcode_info(0xA9, SM83_MN.XOR_di_di, 'A', 'C'),
    0xAA: new SM83_opcode_info(0xAA, SM83_MN.XOR_di_di, 'A', 'D'),
    0xAB: new SM83_opcode_info(0xAB, SM83_MN.XOR_di_di, 'A', 'E'),
    0xAC: new SM83_opcode_info(0xAC, SM83_MN.XOR_di_di, 'A', 'H'),
    0xAD: new SM83_opcode_info(0xAD, SM83_MN.XOR_di_di, 'A', 'L'),
    0xAE: new SM83_opcode_info(0xAE, SM83_MN.XOR_di_ind, 'A', 'HL'),
    0xAF: new SM83_opcode_info(0xAF, SM83_MN.XOR_di_di, 'A', 'A'),

    0xB0: new SM83_opcode_info(0xB0, SM83_MN.OR_di_di, 'A', 'B'),
    0xB1: new SM83_opcode_info(0xB1, SM83_MN.OR_di_di, 'A', 'C'),
    0xB2: new SM83_opcode_info(0xB2, SM83_MN.OR_di_di, 'A', 'D'),
    0xB3: new SM83_opcode_info(0xB3, SM83_MN.OR_di_di, 'A', 'E'),
    0xB4: new SM83_opcode_info(0xB4, SM83_MN.OR_di_di, 'A', 'H'),
    0xB5: new SM83_opcode_info(0xB5, SM83_MN.OR_di_di, 'A', 'L'),
    0xB6: new SM83_opcode_info(0xB6, SM83_MN.OR_di_ind, 'A', 'HL'),
    0xB7: new SM83_opcode_info(0xB7, SM83_MN.OR_di_di, 'A', 'A'),
    0xB8: new SM83_opcode_info(0xB8, SM83_MN.CP_di_di, 'A', 'B'),
    0xB9: new SM83_opcode_info(0xB9, SM83_MN.CP_di_di, 'A', 'C'),
    0xBA: new SM83_opcode_info(0xBA, SM83_MN.CP_di_di, 'A', 'D'),
    0xBB: new SM83_opcode_info(0xBB, SM83_MN.CP_di_di, 'A', 'E'),
    0xBC: new SM83_opcode_info(0xBC, SM83_MN.CP_di_di, 'A', 'H'),
    0xBD: new SM83_opcode_info(0xBD, SM83_MN.CP_di_di, 'A', 'L'),
    0xBE: new SM83_opcode_info(0xBE, SM83_MN.CP_di_ind, 'A', 'HL'),
    0xBF: new SM83_opcode_info(0xBF, SM83_MN.CP_di_di, 'A', 'A'),

    0xC0: new SM83_opcode_info(0xC0, SM83_MN.RET_cond, 'regs.F.Z ' + GENEQO + ' 0'),
    0xC1: new SM83_opcode_info(0xC1, SM83_MN.POP_di, 'BC'),
    0xC2: new SM83_opcode_info(0xC2, SM83_MN.JP_cond_addr, 'regs.F.Z ' + GENEQO + ' 0'),
    0xC3: new SM83_opcode_info(0xC3, SM83_MN.JP_cond_addr, "1"),
    0xC4: new SM83_opcode_info(0xC4, SM83_MN.CALL_cond_addr, 'regs.F.Z ' + GENEQO + ' 0'),
    0xC5: new SM83_opcode_info(0xC5, SM83_MN.PUSH_di, 'BC'),
    0xC6: new SM83_opcode_info(0xC6, SM83_MN.ADD_di_da, 'A'),
    0xC7: new SM83_opcode_info(0xC7, SM83_MN.RST_imp, 0),
    0xC8: new SM83_opcode_info(0xC8, SM83_MN.RET_cond, 'regs.F.Z ' + GENEQO + ' 1'),
    0xC9: new SM83_opcode_info(0xC9, SM83_MN.RET),
    0xCA: new SM83_opcode_info(0xCA, SM83_MN.JP_cond_addr, 'regs.F.Z ' + GENEQO + ' 1'),
    0xCB: new SM83_opcode_info(0xCB, SM83_MN.NONE),
    0xCC: new SM83_opcode_info(0xCC, SM83_MN.CALL_cond_addr, 'regs.F.Z ' + GENEQO + ' 1'),
    0xCD: new SM83_opcode_info(0xCD, SM83_MN.CALL_cond_addr, '1'),
    0xCE: new SM83_opcode_info(0xCE, SM83_MN.ADC_di_da, 'A'),
    0xCF: new SM83_opcode_info(0xCF, SM83_MN.RST_imp, 8),

    0xD0: new SM83_opcode_info(0xD0, SM83_MN.RET_cond, 'regs.F.C ' + GENEQO + ' 0'),
    0xD1: new SM83_opcode_info(0xD1, SM83_MN.POP_di, 'DE'),
    0xD2: new SM83_opcode_info(0xD2, SM83_MN.JP_cond_addr, 'regs.F.C ' + GENEQO + ' 0'),
    0xD3: new SM83_opcode_info(0xD3, SM83_MN.NONE),
    0xD4: new SM83_opcode_info(0xD4, SM83_MN.CALL_cond_addr, 'regs.F.C ' + GENEQO + ' 0'),
    0xD5: new SM83_opcode_info(0xD5, SM83_MN.PUSH_di, 'DE'),
    0xD6: new SM83_opcode_info(0xD6, SM83_MN.SUB_di_da, 'A'),
    0xD7: new SM83_opcode_info(0xD7, SM83_MN.RST_imp, 0x10),
    0xD8: new SM83_opcode_info(0xD8, SM83_MN.RET_cond, 'regs.F.C ' + GENEQO + ' 1'),
    0xD9: new SM83_opcode_info(0xD9, SM83_MN.RETI),
    0xDA: new SM83_opcode_info(0xDA, SM83_MN.JP_cond_addr, 'regs.F.C ' + GENEQO + ' 1'),
    0xDB: new SM83_opcode_info(0xDB, SM83_MN.NONE),
    0xDC: new SM83_opcode_info(0xDC, SM83_MN.CALL_cond_addr, 'regs.F.C ' + GENEQO + ' 1'),
    0xDD: new SM83_opcode_info(0xDD, SM83_MN.NONE),
    0xDE: new SM83_opcode_info(0xDE, SM83_MN.SBC_di_da, 'A'),
    0xDF: new SM83_opcode_info(0xDF, SM83_MN.RST_imp, 0x18),

    0xE0: new SM83_opcode_info(0xE0, SM83_MN.LDH_addr_di, 'A'),
    0xE1: new SM83_opcode_info(0xE1, SM83_MN.POP_di, 'HL'),
    0xE2: new SM83_opcode_info(0xE2, SM83_MN.LDH_ind_di, 'C', 'A'),
    0xE3: new SM83_opcode_info(0xE3, SM83_MN.NONE),
    0xE4: new SM83_opcode_info(0xE4, SM83_MN.NONE),
    0xE5: new SM83_opcode_info(0xE5, SM83_MN.PUSH_di, 'HL'),
    0xE6: new SM83_opcode_info(0xE6, SM83_MN.AND_di_da, 'A'),
    0xE7: new SM83_opcode_info(0xE7, SM83_MN.RST_imp, 0x20),
    0xE8: new SM83_opcode_info(0xE8, SM83_MN.ADD_di_rel, 'SP'),
    0xE9: new SM83_opcode_info(0xE9, SM83_MN.JP_di, 'HL'),
    0xEA: new SM83_opcode_info(0xEA, SM83_MN.LD_addr_di, 'A'),
    0xEB: new SM83_opcode_info(0xEB, SM83_MN.NONE),
    0xEC: new SM83_opcode_info(0xEC, SM83_MN.NONE),
    0xED: new SM83_opcode_info(0xED, SM83_MN.NONE),
    0xEE: new SM83_opcode_info(0xEE, SM83_MN.XOR_di_da, 'A'),
    0xEF: new SM83_opcode_info(0xEF, SM83_MN.RST_imp, 0x28),

    0xF0: new SM83_opcode_info(0xF0, SM83_MN.LDH_di_addr, 'A'),
    0xF1: new SM83_opcode_info(0xF1, SM83_MN.POP_di_AF, 'AF'),
    0xF2: new SM83_opcode_info(0xF2, SM83_MN.LDH_di_ind, 'A', 'C'),
    0xF3: new SM83_opcode_info(0xF3, SM83_MN.DI),
    0xF4: new SM83_opcode_info(0xF4, SM83_MN.NONE),
    0xF5: new SM83_opcode_info(0xF5, SM83_MN.PUSH_di, 'AF'),
    0xF6: new SM83_opcode_info(0xF6, SM83_MN.OR_di_da, 'A'),
    0xF7: new SM83_opcode_info(0xF7, SM83_MN.RST_imp, 0x30),
    0xF8: new SM83_opcode_info(0xF8, SM83_MN.LD_di_di_rel, 'HL', 'SP'),
    0xF9: new SM83_opcode_info(0xF9, SM83_MN.LD16_di_di, 'SP', 'HL'),
    0xFA: new SM83_opcode_info(0xFA, SM83_MN.LD_di_addr, 'A'),
    0xFB: new SM83_opcode_info(0xFB, SM83_MN.EI),
    0xFC: new SM83_opcode_info(0xFC, SM83_MN.NONE),
    0xFD: new SM83_opcode_info(0xFD, SM83_MN.NONE),
    0xFE: new SM83_opcode_info(0xFE, SM83_MN.CP_di_da, 'A'),
    0xFF: new SM83_opcode_info(0xFF, SM83_MN.RST_imp, 0x38),
    [SM83_S_IRQ]: new SM83_opcode_info(SM83_S_IRQ, SM83_MN.S_IRQ),
    [SM83_S_RESET]: new SM83_opcode_info(SM83_S_RESET, SM83_MN.RESET)
});

const SM83_opcode_matrixCB = Object.freeze({
    0x00: new SM83_opcode_info(0x00, SM83_MN.RLC_di, 'B'),
    0x01: new SM83_opcode_info(0x01, SM83_MN.RLC_di, 'C'),
    0x02: new SM83_opcode_info(0x02, SM83_MN.RLC_di, 'D'),
    0x03: new SM83_opcode_info(0x03, SM83_MN.RLC_di, 'E'),
    0x04: new SM83_opcode_info(0x04, SM83_MN.RLC_di, 'H'),
    0x05: new SM83_opcode_info(0x05, SM83_MN.RLC_di, 'L'),
    0x06: new SM83_opcode_info(0x06, SM83_MN.RLC_ind, 'HL'),
    0x07: new SM83_opcode_info(0x07, SM83_MN.RLC_di, 'A'),
    0x08: new SM83_opcode_info(0x08, SM83_MN.RRC_di, 'B'),
    0x09: new SM83_opcode_info(0x09, SM83_MN.RRC_di, 'C'),
    0x0A: new SM83_opcode_info(0x0A, SM83_MN.RRC_di, 'D'),
    0x0B: new SM83_opcode_info(0x0B, SM83_MN.RRC_di, 'E'),
    0x0C: new SM83_opcode_info(0x0C, SM83_MN.RRC_di, 'H'),
    0x0D: new SM83_opcode_info(0x0D, SM83_MN.RRC_di, 'L'),
    0x0E: new SM83_opcode_info(0x0E, SM83_MN.RRC_ind, 'HL'),
    0x0F: new SM83_opcode_info(0x0F, SM83_MN.RRC_di, 'A'),

    0x10: new SM83_opcode_info(0x10, SM83_MN.RL_di, 'B'),
    0x11: new SM83_opcode_info(0x11, SM83_MN.RL_di, 'C'),
    0x12: new SM83_opcode_info(0x12, SM83_MN.RL_di, 'D'),
    0x13: new SM83_opcode_info(0x13, SM83_MN.RL_di, 'E'),
    0x14: new SM83_opcode_info(0x14, SM83_MN.RL_di, 'H'),
    0x15: new SM83_opcode_info(0x15, SM83_MN.RL_di, 'L'),
    0x16: new SM83_opcode_info(0x16, SM83_MN.RL_ind, 'HL'),
    0x17: new SM83_opcode_info(0x17, SM83_MN.RL_di, 'A'),
    0x18: new SM83_opcode_info(0x18, SM83_MN.RR_di, 'B'),
    0x19: new SM83_opcode_info(0x19, SM83_MN.RR_di, 'C'),
    0x1A: new SM83_opcode_info(0x1A, SM83_MN.RR_di, 'D'),
    0x1B: new SM83_opcode_info(0x1B, SM83_MN.RR_di, 'E'),
    0x1C: new SM83_opcode_info(0x1C, SM83_MN.RR_di, 'H'),
    0x1D: new SM83_opcode_info(0x1D, SM83_MN.RR_di, 'L'),
    0x1E: new SM83_opcode_info(0x1E, SM83_MN.RR_ind, 'HL'),
    0x1F: new SM83_opcode_info(0x1F, SM83_MN.RR_di, 'A'),

    0x20: new SM83_opcode_info(0x20, SM83_MN.SLA_di, 'B'),
    0x21: new SM83_opcode_info(0x21, SM83_MN.SLA_di, 'C'),
    0x22: new SM83_opcode_info(0x22, SM83_MN.SLA_di, 'D'),
    0x23: new SM83_opcode_info(0x23, SM83_MN.SLA_di, 'E'),
    0x24: new SM83_opcode_info(0x24, SM83_MN.SLA_di, 'H'),
    0x25: new SM83_opcode_info(0x25, SM83_MN.SLA_di, 'L'),
    0x26: new SM83_opcode_info(0x26, SM83_MN.SLA_ind, 'HL'),
    0x27: new SM83_opcode_info(0x27, SM83_MN.SLA_di, 'A'),
    0x28: new SM83_opcode_info(0x28, SM83_MN.SRA_di, 'B'),
    0x29: new SM83_opcode_info(0x29, SM83_MN.SRA_di, 'C'),
    0x2A: new SM83_opcode_info(0x2A, SM83_MN.SRA_di, 'D'),
    0x2B: new SM83_opcode_info(0x2B, SM83_MN.SRA_di, 'E'),
    0x2C: new SM83_opcode_info(0x2C, SM83_MN.SRA_di, 'H'),
    0x2D: new SM83_opcode_info(0x2D, SM83_MN.SRA_di, 'L'),
    0x2E: new SM83_opcode_info(0x2E, SM83_MN.SRA_ind, 'HL'),
    0x2F: new SM83_opcode_info(0x2F, SM83_MN.SRA_di, 'A'),

    0x30: new SM83_opcode_info(0x30, SM83_MN.SWAP_di, 'B'),
    0x31: new SM83_opcode_info(0x31, SM83_MN.SWAP_di, 'C'),
    0x32: new SM83_opcode_info(0x32, SM83_MN.SWAP_di, 'D'),
    0x33: new SM83_opcode_info(0x33, SM83_MN.SWAP_di, 'E'),
    0x34: new SM83_opcode_info(0x34, SM83_MN.SWAP_di, 'H'),
    0x35: new SM83_opcode_info(0x35, SM83_MN.SWAP_di, 'L'),
    0x36: new SM83_opcode_info(0x36, SM83_MN.SWAP_ind, 'HL'),
    0x37: new SM83_opcode_info(0x37, SM83_MN.SWAP_di, 'A'),
    0x38: new SM83_opcode_info(0x38, SM83_MN.SRL_di, 'B'),
    0x39: new SM83_opcode_info(0x39, SM83_MN.SRL_di, 'C'),
    0x3A: new SM83_opcode_info(0x3A, SM83_MN.SRL_di, 'D'),
    0x3B: new SM83_opcode_info(0x3B, SM83_MN.SRL_di, 'E'),
    0x3C: new SM83_opcode_info(0x3C, SM83_MN.SRL_di, 'H'),
    0x3D: new SM83_opcode_info(0x3D, SM83_MN.SRL_di, 'L'),
    0x3E: new SM83_opcode_info(0x3E, SM83_MN.SRL_ind, 'HL'),
    0x3F: new SM83_opcode_info(0x3F, SM83_MN.SRL_di, 'A'),

    0x40: new SM83_opcode_info(0x40, SM83_MN.BIT_idx_di, 0, 'B'),
    0x41: new SM83_opcode_info(0x41, SM83_MN.BIT_idx_di, 0, 'C'),
    0x42: new SM83_opcode_info(0x42, SM83_MN.BIT_idx_di, 0, 'D'),
    0x43: new SM83_opcode_info(0x43, SM83_MN.BIT_idx_di, 0, 'E'),
    0x44: new SM83_opcode_info(0x44, SM83_MN.BIT_idx_di, 0, 'H'),
    0x45: new SM83_opcode_info(0x45, SM83_MN.BIT_idx_di, 0, 'L'),
    0x46: new SM83_opcode_info(0x46, SM83_MN.BIT_idx_ind, 0, 'HL'),
    0x47: new SM83_opcode_info(0x47, SM83_MN.BIT_idx_di, 0, 'A'),
    0x48: new SM83_opcode_info(0x48, SM83_MN.BIT_idx_di, 1, 'B'),
    0x49: new SM83_opcode_info(0x49, SM83_MN.BIT_idx_di, 1, 'C'),
    0x4A: new SM83_opcode_info(0x4A, SM83_MN.BIT_idx_di, 1, 'D'),
    0x4B: new SM83_opcode_info(0x4B, SM83_MN.BIT_idx_di, 1, 'E'),
    0x4C: new SM83_opcode_info(0x4C, SM83_MN.BIT_idx_di, 1, 'H'),
    0x4D: new SM83_opcode_info(0x4D, SM83_MN.BIT_idx_di, 1, 'L'),
    0x4E: new SM83_opcode_info(0x4E, SM83_MN.BIT_idx_ind, 1, 'HL'),
    0x4F: new SM83_opcode_info(0x4F, SM83_MN.BIT_idx_di, 1, 'A'),

    0x50: new SM83_opcode_info(0x50, SM83_MN.BIT_idx_di, 2, 'B'),
    0x51: new SM83_opcode_info(0x51, SM83_MN.BIT_idx_di, 2, 'C'),
    0x52: new SM83_opcode_info(0x52, SM83_MN.BIT_idx_di, 2, 'D'),
    0x53: new SM83_opcode_info(0x53, SM83_MN.BIT_idx_di, 2, 'E'),
    0x54: new SM83_opcode_info(0x54, SM83_MN.BIT_idx_di, 2, 'H'),
    0x55: new SM83_opcode_info(0x55, SM83_MN.BIT_idx_di, 2, 'L'),
    0x56: new SM83_opcode_info(0x56, SM83_MN.BIT_idx_ind, 2, 'HL'),
    0x57: new SM83_opcode_info(0x57, SM83_MN.BIT_idx_di, 2, 'A'),
    0x58: new SM83_opcode_info(0x58, SM83_MN.BIT_idx_di, 3, 'B'),
    0x59: new SM83_opcode_info(0x59, SM83_MN.BIT_idx_di, 3, 'C'),
    0x5A: new SM83_opcode_info(0x5A, SM83_MN.BIT_idx_di, 3, 'D'),
    0x5B: new SM83_opcode_info(0x5B, SM83_MN.BIT_idx_di, 3, 'E'),
    0x5C: new SM83_opcode_info(0x5C, SM83_MN.BIT_idx_di, 3, 'H'),
    0x5D: new SM83_opcode_info(0x5D, SM83_MN.BIT_idx_di, 3, 'L'),
    0x5E: new SM83_opcode_info(0x5E, SM83_MN.BIT_idx_ind, 3, 'HL'),
    0x5F: new SM83_opcode_info(0x5F, SM83_MN.BIT_idx_di, 3, 'A'),

    0x60: new SM83_opcode_info(0x60, SM83_MN.BIT_idx_di, 4, 'B'),
    0x61: new SM83_opcode_info(0x61, SM83_MN.BIT_idx_di, 4, 'C'),
    0x62: new SM83_opcode_info(0x62, SM83_MN.BIT_idx_di, 4, 'D'),
    0x63: new SM83_opcode_info(0x63, SM83_MN.BIT_idx_di, 4, 'E'),
    0x64: new SM83_opcode_info(0x64, SM83_MN.BIT_idx_di, 4, 'H'),
    0x65: new SM83_opcode_info(0x65, SM83_MN.BIT_idx_di, 4, 'L'),
    0x66: new SM83_opcode_info(0x66, SM83_MN.BIT_idx_ind, 4, 'HL'),
    0x67: new SM83_opcode_info(0x67, SM83_MN.BIT_idx_di, 4, 'A'),
    0x68: new SM83_opcode_info(0x68, SM83_MN.BIT_idx_di, 5, 'B'),
    0x69: new SM83_opcode_info(0x69, SM83_MN.BIT_idx_di, 5, 'C'),
    0x6A: new SM83_opcode_info(0x6A, SM83_MN.BIT_idx_di, 5, 'D'),
    0x6B: new SM83_opcode_info(0x6B, SM83_MN.BIT_idx_di, 5, 'E'),
    0x6C: new SM83_opcode_info(0x6C, SM83_MN.BIT_idx_di, 5, 'H'),
    0x6D: new SM83_opcode_info(0x6D, SM83_MN.BIT_idx_di, 5, 'L'),
    0x6E: new SM83_opcode_info(0x6E, SM83_MN.BIT_idx_ind, 5, 'HL'),
    0x6F: new SM83_opcode_info(0x6F, SM83_MN.BIT_idx_di, 5, 'A'),

    0x70: new SM83_opcode_info(0x70, SM83_MN.BIT_idx_di, 6, 'B'),
    0x71: new SM83_opcode_info(0x71, SM83_MN.BIT_idx_di, 6, 'C'),
    0x72: new SM83_opcode_info(0x72, SM83_MN.BIT_idx_di, 6, 'D'),
    0x73: new SM83_opcode_info(0x73, SM83_MN.BIT_idx_di, 6, 'E'),
    0x74: new SM83_opcode_info(0x74, SM83_MN.BIT_idx_di, 6, 'H'),
    0x75: new SM83_opcode_info(0x75, SM83_MN.BIT_idx_di, 6, 'L'),
    0x76: new SM83_opcode_info(0x76, SM83_MN.BIT_idx_ind, 6, 'HL'),
    0x77: new SM83_opcode_info(0x77, SM83_MN.BIT_idx_di, 6, 'A'),
    0x78: new SM83_opcode_info(0x78, SM83_MN.BIT_idx_di, 7, 'B'),
    0x79: new SM83_opcode_info(0x79, SM83_MN.BIT_idx_di, 7, 'C'),
    0x7A: new SM83_opcode_info(0x7A, SM83_MN.BIT_idx_di, 7, 'D'),
    0x7B: new SM83_opcode_info(0x7B, SM83_MN.BIT_idx_di, 7, 'E'),
    0x7C: new SM83_opcode_info(0x7C, SM83_MN.BIT_idx_di, 7, 'H'),
    0x7D: new SM83_opcode_info(0x7D, SM83_MN.BIT_idx_di, 7, 'L'),
    0x7E: new SM83_opcode_info(0x7E, SM83_MN.BIT_idx_ind, 7, 'HL'),
    0x7F: new SM83_opcode_info(0x7F, SM83_MN.BIT_idx_di, 7, 'A'),

    0x80: new SM83_opcode_info(0x80, SM83_MN.RES_idx_di, 0, 'B'),
    0x81: new SM83_opcode_info(0x81, SM83_MN.RES_idx_di, 0, 'C'),
    0x82: new SM83_opcode_info(0x82, SM83_MN.RES_idx_di, 0, 'D'),
    0x83: new SM83_opcode_info(0x83, SM83_MN.RES_idx_di, 0, 'E'),
    0x84: new SM83_opcode_info(0x84, SM83_MN.RES_idx_di, 0, 'H'),
    0x85: new SM83_opcode_info(0x85, SM83_MN.RES_idx_di, 0, 'L'),
    0x86: new SM83_opcode_info(0x86, SM83_MN.RES_idx_ind, 0, 'HL'),
    0x87: new SM83_opcode_info(0x87, SM83_MN.RES_idx_di, 0, 'A'),
    0x88: new SM83_opcode_info(0x88, SM83_MN.RES_idx_di, 1, 'B'),
    0x89: new SM83_opcode_info(0x89, SM83_MN.RES_idx_di, 1, 'C'),
    0x8A: new SM83_opcode_info(0x8A, SM83_MN.RES_idx_di, 1, 'D'),
    0x8B: new SM83_opcode_info(0x8B, SM83_MN.RES_idx_di, 1, 'E'),
    0x8C: new SM83_opcode_info(0x8C, SM83_MN.RES_idx_di, 1, 'H'),
    0x8D: new SM83_opcode_info(0x8D, SM83_MN.RES_idx_di, 1, 'L'),
    0x8E: new SM83_opcode_info(0x8E, SM83_MN.RES_idx_ind, 1, 'HL'),
    0x8F: new SM83_opcode_info(0x8F, SM83_MN.RES_idx_di, 1, 'A'),

    0x90: new SM83_opcode_info(0x90, SM83_MN.RES_idx_di, 2, 'B'),
    0x91: new SM83_opcode_info(0x91, SM83_MN.RES_idx_di, 2, 'C'),
    0x92: new SM83_opcode_info(0x92, SM83_MN.RES_idx_di, 2, 'D'),
    0x93: new SM83_opcode_info(0x93, SM83_MN.RES_idx_di, 2, 'E'),
    0x94: new SM83_opcode_info(0x94, SM83_MN.RES_idx_di, 2, 'H'),
    0x95: new SM83_opcode_info(0x95, SM83_MN.RES_idx_di, 2, 'L'),
    0x96: new SM83_opcode_info(0x96, SM83_MN.RES_idx_ind, 2, 'HL'),
    0x97: new SM83_opcode_info(0x97, SM83_MN.RES_idx_di, 2, 'A'),
    0x98: new SM83_opcode_info(0x98, SM83_MN.RES_idx_di, 3, 'B'),
    0x99: new SM83_opcode_info(0x99, SM83_MN.RES_idx_di, 3, 'C'),
    0x9A: new SM83_opcode_info(0x9A, SM83_MN.RES_idx_di, 3, 'D'),
    0x9B: new SM83_opcode_info(0x9B, SM83_MN.RES_idx_di, 3, 'E'),
    0x9C: new SM83_opcode_info(0x9C, SM83_MN.RES_idx_di, 3, 'H'),
    0x9D: new SM83_opcode_info(0x9D, SM83_MN.RES_idx_di, 3, 'L'),
    0x9E: new SM83_opcode_info(0x9E, SM83_MN.RES_idx_ind, 3, 'HL'),
    0x9F: new SM83_opcode_info(0x9F, SM83_MN.RES_idx_di, 3, 'A'),

    0xA0: new SM83_opcode_info(0xA0, SM83_MN.RES_idx_di, 4, 'B'),
    0xA1: new SM83_opcode_info(0xA1, SM83_MN.RES_idx_di, 4, 'C'),
    0xA2: new SM83_opcode_info(0xA2, SM83_MN.RES_idx_di, 4, 'D'),
    0xA3: new SM83_opcode_info(0xA3, SM83_MN.RES_idx_di, 4, 'E'),
    0xA4: new SM83_opcode_info(0xA4, SM83_MN.RES_idx_di, 4, 'H'),
    0xA5: new SM83_opcode_info(0xA5, SM83_MN.RES_idx_di, 4, 'L'),
    0xA6: new SM83_opcode_info(0xA6, SM83_MN.RES_idx_ind, 4, 'HL'),
    0xA7: new SM83_opcode_info(0xA7, SM83_MN.RES_idx_di, 4, 'A'),
    0xA8: new SM83_opcode_info(0xA8, SM83_MN.RES_idx_di, 5, 'B'),
    0xA9: new SM83_opcode_info(0xA9, SM83_MN.RES_idx_di, 5, 'C'),
    0xAA: new SM83_opcode_info(0xAA, SM83_MN.RES_idx_di, 5, 'D'),
    0xAB: new SM83_opcode_info(0xAB, SM83_MN.RES_idx_di, 5, 'E'),
    0xAC: new SM83_opcode_info(0xAC, SM83_MN.RES_idx_di, 5, 'H'),
    0xAD: new SM83_opcode_info(0xAD, SM83_MN.RES_idx_di, 5, 'L'),
    0xAE: new SM83_opcode_info(0xAE, SM83_MN.RES_idx_ind, 5, 'HL'),
    0xAF: new SM83_opcode_info(0xAF, SM83_MN.RES_idx_di, 5, 'A'),

    0xB0: new SM83_opcode_info(0xB0, SM83_MN.RES_idx_di, 6, 'B'),
    0xB1: new SM83_opcode_info(0xB1, SM83_MN.RES_idx_di, 6, 'C'),
    0xB2: new SM83_opcode_info(0xB2, SM83_MN.RES_idx_di, 6, 'D'),
    0xB3: new SM83_opcode_info(0xB3, SM83_MN.RES_idx_di, 6, 'E'),
    0xB4: new SM83_opcode_info(0xB4, SM83_MN.RES_idx_di, 6, 'H'),
    0xB5: new SM83_opcode_info(0xB5, SM83_MN.RES_idx_di, 6, 'L'),
    0xB6: new SM83_opcode_info(0xB6, SM83_MN.RES_idx_ind, 6, 'HL'),
    0xB7: new SM83_opcode_info(0xB7, SM83_MN.RES_idx_di, 6, 'A'),
    0xB8: new SM83_opcode_info(0xB8, SM83_MN.RES_idx_di, 7, 'B'),
    0xB9: new SM83_opcode_info(0xB9, SM83_MN.RES_idx_di, 7, 'C'),
    0xBA: new SM83_opcode_info(0xBA, SM83_MN.RES_idx_di, 7, 'D'),
    0xBB: new SM83_opcode_info(0xBB, SM83_MN.RES_idx_di, 7, 'E'),
    0xBC: new SM83_opcode_info(0xBC, SM83_MN.RES_idx_di, 7, 'H'),
    0xBD: new SM83_opcode_info(0xBD, SM83_MN.RES_idx_di, 7, 'L'),
    0xBE: new SM83_opcode_info(0xBE, SM83_MN.RES_idx_ind, 7, 'HL'),
    0xBF: new SM83_opcode_info(0xBF, SM83_MN.RES_idx_di, 7, 'A'),

    0xC0: new SM83_opcode_info(0xC0, SM83_MN.SET_idx_di, 0, 'B'),
    0xC1: new SM83_opcode_info(0xC1, SM83_MN.SET_idx_di, 0, 'C'),
    0xC2: new SM83_opcode_info(0xC2, SM83_MN.SET_idx_di, 0, 'D'),
    0xC3: new SM83_opcode_info(0xC3, SM83_MN.SET_idx_di, 0, 'E'),
    0xC4: new SM83_opcode_info(0xC4, SM83_MN.SET_idx_di, 0, 'H'),
    0xC5: new SM83_opcode_info(0xC5, SM83_MN.SET_idx_di, 0, 'L'),
    0xC6: new SM83_opcode_info(0xC6, SM83_MN.SET_idx_ind, 0, 'HL'),
    0xC7: new SM83_opcode_info(0xC7, SM83_MN.SET_idx_di, 0, 'A'),
    0xC8: new SM83_opcode_info(0xC8, SM83_MN.SET_idx_di, 1, 'B'),
    0xC9: new SM83_opcode_info(0xC9, SM83_MN.SET_idx_di, 1, 'C'),
    0xCA: new SM83_opcode_info(0xCA, SM83_MN.SET_idx_di, 1, 'D'),
    0xCB: new SM83_opcode_info(0xCB, SM83_MN.SET_idx_di, 1, 'E'),
    0xCC: new SM83_opcode_info(0xCC, SM83_MN.SET_idx_di, 1, 'H'),
    0xCD: new SM83_opcode_info(0xCD, SM83_MN.SET_idx_di, 1, 'L'),
    0xCE: new SM83_opcode_info(0xCE, SM83_MN.SET_idx_ind, 1, 'HL'),
    0xCF: new SM83_opcode_info(0xCF, SM83_MN.SET_idx_di, 1, 'A'),

    0xD0: new SM83_opcode_info(0xD0, SM83_MN.SET_idx_di, 2, 'B'),
    0xD1: new SM83_opcode_info(0xD1, SM83_MN.SET_idx_di, 2, 'C'),
    0xD2: new SM83_opcode_info(0xD2, SM83_MN.SET_idx_di, 2, 'D'),
    0xD3: new SM83_opcode_info(0xD3, SM83_MN.SET_idx_di, 2, 'E'),
    0xD4: new SM83_opcode_info(0xD4, SM83_MN.SET_idx_di, 2, 'H'),
    0xD5: new SM83_opcode_info(0xD5, SM83_MN.SET_idx_di, 2, 'L'),
    0xD6: new SM83_opcode_info(0xD6, SM83_MN.SET_idx_ind, 2, 'HL'),
    0xD7: new SM83_opcode_info(0xD7, SM83_MN.SET_idx_di, 2, 'A'),
    0xD8: new SM83_opcode_info(0xD8, SM83_MN.SET_idx_di, 3, 'B'),
    0xD9: new SM83_opcode_info(0xD9, SM83_MN.SET_idx_di, 3, 'C'),
    0xDA: new SM83_opcode_info(0xDA, SM83_MN.SET_idx_di, 3, 'D'),
    0xDB: new SM83_opcode_info(0xDB, SM83_MN.SET_idx_di, 3, 'E'),
    0xDC: new SM83_opcode_info(0xDC, SM83_MN.SET_idx_di, 3, 'H'),
    0xDD: new SM83_opcode_info(0xDD, SM83_MN.SET_idx_di, 3, 'L'),
    0xDE: new SM83_opcode_info(0xDE, SM83_MN.SET_idx_ind, 3, 'HL'),
    0xDF: new SM83_opcode_info(0xDF, SM83_MN.SET_idx_di, 3, 'A'),

    0xE0: new SM83_opcode_info(0xE0, SM83_MN.SET_idx_di, 4, 'B'),
    0xE1: new SM83_opcode_info(0xE1, SM83_MN.SET_idx_di, 4, 'C'),
    0xE2: new SM83_opcode_info(0xE2, SM83_MN.SET_idx_di, 4, 'D'),
    0xE3: new SM83_opcode_info(0xE3, SM83_MN.SET_idx_di, 4, 'E'),
    0xE4: new SM83_opcode_info(0xE4, SM83_MN.SET_idx_di, 4, 'H'),
    0xE5: new SM83_opcode_info(0xE5, SM83_MN.SET_idx_di, 4, 'L'),
    0xE6: new SM83_opcode_info(0xE6, SM83_MN.SET_idx_ind, 4, 'HL'),
    0xE7: new SM83_opcode_info(0xE7, SM83_MN.SET_idx_di, 4, 'A'),
    0xE8: new SM83_opcode_info(0xE8, SM83_MN.SET_idx_di, 5, 'B'),
    0xE9: new SM83_opcode_info(0xE9, SM83_MN.SET_idx_di, 5, 'C'),
    0xEA: new SM83_opcode_info(0xEA, SM83_MN.SET_idx_di, 5, 'D'),
    0xEB: new SM83_opcode_info(0xEB, SM83_MN.SET_idx_di, 5, 'E'),
    0xEC: new SM83_opcode_info(0xEC, SM83_MN.SET_idx_di, 5, 'H'),
    0xED: new SM83_opcode_info(0xED, SM83_MN.SET_idx_di, 5, 'L'),
    0xEE: new SM83_opcode_info(0xEE, SM83_MN.SET_idx_ind, 5, 'HL'),
    0xEF: new SM83_opcode_info(0xEF, SM83_MN.SET_idx_di, 5, 'A'),

    0xF0: new SM83_opcode_info(0xF0, SM83_MN.SET_idx_di, 6, 'B'),
    0xF1: new SM83_opcode_info(0xF1, SM83_MN.SET_idx_di, 6, 'C'),
    0xF2: new SM83_opcode_info(0xF2, SM83_MN.SET_idx_di, 6, 'D'),
    0xF3: new SM83_opcode_info(0xF3, SM83_MN.SET_idx_di, 6, 'E'),
    0xF4: new SM83_opcode_info(0xF4, SM83_MN.SET_idx_di, 6, 'H'),
    0xF5: new SM83_opcode_info(0xF5, SM83_MN.SET_idx_di, 6, 'L'),
    0xF6: new SM83_opcode_info(0xF6, SM83_MN.SET_idx_ind, 6, 'HL'),
    0xF7: new SM83_opcode_info(0xF7, SM83_MN.SET_idx_di, 6, 'A'),
    0xF8: new SM83_opcode_info(0xF8, SM83_MN.SET_idx_di, 7, 'B'),
    0xF9: new SM83_opcode_info(0xF9, SM83_MN.SET_idx_di, 7, 'C'),
    0xFA: new SM83_opcode_info(0xFA, SM83_MN.SET_idx_di, 7, 'D'),
    0xFB: new SM83_opcode_info(0xFB, SM83_MN.SET_idx_di, 7, 'E'),
    0xFC: new SM83_opcode_info(0xFC, SM83_MN.SET_idx_di, 7, 'H'),
    0xFD: new SM83_opcode_info(0xFD, SM83_MN.SET_idx_di, 7, 'L'),
    0xFE: new SM83_opcode_info(0xFE, SM83_MN.SET_idx_ind, 7, 'HL'),
    0xFF: new SM83_opcode_info(0xFF, SM83_MN.SET_idx_di, 7, 'A'),
});

// SPECIAL #. This is above Z80_MAX because it is special-case handled by cycle()
const SM83_HALT = 0x76;
const SM83_S_DECODE = 0x102;
const SM83_MAX_OPCODE = 0x101;

const SM83_prefixes = [0, 0xCB]
const SM83_prefix_to_codemap = Object.freeze({
    [SM83_prefixes[0]]: 0x00,
    [SM83_prefixes[1]]: (SM83_MAX_OPCODE + 1),
});

class SM83_opcode_functions {
    constructor(opcode_info, exec_func) {
        this.opcode = opcode_info.opcode;
        this.ins = opcode_info.ins;
        this.mnemonic = opcode_info.mnemonic;
        this.exec_func = exec_func;
    }
}

function SM83_C_func_name(mo, CB=false) {
    if (CB)
        return 'SM83_ins_CB' + hex2(mo.opcode) + '_' + SM83_MN_R[mo.ins];
    else
        return 'SM83_ins_' + hex2(mo.opcode) + '_' + SM83_MN_R[mo.ins];
}

function SM83_C_func_signature(mo, CB=false) {
    return 'void ' + SM83_C_func_name(mo, CB) + '(struct SM83_regs *regs, struct SM83_pins *pins)'
}

function SM83_C_func_dec(mo, CB=false) {
    let o = SM83_C_func_signature(mo, CB) + ';';
    if (mo.arg1 || mo.arg2)
        o += ' // '
    if (mo.arg1) {
        o += mo.arg1;
        if (mo.arg2) o += ', '
    }// ' + mo.arg1 + ', ' + mo.arg2 + '\n';
    if (mo.arg2) o += mo.arg2;
    return o + '\n';
}

function sm83_opcode_func_gen_c() {
    let o = '';
    let o2 = 'SM83_ins_func SM83_decoded_opcodes[0x202] = {\n';
    let MISSING_OPCODES = [0xCB, 0xD3, 0xDB, 0xDD, 0xE3, 0xE4, 0xEB, 0xEC, 0xED, 0xF4, 0xFC, 0xFD]
    let perline = 0;
    for (let i in SM83_opcode_matrix) {
        let mo = SM83_opcode_matrix[i];
        let mstr;
        mstr = SM83_C_func_dec(mo, false);
        o2 += '  &' + SM83_C_func_name(mo, false) + ',';
        perline++;
        if (perline === 5) {
            perline = 0;
            o2 += '\n';
        }
        else o2 += ' ';
        o += mstr;
    }
    o2 += '\n'
    perline = 0;
    for (let i in SM83_opcode_matrixCB) {
        let mo = SM83_opcode_matrixCB[i];
        let mstr = SM83_C_func_dec(mo, true);
        o += mstr;
        o2 += '  &' + SM83_C_func_name(mo, true) + ','
        perline++;
        if (perline === 5) {
            perline = 0;
            o2 += '\n';
        }
        else o2 += ' ';
    }
    o2 += '\n';

    o2 += '};\n';
    let header = '#ifndef _JSMOOCH_SM83_OPCODES_H\n' +
        '#define _JSMOOCH_SM83_OPCODES_H\n' +
        '\n' +
        '#include "sm83_misc.h"\n' +
        '\n' +
        '// This file mostly generated by sm83_opcodes.js in JSMoo\n' +
        '\n'

    return header + o + '\n' + o2 + '\n#endif';
}

//console.log(sm83_opcode_func_gen_c());