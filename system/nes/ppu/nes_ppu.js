"use strict";

var NES_palette_str = "\
 84  84  84    0  30 116    8  16 144   48   0 136   68   0 100   92   0  48   84   4   0   60  24   0   32  42   0    8  58   0    0  64   0    0  60   0    0  50  60    0   0   0  0 0 0  0 0 0 \
152 150 152    8  76 196   48  50 236   92  30 228  136  20 176  160  20 100  152  34  32  120  60   0   84  90   0   40 114   0    8 124   0    0 118  40    0 102 120    0   0   0  0 0 0  0 0 0 \
236 238 236   76 154 236  120 124 236  176  98 236  228  84 236  236  88 180  236 106 100  212 136  32  160 170   0  116 196   0   76 208  32   56 204 108   56 180 204   60  60  60  0 0 0  0 0 0 \
236 238 236  168 204 236  188 188 236  212 178 236  236 174 236  236 174 212  236 180 176  228 196 144  204 210 120  180 222 120  168 226 144  152 226 180  160 214 228  160 162 160  0 0 0  0 0 0 ";

function NES_parse_palette() {
    //for (let i = 0; i < 64; i++) {

    //}
    let arr = NES_palette_str.split(' ');
    let out = [];
    for (let i in arr) {
        if (arr[i] === '') continue;
        out.push(parseInt(arr[i]));
    }

    let outstr = 'const NES_palette = Object.freeze({\n';
    for (let num = 0; num < 64; num++) {
        let i = num*3;
        console.log(num, out[i], out[i+1], out[i+2])
        outstr += '    ' + num + ': [' + hex0x2(out[i]) + ', ' + hex0x2(out[i+1]) + ', ' + hex0x2(out[i+2]) + '],\n';
    }
    outstr += '});';
    console.log(outstr);
}
//NES_parse_palette();

const NES_palette = Object.freeze({
    0: [0x54, 0x54, 0x54],
    1: [0x00, 0x1E, 0x74],
    2: [0x08, 0x10, 0x90],
    3: [0x30, 0x00, 0x88],
    4: [0x44, 0x00, 0x64],
    5: [0x5C, 0x00, 0x30],
    6: [0x54, 0x04, 0x00],
    7: [0x3C, 0x18, 0x00],
    8: [0x20, 0x2A, 0x00],
    9: [0x08, 0x3A, 0x00],
    10: [0x00, 0x40, 0x00],
    11: [0x00, 0x3C, 0x00],
    12: [0x00, 0x32, 0x3C],
    13: [0x00, 0x00, 0x00],
    14: [0x00, 0x00, 0x00],
    15: [0x00, 0x00, 0x00],
    16: [0x98, 0x96, 0x98],
    17: [0x08, 0x4C, 0xC4],
    18: [0x30, 0x32, 0xEC],
    19: [0x5C, 0x1E, 0xE4],
    20: [0x88, 0x14, 0xB0],
    21: [0xA0, 0x14, 0x64],
    22: [0x98, 0x22, 0x20],
    23: [0x78, 0x3C, 0x00],
    24: [0x54, 0x5A, 0x00],
    25: [0x28, 0x72, 0x00],
    26: [0x08, 0x7C, 0x00],
    27: [0x00, 0x76, 0x28],
    28: [0x00, 0x66, 0x78],
    29: [0x00, 0x00, 0x00],
    30: [0x00, 0x00, 0x00],
    31: [0x00, 0x00, 0x00],
    32: [0xEC, 0xEE, 0xEC],
    33: [0x4C, 0x9A, 0xEC],
    34: [0x78, 0x7C, 0xEC],
    35: [0xB0, 0x62, 0xEC],
    36: [0xE4, 0x54, 0xEC],
    37: [0xEC, 0x58, 0xB4],
    38: [0xEC, 0x6A, 0x64],
    39: [0xD4, 0x88, 0x20],
    40: [0xA0, 0xAA, 0x00],
    41: [0x74, 0xC4, 0x00],
    42: [0x4C, 0xD0, 0x20],
    43: [0x38, 0xCC, 0x6C],
    44: [0x38, 0xB4, 0xCC],
    45: [0x3C, 0x3C, 0x3C],
    46: [0x00, 0x00, 0x00],
    47: [0x00, 0x00, 0x00],
    48: [0xEC, 0xEE, 0xEC],
    49: [0xA8, 0xCC, 0xEC],
    50: [0xBC, 0xBC, 0xEC],
    51: [0xD4, 0xB2, 0xEC],
    52: [0xEC, 0xAE, 0xEC],
    53: [0xEC, 0xAE, 0xD4],
    54: [0xEC, 0xB4, 0xB0],
    55: [0xE4, 0xC4, 0x90],
    56: [0xCC, 0xD2, 0x78],
    57: [0xB4, 0xDE, 0x78],
    58: [0xA8, 0xE2, 0x90],
    59: [0x98, 0xE2, 0xB4],
    60: [0xA0, 0xD6, 0xE4],
    61: [0xA0, 0xA2, 0xA0],
    62: [0x00, 0x00, 0x00],
    63: [0x00, 0x00, 0x00],
});

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
        this.sprite0_on_next_line = false;
        this.sprite0_on_this_line = false;
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
            base_nametable: 0,

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
        this.CGRAM[addr] = val & 0x3F;
    }

    read_cgram(addr) {
      if((addr & 0x13) === 0x10) addr &= 0xEF;
      let data = this.CGRAM[addr];
      if(this.io.greyscale) data &= 0x30;
      return data;
    }

    mem_write(addr, val) {
        if (addr <= 0x3EFF) this.bus.PPU_write(addr, val);
        else this.write_cgram(addr & 0x1F, val);
    }

    rendering() {
        return this.io.bg_enable || this.io.sprite_enable;
    }

    write_regs(addr, val) {
        //console.log(hex4(addr), hex2(val));
        switch((addr & 7) | 0x2000) {
            case 0x2000: // PPUCTRL
                this.io.sprite_pattern_table = (val & 8) >>> 3;
                this.io.bg_pattern_table = (val & 0x10) >>> 4;
                this.status.sprite_height = (val & 0x20) >>> 5 ? 16 : 8;
                this.io.nmi_enable = (val & 0x80) >>> 7;
                this.io.vram_increment = (val & 4) ? 32 : 1;
                this.io.base_nametable = (val & 3);
                //console.log(this.io.vram_increment, val & 4);

                this.io.t = (this.io.t & 0x73FF) | ((val & 3) << 10);

                this.update_nmi();
                //console.log('2k', this.io.nmi_enable);
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
                    this.io.t = (this.io.t & 0x3F00) | val;
                    this.io.v = this.io.t;
                }

                this.io.w = (this.io.w + 1) & 1;
                return;
            case 0x2007: // PPUDATA
                if (this.rendering() && ((this.clock.ppu_y < this.clock.timing.vblank_start) || (this.clock.ppu_y > this.clock.timing.vblank_end))) {
                    //console.log('REJECT WRITE', this.clock.ppu_y, this.io.sprite_enable, this.io.bg_enable, hex4(this.io.v), hex2(val));
                    return;
                }
                //console.log(hex4(this.io.v), hex2(val));
                this.mem_write(this.io.v & 0x3FFF, val);
                this.io.v = (this.io.v + this.io.vram_increment) & 0x3FFF;
                return;
            default:
                console.log('WRITE UNIMPLEMENTED', hex4(addr));
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
            case 0x2007:
                if ((this.io.v & 0x3FFF) < 0x3F00) {
                    output = this.bus.PPU_read(this.io.v & 0x3FFF);
                } else {
                    output = this.read_cgram(addr);
                }
                this.io.v = (this.io.v + this.io.vram_increment) & 0x3FFF;
                break;
            default:
                console.log('READ UNIMPLEMENTED', hex4(addr));
                break;
        }
        return output;
    }

    fetch_chr_line(table, tile, line) {
        let r = (0x1000 * table) + (tile * 16) + line;
        let low = this.bus.PPU_read(r, 0);
        let high = this.bus.PPU_read(r + 8, 0);
        let output = 0;
        for (let i = 0; i < 8; i++) {
            //output <<= 2;
            //output |= ((low & 0x80) >>> 7) | ((high & 0x80) >>> 6);
            output <<= 2;
            output |= (low & 1) | ((high & 1) << 1);
            //low <<= 1;
            //high <<= 1;
            low >>>= 1;
            high >>>= 1;
        }
        return output;
    }

    fetch_chr_line16(table, tile, line) {
        let r = (0x1000 * table) + (tile * 16) + line;
        let low = this.bus.PPU_read(r, 0);
        let high = this.bus.PPU_read(r+8, 0);
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
                this.sprite0_on_next_line = false;
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
                        if (this.secondary_OAM_index === 0) this.sprite0_on_next_line = true;
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
            this.sprite0_on_this_line = this.sprite0_on_next_line;
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
                this.io.v = (this.io.v & 0x7FFFFFE0) ^ 0x0400;
            else
                this.io.v++;
            return;
        }
        if (this.line_cycle === 256) {
            // INCREMENT VERTICAL SCROLL IN v
            if (this.rendering()) {
                if (dbg.watch_on) console.log('Adding to vertical scroll...');
                if ((this.io.v & 0x7000) !== 0x7000) {
                    if (dbg.watch_on) console.log('ADDING 0x1000', hex4(this.io.v));
                    this.io.v += 0x1000;
                    if (dbg.watch_on) console.log('NEW V', hex4(this.io.v));
                }
                else {
                    this.io.v &= 0x8FFF;
                    let y = (this.io.v & 0x03E0) >>> 5;
                    if (dbg.watch_on) console.log('OLD Y', y, hex4(this.io.v));
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
                    if (dbg.watch_on) console.log('NEW Y', y, hex4(this.io.y));
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
        if (this.rendering()) {
            this.cycle_scanline_addr();
            if (this.line_cycle === 1) {
                this.io.sprite0_hit = 0;
            }
            if (this.line_cycle === 304) {
                this.io.v = (this.io.v & 0x041F) | (this.io.t & 0x7BE0);
            }
            this.oam_evaluate_slow();
        }
        if (((this.clock.frame_odd) && (this.line_cycle === 339)) || (this.line_cycle === 340)) {
            this.new_scanline();
        }
    }

    scanline_visible() {
        if (!this.rendering()) {
            if (this.line_cycle === 340) {
                this.new_scanline();
                // Quit out if we've stumbled past the last rendered line
                if (this.clock.ppu_y >= 240) return;
            }
            return;
       }
        if (this.line_cycle === 0) {
            return;
        } // DO NOTHING here, idle for cycle 0
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

        //let tile_y = (sy & 7);
        let tile_y = (this.io.v >>> 12) & 7;

        let odd = (this.line_cycle & 1);

        // Do memory accesses and shifters
        switch(this.line_cycle & 7) {
            case 0: // nametable, tile #
                this.bg_fetches[0] = this.bus.PPU_read(0x2000 | (this.io.v & 0xFFF));
                if (dbg.watch_on && (this.line_cycle === 255)) console.log(sy, sx, 'fetched tile #', this.bg_fetches[0], hex4(0x2000 | (this.io.v & 0xFFF)));
                break;
            case 1: // reload shifter
                this.bg_shifter = (this.bg_shifter & 0xFFFF) | (this.bg_fetches[2] << 16) | (this.bg_fetches[3] << 24);
                this.bg_attribute = this.bg_fetches[1];
                break;
            case 2: // attribute table
                this.bg_fetches[1] = this.bus.PPU_read((0x23C0 | (this.io.v & 0x0C00)) | ((this.io.v >>> 4) & 0x38) | ((this.io.v >>> 2) & 7));
                break;
            case 4: // low buffer
                let r = this.fetch_chr_line(this.io.bg_pattern_table, this.bg_fetches[0], tile_y);
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

        // Check if any sprites need drawing
        for (let m = 0; m < 8; m++) {
            this.sprite_x_counters[m]--;
            if ((this.sprite_x_counters[m] >= -8) && (this.sprite_x_counters[m] <= -1)) {
                let my_color = this.sprite_pattern_shifters[m] & 3;
                this.sprite_pattern_shifters[m] >>>= 2;
                my_color |= (this.sprite_attribute_latches[m] & 3) << 2;
                sprite_priority = (this.sprite_attribute_latches[m] & 0x20) >>> 5;
                sprite_color = my_color;
                if (this.sprite0_on_this_line && !this.io.sprite0_hit) {
                    if ((m === 0) && (my_color !== 0)) {
                        this.io.sprite0_hit = true;
                    }
                }
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

        let ostr = '';
        /*for (let i = 0; i < 16; i++) {
            ostr += this.CGRAM(0x3F10 + i) + ' ';
        }*/
        console.log('PALETTE:', this.CGRAM);

        for (let m = 0; m < 64; m++) {
            let oa = m*4;
            let sprite_y = this.OAM[oa];
            let sprite_x = this.OAM[oa+3];
            if ((sprite_x >= 255) || (sprite_y >= 240)) continue;
            for (let asy = sprite_y; asy < (sprite_y + this.status.sprite_height); asy++) {
                let tabl = this.io.sprite_pattern_table;
                let tn = this.OAM[oa+1];
                let tdata;
                let in_sprite_y = asy - sprite_y;
                if (this.status.sprite_height === 8) {
                    tdata = this.fetch_chr_line(tabl, tn, in_sprite_y);
                } else {
                    tabl = tn & 1;
                    tn &= 0xFE;
                    if (in_sprite_y < 8) {
                        tdata = this.fetch_chr_line(tabl, tn, in_sprite_y);
                    } else {
                        in_sprite_y -= 8;
                        tdata = this.fetch_chr_line(tabl, tn+1, in_sprite_y);
                    }
                }
                let r = (0x1000 * tabl) + (tn * 16) + in_sprite_y;
                let sprite_x_flip = (this.OAM[oa+2] & 0x40) >>> 6;
                let sprite_y_flip = (this.OAM[oa+2] & 0x80) >>> 7;
                for (let sx = sprite_x; sx < (sprite_x + 8); sx++) {
                    let doi = ((asy * 256) + sx) * 4;
                    let color = ((this.OAM[oa + 2] & 3) << 2);
                    if (sprite_x_flip) {
                        color |= (tdata & 0xC000) >>> 14;
                        tdata <<= 2;
                    }
                    else {
                        color |= (tdata & 3);
                        tdata >>= 2;
                    }
                    let r, g, b;
                    if (color === 0) {
                        r = 255;
                        g = 0;
                        b = 0;
                        continue;
                    }
                    else r = g = b = 255;
                    // 3F10 + color
                    let out_color = this.CGRAM[0x10 + color];
                    r = NES_palette[out_color][0];
                    g = NES_palette[out_color][1];
                    b = NES_palette[out_color][2];
                    imgdata.data[doi] = r;
                    imgdata.data[doi+1] = g;
                    imgdata.data[doi+2] = b;
                }
            }
        }
		ctx.putImageData(imgdata, x_origin, y_origin);
    }

}