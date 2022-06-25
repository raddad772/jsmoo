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

const MAP_TI9x = Object.freeze({NONE: 0, I_O: 1, ROM: 2, RAM: 3, PPU: 10, CPU: 11, SRAM: 12})
//const MAP_INDEX = Object.freeze({NONE: 0, PPU: 1, CPU: 2});
const MAP_SPEEDS = Object.freeze({IO: 0, SLOW: 1, FAST: 2, CPUREG: 3})

class MMAP {
	constructor(kind, speed, offset= 0) {
		this.kind = kind;
		this.speed = speed;
		this.offset = offset;
	}
}

class MMAP9x {
	constructor(kind, offset=0) {
		this.offset = offset;
		this.kind = kind;
	}
}

class supermapped_address {
	constructor(addr, kind, outaddr, isRAM, isROM, writeable, ROMoffset, RAMoffset) {
		this.addr = addr;
		this.outaddr = outaddr;
		this.isRAM = isRAM;
		this.isROM = isROM;
		this.kind = kind;
		this.writeable = writeable;
		this.ROMoffset = ROMoffset;
		this.RAMoffset = RAMoffset;
	}
}

const MAP_TI = Object.freeze({OPEN_BUS: 0, RAM: 1, ROM: 2, SRAM: 3, PPU: 4, CPU: 5, APU: 6})
class snes_memmap {
	constructor() {
		this.cart = null;
		this.RAM = new Uint8Array(0x20000);
		this.SRAM = null;

		this.readmap = new Array(MEM_NUM_BLOCKS);
		this.writemap = new Array(MEM_NUM_BLOCKS);
		this.block_is_RAM = new Array(MEM_NUM_BLOCKS);
		this.block_is_ROM = new Array(MEM_NUM_BLOCKS);

		this.read_ppu = function(addr){};
		this.write_ppu = function(addr, data){};
		this.read_cpu = function(addr){};
		this.write_cpu = function(addr, data){};

		this.ROMSizebit = 0;
		this.RAMSizebit = 0;
		this.ROMSize = 0;
		this.SRAMSize = 0;
		this.ROM = null;
	}

	clear_map() {
		for (let i = 0; i < MEM_NUM_BLOCKS; i++) {
			this.block_is_ROM[i] = this.block_is_RAM[i] = false;
			this.readmap[i] = new MMAP(MAP_TI.OPEN_BUS, MAP_TI.SLOW, 0);
			this.writemap[i] = new MMAP(MAP_TI.OPEN_BUS, MAP_TI.SLOW, 0);
		}
	}

	/**
	 * @param {snes_cart} cart
	 */
	cart_inserted(cart) {
		this.cart = cart;
		this.ROMSizebit = cart.header.rom_sizebit;
		this.SRAMSizebit = cart.header.sram_sizebit;
		this.ROMSize = cart.ROM.byteLength;
		this.SRAMSize = (2 ** this.SRAMSizebit) * 1024;
		this.ROM = cart.ROM;

		this.SRAM = new Uint8Array(this.SRAMSize);

		if (this.cart.header.lorom)
			this.setup_mem_map_lorom();
		else if (this.cart.header.hirom)
			this.setup_mem_map_hirom();
	}

	dispatch_read(addr) {
		let b = addr >>> 12;
		let mkind = this.readmap[b].kind;
		let outaddr = this.readmap[b].offset + (addr & 0xFFF);
		console.log('IN ADDRESS', hex0x6(addr), 'CALC ADDRESS', hex0x6(outaddr));
		switch(mkind) {
			case MAP_TI.OPEN_BUS:
				console.log('OPEN BUS READ');
				return null;
			case MAP_TI.ROM:
				console.log('ROM read')
				return this.ROM[outaddr];
			case MAP_TI.RAM:
				console.log('RAM read');
				return this.RAM[outaddr];
			case MAP_TI.SRAM:
				console.log('SRAM read');
				return this.SRAM[outaddr];
			case MAP_TI.PPU:
				console.log('PPU read');
				return this.read_ppu(outaddr);
			case MAP_TI.CPU:
				console.log('CPU read');
				return this.read_cpu(outaddr);
		}
		return null;
	};

	dispatch_write(addr, data) {
		let b = addr >>> 12;
		let mkind = this.writemap[b].kind;
		let outaddr = this.writemap[b].offset + (addr & 0xFFF);
		console.log('IN ADDRESS', hex0x6(addr), 'CALC ADDRESS', hex0x6(outaddr));
		switch(mkind) {
			case MAP_TI.OPEN_BUS:
				console.log('OPEN BUS WRITE');
				return;
			case MAP_TI.ROM:
				console.log('ROM write!?');
				return;
			case MAP_TI.RAM:
				console.log('RAM write');
				this.RAM[outaddr] = data;
				return;
			case MAP_TI.SRAM:
				console.log('SRAM write');
				this.SRAM[outaddr] = data;
				return;
			case MAP_TI.PPU:
				console.log('PPU write');
				this.write_ppu(outaddr, data);
				return;
			case MAP_TI.CPU:
				console.log('CPU write');
				this.write_cpu(outaddr, data);
				return;
		}
	};

	map_loram(bank_start, bank_end, addr_start, addr_end, offset) {
		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i += 0x1000) {
				let b = (c << 4) | (i >>> 12);
				this.readmap[b].kind = this.writemap[b].kind = MAP_TI.RAM;
				this.readmap[b].offset = this.writemap[b].offset = (i - bank_start) + offset;
				this.block_is_ROM[b] = false;
				this.block_is_RAM[b] = true;
			}
		}
	}

	map_kind(bank_start, bank_end, addr_start, addr_end, offset, kind) {
		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i += 0x1000) {
				let b = (c << 4) | (i >>> 12);
				this.readmap[b].kind = this.writemap[b].kind = kind;
				this.readmap[b].offset = this.writemap[b].offset = (i - addr_start) + offset;
				this.block_is_ROM[b] = this.block_is_RAM[b] = false;
			}
		}
	}

	map_lorom(bank_start, bank_end, addr_start, addr_end) {
		let offset = 0;
		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i += 0x1000) {
				let b = (c << 4) | (i >> 12);
				//console.log('MAPPING ROM', hex0x6(b << 12), 'offset', hex0x6(offset));
				this.readmap[b].kind = MAP_TI.ROM;
				this.writemap[b].kind = MAP_TI.OPEN_BUS;
				this.readmap[b].offset = offset;
				this.writemap[b].offset = 0;
				this.block_is_ROM[b] = true;
				this.block_is_RAM[b] = false;
				offset += 0x1000;
				if (offset > this.ROMSize) offset = 0;
			}
		}
	}

	map_sram(bank_start, bank_end, addr_start, addr_end) {
		let offset = 0;
		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i += 0x1000) {
				let b = (c << 4) | (i >> 12);
				this.readmap[b].kind = this.writemap[b].kind = MAP_TI.SRAM;
				this.readmap[b].offset = this.writemap[b].offset = offset;
				this.block_is_ROM[b] = false;
				this.block_is_RAM[b] = false;
				offset += 0x1000;
				//if (offset > this.SRAMSize) return;
				if (offset > this.SRAMSize) offset = 0;
			}
		}
	}

	map_wram(bank_start, bank_end, addr_start, addr_end) {
		let offset = 0;
		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i += 0x1000) {
				let b = (c << 4) | (i >> 12);
				this.readmap[b].kind = this.writemap[b].kind = MAP_TI.RAM;
				this.readmap[b].offset = this.writemap[b].offset = offset;
				this.block_is_ROM[b] = false;
				this.block_is_RAM[b] = true;
				offset += 0x1000;
			}
		}
	}

	map_system() {
		// First 8K of RAM
		this.map_loram(0x00, 0x3F, 0x0000, 0x1FFF, 0);
		// PPU regs
		this.map_kind(0x00, 0x3F, 0x2000, 0x3FFF, 0x2000, MAP_TI.PPU);
		// CPU regs
		this.map_kind(0x00, 0x3F, 0x4000, 0x5FFF, 0x4000, MAP_TI.CPU);
		// All of this mirrored again at 0x80
		this.map_loram(0x80, 0xBF, 0x00, 0x1FFF, 0);
		this.map_kind(0x80, 0xBF, 0x2000, 0x3FFF, 0x2000, MAP_TI.PPU);
		this.map_kind(0x80, 0xBF, 0x4000, 0x5FFF, 0x4000, MAP_TI.CPU);
	}


	map_lorom_sram() {
		let hi;
		if (this.ROMSizebit > 11 || this.SRAMSizebit > 5)
			hi = 0x7FFF;
		else
			hi = 0xFFFF;

		this.map_sram(0x70, 0x7D, 0x0000, hi);
		this.map_sram(0xF0, 0xFF, 0x0000, hi);
	}

	setup_mem_map_lorom() {
		this.clear_map();
		this.map_system();

		this.map_lorom(0x00, 0x3F, 0x8000, 0xFFFF);
		this.map_lorom(0x40, 0x7F, 0x8000, 0xFFFF);
		this.map_lorom(0x80, 0xBF, 0x8000, 0xFFFF);
		this.map_lorom(0xC0, 0xFF, 0x8000, 0xFFFF);

		this.map_lorom_sram();
		this.map_wram(0x7E, 0x7F, 0x0000, 0xFFFF);
	}

	setup_mem_map_hirom() {
		alert('No HIROM!');
	}
}

class snes_memmap_9x {
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
		this.ROM = this.cart.ROM;
		this.ROMSize = snes_cart.header.rom_sizebit;
		this.SRAMSize = snes_cart.header.sram_sizebit;

		this.block_is_rom = new Array(MEM_NUM_BLOCKS);
		this.block_is_ram = new Array(MEM_NUM_BLOCKS);

		this.init_map();
		if (this.lorom) {
			this.map_lorom_map();
		}
		else if (this.hirom) {
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
			this.mmap[i] = new MMAP9x(MAP_TI9x.NONE);
		}
	}

	map_space(bank_start, bank_end, addr_start, addr_end, to_what) {
		this.map_index(bank_start, bank_end, addr_start, addr_end, MAP_TI9x.CPU, to_what)
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
		let isROM = (!((type === MAP_TI9x.I_O) || (type === MAP_TI9x.RAM)));
		let isRAM = (!((type === MAP_TI9x.I_O) || (type === MAP_TI9x.ROM)));

		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i += MEM_BLOCK_SIZE) {
				let p = (c << 4) | (i >>> MEM_SHIFT);
				this.mmap[p].kind = type;
				this.mmap[p].offset = 0;
				this.block_is_rom[p] = isROM;
				this.block_is_ram[p] = isRAM;
			}
		}
	}

	map_system() {
		this.map_space(0x00, 0x3F, 0x0000, 0x1FFF, MAP_TI9x.RAM);
		this.map_index(0x00, 0x3F, 0x2000, 0x3FFF, MAP_TI9x.PPU, MAP_TI9x.I_O);
		this.map_index(0x00, 0x3F, 0x4000, 0x5FFF, MAP_TI9x.CPU, MAP_TI9x.I_O);
		this.map_space(0x80, 0xBF, 0x0000, 0x1FFF, MAP_TI9x.RAM);
		this.map_index(0x80, 0xBF, 0x2000, 0x3FFF, MAP_TI9x.PPU, MAP_TI9x.I_O);
		this.map_index(0x80, 0xBF, 0x4000, 0x5FFF, MAP_TI9x.CPU, MAP_TI9x.I_O);
	}

	map_wram() {
		this.map_space(0x7e, 0x7e, 0x0000, 0xffff, new MMAP9x(MAP_TI9x.RAM));
		this.map_space(0x7f, 0x7f, 0x0000, 0xffff, new MMAP9x(MAP_TI9x.RAM, 0x1000));
	}

	map_mirror(size, pos)
	{
		// from snes9x from bsnes
		if (size === 0)
			return 0;
		if (pos < size)
			return pos;

		let mask = 1 << 31;
		while (!(pos & mask)) {
			mask >>>= 1;
			//console.log(pos, mask);
		}

		if (size <= (pos & mask))
			return this.map_mirror(size, pos - mask);
		else
			return mask + this.map_mirror(size - mask, pos - mask);
	}

	map_lorom(bank_start, bank_end, addr_start, addr_end, size) {
		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i+= 0x1000) {
				let p = (c << 4) | (i >>> MEM_SHIFT);
				let addr = (c & 0x7F) * 0x8000;
				this.mmap[p].kind = MAP_TI9x.ROM;
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

		this.map_index(0x70, 0x7D, 0x0000, hi, MAP_TI9x.SRAM, MAP_TI9x.RAM);
		this.map_index(0xF0, 0xFF, 0x0000, hi, MAP_TI9x.SRAM, MAP_TI9x.RAM);
	}

	map_lorom_map() {
		this.map_system();
		//console.log(this.ROM);
		this.map_lorom(0x00, 0x3F, 0x8000, 0xFFFF, this.ROM.byteLength);
		this.map_lorom(0x40, 0x7F, 0x0000, 0xFFFF, this.ROM.byteLength);
		this.map_lorom(0x80, 0xBF, 0x8000, 0xFFFF, this.ROM.byteLength);
		this.map_lorom(0xC0, 0xFF, 0x0000, 0xFFFF, this.ROM.byteLength);

		this.map_lorom_sram();
		this.map_wram();

		this.map_write_protect_rom();
	}

	map_write_protect_rom() {
		for (let c = 0; c < 0x1000; c++) {
			this.write_map[c] = new MMAP9x(this.mmap[c].kind, this.mmap[c].offset);
			if (this.block_is_rom[c])
				this.write_map[c].kind = MAP_TI9x.NONE;
		}
	}

	map_address(addr) {
		let offset = (addr & 0xFFF);
		let block = (addr >>> 12);

		let outaddr = -1;
		let kind = this.mmap[block].kind;
		let isRAM = this.block_is_ram[block];
		let isROM = this.block_is_rom[block];
		let writeable = this.write_map[block].kind;
		console.log('WRITEABLE?', writeable);
		let ROMoffset = -1;
		let RAMoffset = -1;
		if (kind === MAP_TI9x.ROM) {
			ROMoffset = offset + this.mmap[block].offset;
		}
		else if (kind === MAP_TI9x.RAM) {
			RAMoffset = offset + this.mmap[block].offset;
		}
		else {
			RAMoffset = addr;
		}

		console.log('MMAP', this.mmap[block]);
		let op = new supermapped_address(addr, this.mmap[block].kind, outaddr, isRAM, isROM, writeable, ROMoffset, RAMoffset);
		return op;

	}
}