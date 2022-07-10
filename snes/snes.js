"use strict";

let NTSC_MASTER_CLOCK = 21477272 // 1.89e9 / 88
let PAL_MASTER_CLOCK =  21281370

let MASTER_CLOCK = NTSC_MASTER_CLOCK;
let CLOCKS_PER_FRAME = MASTER_CLOCK / 60;
console.log('CLocks per frame', CLOCKS_PER_FRAME)


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

class SNESrom {
    constructor(ROM, size) {
    	this.ROM = ROM;
		this.size = size;
		this.mask = 0; //TODO fix this
    }
}

/*class SNESclock {
	constructor(busA, busB) {
		this.scanline = new SNESscanline();
		this.y = 0;
		this.x = 0;
	}
	
	reset() {
		// TODO: fix this
	}
	
	scanline() {
	// htime 0, 10 master clocks
	// otherwise 14 + htime*dots master cycles
	// no irq for dot 153 of last scanline or short scanline, which is interlaced thing
	// 262 scanlines
	// closest multiple of 8 cycle ssince reset, to scanline + 536, is 40 cycle CPU pause
	// 340 dots per scanline, 323 and 327 are 6 instead of 4 cycles
	// 22-277 are display time, hblank starts at 277 ends at 22
	// ppu has 340 cycles in hblank to load sprite info for next line? read tilemaps?
	// ppu and cpu keep their own track  this just needs to know how many to do
		this.cpu.steps(this.scanline);
		this.ppu.steps(this.scanline);
		this.scanline.next();
		this.dram_refresh = this.version.rev === 1 ? 530 : 538;
	}
}*/


// # Cycl  Op Type
//      6  CPU internal operation (IO cycle)
// 6,8,12. Depending on memory region access and CPU reg $420D

// # in master clock cycles, not CPU
// 1 scanline every 1364 master cycles, except non-interlace mode scanline $F0 of every other frame is only 1360 cycles. 262 scanlines non-interlace mode, interlace mode 263/262 scanlines. VBlank is from either $E1 or $F0 until end of frame
// CPU keeps pausing. On frame 0, CPU pause 40 cycles after 538 cycles. Thereafter some multiple of 8 cycles after the previous pause that comes closest to 536.
/* It takes 12 master cycles (2 IO cycles) to end the WAI instruction, at which point the NMI or IRQ handler may actually be executed. add logic to wait to ack

nmi at begining of vblank
The internal timer will set its NMI output low at H=0.5 at the beginning of V-Blank. The CPU's /NMI input is forced high by clearing bit 7 of register $4200, so the CPU may not actually see the NMI transition. The CPU will jump to the NMI routine at the end of the instruction during which /NMI transitions.

DMA
if dma active or ram refresh or whatever, nmi or irq wont ve acknowlwdge  once dma finish, cpu will continue 24-30 cycles before acknowledging

The internal timer will set its IRQ output low under the following conditions ('x' and 'y' are bits 4 and 5 of $4200, HTIME is registers $4207-8, and VTIME is $4209-A):

yx    trigger point
00 => Never
01 => H-IRQ:  every scanline, H=HTIME+~3.5
10 => V-IRQ:  V=VTIME, H=~2.5
11 => HV-IRQ: V=VTIME, H=HTIME+~3.5


so there are events
 every 4? cycles a PPU dot
 if doing dma, that every 8 cycles
 else new cpu cycle every 6-12
 1364 master cycles per scanline
 262 non interlace or 263 interlaced scanlines
  vblank nmi at scanline e1 or f0 depending ntsc or pal
  
  
  
  And the datasheet is inaccurate regarding that first cycle of the IRQ/NMI pseudo-opcode. It's an opcode fetch cycle from PB:PC (typically 6 or 8 master cycles), not an IO cycle (always 6 master cycles) as the datasheet claims.
  
  need ro keep track of cycles mod 8 since reset
  
  
  need a master dispatcher, and a 5a22 dispatcher
  
  5a22:
    gets ppu dot position i think
    triggers dram refresh, dma, and cpu cycles
    really it should be given entire scanlines or vblanks wortb to execute at a time?
   problem is
   irq, nmi trigger from ppu dependant on ppu regs?
   5a22 normally gets hblank and vblank signals input from ppu
   
   so
   pins for 5a22 are - 
   hblank
   vblank
   addr/data a
   addr/data b
   rw a/b, strobes, so to read uou need a strobe
   ramsel
   romsel
   
   but also
   
   thats a lot each cycle
   
   if instead...
   a master clock was provided
   and also a master bus for read/write
   master clock could mediate dma priorities, issue cpu cycles, latch PPU registers, and dispatch scanlines  could work based off scanline timing 
    
    take a sort of a "you can run until..." approach, and things can interrupt themselves ie if dma changes
    
    but no, cpu should habdle dma and its too closely linked with refresh
    
    a madter planner sounds good but just 
    
    
    id like to put 5a22 on pin level output...have dma scheduling internal to chip...tell it a number of master clock cycles to simulate...and if dma or ppu configs change in important ways, it should abort that sim early
    at the same time, a web worker could be rendering the previous scanline
    PPU registers could be latched and transmitted to PPU worker at scanline start...eventually
    but vasixally latch all ppu registers at each scanline
    were not going to do mid scanline shenanigans
    
    
    it shoukd disparxh to cpu like,
    do 50 cycles
    
     
  under 150 wdc cycles per scanline 
  

scanline 
*/	

class SNES {
	constructor() {
		this.cart = new snes_cart();
		this.version = {rev: 0, nstc: true, pal: false}

		this.clock = new SNES_clock(this.version);
		this.mem_map = new snes_memmap();
		this.cpu = new ricoh5A22(this.version, this.mem_map, this.clock);
		this.ppu = new SNESPPU(null, this.version, this.mem_map, this.clock);
		this.apu = new spc700(this.mem_map, this.clock);

		this.interlaced_mode = 0;
		this.frames_emulated = 0;
	}

	load_ROM(file) {
		this.cart.load_cart(file);
	}
	
	load_ROM_from_RAM(ROM) {
		this.cart.load_cart_from_RAM(new Uint8Array(ROM));
		//this.mem = new snes_mem(this.cart);
		this.mem_map.cart_inserted(this.cart);
	}

	do_steps(steps) {
		//debugger;
		this.cpu.do_steps(steps);
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
				console.log('DOIN1', master_clocks);
				this.do_steps(master_clocks);
				return;
			}
			console.log('FINISHIN LINE', cycles_to_finish);
			this.do_steps(cycles_to_finish);
			master_clocks -= cycles_to_finish;
		}

		frames += (seconds * 60);
		if (scanlines === 0 && frames > 0) {
			scanlines += this.clock.scanline.frame_lines - this.clock.scanline.ppu_y;
			frames--;
		}
		let framenum = this.clock.scanline.frame;
		console.log('DOIN SCANLINES', scanlines)
		while (scanlines > 0) {
			console.log('DO', this.clock.scanline.cycles);
			this.do_steps(this.clock.scanline.cycles);
			console.log('DONE!')
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
		}
		if (master_clocks > 0) {
			console.log('Cleaning up', master_clocks);
			this.do_steps(master_clocks);
		}
		console.log('STEPS DONE');
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
	canvas = document.querySelector("#glCanvas");
  	// Initialize the GL context
  	gl = canvas.getContext("webgl");

  	// Only continue if WebGL is available and working
  	if (gl === null) {
    	alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    	return false;
  	}
	gl_cls();
	return true;
}

function main3(ROM) {
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
}

function main2() {
	load_ROM('test', main3);
}

function main() {
	initDb(main2);
}

after_js = main;
//after_js = test_65c816;
//after_js = generate_js;
//after_js = test_pt_65c816;
//after_js = generate_js_SPC;
