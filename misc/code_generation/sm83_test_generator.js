"use strict";

/*
 A note on the format of the tests produced by this.

 */

let SM83_NUM_TO_GENERATE = 1000; // Generate 1 of each test
//let Z80_NULL_WAIT_STATES = false;
//const Z80_GEN_WAIT_HOW_LONG = 6; // 6 cycles of Wait are generated

function ckrange(what, low, hi) {
    if (what < low) return false;
    if (what > hi) return false;
    return true;
}

class SM83_cycle {
    constructor(addr, val, RD, WR, MRQ, force_treat_as_read) {
        this.addr = addr;
        this.val = val;
        this.pins = {
            RD: RD,
            WR: WR,
            MRQ: MRQ,
        }
        this.force_treat_as_read = force_treat_as_read;
    }

    serializeable() {
        let ostr = '';
        ostr += this.pins.RD ? 'r' : '-';
        ostr += this.pins.WR ? 'w' : '-';
        ostr += this.pins.MRQ ? 'm' : '-';
        if ((this.addr === null) || (this.val === null)) debugger;
        return [this.addr, this.val, ostr];
    }
}

class SM83_m_states {
    constructor() {
        this.cycles = [];
        this.state = {
            RD: 0,
            WR: 0,
            MRQ: 0,
            addr: 0,
            D: 0
        }
    }

    add(addr, val, RD, WR, MRQ, force_treat_as_read) {
        if ((addr === null) || (val === null)) debugger;
        this.cycles.push(new SM83_cycle(addr, val, RD, WR, MRQ, force_treat_as_read));
    }

    serializeable() {
        let out = [];
        for (let i in this.cycles) {
            out.push(this.cycles[i].serializeable());
        }
        return out;
    }
}

function SM83T_pins_RDR(pins) {
    return ((pins.indexOf('r') !== -1) && (pins.indexOf('m') !== -1));
}

function SM83T_pins_WRR(pins) {
    return ((pins.indexOf('w') !== -1) && (pins.indexOf('m') !== -1));
}

class SM83_proc_test {
    constructor() {
        // Serialized
        this.name = '';
        this.initial = {};
        this.final = {};
        this.cycles = new SM83_m_states();

        this.opcode_RAMs = {};

        this.last_addr = null;
        this.last_val = null;
    }

    serializable() {
        let r = {
            name: this.name,
            initial: this.initial,
            final: this.final,
            cycles: this.cycles.serializeable()
        }
        return r;
    }

    finalize(regs, initial_PC, opcode_stream) {
        regs.dump_to(this.final);
        if (this.final.f > 0xFF) debugger;
        //console.log(this.cycles.cycles);
        let initial_RAMs = [];
        let final_RAMs = [];
        let initial_set = new Set();
        let final_set = new Set();
        for (let i in opcode_stream) {
            if (parseInt(i) === 2) continue; // skip null byte
            let addr = (parseInt(initial_PC)+parseInt(i)) & 0xFFFF;
            initial_set.add(addr);
            final_set.add(addr);
            initial_RAMs.push([addr, opcode_stream[i]]);
            final_RAMs.push([addr, opcode_stream[i]]);
        }
        let ocycles = [];
        for (let i in this.cycles.cycles) {
            let icycle = this.cycles.cycles[i];
            let cycle = icycle.serializeable();
            let addr = cycle[0];
            let val = cycle[1];
            let pins = cycle[2];
            if (addr !== null && val !== null) {
                if (icycle.force_treat_as_read) { // Add to initial RAM if this is a read
                    if (!initial_set.has(addr)) {
                        initial_set.add(addr);
                        initial_RAMs.push([addr, val]);
                    }
                }
                if (SM83T_pins_WRR(pins)) { // Write 0 to initial RAM if there isn't a value there
                    if (!initial_set.has(addr)) {
                        initial_set.add(addr);
                        initial_RAMs.push([addr, 0]);
                    }
                }
                if ((!final_set.has(addr)) && (icycle.force_treat_as_read ||
                    SM83T_pins_WRR(pins))) // If final set does npt have it and this is read or write
                {
                        final_set.add(addr);
                        final_RAMs.push([addr, val]);
                } else if (SM83T_pins_WRR(pins)) { // Else if this is a write (and final set already has it)
                    for (let j in final_RAMs) {
                        if (final_RAMs[j][0] === addr) {
                            final_RAMs[j][1] = val;
                            break;
                        }
                    }
                }
            }
        }
        initial_RAMs = initial_RAMs.sort((a, b) => {return a[0] - b[0]});
        final_RAMs = final_RAMs.sort((a, b) => {return a[0] - b[0]});
        this.initial.ram = initial_RAMs;
        this.final.ram = final_RAMs;
        //this.cycles = ocycles;
    }

    add_cycle(addr, val, RD, WR, MRQ, force_treat_as_read=false) {
        if (addr === null) {
            addr = this.last_addr;
        }
        if (val === null) {
            val = this.last_val;
        }
        this.last_addr = addr;
        this.last_val = val;
        this.cycles.add(addr, val, RD, WR, MRQ, force_treat_as_read);
    }
}

class SM83T_F {
    constructor(from=0) {
        this.Z = 0;
        this.N = 0;
        this.H = 0;
        this.C = 0;
        this.setbyte(from);
    }

    getbyte() {
        return (this.C << 4) | (this.H << 5) | (this.N << 6) | (this.Z << 7);
    }

    setbyte(val) {
        this.C = (val & 0x10) >>> 4;
        this.H = (val & 0x20) >>> 5;
        this.N = (val & 0x40) >>> 6;
        this.Z = (val & 0x80) >>> 7;
    }
}

class SM83T_state {
    constructor(from=null) {
        if (from === null) {
            this.A = 0;
            this.B = 0;
            this.C = 0;
            this.D = 0;
            this.E = 0;
            this.F = new SM83T_F();
            this.H = 0;
            this.L = 0;

            this.SP = 0;
            this.PC = 0;

            this.IME = 0;
            this.EI = 0;
        }
        else {
            this.A = from.a;
            this.B = from.b;
            this.C = from.c;
            this.D = from.d;
            this.E = from.e;
            this.F = new SM83T_F(from.f);
            this.H = from.h;
            this.L = from.l;

            this.SP = from.sp;
            this.PC = from.pc;

            this.IME = from.ime;
            this.EI = from.ei;
        }
        this.junkvar = 0;
    }

    test_bounds() {
        if (!ckrange(this.PC, 0, 65535)) return false;
        if (!ckrange(this.SP, 0, 65535)) return false;
        if (!ckrange(this.A, 0, 255)) return false;
        if (!ckrange(this.B, 0, 255)) return false;
        if (!ckrange(this.C, 0, 255)) return false;
        if (!ckrange(this.D, 0, 255)) return false;
        if (!ckrange(this.E, 0, 255)) return false;
        if (!ckrange(this.H, 0, 255)) return false;
        if (!ckrange(this.L, 0, 255)) return false;
        if (!ckrange(this.F.getbyte(), 0, 255)) debugger;
        if (!ckrange(this.F.C, 0, 1)) return false;
        if (!ckrange(this.F.H, 0, 1)) return false;
        if (!ckrange(this.F.N, 0, 1)) return false;
        if (!ckrange(this.F.Z, 0, 1)) return false;
        return true;
    }

    dump_to(where) {
        where.a = this.A;
        where.b = this.B;
        where.c = this.C;
        where.d = this.D;
        where.e = this.E;
        where.f = this.F.getbyte();
        where.h = this.H;
        where.l = this.L;

        where.pc = this.PC;
        where.sp = this.SP;

        where.ime = this.IME;
        where.ei = this.EI;
    }

    inc_PC() {
        this.PC = (this.PC + 1) & 0xFFFF;
    }

    inc_SP() {
        this.SP = (this.SP + 1) & 0xFFFF;
    }

    dec_SP() {
        this.SP = (this.SP - 1) & 0xFFFF;
    }
}

function SM83_generate_registers(where) {
    where.pc = pt_rnd16();
    where.sp = pt_rnd16();
    where.a = pt_rnd8();
    where.b = pt_rnd8();
    where.c = pt_rnd8();
    where.d = pt_rnd8();
    where.e = pt_rnd8();
    where.f = pt_rnd8() & 0xF0;
    where.h = pt_rnd8();
    where.l = pt_rnd8();
    where.ime = pt_rnd1();
    where.ie = pt_rnd1();
}

class SM83_test_generator {
    constructor() {
        this.test = null;
        this.regs = new SM83T_state();

        this.already_done_addrs = {};

        this.rprefix = 0;
        this.prefix = 0;
    }

    push(val) { // Z80
        this.regs.dec_SP();
        this.write(this.regs.SP, (val & 0xFF00) >>> 8);
        this.regs.dec_SP();
        this.write(this.regs.SP, val & 0xFF);
    }

    pop() { // Z80
        let data = this.read(this.regs.SP);
        this.regs.inc_SP();
        data |= this.read(this.regs.SP) << 8;
        this.regs.inc_SP();
        return data;
    }

    read(wherefrom, val=null) {
        if (typeof wherefrom !== 'number') {
            wherefrom = this.readreg(wherefrom);
        }
        if (val === null) val = pt_rnd8();
        wherefrom &= 0xFFFF;
        if (wherefrom in this.test.opcode_RAMs) {
            val = this.test.opcode_RAMs[wherefrom];
        }
        else if (wherefrom in this.already_done_addrs) {
            val = this.already_done_addrs[wherefrom];
        }
        if (!(wherefrom in this.already_done_addrs)) {
            this.already_done_addrs[wherefrom] = val;
        }
        this.test.add_cycle(wherefrom, val, 1, 0, 1, true);

        return val;
    }

    write(addr, val) {
        if (typeof addr !== 'number') {
            addr = this.readreg(addr);
        }
        //if (addr === 0xCA5D) debugger;
        addr &= 0xFFFF;
        val &= 0xFF;
        if (addr in this.test.opcode_RAMs) {
            delete this.test.opcode_RAMs[addr];
        }
        this.test.add_cycle(addr, val, 0, 1, 1);
    }

    store(addr, val) {
        this.write(addr, val & 0xFF);
        this.write((addr + 1) & 0xFFFF, (val & 0xFF00) >>> 8);
    }

    operand() {
        let r = this.read(this.regs.PC);
        this.regs.inc_PC();
        return r;
    }

    operands() {
        let r = this.operand();
        return r | (this.operand() << 8);
    }

    wait(howlong) {
        for (let i = 0; i < howlong; i++) {
            this.test.add_cycle(null, null, 0, 0, 0);
        }
    }

    fetch_opcode(opcode_stream, i, less_one_cycle=false, rfsh=true) {
        this.test.add_cycle(this.regs.PC, opcode_stream[i], 1, 0, 1, 0);
        this.regs.PC = (this.regs.PC + 1) & 0xFFFF;
        return opcode_stream[i];
    }

    writereg(what, val) {
        switch (what) {
            case '_':
                this.regs.junkvar = val;
                break;
            case 'A':
                this.regs.A = val & 0xFF;
                break;
            case 'B':
                this.regs.B = val & 0xFF;
                break;
            case 'C':
                this.regs.C = val & 0xFF;
                break;
            case 'D':
                this.regs.D = val & 0xFF;
                break;
            case 'E':
                this.regs.E = val & 0xFF;
                break;
            case 'F':
                this.regs.F.setbyte(val & 0xFF);
                break;
            case 'H':
                this.regs.H = val & 0xFF;
                break;
            case 'L':
                this.regs.L = val & 0xFF;
                break;
            case 'SP':
                this.regs.SP = val;
                break;
            case 'AF':
                this.regs.A = (val & 0xFF00) >>> 8;
                this.regs.F.setbyte(val & 0xFF);
                break;
            case 'BC':
                this.regs.B = (val & 0xFF00) >>> 8;
                this.regs.C = val & 0xFF;
                break;
            case 'DE':
                this.regs.D = (val & 0xFF00) >>> 8;
                this.regs.E = val & 0xFF;
                break;
            case 'HL':
                this.regs.H = (val & 0xFF00) >>> 8;
                this.regs.L = val & 0xFF;
                break;
            default:
                console.log('MISSING REGWRITE', what);
                break;
        }
    }

    readreg(what) {
        switch(what) {
            case 'A':
                return this.regs.A;
            case 'B':
                return this.regs.B;
            case 'C':
                return this.regs.C;
            case 'D':
                return this.regs.D;
            case 'E':
                return this.regs.E;
            case 'F':
                return this.regs.F.getbyte();
            case 'H':
                return this.regs.H;
            case 'L':
                return this.regs.L;
            case 'SP':
                return this.regs.SP;
            case 'AF':
                return (this.regs.A << 8) | this.regs.F.getbyte();
            case 'BC':
                return (this.regs.B << 8) | this.regs.C;
            case 'DE':
                return (this.regs.D << 8) | this.regs.E;
            case 'HL':
                return (this.regs.H << 8) | this.regs.L;
            case '_':
                return this.regs.junkvar;
            default:
                console.log('MISSING REGREAD', what);
                if (what === '_') debugger;
                return null;
        }
    }

    sZ(what) {
        this.regs.F.Z = +what;
    }

    sN(what) {
        this.regs.F.N = +what;
    }

    sH(what) {
        this.regs.F.H = +what;
    }

    sC(what) {
        this.regs.F.C = +what;
    }



    /*** ALGORITHMS ***/

    ADD(target, source, carry=0) {
        let x = (target + source + carry) & 0xFFFF;
        let y = ((target & 0x0F) + (source & 0x0F) + carry) & 0xFFFF;
        this.sC(x > 0xFF);
        this.sH(y > 0x0F);
        this.sN(0);
        this.sZ((x & 0xFF) === 0);
        return x;
    }

    AND(target, source) {
        target &= source;
        this.sC(0);
        this.sN(0);
        this.sH(1);
        this.sZ(target === 0);
        return target;
    }

    BIT(index, target) {
        this.sH(1);
        this.sN(0);
        this.sZ(((1 << index) & target) === 0)
    }

    CP(target, source) {
        let x = (target - source) & 0xFFFF;
        let y = ((target & 0x0F) - (source & 0x0F)) & 0xFFFF;
        this.sC(x > 0xFF);
        this.sH(y > 0x0F);
        this.sN(1);
        this.sZ((x & 0xFF) === 0);
    }

    DEC(target) {
        target = (target - 1) & 0xFF;
        this.sH((target & 0x0F) === 0x0F);
        this.sN(1);
        this.sZ(target === 0);
        return target;
    }

    INC(target) {
        target = (target + 1) & 0xFF;
        this.sH((target & 0x0F) === 0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    OR(target, source) {
        target |= source;
        this.sC(0);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    RL(target) {
        let carry = (target & 0x80) >>> 7;
        target = ((target << 1) | this.regs.F.C) & 0xFF;
        this.sC(carry);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    RLC(target) {
        target = ((target << 1) | (target >>> 7)) & 0xFF;
        this.sC(target & 1);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    RR(target) {
        let carry = target & 1;
        target = ((this.regs.F.C << 7) | (target >>> 1)) & 0xFF;
        this.sC(carry);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    RRC(target) {
        target = ((target << 7) | (target >>> 1)) & 0xFF;
        this.sC((target & 0x80) >>> 7);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    SLA(target) {
        let carry = (target & 0x80) >>> 7;
        target = (target << 1) & 0xFF;
        this.sC(carry);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    SRA(target) {
        let carry = target & 1;
        target = (target & 0x80) | (target >>> 1);
        this.sC(carry);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    SRL(target) {
        let carry = target & 1;
        target = target >>> 1;
        this.sC(carry);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    SUB(target, source, carry=0) {
        let x = (target - source - carry) & 0xFFFF;
        let y = ((target & 0x0F) - (source & 0x0F) - carry) & 0xFFFF;
        this.sC(x > 0xFF);
        this.sH(y > 0x0F);
        this.sN(1);
        x &= 0xFF;
        this.sZ(x === 0);
        return x;
    }

    SWAP(target) {
        target = ((target << 4) | (target >>> 4)) & 0xFF;
        this.sC(0);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    XOR(target, source) {
        target ^= source;
        this.sC(0);
        this.sH(0);
        this.sN(0);
        this.sZ(target === 0);
        return target;
    }

    idle() {
        this.test.add_cycle(null, null, 0, 0, 0)
    }

    /*** NOT-ALGORITHMS ***/
    ADC_di_da(target) {
        this.writereg(target, this.ADD(this.readreg(target), this.operand(), this.regs.F.C));
    }

    ADC_di_di(target, source) {
        this.writereg(target, this.ADD(this.readreg(target), this.readreg(source), this.regs.F.C));
    }

    ADC_di_ind(target, source) {
        this.writereg(target, this.ADD(this.readreg(target), this.read(source), this.regs.F.C));
    }

    ADD_di_da(target) {
        this.writereg(target, this.ADD(this.readreg(target), this.operand()));
    }

    ADD_di_di(target, source) {
        this.writereg(target, this.ADD(this.readreg(target), this.readreg(source)));
    }

    ADD16_di_di(target, source) {
        this.idle();
        let x = this.readreg(target) + this.readreg(source);
        let y = ((this.readreg(target) & 0xFFF) + (this.readreg(source) & 0xFFF));
        this.writereg(target, (x & 0xFFFF))
        this.sC(x > 0xFFFF);
        this.sH(y > 0xFFF);
        this.sN(0);
    }

    ADD_di_ind(target, source) {
        this.writereg(target, this.ADD(this.readreg(target), this.read(source)));
    }

    ADD_di_rel(target) {
        let data = this.operand();
        this.idle();
        this.idle();
        this.sC(((this.readreg(target) & 0xFF) + data) > 0xFF);
        this.sH(((this.readreg(target) & 0x0F) + (data & 0x0F)) > 0x0F);
        this.sN(0);
        this.sZ(0);
        this.writereg(target, (this.readreg(target) + mksigned8(data)) & 0xFFFF);
    }

    AND_di_da(target) {
        this.writereg(target, this.AND(this.readreg(target), this.operand()));
    }

    AND_di_di(target, source) {
        this.writereg(target, this.AND(this.readreg(target), this.readreg(source)));
    }

    AND_di_ind(target, source) {
        this.writereg(target, this.AND(this.readreg(target), this.read(source)));
    }

    BIT_idx_di(index, data) {
        this.BIT(index, this.readreg(data));
    }

    BIT_idx_ind(index, addr) {
        let data = this.read(this.readreg(addr));
        this.BIT(index, data);
    }

    CALL_cond_addr(take) {
        let addr = this.operands();
        if (!this.cond_eval(take)) return;
        this.idle();
        this.push(this.regs.PC);
        this.regs.PC = addr;
    }

    CCF() {
        this.regs.F.C = +(!(this.regs.F.C));
        this.sH(0);
        this.sN(0);
    }

    CP_di_da(target) {
        this.CP(this.readreg(target), this.operand());
    }

    CP_di_di(target, source) {
        this.CP(this.readreg(target), this.readreg(source));
    }

    CP_di_ind(target, source) {
        this.CP(this.readreg(target), this.read(source));
    }

    CPL() {
        this.regs.A ^= 0xFF;
        this.sH(1);
        this.sN(1);
    }

    DAA() {
        let a = this.regs.A;
        if (!this.regs.F.N) {
            if (this.regs.F.H || ((this.regs.A & 0x0F) > 0x09)) a += 0x06;
            if (this.regs.F.C || (this.regs.A > 0x99)) {
                a += 0x60;
                this.sC(1);
            }
        } else {
            if (this.regs.F.H) a -= 0x06;
            if (this.regs.F.C) a -= 0x60;
        }
        a &= 0xFFFF;
        this.regs.A = (a & 0xFF);
        this.sH(0);
        this.sZ(this.regs.A === 0);
    }

    DEC_di(data) {
        this.writereg(data, this.DEC(this.readreg(data)));
    }

    DEC16_di(data) {
        this.idle();
        this.writereg(data, (this.readreg(data) - 1) & 0xFFFF);
    }

    DEC_ind(addr) {
        let data = this.read(addr);
        this.write(addr, this.DEC(data));
    }

    DI() {
        this.regs.IME = 0;
    }

    EI() {
        this.regs.EI = 1;
    }

    HALT() {
        this.idle();
        this.idle();
    }

    INC_di(data) {
        this.writereg(data, this.INC(this.readreg(data)));
    }

    INC16_di(data) {
        this.idle();
        this.writereg(data, (this.readreg(data) + 1) & 0xFFFF);
    }

    INC_ind(addr) {
        let data = this.read(addr);
        this.write(addr, this.INC(data));
    }

    JP_cond_addr(take) {
        let addr = this.operands();
        if (!this.cond_eval(take)) return;
        this.idle();
        this.regs.PC = addr;
    }

    JP_di(data) {
        this.regs.PC = this.readreg(data);
    }

    JR_cond_rel(take) {
        let data = this.operand();
        if (!this.cond_eval(take)) return;
        this.idle();
        this.regs.PC = (this.regs.PC + mksigned8(data)) & 0xFFFF;
    }

    LD_addr_di(data) {
        this.write(this.operands(), this.readreg(data));
    }

    LD16_addr_di(data) {
        this.store(this.operands(), this.readreg(data));
    }

    LD_di_di(target, source) {
        this.writereg(target, this.readreg(source));
    }

    LD16_di_di(target, source) {
        this.idle();
        this.writereg(target, this.readreg(source));
    }

    LD_di_da(target) {
        this.writereg(target, this.operand());
    }

    LD16_di_da(target) {
        this.writereg(target, this.operands());
    }

    LD_di_addr(data) {
        this.writereg(data, this.read(this.operands()));
    }

    LD_di_di_rel(target, source) {
        let data = this.operand();
        this.idle();
        this.sC(((this.readreg(source) & 0xFF) + data) > 0xFF);
        this.sH(((this.readreg(source) & 0x0F) + (data & 0x0F)) > 0x0F);
        this.sN(0);
        this.sZ(0);
        this.writereg(target, (this.readreg(source) + mksigned8(data)) & 0xFFFF);
    }

    LD_di_ind(target, source) {
        this.writereg(target, this.read(source));
    }

    LD_di_ind_dec(target, source) {
        this.writereg(target, this.read(source));
        this.writereg(source, (this.readreg(source) - 1) & 0xFFFF);
    }

    LD_di_ind_inc(target, source) {
        this.writereg(target, this.read(source));
        this.writereg(source, (this.readreg(source) + 1) & 0xFFFF);
    }

    LD_ind_da(target) {
        this.write(this.readreg(target), this.operand());
    }

    LD_ind_di(target, source) {
        this.write(target, this.readreg(source));
    }

    LD_ind_dec_di(target, source) {
        this.write(target, this.readreg(source));
        this.writereg(target, (this.readreg(target) - 1) & 0xFFFF);
    }

    LD_ind_inc_di(target, source) {
        this.write(target, this.readreg(source));
        this.writereg(target, (this.readreg(target) + 1) & 0xFFFF);
    }

    LDH_addr_di(data) {
        this.write(0xFF00 | this.operand(), this.readreg(data));
    }

    LDH_di_addr(data) {
        this.writereg(data, this.read(0xFF00 | this.operand()));
    }

    LDH_di_ind(target, source) {
        this.writereg(target, this.read(0xFF00 | this.readreg(source)));
    }

    LDH_ind_di(target, source) {
        this.write(0xFF00 | this.readreg(target), this.readreg(source));
    }

    NOP() {

    }

    OR_di_da(target) {
        this.writereg(target, this.OR(this.readreg(target), this.operand()));
    }

    OR_di_di(target, source) {
        this.writereg(target, this.OR(this.readreg(target), this.readreg(source)));
    }

    OR_di_ind(target, source) {
        this.writereg(target, this.OR(this.readreg(target), this.read(source)));
    }

    POP_di(data) {
        this.writereg(data, this.pop());
    }

    POP_di_AF(data) {
        let t = this.pop();
        this.regs.A = (t & 0xFF00) >> 8;
        this.regs.F.setbyte(t & 0xF0);
    }

    PUSH_di(data) {
        this.idle();
        this.push(this.readreg(data));
    }

    RES_idx_di(index, data) {
        this.writereg(data, this.readreg(data) & ((1 << index) ^ 0xFF));
    }

    RES_idx_ind(index, addr) {
        this.write(addr, this.read(addr) & ((1 << index) ^ 0xFF));
    }

    RET() {
        let addr = this.pop();
        this.idle();
        this.regs.PC = addr;
    }

    RET_cond(take) {
        this.idle();
        if (!this.cond_eval(take)) return;
        this.regs.PC = this.pop();
        this.idle();
    }

    RETI() {
        let addr = this.pop();
        this.idle();
        this.regs.PC = addr;
        this.regs.IME = 1;
    }

    RL_di(data) {
        this.writereg(data, this.RL(this.readreg(data)));
    }

    RL_ind(addr) {
        this.write(addr, this.RL(this.read(addr)));
    }

    RLA() {
        this.regs.A = this.RL(this.regs.A);
        this.sZ(0);
    }

    RLC_di(data) {
        this.writereg(data, this.RLC(this.readreg(data)));
    }

    RLC_ind(addr) {
        this.write(addr, this.RLC(this.read(addr)));
    }

    RLCA() {
        this.regs.A = this.RLC(this.regs.A);
        this.sZ(0);
    }

    RR_di(data) {
        this.writereg(data, this.RR(this.readreg(data)));
    }

    RR_ind(addr) {
        this.write(addr, this.RR(this.read(addr)));
    }

    RRA() {
        this.regs.A = this.RR(this.regs.A);
        this.sZ(0);
    }

    RRC_di(data) {
        this.writereg(data, this.RRC(this.readreg(data)));
    }

    RRC_ind(addr) {
        this.write(addr, this.RRC(this.read(addr)));
    }

    RRCA() {
        this.regs.A = this.RRC(this.regs.A);
        this.sZ(0);
    }

    RST_imp(vector) {
        this.idle();
        this.push(this.regs.PC);
        this.regs.PC = vector;
    }

    SBC_di_da(target) {
        this.writereg(target, this.SUB(this.readreg(target), this.operand(), this.regs.F.C));
    }

    SBC_di_di(target, source) {
        this.writereg(target, this.SUB(this.readreg(target), this.readreg(source), this.regs.F.C));
    }

    SBC_di_ind(target, source) {
        this.writereg(target, this.SUB(this.readreg(target), this.read(source), this.regs.F.C));
    }

    SCF() {
        this.sC(1);
        this.sH(0);
        this.sN(0);
    }

    SET_idx_di(index, data) {
        this.writereg(data, this.readreg(data) | (1 << index));
    }

    SET_idx_ind(index, addr) {
        this.write(addr, this.read(addr) | (1 << index));
    }

    SLA_di(data) {
        this.writereg(data, this.SLA(this.readreg(data)));
    }

    SLA_ind(addr) {
        this.write(addr, this.SLA(this.read(addr)));
    }

    SRA_di(data) {
        this.writereg(data, this.SRA(this.readreg(data)));
    }

    SRA_ind(addr) {
        this.write(addr, this.SRA(this.read(addr)));
    }

    SRL_di(data) {
        this.writereg(data, this.SRL(this.readreg(data)));
    }

    SRL_ind(addr) {
        this.write(addr, this.SRL(this.read(addr)));
    }

    STOP() {
        this.idle();
        this.idle();
    }

    SUB_di_da(target) {
        this.writereg(target, this.SUB(this.readreg(target), this.operand()));
    }

    SUB_di_di(target, source) {
        this.writereg(target, this.SUB(this.readreg(target), this.readreg(source)));
    }

    SUB_di_ind(target, source) {
        this.writereg(target, this.SUB(this.readreg(target), this.read(source)));
    }

    SWAP_di(data) {
        this.writereg(data, this.SWAP(this.readreg(data)));
    }

    SWAP_ind(addr) {
        this.write(addr, this.SWAP(this.read(addr)));
    }

    XOR_di_da(target) {
        this.writereg(target, this.XOR(this.readreg(target), this.operand()));
    }

    XOR_di_di(target, source) {
        this.writereg(target, this.XOR(this.readreg(target), this.readreg(source)));
    }

    XOR_di_ind(target, source) {
        this.writereg(target, this.XOR(this.readreg(target), this.read(source)));
    }

    /*** STUFF FOR ACTUAL TESTING CREATION ***/
    cond_eval(cond) {
        let c;
        switch(cond) {
            case 1:
            case '1':
                c = true;
                break;
            case 'regs.F.Z === 0':
                c = this.regs.F.Z === 0;
                break;
            case 'regs.F.Z === 1':
                c = this.regs.F.Z === 1;
                break;
            case 'regs.F.C === 0':
                c = this.regs.F.C === 0;
                break;
            case 'regs.F.C === 1':
                c = this.regs.F.C === 1;
                break;
            default:
                console.log('NOT FOUND EVALS', cond);
                return null;
        }
        return c;
    }

    instruction(code) {
        let c = SM83_opcode_matrix[code];
        let fn = this[SM83_MN_R[c.ins]].bind(this);
        fn(c.arg1, c.arg2);
    }

    instructionCB(code) {
        let c = SM83_opcode_matrixCB[code];
        let fn = this[SM83_MN_R[c.ins]].bind(this);
        fn(c.arg1, c.arg2);
    }


    /**
     * @param opcode_stream {Uint8Array}
     * @param {Number} number
     * @param {String} osn
     */
    generate_test(opcode_stream, number, osn) {
        let tests = [];
        for (let testnum = 0; testnum < number; testnum++) {
            let opcode_stream_sum = opcode_stream[0];
            for (let i in opcode_stream) {
                let v = opcode_stream[i] + 1;
                if (v === 0) v = 7;
                opcode_stream_sum *= v;
                if ((i>0) && (i<3)) opcode_stream_sum += opcode_stream[i-1];
            }
            let seed = cyrb128(rand_seed + opcode_stream_sum + hex4(testnum));
            rand_seeded = sfc32(seed[0], seed[1], seed[2], seed[3]);
            this.test = new SM83_proc_test();
            SM83_generate_registers(this.test.initial);
            this.regs = new SM83T_state(this.test.initial);
            let ipc = this.regs.PC;
            for (let i =0; i < opcode_stream.length; i++) {
                if (i === 2) continue;
                this.test.opcode_RAMs[(i+this.regs.PC) & 0xFFFF] = opcode_stream[i];
            }
            let curd;

            this.prefix = 0;

            // read the opcode stream
            // 4 T-states for an opcode read

            curd = this.fetch_opcode(opcode_stream, 0);
            let operand;

            if (curd === 0xCB) { // with no prefix
                curd = this.fetch_opcode(opcode_stream, 1);
                this.instructionCB(curd);
            }
            else {
                this.instruction(curd);
            }

            //if ((opcode_stream[0] === 0xCB) && (opcode_stream[1] === 0x36) && (testnum === 763)) debugger;
            this.test.finalize(this.regs, ipc, opcode_stream);
            //let ns = osn + ' ' + ;
            /*let cbd = false;
            let prfx = false;
            for (let i in opcode_stream) {
                if (i !== '0') ns += ' ';
                if ((i === '0') && ((opcode_stream[i] === 0xDD) || (opcode_stream[i] === 0xFD))) prfx = true;
                if ((i === '1') && (opcode_stream[i] === 0xCB) && prfx) cbd = true;
                if (cbd && (i === '2') && (opcode_stream.length === 4)) {
                    // DDCB/FDCB opcodes
                    ns += '..';
                    continue;
                }
                if (!cbd && prfx && ((i === '2') || (i === '3'))) {
                    ns += '..';
                    continue;
                }
                ns += hex2(opcode_stream[i]);
            }*/
            this.test.name = osn + ' ' + hex4(testnum)
            tests.push(this.test.serializable());
        }
        return tests;
    }
}

function generate_SM83_tests(seed=null) {
    if (seed !== null) rand_seed = seed;
    rand_seed = 'yo';
    let os1 = new Uint8Array(1);
    let os2 = new Uint8Array(2);
    let os4 = new Uint8Array(4);
    let test_generator = new SM83_test_generator();


    let tests = {};
     //To test a specific test
    /*os2[0] = 0xED;
    os2[1] = 0x56;
    let n = 'ED 56';
    tests[n] = test_generator.generate_test(os2, 1, n);
    console.log(tests[n]);
    return;*/

    let opc_table;

    console.log('1/2 Generating regular opcodes...');
    opc_table = SM83_opcode_matrix;
    for (let i in opc_table) {
        if (i > 0xFF) continue;
        os1[0] = i;
        let n = hex2(parseInt(i));
        tests[n] = test_generator.generate_test(os1, SM83_NUM_TO_GENERATE, n);
    }

    console.log('2/2 Generating CB opcodes...');
    opc_table = SM83_opcode_matrixCB;
    for (let i in opc_table) {
        if (i > 0xFF) continue;
            os2[0] = 0xCB;
        os2[1] = i;
        let n = 'CB ' + hex2(parseInt(i));
        tests[n] = test_generator.generate_test(os2, SM83_NUM_TO_GENERATE, n);
    }

    console.log('Zipping tests...');
    let zip = new JSZip();
    for (let i in tests) {
        zip.file(i.toLowerCase() + '.json', JSON.stringify(tests[i]));
    }

    dconsole.addl(null,'Finalizing ZIP for download...')
    zip.generateAsync({type:"blob"}).then(function(content) {
        dconsole.addl(null, 'Downloading...');
        save_js("sm83 tests.zip", content, 'application/zip');
        dconsole.addl(null, 'Done!');
    });


}
