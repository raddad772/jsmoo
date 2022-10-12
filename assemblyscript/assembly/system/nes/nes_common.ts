import {systemEmulatorStandardClock} from "../interface";

export enum NES_VARIANTS {
    NTSCU = 0,
    NTSCJ,
    PAL
}

export class NES_bus {
    PPU_read: funcref;
    PPU_write: funcref;

    CPU_read: funcref;
    CPU_write: funcref;

    PPU_reg_read: funcref;
    PPU_reg_write: funcref;
    CPU_reg_read: funcref;
    CPU_reg_write: funcref;

    CPU_notify_NMI: funcref;
    CPU_notify_IRQ: funcref;
}

class NES_timing {
    variant: NES_VARIANTS
    frame_lines: u32
    cpu_divisor: u32
    ppu_divisor: u32
    bottom_rendered_line: u32
    post_render_ppu_idle: u32
    vblank_start: u32
    vblank_end: u32
    ppu_pre_render: u32

    constructor(variant: NES_VARIANTS) {
        this.variant = variant;
        this.set_variant();
    }

    set_variant(): void {
        this.post_render_ppu_idle = 240;
        this.vblank_start = 241;
        this.vblank_end = 261;
        this.ppu_pre_render = 261;
        switch(this.variant) {
            case NES_VARIANTS.NTSCU:
            case NES_VARIANTS.NTSCJ:
                this.bottom_rendered_line = 239;
                this.frame_lines = 262;
                this.cpu_divisor = 12;
                this.ppu_divisor = 4;
                break;
            case NES_VARIANTS.PAL:
                this.bottom_rendered_line = 238;
                this.frame_lines = 312;
                this.cpu_divisor = 16;
                this.ppu_divisor = 5;
                break;
        }
    }
}

export class NES_clock implements systemEmulatorStandardClock {
    master_clock: u64     // Master clock cycles since restart
    master_frame: u64
    cpu_master_clock: u64 // CPU's clock
    ppu_master_clock: u64 // PPU's clock
    trace_cycles: u64
    frames_since_restart: u64

    cpu_frame_cycle: u32
    ppu_frame_cycle: u32
    timing: NES_timing
    variant: NES_VARIANTS
    ppu_y: u32
    frame_odd: u32

    constructor(variant: NES_VARIANTS) {
        this.variant = variant;
        this.timing = new NES_timing(variant);
        this.reset();
    }

    reset(): void {
        this.cpu_master_clock = 0;
        this.ppu_master_clock = 0;
        this.ppu_y = 0;
        this.master_clock = 0;
        this.master_frame = 0;
        this.trace_cycles = 0;
        this.frames_since_restart = 0;
        this.cpu_frame_cycle = 0;
        this.ppu_frame_cycle = 0;
        this.ppu_y = 0;
        this.frame_odd = 0;
    }
}
