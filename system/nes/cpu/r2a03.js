"use strict";
/*
  Ricoh 2A03, i.e., the CPU at the heart of the NES.
  It includes:
    * custom M6502 processor with BCD removed (DONE!)
    * Some sprite DMA capabilities (DONE!)
    * Sound output
    * Some memory-mapped registers (SOME DONE! SOME NOT!)
 */


class NES_controllerport {
	constructor() {
		this.device = null;
	}

    serialize() {
        return {version: 1}
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG NES_controllerport version!');
            return false;
        }
        return true;
    }

	data() {
		if (this.device) return this.device.data() & 3;
		return 0;
	}

	latch(what) {
		if (this.device) return this.device.latch(what);
	}
}


const SER_R2A03 = ['cpu', 'apu', 'io', 'controller_port1', 'controller_port2', 'joypad1', 'joypad2']
class ricoh2A03 {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.cpu = new m6502_t(nesm6502_opcodes_decoded, clock);
        this.bus = bus;
        this.clock = clock;

        this.apu = new rp2a03(clock, bus, this);

        this.tracing = false;

        this.bus.CPU_reg_write = this.reg_write.bind(this);
        this.bus.CPU_reg_read = this.reg_read.bind(this);
        this.bus.CPU_notify_NMI = this.notify_NMI.bind(this);
        this.bus.CPU_notify_IRQ = this.notify_IRQ.bind(this);
        this.cpu.reset();

        this.io = {
            dma: {
                addr: 0,
                running: 0,
                bytes_left: 0,
                step: 0
            }
        }
        this.controller_port1 = new NES_controllerport();
        this.controller_port2 = new NES_controllerport();

		this.joypad1 = new NES_joypad(1);
		this.joypad2 = new NES_joypad(2);
		this.controller_port1.device = this.joypad1;
		this.controller_port2.device = this.joypad2;
    }

    serialize() {
        let o = {
            version: 1,
        }
        serialization_helper(o, this, SER_R2A03);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD NES R2A03 VERSION');
            return false;
        }
        return deserialization_helper(this, from, SER_R2A03);
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
        //this.cpu.pins.IRQ = +level;
        if ((+level) === 0) this.cpu.IRQ_ack = true;
        else if ((+level) !== this.cpu.pins.IRQ) this.cpu.IRQ_ack = false;
        this.cpu.pins.IRQ = +level;
    }

    reset() {
        this.cpu.reset();
        this.apu.reset();
        this.clock.cpu_frame_cycle = 0;
        this.io.dma.running = 0;
    }

    read_trace(addr) {
        return this.bus.CPU_read(addr, 0, false);
    }

    // Run 1 CPU cycle, bro!
    run_cycle() {
        if (this.io.dma.running) {
            this.io.dma.step++;
            if (this.io.dma.step === 1) {
                return;
            }
            this.io.dma.step = 0;
            this.bus.PPU_reg_write(0x2004, this.bus.CPU_read(this.io.dma.addr));
            this.io.dma.bytes_left--;
            this.io.dma.addr = (this.io.dma.addr + 1) & 0xFFFF;
            if (this.io.dma.bytes_left === 0) {
                this.io.dma.running = 0;
            }
            return;
        }
        if (!this.cpu.pins.RW) {
            this.cpu.pins.D = this.bus.CPU_read(this.cpu.pins.Addr, this.cpu.pins.D);
            if (this.tracing) {
                dbg.traces.add(TRACERS.M6502, this.clock.trace_cycles, trace_format_read('MOS', MOS_COLOR, this.clock.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
            }
        }
        this.cpu.cycle();
        if (this.cpu.pins.RW) {
            this.bus.CPU_write(this.cpu.pins.Addr, this.cpu.pins.D);
            if (this.tracing) {
                dbg.traces.add(TRACERS.M6502, this.clock.trace_cycles, trace_format_write('MOS', MOS_COLOR, this.clock.trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));

            }
        }
    }

    reg_read(addr, val, has_effect=true) {
        switch(addr) {
            case 0x4016: // JOYSER0
                let r = this.controller_port1.data();
                //console.log(r);
                return r;
            case 0x4017: // JOYSER1
                //let rr = this.controller_port2.data();
                return 0;
                //return rr;
        }
        return val;
    }

    reg_write(addr, val) {
        switch(addr) {
            case 0x4014: //OAMDMA
                this.io.dma.addr = val << 8;
                this.io.dma.running = 1;
                this.io.dma.bytes_left = 256;
                this.io.dma.step = 0;
                return;
            case 0x4016: // JOYSER0
                this.controller_port1.latch(val&1);
                break;
       }
    }

    /**
     * @param {nespad_inputs} inp1
     * @param {nespad_inputs} inp2
     */
    update_inputs(inp1, inp2) {
        this.joypad1.buffer_input(inp1);
        this.joypad2.buffer_input(inp2);
    }
}