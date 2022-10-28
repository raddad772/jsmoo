"use strict";

const GB_PPU_modes = Object.freeze({
    HBLANK: 0,
    VBLANK: 1,
    OAM_search: 2,
    pixel_transfer: 3
});

// 160x144

class GB_PPU {
/*
Each scanline is 456 dots (114 CPU cycles) long and consists of

mode 2 (OAM search). 80 dots long (2 for each OAM entry). finds up to 10 sprites
mode 3 (pixel transfer), 173.5+ dots long because of FIFO, plus extra
mode 0 (hblank) is the rest of the time
vblank is mode 1, 10 lines

so 456 CYCLES by 154 LINES


at BEGINNING FETCH of LINE, fetch x2
8-pixel (32-bit) pixel dual FIFO, one for BG, one for sprite


fetch tile # - 2 cycles
fetch bitplane 0 - 2 cycles
fetch bitplane 1 - 2 cycles
fetch sprite top/bottom IF APPLICABLE

it'll do tile-pp-bpp-sprite PER SPRITE?

FIFO stores BPP, priority (sprite), palette #

FIFO is shifting out pixels and must >0 before sprite can happen

when we hit window, bg FIFO is cleared and fetches start over

x fine scroll discards from the FIFO, delaying start

there are comparators for each sprite.
if a sprite x is the same as our current rendering position,
we mix the sprite into the sprite FIFO


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