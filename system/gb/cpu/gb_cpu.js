"use strict";

class GB_CPU {
    /**
     * @param {Number} variant
     * @param {GB_bus} bus
     * @param {GB_clock} clock
     */
    constructor(variant, bus, clock) {
        this.bus = bus;
        this.clock = clock;
        this.variant = variant;
        this.cpu = new SM83_t();

        this.tracing = false;

        this.dma = {
            running: 0
        }
    }

    enable_tracing() {
        if (this.tracing) return;
        this.cpu.enable_tracing(this.read_trace.bind(this));
        this.tracing = true;
    }

    read_trace(addr) {
        return this.bus.CPU_read(addr, 0, false);
    }

    disable_tracing() {
        if (!this.tracing) return;
        this.cpu.disable_tracing();
        this.tracing = false;
    }

    notify_IRQ(level) {} // TODO

    reset() {
        this.cpu.reset();
        this.clock.cpu_frame_cycle = 0;
        this.dma.running = 0;
    }

    // perform one cycle of HDMA eval
    hdma_eval() {

    }

    cycle() {
        if (this.clock.hblank_pending) {
            this.clock.blank_pending = 0;
            if (this.hdma_eval()) return;
        }
    }
}