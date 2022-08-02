"use strict";

/*
 The point of this here fancy .js
 Is to prototype potential approaches to a GLSL shader, by doing all pixel math inside one function
 Or, by rendering to several buffers in sequence.
 It's also here to help with the software rendering multi-threading speed-up.
 Regardless, this is going to be slow on CPU, but massively paralellized may
  be quite fast.
 */


// This caches PPU registers at each visible scanline
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
                window_above: new Uint8Array(256),
                window_below: new Uint8Array(256),
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

class PPU_cache {
    constructor() {
        this.lines = PPU_cache_lines();
        this.VRAM = new Uint16Array(0x8000);
        this.CGRAM = new Uint16Array(0x100);
        this.OAM = new Uint8Array(544);

        this.current_l = this.lines[0];
        this.current_y = 0;
    }


    getl() {
        return this.current_l;
    }

    latch_line() {
        this.current_y++;
        if (this.current_y > 240) {
            // do nothing
        } else {
            this.copy(this.current_y-1, this.current_y);
            this.current_l = this.lines[this.current_y];
        }
    }

    getcur() {
        return this.current_y <= 240 ? this.current_y : 240;
    }

    latch_frame(VRAM, CGRAM, OAM) {
        this.VRAM = [...VRAM];
        this.CGRAM = [...CGRAM];
        this.OAM = [...OAM];
        this.copy(this.getcur(), 0);
        this.current_y = 0;
        this.current_l = this.lines[this.current_y];
    }

    copy(from, to) {
        this.lines[to] = structuredClone(this.lines[from]);
        this.lines[to].control.y = to;
    }

}

function get_pixel(screen_y, screen_x, VRAM, CGRAM, OAM, io_cache) {

}