"use strict";

const SMSGG_variants = {
    SMS1: 0,
    SMS2: 1,
    GG: 3
}

let SMS_inputmap = [];
let GG_inputmap = [];
function fill_GG_inputmap() {
    for (let i = 0; i < 7; i++) {
        let kp = new md_input_map_keypoint();
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = 1;
        switch(i) {
            case 0:
                kp.name = 'up';
                break;
            case 1:
                kp.name = 'down';
                break;
            case 2:
                kp.name = 'left';
                break;
            case 3:
                kp.name = 'right';
                break;
            case 4:
                kp.name = 'b1';
                break;
            case 5:
                kp.name = 'b2';
                break;
            case 6:
                kp.name = 'start';
                break;
        }
        GG_inputmap[i] = kp;
    }
}

function fill_SMS_inputmap() {
    for (let i = 0; i < 12; i++) {
        let kp = new md_input_map_keypoint();
        let uber = (i < 6) ? 'p1' : 'p2';
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = uber;
        switch(i) {
            case 0:
            case 6:
                kp.name = 'up';
                break;
            case 1:
            case 7:
                kp.name = 'down';
                break;
            case 2:
            case 8:
                kp.name = 'left';
                break;
            case 3:
            case 9:
                kp.name = 'right';
                break;
            case 4:
            case 10:
                kp.name = 'a';
                break;
            case 5:
            case 11:
                kp.name = 'b';
                break;
        }
        SMS_inputmap[i] = kp;
    }
    let kp = new md_input_map_keypoint();
    kp.internal_code = 12;
    kp.uber = 0;
    kp.buf_pos = 12;
    kp.name = 'start';
    SMS_inputmap[12] = kp;
}

fill_GG_inputmap();
fill_SMS_inputmap();


const SER_SMSGG_clock = [
    'variant', 'region', 'cpu_master_clock', 'vdp_master_clock',
    'frames_since_restart', 'cpu_divisor', 'vdp_divisor',
    'cpu_frame_cycle', 'ccounter', 'hpos', 'vpos',
    'line_counter', 'timing', 'bios'
];
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

    serialize() {
        let o = {version: 1}
        serialization_helper(o, this, SER_SMSGG_clock);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD SMSGG CLOCK VERSION');
            return false;
        }
        return deserialization_helper(this, from, SER_SMSGG_clock);
    }
}

const SER_SMSGG = [
    'variant', 'region', 'clock', 'bus', 'cpu',
    'last_frame', 'vdp'
];
class SMSGG {
    /**
     * @param {bios_t} bios
     * @param {number} variant
     * @param {number} region
     */
    constructor(bios, variant, region) {
        this.bios = bios;
        this.variant = variant;
        this.region = region
        this.clock = new SMSGG_clock(variant, region);
            this.controller1_in = new smspad_inputs();
        this.bus = new SMSGG_bus(variant, region, this.controller1_in);
        this.cpu = new z80_t(false);
        this.cpu.reset();

        this.display_enabled = true;

        this.last_frame = 0;

        this.bus.system = this;
        this.bus.notify_IRQ = this.cpu.notify_IRQ.bind(this.cpu);
        this.bus.notify_NMI = this.cpu.notify_NMI.bind(this.cpu);

        this.vdp = new SMSGG_VDP(this.variant, this.clock, this.bus);
        this.vdp.reset();

        this.bus.vdp = this.vdp;

        this.bus.mapper.cpu = this.cpu;

        dbg.add_cpu(D_RESOURCE_TYPES.Z80, this);
        if (variant !== SMSGG_variants.GG) {
            this.controller1_in = new smspad_inputs();
            this.controller2_in = new smspad_inputs();
        }
        // TODO: reenable this
        if (variant !== SMSGG_variants.GG)
            this.load_bios();
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_SMSGG);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD SMSGG VER');
            return false;
        }
        return deserialization_helper(this, from, SER_SMSGG);
    }

    killall() {
        dbg.remove_cpu(D_RESOURCE_TYPES.Z80, this);
        /*if (this.variant === SMSGG_variants.GG) {
            input_config.disconnect_controller('gg');
        }
        else {
            input_config.disconnect_controller('sms1');
        }*/
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
        if (this.variant !== SMSGG_variants.GG) {
            if (this.controller1_in.start)
                this.bus.notify_NMI(1);
            else
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
        let d = new machine_description();
        d.name = nm;
        d.standard = MD_STANDARD.NTSC;
        d.fps = 60;
        d.input_types = [INPUT_TYPES.SMS_CONTROLLER];

        if (this.variant === SMSGG_variants.GG) {
            d.x_resolution = 160;
            d.y_resolution = 144;
            d.xrh = 4;
            d.xrw = 3;
            for (let i = 0; i < GG_inputmap.length; i++) {
                d.keymap.push(GG_inputmap[i]);
            }
        } else {
            d.x_resolution = 256;
            d.y_resolution = 240; // Max
            d.xrh = 8;
            d.xrw = 7;
            for (let i = 0; i < SMS_inputmap.length; i++) {
                d.keymap.push(SMS_inputmap[i]);
            }
        }

        d.output_buffer[0] = this.vdp.output_shared_buffers[0];
        d.output_buffer[1] = this.vdp.output_shared_buffers[1];


        d.overscan_top = d.overscan_left = d.overscan_right = d.overscan_bottom = 0;
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
        return {buffer_num: this.vdp.last_used_buffer, bottom_rendered_line: this.clock.timing.bottom_rendered_line+1};
    }

    finish_scanline() {
        let cycles_left = 684 - (this.clock.hpos * 2);
        this.step_master(cycles_left);
    }

    load_ROM_from_RAM(what) {
        this.bus.load_ROM_from_RAM(what);
        this.reset();
    }

    load_bios() {
        if (!this.bios.loaded) {
            alert('Please upload or select a Master System BIOS under Tools/Bios');
            return;
        }
        this.bus.mapper.load_BIOS_from_RAM(this.bios.BIOS);
    }

    present() {
        if (this.display_enabled)
            this.vdp.present();
    }

    map_inputs(buffer) {
        if (this.variant === SMSGG_variants.GG) {
            this.controller1_in.up = buffer[0];
            this.controller1_in.down = buffer[1];
            this.controller1_in.left = buffer[2];
            this.controller1_in.right = buffer[3];
            this.controller1_in.b1 = buffer[4];
            this.controller1_in.b2 = buffer[5];
            this.controller1_in.start = buffer[6];
        } else {
            this.controller1_in.up = buffer[0];
            this.controller1_in.down = buffer[1];
            this.controller1_in.left = buffer[2];
            this.controller1_in.right = buffer[3];
            this.controller1_in.b1 = buffer[4];
            this.controller1_in.b2 = buffer[5];
            this.controller2_in.up = buffer[6];
            this.controller2_in.down = buffer[7];
            this.controller2_in.left = buffer[8];
            this.controller2_in.right = buffer[9];
            this.controller2_in.b1 = buffer[10];
            this.controller2_in.b2 = buffer[11];
            this.controller1_in.start = buffer[12];
        }
        this.bus.update_inputs(this.controller1_in, this.controller2_in);
    }
}