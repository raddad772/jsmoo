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

export const NES_palette = new Array<RGBval>(64);
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
for (let i = 0; i < 64; i++) NES_palette[i] = NES_get_RGB(i);

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

    line_cycle: u32 = 0;
    OAM: Uint8Array = new Uint8Array(256);
    secondary_OAM: Uint8Array = new Uint8Array(32);
    secondary_OAM_index: u32 = 0;
    secondary_OAM_sprite_index: u32 = 0;
    secondary_OAM_sprite_total: u32 = 0;
    secondary_OAM_lock: bool = false;

    OAM_transfer_latch: u32 = 0;
    OAM_eval_index: u32 = 0;
    OAM_eval_done: bool = false;

    sprite0_on_next_line: bool = false;
    sprite0_on_this_line: bool = false;

    CGRAM: Uint8Array = new Uint8Array(32);
    output: Uint8Array = new Uint8Array(256*240);

    bg_fetches: Uint64Array = new Uint64Array(4);
    bg_shifter: u64 = 0;
    bg_palette_shifter: u32 = 0;
    bg_tile_fetch_addr: u32 = 0;
    bg_tile_fetch_buffer: u32 = 0;
    sprite_pattern_shifters: Uint32Array = new Uint32Array(8);
    sprite_attribute_latches: Uint32Array = new Uint32Array(8);
    sprite_x_counters: Int32Array = new Int32Array(8);
    sprite_y_lines: Int32Array = new Int32Array(8);

    io: NES_PPU_io = new NES_PPU_io();
    status: NES_PPU_status = new NES_PPU_status();
    latch: NES_PPU_latch = new NES_PPU_latch();

    constructor(variant: NES_VARIANTS, clock: NES_clock, bus: NES_bus) {
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;


        this.bus.ppu = this;
    }

    reset(): void {
        this.line_cycle = 0;
        this.io.w = 0;
    }

    write_cgram(addr: u32, val: u32): void {
        if ((addr & 0x13) === 0x10) addr &= 0xEF;
        this.CGRAM[addr & 0x1F] = val & 0x3F;
    }

    read_cgram(addr: u32): u32 {
      if((addr & 0x13) === 0x10) addr &= 0xEF;
      let data: u32 = this.CGRAM[addr & 0x1F];
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

    cycle(howmany: u32): void {

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
                output = this.OAM[this.io.OAM_addr];
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