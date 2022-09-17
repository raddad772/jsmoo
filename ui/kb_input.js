"use strict";

class keyboard_input_t {
	constructor() {
		this.keys = {};
        this.input_capture = true;
        this.input_can_capture = true;
	}

	register_key(keyCode) {
		this.keys[keyCode] = 0;
    }

    deregister_key(keyCode) {
		if (keyCode in this.keys) {
			delete this.keys[keyCode];
		}
    }

    keydown(keycode, event) {
		if (keycode in this.keys) {
			this.keys[keycode] = 1;
			if (keyboard_input.input_capture && keyboard_input.input_can_capture) {
				event.stopPropagation();
				event.preventDefault();
			}
		}
	}

	keyup(keycode, event) {
		if (keycode in this.keys) {
			this.keys[keycode] = 0;
			if (keyboard_input.input_capture && keyboard_input.input_can_capture) {
				event.stopPropagation();
				event.preventDefault();
			}
		}
	}
}

var keyboard_input = new keyboard_input_t();
