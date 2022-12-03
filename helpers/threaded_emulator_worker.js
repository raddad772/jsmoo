"use strict";

const DO_WASM_IMPORTS = true;
importScripts('/helpers/thread_common.js');
importScripts('/helpers/js_wrapper.js');

var ui = {
}

class threaded_emulator_worker_t {
    constructor() {
        this.shared_counters = null;
        this.frames_since_reset = 0;
        this.setup = false;
        this.tech_specs = null;
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

    dump_something(e) {
        switch(e.what) {
            case 'sprites':
                // {kind: emulator_messages.dump_something, what: 'sprites', imgdata: canvas.get_imgdata().data.buffer, width: 200, height: 200 }
                this.js_wrapper.dump_sprites(e.imgdata, e.width, e.height);
                break;
            case 'VRAM':
                this.js_wrapper.dump_RAM(e.what, e.addr);
                break;
            case 'bg1':
            case 'bg2':
            case 'bg3':
            case 'bg4':
                this.js_wrapper.dump_bg(e.imgdata, e.what, e.width, e.height)
                break;
            default:
                console.log('NO DUMP AVAILABLE?');
        }
    }

    async onmessage(e) {
        switch(e.kind) {
            case emulator_messages.dump_something:
                this.dump_something(e);
                return;
            case emulator_messages.startup:
                this.general_sab = e.general_sab;
                await this.js_wrapper.do_as_setup();
                this.step_done(emulator_messages.step1_done);
                return;
            case emulator_messages.load_rom:
                await this.process_load_ROM(e)
                return;
            case emulator_messages.frame_requested:
                //console.log('ET: running frame...');
                dbg.do_break = false;
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
        dbg.traces.draw(dconsole);
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
        this.js_wrapper.set_system(kind, bios);
        this.tech_specs = this.js_wrapper.get_specs();
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

    send_debug_break() {
        postMessage({kind: emulator_messages.dbg_break});
    }

    send_textconsole_message(msg) {
        postMessage({kind: emulator_messages.text_transmit, data: msg})
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