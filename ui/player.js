'use strict';


const GENEQO = '===';

class input_provider_t {
	constructor(system_kind, keymap) {
		this.system_kind = system_kind;
		this.keymap = keymap;

		for (let i in this.keymap) {
			this.keymap[i].value = 0;
		}
		switch(this.system_kind) {
			case 'nes_as':
			case 'nes':
				this.setup_nes();
				break;
			case 'sms':
				this.setup_sms();
				break;
			case 'gg':
				this.setup_gg();
				break;
			case 'gb_as':
			case 'gbc':
			case 'gb':
				this.setup_gb();
				break;
			case 'ps1':
				this.setup_ps1();
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
			case 'gb_as':
			case 'gbc':
			case 'gb':
				this.disconnect_gb();
				break;
			case 'nes':
				this.disconnect_nes();
				break;
			case 'ps1':
				this.disconnect_ps1();
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

	latch_ps1() {
		this.input_buffer1 = this.joymap1.latch();
		this.input_buffer2 = this.joymap2.latch();
	}

	poll_ps1() {
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

	disconnect_ps1() {
		input_config.disconnect_controller('ps1p1');
		input_config.disconnect_controller('ps1p2');
	}

	setup_ps1() {
		this.latch = this.latch_ps1.bind(this);
		this.poll = this.poll_ps1.bind(this);
		input_config.connect_controller('ps1p1');
		input_config.connect_controller('ps1p2');
		this.input_buffer1 = {
			'circle': 0,
			'square': 0,
			'triangle': 0,
			'x': 0,
			'l': 0,
			'r': 0,
			'up': 0,
			'down': 0,
			'left': 0,
			'right': 0,
			'select': 0,
			'start': 0,
		}
		this.input_buffer2 = {
			'circle': 0,
			'square': 0,
			'triangle': 0,
			'x': 0,
			'l': 0,
			'r': 0,
			'up': 0,
			'down': 0,
			'left': 0,
			'right': 0,
			'select': 0,
			'start': 0,
		}
		this.joymap1 = input_config.controller_els.ps1p1;
		this.joymap2 = input_config.controller_els.ps1p2;
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

function remove_as(w) {
	if (w === 'gb_as') return 'gb';
	if (w === 'gbc_as') return 'gbc';
	if (w === 'nes_as') return 'nes';
	if (w === 'ps1_as') return 'ps1';
	return w;
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

		this.next_soundbuf = null;

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
		this.step1_done = false;
        this.player_thread.postMessage({kind: emulator_messages.startup, general_sab: this.general_sab});
		this.send_set_system(this.system_kind, this.bios_manager.bioses[remove_as(this.system_kind)]);
	}

	send_set_system(kind, bios) {
        if (!this.step1_done) {
            this.queued_step_2 = kind;
            this.queued_bios = bios;
            return;
        }
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
		this.send_play();
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

	send_play() {
		this.player_thread.postMessage({kind: emulator_messages.play})
	}

	send_pause() {
		this.player_thread.postMessage({kind: emulator_messages.pause})
	}

	send_stop() {
		this.player_thread.postMessage({kind: emulator_messages.stop})
	}

	do_lod_state() {
		if (this.queued_load_state === -1) return;
        this.player_thread.postMessage({kind: emulator_messages.send_loadstate, ss: this.ss})
		this.queued_load_state = -1;
	}

	parse_text_transmitted(e) {
		let opt = e.options
		let cmd = e.cmd
		let args = e.args
		let target = opt. elname
		let p;
		switch(target) {
			case 'tconsole':
				p = tconsole;
				break;
			case 'dconsole':
				p = dconsole;
				break;
			default:
				console.log('WHAT TO DO WITH CONSOLE', target);
				return;
		}
		switch(cmd) {
			case 'clear':
				p.clear(args.draw);
				break;
			case 'draw':
				p.draw();
				break;
			case 'addl':
				p.addl(args.order, args.line, args.bgcolor, args.draw);
				break;
		}
	}

	on_player_message(e) {
		e = e.data;
		switch(e.kind) {
			case emulator_messages.return_something:
				save_js('mdebug.txt', e.data);
				break;
			case emulator_messages.dbg_break:
				this.pause();
				break;
			case emulator_messages.text_transmit:
				this.parse_text_transmitted(e.data);
				break;
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
		this.canvas_manager.set_overscan(this.tech_specs.overscan.left, this.tech_specs.overscan.right, this.tech_specs.overscan.top, this.tech_specs.overscan.bottom);
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
		this.input_provider.latch();
        this.player_thread.postMessage({kind: emulator_messages.frame_requested, keymap: this.input_provider.poll()});
	}

	present(data) {
		this.frame_present++;
		this.timing_thread.frame_done();
		this.present_system(data);
		this.update_framevars(data);
		if (typeof data.sound_buffer !== 'undefined')
			this.audio.audio_node.port.postMessage({"type": "samples", "samples": data.sound_buffer});
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
				NES_present(data, imgdata.data, buf, this.canvas_manager.correct_overscan, this.tech_specs.overscan);
				break;
			case 'gg':
				GG_present(data, imgdata.data, buf);
				break;
			case 'sms':
				SMS_present(data, imgdata.data, buf);
				break;
			case 'gbc':
				GBC_present(data, imgdata.data, buf);
				break;
			case 'gb_as':
			case 'gb':
				GB_present(data, imgdata.data, buf);
				break;
			case 'spectrum':
				ZXSpectrum_present(data, imgdata.data, buf);
				break;
			case 'snes':
				SNES_present(data, imgdata.data, buf);
				break;
			case 'ps1':
				PS1_present(data, imgdata.data, buf);
				break;
			case 'ps1_as':
				PS1_present(data, imgdata.data, buf);
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
		this.send_set_system(to, this.bios_manager.bioses[remove_as(this.system_kind)])
	}

	load_rom(name, what) {
		this.send_load_ROM(name, new Uint8Array(what));
	}

	load_bios(what) {
		this.system.load_BIOS_from_RAM(what);
	}

	set_fps_cap(to) {
		this.timing_thread.set_fps_cap(to);
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

	dump_RAM(kind, addr) {
		console.log(kind, addr);
		this.player_thread.postMessage({kind: emulator_messages.dump_something, what: kind, addr: addr});
	}

	dump_dbg() {
		this.player_thread.postMessage({kind: emulator_messages.dump_something, what: 'dbg'})
	}

	dump_bg(canvas, which) {
		canvas.set_size(256, 256, 256, 256);
		this.player_thread.postMessage({kind: emulator_messages.dump_something, what: 'bg' + which, imgdata: canvas.get_imgdata().data.buffer, width: 256, height: 256 }, )
	}

	dump_sprites(canvas) {
		canvas.set_size(200, 200, 200, 200);
		this.player_thread.postMessage({kind: emulator_messages.dump_something, what: 'sprites', imgdata: canvas.get_imgdata().data.buffer, width: 200, height: 200 })
	}
}

const global_player = new global_player_t();
