"use strict";

/*
Joypad register emulation classes and functions.
 */

const SER_NES_joypad = ['counter', 'latched', 'joynum', 'button_a', 'input_buffer'];
class NES_joypad {
    constructor(joynum) {
        this.counter = 0;
        this.latched = 0;
        this.joynum = joynum;
        if (this.joynum === 1) this.joymap = input_config.controller_els.nes1;
        else this.joymap = input_config.controller_els.nes2;

        this.button_a = this.joymap.buttons.a;

        this.input_buffer = {
            'a': 0,
            'b': 0,
            'up': 0,
            'down': 0,
            'left': 0,
            'right': 0,
            'start': 0,
            'select': 0
        }
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

    update_a() {
        let key = this.joymap['a'];
        if (key === null) { this.input_buffer['a'] = 0; return; }
        this.input_buffer['a'] = this.button_a.read();
    }
}