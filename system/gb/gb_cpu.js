"use strict";

class GB_timer {
    constructor(raise_IRQ) {
        this.TIMA = 0;
        this.TMA = 0;
        this.TAC = 0;
        this.last_bit = 0;
        this.TIMA_reload_cycle = false;
        this.DIV_reset = false;

        this.SYSCLK = 0;

        this.cycles_til_TIMA_IRQ = 0;

        this.raise_IRQ = raise_IRQ;
    }

    // Increment 1 state
    inc() {
        this.TIMA_reload_cycle = false;
        if (this.cycles_til_TIMA_IRQ > 0) {
            this.cycles_til_TIMA_IRQ--;
            if (this.cycles_til_TIMA_IRQ === 0) {
                this.raise_IRQ();
                this.TIMA = this.TMA;
                this.TIMA_reload_cycle = true
            }
        }
        if (!this.DIV_reset) this.SYSCLK_change((this.SYSCLK + 4) & 0xFFFF);
        this.DIV_reset = false;
    }

    SYSCLK_change(new_value) {
        // 00 = bit 9, lowest speed, /1024  4096 hz   & 0x200
        // 01 = bit 3,               /16  262144 hz   & 0x08
        // 10 = bit 5,               /64  65536 hz    & 0x20
        // 11 = bit 7,              /256  16384 hz    & 0x80
        this.SYSCLK = new_value;
        let this_bit;
        switch(this.TAC & 3) {
            case 0: // using bit 9
                this_bit = (this.SYSCLK & 0x200) >>> 9;
                break;
            case 3: // using bit 7
                this_bit = (this.SYSCLK & 0x80) >>> 7;
                break;
            case 2: // using bit 5
                this_bit = (this.SYSCLK & 0x20) >>> 5;
                break;
            case 1: // using bit 3
                this_bit = (this.SYSCLK & 0x08) >>> 3;
                break;
        }
        this_bit &= ((this.TAC & 4) >>> 2);

        // Detect falling edge...
        if ((this.last_bit === 1) && (this_bit === 0)) {
            this.TIMA = (this.TIMA + 1) & 0xFF; // Increment TIMA
            if (this.TIMA === 0) { // If we overflow, schedule IRQ
                this.cycles_til_TIMA_IRQ = 1;
            }
        }
        this.last_bit = this_bit;
    }

    write_IO(addr, val) {
        switch(addr) {
            case 0xFF04: // DIV, which is upper 8 bits of SYSCLK
                this.SYSCLK_change(0);
                this.DIV_reset = true;
                break;
            case 0xFF05: // TIMA, the timer counter
                this.TIMA = val;
                // "During the strange cycle [A] you can prevent the IF flag from being set and prevent the TIMA from being reloaded from TMA by writing a value to TIMA. That new value will be the one that stays in the TIMA register after the instruction. Writing to DIV, TAC or other registers wont prevent the IF flag from being set or TIMA from being reloaded."
                if (this.cycles_til_TIMA_IRQ === 1) this.cycles_til_TIMA_IRQ = 0;
                break;
            case 0xFF06: // TMA, the timer modulo
                // "If TMA is written the same cycle it is loaded to TIMA [B], TIMA is also loaded with that value."
                if (this.TIMA_reload_cycle) this.TIMA = val;
                this.TMA = val;
                break;
            case 0xFF07: // TAC, the timer control
                this.TAC = val;
                break;
        }
    }

    read_IO(addr) {
        switch(addr) {
            case 0xFF04: // DIV, upper 8 bits of SYSCLK
                return (this.SYSCLK & 0xFF00) >>> 8;
            case 0xFF05:
                return this.TIMA;
            case 0xFF06:
                return this.TMA;
            case 0xFF07:
                return this.TAC;
        }
    }
}

class GB_CPU {
    /**
     * @param {Number} variant
     * @param {GB_bus} bus
     * @param {GB_clock} clock
     */
    constructor(variant, clock, bus) {
        this.bus = bus;
        this.clock = clock;
        this.variant = variant;
        this.cpu = new SM83_t(this.clock);
        this.bus.cpu = this;

        this.FFregs = new Uint8Array(256); // For unimplemented FF-regs

        this.timer = new GB_timer(this.raise_TIMA.bind(this));


        this.tracing = false;

        this.io = {
            JOYP: {
                action_select: 0,
                direction_select: 0
            },
        }

        this.dma = {
            running: 0,
            index: 0,
            high: 0
        }

        input_config.connect_controller('gb');
        this.input_buffer = {
            'a': 0,
            'b': 0,
            'up': 0,
            'down': 0,
            'left': 0,
            'right': 0,
            'start': 0,
            'select': 0
        }
        this.joymap = input_config.controller_els.gb;

    }

    // TODO: emulate bug for Road Rash
    force_IRQ_latch() {

    }

    raise_TIMA() {
        this.cpu.regs.IF |= 4;
        console.log('raising TIMA', this.cpu.regs.IE);
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
        this.clock.bootROM_enabled = true;
        this.dma.running = 0;
    }

    write_IO(addr, val) {
        switch(addr) {
            case 0xFF00: // JOYP
                this.io.JOYP.action_select = (val & 0x20) >>> 5;
                this.io.JOYP.direction_select = (val & 0x10) >>> 4;
                return;
            case 0xFF01: // SB serial
                this.FFregs[1] = val;
                break;
            case 0xFF02: // SC
                this.FFregs[2] = val;
                return;
            case 0xFF04: // DIV
            case 0xFF05: // TIMA
            case 0xFF06: // TIMA reload
            case 0xFF07: // TAC TIMA controler
                this.timer.write_IO(addr, val);
                return;
            case 0xFF46: // OAM DMA
                //console.log('OAM DMA START')
                this.dma.running = 1;
                this.dma.high = (val << 8);
                this.dma.index = 0;
                break;
            case 0xFF50: // Boot ROM disable. Cannot re-enable
                if (val > 0) {
                    console.log('Disable boot ROM!');
                    //dbg.break();
                    this.clock.bootROM_enabled = false;
                }
                break;
            case 0xFF0F:
                //console.log('WRITE IF', val);
                this.cpu.regs.IF = val & 0x1F;
                return;
            case 0xFFFF: // IE: Interrupt Enable
                console.log('IE', val & 0x1F);
                this.cpu.regs.IE = val & 0x1F;
                return;
        }
    }

    get_input() {
        this.input_buffer = this.joymap.latch();
        let out1, out2;
        let out3 = 0;
        if (this.io.JOYP.action_select === 0) {
            out1 = this.input_buffer['a'] | (this.input_buffer['b'] << 1) | (this.input_buffer['select'] << 2) | (this.input_buffer['start'] << 3);
            out1 ^= 0x0F;
            out3 |= out1;
        }

        if (this.io.JOYP.direction_select === 0) {
            out1 = this.input_buffer['right'] | (this.input_buffer['left'] << 1) | (this.input_buffer['up'] << 2) | (this.input_buffer['down'] << 3);
            out1 ^= 0x0F;
            out3 |= out1;
        }
        return out3;
    }

    read_IO(addr, val, has_effect=true) {
        switch(addr) {
            case 0xFF00: // JOYP
                // return not pressed=1 in bottom 4 bits
                return this.get_input() | (this.io.JOYP.action_select << 5) | (this.io.JOYP.direction_select << 6);
            case 0xFF01: // SB serial
                return this.FFregs[1];
            case 0xFF02:
                return this.FFregs[2];
                break;
            case 0xFF02: // SC
                return val;
            case 0xFF04: // DIV
            case 0xFF05: // TIMA
            case 0xFF06: // TIMA reload
            case 0xFF07: // TAC timer control
                return this.timer.read_IO(addr);
            case 0xFF0F: // IF: interrupt flag
                console.log('READ IF!', this.cpu.regs.IF);
                return this.cpu.regs.IF;
                //return this.clock.irq.vblank_request | (this.clock.irq.lcd_stat_request << 1) | (this.clock.irq.timer_request << 2) | (this.clock.irq.serial_request << 3) | (this.clock.irq.joypad_request << 4);
            case 0xFFFF: // IE Interrupt Enable
                return this.cpu.regs.IE;
                //return this.clock.irq.vblank_enable | (this.clock.irq.lcd_stat_enable << 1) | (this.clock.irq.timer_enable << 2) | (this.clock.irq.serial_enable << 3) | (this.clock.irq.joypad_enable << 4);
        }
        return 0xFF;
    }

    // perform one cycle of HDMA eval
    hdma_eval() {

    }

    dma_eval() {
        this.bus.CPU_write_OAM(0xFE00 | this.dma.index, this.bus.DMA_read(this.dma.high | this.dma.index, 0));
        this.dma.index++;
        if (this.dma.index >= 160) {
            //console.log('DMA END!');
            this.dma.running = 0;
        }
    }

    // Routine to set state as if boot ROM had run
    quick_boot() {
        let regs = this.cpu.regs;
        let pins = this.cpu.pins;
        switch(this.variant) {
            case GB_variants.DMG:
                regs.A = 1;
                regs.F.Z = 0;
                regs.B = 0;
                regs.C = 0x13;
                regs.D = 0;
                regs.E = 0xD8;
                regs.H = 0x01;
                regs.L = 0x4D;
                regs.PC = 0x101;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.IME = 0;
                regs.IE = 0;
                regs.IF = 0xE1;
                this.clock.bootROM_enabled = false;
                pins.Addr = 0x100;
                pins.MRQ = pins.RD = 1;
                pins.WR = 0;
                regs.poll_IRQ = true;
                break;
            default:
                console.log('FAST BOOT NOT ENABLED FOR THIS VARIANT!');
                break;
        }
    }

    cycle() {
        // Update timers
        if (this.dma.running) {
            this.dma_eval();
            if ((this.cpu.pins.Addr < 0xFF80) && (this.cpu.pins.MRQ) && (this.dma.index > 2)) {
                console.log('SKIP CPU CYCLE TO DMA', hex4(this.cpu.pins.Addr), this.cpu.pins.MRQ);
                return;
            } // Skip CPU cycle due to OAM
            // TODO: should timer skip too!?
        }
        if (this.cpu.pins.RD && this.cpu.pins.MRQ) {
            this.cpu.pins.D = this.bus.mapper.CPU_read(this.cpu.pins.Addr, 0xCC);
            if (this.tracing) {
                dbg.traces.add(TRACERS.SM83, this.cpu.trace_cycles, trace_format_read('SM83', SM83_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
            }
        }
        this.cpu.cycle();
        if (this.cpu.pins.WR && this.cpu.pins.MRQ) {
            this.bus.mapper.CPU_write(this.cpu.pins.Addr, this.cpu.pins.D);
            if (this.tracing) {
                dbg.traces.add(TRACERS.SM83, this.cpu.trace_cycles, trace_format_write('SM83', SM83_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
            }
        }
        if (this.cpu.regs.STP)
            this.timer.SYSCLK = 0;
        else {
            this.timer.inc();
        }
    }
}