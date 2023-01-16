"use strict";

import {R3000} from "./r3000";
import {R3000_opcode} from "./r3000_opcodes";
import {hex8, mksigned16} from "../../../helpers/helpers";
import {R3000_COP0_reg, R3000_reg} from "./r3000_disassembler";
import {MT} from "../../../system/ps1/ps1_mem";
import {D_RESOURCE_TYPES, dbg} from "../../../helpers/debug";

export function R3000_fNA(opcode: u32, op: R3000_opcode, core: R3000): void {
    console.log('BAD INSTRUCTION ' + hex8(opcode));
}

//@ts-ignore
@inline
export function R3000_branch(core: R3000, new_addr: u32, doit: bool, link: bool, link_reg: u32= 31): void {
    if (doit)
        core.pipe.get_next().new_PC = new_addr>>>0;
    if (link)
        R3000_fs_reg_write(core, link_reg, core.regs.PC+4);
}

//@ts-ignore
@inline
export function R3000_fs_reg_write(core: R3000, target: u32, value: u32): void {
    if (target !== 0) core.regs.R[target] = value;

    if (core.trace_on) core.debug_reg_list.push(target);

    let p = core.pipe.current;

    if (p.target === target) p.target = -1;
}

//@ts-ignore
@inline
export function R3000_fs_reg_delay_read(core: R3000, target: i32): u32 {
    let p = core.pipe.current;

    if (p.target === target) {
        p.target = -1;
        return <u32>p.value;
    }
    else {
        return core.regs.R[target];
    }
}

//@ts-ignore
@inline
export function R3000_fs_reg_delay(core: R3000, target: i32, value: u32): void {
    let p = core.pipe.get_next();

    p.target = target;
    p.value = value;
}


export function R3000_fBcondZ(opcode: u32, op: R3000_opcode, core: R3000): void {
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
            take = (<i32>core.regs.R[rs]) < 0;
            break;
        case 1: // BGEZ
            take = (<i32>core.regs.R[rs]) >= 0;
            break;
        case 0x10: // BLTZAL
            take = (<i32>core.regs.R[rs]) < 0;
            R3000_fs_reg_write(core, R3000_reg.ra, core.regs.PC+4);
            break;
        case 0x11: // BGEZAL
            take = (<i32>core.regs.R[rs]) >= 0;
            R3000_fs_reg_write(core, R3000_reg.ra, core.regs.PC+4);
            break;
        default:
            console.log('Bad B..Z instruction! ' + hex8(opcode));
            return;
    }
    R3000_branch(core,
        core.regs.PC + (mksigned16(imm) * 4),
        take,
        false
        )
}

export function R3000_fJ(opcode: u32, op: R3000_opcode, core: R3000): void {
/*
  00001x | <---------immediate26bit---------> | j/jal
  */
    R3000_branch(core,
        (core.regs.PC & 0xF0000000) + ((opcode & 0x3FFFFFF) << 2),
        true,
        false);
}

export function R3000_fJAL(opcode: u32, op: R3000_opcode, core: R3000): void {
/*
  00001x | <---------immediate26bit---------> | j/jal
  */
    R3000_branch(core,
        (core.regs.PC & 0xF0000000) + ((opcode & 0x3FFFFFF) << 2),
        true,
        true);
}

export function R3000_fJR(opcode: u32, op: R3000_opcode, core: R3000): void
{
    let rs = (opcode >>> 21) & 0x1F;
    let a = core.regs.R[rs];
    if ((a & 3) !== 0) {
        console.log('ADDRESS EXCEPTION, HANDLE?');
    }
    R3000_branch(core,
        a,
        true,
        false);
}

export function R3000_fJALR(opcode: u32, op: R3000_opcode, core: R3000): void
{
    let rs = (opcode >>> 21) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let a = core.regs.R[rs];
    if ((a & 3) !== 0) {
        console.log('ADDRESS EXCEPTION, HANDLE?');
    }
    R3000_branch(core, a, true, true, rd)
}

export function R3000_fBEQ(opcode: u32, op: R3000_opcode, core: R3000): void {
    R3000_branch(core,
        core.regs.PC + (<u32>(<i16>(opcode & 0xFFFF))*4),
        core.regs.R[(opcode >>> 21) & 0x1F] === core.regs.R[(opcode >>> 16) & 0x1F],
        false);
}

export function R3000_fBNE(opcode: u32, op: R3000_opcode, core: R3000): void {
    // 00010x | rs   | rt   | <--immediate16bit--> |\
    R3000_branch(core,
        core.regs.PC + (<u32>(<i16>(opcode & 0xFFFF))*4),
        core.regs.R[(opcode >>> 21) & 0x1F] !== core.regs.R[(opcode >>> 16) & 0x1F],
        false);
}

export function R3000_fBLEZ(opcode: u32, op: R3000_opcode, core: R3000): void {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(core,
        core.regs.PC + (<u32>(<i16>(opcode & 0xFFFF))*4),
        (<i32>core.regs.R[(opcode >>> 21) & 0x1F]) <= 0,
        false)
}

export function R3000_fBGTZ(opcode: u32, op: R3000_opcode, core: R3000): void {
    // 00010x | rs   | rt   | <--immediate16bit--> |
    R3000_branch(core,
        core.regs.PC + (<u32>(<i16>(opcode & 0xFFFF))*4),
        (<i32>core.regs.R[(opcode >>> 21) & 0x1F])  > 0,
        false)
}

export function R3000_fADDI(opcode: u32, op: R3000_opcode, core: R3000): void {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm: u32 = <u32>(<i16>(opcode & 0xFFFF));

    // core.regs.PC + (<u32>(<i16>(opcode & 0xFFFF))*4)
    // TODO: add overflow trap
    R3000_fs_reg_write(core, rt, core.regs.R[rs] + <u32>imm);
}

export function R3000_fADDIU(opcode: u32, op: R3000_opcode, core: R3000): void {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm: u32 = <u32>(<i16>(opcode & 0xFFFF));

    R3000_fs_reg_write(core, rt, core.regs.R[rs] + <u32>imm);
}

export function R3000_fADD(opcode: u32, op: R3000_opcode, core: R3000): void {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    // TODO: add overflow trap
    R3000_fs_reg_write(core, rd, core.regs.R[rs] + core.regs.R[rt]);
}

export function R3000_fADDU(opcode: u32, op: R3000_opcode, core: R3000): void {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rs] + core.regs.R[rt]);
}

export function R3000_fSUB(opcode: u32, op: R3000_opcode, core: R3000): void {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    // TODO: add overflow trap
    R3000_fs_reg_write(core, rd, core.regs.R[rs] - core.regs.R[rt]);
}

export function R3000_fSUBU(opcode: u32, op: R3000_opcode, core: R3000): void {
    //   001xxx | rs   | rt   | <--immediate16bit--> | alu-imm
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rs] - <i32>core.regs.R[rt]);
}

export function R3000_fAND(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rs] & core.regs.R[rt]);
}

export function R3000_fANDI(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = opcode & 0xFFFF;

    R3000_fs_reg_write(core, rt, imm16 & core.regs.R[rs]);
}

export function R3000_fORI(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = opcode & 0xFFFF;

    R3000_fs_reg_write(core, rt, imm16 | core.regs.R[rs]);
}

export function R3000_fXORI(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = opcode & 0xFFFF;

    R3000_fs_reg_write(core, rt, imm16 ^ core.regs.R[rs]);
}

export function R3000_fOR(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rs] | core.regs.R[rt]);
}

export function R3000_fXOR(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rs] ^ core.regs.R[rt]);
}

export function R3000_fNOR(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, (core.regs.R[rs] | core.regs.R[rt]) ^ 0xFFFFFFFF);
}

export function R3000_fSLT(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, +((<i32>core.regs.R[rs]) < (<i32>core.regs.R[rt])));
}

export function R3000_fSLTU(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, +(core.regs.R[rs] < core.regs.R[rt]));
}

export function R3000_fSLTI(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: i32 = (<i16>(opcode & 0xFFFF)); // sign-extend

    R3000_fs_reg_write(core, rt, +(<i32>core.regs.R[rs] < imm16));
}

export function R3000_fSLTIU(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF)); // sign-extend

    // unary operator converts to 0/1
    R3000_fs_reg_write(core, rt, +(core.regs.R[rs] < imm16));
}

export function R3000_fSLLV(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] << (core.regs.R[rs] & 0x1F));
}

export function R3000_fSRLV(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] >>> (core.regs.R[rs] & 0x1F));
}

export function R3000_fSRAV(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;

    R3000_fs_reg_write(core, rd, <u32>(<i32>core.regs.R[rt] >> (core.regs.R[rs] & 0x1F)));
}

export function R3000_fSLL(opcode: u32, op: R3000_opcode, core: R3000): void {
    if (opcode === 0) {
        return;
    }
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let imm5 = (opcode >>> 6) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] << imm5);
}

export function R3000_fSRL(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let imm5 = (opcode >>> 6) & 0x1F;

    R3000_fs_reg_write(core, rd, core.regs.R[rt] >>> imm5);
}

export function R3000_fSRA(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    let imm5 = (opcode >>> 6) & 0x1F;

    R3000_fs_reg_write(core, rd, <u32>(<i32>core.regs.R[rt] >> imm5));
}

export function R3000_fLUI(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = opcode & 0xFFFF;

    R3000_fs_reg_write(core, rt, imm16 << 16);
}

export function R3000_fMFHI(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rd = (opcode >>> 11) & 0x1F;

    // TODO: add delay here until core.multiplier.clock_end
    core.multiplier.finish();
    //console.log('MOVE FROM HI ' + hex8(core.multiplier.hi) + ' at ' + core.clock.trace_cycles.toString());
    //if (core.multiplier.hi > 10) dbg.break(D_RESOURCE_TYPES.R3000);
    R3000_fs_reg_write(core, rd, core.multiplier.hi);
}

export function R3000_fMFLO(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rd = (opcode >>> 11) & 0x1F;

    core.multiplier.finish();
    // TODO: add delay here until core.multiplier.clock_end
    R3000_fs_reg_write(core, rd, core.multiplier.lo);
}

export function R3000_fMTHI(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;

    // TODO: interrupt multiplier?
    core.multiplier.hi = core.regs.R[rs];
}

export function R3000_fMTLO(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;

    // TODO: interrupt multiplier?
    core.multiplier.lo = core.regs.R[rs];
}

export function R3000_fDIV(opcode: u32, op: R3000_opcode, core: R3000): void {
    // SIGNED divide
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;

    core.multiplier.set(0, 0,
        core.regs.R[rs],
        core.regs.R[rt],
        2,
        35
        )
}

export function R3000_fDIVU(opcode: u32, op: R3000_opcode, core: R3000): void {
    // UNSIGNED divide
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;

    core.multiplier.set(0, 0,
        core.regs.R[rs],
        core.regs.R[rt],
        3,
        35
    )
}

export function R3000_fMULT(opcode: u32, op: R3000_opcode, core: R3000): void {
    // UNSIGNED multiply
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let spd: u32 = 0;

    let o1: i32 = <i32>core.regs.R[rs];

    // TODO: make this a little more correct
    if (abs<i32>(o1) < 0x800)
        spd = 5;
    else if (abs<i32>(o1) < 0x100000)
        spd = 8;
    else
        spd = 12;

    core.multiplier.set(0, 0,
        <u32>o1,
        core.regs.R[rt],
        0,
        spd
        )
}

export function R3000_fMULTU(opcode: u32, op: R3000_opcode, core: R3000): void {
    // UNSIGNED multiply
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let spd: u32 = 0;
    let o1 = core.regs.R[rs];

    // TODO: make this a little more correct
    if (o1 < 0x800)
        spd = 5;
    else if (o1 < 0x100000)
        spd = 8;
    else
        spd = 12;

    core.multiplier.set(0, 0,
        o1,
        core.regs.R[rt],
        1,
        spd
        )
}

export function R3000_fCOP(opcode: u32, op: R3000_opcode, core: R3000): void {
    let copnum = (opcode >>> 26) & 3;

    // Opcode 0x10 is cop0, then just take the value of rs. 0 is mfc0, 4 is mtc0, and 0x10 is rfe
    let opc = (opcode >>> 26) & 0x1F;
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    // Opcode 0x10 is cop0, then just take the value of rs. 0 is mfc0, 4 is mtc0, and 0x10 is rfe

    if (copnum === 0) {
        // Cop0 decoding easy
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
        console.log('BAD COP0 INSTRUCTION! ' + hex8(opcode));
    }
    else {
        if (copnum !== 2) {
            console.log('BAD COP INS? ' + hex8(opcode));
            return;
        }
        if (opcode & 0x2000000) {
            core.gte.command(opcode);
            return;
        }
        let bits5 = (opcode >> 21) & 0x1F;
        let low6 = (opcode & 0x3F);
        if (low6 !== 0) { // TLBxxx, RFE (which is only COP0?)
            console.log('BAD COP INSTRUCTION ' + hex8(opcode));
            return;
        }
        switch(bits5) {
            case 0: // MFCn rt = dat
                if (rt !== 0) core.regs.R[rt] = core.gte.read_reg(rd);
                return;
            case 2: // CFCn rt = cnt
                if (rt !== 0) core.regs.R[rt] = core.gte.read_reg(rd+32);
                return;
            case 4: // MTCn  dat = rt
                core.gte.write_reg(rd, core.regs.R[rt])
                return;
            case 6: // CTCn  cnt = rt
                core.gte.write_reg(rd+32, core.regs.R[rt])
                return;
            default:
                console.log('UNKNOWN COP INSTRUCTION ' + hex8(opcode));
        }
    }
    //dbg.break();
}

export function R3000_fLB(opcode: u32, op: R3000_opcode, core: R3000): void {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    let rd = <i32>core.mem.CPU_read(addr, MT.u8, 0);
    rd = (rd << 24) >> 24;
    R3000_fs_reg_delay(core, rt, <u32>rd);
}

export function R3000_fLBU(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    let rd = core.mem.CPU_read(addr, MT.u8, 0);
    R3000_fs_reg_delay(core, rt, rd&0xFF);
}

export function R3000_fLH(opcode: u32, op: R3000_opcode, core: R3000): void {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    let rd: u32 = <u32>(<i16>core.mem.CPU_read(addr, MT.i16, 0));

    //rd = <u32>((rd << 16) >> 16);
    R3000_fs_reg_delay(core, rt, rd);
}

export function R3000_fLHU(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    let rd = core.mem.CPU_read(addr, MT.u16, 0);
    R3000_fs_reg_delay(core, rt, rd&0xFFFF);
}

export function R3000_fLW(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    //if (rd === 0x02800280) { console.log('LW FROM', hex8(addr)); debugger; }
    R3000_fs_reg_delay(core, rt, core.mem.CPU_read(addr, MT.u32, 0));
}

export function R3000_fSB(opcode: u32, op: R3000_opcode, core: R3000): void {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    core.mem.CPU_write(addr, MT.u8, core.regs.R[rt] & 0xFF);
}

export function R3000_fSH(opcode: u32, op: R3000_opcode, core: R3000): void {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    core.mem.CPU_write(addr, MT.u16, core.regs.R[rt] & 0xFFFF);
}

export function R3000_fSW(opcode: u32, op: R3000_opcode, core: R3000): void {
    //lb  rt,imm(rs)    rt=[imm+rs]  ;byte sign-extended
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    core.mem.CPU_write(addr, MT.u32, core.regs.R[rt]);
}

export function R3000_fLWC(opcode: u32, op: R3000_opcode, core: R3000): void {
    // ;cop#dat_rt = [rs+imm]  ;word
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    let rd = core.mem.CPU_read(addr, MT.u32, 0);
    // TODO: add the 1-cycle delay to this
    core.COP_write_reg(op.arg, rt, rd);
}

export function R3000_fSWC(opcode: u32, op: R3000_opcode, core: R3000): void {
    // ;cop#dat_rt = [rs+imm]  ;word
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    let rd = core.COP_read_reg(op.arg, rt);
    // TODO: add the 1-cycle delay to this
    core.mem.CPU_write(addr, MT.u32, rd);
}

export function R3000_fLWL(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;


    // Fetch register from delay if it's there, and also clobber it
    let cur_v = R3000_fs_reg_delay_read(core, rt);

    let aligned_addr: u32 = addr & 0xFFFFFFFC;
    let aligned_word = core.mem.CPU_read(aligned_addr, MT.u32, 0);
    let fv: u32 = 0;
    switch(addr & 3) {
        case 0:
            fv = ((cur_v & 0x00FFFFFF) | (aligned_word << 24));
            break;
        case 1:
            fv = ((cur_v & 0x0000FFFF) | (aligned_word << 16));
            break;
        case 2:
            fv = ((cur_v & 0x000000FF) | (aligned_word << 8));
            break;
        case 3:
            fv = aligned_word;
            break;
    }
    R3000_fs_reg_delay(core, rt, fv)
}

export function R3000_fSWL(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    let v = core.regs.R[rt];

    let aligned_addr = (addr & 0xFFFFFFFC)>>>0;
    let cur_mem = core.mem.CPU_read(aligned_addr, MT.u32, 0);

    switch(addr & 3) {
        case 0: // upper 8
            cur_mem = ((cur_mem & 0xFFFFFF00) | (v >>> 24));
            break;
        case 1:
            cur_mem = ((cur_mem & 0xFFFF0000) | (v >>> 16));
            break;
        case 2:
            cur_mem = ((cur_mem & 0xFF000000) | (v >>> 8));
            break;
        case 3:
            cur_mem = v;
            break;
    }
    core.mem.CPU_write(aligned_addr, MT.u32, cur_mem);
}

export function R3000_fLWR(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;

    // Fetch register from delay if it's there, and also clobber it
    let cur_v = R3000_fs_reg_delay_read(core, rt);

    let aligned_addr = addr & 0xFFFFFFFC;
    let aligned_word = core.mem.CPU_read(aligned_addr, MT.u32, 0);
    let fv: u32 = 0;
    switch(addr & 3) {
        case 0:
            fv = aligned_word;
            break;
        case 1:
            fv = ((cur_v & 0xFF000000) | (aligned_word >>> 8));
            break;
        case 2:
            fv = ((cur_v & 0xFFFF0000) | (aligned_word >>> 16));
            break;
        case 3:
            fv = ((cur_v & 0xFFFFFF00) | (aligned_word >>> 24));
            break;
    }
    R3000_fs_reg_delay(core, rt, fv)
}

export function R3000_fSWR(opcode: u32, op: R3000_opcode, core: R3000): void {
    let rs = (opcode >>> 21) & 0x1F;
    let rt = (opcode >>> 16) & 0x1F;
    let imm16: u32 = <u32>(<i16>(opcode & 0xFFFF));
    let addr = core.regs.R[rs] + imm16;
    let v = core.regs.R[rt];

    let aligned_addr = (addr & 0xFFFFFFFC)>>>0;
    let cur_mem = core.mem.CPU_read(aligned_addr, MT.u32, 0);

    switch(addr & 3) {
        case 0: // upper 8
            cur_mem = v;
            break;
        case 1:
            cur_mem = ((cur_mem & 0x000000FF) | (v << 8));
            break;
        case 2:
            cur_mem = ((cur_mem & 0x0000FFFF) | (v << 16));
            break;
        case 3:
            cur_mem = ((cur_mem & 0x00FFFFFF) | (v << 24));
            break;
    }
    core.mem.CPU_write(aligned_addr, MT.u32, cur_mem);
}

export function R3000_fSYSCALL(opcode: u32, op: R3000_opcode, core: R3000): void {
    console.log('SYSCALL! ' + core.clock.trace_cycles.toString() + ' ' +  hex8(core.regs.PC))
    core.exception(8)
}

export function R3000_fBREAK(opcode: u32, op: R3000_opcode, core: R3000): void {
    console.log('FIX BREAK!')
    core.exception(8)
}

export function R3000_fMTC(opcode: u32, op: R3000_opcode, core: R3000, copnum: u32): void {
    // move TO co
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    // cop[rd] = reg[rt]
    core.COP_write_reg(copnum, rd, core.regs.R[rt]);
}

export function R3000_fMFC(opcode: u32, op: R3000_opcode, core: R3000, copnum: u32): void {
    // move FROM co
    // rt = cop[rd]
    let rt = (opcode >>> 16) & 0x1F;
    let rd = (opcode >>> 11) & 0x1F;
    R3000_fs_reg_delay(core, rt, core.COP_read_reg(copnum, rd));
}

export function R3000_fCOP0_RFE(opcode: u32, op: R3000_opcode, core: R3000): void {
    // move FROM co
    // rt = cop[rd]
    // The RFE opcode moves some bits in cop0r12 (SR): bit2-3 are copied to bit0-1, all other bits (including bit4-5) are left unchanged.
    let r12: u32 = core.regs.COP0[R3000_COP0_reg.SR];
    // bit4-5 are copied to bit2-3
    let b23 = (r12 >>> 2) & 0x0C; // Move from 4-5 to 2-3
    let b01 = (r12 >>> 2) & 3; // Move from 2-3 to 0-1
    core.regs.COP0[R3000_COP0_reg.SR] = (r12 & 0xFFFFFFF0) | b01 | b23;
}
