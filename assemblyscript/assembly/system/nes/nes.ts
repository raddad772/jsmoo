import {input_map_keypoint, machine_description, MD_STANDARD, MD_TIMING, systemEmulator} from "../interface"
import {m6502} from "../../component/cpu/m6502/m6502"
import {NES_clock, NES_bus, NES_VARIANTS} from "./nes_common"
import {NES_ppu} from "./nes_ppu";
import {NES_cart} from "./nes_cart";
import {ricoh2A03} from "./cpu/r2a03";
import {dbg} from "../../helpers/debug";

let NES_inputmap: Array<input_map_keypoint> = new Array<input_map_keypoint>(16);
// p1                                    p2
// Up down left right a b start select

function fill_NES_inputmap(): void {
    for (let i = 0; i < 16; i++) {
        let kp = new input_map_keypoint();
        let uber: String = (i < 8) ? 'p1' : 'p2';
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = uber;
        switch(i) {
            case 0:
            case 8:
                kp.name = 'up';
                break;
            case 1:
            case 9:
                kp.name = 'down';
                break;
            case 2:
            case 10:
                kp.name = 'left';
                break;
            case 3:
            case 11:
                kp.name = 'right';
                break;
            case 4:
            case 12:
                kp.name = 'a';
                break;
            case 5:
            case 13:
                kp.name = 'b';
                break;
            case 6:
            case 14:
                kp.name = 'start';
                break;
            case 7:
            case 15:
                kp.name = 'select';
                break;
        }
        NES_inputmap[i] = kp;
    }
}
fill_NES_inputmap();

export class nespad_inputs {
    a: u32 = 0;
    b: u32 = 0;
    start: u32 = 0;
    select: u32 = 0;
    up: u32 = 0;
    down: u32 = 0;
    left: u32 = 0;
    right: u32 = 0;
}

export class NES implements systemEmulator {
    cpu: ricoh2A03
    ppu: NES_ppu
    variant: NES_VARIANTS
    cart: NES_cart
    bus: NES_bus
    clock: NES_clock
    cycles_left: i32
    decode_array: StaticArray<u32> = new StaticArray<u32>(16);
    controller1_in: nespad_inputs = new nespad_inputs();
    controller2_in: nespad_inputs = new nespad_inputs();

    constructor(variant: NES_VARIANTS) {
        this.variant = variant
        this.clock = new NES_clock(variant);
        this.bus = new NES_bus();
        this.cpu = new ricoh2A03(this.clock, this.bus);
        this.ppu = new NES_ppu(variant, this.clock, this.bus)
        this.cart = new NES_cart(this.clock, this.bus);
        this.bus.ppu = this.ppu;
        this.bus.cpu = this.cpu;
        this.cycles_left = 0;
    }

    present(ab: usize): void {
        this.ppu.present(ab)
    }

    map_inputs(bufptr: usize): void {
        // Hardcoded yo!
        this.controller1_in.up = load<u32>(bufptr);
        this.controller1_in.down = load<u32>(bufptr+(4));
        this.controller1_in.left = load<u32>(bufptr+(4*2));
        this.controller1_in.right = load<u32>(bufptr+(4*3));
        this.controller1_in.a = load<u32>(bufptr+(4*4));
        this.controller1_in.b = load<u32>(bufptr+(4*5));
        this.controller1_in.start = load<u32>(bufptr+(4*6));
        this.controller1_in.select = load<u32>(bufptr+(4*7));
        this.controller2_in.up = load<u32>(bufptr+(4*8));
        this.controller2_in.down = load<u32>(bufptr+(4*9));
        this.controller2_in.left = load<u32>(bufptr+(4*101));
        this.controller2_in.right = load<u32>(bufptr+(4*11));
        this.controller2_in.a = load<u32>(bufptr+(4*12));
        this.controller2_in.b = load<u32>(bufptr+(4*13));
        this.controller2_in.start = load<u32>(bufptr+(4*14));
        this.controller2_in.select = load<u32>(bufptr+(4*15));
        this.cpu.update_inputs(this.controller1_in, this.controller2_in);
    }

    get_description(): machine_description {
        let md = new machine_description();
        md.name = 'Nintendo Entertainment System';
        md.fps = 60;
        md.timing = MD_TIMING.frame;
        md.standard = MD_STANDARD.NSTC;
        md.x_resolution = 256;
        md.y_resolution = 240;
        for (let i = 0, k = NES_inputmap.length; i < k; i++) {
            md.keymap.push(NES_inputmap[i]);
        }
        return md;
    }

    killall(): void {

    }

    get_screenvars(): Uint32Array {
        let r = new Uint32Array(3);
        return r;
    }

    update_inputs(): void {

    }

    finish_frame(): void {
        let current_frame: u64 = this.clock.master_frame;
        while (this.clock.master_frame === current_frame) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }

    }

    finish_scanline(): void {
        let cpu_step: u32 = this.clock.timing.cpu_divisor;
        let ppu_step: u32 = this.clock.timing.ppu_divisor;
        let done: u32 = 0;
        let start_y: u32 = this.clock.ppu_y;
        while (this.clock.ppu_y === start_y) {
            this.clock.master_clock += cpu_step;
            this.cpu.run_cycle();
            this.bus.mapper.cycle(1);
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;
            let ppu_left = this.clock.master_clock - this.clock.ppu_master_clock;
            done = 0;
            while (ppu_left >= ppu_step) {
                ppu_left -= ppu_step;
                done++;
            }
            this.ppu.cycle(done);
            this.cycles_left -= cpu_step;
            if (dbg.do_break) break;
        }
    }

    step_master(cycles: u32): void {

    }

    reset(): void {
        this.cpu.reset();
        //this.ppu.reset();
        this.clock.reset();
        this.cart.reset();
    }

    // NES has no BIOS
    load_BIOS(): void {
    }

    load_ROM(what: usize, sz: u32): void {
        this.cart.load_cart_from_RAM(what, sz);
        this.reset();
    }
}