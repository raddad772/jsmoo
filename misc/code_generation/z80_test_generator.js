"use strict";

// This uses the Ares Z80 core, kinda. It was significantly restructured, obviously, but the original source is that.

/*
 A note on the format of the tests produced by this.

 Z80 is a bit complicated to test every opcode for, but I did it!

 That means opcodes are in the following format:

nn
CB nn
DD nn
FD nn
ED nn
DD CB __ nn
FD CB __ nn

where __ denotes a value that's not strictly part of the "opcode,"
and nn denotes the opcode being tested.
 Just add .json to the end, and you have the generated file.
example:

FD CB __ 04.json

 I have attempted to follow the ProcessorTests general format, as
laid out by Thomas Harte's ProcessorTests. That project has been
a huge help to me and can be found here:
https://github.com/TomHarte/ProcessorTests

The general test format looks like this:

{
"name": "DD CB __ 93 0000", // human-readable name
"initial": {      // initial state of Z80 registers and RAM
  "pc": 31234,
  "sp": 40332,
  "a": 237,   // A, B, C, etc. are stored as 8-bit values
  "b": 161,
  "c": 113,
  "d": 38,
  "e": 61,
  "f": 129,
  "h": 108,
  "l": 101,
  "i": 126,
  "r": 87,
  "ei": 1,      // EI refers to if Enable Interrupt was the last-emualted instruction. You can probably ignore this.
  "wz": 13187,
  "ix": 32970,
  "iy": 14777,
  "af_": 41627, // af_ etc. are the "shadow registers"
  "bc_": 38678,
  "de_": 21949,
  "hl_": 60947,
  "im": 1,
  "p": 1, // Used to track specific behavior during interrupt depending on if CMOS or not and previously-executed instructions. You can probably ignore this.
  "q": 0, // Used to track if the last-modified opcode modified flag registers (with a few exceptions). This is important because CCF will behave differently depending on this
  "iff1": 1,
  "iff2": 0,
  "ram": [ // Address, value pairs to initialize RAM
    [ 31234, 221 ],
    [ 31235, 203 ],
    [ 31236, 0 ],
    [ 31237, 147 ],
    [ 33075, 18 ]
  ]
},
"final": { // Expected final state of Z80 and RAM after instruction is executed
  "a": 237,
  "b": 161,
  "c": 113,
  "d": 38,
  "e": 18,
  "f": 129,
  "h": 108,
  "l": 101,
  "i": 126,
  "r": 89,
  "af_": 41627,
  "bc_": 38678,
  "de_": 21949,
  "hl_": 60947,
  "ix": 32970,
  "iy": 14777,
  "pc": 31238,
  "sp": 40332,
  "wz": 33075,
  "iff1": 1,
  "iff2": 0,
  "im": 1,
  "ei": 1,
  "p": 1,
  "q": 1,
  "ram": [
    [ 31234, 221 ],
    [ 31235, 203 ],
    [ 31236, 105 ],
    [ 31237, 147 ],
    [ 33075, 18 ]
  ]
},
"cycles": [ // Cycle-by-cycle breakdown of bus activity
  [ 31234, null, "----" ],
  [ 31234, null, "r-m-" ],
  [ 32343, 221, "-wm-" ],
  ....
  ]
},

The format of each cycle from left to right is:
Address pins
Data pins, if the value is important, or null if it doesn't matter.
State of ReaD(r), WRite(w), Memory request(m), and Io requst(i) pins, where the letter denotes it is asserted, and - denotes it is not.
 */

let Z80_DO_FULL_MEMCYCLES = false;
let Z80_DO_MEM_REFRESHES = true; // Put I/R on address bus
/*
 For convenience for my own emulator, MRQ/RD, MRQ/WR,
  IO/RD, and IO/WR only last 1 cycle, to cut down on
  emulation cost. I also do not trigger MRQ during
  REFRESH.

  Set Z80_DO_FULL_MEMCYCLES to true if you want the
   correct, harder-to-emulate and makes-no-real-difference
   behavior.
 */

let Z80_NUM_TO_GENERATE = 1000; // Generate 1 of each test
let Z80_NULL_WAIT_STATES = false;
const Z80_GEN_WAIT_HOW_LONG = 6; // 6 cycles of Wait are generated


const Z80T = Object.freeze({
    HL: 0,
    IX: 1,
    IY: 2,

    I_NORMAL: 0,
    I_CB: 1,
    I_CBd: 2,
    I_ED: 3
});


function ckrange(what, low, hi) {
    if (what < low) return false;
    if (what > hi) return false;
    return true;
}

class Z80_cycle {
    constructor(addr, val, RD, WR, MRQ, IO, force_treat_as_read) {
        this.addr = addr;
        this.val = val;
        this.pins = {
            RD: RD,
            WR: WR,
            MRQ: MRQ,
            IO: IO
        }
        this.force_treat_as_read = force_treat_as_read;
    }

    serializeable() {
        let ostr = '';
        ostr += this.pins.RD ? 'r' : '-';
        ostr += this.pins.WR ? 'w' : '-';
        ostr += this.pins.MRQ ? 'm' : '-';
        ostr += this.pins.IO ? 'i' : '-';
        return [this.addr, this.val, ostr];
    }
}

class Z80_t_states {
    constructor() {
        this.cycles = [];
        this.state = {
            RD: 0,
            WR: 0,
            MRQ: 0,
            IO: 0,
            addr: 0,
            D: 0
        }
    }

    add(addr, val, RD, WR, MRQ, IO, force_treat_as_read) {
        this.cycles.push(new Z80_cycle(addr, val, RD, WR, MRQ, IO, force_treat_as_read));
    }

    serializeable() {
        let out = [];
        for (let i in this.cycles) {
            out.push(this.cycles[i].serializeable());
        }
        return out;
    }
}

function Z80T_pins_RDR(pins) {
    return ((pins.indexOf('r') !== -1) && (pins.indexOf('m') !== -1));
}

function Z80T_pins_WRR(pins) {
    return ((pins.indexOf('w') !== -1) && (pins.indexOf('m') !== -1));
}

function Z80T_pins_RDIO(pins) {
    return ((pins.indexOf('r') !== -1) && (pins.indexOf('i') !== -1));
}

function Z80T_pins_WRIO(pins) {
    return ((pins.indexOf('w') !== -1) && (pins.indexOf('i') !== -1));
}

class Z80_proc_test {
    constructor() {
        // Serialized
        this.name = '';
        this.ports = [];
        this.initial = {};
        this.final = {};
        this.cycles = new Z80_t_states();

        this.opcode_RAMs = {};

        this.last_addr = null;
    }

    serializable() {
        let r = {
            name: this.name,
            initial: this.initial,
            final: this.final,
            cycles: this.cycles.serializeable()
        }
        if (this.ports.length > 0)
            r.ports = this.ports;
        return r;
    }

    finalize(regs, initial_PC, opcode_stream) {
        regs.dump_to(this.final);
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
                if (Z80T_pins_WRR(pins)) { // Write 0 to initial RAM if there isn't a value there
                    if (!initial_set.has(addr)) {
                        initial_set.add(addr);
                        initial_RAMs.push([addr, 0]);
                    }
                }
                if ((!final_set.has(addr)) && (icycle.force_treat_as_read ||
                    Z80T_pins_WRR(pins))) // If final set does npt have it and this is read or write
                {
                        final_set.add(addr);
                        final_RAMs.push([addr, val]);
                } else if (Z80T_pins_WRR(pins)) { // Else if this is a write (and final set already has it)
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

    add_port_in(addr, val) {
        this.last_addr = addr;
        this.ports.push([addr, val, 'r']);
    }

    add_port_out(addr, val) {
        this.last_addr = addr;
        this.ports.push([addr, val, 'w']);
    }

    add_cycle(addr, val, RD, WR, MRQ, IO, force_treat_as_read=false) {
        if (!Z80_NULL_WAIT_STATES) if (addr === null) addr = this.last_addr;
        this.last_addr = addr;
        this.cycles.add(addr, val, RD, WR, MRQ, IO, force_treat_as_read);
    }
}

class Z80T_F {
    constructor(from) {
        this.S = 0;
        this.Z = 0;
        this.Y = 0;
        this.H = 0;
        this.X = 0;
        this.PV = 0;
        this.N = 0;
        this.C = 0;
        this.setbyte(from);
    }

    getbyte() {
        return this.C | (this.N << 1) | (this.PV << 2) | (this.X << 3) | (this.H << 4) | (this.Y << 5) | (this.Z << 6) | (this.S << 7);
    }

    setbyte(val) {
        this.C = val & 1;
        this.N = (val & 2) >>> 1;
        this.PV = (val & 4) >>> 2;
        this.X = (val & 8) >>> 3;
        this.H = (val & 0x10) >>> 4;
        this.Y = (val & 0x20) >>> 5;
        this.Z = (val & 0x40) >>> 6;
        this.S = (val & 0x80) >>> 7;
    }
}

class Z80T_state {
    constructor(from=null) {
        if (from === null) {
            this.A = 0;
            this.B = 0;
            this.C = 0;
            this.D = 0;
            this.E = 0;
            this.F = new Z80T_F();
            this.H = 0;
            this.L = 0;
            this.I = 0;
            this.R = 0;

            this.AF_ = 0;
            this.BC_ = 0;
            this.DE_ = 0;
            this.HL_ = 0;

            this.IX = 0;
            this.IY = 0;

            this.SP = 0;
            this.PC = 0;

            this.IFF1 = 0;
            this.IFF2 = 0;

            this.IM = 0;

            // Internal status
            this.EI = 0;
            this.P = 0;
            this.Q = 0;
            this.sq = 0;

            this.WZ = 0;
            this.data = 0;
        }
        else {
            this.A = from.a;
            this.B = from.b;
            this.C = from.c;
            this.D = from.d;
            this.E = from.e;
            this.F = new Z80T_F(from.f);
            this.H = from.h;
            this.L = from.l;
            this.I = from.i;
            this.R = from.r;

            this.AF_ = from.af_;
            this.BC_ = from.bc_;
            this.DE_ = from.de_;
            this.HL_ = from.hl_;

            this.IX = from.ix;
            this.IY = from.iy;

            this.SP = from.sp;
            this.PC = from.pc;
            this.WZ = from.wz;

            this.IFF1 = from.iff1;
            this.IFF2 = from.iff2;

            this.IM = from.im;

            this.EI = from.ei;
            this.P = from.p;
            this.Q = from.q;
            this.sq = from.sq;
        }
        this.junkvar = 0;
    }

    test_bounds() {
        if (!ckrange(this.PC, 0, 65535)) return false;
        if (!ckrange(this.SP, 0, 65535)) return false;
        if (!ckrange(this.IX, 0, 65535)) return false;
        if (!ckrange(this.WZ, 0, 65535)) return false;
        if (!ckrange(this.IY, 0, 65535)) return false;
        if (!ckrange(this.AF_, 0, 65535)) return false;
        if (!ckrange(this.BC_, 0, 65535)) return false;
        if (!ckrange(this.DE_, 0, 65535)) return false;
        if (!ckrange(this.HL_, 0, 65535)) return false;
        if (!ckrange(this.A, 0, 255)) return false;
        if (!ckrange(this.B, 0, 255)) return false;
        if (!ckrange(this.C, 0, 255)) return false;
        if (!ckrange(this.D, 0, 255)) return false;
        if (!ckrange(this.E, 0, 255)) return false;
        if (!ckrange(this.H, 0, 255)) return false;
        if (!ckrange(this.L, 0, 255)) return false;
        if (!ckrange(this.I, 0, 255)) return false;
        if (!ckrange(this.R, 0, 255)) return false;
        if (!ckrange(this.F.S, 0, 1)) return false;
        if (!ckrange(this.F.Z, 0, 1)) return false;
        if (!ckrange(this.F.Y, 0, 1)) return false;
        if (!ckrange(this.F.H, 0, 1)) return false;
        if (!ckrange(this.F.X, 0, 1)) return false;
        if (!ckrange(this.F.PV, 0, 1)) return false;
        if (!ckrange(this.F.N, 0, 1)) return false;
        if (!ckrange(this.F.C, 0, 1)) return false;
        return true;
    }

    setXY(z) {
        this.F.X = (z & 8) >>> 3;
        this.F.Y = (z & 0x20) >>> 5;
    }

    setXYSZ(z) {
        this.setXY(z);
        this.setZ(z);
        this.setS(z);
    }

    parity(value) {
        value ^= value >>> 4;
        value ^= value >>> 2;
        value ^= value >>> 1;
        this.F.PV = +(!(value & 1));
    }

    setSZ(z) {
        this.setS(z);
        this.setZ(z);
    }

    setZ(z) {
        this.F.Z = +(z === 0);
    }

    setS(z) {
        this.F.S = (z & 0x80) >>> 7;
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

        where.i = this.I;
        where.r = this.R;

        where.af_ = this.AF_;
        where.bc_ = this.BC_;
        where.de_ = this.DE_;
        where.hl_ = this.HL_;

        where.ix = this.IX;
        where.iy = this.IY;
        where.pc = this.PC;
        where.sp = this.SP;
        where.wz = this.WZ;
        where.iff1 = this.IFF1;
        where.iff2 = this.IFF2;

        where.im = this.IM;
        where.ei = this.EI;
        where.p = this.P;
        where.q = this.Q;
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

    inc_R() {
        this.R = (this.R & 0x80) | ((this.R + 1) & 0x7F);
    }

    shadow_swap() {
        let BCt = (this.B << 8) | this.C;
        let DEt = (this.D << 8) | this.E;
        let HLt = (this.H << 8) | this.L;

        this.B = (this.BC_ & 0xFF00) >>> 8;
        this.C = this.BC_ & 0xFF;
        this.D = (this.DE_ & 0xFF00) >>> 8;
        this.E = this.DE_ & 0xFF;
        this.H = (this.HL_ & 0xFF00) >>> 8;
        this.L = this.HL_ & 0xFF;

        this.BC_ = BCt;
        this.DE_ = DEt;
        this.HL_ = HLt;
    }

    shadow_swap_af() {
        let AFt = (this.A << 8) | this.F.getbyte();

        this.A = (this.AF_ & 0xFF00) >>> 8;
        this.F.setbyte(this.AF_ & 0xFF);

        this.AF_ = AFt;
    }
}

function Z80_generate_registers(where) {
    where.pc = pt_rnd16();
    where.sp = pt_rnd16();
    where.a = pt_rnd8();
    where.b = pt_rnd8();
    where.c = pt_rnd8();
    where.d = pt_rnd8();
    where.e = pt_rnd8();
    where.f = pt_rnd8();
    where.h = pt_rnd8();
    where.l = pt_rnd8();
    where.i = pt_rnd8();
    where.r = pt_rnd8() & 0x7F;

    where.ei = pt_rnd8() & 1;

    where.wz = pt_rnd16();
    where.ix = pt_rnd16();
    where.iy = pt_rnd16();

    where.af_ = pt_rnd16();
    where.bc_ = pt_rnd16();
    where.de_ = pt_rnd16();
    where.hl_ = pt_rnd16();

    where.im = pt_rnd8() % 3;
    where.p = pt_rnd8() & 1;
    where.q = pt_rnd8() & 1;
    if (where.q !== 0) where.q = where.f;
    where.iff1 = pt_rnd8() & 1;
    where.iff2 = pt_rnd8() & 1;
}

class Z80_test_generator {
    constructor(CMOS=false) {
        this.test = null;
        this.regs = new Z80T_state();

        this.already_done_addrs = {};

        this.rprefix = 0;
        this.prefix = 0;

        this.CMOS = CMOS;
    }

    displace(x, wclocks=5) {
        if (this.rprefix !== Z80T.HL) {
            if ((x !== 'HL') && (x !== 'IX') && (x !== 'IY') && (x !== 'addr')) return this.readreg(x);
            let d = this.operand();
            this.wait(wclocks);
            this.regs.WZ = (this.readreg(x) + mksigned8(d)) & 0xFFFF;
            return this.regs.WZ;
        }
        return this.readreg(x);
    }

    push(val) {
        this.regs.dec_SP();
        this.write(this.regs.SP, (val & 0xFF00) >>> 8);
        this.regs.dec_SP();
        this.write(this.regs.SP, val & 0xFF);
    }

    pop() {
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
        //this.test.add_cycle(wherefrom & 0xFFFF, val, 'read');
        // MREQ at the end of 1 and 2
        // RD the same
        // value gated during 3
        if (Z80_DO_FULL_MEMCYCLES) {
            this.test.add_cycle(wherefrom, null, 1, 0, 1, 0);
            this.test.add_cycle(wherefrom, null, 1, 0, 1, 0);
            this.test.add_cycle(wherefrom, val, 0, 0, 0, 0, true);
        }
        else {
            // For convenience of emulation, we only MREQ on T2
            this.test.add_cycle(wherefrom, null, 0, 0, 0, 0);
            this.test.add_cycle(wherefrom, null, 1, 0, 1, 0);
            this.test.add_cycle(wherefrom, val, 0, 0, 0, 0, true);
        }

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
        // Data is present for all 3 cycles
        // MRQ for 1, 2
        // WR only on 2
        if (Z80_DO_FULL_MEMCYCLES) {
            this.test.add_cycle(addr, val, 0, 0, 1, 0);
            this.test.add_cycle(addr, val, 0, 1, 1, 0);
            this.test.add_cycle(addr, val, 0, 0, 0, 0);
        }
        else {
            // We only pulse both MRQ & WR, and only care about val then
            this.test.add_cycle(addr, null, 0, 0, 0, 0);
            this.test.add_cycle(addr, val, 0, 1, 1, 0);
            this.test.add_cycle(addr, null, 0, 0, 0, 0);
        }
    }

    in(addr) {
        let inval = pt_rnd8();
        // Addr on T1, T2, TW, T3
        // IORQ on T2, TW
        // RD on T2, TW
        // data latched on T3
        this.test.add_port_in(addr, inval);
        if (Z80_DO_FULL_MEMCYCLES) {
            this.test.add_cycle(addr, null, 0, 0, 0, 0);
            this.test.add_cycle(addr, null, 1, 0, 0, 1);
            this.test.add_cycle(addr, null, 1, 0, 0, 1);
            this.test.add_cycle(addr, inval, 0, 0, 0, 0);
        }
        else {
            // For convenience, we only pulse on wait cycle here
            this.test.add_cycle(addr, null, 0, 0, 0, 0);
            this.test.add_cycle(addr, null, 0, 0, 0, 0);
            this.test.add_cycle(addr, null, 1, 0, 0, 1);
            this.test.add_cycle(addr, inval, 0, 0, 0, 0);
        }

        return inval
    }

    out(addr, val) {
        // Addr present for T1, T2, TW, T3
        // WR for T2, TW
        // IO for T2, TW
        // data for T1, T2, TW, and T3
        this.test.add_port_out(addr, val);
        if (Z80_DO_FULL_MEMCYCLES) {
            this.test.add_cycle(addr, val, 0, 0, 0, 0);
            this.test.add_cycle(addr, val, 0, 1, 0, 1);
            this.test.add_cycle(addr, val, 0, 1, 0, 1);
            this.test.add_cycle(addr, val, 0, 0, 0, 0);
        }
        else {
            // For convenience, only pulse in TW and care about D in TW
            this.test.add_cycle(addr, null, 0, 0, 0, 0);
            this.test.add_cycle(addr, null, 0, 0, 0, 0);
            this.test.add_cycle(addr, val, 0, 1, 0, 1);
            this.test.add_cycle(addr, null, 0, 0, 0, 0);
        }
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
            this.test.add_cycle(null, null, 0, 0, 0, 0);
        }
    }

    fetch_opcode(opcode_stream, i, less_one_cycle=false, rfsh=true) {
        this.test.add_cycle(this.regs.PC, null, 0, 0, 0, 0);
        this.test.add_cycle(this.regs.PC, null, 1, 0, 1, 0);
        let s;
        if (Z80_DO_MEM_REFRESHES && rfsh) s = (this.regs.I << 8) | this.regs.R;
        else s = null;
        this.test.add_cycle(s, opcode_stream[i], 0, 0, (Z80_DO_FULL_MEMCYCLES && rfsh) ? 1 : 0, 0);
        if (!less_one_cycle) this.test.add_cycle(s, null, 0, 0, 0, 0);
        this.regs.PC = (this.regs.PC + 1) & 0xFFFF;
        return opcode_stream[i];
    }

    Q(w) {
        this.regs.sq = w;
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
            case '_H':
                this.regs.H = val & 0xFF;
                break;
            case '_L':
                this.regs.L = val & 0xFF;
                break;
            case 'H':
                switch(this.rprefix) {
                    case Z80T.HL:
                        this.regs.H = val & 0xFF;
                        break;
                    case Z80T.IX:
                        this.regs.IX = ((val & 0xFF) << 8) | (this.regs.IX & 0xFF);
                        break;
                    case Z80T.IY:
                        this.regs.IY = ((val & 0xFF) << 8) | (this.regs.IY & 0xFF);
                        break;
                }
                break;
            case 'L':
                switch(this.rprefix) {
                    case Z80T.HL:
                        this.regs.L = val & 0xFF;
                        break;
                    case Z80T.IX:
                        this.regs.IX = (this.regs.IX & 0xFF00) | (val & 0xFF);
                        break;
                    case Z80T.IY:
                        this.regs.IY = (this.regs.IY & 0xFF00) | (val & 0xFF);
                        break;
                }
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
            case '_HL':
                this.regs.H = (val & 0xFF00) >>> 8;
                this.regs.L = val & 0xFF;
                break;
            case 'HL':
                switch (this.rprefix) {
                    case Z80T.HL:
                        this.regs.H = (val & 0xFF00) >>> 8;
                        this.regs.L = val & 0xFF;
                        break;
                    case Z80T.IX:
                        this.regs.IX = val;
                        break;
                    case Z80T.IY:
                        this.regs.IY = val;
                        break;
                    default:
                        console.log('WAIT WHAT');
                        break;
                }
                break;
            case 'WZ':
                this.regs.WZ = val;
                break;
            case 'WZH':
                this.regs.WZ = ((val & 0xFF) << 8) | (this.regs.WZ & 0xFF);
                break;
            case 'WZL':
                this.regs.WZ = (this.regs.WZ & 0xFF00) | (val & 0xFF);
                break;
            case 'I':
                this.regs.I = val & 0xFF;
                break;
            case 'R':
                this.regs.R = val & 0xFF;
                break;
            case 'AF_':
                this.regs.AF_ = val;
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
            case '_H':
                return this.regs.H;
            case '_L':
                return this.regs.L;
            case 'H':
                switch(this.rprefix) {
                    case Z80T.HL:
                        return this.regs.H;
                    case Z80T.IX:
                        return (this.regs.IX & 0xFF00) >>> 8;
                    case Z80T.IY:
                        return (this.regs.IY & 0xFF00) >>> 8;
                    default:
                        console.log('IUHOH1');
                        return null;
                }
            case 'L':
                switch(this.rprefix) {
                    case Z80T.HL:
                        return this.regs.L;
                    case Z80T.IX:
                        return this.regs.IX & 0xFF;
                    case Z80T.IY:
                        return this.regs.IY & 0xFF;
                    default:
                        console.log('IUHOH2');
                        return null;
                }
            case 'SP':
                return this.regs.SP;
            case 'AF':
                return (this.regs.A << 8) | this.regs.F.getbyte();
            case 'BC':
                return (this.regs.B << 8) | this.regs.C;
            case 'DE':
                return (this.regs.D << 8) | this.regs.E;
            case '_HL':
                return (this.regs.H << 8) | this.regs.L;
            case 'HL':
                switch(this.rprefix) {
                    case Z80T.HL:
                        return (this.regs.H << 8) | this.regs.L;
                    case Z80T.IX:
                        return this.regs.IX;
                    case Z80T.IY:
                        return this.regs.IY;
                    default:
                        console.log('IUHOH3');
                        return null;
                }
            case 'WZ':
                return this.regs.WZ;
            case 'WZH':
                return (this.regs.WZ & 0xFF00) >>> 8;
            case 'WZL':
                return this.regs.WZ & 0xFF;
            case 'I':
                return this.regs.I;
            case 'R':
                return this.regs.R;
            case 'AF_':
                return this.regs.AF_;
            case '_':
                return this.regs.junkvar;
            default:
                console.log('MISSING REGREAD', what);
                if (what === '_') debugger;
                return null;
        }
    }

    /*** ALGORITHMS ***/
    ADD(x, y, c=0) {
        let z = x + y + c;

        this.regs.F.C = +(z > 0xFF);
        z &= 0xFF;
        this.regs.F.N = 0;
        this.regs.F.PV = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
        this.regs.F.H = ((x ^ y ^ z) & 0x10) >>> 4;
        this.regs.setXYSZ(z);

        return z;
    }

    AND(x, y) {
        let z = x & y;

        this.regs.F.C = this.regs.F.N = 0;
        this.regs.parity(z);
        this.regs.F.H = 1;
        this.regs.setXYSZ(z);

        return z;
    }

    BIT(bit, x) {
        let z = x & (1 << parseInt(bit));
        this.regs.F.N = 0;
        this.regs.F.H = 1;
        this.regs.parity(z);
        this.regs.setXY(x);
        this.regs.setSZ(z);

        return x;
    }

    CP(x, y) {
        let z = (x - y) & 0x1FF;

        this.regs.F.C = +(z > 0xFF);
        z &= 0xFF;
        this.regs.F.N = 1;
        this.regs.setXY(y);
        this.regs.setSZ(z);
        this.regs.F.PV = (((x ^ y) & (x ^ z)) & 0x80) >>> 7;
        this.regs.F.H = ((x ^ y ^ z) & 0x10) >>> 4;
    }

    DEC(x) {
        let z = (x - 1) & 0xFF;

        this.regs.F.N = 1;
        this.regs.F.PV = +(z === 0x7F);
        this.regs.setXYSZ(z);
        this.regs.F.H = +((z & 0x0F) === 0x0F);

        return z;
    }

    IN(x) {
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(x);
        this.regs.setXYSZ(x);

        return x;
    }

    INC(x) {
        let z = (x + 1) & 0xFF;

        this.regs.F.N = 0;
        this.regs.F.PV = +(z === 0x80);
        this.regs.setXYSZ(z);
        this.regs.F.H = +((z & 0x0F) === 0);

        return z;
    }

    OR(x, y) {
        let z = x | y;

        this.regs.F.C = this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(z);
        this.regs.setXYSZ(z);

        return z;
    }

    RES(bit, x) {
        x &= ((1 << parseInt(bit)) ^ 0xFF);
        return x;
    }

    RL(x) {
        let c = (x & 0x80) >>> 7;
        x = ((x << 1) | this.regs.F.C) & 0xFF;

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(x);
        this.regs.setXYSZ(x);

        return x;
    }

    RLC(x) {
        x = ((x << 1) | (x >>> 7)) & 0xFF;

        this.regs.F.C = x & 1;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(x);
        this.regs.setXYSZ(x);

        return x;
    }

    RR(x) {
        let c = x & 1;
        x = ((x >>> 1) | (this.regs.F.C << 7)) & 0xFF;

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(x);
        this.regs.setXYSZ(x);

        return x;
    }

    RRC(x) {
        x = ((x >>> 1) | (x << 7)) & 0xFF;

        this.regs.F.C = (x & 0x80) >>> 7;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(x);
        this.regs.setXYSZ(x);

        return x;
    }

    SET(bit, x) {
        x |= (1 << parseInt(bit));
        return x;
    }

    SLA(x) {
        let c = (x & 0x80) >>> 7;
        x = (x << 1) & 0xFF;

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(x);
        this.regs.setXYSZ(x);

        return x;
    }

    SLL(x) {
        let c = (x & 0x80) >>> 7;
        x = ((x << 1) | 1) & 0xFF;

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(x);
        this.regs.setXYSZ(x);

        return x;
    }

    SRA(x) {
        let c = x & 1;
        x = (x & 0x80) | (x >> 1);

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(x);
        this.regs.setXYSZ(x);

        return x;
    }

    SRL(x) {
        let c = x & 1;
        x = (x >>> 1);

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(x);
        this.regs.setXYSZ(x);

        return x;
    }

    SUB(x, y, c=0) {
        let z = (x - y - c) & 0x1FF;

        this.regs.F.C = +(z > 0xFF);
        z &= 0xFF;
        this.regs.F.N = 1;
        this.regs.F.PV = (((x ^ y) & (x ^ z)) & 0x80) >>> 7;
        this.regs.F.H = ((x ^ y ^ z) & 0x10) >>> 4;
        this.regs.setXYSZ(z);

        return z;
    }

    XOR(x, y) {
        let z = x ^ y;

        this.regs.F.C = this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(z);
        this.regs.setXYSZ(z);

        return z;
    }


    /*** NOT-ALGORITHMS ***/

    ADC_a_irr(x) {
        this.Q(1);
        this.regs.A = this.ADD(this.regs.A, this.read(this.displace(x)), this.regs.F.C);
    }

    ADC_a_n() {
        this.Q(1);
        this.regs.A = this.ADD(this.regs.A, this.operand(), this.regs.F.C);
    }

    ADC_a_r(x) {
        this.Q(1);
        this.regs.A = this.ADD(this.regs.A, this.readreg(x), this.regs.F.C);
    }

    ADC_hl_rr(x) {
        this.Q(1);
        this.regs.WZ = (this.readreg('HL') + 1) & 0xFFFF;
        this.wait(4);
        let lo = this.ADD(this.readreg('L'), this.readreg(x) & 0xFF, this.regs.F.C);
        this.wait(3);
        let hi = this.ADD(this.readreg('H'), (this.readreg(x) >>> 8) & 0xFF, this.regs.F.C);
        this.writereg('HL', (hi << 8) | lo);
        this.regs.F.Z = +(this.readreg('HL') === 0);
    }

    ADD_a_irr(x) {
        this.Q(1);
        this.regs.A = this.ADD(this.regs.A, this.read(this.displace(x)));
    }

    ADD_a_n() {
        this.Q(1);
        this.regs.A = this.ADD(this.regs.A, this.operand());
    }

    ADD_a_r(x) {
        this.Q(1);
        this.regs.A = this.ADD(this.regs.A, this.readreg(x));
    }

    ADD_hl_rr(x) {
        this.Q(1);
        this.regs.WZ = (this.readreg('HL') + 1) & 0xFFFF;
        let pvf = this.regs.F.PV;
        let zf = this.regs.F.Z;
        let sf = this.regs.F.S;
        x = this.readreg(x);
        this.wait(4);
        let lo = this.ADD(this.readreg('L'), x & 0xFF);
        this.wait(3);
        let hi = this.ADD(this.readreg('H'), (x & 0xFF00) >>> 8, this.regs.F.C);
        this.writereg('HL', (hi << 8) | lo);
        this.regs.F.PV = pvf;
        this.regs.F.Z = zf;
        this.regs.F.S = sf;
    }

    AND_a_irr(x) {
        this.Q(1);
        this.regs.A = this.AND(this.regs.A, this.read(this.displace(x)));
    }

    AND_a_n() {
        this.Q(1);
        this.regs.A = this.AND(this.regs.A, this.operand());
    }

    AND_a_r(x) {
        this.Q(1);
        this.regs.A = this.AND(this.regs.A, this.readreg(x));
    }

    BIT_o_irr(bit, addr) {
        this.Q(1);
        this.BIT(bit, this.read(addr));
        this.wait(1);
        this.regs.setXY(this.readreg('WZH'));
    }

    BIT_o_irr_r(bit, addr, dontcare) {
        this.Q(1);
        this.wait(2);
        this.BIT(bit, this.read(addr));
        this.wait(1);
        this.regs.setXY(this.readreg('WZH'));
    }

    BIT_o_r(bit, x) {
        this.Q(1);
        this.BIT(bit, this.readreg(x));
    }

    CALL_c_nn(cond) {
        this.Q(0);
        this.regs.WZ = this.operands();
        if (!this.cond_eval(cond)) return;
        this.wait(1);
        this.push(this.regs.PC);
        this.regs.PC = this.regs.WZ;
    }

    CALL_nn() {
        this.Q(0);
        this.regs.WZ = this.operands();
        this.wait(1);
        this.push(this.regs.PC);
        this.regs.PC = this.regs.WZ;
    }

    CCF() {
        if (this.regs.Q !== 0) { this.regs.F.X = this.regs.F.Y = 0; }
        this.regs.F.H = this.regs.F.C;
        this.regs.F.C ^= 1;
        this.regs.F.N = 0;
        this.regs.F.X = ((this.regs.F.getbyte() | this.regs.A) & 0x08) >>> 3;
        this.regs.F.Y = ((this.regs.F.getbyte() | this.regs.A) & 0x20) >>> 5;
        this.Q(1);
    }

    CP_a_irr(x) {
        this.Q(1);
        this.CP(this.regs.A, this.read(this.displace(x)));
    }

    CP_a_n() {
        this.Q(1);
        this.CP(this.regs.A, this.operand());
    }

    CP_a_r(x) {
        this.Q(1);
        this.CP(this.regs.A, this.readreg(x));
    }

    CPD() {
        this.Q(1);
        this.regs.WZ = (this.regs.WZ - 1) & 0xFFFF;
        let ta = this.readreg('_HL');
        let data = this.read(ta);
        ta = (ta - 1) & 0xFFFF;
        this.writereg('_HL', ta);
        this.wait(5);
        let n = (this.regs.A - data) & 0xFF;
        this.regs.F.N = 1;
        ta = (this.readreg('BC') - 1) & 0xFFFF;
        this.writereg('BC', ta);
        this.regs.F.PV = +(ta !== 0);
        this.regs.F.H = ((this.regs.A ^ data ^ n) & 0x10) >>> 4;
        this.regs.F.X = ((n - this.regs.F.H) & 8) >>> 3;
        this.regs.F.Y = ((n - this.regs.F.H) & 2) >>> 1;
        this.regs.setSZ(n);
    }

    CPDR() {
        this.Q(1);
        this.CPD();

        if (((this.regs.B === 0) && (this.regs.C === 0)) || (this.regs.F.Z)) return;
        this.wait(5);
        this.regs.PC = (this.regs.PC - 2) & 0xFFFF;
        this.regs.WZ = (this.regs.PC + 1) & 0xFFFF;
        this.regs.F.X = (this.regs.PC >>> 11) & 1;
        this.regs.F.Y = (this.regs.PC >>> 13) & 1;
    }

    CPI() {
        this.Q(1);
        this.regs.WZ = (this.regs.WZ + 1) & 0xFFFF;
        let ta = this.readreg('_HL');
        let data = this.read(ta);
        ta = (ta + 1) & 0xFFFF;
        this.writereg('_HL', ta);
        this.wait(5);
        let n = (this.regs.A - data) & 0xFF;
        this.regs.F.N = 1;
        ta = (this.readreg('BC') - 1) & 0xFFFF;
        this.writereg('BC', ta);
        this.regs.F.PV = +(ta !== 0);
        this.regs.F.H = ((this.regs.A ^ data ^ n) & 0x10) >>> 4;
        this.regs.F.X = ((n - this.regs.F.H) & 8) >>> 3;
        this.regs.F.Y = ((n - this.regs.F.H) & 2) >>> 1;

        this.regs.setSZ(n);
    }

    CPIR() {
        this.Q(1);
        this.CPI();

        if (((this.regs.B === 0) && (this.regs.C === 0)) || (this.regs.F.Z)) return;
        this.wait(5);
        this.regs.PC = (this.regs.PC - 2) & 0xFFFF;
        this.regs.WZ = (this.regs.PC + 1) & 0xFFFF;
        this.regs.F.X = (this.regs.PC >>> 11) & 1;
        this.regs.F.Y = (this.regs.PC >>> 13) & 1;
    }

    CPL() {
        this.Q(1);
        this.regs.A ^= 0xFF;

        this.regs.F.N = this.regs.F.H = 1;
        this.regs.setXY(this.regs.A);
    }

    DAA() {
        this.Q(1);
        let a = this.regs.A;
        if (this.regs.F.C || (this.regs.A > 0x99)) { this.regs.A = (this.regs.A + (this.regs.F.N ? -0x60 : 0x60)) & 0xFF; this.regs.F.C = 1; }
        if (this.regs.F.H || ((this.regs.A & 0x0F) > 0x09)) { this.regs.A = (this.regs.A + (this.regs.F.N ? -0x06: 0x06)) & 0xFF; }

        this.regs.parity(this.regs.A);
        this.regs.setXYSZ(this.regs.A);
        this.regs.F.H = ((this.regs.A ^ a) & 0x10) >>> 4;
    }

    DEC_irr(x) {
        this.Q(1);
        let addr = this.displace(x);
        let data = this.read(addr);
        this.wait(1);
        this.write(addr, this.DEC(data));
    }

    DEC_r(x) {
        this.Q(1);
        this.writereg(x, this.DEC(this.readreg(x)));
    }

    DEC_rr(x) {
        this.Q(0);
        this.wait(2);
        this.writereg(x, (this.readreg(x) - 1) & 0xFFFF);
    }

    DI() {
        this.Q(0);
        this.regs.IFF1 = this.regs.IFF2 = 0;
    }

    DJNZ_e() {
        this.Q(0);
        this.wait(1);
        let displacement = mksigned8(this.operand());
        this.regs.B = (this.regs.B - 1) & 0xFF;
        if (this.regs.B === 0) return;
        this.wait(5);
        this.regs.WZ = (this.regs.PC + displacement) & 0xFFFF;
        this.regs.PC = this.regs.WZ;
    }

    EI() {
        this.Q(0);
        this.regs.IFF1 = this.regs.IFF2 = 1;
        this.regs.EI = 1;
    }

    EX_irr_rr(x, y) {
        this.Q(0);
        x = this.readreg(x);
        let WZL = this.read(x)
        let WZH = this.read((x+1) & 0xFFFF);
        this.writereg('WZ', (WZH << 8) | WZL);
        this.wait(1);
        this.write(x, this.readreg(y) & 0xFF);
        this.write((x+1) & 0xFFFF, (this.readreg(y) & 0xFF00) >>> 8);
        this.wait(2);
        this.writereg(y, this.regs.WZ);
    }

    EX_rr_rr(x, y) {
        this.Q(0);
        let tmp = this.readreg(x); // tmp = x
        this.writereg(x, this.readreg(y)); // x = y
        this.writereg(y, tmp); // y = tmp
    }

    EXX() {
        this.Q(0);
        this.regs.shadow_swap();
    }

    HALT() {
        this.Q(0);
        //this.regs.PC = (this.regs.PC - 1) & 0xFFFF;
        //this.regs.HALT = 1;
    }

    IM_o(code) {
        this.Q(0);
        this.regs.IM = parseInt(code);
    }

    IN_a_in() {
        this.Q(0);
        let WZL = this.operand();
        let WZH = this.regs.A;
        this.writereg('WZ', (WZH << 8) | WZL);
        this.regs.A = this.in(this.regs.WZ);
        this.regs.WZ = (this.regs.WZ + 1) & 0xFFFF;
    }

    IN_r_ic(x) {
        this.Q(1);
        this.regs.WZ = (this.readreg('BC') + 1) & 0xFFFF;
        this.writereg(x, this.IN(this.in(this.readreg('BC'))));
        //this.regs.WZ = (this.readreg('BC') + 1) & 0xFFFF;
    }

    IN_ic() {
        this.Q(1)
        this.IN(this.in(this.readreg('BC')));
        this.regs.WZ = (this.readreg('BC') + 1) & 0xFFFF;
    }

    INC_irr(x) {
        this.Q(1);
        let addr = this.displace(x);
        let data = this.read(addr);
        this.wait(1);
        this.write(addr, this.INC(data));
    }

    INC_r(x) {
        this.Q(1);
        this.writereg(x, this.INC(this.readreg(x)));
    }

    INC_rr(x) {
        this.Q(0);
        this.wait(2);
        this.writereg(x, (this.readreg(x) + 1) & 0xFFFF);
    }

    IND() {
        this.Q(1);
        this.regs.WZ = (this.readreg('BC') - 1) & 0xFFFF;
        this.wait(1);
        let data = this.in((this.regs.WZ + 1) & 0xFFFF);
        this.regs.data = data;
        this.regs.B = (this.regs.B - 1) & 0xFF;
        let ta = this.readreg('_HL');
        this.write(ta, data);
        ta = (ta - 1) & 0xFFFF;
        this.writereg('_HL', ta);
        this.regs.F.C = ((((this.regs.C - 1) & 0xFF) + data) & 0x100) >>> 8;
        this.regs.F.N = (data & 0x80) >>> 7;
        this.regs.parity((((this.regs.C - 1) & 0xFF) + data & 7 ^ this.regs.B) & 0xFF);
        this.regs.setXYSZ(this.regs.B);
        this.regs.F.H = this.regs.F.C;
    }

    INDR() {
        this.Q(1);
        this.IND();
        if (this.regs.B === 0) return;
        this.wait(5);
        this.regs.PC = (this.regs.PC - 2) & 0xFFFF;
        this.regs.WZ = (this.regs.PC + 1) & 0xFFFF;
        this.post_IN_O_R();
    }

    INI() {
        this.Q(1);
        this.regs.WZ = (this.readreg('BC') + 1) & 0xFFFF;
        this.wait(1);
        let data = this.in((this.regs.WZ - 1) & 0xFFFF);
        this.regs.data = data;
        this.regs.B = (this.regs.B - 1) & 0xFF;
        let ta = this.readreg('_HL');
        this.write(ta, data);
        ta = (ta + 1) & 0xFFFF;
        this.writereg('_HL', ta);
        this.regs.F.C = +((((this.regs.C + 1) & 0xFF) + data) > 0xFF);
        this.regs.F.N = (data & 0x80) >>> 7;
        this.regs.parity((((this.regs.C + 1) & 0xFF) + data & 7 ^ this.regs.B) & 0xFF);
        this.regs.setXYSZ(this.regs.B);
        this.regs.F.H = this.regs.F.C;
    }

    INIR() {
        this.Q(1);
        this.INI();
        if (this.regs.B === 0) return;
        this.wait(5);
        this.regs.PC = (this.regs.PC - 2) & 0xFFFF;
        this.regs.WZ = (this.regs.PC + 1) & 0xFFFF;
        this.post_IN_O_R();
    }

    post_IN_O_R() {
        // Post IN O R with latest Z80 research
        this.regs.F.X = (this.regs.PC >>> 11) & 1;
        this.regs.F.Y = (this.regs.PC >>> 13) & 1;
        if (this.regs.F.C) {
            if (this.regs.data & 0x80) {
                this.regs.F.PV ^= Z80_parity((this.regs.B - 1) & 7) ^ 1;
                this.regs.F.H = +((this.regs.B & 0x0F) === 0);
            } else {
                this.regs.F.PV ^= Z80_parity((this.regs.B + 1) & 7) ^ 1;
                this.regs.F.H = +((this.regs.B & 0x0F) === 0x0F);
            }
        } else {
            this.regs.F.PV ^= Z80_parity(this.regs.B & 7) ^ 1;
        }
    }

    JP_c_nn(cond) {
        this.Q(0);
        this.regs.WZ = this.operands();
        if (this.cond_eval(cond)) this.regs.PC = this.regs.WZ;
    }

    JP_rr(x) {
        this.Q(0);
        this.regs.PC = this.readreg(x);
    }

    JR_c_e(cond) {
        this.Q(0);
        let displacement = mksigned8(this.operand());
        if (!this.cond_eval(cond)) return;
        this.wait(5);
        this.regs.WZ = (this.regs.PC + displacement) & 0xFFFF;
        this.regs.PC = this.regs.WZ;
    }

    LD_a_inn() {
        this.Q(0);
        this.regs.WZ = this.operands();
        this.regs.A = this.read(this.regs.WZ);
        this.regs.WZ = (this.regs.WZ + 1) & 0xFFFF;
    }

    LD_a_irr(x) {
        this.Q(0);
        this.regs.WZ = this.readreg(x);
        this.regs.A = this.read(this.regs.WZ);
        this.regs.WZ = (this.regs.WZ + 1) & 0xFFFF;
    }

    LD_inn_a() {
        this.Q(0);
        this.regs.WZ = this.operands();
        this.write(this.regs.WZ, this.regs.A);
        this.regs.WZ = (this.regs.A << 8) | ((this.regs.WZ + 1) & 0xFF);
    }

    LD_inn_rr(x) {
        this.Q(0);
        this.regs.WZ = this.operands();
        x = this.readreg(x);
        this.write(this.regs.WZ, x & 0xFF);
        this.regs.WZ = (this.regs.WZ + 1) & 0xFFFF;
        this.write(this.regs.WZ, (x & 0xFF00) >>> 8);
    }

    LD_irr_a(x) {
        this.Q(0);
        this.regs.WZ = this.readreg(x);
        this.write(this.regs.WZ, this.regs.A);
        this.regs.WZ = (this.regs.A << 8) | ((this.regs.WZ + 1) & 0xFF);
    }

    LD_irr_n(x) {
        this.Q(0);
        let addr = this.displace(x, 2);
        this.write(addr, this.operand());
    }

    LD_irr_r(x, y) {
        this.Q(0);
        this.write(this.displace(x), this.readreg(y));
    }

    LD_r_n(x) {
        this.Q(0);
        this.writereg(x, this.operand());
    }

    LD_r_irr(x, y) {
        this.Q(0);
        this.writereg(x, this.read(this.displace(y)));
    }

    LD_r_r(x, y) {
        this.Q(0);
        this.writereg(x, this.readreg(y));
    }

    LD_r_r1(x, y) {
        this.Q(0);
        this.wait(1);
        this.writereg(x, this.readreg(y));
    }

    LD_r_r2(x, y) {
        this.Q(1);
        this.wait(1);
        this.writereg(x, this.readreg(y));
        x = this.readreg(x);
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.F.PV = this.regs.IFF2;
        this.regs.setXYSZ(x);
        this.regs.P = +(!this.CMOS);
    }

    LD_rr_inn(x) {
        this.Q(0);
        let addr = this.operands();
        let d = this.read(addr);
        addr = (addr + 1) & 0xFFFF
        d |= this.read(addr) << 8;
        this.writereg(x, d);
        this.writereg('WZ', addr);
    }

    LD_rr_nn(x) {
        this.Q(0);
        let r = this.operands();
        this.writereg(x, r);
    }

    LD_sp_rr(x) {
        this.Q(0);
        this.wait(2);
        this.regs.SP = this.readreg(x);
    }

    LDD() {
        this.Q(1);
        let ta = this.readreg('_HL');
        let data = this.read(ta);
        ta = (ta - 1) & 0xFFFF;
        this.writereg('_HL', ta);
        ta = this.readreg('DE');
        this.write(ta, data);
        ta = (ta - 1) & 0xFFFF;
        this.writereg('DE', ta);
        this.wait(2);
        this.regs.F.N = this.regs.F.H = 0;
        ta = this.readreg('BC');
        ta = (ta - 1) & 0xFFFF;
        this.regs.F.PV = +(ta !== 0);
        this.writereg('BC', ta);
        this.regs.F.X = ((this.regs.A + data) & 8) >>> 3;
        this.regs.F.Y = ((this.regs.A + data) & 2) >>> 1;
    }

    LDDR() {
        this.Q(1);
        this.LDD();
        if ((this.regs.B === 0) && (this.regs.C === 0)) return;
        this.wait(5);
        this.regs.PC = (this.regs.PC - 2) & 0xFFFF;
        this.regs.WZ = (this.regs.PC + 1) & 0xFFFF;
        this.regs.F.X = (this.regs.PC >>> 11) & 1;
        this.regs.F.Y = (this.regs.PC >>> 13) & 1;
    }

    LDI() {
        this.Q(1);
        let ta = this.readreg('_HL');
        let data = this.read(ta);
        ta = (ta + 1) & 0xFFFF;
        this.writereg('_HL', ta);
        ta = this.readreg('DE');
        this.write(ta, data);
        ta = (ta + 1) & 0xFFFF;
        this.writereg('DE', ta);
        this.wait(2);
        this.regs.F.N = this.regs.F.H = 0;
        ta = this.readreg('BC');
        ta = (ta - 1) & 0xFFFF;
        this.regs.F.PV = +(ta !== 0);
        this.writereg('BC', ta);
        this.regs.F.X = ((this.regs.A + data) & 8) >>> 3;
        this.regs.F.Y = ((this.regs.A + data) & 2) >>> 1;
    }

    LDIR() {
        this.Q(1);
        this.LDI();
        if ((this.regs.B === 0) && (this.regs.C === 0)) return;
        this.wait(5);
        this.regs.PC = (this.regs.PC - 2) & 0xFFFF;
        this.regs.WZ = (this.regs.PC + 1) & 0xFFFF;
        this.regs.F.X = (this.regs.PC >>> 11) & 1;
        this.regs.F.Y = (this.regs.PC >>> 13) & 1;
    }

    NEG() {
        this.Q(1);
        this.regs.A = this.SUB(0, this.regs.A);
    }

    NOP() {
        this.Q(0);
    }

    OR_a_irr(x) {
        this.Q(1);
        this.regs.A = this.OR(this.regs.A, this.read(this.displace(x)));
    }

    OR_a_n() {
        this.Q(1);
        this.regs.A = this.OR(this.regs.A, this.operand());
    }

    OR_a_r(x) {
        this.Q(1);
        this.regs.A = this.OR(this.regs.A, this.readreg(x));
    }

    OTDR() {
        this.Q(1);
        this.OUTD();
        if (this.regs.B === 0) return;
        this.wait(5);
        this.regs.PC = (this.regs.PC - 2) & 0xFFFF;
        this.regs.WZ = (this.regs.PC + 1) & 0xFFFF;
        this.post_IN_O_R();
    }

    OTIR() {
        this.Q(1);
        this.OUTI();
        if (this.regs.B === 0) return;
        this.wait(5);
        this.regs.PC = (this.regs.PC - 2) & 0xFFFF;
        this.regs.WZ = (this.regs.PC + 1) & 0xFFFF;
        this.post_IN_O_R();
    }

    OUT_ic_r(x) {
        this.Q(0);
        let ta = this.readreg('BC');
        this.out(ta, this.readreg(x));
        this.regs.WZ = (ta + 1) & 0xFFFF;
    }

    OUT_ic() {
        this.Q(0);
        let ta = this.readreg('BC');
        this.regs.WZ = (ta + 1) & 0xFFFF;
        if (this.CMOS) this.out(ta, 0xFF);
        else this.out(ta, 0x00);
    }

    OUT_in_a() {
        this.Q(0);
        let WZL = this.operand();
        let WZH = this.regs.A;
        this.regs.WZ = (WZH << 8) | WZL;
        this.out(this.regs.WZ, this.regs.A);
        this.regs.WZ = (this.regs.WZ & 0xFF00) | ((this.regs.WZ + 1) & 0xFF);
    }

    OUTD() {
        this.Q(1);
        this.wait(1);
        let ta = this.readreg('_HL');
        let data = this.read(ta);
        this.regs.data = data;
        ta = (ta - 1) & 0xFFFF;
        this.writereg('_HL', ta);
        this.regs.B = (this.regs.B - 1) & 0xFF;
        ta = this.readreg('BC');
        this.out(ta, data);
        this.regs.WZ = (ta - 1) & 0xFFFF;

        this.regs.F.C = ((this.regs.L + data) & 0x100) >>> 8;
        this.regs.F.N = (data & 0x80) >>> 7;
        this.regs.parity((this.regs.L + data & 7 ^ this.regs.B) & 0xFF);
        this.regs.setXYSZ(this.regs.B);
        this.regs.F.H = this.regs.F.C;
    }

    OUTI() {
        this.Q(1);
        this.wait(1);
        let ta = this.readreg('_HL');
        let data = this.read(ta);
        ta = (ta + 1) & 0xFFFF;
        this.writereg('_HL', ta);
        this.regs.B = (this.regs.B - 1) & 0xFF;
        ta = this.readreg('BC');
        this.out(ta, data);
        this.regs.data = data;
        this.regs.WZ = (ta + 1) & 0xFFFF;

        this.regs.F.C = ((this.regs.L + data) & 0x100) >>> 8;
        this.regs.F.N = (data & 0x80) >>> 7;
        this.regs.parity((this.regs.L + data & 7 ^ this.regs.B) & 0xFF);
        this.regs.setXYSZ(this.regs.B);
        this.regs.F.H = this.regs.F.C;
    }

    POP_rr(x) {
        this.Q(0);
        this.writereg(x, this.pop());
    }

    PUSH_rr(x) {
        this.Q(0);
        this.wait(1);
        this.push(this.readreg(x));
    }

    RES_o_irr(bit, addr) {
        this.Q(0);
        let x = this.RES(bit, this.read(addr));
        this.wait(1);
        this.write(addr, x);
    }

    RES_o_irr_r(bit, addr, x) {
        this.Q(0);
        this.wait(2);
        let tv = this.RES(bit, this.read(addr));
        this.wait(1);
        this.writereg(x, tv);
        this.write(addr, tv);
    }

    RES_o_r(bit, x) {
        this.Q(0);
        this.writereg(x, this.RES(bit, this.readreg(x)));
    }

    RET() {
        this.Q(0);
        this.regs.WZ = this.pop();
        this.regs.PC = this.regs.WZ;
    }

    RET_c(cond) {
        this.Q(0);
        this.wait(1);
        if (!this.cond_eval(cond)) return;
        this.regs.WZ = this.pop();
        this.regs.PC = this.regs.WZ;
    }

    RETI() {
        this.Q(0);
        this.regs.WZ = this.pop();
        this.regs.PC = this.regs.WZ;
        this.regs.IFF1 = this.regs.IFF2;
    }

    RETN() {
        this.Q(0);
        this.regs.WZ = this.pop();
        this.regs.PC = this.regs.WZ;
        this.regs.IFF1 = this.regs.IFF2;
    }

    RL_irr(addr) {
        this.Q(1);
        let x = this.RL(this.read(addr));
        this.wait(1);
        this.write(addr, x);
    }

    RL_irr_r(addr, x) {
        this.Q(1);
        this.wait(2);
        let tv = this.RL(this.read(addr));
        this.writereg(x, tv);
        this.wait(1);
        this.write(addr, tv);
    }

    RL_r(x) {
        this.Q(1);
        this.writereg(x, this.RL(this.readreg(x)));
    }

    RLA() {
        this.Q(1);
        let c = (this.regs.A & 0x80) >>> 7;
        this.regs.A = ((this.regs.A << 1) | this.regs.F.C) & 0xFF;

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.setXY(this.regs.A);
    }

    RLC_irr(addr) {
        this.Q(1);
        let r = this.read(addr);
        this.wait(1);
        this.write(addr, this.RLC(r));
    }

    RLC_irr_r(addr, x) {
        this.Q(1);
        this.wait(2);
        let tv = this.RLC(this.read(addr));
        this.wait(1);
        this.writereg(x, tv);
        this.write(addr, tv);
    }

    RLC_r(x) {
        this.Q(1);
        this.writereg(x, this.RLC(this.readreg(x)));
    }

    RLCA() {
        this.Q(1);
        let c = (this.regs.A & 0x80) >>> 7;
        this.regs.A = ((this.regs.A << 1) | c) & 0xFF;

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.setXY(this.regs.A);
    }

    RLD() {
        this.Q(1);
        let ta = this.readreg('HL');
        this.regs.WZ = (ta + 1) & 0xFFFF;
        let data = this.read(ta);
        this.wait(1);
        this.write(ta, ((data << 4) | (this.regs.A & 0x0F)) & 0xFF);
        this.wait(3);
        this.regs.A = (this.regs.A & 0xF0) | (data >>> 4);

        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(this.regs.A);
        this.regs.setXYSZ(this.regs.A);
    }

    RR_irr(addr) {
        this.Q(1);
        let x = this.RR(this.read(addr));
        this.wait(1);
        this.write(addr, x);
    }

    RR_irr_r(addr, x) {
        this.Q(1);
        this.wait(2);
        let tv = this.RR(this.read(addr));
        this.writereg(x, tv);
        this.wait(1);
        this.write(addr, tv);
    }

    RR_r(x) {
        this.Q(1);
        this.writereg(x, this.RR(this.readreg(x)));
    }

    RRA() {
        this.Q(1);
        let c = this.regs.A & 1;
        this.regs.A = (this.regs.F.C << 7) | (this.regs.A >>> 1);

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.setXY(this.regs.A);
    }

    RRC_irr(addr) {
        this.Q(1);
        let x = this.RRC(this.read(addr));
        this.wait(1);
        this.write(addr, x)
    }

    RRC_irr_r(addr, x) {
        this.Q(1);
        this.wait(2);
        let tv = this.RRC(this.read(addr));
        this.writereg(x, tv);
        this.wait(1);
        this.write(addr, tv);
    }

    RRC_r(x) {
        this.Q(1);
        this.writereg(x, this.RRC(this.readreg(x)));
    }

    RRCA() {
        this.Q(1);
        let c = this.regs.A & 1;
        this.regs.A = (c << 7) | (this.regs.A >>> 1);

        this.regs.F.C = c;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.setXY(this.regs.A);
    }

    RRD() {
        this.Q(1);
        let ta = this.readreg('HL');
        this.regs.WZ = (ta + 1) & 0xFFFF;
        let data = this.read(ta);
        this.wait(1);
        this.write(ta, ((data >>> 4) | (this.regs.A << 4)) & 0xFF);
        this.wait(3);
        this.regs.A = (this.regs.A & 0xF0) | (data & 0x0F);

        this.regs.F.N = this.regs.F.H = 0;
        this.regs.parity(this.regs.A);
        this.regs.setXYSZ(this.regs.A);
    }

    RST_o(vector) {
        this.Q(0);
        this.wait(1);
        this.push(this.regs.PC);
        this.regs.WZ = parseInt(vector) << 3;
        this.regs.PC = this.regs.WZ;
    }

    SBC_a_irr(x) {
        this.Q(1);
        this.regs.A = this.SUB(this.regs.A, this.read(this.displace(x)), this.regs.F.C);
    }

    SBC_a_n() {
        this.Q(1);
        this.regs.A = this.SUB(this.regs.A, this.operand(), this.regs.F.C);
    }

    SBC_a_r(x) {
        this.Q(1);
        this.regs.A = this.SUB(this.regs.A, this.readreg(x), this.regs.F.C);
    }

    SBC_hl_rr(x) {
        this.Q(1);
        let ta = this.readreg('HL');
        this.regs.WZ = (ta + 1) & 0xFFFF;
        this.wait(4);
        let lo = this.SUB(this.regs.L, this.readreg(x) & 0xFF, this.regs.F.C);
        this.wait(3);
        let hi = this.SUB(this.regs.H, (this.readreg(x) & 0xFF00) >>> 8, this.regs.F.C);
        this.writereg('HL', (hi << 8) | lo);
        this.regs.F.Z = +((hi === 0) && (lo === 0));
    }

    SCF() {
        if (this.regs.Q !== 0) { this.regs.F.X = this.regs.F.Y = 0; }
        this.regs.F.C = 1;
        this.regs.F.N = this.regs.F.H = 0;
        this.regs.F.X = ((this.regs.F.getbyte() | this.regs.A) & 0x08) >>> 3;
        this.regs.F.Y = ((this.regs.F.getbyte() | this.regs.A) & 0x20) >>> 5;
        this.Q(1);
    }

    SET_o_irr(bit, addr) {
        this.Q(0);
        let x = this.SET(bit, this.read(addr));
        this.wait(1);
        this.write(addr, x);
    }

    SET_o_irr_r(bit, addr, x) {
        this.Q(0);
        this.wait(2);
        let tv = this.SET(bit, this.read(addr));
        this.wait(1);
        this.writereg(x, tv);
        this.write(addr, tv);
    }

    SET_o_r(bit, x) {
        this.Q(0);
        this.writereg(x, this.SET(bit, this.readreg(x)));
    }

    SLA_irr(addr) {
        this.Q(1);
        let x = this.SLA(this.read(addr));
        this.wait(1);
        this.write(addr, x);
    }

    SLA_irr_r(addr, x) {
        this.Q(1);
        this.wait(2);
        let tv = this.SLA(this.read(addr));
        this.writereg(x, tv);
        this.wait(1);
        this.write(addr, tv);
    }

    SLA_r(x) {
        this.Q(1);
        this.writereg(x, this.SLA(this.readreg(x)));
    }

    SLL_irr(addr) {
        this.Q(1);
        let x = this.SLL(this.read(addr));
        this.wait(1);
        this.write(addr, x);
    }

    SLL_irr_r(addr, x) {
        this.Q(1);
        this.wait(2);
        let tv = this.SLL(this.read(addr));
        this.writereg(x, tv);
        this.wait(1);
        this.write(addr, tv);
    }

    SLL_r(x) {
        this.Q(1);
        this.writereg(x, this.SLL(this.readreg(x)));
    }

    SRA_irr(addr) {
        this.Q(1);
        let x = this.SRA(this.read(addr));
        this.wait(1);
        this.write(addr, x);
    }

    SRA_irr_r(addr, x) {
        this.Q(1);
        this.wait(2);
        let tv = this.SRA(this.read(addr));
        this.writereg(x, tv);
        this.wait(1);
        this.write(addr, tv);
    }

    SRA_r(x) {
        this.Q(1);
        this.writereg(x, this.SRA(this.readreg(x)));
    }

    SRL_irr(addr) {
        this.Q(1);
        let x = this.SRL(this.read(addr));
        this.wait(1);
        this.write(addr, x);
    }

    SRL_irr_r(addr, x) {
        this.Q(1);
        this.wait(2);
        let tv = this.SRL(this.read(addr));
        this.writereg(x, tv);
        this.wait(1);
        this.write(addr, tv);
    }

    SRL_r(x) {
        this.Q(1);
        this.writereg(x, this.SRL(this.readreg(x)));
    }

    SUB_a_irr(x) {
        this.Q(1);
        this.regs.A = this.SUB(this.regs.A, this.read(this.displace(x)));
    }

    SUB_a_n() {
        this.Q(1);
        this.regs.A = this.SUB(this.regs.A, this.operand());
    }

    SUB_a_r(x) {
        this.Q(1);
        this.regs.A = this.SUB(this.regs.A, this.readreg(x));
    }

    XOR_a_irr(x) {
        this.Q(1);
        this.regs.A = this.XOR(this.regs.A, this.read(this.displace(x)));
    }

    XOR_a_n() {
        this.Q(1);
        this.regs.A = this.XOR(this.regs.A, this.operand());
    }

    XOR_a_r(x) {
        this.Q(1);
        this.regs.A = this.XOR(this.regs.A, this.readreg(x));
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
            case 'regs.F.PV === 0':
                c = this.regs.F.PV === 0;
                break;
            case 'regs.F.PV === 1':
                c = this.regs.F.PV === 1;
                break;
            case 'regs.F.S === 0':
                c = this.regs.F.S === 0;
                break;
            case 'regs.F.S === 1':
                c = this.regs.F.S === 1;
                break;
            default:
                console.log('NOT FOUND EVALS', cond);
                return null;
        }
        return c;
    }

    instruction(code) {
        let c = Z80_opcode_matrix[code];
        let fn = this[Z80_MN_R[c.ins]].bind(this);
        fn(c.arg1, c.arg2, c.arg3);
        this.set_q();
    }

    instructionCB(code) {
        let c = Z80_CB_opcode_matrix[code];
        let fn = this[Z80_MN_R[c.ins]].bind(this);
        fn(c.arg1, c.arg2, c.arg3);
        this.set_q();
    }

    instructionED(code) {
        let c = Z80_ED_opcode_matrix[code];
        let fn = this[Z80_MN_R[c.ins]].bind(this);
        fn(c.arg1, c.arg2, c.arg3);
        this.set_q();
    }

    instructionCBd(addr, code) {
        let c = Z80_CBd_opcode_matrix[code];
        let fn = this[Z80_MN_R[c.ins]].bind(this);
        let arg1 = c.arg1;
        let arg2 = c.arg2;
        let arg3 = c.arg3;
        if (arg1 === 'addr') arg1 = addr;
        if (arg2 === 'addr') arg2 = addr;
        if (arg3 === 'addr') arg3 = addr;
        fn(arg1, arg2, arg3);
        this.set_q();
    }

    set_q() {
        if (this.regs.sq !== 0)
            this.regs.Q = this.regs.F.getbyte()
        else
            this.regs.Q = 0;
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
            this.test = new Z80_proc_test();
            Z80_generate_registers(this.test.initial);
            this.regs = new Z80T_state(this.test.initial);
            // Set EI and P to 0 so they are that way in the end
            // Unless an instruction sets them...
            this.regs.EI = 0;
            this.regs.P = 0
            let ipc = this.regs.PC;
            for (let i =0; i < opcode_stream.length; i++) {
                if (i === 2) continue;
                this.test.opcode_RAMs[(i+this.regs.PC) & 0xFFFF] = opcode_stream[i];
            }
            let curd;

            this.rprefix = Z80T.HL;
            this.prefix = 0;

            // read the opcode stream
            let i = 0;
            // 4 T-states for an opcode read

            while(true) {
                curd = this.fetch_opcode(opcode_stream, i);
                i++;
                this.regs.inc_R();
                if (curd === 0xDD) {
                    this.prefix = 0xDD;
                    this.rprefix = Z80T.IX;
                    //this.regs.inc_PC();
                    continue;
                }
                if (curd === 0xFD) {
                    this.prefix = 0xFD;
                    this.rprefix = Z80T.IY;
                    //this.regs.inc_PC();
                    continue;
                }
                break;
            }
            let operand;

            if ((curd === 0xCB) && (this.rprefix !== Z80T.HL)) {
                // already have 8 cycles wait
                this.prefix = ((this.prefix << 8) | 0xCB) & 0xFFFF;
                let yr = (this.rprefix === Z80T.IX) ? this.regs.IX : this.regs.IY;
                operand = this.operand(); // +3 = 11
                i++;
                this.regs.WZ = (yr + mksigned8(operand)) & 0xFFFF;
                this.rprefix = Z80T.HL;
                // fetch actual instruction now
                //this.wait(2); // + 2 = 13
                curd = this.fetch_opcode(opcode_stream, i, true, false);
                // +3 = 14
                // Now we're at 14 cycles
                i++;
                this.instructionCBd(this.regs.WZ, curd);
            }
            else if (curd === 0xCB) { // with no prefix
                curd = this.fetch_opcode(opcode_stream, i);
                i++;
                this.regs.inc_R();
                this.prefix = 0xCB;
                this.instructionCB(curd);
            }
            else if (curd === 0xED) {
                this.rprefix = Z80T.HL;
                curd = this.fetch_opcode(opcode_stream, i);
                i++;
                this.regs.inc_R();
                this.prefix = 0xED;
                this.instructionED(curd);
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

function generate_Z80_tests(seed=null, CMOS) {
    console.log('FULL MEMCYCLES?', Z80_DO_FULL_MEMCYCLES);
    if (seed !== null) rand_seed = seed;
    rand_seed = 'yo';
    let os1 = new Uint8Array(1);
    let os2 = new Uint8Array(2);
    let os4 = new Uint8Array(4);
    let test_generator = new Z80_test_generator(CMOS);


    let tests = {};
     //To test a specific test
    /*os2[0] = 0xED;
    os2[1] = 0x56;
    let n = 'ED 56';
    tests[n] = test_generator.generate_test(os2, 1, n);
    console.log(tests[n]);
    return;*/

    let opc_table;

    console.log('1/7 Generating regular opcodes...');
    opc_table = Z80_opcode_matrix;
    for (let i in opc_table) {
        os1[0] = i;
        let n = hex2(parseInt(i));
        tests[n] = test_generator.generate_test(os1, Z80_NUM_TO_GENERATE, n);
    }

    console.log('2/7 Generating CB opcodes...');
    opc_table = Z80_CB_opcode_matrix;
    for (let i in opc_table) {
        os2[0] = 0xCB;
        os2[1] = i;
        let n = 'CB ' + hex2(parseInt(i));
        tests[n] = test_generator.generate_test(os2, Z80_NUM_TO_GENERATE, n);
    }

    console.log('3/7 Generating ED opcodes...')
    opc_table = Z80_ED_opcode_matrix;
    for (let i in opc_table) {
        os2[0] = 0xED;
        os2[1] = i;
        let n = 'ED ' + hex2(parseInt(i));
        tests[n] = test_generator.generate_test(os2, Z80_NUM_TO_GENERATE, n);
    }

    console.log('4/7 Generating DDnn opcodes...')
    opc_table = Z80_opcode_matrix;
    for (let i in opc_table) {
        os2[0] = 0xDD;
        os2[1] = i;
        let n = 'DD ' + hex2(parseInt(i));
        tests[n] = test_generator.generate_test(os2, Z80_NUM_TO_GENERATE, n);
    }

    console.log('5/7 Generating FDnn opcodes...')
    opc_table = Z80_opcode_matrix;
    for (let i in opc_table) {
        os2[0] = 0xFD;
        os2[1] = i;
        let n = 'FD ' + hex2(parseInt(i));
        tests[n] = test_generator.generate_test(os2, Z80_NUM_TO_GENERATE, n);
    }

    console.log('6/7 Generating DD CB __ nn opcodes...')
    opc_table = Z80_CBd_opcode_matrix;
    for (let i in opc_table) {
        os4[0] = 0xDD;
        os4[1] = 0xCB;
        os4[2] = null;
        os4[3] = i;
        let n = 'DD CB __ ' + hex2(parseInt(i));
        tests[n] = test_generator.generate_test(os4, Z80_NUM_TO_GENERATE, n);
    }

    console.log('7/7 Generating FD CB opcodes...')
    opc_table = Z80_CBd_opcode_matrix;
    for (let i in opc_table) {
        os4[0] = 0xFD;
        os4[1] = 0xCB;
        os4[2] = null;
        os4[3] = i;
        let n = 'FD CB __ ' + hex2(parseInt(i));
        tests[n] = test_generator.generate_test(os4, Z80_NUM_TO_GENERATE, n);
    }

    console.log('Zipping tests...');
    let zip = new JSZip();
    for (let i in tests) {
        zip.file(i.toLowerCase() + '.json', JSON.stringify(tests[i]));
    }

    dconsole.addl(null,'Finalizing ZIP for download...')
    zip.generateAsync({type:"blob"}).then(function(content) {
        dconsole.addl(null, 'Downloading...');
        save_js("z80 tests.zip", content, 'application/zip');
        dconsole.addl(null, 'Done!');
    });

}
