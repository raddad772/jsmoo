export class IRQ_multiplexer_t {
    IF: u32 = 0
    current_level: u32 = 0

    set_level(level: u32, from: u32): u32 {
        if (level === 0)
            this.IF &= ((1 << from) ^ 0xFFFF);
        else
            this.IF |= 1 << from;
        this.current_level = +(this.IF !== 0);
        return this.current_level;
    }

    clear(): void {
        this.IF = 0;
    }
}