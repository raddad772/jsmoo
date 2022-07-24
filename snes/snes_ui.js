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

let watching_checkbox, tracing_checkbox, tracing_5a22_checkbox, tracing_spc700_checkbox;
let brknmirq_checkbox;
let mc_input, scanline_input, frame_input, seconds_input;
let frame_count_output, ppu_y_output;//, scanline_dot_output;

function get_mc_steps() {
	console.log(mc_input.value());
}

function init_js() {
	tracing_checkbox = document.getElementById('tracingbox');
	tracing_5a22_checkbox = document.getElementById('tracing5a22');
	tracing_spc700_checkbox = document.getElementById('tracingspc700');
	watching_checkbox = document.getElementById('watchpt');
	mc_input = document.getElementById('masterclocksteps');
	scanline_input = document.getElementById('scanlinesteps');
	frame_input = document.getElementById('framesteps');
	seconds_input = document.getElementById('secondsteps');
	brknmirq_checkbox = document.getElementById('brknmirq');

	ppu_y_output = document.getElementById('ppu_y_output')
	frame_count_output = document.getElementById('frame_count_output')
	//scanline_dot_output = document.getElementById('scanline_dot_output')

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

	watching_checkbox.addEventListener('change', (event) => {
		dbg.watch_on = !!event.currentTarget.checked;
	});

	brknmirq_checkbox.addEventListener('change', (event) => {
		dbg.brk_on_NMIRQ = !!event.currentTarget.checked;
	})


	tracing_5a22_checkbox.addEventListener('change', (event) => {
		if (event.currentTarget.checked) {
			dbg.enable_tracing_for(D_RESOURCE_TYPES.R5A22);
		}
		else {
			dbg.disable_tracing_for(D_RESOURCE_TYPES.R5A22);
		}
	})

	tracing_spc700_checkbox.addEventListener('change', (event) => {
		console.log('EVENT!', event);
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
	snes.catch_up();
	after_step();
}

function click_bg1_dump() {
	snes.ppu.render_bg1_from_memory(0, 260, snes.ppu.io.bg1);
	snes.ppu.present();
}

function click_sprite_dump() {
	snes.ppu.render_sprites_from_memory(0, 520, false);
	for (let y = 1; y < 240; y++) {
		snes.ppu.renderObject(y, snes.ppu.io.obj, true);
	}
	snes.ppu.present();
}

function flick_render_scr() {
	let old_scanline = snes.clock.scanline.ppu_y;
	for (let y = 1; y < 240; y++) {
		snes.clock.scanline.ppu_y = y;
		snes.ppu.render_scanline(true)
	}
	snes.clock.scanline.ppu_y = old_scanline;
	snes.ppu.present();
}

let dc = 0;
let tc = 0;
function click_step_all() {
	/*dconsole.addl(dc, tc.toString() + 'YARRR', null, true);
	tconsole.addl(tc, dc.toString() + 'YOLOOO', null, true);
	tc++;
	dc++;
	dconsole.draw();
	tconsole.draw();
	return;*/
	let scanlines = parseInt(scanline_input.value);
	let frames = parseInt(frame_input.value);
	let seconds = parseInt(seconds_input.value);
	snes.step(0, scanlines, frames, seconds);

	after_step();
}

function after_step() {
	if (dbg.tracing) {
		dbg.traces.draw(dconsole);
		//dbg.traces.clear();
		//scanline_dot_output.innerHTML = Math.floor(snes.clock.scanline.cycles_since_reset / 4);
		//console.log(snes.clock.cycles_since_scanline_start);
		ppu_y_output.innerHTML = Math.floor(snes.clock.cycles_since_scanline_start / 4) + ', ' + snes.clock.scanline.ppu_y;
		frame_count_output.innerHTML = snes.clock.frames_since_restart;
		//console.log('PPU', snes.ppu.io);
		//console.log('CGRAM', snes.ppu.CRAM);
		//console.log('CPU', snes.cpu.io, snes.cpu.status);
	}
	if (WDC_LOG_DMAs) {
		dbg.console_DMA_logs();
	}
}


function click_play() {

}

function click_pause() {

}
