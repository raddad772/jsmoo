"use strict";

/*
Big thanks to TotalJustice of TotalSMS, whose implementation
very heavily inspired mine
 */

const SMSGG_voltable: StaticArray<i16> = [8191, 6507, 5168, 4105, 3261, 2590, 2057, 1642,
    1298, 1031, 819, 650, 516, 410, 326, 0];

class SN76489_SW {
    counter: i32 = 0;
    freq: i32 = 0;
}

class JSM_audiobuffer {
    next_buf_sample: f32 = 0;
    current_buf: Int16Array = new Int16Array(0)
    current_buf_num: i32 = 0;
    num_bufs: u32 = 0
    last_finished_buf: i32 = -1;
    sample_bufs: Array<Int16Array> = new Array<Int16Array>();
    clocks_per_sample: f32 = 0;
    buf_pos: u32 = 0;
    buf_size: u32 = 0;
    cycles_per_frame: f32 = 0;

    set_audio_params(samples_per_frame: f32, sample_rate: u32, buf_size: u32, num_bufs: u32): void {
        this.buf_size = buf_size;
        this.num_bufs = num_bufs;
        this.cycles_per_frame = samples_per_frame;

        this.buf_pos = 0;

        for (let i: u32 = 0; i < num_bufs; i++) {
            this.sample_bufs.push(new Int16Array(buf_size));
        }
        this.current_buf = this.sample_bufs[0];
        this.last_finished_buf = -1;
        this.current_buf_num = 0;
        this.clocks_per_sample = this.cycles_per_frame / <f32>buf_size;
    }

    sample(sample: i16): void {
        this.next_buf_sample += this.clocks_per_sample;

        this.current_buf[this.buf_pos] = sample;
        this.buf_pos++;
        if (this.buf_pos >= this.buf_size) {
            this.advance_buf()
        }
    }

    advance_buf(): void {
        if (this.last_finished_buf === -1) this.last_finished_buf = this.current_buf_num;
        this.current_buf_num = (this.current_buf_num + 1) % this.num_bufs;
        this.current_buf = this.sample_bufs[this.current_buf_num];
        this.buf_pos = 0;
    }

    get_buffer(): Int16Array {
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

class SN76489_noise {
    lfsr: u32 = 0x8000;
    shift_rate: u32 = 0;
    mode: u32 = 0;
    counter: u32 = 0;
    countdown: u32 = 0;
}

export class SN76489 {
    output: JSM_audiobuffer = new JSM_audiobuffer();

    // The SN76489 has 8 "registers" - 4 x 4 bit volume registers, 3 x 10 bit
    // tone registers and 1 x 4 bit noise register*.
    vol: StaticArray<u32> = new StaticArray<u32>(4);
    freq: StaticArray<u32> = new StaticArray<u32>(3);   // 10 bits
    noise: SN76489_noise = new SN76489_noise();
    sw: StaticArray<SN76489_SW> = new StaticArray<SN76489_SW>(3);
    polarity: StaticArray<i16> = new StaticArray<i16>(4);
    io_reg: u32 = 0  // current register is 0
    io_kind: u32 = 0 // 0 = tone, 1 = volume

    constructor() {
        for (let i = 0; i < 3; i++) {
            this.sw[i] = new SN76489_SW();
        }
        this.reset();
    }

    reset(): void {
        for (let i = 0; i < 4; i++) {
            this.polarity[i] = 1;
        }
        this.vol[0] = this.vol[1] = this.vol[2] = 0x0F;
        this.vol[3] = 0x07;
        this.sw[0].freq = this.sw[1].freq = this.sw[2].freq = 0;
        this.noise.lfsr = 0x8000;

        this.io_reg = 0;
    }

    cycle_squares(): void {
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

    cycle_noise(): void {
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
                this.polarity[3] = <i16>this.noise.lfsr & 1;

                if (this.noise.mode) { // White noise mode
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

    cycle(current_clock: u64): void {
        // Tick the noise
        this.cycle_noise();
        this.cycle_squares();
        if (current_clock >= <u64>this.output.next_buf_sample) {
            this.output.sample(this.mix_sample());
        }
    }

    mix_sample(): i16 {
        let sample: i16 = 0;
        for (let i = 0; i < 3; i++) {
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

    write_data(val: u32): void {
        if (val & 0x80) { // LATCH/DATA byte
            this.io_reg = (val >>> 5) & 3;
            this.io_kind = (val >>> 4) & 1;
            let data = val & 0x0F;
            if (this.io_kind) { // volume
                this.vol[this.io_reg] = data;
            }
            else { // tone
                if (this.io_reg < 3) this.sw[this.io_reg].freq = (this.sw[this.io_reg].freq & 0x3F0) | data;
                else {
                    this.noise.lfsr = 0x8000;
                    this.noise.shift_rate = data & 3;
                    this.noise.mode = (data >>> 2) & 1;
                }
            }
        }
        else {  // Data byte
            let data = val & 0x0F;
            if (this.io_kind) { // volume
                this.vol[this.io_reg] = data;
            } else {
                if (this.io_reg < 3)
                    this.sw[this.io_reg].freq = (this.sw[this.io_reg].freq & 0x0F) | ((val & 0x3F) << 4);
                else {
                    this.noise.lfsr = 0x8000;
                    this.noise.shift_rate = data & 3;
                    this.noise.mode = (data >>> 2) & 1;
                }
            }
        }
    }
}
