"use strict";


// First go at a PPU
// R/W code should be fine, but drawing...we'll see.

const PPU_ITEM_LIMIT = 32;
const PPU_TILE_LIMIT = 34;
const PPU_obj_widths = [[8, 8, 8, 16, 16, 32, 16, 16], [16, 32, 64, 32, 64, 64, 32, 32]];
const PPU_obj_heights = [[8, 8, 8, 16, 16, 32, 32, 32], [16, 32, 64, 32, 64, 64, 64, 32]];

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

class PPU_object_item {
	constructor() {
		this.valid = 0;
		this.index = 0;
		this.width = 0;
		this.height = 0;
	}
}

class PPU_object_tile {
	constructor() {
		this.valid = 0;
		this.x = 0;
		this.y = 0;
		this.priority = 0;
		this.palette = 0;
		this.hflip = 0;
		this.data = 0;
	}
}

/**
 * @param {number} mask
 * @param {Uint8Array} output
 * @param {*} io
 */
function PPUF_window_render_layer_mask(self, mask, output, io) {
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

	if (!self.one_enable && !self.two_enable) {
		output.fill(clear);
	}

	if (self.one_enable && !self.two_enable) {
		if (self.one_invert) {
			set ^= 1;
			clear ^= 1;
		}
		for (let x = 0; x < 256; x++) {
			output[x] = x >= io.window.one_left && x <= io.window.one_right ? set : clear;
		}
		return;
	}

	if (self.two_enable && !self.one_enable) {
		if (self.two_invert) {
			set ^= 1;
			clear ^= 1;
		}
		for (let x = 0; x < 256; x++) {
			output[x] = x >= io.window.two_left && x <= io.window.two_right ? set : clear;
		}
		return;
	}

	for (let x = 0; x < 256; x++) {
		let one_mask = (x >= io.window.one_left && x <= io.window.one_right) ^ self.one_invert;
		let two_mask = (x >= io.window.two_left && x <= io.window.two_right) ^ self.two_invert;
		switch(self.mask) {
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


function PPUF_window_render_layer(self, enable, output, io, extended_log=false) {
	if (!enable || (!self.one_enable && !self.two_enable)) {
		if (dbg.log_windows) console.log(snes.clock.scanline.ppu_y, dbg.cur_bg, 'FILL 0')
		output.fill(0);
		return;
	}
	if (dbg.log_windows) console.log(snes.clock.scanline.ppu_y, dbg.cur_bg, io.window.one_left, io.window.one_right, self.one_invert, self.one_enable, self.two_enable)

	if (self.one_enable && !self.two_enable) {
		let set = 1 ^ self.one_invert;
		let clear = +(!set);
		if (dbg.log_windows && extended_log) console.log('CASE 1 clear set', clear, set);
		for (let x in output) {
			output[x] = x >= io.window.one_left && x <= io.window.one_right ? set : clear;
		}
		return;
	}

	if (self.two_enable && !self.one_enable) {
		let set = 1 ^ self.two_invert;
		let clear = +(!set);
		if (dbg.log_windows && extended_log) console.log('CASE 2 clear set', clear, set);
		for (let x in output) {
			output[x] = x >= io.window.two_left && x <= io.window.two_right ? set : clear;
		}
		return;
	}

	if (dbg.log_windows && extended_log) console.log('CASE 3 left right', io.window.one_left, io.window.one_right);
	for (let x in output) {
		let one_mask = +(x >= io.window.one_left && x <= io.window.one_right) ^ self.one_invert;
		let two_mask = +(x >= io.window.two_left && x <= io.window.two_right) ^ self.two_invert;
		switch(self.mask) {
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

/**
 * @param {number} ppu_y
 * @param {{name_select: number, tile_addr: number, base_size: number, below_enable: number, window: PPU_window_layer, interlace: number, range_over: number, time_over: number, priority: *[], first: number, above_enable: number}} obj
 * @param force
 */

function PPUF_render_objects(self, ppu_y, obj, force=false)
{
	if (!force && !obj.above_enable && !obj.below_enable) return;
	PPUF_window_render_layer(obj.window, obj.window.above_enable, self.window_above, self.cache, true);
	PPUF_window_render_layer(obj.window, obj.window.below_enable, self.window_below, self.cache);
	if (dbg.log_windows) console.log(obj.window);
	if (dbg.log_windows) console.log(snes.clock.scanline.ppu_y, self.window_above, self.window_below);
	let item_count = 0;
	let tile_count = 0;
	for (let n = 0; n < PPU_ITEM_LIMIT; n++) {
		self.items[n].valid = 0;
	}
	for (let n = 0; n < PPU_TILE_LIMIT; n++) {
		self.tiles[n].valid = 0;
	}

	for (let n = 0; n < 128; n++) {
		let item = new PPU_object_item();
		item.valid = 1;
		item.index = (obj.first + n) & 127;
		let object = self.objects[item.index];

		item.width = PPU_obj_widths[object.size][obj.base_size];
		item.height = PPU_obj_heights[object.size][obj.base_size];
		// If off right edge of screen and not wrapped to left side
		if ((object.x > 256) && ((object.x + item.width - 1) < 512)) continue;
		let height = item.height >>> self.cache.interlace;
		if (
			((ppu_y >= object.y) && (ppu_y < (object.y + height))) ||
			(((object.y + height) >= 256) && (ppu_y < ((object.y + height) & 255)))
		) {
			if (item_count++ >= PPU_ITEM_LIMIT) break;
			self.items[item_count - 1] = item;
		}
	}

	for (let n = PPU_ITEM_LIMIT - 1; n >= 0; n--) {
		let item = self.items[n];
		if (!item.valid) continue;

		let object = self.objects[item.index];
		let tile_width = item.width >>> 3;
		let mx = object.x;
		let y = (ppu_y - object.y) & 0xFF;
		if (self.cache.interlace) y <<= 1;

		if (object.vflip) {
			if (item.width === item.height) {
				y = item.height - 1 - y;
			} else if (y < item.width) {
				y = item.width - 1 - y;
			} else {
				y = item.width + (item.width - 1) - (y - item.width);
			}
		}
		if (self.cache.interlace) {
			y = !object.vflip ? y + self.clock.scanline.frame : y - self.clock.scanline.frame;
		}

		mx &= 511;
		y &= 255;
		let tile_addr = obj.tile_addr;
		if (object.nameselect) tile_addr += 1 + (object.nameselect << 12); // SUS
		let character_x = object.character & 15;
		let character_y = (((object.character >>> 4) + (y >>> 3)) & 15) << 4;

		for (let tile_x = 0; tile_x < tile_width; tile_x++) {
			let object_x = (mx + (tile_x << 3)) & 511;
			if ((mx !== 256) && (object_x >= 256) && ((object_x + 7) < 512)) continue;

			let tile = new PPU_object_tile();
			tile.valid = 1;
			tile.x = object_x;
			tile.y = y;
			tile.priority = object.priority;
			tile.palette = 128 + (object.palette << 4);
			tile.hflip = object.hflip;

			let mirror_x = !object.hflip ? tile_x : tile_width - 1 - tile_x;
			let addr = tile_addr + ((character_y + (character_x + mirror_x & 15)) << 4);
			addr = (addr & 0x7FF0) + (y & 7);
			tile.data = self.VRAM[addr];
			tile.data |= self.VRAM[(addr + 8) & 0x7FFF] << 16;

			if (tile_count++ >= PPU_TILE_LIMIT) break;
			self.tiles[tile_count - 1] = tile;
		}
	}
	//if ((item_count>0 || tile_count>0) && (y < 241)) console.log('ITEM AND TILE COUNT', y, item_count, tile_count);

	self.cache.obj.range_over |= +(item_count > PPU_ITEM_LIMIT);
	self.cache.obj.time_over |= +(tile_count > PPU_TILE_LIMIT);

	let palette = new Array(256);
	let priority = new Array(256);
	for (let n = 0; n < PPU_TILE_LIMIT; n++) {
		let tile = self.tiles[n];
		if (!tile.valid) continue;

		let tile_x = tile.x;
		for (let mx = 0; mx < 8; mx++) {
			tile_x &= 511;
			if (tile_x < 256) {
				let color = 0;
				let shift = tile.hflip ? mx : 7 - mx;
				//let datahi = (tile.data & 0xFF00);
				//let datalo = (tile.data & 0x00FF);
				//let datamid = (tile.data >> 8) & 0x0FFF;
				color = (tile.data >>> (shift)) & 1; // SUS?
				color += (tile.data >>> (shift + 7)) & 2; // 7-10 to 14-17
				color += (tile.data >>> (shift + 14)) & 4; // 14-17 to 21-24
				color += (tile.data >>> (shift + 21)) & 8; // 21-28 to 28-31
				if (color !== 0) {
					palette[tile_x] = tile.palette + color;
					priority[tile_x] = obj.priority[tile.priority];
				}
			}
			tile_x++;
		}
	}

	if (force & dbg.watch_on) console.log(self.items, self.tiles);

	for (let x = 0; x < 256; x++) {
		if (!priority[x]) continue;
		let source = palette[x] < 192 ? PPU_source.OBJ1 : PPU_source.OBJ2;
		//console.log('SPR!', x, self.clock.scanline.ppu_y, palette[x], self.CRAM[palette[x]]);
		if (force) {
			//console.log('SETTING', x);
			self.output[(ppu_y * 256) + x] = self.CGRAM[palette[x]];
			//self.above[x].set(source, priority[x], self.CRAM[palette[x]]);
			//self.below[x].set(source, priority[x], self.CRAM[palette[x]]);
		} else {
			if (obj.above_enable && (self.window_above[x] === 0) && priority[x] > self.above[x].priority) self.above[x].set(source, priority[x], self.CGRAM[palette[x]]);
			if (obj.below_enable && (self.window_below[x] === 0) && priority[x] > self.below[x].priority) self.below[x].set(source, priority[x], self.CGRAM[palette[x]]);
		}
	}
}

function PPUF_get_tile(VRAM, io, bg, hoffset, voffset) {
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

/**
 * @param {number} y
 * @param {number} source
 * @param {*} io
 * @param {Uint16Array} VRAM
 * @param {Uint16Array} CGRAM
 * @param above
 * @param below
 * @param verbose
 */
function PPUF_render_bg(self, y, source, io, VRAM, CGRAM, above, below, verbose = false) {
	if (!self.above_enable && !self.below_enable) return;
	if (self.tile_mode === PPU_tile_mode.Mode7) return PPUF_render_mode7(self, y, source, io, VRAM, CGRAM, above, below);
	if (self.tile_mode === PPU_tile_mode.Inactive) return;

	PPUF_window_render_layer(self.window, self.window.above_enable, self.window_above, io);
	PPUF_window_render_layer(self.window, self.window.below_enable, self.window_below, io);

	let hires = +(io.bg_mode === 5 || io.bg_mode === 6);
	let offset_per_tile_mode = io.bg_mode === 2 || io.bg_mode === 4 || io.bg_mode === 6;
	let direct_color_mode = io.col.direct_color && source === PPU_source.BG1 && (io.bg_mode === 3 || io.bg_mode === 4);
	let color_shift = 3 + self.tile_mode;
	let width = 256 << hires;
	//console.log('RENDERING PPU y:', y, 'BG MODE', io.bg_mode);

	let tile_height = 3 + self.tile_size;
	let tile_width = !hires ? tile_height : 4;
	let tile_mask = 0xFFF >>> self.tile_mode;
	self.tiledata_index = self.tiledata_addr >>> (3 + self.tile_mode);

	self.palette_base = io.bg_mode === 0 ? source << 5 : 0;
	self.palette_shift = 2 << self.tile_mode;

	let hscroll = self.hoffset;
	let vscroll = self.voffset;
	let hmask = (width << self.tile_size << +(!!(self.screen_size & 1))) - 1;
	let vmask = (width << self.tile_size << +(!!(self.screen_size & 2))) - 1;

	if (hires) {
		hscroll <<= 1;
		if (io.interlace) y = y << 1 | +(self.clock.scanline.frame && !self.mosaic_enable);
	}
	if (self.mosaic_enable) {
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
				let hlookup = PPUF_get_tile(VRAM, io, io.bg3, (offset_x - 8) + (io.bg3.hoffset & 0xFFF8), io.bg3.voffset);
				if (io.bg_mode === 4) {
					if (hlookup & valid_bit) {
						if (!(hlookup & 0x8000)) {
							hoffset = offset_x + (hlookup & 0xFFF8);
						} else {
							voffset = y + hlookup;
						}
					}
				} else {
					let vlookup = PPUF_get_tile(VRAM, io, io.bg3, (offset_x - 8) + (io.bg3.hoffset & 0xFFF8), io.bg3.voffset + 8);
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

		let tile_number = PPUF_get_tile(VRAM, io, self, hoffset, voffset);

		let mirror_x = tile_number & 0x4000 ? 7 : 0;
		let mirror_y = tile_number & 0x8000 ? 7 : 0;
		let tile_priority = self.priority[((tile_number & 0x2000) >>> 13) & 1];
		let palette_number = (tile_number >>> 10) & 7;
		let palette_index = (self.palette_base + (palette_number << self.palette_shift)) & 0xFF;

		if (tile_width === 4 && (((hoffset & 8) >>> 3) ^ +(mirror_x !== 0))) tile_number += 1;
		if (tile_height === 4 && (((voffset & 8) >>> 3) ^ +(mirror_y !== 0))) tile_number += 16;
		tile_number = ((tile_number & 0x3FF) + self.tiledata_index) & tile_mask;

		let address = (tile_number << color_shift) + ((voffset & 7) ^ mirror_y) & 0x7FFF;

		// Javascript only has 54 bits for integers. Algorithm wants 64.
		let datalo = (VRAM[(address + 8) & 0x7FFF] << 16) | (VRAM[address]);
		let datahi = (VRAM[(address + 24) & 0x7FFF] << 16) | (VRAM[(address + 16) & 0x7FFF]);
		let datamid = ((datalo >>> 16) & 0xFFFF) | ((datahi << 16) & 0xFFFF0000); // upper 16 bits of data lo or lower 16 bits of data high
		for (let tile_x = 0; tile_x < 8; tile_x++, x++) {
			if (x < 0 || x >= width) continue; // x < 0 || x >= width
			let color;
			if (--mosaic_counter === 0) {
				let shift = mirror_x ? tile_x : 7 - tile_x;
				{
					color = (datalo >>> shift) & 1;
					color += (datalo >>> (shift + 7)) & 2; // 0-2 + 7-9
				}
				if (self.tile_mode >= PPU_tile_mode.BPP4) {
					color += (datalo >>> (shift + 14)) & 4; // bits 16-24
					color += (datalo >>> (shift + 21)) & 8; // bits 24-31
				}
				if (self.tile_mode >= PPU_tile_mode.BPP8) {
					color += (datamid >>> (shift + 12)) & 16;
					color += (datamid >>> (shift + 19)) & 32;
					color += (datahi >>> (shift + 10)) & 64;
					color += (datahi >>> (shift + 17)) & 128;
				}

				mosaic_counter = self.mosaic_enable ? io.mosaic.size << hires : 1;
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
				if (dbg.render_windows) {
					if (self.above_enable && !self.window_above[x] && mosaic_priority > above[x].priority)
					//if (tbg.above_enable && mosaic_priority > above[x].priority)
						above[x].set(source, mosaic_priority, mosaic_color);
					if (self.below_enable && !self.window_below[x] && mosaic_priority > below[x].priority)
					//if (tbg.below_enable && mosaic_priority > below[x].priority)
						below[x].set(source, mosaic_priority, mosaic_color);
				}
				else {
					if (self.above_enable && mosaic_priority > above[x].priority)
						above[x].set(source, mosaic_priority, mosaic_color);
					if (self.below_enable && mosaic_priority > below[x].priority)
						below[x].set(source, mosaic_priority, mosaic_color);
				}
			} else {
				let bx = x >>> 1;
				if (x & 1) {
					if (self.above_enable && !self.window_above[bx] && mosaic_priority > above[bx].priority) above[bx].set(source, mosaic_priority, mosaic_color);
				} else {
					if (self.below_enable && !self.window_below[bx] && mosaic_priority > below[bx].priority) below[bx].set(source, mosaic_priority, mosaic_color);
				}
			}
		}
	}
}

function PPUF_render_mode7(self, ppuy, source, io, VRAM, CGRAM, above, below) {
	//if (!self.mosaic_enable || !io.mosaic.size === 1)
	if (dbg.watch_on) console.log('M7!');
	let Y = ppuy;
	if (self.mosaic_enable) Y -= io.mosaic.size - io.mosaic.counter;
	let y = !io.mode7.vflip ? Y : 255 - Y;

	let a = io.mode7.a;
	let b = io.mode7.b;
	let c = io.mode7.c;
	let d = io.mode7.d;
	let hcenter = io.mode7.rx;
	let vcenter = io.mode7.ry;
	let hoffset = io.mode7.rhoffset;
	let voffset = io.mode7.rvoffset;
	let clip = function(n) { return n & 0x2000 ? (n & 0xFC00) : (n & 1023); }
	let hohc = (hoffset - hcenter);
	let vovc = (voffset - vcenter)

	let mosaic_counter = 1;
	let mosaic_palette = 0;
	let mosaic_priority = 0;
	let mosaic_color = 0;

	let origin_x = (a * hohc & ~63) + (b * vovc & ~63) + (b * y & ~63) + (hcenter << 8);
	let origin_y = (c * hohc & ~63) + (d * vovc & ~63) + (d * y & ~63) + (vcenter << 8);

	PPUF_window_render_layer(self.window, self.window.above_enable, self.window_above, io);
	PPUF_window_render_layer(self.window, self.window.below_enable, self.window_below, io);

	for (let X = 0; X < 256; X++) {
		let x = !io.mode7.hflip ? X : 255 - X;
		let pixel_x = origin_x + a * x >>> 8;
		let pixel_y = origin_y + c * x >>> 8;
		let tile_x = (pixel_x >>> 3) & 127;
		let tile_y = (pixel_y >>> 3) & 127;
		let out_of_bounds = +(((pixel_x | pixel_y) & 0xFC00) === 0)
		let tile_address = tile_y * 128 + tile_x;
		let palette_address = ((pixel_y & 7) << 3) + (pixel_x & 7);
		let tile = ((io.mode7.repeat === 3) && out_of_bounds) ? 0 : VRAM[tile_address & 0x7FFF];
		let palette = ((io.mode7.repeat === 2) && out_of_bounds) ? 0 : VRAM[(tile << 6 | palette_address) & 0x7FFF] >>> 8;

		let priority;
		if (source === PPU_source.BG1) {
			priority = self.priority[0];
		} else if (source === PPU_source.BG2) {
			priority = self.priority[palette >> 7];
			palette &= 0x7F;
		}

		if (--mosaic_counter === 0) {
			mosaic_counter = self.mosaic_enable ? io.mosaic.size : 1;
			mosaic_palette = palette;
			mosaic_priority = priority;
			if (io.col.direct_color && source === PPU_source.BG1) {
				mosaic_color = PPU_direct_color(0, palette);
			} else {
				//if (dbg.watch_on) console.log('MOSAIC COLOR', mosaic_color);
				mosaic_color = CGRAM[palette];
			}
		}
		//if (dbg.watch_on) console.log('MOSAIC PALETTE', mosaic_palette);
		if (!mosaic_palette) {
			continue;
		}
		//if (dbg.watch_on) console.log(self.above_enable, self.window_below[X], mosaic_priority, mosaic_color, mosaic_palette, source);

		if (self.above_enable && !self.window_above[X] && (mosaic_priority > above[X].priority)) above[X].set(source, mosaic_priority, mosaic_color);
		if (self.below_enable && !self.window_below[X] && (mosaic_priority > below[X].priority)) below[X].set(source, mosaic_priority, mosaic_color);
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
			this.objects.push(new PPU_object);
		}

		this.ppu_inc = [1, 32, 128, 128];
		this.items = [];
		this.tiles = [];
		for (let i = 0; i < 128; i++) {
			this.items[i] = new PPU_object_item();
			this.tiles[i] = new PPU_object_tile();
		}

		this.cachelines = new PPU_cache();
		this.cache = this.cachelines.getl();
	}

	present() {
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
				let ppuo = this.output[ppui];
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

	reg_read(addr, val, have_effect= true) {
		//if ((addr - 0x3F) & 0x3F) { return this.mem_map.read_apu(addr, val); }
		if (addr >= 0x2140 && addr < 0x217F) { return this.mem_map.read_apu(addr, val, have_effect); }
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
				let r = this.mem_map.dispatch_read(0x7E0000 | this.io.wram_addr, have_effect);
				if (have_effect) {
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

	render_scanline(force=false) {
		// render background lines
		let width = 256;
		let y = this.clock.scanline.ppu_y;
		let mosaic_enable = this.cache.bg1.mosaic_enable || this.cache.bg2.mosaic_enable || this.cache.bg3.mosaic_enable || this.cache.bg4.mosaic_enable;
		if (y === 1)
			this.cache.mosaic.counter = mosaic_enable ? this.cache.mosaic.size + 1 : 0;
		if (this.cache.mosaic.counter && --this.cache.mosaic.counter)
			this.cache.mosaic.counter = mosaic_enable ? this.cache.mosaic.size : 0;
		let output = y * 256;
		//console.log('ENABLED?', y, !this.clock.scanline.fblank);

		if (this.clock.scanline.fblank) {
			//this.output.fill(0);
			for (let x = 0; x < 256; x++) {
				this.output[x+y] = 0;
			}
			return;
		}

		let hires = this.cache.pseudo_hires || this.cache.bg_mode === 5 || this.cache.bg_mode === 6;
		let above_color = this.CGRAM[0];
		let below_color = hires ? this.CGRAM[0] : this.cache.col.fixed_color;
		for (let x = 0; x < 256; x++) {
			this.above[x].set(PPU_source.COL, 0, above_color);
			this.below[x].set(PPU_source.COL, 0, below_color);
		}

		dbg.cur_bg = 1;
		if (dbg.bg1_on) PPUF_render_bg(this.cache.bg1, this.clock.scanline.ppu_y, PPU_source.BG1, this.cache, this.VRAM, this.CGRAM, this.above, this.below);
		dbg.cur_bg = 2;
		if (this.cache.extbg === 0) if (dbg.bg2_on) PPUF_render_bg(this.cache.bg2, this.clock.scanline.ppu_y, PPU_source.BG2, this.cache, this.VRAM, this.CGRAM, this.above, this.below);
		dbg.cur_bg = 3;
		if (dbg.bg3_on) PPUF_render_bg(this.cache.bg3, this.clock.scanline.ppu_y, PPU_source.BG3, this.cache, this.VRAM, this.CGRAM, this.above, this.below, true);
		dbg.cur_bg = 4;
		if (dbg.bg4_on) PPUF_render_bg(this.cache.bg4, this.clock.scanline.ppu_y, PPU_source.BG4, this.cache, this.VRAM, this.CGRAM, this.above, this.below);
		dbg.cur_bg = 5;
		if (dbg.obj_on) PPUF_render_objects(this, this.clock.scanline.ppu_y, this.cache.obj, false);
		// renderObjects here
		dbg.cur_bg = 2;
		if (this.cache.extbg === 1) if (dbg.bg2_on) PPUF_render_bg(this.cache.bg2, this.clock.scanline.ppu_y, PPU_source.BG2, this.cache, this.VRAM, this.CGRAM, this.above, this.below);
		// render background color windows here
		if (dbg.render_windows) {
			PPUF_window_render_layer_mask(this.cache.col.window, this.cache.col.window.above_mask, this.window_above, this.cache);
			PPUF_window_render_layer_mask(this.cache.col.window, this.cache.col.window.below_mask, this.window_below, this.cache);
		}

		let luma = this.light_table[this.cache.display_brightness];
		let cur = 0;
		let prev = 0;

		for (let x = 0; x < 256; x++) {
			//let logit = false;
			//if (this.above[x].color !== 0 || this.below[x].color !== 0) {
				//console.log('ABOVE, BELOW', this.above[x].color, this.below[x].color);
				//logit = true;
			//}
			let px = this.pixel(x, this.above[x], this.below[x], false);
			//this.output[output++] = px;
			this.output[output++] = luma[[px]];
			//if (logit) console.log('PIXEL WAS', px, luma[px]);
			//if (logit) console.log('OUTPUT IS NOW', this.output[output-1]);
		}

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

	pixel(x, above, below, logit=false) {
		//return this.blend(above.color, below.color, this.cache.col.halve);
		if (!dbg.render_windows) {
			if (!this.cache.col.blend_mode) {
				return this.blend(above.color, this.cache.col.fixed_color, this.cache.col.halve && this.window_above[x]);
			}
			return this.blend(above.color, below.color, this.cache.col.halve && this.window_above[x] && below.source !== PPU_source.COL);
		}

		if (!this.window_above[x]) {
			if (logit) console.log('SET ABOVE 0');
			above.color = 0;
		}
		if (!this.window_below[x]) {
			if (logit) console.log('RETURN ABOVE COLOR');
			return above.color;
		}
		if (!this.cache.col.enable[above.source]) {
			if (logit) console.log('RETURN ABOVE COLOR');
			return above.color;
		}
		if (!this.cache.col.blend_mode) {
			if (logit) console.log('BLEND IT1');
			return this.blend(above.color, this.cache.col.fixed_color, this.cache.col.halve && this.window_above[x]);
		}
		if (logit) console.log('BLEND IT2');
		return this.blend(above.color, below.color, this.cache.col.halve && this.window_above[x] && below.source !== PPU_source.COL);
	}

	catch_up() {
		// We aren't actually emulating PPU yet
		this.clock.ppu_deficit = 0;
	}

}
