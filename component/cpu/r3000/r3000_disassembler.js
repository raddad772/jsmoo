"use strict";

class R3000_disassembly_output {
    constructor() {
        this.mnemonic = 'UKN ###'
        this.disassembled = 'UKN ###'
    }
}

export function M6502_disassemble(opcode) {
    let output = new R3000_disassembly_output();
    let ostr1 = '', ostr2 = '';

    let p_op = (opcode >>> 26) & 31;
    let s_op = opcode & 31;
    let imm16 = opcode & 0xFFFF;
    let rs = (opcode >>> 21) & 31;
    let rt = (opcode >>> 16) & 31;
    let rd = (opcode >>> 11) & 31;
    let imm5 = (opcode >>> 6) & 31;
    let num = p_op & 3;
    
    switch(p_op) {
        case 0x00: // SPECIAL
            switch(s_op) {
                case 0x00: // SLL
                    ostr1 = 'sll';
                    ostr2 = 'r' + rd + ', r' + rt + ', ' + imm5;
                    break;
                case 0x02: // SRL
                    ostr1 = 'srl';
                    ostr2 = 'r' + rd + ', r' + rt + ', ' + imm5;
                    break;
                case 0x03: // SRA
                    ostr1 = 'sra';
                    ostr2 = 'r' + rd + ', r' + rt + ', ' + imm5;
                    break;
                case 0x04: // SLLV
                    ostr1 = 'sllv';
                    ostr2 = 'r' + rd + ', r' + rt + ', r' + rs;
                    break;
                case 0x06: // SRLV
                    ostr1 = 'srlv';
                    ostr2 = 'r' + rd + ', r' + rt + ', r' + rs;
                    break;
                case 0x07: // SRAV
                    ostr1 = 'srav';
                    ostr2 = 'r' + rd + ', r' + rt + ', r' + rs;
                    break;
                case 0x08: // JR
                    ostr1 = 'jr';
                    ostr2 = 'r' + rs;
                    break;
                case 0x09: // JALR
                    ostr1 = 'jalr'
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rd;
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
                    ostr2 = 'r' + rd;
                    break;
                case 0x11: // MTHI
                    ostr1 = 'mthi';
                    ostr2 = 'r' + rs;
                    break;
                case 0x12: // MFLO
                    ostr1 = 'mfhi';
                    ostr2 = 'r' + rd;
                    break;
                case 0x13: // MTLO
                    ostr1 = 'mfhi';
                    ostr2 = 'r' + rs;
                    break;
                case 0x18: // MULT
                    ostr1 = 'mult';
                    ostr2 = 'r' + rd + ', r' + rt;
                    break;
                case 0x19: // MULTU
                    ostr1 = 'multu';
                    ostr2 = 'r' + rd + ', r' + rt;
                    break;
                case 0x1A: // DIV
                    ostr1 = 'div';
                    ostr2 = 'r' + rd + ', r' + rt;
                    break;
                case 0x1B: // DIVU
                    ostr1 = 'divu';
                    ostr2 = 'r' + rd + ', r' + rt;
                    break;
                case 0x20: // ADD
                    ostr1 = 'add';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                case 0x21: // ADDU
                    ostr1 = 'addu';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                case 0x22: // SUB
                    ostr1 = 'sub';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                case 0x23: // SUBU
                    ostr1 = 'subu';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                case 0x24: // AND
                    ostr1 = 'and';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                case 0x25: // OR
                    ostr1 = 'or';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                case 0x26: // XOR
                    ostr1 = 'xor';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                case 0x27: // NOR
                    ostr1 = 'nor';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                case 0x2A: // SLT
                    ostr1 = 'slt';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                case 0x2B: // SLTU
                    ostr1 = 'sltu';
                    ostr2 = 'r' + rd + ', r' + rs + ', r' + rt;
                    break;
                default:
                    ostr1 = 'UNKNOWN.b ' + hex8(opcode);
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
            ostr2 = 'r' + rs + ', ' + mksigned16h4(imm16)
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
            ostr2 = 'r' + rs + ', r' + rt + ', ' + mksigned16h4(imm16);
            break;
        case 0x05: // BNE
            ostr1 = 'bne';
            ostr2 = 'r' + rs + ', r' + rt + ', ' + mksigned16h4(imm16);
            break;
        case 0x06: // BLEZ
            ostr1 = 'blez';
            ostr2 = 'r' + rs + ', ' + mksigned16h4(imm16)
            break;
        case 0x07: // BGTZ
            ostr1 = 'bgtz';
            ostr2 = 'r' + rs + ', ' + mksigned16h4(imm16)
            break;
        case 0x08: // ADDI
            ostr1 = 'addi';
            ostr2 = 'r' + rt + ', r' + rs + ', ' + mksigned16h(imm16);
            break;
        case 0x09: // ADDIU
            ostr1 = 'addiu';
            ostr2 = 'r' + rt + ', r' + rs + ', ' + mksigned16h(imm16);
            break;
        case 0x0A: // SLTI
            ostr1 = 'setlt slti';
            ostr2 = 'r' + rt + ', r' + rs + ', ' + mksigned16h(imm16)
            break;
        case 0x0B: // SLTIU
            ostr1 = 'setb sltiu';
            ostr2 = 'r' + rt + ', r' + rs + ', ' + mksigned16h(imm16)
            break;
        case 0x0C: // ANDI
            ostr1 = 'andi';
            ostr2 = 'r' + rt + ', r' + rs + ', ' + mksigned16h(imm16);
            break;
        case 0x0D: // ORI
            ostr1 = 'ori';
            ostr2 = 'r' + rt + ', r' + rs + ', ' + mksigned16h(imm16);
            break;
        case 0x0E: // XORI
            ostr1 = 'xori';
            ostr2 = 'r' + rt + ', r' + rs + ', ' + mksigned16h(imm16);
            break;
        case 0x0F: // LUI
            ostr1 = 'lui';
            ostr2 = 'r' + rt + ', ' + mksigned16(imm16) + '0000' + 'h';
            break;
        case 0x13: // COP3
        case 0x12: // COP2
        case 0x11: // COP1
        case 0x10: // COP0
            ostr1 = 'COP' + num;
            break;
        case 0x20: // LB
            ostr1 = 'lb';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x21: // LH
            ostr1 = 'lh';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x22: // LWL
            ostr1 = 'lwl';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x23: // LW
            ostr1 = 'lw';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x24: // LBU
            ostr1 = 'lbu';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x25: // LHU
            ostr1 = 'lhu';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x26: // LWR
            ostr1 = 'lwr';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x28: // SB
            ostr1 = 'sb';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x29: // SH
            ostr1 = 'sh';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x2A: // SWL
            ostr1 = 'swl';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x2B: // SW
            ostr1 = 'sw';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x2E: // SWR
            ostr1 = 'swr';
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x33: // LWC3
        case 0x32: // LWC2
        case 0x31: // LWC1
        case 0x30: // LWC0
            ostr1 = 'lwc' + num;
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
        case 0x3B: // SWC3
        case 0x3A: // SWC2
        case 0x39: // SWC1
        case 0x38: // SWC0
            ostr1 = 'swc' + num;
            ostr2 = 'r' + rt + ', ' + mksigned16h(imm16) + '(r' + rs + ')';
            break;
    }

    while(ostr1.length < 11) {
        ostr1 += ' ';
    }
    
    output.disassembled = ostr1;
    if (ostr2.length > 0) output.disassembled += ' ' + ostr2;
    return output;
}
