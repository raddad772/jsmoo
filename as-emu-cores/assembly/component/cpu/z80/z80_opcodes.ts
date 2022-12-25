import {z80_pins, z80_regs} from "./z80";

export function Z80_parity(val: u32): u32 {
    val ^= val >>> 4;
    val ^= val >>> 2;
    val ^= val >>> 1;
    return +((val & 1) === 0);
}

export enum Z80_MN {
  UKN = 0,
  ADC_a_irr = 1,
  ADC_a_n = 2,
  ADC_a_r = 3,
  ADC_hl_rr = 4,
  ADD_a_irr = 5,
  ADD_a_n = 6,
  ADD_a_r = 7,
  ADD_hl_rr = 8,
  AND_a_irr = 9,
  AND_a_n = 10,
  AND_a_r = 11,
  BIT_o_irr = 12,
  BIT_o_irr_r = 13,
  BIT_o_r = 14,
  CALL_c_nn = 15,
  CALL_nn = 16,
  CCF = 17,
  CP_a_irr = 18,
  CP_a_n = 19,
  CP_a_r = 20,
  CPD = 21,
  CPDR = 22,
  CPI = 23,
  CPIR = 24,
  CPL = 25,
  DAA = 26,
  DEC_irr = 27,
  DEC_r = 28,
  DEC_rr = 29,
  DI = 30,
  DJNZ_e = 31,
  EI = 32,
  EX_irr_rr = 33,
  EX_rr_rr = 34,
  EXX = 35,
  HALT = 36,
  IM_o = 37,
  IN_a_in = 38,
  IN_r_ic = 39,
  IN_ic = 40,
  INC_irr = 41,
  INC_r = 42,
  INC_rr = 43,
  IND = 44,
  INDR = 45,
  INI = 46,
  INIR = 47,
  JP_c_nn = 48,
  JP_rr = 49,
  JR_c_e = 50,
  LD_a_inn = 51,
  LD_a_irr = 52,
  LD_inn_a = 53,
  LD_inn_rr = 54,
  LD_irr_a = 55,
  LD_irr_n = 56,
  LD_irr_r = 57,
  LD_r_n = 58,
  LD_r_irr = 59,
  LD_r_r = 60,
  LD_r_r1 = 61,
  LD_r_r2 = 62,
  LD_rr_inn = 63,
  LD_rr_nn = 64,
  LD_sp_rr = 65,
  LDD = 66,
  LDDR = 67,
  LDI = 68,
  LDIR = 69,
  NEG = 70,
  NOP = 71,
  OR_a_irr = 72,
  OR_a_n = 73,
  OR_a_r = 74,
  OTDR = 75,
  OTIR = 76,
  OUT_ic_r = 77,
  OUT_ic = 78,
  OUT_in_a = 79,
  OUTD = 80,
  OUTI = 81,
  POP_rr = 82,
  PUSH_rr = 83,
  RES_o_irr = 84,
  RES_o_irr_r = 85,
  RES_o_r = 86,
  RET = 87,
  RET_c = 88,
  RETI = 89,
  RETN = 90,
  RL_irr = 91,
  RL_irr_r = 92,
  RL_r = 93,
  RLA = 94,
  RLC_irr = 95,
  RLC_irr_r = 96,
  RLC_r = 97,
  RLCA = 98,
  RLD = 99,
  RR_irr = 100,
  RR_irr_r = 101,
  RR_r = 102,
  RRA = 103,
  RRC_irr = 104,
  RRC_irr_r = 105,
  RRC_r = 106,
  RRCA = 107,
  RRD = 108,
  RST_o = 109,
  SBC_a_irr = 110,
  SBC_a_n = 111,
  SBC_a_r = 112,
  SBC_hl_rr = 113,
  SCF = 114,
  SET_o_irr = 115,
  SET_o_irr_r = 116,
  SET_o_r = 117,
  SLA_irr = 118,
  SLA_irr_r = 119,
  SLA_r = 120,
  SLL_irr = 121,
  SLL_irr_r = 122,
  SLL_r = 123,
  SRA_irr = 124,
  SRA_irr_r = 125,
  SRA_r = 126,
  SRL_irr = 127,
  SRL_irr_r = 128,
  SRL_r = 129,
  SUB_a_irr = 130,
  SUB_a_n = 131,
  SUB_a_r = 132,
  XOR_a_irr = 133,
  XOR_a_n = 134,
  XOR_a_r = 135,
  IRQ = 136,
  RESET = 137,
}

export function Z80_MN_R(mn: Z80_MN): string {
    switch(mn) {
        case 0: return 'UKN';
        case 1: return 'ADC_a_irr';
        case 2: return 'ADC_a_n';
        case 3: return 'ADC_a_r';
        case 4: return 'ADC_hl_rr';
        case 5: return 'ADD_a_irr';
        case 6: return 'ADD_a_n';
        case 7: return 'ADD_a_r';
        case 8: return 'ADD_hl_rr';
        case 9: return 'AND_a_irr';
        case 10: return 'AND_a_n';
        case 11: return 'AND_a_r';
        case 12: return 'BIT_o_irr';
        case 13: return 'BIT_o_irr_r';
        case 14: return 'BIT_o_r';
        case 15: return 'CALL_c_nn';
        case 16: return 'CALL_nn';
        case 17: return 'CCF';
        case 18: return 'CP_a_irr';
        case 19: return 'CP_a_n';
        case 20: return 'CP_a_r';
        case 21: return 'CPD';
        case 22: return 'CPDR';
        case 23: return 'CPI';
        case 24: return 'CPIR';
        case 25: return 'CPL';
        case 26: return 'DAA';
        case 27: return 'DEC_irr';
        case 28: return 'DEC_r';
        case 29: return 'DEC_rr';
        case 30: return 'DI';
        case 31: return 'DJNZ_e';
        case 32: return 'EI';
        case 33: return 'EX_irr_rr';
        case 34: return 'EX_rr_rr';
        case 35: return 'EXX';
        case 36: return 'HALT';
        case 37: return 'IM_o';
        case 38: return 'IN_a_in';
        case 39: return 'IN_r_ic';
        case 40: return 'IN_ic';
        case 41: return 'INC_irr';
        case 42: return 'INC_r';
        case 43: return 'INC_rr';
        case 44: return 'IND';
        case 45: return 'INDR';
        case 46: return 'INI';
        case 47: return 'INIR';
        case 48: return 'JP_c_nn';
        case 49: return 'JP_rr';
        case 50: return 'JR_c_e';
        case 51: return 'LD_a_inn';
        case 52: return 'LD_a_irr';
        case 53: return 'LD_inn_a';
        case 54: return 'LD_inn_rr';
        case 55: return 'LD_irr_a';
        case 56: return 'LD_irr_n';
        case 57: return 'LD_irr_r';
        case 58: return 'LD_r_n';
        case 59: return 'LD_r_irr';
        case 60: return 'LD_r_r';
        case 61: return 'LD_r_r1';
        case 62: return 'LD_r_r2';
        case 63: return 'LD_rr_inn';
        case 64: return 'LD_rr_nn';
        case 65: return 'LD_sp_rr';
        case 66: return 'LDD';
        case 67: return 'LDDR';
        case 68: return 'LDI';
        case 69: return 'LDIR';
        case 70: return 'NEG';
        case 71: return 'NOP';
        case 72: return 'OR_a_irr';
        case 73: return 'OR_a_n';
        case 74: return 'OR_a_r';
        case 75: return 'OTDR';
        case 76: return 'OTIR';
        case 77: return 'OUT_ic_r';
        case 78: return 'OUT_ic';
        case 79: return 'OUT_in_a';
        case 80: return 'OUTD';
        case 81: return 'OUTI';
        case 82: return 'POP_rr';
        case 83: return 'PUSH_rr';
        case 84: return 'RES_o_irr';
        case 85: return 'RES_o_irr_r';
        case 86: return 'RES_o_r';
        case 87: return 'RET';
        case 88: return 'RET_c';
        case 89: return 'RETI';
        case 90: return 'RETN';
        case 91: return 'RL_irr';
        case 92: return 'RL_irr_r';
        case 93: return 'RL_r';
        case 94: return 'RLA';
        case 95: return 'RLC_irr';
        case 96: return 'RLC_irr_r';
        case 97: return 'RLC_r';
        case 98: return 'RLCA';
        case 99: return 'RLD';
        case 100: return 'RR_irr';
        case 101: return 'RR_irr_r';
        case 102: return 'RR_r';
        case 103: return 'RRA';
        case 104: return 'RRC_irr';
        case 105: return 'RRC_irr_r';
        case 106: return 'RRC_r';
        case 107: return 'RRCA';
        case 108: return 'RRD';
        case 109: return 'RST_o';
        case 110: return 'SBC_a_irr';
        case 111: return 'SBC_a_n';
        case 112: return 'SBC_a_r';
        case 113: return 'SBC_hl_rr';
        case 114: return 'SCF';
        case 115: return 'SET_o_irr';
        case 116: return 'SET_o_irr_r';
        case 117: return 'SET_o_r';
        case 118: return 'SLA_irr';
        case 119: return 'SLA_irr_r';
        case 120: return 'SLA_r';
        case 121: return 'SLL_irr';
        case 122: return 'SLL_irr_r';
        case 123: return 'SLL_r';
        case 124: return 'SRA_irr';
        case 125: return 'SRA_irr_r';
        case 126: return 'SRA_r';
        case 127: return 'SRL_irr';
        case 128: return 'SRL_irr_r';
        case 129: return 'SRL_r';
        case 130: return 'SUB_a_irr';
        case 131: return 'SUB_a_n';
        case 132: return 'SUB_a_r';
        case 133: return 'XOR_a_irr';
        case 134: return 'XOR_a_n';
        case 135: return 'XOR_a_r';
        case 136: return 'IRQ';
        case 137: return 'RESET';
        default: return 'ILLEGAL';
    }
}

export class Z80_opcode_info {
    opcode: u32
    ins: Z80_MN
    mnemonic: string
    arg1: string
    arg2: string
    arg3: string

    constructor(opcode: u32, ins: Z80_MN, mnemonic: string, arg1: string = '', arg2: string = '', arg3: string = '') {
        this.opcode = opcode;
        this.ins = ins;
        let m: string = Z80_MN_R(ins);
        if (arg1.length > 0) m += ' ' + arg1;
        if (arg2.length > 0) m += ' ' + arg2;
        if (arg3.length > 0) m += ' ' + arg3;
        this.mnemonic = m;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.arg3 = arg3;
    }
}

//const Z80_opcode_matrix_premn = {
export var Z80_opcode_matrix_premn: Map<u32, Z80_opcode_info> = new Map<u32, Z80_opcode_info>();
export var Z80_CB_opcode_matrix_premn: Map<u32, Z80_opcode_info> = new Map<u32, Z80_opcode_info>();
export var Z80_CBd_opcode_matrix_premn: Map<u32, Z80_opcode_info> = new Map<u32, Z80_opcode_info>();
export var Z80_ED_opcode_matrix_premn: Map<u32, Z80_opcode_info> = new Map<u32, Z80_opcode_info>();

function Z80_opcode_matrix_premn_func(opcode: u32) {
    switch(opcode) {
        case 0x00: return new Z80_opcode_info(0x00, Z80_MN.NOP, 'NOP');
        case 0x01: return new Z80_opcode_info(0x01, Z80_MN.LD_rr_nn, 'LD_rr_nn BC', 'BC');
        case 0x02: return new Z80_opcode_info(0x02, Z80_MN.LD_irr_a, 'LD_irr_a BC', 'BC');
        case 0x03: return new Z80_opcode_info(0x03, Z80_MN.INC_rr, 'INC_rr BC', 'BC');
        case 0x04: return new Z80_opcode_info(0x04, Z80_MN.INC_r, 'INC_r B', 'B');
        case 0x05: return new Z80_opcode_info(0x05, Z80_MN.DEC_r, 'DEC_r B', 'B');
        case 0x06: return new Z80_opcode_info(0x06, Z80_MN.LD_r_n, 'LD_r_n B', 'B');
        case 0x07: return new Z80_opcode_info(0x07, Z80_MN.RLCA, 'RLCA');
        case 0x08: return new Z80_opcode_info(0x08, Z80_MN.EX_rr_rr, 'EX_rr_rr AF AF_', 'AF', 'AF_');
        case 0x09: return new Z80_opcode_info(0x09, Z80_MN.ADD_hl_rr, 'ADD_hl_rr BC', 'BC');
        case 0x0A: return new Z80_opcode_info(0x0A, Z80_MN.LD_a_irr, 'LD_a_irr BC', 'BC');
        case 0x0B: return new Z80_opcode_info(0x0B, Z80_MN.DEC_rr, 'DEC_rr BC', 'BC');
        case 0x0C: return new Z80_opcode_info(0x0C, Z80_MN.INC_r, 'INC_r C', 'C');
        case 0x0D: return new Z80_opcode_info(0x0D, Z80_MN.DEC_r, 'DEC_r C', 'C');
        case 0x0E: return new Z80_opcode_info(0x0E, Z80_MN.LD_r_n, 'LD_r_n C', 'C');
        case 0x0F: return new Z80_opcode_info(0x0F, Z80_MN.RRCA, 'RRCA');

        case 0x10: return new Z80_opcode_info(0x10, Z80_MN.DJNZ_e, 'DJNZ_e');
        case 0x11: return new Z80_opcode_info(0x11, Z80_MN.LD_rr_nn, 'LD_rr_nn DE', 'DE');
        case 0x12: return new Z80_opcode_info(0x12, Z80_MN.LD_irr_a, 'LD_irr_a DE', 'DE');
        case 0x13: return new Z80_opcode_info(0x13, Z80_MN.INC_rr, 'INC_rr DE', 'DE');
        case 0x14: return new Z80_opcode_info(0x14, Z80_MN.INC_r, '', 'D');
        case 0x15: return new Z80_opcode_info(0x15, Z80_MN.DEC_r, '', 'D');
        case 0x16: return new Z80_opcode_info(0x16, Z80_MN.LD_r_n, '', 'D');
        case 0x17: return new Z80_opcode_info(0x17, Z80_MN.RLA, '');
        case 0x18: return new Z80_opcode_info(0x18, Z80_MN.JR_c_e, '','1');
        case 0x19: return new Z80_opcode_info(0x19, Z80_MN.ADD_hl_rr, '','DE');
        case 0x1A: return new Z80_opcode_info(0x1A, Z80_MN.LD_a_irr, '', 'DE');
        case 0x1B: return new Z80_opcode_info(0x1B, Z80_MN.DEC_rr, '', 'DE');
        case 0x1C: return new Z80_opcode_info(0x1C, Z80_MN.INC_r, '', 'E');
        case 0x1D: return new Z80_opcode_info(0x1D, Z80_MN.DEC_r, '', 'E');
        case 0x1E: return new Z80_opcode_info(0x1E, Z80_MN.LD_r_n, '', 'E');
        case 0x1F: return new Z80_opcode_info(0x1F, Z80_MN.RRA, 'RRA');

        case 0x20: return new Z80_opcode_info(0x20, Z80_MN.JR_c_e, '', 'regs.F.Z === 0');
        case 0x21: return new Z80_opcode_info(0x21, Z80_MN.LD_rr_nn, '', 'HL');
        case 0x22: return new Z80_opcode_info(0x22, Z80_MN.LD_inn_rr, '', 'HL');
        case 0x23: return new Z80_opcode_info(0x23, Z80_MN.INC_rr, '', 'HL');
        case 0x24: return new Z80_opcode_info(0x24, Z80_MN.INC_r, '', 'H');
        case 0x25: return new Z80_opcode_info(0x25, Z80_MN.DEC_r, '', 'H');
        case 0x26: return new Z80_opcode_info(0x26, Z80_MN.LD_r_n, '', 'H');
        case 0x27: return new Z80_opcode_info(0x27, Z80_MN.DAA, 'DAA');
        case 0x28: return new Z80_opcode_info(0x28, Z80_MN.JR_c_e, '', 'regs.F.Z === 1');
        case 0x29: return new Z80_opcode_info(0x29, Z80_MN.ADD_hl_rr, '', 'HL');
        case 0x2A: return new Z80_opcode_info(0x2A, Z80_MN.LD_rr_inn, '', 'HL');
        case 0x2B: return new Z80_opcode_info(0x2B, Z80_MN.DEC_rr, '', 'HL');
        case 0x2C: return new Z80_opcode_info(0x2C, Z80_MN.INC_r, '', 'L');
        case 0x2D: return new Z80_opcode_info(0x2D, Z80_MN.DEC_r, '', 'L');
        case 0x2E: return new Z80_opcode_info(0x2E, Z80_MN.LD_r_n, '', 'L');
        case 0x2F: return new Z80_opcode_info(0x2F, Z80_MN.CPL, 'CPL');

        case 0x30: return new Z80_opcode_info(0x30, Z80_MN.JR_c_e, '', 'regs.F.C === 0');
        case 0x31: return new Z80_opcode_info(0x31, Z80_MN.LD_rr_nn, '', 'SP');
        case 0x32: return new Z80_opcode_info(0x32, Z80_MN.LD_inn_a, '');
        case 0x33: return new Z80_opcode_info(0x33, Z80_MN.INC_rr, '', 'SP');
        case 0x34: return new Z80_opcode_info(0x34, Z80_MN.INC_irr, '', 'HL');
        case 0x35: return new Z80_opcode_info(0x35, Z80_MN.DEC_irr, '', 'HL');
        case 0x36: return new Z80_opcode_info(0x36, Z80_MN.LD_irr_n, '', 'HL');
        case 0x37: return new Z80_opcode_info(0x37, Z80_MN.SCF, 'SCF');
        case 0x38: return new Z80_opcode_info(0x38, Z80_MN.JR_c_e, '', 'regs.F.C === 1');
        case 0x39: return new Z80_opcode_info(0x39, Z80_MN.ADD_hl_rr, '', 'SP');
        case 0x3A: return new Z80_opcode_info(0x3A, Z80_MN.LD_a_inn, '');
        case 0x3B: return new Z80_opcode_info(0x3B, Z80_MN.DEC_rr, '', 'SP');
        case 0x3C: return new Z80_opcode_info(0x3C, Z80_MN.INC_r, '', 'A');
        case 0x3D: return new Z80_opcode_info(0x3D, Z80_MN.DEC_r, '', 'A');
        case 0x3E: return new Z80_opcode_info(0x3E, Z80_MN.LD_r_n, '', 'A');
        case 0x3F: return new Z80_opcode_info(0x3F, Z80_MN.CCF, 'CCF');

        case 0x40: return new Z80_opcode_info(0x40, Z80_MN.LD_r_r, '', 'B', 'B');
        case 0x41: return new Z80_opcode_info(0x41, Z80_MN.LD_r_r, '', 'B', 'C');
        case 0x42: return new Z80_opcode_info(0x42, Z80_MN.LD_r_r, '', 'B', 'D');
        case 0x43: return new Z80_opcode_info(0x43, Z80_MN.LD_r_r, '', 'B', 'E');
        case 0x44: return new Z80_opcode_info(0x44, Z80_MN.LD_r_r, '', 'B', 'H');
        case 0x45: return new Z80_opcode_info(0x45, Z80_MN.LD_r_r, '', 'B', 'L');
        case 0x46: return new Z80_opcode_info(0x46, Z80_MN.LD_r_irr, '', 'B', 'HL');
        case 0x47: return new Z80_opcode_info(0x47, Z80_MN.LD_r_r, '', 'B', 'A');
        case 0x48: return new Z80_opcode_info(0x48, Z80_MN.LD_r_r, '', 'C', 'B');
        case 0x49: return new Z80_opcode_info(0x49, Z80_MN.LD_r_r, '', 'C', 'C');
        case 0x4A: return new Z80_opcode_info(0x4A, Z80_MN.LD_r_r, '', 'C', 'D');
        case 0x4B: return new Z80_opcode_info(0x4B, Z80_MN.LD_r_r, '', 'C', 'E');
        case 0x4C: return new Z80_opcode_info(0x4C, Z80_MN.LD_r_r, '', 'C', 'H');
        case 0x4D: return new Z80_opcode_info(0x4D, Z80_MN.LD_r_r, '', 'C', 'L');
        case 0x4E: return new Z80_opcode_info(0x4E, Z80_MN.LD_r_irr, '', 'C', 'HL');
        case 0x4F: return new Z80_opcode_info(0x4F, Z80_MN.LD_r_r, '', 'C', 'A');

        case 0x50: return new Z80_opcode_info(0x50, Z80_MN.LD_r_r, '', 'D', 'B');
        case 0x51: return new Z80_opcode_info(0x51, Z80_MN.LD_r_r, '', 'D', 'C');
        case 0x52: return new Z80_opcode_info(0x52, Z80_MN.LD_r_r, '', 'D', 'D');
        case 0x53: return new Z80_opcode_info(0x53, Z80_MN.LD_r_r, '', 'D', 'E');
        case 0x54: return new Z80_opcode_info(0x54, Z80_MN.LD_r_r, '', 'D', 'H');
        case 0x55: return new Z80_opcode_info(0x55, Z80_MN.LD_r_r, '', 'D', 'L');
        case 0x56: return new Z80_opcode_info(0x56, Z80_MN.LD_r_irr, '', 'D', 'HL');
        case 0x57: return new Z80_opcode_info(0x57, Z80_MN.LD_r_r, '', 'D', 'A');
        case 0x58: return new Z80_opcode_info(0x58, Z80_MN.LD_r_r, '', 'E', 'B');
        case 0x59: return new Z80_opcode_info(0x59, Z80_MN.LD_r_r, '', 'E', 'C');
        case 0x5A: return new Z80_opcode_info(0x5A, Z80_MN.LD_r_r, '', 'E', 'D');
        case 0x5B: return new Z80_opcode_info(0x5B, Z80_MN.LD_r_r, '', 'E', 'E');
        case 0x5C: return new Z80_opcode_info(0x5C, Z80_MN.LD_r_r, '', 'E', 'H');
        case 0x5D: return new Z80_opcode_info(0x5D, Z80_MN.LD_r_r, '', 'E', 'L');
        case 0x5E: return new Z80_opcode_info(0x5E, Z80_MN.LD_r_irr, '', 'E', 'HL');
        case 0x5F: return new Z80_opcode_info(0x5F, Z80_MN.LD_r_r, '', 'E', 'A');

        case 0x60: return new Z80_opcode_info(0x60, Z80_MN.LD_r_r, '', 'H', 'B');
        case 0x61: return new Z80_opcode_info(0x61, Z80_MN.LD_r_r, '', 'H', 'C');
        case 0x62: return new Z80_opcode_info(0x62, Z80_MN.LD_r_r, '', 'H', 'D');
        case 0x63: return new Z80_opcode_info(0x63, Z80_MN.LD_r_r, '', 'H', 'E');
        case 0x64: return new Z80_opcode_info(0x64, Z80_MN.LD_r_r, '', 'H', 'H');
        case 0x65: return new Z80_opcode_info(0x65, Z80_MN.LD_r_r, '', 'H', 'L');
        case 0x66: return new Z80_opcode_info(0x66, Z80_MN.LD_r_irr, '', '_H', 'HL'); // TODO: here
        case 0x67: return new Z80_opcode_info(0x67, Z80_MN.LD_r_r, '', 'H', 'A');
        case 0x68: return new Z80_opcode_info(0x68, Z80_MN.LD_r_r, '', 'L', 'B');
        case 0x69: return new Z80_opcode_info(0x69, Z80_MN.LD_r_r, '', 'L', 'C');
        case 0x6A: return new Z80_opcode_info(0x6A, Z80_MN.LD_r_r, '', 'L', 'D');
        case 0x6B: return new Z80_opcode_info(0x6B, Z80_MN.LD_r_r, '', 'L', 'E');
        case 0x6C: return new Z80_opcode_info(0x6C, Z80_MN.LD_r_r, '', 'L', 'H');
        case 0x6D: return new Z80_opcode_info(0x6D, Z80_MN.LD_r_r, '', 'L', 'L');
        case 0x6E: return new Z80_opcode_info(0x6E, Z80_MN.LD_r_irr, '', '_L', 'HL'); // TODO: here
        case 0x6F: return new Z80_opcode_info(0x6F, Z80_MN.LD_r_r, '', 'L', 'A');

        case 0x70: return new Z80_opcode_info(0x70, Z80_MN.LD_irr_r, '', 'HL', 'B');
        case 0x71: return new Z80_opcode_info(0x71, Z80_MN.LD_irr_r, '', 'HL', 'C');
        case 0x72: return new Z80_opcode_info(0x72, Z80_MN.LD_irr_r, '', 'HL', 'D');
        case 0x73: return new Z80_opcode_info(0x73, Z80_MN.LD_irr_r, '', 'HL', 'E');
        case 0x74: return new Z80_opcode_info(0x74, Z80_MN.LD_irr_r, '', 'HL', '_H');
        case 0x75: return new Z80_opcode_info(0x75, Z80_MN.LD_irr_r, '', 'HL', '_L');
        case 0x76: return new Z80_opcode_info(0x76, Z80_MN.HALT, 'HALT');
        case 0x77: return new Z80_opcode_info(0x77, Z80_MN.LD_irr_r, '', 'HL', 'A');
        case 0x78: return new Z80_opcode_info(0x78, Z80_MN.LD_r_r, '', 'A', 'B');
        case 0x79: return new Z80_opcode_info(0x79, Z80_MN.LD_r_r, '', 'A', 'C');
        case 0x7A: return new Z80_opcode_info(0x7A, Z80_MN.LD_r_r, '', 'A', 'D');
        case 0x7B: return new Z80_opcode_info(0x7B, Z80_MN.LD_r_r, '', 'A', 'E');
        case 0x7C: return new Z80_opcode_info(0x7C, Z80_MN.LD_r_r, '', 'A', 'H');
        case 0x7D: return new Z80_opcode_info(0x7D, Z80_MN.LD_r_r, '', 'A', 'L');
        case 0x7E: return new Z80_opcode_info(0x7E, Z80_MN.LD_r_irr, '', 'A', 'HL');
        case 0x7F: return new Z80_opcode_info(0x7F, Z80_MN.LD_r_r, '', 'A', 'A');

        case 0x80: return new Z80_opcode_info(0x80, Z80_MN.ADD_a_r, '', 'B');
        case 0x81: return new Z80_opcode_info(0x81, Z80_MN.ADD_a_r, '', 'C');
        case 0x82: return new Z80_opcode_info(0x82, Z80_MN.ADD_a_r, '', 'D');
        case 0x83: return new Z80_opcode_info(0x83, Z80_MN.ADD_a_r, '', 'E');
        case 0x84: return new Z80_opcode_info(0x84, Z80_MN.ADD_a_r, '', 'H');
        case 0x85: return new Z80_opcode_info(0x85, Z80_MN.ADD_a_r, '', 'L');
        case 0x86: return new Z80_opcode_info(0x86, Z80_MN.ADD_a_irr, '', 'HL');
        case 0x87: return new Z80_opcode_info(0x87, Z80_MN.ADD_a_r, '', 'A');
        case 0x88: return new Z80_opcode_info(0x88, Z80_MN.ADC_a_r, '', 'B');
        case 0x89: return new Z80_opcode_info(0x89, Z80_MN.ADC_a_r, '', 'C');
        case 0x8A: return new Z80_opcode_info(0x8A, Z80_MN.ADC_a_r, '', 'D');
        case 0x8B: return new Z80_opcode_info(0x8B, Z80_MN.ADC_a_r, '', 'E');
        case 0x8C: return new Z80_opcode_info(0x8C, Z80_MN.ADC_a_r, '', 'H');
        case 0x8D: return new Z80_opcode_info(0x8D, Z80_MN.ADC_a_r, '', 'L');
        case 0x8E: return new Z80_opcode_info(0x8E, Z80_MN.ADC_a_irr, '', 'HL');
        case 0x8F: return new Z80_opcode_info(0x8F, Z80_MN.ADC_a_r, '', 'A');

        case 0x90: return new Z80_opcode_info(0x90, Z80_MN.SUB_a_r, '', 'B');
        case 0x91: return new Z80_opcode_info(0x91, Z80_MN.SUB_a_r, '', 'C');
        case 0x92: return new Z80_opcode_info(0x92, Z80_MN.SUB_a_r, '', 'D');
        case 0x93: return new Z80_opcode_info(0x93, Z80_MN.SUB_a_r, '', 'E');
        case 0x94: return new Z80_opcode_info(0x94, Z80_MN.SUB_a_r, '', 'H');
        case 0x95: return new Z80_opcode_info(0x95, Z80_MN.SUB_a_r, '', 'L');
        case 0x96: return new Z80_opcode_info(0x96, Z80_MN.SUB_a_irr, '', 'HL');
        case 0x97: return new Z80_opcode_info(0x97, Z80_MN.SUB_a_r, '', 'A');
        case 0x98: return new Z80_opcode_info(0x98, Z80_MN.SBC_a_r, '', 'B');
        case 0x99: return new Z80_opcode_info(0x99, Z80_MN.SBC_a_r, '', 'C');
        case 0x9A: return new Z80_opcode_info(0x9A, Z80_MN.SBC_a_r, '', 'D');
        case 0x9B: return new Z80_opcode_info(0x9B, Z80_MN.SBC_a_r, '', 'E');
        case 0x9C: return new Z80_opcode_info(0x9C, Z80_MN.SBC_a_r, '', 'H');
        case 0x9D: return new Z80_opcode_info(0x9D, Z80_MN.SBC_a_r, '', 'L');
        case 0x9E: return new Z80_opcode_info(0x9E, Z80_MN.SBC_a_irr, '', 'HL');
        case 0x9F: return new Z80_opcode_info(0x9F, Z80_MN.SBC_a_r, '', 'A');

        case 0xA0: return new Z80_opcode_info(0xA0, Z80_MN.AND_a_r, '', 'B');
        case 0xA1: return new Z80_opcode_info(0xA1, Z80_MN.AND_a_r, '', 'C');
        case 0xA2: return new Z80_opcode_info(0xA2, Z80_MN.AND_a_r, '', 'D');
        case 0xA3: return new Z80_opcode_info(0xA3, Z80_MN.AND_a_r, '', 'E');
        case 0xA4: return new Z80_opcode_info(0xA4, Z80_MN.AND_a_r, '', 'H');
        case 0xA5: return new Z80_opcode_info(0xA5, Z80_MN.AND_a_r, '', 'L');
        case 0xA6: return new Z80_opcode_info(0xA6, Z80_MN.AND_a_irr, '', 'HL');
        case 0xA7: return new Z80_opcode_info(0xA7, Z80_MN.AND_a_r, '', 'A');
        case 0xA8: return new Z80_opcode_info(0xA8, Z80_MN.XOR_a_r, '', 'B');
        case 0xA9: return new Z80_opcode_info(0xA9, Z80_MN.XOR_a_r, '', 'C');
        case 0xAA: return new Z80_opcode_info(0xAA, Z80_MN.XOR_a_r, '', 'D');
        case 0xAB: return new Z80_opcode_info(0xAB, Z80_MN.XOR_a_r, '', 'E');
        case 0xAC: return new Z80_opcode_info(0xAC, Z80_MN.XOR_a_r, '', 'H');
        case 0xAD: return new Z80_opcode_info(0xAD, Z80_MN.XOR_a_r, '', 'L');
        case 0xAE: return new Z80_opcode_info(0xAE, Z80_MN.XOR_a_irr, '', 'HL');
        case 0xAF: return new Z80_opcode_info(0xAF, Z80_MN.XOR_a_r, '', 'A');

        case 0xB0: return new Z80_opcode_info(0xB0, Z80_MN.OR_a_r, '', 'B');
        case 0xB1: return new Z80_opcode_info(0xB1, Z80_MN.OR_a_r, '', 'C');
        case 0xB2: return new Z80_opcode_info(0xB2, Z80_MN.OR_a_r, '', 'D');
        case 0xB3: return new Z80_opcode_info(0xB3, Z80_MN.OR_a_r, '', 'E');
        case 0xB4: return new Z80_opcode_info(0xB4, Z80_MN.OR_a_r, '', 'H');
        case 0xB5: return new Z80_opcode_info(0xB5, Z80_MN.OR_a_r, '', 'L');
        case 0xB6: return new Z80_opcode_info(0xB6, Z80_MN.OR_a_irr, '', 'HL');
        case 0xB7: return new Z80_opcode_info(0xB7, Z80_MN.OR_a_r, '', 'A');
        case 0xB8: return new Z80_opcode_info(0xB8, Z80_MN.CP_a_r, '', 'B');
        case 0xB9: return new Z80_opcode_info(0xB9, Z80_MN.CP_a_r, '', 'C');
        case 0xBA: return new Z80_opcode_info(0xBA, Z80_MN.CP_a_r, '', 'D');
        case 0xBB: return new Z80_opcode_info(0xBB, Z80_MN.CP_a_r, '', 'E');
        case 0xBC: return new Z80_opcode_info(0xBC, Z80_MN.CP_a_r, '', 'H');
        case 0xBD: return new Z80_opcode_info(0xBD, Z80_MN.CP_a_r, '', 'L');
        case 0xBE: return new Z80_opcode_info(0xBE, Z80_MN.CP_a_irr, '', 'HL');
        case 0xBF: return new Z80_opcode_info(0xBF, Z80_MN.CP_a_r, '', 'A');

        case 0xC0: return new Z80_opcode_info(0xC0, Z80_MN.RET_c, '', 'regs.F.Z === 0');
        case 0xC1: return new Z80_opcode_info(0xC1, Z80_MN.POP_rr, '', 'BC');
        case 0xC2: return new Z80_opcode_info(0xC2, Z80_MN.JP_c_nn, '', 'regs.F.Z === 0');
        case 0xC3: return new Z80_opcode_info(0xC3, Z80_MN.JP_c_nn, '', '1');
        case 0xC4: return new Z80_opcode_info(0xC4, Z80_MN.CALL_c_nn, '', 'regs.F.Z === 0');
        case 0xC5: return new Z80_opcode_info(0xC5, Z80_MN.PUSH_rr, '', 'BC');
        case 0xC6: return new Z80_opcode_info(0xC6, Z80_MN.ADD_a_n, '');
        case 0xC7: return new Z80_opcode_info(0xC7, Z80_MN.RST_o, '', '0');
        case 0xC8: return new Z80_opcode_info(0xC8, Z80_MN.RET_c, '', 'regs.F.Z === 1');
        case 0xC9: return new Z80_opcode_info(0xC9, Z80_MN.RET, '');
        case 0xCA: return new Z80_opcode_info(0xCA, Z80_MN.JP_c_nn, '', 'regs.F.Z === 1');
        //0xCB: return new Z80_opcode_info(0xCB, Z80_MN.);
        case 0xCC: return new Z80_opcode_info(0xCC, Z80_MN.CALL_c_nn, '', 'regs.F.Z === 1');
        case 0xCD: return new Z80_opcode_info(0xCD, Z80_MN.CALL_nn, '');
        case 0xCE: return new Z80_opcode_info(0xCE, Z80_MN.ADC_a_n, '');
        case 0xCF: return new Z80_opcode_info(0xCF, Z80_MN.RST_o, '', '1');

        case 0xD0: return new Z80_opcode_info(0xD0, Z80_MN.RET_c, '', 'regs.F.C === 0');
        case 0xD1: return new Z80_opcode_info(0xD1, Z80_MN.POP_rr, '', 'DE');
        case 0xD2: return new Z80_opcode_info(0xD2, Z80_MN.JP_c_nn, '', 'regs.F.C === 0');
        case 0xD3: return new Z80_opcode_info(0xD3, Z80_MN.OUT_in_a, '');
        case 0xD4: return new Z80_opcode_info(0xD4, Z80_MN.CALL_c_nn, '', 'regs.F.C === 0');
        case 0xD5: return new Z80_opcode_info(0xD5, Z80_MN.PUSH_rr, '', 'DE');
        case 0xD6: return new Z80_opcode_info(0xD6, Z80_MN.SUB_a_n, '');
        case 0xD7: return new Z80_opcode_info(0xD7, Z80_MN.RST_o, '', '2');
        case 0xD8: return new Z80_opcode_info(0xD8, Z80_MN.RET_c, '', 'regs.F.C === 1');
        case 0xD9: return new Z80_opcode_info(0xD9, Z80_MN.EXX, '');
        case 0xDA: return new Z80_opcode_info(0xDA, Z80_MN.JP_c_nn, '', 'regs.F.C === 1');
        case 0xDB: return new Z80_opcode_info(0xDB, Z80_MN.IN_a_in, '');
        case 0xDC: return new Z80_opcode_info(0xDC, Z80_MN.CALL_c_nn, '', 'regs.F.C === 1');
        //0xDD: return new Z80_opcode_info(0xDD, Z80_MN.);
        case 0xDE: return new Z80_opcode_info(0xDE, Z80_MN.SBC_a_n, '');
        case 0xDF: return new Z80_opcode_info(0xDF, Z80_MN.RST_o, '', '3');

        case 0xE0: return new Z80_opcode_info(0xE0, Z80_MN.RET_c, '', 'regs.F.PV === 0');
        case 0xE1: return new Z80_opcode_info(0xE1, Z80_MN.POP_rr, '', 'HL');
        case 0xE2: return new Z80_opcode_info(0xE2, Z80_MN.JP_c_nn, '', 'regs.F.PV === 0');
        case 0xE3: return new Z80_opcode_info(0xE3, Z80_MN.EX_irr_rr, '', 'SP', 'HL');
        case 0xE4: return new Z80_opcode_info(0xE4, Z80_MN.CALL_c_nn, '', 'regs.F.PV === 0');
        case 0xE5: return new Z80_opcode_info(0xE5, Z80_MN.PUSH_rr, '', 'HL');
        case 0xE6: return new Z80_opcode_info(0xE6, Z80_MN.AND_a_n, '');
        case 0xE7: return new Z80_opcode_info(0xE7, Z80_MN.RST_o, '', '4');
        case 0xE8: return new Z80_opcode_info(0xE8, Z80_MN.RET_c, '', 'regs.F.PV === 1');
        case 0xE9: return new Z80_opcode_info(0xE9, Z80_MN.JP_rr, '', 'HL');
        case 0xEA: return new Z80_opcode_info(0xEA, Z80_MN.JP_c_nn, '', 'regs.F.PV === 1');
        case 0xEB: return new Z80_opcode_info(0xEB, Z80_MN.EX_rr_rr, '', 'DE', '_HL');
        case 0xEC: return new Z80_opcode_info(0xEC, Z80_MN.CALL_c_nn, '', 'regs.F.PV === 1');
        //0xED: return new Z80_opcode_info(0xED, Z80_MN.);
        case 0xEE: return new Z80_opcode_info(0xEE, Z80_MN.XOR_a_n, 'XOR_a_n');
        case 0xEF: return new Z80_opcode_info(0xEF, Z80_MN.RST_o, 'RST 5', '5');

        case 0xF0: return new Z80_opcode_info(0xF0, Z80_MN.RET_c, '', 'regs.F.S === 0');
        case 0xF1: return new Z80_opcode_info(0xF1, Z80_MN.POP_rr, '', 'AF');
        case 0xF2: return new Z80_opcode_info(0xF2, Z80_MN.JP_c_nn, '', 'regs.F.S === 0');
        case 0xF3: return new Z80_opcode_info(0xF3, Z80_MN.DI, 'DI');
        case 0xF4: return new Z80_opcode_info(0xF4, Z80_MN.CALL_c_nn, '', 'regs.F.S === 0');
        case 0xF5: return new Z80_opcode_info(0xF5, Z80_MN.PUSH_rr, '', 'AF');
        case 0xF6: return new Z80_opcode_info(0xF6, Z80_MN.OR_a_n, '');
        case 0xF7: return new Z80_opcode_info(0xF7, Z80_MN.RST_o, '', '6');
        case 0xF8: return new Z80_opcode_info(0xF8, Z80_MN.RET_c, '', 'regs.F.S === 1');
        case 0xF9: return new Z80_opcode_info(0xF9, Z80_MN.LD_sp_rr, '', 'HL');
        case 0xFA: return new Z80_opcode_info(0xFA, Z80_MN.JP_c_nn, '', 'regs.F.S === 1');
        case 0xFB: return new Z80_opcode_info(0xFB, Z80_MN.EI, 'EI');
        case 0xFC: return new Z80_opcode_info(0xFC, Z80_MN.CALL_c_nn, '', 'regs.F.S === 1');
        //0xFD: return new Z80_opcode_info(0xFD, Z80_MN.);
        case 0xFE: return new Z80_opcode_info(0xFE, Z80_MN.CP_a_n, '');
        case 0xFF: return new Z80_opcode_info(0xFF, Z80_MN.RST_o, '', '7');
        case 0x100: return new Z80_opcode_info(0x100, Z80_MN.IRQ, 'IRQ');
        case 0x101: return new Z80_opcode_info(0x101, Z80_MN.RESET, 'RESET')
        default: return new Z80_opcode_info(opcode, Z80_MN.UKN, 'UKNOWN');
    }
}

function Z80_CB_opcode_matrix_premn_func(opcode: u32): Z80_opcode_info {
    switch(opcode) {
        case 0x00: return new Z80_opcode_info(0x00, Z80_MN.RLC_r, '', 'B');
        case 0x01: return new Z80_opcode_info(0x01, Z80_MN.RLC_r, '', 'C');
        case 0x02: return new Z80_opcode_info(0x02, Z80_MN.RLC_r, '', 'D');
        case 0x03: return new Z80_opcode_info(0x03, Z80_MN.RLC_r, '', 'E');
        case 0x04: return new Z80_opcode_info(0x04, Z80_MN.RLC_r, '', 'H');
        case 0x05: return new Z80_opcode_info(0x05, Z80_MN.RLC_r, '', 'L');
        case 0x06: return new Z80_opcode_info(0x06, Z80_MN.RLC_irr, '', '_HL');
        case 0x07: return new Z80_opcode_info(0x07, Z80_MN.RLC_r, '', 'A');
        case 0x08: return new Z80_opcode_info(0x08, Z80_MN.RRC_r, '', 'B');
        case 0x09: return new Z80_opcode_info(0x09, Z80_MN.RRC_r, '', 'C');
        case 0x0A: return new Z80_opcode_info(0x0A, Z80_MN.RRC_r, '', 'D');
        case 0x0B: return new Z80_opcode_info(0x0B, Z80_MN.RRC_r, '', 'E');
        case 0x0C: return new Z80_opcode_info(0x0C, Z80_MN.RRC_r, '', 'H');
        case 0x0D: return new Z80_opcode_info(0x0D, Z80_MN.RRC_r, '', 'L');
        case 0x0E: return new Z80_opcode_info(0x0E, Z80_MN.RRC_irr, '', '_HL');
        case 0x0F: return new Z80_opcode_info(0x0F, Z80_MN.RRC_r, '', 'A');

        case 0x10: return new Z80_opcode_info(0x10, Z80_MN.RL_r, '', 'B');
        case 0x11: return new Z80_opcode_info(0x11, Z80_MN.RL_r, '', 'C');
        case 0x12: return new Z80_opcode_info(0x12, Z80_MN.RL_r, '', 'D');
        case 0x13: return new Z80_opcode_info(0x13, Z80_MN.RL_r, '', 'E');
        case 0x14: return new Z80_opcode_info(0x14, Z80_MN.RL_r, '', 'H');
        case 0x15: return new Z80_opcode_info(0x15, Z80_MN.RL_r, '', 'L');
        case 0x16: return new Z80_opcode_info(0x16, Z80_MN.RL_irr, '', '_HL');
        case 0x17: return new Z80_opcode_info(0x17, Z80_MN.RL_r, '', 'A');
        case 0x18: return new Z80_opcode_info(0x18, Z80_MN.RR_r, '', 'B');
        case 0x19: return new Z80_opcode_info(0x19, Z80_MN.RR_r, '', 'C');
        case 0x1A: return new Z80_opcode_info(0x1A, Z80_MN.RR_r, '', 'D');
        case 0x1B: return new Z80_opcode_info(0x1B, Z80_MN.RR_r, '', 'E');
        case 0x1C: return new Z80_opcode_info(0x1C, Z80_MN.RR_r, '', 'H');
        case 0x1D: return new Z80_opcode_info(0x1D, Z80_MN.RR_r, '', 'L');
        case 0x1E: return new Z80_opcode_info(0x1E, Z80_MN.RR_irr, '', '_HL');
        case 0x1F: return new Z80_opcode_info(0x1F, Z80_MN.RR_r, '', 'A');

        case 0x20: return new Z80_opcode_info(0x20, Z80_MN.SLA_r, '', 'B');
        case 0x21: return new Z80_opcode_info(0x21, Z80_MN.SLA_r, '', 'C');
        case 0x22: return new Z80_opcode_info(0x22, Z80_MN.SLA_r, '', 'D');
        case 0x23: return new Z80_opcode_info(0x23, Z80_MN.SLA_r, '', 'E');
        case 0x24: return new Z80_opcode_info(0x24, Z80_MN.SLA_r, '', 'H');
        case 0x25: return new Z80_opcode_info(0x25, Z80_MN.SLA_r, '', 'L');
        case 0x26: return new Z80_opcode_info(0x26, Z80_MN.SLA_irr, '', '_HL');
        case 0x27: return new Z80_opcode_info(0x27, Z80_MN.SLA_r, '', 'A');
        case 0x28: return new Z80_opcode_info(0x28, Z80_MN.SRA_r, '', 'B');
        case 0x29: return new Z80_opcode_info(0x29, Z80_MN.SRA_r, '', 'C');
        case 0x2A: return new Z80_opcode_info(0x2A, Z80_MN.SRA_r, '', 'D');
        case 0x2B: return new Z80_opcode_info(0x2B, Z80_MN.SRA_r, '', 'E');
        case 0x2C: return new Z80_opcode_info(0x2C, Z80_MN.SRA_r, '', 'H');
        case 0x2D: return new Z80_opcode_info(0x2D, Z80_MN.SRA_r, '', 'L');
        case 0x2E: return new Z80_opcode_info(0x2E, Z80_MN.SRA_irr, '', '_HL');
        case 0x2F: return new Z80_opcode_info(0x2F, Z80_MN.SRA_r, '', 'A');

        case 0x30: return new Z80_opcode_info(0x30, Z80_MN.SLL_r, '', 'B');
        case 0x31: return new Z80_opcode_info(0x31, Z80_MN.SLL_r, '', 'C');
        case 0x32: return new Z80_opcode_info(0x32, Z80_MN.SLL_r, '', 'D');
        case 0x33: return new Z80_opcode_info(0x33, Z80_MN.SLL_r, '', 'E');
        case 0x34: return new Z80_opcode_info(0x34, Z80_MN.SLL_r, '', 'H');
        case 0x35: return new Z80_opcode_info(0x35, Z80_MN.SLL_r, '', 'L');
        case 0x36: return new Z80_opcode_info(0x36, Z80_MN.SLL_irr, '', '_HL');
        case 0x37: return new Z80_opcode_info(0x37, Z80_MN.SLL_r, '', 'A');
        case 0x38: return new Z80_opcode_info(0x38, Z80_MN.SRL_r, '', 'B');
        case 0x39: return new Z80_opcode_info(0x39, Z80_MN.SRL_r, '', 'C');
        case 0x3A: return new Z80_opcode_info(0x3A, Z80_MN.SRL_r, '', 'D');
        case 0x3B: return new Z80_opcode_info(0x3B, Z80_MN.SRL_r, '', 'E');
        case 0x3C: return new Z80_opcode_info(0x3C, Z80_MN.SRL_r, '', 'H');
        case 0x3D: return new Z80_opcode_info(0x3D, Z80_MN.SRL_r, '', 'L');
        case 0x3E: return new Z80_opcode_info(0x3E, Z80_MN.SRL_irr, '', '_HL');
        case 0x3F: return new Z80_opcode_info(0x3F, Z80_MN.SRL_r, '', 'A');

        case 0x40: return new Z80_opcode_info(0x40, Z80_MN.BIT_o_r, '', '0', 'B');
        case 0x41: return new Z80_opcode_info(0x41, Z80_MN.BIT_o_r, '', '0', 'C');
        case 0x42: return new Z80_opcode_info(0x42, Z80_MN.BIT_o_r, '', '0', 'D');
        case 0x43: return new Z80_opcode_info(0x43, Z80_MN.BIT_o_r, '', '0', 'E');
        case 0x44: return new Z80_opcode_info(0x44, Z80_MN.BIT_o_r, '', '0', 'H');
        case 0x45: return new Z80_opcode_info(0x45, Z80_MN.BIT_o_r, '', '0', 'L');
        case 0x46: return new Z80_opcode_info(0x46, Z80_MN.BIT_o_irr, '', '0', '_HL');
        case 0x47: return new Z80_opcode_info(0x47, Z80_MN.BIT_o_r, '', '0', 'A');
        case 0x48: return new Z80_opcode_info(0x48, Z80_MN.BIT_o_r, '', '1', 'B');
        case 0x49: return new Z80_opcode_info(0x49, Z80_MN.BIT_o_r, '', '1', 'C');
        case 0x4A: return new Z80_opcode_info(0x4A, Z80_MN.BIT_o_r, '', '1', 'D');
        case 0x4B: return new Z80_opcode_info(0x4B, Z80_MN.BIT_o_r, '', '1', 'E');
        case 0x4C: return new Z80_opcode_info(0x4C, Z80_MN.BIT_o_r, '', '1', 'H');
        case 0x4D: return new Z80_opcode_info(0x4D, Z80_MN.BIT_o_r, '', '1', 'L');
        case 0x4E: return new Z80_opcode_info(0x4E, Z80_MN.BIT_o_irr, '', '1', '_HL');
        case 0x4F: return new Z80_opcode_info(0x4F, Z80_MN.BIT_o_r, '', '1', 'A');

        case 0x50: return new Z80_opcode_info(0x50, Z80_MN.BIT_o_r, '', '2', 'B');
        case 0x51: return new Z80_opcode_info(0x51, Z80_MN.BIT_o_r, '', '2', 'C');
        case 0x52: return new Z80_opcode_info(0x52, Z80_MN.BIT_o_r, '', '2', 'D');
        case 0x53: return new Z80_opcode_info(0x53, Z80_MN.BIT_o_r, '', '2', 'E');
        case 0x54: return new Z80_opcode_info(0x54, Z80_MN.BIT_o_r, '', '2', 'H');
        case 0x55: return new Z80_opcode_info(0x55, Z80_MN.BIT_o_r, '', '2', 'L');
        case 0x56: return new Z80_opcode_info(0x56, Z80_MN.BIT_o_irr, '', '2', '_HL');
        case 0x57: return new Z80_opcode_info(0x57, Z80_MN.BIT_o_r, '', '2', 'A');
        case 0x58: return new Z80_opcode_info(0x58, Z80_MN.BIT_o_r, '', '3', 'B');
        case 0x59: return new Z80_opcode_info(0x59, Z80_MN.BIT_o_r, '', '3', 'C');
        case 0x5A: return new Z80_opcode_info(0x5A, Z80_MN.BIT_o_r, '', '3', 'D');
        case 0x5B: return new Z80_opcode_info(0x5B, Z80_MN.BIT_o_r, '', '3', 'E');
        case 0x5C: return new Z80_opcode_info(0x5C, Z80_MN.BIT_o_r, '', '3', 'H');
        case 0x5D: return new Z80_opcode_info(0x5D, Z80_MN.BIT_o_r, '', '3', 'L');
        case 0x5E: return new Z80_opcode_info(0x5E, Z80_MN.BIT_o_irr, '', '3', '_HL');
        case 0x5F: return new Z80_opcode_info(0x5F, Z80_MN.BIT_o_r, '', '3', 'A');

        case 0x60: return new Z80_opcode_info(0x60, Z80_MN.BIT_o_r, '', '4', 'B');
        case 0x61: return new Z80_opcode_info(0x61, Z80_MN.BIT_o_r, '', '4', 'C');
        case 0x62: return new Z80_opcode_info(0x62, Z80_MN.BIT_o_r, '', '4', 'D');
        case 0x63: return new Z80_opcode_info(0x63, Z80_MN.BIT_o_r, '', '4', 'E');
        case 0x64: return new Z80_opcode_info(0x64, Z80_MN.BIT_o_r, '', '4', 'H');
        case 0x65: return new Z80_opcode_info(0x65, Z80_MN.BIT_o_r, '', '4', 'L');
        case 0x66: return new Z80_opcode_info(0x66, Z80_MN.BIT_o_irr, '', '4', '_HL');
        case 0x67: return new Z80_opcode_info(0x67, Z80_MN.BIT_o_r, '', '4', 'A');
        case 0x68: return new Z80_opcode_info(0x68, Z80_MN.BIT_o_r, '', '5', 'B');
        case 0x69: return new Z80_opcode_info(0x69, Z80_MN.BIT_o_r, '', '5', 'C');
        case 0x6A: return new Z80_opcode_info(0x6A, Z80_MN.BIT_o_r, '', '5', 'D');
        case 0x6B: return new Z80_opcode_info(0x6B, Z80_MN.BIT_o_r, '', '5', 'E');
        case 0x6C: return new Z80_opcode_info(0x6C, Z80_MN.BIT_o_r, '', '5', 'H');
        case 0x6D: return new Z80_opcode_info(0x6D, Z80_MN.BIT_o_r, '', '5', 'L');
        case 0x6E: return new Z80_opcode_info(0x6E, Z80_MN.BIT_o_irr, '', '5', '_HL');
        case 0x6F: return new Z80_opcode_info(0x6F, Z80_MN.BIT_o_r, '', '5', 'A');

        case 0x70: return new Z80_opcode_info(0x70, Z80_MN.BIT_o_r, '', '6', 'B');
        case 0x71: return new Z80_opcode_info(0x71, Z80_MN.BIT_o_r, '', '6', 'C');
        case 0x72: return new Z80_opcode_info(0x72, Z80_MN.BIT_o_r, '', '6', 'D');
        case 0x73: return new Z80_opcode_info(0x73, Z80_MN.BIT_o_r, '', '6', 'E');
        case 0x74: return new Z80_opcode_info(0x74, Z80_MN.BIT_o_r, '', '6', 'H');
        case 0x75: return new Z80_opcode_info(0x75, Z80_MN.BIT_o_r, '', '6', 'L');
        case 0x76: return new Z80_opcode_info(0x76, Z80_MN.BIT_o_irr, '', '6', '_HL');
        case 0x77: return new Z80_opcode_info(0x77, Z80_MN.BIT_o_r, '', '6', 'A');
        case 0x78: return new Z80_opcode_info(0x78, Z80_MN.BIT_o_r, '', '7', 'B');
        case 0x79: return new Z80_opcode_info(0x79, Z80_MN.BIT_o_r, '', '7', 'C');
        case 0x7A: return new Z80_opcode_info(0x7A, Z80_MN.BIT_o_r, '', '7', 'D');
        case 0x7B: return new Z80_opcode_info(0x7B, Z80_MN.BIT_o_r, '', '7', 'E');
        case 0x7C: return new Z80_opcode_info(0x7C, Z80_MN.BIT_o_r, '', '7', 'H');
        case 0x7D: return new Z80_opcode_info(0x7D, Z80_MN.BIT_o_r, '', '7', 'L');
        case 0x7E: return new Z80_opcode_info(0x7E, Z80_MN.BIT_o_irr, '', '7', '_HL');
        case 0x7F: return new Z80_opcode_info(0x7F, Z80_MN.BIT_o_r, '', '7', 'A');

        case 0x80: return new Z80_opcode_info(0x80, Z80_MN.RES_o_r, '', '0', 'B');
        case 0x81: return new Z80_opcode_info(0x81, Z80_MN.RES_o_r, '', '0', 'C');
        case 0x82: return new Z80_opcode_info(0x82, Z80_MN.RES_o_r, '', '0', 'D');
        case 0x83: return new Z80_opcode_info(0x83, Z80_MN.RES_o_r, '', '0', 'E');
        case 0x84: return new Z80_opcode_info(0x84, Z80_MN.RES_o_r, '', '0', 'H');
        case 0x85: return new Z80_opcode_info(0x85, Z80_MN.RES_o_r, '', '0', 'L');
        case 0x86: return new Z80_opcode_info(0x86, Z80_MN.RES_o_irr, '', '0', '_HL');
        case 0x87: return new Z80_opcode_info(0x87, Z80_MN.RES_o_r, '', '0', 'A');
        case 0x88: return new Z80_opcode_info(0x88, Z80_MN.RES_o_r, '', '1', 'B');
        case 0x89: return new Z80_opcode_info(0x89, Z80_MN.RES_o_r, '', '1', 'C');
        case 0x8A: return new Z80_opcode_info(0x8A, Z80_MN.RES_o_r, '', '1', 'D');
        case 0x8B: return new Z80_opcode_info(0x8B, Z80_MN.RES_o_r, '', '1', 'E');
        case 0x8C: return new Z80_opcode_info(0x8C, Z80_MN.RES_o_r, '', '1', 'H');
        case 0x8D: return new Z80_opcode_info(0x8D, Z80_MN.RES_o_r, '', '1', 'L');
        case 0x8E: return new Z80_opcode_info(0x8E, Z80_MN.RES_o_irr, '', '1', '_HL');
        case 0x8F: return new Z80_opcode_info(0x8F, Z80_MN.RES_o_r, '', '1', 'A');

        case 0x90: return new Z80_opcode_info(0x90, Z80_MN.RES_o_r, '', '2', 'B');
        case 0x91: return new Z80_opcode_info(0x91, Z80_MN.RES_o_r, '', '2', 'C');
        case 0x92: return new Z80_opcode_info(0x92, Z80_MN.RES_o_r, '', '2', 'D');
        case 0x93: return new Z80_opcode_info(0x93, Z80_MN.RES_o_r, '', '2', 'E');
        case 0x94: return new Z80_opcode_info(0x94, Z80_MN.RES_o_r, '', '2', 'H');
        case 0x95: return new Z80_opcode_info(0x95, Z80_MN.RES_o_r, '', '2', 'L');
        case 0x96: return new Z80_opcode_info(0x96, Z80_MN.RES_o_irr, '', '2', '_HL');
        case 0x97: return new Z80_opcode_info(0x97, Z80_MN.RES_o_r, '', '2', 'A');
        case 0x98: return new Z80_opcode_info(0x98, Z80_MN.RES_o_r, '', '3', 'B');
        case 0x99: return new Z80_opcode_info(0x99, Z80_MN.RES_o_r, '', '3', 'C');
        case 0x9A: return new Z80_opcode_info(0x9A, Z80_MN.RES_o_r, '', '3', 'D');
        case 0x9B: return new Z80_opcode_info(0x9B, Z80_MN.RES_o_r, '', '3', 'E');
        case 0x9C: return new Z80_opcode_info(0x9C, Z80_MN.RES_o_r, '', '3', 'H');
        case 0x9D: return new Z80_opcode_info(0x9D, Z80_MN.RES_o_r, '', '3', 'L');
        case 0x9E: return new Z80_opcode_info(0x9E, Z80_MN.RES_o_irr, '', '3', '_HL');
        case 0x9F: return new Z80_opcode_info(0x9F, Z80_MN.RES_o_r, '', '3', 'A');

        case 0xA0: return new Z80_opcode_info(0xA0, Z80_MN.RES_o_r, '', '4', 'B');
        case 0xA1: return new Z80_opcode_info(0xA1, Z80_MN.RES_o_r, '', '4', 'C');
        case 0xA2: return new Z80_opcode_info(0xA2, Z80_MN.RES_o_r, '', '4', 'D');
        case 0xA3: return new Z80_opcode_info(0xA3, Z80_MN.RES_o_r, '', '4', 'E');
        case 0xA4: return new Z80_opcode_info(0xA4, Z80_MN.RES_o_r, '', '4', 'H');
        case 0xA5: return new Z80_opcode_info(0xA5, Z80_MN.RES_o_r, '', '4', 'L');
        case 0xA6: return new Z80_opcode_info(0xA6, Z80_MN.RES_o_irr, '', '4', '_HL');
        case 0xA7: return new Z80_opcode_info(0xA7, Z80_MN.RES_o_r, '', '4', 'A');
        case 0xA8: return new Z80_opcode_info(0xA8, Z80_MN.RES_o_r, '', '5', 'B');
        case 0xA9: return new Z80_opcode_info(0xA9, Z80_MN.RES_o_r, '', '5', 'C');
        case 0xAA: return new Z80_opcode_info(0xAA, Z80_MN.RES_o_r, '', '5', 'D');
        case 0xAB: return new Z80_opcode_info(0xAB, Z80_MN.RES_o_r, '', '5', 'E');
        case 0xAC: return new Z80_opcode_info(0xAC, Z80_MN.RES_o_r, '', '5', 'H');
        case 0xAD: return new Z80_opcode_info(0xAD, Z80_MN.RES_o_r, '', '5', 'L');
        case 0xAE: return new Z80_opcode_info(0xAE, Z80_MN.RES_o_irr, '', '5', '_HL');
        case 0xAF: return new Z80_opcode_info(0xAF, Z80_MN.RES_o_r, '', '5', 'A');

        case 0xB0: return new Z80_opcode_info(0xB0, Z80_MN.RES_o_r, '', '6', 'B');
        case 0xB1: return new Z80_opcode_info(0xB1, Z80_MN.RES_o_r, '', '6', 'C');
        case 0xB2: return new Z80_opcode_info(0xB2, Z80_MN.RES_o_r, '', '6', 'D');
        case 0xB3: return new Z80_opcode_info(0xB3, Z80_MN.RES_o_r, '', '6', 'E');
        case 0xB4: return new Z80_opcode_info(0xB4, Z80_MN.RES_o_r, '', '6', 'H');
        case 0xB5: return new Z80_opcode_info(0xB5, Z80_MN.RES_o_r, '', '6', 'L');
        case 0xB6: return new Z80_opcode_info(0xB6, Z80_MN.RES_o_irr, '', '6', '_HL');
        case 0xB7: return new Z80_opcode_info(0xB7, Z80_MN.RES_o_r, '', '6', 'A');
        case 0xB8: return new Z80_opcode_info(0xB8, Z80_MN.RES_o_r, '', '7', 'B');
        case 0xB9: return new Z80_opcode_info(0xB9, Z80_MN.RES_o_r, '', '7', 'C');
        case 0xBA: return new Z80_opcode_info(0xBA, Z80_MN.RES_o_r, '', '7', 'D');
        case 0xBB: return new Z80_opcode_info(0xBB, Z80_MN.RES_o_r, '', '7', 'E');
        case 0xBC: return new Z80_opcode_info(0xBC, Z80_MN.RES_o_r, '', '7', 'H');
        case 0xBD: return new Z80_opcode_info(0xBD, Z80_MN.RES_o_r, '', '7', 'L');
        case 0xBE: return new Z80_opcode_info(0xBE, Z80_MN.RES_o_irr, '', '7', '_HL');
        case 0xBF: return new Z80_opcode_info(0xBF, Z80_MN.RES_o_r, '', '7', 'A');

        case 0xC0: return new Z80_opcode_info(0xC0, Z80_MN.SET_o_r, '', '0', 'B');
        case 0xC1: return new Z80_opcode_info(0xC1, Z80_MN.SET_o_r, '', '0', 'C');
        case 0xC2: return new Z80_opcode_info(0xC2, Z80_MN.SET_o_r, '', '0', 'D');
        case 0xC3: return new Z80_opcode_info(0xC3, Z80_MN.SET_o_r, '', '0', 'E');
        case 0xC4: return new Z80_opcode_info(0xC4, Z80_MN.SET_o_r, '', '0', 'H');
        case 0xC5: return new Z80_opcode_info(0xC5, Z80_MN.SET_o_r, '', '0', 'L');
        case 0xC6: return new Z80_opcode_info(0xC6, Z80_MN.SET_o_irr, '', '0', '_HL');
        case 0xC7: return new Z80_opcode_info(0xC7, Z80_MN.SET_o_r, '', '0', 'A');
        case 0xC8: return new Z80_opcode_info(0xC8, Z80_MN.SET_o_r, '', '1', 'B');
        case 0xC9: return new Z80_opcode_info(0xC9, Z80_MN.SET_o_r, '', '1', 'C');
        case 0xCA: return new Z80_opcode_info(0xCA, Z80_MN.SET_o_r, '', '1', 'D');
        case 0xCB: return new Z80_opcode_info(0xCB, Z80_MN.SET_o_r, '', '1', 'E');
        case 0xCC: return new Z80_opcode_info(0xCC, Z80_MN.SET_o_r, '', '1', 'H');
        case 0xCD: return new Z80_opcode_info(0xCD, Z80_MN.SET_o_r, '', '1', 'L');
        case 0xCE: return new Z80_opcode_info(0xCE, Z80_MN.SET_o_irr, '', '1','_HL');
        case 0xCF: return new Z80_opcode_info(0xCF, Z80_MN.SET_o_r, '', '1', 'A');

        case 0xD0: return new Z80_opcode_info(0xD0, Z80_MN.SET_o_r, '', '2', 'B');
        case 0xD1: return new Z80_opcode_info(0xD1, Z80_MN.SET_o_r, '', '2', 'C');
        case 0xD2: return new Z80_opcode_info(0xD2, Z80_MN.SET_o_r, '', '2', 'D');
        case 0xD3: return new Z80_opcode_info(0xD3, Z80_MN.SET_o_r, '', '2', 'E');
        case 0xD4: return new Z80_opcode_info(0xD4, Z80_MN.SET_o_r, '', '2', 'H');
        case 0xD5: return new Z80_opcode_info(0xD5, Z80_MN.SET_o_r, '', '2', 'L');
        case 0xD6: return new Z80_opcode_info(0xD6, Z80_MN.SET_o_irr, '', '2', '_HL');
        case 0xD7: return new Z80_opcode_info(0xD7, Z80_MN.SET_o_r, '', '2', 'A');
        case 0xD8: return new Z80_opcode_info(0xD8, Z80_MN.SET_o_r, '', '3', 'B');
        case 0xD9: return new Z80_opcode_info(0xD9, Z80_MN.SET_o_r, '', '3', 'C');
        case 0xDA: return new Z80_opcode_info(0xDA, Z80_MN.SET_o_r, '', '3', 'D');
        case 0xDB: return new Z80_opcode_info(0xDB, Z80_MN.SET_o_r, '', '3', 'E');
        case 0xDC: return new Z80_opcode_info(0xDC, Z80_MN.SET_o_r, '', '3', 'H');
        case 0xDD: return new Z80_opcode_info(0xDD, Z80_MN.SET_o_r, '', '3', 'L');
        case 0xDE: return new Z80_opcode_info(0xDE, Z80_MN.SET_o_irr, '', '3','_HL');
        case 0xDF: return new Z80_opcode_info(0xDF, Z80_MN.SET_o_r, '', '3', 'A');

        case 0xE0: return new Z80_opcode_info(0xE0, Z80_MN.SET_o_r, '', '4', 'B');
        case 0xE1: return new Z80_opcode_info(0xE1, Z80_MN.SET_o_r, '', '4', 'C');
        case 0xE2: return new Z80_opcode_info(0xE2, Z80_MN.SET_o_r, '', '4', 'D');
        case 0xE3: return new Z80_opcode_info(0xE3, Z80_MN.SET_o_r, '', '4', 'E');
        case 0xE4: return new Z80_opcode_info(0xE4, Z80_MN.SET_o_r, '', '4', 'H');
        case 0xE5: return new Z80_opcode_info(0xE5, Z80_MN.SET_o_r, '', '4', 'L');
        case 0xE6: return new Z80_opcode_info(0xE6, Z80_MN.SET_o_irr, '', '4', '_HL');
        case 0xE7: return new Z80_opcode_info(0xE7, Z80_MN.SET_o_r, '', '4', 'A');
        case 0xE8: return new Z80_opcode_info(0xE8, Z80_MN.SET_o_r, '', '5', 'B');
        case 0xE9: return new Z80_opcode_info(0xE9, Z80_MN.SET_o_r, '', '5', 'C');
        case 0xEA: return new Z80_opcode_info(0xEA, Z80_MN.SET_o_r, '', '5', 'D');
        case 0xEB: return new Z80_opcode_info(0xEB, Z80_MN.SET_o_r, '', '5', 'E');
        case 0xEC: return new Z80_opcode_info(0xEC, Z80_MN.SET_o_r, '', '5', 'H');
        case 0xED: return new Z80_opcode_info(0xED, Z80_MN.SET_o_r, '', '5', 'L');
        case 0xEE: return new Z80_opcode_info(0xEE, Z80_MN.SET_o_irr, '', '5','_HL');
        case 0xEF: return new Z80_opcode_info(0xEF, Z80_MN.SET_o_r, '', '5', 'A');

        case 0xF0: return new Z80_opcode_info(0xF0, Z80_MN.SET_o_r, '', '6', 'B');
        case 0xF1: return new Z80_opcode_info(0xF1, Z80_MN.SET_o_r, '', '6', 'C');
        case 0xF2: return new Z80_opcode_info(0xF2, Z80_MN.SET_o_r, '', '6', 'D');
        case 0xF3: return new Z80_opcode_info(0xF3, Z80_MN.SET_o_r, '', '6', 'E');
        case 0xF4: return new Z80_opcode_info(0xF4, Z80_MN.SET_o_r, '', '6', 'H');
        case 0xF5: return new Z80_opcode_info(0xF5, Z80_MN.SET_o_r, '', '6', 'L');
        case 0xF6: return new Z80_opcode_info(0xF6, Z80_MN.SET_o_irr, '', '6', '_HL');
        case 0xF7: return new Z80_opcode_info(0xF7, Z80_MN.SET_o_r, '', '6', 'A');
        case 0xF8: return new Z80_opcode_info(0xF8, Z80_MN.SET_o_r, '', '7', 'B');
        case 0xF9: return new Z80_opcode_info(0xF9, Z80_MN.SET_o_r, '', '7', 'C');
        case 0xFA: return new Z80_opcode_info(0xFA, Z80_MN.SET_o_r, '', '7', 'D');
        case 0xFB: return new Z80_opcode_info(0xFB, Z80_MN.SET_o_r, '', '7', 'E');
        case 0xFC: return new Z80_opcode_info(0xFC, Z80_MN.SET_o_r, '', '7', 'H');
        case 0xFD: return new Z80_opcode_info(0xFD, Z80_MN.SET_o_r, '', '7', 'L');
        case 0xFE: return new Z80_opcode_info(0xFE, Z80_MN.SET_o_irr, '', '7','_HL');
        case 0xFF: return new Z80_opcode_info(0xFF, Z80_MN.SET_o_r, '', '7', 'A');
        default: return new Z80_opcode_info(opcode, Z80_MN.UKN, 'UKNOWN');
    }
}

function Z80_CBd_opcode_matrix_premn_func(opcode: u32): Z80_opcode_info {
    switch(opcode) {
        case 0x00: return new Z80_opcode_info(0x00, Z80_MN.RLC_irr_r, '', 'addr', 'B');
        case 0x01: return new Z80_opcode_info(0x01, Z80_MN.RLC_irr_r, '', 'addr', 'C');
        case 0x02: return new Z80_opcode_info(0x02, Z80_MN.RLC_irr_r, '', 'addr', 'D');
        case 0x03: return new Z80_opcode_info(0x03, Z80_MN.RLC_irr_r, '', 'addr', 'E');
        case 0x04: return new Z80_opcode_info(0x04, Z80_MN.RLC_irr_r, '', 'addr', 'H');
        case 0x05: return new Z80_opcode_info(0x05, Z80_MN.RLC_irr_r, '', 'addr', 'L');
        case 0x06: return new Z80_opcode_info(0x06, Z80_MN.RLC_irr_r, '', 'addr', '_');
        case 0x07: return new Z80_opcode_info(0x07, Z80_MN.RLC_irr_r, '', 'addr', 'A');
        case 0x08: return new Z80_opcode_info(0x08, Z80_MN.RRC_irr_r, '', 'addr', 'B');
        case 0x09: return new Z80_opcode_info(0x09, Z80_MN.RRC_irr_r, '', 'addr', 'C');
        case 0x0A: return new Z80_opcode_info(0x0A, Z80_MN.RRC_irr_r, '', 'addr', 'D');
        case 0x0B: return new Z80_opcode_info(0x0B, Z80_MN.RRC_irr_r, '', 'addr', 'E');
        case 0x0C: return new Z80_opcode_info(0x0C, Z80_MN.RRC_irr_r, '', 'addr', 'H');
        case 0x0D: return new Z80_opcode_info(0x0D, Z80_MN.RRC_irr_r, '', 'addr', 'L');
        case 0x0E: return new Z80_opcode_info(0x0E, Z80_MN.RRC_irr_r, '', 'addr', '_');
        case 0x0F: return new Z80_opcode_info(0x0F, Z80_MN.RRC_irr_r, '', 'addr', 'A');

        case 0x10: return new Z80_opcode_info(0x10, Z80_MN.RL_irr_r, '', 'addr', 'B');
        case 0x11: return new Z80_opcode_info(0x11, Z80_MN.RL_irr_r, '', 'addr', 'C');
        case 0x12: return new Z80_opcode_info(0x12, Z80_MN.RL_irr_r, '', 'addr', 'D');
        case 0x13: return new Z80_opcode_info(0x13, Z80_MN.RL_irr_r, '', 'addr', 'E');
        case 0x14: return new Z80_opcode_info(0x14, Z80_MN.RL_irr_r, '', 'addr', 'H');
        case 0x15: return new Z80_opcode_info(0x15, Z80_MN.RL_irr_r, '', 'addr', 'L');
        case 0x16: return new Z80_opcode_info(0x16, Z80_MN.RL_irr_r, '', 'addr', '_');
        case 0x17: return new Z80_opcode_info(0x17, Z80_MN.RL_irr_r, '', 'addr', 'A');
        case 0x18: return new Z80_opcode_info(0x18, Z80_MN.RR_irr_r, '', 'addr', 'B');
        case 0x19: return new Z80_opcode_info(0x19, Z80_MN.RR_irr_r, '', 'addr', 'C');
        case 0x1A: return new Z80_opcode_info(0x1A, Z80_MN.RR_irr_r, '', 'addr', 'D');
        case 0x1B: return new Z80_opcode_info(0x1B, Z80_MN.RR_irr_r, '', 'addr', 'E');
        case 0x1C: return new Z80_opcode_info(0x1C, Z80_MN.RR_irr_r, '', 'addr', 'H');
        case 0x1D: return new Z80_opcode_info(0x1D, Z80_MN.RR_irr_r, '', 'addr', 'L');
        case 0x1E: return new Z80_opcode_info(0x1E, Z80_MN.RR_irr_r, '', 'addr', '_');
        case 0x1F: return new Z80_opcode_info(0x1F, Z80_MN.RR_irr_r, '', 'addr', 'A');

        case 0x20: return new Z80_opcode_info(0x20, Z80_MN.SLA_irr_r, '', 'addr', 'B');
        case 0x21: return new Z80_opcode_info(0x21, Z80_MN.SLA_irr_r, '', 'addr', 'C');
        case 0x22: return new Z80_opcode_info(0x22, Z80_MN.SLA_irr_r, '', 'addr', 'D');
        case 0x23: return new Z80_opcode_info(0x23, Z80_MN.SLA_irr_r, '', 'addr', 'E');
        case 0x24: return new Z80_opcode_info(0x24, Z80_MN.SLA_irr_r, '', 'addr', 'H');
        case 0x25: return new Z80_opcode_info(0x25, Z80_MN.SLA_irr_r, '', 'addr', 'L');
        case 0x26: return new Z80_opcode_info(0x26, Z80_MN.SLA_irr_r, '', 'addr', '_');
        case 0x27: return new Z80_opcode_info(0x27, Z80_MN.SLA_irr_r, '', 'addr', 'A');
        case 0x28: return new Z80_opcode_info(0x28, Z80_MN.SRA_irr_r, '', 'addr', 'B');
        case 0x29: return new Z80_opcode_info(0x29, Z80_MN.SRA_irr_r, '', 'addr', 'C');
        case 0x2A: return new Z80_opcode_info(0x2A, Z80_MN.SRA_irr_r, '', 'addr', 'D');
        case 0x2B: return new Z80_opcode_info(0x2B, Z80_MN.SRA_irr_r, '', 'addr', 'E');
        case 0x2C: return new Z80_opcode_info(0x2C, Z80_MN.SRA_irr_r, '', 'addr', 'H');
        case 0x2D: return new Z80_opcode_info(0x2D, Z80_MN.SRA_irr_r, '', 'addr', 'L');
        case 0x2E: return new Z80_opcode_info(0x2E, Z80_MN.SRA_irr_r, '', 'addr', '_');
        case 0x2F: return new Z80_opcode_info(0x2F, Z80_MN.SRA_irr_r, '', 'addr', 'A');

        case 0x30: return new Z80_opcode_info(0x30, Z80_MN.SLL_irr_r, '', 'addr', 'B');
        case 0x31: return new Z80_opcode_info(0x31, Z80_MN.SLL_irr_r, '', 'addr', 'C');
        case 0x32: return new Z80_opcode_info(0x32, Z80_MN.SLL_irr_r, '', 'addr', 'D');
        case 0x33: return new Z80_opcode_info(0x33, Z80_MN.SLL_irr_r, '', 'addr', 'E');
        case 0x34: return new Z80_opcode_info(0x34, Z80_MN.SLL_irr_r, '', 'addr', 'H');
        case 0x35: return new Z80_opcode_info(0x35, Z80_MN.SLL_irr_r, '', 'addr', 'L');
        case 0x36: return new Z80_opcode_info(0x36, Z80_MN.SLL_irr_r, '', 'addr', '_');
        case 0x37: return new Z80_opcode_info(0x37, Z80_MN.SLL_irr_r, '', 'addr', 'A');
        case 0x38: return new Z80_opcode_info(0x38, Z80_MN.SRL_irr_r, '', 'addr', 'B');
        case 0x39: return new Z80_opcode_info(0x39, Z80_MN.SRL_irr_r, '', 'addr', 'C');
        case 0x3A: return new Z80_opcode_info(0x3A, Z80_MN.SRL_irr_r, '', 'addr', 'D');
        case 0x3B: return new Z80_opcode_info(0x3B, Z80_MN.SRL_irr_r, '', 'addr', 'E');
        case 0x3C: return new Z80_opcode_info(0x3C, Z80_MN.SRL_irr_r, '', 'addr', 'H');
        case 0x3D: return new Z80_opcode_info(0x3D, Z80_MN.SRL_irr_r, '', 'addr', 'L');
        case 0x3E: return new Z80_opcode_info(0x3E, Z80_MN.SRL_irr_r, '', 'addr', '_');
        case 0x3F: return new Z80_opcode_info(0x3F, Z80_MN.SRL_irr_r, '', 'addr', 'A');

        case 0x40: return new Z80_opcode_info(0x40, Z80_MN.BIT_o_irr_r, '', '0','addr', 'B');
        case 0x41: return new Z80_opcode_info(0x41, Z80_MN.BIT_o_irr_r, '', '0', 'addr', 'C');
        case 0x42: return new Z80_opcode_info(0x42, Z80_MN.BIT_o_irr_r, '', '0', 'addr', 'D');
        case 0x43: return new Z80_opcode_info(0x43, Z80_MN.BIT_o_irr_r, '', '0', 'addr', 'E');
        case 0x44: return new Z80_opcode_info(0x44, Z80_MN.BIT_o_irr_r, '', '0', 'addr', 'H');
        case 0x45: return new Z80_opcode_info(0x45, Z80_MN.BIT_o_irr_r, '', '0', 'addr', 'L');
        case 0x46: return new Z80_opcode_info(0x46, Z80_MN.BIT_o_irr_r, '', '0', 'addr', '_');
        case 0x47: return new Z80_opcode_info(0x47, Z80_MN.BIT_o_irr_r, '', '0', 'addr', 'A');
        case 0x48: return new Z80_opcode_info(0x48, Z80_MN.BIT_o_irr_r, '', '1', 'addr', 'B');
        case 0x49: return new Z80_opcode_info(0x49, Z80_MN.BIT_o_irr_r, '', '1', 'addr', 'C');
        case 0x4A: return new Z80_opcode_info(0x4A, Z80_MN.BIT_o_irr_r, '', '1', 'addr', 'D');
        case 0x4B: return new Z80_opcode_info(0x4B, Z80_MN.BIT_o_irr_r, '', '1', 'addr', 'E');
        case 0x4C: return new Z80_opcode_info(0x4C, Z80_MN.BIT_o_irr_r, '', '1', 'addr', 'H');
        case 0x4D: return new Z80_opcode_info(0x4D, Z80_MN.BIT_o_irr_r, '', '1', 'addr', 'L');
        case 0x4E: return new Z80_opcode_info(0x4E, Z80_MN.BIT_o_irr_r, '', '1', 'addr', '_');
        case 0x4F: return new Z80_opcode_info(0x4F, Z80_MN.BIT_o_irr_r, '', '1', 'addr', 'A');

        case 0x50: return new Z80_opcode_info(0x50, Z80_MN.BIT_o_irr_r, '', '2','addr', 'B');
        case 0x51: return new Z80_opcode_info(0x51, Z80_MN.BIT_o_irr_r, '', '2', 'addr', 'C');
        case 0x52: return new Z80_opcode_info(0x52, Z80_MN.BIT_o_irr_r, '', '2', 'addr', 'D');
        case 0x53: return new Z80_opcode_info(0x53, Z80_MN.BIT_o_irr_r, '', '2', 'addr', 'E');
        case 0x54: return new Z80_opcode_info(0x54, Z80_MN.BIT_o_irr_r, '', '2', 'addr', 'H');
        case 0x55: return new Z80_opcode_info(0x55, Z80_MN.BIT_o_irr_r, '', '2', 'addr', 'L');
        case 0x56: return new Z80_opcode_info(0x56, Z80_MN.BIT_o_irr_r, '', '2', 'addr', '_');
        case 0x57: return new Z80_opcode_info(0x57, Z80_MN.BIT_o_irr_r, '', '2', 'addr', 'A');
        case 0x58: return new Z80_opcode_info(0x58, Z80_MN.BIT_o_irr_r, '', '3', 'addr', 'B');
        case 0x59: return new Z80_opcode_info(0x59, Z80_MN.BIT_o_irr_r, '', '3', 'addr', 'C');
        case 0x5A: return new Z80_opcode_info(0x5A, Z80_MN.BIT_o_irr_r, '', '3', 'addr', 'D');
        case 0x5B: return new Z80_opcode_info(0x5B, Z80_MN.BIT_o_irr_r, '', '3', 'addr', 'E');
        case 0x5C: return new Z80_opcode_info(0x5C, Z80_MN.BIT_o_irr_r, '', '3', 'addr', 'H');
        case 0x5D: return new Z80_opcode_info(0x5D, Z80_MN.BIT_o_irr_r, '', '3', 'addr', 'L');
        case 0x5E: return new Z80_opcode_info(0x5E, Z80_MN.BIT_o_irr_r, '', '3', 'addr', '_');
        case 0x5F: return new Z80_opcode_info(0x5F, Z80_MN.BIT_o_irr_r, '', '3', 'addr', 'A');

        case 0x60: return new Z80_opcode_info(0x60, Z80_MN.BIT_o_irr_r, '', '4','addr', 'B');
        case 0x61: return new Z80_opcode_info(0x61, Z80_MN.BIT_o_irr_r, '', '4', 'addr', 'C');
        case 0x62: return new Z80_opcode_info(0x62, Z80_MN.BIT_o_irr_r, '', '4', 'addr', 'D');
        case 0x63: return new Z80_opcode_info(0x63, Z80_MN.BIT_o_irr_r, '', '4', 'addr', 'E');
        case 0x64: return new Z80_opcode_info(0x64, Z80_MN.BIT_o_irr_r, '', '4', 'addr', 'H');
        case 0x65: return new Z80_opcode_info(0x65, Z80_MN.BIT_o_irr_r, '', '4', 'addr', 'L');
        case 0x66: return new Z80_opcode_info(0x66, Z80_MN.BIT_o_irr_r, '', '4', 'addr', '_');
        case 0x67: return new Z80_opcode_info(0x67, Z80_MN.BIT_o_irr_r, '', '4', 'addr', 'A');
        case 0x68: return new Z80_opcode_info(0x68, Z80_MN.BIT_o_irr_r, '', '5', 'addr', 'B');
        case 0x69: return new Z80_opcode_info(0x69, Z80_MN.BIT_o_irr_r, '', '5', 'addr', 'C');
        case 0x6A: return new Z80_opcode_info(0x6A, Z80_MN.BIT_o_irr_r, '', '5', 'addr', 'D');
        case 0x6B: return new Z80_opcode_info(0x6B, Z80_MN.BIT_o_irr_r, '', '5', 'addr', 'E');
        case 0x6C: return new Z80_opcode_info(0x6C, Z80_MN.BIT_o_irr_r, '', '5', 'addr', 'H');
        case 0x6D: return new Z80_opcode_info(0x6D, Z80_MN.BIT_o_irr_r, '', '5', 'addr', 'L');
        case 0x6E: return new Z80_opcode_info(0x6E, Z80_MN.BIT_o_irr_r, '', '5', 'addr', '_');
        case 0x6F: return new Z80_opcode_info(0x6F, Z80_MN.BIT_o_irr_r, '', '5', 'addr', 'A');

        case 0x70: return new Z80_opcode_info(0x70, Z80_MN.BIT_o_irr_r, '', '6','addr', 'B');
        case 0x71: return new Z80_opcode_info(0x71, Z80_MN.BIT_o_irr_r, '', '6', 'addr', 'C');
        case 0x72: return new Z80_opcode_info(0x72, Z80_MN.BIT_o_irr_r, '', '6', 'addr', 'D');
        case 0x73: return new Z80_opcode_info(0x73, Z80_MN.BIT_o_irr_r, '', '6', 'addr', 'E');
        case 0x74: return new Z80_opcode_info(0x74, Z80_MN.BIT_o_irr_r, '', '6', 'addr', 'H');
        case 0x75: return new Z80_opcode_info(0x75, Z80_MN.BIT_o_irr_r, '', '6', 'addr', 'L');
        case 0x76: return new Z80_opcode_info(0x76, Z80_MN.BIT_o_irr_r, '', '6', 'addr', '_');
        case 0x77: return new Z80_opcode_info(0x77, Z80_MN.BIT_o_irr_r, '', '6', 'addr', 'A');
        case 0x78: return new Z80_opcode_info(0x78, Z80_MN.BIT_o_irr_r, '', '7', 'addr', 'B');
        case 0x79: return new Z80_opcode_info(0x79, Z80_MN.BIT_o_irr_r, '', '7', 'addr', 'C');
        case 0x7A: return new Z80_opcode_info(0x7A, Z80_MN.BIT_o_irr_r, '', '7', 'addr', 'D');
        case 0x7B: return new Z80_opcode_info(0x7B, Z80_MN.BIT_o_irr_r, '', '7', 'addr', 'E');
        case 0x7C: return new Z80_opcode_info(0x7C, Z80_MN.BIT_o_irr_r, '', '7', 'addr', 'H');
        case 0x7D: return new Z80_opcode_info(0x7D, Z80_MN.BIT_o_irr_r, '', '7', 'addr', 'L');
        case 0x7E: return new Z80_opcode_info(0x7E, Z80_MN.BIT_o_irr_r, '', '7', 'addr', '_');
        case 0x7F: return new Z80_opcode_info(0x7F, Z80_MN.BIT_o_irr_r, '', '7', 'addr', 'A');

        case 0x80: return new Z80_opcode_info(0x80, Z80_MN.RES_o_irr_r, '', '0', 'addr', 'B');
        case 0x81: return new Z80_opcode_info(0x81, Z80_MN.RES_o_irr_r, '', '0', 'addr', 'C');
        case 0x82: return new Z80_opcode_info(0x82, Z80_MN.RES_o_irr_r, '', '0', 'addr', 'D');
        case 0x83: return new Z80_opcode_info(0x83, Z80_MN.RES_o_irr_r, '', '0', 'addr', 'E');
        case 0x84: return new Z80_opcode_info(0x84, Z80_MN.RES_o_irr_r, '', '0', 'addr', 'H');
        case 0x85: return new Z80_opcode_info(0x85, Z80_MN.RES_o_irr_r, '', '0', 'addr', 'L');
        case 0x86: return new Z80_opcode_info(0x86, Z80_MN.RES_o_irr_r, '', '0', 'addr', '_');
        case 0x87: return new Z80_opcode_info(0x87, Z80_MN.RES_o_irr_r, '', '0', 'addr', 'A');
        case 0x88: return new Z80_opcode_info(0x88, Z80_MN.RES_o_irr_r, '', '1', 'addr', 'B');
        case 0x89: return new Z80_opcode_info(0x89, Z80_MN.RES_o_irr_r, '', '1', 'addr', 'C');
        case 0x8A: return new Z80_opcode_info(0x8A, Z80_MN.RES_o_irr_r, '', '1', 'addr', 'D');
        case 0x8B: return new Z80_opcode_info(0x8B, Z80_MN.RES_o_irr_r, '', '1', 'addr', 'E');
        case 0x8C: return new Z80_opcode_info(0x8C, Z80_MN.RES_o_irr_r, '', '1', 'addr', 'H');
        case 0x8D: return new Z80_opcode_info(0x8D, Z80_MN.RES_o_irr_r, '', '1', 'addr', 'L');
        case 0x8E: return new Z80_opcode_info(0x8E, Z80_MN.RES_o_irr_r, '', '1', 'addr', '_');
        case 0x8F: return new Z80_opcode_info(0x8F, Z80_MN.RES_o_irr_r, '', '1', 'addr', 'A');

        case 0x90: return new Z80_opcode_info(0x90, Z80_MN.RES_o_irr_r, '', '2', 'addr', 'B');
        case 0x91: return new Z80_opcode_info(0x91, Z80_MN.RES_o_irr_r, '', '2', 'addr', 'C');
        case 0x92: return new Z80_opcode_info(0x92, Z80_MN.RES_o_irr_r, '', '2', 'addr', 'D');
        case 0x93: return new Z80_opcode_info(0x93, Z80_MN.RES_o_irr_r, '', '2', 'addr', 'E');
        case 0x94: return new Z80_opcode_info(0x94, Z80_MN.RES_o_irr_r, '', '2', 'addr', 'H');
        case 0x95: return new Z80_opcode_info(0x95, Z80_MN.RES_o_irr_r, '', '2', 'addr', 'L');
        case 0x96: return new Z80_opcode_info(0x96, Z80_MN.RES_o_irr_r, '', '2', 'addr', '_');
        case 0x97: return new Z80_opcode_info(0x97, Z80_MN.RES_o_irr_r, '', '2', 'addr', 'A');
        case 0x98: return new Z80_opcode_info(0x98, Z80_MN.RES_o_irr_r, '', '3', 'addr', 'B');
        case 0x99: return new Z80_opcode_info(0x99, Z80_MN.RES_o_irr_r, '', '3', 'addr', 'C');
        case 0x9A: return new Z80_opcode_info(0x9A, Z80_MN.RES_o_irr_r, '', '3', 'addr', 'D');
        case 0x9B: return new Z80_opcode_info(0x9B, Z80_MN.RES_o_irr_r, '', '3', 'addr', 'E');
        case 0x9C: return new Z80_opcode_info(0x9C, Z80_MN.RES_o_irr_r, '', '3', 'addr', 'H');
        case 0x9D: return new Z80_opcode_info(0x9D, Z80_MN.RES_o_irr_r, '', '3', 'addr', 'L');
        case 0x9E: return new Z80_opcode_info(0x9E, Z80_MN.RES_o_irr_r, '', '3', 'addr', '_');
        case 0x9F: return new Z80_opcode_info(0x9F, Z80_MN.RES_o_irr_r, '', '3', 'addr', 'A');

        case 0xA0: return new Z80_opcode_info(0xA0, Z80_MN.RES_o_irr_r, '', '4', 'addr', 'B');
        case 0xA1: return new Z80_opcode_info(0xA1, Z80_MN.RES_o_irr_r, '', '4', 'addr', 'C');
        case 0xA2: return new Z80_opcode_info(0xA2, Z80_MN.RES_o_irr_r, '', '4', 'addr', 'D');
        case 0xA3: return new Z80_opcode_info(0xA3, Z80_MN.RES_o_irr_r, '', '4', 'addr', 'E');
        case 0xA4: return new Z80_opcode_info(0xA4, Z80_MN.RES_o_irr_r, '', '4', 'addr', 'H');
        case 0xA5: return new Z80_opcode_info(0xA5, Z80_MN.RES_o_irr_r, '', '4', 'addr', 'L');
        case 0xA6: return new Z80_opcode_info(0xA6, Z80_MN.RES_o_irr_r, '', '4', 'addr', '_');
        case 0xA7: return new Z80_opcode_info(0xA7, Z80_MN.RES_o_irr_r, '', '4', 'addr', 'A');
        case 0xA8: return new Z80_opcode_info(0xA8, Z80_MN.RES_o_irr_r, '', '5', 'addr', 'B');
        case 0xA9: return new Z80_opcode_info(0xA9, Z80_MN.RES_o_irr_r, '', '5', 'addr', 'C');
        case 0xAA: return new Z80_opcode_info(0xAA, Z80_MN.RES_o_irr_r, '', '5', 'addr', 'D');
        case 0xAB: return new Z80_opcode_info(0xAB, Z80_MN.RES_o_irr_r, '', '5', 'addr', 'E');
        case 0xAC: return new Z80_opcode_info(0xAC, Z80_MN.RES_o_irr_r, '', '5', 'addr', 'H');
        case 0xAD: return new Z80_opcode_info(0xAD, Z80_MN.RES_o_irr_r, '', '5', 'addr', 'L');
        case 0xAE: return new Z80_opcode_info(0xAE, Z80_MN.RES_o_irr_r, '', '5', 'addr', '_');
        case 0xAF: return new Z80_opcode_info(0xAF, Z80_MN.RES_o_irr_r, '', '5', 'addr', 'A');

        case 0xB0: return new Z80_opcode_info(0xB0, Z80_MN.RES_o_irr_r, '', '6', 'addr', 'B');
        case 0xB1: return new Z80_opcode_info(0xB1, Z80_MN.RES_o_irr_r, '', '6', 'addr', 'C');
        case 0xB2: return new Z80_opcode_info(0xB2, Z80_MN.RES_o_irr_r, '', '6', 'addr', 'D');
        case 0xB3: return new Z80_opcode_info(0xB3, Z80_MN.RES_o_irr_r, '', '6', 'addr', 'E');
        case 0xB4: return new Z80_opcode_info(0xB4, Z80_MN.RES_o_irr_r, '', '6', 'addr', 'H');
        case 0xB5: return new Z80_opcode_info(0xB5, Z80_MN.RES_o_irr_r, '', '6', 'addr', 'L');
        case 0xB6: return new Z80_opcode_info(0xB6, Z80_MN.RES_o_irr_r, '', '6', 'addr', '_');
        case 0xB7: return new Z80_opcode_info(0xB7, Z80_MN.RES_o_irr_r, '', '6', 'addr', 'A');
        case 0xB8: return new Z80_opcode_info(0xB8, Z80_MN.RES_o_irr_r, '', '7', 'addr', 'B');
        case 0xB9: return new Z80_opcode_info(0xB9, Z80_MN.RES_o_irr_r, '', '7', 'addr', 'C');
        case 0xBA: return new Z80_opcode_info(0xBA, Z80_MN.RES_o_irr_r, '', '7', 'addr', 'D');
        case 0xBB: return new Z80_opcode_info(0xBB, Z80_MN.RES_o_irr_r, '', '7', 'addr', 'E');
        case 0xBC: return new Z80_opcode_info(0xBC, Z80_MN.RES_o_irr_r, '', '7', 'addr', 'H');
        case 0xBD: return new Z80_opcode_info(0xBD, Z80_MN.RES_o_irr_r, '', '7', 'addr', 'L');
        case 0xBE: return new Z80_opcode_info(0xBE, Z80_MN.RES_o_irr_r, '', '7', 'addr', '_');
        case 0xBF: return new Z80_opcode_info(0xBF, Z80_MN.RES_o_irr_r, '', '7', 'addr', 'A');

        case 0xC0: return new Z80_opcode_info(0xC0, Z80_MN.SET_o_irr_r, '', '0', 'addr', 'B');
        case 0xC1: return new Z80_opcode_info(0xC1, Z80_MN.SET_o_irr_r, '', '0', 'addr', 'C');
        case 0xC2: return new Z80_opcode_info(0xC2, Z80_MN.SET_o_irr_r, '', '0', 'addr', 'D');
        case 0xC3: return new Z80_opcode_info(0xC3, Z80_MN.SET_o_irr_r, '', '0', 'addr', 'E');
        case 0xC4: return new Z80_opcode_info(0xC4, Z80_MN.SET_o_irr_r, '', '0', 'addr', 'H');
        case 0xC5: return new Z80_opcode_info(0xC5, Z80_MN.SET_o_irr_r, '', '0', 'addr', 'L');
        case 0xC6: return new Z80_opcode_info(0xC6, Z80_MN.SET_o_irr_r, '', '0', 'addr', '_');
        case 0xC7: return new Z80_opcode_info(0xC7, Z80_MN.SET_o_irr_r, '', '0', 'addr', 'A');
        case 0xC8: return new Z80_opcode_info(0xC8, Z80_MN.SET_o_irr_r, '', '1', 'addr', 'B');
        case 0xC9: return new Z80_opcode_info(0xC9, Z80_MN.SET_o_irr_r, '', '1', 'addr', 'C');
        case 0xCA: return new Z80_opcode_info(0xCA, Z80_MN.SET_o_irr_r, '', '1', 'addr', 'D');
        case 0xCB: return new Z80_opcode_info(0xCB, Z80_MN.SET_o_irr_r, '', '1', 'addr', 'E');
        case 0xCC: return new Z80_opcode_info(0xCC, Z80_MN.SET_o_irr_r, '', '1', 'addr', 'H');
        case 0xCD: return new Z80_opcode_info(0xCD, Z80_MN.SET_o_irr_r, '', '1', 'addr', 'L');
        case 0xCE: return new Z80_opcode_info(0xCE, Z80_MN.SET_o_irr_r, '', '1', 'addr', '_');
        case 0xCF: return new Z80_opcode_info(0xCF, Z80_MN.SET_o_irr_r, '', '1', 'addr', 'A');

        case 0xD0: return new Z80_opcode_info(0xD0, Z80_MN.SET_o_irr_r, '', '2', 'addr', 'B');
        case 0xD1: return new Z80_opcode_info(0xD1, Z80_MN.SET_o_irr_r, '', '2', 'addr', 'C');
        case 0xD2: return new Z80_opcode_info(0xD2, Z80_MN.SET_o_irr_r, '', '2', 'addr', 'D');
        case 0xD3: return new Z80_opcode_info(0xD3, Z80_MN.SET_o_irr_r, '', '2', 'addr', 'E');
        case 0xD4: return new Z80_opcode_info(0xD4, Z80_MN.SET_o_irr_r, '', '2', 'addr', 'H');
        case 0xD5: return new Z80_opcode_info(0xD5, Z80_MN.SET_o_irr_r, '', '2', 'addr', 'L');
        case 0xD6: return new Z80_opcode_info(0xD6, Z80_MN.SET_o_irr_r, '', '2', 'addr', '_');
        case 0xD7: return new Z80_opcode_info(0xD7, Z80_MN.SET_o_irr_r, '', '2', 'addr', 'A');
        case 0xD8: return new Z80_opcode_info(0xD8, Z80_MN.SET_o_irr_r, '', '3', 'addr', 'B');
        case 0xD9: return new Z80_opcode_info(0xD9, Z80_MN.SET_o_irr_r, '', '3', 'addr', 'C');
        case 0xDA: return new Z80_opcode_info(0xDA, Z80_MN.SET_o_irr_r, '', '3', 'addr', 'D');
        case 0xDB: return new Z80_opcode_info(0xDB, Z80_MN.SET_o_irr_r, '', '3', 'addr', 'E');
        case 0xDC: return new Z80_opcode_info(0xDC, Z80_MN.SET_o_irr_r, '', '3', 'addr', 'H');
        case 0xDD: return new Z80_opcode_info(0xDD, Z80_MN.SET_o_irr_r, '', '3', 'addr', 'L');
        case 0xDE: return new Z80_opcode_info(0xDE, Z80_MN.SET_o_irr_r, '', '3', 'addr', '_');
        case 0xDF: return new Z80_opcode_info(0xDF, Z80_MN.SET_o_irr_r, '', '3', 'addr', 'A');

        case 0xE0: return new Z80_opcode_info(0xE0, Z80_MN.SET_o_irr_r, '', '4', 'addr', 'B');
        case 0xE1: return new Z80_opcode_info(0xE1, Z80_MN.SET_o_irr_r, '', '4', 'addr', 'C');
        case 0xE2: return new Z80_opcode_info(0xE2, Z80_MN.SET_o_irr_r, '', '4', 'addr', 'D');
        case 0xE3: return new Z80_opcode_info(0xE3, Z80_MN.SET_o_irr_r, '', '4', 'addr', 'E');
        case 0xE4: return new Z80_opcode_info(0xE4, Z80_MN.SET_o_irr_r, '', '4', 'addr', 'H');
        case 0xE5: return new Z80_opcode_info(0xE5, Z80_MN.SET_o_irr_r, '', '4', 'addr', 'L');
        case 0xE6: return new Z80_opcode_info(0xE6, Z80_MN.SET_o_irr_r, '', '4', 'addr', '_');
        case 0xE7: return new Z80_opcode_info(0xE7, Z80_MN.SET_o_irr_r, '', '4', 'addr', 'A');
        case 0xE8: return new Z80_opcode_info(0xE8, Z80_MN.SET_o_irr_r, '', '5', 'addr', 'B');
        case 0xE9: return new Z80_opcode_info(0xE9, Z80_MN.SET_o_irr_r, '', '5', 'addr', 'C');
        case 0xEA: return new Z80_opcode_info(0xEA, Z80_MN.SET_o_irr_r, '', '5', 'addr', 'D');
        case 0xEB: return new Z80_opcode_info(0xEB, Z80_MN.SET_o_irr_r, '', '5', 'addr', 'E');
        case 0xEC: return new Z80_opcode_info(0xEC, Z80_MN.SET_o_irr_r, '', '5', 'addr', 'H');
        case 0xED: return new Z80_opcode_info(0xED, Z80_MN.SET_o_irr_r, '', '5', 'addr', 'L');
        case 0xEE: return new Z80_opcode_info(0xEE, Z80_MN.SET_o_irr_r, '', '5', 'addr', '_');
        case 0xEF: return new Z80_opcode_info(0xEF, Z80_MN.SET_o_irr_r, '', '5', 'addr', 'A');

        case 0xF0: return new Z80_opcode_info(0xF0, Z80_MN.SET_o_irr_r, '', '6', 'addr', 'B');
        case 0xF1: return new Z80_opcode_info(0xF1, Z80_MN.SET_o_irr_r, '', '6', 'addr', 'C');
        case 0xF2: return new Z80_opcode_info(0xF2, Z80_MN.SET_o_irr_r, '', '6', 'addr', 'D');
        case 0xF3: return new Z80_opcode_info(0xF3, Z80_MN.SET_o_irr_r, '', '6', 'addr', 'E');
        case 0xF4: return new Z80_opcode_info(0xF4, Z80_MN.SET_o_irr_r, '', '6', 'addr', 'H');
        case 0xF5: return new Z80_opcode_info(0xF5, Z80_MN.SET_o_irr_r, '', '6', 'addr', 'L');
        case 0xF6: return new Z80_opcode_info(0xF6, Z80_MN.SET_o_irr_r, '', '6', 'addr', '_');
        case 0xF7: return new Z80_opcode_info(0xF7, Z80_MN.SET_o_irr_r, '', '6', 'addr', 'A');
        case 0xF8: return new Z80_opcode_info(0xF8, Z80_MN.SET_o_irr_r, '', '7', 'addr', 'B');
        case 0xF9: return new Z80_opcode_info(0xF9, Z80_MN.SET_o_irr_r, '', '7', 'addr', 'C');
        case 0xFA: return new Z80_opcode_info(0xFA, Z80_MN.SET_o_irr_r, '', '7', 'addr', 'D');
        case 0xFB: return new Z80_opcode_info(0xFB, Z80_MN.SET_o_irr_r, '', '7', 'addr', 'E');
        case 0xFC: return new Z80_opcode_info(0xFC, Z80_MN.SET_o_irr_r, '', '7', 'addr', 'H');
        case 0xFD: return new Z80_opcode_info(0xFD, Z80_MN.SET_o_irr_r, '', '7', 'addr', 'L');
        case 0xFE: return new Z80_opcode_info(0xFE, Z80_MN.SET_o_irr_r, '', '7', 'addr', '_');
        case 0xFF: return new Z80_opcode_info(0xFF, Z80_MN.SET_o_irr_r, '', '7', 'addr', 'A');
        default: return new Z80_opcode_info(opcode, Z80_MN.UKN, 'UKNOWN');
    }
}

/*
function Z80_CBd_opcode_matrix_premn_func(opcode: u32): Z80_opcode_info {
    switch(opcode) {
        default: return new Z80_opcode_info(opcode, Z80_MN.UKN, 'UKNOWN');
    }
}
 */

function Z80_ED_opcode_matrix_premn_func(opcode: u32): Z80_opcode_info {
    switch(opcode) {
        case 0x40: return new Z80_opcode_info(0x40, Z80_MN.IN_r_ic, '', 'B');
        case 0x41: return new Z80_opcode_info(0x41, Z80_MN.OUT_ic_r, '', 'B');
        case 0x42: return new Z80_opcode_info(0x42, Z80_MN.SBC_hl_rr, '', 'BC');
        case 0x43: return new Z80_opcode_info(0x43, Z80_MN.LD_inn_rr, '', 'BC');
        case 0x44: return new Z80_opcode_info(0x44, Z80_MN.NEG, 'NEG');
        case 0x45: return new Z80_opcode_info(0x45, Z80_MN.RETN, 'RETN');
        case 0x46: return new Z80_opcode_info(0x46, Z80_MN.IM_o, '', '0');
        case 0x47: return new Z80_opcode_info(0x47, Z80_MN.LD_r_r1, '', 'I', 'A');
        case 0x48: return new Z80_opcode_info(0x48, Z80_MN.IN_r_ic, '', 'C');
        case 0x49: return new Z80_opcode_info(0x49, Z80_MN.OUT_ic_r, '', 'C');
        case 0x4A: return new Z80_opcode_info(0x4A, Z80_MN.ADC_hl_rr, '', 'BC');
        case 0x4B: return new Z80_opcode_info(0x4B, Z80_MN.LD_rr_inn, '', 'BC');
        case 0x4C: return new Z80_opcode_info(0x4C, Z80_MN.NEG, 'NEG');
        case 0x4D: return new Z80_opcode_info(0x4D, Z80_MN.RETI, 'RETI');
        case 0x4E: return new Z80_opcode_info(0x4E, Z80_MN.IM_o, '', '0');
        case 0x4F: return new Z80_opcode_info(0x4F, Z80_MN.LD_r_r1, '', 'R', 'A');

        case 0x50: return new Z80_opcode_info(0x50, Z80_MN.IN_r_ic, '', 'D');
        case 0x51: return new Z80_opcode_info(0x51, Z80_MN.OUT_ic_r, '', 'D');
        case 0x52: return new Z80_opcode_info(0x52, Z80_MN.SBC_hl_rr, '', 'DE');
        case 0x53: return new Z80_opcode_info(0x53, Z80_MN.LD_inn_rr, '', 'DE');
        case 0x54: return new Z80_opcode_info(0x54, Z80_MN.NEG, 'NEG');
        case 0x55: return new Z80_opcode_info(0x55, Z80_MN.RETN, 'RETN');
        case 0x56: return new Z80_opcode_info(0x56, Z80_MN.IM_o, '', '1');
        case 0x57: return new Z80_opcode_info(0x57, Z80_MN.LD_r_r2, '', 'A', 'I');
        case 0x58: return new Z80_opcode_info(0x58, Z80_MN.IN_r_ic, '', 'E');
        case 0x59: return new Z80_opcode_info(0x59, Z80_MN.OUT_ic_r, '', 'E');
        case 0x5A: return new Z80_opcode_info(0x5A, Z80_MN.ADC_hl_rr, '', 'DE');
        case 0x5B: return new Z80_opcode_info(0x5B, Z80_MN.LD_rr_inn, '', 'DE');
        case 0x5C: return new Z80_opcode_info(0x5C, Z80_MN.NEG, 'NEG');
        case 0x5D: return new Z80_opcode_info(0x5D, Z80_MN.RETI, 'RETI');
        case 0x5E: return new Z80_opcode_info(0x5E, Z80_MN.IM_o, '', '2');
        case 0x5F: return new Z80_opcode_info(0x5F, Z80_MN.LD_r_r2, '', 'A', 'R');

        case 0x60: return new Z80_opcode_info(0x60, Z80_MN.IN_r_ic, '', 'H');
        case 0x61: return new Z80_opcode_info(0x61, Z80_MN.OUT_ic_r, '', 'H');
        case 0x62: return new Z80_opcode_info(0x62, Z80_MN.SBC_hl_rr, '', 'HL');
        case 0x63: return new Z80_opcode_info(0x63, Z80_MN.LD_inn_rr, '', 'HL');
        case 0x64: return new Z80_opcode_info(0x64, Z80_MN.NEG, 'NEG');
        case 0x65: return new Z80_opcode_info(0x65, Z80_MN.RETN, 'RETN');
        case 0x66: return new Z80_opcode_info(0x66, Z80_MN.IM_o, '', '0');
        case 0x67: return new Z80_opcode_info(0x67, Z80_MN.RRD, 'RRD', 'HL');
        case 0x68: return new Z80_opcode_info(0x68, Z80_MN.IN_r_ic, '', 'L');
        case 0x69: return new Z80_opcode_info(0x69, Z80_MN.OUT_ic_r, '', 'L');
        case 0x6A: return new Z80_opcode_info(0x6A, Z80_MN.ADC_hl_rr, '', 'HL');
        case 0x6B: return new Z80_opcode_info(0x6B, Z80_MN.LD_rr_inn, '', 'HL');
        case 0x6C: return new Z80_opcode_info(0x6C, Z80_MN.NEG, 'NEG');
        case 0x6D: return new Z80_opcode_info(0x6D, Z80_MN.RETI, 'RETI');
        case 0x6E: return new Z80_opcode_info(0x6E, Z80_MN.IM_o, '', '0');
        case 0x6F: return new Z80_opcode_info(0x6F, Z80_MN.RLD, 'RLD', 'HL');

        case 0x70: return new Z80_opcode_info(0x70, Z80_MN.IN_ic, '');
        case 0x71: return new Z80_opcode_info(0x71, Z80_MN.OUT_ic, '');
        case 0x72: return new Z80_opcode_info(0x72, Z80_MN.SBC_hl_rr, '', 'SP');
        case 0x73: return new Z80_opcode_info(0x73, Z80_MN.LD_inn_rr, '', 'SP');
        case 0x74: return new Z80_opcode_info(0x74, Z80_MN.NEG, 'NEG');
        case 0x75: return new Z80_opcode_info(0x75, Z80_MN.RETN, 'RETN');
        case 0x76: return new Z80_opcode_info(0x76, Z80_MN.IM_o, '', '1');
        case 0x77: return new Z80_opcode_info(0x77, Z80_MN.NOP, 'NOP');
        case 0x78: return new Z80_opcode_info(0x78, Z80_MN.IN_r_ic, '', 'A');
        case 0x79: return new Z80_opcode_info(0x79, Z80_MN.OUT_ic_r, '', 'A');
        case 0x7A: return new Z80_opcode_info(0x7A, Z80_MN.ADC_hl_rr, '', 'SP');
        case 0x7B: return new Z80_opcode_info(0x7B, Z80_MN.LD_rr_inn, '', 'SP');
        case 0x7C: return new Z80_opcode_info(0x7C, Z80_MN.NEG, 'NEG');
        case 0x7D: return new Z80_opcode_info(0x7D, Z80_MN.RETI, 'RETI');
        case 0x7E: return new Z80_opcode_info(0x7E, Z80_MN.IM_o, '', '2');
        case 0x7F: return new Z80_opcode_info(0x7F, Z80_MN.NOP, 'NOP');

        case 0xA0: return new Z80_opcode_info(0xA0, Z80_MN.LDI, 'LDI');
        case 0xA1: return new Z80_opcode_info(0xA1, Z80_MN.CPI, 'CPI');
        case 0xA2: return new Z80_opcode_info(0xA2, Z80_MN.INI, 'INI');
        case 0xA3: return new Z80_opcode_info(0xA3, Z80_MN.OUTI, 'OUTI');
        case 0xA8: return new Z80_opcode_info(0xA8, Z80_MN.LDD, 'LDD');
        case 0xA9: return new Z80_opcode_info(0xA9, Z80_MN.CPD, 'CPD');
        case 0xAA: return new Z80_opcode_info(0xAA, Z80_MN.IND, 'IND');
        case 0xAB: return new Z80_opcode_info(0xAB, Z80_MN.OUTD, 'OUTD');

        case 0xB0: return new Z80_opcode_info(0xB0, Z80_MN.LDIR, 'LDIR');
        case 0xB1: return new Z80_opcode_info(0xB1, Z80_MN.CPIR, 'CPIR');
        case 0xB2: return new Z80_opcode_info(0xB2, Z80_MN.INIR, 'INIR');
        case 0xB3: return new Z80_opcode_info(0xB3, Z80_MN.OTIR, 'OTIR');
        case 0xB8: return new Z80_opcode_info(0xB8, Z80_MN.LDDR, 'LDDR');
        case 0xB9: return new Z80_opcode_info(0xB9, Z80_MN.CPDR, 'CPDR');
        case 0xBA: return new Z80_opcode_info(0xBA, Z80_MN.INDR, 'INDR');
        case 0xBB: return new Z80_opcode_info(0xBB, Z80_MN.OTDR, 'OTDR');
        default: return new Z80_opcode_info(opcode, Z80_MN.UKN, 'UKNOWN');
    }
}


for (let i = 0; i < 0x102; i++) {
    Z80_opcode_matrix_premn.set(i, Z80_opcode_matrix_premn_func(i));
    if (i < 0x100) {
        Z80_CB_opcode_matrix_premn.set(i, Z80_CB_opcode_matrix_premn_func(i));
        Z80_CBd_opcode_matrix_premn.set(i, Z80_CBd_opcode_matrix_premn_func(i));
        Z80_ED_opcode_matrix_premn.set(i, Z80_ED_opcode_matrix_premn_func(i));
    }
}

export const Z80_MAX_OPCODE = 0x101;
export function Z80_prefixes(w: u32): u32 {
    switch(w) {
        case 0: return 0;
        case 1: return 0xCB;
        case 2: return 0xDD;
        case 3: return 0xED;
        case 4: return 0xFD;
        case 5: return 0xDDCB;
        default: return 0xFDCB;
    }
}

export function Z80_prefix_to_codemap(prefix: u32): u32 {
    switch(prefix) {
        case 0: return 0;
        case 0xCB: return Z80_MAX_OPCODE+1;
        case 0xDD: return (Z80_MAX_OPCODE + 1) * 2;
        case 0xED: return (Z80_MAX_OPCODE + 1) * 3;
        case 0xFD: return (Z80_MAX_OPCODE + 1) * 4;
        case 0xDDCB: return (Z80_MAX_OPCODE + 1) * 5;
        case 0xFDCB: return (Z80_MAX_OPCODE + 1) * 6;
        default:
            debugger;
            return -1;
    }
}

export class Z80_opcode_functions {
    opcode: u32 = 0
    ins: Z80_MN = Z80_MN.UKN
    mnemonic: string = ''
    exec_func: (regs: z80_regs, pins: z80_pins) => void

    constructor(opcode_info: Z80_opcode_info, exec_func: (regs: z80_regs, pins: z80_pins) => void) {
        this.opcode = opcode_info.opcode;
        this.ins = opcode_info.ins;
        this.mnemonic = opcode_info.mnemonic;
        this.exec_func = exec_func;
    }
}


export const Z80_S_IRQ = 0x100;
export const Z80_S_RESET = 0x101;
// SPECIAL #. This is above Z80_MAX because it is special-case handled by cycle()
export const Z80_S_DECODE = 0x102;
