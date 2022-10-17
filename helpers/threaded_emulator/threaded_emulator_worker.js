"use strict";

/*import {
    gp_load_ROM_from_RAM,
    gp_run_frame,
    gp_get_specs,
    gp_set_system,
    new_global_player,
    memory}
    from "/assemblyscript/build/release.js";*/
importScripts('/helpers/as_wrapper.js')


const emulator_messages = Object.freeze({
    unknown: 0,
    // Parent to child
    frame_requested: 1,
    change_system: 2,
    load_rom: 3,
    load_bios: 4,
    reset: 5,
    specs: 6,
    startup: 100,


    // Child to parent
    frame_complete: 50,
    status_update: 51,

});

class threaded_emulator_worker_t {
    constructor() {
        this.shared_counters = null;
        this.frames_since_reset = 0;
        this.setup = false;
        this.tech_specs = null;
        this.wrapper = new gp_wrapper_t();
        this.framebuffer_sab = null;
        this.framebuffer = new Uint8Array(1);
        this.general_sab = null;

        this.step = 0;
    }

    output_input(keymap) {
        let obuf = new Uint32Array(this.wrapper.wasm.memory.buffer)
        let startpos = this.out_ptr >>> 2;
        for (let i in keymap) {
            obuf[startpos+keymap[i].buf_pos] = keymap[i].value;
        }
    }

    async onmessage(e) {
        await this.wrapper.do_setup();
        switch(e.kind) {
            case emulator_messages.startup:
                console.log('ET: startup');
                console.log('step1')
                this.framebuffer_sab = e.framebuffer_sab;
                this.general_sab = e.general_sab;
                this.framebuffer = new Uint32Array(this.framebuffer_sab);
                return;
            case emulator_messages.load_rom:
                console.log('step3')
                console.log('ET: passing ROM...', this.wrapper.global_player, e.ROM);
                this.wrapper.copy_to_input_buffer(e.ROM);
                this.wrapper.wasm.gp_load_ROM_from_RAM(this.wrapper.global_player, e.ROM.byteLength);
                return;
            case emulator_messages.frame_requested:
                //console.log('ET: running frame...');
                this.output_input(e.keymap);
                this.run_frame();
                return;
            case emulator_messages.change_system:
                console.log('ET: setting system to', e.kind_str);
                console.log('step2')
                this.do_set_system(e.kind_str)
                return;
            default:
                console.log('EMULATION MAIN THREAD UNHANDLED MESSAGE', e);
                break;
        }
    }

    run_frame() {
        let ts = performance.now();
        this.wrapper.wasm.gp_run_frame(this.wrapper.global_player);
        let span = performance.now() - ts;
        console.log('TIME PER FRAME:', span.toFixed(4));
        let rd = new Uint32Array(this.wrapper.wasm.memory.buffer);
        let to_copy = Math.ceil((this.tech_specs.x_resolution * this.tech_specs.y_resolution) / 4) * 4;
        this.framebuffer.set(rd.slice(this.out_ptr >>> 2, (this.out_ptr>>>2)+to_copy));
    }

    do_set_system(kind) {
        console.log('GP:', this.wrapper.global_player.toString());
        this.wrapper.wasm.gp_set_system(this.wrapper.global_player, kind);
        this.tech_specs = this.wrapper.wasm.gp_get_specs(this.wrapper.global_player);
        this.out_ptr = this.tech_specs.out_ptr;
        this.send_specs(this.tech_specs)
    }

    send_specs(specs) {
        postMessage({kind: emulator_messages.specs, specs: specs})
    }

    reset() {
        this.frames_since_reset = 0;
    }
}

const emulator_worker = new threaded_emulator_worker_t()
console.log('ET: LOAD');
onmessage = async function(ev) {
    let e = ev.data;
    await emulator_worker.onmessage(e);
}