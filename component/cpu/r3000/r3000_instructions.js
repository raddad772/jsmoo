"use strict";

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fNA(opcode,op, core) {
    console.log('BAD INSTRUCTION', hex8(opcode));
}


/**

 * @param {R3000} core
 * @param {number} new_addr
 * @param {boolean} doit
 * @param {boolean} link
 * @param {number} link_reg
 */
function R3000_branch(core, new_addr, doit, link, link_reg= 31) {
    if (doit)
        core.pipe.get_next().new_PC = new_addr>>>0;
    if (link)
        R3000_fs_reg_write(core, link_reg, ((core.regs.PC+4)&0xFFFFFFFF)>>>0);
}


/**

 * @param {R3000} core
 * @param {number} target
 * @param {number} value
 */
function R3000_fs_reg_write(core, target, value) {
    core.regs.R[target] = (value & 0xFFFFFFFF)>>>0;
    //if ((value>>>0) === 0xFFFFFE3A) dbg.break();

    if (core.trace_on) core.debug_reg_list.push(target);

    let p = core.pipe.current;

    if (p.target === target) p.target = -1;
}

/**
 * @param {R3000} core
 * @param {number} target
 **/
function R3000_fs_reg_delay_read(core, target, value) {
    let p = core.pipe.current;

    if (p.target === target) {
        p.target = -1;
        return p.value;
    }
    else {
        return core.regs.R[target];
    }
}

/**
 * @param {R3000} core
 * @param {number} target
 * @param {number} value
 */
function R3000_fs_reg_delay(core, target, value) {
    let p = core.pipe.get_next();

    p.target = target;
    p.value = (value & 0xFFFFFFFF)>>>0;
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fBcondZ(opcode,op, core) {
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
            take = (core.regs.R[rs] & 0xFFFFFFFF) < 0;
            break;
        case 1: // BGEZ
            take = (core.regs.R[rs] & 0xFFFFFFFF) >= 0;
            break;
        case 0x10: // BLTZAL
            take = (core.regs.R[rs] & 0xFFFFFFFF) < 0;
            R3000_fs_reg_write(core, R3000_reg.ra, core.regs.PC+4);
            break;
        case 0x11: // BGEZAL
            take = (core.regs.R[rs] & 0xFFFFFFFF) >= 0;
            R3000_fs_reg_write(core, R3000_reg.ra, core.regs.PC+4);
            break;
        default:
            console.log('Bad B..Z instruction!', hex8(opcode));
            return;
    }
    R3000_branch(core,
        (core.regs.PC + (mksigned16(imm) * 4)) & 0xFFFFFFFF,
        take,
        false
        )
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fJ(opcode,op, core) {
/*
  00001x | <---------immediate26bit---------> | j/jal
  */
    R3000_branch(core,
        ((core.regs.PC & 0xF0000000) + ((opcode & 0x3FFFFFF) << 2)) & 0xFFFFFFFF,
        true,
        false);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fJAL(opcode,op, core) {
/*
  00001x | <---------immediate26bit---------> | j/jal
  */
    R3000_branch(core,
        ((core.regs.PC & 0xF0000000) + ((opcode & 0x3FFFFFF) << 2)) & 0xFFFFFFFF,
        true,
        true);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fJR(opcode,op, core)
{
    let rs = (opcode >>> 21) & 0x1F;
    R3000_branch(core,
        core.regs.R[rs],
        true,
        false);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fJALR(opcode,op, core)
{
    let rs = (opcode >>> 21) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    R3000_branch(core, core.regs.R[rs], true, true, rd)
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fBEQ(opcode,op, core) {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(core,
        (core.regs.PC + (mksigned16(opcode & 0xFFFF)*4)) & 0xFFFFFFFF,
        (core.regs.R[(opcode >>> 21) & 0x1F]>>>0) === (core.regs.R[(opcode >>> 16) & 0x1F]>>>0),
        false);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fBNE(opcode,op, core) {
    // 00010x | rs   | rt   | <--immediate16bit--> |\
    R3000_branch(core,
        (core.regs.PC + (mksigned16(opcode & 0xFFFF)*4)) & 0xFFFFFFFF,
        (core.regs.R[(opcode >>> 21) & 0x1F]>>>0) !== (core.regs.R[(opcode >>> 16) & 0x1F]>>>0),
        false);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fBLEZ(opcode,op, core) {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(core,
        (core.regs.PC + (mksigned16(opcode & 0xFFFF)*4)) & 0xFFFFFFFF,
        (core.regs.R[(opcode >>> 21) & 0x1F] & 0xFFFFFFFF) <= 0,
        false)
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fBGTZ(opcode,op, core) {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(core,
        (core.regs.PC + (mksigned16(opcode & 0xFFFF)*4)) & 0xFFFFFFFF,
        (core.regs.R[(opcode >>> 21) & 0x1F] & 0xFFFFFFFF) > 0,
        false)
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fADDI(opcode,op, core) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm = ((opcode & 0xFFFF) << 16) >> 16;

    // TODO: add overflow trap
    R3000_fs_reg_write(core, rt, (core.regs.R[rs] + imm) & 0xFFFFFFFF);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fADDIU(opcode,op, core) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm = ((opcode & 0xFFFF) << 16) >> 16;

    R3000_fs_reg_write(core, rt, (core.regs.R[rs] + imm) & 0xFFFFFFFF);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fADD(opcode,op, core) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    // TODO: add overflow trap
    R3000_fs_reg_write(core, rd, core.regs.R[rs] + core.regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fADDU(opcode,op, core) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rs] + core.regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSUB(opcode,op, core) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    // TODO: add overflow trap
    R3000_fs_reg_write(core, rd, ((core.regs.R[rs] & 0xFFFFFFFF) - (core.regs.R[rt] & 0xFFFFFFFF)) >>> 0);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSUBU(opcode,op, core) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, ((core.regs.R[rs] & 0xFFFFFFFF) - (core.regs.R[rt] & 0xFFFFFFFF)) >>> 0);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fAND(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rs] & core.regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fANDI(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = (opcode & 0xFFFF);

    R3000_fs_reg_write(core, rt, imm16 & core.regs.R[rs]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fORI(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = (opcode & 0xFFFF) >>> 0;

    R3000_fs_reg_write(core, rt, imm16 | core.regs.R[rs]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fXORI(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = (opcode & 0xFFFF) >>> 0;

    R3000_fs_reg_write(core, rt, imm16 ^ core.regs.R[rs]);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fOR(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rs] | core.regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fXOR(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rs] ^ core.regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fNOR(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    // ((regs.R[rs] | regs.R[rt]) ^ 0xFFFFFFFF)>>> 0
    R3000_fs_reg_write(core, rd, ((core.regs.R[rs] | core.regs.R[rt]) ^ 0xFFFFFFFF)>>> 0);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSLT(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, +((core.regs.R[rs] & 0xFFFFFFFF) < (core.regs.R[rt] & 0xFFFFFFFF)));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSLTU(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, +((core.regs.R[rs] >>> 0) < (core.regs.R[rt] >>> 0)));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSLTI(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = ((opcode & 0xFFFF) << 16) >> 16; // sign-extend

    R3000_fs_reg_write(core, rt, +((core.regs.R[rs] & 0xFFFFFFFF) < imm16));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSLTIU(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = ((opcode & 0xFFFF) << 16) >> 16; // sign-extend

    // unary operator converts to 0/1
    R3000_fs_reg_write(core, rt, +((core.regs.R[rs] >>> 0) < (imm16 >>> 0)));
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSLLV(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] << (core.regs.R[rs] & 0x1F));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSRLV(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] >>> (core.regs.R[rs] & 0x1F));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSRAV(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] >> (core.regs.R[rs] & 0x1F));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSLL(opcode,op, core) {
    if (opcode === 0) {
        return;
    }
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let imm5 = (opcode >>> 6) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] << imm5);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSRL(opcode,op, core) {
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let imm5 = (opcode >>> 6) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] >>> imm5);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSRA(opcode,op, core) {
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let imm5 = (opcode >>> 6) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] >> imm5);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fLUI(opcode,op, core) {
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = opcode & 0xFFFF;

    R3000_fs_reg_write(core, rt, (imm16 << 16)>>>0);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fMFHI(opcode,op, core) {
    let rd = (opcode >>> 11) & 0x1F;

    // TODO: add delay here until core.multiplier.clock_end
    core.multiplier.finish();
    R3000_fs_reg_write(core, rd, core.multiplier.HI);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fMFLO(opcode,op, core) {
    let rd = (opcode >>> 11) & 0x1F;

    core.multiplier.finish();
    // TODO: add delay here until core.multiplier.clock_end
    R3000_fs_reg_write(core, rd, core.multiplier.LO);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fMTHI(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;

    // TODO: interrupt multiplier?
    core.multiplier.HI = core.regs.R[rs];
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fMTLO(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;

    // TODO: interrupt multiplier?
    core.multiplier.LO = core.regs.R[rs];
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000} core
 */
function R3000_fDIV(opcode,op, core) {
    // SIGNED divide
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;

    core.multiplier.set(0, 0,
        core.regs.R[rs] & 0xFFFFFFFF,
        core.regs.R[rt] & 0xFFFFFFFF,
        2,
        35
        )
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fDIVU(opcode,op, core) {
    // UNSIGNED divide
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;

    core.multiplier.set(0, 0,
        core.regs.R[rs] & 0xFFFFFFFF,
        core.regs.R[rt] & 0xFFFFFFFF,
        3,
        35
    )
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fMULT(opcode,op, core) {
    // UNSIGNED multiply
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let spd;

    let o1 = core.regs.R[rs] & 0xFFFFFFFF;

    // TODO: make this a little more correct
    if (Math.abs(o1) < 0x800)
        spd = 5;
    else if (Math.abs(o1) < 0x100000)
        spd = 8;
    else
        spd = 12;

    core.multiplier.set(0, 0,
        o1,
        core.regs.R[rt] & 0xFFFFFFFF,
        0,
        spd
        )
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fMULTU(opcode,op, core) {
    // UNSIGNED multiply
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let spd;
    let o1 = core.regs.R[rs] >>> 0;

    // TODO: make this a little more correct
    if (Math.abs(o1) < 0x800)
        spd = 5;
    else if (Math.abs(o1) < 0x100000)
        spd = 8;
    else
        spd = 12;

    core.multiplier.set(0, 0,
        o1,
        core.regs.R[rt] >>> 0,
        1,
        spd
        )
}

function R3000_GTE_readreg(regnum) {
    switch(regnum) {
        case 0:
    }
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fCOP(opcode,op, core) {
    // Opcode 0x10 is cop0, then just take the value of rs. 0 is mfc0, 4 is mtc0, and 0x10 is rfe
    let opc = (opcode >>> 26) & 0x1F;
    let rs = (opcode >>> 21) & 0x1F;
    // Opcode 0x10 is cop0, then just take the value of rs. 0 is mfc0, 4 is mtc0, and 0x10 is rfe
    if ((opc === 0x10)) {
        switch (rs) {
            case 0:
                R3000_fMFC(opcode, op, core, 0);
                return;
            case 4:
                R3000_fMTC(opcode, op, core, 0);
                return;
            case 0x10:
                R3000_fCOP0_RFE(opcode, op, core);
                return;
        }
    }
    console.log('BAD COP0 INSTRUCTION!', hex8(opcode));
    dbg.break();
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fLB(opcode,op, core) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = core.mem.CPU_read(addr, PS1_MT.u8, 0);
    rd = (rd << 24) >> 24;
    R3000_fs_reg_delay(core, rt, rd>>>0);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fLBU(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = core.mem.CPU_read(addr, PS1_MT.u8, 0);
    R3000_fs_reg_delay(core, rt, rd&0xFF);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fLH(opcode,op, core) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) >>> 0;

    let rd = core.mem.CPU_read(addr, PS1_MT.u16, 0);

    rd = ((rd << 16) >> 16)>>>0;
    R3000_fs_reg_delay(core, rt, rd);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fLHU(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = core.mem.CPU_read(addr, PS1_MT.u16, 0);
    R3000_fs_reg_delay(core, rt, rd);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fLW(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = ((core.regs.R[rs] + imm16) & 0xFFFFFFFF)>>>0;

    let rd = core.mem.CPU_read(addr, PS1_MT.u32, 0);
    //if (rd === 0x02800280) { console.log('LW FROM', hex8(addr)); debugger; }
    R3000_fs_reg_delay(core, rt, rd);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSB(opcode,op, core) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;

    core.mem.CPU_write(addr, PS1_MT.u8, core.regs.R[rt] & 0xFF);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSH(opcode,op, core) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;

    core.mem.CPU_write(addr, PS1_MT.u16, (core.regs.R[rt] & 0xFFFF) >>> 0);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSW(opcode,op, core) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = ((core.regs.R[rs] + imm16) & 0xFFFFFFFF) >>> 0;
    core.mem.CPU_write(addr, PS1_MT.u32, core.regs.R[rt] >>> 0);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fLWC(opcode,op, core) {
    // ;cop#dat_rt = [rs+imm]  ;word
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = core.mem.CPU_read(addr, PS1_MT.u32, 0);
    // TODO: add the 1-cycle delay to this
    core.COP_write_reg(op.arg, rt, rd);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSWC(opcode,op, core) {
    // ;cop#dat_rt = [rs+imm]  ;word
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = core.COP_read_reg(op.arg, rt, 0);
    // TODO: add the 1-cycle delay to this
    core.mem.CPU_write(addr, PS1_MT.u32, rd>>>0);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fLWL(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;

    // Fetch register from delay if it's there, and also clobber it
    let cur_v = R3000_fs_reg_delay_read(core, rt);

    let aligned_addr = addr & 0xFFFFFFFC;
    let aligned_word = core.mem.CPU_read(aligned_addr>>>0, PS1_MT.u32, 0);
    let fv;
    switch(addr & 3) {
        case 0:
            fv = ((cur_v & 0x00FFFFFF) | (aligned_word << 24)) & 0xFFFFFFFF;
            break;
        case 1:
            fv = ((cur_v & 0x0000FFFF) | (aligned_word << 16)) & 0xFFFFFFFF;
            break;
        case 2:
            fv = ((cur_v & 0x000000FF) | (aligned_word << 8)) & 0xFFFFFFFF;
            break;
        case 3:
            fv = aligned_word;
            break;
    }
    R3000_fs_reg_delay(core, rt, fv>>>0)
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSWL(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;
    let v = core.regs.R[rt];

    let aligned_addr = (addr & 0xFFFFFFFC)>>>0;
    let cur_mem = core.mem.CPU_read(aligned_addr, PS1_MT.u32, 0);

    switch(addr & 3) {
        case 0: // upper 8
            cur_mem = ((cur_mem & 0xFFFFFF00) | (v >>> 24)) & 0xFFFFFFFF;
            break;
        case 1:
            cur_mem = ((cur_mem & 0xFFFF0000) | (v >>> 16)) & 0xFFFFFFFF;
            break;
        case 2:
            cur_mem = ((cur_mem & 0xFF000000) | (v >>> 8)) & 0xFFFFFFFF;
            break;
        case 3:
            cur_mem = v;
            break;
    }
    core.mem.CPU_write(aligned_addr, PS1_MT.u32, cur_mem);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fLWR(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;

    // Fetch register from delay if it's there, and also clobber it
    let cur_v = R3000_fs_reg_delay_read(core, rt);

    let aligned_addr = addr & 0xFFFFFFFC;
    let aligned_word = core.mem.CPU_read(aligned_addr>>>0, PS1_MT.u32, 0);
    let fv;
    switch(addr & 3) {
        case 0:
            fv = aligned_word;
            break;
        case 1:
            fv = ((cur_v & 0xFF000000) | (aligned_word >>> 8)) & 0xFFFFFFFF;
            break;
        case 2:
            fv = ((cur_v & 0xFFFF0000) | (aligned_word >>> 16)) & 0xFFFFFFFF;
            break;
        case 3:
            fv = ((cur_v & 0xFFFFFF00) | (aligned_word >>> 24)) & 0xFFFFFFFF;
            break;
    }
    R3000_fs_reg_delay(core, rt, fv>>>0)
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op

 * @param {R3000} core
 */
function R3000_fSWR(opcode,op, core) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (core.regs.R[rs] + imm16) & 0xFFFFFFFF;
    let v = core.regs.R[rt];

    let aligned_addr = (addr & 0xFFFFFFFC)>>>0;
    let cur_mem = core.mem.CPU_read(aligned_addr, PS1_MT.u32, 0);

    switch(addr & 3) {
        case 0: // upper 8
            cur_mem = v;
            break;
        case 1:
            cur_mem = ((cur_mem & 0x000000FF) | (v << 8)) & 0xFFFFFFFF;
            break;
        case 2:
            cur_mem = ((cur_mem & 0x0000FFFF) | (v << 16)) & 0xFFFFFFFF;
            break;
        case 3:
            cur_mem = ((cur_mem & 0x00FFFFFF) | (v << 24)) & 0xFFFFFFFF;
            break;
    }
    core.mem.CPU_write(aligned_addr, PS1_MT.u32, cur_mem);
}

/**
 * @param {R3000_pipeline_item_t} current
 * @param {R3000_pipeline_item_t} next
 * @param {Number} target
 * @param {Number} mask
 * @param {Number} value
 */
function R3000_merge_lr(current, next, target, mask, value)
{
    next.lr = 1;
    next.target = target;
    if ((current.lr === 1) && (current.target === target)) {
        // Extend current core stuff
        next.lr_mask = (current.lr_mask | mask)>>>0;
        next.value = ((current.value & (current.lr_mask ^ mask)) | value)>>>0;
        console.log('NEW VALUE!', hex8(next.value));
        current.lr = 0;
        current.target = -1;
    }
    else {
        next.lr_mask = mask>>>0;
        next.value = value>>>0;
        console.log('NEW VALUE2!', hex8(mask), hex8(next.value));
    }
    //if (next.value === 0x02800280) { console.log('HERE1'); debugger; }
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000} core
 */
function R3000_fSYSCALL(opcode,op, core) {
    console.log('SYSCALL!', core.clock.trace_cycles, hex8(core.regs.PC))
    core.exception(8)
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000} core
 */
function R3000_fBREAK(opcode,op, core) {
    console.log('FIX BREAK!')
    core.exception(8)
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000} core
 */
function R3000_fMTC(opcode,op, core, copnum) {
    // move TO co
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    // cop[rd] = reg[rt]
    core.COP_write_reg(copnum, rd, core.regs.R[rt]);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000} core
 */
function R3000_fMFC(opcode,op, core, copnum) {
    // move FROM co
    // rt = cop[rd]
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    R3000_fs_reg_delay(core, rt, core.COP_read_reg(copnum, rd));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000} core
 */
function R3000_fCOP0_RFE(opcode,op, core) {
    // move FROM co
    // rt = cop[rd]
    // The RFE opcode moves some bits in cop0r12 (SR): bit2-3 are copied to bit0-1, all other bits (including bit4-5) are left unchanged.
    let r12 = core.regs.COP0[R3000_COP0_reg.SR];
    // bit4-5 are copied to bit2-3
    let b23 = (r12 >>> 2) & 0x0C; // Move from 4-5 to 2-3
    let b01 = (r12 >>> 2) & 3; // Move from 2-3 to 0-1
    core.regs.COP0[R3000_COP0_reg.SR] = (r12 & 0xFFFFFFF0) | b01 | b23;
}
