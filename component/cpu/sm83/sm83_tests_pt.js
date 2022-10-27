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
let SM83local_server_url;
let SM83_TEST_ONE = false;

let SM83testRAM = new Uint8Array(65536);

function dhex4(what) {
    if (typeof what === 'string') {
        what = parseInt(what);
    }
    return hex4(what);
}

function dhex2(what) {
    if (typeof what === 'string') {
        what = parseInt(what);
    }
    return hex2(what);
}

function SM83_fmt_test(tst) {
    let oute = JSON.parse(JSON.stringify(tst));
    oute.initial.pc = dhex4(oute.initial.pc);
    oute.initial.sp = dhex4(oute.initial.sp);
    oute.initial.a = dhex2(oute.initial.a);
    oute.initial.b = dhex2(oute.initial.b);
    oute.initial.c = dhex2(oute.initial.c);
    oute.initial.d = dhex2(oute.initial.d);
    oute.initial.e = dhex2(oute.initial.e);
    oute.initial.f = dhex2(oute.initial.f);
    oute.initial.h = dhex2(oute.initial.h);
    oute.initial.l = dhex2(oute.initial.l);
    for (let j in oute.initial.ram) {
        let ro = oute.initial.ram[j]
        ro[0] = dhex4(ro[0]);
        if (ro[1] !== null) ro[1] = dhex2(ro[1]);
    }
    for (let j in oute.final.ram) {
        let ro = oute.final.ram[j]
        ro[0] = dhex4(ro[0]);
        if (ro[1] !== null) ro[1] = dhex2(ro[1]);
    }
    for (let ci in oute.cycles) {
        let cycle = oute.cycles[ci];
        cycle[0] = dhex4(cycle[0]);
        if (cycle[1] !== null) cycle[1] = dhex2(cycle[1]);
    }
    oute.final.pc = dhex4(oute.final.pc);
    oute.final.sp = dhex4(oute.final.sp);
    oute.final.a = dhex2(oute.final.a);
    oute.final.b = dhex2(oute.final.b);
    oute.final.c = dhex2(oute.final.c);
    oute.final.d = dhex2(oute.final.d);
    oute.final.e = dhex2(oute.final.e);
    oute.final.f = dhex2(oute.final.f);
    oute.final.h = dhex2(oute.final.h);
    oute.final.l = dhex2(oute.final.l);
    return oute;
}

class SM83test_return {
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


function SM83_PARSEP(w) {
    let outstr;
    //if (E === 0) {
        outstr = 'C' + ((w & 0x10) >> 4);
        outstr += ' H' + ((w & 0x20) >>> 5);
        outstr += ' N' + ((w & 0x40) >>> 6);
        outstr += ' Z' + ((w & 0x80) >>> 7);
    //}
    return outstr;
}

const SM83_TEST_DO_TRACING = true;

function faddr(addr) {
    return (addr & 0xFFFF);
}

function SM83cycle_pins(pins) {
    if (pins.WR) return 'write';
    else return 'read';
}

/**
 * @param {SM83_t} cpu
 * @param tests
 * @param {boolean} is_call
 * @returns {SM83test_return}
 */
function SM83test_it_automated(cpu, tests, is_call = false) {
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
        cpu.regs.prefix = 0x00;

        let my_cycles = [];
        for (let j in initial.ram) {
            SM83testRAM[faddr(parseInt(initial.ram[j][0]))] = parseInt(initial.ram[j][1]);
        }
        cpu.regs.IR = SM83_S_DECODE;
        cpu.pins.Addr = cpu.regs.PC;
        cpu.pins.D = SM83testRAM[cpu.regs.PC];
        cpu.regs.TCU = 0;
        let addr;
        let passed = true;
        for (let cyclei in tests[i].cycles)
        {
            addr = cpu.pins.Addr;
            if (cpu.pins.RD && cpu.pins.MRQ) {
                cpu.pins.D = SM83testRAM[addr];
                if (SM83_TEST_DO_TRACING) {
                    dbg.traces.add(D_RESOURCE_TYPES.SM83, cpu.trace_cycles, trace_format_read('SM83', SM83_COLOR, cpu.trace_cycles, addr & 0xFFFF, cpu.pins.D));
                }
            }

            cpu.cycle();
            let soy = cpu.pins.D;
            if (soy !== null) soy = hex2(soy)
            addr = cpu.pins.Addr;
            my_cycles.push([hex4(cpu.pins.Addr), soy, SM83cycle_pins(cpu.pins)]);

            let cycle = tests[i].cycles[cyclei];
            cycle[0] = parseInt(cycle[0]);
            cycle[1] = parseInt(cycle[1]);

            // Check address, data
            if (faddr(cycle[0]) !== addr) {
                messages.push(cyclei.toString() + ' MISMATCH IN ADDRESSES, THEIRS: ' + hex0x4(cycle[0]) + ' OURS: ' + hex0x4(addr));
                passed = false;
            }
            if (cycle[1] !== null && (cycle[1] !== cpu.pins.D)) {
                //console.log(cyclei, cycle[1], cpu.pins.D, my_cycles);
                messages.push(cyclei.toString() + ' MISMATCH IN DATAPIN AT ' + hex0x4(cycle[0]) + ' THEIRS: ' + hex0x2(cycle[1]) + ' OURS: ' + hex0x2(cpu.pins.D));
                passed = false;
            }
            // Check pins
            if (cycle[2] !== SM83cycle_pins(cpu.pins)) {
                messages.push(cyclei.toString() + ' PINS MISMATCH!!');
                passed = false;
            }

            last_pc = cpu.regs.PC;
            if (parseInt(cyclei) === (tests[i].cycles.length-1)) {
                if (cpu.regs.IR !== Z80_S_DECODE) {
                    length_mismatch++;
                }
            }

            if (cpu.pins.WR && cpu.pins.MRQ) { // Write RAM
                if (SM83_TEST_DO_TRACING) {
                    dbg.traces.add(D_RESOURCE_TYPES.SM83, cpu.trace_cycles, trace_format_write('SM83', SM83_COLOR, cpu.trace_cycles, (addr & 0xFFFF), cpu.pins.D));
                }
                //console.log(i, 'WRITE', hex4(addr), hex2(cpu.pins.D));
                SM83testRAM[addr] = cpu.pins.D;
            }
        }
        if (!passed) {
            messages.push('FAILED TEST! ' + i + ' ' + SM83_PARSEP(cpu.regs.F.getbyte()));
            cpu.cycle(); // for more trace
            return new SM83test_return(passed, my_cycles, messages, addr_io_mismatched, length_mismatch, SM83_fmt_test(tests[i]));
        }
        let testregs = function(name, mine, theirs, other_mine) {
            if (mine !== theirs) {
                //console.log(mine, theirs);
                if (name === 'F') {
                    messages.push('startF ' + SM83_PARSEP(tests[i].f))
                    messages.push('ourF   ' + SM83_PARSEP(cpu.regs.F.getbyte()));
                    messages.push('theirF ' + SM83_PARSEP(theirs));
                }
                if (name === 'PC') {
                    if (((cpu.regs.PC - 1) & 0xFFFF) === theirs) {
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
        cpu.cycle(); // for more trace
        passed &= testregs('PC', last_pc, final.pc, cpu.pins.Addr);
        passed &= testregs('SP', cpu.regs.SP, final.sp);
        passed &= testregs('A', cpu.regs.A, final.a);
        passed &= testregs('B', cpu.regs.B, final.b);
        passed &= testregs('C', cpu.regs.C, final.c);
        passed &= testregs('D', cpu.regs.D, final.d);
        passed &= testregs('E', cpu.regs.E, final.e);
        passed &= testregs('F', cpu.regs.F.getbyte(), final.f);
        passed &= testregs('H', cpu.regs.H, final.h);
        passed &= testregs('L', cpu.regs.L, final.l);

        for (let j in final.ram) {
            if (SM83testRAM[faddr(parseInt(final.ram[j][0]))] !== parseInt(final.ram[j][1])) {
                passed = false;
                messages.push('RAM failed! ' + hex0x4(parseInt(final.ram[j][0])) + ' supposed to be ' + hex0x2(final.ram[j][1]) + ' but is ' + hex0x2(SM83testRAM[parseInt(final.ram[j][0])]));
            }
        }

        if (!passed) {
            messages.push('FAILED AT ENDING!');
            cpu.cycle();
            //if (cpu.regs.P.D === 0)
                return new SM83test_return(false, my_cycles, messages, addr_io_mismatched, length_mismatch, SM83_fmt_test(tests[i]));
        }
        dbg.traces.clear();
        if (SM83_TEST_ONE) break;
    }
    return new SM83test_return(true, ins, messages, addr_io_mismatched, length_mismatch, null);
}

let SM83_io_mismatches = [];

async function test_pt_z80() {
    SM83local_server_url = 'http://[::1]:8000/misc/tests/gameboy-test-data/cpu_tests/v1/'
    await dotest_pt_sm83();
}

function SM83_get_name(iclass, ins) {
    let hi = hex2(ins);
    let ostr = '';
    switch(iclass) {
        case 0:
            ostr = hi;
            break;
        case 0xCB:
            ostr = 'CB ' + hi;
            break;
        default:
            console.log('WHAT!?', iclass);
            break;
    }
    return ostr.toLowerCase();
}

async function test_pt_sm83_ins(cpu, iclass, ins, is_call=false) {
    let opc = SM83_get_name(iclass, ins);
    let data = await getJSON(SM83local_server_url + opc + '.json');
    console.log('TESTING', opc);
    let result = SM83test_it_automated(cpu, data, is_call);
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
        SM83_io_mismatches.push(hex0x2(ins));
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
    //if (!result.passed) debugger;
    return result.passed;
}

async function dotest_pt_sm83() {
    console.log('TRYIN TO GET ME SOME JSON')
     let read8 = function(addr) {
        return SM83testRAM[addr];
    }

    let total_fail = false;
    let cpu = new SM83_t(false);
    dbg.add_cpu(D_RESOURCE_TYPES.SM83, cpu);
    if (SM83_TEST_DO_TRACING) {
        dbg.enable_tracing_for(D_RESOURCE_TYPES.SM83);
        dbg.enable_tracing();
    }
    let start_test = 0;
    let skip_tests = {
        0x00: [], // HALT
        0xCB: [],
    }
    let is_call = {
        0x00: [],
        0xCB: [],
    }
    //let test_classes = [0x00, 0xCB, 0xED, 0xDD, 0xFD, 0xDDCB, 0xFDCB]
    // PASSED CLASSES: 0x00, 0xCB, 0xED, 0xDD, 0xFD, 0xDDCB
    let test_classes = [0x00, 0xCB];
    //let test_classes = [0xDDCB];
    if (SM83_TEST_DO_TRACING) cpu.enable_tracing(read8);
    for (let mclass in test_classes) {
        let iclass = test_classes[mclass];
        let opcode_table;
        let skip_table = skip_tests[iclass];
        switch(iclass) {
            case 0xDD:
            case 0xFD:
            case 0x00:
                opcode_table = SM83_opcode_matrix;
                break;
            case 0xCB:
                opcode_table = SM83_opcode_matrixCB;
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
            let result = await test_pt_sm83_ins(cpu, iclass, i, icall);
            if (!result) {
                total_fail = true;
                break;
            }
            tconsole.addl(null, 'Test for ' + hex0x2(i) + ' passed!');
            if (SM83_TEST_ONE) {total_fail = true; break; }
        }
        if (SM83_io_mismatches.length > 0) console.log('IO mismatches occured for', SM83_io_mismatches);
        if (total_fail) break;
    }
}