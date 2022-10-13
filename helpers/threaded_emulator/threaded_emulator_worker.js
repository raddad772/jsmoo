"use strict";
import {
    gp_load_ROM_from_RAM,
    gp_run_frame,
    gp_get_specs,
    gp_set_system,
    new_global_player }
    from "/assemblyscript/build/debug.js";


const emulator_messages = Object.freeze({
    unknown: 0,
    // Parent to child
    frame_requested: 1,
    change_system: 2,
    load_rom: 3,
    load_bios: 4,
    reset: 5,
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
        this.global_player = null;
    }

    onmessage(e) {
        switch(e.kind) {
            case emulator_messages.startup:
                console.log('ET: startup');
                this.framebuffer_sab = e.framebuffer_sab;
                this.general_sab = e.general_sab;
                this.framebuffer = new Uint8Array(this.framebuffer_sab);
                this.global_player = new_global_player();
                return;
            case emulator_messages.load_rom:
                console.log('ET: passing ROM...');
                gp_load_ROM_from_RAM(this.global_player, e.ROM);
                return;
            case emulator_messages.frame_requested:
                console.log('ET: running frame...');
                gp_run_frame(this.global_player);
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

    do_set_system(kind) {
        console.log('GP!', this.global_player);
        gp_set_system(this.global_player, kind);
        let r = gp_get_specs(this.global_player);
        console.log('GOT SPECS:', r);
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