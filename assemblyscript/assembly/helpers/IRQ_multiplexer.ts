class IRQ_source_t {
    source_name: String
    level: u32 = 0
    constructor(source_name: String) {
        this.source_name = source_name;
    }
}

class IRQ_multiplexer_t {
    IRQ_source_map: Map<String, u32> = new Map<String, u32>();
    IRQ_sources: Array<IRQ_source_t> = new Array<IRQ_source_t>;
    current_level: u32 = 0

    add_source(name: String): void {
        if (this.IRQ_source_map.has(name)) return;
        let v = new IRQ_source_t(name);
        this.IRQ_sources.push(v);
        this.IRQ_source_map.set(name, this.IRQ_sources.length-1);
    }

    set_level(name: String, level: u32): void {
        if (!this.IRQ_source_map.has(name)) return;
        this.IRQ_sources[this.IRQ_source_map.get(name)].level = level;
        this.update_level();
    }

    update_level(): void {
        let level: u32 = 0;
        for (let i = 0, k = this.IRQ_sources.length; i < k; i++) {
            level |= this.IRQ_sources[i].level;
        }
        this.current_level = level;
    }

    query_level(): u32 {
        return this.current_level;
    }
}