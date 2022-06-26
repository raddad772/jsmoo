"use strict";

class SNESPPU {
	/**
	 * @param {null} canvas
	 * @param {*} version
	 * @param {snes_memmap} mem_map
	 */
	constructor(canvas, version, mem_map) {
		this.canvas = canvas;
		this.version = version;
		this.mem_map = mem_map;

		mem_map.read_ppu = this.reg_read;
		mem_map.write_ppu = this.reg_write;

		this.wram_addr = 0;
		this.wram_bank = 0x7E;

		let VRAM = new Uint8Array(0x10000);
	}

	reg_read(addr) {
		console.log('PPU read', hex0x6(addr));
		switch(addr) {
			case 0x2180: // WRAM access port
				let r = this.mem_map.dispatch_read((this.wram_bank << 16) + this.wram_addr);
				this.wram_addr++;
				if (this.wram_addr > 0x10000) {
					this.wram_addr -= 0x10000;
					this.wram_bank = (this.wram_bank === 0x7E) ? 0x7F : 0x7E;
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
		console.log('PPU write', hex0x6(addr), hex0x2(val));
		switch(addr) {
			case 0x2180: // WRAM access port
				this.mem_map.dispatch_write((this.wram_bank << 16) + this.wram_addr, val);
				this.wram_addr++;
				if (this.wram_addr > 0x10000) {
					this.wram_addr -= 0x10000;
					this.wram_bank = (this.wram_bank === 0x7E) ? 0x7F : 0x7E;
				}
				break;
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

	/**
	 * @param {SNEStiming} scanline
	 */
	steps(scanline) {

	}

}
