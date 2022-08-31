"use strict";

importScripts('timing_header.js');

class timing_worker_t {
    constructor() {
        this.sab = null;
        this.shared_counters = null;
        this.status = timing_status.paused;
        this.frames_since_reset = 0;

        this.fps_target = 0;
        this.sleep_target = 0;
        this.frame_time_target = 0;
        this.frame_time_full = 0;
        this.next_frame_start = 0;
        this.set_fps_target(80);
        this.sleep_start = 0;
        this.frame_start = 0;

        let frame_avg_window =

        this.fps_counter = 0;
        this.fps = 0;
        this.here = 0;
    }

    set_fps_target(to) {
        this.fps_target = to;
        this.frame_time_full = (1000 / this.fps_target);
        this.sleep_target = this.frame_time_full * .95; // Sleep 80% of the time
        this.frame_time_target = this.frame_time_full *.9; // Wait until 90% of the time
        console.log('SLEEP TARGET', this.sleep_target)
        console.log('FRAME TIME TARGET', this.frame_time_target)
        console.log('FRAME TIEM FULL', this.frame_time_full);
    }

    onmessage(e) {
        switch(e.kind) {
            case timing_messages.startup:
                this.sab = e.sab;
                this.shared_counters = new Int32Array(this.sab);
                this.reset();
                this.send_status_update();
                break;
            case timing_messages.frame_complete:
                this.frame_complete_and_wait();
                break;
            case timing_messages.play_request:
                this.play_request();
                break;
            case timing_messages.pause_request:
                this.pause_request();
                break;
            default:
                console.log('TIMING THREAD UNHANDLED MESSAGE');
        }
    }
    // 1. request frame via msg
    // 3. get frame done acknowledgement via msg, calculate time until next frame
    // 4. sleep until next frame using Atomics.wait()?
    // 5.

    play_request() {
        if (this.status === timing_status.playing) return;
        this.status = timing_status.playing;
        this.frame_start = performance.now() + (this.frame_time_full);
        this.request_frame();
    }

    pause_request() {
        if (this.status === timing_status.paused) return;
        this.status = timing_status.paused;
    }

    frame_complete_and_wait() {
        let ft = performance.now() - this.frame_start; // Frame time
        this.frame_start = performance.now();
        //console.log('FRAME TIME', ft);

        Atomics.store(this.shared_counters, timing_sab.frame_counter, this.frames_since_reset);

        if (this.status !== timing_status.playing) return;
        let time_to_sleep = this.sleep_target - ft;
        if (time_to_sleep > 0) {
            this.shared_counters[timing_sab.waiter] = 0;
            Atomics.wait(this.shared_counters, timing_sab.waiter, 0, time_to_sleep);
        }
        /*let time_to_spin = this.frame_time_target - (ft + time_to_sleep);
        console.log(ft, time_to_spin, this.frame_time_target, time_to_sleep);
        if (time_to_spin > 0) {
            let i = 0;
            while((performance.now() - this.frame_start) < this.frame_time_target) {
                i++;
            }
        }*/
        //console.log(performance.now(), this.frame_start + this.frame_time_full);
        /*let fs = this.frame_start + this.frame_time_target;
        this.frame_start = fs;*/
        this.request_frame();
    }

    request_frame() {
        postMessage({
            kind: timing_messages.frame_request
        });
    }

    send_status_update() {
        postMessage({
            kind: timing_messages.status_update,
            status: this.status,
            frames_since_reset: this.frames_since_reset,
        });
    }

    reset() {
        console.log('TIMING THREAD: reset');
        this.frames_since_reset = 0;
        this.update_sab();
    }

    update_sab() {
        Atomics.store(this.shared_counters, timing_sab.status, this.status);
        Atomics.store(this.shared_counters, timing_sab.frame_counter, this.frames_since_reset);
        Atomics.store(this.shared_counters, timing_sab.fps, this.fps);
    }
}

const timing_worker = new timing_worker_t();

onmessage = function(ev) {
    let e = ev.data;
    timing_worker.onmessage(e);
}