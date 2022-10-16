"use strict";

const USE_DEBUG = true;
if (USE_DEBUG)
    importScripts('/assemblyscript/build/debug.js');
else
    importScripts('/assemblyscript/build/release.js');

class gp_wrapper_t {
    constructor() {
        this.wasm_fetch = null;
        this.wasm = null;
        this.setup = false;

        this.global_player = null;

        this.out_ptr = 0;
        console.log('GP WRAPPER LOAD!');
    }

    async onload() {
        if (!this.setup) await this.do_setup();
        console.log('ONLOAD!');
    }

    async do_setup() {
        if (this.setup) return;
        await this.fetch_wasm();
        await this.instantiate();
        this.global_player = this.wasm.new_global_player();
        console.log('GOT GP', this.global_player);
        this.setup = true;
    }

    async instantiate() {
        this.wasm = await instantiate(await WebAssembly.compileStreaming(this.wasm_fetch), {})
    }

    async fetch_wasm() {
        let url = '';
        if (USE_DEBUG)
            url = '/assemblyscript/build/debug.wasm'
        else
            url = '/assemblyscript/build/release.wasm'
        this.wasm_fetch = await fetch(url);
    }

}