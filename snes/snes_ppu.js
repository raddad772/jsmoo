"use strict";


// First go at a PPU
// R/W code should be fine, but drawing...we'll see.

const PPU_source = Object.freeze({
	BG1: 0,
	BG2: 1,
	BG3: 2,
	BG4: 3,
	OBJ1: 4,
	OBJ2: 5,
	COL: 6
});

const PPU_tile_mode = Object.freeze({
	BPP2: 0,
	BPP4: 1,
	BPP8: 2,
	Mode7: 3,
	Inactive: 4
});

const PPU_BPPBACK = {0: 'BPP2', 1: 'BPP4', 2: 'BPP8', 3: 'Mode7', 4: 'Inactive'}

const PPU_screen_mode = Object.freeze({
	above: 0,
	below: 1
});


class PPU_window_layer {
	constructor() {
		this.one_enable = 0;
		this.one_invert = 0;
		this.two_enable = 0;
		this.two_invert = 0;
		this.mask = 0;
		this.above_enable = 0;
		this.below_enable = 0;

		this.above_mask = 0;
		this.below_mask = 0;

		this.one_left = 0;
		this.one_right = 0;
		this.two_left = 0;
		this.two_right = 0;
	}


	/**
	 * @param {number} mask
	 * @param {Uint8Array} output
	 * @param {*} io
	 */
	render_layer_mask(mask, output, io) {
		let set = 1;
		let clear = 0;
		switch(mask) {
			case 0:
				output.fill(1);
				return;
			case 1:
				break;
			case 2:
				set = 0; clear = 1;
				break;
			case 3:
				output.fill(0);
				return;
		}

		if (!this.one_enable && !this.two_enable) {
			output.fill(clear);
		}

		if (this.one_enable && !this.two_enable) {
			if (this.one_invert) {
				set ^= 1;
				clear ^= 1;
			}
			for (let x = 0; x < 256; x++) {
				output[x] = x >= io.window.one_left && x <= io.window.one_right ? set : clear;
			}
			return;
		}

		if (this.two_enable && !this.one_enable) {
			if (this.two_invert) {
				set ^= 1;
				clear ^= 1;
			}
			for (let x = 0; x < 256; x++) {
				output[x] = x >= io.window.two_left && x <= io.window.two_right ? set : clear;
			}
			return;
		}

		for (let x = 0; x < 256; x++) {
			let one_mask = (x >= io.window.one_left && x <= io.window.one_right) ^ this.one_invert;
			let two_mask = (x >= io.window.two_left && x <= io.window.two_right) ^ this.two_invert;
			switch(this.mask) {
				case 0:
					output[x] = (one_mask | two_mask) === 1 ? set : clear;
					break;
				case 1:
					output[x] = (one_mask & two_mask) === 1 ? set : clear;
					break;
				case 2:
					output[x] = (one_mask ^ two_mask) === 1 ? set : clear;
					break;
				case 3:
					output[x] = (one_mask ^ two_mask) === 0 ? set : clear;
					break;
			}
		}
	}

	render_layer(enable, output, io) {
		if (!enable || (!this.one_enable && !this.two_enable)) {
			output.fill(0);
			return;
		}

		if (this.one_enable && !this.two_enable) {
			let set = 1 ^ this.one_invert;
			let clear = +(!set);
			for (let x in output) {
				output[x] = x >= io.window.one_left && x <= io.window.one_right ? set : clear;
			}
			return;
		}
		
		if (this.two_enable && !this.one_enable) {
			let set = 1 ^ this.two_invert;
			let clear = +(!set);
			for (let x in output) {
				output[x] = x >= io.window.two_left && x <= io.window.two_right ? set : clear;
			}
			return;
		}
		
		for (let x in output) {
			let one_mask = +(x >= io.window.one_left && x <= io.window.one_right) ^ this.one_invert;
			let two_mask = +(x >= io.window.two_left && x <= io.window.two_right) ^ this.two_invert;
			switch(this.mask) {
				case 0:
					output[x] = +((one_mask | two_mask) === 1);
					break;
				case 1:
					output[x] = +((one_mask & two_mask) === 1);
					break;
				case 2:
					output[x] = +((one_mask ^ two_mask) === 1);
					break;
				case 3:
					output[x] = +((one_mask ^ two_mask) === 0);
					break;
			}
		}
	}
}

function PPU_direct_color(palette_index, palette_color) {
	return ((palette_color << 2) & 0x001C) + ((palette_index << 1) & 2) +
		((palette_color << 4) & 0x380) + ((palette_index << 5) & 0x40) +
		((palette_color << 7) & 0x6000) + ((palette_index << 10) & 0x1000);
}

class PPU_object {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.character = 0;
		this.nameselect = 0;
		this.vflip = 0;
		this.hflip = 0;
		this.priority = 0;
		this.palette = 0;
		this.size = 0;
	}
}

class PPU_pixel {
	constructor() {
		this.source = 0;
		this.priority = 0;
		this.color = 0;
	}

	set(source, priority, color) {
		this.source = source;
		this.priority = priority;
		this.color = color;
	}
}

class PPU_bg {
	/**
	 * @param {number} layer
	 * @param {SNES_clock} clock
	 */
	constructor(layer, clock) {
		this.layer = layer;
		this.clock = clock;

		this.window = new PPU_window_layer();

		this.above_enable = 0;
		this.below_enable = 0;
		this.mosaic_enable = 0;
		this.tiledata_addr = 0;
		this.screen_addr = 0;
		this.screen_size = 0;
		this.tile_size = 0;
		this.hoffset = 0;
		this.voffset = 0;
		this.tile_mode = 0;
		this.priority = [0, 0];

		this.window_above = new Uint8Array(256);
		this.window_below = new Uint8Array(256);
	}

	get_tile(VRAM, io, bg, hoffset, voffset) {
		let hires = io.bg_mode === 5 || io.bg_mode === 6;
		let tile_height = 3 + bg.tile_size;
		let tile_width = !hires ? tile_height : 4;
		let screen_x = bg.screen_size & 1 ? 0x400 : 0;
		let screen_y = bg.screen_size & 2 ? 32 << (5 + (bg.screen_size & 1)) : 0;
		let tile_x = hoffset >>> tile_width;
		let tile_y = voffset >>> tile_height;
		let offset = ((tile_y & 0x1F) << 5) | (tile_x & 0x1F);
		if (tile_x & 0x20) offset += screen_x;
		if (tile_y & 0x20) offset += screen_y;
		return VRAM[(bg.screen_addr + offset) & 0x7FFF];
	}

	/**
	 * @param {number} y
	 * @param {number} source
	 * @param {*} io
	 * @param {Uint16Array} VRAM
	 * @param {Uint16Array} CGRAM
	 * @param above
	 * @param below
	 */
	render(y, source, io, VRAM, CGRAM, above, below) {
		//if (!this.above_enable && !this.below_enable) return;
		//if (this.tile_mode === PPU_tile_mode.Mode7) return;
		//if (this.tile_mode === PPU_tile_mode.Inactive) return;

		this.window.render_layer(this.window.above_enable, this.window_above, io);
		this.window.render_layer(this.window.below_enable, this.window_below, io);

		let hires = +(io.bg_mode === 5 || io.bg_mode === 6);
		let offset_per_tile_mode = io.bg_mode === 2 || io.bg_mode === 4 || io.bg_mode === 6;
		let direct_color_mode = io.col.direct_color && source === PPU_source.BG1 && (io.bg_mode === 3 || io.bg_mode === 4);
		let color_shift = 3 + this.tile_mode;
		let width = 256 << hires;
		//console.log('RENDERING PPU y:', y, 'BG MODE', io.bg_mode);

		let tile_height = 3 + this.tile_size;
		let tile_width = !hires ? tile_height : 4;
		let tile_mask = 0xFFF >> this.tile_mode;
		this.tiledata_index = this.tiledata_addr >>> (3 + this.tile_mode);

		this.palette_base = io.bg_mode === 0 ? source << 5 : 0;
		this.palette_shift = 2 << this.tile_mode;

		let hscroll = this.hoffset;
		let vscroll = this.voffset;
		let hmask = (width << this.tile_size << +(!!(this.screen_size & 1))) - 1;
		let vmask = (width << this.tile_size << +(!!(this.screen_size & 2))) - 1;

		if (hires) {
			hscroll <<= 1;
			if (io.interlace) y = y << 1 | +(this.clock.scanline.frame && !this.mosaic_enable);
		}
		if (this.mosaic_enable) {
			y -= (io.mosaic.size - io.mosaic.counter) << +(hires && io.interlace);
		}

		let mosaic_counter = 1;
		let mosaic_palette = 0;
		let mosaic_priority = 0;
		let mosaic_color = 0;

		let x = 0 - (hscroll & 7);
		while(x < width) {
			let hoffset = x + hscroll;
			let voffset = y + vscroll;
			if (offset_per_tile_mode) {
				let valid_bit = 0x2000 << source;
				let offset_x = x + (hscroll & 7);
				if (offset_x >= 8) {
					let hlookup = this.get_tile(VRAM, io, io.bg3, (offset_x - 8) + (io.bg3.hoffset & 0xFFF8), io.bg3.voffset);
					if (io.bg_mode === 4) {
						if (hlookup & valid_bit) {
							if (!(hlookup & 0x8000)) {
								hoffset = offset_x + (hlookup & 0xFFF8);
							} else {
								voffset = y + hlookup;
							}
						}
					} else {
						let vlookup = this.get_tile(VRAM, io, io.bg3, (offset_x - 8) + (io.bg3.hoffset & 0xFFF8), io.bg3.voffset + 8);
						if (hlookup & valid_bit) {
							hoffset = offset_x + (hlookup & 0xFFF8);
						}
						if (vlookup & valid_bit) {
							voffset = y + vlookup;
						}
					}
				}
			}
			hoffset &= hmask;
			voffset &= vmask;

			let tile_number = this.get_tile(VRAM, io, this, hoffset, voffset);
			let mirror_x = tile_number & 0x8000 ? 7 : 0;
			let mirror_y = tile_number & 0x4000 ? 7 : 0;
			let tile_priority = this.priority[+(tile_number & 0x2000)];
			let palette_number = (tile_number >>> 10) & 7;
			let palette_index = (this.palette_base + (palette_number << this.palette_shift)) & 0xFF;

			if (tile_width === 4 && (+(hoffset & 8) ^ +(mirror_x))) tile_number += 1;
			if (tile_height === 4 && (+(voffset & 8) ^ +(mirror_y))) tile_number += 16;
			tile_number = ((tile_number & 0x3FF) + this.tiledata_index) & tile_mask;

			let address = (tile_number << color_shift) + ((voffset & 7) ^ mirror_y) & 0x7FFF;

			// Javascript only has 54 bits for integers. Algorithm wants 64.
			let datalo = (VRAM[address + 8] << 16) | (VRAM[address]);
			let datahi = (VRAM[address + 24] << 16) | (VRAM[address + 16]);
			datalo = datalo + ((datahi & 0xFF) << 32);
			for (let tile_x = 0; tile_x < 8; tile_x++, x++) {
				if (x < 0 || x >= width) continue; // x < 0 || x >= width
				let color;
				if (--mosaic_counter === 0) {
					let shift = color = mirror_x ? tile_x : 7 - tile_x;
					color = (datalo >>> shift) & 1;
					color += (datalo >>> (shift + 7)) & 2;
					if (this.tile_mode >= PPU_tile_mode.BPP4) {
						color += (datalo >>> (shift + 14)) & 4;
						color += (datalo >>> (shift + 21)) & 8;
					}
					if (this.tile_mode >= PPU_tile_mode.BPP8) {
						color += (datalo >>> (shift + 28)) & 16;
						color += (datalo >>> (shift + 35)) & 32;
						color += (datahi >>> (shift + 10)) & 64;
						color += (datahi >>> (shift + 17)) & 128;
					}

					mosaic_counter = this.mosaic_enable ? io.mosaic.size << hires : 1;
					mosaic_palette = color;
					mosaic_priority = tile_priority;
					if (direct_color_mode) {
						mosaic_color = PPU_direct_color(palette_number, mosaic_palette);
					} else {
						mosaic_color = CGRAM[palette_index + mosaic_palette];
					}
				}
				if (!mosaic_palette) continue;

				if (!hires) {
					if (this.above_enable && !this.window_above[x] && mosaic_priority > above[x].priority)
						above[x].set(source, mosaic_priority, mosaic_color);
					if (this.below_enable && !this.window_below[x] && mosaic_priority > below[x].priority)
						below[x].set(source, mosaic_priority, mosaic_color);
				} else {
					let bx = x >>> 1;
					if (x & 1) {
						if (this.above_enable && !this.window_above[bx] && mosaic_priority > above[bx].priority) above[bx].set(source, mosaic_priority, mosaic_color);
					} else {
						if (self.below_enable && !this.window_below[bx] && mosaic_priority > below[bx].priority) below[bx].set(source, mosaic_priority, mosaic_color);
					}
				}
			}
		}
	}
}

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

		this.wram_addr = 0;
		this.wram_bank = 0x7E0000;

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
			cgram: 0,

			oam_addr: 0,
			cgram_addr: 0,

			mode7: 0,
			counters: 0,
			hcounter: 0,
			vcounter: 0,
		}

		this.io = {
			mosaic: {
				size: 1,
				counter: 0
			},
			mode7: {
				hflip: 0,
				vflip: 0,
				repeat: 0,
				a: 0,
				b: 0,
				c: 0,
				d: 0,
				x: 0,
				y: 0,
				hoffset: 0,
				voffset: 0
			},
			obj: {
				window: new PPU_window_layer(),
				size: 0,
				nametable: 0,
				tile_addr: 0,
				first: 0,
				interlace: 0,
				above_enable: 0,
				below_enable: 0
			},
			col: {
				window: new PPU_window_layer(),
				enable: [0, 0, 0, 0, 0, 0, 0],
				direct_color: 0,
				blend_mode: 0,
				halve: 0,
				math_mode: 0,
				fixed_color: 0
			},
			window: new PPU_window_layer(),

			bg1: new PPU_bg(1, this.clock),
			bg2: new PPU_bg(2, this.clock),
			bg3: new PPU_bg(3, this.clock),
			bg4: new PPU_bg(4, this.clock),

			oam_addr: 0,
			oam_base_addr: 0,
			oam_priority: 0,

			vram_increment_step: 1,
			vram_mapping: 0,
			vram_increment_mode: 1,
			vram_addr: 0,

			cram_addr: 0,

			overscan: 0,
			pseudo_hires: 0,
			extbg: 0,

			bg_mode: 0,
			bg_priority: 0,

			display_disable: 0,
			display_brightness: 0
		}

		this.VRAM = new Uint16Array(0x8001); // writes to 0x8000 basically ignored
		this.CRAM = new Uint16Array(0x100);
		this.bg_line = new Uint8Array(256 * 3);
		this.sprite_line = new Uint8Array(256 * 3);
		this.objects = [];
		for (let i = 0; i < 128; i++) {
			this.objects.push(new PPU_object);
		}

		this.ppu_inc = [1, 32, 128, 128];
	}

	present() {
		console.log('PRESENTING!!!!');
		let ctx = this.canvas.getContext('2d');
		let imgdata = ctx.getImageData(0, 0, 256, 224);
		for (let y = 0; y < 224; y++) {
			for (let x = 0; x < 256; x++) {
				let di = (y * 256 * 4) + (x * 4);
				let ppui = (y * 256) + x;
				imgdata.data[di] = (this.output[ppui] & 0x1F) << 3;
				imgdata.data[di+1] = (this.output[ppui] & 0x3E0) >> 2;
				imgdata.data[di+2] = (this.output[ppui] & 0x7C00) >> 7;
				if (imgdata.data[di] !== 0) {
					console.log('NON BLACK!');
				}
				imgdata.data[di+3] = 255;
			}
		}
		ctx.putImageData(imgdata, 0, 0);
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
		//if ((addr - 0x3F) & 0x3F) { return this.mem_map.read_apu(addr, val); }
		if (addr >= 0x2140 && addr < 0x217F) { return this.mem_map.read_apu(addr, val, have_effect); }

		//console.log('PPU read', hex0x6(addr));
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
			default:
				console.log('UNIMPLEMENTED PPU READ FROM', hex4(addr), hex2(val));
				return val;
		}
	}

	set_first_obj() {
		this.io.obj.first = this.io.oam_priority ? (this.io.oam_addr >>> 2) & 0x7F : 0;
	}

	OAM_read(addr) {
		let val = 0;
		let n;
		if (!(addr & 0x200)) {
			n = addr >> 2;
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
		let n;
		console.log('OAM WRITE', hex2(addr), hex2(val));
		if (!(addr & 0x200)) {
			n = addr >> 2; // object #
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
			n = (addr & 0x1F) << 2; // object #.... PPU is weird
			this.objects[n].x = (this.objects[n].x & 0xFF) | ((val << 8) & 0x100);
			this.objects[n+1].x = (this.objects[n+1].x & 0xFF) | ((val << 6) & 0x100);
			this.objects[n+2].x = (this.objects[n+2].x & 0xFF) | ((val << 4) & 0x100);
			this.objects[n+3].x = (this.objects[n+3].x & 0xFF) | ((val << 2) & 0x100);
			this.objects[n].size = (val >>> 1) & 1;
			this.objects[n+1].size = (val >>> 3) & 1;
			this.objects[n+2].size = (val >>> 5) & 1;
			this.objects[n+3].size = (val >>> 7) & 1;
		}
	}

	update_video_mode() {
		this.clock.scanline.bottom_scanline = this.io.overscan ? 240 : 225;
		switch(this.io.bg_mode) {
			case 0:
				this.io.bg1.tile_mode = PPU_tile_mode.BPP2;
				this.io.bg2.tile_mode = PPU_tile_mode.BPP2;
				this.io.bg3.tile_mode = PPU_tile_mode.BPP2;
				this.io.bg4.tile_mode = PPU_tile_mode.BPP2;
				this.io.bg1.priority = [8, 11];
				this.io.bg2.priority = [7, 10];
				this.io.bg3.priority = [2, 5];
				this.io.bg4.priority = [1, 4];
				this.io.obj.priority = [3, 6, 9, 12];
				break;
			case 1:
				this.io.bg1.tile_mode = PPU_tile_mode.BPP4;
				this.io.bg2.tile_mode = PPU_tile_mode.BPP4;
				this.io.bg3.tile_mode = PPU_tile_mode.BPP2;
				this.io.bg4.tile_mode = PPU_tile_mode.Inactive;
				if (this.io.bg_priority) {
					this.io.bg1.priority = [5, 8];
					this.io.bg2.priority = [4, 7];
					this.io.bg3.priority = [1, 10];
					this.io.obj.priority = [2, 3, 6, 9];
				} else {
					this.io.bg1.priority = [6, 9];
					this.io.bg2.priority = [5, 8];
					this.io.bg3.priority = [1, 3];
					this.io.obj.priority = [2, 4, 7, 10];
				}
				break;
			case 2:
				this.io.bg1.tile_mode = PPU_tile_mode.BPP4;
				this.io.bg2.tile_mode = PPU_tile_mode.BPP4;
				this.io.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg1.priority = [6, 9];
				this.io.bg2.priority = [5, 8];
				this.io.obj.priority = [2, 4, 7, 10];
				break;
			case 3:
				this.io.bg1.tile_mode = PPU_tile_mode.BPP8;
				this.io.bg2.tile_mode = PPU_tile_mode.BPP4;
				this.io.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg1.priority = [3, 7];
				this.io.bg2.priority = [1, 5];
				this.io.obj.priority = [2, 4, 6, 8];
				break;
			case 4:
				this.io.bg1.tile_mode = PPU_tile_mode.BPP8;
				this.io.bg2.tile_mode = PPU_tile_mode.BPP2;
				this.io.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg1.priority = [3, 7];
				this.io.bg2.priority = [1, 5];
				this.io.obj.priority = [2, 4, 6, 8];
				break;
			case 5:
				this.io.bg1.tile_mode = PPU_tile_mode.BPP4;
				this.io.bg2.tile_mode = PPU_tile_mode.BPP2;
				this.io.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg1.priority = [3, 7];
				this.io.bg2.priority = [1, 5];
				this.io.obj.priority = [2, 4, 6, 8];
				break;
			case 6:
				this.io.bg1.tile_mode = PPU_tile_mode.BPP4;
				this.io.bg2.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg3.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg4.tile_mode = PPU_tile_mode.Inactive;
				this.io.bg1.priority = [2, 5];
				this.io.obj.priority = [1, 3, 4, 6];
				break;
			case 7:
				if (!this.io.extbg) {
					this.io.bg1.tile_mode = PPU_tile_mode.Mode7;
					this.io.bg2.tile_mode = PPU_tile_mode.Inactive;
					this.io.bg3.tile_mode = PPU_tile_mode.Inactive;
					this.io.bg4.tile_mode = PPU_tile_mode.Inactive;
					this.io.bg1.priority = [2];
					this.io.obj.priority = [1, 3, 4, 5];
				} else {
					this.io.bg1.tile_mode = PPU_tile_mode.Mode7;
					this.io.bg2.tile_mode = PPU_tile_mode.Mode7;
					this.io.bg3.tile_mode = PPU_tile_mode.Inactive;
					this.io.bg4.tile_mode = PPU_tile_mode.Inactive;
					this.io.bg1.priority = [3];
					this.io.bg2.priority = [1, 5];
					this.io.obj.priority = [2, 4, 6, 7];
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
		console.log('PPU write', hex0x4(addr), hex0x2(val));
		let addre, latchbit;
		switch(addr) {
			case 0x2100: // INIDISP
				this.io.display_brightness = val & 15;
				this.io.display_disable = (val >>> 7) & 1;
				this.clock.set_fblank(!this.io.display_disable);
				break;
			case 0x2101: // OBSEL
				this.io.obj.size = val >>> 5;
				this.io.obj.nametable = (val >>> 3) & 3;
				this.io.obj.tile_addr = (val << 13) & 0x6000;
				return;
			case 0x2102: // OAMADDL
				this.io.oam_base_addr = (this.io.oam_base_addr & 0x200) | (val << 1);

				this.io.oam_addr = this.io.oam_base_addr;
				this.set_first_obj();
				return;
			case 0x2103: // OAMADDH
				this.io.oam_base_addr = (val & 1) << 9 | (this.io.oam_base_addr & 0x01FE);
				this.io.oam_priority = (val >>> 7) & 1;
				this.io.oam_addr = this.io.oam_base_addr;
				this.set_first_obj();
				return;
			case 0x2104: // OAMDATA
				latchbit = this.io.oam_addr & 1;
				addre = this.io.oam_addr;
				this.io.oam_addr = (this.io.oam_addr + 1) & 0x3FF;
				if (latchbit === 0) this.latch.oam = val;
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
				this.io.bg_mode = val & 7;
				this.io.bg_priority = (val >>> 3) & 1;
				this.io.bg1.tile_size = (val >>> 4) & 1;
				this.io.bg2.tile_size = (val >>> 5) & 1;
				this.io.bg3.tile_size = (val >>> 6) & 1;
				this.io.bg4.tile_size = (val >>> 7) & 1;
				this.update_video_mode();
				return;
			case 0x2106: // MOSAIC
				// NOT IMPLEMENT
				latchbit = this.io.bg1.mosaic_enable || this.io.bg2.mosaic_enable || this.io.bg3.mosaic_enable || this.io.bg4.mosaic_enable;
				this.io.bg1.mosaic_enable = val & 1;
				this.io.bg2.mosaic_enable = (val >>> 1) & 1;
				this.io.bg3.mosaic_enable = (val >>> 1) & 1;
				this.io.bg4.mosaic_enable = (val >>> 1) & 1;
				this.io.mosaic.size = ((val >>> 4) & 15) + 1;
				if (!latchbit && (val & 15)) {
					this.io.mosaic.counter = this.io.mosaic.size + 1;
				}
				return;
			case 0x2107: // BG1SC
				this.io.bg1.screen_size = val & 3;
				this.io.bg1.screen_addr = (val << 8) & 0x7C00;
				return;
			case 0x2108: // BG2SC
				this.io.bg2.screen_size = val & 3;
				this.io.bg2.screen_addr = (val << 8) & 0x7C00;
				return;
			case 0x2109: // BG3Sc
				this.io.bg3.screen_size = val & 3;
				this.io.bg3.screen_addr = (val << 8) & 0x7C00;
				return;
			case 0x210A: // BG4SC
				this.io.bg4.screen_size = val & 3;
				this.io.bg4.screen_addr = (val << 8) & 0x7C00;
				return;
			case 0x210B: // BG12NBA
				this.io.bg1.tiledata_addr = (val << 12) & 0x7000;
				this.io.bg2.tiledata_addr = (val << 8) & 0x7000;
				return;
			case 0x210C: // BG34NBA
				this.io.bg3.tiledata_addr = (val << 12) & 0x7000;
				this.io.bg4.tiledata_addr = (val << 8) & 0x7000;
				return;
			case 0x210D: // BG1HOFS
				this.io.bg1.hoffset = (val << 8) | (this.latch.ppu1.bgofs & 0xF8) | (this.latch.ppu2.bgofs & 7);
				this.latch.ppu1.bgofs = this.latch.ppu2.offs = val;
				return;
			case 0x210E: // BG1VOFS
				this.io.bg1.voffset = (val << 8) | (this.latch.ppu1.bgofs);
				this.latch.ppu1.bgofs = val;
				return;
			case 0x210F: // BG2HOFS
				this.io.bg2.hoffset = (val << 8) | (this.latch.ppu1.bgofs & 0xF8) | (this.latch.ppu2.bgofs & 7);
				this.latch.ppu1.bgofs = this.latch.ppu2.offs = val;
				return;
			case 0x2110: // BG2VOFS
				this.io.bg2.voffset = (val << 8) | (this.latch.ppu1.bgofs);
				this.latch.ppu1.bgofs = val;
				return;
			case 0x2111: // BG3HOFS
				this.io.bg3.hoffset = (val << 8) | (this.latch.ppu1.bgofs & 0xF8) | (this.latch.ppu2.bgofs & 7);
				this.latch.ppu1.bgofs = this.latch.ppu2.offs = val;
				return;
			case 0x2112: // BG3VOFS
				this.io.bg3.voffset = (val << 8) | (this.latch.ppu1.bgofs);
				this.latch.ppu1.bgofs = val;
				return;
			case 0x2113: // BG4HOFS
				this.io.bg4.hoffset = (val << 8) | (this.latch.ppu1.bgofs & 0xF8) | (this.latch.ppu2.bgofs & 7);
				this.latch.ppu1.bgofs = this.latch.ppu2.offs = val;
				return;
			case 0x2114: // BG4VOFS
				this.io.bg4.voffset = (val << 8) | (this.latch.ppu1.bgofs);
				this.latch.ppu1.bgofs = val;
				return;
			case 0x2115: // VRAM increment
				this.io.increment_size = this.ppu_inc[val & 3];
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
				addre = this.get_addr_by_map();
				this.VRAM[addre] = (this.VRAM[addre] & 0xFF00) | val;
				if (this.io.vram_increment_mode === 0) this.io.vram_addr = (this.io.vram_addr + this.io.vram_increment_step) & 0x7FFF;
				console.log('PPU write to lo', hex4(addre), hex2(val));
				return;
			case 0x2119: // VRAM data hi
				addre = this.get_addr_by_map();
				this.VRAM[addre] = (val << 8) | (this.VRAM[addre] & 0xFF);
				if (this.io.vram_increment_mode === 1) this.io.vram_addr = (this.io.vram_addr + this.io.vram_increment_step) & 0x7FFF;
				return;
			case 0x211A: // M7SEL
				this.io.mode7.hflip = val & 1;
				this.io.mode7.vflip = (val >>> 1) & 1;
				this.io.mode7.repeat = (val >>> 6) & 3;
				return;
			case 0x211B: // M7A
				this.io.mode7.a = (val << 8) | this.latch.mode7;
				this.latch.mode7 = val;
				return;
			case 0x211C: // M7B
				this.io.mode7.b = (val << 8) | this.latch.mode7;
				this.latch.mode7 = val;
				return;
			case 0x211D: // M7C
				this.io.mode7.c = (val << 8) | this.latch.mode7;
				this.latch.mode7 = val;
				return;
			case 0x211E: // M7D
				this.io.mode7.d = (val << 8) | this.latch.mode7;
				this.latch.mode7 = val;
				return;
			case 0x211F: // M7E
				this.io.mode7.x = (val << 8) | this.latch.mode7;
				this.latch.mode7 = val;
				return;
			case 0x2120: // M7F
				this.io.mode7.y = (val << 8) | this.latch.mode7;
				this.latch.mode7 = val;
				return;
			case 0x2121: // Color RAM address
				this.io.cram_addr = val;
				this.latch.cram_addr = 0;
				return;
			case 0x2122: // Color RAM data
				if (this.latch.cram_addr === 0) {
					this.latch.cram_addr = 1;
					this.latch.cram = val;
				}
				else {
					this.latch.cram_addr = 0;
					this.CRAM[this.io.cram_addr] = ((val & 0x7F) << 8) | this.latch.cram;
					console.log('CRAM WRITE', hex2(this.io.cram_addr), hex2(val));
					this.io.cram_addr = (this.io.cram_addr + 1) & 0xFF;
				}
				return;
			case 0x2123: // W12SEL
				this.io.bg1.window.oneInvert = val  & 1;
				this.io.bg1.window.oneEnable = (val >>> 1) & 1;
				this.io.bg1.window.twoInvert = (val >>> 2) & 1;
				this.io.bg1.window.twoEnable = (val >>> 3) & 1;
				this.io.bg2.window.oneInvert = (val >>> 4)  & 1;
				this.io.bg2.window.oneEnable = (val >>> 5) & 1;
				this.io.bg2.window.twoInvert = (val >>> 6) & 1;
				this.io.bg2.window.twoEnable = (val >>> 7) & 1;
				return;
			case 0x2124: // W34SEL
				this.io.bg3.window.oneInvert = val  & 1;
				this.io.bg3.window.oneEnable = (val >>> 1) & 1;
				this.io.bg3.window.twoInvert = (val >>> 2) & 1;
				this.io.bg3.window.twoEnable = (val >>> 3) & 1;
				this.io.bg4.window.oneInvert = (val >>> 4)  & 1;
				this.io.bg4.window.oneEnable = (val >>> 5) & 1;
				this.io.bg4.window.twoInvert = (val >>> 6) & 1;
				this.io.bg4.window.twoEnable = (val >>> 7) & 1;
				return;
			case 0x2125: // WOBJSEL
				this.io.obj.window.one_invert = val & 1;
				this.io.obj.window.one_enable = (val >>> 1) & 1;
				this.io.obj.window.two_invert = (val >>> 2) & 1;
				this.io.obj.window.two_enable = (val >>> 3) & 1;
				this.io.col.window.one_invert = (val >>> 4) & 1;
				this.io.col.window.one_enable = (val >>> 5) & 1;
				this.io.col.window.two_invert = (val >>> 6) & 1;
				this.io.col.window.two_enable = (val >>> 7) & 1;
				return;
			case 0x2126: // WH0
				this.io.window.one_left = val;
				return;
			case 0x2127: // WH1...
				this.io.window.one_right = val;
				return;
			case 0x2128: // WH2
				this.io.window.two_left = val;
				return;
			case 0x2129: // WH3
				this.io.window.two_right = val;
				return;
			case 0x212A: // WBGLOG
				this.io.bg1.window.mask = val & 3;
				this.io.bg2.window.mask = (val >>> 2) & 3;
				this.io.bg3.window.mask = (val >>> 4) & 3;
				this.io.bg4.window.mask = (val >>> 6) & 3;
				return;
			case 0x212B: // WOBJLOG
				this.io.obj.window.mask = val & 3;
				this.io.col.window.mask = (val >>> 2) & 3;
				return;
			case 0x212C: // TM
				this.io.bg1.above_enable = val & 1;
				this.io.bg2.above_enable = (val >>> 1) & 1;
				this.io.bg3.above_enable = (val >>> 2) & 1;
				this.io.bg4.above_enable = (val >>> 3) & 1;
				this.io.obj.above_enable = (val >>> 4) & 1;
				return;
			case 0x212D: // TS
				this.io.bg1.below_enable = val & 1;
				this.io.bg2.below_enable = (val >>> 1) & 1;
				this.io.bg3.below_enable = (val >>> 2) & 1;
				this.io.bg4.below_enable = (val >>> 3) & 1;
				this.io.obj.below_enable = (val >>> 4) & 1;
				return;
			case 0x212E: // TMW
				this.io.bg1.window.above_enable = val & 1;
				this.io.bg2.window.above_enable = (val >>> 1) & 1;
				this.io.bg3.window.above_enable = (val >>> 2) & 1;
				this.io.bg4.window.above_enable = (val >>> 3) & 1;
				this.io.obj.window.above_enable = (val >>> 4) & 1;
				return;
			case 0x212F: // TSW
				this.io.bg1.window.below_enable = val & 1;
				this.io.bg2.window.below_enable = (val >>> 1) & 1;
				this.io.bg3.window.below_enable = (val >>> 2) & 1;
				this.io.bg4.window.below_enable = (val >>> 3) & 1;
				this.io.obj.window.below_enable = (val >>> 4) & 1;
				return;
			case 0x2130: // CGWSEL
				this.io.col.direct_color = val & 1;
				this.io.col.blend_mode = (val >>> 1) & 1;
				this.io.col.window.below_mask = (val >>> 4) & 3;
				this.io.col.window.above_mask = (val >>> 6) & 3;
				return;
			case 0x2131: // CGADDSUB
				this.io.col.enable[PPU_source.BG1] = val & 1;
				this.io.col.enable[PPU_source.BG2] = (val >>> 1) & 1;
				this.io.col.enable[PPU_source.BG3] = (val >>> 2) & 1;
				this.io.col.enable[PPU_source.BG4] = (val >>> 3) & 1;
				this.io.col.enable[PPU_source.OBJ1] = 0;
				this.io.col.enable[PPU_source.OBJ2] = (val >>> 4) & 1;
				this.io.col.enable[PPU_source.COL] = (val >>> 5) & 1;
				this.io.col.halve = (val >>> 6) & 1;
				this.io.col.math_mode = (val >>> 7) & 1;
				return;
			case 0x2132: // COLDATA weirdness
				if (val & 0x20) this.io.col.fixed_color = (this.io.col.fixed_color & 0x7FE0) | (val & 31);
				if (val & 0x40) this.io.col.fixed_color = (this.io.col.fixed_color & 0x7C1F) | ((val & 31) << 5);
				if (val & 0x80) this.io.col.fixed_color = (this.io.col.fixed_color & 0x3FF) | ((val & 31) << 10);
				return;
			case 0x2133: // SETINI
				this.io.interlace = val & 1;
				this.io.obj.interlace = (val >>> 1) & 1;
				this.io.overscan = (val >>> 2) & 1;
				this.io.pseudo_hires = (val >>> 3) & 1;
				this.io.extbg = (val >>> 6) & 1;
				this.update_video_mode();
				return;

			case 0x2180: // WRAM access port
				this.mem_map.dispatch_write((this.wram_bank << 16) + this.wram_addr, val);
				this.wram_addr++;
				if (this.wram_addr > 0x10000) {
					this.wram_addr -= 0x10000;
					this.wram_bank = (this.wram_bank === 0x7E) ? 0x7F : 0x7E;
				}
				return;
			case 0x2181: // WRAM addr low
				this.wram_addr = (this.wram_addr & 0xFF00) + val;
				return;
			case 0x2182: // WRAM addr med
				this.wram_addr = (val << 8) + (this.wram_addr & 0xFF);
				return;
			case 0x2183: // WRAM bank
				this.wram_bank = (val & 1) ? 0x7F: 0x7E;
				return;
			default:
				console.log('UNIMPLEMENTED PPU WRITE TO', hex4(addr), hex2(val));
				return;
		}
	}

	/**
	 * @param {number} y_origin
	 * @param {number} x_origin
	 * @param {PPU_bg} bg
	 */
	render_bg1_from_memory(y_origin, x_origin, bg) {
		// Grab raw buffer
		console.log(this.objects);

		let ctx = this.canvas.getContext('2d');
		let imgdata = ctx.getImageData(x_origin, y_origin, 256, 224);
		console.log('PPU INFO: BG MODE', this.io.bg_mode);
		console.log('size', bg.tile_size);
		console.log('BPP', PPU_BPPBACK[bg.tile_mode]);
		console.log('h, v scrolls', bg.hoffset, bg.voffset);
		let tile_mask = 0xFFF >> bg.tile_mode;
		let tiledata_index = bg.tiledata_addr >>> (3 + bg.tile_mode);
		let color_shift = 3 + bg.tile_mode;
		let tile_height = 3 + bg.tile_size;
		let hires = +(this.io.bg_mode === 5 || this.io.bg_mode === 6);
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

				let tile_number = bg.get_tile(this.VRAM, this.io, bg, sx, sy)
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

	/**
	 * @param {{tile_addr: number, size: number, nametable: number, window: PPU_window_layer, interlace: number, first: number}} self
	 */
	renderObject(self) {
		if (this.io.obj.above)
	}

	render_scanline() {
		// render background lines
		let width = 256;
		let y = this.clock.scanline.ppu_y;
		let output = y * 256;

		if (this.clock.scanline.fblank) {
			this.output.fill(0);
			return;
		}

		let hires = this.io.pseudo_hires || this.io.bg_mode === 5 || this.io.bg_mode === 6;
		let above_color = this.CRAM[0];
		let below_color = hires ? this.CRAM[0] : this.io.col.fixed_color;
		for (let x = 0; x < 256; x++) {
			this.above[x].set(PPU_source.COL, 0, above_color);
			this.below[x].set(PPU_source.COL, 0, below_color);
		}

		this.io.bg1.render(this.clock.scanline.ppu_y, PPU_source.BG1, this.io, this.VRAM, this.CRAM, this.above, this.below);
		if (this.io.extbg === 0) this.io.bg2.render(this.clock.scanline.ppu_y, PPU_source.BG2, this.io, this.VRAM, this.CRAM, this.above, this.below);
		this.io.bg3.render(this.clock.scanline.ppu_y, PPU_source.BG3, this.io, this.VRAM, this.CRAM, this.above, this.below);
		this.io.bg4.render(this.clock.scanline.ppu_y, PPU_source.BG4, this.io, this.VRAM, this.CRAM, this.above, this.below);
		this.renderObject(io.obj);
		// renderObjects here
		if (this.io.extbg === 1) this.io.bg2.render(this.clock.scanline.ppu_y, PPU_source.BG2, this.io, this.VRAM, this.CRAM, this.above, this.below);
		// render background color windows here
		this.io.col.window.render_layer_mask(this.io.col.window.above_mask, this.window_above, this.io);
		this.io.col.window.render_layer_mask(this.io.col.window.below_mask, this.window_below, this.io);

		let luma = this.light_table[this.io.display_brightness];
		let cur = 0;
		let prev = 0;

		for (let x = 0; x < 256; x++) {
			this.output[output++] = luma[this.pixel(x, this.above[x], this.below[x])];
		}

	}

	blend(x, y, halve) {
		if (!this.io.col.math_mode) { // add
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
				return (((diff - borrow) & (borrow - (borrow >>> 5))) & 0x7BDE) >> 1;
			}
		}
	}

	pixel(x, above, below) {
		if (!this.window_above[x]) above.color = 0;
		if (!this.window_below[x]) return above.color;
		if (!this.io.col.enable[above.source]) return above.color;
		if (!this.io.col.blend_mode) return this.blend(above.color, this.io.col.fixed_color, this.io.col.halve && this.window_above[x]);
		return this.blend(above.color, below.color, this.io.col.halve && this.window_above[x] && below.source !== PPU_source.COL);
	}

	catch_up() {
		// We aren't actually emulating PPU yet
		this.clock.ppu_deficit = 0;
	}

}
