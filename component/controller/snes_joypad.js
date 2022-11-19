"use strict";

/*
Joypad register emulation classes and functions.
 */

class snespad_inputs {
    constructor() {
        this.a = 0;
        this.b = 0;
        this.x = 0;
        this.y = 0;
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

class SNES_joypad {
    constructor(joynum) {
        this.counter = 0;
        this.latched = 0;
        this.joynum = joynum;

        this.input_buffer = new snespad_inputs();
        this.input_waiting = new snespad_inputs();
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
            this.input_buffer.x = this.input_waiting.x;
            this.input_buffer.y = this.input_waiting.y;
            this.input_buffer.l = this.input_waiting.l;
            this.input_buffer.r = this.input_waiting.r;
            this.input_buffer.start = this.input_waiting.start;
            this.input_buffer.select = this.input_waiting.select;
        }
    }

    /**
     * @param {snespad_inputs} from
     */
    buffer_input(from) {
        this.input_waiting.up = from.up;
        this.input_waiting.down = from.down;
        this.input_waiting.left = from.left;
        this.input_waiting.right = from.right;
        this.input_waiting.a = from.a;
        this.input_waiting.b = from.b;
        this.input_waiting.x = from.x;
        this.input_waiting.y = from.y;
        this.input_waiting.l = from.l;
        this.input_waiting.r = from.r;
        this.input_waiting.start = from.start;
        this.input_waiting.select = from.select;
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
        ostr += ostr_add('x', 'X');
        ostr += ostr_add('y', 'Y');
        ostr += ostr_add('start', 'S');
        ostr += ostr_add('select', 'T');
        ostr += ostr_add('l', 'l');
        ostr += ostr_add('r', 'r');
        return ostr;
    }

    data() {
        if (this.latched === 1) {
            return this.input_buffer.b;
        }

        switch(this.counter++) {
            case 0: return this.input_buffer.b;
            case 1: return this.input_buffer.y;
            case 2: return this.input_buffer.select;
            case 3: return this.input_buffer.start;
            case 4: return this.input_buffer.up;
            case 5: return this.input_buffer.down;
            case 6: return this.input_buffer.left;
            case 7: return this.input_buffer.right;
            case 8: return this.input_buffer.a;
            case 9: return this.input_buffer.x;
            case 10: return this.input_buffer.l;
            case 11: return this.input_buffer.r;
            case 12:
            case 13:
            case 14:
            case 15:
                return 0;
        }

        this.counter = 16;
        return 1;
    }
}