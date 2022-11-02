"use strict";

"use strict";

/*const DO_RENDERLOG = false;

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
}*/

class GB_PPU_noFIFO {
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

        this.clock.ppu_mode = GB_PPU_modes.OAM_search;
        this.line_cycle = 0;
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

            window_tile_map_base: 0,
            window_enable: 0,
            bg_window_tile_data_base: 0,
            bg_tile_map_base: 0,
            obj_enable: 1,
            bg_window_enable: 1,

            old_stat_irq_mode0_enable: 0,
            old_stat_irq_mode1_enable: 0,
            old_stat_irq_mode2_enable: 0,
            old_stat_irq_lylyc_enable: 0,

            stat_irq_mode0_enable: 0,
            stat_irq_mode1_enable: 0,
            stat_irq_mode2_enable: 0,
            stat_irq_lylyc_enable: 0,
            stat_irq_mode0_request: 0,
            stat_irq_mode1_request: 0,
            stat_irq_mode2_request: 0,
            stat_irq_lylyc_request: 0,

            SCX: 0, // X scroll
            SCY: 0, // Y scroll
            wx: 0, // Window X
            wy: 0, // Window Y
        }

        this.output = new Uint8Array(160*144);
        this.first_reset = true;

        this.is_window_line = false;

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

    bg_tilemap_addr_nowindow() {
        return (0x9800 | (this.io.bg_tile_map_base << 10) |
            ((((this.clock.ly + this.io.SCY) & 0xFF) >>> 3) << 5) |
            (((this.clock.lx + this.io.SCX) & 0xFF) >>> 3)
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
        this.draw_lines_around_screen(imgdata);

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
                if (this.variant !== GB_variants.GBC) {
                    this.io.stat_irq_mode0_enable = 1;
                    this.io.stat_irq_mode1_enable = 1;
                    this.io.stat_irq_mode2_enable = 1;
                    this.io.stat_irq_lylyc_enable = 1;
                    this.IRQ_stat_eval();
                    //this.bus.cpu.force_IRQ_latch();
                }
                this.io.stat_irq_mode0_enable = (val & 8) >>> 3;
                this.io.stat_irq_mode1_enable = (val & 0x10) >>> 4;
                this.io.stat_irq_mode2_enable = (val & 0x20) >>> 5;
                this.io.stat_irq_lylyc_enable = (val & 0x40) >>> 6;
                this.IRQ_stat_eval();
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
                this.eval_lyc();
                return;
            case 0xFF4A: // window Y
                this.io.wy = val;
                return;
            case 0xFF4B: // window x + 7
                this.io.wx = val;
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
                return this.clock.ppu_mode |
                    ((this.clock.ly === this.io.lyc) ? 1 : 0) |
                    (this.io.stat_irq_mode0_enable << 3) |
                    (this.io.stat_irq_mode1_enable << 4) |
                    (this.io.stat_irq_mode2_enable << 5) |
                    (this.io.stat_irq_lylyc_enable << 6);
            case 0xFF42: // SCY
                return this.io.SCY;
            case 0xFF43: // SCX
                return this.io.SCX;
            case 0xFF44: // LY
                /*console.log('READ FF44!', this.clock.ly);
                if (this.clock.ly === 0x90) dbg.break();*/
                return this.clock.ly;
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
        console.log('DISABLE PPU', this.enabled);
        if (!this.enabled) return;
        console.log('DISABLE PPU');
        this.enabled = false;
        this.reset();
        this.clock.CPU_can_VRAM = 1;
        this.clock.CPU_can_OAM = 1;
    }

    enable() {
        //console.log('ENABLE PPU', this.enabled);
        if (this.enabled) return;
        this.enable_next_frame = true;
        this.clock.CPU_can_OAM = 0;
    }

    IRQ_stat_eval_mode0() {
        if (this.io.stat_irq_mode0_enable && this.io.stat_irq_mode0_request && !this.io.old_stat_irq_mode0_enable)
            this.IRQ_mode0_up();
        if ((!this.io.stat_irq_mode0_enable) && this.io.stat_irq_mode0_request && this.io.old_stat_irq_mode0_enable)
            this.IRQ_mode0_down();
        this.io.old_stat_irq_mode0_enable = this.io.stat_irq_mode0_enable;
    }

    IRQ_stat_eval_mode1() {
        if (this.io.stat_irq_mode1_enable && this.io.stat_irq_mode1_request && !this.io.old_stat_irq_mode1_enable)
            this.IRQ_mode1_up();
        if ((!this.io.stat_irq_mode1_enable) && this.io.stat_irq_mode1_request && this.io.old_stat_irq_mode1_enable)
            this.IRQ_mode1_down();
        this.io.old_stat_irq_mode1_enable = this.io.stat_irq_mode1_enable;
    }

    IRQ_stat_eval_mode2() {
        if (this.io.stat_irq_mode2_enable && this.io.stat_irq_mode2_request && !this.io.old_stat_irq_mode2_enable)
            this.IRQ_mode2_up();
        if ((!this.io.stat_irq_mode2_enable) && this.io.stat_irq_mode2_request && this.io.old_stat_irq_mode2_enable)
            this.IRQ_mode2_down();
        this.io.old_stat_irq_mode2_enable = this.io.stat_irq_mode2_enable;
    }

    IRQ_stat_eval_lylyc() {
        if (this.io.stat_irq_lylyc_enable && this.io.stat_irq_lylyc_request && !this.io.old_stat_irq_lylyc_enable)
            this.IRQ_lylyc_up();
        if ((!this.io.stat_irq_lylyc_enable) && this.io.stat_irq_lylyc_request && this.io.old_stat_irq_lylyc_enable)
            this.IRQ_lylyc_down();
        this.io.old_stat_irq_lylyc_enable = this.io.stat_irq_lylyc_enable;
    }

    // Called on change to IRQ STAT settings
    IRQ_stat_eval() {
        return;
        this.IRQ_stat_eval_mode0();
        this.IRQ_stat_eval_mode1();
        this.IRQ_stat_eval_mode2();
        this.IRQ_stat_eval_lylyc();
    }

    set_mode(which) {
        if (this.clock.ppu_mode === which) return;
        this.clock.ppu_mode = which;

        switch(which) {
            case GB_PPU_modes.OAM_search: // 2. after vblank
                this.clock.CPU_can_OAM = 0;
                this.clock.CPU_can_VRAM = 1;
                //
                if (this.enabled) {
                    this.bus.IRQ_vblank_down();
                    this.IRQ_mode1_down();
                    if (this.io.stat_irq_mode2_enable)
                        this.IRQ_mode2_up();
                }
                break;
            case GB_PPU_modes.pixel_transfer: // 3
                this.IRQ_mode2_down();
                this.clock.CPU_can_VRAM = 0;
                this.clock.CPU_can_OAM = 0;
                break;
            case GB_PPU_modes.HBLANK: // 0
                if (this.io.stat_irq_mode0_enable)
                    this.IRQ_mode0_up();
                this.clock.CPU_can_VRAM = 1;
                this.clock.CPU_can_OAM = 1;
                break;
            case GB_PPU_modes.VBLANK: // 1
                this.IRQ_mode0_down();
                this.clock.CPU_can_VRAM = 1;
                this.clock.CPU_can_OAM = 1;
                if (this.io.stat_irq_mode1_enable)
                    this.IRQ_mode1_up();
                this.bus.IRQ_vblank_up();
                break;
        }
    }

    run_cycles(howmany) {
        // We don't do anything, and in fact are off, if LCD is off
        for (let i = 0; i < howmany; i++) {
            // TODO: make this enabled on frame AFTER enable happens
            if (this.enabled) this.cycle();
            this.line_cycle++;
            if (this.line_cycle === 456) this.advance_line();
            if (dbg.do_break) break;
        }
    }

    advance_line() {
        this.is_window_line = this.clock.ly >= this.io.wy;
        this.clock.lx = 0;
        this.clock.ly++;
        this.clock.vy++;
        this.clock.wlx = 0;
        this.line_cycle = 0;
        if (this.clock.ly < 144) {
            this.set_mode(2); // OAM search
        }
        else if (this.clock.ly >= 154)
            this.advance_frame();
        if (this.enabled) {
            this.eval_lyc();
            if (this.clock.ly === 144)
                this.set_mode(1); // VBLANK
        }
    }

    // TODO: trigger IRQ if enabled properly
    eval_lyc() {
        //console.log(this.io.stat_irq_lylyc_enable, this.clock.ly, this.io.lyc)
        if ((this.io.stat_irq_lylyc_enable) && (this.clock.ly === this.io.lyc))
            this.IRQ_lylyc_up();
        else
            this.IRQ_lylyc_down();
    }

    IRQ_lylyc_up() {
        this.io.stat_irq_lylyc_request = 1;
        if (!(this.io.stat_irq_mode0_request || this.io.stat_irq_mode1_request || this.io.stat_irq_mode2_request))
            this.trigger_stat_irq()
    }

    IRQ_lylyc_down() {
        this.io.stat_irq_lylyc_request = 0;
        this.IRQ_check_down();
    }

    IRQ_mode0_up() {
        this.io.stat_irq_mode0_request = 1;
        if (!(this.io.stat_irq_mode1_request || this.io.stat_irq_mode2_request || this.io.stat_irq_lylyc_request))
            this.trigger_stat_irq()
    }

    IRQ_mode0_down() {
        this.io.stat_irq_mode0_request = 0;
        this.IRQ_check_down();
    }

    trigger_stat_irq() {
        //console.log('TRIGGERING STAT IRQ!');
        this.bus.cpu.cpu.regs.IF |= 2;
    }

    IRQ_mode1_up() {
        this.io.stat_irq_mode1_request = 1;
        if (!(this.io.stat_irq_mode0_request || this.io.stat_irq_mode2_request || this.io.stat_irq_lylyc_request))
            this.trigger_stat_irq()
    }

    IRQ_mode1_down() {
        this.io.stat_irq_mode1_request = 0;
        this.IRQ_check_down();
    }

    IRQ_mode2_up() {
        this.io.stat_irq_mode2_request = 1;
        if (!(this.io.stat_irq_mode0_request || this.io.stat_irq_mode1_request || this.io.stat_irq_lylyc_request))
            this.trigger_stat_irq()
    }

    IRQ_mode2_down() {
        this.io.stat_irq_mode2_request = 0;
        this.IRQ_check_down();
    }

    IRQ_check_down() {
        if (!(this.io.stat_irq_lylyc_request || this.io.stat_irq_mode0_request || this.io.stat_irq_mode1_request || this.io.stat_irq_mode2_request)) {
            this.bus.cpu.cpu.regs.IF &= 0xFD;
        }
    }

    advance_frame() {
        if (this.enable_next_frame) {
            this.enabled = true;
            this.enable_next_frame = false;
        }
        this.clock.ly = 0;
        this.clock.wly = -1;
        if (this.enabled) {
            this.display_update = true;
        }
        this.clock.frames_since_restart++;
        this.clock.master_frame++;
        this.window_v_counter = 0;
    }

    /********************/
    OAM_search() {
        if (this.line_cycle !== 75) return;

        // Check if a sprite is at the right place
        this.sprites.num = 0;
        this.sprites.index = 0;
        this.sprites.search_index = 0;
        for (let i = 0; i < 10; i++) {
            this.OBJ[i].x = -8;
            this.OBJ[i].in_q = 0;
        }

        for (let i = 0; i < 40; i++) {
            if (this.sprites.num === 10) break;
            let sy = this.OAM[this.sprites.search_index] - 16;
            let sy_bottom = sy + (this.io.sprites_big ? 16 : 8);
            if ((this.clock.ly >= sy) && (this.clock.ly < sy_bottom)) {
                this.OBJ[this.sprites.num].y = sy;
                this.OBJ[this.sprites.num].x = this.OAM[this.sprites.search_index + 1] - 8;
                this.OBJ[this.sprites.num].tile = this.OAM[this.sprites.search_index + 2];
                this.OBJ[this.sprites.num].attr = this.OAM[this.sprites.search_index + 3];
                this.OBJ[this.sprites.num].in_q = 1;

                this.sprites.num++;
            }
            this.sprites.search_index += 4
        }

        // Sort by X
        this.OBJ.sort((a,b) => {
            return (a.in_q) ? a.x - b.x : 1;
        })
        //if (this.sprites.num >4) console.log(this.sprites.num, JSON.stringify(this.OBJ));
    }

    in_window() {
        return this.is_window_line && (this.io.wx >= this.clock.lx);
    }

    pixel_transfer() {
        // write to screen

        let sp_x, sp_y, sp_color, sp_tn;
        let has_sp = false;
        let sp_attr, sp_pal;

        if (this.io.obj_enable) {
            for (let i = this.sprites.num - 1; i >= 0; i--) {
                /**
                 * @type {GB_PPU_sprite_t}
                 */
                let OBJ = this.OBJ[i];
                if ((OBJ.x >= -7) && (OBJ.x <= 0)) {
                    has_sp = true;
                    sp_x = 0 - OBJ.x;
                    sp_y = (this.clock.ly - OBJ.y);
                    sp_attr = OBJ.attr;
                    if (sp_attr & 0x20) sp_x = 7 - sp_x;
                    sp_pal = (OBJ.attr & 0x10) >>> 4;
                    sp_tn = OBJ.tile;
                }
                OBJ.x--;
            }
        }


        // Discard first 8 pixels
        let bg_color = 0;
        let cv;


        /*if (this.in_window()) { // Grab window tile
            cv = 0;
        }
        else */{ // Grab background tile
            if (this.io.bg_window_enable) {
                let addr = this.bg_tilemap_addr_nowindow()
                let tn = this.bus.mapper.PPU_read(addr);
                addr = this.bg_tile_addr_nowindow(tn);
                let bp0 = this.bus.mapper.PPU_read(addr);
                let bp1 = this.bus.mapper.PPU_read(addr + 1);
                let index = 7 - ((this.clock.lx + this.io.SCX) & 7);
                let mask = 1 << index;
                bg_color = ((bp0 & mask) >>> index) | (((bp1 & mask) >>> index) << 1);
            }
        }

        let use_what = 1;

        if (has_sp) {
            let addr = GB_sp_tile_addr(sp_tn, sp_y, this.io.sprites_big, sp_attr & 0x40);
            let bp0 = this.bus.mapper.PPU_read(addr);
            let bp1 = this.bus.mapper.PPU_read(addr + 1)
            let index = 7 - sp_x;
            let mask = 1 << index;
            sp_color = ((bp0 & mask) >>> index) | (((bp1 & mask) >>> index) << 1);

            if ((sp_attr & 0x80) && (bg_color !== 0)) // "If the OBJ pixel has its priority bit set, and the BG pixel's ID is not 0, pick the BG pixel."
                use_what = 1; // use bg I guess
            else if (sp_color === 0) // "If the OBJ pixel is 0, pick the BG pixel; "
                use_what = 1; // BG
            else // "otherwise, pick the OBJ pixel"
                use_what = 2; // sprite
        }

        if (use_what === 1)
            cv = this.bg_palette[bg_color];
        else
            cv = this.sp_palette[sp_pal][sp_color];

        this.output[(this.clock.ly * 160) + this.clock.lx] = cv;
        this.clock.lx++;
        if (this.in_window()) this.clock.wlx++;
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
                if (this.clock.lx >= 160)
                    this.set_mode(0);
                break;
        }
    }

/*
Each scanline is 456 dots (114 CPU cycles) long and consists of

mode 2 (OAM search). 80 dots long (2 for each OAM entry). finds up to 10 sprites
mode 3 (pixel transfer), 173.5+ dots long because of FIFO, plus extra
mode 0 (hblank) is the rest of the time
vblank is mode 1, 10 lines

so 456 CYCLES by 154 LINES



at BEGINNING FETCH of LINE, fetch x2. throw away the first fetch.
8-pixel (32-bit) pixel dual FIFO, one for BG, one for sprite


fetch tile # - 2 cycles
fetch bitplane 0 - 2 cycles
fetch bitplane 1 - 2 cycles
fetch sprite top/bottom IF APPLICABLE

it'll do tile-pp-bpp-sprite PER SPRITE?

FIFO stores BPP, priority (sprite), palette #

FIFO is shifting out pixels and must >0 before sprite can happen

when we hit window, bg FIFO is cleared and fetches start over

x fine scroll discards from the FIFO, delaying start

there are comparators for each sprite.
if a sprite x is the same as our current rendering position,
we mix the sprite into the sprite FIFO


and mode 0 (horizontal blanking) whatever is left over

After 144 scanlines are drawn are 10 lines of mode 1 (vertical blanking), for a total of 154 lines or 70224 dots per screen.

The CPU can't see VRAM (writes are ignored and reads are $FF) during mode 3, but it can during other modes.
The CPU can't see OAM during modes 2 and 3, but it can during blanking modes (0 and 1).

To make the estimate for mode 3 more precise, see "Nitty Gritty Gameboy Cycle Timing" by Kevin Horton.
 */

    reset() {
        // Reset variables
        this.clock.lx = 0;
        this.clock.ly = 0;
        this.line_cycle = 0;
        this.fetch_cycle = 0;
        this.display_update = false;

        // Reset IRQs
        this.io.stat_irq_mode0_request = 0;
        this.io.stat_irq_mode1_request = 0;
        this.io.stat_irq_mode2_request = 0;
        this.io.stat_irq_lylyc_request = 0;
        this.io.stat_irq_mode0_enable = this.io.stat_irq_mode1_enable = this.io.stat_irq_mode2_enable = this.io.stat_irq_lylyc_enable = 0;
        if (!this.first_reset)
            this.IRQ_check_down();

        // Set mode to OAM search
        this.set_mode(GB_PPU_modes.OAM_search);
        this.first_reset = false;
   }

   quick_boot() {
        this.enabled = true;
        let val = 0xFC;
        this.clock.ly = 90;
        this.write_IO(0xFF47, 0xFC)
        this.advance_frame();
   }
}