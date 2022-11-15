"use strict";

const DO_RENDERLOG = false;

const GB_PPU_modes = Object.freeze({
    HBLANK: 0,
    VBLANK: 1,
    OAM_search: 2,
    pixel_transfer: 3
});

function GB_sp_tile_addr(tn, y, big_sprites, y_flip) {
    if (big_sprites) {
        tn &= 0xFE;
        if (y_flip) y = 15 - y;
        if (y > 7) tn++;
        return (0x8000 | (tn << 4) | ((y & 7) << 1));
    }
    if (y_flip) y = 7 - y;
    return (0x8000 | (tn << 4) | (y << 1));
}


class GB_PPU_sprite_t {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.tile = 0;
        this.attr = 0;
        this.in_q = 0;
    }
}

class GB_FIFO_item_t {
    constructor(pixel=0, palette=0, cgb_priority=0, sprite_priority=0) {
        this.pixel = pixel;
        this.palette = palette;
        this.cgb_priority = cgb_priority;
        this.sprite_priority = sprite_priority;
    }
}

class GB_px {
    constructor() {
        this.had_pixel = false;
        this.color = 0;
        this.bg_or_sp = 0; // 0 for BG
        this.palette = 0; // palette #
    }
}

class GB_pixel_slice_fetcher {
    /**
     * @param {number} variant
     * @param {GB_clock} clock
     * @param {GB_bus} bus
     * @param {GB_PPU_FIFO} ppu
     */
    constructor(variant, clock, bus, ppu) {
        this.variant = variant
        this.ppu = ppu;
        this.fetch_cycle = 0;
        this.fetch_addr = 0;
        /**
         * @type {null|GB_PPU_sprite_t}
         */
        this.fetch_obj = null;
        this.fetch_bp0 = 0;
        this.fetch_bp1 = 0;

        this.clock = clock;
        this.bus = bus;

        this.bg_FIFO = new GB_FIFO_t(variant);
        this.obj_FIFO = new GB_FIFO_t(variant);

        this.bg_request_x = 0;
        this.sp_request = 0;
        this.sp_min = 0;
        this.sprites_queue = [];

        this.out_px = new GB_px();
    }

    advance_line() {
        this.fetch_cycle = 0;
        this.bg_FIFO.clear();
        this.obj_FIFO.clear();
        this.bg_request_x = this.ppu.io.SCX;
        this.sp_request = 0;
        this.sp_min = 0;
        this.sprites_queue = [];
    }

    trigger_window() {
        this.bg_FIFO.clear();
        this.bg_request_x = 0;
        this.fetch_cycle = 0;
        if (this.clock.ly === 140) console.log('WINDOW TRIGGERED', this.clock.lx, this.ppu.line_cycle)
    }

    /**
     * @returns {GB_px}
     */
    cycle() {
        let r = this.get_px_if_available();
        this.run_fetch_cycle();
        return r;
    }

    /**
     * @returns {GB_px}
     */
    get_px_if_available() {
        this.out_px.had_pixel = false;
        this.out_px.bg_or_sp = -1;
        if ((this.sp_request === 0) && (!this.bg_FIFO.empty())) {
            this.out_px.had_pixel = true;
            let has_bg = this.ppu.io.bg_window_enable
            let bg = this.bg_FIFO.pop();
            let bg_color = bg.pixel;
            let has_sp = false;
            let sp_color=null, sp_palette;
            let use_what = 0; // 0 for BG, 1 for OBJ
            let obj;

            if (!this.obj_FIFO.empty()) {
                obj = this.obj_FIFO.pop();
                sp_color = obj.pixel;
                sp_palette = obj.palette;
            }
            if (this.ppu.io.obj_enable && (sp_color !== null)) has_sp = true;

            if ((has_bg) && (!has_sp)) {
                use_what = 1;
            } else if ((!has_bg) && (has_sp)) {
                use_what = 1;
            } else if (has_bg && has_sp) {
                if (obj.sprite_priority && (bg_color !== 0)) // "If the OBJ pixel has its priority bit set, and the BG pixel's ID is not 0, pick the BG pixel."
                    use_what = 1; // BG
                else if (sp_color === 0) // "If the OBJ pixel is 0, pick the BG pixel; "
                    use_what = 1; // BG
                else // "otherwise, pick the OBJ pixel"
                {
                    use_what = 2; // sprite
                }
            } else {
                use_what = 0;
                this.out_px.color = 0;
            }

            if (use_what === 0) {
            }
            else if (use_what === 1) {
                this.out_px.bg_or_sp = 0;
                this.out_px.color = bg_color;
                this.out_px.palette = 0;
            } else {
                this.out_px.bg_or_sp = 1;
                this.out_px.color = sp_color;
                this.out_px.palette = sp_palette;
            }
        }
        return this.out_px;
    }

    run_fetch_cycle() {
        // Scan any sprites
        for (let i = 0; i < this.ppu.sprites.num; i++) {
            if ((!this.ppu.OBJ[i].in_q) && (this.ppu.OBJ[i].x === this.clock.lx)) {
                this.sp_request++;
                this.sprites_queue.push(this.ppu.OBJ[i]);
                this.ppu.OBJ[i].in_q = 1;
            }
        }

        let tn;
        switch(this.fetch_cycle) {
            case 0: // nothing
                this.fetch_cycle = 1;
                break;
            case 1: // tile
                if (this.ppu.in_window()) {
                    tn = this.bus.PPU_read(this.ppu.bg_tilemap_addr_window(this.bg_request_x));
                    this.fetch_addr = this.ppu.bg_tile_addr_window(tn);
                }
                else {
                    tn = this.bus.PPU_read(this.ppu.bg_tilemap_addr_nowindow(this.bg_request_x));
                    this.fetch_addr = this.ppu.bg_tile_addr_nowindow(tn);
                }
                this.fetch_cycle = 2;
                break;
            case 2: // nothing
                this.fetch_cycle = 3;
                break;
            case 3: // bp0
                this.fetch_bp0 = this.bus.PPU_read(this.fetch_addr);
                //if (this.ppu.in_window()) this.fetch_bp0 = 0x55;
                this.fetch_cycle = 4;
                break;
            case 4: // nothing
                this.fetch_cycle = 5;
                break;
            case 5: // bp1
                this.fetch_bp1 = this.bus.PPU_read(this.fetch_addr+1);
                //if (this.ppu.in_window()) this.fetch_bp1 = 0x55;
                this.fetch_cycle = 6;
                break;
            case 6: // attempt background push, OR, hijack by sprite
                if (this.sp_request) { // SPRITE HIJACK!
                    this.fetch_cycle = 7;
                    this.fetch_obj = this.sprites_queue[0];
                    this.fetch_addr = GB_sp_tile_addr(this.fetch_obj.tile, this.clock.ly - this.fetch_obj.y, this.ppu.io.sprites_big, this.fetch_obj.attr & 0x40);
                } else { // attempt to push to BG FIFO, which only accepts when empty.
                    if (this.bg_FIFO.empty()) {
                        // Push to FIFO
                        for (let i = 0; i < 8; i++) {
                            let b = this.bg_FIFO.push();
                            b.pixel = ((this.fetch_bp0 & 0x80) >>> 7) | ((this.fetch_bp1 & 0x80) >>> 6);
                            this.fetch_bp0 <<= 1;
                            this.fetch_bp1 <<= 1;
                        }
                        this.bg_request_x += 8;
                        if ((this.ppu.line_cycle < 88) && (!this.ppu.in_window())) this.bg_request_x -= 8;
                        this.fetch_cycle = 0; // Restart fetching
                    }
                }
                // do NOT advance if BG_FIFO won't take it
                break;
            case 7: // sprite bp0 fetch
                this.fetch_bp0 = this.bus.PPU_read(this.fetch_addr);
                this.fetch_cycle = 8;
                break;
            case 8: // nothing
                this.fetch_cycle = 9;
                break;
            case 9: // sprite bp1 fetch, mix, & restart
                this.fetch_bp1 = this.bus.PPU_read(this.fetch_addr+1);
                this.obj_FIFO.sprite_mix(this.fetch_bp0, this.fetch_bp1, (this.fetch_obj.attr & 0x80) >>> 7, (this.fetch_obj.attr & 0x10) >>> 4, (this.fetch_obj.attr & 0x20));
                this.sp_request--;
                this.sprites_queue.shift();
                this.fetch_cycle = 0;
                break;
        }
    }
}

class GB_FIFO_t {
    constructor(variant) {
        this.variant = variant;
        this.compat_mode = 1; // 1 for DMG or GBC compatability
        /**
         * @type {GB_FIFO_item_t[]}
         */
        this.items = [];
        for (let i = 0; i < 8; i++) {
            this.items[i] = new GB_FIFO_item_t();
        }
        this.head = 0;
        this.tail = 0;
        this.num_items = 0;
    }

    set_cgb_mode(on) {
        if (on)
            this.compat_mode = 0;
        else
            this.compat_mode = 1;
    }

    any_there() {
        return this.num_items > 0;
    }

    clear() {
        this.head = this.tail = 0;
        this.num_items = 0;
    }

    empty() {
        return this.num_items === 0;
    }

    full() {
        return this.num_items === 8;
    }

    // This is for "mixing" on sprite encounter
    sprite_mix(bp0, bp1, sp_priority, sp_palette, flip) {
        // First fill with transparent pixels
        while(this.num_items < 8) {
            let b = this.push();
            b.sprite_priority = 0;
            b.cgb_priority = 0;
            b.pixel = 0;
            b.palette = 0;
        }

        for (let j = 0; j < 8; j++) {
            let r = j;
            if (flip) r = 7 - r;
            let i = (r + this.head) & 7;
            let px = ((bp0 & 0x80) >>> 7) | ((bp1 & 0x80) >>> 6);
            bp0 <<= 1;
            bp1 <<= 1;
            if (this.compat_mode === 1) {
                // DMG/CGB compatability
                if (this.items[i].pixel === 0) {
                    this.items[i].palette = sp_palette;
                    this.items[i].sprite_priority = sp_priority;
                    this.items[i].pixel = px;
                    this.items[i].cgb_priority = 0;
                }
            } else {
                if (this.items[i].cgb_priority < sp_priority) {
                    this.items[i].palette = sp_palette;
                    this.items[i].sprite_priority = sp_priority;
                    this.items[i].pixel = px;
                    this.items[i].cgb_priority = sp_priority;
                }
            }
        }
    }

    /**
     * @returns {null|GB_FIFO_item_t}
     */
    push() {
        if (this.num_items >= 8) {
            console.log('NO!');
            return null;
        }
        let r = this.items[this.tail];
        this.tail = (this.tail + 1) & 7;
        this.num_items++;
        return r;
    }

    /**
     * @returns {null|GB_FIFO_item_t}
     */
    pop() {
        if (this.num_items === 0) return null;
        let r = this.items[this.head];
        this.head = (this.head + 1) & 7;
        this.num_items--;
        return r;
    }
}

class GB_PPU_FIFO {
    /**
     * @param {canvas_manager_t} canvas_manager
     * @param {Number} variant
     * @param {GB_clock} clock
     * @param {GB_bus} bus
     */
    constructor(canvas_manager, variant, clock, bus) {
        this.variant = variant;
        this.clock = clock;
        this.canvas_manager = canvas_manager;
        this.bus = bus;
        this.bus.ppu = this;


        this.slice_fetcher = new GB_pixel_slice_fetcher(variant, clock, bus, this);

        this.clock.ppu_mode = GB_PPU_modes.OAM_search;
        this.line_cycle = 0;
        this.cycles_til_vblank = 0;
        this.enabled = false; // PPU off at startup
        // First frame after reset, we don't draw.
        this.display_update = false;

        this.bg_palette = [0, 0, 0, 0];
        this.sp_palette = [[0, 0, 0, 0], [0, 0, 0, 0]];

        this.OAM = new Uint8Array(160);
        /**
         * @type {GB_PPU_sprite_t[]}
         */
        this.OBJ = [];
        for (let i = 0; i < 10; i++) {
            this.OBJ.push(new GB_PPU_sprite_t());
        }

        this.sprites = {
            num: 0,
            index: 0,
            search_index: 0,
        }

        this.io = {
            sprites_big: 0,

            lyc: 0,

            STAT_IF: 0,
            STAT_IE: 0,
            old_mask: 0,

            window_tile_map_base: 0,
            window_enable: 0,
            bg_window_tile_data_base: 0,
            bg_tile_map_base: 0,
            obj_enable: 1,
            bg_window_enable: 1,

            SCX: 0, // X scroll
            SCY: 0, // Y scroll
            wx: 0, // Window X
            wy: 0, // Window Y
        }

        this.output = new Uint8Array(160*144);
        this.first_reset = true;

        this.is_window_line = false;
        this.window_triggered_on_line = false;

        this.bus.CPU_read_OAM = this.read_OAM.bind(this);
        this.bus.CPU_write_OAM = this.write_OAM.bind(this);
        this.disable();
    }

    dump_bg(cm, map_base_addr, tile_base_addr) {
        let TILE_ROWS = 32;
        let TILE_COLS = 32;
        let w = TILE_COLS*8;
        let h = TILE_ROWS*8;
        cm.set_size(w, h);
        let imgdata = cm.get_imgdata();
        for (let tile_y = 0; tile_y < TILE_ROWS; tile_y++) {
            for (let tile_x = 0; tile_x < TILE_COLS; tile_x++) {
                let addr = map_base_addr + (tile_y * 32) + tile_x;
                let tile_num = this.bus.mapper.PPU_read(addr);
                for (let ty = 0; ty < 8; ty++) {
                    let fetch_addr = tile_base_addr | (tile_num * 0x10) + (ty*2);
                    let bp0 = this.bus.mapper.PPU_read(fetch_addr);
                    let bp1 = this.bus.mapper.PPU_read(fetch_addr + 1);
                    for (let tx = 0; tx < 8; tx++) {
                        let px = ((bp0 & 0x80) >>> 7) | ((bp1 & 0x80) >>> 6);
                        bp0 <<= 1;
                        bp1 <<= 1;

                        let c = 255 - Math.floor((px / 3) * 255);

                        let sy = (tile_y * 8) + ty;
                        let sx = (tile_x * 8) + tx;
                        let poi = ((sy * w) + sx) * 4;
                        imgdata.data[poi] = c;
                        imgdata.data[poi+1] = c;
                        imgdata.data[poi+2] = c;
                        imgdata.data[poi+3] = 255;
                    }
                }
            }
        }

        // Now render scroll...
        let scroll_x = this.io.SCX;
        let scroll_y = this.io.SCY;
        let cr = 0xA0;
        let cg = 0xC0;
        let cb = 0x40;
        // Render scroll position...
        for (let y = 0; y < 144; y++) {
            for (let x = 0; x < 160; x++) {
                let sx = (x + scroll_x) % w;
                let sy = (y + scroll_y) % h;
                let poi = ((sy * w) + sx) * 4;
                imgdata.data[poi+3] = 100;
            }
        }
        let y1 = (scroll_y % h) * w;
        let y2 = (((scroll_y + 143) & 0xFF) % h) * w;
        let x1 = scroll_x;
        let x2 = (scroll_x + 159) & 0xFF;
        if (x2 < x1) x2 += 256;
        for (let x = x1; x < x2; x++) {
            let poi1 = (y1 + (x % w)) * 4;
            let poi2 = (y2 + x) * 4;
            imgdata.data[poi1] = imgdata.data[poi2] = cr;
            imgdata.data[poi1+1] = imgdata.data[poi2+1] = cg;
            imgdata.data[poi1+2] = imgdata.data[poi2+2] = cb;
            imgdata.data[poi1+3] = imgdata.data[poi2+3] = 255;
        }

        /*
        for (let y = 0; y < 144; y++) {
            let poi1 = ((y * 160) + x1) * 4;
            let poi2 = ((y * 160) + x2) * 4;
            imgdata.data[poi1] = imgdata.data[poi2] = 0;
            imgdata.data[poi1+1] = imgdata.data[poi2+1] = 0;
            imgdata.data[poi1+2] = imgdata.data[poi2+2] = 0;
        }*/
        cm.put_imgdata(imgdata);
    }

    dump_tiles(cm) {
        let TILE_COLS = 16;
        let TILE_ROWS = 24;
        let TILE_SIZE = 8;
        let TILE_SIZE_SPACED = 8;
        let w = TILE_COLS * TILE_SIZE_SPACED;
        let h = TILE_ROWS * TILE_SIZE_SPACED;
        cm.set_size(w, h);
        cm.set_scale(2);
        let DO_BREAK = false;
        let imgdata = cm.get_imgdata();
        for (let ytile = 0; ytile < TILE_ROWS; ytile++) {
            if (DO_BREAK) break;
            for (let xtile = 0; xtile < TILE_COLS; xtile++) {
                if (DO_BREAK) break;
                let tile_num = (ytile * TILE_COLS) + xtile;
                for (let ty = 0; ty < 8; ty++) {
                    // Fetch a tile row
                    let addr = ((tile_num * 0x10) | 0x8000) + (ty*2);
                    let bp0 = this.bus.mapper.PPU_read(addr);
                    let bp1 = this.bus.mapper.PPU_read(addr+1);
                    let sy = (ytile * TILE_SIZE_SPACED) + ty;
                    for (let tx = 0; tx < 8; tx++) {
                        let sx = (xtile * TILE_SIZE_SPACED) + tx;
                        let oad = ((sy * w) + sx)
                        oad *= 4;
                        let px = ((bp0 & 0x80) >>> 7) | ((bp1 & 0x80) >>> 6);
                        bp0 <<= 1;
                        bp1 <<= 1;
                        let c = Math.floor((px / 3) * 255);
                        //if (tile_num & 1) c = 255;
                        let r = c;
                        let g = c;
                        let b = c;

                        /*r = fr;
                        g = fg;
                        b = fb;*/
                        imgdata.data[oad] = r;
                        imgdata.data[oad+1] = g;
                        imgdata.data[oad+2] = b;
                        imgdata.data[oad+3] = 255;
                    }
                }
            }
        }
        let sep_r = 0x30;
        let sep_g = 0x60;
        let sep_b = 0x30;
        // Render horizontal lines
        /*for (let y = 8; y < (24*9); y+=9) {
            for (let x = 0; x < w; x++) {
                let dpi = ((y * w)+x)*4;
                imgdata.data[dpi] = sep_r;
                imgdata.data[dpi+1] = sep_g;
                imgdata.data[dpi+2] = sep_b;
                imgdata.data[dpi+3] = 255;
            }
        }*/
        // Render vertical lines
        cm.put_imgdata(imgdata);
    }

    bg_tilemap_addr_window(wlx) {
        return (0x9800 | (this.io.window_tile_map_base << 10) |
            ((this.clock.wly >>> 3) << 5) |
            (wlx >>> 3)
        );
    }

    bg_tilemap_addr_nowindow(lx) {
        return (0x9800 | (this.io.bg_tile_map_base << 10) |
            ((((this.clock.ly + this.io.SCY) & 0xFF) >>> 3) << 5) |
            (((lx) & 0xFF) >>> 3)
        );
    }

    bg_tile_addr_window(tn) {
        let b12;
        if (this.io.bg_window_tile_data_base) b12 = 0;
        else b12 = ((tn & 0x80) ^ 0x80) << 5;
        return (0x8000 | b12 |
            (tn << 4) |
            ((this.clock.wly & 7) << 1)
        );
    }

    bg_tile_addr_nowindow(tn) {
        let b12;
        if (this.io.bg_window_tile_data_base) b12 = 0;
        else b12 = ((tn & 0x80) ^ 0x80) << 5;
        return (0x8000 | b12 |
            (tn << 4) |
            ((((this.clock.ly + this.io.SCY) & 0xFF) & 7) << 1)
        );
    }

    present() {
        this.canvas_manager.set_size(160, 144);
        let imgdata = this.canvas_manager.get_imgdata();
        for (let y = 0; y < 144; y++) {
            for (let x = 0; x < 160; x++) {
                let ppui = (y * 160) + x;
                let di = ppui * 4;
                let r, g, b;
                let o = this.output[ppui];
                r = ((o / 3) * 255);
                r = 255 - r;
                g = b = r;
                imgdata.data[di] = r;
                imgdata.data[di+1] = g;
                imgdata.data[di+2] = b;
                imgdata.data[di+3] = 255;
            }
        }

        // draw lines around screen
        //this.draw_lines_around_screen(imgdata);

        this.canvas_manager.put_imgdata(imgdata);
        this.dump_bg(bg_canvas, 0x9800, 0x8000);
    }

    draw_lines_around_screen(imgdata) {
        let y1 = 0;
        let y2 = (143 * 160);
        for (let x = 0; x < 160; x++) {
            let poi1 = (y1 + x) * 4;
            let poi2 = (y2 + x) * 4;
            imgdata.data[poi1] = imgdata.data[poi2] = 0;
            imgdata.data[poi1+1] = imgdata.data[poi2+1] = 0;
            imgdata.data[poi1+2] = imgdata.data[poi2+2] = 0;
        }

        let x1 = 0;
        let x2 = 159;
        for (let y = 0; y < 144; y++) {
            let poi1 = ((y * 160) + x1) * 4;
            let poi2 = ((y * 160) + x2) * 4;
            imgdata.data[poi1] = imgdata.data[poi2] = 0;
            imgdata.data[poi1+1] = imgdata.data[poi2+1] = 0;
            imgdata.data[poi1+2] = imgdata.data[poi2+2] = 0;
        }
    }

    write_OAM(addr, val) {
        if (addr < 0xFEA0) this.OAM[addr - 0xFE00] = val;
    }

    read_OAM(addr) {
        if (addr >= 0xFEA0) return 0xFF;
        return this.OAM[addr - 0xFE00];
    }

    write_IO(addr, val) {
        switch(addr) {
            case 0xFF01:
                /*let nstr = String.fromCharCode(val);
                this.console_str += nstr;
                console.log(this.console_str);*/
                break;
            case 0xFF40: // LCDC LCD Control
                if (val & 0x80) this.enable();
                else this.disable();

                this.io.window_tile_map_base = (val & 0x40) >>> 6;
                this.io.window_enable = (val & 0x20) >>> 5;
                this.io.bg_window_tile_data_base = (val & 0x10) >>> 4;
                this.io.bg_tile_map_base = (val & 8) >>> 3;
                this.io.sprites_big = (val & 4) >>> 2;
                this.io.obj_enable = (val & 2) >>> 1;
                this.io.bg_window_enable = val & 1;
                return;
            case 0xFF41: // STAT LCD status
                if (this.variant === GB_variants.DMG) {
                    this.io.STAT_IE = 0x0F;
                    this.eval_STAT();
                }
                let mode0_enable = (val & 8) >>> 3;
                let mode1_enable = (val & 0x10) >>> 4;
                let mode2_enable = (val & 0x20) >>> 5;
                let lylyc_enable = (val & 0x40) >>> 6;
                //console.log('WRITE STAT MODE', hex2(val));
                this.io.STAT_IE = mode0_enable | (mode1_enable << 1) | (mode2_enable << 2) | (lylyc_enable << 3);
                //console.log('STAT IE NEW', hex2(this.io.STAT_IE))
                this.eval_STAT();
                return;
            case 0xFF42: // SCY
                //console.log('SCY!', val);
                this.io.SCY = val;
                return;
            case 0xFF43: // SCX
                this.io.SCX = val;
                return;
            case 0xFF45: // LYC
                this.io.lyc = val;
                //console.log('LYC:', this.io.lyc)
                if (this.enable) this.eval_lyc();
                return;
            case 0xFF4A: // window Y
                this.io.wy = val;
                return;
            case 0xFF4B: // window x + 7
                this.io.wx = val+1;
                return;
            case 0xFF47: // BGP pallete
                //if (!this.clock.CPU_can_VRAM) return;
                this.bg_palette[0] = val & 3;
                this.bg_palette[1] = (val >>> 2) & 3;
                this.bg_palette[2] = (val >>> 4) & 3;
                this.bg_palette[3] = (val >>> 6) & 3;
                return;
            case 0xFF48: // OBP0 sprite palette 0
                //if (!this.clock.CPU_can_VRAM) return;
                this.sp_palette[0][0] = val & 3;
                this.sp_palette[0][1] = (val >>> 2) & 3;
                this.sp_palette[0][2] = (val >>> 4) & 3;
                this.sp_palette[0][3] = (val >>> 6) & 3;
                return;
            case 0xFF49: // OBP1 sprite palette 1
                //if (!this.clock.CPU_can_VRAM) return;
                this.sp_palette[1][0] = val & 3;
                this.sp_palette[1][1] = (val >>> 2) & 3;
                this.sp_palette[1][2] = (val >>> 4) & 3;
                this.sp_palette[1][3] = (val >>> 6) & 3;
                return;

        }
    }

    read_IO(addr, val, has_effect=true) {
        switch(addr) {
            case 0xFF40: // LCDC LCD Control
                let e = this.enabled ? 0x80: 0;
                return e | (this.io.window_tile_map_base << 6) | (this.io.window_enable << 5) | (this.io.bg_window_tile_data_base << 4) |
                    (this.io.bg_tile_map_base << 3) | (this.io.sprites_big << 2) |
                    (this.io.obj_enable << 1) | (this.io.bg_window_enable);
            case 0xFF41: // STAT LCD status
                let mode0_enable = this.io.IE & 1;
                let mode1_enable = (this.io.IE & 2) >>> 1;
                let mode2_enable = (this.io.IE & 4) >>> 2;
                let lylyc_enable = (this.io.IE & 8) >>> 3;
                return this.clock.ppu_mode |
                    ((this.clock.ly === this.io.lyc) ? 1 : 0) |
                    (mode0_enable << 3) |
                    (mode1_enable << 4) |
                    (mode2_enable << 5) |
                    (lylyc_enable << 6);
            case 0xFF42: // SCY
                return this.io.SCY;
            case 0xFF43: // SCX
                return this.io.SCX;
            case 0xFF44: // LY
                /*console.log('READ FF44!', this.clock.ly);
                if (this.clock.ly === 0x90) dbg.break();*/
                let ly = this.clock.ly;
                if ((ly === 153) && (this.line_cycle > 1)) ly = 0;
                return ly;
            case 0xFF45: // LYC
                return this.io.lyc;
            case 0xFF4A: // window Y
                return this.io.wy;
            case 0xFF4B: // window x + 7
                return this.io.wx;
            case 0xFF47: // BGP
                //if (!this.clock.CPU_can_VRAM) return 0xFF;
                return this.bg_palette[0] | (this.bg_palette[1] << 2) | (this.bg_palette[2] << 4) | (this.bg_palette[3] << 6);
            case 0xFF48: // OBP0
                //if (!this.clock.CPU_can_VRAM) return 0xFF;
                return this.sp_palette[0][0] | (this.sp_palette[0][1] << 2) | (this.sp_palette[0][2] << 4) | (this.sp_palette[0][3] << 6);
            case 0xFF49: // OBP1
                //if (!this.clock.CPU_can_VRAM) return 0xFF;
                return this.sp_palette[1][0] | (this.sp_palette[1][1] << 2) | (this.sp_palette[1][2] << 4) | (this.sp_palette[1][3] << 6);
        }
        return 0xFF;
    }

    disable() {
        if (!this.enabled) return;
        this.enabled = false;
        console.log('DISABLE PPU')
        this.clock.CPU_can_VRAM = 1;
        this.clock.setCPU_can_OAM(1);
    }

    enable() {
        if (this.enabled) return;
        console.log('ENABLE PPU');
        this.enable_next_frame = true;
    }

    set_mode(which) {
        if (this.clock.ppu_mode === which) return;
        this.clock.ppu_mode = which;

        switch(which) {
            case GB_PPU_modes.OAM_search: // 2. after vblank, so after 1
                this.clock.setCPU_can_OAM(0);
                this.clock.CPU_can_VRAM = 1;
                if (this.enabled) {
                    this.bus.IRQ_vblank_down();
                    this.IRQ_mode1_down();
                    this.IRQ_mode2_up();
                }
                break;
            case GB_PPU_modes.pixel_transfer: // 3, comes after 2
                this.IRQ_mode2_down();
                this.clock.CPU_can_VRAM = 0;
                this.clock.setCPU_can_OAM(0);
                this.slice_fetcher.advance_line();
                break;
            case GB_PPU_modes.HBLANK: // 0, comes after 3
                this.IRQ_mode0_up();
                this.clock.CPU_can_VRAM = 1;
                this.clock.setCPU_can_OAM(1);
                break;
            case GB_PPU_modes.VBLANK: // 1, comes after 0
                this.IRQ_mode0_down();
                this.IRQ_mode1_up();
                this.IRQ_vblank_up();
                this.clock.CPU_can_VRAM = 1;
                this.clock.setCPU_can_OAM(1);
                break;
        }
    }

    run_cycles(howmany) {
        // We don't do anything, and in fact are off, if LCD is off
        for (let i = 0; i < howmany; i++) {
            // TODO: make this enabled on frame AFTER enable happens
            if (this.enabled) this.cycle();
            if (this.cycles_til_vblank) {
                this.cycles_til_vblank--;
                if (this.cycles_til_vblank === 0)
                    this.bus.IRQ_vblank_up();
            }
            this.line_cycle++;
            if (this.line_cycle === 456) this.advance_line();
            if (dbg.do_break) break;
        }
    }

    advance_line() {
        if (this.window_triggered_on_line) this.clock.wly++;
        this.clock.lx = 0;
        this.clock.ly++;
        this.is_window_line |= this.clock.ly === this.io.wy;
        this.window_triggered_on_line = false;
        this.line_cycle = 0;
        if (this.clock.ly >= 154)
            this.advance_frame();
        if (this.enabled) {
            this.eval_lyc();
            if (this.clock.ly < 144)
                this.set_mode(2); // OAM search
            else if (this.clock.ly === 144)
                this.set_mode(1); // VBLANK
        }
    }

    // TODO: trigger IRQ if enabled properly
    eval_lyc() {
        let cly = this.clock.ly;
        if ((cly === 153) && (this.line_cycle > 1)) cly = 0;
        if (this.clock.ly === this.io.lyc) {
            this.IRQ_lylyc_up();
        }
        else
            this.IRQ_lylyc_down();
    }

    IRQ_lylyc_up() {
        this.io.STAT_IF |= 8;
        this.eval_STAT();
    }

    IRQ_lylyc_down() {
        this.io.STAT_IF &= 0xF7;
        this.eval_STAT();
    }

    IRQ_mode0_up() {
        this.io.STAT_IF |= 1;
        this.eval_STAT();
    }

    IRQ_mode0_down() {
        this.io.STAT_IF &= 0xFE;
        this.eval_STAT();
    }

    IRQ_vblank_up() {
        this.cycles_til_vblank = 2;
    }

    IRQ_mode1_up() {
        this.io.STAT_IF |= 2;
        this.eval_STAT();
    }

    IRQ_mode1_down() {
        this.io.STAT_IF &= 0xFD;
        this.eval_STAT();
    }

    IRQ_mode2_up() {
        this.io.STAT_IF |= 4;
        this.eval_STAT();
    }

    IRQ_mode2_down() {
        this.io.STAT_IF &= 0xFB;
        this.eval_STAT();
    }

    eval_STAT() {
        let mask = this.io.STAT_IF & this.io.STAT_IE;
        if ((this.io.old_mask === 0) && (mask !== 0)) {
            //console.log('TRIGGER STAT!');
            this.bus.cpu.cpu.regs.IF |= 2;
        }
        else {
            //console.log('DID NOT TRIGGER STAT!');
        }
        this.io.old_mask = mask;
    }

    advance_frame() {
        if (this.enable_next_frame) {
            this.enabled = true;
            this.reset();
            this.enable_next_frame = false;
        }
        this.clock.ly = 0;
        this.clock.wly = 0;
        if (this.enabled) {
            this.display_update = true;
        }
        this.clock.frames_since_restart++;
        this.clock.master_frame++;
        this.is_window_line = false;
    }

    /********************/
    OAM_search() {
        if (this.line_cycle !== 75) return;

        // Check if a sprite is at the right place
        this.sprites.num = 0;
        this.sprites.index = 0;
        this.sprites.search_index = 0;
        for (let i = 0; i < 10; i++) {
            this.OBJ[i].x = 0;
            this.OBJ[i].y = 0;
            this.OBJ[i].in_q = 0;
        }

        for (let i = 0; i < 40; i++) {
            if (this.sprites.num === 10) break;
            let sy = this.OAM[this.sprites.search_index] - 16;
            let sy_bottom = sy + (this.io.sprites_big ? 16 : 8);
            if ((this.clock.ly >= sy) && (this.clock.ly < sy_bottom)) {
                this.OBJ[this.sprites.num].y = sy;
                this.OBJ[this.sprites.num].x = this.OAM[this.sprites.search_index + 1] - 1;
                this.OBJ[this.sprites.num].tile = this.OAM[this.sprites.search_index + 2];
                this.OBJ[this.sprites.num].attr = this.OAM[this.sprites.search_index + 3];
                this.OBJ[this.sprites.num].in_q = 0;

                this.sprites.num++;
            }
            this.sprites.search_index += 4
        }
    }

    in_window() {
        return this.io.window_enable && this.is_window_line && (this.clock.lx >= this.io.wx);
    }

    pixel_transfer() {
        if ((this.io.window_enable) && ((this.clock.lx) === this.io.wx) && this.is_window_line && !this.window_triggered_on_line) {
            this.slice_fetcher.trigger_window();
            this.window_triggered_on_line = true;
        }
        let p = this.slice_fetcher.cycle();

        if (p.had_pixel) {
            if (this.clock.lx > 7) {
                let cv;
                if (p.bg_or_sp === 0) {
                    cv = this.bg_palette[p.color];
                } else {
                    cv = this.sp_palette[p.palette][p.color];
                }
                this.output[(this.clock.ly * 160) + (this.clock.lx - 8)] = cv;
            }
            this.clock.lx++;
        }
    }


    /*******************/
    cycle() {
        // During HBlank and VBlank do nothing...
        if (this.clock.ly > 143) return;
        if (this.clock.ppu_mode < 2) return;

        // Clear sprites
        if (this.line_cycle === 0) {
            this.set_mode(2); // OAM search
        }

        switch (this.clock.ppu_mode) {
            case 2: // OAM search 0-80
                // 80 dots long, 2 per entry, find up to 10 sprites 0...n on this line
                this.OAM_search();
                if (this.line_cycle === 79) this.set_mode(3);
                break;
            case 3: // Pixel transfer. Complicated.
                this.pixel_transfer();
                if (this.clock.lx > 167)
                    this.set_mode(0);
                break;
        }
    }

    reset() {
        // Reset variables
        this.clock.lx = 0;
        this.clock.ly = 0;
        this.line_cycle = 0;
        this.display_update = false;
        this.cycles_til_vblank = 0;

        // Reset IRQs
        //this.io.STAT_IE = 0; // Interrupt enables
        //this.io.STAT_IF = 0; // Interrupt flags
        //this.io.old_mask = 0;

        //this.eval_STAT();

        // Set mode to OAM search
        this.set_mode(GB_PPU_modes.OAM_search);
        this.first_reset = false;
   }

   quick_boot() {
        switch(this.variant) {
            case GB_variants.DMG:
                this.enabled = true;
                this.enable_next_frame = false;
                let val = 0xFC;
                //this.clock.ly = 90;
                this.write_IO(0xFF47, 0xFC);
                this.write_IO(0xFF40, 0x91);
                this.write_IO(0xFF41, 0x85);
                this.io.lyc = 0;
                this.io.SCX = this.io.SCY = 0;

                this.advance_frame();
                break;
            default:
                console.log('QUICKBOOT NOT SUPPROTEDO N THSI GAMEBOY MODEL');
                break;
        }
   }
}