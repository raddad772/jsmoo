"use strict";

/* Wrap AssemblyScript GlobalPlayer object */

const USE_DEBUG = false;
console.log('USE DEBUG?', USE_DEBUG)
if (DO_WASM_IMPORTS) {
    if (USE_DEBUG)
        importScripts('/as-emu-cores/build/debug_stable.js');
    else
        importScripts('/as-emu-cores/build/release_stable.js');
}

class as_wrapper_t {
    constructor() {
        this.wasm_fetch = null;
        this.wasm = null;
        this.wasm_raw = null;
        this.setup = false;
        this.in_setup = false;
        this.input_buffer_ptr = null;

        this.global_player = null;

        this.out_ptr = 0;
        //console.log('GP WRAPPER LOAD!');
    }

    async onload() {
        if (!this.setup) await this.do_setup();
    }

    async do_setup() {
        if ((this.setup) || (this.in_setup)) return;
        this.in_setup = true;
        await this.fetch_wasm();
        await this.instantiate();
        this.global_player = this.wasm.new_global_player();
        this.input_buffer_ptr = this.wasm.gp_get_input_buffer(this.global_player);
        this.in_setup = false;
        this.setup = true;
    }

    async instantiate() {
        this.wasm_raw = await WebAssembly.compileStreaming(this.wasm_fetch)
        this.wasm = await instantiate(this.wasm_raw, {})
    }

    async fetch_wasm() {
        let url = '';
        if (USE_DEBUG)
            url = '/as-emu-cores/build/debug.wasm'
        else
            url = '/as-emu-cores/build/release.wasm'
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
        //console.log('COPY TOOK', t.toFixed(2), 'ms');
    }
}