"use strict";

/*
Joypad register emulation classes and functions.
 */

class nespad_inputs {
    constructor() {
        this.a = 0;
        this.b = 0;
        this.start = 0;
        this.select = 0;
        this.up = 0;
        this.down = 0;
        this.left = 0;
        this.right = 0;
    }
}

const SER_NES_joypad = ['counter', 'latched', 'joynum'];
class NES_joypad {
    constructor(joynum) {
        this.counter = 0;
        this.latched = 0;
        this.joynum = joynum;
        this.input_buffer = new nespad_inputs();
        this.input_waiting = new nespad_inputs();
    }

    serialize() {
        let o = {
            version: 1
        }
        serialization_helper(o, this, SER_NES_joypad);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD NES JOYPAD VERSION');
            return false;
        }
        return deserialization_helper(this, from, SER_NES_joypad);
    }

    /**
     * @param {nespad_inputs} from
     */
    buffer_input(from) {
        this.input_waiting.up = from.up;
        this.input_waiting.down = from.down;
        this.input_waiting.left = from.left;
        this.input_waiting.right = from.right;
        this.input_waiting.a = from.a;
        this.input_waiting.b = from.b;
        this.input_waiting.start = from.start;
        this.input_waiting.select = from.select;
    }

    latch(what) {
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

    textrep() {
        let ib = this.input_buffer;
        function ostr_add(button, representation) {
            if (ib[button]) return representation;
            return ' ';
        }

        let ostr = '';
        ostr += ostr_add('up', 'U');
        ostr += ostr_add('down', 'D');
        ostr += ostr_add('left', 'L');
        ostr += ostr_add('right', 'R');
        ostr += ostr_add('a', 'A');
        ostr += ostr_add('b', 'B');
        ostr += ostr_add('start', 'S');
        ostr += ostr_add('select', 'T');
        return ostr;
    }

    data() {
        if (this.latched === 1) {
            this.update_a();
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