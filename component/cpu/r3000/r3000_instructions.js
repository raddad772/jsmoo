"use strict";

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fNA(opcode, op, regs, bus) {
    console.log('BAD INSTRUCTION', hex8(opcode));
}


/**
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 * @param {number} new_addr
 * @param {boolean} doit
 * @param {boolean} link
 * @param {number} link_reg
 */
function R3000_branch(regs, bus, new_addr, doit, link, link_reg= 31) {
    if (doit)
        bus.pipe.peek().new_PC = new_addr;
    if (link)
        R3000_fs_reg_write(regs, bus, link_reg, regs.PC);
}


/**
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 * @param {number} target
 * @param {number} value
 */
function R3000_fs_reg_write(regs, bus, target, value) {
    regs.R[target] = value & 0xFFFFFFFF;
    let p = bus.pipe.peek();
    if (p === null) {
        console.log('PIPE EMPTY ERROR!');
        return;
    }

    if (p.target === target) p.target = -1;
}

/**
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 * @param {number} target
 * @param {number} value
 */
function R3000_fs_reg_delay(regs, bus, target, value) {
    let p = bus.pipe.peek();
    if (p === null) {
        console.log('PIPE EMPTY ERROR!');
        return;
    }

    p.target = target;
    p.value = value & 0xFFFFFFFF;
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBcondZ(opcode, op, regs, bus) {
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
            R3000_fs_reg_write(regs, bus, R3000_reg.ra, regs.PC);
            break;
        case 0x11: // BGEZAL
            take = regs.R[rs] >= 0;
            R3000_fs_reg_write(regs, bus, R3000_reg.ra, regs.PC);
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
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fJ(opcode, op, regs, bus) {
/*
  00001x | <---------immediate26bit---------> | j/jal
  */
    R3000_branch(regs, bus,
        ((regs.PC & 0xF0000000) + ((opcode & 0x3FFFFFF) << 2)) & 0xFFFFFFFF,
        true,
        false);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fJAL(opcode, op, regs, bus) {
/*
  00001x | <---------immediate26bit---------> | j/jal
  */
    R3000_branch(regs, bus,
        ((regs.PC & 0xF0000000) + ((opcode & 0x3FFFFFF) << 2)) & 0xFFFFFFFF,
        true,
        true);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fJR(opcode, op, regs, bus)
{
/*
  00001x | <---------immediate26bit---------> | j/jal
  */
    let rs = (opcode >>> 21) & 0x1F;
    R3000_branch(regs, bus,
        regs.R[rs],
        true,
        false);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fJALR(opcode, op, regs, bus)
{
    let rs = (opcode >>> 21) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    R3000_branch(regs, bus, regs.R[rs], true, true, rd)
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBEQ(opcode, op, regs, bus) {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(regs, bus,
        (regs.PC + (mksigned16(opcode & 0xFFFF))) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] === regs.R[(opcode >>> 16) & 0x1F],
        false);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBNE(opcode, op, regs, bus) {
    // 00010x | rs   | rt   | <--immediate16bit--> |\
    R3000_branch(regs, bus,
        (regs.PC + (mksigned16(opcode & 0xFFFF))) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] !== regs.R[(opcode >>> 16) & 0x1F],
        false);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBLEZ(opcode, op, regs, bus) {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(regs, bus,
        (regs.PC + (mksigned16(opcode & 0xFFFF))) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] <= 0,
        false)
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fBGTZ(opcode, op, regs, bus) {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(regs, bus,
        (regs.PC + (mksigned16(opcode & 0xFFFF))) & 0xFFFFFFFF,
        regs.R[(opcode >>> 21) & 0x1F] > 0,
        false)
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fADDI(opcode, op, regs, bus) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm = mksigned16(opcode & 0xFFFF);

    // TODO: add overflow trap
    R3000_fs_reg_write(regs, bus, rt, regs.R[rs] + imm);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fADDIU(opcode, op, regs, bus) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm = mksigned16(opcode & 0xFFFF);

    R3000_fs_reg_write(regs, bus, rt, regs.R[rs] + imm);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fADD(opcode, op, regs, bus) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    // TODO: add overflow trap
    R3000_fs_reg_write(regs, bus, rd, regs.R[rs] + regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fADDU(opcode, op, regs, bus) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rs] + regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSUB(opcode, op, regs, bus) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    // TODO: add overflow trap
    R3000_fs_reg_write(regs, bus, rd, regs.R[rs] - regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSUBU(opcode, op, regs, bus) {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rs] - regs.R[rt]);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fAND(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rs] & regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fANDI(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = (0xFFFF0000 | (opcode & 0xFFFF)) >>> 0;

    R3000_fs_reg_write(regs, bus, rt, imm16 & regs.R[rs]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fORI(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = (opcode & 0xFFFF) >>> 0;

    R3000_fs_reg_write(regs, bus, rt, imm16 | regs.R[rs]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fXORI(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = (opcode & 0xFFFF) >>> 0;

    R3000_fs_reg_write(regs, bus, rt, imm16 ^ regs.R[rs]);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fOR(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rs] | regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fXOR(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rs] ^ regs.R[rt]);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fNOR(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rs] ^ regs.R[rt] ^ 0xFFFFFFFF);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSLT(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, +((regs.R[rs] & 0xFFFFFFFF) < (regs.R[rt] & 0xFFFFFFFF)));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSLTU(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, +((regs.R[rs] >>> 0) < (regs.R[rt] >>> 0)));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSLTI(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = opcode & 0xFFFF;

    R3000_fs_reg_write(regs, bus, rt, +((regs.R[rs] & 0xFFFFFFFF) < mksigned16(imm16)));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSLTIU(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = (0xFFFF0000 | (opcode & 0xFFFF)) >>> 0;

    R3000_fs_reg_write(regs, bus, rt, +((regs.R[rs] >>> 0) < imm16));
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSLLV(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rt] << (regs.R[rs] & 0x1F));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSRLV(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rt] >>> (regs.R[rs] & 0x1F));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSRAV(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rt] >> (regs.R[rs] & 0x1F));
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSLL(opcode, op, regs, bus) {
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let imm5 = (opcode >>> 6) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rt] << imm5);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSRL(opcode, op, regs, bus) {
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let imm5 = (opcode >>> 6) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rt] >>> imm5);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSRA(opcode, op, regs, bus) {
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let imm5 = (opcode >>> 6) & 0x1F;

    R3000_fs_reg_write(regs, bus, rd, regs.R[rt] >> imm5);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fLUI(opcode, op, regs, bus) {
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = opcode & 0xFFFF;

    R3000_fs_reg_write(regs, bus, rt, imm16 << 16);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fMFHI(opcode, op, regs, bus) {
    let rd = (opcode >>> 11) & 0x1F;

    // TODO: add delay here until bus.multiplier.clock_end
    bus.multiplier.finish();
    R3000_fs_reg_write(regs, bus, rd, bus.multiplier.HI);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fMFLO(opcode, op, regs, bus) {
    let rd = (opcode >>> 11) & 0x1F;

    bus.multiplier.finish();
    // TODO: add delay here until bus.multiplier.clock_end
    R3000_fs_reg_write(regs, bus, rd, bus.multiplier.LO);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fMTHI(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;

    // TODO: interrupt multiplier?
    bus.multiplier.HI = regs.R[rs];
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fMTLO(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;

    // TODO: interrupt multiplier?
    bus.multiplier.LO = regs.R[rs];
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fDIV(opcode, op, regs, bus) {
    // SIGNED divide
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;

    bus.multiplier.hi = 0;
    bus.multiplier.lo = 0;
    bus.multiplier.op1 = regs.R[rs] & 0xFFFFFFFF;
    bus.multiplier.op2 = regs.R[rt] & 0xFFFFFFFF;

    bus.multiplier.op_going = 1;
    bus.multiplier.op_kind = 2;
    bus.multiplier.clock_start = bus.clock.cpu_master_clock;
    bus.multiplier.clock_end = bus.clock.cpu_master_clock+35;
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fDIVU(opcode, op, regs, bus) {
    // UNSIGNED divide
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;

    bus.multiplier.hi = 0;
    bus.multiplier.lo = 0;
    bus.multiplier.op1 = regs.R[rs] & 0xFFFFFFFF;
    bus.multiplier.op2 = regs.R[rt] & 0xFFFFFFFF;

    bus.multiplier.op_going = 1;
    bus.multiplier.op_kind = 3;
    bus.multiplier.clock_start = bus.clock.cpu_master_clock;
    bus.multiplier.clock_end = bus.clock.cpu_master_clock+35;
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fMULT(opcode, op, regs, bus) {
    // UNSIGNED multiply
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let spd;

    bus.multiplier.hi = 0;
    bus.multiplier.lo = 0;
    bus.multiplier.op1 = regs.R[rs] & 0xFFFFFFFF;
    bus.multiplier.op2 = regs.R[rt] & 0xFFFFFFFF;

    // TODO: make this a little more correct
    if (Math.abs(bus.multiplier.op1) < 0x800)
        spd = 5;
    else if (Math.abs(bus.multiplier.op1) < 0x100000)
        spd = 8;
    else
        spd = 12;

    bus.multiplier.op_going = 1;
    bus.multiplier.op_kind = 0;
    bus.multiplier.clock_start = bus.clock.cpu_master_clock;
    bus.multiplier.clock_end = bus.clock.cpu_master_clock + spd;
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fMULTU(opcode, op, regs, bus) {
    // UNSIGNED multiply
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let spd;

    bus.multiplier.hi = 0;
    bus.multiplier.lo = 0;
    bus.multiplier.op1 = regs.R[rs] >>> 0;
    bus.multiplier.op2 = regs.R[rt] >>> 0;

    // TODO: make this a little more correct
    if (Math.abs(bus.multiplier.op1) < 0x800)
        spd = 5;
    else if (Math.abs(bus.multiplier.op1) < 0x100000)
        spd = 8;
    else
        spd = 12;

    bus.multiplier.op_going = 1;
    bus.multiplier.op_kind = 1;
    bus.multiplier.clock_start = bus.clock.cpu_master_clock;
    bus.multiplier.clock_end = bus.clock.cpu_master_clock + spd;
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fCOP(opcode, op, regs, bus) {
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
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fLB(opcode, op, regs, bus) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = bus.mem.CPU_read(addr, PS1_MT.u8, 0);
    if (rd & 0x80) rd |= 0xFFFFFF00;
    R3000_fs_reg_delay(regs, bus, rt, rd);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fLBU(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = bus.mem.CPU_read(addr, PS1_MT.u8, 0);
    R3000_fs_reg_delay(regs, bus, rt, rd);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fLH(opcode, op, regs, bus) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = bus.mem.CPU_read(addr, PS1_MT.u16, 0);
    if (rd & 0x8000) rd |= 0xFFFF0000;
    R3000_fs_reg_delay(regs, bus, rt, rd);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fLHU(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = bus.mem.CPU_read(addr, PS1_MT.u16, 0);
    R3000_fs_reg_delay(regs, bus, rt, rd);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fLW(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = bus.mem.CPU_read(addr, PS1_MT.u32, 0);
    R3000_fs_reg_delay(regs, bus, rt, rd);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSB(opcode, op, regs, bus) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    bus.mem.CPU_write(addr, PS1_MT.u8, regs.R[rt] & 0xFF);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSH(opcode, op, regs, bus) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    bus.mem.CPU_write(addr, PS1_MT.u16, (regs.R[rt] & 0xFFFF) >>> 0);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSW(opcode, op, regs, bus) {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    bus.mem.CPU_write(addr, PS1_MT.u32, (regs.R[rt] & 0xFFFFFFFF) >>> 0);
}


/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fLWC(opcode, op, regs, bus) {
    // ;cop#dat_rt = [rs+imm]  ;word
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = bus.mem.CPU_read(addr, PS1_MT.u32, 0);
    // TODO: add the 1-cycle delay to this
    bus.COP_write_reg(op.arg, regs, rt, rd);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fSWC(opcode, op, regs, bus) {
    // ;cop#dat_rt = [rs+imm]  ;word
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    let rd = bus.COP_read_reg(op.arg, regs, rt, 0);
    // TODO: add the 1-cycle delay to this
    bus.mem.CPU_write(addr, PS1_MT.u32, rd>>>0);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_f(opcode, op, regs, bus) {
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fLWL(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    // Now determine which bits...
    let lbits = (3 - addr & 3);
    let msk = 0;
    // upper bits
    // lbits = 0 = 8,
    // lbits = 1 = 16
    // lbits = 2 = 24,
    // lbits = 3 = 32
    switch(lbits) {
        case 0: // upper 8
            msk = 0xFF000000;
            break;
        case 1:
            msk = 0xFFFF0000;
            break;
        case 2:
            msk = 0xFFFFFF00;
            break;
        case 3:
            msk = 0xFFFFFFFF;
            break;
    }
    let rd = bus.mem.CPU_read(addr & 0xFFFFFFFC, PS1_MT.u32, 0) & msk;
    R3000_merge_lr(bus.pipe.current, bus.pipe.peek(), rt, msk, rd);
}

/**
 * @param {Number} opcode
 * @param {R3000_opcode} op
 * @param {R3000_regs_t} regs
 * @param {R3000_bus_interface_t} bus
 */
function R3000_fLWR(opcode, op, regs, bus) {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16 = mksigned16(opcode & 0xFFFF);

    let addr = (regs.R[rs] + imm16) & 0xFFFFFFFF;

    // Now determine which bits...
    let lbits = (3 - addr & 3);
    let msk = 0;
    // upper bits
    // lbits = 0 = 8,
    // lbits = 1 = 16
    // lbits = 2 = 24,
    // lbits = 3 = 32
    switch(lbits) {
        case 0: // upper 8
            msk = 0xFFFFFFFF;
            break;
        case 1:
            msk = 0x00FFFFFF;
            break;
        case 2:
            msk = 0x0000FFFF;
            break;
        case 3:
            msk = 0x000000FF;
            break;
    }
    let rd = bus.mem.CPU_read(addr & 0xFFFFFFFC, PS1_MT.u32, 0) & msk;
    R3000_merge_lr(bus.pipe.current, bus.pipe.peek(), rt, msk, rd);
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
        // Extend current bus stuff
        next.lr_mask = current.lr_mask | mask;
        next.value = (current.value & (current.lr_mask ^ mask)) | value;
        current.lr = 0;
        current.target = -1;
    }
    else {
        next.lr_mask = mask;
        next.value = value;
    }
}
