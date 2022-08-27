"use strict";

class NES_ppu {
    /**
     * @param {HTMLElement} canvas
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(canvas, clock, bus) {
        this.canvas = canvas;
        this.clock = clock;
        this.bus = bus;

        this.bus.PPU_reg_write = this.write_regs.bind(this);
        this.bus.PPU_reg_read = this.read_regs.bind(this);

        this.render_cycle = this.scanline_visible;
        this.mem_read = function(addr) { return 0x00; }

        this.line_cycle = 0;
        this.OAM = new Uint8Array(256);
        this.secondary_OAM = new Uint8Array(32);
        this.secondary_OAM_index = 0;
        this.secondary_OAM_sprite_index = 0;
        this.secondary_OAM_sprite_total = 0;
        this.secondary_OAM_lock = false;
        this.OAM_transfer_latch = 0;
        this.OAM_eval_index = 0;
        this.OAM_eval_done = false;
        this.OAM_eval_sprite_overflow = false;
        this.OAM_eval_sprite0 = 0;

        this.clock.ppu = this;

        this.CGRAM = new Uint8Array(0x20);

        this.output = new Uint8Array(256*240);

        this.bg_fetches = new Uint8Array(4);
        this.bg_shifter = 0;
        this.bg_attribute = 0;
        this.palette_shifters = new Uint8Array(2);
        this.sprite_pattern_shifters = new Uint16Array(8);
        this.sprite_attribute_latches = new Uint8Array(8);
        this.sprite_x_counters = new Int16Array(8);
        this.sprite_y_lines = new Uint8Array(8);

        this.VRAM_addr = 0;
        this.temp_VRAM_addr = 0;
        this.fine_x_scroll = 0;
        this.write_latch = 0;

        this.io = {
            nmi_enable: 0,
            sprite_overflow: 0,
            sprite0_hit: 0,
            vblank: 0,
            vram_increment: 1,

            sprite_pattern_table: 0,
            bg_pattern_table: 0,

            v: 0,
            t: 0,
            x: 0,
            w: 0,

            greyscale: 0,
            bg_hide_left_8: 0,
            sprite_hide_left_8: 0,
            bg_enable: 0,
            sprite_enable: 0,

            OAM_addr: 0
        }

        this.status = {
            sprite_height: 8, // 8 or 16
            VRAM_addr: 0,
            temp_VRAM_addr: 0,
            fine_x_scroll: 0,
            write_latch: 0,

            attribute: 0, // Current attribute block
        }

        this.latch = {
            write: 0,
            y_scroll: 0,
            vram_data: 0,
            attribute: 0, // Attribute latch
        }
    }

    present(buf=null) {
        let ctx = this.canvas.getContext('2d');
        let TOP_OVERSCAN = 8;
        let BOTTOM_OVERSCAN = 232;
        let imgdata = ctx.getImageData(0, 0, 256, 240 - ((240 - BOTTOM_OVERSCAN) + TOP_OVERSCAN));
        for (let ry = TOP_OVERSCAN; ry < BOTTOM_OVERSCAN; ry++) {
            let y = ry - TOP_OVERSCAN;
            for (let x = 0; x < 256; x++) {
                let di = (y * 256 * 4) + (x * 4);
                let ppui = (y * 256) + x;
                let p = this.output[ppui] ? 255 : 0;
                if (this.output[ppui] !== 0) {
                    console.log(this.output[ppui]);
                }

                imgdata.data[di] = p;
                imgdata.data[di+1] = p;
                imgdata.data[di+2] = p;
                imgdata.data[di+3] = 255;
            }
        }
        ctx.putImageData(imgdata, 0, 0);
    }

    reset() {
        this.line_cycle = 0;
        this.io.w = 0;
    }

    write_cgram(addr, val) {
        if((addr & 0x13) === 0x10) addr &= 0xEF;
        this.CGRAM[addr] = data;

    }

    mem_write(addr, val) {
        if (addr <= 0x3EFF) this.bus.write_ppu_mem(addr, val);
        else this.write_cgram(addr & 0x1F, val);
    }

    write_regs(addr, val) {
        switch((addr & 7) | 0x2000) {
            case 0x2000: // PPUCTRL
                this.io.sprite_pattern_table = (val & 8) >>> 3;
                this.io.bg_pattern_table = (val & 0x10) >>> 4;
                this.status.sprite_height = (val & 0x20) >>> 5 ? 16 : 8;
                this.io.nmi_enable = (val & 0x80) >>> 7;
                this.io.vram_increment = (val & 0x40) ? 32 : 1;

                this.io.t = (this.io.t & 0x73FF) | ((val & 3) << 10);

                this.update_nmi();
                console.log('2k', this.io.nmi_enable);
                return;
            case 0x2001: // PPUMASK
                this.io.greyscale = val & 1;
                this.io.bg_hide_left_8 = (val & 2) >>> 1;
                this.io.sprite_hide_left_8 = (val & 4) >>> 2;
                this.io.bg_enable = (val & 8) >>> 3;
                this.io.sprite_enable = (val & 0x10) >>> 4;
                // NOTFINISHED: emphasizes
                return;
            case 0x2003: // OAMADDR
                this.io.OAM_addr = val;
                return;
            case 0x2004: // OAMDATA
                this.OAM[this.io.OAM_addr] = val;
                this.io.OAM_addr = (this.io.OAM_addr + 1) & 0xFF;
                return;
            case 0x2005: // PPUSCROLL
                if (!this.io.w) {
                    this.io.x = val & 7;
                    this.io.t = (this.io.t & 0x7FE0) | (val >>> 3);
                } else {
                    this.io.t = (this.io.t & 0x0C1F) | ((val & 0xF8) << 2) | ((val & 7) << 12);
                }
                // NOTFINISHED
                this.io.w = +(!this.io.w);
                return;
            case 0x2006: // PPUADDR
                if (!this.io.w) {
                    this.io.t = (this.io.t & 0xFF) | ((val & 0x3F) << 8);
                } else {
                    this.io.t = (this.io.t & 0x7F) | val;
                    this.io.v = this.io.t;
                }

                this.io.w = +(!this.io.w);
                return;
            case 0x2007: // PPUDATA
                if (!this.clock.vblank) return;
                this.mem_write(this.io.v & 0x3FFF, data);
                this.io.v = (this.io.v + this.io.vram_increment) & 0x7FFF;
                return;
            default:
                break;

        }
    }

    update_nmi() {
        if (this.clock.vblank && this.io.nmi_enable) {
            this.bus.CPU_notify_NMI(1);
        }
        else {
            this.bus.CPU_notify_NMI(0);
        }
    }

    read_regs(addr, val=0, has_effect=true) {
        let output = val;
        switch(addr) {
            case 0x2002:
                output = (this.io.sprite_overflow << 5) | (this.io.sprite0_hit << 6) | (this.clock.vblank << 7);
                if (has_effect) {
                    this.clock.vblank = 0;
                    this.update_nmi();

                    this.io.w = 0;
                }
                // NOTFINISHED
                break;
            case 0x2004: // OAMDATA
                output = this.io.OAM[this.io.OAM_addr];
                // reads do not increment counter
                break;
        }
        return output;
    }

    fetch_chr_line(table, tile, line) {
        let r = (0x1000 * table) + (tile * 16) + line;
        let low = this.mem_read(r);
        let high = this.mem_read(r+8);
        let output = 0;
        for (let i = 0; i < 8; i++) {
            output <<= 2;
            output |= ((low & 0x80) >>> 7) | ((high & 0x80) >>> 6);
            low <<= 1;
            high <<= 1;
        }
        return output;
    }

    fetch_chr_line16(table, tile, line) {
        let r = (0x1000 * table) + (tile * 16) + line;
        let low = this.mem_read(r);
        let high = this.mem_read(r+8);
        return low | (high << 8);
    }


    // Do evaluation of next line of sprites
    oam_evaluate_slow() {
        let odd = (this.line_cycle % 2) === 1;
        let even = !odd;
        let eval_y = this.clock.ppu_y + 1;
        if (this.line_cycle <= 64) {
            if (even)
                this.secondary_OAM[this.line_cycle >>> 1] = 0xFF;
            if (this.line_cycle === 1) {
                this.secondary_OAM_sprite_total = 0;
                this.secondary_OAM_index = 0;
                this.OAM_eval_index = 0;
                this.secondary_OAM_lock = false;
                this.OAM_eval_sprite_overflow = false;
                this.OAM_eval_done = false;
            }
            return;
        }
        if (this.line_cycle <= 256) { // and >= 65...
            if (this.OAM_eval_done) return;
            if (odd) {
                this.OAM_transfer_latch = this.OAM[this.OAM_eval_index];
            }
            else {
                if (!this.secondary_OAM_lock) this.secondary_OAM[this.secondary_OAM_index] = this.OAM_transfer_latch;
                if (!this.secondary_OAM_lock) {
                    if ((eval_y >= this.OAM_transfer_latch) && (eval_y <= (this.OAM_transfer_latch + this.status.sprite_height))) {
                        if (this.secondary_OAM_index === 0) this.OAM_eval_sprite0 = 1;
                        this.secondary_OAM[this.secondary_OAM_index + 1] = this.OAM[this.OAM_eval_index + 1];
                        this.secondary_OAM[this.secondary_OAM_index + 2] = this.OAM[this.OAM_eval_index + 2];
                        this.secondary_OAM[this.secondary_OAM_index + 3] = this.OAM[this.OAM_eval_index + 3];
                        this.secondary_OAM_index += 4;
                        this.secondary_OAM_sprite_total++;
                        this.secondary_OAM_lock = this.OAM_eval_index >= 32;
                    }
                }
                this.OAM_eval_index += 4;
                if (this.OAM_eval_index >= 256) {
                    this.OAM_eval_index = 0;
                    this.secondary_OAM_lock = true;
                    this.OAM_eval_done = true;
                }
            }
            return;
        }

        if (this.line_cycle === 257) {
            this.secondary_OAM_index = 0;
            this.secondary_OAM_sprite_index = 0;
            // Perform weird sprite overflow glitch
            let n = 0;
            let m = 0;
            let f = 0;
            while(n < 64) {
                let e = this.OAM[(n * 4) + m];
                // If value is in range....
                if ((eval_y >= e) && (eval_y <= (e + this.status.sprite_height))) {
                    // Set overflow flag if needed
                    f++;
                    if (f >= 8) {
                        this.OAM_eval_sprite_overflow = true;
                        break;
                    }
                    m = (m + 4) & 0x03;
                    n++;
                }
                // Value is not in range...
                else {
                    n++;
                    m = (m + 4) & 0x03; // Here is the hardware bug. This should be set to 0 instead!
                }
            }
        }
        if ((this.line_cycle >= 257) && (this.line_cycle <= 320)) {
            // Sprite data fetches into shift registers
            if (this.secondary_OAM_sprite_index >= this.secondary_OAM_sprite_total) return;
            if (this.secondary_OAM_index >= 32) return;
            let sub_cycle = (this.line_cycle - 257) & 0x07;
            switch(sub_cycle) {
                case 0: // Read Y coordinate.
                    this.sprite_y_lines[this.secondary_OAM_sprite_index] = eval_y - this.secondary_OAM[this.secondary_OAM_index];
                    this.secondary_OAM_index++;
                    break;
                case 1: // Read tile number
                    this.sprite_pattern_shifters[this.secondary_OAM_sprite_index] = this.secondary_OAM[this.secondary_OAM_index];
                    this.secondary_OAM_index++;
                    break;
                case 2: // Read attributes
                    this.sprite_attribute_latches[this.secondary_OAM_sprite_index] = this.secondary_OAM[this.secondary_OAM_index];
                    this.secondary_OAM_index++;
                    break;
                case 3: // Read X-coordinate
                    this.sprite_x_counters[this.secondary_OAM_sprite_index] = this.secondary_OAM[this.secondary_OAM_index];
                    this.secondary_OAM_index++;
                    break;
                case 4: // Fetch tiles for the shifters
                    let tn = this.sprite_pattern_shifters[this.secondary_OAM_sprite_index];
                    let sy = this.sprite_y_lines[this.secondary_OAM_sprite_index];
                    let table = this.io.sprite_pattern_table;
                    if (this.status.sprite_height === 16) {
                        table = (tn & 80) ? 1 : 0;
                        tn &= 0x7F;
                    }
                    if (sy > 7) {
                        sy -= 8;
                        tn += 1;
                    }
                    this.sprite_pattern_shifters[this.secondary_OAM_sprite_index] = this.fetch_chr_line(table, tn, sy);
                    break;
                case 5:
                case 6:
                    break;
                case 7:
                    this.secondary_OAM_sprite_index++;
                    break;
            }

        }
    }

    cycle_scanline_addr() {
        if ((this.line_cycle !== 0) && ((this.line_cycle & 7) === 0) && ((this.line_cycle >= 328) || (this.line_cycle < 256))) {
            // INCREMENT HORIZONTAL SCROLL IN v
            if ((this.io.v & 0x1F) === 0x1F)
                this.io.v = (this.io.v & 0x7FFFFFE0) & 0x0400;
            else
                this.io.v++;
            return;
        }
        if (this.line_cycle === 256) {
            // INCREMENT VERTICAL SCROLL IN v
            if (!this.io.fblank) {
                if ((this.io.v & 0x7000) !== 0x7000)
                    this.io.v += 0x1000;
                else {
                    this.io.v &= 0x8FFF;
                    let y = (this.io.v & 0x03E0) >>> 5;
                    if (y === 29) {
                        y = 0;
                        this.io.v ^= 0x0800
                    } else if (y === 31) {
                        y = 0;
                    }
                    else {
                        y += 1;
                    }
                    this.io.v = (this.io.v & 0x7C1F) | (y << 5);
                }
            }
            return;
        }
        if (this.line_cycle === 257) {
            this.io.v = (this.io.v & 0x7BE0) | (this.io.t & 0x20F);
        }
    }

    // Get tile info into shifters using screen X, Y coordinates
    scanline_prerender() {
        // 261
        this.cycle_scanline_addr();
        if (this.line_cycle === 304) {
            this.io.v = (this.io.v & 0x041F) | (this.io.t & 0x7BE0);
        }
        if (((this.clock.frame_odd) && (this.line_cycle === 339)) || (this.line_cycle === 340)) {
            this.new_scanline();
        }
        this.oam_evaluate_slow();
    }

    scanline_visible() {
        if (this.line_cycle === 0) {
            return;
        } // DO NOTHING here

        let sx = this.line_cycle-1;
        let sy = this.clock.ppu_y;
        let bo = (sy * 256) + sx;
        if (this.clock.fblank) {
            this.output[bo] = 0;
            return;
        }

        if (this.line_cycle === 340) {
            this.new_scanline();
            // Quit out if we've stumbled past the last rendered line
            if (this.clock.ppu_y >= 240) return;
        }

        this.cycle_scanline_addr();
        this.oam_evaluate_slow();

        let tile_y = (sy & 7);

        let odd = (this.line_cycle & 1);

        // Do memory accesses and shifters
        switch(this.line_cycle & 7) {
            case 0: // nametable, tile #
                this.bg_fetches[0] = this.mem_read(0x2000 | (this.io.v & 0xFFF));
                break;
            case 1: // reload shifter
                this.bg_shifter = (this.bg_shifter & 0xFFFF) | (this.bg_fetches[2] << 16) | (this.bg_fetches[3] << 24);
                this.bg_attribute = this.bg_fetches[1];
                break;
            case 2: // attribute table
                this.bg_fetches[1] = this.mem_read((0x23C0 | (this.io.v & 0x0C00)) | ((this.io.v >>> 4) & 0x38) | ((this.io.v >>> 2) & 7));
                break;
            case 4: // low buffer
                let r = this.fetch_chr_line(this.io.bg_pattern_table, this.mem_read, tile_y);
                this.bg_fetches[2] = r & 0xFF;
                this.bg_fetches[3] = (r >>> 8);
                break;
            //case 6: // high buffer, already got it last time though
            //    break;
        }

        // Shift out some bits for backgrounds
        let bg_color_low_bits = this.bg_shifter & 3;
        this.bg_shifter >>>= 2;
        let bg_color = bg_color_low_bits;

        let sprite_priority = 0;
        let sprite_color = 0;

        // Check if any sprite0
        for (let m = 0; m < 8; m++) {
            this.sprite_x_counters[m]--;
            if ((this.sprite_x_counters[m] >= -8) && (this.sprite_x_counters[m] <= -1)) {
                sprite_color = this.sprite_pattern_shifters[m] & 3;
                this.sprite_pattern_shifters[m] >>>= 2;
                sprite_color |= (this.sprite_attribute_latches[m] & 3) << 2;
                sprite_priority = (this.sprite_attribute_latches[m] & 0x20) >>> 5;
            }
        }
        // Decide background or sprite
        let out_color = bg_color;
        if (sprite_color !== 0) {
            if (bg_color === 0) {
                out_color = sprite_color;
            }
            else {
                if (sprite_priority) out_color = sprite_color;
                else out_color = bg_color;
            }
        }

        this.output[bo] = out_color;
    }

    scanline_postrender() {
        // 240, (also 241-260)
        // LITERALLY DO NOTHING
        if (this.line_cycle === 340) this.new_scanline();
    }

    scanline_vblank() {
        // 241-260
        // LITERALLY DO NOTHING
        if (this.line_cycle === 340) this.new_scanline();
    }

    new_scanline() {
        if (this.clock.ppu_y === this.clock.timing.ppu_pre_render) {
            this.clock.advance_frame();
        }
        else this.clock.advance_scanline();

        if (this.clock.ppu_y === this.clock.timing.vblank_start) {
            this.clock.vblank = 1;
            this.update_nmi();
        }
        else if (this.clock.ppu_y === this.clock.timing.vblank_end) {
            this.clock.vblank = 0;
            this.update_nmi();
        }
        switch(this.clock.ppu_y) {
            case 0:
                this.render_cycle = this.scanline_visible;
                break;
            case this.clock.timing.post_render_ppu_idle:
                this.render_cycle = this.scanline_postrender;
                break;
            case this.clock.timing.ppu_pre_render:
                this.render_cycle = this.scanline_prerender;
                break;
        }
        this.line_cycle = 0; // This will immediately get
    }

    cycle(howmany) {
        for (let i = 0; i < howmany; i++) {
            this.render_cycle();
            this.line_cycle++;
        }
        return howmany;
    }

	render_sprites_from_memory(y_origin, x_origin, builtin_color) {
        console.log('THESE OBJECTS', this.OAM);
        let ctx = this.canvas.getContext('2d');
        let imgdata = ctx.getImageData(x_origin, y_origin, 256, 224);
        for (let sy = 1; sy < 240; sy++) {
            for (let sx = 0; sx < 256; sx++) {
                let addr = (sy * 256 * 4) + (sx * 4);
                imgdata.data[addr] = 0;
                imgdata.data[addr + 1] = 0;
                imgdata.data[addr + 2] = 0;
                imgdata.data[addr + 3] = 255;
            }
        }

        for (let m = 0; m < 64; m++) {
            let oa = m*4;
            let y = this.OAM[oa];
            let x = this.OAM[oa+3];
            console.log(x, y);
        }
		ctx.putImageData(imgdata, x_origin, y_origin);
    }

}
