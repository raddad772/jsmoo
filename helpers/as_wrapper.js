"use strict";

/* Wrap AssemblyScript GlobalPlayer object */

const USE_DEBUG = false;
if (DO_WASM_IMPORTS) {
    if (USE_DEBUG)
        importScripts('/assemblyscript/build/debug_stable.js');
    else
        importScripts('/assemblyscript/build/release_stable.js');
}

class gp_wrapper_t {
    constructor() {
        this.wasm_fetch = null;
        this.wasm = null;
        this.wasm_raw = null;
        this.setup = false;
        this.input_buffer_ptr = null;

        this.global_player = null;

        this.out_ptr = 0;
        console.log('GP WRAPPER LOAD!');
    }

    async onload() {
        if (!this.setup) await this.do_setup();
    }

    async do_setup() {
        if (this.setup) return;
        await this.fetch_wasm();
        await this.instantiate();
        this.global_player = this.wasm.new_global_player();
        this.input_buffer_ptr = this.wasm.gp_get_input_buffer(this.global_player);
        this.setup = true;
    }

    async instantiate() {
        this.wasm_raw = await WebAssembly.compileStreaming(this.wasm_fetch)
        this.wasm = await instantiate(this.wasm_raw, {})
    }

    async fetch_wasm() {
        let url = '';
        if (USE_DEBUG)
            url = '/assemblyscript/build/debug.wasm'
        else
            url = '/assemblyscript/build/release.wasm'
        this.wasm_fetch = await fetch(url);
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