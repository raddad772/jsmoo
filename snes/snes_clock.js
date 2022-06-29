"use strict";

class SNES_clock {
    constructor() {
        this.master_cycles_since_reset = 0;

        this.cpu_step = 4;  // Every 4 cycles, CPU can do one thing like DMA
        this.apu_step = 20; // Every 20 cycles, 1 APU cycle
        this.ppu_step = 4; // Every 4 cycles, 1 PPU dot

        this.cpu_has = 0;
        this.apu_has = 0;
        this.ppu_has = 0;
    }
}