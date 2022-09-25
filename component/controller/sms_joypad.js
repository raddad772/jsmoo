"use strict";

const SER_SMSGG_gamepad = [
    'variant', 'pins', 'num'
]
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
        if (num === 1) this.joymap = input_config.controller_els.sms1;
        else this.joymap = input_config.controller_els.sms2;
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

    read() {
        this.latch();
        return (this.pins.up) | (this.pins.down << 1) | (this.pins.left << 2) | (this.pins.right << 3) | (this.pins.tl << 4) | (this.pins.tr << 5) | 0x40;
    }

    latch() {
        // Set our pins based on current input. 1 is high
        this.joymap.latch();
        this.pins.up = this.joymap.latched.up ? 0 : 1;
        this.pins.down = this.joymap.latched.down ? 0 : 1;
        this.pins.left = this.joymap.latched.left ? 0 : 1;
        this.pins.right = this.joymap.latched.right ? 0 : 1;
        this.pins.tr = this.joymap.latched.b2 ? 0 : 1;
        this.pins.tl = this.joymap.latched.b1 ? 0 : 1;
    }
}
