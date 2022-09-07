"use strict";

class ZXSpectrum_clock {
    // 70908 CPU cycles per frame
    // 50 frames
    // 3545400 Hz

    // 2 pixels per CPU clock
    // 448 pixel clocks per scanline

    /*
    each scanline is 448 pixels wide.
    96 pixels of nothing
    48 pixels of border
    256 pixels of draw (read pattern bg, attrib, bg+1, attrib, none, none, none, none)
    48 pixels of border

    each frame is

    312 scanlines long

    8 scanlines of vblank
    56 upper border
    192 drawing scanlines
    56 lower border

    vblank happens at scanline 0-7
    IRQ happens at scanline 0 t-state #16//PPU pixel #32
    contention happens scanlines 64-256, pixel #144-400
    contention pauses CPU for 6 out of 8 cycles if address bus is 0x4000-0x7FFF

    */

    constructor() {
        this.master_clock_speed = 6988800; // ~7Mhz. We do 50FPS instead of the 50.04FPS or whatever of a real one
        this.cpu_divider = 2; // ~3.5MHz
        this.ula_divider = 1; // ~7MHz

        this.master_frame_count = 0;

        this.frame_master_clock = 0;

        this.master_clocks_per_line = 448;

        this.ula_x = 0;
        this.ula_y = 0;
        this.ula_frame_cycle = 0;

        this.frame_bottom_rendered_line = 192;
        this.irq_ula_cycle = 113144
        this.irq_cpu_cycle = 56572

        this.flash = {
            bit: 0,
            count: 16,
        };

        this.contended = false;
    }
}

class ZXSpectrum_bus {
    constructor(clock, memsize) {
        this.clock = clock;

        this.cpu_read = function(addr, val, has_effect=false) {debugger;};
        this.cpu_write = function(addr, val) { debugger; }

        this.ula_read = function(addr, val) { debugger; return 0xCC; };

        this.cpu_ula_read = function(addr, val, has_effect) {debugger;};
        this.cpu_ula_write = function(addr, val) {debugger;}

        this.notify_IRQ = function(level) { debugger; }
    }
}

class ZXSpectrum {
    constructor() {
        this.clock = new ZXSpectrum_clock();

        this.cpu = new z80_t();
        this.cpu.reset();

        this.bus = new ZXSpectrum_bus(this.clock, 48);

        this.ula = new ZXSpectrum_ULA(this.clock, this.bus);
    }

    killall() {

    }

    reset() {
        this.cpu.reset();
    }

    get_description() {
        let d = new machine_description('ZX Spectrum');
        d.technical.standard = 'PAL';
        d.technical.fps = 50;
        d.input_types = [INPUT_TYPES.KEYBOARD];
        d.technical.x_resolution = 352;
        d.technical.y_resolution = 304;
        return d;
    }

    run_frame() {

    }

    present() {

    }
}