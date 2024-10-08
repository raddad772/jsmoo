"use strict";

const SER_NES = ['clock', 'cart', 'cpu', 'ppu', 'cycles_left']

let NES_inputmap = [];

const NES_IRQ_sources = {
    MMC: 1,
    APU: 2
}

function fill_NES_inputmap() {
    for (let i = 0; i < 16; i++) {
        let kp = new md_input_map_keypoint();
        let uber = (i < 8) ? 'p1' : 'p2';
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = uber;
        switch(i) {
            case 0:
            case 8:
                kp.name = 'up';
                break;
            case 1:
            case 9:
                kp.name = 'down';
                break;
            case 2:
            case 10:
                kp.name = 'left';
                break;
            case 3:
            case 11:
                kp.name = 'right';
                break;
            case 4:
            case 12:
                kp.name = 'a';
                break;
            case 5:
            case 13:
                kp.name = 'b';
                break;
            case 6:
            case 14:
                kp.name = 'start';
                break;
            case 7:
            case 15:
                kp.name = 'select';
                break;
        }
        NES_inputmap[i] = kp;
    }
}
fill_NES_inputmap();


class NES {
    constructor() {
        this.bus = new NES_bus();
        this.clock = new NES_clock();
        this.cart = new NES_cart(this.clock, this.bus);
        this.cpu = new ricoh2A03(this.clock, this.bus);
        this.ppu = new NES_ppu(this.clock, this.bus);
        this.apu = new NES_APU(this.clock, this.bus);
        this.cycles_left = 0;

        this.display_enabled = true;
        this.controller1_in = new nespad_inputs();
        this.controller2_in = new nespad_inputs();
        dbg.add_cpu(D_RESOURCE_TYPES.M6502, this.cpu);
    }

    serialize() {
        let o = {
            version: 1,
            system: 'NES',
            rom_name: ''
        }
        serialization_helper(o, this, SER_NES);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD NES VERSION!');
            return false;
        }
        if (from.system !== 'NES') {
            console.log('WRONG SYSTEM!');
            return false;
        }
        return deserialization_helper(this, from, SER_NES);
    }

    enable_display(to) {
        if (to !== this.display_enabled) {
            this.display_enabled = to;
        }
    }

    killall() {
        dbg.remove_cpu(D_RESOURCE_TYPES.M6502);
        //input_config.disconnect_controller('nes1');
    }

	get_description() {
        let d = new machine_description();
        // 29780.754
        this.apu.output.set_audio_params(357372, 48000, 800, 5);
        d.name = 'Nintendo Entertainment System';
        d.standard = MD_STANDARD.NTSC;
        d.fps = 60;
        d.input_types = [INPUT_TYPES.NES_CONTROLLER];
        d.x_resolution = 256;
        d.y_resolution = 240;
        d.xrh = 4;
        d.xrw = 3;

        d.overscan.top = 8;
        d.overscan.bottom = 8;
        d.overscan.left = 8;
        d.overscan.right = 8;

        d.output_buffer[0] = this.ppu.output_shared_buffers[0];
        d.output_buffer[1] = this.ppu.output_shared_buffers[1];

        for (let i = 0; i <  NES_inputmap.length; i++) {
            d.keymap.push(NES_inputmap[i]);
        }

        return d;
	}

    play() {}
    pause() {}
    stop() {}

    present() {
        if (this.display_enabled)
            this.ppu.present();
    }

    get_framevars() {
        return {master_frame: this.clock.master_frame, x: this.ppu.line_cycle, scanline: this.clock.ppu_y};
    }

    run_frame() {
        let current_frame = this.clock.master_frame;
        while (this.clock.master_frame === current_frame) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }
        return {buffer_num: this.ppu.last_used_buffer, sound_buffer: this.apu.output.get_buffer()}
    }

    catch_up() {}

    step_master(howmany) {
        this.cycles_left = 0;
        this.run_cycles(howmany);
    }

    step_scanlines(howmany) {
        for (let i = 0; i < howmany; i++) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }
    }

    finish_scanline() {
        let cpu_step = this.clock.timing.cpu_divisor;
        let ppu_step = this.clock.timing.ppu_divisor;
        let done = 0>>>0;
        let start_y = this.clock.ppu_y;
        while (this.clock.ppu_y === start_y) {
            this.clock.master_clock += cpu_step;
            this.apu.cycle(this.clock.master_clock);
            this.cpu.run_cycle();
            this.cart.mapper.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;
            let ppu_left = this.clock.master_clock - this.clock.ppu_master_clock;
            done = 0;
            while (ppu_left >= ppu_step) {
                ppu_left -= ppu_step;
                done++;
            }
            this.ppu.cycle(done);
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
            this.apu.cycle(this.clock.master_clock);
            this.clock.master_clock += cpu_step;
            this.cpu.run_cycle();
            this.cart.mapper.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;
            let ppu_left = this.clock.master_clock - this.clock.ppu_master_clock;
            done = 0;
            while (ppu_left >= ppu_step) {
                ppu_left -= ppu_step;
                done++;
            }
            this.ppu.cycle(done);
            this.cycles_left -= cpu_step;
            if (dbg.do_break) break;
        }
    }

    reset() {
        this.clock.reset();
        this.cpu.reset();
        this.ppu.reset();
        this.cart.mapper.reset();
    }

    load_ROM_from_RAM(name, ROM) {
        console.log('Loading ROM...');
        this.cart.load_cart_from_RAM(ROM);
        this.reset();
    }

    map_inputs(buffer) {
        this.controller1_in.up = buffer[0];
        this.controller1_in.down = buffer[1];
        this.controller1_in.left = buffer[2];
        this.controller1_in.right = buffer[3];
        this.controller1_in.a = buffer[4];
        this.controller1_in.b = buffer[5];
        this.controller1_in.start = buffer[6];
        this.controller1_in.select = buffer[7];
        this.controller2_in.up = buffer[8];
        this.controller2_in.down = buffer[9];
        this.controller2_in.left = buffer[10];
        this.controller2_in.right = buffer[11];
        this.controller2_in.a = buffer[12];
        this.controller2_in.b = buffer[13];
        this.controller2_in.start = buffer[14];
        this.controller2_in.select = buffer[15];
        this.cpu.update_inputs(this.controller1_in, this.controller2_in);
    }
}