"use strict";

/*import {
    gp_load_ROM_from_RAM,
    gp_run_frame,
    gp_get_specs,
    gp_set_system,
    new_global_player,
    memory}
    from "/assemblyscript/build/release_stable.js";*/
const DO_WASM_IMPORTS = true;
const USE_ASSEMBLYSCRIPT = false;
importScripts('/helpers/as_wrapper.js')
importScripts('/helpers/js_wrapper.js')

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

    step1_done: 1001,
    step2_done: 1002,
    step3_done: 1003,

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
        this.as_wrapper = new gp_wrapper_t();
        this.js_wrapper = new js_wrapper_t();
        this.framebuffer_sab = null;
        this.framebuffer = new Uint8Array(1);
        this.general_sab = null;

        this.step = 0;
    }

    output_input(keymap) {
        if (!USE_ASSEMBLYSCRIPT) {
            this.js_wrapper.update_keymap(keymap);
        }
        else {
            let obuf = new Uint32Array(this.as_wrapper.wasm.memory.buffer)
            let startpos = this.as_wrapper.input_buffer_ptr >>> 2;
            for (let i in keymap) {
                obuf[startpos + keymap[i].buf_pos] = keymap[i].value;
            }
        }
    }

    async process_load_ROM(e) {
        if (USE_ASSEMBLYSCRIPT) {
            this.as_wrapper.copy_to_input_buffer(e.ROM);
            this.as_wrapper.wasm.gp_load_ROM_from_RAM(this.as_wrapper.global_player, e.ROM.byteLength);
            this.step_done(emulator_messages.step3_done);
        }
        else {
            this.js_wrapper.load_ROM_from_RAM(e.ROM);
            console.log('ROM load!');
            this.step_done(emulator_messages.step3_done);
        }
    }

    async onmessage(e) {
        await this.as_wrapper.do_setup();
        switch(e.kind) {
            case emulator_messages.startup:
                //this.framebuffer_sab = e.framebuffer_sab;
                this.general_sab = e.general_sab;
                this.step_done(emulator_messages.step1_done);
                return;
            case emulator_messages.load_rom:
                await this.process_load_ROM(e)
                return;
            case emulator_messages.frame_requested:
                //console.log('ET: running frame...');
                this.output_input(e.keymap);
                this.run_frame();
                return;
            case emulator_messages.change_system:
                this.do_set_system(e.kind_str, e.bios)
                this.step_done(emulator_messages.step2_done);
                return;
            default:
                console.log('EMULATION MAIN THREAD UNHANDLED MESSAGE', e);
                break;
        }
    }

    run_frame() {
        if (USE_ASSEMBLYSCRIPT) {
            let ts = performance.now();
            this.as_wrapper.wasm.gp_run_frame(this.as_wrapper.global_player);
            let span = performance.now() - ts;
            console.log('TIME PER FRAME:', span.toFixed(4));
            let rd = new Uint32Array(this.as_wrapper.wasm.memory.buffer);
            let to_copy = Math.ceil((this.tech_specs.x_resolution * this.tech_specs.y_resolution) / 4) * 4;
            //this.framebuffer.set(rd.slice(this.out_ptr >>> 2, (this.out_ptr>>>2)+to_copy));
            this.send_frame_done();
        } else {
            let ts = performance.now();
            let on = this.js_wrapper.run_frame();
            let span = performance.now() - ts;
            console.log('TIME PER FRAME:', span.toFixed(4));
            this.send_frame_done(on);
        }
    }

    do_set_system(kind, bios) {
        if (USE_ASSEMBLYSCRIPT) {
            this.as_wrapper.wasm.gp_set_system(this.as_wrapper.global_player, kind);
            this.tech_specs = this.as_wrapper.wasm.gp_get_specs(this.as_wrapper.global_player);
            this.out_ptr = this.tech_specs.out_ptr;
        } else {
            this.js_wrapper.set_system(kind, bios);
            this.tech_specs = this.js_wrapper.get_specs();
        }
        this.send_specs(this.tech_specs)
    }

    send_frame_done(data) {
        postMessage({kind: emulator_messages.frame_complete, data: data})
    }

    step_done(which) {
        postMessage({kind: which});
    }

    send_specs(specs) {
        postMessage({kind: emulator_messages.specs, specs: specs})
    }

    reset() {
        this.frames_since_reset = 0;
    }
}

const emulator_worker = new threaded_emulator_worker_t()
onmessage = async function(ev) {
    let e = ev.data;
    await emulator_worker.onmessage(e);
}