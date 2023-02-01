"use strict";

const getJSON = async url => {
    const response = await fetch(url);
    if (!response.ok) { // check if response worked (no 404 errors etc...)
        console.log(response);
    }
    //throw new Error(response.statusText);

    const data = response.json(); // get JSON from the response
    return data; // returns a promise, which resolves to this data value
}

let AS_Z80local_server_url;
let AS_Z80_TEST_ONE = false;

let AS_Z80testRAM = new Uint8Array(65536);

function AS_Z80_fmt_test(tst) {
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
    for (let j in oute.final.ram) {
        let ro = oute.final.ram[j]
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

class AS_Z80test_return {
    constructor(passed, mycycles, messages, addr_io_mismatches, length_mismatches, failed_test_struct) {
        this.passed = passed;
        this.mycycles = mycycles;
        //this.hex_ins = hex0x2(ins);
        this.messages = messages;
        this.addr_io_mismatches = addr_io_mismatches;
        this.length_mismatches = length_mismatches;
        this.failed_test_struct = failed_test_struct;
    }
}


function AS_Z80_PARSEP(w) {
    let outstr;
    //if (E === 0) {
        outstr = 'C' + + (w & 0x01);
        outstr += ' N' + ((w & 0x02) >>> 1);
        outstr += ' P' + ((w & 0x04) >>> 2);
        outstr += ' X' + ((w & 0x08) >>> 3);
        outstr += ' H' + ((w & 0x10) >>> 4);
        outstr += ' Y' + ((w & 0x20) >>> 5);
        outstr += ' Z' + ((w & 0x40) >>> 6);
        outstr += ' S' + ((w & 0x80) >>> 7);
    //}
    return outstr;
}

const AS_Z80_TEST_DO_TRACING = false

function faddr(addr) {
    return (addr & 0xFFFF);
}

function AS_Z80cycle_pins(pins) {
    let ostr = '';
    //console.log(pins);
    ostr += pins.pins_RD ? 'r' : '-';
    ostr += pins.pins_WR ? 'w' : '-';
    ostr += pins.pins_MRQ ? 'm' : '-';
    ostr += pins.pins_IO ? 'i' : '-';
    return ostr;
}

function AS_Z80test_it_automated(as, cpu, tests, is_call = false) {
    let padl = function(what, howmuch) {
        while(what.length < howmuch) {
            what = ' ' + what;
        }
        return what;
    }
    let cpin = function(what, from) {
        return (from.indexOf(what) !== -1);
    }

    //cpu.trace_cycles = 1;
    let last_pc;
    let ins;
    let messages = [];
    let addr_io_mismatched = 0;
    let length_mismatch = 0;
    for (let i in tests) {
        let initial = tests[i].initial;
        let final = tests[i].final;
        let out = as.wasm.TST_Z80_get(cpu);
        out.PC = initial.pc;
        out.SP = initial.sp;
        out.A = initial.a;
        out.B = initial.b;
        out.C = initial.c;
        out.D = initial.d;
        out.E = initial.e;
        out.F = initial.f;
        out.H = initial.h;
        out.L = initial.l;
        out.I = initial.i;
        out.R = initial.r;
        out.IX = initial.ix;
        out.IY = initial.iy;
        out.AF_ = initial.af_;
        out.BC_ = initial.bc_;
        out.DE_ = initial.de_;
        out.HL_ = initial.hl_;
        out.WZ = initial.wz;
        out.Q = initial.q;
        out.P = initial.p;
        out.EI = initial.ei;
        out.IFF1 = initial.iff1;
        out.IFF2 = initial.iff2;
        out.IM = initial.im;
        out.prefix = 0x00;
        out.rprefix = Z80P.HL;

        let my_cycles = [];
        for (let j in initial.ram) {
            AS_Z80testRAM[faddr(initial.ram[j][0])] = initial.ram[j][1];
        }
        out.pins_D = 0;
        out.IR = Z80_S_DECODE;
        //out.TR = 0;
        out.pins_Addr = out.PC;
        out.TCU = -1;
        as.wasm.TST_Z80_set(cpu, out);
        let addr;
        let passed = true;
        for (let cyclei in tests[i].cycles)
        {
            out = as.wasm.TST_Z80_get(cpu);
            addr = out.pins_Addr;
            if (out.pins_RD && out.pins_MRQ) {
                out.pins_D = AS_Z80testRAM[addr];
                /*if (AS_Z80_TEST_DO_TRACING) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, cpu.trace_cycles, trace_format_read('Z80', Z80_COLOR, cpu.trace_cycles, addr & 0xFFFF, cpu.pins.D));
                }*/
                as.wasm.TST_Z80_set(cpu, out);
            } else if (out.pins_RD && out.pins_IO) {
                for (let p in tests[i].ports) {
                    if (tests[i].ports[p][0] === out.pins_Addr) {
                        out.pins_D = tests[i].ports[p][1];
                        as.wasm.TST_Z80_set(cpu, out);
                        break;
                    }
                }
            }

            as.wasm.TST_Z80_cycle(cpu);
            out = as.wasm.TST_Z80_get(cpu);

            let soy = out.pins_D;
            if (soy !== null) soy = hex2(soy)
            addr = out.pins_Addr;
            my_cycles.push([hex4(out.pins_Addr), soy, AS_Z80cycle_pins(out)]);

            let cycle = tests[i].cycles[cyclei];

            // Check address, data
            if (faddr(cycle[0]) !== addr) {
                messages.push(cyclei.toString() + ' MISMATCH IN ADDRESSES, THEIRS: ' + hex0x4(cycle[0]) + ' OURS: ' + hex0x4(addr));
                passed = false;
            }
            if (cycle[1] !== null && (cycle[1] !== out.pins_D)) {
                //console.log(cyclei, cycle[1], cpu.pins.D, my_cycles);
                messages.push(cyclei.toString() + ' MISMATCH IN DATAPIN AT ' + hex0x4(cycle[0]) + ' THEIRS: ' + hex0x2(cycle[1]) + ' OURS: ' + hex0x2(out.pins_D));
                passed = false;
            }
            // Check pins
            if (cpin('r', cycle[2]) && !out.pins_RD) {
                messages.push(cyclei.toString() + ' RD MISMATCH!');
                passed = false;
            }
            if (cpin('w', cycle[2]) && !out.pins_WR) {
                messages.push(cyclei.toString() + ' WR MISMATCH!');
                passed = false;
            }
            if (cpin('m', cycle[2]) && !out.pins_MRQ) {
                messages.push(cyclei.toString() + ' MRQ MISMATCH!');
                passed = false;
            }
            if (cpin('i', cycle[2]) && !out.pins_IO) {
                messages.push(cyclei.toString() + ' IO MISMATCH!');
                passed = false;
            }

            last_pc = out.PC;
            if (parseInt(cyclei) === (tests[i].cycles.length-1)) {
                if (out.IR !== Z80_S_DECODE) {
                    length_mismatch++;
                }
            }

            if (out.pins_WR && out.pins_MRQ) { // Write RAM
                if (AS_Z80_TEST_DO_TRACING) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, cpu.trace_cycles, trace_format_write('Z80', Z80_COLOR, cpu.trace_cycles, (addr & 0xFFFF), cpu.pins.D));
                }
                //console.log(i, 'WRITE', hex4(addr), hex2(cpu.pins.D));
                AS_Z80testRAM[addr] = out.pins_D;
            }
        }
        if (!passed) {
            console.log(as);
            messages.push('FAILED TEST! ' + i + ' ' + AS_Z80_PARSEP(out.F));
            as.wasm.TST_Z80_cycle(cpu); // for more trace
            return new AS_Z80test_return(passed, my_cycles, messages, addr_io_mismatched, length_mismatch, AS_Z80_fmt_test(tests[i]));
        }
        let testregs = function(name, mine, theirs, other_mine) {
            if (mine !== theirs) {
                //console.log(mine, theirs);
                if (name === 'F') {
                    messages.push('startF ' + AS_Z80_PARSEP(tests[i].f))
                    messages.push('ourF   ' + AS_Z80_PARSEP(out.F));
                    messages.push('theirF ' + AS_Z80_PARSEP(theirs));
                }
                if (name === 'PC') {
                    if (((out.PC - 1) & 0xFFFF) === theirs) {
                        if (is_call) return true;
                        console.log('HMM WHAT? OFF BY 1');
                    }
                    /*messages.push('its the PC. Testing...');
                    console.log('LETS SEE1', hex4(cpu.regs.PC), hex4(last_pc));
                    cpu.cycle();
                    console.log('LETS SEE', hex4(cpu.regs.PC));*/
                }
                console.log(name + ' MISMATCH!');;
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
        as.wasm.TST_Z80_cycle(cpu); // for more trace
        out = as.wasm.TST_Z80_get(cpu);
        passed &= testregs('PC', last_pc, final.pc, out.pins_Addr);
        passed &= testregs('SP', out.SP, final.sp);
        passed &= testregs('A', out.A, final.a);
        passed &= testregs('B', out.B, final.b);
        passed &= testregs('C', out.C, final.c);
        passed &= testregs('D', out.D, final.d);
        passed &= testregs('E', out.E, final.e);
        passed &= testregs('F', out.F, final.f);
        passed &= testregs('H', out.H, final.h);
        passed &= testregs('L', out.L, final.l);
        passed &= testregs('I', out.I, final.i);
        passed &= testregs('R', out.R, final.r);
        passed &= testregs('IX', out.IX, final.ix);
        passed &= testregs('IY', out.IY, final.iy);
        passed &= testregs('AF_', out.AF_, final.af_);
        passed &= testregs('BC_', out.BC_, final.bc_);
        passed &= testregs('DE_', out.DE_, final.de_);
        passed &= testregs('HL_', out.HL_, final.hl_);
        passed &= testregs('WZ', out.WZ, final.wz);
        passed &= testregs('IFF1', out.IFF1, final.iff1);
        passed &= testregs('IFF2', out.IFF2, final.iff2);
        passed &= testregs('IM', out.IM, final.im);

        if (passed) {
            passed &= testregs('Q', out.Q, final.q);
            //passed &= testregs('P', out.P, final.p);
            //passed &= testregs('EI', out.EI, final.ei);
        }

        for (let j in final.ram) {
            if (AS_Z80testRAM[faddr(final.ram[j][0])] !== final.ram[j][1]) {
                passed = false;
                messages.push('RAM failed! ' + hex0x4(final.ram[j][0]) + ' supposed to be ' + hex0x2(final.ram[j][1]) + ' but is ' + hex0x2(AS_Z80testRAM[final.ram[j][0]]));
            }
        }

        if (!passed) {
            messages.push('FAILED AT ENDING!');
            as.wasm.TST_Z80_cycle(cpu);
            //if (out.P.D === 0)
                return new AS_Z80test_return(false, my_cycles, messages, addr_io_mismatched, length_mismatch, AS_Z80_fmt_test(tests[i]));
        }
        if (AS_Z80_TEST_DO_TRACING) dbg.traces.clear();
        if (AS_Z80_TEST_ONE) break;
    }
    return new AS_Z80test_return(true, ins, messages, addr_io_mismatched, length_mismatch, null);
}

let AS_Z80_io_mismatches = [];

async function AS_test_pt_z80() {
    console.log('DO IT!');
    AS_Z80local_server_url = 'http://[::1]:8000/misc/tests/GeneratedTests/z80/v1/'
    await AS_dotest_pt_z80();
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
            ostr = 'FD CB __ ' + hi;
            break;
        default:
            console.log('WHAT!?', iclass);
            break;
    }
    return ostr.toLowerCase();
}

async function AS_test_pt_z80_ins(as, cpu, iclass, ins, is_call=false) {
    let opc = Z80_get_name(iclass, ins);
    let data = await getJSON(AS_Z80local_server_url + opc + '.json');
    console.log('TESTING', opc);
    let result = AS_Z80test_it_automated(as, cpu, data, is_call);
    if (!result.passed) {
        tconsole.addl(txf('{r}TEST FOR {/b}' + hex0x2(ins) + ' {/r*}FAILED!{/} See console for test deets'));
        console.log(result.failed_test_struct);
        console.log('THEIR CYCLES', result.failed_test_struct.cycles);
        console.log('OUR CYCLES', result.mycycles);
    }
    if (result.messages.length !== 0) {
        tconsole.addl(null, '------Messages:');
        for (let i in result.messages) {
            tconsole.addl(i, result.messages[i]);
        }
    }
    if (result.addr_io_mismatches !== 0) {
        tconsole.addl(txf('{r}ADDR MISMATCHES ON IO: {/}' + result.addr_io_mismatches))
        AS_Z80_io_mismatches.push(hex0x2(ins));
    }
    if (result.length_mismatches !== 0) {
        tconsole.addl(txf('{r}POTENTIAL CYCLE LENGTH MISMATCHES: {/}' + result.length_mismatches))
    }
    if ((!result.passed) && (AS_Z80_TEST_DO_TRACING)) {
        dbg.traces.draw(dconsole);
    }
    return result.passed;
}

async function AS_dotest_pt_z80() {
    console.log('TRYIN TO GET ME SOME JSON')
     let read8 = function(addr) {
        return AS_Z80testRAM[addr];
    }
    let total_fail = false;
    //let cpu = new z80_t(false);
    if (AS_Z80_TEST_DO_TRACING) {
        dbg.add_cpu(D_RESOURCE_TYPES.Z80, cpu);
        dbg.enable_tracing_for(D_RESOURCE_TYPES.Z80);
        dbg.enable_tracing();
    }
    let as = new as_wrapper_t();
    await as.do_setup();
    let cpu = as.wasm.TST_Z80_new();
    let start_test = 0xB0;
    let skip_tests = {
        0x00: [0x76], // HALT
        0xCB: [],
        0xDD: [0x76], // HALT
        0xFD: [0x76], // HALT
        0xED: [],
        0xDDCB: [],
        0xFDCB: []
    }
    let is_call = {
        0x00: [0xCD, 0xE9],
        0xCB: [],
        0xDD: [0xCD, 0xE9],
        0xFD: [0xCD, 0xE9],
        0xED: [0xB1],
        0xDDCB: [],
        0xFDCB: []
    }
    //let test_classes = [0x00, 0xCB, 0xED, 0xDD, 0xFD, 0xDDCB, 0xFDCB]
    // PASSED CLASSES: 0x00, 0xCB, 0xED, 0xDD, 0xFD, 0xDDCB
    // AS PASSED CLASSES: 0x00, 0xCB,
    //let test_classes = [0x00, 0xCB, 0xED, 0xDD, 0xFD, 0xDDCB, 0xFDCB];
    let test_classes = [0xED, 0xDD, 0xFD, 0xDDCB, 0xFDCB];
    //let test_classes = [0xDDCB];
    if (AS_Z80_TEST_DO_TRACING) cpu.enable_tracing(read8);
    for (let mclass in test_classes) {
        let iclass = test_classes[mclass];
        let opcode_table;
        let skip_table = skip_tests[iclass];
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
            if (skip_table.indexOf(i) !== -1) {
                tconsole.addl(txf('Test for ' + hex0x2(i) + ' {b}skipped{/}!'));
                continue;
            }
            if (typeof opcode_table[i] === 'undefined') {
                console.log('Skipping empty instruction', hex0x2(i));
                continue;
            }
            let icall = (is_call[iclass].indexOf(i) !== -1);
            let result = await AS_test_pt_z80_ins(as, cpu, iclass, i, icall);
            if (!result) {
                total_fail = true;
                break;
            }
            tconsole.addl(null, 'Test for ' + hex0x2(i) + ' passed!');
            if (AS_Z80_TEST_ONE) {total_fail = true; break; }
        }
        if (AS_Z80_io_mismatches.length > 0) console.log('IO mismatches occured for', AS_Z80_io_mismatches);
        if (total_fail) break;
    }
}