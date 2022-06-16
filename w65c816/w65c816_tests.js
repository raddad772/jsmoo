"use strict";
// This file generates test vectors for the 65c816 core.
// This file depends on the pin-centric method of emulation

const TK = Object.freeze({
    ASM: 0,
    STP: 1
});

const CYCLEK = Object.freeze({
    IO: 0,
    R: 1,
    W: 2
});

function if_defined(what, def) {
    if (typeof(def) === 'undefined') def = null;
    return typeof(what) !== 'undefined' ? what : null;
}

class w65c816_test_pins {
    // Read/write,
    constructor(cyclekind, RW, D_W, D, Addr, BA, cyclenum) {
        this.cyclekind = cyclekind;
        this.RW = RW;    // Cycle should be read/write cycle
        this.D = D;  // Expected value at end of a cycle, or null for dont care
        this.Addr = Addr; // Expected address at end of cycle
        this.BA = BA;    // Expected bank at end of cycle
        this.cyclenum = if_defined(cyclenum); // For a program to keep track of the cycle number if they want
        this.errored = false;
        this.error_reason = '';
    }

    get_error() {
        if (!this.errored) return null;
        return this.error_reason;
    }

    set_error(reason) {
        this.errored = true;
        this.error_reason = reason;
    }

    check(cpu) {
        let pins = cpu.pins;
        let VAB = null; // valid address bus
        if (PINS_SEPERATE_PDV)
            VAB = pins.VDA || pins.VPA || pins.VPB;
        else
            VAB = pins.PDV;
        switch (this.cyclekind) {
            case CYCLEK.IO:
                if (VAB) { this.set_error('RPDV values do not match expected cycle type IO'); return false; }
                break;
            case CYCLEK.R:
                if (!VAB || pins.RW) { this.set_error('RPDV values do not match expected cycle type R'); return false; }
                break;
            case CYCLEK.W:
                if (!VAB || !pins.RW) { this.set_error('RPDV values do not match expected cycle type W'); return false; }
                break;
        }
        if (this.D !== null && this.D !== pins.D) { this.set_error('D (' + hex0x2(pins.D) + ') does not match expected value: ' + hex0x2(this.D)); return null; }
        if (this.Addr !== null && this.Addr !== pins.Addr)  { this.set_error('Address (' + hex0x4(pins.Addr) + ') does not match expected value: ' + hex0x4(this.Addr)); return false; }
        if (this.BA !== null && this.BA !== pins.BA) { this.set_error('Bank (' + hex0x2(pins.BA) + ') does not match expected bank: ' + hex0x4(this.BA)); return false; }
        if (this.cyclenum !== null && this.cyclenum !== cpu.regs.trace_cycles) { this.set_error('Cycle #' + cpu.regs.trace_cycles + ' does not match expected value: ' + this.cyclenum); return false; }

        return true;
    }
}

function format_reg(regname, value, E) {
    let padl0 = function(what, howmuch) {
        while(what.length < howmuch) {
            what = '0' + what;
        }
        return what;
    }
    switch(regname) {
        case 'A8': // 8-bit registers
        case 'C8':
        case 'PBR':
        case 'DBR':
            return hex0x2(value & 0xFF);
        case 'C': // 16-bit registers
        case 'X':
        case 'Y':
        case 'D':
        case 'PC':
        case 'S':
            return hex0x4(value & 0xFFFF);
        case 'E':
            return value ? '1' : '0';
        case 'P':
            return padl0(value.getbyte_native.toString(2), 8);
    }
    return '#?';
}

class w65c816_test_regs {
    constructor(regs_dict) {
        this.regsd = regs_dict;
        this.errored = false;
        this.error_reason = '';
    }

    get_error() {
        if (!this.errored) return null;
        return this.error_reason;
    }

    set_error(reason) {
        this.errored = true;
        this.error_reason = reason;
    }

    tst(cpu, regname) {
        if (regname === 'A') regname = 'C';
        if (this.regsd.hasOwnProperty(regname) && this.regsd[regname] !== null) {
            if (regname === 'P') { // P has lots of flags to test depending on current mode
                if (this.regsd.P !== cpu.regs.P.getbyte_native()) {
                    this.set_error('CPU register ' + regname + ' (' + format_reg(regname, cpu.regs[regname], cpu.regs.E, cpu.regs.P.M, cpu.regs.P.X) + ') does not match expected value: ' + format_reg(regname, this.regsd[regname], cpu.regs.E, cpu.regs.P.M, cpu.regs.P.X));
                    return false;
                }
            }
            else {
                if (this.regsd[regname] !== cpu.regs[regname]) {
                    this.set_error('CPU register ' + regname + ' (' + format_reg(regname, cpu.regs[regname], cpu.regs.E, cpu.regs.P.M, cpu.regs.P.X) + ') does not match expected value: ' + format_reg(regname, this.regsd[regname], cpu.regs.E, cpu.regs.P.M, cpu.regs.P.X));
                    return false;
                }
            }
        }
        return true;
    }

    check(cpu) {
        let regs = cpu.regs;
        let tst_list = ['PC', 'PBR', 'DBR', 'C', 'D', 'X', 'Y', 'P', 'IR', 'S', 'E'];
        for (let i in tst_list) {
            if (!this.tst(cpu, tst_list[i])) return false;
        }
        return true;
    }
}

class w65c816_test_case {
    constructor(kind, RAM_ASMinit, testfuncs, cpu) {
        this.kind = kind;
        this.ASM = ASMinit;
        this.testfuncs = (typeof(testfuncs) === 'undefined' || testfuncs === null) ? [function(cpu){return true}] : testfuncs;
        if (typeof(cpu) === 'undefined') {
            this.cpu = new w65c816();
        }
        else
            this.cpu = cpu;

        if (typeof(RAM_ASMinit) === 'string') {
            let r = new w65c816_assembler();
            r.assemble(RAM_ASMinit, true);
            this.RAM = r.output;
        }
        else {
            this.RAM = RAM_ASMinit;
        }

        this.asm_final_state = new w65c816_test_pins(CYCLEK.IO, 0, null, 0, 0x20, 0x4000);
    }

}


function write_test_to_RAM()
{
    let a = new w65c816_assembler();
    let TO_ASSEMBLE = INIT_ASM;// + TEST_ABS_RW;

    a.assemble(TO_ASSEMBLE);
    //console.log('2022 is', a.output[0x2022]);
    //console.log('FFFD is', a.output[0xFFFD]);
    return a.output;
}

function clr_canvas() {
    let imageData = pxctx.getImageData(0, 0, 256, 256);
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i]     = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
    pxctx.putImageData(imageData, 0, 0);
}

function put_pixel(x, y, color) {
    let imageData = pxctx.getImageData(0, 0, 1, 1);
    imageData.data[0] = color ? 255 : 0;
    imageData.data[1] = color ? 255 : 0;
    imageData.data[2] = color ? 255 : 0;
    pxctx.putImageData(imageData, x, y)
}

let canvasel;
let pxctx;

// A test "machine" with basic graphics output
class tester_65c816 {
    constructor() {
        canvasel = document.getElementById('glCanvas');
        pxctx = canvasel.getContext('2d');
        clr_canvas();
        this.RAM = write_test_to_RAM();
        this.cpu = new w65c816();
        this.cpu.reset();
        this.init = false;
        let ctrl = this;
        this.read8 = function(bank, addr) {
            bank = bank & 0x0F;
            return ctrl.RAM[(bank << 16) | addr];
        }
        this.trace_read8 = function(bank, addr) {
            bank = bank & 0x0F;
            addr = (bank << 16) | addr;
            let ret = ctrl.RAM[addr];

            return ret;
        }
    }



    trace_write8(bank, addr, val) {
        bank = bank & 0x0F;
        this.RAM[(bank << 16) | addr] = val;
        // Display!
        if (bank === 1) {
            let x = (addr & 0xFF);
            let y = (addr & 0xFF00) >> 8;
            put_pixel(x, y, val);
        }
    }

    do_cycles(numcycles) {
        if (!this.init) {
            this.init = true;
            this.cpu.enable_tracing(this.read8);
        }
        let padl = function(what, howmuch) {
            while(what.length < howmuch) {
                what = ' ' + what;
            }
            return what;
        }
        for (let i = 0; i < numcycles; i++) {
            this.cpu.cycle();
            if (this.cpu.pins.traces.length > 0) {
                dconsole.addl(this.cpu.pins.traces[0]);
                this.cpu.pins.traces = [];
            }
            if (this.cpu.pins.VDA || this.cpu.pins.VPA || this.cpu.pins.PDV) {
                if (this.cpu.pins.RW) {
                    dconsole.addl('(' + padl(this.cpu.pins.trace_cycles.toString(), 6) + ')w' + hex0x2(this.cpu.pins.BA) + ' ' + hex0x4(this.cpu.pins.Addr) + ' WT   ' + hex0x2(this.cpu.pins.D));
                    this.trace_write8(this.cpu.pins.BA, this.cpu.pins.Addr, this.cpu.pins.D);
                }
                else {
                    this.cpu.pins.D = this.trace_read8(this.cpu.pins.BA, this.cpu.pins.Addr);
                    dconsole.addl('(' + padl(this.cpu.pins.trace_cycles.toString(), 6) + ')r' + hex0x2(this.cpu.pins.BA) + ' ' + hex0x4(this.cpu.pins.Addr) + '  ' + hex0x2(this.cpu.pins.D));
                }
            }
        }

    }

}

let testcpu;

function test_65c816() {
    testcpu = new tester_65c816();
    let numcycles = 60;
    testcpu.do_cycles(numcycles);
}