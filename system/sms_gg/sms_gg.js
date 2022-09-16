"use strict";

const SMSGG_variants = {
    SMS1: 0,
    SMS2: 1,
    GG: 3
}

/*
 2 mclk = 1 vdp clock
 3 mclk = 1 cpu, sound, etc. clock

 so
 cpu.cycle()
 vdp.cycle()
 vdp.cycle()

 then
 cpu.cycle()
 vdp.cycle()

 alternating.

c
 179,208 mclk per frame
 262 lines
 512mclk active display, 172mclk border area
 684mclk per line

 For a frame interrupt, INT is pulled low 607 mclks into scanline 192
  relative to pixel 0.
  This is 4 mclks before the rising edge of /HSYNC which starts the next scanline.
 For a line interrupt, /INT is pulled low 608 mclks into the appropriate scanline
  relative to pixel 0.
  This is 3 mclks before the rising edge of /HSYNC which starts the next scanline
 */

class SMSGG_clock {
    constructor(variant) {
        this.variant = variant;
        this.master_clock_speed = 10738580 // 10.73858MHz

        this.cpu_master_clock = 0;
        this.vdp_master_clock = 0;

        this.master_frame = 0;

        this.cpu_divisor = 3;
        this.vdp_divisor = 2;

        this.trace_cycles = 0;

        this.vdp_frame_ready = false;

        this.cpu_frame_cycle = 0;
        this.vdp_frame_cycle = 0;

        this.ccounter = 0;
        this.hpos = 0;
        this.vpos = 0;
        this.line_counter = 0;

        this.timing = {
            fps: 60,
            frame_lines: 262, // PAL 313
            cc_line: 260, // PAL 311
            bottom_rendered_line: 191,
            rendered_lines: 192,
            vblank_start: 192 // not sure?
        }
    }
}

class SMSGG_bus {
    constructor(variant) {
        this.variant = variant;

        this.RAM = new Uint8Array(8192);

        /**
         * @type {SMSGG_vdp}
         */
        this.vdp = null;

        /**
         * @type {SMSGG}
         */
        this.system = null;

        this.notify_IRQ = function(level) { debugger; }
    }
}

class SMSGG {
    constructor(variant) {
        this.variant = variant;
        this.bus = new SMSGG_bus(this.variant);
        this.cpu = new z80_t(false);
        this.bus.system = this;
        this.bus.notify_IRQ = this.notify_IRQ.bind(this);
    }

    notify_IRQ(level) {
        this.cpu.IRQ_pending = !!level;
        if (!this.cpu.IRQ_pending) this.cpu.IRQ_ack = false;
    }
}