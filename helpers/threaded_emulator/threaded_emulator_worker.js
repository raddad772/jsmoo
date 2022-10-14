"use strict";
import {
    gp_load_ROM_from_RAM,
    gp_run_frame,
    gp_get_specs,
    gp_set_system,
    new_global_player,
    memory}
    from "/assemblyscript/build/release.js";
//importScripts('/assemblyscript/build/debug.js');


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
        this.general_sab = null;
        this.framebuffer_sab = null;
        this.framebuffer = new Uint8Array(1);
        this.shared_counters = null;
        this.frames_since_reset = 0;
        this.out_ptr = 0;
        this.tech_specs = null;
        this.global_player = null;
    }

    onmessage(e) {
        switch(e.kind) {
            case emulator_messages.startup:
                console.log('ET: startup');
                this.framebuffer_sab = e.framebuffer_sab;
                this.general_sab = e.general_sab;
                this.framebuffer = new Uint32Array(this.framebuffer_sab);
                this.global_player = new_global_player();
                return;
            case emulator_messages.load_rom:
                console.log('ET: passing ROM...', this.global_player, e);
                gp_load_ROM_from_RAM(this.global_player, e.ROM);
                return;
            case emulator_messages.frame_requested:
                //console.log('ET: running frame...');
                this.run_frame();
                return;
            case emulator_messages.change_system:
                console.log('ET: setting system to', e.kind_str);
                this.do_set_system(e.kind_str)
                return;
            default:
                console.log('EMULATION MAIN THREAD UNHANDLED MESSAGE', e);
                break;
        }
    }

    run_frame() {
        let ts = performance.now();
        gp_run_frame(this.global_player);
        let span = performance.now() - ts;
        console.log('TIME PER FRAME:', span.toFixed(4));
        let rd = new Uint32Array(memory.buffer);
        let to_copy = Math.ceil((this.tech_specs.x_resolution * this.tech_specs.y_resolution) / 4) * 4;
        this.framebuffer.set(rd.slice(this.out_ptr >>> 2, (this.out_ptr>>>2)+to_copy));
    }

    do_set_system(kind) {
        gp_set_system(this.global_player, kind);
        this.tech_specs = gp_get_specs(this.global_player);
        this.out_ptr = this.tech_specs.out_ptr;
        this.send_specs(this.tech_specs)
    }

    send_specs(specs) {
        postMessage({kind: emulator_messages.specs, specs: specs})
    }

    reset() {
        this.frames_since_reset = 0;
        this.update_sab();
    }

    update_sab() {
        /*Atomics.store(this.shared_counters, timing_sab.status, this.status);
        Atomics.store(this.shared_counters, timing_sab.frame_counter, this.frames_since_reset);
        Atomics.store(this.shared_counters, timing_sab.fps, this.fps);*/
    }
}

const emulator_worker = new threaded_emulator_worker_t()
console.log('EW: LOAD');
onmessage = function(ev) {
    let e = ev.data;
    emulator_worker.onmessage(e);
}