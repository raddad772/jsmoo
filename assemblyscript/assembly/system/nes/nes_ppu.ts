import {NES_VARIANTS, NES_clock, NES_bus} from "./nes_common";
import {perf_timer_t} from "../../helpers/helpers";

class PPU_effect_buffer {
    length: i32
    items: StaticArray<i64>
    constructor(length: u32) {
        this.length = <i32>length;
        this.items = new StaticArray<i64>(length);
        for (let i: u32 = 0; i < length; i++) {
            this.items[i] = -1;
        }
    }

    get(cycle: u64): i64 {
        let ci: i32 = <i32>cycle % this.length;
        let r: i64 = unchecked(this.items[ci]);
        this.items[ci] = -1;
        return r;
    }

    set(cycle: u64, value: u32): void {
        unchecked(this.items[<i32>(cycle % this.length)] = <i64>value);
    }
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

    emph_r: u32 = 0
    emph_g: u32 = 0
    emph_b: u32 = 0
    emph_bits: u16 = 0

}

class NES_PPU_status {
    sprite_height: u32 = 8;
    nmi_out: u32 = 0
}

class NES_PPU_latch {
    VRAM_read: u32 = 0
}

const scanline_splits: Array<String> = new Array<String>(6);
//['startup', 'startup2', 'maint', 'bgcolor', 'sprite_eval', 'color_out']
scanline_splits[0] = 'startup';
scanline_splits[1] = 'startup2';
scanline_splits[2] = 'maint';
scanline_splits[3] = 'bgcolor';
scanline_splits[4] = 'sprite_eval';
scanline_splits[5] = 'color_out';

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
    output: StaticArray<u16> = new StaticArray<u16>(256*256);

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
    last_sprite_addr: u32 = 0;

    io: NES_PPU_io = new NES_PPU_io();
    status: NES_PPU_status = new NES_PPU_status();
    latch: NES_PPU_latch = new NES_PPU_latch();
    scanline_timer: perf_timer_t = new perf_timer_t('scanline timer', 60*240, scanline_splits);
    out_buffer: usize

    w2006_buffer: PPU_effect_buffer

    constructor(out_buffer: usize, variant: NES_VARIANTS, clock: NES_clock, bus: NES_bus) {
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;
        this.out_buffer = out_buffer;

        this.w2006_buffer = new PPU_effect_buffer(4*this.clock.timing.ppu_divisor);

        this.bus.ppu = this;
    }

    reset(): void {
        this.line_cycle = 0;
        this.io.w = 0;
    }

    write_cgram(addr: u32, val: u32): void {
        this.bus.mapper.a12_watch(addr | 0x3F00)
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

    @inline rendering_enabled(): bool {
        return this.io.bg_enable || this.io.sprite_enable;
    }

    new_frame(): void {
        this.clock.ppu_y = 0;
        this.clock.frames_since_restart++;
        this.clock.frame_odd = (this.clock.frame_odd + 1) & 1;
        this.clock.master_frame++;
        this.clock.cpu_frame_cycle = 0;
    }

    new_scanline(): void {
        if (this.clock.ppu_y === this.clock.timing.ppu_pre_render)
            this.new_frame();
        else {
            this.clock.ppu_y++;
        }

        if (this.clock.ppu_y == this.clock.timing.vblank_start) {
            this.clock.vblank = 1;
            this.update_nmi();
        }
        else if (this.clock.ppu_y == this.clock.timing.vblank_end) {
            this.clock.vblank = 0;
            this.update_nmi();
        }
        this.line_cycle = 0;
    }


    fetch_chr_line(table: u32, tile: u32, line: u32): u32 {
        let r: u32 = (0x1000 * table) + (tile * 16) + line;
        let low: u32 = this.bus.mapper.PPU_read_effect(r);
        let high: u32 = this.bus.mapper.PPU_read_effect(r + 8);
        this.last_sprite_addr = r + 8;
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
        let low: u32 = this.bus.mapper.PPU_read_effect(addr);
        let output: u32 = 0;
        for (let i: u32 = 0; i < 8; i++) {
            output <<= 2;
            output |= (low & 1);
            low >>>= 1;
        }
        return output;
    }

    fetch_chr_line_high(addr: u32, o: u32): u32 {
        let high: u32 = this.bus.mapper.PPU_read_effect(addr + 8);
        let output: u32 = 0;
        for (let i: u32 = 0; i < 8; i++) {
            output <<= 2;
            output |= ((high & 1) << 1);
            high >>>= 1;
        }
        return output | o;
    }

    perform_bg_fetches(): void { // Only called from prerender and visible scanlines
        const lc = this.line_cycle;

        // Only do things on odd cycles
        if ((lc & 1) === 0) return;

        const in_tile_y: u32 = (this.io.v >>> 12) & 7; // Y position inside tile

        if (((lc > 0) && (lc <= 256)) || (lc > 320)) {
            // Do memory accesses and shifters
            switch (lc & 7) {
                case 1: // nametable, tile #
                    this.bg_fetches0 = this.bus.mapper.PPU_read_effect(0x2000 | (this.io.v & 0xFFF));
                    this.bg_tile_fetch_addr = this.fetch_chr_addr(this.io.bg_pattern_table, this.bg_fetches0, in_tile_y);
                    this.bg_tile_fetch_buffer = 0;
                    // Reload shifters if needed
                    if (lc !== 1) { // reload shifter at interval #9 9....257
                        this.bg_shifter = (this.bg_shifter >>> 16) | (this.bg_fetches2 << 16) | (this.bg_fetches3 << 24);
                        this.bg_palette_shifter = ((this.bg_palette_shifter << 2) | this.bg_fetches1) & 0x0F; //(this.bg_palette_shifter >>> 8) | (this.bg_fetches1 << 8);
                    }
                    return;
                case 3: // attribute table
                    let attrib_addr: u32 = 0x23C0 | (this.io.v & 0x0C00) | ((this.io.v >>> 4) & 0x38) | ((this.io.v >>> 2) & 7);
                    let shift: u32 = ((this.io.v >>> 4) & 0x04) | (this.io.v & 0x02);
                    this.bg_fetches1 = (this.bus.mapper.PPU_read_effect(attrib_addr) >>> shift) & 3;
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
                this.secondary_OAM_sprite_total = 0;
                this.secondary_OAM_index = 0;
                this.OAM_eval_index = 0;
                this.secondary_OAM_lock = false;
                this.OAM_eval_done = 0;
                this.sprite0_on_next_line = false;
                for (let n = 0; n < 32; n++) {
                    unchecked(this.secondary_OAM[n] = 0xFF);
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
                        unchecked(this.secondary_OAM[this.secondary_OAM_index + 1] = unchecked(this.OAM[this.OAM_eval_index + 1]));
                        unchecked(this.secondary_OAM[this.secondary_OAM_index + 2] = unchecked(this.OAM[this.OAM_eval_index + 2]));
                        unchecked(this.secondary_OAM[this.secondary_OAM_index + 3] = unchecked(this.OAM[this.OAM_eval_index + 3]));
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
                this.sprite0_on_this_line = this.sprite0_on_next_line;
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
            let sub_cycle = (this.line_cycle - 257) & 0x07;
            switch (sub_cycle) {
                case 0: // Read Y coordinate.  257
                    let syl: i32 = eval_y - unchecked(this.secondary_OAM[this.secondary_OAM_index]);
                    if (syl < 0) syl = 0;
                    if (syl > <i32>(this.status.sprite_height - 1)) syl = this.status.sprite_height - 1;
                    unchecked(this.sprite_y_lines[this.secondary_OAM_sprite_index] = syl);
                    this.secondary_OAM_index++;
                    break;
                case 1: // Read tile number 258, and do garbage NT address
                    unchecked(this.sprite_pattern_shifters[this.secondary_OAM_sprite_index] = unchecked(this.secondary_OAM[this.secondary_OAM_index]));
                    this.secondary_OAM_index++;
                    this.bus.mapper.a12_watch(this.io.v);
                    break;
                case 2: // Read attributes 259
                    unchecked(this.sprite_attribute_latches[this.secondary_OAM_sprite_index] = unchecked(this.secondary_OAM[this.secondary_OAM_index]));
                    this.secondary_OAM_index++;
                    break;
                case 3: // Read X-coordinate 260 and do garbage NT access
                    unchecked(this.sprite_x_counters[this.secondary_OAM_sprite_index] = unchecked(this.secondary_OAM[this.secondary_OAM_index]));
                    this.secondary_OAM_index++;
                    this.bus.mapper.a12_watch(this.io.v);
                    break;
                case 4: // Fetch tiles for the shifters 261
                    break;
                case 5:
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
                    this.bus.mapper.a12_watch(this.last_sprite_addr);
                    this.secondary_OAM_sprite_index++;
                    break;
            }
        }
    }

    // Do sprite counters & memory address updates
    cycle_scanline_addr(): void {
        const lc = this.line_cycle;
        let io_v = this.io.v;
        if (this.clock.ppu_y < this.clock.timing.bottom_rendered_line) {
            // Sprites
            if ((lc > 0) && (lc < 257)) {
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
        if (!(this.io.bg_enable | this.io.sprite_enable) || (lc === 0)) return;
        // Cycle # 8, 16,...248, and 328, 336. BUT NOT 0
        if (lc == 256) {
            if ((io_v & 0x7000) !== 0x7000) { // if fine y !== 7
                io_v += 0x1000;               // add 1 to fine y
            }
            else {                                   // else it is overflow so
                io_v &= 0x8FFF;                 // clear fine y to 0
                let y: u32 = (io_v & 0x03E0) >>> 5;  // get coarse y
                if (y == 29) {                      // y overflows 30->0 with vertical nametable swap
                    y = 0;
                    io_v ^= 0x0800;             // Change vertical nametable
                } else if (y == 31) {               // y also overflows at 31 but without nametable swap
                    y = 0;
                }
                else                                 // just add to coarse scroll
                    y += 1;
                io_v = (io_v & 0xFC1F) | (y << 5); // put scroll back in
            }
            this.io.v = io_v;
            return;
        }
        if (((lc & 7) == 0) && ((lc >= 328) || (lc <= 256))) {
            // INCREMENT HORIZONTAL SCROLL IN v
            if ((io_v & 0x1F) == 0x1F) // If X scroll is 31...
                this.io.v = (io_v & 0xFFE0) ^ 0x0400; // clear x scroll to 0 (& FFE0) and swap nametable (^ 0x400)
            else
                this.io.v++;  // just increment the X scroll
            return;
        }
        // INCREMENT VERTICAL SCROLL IN v
        // Cycles 257...320, copy parts of T to V over and over...
        if ((lc == 257) && this.rendering_enabled())
            this.io.v = (this.io.v & 0xFBE0) | (this.io.t & 0x41F);
    }

    cycle_visible(): void {
        if (!this.rendering_enabled()) {
            return;
        }

        if ((this.line_cycle < 1) && (this.clock.ppu_y == 0)) {
            this.clock.ppu_frame_cycle = 0;
        }
        if (this.line_cycle < 1) {
            // Do nothing on pixel 0
            return;
        }

        //this.scanline_timer.record_split('startup');
        let sx: i32 = this.line_cycle-1;
        let sy: i32 = this.clock.ppu_y;
        let bo: u32 = (sy * 256) + sx;

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

        store<u16>(this.out_buffer+(bo*2), <u16>out_color | this.io.emph_bits);
    }

    cycle_postrender(): void {
        // 240, (also 241-260)
        // LITERALLY DO NOTHING
        if ((this.clock.ppu_y === this.clock.timing.vblank_start) && (this.line_cycle === 1)) {
            this.status.nmi_out = 1;
            this.update_nmi();
        }
    }

    // Get tile info into shifters using screen X, Y coordinates
    cycle_prerender(): void {
        if ((this.clock.frame_odd) && (this.line_cycle === 0)) this.line_cycle++;
        let lc = this.line_cycle;
        if (lc === 1) {
            this.io.sprite0_hit = 0;
            this.io.sprite_overflow = 0;
            this.status.nmi_out = 0;
            this.update_nmi();
        }
        if (this.rendering_enabled()) {
            if (lc === 257) this.io.v = (this.io.v & 0xFBE0) | (this.io.t & 0x41F);
            if ((this.rendering_enabled()) && (this.line_cycle >= 280) && (this.line_cycle <= 304)) this.io.v = (this.io.v & 0x041F) | (this.io.t & 0x7BE0);
        }
        if (this.io.sprite_enable && (this.line_cycle >= 257)) {
            this.oam_evaluate_slow();
        }
    }

    render_cycle(): void {
        if (this.clock.ppu_y < this.clock.timing.post_render_ppu_idle) { // 0-239
            this.cycle_visible();
            return;
        }
        else if (this.clock.ppu_y < this.clock.timing.ppu_pre_render) { // 240-260
            this.cycle_postrender();
            return;
        }
        this.cycle_prerender(); // 261
    }

    cycle(howmany: u32): u32 {
        for (let i: u32 = 0; i < howmany; i++) {
            let r: i64 = this.w2006_buffer.get((this.clock.ppu_master_clock / this.clock.timing.ppu_divisor));
            if (r > 0) {
                this.io.v = <u32>r;
                this.bus.mapper.a12_watch(<u32>r);
            }
            this.render_cycle();
            this.line_cycle++;
            this.clock.ppu_frame_cycle++;
            if (this.line_cycle === 341) this.new_scanline();
            this.clock.ppu_master_clock += this.clock.timing.ppu_divisor;
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
                    this.latch.VRAM_read = this.bus.mapper.PPU_read_effect(this.io.v & 0x3FFF);
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

                this.io.emph_r = ((val & 0x20) >>> 5);
                this.io.emph_g = ((val & 0x40) >>> 6);
                this.io.emph_b = ((val & 0x80) >>> 7);
                this.io.emph_bits = <u16>((val & 0xE0) << 1);
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
                //console.log('AS PPUSCROLL ON LINE ' + this.clock.ppu_y.toString() + ': ' + val.toString() + ', ' + this.io.t.toString());
                return;
            case 0x2006: // PPUADDR
                if (this.io.w === 0) {
                    this.io.t = (this.io.t & 0xFF) | ((val & 0x3F) << 8);
                    this.io.w = 1;
                } else {
                    this.io.t = (this.io.t & 0x7F00) | val;
                    this.w2006_buffer.set((this.clock.ppu_master_clock / this.clock.timing.ppu_divisor) + (3 * this.clock.timing.ppu_divisor), this.io.t);
                    this.io.w = 0;
                }
                return;
            case 0x2007: // PPUDATA
                if (this.rendering_enabled() && ((this.clock.ppu_y < this.clock.timing.vblank_start) || (this.clock.ppu_y > this.clock.timing.vblank_end))) {
                    console.log('REJECT WRITE ' + this.clock.ppu_y.toString() + ' ' + this.io.sprite_enable.toString() + ' ' + this.io.bg_enable.toString() + ' ' + this.io.v.toString(16) + ' ' + val.toString(16));
                    return;
                }
                this.mem_write(this.io.v, val);
                this.io.v = (this.io.v + this.io.vram_increment) & 0x7FFF;
                return;
        }
    }
}