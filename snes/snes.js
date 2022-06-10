"use strict";

let NTSC_MASTER_CLOCK = 21477272 // 1.89e9 / 88
let PAL_MASTER_CLOCK =  21281370

let MASTER_CLOCK = NTSC_MASTER_CLOCK;
let CLOCKS_PER_FRAME = MASTER_CLOCK / 60;
console.log('CLocks per frame', CLOCKS_PER_FRAME)

// # Cycl  Op Type
//      6  CPU internal operation (IO cycle)
// 6,8,12. Depending on memory region access and CPU reg $420D

// # in master clock cycles, not CPU
// 1 scanline every 1364 master cycles, except non-interlace mode scanline $F0 of every other frame is only 1360 cycles. 262 scanlines non-interlace mode, interlace mode 263/262 scanlines. VBlank is from either $E1 or $F0 until end of frame
// CPU keeps pausing. On frame 0, CPU pause 40 cycles after 538 cycles. Thereafter some multiple of 8 cycles after the previous pause that comes closest to 536.


class SNES {
	constructor() {
		this.cpu = new w65c816();
		this.cart = new snes_cart();
		this.mem = null; //new snes_mem();
	}
	
	load_ROM(file) {
		this.cart.load_cart(file);
	}
	
	load_ROM_from_RAM(ROM) {
		this.cart.load_cart_from_RAM(new Uint8Array(ROM));
		this.mem = new snes_mem(this.cart);
		this.ROM = this.cart.ROM;
		this.SRAM = this.cart.SRAM;
		console.log('0xFFE0 mapped to cart is', this.mem.map_address(0xFFE0).toString(16));
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
	console.log('GOT HERE!');
	let tst = "{R}hello {/} {B}blue{/} {R*}hello bold red{/}";
	console.log(tst);
	tconsole.addl(tst);
	console.log(txf(tst));
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

//window.onload = main;
window.onload = test_65c816;
//window.onload = generate_js;