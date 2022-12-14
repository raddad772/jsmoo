"use strict";

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
}

class NES_APU {
    constructor(clock, bus) {
        this.output = new JSM_audiobuffer();

        this.clock = clock;
        this.bus = bus;

        this.bus.apu = this;

        this.sw1 = new NES_APU_squarewave();
        this.sw2 = new NES_APU_squarewave();

        this.enabled_channels = 0;

    }

    reset() {
        console.log('UMMM ADD RESET TO NES APU');
    }

    read_IO(addr, val, has_effect) {
        console.log('READ!', hex4(addr));
        switch(addr) {
            case 0x4015: // Status stuff
                val = +(this.sw1.length_counter > 0);
                val |= (+(this.sw2.length_counter > 0)) << 1;
                val |= (+(this.triangle.length_counter > 0)) << 2;
                val |= (+(this.noise.length_counter > 0)) << 3;
                val |= (+(this.noise.length_counter > 0)) << 4;
                val |= (+(this.fc.irq_pending)) << 6;
                val |= (+(this.dmc.irq_pending)) << 7;
                // no more IRQ
                // set IRQ
                return val;
        }
        return val;
    }

    write_IO(addr, val) {
        //console.log(hex4(addr), hex2(val));
        switch(addr) {
            case 0x4000: // sw1 stuff
                this.sw1.envelope.speed = val & 15;
                this.sw1.envelope.use_speed_for_vol = (val >>> 4) & 1;
                this.sw1.envelope.loop_mode = (val >>> 5) & 1;
                this.sw1.duty = (val >>> 6) & 3;
                break;
                console.log('ENVELOPE?', val);
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
                console.log('PERIOD!', this.sw1.period);
                return;
            case 0x4003: // sw1 even mooore stuff
                this.sw1.period = (this.sw1.period & 0xFF) | ((val & 7) << 8);
                this.sw1.sweep.pulse_period = (this.sw1.sweep.pulse_period & 0xFF) | ((val & 7) << 8);
                console.log('PERIOD!', this.sw1.period);

                this.sw1.duty_counter = 0;
                this.sw1.envelope.reload_decay = 1;

                //if (this.enabled_channels & 1)
                    //this.sw1.length_counter = NES_APU_lenctr[(val >>> 3) & 0x1F];
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

                //if (this.enabled_channels & 2)
                    //this.sw2.length_counter = NES_APU_lenctr[(val >>> 3) & 0x1F];
                return;
            case 0x4015:
                if (!(val & 1)) this.sw1.length_counter = 0;
                if (!(val & 2)) this.sw2.length_counter = 0;
                //if (!(val & 4)) this.triangle.length_counter = 0;
                //if (!(val & 8)) this.noise.length_counter = 0;
                //if (!(val & 16)) this.dmc.stop();
                //else this.dmc.start();

                //this.dmc.irq_pending = 0;
                //this.eval_IRQ();
                this.enabled_channels = val & 0x1F;
                return;
        }
    }

    cycle(master_clock) {
        this.sw1.cycle();
        if (master_clock >= this.output.next_buf_sample) {
            this.output.sample(this.mix_sample());
        }
    }
}