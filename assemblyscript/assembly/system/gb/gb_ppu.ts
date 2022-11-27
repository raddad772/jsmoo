import {GB_PPU_modes, GB_variants} from "./gb_common";
import {GB_bus, GB_clock} from "./gb";
import {dbg} from "../../helpers/debug";

function GB_sp_tile_addr(tn: u32, y: u32, big_sprites: u32, y_flip: u32): u32 {
    if (big_sprites) {
        tn &= 0xFE;
        if (y_flip) y = 15 - y;
        if (y > 7) tn++;
        return (0x8000 | (tn << 4) | ((y & 7) << 1));
    }
    if (y_flip) y = 7 - y;
    return (0x8000 | (tn << 4) | (y << 1));
}


class GB_PPU_sprite_t {
    x: u32 = 0
    y: u32 = 0
    tile: u32 = 0
    attr: u32 = 0
    in_q: u32 = 0
}

class GB_FIFO_item_t {
    pixel: u32
    palette: u32
    cgb_priority: u32
    sprite_priority: u32
    sprite_obj: GB_PPU_sprite_t|null = null

    constructor(pixel: u32 = 0, palette: u32 = 0, cgb_priority: u32 = 0, sprite_priority: u32 = 0) {
        this.pixel = pixel;
        this.palette = palette;
        this.cgb_priority = cgb_priority;
        this.sprite_priority = sprite_priority;
    }
}

class GB_FIFO_t {
    variant: GB_variants
    compat_mode: u32 = 1  // 1 for DMG or GBC compatability
    items: StaticArray<GB_FIFO_item_t> = new StaticArray<GB_FIFO_item_t>(8);
    head: u32 = 0;
    tail: u32 = 0;
    num_items: u32 = 0;

    constructor(variant: GB_variants) {
        this.variant = variant;
        this.compat_mode = 1;

        for (let i: u32 = 0; i < 8; i++) {
            unchecked(this.items[i] = new GB_FIFO_item_t());
        }
    }

    set_cgb_mode(on: u32): void {
        if (on)
            this.compat_mode = 0;
        else
            this.compat_mode = 1;
    }

    any_there(): bool {
        return this.num_items > 0;
    }

    clear(): void {
        this.head = this.tail = 0;
        this.num_items = 0;
    }

    empty(): bool {
        return this.num_items === 0;
    }

    full(): bool {
        return this.num_items === 8;
    }

    // This is for "mixing" on sprite encounter
    sprite_mix(bp0: u32, bp1: u32, sp_priority: u32, sp_palette: u32, flip: u32): void {
        // First fill with transparent pixels
        while(this.num_items < 8) {
            let b = this.push();
            b!.sprite_priority = 0;
            b!.cgb_priority = 0;
            b!.pixel = 0;
            b!.palette = 0;
        }

        for (let j: u32 = 0; j < 8; j++) {
            let r: u32 = j;
            if (flip) r = 7 - r;
            let i: u32 = (r + this.head) & 7;
            let px: u32 = ((bp0 & 0x80) >>> 7) | ((bp1 & 0x80) >>> 6);
            let item = unchecked(this.items[i]);
            bp0 <<= 1;
            bp1 <<= 1;
            if (this.compat_mode == 1) {
                // DMG/CGB compatability
                if (item.pixel === 0) {
                    item.palette = sp_palette;
                    item.sprite_priority = sp_priority;
                    item.pixel = px;
                    item.cgb_priority = 0;
                }
            } else {
                if (item.cgb_priority < sp_priority) {
                    item.palette = sp_palette;
                    item.sprite_priority = sp_priority;
                    item.pixel = px;
                    item.cgb_priority = sp_priority;
                }
            }
        }
    }

    // Discard up to num pixels
    discard(num: u32): void {
        for (let i: u32 = 0; i < num; i++) {
            this.pop();
        }
    }

    push(): GB_FIFO_item_t|null {
        if (this.num_items >= 8) {
            console.log('NO!');
            return null;
        }
        let r = unchecked(this.items[this.tail]);
        this.tail = (this.tail + 1) & 7;
        this.num_items++;
        return r;
    }

    peek(): GB_FIFO_item_t|null {
        if (this.num_items === 0) return null;
        return unchecked(this.items[this.head]);
    }

    pop(): GB_FIFO_item_t|null {
        if (this.num_items === 0) return null;
        let r = unchecked(this.items[this.head]);
        this.head = (this.head + 1) & 7;
        this.num_items--;
        return r;
    }
}


class GB_px {
    had_pixel: bool = false
    color: u32 = 0
    bg_or_sp: u32 = 0  // 0 for BG
    palette: u32 = 0
}


class GB_pixel_slice_fetcher {
    variant: GB_variants
    ppu: GB_PPU|null = null
    clock: GB_clock
    bus: GB_bus

    fetch_cycle: u32 = 0
    fetch_addr: u32 = 0

    fetch_obj: GB_PPU_sprite_t|null = null;
    fetch_bp0: u32 = 0;
    fetch_bp1: u32 = 0;
    fetch_cgb_attr: u32 = 0;

    bg_FIFO: GB_FIFO_t
    obj_FIFO: GB_FIFO_t

    bg_request_x: u32 = 0;
    sp_request: u32 = 0;
    sp_min: u32 = 0;
    sprites_queue: GB_FIFO_t
    out_px: GB_px = new GB_px()

    constructor(variant: GB_variants, clock: GB_clock, bus: GB_bus) {
        this.variant = variant

        this.clock = clock;
        this.bus = bus;

        this.bg_FIFO = new GB_FIFO_t(variant);
        this.obj_FIFO = new GB_FIFO_t(variant);
        this.sprites_queue = new GB_FIFO_t(variant);
    }

    advance_line(): void {
        this.fetch_cycle = 0;
        this.bg_FIFO.clear();
        this.obj_FIFO.clear();
        this.sprites_queue.clear();
        this.bg_request_x = this.ppu!.io.SCX;
        this.sp_request = 0;
        this.sp_min = 0;
    }

    trigger_window(): void {
        this.bg_FIFO.clear();
        this.bg_request_x = 0;
        this.fetch_cycle = 0;
    }

    cycle(): GB_px {
        let r = this.get_px_if_available();
        this.run_fetch_cycle();
        return r;
    }

    get_px_if_available(): GB_px {
        this.out_px.had_pixel = false;
        this.out_px.bg_or_sp = -1;
        if ((this.sp_request == 0) && (!this.bg_FIFO.empty())) {
            this.out_px.had_pixel = true;
            let has_bg = this.ppu!.io.bg_window_enable
            let bg = this.bg_FIFO.pop();
            let bg_color: u32 = bg!.pixel;
            let has_sp: bool = false;
            let sp_color: i32 = -1, sp_palette: u32;
            let use_what:u32; // 0 for BG, 1 for OBJ
            let obj: GB_FIFO_item_t|null;

            if (!this.obj_FIFO.empty()) {
                obj = this.obj_FIFO.pop();
                sp_color = <i32>obj!.pixel;
                sp_palette = obj!.palette;
            }
            if (this.ppu!.io.obj_enable && (sp_color !== -1)) has_sp = true;

            if ((has_bg) && (!has_sp)) {
                use_what = 1;
            } else if ((!has_bg) && (has_sp)) {
                use_what = 1;
            } else if (has_bg && has_sp) {
                if (obj!.sprite_priority && (bg_color !== 0)) // "If the OBJ pixel has its priority bit set, and the BG pixel's ID is not 0, pick the BG pixel."
                    use_what = 1; // BG
                else if (sp_color === 0) // "If the OBJ pixel is 0, pick the BG pixel; "
                    use_what = 1; // BG
                else // "otherwise, pick the OBJ pixel"
                    use_what = 2; // sprite
            } else {
                use_what = 0;
                this.out_px.color = 0;
            }

            if (use_what === 0) {
            }
            else if (use_what === 1) {
                this.out_px.bg_or_sp = 0;
                this.out_px.color = bg_color;
                this.out_px.palette = 0;
            } else {
                this.out_px.bg_or_sp = 1;
                this.out_px.color = sp_color;
                // @ts-ignore
                this.out_px.palette = sp_palette;
            }
        }
        return this.out_px;
    }

    run_fetch_cycle(): void {
        // Scan any sprites
        for (let i: u32 = 0; i < this.ppu!.sprites.num; i++) {
            let ppuo: GB_PPU_sprite_t = unchecked(this.ppu!.OBJ[i]);
            if ((!ppuo.in_q) && (ppuo.x == this.clock.lx)) {
                this.sp_request++;
                let p = this.sprites_queue.push();
                p!.sprite_obj = ppuo;
                ppuo.in_q = 1;
            }
        }

        let tn: u32;
        switch(this.fetch_cycle) {
            case 0: // nothing
                this.fetch_cycle = 1;
                break;
            case 1: // tile
                if (this.ppu!.in_window()) {
                    tn = this.bus.mapper.PPU_read(this.ppu!.bg_tilemap_addr_window(this.bg_request_x));
                    this.fetch_addr = this.ppu!.bg_tile_addr_window(tn);
                }
                else {
                    tn = this.bus.mapper.PPU_read(this.ppu!.bg_tilemap_addr_nowindow(this.bg_request_x));
                    this.fetch_addr = this.ppu!.bg_tile_addr_nowindow(tn);
                }
                this.fetch_cycle = 2;
                break;
            case 2: // nothing
                this.fetch_cycle = 3;
                break;
            case 3: // bp0
                this.fetch_bp0 = this.bus.mapper.PPU_read(this.fetch_addr);
                //if (this.ppu.in_window()) this.fetch_bp0 = 0x55;
                this.fetch_cycle = 4;
                break;
            case 4: // nothing
                this.fetch_cycle = 5;
                break;
            case 5: // bp1
                this.fetch_bp1 = this.bus.mapper.PPU_read(this.fetch_addr+1);
                //if (this.ppu.in_window()) this.fetch_bp1 = 0x55;
                this.fetch_cycle = 6;
                break;
            case 6: // attempt background push, OR, hijack by sprite
                if (this.sp_request > 0) { // SPRITE HIJACK!
                    this.fetch_cycle = 7;
                    this.fetch_obj = this.sprites_queue.peek()!.sprite_obj;
                    this.fetch_addr = GB_sp_tile_addr(this.fetch_obj!.tile, this.clock.ly - this.fetch_obj!.y, this.ppu!.io.sprites_big, this.fetch_obj!.attr & 0x40);
                } else { // attempt to push to BG FIFO, which only accepts when empty.
                    if (this.bg_FIFO.empty()) {
                        // Push to FIFO
                        for (let i = 0; i < 8; i++) {
                            let b = this.bg_FIFO.push();
                            b!.pixel = ((this.fetch_bp0 & 0x80) >>> 7) | ((this.fetch_bp1 & 0x80) >>> 6);
                            this.fetch_bp0 <<= 1;
                            this.fetch_bp1 <<= 1;
                        }
                        this.bg_request_x += 8;
                        if ((this.ppu!.line_cycle < 88) && (!this.ppu!.in_window())) {
                            this.bg_request_x -= 8;
                            // Now discard some pixels for scrolling!
                            let sx = this.ppu!.io.SCX & 7;
                            this.bg_FIFO.discard(sx);
                        }
                        this.fetch_cycle = 0; // Restart fetching
                    }
                }
                // do NOT advance if BG_FIFO won't take it
                break;
            case 7: // sprite bp0 fetch
                this.fetch_bp0 = this.bus.mapper.PPU_read(this.fetch_addr);
                this.fetch_cycle = 8;
                break;
            case 8: // nothing
                this.fetch_cycle = 9;
                break;
            case 9: // sprite bp1 fetch, mix, & restart
                this.fetch_bp1 = this.bus.mapper.PPU_read(this.fetch_addr+1);
                this.sprites_queue.pop();
                this.obj_FIFO.sprite_mix(this.fetch_bp0, this.fetch_bp1, (this.fetch_obj!.attr & 0x80) >>> 7, (this.fetch_obj!.attr & 0x10) >>> 4, (this.fetch_obj!.attr & 0x20));
                this.sp_request--;
                this.fetch_cycle = 0;
                break;
        }
    }
}

class GB_PPU_sprites {
    num: u32 = 0
    index: u32 = 0
    search_index: u32 = 0
}

class GB_PPU_io {
    sprites_big: u32 = 0

    lyc: u32 = 0

    STAT_IF: u32 = 0
    STAT_IE: u32 = 0
    old_mask: u32 = 0

    window_tile_map_base: u32 = 0
    window_enable: u32 = 0
    bg_window_tile_data_base: u32 = 0
    bg_tile_map_base: u32 = 0
    obj_enable: u32 = 1
    bg_window_enable: u32 = 1

    SCX: u32 = 0 // X scroll
    SCY: u32 = 0 // Y scroll
    wx: u32 = 0 // Window X
    wy: u32 = 0 // Window Y

    IE: u32 = 0
    IF: u32 = 0
}


export class GB_PPU {
    variant: GB_variants
    clock: GB_clock
    bus: GB_bus

    slice_fetcher: GB_pixel_slice_fetcher

    line_cycle: u32 = 0
    cycles_til_vblank: i32 = 0
    enabled: bool = false
    display_upate: bool = false

    bg_palette: StaticArray<u8> = new StaticArray<u8>(4);
    sp_palette: StaticArray<StaticArray<u8>> = new StaticArray<StaticArray<u8>>(2);

    OAM: StaticArray<u8> = new StaticArray<u8>(160);
    OBJ: StaticArray<GB_PPU_sprite_t> = new StaticArray<GB_PPU_sprite_t>(10);

    io: GB_PPU_io = new GB_PPU_io();
    sprites: GB_PPU_sprites = new GB_PPU_sprites();
    out_buffer: StaticArray<usize> = new StaticArray<usize>(2);

    first_reset: bool = true;

    is_window_line: bool = false;
    window_triggered_on_line: bool = false;

    display_update: bool = false;

    last_used_buffer: u32 = 0
    cur_output_num: u32 = 0
    cur_buffer: usize = 0

    constructor(out_buffer: usize, variant: GB_variants, clock: GB_clock, bus: GB_bus) {
        this.out_buffer[0] = out_buffer;
        this.out_buffer[1] = out_buffer+((160*144)*2);
        this.cur_buffer = this.out_buffer[this.cur_output_num];
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;

        this.slice_fetcher = new GB_pixel_slice_fetcher(variant, clock, bus);
        this.bg_palette[0] = this.bg_palette[1] = this.bg_palette[2] = this.bg_palette[3] = 0;
        this.sp_palette[0] = new StaticArray<u8>(4);
        this.sp_palette[1] = new StaticArray<u8>(4);
        for (let i = 0; i < 2; i++) {
            this.sp_palette[0][i] = this.sp_palette[1][i] = 0;
        }

        for (let i = 0; i < 10; i++) {
            this.OBJ[i] = new GB_PPU_sprite_t();
        }

        this.bus.ppu = this;
        this.slice_fetcher.ppu = this;
        this.disable();
    }

    bg_tilemap_addr_window(wlx: u32): u32 {
        return (0x9800 | (this.io.window_tile_map_base << 10) |
            ((this.clock.wly >>> 3) << 5) |
            (wlx >>> 3)
        );
    }

    bg_tilemap_addr_nowindow(lx: u32): u32 {
        // LCDC3 enabled and X coord NOT inside window, 9c00 used
        // OR
        // LCDC6 enabled and inside window, 9C00 used

        return (0x9800 | ((this.io.bg_tile_map_base | this.io.bg_window_tile_data_base) << 10) |
            ((((this.clock.ly + this.io.SCY) & 0xFF) >>> 3) << 5) |
            (((lx) & 0xFF) >>> 3)
        );
    }

    bg_tile_addr_window(tn: u32): u32 {
        let b12: u32;
        if (this.io.bg_window_tile_data_base) b12 = 0;
        else b12 = ((tn & 0x80) ^ 0x80) << 5;
        return (0x8000 | b12 |
            (tn << 4) |
            ((this.clock.wly & 7) << 1)
        );
    }

    bg_tile_addr_nowindow(tn: u32): u32 {
        let b12: u32;
        if (this.io.bg_window_tile_data_base) b12 = 0;
        else b12 = ((tn & 0x80) ^ 0x80) << 5;
        return (0x8000 | b12 |
            (tn << 4) |
            ((((this.clock.ly + this.io.SCY) & 0xFF) & 7) << 1)
        );
    }

    write_OAM(addr: u32, val: u32): void {
        if ((addr >= 0xFE00) && (addr < 0xFEA0)) unchecked(this.OAM[addr - 0xFE00] = <u8>val);
    }

    read_OAM(addr: u32): u32 {
        if ((addr >= 0xFE00) && (addr < 0xFEA0)) return unchecked(this.OAM[addr - 0xFE00]);
        return 0xFF;
    }

    write_IO(addr: u32, val: u32): void {
        switch(addr) {
            case 0xFF01:
                /*let nstr = String.fromCharCode(val);
                this.console_str += nstr;
                console.log(this.console_str);*/
                break;
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
                if (this.variant === GB_variants.DMG) {
                    this.io.STAT_IE = 0x0F;
                    this.eval_STAT();
                }
                let mode0_enable = (val & 8) >>> 3;
                let mode1_enable = (val & 0x10) >>> 4;
                let mode2_enable = (val & 0x20) >>> 5;
                let lylyc_enable = (val & 0x40) >>> 6;
                this.io.STAT_IE = mode0_enable | (mode1_enable << 1) | (mode2_enable << 2) | (lylyc_enable << 3);
                this.eval_STAT();
                return;
            case 0xFF42: // SCY
                //console.log('SCY!', val);
                this.io.SCY = val;
                return;
            case 0xFF43: // SCX
                this.io.SCX = val;
                return;
            case 0xFF45: // LYC
                this.io.lyc = val;
                //console.log('LYC:', this.io.lyc)
                if (this.enabled) this.eval_lyc();
                return;
            case 0xFF4A: // window Y
                this.io.wy = val;
                return;
            case 0xFF4B: // window x + 7
                this.io.wx = val+1;
                return;
            case 0xFF47: // BGP pallete
                //if (!this.clock.CPU_can_VRAM) return;
                unchecked(this.bg_palette[0] = <u8>(val & 3));
                unchecked(this.bg_palette[1] = <u8>((val >>> 2) & 3));
                unchecked(this.bg_palette[2] = <u8>((val >>> 4) & 3));
                unchecked(this.bg_palette[3] = <u8>((val >>> 6) & 3));
                return;
            case 0xFF48: // OBP0 sprite palette 0
                //if (!this.clock.CPU_can_VRAM) return;
                unchecked(this.sp_palette[0][0] = <u8>(val & 3));
                unchecked(this.sp_palette[0][1] = <u8>((val >>> 2) & 3));
                unchecked(this.sp_palette[0][2] = <u8>((val >>> 4) & 3));
                unchecked(this.sp_palette[0][3] = <u8>((val >>> 6) & 3));
                return;
            case 0xFF49: // OBP1 sprite palette 1
                //if (!this.clock.CPU_can_VRAM) return;
                unchecked(this.sp_palette[1][0] = <u8>(val & 3));
                unchecked(this.sp_palette[1][1] = <u8>((val >>> 2) & 3));
                unchecked(this.sp_palette[1][2] = <u8>((val >>> 4) & 3));
                unchecked(this.sp_palette[1][3] = <u8>((val >>> 6) & 3));
                return;

        }
    }

    read_IO(addr: u32, val: u32, has_effect: bool = true): u32 {
        switch(addr) {
            case 0xFF40: // LCDC LCD Control
                let e: u32 = this.enabled ? 0x80: 0;
                return e | (this.io.window_tile_map_base << 6) | (this.io.window_enable << 5) | (this.io.bg_window_tile_data_base << 4) |
                    (this.io.bg_tile_map_base << 3) | (this.io.sprites_big << 2) |
                    (this.io.obj_enable << 1) | (this.io.bg_window_enable);
            case 0xFF41: // STAT LCD status
                let mode0_enable = this.io.IE & 1;
                let mode1_enable = (this.io.IE & 2) >>> 1;
                let mode2_enable = (this.io.IE & 4) >>> 2;
                let lylyc_enable = (this.io.IE & 8) >>> 3;
                return this.clock.ppu_mode |
                    ((this.clock.ly === this.io.lyc) ? 1 : 0) |
                    (mode0_enable << 3) |
                    (mode1_enable << 4) |
                    (mode2_enable << 5) |
                    (lylyc_enable << 6);
            case 0xFF42: // SCY
                return this.io.SCY;
            case 0xFF43: // SCX
                return this.io.SCX;
            case 0xFF44: // LY
                /*console.log('READ FF44!', this.clock.ly);
                if (this.clock.ly === 0x90) dbg.break();*/
                let ly = this.clock.ly;
                if ((ly === 153) && (this.line_cycle > 1)) ly = 0;
                return ly;
            case 0xFF45: // LYC
                return this.io.lyc;
            case 0xFF4A: // window Y
                return this.io.wy;
            case 0xFF4B: // window x + 7
                return this.io.wx;
            case 0xFF47: // BGP
                //if (!this.clock.CPU_can_VRAM) return 0xFF;
                return unchecked(this.bg_palette[0]) | (unchecked(this.bg_palette[1]) << 2) | (unchecked(this.bg_palette[2]) << 4) | (unchecked(this.bg_palette[3]) << 6);
            case 0xFF48: // OBP0
                //if (!this.clock.CPU_can_VRAM) return 0xFF;
                return unchecked(this.sp_palette[0][0]) | (unchecked(this.sp_palette[0][1]) << 2) | (unchecked(this.sp_palette[0][2]) << 4) | (unchecked(this.sp_palette[0][3]) << 6);
            case 0xFF49: // OBP1
                //if (!this.clock.CPU_can_VRAM) return 0xFF;
                return unchecked(this.sp_palette[1][0]) | (unchecked(this.sp_palette[1][1]) << 2) | (unchecked(this.sp_palette[1][2]) << 4) | (unchecked(this.sp_palette[1][3]) << 6);
        }
        return 0xFF;
    }

    disable(): void {
        if (!this.enabled) return;
        this.enabled = false;
        console.log('DISABLE PPU')
        this.clock.CPU_can_VRAM = 1;
        this.clock.setCPU_can_OAM(1);
        this.io.STAT_IF = 0;
        this.eval_STAT();
    }

    enable(): void {
        if (this.enabled) return;
        console.log('ENABLE PPU');
        this.enabled = true;
        this.advance_frame(false)
        this.clock.lx = 0;
        this.clock.ly = 0;
        this.line_cycle = 0;
        this.cycles_til_vblank = 0;
        this.io.STAT_IF = 0;
        this.set_mode(GB_PPU_modes.OAM_search);
        this.eval_lyc();
        this.eval_STAT();
    }

    set_mode(which: GB_PPU_modes): void {
        if (this.clock.ppu_mode == which) return;
        this.clock.ppu_mode = which;

        switch(which) {
            case GB_PPU_modes.OAM_search: // 2. after vblank, so after 1
                this.clock.setCPU_can_OAM(0);
                this.clock.CPU_can_VRAM = 1;
                if (this.enabled) {
                    this.bus.IRQ_vblank_down();
                    this.IRQ_mode1_down();
                    this.IRQ_mode2_up();
                }
                break;
            case GB_PPU_modes.pixel_transfer: // 3, comes after 2
                this.IRQ_mode2_down();
                this.clock.CPU_can_VRAM = 0;
                this.clock.setCPU_can_OAM(0);
                this.slice_fetcher.advance_line();
                break;
            case GB_PPU_modes.HBLANK: // 0, comes after 3
                this.IRQ_mode0_up();
                this.clock.CPU_can_VRAM = 1;
                this.clock.setCPU_can_OAM(1);
                break;
            case GB_PPU_modes.VBLANK: // 1, comes after 0
                this.IRQ_mode0_down();
                this.IRQ_mode1_up();
                this.IRQ_vblank_up();
                this.clock.CPU_can_VRAM = 1;
                this.clock.setCPU_can_OAM(1);
                break;
        }
    }

    run_cycles(howmany: u32): void {
        // We don't do anything, and in fact are off, if LCD is off
        for (let i: u32 = 0; i < howmany; i++) {
            if (this.cycles_til_vblank) {
                this.cycles_til_vblank--;
                if (this.cycles_til_vblank === 0)
                    this.bus.IRQ_vblank_up();
            }
            if (this.enabled) {
                this.cycle();
                this.line_cycle++;
                if (this.line_cycle === 456) this.advance_line();
            }
            if (dbg.do_break) break;
        }
    }

    advance_line(): void {
        if (this.window_triggered_on_line) this.clock.wly++;
        this.clock.lx = 0;
        this.clock.ly++;
        // @ts-ignore
        this.is_window_line = this.is_window_line | (this.clock.ly == this.io.wy);
        this.window_triggered_on_line = false;
        this.line_cycle = 0;
        if (this.clock.ly >= 154)
            this.advance_frame();
        if (this.enabled) {
            this.eval_lyc();
            if (this.clock.ly < 144)
                this.set_mode(GB_PPU_modes.OAM_search); // OAM search
            else if (this.clock.ly === 144)
                this.set_mode(GB_PPU_modes.VBLANK); // VBLANK
        }
    }

    // TODO: trigger IRQ if enabled properly
    @inline eval_lyc(): void {
        let cly: u32 = this.clock.ly;
        if ((cly === 153) && (this.io.lyc !== 153)) cly = 0;
        if (cly === this.io.lyc) {
            this.IRQ_lylyc_up();
        }
        else
            this.IRQ_lylyc_down();
    }

    @inline IRQ_lylyc_up(): void {
        this.io.STAT_IF |= 8;
        this.eval_STAT();
    }

    @inline IRQ_lylyc_down(): void {
        this.io.STAT_IF &= 0xF7;
        this.eval_STAT();
    }

    @inline IRQ_mode0_up(): void {
        this.io.STAT_IF |= 1;
        this.eval_STAT();
    }

    @inline IRQ_mode0_down(): void {
        this.io.STAT_IF &= 0xFE;
        this.eval_STAT();
    }

    @inline IRQ_vblank_up(): void {
        this.cycles_til_vblank = 2;
    }

    @inline IRQ_mode1_up(): void {
        this.io.STAT_IF |= 2;
        this.eval_STAT();
    }

    @inline IRQ_mode1_down(): void {
        this.io.STAT_IF &= 0xFD;
        this.eval_STAT();
    }

    @inline IRQ_mode2_up(): void {
        this.io.STAT_IF |= 4;
        this.eval_STAT();
    }

    @inline IRQ_mode2_down(): void {
        this.io.STAT_IF &= 0xFB;
        this.eval_STAT();
    }

    eval_STAT(): void {
        let mask = this.io.STAT_IF & this.io.STAT_IE;
        if ((this.io.old_mask === 0) && (mask !== 0)) {
            this.bus.cpu!.cpu.regs.IF |= 2;
        }
        else {
            //console.log('DID NOT TRIGGER STAT!');
        }
        this.io.old_mask = mask;
    }

    advance_frame(update_buffer: bool = true): void {
        this.clock.ly = 0;
        this.clock.wly = 0;
        if (this.enabled) {
            this.display_update = true;
        }
        this.clock.frames_since_restart++;
        this.clock.master_frame++;
        this.is_window_line = false;
        if (update_buffer) {
            this.last_used_buffer = this.cur_output_num;
            this.cur_output_num ^= 1;
            this.cur_buffer = this.out_buffer[this.cur_output_num];
        }
    }

    /********************/
    OAM_search(): void {
        if (this.line_cycle != 75) return;

        // Check if a sprite is at the right place
        this.sprites.num = 0;
        this.sprites.index = 0;
        this.sprites.search_index = 0;
        for (let i = 0; i < 10; i++) {
            let o = unchecked(this.OBJ[i]);
            o.x = 0;
            o.y = 0;
            o.in_q = 0;
        }

        let cly: i32 = <i32>this.clock.ly;

        for (let i = 0; i < 40; i++) {
            if (this.sprites.num === 10) break;
            let sy: i32 = <i32>(unchecked(this.OAM[this.sprites.search_index]) - 16);
            let sy_bottom: i32 = sy + (this.io.sprites_big ? 16 : 8);
            if ((cly >= sy) && (cly < sy_bottom)) {
                let o_sn = unchecked(this.OBJ[this.sprites.num]);
                o_sn.y = sy;
                o_sn.x = unchecked(this.OAM[this.sprites.search_index + 1] - 1);
                o_sn.tile = unchecked(this.OAM[this.sprites.search_index + 2]);
                o_sn.attr = unchecked(this.OAM[this.sprites.search_index + 3]);
                o_sn.in_q = 0;

                this.sprites.num++;
            }
            this.sprites.search_index += 4
        }
    }

    @inline in_window(): bool {
        return this.io.window_enable && this.is_window_line && (this.clock.lx >= this.io.wx);
    }

    pixel_transfer(): void {
        if ((this.io.window_enable) && ((this.clock.lx) === this.io.wx) && this.is_window_line && !this.window_triggered_on_line) {
            this.slice_fetcher.trigger_window();
            this.window_triggered_on_line = true;
        }
        let p: GB_px = this.slice_fetcher.cycle();

        if (p.had_pixel) {
            if (this.clock.lx > 7) {
                let cv: u8;
                if (p.bg_or_sp === 0) {
                    cv = unchecked(this.bg_palette[p.color]);
                } else {
                    cv = unchecked(this.sp_palette[p.palette][p.color]);
                }
                store<u16>(this.cur_buffer+(((this.clock.ly * 160) + (this.clock.lx - 8))*2), <u8>cv);
            }
            this.clock.lx++;
        }
    }

    /*******************/
    cycle(): void {
        // During HBlank and VBlank do nothing...
        if (this.clock.ly > 143) return;
        if (this.clock.ppu_mode < 2) return;

        // Clear sprites
        if (this.line_cycle === 0) {
            this.set_mode(GB_PPU_modes.OAM_search); // OAM search
        }

        switch (this.clock.ppu_mode) {
            case GB_PPU_modes.OAM_search: // OAM search 0-80
                // 80 dots long, 2 per entry, find up to 10 sprites 0...n on this line
                this.OAM_search();
                if (this.line_cycle === 79) this.set_mode(GB_PPU_modes.pixel_transfer);
                break;
            case GB_PPU_modes.pixel_transfer: // Pixel transfer. Rendering time!
                this.pixel_transfer();
                if (this.clock.lx > 167)
                    this.set_mode(GB_PPU_modes.HBLANK);
                break;
        }
    }

    reset(): void {
        // Reset variables
        this.clock.lx = 0;
        this.clock.ly = 0;
        this.line_cycle = 0;
        this.display_update = false;
        this.cycles_til_vblank = 0;

        // Reset IRQs
        //this.io.STAT_IE = 0; // Interrupt enables
        //this.io.STAT_IF = 0; // Interrupt flags
        //this.io.old_mask = 0;

        //this.eval_STAT();

        // Set mode to OAM search
        this.set_mode(GB_PPU_modes.OAM_search);
        this.first_reset = false;
   }

   quick_boot(): void {
        switch(this.variant) {
            case GB_variants.DMG:
                this.enabled = true;
                //let val = 0xFC;
                //this.clock.ly = 90;
                this.write_IO(0xFF40, 0x91);
                this.write_IO(0xFF41, 0x85);
                this.write_IO(0xFF47, 0xFC);
                this.io.lyc = 0;
                this.io.SCX = this.io.SCY = 0;

                this.advance_frame();
                break;
            case GB_variants.GBC:
                this.write_IO(0xFF40, 0x91);
                this.write_IO(0xFF47, 0xFC);

                this.io.lyc = 0;
                this.io.SCX = this.io.SCY = 0;

                break;
            default:
                console.log('QUICKBOOT NOT SUPPROTEDO N THSI GAMEBOY MODEL');
                break;
        }
   }
}
