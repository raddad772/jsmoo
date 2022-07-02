"use strict";

class SNESPPU {
	/**
	 * @param {null} canvas
	 * @param {*} version
	 * @param {snes_memmap} mem_map
	 * @param {SNES_clock} clock
	 */
	constructor(canvas, version, mem_map, clock) {
		this.canvas = canvas;
		this.version = version;
		this.mem_map = mem_map;
		this.clock = clock;

		mem_map.read_ppu = this.reg_read.bind(this);
		mem_map.write_ppu = this.reg_write.bind(this);
		clock.set_ppu(this);

		this.wram_addr = 0;
		this.wram_bank = 0x7E0000;

		this.io = {
			vram_increment_step: 1,
			vram_mapping: 0,
			vram_increment_mode: 1,
			vram_addr: 0,

			cram_addr: 0,
			cram_addr_latch: 0,
			cram_latch: 0,
		}

		this.VRAM = new Uint16Array(0x8001); // writes to 0x8000 basically ignored
		this.CRAM = new Uint16Array(0x100);

		this.ppu_inc = [1, 32, 128, 128];
	}

	get_addr_by_map() {
		let addr = this.io.vram_addr;
		switch(this.io.vram_mapping) {
			case 0: return addr & 0x7FFF;
			case 1: return (addr & 0x7F00) | (addr << 3 & 0x00F8) | ((addr >>> 5) & 7);
			case 2: return (addr & 0x7E00) | (addr << 3 & 0x01F8) | ((addr >>> 6) & 7);
			case 3: return (addr & 0x7C00) | (addr << 3 & 0x03F8) | ((addr >>> 7) & 7);
		}
		return 0x8000;
	}

	reg_read(addr, val, have_effect= true) {
		if ((addr - 0x3F) & 0x3F) { return this.mem_map.read_apu(addr, val); }
		console.log('PPU read', hex0x6(addr));
		switch(addr) {
			case 0x2180: // WRAM access port
				let r = this.mem_map.dispatch_read(this.wram_bank + this.wram_addr, have_effect);
				if (have_effect) {
					this.wram_addr++;
					if (this.wram_addr > 0x10000) {
						this.wram_addr -= 0x10000;
						this.wram_bank = (this.wram_bank === 0x7E0000) ? 0x7F0000 : 0x7E0000;
					}
				}
				return r;
			case 0x2181: // WRAM address low
				return this.wram_addr & 0xFF;
			case 0x2182: // WRAM address high
				return (this.wram_addr & 0xFF00) >>> 8;
			case 0x2183: // WRAM address bank
				return this.wram_bank === 0x7E ? 0 : 1;
		}
		return 0x00;
	}

	/**
	 *
	 * @param {number} addr
	 * @param {number} val
	 */
	reg_write(addr, val) {
		if ((addr - 0x3F) & 0x3F) { this.mem_map.write_apu(addr, val); return; }
		console.log('PPU write', hex0x6(addr), hex0x2(val));
		let addre;
		switch(addr) {
			case 0x2115: // VRAM increment
				this.io.increment_size = this.ppu_inc[val & 3];
				this.io.vram_mapping = (val >>> 2) & 3;
				this.io.vram_increment_mode = (val >>> 7) & 1;
				return;
			case 0x2116: // VRAM address lo
				this.io.vram_addr = (this.io.vram_addr & 0xFF00) + val;
				return;
			case 0x2117: // VRAM address hi
				this.io.vram_addr = (val << 8) + (this.io.vram_addr & 0xFF);
				return;
			case 0x2118: // VRAM data lo
				addre = this.get_addr_by_map();
				this.VRAM[addre] = (this.VRAM[addre] & 0xFF00) | val;
				if (this.io.vram_increment_mode === 0) this.io.vram_addr = (this.io.vram_addr + this.io.vram_increment_step) & 0x7FFF;
				return;
			case 0x2119: // VRAM data hi
				addre = this.get_addr_by_map();
				this.VRAM[addre] = (val << 8) | (this.VRAM[addre] & 0xFF);
				if (this.io.vram_increment_mode === 0) this.io.vram_addr = (this.io.vram_addr + this.io.vram_increment_step) & 0x7FFF;
				return;
			case 0x2180: // WRAM access port
				this.mem_map.dispatch_write((this.wram_bank << 16) + this.wram_addr, val);
				this.wram_addr++;
				if (this.wram_addr > 0x10000) {
					this.wram_addr -= 0x10000;
					this.wram_bank = (this.wram_bank === 0x7E) ? 0x7F : 0x7E;
				}
				break;
			case 0x2121: // Color RAM address
				this.io.cram_addr = val;
				this.io.cram_addr_latch = 0;
				return;
			case 0x2122: // Color RAM data
				if (this.io.cram_addr_latch === 0) {
					this.io.cram_addr_latch = 1;
					this.io.cram_latch = val;
				}
				else {
					this.io.cram_addr_latch = 0;
					this.CRAM[addr] = ((val & 0x7F) << 8) | this.io.cram_latch;
				}
				return;
			case 0x2181: // WRAM addr low
				this.wram_addr = (this.wram_addr & 0xFF00) + val;
				break;
			case 0x2182: // WRAM addr med
				this.wram_addr = (val << 8) + (this.wram_addr & 0xFF);
				break;
			case 0x2183: // WRAM bank
				this.wram_bank = (val & 1) ? 0x7F: 0x7E;
				break;
		}
	}

	catch_up() {
		// We aren't actually emulating PPU yet
		this.clock.ppu_deficit = 0;
	}

}
