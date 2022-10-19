"use strict";

let NTSC_MASTER_CLOCK = 21477272 // 1.89e9 / 88
let PAL_MASTER_CLOCK =  21281370

let MASTER_CLOCK = NTSC_MASTER_CLOCK;
let CLOCKS_PER_FRAME = MASTER_CLOCK / 60;


/*
so all the junk below means
bus class (two instances, A and B, has read and write)
masterclock class
gets the two busses
they are also passed to the 5a22 and ppu

5a22 has a 65816 subclass


masterclock keeps track of which scanline we're on, cycles mod 8 from reset, even/odd frame, and how many cycles next scanline is. PPU can modify this info too
there is a class passed into 5a22 and PpU that basically says

steps to emulate
hblank_range
vblank?
scanline #
current cycle
cycles in scanline

*/


class SNES {
	/**
	 * @param {canvas_manager_t} canvas_manager
	 */
	constructor(canvas_manager) {
		this.cart = new snes_cart();
		this.version = {rev: 0, nstc: true, pal: false}

		this.canvas_manager = canvas_manager;

		this.clock = new SNES_clock(this.version);
		this.mem_map = new snes_memmap();
		this.cpu = new ricoh5A22(this.version, this.mem_map, this.clock);
		this.ppu = new SNES_slow_1st_PPU(canvas_manager, this.version, this.mem_map, this.clock);
		this.apu = new spc700(this.mem_map, this.clock);
		this.cpu.reset();

		this.display_enabled = true;

		dbg.watch.wdc = this.cpu;
		dbg.watch.spc = this.apu;
		dbg.add_cpu(D_RESOURCE_TYPES.R5A22, this.cpu);
		dbg.add_cpu(D_RESOURCE_TYPES.SPC700, this.apu)
		input_config.connect_controller('snes1');
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
		input_config.disconnect_controller('snes1');
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
		let d = new machine_description('SNES');
		d.technical.standard = 'NTSC';
		d.technical.fps = 60;
		d.input_types = [INPUT_TYPES.SNES_CONTROLLER];
		d.technical.x_resolution = 256;
		d.technical.y_resolution = 240;
		return d;
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

	load_ROM_from_RAM(ROM) {
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
	}

	finish_scanline() {
		let current_scanline = this.clock.scanline.ppu_y;
		while (current_scanline === this.clock.scanline.ppu_y) {
			let cycles_to_finish = this.clock.scanline.cycles - this.clock.cycles_since_scanline_start;
			this.run_cycles(cycles_to_finish);
			if (dbg.do_break) break;
		}
	}
}

//after_js = test_pt_z80;
//after_js = test_65c816;
//after_js = test_pt_65c816;
//after_js = test_pt_spc700;
//after_js = test_pt_nesm6502;
//after_js = AS_test_pt_nesm6502;
//after_js = AS_test_pt_m65c02;
