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
	constructor(jsanimator) {
		this.cart = new snes_cart();
		this.version = {rev: 0, nstc: true, pal: false}

		this.clock = new SNES_clock(this.version);
		this.mem_map = new snes_memmap();
		this.cpu = new ricoh5A22(this.version, this.mem_map, this.clock);
		this.ppu = new SNES_slow_1st_PPU(document.getElementById('snescanvas'), this.version, this.mem_map, this.clock);
		this.apu = new spc700(this.mem_map, this.clock);
		this.cpu.reset();
		this.jsanimator = jsanimator;
		this.jsanimator.callback = this.do_frame.bind(this);
		dbg.watch.wdc = this.cpu;
		dbg.watch.spc = this.apu;
	}

	do_display(force) {
		if (this.clock.ppu_display_due || force) {
			this.clock.ppu_display_due = false;
			this.ppu.present();
		}
	}

	load_ROM_from_RAM(ROM) {
		console.log('Loading ROM...', ROM);
		this.cart.load_cart_from_RAM(new Uint8Array(ROM));
		//this.mem = new snes_mem(this.cart);
		this.mem_map.cart_inserted(this.cart);
	}

	do_steps(steps) {
		//debugger;
		this.cpu.do_steps(steps);
	}

	catch_up() {
		// Catch up anything that needs to
		this.apu.catch_up(true);
		this.ppu.catch_up();
	}

	do_frame(elapsed) {
		if (elapsed > 15) {
			if (dbg.frames_til_pause !== 0) {
				dbg.frames_til_pause--;
				ui_el.frames_til_pause.value = dbg.frames_til_pause;
				if (dbg.frames_til_pause === 0) {
					this.jsanimator.pause();
					stop_fps_count();
				}
			}
			this.step(0, 0, 1, 0);
		}
	}

	step(master_clocks, scanlines, frames, seconds) {
		//debugger;
		/*if (scanlines < 0) {
			let de = Math.ceil(Math.abs(scanlines / 262));
			console.log('DE', de);
			frames -= de;
			scanlines += (262 * de);
			if (frames < 0) {
				de = Math.ceil(Math.abs(frames / 60));
				console.log('DE2', de);
				seconds -= de;
				frames += (de * 60);
				if (seconds < 0) seconds = 0;
			}
		}

		frames += (seconds * 60);*/

		if (!this.clock.start_of_scanline) {
			let cycles_to_finish = this.clock.scanline.cycles - this.clock.cycles_since_scanline_start;
			if ((cycles_to_finish > master_clocks) && (scanlines === 0) && (frames === 0) && (seconds === 0)) {
				this.do_steps(master_clocks);
				return;
			}
			this.do_steps(cycles_to_finish);
			master_clocks -= cycles_to_finish;
			if (dbg.do_break) {
				dbg.do_break = false;
				this.do_display(true);
				return;
			}
		}

		frames += (seconds * 60);
		if (scanlines === 0 && frames > 0) {
			scanlines += this.clock.scanline.frame_lines - this.clock.scanline.ppu_y;
			frames--;
		}
		let framenum = this.clock.scanline.frame;
		//console.log('DOIN SCANLINES', scanlines)
		while (scanlines > 0) {
			this.do_steps(this.clock.scanline.cycles);
			if (framenum !== this.clock.scanline.frame) {
				framenum = this.clock.scanline.frame;
				if (frames > 0) {
					frames--;
					scanlines += this.clock.scanline.frame_lines;
				}
			}
			scanlines--;
			if (scanlines < 1) {
				if (frames < 1)
					break;
				console.log('SCANLINES BEFORE', scanlines)
				scanlines = this.clock.scanline.frame_lines - this.clock.scanline.ppu_y;
				console.log('SCANLIENS AFTER', scanlines)
				frames--;
			}
			if (dbg.do_break) {
				dbg.do_break = false;
				this.do_display(true);
				return;
			}
		}
		if (master_clocks > 0) {
			console.log('Cleaning up', master_clocks);
			this.do_steps(master_clocks);
			this.do_display(false);
		}
		dbg.do_break = false;
		/*let excess_scanlines = 0;
		let discharged = false;
		while(true) {
			this.do_steps(this.clock.scanline.cycles);
			// Check if we're the start of a frame
			if (this.clock.scanline.ppu_y === 0 && !discharged) {
				if (scanlines < this.clock.scanline.frame_lines) {
	 				excess_scanlines = scanlines;
					scanlines = 0;
				}
			}
			scanlines--;
			if (scanlines === 0) {
				if (frames === 0)
					break;
				frames--;
				scanlines += this.clock.scanline.frame_lines;
			}
		}

		console.log('STEP...', master_clocks, scanlines, frames, seconds);
		// First, we want to finish out our current scanline IF WE CAN,
		// Then finish out our current frame IF WE CAN,
		// Then emulate any remaining frames
		// Then emulate any remaining scanlines
		// Then emulate any remaining master_clocks
		*/
	}
}

function load_ROM(fileId, func) {
	getFromDb(fileId, func);
}

let gl;
let canvas;
let snes;

function gl_cls() {
	// Set clear color to black, fully opaque
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	// Clear the color buffer with specified clear color
	gl.clear(gl.COLOR_BUFFER_BIT);
}

function init_gl() {
	//canvas = document.querySelector("#glCanvas");
  	// Initialize the GL context
  	//gl = canvas.getContext("webgl");

  	// Only continue if WebGL is available and working
  	/*if (gl === null) {
    	alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    	return false;
  	}
	gl_cls();*/
	return true;
}

/*function main3(ROM) {
	snes = new SNES();
	dbg.add_cpu(D_RESOURCE_TYPES.R5A22, snes.cpu);
	dbg.add_cpu(D_RESOURCE_TYPES.SPC700, snes.apu)
	if (ROM === null || typeof(ROM) === 'undefined') {
		alert('No ROM! Upload then refresh please');
		return;
	}
	snes.load_ROM_from_RAM(ROM);
	if (!init_gl()) {
		return;
	}

	dbg.init_done();
}*/

/*function main2() {
	load_ROM('test', main3);
}

function main_old() {
	initDb(main2);
}*/


//after_js = test_65c816;
//after_js = test_pt_65c816;
//after_js = test_pt_spc700;
//after_js = test_pt_nesm6502;
after_js = test_pt_m65c02;