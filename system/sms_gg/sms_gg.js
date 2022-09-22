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
    constructor(variant, region) {
        this.variant = variant;
        this.region = region;
        this.master_clock_speed = 10738580 // 10.73858MHz

        this.cpu_master_clock = 0;
        this.vdp_master_clock = 0;

        this.frames_since_restart = 0;

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
            region: REGION.NTSC,
            vblank_start: 192 // not sure?
        }
    }
}

class SMSGG {
    /**
     * @param {canvas_manager_t} canvas_manager
     * @param {number} variant
     * @param {number} region
     */
    constructor(canvas_manager, variant, region) {
        this.canvas_manager = canvas_manager;
        this.variant = variant;
        this.region = region
        this.clock = new SMSGG_clock(variant, region);
        this.bus = new SMSGG_bus(variant, region);
        this.cpu = new z80_t(false);
        this.cpu.reset();

        this.display_enabled = true;

        this.last_frame = 0;

        this.bus.system = this;
        this.bus.notify_IRQ = this.cpu.notify_IRQ.bind(this.cpu);
        this.bus.notify_NMI = this.cpu.notify_NMI.bind(this.cpu);

        this.vdp = new SMSGG_VDP(canvas_manager, this.variant, this.clock, this.bus);
        this.vdp.reset();

        this.bus.vdp = this.vdp;

        this.bus.mapper.cpu = this.cpu;

        dbg.add_cpu(D_RESOURCE_TYPES.Z80, this);
        if (variant === SMSGG_variants.GG) {
            input_config.connect_controller('gg');
        }
        else {
            input_config.connect_controller('sms1');
        }
    }

    killall() {
        dbg.remove_cpu(D_RESOURCE_TYPES.Z80, this);
        if (this.variant === SMSGG_variants.GG) {
            input_config.disconnect_controller('gg');
        }
        else {
            input_config.disconnect_controller('sms1');
        }
    }

    enable_display(to) {
        if (to !== this.display_enabled) {
            this.display_enabled = to;
        }
    }

    reset() {
        this.cpu.reset();
        this.vdp.reset();
        this.bus.reset();
        this.last_frame = 0;
    }

    trace_peek(addr) {
        return this.bus.cpu_read(addr, 0, false);
    }

    enable_tracing() {
        this.cpu.enable_tracing(this.trace_peek.bind(this));
    }

    disable_tracing() {
        this.cpu.disable_tracing();
    }

    poll_pause() {
        if (this.bus.pause_button.poll()) {
            console.log('PAUSE!!!!');
            this.bus.notify_NMI(1);
        }
        else {
            this.bus.notify_NMI(0);
        }
    }

    step_master(howmany) {
        for (let i = 0; i < howmany; i++) {
            if (this.clock.frames_since_restart !== this.last_frame) {
                this.last_frame = this.clock.frames_since_restart;
                this.poll_pause();
            }
            this.clock.cpu_master_clock++;
            this.clock.vdp_master_clock++;
            if (this.clock.cpu_master_clock > this.clock.cpu_divisor) {
                this.cpu_cycle();
                this.clock.cpu_master_clock -= this.clock.cpu_divisor;
            }
            if (this.clock.vdp_master_clock > this.clock.vdp_divisor) {
                this.vdp.cycle();
                this.clock.vdp_master_clock -= this.clock.vdp_divisor;
            }
            if (this.clock.frames_since_restart !== this.last_frame) {
                this.last_frame = this.clock.frames_since_restart;
                this.poll_pause();
            }
            if (dbg.do_break) return;
        }
    }

    catch_up() { }

    cpu_cycle() {
        if (this.cpu.pins.RD) {
            if (this.cpu.pins.MRQ) {// read ROM/RAM
                this.cpu.pins.D = this.bus.cpu_read(this.cpu.pins.Addr, this.cpu.pins.D);
                if (this.cpu.trace_on) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, this.cpu.trace_cycles, trace_format_read('Z80', Z80_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D, null, this.cpu.regs.TCU));
                }
            } else if (this.cpu.pins.IO) { // read IO port
                this.cpu.pins.D = this.bus.cpu_in(this.cpu.pins.Addr, this.cpu.pins.D);
            }
        }
        this.cpu.cycle();
        if (this.cpu.pins.WR) {
            if (this.cpu.pins.MRQ) { // write RAM
                if (this.cpu.trace_on && (this.cpu.last_trace_cycle !== this.cpu.trace_cycles)) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, this.cpu.trace_cycles, trace_format_write('Z80', Z80_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
                    this.cpu.last_trace_cycle = this.cpu.trace_cycles;
                }
                this.bus.cpu_write(this.cpu.pins.Addr, this.cpu.pins.D);
            } else if (this.cpu.pins.IO) // write IO
                this.bus.cpu_out(this.cpu.pins.Addr, this.cpu.pins.D);
        }
        this.clock.cpu_frame_cycle += this.clock.cpu_divisor;
    }

    get_description() {
        let nm = 'Master System v1';
        if (this.variant === SMSGG_variants.SMS2) nm = 'Master System v2';
        if (this.variant === SMSGG_variants.GG) nm = 'GameGear';
        let d = new machine_description(nm);
        d.technical.standard = 'NTSC';
        d.technical.fps = 60;
        d.input_types = [INPUT_TYPES.SMS_CONTROLLER];
        d.technical.x_resolution = 256;
        d.technical.y_resolution = 240; // Max
        return d;
    }

    step_scanlines(howmany) {
        for (let i = 0; i < howmany; i++) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }
    }

    update_status(current_frame, current_scanline, current_x) {
        current_frame.innerHTML = this.clock.frames_since_restart;
        current_scanline.innerHTML = this.clock.vpos;
        current_x.innerHTML = this.clock.hpos;
    }

    run_frame() {
        let current_frame = this.clock.frames_since_restart;
        let scanlines_done = 0;
        this.clock.cpu_frame_cycle = 0;
        while(current_frame === this.clock.frames_since_restart) {
            scanlines_done++;
            this.finish_scanline();
            if (dbg.do_break) return;
        }
    }

    finish_scanline() {
        let cycles_left = 684 - (this.clock.hpos * 2);
        this.step_master(cycles_left);
    }

    load_ROM_from_RAM(what) {
        this.bus.load_ROM_from_RAM(what);
        this.reset();
    }

    load_BIOS_from_RAM(what) {
        this.bus.mapper.load_BIOS_from_RAM(what);
    }

    present() {
        if (this.display_enabled)
            this.vdp.present();
    }
}