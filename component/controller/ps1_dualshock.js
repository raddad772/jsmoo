"use strict";

class ps1_dualshock_inputs {
    constructor() {
        this.triangle = 0;
        this.circle = 0;
        this.square = 0;
        this.x = 0;
        this.l = 0;
        this.r = 0;
        this.start = 0;
        this.select = 0;
        this.up = 0;
        this.down = 0;
        this.left = 0;
        this.right = 0;
    }
}

class PS1_dualshock {
    constructor() {
        this.input_buffer = new ps1_dualshock_inputs();
        this.input_waiting = new ps1_dualshock_inputs();
    }

    /**
     * @param {ps1_dualshock_inputs} from
     */
    buffer_input(from) {
        this.input_waiting.up = from.up;
        this.input_waiting.down = from.down;
        this.input_waiting.left = from.left;
        this.input_waiting.right = from.right;
        this.input_waiting.triangle = from.triangle;
        this.input_waiting.circle = from.circle;
        this.input_waiting.square = from.square;
        this.input_waiting.x = from.x;
        this.input_waiting.l = from.l;
        this.input_waiting.r = from.r;
        this.input_waiting.start = from.start;
        this.input_waiting.select = from.select;
    }
}