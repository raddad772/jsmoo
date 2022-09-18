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

        this.frames_since_restart = 0;

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
        this.ROM = new Uint8Array(16*1024);
        this.RAM = new Uint8Array(48*1024);
        this.clock = clock;

        this.cpu_ula_read = function(addr, val, has_effect) { return 0xCC; };
        this.cpu_ula_write = function(addr, val) {debugger;}

        this.notify_IRQ = function(level) { debugger; }
    }

    ula_read(addr, val) {
        return this.RAM[addr - 0x4000];
    }

    cpu_read(addr, val, has_effect=false) {
        if (addr < 0x4000) return this.ROM[addr];
        return this.RAM[addr - 0x4000];
    };

    cpu_write(addr, val) {
        if (addr < 0x4000) return;
        this.RAM[addr - 0x4000] = val;
    }

    load_ROM_from_RAM(what) {
        this.ROM = new Uint8Array(what);
        console.log('LOADED', this.ROM.length, 'bytes');
    }
}

class ZXSpectrum {
    constructor() {
        this.clock = new ZXSpectrum_clock();

        this.cpu = new z80_t();
        this.cpu.reset();

        this.bus = new ZXSpectrum_bus(this.clock, 48);

        this.bus.notify_IRQ = this.cpu.notify_IRQ.bind(this.cpu);
        this.ula = new ZXSpectrum_ULA(document.getElementById('snescanvas'), this.clock, this.bus);

    }

    killall() {
        dbg.remove_cpu(D_RESOURCE_TYPES.Z80, this);
    }

    reset() {
        this.cpu.reset();
        this.ula.reset();
    }

    trace_peek(addr) {
        return this.bus.cpu_read(addr, 0, false);
    }

    enable_tracing() {
        console.log('ENABLING TRACE');
        this.cpu.enable_tracing(this.trace_peek.bind(this));
    }

    disable_tracing() {
        this.cpu.disable_tracing();
    }

    step_master(howmany) {
        let todo = (howmany >>> 1);
        if (todo === 0) todo = 1;
        for (let i = 0; i < todo; i++) {
            this.cpu_cycle();
            this.ula.cycle();
            this.ula.cycle();
            if (dbg.do_break) return;
        }
    }

    catch_up() {}

    trace_format_nonio(what) {
        if (!dbg.watch_on) return;
        let ostr = trace_start_format('Z80', Z80_COLOR, this.cpu.trace_cycles, 'b', this.cpu.pins.Addr, null, this.cpu.regs.TCU);
        ostr += 'BLANK     TCU:' + this.cpu.regs.TCU + ' IR:' + hex2(this.cpu.regs.IR);
        dbg.traces.add(D_RESOURCE_TYPES.Z80, this.cpu.trace_cycles, ostr);
    }

    cpu_cycle() {
        if (this.clock.contended && ((this.cpu.pins.Addr - 0x4000) < 0x4000)) return;
        if (this.cpu.pins.RD) {
            if (this.cpu.pins.MRQ) {// read ROM/RAM
                this.cpu.pins.D = this.bus.cpu_read(this.cpu.pins.Addr);
                if (this.cpu.trace_on) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, this.cpu.trace_cycles, trace_format_read('Z80', Z80_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D, null, this.cpu.regs.TCU));
                }
            }
            else if (this.cpu.pins.IO) { // read IO port
                this.cpu.pins.D = this.bus.cpu_ula_read(this.cpu.pins.Addr)
            }
            else {
                if (this.cpu.trace_on && (this.cpu.last_trace_cycle !== this.cpu.trace_cycles)) {
                    this.trace_format_nonio();
                    this.cpu.last_trace_cycle = this.cpu.trace_cycles;
                }
            }
        } else if (!this.cpu.pins.WR) {
            if (this.cpu.trace_on && (this.cpu.last_trace_cycle !== this.cpu.trace_cycles)) {
                this.trace_format_nonio();
                this.cpu.last_trace_cycle = this.cpu.trace_cycles;
            }
        }
        this.cpu.cycle();
        if (this.cpu.pins.WR) {
            if (this.cpu.pins.MRQ) {// write ROM/RAM
                if (this.cpu.trace_on && (this.cpu.last_trace_cycle !== this.cpu.trace_cycles)) {
                    if (typeof this.cpu.pins.Addr === 'undefined') {
                        console.log(this.cpu.trace_cycles, this.cpu.current_instruction, this.cpu.regs.TCU);
                        debugger;
                    }
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, this.cpu.trace_cycles, trace_format_write('Z80', Z80_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
                    this.cpu.last_trace_cycle = this.cpu.trace_cycles;
                }
                this.bus.cpu_write(this.cpu.pins.Addr, this.cpu.pins.D);
            }
            else if (this.cpu.pins.IO) // write IO
                this.bus.cpu_ula_write(this.cpu.pins.Addr, this.cpu.pins.D);
        }
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
        let current_frame = this.clock.frames_since_restart;
        while(current_frame === this.clock.frames_since_restart) {
            this.finish_scanline();
            if (dbg.do_break) return;
        }
    }

    finish_scanline() {
        let cycles_left = this.clock.master_clocks_per_line - this.clock.ula_x;

        for (let cycle = 0; cycle < cycles_left; cycle++) {
            this.cpu_cycle();
            this.ula.cycle();
            this.ula.cycle();
            if (dbg.do_break) return;
        }
    }

    load_ROM_from_RAM(what) {
        this.bus.load_ROM_from_RAM(what);
    }

    present() {
        this.ula.present();
    }
}