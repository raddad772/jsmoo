"use strict";

const SMSGG_voltable = Object.freeze([
    8191, 6507, 5168, 4105, 3261, 2590, 2057, 1642,
    1298, 1031, 819, 650, 516, 410, 326, 0
    ]);

class SN76489_SW {
    constructor() {
        this.counter = 0;
        this.freq = 0;
    }
}

class JSM_audiobuffer {
    constructor() {
        this.next_buf_sample = 0;
        this.current_buf = new Int16Array();
        this.current_buf_num = 0;
        this.last_finished_buf = -1;
        this.sample_bufs = [];
        this.clocks_per_sample = 0;
        this.buf_pos = 0;
        this.buf_size = 0;
        this.cycles_per_frame = 0;
    }

    set_audio_params(samples_per_frame, sample_rate, buf_size, num_bufs) {
        this.buf_size = buf_size;
        this.num_bufs = num_bufs;
        this.cycles_per_frame = samples_per_frame;

        this.buf_pos = 0;

        this.sample_bufs = [];

        for (let i = 0; i < num_bufs; i++) {
            this.sample_bufs[i] = new Int16Array(buf_size);
        }
        this.current_buf = this.sample_bufs[0];
        this.last_finished_buf = -1;
        this.current_buf_num = 0;
        this.clocks_per_sample = this.cycles_per_frame / buf_size;
    }

    sample(sample) {
        this.next_buf_sample += this.clocks_per_sample;

        this.current_buf[this.buf_pos] = sample;
        this.buf_pos++;
        if (this.buf_pos > this.buf_size) {
            this.advance_buf()
        }
    }

    advance_buf() {
        if (this.last_finished_buf === -1) this.last_finished_buf = this.current_buf_num;
        this.current_buf_num = (this.current_buf_num + 1) % this.num_bufs;
        this.current_buf = this.sample_bufs[this.current_buf_num];
        this.buf_pos = 0;
    }

    get_buffer() {
        let ob = new Int16Array(this.buf_size);
        if (this.last_finished_buf === -1) {
            for (let i = 0; i < this.buf_size; i++) {
                ob[i] = 0;
            }
            return ob;
        }

        ob.set(this.sample_bufs[this.last_finished_buf]);
        this.last_finished_buf = (this.last_finished_buf + 1) % this.num_bufs;
        if (this.last_finished_buf === this.current_buf_num) this.last_finished_buf = -1;
        return ob;
    }
}

class SN76489 {
    constructor() {
        this.output = new JSM_audiobuffer();

        // he SN76489 has 8 "registers" - 4 x 4 bit volume registers, 3 x 10 bit
        // tone registers and 1 x 4 bit noise register*.
        this.vol = [0x0F, 0x0F, 0x0F, 0x07]; // Volume 1-3 and noise. noise is only 3 bits
        this.freq = [0, 0, 0];   // 10 bits
        this.noise = {
            lfsr: 0x8000,
            shift_rate: 0,
            mode: 0,
            counter: 0,
            countdown: 0
        };
        this.sw = [new SN76489_SW(), new SN76489_SW(), new SN76489_SW()]
        this.polarity = [1, 1, 1, 1];

        this.io = {
            reg: 0,   // Current register is 0
            kind: 0, // 0 = tone, volume = 1
        }
    }

    cycle_squares() {
        for (let i = 0; i < 3; i++) {
            let tone = this.sw[i];
            if ((tone.counter > 0) || (tone.freq > 7)) {
                if (tone.counter > 0)
                    tone.counter--;

                if (tone.counter <= 0) {
                    tone.counter = tone.freq;

                    if (tone.freq !== 1)
                        this.polarity[i] ^= 1;
                }
            }
        }
    }

    cycle_noise() {
        this.noise.counter--;
        if (this.noise.counter <= 0) {
            let multiplier = 1;
            switch (this.noise.shift_rate) {
                case 0:
                    this.noise.counter += 16 * multiplier;
                    break;
                case 1:
                    this.noise.counter += 2 * 16 * multiplier;
                    break;
                case 2:
                    this.noise.counter += 4 * 16 * multiplier;
                    break;
                case 3:
                    this.noise.counter += this.sw[2].freq * 16;
                    break;
            }
            this.noise.countdown ^= 1;
            if (this.noise.countdown) {
                this.polarity[3] = this.noise.lfsr & 1;

                if (this.noise.mode) { // White nosie mode
                    let p = this.noise.lfsr & 9;
                    p ^= (p >>> 8);
                    p ^= (p >>> 4);
                    p &= 0xF;
                    p = ((0x6996 >>> p) & 1) ^ 1;
                    this.noise.lfsr = (this.noise.lfsr >>> 1) | (p << 15);
                } else {
                    this.noise.lfsr = (this.noise.lfsr >>> 1) | ((this.noise.lfsr & 1) << 15);
                }
            }

        }
    }

    cycle(current_clock) {
        // Tick the noise
        this.cycle_noise();
        this.cycle_squares();
        if (current_clock >= this.output.next_buf_sample) {
            this.output.sample(current_clock, this.mix_sample());
        }
    }

    mix_sample() {
        let sample = 0;
        for (let i = 0; i < 3; i++) {
            //let intensity = 8192 * ((0x0F - this.vol[i]) / 0x0F);
            let intensity = SMSGG_voltable[this.vol[i]];
            if (this.sw[i].freq > 7) { // 5 and lower are basically off, and 8-6 should be muted anyway cuz reasons
                sample += ((this.polarity[i] * 2) - 1) * intensity;
            }
        }

        //let intensity = 8192 * ((0x0F - this.vol[3]) / 7);
        let intensity = SMSGG_voltable[this.vol[3]];
        sample += ((this.polarity[3] * 2) - 1) * intensity;

        return sample;
    }

    write_data(val) {
        if (val & 0x80) { // LATCH/DATA byte
            this.io.reg = (val >>> 5) & 3;
            this.io.kind = (val >>> 4) & 1;
            let data = val & 0x0F;
            if (this.io.kind) { // volume
                this.vol[this.io.reg] = data;
            }
            else { // tone
                if (this.io.reg < 3) this.sw[this.io.reg].freq = (this.sw[this.io.reg].freq & 0x3F0) | data;
                else {
                    this.noise.lfsr = 0x8000;
                    this.noise.shift_rate = data & 3;
                    this.noise.mode = (data >>> 2) & 1;
                }
            }
        }
        else {  // Data byte
            let data = val & 0x0F;
            if (this.io.kind) { // volume
                this.vol[this.io.reg] = data;
            } else {
                if (this.io.reg < 3)
                    this.sw[this.io.reg].freq = (this.sw[this.io.reg].freq & 0x0F) | ((val & 0x3F) << 4);
                else {
                    this.noise.lfsr = 0x8000;
                    this.noise.shift_rate = data & 3;
                    this.noise.mode = (data >>> 2) & 1;
                }
            }
        }
    }

    reset() {
        this.vol[0] = this.vol[1] = this.vol[2] = 0x0F;
        this.vol[3] = 0x0F;
        this.sw[0].freq = this.sw[1].freq = this.sw[2].freq = 0;
        this.noise.lfsr = 0x8000;

        this.io.reg = 0;
    }
}