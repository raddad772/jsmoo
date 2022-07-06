"use strict";

let R5A22_DO_TRACING_AT_START = true;
let WDC_DO_TRACING_AT_START = true;
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

class traces_t {
    constructor() {
        this.limit_traces = false;
        this.max_traces = 100;
        this.oldest_trace = 0;
        this.num_traces = 0;

        this.traces = [];
    }

    add(kind, master_clock, trace) {
        if (this.limit_traces) {
            if (master_clock < this.oldest_trace) return;
        }
        this.traces.push([master_clock, kind, trace]);
    }

    /**
     * @param {console_t} where
     */
    draw(where) {
        if (this.traces.length > 0)
        {
            this.traces = this.traces.sort(function(a, b) { return a[0] - b[0]; });
            for (let i in this.traces) {
                where.addl(this.traces[i][2], false, TRACE_BG_COLORS[this.traces[i][1]]);
            }
        }
        where.draw();
    }

}

//let traces = new traces_t();

const D_RESOURCE_TYPES = Object.freeze({R5A22: 0, SPC700: 1, WDC65C816: 2});

class breakpoint_t {
    constructor(resource_type, resource) {
        this.res_type = resource_type;
        this.res = resource;

    }
}

const DBG_STATES = Object.freeze({PAUSE: 0, RUN: 1})

class debugger_t {
    constructor() {
        this.traces = new traces_t();
        this.state = DBG_STATES.PAUSE;
        this.tracing = false;
        this.cpus = {};
        this.tracing_for = {};
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
        console.log('TRACE ON')
        this.tracing = true;
        this.cpu_refresh_tracing();
    }

    disable_tracing() {
        console.log('TRACE OFF')
        this.tracing = false;
        this.cpu_refresh_tracing();
    }

    enable_tracing_for(kind) {
        this.tracing_for[kind] = true;
    }

    disable_tracing_for(kind) {
        this.tracing_for[kind] = false;
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

    init_done() {
        this.disable_tracing();
        snes.step(INITIAL_STEPS.master, INITIAL_STEPS.scanlines-1, INITIAL_STEPS.frames, INITIAL_STEPS.seconds)
        this.enable_tracing();
        snes.step(0, 1);
        this.traces.draw();
    }
}

let dbg = new debugger_t();