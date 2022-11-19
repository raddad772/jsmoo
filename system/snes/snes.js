"use strict";

let SNES_inputmap = [];
function fill_SNES_inputmap() {
    for (let i = 0; i < 24; i++) {
        let kp = new md_input_map_keypoint();
        let uber = (i < 8) ? 'p1' : 'p2';
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = uber;
        switch(i) {
            case 0:
            case 12:
                kp.name = 'up';
                break;
            case 1:
            case 13:
                kp.name = 'down';
                break;
            case 2:
            case 14:
                kp.name = 'left';
                break;
            case 3:
            case 15:
                kp.name = 'right';
                break;
			case 4:
            case 16:
                kp.name = 'a';
                break;
            case 5:
            case 17:
                kp.name = 'b';
                break;
            case 6:
            case 18:
                kp.name = 'x';
                break;
            case 7:
            case 19:
                kp.name = 'y';
                break;
            case 8:
            case 20:
                kp.name = 'l';
                break;
            case 9:
            case 21:
                kp.name = 'r';
                break;
            case 10:
            case 22:
                kp.name = 'start';
                break;
            case 11:
            case 23:
                kp.name = 'select';
                break;
        }
        SNES_inputmap[i] = kp;
    }
}
fill_SNES_inputmap();

class SNES {
	constructor() {
		this.cart = new snes_cart();
		this.version = {rev: 0, nstc: true, pal: false}

		this.clock = new SNES_clock(this.version);
		this.mem_map = new snes_memmap();
		this.cpu = new ricoh5A22(this.version, this.mem_map, this.clock);
		this.ppu = new SNES_slow_1st_PPU(this.version, this.mem_map, this.clock);
		this.apu = new spc700(this.mem_map, this.clock);
		this.cpu.reset();

		this.display_enabled = true;

		dbg.watch.wdc = this.cpu;
		dbg.watch.spc = this.apu;
		dbg.add_cpu(D_RESOURCE_TYPES.R5A22, this.cpu);
		dbg.add_cpu(D_RESOURCE_TYPES.SPC700, this.apu)

		this.controller1_in = new snespad_inputs();
        this.controller2_in = new snespad_inputs();
	}

	enable_display(to) {
        if (to !== this.display_enabled) {
            this.display_enabled = to;
			this.ppu.enable_display(to);
        }
	}

	update_status(current_frame, current_scanline, current_x) {
		current_frame.innerHTML = this.clock.frames_since_restart;
        current_scanline.innerHTML = this.clock.scanline.ppu_y;
        current_x.innerHTML = this.clock.cycles_since_scanline_start;
	}

	killall() {
		dbg.remove_cpu(D_RESOURCE_TYPES.R5A22);
		dbg.remove_cpu(D_RESOURCE_TYPES.SPC700);

		this.ppu.kill_threads();
	}

    step_scanlines(howmany) {
        for (let i = 0; i < howmany; i++) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }
    }

	step_master(howmany) {
        this.run_cycles(howmany);
    }

	get_description() {
		let d = new machine_description();
		d.name = 'SNES';
		d.standard = MD_STANDARD.NTSC;
		d.fps = 60;
		d.input_types = [INPUT_TYPES.SNES_CONTROLLER];
		d.x_resolution = 256;
		d.y_resolution = 240;
		d.xrh = 8;
		d.xrw = 7;

		d.overscan_top = 0;
		d.overscan_bottom = 0;
		d.overscan_left = 0;
		d.overscan_right = 0;

        d.output_buffer[0] = this.ppu.output_shared_buffers[0];
        d.output_buffer[1] = this.ppu.output_shared_buffers[1];

		for (let i = 0; i < SNES_inputmap.length; i++) {
			d.keymap.push(SNES_inputmap[i]);
		}

		return d;
	}

	get_framevars() {
        return {master_frame: this.clock.frames_since_restart, x: 0, scanline: this.clock.scanline.ppu_y};
    }

	do_display(force) {
		if (this.clock.ppu_display_due || force) {
			this.clock.ppu_display_due = false;
			this.ppu.present();
		}
	}

	present() {
		if ((!PPU_USE_WORKERS) && this.display_enabled)
			this.ppu.present();
	}

	load_ROM_from_RAM(name, ROM) {
		console.log('Loading ROM...', ROM);
		this.cart.load_cart_from_RAM(new Uint8Array(ROM));
		//this.mem = new snes_mem(this.cart);
		this.mem_map.cart_inserted(this.cart);
	}

	run_cycles(steps) {
		this.cpu.do_steps(steps);
	}

	catch_up() {
		// Catch up anything that needs to
		this.apu.catch_up(true);
		this.ppu.catch_up();
	}

	run_frame(elapsed) {
		let current_frame = this.clock.frames_since_restart;
		while (current_frame === this.clock.frames_since_restart) {
			this.finish_scanline();
			if (dbg.do_break) break;
		}
		return {buffer_num: this.ppu.last_used_buffer}
	}

	finish_scanline() {
		let current_scanline = this.clock.scanline.ppu_y;
		while (current_scanline === this.clock.scanline.ppu_y) {
			let cycles_to_finish = this.clock.scanline.cycles - this.clock.cycles_since_scanline_start;
			this.run_cycles(cycles_to_finish);
			if (dbg.do_break) break;
		}
	}

    map_inputs(buffer) {
        this.controller1_in.up = buffer[0];
        this.controller1_in.down = buffer[1];
        this.controller1_in.left = buffer[2];
        this.controller1_in.right = buffer[3];
        this.controller1_in.a = buffer[4];
        this.controller1_in.b = buffer[5];
        this.controller1_in.x = buffer[6];
        this.controller1_in.y = buffer[7];
        this.controller1_in.l = buffer[8];
        this.controller1_in.r = buffer[9];
        this.controller1_in.start = buffer[10];
        this.controller1_in.select = buffer[11];
        this.controller2_in.up = buffer[12];
        this.controller2_in.down = buffer[13];
        this.controller2_in.left = buffer[14];
        this.controller2_in.right = buffer[15];
        this.controller2_in.a = buffer[16];
        this.controller2_in.b = buffer[17];
        this.controller2_in.x = buffer[18];
        this.controller2_in.y = buffer[19];
        this.controller2_in.l = buffer[20];
        this.controller2_in.r = buffer[21];
        this.controller2_in.start = buffer[22];
        this.controller2_in.select = buffer[23];
        this.cpu.update_inputs(this.controller1_in, this.controller2_in);
    }
}
