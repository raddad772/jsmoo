"use strict";


class PS1_CPU {
    constructor(clock, bus, mem) {
        this.core = new R3000(mem);
    }

    enable_tracing() {
        this.core.enable_tracing();
    }

    disable_tracing() {
        this.core.disable_tracing();
    }

    reset() {
        this.core.reset();
    }

    cycle() {
        this.core.cycle();
    }
}