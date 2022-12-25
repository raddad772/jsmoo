/*
Joypad register emulation classes and functions.
 */

import {nespad_inputs} from "../../system/nes/nes";
import {NES_controller} from "../../system/nes/cpu/controller_port";

export class NES_joypad implements NES_controller {
    counter: u32 = 0
    latched: u32 = 0
    joynum: u32 = 0
    input_buffer: nespad_inputs = new nespad_inputs();
    input_waiting: nespad_inputs = new nespad_inputs();
    constructor(joynum: u32) {
        this.joynum = joynum;
    }

    buffer_input(from: nespad_inputs): void {
        this.input_waiting.up = from.up;
        this.input_waiting.down = from.down;
        this.input_waiting.left = from.left;
        this.input_waiting.right = from.right;
        this.input_waiting.a = from.a;
        this.input_waiting.b = from.b;
        this.input_waiting.start = from.start;
        this.input_waiting.select = from.select;
    }

    latch(what: u32): void {
        if (this.latched === what) return;
        this.latched = what;
        this.counter = 0;
        if (this.latched === 0) {
            this.input_buffer.up = this.input_waiting.up;
            this.input_buffer.down = this.input_waiting.down;
            this.input_buffer.left = this.input_waiting.left;
            this.input_buffer.right = this.input_waiting.right;
            this.input_buffer.a = this.input_waiting.a;
            this.input_buffer.b = this.input_waiting.b;
            this.input_buffer.start = this.input_waiting.start;
            this.input_buffer.select = this.input_waiting.select;
        }
    }

    data(): u32 {
        if (this.latched === 1) {
            return this.input_buffer.a;
        }

        switch(this.counter++) {
            case 0: return this.input_buffer.a;
            case 1: return this.input_buffer.b;
            case 2: return this.input_buffer.select;
            case 3: return this.input_buffer.start;
            case 4: return this.input_buffer.up;
            case 5: return this.input_buffer.down;
            case 6: return this.input_buffer.left;
            case 7: return this.input_buffer.right;
        }

        this.counter = 8;
        return 1;
    }
}