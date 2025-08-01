import {console_mt_struct, input_map_keypoint, machine_description, MD_STANDARD, systemEmulator} from "../interface";
import {smspad_inputs} from "../../component/controller/sms_joypad";
import {SMSGG_bus} from "./sms_gg_io";
import {z80_t} from "../../component/cpu/z80/z80";
import {SMSGG_VDP} from "./sms_gg_vdp";
import {SN76489} from "../../component/audio/sn76489/sn76489";
import {D_RESOURCE_TYPES, dbg} from "../../helpers/debug";
import {framevars_t} from "../../glue/global_player";
import {bigstr_output} from "../../component/cpu/r3000/r3000";
import {hex4} from "../../helpers/helpers";

export enum SMSGG_variants {
    SMS1,
    SMS2,
    GG
}

export enum REGION {
    NTSC,
    NTSCJ,
    PAL
}


let SMS_inputmap: Array<input_map_keypoint> = new Array<input_map_keypoint>(12)
let GG_inputmap: Array<input_map_keypoint> = new Array<input_map_keypoint>(7);

function fill_GG_inputmap(): void {
    for (let i = 0; i < 7; i++) {
        let kp = new input_map_keypoint();
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = '';
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

function fill_SMS_inputmap(): void {
    for (let i = 0; i < 12; i++) {
        let kp = new input_map_keypoint();
        let uber: string = (i < 6) ? 'p1' : 'p2';
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
                kp.name = 'b1';
                break;
            case 5:
            case 11:
                kp.name = 'b2';
                break;
        }
        SMS_inputmap[i] = kp;
    }
    let kp = new input_map_keypoint();
    kp.internal_code = 12;
    kp.uber = 'console';
    kp.buf_pos = 12;
    kp.name = 'start';
    SMS_inputmap[12] = kp;
}

fill_GG_inputmap();
fill_SMS_inputmap();

class SMSGG_clock_timing {
    fps: u32 = 60
    frame_lines: u32 = 262 // PAL 313
    cc_line: u32 = 260 // PAL 311
    bottom_rendered_line: u32 = 191
    rendered_lines: u32 = 192
    region: REGION = REGION.NTSC
    vblank_start: u32 = 192 // not sure?
}

export class SMSGG_clock {
    variant: SMSGG_variants
    region: REGION

    master_clock_speed: u32 = 10752480
    master_cycles: i64 = 0

    cpu_master_clock: i64 = 0;
    vdp_master_clock: i64 = 0;
    apu_master_clock: i64 = 0;

    frames_since_restart: u64 = 0;

    cpu_divisor: i64 = 3;   // CPU ticks every 3 master
    vdp_divisor: i64 = 2;   // VDP ticks every 2 master
    apu_divisor: i64 = 48;  // APU ticks every 48 master!

    trace_cycles: u64 = 0;

    cpu_frame_cycle: u32 = 0;
    vdp_frame_cycle: u32 = 0;

    ccounter: u32 = 0;
    hpos: i32 = 0;
    vpos: i32 = 0;
    line_counter: i32 = 0;

    timing: SMSGG_clock_timing = new SMSGG_clock_timing();

    constructor(variant: SMSGG_variants, region: REGION) {
        this.variant = variant;
        this.region = region;

    }
}

export class SMSGG implements systemEmulator {
    variant: SMSGG_variants
    region: REGION
    clock: SMSGG_clock
    controller1_in: smspad_inputs = new smspad_inputs()
    controller2_in: smspad_inputs = new smspad_inputs()
    last_frame: u32 = 0;
    bus: SMSGG_bus
    cpu: z80_t
    vdp: SMSGG_VDP

    sn76489: SN76489

    display_enabled: boolean = true;
    framevars: framevars_t = new framevars_t();

    outbuf: usize = 0

    constructor(variant: SMSGG_variants, region: REGION, out_buffer: usize) {
        //this.bios = bios;
        this.variant = variant;
        this.region = region
        let clock = new SMSGG_clock(variant, region);
        this.outbuf = out_buffer

        let controller1_in = new smspad_inputs();

        let bus = new SMSGG_bus(variant, region, controller1_in);
        let cpu = new z80_t(false);
        cpu.reset();

        let vdp = new SMSGG_VDP(variant, clock, bus, out_buffer);
        vdp.reset();
        bus.vdp = vdp;

        let sn76489 = new SN76489();
        sn76489.reset()

        this.controller1_in = controller1_in;
        this.sn76489 = sn76489;
        this.cpu = cpu;
        this.clock = clock
        this.bus = bus
        this.vdp = vdp;
        this.bus.sn76489 = sn76489;

        this.vdp.parent = this;
        this.bus.system = this;


        dbg.add_cpu(D_RESOURCE_TYPES.Z80, changetype<usize>(this));

        // TODO: reenable this
        //if (variant !== SMSGG_variants.GG)
            //this.load_bios();
    }

    play(): void {}
    pause(): void {}
    stop(): void {}

    get_mt_struct(): console_mt_struct {
        return new console_mt_struct();
    }

    dump_debug(): bigstr_output {
        return new bigstr_output();
    }

    killall(): void {
        dbg.remove_cpu(D_RESOURCE_TYPES.Z80);
        /*if (this.variant === SMSGG_variants.GG) {
            input_config.disconnect_controller('gg');
        }
        else {
            input_config.disconnect_controller('sms1');
        }*/
    }

    reset(): void {
        this.cpu.reset();
        this.vdp.reset();
        this.bus.reset();
        this.sn76489.reset();
        this.last_frame = 0;
    }

    /*trace_peek(addr) {
        return this.bus.cpu_read(addr, 0, false);
    }

    enable_tracing() {
        this.cpu.enable_tracing(this.trace_peek.bind(this));
    }

    disable_tracing() {
        this.cpu.disable_tracing();
    }*/

    poll_pause(): void {
        if (this.variant !== SMSGG_variants.GG) {
            if (this.controller1_in.start)
                this.cpu.notify_NMI(1);
            else
                this.cpu.notify_NMI(0);
        }
    }

    step_master(cycles: u32): u32 {
        for (let i: u32 = 0; i < cycles; i++) {
            if (this.clock.frames_since_restart !== this.last_frame) {
                this.last_frame = <u32>this.clock.frames_since_restart;
                this.poll_pause();
            }
            this.clock.cpu_master_clock++;
            this.clock.vdp_master_clock++;
            this.clock.apu_master_clock++;
            if (this.clock.cpu_master_clock > this.clock.cpu_divisor) {
                this.cpu_cycle();
                this.clock.cpu_master_clock -= this.clock.cpu_divisor;
            }
            if (this.clock.vdp_master_clock > this.clock.vdp_divisor) {
                this.vdp.cycle();
                this.clock.vdp_master_clock -= this.clock.vdp_divisor;
            }
            if (this.clock.apu_master_clock > this.clock.apu_divisor) {
                this.sn76489.cycle(this.clock.master_cycles);
                this.clock.apu_master_clock -= this.clock.apu_divisor;
            }
            if (this.clock.frames_since_restart !== this.last_frame) {
                this.last_frame = <u32>this.clock.frames_since_restart;
                this.poll_pause();
            }
            if (dbg.do_break) return 0;
            this.clock.master_cycles++;
        }
        return 0;
    }

    cpu_cycle(): void {
        if (this.cpu.pins.RD) {
            if (this.cpu.pins.MRQ) {// read ROM/RAM
                this.cpu.pins.D = this.bus.mapper.read(this.cpu.pins.Addr, this.cpu.pins.D);
                /*if (this.cpu.trace_on) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, this.cpu.trace_cycles, trace_format_read('Z80', Z80_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D, null, this.cpu.regs.TCU));
                }*/
            } else if (this.cpu.pins.IO) // read IO port
                this.cpu.pins.D = this.bus.cpu_in(this.bus, this.cpu.pins.Addr, this.cpu.pins.D);
        }
        this.cpu.cycle();
        if (this.cpu.pins.WR) {
            if (this.cpu.pins.MRQ) { // write RAM
                /*if (this.cpu.trace_on && (this.cpu.last_trace_cycle !== this.cpu.trace_cycles)) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, this.cpu.trace_cycles, trace_format_write('Z80', Z80_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
                    this.cpu.last_trace_cycle = this.cpu.trace_cycles;
                }*/
                this.bus.mapper.write(this.cpu.pins.Addr, this.cpu.pins.D);
            } else if (this.cpu.pins.IO) // write IO
                this.bus.cpu_out(this.bus, this.cpu.pins.Addr, this.cpu.pins.D);
        }
        this.clock.cpu_frame_cycle += <u32>this.clock.cpu_divisor;
    }

    get_description(): machine_description {
        //         this.cycles_per_frame = 179208
        let d = new machine_description();
        this.sn76489.output.set_audio_params(179208, 48000, 800, 5);
        if (this.variant === SMSGG_variants.SMS2) d.name = 'Master System v2';
        if (this.variant === SMSGG_variants.GG) d.name = 'GameGear';
        d.standard = MD_STANDARD.NTSC;
        d.fps = 60;

        if (this.variant === SMSGG_variants.GG) {
            d.x_resolution = 160;
            d.y_resolution = 144;
            d.xrw = 3;
            d.xrh = 4;
            for (let i = 0; i < GG_inputmap.length; i++) {
                d.keymap.push(GG_inputmap[i]);
            }
        } else {
            d.x_resolution = 256;
            d.y_resolution = 240; // Max
            d.xrw = 4;
            d.xrh = 3;
            for (let i = 0; i < SMS_inputmap.length; i++) {
                d.keymap.push(SMS_inputmap[i]);
            }
        }

        d.out_size = (256*240*2*2);

        d.overscan.top = d.overscan.left = d.overscan.right = d.overscan.bottom = 0;
        return d;
    }

    step_scanlines(howmany: u32): void {
        for (let i = 0; i < howmany; i++) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }
    }

    get_framevars(): framevars_t {
        let d = this.framevars;
        d.master_frame = this.clock.frames_since_restart;
        d.x = this.clock.hpos;
        d.scanline = this.clock.vpos;
        return d;
    }

    finish_frame(): u32 {
        let current_frame = this.clock.frames_since_restart;
        let scanlines_done = 0;
        this.clock.cpu_frame_cycle = 0;
        while(current_frame === this.clock.frames_since_restart) {
            scanlines_done++;
            this.finish_scanline();
            if (dbg.do_break) break;
        }
        // return {buffer_num: this.vdp.last_used_buffer, bottom_rendered_line: this.clock.timing.bottom_rendered_line+1, sound_buffer: this.sn76489.output.get_buffer()};
        return 0;
    }

    finish_scanline(): u32 {
        let cycles_left: i64 = 684 - (this.clock.hpos * 2);
        this.step_master(<u32>cycles_left);
        return 0;
    }

    load_ROM(name: string, buf: usize, size: u32): void {
        this.bus.load_ROM_from_RAM(name, buf, size);
        this.reset();
    }

    load_BIOS(what: usize, sz: u32): void {
        this.bus.mapper.load_BIOS_from_RAM(what, sz);
    }

    map_inputs(bufptr: usize): void {
        if (this.variant === SMSGG_variants.GG) {
            this.controller1_in.up = load<u32>(bufptr);
            this.controller1_in.down = load<u32>(bufptr+(1*4));
            this.controller1_in.left = load<u32>(bufptr+(2*4))
            this.controller1_in.right = load<u32>(bufptr+(3*4))
            this.controller1_in.b1 = load<u32>(bufptr+(4*4))
            this.controller1_in.b2 = load<u32>(bufptr+(5*4))
            this.controller1_in.start = load<u32>(bufptr+(6*4))
        } else {
            this.controller1_in.up =load<u32>(bufptr)
            this.controller1_in.down = load<u32>(bufptr+(1*4));
            this.controller1_in.left = load<u32>(bufptr+(2*4));
            this.controller1_in.right = load<u32>(bufptr+(3*4))
            this.controller1_in.b1 = load<u32>(bufptr+(4*4))
            this.controller1_in.b2 = load<u32>(bufptr+(5*4))
            this.controller2_in.up = load<u32>(bufptr+(6*4))
            this.controller2_in.down = load<u32>(bufptr+(7*4))
            this.controller2_in.left = load<u32>(bufptr+(8*4))
            this.controller2_in.right = load<u32>(bufptr+(9*4))
            this.controller2_in.b1 = load<u32>(bufptr+(10*4))
            this.controller2_in.b2 = load<u32>(bufptr+(11*4))
            this.controller1_in.start = load<u32>(bufptr+(12*4))
        }
        this.bus.update_inputs(this.controller1_in, this.controller2_in);
    }
}
