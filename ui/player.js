'use strict';


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
//const DEFAULT_SYSTEM = GG_STR;
const DEFAULT_SYSTEM = NES_STR;
//const DEFAULT_SYSTEM = SMS_STR;
//const DEFAULT_SYSTEM = SMS_STR;

class global_player_t {
	constructor() {
		this.system_kind = DEFAULT_SYSTEM;
		this.playing = false;
		this.system = null;
		this.timing_thread = new timing_thread_t(this.on_timing_message.bind(this));
		this.player_thread = new threaded_emulator_t(this.on_player_message.bind(this));
		this.ready = false;
		this.tech_specs = {};
		this.queued_save_state = -1;
		this.queued_load_state = -1;

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
		this.player_thread.onload();
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
		this.system.update_status(ui_el.current_frame, ui_el.current_scanline, ui_el.current_x);
	}

	after_break(whodidit) {
		switch(this.system_kind) {
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
        this.system.step_master(howmany);
        //this.system.present();
        this.after_step();
    }

    step_scanlines(howmany) {
        dbg.do_break = false;
        this.system.step_scanlines(howmany);
        this.system.present();
        this.after_step();
    }

    step_seconds(howmany) {
        let frames = this.tech_specs.technical.fps * howmany;
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
		this.ss = this.system.serialize();
		console.log(this.ss);
		this.queued_save_state = -1;
	}

	do_load_state() {
		if (this.queued_load_state === -1) return;
		this.system.deserialize(this.ss);
		this.queued_load_state = -1;
	}

	on_player_message(e) {
		console.log('MESSAGE FROM PLAYER THREAD', e);
	}

	run_frame() {
		//this.system.run_frame();
		this.player_thread.send_request_frame();
	}

	present() {
		//this.system.present();
	}

	on_timing_message(e) {
		switch(e.kind) {
			case timing_messages.frame_request:
				if (this.playing) {
					this.run_frame();
					//this.system.run_frame();
					this.timing_thread.frame_done();
					if (this.queued_save_state !== -1)
						this.do_save_state();
					if (this.queued_load_state !== -1)
						this.do_load_state();
					//this.system.present();
					this.present();
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
		this.pause();
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
				this.system = new SMSGG(this.canvas_manager, this.bios_manager.bioses['gg'], SMSGG_variants.GG, REGION.NTSC);
				//load_bios('/gg/roms/bios.gg');
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
		this.set_fps_target(this.tech_specs.technical.fps);
		this.ready = true;
	}

	load_rom(what) {
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
}

const global_player = new global_player_t();
