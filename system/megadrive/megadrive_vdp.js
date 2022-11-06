"use strict";

class MegaDrive_VDP {
    /**
     * @param {MegaDrive_clock} clock
     * @param {MegaDrive_bus} bus
     */
    constructor(clock, bus) {
        this.clock = clock;
        this.bus = bus;

        this.VRAM = new Uint16Array(32768); //64k of 16-bit RAM
    }
}