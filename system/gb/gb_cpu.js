"use strict";

class GB_timer {
    constructor(raise_IRQ) {
        this.TIMA = 0;
        this.TMA = 0;
        this.TAC = 0;
        this.last_bit = 0;
        this.TIMA_reload_cycle = false;

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
            this.SYSCLK_change((this.SYSCLK + 4) & 0xFFFF);
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

class gb_inputs {
    constructor() {
        this.a = 0;
        this.b = 0;
        this.start = 0;
        this.select = 0;
        this.up = 0;
        this.down = 0;
        this.left = 0;
        this.right = 0;
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
        this.cpu = new SM83_t(variant, clock, bus);
        this.bus.cpu = this;

        this.FFregs = new Uint8Array(256); // For unimplemented FF-regs

        this.timer = new GB_timer(this.raise_TIMA.bind(this));

        this.tracing = false;

        this.io = {
            JOYP: {
                action_select: 0,
                direction_select: 0
            },
            speed_switch_prepare: 0
        }

        this.dma = {
            cycles_til: 0,
            new_high: 0,
            running: 0,
            index: 0,
            high: 0,
            last_write: 0
        }

        this.hdma = {
            source: 0,  // bits 16-4 respected only.
            dest: 0, // bits 12-4 respected only. | 0x8000
            length: 0, // * 16
            mode: 0, // 0 = GPDMA, 1 = HDMA
            source_index: 0,
            dest_index: 0,
            waiting: false,
            completed: false,
            enabled: false,
            active: false,
            notify_hblank: false, // Set by PPU to let us know we entered mode2

            til_next_byte: 4
        }

        //input_config.connect_controller('gb');
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
    }

    // TODO: emulate bug for Road Rash
    force_IRQ_latch() {

    }

    update_inputs(inp1) {
        this.input_buffer['a'] = inp1.a;
        this.input_buffer['b'] = inp1.b;
        this.input_buffer['up'] = inp1.up;
        this.input_buffer['down'] = inp1.down;
        this.input_buffer['left'] = inp1.left;
        this.input_buffer['right'] = inp1.right;
        this.input_buffer['start'] = inp1.start;
        this.input_buffer['select'] = inp1.select;
    }

    raise_TIMA() {
        this.cpu.regs.IF |= 4;
        //console.log('raising TIMA', this.cpu.regs.IE, this.cpu.regs.IF);
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
                //this.cycles_til_serial_interrupt =
                return;
            case 0xFF04: // DIV
            case 0xFF05: // TIMA
            case 0xFF06: // TIMA reload
            case 0xFF07: // TAC TIMA controler
                this.timer.write_IO(addr, val);
                return;
            case 0xFF46: // OAM DMA
                if (GB_INSTANT_OAM) {
                    this.dma.high = (val << 8);
                    for (let i = 0; i < 160; i++) {
                        this.bus.CPU_write_OAM(0xFE00 | i, this.bus.DMA_read(this.dma.high | i, 0));
                    }
                }
                else {
                    this.dma.cycles_til = 2;
                    ////this.dma.running = 1;
                    this.dma.new_high = (val << 8);
                    this.dma.last_write = val;
                }
                break;
            case 0xFF4D: // Speed switch enable
                if (!this.clock.cgb_enable) return;
                this.io.speed_switch_prepare = val & 1;
                break;
            case 0xFF4F: // VRAM bank
                if (!this.clock.cgb_enable) return;
                this.bus.set_VRAM_bank(val);
                return;
            case 0xFF50: // Boot ROM disable. Cannot re-enable
                if (val > 0) {
                    console.log('Disable boot ROM!');
                    //dbg.break();
                    this.clock.bootROM_enabled = false;
                }
                break;
            case 0xFF51: // HDMA1   bits 15-8 of dest
                if (!this.clock.cgb_enable) return;
                //this.hdma.source = (this.hdma.source & 0xF0) | (val << 8);
                this.hdma.source = (this.hdma.source & 0xFF) | (val << 8);
                return;
            case 0xFF52: // HDMA2   bits 7-4 of dest
                if (!this.clock.cgb_enable) return;
                this.hdma.source = (this.hdma.source & 0xFF00) | val;
                //this.hdma.source = (this.hdma.source & 0xFF00) | (val & 0xF0);
                return;
            case 0xFF53: // HDMA3  bits 12-8 of dest
                if (!this.clock.cgb_enable) return;
                this.hdma.dest = (this.hdma.dest & 0xFF) | (val << 8);
                //this.hdma.dest = 0x8000 | (this.hdma.dest & 0x1F00) | (val & 0xF0);
                return;
            case 0xFF54: // HDMA4 bits
                if (!this.clock.cgb_enable) return;
                this.hdma.dest = (this.hdma.dest & 0xFF00) | val;
                //this.hdma.dest = 0x8000 | (this.hdma.dest & 0xF0) | ((val & 0x1F) << 8);
                return;
            case 0xFF55: // HDMA5 transfer stuff!
                if (!this.clock.cgb_enable) return;
                this.hdma.mode = (val & 0x80) >>> 7;
                this.hdma.length = (val & 0x7F) + 1; // up to 128 blocks of 16 bytes.
                this.hdma.enabled = true;
                this.hdma.dest_index = (this.hdma.dest & 0x1FF0) | 0x8000;
                this.hdma.source_index = this.hdma.source & 0xFFF0;
                this.hdma.last_ly = 250;

                this.hdma.til_next_byte = this.clock.turbo ? 2 : 1; // If we're at turbo-speed, we need to wait 2 M-cycles in between transfer. If not, 1.
                if (this.hdma.mode === 0) this.hdma.active = true;
                return;
            case 0xFF6C:
                if (!this.clock.cgb_enable) return;
                console.log('OBJPRIOR WRITE!', hex2(val));
                return;
            case 0xFF70: // WRAM bank
                if (!this.clock.cgb_enable) return;
                this.bus.set_WRAM_bank(val);
                return;
            case 0xFF0F:
                //console.log('WRITE IF', val & 0x1F);
                this.cpu.regs.IF = val & 0x1F;
                return;
            case 0xFFFF: // IE: Interrupt Enable
                //console.log('WRITE IE', val & 0x1F);
                if ((val & 0x1F) === 30) dbg.break();
                this.cpu.regs.IE = val & 0x1F;
                return;
        }
    }

    get_input() {
        //this.input_buffer = this.joymap.latch();
        let out1;
        let out3 = 0x0F;
        if (this.io.JOYP.action_select === 0) {
            out1 = this.input_buffer.a | (this.input_buffer.b << 1) | (this.input_buffer.select << 2) | (this.input_buffer.start << 3);
            out1 ^= 0x0F;
            out3 &= out1;
        }

        if (this.io.JOYP.direction_select === 0) {
            out1 = this.input_buffer.right | (this.input_buffer.left << 1) | (this.input_buffer.up << 2) | (this.input_buffer.down << 3);
            out1 ^= 0x0F;
            out3 &= out1;
        }
        return out3;
    }

    read_IO(addr, val, has_effect=true) {
        switch(addr) {
            case 0xFF00: // JOYP
                // return not pressed=1 in bottom 4 bits
                return this.get_input() | (this.io.JOYP.action_select << 5) | (this.io.JOYP.direction_select << 6);
            case 0xFF01: // SB serial
                //return this.FFregs[1];
                return 0xFF;
            case 0xFF02: // SC
                return val;
            case 0xFF04: // DIV
            case 0xFF05: // TIMA
            case 0xFF06: // TIMA reload
            case 0xFF07: // TAC timer control
                return this.timer.read_IO(addr);
            case 0xFF0F: // IF: interrupt flag
                //return this.cpu.regs.IF & 0x1F;
                return this.cpu.regs.IF | 0xE0;
                //return this.clock.irq.vblank_request | (this.clock.irq.lcd_stat_request << 1) | (this.clock.irq.timer_request << 2) | (this.clock.irq.serial_request << 3) | (this.clock.irq.joypad_request << 4);
            case 0xFF46: // OAM DMA
                return this.dma.last_write;
            case 0xFF4D: // Speed switch enable
                if (!this.clock.cgb_enable) return 0xFF;
                return this.io.speed_switch_prepare | (this.clock.turbo ? 0x80 : 0);
            case 0xFF4F: // VRAM bank
                if (!this.clock.cgb_enable) return 0xFF;
                return this.bus.get_VRAM_bank();
                //return this.bus.mapper.VRAM_bank_offset / 8192;
            case 0xFF51: // HDMA1 MSB
                if (!this.clock.cgb_enable) return 0xFF;
                return (this.hdma.source & 0xFF00) >>> 8;
            case 0xFF52: // HDMA2 LSB
                if (!this.clock.cgb_enable) return 0xFF;
                return this.hdma.source & 0xFF;
            case 0xFF53: // HDMA3 MSB
                if (!this.clock.cgb_enable) return 0xFF;
                return (this.hdma.dest & 0xFF00) >>> 8;
            case 0xFF54: // HDMA4 LSB
                if (!this.clock.cgb_enable) return 0xFF;
                return this.hdma.dest & 0xFF;
            case 0xFF55: // HDMA5
                if (!this.clock.cgb_enable) return 0xFF;
                return (this.hdma.enabled ? 0 : 0x80) | this.hdma.length;
            case 0xFF70: // WRAM bank
                if (!this.clock.cgb_enable) return 0xFF;
                return this.bus.get_WRAM_bank();
            case 0xFFFF: // IE Interrupt Enable
                //return this.cpu.regs.IE & 0x1F;
                return this.cpu.regs.IE | 0xE0;
                //return this.clock.irq.vblank_enable | (this.clock.irq.lcd_stat_enable << 1) | (this.clock.irq.timer_enable << 2) | (this.clock.irq.serial_enable << 3) | (this.clock.irq.joypad_enable << 4);
        }
        return 0xFF;
    }

    dma_eval() {
        if (this.dma.cycles_til) {
            this.dma.cycles_til--;
            if (this.dma.cycles_til === 0) {
                this.dma.running = 1;
                this.dma.index = 0;
                this.dma.high = this.dma.new_high;
                this.clock.old_OAM_can = this.clock.CPU_can_OAM;
                this.clock.CPU_can_OAM = 0;
            }
            else
                return;
        }
        if (!this.dma.running) return;
        if (this.dma.index >= 160) {
            //console.log('DMA END!');
            this.dma.running = 0;
            this.clock.CPU_can_OAM = this.clock.old_OAM_can;
            return;
        }
        this.bus.CPU_write_OAM(0xFE00 | this.dma.index, this.bus.DMA_read(this.dma.high | this.dma.index, 0));
        this.dma.index++;
    }

    // Routine to set state as if boot ROM had run
    quick_boot() {
        let regs = this.cpu.regs;
        let pins = this.cpu.pins;
        switch(this.variant) {
            case GB_variants.DMG:
                regs.A = 1;
                regs.F.Z = 0;
                regs.SP = 0xFFFE;
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
                regs.IF = 1;
                this.hdma.enabled = false;
                this.timer.TIMA = 0;
                this.timer.TMA = 0;
                this.timer.TAC = 0xF8;
                this.clock.bootROM_enabled = false;
                pins.Addr = 0x100;
                pins.MRQ = pins.RD = 1;
                pins.WR = 0;
                regs.poll_IRQ = true;
                break;
            default:
                regs.A = 0x11;
                regs.F.Z = 1;
                regs.SP = 0xFFFE;
                regs.B = 0;
                regs.C = 0;
                regs.D = 0xFF;
                regs.E = 0x56;
                regs.H = 0x00;
                regs.L = 0x0D;
                regs.PC = 0x101;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.IME = 0;
                regs.IE = 0;
                regs.IF = 1;
                this.timer.TIMA = 0;
                this.timer.TMA = 0;
                this.timer.TAC = 0xF8;
                this.clock.bootROM_enabled = false;
                this.hdma.dest = 0xFFFF;
                this.hdma.source = 0xFFFF;
                this.hdma.length = 0x7F;
                this.hdma.mode = 1;
                this.hdma.enabled = false;
                //this.bus.mapper.VRAM_bank_offset = 0;
                //this.bus.mapper.WRAM_bank_offset = 4096;
                this.bus.mapper.VRAM_bank_offset = 8192; // 0xFF startup register value
                this.bus.mapper.WRAM_bank_offset = 4096 * 7; // 0xFF startup register value
                pins.Addr = 0x100;
                pins.MRQ = pins.RD = 1;
                pins.WR = 0;
                regs.poll_IRQ = true;
                break;
        }
    }

    hdma_run() {
        let hdma = this.hdma;
        // If we're enabled and in the right lines
        if ((this.clock.ppu_mode === GB_PPU_modes.HBLANK) && (this.clock.ly < 144)) {
            // If we're in the middle of a 16-byte block, or we have been notified of HBLANK
            if (((hdma.dest_index & 0xFF) !== 0) || (hdma.notify_hblank)) {
                hdma.til_next_byte--;
                if (hdma.til_next_byte < 1) {
                    hdma.notify_hblank = false;
                    console.log('RUN HDMA!', hex4(hdma.dest_index), hex4(hdma.source_index));
                    this.bus.CPU_write(hdma.dest_index, this.bus.CPU_read(hdma.source_index, 0xFF));
                    hdma.dest_index = ((hdma.dest_index + 1) & 0x1FFF) | 0x8000;
                    hdma.source_index = (hdma.source_index + 1) & 0xFFFF;
                    // A 16-byte block has finished
                    if ((hdma.dest_index & 0x0F) === 0) {
                        hdma.length = (hdma.length - 1) & 0xFF;
                        if (hdma.length === 0xFF) { // Terminate HDMA
                            hdma.enabled = false;
                            hdma.waiting = false;
                            hdma.completed = true;
                            hdma.active = false;
                        }
                        else {
                            hdma.completed = false;
                            hdma.enabled = true;
                            hdma.waiting = true;
                        }
                    }
                    hdma.til_next_byte = this.clock.turbo ? 2 : 1; // If we're at turbo-speed, we need to wait 2 M-cycles in between transfer. If not, 1.
                }
                return true; // we RAN so we RETURN TRUE
            }
        }
        return false;
    }

    hdma_eval() {
        if ((this.clock.cgb_enable) && (this.hdma.enabled)) {
            if (this.hdma.mode === 0) {
                this.ghdma_run();
                return true;
            } else {
                return this.hdma_run();
            }
        }
        return false;
    }

    ghdma_run() {
        let hdma = this.hdma;
        hdma.til_next_byte--;
        if (hdma.til_next_byte < 1) {
            // Copy byte
            this.bus.CPU_write(hdma.dest_index, this.bus.CPU_read(hdma.source_index, 0xFF));
            hdma.dest_index = ((hdma.dest_index + 1) & 0x1FFF) | 0x8000;
            hdma.source_index = (hdma.source_index + 1) & 0xFFFF;
            // A 16-byte block has finished
            if ((hdma.dest_index & 0x0F) === 0) {
                hdma.length = (hdma.length - 1) & 0xFF;
                if (hdma.length === 0xFF) { // Terminate HDMA
                    hdma.enabled = false;
                    hdma.waiting = false;
                    hdma.completed = true;
                    hdma.active = false;
                }
            }
            this.hdma.til_next_byte = this.clock.turbo ? 2 : 1; // If we're at turbo-speed, we need to wait 2 M-cycles in between transfer. If not, 1.
        }
    }

    cycle() {
        if (this.hdma_eval()) {
            this.timer.inc();
            return;
        }

        // Service CPU reads and writes
        if (this.cpu.pins.MRQ) {
            if (this.cpu.pins.RD) {
                this.cpu.pins.D = this.bus.mapper.CPU_read(this.cpu.pins.Addr, 0xCC);
                if (this.tracing) {
                    dbg.traces.add(TRACERS.SM83, this.cpu.trace_cycles, trace_format_read('SM83', SM83_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
                }
            }
            if (this.cpu.pins.WR) {
                if ((!this.dma.running) || (this.cpu.pins.Addr >= 0xFF00))
                    this.bus.mapper.CPU_write(this.cpu.pins.Addr, this.cpu.pins.D);

                if (this.tracing) {
                    dbg.traces.add(TRACERS.SM83, this.cpu.trace_cycles, trace_format_write('SM83', SM83_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
                }
            }
        }
        this.cpu.cycle();
        this.dma_eval();
        if (this.cpu.regs.STP)
            this.timer.SYSCLK_change(0);
        else {
            this.timer.inc();
        }
    }
}