"use strict";

const GPUSTAT = 0;
const GPUPLAYING = 1;
const GPUQUIT = 2;
const GPUGP1 = 3;
const GPUREAD = 4;
const LASTUSED = 23;

class PS1_GPU {
    constructor() {
        this.output_shared_buffers = [new SharedArrayBuffer(1024 * 512 * 2), new SharedArrayBuffer(1024 * 512 * 2)];
        this.output = [new Uint8Array(this.output_shared_buffers[0]), new Uint8Array(this.output_shared_buffers[1])];
        this.cur_output_num = 1;
        this.cur_output = this.output[1];
        this.last_used_buffer = 1;

        this.gpu_thread = new Worker('/system/ps1/gpu/ps1_sw_mt_gpu_worker.js');
        this.gpu_thread.onmessage = this.on_gpu_message.bind(this);
        this.gpu_thread.onerror = function (a, b, c) {
            console.log('ERR', a, b, c);
        }

        this.GP0FIFO_buffer = new SharedArrayBuffer(80);
        this.GP1FIFO_buffer = new SharedArrayBuffer(80);
        this.MMIO_buffer = new SharedArrayBuffer(96);
        this.GP0FIFO = new MT_FIFO16();
        this.GP1FIFO = new MT_FIFO16();
        this.GP0FIFO.set_sab(this.GP0FIFO_buffer);
        this.GP1FIFO.set_sab(this.GP1FIFO_buffer);
        this.MMIO = new Uint32Array(this.MMIO_buffer);

        this.last_ppnum = 0;

        this.IRQ_bit = 0;

        this.gpu_thread.postMessage({
            kind: GPU_messages.startup,
            GP0FIFO: this.GP0FIFO_buffer,
            GP1FIFO: this.GP1FIFO_buffer,
            MMIO: this.MMIO_buffer,
            VRAM: this.output_shared_buffers[1],
            output_buffer0: this.output_shared_buffers[0],
            output_buffer1: this.output_shared_buffers[1],
        });

    }

    play(num) {
        this.MMIO[GPUPLAYING] = 1;
        this.gpu_thread.postMessage({kind: GPU_messages.startup, num: num})
    }

    pause() {
        console.log('GPUPAUS');
        this.MMIO[GPUPLAYING] = 0;
    }

    stop() {
        // Terminate thread
        this.MMIO[GPUQUIT] = 1
    }

    on_gpu_message(e) {
        console.log('GPU got msg from thread:', e);
    }

    gp0(cmd) {
        this.GP0FIFO.put_item_blocking(cmd)
    }

    gp1(cmd) {
        //console.log('SEND GP1 cmd', hex8(cmd >>> 8));
        this.GP1FIFO.put_item_blocking(cmd);
    }

    get_gpuread() {
        return this.MMIO[GPUREAD];
    }

    get_gpustat() {
        let g = this.MMIO[GPUSTAT];
        // Fill interrupt bit
        g |= this.IRQ_bit << 24;
        // Fill FIFO full bit
        if (((g >>> 29) & 3) === 1)
            g |= (this.FIFO[17] === 16) ? 0 : 1;

        return g;
    }
}