"use strict";

const DO_RENDERLOG = false;

const GB_PPU_modes = Object.freeze({
    HBLANK: 0,
    VBLANK: 1,
    OAM_search: 2,
    pixel_transfer: 3
});

function GB_sp_tile_addr(tn, y, big_sprites, attr, cgb) {
    let y_flip = attr & 0x40;
    if (big_sprites) {
        tn &= 0xFE;
        if (y_flip) y = 15 - y;
        if (y > 7) tn++;
        return (0x8000 | (tn << 4) | ((y & 7) << 1));
    }
    let hbits = 0;
    if (y_flip) y = 7 - y;
    if (cgb) {
        if (attr & 8) hbits = 0x2000;
    }
    return (0x8000 | (tn << 4) | (y << 1)) + hbits;
}


class GB_PPU_sprite_t {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.tile = 0;
        this.attr = 0;
        this.in_q = 0;
        this.num = 60;
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

function GBC_resolve_priority(LCDC0, OAM7, BG7, bg_color, sp_color, sp_num) {
    // 1 = BG
    // 2 = OBJ
    if (sp_color === 0) return 1;
    if (!LCDC0) return 2;
    if ((!OAM7) && (!BG7)) return 2;
    if (bg_color > 0) return 1;
    return 2;
}

class GB_pixel_slice_fetcher {
    /**
     * @param {number} variant
     * @param {GB_clock} clock
     * @param {GB_bus} bus
     * @param {GB_PPU} ppu
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
        this.fetch_cgb_attr = 0;

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
            let has_bg = this.clock.cgb_enable? true : this.ppu.io.bg_window_enable
            let bg_pal = 0;
            let bg = this.bg_FIFO.pop();
            let bg_color = bg.pixel;
            let has_sp = false;
            let sp_color=null, sp_palette;
            let use_what = 0; // 0 for BG, 1 for OBJ
            let obj;
            if (this.clock.cgb_enable) {
                bg_pal = bg.palette;
            }

            if (!this.obj_FIFO.empty()) {
                obj = this.obj_FIFO.pop();
                sp_color = obj.pixel;
                sp_palette = obj.palette;
            }
            if (this.ppu.io.obj_enable && (sp_color !== null)) has_sp = true;

            // DMG resolve
            if ((has_bg) && (!has_sp)) {
                use_what = 1;
            } else if ((!has_bg) && (has_sp)) {
                use_what = 1;
            } else if (has_bg && has_sp) {
                if (this.clock.cgb_enable) {
                    //GBC_resolve_priority(LCDC0, OAM7, BG7, bg_color) {
                    use_what = GBC_resolve_priority(this.ppu.io.bg_window_enable, obj.sprite_priority, bg.sprite_priority, bg_color, sp_color);
                } else {
                    if (obj.sprite_priority && (bg_color !== 0)) // "If the OBJ pixel has its priority bit set, and the BG pixel's ID is not 0, pick the BG pixel."
                        use_what = 1; // BG
                    else if (sp_color === 0) // "If the OBJ pixel is 0, pick the BG pixel; "
                        use_what = 1; // BG
                    else // "otherwise, pick the OBJ pixel"
                    {
                        use_what = 2; // sprite
                    }

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
                this.out_px.palette = bg_pal;
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
                let addr;
                if (this.ppu.in_window()) {
                    addr = this.ppu.bg_tilemap_addr_window(this.bg_request_x);
                    if (this.clock.cgb_enable) {
                        this.fetch_cgb_attr = this.bus.PPU_read(addr + 0x2000);
                    }
                    tn = this.bus.PPU_read(addr);
                    this.fetch_addr = this.ppu.bg_tile_addr_window(tn, this.fetch_cgb_attr);
                }
                else {
                    addr = this.ppu.bg_tilemap_addr_nowindow(this.bg_request_x);
                    if (this.clock.cgb_enable) {
                        this.fetch_cgb_attr = this.bus.PPU_read(addr + 0x2000);
                    }
                    tn = this.bus.PPU_read(addr);
                    /*if ((this.bg_request_x === 0) && (this.clock.ly === 0)) {
                        console.log('ATTRIBUTE!', hex4(addr + 0x2000), hex2(this.fetch_cgb_attr));
                    }*/
                    this.fetch_addr = this.ppu.bg_tile_addr_nowindow(tn, this.fetch_cgb_attr);
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
                    this.fetch_addr = GB_sp_tile_addr(this.fetch_obj.tile, this.clock.ly - this.fetch_obj.y, this.ppu.io.sprites_big, this.fetch_obj.attr, this.clock.cgb_enable);
                } else { // attempt to push to BG FIFO, which only accepts when empty.
                    if (this.bg_FIFO.empty()) {
                        // Push to FIFO
                        for (let i = 0; i < 8; i++) {
                            let b = this.bg_FIFO.push();
                            if ((this.clock.cgb_enable) && (this.fetch_cgb_attr & 0x20)) {
                                // Flipped X
                                b.pixel = (this.fetch_bp0 & 1) | ((this.fetch_bp1 & 1) << 1);
                                this.fetch_bp0 >>= 1;
                                this.fetch_bp1 >>= 1;
                            }
                            else {
                                // For regular, X not flipped
                                b.pixel = ((this.fetch_bp0 & 0x80) >>> 7) | ((this.fetch_bp1 & 0x80) >>> 6);
                                this.fetch_bp0 <<= 1;
                                this.fetch_bp1 <<= 1;
                            }
                            b.palette = 0;
                            if (this.clock.cgb_enable) {
                                b.palette = this.fetch_cgb_attr & 7;
                                b.sprite_priority = (this.fetch_cgb_attr & 0x80) >>> 7;
                            }
                        }
                        this.bg_request_x += 8;
                        if ((this.ppu.line_cycle < 88) && (!this.ppu.in_window())) {
                            this.bg_request_x -= 8;
                            // Now discard some pixels for scrolling!
                            let sx = this.ppu.io.SCX & 7;
                            this.bg_FIFO.discard(sx);
                        }
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
                this.obj_FIFO.sprite_mix(this.fetch_bp0, this.fetch_bp1, this.fetch_obj.attr, this.fetch_obj.num);
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
        if (this.variant === GB_variants.GBC) { console.log('GBC MODE!'); this.compat_mode = 0; }
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
    sprite_mix(bp0, bp1, attr, sprite_num=0) { //sp_priority, sp_palette, flip) {
        let sp_palette;
        let sp_priority = (attr & 0x80) >>> 7;
        if (this.compat_mode === 1) {
            sp_palette = (attr & 0x10) >>> 4;
        }
        else {
            sp_palette = attr & 7;
        }
        let flip = attr & 0x20;
        // First fill with transparent pixels
        while(this.num_items < 8) {
            let b = this.push();
            b.sprite_priority = 0;
            b.cgb_priority = 60;
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
                // GBC mode
                if (((sprite_num < this.items[i].cgb_priority) && px !== 0) || (this.items[i].pixel === 0)) {
                    this.items[i].palette = sp_palette;
                    this.items[i].sprite_priority = sp_priority;
                    this.items[i].pixel = px;
                    this.items[i].cgb_priority = sprite_num;
                }
            }
        }
    }

    // Discard up to num pixels
    discard(num) {
        for (let i = 0; i < num; i++) {
            this.pop();
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

class GB_PPU {
    /**
     * @param {Number} variant
     * @param {GB_clock} clock
     * @param {GB_bus} bus
     */
    constructor(variant, clock, bus) {
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;
        this.bus.ppu = this;

        this.bg_CRAM = new Uint8Array(64);
        this.obj_CRAM = new Uint8Array(64);

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

            cram_bg_increment: 0,
            cram_bg_addr: 0,
            cram_obj_increment: 0,
            cram_obj_addr: 0
        }

        this.output_shared_buffers = [new SharedArrayBuffer(160*144*2), new SharedArrayBuffer(160*144*2)];
        this.output = [new Uint16Array(this.output_shared_buffers[0]), new Uint16Array(this.output_shared_buffers[1])];
        this.cur_output_num = 1;
        this.cur_output = this.output[1];
        this.last_used_buffer = 1;

        this.first_reset = true;

        this.is_window_line = false;
        this.window_triggered_on_line = false;

        this.bus.CPU_read_OAM = this.read_OAM.bind(this);
        this.bus.CPU_write_OAM = this.write_OAM.bind(this);
        this.disable();
    }

    dump_sprites(imgdata, canvas_width, canvas_height) {
        // 160 bytes of OAM
        let outstr = '';
        let idx = 0;
        for (let i = 0; i < 40; i++) {
            let OBJ = this.OBJ[i];
            //  y x tile attr
            outstr += i + ': ' + hex2(this.OAM[idx]) + ' ' + hex2(this.OAM[idx+1]) + ' ' + hex2(this.OAM[idx+2]) + ' ' + hex2(this.OAM[idx+3]) + '\n';
            idx += 4;
        }
        console.log(outstr);
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

    bg_tile_addr_window(tn, attr = 0) {
        let b12;
        let hbits = 0, ybits;
        if (this.io.bg_window_tile_data_base) b12 = 0;
        else b12 = ((tn & 0x80) ^ 0x80) << 5;
        ybits = this.clock.wly & 7;
        if (this.clock.cgb_enable) {
            if (attr & 8) hbits = 0x2000;
            if (attr & 0x40) ybits = (7 - ybits);
        }
        return (0x8000 | b12 |
            (tn << 4) |
            (ybits << 1)
        ) + hbits;
    }

    bg_tile_addr_nowindow(tn, attr = 0) {
        let b12;
        let hbits = 0, ybits;
        if (this.io.bg_window_tile_data_base) b12 = 0;
        else b12 = ((tn & 0x80) ^ 0x80) << 5;
        ybits = (this.clock.ly + this.io.SCY) & 7;
        if (this.clock.cgb_enable) {
            if (attr & 8) hbits = 0x2000;
            if (attr & 0x40) ybits = (7 - ybits);
        }
        return (0x8000 | b12 |
            (tn << 4) |
            (ybits << 1)
        ) + hbits;
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
                if (this.enabled) this.eval_lyc();
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
            case 0xFF68: // BCPS/BGPI
                if (!this.clock.cgb_enable) return;
                this.io.cram_bg_increment = (val & 0x80) >>> 7;
                this.io.cram_bg_addr = val & 0x3F;
                return;
            case 0xFF69: // BG pal write
                if (!this.clock.cgb_enable) return;
                this.bg_CRAM[this.io.cram_bg_addr] = val;
                if (this.io.cram_bg_increment) this.io.cram_bg_addr = (this.io.cram_bg_addr + 1) & 0x3F;
                return;
            case 0xFF6A: // OPS/OPI
                if (!this.clock.cgb_enable) return;
                this.io.cram_obj_increment = (val & 0x80) >>> 7;
                this.io.cram_obj_addr = val & 0x3F;
                return;
            case 0xFF6B: // OBJ pal write
                if (!this.clock.cgb_enable) return;
                this.obj_CRAM[this.io.cram_obj_addr] = val;
                if (this.io.cram_obj_increment) this.io.cram_obj_addr = (this.io.cram_obj_addr + 1) & 0x3F;
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
            case 0xFF68: // BCPS/BGPI
                if (!this.clock.cgb_enable) return 0xFF;
                return this.io.cram_bg_addr | (this.io.cram_bg_increment << 7);
            case 0xFF69: // BG pal read
                if (!this.clock.cgb_enable) return 0xFF;
                return this.io.bg_CRAM[this.io.cram_bg_addr];
            case 0xFF6A: // OPS/OPI
                if (!this.clock.cgb_enable) return 0xFF;
                return this.io.cram_obj_addr | (this.io.cram_obj_increment << 7);
            case 0xFF6B: // OBJ pal read
                if (!this.clock.cgb_enable) return 0xFF;
                return this.io.obj_CRAM[this.io.cram_obj_addr];
        }
        return 0xFF;
    }

    disable() {
        if (!this.enabled) return;
        this.enabled = false;
        //console.log('DISABLE PPU')
        this.clock.CPU_can_VRAM = 1;
        this.clock.setCPU_can_OAM(1);
        this.io.STAT_IF = 0;
        this.eval_STAT();
    }

    enable() {
        if (this.enabled) return;
        //console.log('ENABLE PPU');
        this.enabled = true;
        this.advance_frame(false)
        this.clock.lx = 0;
        this.clock.ly = 0;
        this.line_cycle = 0;
        this.cycles_til_vblank = 0;
        this.io.STAT_IF = 0;
        this.set_mode(GB_PPU_modes.OAM_search);
        this.eval_lyc();
        this.eval_STAT();
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
                this.bus.cpu.hdma.notify_hblank = true;
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
            //console.log(this.clock.ly, this.clock.lx, this.line_cycle);
            if (this.cycles_til_vblank) {
                this.cycles_til_vblank--;
                if (this.cycles_til_vblank === 0)
                    this.bus.IRQ_vblank_up();
            }
            if (this.enabled) {
                this.cycle();
                this.line_cycle++;
                if (this.line_cycle === 456) this.advance_line();
            }
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
        if ((cly === 153) && (this.io.lyc !== 153)) cly = 0;
        if (cly === this.io.lyc) {
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

    advance_frame(update_buffer=true) {
        this.clock.ly = 0;
        this.clock.wly = 0;
        this.is_window_line = this.clock.ly === this.io.wy;
        if (this.enabled) {
            this.eval_lyc();
            this.display_update = true;
        }
        this.clock.frames_since_restart++;
        this.clock.master_frame++;
        if (update_buffer) {
            this.last_used_buffer = this.cur_output_num;
            this.cur_output_num ^= 1;
            this.cur_output = this.output[this.cur_output_num];
        }
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
            this.OBJ[i].num = 60;
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
                this.OBJ[this.sprites.num].num = i;

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
                if (this.clock.cgb_enable) {
                    if (p.bg_or_sp === 0) {
                        // there are 8 BG palettes
                        // each pixel is 0-4
                        // so it's (4 * palette #) + color
                        let n = ((p.palette * 4) + p.color) * 2;
                        cv = (this.bg_CRAM[n+1] << 8) | this.bg_CRAM[n];
                        //if ((this.clock.ly === 0) && (this.clock.lx === 9))
                        //    console.log('HEREDATA', n, this.bg_CRAM[n+1], this.bg_CRAM[n]);
                    } else {
                        let n = ((p.palette * 4) + p.color) * 2;
                        cv = (this.obj_CRAM[n+1] << 8) | this.obj_CRAM[n];
                        //cv = this.sp_palette[p.palette][p.color];
                    }

                } else {
                    if (p.bg_or_sp === 0) {
                        cv = this.bg_palette[p.color];
                    } else {
                        cv = this.sp_palette[p.palette][p.color];
                    }
                }
                this.cur_output[(this.clock.ly * 160) + (this.clock.lx - 8)] = cv;
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
                //this.clock.ly = 90;
                this.write_IO(0xFF47, 0xFC);
                this.write_IO(0xFF40, 0x91);
                this.write_IO(0xFF41, 0x85);
                this.io.lyc = 0;
                this.io.SCX = this.io.SCY = 0;

                this.advance_frame();
                break;
            default:
                for (let i = 0; i < 0x3F; i++) {
                    this.bg_CRAM[i] = 0xFF;
                }
                this.write_IO(0xFF47, 0xFC);
                this.write_IO(0xFF40, 0x91);
                this.write_IO(0xFF41, 0x85);
                this.io.lyc = 0;
                this.io.SCX = this.io.SCY = 0;

                break;
        }
   }
}