"use strict";

class PS1_helper {
    /**
     * @param {js_wrapper_t} jswrapper
     */
    constructor(jswrapper) {
        this.js_wrapper = jswrapper;
        this.as_wrapper = jswrapper.as_wrapper;

        this.gpu_thread = new Worker('/system/ps1/gpu/ps1_sw_mt_gpu_worker.js');
        this.gpu_thread.onmessage = this.on_gpu_message.bind(this);
        this.gpu_thread.onerror = function (a, b, c) {
            console.log('ERR', a, b, c);
        }

        let d = this.as_wrapper.wasm.gp_get_mt(this.as_wrapper.global_player);

        this.vram_buf = d.vram_ptr;
        this.gp0_buf = d.gp0_ptr;
        this.gp1_buf = d.gp1_ptr;
        this.mmio_buf = d.mmio_ptr;

        this.sab = this.as_wrapper.wasm.memory.buffer;
        console.log('SAB?', this.sab);
        this.sab_offset = d.vram_ptr;

        this.gpu_thread.postMessage({
            kind: GPU_messages.startup,
            GP0FIFO: this.gp0_buf,
            GP1FIFO: this.gp1_buf,
            MMIO: this.mmio_buf,
            VRAM: this.vram_buf,
            GP0FIFO_offset: d.gp0_ptr,
            GP1FIFO_offset: d.gp1_ptr,
            MMIO_offset: d.mmio_ptr,
            VRAM_offset: d.vram_ptr,
            SAB: this.sab
        });
    }

    play(num) {
        this.gpu_thread.postMessage({kind: GPU_messages.play, num: num})
    }

    pause(num) {
        this.gpu_thread.postMessage({kind: GPU_messages.pause, num: num})
    }

    stop() {
        this.gpu_thread.postMessage({kind: GPU_messages.stop, num: 0})
    }

    dump_debug() {
    }

    on_gpu_message(e) {
        console.log('GPU got msg from thread:', e);
    }


}