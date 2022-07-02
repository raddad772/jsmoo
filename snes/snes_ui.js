"use strict";

let after_js = function() {console.log('NO AFTER JS THING');};
window.onload = init_js;

const INITIAL_STEPS = {
	master: 0,
	scanlines: 216,
	frames: 15,
	seconds: 1
}

const DEFAULT_STEPS = {
	master: 12,
	scanlines: 1,
	frames: 0,
	seconds: 0,
}

function generate_js() {
	save_js('w65c816_generated_opcodes.js', '"use strict";\n\nconst decoded_opcodes = Object.freeze(\n' + decode_opcodes() + ');');
}

function generate_js_SPC() {
    save_js('spc700_generated_opcodes.js', '"use strict";\n\nconst SPC_decoded_opcodes = Object.freeze(\n' + SPC_decode_opcodes() + ');');
}

let tracing_checkbox, tracing_5a22_checkbox, tracing_spc700_checkbox;
let mc_input, scanline_input, frame_input, seconds_input;

function get_mc_steps() {
	console.log(mc_input.value());
}

function init_js() {
	tracing_checkbox = document.getElementById('tracingbox');
	tracing_5a22_checkbox = document.getElementById('tracing5a22');
	tracing_spc700_checkbox = document.getElementById('tracingspc700');
	mc_input = document.getElementById('masterclocksteps');
	scanline_input = document.getElementById('scanlinesteps');
	frame_input = document.getElementById('framesteps');
	seconds_input = document.getElementById('secondsteps');

	mc_input.value = DEFAULT_STEPS.master;
	scanline_input.value = DEFAULT_STEPS.scanlines;
	frame_input.value = DEFAULT_STEPS.frames;
	seconds_input.value = DEFAULT_STEPS.seconds;

	tracing_checkbox.addEventListener('change', (event) => {
		if (event.currentTarget.checked) {
			click_enable_tracing();
		}
		else {
			click_disable_tracing();
		}
	});

	tracing_5a22_checkbox.checked = WDC_DO_TRACING_AT_START;
	tracing_spc700_checkbox.checked = SPC_DO_TRACING_AT_START;

	tracing_5a22_checkbox.addEventListener('change', (event) => {
		if (event.currentTarget.checked) {
			dbg.enable_tracing_for(D_RESOURCE_TYPES.R5A22);
		}
		else {
			dbg.disable_tracing_for(D_RESOURCE_TYPES.R5A22);
		}
	})

	tracing_spc700_checkbox.addEventListener('change', (event) => {
		if (event.currentTarget.checked) {
			dbg.enable_tracing_for(D_RESOURCE_TYPES.SPC700);
		}
		else {
			dbg.disable_tracing_for(D_RESOURCE_TYPES.SPC700);
		}
	})

	after_js();
}

function click_enable_tracing() {
	dbg.enable_tracing();
}

function click_disable_tracing() {
	dbg.disable_tracing();
}

function click_step_clock() {
	let steps = parseInt(mc_input.value);
	snes.step(steps, 0, 0, 0);
	after_step();
}

function click_step_all() {
	let scanlines = parseInt(scanline_input.value);
	let frames = parseInt(frame_input.value);
	let seconds = parseInt(seconds_input.value);
	snes.step(0, scanlines. frames, seconds);

	after_step();
}


function after_step() {
	if (dbg.tracing) {
		dbg.traces.draw(dconsole);
	}
}


function click_play() {

}

function click_pause() {

}
