"use strict";

const timing_messages = Object.freeze({
    unknown: 0,
    // Parent to child
    animation_frame_requested: 1,
    pause_request: 2,
    play_request: 3,
    reset_request: 4,
    frame_complete: 6,
    set_fps_target: 7,

    startup: 100,

    // Child to parent
    frame_request: 1,
    status_update: 5,

});

const timing_status = Object.freeze({
    paused: 0,
    playing: 1,
    fast_forwarding: 2
});

const timing_sab = Object.freeze({
    status: 0,
    frame_counter: 1,
    fps: 2,
    waiter: 3
});


class timing_thread_t {
    constructor(onmsg) {
        this.timing_thread = new Worker('/helpers/timing/timing_worker.js');
        this.timing_thread.onmessage = this.on_child_message.bind(this);
        this.sab = new SharedArrayBuffer(64);
        this.shared_counters = new Int32Array(this.sab);
        this.status = timing_status.paused;
        this.send_startup_message();

        this.parent_msg = onmsg;
    }

    on_child_message(ev) {
        let e = ev.data;
        if (e.kind === timing_messages.frame_request) this.parent_msg(e);
    }

    send_startup_message() {
        this.timing_thread.postMessage({kind: timing_messages.startup, sab: this.sab});
    }

	frame_done() {
        if (dbg.frames_til_pause !== 0) {
            dbg.frames_til_pause--;
            ui_el.frames_til_pause.value = dbg.frames_til_pause;
            if (dbg.frames_til_pause === 0) {
                this.pause();
                stop_fps_count();
            }
        }
		this.timing_thread.postMessage({kind: timing_messages.frame_complete});
	}

    set_fps_target(to) {
        this.timing_thread.postMessage({kind: timing_messages.set_fps_target, target: to});
    }

    pause() {
        if (this.status === timing_status.paused) return;
        this.status = timing_status.paused;
        this.timing_thread.postMessage({kind: timing_messages.pause_request});
    }

    play() {
        if (this.status === timing_status.playing) return;
        this.status = timing_status.playing;
        this.timing_thread.postMessage({kind: timing_messages.play_request});
    }


}

