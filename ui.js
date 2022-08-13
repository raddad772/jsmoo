"use strict";

let after_js = function() {console.log('NO AFTER JS THING');};

const SNES_STR = 'snes';
const NES_STR = 'nes';
const COMMODORE64_STR = 'c64';
const SMS_STR = 'sms';
const GENESIS_STR = 'megadrive';
const GB_STR = 'gb';

const DEFAULT_STEPS = {
	master: 12,
	scanlines: 1,
	frames: 0,
	seconds: 0,
}

// Things should have 'checkbox' in their name if they are a checkbox
//   and have a default value.
// It goes: programming name: [dom ID, default value] where null is no
//   default value.
let ui_el = {
	//tracing_checkbox: ['tracingbox', null],
	log_hdma_checkbox: ['loghdma', false],
	tracing_5a22_checkbox: ['tracing5a22', WDC_DO_TRACING_AT_START],
	tracing_spc700_checkbox: ['tracingspc700', SPC_DO_TRACING_AT_START],
	watching_checkbox: ['watchpt', null],
	mc_input: ['masterclocksteps', DEFAULT_STEPS.master],
	scanline_input: ['scanlinesteps', DEFAULT_STEPS.scanlines],
	frame_input: ['framesteps', DEFAULT_STEPS.frames],
	seconds_input: ['secondsteps', DEFAULT_STEPS.seconds],
	brknmirq_checkbox: ['brknmirq', null],
	memaddr_input: ['memaddr', null],
	ppu_y_output: ['ppu_y_output', null],
	frame_count_output: ['frame_count_output', null],
	bg1on_checkbox: ['bg1on', true],
	bg2on_checkbox: ['bg2on', true],
	bg3on_checkbox: ['bg3on', true],
	bg4on_checkbox: ['bg4on', true],
	objon_checkbox: ['objon', true],
	log_windows_checkbox: ['log_windows', false],
	render_windows_checkbox: ['render_windows', true],
	play_button: ['playbutton', null],
	pause_button: ['pausebutton', null],
	frames_til_pause: ['framestilpause', 0],
	fps: ['fps', 0],
	system_select: ['systemselect', null],
	rom_select: ['romselect', null],
}



// UI load steps
// 1. init all document elements
// 2. load previous system, ROM data from config
// 3. Pre-load previous system adn ROm
// 4. Set state as not-emulating, indicate to UI that we are ready to emulate


function snes_rom_path(rom_name) {
	return basic_fs_join('/snes/roms/', rom_name);
}


//window.onload = test_pathstuff
window.onload = init_js;

class global_player_t {
	constructor() {
		this.system_kind = 'snes';
		this.state = 'paused';
		this.power = false;
		this.romfile = null;
		this.system = null;
		this.jsa = null;
		this.ready = false;
	}

	set_system() {
		if (!this.jsa)
			this.jsa = new js_animator(60, function(){});
		if (this.system !== null) {
			this.system.killall();
			this.system = null;
		}
		switch(this.system_kind) {
			case 'snes':
				this.system = new SNES(this.jsa);
				snes = this.system;
				break;
			default:
				alert('system not found');
				return;
		}
		this.ready = true;
	}

	power_down() {
		click_pause();
	}

	load_rom(what) {
		this.system.load_ROM_from_RAM(what);
	}
}

const global_player = new global_player_t();



function generate_js() {
	save_js('w65c816_generated_opcodes.js', '"use strict";\n\nconst decoded_opcodes = Object.freeze(\n' + decode_opcodes() + ');');
}

function generate_js_SPC() {
    save_js('spc700_generated_opcodes.js', '"use strict";\n\nconst SPC_decoded_opcodes = Object.freeze(\n' + SPC_decode_opcodes() + ');');
}

function get_mc_steps() {
}

var filesys;

async function init_fs() {
	after_js();

}

async function load_sel_rom() {
	load_selected_rom();
}

async function load_selected_rom() {
	if (!global_player.ready) {
		console.log('NOT READY!');
		return;
	}
	global_player.power_down();
	if (ui_el.rom_select.value === '') {
		//alert('No ROM selected');
		return;
	}
	let f = await bfs.read_file(ui_el.rom_select.value);
	if (!f) {
		alert('File not found');
		return null;
	}
	function str2ab(str) {
		let buf = new ArrayBuffer(str.length); // 2 bytes for each char
		let bufView = new Uint8Array(buf);
		for (let i = 0, strLen = str.length; i < strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
		return buf;
	}
	f = str2ab(f);
	global_player.load_rom(f);
}

async function reload_roms(where) {
	let fs = new basic_fs();
	let allfiles = await fs._get_files();
	let outfiles = [];
	for (let i in allfiles) {
		if (allfiles[i].indexOf('/snes/roms/') !== -1) {
			outfiles.push(allfiles[i]);
		}
	}
	let outstr = '';
	for (let i in outfiles) {
		outstr += "<option value='" + outfiles[i] + "'>" + basic_fs_split(outfiles[i]) + "</option>";
	}
	ui_el.rom_select.innerHTML = outstr;
	load_selected_rom();
}

async function system_selected(where) {
	reload_roms(where);
}

function click_enable_tracing() {
	dbg.enable_tracing();
}

function click_disable_tracing() {
	dbg.disable_tracing();
}

function click_step_clock() {
	let steps = parseInt(ui_el.mc_input.value);
	snes.step(steps, 0, 0, 0);
	snes.catch_up();
	after_step();
}

function click_bg_dump(which) {
	let bg;
	switch(which) {
		case 1:
			bg = snes.ppu.io.bg1;
			break;
		case 2:
			bg = snes.ppu.io.bg2;
			break;
		case 3:
			bg = snes.ppu.io.bg3;
			break;
		case 4:
			bg = snes.ppu.io.bg4;
			break;
	}
	//snes.ppu.render_bg1_from_memory(0, 260, bg);
	console.log(hex4(snes.ppu.io.bg3.get_tile(snes.ppu.VRAM, snes.ppu.io, snes.ppu.io.bg3, 10*8, 5*8)))
	snes.ppu.present();
}

function click_sprite_dump() {
	snes.ppu.render_sprites_from_memory(0, 520, false);
	for (let y = 1; y < 224; y++) {
		PPUF_render_objects(snes.ppu, snes.ppu.cachelines.lines[y], y, true);
	}
	snes.ppu.present();
}

function click_render_scr() {
	let old_scanline = snes.clock.scanline.ppu_y;
	for (let y = 1; y < 240; y++) {
		snes.clock.scanline.ppu_y = y;
		snes.ppu.render_scanline(true)
	}
	snes.clock.scanline.ppu_y = old_scanline;
	//snes.ppu.present();
}

let dc = 0;
function click_step_all() {
	/*dconsole.addl(dc, tc.toString() + 'YARRR', null, true);
	tconsole.addl(tc, dc.toString() + 'YOLOOO', null, true);
	tc++;
	dc++;
	dconsole.draw();
	tconsole.draw();
	return;*/
	let scanlines = parseInt(ui_el.scanline_input.value);
	let frames = parseInt(ui_el.frame_input.value);
	let seconds = parseInt(ui_el.seconds_input.value);
	snes.step(0, scanlines, frames, seconds);

	after_step();
}

function after_step() {
	if (dbg.tracing) {
		dbg.traces.draw(dconsole);
		//dbg.traces.clear();
		//scanline_dot_output.innerHTML = Math.floor(snes.clock.scanline.cycles_since_reset / 4);
		//console.log(snes.clock.cycles_since_scanline_start);
		ui_el.ppu_y_output.innerHTML = Math.floor(snes.clock.cycles_since_scanline_start / 4) + ', ' + snes.clock.scanline.ppu_y;
		ui_el.frame_count_output.innerHTML = snes.clock.frames_since_restart;
		//console.log('PPU', snes.ppu.io);
		//console.log('CGRAM', snes.ppu.CRAM);
		//console.log('CPU', snes.cpu.io, snes.cpu.status);
	}
	if (WDC_LOG_DMAs) {
		dbg.console_DMA_logs();
	}
	//ui_el.scanline_input.value = 1;
}

function get_addr_from_dump_box() {
	return parseInt(ui_el.memaddr_input.value, 16);
}

function click_dump_ram() {
	let iaddr = get_addr_from_dump_box();
	let MDUMP_COLS = 16;
	let NUM_BYTES = 256;
	for (let addr = iaddr; addr < (iaddr + NUM_BYTES); addr += MDUMP_COLS) {
		let ln = hex6(addr) + ' ';
		for (let baddr = addr; baddr < (addr + MDUMP_COLS); baddr++) {
			ln += hex2(snes.mem_map.dispatch_read(baddr, 0, false)) + ' ';
		}
		mconsole.addl(ln);
		console.log(ln);
	}
	mconsole.draw();
}

class js_animator {
	constructor(hz, func) {
		this.hz = hz;
		this.callback = func;

		this.running = false;
		this.last_timestamp = 0;
		this.frame_to_cancel = null;
	}

	play() {
		//console.log('RUNNING?', this.running)
		if (this.running) return;
		//console.log('REQEUESTING FRAME');
		this.running = true;
		this.frame_to_cancel = requestAnimationFrame(this.doframe.bind(this));
	}

	doframe(timestamp) {
		//console.log
		if (!this.running) {
			this.frame_to_cancel = null;
			return;
		}
		let elapsed = 0;
		if (this.last_timestamp) elapsed = timestamp - this.last_timestamp;
		animations_called++;
		//console.log(elapsed);
		this.last_timestamp = timestamp;
		this.callback(elapsed);

		this.frame_to_cancel = requestAnimationFrame(this.doframe.bind(this));
	}

	pause() {
		if (!this.running) return;
		this.running = false;
		if (this.frame_to_cancel !== null) {
			cancelAnimationFrame(this.frame_to_cancel);
			this.frame_to_cancel = null;
		}
		this.last_timestamp = 0;
	}
}

var fps_old_frames = 0;
var fps_interval = null;

function click_play() {
	dbg.frames_til_pause = parseInt(ui_el.frames_til_pause.value);
	fps_old_frames = snes.clock.frames_since_restart;
	start_fps_count();
	snes.jsanimator.play();
}

let animations_called = 0;
function do_fps() {
	let fps = snes.clock.frames_since_restart - fps_old_frames;
	fps_old_frames = snes.clock.frames_since_restart;
	//let fps = animations_called - fps_old_frames;
	//fps_old_frames = animations_called;
	ui_el.fps.value = fps;
}

function start_fps_count() {
	if (fps_interval !== null) return;
	fps_interval = setInterval(do_fps,1000);
}

function stop_fps_count() {
	if (fps_interval === null) return;
	clearInterval(fps_interval);
	fps_interval = null;
}

function click_pause() {
	snes.jsanimator.pause();
	stop_fps_count();
}

class keyboard_input_t {
	constructor() {
		this.keys_cared_about = ['a', 's', 'z', 'x', 'tab', 'up', 'down', 'left', 'right', 'q', 'w', 'f'];

		this.keys_cared_about_codes = [];
		this.conversion = {
			'a': 'a',
			's': 's',
			'z': 'z',
			'x': 'x',
			'f': 'f',
			'q': 'q',
			'w': 'w',
			'up': 'ArrowUp',
			'down': 'ArrowDown',
			'left': 'ArrowLeft',
			'right': 'ArrowRight',
			'enter': 'Enter',
			'tab': 'Tab'
		}
		this.conversion_back = {}
		for (let i in this.conversion) {
			this.conversion_back[this.conversion[i]] = i;
		}
		for (let i in this.keys_cared_about) {
			this.keys_cared_about_codes.push(this.conversion[this.keys_cared_about[i]]);
		}

		this.keys = {};
		for (let i in this.keys_cared_about) {
			this.keys[this.keys_cared_about[i]] = false;
		}
	}

	keydown(keycode, event) {
		if (this.keys_cared_about_codes.indexOf(keycode) !== -1) {
			this.keys[this.conversion_back[keycode]] = true;
			event.stopPropagation();
			event.preventDefault();
		}
	}

	keyup(keycode, event) {
		if (this.keys_cared_about_codes.indexOf(keycode) !== -1) {
			this.keys[this.conversion_back[keycode]] = false;
			event.stopPropagation();
			event.preventDefault();
		}
	}
}

var keyboard_input = new keyboard_input_t();

window.addEventListener('keydown', function(ev) {
	keyboard_input.keydown(ev.key, ev)
});

window.addEventListener('keyup', function(ev) {
	keyboard_input.keyup(ev.key, ev);
});


async function main() {
	//let ROM_to_get;
	//ROM_to_get = 'roms/snes-test-roms/PeterLemon/SNES-CPUTest-CPU/ADC/CPUADC.sfc';

	//ROM_to_get = 'roms/snes-test-roms/PeterLemon/SNES-CPUTest-CPU/BIT/CPUBIT.sfc';
	//ROM_to_get = 'roms/blargg/controller_strobebehavior.smc';
	//ROM_to_get = 'roms/commercial/smw.smc';
	//ROM_to_get = 'roms/commercial/metroid.sfc';
	//ROM_to_get = 'roms/commercial/zelda.smc';
	//ROM_to_get = 'roms/commercial/fzero.sfc';
	//ROM_to_get = 'roms/commercial/snestest.sfc';

	//let rtg = await getBinary(local_server_url + ROM_to_get);
	//snes = new SNES(jsa);
	global_player.set_system();
	dbg.add_cpu(D_RESOURCE_TYPES.R5A22, snes.cpu);
	dbg.add_cpu(D_RESOURCE_TYPES.SPC700, snes.apu)
	if (!init_gl()) {
		return;
	}
	await load_selected_rom();

	dbg.init_done();
}

after_js = main;

function init_js() {
	for (let k in ui_el) {
		let v = ui_el[k];
		let dom_id = v[0];
		let default_value = v[1];
		ui_el[k] = document.getElementById(dom_id);
		if (default_value !== null) {
			if (k.indexOf('checkbox') !== -1) {
				ui_el[k].checked = default_value;
			} else {
				ui_el[k].value = default_value;
			}
		}
	}

	/*ui_el.tracing_checkbox.addEventListener('change', (event) => {
		if (event.currentTarget.checked) click_enable_tracing();
		else click_disable_tracing();
	});*/
	ui_el.log_hdma_checkbox.addEventListener('change', (event) => {
		dbg.log_HDMA = !!event.currentTarget.checked;
	});

	ui_el.watching_checkbox.addEventListener('change', (event) => {
		dbg.watch_on = !!event.currentTarget.checked;
	});

	ui_el.brknmirq_checkbox.addEventListener('change', (event) => {
		dbg.brk_on_NMIRQ = !!event.currentTarget.checked;
	});


	ui_el.tracing_5a22_checkbox.addEventListener('change', (event) => {
		if (event.currentTarget.checked) dbg.enable_tracing_for(D_RESOURCE_TYPES.R5A22);
		else dbg.disable_tracing_for(D_RESOURCE_TYPES.R5A22);
	});

	ui_el.tracing_spc700_checkbox.addEventListener('change', (event) => {
		if (event.currentTarget.checked) dbg.enable_tracing_for(D_RESOURCE_TYPES.SPC700);
		else dbg.disable_tracing_for(D_RESOURCE_TYPES.SPC700);
	});

	ui_el.bg1on_checkbox.addEventListener('change', (event) => {
		dbg.bg1_on = !!event.currentTarget.checked;
	})

	ui_el.bg2on_checkbox.addEventListener('change', (event) => {
		dbg.bg2_on = !!event.currentTarget.checked;
	})

	ui_el.bg3on_checkbox.addEventListener('change', (event) => {
		dbg.bg3_on = !!event.currentTarget.checked;
	})

	ui_el.bg4on_checkbox.addEventListener('change', (event) => {
		dbg.bg4_on = !!event.currentTarget.checked;
	})

	ui_el.objon_checkbox.addEventListener('change', (event) => {
		dbg.obj_on = !!event.currentTarget.checked;
	})

	ui_el.log_windows_checkbox.addEventListener('change', (event) => {
		dbg.log_windows = !!event.currentTarget.checked;
	})

	ui_el.render_windows_checkbox.addEventListener('change', (event) => {
		dbg.render_windows = !!event.currentTarget.checked;
	})

	ui_el.system_select.addEventListener('change', (event) => {
		console.log(event);
	})

	system_selected('snes');

	init_fs();
}
