"use strict";

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
const MEM_NUM_BLOCKS = 0x1000;


class MMAP {
	constructor(kind, speed, offset= 0) {
		this.kind = kind;
		this.speed = speed;
		this.offset = offset;
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

		this.read_ppu = function(addr, val){};
		this.write_ppu = function(addr, data){};
		this.read_cpu = function(addr, val){};
		this.write_cpu = function(addr, data){};
		this.read_apu = function(addr, val){};
		this.write_apu = function(addr, val){};

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

	dispatch_read(addr, val, have_effect= true) {
		let b = addr >>> 12;
		let mkind = this.readmap[b].kind;
		let outaddr = this.readmap[b].offset + (addr & 0xFFF);
		//console.log('IN ADDRESS', hex0x6(addr), 'CALC ADDRESS', hex0x6(outaddr));
		//if (addr === 16379267) debugger;
		if (addr === 0x800000) debugger;
		switch(mkind) {
			case MAP_TI.OPEN_BUS:
				//console.log('OPEN BUS READ');
				return val;
			case MAP_TI.ROM:
				//console.log('ROM read', hex0x6(addr), hex0x2(this.ROM[outaddr]), hex0x6(outaddr));
				return this.ROM[outaddr];
			case MAP_TI.RAM:
				//console.log('RAM read', hex0x6(addr), hex0x2(this.ROM[outaddr]), hex0x6(outaddr));
				return this.RAM[outaddr];
			case MAP_TI.SRAM:
				//console.log('SRAM ADDDR', hex6(addr), 'OUTADDR', hex4(outaddr));
				return this.SRAM[outaddr % this.SRAMSize];
			case MAP_TI.PPU:
				//console.log('PPU read');
				return this.read_ppu(outaddr, val, have_effect);
			case MAP_TI.CPU:
				//console.log('CPU read');
				return this.read_cpu(outaddr, val, have_effect);
		}
		return val;
	};

	dispatch_write(addr, data) {
		let b = addr >>> 12;
		let mkind = this.writemap[b].kind;
		let outaddr = this.writemap[b].offset + (addr & 0xFFF);
		if (addr === 0x2104) {
			console.log('2104 HERE!', mkind, outaddr, this.writemap[b].offset, data);
		}
		switch(mkind) {
			case MAP_TI.OPEN_BUS:
				console.log('OPEN BUS WRITE');
				//debugger;
				return;
			case MAP_TI.ROM:
				console.log('ROM write!?');
				return;
			case MAP_TI.RAM:
				//console.log('RAM write', hex0x6(addr), hex0x2(data), hex0x6(outaddr));
				this.RAM[outaddr] = data;
				return;
			case MAP_TI.SRAM:
				//console.log('SRAM write');
				this.SRAM[outaddr] = data;
				return;
			case MAP_TI.PPU:
				//console.log('PPU write');
				this.write_ppu(outaddr, data);
				return;
			case MAP_TI.CPU:
				//console.log('CPU write');
				this.write_cpu(outaddr, data);
				return;
		}
	};

	// Map RAM into low pages
	map_loram(bank_start, bank_end, addr_start, addr_end, offset) {
		for (let c = bank_start; c <= bank_end; c++) {
			for (let i = addr_start; i <= addr_end; i += 0x1000) {
				let b = (c << 4) | (i >>> 12);
				this.readmap[b].kind = this.writemap[b].kind = MAP_TI.RAM;
				this.readmap[b].offset = this.writemap[b].offset = (i - addr_start) + offset;
				this.block_is_ROM[b] = false;
				this.block_is_RAM[b] = true;
			}
		}
	}

	// Map CPU, PPU, etc. regions
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

	// Map ROM into address space using LoROM method
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

	// M ap SRAM into address space
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

	// Map WRAM into address space
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

	// Map system registers and loRAM
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

	// Map SRAM into memory using LoROM scheme
	map_lorom_sram() {
		let hi;
		if (this.ROMSizebit > 11 || this.SRAMSizebit > 5)
			hi = 0x7FFF;
		else
			hi = 0xFFFF;

		// HMMM...
		hi = 0x7FFF;
		this.map_sram(0x70, 0x7D, 0x0000, hi);
		this.map_sram(0xF0, 0xFF, 0x0000, hi);
	}

	// Set the memory map up for LoROM
	setup_mem_map_lorom() {
		this.clear_map();
		this.map_system();

		this.map_lorom(0x00, 0x3F, 0x8000, 0xFFFF);
		this.map_lorom(0x40, 0x7F, 0x8000, 0xFFFF);
		this.map_lorom(0x80, 0xBF, 0x8000, 0xFFFF);
		this.map_lorom(0xC0, 0xFF, 0x8000, 0xFFFF);

		this.map_lorom_sram();
		this.map_loram(0x00, 0x3F, 0x0000, 0x1FFF, 0);
		this.map_loram(0x80, 0xBF, 0x0000, 0x1FFF, 0);
		this.map_wram(0x7E, 0x7F, 0x0000, 0xFFFF);
	}

	// Set the memory map up for HiROM
	setup_mem_map_hirom() {
		alert('No HIROM!');
	}
}
