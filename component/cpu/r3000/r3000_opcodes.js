"use strict";

const R3000_MNs = [
    'SPECIAL', 'BcondZ', 'J', 'JAL', 'BEQ', 'BNE', 'BLEZ', 'BGTZ', 'ADDI', 'ADDIU', 'SLTI',
    'SLTIU', 'ANDI', 'ORI', 'XORI', 'LUI', 'COP0', 'COP1', 'COP2', 'COP3', 'LB', 'LH', 'LWL',
    'LW', 'LBU', 'LHU', 'LWR', 'SB', 'SH', 'SWL', 'SW', 'SWR', 'SWC0', 'SWC1', 'SWC2', 'SWC3',
    // when SPECIAL
    'SLL', 'SRL', 'SRA', 'SLLV', 'SRLV', 'SRAV', 'JR', 'JALR', 'SYSCALL', 'BREAK', 'MFHI', 'MTHI',
    'MFLO', 'MTLO', 'MULT', 'MULTU', 'DIV', 'DIVU', 'ADD', 'ADDU', 'SUB', 'SUBU', 'AND', 'OR', 'XOR',
    'NOR', 'SLT', 'SLTU', 'NA',
    // COP sub-instructions
    'MFC', 'CFC', 'MTC', 'CTC', 'BCF', 'BCT', 'COPimm'
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

const R3000_MN = Object.freeze({
    SPECIAL: 0, BcondZ: 1, J: 2, JAL: 3, BEQ: 4,
    BNE: 5, BLEZ: 6, BGTZ: 7, ADDI: 8, ADDIU: 9,
    SLTI: 10, SLTIU: 11, ANDI: 12, ORI: 13, XORI: 14,
    LUI: 15, COP0: 16, COP1: 17, COP2: 18, COP3: 19,
    LB: 20, LH: 21, LWL: 22, LW: 23, LBU: 24,
    LHU: 25, LWR: 26, SB: 27, SH: 28, SWL: 29,
    SW: 30, SWR: 31, SWC0: 32, SWC1: 33, SWC2: 34,
    SWC3: 35, SLL: 36, SRL: 37, SRA: 38, SLLV: 39,
    SRLV: 40, SRAV: 41, JR: 42, JALR: 43, SYSCALL: 44,
    BREAK: 45, MFHI: 46, MTHI: 47, MFLO: 48, MTLO: 49,
    MULT: 50, MULTU: 51, DIV: 52, DIVU: 53, ADD: 54,
    ADDU: 55, SUB: 56, SUBU: 57, AND: 58, OR: 59,
    XOR: 60, NOR: 61, SLT: 62, SLTU: 63, NA: 64,
    MFC: 65, CFC: 66, MTC: 67, CTC: 68, BCF: 69,
    BCT: 70, COPimm: 71,
});

const R3000_MN_R = Object.freeze({
    0: 'SPECIAL', 1: 'BcondZ', 2: 'J', 3: 'JAL', 4: 'BEQ',
    5: 'BNE', 6: 'BLEZ', 7: 'BGTZ', 8: 'ADDI', 9: 'ADDIU',
    10: 'SLTI', 11: 'SLTIU', 12: 'ANDI', 13: 'ORI', 14: 'XORI',
    15: 'LUI', 16: 'COP0', 17: 'COP1', 18: 'COP2', 19: 'COP3',
    20: 'LB', 21: 'LH', 22: 'LWL', 23: 'LW', 24: 'LBU',
    25: 'LHU', 26: 'LWR', 27: 'SB', 28: 'SH', 29: 'SWL',
    30: 'SW', 31: 'SWR', 32: 'SWC0', 33: 'SWC1', 34: 'SWC2',
    35: 'SWC3', 36: 'SLL', 37: 'SRL', 38: 'SRA', 39: 'SLLV',
    40: 'SRLV', 41: 'SRAV', 42: 'JR', 43: 'JALR', 44: 'SYSCALL',
    45: 'BREAK', 46: 'MFHI', 47: 'MTHI', 48: 'MFLO', 49: 'MTLO',
    50: 'MULT', 51: 'MULTU', 52: 'DIV', 53: 'DIVU', 54: 'ADD',
    55: 'ADDU', 56: 'SUB', 57: 'SUBU', 58: 'AND', 59: 'OR',
    60: 'XOR', 61: 'NOR', 62: 'SLT', 63: 'SLTU', 64: 'NA',
    65: 'MFC', 66: 'CFC', 67: 'MTC', 68: 'CTC', 69: 'BCF',
    70: 'BCT', 71: 'COPimm',
});
class R3000_opcode {
    constructor(opcode, mnemonic, func) {
        this.opcode = opcode;
        this.mnemonic = mnemonic;
        this.func = func;
    }
}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fNA(opcode, arg, regs, bus) {
    console.log('BAD INSTRUCTION', hex8(opcode));
}

/**
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 * @param {number} target
 * @param {number} value
 */
function R3000_fs_reg_write(regs, bus, target, value) {
    regs.R[target] = value;
    let p = bus.pipe.peek();
    if (p === null) {
        console.log('PIPE EMPTY ERROR!');
        return;
    }

    if (p.target === target) p.target = -1;
}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBcondZ(opcode, arg, regs, bus) {
/*
  000001 | rs   | 00000| <--immediate16bit--> | bltz
  000001 | rs   | 00001| <--immediate16bit--> | bgez
  000001 | rs   | 10000| <--immediate16bit--> | bltzal
  000001 | rs   | 10001| <--immediate16bit--> | bgezal
 */
    let rs = (opcode >>> 21) & 0x1F;
    let w = (opcode >>> 16) & 0x1F;
    let imm = opcode & 0xFFFF;
    let take = false;
    switch(w) {
        case 0: // BLTZ
            take = regs.R[rs] < 0;
            break;
        case 1: // BGEZ
            take = regs.R[rs] >= 0;
            break;
        case 0x10: // BLTZAL
            take = regs.R[rs] < 0;
            R3000_fs_reg_write(regs, bus, 31, regs.PC);
            break;
        case 0x11: // BGEZAL
            take = regs.R[rs] >= 0;
            R3000_fs_reg_write(regs, bus, 31, regs.PC);
            break;
        default:
            console.log('Bad B..Z instruction!', hex8(opcode));
            return;
    }
    R3000_branch(regs, bus,
        (regs.PC + (mksigned16(imm) * 4)) & 0xFFFFFFFF,
        true,
        false
        )
}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fJ(opcode, arg, regs, bus) {
/*
  00001x | <---------immediate26bit---------> | j/jal
  */
    R3000_branch(regs, bus,
        ((regs.PC & 0xF0000000) + ((opcode & 0x3FFFFFF) * 4)) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] !== regs.R[(opcode >>> 16) & 0x1F],
        false);
}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fJAL(opcode, arg, regs, bus) {
/*
  00001x | <---------immediate26bit---------> | j/jal
  */
    R3000_branch(regs, bus,
        ((regs.PC & 0xF0000000) + ((opcode & 0x3FFFFFF) * 4)) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] !== regs.R[(opcode >>> 16) & 0x1F],
        true);
}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBEQ(opcode, arg, regs, bus) {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(regs, bus,
        (regs.PC + (mksigned16(opcode & 0xFFFF))) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] === regs.R[(opcode >>> 16) & 0x1F],
        false);
}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBNE(opcode, arg, regs, bus) {
    // 00010x | rs   | rt   | <--immediate16bit--> |\
    R3000_branch(regs, bus,
        (regs.PC + (mksigned16(opcode & 0xFFFF))) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] !== regs.R[(opcode >>> 16) & 0x1F],
        false);
}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBLEZ(opcode, arg, regs, bus) {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(regs, bus,
        (regs.PC + (mksigned16(opcode & 0xFFFF))) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] <= 0,
        false)
}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBGTZ(opcode, arg, regs, bus) {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(regs, bus,
        (regs.PC + (mksigned16(opcode & 0xFFFF))) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] > 0,
        false)
}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fADDI(opcode, arg, regs, bus) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm = mksigned16(opcode & 0xFFFF);

}

/**
 * @param {Number} opcode
 * @param {Number} arg
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fCOP(opcode, arg, regs, bus) {
    // argument = COP#
    let ins;
    if ((opcode & 0x4000000) === 0) { // MFC, CFC, MTC, CTC, BC.F, BC.T
        switch ((opcode >>> 21) & 15) {
            case 0: // MFCn
                ins = R3000_MN.MFC;
                break;
            case 2: // CFCn
                ins = R3000_MN.CFC;
                break;
            case 4: // MTCn
                ins = R3000_MN.MTC;
                break;
            case 6: // CTCn
                ins = R3000_MN.CTC;
                break;
            case 8: // could be a few...
                switch ((opcode >>> 16) & 0x1F) {
                    case 0: // BCnF
                        ins = R3000_MN.BCF;
                        break;
                    case 1: // BCnT
                        ins = R3000_MN.BCT;
                        break;
                    default:
                        console.log('Could not decode COP instruction2', hex8(opcode));
                        return;
                }
                break;
            default:
                console.log('Could not decode COP instruction', hex8(opcode));
                return;
        }
    } else { // COPn imm

    }

}



/**
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 * @param {number} new_addr
 * @param {boolean} doit
 * @param {boolean} link
 */
function R3000_branch(regs, bus, new_addr, doit, link) {
    if (doit)
        bus.pipe.peek().new_PC = new_addr;
    if (link)
        R3000_fs_reg_write(regs, bus, 31, regs.PC);
}



function R3000_generate_opcodes() {
    let R3000_table = [];
    // Decode bits 31...26
    for (let op1 = 0; op1 < 0x3F; op1++) {
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
        switch(op1) {
            case 0x00: // SPECIAL
                for (let op2 = 0; op2 < 0x3F; op2++) {
                    switch(op2) {

                    }
                }
                break;
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
            case 0x10: // COP0
                m = R3000_MN.COP0;
                o = R3000_fCOP;
                a = (op1 - 0x10);
        }

    }
}