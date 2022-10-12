"use strict";

/*
Master timing info for NES.
Contains all the timing info we need
 */

const NES_TIMINGS = Object.freeze({
	NTSC: 0,
	PAL: 1,
	DENDY: 2
});


const SER_NES_clock = [
    'master_clock', 'master_frame', 'frames_since_restart',
    'cpu_master_clock', 'sound_master_clock', 'ppu_master_clock',
    'trace_cycles', 'nmi', 'cpu_frame_cycle', 'ppu_frame_cycle',
    'timing', 'ppu_y', 'frame_odd'
]
class NES_clock {
    constructor() {
        // "Master" positions
        this.master_clock = 0;
        this.master_frame = 0;

        this.frames_since_restart = 0;

        this.cpu_master_clock = 0;
        this.sound_master_clock = 0;
        this.ppu_master_clock = 0;
        this.trace_cycles = 0;
        this.ppu = null;

        // Are we in nmi-time?
        this.nmi = 0;
        this.cpu_frame_cycle = 0;
        this.ppu_frame_cycle = 0;
        this.timing = { // NTSC defaults
            //clocks_per_line: 1364, // All scanlines except one get this on NTSC
            //frame_lines: 262, // 312 for PAL
            fps: 60,
            apu_counter_rate: 60,
            cpu_divisor: 12,
            ppu_divisor: 4,
            bottom_rendered_line: 239,
            post_render_ppu_idle: 240,
            hblank_start: 280,
            vblank_start: 241,
            vblank_end: 261,
            ppu_pre_render: 261,
            pixels_per_scanline: 280 // 277 for PAL
        };

        // PPU timing info
        this.ppu_y = 0;
        this.frame_odd = 0; // 0 for odd, 1 for even
    }

    serialize() {
        let o = {
            version: 1
        }
        serialization_helper(o, this, SER_NES_clock);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD NES CLOCK VERSION!');
            return false;
        }
        return deserialization_helper(this, from, SER_NES_clock);
    }

    reset() {
        this.nmi = 0;
        this.master_clock = 0;
        this.master_frame = 0;
        this.cpu_master_clock = 0;
        this.ppu_master_clock = 0;
        this.sound_master_clock = 0;
        this.vblank = 0;
        this.ppu_y = 0;
        this.frame_odd = 0;
        this.frames_since_restart = 0;
    }

    ppu_x(clock) {
        return Math.floor((clock / this.timing.clocks_per_line) / this.timing.ppu_divisor);
    }

    // This must be done before actually doing anything else really
    change_timing(to) {
        switch(to) {
            case NES_TIMINGS.NTSC:
                this.timing.bottom_rendered_line = 239;
                this.timing.fps = 60;
                this.timing.apu_counter_rate = 60;
                this.timing.cpu_divisor = 12;
                this.timing.ppu_divisor = 4;

                break;
            case NES_TIMINGS.PAL:
                this.timing.bottom_rendered_line = 238;
                this.timing.frame_lines = 312;
                this.timing.apu_counter_rate = 50;
                this.timing.fps = 50;
                this.timing.cpu_divisor = 16;
                this.timing.ppu_divisor = 5;
                break;
            case NES_TIMINGS.DENDY:
                this.timing.apu_counter_rate = 59;
                this.timing.bottom_rendered_line = 238;
                this.timing.fps = 50;
                this.timing.cpu_divisor = 15;
                this.timing.ppu_divisor = 5;
                break;
        }
    }

    advance_frame() {
        this.ppu_y = 0;
        this.frames_since_restart++;
        this.frame_odd = +(!this.frame_odd);
        this.master_frame++;
        this.cpu_frame_cycle = 0;
    }

    advance_scanline() {
        this.ppu_y++;
    }
}