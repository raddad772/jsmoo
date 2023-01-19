"use strict";

importScripts('/helpers/thread_common.js');
importScripts('/helpers.js');


const GPUSTAT = 0;
const GPUPLAYING = 1;
const GPUQUIT = 2;
const GPUGP1 = 3;
const GPUREAD = 4;
const LASTUSED = 23;

const DBG_GP0 = false;
const LOG_GFX = true
const LOG_GP0 = true && LOG_GFX
const LOG_GP1 = false && LOG_GFX
const LOG_DRAW_TRIS = true && LOG_GP0
const LOG_DRAW_QUADS = true && LOG_GP0

class vertex3 {
    constructor() {
        this.x = this.y = this.z = 0;
        this.r = this.g = this.b = 0;
        this.u = this.v = 0;
    }

    v2_from_cmd(cmd) {
        this.x = ((cmd & 0xFFFF) << 16) >> 16;
        this.y = cmd >> 16;
    }

    c24_from_cmd(cmd) {
        this.r = cmd & 0xFF;
        this.g = (cmd >>> 8) & 0xFF;
        this.b = (cmd >>> 16) & 0xFF;
    }

    uv_from_cmd(cmd) {
        this.u = cmd & 0xFF;
        this.v = (cmd >>> 8) & 0xFF;
    }

    copy_all(from) {
        this.x = from.x;
        this.y = from.y;
        this.z = from.z;
        this.r = from.r;
        this.g = from.g;
        this.b = from.b;
    }
}

class color_sampler {
    constructor() {
        this.r_start = this.g_start = this.b_start = 0;
        this.r = this.g = this.b = 0;
        this.r_end = this.g_end = this.b_end = 0;
    }

    fromrgb24(rgb) {
        this.r = this.r_start = (rgb & 0xFF);
        this.g = this.g_start = (rgb >> 8) & 0xFF;
        this.b = this.b_start = (rgb >> 16) & 0xFF;
    }
}

class texture_sampler {
    /**
     * @param {Number} page_x
     * @param {Number} page_y
     * @param {Number }clut
     * @param {PS1_GPU_thread} ctrl
     */
    constructor(page_x, page_y, clut, ctrl) {
        this.func2 = null;
        page_x = (page_x & 0x0F) * 64;
        page_y = (page_y & 1) * 256;
        this.base_addr = (page_y * 2048) + (page_x*2);
        let clx = (clut & 0x3F) * 16;
        let cly = (clut >>> 6) & 0x1FF;
        this.clut_addr = (2048*cly)+(2*clx);
        this.ctrl = ctrl;
    }

    func(ts, u, v) {
        // Texcoord = (Texcoord AND (NOT (Mask*8))) OR ((Offset AND Mask)*8)
        u = (u & (~(ctrl.tx_win_x_mask * 8)));
        u |= ((u & ctrl.tx_win_x_offset) * 8)
        v = (v & (~(ctrl.tx.tx_win_y_mask * 8)))
        v |= ((v & ctrl.tx_win_y_offset) * 8);
        return this.func2(ts, u, v);
    }

    clut_lookup(vram, d) {
        return vram.getUint8(this.clut_addr+(d*2));
    }
}

function set_bit(w, bitnum, val) {
    if (val)
        w |= (1 << bitnum);
    else
        w |= ((1 << bitnum) ^ 0xFFFFFFFF);
}

const bmask = [0b1 ^ 0xFFFFFFFF, 0b11 ^ 0xFFFFFFFF,
    0b111 ^ 0xFFFFFFFF, 0b1111 ^ 0xFFFFFFFF,
    0b11111 ^ 0xFFFFFFFF, 0b111111 ^ 0xFFFFFFFF,
    0b1111111 ^ 0xFFFFFFFF, 0b11111111 ^ 0xFFFFFFFF];

function set_bits(w, bitlo, bithi, val) {
    return ((bmask[bithi - bitlo] << bitlo) & w) | (val << bitlo);
}

function BGR24to15(c) {
    return (((c >>> 19) & 0x1F) << 10) |
           (((c >>> 11) & 0x1F) << 5) |
           ((c >>> 3) & 0x1F);
}

const PS1e = Object.freeze({
    T4bit: 0,
    T8bit: 1,
    T15bit: 2,

    // Top/odd lines
    Top: 1,
    // Bottom/even lines
    Bottom: 0,

    Y240Lines: 0,
    Y480Lines: 1,

    NTSC: 0,
    PAL: 1,

    // Display bitdepth
    D15bits: 0,
    D24bits: 1,

    DMAoff: 0,
    DMAFIFO: 1,
    DMACpuToGp0: 2,
    DMAVramToCPU: 3
});

class PS1_hres {
    constructor() {
        this.hr = 0;
    }
    from_fields(hr1, hr2) {
        this.hr = (hr2 & 1) | ((hr1 & 3) << 1);
    }

    into_status() {
        return this.hr << 16;
    }

}

class Vertex2 {
    constructor() {
        this.x = this.y = 0;
        this.u = this.v = 0;
        this.R = this.G = this.B = 0;
    }
}

class PS1_GPU_thread {
    constructor() {
        this.shared_output_buffers = [new SharedArrayBuffer(0), new SharedArrayBuffer(0)];
        this.last_used_buffer = 1;
        this.output = [new Uint8Array(this.shared_output_buffers[0]), new Uint8Array(this.shared_output_buffers[1])];
        this.VRAMb = new ArrayBuffer(1024*1024);
        this.VRAM = new DataView(this.VRAMb);

        this.GPUSTAT = 0;
        this.page_base_x = 0;
        this.page_base_y = 0;
        this.semi_transparency = 0;
        this.texture_depth = PS1e.T4bit;
        this.dithering = 0; // dither 24 to 15 bits
        this.draw_to_display = 0; // allow drawing to display area
        this.force_set_mask_bit = 0; // force "mask" bit of pixel to 1 when writing to VRAM
        this.preserve_masked_pixels = 0; // don't draw over pixels with "mask" bit set
        this.field = PS1e.Top; // progressive output is always top
        this.texture_disable = 0; // textures disable when 1
        this.hres = new PS1_hres();
        this.vres = PS1e.Y240Lines;
        this.vmode = PS1e.NTSC;
        this.display_depth = PS1e.D15bits; // GPU is always 15 bits. 24 bits requires external resources
        this.interlaced = 0;
        this.display_disabled = 0;
        this.interrupt = 0; // interrupt status
        this.dma_direction = PS1e.DMAoff;

        this.color1 = new color_sampler();
        this.color2 = new color_sampler();
        this.color3 = new color_sampler();

        this.v0 = new vertex3();
        this.v1 = new vertex3();
        this.v2 = new vertex3();
        this.v3 = new vertex3();
        this.v4 = new vertex3();
        this.v5 = new vertex3();

        this.t0 = new vertex3();
        this.t1 = new vertex3();
        this.t2 = new vertex3();
        this.t3 = new vertex3();
        this.t4 = new vertex3();

        this.load_buffer = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            img_x: 0,
            img_y: 0,
            line_ptr: 0
        }

        this.polygon = {
            shading: 0, // 0 is flat, 1 is goraud
            vertices: 3, // either 3 or 4
            textured: 0, // textured or not
            transparent: 0, // transparent or not
            raw_texture: 0, // raw texture=1, "modulation"=0
            rgb: 0,
            num_cmds: 0,
            clut: 0,
            tx_page: 0,
            vert: [new Vertex2(), new Vertex2(), new Vertex2(), new Vertex2()]
        }
        this.vert = [new Vertex2(), new Vertex2(), new Vertex2(), new Vertex2()]

        // FIFO
        // 16 32-bit words,
        // head and tail
        // so lets put 24 32-bit words

        // 0-15 = slots 1-16
        // 16 = head
        // 17 = length
        // 18 = lock
        this.GP0_FIFO = new MT_FIFO16();
        this.GP1_FIFO = new MT_FIFO16();

        this.cur_gp0 = null;
        this.cur_gp0_tag = -2;
        this.cur_gp1 = null;
        this.cur_gp1_tag = -2;
        this.GPU_FIFO_tag = 0;

        this.MMIO_sb = new SharedArrayBuffer(96);
        this.MMIO = new Uint32Array(this.MMIO_sb);

        this.current_ins = null;
        this.cmd_arg_index = 0;
        this.cmd_arg_num = 0;
        this.gp0_transfer_remaining = 0; // for transfers to/from GPU
        this.cmd = new Uint32Array(16); // Up to 16 args because why not
        this.handle_gp0 = this.gp0.bind(this);
    }

    GPUSTAT_update() {
        let o = this.page_base_x;
        o |= (this.page_base_y) << 4;
        o |= (this.semi_transparency) << 5;
        o |= (this.texture_depth) << 7;
        o |= (this.dithering) << 9;
        o |= (this.draw_to_display) << 10;
        o |= (this.force_set_mask_bit) << 11;
        o |= (this.preserve_masked_pixels) << 12;
        o |= (this.field) << 14;
        o |= (this.texture_disable) << 15;
        o |= this.hres.into_status();
        o |= this.vres << 19;
        o |= this.vmode << 20;
        o |= this.display_depth << 21;
        o |= this.interlaced << 22;
        o |= this.display_disabled << 23;
        // interrupt is set at other end where they are scheduled

        o |= this.dma_direction << 29;

        let dmar;
        switch(this.dma_direction) {
            // 0 if FIFO full, 1 otherwise
            case PS1e.DMAoff:
                dmar = 0;
                break;
            case PS1e.DMAFIFO:
                dmar = 0; // set during read on other side
                break;
            case PS1e.DMACpuToGp0:
                dmar = (o >>> 28) & 1;
                break;
            case PS1e.DMAVramToCPU:
                dmar = (o >>> 27) & 1;
                break;
        }

        o |= (dmar << 25);

        // Preserve GPU ready or not bits
        this.GPUSTAT = o | (this.MMIO[this.MMIO_offset+GPUSTAT] & 0x1C000000);
        //console.log('RENDER SETTING GPUSTAT ' + hex8(this.GPUSTAT));
        this.MMIO[this.MMIO_offset+GPUSTAT] = this.GPUSTAT;
    }

    ready_cmd() {
        this.GPUSTAT |= 0x4000000;
    }

    unready_cmd() {
        this.GPUSTAT &= 0xFBFFFFFF;
    }

    ready_vram_to_CPU() {
        this.GPUSTAT |= 0x8000000;
    }

    unready_vram_to_CPU() {
        this.GPUSTAT &= 0xF7FFFFFF;
    }

    ready_recv_DMA() {
        this.GPUSTAT |= 0x10000000;
    }

    unready_recv_DMA() {
        this.GPUSTAT &= 0xEFFFFFFF;
    }

    msg_startup(e) {
        //this.shared_output_buffers[0] = e.output_buffer0;
        //this.shared_output_buffers[1] = e.output_buffer1;
        //this.output[0] = new Uint8Array(this.shared_output_buffers[0]);
        //this.output[1] = new Uint8Array(this.shared_output_buffers[1]);
        this.GP0FIFO_sb = e.GP0FIFO;
        this.GP1FIFO_sb = e.GP1FIFO;
        this.VRAMb = e.VRAM;
        this.MMIO_sb = e.MMIO;
        this.GP0FIFO_offset = e.GP0FIFO_offset;
        this.GP1FIFO_offset = e.GP1FIFO_offset;
        this.MMIO_offset = e.MMIO_offset >>> 2;
        this.VRAM_offset = e.VRAM_offset;
        this.sab = e.SAB;

        this.GP0_FIFO.set_sab(this.sab);
        this.GP1_FIFO.set_sab(this.sab);
        this.GP0_FIFO.set_offset(this.GP0FIFO_offset);
        this.GP1_FIFO.set_offset(this.GP1FIFO_offset);

        this.MMIO = new Uint32Array(this.sab);
        //console.log('VRAM offset:', this.VRAM_offset, this.sab);
        //console.log(typeof this.sab);
        //console.log(e);
        this.VRAM = new DataView(this.sab, this.VRAM_offset);
        //console.log('murdering VRAM ' + this.VRAM_offset.toString());
        for (let i = 0; i < (1024*1024); i+=4) {
            this.VRAM.setUint32(i,0x77777777);
        }

        this.rect = {
            texture_x_flip: 0,
            texture_y_flip: 0
        }

        this.tx_win_x_mask = 0;
        this.tx_win_y_mask = 0;
        this.tx_win_x_offset = 0;
        this.tx_win_y_offset = 0;
        this.draw_area_top = 0;
        this.draw_area_bottom = 0;
        this.draw_area_left = 0;
        this.draw_area_right = 0;
        this.draw_x_offset = 0; // applied to all vertices
        this.draw_y_offset = 0;
        this.display_vram_x_start = 0;
        this.display_vram_y_start = 0;
        this.display_horiz_start = 0x200;
        this.display_horiz_end = 0xC00;
        this.display_line_start = 0x10;
        this.display_line_end = 0x100;

        this.set_last_used_buffer(1);
        this.MMIO[this.MMIO_offset+GPUREAD] = 0;

        this.init_FIFO();
        this.listen_FIFO();
    }

    gp0(cmd) {
        if (DBG_GP0) console.log('GOT CMD', hex8(cmd));
        // if we have an instruction...
        if (this.current_ins !== null) {
            this.cmd[this.cmd_arg_index++] = cmd;
            if (this.cmd_arg_index === this.cmd_arg_num) {
                this.current_ins();
                this.current_ins = null;
                //console.log('EXECUTE', hex8(this.cmd[0]))
            }
        } else {
            // If we don't have one yet...
            this.cmd[0] = cmd;
            this.cmd_arg_index = 1;
            this.ins_special = false;
            this.cmd_arg_num = 1;
            let cmdr = cmd >>> 24;
            //if ((cmdr & 0xA0) === 0xA0) cmdr = 0xA0;
            switch (cmdr) {
                case 0: // NOP
                    if (cmd !== 0) console.log('INTERPRETED AS NOP:', hex8(cmd));
                    break;
                case 0x01: // Clear cache (not implemented)
                    break;
                case 0x02: // Quick Rectangle
                    //console.log('Quick rectangle!');
                    this.current_ins = this.cmd02_quick_rect.bind(this);
                    this.cmd_arg_num = 3;
                    break;
                //case 0x21: // ??
                //    console.log('NOT IMPLEMENT 0x21');
                //    break;
                case 0x28: // flat-shaded rectangle
                    this.current_ins = this.cmd28_draw_flat4untex.bind(this);
                    this.cmd_arg_num = 5;
                    break;
                case 0x2C: // polygon, 4 points, textured, flat
                    this.current_ins = this.cmd2c_quad_opaque_flat_textured.bind(this);
                    this.cmd_arg_num = 9;
                    break;
                case 0x30: // opaque shaded trinalge
                    this.current_ins = this.cmd30_tri_shaded_opaque.bind(this);
                    this.cmd_arg_num = 6;
                    break;
                case 0x38: // polygon, 4 points, gouraud-shaded
                    this.current_ins = this.cmd38_quad_shaded_opaque.bind(this);
                    this.cmd_arg_num = 8;
                    break;
                case 0x60: // Rectangle, variable size, opaque
                    this.current_ins = this.cmd60_rect_opaque_flat.bind(this)
                    this.cmd_arg_num = 3;
                    break;
                case 0x64: // Rectangle, variable size, textured, flat, opaque
                    this.current_ins = this.cmd64_rect_opaque_flat_textured.bind(this)
                    this.cmd_arg_num = 4;
                    break;
                case 0x75: // Rectangle, 8x8, opaque, textured
                    this.current_ins = this.cmd75_rect_opaque_flat_textured.bind(this);
                    this.cmd_arg_num = 3;
                    break;
                case 0xBC:
                case 0xB8:
                case 0xA0: // Image stream to GPU
                    this.current_ins = this.gp0_image_load_start.bind(this);
                    this.cmd_arg_num = 3;
                    break;
                case 0xC0:
                    console.log('WARNING unhandled GP0 command 0xC0');
                    this.cmd_arg_num = 2;
                    this.current_ins = this.gp0_cmd_unhandled.bind(this)
                    break;
                case 0xE1: // GP0 Draw Mode
                    if (DBG_GP0) console.log('GP0 E1 set draw mode');
                    this.page_base_x = cmd & 15;
                    this.page_base_y = (cmd >>> 4) & 1;
                    switch ((cmd >>> 7) & 3) {
                        case 0:
                            this.texture_depth = PS1e.T4bit;
                            break;
                        case 1:
                            this.texture_depth = PS1e.T8bit;
                            break;
                        case 2:
                            this.texture_depth = PS1e.T15bit;
                            break;
                        case 3:
                            console.log('UNHANDLED TEXTAR DEPTH!!!');
                            break;
                    }
                    this.dithering = (cmd >>> 9) & 1;
                    this.draw_to_display = (cmd >>> 10) & 1;
                    this.texture_disable = (cmd >>> 1) & 1;
                    this.GPUSTAT_update();
                    this.rect.texture_x_flip = (cmd >>> 12) & 1;
                    this.rect.texture_y_flip = (cmd >>> 12) & 1;
                    break;
                case 0xE2: // Texture window
                    if (DBG_GP0) console.log('GP0 E2 set draw mode');
                    this.tx_win_x_mask = cmd & 0x1F;
                    this.tx_win_y_mask = (cmd >>> 5) & 0x1F;
                    this.tx_win_x_offset = (cmd >>> 10) & 0x1F;
                    this.tx_win_y_offset = (cmd >>> 15) & 0x1F;
                    break;
                case 0xE3: // Set draw area upper-left corner
                    if (DBG_GP0) console.log('GP0 E3 set draw area UL corner');
                    this.draw_area_top = (cmd >>> 10) & 0x3FF;
                    this.draw_area_left = cmd & 0x3FF;
                    break;
                case 0xE4: // Draw area lower-right corner
                    if (DBG_GP0) console.log('GP0 E4 set draw area LR corner');
                    this.draw_area_bottom = (cmd >>> 10) & 0x3FF;
                    this.draw_area_right = cmd & 0x3FF;
                    break;
                case 0xE5: // Drawing offset
                    if (DBG_GP0) console.log('GP0 E5 set drawing offset');
                    this.draw_x_offset = mksigned11(cmd & 0x7FF);
                    this.draw_y_offset = mksigned11((cmd >>> 11) & 0x7FF);
                    break;
                case 0xE6: // Set Mask Bit setting
                    if (DBG_GP0) console.log('GP0 E6 set bit mask');
                    this.force_set_mask_bit = cmd & 1;
                    this.preserve_masked_pixels = (cmd >>> 1) & 1;
                    break;
                default:
                    console.log('Unknown GP0 command', hex8(cmd >>> 0));
                    break;
            }
        }
    }

    gp1(cmd) {
        //console.log('RECV GP1 cmd', hex8(cmd));
        switch(cmd >>> 24) {
            case 0:
                console.log('GP1 soft reset')
                // Soft reset
                this.unready_cmd();
                this.unready_recv_DMA();
                this.unready_vram_to_CPU();
                this.page_base_x = 0;
                this.page_base_y = 0;
                this.semi_transparency = 0;
                this.texture_depth = PS1e.T4bit;
                this.tx_win_x_mask = this.tx_win_y_mask = 0;
                this.tx_win_x_offset = this.tx_win_y_offset = 0;
                this.dithering = 0;
                this.draw_to_display = 0;
                this.texture_disable = 0;
                this.rect.texture_x_flip = this.rect.texture_y_flip = 0;
                this.draw_area_bottom = this.draw_area_right = this.draw_area_left = this.draw_area_top = 0;
                this.draw_x_offset = this.draw_y_offset = 0;
                this.force_set_mask_bit = 0;
                this.preserve_masked_pixels = 0;
                this.dma_direction = PS1e.DMAoff;
                this.display_disabled = 1;
                this.display_vram_x_start = this.display_vram_y_start = 0;
                this.hres.from_fields(0, 0);
                this.vres = PS1e.Y240Lines;
                this.vmode = PS1e.NTSC;
                this.interlaced = 1;
                this.display_horiz_start = 0x200;
                this.display_horiz_end = 0xC00;
                this.display_line_start = 0x10;
                this.display_line_end = 0x100;
                this.display_depth = PS1e.D15bits;
                //this.clear_FIFO();
                this.GPUSTAT_update();
                this.ready_cmd();
                this.ready_recv_DMA();
                this.ready_vram_to_CPU();

                // TODO: remember to flush GPU texture cache
                break;
            case 0x01: // reset CMD FIFO
                console.log('RESET CMD FIFO NOT IMPLEMENT');
                break;
            case 0x03: // DISPLAY DISABLE
                //TODO: do this
                break;
            case 0x04: // DMA direction
                //console.log('GP1 dma direction', cmd & 3);
                switch(cmd & 3) {
                    case 0:
                        this.dma_direction = PS1e.DMAoff;
                        break;
                    case 1:
                        this.dma_direction = PS1e.DMAFIFO;
                        break;
                    case 2:
                        this.dma_direction = PS1e.DMACpuToGp0;
                        break;
                    case 3:
                        this.dma_direction = PS1e.DMAVramToCPU;
                        break;
                }
                this.GPUSTAT_update();
                break;
            case 0x05: // VRAM start
                //console.log('GP1 VRAM start');
                this.display_vram_x_start = cmd & 0x3FE;
                this.display_vram_y_start = (cmd >>> 10) & 0x1FF;
                break;
            case 0x06: // Display horizontal range, in output coordinates
                this.display_horiz_start = cmd & 0xFFF;
                this.display_horiz_end = (cmd >>> 12) & 0xFFF;
                break;
            case 0x07: // Display vertical range, in output coordinates
                this.display_line_start = cmd & 0x3FF;
                this.display_line_end = (cmd >>> 10) & 0x3FF;
                break;
            case 0x08: // Display mode
                //console.log('GP1 display mode');
                this.hres.from_fields((cmd & 3), (( cmd >>> 6) & 1));
                this.vres = (cmd & 4) ? PS1e.Y480Lines : PS1e.Y240Lines;
                this.vmode = (cmd & 8) ? PS1e.PAL : PS1e.NSTC;
                this.display_depth = (cmd & 16) ? PS1e.D15bits : PS1e.D24bits;
                this.interlaced = (cmd >>> 5) & 1;
                if ((cmd & 0x80) !== 0) {
                    console.log('Unsupported display mode!')
                }
                break;
            default:
                console.log('Unknown GP1 command', hex8(cmd));
                break;
        }
    }

    ready_all() {
        this.ready_cmd();
        this.ready_recv_DMA();
        this.ready_vram_to_CPU();
    }

    unready_all() {
        this.unready_cmd();
        this.unready_recv_DMA();
        this.unready_vram_to_CPU();
    }

    cmd02_quick_rect() {
        // GP0 quick rect!!!
       this.unready_all();

        let ysize = (this.cmd[2] >>> 16) & 0xFFFF;
        let xsize = (this.cmd[2]) & 0xFFFF;
        let BGR = BGR24to15(this.cmd[0] & 0xFFFFFF);
        let start_y = (this.cmd[1] >>> 16) & 0xFFFF;
        let start_x = (this.cmd[1]) & 0xFFFF;
        if (LOG_DRAW_QUADS) console.log('QUICKRECT! COLOR', hex4(BGR), 'X Y', start_x, start_y, 'SZ X SZ Y', xsize, ysize);
        for (let y = start_y; y < (start_y+ysize); y++) {
            for (let x = start_x; x < (start_x + xsize); x++) {
                //this.setpix(y, x, BGR);
                let addr = (2048*y)+(x*2);
                this.VRAM.setUint16(addr, BGR, true);
            }
        }

        this.ready_all();
    }

    setpix(y, x, color, transparent=false) {
        // VRAM is 512 1024-wide 16-bit words. so 2048 bytes per line
        let ry = (y & 511) + this.draw_y_offset;
        let rx = (x & 1023) + this.draw_x_offset;
        if ((ry < this.draw_area_top) || (ry > this.draw_area_bottom)) return;
        if ((rx < this.draw_area_left) || (rx > this.draw_area_right)) return;
        let addr = (2048*ry)+(rx*2);
        this.VRAM.setUint16(addr, color, true);
    }

    init_FIFO() {
        this.ready_cmd();
        this.ready_vram_to_CPU();
        this.ready_recv_DMA();
        // Set "ready for stuff"
        this.MMIO[this.MMIO_offset+GPUSTAT] = this.GPUSTAT;
    }

    clear_FIFO() {
        this.GP0_FIFO.clear()
    }

    listen_FIFO() {
        console.log('Listening to FIFO...');
        this.MMIO[this.MMIO_offset+GPUPLAYING] = 1;
        while(this.MMIO[this.MMIO_offset+GPUPLAYING] === 1) {
            if (this.cur_gp0 === null) {
                this.cur_gp0 = this.GP0_FIFO.get_item();
                this.cur_gp0_tag = this.GP0_FIFO.output_tag;
            }
            if (this.cur_gp1 === null) {
                this.cur_gp1 = this.GP1_FIFO.get_item();
                this.cur_gp1_tag = this.GP1_FIFO.output_tag;
            }
            if ((this.cur_gp0 === null) && (this.cur_gp1 === null))
                continue;
            if ((this.cur_gp0 !== null) && (this.cur_gp0_tag === this.GPU_FIFO_tag)) {
                this.handle_gp0(this.cur_gp0>>>0);
                this.cur_gp0 = null;
                this.GPU_FIFO_tag++;
                continue;
            }
            if ((this.cur_gp1 !== null) && (this.cur_gp1_tag === this.GPU_FIFO_tag)) {
                this.gp1(this.cur_gp1>>>0);
                this.cur_gp1 = null;
                this.GPU_FIFO_tag++;
                continue;
            }
            console.log('DESYNC ERROR!', this.cur_gp0, this.cur_gp0_tag, this.cur_gp1, this.cur_gp1_tag);
            return;
        }
        console.log('FIFO no more listen...')
        if (this.MMIO[this.MMIO_offset+GPUPLAYING] === 0) {
            console.log('PAUSE receieved!');
            return;
        }
        console.log('UNKNOWN QUIT REASON?');
    }

    set_last_used_buffer(which) {
        this.MMIO[this.MMIO_offset+LASTUSED] = which;
    }

    onmessage(e) {
        //console.log('GPU got message', e, e.kind);
        switch(e.kind) {
            case GPU_messages.startup:
                this.msg_startup(e);
                break;
            case GPU_messages.play:
                //this.listen_FIFO();
                break;
        }
    }

    lr_draw_flat_shaded_triangle(v0, v1, v2) {
        // Sort left-to-right. Leftmost vertex is

        // Find left triangle slope
        /*let dx = x1 - x0
        dy = y1 - y0
        D = 2*dy - dx
        y = y0

        for x from x0 to x1
            plot(x, y)
            if D > 0
                y = y + 1
                D = D - 2*dx
            end if
            D = D + 2*dy
         */
    }

    draw_flat_shaded_triangle(v1, v2, v3) {
        if (LOG_DRAW_TRIS) console.log('shaded v1', v1.x, v1.y, 'v2', v2.x, v2.y, 'v3', v3.x, v3.y);
        let draw_line = function(y, x1, x2, r1, r2, g1, g2, b1, b2, setpix) {
            x1 >>= 0;
            x2 >>= 0;
            if (x1 > x2) {
                let a = x1;
                let b = r1;
                let c = g1;
                let d = b1;
                x1 = x2;
                r1 = r2;
                g1 = g2;
                b1 = b2;
                x2 = a;
                r2 = b;
                g2 = c;
                b2 = d;
            }
            let r = 1 / (x2 - x1);
            let rd = (r2 - r1) * r;
            let gd = (g2 - g1) * r;
            let bd = (b2 - b1) * r;

            for (let x = x1; x < x2; x++) {
                setpix(y, x, ((r1 & 31)) | ((g1 & 31) << 5) | ((b1 & 31) << 10));
                r1 += rd;
                g1 += gd;
                b1 += bd;
            }
            console.log('shaded done');
        }

        let fill_bottom = function(v1, v2, v3, draw_line, setpix) {
            // fill flat-bottom triangle
            //console.log('YS!', v1.y, v2.y, v3.y)
            let recip = 1 / (v2.y - v1.y);
            let islop1 = (v2.x - v1.x) * recip;
            let rslop1 = (v2.r - v1.r) * recip;
            let gslop1 = (v2.g - v1.g) * recip;
            let bslop1 = (v2.b - v1.b) * recip;

            recip = 1 / (v3.y - v1.y);
            let islop2 = (v3.x - v1.x) * recip;
            let rslop2 = (v3.r - v1.r) * recip;
            let gslop2 = (v3.g - v1.g) * recip;
            let bslop2 = (v3.b - v1.b) * recip;

            let cx1 = v1.x
            let cx2 = v1.x
            let cr1 = v1.r;
            let cr2 = v1.r;
            let cg1 = v1.g;
            let cg2 = v1.g;
            let cb1 = v1.b;
            let cb2 = v1.b;

            for (let y = v1.y; y <= v2.y; y++) {
                draw_line(y, cx1, cx2, (cr1 >>> 3), (cr2 >>> 3), (cg1 >>> 3), (cg2 >>> 3), (cb1 >>> 3), (cb2 >>> 3), setpix)
                cx1 += islop1;
                cx2 += islop2;
                cr1 += rslop1;
                cr2 += rslop2;
                cg1 += gslop1;
                cg2 += gslop2;
                cb1 += bslop1;
                cb2 += bslop2;
            }
        }

        let fill_top = function(v1, v2, v3, draw_line, setpix) {
            // fill flat-top triangle
            //     v2.     .v1
            //    /  _____/
            //  /_____/
            // v3
            //
            let r1 = 1 / (v3.y - v1.y);
            let r2 = 1 / (v3.y - v2.y)

            let islop1 = (v3.x - v1.x) * r1;
            let rslop1 = (v3.r - v1.r) * r1;
            let gslop1 = (v3.g - v1.g) * r1;
            let bslop1 = (v3.b - v1.b) * r1;

            let islop2 = (v3.x - v2.x) * r2;
            let rslop2 = (v3.r - v2.r) * r2;
            let gslop2 = (v3.g - v2.g) * r2;
            let bslop2 = (v3.b - v2.b) * r2;

            let cr1 = v3.r;
            let cr2 = v3.r;
            let cg1 = v3.g;
            let cg2 = v3.g;
            let cb1 = v3.b;
            let cb2 = v3.b;

            let cx1 = v3.x;
            let cx2 = v3.x;
            for (let y = v3.y; y > v1.y; y--) {
                draw_line(y, cx1, cx2, (cr1 >>> 3), (cr2 >>> 3), (cg1 >>> 3), (cg2 >>> 3), (cb1 >>> 3), (cb2 >>> 3), setpix)

                cx1 -= islop1;
                cx2 -= islop2;
                cr1 -= rslop1;
                cr2 -= rslop2;
                cg1 -= gslop1;
                cg2 -= gslop2;
                cb1 -= bslop1;
                cb2 -= bslop2;
            }
        }
        // I think? the PS1 uses render top/bottom separately algorithm. so....let's do that
        // first sort points
        let a;
        if (v2.y > v3.y) {
            a = v2;
            v2 = v3;
            v3 = a;
        }

        if (v1.y > v2.y) {
            a = v1;
            v1 = v2;
            v2 = a;
        }

        if (v2.y > v3.y) {
            a = v2;
            v2 = v3;
            v3 = a;
        }

        // Trivial case 1
        if (v1.y === v3.y) {
            fill_bottom(v1, v2, v3, draw_line, this.setpix.bind(this));
        }
        else if (v1.y === v2.y) { // trivial case 2
            fill_top(v1, v2, v3, draw_line, this.setpix.bind(this));
        } // other cases
        else {
            let v4 = this.v4;
            v4.y = v2.y;
            // Now calculate G and B
            let c = ((v2.y - v1.y) / (v3.y - v1.y));

            v4.x = v1.x + c * (v3.x - v1.x);
            v4.r = v1.r + c * (v3.r - v1.r);
            v4.g = v1.g + c * (v3.g - v1.g);
            v4.b = v1.b + c * (v3.b - v1.b);

            // v3.b - v1.b is the gradient between v1 and 3
            // v1.b + sets us up to

            /*console.log('POINTS:')
            console.log('v1', v1.x, v1.y, 'RGB', v1.r, v1.g, v1.b)
            console.log('v2', v2.x, v2.y, 'RGB', v2.r, v2.g, v2.b)
            console.log('v3', v3.x, v3.y, 'RGB', v3.r, v3.g, v3.b)
            console.log('v4', v4.x, v4.y, 'RGB', v4.r, v4.g, v4.b)*/
            fill_bottom(v1, v2, v4, draw_line, this.setpix.bind(this));
            fill_top(v2, v4, v3, draw_line, this.setpix.bind(this));
        }
    }

    bad_draw_flat_shaded_triangle(x0, y0, x1, y1, x2, y2, c0, c1, c2) {
        // sort points vertically
        let a, b, c;
        if (y1 > y2) {
            a = x1;
            b = y1;
            c = c1;
            x1 = x2;
            y1 = y2;
            c1 = c2;
            x2 = a;
            y2 = b;
            c2 = c;
        }

        if (y0 > y1) {
            a = x0;
            b = y0;
            c = c0;
            x0 = x1;
            y0 = y1;
            c0 = c1;
            x1 = a;
            y1 = b;
            c1 = c;
        }

        if (y1 > y2) {
            a = x1;
            b = y1;
            c = c1;
            x1 = x2;
            y1 = y2;
            c1 = c2;
            x2 = a;
            y2 = b;
            c2 = c;
        }

        // now that p0 is highest, p1 is middle, p2 lowest
        // look:     p0
        //           .
        //          | \
        //          /  \
        //         |    \
        //        /      \
        //        .__-----`
        //       p1       p2
        // we need two loops, one for the top triangle, one for the
        // bottom.
        // we need to find 3 slopes also.

        //         //        `-----__.

        let r0 = 0;
        let r1 = 31;
        let r2 = 15;

        // find p0...p2 x, rgb-slope
        let rec = 1 / (y2 - y0 + 1)
        let dx_far = (x2 - x0) * rec;
        let r_far = (r2 - r0) * rec;

        // find p0...p1 x-slope
        rec = 1 / (y1 - y0 + 1);
        let dx_upper = (x1 - x0) * rec;
        let r_upper = Math.abs(r1 - r0) * rec;

        // find p1...p2 x-slope
        // aka we're going left 4 pixels for 10 pixels down = .4
        rec = 1 / (y2 - y1 + 1);
        let dx_low = (x2 - x1) * rec;
        let r_low = Math.abs(r2 - r1) * rec;

        let xf = x0;
        let xt = x0 + dx_upper;

        let rf = r0;
        let rt = r0 + r_upper;

        let rd, r;
        for (let y = y0; y <= y2; y++) {
            if (y >= 0) {
                // Top slope
                let xs = (xf > 0 ? xf : 0)
                let xe = xt;
                r = (rf > 0 ? rf : 0);
                //r = rf;
                rd = (rt - r) / (xs - xe);
                for (let x = xs; x <= xe; x++) {
                    this.setpix(y, x, r);
                    r += rd;
                    //if (r > 31) r = 1568;
                }
                // Bottom slope
                /*xs = xf;
                xe = (xt > 0 ? xt : 0);
                r = rf;
                let rl = (rt > 0 ? rt : 0);
                rd = (rl - r) / (xs - xe)
                for (let x = xf; x > (xt > 0 ? xt : 0); x--) {
                    this.setpix(y, x, r);
                    r += rd;
                    if (r > 31) r = 158
                }*/
            }
            xf += dx_far;
            rf += r_far;
            if (y < y1) { // if we're in the upper slope
                xt += dx_upper;
                rt += r_upper;
            }
            else {// if we're in the lower slope
                xt += dx_low;
                rt += r_low;
            }
        }
    }

    draw_flat_triangle(x0, y0, x1, y1, x2, y2, color) {
        // sort points vertically
        let a, b;
        if (y1 > y2) {
            a = x1;
            b = y1;
            x1 = x2;
            y1 = y2;
            x2 = a;
            y2 = b;
        }

        if (y0 > y1) {
            a = x0;
            b = y0;
            x0 = x1;
            y0 = y1;
            x1 = a;
            y1 = b;
        }

        if (y1 > y2) {
            a = x1;
            b = y1;
            x1 = x2;
            y1 = y2;
            x2 = a;
            y2 = b;
        }

        let dx_far = (x2 - x0) / (y2 - y0 + 1);
        let dx_upper = (x1 - x0) / (y1 - y0 + 1);
        let dx_low = (x2 - x1) / (y2 - y1 + 1);
        let xf = x0;
        let xt = x0 + dx_upper;
        for (let y = y0; y <= y2; y++) {
            if (y >= 0) {
                for (let x = (xf > 0 ? xf : 0); x <= xt; x++)
                    this.setpix(y, x, color);
                for (let x = xf; x > (xt > 0 ? xt : 0); x--)
                    this.setpix(y, x, color);
            }
            xf += dx_far;
            if (y < y1)
                xt += dx_upper;
            else
                xt += dx_low;
        }
    }

    gp0_cmd_unhandled() {

    }

    gp0_image_load_start() {
        this.unready_cmd();
        this.ready_recv_DMA();
        let c = this.cmd;
        // Top-left corner in VRAM
        let x = c[1] & 1023;
        let y = (c[1] >>> 16) & 511;

        // Resolution
        let width = c[2] & 0xFFFF;
        let height = (c[2] >>> 16) & 0xFFFF;

        // Get imgsize, round it
        let imgsize = (((width * height) + 1) & 0xFFFFFFFE)>>>0;

        this.gp0_transfer_remaining = imgsize/2;
        if (LOG_GP0) console.log('TRANSFER IMGSIZE', imgsize, 'X Y', x, y, 'WIDTH HEIGHT', width, height, hex8(c[0]));
        if (this.gp0_transfer_remaining > 0) {
            this.load_buffer_reset(x, y, width, height);
            this.handle_gp0 = this.gp0_image_load_continue.bind(this);
        } else {
            console.log('Bad size image load: 0?');
            this.current_ins = -1;
        }
    }

    load_buffer_reset(x, y, width, height) {
        this.load_buffer.x = x;
        this.load_buffer.y = y;
        this.load_buffer.width = width;
        this.load_buffer.height = height;
        this.load_buffer.line_ptr = (y * 2048) + x;
        this.load_buffer.img_x = this.load_buffer.img_y = 0;
    }

    gp0_image_load_continue(cmd) {
        // Put in 2 16-bit pixels
        //console.log('TRANSFERRING!', this.gp0_transfer_remaining);
        for (let i = 0; i < 2; i++) {
            let px = cmd & 0xFFFF;
            cmd >>>= 16;
            let y = this.load_buffer.y+this.load_buffer.img_y;
            let x = this.load_buffer.x+this.load_buffer.img_x;
            let addr = (2048*y)+(x*2);
            //try {
                this.VRAM.setUint16(addr, px, true);
            //} catch(e) {
            //    console.log('WAIT!', y, x, this.load_buffer.width+this.load_buffer.x, addr);
            //}
            //this.setpix(this.load_buffer.y+this.load_buffer.img_y, this.load_buffer.x+this.load_buffer.img_x, px);
            this.load_buffer.img_x++;
            if ((x+1) >= (this.load_buffer.width+this.load_buffer.x)) {
                this.load_buffer.img_x = 0;
                this.load_buffer.img_y++;
            }
        }
        this.gp0_transfer_remaining--;
        if (this.gp0_transfer_remaining === 0) {
            //console.log('TRANSFER COMPLETE!');
            this.current_ins = null;
            this.handle_gp0 = this.gp0.bind(this);
            this.ready_cmd();
            this.unready_recv_DMA()
        }
    }

    cmd60_rect_opaque_flat() {
        let color = BGR24to15(this.cmd[0] & 0xFFFFFF);
        let xstart = this.cmd[1] & 0xFFFF;
        let ystart = this.cmd[1] >>> 16;
        let xsize = this.cmd[2] & 0xFFFF;
        let ysize = this.cmd[2] >>> 16;

        if (LOG_GP0) console.log('60_rect_opaque_flat', xstart, ystart, xsize, ysize, hex6(this.cmd[0] & 0xFFFFFF));

        let xend = (xstart + xsize);
        xend = xend > 1024 ? 1024 : xend;

        let yend = (ystart + ysize);
        yend = yend > 512 ? 512 : yend;

        for (let y = ystart; y < yend; y++) {
            for (let x = xstart; x < xend; x++) {
                this.setpix(y, x, color)
            }
        }
    }

    cmd38_quad_shaded_opaque() {
        // WRIOW GP0,(0x38<<24)+(COLOR1&0xFFFFFF)       ; Write GP0 Command Word (Color1+Command)
        // WRIOW GP0,(Y1<<16)+(X1&0xFFFF)               ; Write GP0  Packet Word (Vertex1)
        // WRIOW GP0,(COLOR2&0xFFFFFF)                  ; Write GP0  Packet Word (Color2)
        // WRIOW GP0,(Y2<<16)+(X2&0xFFFF)               ; Write GP0  Packet Word (Vertex2)
        // WRIOW GP0,(COLOR3&0xFFFFFF)                  ; Write GP0  Packet Word (Color3)
        // WRIOW GP0,(Y3<<16)+(X3&0xFFFF)               ; Write GP0  Packet Word (Vertex3)
        // WRIOW GP0,(COLOR4&0xFFFFFF)                  ; Write GP0  Packet Word (Color4)
        // WRIOW GP0,(Y4<<16)+(X4&0xFFFF)               ; Write GP0  Packet Word (Vertex4)
        let c = this.cmd;
        this.t1.c24_from_cmd(c[0]);
        this.t1.v2_from_cmd(c[1]);
        this.t2.c24_from_cmd(c[2]);
        this.t2.v2_from_cmd(c[3]);
        this.t3.c24_from_cmd(c[4]);
        this.t3.v2_from_cmd(c[5]);
        this.t4.c24_from_cmd(c[6]);
        this.t4.v2_from_cmd(c[7]);

        if (LOG_DRAW_QUADS) console.log('quad_shaded', this.t1, this.t2, this.t3, this.t4);
        this.draw_flat_shaded_triangle(this.t1, this.t2, this.t3);
        this.draw_flat_shaded_triangle(this.t2, this.t3, this.t4);
    }

    cmd30_tri_shaded_opaque() {
        // 0 WRIOW GP0,(0x30<<24)+(COLOR1&0xFFFFFF)       ; Write GP0 Command Word (Color1+Command)
        // 1 WRIOW GP0,(Y1<<16)+(X1&0xFFFF)               ; Write GP0  Packet Word (Vertex1)
        // 2 WRIOW GP0,(COLOR2&0xFFFFFF)                  ; Write GP0  Packet Word (Color2)
        // 3 WRIOW GP0,(Y2<<16)+(X2&0xFFFF)               ; Write GP0  Packet Word (Vertex2)
        // 4 WRIOW GP0,(COLOR3&0xFFFFFF)                  ; Write GP0  Packet Word (Color3)
        // 5 WRIOW GP0,(Y3<<16)+(X3&0xFFFF)               ; Write GP0  Packet Word (Vertex3)
        let c1 = this.color1;
        let c2 = this.color2;
        let c3 = this.color3;
        this.v1.v2_from_cmd(this.cmd[1]);
        this.v2.v2_from_cmd(this.cmd[3]);
        this.v3.v2_from_cmd(this.cmd[5])
        this.v1.c24_from_cmd(this.cmd[0])
        this.v2.c24_from_cmd(this.cmd[2])
        this.v3.c24_from_cmd(this.cmd[4])
        if (LOG_GP0) console.log('tri_shaded_opaque', this.v1, this.v2, this.v3);
        this.draw_flat_shaded_triangle(this.v1, this.v2, this.v3);
        //rgba, rgbb, rgbc

    }

    cmd64_rect_opaque_flat_textured() {
        // WRIOW GP0,(0x64<<24)+(COLOR&0xFFFFFF)      ; Write GP0 Command Word (Color+Command)
        //let color24 = this.cmd[0] & 0xFFFFFF;

        // WRIOW GP0,(Y<<16)+(X&0xFFFF)               ; Write GP0  Packet Word (Vertex)
        let ystart = (this.cmd[1] & 0xFFFF0000) >> 16;
        let xstart = ((this.cmd[1] & 0xFFFF) << 16) >> 16;

        // WRIOW GP0,(PAL<<16)+((V&0xFF)<<8)+(U&0xFF) ; Write GP0  Packet Word (Texcoord+Palette)
        let clut = (this.cmd[2] >>> 16) & 0xFFFF;
        let v = (this.cmd[2] >> 8) & 0xFF;
        let ustart = this.cmd[2] & 0xFF;

        // WRIOW GP0,(HEIGHT<<16)+(WIDTH&0xFFFF)      ; Write GP0  Packet Word (Width+Height)
        let height = (this.cmd[3] >>> 16) & 0xFFFF;
        let width = this.cmd[3] & 0xFFFF;

        let xend = (xstart + width);
        let yend = (ystart + height);
        xend = xend > 1024 ? 1024 : xend;
        yend = yend > 512 ? 512 : yend;
        if (LOG_GP0) console.log('rect_opaque_flat', xstart, ystart, width, height);

        let ts = this.get_texture_sampler(this.texture_depth, this.page_base_x, this.page_base_y, clut)
        for (let y = ystart; y < yend; y++) {
            let u = ustart;
            for (let x = xstart; x < xend; x++) {
                let color = this.sample_texture(ts, u, v);
                let hbit = color & 0x8000;
                let lbit = color & 0x7FFF;
                if ((lbit !== 0) || ((lbit === 0) && hbit)) this.setpix(y, x, lbit);
                u++;
            }
            v++;
        }
    }

    draw_flat_tex_triangle(v1, v2, v3, palette, tx_page) {
        let tx_x = tx_page & 0x1FF;
        let tx_y = (tx_page >>> 11) & 1
        let tsa = this.get_texture_sampler(this.texture_depth, tx_x, tx_y, palette);

        let draw_line = function(y, x1, x2, u1, u2, v1, v2, ts, setpix) {
            x1 = Math.round(x1);
            x2 = Math.round(x2);
            /*u1 >>= 0;
            u2 >>= 0;
            v1 >>= 0;
            v2 >>= 0;*/
            if (x1 > x2) {
                let a = x1;
                let b = u1;
                let c = v1;
                x1 = x2;
                u1 = u2;
                v1 = v2;
                x2 = a;
                u2 = b;
                v2 = c;
            }
            let r = 1 / (x2 - x1);
            let ud = (u2 - u1) * r;
            let vd = (v2 - v1) * r;

            for (let x = x1; x < x2; x++) {
                let c = ts.func(ts, u1>>>0, v1>>>0);
                let hbit = c & 0x8000;
                let lbit = c & 0x7FFF;
                if ((lbit !== 0) || ((lbit === 0) && hbit)) setpix(y>>>0, x>>>0, 0);
                u1 += ud;
                v1 += vd;
            }
        }

        let fill_bottom = function(v1, v2, v3, draw_line, ts, setpix) {
            // fill flat-bottom triangle
            //console.log('YS!', v1.y, v2.y, v3.y)
            let r1 = 1 / (v2.y - v1.y);
            let r2 = 1 / (v3.y - v1.y);
            let islop1 = (v2.x - v1.x) * r1;
            let uslop1 = (v2.u - v1.u) * r1;
            let vslop1 = (v2.v - v1.v) * r1;

            let islop2 = (v3.x - v1.x) * r2;
            let uslop2 = (v3.u - v1.u) * r2;
            let vslop2 = (v3.v - v1.v) * r2;

            let cx1 = v1.x;
            let cx2 = v1.x;
            let cu1 = v1.u;
            let cu2 = v1.u;
            let cv1 = v1.v;
            let cv2 = v1.v;

            for (let y = v1.y; y <= v2.y; y++) {
                draw_line(y, cx1, cx2, cu1, cu2, cv1, cv2, ts, setpix);
                cx1 += islop1;
                cx2 += islop2;
                cu1 += uslop1;
                cu2 += uslop2;
                cv1 += vslop1;
                cv2 += vslop2;
            }
        }

        let fill_top = function(v1, v2, v3, draw_line, ts, setpix) {
            // fill flat-top triangle
            //     v2.     .v1
            //    /  _____/
            //  /_____/
            // v3
            //
            let r1 = 1 / (v3.y - v1.y);
            let r2 = 1 / (v3.y - v2.y)

            let islop1 = (v3.x - v1.x) * r1;
            let uslop1 = (v3.u - v1.u) * r1;
            let vslop1 = (v3.v - v1.v) * r1;

            let islop2 = (v3.x - v2.x) * r2;
            let uslop2 = (v3.u - v2.u) * r2;
            let vslop2 = (v3.v - v2.v) * r2;

            let cu1 = v3.u;
            let cu2 = v3.u;
            let cv1 = v3.v;
            let cv2 = v3.v;

            let cx1 = v3.x;
            let cx2 = v3.x;
            for (let y = v3.y; y > v1.y; y--) {
                draw_line(y, cx1, cx2, cu1, cu2, cv1, cv2, ts, setpix);

                cx1 -= islop1;
                cx2 -= islop2;
                cu1 -= uslop1;
                cu2 -= uslop2;
                cv1 -= vslop1;
                cv2 -= vslop2;
            }
        }

        // first sort points
        let a;
        if (v2.y > v3.y) {
            a = v2;
            v2 = v3;
            v3 = a;
        }

        if (v1.y > v2.y) {
            a = v1;
            v1 = v2;
            v2 = a;
        }

        if (v2.y > v3.y) {
            a = v2;
            v2 = v3;
            v3 = a;
        }

        // Trivial case 1
        if (v1.y === v3.y) {
            fill_bottom(v1, v2, v3, draw_line, tsa, this.setpix.bind(this));
        }
        else if (v1.y === v2.y) { // trivial case 2
            fill_top(v1, v2, v3, draw_line, tsa, this.setpix.bind(this));
        } // other cases
        else {
            let v4 = this.v4;
            v4.y = v2.y;
            // Now calculate G and B
            let c = ((v2.y - v1.y) / (v3.y - v1.y));

            v4.x = v1.x + c * (v3.x - v1.x);
            v4.u = v1.u + c * (v3.u - v1.u);
            v4.v = v1.v + c * (v3.v - v1.v);

            fill_bottom(v1, v2, v4, draw_line, tsa, this.setpix.bind(this));
            fill_top(v2, v4, v3, draw_line, tsa, this.setpix.bind(this));
        }
    }

    sample_tex_4bit(ts, u, v) {
        let addr = ts.base_addr + ((v&0xFF)<<11) + ((u&0xFF) >>> 1);
        let d = this.VRAM.getUint8(addr);
        if ((u & 1) === 0) d &= 0x0F;
        else d = (d & 0xF0) >>> 4;
        return this.VRAM.getUint16(ts.clut_addr + (d*2));
    }

    sample_tex_8bit(ts, u, v) {
        let d = this.VRAM.getUint8(ts.base_addr + ((v&0xFF)<<11) + (u&0x7F));
        return this.VRAM.getUint16(ts.clut_addr + (d*2));
    }

    sample_tex_15bit(ts, u, v) {
        let addr = ts.base_addr + ((v&0xFF)<<11) + ((u&0x3F)>>1);
        return this.VRAM.getUint16(addr);
    }

    get_texture_sampler(tex_depth, page_x, page_y, clut=0) {
        let ts = new texture_sampler(page_x, page_y, clut, this);
        switch(tex_depth) {
            case PS1e.T4bit:
                ts.func2 = this.sample_tex_4bit.bind(this);
                break;
            case PS1e.T8bit:
                ts.func2 = this.sample_tex_8bit.bind(this);
                break;
            case PS1e.T15bit:
                ts.func2 = this.sample_tex_15bit.bind(this);
                break;
        }
        return ts;
    }

    sample_texture(ts, u, v) {
        return ts.func(ts, u, v);
    }

    cmd75_rect_opaque_flat_textured() {
        let xstart = ((this.cmd[1] & 0xFFFF) << 16) >> 16;
        let ystart = this.cmd[1] >> 16;
        let clut = this.cmd[2] >>> 16;
        let v = (this.cmd[2] >> 8) & 0xFF;
        let ustart = this.cmd[2] & 0xFF;

        let xend = (xstart + 8);
        let yend = (ystart + 8);
        xend = xend > 1024 ? 1024 : xend;
        yend = yend > 512 ? 512 : yend;

        if (LOG_GP0) console.log('rect_oqaue_flat_textured')
        let ts = this.get_texture_sampler(this.texture_depth, this.page_base_x, this.page_base_y, clut);

        for (let y = ystart; y < yend; y++) {
            let u = ustart;
            for (let x = xstart; x < xend; x++) {
                let color = this.sample_texture(ts, u, v);

                let hbit = color & 0x8000;
                let lbit = color & 0x7FFF;
                if ((lbit !== 0) || ((lbit === 0) && hbit)) this.setpix(y, x, lbit);
                //this.setpix(y, x, lbit);
                u++;
            }
            v++;
        }
    }

    cmd28_draw_flat4untex() {
        // Flat 4-vertex untextured poly
        let c = this.cmd;
        let x0 = mksigned16(c[1] & 0xFFFF);
        let y0 = mksigned16(c[1] >>> 16);
        let x1 = mksigned16(c[2] & 0xFFFF);
        let y1 = mksigned16(c[2] >>> 16);
        let x2 = mksigned16(c[3] & 0xFFFF);
        let y2 = mksigned16(c[3] >>> 16);
        let x3 = mksigned16(c[4] & 0xFFFF);
        let y3 = mksigned16(c[4] >>> 16);
        /*
        For quads, I do v1, v2, v3 for one triangle and then v2, v3, v4 for the other
         */
        let color = BGR24to15(c[0] & 0xFFFFFF);
        if (LOG_DRAW_QUADS) console.log('flat4untex ', x0, y0, x1, y1, x2, y2, hex6(color));
        this.draw_flat_triangle(x0, y0, x1, y1, x2, y2, color);
        this.draw_flat_triangle(x1, y1, x2, y2, x3, y3, color);
    }

    cmd2c_quad_opaque_flat_textured() {
        // Flat 4-vertex textured poly
        let c = this.cmd;
        // 0 WRIOW GP0,(0x2C<<24)+(COLOR&0xFFFFFF)        ; Write GP0 Command Word (Color+Command)
        let col = c[0] & 0xFFFFFF;
        // 1 WRIOW GP0,(Y1<<16)+(X1&0xFFFF)               ; Write GP0  Packet Word (Vertex1)
        this.t1.v2_from_cmd(c[1]);
        // 2 WRIOW GP0,(PAL<<16)+((V1&0xFF)<<8)+(U1&0xFF) ; Write GP0  Packet Word (Texcoord1+Palette)
        let palette = c[2] >>> 16;
        this.t1.uv_from_cmd(c[2]);
        // 3 WRIOW GP0,(Y2<<16)+(X2&0xFFFF)               ; Write GP0  Packet Word (Vertex2)
        this.t2.v2_from_cmd(c[3]);
        // 4 WRIOW GP0,(TEX<<16)+((V2&0xFF)<<8)+(U2&0xFF) ; Write GP0  Packet Word (Texcoord2+Texpage)
        let tx_page = c[4] >>> 16;
        this.t2.uv_from_cmd(c[4]);
        // 5 WRIOW GP0,(Y3<<16)+(X3&0xFFFF)               ; Write GP0  Packet Word (Vertex3)
        this.t3.v2_from_cmd(c[5]);
        // 6 WRIOW GP0,((V3&0xFF)<<8)+(U3&0xFF)           ; Write GP0  Packet Word (Texcoord3)
        this.t3.uv_from_cmd(c[6]);
        // 7 WRIOW GP0,(Y4<<16)+(X4&0xFFFF)               ; Write GP0  Packet Word (Vertex4)
        this.t4.v2_from_cmd(c[7]);
        // 8 WRIOW GP0,((V4&0xFF)<<8)+(U4&0xFF)           ; Write GP0  Packet Word (Texcoord4)
        this.t4.uv_from_cmd(c[8]);

        this.draw_flat_tex_triangle(this.t1, this.t2, this.t3, palette, tx_page);
        this.draw_flat_tex_triangle(this.t2, this.t3, this.t4, palette, tx_page);
    }
}

const ps1gpu = new PS1_GPU_thread()
onmessage = async function(ev) {
    let e = ev.data;
    await ps1gpu.onmessage(e);
}
