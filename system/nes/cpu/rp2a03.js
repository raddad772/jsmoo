"use strict";

// The RP2A03 is the APU
// 12.5, 25, 50, 75
const RP2A03_square_12_5 = new Float32Array(256);
const RP2A03_square_25 = new Float32Array(256);
const RP2A03_square_50 = new Float32Array(256);
const RP2A03_square_75 = new Float32Array(256);

RP2A03_square_50.fill(1, 0, 127);
RP2A03_square_50.fill(-1, 128, 255);
RP2A03_square_12_5.fill(1, 0, 223);
RP2A03_square_12_5.fill(-1, 224, 255);
RP2A03_square_25.fill(1, 0, 191);
RP2A03_square_25.fill(-1, 192, 255);
RP2A03_square_75.fill(1, 0, 63);
RP2A03_square_75.fill(-1, 64, 255);
const RP2A03_offset_25 = .5;
const RP2A03_offset_50 = 0;


// format
class nes_apu_write {
    constructor(master_cycle, timing_key, register, value) {
        this.master_cycle = master_cycle;
        this.timing_key = timing_key;
        this.register = register;
        this.value = value;
    }
}

//Pre-calculate the WaveShaper curves so that we can reuse them.
/*const pulseCurve=new Float32Array(256);
for(let i=0;i<128;i++) {
    pulseCurve[i]= -1;
    pulseCurve[i+128]=1;
}
const constantOneCurve=new Float32Array(2);
constantOneCurve[0]=1;
constantOneCurve[1]=1;*/
// add a new factory method to the AudioContext object.
const FRAME_CYCLES = 29780

const RP2A03_PULSE_DUTY = {
    0: [0, 1, 0, 0, 0, 0, 0, 0],
    1: [0, 1, 1, 0, 0, 0, 0, 0],
    2: [0, 1, 1, 1, 1, 0, 0, 0],
    3: [1, 0, 0, 1, 1, 1, 1, 1]
}

let RP2A03_noise_lookup = new Float32Array(16);
let RP2A03_DMC_lookup = new Float32Array(128);
let RP2A03_triangle_lookup = new Float32Array(16);

let RP2A03_tnd_lookup = new Float32Array(202);
let RP2A03_pulse2_lookup = new Float32Array(32);
for (let i = 0; i < 16; i++) {
    RP2A03_triangle_lookup[i] = i / 8227;
    RP2A03_noise_lookup[i] = i / 12241;
}
for (let i = 0; i < 32; i++) {
    RP2A03_pulse2_lookup[i] = 95.52 / (8128.0 / i + 100)
}


class rp2a03_sq_wave {
    constructor(clock, sample_rate) {
        this.clock = clock;
        this.sample_rate = sample_rate;

        this.last_frame = 0;
        this.last_frame_cycle = 0;

        this.freq = 0;
        this.buf_size = Math.floor(this.sample_rate / 60);
        this.vol = 0;
        this.last_sample = 0; // A decent guess

        this.buffer = new Uint8Array(this.buf_size);

        // every 2 * divider cycles we output a new value
        this.samples_per_cycle = this.sample_rate / (FRAME_CYCLES*60);

        // So we've got a frequency, from about 110 up to
        this.current_v = 0.5;
        this.current_sample_value = 0;
        this.current_sample_index = -1;
        this.cycles_til_next_value = 1;

        // Channel parameters
        this.duty_cycle = 0;
        this.divider = 0; // wait (divider * 2) cycles
    }

    catch_up() {
        if (this.last_frame !== this.clock.master_frame) {
            this.last_frame = this.clock.master_frame;
            this.last_frame_cycle = 0;
            this.last_sample -= FRAME_CYCLES;
        }
        let to_render_cycles = this.clock.cpu_frame_cycle - this.last_frame_cycle;
        let start_sample = this.last_sample;
        let end_sample = Math.min(this.buf_size, start_sample + (this.buf_size / (to_render_cycles / FRAME_CYCLES)));
        if (start_sample>=end_sample) return;
        this.last_sample = end_sample;
        let start_cycle = this.last_frame_cycle;
        let end_cycle = this.clock.cpu_frame_cycle;
        let sample_advance = (end_sample - start_sample) / (end_cycle / start_cycle)
        let v = this.current_v;
        if (this.divider <= 8) v = 0;
        let sample = start_sample;
        for (let cycle = start_cycle; cycle < end_cycle; cycle++) {
            this.cycles_til_next_value--;
            if (this.cycles_til_next_value === 0) {
                // Advance through our wavetable
                this.current_sample_index = (this.current_sample_index + 1) & 7;
                this.current_sample_value = RP2A03_PULSE_DUTY[this.duty_cycle][this.current_sample_index] * this.current_v;
                if (this.divider < 8) this.current_sample_value = 0;

                this.cycles_til_next_value = (this.divider * 2);
            }
            this.buffer[Math.floor(sample)] = this.current_sample_value;
            sample += sample_advance;
        }
    }
}

class rp2a03 {
    /**
     * @param {NES_clock} clock
     * @param {NES_bus} bus
     * @param {ricoh2A03} cpu
     */
    constructor(clock, bus, cpu) {
        this.cpu = cpu;
        this.clock = clock;
        this.bus = bus;

        this.cpu.write_apu = this.write_regs.bind(this);
        this.cpu.read_apu = this.read_regs.bind(this);

    }

    serialize() {
        return {version: 1}
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG NES APU VERSION');
            return false;
        }
        return true;
    }

    mix() {
        /*
        output = pulse_out + tnd_out

        pulse_out = 0.00752 * (pulse1 + pulse2)

        tnd_out = 0.00851 * triangle + 0.00494 * noise + 0.00335 * dmc*/
        }


    play_buffer() {
        this.source.buffer = this.audio_buffers[this.current_audio_buffer];
        this.current_audio_buffer = (this.current_audio_buffer + 1) & 1;
        this.buffer_index = 0;
        this.source.start();
    }

    start() {
        if (!this.audio_ctx_started) {
            this.audio_ctx_started = true;
            //this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.audioCtx.resume();
            this.source.connect(this.audioCtx.destination);
        }
    }

    reset() {

    }

    read_regs(addr, val) {

    }

    write_regs(addr, val) {
        //case 0x4001:
    }
}