"use strict";

class IRQ_source_t {
    constructor(source_name) {
        this.name = source_name;
        this.level = 0;
    }
}

class IRQ_multiplexer_t {
    constructor() {
        this.IRQ_sources = {};
        this.current_level = 0;
    }

    add_source(name) {
        this.IRQ_sources[name] = new IRQ_source_t(name);
    }

    set_level(name, level) {
        this.IRQ_sources[name].level = level;
        this.update_level();
    }

    update_level() {
        let level = 0;
        for (let i in this.IRQ_sources) {
            level |= this.IRQ_sources[i].level;
        }
        this.current_level = level;
    }

    query_level() {
        return this.current_level;
    }
}