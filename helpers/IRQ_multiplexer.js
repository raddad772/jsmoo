"use strict";

class IRQ_source_t {
    constructor(source_name) {
        this.name = source_name;
        this.level = 0;
    }
}

class IRQ_multiplexer_t {
    constructor() {
        this.IF = 0;
        this.current_level = 0;
    }

    set_level(level, from) {
        if (level === 0)
            this.IF &= (from ^ 0xFFFF);
        else
            this.IF |= from;
        return this.current_level = +(this.IF !== 0);
    }

    clear() {
        this.IF = 0;
    }

    query_level() {
        return this.current_level;
    }
}