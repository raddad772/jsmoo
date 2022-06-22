"use strict";

// https://stackoverflow.com/questions/2499567/how-to-make-a-json-call-to-an-url/2499647#2499647
function getJSONP(url, success) {
    console.log('HEY!');
    var ud = '_' + +new Date,
        script = document.createElement('script'),
        head = document.getElementsByTagName('head')[0]
               || document.documentElement;

    console.log('HEY2!')
    window[ud] = function(data) {
        console.log('HEY3!');
        head.removeChild(script);
        success && success(data);
    };

    script.src = url;
    console.log('HEY4!');
    head.appendChild(script);
}

//let tt = 'ProcessorTests/65816/v1/00.e.json'
//let tt = 'https://github.com/TomHarte/ProcessorTests/raw/main/65816/v1/00.e.json'
//let tt = 'http://127.0.0.1:8000/00.e.json'
let tt = 'http://[::1]:8000/'

function PARSEP(w, E) {
    let outstr;
    //if (E === 0) {
        outstr = 'C' + +(w & 0x01);
        outstr += ' Z' + ((w & 0x02) >> 1);
        outstr += ' I' + ((w & 0x04) >> 2);
        outstr += ' D' + ((w & 0x08) >> 3);
        outstr += ' X' + ((w & 0x10) >> 4);
        outstr += ' M' + ((w & 0x20) >> 5);
        outstr += ' V' + ((w & 0x40) >> 6);
        outstr += ' N' + ((w & 0x80) >> 7);
    //}
    return outstr;
}

const getJSON = async url => {
    const response = await fetch(url);
    if (!response.ok) { // check if response worked (no 404 errors etc...)
        console.log(response);
        }
    //throw new Error(response.statusText);

  const data = response.json(); // get JSON from the response
  return data; // returns a promise, which resolves to this data value
}

let testRAM = new Uint8Array(16 * 1024 * 1024);

function fmt_test(tst) {
    let oute = JSON.parse(JSON.stringify(tst));
    oute.initial.pc = hex4(oute.initial.pc);
    oute.initial.dbr = hex2(oute.initial.dbr);
    oute.initial.pbr = hex2(oute.initial.pbr);
    oute.initial.a = hex4(oute.initial.a);
    oute.initial.s = hex2(oute.initial.s);
    oute.initial.x = hex4(oute.initial.x);
    oute.initial.y = hex4(oute.initial.y);
    oute.initial.d = hex4(oute.initial.d);
    oute.initial.p = hex2(oute.initial.p);
    for (let j in oute.initial.ram) {
        let ro = oute.initial.ram[j]
        ro[0] = hex6(ro[0]);
        ro[1] = hex2(ro[1]);
    }
    for (let ci in oute.cycles) {
        let cycle = oute.cycles[ci];
        cycle[0] = hex6(cycle[0]);
        cycle[1] = hex2(cycle[1]);
    }
    oute.final.pc = hex4(oute.final.pc);
    oute.final.dbr = hex2(oute.final.dbr);
    oute.final.pbr = hex2(oute.final.pbr);
    oute.final.a = hex4(oute.final.a);
    oute.final.s = hex2(oute.final.s);
    oute.final.x = hex4(oute.final.x);
    oute.final.y = hex4(oute.final.y);
    oute.final.d = hex4(oute.final.d);
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

let DO_TRACING = true;

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

    cpu.pins.trace_cycles = 1;
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
        cpu.regs.C = initial.a;
        cpu.regs.X = initial.x;
        cpu.regs.Y = initial.y;
        cpu.regs.DBR = initial.dbr;
        cpu.regs.D = initial.d;
        cpu.regs.PBR = initial.pbr;
        cpu.regs.E = initial.e;
        cpu.regs.P.setbyte_native(initial.p);
        for (let j in initial.ram) {
            testRAM[initial.ram[j][0]] = initial.ram[j][1];
        }
        if (PINS_SEPERATE_PDV) {
            cpu.pins.VDA = cpu.pins.VPA = 1;
        }
        else {
            cpu.pins.PDV = 1;
        }
        cpu.pins.D = testRAM[(cpu.regs.PBR << 16) + ((cpu.regs.PC - 1) & 0xFFFF)]
        cpu.regs.IR = cpu.pins.D;
        ins = cpu.regs.IR;
        cpu.pins.Addr = (cpu.regs.PC-1) & 0xFFFF;
        cpu.pins.BA = cpu.regs.PBR;
        cpu.clear_RES();
        let addr;
        let passed = true;
        for (let cyclei in tests[i].cycles)
        {
            let cycle = tests[i].cycles[cyclei];
            addr = (cpu.pins.BA << 16) + cpu.pins.Addr;
            let iocycle = cycle[2].indexOf('d') === -1 && cycle[2].indexOf('p') === -1;
            // Check address, data

            if (cycle[0] !== addr) {
                if (!iocycle) {
                    messages.push(cyclei.toString() + ' MISMATCH IN ADDRESSES, THEIRS: ' + hex0x6(cycle[0]) + ' OURS: ' + hex0x6(addr));
                    passed = false;
                }
                else {
                    addr_io_mismatched += 1;
                    //console.log(cyclei, 'MISMATCH IN ADDRESSES, THEIRS', hex0x6(cycle[0]), hex0x6(addr));
                }
            }
            if (cycle[1] !== null && (cycle[1] !== cpu.pins.D) && !iocycle) {
                messages.push(cyclei.toString() + ' MISMATCH IN VALUE THEIRS: ' + hex0x2(cycle[1]) + ' OURS: ' + hex0x2(cpu.pins.D));
                passed = false;
            }
            // Check pins
            if (cpin('r', cycle[2]) && cpu.pins.RW) {
                messages.push(cyclei.toString() + ' RW MISMATCH!');
                passed = false;
            }
            if (cpin('w', cycle[2]) && !cpu.pins.RW) {
                messages.push(cyclei.toString() + ' RW MISMATCH OTHER WAY!');
                passed = false;
            }
            if (PINS_SEPERATE_PDV) { // VDA, VPA, and VPB are emulated
                if (+cpin('d', cycle[2]) !== cpu.pins.VDA) {
                    messages.push(cyclei.toString() + ' VDA MISMATCH!');
                    passed = false;
                }
                if (+cpin('p', cycle[2]) !== cpu.pins.VPA) {
                    messages.push(cyclei.toString() + ' VPA MISMATCH!');
                    passed = false;
                }
            }
            else { // They are combined into one pin via OR
                if ((+(cpin('d', cycle[2]) || cpin('p', cycle[2]))) !== cpu.pins.PDV) {
                    messages.push(cyclei.toString() + ' PDV MISMATCH! THEIRS' + (+(cpin('d', cycle[2]) || cpin('p', cycle[2]))).toString() + ' MINE' + cpu.pins.PDV.toString() +  ' TCU' + cpu.regs.TCU);
                    passed = false;
                }
            }

            last_pc = cpu.regs.PC;
            //if (DO_TRACING)dconsole.addl('CALL CYCLE');
            if (parseInt(cyclei) === (tests[i].cycles.length-1)) {
                if (cpu.regs.TCU === 0)
                    length_mismatch++;
            }
            cpu.cycle();

            if (cpu.pins.PDV || cpu.pins.VDA || cpu.pins.VPA) {
                addr = (cpu.pins.BA << 16) + cpu.pins.Addr;
                if (cpu.pins.RW) { // Write
                    if (DO_TRACING) {
                        cpu.pins.traces.push('(' + padl(cpu.pins.trace_cycles.toString(), 6) + ')w' + hex0x2(cpu.pins.BA) + ' ' + hex0x4(cpu.pins.Addr) + ' WT   ' + hex0x2(cpu.pins.D));
                    }
                    testRAM[addr] = cpu.pins.D;
                }
                else {
                    cpu.pins.D = testRAM[addr];
                    if (DO_TRACING) {
                        cpu.pins.traces.push('(' + padl(cpu.pins.trace_cycles.toString(), 6) + ')r' + hex0x2(cpu.pins.BA) + ' ' + hex0x4(cpu.pins.Addr) + '  ' + hex0x2(cpu.pins.D));
                    }
                }
            }
            else {
                if (DO_TRACING) {
                    cpu.pins.traces.push('(' + padl(cpu.pins.trace_cycles.toString(), 6) + ') IO CYCLE');
                }
            }
        }
        if (!passed) {
            messages.push('FAILED TEST! ' + i + ' ' + PARSEP(cpu.regs.P.getbyte_native(), 0));
            cpu.cycle(); // for more trace
            return new test_return(passed, ins, messages, addr_io_mismatched, length_mismatch, fmt_test(tests[i]));
        }
        let testregs = function(name, mine, theirs) {
            if (mine !== theirs) {
                messages.push('F ' + name + ' MISMATCH! MINE:' + hex0x2(mine) + ' THEIRS:' + hex0x2(theirs));
                if (name === 'P') {
                    messages.push('C: ' + hex0x4(cpu.regs.C));
                    messages.push('ourP   ' + PARSEP(cpu.regs.P.getbyte_native() + ' ' + cpu.regs.E));
                    messages.push('theirP ' + PARSEP(theirs, cpu.regs.E));
                }
                return false;
            }
            return true;
        }
        if ((ins === 0xFC)) {
            passed &= testregs('PC', (cpu.regs.PC - 1) & 0xFFFF, final.pc)
        } else passed &= testregs('PC', last_pc, final.pc);
        passed &= testregs('ACCUMULATOR', cpu.regs.C, final.a);
        passed &= testregs('X', cpu.regs.X, final.x);
        passed &= testregs('Y', cpu.regs.Y, final.y);
        passed &= testregs('PBR', cpu.regs.PBR, final.pbr);
        passed &= testregs('DBR', cpu.regs.DBR, final.dbr);
        passed &= testregs('D', cpu.regs.D, final.d);
        passed &= testregs('S', cpu.regs.S, final.s);
        passed &= testregs('P', cpu.regs.P.getbyte_native(), final.p);
        passed &= testregs('E', cpu.regs.E, final.e);

        for (let j in final.ram) {
            if (testRAM[final.ram[j][0]] !== final.ram[j][1]) {
                passed = false;
                messages.push('RAM failed! ' + hex0x6(final.ram[j][0]) + ' supposed to be ' + hex0x2(final.ram[j][1]) + ' but is ' + hex0x2(testRAM[final.ram[j][0]]));
            }
        }

        if (!passed) {
            messages.push('FAILED AT ENDING!');
            cpu.cycle();
            //if (cpu.regs.P.D === 0)
                return new test_return(false, ins, messages, addr_io_mismatched, length_mismatch, fmt_test(tests[i]));
        }

    }
    return new test_return(true, ins, messages, addr_io_mismatched, length_mismatch, null);
}

async function test_pt_65c816_ins(cpu, ins) {
    let opc = hex2(ins).toLowerCase() + '.n';
    let data = await getJSON(tt + opc + '.json');
    let result = test_it_automated(cpu, data)
    if (!result.passed) {
        tconsole.addl(txf('{r}TEST FOR {/b}' + hex0x2(ins) + ' {/r*}FAILED!{/} See console for test deets'));
        console.log(result.failed_test_struct);
    }
    if (result.messages.length !== 0) {
        tconsole.addl('------Messages:');
        for (let i in result.messages) {
            tconsole.addl(result.messages[i]);
        }
    }
    if (result.addr_io_mismatches !== 0) {
        tconsole.addl(txf('{r}ADDR MISMATCHES ON IO: {/}' + result.addr_io_mismatches))
    }
    if (result.length_mismatches !== 0) {
        tconsole.addl(txf('{r}POTENTIAL CYCLE LENGTH MISMATCHES: {/}' + result.length_mismatches))
    }
    if (!result.passed) {
        let strt = cpu.pins.traces.length - 25;
        strt = strt > 0 ? strt : 0;
        for (let i = strt; i < cpu.pins.traces.length; i++) {
            dconsole.addl(cpu.pins.traces[i]);
        }
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
}

async function test_pt_65c816() {
    console.log('TRYIN TO GET ME SOME JSON')
     let read8 = function(bank, addr) {
        return testRAM[(bank << 16) | addr];
    }
    let cpu = new w65c816();
    if (DO_TRACING) cpu.enable_tracing(read8);
    await test_pt_65c816_ins(cpu,0x01)
    //for (let i = 0; i < 256; i++) {
        /*while(in_testing) {

        }*/
    //test_pt_65c816_ins(i);

    //}
}