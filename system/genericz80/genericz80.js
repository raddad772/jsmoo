"use strict";

class generic_z80_clock {
    constructor() {
        this.frames_since_restart = 0;
    }

    reset() {
        this.frames_since_restart = 0;
    }
}

class generic_z80_computer {
    constructor() {
        this.cpu = new z80_t(false);
        this.RAM = new Uint8Array(65536);

        this.fps = 30;
        this.speed = 80000000; // 4 MHz
        this.zexall_mode = true;

        this.console_str = '';
        this.cycles_per_frame = this.speed / this.fps;
        this.clock = new generic_z80_clock();

        this.cycles_left_this_frame = this.cycles_per_frame;

        this.trace_on = false;

        dbg.add_cpu(D_RESOURCE_TYPES.Z80, this);
    }

    killall() {

    }

    reset() {
        this.cpu.reset();
        this.clock.reset();
    }

    trace_peek(addr) {
        return this.RAM[addr];
    }

    enable_tracing() {
        console.log('ENABLING TRACE');
        this.cpu.enable_tracing(this.trace_peek.bind(this));
    }

    disable_tracing() {
        this.cpu.disable_tracing();
    }

    step_master(howmany) {
        let todo = howmany;
        for (let i = 0; i < todo; i++) {
            this.cpu_cycle();
            this.cycles_left_this_frame--;
            if (this.cycles_left_this_frame <= 0) {
                this.clock.frames_since_restart++;
                this.cycles_left_this_frame = this.cycles_per_frame;
            }
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

    cpu_reg_read(addr, val) {
        console.log('IO READ', hex4(addr));
        return 0xCC;
    }

    cpu_reg_write(addr, val) {
        //console.log('WRITE TO CONSOLE DETECTED', val);
        let nstr = String.fromCharCode(val);
        this.console_str += nstr;
        if (val === 13) {
            console.log(this.console_str);
        }
    }

    cpu_cycle() {
        if (this.cpu.pins.RD) {
            if (this.cpu.pins.MRQ) {// read ROM/RAM
                this.cpu.pins.D = this.RAM[this.cpu.pins.Addr];
                if (this.cpu.trace_on) {
                    dbg.traces.add(D_RESOURCE_TYPES.Z80, this.cpu.trace_cycles, trace_format_read('Z80', Z80_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D, null, this.cpu.regs.TCU));
                }
            }
            else if (this.cpu.pins.IO) { // read IO port
                this.cpu.pins.D = this.cpu_reg_read(this.cpu.pins.Addr);
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
                if ((this.cpu.pins.D > 0xFF) || (this.cpu.pins.D < 0)) {
                    debugger;
                }
                this.RAM[this.cpu.pins.Addr] = this.cpu.pins.D;
            }
            else if (this.cpu.pins.IO) // write IO
                this.cpu_reg_write(this.cpu.pins.Addr, this.cpu.pins.D);
        }
    }

    get_description() {
        let d = new machine_description('Generic Z80');
        d.technical.standard = 'NTSC';
        d.technical.fps = this.fps;
        d.input_types = [INPUT_TYPES.KEYBOARD];
        d.technical.x_resolution = 320;
        d.technical.y_resolution = 240;
        return d;
    }

    run_frame() {
        this.step_master(this.cycles_per_frame);
    }

    load_ROM_from_RAM(what) {
        console.log('LOADING...');
        this.cpu.reset();
        let inbuf = new Uint8Array(what);
        let ptr = 0x100;
        for (let i = 0; i < inbuf.length - 0x100; i++) {
            this.RAM[ptr] = inbuf[i+0x100];
            ptr++;
        }
        this.RAM[0x28] = 0xC9; // RET instruction at 0x28
        this.cpu.regs.PC = 0x100;
        console.log('Loaded', (ptr - 0x100), 'bytes');
    }

    present() {
    }




    // for prelim.z80 support,
    // load into 0x100
    // then at 0x40 put
    // 0xC9 (RET)
    // monitor for PC === 0x40
    // if it does, output contents of 'C' to console
    // also if jump to 0, break.
}