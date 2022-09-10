"use strict";

let after_js = function() {console.log('NO AFTER JS THING');};


const SNES_STR = 'snes';
const NES_STR = 'nes';
const COMMODORE64_STR = 'c64';
const SMS_STR = 'sms';
const GENESIS_STR = 'megadrive';
const GB_STR = 'gb';
const SPECTRUM_STR = 'spectrum';
const GENERICZ80_STR = 'genericz80'

//const DEFAULT_SYSTEM = GENERICZ80_STR;
const DEFAULT_SYSTEM = SPECTRUM_STR;

const DEFAULT_STEPS = {
	master: 50,
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
	log_hdma_checkbox: ['checkbox', 'loghdma', false],
	tracing_CPU_checkbox: ['checkbox', 'tracingCPU', CPU_DO_TRACING_AT_START],
	tracing_APU_checkbox: ['checkbox', 'tracingAPU', APU_DO_TRACING_AT_START],
	watching_checkbox: ['checkbox', 'watchpt', null],
	mc_input: ['input', 'masterclocksteps', DEFAULT_STEPS.master],
	scanline_input: ['input', 'scanlinesteps', DEFAULT_STEPS.scanlines],
	frame_input: ['input', 'framesteps', DEFAULT_STEPS.frames],
	seconds_input: ['input', 'secondsteps', DEFAULT_STEPS.seconds],
	brknmirq_checkbox: ['checkbox', 'brknmirq', null],
	memaddr_input: ['input', 'memaddr', null],
	ppu_y_output: ['output', 'ppu_y_output', null],
	frame_count_output: ['output', 'frame_count_output', null],
	bg1on_checkbox: ['checkbox', 'bg1on', true],
	bg2on_checkbox: ['checkbox', 'bg2on', true],
	bg3on_checkbox: ['checkbox', 'bg3on', true],
	bg4on_checkbox: ['checkbox', 'bg4on', true],
	objon_checkbox: ['checkbox', 'objon', true],
	log_windows_checkbox: ['checkbox', 'log_windows', false],
	render_windows_checkbox: ['checkbox', 'render_windows', true],
	play_button: ['button', 'playbutton', null],
	pause_button: ['button', 'pausebutton', null],
	frames_til_pause: ['input', 'framestilpause', 0],
	fps: ['output', 'fps', 0],
	system_select: ['select', 'systemselect', null],
	rom_select: ['select', 'romselect', null],
}



// UI load steps
// 1. init all document elements
// 2. load previous system, ROM data from config
// 3. Pre-load previous system adn ROm
// 4. Set state as not-emulating, indicate to UI that we are ready to emulate


//window.onload = test_pathstuff
window.onload = init_ui;

class global_player_t {
	constructor() {
		this.system_kind = DEFAULT_SYSTEM;
		this.state = 'paused';
		this.system = null;
		this.timing_thread = new timing_thread_t(this.on_timing_message.bind(this));
		this.ready = false;
		this.tech_specs = {};

		this.input_capture = true;
	}

	set_fps_target(to) {
		to = parseInt(to);
		this.timing_thread.set_fps_target(to);
	}

	pause() {
		this.timing_thread.pause();
		//this.system.ppu.scanline_timer.analyze();
		//this.system.ppu.scanline_timer.reset();
	}

	play() {
		this.timing_thread.play();
		//this.system.cpu.apu.start();
	}

	on_timing_message(e) {
		switch(e.kind) {
			case timing_messages.frame_request:
				this.system.run_frame();
				this.timing_thread.frame_done();
				this.system.present();
				break;
		}
	}

	set_system(to) {
		this.timing_thread.pause();
		///if (this.system_kind === to) {
		//	console.log('Already using that one bro')
		//	return;
		//}
		if (this.system !== null) {
			this.system.killall();
			this.system = null;
		}
		switch(this.system_kind) {
			case 'snes':
				this.system = new SNES();
				break;
			case 'nes':
				this.system = new NES();
				break;
			case 'spectrum':
				this.system = new ZXSpectrum();
				break;
			case 'genericz80':
				this.system = new generic_z80_computer();
				break;
			default:
				alert('system not found');
				return;
		}
		this.tech_specs = this.system.get_description();
		this.set_fps_target(this.tech_specs.technical.fps);
		this.ready = true;
	}

	power_down() {
		//click_pause();
	}

	load_rom(what) {
		this.system.load_ROM_from_RAM(what);
	}
}

const global_player = new global_player_t();

async function init_fs() {
}

async function load_sel_rom() {
	load_selected_rom();
}

let default_system_options = {
	'last_rom': ''
}

async function get_ui_system_options() {
	let r = await bfs.read_file('/config/' + global_player.system_kind + '.json');
	if (r === null)
		return structuredClone(default_system_options);
	return r;
}

async function set_ui_system_options(g) {
	await bfs.write_file('/config/' + global_player.system_kind + '.json', g);
}

async function set_last_system(whichone) {
	let g = await get_ui_system_options();
	g.last_system = whichone;
	await set_ui_system_options(g);
}

async function set_last_rom(whichone) {
	let g = await get_ui_system_options();
	g.last_rom = whichone;
	await set_ui_system_options(g);
}

async function load_selected_rom() {
	if (!global_player.ready) {
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
	await set_last_rom(ui_el.rom_select.value);
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
	console.log('realoding ROMs')
	let fs = new basic_fs();
	let allfiles = await fs._get_files();
	let outfiles = [];
	for (let i in allfiles) {
		if (allfiles[i].indexOf('/' + where + '/roms/') !== -1) {
			outfiles.push(allfiles[i]);
		}
	}
	let outstr = '';
	for (let i in outfiles) {
		outstr += "<option value='" + outfiles[i] + "'>" + basic_fs_split(outfiles[i]) + "</option>";
	}
	ui_el.rom_select.innerHTML = outstr;
	let r = await get_ui_system_options();
	if (r.last_rom !== null && typeof r !== 'undefined') {
		ui_el.rom_select.value = r.last_rom; //basic_fs_split(r.last_rom);
	}
	await load_selected_rom();
}

async function system_selected(where) {
	ui_el.system_select.value = where;
	await reload_roms(where);

}

function click_enable_tracing() {
	dbg.enable_tracing();
}

function click_disable_tracing() {
	dbg.disable_tracing();
}

function click_step_clock() {
	let steps = parseInt(ui_el.mc_input.value);
	if (steps > 100000) console.log('STEP START');
	dbg.do_break = false;
	global_player.system.step_master(steps);
	global_player.system.catch_up();
	if (steps > 100000) console.log('STEP FINISH');
	//console.log('PPU X, Y', global_player.system.ppu.line_cycle, global_player.system.clock.ppu_y)
	//console.log('NMI ENABLED', global_player.system.ppu.io.nmi_enable);
	//global_player.system.ppu.print_current_scroll();

	after_step();
}

function click_bg_dump(which) {
	let bg;
	switch(global_player.system_kind) {
		case 'snes':
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
			break;
		case 'nes':
			console.log('DUMP IT!');
			global_player.system.ppu.render_bgtables_from_memory(0, 260);
			break;
		default:
			console.log('HUH?', global_player.system_kind);
			break;
	}
}

function click_sprite_dump() {
	global_player.system.ppu.render_sprites_from_memory(0, 520, false);
	switch(global_player.system_kind) {
		case 'snes':
			for (let y = 1; y < 224; y++) {
				PPUF_render_objects(snes.ppu, snes.ppu.cachelines.lines[y], y, true);
			}
			break;
		case 'nes':
			console.log('SPRITE, BG ENABLE:', global_player.system.ppu.io.sprite_enable, global_player.system.ppu.io.bg_enable)
			break;
	}
	global_player.system.ppu.present();
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

		//ui_el.ppu_y_output.innerHTML = Math.floor(snes.clock.cycles_since_scanline_start / 4) + ', ' + snes.clock.scanline.ppu_y;
		ui_el.frame_count_output.innerHTML = global_player.system.clock.frames_since_restart;

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
			let rd;
			switch(global_player.system_kind) {
				case 'spectrum':
					rd = hex2(global_player.system.bus.cpu_read(baddr, 0, false));
					break;
				case 'genericz80':
					rd = hex2(global_player.system.RAM[baddr]);
					break;
				case 'snes':
					rd = hex2(snes.mem_map.dispatch_read(baddr, 0, false));
					break;
				case 'nes':
					rd = hex2(global_player.system.bus.CPU_read(baddr, 0, false));
					break;
			}
			ln += rd + ' ';
		}
		mconsole.addl(ln);
		console.log(ln);
	}
	mconsole.draw();
}

function click_dump_vram() {
	let iaddr = get_addr_from_dump_box();
	let MDUMP_COLS = 16;
	let NUM_BYTES = 256;
	for (let addr = iaddr; addr < (iaddr + NUM_BYTES); addr += MDUMP_COLS) {
		let ln = hex6(addr) + ' ';
		for (let baddr = addr; baddr < (addr + MDUMP_COLS); baddr++) {
			let rd;
			switch(global_player.system_kind) {
				case 'snes':
					rd = hex2(snes.mem_map.dispatch_read(baddr, 0, false));
					break;
				case 'nes':
					rd = hex2(global_player.system.bus.PPU_read(baddr, 0, false));
					break;
			}
			ln += rd + ' ';
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
	if (ui_el.frames_til_pause.value === '') dbg.frames_til_pause = 0;
	else dbg.frames_til_pause = parseInt(ui_el.frames_til_pause.value);
	dbg.do_break = false;
	/*fps_old_frames = global_player.system.clock.frames_since_restart;
	start_fps_count();
	global_player.system.jsanimator.play();*/
	start_fps_count();
	global_player.play();
}

let animations_called = 0;
function do_fps() {
	let fps = global_player.system.clock.frames_since_restart - fps_old_frames;
	fps_old_frames = global_player.system.clock.frames_since_restart;
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
	//global_player.system.jsanimator.pause();
	//global_player.system.cart.mapper.pprint();
	global_player.pause();
	stop_fps_count();
}

class keyboard_input_t {
	constructor() {
		this.keys_cared_about = [
			'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f',
			'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm',
			'tab', 'up', 'down', 'left', 'right', 'enter', 'shift', 'alt', 'space'];

		this.keys_cared_about_codes = [];
		this.conversion = {
			'q': 'q',
			'w': 'w',
			'e': 'e',
			'r': 'r',
			't': 't',
			'y': 'y',
			'u': 'u',
			'i': 'i',
			'o': 'o',
			'p': 'p',
			'a': 'a',
			's': 's',
			'd': 'd',
			'f': 'f',
			'g': 'g',
			'h': 'h',
			'j': 'j',
			'k': 'k',
			'z': 'z',
			'x': 'x',
			'v': 'v',
			'b': 'b',
			'n': 'n',
			'm': 'm',
			'space': ' ',
			'shift': 'Shift',
			'up': 'ArrowUp',
			'down': 'ArrowDown',
			'left': 'ArrowLeft',
			'right': 'ArrowRight',
			'enter': 'Enter',
			'alt': 'Alt',
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
			if (global_player.input_capture) {
				event.stopPropagation();
				event.preventDefault();
			}
		}
	}

	keyup(keycode, event) {
		if (this.keys_cared_about_codes.indexOf(keycode) !== -1) {
			this.keys[this.conversion_back[keycode]] = false;
			if (global_player.input_capture) {
				event.stopPropagation();
				event.preventDefault();
			}
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
	console.log('DOIN IT HERE!');
	global_player.set_system(DEFAULT_SYSTEM);
	switch(global_player.system_kind) {
		case 'spectrum':
			//dbg.add_cpu(D_RESOURCE_TYPES.Z80, global_player.system.cpu);
			//console.log('ADDED CPU')
			break;
		case 'snes':
			dbg.add_cpu(D_RESOURCE_TYPES.R5A22, global_player.system.cpu);
			dbg.add_cpu(D_RESOURCE_TYPES.SPC700, global_player.system.apu)
			break;
		case 'nes':
			dbg.add_cpu(D_RESOURCE_TYPES.M6502, global_player.system.cpu);
			break;

	}
	//dbg.add_cpu(D_RESOURCE_TYPES.R5A22, snes.cpu);
	//dbg.add_cpu(D_RESOURCE_TYPES.SPC700, snes.apu)
	if (!init_gl()) {
		return;
	}
	await load_selected_rom();

	dbg.init_done();
}

after_js = main;

function uie_input_focus() {
	global_player.input_capture = false;
}

function uie_input_blur() {
	global_player.input_capture = true;
}

async function init_ui() {
	for (let k in ui_el) {
		let v = ui_el[k];
		let t = v[0];
		let dom_id = v[1];
		let default_value = v[2];
		ui_el[k] = document.getElementById(dom_id);
		switch(t) {
			case 'input':
				if (default_value !== null) ui_el[k].value = default_value;
				ui_el[k].onfocus = uie_input_focus;
				ui_el[k].onblur = uie_input_blur;
				break;
			case 'checkbox':
				if (default_value !== null) ui_el[k].checked = default_value;
				break;
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


	ui_el.tracing_CPU_checkbox.addEventListener('change', (event) => {
		if (event.currentTarget.checked) {
			switch(global_player.system_kind) {
				case 'nes':
					dbg.enable_tracing_for(D_RESOURCE_TYPES.M6502);
					break;
				case 'snes':
					dbg.enable_tracing_for(D_RESOURCE_TYPES.R5A22);
					break;
				case 'genericz80':
					dbg.enable_tracing_for(D_RESOURCE_TYPES.Z80);
					break;
				case 'spectrum':
					dbg.enable_tracing_for(D_RESOURCE_TYPES.Z80);
					break;
			}
		}
		else {
			switch(global_player.system_kind) {
				case 'nes':
					dbg.disable_tracing_for(D_RESOURCE_TYPES.M6502);
					break;
				case 'snes':
					dbg.disable_tracing_for(D_RESOURCE_TYPES.R5A22);
					break;
				case 'genericz80':
					dbg.disable_tracing_for(D_RESOURCE_TYPES.Z80);
					break;
				case 'spectrum':
					dbg.disable_tracing_for(D_RESOURCE_TYPES.Z80);
					break;
			}
		}
	});

	ui_el.tracing_APU_checkbox.addEventListener('change', (event) => {
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

	await init_fs();
	await system_selected('spectrum');
	after_js();
}
