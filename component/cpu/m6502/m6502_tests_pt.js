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
let local_server_url;


let M6502testRAM = new Uint8Array(65536);

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

class test_return {
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


function M6502_PARSEP(w) {
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

const M6502_TEST_DO_TRACING = true;

function faddr(addr) {
    return (addr & 0xFFFF);
}

/**
 * @param {m6502_t} cpu
 * @param tests
 * @returns {test_return}
 */
function test_it_automated(cpu, tests) {
    let padl = function(what, howmuch) {
        while(what.length < howmuch) {
            what = ' ' + what;
        }
        return what;
    }
    let cpin = function(what, from) {
        return (from.indexOf(what) !== -1);
    }

    cpu.clock.trace_cycles = 1;
    let cyclei;
    let last_pc;
    let ins;
    let messages = [];
    let addr_io_mismatched = 0;
    let length_mismatch = 0;
    for (let i in tests) {
    //if (true) {
    //for (let i = 0; i < 300; i++) {
        //console.log(fmt_test(tests[i]));
        let initial = tests[i].initial;
        let final = tests[i].final;
        cpu.regs.PC = (initial.pc+1) & 0xFFFF;
        cpu.regs.S = initial.s;
        cpu.regs.A = initial.a;
        cpu.regs.X = initial.x;
        cpu.regs.Y = initial.y;
        cpu.regs.P.setbyte(initial.p);
        for (let j in initial.ram) {
            M6502testRAM[faddr(initial.ram[j][0])] = initial.ram[j][1];
        }
        cpu.pins.D = M6502testRAM[((cpu.regs.PC - 1) & 0xFFFF)];
        cpu.regs.IR = cpu.pins.D;
        ins = cpu.regs.IR;
        cpu.pins.Addr = (cpu.regs.PC-1) & 0xFFFF;
        cpu.regs.TCU = 0;
        cpu.RES_pending = false;
        let addr;
        let passed = true;
        for (let cyclei in tests[i].cycles)
        {
            let cycle = tests[i].cycles[cyclei];
            addr = cpu.pins.Addr;
            //let iocycle = cycle[2].indexOf('d') === -1 && cycle[2].indexOf('p') === -1;
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
            if (cpin('read', cycle[2]) && cpu.pins.RW) {
                messages.push(cyclei.toString() + ' RW MISMATCH!');
                passed = false;
            }
            if (cpin('write', cycle[2]) && !cpu.pins.RW) {
                messages.push(cyclei.toString() + ' RW MISMATCH OTHER WAY!');
                passed = false;
            }

            last_pc = cpu.regs.PC;
            //if (WDC_TEST_DO_TRACING)dconsole.addl(null, 'CALL CYCLE');
            if (parseInt(cyclei) === (tests[i].cycles.length-1)) {
                if (cpu.regs.TCU === 0)
                    length_mismatch++;
            }
            cpu.cycle();

            addr = cpu.pins.Addr;
            if (cpu.pins.RW) { // Write
                if (M6502_TEST_DO_TRACING) {
                    dbg.traces.add(D_RESOURCE_TYPES.M6502, cpu.clock.trace_cycles, trace_format_write('MOS', MOS_COLOR, cpu.clock.trace_cycles, (addr & 0xFFFF), cpu.pins.D));
                }
                M6502testRAM[addr] = cpu.pins.D;
            }
            else {
                cpu.pins.D = M6502testRAM[addr];
                if (M6502_TEST_DO_TRACING) {
                    dbg.traces.add(D_RESOURCE_TYPES.M6502, cpu.clock.trace_cycles, trace_format_read('MOS', MOS_COLOR, cpu.clock.trace_cycles, addr & 0xFFFF, cpu.pins.D));
                }
            }
        }
        if (!passed) {
            messages.push('FAILED TEST! ' + i + ' ' + M6502_PARSEP(cpu.regs.P.getbyte()));
            cpu.cycle(); // for more trace
            return new test_return(passed, ins, messages, addr_io_mismatched, length_mismatch, fmt_test(tests[i]));
        }
        let testregs = function(name, mine, theirs) {
            if (mine !== theirs) {
                if (name === 'P') {
                    cpu.regs.P.B = +(!cpu.regs.P.B);
                    if (cpu.regs.P.getbyte() === theirs) {
                        return true;
                    }
                    messages.push('A: ' + hex0x2(cpu.regs.A));
                    messages.push('ourP   ' + M6502_PARSEP(cpu.regs.P.getbyte()));
                    messages.push('theirP ' + M6502_PARSEP(theirs));
                }
                messages.push('F ' + name + ' MISMATCH! MINE:' + hex0x2(mine) + ' THEIRS:' + hex0x2(theirs));
                return false;
            }
            return true;
        }
        //let JMP_INS = [];
        let JMP_INS = [0x00, 0x02, 0x10, 0x20, 0x30, 0x40, 0x4C, 0x50, 0x6C, 0x70, 0x7C, 0x80, 0x90, 0xB0, 0xD0, 0xF0, 0xFC, 0x54, 0x44];
        if (JMP_INS.indexOf(ins) !== -1) {
            passed &= testregs('PC', (cpu.regs.PC - 1) & 0xFFFF, final.pc)
        } else passed &= testregs('PC', last_pc, final.pc);
        passed &= testregs('ACCUMULATOR', cpu.regs.A, final.a);
        passed &= testregs('X', cpu.regs.X, final.x);
        passed &= testregs('Y', cpu.regs.Y, final.y);
        passed &= testregs('S', cpu.regs.S, final.s);
        passed &= testregs('P', cpu.regs.P.getbyte(), final.p);

        for (let j in final.ram) {
            if (M6502testRAM[faddr(final.ram[j][0])] !== final.ram[j][1]) {
                passed = false;
                messages.push('RAM failed! ' + hex0x4(final.ram[j][0]) + ' supposed to be ' + hex0x2(final.ram[j][1]) + ' but is ' + hex0x2(M6502testRAM[final.ram[j][0]]));
            }
        }

        if (!passed) {
            messages.push('FAILED AT ENDING!');
            cpu.cycle();
            //if (cpu.regs.P.D === 0)
                return new test_return(false, ins, messages, addr_io_mismatched, length_mismatch, fmt_test(tests[i]));
        }
        dbg.traces.clear();

    }
    return new test_return(true, ins, messages, addr_io_mismatched, length_mismatch, null);
}

let M6502_io_mismatches = [];

async function test_pt_nesm6502() {
    local_server_url = 'http://[::1]:8000/misc/tests/ProcessorTests/nes6502/v1/'
    await test_pt_m6502(nesm6502_opcodes_decoded);
}

async function test_pt_m65c02() {
    local_server_url = 'http://[::1]:8000/misc/tests/ProcessorTests/wdc65c02/v1/'
    await test_pt_m6502(m65c02_opcodes_decoded, true);
}

async function test_pt_m6502_ins(cpu, ins) {
    let opc = hex2(ins).toLowerCase();
    let data = await getJSON(local_server_url + opc + '.json');
    console.log('TESTING', hex0x2(ins));
    let result = test_it_automated(cpu, data);
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
        M6502_io_mismatches.push(hex0x2(ins));
    }
    if (result.length_mismatches !== 0) {
        tconsole.addl(txf('{r}POTENTIAL CYCLE LENGTH MISMATCHES: {/}' + result.length_mismatches))
    }
    if (!result.passed) {
        dbg.traces.draw(dconsole);
    }
    cpu.pins.traces = [];
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

async function test_pt_m6502(opcodes, skip65c02brr=false) {
    console.log('TRYIN TO GET ME SOME JSON')
     let read8 = function(addr) {
        return M6502testRAM[addr];
    }

    let cpu = new m6502_t(opcodes, {});
    dbg.add_cpu(D_RESOURCE_TYPES.M6502, cpu);
    if (M6502_TEST_DO_TRACING) {
        dbg.enable_tracing_for(D_RESOURCE_TYPES.M6502);
        dbg.enable_tracing();
    }
    let start_test = 0x0F;
    let skip_tests = []; // Tests do not correctly set B after BRK
    if (skip65c02brr) {
        skip_tests = [0x0F, 0x1F, 0x2F, 0x3F, 0x4F, 0x5F, 0x6F, 0x7F, 0x8F, 0x9F, 0xAF, 0xBF, 0xCF, 0xDF, 0xEF, 0xFF];
    }
    if (M6502_TEST_DO_TRACING) cpu.enable_tracing(read8);
    //console.log('DO TRACING?', WDC_TEST_DO_TRACING);
    for (let i = start_test; i < 256; i++) {
        if (skip_tests.indexOf(i) !== -1) {
            tconsole.addl(txf('Test for ' + hex0x2(i) + ' {b}skipped{/}!'));
            continue;
        }
        if (cpu.opcode_table[i].addr_mode === M6502_AM.NONE) {
            console.log('Skipping empty instruction', hex0x2(i));
            continue;
        }
        let result = await test_pt_m6502_ins(cpu,i);
        if (!result) break;
        tconsole.addl(null, 'Test for ' + hex0x2(i) + ' passed!');
    }
    if (M6502_io_mismatches.length > 0) console.log('IO mismatches occured for', M6502_io_mismatches);
}