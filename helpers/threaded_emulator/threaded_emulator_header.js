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
        this.thread = null;
        this.parent_msg = onmsg;
        this.framebuffer_sab = new SharedArrayBuffer(256*256*4);
        this.general_sab = new SharedArrayBuffer(64);

        this.parent_msg = onmsg;
    }

    onload() {
        this.thread = new Worker('/helpers/threaded_emulator/threaded_emulator_worker.js', {type: 'module'});
        this.thread.onmessage = this.on_child_message.bind(this);
        this.thread.onerror = function(a,b,c) { console.log('ERR', a, b, c);}
        this.send_startup_message();
        this.send_set_system(DEFAULT_SYSTEM);
    }

    on_child_message(ev) {
        let e = ev.data;
        this.parent_msg(e);
    }

    send_set_system(kind) {
        console.log('MT: SET SYSTEM')
        this.thread.postMessage({kind: emulator_messages.change_system, kind_str: kind});
    }

    /**
     * @param {Uint8Array} ROM
     */
    send_load_ROM(ROM) {
        this.thread.postMessage({kind: emulator_messages.load_rom, ROM: ROM});
    }

    send_request_frame() {
        console.log('MT: REQUEST FRAME');
        this.thread.postMessage({kind: emulator_messages.frame_requested});
    }

    send_startup_message() {
        console.log('POSTING STARTUP MESSAGE', this.thread);
        this.thread.postMessage({kind: emulator_messages.startup, framebuffer_sab: this.framebuffer_sab, general_sab: this.general_sab});
    }
}
