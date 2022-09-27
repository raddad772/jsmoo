"use strict";

class key_t {
	constructor(keyCode, key, bound_function, prevent) {
		this.keyCode = keyCode;
		this.key = key;
		this.bound_function = bound_function;
		this.prevent = prevent;
		this.value = 0;
	}
}

class keyboard_input_t {
	constructor() {
		this.keys = {};
        this.input_capture = true;
        this.input_can_capture = true;
	}

	register_key(keyCode, key, bound_function=null, prevent=true) {
		if (typeof this.keys[keyCode] !== 'undefined') {
			alert('Duplicate bound key! ' + key);
		} else {
			this.keys[keyCode] = new key_t(keyCode, key, bound_function, prevent)
		}
    }

    deregister_key(keyCode) {
		if (keyCode in this.keys) {
			delete this.keys[keyCode];
		}
    }

    keydown(keycode, event) {
		if (keycode in this.keys) {
			this.keys[keycode].value = 1;
			let bf = this.keys[keycode].bound_function;
			if ((bf !== null) && (typeof bf !== 'undefined') ) {
				bf(keycode, 'down');
			}
			if (keyboard_input.input_capture && keyboard_input.input_can_capture && this.keys[keycode].prevent) {
				event.stopPropagation();
				event.preventDefault();
			}
		}
	}

	keyup(keycode, event) {
		if (keycode in this.keys) {
			this.keys[keycode].value = 0;
			let bf = this.keys[keycode].bound_function;
			if ((bf !== null) && (typeof bf !== 'undefined') ) {
				bf(keycode, 'up');
			}
			if (keyboard_input.input_capture && keyboard_input.input_can_capture && this.keys[keycode].prevent) {
				event.stopPropagation();
				event.preventDefault();
			}
		}
	}
}

var keyboard_input = new keyboard_input_t();
