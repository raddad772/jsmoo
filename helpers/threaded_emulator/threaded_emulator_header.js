"use strict";

class threaded_emulator_t {
    constructor(onmsg) {
        //console.log('EMULATOR WORKER THREAD CONSTRUCTOR!');
        this.thread = new Worker('/helpers/threaded_emulator/threaded_emulator_worker.js');
        this.thread.onmessage = this.on_child_message.bind(this);
        this.thread.onerror = function(a,b,c) { console.log('ERR', a, b, c);}
        this.system_kind = '';
        this.parent_msg = onmsg;
        //this.framebuffer_sab = new SharedArrayBuffer(256*256*4);
        //this.framebuffer = new Uint8Array(this.framebuffer_sab);
        this.general_sab = new SharedArrayBuffer(64);
        this.tech_specs = null;

        this.parent_msg = onmsg;

        this.step1_done = false;
        this.step2_done = false;
        this.queued_step_2 = null;
        this.queued_bios = null;
        this.queued_step_3 = null;
        this.queued_name = null;
    }

    onload() {
        this.send_startup_message();
    }

    on_child_message(ev) {
        let e = ev.data;
        switch(e.kind) {
            case emulator_messages.specs:
                this.tech_specs = e.specs;
                break;
            case emulator_messages.step1_done:
                this.step1_done = true;
                if (this.queued_step_2 !== null) {
                    this.system_kind = this.queued_step_2;
                    this.thread.postMessage({kind: emulator_messages.change_system, kind_str: this.queued_step_2, bios: this.queued_bios});
                    this.queued_step_2 = null;
                }
                break;
            case emulator_messages.step2_done:
                this.step2_done = true;
                if (this.queued_step_3 !== null) {
                    this.thread.postMessage({kind: emulator_messages.load_rom, name: this.queued_name, ROM: this.queued_step_3});
                    this.queued_step_3 = null;
                    this.queued_name = null;
                }
                break;
        }
        this.parent_msg(e);
    }

    send_set_system(kind, bios) {
        if (!this.step1_done) {
            this.queued_step_2 = kind;
            this.queued_bios = bios;
            return;
        }
        this.system_kind = kind;
        this.thread.postMessage({kind: emulator_messages.change_system, kind_str: kind, bios: bios});
    }

    send_save_state_request() {
        this.thread.postMessage({kind: emulator_messages.request_savestate});
    }

    send_load_state(ss) {
        this.thread.postMessage({kind: emulator_messages.send_loadstate, ss: ss})
    }

    /**
     * @param {string} name
     * @param {Uint8Array} ROM
     */
    send_load_ROM(name, ROM) {
        if (!this.step2_done) {
            console.log('STEP2 NOT DONE!')
            this.queued_step_3 = ROM;
            this.queued_name = name;
            return;
        }
        console.log('SENDING ROM...')
        this.thread.postMessage({kind: emulator_messages.load_rom, name: name, ROM: ROM});
    }

    send_ui_event(uie) {
        this.thread.postMessage({kind: emulator_messages.ui_event, data: uie});
    }

    send_request_frame(keymap) {
        this.thread.postMessage({kind: emulator_messages.frame_requested, keymap: keymap});
    }

    send_startup_message() {
        this.step1_done = false;
        this.thread.postMessage({kind: emulator_messages.startup, general_sab: this.general_sab});
    }

    /**
     * @param {canvas_manager_t} canvas
     */
    present(canvas) {
        console.log('THREADED PRESENT');
        //canvas.set_size(this.tech_specs.x_resolution, this.tech_specs.y_resolution);
        let imgdata = canvas.get_imgdata();
		for (let y = 0; y < this.tech_specs.y_resolution; y++) {
			for (let x = 0; x < this.tech_specs.x_resolution; x++) {
				let po = ((y * this.tech_specs.x_resolution) + x) * 4;
                imgdata.data[po] = this.framebuffer[po];
                imgdata.data[po+1] = this.framebuffer[po+1];
                imgdata.data[po+2] = this.framebuffer[po+2];
                imgdata.data[po+3] = this.framebuffer[po+3];
			}
		}
        canvas.put_imgdata(imgdata);
    }
}
