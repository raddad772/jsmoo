import {NES_VARIANTS, NES_clock, NES_bus} from "./nes_common";

export class NES_ppu {
    clock: NES_clock
    bus: NES_bus
    variant: NES_VARIANTS
    constructor(variant: NES_VARIANTS, clock: NES_clock, bus: NES_bus) {
        this.variant = variant;
        this.clock = clock;
        this.bus = bus;
    }

    reset(): void {

    }

    cycle(howmany: u32): void {

    }
}