"use strict";

const GB_PPU_modes = Object.freeze({
    HBLANK: 0,
    VBLANK: 1,
    OAM_search: 2,
    rendering: 3
});

// 160x144

class GB_PPU {
/*
Each scanline is 456 dots (114 CPU cycles) long and consists of

mode 2 (OAM search). 80 dits long (2 for each OAM entry)
mode 3 (active picture), 168 + ABOUT 10 per sprite on the line
and mode 0 (horizontal blanking) whatever is left over

After 144 scanlines are drawn are 10 lines of mode 1 (vertical blanking), for a total of 154 lines or 70224 dots per screen.

The CPU can't see VRAM (writes are ignored and reads are $FF) during mode 3, but it can during other modes.
The CPU can't see OAM during modes 2 and 3, but it can during blanking modes (0 and 1).

To make the estimate for mode 3 more precise, see "Nitty Gritty Gameboy Cycle Timing" by Kevin Horton.
 */
    /**
     * @param {Number} variant
     * @param {GB_clock} clock
     * @param {GB_bus} bus
     */
    constructor(variant, clock, bus) {
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;

        this.clock.ppu_mode = 0;
        this.line_cycle = 0;
    }
}