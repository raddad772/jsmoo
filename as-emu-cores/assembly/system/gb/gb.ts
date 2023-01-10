import {GB_PPU_modes, GB_variants} from "./gb_common";
import {GB_cart} from "./gb_cart";
import {GB_mapper} from "./mappers/interface";
import {GB_CPU} from "./gb_cpu";
import {hex4} from "../../helpers/helpers";
import {GB_PPU} from "./gb_ppu";
import {framevars_t} from "../../glue/global_player";
import {
    console_mt_struct,
    input_map_keypoint,
    machine_description,
    MD_STANDARD,
    MD_TIMING,
    systemEmulator
} from "../interface";
import {dbg} from "../../helpers/debug";

export const GB_QUICK_BOOT = true;

let GB_inputmap: Array<input_map_keypoint> = new Array<input_map_keypoint>(8);
function fill_GB_inputmap(): void {
    for (let i = 0; i < 8; i++) {
        let kp = new input_map_keypoint();
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = 'p1';
        switch(i) {
            case 0:
                kp.name = 'up';
                break;
            case 1:
                kp.name = 'down';
                break;
            case 2:
                kp.name = 'left';
                break;
            case 3:
                kp.name = 'right';
                break;
            case 4:
                kp.name = 'a';
                break;
            case 5:
                kp.name = 'b';
                break;
            case 6:
                kp.name = 'start';
                break;
            case 7:
                kp.name = 'select';
                break;
        }
        GB_inputmap[i] = kp;
    }
}
fill_GB_inputmap();

const GB_CYCLES_PER_FRAME: u32 = 70224
const GB_CYCLES_PER_SCANLINE: u32 = GB_CYCLES_PER_FRAME / 154;

export class gb_inputs {
    a: u32 = 0;
    b: u32 = 0;
    start: u32 = 0;
    select: u32 = 0;
    up: u32 = 0;
    down: u32 = 0;
    left: u32 = 0;
    right: u32 = 0;
}

class GB_clock_timing {
    ppu_divisor: u32 = 1
    cpu_divisor: u32 = 4
    apu_divisor: u32 = 4
}

export class GB_clock {
    ppu_mode: GB_PPU_modes = GB_PPU_modes.OAM_search; // PPU mode. OAM search, etc.
    frames_since_restart: u32 = 0;
    master_frame: u32 = 0;

    cycles_left_this_frame: i32 = GB_CYCLES_PER_FRAME;

    trace_cycles: u32 = 0;

    master_clock: u32 = 0;
    ppu_master_clock: u32 = 0;
    cpu_master_clock: u32 = 0;

    ly: u32 = 0;
    lx: u32 = 0;

    wly: u32 = 0;

    cpu_frame_cycle: u32 = 0;
    ppu_frame_cycle: u32 = 0;
    CPU_can_VRAM: u32 = 1;
    old_OAM_can: u32 = 0;
    CPU_can_OAM: u32 = 0;
    bootROM_enabled: bool = true;

    //irq = new GB_clock_irq();
    timing: GB_clock_timing = new GB_clock_timing();

    reset(): void {
        this.ppu_mode = 2;
        this.frames_since_restart = 0;
        this.master_clock = 0;
        this.cpu_master_clock = 0;
        this.ppu_master_clock = 0;
        this.lx = 0;
        this.ly = 0;
        this.timing.ppu_divisor = 1;
        this.timing.cpu_divisor = 4;
        this.cpu_frame_cycle = 0;
        this.ppu_frame_cycle = 0;
        this.CPU_can_VRAM = 1;
        this.CPU_can_OAM = 0;
        this.bootROM_enabled = true;
    }

    setCPU_can_OAM(to: u32): void {
        this.CPU_can_OAM = to;
        this.old_OAM_can = to;
    }
}

export class GBmappernull implements GB_mapper {
    reset(): void {
        console.log('SHOULDNT GET HERE 1');
    }

    CPU_read(addr: u32, val: u32): u32 {
        console.log('SHOULDNT GET HERE 2');
        return 0xFF;
    }

    CPU_write(addr: u32, val: u32): void {
        console.log('SHOULDNT GET HERE 3');
    }

    PPU_read(addr: u32): u32 {
        console.log('SHOULDNT GET HERE 4');
        return 0xFF;
    }

    set_cart(cart: GB_cart, BIOS: Uint8Array): void {
        console.log('SHOULDNT GET HERE 5');
    }

}

export class GB_bus {
    cart: GB_cart|null = null;
    mapper: GB_mapper = new GBmappernull()
    ppu: GB_PPU|null = null;
    cpu: GB_CPU|null = null;

    BIOS: Uint8Array = new Uint8Array(0)

    constructor() {
    }

    load_BIOS_from_RAM(what: usize, sz: u32): void {
        this.BIOS = new Uint8Array(sz);
        for (let i = 0; i < sz; i++) {
            this.BIOS[i] = load<u8>(what+i);
        }
    }

    CPU_read_IO(addr: u32, val: u32, has_effect: bool = true): u32 {
        let out = 0xFF;
        out &= this.cpu!.read_IO(addr, val, has_effect);
        out &= this.ppu!.read_IO(addr, val, has_effect);
        return out;
    }

    CPU_write_IO(addr: u32, val: u32): void {
        this.cpu!.write_IO(addr, val);
        this.ppu!.write_IO(addr, val);
    }

    DMA_read(addr: u32): u32 {
        return this.mapper.CPU_read(addr, 0);

        if (addr >= 0xA000) {
            console.log('IMPLEMENT OAM >0xA000!' + hex4(addr));
        } else {
            return this.mapper.CPU_read(addr, 0);
        }
    }

    IRQ_vblank_down(): void {
        //console.log('VBLANK DOWN!', this.cpu.cpu.regs.IF);
    }

    IRQ_vblank_up(): void {
        this.cpu!.cpu.regs.IF |= 1;
        //console.log('VBLANK UP!', this.ppu.clock.master_frame, this.cpu.cpu.regs.IE, this.cpu.cpu.regs.IF, this.cpu.cpu.regs.IE & this.cpu.cpu.regs.IF);
    }
}

export class GameBoy implements systemEmulator {
    bus: GB_bus
    clock: GB_clock
    cpu: GB_CPU
    ppu: GB_PPU
    variant: GB_variants
    out_buffer: usize
    controller_in: gb_inputs = new gb_inputs();
    framevars: framevars_t = new framevars_t();
    cycles_left: i32 = 0
    cart: GB_cart

    constructor(variant: GB_variants, out_buffer: usize) {
        this.variant = variant;
        let clock = new GB_clock();
        let bus = new GB_bus();
        let cpu = new GB_CPU(variant, clock, bus)
        let ppu = new GB_PPU(out_buffer, variant, clock, bus)

        this.cart = new GB_cart(variant, clock, bus);

        this.out_buffer = out_buffer;
        this.bus = bus;
        this.clock = clock;
        this.cpu = cpu;
        this.ppu = ppu;
    }

    map_inputs(bufptr: usize): void {
        this.controller_in.up = load<u32>(bufptr);
        this.controller_in.down = load<u32>(bufptr+(4));
        this.controller_in.left = load<u32>(bufptr+(4*2));
        this.controller_in.right = load<u32>(bufptr+(4*3));
        this.controller_in.a = load<u32>(bufptr+(4*4));
        this.controller_in.b = load<u32>(bufptr+(4*5));
        this.controller_in.start = load<u32>(bufptr+(4*6));
        this.controller_in.select = load<u32>(bufptr+(4*7));
        this.cpu.update_inputs(this.controller_in);
    }

    get_framevars(): framevars_t {
        this.framevars.master_frame = this.clock.master_frame;
        this.framevars.x = this.clock.lx;
        this.framevars.scanline = this.clock.ly;
        return this.framevars;
    }

    get_description(): machine_description {
        let d = new machine_description();
        d.name = 'GameBoy';
        switch(this.variant) {
            case GB_variants.GBC:
                d.name = 'GameBoy Color';
                break;
            case GB_variants.SGB:
                d.name = 'Super GameBoy';
                break;
        }
        d.fps = 60;
        d.timing = MD_TIMING.frame;
        d.standard = MD_STANDARD.LCD;
        d.x_resolution = 160;
        d.y_resolution = 144;
        d.xrh = 160;
        d.xrw = 144;

        d.overscan.top = 0;
        d.overscan.bottom = 0;
        d.overscan.left = 0;
        d.overscan.right = 0;

        d.out_size = (160*144*4);

        for (let i = 0, k = GB_inputmap.length; i < k; i++) {
            d.keymap.push(GB_inputmap[i]);
        }
        return d;
    }

    killall(): void {

    }

    finish_frame(): u32 {
        let cycles_left: i32 = this.clock.cycles_left_this_frame;
        this.step_master(cycles_left);
        return this.ppu.last_used_buffer;
    }

    finish_scanline(): u32 {
        console.log('STEP SCANLINE NOT SUPPORT GB AS YET')
        return this.ppu.last_used_buffer ^ 1;
    }

    step_master(howmany: u32): u32 {
        this.cycles_left += <i32>howmany;
        let cpu_step = this.clock.timing.cpu_divisor;
        while (this.cycles_left > 0) {
            this.clock.cycles_left_this_frame--;
            if (this.clock.cycles_left_this_frame <= 0) this.clock.cycles_left_this_frame += GB_CYCLES_PER_FRAME;
            if ((this.clock.master_clock & 3) === 0) {
                this.cpu.cycle();
                this.clock.cpu_frame_cycle++;
                this.clock.cpu_master_clock += cpu_step;
            }
            this.clock.master_clock++;
            this.ppu.run_cycles(1);
            this.clock.ppu_master_clock += 1;
            this.cycles_left--;
            if (dbg.do_break) break;
        }
        return this.ppu.last_used_buffer ^ 1;
    }

    reset(): void {
        this.clock.reset();
        this.cpu.reset();
        this.ppu.reset();
        if (this.cart.mapper !== null)
            this.cart.mapper.reset();
        if (GB_QUICK_BOOT) {
            this.ppu.quick_boot();
            this.cpu.quick_boot();
        }
    }

    load_ROM(name: string, what: usize, sz: u32): void {
        this.cart.load_ROM_from_RAM(what, sz);
        this.reset();
    }

    load_BIOS(what: usize, sz: u32): void {
        this.bus.load_BIOS_from_RAM(what, sz);
    }

    play(): void {};
    pause(): void {};
    stop(): void {};
    get_mt_struct(): console_mt_struct {
        return new console_mt_struct();
    }
}
