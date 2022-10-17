"use strict";

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

class threaded_emulator_t {
    constructor(onmsg) {
        console.log('EMULATOR WORKER THREAD CONSTRUCTOR!');
        this.thread = new Worker('/helpers/threaded_emulator/threaded_emulator_worker.js');
        this.thread.onmessage = this.on_child_message.bind(this);
        this.thread.onerror = function(a,b,c) { console.log('ERR', a, b, c);}
        this.system_kind = '';
        this.parent_msg = onmsg;
        this.framebuffer_sab = new SharedArrayBuffer(256*256*4);
        this.framebuffer = new Uint8Array(this.framebuffer_sab);
        this.general_sab = new SharedArrayBuffer(64);
        this.tech_specs = null;

        this.parent_msg = onmsg;
    }

    onload() {
        this.send_startup_message();
    }

    on_child_message(ev) {
        let e = ev.data;
        if (e.kind === emulator_messages.specs) {
            this.tech_specs = e.specs;
        }
        this.parent_msg(e);
    }

    send_set_system(kind) {
        console.log('MT: SET SYSTEM', kind)
        this.system_kind = kind;
        this.thread.postMessage({kind: emulator_messages.change_system, kind_str: kind});
    }

    /**
     * @param {Uint8Array} ROM
     */
    send_load_ROM(ROM) {
        this.thread.postMessage({kind: emulator_messages.load_rom, ROM: ROM});
    }

    send_request_frame(keymap) {
        //console.log('MT: REQUEST FRAME');
        this.thread.postMessage({kind: emulator_messages.frame_requested, keymap: keymap});
    }

    send_startup_message() {
        console.log('POSTING STARTUP MESSAGE', this.thread);
        this.thread.postMessage({kind: emulator_messages.startup, framebuffer_sab: this.framebuffer_sab, general_sab: this.general_sab});
    }

    /**
     * @param {canvas_manager_t} canvas
     */
    present(canvas) {
        canvas.set_size(this.tech_specs.x_resolution, this.tech_specs.y_resolution);
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
