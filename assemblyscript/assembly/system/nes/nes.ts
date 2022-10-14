import {machine_description, MD_STANDARD, MD_TIMING, systemEmulator} from "../interface"
import {m6502} from "../../component/cpu/m6502/m6502"
import {NES_clock, NES_bus, NES_VARIANTS} from "./nes_common"
import {NES_ppu} from "./nes_ppu";
import {NES_cart} from "./nes_cart";
import {ricoh2A03} from "./cpu/r2a03";
import {dbg} from "../../helpers/debug";

export class NES implements systemEmulator {
    cpu: ricoh2A03
    ppu: NES_ppu
    variant: NES_VARIANTS
    cart: NES_cart
    bus: NES_bus
    clock: NES_clock
    cycles_left: i32

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

    get_description(): machine_description {
        let md = new machine_description();
        md.name = 'Nintendo Entertainment System';
        md.fps = 60;
        md.timing = MD_TIMING.frame;
        md.standard = MD_STANDARD.NSTC;
        md.x_resolution = 256;
        md.y_resolution = 224;
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
            //this.cart.mapper.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;
            let ppu_left = this.clock.master_clock - this.clock.ppu_master_clock;
            done = 0;
            while (ppu_left >= ppu_step) {
                ppu_left -= ppu_step;
                done += ppu_step;
            }
            this.ppu.cycle(done / ppu_step);
            this.clock.ppu_master_clock += done;
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

    load_ROM(what: Uint8Array): void {
        this.cart.load_cart_from_RAM(what);
        this.reset();
    }
}