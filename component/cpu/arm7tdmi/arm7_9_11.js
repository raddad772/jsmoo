"use strict";

const ARM_MN = Object.freeze({
    Branch: 0, BranchExchangeRegister: 1, DataImmediate: 2, DataImmediateShift: 3, DataRegisterShift: 4,
    LoadImmediate: 5, LoadRegister: 6, MemorySwap: 7, MoveHalfImmediate: 8, MoveHalfRegister: 9,
    MoveImmediateOffset: 10, MoveMultiple: 11, MoveRegisterOffset: 12, MoveToRegisterFromStatus: 13, MoveToStatusFromImmediate: 14,
    MoveToStatusFromRegister: 15, Multiply: 16, MultiplyLong: 17, SoftwareInterrupt: 18, Undefined: 19,
});

const ARM_MN_R = Object.freeze({
    0: 'Branch', 1: 'BranchExchangeRegister', 2: 'DataImmediate', 3: 'DataImmediateShift', 4: 'DataRegisterShift',
    5: 'LoadImmediate', 6: 'LoadRegister', 7: 'MemorySwap', 8: 'MoveHalfImmediate', 9: 'MoveHalfRegister',
    10: 'MoveImmediateOffset', 11: 'MoveMultiple', 12: 'MoveRegisterOffset', 13: 'MoveToRegisterFromStatus', 14: 'MoveToStatusFromImmediate',
    15: 'MoveToStatusFromRegister', 16: 'Multiply', 17: 'MultiplyLong', 18: 'SoftwareInterrupt', 19: 'Undefined',
});

const ARMe = Object.freeze({
    Nonsequential: 1,
    Sequential: 2,
    Prefetch: 4,
    Byte: 8,
    Half: 16,
    Word: 32,
    DoubleWord: 64,
    Load: 128,
    Store: 256,
    Signed: 512
})

class ARM_ins {
    constructor(opcode, func) {
        this.opcode = opcode;
        this.func = func;
    }
}

/**
 * @param {ARMregsbank_t} regs
 * @param {ARMpins_t} pins
 * @param {number} displacement
 * @param {number }link
 */
function ARM_armBranch(regs, pins, displacement, link) {
    if (link) regs.cur[14] = (regs.cur[15] - 4) & 0xFFFFFFFF;
    regs.cur[15] = (regs.cur[15] + (displacement * 4)) & 0xFFFFFFFF;
}

/**
 * @param {ARMregsbank_t} regs
 * @param {ARMpins_t} pins
 * @param {number} arg
 */
function ARM_armBranchExR(regs, pins, arg) {
    let addr = regs.cur[arg];
    regs.CPSR.T = addr & 1;
    regs.cur[15] = addr;
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} source
 * @param {number} modify
 * @param {number} carry
 * @returns {number}
 */
function ARM_ADD(regs, source, modify, carry) {
    let result = (source + modify + carry) & 0xFFFFFFFF;
    if (regs.CPSR.T || (regs.IR & 0x100000)) {
        let overflow = (source ^ modify ^ 0xFFFFFFFF) & (source ^ result);
        regs.CPSR.V = (overflow & 0x80000000) >>> 31; // CHECKTHIS
        regs.CPSR.C = ((overflow ^ source ^ modify ^ result) & 0x80000000) >>> 31;
        regs.CPSR.Z = +(result === 0);
        regs.CPSR.N = (result & 0x80000000) >>> 31;
    }
    return result;
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} source
 * @param {number} shift
 * @returns {number}
 */
function ARM_ASR(regs, source, shift) {
    regs.carry = regs.CPSR.C;
    if (shift === 0) return source;
    regs.carry = (shift > 32) ? ((source & 0x80000000) >>> 31) : (((source & 1) << (shift - 1)));
    return ((source & 0xFFFFFFFF) >> (shift > 31) ? 31 : shift);
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} result
 * @returns {number}
 */
function ARM_BIT(regs, result) {
    if (regs.CPSR.T || (regs.IR & 0x100000)) {
        regs.CPSR.C = regs.carry;
        regs.CPSR.Z = +(result === 0);
        regs.CPSR.N = (result >>> 31) & 1;
    }
    return result;
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} source
 * @param {number} shift
 * @returns {number}
 */
function ARM_LSL(regs, source, shift) {
    regs.carry = regs.CPSR.C;
    if (shift === 0) return source;
    regs.carry = ((shift > 32) ? 0 : ((source & 1) << (32 - shift)));
    return shift > 31 ? 0 : (source << shift);
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} source
 * @param {number} shift
 * @returns {number}
 */
function ARM_LSR(regs, source, shift) {
    regs.carry = regs.CPSR.C;
    if (shift === 0) return source;
    regs.carry = ((shift > 32) ? 0 : (source & (1 << (shift - 1))));
    return shift > 31 ? 0 : (source >>> shift);
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} product
 * @param {number} multiplicand
 * @param {number} multiplier
 * @returns {number}
 */
function ARM_MUL(regs, product, multiplicand, multiplier) {
    product = (product + (multiplicand * multiplier)) & 0xFFFFFFFF;
    if (regs.CPSR.T || (regs.IR & 0x100000)) {
        regs.CPSR.Z = +(product === 0);
        regs.CPSR.N = (product & 0x80000000) >>> 31;
    }
    return product;
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} source
 * @param {number} shift
 * @returns {number}
 */
function ARM_ROR(regs, source, shift) {
    regs.carry = regs.CPSR.C;
    if (shift === 0) return source;
    shift &= 31;
    if (shift) source = ((source << (32 - shift)) | (source >>> shift)) & 0xFFFFFFFF;
    regs.carry = (source & 0x80000000) >>> 31;
    return source;
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} source
 * @returns {number}
 */
function ARM_RRX(regs, source) {
    regs.carry = source & 1;
    return (regs.CPSR.C << 31) | (source >>> 1);
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} source
 * @param {number} modify
 * @param {number} carry
 * @returns {number}
 */
function ARM_SUB(regs, source, modify, carry) {
    return ARM_ADD(regs, source, modify ^ 0xFFFFFFFF, carry);
}

/**
 * @param {ARMregsbank_t} regs
 * @param {number} mode
 * @returns {boolean}
 */
function ARM_TST(regs, mode) {
    switch(mode) {
        case 0: return regs.CPSR.Z === 1;
        case 1: return regs.CPSR.Z === 0;
        case 2: return regs.CPSR.C === 1;
        case 3: return regs.CPSR.C === 0;
        case 4: return regs.CPSR.N === 1;
        case 5: return regs.CPSR.N === 0;
        case 6: return regs.CPSR.V === 1;
        case 7: return regs.CPSR.V === 0;
        case 8: return (regs.CPSR.C === 1) && (regs.CPSR.Z === 0);
        case 9: return (regs.CPSR.C === 0) || (regs.CPSR.Z === 1);
        case 10: return regs.CPSR.N === regs.CPSR.V;
        case 11: return regs.CPSR.N !== regs.CPSR.V;
        case 12: return (regs.CPSR.Z === 0) && (regs.CPSR.N === regs.CPSR.V);
        case 13: return (regs.CPSR.Z === 1) && (regs.CPSR.N !== regs.CPSR.V);
        case 14: return true;
        case 15: return false;
    }
    return undefined;
}

/**
 * @param {ARMregsbank_t} regs
 * @param {ARMpins_t} pins
 * @param {number} mode
 * @param {number} d
 * @param {number} n
 * @param {number} rm
 */
function ARM_armALU(regs, pins, mode, d, n, rm) {
    let rn = regs.cur[n];

    switch(mode) {
        case 0: // AND
            regs.cur[d] = ARM_BIT(regs, rn & rm);
            break;
        case 1: // XOR
            regs.cur[d] = ARM_BIT(regs, rn ^ rm);
            break;
        case 2: // SUB
            regs.cur[d] = ARM_SUB(regs, rn, rm, 1);
            break;
        case 3: // RSB
            regs.cur[d] = ARM_SUB(regs, rm, rn, 1);
            break;
        case 4: // ADD
            regs.cur[d] = ARM_ADD(regs, rn, rm, 0);
            break;
        case 5: // ADC
            regs.cur[d] = ARM_ADD(regs, rn, rm, regs.CPSR.C);
            break;
        case 6: // SBC
            regs.cur[d] = ARM_SUB(regs, rn, rm, regs.CPSR.C);
            break;
        case 7: // RSC
            regs.cur[d] = ARM_SUB(regs, rm, rn, regs.CPSR.C);
            break;
        case 8: // TST
            ARM_BIT(regs, rn & rm);
            break;
        case 9: // TEQ
            ARM_BIT(regs, rn ^ rm);
            break;
        case 10: // CMP
            ARM_SUB(regs, rn, rm, 1);
            break;
        case 11: // CMN
            ARM_ADD(regs, rn, rm, 0);
            break;
        case 12: // ORR
            regs.cur[d] = ARM_BIT(regs, rn | rm);
            break;
        case 13: // MOV
            regs.cur[d] = ARM_BIT(rm);
            break;
        case 14: // BIC
            regs.cur[d] = ARM_BIT(regs, rn & (rm ^ 0xFFFFFFFF));
            break;
        case 15:
            regs.cur[d] = ARM_BIT(rm ^ 0xFFFFFFFF);
            break;
    }
    if (regs.CPSR.exception() && (d === 15) && (regs.IR & 0x100000))
        regs.CPSR = regs.cur[16];
}

/**
 * @param {number} num
 * @returns {number}
 */
function mkunsigned32(num) {
    return (num < 0) ? (0xFFFFFFFF + num) : num;
}

/**
 * @param {ARMregsbank_t} regs
 * @param {ARMpins_t} pins
 * @param {number} immediate
 * @param {number} shift
 * @param {number} d
 * @param {number} n
 * @param {number} save
 * @param {number} mode
 */

function ARM_armDataProcImmediate(regs, pins, immediate, shift, d, n, save, mode) {
    let data = immediate;
    let carry = regs.CPSR.C;
    if (shift) data = ARM_ROR(data, shift * 2);
    ARM_armALU(regs, pins, mode, d, n, data);
}

/**
 * @param {ARMregsbank_t} regs
 * @param {ARMpins_t} pins
 * @param {number} m
 * @param {number} mtype
 * @param {number} shift
 * @param {number} d
 * @param {number} n
 * @param {number} save
 * @param {number} mode
 */
function ARM_armDataProcShift(regs, pins, m, mtype, shift, d, n, save, mode) {
    let rm = regs.cur[m];
    regs.carry = regs.CPSR.C;

    switch(mtype) {
        case 0:
            rm = ARM_LSL(regs, rm, shift);
            break;
        case 1:
            rm = ARM_LSR(regs, rm, shift ? mkunsigned32(shift): 32);
            break;
        case 2:
            rm = ARM_ASR(regs, rm, shift ? mkunsigned32(shift): 32);
            break;
        case 3:
            rm = (shift !== 0) ? ARM_ROR(regs, rm, shift) : ARM_RRX(regs, rm);
            break;
    }

    ARM_armALU(regs, pins, mode, d, n, rm);
}

/**
 * @param {ARMregsbank_t} regs
 * @param {ARMpins_t} pins
 * @param {number} m
 * @param {number} mtype
 * @param {number} s
 * @param {number} d
 * @param {number} n
 * @param {number} save
 * @param {number} mode
 */
function ARM_armDataProcReg(regs, pins, m, mtype, s, d, n, save, mode) {
    let rs = (regs.cur[s] + (s === 15 ? 4 : 0)) & 0xFF;
    let rm = (regs.cur[m] + (m === 15 ? 4 : 0)) & 0xFFFFFFFF;
    regs.carry = regs.CPSR.C;

    switch(mtype) {
        case 0:
            rm = ARM_LSL(regs, rm, rs < 33 ? rs : 33);
            break;
        case 1:
            rm = ARM_LSR(regs, rm, rs < 33 ? rs : 33);
            break;
        case 2:
            rm = ARM_ASR(rm, rs < 32 ? rs : 32);
            break;
        case 3:
            if (rs) rm = ARM_ROR(regs, rs & 31 ? (rs & 31) : 32);
            break;
    }

    ARM_armALU(regs, pins, mode, d, n, rm);
}

/**
 * @param {ARMregsbank_t} regs
 * @param {ARMpins_t} pins
 * @param {number} immediate
 * @param {number} half
 * @param {number} d
 * @param {number} n
 * @param {number} writeback
 * @param {number} up
 * @param {number} pre
 */
function ARM_armLoadImmediate(regs, pins, immediate, half, d, n, writeback, up, pre) {
    switch(regs.TCU) {
        case 1:
            regs.rn = regs.cur[n];
            regs.rd = regs.cur[d];

            if (pre === 1) regs.rn = (up ? (regs.rn + immediate) : (regs.rn - immediate)) & 0xFFFFFFFF;
            regs.addr = regs.rn;
            regs.mode = (half ? ARMe.Half : ARMe.Byte) | ARMe.Nonsequential | ARMe.Signed;
            regs.pipe.nonsequential = true;
            pins.Addr = regs.addr;
            pins.get_hint = regs.mode;
            regs.reenter = 2;
            break;
        case 2:
            regs.reenter = 0;
            regs.word = pins.D;
            if (regs.mode & ARMe.Half) {
                regs.addr &= 1;
                regs.word = (regs.mode & ARMe.Signed) ? mksigned16(word) : mkunsigned16(word);
            }
            if (regs.mode & ARMe.Byte) {
                regs.addr = 0;
                regs.word = (regs.mode & ARMe.Signed) ? mksigned8(word) : mkunsigned8(word);
            }
            if (regs.mode & ARMe.Signed)
                regs.word = ARM_ASR(regs, regs.word, (regs.addr & 3) << 3);
            else
                regs.word = ARM_ROR(regs, regs.word, (regs.addr & 3) << 3);
            regs.rd = regs.word;
            if (pre === 0) regs.rn = (up ? (regs.rn + immediate) : (regs.rn - immediate)) & 0xFFFFFFFF;
            if ((pre === 0) || writeback) regs.cur[n] = regs.rn;
            regs.cur[d] = regs.rd;
            break;
    }
}

function ARM_fill_opcodes(variant) {
    /*
    Data Processing/PSR

    Bits 27-20 and 7-4

    000. .... ...0 DataProc
    000. .... 0..1 DataProc
    001. .... .... DataProc
    0011 0010 .... ARM11: Hint
    0011 0.10 .... PSR Imm
    0001 0..0 0000 PSR Reg
    0001 0010 00.1 BX,BLX
    0001 0010 0111 ARM9: BKPT (cond=1110)
    0001 0110 0001 ARM9: CLZ
    0001 0..0 0101 ARM9: QALU
    0000 00.. 1001 Multiply
    0000 0100 1001 ARM11: UMAAL
    0000 1... 1001 MulLong
    0001 0..0 1..0 ARM9: MulHalf
    0001 0.00 1001 TransSwp12
    0001 1... 1001 ARM11: LDREX
    000. .0.. 1..1 TransReg10
    000. .1.. 1..1 TransImm10
    010. .... .... TransImm9
    011. .... ...0 TransReg9
    011. .... ...1 ARM11: Media
    0101 0111 0001 ARM11: CLREX (cond=1111)
    100. .... .... BlockTrans
    101. .... .... B,BL,BLX
    1100 010. .... ARM9: CoRR
    110. .... .... CoDataTrans
    1110 .... ...0 CoDataOp
    1110 .... 0001 CoRegTrans
    1111 .... .... SWI

    --- ARM11 SIMD
    0110 .... ...1 ARM11: ParaAddSub
    0110 1000 ..01 ARM11: HalfPack
    0110 1.1. ..01 ARM11: WordSat
    0110 1.10 0011 ARM11: ParaHalfSat
    0110 1011 0011 ARM11: RevWord
    0110 1011 1011 ARM11: RevPackHalf
    0110 1111 1011 ARM11: RevSignHalf
    0110 1000 1011 ARM11: SelectBytes
    0110 1... 0111 ARM11: Extend U/S
    0111 0... ...1 ARM11: Multiplies
    0111 1000 0001 ARM11: DiffSum
    0111 1000 0001 ARM11: DiffSumAcc
     */
    let ARMtable = new Array(4096); // 12 bits table. bits 27...20 and 7...4 is enough to differentiate
    let THUMBtable = new Array(65536); // Just straight-up decode THUMB

    let bind_table = ARMtable;

    function bind(opcodei, func) {
        if (typeof bind_table[opcodei] !== 'undefined') {
            console.log('HMM?');
            debugger;
            return;
        }
        bind_table[opcodei] = new ARM_ins(opcodei, func);
    }

    let opcode;
    // BR, BRL
    for (let dhi = 0; dhi < 16; dhi++) {
        for (let dlo = 0; dlo < 16; dlo++) {
            for (let link = 0; link < 2; link++) {
                bind(0xA00 | (link << 8) | (dhi << 4) | dlo,
                    function (opcode, regs, pins) {
                        ARM_armBranch(regs, pins,
                            opcode & 0xFFF,
                            (opcode >>> 24) & 1);
                    })
            }
        }
    }

    bind(0b0001_0010_0001, function (opcode, regs, pins) {
        ARM_armBranchExR(regs, pins, opcode & 15)
    });

    for (let save = 0; save < 2; save++) {
        for (let mode = 0; mode < 16; mode++) {
            for (let shift = 0; shift < 16; shift++) {
                if ((!save) && (mode >= 8) && (mode <= 11)) continue; // CMP, CMN, TST, and TEQ
                bind(0x200 | (shift << 4) | (save << 20) | (mode << 21),
                    function (opcode, regs, pins) {
                        ARM_armDataProcImmediate(regs, pins,
                            opcode & 0xFF,
                            (opcode >>> 8) & 0x0F,
                            (opcode >>> 12) & 0x0F,
                            (opcode >>> 16) & 0x0F,
                            (opcode >>> 20) & 1,
                            (opcode >>> 21) & 0x0F);
                    })
            }
        }
    }

    for (let save = 0; save < 2; save++) {
        for (let mtype = 0; mtype < 4; mtype++) {
            for (let shift = 0; shift < 2; shift++) {
                for (let mode = 0; mode < 16; mode++) {
                    if ((!save) && (mode >= 8) && (mode <= 11)) continue; // CMP, CMN, TST, and TEQ
                    bind(0 | (mtype << 5) | (shift << 7) | (save << 20) | mode << 21,
                        function (opcode, regs, pins) {
                            ARM_armDataProcShift(regs, pins,
                                opcode & 0x0F,
                                (opcode >>> 5) & 3,
                                (opcode >>> 7) & 0x1F,
                                (opcode >>> 12) & 0x0F,
                                (opcode >>> 16) & 0x0F,
                                (opcode >>> 20) & 1,
                                (opcode >>> 21) & 0x0F)
                        })
                }
            }
        }
    }

    for (let save = 0; save < 2; save++) {
        for (let mode = 0; mode < 16; mode++) {
            for (let mtype = 0; mtype < 4; mtype++) {
                if ((!save) && (mode >= 8) && (mode <= 11)) continue; // CMP, CMN, TST, and TEQ
                bind(1 | (mtype << 5) | (save << 20) | (mode << 21),
                    function (opcode, regs, pins) {
                        ARM_armDataProcReg(regs, pins,
                            opcode & 0x0F,
                            (opcode >>> 5) & 3,
                            (opcode >>> 8) & 0x0F,
                            (opcode >>> 12) & 0x0F,
                            (opcode >>> 16) & 0x0F,
                            (opcode >>> 20) & 1,
                            (opcode >>> 21) & 0x0F
                        );
                    })
            }
        }
    }

    for (let w = 0; w < 2; w++) {
        for (let p = 0; p < 2; p++) {
            for (let wb = 0; wb < 2; wb++) {
                for (let h = 0; h < 2; h++) {
                    bind(0x50D | (h << 5) | (wb << 21) | (p << 23) | (w << 24),
                        function (opcode, regs, pins) {
                            ARM_armLoadImmediate(regs, pins,
                                (opcode & 0x0F) | ((opcode >>> 4) & 0xF0),
                                (opcode >>> 5) & 1,
                                (opcode >>> 12) & 0x0F,
                                (opcode >>> 16) & 0x0F,
                                (opcode >>> 21) & 1,
                                (opcode >>> 23) & 1,
                                (opcode >>> 24) & 1
                            );
                        })
                }
            }
        }

    }
}

let ARM7_armopcodes = [];
let ARM7_thumbopcodes = [];


class ARMpins_t {
    constructor() {
        this.D = 0;
        this.Addr = 0;

        this.RW = 0;
        this.MREQ = 0; // Memory request
        this.SEQ = 0; // Sequential
                      // Truth table fo these

        this.get_hint = 0; // Hint for get function speedup
        //      MREQ
        //      0   1
        //S  0  I   N
        //E
        //Q  1  C   S

    }
}

