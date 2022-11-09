"use strict";

const USE_DEBUG = false;

class gp_wrapper_t {
    constructor() {
        this.wasm = null;
        this.setup = false;
        this.input_buffer_ptr = null;

        this.global_player = null;

        this.out_ptr = 0;
    }

    async onload() {
        if (!this.setup) await this.do_setup();
    }

    async import_wasm() {
        let url;
        if (USE_DEBUG)
            url = '/assemblyscript/build/debug.js';
        else
            url = '/assemblyscript/build/release.js';

        this.wasm = await import(url);
    }

    async do_setup() {
        if (this.setup) return;

        await this.import_wasm();

        this.global_player = this.wasm.new_global_player();
        this.input_buffer_ptr = this.wasm.gp_get_input_buffer(this.global_player);
        this.setup = true;
    }

    /**
     * @param {Uint8Array} what
     */
    copy_to_input_buffer(what) {
        let ob = new Uint8Array(this.wasm.memory.buffer);
        let t = performance.now();
        for (let i = 0; i < what.byteLength; i++) {
            ob[i+this.input_buffer_ptr] = what[i];
        }
        t = performance.now() - t;
        console.log('COPY TOOK', t.toFixed(2), 'ms');
    }
}