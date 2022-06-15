"use strict";

// Thanks to a forum member on forums.nesdev.org, the potentially-fastest possible way to get msater clock cycle timings on SNES
// ROMspeed is 6 or 8 depending on $420d.d0=1
function SNES_mem_timing(addr, ROMspeed) {
}

const LOROM = 0x20
const HIROM = 0x21
class SNESbus {
    constructor(RAMsize, ROM) {
		this.ROM = ROM;
		this.RAM = new Uint8Array(RAMsize);
    }

	read8(addr) {
		return 0xC0;
	}

	write8(addr, val) {
	}
}


class mapped_address {
	constructor(ROMaddr, RAMaddr, SRAMaddr) {
		this.ROMaddr = ROMaddr;
		this.RAMaddr = RAMaddr;
		this.SRAMaddr = SRAMaddr;
	}
}

class snes_mem {
	/**
	 * @param {snes_cart} snes_cart
	 */
	constructor(snes_cart) {
		this.cart = snes_cart;
		// ROMsel line is not pulled low when accessing banks 7E and 7F,
		// as well as bottom halves of quadrants 1 & 3
		
		// so in banks 00-30 and 80-C0, addr 0-7FFF would not do ROMsel.
		
		// disconnect address line 16 from ROM (HiROM)
		
		// for SRAM, 2KB = 11 address lines, so wire to first 11 pins of address bus. 
		// SRAM select use line 16 we skipped earlier
		// ROM enabled when line 16 high, RAM when line 16 low
	// HiROM ignore address line 16
	// LoROM ignore address line 22 & 23
	}
	
}