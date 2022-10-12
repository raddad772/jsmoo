/*
export interface systemEmulator {
    //serialize(): funcref,
    //deserialize()
    get_description(): machine_description;
    get_screenvars(): Uint32Array;
    finish_frame(): void;
    finish_scanline(): void;
    update_inputs(): void;
    step_master(cycles: u32): void;
    reset(): void;
    load_ROM(): void;
    load_BIOS(): void;
}

 */


import {NES_bus, NES_clock} from "../nes_common";
import {NES_cart} from "../nes_cart";

export class NES_a12_watcher_t {
    clock: NES_clock
    constructor(clock: NES_clock) {
        this.clock = clock;
    }

    update(addr: u32): u32 {
        return 0;
    }
}

export interface NES_mapper {
    a12_watcher: NES_a12_watcher_t; // For mappers that watch A12 for IRQs
    cycle(howmany: u32): void; // For VRC cycle-counting IRQs
    CPU_read(addr: u32, val: u32, has_effect: u32): u32;
    CPU_write(addr: u32, val: u32): void;
    PPU_read(addr: u32, val: u32, has_effect: u32): u32;
    PPU_write(addr: u32, val: u32): void;
    reset(): void;
    set_cart(cart: NES_cart): void;
}