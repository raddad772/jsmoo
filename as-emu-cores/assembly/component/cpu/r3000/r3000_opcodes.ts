"use strict";

import {R3000} from "./r3000";
import {
    R3000_fADD,
    R3000_fADDI,
    R3000_fADDIU,
    R3000_fADDU,
    R3000_fAND, R3000_fANDI,
    R3000_fBcondZ,
    R3000_fBEQ,
    R3000_fBGTZ,
    R3000_fBLEZ,
    R3000_fBNE,
    R3000_fBREAK, R3000_fCOP,
    R3000_fDIV,
    R3000_fDIVU,
    R3000_fJ,
    R3000_fJAL,
    R3000_fJALR,
    R3000_fJR, R3000_fLB, R3000_fLBU, R3000_fLH, R3000_fLHU, R3000_fLUI, R3000_fLW, R3000_fLWC, R3000_fLWL, R3000_fLWR,
    R3000_fMFHI,
    R3000_fMFLO,
    R3000_fMTHI,
    R3000_fMTLO,
    R3000_fMULT,
    R3000_fMULTU,
    R3000_fNA,
    R3000_fNOR,
    R3000_fOR, R3000_fORI, R3000_fSB, R3000_fSH,
    R3000_fSLL,
    R3000_fSLLV,
    R3000_fSLT, R3000_fSLTI, R3000_fSLTIU,
    R3000_fSLTU,
    R3000_fSRA,
    R3000_fSRAV,
    R3000_fSRL,
    R3000_fSRLV,
    R3000_fSUB,
    R3000_fSUBU, R3000_fSW, R3000_fSWC, R3000_fSWL, R3000_fSWR,
    R3000_fSYSCALL,
    R3000_fXOR, R3000_fXORI
} from "./r3000_instructions";

const R3000_MNs = [
    'SPECIAL', 'BcondZ', 'J', 'JAL', 'BEQ', 'BNE', 'BLEZ', 'BGTZ', 'ADDI', 'ADDIU', 'SLTI',
    'SLTIU', 'ANDI', 'ORI', 'XORI', 'LUI', 'COP0', 'COP1', 'COP2', 'COP3', 'LB', 'LH', 'LWL',
    'LW', 'LBU', 'LHU', 'LWR', 'SB', 'SH', 'SWL', 'SW', 'SWR', 'SWC0', 'SWC1', 'SWC2', 'SWC3',
    // when SPECIAL
    'SLL', 'SRL', 'SRA', 'SLLV', 'SRLV', 'SRAV', 'JR', 'JALR', 'SYSCALL', 'BREAK', 'MFHI', 'MTHI',
    'MFLO', 'MTLO', 'MULT', 'MULTU', 'DIV', 'DIVU', 'ADD', 'ADDU', 'SUB', 'SUBU', 'AND', 'OR', 'XOR',
    'NOR', 'SLT', 'SLTU', 'NA',
    // a few missing ones
    'LWCx', 'SWCx', 'COPx',
    // COP sub-instructions
    'MFC', 'CFC', 'MTC', 'CTC', 'BCF', 'BCT', 'COPimm', 'RFE'
]

function R3000_MN_gen() {
    let per_line = 4;
    let mn = 'const R3000_MN = Object.freeze({';
    let mn_r = 'const R3000_MN_R = Object.freeze({';
    let cnt = 0;
    let on_line = 0;
    for (let i in R3000_MNs) {
        if (on_line === 0) {
            mn += '\n    ';
            mn_r += '\n    ';
        }
        mn += R3000_MNs[i] + ': ' + cnt + ', ';
        mn_r += cnt + ": '" + R3000_MNs[i] + "', ";
        on_line++;
        if (on_line > per_line) on_line = 0;
        cnt++;
    }
    return mn + '\n});\n\n' + mn_r + '\n});\n';
}

//console.log(R3000_MN_gen());

enum R3000_MN {
    SPECIAL = 0, BcondZ = 1, J = 2, JAL = 3, BEQ = 4,
    BNE = 5, BLEZ = 6, BGTZ = 7, ADDI = 8, ADDIU = 9,
    SLTI = 10, SLTIU = 11, ANDI = 12, ORI = 13, XORI = 14,
    LUI = 15, COP0 = 16, COP1 = 17, COP2 = 18, COP3 = 19,
    LB = 20, LH = 21, LWL = 22, LW = 23, LBU = 24,
    LHU = 25, LWR = 26, SB = 27, SH = 28, SWL = 29,
    SW = 30, SWR = 31, SWC0 = 32, SWC1 = 33, SWC2 = 34,
    SWC3 = 35, SLL = 36, SRL = 37, SRA = 38, SLLV = 39,
    SRLV = 40, SRAV = 41, JR = 42, JALR = 43, SYSCALL = 44,
    BREAK = 45, MFHI = 46, MTHI = 47, MFLO = 48, MTLO = 49,
    MULT = 50, MULTU = 51, DIV = 52, DIVU = 53, ADD = 54,
    ADDU = 55, SUB = 56, SUBU = 57, AND = 58, OR = 59,
    XOR = 60, NOR = 61, SLT = 62, SLTU = 63, NA = 64,
    LWCx = 65, SWCx = 66, COPx = 67, MFC = 68, CFC = 69,
    MTC = 70, CTC = 71, BCF = 72, BCT = 73, COPimm = 74,
    RFE = 75
};

export class R3000_opcode {
    opcode: u32
    mnemonic: R3000_MN
    func: (opcode: u32, op: R3000_opcode, core: R3000) => void;
    arg: i32|null;
    constructor(
        opcode: u32,
        mnemonic: R3000_MN,
        func: (opcode: u32, op: R3000_opcode, core: R3000) => void,
        arg: i32|null)
    {
        this.opcode = opcode;
        this.mnemonic = mnemonic;
        this.func = func;
        this.arg = arg;
    }
}



export function R3000_generate_opcodes(): StaticArray<R3000_opcode> {
    let R3000_table: StaticArray<R3000_opcode> = new StaticArray<R3000_opcode>(0x7F);
    // Decode bits 31...26
    for (let op1: u32 = 0; op1 < 0x3F; op1++) {
/*
 00h=SPECIAL 08h=ADDI  10h=COP0 18h=N/A   20h=LB   28h=SB   30h=LWC0 38h=SWC0
  01h=BcondZ  09h=ADDIU 11h=COP1 19h=N/A   21h=LH   29h=SH   31h=LWC1 39h=SWC1
  02h=J       0Ah=SLTI  12h=COP2 1Ah=N/A   22h=LWL  2Ah=SWL  32h=LWC2 3Ah=SWC2
  03h=JAL     0Bh=SLTIU 13h=COP3 1Bh=N/A   23h=LW   2Bh=SW   33h=LWC3 3Bh=SWC3
  04h=BEQ     0Ch=ANDI  14h=N/A  1Ch=N/A   24h=LBU  2Ch=N/A  34h=N/A  3Ch=N/A
  05h=BNE     0Dh=ORI   15h=N/A  1Dh=N/A   25h=LHU  2Dh=N/A  35h=N/A  3Dh=N/A
  06h=BLEZ    0Eh=XORI  16h=N/A  1Eh=N/A   26h=LWR  2Eh=SWR  36h=N/A  3Eh=N/A
  07h=BGTZ    0Fh=LUI   17h=N/A  1Fh=N/A   27h=N/A  2Fh=N/A  37h=N/A  3Fh=N/A
 */
        let o = R3000_fNA;
        let m = R3000_MN.NA;
        let a: i32|null = null;
        switch(op1) {
            case 0x00: // SPECIAL
                for (let op2 = 0; op2 < 0x3F; op2++) {
                    a = null;
                    switch(op2) {
                        case 0x00: // SLL
                            m = R3000_MN.J;
                            o = R3000_fSLL;
                            break;
                        case 0x02: // SRL
                            m = R3000_MN.SRL;
                            o = R3000_fSRL;
                            break;
                        case 0x03: // SRA
                            m = R3000_MN.SRA;
                            o = R3000_fSRA;
                            break;
                        case 0x4: // SLLV
                            m = R3000_MN.SLLV;
                            o = R3000_fSLLV;
                            break;
                        case 0x06: // SRLV
                            m = R3000_MN.SRLV;
                            o = R3000_fSRLV;
                            break;
                        case 0x07: // SRAV
                            m = R3000_MN.SRAV;
                            o = R3000_fSRAV;
                            break;
                        case 0x08: // JR
                            m = R3000_MN.JR;
                            o = R3000_fJR;
                            break;
                        case 0x09: // JALR
                            m = R3000_MN.JALR;
                            o = R3000_fJALR;
                            break;
                        case 0x0C: // SYSCALL
                            m = R3000_MN.SYSCALL;
                            o = R3000_fSYSCALL;
                            break;
                        case 0x0D: // BREAK
                            m = R3000_MN.BREAK;
                            o = R3000_fBREAK;
                            break;
                        case 0x10: // MFHI
                            m = R3000_MN.MFHI;
                            o = R3000_fMFHI;
                            break;
                        case 0x11: // MTHI
                            m = R3000_MN.MTHI;
                            o = R3000_fMTHI;
                            break;
                        case 0x12: // MFLO
                            m = R3000_MN.MFLO;
                            o = R3000_fMFLO;
                            break;
                        case 0x13: // MTLO
                            m = R3000_MN.MTLO;
                            o = R3000_fMTLO;
                            break;
                        case 0x18: // MULT
                            m = R3000_MN.MULT;
                            o = R3000_fMULT;
                            break;
                        case 0x19: // MULTU
                            m = R3000_MN.MULTU;
                            o = R3000_fMULTU;
                            break;
                        case 0x1A: // DIV
                            m = R3000_MN.DIV;
                            o = R3000_fDIV;
                            break;
                        case 0x1B: // DIVU
                            m = R3000_MN.DIVU;
                            o = R3000_fDIVU;
                            break;
                        case 0x20: // ADD
                            m = R3000_MN.ADD;
                            o = R3000_fADD;
                            break;
                        case 0x21: // ADDU
                            m = R3000_MN.ADDU;
                            o = R3000_fADDU;
                            break;
                        case 0x22: // SUB
                            m = R3000_MN.SUB;
                            o = R3000_fSUB;
                            break;
                        case 0x23: // SUBU
                            m = R3000_MN.SUBU;
                            o = R3000_fSUBU;
                            break;
                        case 0x24: // AND
                            m = R3000_MN.AND;
                            o = R3000_fAND;
                            break;
                        case 0x25: // OR
                            m = R3000_MN.OR;
                            o = R3000_fOR;
                            break;
                        case 0x26: // XOR
                            m = R3000_MN.XOR;
                            o = R3000_fXOR;
                            break;
                        case 0x27: // NOR
                            m = R3000_MN.NOR;
                            o = R3000_fNOR;
                            break;
                        case 0x2A: // SLT
                            m = R3000_MN.SLT;
                            o = R3000_fSLT;
                            break;
                        case 0x2B: // SLTU
                            m = R3000_MN.SLTU;
                            o = R3000_fSLTU;
                            break;
                        default:
                            m = R3000_MN.NA;
                            o = R3000_fNA;
                            break;
                    }
                    R3000_table[op2 + 0x3F] = new R3000_opcode(op2, m, o, a);
                }
                continue;
            case 0x01: // BcondZ
                m = R3000_MN.BcondZ;
                o = R3000_fBcondZ;
                break;
            case 0x02: // J
                m = R3000_MN.J;
                o = R3000_fJ;
                break;
            case 0x03: // JAL
                m = R3000_MN.JAL;
                o = R3000_fJAL;
                break;
            case 0x04: // BEQ
                m = R3000_MN.BEQ;
                o = R3000_fBEQ;
                break;
            case 0x05: // BNE
                m = R3000_MN.BNE;
                o = R3000_fBNE;
                break;
            case 0x06: // BLEZ
                m = R3000_MN.BLEZ;
                o = R3000_fBLEZ;
                break;
            case 0x07: // BGTZ
                m = R3000_MN.BGTZ;
                o = R3000_fBGTZ;
                break;
            case 0x08: // ADDI
                m = R3000_MN.ADDI;
                o = R3000_fADDI;
                break;
            case 0x09: // ADDIU
                m = R3000_MN.ADDIU;
                o = R3000_fADDIU;
                break;
            case 0x0A: // SLTI
                m = R3000_MN.SLTI;
                o = R3000_fSLTI;
                break;
            case 0x0B: // SLTIU
                m = R3000_MN.SLTIU;
                o = R3000_fSLTIU;
                break;
            case 0x0C: // ANDI
                m = R3000_MN.ANDI;
                o = R3000_fANDI;
                break;
            case 0x0D: // ORI
                m = R3000_MN.ORI;
                o = R3000_fORI;
                break;
            case 0x0E: // XORI
                m = R3000_MN.XORI;
                o = R3000_fXORI;
                break;
            case 0x0F: // LUI
                m = R3000_MN.LUI;
                o = R3000_fLUI;
                break;
            case 0x13: // COP3
            case 0x12: // COP2
            case 0x11: // COP1
            case 0x10: // COP0
                m = R3000_MN.COPx;
                o = R3000_fCOP;
                a = (op1 - 0x10);
                break;
            case 0x20: // LB
                m = R3000_MN.LB;
                o = R3000_fLB;
                break;
            case 0x21: // LH
                m = R3000_MN.LH;
                o = R3000_fLH;
                break;
            case 0x22: // LWL
                m = R3000_MN.LWL;
                o = R3000_fLWL;
                break;
            case 0x23: // LW
                m = R3000_MN.LW;
                o = R3000_fLW;
                break;
            case 0x24: // LBU
                m = R3000_MN.LBU;
                o = R3000_fLBU;
                break;
            case 0x25: // LHU
                m = R3000_MN.LHU;
                o = R3000_fLHU;
                break;
            case 0x26: // LWR
                m = R3000_MN.LWR;
                o = R3000_fLWR;
                break;
            case 0x28: // SB
                m = R3000_MN.SB;
                o = R3000_fSB;
                break;
            case 0x29: // SH
                m = R3000_MN.SH;
                o = R3000_fSH;
                break;
            case 0x2A: // SWL
                m = R3000_MN.SWL;
                o = R3000_fSWL;
                break;
            case 0x2B: // SW
                m = R3000_MN.SW;
                o = R3000_fSW;
                break;
            case 0x2E: // SWR
                m = R3000_MN.SWR;
                o = R3000_fSWR;
                break;
            case 0x33: // LWC3
            case 0x32: // LWC2
            case 0x31: // LWC1
            case 0x30: // LWC0
                m = R3000_MN.LWCx;
                o = R3000_fLWC;
                a = op1 - 0x30;
                break;
            case 0x3B: // SWC3
            case 0x3A: // SWC2
            case 0x39: // SWC1
            case 0x38: // SWC0
                m = R3000_MN.SWCx;
                o = R3000_fSWC;
                a = op1 - 0x38;
                break;
        }
        R3000_table[op1] = new R3000_opcode(op1, m, o, a);
    }
    return R3000_table;
}