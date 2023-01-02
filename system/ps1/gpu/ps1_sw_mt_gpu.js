"use strict";

const GPUSTAT = 0;
const LASTUSED = 23;

class PS1_GPU {
    constructor() {
        this.output_shared_buffers = [new SharedArrayBuffer(640*480*3), new SharedArrayBuffer(640*480*3)];
        this.output = [new Uint8Array(this.output_shared_buffers[0]), new Uint8Array(this.output_shared_buffers[1])];
        this.cur_output_num = 1;
        this.cur_output = this.output[1];
        this.last_used_buffer = 1;

        this.gpu_thread = new Worker('/system/ps1/gpu/ps1_sw_mt_gpu_worker.js');
        this.gpu_thread.onmessage = this.on_gpu_message.bind(this);
        this.gpu_thread.onerror = function(a, b, c) { console.log('ERR', a, b, c);}

        this.FIFO_buffer = new SharedArrayBuffer(96);
        this.MMIO_buffer = new SharedArrayBuffer(96);
        this.FIFO = new Int32Array(this.FIFO_buffer);
        this.MMIO = new Uint32Array(this.MMIO_buffer);

        this.gpu_thread.postMessage({
            kind: GPU_messages.startup,
            FIFO: this.FIFO_buffer,
            MMIO: this.MMIO_buffer,
            output_buffer0: this.output_shared_buffers[0],
            output_buffer1: this.output_shared_buffers[1],
        });

   }

   on_gpu_message(e) {
        console.log('GPU got msg from thread:', e);
   }

   gp0(cmd) {
        // Other ideas for sync: end is 0xBEEFCACE
       //console.log('GPU send command!', hex8(cmd));
       //return;
       if (Atomics.load(this.FIFO, 17) > 15) {
            console.log('Waiting on GP0 to empty buffer...')
            while (Atomics.load(this.FIFO, 17) > 15) {
            }
        }
        // Get lock
       mutex_lock(this.FIFO, 18);

       let head = this.FIFO[16];
       let num_items = this.FIFO[17];

        // Add the item
        this.FIFO[(head + num_items) & 15] = cmd;

        // num_items++
        this.FIFO[17] = num_items+1;
        // head does not move when appending to FIFO

        // Release lock
        mutex_unlock(this.FIFO, 18);
    }

   gp1(cmd) {
        console.log('GP1 cmd', hex8(cmd>>>8));
   }

   get_gpustat() {
        return this.MMIO[GPUSTAT];
   }
}