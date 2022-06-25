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

class SNESscanline {
    constructor(version) {
		this.y = 0;
		this.dots = new Uint8Array(340);
		for (let i = 0; i < 340; i++) {
			this.dots[i] = 4; // 4 master cycles per dot...mostly!
		}
		this.dots[323] = 6;
		this.dots[327] = 6;

		// Technically we start in vblank and hblank but...not gonna trigger CPU first frame. ARE WE?
		// Load up with first-frame data
		this.vblank = false;
		this.hblank = false;
		this.hb_stop = 21;
		this.hb_start = 277;
		this.dots = 340;
		this.frame_lines = 262;
		this.interlaced = false;
		this.cycles = 1364;
		this.frame = 0;  // 0 or 1 even or odd, basically
		this.cycles_since_reset = 0; // Master cycles since reset. Yeah.
		this.version = version;
		this.bottom_scanline = 0xE1; // by default
  		this.hdma_setup_position = (version.rev === 1 ? 12 + 8 - (this.cycles_since_reset & 7) : 12 + (this.cycles_since_reset & 7));
		this.hdma_position = 1104; // HDMA triggers every VISIBLE scanline, here.
    }

	set_interlaced(val) {
		this.interlaced = val;
		this.frame_lines = 262 + (1 * (this.interlaced && this.frame === 0));
	}

	new_frame() {
		this.cycles_since_reset += this.cycles;
		this.y = 0;
		this.frame = (this.frame + 1) & 0x01;
		this.frame_lines = 262 + (1 * (this.interlaced && this.frame === 1));
	}

	next() {
		this.y += 1;
		if (this.y > 261) this.new_frame();
		this.cycles = 1364;

		if (this.y === 0) {
			// vblank ends
			// 1364 master cycles
			// no output
			this.vblank = false;
			this.cycles = 1364;
		}
		else if ((this.y > 0) && (this.y < this.bottom_scanline)) {
			// 1364 master cycles, 324 dots
			this.cycles = 1364;
		}
		else if (this.y === this.bottom_scanline) {
		    // vblank begins
			this.vblank = true;
			this.cycles = 1364;
		}
		else {
			// during vblank
		}
		if (this.y === 0xF0 && !this.interlaced) {
			this.cycles = 1360;
		}
		this.dram_refresh = this.version.rev === 1 ? 530 : 538;
		if ((this.cycles_since_reset + this.dram_refresh) % 8) {
			let w = ((this.cycles_since_reset + this.dram_refresh) % 8);
			if (w < 4) this.dram_refresh += w;
			else this.dram_refresh -= w;
		}
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

class SNESbusMapper {
	constructor(cart) {
		/*this.busA = busA;
		this.busB = busB;*/
		this.cart = cart;
	}

	map_address(addr) {
		let ROMaddr = null;
		let SRAMaddr = null;
		let RAMaddr = null;
		let bank = (addr & 0xFF0000) >>> 16;
		let page = (addr & 0xFF00) >>> 8;
		let addrlow = addr & 0xFFFF;
		/*
		let ROMsel = false;
		let SRAMsel = false;
		if ((bank === 0x7E) || (bank === 0x7F)) {
			ROMsel = false;
		}
		else if ((bank < 0x40) || ((bank >= 0x80) && (bank < 0xC0))) {
			ROMsel = addrlow >= 0x8000;
		}
		if (this.cart.header.mapping_mode === HIROM) {
			if (ROMsel && (addr & 0x8000)) {
				ROMsel = false;
				SRAMsel = true;
			}
			if (ROMsel) {
				ROMaddr = (addr & 0x7FFF) | ((addr & 0xFF0000) >>> 1);
				ROMaddr = ROMaddr & this.cart.header.bank_mask;
			}
			else if (SRAMsel) {

			}
			return new mapped_address(ROMaddr, null, null);
		}
		else {
			if (ROMsel) {
				ROMaddr = (addr & 0x7FFF) | ((addr & 0xFF0000) >>> 1);
				ROMaddr = ROMaddr & this.cart.header.bank_mask;
				return new mapped_address(ROMaddr, null, null);
			}
			else {
				if (bank >= 0x70 && bank <= 0x7D) {
					return new mapped_address(null, null, ((bank - 0x70) * 32768) + (addr & 0x7FFF));
				}
				if ((bank <= 0x3F) && (addrlow < 0x2000)) {
					return new mapped_address(null, addrlow, null);
				}
				if (bank >= 0x7E && bank <= 0x7F) {
					return new mapped_address(null, ((bank - 0x7E) << 16) + addrlow, null);
				}

			}
		}
		return new mapped_address(null, null, null);
		*/
		let kind = -1;
		let outaddr = -1;
		let isRAM = false;
		let isROM = false;
		let writeable = false;
		let ROMoffset = 0;
		let RAMoffset = 0;

		//let outp = new supermapped_address(addr, kind, outaddr, isRAM, isROM, writeable, ROMoffset, RAMoffset);
		if (this.cart.header.mapping_mode === LOROM) {
			if (bank >= 0x80 && bank <= 0xFD) {
				bank -= 0x80;
			}
			if (bank <= 0x3F) {
				if (addrlow <= 0x2000)
					return new mapped_address(null, addrlow, null);
				if (addrlow & 0x8000) return new mapped_address((bank << 15) + (addrlow - 0x8000), null, null);
			}
			else if (bank <= 0x6F) {
				if (addrlow & 0x8000) return new mapped_address((bank << 15) + (addrlow - 0x8000), null, null);
			}
			else if (bank <= 0x7D) {
				if (addrlow & 0x8000) return new mapped_address((bank << 15) + (addrlow - 0x8000), null, null);
				else return new mapped_address(null, null, ((bank - 0x70) << 15) + addrlow);
			}
			else if (bank >= 0x7E && bank <= 0x7F) {
				return new mapped_address(null, ((bank - 0x7E) << 16) + addrlow, null);
			}
			else if (bank >= 0xFE) {
				if (addrlow & 0x8000) return new mapped_address((bank - 0x80) << 16 + (addrlow - 0x8000), null, null);
				else  return new mapped_address(null, null, ((bank - 0xF0) << 15) + addrlow);
			}
		}
		else {
			alert('HIROM!');
		}
		return new mapped_address(null, null, null);
	}
}

function fmt_smap(smap) {
	if (smap.RAMoffset !== -1) smap.RAMoffset = hex0x6(smap.RAMoffset);
	if (smap.ROMoffset !== -1) smap.ROMoffset = hex0x6(smap.ROMoffset);
	smap.addr = hex0x6(smap.addr);
	return smap;
}

class SNES {
	constructor() {
		this.cart = new snes_cart();
		this.version = {rev: 0, nstc: true, pal: false}

		this.scanline = new SNESscanline(this.version);
		this.mem_map = new snes_memmap();
		this.cpu = new ricoh5A22(this.version, this.mem_map);
		this.ppu = new SNESPPU(null, this.version, this.mem_map);

		this.mem_map.read_cpu = this.cpu.reg_read;
		this.mem_map.write_cpu = this.cpu.reg_write;
		this.mem_map.read_ppu = this.ppu.reg_read;
		this.mem_map.write_ppu = this.ppu.reg_write;

		this.interlaced_mode = 0;
	}
	
	load_ROM(file) {
		this.cart.load_cart(file);
	}
	
	load_ROM_from_RAM(ROM) {
		this.cart.load_cart_from_RAM(new Uint8Array(ROM));
		//this.mem = new snes_mem(this.cart);
		this.mem_map.cart_inserted(this.cart);
		console.log('Should calc RAM 0x000004');
		this.mem_map.dispatch_read(0x000004);
		console.log('Should calc ROM 0x000004');
		this.mem_map.dispatch_read(0x008004);
		console.log('Should calc ROM 0x001004');
		this.mem_map.dispatch_read(0x009004);
		console.log('Should calc ROM 0x008003');
		this.mem_map.dispatch_read(0x018003);
		console.log('Should calc RAM 0x001002');
		this.mem_map.dispatch_read(0x041002);
		console.log('Should CPU reg read 0x4200');
		this.mem_map.dispatch_read(0x124200);
		console.log('Should PPU reg read 0x2200');
		this.mem_map.dispatch_read(0x182200);
	}

	run_scanline() {
		this.scanline.next();
	}

	step() {
		console.log('STEP...')
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
	//console.log('Got...', ROM);
	if (ROM === null || typeof(ROM) === 'undefined') {
		alert('No ROM! Upload then refresh please');
		return;
	}
	snes.load_ROM_from_RAM(ROM);
	if (!init_gl()) {
		return;
	}
}

function main2() {
	load_ROM('test', main3);
}

function main() {
	initDb(main2);
}

function generate_js() {
	save_js('w65c816_generated_opcodes.js', 'const decoded_opcodes = Object.freeze(\n' + decode_opcodes() + ');');
}

window.onload = main;
//window.onload = test_65c816;
//window.onload = generate_js;
//window.onload = test_pt_65c816;