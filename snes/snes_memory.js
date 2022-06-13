"use strict";

// Thanks to a forum member on forums.nesdev.org, the potentially-fastest possible way to get msater clock cycle timings on SNES
// ROMspeed is 6 or 8 depending on $420d.d0=1
function SNES_mem_timing(addr, ROMspeed) {
	let rspeed = ROMspeed || 8;
	if (addr & 0x408000) return addr & 0x800000 ? rspeed : 8;
	if (addr + 0x6000 & 0x4000) return 8;
	if (addr - 0x4000 & 0x7e00) return 6;
	return 12;
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


class snes_mem {
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
	
	map_address(addr) {
		let ROMaddr = 0;
		let bank = (addr & 0xFF0000) >> 16;
		let page = (addr & 0xFF00) >> 8;
		let ROMsel = false;
		let SRAMsel = false;
		if ((bank === 0x7E) || (bank === 0x7F)) {
			ROMsel = false;
		}
		else if ((bank < 0x40) || ((bank >= 0x80) && (bank < 0xC0))) {
			ROMsel = addr >= 0x8000;
		}
		if (this.cart.header.mapping_mode === HIROM) {
			console.log('HIROM!')
			if (ROMsel && (addr & 0x8000)) {
				ROMsel = false;
				SRAMsel = true;
			}
			if (ROMsel) {
				ROMaddr = (addr & 0x7FFF) | ((addr & 0xFF0000) >> 1);
				ROMaddr = ROMaddr & this.cart.header.bank_mask;
			}
			return ROMaddr;
		}
		else {
			console.log('LOROM!');
			if (ROMsel) {
				ROMaddr = (addr & 0x7FFF) | ((addr & 0xFF0000) >> 1);
				ROMaddr = ROMaddr & this.cart.header.bank_mask;
			}
			return ROMaddr;
		}
	}
}