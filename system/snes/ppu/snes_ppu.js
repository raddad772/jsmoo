"use strict";


// First go at a PPU
// R/W code should be fine, but drawing...we'll see.
const PPU_NUM_WORKERS = 4;
const PPU_USE_WORKERS = true;
const PPU_USE_BLOBWORKERS = true;

class SNES_slow_1st_PPU {
	/**
	 * @param {*} version
	 * @param {snes_memmap} mem_map
	 * @param {SNES_clock} clock
	 * @param {HTMLElement} canvas
	 */
	constructor(canvas, version, mem_map, clock) {
		this.canvas = canvas;
		this.version = version;
		this.mem_map = mem_map;
		this.clock = clock;

		mem_map.read_ppu = this.reg_read.bind(this);
		mem_map.write_ppu = this.reg_write.bind(this);
		clock.set_ppu(this);

		//this.wram_bank = 0x7E0000;

		this.window_above = new Uint8Array(256);
		this.window_below = new Uint8Array(256);

		this.light_table = [];
		for (let l = 0; l < 16; l++) {
			this.light_table[l] = new Uint16Array(32768);
			for (let r = 0; r < 32; r++) {
				for (let g = 0; g < 32; g++) {
					for (let b = 0; b < 32; b++) {
						let luma = l / 15.0;
						let ar = Math.floor(luma * r + 0.5);
						let ag = Math.floor(luma * g + 0.5);
						let ab = Math.floor(luma * b + 0.5)
						this.light_table[l][(r << 10) | (g << 5) | b] = ((ab << 10) | (ag << 5) | (ar));
					}
				}
			}
		}

		this.above = [];
		this.below = [];
		for (let i = 0; i < (256 * 9); i++) {
			this.above[i] = new PPU_pixel();
			this.below[i] = new PPU_pixel();
		}

		this.output = new Uint16Array(512 * 512);

		this.latch = {
			ppu1: {
				mdr: 0,
				bgofs: 0
			},
			ppu2: {
				mdr: 0,
				bgofs: 0
			},

			interlace: 0,
			overscan: 0,
			hires: 0,
			hd: 0,
			ss: 0,
			vram: 0,
			oam: 0,

			oam_addr: 0,
			cgram: 0,
			cgram_addr: 0,

			mode7: 0,
			counters: 0,
			hcounter: 0,
			vcounter: 0,
		}

		this.io = {
			oam_addr: 0,
			oam_base_addr: 0,
			oam_priority: 0,

			vram_increment_step: 1,
			vram_mapping: 0,
			vram_increment_mode: 1,
			vram_addr: 0,

			cgram_addr: 0
		}

		this.VRAM = new Uint16Array(0x8001); // writes to 0x8000 basically ignored
		this.CGRAM = new Uint16Array(0x100);
		this.OAM = new Uint8Array(544);
		this.bg_line = new Uint8Array(256 * 3);
		this.sprite_line = new Uint8Array(256 * 3);
		this.objects = [];
		for (let i = 0; i < 128; i++) {
			this.objects.push(new PPU_object());
		}

		this.ppu_inc = [1, 32, 128, 128];

		this.cachelines = new PPU_multithreaded_cache(this.present.bind(this));
		this.cache = this.cachelines.getl();
	}

	present(buf=null) {
		//console.log('present!', buf === null);
		if (buf === null) debugger;
		if (buf === null) buf = this.output;
		//this.workers[0].postMessage({worker_num: 0, say: 'hi'});
		//console.log('PRESENTING!!!!');
		/*for (let i in this.output) {
			if (this.output[i] !== 0) {
				console.log('NONZERO OUTPUT AT', (i % 256), Math.floor(i / 256));
			}
		}*/
		let ctx = this.canvas.getContext('2d');
		let imgdata = ctx.getImageData(0, 0, 256, 224);
		for (let y = 0; y < 224; y++) {
			for (let x = 0; x < 256; x++) {
				let di = (y * 256 * 4) + (x * 4);
				let ppui = (y * 256) + x;
				let ppuo = buf[ppui];
				/*if (ppuo !== 0) {
					console.log('NOn-ZERO PPUO AT', x, y, ppuo);
				}*/
				imgdata.data[di] = (ppuo & 0x7C00) >>> 7;
				imgdata.data[di+1] = (ppuo & 0x3E0) >>> 2;
				imgdata.data[di+2] = (ppuo & 0x1F) << 3;
				imgdata.data[di+3] = 255;
			}
		}
		ctx.putImageData(imgdata, 0, 0);
	}

	get_addr_by_map() {
		let addr = this.io.vram_addr;
		switch(this.io.vram_mapping) {
			case 0: return addr;
			case 1:
				return (addr & 0x7F00) | ((addr << 3) & 0x00F8) | ((addr >>> 5) & 7);
			case 2:
				return (addr & 0x7E00) | ((addr << 3) & 0x01F8) | ((addr >>> 6) & 7);
			case 3:
				return (addr & 0x7C00) | ((addr << 3) & 0x03F8) | ((addr >>> 7) & 7);
		}
		return 0x8000;
	}

	mode7_mul() {
		return mksigned16(this.cache.mode7.a) * mksigned8(this.cache.mode7.b >> 8);
		//return ((this.cache.mode7.a & 0xFFFF) * ((this.cache.mode7.b >>> 8) & 0xFF));
	}

	reg_read(addr, val, has_effect= true) {
		//if ((addr - 0x3F) & 0x3F) { return this.mem_map.read_apu(addr, val); }
		if (addr >= 0x2140 && addr < 0x217F) { return this.mem_map.read_apu(addr, val, has_effect); }
		let addre, result;
		//console.log('PPU read', hex0x6(addr));
		switch(addr) {
			case 0x2134: // MPYL
				result = this.mode7_mul();
				return result & 0xFF;
			case 0x2135: // MPYM
				result = this.mode7_mul();
				return (result >> 8) & 0xFF;
			case 0x2136: // MPYH
				result = this.mode7_mul();
				return (result >> 16) & 0xFF;
			case 0x2137: // SLHV?
				if (snes.cpu.io.pio & 0x80) snes.cpu.latch_ppu_counters();
				return val;
			case 0x2138: // OAMDATAREAD
				let data = this.OAM_read(this.cache.oam_addr);
				this.cache.oam_addr = (this.cache.oam_addr + 1) & 0x3FF;
				this.set_first_obj();
				return data;
			case 0x2139: // VMDATAREADL
				result = this.latch.vram & 0xFF;
				if (this.io.vram_increment_mode === 0) {
					this.latch.vram = this.VRAM[this.get_addr_by_map()];
					this.io.vram_addr = (this.io.vram_addr + this.io.vram_increment_step) & 0x7FFF;
				}
				return result;
			case 0x213A: // VMDATAREADH
				result = (this.latch.vram >>> 8) & 0xFF;
				if (this.io.vram_increment_mode === 1) {
					this.latch.vram = this.VRAM[this.get_addr_by_map()];
					this.io.vram_addr = (this.io.vram_addr + this.io.vram_increment_step) & 0x7FFF;
				}
				return result;
			case 0x213D: // OPVCT
				if (this.latch.vcounter === 0) {
					this.latch.vcounter = 1;
					this.latch.ppu2.mdr = this.clock.scanline.ppu_y;
				} else {
					this.latch.vcounter = 0;
					this.latch.ppu2.mdr = (this.clock.scanline.ppu_y >>> 8) | (this.latch.ppu2.mdr & 0xFE);
				}
				return this.latch.ppu2.mdr;
			case 0x213E: // STAT77
				this.latch.ppu1.mdr = 1 | (this.cache.obj.range_over << 6) | (this.cache.obj.time_over << 7);
				return this.latch.ppu1.mdr;
			case 0x213F:
				this.latch.hcounter = 0;
				this.latch.vcounter = 0;
				this.latch.ppu2.mdr &= 32;
				this.latch.ppu2.mdr |= 0x03 | (this.clock.scanline.frame << 7);
				if (!(snes.cpu.io.pio & 0x80)) {
					this.latch.ppu2.mdr |= 1 << 6;
				} else {
					this.latch.ppu2.mdr |= this.latch.counters << 6;
					this.latch.counters = 0;
				}
				return this.latch.ppu2.mdr;
			case 0x2180: // WRAM access port
				let r = this.mem_map.dispatch_read(0x7E0000 | this.io.wram_addr, has_effect);
				if (has_effect) {
					this.io.wram_addr++;
					if (this.io.wram_addr > 0x1FFFF) this.io.wram_addr = 0;
					/*if (this.wram_addr > 0x10000) {
						this.wram_addr -= 0x10000;
						this.wram_bank = (this.wram_bank === 0x7E0000) ? 0x7F0000 : 0x7E0000;
					}*/
				}
				return r;
			/*case 0x2181: // WRAM address low
				return this.wram_addr & 0xFF;
			case 0x2182: // WRAM address high
				return (this.wram_addr & 0xFF00) >>> 8;
			case 0x2183: // WRAM address bank
				return this.wram_bank === 0x7E ? 0 : 1;*/
			default:
				console.log('UNIMPLEMENTED PPU READ FROM', hex4(addr), hex2(val));
				return val;
		}
	}

	set_first_obj() {
		this.cache.obj.first = this.cache.oam_priority ? (this.cache.oam_addr >>> 2) & 0x7F : 0;
	}

	OAM_read(addr) {
		let val = 0;
		let n;
		if (!(addr & 0x200)) {
			n = addr >>> 2;
			addr &= 3;
			switch(addr) {
				case 0:
					return this.objects[n].x & 0xFF;
				case 1:
					return this.objects[n].y & 0xFF;
				case 2:
					return this.objects[n].character;
			}
			return (this.objects[n].nameselect) | (this.objects[n].palette << 1) | (this.objects[n].priority << 4) | (this.objects[n].hflip << 6) | (this.objects[n].vflip << 7);
		} else {
			n = (addr & 0x1F) << 2;
			return (this.objects[n].x >>> 8) |
				((this.objects[n+1].x >>> 8) << 2) |
				((this.objects[n+2].x >>> 8) << 4) |
				((this.objects[n+3].x >>> 8) << 6) |
				(this.objects[n].size << 1) |
				(this.objects[n+1].size << 3) |
				(this.objects[n+2].size << 5) |
				(this.objects[n+3].size << 7);
		}
	}

	OAM_write(addr, val) {
		if (!this.clock.scanline.vblank && !this.clock.scanline.fblank) {
			console.log('SKIP OAM');
			return;
		}
		let n;
		//console.log('OAM WRITE', hex2(addr), hex2(val));
		this.OAM[addr] = val;
		if (!(addr & 0x200)) {
			n = addr >>> 2; // object #
			addr &= 3;
			switch(addr) {
				case 0:
					this.objects[n].x = (this.objects[n].x & 0x100) | val;
					return;
				case 1:
					this.objects[n].y = val + 1;
					return;
				case 2:
					this.objects[n].character = val;
					return;
			}
			this.objects[n].nameselect = val & 1;
			this.objects[n].palette = (val >>> 1) & 7;
			this.objects[n].priority = (val >>> 4) & 3;
			this.objects[n].hflip = (val >>> 6) & 1;
			this.objects[n].vflip = (val >>> 7) & 1;
		} else {
			if (addr >= 544) {
				 console.log('GOT OVER 544 HERE!');
				 //return;
			}
			n = (addr & 0x1F) << 2; // object #.... PPU is weird
			this.objects[n].x = (this.objects[n].x & 0xFF) | ((val << 8) & 0x100);
			this.objects[n+1].x = (this.objects[n+1].x & 0xFF) | ((val << 6) & 0x100);
			this.objects[n+2].x = (this.objects[n+2].x & 0xFF) | ((val << 4) & 0x100);
			this.objects[n+3].x = (this.objects[n+3].x & 0xFF) | ((val << 2) & 0x100);
			this.objects[n].size = (val >>> 1) & 1;
			this.objects[n+1].size = (val >>> 3) & 1;
			this.objects[n+2].size = (val >>> 5) & 1;
			this.objects[n+3].size = (val >>> 7) & 1;
			//console.log('OBJECT', addr, hex4(addr), n, hex2(val), this.objects[n].size);
		}
	}

	update_video_mode() {
		this.clock.scanline.bottom_scanline = this.cache.overscan ? 240 : 225;
		switch(this.cache.bg_mode) {
			case 0:
				this.cache.bg1.tile_mode = PPU_tile_mode.BPP2;
				this.cache.bg2.tile_mode = PPU_tile_mode.BPP2;
				this.cache.bg3.tile_mode = PPU_tile_mode.BPP2;
				this.cache.bg4.tile_mode = PPU_tile_mode.BPP2;
				this.cache.bg1.priority = [8, 11];
				this.cache.bg2.priority = [7, 10];
				this.cache.bg3.priority = [2, 5];
				this.cache.bg4.priority = [1, 4];
				this.cache.obj.priority = [3, 6, 9, 12];
				break;
			case 1:
				this.cache.bg1.tile_mode = PPU_tile_mode.BPP4;
				this.cache.bg2.tile_mode = PPU_tile_mode.BPP4;
				this.cache.bg3.tile_mode = PPU_tile_mode.BPP2;
				this.cache.bg4.tile_mode = PPU_tile_mode.Inactive;
				if (this.cache.bg_priority) {
					this.cache.bg1.priority = [5, 8];
					this.cache.bg2.priority = [4, 7];
					this.cache.bg3.priority = [1, 10];
					this.cache.obj.priority = [2, 3, 6, 9];
				} else {
					this.cache.bg1.priority = [6, 9];
					this.cache.bg2.priority = [5, 8];
					this.cache.bg3.priority = [1, 3];
					this.cache.obj.priority = [2, 4, 7, 10];
				}
				break;
			case 2:
				this.cache.bg1.tile_mode = PPU_tile_mode.BPP4;
				this.cache.bg2.tile_mode = PPU_tile_mode.BPP4;
				this.cache.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg1.priority = [6, 9];
				this.cache.bg2.priority = [5, 8];
				this.cache.obj.priority = [2, 4, 7, 10];
				break;
			case 3:
				this.cache.bg1.tile_mode = PPU_tile_mode.BPP8;
				this.cache.bg2.tile_mode = PPU_tile_mode.BPP4;
				this.cache.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg1.priority = [3, 7];
				this.cache.bg2.priority = [1, 5];
				this.cache.obj.priority = [2, 4, 6, 8];
				break;
			case 4:
				this.cache.bg1.tile_mode = PPU_tile_mode.BPP8;
				this.cache.bg2.tile_mode = PPU_tile_mode.BPP2;
				this.cache.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg1.priority = [3, 7];
				this.cache.bg2.priority = [1, 5];
				this.cache.obj.priority = [2, 4, 6, 8];
				break;
			case 5:
				this.cache.bg1.tile_mode = PPU_tile_mode.BPP4;
				this.cache.bg2.tile_mode = PPU_tile_mode.BPP2;
				this.cache.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg1.priority = [3, 7];
				this.cache.bg2.priority = [1, 5];
				this.cache.obj.priority = [2, 4, 6, 8];
				break;
			case 6:
				this.cache.bg1.tile_mode = PPU_tile_mode.BPP4;
				this.cache.bg2.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.cache.bg1.priority = [2, 5];
				this.cache.obj.priority = [1, 3, 4, 6];
				break;
			case 7:
				if (!this.cache.extbg) {
					this.cache.bg1.tile_mode = PPU_tile_mode.Mode7;
					this.cache.bg2.tile_mode = PPU_tile_mode.Inactive;
					this.cache.bg3.tile_mode = PPU_tile_mode.Inactive;
					this.cache.bg4.tile_mode = PPU_tile_mode.Inactive;
					this.cache.bg1.priority = [2];
					this.cache.obj.priority = [1, 3, 4, 5];
				} else {
					this.cache.bg1.tile_mode = PPU_tile_mode.Mode7;
					this.cache.bg2.tile_mode = PPU_tile_mode.Mode7;
					this.cache.bg3.tile_mode = PPU_tile_mode.Inactive;
					this.cache.bg4.tile_mode = PPU_tile_mode.Inactive;
					this.cache.bg1.priority = [3];
					this.cache.bg2.priority = [1, 5];
					this.cache.obj.priority = [2, 4, 6, 7];
				}
				break;
		}
	}

	/**
	 *
	 * @param {number} addr
	 * @param {number} val
	 */
	reg_write(addr, val) {
		//if ((addr - 0x3F) & 0x3F) { this.mem_map.write_apu(addr, val); return; }
		if (addr >= 0x2140 && addr < 0x217F) { this.mem_map.write_apu(addr, val); return; }
		//console.log('PPU write', hex0x4(addr), hex0x2(val));
		let addre, latchbit;
		switch(addr) {
			case 0x2100: // INIDISP
				this.cache.display_brightness = val & 15;
				this.cache.display_disable = (val >>> 7) & 1;
				this.clock.set_fblank(this.cache.display_disable);
				break;
			case 0x2101: // OBSEL
				this.cache.obj.base_size = (val >>> 5) & 7;
				this.cache.obj.name_select = (val >>> 3) & 3;
				this.cache.obj.tile_addr = (val << 13) & 0x6000;
				return;
			case 0x2102: // OAMADDL
				this.cache.oam_base_addr = (this.cache.oam_base_addr & 0xFE00) | (val << 1);

				this.cache.oam_addr = this.cache.oam_base_addr;
				this.set_first_obj();
				return;
			case 0x2103: // OAMADDH
				this.cache.oam_base_addr = (val & 1) << 9 | (this.cache.oam_base_addr & 0x01FE);
				this.cache.oam_priority = (val >>> 7) & 1;
				this.cache.oam_addr = this.cache.oam_base_addr;
				this.set_first_obj();
				return;
			case 0x2104: // OAMDATA
				latchbit = this.cache.oam_addr & 1;
				addre = this.cache.oam_addr;
				this.cache.oam_addr = (this.cache.oam_addr + 1) & 0x3FF;
				if (latchbit === 0) this.latch.oam = val;
				//console.log('OAM WRITE', hex4(addre))
				if (addre & 0x200) {
					this.OAM_write(addre, val);
				}
				else if (latchbit === 1) {
					this.OAM_write((addre & 0xFFFE), this.latch.oam);
					this.OAM_write((addre & 0xFFFE) + 1, val);
				}
				this.set_first_obj();
				return;
			case 0x2105: // BGMODE
				this.cache.bg_mode = val & 7;
				this.cache.bg_priority = (val >>> 3) & 1;
				this.cache.bg1.tile_size = (val >>> 4) & 1;
				this.cache.bg2.tile_size = (val >>> 5) & 1;
				this.cache.bg3.tile_size = (val >>> 6) & 1;
				this.cache.bg4.tile_size = (val >>> 7) & 1;
				this.update_video_mode();
				return;
			case 0x2106: // MOSAIC
				// NOT IMPLEMENT
				latchbit = this.cache.bg1.mosaic_enable || this.cache.bg2.mosaic_enable || this.cache.bg3.mosaic_enable || this.cache.bg4.mosaic_enable;
				this.cache.bg1.mosaic_enable = val & 1;
				this.cache.bg2.mosaic_enable = (val >>> 1) & 1;
				this.cache.bg3.mosaic_enable = (val >>> 1) & 1;
				this.cache.bg4.mosaic_enable = (val >>> 1) & 1;
				this.cache.mosaic.size = ((val >>> 4) & 15) + 1;
				if (!latchbit && (val & 15)) {
					this.cache.mosaic.counter = this.cache.mosaic.size + 1;
				}
				return;
			case 0x2107: // BG1SC
				this.cache.bg1.screen_size = val & 3;
				this.cache.bg1.screen_addr = (val << 8) & 0x7C00;
				return;
			case 0x2108: // BG2SC
				this.cache.bg2.screen_size = val & 3;
				this.cache.bg2.screen_addr = (val << 8) & 0x7C00;
				return;
			case 0x2109: // BG3SC
				this.cache.bg3.screen_size = val & 3;
				this.cache.bg3.screen_addr = (val << 8) & 0x7C00;
				return;
			case 0x210A: // BG4SC
				this.cache.bg4.screen_size = val & 3;
				this.cache.bg4.screen_addr = (val << 8) & 0x7C00;
				return;
			case 0x210B: // BG12NBA
				this.cache.bg1.tiledata_addr = (val << 12) & 0x7000;
				this.cache.bg2.tiledata_addr = (val << 8) & 0x7000;
				return;
			case 0x210C: // BG34NBA
				this.cache.bg3.tiledata_addr = (val << 12) & 0x7000;
				this.cache.bg4.tiledata_addr = (val << 8) & 0x7000;
				return;
			case 0x210D: // BG1HOFS
				this.cache.bg1.hoffset = (val << 8) | (this.latch.ppu1.bgofs & 0xF8) | (this.latch.ppu2.bgofs & 7);
				this.latch.ppu1.bgofs = this.latch.ppu2.bgofs = val;

				this.cache.mode7.hoffset = (val << 8) | (this.latch.mode7);
				this.latch.mode7 = val;
				this.cache.mode7.rhoffset = mksigned13(this.cache.mode7.hoffset);
				return;
			case 0x210E: // BG1VOFS
				this.cache.bg1.voffset = (val << 8) | (this.latch.ppu1.bgofs);
				this.latch.ppu1.bgofs = val;

				this.cache.mode7.voffset = (val << 8) | (this.latch.mode7);
				this.latch.mode7 = val;
				this.cache.mode7.rvoffset = mksigned13(this.cache.mode7.voffset);
				return;
			case 0x210F: // BG2HOFS
				this.cache.bg2.hoffset = (val << 8) | (this.latch.ppu1.bgofs & 0xF8) | (this.latch.ppu2.bgofs & 7);
				this.latch.ppu1.bgofs = this.latch.ppu2.bgofs = val;
				return;
			case 0x2110: // BG2VOFS
				this.cache.bg2.voffset = (val << 8) | (this.latch.ppu1.bgofs);
				this.latch.ppu1.bgofs = val;
				return;
			case 0x2111: // BG3HOFS
				this.cache.bg3.hoffset = (val << 8) | (this.latch.ppu1.bgofs & 0xF8) | (this.latch.ppu2.bgofs & 7);
				this.latch.ppu1.bgofs = this.latch.ppu2.bgofs = val;
				return;
			case 0x2112: // BG3VOFS
				this.cache.bg3.voffset = (val << 8) | (this.latch.ppu1.bgofs);
				this.latch.ppu1.bgofs = val;
				return;
			case 0x2113: // BG4HOFS
				this.cache.bg4.hoffset = (val << 8) | (this.latch.ppu1.bgofs & 0xF8) | (this.latch.ppu2.bgofs & 7);
				this.latch.ppu1.bgofs = this.latch.ppu2.bgofs = val;
				return;
			case 0x2114: // BG4VOFS
				this.cache.bg4.voffset = (val << 8) | (this.latch.ppu1.bgofs);
				this.latch.ppu1.bgofs = val;
				return;
			case 0x2115: // VRAM increment
				this.io.vram_increment_step = this.ppu_inc[val & 3];
				this.io.vram_mapping = (val >>> 2) & 3;
				this.io.vram_increment_mode = (val >>> 7) & 1;
				return;
			case 0x2116: // VRAM address lo
				this.io.vram_addr = (this.io.vram_addr & 0xFF00) + val;
				this.latch.vram = this.VRAM[this.get_addr_by_map()];
				return;
			case 0x2117: // VRAM address hi
				this.io.vram_addr = (val << 8) + (this.io.vram_addr & 0xFF);
				this.latch.vram = this.VRAM[this.get_addr_by_map()];
				return;
			case 0x2118: // VRAM data lo
				if (!this.clock.scanline.vblank && !this.clock.scanline.fblank) return;
				addre = this.get_addr_by_map();
				this.VRAM[addre] = (this.VRAM[addre] & 0xFF00) | val;
				if (this.io.vram_increment_mode === 0) this.io.vram_addr = (this.io.vram_addr + this.io.vram_increment_step) & 0x7FFF;
				//console.log('PPU write to lo', hex4(addre), hex2(val));
				return;
			case 0x2119: // VRAM data hi
				if (!this.clock.scanline.vblank && !this.clock.scanline.fblank) return;
				addre = this.get_addr_by_map();
				this.VRAM[addre] = (val << 8) | (this.VRAM[addre] & 0xFF);
				if (this.io.vram_increment_mode === 1) this.io.vram_addr = (this.io.vram_addr + this.io.vram_increment_step) & 0x7FFF;
				return;
			case 0x211A: // M7SEL
				this.cache.mode7.hflip = val & 1;
				this.cache.mode7.vflip = (val >>> 1) & 1;
				this.cache.mode7.repeat = (val >>> 6) & 3;
				return;
			case 0x211B: // M7A
				this.cache.mode7.a = mksigned16((val << 8) | this.latch.mode7);
				this.latch.mode7 = val;
				return;
			case 0x211C: // M7B
				this.cache.mode7.b = mksigned16((val << 8) | this.latch.mode7);
				this.latch.mode7 = val;
				return;
			case 0x211D: // M7C
				this.cache.mode7.c = mksigned16((val << 8) | this.latch.mode7);
				this.latch.mode7 = val;
				return;
			case 0x211E: // M7D
				this.cache.mode7.d = mksigned16((val << 8) | this.latch.mode7);
				this.latch.mode7 = val;
				return;
			case 0x211F: // M7E
				this.cache.mode7.x = (val << 8) | this.latch.mode7;
				this.cache.mode7.rx = mksigned13(this.cache.mode7.x);
				this.latch.mode7 = val;
				return;
			case 0x2120: // M7F
				this.cache.mode7.y = (val << 8) | this.latch.mode7;
				this.cache.mode7.ry = mksigned13(this.cache.mode7.y);
				this.latch.mode7 = val;
				return;
			case 0x2121: // Color RAM address
				this.io.cgram_addr = val;
				this.latch.cgram_addr = 0;
				return;
			case 0x2122: // Color RAM data
				if (this.latch.cgram_addr === 0) {
					this.latch.cgram_addr = 1;
					this.latch.cgram = val;
				}
				else {
					this.latch.cgram_addr = 0;
					this.CGRAM[this.io.cgram_addr] = ((val & 0x7F) << 8) | this.latch.cgram;
					//console.log('CRAM WRITE', hex2(this.io.cgram_addr), hex2(val));
					this.io.cgram_addr = (this.io.cgram_addr + 1) & 0xFF;
				}
				return;
			case 0x2123: // W12SEL
				this.cache.bg1.window.one_invert = val  & 1;
				this.cache.bg1.window.one_enable = (val >>> 1) & 1;
				this.cache.bg1.window.two_invert = (val >>> 2) & 1;
				this.cache.bg1.window.two_enable = (val >>> 3) & 1;
				this.cache.bg2.window.one_invert = (val >>> 4)  & 1;
				this.cache.bg2.window.one_enable = (val >>> 5) & 1;
				this.cache.bg2.window.two_invert = (val >>> 6) & 1;
				this.cache.bg2.window.two_enable = (val >>> 7) & 1;
				return;
			case 0x2124: // W34SEL
				this.cache.bg3.window.one_invert = val  & 1;
				this.cache.bg3.window.one_enable = (val >>> 1) & 1;
				this.cache.bg3.window.two_invert = (val >>> 2) & 1;
				this.cache.bg3.window.two_enable = (val >>> 3) & 1;
				this.cache.bg4.window.one_invert = (val >>> 4)  & 1;
				this.cache.bg4.window.one_enable = (val >>> 5) & 1;
				this.cache.bg4.window.two_invert = (val >>> 6) & 1;
				this.cache.bg4.window.two_enable = (val >>> 7) & 1;
				return;
			case 0x2125: // WOBJSEL
				this.cache.obj.window.one_invert = val & 1;
				this.cache.obj.window.one_enable = (val >>> 1) & 1;
				this.cache.obj.window.two_invert = (val >>> 2) & 1;
				this.cache.obj.window.two_enable = (val >>> 3) & 1;
				this.cache.col.window.one_invert = (val >>> 4) & 1;
				this.cache.col.window.one_enable = (val >>> 5) & 1;
				this.cache.col.window.two_invert = (val >>> 6) & 1;
				this.cache.col.window.two_enable = (val >>> 7) & 1;
				return;
			case 0x2126: // WH0
				//if (dbg.log_windows) console.log('WINDOW ONE LEFT WRITE', val);
				//this.cache.window.one_left = 0;
				this.cache.window.one_left = val;
				return;
			case 0x2127: // WH1...
				//if (val === 128) debugger;
				//if (dbg.log_windows) console.log('WINDOW ONE RIGHT WRITE', val);
				this.cache.window.one_right = val;
				//this.cache.window.one_right = 256;
				return;
			case 0x2128: // WH2
				this.cache.window.two_left = val;
				return;
			case 0x2129: // WH3
				this.cache.window.two_right = val;
				return;
			case 0x212A: // WBGLOG
				this.cache.bg1.window.mask = val & 3;
				this.cache.bg2.window.mask = (val >>> 2) & 3;
				this.cache.bg3.window.mask = (val >>> 4) & 3;
				this.cache.bg4.window.mask = (val >>> 6) & 3;
				return;
			case 0x212B: // WOBJLOG
				this.cache.obj.window.mask = val & 3;
				this.cache.col.window.mask = (val >>> 2) & 3;
				return;
			case 0x212C: // TM
				this.cache.bg1.above_enable = val & 1;
				this.cache.bg2.above_enable = (val >>> 1) & 1;
				this.cache.bg3.above_enable = (val >>> 2) & 1;
				this.cache.bg4.above_enable = (val >>> 3) & 1;
				this.cache.obj.above_enable = (val >>> 4) & 1;
				return;
			case 0x212D: // TS
				this.cache.bg1.below_enable = val & 1;
				this.cache.bg2.below_enable = (val >>> 1) & 1;
				this.cache.bg3.below_enable = (val >>> 2) & 1;
				this.cache.bg4.below_enable = (val >>> 3) & 1;
				this.cache.obj.below_enable = (val >>> 4) & 1;
				return;
			case 0x212E: // TMW
				this.cache.bg1.window.above_enable = val & 1;
				this.cache.bg2.window.above_enable = (val >>> 1) & 1;
				this.cache.bg3.window.above_enable = (val >>> 2) & 1;
				this.cache.bg4.window.above_enable = (val >>> 3) & 1;
				this.cache.obj.window.above_enable = (val >>> 4) & 1;
				return;
			case 0x212F: // TSW
				this.cache.bg1.window.below_enable = val & 1;
				this.cache.bg2.window.below_enable = (val >>> 1) & 1;
				this.cache.bg3.window.below_enable = (val >>> 2) & 1;
				this.cache.bg4.window.below_enable = (val >>> 3) & 1;
				this.cache.obj.window.below_enable = (val >>> 4) & 1;
				return;
			case 0x2130: // CGWSEL
				this.cache.col.direct_color = val & 1;
				this.cache.col.blend_mode = (val >>> 1) & 1;
				this.cache.col.window.below_mask = (val >>> 4) & 3;
				this.cache.col.window.above_mask = (val >>> 6) & 3;
				return;
			case 0x2131: // CGADDSUB
				this.cache.col.enable[PPU_source.BG1] = val & 1;
				this.cache.col.enable[PPU_source.BG2] = (val >>> 1) & 1;
				this.cache.col.enable[PPU_source.BG3] = (val >>> 2) & 1;
				this.cache.col.enable[PPU_source.BG4] = (val >>> 3) & 1;
				this.cache.col.enable[PPU_source.OBJ1] = 0;
				this.cache.col.enable[PPU_source.OBJ2] = (val >>> 4) & 1;
				this.cache.col.enable[PPU_source.COL] = (val >>> 5) & 1;
				this.cache.col.halve = (val >>> 6) & 1;
				this.cache.col.math_mode = (val >>> 7) & 1;
				return;
			case 0x2132: // COLDATA weirdness
				if (val & 0x20) this.cache.col.fixed_color = (this.cache.col.fixed_color & 0x7FE0) | (val & 31);
				if (val & 0x40) this.cache.col.fixed_color = (this.cache.col.fixed_color & 0x7C1F) | ((val & 31) << 5);
				if (val & 0x80) this.cache.col.fixed_color = (this.cache.col.fixed_color & 0x3FF) | ((val & 31) << 10);
				return;
			case 0x2133: // SETINI
				this.cache.interlace = val & 1;
				this.cache.obj.interlace = (val >>> 1) & 1;
				this.cache.overscan = (val >>> 2) & 1;
				this.cache.pseudo_hires = (val >>> 3) & 1;
				this.cache.extbg = (val >>> 6) & 1;
				this.update_video_mode();
				return;

			case 0x2180: // WRAM access port
				this.mem_map.dispatch_write(0x7E0000 | this.io.wram_addr++, val);
				if (this.io.wram_addr > 0x1FFFF) this.io.wram_addr = 0;
				return;
			case 0x2181: // WRAM addr low
				this.io.wram_addr = (this.io.wram_addr & 0xFFF00) + val;
				return;
			case 0x2182: // WRAM addr med
				this.io.wram_addr = (val << 8) + (this.io.wram_addr & 0xF00FF);
				return;
			case 0x2183: // WRAM bank
				this.io.wram_addr = ((val & 1) << 16) | (this.io.wram_addr & 0xFFFF);
				return;
			default:
				console.log('UNIMPLEMENTED PPU WRITE TO', hex4(addr), hex2(val));
				return;
		}
	}

	render_sprites_from_memory(y_origin, x_origin, builtin_color) {
		console.log('THESE OBJECTS', this.objects);
		let ctx = this.canvas.getContext('2d');
		let imgdata = ctx.getImageData(x_origin, y_origin, 256, 224);
		for (let sy = 1; sy < 240; sy++) {
			for (let sx = 0; sx < 256; sx++) {
				let addr = (sy * 256 * 4) + (sx * 4);
				imgdata.data[addr] = 0;
				imgdata.data[addr+1] = 0;
				imgdata.data[addr+2] = 0;
				imgdata.data[addr+3] = 255;
			}
		}

		let widths = [8, 16];
		let heights = [8, 16];
		switch(this.cache.obj.base_size) {
			case 0:
				break;
			case 1:
				widths[1] = heights[1] = 32;
				break;
			case 2:
				widths[1] = heights[1] = 64;
				break;
			case 3:
				widths = [16, 32];
				heights = [16, 32];
				break;
			case 4:
				widths = [16, 64];
				heights = [16, 64];
				break;
			case 5:
				widths = [32, 64];
				heights = [32, 64];
				break;
			case 6:
				widths = [16, 32];
				heights = [32, 64];
				break;
			case 7:
				widths = [16, 32];
				heights = [32, 32];
				break;
		}
		for (let n = 0; n < 128; n++) {
			let tile_width = 1;
			let tile_height = 1;
			let obj = this.objects[n];
			if ((obj.x > 256 && ((obj.x + 16) < 512))) continue;
			if (obj.y === 241) continue;
			//console.log('DRAWING SPRITE #', n, obj.x, obj.y);

			let obj_width = widths[obj.size];
			let obj_height = heights[obj.size];
			//console.log('HEIGHT AND WIDTH:', this.cache.obj.base_size, obj.size, obj_height, obj_width);

			for (let sy = y_origin; sy < (y_origin + obj_height); sy++) {
				if ((sy === 0) || ((sy & 255) > this.clock.scanline.bottom_scanline)) continue;
				for (let sx = x_origin; sx < (x_origin + obj_width); sx++) {
					// rsx, rsy are our "real X/Y positions" as far as SNES is concerned
					let rsx = ((sx - x_origin) + obj.x) & 511;
					let rsy = ((sy - y_origin) + obj.y) & 255;
					if (rsx > 255) continue;
					// Position inside sprite
					let sprite_x = (sx - x_origin);
					let sprite_y = (sy - y_origin);
					// Which tile #
					let tile_x = sprite_x >>> 3;
					let tile_y = sprite_y >>> 3;


					// itcan use tile 00-FF
					// it will wrap around
					// In memory, every 8 pixels of X, addr goes up by 1. but warps 0x0F

					let addr = obj.character + (obj.nameselect ? 0 : 0x100);
					let addr_lo = ((addr & 0x0F) + tile_x) & 0x0F;
					let addr_hi = ((addr & 0xF0) + (tile_y << 4)) & 0xF0;
					addr += addr_lo + addr_hi + this.cache.obj.tile_addr;

					// Now addr is the address of the character #
					let tile_in_x = (sprite_x % 8);
					let tile_in_y = (sprite_y % 8);
					// Add 2 to y for each
					addr += (tile_in_y * 2);

					let data = this.VRAM[addr] + (this.VRAM[addr+8] << 16);
					let shift = tile_in_x;
					let bp0 = (data >>> shift) & 1;
					bp0 += (data >>> (shift + 7)) & 2;
					bp0 += (data >>> (shift + 14)) & 4;
					bp0 += (data >>> (shift + 21)) & 8;
					//console.log('BP0', bp0);

					let oaddr = ((sy - y_origin + obj.y) * 256 * 4) + ((sx - x_origin + obj.x) * 4);
					//console.log('plotting white at', sx - x_origin + obj.x, sy - y_origin + obj.y);
					imgdata.data[oaddr] = 0xFF;
					imgdata.data[oaddr+1] = 0xFF;
					imgdata.data[oaddr+2] = 0xFF;
					imgdata.data[oaddr+3] = 0xFF;
				}
			}

			let addr = this.cache.obj.name_select << 14;

		}
		ctx.putImageData(imgdata, x_origin, y_origin);
	}

	/**
	 * @param {number} y_origin
	 * @param {number} x_origin
	 * @param {PPU_bg} bg
	 */
	render_bg1_from_memory(y_origin, x_origin, bg) {
		// Grab raw buffer
		let ctx = this.canvas.getContext('2d');
		let imgdata = ctx.getImageData(x_origin, y_origin, 256, 224);
		console.log('PPU INFO: BG MODE', this.cache.bg_mode);
		console.log('size', bg.tile_size);
		console.log('BPP', PPU_BPPBACK[bg.tile_mode]);
		console.log('h, v scrolls', bg.hoffset, bg.voffset);
		let tile_mask = 0xFFF >>> bg.tile_mode;
		let tiledata_index = bg.tiledata_addr >>> (3 + bg.tile_mode);
		let color_shift = 3 + bg.tile_mode;
		let tile_height = 3 + bg.tile_size;
		let hires = +(this.cache.bg_mode === 5 || this.cache.bg_mode === 6);
		let tile_width = !hires ? tile_height : 4;
		/*let tile_map = '';
		// 33x33 text (with \n at end of each line), cells are 3 wide.
		for (let y = 0; y < 33; y++) {
			for (let x = 0; x < 33; x++) {
				tile_map += '.. '
			}
			tile_map += '\n';
		}*/


		let hoffset = 0;
		let voffset = 0;
		for (let sy = 0; sy < 224; sy++) {
			for (let sx = 0; sx < 256; sx++) {
				let di = (sy * 256 * 4) + (sx * 4);
				let R = 0;
				let G = 0;
				let B = 0;

				let tile_number = PPUF_get_tile(this.VRAM, this.cache, bg, sx, sy)
				let mirror_x = tile_number & 0x8000 ? 7 : 0;
				let mirror_y = tile_number & 0x4000 ? 7 : 0;
				let tile_palette = (tile_number >>> 10) & 7;
				tile_number = ((tile_number & 0x3FF) + tiledata_index) & tile_mask;

				if (tile_width === 4 && (+(hoffset & 8) ^ +(mirror_x))) tile_number += 1;
				if (tile_height === 4 && (+(voffset & 8) ^ +(mirror_y))) tile_number += 16;
				tile_number = ((tile_number & 0x3FF) + tiledata_index) & tile_mask;
				let address = (tile_number << color_shift) + ((voffset & 7) ^ mirror_y) & 0x7FFF;
				if (tile_number !== 0) console.log(sx, sy, tile_number, hex4(address));
				// Calculate R,G,B from BG data

				imgdata.data[di] = R;
				imgdata.data[di+1] = G;
				imgdata.data[di+2] = B;
				imgdata.data[di+3] = 255;
			}
		}
		ctx.putImageData(imgdata, x_origin, y_origin);
	}

	render_frame() {
		if (!PPU_USE_WORKERS) {
			for (let y = 0; y < this.clock.scanline.bottom_scanline; y++) {
				this.render_scanline(y);
			}
		}
	}

	render_scanline(y, force=false) {
		PPUF_render_scanline(y, this.cachelines, this.above, this.below, this.light_table, this.output, y*256);
	}

	blend(x, y, halve) {
		if (!this.cache.col.math_mode) { // add
			if (!halve) {
				let sum = x + y;
				let carry = (sum - ((x ^ y) & 0x421)) & 0x8420;
				return (sum - carry) | (carry - (carry >>> 5));
			} else {
				return (x + y - ((x ^ y) & 0x0421)) >>> 1;
			}
		} else { // sub
			let diff = x - y + 0x8420;
			let borrow = (diff - ((x ^ y) & 0x8420)) & 0x8420;
			if (!halve) {
				return (diff - borrow) & (borrow - (borrow >>> 5));
			} else {
				return (((diff - borrow) & (borrow - (borrow >>> 5))) & 0x7BDE) >>> 1;
			}
		}
	}

	catch_up() {
		// We aren't actually emulating PPU yet
		this.clock.ppu_deficit = 0;
	}

}
