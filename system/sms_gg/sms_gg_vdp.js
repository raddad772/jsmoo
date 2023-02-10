"use strict";

const SMSGG_PALETTE = [
    0x00, 0x00, 0x08, 0x0C, 0x10, 0x30, 0x01, 0x3C,
    0x02, 0x03, 0x05, 0x0F, 0x04, 0x33, 0x15, 0x3F
]

const SMSGG_VDP_modes = {
    SMS: 0,
    GG: 1
}

const SER_SMSGG_object = [
    'x', 'y', 'pattern', 'color'
];

class SMSGG_object {
    constructor() {
        this.x = 0;
        this.y = 0xD0;
        this.pattern = 0;
        this.color = 0;
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_SMSGG_object);
        return o;
    }

    deserialize(from) {
        return deserialization_helper(this, from, SER_SMSGG_object);
    }
}

const SER_SMSGG_VDP = [
    // CRAM custom
    'variant', 'VRAM', 'mode', 'output', 'objects',
    'io', 'latch', 'bg_color', 'bg_priority', 'bg_palette',
    'sprite_color', 'bg_gfx_vlines', 'doi'
]

class SMSGG_VDP {
    /**
     * @param {Number} variant
     * @param {SMSGG_clock} clock
     * @param {SMSGG_bus} bus
     */
    constructor(variant, clock, bus) {
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;

        this.bus.vdp = this;

        this.VRAM = new Uint8Array(16384);
        this.CRAM = new Uint16Array(32);

        this.mode = SMSGG_VDP_modes.SMS;
        let bm = 1;
        switch(variant) {
            case SMSGG_variants.GG:
                this.mode = SMSGG_VDP_modes.GG;
                bm = 2;
                break;
        }


        this.output_shared_buffers = [new SharedArrayBuffer(256*240*bm), new SharedArrayBuffer(256*240*bm)];
        switch(variant) {
            case SMSGG_variants.GG:
                this.output = [new Uint16Array(this.output_shared_buffers[0]), new Uint16Array(this.output_shared_buffers[1])];
                break;
            default:
                this.output = [new Uint8Array(this.output_shared_buffers[0]), new Uint8Array(this.output_shared_buffers[1])];
                break;
        }
        this.cur_output_num = 1;
        this.cur_output = this.output[1];
        this.last_used_buffer = 1;

        this.objects = [];

        for (let i = 0; i < 8; i++) {
            this.objects[i] = new SMSGG_object();
        }

        this.io = {
            code: 0,
            video_mode: 0,
            display_enable: 0,
            bg_name_table_address: 0,
            bg_color_table_address: 0,
            bg_pattern_table_address: 0,
            sprite_attr_table_address: 0,
            sprite_pattern_table_address: 0,
            bg_color: 0,
            hscroll: 0,
            vscroll: 0,
            line_irq_reload: 255,

            sprite_overflow_index: 0,
            sprite_collision: 0,
            sprite_overflow: 0x1F,
            sprite_shift: 0,
            sprite_zoom: 0,
            sprite_size: 0,
            left_clip: 0,
            bg_hscroll_lock: 0,
            bg_vscroll_lock: 0,

            irq_frame_pending: 0,
            irq_frame_enabled: 0,
            irq_line_pending: 0,
            irq_line_enabled: 0,

            address: 0,

        };

        this.latch = {
            control: 0,
            vram: 0,
            cram: 0,
            hcounter: 0,
            hscroll: 0,
            vscroll: 0,
        };

        this.bg_color = 0;
        this.bg_priority = 0;
        this.bg_palette = 0;
        this.sprite_color = 0;

        this.bg_gfx_vlines = 192;
        this.bg_gfx = function(){debugger;}
        this.sprite_gfx = function(){debugger;}

        this.doi = 0;

        this.scanline_cycle = this.scanline_visible.bind(this);
    }

    serialize() {
        let o = {version: 1, CRAM: [], clock_vpos: this.clock.vpos};
        serialization_helper(o, this, SER_SMSGG_VDP);
        for (let i = 0; i < 32; i++) {
            o.CRAM[i] = this.CRAM[i];
        }
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG SMSGG VDP VER!');
            return false;
        }
        let r =deserialization_helper(this, from, SER_SMSGG_VDP);
        for (let i = 0; i < 32; i++) {
            this.CRAM[i] = from.CRAM[i];
        }
        this.update_videomode();
        this.set_scanline_kind(from.clock_vpos);
        return r;
    }

    present() {
        if (this.variant === SMSGG_variants.GG)
            this.gg_present()
        else
            this.sms_present()
    }

    gg_present() {
        this.canvas_manager.set_size(160, 144, 4, 3);
        let ybottom = this.clock.timing.bottom_rendered_line+1;
        let ydiff = (ybottom - 144) >>> 1;
        let imgdata = this.canvas_manager.get_imgdata();
        for (let ry = ydiff; ry < (144+ydiff); ry++) {
            let y = ry;
            for (let rx = 48; rx < 208; rx++) {
                let x = rx;
                let di = (((y-ydiff) * 160) + (x-48)) * 4;
                let ulai = (y * 256) + x;
                let color = this.output[ulai];
                let r, g, b
                b = ((color >>> 8) & 0x0F) * 0x11;
                g = ((color >>> 4) & 0x0F) * 0x11;
                r = (color & 0x0F) * 0x11;
                imgdata.data[di] = r;
                imgdata.data[di+1] = g;
                imgdata.data[di+2] = b;
                imgdata.data[di+3] = 255;
            }
        }
        this.canvas_manager.put_imgdata(imgdata);
    }

    sms_present() {
        if (this.clock.timing.fps === 50) this.canvas_manager.set_size(256, this.clock.timing.rendered_lines+1, 18, 13);
        else this.canvas_manager.set_size(256, this.clock.timing.rendered_lines+1, 4*1, 3*.906);
        let imgdata = this.canvas_manager.get_imgdata();
        for (let ry = 0; ry < this.clock.timing.rendered_lines; ry++) {
            let y = ry;
            for (let rx = 0; rx < 256; rx++) {
                let x = rx;
                let di = ((y * 256) + x) * 4;
                let ulai = (y * 256) + x;

                let color = this.output[ulai];
                let r, g, b;
                b = ((color >>> 4) & 3) * 0x55;
                g = ((color >>> 2) & 3) * 0x55;
                r = (color & 3) * 0x55;

                imgdata.data[di] = r;
                imgdata.data[di+1] = g;
                imgdata.data[di+2] = b;
                imgdata.data[di+3] = 255;
            }
        }
        this.canvas_manager.put_imgdata(imgdata);
    }

    sprite_gfx2() {
        let hlimit = (8 << (this.io.sprite_zoom + this.io.sprite_size)) - 1;
        let vlimit = hlimit;
        for (let i = 0; i < 8; i++) {
            let o = this.objects[i];
            if (o.y === 0xD0) continue;
            if (this.clock.hpos < o.x) continue;
            if (this.clock.hpos > (o.x + hlimit)) continue;

            let x = ((this.clock.hpos - o.x) >>> this.io.sprite_zoom);
            let y = ((this.clock.vpos - o.y) >>> this.io.sprite_zoom);

            let addr = (o.pattern << 3) + ((x & 0xF8) << 1) + (y & vlimit);
            addr |= this.io.sprite_pattern_table_address << 11;

            let index = x ^ 7;
            let bmask = 1 << index;
            if (this.VRAM[addr] & bmask) {
                if (this.sprite_color && this.io.display_enable) { this.io.sprite_collision = 1; break; }
                this.sprite_color = o.color;
            }
        }
    }

    sprite_gfx3() {
        let vlines = this.bg_gfx_vlines;
        let hlimit = (8 << this.io.sprite_zoom) - 1;
        let vlimit = (8 << (this.io.sprite_zoom + this.io.sprite_size)) - 1;
        for (let i = 0; i < 8; i++) {
            let o = this.objects[i];
            if (o.y === 0xD0) continue;
            if ((this.clock.hpos < o.x) || (this.clock.hpos > (o.x + hlimit))) continue;

            let x = (this.clock.hpos - o.x) >>> this.io.sprite_zoom;
            let y = (this.clock.vpos - o.y) >>> this.io.sprite_zoom;

            let addr = ((o.pattern << 3) + (y & vlimit)) << 2;
            addr |= (this.io.sprite_pattern_table_address & 4) << 11;

            let index = x ^ 7;
            let bmask = (1 << index);
            let color = (this.VRAM[addr] & bmask) ? 1 : 0;
            color |= (this.VRAM[addr | 1] & bmask) ? 2 : 0;
            color |= (this.VRAM[addr | 2] & bmask) ? 4 : 0;
            color |= (this.VRAM[addr | 3] & bmask) ? 8 : 0;
            if (color === 0) continue;

            if (this.sprite_color && this.io.display_enable) { this.io.sprite_collision = 1; break; }
            this.sprite_color = color;
        }
    }

    dac_palette(index) {
        if (this.variant !== SMSGG_variants.GG) {
            if (!(this.io.video_mode & 8)) return SMSGG_PALETTE[index & 0x0F];
            return this.CRAM[index] & 0x3F;
        }
        if (this.mode === SMSGG_VDP_modes.SMS) {
            let color = this.CRAM[index];
            if (!(this.io.video_mode & 8)) color = SMSGG_PALETTE[index & 0x0F];
            let r = (color & 3) | ((color & 3) << 2);
            let g = ((color & 0x0C) >>> 2) | (color & 0x0C);
            let b = ((color & 0x30) >>> 4) | (color & 0x30) >>> 2;
            return r | (g << 4) | (b << 8);
        }
        if (this.mode === SMSGG_VDP_modes.GG) {
            if (!(this.io.video_mode & 8)) {
                let color = SMSGG_PALETTE[index & 7];
                let r = (color & 3) | ((color & 3) << 2);
                let g = ((color & 0x0C) >>> 2) | (color & 0x0C);
                let b = ((color & 0x30) >>> 4) | (color & 0x30) >>> 2;
                return r | (g << 4) | (b << 8);
            }
            return this.CRAM[index];
        }
        return 0;
    }

    // Run a cycle of TMS chip simple-ish graphics
    bg_gfx1() {
        let nta = ((this.clock.hpos >>> 3) & 0x1F) | ((this.clock.vpos  << 2) & 0x3E0) | (this.io.bg_name_table_address << 10);
        let pattern = this.VRAM[nta];

        let paddr = (this.clock.vpos & 7) | (pattern << 3) | (this.io.bg_pattern_table_address << 11);

        let caddr = ((paddr >>> 3) & 0x1F) | (this.io.bg_color_table_address << 6);

        let color = this.VRAM[caddr];
        let index = this.clock.hpos ^ 7;
        if ((this.VRAM[paddr] & (1 << index)) === 0)
            this.bg_color = color & 0x0F;
        else
            this.bg_color = (color >>> 4) & 0x0F;
    }

    bg_gfx2() {
        let nta = ((this.clock.hpos >>> 3) & 0x1F) | ((this.clock.vpos  << 2) & 0x3E0) | (this.io.bg_name_table_address << 10);
        let pattern = this.VRAM[nta];

        let paddr = (this.clock.vpos & 7) | (pattern << 3);
        if (this.clock.vpos >= 64 && this.clock.vpos <= 127) paddr |= (this.io.bg_pattern_table_address & 1) << 11;
        if (this.clock.vpos >= 128 && this.clock.vpos <= 191) paddr |= (this.io.bg_pattern_table_address & 2) << 11;

        let caddr = paddr;
        paddr |= (this.io.bg_pattern_table_address & 4) << 11;
        caddr |= (this.io.bg_color_table_address & 0x80) << 4;

        let cmask = ((this.io.bg_color_table_address & 0x7F) << 1) | 1;
        let color = this.VRAM[caddr];
        let index = this.clock.hpos ^ 7;
        if (!(this.VRAM[paddr] & (1 << index)))
            this.bg_color = color & 0x0F;
        else
            this.bg_color = (color >>> 4) & 0x0F;
    }

    bg_gfx3() {
        let hpos = this.clock.hpos;
        let vpos = this.clock.vpos;

        if (hpos < (this.latch.hscroll & 7)) {
            this.bg_color = 0;
            return;
        }

        if ((!this.io.bg_hscroll_lock) || (vpos >= 16)) hpos -= this.latch.hscroll;
        if ((!this.io.bg_vscroll_lock) || (hpos <= 191)) vpos += this.latch.vscroll;
        hpos &= 0xFF;
        vpos &= 0x1FF;

        let nta;
        if (this.bg_gfx_vlines === 192) {
            vpos %= 224;
            nta = (this.io.bg_name_table_address & 0x0E) << 10;
            nta += (vpos & 0xF8) << 3;
            nta += ((hpos & 0xF8) >>> 3) << 1;
            if (this.variant === SMSGG_variants.SMS1) {
                // NTA bit 10 (0x400) & with io nta bit 0
                nta &= (0x3BFF | ((this.io.bg_name_table_address & 1) << 10));
            }
        } else {
            vpos &= 0xFF;
            nta = ((this.io.bg_name_table_address & 0x0C) << 10) | 0x700;
            nta += (vpos & 0xF8) << 3;
            nta += ((hpos & 0xF8) >>> 3) << 1;
        }

        let pattern = this.VRAM[nta] | (this.VRAM[nta | 1] << 8);
        if (pattern & 0x200) hpos ^= 7;
        if (pattern & 0x400) vpos ^= 7;
        let palette = (pattern & 0x800) >>> 11;
        let priority = (pattern & 0x1000) >>> 12;

        let pta = (vpos & 7) << 2;
        pta |= (pattern & 0x1FF) << 5;

        let index = (hpos & 7) ^ 7;
        let bmask = (1 << index);
        let color = (this.VRAM[pta] & bmask) ? 1 : 0;
        color += (this.VRAM[pta | 1] & bmask) ? 2 : 0;
        color += (this.VRAM[pta | 2] & bmask) ? 4 : 0;
        color += (this.VRAM[pta | 3] & bmask) ? 8 : 0;

        if (color === 0) priority = 0;
        this.bg_color = color;
        this.bg_priority = priority;
        this.bg_palette = palette;
    }

    pprint_sprites() {
        console.log('PPRINT!');
        for (let i = 0; i < 64; i++) {
            let attr_addr = (this.io.sprite_attr_table_address & 0x7E) << 7;
            for (let index = 0; index < 64; index++) {
                let y = this.VRAM[attr_addr + index];
                if ((this.bg_gfx_vlines === 192) && (y === 0xD0)) break;
                if (y >= 0xF0) y = (y - 0xFF) & 0x1FF;

                let x = this.VRAM[attr_addr + 0x80 + (index << 1)];
                let pattern = this.VRAM[attr_addr + 0x81 + (index << 1)];

                if (this.io.sprite_shift) x = (x - 8) & 0xFF;
                console.log('SPRITE #', i, 'X/Y', x, y, 'PATTERN', hex2(pattern));
            }
        }
    }

    sprite_setup() {
        for (let i = 0; i < 8; i++) {
            this.objects[i].y = 0xFF;
        }
        let valid = 0;
        let vlimit = (8 << (this.io.sprite_zoom + this.io.sprite_size)) - 1;
        for (let i = 0; i < 8; i++) this.objects[i].y = 0xD0;

        let vpos = this.clock.vpos;

        let attr_addr;
        if (!(this.io.video_mode & 8)) {
            attr_addr = this.io.sprite_attr_table_address << 7;
            for (let index = 0; index < 32; index++) {
                let y = this.VRAM[attr_addr++];
                if (y === 0xD0) break;
                if (y >= 0xE0) y = (y - 0xFF) & 0x1FF;
                if ((vpos < y) || (vpos > (y + vlimit))) {
                    attr_addr += 3;
                    continue;
                }

                let x = this.VRAM[attr_addr++];
                let pattern = this.VRAM[attr_addr++];
                let extra = this.VRAM[attr_addr++];

                if (extra & 0x80) x -= 32;

                if (vlimit === (this.io.sprite_zoom ? 31 : 15)) pattern &= 0xFC;

                if (valid === 4) {
                    this.io.sprite_overflow = 1;
                    this.io.sprite_overflow_index = index;
                    break;
                }

                this.objects[valid].x = x;
                this.objects[valid].y = y;
                this.objects[valid].pattern = pattern;
                this.objects[valid].color = extra & 7;
                valid++;
            }
        } else {
            attr_addr = (this.io.sprite_attr_table_address & 0x7E) << 7;
            for (let index = 0; index < 64; index++) {
                let y = this.VRAM[attr_addr + index] + 1;
                if ((this.bg_gfx_vlines === 192) && (y === 0xD1)) break;
                if (y >= 0xF1) y = (y - 0xFF) & 0x1FF;
                if ((vpos < y) || (vpos > (y + vlimit))) continue;

                let x = this.VRAM[attr_addr + 0x80 + (index << 1)];
                let pattern = this.VRAM[attr_addr + 0x81 + (index << 1)];

                if (this.io.sprite_shift) x = (x - 8) & 0xFF;
                if (vlimit === (this.io.sprite_zoom ? 31 : 15)) pattern &= 0xFE;

                if (valid === 8) {
                    this.io.sprite_overflow = 1;
                    this.io.sprite_overflow_index = index;
                    break;
                }
                this.objects[valid].x = x;
                this.objects[valid].y = y;
                this.objects[valid].pattern = pattern;
                valid++;
            }
        }
    }

    dac_gfx() {
        let color = this.dac_palette(16 | this.io.bg_color);

        if (this.io.display_enable) {
            if ((!this.io.left_clip) || (this.clock.hpos >= 8)) {
                if (this.bg_priority || (this.sprite_color === 0)) {
                    color = this.dac_palette((this.bg_palette << 4) | this.bg_color);
                } else if (this.sprite_color !== 0) {
                    color = this.dac_palette(16 | this.sprite_color);
                }
            }
        }

        this.cur_output[this.doi] = color;
        this.doi++;
    }

    // Do a cycle on scanlines 192-, 224-, or 240-262 or 312
    scanline_invisible() {
        // Literally do nothing bro
    }

    // Do a cycle on scanlines 0-191, 223, or 239
    scanline_visible() {
        // Scanlines 0-191, or 223, or 239, depending.
        this.bg_color = this.bg_priority = this.bg_palette = 0;
        this.sprite_color = 0;
        if (this.clock.hpos === 0) {
            this.latch.hscroll = this.io.hscroll;
            this.latch.vscroll = this.io.vscroll;

            this.sprite_setup();
            this.doi = (this.clock.vpos * 256);
        }
        if ((this.clock.hpos < 256) && (this.clock.vpos < this.clock.timing.frame_lines)) {
            this.bg_gfx();
            this.sprite_gfx();
            this.dac_gfx();
        }
    }

    new_scanline() {
        this.clock.hpos = 0;
        this.clock.vpos++;
        if (this.clock.vpos === this.clock.timing.frame_lines) {
            this.new_frame();
        }

        if (this.clock.vpos < this.clock.timing.rendered_lines) {
            this.clock.line_counter = (this.clock.line_counter - 1);
            if (this.clock.line_counter < 0) {
                this.clock.line_counter = this.io.line_irq_reload;
                this.io.irq_line_pending = 1;
                this.update_irqs();
            }
        }
        else {
            this.clock.line_counter = this.io.line_irq_reload;
        }

        if (this.clock.vpos === this.clock.timing.vblank_start) {
            this.io.irq_frame_pending = 1;
            this.update_irqs();
        }

        this.set_scanline_kind(this.clock.vpos);

        if (this.clock.vpos < this.clock.timing.cc_line)
            this.clock.ccounter = (this.clock.ccounter + 1) & 0xFFF;
    }

    set_scanline_kind(vpos) {
        switch(vpos) {
            case 0:
                this.scanline_cycle = this.scanline_visible.bind(this);
                break;
            case this.clock.timing.rendered_lines:
                this.scanline_cycle = this.scanline_invisible.bind(this);
                break;
        }
    }

    new_frame() {
        this.clock.frames_since_restart++;
        this.clock.vpos = 0;
        this.clock.vdp_frame_cycle = 0;
        this.last_used_buffer = this.cur_output_num;
        this.cur_output_num ^= 1;
        this.cur_output = this.output[this.cur_output_num];
    }

    read_vcounter() {
        if (this.clock.timing.region === REGION.NTSC) {
            switch(this.io.video_mode) {
                case 0x0B: // 1011 256x224
                    return (this.clock.vpos <= 234) ? this.clock.vpos : (this.clock.vpos - 6);
                case 0x0E: // 1110 256x240 NOT FUNCTIONAL ON NTSC really
                    return this.clock.vpos;
                default: // 256x192
                    return (this.clock.vpos <= 218) ? this.clock.vpos : (this.clock.vpos - 6);
            }
        }
        else {
            switch(this.io.video_mode) {
                case 0x0B: // 1011 256x224
                    return (this.clock.vpos <= 258) ? this.clock.vpos :  (this.clock.vpos - 57);
                case 0x0E: // 1110 256x240
                    return (this.clock.vpos <= 266) ? this.clock.vpos : (this.clock.vpos - 56);
                default: // 256x192
                    return (this.clock.vpos <= 242) ? this.clock.vpos : (this.clock.vpos - 57);
            }
        }
    }

    // hcounter is a little weird
    read_hcounter() {
        let hcounter = this.latch.hcounter;
        if (hcounter >= 592) hcounter += 340;
        return hcounter >>> 2;
    }

    latch_hcounter() {
        this.latch.hcounter = this.clock.hpos * this.clock.vdp_divisor;
    }

    read_data() {
        this.latch.control = 0;
        let r = this.latch.vram;
        this.latch.vram = this.VRAM[this.io.address];
        this.io.address = (this.io.address + 1) & 0x3FFF;
        return r;
    }

    write_data(val) {
        this.latch.control = 0;
        this.latch.vram = val;
        if (this.io.code <= 2) {
            this.VRAM[this.io.address] = val;
        }
        else {
            if (this.mode === SMSGG_VDP_modes.GG) {
                // even writes store 8-bit data into latch
                // odd writes store 12-bits into CRAM
                if ((this.io.address & 1) === 0)
                    this.latch.cram = val;
                else {
                    this.CRAM[this.io.address >>> 1] = ((val & 0x0F) << 8) | this.latch.cram;
                }

            }
            else {
                // 6 bits for SMS
                this.CRAM[this.io.address] = val & 0x3F;
            }
        }
        this.io.address = (this.io.address + 1) & 0x3FFF;
    }

    write_control(val) {
        if (this.latch.control === 0) {
            this.latch.control = 1;
            this.io.address = (this.io.address & 0xFF00) | val;
            return;
        }

        this.latch.control = 0;
        this.io.address = ((val & 0x3F) << 8) | (this.io.address & 0xC0FF);
        this.io.code = (val & 0xC0) >>> 6;
        //console.log('SET IO CODE', this.io.code);

        if (this.io.code === 0) {
            this.latch.vram = this.VRAM[this.io.address];
            this.io.address = (this.io.address + 1) & 0x3FFF;
        }

        if (this.io.code === 2) {
            this.register_write((this.io.address >>> 8) & 0x0F, this.io.address & 0xFF);
        }
    }

    update_irqs() {
        let level = 0;
        if (this.io.irq_frame_pending && this.io.irq_frame_enabled) {
            level = 1;
        }
        if (this.io.irq_line_pending && this.io.irq_line_enabled) {
            level = 1;
            this.io.irq_line_pending = 0;
        }
        //if (level === 1) console.log('NOTIFY AT', this.clock.vpos, this.clock.hpos);
        this.bus.notify_IRQ(level);
    }

    read_status() {
        this.latch.control = 0;

        let val = this.io.sprite_overflow_index | (this.io.sprite_collision << 5) | (this.io.sprite_overflow << 6) | (this.io.irq_frame_pending << 7);

        this.io.sprite_overflow_index = 0x1F;
        this.io.sprite_collision = 0;
        this.io.sprite_overflow = 0;
        this.io.irq_frame_pending = 0;
        this.io.irq_line_pending = 0;

        this.update_irqs();
        return val;
    }

    /**
     * @param {canvas_manager_t} canvas
     * @param {number} palatte
     */
    dump_tiles(canvas, palatte=0) {
        canvas.set_size(32 * 8, 16 * 8);
        let imgdata = canvas.get_imgdata();
        let r, g, b;
        for (let sy = 0; sy < 112; sy++) {
            for (let sx = 0; sx < 256; sx += 8) {
                let tile_num = (sx >>> 3) + ((sy >> 3) << 5);
                let tile_addr = (tile_num * 32);
                let line_in_tile = sy & 7;
                tile_addr += (line_in_tile * 4);
                if (tile_addr >= 0x3800) {
                    console.log('SKIP', sx, sy, hex4(tile_addr));
                    continue;
                }
                let bp0 = this.VRAM[tile_addr];
                let bp1 = this.VRAM[tile_addr+1];
                let bp2 = this.VRAM[tile_addr+2];
                let bp3 = this.VRAM[tile_addr+3]
                for (let x = sx; x < (sx+8); x++) {
                    let color = ((bp0 & 0x80) >>> 7) | ((bp1 & 0x80) >>> 6) | ((bp2 & 0x80) >>> 5) | ((bp3 & 0x80) >>> 4);
                    bp0 <<= 1;
                    bp1 <<= 1;
                    bp2 <<= 1;
                    bp3 <<= 1;
                    //color = this.CRAM[color];
                    color = this.dac_palette(color);
                    if (this.variant === SMSGG_variants.GG) {
                        b = (((color >>> 8) & 0x0F) * 16) - 1;
                        g = (((color >>> 4) & 0x0F) * 16) - 1;
                        r = ((color & 0x0F) * 16) - 1;
                    } else {
                        b = (((color >>> 4) & 7) * 64) - 1;
                        g = (((color >>> 2) & 7) * 64) - 1;
                        r = ((color & 7) * 64) - 1;
                    }

                    let di = ((sy * 256) + x) * 4;

                    imgdata.data[di] = r;
                    imgdata.data[di+1] = g;
                    imgdata.data[di+2] = b;
                    imgdata.data[di+3] = 255;
                }
            }
        }
        canvas.put_imgdata(imgdata);
    }

    /**
     * @param {canvas_manager_t} canvas
     */
    dump_bg(canvas) {
        let mode4 = (this.io.video_mode >= 8);
        let bottom_line = 192;
        if (this.io.video_mode === 11) bottom_line = 224;
        if (this.io.video_mode === 14) bottom_line = 240;

        let nt_base_addr = this.io.bg_pattern_table_address;

        console.log(this.io.hscroll, this.io.vscroll, this.bg_gfx_vlines);

        if (this.bg_gfx_vlines === 192) {
            nt_base_addr &= 0x0E;
            nt_base_addr <<= 10;
            console.log('NM4', this.io.video_mode, hex4(nt_base_addr));
        } else {
            nt_base_addr &= 0x0C;
            nt_base_addr <<= 10;
            nt_base_addr |= 0x700;
            console.log('M4', this.io.video_mode, hex4(nt_base_addr));
        }

        if (bottom_line > 192) bottom_line = 256;
        let r, g, b;

        // if bottom lines is 192, 32x28. else 32x32. doesn't make a difference to our program
        canvas.set_size(256, bottom_line);
        let imgdata = canvas.get_imgdata();
        for (let sy = 0; sy < bottom_line; sy++) {
            let nt_y = (sy >>> 3);
            for (let sx = 0; sx < 256; sx++) {
                let nt_x = (sx >>> 3);
                let nt_addr = nt_base_addr + ((nt_y * 64) + (nt_x * 2));
                let tilenum = this.VRAM[nt_addr];
                let tileattr = this.VRAM[nt_addr|1];
                tilenum |= (tileattr & 1) << 8;
                let palette = (tileattr & 8) >>> 3;
                let vflip = (tileattr & 4) >>> 2;
                let hflip = (tileattr & 2) >>> 1;
                let tile_y = sy & 7;
                let tile_x = sx & 7;
                if (vflip) tile_y ^= 7;
                if (hflip) tile_x ^= 7;
                let tile_addr = ((tilenum * 32) + (tile_y * 4));
                tile_x ^= 7;
                let bmask = 1 << tile_x;
                let bp0 = (this.VRAM[tile_addr] & bmask) >>> tile_x;
                let bp1 = (this.VRAM[tile_addr+1] & bmask) >>> tile_x;
                let bp2 = (this.VRAM[tile_addr+2] & bmask) >>> tile_x;
                let bp3 = (this.VRAM[tile_addr+3] & bmask) >>> tile_x;
                let color = ((bp0 & 1) | ((bp1 & 1) << 1) | ((bp2 & 1) << 3) | ((bp3 & 1) << 4));
                color = this.dac_palette(color);

                if (this.variant === SMSGG_variants.GG) {
                    b = (((color >>> 8) & 0x0F) * 16) - 1;
                    g = (((color >>> 4) & 0x0F) * 16) - 1;
                    r = ((color & 0x0F) * 16) - 1;
                } else {
                    b = (((color >>> 4) & 7) * 64) - 1;
                    g = (((color >>> 2) & 7) * 64) - 1;
                    r = ((color & 7) * 64) - 1;
                }

                let di = ((sy * 256) + sx) * 4;

                imgdata.data[di] = r;
                imgdata.data[di+1] = g;
                imgdata.data[di+2] = b;
                imgdata.data[di+3] = 255;
            }
        }

        canvas.put_imgdata(imgdata);
    }

    update_videomode() {
        let bottom_row = 192;
        if (this.clock.variant === SMSGG_variants.SMS1) bottom_row = 192;
        else {
            if (this.io.video_mode === 0x0B) bottom_row = 224;
            if (this.io.video_mode === 0x0E) bottom_row = 240;
        }

        this.clock.timing.bottom_rendered_line = bottom_row - 1;
        this.clock.timing.vblank_start = bottom_row+1;
        this.clock.timing.rendered_lines = bottom_row;


        switch(this.io.video_mode) {
            case 0:
                this.bg_gfx = this.bg_gfx1.bind(this);
                this.sprite_gfx = this.sprite_gfx2.bind(this);
                break;
            case 2:
                this.bg_gfx = this.bg_gfx2.bind(this);
                this.sprite_gfx = this.sprite_gfx2.bind(this);
                break;
            case 8:
                this.bg_gfx_vlines = 192;
                this.bg_gfx = this.bg_gfx3.bind(this);
                this.sprite_gfx = this.sprite_gfx3.bind(this);
                break;
            case  10:
                this.bg_gfx_vlines = 192;
                this.bg_gfx = this.bg_gfx3.bind(this);
                this.sprite_gfx = this.sprite_gfx3.bind(this);
                break;
            case 11:
                this.bg_gfx_vlines = 224;
                this.bg_gfx = this.bg_gfx3.bind(this);
                this.sprite_gfx = this.sprite_gfx3.bind(this);
                break;
            case 12:
                this.bg_gfx_vlines = 192;
                this.bg_gfx = this.bg_gfx3.bind(this);
                this.sprite_gfx = this.sprite_gfx3.bind(this);
                break;
            case 14:
                this.bg_gfx_vlines = 240;
                this.bg_gfx = this.bg_gfx3.bind(this);
                this.sprite_gfx = this.sprite_gfx3.bind(this);
                break;
            case 15:
                this.bg_gfx_vlines = 192;
                this.bg_gfx = this.bg_gfx3.bind(this);
                this.sprite_gfx = this.sprite_gfx3.bind(this);
                break;
        }

    }

    register_write(addr, val) {
        switch(addr) {
            case 0: // mode control thing, #1
                this.io.video_mode = (this.io.video_mode & 5) | (val & 2) | ((val & 4) << 1);
                this.io.sprite_shift = (val & 8) >>> 3;
                this.io.irq_line_enabled = (val & 0x10) >>> 4;
                this.io.left_clip = (val & 0x20) >>> 5;
                this.io.bg_hscroll_lock = (val & 0x40) >>> 6;
                this.io.bg_vscroll_lock = (val & 0x80) >>> 7;
                this.update_irqs();
                this.update_videomode();
                return;
            case 1: // mode control thing, #2
                this.io.sprite_zoom = val & 1;
                this.io.sprite_size = (val & 2) >>> 1;
                this.io.video_mode = (this.io.video_mode & 0x0A) | ((val & 8) >>> 1) | ((val & 0x10) >>> 4);
                this.io.irq_frame_enabled = (val & 0x20) >>> 5;
                this.io.display_enable = (val & 0x40) >>> 6;
                this.io.irq_frame_pending &= this.io.irq_frame_enabled;
                this.update_irqs();
                this.update_videomode();
                return;
            case 2: // name table base address
                this.io.bg_name_table_address = val & 0x0F;
                return;
            case 3: // color table base address
                this.io.bg_color_table_address = val;
                return;
            case 4: // pattern table base address
                this.io.bg_pattern_table_address = val & 0x07;
                return;
            case 5:
                this.io.sprite_attr_table_address = val & 0x7F;
                return;
            case 6:
                this.io.sprite_pattern_table_address = val & 7;
                return;
            case 7:
                this.io.bg_color = val & 0x0F;
                return;
            case 8:
                this.io.hscroll = val;
                return;
            case 9:
                this.io.vscroll = val;
                return;
            case 10:
                this.io.line_irq_reload = val;
                return;
        }
    }

    reset() {
        this.io.line_irq_reload = 255;
        this.clock.hpos = 0;
        this.clock.vpos = 0;
        this.clock.ccounter = 0;
        this.io.sprite_overflow_index = 0x1F;
        this.clock.frames_since_restart = 0;
        this.scanline_cycle = this.scanline_visible.bind(this);
        for (let i = 0; i < 8; i++) {
            this.objects[i].y = 0xD0;
        }
        for (let i in this.VRAM) {
            this.VRAM[i] = 0;
        }
        for (let i in this.CRAM) {
            this.CRAM[i] = 0;
        }
        this.update_videomode()
    }

    // Run a cycle yo
    cycle() {
        this.scanline_cycle();
        this.clock.vdp_frame_cycle += this.clock.vdp_divisor;
        this.clock.hpos++;
        if (this.clock.hpos === 342) this.new_scanline();
    }

    dump_palette() {
        console.log('DOIN IT...');
        let outstr = '00000000  ';
        for (let i = 0; i < 32; i++) {
            //outstr += hex2(this.CRAM[i] & 0xFF) + ' ' + hex2((this.CRAM[i] & 0xFF00) >>> 8) + ' ';
            outstr += hex4(this.CRAM[i]) + ' ';
            if ((i & 7) === 7) {
                console.log(outstr);
                outstr = '........  ';
            }
        }
        console.log(outstr);
    }
}