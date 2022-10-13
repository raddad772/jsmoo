class debugger_t {
    do_break: bool = false
    brk_on_NMIRQ: bool = false

    break(): void {
        console.log('DOING BREAK');
        this.do_break = true;
    }
}

export const dbg = new debugger_t();