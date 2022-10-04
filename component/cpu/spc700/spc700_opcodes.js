'use strict';

const SPC_MN = Object.freeze({
    UNKNOWN: 0,
    ADC: 1,
    ADDW: 2,
    AND: 3,
    AND1: 4,
    AND1f: 401,
    ASL: 5,
    BBC: 6,
    BBS: 7,
    BCC: 8,
    BCS: 9,
    BEQ: 10,
    BMI: 11,
    BNE: 12,
    BPL: 13,
    BVC: 14,
    BVS: 15,
    BRA: 16,
    BRK: 17,
    CALL: 18,
    CBNE: 19,
    CLR1: 20,
    CLRC: 21,
    CLRP: 22,
    CLRV: 23,
    CMP: 24,
    CMPW: 25,
    DAA: 26,
    DAS: 27,
    DBNZ: 28,
    DEC: 29,
    DECW: 30,
    DI: 31,
    DIV: 32,
    EI: 33,
    EOR: 34,
    EOR1: 35,
    INC: 36,
    INCW: 37,
    JMP: 38,
    LSR: 39,
    MOV: 40,
    MOV1: 41,
    MOVW: 42,
    MUL: 43,
    NOP: 44,
    NOT1: 45,
    NOTC: 46,
    OR: 47,
    OR1: 48,
    OR1f: 4801,
    PCALL: 49,
    POP: 50,
    PUSH: 51,
    RET: 52,
    RET1: 53,
    ROL: 54,
    ROR: 55,
    SBC: 56,
    SET1: 57,
    SETC: 58,
    SETP: 59,
    SLEEP: 60,
    STOP: 61,
    SUBW: 62,
    TCALL: 63,
    TCLR1: 64,
    TSET1: 65,
    XCN: 66
});

const SPC_AM = Object.freeze({
    I: 0, // Implied
    PC_R: 2, // PC relative
    IND_XY: 3, // X/Y indirect Zero Page
    RX: 4, // register X
    RY: 5, // register Y
    RA: 6, // register A
    A_IND_X: 7, // [!abs+X]
    MOV: 8, // MOV has its own stuff
    DP_IMM: 9, // dp, #imm
    X_IMM: 10, // X, #imm
    X_DP: 11, // X, dp
    X_A: 12, // X, !abs
    Y_IMM: 13, // Y, #imm
    Y_DP: 14, // Y, dp
    Y_A: 15, // Y, !abs
    DP_DP: 16, // dp, dp
    MEMBITR: 17, // 2 bytes. 13 bits absolute address, 3 bits bit #. read-only
    MEMBITW: 1, // 2 bytes. 13 bits absolute address, 3 bits bit #. write after
    DP: 18, // dp
    DP_INDEXED_X: 19, // dp+X
    MOVW: 20,
    PC_R_BIT: 21, // PC relative based on a bit
    D_BIT: 22, // dp.n
    RA_IMM: 23,  // A, #imm
    RA_IND_X: 24, // A, (X)
    RA_IND_INDEXED_X: 25, // A, [dp+X]
    RA_IND_Y_INDEXED: 26, // A, [dp]+Y
    RA_DP: 27, // A, dp
    RA_DP_X: 28, // A, dp+X
    RA_A: 29, // A, !abs
    RA_A_X: 30, // A, !abs+X
    RA_A_Y: 31, // A, !abs+Y
    YA_DP: 32, // YA, dp
    A: 33, // !abs
    A16: 3301, // !abs 16-bits
    PC_R_D_X: 34, // dp+X, r
    PC_R_D: 35, // dp, r
    RX_IMM: 36, // X, #imm
    RX_DP: 37, // X, dp
    RX_A: 38, // X, !abs
    RY_IMM: 39, // Y, #imm
    RY_DP: 40, // Y dp
    RY_A: 41, // Y, !abs
    RY_R: 42, // Y, r
    DP_R: 43, // dp, r
    DPW: 44, // dp (word)
    YA_X: 45, // YA, X for DIV
    RYA: 46, // YA for MUL
    STACK: 47, // Stack pop
    DCB: 48, // For assembler
    JMPA: 49, // Jump Absolute
    IMM: 50 // Immediate
});


class SPC_OP_INFO {
    constructor(opcode, mnemonic, operand, ins, addr_mode, cycles) {
        this.opcode = opcode;
        this.mnemonic = mnemonic;
        this.operand = operand;
        this.ins = ins;
        this.addr_mode = addr_mode;
        this.cycles = cycles;
    }
}


const SPC_INS = Object.freeze({
    // Opcodes used in boot IPL
    0x00: new SPC_OP_INFO(0x00, 'NOP', '', SPC_MN.NOP, SPC_AM.I, 2), // X
    0x01: new SPC_OP_INFO(0x01, 'TCALL', '0', SPC_MN.TCALL, SPC_AM.I, 8), // X
    0x0B: new SPC_OP_INFO(0x0B, 'ASL', 'd', SPC_MN.ASL, SPC_AM.DP, 4), // X
    0x10: new SPC_OP_INFO(0x10, 'BPL', 'r', SPC_MN.BPL, SPC_AM.PC_R, 2), // +2 for branch
    0x19: new SPC_OP_INFO(0x19, 'OR', '(X), (Y)', SPC_MN.OR, SPC_AM.IND_XY, 5), // X
    0x1D: new SPC_OP_INFO(0x1D, 'DEC', 'X', SPC_MN.DEC, SPC_AM.RX, 2), // X
    0x1F: new SPC_OP_INFO(0x1F, 'JMP', '[!abs+X]', SPC_MN.JMP, SPC_AM.A_IND_X, 6), // X
    0x2F: new SPC_OP_INFO(0x2F, 'BRA', 'r', SPC_MN.BRA, SPC_AM.PC_R, 2), // X
    0x5D: new SPC_OP_INFO(0x5D, 'MOV', 'X, A', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0x78: new SPC_OP_INFO(0x78, 'CMP', 'dp, #imm', SPC_MN.CMP, SPC_AM.DP_IMM, 5), // X
    0x7E: new SPC_OP_INFO(0x7E, 'CMP', 'Y, dp', SPC_MN.CMP, SPC_AM.Y_DP, 3), // X
    0x8F: new SPC_OP_INFO(0x8F, 'MOV', 'd, #imm', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xAA: new SPC_OP_INFO(0xAA, 'MOV1', 'C, m.b', SPC_MN.MOV1, SPC_AM.MEMBITR, 4), // X
    0xAB: new SPC_OP_INFO(0xAB, 'INC', 'dp', SPC_MN.INC, SPC_AM.DP, 4), // X
    0xBA: new SPC_OP_INFO(0xBA, 'MOVW', 'YA, dp', SPC_MN.MOVW, SPC_AM.MOVW, 5), // X
    0xBB: new SPC_OP_INFO(0xBB, 'INC', 'dp+X', SPC_MN.INC, SPC_AM.DP_INDEXED_X, 5), // X
    0xBD: new SPC_OP_INFO(0xBD, 'MOV', 'SP, X', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0xC0: new SPC_OP_INFO(0xC0, 'DI', '', SPC_MN.DI, SPC_AM.I, 3), // X
    0xC4: new SPC_OP_INFO(0xC4, 'MOV', 'd, A', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xC6: new SPC_OP_INFO(0xC6, 'MOV', '(X), A', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xCB: new SPC_OP_INFO(0xCB, 'MOV', 'd, Y', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xCC: new SPC_OP_INFO(0xCC, 'MOV', '!a, Y', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xCD: new SPC_OP_INFO(0xCD, 'MOV', 'X, #imm', SPC_MN.MOV, SPC_AM.MOV,2), // X
    0xD0: new SPC_OP_INFO(0xD0, 'BNE', 'r', SPC_MN.BNE, SPC_AM.PC_R, 2), // X
    0xD7: new SPC_OP_INFO(0xD7, 'MOV', '[dp]+Y, A', SPC_MN.MOV, SPC_AM.MOV, 7), // X
    0xDA: new SPC_OP_INFO(0xDA, 'MOVW', 'd, YA', SPC_MN.MOVW, SPC_AM.MOVW, 5), // X
    0xDB: new SPC_OP_INFO(0xDB, 'MOV', 'dp+X, Y', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xDD: new SPC_OP_INFO(0xDD, 'MOV', 'A, Y', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0xE4: new SPC_OP_INFO(0xE4, 'MOV', 'A, dp', SPC_MN.MOV, SPC_AM.MOV, 3), // X
    0xE8: new SPC_OP_INFO(0xE8, 'MOV', 'A, #imm', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0xEB: new SPC_OP_INFO(0xEB, 'MOV', 'Y, dp', SPC_MN.MOV, SPC_AM.MOV, 3), // X
    0xEF: new SPC_OP_INFO(0xEF, 'SLEEP', '', SPC_MN.SLEEP, SPC_AM.I, 3), // X
    0xF3: new SPC_OP_INFO(0xF3, 'BBC', 'dp.n, r', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0xF4: new SPC_OP_INFO(0xF4, 'MOV', 'A, dp+X', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xF5: new SPC_OP_INFO(0xF5, 'MOV', '!a+X', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xF6: new SPC_OP_INFO(0xF6, 'MOV', '!a+Y', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xFB: new SPC_OP_INFO(0xFB, 'MOV', 'Y, dp+X', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xFC: new SPC_OP_INFO(0xFC, 'INC', 'Y', SPC_MN.INC, SPC_AM.RY, 2), // X
    0xFF: new SPC_OP_INFO(0xFF, 'STOP', '', SPC_MN.STOP, SPC_AM.I, 2), // X

    // Rest of opcodes, not as well tested ATM
    0x02: new SPC_OP_INFO(0x02, 'SET1', 'dp.0', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x03: new SPC_OP_INFO(0x03, 'BBS', 'dp.0, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x04: new SPC_OP_INFO(0x04, 'OR', 'A, dp', SPC_MN.OR, SPC_AM.RA_DP, 3), // X
    0x05: new SPC_OP_INFO(0x05, 'OR', 'A, !abs', SPC_MN.OR, SPC_AM.RA_A, 4),
    0x06: new SPC_OP_INFO(0x06, 'OR', 'A, (X)', SPC_MN.OR, SPC_AM.RA_IND_X, 3), // X
    0x07: new SPC_OP_INFO(0x07, 'OR', 'A, [dp+X]', SPC_MN.OR, SPC_AM.RA_IND_INDEXED_X, 6),
    0x08: new SPC_OP_INFO(0x08, 'OR', 'A, #', SPC_MN.OR, SPC_AM.RA_IMM, 2), // X
    0x09: new SPC_OP_INFO(0x09, 'OR', 'dp, dp', SPC_MN.OR, SPC_AM.DP_DP, 6),
    0x0A: new SPC_OP_INFO(0x0A, 'OR1', 'C, m.b', SPC_MN.OR1, SPC_AM.MEMBITR, 5),
    0x0C: new SPC_OP_INFO(0x0C, 'ASL', '!abs', SPC_MN.ASL, SPC_AM.A, 5),
    0x0D: new SPC_OP_INFO(0x0D, 'PUSH', 'P', SPC_MN.PUSH, SPC_AM.STACK, 4),
    0x0E: new SPC_OP_INFO(0x0E, 'TSET1', '!abs', SPC_MN.TSET1, SPC_AM.A, 6),
    0x0F: new SPC_OP_INFO(0x0F, 'BRK', 'i', SPC_MN.BRK, SPC_AM.I, 8),
    0x11: new SPC_OP_INFO(0x11, 'TCALL', 'i', SPC_MN.TCALL, SPC_AM.I, 8),
    0x12: new SPC_OP_INFO(0x12, 'CLR1', 'dp.0', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x13: new SPC_OP_INFO(0x13, 'BBC', 'dp.0', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x14: new SPC_OP_INFO(0x14, 'OR', 'A, dp+X', SPC_MN.OR, SPC_AM.RA_DP_X, 4),
    0x15: new SPC_OP_INFO(0x15, 'OR', 'A, !abs+X', SPC_MN.OR, SPC_AM.RA_A_X, 5),
    0x16: new SPC_OP_INFO(0x16, 'OR', 'A, !abs+Y', SPC_MN.OR, SPC_AM.RA_A_Y, 5),
    0x17: new SPC_OP_INFO(0x17, 'OR', 'A, [dp]+Y', SPC_MN.OR, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x18: new SPC_OP_INFO(0x18, 'OR', 'dp, #imm', SPC_MN.OR, SPC_AM.DP_IMM, 5),
    0x1A: new SPC_OP_INFO(0x1A, 'DECW', 'dp', SPC_MN.DECW, SPC_AM.DPW, 6),
    0x1B: new SPC_OP_INFO(0x1B, 'ASL', 'dp+X', SPC_MN.ASL, SPC_AM.DP_INDEXED_X, 5),
    0x1C: new SPC_OP_INFO(0x1C, 'ASL', 'A', SPC_MN.ASL, SPC_AM.RA, 2),
    0x1E: new SPC_OP_INFO(0x1E, 'CMP', 'X, !abs', SPC_MN.CMP, SPC_AM.RX_A, 4),
    0x20: new SPC_OP_INFO(0x20, 'CLRP', 'i', SPC_MN.CLRP, SPC_AM.I, 2),
    0x21: new SPC_OP_INFO(0x21, 'TCALL', '2', SPC_MN.TCALL, SPC_AM.I, 8),
    0x22: new SPC_OP_INFO(0x22, 'SET1', 'dp.1', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x23: new SPC_OP_INFO(0x23, 'BBS', 'dp.1, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x24: new SPC_OP_INFO(0x24, 'AND', 'A, dp', SPC_MN.AND, SPC_AM.RA_DP, 3),
    0x25: new SPC_OP_INFO(0x25, 'AND', 'A, !abs', SPC_MN.AND, SPC_AM.RA_A, 4),
    0x26: new SPC_OP_INFO(0x26, 'AND', 'A, (X)', SPC_MN.AND, SPC_AM.RA_IND_X, 3),
    0x27: new SPC_OP_INFO(0x27, 'AND', 'A, [dp+X]', SPC_MN.AND, SPC_AM.RA_IND_INDEXED_X, 6),
    0x28: new SPC_OP_INFO(0x28, 'AND', 'A, #imm', SPC_MN.AND, SPC_AM.RA_IMM, 2),
    0x29: new SPC_OP_INFO(0x29, 'AND', 'dp, dp', SPC_MN.AND, SPC_AM.DP_DP, 6),
    0x2A: new SPC_OP_INFO(0x2A, 'OR1', 'C, /m.b', SPC_MN.OR1f, SPC_AM.MEMBITR, 5),
    0x2B: new SPC_OP_INFO(0x2B, 'ROL', 'dp', SPC_MN.ROL, SPC_AM.DP, 4),
    0x2C: new SPC_OP_INFO(0x2C, 'ROL', '!abs', SPC_MN.ROL, SPC_AM.A, 5),
    0x2D: new SPC_OP_INFO(0x2D, 'PUSH', 'A', SPC_MN.PUSH, SPC_AM.STACK, 4),
    0x2E: new SPC_OP_INFO(0x2E, 'CBNE', 'dp, r', SPC_MN.CBNE, SPC_AM.PC_R_D, 5),
    0x30: new SPC_OP_INFO(0x30, 'BMI', 'r', SPC_MN.BMI, SPC_AM.PC_R, 2),
    0x31: new SPC_OP_INFO(0x31, 'TCALL', '3', SPC_MN.TCALL, SPC_AM.I, 8),
    0x32: new SPC_OP_INFO(0x32, 'CLR1', 'dp.1', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x33: new SPC_OP_INFO(0x33, 'BBC', 'dp.1', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x34: new SPC_OP_INFO(0x34, 'AND', 'A, dp+X', SPC_MN.AND, SPC_AM.RA_DP_X, 4),
    0x35: new SPC_OP_INFO(0x35, 'AND', 'A, !abs+X', SPC_MN.AND, SPC_AM.RA_A_X, 5),
    0x36: new SPC_OP_INFO(0x36, 'AND', 'A, !abs+Y', SPC_MN.AND, SPC_AM.RA_A_Y, 5),
    0x37: new SPC_OP_INFO(0x37, 'AND', 'A, [dp]+Y', SPC_MN.AND, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x38: new SPC_OP_INFO(0x38, 'AND', 'dp, #imm', SPC_MN.AND, SPC_AM.DP_IMM, 5),
    0x39: new SPC_OP_INFO(0x39, 'AND', '(X), (Y)', SPC_MN.AND, SPC_AM.IND_XY, 5),
    0x3A: new SPC_OP_INFO(0x3A, 'INCW', 'dp', SPC_MN.INCW, SPC_AM.DPW, 6),
    0x3B: new SPC_OP_INFO(0x3B, 'ROL', 'dp+X', SPC_MN.ROL, SPC_AM.DP_INDEXED_X, 5),
    0x3C: new SPC_OP_INFO(0x3C, 'ROL', 'A', SPC_MN.ROL, SPC_AM.RA, 2),
    0x3D: new SPC_OP_INFO(0x3D, 'INC', 'X', SPC_MN.INC, SPC_AM.RX, 2),
    0x3E: new SPC_OP_INFO(0x3E, 'CMP', 'X, dp', SPC_MN.CMP, SPC_AM.RX_DP, 3),
    0x3F: new SPC_OP_INFO(0x3F, 'CALL', '!abs', SPC_MN.CALL, SPC_AM.A16, 8),
    0x40: new SPC_OP_INFO(0x40, 'SETP', 'i', SPC_MN.SETP, SPC_AM.I, 2),
    0x41: new SPC_OP_INFO(0x41, 'TCALL', '4', SPC_MN.TCALL, SPC_AM.I, 8),
    0x42: new SPC_OP_INFO(0x42, 'SET1', 'dp.2', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x43: new SPC_OP_INFO(0x43, 'BBS', 'dp.2, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x44: new SPC_OP_INFO(0x44, 'EOR', 'A, dp', SPC_MN.EOR, SPC_AM.RA_DP, 3),
    0x45: new SPC_OP_INFO(0x45, 'EOR', 'A, !abs', SPC_MN.EOR, SPC_AM.RA_A, 4),
    0x46: new SPC_OP_INFO(0x46, 'EOR', 'A, (X)', SPC_MN.EOR, SPC_AM.RA_IND_X, 3),
    0x47: new SPC_OP_INFO(0x47, 'EOR', 'A, [dp+X]', SPC_MN.EOR, SPC_AM.RA_IND_INDEXED_X, 6),
    0x48: new SPC_OP_INFO(0x48, 'EOR', 'A, #imm', SPC_MN.EOR, SPC_AM.RA_IMM, 2),
    0x49: new SPC_OP_INFO(0x49, 'EOR', 'dp, dp', SPC_MN.EOR, SPC_AM.DP_DP, 6),
    0x4A: new SPC_OP_INFO(0x4A, 'AND1', 'm.b', SPC_MN.AND1, SPC_AM.MEMBITR, 4), // X
    0x4B: new SPC_OP_INFO(0x4B, 'LSR', 'dp', SPC_MN.LSR, SPC_AM.DP, 4),
    0x4C: new SPC_OP_INFO(0x4C, 'LSR', '!abs', SPC_MN.LSR, SPC_AM.A, 5),
    0x4D: new SPC_OP_INFO(0x4D, 'PUSH', 'X', SPC_MN.PUSH, SPC_AM.STACK, 4),
    0x4E: new SPC_OP_INFO(0x4E, 'TCLR1', '!abs', SPC_MN.TCLR1, SPC_AM.A, 6),
    0x4F: new SPC_OP_INFO(0x4F, 'PCALL', '#imm', SPC_MN.PCALL, SPC_AM.IMM, 6),
    0x50: new SPC_OP_INFO(0x50, 'BVC', 'r', SPC_MN.BVC, SPC_AM.PC_R, 2),
    0x51: new SPC_OP_INFO(0x51, 'TCALL', '5', SPC_MN.TCALL, SPC_AM.I, 8),
    0x52: new SPC_OP_INFO(0x52, 'CLR1', 'dp.2', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x53: new SPC_OP_INFO(0x53, 'BBC', 'dp.2', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x54: new SPC_OP_INFO(0x54, 'EOR', 'A, dp+X', SPC_MN.EOR, SPC_AM.RA_DP_X, 4),
    0x55: new SPC_OP_INFO(0x55, 'EOR', 'A, !abs+X', SPC_MN.EOR, SPC_AM.RA_A_X, 5),
    0x56: new SPC_OP_INFO(0x56, 'EOR', 'A, !abs+Y', SPC_MN.EOR, SPC_AM.RA_A_Y, 5),
    0x57: new SPC_OP_INFO(0x57, 'EOR', 'A, [dp]+Y', SPC_MN.EOR, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x58: new SPC_OP_INFO(0x58, 'EOR', 'dp, #imm', SPC_MN.EOR, SPC_AM.DP_IMM, 5),
    0x59: new SPC_OP_INFO(0x59, 'EOR', '(X), (Y)', SPC_MN.EOR, SPC_AM.IND_XY, 5),
    0x5A: new SPC_OP_INFO(0x5A, 'CMPW', '', SPC_MN.CMPW, SPC_AM.YA_DP, 4),
    0x5B: new SPC_OP_INFO(0x5B, 'LSR', 'dp+X', SPC_MN.LSR, SPC_AM.DP_INDEXED_X, 5),
    0x5C: new SPC_OP_INFO(0x5C, 'LSR', 'A', SPC_MN.LSR, SPC_AM.RA, 2),
    0x5E: new SPC_OP_INFO(0x5E, 'CMP', 'Y, !abs', SPC_MN.CMP, SPC_AM.RY_A, 4),
    0x5F: new SPC_OP_INFO(0x5F, 'JMP', '!abs', SPC_MN.JMP, SPC_AM.JMPA, 3),
    0x60: new SPC_OP_INFO(0x60, 'CLRC', 'i', SPC_MN.CLRC, SPC_AM.I, 2),
    0x61: new SPC_OP_INFO(0x61, 'TCALL', '6', SPC_MN.TCALL, SPC_AM.I, 8),
    0x62: new SPC_OP_INFO(0x62, 'SET1', 'dp.3', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x63: new SPC_OP_INFO(0x63, 'BBS', 'dp.3, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x64: new SPC_OP_INFO(0x64, 'CMP', 'A, dp', SPC_MN.CMP, SPC_AM.RA_DP, 3),
    0x65: new SPC_OP_INFO(0x65, 'CMP', 'A, !abs', SPC_MN.CMP, SPC_AM.RA_A, 4),
    0x66: new SPC_OP_INFO(0x66, 'CMP', 'A, (X)', SPC_MN.CMP, SPC_AM.RA_IND_X, 3),
    0x67: new SPC_OP_INFO(0x67, 'CMP', 'A, [dp+X]', SPC_MN.CMP, SPC_AM.RA_IND_INDEXED_X, 6),
    0x68: new SPC_OP_INFO(0x68, 'CMP', 'A, #i', SPC_MN.CMP, SPC_AM.RA_IMM, 2),
    0x69: new SPC_OP_INFO(0x69, 'CMP', 'dp, dp', SPC_MN.CMP, SPC_AM.DP_DP, 6),
    0x6A: new SPC_OP_INFO(0x6A, 'AND1', 'C, /m.b', SPC_MN.AND1f, SPC_AM.MEMBITR, 4), // X
    0x6B: new SPC_OP_INFO(0x6B, 'ROR', 'dp', SPC_MN.ROR, SPC_AM.DP, 4),
    0x6C: new SPC_OP_INFO(0x6C, 'ROR', '!abs', SPC_MN.ROR, SPC_AM.A, 5),
    0x6D: new SPC_OP_INFO(0x6D, 'PUSH', 'Y', SPC_MN.PUSH, SPC_AM.STACK, 4),
    0x6E: new SPC_OP_INFO(0x6E, 'DBNZ', 'dp, r', SPC_MN.DBNZ, SPC_AM.DP_R, 5),
    0x6F: new SPC_OP_INFO(0x6F, 'RET', 'i', SPC_MN.RET, SPC_AM.I, 5),
    0x70: new SPC_OP_INFO(0x70, 'BVS', 'r', SPC_MN.BVS, SPC_AM.PC_R, 2),
    0x71: new SPC_OP_INFO(0x71, 'TCALL', '7', SPC_MN.TCALL, SPC_AM.I, 8),
    0x72: new SPC_OP_INFO(0x72, 'CLR1', 'dp.3', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x73: new SPC_OP_INFO(0x73, 'BBC', 'dp.3', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x74: new SPC_OP_INFO(0x74, 'CMP', 'A, dp+X', SPC_MN.CMP, SPC_AM.RA_DP_X, 4),
    0x75: new SPC_OP_INFO(0x75, 'CMP', 'A, !abs+X', SPC_MN.CMP, SPC_AM.RA_A_X, 5),
    0x76: new SPC_OP_INFO(0x76, 'CMP', 'A, !abs+Y', SPC_MN.CMP, SPC_AM.RA_A_Y, 5),
    0x77: new SPC_OP_INFO(0x77, 'CMP', 'A, [dp]+Y', SPC_MN.CMP, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x79: new SPC_OP_INFO(0x79, 'CMP', '(X), (Y)', SPC_MN.CMP, SPC_AM.IND_XY, 5),
    0x7A: new SPC_OP_INFO(0x7A, 'ADDW', 'YA, dp', SPC_MN.ADDW, SPC_AM.YA_DP, 5),
    0x7B: new SPC_OP_INFO(0x7B, 'ROR', 'dp+X', SPC_MN.ROR, SPC_AM.DP_INDEXED_X, 5),
    0x7C: new SPC_OP_INFO(0x7C, 'ROR', 'A', SPC_MN.ROR, SPC_AM.RA, 2),
    0x7D: new SPC_OP_INFO(0x7D, 'MOV', 'A, X', SPC_MN.MOV, SPC_AM.MOV, 2),
    0x7F: new SPC_OP_INFO(0x7F, 'RET1', 'i', SPC_MN.RET1, SPC_AM.I, 6),
    0x80: new SPC_OP_INFO(0x80, 'SETC', 'i', SPC_MN.SETC, SPC_AM.I, 2),
    0x81: new SPC_OP_INFO(0x81, 'TCALL', '8', SPC_MN.TCALL, SPC_AM.I, 8),
    0x82: new SPC_OP_INFO(0x82, 'SET1', 'dp.4', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x83: new SPC_OP_INFO(0x83, 'BBS', 'dp.4, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x84: new SPC_OP_INFO(0x84, 'ADC', 'A, dp', SPC_MN.ADC, SPC_AM.RA_DP, 3),
    0x85: new SPC_OP_INFO(0x85, 'ADC', '!abs', SPC_MN.ADC, SPC_AM.RA_A, 4),
    0x86: new SPC_OP_INFO(0x86, 'ADC', 'A, (X)', SPC_MN.ADC, SPC_AM.RA_IND_X, 3),
    0x87: new SPC_OP_INFO(0x87, 'ADC', 'A, [dp+X]', SPC_MN.ADC, SPC_AM.RA_IND_INDEXED_X, 6),
    0x88: new SPC_OP_INFO(0x88, 'ADC', 'A, #imm', SPC_MN.ADC, SPC_AM.RA_IMM, 2),
    0x89: new SPC_OP_INFO(0x89, 'ADC', 'dp, dp', SPC_MN.ADC, SPC_AM.DP_DP, 6),
    0x8A: new SPC_OP_INFO(0x8A, 'EOR1', 'C, m.b', SPC_MN.EOR1, SPC_AM.MEMBITR, 5),
    0x8B: new SPC_OP_INFO(0x8B, 'DEC', 'dp', SPC_MN.DEC, SPC_AM.DP, 4),
    0x8C: new SPC_OP_INFO(0x8C, 'DEC', '!abs', SPC_MN.DEC, SPC_AM.A, 5),
    0x8D: new SPC_OP_INFO(0x8D, 'MOV', 'Y, #imm', SPC_MN.MOV, SPC_AM.MOV, 2),
    0x8E: new SPC_OP_INFO(0x8E, 'POP', 'P', SPC_MN.POP, SPC_AM.STACK, 4),
    0x90: new SPC_OP_INFO(0x90, 'BCC', 'r', SPC_MN.BCC, SPC_AM.PC_R, 2),
    0x91: new SPC_OP_INFO(0x91, 'TCALL', '9', SPC_MN.TCALL, SPC_AM.I, 8),
    0x92: new SPC_OP_INFO(0x92, 'CLR1', 'dp.4', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x93: new SPC_OP_INFO(0x93, 'BBC', 'dp.4', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x94: new SPC_OP_INFO(0x94, 'ADC', 'A, dp+X', SPC_MN.ADC, SPC_AM.RA_DP_X, 4),
    0x95: new SPC_OP_INFO(0x95, 'ADC', 'A, !abs+X', SPC_MN.ADC, SPC_AM.RA_A_X, 5),
    0x96: new SPC_OP_INFO(0x96, 'ADC', 'A, !abs+Y', SPC_MN.ADC, SPC_AM.RA_A_Y, 5),
    0x97: new SPC_OP_INFO(0x97, 'ADC', 'A, [dp]+Y', SPC_MN.ADC, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x98: new SPC_OP_INFO(0x98, 'ADC', 'dp, #imm', SPC_MN.ADC, SPC_AM.DP_IMM, 5),
    0x99: new SPC_OP_INFO(0x99, 'ADC', '(X), (Y)', SPC_MN.ADC, SPC_AM.IND_XY, 5),
    0x9A: new SPC_OP_INFO(0x9A, 'SUBW', 'YA, dp', SPC_MN.SUBW, SPC_AM.YA_DP, 5),
    0x9B: new SPC_OP_INFO(0x9B, 'DEC', 'dp+X', SPC_MN.DEC, SPC_AM.DP_INDEXED_X, 5),
    0x9C: new SPC_OP_INFO(0x9C, 'DEC', 'A', SPC_MN.DEC, SPC_AM.RA, 2),
    0x9D: new SPC_OP_INFO(0x9D, 'MOV', 'X, SP', SPC_MN.MOV, SPC_AM.MOV, 2),
    0x9E: new SPC_OP_INFO(0x9E, 'DIV', 'YA, X', SPC_MN.DIV, SPC_AM.YA_X, 12),
    0x9F: new SPC_OP_INFO(0x9F, 'XCN', 'i', SPC_MN.XCN, SPC_AM.I, 5),
    0xA0: new SPC_OP_INFO(0xA0, 'EI', 'i', SPC_MN.EI, SPC_AM.I, 3),
    0xA1: new SPC_OP_INFO(0xA1, 'TCALL', '10', SPC_MN.TCALL, SPC_AM.I, 8),
    0xA2: new SPC_OP_INFO(0xA2, 'SET1', 'dp.5', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0xA3: new SPC_OP_INFO(0xA3, 'BBS', 'dp.5, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0xA4: new SPC_OP_INFO(0xA4, 'SBC', 'A, dp', SPC_MN.SBC, SPC_AM.RA_DP, 3), // X
    0xA5: new SPC_OP_INFO(0xA5, 'SBC', 'A, !abs', SPC_MN.SBC, SPC_AM.RA_A, 4),
    0xA6: new SPC_OP_INFO(0xA6, 'SBC', 'A, (X)', SPC_MN.SBC, SPC_AM.RA_IND_X, 3),
    0xA7: new SPC_OP_INFO(0xA7, 'SBC', 'A, [dp+X]', SPC_MN.SBC, SPC_AM.RA_IND_INDEXED_X, 6),
    0xA8: new SPC_OP_INFO(0xA8, 'SBC', 'A, #imm', SPC_MN.SBC, SPC_AM.RA_IMM, 2),
    0xA9: new SPC_OP_INFO(0xA9, 'SBC', 'dp, dp', SPC_MN.SBC, SPC_AM.DP_DP, 6),
    0xAC: new SPC_OP_INFO(0xAC, 'INC', '!abs', SPC_MN.INC, SPC_AM.A, 5),
    0xAD: new SPC_OP_INFO(0xAD, 'CMP', 'Y, #imm', SPC_MN.CMP, SPC_AM.RY_IMM, 2),
    0xAE: new SPC_OP_INFO(0xAE, 'POP', 'A', SPC_MN.POP, SPC_AM.STACK, 4),
    0xAF: new SPC_OP_INFO(0xAF, 'MOV', '(X)+, A', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xB0: new SPC_OP_INFO(0xB0, 'BCS', 'r', SPC_MN.BCS, SPC_AM.PC_R, 2),
    0xB1: new SPC_OP_INFO(0xB1, 'TCALL', '11', SPC_MN.TCALL, SPC_AM.I, 8),
    0xB2: new SPC_OP_INFO(0xB2, 'CLR1', 'dp.5', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0xB3: new SPC_OP_INFO(0xB3, 'BBC', 'dp.5', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0xB4: new SPC_OP_INFO(0xB4, 'SBC', 'A, dp+X', SPC_MN.SBC, SPC_AM.RA_DP_X, 4),
    0xB5: new SPC_OP_INFO(0xB5, 'SBC', 'A, !abs+X', SPC_MN.SBC, SPC_AM.RA_A_X, 5),
    0xB6: new SPC_OP_INFO(0xB6, 'SBC', 'A, !abs+Y', SPC_MN.SBC, SPC_AM.RA_A_Y, 5),
    0xB7: new SPC_OP_INFO(0xB7, 'SBC', 'A, [dp]+Y', SPC_MN.SBC, SPC_AM.RA_IND_Y_INDEXED, 6),
    0xB8: new SPC_OP_INFO(0xB8, 'SBC', 'dp, #imm', SPC_MN.SBC, SPC_AM.DP_IMM, 5),
    0xB9: new SPC_OP_INFO(0xB9, 'SBC', '(X), (Y)', SPC_MN.SBC, SPC_AM.IND_XY, 5),
    0xBC: new SPC_OP_INFO(0xBC, 'INC', 'A', SPC_MN.INC, SPC_AM.RA, 2),
    0xBE: new SPC_OP_INFO(0xBE, 'DAS', 'A', SPC_MN.DAS, SPC_AM.I, 3),
    0xBF: new SPC_OP_INFO(0xBF, 'MOV', 'A, (X)+', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xC1: new SPC_OP_INFO(0xC1, 'TCALL', '12', SPC_MN.TCALL, SPC_AM.I, 8),
    0xC2: new SPC_OP_INFO(0xC2, 'SET1', 'dp.6', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0xC3: new SPC_OP_INFO(0xC3, 'BBS', 'dp.6, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0xC5: new SPC_OP_INFO(0xC5, 'MOV', '!abs, A', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xC7: new SPC_OP_INFO(0xC7, 'MOV', '[dp+X], A', SPC_MN.MOV, SPC_AM.MOV, 7),
    0xC8: new SPC_OP_INFO(0xC8, 'CMP', 'X, #i', SPC_MN.CMP, SPC_AM.RX_IMM, 2),
    0xC9: new SPC_OP_INFO(0xC9, 'MOV', '!abs, X', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xCA: new SPC_OP_INFO(0xCA, 'MOV1', 'm.b, C', SPC_MN.MOV1, SPC_AM.MEMBITW, 6),
    0xCE: new SPC_OP_INFO(0xCE, 'POP', 'X', SPC_MN.POP, SPC_AM.STACK, 4),
    0xCF: new SPC_OP_INFO(0xCF, 'MUL', 'YA', SPC_MN.MUL, SPC_AM.RYA, 9),
    0xD1: new SPC_OP_INFO(0xD1, 'TCALL', '13', SPC_MN.TCALL, SPC_AM.I, 8),
    0xD2: new SPC_OP_INFO(0xD2, 'CLR1', 'dp.6', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0xD3: new SPC_OP_INFO(0xD3, 'BBC', 'dp.6', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5),
    0xD4: new SPC_OP_INFO(0xD4, 'MOV', 'dp+X, A', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xD5: new SPC_OP_INFO(0xD5, 'MOV', '!abs+X, A', SPC_MN.MOV, SPC_AM.MOV, 6),
    0xD6: new SPC_OP_INFO(0xD6, 'MOV', '!abs+Y, A', SPC_MN.MOV, SPC_AM.MOV, 6),
    0xD8: new SPC_OP_INFO(0xD8, 'MOV', 'dp, X', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xD9: new SPC_OP_INFO(0xD9, 'MOV', 'dp+Y, X', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xDC: new SPC_OP_INFO(0xDC, 'DEC', 'Y', SPC_MN.DEC, SPC_AM.RY, 2),
    0xDE: new SPC_OP_INFO(0xDE, 'CBNE', 'dp+X, r', SPC_MN.CBNE, SPC_AM.PC_R_D_X, 6),
    0xDF: new SPC_OP_INFO(0xDF, 'DAA', 'A', SPC_MN.DAA, SPC_AM.I, 3),
    0xE0: new SPC_OP_INFO(0xE0, 'CLRV', 'i', SPC_MN.CLRV, SPC_AM.I, 2),
    0xE1: new SPC_OP_INFO(0xE1, 'TCALL', '14', SPC_MN.TCALL, SPC_AM.I, 8),
    0xE2: new SPC_OP_INFO(0xE2, 'SET1', 'dp.7', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0xE3: new SPC_OP_INFO(0xE3, 'BBS', 'dp.7, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0xE5: new SPC_OP_INFO(0xE5, 'MOV', 'A, !abs', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xE6: new SPC_OP_INFO(0xE6, 'MOV', 'A, (X)', SPC_MN.MOV, SPC_AM.MOV, 3),
    0xE7: new SPC_OP_INFO(0xE7, 'MOV', 'A, [dp+X]', SPC_MN.MOV, SPC_AM.MOV, 6),
    0xE9: new SPC_OP_INFO(0xE9, 'MOV', 'X, !abs', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xEA: new SPC_OP_INFO(0xEA, 'NOT1', 'm.b', SPC_MN.NOT1, SPC_AM.MEMBITW, 5),
    0xEC: new SPC_OP_INFO(0xEC, 'MOV', 'Y, !abs', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xED: new SPC_OP_INFO(0xED, 'NOTC', 'i', SPC_MN.NOTC, SPC_AM.I, 3),
    0xEE: new SPC_OP_INFO(0xEE, 'POP', 'Y', SPC_MN.POP, SPC_AM.STACK, 4),
    0xF0: new SPC_OP_INFO(0xF0, 'BEQ', 'r', SPC_MN.BEQ, SPC_AM.PC_R, 2),
    0xF1: new SPC_OP_INFO(0xF1, 'TCALL', '15', SPC_MN.TCALL, SPC_AM.I, 8),
    0xF2: new SPC_OP_INFO(0xF2, 'CLR1', 'dp.7', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0xF7: new SPC_OP_INFO(0xF7, 'MOV', 'A, [dp]+Y', SPC_MN.MOV, SPC_AM.MOV, 6),
    0xF8: new SPC_OP_INFO(0xF8, 'MOV', 'X, dp', SPC_MN.MOV, SPC_AM.MOV, 3),
    0xF9: new SPC_OP_INFO(0xF9, 'MOV', 'X, dp+Y', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xFA: new SPC_OP_INFO(0xFA, 'MOV', 'dp, dp', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xFD: new SPC_OP_INFO(0xFD, 'MOV', 'Y, A', SPC_MN.MOV, SPC_AM.MOV, 2),
    0xFE: new SPC_OP_INFO(0xFE, 'DBNZ', 'Y, r', SPC_MN.DBNZ, SPC_AM.RY_R, 4),
});

const BBCS1bit = Object.freeze({
	0x02: 0,
	0x03: 0,
    0x12: 0,
	0x13: 0,
	0x22: 1,
	0x23: 1,
	0x32: 1,
    0x33: 1,
	0x42: 2,
	0x43: 2,
	0x52: 2,
    0x53: 2,
	0x62: 3,
	0x63: 3,
	0x72: 3,
    0x73: 3,
	0x82: 4,
	0x83: 4,
	0x92: 4,
    0x93: 4,
	0xA2: 5,
	0xA3: 5,
	0xB2: 5,
    0xB3: 5,
	0xC2: 6,
	0xC3: 6,
	0xD2: 6,
    0xD3: 6,
	0xE2: 7,
	0xE3: 7,
	0xF2: 7,
    0xF3: 7
})

