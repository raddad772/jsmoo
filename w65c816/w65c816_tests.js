"use strict";
// This file generates test vectors for the 65c816 core.
// This file depends on the pin-centric method of emulation

class wd65c816_pins_expected {
    constructor(D, BA, Addr, RW, VDA, VPA, VPP, extra) {
        if (typeof(extra) === 'undefined') extra = function(regs, pins){return true;};
        this.D = D;
        this.BA = BA;
        this.Addr = Addr;
        this.RW = RW;
        this.VDA = VDA;
        this.VPA = VPA;
        this.VPP = VPP;
        this.extra = extra;
    }

    compare(pins) {
        let failed = false;
        failed |= pins.D !== this.D;
        failed |= pins.BA !== this.BA;
        failed |= pins.Addr !== this.Addr;
        failed |= pins.RW !== this.RW;
        failed |= pins.VDA !== this.VDA;
        failed |= pins.VPA !== this.VPA;
        failed |= pins.VPP !== this.VPP;
        failed |= !this.extra();
        if (failed) {
            console.log('Failure!', pins, this);
        }
        return !failed;
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

:NATIVE M0 X0
JMP NATIVE_START

.NATIVE_START:$100200
:E0 M0 X0
LDA #$ABCD
STP
    `;

    a.assemble(TO_ASSEMBLE);
    console.log('FFFC is', a.output[0xFFFC]);
    console.log('FFFD is', a.output[0xFFFD]);
    return a.output;
}

function test_65c816() {
    let RAM = write_test_to_RAM();
    let trace_read8 = function(bank, addr) {
        bank = bank & 0x0F;
        let ret = RAM[(bank << 16) | addr];
        console.log('CPU read ' + hex0x6(addr) + ' value ' + hex0x2(ret));
        return ret;
    }
    let trace_write8 = function(bank, addr, val) {
        bank = bank & 0x0F;
        let ret = RAM[(bank << 16) | addr];
        console.log('CPU write ' + hex0x2(val) + ' to ' + hex0x6(addr));
    }

    let cpu = new w65c816();
    console.log('RESETTING CPU');
    cpu.reset();
    cpu.enable_tracing(trace_read8)
    console.log('RUNNING CPU 10 CYCLES');
    for (let i = 0; i < 10; i++) {
        cpu.cycle();
        if (cpu.pins.traces.length > 0) {
            dconsole.addl(cpu.pins.traces[0]);
            cpu.pins.traces = [];
        }
        if (cpu.pins.VDA || cpu.pins.VPA) {
            if (cpu.pins.RW) {
                trace_write8(cpu.pins.BA, cpu.pins.Addr, cpu.pins.D);
            }
            else {
                let r = trace_read8(cpu.pins.BA, cpu.pins.Addr);
                console.log('Setting pins to ', r);
                cpu.pins.D = r;
                console.log('PINS', cpu.pins.D);
            }
        }
    }
    console.log('DONE!');
}