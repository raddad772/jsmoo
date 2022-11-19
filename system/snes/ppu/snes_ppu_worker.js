"use strict";

function PPU_worker_function()
{
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

const PPU_ITEM_LIMIT = 32;
const PPU_TILE_LIMIT = 34;
const PPU_obj_widths = [[8, 8, 8, 16, 16, 32, 16, 16], [16, 32, 64, 32, 64, 64, 32, 32]];
const PPU_obj_heights = [[8, 8, 8, 16, 16, 32, 32, 32], [16, 32, 64, 32, 64, 64, 64, 32]];

function PPU_cache_lines() {
    let linefunc = function(y) {
        let windowfunc = function() {
            return {
                one_enable: 0,
                one_invert: 0,
                two_enable: 0,
                two_invert: 0,
                mask: 0,
                above_enable: 0,
                below_enable: 0,

                above_mask: 0,
                below_mask: 0,

                one_left: 0,
                one_right: 0,
                two_left: 0,
                two_right: 0
            };
        };
        let bgfunc = function(layer) {
            return {
                layer: layer,
                window: windowfunc(),
                above_enable: 0,
                below_enable: 0,
                mosaic_enable: 0,
                tiledata_addr: 0,
                screen_addr: 0,
                screen_size: 0,
                tile_size: 0,
                hoffset: 0,
                voffset: 0,
                tile_mode: 0,
                priority: [0, 0]
            };
        };
        return {
            control: {
                y: 0,
                field: 0,
                num_lines: 0
            },
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
                voffset: 0,
                rx: 0,
                ry: 0,
                rhoffset: 0,
                rvoffset: 0
            },
            obj: {
                window: windowfunc(),
                name_select: 0,
                tile_addr: 0,
                first: 0,
                interlace: 0,
                above_enable: 0,
                below_enable: 0,
                base_size: 0,
                range_over: 0,
                time_over: 0,
                priority: [0, 0, 0, 0]
            },
            col: {
                window: windowfunc(),
                enable: [0, 0, 0, 0, 0, 0, 0],
                direct_color: 0,
                blend_mode: 0,
                halve: 0,
                math_mode: 0,
                fixed_color: 0
            },

            bg1: bgfunc(1),
            bg2: bgfunc(2),
            bg3: bgfunc(3),
            bg4: bgfunc(4),
            window: windowfunc(),
            oam_addr: 0,
            oam_base_addr: 0,
            oam_priority: 0,

            overscan: 0,
            pseudo_hires: 0,
            extbg: 0,

            bg_mode: 0,
            bg_priority: 0,
            display_brightness: 0,
            display_disable: 0,
        }
    }

    let lines = new Array(240);

    for (let y = 0; y <= 240; y++) {
        lines[y] = linefunc(y);
    }
    return lines;
}

let PPUW_lines = PPU_cache_lines();

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

let PPUF_window_above = new Uint8Array(256);
let PPUF_window_below = new Uint8Array(256);
let PPUW_light_table = [];

for (let l = 0; l < 16; l++) {
	PPUW_light_table[l] = new Uint16Array(32768);
	for (let r = 0; r < 32; r++) {
		for (let g = 0; g < 32; g++) {
			for (let b = 0; b < 32; b++) {
				let luma = l / 15.0;
				let ar = Math.floor(luma * r + 0.5);
				let ag = Math.floor(luma * g + 0.5);
				let ab = Math.floor(luma * b + 0.5)
				PPUW_light_table[l][(r << 10) | (g << 5) | b] = ((ab << 10) | (ag << 5) | (ar));
			}
		}
	}
}


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

let PPUF_items = [];
let PPUF_tiles = [];
for (let i = 0; i < 128; i++) {
	PPUF_items[i] = new PPU_object_item();
	PPUF_tiles[i] = new PPU_object_tile();
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


function PPUF_render_scanline(y, datacache, cache, above, below, output_array, VRAM, CGRAM, output) {
	// render background lines
	let width = 256;
	//let y = this.clock.ppu_y;
	//let cache = cachelines[y];
	//let output = y * 256;
	//console.log('ENABLED?', y, !this.clock.fblank);

    //debugger;
    if (cache.display_disable) {
		for (let x = 0; x < 256; x++) {
			output_array[output+x] = 0;
		}
		return;
	}

	let hires = cache.pseudo_hires || cache.bg_mode === 5 || cache.bg_mode === 6;
	let above_color = CGRAM[0];
	let below_color = hires ? CGRAM[0] : cache.col.fixed_color;
	for (let x = 0; x < 256; x++) {
		above[x].set(PPU_source.COL, 0, above_color);
		below[x].set(PPU_source.COL, 0, below_color);
	}

	PPUF_render_bg(cache.bg1, y, PPU_source.BG1, cache, VRAM, CGRAM, above, below);
	if (cache.extbg === 0)
	PPUF_render_bg(cache.bg2, y, PPU_source.BG2, cache, VRAM, CGRAM, above, below);
	PPUF_render_bg(cache.bg3, y, PPU_source.BG3, cache, VRAM, CGRAM, above, below, true);
	PPUF_render_bg(cache.bg4, y, PPU_source.BG4, cache, VRAM, CGRAM, above, below);

	// SPRITES!
	PPUF_render_objects(datacache, cache, y, above, below, VRAM, CGRAM);

	// renderObjects here
	if (cache.extbg === 1)
		PPUF_render_bg(cache.bg2, y, PPU_source.BG2, cache, VRAM, CGRAM, above, below);
		PPUF_window_render_layer_mask(cache.col.window, cache.col.window.above_mask, PPUF_window_above, cache);
		PPUF_window_render_layer_mask(cache.col.window, cache.col.window.below_mask, PPUF_window_below, cache);

	let luma = PPUW_light_table[cache.display_brightness];
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
		output.fill(0);
		return;
	}

	if (window.one_enable && !window.two_enable) {
		let set = 1 ^ window.one_invert;
		let clear = +(!set);
		for (let x in output) {
			output[x] = x >= io.window.one_left && x <= io.window.one_right ? set : clear;
		}
		return;
	}

	if (window.two_enable && !window.one_enable) {
		let set = 1 ^ window.two_invert;
		let clear = +(!set);
		for (let x in output) {
			output[x] = x >= io.window.two_left && x <= io.window.two_right ? set : clear;
		}
		return;
	}

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

function PPUF_render_objects(self, cache, ppu_y, above, below, VRAM, CGRAM)
{
	let obj = cache.obj;
	if (!obj.above_enable && !obj.below_enable) return;
	PPUF_window_render_layer(obj.window, obj.window.above_enable, PPUF_window_above, cache);
	PPUF_window_render_layer(obj.window, obj.window.below_enable, PPUF_window_below, cache);
	let item_count = 0;
	let tile_count = 0;
	for (let n = 0; n < PPU_ITEM_LIMIT; n++) {
		PPUF_items[n].valid = 0;
	}
	for (let n = 0; n < PPU_TILE_LIMIT; n++) {
		PPUF_tiles[n].valid = 0;
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
			PPUF_items[item_count - 1] = item;
		}
	}

	for (let n = PPU_ITEM_LIMIT - 1; n >= 0; n--) {
		let item = PPUF_items[n];
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
			tile.data = VRAM[addr];
			tile.data |= VRAM[(addr + 8) & 0x7FFF] << 16;

			if (tile_count++ >= PPU_TILE_LIMIT) break;
			PPUF_tiles[tile_count - 1] = tile;
		}
	}
	//if ((item_count>0 || tile_count>0) && (y < 241)) console.log('ITEM AND TILE COUNT', y, item_count, tile_count);

	cache.obj.range_over |= +(item_count > PPU_ITEM_LIMIT);
	cache.obj.time_over |= +(tile_count > PPU_TILE_LIMIT);

	let palette = new Array(256);
	let priority = new Array(256);
	for (let n = 0; n < PPU_TILE_LIMIT; n++) {
		let tile = PPUF_tiles[n];
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

	for (let x = 0; x < 256; x++) {
		if (!priority[x]) continue;
		let source = palette[x] < 192 ? PPU_source.OBJ1 : PPU_source.OBJ2;
		//console.log('SPR!', x, self.clock.ppu_y, palette[x], self.CRAM[palette[x]]);
		/*if (force) {
			//console.log('SETTING', x);
			//output[output + x] = self.CGRAM[palette[x]];
			//self.above[x].set(source, priority[x], self.CRAM[palette[x]]);
			//self.below[x].set(source, priority[x], self.CRAM[palette[x]]);
		} else {*/
			if (obj.above_enable && (PPUF_window_above[x] === 0) && priority[x] > above[x].priority) above[x].set(source, priority[x], CGRAM[palette[x]]);
			if (obj.below_enable && (PPUF_window_below[x] === 0) && priority[x] > below[x].priority) below[x].set(source, priority[x], CGRAM[palette[x]]);
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

				mosaic_counter = bg.mosaic_enable ? (io.mosaic.size << hires) : 1;
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
				mosaic_color = CGRAM[palette];
			}
		}
		if (!mosaic_palette) {
			continue;
		}

		if (self.above_enable && !PPUF_window_above[X] && (mosaic_priority > above[X].priority)) above[X].set(source, mosaic_priority, mosaic_color);
		if (self.below_enable && !PPUF_window_below[X] && (mosaic_priority > below[X].priority)) below[X].set(source, mosaic_priority, mosaic_color);
	}
}


    let PPUW_above = [];
    let PPUW_below = [];
    for (let i = 0; i < (256 * 9); i++) {
        PPUW_above[i] = new PPU_pixel();
        PPUW_below[i] = new PPU_pixel();
    }

	// Auto-generated function to deal with StructuredCopy overhead madness
	function deserialize_cache_lines(y_start, y_end, buffer, output) {
		for (let y = 0; y < (y_end - y_start); y++) {
			output[y].control.y = buffer[((y + y_start) * 256) + 0];
			output[y].control.field = buffer[((y + y_start) * 256) + 1];
			output[y].control.num_lines = buffer[((y + y_start) * 256) + 2];
			output[y].mosaic.size = buffer[((y + y_start) * 256) + 3];
			output[y].mosaic.counter = buffer[((y + y_start) * 256) + 4];
			output[y].mode7.hflip = buffer[((y + y_start) * 256) + 5];
			output[y].mode7.vflip = buffer[((y + y_start) * 256) + 6];
			output[y].mode7.repeat = buffer[((y + y_start) * 256) + 7];
			output[y].mode7.a = buffer[((y + y_start) * 256) + 8];
			output[y].mode7.b = buffer[((y + y_start) * 256) + 9];
			output[y].mode7.c = buffer[((y + y_start) * 256) + 10];
			output[y].mode7.d = buffer[((y + y_start) * 256) + 11];
			output[y].mode7.x = buffer[((y + y_start) * 256) + 12];
			output[y].mode7.y = buffer[((y + y_start) * 256) + 13];
			output[y].mode7.hoffset = buffer[((y + y_start) * 256) + 14];
			output[y].mode7.voffset = buffer[((y + y_start) * 256) + 15];
			output[y].mode7.rx = buffer[((y + y_start) * 256) + 16];
			output[y].mode7.ry = buffer[((y + y_start) * 256) + 17];
			output[y].mode7.rhoffset = buffer[((y + y_start) * 256) + 18];
			output[y].mode7.rvoffset = buffer[((y + y_start) * 256) + 19];
			output[y].obj.window.one_enable = buffer[((y + y_start) * 256) + 20];
			output[y].obj.window.one_invert = buffer[((y + y_start) * 256) + 21];
			output[y].obj.window.two_enable = buffer[((y + y_start) * 256) + 22];
			output[y].obj.window.two_invert = buffer[((y + y_start) * 256) + 23];
			output[y].obj.window.mask = buffer[((y + y_start) * 256) + 24];
			output[y].obj.window.above_enable = buffer[((y + y_start) * 256) + 25];
			output[y].obj.window.below_enable = buffer[((y + y_start) * 256) + 26];
			output[y].obj.window.above_mask = buffer[((y + y_start) * 256) + 27];
			output[y].obj.window.below_mask = buffer[((y + y_start) * 256) + 28];
			output[y].obj.window.one_left = buffer[((y + y_start) * 256) + 29];
			output[y].obj.window.one_right = buffer[((y + y_start) * 256) + 30];
			output[y].obj.window.two_left = buffer[((y + y_start) * 256) + 31];
			output[y].obj.window.two_right = buffer[((y + y_start) * 256) + 32];
			output[y].obj.name_select = buffer[((y + y_start) * 256) + 33];
			output[y].obj.tile_addr = buffer[((y + y_start) * 256) + 34];
			output[y].obj.first = buffer[((y + y_start) * 256) + 35];
			output[y].obj.interlace = buffer[((y + y_start) * 256) + 36];
			output[y].obj.above_enable = buffer[((y + y_start) * 256) + 37];
			output[y].obj.below_enable = buffer[((y + y_start) * 256) + 38];
			output[y].obj.base_size = buffer[((y + y_start) * 256) + 39];
			output[y].obj.range_over = buffer[((y + y_start) * 256) + 40];
			output[y].obj.time_over = buffer[((y + y_start) * 256) + 41];
			output[y].obj.priority[0] = buffer[((y + y_start) * 256) + 42];
			output[y].obj.priority[1] = buffer[((y + y_start) * 256) + 43];
			output[y].obj.priority[2] = buffer[((y + y_start) * 256) + 44];
			output[y].obj.priority[3] = buffer[((y + y_start) * 256) + 45];
			output[y].col.window.one_enable = buffer[((y + y_start) * 256) + 46];
			output[y].col.window.one_invert = buffer[((y + y_start) * 256) + 47];
			output[y].col.window.two_enable = buffer[((y + y_start) * 256) + 48];
			output[y].col.window.two_invert = buffer[((y + y_start) * 256) + 49];
			output[y].col.window.mask = buffer[((y + y_start) * 256) + 50];
			output[y].col.window.above_enable = buffer[((y + y_start) * 256) + 51];
			output[y].col.window.below_enable = buffer[((y + y_start) * 256) + 52];
			output[y].col.window.above_mask = buffer[((y + y_start) * 256) + 53];
			output[y].col.window.below_mask = buffer[((y + y_start) * 256) + 54];
			output[y].col.window.one_left = buffer[((y + y_start) * 256) + 55];
			output[y].col.window.one_right = buffer[((y + y_start) * 256) + 56];
			output[y].col.window.two_left = buffer[((y + y_start) * 256) + 57];
			output[y].col.window.two_right = buffer[((y + y_start) * 256) + 58];
			output[y].col.enable[0] = buffer[((y + y_start) * 256) + 59];
			output[y].col.enable[1] = buffer[((y + y_start) * 256) + 60];
			output[y].col.enable[2] = buffer[((y + y_start) * 256) + 61];
			output[y].col.enable[3] = buffer[((y + y_start) * 256) + 62];
			output[y].col.enable[4] = buffer[((y + y_start) * 256) + 63];
			output[y].col.enable[5] = buffer[((y + y_start) * 256) + 64];
			output[y].col.enable[6] = buffer[((y + y_start) * 256) + 65];
			output[y].col.direct_color = buffer[((y + y_start) * 256) + 66];
			output[y].col.blend_mode = buffer[((y + y_start) * 256) + 67];
			output[y].col.halve = buffer[((y + y_start) * 256) + 68];
			output[y].col.math_mode = buffer[((y + y_start) * 256) + 69];
			output[y].col.fixed_color = buffer[((y + y_start) * 256) + 70];
			output[y].bg1.layer = buffer[((y + y_start) * 256) + 71];
			output[y].bg1.window.one_enable = buffer[((y + y_start) * 256) + 72];
			output[y].bg1.window.one_invert = buffer[((y + y_start) * 256) + 73];
			output[y].bg1.window.two_enable = buffer[((y + y_start) * 256) + 74];
			output[y].bg1.window.two_invert = buffer[((y + y_start) * 256) + 75];
			output[y].bg1.window.mask = buffer[((y + y_start) * 256) + 76];
			output[y].bg1.window.above_enable = buffer[((y + y_start) * 256) + 77];
			output[y].bg1.window.below_enable = buffer[((y + y_start) * 256) + 78];
			output[y].bg1.window.above_mask = buffer[((y + y_start) * 256) + 79];
			output[y].bg1.window.below_mask = buffer[((y + y_start) * 256) + 80];
			output[y].bg1.window.one_left = buffer[((y + y_start) * 256) + 81];
			output[y].bg1.window.one_right = buffer[((y + y_start) * 256) + 82];
			output[y].bg1.window.two_left = buffer[((y + y_start) * 256) + 83];
			output[y].bg1.window.two_right = buffer[((y + y_start) * 256) + 84];
			output[y].bg1.above_enable = buffer[((y + y_start) * 256) + 85];
			output[y].bg1.below_enable = buffer[((y + y_start) * 256) + 86];
			output[y].bg1.mosaic_enable = buffer[((y + y_start) * 256) + 87];
			output[y].bg1.tiledata_addr = buffer[((y + y_start) * 256) + 88];
			output[y].bg1.screen_addr = buffer[((y + y_start) * 256) + 89];
			output[y].bg1.screen_size = buffer[((y + y_start) * 256) + 90];
			output[y].bg1.tile_size = buffer[((y + y_start) * 256) + 91];
			output[y].bg1.hoffset = buffer[((y + y_start) * 256) + 92];
			output[y].bg1.voffset = buffer[((y + y_start) * 256) + 93];
			output[y].bg1.tile_mode = buffer[((y + y_start) * 256) + 94];
			output[y].bg1.priority[0] = buffer[((y + y_start) * 256) + 95];
			output[y].bg1.priority[1] = buffer[((y + y_start) * 256) + 96];
			output[y].bg2.layer = buffer[((y + y_start) * 256) + 97];
			output[y].bg2.window.one_enable = buffer[((y + y_start) * 256) + 98];
			output[y].bg2.window.one_invert = buffer[((y + y_start) * 256) + 99];
			output[y].bg2.window.two_enable = buffer[((y + y_start) * 256) + 100];
			output[y].bg2.window.two_invert = buffer[((y + y_start) * 256) + 101];
			output[y].bg2.window.mask = buffer[((y + y_start) * 256) + 102];
			output[y].bg2.window.above_enable = buffer[((y + y_start) * 256) + 103];
			output[y].bg2.window.below_enable = buffer[((y + y_start) * 256) + 104];
			output[y].bg2.window.above_mask = buffer[((y + y_start) * 256) + 105];
			output[y].bg2.window.below_mask = buffer[((y + y_start) * 256) + 106];
			output[y].bg2.window.one_left = buffer[((y + y_start) * 256) + 107];
			output[y].bg2.window.one_right = buffer[((y + y_start) * 256) + 108];
			output[y].bg2.window.two_left = buffer[((y + y_start) * 256) + 109];
			output[y].bg2.window.two_right = buffer[((y + y_start) * 256) + 110];
			output[y].bg2.above_enable = buffer[((y + y_start) * 256) + 111];
			output[y].bg2.below_enable = buffer[((y + y_start) * 256) + 112];
			output[y].bg2.mosaic_enable = buffer[((y + y_start) * 256) + 113];
			output[y].bg2.tiledata_addr = buffer[((y + y_start) * 256) + 114];
			output[y].bg2.screen_addr = buffer[((y + y_start) * 256) + 115];
			output[y].bg2.screen_size = buffer[((y + y_start) * 256) + 116];
			output[y].bg2.tile_size = buffer[((y + y_start) * 256) + 117];
			output[y].bg2.hoffset = buffer[((y + y_start) * 256) + 118];
			output[y].bg2.voffset = buffer[((y + y_start) * 256) + 119];
			output[y].bg2.tile_mode = buffer[((y + y_start) * 256) + 120];
			output[y].bg2.priority[0] = buffer[((y + y_start) * 256) + 121];
			output[y].bg2.priority[1] = buffer[((y + y_start) * 256) + 122];
			output[y].bg3.layer = buffer[((y + y_start) * 256) + 123];
			output[y].bg3.window.one_enable = buffer[((y + y_start) * 256) + 124];
			output[y].bg3.window.one_invert = buffer[((y + y_start) * 256) + 125];
			output[y].bg3.window.two_enable = buffer[((y + y_start) * 256) + 126];
			output[y].bg3.window.two_invert = buffer[((y + y_start) * 256) + 127];
			output[y].bg3.window.mask = buffer[((y + y_start) * 256) + 128];
			output[y].bg3.window.above_enable = buffer[((y + y_start) * 256) + 129];
			output[y].bg3.window.below_enable = buffer[((y + y_start) * 256) + 130];
			output[y].bg3.window.above_mask = buffer[((y + y_start) * 256) + 131];
			output[y].bg3.window.below_mask = buffer[((y + y_start) * 256) + 132];
			output[y].bg3.window.one_left = buffer[((y + y_start) * 256) + 133];
			output[y].bg3.window.one_right = buffer[((y + y_start) * 256) + 134];
			output[y].bg3.window.two_left = buffer[((y + y_start) * 256) + 135];
			output[y].bg3.window.two_right = buffer[((y + y_start) * 256) + 136];
			output[y].bg3.above_enable = buffer[((y + y_start) * 256) + 137];
			output[y].bg3.below_enable = buffer[((y + y_start) * 256) + 138];
			output[y].bg3.mosaic_enable = buffer[((y + y_start) * 256) + 139];
			output[y].bg3.tiledata_addr = buffer[((y + y_start) * 256) + 140];
			output[y].bg3.screen_addr = buffer[((y + y_start) * 256) + 141];
			output[y].bg3.screen_size = buffer[((y + y_start) * 256) + 142];
			output[y].bg3.tile_size = buffer[((y + y_start) * 256) + 143];
			output[y].bg3.hoffset = buffer[((y + y_start) * 256) + 144];
			output[y].bg3.voffset = buffer[((y + y_start) * 256) + 145];
			output[y].bg3.tile_mode = buffer[((y + y_start) * 256) + 146];
			output[y].bg3.priority[0] = buffer[((y + y_start) * 256) + 147];
			output[y].bg3.priority[1] = buffer[((y + y_start) * 256) + 148];
			output[y].bg4.layer = buffer[((y + y_start) * 256) + 149];
			output[y].bg4.window.one_enable = buffer[((y + y_start) * 256) + 150];
			output[y].bg4.window.one_invert = buffer[((y + y_start) * 256) + 151];
			output[y].bg4.window.two_enable = buffer[((y + y_start) * 256) + 152];
			output[y].bg4.window.two_invert = buffer[((y + y_start) * 256) + 153];
			output[y].bg4.window.mask = buffer[((y + y_start) * 256) + 154];
			output[y].bg4.window.above_enable = buffer[((y + y_start) * 256) + 155];
			output[y].bg4.window.below_enable = buffer[((y + y_start) * 256) + 156];
			output[y].bg4.window.above_mask = buffer[((y + y_start) * 256) + 157];
			output[y].bg4.window.below_mask = buffer[((y + y_start) * 256) + 158];
			output[y].bg4.window.one_left = buffer[((y + y_start) * 256) + 159];
			output[y].bg4.window.one_right = buffer[((y + y_start) * 256) + 160];
			output[y].bg4.window.two_left = buffer[((y + y_start) * 256) + 161];
			output[y].bg4.window.two_right = buffer[((y + y_start) * 256) + 162];
			output[y].bg4.above_enable = buffer[((y + y_start) * 256) + 163];
			output[y].bg4.below_enable = buffer[((y + y_start) * 256) + 164];
			output[y].bg4.mosaic_enable = buffer[((y + y_start) * 256) + 165];
			output[y].bg4.tiledata_addr = buffer[((y + y_start) * 256) + 166];
			output[y].bg4.screen_addr = buffer[((y + y_start) * 256) + 167];
			output[y].bg4.screen_size = buffer[((y + y_start) * 256) + 168];
			output[y].bg4.tile_size = buffer[((y + y_start) * 256) + 169];
			output[y].bg4.hoffset = buffer[((y + y_start) * 256) + 170];
			output[y].bg4.voffset = buffer[((y + y_start) * 256) + 171];
			output[y].bg4.tile_mode = buffer[((y + y_start) * 256) + 172];
			output[y].bg4.priority[0] = buffer[((y + y_start) * 256) + 173];
			output[y].bg4.priority[1] = buffer[((y + y_start) * 256) + 174];
			output[y].window.one_enable = buffer[((y + y_start) * 256) + 175];
			output[y].window.one_invert = buffer[((y + y_start) * 256) + 176];
			output[y].window.two_enable = buffer[((y + y_start) * 256) + 177];
			output[y].window.two_invert = buffer[((y + y_start) * 256) + 178];
			output[y].window.mask = buffer[((y + y_start) * 256) + 179];
			output[y].window.above_enable = buffer[((y + y_start) * 256) + 180];
			output[y].window.below_enable = buffer[((y + y_start) * 256) + 181];
			output[y].window.above_mask = buffer[((y + y_start) * 256) + 182];
			output[y].window.below_mask = buffer[((y + y_start) * 256) + 183];
			output[y].window.one_left = buffer[((y + y_start) * 256) + 184];
			output[y].window.one_right = buffer[((y + y_start) * 256) + 185];
			output[y].window.two_left = buffer[((y + y_start) * 256) + 186];
			output[y].window.two_right = buffer[((y + y_start) * 256) + 187];
			output[y].oam_addr = buffer[((y + y_start) * 256) + 188];
			output[y].oam_base_addr = buffer[((y + y_start) * 256) + 189];
			output[y].oam_priority = buffer[((y + y_start) * 256) + 190];
			output[y].overscan = buffer[((y + y_start) * 256) + 191];
			output[y].pseudo_hires = buffer[((y + y_start) * 256) + 192];
			output[y].extbg = buffer[((y + y_start) * 256) + 193];
			output[y].bg_mode = buffer[((y + y_start) * 256) + 194];
			output[y].bg_priority = buffer[((y + y_start) * 256) + 195];
			output[y].display_brightness = buffer[((y + y_start) * 256) + 196];
			output[y].display_disable = buffer[((y + y_start) * 256) + 197];
		}
	}


    onmessage = function (e) {
        //console.log('Worker ' + e.data.worker_num + ': Message received from main script');
		let msg = e.data;
        let y_start = msg.y_start;
        let y_end = msg.y_end;
        //console.log(msg.y_start, msg.y_end)
		let VRAM = new Uint16Array(msg.cache.VRAM_buffer);
		let CGRAM = new Uint16Array(msg.cache.CGRAM_buffer);
		let output = new Uint16Array(msg.cache.output_buffer);
		deserialize_cache_lines(y_start, y_end, new Int32Array(msg.cache.lines_sabuffer), PPUW_lines);
		//console.log(CGRAM);
		//console.log('VRAM', VRAM);

		for (let y = y_start; y < y_end; y++) {
            if (y > msg.bottom_line) {
				break;
			}
			let cline = PPUW_lines[y-y_start];
			PPUF_render_scanline(y, msg.cache, cline, PPUW_above, PPUW_below, output, VRAM, CGRAM, y*256);
        }

		msg.cache.atomic_int32[2]++;
		if (msg.cache.atomic_int32[2] >= msg.num_of_workers) {
			// Send message to present()
			//console.log('PRESENT!');
			postMessage({kind: 'present'});
			// Release lock
			msg.cache.atomic_int32[0] = 0;
			//msg.cache.atomic_int32[2] = 0;
		}
    }
}

// TODO: thissss
PPU_worker_function();

class SNES_PPU_worker {
    constructor() {
        // onMessage, PostMessage,
    }
}