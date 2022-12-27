"use strict";

let after_js = function() {console.log('NO AFTER JS THING');};

const DEFAULT_STEPS = {
	master: 200,
	scanlines: 1,
	frames: 0,
	seconds: 1,
}

/**
 * @type {canvas_manager_t}
 */
let emu_canvas, sprite_canvas, tile_canvas, bg_canvas;

// Things should have 'checkbox' in their name if they are a checkbox
//   and have a default value.
// It goes: programming name: [dom ID, default value] where null is no
//   default value.
let ui_el = {
	//tracing_checkbox: ['tracingbox', null],
	log_hdma_checkbox: ['checkbox', 'loghdma', false],
	tracing_CPU_checkbox: ['checkbox', 'tracingCPU', CPU_DO_TRACING_AT_START],
	tracing_APU_checkbox: ['checkbox', 'tracingAPU', APU_DO_TRACING_AT_START],
	zoom_video_checkbox: ['checkbox','zoom_checkbox', false],
	fps_cap_checkbox: ['checkbox','fps_cap_checkbox', true],
	par_checkbox: ['checkbox','par_checkbox', true],
	overscan_checkbox: ['checkbox','overscan_checkbox', true],
	watching_checkbox: ['checkbox', 'watchpt', null],
	mc_input: ['input', 'masterclocksteps', DEFAULT_STEPS.master],
	scanline_input: ['input', 'scanlinesteps', DEFAULT_STEPS.scanlines],
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
	current_frame: ['output', 'curframe', 0],
	current_scanline: ['output', 'curline', 0],
	current_x: ['output', 'curx', 0],
}



// UI load steps
// 1. init all document elements
// 2. load previous system, ROM data from config
// 3. Pre-load previous system adn ROm
// 4. Set state as not-emulating, indicate to UI that we are ready to emulate


//window.onload = test_pathstuff
window.onload = init_ui;

async function init_fs() {
}

async function load_sel_rom() {
	await load_selected_rom();
}

let default_system_options = {
	'last_rom': ''
}

async function get_ui_system_options() {
	let r = await bfs.read_file('/config/' + ROMKIND + '.json');
	if (r === null)
		return structuredClone(default_system_options);
	return r;
}

async function set_ui_system_options(g) {
	await bfs.write_file('/config/' + ROMKIND + '.json', g);
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

function str2ab(str) {
	let buf = new ArrayBuffer(str.length); // 2 bytes for each char
	let bufView = new Uint8Array(buf);
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

// Top one, going up.
var dconsole = new console_t('disassembly', -1, 358, false, false);
// Bottom one, going down.
var tconsole = new console_t('textconsole', 1, 20, true, true);
// Memory dump console
var mconsole = new console_t('memdumpconsole', 1, 30, false, false);


async function load_selected_rom() {
	//if (!global_player.ready) {
	//	return;
	//}
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
	f = str2ab(f);
	//console.log('TELL PLAYER TO LOAD ROM');
	global_player.load_rom(ui_el.rom_select.value, f);
}

async function reload_roms(where) {
	console.log('reloading ROMs for', where)
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

let ROMKIND = DEFAULT_SYSTEM;
function romkind_sub(what) {
	if (what.indexOf('_as') !== -1) {
		what = what.replace('_as', '');
	}
	if (what.indexOf('gbc') !== -1) {
		what = what.replace('gbc', 'gb');
	}
	return what;

}

ROMKIND = romkind_sub(ROMKIND);



async function system_selected(where) {
	ui_el.system_select.value = where;
	ROMKIND = romkind_sub(where);
	await reload_roms(ROMKIND);
}

function click_enable_tracing() {
	dbg.enable_tracing();
}

function click_disable_tracing() {
	dbg.disable_tracing();
}

function click_step_scanlines() {
	let scanlines = parseInt(ui_el.scanline_input.value);
	if (scanlines > (200 * 20)) {
		console.log('SCANLINE STEP START');
	}

	global_player.step_scanlines(scanlines);

	if (scanlines > (200 * 20)) {
		console.log('SCANLINE STEP END')
	}
}

function click_step_clock() {
	let steps = parseInt(ui_el.mc_input.value);
	if (steps > 100000) console.log('STEP START');
	global_player.step_master(steps);
	if (steps > 100000) console.log('STEP FINISH');
}

function click_step_seconds() {
	/*let seconds = parseInt(ui_el.seconds_input.value);
	if (seconds > 5) console.log('SECONDS STEP START');
	global_player.step_seconds(seconds);

	if (seconds > 5) console.log('SECONDS STEP DONE');*/
	//console.log('Dumping CPU!', global_player.system.cpu.cpu);
	global_player.system.pprint_palette();

}

function click_dump_dbg() {
	global_player.dump_dbg();
}

function click_bg_dump(which) {
	console.log(which);
	global_player.dump_bg(bg_canvas, which)
}

function click_tile_dump() {
	global_player.dump_tiles(tile_canvas)
}

function click_sprite_dump() {
	global_player.dump_sprites(sprite_canvas);
}

function click_render_scr() {
	switch(global_player.system_kind) {
		case 'gg':
			console.log('HELLO?');
			global_player.system.vdp.dump_palette();
			break;
		case 'snes':
			let old_scanline = global_player.system.clock.scanline.ppu_y;
			for (let y = 1; y < 240; y++) {
				global_player.system.clock.scanline.ppu_y = y;
				global_player.system.ppu.render_scanline(true)
			}
			global_player.system.clock.scanline.ppu_y = old_scanline;
			break;
	}
	//global_player.system.ppu.present();
}

function get_addr_from_dump_box() {
	return parseInt(ui_el.memaddr_input.value, 16);
}

function click_dump_ram() {
	let iaddr = get_addr_from_dump_box();
	let MDUMP_COLS = 16;
	let NUM_BYTES = 256;
	global_player.dump_RAM(iaddr, NUM_BYTES);
	return;
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
				case 'gbc':
				case 'gb':
					rd = hex2(global_player.system.bus.mapper.CPU_read(baddr, 0, false));
					break;
			}
			ln += rd + ' ';
		}
		mconsole.addl(ln);
		console.log(ln);
	}
	mconsole.draw();
}

function click_save_state() {
	global_player.save_state(1);
}

function click_load_state() {
	global_player.load_state(1);
}

function click_dump_chrom() {
	let iaddr = get_addr_from_dump_box();
	let MDUMP_COLS = 16;
	let NUM_BYTES = 256;
	for (let addr = iaddr; addr < (iaddr + NUM_BYTES); addr += MDUMP_COLS) {
		let ln = hex6(addr) + ' ';
		for (let baddr = addr; baddr < (addr + MDUMP_COLS); baddr++) {
			let rd;
			switch(global_player.system_kind) {
				case 'nes':
					rd = hex2(global_player.system.cart.mapper.CHR_ROM[baddr]);
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
	global_player.dump_RAM('VRAM', iaddr);
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
	if (!global_player.playing) {
		if (ui_el.frames_til_pause.value === '') dbg.frames_til_pause = 0;
		else dbg.frames_til_pause = parseInt(ui_el.frames_til_pause.value);
		dbg.do_break = false;
		start_fps_count();
		global_player.play();
	} else {
		global_player.pause();
		stop_fps_count();
	}
}

let animations_called = 0;
function do_fps() {
	let fps = global_player.frame_present - fps_old_frames;
	fps_old_frames = global_player.frame_present;
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

window.addEventListener('keydown', function(ev) {
	//console.log(ev.keyCode, ev.key);
	keyboard_input.keydown(ev.keyCode, ev)
});

window.addEventListener('keyup', function(ev) {
	keyboard_input.keyup(ev.keyCode, ev);
});


async function main() {
	emu_canvas = new canvas_manager_t('emucanvas')
	sprite_canvas = new canvas_manager_t('spritecanvas')
	bg_canvas = new canvas_manager_t('bgcanvas')
	tile_canvas = new canvas_manager_t('tilecanvas')
	global_player.set_canvas_manager(emu_canvas);
	await global_player.onload();
	await keyboard_input.onload();
	await input_config.onload();

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
		global_player.ui_event('startup', v);
	}

	ui_el.log_hdma_checkbox.addEventListener('change', (event) => {
		dbg.log_HDMA = !!event.currentTarget.checked;
	});

	ui_el.watching_checkbox.addEventListener('change', (event) => {
		global_player.ui_event('dbg', {'watch_on': !!event.currentTarget.checked})
		dbg.watch_on = !!event.currentTarget.checked;
	});

	ui_el.brknmirq_checkbox.addEventListener('change', (event) => {
		global_player.ui_event('dbg', {'brk_on_NMIRQ': !!event.currentTarget.checked});
		dbg.brk_on_NMIRQ = !!event.currentTarget.checked;
	});

	ui_el.zoom_video_checkbox.addEventListener('change', (event) => {
		global_player.set_zoom(!!event.currentTarget.checked);
	})

	ui_el.fps_cap_checkbox.addEventListener('change', (event) => {
		global_player.set_fps_cap(!!event.currentTarget.checked);
	})

	ui_el.par_checkbox.addEventListener('change', (event) => {
		global_player.set_PAR(!!event.currentTarget.checked);
	})
	ui_el.overscan_checkbox.addEventListener('change', (event) => {
		global_player.set_overscan(!!event.currentTarget.checked);
	})


	ui_el.tracing_CPU_checkbox.addEventListener('change', (event) => {
		global_player.ui_event('dbg', {'tracingCPU': !!event.currentTarget.checked});
		return;
		if (event.currentTarget.checked) {
			console.log('ENABLE FOR!', global_player.system_kind);
			switch(global_player.system_kind) {
				case 'gbc':
				case 'gb':
					dbg.enable_tracing_for(D_RESOURCE_TYPES.SM83);
					break;
				case 'nes':
					dbg.enable_tracing_for(D_RESOURCE_TYPES.M6502);
					break;
				case 'snes':
					dbg.enable_tracing_for(D_RESOURCE_TYPES.R5A22);
					break;
				case 'genericz80':
					dbg.enable_tracing_for(D_RESOURCE_TYPES.Z80);
					break;
				case 'ps1':
					dbg.enable_tracing_for(D_RESOURCE_TYPES.R3000);
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
				case 'ps1':
					dbg.disable_tracing_for(D_RESOURCE_TYPES.R3000);
					break;
				case 'gbc':
				case 'gb':
					dbg.disable_tracing_for(D_RESOURCE_TYPES.SM83);
					break;
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
		ROMKIND = romkind_sub(ui_el.system_select.value)

		await reload_roms(ROMKIND);
		await load_selected_rom();
	})

	await init_fs();
	input_config = new input_config_t();
	await input_config.load();
	await system_selected(DEFAULT_SYSTEM);
	await after_js();
}

function open_tab_side(tablname, tabgrp, evt, tab_name) {
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
