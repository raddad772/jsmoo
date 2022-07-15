let TEST_TO_GENERATE = 0x05;
let NUM_TO_GENERATE = 1;

// { "name": "0a 78 2d",
// "initial": {
//   "pc": 55578,
//   "s": 142,
//   "a": 57,
//   "x": 62,
//   "y": 93,
//   "p": 171,
//   "ram": [ [55578, 10], [55579, 120], [55580, 45] ]
//},
//"final": {
//   "pc": 55579,
//   "s": 142,
//   "a": 114,
//   "x": 62,
//   "y": 93,
//   "p": 40,
//   "ram": [ [55578, 10], [55579, 120], [55580, 45] ]
//},
//"cycles": [ [55578, 10, "read"], [55579, 120, "read"]]
// },


// This generates (hopefully) cycle-accurate tests for the SPC700.
// PLEASE NOTE, the timings are taken from Higan, which claims 100% compatability.
// PLEASE ALSO NOTE, we do not simulate extra hardware registers here, clock dividers,
//  timers, etc.

class proc_cycles {
    constructor() {
        this.cycles = [];
        this.state = {
            RW: 'read',
            addr: 0,
            D: 0
        }
    }

    add(addr, val, kind) {
        this.cycles.push([addr, val, kind]);
    }

    serializeable() {
        return this.cycles;
    }
}

class proc_test {
    constructor() {
        // Serialized
        this.name = '';
        this.initial = {};
        this.final = {};
        this.cycles = new proc_cycles();

        // Not serialized
        this.current_cycle = 0;
    }

    serializable() {
        return {
            name: this.name,
            initial: this.initial,
            final: this.final,
            cycles: this.cycles.serializeable()
        }
    }

    finalize(regs) {
        regs.dump_to(this.final);
        let initial_RAMs = [];
        let final_RAMs = [];
        let initial_set = new Set();
        let final_set = new Set();
        for (let i in this.cycles.cycles) {
            let cycle = this.cycles.cycles[i];
            let addr = cycle[0];
            let val = cycle[1];
            let rw = cycle[2];
            if (rw === 'read') {
                if (!initial_set.has(addr)) {
                    initial_set.add(addr);
                    initial_RAMs.push([addr, val]);
                }
            }
            if (rw === 'write') {
                if (!initial_set.has(addr)) {
                    initial_set.add(addr);
                    initial_RAMs.push([addr, 0]);
                }
            }
            if (!final_set.has(addr)) {
                final_set.add(addr);
                final_RAMs.push([addr, val]);
            }
            //}
        }
        initial_RAMs = initial_RAMs.sort((a, b) => {return a[0] - b[0]});
        final_RAMs = final_RAMs.sort((a, b) => {return a[0] - b[0]});
        this.initial.ram = initial_RAMs;
        this.final.ram = final_RAMs;
    }

    add_cycle(addr, val, kind) {
        this.cycles.add(addr, val, kind);
    }
}

class SPC_PSW {
    constructor(from) {
        this.N = 0;
        this.V = 0;
        this.P = 0;
        this.B = 0;
        this.H = 0;
        this.I = 0;
        this.Z = 0;
        this.C = 0;

        this.setbyte(from);
    }

    setbyte(val) {
        this.N = (val >>> 7) & 1;
        this.V = (val >>> 6) & 1;
        this.P = (val >>> 5) & 1;
        this.B = (val >>> 4) & 1;
        this.H = (val >>> 3) & 1;
        this.I = (val >>> 2) & 1;
        this.Z = (val >>> 1) & 1;
        this.C = val & 1;
    }

    getbyte() {
        return this.C | (this.Z << 1) | (this.I << 2) | (this.H << 3) | (this.B << 4) | (this.P << 5) | (this.V << 6) | (this.N << 7);
    }
}

class SPC_state {
    constructor(from=null) {
        if (from === null) {
            this.A = 0;
            this.X = 0;
            this.Y = 0;
            this.SP = 0;
            this.PC = 0;
            this.P = new SPC_PSW(0);
        }
        else {
            this.A = from.a;
            this.X = from.x;
            this.Y = from.y;
            this.SP = from.sp;
            this.PC = from.pc;
            this.P = new SPC_PSW(from.psw);
        }
    }

    dump_to(where) {
        where.a = this.A;
        where.x = this.X;
        where.y = this.Y;
        where.sp = this.SP;
        where.pc = this.PC;
        where.psw = this.P;
    }

    inc_PC() {
        this.PC = (this.PC + 1) & 0xFFFF;
    }

    dec_PC() {
        this.PC = (this.PC - 1) & 0xFFFF;
    }

    inc_SP() {
        this.SP = (this.PC + 1) & 0xFF;
    }

    dec_SP() {
        this.SP = (this.SP - 1) & 0xFF;
    }

}

function pt_rnd8() {
    return Math.floor(Math.random() * 256);
}

function pt_rnd16() {
    return Math.floor(Math.random() * 65536);
}

function SPC_generate_registers(where) {
    where.pc = pt_rnd16();
    where.a = pt_rnd8();
    where.x = pt_rnd8();
    where.y = pt_rnd8();
    where.sp = pt_rnd8();
    where.psw = pt_rnd8() & 0xF7; // Break flag
}

class SPC_test_generator {
    constructor() {
        this.test = null;
        this.regs = null;
    }

    algorithmOR(x, y) {
        console.log('OR', x, y)
        x |= y;
        this.setz(x);
        this.setn8(x);
        console.log('RESULT', x);
        return x;
    }

    setn8(from) {
        this.regs.P.N = (from & 0x80) >>> 7;
    }

    setz(from) {
        this.regs.P.Z = +((from & 0xFF) === 0);
    }

    fetch() {
        let val = pt_rnd8();
        this.test.add_cycle(this.regs.PC, val, 'read');
        this.regs.inc_PC();
        return val;
    }

    load(addr) {
        return this.read(this.regs.P.P << 8 | (addr & 0xFF));
    }

    store(addr, val) {
        this.test.add_cycle(addr & 0xFFFF, val, 'write');
    }

    read(wherefrom) {
        let val = pt_rnd8();
        this.test.add_cycle(wherefrom & 0xFFFF, val, 'read');
        return val;
    }

    read_discard(wherefrom) {
        let val = null;
        this.test.add_cycle(wherefrom & 0xFFFF, val, 'read');
        return val;
    }

    idle() {
        this.test.add_cycle(null, null, 'wait');
    }

    pull(what) {
        this.regs.inc_SP();
        this.test.add_cycle(0x100 | this.regs.SP, what & 0xFF, 'read');
    }

    push(what) {
        this.test.add_cycle(0x100 | this.regs.SP, what & 0xFF, 'write');
        this.regs.dec_SP();
    }

    AbsoluteBitSet(bit, val) {
        let addr = this.fetch();
        let data = this.load(addr);
        let bm = 1 << bit;
        if (val) // SET
            val |= bm;
        else // CLR
            val &= ((~bm) & 0xFF);
        this.store(addr, data);
    }

    alu(op) {
        return this['algorithm' + op].bind(this);
    }
    AbsoluteRead(op, target) {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        let data = this.read(addr);
        console.log('TARGET!', target, this.regs[target], data);
        this.regs[target] = this.alu(op)(this.regs[target], data);
    }

    BranchBit(bit, val) {
        let addr = this.fetch();
        let data = this.load(addr);
        this.idle();
        let displacement = this.fetch();
        let bm = 1 << bit;
        let do_branch;
        if (val) // Branch if set
            do_branch = (data & bm) !== 0;
        else
            do_branch = (data & bm) === 0;
        if (!do_branch) return;
        this.idle();
        this.idle();
        this.regs.PC += mksigned8(displacement);
    }

    CallTable(vector) {
        this.read(this.regs.PC, null);
        this.idle();
        this.push(this.regs.PC >>> 8);
        this.push(this.regs.PC);
        this.idle();
        let address = 0xFFDE - (vector * 2);
        this.regs.PC = this.read(address);
        this.regs.PC |= this.read(address + 1) << 8;
    }

    DirectRead(op, target) {
        let addr = this.fetch();
        let data = this.load(addr);
        this.regs[target] = this.alu(op)(this.regs[target], data);
    }

    IndirectXRead(op) {
        this.read_discard(this.regs.PC);
        let data = this.load(this.regs.X);
        this.regs.A = this.alu(op)(this.regs.A, data);
    }

    IndexedIndirectRead(op, reg) {
        let indirect = this.fetch();
        this.idle();
        let addr = this.load(indirect + this.regs[reg]);
        addr |= this.load(indirect + index + 1) << 8;
        let data = this.read(addr);
        this.regs.A = this.alu(op)(this.regs.A, data)
    }

    generate_test(opcode, number) {
        let tests = [];
        let bnum, vector;
        for (let testnum = 0; testnum < number; testnum++) {
            this.test = new proc_test();
            SPC_generate_registers(this.test.initial);
            this.regs = new SPC_state(this.test.initial);
            this.test.add_cycle(this.regs.PC, opcode, 'read');
            this.regs.inc_PC();
            switch (opcode) {
                case 0x00: // Nop
                    this.read_discard(this.regs.PC);
                    break;
                case 0x01: // TCALL 0
                case 0x11: // TCALL 1
                case 0x21: // TCALL 2
                case 0x31: // TCALL 3
                case 0x41: // 4
                case 0x51: // 5
                case 0x61: // 6
                case 0x71: // 7
                case 0x81: // 8
                case 0x91: // 9
                case 0xA1: // 10
                case 0xB1: // 11
                case 0xC1: // 12
                case 0xD1: // 13
                case 0xE1: // 14
                case 0xF1: // 15
                    vector = (opcode & 0xF0) >>> 4;
                    this.CallTable(vector);
                    break;
                case 0x02: // SET1 d.0
                case 0x22: // SET1 d.1
                case 0x42: // SET1 d.2
                case 0x62: // SET1 d.3
                case 0x82: // SET1 d.4
                case 0xA2: // SET1 d.5
                case 0xC2: // SET1 d.6
                case 0xE2: // SET1 d.7
                    bnum = (opcode & 0xF0) >>> 5;
                    this.AbsoluteBitSet(bnum, true);
                    break;
                case 0x12: // CLR1 d.0
                case 0x32: // CLR1 d.1
                case 0x52: // CLR1 d.2
                case 0x72: // CLR1 d.3
                case 0x92: // CLR1 d.4
                case 0xB2: // CLR1 d.5
                case 0xD2: // CLR1 d.6
                case 0xF2: // CLR1 d.7
                    bnum = (((opcode & 0xF0) >>> 4) - 1) >>> 1;
                    this.AbsoluteBitSet(bnum, false);
                    break;
                case 0x03: // Branch if bit set
                case 0x23:
                case 0x43:
                case 0x63:
                case 0x83:
                case 0xA3:
                case 0xC3:
                case 0xE3:
                    bnum = (opcode & 0xF0) >>> 5;
                    this.BranchBit(bnum, true);
                    break;
                case 0x13: // Branch if bit clear
                case 0x33:
                case 0x53:
                case 0x73:
                case 0x93:
                case 0xB3:
                case 0xD3:
                case 0xF3:
                    bnum = (((opcode & 0xF0) >>> 4) - 1) >>> 1;
                    this.BranchBit(bnum, false);
                    break;
                case 0x04: // OR A, d
                    this.DirectRead('OR', 'A');
                    break;
                case 0x05: // OR A, !abs
                    this.AbsoluteRead('OR', 'A');
                    break;
                case 0x06: // OR A, (X)
                    this.IndirectXRead('OR');
                    break;
                case 0x07:
                    this.IndexedIndirectRead('OR', 'X');
                    break;
            }
            this.test.finalize(this.regs);
            this.test.name = hex2(opcode) + ' ' + hex4(testnum)
            tests.push(this.test.serializable());
        }
        return tests;
    }
}

function generate_SPC700_test_test() {
    let test_generator = new SPC_test_generator();
    let tests = test_generator.generate_test(TEST_TO_GENERATE, NUM_TO_GENERATE);
    console.log('GENERATED TESTS', tests);
}