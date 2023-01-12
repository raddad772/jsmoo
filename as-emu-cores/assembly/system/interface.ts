import {framevars_t} from "../glue/global_player";

export enum MD_TIMING {
    frame = 0,
    line = 1,
    timestep = 2
}

export enum MD_STANDARD {
    NTSC = 0,
    PAL = 1,
    LCD
}

export enum SCREENVAR_FIELDS {
    current_frame = 0,
    current_scanline = 1,
    current_x = 2
}

export class input_map_keypoint {
    uber: String = ''       // Like player 1, player 2, keyboard, etc.
    name: String = ''       // Name like up down a b
    buf_pos: u32 = 0        // Position in buffer
    internal_code: u32 = 0  // Internal usage
}

export class overscan_info {
    top: u32 = 0
    bottom: u32 = 0
    left: u32 = 0
    right: u32 = 0
}

export class machine_description {
    name: String = '';
    timing: MD_TIMING = MD_TIMING.frame
    fps: u32 = 60
    standard: MD_STANDARD = MD_STANDARD.NTSC
    x_resolution: u32 = 256
    y_resolution: u32 = 256
    xrw: u32 = 4;
    xrh: u32 = 3;

    overscan: overscan_info = new overscan_info()

    out_ptr: usize = 0;
    out_size: u32 = 0;

    keymap: Array<input_map_keypoint> = new Array<input_map_keypoint>();
}

export class console_mt_struct {
    vram_ptr: usize = 0
    gp0_ptr: usize = 0
    gp1_ptr: usize = 0
    mmio_ptr: usize = 0
}

export interface systemEmulator {
    //serialize(): funcref,
    //deserialize()
    get_description(): machine_description;
    finish_frame(): u32;
    finish_scanline(): u32;
    step_master(cycles: u32): u32;
    reset(): void;
    load_ROM(name: string, what: usize, sz: u32): void;
    load_BIOS(what: usize, sz: u32): void;
    killall(): void;
    map_inputs(bufptr: usize): void;
    get_framevars(): framevars_t;

    play(): void;
    pause(): void;
    stop(): void;
    dump_debug(): string;

    get_mt_struct(): console_mt_struct;
}

export interface systemEmulatorStandardClock {
    frames_since_restart: u64
    trace_cycles: u64
}
