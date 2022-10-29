"use strict";

class GB_MAPPER_MBC1 {
    /**
     * @param {GB_cart} cart
     * @param {bios_t} bios
     * @param {GB_bus} bus
     * @param {GB_clock} clock
     */
    constructor(cart, bios, clock, bus) {
        this.bus = bus;
        this.clock = clock;
    }
}