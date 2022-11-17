"use strict";

const GB_variants = Object.freeze({
    DMG: 0,
    GBC: 1,
    SGB: 2
})

let GB_inputmap = [];
function fill_GB_inputmap() {
    for (let i = 0; i < 8; i++) {
        let kp = new md_input_map_keypoint();
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = 1;
        switch(i) {
            case 0:
                kp.name = 'up';
                break;
            case 1:
                kp.name = 'down';
                break;
            case 2:
                kp.name = 'left';
                break;
            case 3:
                kp.name = 'right';
                break;
            case 4:
                kp.name = 'a';
                break;
            case 5:
                kp.name = 'b';
                break;
            case 6:
                kp.name = 'start';
                break;
            case 7:
                kp.name = 'select';
                break;
        }
        GB_inputmap[i] = kp;
    }
}
fill_GB_inputmap();

class GB_clock {
    constructor() {
        this.ppu_mode = 2; // PPU mode. OAM search, etc.
        this.frames_since_restart = 0;
        this.master_frame = 0;

        this.trace_cycles = 0;

        this.master_clock = 0;
        this.ppu_master_clock = 0;
        this.cpu_master_clock = 0;

        this.ly = 0;
        this.lx = 0;

        // "virtual" x and y for syncing to main program when screen is off
        this.vx = 0;
        this.vy = 0;

        this.wly = 0;
        this.wlx = 0;

        this.cpu_frame_cycle = 0;
        this.ppu_frame_cycle = 0;
        this.CPU_can_VRAM = 1;
        this.old_OAM_can = 0;
        this.CPU_can_OAM = 0;
        this.bootROM_enabled = true;

        this.irq = {
            vblank_enable: 0,
            vblank_request: 0,
            lcd_stat_enable: 0,
            lcd_stat_request: 0,
            timer_enable: 0,
            timer_request: 0,
            serial_enable: 0,
            serial_request: 0,
            joypad_enable: 0,
            joypad_request: 0
        }

    this.timing = {
            ppu_divisor: 1,
            cpu_divisor: 4
        }
    }

    reset() {
        this.ppu_mode = 2;
        this.frames_since_restart = 0;
        this.hblank_pending = 0;
        this.master_clock = 0;
        this.cpu_master_clock = 0;
        this.ppu_master_clock = 0;
        this.lx = 0;
        this.ly = 0;
        this.timing.ppu_divisor = 1;
        this.timing.cpu_divisor = 4;
        this.cpu_frame_cycle = 0;
        this.ppu_frame_cycle = 0;
        this.CPU_can_VRAM = 1;
        this.CPU_can_OAM = 0;
        this.bootROM_enabled = true;
    }

    setCPU_can_OAM(to) {
        this.CPU_can_OAM = to;
        this.old_OAM_can = to;
    }
}

class GB_bus {
    /**
     * @param {bios_t} bios
     */
    constructor(bios) {
        this.cart = null;
        this.mapper = null;
        this.ppu = null;
        /**
         * @type {null|GB_CPU}
         */
        this.cpu = null;

        this.CPU_read = function(addr, val, has_effect=true) {debugger; return 0xFF; };
        this.CPU_write = function(addr, val){debugger;};
        this.CPU_read_OAM = function(addr, val, has_effect) {debugger; return 0xFF; }
        this.CPU_write_OAM = function(addr, val) {debugger;}
        this.PPU_read = function(addr) {debugger; return 40;};

        this.bios = bios;
        this.BIOS = new Uint8Array(0);
    }

    /**
     * @param {Uint8Array} inp
     */
    load_BIOS_from_RAM(inp) {
        this.BIOS = new Uint8Array(inp.byteLength);
        this.BIOS.set(new Uint8Array(inp));
    }

    CPU_read_IO(addr, val, has_effect=true) {
        let out = 0xFF;
        out &= this.cpu.read_IO(addr, val, has_effect);
        out &= this.ppu.read_IO(addr, val, has_effect);
        return out;
    }

    CPU_write_IO(addr, val) {
        this.cpu.write_IO(addr, val);
        this.ppu.write_IO(addr, val);
    }

    DMA_read(addr) {
        return this.mapper.CPU_read(addr);
        if (addr >= 0xA000) {
            console.log('IMPLEMENT OAM >0xA000!', hex4(addr));
        } else {
            return this.mapper.CPU_read(addr, 0);
        }
    }

    IRQ_vblank_down() {
        //console.log('VBLANK DOWN!', this.cpu.cpu.regs.IF);
    }

    IRQ_vblank_up() {
        this.cpu.cpu.regs.IF |= 1;
        //console.log('VBLANK UP!', this.ppu.clock.master_frame, this.cpu.cpu.regs.IE, this.cpu.cpu.regs.IF, this.cpu.cpu.regs.IE & this.cpu.cpu.regs.IF);
    }
}


class GameBoy {
    /**
     * @param {bios_t} bios
     * @param {Number} variant
     */
    constructor(bios, variant) {
        this.variant = variant;
        this.bios = bios;
        this.bus = new GB_bus();
        this.clock = new GB_clock();
        this.cart = new GB_cart(this.variant, this.bios, this.clock, this.bus);
        this.cpu = new GB_CPU(this.variant, this.clock, this.bus);
        this.ppu = new GB_PPU_FIFO(this.variant, this.clock, this.bus);

        this.cycles_left = 0;
        this.display_enabled = true;

        dbg.add_cpu(D_RESOURCE_TYPES.SM83, this.cpu);

        this.controller_in = new gb_inputs();

        this.load_bios();
    }

    pprint_palette() {
        console.log('BG', this.ppu.bg_palette);
        console.log('SP', this.ppu.sp_palette);
        console.log(this.cpu);
    }

    killall() {
        dbg.remove_cpu(D_RESOURCE_TYPES.SM83);
        //input_config.disconnect_controller('gb');
    }

    get_description() {
        let d = new machine_description();
        switch(this.variant) {
            case GB_variants.GBC:
                d.name = 'GameBoy Color';
                break;
            case GB_variants.SGB:
                d.name = 'Super GameBoy';
                break;
        }
        d.name = 'GameBoy';
        d.standard = MD_STANDARD.LCD;
        d.fps = 60;
        d.input_types = [INPUT_TYPES.GB_CONTROLLER];
        d.x_resolution = 160;
        d.y_resolution = 144;
        d.xrh = 1;
        d.xrw = 1;
        for (let i = 0; i < GB_inputmap.length; i++) {
            d.keymap.push(GB_inputmap[i]);
        }
        d.output_buffer[0] = this.ppu.output_shared_buffers[0];
        d.output_buffer[1] = this.ppu.output_shared_buffers[1];
        d.overscan_top = d.overscan_left = d.overscan_right = d.overscan_bottom = 0;
        return d;
    }

    update_status(current_frame, current_scanline, current_x) {
        current_frame.innerHTML = this.clock.frames_since_restart;
        current_scanline.innerHTML = this.clock.ly;
        current_x.innerHTML = this.clock.lx;
    }

    get_framevars() {
        let r = {master_frame: this.clock.master_frame, x: this.clock.lx, scanline: this.clock.ly};
        console.log(this.clock);
        return r;
    }

    run_frame() {
        let current_frame = this.clock.frames_since_restart;
        while (this.clock.frames_since_restart === current_frame) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }
        return {buffer_num: this.ppu.last_used_buffer};
    }

    catch_up() {}

    step_master(howmany) {
        this.run_cycles(howmany);
    }

    step_scanlines(howmany) {
        for (let i = 0; i < howmany; i++) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }
    }

    map_inputs(buffer) {
        this.controller_in.up = buffer[0];
        this.controller_in.down = buffer[1];
        this.controller_in.left = buffer[2];
        this.controller_in.right = buffer[3];
        this.controller_in.a = buffer[4];
        this.controller_in.b = buffer[5];
        this.controller_in.select = buffer[7];
        this.controller_in.start = buffer[6];
        this.cpu.update_inputs(this.controller_in)
    }

    finish_scanline() {
        let cpu_step = this.clock.timing.cpu_divisor;
        let ppu_step = this.clock.timing.ppu_divisor;
        let done = 0>>>0;
        let start_y = this.clock.ly;
        while (this.clock.ly === start_y) {
            this.clock.master_clock += cpu_step;
            this.cpu.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;
            let ppu_left = this.clock.master_clock - this.clock.ppu_master_clock;
            done = 0;
            while (ppu_left >= ppu_step) {
                ppu_left -= ppu_step;
                done++;
            }
            this.ppu.run_cycles(done);
            this.clock.ppu_master_clock += done * ppu_step;
            this.cycles_left -= cpu_step;
            if (dbg.do_break) break;
        }
    }

    run_cycles(howmany) {
        this.cycles_left += howmany;
        let cpu_step = this.clock.timing.cpu_divisor;
        let ppu_step = this.clock.timing.ppu_divisor;
        let done = 0>>>0;
        while (this.cycles_left >= cpu_step) {
            this.clock.master_clock += cpu_step;
            this.cpu.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;
            let ppu_left = this.clock.master_clock - this.clock.ppu_master_clock;
            done = 0;
            while (ppu_left >= ppu_step) {
                ppu_left -= ppu_step;
                done++;
            }
            this.ppu.run_cycles(done);
            this.clock.ppu_master_clock += done * ppu_step;
            this.cycles_left -= cpu_step;
            if (dbg.do_break) break;
        }
    }

    reset() {
        this.clock.reset();
        this.cpu.reset();
        this.ppu.reset();
        if (this.cart.mapper !== null)
            this.cart.mapper.reset();
        if (GB_QUICK_BOOT) {
            this.ppu.quick_boot();
            this.cpu.quick_boot();
        }

    }

    load_ROM_from_RAM(ROM) {
        console.log('GB Loading ROM...');
        this.cart.load_ROM_from_RAM(ROM);
        this.reset();
    }

    load_bios() {
        if (!this.bios.loaded) {
            alert('Please upload or select a Master System BIOS under Tools/Bios');
            return;
        }
        this.bus.load_BIOS_from_RAM(this.bios.BIOS);
    }

}