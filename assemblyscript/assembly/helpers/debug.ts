export enum D_RESOURCE_TYPES {
    none,
    R5A22,
    SPC700,
    WDC65C816,
    SNESPPU,
    M6502,
    Z80,
    SM83
}

class debugger_t {
    do_break: bool = false
    brk_on_NMIRQ: bool = false
    watch_on: bool = false

    break(who: D_RESOURCE_TYPES = D_RESOURCE_TYPES.none): void {
        console.log('DOING BREAK');
        this.do_break = true;
    }
}

export const dbg = new debugger_t();