import {systemEmulatorStandardClock} from "../interface";
import {NES_ppu} from "./nes_ppu"
import {NES_a12_watcher_t, NES_mapper} from "./mappers/interface";
import {NES_cart} from "./nes_cart";
import {ricoh2A03} from "./cpu/r2a03";

export enum NES_TIMINGS {
    NTSC = 0,
    PAL,
    DENDY
}

export enum NES_VARIANTS {
    NTSCU = 0,
    NTSCJ,
    PAL,
    DENDY
}

export class NES_bus {
    @inline PPU_read_effect(addr: u32): u32 {
        return this.mapper.PPU_read_effect(addr);
    }

    @inline PPU_read_noeffect(addr: u32): u32 {
        return this.mapper.PPU_read_noeffect(addr);
    }

    PPU_write(addr: u32, val: u32): void {
        this.mapper.PPU_write(addr, val);
    }

    CPU_read(addr: u32, val: u32, has_effect: u32 = 1): u32 {
        return this.mapper.CPU_read(addr, val, has_effect);
    }

    CPU_write(addr: u32, val: u32): void {
        this.mapper.CPU_write(addr, val);
    }

    PPU_reg_read(addr: u32, val: u32, has_effect: u32): u32 {
        return this.ppu.reg_read(addr, val);
    }

    PPU_reg_write(addr: u32, val: u32): void {
        this.ppu.reg_write(addr, val);
    }

    CPU_reg_read(addr: u32, val: u32, has_effect: u32 = 1): u32 {
        return this.cpu.reg_read(addr, val, has_effect);
    }

    CPU_reg_write(addr: u32, val: u32): void {
        this.cpu.reg_write(addr, val);
    }

    CPU_notify_NMI(level: u32): void {
        this.cpu.notify_NMI(level);
    }

    CPU_notify_IRQ(level: u32): void {
        this.cpu.notify_IRQ(level);
    }


    mapper!: NES_mapper
    ppu!: NES_ppu
    cpu!: ricoh2A03

    constructor() {
    }
}

class NES_timing {
    variant: NES_VARIANTS
    frame_lines: u32 = 262  // NTSC defaults values
    cpu_divisor: u32 = 12
    ppu_divisor: u32 = 4
    bottom_rendered_line: u32 = 239
    post_render_ppu_idle: u32 = 240
    vblank_start: u32 = 241
    vblank_end: u32 = 261
    ppu_pre_render: u32 = 261

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
    master_clock: u64 = 0     // Master clock cycles since restart
    master_frame: u64 = 0
    cpu_master_clock: u64 = 0 // CPU's clock
    ppu_master_clock: u64 = 0 // PPU's clock
    trace_cycles: u64 = 0
    frames_since_restart: u64 = 0

    cpu_frame_cycle: u32 = 0
    ppu_frame_cycle: u32 = 0
    timing: NES_timing
    variant: NES_VARIANTS
    ppu_y: u32 = 0
    frame_odd: u32 = 0
    vblank: u32 = 0

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
