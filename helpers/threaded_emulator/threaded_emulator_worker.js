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
const USE_ASSEMBLYSCRIPT = false
importScripts('/helpers/thread_common.js');
//importScripts('/helpers/as_wrapper.js');
importScripts('/helpers/js_wrapper.js');

var ui = {
}

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
        this.js_wrapper.update_keymap(keymap);
    }

    async process_load_ROM(e) {
        this.js_wrapper.load_ROM_from_RAM(e.name, e.ROM);
        this.step_done(emulator_messages.step3_done);
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
            case emulator_messages.ui_event:
                this.process_ui_event(e.data);
                return;
            case emulator_messages.request_savestate:
                this.do_savestate();
                return;
            case emulator_messages.send_loadstate:
                this.do_loadstate(e.ss);
                return;
            default:
                console.log('EMULATION MAIN THREAD UNHANDLED MESSAGE', e);
                break;
        }
    }

    do_savestate() {
        postMessage({kind: emulator_messages.savestate_return, ss: this.js_wrapper.system.serialize()});
    }

    do_loadstate(ss) {
        this.js_wrapper.system.deserialize(ss);
    }

    master_step(howmany) {
        let on = this.js_wrapper.step_master(howmany);
        this.send_mstep_done(on);
    }

    process_ui_event(event) {
        switch(event.target) {
            case 'button_click':
                switch(event.data.id) {
                    case 'master_step':
                        this.master_step(event.data.steps);
                        break;
                    default:
                        console.log('UNKNOWN BUTTON CLICKED', event);
                        break;
                }
                break;
            case 'dbg':
                dbg.ui_event(event.data);
                break;
            case 'startup':
                let v = event.data;
                switch(v[0]) {
                    case 'button':
                        break;
                    case 'input':
                    case 'output':
                        ui[v[1]] = v[2];
                        break;
                    case 'select':
                        break;
                    case 'checkbox':
                        switch(v[1]) {
                            case 'tracingCPU':
                                dbg.ui_event({'tracingCPU': v[2] || false});
                                break;
                            case 'brknmirq':
                                dbg.ui_event({'brk_on_NMIRQ': v[2] || false})
                                break;
                            default:
                                ui[v[1]] = v[2];
                                break;
                        }
                        break;
                    default:
                        console.log('unhandled UI element!', v);
                }
                break;
            default:
                console.log('UNKNOWN UI EVENT', event);
        }
    }

    run_frame() {
        let ts = performance.now();
        let on = this.js_wrapper.run_frame();
        let span = performance.now() - ts;
        //console.log('TIME PER FRAME:', span.toFixed(4));
        this.send_frame_done(on);
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

    send_mstep_done(data) {
        postMessage({kind: emulator_messages.mstep_complete, data: data})
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