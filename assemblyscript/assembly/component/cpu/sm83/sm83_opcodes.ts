export enum SM83_MN {
    NONE,
    ADC_di_da,
    ADC_di_di,
    ADC_di_ind,
    ADD_di_da,
    ADD_di_di,
    ADD16_di_di,
    ADD_di_ind,
    ADD_di_rel,
    AND_di_da,
    AND_di_di,
    AND_di_ind,
    BIT_idx_di,
    BIT_idx_ind,
    CALL_cond_addr,
    CCF,
    CP_di_da,
    CP_di_di,
    CP_di_ind,
    CPL,
    DAA,
    DEC_di,
    DEC16_di,
    DEC_ind,
    DI,
    EI,
    HALT,
    INC_di,
    INC16_di,
    INC_ind,
    JP_cond_addr,
    JP_di,
    JR_cond_rel,
    LD_addr_di,
    LD16_addr_di,
    LD_di_addr,
    LD_di_da,
    LD16_di_da,
    LD_di_di,
    LD16_di_di,
    LD_di_di_rel,
    LD_di_ind,
    LD_di_ind_dec,
    LD_di_ind_inc,
    LD_ind_da,
    LD_ind_di,
    LD_ind_dec_di,
    LD_ind_inc_di,
    LDH_addr_di,
    LDH_di_addr,
    LDH_di_ind,
    LDH_ind_di,
    NOP,
    OR_di_da,
    OR_di_di,
    OR_di_ind,
    POP_di,
    POP_di_AF,
    PUSH_di,
    RES_idx_di,
    RES_idx_ind,
    RET,
    RET_cond,
    RETI,
    RL_di,
    RL_ind,
    RLA,
    RLC_di,
    RLC_ind,
    RLCA,
    RR_di,
    RR_ind,
    RRA,
    RRC_di,
    RRC_ind,
    RRCA,
    RST_imp,
    SBC_di_da,
    SBC_di_di,
    SBC_di_ind,
    SCF,
    SET_idx_di,
    SET_idx_ind,
    SLA_di,
    SLA_ind,
    SRA_di,
    SRA_ind,
    SRL_di,
    SRL_ind,
    SUB_di_da,
    SUB_di_di,
    SUB_di_ind,
    SWAP_di,
    SWAP_ind,
    STOP,
    XOR_di_da,
    XOR_di_di,
    XOR_di_ind,
    RESET,
    S_IRQ
}

class SM83_opcode_info {
    opcode: u32
    ins: SM83_MN
    arg1: string|u32|null
    arg2: string|null

    constructor(opcode: u32, ins: SM83_MN, arg1: string|u32|null=null, arg2:string|null =null) {
        this.opcode = opcode;
        this.ins = ins;
        this.arg1 = arg1;
        this.arg2 = arg2;
    }
}

export const SM83_S_RESET = 0x101;
export const SM83_S_IRQ = 0x100;
export const SM83_HALT = 0x76;
export const SM83_S_DECODE = 0x102;
//const SM83_MAX_OPCODE = 0x101;

export var SM83_opcode_matrix: Map<u32, SM83_opcode_info> = new Map<u32, SM83_opcode_info>();
export var SM83_opcode_matrixCB: Map<u32, SM83_opcode_info> = new Map<u32, SM83_opcode_info>();

for (let i = 0; i < 0x102; i++) {
    SM83_opcode_matrix.set(i, SM83_get_matrix_item(i));
    if (i < 0x100)
        SM83_opcode_matrixCB.set(i, SM83_get_matrixCB_item(i));
}

function SM83_get_matrix_item(i: u32): SM83_opcode_info {
    switch(i) {
        case 0x00: return new SM83_opcode_info(0x00, SM83_MN.NOP);
        case 0x01: return new SM83_opcode_info(0x01, SM83_MN.LD16_di_da, 'BC');
        case 0x02: return new SM83_opcode_info(0x02, SM83_MN.LD_ind_di, 'BC', 'A');
        case 0x03: return new SM83_opcode_info(0x03, SM83_MN.INC16_di, 'BC');
        case 0x04: return new SM83_opcode_info(0x04, SM83_MN.INC_di, 'B');
        case 0x05: return new SM83_opcode_info(0x05, SM83_MN.DEC_di, 'B');
        case 0x06: return new SM83_opcode_info(0x06, SM83_MN.LD_di_da, 'B');
        case 0x07: return new SM83_opcode_info(0x07, SM83_MN.RLCA);
        case 0x08: return new SM83_opcode_info(0x08, SM83_MN.LD16_addr_di, 'SP');
        case 0x09: return new SM83_opcode_info(0x09, SM83_MN.ADD16_di_di, 'HL', 'BC');
        case 0x0A: return new SM83_opcode_info(0x0A, SM83_MN.LD_di_ind, 'A', 'BC');
        case 0x0B: return new SM83_opcode_info(0x0B, SM83_MN.DEC16_di, 'BC');
        case 0x0C: return new SM83_opcode_info(0x0C, SM83_MN.INC_di, 'C');
        case 0x0D: return new SM83_opcode_info(0x0D, SM83_MN.DEC_di, 'C');
        case 0x0E: return new SM83_opcode_info(0x0E, SM83_MN.LD_di_da, 'C');
        case 0x0F: return new SM83_opcode_info(0x0F, SM83_MN.RRCA);

        case 0x10: return new SM83_opcode_info(0x10, SM83_MN.STOP);
        case 0x11: return new SM83_opcode_info(0x11, SM83_MN.LD16_di_da, 'DE');
        case 0x12: return new SM83_opcode_info(0x12, SM83_MN.LD_ind_di, 'DE', 'A');
        case 0x13: return new SM83_opcode_info(0x13, SM83_MN.INC16_di, 'DE');
        case 0x14: return new SM83_opcode_info(0x14, SM83_MN.INC_di, 'D');
        case 0x15: return new SM83_opcode_info(0x15, SM83_MN.DEC_di, 'D');
        case 0x16: return new SM83_opcode_info(0x16, SM83_MN.LD_di_da, 'D');
        case 0x17: return new SM83_opcode_info(0x17, SM83_MN.RLA);
        case 0x18: return new SM83_opcode_info(0x18, SM83_MN.JR_cond_rel, '1');
        case 0x19: return new SM83_opcode_info(0x19, SM83_MN.ADD16_di_di, 'HL', 'DE');
        case 0x1A: return new SM83_opcode_info(0x1A, SM83_MN.LD_di_ind, 'A', 'DE');
        case 0x1B: return new SM83_opcode_info(0x1B, SM83_MN.DEC16_di, 'DE');
        case 0x1C: return new SM83_opcode_info(0x1C, SM83_MN.INC_di, 'E');
        case 0x1D: return new SM83_opcode_info(0x1D, SM83_MN.DEC_di, 'E');
        case 0x1E: return new SM83_opcode_info(0x1E, SM83_MN.LD_di_da, 'E');
        case 0x1F: return new SM83_opcode_info(0x1F, SM83_MN.RRA);

        case 0x20: return new SM83_opcode_info(0x20, SM83_MN.JR_cond_rel, 'regs.F.Z == 0');
        case 0x21: return new SM83_opcode_info(0x21, SM83_MN.LD16_di_da, 'HL');
        case 0x22: return new SM83_opcode_info(0x22, SM83_MN.LD_ind_inc_di, 'HL', 'A');
        case 0x23: return new SM83_opcode_info(0x23, SM83_MN.INC16_di, 'HL');
        case 0x24: return new SM83_opcode_info(0x24, SM83_MN.INC_di, 'H');
        case 0x25: return new SM83_opcode_info(0x25, SM83_MN.DEC_di, 'H');
        case 0x26: return new SM83_opcode_info(0x26, SM83_MN.LD_di_da, 'H');
        case 0x27: return new SM83_opcode_info(0x27, SM83_MN.DAA);
        case 0x28: return new SM83_opcode_info(0x28, SM83_MN.JR_cond_rel, 'regs.F.Z == 1');
        case 0x29: return new SM83_opcode_info(0x29, SM83_MN.ADD16_di_di, 'HL', 'HL');
        case 0x2A: return new SM83_opcode_info(0x2A, SM83_MN.LD_di_ind_inc, 'A', 'HL');
        case 0x2B: return new SM83_opcode_info(0x2B, SM83_MN.DEC16_di, 'HL');
        case 0x2C: return new SM83_opcode_info(0x2C, SM83_MN.INC_di, 'L');
        case 0x2D: return new SM83_opcode_info(0x2D, SM83_MN.DEC_di, 'L');
        case 0x2E: return new SM83_opcode_info(0x2E, SM83_MN.LD_di_da, 'L');
        case 0x2F: return new SM83_opcode_info(0x2F, SM83_MN.CPL);

        case 0x30: return new SM83_opcode_info(0x30, SM83_MN.JR_cond_rel, 'regs.F.C == 0');
        case 0x31: return new SM83_opcode_info(0x31, SM83_MN.LD16_di_da, 'SP');
        case 0x32: return new SM83_opcode_info(0x32, SM83_MN.LD_ind_dec_di, 'HL', 'A');
        case 0x33: return new SM83_opcode_info(0x33, SM83_MN.INC16_di, 'SP');
        case 0x34: return new SM83_opcode_info(0x34, SM83_MN.INC_ind, 'HL');
        case 0x35: return new SM83_opcode_info(0x35, SM83_MN.DEC_ind, 'HL');
        case 0x36: return new SM83_opcode_info(0x36, SM83_MN.LD_ind_da, 'HL');
        case 0x37: return new SM83_opcode_info(0x37, SM83_MN.SCF);
        case 0x38: return new SM83_opcode_info(0x38, SM83_MN.JR_cond_rel, 'regs.F.C == 1');
        case 0x39: return new SM83_opcode_info(0x39, SM83_MN.ADD16_di_di, 'HL', 'SP');
        case 0x3A: return new SM83_opcode_info(0x3A, SM83_MN.LD_di_ind_dec, 'A', 'HL');
        case 0x3B: return new SM83_opcode_info(0x3B, SM83_MN.DEC16_di, 'SP');
        case 0x3C: return new SM83_opcode_info(0x3C, SM83_MN.INC_di, 'A');
        case 0x3D: return new SM83_opcode_info(0x3D, SM83_MN.DEC_di, 'A');
        case 0x3E: return new SM83_opcode_info(0x3E, SM83_MN.LD_di_da, 'A');
        case 0x3F: return new SM83_opcode_info(0x3F, SM83_MN.CCF);

        case 0x40: return new SM83_opcode_info(0x40, SM83_MN.LD_di_di, 'B', 'B');
        case 0x41: return new SM83_opcode_info(0x41, SM83_MN.LD_di_di, 'B', 'C');
        case 0x42: return new SM83_opcode_info(0x42, SM83_MN.LD_di_di, 'B', 'D');
        case 0x43: return new SM83_opcode_info(0x43, SM83_MN.LD_di_di, 'B', 'E');
        case 0x44: return new SM83_opcode_info(0x44, SM83_MN.LD_di_di, 'B', 'H');
        case 0x45: return new SM83_opcode_info(0x45, SM83_MN.LD_di_di, 'B', 'L');
        case 0x46: return new SM83_opcode_info(0x46, SM83_MN.LD_di_ind, 'B', 'HL');
        case 0x47: return new SM83_opcode_info(0x47, SM83_MN.LD_di_di, 'B', 'A');
        case 0x48: return new SM83_opcode_info(0x48, SM83_MN.LD_di_di, 'C', 'B');
        case 0x49: return new SM83_opcode_info(0x49, SM83_MN.LD_di_di, 'C', 'C');
        case 0x4A: return new SM83_opcode_info(0x4A, SM83_MN.LD_di_di, 'C', 'D');
        case 0x4B: return new SM83_opcode_info(0x4B, SM83_MN.LD_di_di, 'C', 'E');
        case 0x4C: return new SM83_opcode_info(0x4C, SM83_MN.LD_di_di, 'C', 'H');
        case 0x4D: return new SM83_opcode_info(0x4D, SM83_MN.LD_di_di, 'C', 'L');
        case 0x4E: return new SM83_opcode_info(0x4E, SM83_MN.LD_di_ind, 'C', 'HL');
        case 0x4F: return new SM83_opcode_info(0x4F, SM83_MN.LD_di_di, 'C', 'A');

        case 0x50: return new SM83_opcode_info(0x50, SM83_MN.LD_di_di, 'D', 'B');
        case 0x51: return new SM83_opcode_info(0x51, SM83_MN.LD_di_di, 'D', 'C');
        case 0x52: return new SM83_opcode_info(0x52, SM83_MN.LD_di_di, 'D', 'D');
        case 0x53: return new SM83_opcode_info(0x53, SM83_MN.LD_di_di, 'D', 'E');
        case 0x54: return new SM83_opcode_info(0x54, SM83_MN.LD_di_di, 'D', 'H');
        case 0x55: return new SM83_opcode_info(0x55, SM83_MN.LD_di_di, 'D', 'L');
        case 0x56: return new SM83_opcode_info(0x56, SM83_MN.LD_di_ind, 'D', 'HL');
        case 0x57: return new SM83_opcode_info(0x57, SM83_MN.LD_di_di, 'D', 'A');
        case 0x58: return new SM83_opcode_info(0x58, SM83_MN.LD_di_di, 'E', 'B');
        case 0x59: return new SM83_opcode_info(0x59, SM83_MN.LD_di_di, 'E', 'C');
        case 0x5A: return new SM83_opcode_info(0x5A, SM83_MN.LD_di_di, 'E', 'D');
        case 0x5B: return new SM83_opcode_info(0x5B, SM83_MN.LD_di_di, 'E', 'E');
        case 0x5C: return new SM83_opcode_info(0x5C, SM83_MN.LD_di_di, 'E', 'H');
        case 0x5D: return new SM83_opcode_info(0x5D, SM83_MN.LD_di_di, 'E', 'L');
        case 0x5E: return new SM83_opcode_info(0x5E, SM83_MN.LD_di_ind, 'E', 'HL');
        case 0x5F: return new SM83_opcode_info(0x5F, SM83_MN.LD_di_di, 'E', 'A');

        case 0x60: return new SM83_opcode_info(0x60, SM83_MN.LD_di_di, 'H', 'B');
        case 0x61: return new SM83_opcode_info(0x61, SM83_MN.LD_di_di, 'H', 'C');
        case 0x62: return new SM83_opcode_info(0x62, SM83_MN.LD_di_di, 'H', 'D');
        case 0x63: return new SM83_opcode_info(0x63, SM83_MN.LD_di_di, 'H', 'E');
        case 0x64: return new SM83_opcode_info(0x64, SM83_MN.LD_di_di, 'H', 'H');
        case 0x65: return new SM83_opcode_info(0x65, SM83_MN.LD_di_di, 'H', 'L');
        case 0x66: return new SM83_opcode_info(0x66, SM83_MN.LD_di_ind, 'H', 'HL');
        case 0x67: return new SM83_opcode_info(0x67, SM83_MN.LD_di_di, 'H', 'A');
        case 0x68: return new SM83_opcode_info(0x68, SM83_MN.LD_di_di, 'L', 'B');
        case 0x69: return new SM83_opcode_info(0x69, SM83_MN.LD_di_di, 'L', 'C');
        case 0x6A: return new SM83_opcode_info(0x6A, SM83_MN.LD_di_di, 'L', 'D');
        case 0x6B: return new SM83_opcode_info(0x6B, SM83_MN.LD_di_di, 'L', 'E');
        case 0x6C: return new SM83_opcode_info(0x6C, SM83_MN.LD_di_di, 'L', 'H');
        case 0x6D: return new SM83_opcode_info(0x6D, SM83_MN.LD_di_di, 'L', 'L');
        case 0x6E: return new SM83_opcode_info(0x6E, SM83_MN.LD_di_ind, 'L', 'HL');
        case 0x6F: return new SM83_opcode_info(0x6F, SM83_MN.LD_di_di, 'L', 'A');

        case 0x70: return new SM83_opcode_info(0x70, SM83_MN.LD_ind_di, 'HL', 'B');
        case 0x71: return new SM83_opcode_info(0x71, SM83_MN.LD_ind_di, 'HL', 'C');
        case 0x72: return new SM83_opcode_info(0x72, SM83_MN.LD_ind_di, 'HL', 'D');
        case 0x73: return new SM83_opcode_info(0x73, SM83_MN.LD_ind_di, 'HL', 'E');
        case 0x74: return new SM83_opcode_info(0x74, SM83_MN.LD_ind_di, 'HL', 'H');
        case 0x75: return new SM83_opcode_info(0x75, SM83_MN.LD_ind_di, 'HL', 'L');
        case 0x76: return new SM83_opcode_info(0x76, SM83_MN.HALT);
        case 0x77: return new SM83_opcode_info(0x77, SM83_MN.LD_ind_di, 'HL', 'A');
        case 0x78: return new SM83_opcode_info(0x78, SM83_MN.LD_di_di, 'A', 'B');
        case 0x79: return new SM83_opcode_info(0x79, SM83_MN.LD_di_di, 'A', 'C');
        case 0x7A: return new SM83_opcode_info(0x7A, SM83_MN.LD_di_di, 'A', 'D');
        case 0x7B: return new SM83_opcode_info(0x7B, SM83_MN.LD_di_di, 'A', 'E');
        case 0x7C: return new SM83_opcode_info(0x7C, SM83_MN.LD_di_di, 'A', 'H');
        case 0x7D: return new SM83_opcode_info(0x7D, SM83_MN.LD_di_di, 'A', 'L');
        case 0x7E: return new SM83_opcode_info(0x7E, SM83_MN.LD_di_ind, 'A', 'HL');
        case 0x7F: return new SM83_opcode_info(0x7F, SM83_MN.LD_di_di, 'A', 'A');

        case 0x80: return new SM83_opcode_info(0x80, SM83_MN.ADD_di_di, 'A', 'B');
        case 0x81: return new SM83_opcode_info(0x81, SM83_MN.ADD_di_di, 'A', 'C');
        case 0x82: return new SM83_opcode_info(0x82, SM83_MN.ADD_di_di, 'A', 'D');
        case 0x83: return new SM83_opcode_info(0x83, SM83_MN.ADD_di_di, 'A', 'E');
        case 0x84: return new SM83_opcode_info(0x84, SM83_MN.ADD_di_di, 'A', 'H');
        case 0x85: return new SM83_opcode_info(0x85, SM83_MN.ADD_di_di, 'A', 'L');
        case 0x86: return new SM83_opcode_info(0x86, SM83_MN.ADD_di_ind, 'A', 'HL');
        case 0x87: return new SM83_opcode_info(0x87, SM83_MN.ADD_di_di, 'A', 'A');
        case 0x88: return new SM83_opcode_info(0x88, SM83_MN.ADC_di_di, 'A', 'B');
        case 0x89: return new SM83_opcode_info(0x89, SM83_MN.ADC_di_di, 'A', 'C');
        case 0x8A: return new SM83_opcode_info(0x8A, SM83_MN.ADC_di_di, 'A', 'D');
        case 0x8B: return new SM83_opcode_info(0x8B, SM83_MN.ADC_di_di, 'A', 'E');
        case 0x8C: return new SM83_opcode_info(0x8C, SM83_MN.ADC_di_di, 'A', 'H');
        case 0x8D: return new SM83_opcode_info(0x8D, SM83_MN.ADC_di_di, 'A', 'L');
        case 0x8E: return new SM83_opcode_info(0x8E, SM83_MN.ADC_di_ind, 'A', 'HL');
        case 0x8F: return new SM83_opcode_info(0x8F, SM83_MN.ADC_di_di, 'A', 'A');

        case 0x90: return new SM83_opcode_info(0x90, SM83_MN.SUB_di_di, 'A', 'B');
        case 0x91: return new SM83_opcode_info(0x91, SM83_MN.SUB_di_di, 'A', 'C');
        case 0x92: return new SM83_opcode_info(0x92, SM83_MN.SUB_di_di, 'A', 'D');
        case 0x93: return new SM83_opcode_info(0x93, SM83_MN.SUB_di_di, 'A', 'E');
        case 0x94: return new SM83_opcode_info(0x94, SM83_MN.SUB_di_di, 'A', 'H');
        case 0x95: return new SM83_opcode_info(0x95, SM83_MN.SUB_di_di, 'A', 'L');
        case 0x96: return new SM83_opcode_info(0x96, SM83_MN.SUB_di_ind, 'A', 'HL');
        case 0x97: return new SM83_opcode_info(0x97, SM83_MN.SUB_di_di, 'A', 'A');
        case 0x98: return new SM83_opcode_info(0x98, SM83_MN.SBC_di_di, 'A', 'B');
        case 0x99: return new SM83_opcode_info(0x99, SM83_MN.SBC_di_di, 'A', 'C');
        case 0x9A: return new SM83_opcode_info(0x9A, SM83_MN.SBC_di_di, 'A', 'D');
        case 0x9B: return new SM83_opcode_info(0x9B, SM83_MN.SBC_di_di, 'A', 'E');
        case 0x9C: return new SM83_opcode_info(0x9C, SM83_MN.SBC_di_di, 'A', 'H');
        case 0x9D: return new SM83_opcode_info(0x9D, SM83_MN.SBC_di_di, 'A', 'L');
        case 0x9E: return new SM83_opcode_info(0x9E, SM83_MN.SBC_di_ind, 'A', 'HL');
        case 0x9F: return new SM83_opcode_info(0x9F, SM83_MN.SBC_di_di, 'A', 'A');

        case 0xA0: return new SM83_opcode_info(0xA0, SM83_MN.AND_di_di, 'A', 'B');
        case 0xA1: return new SM83_opcode_info(0xA1, SM83_MN.AND_di_di, 'A', 'C');
        case 0xA2: return new SM83_opcode_info(0xA2, SM83_MN.AND_di_di, 'A', 'D');
        case 0xA3: return new SM83_opcode_info(0xA3, SM83_MN.AND_di_di, 'A', 'E');
        case 0xA4: return new SM83_opcode_info(0xA4, SM83_MN.AND_di_di, 'A', 'H');
        case 0xA5: return new SM83_opcode_info(0xA5, SM83_MN.AND_di_di, 'A', 'L');
        case 0xA6: return new SM83_opcode_info(0xA6, SM83_MN.AND_di_ind, 'A', 'HL');
        case 0xA7: return new SM83_opcode_info(0xA7, SM83_MN.AND_di_di, 'A', 'A');
        case 0xA8: return new SM83_opcode_info(0xA8, SM83_MN.XOR_di_di, 'A', 'B');
        case 0xA9: return new SM83_opcode_info(0xA9, SM83_MN.XOR_di_di, 'A', 'C');
        case 0xAA: return new SM83_opcode_info(0xAA, SM83_MN.XOR_di_di, 'A', 'D');
        case 0xAB: return new SM83_opcode_info(0xAB, SM83_MN.XOR_di_di, 'A', 'E');
        case 0xAC: return new SM83_opcode_info(0xAC, SM83_MN.XOR_di_di, 'A', 'H');
        case 0xAD: return new SM83_opcode_info(0xAD, SM83_MN.XOR_di_di, 'A', 'L');
        case 0xAE: return new SM83_opcode_info(0xAE, SM83_MN.XOR_di_ind, 'A', 'HL');
        case 0xAF: return new SM83_opcode_info(0xAF, SM83_MN.XOR_di_di, 'A', 'A');

        case 0xB0: return new SM83_opcode_info(0xB0, SM83_MN.OR_di_di, 'A', 'B');
        case 0xB1: return new SM83_opcode_info(0xB1, SM83_MN.OR_di_di, 'A', 'C');
        case 0xB2: return new SM83_opcode_info(0xB2, SM83_MN.OR_di_di, 'A', 'D');
        case 0xB3: return new SM83_opcode_info(0xB3, SM83_MN.OR_di_di, 'A', 'E');
        case 0xB4: return new SM83_opcode_info(0xB4, SM83_MN.OR_di_di, 'A', 'H');
        case 0xB5: return new SM83_opcode_info(0xB5, SM83_MN.OR_di_di, 'A', 'L');
        case 0xB6: return new SM83_opcode_info(0xB6, SM83_MN.OR_di_ind, 'A', 'HL');
        case 0xB7: return new SM83_opcode_info(0xB7, SM83_MN.OR_di_di, 'A', 'A');
        case 0xB8: return new SM83_opcode_info(0xB8, SM83_MN.CP_di_di, 'A', 'B');
        case 0xB9: return new SM83_opcode_info(0xB9, SM83_MN.CP_di_di, 'A', 'C');
        case 0xBA: return new SM83_opcode_info(0xBA, SM83_MN.CP_di_di, 'A', 'D');
        case 0xBB: return new SM83_opcode_info(0xBB, SM83_MN.CP_di_di, 'A', 'E');
        case 0xBC: return new SM83_opcode_info(0xBC, SM83_MN.CP_di_di, 'A', 'H');
        case 0xBD: return new SM83_opcode_info(0xBD, SM83_MN.CP_di_di, 'A', 'L');
        case 0xBE: return new SM83_opcode_info(0xBE, SM83_MN.CP_di_ind, 'A', 'HL');
        case 0xBF: return new SM83_opcode_info(0xBF, SM83_MN.CP_di_di, 'A', 'A');

        case 0xC0: return new SM83_opcode_info(0xC0, SM83_MN.RET_cond, 'regs.F.Z == 0');
        case 0xC1: return new SM83_opcode_info(0xC1, SM83_MN.POP_di, 'BC');
        case 0xC2: return new SM83_opcode_info(0xC2, SM83_MN.JP_cond_addr, 'regs.F.Z == 0');
        case 0xC3: return new SM83_opcode_info(0xC3, SM83_MN.JP_cond_addr, "1");
        case 0xC4: return new SM83_opcode_info(0xC4, SM83_MN.CALL_cond_addr, 'regs.F.Z == 0');
        case 0xC5: return new SM83_opcode_info(0xC5, SM83_MN.PUSH_di, 'BC');
        case 0xC6: return new SM83_opcode_info(0xC6, SM83_MN.ADD_di_da, 'A');
        case 0xC7: return new SM83_opcode_info(0xC7, SM83_MN.RST_imp, 0);
        case 0xC8: return new SM83_opcode_info(0xC8, SM83_MN.RET_cond, 'regs.F.Z == 1');
        case 0xC9: return new SM83_opcode_info(0xC9, SM83_MN.RET);
        case 0xCA: return new SM83_opcode_info(0xCA, SM83_MN.JP_cond_addr, 'regs.F.Z == 1');
        case 0xCB: return new SM83_opcode_info(0xCB, SM83_MN.NONE);
        case 0xCC: return new SM83_opcode_info(0xCC, SM83_MN.CALL_cond_addr, 'regs.F.Z == 1');
        case 0xCD: return new SM83_opcode_info(0xCD, SM83_MN.CALL_cond_addr, '1');
        case 0xCE: return new SM83_opcode_info(0xCE, SM83_MN.ADC_di_da, 'A');
        case 0xCF: return new SM83_opcode_info(0xCF, SM83_MN.RST_imp, 8);

        case 0xD0: return new SM83_opcode_info(0xD0, SM83_MN.RET_cond, 'regs.F.C == 0');
        case 0xD1: return new SM83_opcode_info(0xD1, SM83_MN.POP_di, 'DE');
        case 0xD2: return new SM83_opcode_info(0xD2, SM83_MN.JP_cond_addr, 'regs.F.C == 0');
        //0xD3: return new SM83_opcode_info(0xD3, SM83_MN.);
        case 0xD4: return new SM83_opcode_info(0xD4, SM83_MN.CALL_cond_addr, 'regs.F.C == 0');
        case 0xD5: return new SM83_opcode_info(0xD5, SM83_MN.PUSH_di, 'DE');
        case 0xD6: return new SM83_opcode_info(0xD6, SM83_MN.SUB_di_da, 'A');
        case 0xD7: return new SM83_opcode_info(0xD7, SM83_MN.RST_imp, 0x10);
        case 0xD8: return new SM83_opcode_info(0xD8, SM83_MN.RET_cond, 'regs.F.C == 1');
        case 0xD9: return new SM83_opcode_info(0xD9, SM83_MN.RETI);
        case 0xDA: return new SM83_opcode_info(0xDA, SM83_MN.JP_cond_addr, 'regs.F.C == 1');
        //0xDB: return new SM83_opcode_info(0xDB, SM83_MN.);
        case 0xDC: return new SM83_opcode_info(0xDC, SM83_MN.CALL_cond_addr, 'regs.F.C == 1');
        //0xDD: return new SM83_opcode_info(0xDD, SM83_MN.);
        case 0xDE: return new SM83_opcode_info(0xDE, SM83_MN.SBC_di_da, 'A');
        case 0xDF: return new SM83_opcode_info(0xDF, SM83_MN.RST_imp, 0x18);

        case 0xE0: return new SM83_opcode_info(0xE0, SM83_MN.LDH_addr_di, 'A');
        case 0xE1: return new SM83_opcode_info(0xE1, SM83_MN.POP_di, 'HL');
        case 0xE2: return new SM83_opcode_info(0xE2, SM83_MN.LDH_ind_di, 'C', 'A');
        //0xE3: return new SM83_opcode_info(0xE3, SM83_MN.);
        //0xE4: return new SM83_opcode_info(0xE4, SM83_MN.);
        case 0xE5: return new SM83_opcode_info(0xE5, SM83_MN.PUSH_di, 'HL');
        case 0xE6: return new SM83_opcode_info(0xE6, SM83_MN.AND_di_da, 'A');
        case 0xE7: return new SM83_opcode_info(0xE7, SM83_MN.RST_imp, 0x20);
        case 0xE8: return new SM83_opcode_info(0xE8, SM83_MN.ADD_di_rel, 'SP');
        case 0xE9: return new SM83_opcode_info(0xE9, SM83_MN.JP_di, 'HL');
        case 0xEA: return new SM83_opcode_info(0xEA, SM83_MN.LD_addr_di, 'A');
        //0xEB: return new SM83_opcode_info(0xEB, SM83_MN.);
        //0xEC: return new SM83_opcode_info(0xEC, SM83_MN.);
        //0xED: return new SM83_opcode_info(0xED, SM83_MN.);
        case 0xEE: return new SM83_opcode_info(0xEE, SM83_MN.XOR_di_da, 'A');
        case 0xEF: return new SM83_opcode_info(0xEF, SM83_MN.RST_imp, 0x28);

        case 0xF0: return new SM83_opcode_info(0xF0, SM83_MN.LDH_di_addr, 'A');
        case 0xF1: return new SM83_opcode_info(0xF1, SM83_MN.POP_di_AF, 'AF');
        case 0xF2: return new SM83_opcode_info(0xF2, SM83_MN.LDH_di_ind, 'A', 'C');
        case 0xF3: return new SM83_opcode_info(0xF3, SM83_MN.DI);
        //0xF4: return new SM83_opcode_info(0xF4, SM83_MN.);
        case 0xF5: return new SM83_opcode_info(0xF5, SM83_MN.PUSH_di, 'AF');
        case 0xF6: return new SM83_opcode_info(0xF6, SM83_MN.OR_di_da, 'A');
        case 0xF7: return new SM83_opcode_info(0xF7, SM83_MN.RST_imp, 0x30);
        case 0xF8: return new SM83_opcode_info(0xF8, SM83_MN.LD_di_di_rel, 'HL', 'SP');
        case 0xF9: return new SM83_opcode_info(0xF9, SM83_MN.LD16_di_di, 'SP', 'HL');
        case 0xFA: return new SM83_opcode_info(0xFA, SM83_MN.LD_di_addr, 'A');
        case 0xFB: return new SM83_opcode_info(0xFB, SM83_MN.EI);
        //0xFC: return new SM83_opcode_info(0xFC, SM83_MN.);
        //0xFD: return new SM83_opcode_info(0xFD, SM83_MN.);
        case 0xFE: return new SM83_opcode_info(0xFE, SM83_MN.CP_di_da, 'A');
        case 0xFF: return new SM83_opcode_info(0xFF, SM83_MN.RST_imp, 0x38);
        case SM83_S_RESET: return new SM83_opcode_info(SM83_S_RESET, SM83_MN.RESET);
        case SM83_S_IRQ: return new SM83_opcode_info(SM83_S_IRQ, SM83_MN.S_IRQ)
    }
    return new SM83_opcode_info(i, SM83_MN.NONE);
}


function SM83_get_matrixCB_item(i: u32): SM83_opcode_info {
    switch(i) {
        case 0x00: return new SM83_opcode_info(0x00, SM83_MN.RLC_di, 'B');
        case 0x01: return new SM83_opcode_info(0x01, SM83_MN.RLC_di, 'C');
        case 0x02: return new SM83_opcode_info(0x02, SM83_MN.RLC_di, 'D');
        case 0x03: return new SM83_opcode_info(0x03, SM83_MN.RLC_di, 'E');
        case 0x04: return new SM83_opcode_info(0x04, SM83_MN.RLC_di, 'H');
        case 0x05: return new SM83_opcode_info(0x05, SM83_MN.RLC_di, 'L');
        case 0x06: return new SM83_opcode_info(0x06, SM83_MN.RLC_ind, 'HL');
        case 0x07: return new SM83_opcode_info(0x07, SM83_MN.RLC_di, 'A');
        case 0x08: return new SM83_opcode_info(0x08, SM83_MN.RRC_di, 'B');
        case 0x09: return new SM83_opcode_info(0x09, SM83_MN.RRC_di, 'C');
        case 0x0A: return new SM83_opcode_info(0x0A, SM83_MN.RRC_di, 'D');
        case 0x0B: return new SM83_opcode_info(0x0B, SM83_MN.RRC_di, 'E');
        case 0x0C: return new SM83_opcode_info(0x0C, SM83_MN.RRC_di, 'H');
        case 0x0D: return new SM83_opcode_info(0x0D, SM83_MN.RRC_di, 'L');
        case 0x0E: return new SM83_opcode_info(0x0E, SM83_MN.RRC_ind, 'HL');
        case 0x0F: return new SM83_opcode_info(0x0F, SM83_MN.RRC_di, 'A');

        case 0x10: return new SM83_opcode_info(0x10, SM83_MN.RL_di, 'B');
        case 0x11: return new SM83_opcode_info(0x11, SM83_MN.RL_di, 'C');
        case 0x12: return new SM83_opcode_info(0x12, SM83_MN.RL_di, 'D');
        case 0x13: return new SM83_opcode_info(0x13, SM83_MN.RL_di, 'E');
        case 0x14: return new SM83_opcode_info(0x14, SM83_MN.RL_di, 'H');
        case 0x15: return new SM83_opcode_info(0x15, SM83_MN.RL_di, 'L');
        case 0x16: return new SM83_opcode_info(0x16, SM83_MN.RL_ind, 'HL');
        case 0x17: return new SM83_opcode_info(0x17, SM83_MN.RL_di, 'A');
        case 0x18: return new SM83_opcode_info(0x18, SM83_MN.RR_di, 'B');
        case 0x19: return new SM83_opcode_info(0x19, SM83_MN.RR_di, 'C');
        case 0x1A: return new SM83_opcode_info(0x1A, SM83_MN.RR_di, 'D');
        case 0x1B: return new SM83_opcode_info(0x1B, SM83_MN.RR_di, 'E');
        case 0x1C: return new SM83_opcode_info(0x1C, SM83_MN.RR_di, 'H');
        case 0x1D: return new SM83_opcode_info(0x1D, SM83_MN.RR_di, 'L');
        case 0x1E: return new SM83_opcode_info(0x1E, SM83_MN.RR_ind, 'HL');
        case 0x1F: return new SM83_opcode_info(0x1F, SM83_MN.RR_di, 'A');

        case 0x20: return new SM83_opcode_info(0x20, SM83_MN.SLA_di, 'B');
        case 0x21: return new SM83_opcode_info(0x21, SM83_MN.SLA_di, 'C');
        case 0x22: return new SM83_opcode_info(0x22, SM83_MN.SLA_di, 'D');
        case 0x23: return new SM83_opcode_info(0x23, SM83_MN.SLA_di, 'E');
        case 0x24: return new SM83_opcode_info(0x24, SM83_MN.SLA_di, 'H');
        case 0x25: return new SM83_opcode_info(0x25, SM83_MN.SLA_di, 'L');
        case 0x26: return new SM83_opcode_info(0x26, SM83_MN.SLA_ind, 'HL');
        case 0x27: return new SM83_opcode_info(0x27, SM83_MN.SLA_di, 'A');
        case 0x28: return new SM83_opcode_info(0x28, SM83_MN.SRA_di, 'B');
        case 0x29: return new SM83_opcode_info(0x29, SM83_MN.SRA_di, 'C');
        case 0x2A: return new SM83_opcode_info(0x2A, SM83_MN.SRA_di, 'D');
        case 0x2B: return new SM83_opcode_info(0x2B, SM83_MN.SRA_di, 'E');
        case 0x2C: return new SM83_opcode_info(0x2C, SM83_MN.SRA_di, 'H');
        case 0x2D: return new SM83_opcode_info(0x2D, SM83_MN.SRA_di, 'L');
        case 0x2E: return new SM83_opcode_info(0x2E, SM83_MN.SRA_ind, 'HL');
        case 0x2F: return new SM83_opcode_info(0x2F, SM83_MN.SRA_di, 'A');

        case 0x30: return new SM83_opcode_info(0x30, SM83_MN.SWAP_di, 'B');
        case 0x31: return new SM83_opcode_info(0x31, SM83_MN.SWAP_di, 'C');
        case 0x32: return new SM83_opcode_info(0x32, SM83_MN.SWAP_di, 'D');
        case 0x33: return new SM83_opcode_info(0x33, SM83_MN.SWAP_di, 'E');
        case 0x34: return new SM83_opcode_info(0x34, SM83_MN.SWAP_di, 'H');
        case 0x35: return new SM83_opcode_info(0x35, SM83_MN.SWAP_di, 'L');
        case 0x36: return new SM83_opcode_info(0x36, SM83_MN.SWAP_ind, 'HL');
        case 0x37: return new SM83_opcode_info(0x37, SM83_MN.SWAP_di, 'A');
        case 0x38: return new SM83_opcode_info(0x38, SM83_MN.SRL_di, 'B');
        case 0x39: return new SM83_opcode_info(0x39, SM83_MN.SRL_di, 'C');
        case 0x3A: return new SM83_opcode_info(0x3A, SM83_MN.SRL_di, 'D');
        case 0x3B: return new SM83_opcode_info(0x3B, SM83_MN.SRL_di, 'E');
        case 0x3C: return new SM83_opcode_info(0x3C, SM83_MN.SRL_di, 'H');
        case 0x3D: return new SM83_opcode_info(0x3D, SM83_MN.SRL_di, 'L');
        case 0x3E: return new SM83_opcode_info(0x3E, SM83_MN.SRL_ind, 'HL');
        case 0x3F: return new SM83_opcode_info(0x3F, SM83_MN.SRL_di, 'A');

        case 0x40: return new SM83_opcode_info(0x40, SM83_MN.BIT_idx_di, 0, 'B');
        case 0x41: return new SM83_opcode_info(0x41, SM83_MN.BIT_idx_di, 0, 'C');
        case 0x42: return new SM83_opcode_info(0x42, SM83_MN.BIT_idx_di, 0, 'D');
        case 0x43: return new SM83_opcode_info(0x43, SM83_MN.BIT_idx_di, 0, 'E');
        case 0x44: return new SM83_opcode_info(0x44, SM83_MN.BIT_idx_di, 0, 'H');
        case 0x45: return new SM83_opcode_info(0x45, SM83_MN.BIT_idx_di, 0, 'L');
        case 0x46: return new SM83_opcode_info(0x46, SM83_MN.BIT_idx_ind, 0, 'HL');
        case 0x47: return new SM83_opcode_info(0x47, SM83_MN.BIT_idx_di, 0, 'A');
        case 0x48: return new SM83_opcode_info(0x48, SM83_MN.BIT_idx_di, 1, 'B');
        case 0x49: return new SM83_opcode_info(0x49, SM83_MN.BIT_idx_di, 1, 'C');
        case 0x4A: return new SM83_opcode_info(0x4A, SM83_MN.BIT_idx_di, 1, 'D');
        case 0x4B: return new SM83_opcode_info(0x4B, SM83_MN.BIT_idx_di, 1, 'E');
        case 0x4C: return new SM83_opcode_info(0x4C, SM83_MN.BIT_idx_di, 1, 'H');
        case 0x4D: return new SM83_opcode_info(0x4D, SM83_MN.BIT_idx_di, 1, 'L');
        case 0x4E: return new SM83_opcode_info(0x4E, SM83_MN.BIT_idx_ind, 1, 'HL');
        case 0x4F: return new SM83_opcode_info(0x4F, SM83_MN.BIT_idx_di, 1, 'A');

        case 0x50: return new SM83_opcode_info(0x50, SM83_MN.BIT_idx_di, 2, 'B');
        case 0x51: return new SM83_opcode_info(0x51, SM83_MN.BIT_idx_di, 2, 'C');
        case 0x52: return new SM83_opcode_info(0x52, SM83_MN.BIT_idx_di, 2, 'D');
        case 0x53: return new SM83_opcode_info(0x53, SM83_MN.BIT_idx_di, 2, 'E');
        case 0x54: return new SM83_opcode_info(0x54, SM83_MN.BIT_idx_di, 2, 'H');
        case 0x55: return new SM83_opcode_info(0x55, SM83_MN.BIT_idx_di, 2, 'L');
        case 0x56: return new SM83_opcode_info(0x56, SM83_MN.BIT_idx_ind, 2, 'HL');
        case 0x57: return new SM83_opcode_info(0x57, SM83_MN.BIT_idx_di, 2, 'A');
        case 0x58: return new SM83_opcode_info(0x58, SM83_MN.BIT_idx_di, 3, 'B');
        case 0x59: return new SM83_opcode_info(0x59, SM83_MN.BIT_idx_di, 3, 'C');
        case 0x5A: return new SM83_opcode_info(0x5A, SM83_MN.BIT_idx_di, 3, 'D');
        case 0x5B: return new SM83_opcode_info(0x5B, SM83_MN.BIT_idx_di, 3, 'E');
        case 0x5C: return new SM83_opcode_info(0x5C, SM83_MN.BIT_idx_di, 3, 'H');
        case 0x5D: return new SM83_opcode_info(0x5D, SM83_MN.BIT_idx_di, 3, 'L');
        case 0x5E: return new SM83_opcode_info(0x5E, SM83_MN.BIT_idx_ind, 3, 'HL');
        case 0x5F: return new SM83_opcode_info(0x5F, SM83_MN.BIT_idx_di, 3, 'A');

        case 0x60: return new SM83_opcode_info(0x60, SM83_MN.BIT_idx_di, 4, 'B');
        case 0x61: return new SM83_opcode_info(0x61, SM83_MN.BIT_idx_di, 4, 'C');
        case 0x62: return new SM83_opcode_info(0x62, SM83_MN.BIT_idx_di, 4, 'D');
        case 0x63: return new SM83_opcode_info(0x63, SM83_MN.BIT_idx_di, 4, 'E');
        case 0x64: return new SM83_opcode_info(0x64, SM83_MN.BIT_idx_di, 4, 'H');
        case 0x65: return new SM83_opcode_info(0x65, SM83_MN.BIT_idx_di, 4, 'L');
        case 0x66: return new SM83_opcode_info(0x66, SM83_MN.BIT_idx_ind, 4, 'HL');
        case 0x67: return new SM83_opcode_info(0x67, SM83_MN.BIT_idx_di, 4, 'A');
        case 0x68: return new SM83_opcode_info(0x68, SM83_MN.BIT_idx_di, 5, 'B');
        case 0x69: return new SM83_opcode_info(0x69, SM83_MN.BIT_idx_di, 5, 'C');
        case 0x6A: return new SM83_opcode_info(0x6A, SM83_MN.BIT_idx_di, 5, 'D');
        case 0x6B: return new SM83_opcode_info(0x6B, SM83_MN.BIT_idx_di, 5, 'E');
        case 0x6C: return new SM83_opcode_info(0x6C, SM83_MN.BIT_idx_di, 5, 'H');
        case 0x6D: return new SM83_opcode_info(0x6D, SM83_MN.BIT_idx_di, 5, 'L');
        case 0x6E: return new SM83_opcode_info(0x6E, SM83_MN.BIT_idx_ind, 5, 'HL');
        case 0x6F: return new SM83_opcode_info(0x6F, SM83_MN.BIT_idx_di, 5, 'A');

        case 0x70: return new SM83_opcode_info(0x70, SM83_MN.BIT_idx_di, 6, 'B');
        case 0x71: return new SM83_opcode_info(0x71, SM83_MN.BIT_idx_di, 6, 'C');
        case 0x72: return new SM83_opcode_info(0x72, SM83_MN.BIT_idx_di, 6, 'D');
        case 0x73: return new SM83_opcode_info(0x73, SM83_MN.BIT_idx_di, 6, 'E');
        case 0x74: return new SM83_opcode_info(0x74, SM83_MN.BIT_idx_di, 6, 'H');
        case 0x75: return new SM83_opcode_info(0x75, SM83_MN.BIT_idx_di, 6, 'L');
        case 0x76: return new SM83_opcode_info(0x76, SM83_MN.BIT_idx_ind, 6, 'HL');
        case 0x77: return new SM83_opcode_info(0x77, SM83_MN.BIT_idx_di, 6, 'A');
        case 0x78: return new SM83_opcode_info(0x78, SM83_MN.BIT_idx_di, 7, 'B');
        case 0x79: return new SM83_opcode_info(0x79, SM83_MN.BIT_idx_di, 7, 'C');
        case 0x7A: return new SM83_opcode_info(0x7A, SM83_MN.BIT_idx_di, 7, 'D');
        case 0x7B: return new SM83_opcode_info(0x7B, SM83_MN.BIT_idx_di, 7, 'E');
        case 0x7C: return new SM83_opcode_info(0x7C, SM83_MN.BIT_idx_di, 7, 'H');
        case 0x7D: return new SM83_opcode_info(0x7D, SM83_MN.BIT_idx_di, 7, 'L');
        case 0x7E: return new SM83_opcode_info(0x7E, SM83_MN.BIT_idx_ind, 7, 'HL');
        case 0x7F: return new SM83_opcode_info(0x7F, SM83_MN.BIT_idx_di, 7, 'A');

        case 0x80: return new SM83_opcode_info(0x80, SM83_MN.RES_idx_di, 0, 'B');
        case 0x81: return new SM83_opcode_info(0x81, SM83_MN.RES_idx_di, 0, 'C');
        case 0x82: return new SM83_opcode_info(0x82, SM83_MN.RES_idx_di, 0, 'D');
        case 0x83: return new SM83_opcode_info(0x83, SM83_MN.RES_idx_di, 0, 'E');
        case 0x84: return new SM83_opcode_info(0x84, SM83_MN.RES_idx_di, 0, 'H');
        case 0x85: return new SM83_opcode_info(0x85, SM83_MN.RES_idx_di, 0, 'L');
        case 0x86: return new SM83_opcode_info(0x86, SM83_MN.RES_idx_ind, 0, 'HL');
        case 0x87: return new SM83_opcode_info(0x87, SM83_MN.RES_idx_di, 0, 'A');
        case 0x88: return new SM83_opcode_info(0x88, SM83_MN.RES_idx_di, 1, 'B');
        case 0x89: return new SM83_opcode_info(0x89, SM83_MN.RES_idx_di, 1, 'C');
        case 0x8A: return new SM83_opcode_info(0x8A, SM83_MN.RES_idx_di, 1, 'D');
        case 0x8B: return new SM83_opcode_info(0x8B, SM83_MN.RES_idx_di, 1, 'E');
        case 0x8C: return new SM83_opcode_info(0x8C, SM83_MN.RES_idx_di, 1, 'H');
        case 0x8D: return new SM83_opcode_info(0x8D, SM83_MN.RES_idx_di, 1, 'L');
        case 0x8E: return new SM83_opcode_info(0x8E, SM83_MN.RES_idx_ind, 1, 'HL');
        case 0x8F: return new SM83_opcode_info(0x8F, SM83_MN.RES_idx_di, 1, 'A');

        case 0x90: return new SM83_opcode_info(0x90, SM83_MN.RES_idx_di, 2, 'B');
        case 0x91: return new SM83_opcode_info(0x91, SM83_MN.RES_idx_di, 2, 'C');
        case 0x92: return new SM83_opcode_info(0x92, SM83_MN.RES_idx_di, 2, 'D');
        case 0x93: return new SM83_opcode_info(0x93, SM83_MN.RES_idx_di, 2, 'E');
        case 0x94: return new SM83_opcode_info(0x94, SM83_MN.RES_idx_di, 2, 'H');
        case 0x95: return new SM83_opcode_info(0x95, SM83_MN.RES_idx_di, 2, 'L');
        case 0x96: return new SM83_opcode_info(0x96, SM83_MN.RES_idx_ind, 2, 'HL');
        case 0x97: return new SM83_opcode_info(0x97, SM83_MN.RES_idx_di, 2, 'A');
        case 0x98: return new SM83_opcode_info(0x98, SM83_MN.RES_idx_di, 3, 'B');
        case 0x99: return new SM83_opcode_info(0x99, SM83_MN.RES_idx_di, 3, 'C');
        case 0x9A: return new SM83_opcode_info(0x9A, SM83_MN.RES_idx_di, 3, 'D');
        case 0x9B: return new SM83_opcode_info(0x9B, SM83_MN.RES_idx_di, 3, 'E');
        case 0x9C: return new SM83_opcode_info(0x9C, SM83_MN.RES_idx_di, 3, 'H');
        case 0x9D: return new SM83_opcode_info(0x9D, SM83_MN.RES_idx_di, 3, 'L');
        case 0x9E: return new SM83_opcode_info(0x9E, SM83_MN.RES_idx_ind, 3, 'HL');
        case 0x9F: return new SM83_opcode_info(0x9F, SM83_MN.RES_idx_di, 3, 'A');

        case 0xA0: return new SM83_opcode_info(0xA0, SM83_MN.RES_idx_di, 4, 'B');
        case 0xA1: return new SM83_opcode_info(0xA1, SM83_MN.RES_idx_di, 4, 'C');
        case 0xA2: return new SM83_opcode_info(0xA2, SM83_MN.RES_idx_di, 4, 'D');
        case 0xA3: return new SM83_opcode_info(0xA3, SM83_MN.RES_idx_di, 4, 'E');
        case 0xA4: return new SM83_opcode_info(0xA4, SM83_MN.RES_idx_di, 4, 'H');
        case 0xA5: return new SM83_opcode_info(0xA5, SM83_MN.RES_idx_di, 4, 'L');
        case 0xA6: return new SM83_opcode_info(0xA6, SM83_MN.RES_idx_ind, 4, 'HL');
        case 0xA7: return new SM83_opcode_info(0xA7, SM83_MN.RES_idx_di, 4, 'A');
        case 0xA8: return new SM83_opcode_info(0xA8, SM83_MN.RES_idx_di, 5, 'B');
        case 0xA9: return new SM83_opcode_info(0xA9, SM83_MN.RES_idx_di, 5, 'C');
        case 0xAA: return new SM83_opcode_info(0xAA, SM83_MN.RES_idx_di, 5, 'D');
        case 0xAB: return new SM83_opcode_info(0xAB, SM83_MN.RES_idx_di, 5, 'E');
        case 0xAC: return new SM83_opcode_info(0xAC, SM83_MN.RES_idx_di, 5, 'H');
        case 0xAD: return new SM83_opcode_info(0xAD, SM83_MN.RES_idx_di, 5, 'L');
        case 0xAE: return new SM83_opcode_info(0xAE, SM83_MN.RES_idx_ind, 5, 'HL');
        case 0xAF: return new SM83_opcode_info(0xAF, SM83_MN.RES_idx_di, 5, 'A');

        case 0xB0: return new SM83_opcode_info(0xB0, SM83_MN.RES_idx_di, 6, 'B');
        case 0xB1: return new SM83_opcode_info(0xB1, SM83_MN.RES_idx_di, 6, 'C');
        case 0xB2: return new SM83_opcode_info(0xB2, SM83_MN.RES_idx_di, 6, 'D');
        case 0xB3: return new SM83_opcode_info(0xB3, SM83_MN.RES_idx_di, 6, 'E');
        case 0xB4: return new SM83_opcode_info(0xB4, SM83_MN.RES_idx_di, 6, 'H');
        case 0xB5: return new SM83_opcode_info(0xB5, SM83_MN.RES_idx_di, 6, 'L');
        case 0xB6: return new SM83_opcode_info(0xB6, SM83_MN.RES_idx_ind, 6, 'HL');
        case 0xB7: return new SM83_opcode_info(0xB7, SM83_MN.RES_idx_di, 6, 'A');
        case 0xB8: return new SM83_opcode_info(0xB8, SM83_MN.RES_idx_di, 7, 'B');
        case 0xB9: return new SM83_opcode_info(0xB9, SM83_MN.RES_idx_di, 7, 'C');
        case 0xBA: return new SM83_opcode_info(0xBA, SM83_MN.RES_idx_di, 7, 'D');
        case 0xBB: return new SM83_opcode_info(0xBB, SM83_MN.RES_idx_di, 7, 'E');
        case 0xBC: return new SM83_opcode_info(0xBC, SM83_MN.RES_idx_di, 7, 'H');
        case 0xBD: return new SM83_opcode_info(0xBD, SM83_MN.RES_idx_di, 7, 'L');
        case 0xBE: return new SM83_opcode_info(0xBE, SM83_MN.RES_idx_ind, 7, 'HL');
        case 0xBF: return new SM83_opcode_info(0xBF, SM83_MN.RES_idx_di, 7, 'A');

        case 0xC0: return new SM83_opcode_info(0xC0, SM83_MN.SET_idx_di, 0, 'B');
        case 0xC1: return new SM83_opcode_info(0xC1, SM83_MN.SET_idx_di, 0, 'C');
        case 0xC2: return new SM83_opcode_info(0xC2, SM83_MN.SET_idx_di, 0, 'D');
        case 0xC3: return new SM83_opcode_info(0xC3, SM83_MN.SET_idx_di, 0, 'E');
        case 0xC4: return new SM83_opcode_info(0xC4, SM83_MN.SET_idx_di, 0, 'H');
        case 0xC5: return new SM83_opcode_info(0xC5, SM83_MN.SET_idx_di, 0, 'L');
        case 0xC6: return new SM83_opcode_info(0xC6, SM83_MN.SET_idx_ind, 0, 'HL');
        case 0xC7: return new SM83_opcode_info(0xC7, SM83_MN.SET_idx_di, 0, 'A');
        case 0xC8: return new SM83_opcode_info(0xC8, SM83_MN.SET_idx_di, 1, 'B');
        case 0xC9: return new SM83_opcode_info(0xC9, SM83_MN.SET_idx_di, 1, 'C');
        case 0xCA: return new SM83_opcode_info(0xCA, SM83_MN.SET_idx_di, 1, 'D');
        case 0xCB: return new SM83_opcode_info(0xCB, SM83_MN.SET_idx_di, 1, 'E');
        case 0xCC: return new SM83_opcode_info(0xCC, SM83_MN.SET_idx_di, 1, 'H');
        case 0xCD: return new SM83_opcode_info(0xCD, SM83_MN.SET_idx_di, 1, 'L');
        case 0xCE: return new SM83_opcode_info(0xCE, SM83_MN.SET_idx_ind, 1, 'HL');
        case 0xCF: return new SM83_opcode_info(0xCF, SM83_MN.SET_idx_di, 1, 'A');

        case 0xD0: return new SM83_opcode_info(0xD0, SM83_MN.SET_idx_di, 2, 'B');
        case 0xD1: return new SM83_opcode_info(0xD1, SM83_MN.SET_idx_di, 2, 'C');
        case 0xD2: return new SM83_opcode_info(0xD2, SM83_MN.SET_idx_di, 2, 'D');
        case 0xD3: return new SM83_opcode_info(0xD3, SM83_MN.SET_idx_di, 2, 'E');
        case 0xD4: return new SM83_opcode_info(0xD4, SM83_MN.SET_idx_di, 2, 'H');
        case 0xD5: return new SM83_opcode_info(0xD5, SM83_MN.SET_idx_di, 2, 'L');
        case 0xD6: return new SM83_opcode_info(0xD6, SM83_MN.SET_idx_ind, 2, 'HL');
        case 0xD7: return new SM83_opcode_info(0xD7, SM83_MN.SET_idx_di, 2, 'A');
        case 0xD8: return new SM83_opcode_info(0xD8, SM83_MN.SET_idx_di, 3, 'B');
        case 0xD9: return new SM83_opcode_info(0xD9, SM83_MN.SET_idx_di, 3, 'C');
        case 0xDA: return new SM83_opcode_info(0xDA, SM83_MN.SET_idx_di, 3, 'D');
        case 0xDB: return new SM83_opcode_info(0xDB, SM83_MN.SET_idx_di, 3, 'E');
        case 0xDC: return new SM83_opcode_info(0xDC, SM83_MN.SET_idx_di, 3, 'H');
        case 0xDD: return new SM83_opcode_info(0xDD, SM83_MN.SET_idx_di, 3, 'L');
        case 0xDE: return new SM83_opcode_info(0xDE, SM83_MN.SET_idx_ind, 3, 'HL');
        case 0xDF: return new SM83_opcode_info(0xDF, SM83_MN.SET_idx_di, 3, 'A');

        case 0xE0: return new SM83_opcode_info(0xE0, SM83_MN.SET_idx_di, 4, 'B');
        case 0xE1: return new SM83_opcode_info(0xE1, SM83_MN.SET_idx_di, 4, 'C');
        case 0xE2: return new SM83_opcode_info(0xE2, SM83_MN.SET_idx_di, 4, 'D');
        case 0xE3: return new SM83_opcode_info(0xE3, SM83_MN.SET_idx_di, 4, 'E');
        case 0xE4: return new SM83_opcode_info(0xE4, SM83_MN.SET_idx_di, 4, 'H');
        case 0xE5: return new SM83_opcode_info(0xE5, SM83_MN.SET_idx_di, 4, 'L');
        case 0xE6: return new SM83_opcode_info(0xE6, SM83_MN.SET_idx_ind, 4, 'HL');
        case 0xE7: return new SM83_opcode_info(0xE7, SM83_MN.SET_idx_di, 4, 'A');
        case 0xE8: return new SM83_opcode_info(0xE8, SM83_MN.SET_idx_di, 5, 'B');
        case 0xE9: return new SM83_opcode_info(0xE9, SM83_MN.SET_idx_di, 5, 'C');
        case 0xEA: return new SM83_opcode_info(0xEA, SM83_MN.SET_idx_di, 5, 'D');
        case 0xEB: return new SM83_opcode_info(0xEB, SM83_MN.SET_idx_di, 5, 'E');
        case 0xEC: return new SM83_opcode_info(0xEC, SM83_MN.SET_idx_di, 5, 'H');
        case 0xED: return new SM83_opcode_info(0xED, SM83_MN.SET_idx_di, 5, 'L');
        case 0xEE: return new SM83_opcode_info(0xEE, SM83_MN.SET_idx_ind, 5, 'HL');
        case 0xEF: return new SM83_opcode_info(0xEF, SM83_MN.SET_idx_di, 5, 'A');

        case 0xF0: return new SM83_opcode_info(0xF0, SM83_MN.SET_idx_di, 6, 'B');
        case 0xF1: return new SM83_opcode_info(0xF1, SM83_MN.SET_idx_di, 6, 'C');
        case 0xF2: return new SM83_opcode_info(0xF2, SM83_MN.SET_idx_di, 6, 'D');
        case 0xF3: return new SM83_opcode_info(0xF3, SM83_MN.SET_idx_di, 6, 'E');
        case 0xF4: return new SM83_opcode_info(0xF4, SM83_MN.SET_idx_di, 6, 'H');
        case 0xF5: return new SM83_opcode_info(0xF5, SM83_MN.SET_idx_di, 6, 'L');
        case 0xF6: return new SM83_opcode_info(0xF6, SM83_MN.SET_idx_ind, 6, 'HL');
        case 0xF7: return new SM83_opcode_info(0xF7, SM83_MN.SET_idx_di, 6, 'A');
        case 0xF8: return new SM83_opcode_info(0xF8, SM83_MN.SET_idx_di, 7, 'B');
        case 0xF9: return new SM83_opcode_info(0xF9, SM83_MN.SET_idx_di, 7, 'C');
        case 0xFA: return new SM83_opcode_info(0xFA, SM83_MN.SET_idx_di, 7, 'D');
        case 0xFB: return new SM83_opcode_info(0xFB, SM83_MN.SET_idx_di, 7, 'E');
        case 0xFC: return new SM83_opcode_info(0xFC, SM83_MN.SET_idx_di, 7, 'H');
        case 0xFD: return new SM83_opcode_info(0xFD, SM83_MN.SET_idx_di, 7, 'L');
        case 0xFE: return new SM83_opcode_info(0xFE, SM83_MN.SET_idx_ind, 7, 'HL');
        case 0xFF: return new SM83_opcode_info(0xFF, SM83_MN.SET_idx_di, 7, 'A');
    }
    return new SM83_opcode_info(i, SM83_MN.NONE);
}

export const SM83_MAX_OPCODE = 0x101;

export const SM83_prefixes: StaticArray<u32> = [0, 0xCB]
export const SM83_prefix_to_codemap: Map<u32, u32> = new Map<u32, u32>;
SM83_prefix_to_codemap.set(0, 0);
SM83_prefix_to_codemap.set(1, SM83_MAX_OPCODE + 1);

export class SM83_opcode_functions {
    opcode: u32
    ins: SM83_MN = 0
    mnemonic: String = ''
    exec_func: (regs: SM83_regs, pins: SM83_pins) => void;
    constructor(opcode_info: SM83_opcode_info, exec_func: (regs: SM83_regs, pins: SM83_pins) => void) {
        this.opcode = opcode_info.opcode;
        this.ins = opcode_info.ins;
        //this.mnemonic = opcode_info.mnemonic;
        this.exec_func = exec_func;
    }
}

