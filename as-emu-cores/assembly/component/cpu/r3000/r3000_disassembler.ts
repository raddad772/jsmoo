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

import {hex2, hex4, hex5, hex8, mksigned16h, mksigned16h4} from "../../../helpers/helpers";

export enum R3000_reg {
    zero, at, v0, v1, a0, a1, a2, a3,
    t0, t1, t2, t3, t4, t5, t6, t7,
    s0, s1, s2, s3, s4, s5, s6, s7,
    t8, t9, k0, k1, gp, sp, fp, ra
}

/*
  cop2r0-1   3xS16 VXY0,VZ0              Vector 0 (X,Y,Z)
  cop2r2-3   3xS16 VXY1,VZ1              Vector 1 (X,Y,Z)
  cop2r4-5   3xS16 VXY2,VZ2              Vector 2 (X,Y,Z)
  cop2r6     4xU8  RGBC                  Color/code value
  cop2r7     1xU16 OTZ                   Average Z value (for Ordering Table)
  cop2r8     1xS16 IR0                   16bit Accumulator (Interpolate)
  cop2r9-11  3xS16 IR1,IR2,IR3           16bit Accumulator (Vector)
  cop2r12-15 6xS16 SXY0,SXY1,SXY2,SXYP   Screen XY-coordinate FIFO  (3 stages)
  cop2r16-19 4xU16 SZ0,SZ1,SZ2,SZ3       Screen Z-coordinate FIFO   (4 stages)
  cop2r20-22 12xU8 RGB0,RGB1,RGB2        Color CRGB-code/color FIFO (3 stages)
  cop2r23    4xU8  (RES1)                Prohibited
  cop2r24    1xS32 MAC0                  32bit Maths Accumulators (Value)
  cop2r25-27 3xS32 MAC1,MAC2,MAC3        32bit Maths Accumulators (Vector)
  cop2r28-29 1xU15 IRGB,ORGB             Convert RGB Color (48bit vs 15bit)
  cop2r30-31 2xS32 LZCS,LZCR             Count Leading-Zeroes/Ones (sign bits
 */

/*
 cop2r32-36 9xS16 RT11RT12,..,RT33 Rotation matrix     (3x3)        ;cnt0-4
  cop2r37-39 3x 32 TRX,TRY,TRZ      Translation vector  (X,Y,Z)      ;cnt5-7
  cop2r40-44 9xS16 L11L12,..,L33    Light source matrix (3x3)        ;cnt8-12
  cop2r45-47 3x 32 RBK,GBK,BBK      Background color    (R,G,B)      ;cnt13-15
  cop2r48-52 9xS16 LR1LR2,..,LB3    Light color matrix source (3x3)  ;cnt16-20
  cop2r53-55 3x 32 RFC,GFC,BFC      Far color           (R,G,B)      ;cnt21-23
  cop2r56-57 2x 32 OFX,OFY          Screen offset       (X,Y)        ;cnt24-25
  cop2r58 BuggyU16 H                Projection plane distance.       ;cnt26
  cop2r59      S16 DQA              Depth queing parameter A (coeff) ;cnt27
  cop2r60       32 DQB              Depth queing parameter B (offset);cnt28
  cop2r61-62 2xS16 ZSF3,ZSF4        Average Z scale factors          ;cnt29-30
  cop2r63      U20 FLAG             Returns any calculation errors   ;cnt31
 */
export enum GTE_reg {
    VXY0, VZ0, VXY1, VZ1, VXY2, VZ2,
    RGBC, OTZ, IR0, IR1, IR2, IR3,
    SXY, SXY1, SXY2, SXYP,
    SZ0, SZ1, SZ2, SZ3,
    RGB0, RGB1, RGB2,
    RES1, MAC0, MAC1, MAC2, MAC3,
    IRGB, ORGB,
    LZCS, LZCR,
    RT11RT12, RT13RT21,
    RT22RT23, RT31RT32,
    RT33, // returns sign-extended 32-bit
    TRX, TRY, TRZ,
    L11L12, L13L21,
    L22L23, L31L32,
    L33,
    RBK, GBK, BBK,
    LR1LR2, LR3LG1,
    LG2LG3, LB1LB2,
    LB3, // returns sign-extended 32-bit
    RFC, GFC, BFC,
    OFX, OFY,
    H, DQA, DQB,
    ZSF3, ZSF4,
    FLAG
}

export function GTE_reg_alias(reg: i32): string {
    switch(reg) {
        case 0: return 'VXY0'
        case 1: return 'VZ0'
        case 2: return 'VXY1'
        case 3: return 'VZ1'
        case 4: return 'VXY2'
        case 5: return 'VZ2'
        case 6: return 'RGBC'
        case 7: return 'OTZ'
        case 8: return 'IR0'
        case 9: return 'IR1'
        case 10: return 'IR2'
        case 11: return 'IR3'
        case 12: return 'SXY0'
        case 13: return 'SXY1'
        case 14: return 'SXY2'
        case 15: return 'SXYP'
        case 16: return 'SZ0'
        case 17: return 'SZ1'
        case 18: return 'SZ2'
        case 19: return 'SZ3'
        case 20: return 'RGB0'
        case 21: return 'RGB1'
        case 22: return 'RGB2'
        case 23: return 'RES1'
        case 24: return 'MAC0'
        case 25: return 'MAC1'
        case 26: return 'MAC2'
        case 27: return 'MAC3'
        case 28: return 'IRGB'
        case 29: return 'ORGB'
        case 30: return 'LZCS'
        case 31: return 'LZCR'
        case 32: return 'RT11RT12'
        case 33: return 'RT13RT21'
        case 34: return 'RT22RT23'
        case 35: return 'RT31RT32'
        case 36: return 'RT33'
        case 37: return 'TRX'
        case 38: return 'TRY'
        case 39: return 'TRZ'
        case 40: return 'L11L12'
        case 41: return 'L13L21'
        case 42: return 'L22L23'
        case 43: return 'L31L32'
        case 44: return 'L33'
        case 45: return 'RBK'
        case 46: return 'GBK'
        case 47: return 'BBK'
        case 48: return 'LR1LR2'
        case 49: return 'LR3LG1'
        case 50: return 'LG2LG3'
        case 51: return 'LB1LB2'
        case 52: return 'LB3'
        case 53: return 'RFC'
        case 54: return 'GFC'
        case 55: return 'BFC'
        case 56: return 'OFX'
        case 57: return 'OFY'
        case 58: return 'H'
        case 59: return 'DQA'
        case 60: return 'DQB'
        case 61: return 'ZSF3'
        case 62: return 'ZSF4'
        case 63: return 'FLAG'
        default: return 'UNKNOWN REG'
    }
}

export enum R3000_COP0_reg {
    PRId = 15,
    SR = 12,
    Cause = 13,
    EPC = 14,
    BadVaddr = 8,
    Config = 3,
    BusCtrl = 2,
    PortSize = 10,
    Count = 9,
    Compare = 11
}


function R3000_reg_alias(reg: u32): string {
    switch(reg) {
        case 0: return 'r0'
        case 1: return 'at'
        case 2: return 'v0'
        case 3: return 'v1'
        case 4: return 'a0'
        case 5: return 'a1'
        case 6: return 'a2'
        case 7: return 'a3'
        case 8: return 't0'
        case 9: return 't1'
        case 10: return 't2'
        case 11: return 't3'
        case 12: return 't4'
        case 13: return 't5'
        case 14: return 't6'
        case 15: return 't7'
        case 16: return 's0'
        case 17: return 's1'
        case 18: return 's2'
        case 19: return 's3'
        case 20: return 's4'
        case 21: return 's5'
        case 22: return 's6'
        case 23: return 's7'
        case 24: return 't8'
        case 25: return 't9'
        case 26: return 'k0'
        case 27: return 'k1'
        case 28: return 'gp'
        case 29: return 'sp'
        case 30: return 'fp'
        case 31: return 'ra'
        default: return 'UNKNOWN REG';
    }
}


function R3000_disassemble_GTE(opcode: u32): string {
    let sf: u32 = (opcode >>> 19) & 1;
    /*let MVMAmul_matrix = (opcode >>> 17) & 3;
    let MVMAmul_vector = (opcode >>> 15) & 3;
    let MVMAtrans_vector = (opcode >>> 13) & 3;
    let lm = (opcode >>> 10) & 1;
    let gte = opcode & 0x3F;*/
    switch(opcode & 0x3F) {
        case 0x00: // N/A
            return 'GTE NA0';
        case 0x01: //
            return 'RTPS';
        case 0x06:
            return 'NCLIP';
        case 0x0C:
            return 'OP(' + sf.toString() + ')';
        case 0x10:
            return 'DPCS';
        case 0x11:
            return 'INTPL';
        case 0x12:
            return 'MVMVA';
        case 0x13:
            return 'NCDS';
        case 0x14:
            return 'CDP';
        case 0x16:
            return 'NCDT';
        case 0x1B:
            return 'NCCS';
        case 0x1C:
            return 'CC';
        case 0x1E:
            return 'NCS';
        case 0x20:
            return 'NCT';
        case 0x28:
            return 'SQRT(' + sf.toString() + ')';
        case 0x29:
            return 'DCPL';
        case 0x2A:
            return 'DPCT';
        case 0x2D:
            return 'AVSZ3';
        case 0x2E:
            return 'AVSZ4';
        case 0x30:
            return 'RTPT';
        case 0x3D:
            return 'GPF(' + sf.toString() + ')5';
        case 0x3E:
            return 'GPL(' + sf.toString() + ')5';
        case 0x3F:
            return 'NCCT';
        default:
            return 'GTE NA' + (opcode & 0x0F).toString(16).toUpperCase();
    }
}

function R3000_disassemble_COP(opcode: u32): string {
    let ostr: string = '';
    let opc: u32 = (opcode >>> 28) & 15;
    let copnum: u32 = (opcode >>> 26) & 3;
    let bit25: u32 = (opcode >>> 25) & 1;
    let bits5: u32 = (opcode >>> 21) & 0x1F;
    let rt: u32 = (opcode >>> 16) & 0x1F;
    let rd: u32 = (opcode >>> 11) & 0x1F;
    let rs: u32 = (opcode >>> 21) & 0x1F;
    let imm16: u32 = (opcode & 0xFFFF)>>>0;
    let imm25: u32 = (opcode & 0x1FFFFFF)>>>0;
    if (copnum === 2) {
        return R3000_disassemble_GTE(opcode);
    }
    switch(opc) {
        case 4: //
            switch(bit25) {
                case 0:
                    switch(bits5) {
                        case 0: // MFCN rt, rd
                            return 'MFC' + copnum.toString() + ' ' + R3000_reg_alias(rt) + ', COP' + copnum.toString() + 'd' + rd;
                        case 2: // CFCn rt, rd
                            return 'CFC' + copnum.toString() + ' ' + R3000_reg_alias(rt) + ', COP' + copnum.toString() + 'c' + rd;
                        case 4: // MTCn rt, rd
                            return 'MTC' + copnum.toString() + ' COP' + copnum.toString() + 'd' + rd + ', ' + R3000_reg_alias(rt);
                        case 5: // CTCn rt, rd
                            return 'CTC' + copnum.toString() + ' COP' + copnum.toString() + 'c' + rd + ', ' + R3000_reg_alias(rt);
                        case 8: // rt=0 BCnF, rt=1 BCnT
                            if (rt === 0)
                                return 'BC' + copnum.toString() + 'F ' + mksigned16h4(imm16);
                            else
                                return 'BC' + copnum.toString() + 'T ' + mksigned16h4(imm16);
                        default:
                            console.log('BAD COP INSTRUCTION! ' + hex8(opcode));
                            return 'BADCOP8';
                    }
                case 1: // // Immediate 25-bit or some COP0 instructions
                    if ((bits5 === 0x10) && (copnum === 0)) {
                        switch(opcode & 0x1F) {
                            case 1:
                                return 'TLBR';
                            case 2:
                                return 'TLBWI';
                            case 6:
                                return 'TLBWR';
                            case 8:
                                return 'TLBP';
                            case 0x10:
                                return 'RFE';
                            default:
                                console.log('BAD COP0 INSTRUCTION! ' + hex8(opcode));
                                return 'BADCOP0';
                        }
                    }
                    return 'COP' + copnum.toString() + ' ' + hex4(imm25) + ', ' + bits5;
            }
            console.log('SHOULD NOT REACH HERE');
            return 'COPWHAT?';
        case 0x0C: // LWCn rt_dat, [rs+imm]
            return 'LWC' + copnum.toString() + ' COP' + copnum.toString() + 'd' + rt +', [' + R3000_reg_alias(rs) + mksigned16h4(imm16) +' ]';
        case 0x0E: // SWCn rt_dat, [rs+imm]
            return 'SWC' + copnum.toString() + ' COP' + copnum.toString() + 'd' + rt +', [' + R3000_reg_alias(rs) + mksigned16h4(imm16) +' ]';
        default:
            console.log('BAD COP? INSTRUCTION! ' + hex8(opcode));
            return 'UNKNOWN COP INS!'
    }
}

export function R3000_disassemble(opcode: u32): string {
    let output: string = '';
    let ostr1 = '', ostr2 = '';

    let p_op = (opcode >>> 26) & 63;
    let s_op = opcode & 63;
    let imm16 = opcode & 0xFFFF;
    let rs = (opcode >>> 21) & 31;
    let rt = (opcode >>> 16) & 31;
    let rd = (opcode >>> 11) & 31;
    let imm5 = (opcode >>> 6) & 31;
    let num = p_op & 3;

    if (opcode === 0)
        return 'nop        ';

    switch(p_op) {
        case 0x00: // SPECIAL
            switch(s_op) {
                case 0x00: // SLL
                    ostr1 = 'sll';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt) + ', ' + imm5.toString()
                    break;
                case 0x02: // SRL
                    ostr1 = 'srl';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt) + ', ' + imm5.toString()
                    break;
                case 0x03: // SRA
                    ostr1 = 'sra';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt) + ', ' + imm5.toString()
                    break;
                case 0x04: // SLLV
                    ostr1 = 'sllv';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs);
                    break;
                case 0x06: // SRLV
                    ostr1 = 'srlv';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs);
                    break;
                case 0x07: // SRAV
                    ostr1 = 'srav';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs);
                    break;
                case 0x08: // JR
                    ostr1 = 'jr';
                    ostr2 = R3000_reg_alias(rs);
                    break;
                case 0x09: // JALR
                    ostr1 = 'jalr'
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rd);
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
                    ostr2 = R3000_reg_alias(rd);
                    break;
                case 0x11: // MTHI
                    ostr1 = 'mthi';
                    ostr2 = R3000_reg_alias(rs);
                    break;
                case 0x12: // MFLO
                    ostr1 = 'mfhi';
                    ostr2 = R3000_reg_alias(rd);
                    break;
                case 0x13: // MTLO
                    ostr1 = 'mfhi';
                    ostr2 = R3000_reg_alias(rs);
                    break;
                case 0x18: // MULT
                    ostr1 = 'mult';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x19: // MULTU
                    ostr1 = 'multu';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x1A: // DIV
                    ostr1 = 'div';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x1B: // DIVU
                    ostr1 = 'divu';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x20: // ADD
                    ostr1 = 'add';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x21: // ADDU
                    ostr1 = 'addu';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x22: // SUB
                    ostr1 = 'sub';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x23: // SUBU
                    ostr1 = 'subu';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x24: // AND
                    ostr1 = 'and';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x25: // OR
                    ostr1 = 'or';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x26: // XOR
                    ostr1 = 'xor';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x27: // NOR
                    ostr1 = 'nor';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x2A: // SLT
                    ostr1 = 'slt';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
                    break;
                case 0x2B: // SLTU
                    ostr1 = 'sltu';
                    ostr2 = R3000_reg_alias(rd) + ', ' + R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt);
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
            ostr2 = R3000_reg_alias(rs) + ', ' + mksigned16h4(imm16)
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
            ostr2 = R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt) + ', ' + mksigned16h4(imm16);
            break;
        case 0x05: // BNE
            ostr1 = 'bne';
            ostr2 = R3000_reg_alias(rs) + ', ' + R3000_reg_alias(rt) + ', ' + mksigned16h4(imm16);
            break;
        case 0x06: // BLEZ
            ostr1 = 'blez';
            ostr2 = R3000_reg_alias(rs) + ', ' + mksigned16h4(imm16)
            break;
        case 0x07: // BGTZ
            ostr1 = 'bgtz';
            ostr2 = R3000_reg_alias(rs) + ', ' + mksigned16h4(imm16)
            break;
        case 0x08: // ADDI
            ostr1 = 'addi';
            ostr2 = R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs) + ', ' + mksigned16h(imm16);
            break;
        case 0x09: // ADDIU
            ostr1 = 'addiu';
            ostr2 = R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs) + ', ' + mksigned16h(imm16);
            break;
        case 0x0A: // SLTI
            ostr1 = 'setlt slti';
            ostr2 = R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs) + ', ' + mksigned16h(imm16)
            break;
        case 0x0B: // SLTIU
            ostr1 = 'setb sltiu';
            ostr2 = R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs) + ', ' + mksigned16h(imm16)
            break;
        case 0x0C: // ANDI
            ostr1 = 'andi';
            ostr2 = R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs) + ', ' + mksigned16h(imm16);
            break;
        case 0x0D: // ORI
            ostr1 = 'ori';
            ostr2 = R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs) + ', ' + mksigned16h(imm16);
            break;
        case 0x0E: // XORI
            ostr1 = 'xori';
            ostr2 = R3000_reg_alias(rt) + ', ' + R3000_reg_alias(rs) + ', ' + hex4(imm16);
            break;
        case 0x0F: // LUI
            ostr1 = 'lui';
            ostr2 = R3000_reg_alias(rt) + ', ' + hex4(imm16) + '0000' + 'h';
            break;
        case 0x13: // COP3
        case 0x12: // COP2
        case 0x11: // COP1
        case 0x10: // COP0
            ostr1 = R3000_disassemble_COP(opcode);
            break;
        case 0x20: // LB
            ostr1 = 'lb';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x21: // LH
            ostr1 = 'lh';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x22: // LWL
            ostr1 = 'lwl';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x23: // LW
            ostr1 = 'lw';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x24: // LBU
            ostr1 = 'lbu';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x25: // LHU
            ostr1 = 'lhu';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x26: // LWR
            ostr1 = 'lwr';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x28: // SB
            ostr1 = 'sb';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x29: // SH
            ostr1 = 'sh';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x2A: // SWL
            ostr1 = 'swl';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x2B: // SW
            ostr1 = 'sw';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x2E: // SWR
            ostr1 = 'swr';
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x33: // LWC3
        case 0x32: // LWC2
        case 0x31: // LWC1
        case 0x30: // LWC0
            ostr1 = 'lwc' + num;
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
        case 0x3B: // SWC3
        case 0x3A: // SWC2
        case 0x39: // SWC1
        case 0x38: // SWC0
            ostr1 = 'swc' + num;
            ostr2 = R3000_reg_alias(rt) + ', ' + mksigned16h(imm16) + '(' + R3000_reg_alias(rs) + ')';
            break;
    }

    while(ostr1.length < 11) {
        ostr1 += ' ';
    }

    output = ostr1;
    if (ostr2.length > 0) output += ' ' + ostr2;
    return output;
}
