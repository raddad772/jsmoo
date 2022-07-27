"use strict";

const J1_MAP_KEY_TO_BUTTON = Object.freeze({
    'up': 'up',
    'left': 'left',
    'right': 'right',
    'down': 'down',
    'start': 'f',
    'select': 'tab',
    'a': 'x',
    'b': 'z',
    'x': 's',
    'y': 'a',
    'l': 'q',
    'r': 'w'
});

const EMPTY_MAP_KEY_TO_BUTTON = {
    'up': null,
    'left': null,
    'right': null,
    'down': null,
    'start': null,
    'select': null,
    'a': null,
    'b': null,
    'x': null,
    'y': null,
    'l': null,
    'r': null
}

class SNES_joypad {
    constructor(joynum) {
        this.counter = 0;
        this.latched = 0;
        this.joynum = joynum;
        if (this.joynum === 1) this.joymap = J1_MAP_KEY_TO_BUTTON;
        else this.joymap = EMPTY_MAP_KEY_TO_BUTTON;

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

        this.y_hold = 0;
        this.up_latch = 0;
        this.down_latch = 0;
        this.x_hold = 0;
        this.left_latch = 0;
        this.right_latch = 0;
    }

    latch(what) {
        if (this.latched === what) return;
        this.latched = what;
        this.counter = 0;
        if (this.latched === 0) {
            this.fill_input_buffer();
            if (this.joynum === 1) console.log(this.input_buffer['start']);//this.pprint();

            // if U/D not held down, update
            if (!(this.input_buffer['up'] & this.input_buffer['down'])) {
                this.y_hold = 0;
                this.up_latch = this.input_buffer['up'];
                this.down_latch = this.input_buffer['down'];
            }
            else if (!this.y_hold) {
                this.y_hold = 1;
                let r = this.up_latch;
                this.up_latch = this.down_latch;
                this.down_latch = r;
            }

            // If L/R not held down, update
            if (!(this.input_buffer['left'] & this.input_buffer['right'])) {
                this.x_hold = 0;
                this.left_latch = this.input_buffer['left'];
                this.right_latch = this.input_buffer['right'];
            }
            else if (!this.x_hold) {
                this.x_hold = 1;
                let r = this.left_latch;
                this.left_latch = this.right_latch;
                this.right_latch = r;
            }
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

    pprint() {
        console.log(this.textrep());
    }

    data() {
        if (this.latched === 1) {
            this.update_b();
            return this.input_buffer['b'];
        }

        switch(this.counter++) {
            case 0: return this.input_buffer['b'];
            case 1: return this.input_buffer['y'];
            case 2: return this.input_buffer['select'];
            case 3: return this.input_buffer['start'];
            case 4: return this.up_latch;
            case 5: return this.down_latch;
            case 6: return this.left_latch;
            case 7: return this.right_latch;
            case 8: return this.input_buffer['a'];
            case 9: return this.input_buffer['x'];
            case 10: return this.input_buffer['l'];
            case 11: return this.input_buffer['r'];
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
        this.input_buffer['b'] = +keyboard_input.keys[key];
    }

    fill_input_buffer() {
        for (let button in this.input_buffer) {
            let key = this.joymap[button];
            if (key === null) { this.input_buffer[button] = 0; continue; }
            this.input_buffer[button] = +keyboard_input.keys[key];
        }
    }
}