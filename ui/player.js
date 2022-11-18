'use strict';


const USE_ASSEMBLYSCRIPT = false;
const USE_THREADED_PLAYER = true;
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
//const DEFAULT_SYSTEM = NES_STR;
const DEFAULT_SYSTEM = SMS_STR;
//const DEFAULT_SYSTEM = GB_STR;
//const DEFAULT_SYSTEM = GG_STR;


class input_provider_t {
	constructor(system_kind, keymap) {
		this.system_kind = system_kind;
		console.log('INPUT PROVIDER SYSTEM KIND', system_kind);
		this.keymap = keymap;

		for (let i in this.keymap) {
			this.keymap[i].value = 0;
		}
		switch(this.system_kind) {
			case 'nes':
				this.setup_nes();
				break;
			case 'sms':
				this.setup_sms();
				break;
			case 'gg':
				this.setup_gg();
				break;
			case 'gb':
				this.setup_gb();
				break;
			case 'spectrum':
				this.setup_spectrum();
				break;
			default:
				this.poll = function(){};
				this.latch = function(){};
				console.log('NO INPUT FOR', this.system_kind);
				break;
		}
	}

	disconnect() {
		switch(this.system_kind) {
			case 'sms':
				this.disconnect_sms();
				break;
			case 'gg':
				this.disconnect_gg();
				break;
			case 'gb':
				this.disconnect_gb();
				break;
			case 'nes':
				this.disconnect_nes();
				break;
			case 'spectrum':
				this.disconnect_spectrum();
				break;
		}
	}

	disconnect_spectrum() {
		input_config.emu_kb_input.disconnect();
	}

	latch_spectrum() {
		for (let i in this.keymap) {
			this.keymap[i].value = input_config.emu_kb_input.get_state(this.keymap[i].name);
		}
	}

	poll_spectrum() {
		return this.keymap;
	}

	setup_spectrum() {
		/*for (let i in SPECTRUM_KEYS) {
			this.keymap[SPECTRUM_KEYS[i]].value = 0;
		}*/
		input_config.emu_kb_input.connect(KBKINDS.spectrum48);
		this.latch = this.latch_spectrum.bind(this);
		this.poll = this.poll_spectrum.bind(this);
	}

	latch_nes() {
		this.input_buffer1 = this.joymap1.latch();
		this.input_buffer2 = this.joymap2.latch();
	}

	poll_nes() {
		for (let i in this.keymap) {
			const km = this.keymap[i];
			let imap;
			switch(km.uber) {
				case 'p1':
					imap = this.input_buffer1;
					break;
				case 'p2':
					imap = this.input_buffer2;
					break;
				default:
					console.log('WHAT!?!?!?');
					break;
			}

			km.value = imap[km.name];
		}
		return this.keymap;
	}

	poll_sms() {
		for (let i in this.keymap) {
			const km = this.keymap[i];
			let imap;
			switch(km.uber) {
				case 'p1':
					imap = this.input_buffer1;
					break;
				case 'p2':
					imap = this.input_buffer2;
					break;
				case 0:
					imap = this.input_buffer1;
					break;
				default:
					console.log('WHAT!?!?!?', uber);
					break;
			}

			km.value = imap[km.name];
		}
		return this.keymap;
	}

	latch_sms() {
		this.input_buffer1 = this.joymap1.latch();
		this.input_buffer2 = this.joymap2.latch();
	}

	disconnect_sms() {
		input_config.disconnect_controller('sms1');
		input_config.disconnect_controller('sms2');
	}

	setup_sms() {
		this.latch = this.latch_sms.bind(this);
		this.poll = this.poll_sms.bind(this);
		input_config.connect_controller('sms1');
		input_config.connect_controller('sms2');
		this.input_buffer1 = {
			'b1': 0,
			'b2': 0,
			'up': 0,
			'down': 0,
			'left': 0,
			'right': 0,
			'start': 0,
		}
		this.input_buffer2 = {
			'b1': 0,
			'b2': 0,
			'up': 0,
			'down': 0,
			'left': 0,
			'right': 0,
		}

		this.joymap1 = input_config.controller_els.sms1;
		this.joymap2 = input_config.controller_els.sms2;
	}

	poll_gg() {
		for (let i in this.keymap)
			this.keymap[i].value = this.input_buffer1[this.keymap[i].name];
		return this.keymap;
	}

	latch_gg() {
		this.input_buffer1 = this.joymap1.latch();
	}

	disconnect_gg() {
		input_config.disconnect_controller('gg');
	}

	setup_gg() {
		this.latch = this.latch_gg.bind(this);
		this.poll = this.poll_gg.bind(this);
		input_config.connect_controller('gg');
		this.input_buffer1 = {
			'b1': 0,
			'b2': 0,
			'up': 0,
			'down': 0,
			'left': 0,
			'right': 0,
			'start': 0,
		}

		this.joymap1 = input_config.controller_els.gg;
	}

	latch_gb() {
		this.input_buffer1 = this.joymap1.latch();
	}

	poll_gb() {
		for (let i in this.keymap) {
			this.keymap[i].value = this.input_buffer1[this.keymap[i].name];
		}
		return this.keymap;
	}

	disconnect_gb() {
		input_config.disconnect_controller('gb');
	}

	setup_gb() {
		this.latch = this.latch_gb.bind(this);
		this.poll = this.poll_gb.bind(this);
		input_config.connect_controller('gb');
		this.input_buffer1 = {
			'a': 0,
			'b': 0,
			'up': 0,
			'down': 0,
			'left': 0,
			'right': 0,
			'select': 0,
			'start': 0,
		}
		this.joymap1 = input_config.controller_els.gb;
	}

	disconnect_nes() {
		input_config.disconnect_controller('nes1');
		input_config.disconnect_controller('nes2');
	}

	setup_nes() {
		this.latch = this.latch_nes.bind(this);
		this.poll = this.poll_nes.bind(this);
		input_config.connect_controller('nes1');
		input_config.connect_controller('nes2');
		this.input_buffer1 = {
			'a': 0,
			'b': 0,
			'up': 0,
			'down': 0,
			'left': 0,
			'right': 0,
			'start': 0,
			'select': 0
		}
		this.input_buffer2 = {
			'a': 0,
			'b': 0,
			'up': 0,
			'down': 0,
			'left': 0,
			'right': 0,
			'start': 0,
			'select': 0
		}

		this.joymap1 = input_config.controller_els.nes1;
		this.joymap2 = input_config.controller_els.nes2;
	}

	poll() {
	}
}

class global_player_t {
	constructor() {
		this.system_kind = DEFAULT_SYSTEM;
		this.playing = false;
		this.system = null;
		this.timing_thread = new timing_thread_t(this.on_timing_message.bind(this));
		if (USE_THREADED_PLAYER) {
			this.player_thread = new threaded_emulator_t(this.on_player_message.bind(this));
			this.shared_output_buffers = [null, null];
		}
		this.ready = false;
		/**
		 * @type {machine_description}
		 */
		this.tech_specs = new machine_description();
		this.queued_save_state = -1;
		this.queued_load_state = -1;
		this.frame_present = 0;

		/**
		 * @type {input_provider_t|null}
		 */
		this.input_provider = null;


		/**
		 * @type {bios_manager_t}
		 */
		this.bios_manager = null;

		/**
		 * @type {canvas_manager_t}
		 */
		this.canvas_manager = null;

		this.ss = {};
	}

	async onload() {
		this.bios_manager = new bios_manager_t();
		await this.bios_manager.onload();
		if (USE_THREADED_PLAYER) {
			this.player_thread.onload();
			this.player_thread.send_set_system(this.system_kind, this.bios_manager.bioses[this.system_kind]);
		}
	}

	ui_event(target, data) {
		if (USE_THREADED_PLAYER) {
			this.player_thread.send_ui_event({target: target, data: data});
		}
	}

	save_state(num) {
		this.queued_save_state = num;
		if (!this.playing)
			this.do_save_state();
	}

	load_state(num) {
		this.queued_load_state = num;
		if (!this.playing)
			this.do_load_state();
	}

	set_fps_target(to) {
		to = parseInt(to);
		this.timing_thread.set_fps_target(to);
	}

	update_status() {
		if (this.system === null) return;
		if (!USE_THREADED_PLAYER) {
			this.system.update_status(ui_el.current_frame, ui_el.current_scanline, ui_el.current_x);
		}
	}

	after_break(whodidit) {
		switch(this.system_kind) {
			case 'gb':
				this.system.cycles_left = 0;
				break;
			case 'nes':
				this.system.cycles_left = 0;
				break;
			case 'snes':
				let overflow = this.system.clock.cpu_deficit;
				console.log('BREAK AT PPU Y', this.system.clock.scanline.ppu_y);
				this.system.clock.cpu_deficit = 0;
				if (whodidit === D_RESOURCE_TYPES.SPC700) {
					this.system.ppu.catch_up();
				} else {
					this.system.apu.catch_up();
					this.system.ppu.catch_up();
				}
				console.log('AFTER BREAK deficits', this.system.clock.cpu_deficit, this.system.clock.apu_deficit, this.system.clock.ppu_deficit)
				break;
			case 'spectrum':
				break;
			case 'genericz80':
				break;
			case 'gg':
			case 'sms':
				break;
		}
	}

	pause() {
		this.playing = false;
		this.timing_thread.pause();
		ui_el.system_select.disabled = false;
		ui_el.play_button.innerHTML = "Play";
		input_config.emu_input.between_frames();
	}

	play() {
		this.playing = true;
		this.timing_thread.play();
		ui_el.system_select.disabled = true;
		ui_el.play_button.innerHTML = "Pause";
	}

    step_master(howmany) {
        dbg.do_break = false;
        if (USE_THREADED_PLAYER) {
			this.ui_event('button_click', {'id': 'master_step', 'steps': howmany})
		}
		else {
			this.system.step_master(howmany);
        	this.after_step();
		}
        //this.system.present();
    }

    step_scanlines(howmany) {
        dbg.do_break = false;
        this.system.step_scanlines(howmany);
        this.system.present();
        this.after_step();
    }

    step_seconds(howmany) {
        let frames = this.tech_specs.fps * howmany;
        this.system.enable_display(false);
        for (let i = 0; i < frames; i++) {
            this.system.run_frame();
            if (dbg.do_break) break;
        }
        this.system.enable_display(true);
        this.system.present();
		this.after_step();
    }

    after_step() {
        this.system.catch_up();
        this.update_status();
        if (dbg.tracing) {
            dbg.traces.draw(dconsole);
        }
        if (WDC_LOG_DMAs) {
		    dbg.console_DMA_logs();
	    }
    }

	do_save_state() {
		if (this.queued_save_state === -1) return;
		if (USE_THREADED_PLAYER) {
			this.player_thread.send_save_state_request();
		}
		else {
			this.ss = this.system.serialize();
			console.log(this.ss);
		}
		this.queued_save_state = -1;
	}

	do_load_state() {
		if (this.queued_load_state === -1) return;
		if (USE_THREADED_PLAYER) {
			this.player_thread.send_load_state(this.ss);
		}
		else {
			this.system.deserialize(this.ss);
		}
		this.queued_load_state = -1;
	}

	on_player_message(e) {
		switch(e.kind) {
			case emulator_messages.specs:
				this.tech_specs = e.specs;
				this.update_tech_specs();
				break;
			case emulator_messages.frame_complete:
				this.present(e.data);
				break;
			case emulator_messages.mstep_complete:
				this.mstep_complete(e.data);
				break;
			case emulator_messages.savestate_return:
				this.ss = e.ss;
				break;
		}
	}

	mstep_complete(data) {
		this.update_framevars(data)
	}

	update_tech_specs() {
		this.canvas_manager.set_size(this.tech_specs.x_resolution, this.tech_specs.y_resolution, this.tech_specs.xrh, this.tech_specs.xrw);
		this.canvas_manager.set_overscan(this.tech_specs.overscan_left, this.tech_specs.overscan_right, this.tech_specs.overscan_top, this.tech_specs.overscan_bottom);
		this.shared_output_buffers[0] = this.tech_specs.output_buffer[0];
		this.shared_output_buffers[1] = this.tech_specs.output_buffer[1];
		this.set_fps_target(this.tech_specs.fps);
		this.set_input(this.tech_specs.keymap);
	}

	set_input(keymap) {
		if (this.input_provider !== null) {
			this.input_provider.disconnect();
		}
		this.input_provider = new input_provider_t(this.system_kind, keymap);
	}

	run_frame() {
		if (USE_THREADED_PLAYER) {
			this.input_provider.latch();
			let r = this.input_provider.poll();
			this.player_thread.send_request_frame(r);
		}
		else {
			let t = performance.now();
			this.system.run_frame();
			let span = performance.now() - t;
			//console.log('FRAMETIME', span.toFixed(2));
		}
	}

	present(data) {
		this.frame_present++;
		if (USE_THREADED_PLAYER) {
			this.timing_thread.frame_done();
			if (USE_ASSEMBLYSCRIPT) {
				this.player_thread.present(this.canvas_manager)
			}
			else {
				this.present_system(data);
				this.update_framevars(data);
			}
		}
		else this.system.present()
	}

	update_framevars(data) {
		// curframe, curline, curx
		//		this.system.update_status(ui_el.current_frame, ui_el.current_scanline, ui_el.current_x);
		ui_el.current_frame.innerHTML = data.master_frame;
        ui_el.current_scanline.innerHTML = data.scanline;
        ui_el.current_x.innerHTML = data.x;
	}

	present_system(data) {
		switch(this.system_kind) {
			case 'sms':
				this.canvas_manager.set_size(this.tech_specs.x_resolution, data.bottom_rendered_line, this.tech_specs.xrw, this.tech_specs.xrh, 224);
				break;
		}
		let imgdata = this.canvas_manager.get_imgdata();
		let buf = this.shared_output_buffers[data.buffer_num];
		switch(this.system_kind) {
			case 'nes':
				NES_present(data, imgdata.data, buf, this.canvas_manager.correct_overscan, this.tech_specs.overscan_left, this.tech_specs.overscan_right, this.tech_specs.overscan_top, this.tech_specs.overscan_bottom);
				break;
			case 'gg':
				GG_present(data, imgdata.data, buf);
				break;
			case 'sms':
				SMS_present(data, imgdata.data, buf);
				break;
			case 'gb':
				GB_present(data, imgdata.data, buf);
				break;
			case 'spectrum':
				ZXSpectrum_present(data, imgdata.data,buf);
				break;
			default:
				console.log('NO PRESENTATION CODE FOR', this.system_kind);
				break;
		}
		this.canvas_manager.put_imgdata(imgdata);
	}

	on_timing_message(e) {
		switch(e.kind) {
			case timing_messages.frame_request:
				if (this.playing) {
					this.run_frame();
					if (!USE_THREADED_PLAYER)
						this.timing_thread.frame_done();
					if (this.queued_save_state !== -1)
						this.do_save_state();
					if (this.queued_load_state !== -1)
						this.do_load_state();
					//this.system.present();
					if (!USE_THREADED_PLAYER) this.present();
					this.update_status();
					input_config.emu_input.between_frames();
				}
				else {
					this.timing_thread.pause();
					this.timing_thread.frame_done();
					input_config.emu_input.between_frames();
				}
				break;
		}
	}

	set_canvas_manager(to) {
		this.canvas_manager = to;
	}

	set_system(to) {
		if (USE_THREADED_PLAYER) {
			this.system_kind = to;
			this.player_thread.send_set_system(to, this.bios_manager.bioses[this.system_kind])
			return;
		}
		if (!USE_THREADED_PLAYER) {
			if (this.system !== null) {
				this.system.killall();
				delete this.system;
				this.system = null;
			}
		}
		if (to === null) {
			console.log('CANNOT CHANGE SysTEM TO NULL?');
			return;
		}
		if (typeof to !== 'undefined') {
			this.system_kind = to;
		}
		if (!USE_THREADED_PLAYER) {
			switch (this.system_kind) {
				case 'gg':
					this.system = new SMSGG(this.canvas_manager, this.bios_manager.bioses['gg'], SMSGG_variants.GG, REGION.NTSC);
					//load_bios('/gg/roms/bios.gg');
					break;
				case 'gb':
					this.system = new GameBoy(this.canvas_manager, this.bios_manager.bioses['gb'], GB_variants.DMG);
					break;
				case 'sms':
					this.system = new SMSGG(this.canvas_manager, this.bios_manager.bioses['sms'], SMSGG_variants.SMS2, REGION.NTSC);
					break;
				case 'snes':
					this.system = new SNES(this.canvas_manager);
					break;
				case 'nes':
					this.system = new NES(this.canvas_manager);
					break;
				case 'spectrum':
					this.system = new ZXSpectrum(this.canvas_manager, this.bios_manager.bioses['spectrum'], ZXSpectrum_variants.s48k);
					break;
				case 'genericz80':
					this.system = new generic_z80_computer();
					break;
				default:
					alert('system not found');
					return;
			}
			this.tech_specs = this.system.get_description();
		}
		this.ready = true;
	}

	load_rom(name, what) {
		console.log('GOT COMMADN TO LOAD ROM', name, what);
		if (USE_THREADED_PLAYER)
			this.player_thread.send_load_ROM(name, new Uint8Array(what));
		else
			this.system.load_ROM_from_RAM(what);
	}

	load_bios(what) {
		this.system.load_BIOS_from_RAM(what);
	}

	set_zoom(to) {
		if (!to) {
			emu_canvas.set_scale(1);
		}
		else {
			emu_canvas.set_scale(2);
		}
	}

	set_PAR(to) {
		emu_canvas.set_par_correct(to);
	}

	set_overscan(to) {
		emu_canvas.set_overscan_correct(to);
	}
}

const global_player = new global_player_t();
