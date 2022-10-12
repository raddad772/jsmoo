import {machine_description, MD_STANDARD, MD_TIMING, systemEmulator} from "../interface.ts"
import {m6502} from "../../component/cpu/m6502/m6502"

export class NES implements systemEmulator {
    cpu: m6502
    constructor() {
        this.cpu = new m6502();
    }

    get_description(): machine_description {
        let md = new machine_description();
        md.name = 'Nintendo Entertainment System';
        md.technical.fps = 60;
        md.technical.timing = MD_TIMING.frame;
        md.technical.standard = MD_STANDARD.NSTC;
        md.technical.x_resolution = 256;
        md.technical.y_resolution = 224;
        return md;
    }

    get_screenvars(): Uint32Array {
        let r = new Uint32Array(3);
        return r;
    }

    update_inputs(): void {

    }

    finish_frame(): void {

    }

    finish_scanline(): void {
    }

    step_master(cycles: u32): void {

    }

    reset(): void {

    }

    // NES has no BIOS
    load_BIOS(): void {
    }

    load_ROM(): void {

    }

}