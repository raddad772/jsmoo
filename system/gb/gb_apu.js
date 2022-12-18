"use strict";

const GB_APU_sw_duty = Object.freeze([
    Object.freeze([0, 0, 0, 0, 0, 0, 0, 1]),
    Object.freeze([0, 0, 0, 0, 0, 0, 1, 1]),
    Object.freeze([0, 0, 0, 0, 1, 1, 1, 1]),
    Object.freeze([1, 1, 1, 1, 1, 1, 0, 0])
]);

class GB_envelope {
    constructor() {
    }
}

class GB_squarewave1 {
    constructor() {
        this.output = 0;

        this.freq_timer = 0;
        this.freq_timer_reload = 0;

        this.duty = 0;
        this.duty_pos = 0;
        this.duty_out = 0;

        this.vol = 0;
        this.enable = 0;

        this.env_vol = 0;
        this.env_dir = 0;
        this.env_freq = 0;
        this.env_period = 0;
        this.counter = 0;

        this.sweep_enable = 0;
        this.sweep_negate = 0;
        this.freq_shadow = 0;
        this.sweep_dir = 0;
        this.sweep_period = 0;
        this.sweep_shift = 0;
        this.sweep_freq = 0;
        this.update = 0;

        this.length = 0; // (64-t1)*(1/256) seconds
    }

    reset() {
        this.enable = this.duty = this.env_vol = this.env_dir =
            this.env_dir = this.env_freq = this.freq_timer_reload =
                this.counter = 0;

        this.output = this.duty_out = this.duty_pos = this.freq_timer =
            this.env_period = this.vol = 0;
    }

    is_enabled() {
        return (this.env_vol || this.env_dir);
    }

    start() {
        this.enable = this.is_enabled();
        this.freq_timer = (2048 - this.freq_timer_reload);
        this.env_period = this.env_freq;
        this.vol = this.env_vol;
        console.log('START ME 1!', this.enable, this.freq_timer, this.env_vol, this.length);

        if (this.length === 0) {
            this.length = 64;
            if ((this.duty_pos & 1) && this.counter) this.length--;
        }
    }

    sweep(update) {
        if (!this.sweep_enable) return;

        this.sweep_negate = this.sweep_dir;
        let d = this.freq_shadow >>> this.sweep_shift;
        let f = d;
        if (this.sweep_dir === 1) f = this.freq_shadow - d;
        else f = this.freq_shadow + d;

        if (f > 2047)
            this.enable = 0;
        else if (update) {
            this.freq_shadow = f;
            this.freq_timer_reload = freq & 2047;
            this.freq_timer = (2048 - this.freq_timer_reload);
        }
    }

    cycle_sweep() {
        if (this.sweep_period > 0) {
            this.sweep_period--;
            if (this.sweep_period === 0) {
                this.sweep_period = this.sweep_freq ? this.sweep_freq : 8;
                if (this.sweep_enable && this.sweep_freq) {
                    this.sweep(1);
                    this.sweep(0);
                }
            }
        }
    }

    cycle_envelope() {
        if (this.enable && this.env_freq) {
            this.env_period = this.env_period - 1;
            if (this.env_period === 0) {
                this.env_period = this.env_freq ? this.env_freq : 8;
                if ((this.env_dir === 0) && (this.vol > 0)) this.vol--;
                if ((this.env_dir === 1) && (this.vol < 15)) this.vol++;
            }
        }
    }

    cycle_length() {
        if ((this.counter !== 0) && (this.length > 0)) {
            this.length = this.length - 1;
            if (this.length === 0) {
                this.enable = 0;
            }
        }
    }

    cycle() {
        if (this.freq_timer > 0) {
            this.freq_timer--;
            if (this.freq_timer === 0) {
                this.freq_timer = (2048 - this.freq_timer_reload);
                this.duty_pos = (this.duty_pos + 1) & 7;
                this.duty_out = GB_APU_sw_duty[this.duty][this.duty_pos];
            }
        }
        this.output = (this.duty_out && this.enable) ? this.vol : 0;
        if (dbg.watch_on) console.log(this.output, this.duty_out, this.enable, this.vol);
        this.output *= (4096 * (this.vol / 15));
    }
}

class GB_squarewave2 {
    constructor() {
        this.output = 0;

        this.freq_timer = 0;
        this.freq_timer_reload = 0;

        this.duty = 0;
        this.duty_pos = 0;
        this.duty_out = 0;

        this.vol = 0;
        this.enable = 0;

        this.env_vol = 0;
        this.env_dir = 0;
        this.env_freq = 0;
        this.env_period = 0;
        this.counter = 0;

        this.length = 0; // (64-t1)*(1/256) seconds
    }

    reset() {
        this.enable = this.duty = this.env_vol = this.env_dir =
            this.env_dir = this.env_freq = this.freq_timer_reload =
                this.counter = 0;

        this.output = this.duty_out = this.duty_pos = this.freq_timer =
            this.env_period = this.vol = 0;
    }

    is_enabled() {
        return (this.env_vol || this.env_dir);
    }

    start() {
        this.enable = this.is_enabled();
        this.freq_timer = (2048 - this.freq_timer_reload);
        this.env_period = this.env_freq;
        this.vol = this.env_vol;

        if (this.length === 0) {
            this.length = 64;
            if ((this.duty_pos & 1) && this.counter) this.length--;
        }
    }

    cycle_envelope() {
        if (this.enable && this.env_freq) {
            this.env_period = this.env_period - 1;
            if (this.env_period === 0) {
                this.env_period = this.env_freq ? this.env_freq : 8;
                if ((this.env_dir === 0) && (this.vol > 0)) this.vol--;
                if ((this.env_dir === 1) && (this.vol < 15)) this.vol++;
            }
        }
    }

    cycle_length() {
        if ((this.counter !== 0) && (this.length > 0)) {
            this.length = this.length - 1;
            if (this.length === 0) {
                this.enable = 0;
            }
        }
    }

    cycle() {
        if (this.freq_timer > 0) {
            this.freq_timer--;
            if (this.freq_timer === 0) {
                this.freq_timer = (2048 - this.freq_timer_reload);
                this.duty_pos = (this.duty_pos + 1) & 7;
                this.duty_out = GB_APU_sw_duty[this.duty][this.duty_pos];
            }
        }
        this.output = (this.duty_out && this.enable) ? this.vol : 0;
        this.output *= (4096 * (this.vol / 15));
    }
}


class GB_customwave {
    constructor() {
        this.output = 0;
    }
}

class GB_frame_sequencer {
    constructor() {
        // 512hz tick
    }
}

class GB_noise {
    constructor() {
        this.output = 0;
    }
}

class GB_APU {
    /**
     * @param {number} variant
     * @param {GB_clock} clock
     * @param {GB_bus} bus
     */
    constructor(variant, clock, bus) {
        this.variant = variant;
        this.output = new JSM_audiobuffer();
        this.clock = clock;
        this.bus = bus;

        this.bus.apu = this;

        // Register read/write
        this.regs = {};

        this.frame_seq = new GB_frame_sequencer();

        this.sw1 = new GB_squarewave1();
        this.sw2 = new GB_squarewave2();
    }

    cycle(current_clock) {
        // 1MHz clock
        if (current_clock >= this.output.next_buf_sample) {
            this.output.sample(this.mix_sample());
        }

        // 512kHz clock for frame sequencer
        if (current_clock & 1) this.cycle_frame_sequencer(current_clock >>> 1);


        // 1MHz tick
        this.sw1.cycle();
        this.sw2.cycle();
    }

    cycle_frame_sequencer(clock) {
        if ((clock & 1) === 0) { // Every other
            // Clock length
            this.sw1.cycle_length();
            this.sw2.cycle_length();
        }
        if ((clock & 3) === 2) { // Every 4
            this.sw1.cycle_sweep();
        }
        if ((clock & 7) === 7) { // Every 8
            // Clock volume envelope
            this.sw1.cycle_envelope();
            this.sw2.cycle_envelope();
        }

    }

    read_IO(addr, val) {
        let r = 0;
        switch(addr) {
            case 0xFF10: // NR10
                r = (this.sw1.sweep_shift) & 7;
                r |= (this.sw1.sweep_dir) << 3;
                r |= ((this.sw1.sweep_freq) & 7) << 4;
                return r;
            case 0xFF11: // NR11
                return (this.sw2.duty << 6);
            case 0xFF12: // NR12
                r = this.sw1.env_freq & 7;
                r |= (this.sw1.env_dir) << 3;
                r |= (this.sw1.env_vol & 0x0F) << 4;
                return r;
            case 0xFF13: // NR13
                return val;
            case 0xFF14: // NR14
                return this.sw1.counter << 6;
            case 0xFF16: // NR21
                return (this.sw2.duty << 6);
            case 0xFF17: // NR22
                r = this.sw2.env_freq & 7;
                r |= (this.sw2.env_dir) << 3;
                r |= (this.sw2.env_vol & 0x0F) << 4;
                return r;
            case 0xFF18: // NR23
                return val;
            case 0xFF19: // NR24
                return this.sw2.counter << 6;
        }
        return 0xFF;
    }

    write_IO(addr, val) {
        switch(addr) {
            case 0xFF10: // NR10 channel 1 sweep stuff
                if (this.sw1.sweep_enable && this.sw1.sweep_negate && ((val & 8) === 0)) this.sw1.enable = 0;
                this.sw1.sweep_shift = val & 7;
                this.sw1.sweep_dir = (val >>> 3) & 1;
                this.sw1.sweep_freq = (val >>> 4) & 7;
                return;
            case 0xFF11: // NR11
                this.sw1.duty = (val >>> 6) & 3;
                this.sw1.length = 64 - (val & 0x3F);
                return;
            case 0xFF12: // NR12
                this.sw1.env_freq = val & 7;
                this.sw1.env_dir = (val >>> 3) & 1;
                this.sw1.env_vol = (val >>> 4) & 16;
                if (!this.sw1.is_enabled()) this.sw1.enable = 0;
                return;
            case 0xFF13: // NR13
                this.sw1.freq_timer_reload = (this.sw1.freq_timer_reload & 0x700) | val;
                return;
            case 0xFF14: // NR14
                if ((this.sw1.duty_pos & 1) && (this.sw1.counter === 0) && (val & 0x20)) {
                    if (this.sw1.length !== 0) {
                        this.sw1.length = (this.sw1.length - 1);
                        if (this.sw1.length === 0) {
                            this.sw1.enable = 0;
                        }
                    }
                }
                this.sw1.freq_timer_reload = (this.sw1.freq_timer_reload & 0xFF) | ((val & 7) << 8);
                this.sw1.counter = (val >>> 6) & 1;
                if (val & 0x80) this.sw1.start();
                return;
            case 0xFF16: // NR21 channel 2 stuff
                // GBC can't write duty for some reason
                this.sw2.duty = (val >>> 6) & 3;
                this.sw2.length = 64 - (val & 0x3F);
                return;
            case 0xFF17: // NR22 envelope stuff
                this.sw2.env_freq = val & 7;
                this.sw2.env_dir = (val >>> 3) & 1;
                this.sw2.env_vol = (val >>> 4) & 15;
                if (!this.sw2.is_enabled()) this.sw2.enable = 0;
                return;
            case 0xFF18: // NR23 channel 2 freq lo
                this.sw2.freq_timer_reload = (this.sw2.freq_timer_reload & 0x700) | val;
                return;
            case 0xFF19: // NR24 channel 2 freq hi & ctrl
                if ((this.sw2.duty_pos & 1) && (this.sw2.counter === 0) && (val & 0x20)) {
                    if (this.sw2.length !== 0) {
                        this.sw2.length = (this.sw2.length - 1);
                        if (this.sw2.length === 0) {
                            this.sw2.enable = 0;
                        }
                    }
                }
                this.sw2.freq_timer_reload = (this.sw2.freq_timer_reload & 0xFF) | ((val & 7) << 8);
                this.sw2.counter = (val >>> 6) & 1;
                if (val & 0x80) this.sw2.start();
                return;
            //case 0xFF26: // frame
        }
    }

    mix_sample() {
        let output = 0;
        output += this.sw1.output;
        //output += this.sw2.output;

        return output;
    }
}