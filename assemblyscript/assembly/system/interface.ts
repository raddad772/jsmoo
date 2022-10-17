export enum MD_TIMING {
    frame = 0,
    line = 1,
    timestep = 2
}

export enum MD_STANDARD {
    NSTC = 0,
    PAL = 1
}

export enum SCREENVAR_FIELDS {
    current_frame = 0,
    current_scanline = 1,
    current_x = 2
}

export class machine_description {
    name: String = '';
    timing: MD_TIMING = MD_TIMING.frame
    standard: MD_STANDARD = MD_STANDARD.NSTC
    fps: u32 = 60
    x_resolution: u32 = 256
    y_resolution: u32 = 256
    out_ptr: usize = 0;
}

export interface systemEmulator {
    //serialize(): funcref,
    //deserialize()
    get_description(): machine_description;
    get_screenvars(): Uint32Array;
    finish_frame(): void;
    finish_scanline(): void;
    update_inputs(): void;
    step_master(cycles: u32): void;
    reset(): void;
    load_ROM(what: usize, sz: u32): void;
    load_BIOS(): void;
    killall(): void;
    present(ab: usize): void;
}

export interface systemEmulatorStandardClock {
    frames_since_restart: u64
    trace_cycles: u64
}
