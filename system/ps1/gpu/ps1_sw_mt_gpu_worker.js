"use strict";

importScripts('/helpers/thread_common.js');
importScripts('/helpers.js');

const GPUSTAT = 0;
const LASTUSED = 23;

function set_bit(w, bitnum, val) {
    if (val)
        w |= (1 << bitnum);
    else
        w |= ((1 << bitnum) ^ 0xFFFFFFFF);
}

const bmask = [0b1 ^ 0xFFFFFFFF, 0b11 ^ 0xFFFFFFFF,
    0b111 ^ 0xFFFFFFFF, 0b1111 ^ 0xFFFFFFFF,
    0b11111 ^ 0xFFFFFFFF, 0b111111 ^ 0xFFFFFFFF,
    0b1111111 ^ 0xFFFFFFFF, 0b11111111 ^ 0xFFFFFFFF];

function set_bits(w, bitlo, bithi, val) {
    return ((bmask[bithi - bitlo] << bitlo) & w) | (val << bitlo);
}

class PS1_GPU_thread {
    constructor() {
        this.shared_output_buffers = [new SharedArrayBuffer(0), new SharedArrayBuffer(0)];
        this.last_used_buffer = 1;
        this.output = [new Uint8Array(this.shared_output_buffers[0]), new Uint8Array(this.shared_output_buffers[1])];
        this.VRAMb = new ArrayBuffer(1024*1024);
        this.VRAM = new DataView(this.VRAMb);

        // FIFO
        // 16 32-bit words,
        // head and tail
        // so lets put 24 32-bit words


        // 0-15 = slots 1-16
        // 16 = head
        // 17 = num_items
        // 18 = lock
        this.GP0FIFO_sb = new SharedArrayBuffer(96);
        this.GP0_FIFO = new Int32Array(this.GP0FIFO_sb)

        this.MMIO_sb = new SharedArrayBuffer(96);
        this.MMIO = new Uint32Array(this.MMIO_sb);
    }

    msg_startup(e) {
        this.shared_output_buffers[0] = e.output_buffer0;
        this.shared_output_buffers[1] = e.output_buffer1;
        this.output[0] = new Uint8Array(this.shared_output_buffers[0]);
        this.output[1] = new Uint8Array(this.shared_output_buffers[1]);
        this.GP0FIFO_sb = e.FIFO;
        this.GP0_FIFO = new Uint32Array(this.GP0FIFO_sb);
        this.MMIO_sb = e.MMIO;
        this.MMIO = new Uint32Array(this.MMIO_sb);
        this.MMIO[GPUSTAT] = 0;

        this.set_last_used_buffer(1);

        this.listen_FIFO();
    }

    gp0(cmd) {
        console.log('GPU got command', hex8(cmd));
    }

    listen_FIFO() {
        this.GP0_FIFO[16] = this.GP0_FIFO[17] = 0;
        for (let i = 0; i < 16; i++) {
            this.GP0_FIFO[i] = 0;
        }
        // Set "ready for command word"
        //this.MMIO[GPUSTAT] |= 0x4000000;
        this.MMIO[GPUSTAT] |= 0x1C000000;
        console.log('Listening on FIFO...')
        while(true) {
            let yo = 0;
            let cmd = null;
            if (Atomics.load(this.GP0_FIFO, 17) === 0) continue;
            // Get lock
            mutex_lock(this.GP0_FIFO, 18);

            // Get command(s)
            let head = this.GP0_FIFO[16];
            let num_items = this.GP0_FIFO[17];
            if (num_items > 0) {
                cmd = this.GP0_FIFO[head]; // Get head item
                this.GP0_FIFO[head] = 0xBEEFCACE;
                this.GP0_FIFO[16] = (head+1)&15; // Advance head
                this.GP0_FIFO[17] = --num_items; // Reduce number of items
            }

            // Release lock
            mutex_unlock(this.GP0_FIFO, 18);
            if (cmd !== null) this.gp0(cmd);
        }

    }

    set_last_used_buffer(which) {
        this.MMIO[LASTUSED] = which;
    }

    onmessage(e) {
        console.log('GPU got message', e);
        switch(e.kind) {
            case GPU_messages.startup:
                this.msg_startup(e);
                break;
        }
    }
}

const ps1gpu = new PS1_GPU_thread()
onmessage = async function(ev) {
    let e = ev.data;
    await ps1gpu.onmessage(e);
}