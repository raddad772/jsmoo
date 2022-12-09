"use strict";

const NES_APU_lenctr = [
    0x0A, 0xFE, 0x14, 0x02, 0x28, 0x04, 0x50, 0x06,
    0xA0, 0x08, 0x3C, 0x0A, 0x0E, 0x0C, 0x1A, 0x0E,
    0x0C, 0x10, 0x18, 0x12, 0x30, 0x14, 0x60, 0x16,
    0xC0, 0x18, 0x48, 0x1A, 0x10, 0x1C, 0x20, 0x1E,
]

const NES_APU_SW_duties = [
    [0, 0, 0, 0, 0, 0, 0, 1],  //12.5%
    [0, 0, 0, 0, 0, 0, 1, 1],  //25.0%
    [0, 0, 0, 0, 1, 1, 1, 1],  //50.0%
    [1, 1, 1, 1, 1, 1, 0, 0],  //25.0% (negated)
]

const NES_APU_noise_period_NTSC = [
      4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068
];

const NES_APU_dmc_period_NTSC = [
    428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 84, 72, 54
];

class NES_APU_envelope {
    constructor() {
        this.speed = 0;
        this.use_speed_for_vol = 0;
        this.loop_mode = 0;
        this.reload_decay = 0;
        this.decay_counter = 0;
        this.decay_volume = 0;
    }

    volume() {
        return this.use_speed_for_vol ? this.speed : this.decay_volume;
    }

    cycle() {
        if (this.reload_decay) {
            this.reload_decay = 0;
            this.decay_volume = 15;
            this.decay_counter = this.speed + 1;
        }
        else if (--this.decay_counter === 0) {
            this.decay_counter = this.speed + 1;
            if (this.decay_volume || this.loop_mode) this.decay_volume = (this.decay_volume - 1) & 15;
        }
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

    check_period() {
        if (this.pulse_period > 0x7FF) return false;
        return !((this.decrement === 0) && (((this.pulse_period + (this.pulse_period >>> this.shift)) & 0x800)));
    }

    cycle(chan) {
        if (--this.counter === 0) {
            this.counter = this.period + 1;
            if (this.enable && this.shift && (this.pulse_period > 8)) {
                let delta = this.pulse_period >>> this.shift;

                if (this.decrement) {
                    this.pulse_period = (this.pulse_period - delta) & 0x7FF;
                    if (chan === 0) this.pulse_period = (this.pulse_period - 1) & 0x7FF;
                }
                else if ((this.pulse_period + delta) < 0x800)
                    this.pulse_period += delta;
            }
        }

        if (this.reload !== 0) {
            this.reload = 0;
            this.counter = this.period + 1;
        }
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

        this.output = 0;
    }

    cycle() {
        if ((!this.sweep.check_period()) || (this.length_counter === 0)) {
            this.output = 0;
            return;
        }

        this.output = NES_APU_SW_duties[this.duty][this.duty_counter] ? this.envelope.volume() : 0;
        if (this.sweep.pulse_period < 0x800) this.output = 0;

        if (--this.period_counter === 0) {
            this.period_counter = (this.sweep.pulse_period + 1) * 2;
            this.duty_counter--;
        }
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

        this.output = 0;
    }

    cycle() {
        this.output = this.step_counter & 15;
        if ((this.step_counter & 0x10) === 0) this.output ^= 0x0F; // Descending side
        if ((this.length_counter === 0) || (this.linear_length_counter === 0))
            return;

        if (--this.period_counter === 0) {
            this.step_counter++;
            this.period_counter = this.period + 1;
        }
    }

    clock_linear() {
        if (this.reload_linear)
            this.linear_length_counter = this.linear_length;
        else if (this.linear_length_counter > 0)
            this.linear_length_counter--;

        if (this.halt_length_counter === 0) this.reload_linear = false;
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

        this.output = 0;
    }

    cycle() {
        if (this.length_counter === 0) {
            this.output = 0;
            return;
        }

        this.output = (this.lfsr & 1) ? this.envelope.volume() : 0;

        if (--this.period_counter === 0) {
            let feedback;

            if (this.short_mode)
                feedback = (this.lfsr & 1) ^ ((this.lfsr >>> 6) & 1);
            else
                feedback = (this.lfsr & 1) ^ ((this.lfsr >>> 1) & 1);

            this.lfsr = (this.lfsr >>> 1) | (feedback << 14);
            this.period_counter = NES_APU_noise_period_NTSC[this.period];
        }
    }
}

class NES_APU_DMC {
    /**
     * @param {NES_bus} bus
     * @param {NES_APU} apu
     */
    constructor(bus, apu) {
        this.bus = bus;
        this.apu = apu;
        
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

        this.output = 0;
    }

    start() {
        if (this.length_counter === 0) {
            this.read_addr = 0x4000 + (this.addr_latch << 6);
            this.length_counter = (this.length_latch << 4) + 1;
        }
    }

    stop() {
        this.length_counter = 0;
        this.dma_delay_counter = 0;
    }

    cycle() {
        this.output = this.dac_latch;

        if (this.dma_delay_counter > 0) {
            this.dma_delay_counter--;

            if (this.dma_delay_counter === 0) {
                //this.dma_buffer = this.bus.CPU_read(0x8000 | this.read_addr, 0, true);
                this.dma_buffer_valid = true;
                this.length_counter--;
                this.read_addr = (this.read_addr + 1) & 0x7FFF;

                if (this.length_counter === 0) {
                    if (this.loop_mode !== 0)
                        this.start()
                    else if (this.irq_enable) {
                        this.irq_pending = 1;
                        this.apu.eval_IRQ();
                    }
                }
            }
        }
        
        if (--this.period_counter === 0) {
            if (this.sample_valid) {
                let delta = (((this.sample >>> this.bit_counter) & 1) << 2) - 2;
                let data = this.dac_latch + delta;
                if ((data & 0x80) === 0) this.dac_latch = data;
            }

            this.bit_counter = (this.bit_counter + 1) & 7;
            if (this.bit_counter === 0) {
                if (this.dma_buffer_valid) {
                    this.sample_valid = true;
                    this.sample = this.dma_buffer;
                    this.dma_buffer_valid = false;
                }
                else
                    this.sample_valid = false;
            }

            this.period_counter = NES_APU_dmc_period_NTSC[this.period]
        }

        if ((this.length_counter > 0) && (!this.dma_buffer_valid) && (this.dma_delay_counter === 0)) {
            this.dma_delay_counter = 4;
        }
    }
}

class NES_APU_framecounter {
    constructor() {
        this.irq_pending = 0;
        this.mode = 0;
        this.counter = 0;
        this.divider = 1;
    }
    
    inc_divider() {
        this.divider = (this.divider + 14915) & 0xFFFFFFFF;        
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
        this.dmc = new NES_APU_DMC(bus, this);
        this.fc = new NES_APU_framecounter();

        this.enabled_channels = 0;

        this.pulseDAC = [];
        this.dmc_triangle_noise_DAC = [];
        for (let amp = 0; amp < 32; amp++) {
            if (amp === 0)
                this.pulseDAC[amp] = 0;
            else
                this.pulseDAC[amp] = Math.floor((32768.0 * 95.88 / (8128.0 / amp + 100.0))) & 0xFFFF;
        }
        for(let dmcAmp = 0; dmcAmp < 128; dmcAmp++) {
            this.dmc_triangle_noise_DAC[dmcAmp] = [];
            for (let triangleAmp  = 0; triangleAmp < 16; triangleAmp++) {
                this.dmc_triangle_noise_DAC[dmcAmp][triangleAmp] = [];
                for (let noiseAmp = 0; noiseAmp < 16; noiseAmp++) {
                    if (dmcAmp === 0 && triangleAmp === 0 && noiseAmp === 0)
                        this.dmc_triangle_noise_DAC[dmcAmp][triangleAmp][noiseAmp] = 0;
                    else
                        this.dmc_triangle_noise_DAC[dmcAmp][triangleAmp][noiseAmp]
                            = Math.floor(32768.0 * 159.79 / (100.0 + 1.0 / (triangleAmp / 8227.0 + noiseAmp / 12241.0 + dmcAmp / 22638.0))) & 0xFFFF;
                }
            }
        }

    }

    reset() {
        console.log('UMMM ADD RESET TO NES APU');
    }

    eval_IRQ() {
        //if (this.fc.irq_pending || this.dmc.irq_pending) this.bus.CPU_notify_IRQ(1);
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
        console.log(hex4(addr), hex2(val));
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
                    this.fc_cycle(); // ClockFrameCounter
                if (this.fc.mode & 1) {
                    this.fc.irq_pending = 0;
                    this.eval_IRQ();
                }
                this.fc.divider = 14915;
                return;

        }
    }

    // Advance frame counter
    fc_cycle() {
        this.fc.counter = (this.fc.counter + 1) & 3;

        if (this.fc.counter & 1) {
            if ((this.sw1.envelope.loop_mode === 0) && (this.sw1.length_counter > 0)) this.sw1.length_counter--;
            if ((this.sw2.envelope.loop_mode === 0) && (this.sw2.length_counter > 0)) this.sw2.length_counter--;
            this.sw1.sweep.cycle(0);
            this.sw2.sweep.cycle(1);
            if ((this.triangle.halt_length_counter === 0) && (this.triangle.length_counter > 0)) this.triangle.length_counter--;
            if ((this.noise.envelope.loop_mode === 0) && (this.noise.length_counter > 0)) this.noise.length_counter--;
        }

        this.sw1.envelope.cycle();
        this.sw2.envelope.cycle();
        this.triangle.clock_linear();
        this.noise.envelope.cycle();
        
        if (this.fc.counter === 0) {
            if (this.fc.mode & 2)
                this.fc.inc_divider();
            if (this.fc.mode === 0) {
                this.fc.irq_pending = 1;
                this.eval_IRQ();
            }
        }
    }

    cycle(current_clock) {
        if (current_clock >= this.output.next_buf_sample) {
            this.output.sample(current_clock, this.mix_sample());
        }

        this.sw1.cycle();
        this.sw2.cycle();
        this.triangle.cycle();
        this.noise.cycle();
        //this.dmc.cycle();

        this.fc_div_cycle();
    }

    mix_sample() {
        let output = 0;
        output += this.pulseDAC[this.sw1.output + this.sw2.output];
        output += this.dmc_triangle_noise_DAC[this.dmc.output][this.triangle.output][this.noise.output];
        output = Math.floor(output) & 0xFFFF;
        return output;
    }

    fc_div_cycle() {
        this.fc.divider -= 2;
        if (this.fc.divider <= 0) {
            this.fc_cycle();
            this.fc.inc_divider();
        }
    }
}