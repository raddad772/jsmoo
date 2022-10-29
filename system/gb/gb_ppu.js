"use strict";

const GB_PPU_modes = Object.freeze({
    HBLANK: 0,
    VBLANK: 1,
    OAM_search: 2,
    pixel_transfer: 3
});


class GB_FIFO_get_pixel_return {
    constructor() {
        this.palette = 0;
        this.color = 0;
        this.bg = 0; // 0 for BG, 1 for OBJ

        this.had_pixel = false;
    }
}

class GB_FIFO_item_t {
    constructor(pixel=0, palette=0, cgb_priority=0, sprite_priority=0) {
        this.pixel = pixel;
        this.palette = palette;
        this.cgb_priority = cgb_priority;
        this.sprite_priority = sprite_priority;
    }
}

class GB_FIFO_t {
    constructor(variant) {
        this.variant = variant;
        this.compat_mode = 1;
        /**
         * @type {GB_FIFO_item_t[]}
         */
        this.items = [];
        for (let i = 0; i < 8; i++) {
            this.items[i] = new GB_FIFO_item_t();
        }
        this.head = 0;
        this.tail = 0;
        this.num_items = 0;
    }

    set_cgb_mode(on) {
        if (on)
            this.compat_mode = 0;
        else
            this.compat_mode = 1;
    }

    any_there() {
        return this.num_items > 0;
    }

    clear() {
        this.head = this.tail = 0;
        this.num_items = 0;
    }

    empty() {
        return this.num_items === 0;
    }

    full() {
        return this.num_items === 8;
    }

    // This is for "mixing" on sprite encounter
    sprite_mix(bp0, bp1, sp_priority, sp_palette, flip) {
        for (let j = 0; j < 8; j++) {
            let r = j;
            if (flip) r = 7 - r;
            let i = (r + this.head) & 7;
            if (j >= this.num_items) {
                // TODO: blend
                if (this.compat_mode === 1) {
                    // DMG/CGB compatability
                    if (this.items[i].pixel === 0) {
                        this.items[i].palette = sp_palette;
                        this.items[i].sprite_priority = sp_priority;
                        this.items[i].pixel = ((bp0 & 1) + ((bp1 & 1) << 1));
                        this.items[i].cgb_priority = 0;
                    }
                } else {
                    if (this.items[i].cgb_priority < sp_priority) {
                        this.items[i].palette = sp_palette;
                        this.items[i].sprite_priority = sp_priority;
                        this.items[i].pixel = ((bp0 & 1) + ((bp1 & 1) << 1));
                        this.items[i].cgb_priority = sp_priority;
                    }
                }
            } else {
                // Empty so just insert
                this.items[i].palette = sp_palette;
                this.items[i].sprite_priority = sp_priority;
                this.items[i].pixel = ((bp0 & 1) + ((bp1 & 1) << 1));
                this.items[i].cgb_priority = 0;
            }
            bp0 >>>= 1;
            bp1 >>>= 1;
        }
        // We now have a full FIFO
        this.num_items = 8;
        this.tail = (this.head + 8) & 7;
    }

    /**
     * @returns {null|GB_FIFO_item_t}
     */
    push() {
        if (this.num_items === 8) return null;
        let r = this.items[this.tail];
        this.tail = (this.tail + 1) & 7;
        this.num_items++;
        return r;
    }

    /**
     * @returns {null|GB_FIFO_item_t}
     */
    pop() {
        if (this.num_items === 0) return null;
        let r = this.items[this.head];
        this.head = (this.head + 1) & 7;
        this.num_items--;
        return r;
    }
}

class GB_slice_fetcher {
    /**
     * @param {GB_PPU} ppu
     */
    constructor(ppu) {
        this.ppu = ppu;
        this.clock = this.ppu.clock;
        this.bus = this.ppu.bus;

        // Background and Sprite request lines
        this.bg_request = 0;
        this.sp_request = 0;
        /**
         * @type {GB_PPU_sprite_t[]}
         */
        this.sprite_requests = [];

        this.in_window = false;

        this.cycle = 0;

        this.real_lx = -8;

        // FIFO's
        this.bg_FIFO = new GB_FIFO_t();
        this.sp_FIFO = new GB_FIFO_t();

        this.bp0_fetch = 0;
        this.bp1_fetch = 0;
        this.sp_req_attr = 0;

        this.wy = 0; // "window y"
        this.wy_addr = 0; // "window y" / 8 << 5

        this.get_return = new GB_FIFO_get_pixel_return();
    }

    reset() {
        console.log('UH OH! NO FIFO RESET!');
    }

    trigger_window() {
        // TODO: Clear BG FIFO and start over
        this.bg_FIFO.clear();

        console.log('TRIGGER WINDOW!')
        // Trigger window
        this.wy = this.ppu.io.wy - this.clock.ly;
        this.wy_addr = (this.wy >>> 3) << 5;
        this.in_window = true;
    }

    advance_line() {
        this.bp0_fetch = 0;
        this.bp1_fetch = 0;
        this.line_first_fetch = true;
        this.in_window = false;
        this.real_lx = -8;
    }

    advance_pixel() {
        // Check sprites
        for (let i = 0; i < this.ppu.sprites.num; i++) {
            let OBJ = this.ppu.OBJ[i];
            if (this.clock.lx === OBJ.x) {
                this.sp_request = 1;
                this.sprite_requests.push(OBJ);
            }
        }

        // Check if in window
        this.real_lx++;
        if (!this.in_window) {
            if ((this.ppu.io.bg_window_enable) &&
                (this.clock.lx === this.ppu.io.wx) &&
                (this.clock.ly >= this.ppu.io.wy)
            ) {
                // Trigger window
                this.trigger_window();
            }
        }

    }

    new_line() {
        this.in_window = false;
        this.line_first_fetch = true;
    }

    restart() {
        this.new_line();
    }

    bg_tilemap_addr() {
        let bbit = this.in_window ? this.ppu.io.window_tile_map_base : this.ppu.io.bg_tile_map_base;
        if (this.in_window)
            return (0x9800 | (this.ppu.io.window_tile_map_base << 10) |
                    this.wy_addr | Math.floor(this.clock.lx >>> 3)
            );
        else
            return (0x9800 | (this.ppu.io.bg_tile_map_base << 10) |
                (((this.clock.ly + this.ppu.io.SCY) >>> 3) << 5) |
                ((this.clock.lx + this.ppu.io.SCX) >>> 3)
            );
    }

    bg_tile_addr(which) {
        let b12;

        if (this.ppu.io.bg_window_tile_data_base) b12 = 0;
        else b12 = ((which & 0x80) ^ 0x80) << 5;

        if (!this.in_window) {
            return (0x8000 | b12 |
                (which << 4) |
                (((this.clock.ly + this.ppu.io.SCY) & 7) << 1)
            );
        } else {
            return (0x8000 | b12 |
                (which << 4) |
                ((this.wy & 7) << 1)
            );
        }
    }

    sp_tile_addr(which, y) {
        return (0x8000 | (which << 4) | (y << 1));
    }

    // run_cycle() then get_pixel_if_possible()
    // throw away first 8 cycles
    run_cycle() {
        // Only act every other cycle
        let addr, tn;
        if (this.cycle & 1) {
            if (this.bg_request) {
                switch(this.cycle) {
                    case 0:
                        this.cycle++;
                        break;
                    case 1: // tile number fetch
                        tn = this.bus.mapper.PPU_read(this.bg_tilemap_addr());
                        this.fetch_addr = this.bg_tile_addr(tn);
                        this.cycle = 2;
                        break;
                    case 2:
                        this.cycle++;
                        break;
                    case 3: // bp0 fetch
                        this.bp0_fetch = this.bus.mapper.PPU_read(this.fetch_addr);
                        this.fetch_addr++;
                        this.cycle = 4;
                        break;
                    case 4:
                        this.cycle++;
                        break;
                    case 5: // bp1 fetch
                        this.bp1_fetch = this.bus.mapper.PPU_read(this.fetch_addr);
                        this.cycle = 6;
                        break;
                    case 6:
                        this.cycle++;
                        break;
                    case 7: // Attempt to push data to FIFO,
                        if (this.sp_request) {
                            let request = this.sprite_requests.shift();
                            tn = request.tile;
                            let y = (request.y - this.clock.ly);
                            if (request.attr & 0x40) y = (this.ppu.io.sprites_big ? 16 : 8) - y;

                            if (y > 7) {
                                tn++;
                                y -= 8;
                            }
                            this.fetch_addr = this.sp_tile_addr(tn, y);
                            this.bp0_fetch = this.bus.mapper.PPU_read(this.fetch_addr);
                            this.fetch_addr++;
                            this.sp_req_attr = request.attr;
                            this.cycle = 8;
                            if (this.sprite_requests.length === 0) this.sp_request = 0;
                        } else {
                            // Try to push
                            if (this.bg_FIFO.empty()) {
                                for (let i = 0; i < 7; i++) {
                                    let b = this.bg_FIFO.push();
                                    b.pixel = (this.bp0_fetch) & 1 | ((this.bp1_fetch & 1) << 1);
                                    this.bp0_fetch >>= 1;
                                    this.bp1_fetch >>= 1;
                                    b.palette = 0;
                                    b.cgb_priority = 0;
                                    b.sprite_priority = 0;
                                }
                                // Reset back to tile fetch
                                this.cycle = 0;
                            }
                            // DO NOT change cycle if waiting to push
                        }
                        break;
                    case 8: // do nothing, waiting for next sprite fetch.
                        this.cycle = 9;
                        break;
                    case 9: // fetch other part of sprite
                        this.bp1_fetch = this.bus.mapper.PPU_read(this.fetch_addr);
                        this.sp_FIFO.sprite_mix(this.bp0_fetch, this.bp1_fetch, (this.sp_req_attr & 0x80) >>> 7, (this.sp_req_attr & 0x10) >>> 4, (this.sp_req_attr & 0x20) >>> 5);
                        this.cycle = 0;
                        break;
                }
            }
        } else {
            this.cycle++;
        }
    }

    /**
     * @returns {GB_FIFO_get_pixel_return}
     */
    get_pixel_if_possible() {
        this.get_return.had_pixel = false;
        if (!(this.bg_request || this.sp_request)) { // Only output if there are no requests being serviced
            this.get_return.had_pixel = true;
            let bgo = this.bg_FIFO.pop();
            let spo;
            if (this.sp_FIFO.any_there()) {
                spo = this.sp_FIFO.pop();
                // TODO: blend them!
            }
            else {
                this.get_return.bg = 0;
                this.get_return.palette = 0;
                this.get_return.color = bgo.pixel;
            }
        }
        if (this.bg_FIFO.empty()) this.bg_request = 1;
        if (this.get_return.had_pixel) this.advance_pixel();
        if (this.real_lx < 0) this.get_return.had_pixel = false;
        return this.get_return;
    }
}
// 160x144

class GB_PPU_sprite_t {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.tile = 0;
        this.attr = 0;
    }
}

class GB_PPU {
    /**
     * @param {canvas_manager_t} canvas_manager
     * @param {Number} variant
     * @param {GB_clock} clock
     * @param {GB_bus} bus
     */
    constructor(canvas_manager, variant, clock, bus) {
        this.variant = variant;
        this.clock = clock;
        this.canvas_manager = canvas_manager;
        this.bus = bus;
        console.log('SET BUS!', bus);

        this.clock.ppu_mode = GB_PPU_modes.OAM_search;
        this.line_cycle = 0;
        this.enabled = true;
        // First frame after reset, we don't draw.
        this.display_update = false;

        this.fetcher = new GB_slice_fetcher(this);

        this.bg_palette = [0, 0, 0, 0];
        this.sp_palette = [[0, 0, 0, 0], [0, 0, 0, 0]];

        this.OAM = new Uint8Array(160);
        /**
         * @type {GB_PPU_sprite_t[]}
         */
        this.OBJ = [];
        for (let i = 0; i < 10; i++) {
            this.OBJ.push(new GB_PPU_sprite_t());
        }

        this.sprites = {
            num: 0,
            index: 0,
            search_index: 0,
        }

        this.io = {
            sprites_big: 0,

            lyc: 0,

            window_tile_map_base: 0,
            window_enable: 0,
            bg_window_tile_data_base: 0,
            bg_tile_map_base: 0,
            obj_enable: 1,
            bg_window_enable: 1,

            stat_irq_mode0_enable: 0,
            stat_irq_mode1_enable: 0,
            stat_irq_mode2_enable: 0,
            stat_irq_lylyc_enable: 0,
            stat_irq_mode0_request: 0,
            stat_irq_mode1_request: 0,
            stat_irq_mode2_request: 0,
            stat_irq_lylyc_request: 0,

            SCX: 0, // X scroll
            SCY: 0, // Y scroll
            wx: 0, // Window X
            wy: 0, // Window Y
        }

        this.output = new Uint8Array(160*144);
        this.first_reset = true;
    }

    present() {
        this.canvas_manager.set_size(160, 144);
        let imgdata = this.canvas_manager.get_imgdata();
        for (let y = 0; y < 144; y++) {
            for (let x = 0; x < 160; x++) {
                let ppui = (y * 160) + x;
                let di = ppui * 4;
                let r, g, b;
                let o = this.output[ppui];
                r = 255 - ((o / 3) * 255);
                g = b = r;
                imgdata.data[di] = r;
                imgdata.data[di+1] = g;
                imgdata.data[di+2] = b;
                imgdata.data[di+3] = 255;
            }
        }
        this.canvas_manager.put_imgdata(imgdata);
    }

    write_IO(addr, val) {
        switch(addr) {
            case 0xFF40: // LCDC LCD Control
                if (val & 0x80) this.enable();
                else this.disable();

                this.io.window_tile_map_base = (val & 0x40) >>> 6;
                this.io.window_enable = (val & 0x20) >>> 5;
                this.io.bg_window_tile_data_base = (val & 0x10) >>> 4;
                this.io.bg_tile_map_base = (val & 8) >>> 3;
                this.io.sprites_big = (val & 4) >>> 2;
                this.io.obj_enable = (val & 2) >>> 1;
                this.io.bg_window_enable = val & 1;
                return;
            case 0xFF41: // STAT LCD status
                if (this.variant !== GB_variants.GAMEBOY_COLOR) {
                    this.io.stat_irq_mode0_enable = 1;
                    this.io.stat_irq_mode1_enable = 1;
                    this.io.stat_irq_mode2_enable = 1;
                    this.io.stat_irq_lylyc_enable = 1;
                    this.IRQ_stat_eval();
                    //this.bus.cpu.force_IRQ_latch();
                }
                this.io.stat_irq_mode0_enable = (val & 8) >>> 3;
                this.io.stat_irq_mode1_enable = (val & 0x10) >>> 4;
                this.io.stat_irq_mode2_enable = (val & 0x20) >>> 5;
                this.io.stat_irq_lylyc_enable = (val & 0x40) >>> 6;
                this.IRQ_stat_eval();
                return;
            case 0xFF42: // SCY
                this.io.SCY = val;
                return;
            case 0xFF43: // SCX
                this.io.SCX = val;
                return;
            case 0xFF45: // LYC
                this.io.lyc = val;
                this.eval_lyc();
                return;
            case 0xFF4A: // window Y
                this.io.wy = val;
                return;
            case 0xFF4B: // window x + 7
                this.io.wx = val;
                return;
            case 0xFF47: // BGP pallete
                if (!this.clock.CPU_can_VRAM) return;
                this.bg_palette[0] = val & 3;
                this.bg_palette[1] = (val >>> 2) & 3;
                this.bg_palette[2] = (val >>> 4) & 3;
                this.bg_palette[3] = (val >>> 6) & 3;
                return;
            case 0xFF48: // OBP0 sprite palette 0
                if (!this.clock.CPU_can_VRAM) return;
                this.sp_palette[0][0] = val & 3;
                this.sp_palette[0][1] = (val >>> 2) & 3;
                this.sp_palette[0][2] = (val >>> 4) & 3;
                this.sp_palette[0][3] = (val >>> 6) & 3;
                return;
            case 0xFF49: // OBP1 sprite palette 1
                if (!this.clock.CPU_can_VRAM) return;
                this.sp_palette[1][0] = val & 3;
                this.sp_palette[1][1] = (val >>> 2) & 3;
                this.sp_palette[1][2] = (val >>> 4) & 3;
                this.sp_palette[1][3] = (val >>> 6) & 3;
                return;

        }
    }

    read_IO(addr, val, has_effect=true) {
        switch(addr) {
            case 0xFF40: // LCDC LCD Control
                let e = this.enabled ? 0x80: 0;
                return e | (this.io.window_tile_map_base << 6) | (this.io.window_enable << 5) | (this.io.bg_window_tile_data_base << 4) |
                    (this.io.bg_tile_map_base << 3) | (this.io.sprites_big << 2) |
                    (this.io.obj_enable << 1) | (this.io.bg_window_enable);
            case 0xFF41: // STAT LCD status
                return this.clock.ppu_mode |
                    ((this.clock.ly === this.io.lyc) ? 1 : 0) |
                    (this.io.stat_irq_mode0_enable << 3) |
                    (this.io.stat_irq_mode1_enable << 4) |
                    (this.io.stat_irq_mode2_enable << 5) |
                    (this.io.stat_irq_lylyc_enable << 6);
            case 0xFF42: // SCY
                return this.io.SCY;
            case 0xFF43: // SCX
                return this.io.SCX;
            case 0xFF44: // LY
                return this.clock.ly;
            case 0xFF45: // LYC
                return this.io.lyc;
            case 0xFF4A: // window Y
                return this.io.wy;
            case 0xFF4B: // window x + 7
                return this.io.wx;
            case 0xFF47: // BGP
                if (!this.clock.CPU_can_VRAM) return 0xFF;
                return this.bg_palette[0] | (this.bg_palette[1] << 2) | (this.bg_palette[2] << 4) | (this.bg_palette[3] << 6);
            case 0xFF48: // OBP0
                if (!this.clock.CPU_can_VRAM) return 0xFF;
                return this.sp_palette[0][0] | (this.sp_palette[0][1] << 2) | (this.sp_palette[0][2] << 4) | (this.sp_palette[0][3] << 6);
            case 0xFF48: // OBP1
                if (!this.clock.CPU_can_VRAM) return 0xFF;
                return this.sp_palette[1][0] | (this.sp_palette[1][1] << 2) | (this.sp_palette[1][2] << 4) | (this.sp_palette[1][3] << 6);

        }
        return 0;
    }

    disable() {
        if (!this.enabled) return;
        console.log('DISABLE PPU');
        this.enabled = false;
        this.reset();
    }

    enable() {
        if (this.enabled) return;
        console.log('ENABLE PPU');
        this.enable_next_frame = true;
    }

    // Called on change to IRQ STAT settings
    IRQ_stat_eval() {

    }

    set_mode(which) {
        this.clock.ppu_mode = which;

        switch(which) {
            case GB_PPU_modes.OAM_search: // 2. after vblank
                this.clock.CPU_can_OAM = false;
                this.clock.CPU_can_VRAM = true;
                //
                if (this.enabled) {
                    this.bus.IRQ_vblank_down();
                    this.IRQ_mode1_down();
                    if (this.io.stat_irq_mode2_enable)
                        this.IRQ_mode2_up();
                }
                break;
            case GB_PPU_modes.pixel_transfer: // 3
                this.IRQ_mode2_down();
                this.clock.CPU_can_VRAM = false;
                this.clock.CPU_can_OAM = false;
                break;
            case GB_PPU_modes.HBLANK: // 0
                if (this.io.stat_irq_mode0_enable)
                    this.IRQ_mode0_up();
                this.clock.CPU_can_VRAM = true;
                this.clock.CPU_can_OAM = true;
                break;
            case GB_PPU_modes.VBLANK: // 1
                this.IRQ_mode0_down();
                this.clock.CPU_can_VRAM = true;
                this.clock.CPU_can_OAM = true;
                if (this.io.stat_irq_mode1_enable)
                    this.IRQ_mode1_up();
                this.bus.IRQ_vblank_up();
                break;
        }
    }

    run_cycles(howmany) {
        // We don't do anything, and in fact are off, if LCD is off
        for (let i = 0; i < howmany; i++) {
            // TODO: make this enabled on frame AFTER enable happens
            if (this.enabled) this.cycle();
            this.line_cycle++;
            if (this.line_cycle === 456) this.advance_line();
            if (dbg.do_break) break;
        }
    }

    advance_line() {
        this.clock.lx = 0;
        this.clock.ly++;
        this.clock.vy++;
        if (this.clock.ly === 144) this.set_mode(1); // VBLANK
        this.line_cycle = 0;
        if (this.clock.vy >= 154) {
            this.advance_frame();
        }
        this.eval_lyc();
        this.fetcher.advance_line();
    }

    // TODO: trigger IRQ if enabled properly
    eval_lyc() {
        if ((this.io.stat_irq_lylyc_enable) && (this.clock.ly === this.io.lyc))
            this.IRQ_lylyc_up();
        else
            this.IRQ_lylyc_down();
    }

    IRQ_lylyc_up() {
        this.io.stat_irq_lylyc_request = 1;
        if (!(this.io.stat_irq_mode0_request || this.io.stat_irq_mode1_request || this.io.stat_irq_mode2_request))
            this.trigger_stat_irq()
    }

    IRQ_lylyc_down() {
        this.io.stat_irq_lylyc_request = 0;
        this.IRQ_check_down();
    }
    
    IRQ_mode0_up() {
        this.io.stat_irq_mode0_request = 1;
        if (!(this.io.stat_irq_mode1_request || this.io.stat_irq_mode2_request || this.io.stat_irq_lylyc_request))
        this.trigger_stat_irq()
    }
    
    IRQ_mode0_down() {
        this.io.stat_irq_mode0_request = 0;
        this.IRQ_check_down();
    }

    trigger_stat_irq() {
        console.log('TRIGGERING STAT IRQ!');
        this.bus.cpu.cpu.regs.IF |= 2;
    }
    
    IRQ_mode1_up() {
        this.io.stat_irq_mode1_request = 1;
        if (!(this.io.stat_irq_mode0_request || this.io.stat_irq_mode2_request || this.io.stat_irq_lylyc_request))
            this.trigger_stat_irq()
    }

    IRQ_mode1_down() {
        this.io.stat_irq_mode1_request = 0;
        this.IRQ_check_down();
    }
    
    IRQ_mode2_up() {
        this.io.stat_irq_mode2_request = 1;
        if (!(this.io.stat_irq_mode0_request || this.io.stat_irq_mode1_request || this.io.stat_irq_lylyc_request))
            this.trigger_stat_irq()
    }
    
    IRQ_mode2_down() {
        this.io.stat_irq_mode2_request = 0;
        this.IRQ_check_down();
    }

    IRQ_check_down() {
        if (!(this.io.stat_irq_lylyc_request || this.io.stat_irq_mode0_request || this.io.stat_irq_mode1_request || this.io.stat_irq_mode2_request)) {
            this.bus.cpu.cpu.regs.IF &= 0xFD;
        }
    }

    advance_frame() {
        if (this.enable_next_frame) {
            this.enabled = true;
            this.enable_next_frame = false;
        }
        if (this.enabled) {
            this.display_update = true;
            this.clock.ly = 0;
        }
        this.clock.frames_since_restart++;
        this.clock.master_frame++;
    }

    /********************/
    OAM_search() {
        if ((this.line_cycle & 1) === 0) return;
        // Check if a sprite is at the right place
        // 4 bytes, 0 = Y position
        if (this.sprites.num === 10) return;
        let sy = this.OAM[this.sprites.search_index] - 16;
        let sy_bottom = sy + (this.io.sprites_big ? 16 : 8);
        if ((this.clock.ly >= sy) && (this.clock.ly <= sy_bottom)) {
            // WE GOT A HIT!
            this.OBJ[this.sprites.num].y = y;
            this.OBJ[this.sprites.num].x = this.OAM[this.sprites.search_index + 1] - 8;
            this.OBJ[this.sprites.num].tile = this.OAM[this.sprites.search_index + 2]
            this.OBJ[this.sprites.num].attr = this.OAM[this.sprites.search_index + 3];

            this.sprites.num++;
        }
        this.sprites.search_index += 4;
    }

    pixel_transfer() {
        // so we need to fill our FIFO
        // and write to screen
        this.fetcher.run_cycle();
        let px = this.fetcher.get_pixel_if_possible();
        if (px.had_pixel) {
            let cv;
            if (px.bg === 0) // background
                cv = this.bg_palette[px.color];
            else // sprite
                cv = this.sp_palette[px.palette][px.color];
            this.output[(this.clock.ly * 160) + this.clock.lx] = cv;
            this.clock.lx++;
        }
    }


    /*******************/
    cycle() {
        // Clear sprites
        if (this.line_cycle === 0) {
            this.sprites.num = 0;
            this.sprites.index = 0;
            this.sprites.search_index = 0;
            this.set_mode(2); // OAM search
        }

        switch (this.clock.ppu_mode) {
            case 2: // OAM search 0-80
                // 80 dots long, 2 per entry, find up to 10 sprites 0...n on this line
                this.OAM_search();
                if (this.line_cycle === 79) this.set_mode(3);
                break;
            case 3: // Pixel transfer. Complicated.
                this.pixel_transfer();
                if (this.clock.lx > 160) {
                    console.log('LINE DONE AFTER', this.line_cycle - 80);
                    this.set_mode(0);
                }
                break;
            case 0: // hblank
                break;
            case 1: // vblank
                break;
        }
    }

/*
Each scanline is 456 dots (114 CPU cycles) long and consists of

mode 2 (OAM search). 80 dots long (2 for each OAM entry). finds up to 10 sprites
mode 3 (pixel transfer), 173.5+ dots long because of FIFO, plus extra
mode 0 (hblank) is the rest of the time
vblank is mode 1, 10 lines

so 456 CYCLES by 154 LINES



at BEGINNING FETCH of LINE, fetch x2. throw away the first fetch.
8-pixel (32-bit) pixel dual FIFO, one for BG, one for sprite


fetch tile # - 2 cycles
fetch bitplane 0 - 2 cycles
fetch bitplane 1 - 2 cycles
fetch sprite top/bottom IF APPLICABLE

it'll do tile-pp-bpp-sprite PER SPRITE?

FIFO stores BPP, priority (sprite), palette #

FIFO is shifting out pixels and must >0 before sprite can happen

when we hit window, bg FIFO is cleared and fetches start over

x fine scroll discards from the FIFO, delaying start

there are comparators for each sprite.
if a sprite x is the same as our current rendering position,
we mix the sprite into the sprite FIFO


and mode 0 (horizontal blanking) whatever is left over

After 144 scanlines are drawn are 10 lines of mode 1 (vertical blanking), for a total of 154 lines or 70224 dots per screen.

The CPU can't see VRAM (writes are ignored and reads are $FF) during mode 3, but it can during other modes.
The CPU can't see OAM during modes 2 and 3, but it can during blanking modes (0 and 1).

To make the estimate for mode 3 more precise, see "Nitty Gritty Gameboy Cycle Timing" by Kevin Horton.
 */

    reset() {
        // Reset variables
        this.clock.lx = 0;
        this.clock.ly = 0;
        this.line_cycle = 0;
        this.fetch_cycle = 0;
        this.display_update = false;

        // Reset IRQs
        this.io.stat_irq_mode0_request = 0;
        this.io.stat_irq_mode1_request = 0;
        this.io.stat_irq_mode2_request = 0;
        this.io.stat_irq_lylyc_request = 0;
        this.io.stat_irq_mode0_enable = this.io.stat_irq_mode1_enable = this.io.stat_irq_mode2_enable = this.io.stat_irq_lylyc_enable = 0;
        if (!this.first_reset)
            this.IRQ_check_down();

        // Set mode to OAM search
        this.set_mode(GB_PPU_modes.OAM_search);
        this.first_reset = false;
   }
}