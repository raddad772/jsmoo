"use strict";

class R3000_disassembly_output {
    constructor() {
        this.mnemonic = 'UKN ###'
        this.disassembled = 'UKN ###'
    }
}

/*
Name       Alias    Common Usage
  (R0)       zero     Constant (always 0) (this one isn't a real register)
  R1         at       Assembler temporary (destroyed by some pseudo opcodes!)
  R2-R3      v0-v1    Subroutine return values, may be changed by subroutines
  R4-R7      a0-a3    Subroutine arguments, may be changed by subroutines
  R8-R15     t0-t7    Temporaries, may be changed by subroutines
  R16-R23    s0-s7    Static variables, must be saved by subs
  R24-R25    t8-t9    Temporaries, may be changed by subroutines
  R26-R27    k0-k1    Reserved for kernel (destroyed by some IRQ handlers!)
  R28        gp       Global pointer (rarely used)
  R29        sp       Stack pointer
  R30        fp(s8)   Frame Pointer, or 9th Static variable, must be saved
  R31        ra       Return address (used so by JAL,BLTZAL,BGEZAL opcodes)
  -          pc       Program counter
  -          hi,lo    Multiply/divide results, may be changed by subroutines
 */

const R3000_reg = Object.freeze ({
    zero: 0, at: 1, v0: 2, v1: 3, a0: 4, a1: 5, a2: 6, a3: 7,
    t0: 8, t1: 9, t2: 10, t3: 11, t4: 12, t5: 13, t6: 14, t7: 15,
    s0: 16, s1: 17, s2: 18, s3: 19, s4: 20, s5: 21, s6: 22, s7: 23,
    t8: 24, t9: 25, k0: 26, k1: 27, gp: 28, sp: 29, fp: 30, ra: 31
});

const R3000_COP0_reg = Object.freeze({
    PRId: 15,
    SR: 12,
    Cause: 13,
    EPC: 14,
    BadVaddr: 8,
    Config: 3,
    BusCtrl: 2,
    PortSize: 10,
    Count: 9,
    Compare: 11
});

const R3000_reg_alias = Object.freeze([
    'r0', 'at', 'v0', 'v1', // r0-3
    'a0', 'a1', 'a2', 'a3', // r4-7
    't0', 't1', 't2', 't3', // r8-11
    't4', 't5', 't6', 't7', // r12-15
    's0', 's1', 's2', 's3', // r16-19
    's4', 's5', 's6', 's7', // r20-23
    't8', 't9', 'k0', 'k1', // r24-27
    'gp', 'sp', 'fp', 'ra'  // r28-31
])


/**
 * @param {number} opcode
 * @returns {R3000_disassembly_output}
 */
function R3000_disassemble(opcode) {
    let output = new R3000_disassembly_output();
    let ostr1 = '', ostr2 = '';

    let p_op = (opcode >>> 26) & 63;
    let s_op = opcode & 63;
    let imm16 = opcode & 0xFFFF;
    let rs = (opcode >>> 21) & 31;
    let rt = (opcode >>> 16) & 31;
    let rd = (opcode >>> 11) & 31;
    let imm5 = (opcode >>> 6) & 31;
    let num = p_op & 3;

    if (opcode === 0) {
        output.disassembled = 'nop        ';
        return output;
    }
    
    switch(p_op) {
        case 0x00: // SPECIAL
            switch(s_op) {
                case 0x00: // SLL
                    ostr1 = 'sll';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt] + ', ' + imm5;
                    break;
                case 0x02: // SRL
                    ostr1 = 'srl';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt] + ', ' + imm5;
                    break;
                case 0x03: // SRA
                    ostr1 = 'sra';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt] + ', ' + imm5;
                    break;
                case 0x04: // SLLV
                    ostr1 = 'sllv';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs];
                    break;
                case 0x06: // SRLV
                    ostr1 = 'srlv';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs];
                    break;
                case 0x07: // SRAV
                    ostr1 = 'srav';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs];
                    break;
                case 0x08: // JR
                    ostr1 = 'jr';
                    ostr2 = R3000_reg_alias[rs];
                    break;
                case 0x09: // JALR
                    ostr1 = 'jalr'
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rd];
                    break;
                case 0x0C: // SYSCALL
                    ostr1 = 'syscall';
                    ostr2 = hex5((opcode >>> 6) & 0xFFFFF) + 'h';
                    break;
                case 0x0D: // BREAK
                    ostr1 = 'break';
                    ostr2 = hex5((opcode >>> 6) & 0xFFFFF) + 'h';
                    break;
                case 0x10: // MFHI
                    ostr1 = 'mfhi';
                    ostr2 = R3000_reg_alias[rd];
                    break;
                case 0x11: // MTHI
                    ostr1 = 'mthi';
                    ostr2 = R3000_reg_alias[rs];
                    break;
                case 0x12: // MFLO
                    ostr1 = 'mfhi';
                    ostr2 = R3000_reg_alias[rd];
                    break;
                case 0x13: // MTLO
                    ostr1 = 'mfhi';
                    ostr2 = R3000_reg_alias[rs];
                    break;
                case 0x18: // MULT
                    ostr1 = 'mult';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x19: // MULTU
                    ostr1 = 'multu';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x1A: // DIV
                    ostr1 = 'div';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x1B: // DIVU
                    ostr1 = 'divu';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x20: // ADD
                    ostr1 = 'add';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x21: // ADDU
                    ostr1 = 'addu';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x22: // SUB
                    ostr1 = 'sub';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x23: // SUBU
                    ostr1 = 'subu';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x24: // AND
                    ostr1 = 'and';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x25: // OR
                    ostr1 = 'or';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x26: // XOR
                    ostr1 = 'xor';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x27: // NOR
                    ostr1 = 'nor';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x2A: // SLT
                    ostr1 = 'slt';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                case 0x2B: // SLTU
                    ostr1 = 'sltu';
                    ostr2 = R3000_reg_alias[rd] + ', ' + R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt];
                    break;
                default:
                    ostr1 = 'UNKNOWN.b ' + hex2(s_op) + ' ' + hex8(opcode);
                    break;
            }
            break;
        case 0x01: // BcondZ
            switch((opcode >>> 16) & 31) {
                case 0:
                    ostr1 = 'bltz';
                    break;
                case 1:
                    ostr1 = 'bgez';
                    break;
                case 0x10:
                    ostr1 = 'bltzal';
                    break;
                case 0x11:
                    ostr1 = 'bgezal';
                    break;
                default:
                    ostr1 = 'UNKNOWN.a ' + hex8(opcode);
                    break;
            }
            ostr2 = R3000_reg_alias[rs] + ', ' + mksigned16h4(imm16)
            break;
        case 0x02: // J
            ostr1 = 'j';
            ostr2 = hex8(0xF0000000 + ((opcode & 0x3FFFFFF) * 4)) + 'h';
            break;
        case 0x03: // JAL
            ostr1 = 'jalr';
            ostr2 = hex8(0xF0000000 + ((opcode & 0x3FFFFFF) * 4)) + 'h';
            break;
        case 0x04: // BEQ
            ostr1 = 'beq';
            ostr2 = R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt] + ', ' + mksigned16h4(imm16);
            break;
        case 0x05: // BNE
            ostr1 = 'bne';
            ostr2 = R3000_reg_alias[rs] + ', ' + R3000_reg_alias[rt] + ', ' + mksigned16h4(imm16);
            break;
        case 0x06: // BLEZ
            ostr1 = 'blez';
            ostr2 = R3000_reg_alias[rs] + ', ' + mksigned16h4(imm16)
            break;
        case 0x07: // BGTZ
            ostr1 = 'bgtz';
            ostr2 = R3000_reg_alias[rs] + ', ' + mksigned16h4(imm16)
            break;
        case 0x08: // ADDI
            ostr1 = 'addi';
            ostr2 = R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs] + ', ' + mksigned16h(imm16);
            break;
        case 0x09: // ADDIU
            ostr1 = 'addiu';
            ostr2 = R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs] + ', ' + mksigned16h(imm16);
            break;
        case 0x0A: // SLTI
            ostr1 = 'setlt slti';
            ostr2 = R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs] + ', ' + mksigned16h(imm16)
            break;
        case 0x0B: // SLTIU
            ostr1 = 'setb sltiu';
            ostr2 = R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs] + ', ' + mksigned16h(imm16)
            break;
        case 0x0C: // ANDI
            ostr1 = 'andi';
            ostr2 = R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs] + ', ' + mksigned16h(imm16);
            break;
        case 0x0D: // ORI
            ostr1 = 'ori';
            ostr2 = R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs] + ', ' + mksigned16h(imm16);
            break;
        case 0x0E: // XORI
            ostr1 = 'xori';
            ostr2 = R3000_reg_alias[rt] + ', ' + R3000_reg_alias[rs] + ', ' + hex4(imm16);
            break;
        case 0x0F: // LUI
            ostr1 = 'lui';
            ostr2 = R3000_reg_alias[rt] + ', ' + hex4(imm16) + '0000' + 'h';
            break;
        case 0x13: // COP3
        case 0x12: // COP2
        case 0x11: // COP1
        case 0x10: // COP0
            ostr1 = 'COP' + num;
            break;
        case 0x20: // LB
            ostr1 = 'lb';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x21: // LH
            ostr1 = 'lh';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x22: // LWL
            ostr1 = 'lwl';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x23: // LW
            ostr1 = 'lw';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x24: // LBU
            ostr1 = 'lbu';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x25: // LHU
            ostr1 = 'lhu';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x26: // LWR
            ostr1 = 'lwr';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x28: // SB
            ostr1 = 'sb';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x29: // SH
            ostr1 = 'sh';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x2A: // SWL
            ostr1 = 'swl';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x2B: // SW
            ostr1 = 'sw';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x2E: // SWR
            ostr1 = 'swr';
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x33: // LWC3
        case 0x32: // LWC2
        case 0x31: // LWC1
        case 0x30: // LWC0
            ostr1 = 'lwc' + num;
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
        case 0x3B: // SWC3
        case 0x3A: // SWC2
        case 0x39: // SWC1
        case 0x38: // SWC0
            ostr1 = 'swc' + num;
            ostr2 = R3000_reg_alias[rt] + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias[rs] + ')';
            break;
    }

    while(ostr1.length < 11) {
        ostr1 += ' ';
    }
    
    output.disassembled = ostr1;
    if (ostr2.length > 0) output.disassembled += ' ' + ostr2;
    return output;
}
