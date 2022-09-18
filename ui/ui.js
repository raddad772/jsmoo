"use strict";

let after_js = function() {console.log('NO AFTER JS THING');};


const SNES_STR = 'snes';
const NES_STR = 'nes';
const COMMODORE64_STR = 'c64';
const GG_STR = 'gg';
const SMS_STR = 'sms';
const GENESIS_STR = 'megadrive';
const GB_STR = 'gb';
const SPECTRUM_STR = 'spectrum';
const GENERICZ80_STR = 'genericz80'

//const DEFAULT_SYSTEM = GENERICZ80_STR;
//const DEFAULT_SYSTEM = SPECTRUM_STR;
const DEFAULT_SYSTEM = NES_STR;
//const DEFAULT_SYSTEM = GG_STR;

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
		this.input_can_capture = true;
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
		if (this.system !== null) {
			this.system.killall();
			delete this.system;
			this.system = null;
		}
		if (to === null) {
			this.system_kind = ui_el.system_select.value;
			console.log('SETTING SYSTEM KIND', this.system_kind);
		}
		else if (typeof to !== 'undefined') {
			this.system_kind = to;
		}
		switch(this.system_kind) {
			case 'gg':
				this.system = new SMSGG(SMSGG_variants.GG);
				//load_bios('/gg/roms/bios.gg');
				break;
			case 'sms':
				this.system = new SMSGG(SMSGG_variants.SMS2);
				load_bios('/sms/roms/bios13fx.sms');
				break;
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

	load_bios(what) {
		this.system.load_BIOS_from_RAM(what);
	}
}

const global_player = new global_player_t();

async function init_fs() {
}

async function load_sel_rom() {
	await load_selected_rom();
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

async function load_bios(fn) {
	console.log('GETTING FILE', fn);
	let f = await bfs.read_file(fn);
	if (!f) {
		if (fn === '/sms/roms/bios13fx.sms') {
			alert('Please upload Master System 1.3 BIOS named bios13fx.sms as ROM');
		}
		console.log('BIOS', fn, 'not found!');
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
	global_player.load_bios(f);
}

async function reload_roms(where) {
	console.log('realoding ROMs for', where)
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
					bg = global_player.system.ppu.io.bg1;
					break;
				case 2:
					bg = global_player.system.ppu.io.bg2;
					break;
				case 3:
					bg = global_player.system.ppu.io.bg3;
					break;
				case 4:
					bg = global_player.system.ppu.io.bg4;
					break;
			}
			//global_player.system.ppu.render_bg1_from_memory(0, 260, bg);
			console.log(hex4(global_player.system.ppu.io.bg3.get_tile(global_player.system.ppu.VRAM, global_player.system.ppu.io, global_player.system.ppu.io.bg3, 10*8, 5*8)))
			global_player.system.ppu.present();
			break;
		case 'sms':
		case 'gg':
			global_player.system.vdp.dump_bg();
			break;
		case 'nes':
			console.log('DUMP IT!');
			global_player.system.ppu.render_bgtables_from_memory(0, 260);
			break;
		case 'spectrum':
			global_player.system.ula.dump_bg(0, 370);
			break;
		default:
			console.log('HUH?', global_player.system_kind);
			break;
	}
}

function click_sprite_dump() {
	switch(global_player.system_kind) {
		case 'snes':
			global_player.system.ppu.render_sprites_from_memory(0, 520, false);
			for (let y = 1; y < 224; y++) {
				PPUF_render_objects(global_player.system.ppu, global_player.system.ppu.cachelines.lines[y], y, true);
			}
			break;
		case 'nes':
			global_player.system.ppu.render_sprites_from_memory(0, 520, false);
			console.log('SPRITE, BG ENABLE:', global_player.system.ppu.io.sprite_enable, global_player.system.ppu.io.bg_enable)
			break;
		case 'sms':
		case 'gg':
			global_player.system.vdp.dump_sprites(0, 520);
			console.log('DUMP SPRITES BRO');
			break;
	}
	global_player.system.ppu.present();
}

function click_render_scr() {
	let old_scanline = global_player.system.clock.scanline.ppu_y;
	for (let y = 1; y < 240; y++) {
		global_player.system.clock.scanline.ppu_y = y;
		global_player.system.ppu.render_scanline(true)
	}
	global_player.system.clock.scanline.ppu_y = old_scanline;
	//global_player.system.ppu.present();
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
	global_player.system.step(0, scanlines, frames, seconds);

	after_step();
}

function after_step() {
	if (dbg.tracing) {
		dbg.traces.draw(dconsole);
		//dbg.traces.clear();
		//scanline_dot_output.innerHTML = Math.floor(global_player.system.clock.scanline.cycles_since_reset / 4);
		//console.log(global_player.system.clock.cycles_since_scanline_start);

		//ui_el.ppu_y_output.innerHTML = Math.floor(global_player.system.clock.cycles_since_scanline_start / 4) + ', ' + global_player.system.clock.scanline.ppu_y;
		ui_el.frame_count_output.innerHTML = global_player.system.clock.frames_since_restart;

		//console.log('PPU', global_player.system.ppu.io);
		//console.log('CGRAM', global_player.system.ppu.CRAM);
		//console.log('CPU', global_player.system.cpu.io, global_player.system.cpu.status);
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
					rd = hex2(global_player.system.mem_map.dispatch_read(baddr, 0, false));
					break;
				case 'nes':
					rd = hex2(global_player.system.bus.CPU_read(baddr, 0, false));
					break;
				case 'sms':
				case 'gg':
					rd = hex2(global_player.system.bus.cpu_read(baddr, 0, false));
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
					rd = hex2(global_player.system.mem_map.dispatch_read(baddr, 0, false));
					break;
				case 'nes':
					rd = hex2(global_player.system.bus.PPU_read(baddr, 0, false));
					break;
				case 'gg':
				case 'sms':
					rd = hex2(global_player.system.vdp.VRAM[baddr & 0x3FFF]);
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
	switch(global_player.system_kind) {
		case 'gg':
		case 'sms':
			global_player.system.vdp.pprint_sprites();
			break;
	}
	global_player.pause();
	stop_fps_count();
}

window.addEventListener('keydown', function(ev) {
	//console.log(ev.key);
	keyboard_input.keydown(ev.keyCode, ev)
});

window.addEventListener('keyup', function(ev) {
	keyboard_input.keyup(ev.keyCode, ev);
});


async function main() {
	global_player.set_system(DEFAULT_SYSTEM);
	await load_selected_rom();

	dbg.init_done();
}

after_js = main;
function uie_input_focus() {
	keyboard_input.input_capture = false;
}

function uie_input_blur() {
	keyboard_input.input_capture = true;
}

/**
 * @type {input_config_t}
 */
var input_config;

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
				case 'gg':
				case 'sms':
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
				case 'gg':
				case 'sms':
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

	ui_el.system_select.addEventListener('change', async (event) => {
		console.log('CHANGING SYSTEM...');
		global_player.set_system(ui_el.system_select.value);
		await reload_roms(ui_el.system_select.value);
		await load_selected_rom();
	})

	await init_fs();
	input_config = new input_config_t();
	await input_config.load();
	await system_selected(DEFAULT_SYSTEM);
	after_js();
}

function open_tab(tablname, tabgrp, evt, tab_name) {
	if (tabgrp === 'ui-tab-settings-input') {
		if (input_config.current_tab !== tab_name) {
			input_config.tab_change(tab_name);
			input_config.current_tab = tab_name;
		}
	}
	let els = document.getElementsByClassName(tabgrp);
	for (let i = 0; i < els.length; i++) {
		els[i].style.display = "none";
	}
	let tablinks = document.getElementsByClassName(tablname);
	for (let i = 0; i < els.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" ui-bar-blue-grey", "");
	}
	document.getElementById(tab_name).style.display = "block";
	evt.currentTarget.className += " ui-bar-blue-grey";
	keyboard_input.input_can_capture = (tab_name === 'main_tab_main');
}