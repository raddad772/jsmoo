"use strict";

importScripts('timing_header.js');

class timing_worker_t {
    constructor() {
        this.sab = null;
        this.shared_counters = null;
        this.status = timing_status.paused;
        this.frames_since_reset = 0;

        this.fps_target = 0;
        this.fps_cap = true; // Yes cap those FPS
        this.set_fps_target(60); // Default to 60fps because

        this.fps_counter = 0;
        this.fps = 0;
    }

    onmessage(e) {
        switch(e.kind) {
            case timing_messages.set_fps_cap:
                this.set_fps_cap(e.to);
                break;
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
            case timing_messages.set_fps_target:
                this.set_fps_target(e.target);
                break;
            default:
                console.log('TIMING THREAD UNHANDLED MESSAGE');
        }
    }
    // 1. request frame via msg
    // 3. get frame done acknowledgement via msg, calculate time until next frame
    // 4. sleep until next frame using Atomics.wait()?
    // 5.

    set_fps_cap(to) {
        // If we're turning on, recalculate pinned time
        if ((!this.fps_cap) && to) {
            this.pin_start = performance.now();
            this.pin_target = this.pin_start + this.frame_time_full;
        }
        this.fps_cap = to;
    }

    pause_request() {
        if (this.status === timing_status.paused) return;
        this.status = timing_status.paused;
    }

    set_fps_target(to) {
        this.fps_target = to;
        this.frame_time_full = (1000 / this.fps_target);
        this.pin_target = this.pin_start + this.frame_time_full;
    }

    play_request() {
        if (this.status === timing_status.playing) return;
        this.status = timing_status.playing;
        this.pin_start = performance.now();
        this.pin_target = this.pin_start + this.frame_time_full;
        this.request_frame();
    }

    frame_complete_and_wait() {
        let ft = performance.now() - this.frame_start;
        Atomics.store(this.shared_counters, timing_sab.frame_counter, this.frames_since_reset);
        if (this.status !== timing_status.playing) return;
        if (!this.fps_cap) { this.request_frame(); return; }
        if (ft > this.pin_target) {
            console.log('OVERRUN BY', ft - this.pin_target)
            this.pin_start = performance.now();
            this.pin_target = this.pin_start + this.frame_time_full;
        }
        else {
            //let time_to_sleep = this.sleep_target - ft;
            /*if (time_to_sleep > 0) {
                this.shared_counters[timing_sab.waiter] = 0;
                Atomics.wait(this.shared_counters, timing_sab.waiter, 0, time_to_sleep);
            }*/
            let i = 0;
            while(performance.now() < this.pin_target) {
                i++;
            }
            this.pin_target += this.frame_time_full;
        }

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