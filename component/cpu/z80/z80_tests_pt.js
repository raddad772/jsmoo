"use strict";

if (!getJSON) {
    const getJSON = async url => {
        const response = await fetch(url);
        if (!response.ok) { // check if response worked (no 404 errors etc...)
            console.log(response);
        }
        //throw new Error(response.statusText);

        const data = response.json(); // get JSON from the response
        return data; // returns a promise, which resolves to this data value
    }
}
let Z80local_server_url;


let Z80testRAM = new Uint8Array(65536);

function Z80_fmt_test(tst) {
    let oute = JSON.parse(JSON.stringify(tst));
    oute.initial.pc = hex4(oute.initial.pc);
    oute.initial.sp = hex4(oute.initial.sp);
    oute.initial.wz = hex4(oute.initial.wz);
    oute.initial.ix = hex4(oute.initial.ix);
    oute.initial.iy = hex4(oute.initial.iy);
    oute.initial.af_ = hex4(oute.initial.af_);
    oute.initial.bc_ = hex4(oute.initial.bc_);
    oute.initial.de_ = hex4(oute.initial.de_);
    oute.initial.hl_ = hex4(oute.initial.hl_);
    oute.initial.a = hex2(oute.initial.a);
    oute.initial.b = hex2(oute.initial.b);
    oute.initial.c = hex2(oute.initial.c);
    oute.initial.d = hex2(oute.initial.d);
    oute.initial.e = hex2(oute.initial.e);
    oute.initial.f = hex2(oute.initial.f);
    oute.initial.h = hex2(oute.initial.h);
    oute.initial.l = hex2(oute.initial.l);
    oute.initial.i = hex2(oute.initial.i);
    oute.initial.r = hex2(oute.initial.r);
    for (let j in oute.initial.ram) {
        let ro = oute.initial.ram[j]
        ro[0] = hex4(ro[0]);
        if (ro[1] !== null) ro[1] = hex2(ro[1]);
    }
    for (let ci in oute.cycles) {
        let cycle = oute.cycles[ci];
        cycle[0] = hex4(cycle[0]);
        if (cycle[1] !== null) cycle[1] = hex2(cycle[1]);
    }
    oute.final.pc = hex4(oute.final.pc);
    oute.final.sp = hex4(oute.final.sp);
    oute.final.wz = hex4(oute.final.wz);
    oute.final.ix = hex4(oute.final.ix);
    oute.final.iy = hex4(oute.final.iy);
    oute.final.af_ = hex4(oute.final.af_);
    oute.final.bc_ = hex4(oute.final.bc_);
    oute.final.de_ = hex4(oute.final.de_);
    oute.final.hl_ = hex4(oute.final.hl_);
    oute.final.a = hex2(oute.final.a);
    oute.final.b = hex2(oute.final.b);
    oute.final.c = hex2(oute.final.c);
    oute.final.d = hex2(oute.final.d);
    oute.final.e = hex2(oute.final.e);
    oute.final.f = hex2(oute.final.f);
    oute.final.h = hex2(oute.final.h);
    oute.final.l = hex2(oute.final.l);
    oute.final.i = hex2(oute.final.i);
    oute.final.r = hex2(oute.final.r);
    return oute;
}

class Z80test_return {
    constructor(passed, ins, messages, addr_io_mismatches, length_mismatches, failed_test_struct) {
        this.passed = passed;
        this.ins = ins;
        this.hex_ins = hex0x2(ins);
        this.messages = messages;
        this.addr_io_mismatches = addr_io_mismatches;
        this.length_mismatches = length_mismatches;
        this.failed_test_struct = failed_test_struct;
    }
}


function Z80_PARSEP(w) {
    let outstr;
    //if (E === 0) {
        outstr = 'C' + + (w & 0x01);
        outstr += ' N' + ((w & 0x02) >>> 1);
        outstr += ' P' + ((w & 0x04) >>> 2);
        outstr += ' X' + ((w & 0x08) >>> 3);
        outstr += ' H' + ((w & 0x10) >>> 4);
        outstr += ' Y';
        outstr += ' Z' + ((w & 0x40) >>> 6);
        outstr += ' S' + ((w & 0x80) >>> 7);
    //}
    return outstr;
}

const Z80_TEST_DO_TRACING = true;

function faddr(addr) {
    return (addr & 0xFFFF);
}

/**
 * @param {z80_t} cpu
 * @param tests
 * @returns {Z80test_return}
 */
function Z80test_it_automated(cpu, tests) {
    let padl = function(what, howmuch) {
        while(what.length < howmuch) {
            what = ' ' + what;
        }
        return what;
    }
    let cpin = function(what, from) {
        return (from.indexOf(what) !== -1);
    }

    cpu.trace_cycles = 1;
    let last_pc;
    let ins;
    let messages = [];
    let addr_io_mismatched = 0;
    let length_mismatch = 0;
    for (let i in tests) {
        let initial = tests[i].initial;
        let final = tests[i].final;
        cpu.regs.PC = initial.pc;
        cpu.regs.SP = initial.sp;
        cpu.regs.A = initial.a;
        cpu.regs.B = initial.b;
        cpu.regs.C = initial.c;
        cpu.regs.D = initial.d;
        cpu.regs.E = initial.e;
        cpu.regs.F.setbyte(initial.f);
        cpu.regs.H = initial.h;
        cpu.regs.L = initial.l;
        cpu.regs.I = initial.i;
        cpu.regs.R = initial.r;
        cpu.regs.IX = initial.ix;
        cpu.regs.IY = initial.iy;
        cpu.regs.AF_ = (initial.af_ & 0xFF00) >>> 8;
        cpu.regs.BC_ = initial.bc_;
        cpu.regs.DE_ = initial.de_;
        cpu.regs.HL_ = initial.hl_;
        cpu.regs.WZ = initial.wz;
        cpu.regs.Q = initial.q;
        cpu.regs.P = initial.p;
        cpu.regs.EI = initial.ei;
        cpu.regs.IFF1 = initial.iff1;
        cpu.regs.IFF2 = initial.iff2;
        cpu.regs.IM = initial.im;
        cpu.regs.prefix = 0x00;
        cpu.regs.rprefix = Z80P.HL;
        for (let j in initial.ram) {
            Z80testRAM[faddr(initial.ram[j][0])] = initial.ram[j][1];
        }
        cpu.pins.D = null;
        cpu.regs.IR = Z80_S_DECODE;
        cpu.regs.TR = 0;
        cpu.pins.Addr = cpu.regs.PC;
        cpu.regs.TCU = 0;
        let addr;
        let passed = true;
        for (let cyclei in tests[i].cycles)
        {
            addr = cpu.pins.Addr;
            if (cpu.pins.RD && cpu.pins.MRQ) {
                cpu.pins.D = Z80testRAM[addr];
                if (Z80_TEST_DO_TRACING) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, cpu.trace_cycles, trace_format_read('Z80', Z80_COLOR, cpu.trace_cycles, addr & 0xFFFF, cpu.pins.D));
                }
            }

            cpu.cycle();

            let cycle = tests[i].cycles[cyclei];

            // Check address, data
            if (faddr(cycle[0]) !== addr) {
                messages.push(cyclei.toString() + ' MISMATCH IN ADDRESSES, THEIRS: ' + hex0x4(cycle[0]) + ' OURS: ' + hex0x4(addr));
                passed = false;
            }
            if (cycle[1] !== null && (cycle[1] !== cpu.pins.D)) {
                messages.push(cyclei.toString() + ' MISMATCH IN RAM AT ' + hex0x4(cycle[0]) + ' THEIRS: ' + hex0x2(cycle[1]) + ' OURS: ' + hex0x2(cpu.pins.D));
                passed = false;
            }
            // Check pins
            if (cpin('r', cycle[2]) && !cpu.pins.RD) {
                messages.push(cyclei.toString() + ' RD MISMATCH!');
                passed = false;
            }
            if (cpin('w', cycle[2]) && !cpu.pins.WR) {
                messages.push(cyclei.toString() + ' WR MISMATCH!');
                passed = false;
            }
            if (cpin('m', cycle[2]) && !cpu.pins.MRQ) {
                messages.push(cyclei.toString() + ' MRQ MISMATCH!');
                passed = false;
            }
            if (cpin('i', cycle[2]) && !cpu.pins.IO) {
                messages.push(cyclei.toString() + ' IO MISMATCH!');
                passed = false;
            }

            last_pc = cpu.regs.PC;
            if (parseInt(cyclei) === (tests[i].cycles.length-1)) {
                if (cpu.regs.IR !== Z80_S_DECODE) {
                    debugger;
                    length_mismatch++;
                }
            }

            if (cpu.pins.WR && cpu.pins.MRQ) { // Write RAM
                if (Z80_TEST_DO_TRACING) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, cpu.trace_cycles, trace_format_write('Z80', Z80_COLOR, cpu.trace_cycles, (addr & 0xFFFF), cpu.pins.D));
                }
                Z80testRAM[addr] = cpu.pins.D;
            }
        }
        if (!passed) {
            messages.push('FAILED TEST! ' + i + ' ' + Z80_PARSEP(cpu.regs.P.getbyte()));
            cpu.cycle(); // for more trace
            return new Z80test_return(passed, ins, messages, addr_io_mismatched, length_mismatch, Z80_fmt_test(tests[i]));
        }
        let testregs = function(name, mine, theirs) {
            if (mine !== theirs) {
                if (name === 'F') {
                    messages.push('ourF   ' + Z80_PARSEP(cpu.regs.F.getbyte()));
                    messages.push('theirF ' + Z80_PARSEP(theirs));
                }
                messages.push('reg ' + name + ' MISMATCH! MINE:' + hex0x2(mine) + ' THEIRS:' + hex0x2(theirs));
                return false;
            }
            return true;
        }
        //let JMP_INS = [];
        /*let JMP_INS = [0x00, 0x02, 0x10, 0x20, 0x30, 0x40, 0x4C, 0x50, 0x6C, 0x70, 0x7C, 0x80, 0x90, 0xB0, 0xD0, 0xF0, 0xFC, 0x54, 0x44];
        if (JMP_INS.indexOf(ins) !== -1) {
            passed &= testregs('PC', (cpu.regs.PC - 1) & 0xFFFF, final.pc)
        } else passed &= testregs('PC', last_pc, final.pc);*/
        passed &= testregs('PC', last_pc, final.pc);
        passed &= testregs('SP', cpu.regs.A, final.a);
        passed &= testregs('A', cpu.regs.A, final.a);
        passed &= testregs('B', cpu.regs.B, final.b);
        passed &= testregs('C', cpu.regs.C, final.c);
        passed &= testregs('D', cpu.regs.D, final.d);
        passed &= testregs('E', cpu.regs.E, final.e);
        passed &= testregs('F', cpu.regs.F.getbyte(), final.f);
        passed &= testregs('H', cpu.regs.H, final.h);
        passed &= testregs('L', cpu.regs.L, final.l);
        passed &= testregs('I', cpu.regs.I, final.i);
        passed &= testregs('R', cpu.regs.R, final.r);
        passed &= testregs('IX', cpu.regs.IX, final.ix);
        passed &= testregs('IY', cpu.regs.IY, final.iy);
        passed &= testregs('AF_', cpu.regs.AF_, final.af_);
        passed &= testregs('BC_', cpu.regs.BC_, final.bc_);
        passed &= testregs('DE_', cpu.regs.DE_, final.de_);
        passed &= testregs('HL_', cpu.regs.HL_, final.hl_);
        passed &= testregs('WZ', cpu.regs.WZ, final.wz);
        passed &= testregs('Q', cpu.regs.Q, final.q);
        passed &= testregs('P', cpu.regs.P, final.p);
        passed &= testregs('EI', cpu.regs.EI, final.ei);
        passed &= testregs('IFF1', cpu.regs.IFF1, final.iff1);
        passed &= testregs('IFF2', cpu.regs.IFF2, final.iff2);
        passed &= testregs('IM', cpu.regs.IM, final.im);

        for (let j in final.ram) {
            if (Z80testRAM[faddr(final.ram[j][0])] !== final.ram[j][1]) {
                passed = false;
                messages.push('RAM failed! ' + hex0x4(final.ram[j][0]) + ' supposed to be ' + hex0x2(final.ram[j][1]) + ' but is ' + hex0x2(Z80testRAM[final.ram[j][0]]));
            }
        }

        if (!passed) {
            messages.push('FAILED AT ENDING!');
            cpu.cycle();
            //if (cpu.regs.P.D === 0)
                return new Z80test_return(false, ins, messages, addr_io_mismatched, length_mismatch, Z80_fmt_test(tests[i]));
        }
        dbg.traces.clear();

    }
    return new Z80test_return(true, ins, messages, addr_io_mismatched, length_mismatch, null);
}

let Z80_io_mismatches = [];

async function test_pt_z80() {
    Z80local_server_url = 'http://[::1]:8000/misc/tests/GeneratedTests/z80/v1/'
    await dotest_pt_z80();
}

function Z80_get_name(iclass, ins) {
    let hi = hex2(ins);
    let ostr = '';
    switch(iclass) {
        case 0:
            ostr = hi;
            break;
        case 0xDD:
            ostr = 'DD ' + hi;
            break;
        case 0xFD:
            ostr = 'FD ' + hi;
            break;
        case 0xCB:
            ostr = 'CB ' + hi;
            break;
        case 0xED:
            ostr = 'ED ' + hi;
            break;
        case 0xDDCB:
            ostr = 'DD CB __ ' + hi;
            break;
        case 0xFDCB:
            ostr = 'DD CB __ ' + hi;
            break;
        default:
            console.log('WHAT!?', iclass);
            break;
    }
    return ostr.toLowerCase();
}

async function test_pt_z80_ins(cpu, iclass, ins) {
    let opc = Z80_get_name(iclass, ins);
    let data = await getJSON(Z80local_server_url + opc + '.json');
    console.log('TESTING', opc);
    let result = Z80test_it_automated(cpu, data);
    if (!result.passed) {
        tconsole.addl(txf('{r}TEST FOR {/b}' + hex0x2(ins) + ' {/r*}FAILED!{/} See console for test deets'));
        console.log(result.failed_test_struct);
    }
    if (result.messages.length !== 0) {
        tconsole.addl(null, '------Messages:');
        for (let i in result.messages) {
            tconsole.addl(i, result.messages[i]);
        }
    }
    if (result.addr_io_mismatches !== 0) {
        tconsole.addl(txf('{r}ADDR MISMATCHES ON IO: {/}' + result.addr_io_mismatches))
        Z80_io_mismatches.push(hex0x2(ins));
    }
    if (result.length_mismatches !== 0) {
        tconsole.addl(txf('{r}POTENTIAL CYCLE LENGTH MISMATCHES: {/}' + result.length_mismatches))
    }
    if (!result.passed) {
        dbg.traces.draw(dconsole);
    }
    //cpu.pins.traces = [];
    /*
    .then(data => {
        console.log('GOT IT, TESTING')
        test_it(data);
        console.log('DONE!')
        in_testing = false;
    });
     */
    return result.passed;
}

async function dotest_pt_z80() {
    console.log('TRYIN TO GET ME SOME JSON')
     let read8 = function(addr) {
        return Z80testRAM[addr];
    }

    let cpu = new z80_t(false);
    dbg.add_cpu(D_RESOURCE_TYPES.Z80, cpu);
    if (Z80_TEST_DO_TRACING) {
        dbg.enable_tracing_for(D_RESOURCE_TYPES.Z80);
        dbg.enable_tracing();
    }
    let start_test = 0;
    let skip_tests = []; // Tests do not correctly set B after BRK
    //let test_classes = [0x00, 0xCB, 0xED, 0xDD, 0xFD, 0xDDCB, 0xFDCB]
    let test_classes = [0x00];
    if (Z80_TEST_DO_TRACING) cpu.enable_tracing(read8);
    for (let mclass in test_classes) {
        let iclass = test_classes[mclass];
        let opcode_table;
        switch(iclass) {
            case 0xDD:
            case 0xFD:
            case 0x00:
                opcode_table = Z80_opcode_matrix;
                break;
            case 0xCB:
                opcode_table = Z80_CB_opcode_matrix;
                break;
            case 0xED:
                opcode_table = Z80_ED_opcode_matrix;
                break;
            case 0xDDCB:
            case 0xFDCB:
                opcode_table = Z80_CBd_opcode_matrix;
                break;
        }
        console.log('Testing instruction class', hex4(iclass));
        for (let i = start_test; i < 256; i++) {
            if (skip_tests.indexOf(i) !== -1) {
                tconsole.addl(txf('Test for ' + hex0x2(i) + ' {b}skipped{/}!'));
                continue;
            }
            if (typeof opcode_table[i] === 'undefined') {
                console.log('Skipping empty instruction', hex0x2(i));
                continue;
            }
            let result = await test_pt_z80_ins(cpu, iclass, i);
            if (!result) break;
            tconsole.addl(null, 'Test for ' + hex0x2(i) + ' passed!');
        }
        if (Z80_io_mismatches.length > 0) console.log('IO mismatches occured for', Z80_io_mismatches);
    }
}