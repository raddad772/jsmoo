"use strict";

import {GB_variants} from "./gb_common";
import {GB_bus, GB_clock, gb_inputs} from "./gb";
import {SM83_regs_t, SM83_t} from "../../component/cpu/sm83/sm83";
import {SM83_S_DECODE} from "../../component/cpu/sm83/sm83_opcodes";

class GB_timer {
    TIMA: u32 = 0
    TMA: u32 = 0
    TAC: u32 = 0
    last_bit: u32 = 0
    TIMA_reload_cycle: bool = false
    SYSCLK: u32 = 0
    cycles_til_TIMA_IRQ: u32 = 0

    cpu_regs: SM83_regs_t

    constructor(cpu_regs: SM83_regs_t) {
        this.SYSCLK = 0;

        this.cycles_til_TIMA_IRQ = 0;

        this.cpu_regs = cpu_regs
    }

    // Increment 1 state
    inc(): void {
        this.TIMA_reload_cycle = false;
        if (this.cycles_til_TIMA_IRQ > 0) {
            this.cycles_til_TIMA_IRQ--;
            if (this.cycles_til_TIMA_IRQ === 0) {
                this.cpu_regs.IF |= 4;
                this.TIMA = this.TMA;
                this.TIMA_reload_cycle = true
            }
        }
        this.SYSCLK_change((this.SYSCLK + 4) & 0xFFFF);
    }

    SYSCLK_change(new_value: u32): void {
        // 00 = bit 9, lowest speed, /1024  4096 hz   & 0x200
        // 01 = bit 3,               /16  262144 hz   & 0x08
        // 10 = bit 5,               /64  65536 hz    & 0x20
        // 11 = bit 7,              /256  16384 hz    & 0x80
        this.SYSCLK = new_value;
        let this_bit: u32 = 0;
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

    write_IO(addr: u32, val: u32): void {
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

    read_IO(addr: u32): u32 {
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
        return 0xFF;
    }
}

class GB_CPU_io_JOYP {
    action_select: u32 = 0
    direction_select: u32 = 0
}

class GB_CPU_io {
    JOYP: GB_CPU_io_JOYP = new GB_CPU_io_JOYP();
}

class GB_CPU_dma {
    cycles_til: u32 = 0
    new_high: u32 = 0
    running: u32 = 0
    index: u32 = 0
    high: u32 = 0
    last_write: u32 = 0
}

export class GB_CPU {
    variant: GB_variants
    clock: GB_clock
    bus: GB_bus
    cpu: SM83_t

    FFregs: StaticArray<u8> = new StaticArray<u8>(256); // For unimplemented FF-regs
    timer: GB_timer
    tracing: bool = false
    io: GB_CPU_io = new GB_CPU_io()
    dma: GB_CPU_dma = new GB_CPU_dma()
    input_buffer: gb_inputs = new gb_inputs();

    constructor(variant: GB_variants, clock: GB_clock, bus: GB_bus) {
        this.bus = bus;
        this.clock = clock;
        this.variant = variant;

        this.cpu = new SM83_t(variant, clock, bus);
        this.timer = new GB_timer(this.cpu.regs);
        this.tracing = false;

        this.bus.cpu = this;
    }

    update_inputs(inp1: gb_inputs): void {
        this.input_buffer.a = inp1.a;
        this.input_buffer.b = inp1.b;
        this.input_buffer.up = inp1.up;
        this.input_buffer.down = inp1.down;
        this.input_buffer.left = inp1.left;
        this.input_buffer.right = inp1.right;
        this.input_buffer.start = inp1.start;
        this.input_buffer.select = inp1.select;
    }

    enable_tracing(): void {
        if (this.tracing) return;
        //this.cpu.enable_tracing(this.read_trace.bind(this));
        this.tracing = true;
    }

    read_trace(addr: u32): u32 {
        return this.bus.mapper.CPU_read(addr, 0);
    }

    disable_tracing(): void {
        if (!this.tracing) return;
        this.cpu.disable_tracing();
        this.tracing = false;
    }

    reset(): void {
        this.cpu.reset();
        this.clock.cpu_frame_cycle = 0;
        this.clock.bootROM_enabled = true;
        this.dma.running = 0;
    }

    write_IO(addr: u32, val: u32): void {
        switch(addr) {
            case 0xFF00: // JOYP
                this.io.JOYP.action_select = (val & 0x20) >>> 5;
                this.io.JOYP.direction_select = (val & 0x10) >>> 4;
                return;
            case 0xFF01: // SB serial
                this.FFregs[1] = <u8>val;
                break;
            case 0xFF02: // SC
                this.FFregs[2] = <u8>val;
                //this.cycles_til_serial_interrupt =
                return;
            case 0xFF04: // DIV
            case 0xFF05: // TIMA
            case 0xFF06: // TIMA reload
            case 0xFF07: // TAC TIMA controler
                this.timer.write_IO(addr, val);
                return;
            case 0xFF46: // OAM DMA
                //this.dma.cycles_til = 2;
                ////this.dma.running = 1;
                //this.dma.new_high = (val << 8);
                //this.dma.last_write = val;
                this.dma.high = (val << 8);
                for (let i: u32 = 0; i < 160; i++) {
                    this.bus.ppu!.write_OAM(0xFE00 | i, this.bus.DMA_read(this.dma.high | i));
                }
                break;
            case 0xFF50: // Boot ROM disable. Cannot re-enable
                if (val > 0) {
                    console.log('Disable boot ROM!');
                    //dbg.break();
                    this.clock.bootROM_enabled = false;
                }
                break;
            case 0xFF0F:
                console.log('WRITE IF ' + (val & 0x1F).toString());
                this.cpu.regs.IF = val & 0x1F;
                return;
            case 0xFFFF: // IE: Interrupt Enable
                console.log('WRITE IE ' + (val & 0x1F).toString());
                this.cpu.regs.IE = val & 0x1F;
                return;
        }
    }

    get_input(): u32 {
        let out1: u32;
        let out3: u32 = 0x0F;
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

    read_IO(addr: u32, val: u32, has_effect: bool = true): u32 {
        switch(addr) {
            case 0xFF00: // JOYP
                // return not pressed=1 in bottom 4 bits
                return this.get_input() | (this.io.JOYP.action_select << 5) | (this.io.JOYP.direction_select << 6);
            case 0xFF01: // SB serial
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
            case 0xFFFF: // IE Interrupt Enable
                //return this.cpu.regs.IE & 0x1F;
                return this.cpu.regs.IE | 0xE0;
        }
        return 0xFF;
    }

    // perform one cycle of HDMA eval
    hdma_eval(): void {

    }

    dma_eval(): void {
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
        this.bus.ppu!.write_OAM(0xFE00 | this.dma.index, this.bus.DMA_read(this.dma.high | this.dma.index));
        this.dma.index++;
    }

    // Routine to set state as if boot ROM had run
    quick_boot(): void {
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

    cycle(): void {
        // Update timers
        if (this.cpu.pins.RD && this.cpu.pins.MRQ) {
            this.cpu.pins.D = this.bus.mapper.CPU_read(this.cpu.pins.Addr, 0xCC);
            //if (this.tracing) {
            //    dbg.traces.add(TRACERS.SM83, this.cpu.trace_cycles, trace_format_read('SM83', SM83_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
            //}
        }
        if (this.cpu.pins.WR && this.cpu.pins.MRQ) {
            if ((!this.dma.running) || (this.cpu.pins.Addr >= 0xFF00))
                this.bus.mapper.CPU_write(this.cpu.pins.Addr, this.cpu.pins.D);
            //else
             //   console.log('DMA BLOCK W!');

            //if (this.tracing) {
            //    dbg.traces.add(TRACERS.SM83, this.cpu.trace_cycles, trace_format_write('SM83', SM83_COLOR, this.cpu.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
            //}
        }
        this.cpu.cycle();
        this.dma_eval();
        if (this.cpu.regs.STP)
            this.timer.SYSCLK_change(0);
        else
            this.timer.inc();
    }
}
