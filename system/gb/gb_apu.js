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

        this.env_vol = 0;
        this.env_dir = 0;
        this.env_freq = 0;
        this.counter = 0;

        this.length = 0; // (64-t1)*(1/256) seconds
    }

    is_enabled() {
        return (this.env_vol || this.env_dir);
    }

    cycle() {
        if (this.freq_timer > 0) {
            this.freq_timer--;
            if (this.freq_timer === 0) {
                this.freq_timer = (2048 - this.freq_timer_reload);
                this.duty_pos = (this.duty_pos + 1) & 7;
            }
        }
        let output = GB_APU_sw_duty[this.duty][this.duty_pos];
        this.output = output;
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
     * @param {GB_clock} clock
     * @param {GB_bus} bus
     */
    constructor(clock, bus) {
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
        if ((clock & 1) === 0) {
            // Clock length
            this.sw2.cycle_length();
        }
        if ((clock & 3) === 2) {
            // clock any sweeps here
        }
        if ((clock & 7) === 7) {
            // Clock volume envelope
            this.sw2.cycle_envelope();
        }

    }

    read_IO(addr, val) {
        let r = 0;
        switch(addr) {
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
                r = this.sw2.counter << 6;
                return r;
        }
        return 0xFF;
    }

    write_IO(addr, val) {
        switch(addr) {
            case 0xFF16: // NR21 channel 2 stuff
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
            case 0xFF26: // frame
        }
    }

    mix_sample() {
        let output = 0;
        output += this.sw2.output;

        return output;
    }
}