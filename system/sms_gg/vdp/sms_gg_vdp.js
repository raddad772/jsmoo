"use strict";

const SMSGG_REGIONS = {
    NTSC: 0,
    PAL: 1
}

const SMSGG_PALETTE = [
    0x00, 0x00, 0x08, 0x0C, 0x10, 0x30, 0x01, 0x3C,
    0x02, 0x03, 0x05, 0x0F, 0x04, 0x33, 0x15, 0x3F
]

const SMSGG_vdp_modes = {
    SMS: 0,
    GG: 1
}

class SMSGG_object {
    constructor() {
        this.x = 0;
        this.y = 0xD0;
        this.pattern = 0;
        this.color = 0;
    }
}

class SMSGG_VDP {
    /**
     * @param {HTMLElement} canvas
     * @param {Number} variant
     * @param {SMSGG_clock} clock
     * @param {SMSGG_bus} bus
     */
    constructor(canvas, variant, clock, bus) {
        this.canvas = canvas;
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;

        this.bus.vdp = this;

        this.VRAM = new Uint8Array(16384);
        this.CRAM = new Uint16Array(32);

        this.mode = SMSGG_vdp_modes.SMS;

        this.output = new Uint8Array(256*240);

        this.objects = new Array(8);

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
        this.dac_gfx = function(){debugger;}

        this.doi = 0;

        this.scanline_cycle = this.scanline_visible.bind(this);
    }

    present() {
        let ctx = this.canvas.getContext('2d');
        let imgdata = ctx.getImageData(0, 0, 256, 240);
        for (let ry = 0; ry < this.clock.timing.rendered_lines; ry++) {
            let y = ry;
            for (let rx = 0; rx < 256; rx++) {
                let x = rx;
                let di = ((y * 256) + x) * 4;
                let ulai = (y * 256) + x;

                let color = this.output[ulai];
                let r, g, b;
                if (this.variant === SMSGG_variants.GG) {
                    b = (((color >>> 8) & 0x0F) * 16) - 1;
                    g = (((color >>> 4) & 0x0F) * 16) - 1;
                    r = ((color & 0x0F) * 16) - 1;
                } else {
                    b = (((color >>> 4) & 7) * 32);
                    g = (((color >>> 2) & 7) * 32);
                    r = ((color & 7) * 32);
                }

                imgdata.data[di] = r;
                imgdata.data[di+1] = g;
                imgdata.data[di+2] = b;
                imgdata.data[di+3] = 255;
            }
        }
        ctx.putImageData(imgdata, 0, 0);
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
        if (this.mode === SMSGG_vdp_modes.SMS) {
            let color = this.CRAM[index];
            if (!(this.io.video_mode & 8)) color = SMSGG_PALETTE[index & 0x0F];
            let r = (color & 3) | ((color & 3) << 2);
            let g = ((color & 0x0C) >>> 2) | (color & 0x0C);
            let b = ((color & 0x30) >>> 4) | (color & 0x30) >>> 2;
            return r | (g << 4) | (b << 8);
        }
        if (this.mode === SMSGG_vdp_modes.GG) {
            if (!(this.io.video_mode & 8)) {
                let color = SMSGG_PALETTE[index & 7];
                let r = (color & 3) | ((color & 3) << 2);
                let g = ((color & 0x0C) >>> 2) | (color & 0x0C);
                let b = ((color & 0x30) >>> 4) | (color & 0x30) >>> 2;
                return r | (g << 4) | (b << 8);
            }
            return self.CRAM[index];
        }
        return 0;
    }

    // Run a cycle of TMS chip simple-ish graphics
    bg_gfx1() {
        let nta = ((this.clock.hpos >>> 3) & 0x1F) | ((this.clock.vpos  << 2) & 0x3E0) | (this.io.bg_name_table_address << 10);
        let pattern = this.VRAM[nta];

        let paddr = (this.io.vpos & 7) | (pattern << 3) | (this.io.bg_pattern_table_address << 11);

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

        let paddr = (this.io.vpos & 7) | (pattern << 3);
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
            nta += (hpos & 0xF8) >>> 2;
            if (this.variant === SMSGG_variants.SMS1) {
                // NTA bit 10 (0x400) & with io nta bit 0
                nta &= (0x3BFF | ((this.io.bg_name_table_address & 1) << 10));
            }
        } else {
            vpos &= 0xFF;
            nta = ((this.io.bg_name_table_address & 0x0C) << 10) | 0x700;
            nta += (vpos & 0xF8) << 3;
            nta += (hpos & 0xF8) >>> 2;
        }

        let pattern = this.VRAM[nta] | (this.VRAM[nta | 1] << 8);
        if (pattern & 0x200) hpos ^= 7;
        if (pattern & 0x400) vpos ^= 7;
        let palette = (pattern & 0x800) >>> 11;
        let priority = (pattern & 0x1000) >>> 12;

        let pta = (vpos & 7) << 2;
        pta |= pattern << 5;

        let index = hpos ^ 7;
        let bmask = (1 << index);
        let color = (this.VRAM[pta] & bmask) >>> index;
        color += (this.VRAM[pta | 1] & bmask) ? 2 : 0;
        color += (this.VRAM[pta | 2] & bmask) ? 4 : 0;
        color += (this.VRAM[pta | 3] & bmask) ? 8 : 0;

        if (color === 0) priority = 0;
        this.bg_color = color;
        this.bg_priority = priority;
        this.bg_palette = palette;
    }

    sprite_setup() {
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
                let y = this.VRAM[attr_addr + index];
                if ((this.bg_gfx_vlines === 192) && (y === 0xD0)) break;
                if (y >= 0xF0) y = (y - 0xFF) & 0x1FF;
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
        this.output[this.doi] = color;
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
            this.doi = (((240-this.bg_gfx_vlines)/2) + this.clock.vpos) * 256;
        }
        if (this.clock.hpos < 256) {
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
            if (this.clock.line_counter-- < 0) {
                this.clock.line_counter = this.io.line_irq_reload;
                this.io.irq_line_pending = 1;
                this.update_irqs();
            }
            else {
                this.clock.line_counter = this.io.line_irq_reload;
            }

            if (this.clock.vpos === this.clock.timing.vblank_start) {
                this.io.irq_frame_pending = 1;
                this.update_irqs();
            }
        }

        switch(this.clock.vpos) {
            case 0:
                this.scanline_cycle = this.scanline_visible.bind(this);
                break;
            case this.clock.timing.rendered_lines:
                this.scanline_cycle = this.scanline_invisible.bind(this);
                break;
        }

        if (this.clock.vpos < this.clock.timing.cc_line)
            this.io.ccounter = (this.io.ccounter + 1) & 0xFFF;
    }

    new_frame() {
        this.clock.master_frame++;
        this.clock.vpos = 0;
    }

    read_vcounter() {
        if (this.clock.timing.region === SMSGG_REGIONS.NTSC) {
            switch(this.io.video_mode) {
                case 0x0B: // 1011 256x224
                    return (this.clock.vpos <= 234) ? this.clock.vpos : this.clock.vpos - 6;
                case 0x0E: // 1110 256x240 NOT FUNCTIONAL ON NTSC really
                    return this.clock.vpos;
                default: // 256x192
                    return (this.clock.vpos <= 218) ? this.clock.vpos : this.clock.vpos - 6;
            }
        }
        else {
            switch(this.io.video_mode) {
                case 0x0B: // 1011 256x224
                    return (this.clock.vpos <= 258) ? this.clock.vpos :  this.clock.vpos - 57;
                case 0x0E: // 1110 256x240
                    return (this.clock.vpos <= 266) ? this.clock.vpos : this.clock.vpos - 56;
                default: // 256x192
                    return (this.clock.vpos <= 242) ? this.clock.vpos : this.clock.vpos - 57;
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
            this.VRAM[this.io.address] = data;
        }
        else {
            if (this.mode === SMSGG_vdp_modes.GG) {
                // even writes store 8-bit data into latch
                // odd writes store 12-bits into CRAM
                if (this.io.address & 1)
                    this.latch.cram = val;
                else
                    this.CRAM[this.io.address >> 1] = ((val & 0x0F) << 8) | this.latch.cram;
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
        this.io.address = ((val & 0x3F) << 8) | (this.io.address & 0xFF);
        this.io.code = (val & 0xC0) >>> 6;

        if (this.io.code === 0) {
            this.latch.vram = this.VRAM[this.io.address];
            this.io.address = (this.io.address + 1) & 0x3FFF;
        }

        if (this.io.code === 2) {
            this.register_write((this.io.address >>> 8) & 0x0F, this.io.address & 0xFF);
        }
    }

    update_irqs() {
        if (this.io.irq_frame_pending && this.io.irq_frame_enabled) this.bus.notify_IRQ(1);
        if (this.io.irq_line_pending && this.io.irq_line_enabled) this.bus.notify_IRQ(1);
        this.bus.notify_IRQ(0);
    }

    read_status() {
        this.latch.control = 0;

        let val = this.io.sprite_overflow_index | (this.io.sprite_collision << 5) || (this.io.sprite_overflow << 6) | (this.io.irq_frame_pending);


        this.io.sprite_overflow_index = 0x1F;
        this.io.sprite_collision = 0;
        this.io.sprite_overflow = 0;
        this.io.irq_frame_pending = 0;
        this.io.irq_line_pending = 0;

        this.update_irqs();
        return val;
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
                this.io.irq_reload = val;
                return;
        }
    }

    reset() {
        this.io.line_irq_reload = 255;
        this.clock.hpos = 0;
        this.clock.vpos = 0;
        this.clock.ccounter = 0;
        this.io.sprite_overflow_index = 0x1F;
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
    }

    // Run a cycle yo
    cycle() {
        this.scanline_cycle();
        this.clock.vdp_frame_cycle += this.clock.vdp_divisor;
        this.clock.hpos++;
        if (this.clock.hpos === 342) this.new_scanline();
    }
}