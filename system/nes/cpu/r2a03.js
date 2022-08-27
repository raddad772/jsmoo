"use strict";
/*
  Ricoh 2A03, i.e., the CPU at the heart of the NES.
  It includes:
    * custom M6502 processor with BCD removed
    * Some DMA capabilities
    * Sound output
    * Some memory-mapped registers
 */

class ricoh2A03 {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.cpu = new m6502_t(nesm6502_opcodes_decoded);
        this.cpu.reset();
        this.bus = bus;
        this.clock = clock;

        this.tracing = false;

        this.bus.CPU_reg_write = this.reg_write.bind(this);
        this.bus.CPU_reg_read = this.reg_read.bind(this);
        this.bus.CPU_notify_NMI = this.notify_NMI.bind(this);
        this.bus.CPU_notify_IRQ = this.notify_IRQ.bind(this);

        this.cycles_left = 0;

        this.io = {
            dma: {
                addr: 0,
                running: 0,
                bytes_left: 0,
                step: 0
            }
        }
    }

    enable_tracing() {
        if (this.tracing) return;
        this.cpu.enable_tracing(this.read_trace.bind(this));
        this.tracing = true;
    }

    disable_tracing() {
        if (!this.tracing) return;
        this.cpu.disable_tracing();
        this.tracing = false;
    }

    notify_NMI(level) {
        this.cpu.pins.NMI = +level;
    }

    notify_IRQ(level) {
        this.cpu.pins.IRQ = +level;
    }

    reset() {
        this.cpu.reset();
        this.io.dma.running = 0;
    }

    read_trace(addr) {
        return this.bus.CPU_read(addr, 0, false);
    }

    // Run 1 CPU cycle, bro!
    run_cycle() {
        if (this.io.dma.running) {
            this.io.dma.step++;
            if (this.io.dma.step === 1) return;
            this.io.dma.step = 0;
            this.bus.PPU_reg_write(0x2004, this.bus.CPU_read(this.io.dma.addr));
            this.io.dma.bytes_left--;
            if (this.io.dma.bytes_left === 0) {
                this.io.dma.running = 0;
            }
            return;
        }
        if (!this.cpu.pins.RW)
            this.cpu.pins.D = this.bus.CPU_read(this.cpu.pins.Addr, this.cpu.pins.D);
        this.cpu.cycle();
        if (this.cpu.pins.RW)
            this.bus.CPU_write(this.cpu.pins.Addr, this.cpu.pins.D);
    }

    reg_read(addr, val, has_effect=true) {
        return val;
    }

    reg_write(addr, val) {
        switch(addr) {
            case 0x4014: //OAMDMA
                // TODO: make this better
                this.io.dma.addr = val << 8;
                this.io.dma.running = 1;
                this.io.dma.bytes_left = 256;
                return;
        }
    }
}