"use strict";

const MEGADRIVE_VARIANTS = Object.freeze({
    NTSCU: 0,
    PAL: 1,
    NTSCJ: 2
});

class MegaDrive_bus {
    /* Not going to support a mapper for now so here is where all the magic will be
        $000000...$3FFFFF ROM, mirrored?
        $A00000...$A0FFFF Z80 RAM, 8k
        $A10000...$A3FFFF registers
        $C00000...$CFFFFF VDP registers
        $FF0000...$FFFFFF 68000 RAM, 64k

        68000 accesses memory in 16-bit mode
        Z80 in 8-bit

        +64K VDP RAM 16-bit
     */
}

class MegaDrive_clock {
    constructor() {
        this.master_clock = 0;
        this.master_frame = 0;

        this.frames_since_restart = 0;

        this.m68000_master_clock = 0;
        this.z80_master_clock = 0;
        this.vdp_master_clock = 0;

        this.hpos = 0;
        this.vpos = 0;
    }
}

class MegaDrive_cart {
    constructor () {

    }
}

class MegaDrive {
    constructor() {

    }
}