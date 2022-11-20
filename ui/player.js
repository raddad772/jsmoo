'use strict';


//const USE_ASSEMBLYSCRIPT = false;
//const USE_THREADED_PLAYER = true;
const SNES_STR = 'snes';
const NES_STR = 'nes';
const NES_STR = 'nes_as';
const COMMODORE64_STR = 'c64';
const GG_STR = 'gg';
const SMS_STR = 'sms';
const GENESIS_STR = 'megadrive';
const GB_STR = 'gb';
const SPECTRUM_STR = 'spectrum';
const GENERICZ80_STR = 'genericz80'

//const DEFAULT_SYSTEM = SPECTRUM_STR;
//const DEFAULT_SYSTEM = NES_STR;
//const DEFAULT_SYSTEM = SNES_STR;
//const DEFAULT_SYSTEM = SMS_STR;
//const DEFAULT_SYSTEM = GB_STR;
//const DEFAULT_SYSTEM = GG_STR;
const DEFAULT_SYSTEM = NES_AS_STR;


class input_provider_t {
	constructor(system_kind, keymap) {
		this.system_kind = system_kind;
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
		this.audio = new ConsoleAudioContext();
		this.shared_output_buffers = [null, null];
		this.ready = false;

        this.player_thread = new Worker('/helpers/threaded_emulator_worker.js');
        this.player_thread.onmessage = this.on_player_message.bind(this);
        this.player_thread.onerror = function(a, b, c) { console.log('ERR', a, b, c);}

        this.step1_done = false;
        this.step2_done = false;
        this.queued_step_2 = null;
        this.queued_bios = null;
        this.queued_step_3 = null;
        this.queued_name = null;
        this.general_sab = new SharedArrayBuffer(64);



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
        console.log('SEND STARTUP MSG');
		this.step1_done = false;
        this.player_thread.postMessage({kind: emulator_messages.startup, general_sab: this.general_sab});
		this.send_set_system(this.system_kind, this.bios_manager.bioses[this.system_kind]);
	}

	send_set_system(kind, bios) {
		console.log('REQ SEND SET SYSTEM')
        if (!this.step1_done) {
			console.log('QUEUE SET SYSTEM')
            this.queued_step_2 = kind;
            this.queued_bios = bios;
            return;
        }
		console.log('ACTUAL SEND SET SYSTEM');
        this.system_kind = kind;
        this.player_thread.postMessage({kind: emulator_messages.change_system, kind_str: kind, bios: bios});
    }

	/**
     * @param {string} name
     * @param {Uint8Array} ROM
     */
    send_load_ROM(name, ROM) {
		if (!this.step2_done) {
            this.queued_step_3 = ROM;
            this.queued_name = name;
            return;
        }
        this.player_thread.postMessage({kind: emulator_messages.load_rom, name: name, ROM: ROM});
    }

	ui_event(target, data) {
		this.player_thread.postMessage({kind: emulator_messages.ui_event, data: {target: target, data: data}});
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

	pause() {
		this.playing = false;
		this.timing_thread.pause();
		ui_el.system_select.disabled = false;
		ui_el.play_button.innerHTML = "Play";
		input_config.emu_input.between_frames();
	}

	async play() {
		this.playing = true;
		await this.audio.grab_context();
		this.timing_thread.play();
		ui_el.system_select.disabled = true;
		ui_el.play_button.innerHTML = "Pause";
	}

    step_master(howmany) {
		dbg.do_break = false;
		this.ui_event('button_click', {'id': 'master_step', 'steps': howmany})
    }

    step_scanlines(howmany) {
        /*dbg.do_break = false;
        this.system.step_scanlines(howmany);
        this.system.present();
        this.after_step();*/
		debugger;
    }

    step_seconds(howmany) {
        /*let frames = this.tech_specs.fps * howmany;
        this.system.enable_display(false);
        for (let i = 0; i < frames; i++) {
            this.system.run_frame();
            if (dbg.do_break) break;
        }
        this.system.enable_display(true);
        this.system.present();
		this.after_step();*/
		debugger;
    }

	do_save_state() {
		if (this.queued_save_state === -1) return;
        this.player_thread.postMessage({kind: emulator_messages.request_savestate});
	}

	do_load_state() {
		if (this.queued_load_state === -1) return;
        this.player_thread.postMessage({kind: emulator_messages.send_loadstate, ss: this.ss})
		this.queued_load_state = -1;
	}

	on_player_message(e) {
		e = e.data;
		switch(e.kind) {
			case emulator_messages.specs:
				this.tech_specs = e.specs;
				this.update_tech_specs();
				break;
            case emulator_messages.step1_done:
				this.step1_done = true;
                if (this.queued_step_2 !== null) {
                    this.system_kind = this.queued_step_2;
                    this.player_thread.postMessage({kind: emulator_messages.change_system, kind_str: this.queued_step_2, bios: this.queued_bios});
                    this.queued_step_2 = null;
                }
                break;
            case emulator_messages.step2_done:
                this.step2_done = true;
                if (this.queued_step_3 !== null) {
                    this.player_thread.postMessage({kind: emulator_messages.load_rom, name: this.queued_name, ROM: this.queued_step_3});
                    this.queued_step_3 = null;
                    this.queued_name = null;
                }
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
		console.log('SETTING INPUT!');
		if (this.input_provider !== null) {
			this.input_provider.disconnect();
		}
		this.input_provider = new input_provider_t(this.system_kind, keymap);
	}

	run_frame() {
		this.input_provider.latch();
        this.player_thread.postMessage({kind: emulator_messages.frame_requested, keymap: this.input_provider.poll()});
	}

	present(data) {
		this.frame_present++;
		this.timing_thread.frame_done();
		this.present_system(data);
		this.update_framevars(data);
	}

	update_framevars(data) {
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
			case 'nes_as':
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
				ZXSpectrum_present(data, imgdata.data, buf);
				break;
			case 'snes':
				SNES_present(data, imgdata.data, buf);
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
					if (this.queued_save_state !== -1)
						this.do_save_state();
					if (this.queued_load_state !== -1)
						this.do_load_state();
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
		this.system_kind = to;
		this.send_set_system(to, this.bios_manager.bioses[this.system_kind])
	}

	load_rom(name, what) {
		console.log('GOT COMMADN TO LOAD ROM', name, what);
		this.send_load_ROM(name, new Uint8Array(what));
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
