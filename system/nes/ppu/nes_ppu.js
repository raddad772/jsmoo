"use strict";

importScripts('/system/nes/ppu/nes_palette.js')

class PPU_effect_buffer {
    constructor(length) {
        this.length = length;

        this.items = new Array(length);
        for (let i = 0; i < length; i++) {
            this.items[i] = null;
        }
    }

    get(cycle) {
        let ci = cycle % this.length;
        let r = this.items[ci];
        this.items[ci] = null;
        return r;
    }

    set(cycle, value) {
        this.items[cycle % this.length] = value;
    }
}

const SER_NES_ppu = [
    'line_cycle', 'OAM', 'secondary_OAM',
    'secondary_OAM_index', 'secondary_OAM_sprite_index',
    'secondary_OAM_sprite_total', 'secondary_OAM_lock',
    'OAM_transfer_latch', 'OAM_eval_index',
    'OAM_eval_done', 'sprite0_on_next_line',
    'sprite0_on_this_line', 'CGRAM', 'output',
    'bg_fetches', 'bg_shifter', 'bg_palette_shifter',
    'bg_tile_fetch_addr', 'bg_tile_fetch_buffer',
    'sprite_pattern_shifters', 'sprite_attribute_latches',
    'sprite_x_counters', 'sprite_y_lines', 'io',
    'dbg', 'status', 'latch'
]

class NES_ppu {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.clock = clock;
        this.bus = bus;

        this.bus.ppu = this;

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

        this.w2006_buffer = new PPU_effect_buffer(4*this.clock.timing.ppu_divisor);

        this.clock.ppu = this;

        this.CGRAM = new Uint8Array(0x20);   // 32 byes of "color RAM"

        this.output_shared_buffers = [new SharedArrayBuffer(256*240*2), new SharedArrayBuffer(256*240*2)];
        this.output = [new Uint16Array(this.output_shared_buffers[0]), new Uint16Array(this.output_shared_buffers[1])];
        this.cur_output_num = 1;
        this.cur_output = this.output[1];
        this.last_used_buffer = 1;

        this.bg_fetches = [0, 0, 0, 0]; // Memory fetch buffer
        this.bg_shifter = 0;                       // Holds 32 bits (2 tiles) of 2bpp 8-wide background tiles
        this.bg_palette_shifter = 0;                     // Holds current background attribute
        this.bg_tile_fetch_addr = 0;               // Holds BG tile addr to fetch
        this.bg_tile_fetch_buffer = 0 >>> 0;       // Holds tile data to put into fetches 2 & 3
        this.sprite_pattern_shifters = [0, 0, 0, 0, 0, 0, 0, 0]; // Keeps pattern data for sprites
        this.sprite_attribute_latches = [0, 0, 0, 0, 0, 0, 0, 0]; // Keeps sprite attribute bytes
        this.sprite_x_counters = [0, 0, 0, 0, 0, 0, 0, 0]; // Counts down to 0, when sprite should display
        this.sprite_y_lines = [0, 0, 0, 0, 0, 0, 0, 0]; // Keeps track of what our Y coord inside the sprite is

        this.last_sprite_addr = 0;

        this.io = {
            nmi_enable: 0,
            sprite_overflow: 0,
            sprite0_hit: 0,
            vram_increment: 1,

            sprite_pattern_table: 0, // Which pattern table sprites use
            bg_pattern_table: 0,     // Which pattern table backgrounds use

            v: 0,    // VRAM access address
            t: 0,    // Latch value for VRAM access and PPU scroll
            x: 0,    // Fine X scroll
            w: 0,    // low/high latch

            greyscale: 0,
            bg_hide_left_8: 0,
            sprite_hide_left_8: 0,
            bg_enable: 0,
            sprite_enable: 0,

            emph_r: 0,
            emph_g: 0,
            emph_b: 0,
            emph_bits: 0,

            OAM_addr: 0
        }

        this.dbg = { // Capture same from io to display scroll
            v: 0,
            t: 0,
            x: 0,
            w: 0
        }

        this.status = {
            sprite_height: 8, // 8 or 16
            nmi_out: 0,     // Whether or not we're generating an NMI
        }
        this.latch = {
            VRAM_read: 0, // VRAM read buffer
        }

        this.rendering_enabled = true;
        this.new_rendering_enabled = true;

        //this.scanline_timer = new perf_timer_t('scanline timer', 60*240, ['startup', 'startup2', 'maint', 'bgcolor', 'sprite_eval', 'color_out']);
        /*this.scanline_timer.add_split('startup');
        this.scanline_timer.add_split('')*/
    }

    serialize() {
        let o = {version: 1, clock_ppu_y: this.clock.ppu_y,
        clock_timing_post_render_ppu_idle: this.clock.timing.post_render_ppu_idle,
        clock_timing_ppu_pre_render: this.clock.timing.ppu_pre_render};
        serialization_helper(o, this, SER_NES_ppu);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG NES PPU VERSION');
            return false;
        }
        let r = deserialization_helper(this, from, SER_NES_ppu);
        this.clock.timing.post_render_ppu_idle = from.clock_timing_post_render_ppu_idle;
        this.clock.timing.ppu_pre_render = from.clock_timing_ppu_pre_render;
        this.set_scanline(from.clock_ppu_y);
        return r;
    }

    present(buf) {
        let obuffer = new Uint32Array(buf);
        for (let ry = 0; ry < 240; ry++) {
            let y = ry;
            for (let x = 0; x < 256; x++) {
                let ppui = (ry * 256) + x;
                let o = this.cur_output[ppui];
                obuffer[ppui] = NES_palette[o];
            }
        }
    }

    reset() {
        this.line_cycle = 0;
        this.io.w = 0;
    }

    write_cgram(addr, val) {
        this.bus.mapper.a12_watch(addr | 0x3F00);
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
        if ((addr & 0x3FFF) < 0x3F00) this.bus.PPU_write(addr, val);
        else this.write_cgram(addr & 0x1F, val);
    }

    write_regs(addr, val) {
        switch((addr & 7) | 0x2000) {
            case 0x2000: // PPUCTRL
                this.io.sprite_pattern_table = (val & 8) >>> 3;
                this.io.bg_pattern_table = (val & 0x10) >>> 4;
                this.status.sprite_height = (val & 0x20) >>> 5 ? 16 : 8;
                this.io.nmi_enable = (val & 0x80) >>> 7;
                this.io.vram_increment = (val & 4) ? 32 : 1;

                this.io.t = (this.io.t & 0x73FF) | ((val & 3) << 10);

                this.update_nmi();
                return;
            case 0x2001: // PPUMASK
                this.io.greyscale = val & 1;
                this.io.bg_hide_left_8 = (val & 2) >>> 1;
                this.io.sprite_hide_left_8 = (val & 4) >>> 2;
                this.io.bg_enable = (val & 8) >>> 3;
                this.io.sprite_enable = (val & 0x10) >>> 4;
                this.io.emph_r = (val & 0x20) >>> 5;
                this.io.emph_g = (val & 0x40) >>> 6;
                this.io.emph_b = (val & 0x80) >>> 7;
                this.io.emph_bits = (val & 0xE0) << 1;
                this.new_rendering_enabled = this.io.bg_enable || this.io.sprite_enable;
                return;
            case 0x2003: // OAMADDR
                this.io.OAM_addr = val;
                return;
            case 0x2004: // OAMDATA
                this.OAM[this.io.OAM_addr] = val;
                this.io.OAM_addr = (this.io.OAM_addr + 1) & 0xFF;
                return;
            case 0x2005: // PPUSCROLL
                if (this.io.w === 0) {
                    this.io.x = val & 7;
                    this.io.t = (this.io.t & 0x7FE0) | (val >>> 3);
                    this.io.w = 1;
                } else {
                    this.io.t = (this.io.t & 0x0C1F) | ((val & 0xF8) << 2) | ((val & 7) << 12);
                    this.io.w = 0;
                }
                return;
            case 0x2006: // PPUADDR
                if (this.io.w === 0) {
                    this.io.t = (this.io.t & 0xFF) | ((val & 0x3F) << 8);
                    this.io.w = 1;
                } else {
                    this.io.t = (this.io.t & 0x7F00) | val;

                    this.w2006_buffer.set((this.clock.ppu_master_clock / this.clock.timing.ppu_divisor)+(3*this.clock.timing.ppu_divisor), this.io.t);
                    //this.io.v = this.io.t;
                    //this.bus.mapper.a12_watch(this.io.v);
                    this.io.w = 0;
                    //TODO: Video RAM update is apparently delayed by 3 PPU cycles (based on Visual NES findings)
                }
                return;
            case 0x2007: // PPUDATA
                if (this.rendering_enabled && ((this.clock.ppu_y < this.clock.timing.vblank_start) || (this.clock.ppu_y > this.clock.timing.vblank_end))) {
                    console.log('REJECT WRITE', this.clock.ppu_y, this.io.sprite_enable, this.io.bg_enable, hex4(this.io.v), hex2(val));
                    return;
                }
                this.mem_write(this.io.v, val);
                this.io.v = (this.io.v + this.io.vram_increment) & 0x7FFF;

                return;
            default:
                console.log('WRITE UNIMPLEMENTED', hex4(addr));
                break;

        }
    }

    update_nmi() {
        if (this.status.nmi_out && this.io.nmi_enable) {
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
                output = (this.io.sprite_overflow << 5) | (this.io.sprite0_hit << 6) | (this.status.nmi_out << 7);
                if (has_effect) {
                    this.status.nmi_out = 0;
                    this.update_nmi();

                    this.io.w = 0;
                }
                break;
            case 0x2004: // OAMDATA
                output = this.io.OAM[this.io.OAM_addr];
                // reads do not increment counter
                break;
            case 0x2007:
                if (this.rendering_enabled && ((this.clock.ppu_y < this.clock.timing.vblank_start) || (this.clock.ppu_y > this.clock.timing.vblank_end))) {
                    return 0;
                }
                if ((this.io.v & 0x3FF) >= 0x3F00) {
                    output = this.read_cgram(addr);
                }
                else {
                    output = this.latch.VRAM_read;
                    this.latch.VRAM_read = this.bus.PPU_read(this.io.v & 0x3FFF);
                }
                if (typeof output === 'undefined') {
                    console.log('READ ADDR', hex4(this.io.v));
                }
                this.io.v = (this.io.v + this.io.vram_increment) & 0x7FFF;
                this.bus.mapper.a12_watch(this.io.v & 0x3FFF);
                break;
            default:
                console.log('READ UNIMPLEMENTED', hex4(addr));
                break;
        }
        return output;
    }

    fetch_chr_line(table, tile, line, has_effect=true) {
        let r = (0x1000 * table) + (tile * 16) + line;
        this.last_sprite_addr = r + 8;
        let low = this.bus.PPU_read(r, 0, has_effect);
        let high = this.bus.PPU_read(r + 8, 0, has_effect);
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


    fetch_chr_addr(table, tile, line) {
        return (0x1000 * table) + (tile * 16) + line;
    }

    fetch_chr_line_low(addr) {
        let low = this.bus.PPU_read(addr, 0);
        let output = 0;
        for (let i = 0; i < 8; i++) {
            output <<= 2;
            output |= (low & 1);
            low >>>= 1;
        }
        return output;
    }

    fetch_chr_line_high(addr, o) {
        let high = this.bus.PPU_read(addr + 8, 0);
        let output = 0;
        for (let i = 0; i < 8; i++) {
            output <<= 2;
            output |= ((high & 1) << 1);
            high >>>= 1;
        }
        return output | o;
    }

    // Do evaluation of next line of sprites
    oam_evaluate_slow() {
        let odd = (this.line_cycle % 2) === 1;
        let eval_y = this.clock.ppu_y;
        if (this.line_cycle < 65) {
            if (this.line_cycle === 1) {
                this.secondary_OAM_sprite_total = 0;
                this.secondary_OAM_index = 0;
                this.OAM_eval_index = 0;
                this.secondary_OAM_lock = false;
                this.OAM_eval_done = false;
                this.sprite0_on_next_line = false;
                for (let n = 0; n < 32; n++) {
                    this.secondary_OAM[n] = 0xFF;
                }
            }
            return;
        }
        if (this.line_cycle <= 256) { // and >= 65...
            if (this.OAM_eval_done) return;
            if (!odd) {
                this.OAM_transfer_latch = this.OAM[this.OAM_eval_index];
                if (!this.secondary_OAM_lock) {
                    this.secondary_OAM[this.secondary_OAM_index] = this.OAM_transfer_latch;
                    if ((eval_y >= this.OAM_transfer_latch) && (eval_y < (this.OAM_transfer_latch + this.status.sprite_height))) {
                        if (this.OAM_eval_index === 0) this.sprite0_on_next_line = true;
                        this.secondary_OAM[this.secondary_OAM_index + 1] = this.OAM[this.OAM_eval_index + 1];
                        this.secondary_OAM[this.secondary_OAM_index + 2] = this.OAM[this.OAM_eval_index + 2];
                        this.secondary_OAM[this.secondary_OAM_index + 3] = this.OAM[this.OAM_eval_index + 3];
                        this.secondary_OAM_index += 4;
                        this.secondary_OAM_sprite_total++;
                        //this.secondary_OAM_lock = this.secondary_OAM_index >= 32;
                        this.OAM_eval_done |= this.secondary_OAM_index >= 32;
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

        if ((this.line_cycle >= 257) && (this.line_cycle <= 320)) { // Sprite tile fetches
            if (this.line_cycle === 257) { // Do some housekeeping on cycle 257
                this.sprite0_on_this_line = this.sprite0_on_next_line;
                this.secondary_OAM_index = 0;
                this.secondary_OAM_sprite_index = 0;
                if (!this.io.sprite_overflow) {
                    // Perform weird sprite overflow glitch
                    let n = 0;
                    let m = 0;
                    let f = 0;
                    while (n < 64) {
                        let e = this.OAM[(n * 4) + m];
                        // If value is in range....
                        if ((eval_y >= e) && (eval_y < (e + this.status.sprite_height))) {
                            // Set overflow flag if needed
                            f++;
                            if (f > 8) {
                                this.io.sprite_overflow = 1;
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
            }

            // Sprite data fetches into shift registers
            let sub_cycle = (this.line_cycle - 257) & 0x07;
            switch (sub_cycle) {
                case 0: // Read Y coordinate.  257
                    let syl = eval_y - this.secondary_OAM[this.secondary_OAM_index];
                    if (syl < 0) syl = 0;
                    if (syl > (this.status.sprite_height - 1)) syl = this.status.sprite_height - 1;
                    this.sprite_y_lines[this.secondary_OAM_sprite_index] = syl;
                    this.secondary_OAM_index++;
                    break;
                case 1: // Read tile number 258, and do garbage NT access
                    this.sprite_pattern_shifters[this.secondary_OAM_sprite_index] = this.secondary_OAM[this.secondary_OAM_index];
                    this.secondary_OAM_index++;
                    this.bus.mapper.a12_watch(this.io.v);
                    break;
                case 2: // Read attributes 259
                    this.sprite_attribute_latches[this.secondary_OAM_sprite_index] = this.secondary_OAM[this.secondary_OAM_index];
                    this.secondary_OAM_index++;
                    break;
                case 3: // Read X-coordinate 260 and do garbage NT access
                    this.sprite_x_counters[this.secondary_OAM_sprite_index] = this.secondary_OAM[this.secondary_OAM_index];
                    this.secondary_OAM_index++;
                    this.bus.mapper.a12_watch(this.io.v);
                    break;
                case 4: // Fetch tiles for the shifters 261
                    break;
                case 5:
                    let tn = this.sprite_pattern_shifters[this.secondary_OAM_sprite_index];
                    let sy = this.sprite_y_lines[this.secondary_OAM_sprite_index];
                    let table = this.io.sprite_pattern_table;
                    let attr = this.sprite_attribute_latches[this.secondary_OAM_sprite_index];
                    // Vertical flip....
                    if (attr & 0x80) sy = (this.status.sprite_height - 1) - sy;
                    if (this.status.sprite_height === 16) {
                        table = tn & 1;
                        tn &= 0xFE;
                    }
                    if (sy > 7) {
                        sy -= 8;
                        tn += 1;
                    }
                    this.sprite_pattern_shifters[this.secondary_OAM_sprite_index] = this.fetch_chr_line(table, tn, sy);
                    break;
                case 6: // 263
                    break;
                case 7:
                    this.bus.mapper.a12_watch(this.last_sprite_addr);
                    this.secondary_OAM_sprite_index++;
                    break;
            }
        }
    }

    cycle_scanline_addr() {
        let enabled = this.rendering_enabled;
        if (enabled && (this.clock.ppu_y < this.clock.timing.bottom_rendered_line)) {
            // Sprites
            if ((this.line_cycle > 0) && (this.line_cycle < 257)) {
                this.sprite_x_counters[0]--;
                this.sprite_x_counters[1]--;
                this.sprite_x_counters[2]--;
                this.sprite_x_counters[3]--;
                this.sprite_x_counters[4]--;
                this.sprite_x_counters[5]--;
                this.sprite_x_counters[6]--;
                this.sprite_x_counters[7]--;
            }
        }
        if ((!enabled) || (this.line_cycle === 0)) return;
        // Cycle # 8, 16,...248, and 328, 336. BUT NOT 0
        if (this.line_cycle === 256) {
            if ((this.io.v & 0x7000) !== 0x7000) { // if fine y !== 7
                this.io.v += 0x1000;               // add 1 to fine y
            }
            else {                                   // else it is overflow so
                this.io.v &= 0x8FFF;                 // clear fine y to 0
                let y = (this.io.v & 0x03E0) >>> 5;  // get coarse y
                if (y === 29) {                      // y overflows 30->0 with vertical nametable swap
                    y = 0;
                    this.io.v ^= 0x0800;             // Change vertical nametable
                } else if (y === 31) {               // y also overflows at 31 but without nametable swap
                    y = 0;
                }
                else                                 // just add to coarse scroll
                    y += 1;
                this.io.v = (this.io.v & 0xFC1F) | (y << 5); // put scroll back in
            }
            return;
        }
        if (((this.line_cycle & 7) === 0) && ((this.line_cycle >= 328) || (this.line_cycle <= 256))) {
            // INCREMENT HORIZONTAL SCROLL IN v
            if ((this.io.v & 0x1F) === 0x1F) // If X scroll is 31...
                this.io.v = (this.io.v & 0xFFE0) ^ 0x0400; // clear x scroll to 0 (& FFE0) and swap nametable (^ 0x400)
            else
                this.io.v++;  // just increment the X scroll
            return;
        }
        // INCREMENT VERTICAL SCROLL IN v
        // Cycles 257, copy parts of T to V
        if ((this.line_cycle === 257) && this.rendering_enabled)
            this.io.v = (this.io.v & 0xFBE0) | (this.io.t & 0x41F);
    }

    // Get tile info into shifters using screen X, Y coordinates
    scanline_prerender() {
        // 261
        let re = this.rendering_enabled
        //if ((this.clock.frame_odd) && (this.line_cycle === 0) && re) this.line_cycle++;
        if (this.line_cycle === 1) {
            this.io.sprite0_hit = 0;
            this.io.sprite_overflow = 0;
            this.status.nmi_out = 0;
            this.update_nmi();
        }
        if (re) {
            // Reload horizontal scroll 258-320
            if ((this.line_cycle === 257) && re) this.io.v = (this.io.v & 0xFBE0) | (this.io.t & 0x41F);
            if ((re) && (this.line_cycle >= 280) && (this.line_cycle <= 304)) {
                this.io.v = (this.io.v & 0x041F) | (this.io.t & 0x7BE0);
            }
        }
        /*if (this.io.sprite_enable && (this.line_cycle >= 257)) {
            this.oam_evaluate_slow();
        }*/
    }

    perform_bg_fetches() { // Only called from prerender and visible scanlines
        if (!this.rendering_enabled) return;
        let in_tile_y = (this.io.v >>> 12) & 7; // Y position inside tile

        if (((this.line_cycle > 0) && (this.line_cycle <= 256)) || (this.line_cycle > 320)) {
            // Do memory accesses and shifters
            switch (this.line_cycle & 7) {
                case 1: // nametable, tile #
                    this.bg_fetches[0] = this.bus.PPU_read(0x2000 | (this.io.v & 0xFFF));
                    this.bg_tile_fetch_addr = this.fetch_chr_addr(this.io.bg_pattern_table, this.bg_fetches[0], in_tile_y);
                    this.bg_tile_fetch_buffer = 0;
                    // Reload shifters if needed
                    if (this.line_cycle !== 1) { // reload shifter at interval #9 9....257
                        this.bg_shifter = (this.bg_shifter >>> 16) | (this.bg_fetches[2] << 16) | (this.bg_fetches[3] << 24);
                        this.bg_palette_shifter = ((this.bg_palette_shifter << 2) | this.bg_fetches[1]) & 0x0F; //(this.bg_palette_shifter >>> 8) | (this.bg_fetches[1] << 8);
                    }
                    break;
                case 3: // attribute table
                    let attrib_addr = 0x23C0 | (this.io.v & 0x0C00) | ((this.io.v >>> 4) & 0x38) | ((this.io.v >>> 2) & 7);
                    let shift = ((this.io.v >>> 4) & 0x04) | (this.io.v & 0x02);
                    this.bg_fetches[1] = (this.bus.PPU_read(attrib_addr, 0) >>> shift) & 3;
                    break;
                case 5: // low buffer
                    this.bg_tile_fetch_buffer = this.fetch_chr_line_low(this.bg_tile_fetch_addr);
                    break;
                case 7: // high buffer
                    this.bg_tile_fetch_buffer = this.fetch_chr_line_high(this.bg_tile_fetch_addr, this.bg_tile_fetch_buffer);
                    this.bg_fetches[2] = this.bg_tile_fetch_buffer & 0xFF;
                    this.bg_fetches[3] = (this.bg_tile_fetch_buffer >>> 8);
                    break;
            }
        }
    }

    scanline_visible() {
        let sx = this.line_cycle-1;
        let sy = this.clock.ppu_y;
        let bo = (sy * 256) + sx;
        if (!this.rendering_enabled) {
            if (this.line_cycle < 256) {
                this.cur_output[bo] = this.CGRAM[0] | this.io.emph_bits;
            }
            return;
       }
        if (this.line_cycle < 1) {
             if (this.clock.ppu_y === 0)
                this.clock.ppu_frame_cycle = 0;
             return;
        }

        if ((this.line_cycle === 1) && (this.clock.ppu_y === 32)) { // Capture scroll info for display
            this.dbg.v = this.io.v;
            this.dbg.t = this.io.t;
            this.dbg.x = this.io.x;
            this.dbg.w = this.io.w;
        }
        //this.scanline_timer.record_split('startup');
        //this.scanline_timer.record_split('startup2');

        this.cycle_scanline_addr();
        this.oam_evaluate_slow();
        this.perform_bg_fetches();

        //this.scanline_timer.record_split('maint');

        // Shift out some bits for backgrounds
        let bg_shift, bg_color;
        let bg_has_pixel = false;
        if (this.io.bg_enable) {
            bg_shift = (((sx & 7) + this.io.x) & 15) * 2;
            bg_color = (this.bg_shifter >>> bg_shift) & 3;
            bg_has_pixel = bg_color !== 0;
        }
        let sprite_has_pixel = false;
        if (bg_has_pixel) {
            let agb = this.bg_palette_shifter;
            if (this.io.x + (sx & 0x07) < 8) agb >>>= 2;
            bg_color = this.CGRAM[bg_color | ((agb & 3) << 2)];
        }
        else bg_color = this.CGRAM[0];

        //this.scanline_timer.record_split('bgcolor')


        let sprite_priority = 0;
        let sprite_color = 0;

        // Check if any sprites need drawing
        //for (let m = 0; m < 8; m++) {
        for (let m = 7; m >= 0; m--) {
            if ((this.sprite_x_counters[m] >= -8) && (this.sprite_x_counters[m] <= -1) && this.line_cycle < 256) {
                let s_x_flip = (this.sprite_attribute_latches[m] & 0x40) >>> 6;
                let my_color = 0;
                if (s_x_flip) {
                    my_color = (this.sprite_pattern_shifters[m] & 0xC000) >>> 14;
                    this.sprite_pattern_shifters[m] <<= 2;
                } else {
                    my_color = (this.sprite_pattern_shifters[m] & 3);
                    this.sprite_pattern_shifters[m] >>>= 2;
                }
                if (my_color !== 0) {
                    sprite_has_pixel = true;
                    my_color |= (this.sprite_attribute_latches[m] & 3) << 2;
                    sprite_priority = (this.sprite_attribute_latches[m] & 0x20) >>> 5;
                    sprite_color = this.CGRAM[0x10 + my_color];
                    if ((!this.io.sprite0_hit) && (this.sprite0_on_this_line) && (m === 0) && bg_has_pixel && (this.line_cycle < 256)) {
                        this.io.sprite0_hit = 1;
                        //console.log('s0 hit at PPU sy sx', this.clock.ppu_y, this.OAM[0], this.OAM[3]);
                    }
                }
            }
        }
        //this.scanline_timer.record_split('sprite_eval');

        // Decide background or sprite
        let out_color = bg_color;
        if (this.io.sprite_enable) {
            if (sprite_color !== 0) {
                if (!bg_has_pixel) {
                    out_color = sprite_color;
                } else {
                    if (!sprite_priority) out_color = sprite_color;
                    else out_color = bg_color;
                }
            }
        }

        this.cur_output[bo] = out_color | this.io.emph_bits;
        //this.scanline_timer.record_split('color_out');
        //this.scanline_timer.end_sample();
    }

    scanline_postrender() {
        // 240, (also 241-260)
        // LITERALLY DO NOTHING
        if ((this.clock.ppu_y === this.clock.timing.vblank_start) && (this.line_cycle === 1)) {
            this.status.nmi_out = 1;
            this.update_nmi();
        }
    }

    scanline_vblank() {
        // 241-260
        // LITERALLY DO NOTHING
    }

    new_frame() {
        this.clock.lclock = this.clock.cpu_master_clock;
        this.clock.ppu_y = 0;
        this.clock.frames_since_restart++;
        this.clock.frame_odd = (this.clock.frame_odd + 1) & 1;
        this.clock.master_frame++;
        this.clock.cpu_frame_cycle = 0;
        this.last_used_buffer = this.cur_output_num;
        this.cur_output_num ^= 1;
        this.cur_output = this.output[this.cur_output_num];
    }

    new_scanline() {
        if (this.clock.ppu_y === this.clock.timing.ppu_pre_render)
            this.new_frame()
        else {
            this.clock.ppu_y++;
        }

        if (this.clock.ppu_y === this.clock.timing.vblank_start) {
            this.clock.vblank = 1;
            this.update_nmi();
        }
        else if (this.clock.ppu_y === this.clock.timing.vblank_end) {
            this.clock.vblank = 0;
            this.update_nmi();
        }
        this.set_scanline(this.clock.ppu_y);
        this.line_cycle = 0; // This will immediately get
    }

    set_scanline(to) {
        switch(to) {
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
    }

    cycle(howmany) {
        for (let i = 0; i < howmany; i++) {
            let r = this.w2006_buffer.get((this.clock.ppu_master_clock / this.clock.timing.ppu_divisor));
            if (r !== null) {
                this.io.v = r;
                this.bus.mapper.a12_watch(r);
            }
            this.render_cycle();
            this.rendering_enabled = this.new_rendering_enabled;
            this.line_cycle++;
            this.clock.ppu_frame_cycle++;
            if (this.line_cycle === 341) this.new_scanline();
            this.clock.ppu_master_clock += this.clock.timing.ppu_divisor;
        }
        return howmany;
    }

    render_bgtables_from_memory(y_origin, x_origin, show_scroll_border=false) {
        let ctx = this.canvas.getContext('2d');
        let pattern_base = this.io.bg_pattern_table * 0x1000;
        let imgdata = ctx.getImageData(x_origin, y_origin, 512, 480);
        let nametable_bases = [0x2000, 0x2400, 0x2800, 0x2C00];
        let attribute_bases = [0x23C0, 0x27C0, 0x2BC0, 0x2FC0];
        for (let screen_y = 0; screen_y < 480; screen_y++) {
            let nty = (screen_y > 239) ? screen_y - 240 : screen_y;
            for (let screen_x = 0; screen_x < 512; screen_x++) {
                let ntx = (screen_x > 255) ? screen_x - 256 : screen_x;
                let nametable = ((screen_y > 239) ? 2 : 0) + ((screen_x > 255) ? 1 : 0);
                let nametable_base = nametable_bases[nametable];
                let attribute_base = attribute_bases[nametable];
                let in_tile_x = screen_x & 7;
                let in_tile_y = screen_y & 7;
                let tile_x = ntx >>> 3;
                let tile_y = nty >>> 3;
                let ta = nametable_base + ((tile_y * 32) + tile_x);
                let tile_num = this.bus.PPU_read(ta, 0, false);
                let aa = attribute_base + ((tile_y >>> 2) * 8) + (tile_x >>> 2);
                let attrib = this.bus.PPU_read(aa, 0, false);
                let atx = (tile_x >>> 1) & 1;
                let aty = (tile_y >>> 1) & 1;
                // bottomright (1,1) << 6 | bottomleft << 4 (0,1) | topright << 2 (1,0) | topleft (0,0)
                let ashift = (atx + (aty * 2)) * 2;

                let attrib_color = ((attrib >>> ashift) & 3) << 2;
                let tile_addr = pattern_base + ((tile_num * 16) + in_tile_y);
                let tile_lo = this.bus.PPU_read(tile_addr, 0, false);
                let tile_hi = this.bus.PPU_read(tile_addr+8, 0, false);
                let mask = 0x80 >>> in_tile_x;
                tile_lo = ((tile_lo & mask) === 0) ? 0 : 1;
                tile_hi = ((tile_hi & mask) === 0) ? 0 : 2;
                let tile_color = tile_lo | tile_hi;
                if (tile_color === 0) {
                    tile_color = this.CGRAM[0];
                }
                else {
                    tile_color |= attrib_color;
                    tile_color = this.CGRAM[tile_color];
                }

                let bo = ((screen_y * 512) + screen_x) * 4;
                imgdata.data[bo] = NES_palette[tile_color][0];
                imgdata.data[bo+1] = NES_palette[tile_color][1];
                imgdata.data[bo+2] = NES_palette[tile_color][2];
                imgdata.data[bo+3] = 255;
            }
        }

        if (show_scroll_border) {
            let coarse_y = (this.dbg.v & 0x3E0) >>> 2;
            let fine_y = (this.dbg.v & 0x7000) >>> 12;
            let yscroll = (coarse_y | fine_y) - 32;
            let coarse_x = (this.dbg.t & 0x1F) << 3;
            let xscroll = coarse_x | this.dbg.x;
            xscroll += (this.dbg.t & 0x400) ? 256 : 0;
            yscroll += (this.dbg.t & 0x800) ? 240 : 0;
            for (let screen_y = yscroll; screen_y < (yscroll + 240); screen_y++) {
                for (let screen_x = xscroll; screen_x < (xscroll + 256); screen_x++) {
                    let sx = screen_x % 512;
                    let sy = screen_y % 480;
                    let bo = ((sy * 512) + sx) * 4;

                    imgdata.data[bo+3] = 192;
                }
            }
        }
        ctx.putImageData(imgdata, x_origin, y_origin);
    }

    print_current_scroll() {
        let coarse_y = (this.io.v & 0x3E0) >>> 2;
        let fine_y = (this.io.v & 0x7000) >>> 12;
        let yscroll = (coarse_y | fine_y);
        let coarse_x = (this.io.t & 0x1F) << 3;
        let xscroll = coarse_x | this.io.x;
        xscroll += (this.io.t & 0x400) ? 256 : 0;
        yscroll += (this.io.t & 0x800) ? 240 : 0;
        console.log('CURRENT X, Y SCROLLS:', xscroll, yscroll);
        return (yscroll << 16) | xscroll;
    }

    render_chr_tables_from_memory(y_origin, x_origin) {
        let ctx = this.canvas.getContext('2d');
        let imgdata = ctx.getImageData(x_origin, y_origin, 256, 512);
        /*for (let sy = 0; sy < 256; sy++) {
            for (let sx = 0; sx < 128; sx++) {
                let addr = ((sy * 128) + sx) * 4;
                imgdata.data[addr] = 0;
                imgdata.data[addr + 1] = 0;
                imgdata.data[addr + 2] = 0;
                imgdata.data[addr + 3] = 255;
            }
        }*/
        let palette_to_use = 0;

        for (let asy = 0; asy < 512; asy++) {
            let sy = asy >>> 1;
            let nametable = (sy < 128) ? 0 : 1;
            for (let asx = 0; asx < 256; asx++) {
                let sx = asx >>> 1;
                let xtile = (sx >>> 3);
                let ytile = (sy - (128 * nametable)) >>> 3;
                let tilenum = (ytile * 16) + xtile;
                let x_in_tile = sx & 7;
                let y_in_tile = sy & 7;
                //let tile_addr = (0x1000 * nametable) + tilenum + y_in_tile;
                let tile_addr = this.fetch_chr_addr(nametable, tilenum, y_in_tile)
                let tile_low = this.bus.PPU_read(tile_addr, 0, false);
                let tile_hi = this.bus.PPU_read(tile_addr+8, 0, false);
                let mask = 0x80 >>> x_in_tile;
                let color = (tile_low & mask) ? 1 : 0;
                color |= (tile_hi & mask) ? 2 : 0;
                let dpo = ((asy * 256) + asx) * 4;
                color = this.CGRAM[color];

                imgdata.data[dpo] = NES_palette[color][0];
                imgdata.data[dpo+1] = NES_palette[color][1];
                imgdata.data[dpo+2] = NES_palette[color][2];
                imgdata.data[dpo+3] = 255;
            }
        }

        ctx.putImageData(imgdata, x_origin, y_origin);
    }

	render_sprites_from_memory(y_origin, x_origin, builtin_color) {
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
                    tdata = this.fetch_chr_line(tabl, tn, in_sprite_y, false);
                } else {
                    tabl = tn & 1;
                    tn &= 0xFE;
                    if (in_sprite_y < 8) {
                        tdata = this.fetch_chr_line(tabl, tn, in_sprite_y, false);
                    } else {
                        in_sprite_y -= 8;
                        tdata = this.fetch_chr_line(tabl, tn+1, in_sprite_y, false);
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
                    if (m===0) {
                        r = 255;
                        g = 0;
                        b = 0;
                    }

                    imgdata.data[doi] = r;
                    imgdata.data[doi+1] = g;
                    imgdata.data[doi+2] = b;
                }
            }
        }
		ctx.putImageData(imgdata, x_origin, y_origin);
    }

}
