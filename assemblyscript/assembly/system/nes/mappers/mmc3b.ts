import {NES_a12_watcher_t, NES_mapper} from "./interface";
import {NES_bus, NES_clock} from "../nes_common";
import {NES_cart} from "../nes_cart";

export class NES_MMC3b implements NES_mapper {
    clock: NES_clock
    bus: NES_bus
    a12_watcher: NES_a12_watcher_t
    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;
        this.a12_watcher = new NES_a12_watcher_t(clock);
    }

    cycle(howmany: u32) : void {

    }

    CPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        return 40;
    }

    CPU_write(addr: u32, val: u32): void {

    }

    PPU_read(addr: u32, val: u32, has_effect: u32): u32 {
        console.log('GOT ALL THE WAY HERE!');
        return 4;
    }

    PPU_write(addr: u32, val: u32): void {

    }

    reset(): void {

    }

    set_cart(cart: NES_cart): void {

    }
}