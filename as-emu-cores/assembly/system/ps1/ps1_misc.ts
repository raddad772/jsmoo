export class PS1_bus {
    constructor() {
    }
}
export const PS1_CYCLES_PER_FRAME_NTSC = 564480

export class PS1_clock {
    master_frame: u64 = 0
    draw_x: u32 = 0
    draw_y: u32 = 0
    trace_cycles: u64 = 0

    cycles_left_this_frame: i64 = <i64>PS1_CYCLES_PER_FRAME_NTSC;
    cpu_frame_cycle: u32 = 0;
    cpu_master_clock: u64 = 0
    master_clock: u64 = 0

}

