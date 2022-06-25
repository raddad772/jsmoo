"use strict";

class SNESPPU {
	constructor(canvas, busB) {
		this.canvas = canvas;
		this.busB = busB;
	}

	reg_read(addr) {
		console.log('PPU read', hex0x6(addr));
		return 0x01;
	}

	reg_write(addr, val) {
		console.log('PPU write', hex0x6(addr), hex0x2(val));
	}

	steps(scanline) {

	}

}
