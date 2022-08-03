"use strict";

function PPUF_blend(x, y, halve, math_mode) {
	if (!math_mode) { // add
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



function PPUF_pixel(x, cache, above, below, window_above, window_below) {
	//return this.blend(above.color, below.color, this.cache.col.halve);
	/*if (!dbg.render_windows) {
		if (!cache.col.blend_mode) {
			return PPUF_blend(above.color, cache.col.fixed_color, cache.col.halve && window_above[x], cache.col.math_mode);
		}
		return PPUF_blend(above.color, below.color, cache.col.halve && window_above[x] && below.source !== PPU_source.COL, cache.col.math_mode);
	}*/

	if (!window_above[x]) {
		above.color = 0;
	}
	if (!window_below[x]) {
		return above.color;
	}
	if (!cache.col.enable[above.source]) {
		return above.color;
	}
	if (!cache.col.blend_mode) {
		return PPUF_blend(above.color, cache.col.fixed_color, cache.col.halve && window_above[x], cache.col.math_mode);
	}
	return PPUF_blend(above.color, below.color, cache.col.halve && window_above[x] && below.source !== PPU_source.COL, cache.col.math_mode);
}


function PPUF_render_scanline(y, cachelines, above, below, light_table, output_array, output) {
	// render background lines
	let width = 256;
	//let y = this.clock.scanline.ppu_y;
	let cache = cachelines.lines[y];
	//let output = y * 256;
	//console.log('ENABLED?', y, !this.clock.scanline.fblank);

	if (cache.display_disable) {
		for (let x = 0; x < 256; x++) {
			output_array[output+x] = 0;
		}
		return;
	}

	let hires = cache.pseudo_hires || cache.bg_mode === 5 || cache.bg_mode === 6;
	let above_color = cachelines.CGRAM[0];
	let below_color = hires ? cachelines.CGRAM[0] : cache.col.fixed_color;
	for (let x = 0; x < 256; x++) {
		above[x].set(PPU_source.COL, 0, above_color);
		below[x].set(PPU_source.COL, 0, below_color);
	}

	//dbg.cur_bg = 1;
	//if (dbg.bg1_on)
	PPUF_render_bg(cache.bg1, y, PPU_source.BG1, cache, cachelines.VRAM, cachelines.CGRAM, above, below);
	//dbg.cur_bg = 2;
	if (cache.extbg === 0)// if (dbg.bg2_on)
	PPUF_render_bg(cache.bg2, y, PPU_source.BG2, cache, cachelines.VRAM, cachelines.CGRAM, above, below);
	//dbg.cur_bg = 3;
	//if (dbg.bg3_on)
	PPUF_render_bg(cache.bg3, y, PPU_source.BG3, cache, cachelines.VRAM, cachelines.CGRAM, above, below, true);
	//dbg.cur_bg = 4;
	//if (dbg.bg4_on)
	PPUF_render_bg(cache.bg4, y, PPU_source.BG4, cache, cachelines.VRAM, cachelines.CGRAM, above, below);
	//dbg.cur_bg = 5;
	//if (dbg.obj_on)

	// SPRITES!
	PPUF_render_objects(cachelines, cache, y, above, below);

	// renderObjects here
	//dbg.cur_bg = 2;
	if (cache.extbg === 1)// if (dbg.bg2_on)
		PPUF_render_bg(cache.bg2, y, PPU_source.BG2, cache, cachelines.VRAM, cachelines.CGRAM, above, below);
	// render background color windows here
	//if (dbg.render_windows) {
		PPUF_window_render_layer_mask(cache.col.window, cache.col.window.above_mask, PPUF_window_above, cache);
		PPUF_window_render_layer_mask(cache.col.window, cache.col.window.below_mask, PPUF_window_below, cache);
	//}

	let luma = light_table[cache.display_brightness];
	let cur = 0;
	let prev = 0;

	for (let x = 0; x < 256; x++) {
		//let logit = false;
		//if (this.above[x].color !== 0 || this.below[x].color !== 0) {
			//console.log('ABOVE, BELOW', this.above[x].color, this.below[x].color);
			//logit = true;
		//}
		let px = PPUF_pixel(x, cache, above[x], below[x], PPUF_window_above, PPUF_window_below);
		//this.output[output++] = px;
		output_array[output++] = luma[px];
		//if (logit) console.log('PIXEL WAS', px, luma[px]);
		//if (logit) console.log('OUTPUT IS NOW', this.output[output-1]);
	}

}

/**
 * @param window
 * @param {number} mask
 * @param {Uint8Array} output
 * @param {*} io
 */
function PPUF_window_render_layer_mask(window, mask, output, io) {
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

	if (!window.one_enable && !window.two_enable) {
		output.fill(clear);
	}

	if (window.one_enable && !window.two_enable) {
		if (window.one_invert) {
			set ^= 1;
			clear ^= 1;
		}
		for (let x = 0; x < 256; x++) {
			output[x] = x >= io.window.one_left && x <= io.window.one_right ? set : clear;
		}
		return;
	}

	if (window.two_enable && !window.one_enable) {
		if (window.two_invert) {
			set ^= 1;
			clear ^= 1;
		}
		for (let x = 0; x < 256; x++) {
			output[x] = x >= io.window.two_left && x <= io.window.two_right ? set : clear;
		}
		return;
	}

	for (let x = 0; x < 256; x++) {
		let one_mask = (x >= io.window.one_left && x <= io.window.one_right) ^ window.one_invert;
		let two_mask = (x >= io.window.two_left && x <= io.window.two_right) ^ window.two_invert;
		switch(window.mask) {
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


function PPUF_window_render_layer(window, enable, output, io, extended_log=false) {
	if (!enable || (!window.one_enable && !window.two_enable)) {
		if (dbg.log_windows) console.log(snes.clock.scanline.ppu_y, dbg.cur_bg, 'FILL 0')
		output.fill(0);
		return;
	}
	if (dbg.log_windows) console.log(snes.clock.scanline.ppu_y, dbg.cur_bg, io.window.one_left, io.window.one_right, window.one_invert, window.one_enable, window.two_enable)

	if (window.one_enable && !window.two_enable) {
		let set = 1 ^ window.one_invert;
		let clear = +(!set);
		if (dbg.log_windows && extended_log) console.log('CASE 1 clear set', clear, set);
		for (let x in output) {
			output[x] = x >= io.window.one_left && x <= io.window.one_right ? set : clear;
		}
		return;
	}

	if (window.two_enable && !window.one_enable) {
		let set = 1 ^ window.two_invert;
		let clear = +(!set);
		if (dbg.log_windows && extended_log) console.log('CASE 2 clear set', clear, set);
		for (let x in output) {
			output[x] = x >= io.window.two_left && x <= io.window.two_right ? set : clear;
		}
		return;
	}

	if (dbg.log_windows && extended_log) console.log('CASE 3 left right', io.window.one_left, io.window.one_right);
	for (let x in output) {
		let one_mask = +(x >= io.window.one_left && x <= io.window.one_right) ^ window.one_invert;
		let two_mask = +(x >= io.window.two_left && x <= io.window.two_right) ^ window.two_invert;
		switch(window.mask) {
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
 * @param self
 * @param cache
 * @param {number} ppu_y
 * @param above
 * @param below
 */

function PPUF_render_objects(self, cache, ppu_y, above, below)
{
	let obj = cache.obj;
	if (!obj.above_enable && !obj.below_enable) return;
	PPUF_window_render_layer(obj.window, obj.window.above_enable, PPUF_window_above, cache);
	PPUF_window_render_layer(obj.window, obj.window.below_enable, PPUF_window_below, cache);
	//if (dbg.log_windows) console.log(obj.window);
	//if (dbg.log_windows) console.log(snes.clock.scanline.ppu_y, PPUF_window_above, PPUF_window_below);
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
		let height = item.height >>> cache.interlace;
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
		if (cache.interlace) y <<= 1;

		if (object.vflip) {
			if (item.width === item.height) {
				y = item.height - 1 - y;
			} else if (y < item.width) {
				y = item.width - 1 - y;
			} else {
				y = item.width + (item.width - 1) - (y - item.width);
			}
		}
		if (cache.interlace) {
			y = !object.vflip ? y + cache.control.field : y - cache.control.field;
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

	cache.obj.range_over |= +(item_count > PPU_ITEM_LIMIT);
	cache.obj.time_over |= +(tile_count > PPU_TILE_LIMIT);

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

	//if (force & dbg.watch_on) console.log(self.items, self.tiles);

	for (let x = 0; x < 256; x++) {
		if (!priority[x]) continue;
		let source = palette[x] < 192 ? PPU_source.OBJ1 : PPU_source.OBJ2;
		//console.log('SPR!', x, self.clock.scanline.ppu_y, palette[x], self.CRAM[palette[x]]);
		/*if (force) {
			//console.log('SETTING', x);
			//output[output + x] = self.CGRAM[palette[x]];
			//self.above[x].set(source, priority[x], self.CRAM[palette[x]]);
			//self.below[x].set(source, priority[x], self.CRAM[palette[x]]);
		} else {*/
			if (obj.above_enable && (PPUF_window_above[x] === 0) && priority[x] > above[x].priority) above[x].set(source, priority[x], self.CGRAM[palette[x]]);
			if (obj.below_enable && (PPUF_window_below[x] === 0) && priority[x] > below[x].priority) below[x].set(source, priority[x], self.CGRAM[palette[x]]);
		//}
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
function PPUF_render_bg(bg, y, source, io, VRAM, CGRAM, above, below, verbose = false) {
	if (!bg.above_enable && !bg.below_enable) return;
	if (bg.tile_mode === PPU_tile_mode.Mode7) return PPUF_render_mode7(bg, y, source, io, VRAM, CGRAM, above, below);
	if (bg.tile_mode === PPU_tile_mode.Inactive) return;

	//if (dbg.watch_on) console.log(bg);

	PPUF_window_render_layer(bg.window, bg.window.above_enable, PPUF_window_above, io);
	PPUF_window_render_layer(bg.window, bg.window.below_enable, PPUF_window_below, io);

	let hires = +(io.bg_mode === 5 || io.bg_mode === 6);
	let offset_per_tile_mode = io.bg_mode === 2 || io.bg_mode === 4 || io.bg_mode === 6;
	let direct_color_mode = io.col.direct_color && source === PPU_source.BG1 && (io.bg_mode === 3 || io.bg_mode === 4);
	let color_shift = 3 + bg.tile_mode;
	let width = 256 << hires;
	//console.log('RENDERING PPU y:', y, 'BG MODE', io.bg_mode);

	let tile_height = 3 + bg.tile_size;
	let tile_width = !hires ? tile_height : 4;
	let tile_mask = 0xFFF >>> bg.tile_mode;
	bg.tiledata_index = bg.tiledata_addr >>> (3 + bg.tile_mode);

	bg.palette_base = io.bg_mode === 0 ? source << 5 : 0;
	bg.palette_shift = 2 << bg.tile_mode;

	let hscroll = bg.hoffset;
	let vscroll = bg.voffset;
	let hmask = (width << bg.tile_size << +(!!(bg.screen_size & 1))) - 1;
	let vmask = (width << bg.tile_size << +(!!(bg.screen_size & 2))) - 1;

	if (hires) {
		hscroll <<= 1;
		if (io.interlace) y = y << 1 | +(cache.control.field && !bg.mosaic_enable);
	}
	if (bg.mosaic_enable) {
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

		let tile_number = PPUF_get_tile(VRAM, io, bg, hoffset, voffset);

		let mirror_x = tile_number & 0x4000 ? 7 : 0;
		let mirror_y = tile_number & 0x8000 ? 7 : 0;
		let tile_priority = bg.priority[((tile_number & 0x2000) >>> 13) & 1];
		let palette_number = (tile_number >>> 10) & 7;
		let palette_index = (bg.palette_base + (palette_number << bg.palette_shift)) & 0xFF;

		if (tile_width === 4 && (((hoffset & 8) >>> 3) ^ +(mirror_x !== 0))) tile_number += 1;
		if (tile_height === 4 && (((voffset & 8) >>> 3) ^ +(mirror_y !== 0))) tile_number += 16;
		tile_number = ((tile_number & 0x3FF) + bg.tiledata_index) & tile_mask;

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
				if (bg.tile_mode >= PPU_tile_mode.BPP4) {
					color += (datalo >>> (shift + 14)) & 4; // bits 16-24
					color += (datalo >>> (shift + 21)) & 8; // bits 24-31
				}
				if (bg.tile_mode >= PPU_tile_mode.BPP8) {
					color += (datamid >>> (shift + 12)) & 16;
					color += (datamid >>> (shift + 19)) & 32;
					color += (datahi >>> (shift + 10)) & 64;
					color += (datahi >>> (shift + 17)) & 128;
				}

				mosaic_counter = bg.mosaic_enable ? io.mosaic.size << hires : 1;
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
				if (bg.above_enable && !PPUF_window_above[x] && mosaic_priority > above[x].priority)
					above[x].set(source, mosaic_priority, mosaic_color);
				if (bg.below_enable && !PPUF_window_below[x] && mosaic_priority > below[x].priority)
					below[x].set(source, mosaic_priority, mosaic_color);
			} else {
				let bx = x >>> 1;
				if (x & 1) {
					if (bg.above_enable && !PPUF_window_above[bx] && mosaic_priority > above[bx].priority) above[bx].set(source, mosaic_priority, mosaic_color);
				} else {
					if (bg.below_enable && !PPUF_window_below[bx] && mosaic_priority > below[bx].priority) below[bx].set(source, mosaic_priority, mosaic_color);
				}
			}
		}
	}
}

function PPUF_render_mode7(self, ppuy, source, io, VRAM, CGRAM, above, below) {
	//if (!self.mosaic_enable || !io.mosaic.size === 1)
	//if (dbg.watch_on) console.log('M7!');
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

	PPUF_window_render_layer(self.window, self.window.above_enable, PPUF_window_above, io);
	PPUF_window_render_layer(self.window, self.window.below_enable, PPUF_window_below, io);

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
		//if (dbg.watch_on) console.log(self.above_enable, PPUF_window_below[X], mosaic_priority, mosaic_color, mosaic_palette, source);

		if (self.above_enable && !PPUF_window_above[X] && (mosaic_priority > above[X].priority)) above[X].set(source, mosaic_priority, mosaic_color);
		if (self.below_enable && !PPUF_window_below[X] && (mosaic_priority > below[X].priority)) below[X].set(source, mosaic_priority, mosaic_color);
	}
}
