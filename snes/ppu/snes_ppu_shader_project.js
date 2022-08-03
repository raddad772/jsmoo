"use strict";

/*
 The point of this here fancy .js
 Is to prototype potential approaches to a GLSL shader, by doing all pixel math inside one function
 Or, by rendering to several buffers in sequence.
 It's also here to help with the software rendering multi-threading speed-up.
 Regardless, this is going to be slow on CPU, but massively paralellized may
  be quite fast.
 */

function copy_shared_buf(dst, src) {
    /*for (let i = 0; i < src.length; i++) {
        dst[i] = src[i];
    }*/
    dst.set(src, 0);
}

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

class PPU_multithreaded_cache {
    constructor(ppu_present_func) {
        this.ppu_present_func = ppu_present_func;


        // Actual data that gets sent to threads
        this.data = {
            VRAM_buffer: new SharedArrayBuffer(0x8001 * 2),
            CGRAM_buffer: new SharedArrayBuffer(0x100 * 2),
            OAM_buffer: new SharedArrayBuffer(544),
            output_buffer: new SharedArrayBuffer(512 * 512 * 2),
            atomic_share: new SharedArrayBuffer(40),
            lines_sabuffer: new SharedArrayBuffer(256 * 4 * 241),
            objects: [],
            atomic_int32: null,
            VRAM: null,
            CGRAM: null,
            OAM: null,
            output: null
        }

        this.lines = PPU_cache_lines();
        this.lines_buffer = new Int32Array(this.data.lines_sabuffer);
        this.VRAM = new Uint16Array(this.data.VRAM_buffer);
        this.CGRAM = new Uint16Array(this.data.CGRAM_buffer);
        this.OAM = new Uint8Array(this.data.OAM_buffer);
        this.data.output = new Uint16Array(this.data.output_buffer);
        for (let i = 0; i < 128; i++) {
			this.data.objects.push(new PPU_object());
		}

		this.data.atomic_int32 = new Int32Array(this.data.atomic_share);
		// #0 is lock. 1 = frame being drawn, 0 = frame done.
		// #2 is workers finished. starts at 0, goes up to 8.
		this.data.atomic_int32[0] = 0;


        this.current_worker_number = 0;
        this.lines_per_worker = 240 / PPU_NUM_WORKERS;

		this.items = [];
		this.tiles = [];
		for (let i = 0; i < 128; i++) {
			this.items[i] = new PPU_object_item();
			this.tiles[i] = new PPU_object_tile();
		}

        this.current_l = this.lines[0];
        this.current_y = 0;
        this.current_w = 0;
        this.last_y = 0;

        this.workers = new Array(PPU_NUM_WORKERS);
		if (PPU_USE_WORKERS) {
			for (let w = 0; w < PPU_NUM_WORKERS; w++) {
				//this.workers[w] = new Worker('snes_ppu_worker.js');
				if (PPU_USE_BLOBWORKERS) {
					this.workers[w] = new Worker(URL.createObjectURL(new Blob(["(" + PPU_worker_function.toString() + ")()"], {type: 'text/javascript'})));
				} else {
					this.workers[w] = new Worker('snes_ppu_worker.js');
				}
				//const myWorker = new Worker("worker.js");
				this.workers[w].onmessage = this.on_worker_message.bind(this);
			}
		}



    }

	on_worker_message(e) {
		let msg = e.data;
		if (msg.kind === 'present') {
			this.ppu_present_func(this.data.output);
		}
        else {
            console.log('UNKNOWN MESSAGE!?');
        }
	}

    getl() {
        return this.current_l;
    }

    latch_line() {
        this.current_y++;
        if (this.current_y > 241) {
            // do nothing
        } else {
            if (this.current_y < 241) {
                this.copy(this.current_y - 1, this.current_y);
                this.current_l = this.lines[this.current_y];
            }
            if (PPU_USE_WORKERS) {
                this.ppu_worker_dispatch();
            }
        }
    }

    ppu_worker_dispatch() {
        if (this.current_y > (this.last_y + this.lines_per_worker)) {
            this.serialize_cache_lines(this.last_y, this.last_y+this.lines_per_worker);
            this.workers[this.current_worker_number].postMessage({
                worker_num: this.current_worker_number,
                bottom_line: snes.clock.scanline.bottom_scanline,
                y_start: this.last_y,
                y_end: this.last_y+this.lines_per_worker,
                cache: this.data,
                //cachelines: this.
                num_of_workers: PPU_NUM_WORKERS});
            this.last_y += this.lines_per_worker;
            this.current_worker_number++;
        }
    }

    getcur() {
        return this.current_y <= 240 ? this.current_y : 240;
    }

    wait_for_frame_done() {
        if (this.data.atomic_int32[0] === 1) {
            //console.log('ENTER BUSY LOOP');
            let start_time = new Date();
            while(this.data.atomic_int32[0] === 1) {
                let cur_time = new Date();
                if ((cur_time - start_time) > 3000) {
                    console.log('BUSY LOOP STALL!')
                    dbg.break();
                    return;
                }
            }
        }
    }

    copy_data(VRAM, CGRAM, OAM, objects) {
        copy_shared_buf(this.VRAM, VRAM);
        copy_shared_buf(this.CGRAM, CGRAM);
        copy_shared_buf(this.OAM, OAM);
        this.data.objects = objects;
    }

    latch_frame(VRAM, CGRAM, OAM, objects) {
        this.wait_for_frame_done();
        this.data.atomic_int32[0] = 1; // Frame lock. This will go to 0 when last frame finishes rendering.
        this.data.atomic_int32[2] = 0; // Worker responses

        /*this.VRAM = [...VRAM];
        this.CGRAM = [...CGRAM];
        this.OAM = [...OAM];*/
        this.copy_data(VRAM, CGRAM, OAM, objects);
        //this.VRAM.set(VRAM, 0);
        //this.CGRAM.set(CGRAM, 0);
        //this.OAM.set(OAM, 0);

        //this.data.objects.set(objects, 0);
        this.copy(this.getcur(), 0);
        this.current_y = 0;
        this.current_l = this.lines[this.current_y];
        this.current_worker_number = 0;
        this.last_y = 0;
    }

    // Auto-generated function, fastest way to do this I guess
    copy(from, to) {
        let oldto = to;
        to = this.lines[to];
        from = this.lines[from];
        to.control.y = from.control.y;
        to.control.field = from.control.field;
        to.control.num_lines = from.control.num_lines;
        to.mosaic.size = from.mosaic.size;
        to.mosaic.counter = from.mosaic.counter;
        to.mode7.hflip = from.mode7.hflip;
        to.mode7.vflip = from.mode7.vflip;
        to.mode7.repeat = from.mode7.repeat;
        to.mode7.a = from.mode7.a;
        to.mode7.b = from.mode7.b;
        to.mode7.c = from.mode7.c;
        to.mode7.d = from.mode7.d;
        to.mode7.x = from.mode7.x;
        to.mode7.y = from.mode7.y;
        to.mode7.hoffset = from.mode7.hoffset;
        to.mode7.voffset = from.mode7.voffset;
        to.mode7.rx = from.mode7.rx;
        to.mode7.ry = from.mode7.ry;
        to.mode7.rhoffset = from.mode7.rhoffset;
        to.mode7.rvoffset = from.mode7.rvoffset;
        to.obj.window.one_enable = from.obj.window.one_enable;
        to.obj.window.one_invert = from.obj.window.one_invert;
        to.obj.window.two_enable = from.obj.window.two_enable;
        to.obj.window.two_invert = from.obj.window.two_invert;
        to.obj.window.mask = from.obj.window.mask;
        to.obj.window.above_enable = from.obj.window.above_enable;
        to.obj.window.below_enable = from.obj.window.below_enable;
        to.obj.window.above_mask = from.obj.window.above_mask;
        to.obj.window.below_mask = from.obj.window.below_mask;
        to.obj.window.one_left = from.obj.window.one_left;
        to.obj.window.one_right = from.obj.window.one_right;
        to.obj.window.two_left = from.obj.window.two_left;
        to.obj.window.two_right = from.obj.window.two_right;
        to.obj.name_select = from.obj.name_select;
        to.obj.tile_addr = from.obj.tile_addr;
        to.obj.first = from.obj.first;
        to.obj.interlace = from.obj.interlace;
        to.obj.above_enable = from.obj.above_enable;
        to.obj.below_enable = from.obj.below_enable;
        to.obj.base_size = from.obj.base_size;
        to.obj.range_over = from.obj.range_over;
        to.obj.time_over = from.obj.time_over;
        to.obj.priority[0] = from.obj.priority[0];
        to.obj.priority[1] = from.obj.priority[1];
        to.obj.priority[2] = from.obj.priority[2];
        to.obj.priority[3] = from.obj.priority[3];
        to.col.window.one_enable = from.col.window.one_enable;
        to.col.window.one_invert = from.col.window.one_invert;
        to.col.window.two_enable = from.col.window.two_enable;
        to.col.window.two_invert = from.col.window.two_invert;
        to.col.window.mask = from.col.window.mask;
        to.col.window.above_enable = from.col.window.above_enable;
        to.col.window.below_enable = from.col.window.below_enable;
        to.col.window.above_mask = from.col.window.above_mask;
        to.col.window.below_mask = from.col.window.below_mask;
        to.col.window.one_left = from.col.window.one_left;
        to.col.window.one_right = from.col.window.one_right;
        to.col.window.two_left = from.col.window.two_left;
        to.col.window.two_right = from.col.window.two_right;
        to.col.enable[0] = from.col.enable[0];
        to.col.enable[1] = from.col.enable[1];
        to.col.enable[2] = from.col.enable[2];
        to.col.enable[3] = from.col.enable[3];
        to.col.enable[4] = from.col.enable[4];
        to.col.enable[5] = from.col.enable[5];
        to.col.enable[6] = from.col.enable[6];
        to.col.direct_color = from.col.direct_color;
        to.col.blend_mode = from.col.blend_mode;
        to.col.halve = from.col.halve;
        to.col.math_mode = from.col.math_mode;
        to.col.fixed_color = from.col.fixed_color;
        to.bg1.layer = from.bg1.layer;
        to.bg1.window.one_enable = from.bg1.window.one_enable;
        to.bg1.window.one_invert = from.bg1.window.one_invert;
        to.bg1.window.two_enable = from.bg1.window.two_enable;
        to.bg1.window.two_invert = from.bg1.window.two_invert;
        to.bg1.window.mask = from.bg1.window.mask;
        to.bg1.window.above_enable = from.bg1.window.above_enable;
        to.bg1.window.below_enable = from.bg1.window.below_enable;
        to.bg1.window.above_mask = from.bg1.window.above_mask;
        to.bg1.window.below_mask = from.bg1.window.below_mask;
        to.bg1.window.one_left = from.bg1.window.one_left;
        to.bg1.window.one_right = from.bg1.window.one_right;
        to.bg1.window.two_left = from.bg1.window.two_left;
        to.bg1.window.two_right = from.bg1.window.two_right;
        to.bg1.above_enable = from.bg1.above_enable;
        to.bg1.below_enable = from.bg1.below_enable;
        to.bg1.mosaic_enable = from.bg1.mosaic_enable;
        to.bg1.tiledata_addr = from.bg1.tiledata_addr;
        to.bg1.screen_addr = from.bg1.screen_addr;
        to.bg1.screen_size = from.bg1.screen_size;
        to.bg1.tile_size = from.bg1.tile_size;
        to.bg1.hoffset = from.bg1.hoffset;
        to.bg1.voffset = from.bg1.voffset;
        to.bg1.tile_mode = from.bg1.tile_mode;
        to.bg1.priority[0] = from.bg1.priority[0];
        to.bg1.priority[1] = from.bg1.priority[1];
        to.bg2.layer = from.bg2.layer;
        to.bg2.window.one_enable = from.bg2.window.one_enable;
        to.bg2.window.one_invert = from.bg2.window.one_invert;
        to.bg2.window.two_enable = from.bg2.window.two_enable;
        to.bg2.window.two_invert = from.bg2.window.two_invert;
        to.bg2.window.mask = from.bg2.window.mask;
        to.bg2.window.above_enable = from.bg2.window.above_enable;
        to.bg2.window.below_enable = from.bg2.window.below_enable;
        to.bg2.window.above_mask = from.bg2.window.above_mask;
        to.bg2.window.below_mask = from.bg2.window.below_mask;
        to.bg2.window.one_left = from.bg2.window.one_left;
        to.bg2.window.one_right = from.bg2.window.one_right;
        to.bg2.window.two_left = from.bg2.window.two_left;
        to.bg2.window.two_right = from.bg2.window.two_right;
        to.bg2.above_enable = from.bg2.above_enable;
        to.bg2.below_enable = from.bg2.below_enable;
        to.bg2.mosaic_enable = from.bg2.mosaic_enable;
        to.bg2.tiledata_addr = from.bg2.tiledata_addr;
        to.bg2.screen_addr = from.bg2.screen_addr;
        to.bg2.screen_size = from.bg2.screen_size;
        to.bg2.tile_size = from.bg2.tile_size;
        to.bg2.hoffset = from.bg2.hoffset;
        to.bg2.voffset = from.bg2.voffset;
        to.bg2.tile_mode = from.bg2.tile_mode;
        to.bg2.priority[0] = from.bg2.priority[0];
        to.bg2.priority[1] = from.bg2.priority[1];
        to.bg3.layer = from.bg3.layer;
        to.bg3.window.one_enable = from.bg3.window.one_enable;
        to.bg3.window.one_invert = from.bg3.window.one_invert;
        to.bg3.window.two_enable = from.bg3.window.two_enable;
        to.bg3.window.two_invert = from.bg3.window.two_invert;
        to.bg3.window.mask = from.bg3.window.mask;
        to.bg3.window.above_enable = from.bg3.window.above_enable;
        to.bg3.window.below_enable = from.bg3.window.below_enable;
        to.bg3.window.above_mask = from.bg3.window.above_mask;
        to.bg3.window.below_mask = from.bg3.window.below_mask;
        to.bg3.window.one_left = from.bg3.window.one_left;
        to.bg3.window.one_right = from.bg3.window.one_right;
        to.bg3.window.two_left = from.bg3.window.two_left;
        to.bg3.window.two_right = from.bg3.window.two_right;
        to.bg3.above_enable = from.bg3.above_enable;
        to.bg3.below_enable = from.bg3.below_enable;
        to.bg3.mosaic_enable = from.bg3.mosaic_enable;
        to.bg3.tiledata_addr = from.bg3.tiledata_addr;
        to.bg3.screen_addr = from.bg3.screen_addr;
        to.bg3.screen_size = from.bg3.screen_size;
        to.bg3.tile_size = from.bg3.tile_size;
        to.bg3.hoffset = from.bg3.hoffset;
        to.bg3.voffset = from.bg3.voffset;
        to.bg3.tile_mode = from.bg3.tile_mode;
        to.bg3.priority[0] = from.bg3.priority[0];
        to.bg3.priority[1] = from.bg3.priority[1];
        to.bg4.layer = from.bg4.layer;
        to.bg4.window.one_enable = from.bg4.window.one_enable;
        to.bg4.window.one_invert = from.bg4.window.one_invert;
        to.bg4.window.two_enable = from.bg4.window.two_enable;
        to.bg4.window.two_invert = from.bg4.window.two_invert;
        to.bg4.window.mask = from.bg4.window.mask;
        to.bg4.window.above_enable = from.bg4.window.above_enable;
        to.bg4.window.below_enable = from.bg4.window.below_enable;
        to.bg4.window.above_mask = from.bg4.window.above_mask;
        to.bg4.window.below_mask = from.bg4.window.below_mask;
        to.bg4.window.one_left = from.bg4.window.one_left;
        to.bg4.window.one_right = from.bg4.window.one_right;
        to.bg4.window.two_left = from.bg4.window.two_left;
        to.bg4.window.two_right = from.bg4.window.two_right;
        to.bg4.above_enable = from.bg4.above_enable;
        to.bg4.below_enable = from.bg4.below_enable;
        to.bg4.mosaic_enable = from.bg4.mosaic_enable;
        to.bg4.tiledata_addr = from.bg4.tiledata_addr;
        to.bg4.screen_addr = from.bg4.screen_addr;
        to.bg4.screen_size = from.bg4.screen_size;
        to.bg4.tile_size = from.bg4.tile_size;
        to.bg4.hoffset = from.bg4.hoffset;
        to.bg4.voffset = from.bg4.voffset;
        to.bg4.tile_mode = from.bg4.tile_mode;
        to.bg4.priority[0] = from.bg4.priority[0];
        to.bg4.priority[1] = from.bg4.priority[1];
        to.window.one_enable = from.window.one_enable;
        to.window.one_invert = from.window.one_invert;
        to.window.two_enable = from.window.two_enable;
        to.window.two_invert = from.window.two_invert;
        to.window.mask = from.window.mask;
        to.window.above_enable = from.window.above_enable;
        to.window.below_enable = from.window.below_enable;
        to.window.above_mask = from.window.above_mask;
        to.window.below_mask = from.window.below_mask;
        to.window.one_left = from.window.one_left;
        to.window.one_right = from.window.one_right;
        to.window.two_left = from.window.two_left;
        to.window.two_right = from.window.two_right;
        to.oam_addr = from.oam_addr;
        to.oam_base_addr = from.oam_base_addr;
        to.oam_priority = from.oam_priority;
        to.overscan = from.overscan;
        to.pseudo_hires = from.pseudo_hires;
        to.extbg = from.extbg;
        to.bg_mode = from.bg_mode;
        to.bg_priority = from.bg_priority;
        to.display_brightness = from.display_brightness;
        to.display_disable = from.display_disable;
        to.control.y = oldto;
    }

    // Auto-generated function to avoid StructuredCopy overhead
    serialize_cache_lines(y_start, y_end) {
        for (let y=y_start; y<y_end; y++) {
            this.lines_buffer[(y*256)+0] = this.lines[y].control.y;
            this.lines_buffer[(y*256)+1] = this.lines[y].control.field;
            this.lines_buffer[(y*256)+2] = this.lines[y].control.num_lines;
            this.lines_buffer[(y*256)+3] = this.lines[y].mosaic.size;
            this.lines_buffer[(y*256)+4] = this.lines[y].mosaic.counter;
            this.lines_buffer[(y*256)+5] = this.lines[y].mode7.hflip;
            this.lines_buffer[(y*256)+6] = this.lines[y].mode7.vflip;
            this.lines_buffer[(y*256)+7] = this.lines[y].mode7.repeat;
            this.lines_buffer[(y*256)+8] = this.lines[y].mode7.a;
            this.lines_buffer[(y*256)+9] = this.lines[y].mode7.b;
            this.lines_buffer[(y*256)+10] = this.lines[y].mode7.c;
            this.lines_buffer[(y*256)+11] = this.lines[y].mode7.d;
            this.lines_buffer[(y*256)+12] = this.lines[y].mode7.x;
            this.lines_buffer[(y*256)+13] = this.lines[y].mode7.y;
            this.lines_buffer[(y*256)+14] = this.lines[y].mode7.hoffset;
            this.lines_buffer[(y*256)+15] = this.lines[y].mode7.voffset;
            this.lines_buffer[(y*256)+16] = this.lines[y].mode7.rx;
            this.lines_buffer[(y*256)+17] = this.lines[y].mode7.ry;
            this.lines_buffer[(y*256)+18] = this.lines[y].mode7.rhoffset;
            this.lines_buffer[(y*256)+19] = this.lines[y].mode7.rvoffset;
            this.lines_buffer[(y*256)+20] = this.lines[y].obj.window.one_enable;
            this.lines_buffer[(y*256)+21] = this.lines[y].obj.window.one_invert;
            this.lines_buffer[(y*256)+22] = this.lines[y].obj.window.two_enable;
            this.lines_buffer[(y*256)+23] = this.lines[y].obj.window.two_invert;
            this.lines_buffer[(y*256)+24] = this.lines[y].obj.window.mask;
            this.lines_buffer[(y*256)+25] = this.lines[y].obj.window.above_enable;
            this.lines_buffer[(y*256)+26] = this.lines[y].obj.window.below_enable;
            this.lines_buffer[(y*256)+27] = this.lines[y].obj.window.above_mask;
            this.lines_buffer[(y*256)+28] = this.lines[y].obj.window.below_mask;
            this.lines_buffer[(y*256)+29] = this.lines[y].obj.window.one_left;
            this.lines_buffer[(y*256)+30] = this.lines[y].obj.window.one_right;
            this.lines_buffer[(y*256)+31] = this.lines[y].obj.window.two_left;
            this.lines_buffer[(y*256)+32] = this.lines[y].obj.window.two_right;
            this.lines_buffer[(y*256)+33] = this.lines[y].obj.name_select;
            this.lines_buffer[(y*256)+34] = this.lines[y].obj.tile_addr;
            this.lines_buffer[(y*256)+35] = this.lines[y].obj.first;
            this.lines_buffer[(y*256)+36] = this.lines[y].obj.interlace;
            this.lines_buffer[(y*256)+37] = this.lines[y].obj.above_enable;
            this.lines_buffer[(y*256)+38] = this.lines[y].obj.below_enable;
            this.lines_buffer[(y*256)+39] = this.lines[y].obj.base_size;
            this.lines_buffer[(y*256)+40] = this.lines[y].obj.range_over;
            this.lines_buffer[(y*256)+41] = this.lines[y].obj.time_over;
            this.lines_buffer[(y*256)+42] = this.lines[y].obj.priority[0];
            this.lines_buffer[(y*256)+43] = this.lines[y].obj.priority[1];
            this.lines_buffer[(y*256)+44] = this.lines[y].obj.priority[2];
            this.lines_buffer[(y*256)+45] = this.lines[y].obj.priority[3];
            this.lines_buffer[(y*256)+46] = this.lines[y].col.window.one_enable;
            this.lines_buffer[(y*256)+47] = this.lines[y].col.window.one_invert;
            this.lines_buffer[(y*256)+48] = this.lines[y].col.window.two_enable;
            this.lines_buffer[(y*256)+49] = this.lines[y].col.window.two_invert;
            this.lines_buffer[(y*256)+50] = this.lines[y].col.window.mask;
            this.lines_buffer[(y*256)+51] = this.lines[y].col.window.above_enable;
            this.lines_buffer[(y*256)+52] = this.lines[y].col.window.below_enable;
            this.lines_buffer[(y*256)+53] = this.lines[y].col.window.above_mask;
            this.lines_buffer[(y*256)+54] = this.lines[y].col.window.below_mask;
            this.lines_buffer[(y*256)+55] = this.lines[y].col.window.one_left;
            this.lines_buffer[(y*256)+56] = this.lines[y].col.window.one_right;
            this.lines_buffer[(y*256)+57] = this.lines[y].col.window.two_left;
            this.lines_buffer[(y*256)+58] = this.lines[y].col.window.two_right;
            this.lines_buffer[(y*256)+59] = this.lines[y].col.enable[0];
            this.lines_buffer[(y*256)+60] = this.lines[y].col.enable[1];
            this.lines_buffer[(y*256)+61] = this.lines[y].col.enable[2];
            this.lines_buffer[(y*256)+62] = this.lines[y].col.enable[3];
            this.lines_buffer[(y*256)+63] = this.lines[y].col.enable[4];
            this.lines_buffer[(y*256)+64] = this.lines[y].col.enable[5];
            this.lines_buffer[(y*256)+65] = this.lines[y].col.enable[6];
            this.lines_buffer[(y*256)+66] = this.lines[y].col.direct_color;
            this.lines_buffer[(y*256)+67] = this.lines[y].col.blend_mode;
            this.lines_buffer[(y*256)+68] = this.lines[y].col.halve;
            this.lines_buffer[(y*256)+69] = this.lines[y].col.math_mode;
            this.lines_buffer[(y*256)+70] = this.lines[y].col.fixed_color;
            this.lines_buffer[(y*256)+71] = this.lines[y].bg1.layer;
            this.lines_buffer[(y*256)+72] = this.lines[y].bg1.window.one_enable;
            this.lines_buffer[(y*256)+73] = this.lines[y].bg1.window.one_invert;
            this.lines_buffer[(y*256)+74] = this.lines[y].bg1.window.two_enable;
            this.lines_buffer[(y*256)+75] = this.lines[y].bg1.window.two_invert;
            this.lines_buffer[(y*256)+76] = this.lines[y].bg1.window.mask;
            this.lines_buffer[(y*256)+77] = this.lines[y].bg1.window.above_enable;
            this.lines_buffer[(y*256)+78] = this.lines[y].bg1.window.below_enable;
            this.lines_buffer[(y*256)+79] = this.lines[y].bg1.window.above_mask;
            this.lines_buffer[(y*256)+80] = this.lines[y].bg1.window.below_mask;
            this.lines_buffer[(y*256)+81] = this.lines[y].bg1.window.one_left;
            this.lines_buffer[(y*256)+82] = this.lines[y].bg1.window.one_right;
            this.lines_buffer[(y*256)+83] = this.lines[y].bg1.window.two_left;
            this.lines_buffer[(y*256)+84] = this.lines[y].bg1.window.two_right;
            this.lines_buffer[(y*256)+85] = this.lines[y].bg1.above_enable;
            this.lines_buffer[(y*256)+86] = this.lines[y].bg1.below_enable;
            this.lines_buffer[(y*256)+87] = this.lines[y].bg1.mosaic_enable;
            this.lines_buffer[(y*256)+88] = this.lines[y].bg1.tiledata_addr;
            this.lines_buffer[(y*256)+89] = this.lines[y].bg1.screen_addr;
            this.lines_buffer[(y*256)+90] = this.lines[y].bg1.screen_size;
            this.lines_buffer[(y*256)+91] = this.lines[y].bg1.tile_size;
            this.lines_buffer[(y*256)+92] = this.lines[y].bg1.hoffset;
            this.lines_buffer[(y*256)+93] = this.lines[y].bg1.voffset;
            this.lines_buffer[(y*256)+94] = this.lines[y].bg1.tile_mode;
            this.lines_buffer[(y*256)+95] = this.lines[y].bg1.priority[0];
            this.lines_buffer[(y*256)+96] = this.lines[y].bg1.priority[1];
            this.lines_buffer[(y*256)+97] = this.lines[y].bg2.layer;
            this.lines_buffer[(y*256)+98] = this.lines[y].bg2.window.one_enable;
            this.lines_buffer[(y*256)+99] = this.lines[y].bg2.window.one_invert;
            this.lines_buffer[(y*256)+100] = this.lines[y].bg2.window.two_enable;
            this.lines_buffer[(y*256)+101] = this.lines[y].bg2.window.two_invert;
            this.lines_buffer[(y*256)+102] = this.lines[y].bg2.window.mask;
            this.lines_buffer[(y*256)+103] = this.lines[y].bg2.window.above_enable;
            this.lines_buffer[(y*256)+104] = this.lines[y].bg2.window.below_enable;
            this.lines_buffer[(y*256)+105] = this.lines[y].bg2.window.above_mask;
            this.lines_buffer[(y*256)+106] = this.lines[y].bg2.window.below_mask;
            this.lines_buffer[(y*256)+107] = this.lines[y].bg2.window.one_left;
            this.lines_buffer[(y*256)+108] = this.lines[y].bg2.window.one_right;
            this.lines_buffer[(y*256)+109] = this.lines[y].bg2.window.two_left;
            this.lines_buffer[(y*256)+110] = this.lines[y].bg2.window.two_right;
            this.lines_buffer[(y*256)+111] = this.lines[y].bg2.above_enable;
            this.lines_buffer[(y*256)+112] = this.lines[y].bg2.below_enable;
            this.lines_buffer[(y*256)+113] = this.lines[y].bg2.mosaic_enable;
            this.lines_buffer[(y*256)+114] = this.lines[y].bg2.tiledata_addr;
            this.lines_buffer[(y*256)+115] = this.lines[y].bg2.screen_addr;
            this.lines_buffer[(y*256)+116] = this.lines[y].bg2.screen_size;
            this.lines_buffer[(y*256)+117] = this.lines[y].bg2.tile_size;
            this.lines_buffer[(y*256)+118] = this.lines[y].bg2.hoffset;
            this.lines_buffer[(y*256)+119] = this.lines[y].bg2.voffset;
            this.lines_buffer[(y*256)+120] = this.lines[y].bg2.tile_mode;
            this.lines_buffer[(y*256)+121] = this.lines[y].bg2.priority[0];
            this.lines_buffer[(y*256)+122] = this.lines[y].bg2.priority[1];
            this.lines_buffer[(y*256)+123] = this.lines[y].bg3.layer;
            this.lines_buffer[(y*256)+124] = this.lines[y].bg3.window.one_enable;
            this.lines_buffer[(y*256)+125] = this.lines[y].bg3.window.one_invert;
            this.lines_buffer[(y*256)+126] = this.lines[y].bg3.window.two_enable;
            this.lines_buffer[(y*256)+127] = this.lines[y].bg3.window.two_invert;
            this.lines_buffer[(y*256)+128] = this.lines[y].bg3.window.mask;
            this.lines_buffer[(y*256)+129] = this.lines[y].bg3.window.above_enable;
            this.lines_buffer[(y*256)+130] = this.lines[y].bg3.window.below_enable;
            this.lines_buffer[(y*256)+131] = this.lines[y].bg3.window.above_mask;
            this.lines_buffer[(y*256)+132] = this.lines[y].bg3.window.below_mask;
            this.lines_buffer[(y*256)+133] = this.lines[y].bg3.window.one_left;
            this.lines_buffer[(y*256)+134] = this.lines[y].bg3.window.one_right;
            this.lines_buffer[(y*256)+135] = this.lines[y].bg3.window.two_left;
            this.lines_buffer[(y*256)+136] = this.lines[y].bg3.window.two_right;
            this.lines_buffer[(y*256)+137] = this.lines[y].bg3.above_enable;
            this.lines_buffer[(y*256)+138] = this.lines[y].bg3.below_enable;
            this.lines_buffer[(y*256)+139] = this.lines[y].bg3.mosaic_enable;
            this.lines_buffer[(y*256)+140] = this.lines[y].bg3.tiledata_addr;
            this.lines_buffer[(y*256)+141] = this.lines[y].bg3.screen_addr;
            this.lines_buffer[(y*256)+142] = this.lines[y].bg3.screen_size;
            this.lines_buffer[(y*256)+143] = this.lines[y].bg3.tile_size;
            this.lines_buffer[(y*256)+144] = this.lines[y].bg3.hoffset;
            this.lines_buffer[(y*256)+145] = this.lines[y].bg3.voffset;
            this.lines_buffer[(y*256)+146] = this.lines[y].bg3.tile_mode;
            this.lines_buffer[(y*256)+147] = this.lines[y].bg3.priority[0];
            this.lines_buffer[(y*256)+148] = this.lines[y].bg3.priority[1];
            this.lines_buffer[(y*256)+149] = this.lines[y].bg4.layer;
            this.lines_buffer[(y*256)+150] = this.lines[y].bg4.window.one_enable;
            this.lines_buffer[(y*256)+151] = this.lines[y].bg4.window.one_invert;
            this.lines_buffer[(y*256)+152] = this.lines[y].bg4.window.two_enable;
            this.lines_buffer[(y*256)+153] = this.lines[y].bg4.window.two_invert;
            this.lines_buffer[(y*256)+154] = this.lines[y].bg4.window.mask;
            this.lines_buffer[(y*256)+155] = this.lines[y].bg4.window.above_enable;
            this.lines_buffer[(y*256)+156] = this.lines[y].bg4.window.below_enable;
            this.lines_buffer[(y*256)+157] = this.lines[y].bg4.window.above_mask;
            this.lines_buffer[(y*256)+158] = this.lines[y].bg4.window.below_mask;
            this.lines_buffer[(y*256)+159] = this.lines[y].bg4.window.one_left;
            this.lines_buffer[(y*256)+160] = this.lines[y].bg4.window.one_right;
            this.lines_buffer[(y*256)+161] = this.lines[y].bg4.window.two_left;
            this.lines_buffer[(y*256)+162] = this.lines[y].bg4.window.two_right;
            this.lines_buffer[(y*256)+163] = this.lines[y].bg4.above_enable;
            this.lines_buffer[(y*256)+164] = this.lines[y].bg4.below_enable;
            this.lines_buffer[(y*256)+165] = this.lines[y].bg4.mosaic_enable;
            this.lines_buffer[(y*256)+166] = this.lines[y].bg4.tiledata_addr;
            this.lines_buffer[(y*256)+167] = this.lines[y].bg4.screen_addr;
            this.lines_buffer[(y*256)+168] = this.lines[y].bg4.screen_size;
            this.lines_buffer[(y*256)+169] = this.lines[y].bg4.tile_size;
            this.lines_buffer[(y*256)+170] = this.lines[y].bg4.hoffset;
            this.lines_buffer[(y*256)+171] = this.lines[y].bg4.voffset;
            this.lines_buffer[(y*256)+172] = this.lines[y].bg4.tile_mode;
            this.lines_buffer[(y*256)+173] = this.lines[y].bg4.priority[0];
            this.lines_buffer[(y*256)+174] = this.lines[y].bg4.priority[1];
            this.lines_buffer[(y*256)+175] = this.lines[y].window.one_enable;
            this.lines_buffer[(y*256)+176] = this.lines[y].window.one_invert;
            this.lines_buffer[(y*256)+177] = this.lines[y].window.two_enable;
            this.lines_buffer[(y*256)+178] = this.lines[y].window.two_invert;
            this.lines_buffer[(y*256)+179] = this.lines[y].window.mask;
            this.lines_buffer[(y*256)+180] = this.lines[y].window.above_enable;
            this.lines_buffer[(y*256)+181] = this.lines[y].window.below_enable;
            this.lines_buffer[(y*256)+182] = this.lines[y].window.above_mask;
            this.lines_buffer[(y*256)+183] = this.lines[y].window.below_mask;
            this.lines_buffer[(y*256)+184] = this.lines[y].window.one_left;
            this.lines_buffer[(y*256)+185] = this.lines[y].window.one_right;
            this.lines_buffer[(y*256)+186] = this.lines[y].window.two_left;
            this.lines_buffer[(y*256)+187] = this.lines[y].window.two_right;
            this.lines_buffer[(y*256)+188] = this.lines[y].oam_addr;
            this.lines_buffer[(y*256)+189] = this.lines[y].oam_base_addr;
            this.lines_buffer[(y*256)+190] = this.lines[y].oam_priority;
            this.lines_buffer[(y*256)+191] = this.lines[y].overscan;
            this.lines_buffer[(y*256)+192] = this.lines[y].pseudo_hires;
            this.lines_buffer[(y*256)+193] = this.lines[y].extbg;
            this.lines_buffer[(y*256)+194] = this.lines[y].bg_mode;
            this.lines_buffer[(y*256)+195] = this.lines[y].bg_priority;
            this.lines_buffer[(y*256)+196] = this.lines[y].display_brightness;
            this.lines_buffer[(y*256)+197] = this.lines[y].display_disable;
        }
    }

}


function generate_serialize_deserialize() {
    let outser = '';
    let outdes = '';
    let indent_ser = '        ';
    let indent_des = '    ';
    let addl_ser = function(what) { outser += indent_ser + what + '\n';};
    let addl_des = function(what) { outdes += indent_des + what + '\n';};

    // Generate entries list
    let entries = [];
    let pstr;
    let whatsoever = PPU_cache_lines()[0];
    for (let propertyName in whatsoever) {
        if (typeof whatsoever[propertyName] === 'object') {
            for (let pname2 in whatsoever[propertyName]) {
                if (typeof whatsoever[propertyName][pname2] === 'object') {
                    for (let pname3 in whatsoever[propertyName][pname2]) {
                        //console.log('!', pname3);
                        if ('0123456789'.indexOf(pname3) !== -1)
                            pstr = propertyName + '.' + pname2 + '[' + pname3 + ']';
                        else
                            pstr = propertyName + '.' + pname2 + '.' + pname3;
                        entries.push(pstr);
                    }
                    continue;
                }
                if ('0123456789'.indexOf(pname2) !== -1)
                    pstr = propertyName + '[' + pname2 + ']';
                else
                    pstr = propertyName + '.' + pname2;
                entries.push(pstr);
            }
            continue;
        }
        pstr = propertyName;
        entries.push(pstr);
    }

    let size_needed = Math.pow(2, Math.ceil(Math.log2(entries.length)));

    console.log('--In worker definition');
    console.log('PPUW_lines = PPU_cache_lines();')
    console.log('--In worker function')
    console.log('deserialize_cache_lines(y_start, y_end, new Int32Array(msg.cache.lines_sabuffer), PPUW_lines);');
    console.log('--In ppu cache.data')
    console.log('lines_sabuffer: new SharedArrayBuffer(' + size_needed + ' * 4 * 241),');
    console.log('--In ppu cache')
    console.log('this.lines_buffer = new Int32Array(this.data.lines_sabuffer);');

    outser += '    serialize_cache_lines(y_start, y_end) {\n';
    outser += '        for (let y=y_start; y<y_end; y++) {\n';

    outdes += 'function deserialize_cache_lines(y_start, y_end, buffer, output) {\n'
    outdes += '    for (let y=0; y<(y_end-y_start); y++) {\n';
    for (let i in entries) {
        let pname = entries[i];
        outser += '            this.lines_buffer[(y*' + size_needed + ')+' + i + '] = this.lines[y].' + pname + ';\n';
        outdes += '        output[y].' + pname + ' = buffer[((y+y_start)*' + size_needed + ')+' + i + '];\n';
    }

    outser += '        }\n';
    outser += '    }\n';
    outdes += '    }\n';
    outdes += '}\n';

    console.log('--In ppu_cache');
    console.log(outser);
    console.log('--In PPU worker');
    console.log(outdes);
}

generate_serialize_deserialize();

function generate_copy_tofrom() {
    let indent = '        ';
    let outstr = '';

    let addl = function(what) { outstr += indent + what + '\n'};


    outstr += '    copy(from, to) {\n';
    addl('let oldto = to;');
    addl('to = this.lines[to];');
    addl('from = this.lines[from];');
    let pstr;
    let whatsoever = PPU_cache_lines()[0];
    for (let propertyName in whatsoever) {
        if (typeof whatsoever[propertyName] === 'object') {
            for (let pname2 in whatsoever[propertyName]) {
                if (typeof whatsoever[propertyName][pname2] === 'object') {
                    for (let pname3 in whatsoever[propertyName][pname2]) {
                        //console.log('!', pname3);
                        if ('0123456789'.indexOf(pname3) !== -1)
                            pstr = propertyName + '.' + pname2 + '[' + pname3 + ']';
                        else
                            pstr = propertyName + '.' + pname2 + '.' + pname3;
                        addl('to.' + pstr + ' = from.' + pstr + ';');
                    }
                    continue;
                }
                if ('0123456789'.indexOf(pname2) !== -1)
                    pstr = propertyName + '[' + pname2 + ']';
                else
                    pstr = propertyName + '.' + pname2;
                addl('to.' + pstr + ' = from.' + pstr + ';');
            }
            continue;
        }
        addl('to.' + propertyName + ' = from.' + propertyName + ';');
    }

    outstr += indent + 'to.control.y = oldto;\n';
    outstr += '    }';
    return outstr;
}
//console.log(generate_copy_tofrom());

function get_pixel(screen_y, screen_x, VRAM, CGRAM, OAM, io_cache) {

}