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

const INPUT_MODES = {
	joypads: 0,
	fullqwerty: 1
}

class keyboard_input_t {
	constructor() {
		this.keys = {};
		this.keys_fullqwerty = {};
        this.input_capture = true;
        this.input_can_capture = true;

		this.mode = 0;
		/**
		 * @type {null|HTMLElement}
		 */
		this.mode_el = null;
	}

	set_kb_mode(to) {
		if (!to) this.mode = INPUT_MODES.joypads;
		else this.mode = INPUT_MODES.fullqwerty;
	}

	async onload() {
		this.mode_el = document.getElementById('kb_mode_checkbox');
		this.mode_el.addEventListener('change', function(event) {
			keyboard_input.set_kb_mode(event.currentTarget.checked);
		});
	}

	register_key(keyCode, key, bound_function=null, prevent=true, input_mode=0) {
		if (input_mode === INPUT_MODES.fullqwerty) {
			if (typeof this.keys_fullqwerty[keyCode] !== 'undefined') {
				console.log('Duplicate bound fullqwerty key! ' + key);
			} else {
				this.keys_fullqwerty[keyCode] = new key_t(keyCode, key, bound_function, prevent)
			}
		}
		else {
			if (typeof this.keys[keyCode] !== 'undefined') {
				if (key !== null) console.log('Duplicate bound key! ', keyCode, key);
			} else {
				this.keys[keyCode] = new key_t(keyCode, key, bound_function, prevent)
			}
		}
    }

    deregister_key(keyCode, input_mode=INPUT_MODES.joypads) {
		if (input_mode === INPUT_MODES.fullqwerty) {
			if (keyCode in this.keys_fullqwerty) {
				delete this.keys_fullqwerty[keyCode];
			}
		}
		else {
			if (keyCode in this.keys) {
				delete this.keys[keyCode];
			}
		}
    }

    keydown(keycode, event) {
		if ((keycode in this.keys) || (keycode in this.keys_fullqwerty)) {
			if (this.mode === INPUT_MODES.fullqwerty) {
				if (keycode in this.keys_fullqwerty) {
					this.keys_fullqwerty[keycode].value = 1;
					if (keyboard_input.input_capture && keyboard_input.input_can_capture) {
						event.stopPropagation();
						event.preventDefault();
					}
				}
			}
			else {
				if (keycode in this.keys) {
					this.keys[keycode].value = 1;
					let bf = this.keys[keycode].bound_function;
					if ((bf !== null) && (typeof bf !== 'undefined')) {
						bf(keycode, 'down');
					}
					if (keyboard_input.input_capture && keyboard_input.input_can_capture && this.keys[keycode].prevent) {
						event.stopPropagation();
						event.preventDefault();
					}
				}
			}
		}
	}

	keyup(keycode, event) {
		if ((keycode in this.keys) || (keycode in this.keys_fullqwerty)) {
			if (this.mode === INPUT_MODES.fullqwerty) {
				if (keycode in this.keys_fullqwerty) {
					this.keys_fullqwerty[keycode].value = 0;
					if (keyboard_input.input_capture && keyboard_input.input_can_capture) {
						event.stopPropagation();
						event.preventDefault();
					}
				}
			} else {
				if (keycode in this.keys) {
					this.keys[keycode].value = 0;
					let bf = this.keys[keycode].bound_function;
					if ((bf !== null) && (typeof bf !== 'undefined')) {
						bf(keycode, 'up');
					}
					if (keyboard_input.input_capture && keyboard_input.input_can_capture && this.keys[keycode].prevent) {
						event.stopPropagation();
						event.preventDefault();
					}
				}
			}
		}
	}
}

var keyboard_input = new keyboard_input_t();
