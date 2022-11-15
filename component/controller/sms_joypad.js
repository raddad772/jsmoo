"use strict";

const SER_SMSGG_gamepad = [
    'variant', 'pins', 'num'
]

class smspad_inputs {
    constructor() {
        this.b1 = 0;
        this.b2 = 0;
        this.start = 0;
        this.up = 0;
        this.down = 0;
        this.left = 0;
        this.right = 0;
    }
}

class SMSGG_gamepad {
    constructor(variant, num) {
        this.variant = variant;
        this.pins = {
            tr: 1, // button 2
            th: 1,
            tl: 1, // button 1
            up: 1,
            down: 1,
            left: 1,
            right: 1
        }
        this.num = num;
        this.input_waiting = new smspad_inputs();
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_SMSGG_gamepad);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG SMSGG_GAMEPAD VERSION');
            return false;
        }
        return deserialization_helper(this, from, SER_SMSGG_gamepad);
    }

    buffer_input(from) {
        this.input_waiting.up = from.up;
        this.input_waiting.down = from.down;
        this.input_waiting.left = from.left;
        this.input_waiting.right = from.right;
        this.input_waiting.b1 = from.b1;
        this.input_waiting.b2 = from.b2;
        if (this.variant === SMSGG_variants.GG) {
            this.input_waiting.start = from.start;
        }
        else {
            if (this.num === 1) this.input_waiting.start = from.start;
        }
    }

    read() {
        this.latch();
        return (this.pins.up) | (this.pins.down << 1) | (this.pins.left << 2) | (this.pins.right << 3) | (this.pins.tl << 4) | (this.pins.tr << 5) | 0x40;
    }

    latch() {
        // Set our pins based on current input. 1 is high
        this.pins.up = this.input_waiting.up ? 0 : 1;
        this.pins.down = this.input_waiting.down ? 0 : 1;
        this.pins.left = this.input_waiting.left ? 0 : 1;
        this.pins.right = this.input_waiting.right ? 0 : 1;
        this.pins.tr = this.input_waiting.b2 ? 0 : 1;
        this.pins.tl = this.input_waiting.b1 ? 0 : 1;
    }
}
