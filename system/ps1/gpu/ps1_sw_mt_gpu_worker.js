"use strict";

/*
GOTTA REFACTOR FIFO into a class.
Have separate GP0 and GP1 FIFO
Check GP1 first and act on it

 */
importScripts('/helpers/thread_common.js');
importScripts('/helpers.js');


const DBG_GP0 = false;

const GPUSTAT = 0;
const GPUPLAYING = 1;
const GPUQUIT = 2;
const GPUGP1 = 3;
const GPUREAD = 4;
const LASTUSED = 23;

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
        // 17 = num_items
        // 18 = lock
        this.GP0FIFO_sb = new SharedArrayBuffer(80);
        this.GP1FIFO_sb = new SharedArrayBuffer(80);
        this.GP0_FIFO = new MT_FIFO16();
        this.GP1_FIFO = new MT_FIFO16();

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
        this.GPUSTAT = o | (this.MMIO[GPUSTAT] & 0x1C000000);;
        this.MMIO[GPUSTAT] = this.GPUSTAT;
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
        this.shared_output_buffers[0] = e.output_buffer0;
        this.shared_output_buffers[1] = e.output_buffer1;
        this.output[0] = new Uint8Array(this.shared_output_buffers[0]);
        this.output[1] = new Uint8Array(this.shared_output_buffers[1]);
        this.GP0FIFO_sb = e.GP0FIFO;
        this.GP1FIFO_sb = e.GP1FIFO;
        this.VRAMb = e.VRAM;
        this.VRAM = new DataView(this.VRAMb);
        for (let i = 0; i < (1024*1024); i+=4) {
            this.VRAM.setUint32(i,0xFFFFFFFF);
        }
        this.GP0_FIFO.set_sab(this.GP0FIFO_sb);
        this.GP1_FIFO.set_sab(this.GP1FIFO_sb);
        this.MMIO_sb = e.MMIO;
        this.MMIO = new Uint32Array(this.MMIO_sb);

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
        this.MMIO[GPUREAD] = 0;

        this.init_FIFO();
        this.listen_FIFO();
    }

    gp0(cmd) {
        console.log('GOT CMD', hex8(cmd));
        // if we have an instruction...
        if (this.current_ins !== null) {
            this.cmd[this.cmd_arg_index++] = cmd;
            if (this.cmd_arg_index === this.cmd_arg_num) {
                this.current_ins();
                this.current_ins = null;
                console.log('EXECUTE', hex8(this.cmd[0]))
            }
        }
        else {
            // If we don't have one yet...
            this.cmd[0] = cmd;
            this.cmd_arg_index = 1;
            this.ins_special = false;
            this.cmd_arg_num = 1;
            switch (cmd >>> 24) {
                case 0: // NOP
                    console.log('INTERPRETED AS NOP:', hex8(cmd));
                    break;
                case 0x01: // Clear cache (not implemented)
                    break;
                case 0x02: // Quick Rectangle
                    console.log('Quick rectangle!');
                    this.current_ins = this.gp0QuickRect.bind(this);
                    this.cmd_arg_num = 3;
                    break;
                case 0x21: //
                    case 0x28: // flat-shaded rectangle
                    this.current_ins = this.draw_flat4untex.bind(this);
                    this.cmd_arg_num = 5;
                    break;
                case 0xA0: // Image stream to GPU
                    if (DBG_GP0) console.log('GP0 A0 img load');
                    this.current_ins = this.gp0_image_load_start.bind(this);
                    this.cmd_arg_num = 3;
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
                    console.log('Unknown GP0 command', hex8(cmd>>>0));
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
                /**
                 * @type {GPUSTAT_reg}
                 */
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
                this.clear_FIFO();
                this.GPUSTAT_update();
                this.ready_cmd();
                this.ready_recv_DMA();
                this.ready_vram_to_CPU();

                // TODO: remember to flush GPU texture cache
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

    gp0QuickRect(cmd) {
        // GP0 quick rect!!!
       this.unready_all();

        let ysize = (this.cmd[2] >>> 16) & 0xFFFF;
        let xsize = (this.cmd[2]) & 0xFFFF;
        let BGR = BGR24to15(this.cmd[0] & 0xFFFFFF);
        let start_y = (this.cmd[1] >>> 16) & 0xFFFF;
        let start_x = (this.cmd[1]) & 0xFFFF;
        console.log('QUICKRECT! COLOR', hex4(BGR), 'X Y', start_x, start_y, 'SZ X SZ Y', xsize, ysize);
        for (let y = start_y; y < (start_y+ysize); y++) {
            for (let x = start_x; x < (start_x + xsize); x++) {
                //this.setpix(y, x, BGR);
                let addr = (2048*y)+(x*2);
                this.VRAM.setUint16(addr, BGR, true);
            }
        }

        this.ready_all();
    }

    setpix(y, x, color) {
        // VRAM is 512 1024-wide 16-bit words. so 2048 bytes per line
        let ry = y + this.draw_y_offset;
        let rx = x + this.draw_x_offset;
        if ((ry < this.draw_area_top) || (ry > this.draw_area_bottom)) return;
        if ((rx < this.draw_area_left) || (rx > this.draw_area_right)) return;
        let addr = (2048*ry)+(rx*2);
        this.VRAM.setUint16(addr, color, true);
    }

    init_FIFO() {
        this.GP0_FIFO[16] = this.GP0_FIFO[17] = 0;
        for (let i = 0; i < 16; i++) {
            this.GP0_FIFO[i] = 0;
        }

        // Set "ready for stuff"
        this.ready_cmd();
        this.ready_vram_to_CPU();
        this.ready_recv_DMA();
        this.MMIO[GPUSTAT] = this.GPUSTAT;
    }

    clear_FIFO() {
        this.GP0_FIFO.clear()
    }

    listen_FIFO() {
        this.MMIO[GPUPLAYING] = 1;
        while(this.MMIO[GPUPLAYING] === 1) {
            let cmd1 = this.GP1_FIFO.get_item();
            let cmd0 = null;
            if (cmd1 === null) {
                cmd0 = this.GP0_FIFO.get_item();
                if (cmd0 !== null) this.handle_gp0(cmd0>>>0)
            }
            else this.gp1(cmd1>>>0);
        }
        console.log('FIFO no more listen...')
        if (this.MMIO[GPUPLAYING] === 0) {
            console.log('PAUSE receieved!');
            return;
        }
        console.log('UNKNOWN QUIT REASON?');
    }

    set_last_used_buffer(which) {
        this.MMIO[LASTUSED] = which;
    }

    onmessage(e) {
        console.log('GPU got message', e);
        switch(e.kind) {
            case GPU_messages.startup:
                this.msg_startup(e);
                break;
            case GPU_messages.play:
                this.listen_FIFO();
                break;
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

    gp0_image_load_start(cmd) {
        let c = this.cmd;
        // Top-left corner in VRAM
        let x = c[1] & 0xFFFF;
        let y = (c[1] >>> 16) & 0xFFFF;

        // Resolution
        let width = c[2] & 0xFFFF;
        let height = (c[2] >>> 16) & 0xFFFF;

        // Get imgsize, round it
        let imgsize = ((width * height) + 1) & 0x1FFFE;

        this.gp0_transfer_remaining = imgsize/2;
        console.log('TRANSFER IMGSIZE', imgsize, 'X Y', x, y, 'WIDTH HEIGHT', width, height, hex8(c[1]));
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
            try {
                this.VRAM.setUint16(addr, px, true);
            } catch(e) {
                console.log('WAIT!', y, x, this.load_buffer.width+this.load_buffer.x, addr);
            }
            //this.setpix(this.load_buffer.y+this.load_buffer.img_y, this.load_buffer.x+this.load_buffer.img_x, px);
            this.load_buffer.img_x++;
            if ((x+1) >= (this.load_buffer.width+this.load_buffer.x)) {
                this.load_buffer.img_x = 0;
                this.load_buffer.img_y++;
            }
        }
        this.gp0_transfer_remaining--;
        if (this.gp0_transfer_remaining === 0) {
            console.log('TRANSFER COMPLETE!');
            this.current_ins = null;
            this.handle_gp0 = this.gp0.bind(this);
        }
    }

    draw_flat4untex() {
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
        let color = c[0] & 0xFFFFFF;
        this.draw_flat_triangle(x0, y0, x1, y1, x2, y2, color);
        this.draw_flat_triangle(x1, y1, x2, y2, x3, y3, color);

    }
}

const ps1gpu = new PS1_GPU_thread()
onmessage = async function(ev) {
    let e = ev.data;
    await ps1gpu.onmessage(e);
}