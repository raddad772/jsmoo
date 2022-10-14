import {NES_VARIANTS, NES_clock, NES_bus} from "./nes_common";


class RGBval {
    r: u32
    g: u32
    b: u32
    constructor(r: u32, g: u32, b: u32) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

export const NES_palette = new StaticArray<u32>(64);
function NES_get_RGB(i: u32): RGBval {
    switch(i) {
        case 0: return new RGBval(0x54, 0x54, 0x54);
        case 1: return new RGBval(0x00, 0x1E, 0x74);
        case 2: return new RGBval(0x08, 0x10, 0x90);
        case 3: return new RGBval(0x30, 0x00, 0x88);
        case 4: return new RGBval(0x44, 0x00, 0x64);
        case 5: return new RGBval(0x5C, 0x00, 0x30);
        case 6: return new RGBval(0x54, 0x04, 0x00);
        case 7: return new RGBval(0x3C, 0x18, 0x00);
        case 8: return new RGBval(0x20, 0x2A, 0x00);
        case 9: return new RGBval(0x08, 0x3A, 0x00);
        case 10: return new RGBval(0x00, 0x40, 0x00);
        case 11: return new RGBval(0x00, 0x3C, 0x00);
        case 12: return new RGBval(0x00, 0x32, 0x3C);
        case 13: return new RGBval(0x00, 0x00, 0x00);
        case 14: return new RGBval(0x00, 0x00, 0x00);
        case 15: return new RGBval(0x00, 0x00, 0x00);
        case 16: return new RGBval(0x98, 0x96, 0x98);
        case 17: return new RGBval(0x08, 0x4C, 0xC4);
        case 18: return new RGBval(0x30, 0x32, 0xEC);
        case 19: return new RGBval(0x5C, 0x1E, 0xE4);
        case 20: return new RGBval(0x88, 0x14, 0xB0);
        case 21: return new RGBval(0xA0, 0x14, 0x64);
        case 22: return new RGBval(0x98, 0x22, 0x20);
        case 23: return new RGBval(0x78, 0x3C, 0x00);
        case 24: return new RGBval(0x54, 0x5A, 0x00);
        case 25: return new RGBval(0x28, 0x72, 0x00);
        case 26: return new RGBval(0x08, 0x7C, 0x00);
        case 27: return new RGBval(0x00, 0x76, 0x28);
        case 28: return new RGBval(0x00, 0x66, 0x78);
        case 29: return new RGBval(0x00, 0x00, 0x00);
        case 30: return new RGBval(0x00, 0x00, 0x00);
        case 31: return new RGBval(0x00, 0x00, 0x00);
        case 32: return new RGBval(0xEC, 0xEE, 0xEC);
        case 33: return new RGBval(0x4C, 0x9A, 0xEC);
        case 34: return new RGBval(0x78, 0x7C, 0xEC);
        case 35: return new RGBval(0xB0, 0x62, 0xEC);
        case 36: return new RGBval(0xE4, 0x54, 0xEC);
        case 37: return new RGBval(0xEC, 0x58, 0xB4);
        case 38: return new RGBval(0xEC, 0x6A, 0x64);
        case 39: return new RGBval(0xD4, 0x88, 0x20);
        case 40: return new RGBval(0xA0, 0xAA, 0x00);
        case 41: return new RGBval(0x74, 0xC4, 0x00);
        case 42: return new RGBval(0x4C, 0xD0, 0x20);
        case 43: return new RGBval(0x38, 0xCC, 0x6C);
        case 44: return new RGBval(0x38, 0xB4, 0xCC);
        case 45: return new RGBval(0x3C, 0x3C, 0x3C);
        case 46: return new RGBval(0x00, 0x00, 0x00);
        case 47: return new RGBval(0x00, 0x00, 0x00);
        case 48: return new RGBval(0xEC, 0xEE, 0xEC);
        case 49: return new RGBval(0xA8, 0xCC, 0xEC);
        case 50: return new RGBval(0xBC, 0xBC, 0xEC);
        case 51: return new RGBval(0xD4, 0xB2, 0xEC);
        case 52: return new RGBval(0xEC, 0xAE, 0xEC);
        case 53: return new RGBval(0xEC, 0xAE, 0xD4);
        case 54: return new RGBval(0xEC, 0xB4, 0xB0);
        case 55: return new RGBval(0xE4, 0xC4, 0x90);
        case 56: return new RGBval(0xCC, 0xD2, 0x78);
        case 57: return new RGBval(0xB4, 0xDE, 0x78);
        case 58: return new RGBval(0xA8, 0xE2, 0x90);
        case 59: return new RGBval(0x98, 0xE2, 0xB4);
        case 60: return new RGBval(0xA0, 0xD6, 0xE4);
        case 61: return new RGBval(0xA0, 0xA2, 0xA0);
        case 62: return new RGBval(0x00, 0x00, 0x00);
        case 63: return new RGBval(0x00, 0x00, 0x00);
    }
    return new RGBval(0, 0, 0);
}
for (let i = 0; i < 64; i++) {
    let r: RGBval = NES_get_RGB(i);
    //NES_palette[i] = (r.r << 24) | (r.g << 16) | (r.b << 8) | 0xFF;
    NES_palette[i] = 0xFF000000 | (r.b << 16) | (r.g << 8) | r.r;
}

class NES_PPU_io {
    nmi_enable: u32 = 0
    sprite_overflow: u32 = 0
    sprite0_hit: u32 = 0
    vram_increment: u32 = 1

    sprite_pattern_table: u32 = 0
    bg_pattern_table: u32 = 0

    v: u32 = 0 // VRAM access address
    t: u32 = 0 // Latch value for VRAM access and PPU scroll
    x: u32 = 0 // Fine X scroll
    w: u32 = 0 // low/high latch

    greyscale: u32 = 0
    bg_hide_left_8: u32 = 0
    sprite_hide_left_8: u32 = 0
    bg_enable: u32 = 0
    sprite_enable: u32 = 0
    OAM_addr: u32 = 0
}

class NES_PPU_status {
    sprite_height: u32 = 8;
    nmi_out: u32 = 0
}

class NES_PPU_latch {
    VRAM_read: u32 = 0
}

export class NES_ppu {
    clock: NES_clock
    bus: NES_bus
    variant: NES_VARIANTS

    line_cycle: i32 = 0;
    OAM: StaticArray<u32> = new StaticArray<u32>(256);
    secondary_OAM: StaticArray<u32> = new StaticArray<u32>(32);
    secondary_OAM_index: u32 = 0;
    secondary_OAM_sprite_index: u32 = 0;
    secondary_OAM_sprite_total: u32 = 0;
    secondary_OAM_lock: bool = false;

    OAM_transfer_latch: u32 = 0;
    OAM_eval_index: u32 = 0;
    OAM_eval_done: u32 = 0;

    sprite0_on_next_line: bool = false;
    sprite0_on_this_line: bool = false;

    CGRAM: StaticArray<u32> = new StaticArray<u32>(32);
    output: StaticArray<u8> = new StaticArray<u8>(256*256);

    bg_fetches0: u32 = 0
    bg_fetches1: u32 = 0
    bg_fetches2: u32 = 0
    bg_fetches3: u32 = 0
    bg_shifter: u32 = 0;
    bg_palette_shifter: u32 = 0;
    bg_tile_fetch_addr: u32 = 0;
    bg_tile_fetch_buffer: u32 = 0;
    sprite_pattern_shifters: StaticArray<u32> = new StaticArray<u32>(8);
    sprite_attribute_latches: StaticArray<u32> = new StaticArray<u32>(8);
    sprite_x_counters: StaticArray<i32> = new StaticArray<i32>(8);
    sprite_y_lines: StaticArray<i32> = new StaticArray<i32>(8);

    io: NES_PPU_io = new NES_PPU_io();
    status: NES_PPU_status = new NES_PPU_status();
    latch: NES_PPU_latch = new NES_PPU_latch();

    constructor(variant: NES_VARIANTS, clock: NES_clock, bus: NES_bus) {
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;


        this.bus.ppu = this;
    }

    present(ab: usize): void {
        let TOP_OVERSCAN: u32 = 8;
        let BOTTOM_OVERSCAN: u32 = 240;
        let LEFT_OVERSCAN: u32 = 8;
        let RIGHT_OVERSCAN: u32 = 248;
        /*let out_width: u32 = 256 - (LEFT_OVERSCAN + (256 - RIGHT_OVERSCAN));
        let out_height: u32 = 240 - (TOP_OVERSCAN + (240 - BOTTOM_OVERSCAN));*/
        /*for (let ry: u32 = TOP_OVERSCAN; ry < BOTTOM_OVERSCAN; ry++) {
            let y: u32 = ry - TOP_OVERSCAN;
            for (let rx: u32 = LEFT_OVERSCAN; rx < RIGHT_OVERSCAN; rx++) {*/
        for (let y = 0; y < 240; y++) {
            for (let rx = 0; rx < 256; rx++) {
                //let ap: usize = (y * 256) + (rx - LEFT_OVERSCAN);
                let ap: usize = (y * 256) + rx;
                store<u32>(ab+(ap*4), unchecked(NES_palette[unchecked(this.output[<u32>ap])]));
            }
        }
    }

    reset(): void {
        this.line_cycle = 0;
        this.io.w = 0;
    }

    write_cgram(addr: u32, val: u32): void {
        if ((addr & 0x13) === 0x10) addr &= 0xEF;
        unchecked(this.CGRAM[addr & 0x1F] = val & 0x3F);
    }

    read_cgram(addr: u32): u32 {
      if((addr & 0x13) === 0x10) addr &= 0xEF;
      let data: u32 = unchecked(this.CGRAM[addr & 0x1F]);
      if(this.io.greyscale) data &= 0x30;
      return data;
    }

    mem_write(addr: u32, val: u32): void {
        if ((addr & 0x3FFF) < 0x3F00) this.bus.PPU_write(addr, val);
        else this.write_cgram(addr, val);
    }

    rendering_enabled(): bool {
        return this.io.bg_enable || this.io.sprite_enable;
    }

    new_scanline(): void {
        if (this.clock.ppu_y === this.clock.timing.ppu_pre_render)
            this.clock.advance_frame();
        else
            this.clock.advance_scanline();

        if (this.clock.ppu_y == this.clock.timing.vblank_start) {
            this.clock.vblank = 1;
            this.update_nmi();
        }
        else if (this.clock.ppu_y == this.clock.timing.vblank_end) {
            this.clock.vblank = 0;
            this.update_nmi();
        }
        this.line_cycle = -1;
    }


    fetch_chr_line(table: u32, tile: u32, line: u32, has_effect: u32 = 1): u32 {
        let r: u32 = (0x1000 * table) + (tile * 16) + line;
        let low: u32 = this.bus.PPU_read(r, 0, has_effect);
        let high: u32 = this.bus.PPU_read(r + 8, 0, has_effect);
        let output: u32 = 0;
        for (let i = 0; i < 8; i++) {
            output <<= 2;
            output |= (low & 1) | ((high & 1) << 1);
            low >>>= 1;
            high >>>= 1;
        }
        return output;
    }

    fetch_chr_addr(table: u32, tile: u32, line: u32): u32 {
        return (0x1000 * table) + (tile * 16) + line;
    }

    fetch_chr_line_low(addr: u32): u32 {
        let low: u32 = this.bus.PPU_read(addr, 0);
        let output: u32 = 0;
        for (let i: u32 = 0; i < 8; i++) {
            output <<= 2;
            output |= (low & 1);
            low >>>= 1;
        }
        return output;
    }

    fetch_chr_line_high(addr: u32, o: u32): u32 {
        let high: u32 = this.bus.PPU_read(addr + 8, 0);
        let output: u32 = 0;
        for (let i: u32 = 0; i < 8; i++) {
            output <<= 2;
            output |= ((high & 1) << 1);
            high >>>= 1;
        }
        return output | o;
    }

    perform_bg_fetches(): void { // Only called from prerender and visible scanlines
        let in_tile_y: u32 = (this.io.v >>> 12) & 7; // Y position inside tile

        if (((this.line_cycle > 0) && (this.line_cycle <= 257)) || (this.line_cycle > 320)) {
            // Do memory accesses and shifters
            switch (this.line_cycle & 7) {
                case 1: // nametable, tile #
                    this.bg_fetches0 = this.bus.PPU_read(0x2000 | (this.io.v & 0xFFF), 0);
                    this.bg_tile_fetch_addr = this.fetch_chr_addr(this.io.bg_pattern_table, this.bg_fetches0, in_tile_y);
                    this.bg_tile_fetch_buffer = 0;
                    // Reload shifters if needed
                    if (this.line_cycle !== 1) { // reload shifter at interval #9 9....257
                        this.bg_shifter = (this.bg_shifter >>> 16) | (this.bg_fetches2 << 16) | (this.bg_fetches3 << 24);
                        this.bg_palette_shifter = ((this.bg_palette_shifter << 2) | this.bg_fetches1) & 0x0F; //(this.bg_palette_shifter >>> 8) | (this.bg_fetches1 << 8);
                    }
                    return;
                case 3: // attribute table
                    let attrib_addr: u32 = 0x23C0 | (this.io.v & 0x0C00) | ((this.io.v >>> 4) & 0x38) | ((this.io.v >>> 2) & 7);
                    let shift: u32 = ((this.io.v >>> 4) & 0x04) | (this.io.v & 0x02);
                    this.bg_fetches1 = (this.bus.PPU_read(attrib_addr, 0) >>> shift) & 3;
                    return;
                case 5: // low buffer
                    this.bg_tile_fetch_buffer = this.fetch_chr_line_low(this.bg_tile_fetch_addr);
                    return;
                case 7: // high buffer
                    this.bg_tile_fetch_buffer = this.fetch_chr_line_high(this.bg_tile_fetch_addr, this.bg_tile_fetch_buffer);
                    this.bg_fetches2 = this.bg_tile_fetch_buffer & 0xFF;
                    this.bg_fetches3 = this.bg_tile_fetch_buffer >>> 8;
                    return;
            }
        }
    }

    // Do evaluation of next line of sprites
    oam_evaluate_slow(): void {
        let odd: u32 = this.line_cycle & 1;
        let eval_y: u32 = this.clock.ppu_y;
        if (this.line_cycle < 65) {
            if (this.line_cycle === 1) {
                for (let n = 0; n < 32; n++) {
                    unchecked(this.secondary_OAM[n] = 0xFF);
                    this.secondary_OAM_sprite_total = 0;
                    this.secondary_OAM_index = 0;
                    this.OAM_eval_index = 0;
                    this.secondary_OAM_lock = false;
                    this.OAM_eval_done = 0;
                    this.sprite0_on_next_line = false;
                }
            }
            return;
        }
        if (this.line_cycle <= 256) { // and >= 65...
            if (this.OAM_eval_done) return;
            if (!odd) {
                this.OAM_transfer_latch = unchecked(this.OAM[this.OAM_eval_index]);
                if (!this.secondary_OAM_lock) {
                    unchecked(this.secondary_OAM[this.secondary_OAM_index] = this.OAM_transfer_latch);
                    if ((eval_y >= this.OAM_transfer_latch) && (eval_y < (this.OAM_transfer_latch + this.status.sprite_height))) {
                        if (this.OAM_eval_index === 0) this.sprite0_on_next_line = true;
                        unchecked(this.secondary_OAM[this.secondary_OAM_index + 1] = this.OAM[this.OAM_eval_index + 1]);
                        unchecked(this.secondary_OAM[this.secondary_OAM_index + 2] = this.OAM[this.OAM_eval_index + 2]);
                        unchecked(this.secondary_OAM[this.secondary_OAM_index + 3] = this.OAM[this.OAM_eval_index + 3]);
                        this.secondary_OAM_index += 4;
                        this.secondary_OAM_sprite_total++;
                        //this.secondary_OAM_lock = this.secondary_OAM_index >= 32;
                        this.OAM_eval_done |= +(this.secondary_OAM_index >= 32);
                    }
                }
                this.OAM_eval_index += 4;
                if (this.OAM_eval_index >= 256) {
                    this.OAM_eval_index = 0;
                    this.secondary_OAM_lock = true;
                    this.OAM_eval_done = 1;
                }
            }
            return;
        }

        if ((this.line_cycle >= 257) && (this.line_cycle <= 320)) { // Sprite tile fetches
            if (this.line_cycle === 257) { // Do some housekeeping on cycle 257
                this.secondary_OAM_index = 0;
                this.secondary_OAM_sprite_index = 0;
                if (!this.io.sprite_overflow) {
                    // Perform weird sprite overflow glitch
                    let n: u32 = 0;
                    let m: u32 = 0;
                    let f: u32 = 0;
                    while (n < 64) {
                        let e: u32 = unchecked(this.OAM[(n * 4) + m]);
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
            if (this.secondary_OAM_sprite_index >= 8) return;
            this.sprite0_on_this_line = this.sprite0_on_next_line;
            let sub_cycle = (this.line_cycle - 257) & 0x07;
            switch (sub_cycle) {
                case 0: // Read Y coordinate.  257
                    let syl: i32 = eval_y - unchecked(this.secondary_OAM[this.secondary_OAM_index]);
                    if (syl < 0) syl = 0;
                    if (syl > <i32>(this.status.sprite_height - 1)) syl = this.status.sprite_height - 1;
                    unchecked(this.sprite_y_lines[this.secondary_OAM_sprite_index] = syl);
                    this.secondary_OAM_index++;
                    break;
                case 1: // Read tile number 258
                    unchecked(this.sprite_pattern_shifters[this.secondary_OAM_sprite_index] = this.secondary_OAM[this.secondary_OAM_index]);
                    this.secondary_OAM_index++;
                    break;
                case 2: // Read attributes 259
                    unchecked(this.sprite_attribute_latches[this.secondary_OAM_sprite_index] = this.secondary_OAM[this.secondary_OAM_index]);
                    this.secondary_OAM_index++;
                    break;
                case 3: // Read X-coordinate 260
                    unchecked(this.sprite_x_counters[this.secondary_OAM_sprite_index] = this.secondary_OAM[this.secondary_OAM_index]);
                    this.secondary_OAM_index++;
                    break;
                case 4: // Fetch tiles for the shifters 261
                    let tn: u32 = unchecked(this.sprite_pattern_shifters[this.secondary_OAM_sprite_index]);
                    let sy: i32 = unchecked(this.sprite_y_lines[this.secondary_OAM_sprite_index]);
                    let table: u32 = this.io.sprite_pattern_table;
                    let attr: u32 = unchecked(this.sprite_attribute_latches[this.secondary_OAM_sprite_index]);
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
                    unchecked(this.sprite_pattern_shifters[this.secondary_OAM_sprite_index] = this.fetch_chr_line(table, tn, sy));
                    break;
                case 7:
                    this.secondary_OAM_sprite_index++;
                    break;
            }
        }
    }

    // Do sprite counters & memory address updates
    cycle_scanline_addr(): void {
        if (this.clock.ppu_y < this.clock.timing.bottom_rendered_line) {
            // Sprites
            if ((this.line_cycle > 0) && (this.line_cycle < 257)) {
                unchecked(this.sprite_x_counters[0]--);
                unchecked(this.sprite_x_counters[1]--);
                unchecked(this.sprite_x_counters[2]--);
                unchecked(this.sprite_x_counters[3]--);
                unchecked(this.sprite_x_counters[4]--);
                unchecked(this.sprite_x_counters[5]--);
                unchecked(this.sprite_x_counters[6]--);
                unchecked(this.sprite_x_counters[7]--);
            }
        }
        if (!this.rendering_enabled() || (this.line_cycle === 0)) return;
        // Cycle # 8, 16,...248, and 328, 336. BUT NOT 0
        if (((this.line_cycle & 7) == 0) && ((this.line_cycle >= 328) || (this.line_cycle < 256))) {
            // INCREMENT HORIZONTAL SCROLL IN v
            if ((this.io.v & 0x1F) == 0x1F) // If X scroll is 31...
                this.io.v = (this.io.v & 0xFFE0) ^ 0x0400; // clear x scroll to 0 (& FFE0) and swap nametable (^ 0x400)
            else
                this.io.v++;  // just increment the X scroll
            return;
        }
        // INCREMENT VERTICAL SCROLL IN v
        if (this.line_cycle == 256) {
            if ((this.io.v & 0x7000) !== 0x7000) { // if fine y !== 7
                this.io.v += 0x1000;               // add 1 to fine y
            }
            else {                                   // else it is overflow so
                this.io.v &= 0x8FFF;                 // clear fine y to 0
                let y: u32 = (this.io.v & 0x03E0) >>> 5;  // get coarse y
                if (y == 29) {                      // y overflows 30->0 with vertical nametable swap
                    y = 0;
                    this.io.v ^= 0x0800;             // Change vertical nametable
                } else if (y == 31) {               // y also overflows at 31 but without nametable swap
                    y = 0;
                }
                else                                 // just add to coarse scroll
                    y += 1;
                this.io.v = (this.io.v & 0xFC1F) | (y << 5); // put scroll back in
            }
            return;
        }
        // Cycles 257...320, copy parts of T to V over and over...
        if ((this.line_cycle >= 257) && (this.line_cycle <= 320)) {
            this.io.v = (this.io.v & 0xFBE0) | (this.io.t & 0x41F);
        }
    }

    cycle_visible(): void {
        if (!this.rendering_enabled()) {
            if (this.line_cycle === 340)
                this.new_scanline();
            return;
        }

        if ((this.line_cycle < 1) && (this.clock.ppu_y == 0)) {
            this.clock.ppu_frame_cycle = 0;
        }
        if (this.line_cycle < 1) {
            // Do nothing on pixel 0
            return;
        }

        /*if ((this.line_cycle === 1) && (this.clock.ppu_y === 32)) { // Capture scroll info for display
            this.dbg.v = this.io.v;
            this.dbg.t = this.io.t;
            this.dbg.x = this.io.x;
            this.dbg.w = this.io.w;
        }*/
        //this.scanline_timer.record_split('startup');
        let sx: i32 = this.line_cycle-1;
        let sy: i32 = this.clock.ppu_y;
        let bo: u32 = (sy * 256) + sx;
        if (this.line_cycle === 340) {
            this.new_scanline();
            // Quit out if we've stumbled past the last rendered line
            if (this.clock.ppu_y >= 240) return;
        }
        //this.scanline_timer.record_split('startup2');

        this.cycle_scanline_addr();
        this.oam_evaluate_slow();
        this.perform_bg_fetches();

        //this.scanline_timer.record_split('maint');

        // Shift out some bits for backgrounds
        let bg_shift: u32 = 0, bg_color: u32 = 0;
        let bg_has_pixel: bool = false;
        if (this.io.bg_enable) {
            bg_shift = (((sx & 7) + this.io.x) & 15) * 2;
            bg_color = (this.bg_shifter >>> bg_shift) & 3;
            bg_has_pixel = bg_color !== 0;
        }
        let sprite_has_pixel: bool = false;
        if (bg_has_pixel) {
            let agb = this.bg_palette_shifter;
            if (this.io.x + (sx & 0x07) < 8) agb >>>= 2;
            bg_color = unchecked(this.CGRAM[bg_color | ((agb & 3) << 2)]);
        }
        else bg_color = unchecked(this.CGRAM[0]);

        //this.scanline_timer.record_split('bgcolor')

        let sprite_priority = 0;
        let sprite_color = 0;

        // Check if any sprites need drawing
        //for (let m = 0; m < 8; m++) {
        for (let m: i32 = 7; m >= 0; m--) {
            let sxc: i32 = unchecked(this.sprite_x_counters[m]);
            if ((sxc >= -8) &&
                (sxc <= -1) &&
                (this.line_cycle < 256)) {
                let sal: u32 = unchecked(this.sprite_attribute_latches[m]);
                let sps: u32 = unchecked(this.sprite_pattern_shifters[m]);
                let s_x_flip: u32 = (sal & 0x40) >>> 6;
                let my_color: u32 = 0;
                if (s_x_flip) {
                    my_color = (sps & 0xC000) >>> 14;
                    unchecked(this.sprite_pattern_shifters[m] = sps << 2);
                } else {
                    my_color = sps & 3;
                    unchecked(this.sprite_pattern_shifters[m] = sps >>> 2);
                }
                if (my_color !== 0) {
                    sprite_has_pixel = true;
                    my_color |= (sal & 3) << 2;
                    sprite_priority = (sal & 0x20) >>> 5;
                    sprite_color = this.CGRAM[0x10 + my_color];
                    if ((!this.io.sprite0_hit) && (this.sprite0_on_this_line) && (m === 0) && bg_has_pixel && (this.line_cycle < 256)) {
                        this.io.sprite0_hit = 1;
                    }
                }
            }
        }
        //this.scanline_timer.record_split('sprite_eval');

        // Decide background or sprite
        let out_color: u32 = bg_color;
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

        unchecked(this.output[bo] = <u8>out_color);
    }

    cycle_postrender(): void {
        // 240, (also 241-260)
        // LITERALLY DO NOTHING
        if ((this.clock.ppu_y === this.clock.timing.vblank_start) && (this.line_cycle === 1)) {
            this.status.nmi_out = 1;
            this.update_nmi();
        }
        if (this.line_cycle === 340) this.new_scanline();
    }

    // Get tile info into shifters using screen X, Y coordinates
    cycle_prerender(): void {
        if ((this.clock.frame_odd) && (this.line_cycle === 0)) this.line_cycle++;
        if (this.line_cycle === 1) {
            this.io.sprite0_hit = 0;
            this.io.sprite_overflow = 0;
            this.status.nmi_out = 0;
            this.update_nmi();
        }
        if (this.rendering_enabled()) {
            if (this.line_cycle === 304) {
                // Reload horizontal scroll
                this.io.v = (this.io.v & 0x041F) | (this.io.t & 0x7BE0);
            }
            //this.oam_evaluate_slow();
        }
        if (this.io.sprite_enable && (this.line_cycle >= 257)) {
            this.oam_evaluate_slow();
        }
        if (this.line_cycle === 340) {
            this.new_scanline();
        }
    }

    render_cycle(): void {
        if (this.clock.ppu_y < this.clock.timing.post_render_ppu_idle) {
            this.cycle_visible();
            return;
        }
        else if (this.clock.ppu_y < this.clock.timing.ppu_pre_render) {
            this.cycle_postrender();
            return;
        }
        this.cycle_prerender();
    }

    cycle(howmany: u32): u32 {
        for (let i: u32 = 0; i < howmany; i++) {
            this.line_cycle++;
            this.clock.ppu_frame_cycle++;
            this.render_cycle();
        }
        return howmany
    }

    update_nmi(): void {
        if (this.status.nmi_out && this.io.nmi_enable) {
            this.bus.CPU_notify_NMI(1);
        }
        else {
            this.bus.CPU_notify_NMI(0);
        }
    }

    reg_read(addr: u32, val: u32, has_effect: u32 = 1): u32 {
        let output: u32 = val;
        switch((addr & 7) | 0x2000) {
            case 0x2002:
                output = (this.io.sprite_overflow << 5) | (this.io.sprite0_hit << 6) | (this.status.nmi_out << 7);
                if (has_effect) {
                    this.status.nmi_out = 0;
                    this.update_nmi();

                    this.io.w = 0;
                }
                break;
            case 0x2004: // OAMDATA
                output = unchecked(this.OAM[this.io.OAM_addr]);
                // reads do not increment counter
                break;
            case 0x2007:
                if (this.rendering_enabled() && ((this.clock.ppu_y < this.clock.timing.vblank_start) || (this.clock.ppu_y > this.clock.timing.vblank_end))) {
                    return 0;
                }
                if ((this.io.v & 0x3FF) >= 0x3F00) {
                    output = this.read_cgram(addr);
                }
                else {
                    output = this.latch.VRAM_read;
                    this.latch.VRAM_read = this.bus.PPU_read(this.io.v & 0x3FFF, val);
                }
                this.io.v = (this.io.v + this.io.vram_increment) & 0x7FFF;
                break;
            default:
                console.log('READ UNIMPLEMENTED ' + addr.toString(16));
                break;
        }
        return output;
    }

    reg_write(addr: u32, val: u32): void {
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
                    this.io.v = this.io.t;
                    this.io.w = 0;
                    //TODO: Video RAM update is apparently delayed by 3 PPU cycles (based on Visual NES findings)
                }
                return;
            case 0x2007: // PPUDATA
                if (this.rendering_enabled() && ((this.clock.ppu_y < this.clock.timing.vblank_start) || (this.clock.ppu_y > this.clock.timing.vblank_end))) {
                    //console.log('REJECT WRITE', this.clock.ppu_y, this.io.sprite_enable, this.io.bg_enable, hex4(this.io.v), hex2(val));
                    return;
                }
                //console.log(hex4(this.io.v), hex2(val));
                this.mem_write(this.io.v, val);
                this.io.v = (this.io.v + this.io.vram_increment) & 0x7FFF;
                return;
        }
    }
}