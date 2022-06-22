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

const MEM_BLOCK_SIZE = 0x1000;
const MEM_MASK = MEM_BLOCK_SIZE - 1;
const MEM_SHIFT = 12;
const MEM_NUM_BLOCKS = 0x1000;


/*
SNES9x is very big INSPIRATION for this.
 */

const MAP_TI = Object.freeze({NONE: 0, I_O: 1, ROM: 2, RAM: 3, PPU: 10, CPU: 11, SRAM: 12})
//const MAP_INDEX = Object.freeze({NONE: 0, PPU: 1, CPU: 2});

class MMAP {
	constructor(kind, offset) {
		if (typeof offset === 'undefined')
			offset = 0;
		this.offset = offset;
		this.kind = kind;
	}
}

class snes_memmap {
	/**
	 * @param {snes_cart} snes_cart
	 */
	constructor(snes_cart) {
		this.cart = snes_cart;
		//this.map = new Uint32Array(MEM_NUM_BLOCKS);
		//this.write_map = new Uint32Array(MEM_NUM_BLOCKS);
		this.cart = snes_cart;

		this.mmap = new Array(MEM_NUM_BLOCKS);
		this.write_map = new Array(MEM_NUM_BLOCKS);

		this.hirom = snes_cart.header.hirom;
		this.lorom = snes_cart.header.lorom;

		//this.RAM = RAM;
		//this.ROM = ROM;
		this.ROMSize = snes_cart.header.rom_sizebit;
		this.SRAMSize = snes_cart.header.sram_sizebit;

		this.block_is_rom = new Array(MEM_NUM_BLOCKS);
		this.block_is_ram = new Array(MEM_NUM_BLOCKS);

		this.init_map();
		if (this.lorom) {
			this.map_lorom_map();
		}
		else {
			alert('HIROM NOT SUPPORT!?');
		}
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

	init_map() {
		for (let i = 0; i < MEM_NUM_BLOCKS; i++) {
			this.block_is_rom[i] = this.block_is_ram[i] = false;
			this.mmap[i] = new MMAP(MAP_TI.NONE);
		}
	}

	map_space(bank_start, bank_end, addr_start, addr_end, to_what) {
		this.map_index(bank_start, bank_end, addr_start, addr_end, MAP_TI.CPU, to_what)
		/*for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i += MEM_BLOCK_SIZE) {
				let p = (c << 4) | (i >> MEM_SHIFT);
				this.mmap[p] = to_what;
				this.block_is_rom[p] = false;
				this.block_is_ram[p] = true;
			}
		}*/
	}

	map_index(bank_start, bank_end, addr_start, addr_end, index, type) {
		let isROM = (!((type === MAP_TI.I_O) || (type === MAP_TI.RAM)));
		let isRAM = (!((type === MAP_TI.I_O) || (type === MAP_TI.ROM)));

		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i += MEM_BLOCK_SIZE) {
				let p = (c << 4) | (i >> MEM_SHIFT);
				this.mmap[p].kind = type;
				this.mmap[p].offset = 0;
				this.block_is_rom[p] = isROM;
				this.block_is_ram[p] = isRAM;
			}
		}
	}

	map_system() {
		this.map_space(0x00, 0x3F, 0x0000, 0x1FFF, MAP_TI.RAM);
		this.map_index(0x00, 0x3F, 0x2000, 0x3FFF, MAP_TI.PPU, MAP_TI.I_O);
		this.map_index(0x00, 0x3F, 0x4000, 0x5FFF, MAP_TI.CPU, MAP_TI.I_O);
		this.map_space(0x80, 0xBF, 0x0000, 0x1FFF, MAP_TI.RAM);
		this.map_index(0x80, 0xBF, 0x2000, 0x3FFF, MAP_TI.PPU, MAP_TI.I_O);
		this.map_index(0x80, 0xBF, 0x4000, 0x5FFF, MAP_TI.CPU, MAP_TI.I_O);
	}

	map_wram() {
		this.map_space(0x7e, 0x7e, 0x0000, 0xffff, new MMAP(MAP_TI.RAM));
		this.map_space(0x7f, 0x7f, 0x0000, 0xffff, new MMAP(MAP_TI.RAM, 0x1000));
	}

	map_mirror(size, pos)
	{
		// from snes9x from bsnes
		if (size === 0)
			return 0;
		if (pos < size)
			return pos;

		let mask = 1 << 31;
		while (!(pos & mask))
			mask >>= 1;

		if (size <= (pos & mask))
			return this.map_mirror(size, pos - mask);
		else
			return mask + this.map_mirror(size - mask, pos - mask);
	}

	map_lorom(bank_start, bank_end, addr_start, addr_end, size) {
		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i++) {
				let p = (c << 4) | (i >> MEM_SHIFT);
				let addr = (c & 0x7F) * 0x8000;
				this.mmap[p].kind = MAP_TI.ROM;
				this.mmap[p].offset = this.map_mirror(size, addr) - (i & 0x8000);
				this.block_is_rom[p] = true;
				this.block_is_ram[p] = false;
			}
		}
	}

	map_lorom_sram() {
		let hi;
		if (this.ROMSize > 11 || this.SRAMSize > 5)
			hi = 0x7FFF;
		else
			hi = 0xFFFF;

		this.map_index(0x70, 0x7D, 0x0000, hi, MAP_TI.SRAM, MAP_TI.RAM);
		this.map_index(0xF0, 0xFF, 0x0000, hi, MAP_TI.SRAM, MAP_TI.RAM);
	}

	map_lorom_map() {
		this.map_system();
		this.map_lorom(0x00, 0x3F, 0x8000, 0xFFFF, this.ROM.length);
		this.map_lorom(0x40, 0x7F, 0x0000, 0xFFFF, this.ROM.length);
		this.map_lorom(0x80, 0xBF, 0x8000, 0xFFFF, this.ROM.length);
		this.map_lorom(0xC0, 0xFF, 0x0000, 0xFFFF, this.ROM.length);

		this.map_lorom_sram();
		this.map_wram();

		this.map_write_protect_rom();
	}

	map_write_protect_rom() {
		for (let c = 0; c < 0x1000; c++) {
			this.write_map[c] = new MMAP(this.mmap.kind, this.mmap.offset);
			if (this.block_is_rom[c])
				this.write_map[c].kind = MAP_TI.NONE;
		}
	}
}