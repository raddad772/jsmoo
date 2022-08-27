"use strict";

class NES_bus {
    constructor() {
        // PPU reading and writing memory. This can be vastly changed by mappers, so we just let mappers handle it
        this.PPU_read = function(addr, val, has_effect=true) { return 0xCC; };
        this.PPU_write = function(addr, val) {};

        this.CPU_read = function(addr, val, has_effect=true) { return 0xCC; }
        this.CPU_write = function(addr, val) {}

        this.PPU_reg_read = function(addr, val, has_effect=true) { return 0xCC; };
        this.PPU_reg_write = function(addr, val) {};
        this.CPU_reg_read = function(addr, val, has_effect=true) { return 0xCC; }
        this.CPU_reg_write = function(addr, val) {};
        this.CPU_notify_NMI = function(level) {debugger;};
        this.CPU_notify_IRQ = function(level) {};
    }
}