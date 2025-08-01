import {REGION, SMSGG, SMSGG_clock, SMSGG_variants} from "./sms_gg";
import {SMSGG_bus} from "./sms_gg_io";
import {hex2, hex4} from "../../helpers/helpers";

const SMSGG_PALETTE: StaticArray<u8> = [
    0x00, 0x00, 0x08, 0x0C, 0x10, 0x30, 0x01, 0x3C,
    0x02, 0x03, 0x05, 0x0F, 0x04, 0x33, 0x15, 0x3F
]

enum SMSGG_VDP_modes { SMS, GG}

class SMSGG_object {
    x: i32 = 0
    y: i32 = 0xD0;
    pattern: u32 = 0
    color: u32 = 0
}

class SMSGG_VDP_io {
    code: u32 = 0
    video_mode: u32 = 0
    display_enable: u32 = 0
    bg_name_table_address: u32 = 0
    bg_color_table_address: u32 = 0
    bg_pattern_table_address: u32 = 0
    sprite_attr_table_address: u32 = 0
    sprite_pattern_table_address: u32 = 0
    bg_color: u32 = 0
    hscroll: u32 = 0
    vscroll: u32 = 0
    line_irq_reload: u32 = 255

    sprite_overflow_index: u32 = 0
    sprite_collision: u32 = 0
    sprite_overflow: u32 = 0x1F
    sprite_shift: u32 = 0
    sprite_zoom: u32 = 0
    sprite_size: u32 = 0
    left_clip: u32 = 0
    bg_hscroll_lock: u32 = 0
    bg_vscroll_lock: u32 = 0

    irq_frame_pending: u32 = 0
    irq_frame_enabled: u32 = 0
    irq_line_pending: u32 = 0
    irq_line_enabled: u32 = 0

    address: u32 = 0
}

class SMSGG_VDP_latch {
    control: u32 = 0
    vram: u32 = 0
    cram: u32 = 0
    hcounter: u32 = 0
    hscroll: u32 = 0
    vscroll: u32 = 0
}

export class SMSGG_VDP {
    variant: SMSGG_variants
    clock: SMSGG_clock
    bus: SMSGG_bus
    VRAM: StaticArray<u8> = new StaticArray<u8>(16384);
    CRAM: StaticArray<u16> = new StaticArray<u16>(32);

    mode: SMSGG_VDP_modes = SMSGG_VDP_modes.SMS;
    out_buffer: usize

    objects: StaticArray<SMSGG_object> = new StaticArray<SMSGG_object>(12);

    io: SMSGG_VDP_io = new SMSGG_VDP_io();
    latch: SMSGG_VDP_latch = new SMSGG_VDP_latch();

    bg_color: u32 = 0;
    bg_priority: u32 = 0;
    bg_palette: u32 = 0;
    sprite_color: u32 = 0;

    bg_gfx_vlines: u32 = 192;

    doi: u32 = 0;
    bm: u32 = 1

    parent: SMSGG|null = null;

    constructor(variant: SMSGG_variants, clock: SMSGG_clock, bus: SMSGG_bus, out_buffer: usize) {
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;
        this.out_buffer = out_buffer;

        this.bus.vdp = this;
        if (variant === SMSGG_variants.GG) this.bm = 2;

        this.bm = 1;
        switch(variant) {
            case SMSGG_variants.GG:
                this.mode = SMSGG_VDP_modes.GG;
                this.bm = 2;
                break;
        }

        for (let i = 0; i < 12; i++) {
            this.objects[i] = new SMSGG_object();
        }
    }

    sprite_gfx2(): void {
        let hlimit = (8 << (this.io.sprite_zoom + this.io.sprite_size)) - 1;
        let vlimit = hlimit;
        for (let i = 0; i < 8; i++) {
            let o = unchecked(this.objects[i]);
            if (o.y === 0xD0) continue;
            if (<i32>this.clock.hpos < o.x) continue;
            if (<i32>this.clock.hpos > (o.x + hlimit)) continue;

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

    sprite_gfx3(): void {
        let vlines = this.bg_gfx_vlines;
        let hlimit = (8 << this.io.sprite_zoom) - 1;
        let vlimit = (8 << (this.io.sprite_zoom + this.io.sprite_size)) - 1;
        for (let i = 0; i < 8; i++) {
            let o = this.objects[i];
            if (o.y === 0xD0) continue;
            if ((<i32>this.clock.hpos < o.x) || (<i32>this.clock.hpos > (o.x + hlimit))) continue;

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

    dac_palette(index: u32): u16 {
        if (this.variant !== SMSGG_variants.GG) {
            if (!(this.io.video_mode & 8)) return unchecked(SMSGG_PALETTE[index & 0x0F]);
            return unchecked(this.CRAM[index]) & 0x3F;
        }
        if (this.mode === SMSGG_VDP_modes.SMS) {
            let color = unchecked(this.CRAM[index]);
            if (!(this.io.video_mode & 8)) color = unchecked(SMSGG_PALETTE[index & 0x0F]);
            let r = (color & 3) | ((color & 3) << 2);
            let g = ((color & 0x0C) >>> 2) | (color & 0x0C);
            let b = ((color & 0x30) >>> 4) | (color & 0x30) >>> 2;
            return r | (g << 4) | (b << 8);
        }
        if (this.mode === SMSGG_VDP_modes.GG) {
            if (!(this.io.video_mode & 8)) {
                let color = unchecked(SMSGG_PALETTE[index & 7]);
                let r = (color & 3) | ((color & 3) << 2);
                let g = ((color & 0x0C) >>> 2) | (color & 0x0C);
                let b = ((color & 0x30) >>> 4) | (color & 0x30) >>> 2;
                return r | (g << 4) | (b << 8);
            }
            return unchecked(this.CRAM[index]);
        }
        return 0;
    }

    // Run a cycle of TMS chip simple-ish graphics
    bg_gfx1(): void {
        let nta = ((this.clock.hpos >>> 3) & 0x1F) | ((this.clock.vpos  << 2) & 0x3E0) | (this.io.bg_name_table_address << 10);
        let pattern = this.VRAM[nta];

        let paddr = (this.clock.vpos & 7) | (pattern << 3) | (this.io.bg_pattern_table_address << 11);

        let caddr = ((paddr >>> 3) & 0x1F) | (this.io.bg_color_table_address << 6);

        let color = <u32>unchecked(this.VRAM[caddr]);
        let index = this.clock.hpos ^ 7;
        if ((<u32>unchecked(this.VRAM[paddr]) & (1 << index)) === 0)
            this.bg_color = color & 0x0F;
        else
            this.bg_color = (color >>> 4) & 0x0F;
    }

    bg_gfx2(): void {
        let nta = ((this.clock.hpos >>> 3) & 0x1F) | ((this.clock.vpos  << 2) & 0x3E0) | (this.io.bg_name_table_address << 10);
        let pattern = <u32>unchecked(this.VRAM[nta]);

        let paddr = (this.clock.vpos & 7) | (pattern << 3);
        if (this.clock.vpos >= 64 && this.clock.vpos <= 127) paddr |= (this.io.bg_pattern_table_address & 1) << 11;
        if (this.clock.vpos >= 128 && this.clock.vpos <= 191) paddr |= (this.io.bg_pattern_table_address & 2) << 11;

        let caddr = paddr;
        paddr |= (this.io.bg_pattern_table_address & 4) << 11;
        caddr |= (this.io.bg_color_table_address & 0x80) << 4;

        let cmask = ((this.io.bg_color_table_address & 0x7F) << 1) | 1;
        let color = <u32>unchecked(this.VRAM[caddr]);
        let index = this.clock.hpos ^ 7;
        if (!(<u32>unchecked(this.VRAM[paddr]) & (1 << index)))
            this.bg_color = color & 0x0F;
        else
            this.bg_color = (color >>> 4) & 0x0F;
    }

    bg_gfx3(): void {
        let hpos = this.clock.hpos;
        let vpos = this.clock.vpos;

        if (hpos < (<i32>this.latch.hscroll & 7)) {
            this.bg_color = 0;
            return;
        }

        if ((!this.io.bg_hscroll_lock) || (vpos >= 16)) hpos -= <i32>this.latch.hscroll;
        if ((!this.io.bg_vscroll_lock) || (hpos <= 191)) vpos += <i32>this.latch.vscroll;
        hpos &= 0xFF;
        vpos &= 0x1FF;

        let nta: u32;
        if (this.bg_gfx_vlines === 192) {
            vpos = vpos % 224;
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

        let pattern = <u32>unchecked(this.VRAM[nta]) | (<u32>unchecked(this.VRAM[nta | 1]  << 8));
        if (pattern & 0x200) hpos ^= 7;
        if (pattern & 0x400) vpos ^= 7;
        let palette = (pattern & 0x800) >>> 11;
        let priority = (pattern & 0x1000) >>> 12;

        let pta = (vpos & 7) << 2;
        pta |= (pattern & 0x1FF) << 5;

        let index = (hpos & 7) ^ 7;
        let bmask = (1 << index);
        let color: u32 = (<u32>unchecked(this.VRAM[pta]) & bmask) ? 1 : 0;
        color += (<u32>unchecked(this.VRAM[pta | 1]) & bmask) ? 2 : 0;
        color += (<u32>unchecked(this.VRAM[pta | 2]) & bmask) ? 4 : 0;
        color += (<u32>unchecked(this.VRAM[pta | 3]) & bmask) ? 8 : 0;

        if (color === 0) priority = 0;
        this.bg_color = color;
        this.bg_priority = priority;
        this.bg_palette = palette;
    }

    pprint_sprites(): void {
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
                console.log('SPRITE #' + i.toString() + ' X/Y ' + x.toString() + ' ' + y.toString() + ' PATTERN ' + hex2(pattern));
            }
        }
    }

    sprite_setup(): void {
        let valid = 0;
        let vlimit = (8 << (this.io.sprite_zoom + this.io.sprite_size)) - 1;
        for (let i = 0; i < 8; i++) unchecked(this.objects[i].y = 0xD0);

        let vpos = this.clock.vpos;

        let attr_addr: u32;
        if (!(this.io.video_mode & 8)) {
            attr_addr = this.io.sprite_attr_table_address << 7;
            for (let index = 0; index < 32; index++) {
                let y = <u32>unchecked(this.VRAM[attr_addr++]);
                if (y === 0xD0) break;
                if (y >= 0xE0) y = (y - 0xFF) & 0x1FF;
                if ((vpos < <i32>y) || (vpos > <i32>(y + vlimit))) {
                    attr_addr += 3;
                    continue;
                }

                let x = <u32>unchecked(this.VRAM[attr_addr++]);
                let pattern = <u32>unchecked(this.VRAM[attr_addr++]);
                let extra = <u32>unchecked(this.VRAM[attr_addr++]);

                if (extra & 0x80) x -= 32;

                if (vlimit === (this.io.sprite_zoom ? 31 : 15)) pattern &= 0xFC;

                if (valid === 4) {
                    this.io.sprite_overflow = 1;
                    this.io.sprite_overflow_index = index;
                    break;
                }

                unchecked(this.objects[valid].x = x);
                unchecked(this.objects[valid].y = y);
                unchecked(this.objects[valid].pattern = pattern);
                unchecked(this.objects[valid].color = extra & 7);
                valid++;
            }
        } else {
            attr_addr = (this.io.sprite_attr_table_address & 0x7E) << 7;
            for (let index = 0; index < 64; index++) {
                let y = <u32>unchecked(this.VRAM[attr_addr + index]) + 1;
                if ((this.bg_gfx_vlines === 192) && (y === 0xD1)) break;
                if (y >= 0xF1) y = (y - 0xFF) & 0x1FF;
                if ((vpos < <i32>y) || (vpos > <i32>(y + vlimit))) continue;

                let x = <u32>unchecked(this.VRAM[attr_addr + 0x80 + (index << 1)]);
                let pattern = <u32>unchecked(this.VRAM[attr_addr + 0x81 + (index << 1)]);

                if (this.io.sprite_shift) x = (x - 8) & 0xFF;
                if (vlimit === (this.io.sprite_zoom ? 31 : 15)) pattern &= 0xFE;

                if (valid === 8) {
                    this.io.sprite_overflow = 1;
                    this.io.sprite_overflow_index = index;
                    break;
                }
                unchecked(this.objects[valid].x = x);
                unchecked(this.objects[valid].y = y);
                unchecked(this.objects[valid].pattern = pattern);
                valid++;
            }
        }
    }

    dac_gfx(): void {
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

        if (this.mode === SMSGG_VDP_modes.GG)
            store<u16>(this.out_buffer+(this.doi*this.bm), color); // color
        else
            store<u8>(this.out_buffer+(this.doi*this.bm), <u8>color);
        this.doi++;
    }

    // Do a cycle on scanlines 192-, 224-, or 240-262 or 312
    scanline_invisible(): void {
        // Literally do nothing bro
    }

    bg_gfx(): void {
        switch(this.io.video_mode) {
            case 0:
                this.bg_gfx1();
                return;
            case 2:
                this.bg_gfx2();
                return;
            case 8:
                this.bg_gfx3();
                return;
            case 10:
                this.bg_gfx3();
                return;
            case 11:
                this.bg_gfx3();
                return;
            case 12:
                this.bg_gfx3();
                return;
            case 14:
                this.bg_gfx3();
                return;
            case 15:
                this.bg_gfx3();
                return;
        }
        unreachable();
        console.log('HOW!? ' + this.io.video_mode.toString());
    }

    sprite_gfx(): void {
        switch(this.io.video_mode) {
            case 0:
                this.sprite_gfx2();
                return;
            case 2:
                this.sprite_gfx2();
                return;
            case 8:
                this.sprite_gfx3();
                return;
            case 10:
                this.sprite_gfx3();
                return;
            case 11:
                this.sprite_gfx3();
                return;
            case 12:
                this.sprite_gfx3();
                return;
            case 14:
                this.sprite_gfx3();
                return;
            case 15:
                this.sprite_gfx3();
                return;
        }
        unreachable();
        console.log('HOW2!? ' + this.io.video_mode.toString());
    }

    // Do a cycle on scanlines 0-191, 223, or 239
    scanline_visible(): void {
        // Scanlines 0-191, or 223, or 239, depending.
        this.bg_color = this.bg_priority = this.bg_palette = 0;
        this.sprite_color = 0;
        if (this.clock.hpos === 0) {
            this.latch.hscroll = this.io.hscroll;
            this.latch.vscroll = this.io.vscroll;

            this.sprite_setup();
            this.doi = (this.clock.vpos * 256);
            if (this.clock.vpos > 256) console.log('WHAT! ' + this.clock.vpos.toString());
        }
        if ((this.clock.hpos < 256) && (this.clock.vpos < <i32>this.clock.timing.frame_lines)) {
            this.bg_gfx();
            this.sprite_gfx();
            this.dac_gfx();
        }
    }

    new_scanline(): void {
        this.clock.hpos = 0;
        this.clock.vpos++;
        if (this.clock.vpos === this.clock.timing.frame_lines) {
            this.new_frame();
        }

        if (this.clock.vpos < <i32>this.clock.timing.rendered_lines) {
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

        if (this.clock.vpos < <i32>this.clock.timing.cc_line)
            this.clock.ccounter = (this.clock.ccounter + 1) & 0xFFF;
    }

    scanline_cycle(): void {
        // TODO: maybe here
        if (this.clock.vpos < <i32>this.clock.timing.rendered_lines)
            this.scanline_visible();
        else
            this.scanline_invisible();
    }

    new_frame(): void {
        this.clock.frames_since_restart++;
        this.clock.vpos = 0;
        this.clock.vdp_frame_cycle = 0;
    }

    read_vcounter(): u32 {
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
    read_hcounter(): u32 {
        let hcounter = this.latch.hcounter;
        if (hcounter >= 592) hcounter += 340;
        return hcounter >>> 2;
    }

    latch_hcounter(): void {
        this.latch.hcounter = this.clock.hpos * this.clock.vdp_divisor;
    }

    read_data(): u32 {
        this.latch.control = 0;
        let r = this.latch.vram;
        this.latch.vram = <u32>unchecked(this.VRAM[this.io.address & 0x3FFF]);
        this.io.address = (this.io.address + 1) & 0x3FFF;
        return r;
    }

    write_data(val: u32): void {
        this.latch.control = 0;
        this.latch.vram = val;
        if (this.io.code <= 2) {
            unchecked(this.VRAM[this.io.address] = <u8>val);
        }
        else {
            if (this.mode === SMSGG_VDP_modes.GG) {
                // even writes store 8-bit data into latch
                // odd writes store 12-bits into CRAM
                if ((this.io.address & 1) === 0)
                    this.latch.cram = val;
                else {
                    unchecked(this.CRAM[(this.io.address >>> 1) & 31] = <u16>(((val & 0x0F) << 8) | this.latch.cram));
                }

            }
            else {
                // 6 bits for SMS
                unchecked(this.CRAM[this.io.address & 31] = <u16>val & 0x3F);
            }
        }
        this.io.address = (this.io.address + 1) & 0x3FFF;
    }

    write_control(val: u32): void {
        if (this.latch.control === 0) {
            this.latch.control = 1;
            this.io.address = (this.io.address & 0xFF00) | (val & 0xFF);
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

    update_irqs(): void {
        let level: u32 = 0;
        if (this.io.irq_frame_pending && this.io.irq_frame_enabled) {
            level = 1;
        }
        if (this.io.irq_line_pending && this.io.irq_line_enabled) {
            level = 1;
            //this.io.irq_line_pending = 0;
        }
        //if (level === 1) console.log('NOTIFY AT', this.clock.vpos, this.clock.hpos);
        this.parent!.cpu.notify_IRQ(level === 1);
    }

    read_status(): u32 {
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

    update_videomode(): void {
        let bottom_row: u32 = 192;
        if (this.clock.variant === SMSGG_variants.SMS1) bottom_row = 192;
        else {
            if (this.io.video_mode === 0x0B) bottom_row = 224;
            if (this.io.video_mode === 0x0E) bottom_row = 240;
        }

        this.clock.timing.bottom_rendered_line = bottom_row - 1;
        this.clock.timing.vblank_start = bottom_row;
        this.clock.timing.rendered_lines = bottom_row;
    }

    register_write(addr: u32, val: u32): void {
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
                //this.io.irq_frame_pending &= this.io.irq_frame_enabled;
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

    reset(): void {
        this.io.line_irq_reload = 255;
        this.clock.hpos = 0;
        this.clock.vpos = 0;
        this.clock.ccounter = 0;
        this.io.sprite_overflow_index = 0x1F;
        this.clock.frames_since_restart = 0;
        for (let i = 0; i < 8; i++) {
            this.objects[i].y = 0xD0;
        }
        for (let i = 0; i < this.VRAM.length; i++) {
            this.VRAM[i] = 0;
        }
        for (let i = 0; i < this.CRAM.length; i++) {
            this.CRAM[i] = 0;
        }
        this.update_videomode()
    }

    // Run a cycle yo
    cycle(): void {
        this.scanline_cycle();
        this.clock.vdp_frame_cycle += <u32>this.clock.vdp_divisor;
        this.clock.hpos++;
        if (this.clock.hpos === 342) this.new_scanline();
    }

    dump_palette(): void {
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
