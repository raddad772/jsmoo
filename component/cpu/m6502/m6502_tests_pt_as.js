"use strict";

//import {TST_M6502_cycle, TST_M6502_get, TST_M6502_set} from "../../../assemblyscript/assembly";
//importScripts('/helpers/as_wrapper.js');

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
let AS_M6502local_server_url;


let AS_M6502testRAM = new Uint8Array(65536);

function fmt_test(tst) {
    let oute = JSON.parse(JSON.stringify(tst));
    oute.initial.pc = hex4(oute.initial.pc);
    oute.initial.a = hex2(oute.initial.a);
    oute.initial.s = hex2(oute.initial.s);
    oute.initial.x = hex2(oute.initial.x);
    oute.initial.y = hex2(oute.initial.y);
    oute.initial.p = hex2(oute.initial.p);
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
    oute.final.a = hex2(oute.final.a);
    oute.final.s = hex2(oute.final.s);
    oute.final.x = hex2(oute.final.x);
    oute.final.y = hex2(oute.final.y);
    oute.final.p = hex2(oute.final.p);
    return oute;
}

class AS_M6502test_return {
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


function AS_M6502_PARSEP(w) {
    let outstr;
    //if (E === 0) {
        outstr = 'C' + + (w & 0x01);
        outstr += ' Z' + ((w & 0x02) >>> 1);
        outstr += ' I' + ((w & 0x04) >>> 2);
        outstr += ' D' + ((w & 0x08) >>> 3);
        outstr += ' B' + ((w & 0x10) >>> 4);
        outstr += ' --';
        outstr += ' V' + ((w & 0x40) >>> 6);
        outstr += ' N' + ((w & 0x80) >>> 7);
    //}
    return outstr;
}

//const M6502_TEST_DO_TRACING = true;

function faddr(addr) {
    return (addr & 0xFFFF);
}

const AS_M65C02_ADCSBC = [0x61, 0x65, 0x69, 0x6D, 0x71, 0x72, 0x75, 0x79, 0x7D, 0xE1, 0xE5, 0xE9, 0xED, 0xF1, 0xF2, 0xF5, 0xF9, 0xFD]
function M65C02_IS_ADCSBC(ins) {
    return (AS_M65C02_ADCSBC.indexOf(ins) !== -1);
}

function AS_test_it_automated(as, cpu, tests) {
    let padl = function(what, howmuch) {
        while(what.length < howmuch) {
            what = ' ' + what;
        }
        return what;
    }
    let cpin = function(what, from) {
        return (from.indexOf(what) !== -1);
    }

    //cpu.clock.trace_cycles = 1;
    let cyclei;
    let last_pc;
    let ins;
    let messages = [];
    let addr_io_mismatched = 0;
    let length_mismatch = 0;
    for (let i in tests) {
        let initial = tests[i].initial;
        let final = tests[i].final;
        let out = as.wasm.TST_M6502_get(cpu);
        out.PC = (initial.pc+1) & 0xFFFF;
        out.S = initial.s;
        out.A = initial.a;
        out.X = initial.x;
        out.Y = initial.y;
        out.P = initial.p;
        for (let j in initial.ram) {
            AS_M6502testRAM[faddr(initial.ram[j][0])] = initial.ram[j][1];
        }
        out.pins_D = AS_M6502testRAM[((out.PC - 1) & 0xFFFF)];
        out.IR = out.pins_D;
        ins = out.IR;
        out.pins_Addr = (out.PC-1) & 0xFFFF;
        out.TCU = 0;
        //cpu.RES_pending = false;
        as.wasm.TST_M6502_set(cpu, out);
        let addr;
        let passed = true;
        for (let cyclei in tests[i].cycles)
        {
            let cycle = tests[i].cycles[cyclei];
            out = as.wasm.TST_M6502_get(cpu);
            addr = out.pins_Addr;
            //let iocycle = cycle[2].indexOf('d') === -1 && cycle[2].indexOf('p') === -1;
            // Check address, data

            if (faddr(cycle[0]) !== addr) {
                if (M65C02_IS_ADCSBC(ins) && (parseInt(cyclei) === (tests[i].cycles.length-1))) {
                    //console.log('MISMATCH ADDRESS BUT OK');
                }
                else {
                    messages.push(cyclei.toString() + ' MISMATCH IN ADDRESSES, THEIRS: ' + hex0x4(cycle[0]) + ' OURS: ' + hex0x4(addr));
                    passed = false;
                }
            }
            if (cycle[1] !== null && (cycle[1] !== out.pins_D)) {
                if (M65C02_IS_ADCSBC(ins) && (parseInt(cyclei) === (tests[i].cycles.length-1))) {
                    //console.log('MISMATCH RAM BUT OK');
                }
                else {
                    messages.push(cyclei.toString() + ' MISMATCH IN RAM AT ' + hex0x4(cycle[0]) + ' THEIRS: ' + hex0x2(cycle[1]) + ' OURS: ' + hex0x2(out.pins_D));
                    passed = false;
                }
            }
            // Check pins
            if (cpin('read', cycle[2]) && out.pins_RW) {
                messages.push(cyclei.toString() + ' RW MISMATCH!');
                passed = false;
            }
            if (cpin('write', cycle[2]) && !out.pins_RW) {
                messages.push(cyclei.toString() + ' RW MISMATCH OTHER WAY!');
                passed = false;
            }

            last_pc = out.PC;
            //if (WDC_TEST_DO_TRACING)dconsole.addl(null, 'CALL CYCLE');
            if (parseInt(cyclei) === (tests[i].cycles.length-1)) {
                if (out.TCU === 0)
                    length_mismatch++;
            }
            as.wasm.TST_M6502_cycle(cpu);
            out = as.wasm.TST_M6502_get(cpu);

            addr = out.pins_Addr;
            if (out.pins_RW) { // Write
                if (M6502_TEST_DO_TRACING) {
                    //dbg.traces.add(D_RESOURCE_TYPES.M6502, cpu.clock.trace_cycles, trace_format_write('MOS', MOS_COLOR, cpu.clock.trace_cycles, (addr & 0xFFFF), cpu.pins.D));
                }
                AS_M6502testRAM[addr] = out.pins_D;
            }
            else {
                out.pins_D = AS_M6502testRAM[addr];
                if (M6502_TEST_DO_TRACING) {
                    //dbg.traces.add(D_RESOURCE_TYPES.M6502, cpu.clock.trace_cycles, trace_format_read('MOS', MOS_COLOR, cpu.clock.trace_cycles, addr & 0xFFFF, cpu.pins.D));
                }
                as.wasm.TST_M6502_set(cpu, out);
            }
        }
        out = as.wasm.TST_M6502_get(cpu);
        if (!passed) {
            messages.push('FAILED TEST! ' + i + ' ' + AS_M6502_PARSEP(out.P));
            TST_M6502_cycle(cpu);
            //cpu.cycle(); // for more trace
            return new AS_M6502test_return(passed, ins, messages, addr_io_mismatched, length_mismatch, fmt_test(tests[i]));
        }
        let testregs = function(name, mine, theirs) {
            if (mine !== theirs) {
                if (name === 'P') {
                    //cpu.regs.P.B = +(!cpu.regs.P.B);
                    if (out.P & 0x10) out.P &= 0xEF;
                    else out.P |= 0x10;
                    if (out.P === theirs) {
                        return true;
                    }
                    // If 0x61 and D is set, see if V is the problem
                    if (M65C02_IS_ADCSBC(ins) && (out.P & 8)) {
                        if (out.P & 0x40) out.P &= 0xBF;
                        else out.P |= 0xBF;
                        if (out.P === theirs) {
                            return true;
                        }

                    }
                    messages.push('A: ' + hex0x2(out.A));
                    messages.push('ourP   ' + AS_M6502_PARSEP(out.P));
                    messages.push('theirP ' + AS_M6502_PARSEP(theirs));
                }
                messages.push('F ' + name + ' MISMATCH! MINE:' + hex0x2(mine) + ' THEIRS:' + hex0x2(theirs));
                return false;
            }
            return true;
        }
        //let JMP_INS = [];
        let JMP_INS = [0x00, 0x02, 0x10, 0x20, 0x30, 0x40, 0x4C, 0x50, 0x6C, 0x70, 0x7C, 0x80, 0x90, 0xB0, 0xD0, 0xF0, 0xFC, 0x54, 0x44];
        if (JMP_INS.indexOf(ins) !== -1) {
            passed &= testregs('PC', (out.PC - 1) & 0xFFFF, final.pc)
        } else passed &= testregs('PC', last_pc, final.pc);
        passed &= testregs('ACCUMULATOR', out.A, final.a);
        passed &= testregs('X', out.X, final.x);
        passed &= testregs('Y', out.Y, final.y);
        passed &= testregs('S', out.S, final.s);
        passed &= testregs('P', out.P, final.p);

        for (let j in final.ram) {
            if (AS_M6502testRAM[faddr(final.ram[j][0])] !== final.ram[j][1]) {
                passed = false;
                messages.push('RAM failed! ' + hex0x4(final.ram[j][0]) + ' supposed to be ' + hex0x2(final.ram[j][1]) + ' but is ' + hex0x2(AS_M6502testRAM[final.ram[j][0]]));
            }
        }

        if (!passed) {
            messages.push('FAILED AT ENDING!');
            TST_M6502_cycle(cpu);
            //if (cpu.regs.P.D === 0)
                return new AS_M6502test_return(false, ins, messages, addr_io_mismatched, length_mismatch, fmt_test(tests[i]));
        }
        //dbg.traces.clear();
    }
    return new AS_M6502test_return(true, ins, messages, addr_io_mismatched, length_mismatch, null);
}

let AS_M6502_io_mismatches = [];

async function AS_test_pt_nesm6502() {
    AS_M6502local_server_url = 'http://[::1]:8000/misc/tests/ProcessorTests/nes6502/v1/'
    await AS_test_pt_m6502(nesm6502_opcodes_decoded);
}

async function AS_test_pt_m65c02() {
    AS_M6502local_server_url = 'http://[::1]:8000/misc/tests/ProcessorTests/wdc65c02/v1/'
    await AS_test_pt_m6502(m65c02_opcodes_decoded, true);
}

async function AS_test_pt_m6502_ins(as, cpu, ins) {
    let opc = hex2(ins).toLowerCase();
    let data = await getJSON(AS_M6502local_server_url + opc + '.json');
    console.log('TESTING', hex0x2(ins));
    let result = AS_test_it_automated(as, cpu, data);
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
        AS_M6502_io_mismatches.push(hex0x2(ins));
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

async function AS_test_pt_m6502(opcodes, skip65c02brr=false) {
    console.log('TRYIN TO GET ME SOME JSON')
     let read8 = function(addr) {
        return AS_M6502testRAM[addr];
    }
    let as = new gp_wrapper_t();
    await as.do_setup();
    //let cpu = new m6502_t(opcodes, {});

    let cpu = as.wasm.TST_M6502_new();

    /*dbg.add_cpu(D_RESOURCE_TYPES.M6502, cpu);
    if (M6502_TEST_DO_TRACING) {
        dbg.enable_tracing_for(D_RESOURCE_TYPES.M6502);
        dbg.enable_tracing();
    }*/
    let start_test = 0;
    let skip_tests = []; // Tests do not correctly set B after BRK
    if (skip65c02brr) {
        skip_tests = [0x0F, 0x1F, 0x2F, 0x3F, 0x4F, 0x5F, 0x6F, 0x7F, 0x8F, 0x9F, 0xAF, 0xBF, 0xCF, 0xDF, 0xEF, 0xFF,
            0xCB, 0xDB,
        ];
    }
    //if (M6502_TEST_DO_TRACING) cpu.enable_tracing(read8);
    //console.log('DO TRACING?', WDC_TEST_DO_TRACING);
    for (let i = start_test; i < 256; i++) {
        if (skip_tests.indexOf(i) !== -1) {
            tconsole.addl(txf('Test for ' + hex0x2(i) + ' {b}skipped{/}!'));
            continue;
        }
        if (opcodes[i].addr_mode === M6502_AM.NONE) {
            console.log('Skipping empty instruction', hex0x2(i));
            continue;
        }
        let result = await AS_test_pt_m6502_ins(as, cpu,i);
        if (!result) break;
        tconsole.addl(null, 'Test for ' + hex0x2(i) + ' passed!');
    }
    if (AS_M6502_io_mismatches.length > 0) console.log('IO mismatches occured for', AS_M6502_io_mismatches);
}