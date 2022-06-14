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
    let TO_ASSEMBLE = `
; HI!
.config
# 16 * 65536
ROM_SIZE $FFFFF

.vectors
RESET EMU_START

.EMU_START:$2020
; Let the compiler know it's emulated mode here
:E1
CLC
.POOF
XCE

:NATIVE M1 X1
JMP NATIVE_START

.NATIVE_START:$040200
:E0 M1 X1
; Next line should do a 16-bit load
LDA #$ABCD
; Next line should store 8bits in 0x2010 
STA $2010 
STP
    `;

    a.assemble(TO_ASSEMBLE);
    //console.log('2022 is', a.output[0x2022]);
    //console.log('FFFD is', a.output[0xFFFD]);
    return a.output;
}

function test_65c816() {
    let RAM = write_test_to_RAM();
    let padl = function(what, howmuch) {
        while(what.length < howmuch) {
            what = ' ' + what;
        }
        return what;
    }
    let read8 = function(bank, addr) {
        bank = bank & 0x0F;
        return RAM[(bank << 16) | addr];
    }
    let trace_read8 = function(bank, addr) {
        bank = bank & 0x0F;
        addr = (bank << 16) | addr;
        let ret = RAM[addr];

        //console.log('read ' + hex0x6(addr) + ': ' + hex0x2(ret));
        //dconsole.addl('read ' + hex0x6(addr) + ': ' + hex0x2(ret));
        return ret;
    }
    let trace_write8 = function(bank, addr, val) {
        bank = bank & 0x0F;
        RAM[(bank << 16) | addr] = val;
    }

    let cpu = new w65c816();
    console.log('RESETTING CPU');
    cpu.reset();
    cpu.enable_tracing(read8)
    let numcycles = 50;
    console.log('RUNNING CPU ' + numcycles + ' CYCLES');
    for (let i = 0; i < numcycles; i++) {
        cpu.cycle();
        if (cpu.pins.traces.length > 0) {
            dconsole.addl(cpu.pins.traces[0]);
            cpu.pins.traces = [];
        }
        if (cpu.pins.VDA || cpu.pins.VPA || cpu.pins.PDV) {
            if (cpu.pins.RW) {
                dconsole.addl('(' + padl(cpu.pins.trace_cycles.toString(), 6) + ')w' + hex0x2(cpu.pins.BA) + ' ' + hex0x4(cpu.pins.Addr) + ' WT   ' + hex0x2(cpu.pins.D));
                trace_write8(cpu.pins.BA, cpu.pins.Addr, cpu.pins.D);
            }
            else {
                cpu.pins.D = trace_read8(cpu.pins.BA, cpu.pins.Addr);
                dconsole.addl('(' + padl(cpu.pins.trace_cycles.toString(), 6) + ')r' + hex0x2(cpu.pins.BA) + ' ' + hex0x4(cpu.pins.Addr) + '  ' + hex0x2(cpu.pins.D));
            }
        }
    }
    console.log('DONE!');
}