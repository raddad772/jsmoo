import {NES_bus, NES_clock} from "../nes_common";
import {m6502} from "../../../component/cpu/m6502/m6502";
import {NES_controllerport} from "./controller_port";
import {nesm6502_opcodes_decoded} from "./nesm6502_generated_opcodes";
import {nespad_inputs} from "../nes";
import {NES_joypad} from "../../../component/controller/nes_joypad";



class ricoh2A03_DMA {
    addr: u32 = 0
    running: u32 = 0
    bytes_left: u32 = 0
    step: u32 = 0
}

export class ricoh2A03 {
    cpu: m6502
    bus: NES_bus
    clock: NES_clock

    tracing: bool = false;
    dma: ricoh2A03_DMA = new ricoh2A03_DMA();

    joypad1: NES_joypad = new NES_joypad(1);
    joypad2: NES_joypad = new NES_joypad(2);

    controller_port1: NES_controllerport = new NES_controllerport();
    controller_port2: NES_controllerport = new NES_controllerport();
    constructor(clock: NES_clock, bus: NES_bus) {
        this.cpu = new m6502(nesm6502_opcodes_decoded);
        this.bus = bus;
        this.clock = clock;
        this.bus.cpu = this;

        this.controller_port1.device = this.joypad1;
        this.controller_port1.device = this.joypad2;
        this.cpu.reset();
    }

    update_inputs(inp1: nespad_inputs, inp2: nespad_inputs): void {
        this.joypad1.buffer_input(inp1);
        this.joypad2.buffer_input(inp2);
    }

    notify_NMI(level: u32): void {
        this.cpu.pins.NMI = +level;
    }

    notify_IRQ(level: u32): void {
        if ((+level) === 0) this.cpu.IRQ_ack = true;
        else if ((+level) !== this.cpu.pins.IRQ) this.cpu.IRQ_ack = false;
        this.cpu.pins.IRQ = +level;
    }

    reset(): void {
        this.cpu.reset();
        this.clock.cpu_frame_cycle = 0;
        this.dma.running = 0;
    }

    run_cycle(): void {
        // Do DMA if we're engaged in that
        if (this.dma.running) {
            this.dma.step++;
            if (this.dma.step === 1) {
                return;
            }
            this.dma.step = 0;
            this.bus.PPU_reg_write(0x2004, this.bus.CPU_read(this.dma.addr, 0));
            this.dma.bytes_left--;
            this.dma.addr = (this.dma.addr + 1) & 0xFFFF;
            if (this.dma.bytes_left === 0) {
                this.dma.running = 0;
            }
            return;
        }

        // Service RW pins
        if (!this.cpu.pins.RW) {
            this.cpu.pins.D = this.bus.CPU_read(this.cpu.pins.Addr, this.cpu.pins.D);
            if (this.tracing) {
                //dbg.traces.add(TRACERS.M6502, this.clock.trace_cycles, trace_format_read('MOS', MOS_COLOR, this.clock.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
            }
        }
        this.clock.trace_cycles++;
        this.cpu.cycle();
        if (this.cpu.pins.RW) {
            this.bus.CPU_write(this.cpu.pins.Addr, this.cpu.pins.D);
            /*if (this.tracing) {
                //dbg.traces.add(TRACERS.M6502, this.clock.trace_cycles, trace_format_write('MOS', MOS_COLOR, this.clock.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
            }*/
        }
    }

    reg_read(addr: u32, val: u32, has_effect: u32): u32 {
        switch(addr) {
            case 0x4016: // JOYSER0
                let r: u32 = this.controller_port1.data();
                return r;
            case 0x4017: // JOYSER1
                return this.controller_port2.data();
        }
        return val;
    }

    reg_write(addr: u32, val: u32): void {
        switch(addr) {
            case 0x4014: //OAMDMA
                this.dma.addr = val << 8;
                this.dma.running = 1;
                this.dma.bytes_left = 256;
                this.dma.step = 0;
                return;
            case 0x4016: // JOYSER0
                this.controller_port1.latch(val & 1);
                break;
       }
    }
}