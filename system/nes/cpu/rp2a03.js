"use strict";

const NES_APU_lenctr = [
    0x0A, 0xFE, 0x14, 0x02, 0x28, 0x04, 0x50, 0x06,
    0xA0, 0x08, 0x3C, 0x0A, 0x0E, 0x0C, 0x1A, 0x0E,
    0x0C, 0x10, 0x18, 0x12, 0x30, 0x14, 0x60, 0x16,
    0xC0, 0x18, 0x48, 0x1A, 0x10, 0x1C, 0x20, 0x1E,
]

class NES_APU_envelope {
    constructor() {
        this.speed = 0;
        this.use_speed_for_vol = 0;
        this.loop_mode = 0;
        this.reload_decay = 0;
        this.decay_counter = 0;
        this.decay_volume = 0;
    }
}

class NES_APU_sweep {
    constructor() {
        this.shift = 0;
        this.decrement = 0;
        this.period = 0;
        this.counter = 1;
        this.enable = 0;
        this.reload = 0;
        this.pulse_period = 0;
    }
}

class NES_APU_squarewave {
    constructor() {
        this.envelope = new NES_APU_envelope();
        this.sweep = new NES_APU_sweep();

        this.length_counter = 0;
        this.period_counter = 1;
        this.duty = 0;
        this.duty_counter = 0;
        this.period = 0;
    }
}

class NES_APU_triangle {
    constructor() {
        this.length_counter = 0;
        this.period_counter = 1;
        this.linear_length = 0;
        this.halt_length_counter = 0;
        this.period = 0;
        this.step_counter = 16;
        this.linear_length_counter = 0;
        this.reload_linear = 0;
    }
}

class NES_APU_noise {
    constructor() {
        this.envelope = new NES_APU_envelope();

        this.length_counter = 0;
        this.period_counter = 1;
        this.period = 0;
        this.short_mode = 0;
        this.lfsr = 1;
    }
}

class NES_APU_DMC {
    constructor() {
        this.length_counter = 0;
        this.period_counter = 0;
        this.dma_delay_counter = 0;
        this.irq_pending = false;
        this.period = 0;
        this.irq_enable = 0;
        this.loop_mode = 0;
        this.dac_latch = 0;
        this.addr_latch = 0;
        this.length_latch = 0;
        this.read_addr = 0;
        this.bit_counter = 0;
        this.dma_buffer_valid = 0;
        this.dma_buffer = 0;
        this.sample_valid = 0;
        this.sample = 0;
    }
}

class NES_APU_framecounter {
    constructor() {
        this.irq_pending = 0;
        this.mode = 0;
        this.counter = 0;
        this.divider = 1;
    }
}

class NES_APU {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.output = new JSM_audiobuffer();

        this.clock = clock;
        this.bus = bus;

        this.bus.apu = this;

        this.sw1 = new NES_APU_squarewave();
        this.sw2 = new NES_APU_squarewave();
        this.triangle = new NES_APU_triangle();
        this.noise = new NES_APU_noise();
        this.dmc = new NES_APU_DMC();
        this.fc = new NES_APU_framecounter();

        this.enabled_channels = 0;
    }

    eval_IRQ() {
        if (this.fc.irq_pending || this.dmc.irq_pending) this.bus.CPU_notify_IRQ(1);
    }

    read_IO(addr, val, has_effect=true) {
        let data = 0;
        switch(addr) {
            case 0x4015: // Status
                data = +(this.sw1.length_counter > 0);
                data |= (+(this.sw2.length_counter > 0)) << 1;
                data |= (+(this.triangle.length_counter > 0)) << 2;
                data |= (+(this.noise.length_counter > 0)) << 3;
                data |= (+(this.dmc.length_counter > 0)) << 4;
                data |= this.fc.irq_pending << 6;
                data |= this.dmc.irq_pending << 7;
                this.fc.irq_pending = 0;
                this.eval_IRQ();
                return data;
        }
        return val;
    }

    write_IO(addr, val) {
        switch(addr) {
            case 0x4000: // sw1 stuff
                this.sw1.envelope.speed = val & 15;
                this.sw1.envelope.use_speed_for_vol = (val >>> 4) & 1;
                this.sw1.envelope.loop_mode = (val >>> 5) & 1;
                this.sw1.duty = (val >>> 6) & 3;
                break;
            case 0x4001: // sw1 more stuff
                this.sw1.sweep.shift = val & 7;
                this.sw1.sweep.decrement = (val >>> 3) & 1;
                this.sw1.sweep.period = (val >>> 4) & 7;
                this.sw1.sweep.enable = (val >>> 7) & 1;
                this.sw1.sweep.reload = true;
                break;
            case 0x4002: // sw1 mooore stuf
                this.sw1.period = (this.sw1.period & 0x700) | val;
                this.sw1.sweep.pulse_period = (this.sw1.sweep.pulse_period & 0x700) | val;
                return;
            case 0x4003: // sw1 even mooore stuff
                this.sw1.period = (this.sw1.period & 0xFF) | ((val & 7) << 8);
                this.sw1.sweep.pulse_period = (this.sw1.sweep.pulse_period & 0xFF) | ((val & 7) << 8);

                this.sw1.duty_counter = 0;
                this.sw1.envelope.reload_decay = 1;

                if (this.enabled_channels & 1)
                    this.sw1.length_counter = NES_APU_lenctr[(val >>> 3) & 0x1F];
                break;
            case 0x4004: // sw2 some stuff
                this.sw2.envelope.speed = val & 15;
                this.sw2.envelope.use_speed_for_vol = (val >>> 4) & 1;
                this.sw2.envelope.loop_mode = (val >>> 5) & 1;
                this.sw2.duty = (val >>> 6) & 3;
                break;
            case 0x4005: // sw2 more stuff
                this.sw2.sweep.shift = val & 7;
                this.sw2.sweep.decrement = (val >>> 3) & 1;
                this.sw2.sweep.period = (val >>> 4) & 7;
                this.sw2.sweep.enable = (val >>> 7) & 1;
                this.sw2.sweep.reload = true;
                break;
            case 0x4006: // sw2 mooore stuf
                this.sw2.period = (this.sw2.period & 0x700) | val;
                this.sw2.sweep.pulse_period = (this.sw2.sweep.pulse_period & 0x700) | val;
                return;
            case 0x4007: // sw2 even mooore stuff
                this.sw2.period = (this.sw2.period & 0xFF) | ((val & 7) << 8);
                this.sw2.sweep.pulse_period = (this.sw2.sweep.pulse_period & 0xFF) | ((val & 7) << 8);

                this.sw2.duty_counter = 0;
                this.sw2.envelope.reload_decay = 1;

                if (this.enabled_channels & 2)
                    this.sw2.length_counter = NES_APU_lenctr[(val >>> 3) & 0x1F];
                return;
            case 0x4008:
                this.triangle.linear_length = (val & 0x7F);
                this.triangle.halt_length_counter = (val >>> 7) & 1;
                return;

            case 0x400A:
                this.triangle.period = (this.triangle.period & 0x700) | val;
                return;
            case 0x400B:
                this.triangle.period = (this.triangle.period & 0xFF) | ((val & 7) << 8);
                this.triangle.reload_linear = 1;
                if (this.enabled_channels & 4)
                    this.triangle.length_counter = NES_APU_lenctr[(val >>> 3) & 0x1F];
                break;

            case 0x400C:
                this.noise.envelope.speed = val & 0x0F;
                this.noise.envelope.use_speed_for_vol = (val >>> 4) & 1;
                this.noise.envelope.loop_mode = (val >>> 5) & 1;
                return;
            case 0x400E:
                this.noise.period = val & 0x0F;
                this.noise.short_mode = (val >>> 7) & 1;
                return;
            case 0x400F:
                this.noise.envelope.reload_decay = 1;

                if (this.enabled_channels & 8)
                    this.noise.length_counter = NES_APU_lenctr[((val >>> 3) & 0x1F)];
                return;
            case 0x4010:
                this.dmc.period = val & 0x0F;
                this.dmc.loop_mode = (val >>> 6) & 1;
                this.dmc.irq_enable = (val >>> 7) & 1;

                this.dmc.irq_pending = this.dmc.irq_enable && this.dmc.irq_pending && (!this.dmc.loop_mode);
                this.eval_IRQ();
                return;
            case 0x4011:
                this.dmc.dac_latch = val & 0x7F;
                return;
            case 0x4012:
                this.dmc.addr_latch = val;
                return;
            case 0x4013:
                this.dmc.length_latch = val;
                return;
            case 0x4015:
                if (!(val & 1)) this.sw1.length_counter = 0;
                if (!(val & 2)) this.sw2.length_counter = 0;
                if (!(val & 4)) this.triangle.length_counter = 0;
                if (!(val & 8)) this.noise.length_counter = 0;
                if (!(val & 16)) this.dmc.stop();
                else this.dmc.start();

                this.dmc.irq_pending = 0;
                this.eval_IRQ();
                this.enabled_channels = val & 0x1F;
                return;

            case 0x4017:
                this.fc.mode = (val >>> 6) & 3;
                this.fc.counter = 0;
                if (this.fc.mode & 2)
                    this.fc_clock(); // ClockFrameCounter
                if (this.fc.mode & 1) {
                    this.fc.irq_pending = 0;
                    this.eval_IRQ();
                }
                this.fc.divider = 14915;
                return;

        }
    }

    cycle() {

    }
}