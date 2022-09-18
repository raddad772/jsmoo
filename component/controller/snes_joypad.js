"use strict";

/*
Joypad register emulation classes and functions.
 */

class SNES_joypad {
    constructor(joynum) {
        this.counter = 0;
        this.latched = 0;
        this.joynum = joynum;
        if (this.joynum === 1) this.joymap = input_config.controller_els.snes1;
        else this.joymap = input_config.controller_els.snes2;

        this.button_b = this.joymap.buttons.b;

        this.input_buffer = {
            'a': 0,
            'b': 0,
            'x': 0,
            'y': 0,
            'up': 0,
            'down': 0,
            'left': 0,
            'right': 0,
            'start': 0,
            'select': 0,
            'l': 0,
            'r': 0
        }
    }

    latch(what) {
        if (this.latched === what) return;
        this.latched = what;
        this.counter = 0;
        if (this.latched === 0) {
            this.input_buffer = this.joymap.latch();
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
            this.update_b();
            return this.input_buffer['b'];
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

    update_b() {
        let key = this.joymap['b'];
        if (key === null) { this.input_buffer['b'] = 0; return; }
        this.input_buffer['b'] = this.button_b.read();
    }
}