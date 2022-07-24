"use strict";

let R5A22_DO_TRACING_AT_START = false;
let WDC_DO_TRACING_AT_START = false;
let SPC_DO_TRACING_AT_START = false;
let TRACE_COLOR = true;
let SPC_TRACING_START = 20 * 68 * 262 * 9;
                     // 20 master clock cycles = 1 of ours
                          // 68 of OUR cycles per scanline
                               // 262 scanlines per frame
                                     // 9 frames
SPC_TRACING_START = 0; // Start at beginning
let TRACE_ADDR = '{*}'
let TRACE_READ = '{g}';
let TRACE_WRITE = '{b}';
let SPC_COLOR = '{r}';
let WDC_COLOR = '{b}';
let WDC_TRACE_IO = false;
let TRACE_INS_PADDING = 20;

const TRACERS = Object.freeze({
    R5A22: 0,
    SPC: 1,
    WDC: 2
});

const TRACE_BG_COLORS = Object.freeze({
    [TRACERS.R5A22]: '#ddf',
    [TRACERS.WDC]: '#dfd',
    [TRACERS.SPC]: '#fdd',
})

const WATCH_WHICH = Object.freeze({
    WDC_C: 0,
    WDC_X: 1,
    WDC_Y: 2,
    WDC_P: 3,
    WDC_D: 4,
    WDC_PC: 5,
    WDC_PBR: 6,
    WDC_DBR: 7,
    WDC_IR: 8,
    WDC_SP: 9
});

const WATCH_RELATIONSHIP = Object.freeze({
    LT: 0,
    LTE: 1,
    EQ: 2,
    GTE: 3,
    GT: 4
});

class watch_t {
    constructor(WHICH, RELATIONSHIP, WHAT) {
        this.which = WHICH;
        this.relationship = RELATIONSHIP;
        this.what = WHAT;
        this.wdc = null;
        this.spc = null;
        this.old_val = 0;
    }

    getval() {
        if (this.wdc === null) {
            alert('NULL WDC');
            return 0;
        }
        let val;
        switch(this.which) {
            case WATCH_WHICH.WDC_C:
                val = this.wdc.cpu.regs.C;
                break;
            case WATCH_WHICH.WDC_X:
                val = this.wdc.cpu.regs.X;
                break;
            case WATCH_WHICH.WDC_Y:
                val = this.wdc.cpu.regs.Y;
                break;
            case WATCH_WHICH.WDC_P:
                val = this.wdc.cpu.regs.P.getbyte_native();
                break;
            case WATCH_WHICH.WDC_D:
                val = this.wdc.cpu.regs.D;
                break;
            case WATCH_WHICH.WDC_PC:
                val = this.wdc.cpu.regs.PC;
                break;
            case WATCH_WHICH.WDC_PBR:
                val = this.wdc.cpu.regs.PBR;
                break;
            case WATCH_WHICH.WDC_DBR:
                val = this.wdc.cpu.regs.DBR;
                break;
            case WATCH_WHICH.WDC_IR:
                val = this.wdc.cpu.regs.IR;
                break;
            case WATCH_WHICH.WDC_SP:
                val = this.wdc.cpu.regs.SP;
                break;
        }
        return val;
    }

    evaluate() {
        if (this.wdc === null) {
            alert('NULL WDC');
            return true;
        }
        let ret = false;
        let val = this.getval();
        let truth = false;
        switch(this.relationship) {
            case WATCH_RELATIONSHIP.LT:
                truth = val < this.old_val;
                break;
            case WATCH_RELATIONSHIP.LTE:
                truth = val <= this.old_val;
                break;
            case WATCH_RELATIONSHIP.EQ:
                truth = val === this.old_val;
                break;
            case WATCH_RELATIONSHIP.GTE:
                truth = val >= this.old_val;
                break;
            case WATCH_RELATIONSHIP.GT:
                truth = val > this.old_val;
                break;
        }
        this.old_val = val;
        return truth;
    }
}

class traces_t {
    constructor() {
        this.limit_traces = false;
        this.max_traces = 100;
        this.oldest_trace = 0;
        this.drew_to = null;
        this.num_traces = 0;

        this.traces = [];
    }

    add(kind, master_clock, trace) {
        //console.log('MASTER CLOCK', master_clock, this.oldest_trace);
        /*if (this.limit_traces) {
            if (master_clock < this.oldest_trace) return;
        }*/
        this.traces.push([master_clock, kind, trace]);
    }

    /**
     * @param {console_t} where
     */
    draw(where) {
        if (this.traces.length > 0)
        {
            //console.log(this.traces);
            this.traces = this.traces.sort(function(a, b) { return a[0] - b[0]; });
            if (where.max_lines < this.traces.length) {
                //this.traces = this.traces
                //this.traces = this.traces.slice(0, where.max_lines);
                this.traces = this.traces.slice(0 - where.max_lines);
            }
            //where.buffer = [];
            for (let i in this.traces) {
                where.addl(this.traces[i][0], this.traces[i][2], TRACE_BG_COLORS[this.traces[i][1]], false);
            }
        }
        this.drew_to = where;
        this.clear();
        where.draw();
    }

    clear() {
        //if (this.drew_to !== null) this.drew_to.buffer = [];
        this.traces = [];
    }

}

//let traces = new traces_t();

const D_RESOURCE_TYPES = Object.freeze({R5A22: 0, SPC700: 1, WDC65C816: 2, SNESPPU: 3});

class breakpoint_t {
    constructor(resource_type, resource) {
        this.res_type = resource_type;
        this.res = resource;

    }
}

class SNES_DMA_log_entry_t {
    constructor() {
        this.source_addr = 0;
        this.dest_addr = 0;
        this.bytes = 0;
        this.transfer_mode = 0;
    }
}

const DBG_STATES = Object.freeze({PAUSE: 0, RUN: 1})

class debugger_t {
    constructor() {
        this.traces = new traces_t();
        this.state = DBG_STATES.PAUSE;
        this.tracing = false;
        this.do_break = false;
        this.cpus = {};
        this.tracing_for = {};

        this.watch_on = false;
        this.watch = new watch_t(WATCH_WHICH.WDC_IR, WATCH_RELATIONSHIP.GTE, 0x40); // 0x1F6

        this.brk_on_NMIRQ = false;
    }

    cpu_refresh_tracing() {
        for (let k in this.cpus) {
            if (!this.tracing) {
                this.cpus[k].disable_tracing();
                continue;
            }
            if (this.tracing_for[k])
                this.cpus[k].enable_tracing();
            else
                this.cpus[k].disable_tracing();
        }
    }

    enable_tracing() {
        this.tracing = true;
        this.cpu_refresh_tracing();
    }

    disable_tracing() {
        this.tracing = false;
        this.cpu_refresh_tracing();
    }

    enable_tracing_for(kind) {
        let old = this.tracing_for[kind];
        this.tracing_for[kind] = true;
        if (old === false)  this.cpu_refresh_tracing();
    }

    disable_tracing_for(kind) {
        let old = this.tracing_for[kind];
        this.tracing_for[kind] = false;
        if (old === true)  this.cpu_refresh_tracing();
    }

    add_cpu(kind, cpu) {
        this.cpus[kind] = cpu;
        if (kind === D_RESOURCE_TYPES.R5A22) {
            this.tracing_for[kind] = R5A22_DO_TRACING_AT_START;
        }
        else if (kind === D_RESOURCE_TYPES.WDC65C816) {
            this.tracing_for[kind] = WDC_DO_TRACING_AT_START;
        }
        else if (kind === D_RESOURCE_TYPES.SPC700) {
            this.tracing_for[kind] = SPC_DO_TRACING_AT_START;
        }
        this.cpu_refresh_tracing();
    }

    step_masterclock(howmany) {
        if (this.state !== DBG_STATES.PAUSE) {
            alert('Cannot step while running');
            return;
        }
        snes.step_masterclock(howmany);
    }

    step(master_clocks, scanlines, frames, seconds) {
        if (this.state !== DBG_STATES.PAUSE) {
            alert('Cannot step while running');
            return;
        }
        snes.step(master_clocks, scanlines, frames, seconds);
    }

    break(whodidit) {
        // CASUE BREAK
        this.state = DBG_STATES.PAUSE;
        this.do_break = true;
        let overflow = snes.clock.cpu_deficit;
        console.log('BREAK AT PPU Y', snes.clock.scanline.ppu_y);
        if (whodidit === D_RESOURCE_TYPES.WDC65C816 || whodidit === D_RESOURCE_TYPES.R5A22) {
            snes.clock.cpu_deficit = 0;
            snes.apu.catch_up();
            snes.ppu.catch_up();
        }
        else if (whodidit === D_RESOURCE_TYPES.SPC700) {
            snes.ppu.catch_up();
        }
        //snes.clock.apu_deficit -= overflow;
        //snes.clock.ppu_deficit -= overflow;
        console.log('AFTER BREAK deficits', snes.clock.cpu_deficit, snes.clock.apu_deficit, snes.clock.ppu_deficit)
    }

    init_done() {
        this.disable_tracing();
        //snes.step(INITIAL_STEPS.master, INITIAL_STEPS.scanlines-1, INITIAL_STEPS.frames, INITIAL_STEPS.seconds)
        this.enable_tracing();
        //snes.step(0, 1);
        //this.traces.draw(dconsole);
    }
}

let dbg = new debugger_t();