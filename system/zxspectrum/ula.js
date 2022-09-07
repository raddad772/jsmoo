"use strict";

// 0-7, or 8-15 for bright ones
const ZXSpectrum_palette = new Object.freeze({
    0: {0: [0, 0, 0], 1: [0, 0, 0xD8],
        2: [0xD8, 0, 0], 3: [0xD8, 0, 0xD8],
        4: [0, 0xD8, 0], 5: [0, 0xD8, 0xD8],
        6: [0xD8, 0xD8, 0], 7: [0xD8, 0xD8, 0xD8]},
    1: {0: [0, 0, 0], 1: [0, 0, 0xFF],
        2: [0xFF, 0, 0], 3: [0xFF, 0, 0xFF],
        4: [0, 0xFF, 0], 5: [0, 0xFF, 0xFF],
        6: [0xFF, 0xFF, 0], 7: [0xFF, 0xFF, 0xFF]}
})

const ZXSpectrum_keyboard_halfrows = new Object.freeze({
    0xF7: ['1', '2', '3', '4', '5'],
    0xEF: ['0', '9', '8', '7', '6'],
    0xFB: ['q', 'w', 'e', 'r', 't'],
    0xDF: ['p', 'o', 'i', 'u', 'y'],
    0xFD: ['a', 's', 'd', 'f', 'g'],
    0xBF: ['Enter', 'l', 'k', 'j', 'h'],
    0xFE: ['Caps', 'z', 'x', 'c', 'v'],
    0x7F: ['Space', 'Sym', 'm', 'n', 'b']
});

class ZXSpectrum_ULA {
    /**
     * @param {ZXSpectrum_clock} clock
     * @param {ZXSpectrum_bus} bus
     */
    constructor(clock, bus) {

        this.clock = clock;
        this.bus = bus;
        this.scanline_func = this.scanline_vblank.bind(this);
        this.first_vblank = true;

        this.screen_x = 0;
        this.screen_y = 0;

        this.bg_shift = 0;
        this.attr = {
            colors: [0, 0], // where 0 is bg, 1 is fg
            flash: 0
        };
        this.next_attr = 0;

        this.output = new Uint8Array(352*304);

        this.bus.cpu_ula_read = this.reg_read.bind(this);
        this.bus.cpu_ula_write = this.reg_write.bind(this);

        this.io = {
            border_color: 0,
            paper_color: 0
        }
    }

    /**
     * @param {Array} row
     */
    kb_scan_row(row) {
        let out = 0;
        for (let i = 0; i < 5; i++) {
            let key = row[i];
            //let kp = +(!CHECK_KEY_PRESSED(key));
            let kp = 1; // no keys pressed ATM
            out |= kp << i;
        }
        return out;
    }

    reg_read(addr, val, has_effect=false) {
        if ((addr & 1) === 1) {
            console.log('UHOH IN TO', hex4(addr));
            return;
        }
        let hi = addr >>> 8;
        let row = ZXSpectrum_keyboard_halfrows[hi];

        let out = 0;
        if (typeof row !== 'undefined') {
            out = this.kb_scan_row(row);
        }

        return out; // no keys selected ATM
    }

    reg_write(addr, val) {
        if ((addr & 1) === 1) {
            console.log('UHOH OUT TO', hex4(addr));
            return;
        }
        this.io.border_color = val & 7;
    }

    cycle() {
    // 448 pixel clocks per scanline
        this.scanline_func();
        this.clock.ula_x++;
        this.screen_x++;
        this.clock.ula_frame_cycle++;
        if (this.clock.ula_x === 448) this.new_scanline();
    }

    scanline_vblank() {
        this.clock.contended = false;
        if ((this.clock.ula_y === 0) && (this.clock.ula_x === 16)) {
            if (!this.first_vblank) this.bus.notify_IRQ(1);
            this.first_vblank = false;
        }
    }

    /*
    each scanline is 448 pixels wide.
    96 pixels of nothing
    48 pixels of border
    256 pixels of draw (read pattern bg, attrib, bg+1, attrib, none, none, none, none)
    48 pixels of border
    */
    scanline_border_top() {
        if ((this.screen_x >= 0) && (this.screen_x < 352)) {
            let bo = (362 * this.screen_y) + this.screen_x;
            this.output[bo] = this.io.border_color;
        }
    }

    scanline_border_bottom() {
        if ((this.screen_x >= 0) && (this.screen_x < 352)) {
            let bo = (362 * this.screen_y) + this.screen_x;
            this.output[bo] = this.io.border_color;
        }
    }

    scanline_visible() {
    /* each scanline is 448 pixels wide.
    96 pixels of nothing
    48 pixels of border
    256 pixels of draw (read pattern bg, attrib, bg+1, attrib, none, none, none, none)
    48 pixels of border

    */
        // Border
        if (this.screen_x < 0) return;
        let bo = (this.screen_y * 352) + this.screen_x;
        if (((this.screen_x >= 0) && (this.screen_x < 48)) ||
            (this.screen_x >= 304)) {
            this.clock.contended = false;
            this.output[bo] = this.io.border_color;
            return;
        }
        // OK we are in drawing area
        let dx = this.screen_x - 48;
        let dy = this.screen_y - 56;
        switch(dx & 7) {
            case 0: // Contention off
                this.clock.contended = false;
                let brt = (this.next_attr & 0x40) ? 8 : 0;
                this.attr.flash = ((this.next_attr & 0x80) >>> 7) & this.clock.flash.bit;
                this.attr.colors[0] = ((this.next_attr >>> 3) & 7) + brt;
                this.attr.colors[1] = (this.next_attr & 7) + brt;
                break;
            case 2:
                this.clock.contended = true;
                break;
            case 6: // fetch next bg
                //let addr = dx >>> 3;
                // 76 210 543
                // &0xC0
                //    &7
                //        &0x38
                /*addr |= ((dy & 0x38) >>> 3);
                addr |= ((dy & 7) << 3);
                addr |= (dy & 0xC0);*/
                /*addr |= ((dy & 0x38) << 2);
                addr |= ((dy & 7) << 8);
                addr |= ((dy & 0xC0) << 5);*/
                let addr = 0x4000 | ((dy & 0xC0) << 5) | ((dy & 7) << 8) | ((dy & 0x38) << 2) | (dx >>> 3);
                let val = this.bus.ula_read(addr, 0);
                // Only 2 shifts left before we need this data
                this.bg_shift |= (val << 2);
                break;
            case 7: // next next attr
                this.next_attr = this.bus.ula_read(0x5800 + ((dy >>> 3) * 0x20) + (dx >>> 3));
                break;
        }

        let out_bit = (this.bg_shift & 1) ^ this.attr.flash;
        this.bg_shift >>>= 1;
        this.output[bo] = this.attr.colors[out_bit];
    }

    new_scanline() {
        this.clock.ula_x = 0;
        this.screen_x = -96;
        this.clock.ula_y++
        this.screen_y++;
        if (this.clock.ula_y === 312) {
            // NEW FRAME TIME DUDE!
            this.clock.ula_y = 0;
            this.clock.ula_frame_cycle = 0;
            this.screen_y = -8;
            this.clock.master_frame_count++;
            this.clock.flash.count--;
            if (this.clock.flash.count === 0) {
                this.clock.flash.count = 16;
                this.clock.flash.bit ^= 1;
            }
        }

        /*lines 0-7 are vblank
        lines 8-63 are upper border
        lines 64-255 are visible
        lines 256-311 are lower border*/
        switch(this.clock.ula_y) {
            case 0: // lines 0-7 are vblank
                this.scanline_func = this.scanline_vblank.bind(this);
                break;
            case 8: // lines 8-63 are upper border
                this.scanline_func = this.scanline_border_top.bind(this);
                break;
            case 64: // lines 64-255 are visible
                this.scanline_func = this.scanline_visible.bind(this);
                break;
            case 256: // 256-311 are lower border
                this.scanline_func = this.scanline_border_bottom.bind(this);
        }
    }
}