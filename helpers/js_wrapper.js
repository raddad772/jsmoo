"use strict";

const GENEQO = '===';


/* Wrap JavaScript emulators like as_wrapper.js does AS ones. */
// General functions and classes
importScripts(
	'/debugging.js', '/helpers/machine_description.js', '/helpers/thread_consoles.js',
	'/helpers.js', '/helpers/base64codec.js', '/helpers/serialization_service.js');

// m6502 (NES)
importScripts(
	'/component/cpu/m6502/m6502_opcodes.js', '/component/cpu/m6502/m6502.js', '/component/cpu/m6502/nesm6502_generated_opcodes.js'
)

// NES
importScripts(
	'/helpers/IRQ_multiplexer.js',
    '/system/nes/cpu/rp2a03_based_on_ares.js', '/component/controller/nes_joypad.js', '/system/nes/cpu/r2a03.js',
    '/system/nes/nes_bus.js', '/system/nes/nes_cart.js', '/system/nes/nes_clock.js',
    '/system/nes/ppu/nes_ppu.js', '/system/nes/mappers/nomapper.js', '/system/nes/mappers/mmc3b.js',
    '/system/nes/mappers/vrc2b_4e_4f.js', '/system/nes/mappers/mmc1.js', '/system/nes/nes.js',
	'/system/nes/mappers/uxrom.js', '/system/nes/mappers/axrom.js'
)

// Z80 (Spectrum, SMS/GG)
importScripts(
	'/component/cpu/z80/z80_opcodes.js', '/component/cpu/z80/z80_generated_opcodes.js',
	'/component/cpu/z80/z80_disassembler.js', '/component/cpu/z80/z80.js'
)

// SMS/GG
importScripts(
	'/component/controller/sms_joypad.js', '/system/sms_gg/sms_gg.js', '/system/sms_gg/sms_gg_io.js',
	'/system/sms_gg/sms_gg_mapper_sega.js', '/system/sms_gg/sms_gg_vdp.js', '/component/audio/sn76489/sn76489.js'
)

// ZX Spectrum
importScripts(
	'/system/zxspectrum/ula.js', '/system/zxspectrum/tape_deck.js', '/system/zxspectrum/zxspectrum.js'
)

// GameBoy
importScripts(
	'/component/cpu/sm83/sm83_disassembler.js', '/component/cpu/sm83/sm83_opcodes.js',
	'/component/cpu/sm83/sm83.js', '/component/cpu/sm83/sm83_generated_opcodes.js',
	'/system/gb/gb_cart.js', '/system/gb/gb_ppu.js',
	'/system/gb/gb_apu.js', '/system/gb/mappers/mbc_shared.js',
	'/system/gb/mappers/nomapper.js', '/system/gb/mappers/mbc1.js',
	'/system/gb/mappers/mbc2.js', '/system/gb/mappers/mbc3.js',
	'/system/gb/mappers/mbc5.js', '/system/gb/gb_cpu.js',
	'/system/gb/gb.js'
)

// SNES
importScripts(
	'/component/cpu/wdc65816/wdc65816_opcodes.js', '/component/cpu/wdc65816/wdc65816_t.js',
	'/component/cpu/wdc65816/wdc65816_generated_opcodes.js', '/system/snes/cpu/dma.js',
	'/component/controller/snes_joypad.js', '/system/snes/cpu/r5a22.js', '/component/cpu/spc700/spc700_opcodes.js',
	'/component/cpu/spc700/spc700_boot_rom.js', '/component/cpu/spc700/spc700_disassembler.js',
	'/system/snes/apu/sdsp.js', '/component/cpu/spc700/spc700.js',
	'/component/cpu/spc700/spc700_generated_opcodes.js', '/system/snes/snes_memory.js',
	'/system/snes/snes_clock.js', '/system/snes/snes_clock_generator.js',
	'/system/snes/snes_cart.js', '/system/snes/ppu/snes_ppu.js',
	'/system/snes/snes.js', '/system/snes/ppu/ppufast_funcs.js', '/system/snes/ppu/snes_ppu_shader_project.js',
	'/system/snes/ppu/snes_ppu_worker.js'
);

// AssemblyScript cores
importScripts('/helpers/as_wrapper.js')

// SNES multithreading
/*importScripts(
	, '/system/snes/ppu/snes_ppu_worker.js',
)*/

// PS1
importScripts(
	'/component/cpu/r3000/r3000_opcodes.js', '/component/cpu/r3000/r3000_instructions.js',
	'/component/cpu/r3000/r3000.js', '/component/cpu/r3000/r3000_disassembler.js',
	'/component/controller/ps1_dualshock.js', '/system/ps1/ps1_cpu.js', '/system/ps1/gpu/ps1_sw_mt_gpu.js',
	'/system/ps1/ps1_mem.js', '/system/ps1/ps1_gte.js', '/system/ps1/ps1.js'
);

// PS1 AS
importScripts(
	'/system/ps1/as/ps1_helper.js'
)

class js_wrapper_t {
    constructor() {
        /**
         * @type {NES|null}
         */
        this.system = null;
		this.input_buffer = new Int32Array(256);
		this.system_kind = DEFAULT_SYSTEM;

		// JS wraps the AS! yay?
		this.emu_wasm = false;
		this.emu_wasm_helper = null;
		this.emu_wasm_has_helper = false;
		this.as_wrapper = new as_wrapper_t();
		this.tech_specs = null;
		this.out_ptr = 0;
    }

	play() {
		if (!this.emu_wasm)
			this.system.play();
		else
			this.as_wrapper.wasm.gp_play(this.as_wrapper.global_player);

		if (this.emu_wasm_has_helper) {
			this.emu_wasm_helper.play();
		}
	}

	pause() {
		if (!this.emu_wasm)
			this.system.pause();
		else
			this.as_wrapper.wasm.gp_pause(this.as_wrapper.global_player);
		if (this.emu_wasm_has_helper) {
			this.emu_wasm_helper.pause();
		}
	}

	stop() {
		if (!this.emu_wasm)
			this.system.stop();
		else
			this.as_wrapper.wasm.gp_stop(this.as_wrapper.global_player);
		if (this.emu_wasm_has_helper) {
			this.emu_wasm_helper.stop();
		}
	}

	dump_sprites(imgdata, width, height) {
		this.system.dump_sprites(imgdata, width, height);
	}

	dump_RAM(kind, addr) {
		this.system.dump_RAM(kind, addr);
	}

	dump_dbg() {
		if (this.emu_wasm) {
			let d = this.as_wrapper.wasm.gp_dump_debug(this.as_wrapper.global_player)
			if (this.emu_wasm_has_helper)
				this.emu_wasm_helper.dump_debug();
			let a = '';
			for (let i in d) {
				a += d[i];
			}
			return a;
		}
		else {
			return this.system.dump_dbg();
		}
	}

	dump_bg(imgdata, what, width, height) {
		this.system.dump_BG(imgdata, what, width, height);
	}

	ui_event(dest, data) {
		if (this.emu_wasm) {
			if (dest === 'dbg') dest = 1;
			else console.log('UNKNOWN UI EVENT DEST', dest);
			for (let i in data) {
				this.as_wrapper.wasm.gp_ui_event(this.as_wrapper.global_player, dest, i, data[i]);
			}
		}
    }



    update_keymap(keymap) {
		if (this.emu_wasm) {
			let obuf = new Uint32Array(this.as_wrapper.wasm.memory.buffer)
			let startpos = this.as_wrapper.input_buffer_ptr >>> 2;
			for (let i in keymap) {
				obuf[startpos + keymap[i].buf_pos] = keymap[i].value;
			}
		} else {
			for (let i in keymap)
				this.input_buffer[keymap[i].buf_pos] = keymap[i].value;
			this.system.map_inputs(this.input_buffer);
		}
    }

	async do_as_setup() {
		await this.as_wrapper.do_setup();
	}

    set_system(to, bios) {
		if (!this.emu_wasm) {
			if (this.system !== null) {
				this.system.killall();
				delete this.system;
				this.system = null;
			}
		} else {
			console.log('add gp_killall?');
			//this.as_wrapper.wasm.gp_
		}
		if (typeof to !== 'undefined') {
			this.system_kind = to;
		}
		console.log('SETTING SYSTEM', this.system_kind)
		this.emu_wasm = false;
		this.emu_wasm_helper = false;
		switch(this.system_kind) {
			case 'gg':
				this.system = new SMSGG(bios, SMSGG_variants.GG, REGION.NTSC);
				//load_bios('/gg/roms/bios.gg');
				break;
			case 'sms':
				this.system = new SMSGG(bios, SMSGG_variants.SMS2, REGION.NTSC);
				break;
			case 'snes':
				this.system = new SNES();
				break;
			case 'nes':
				this.system = new NES();
				break;
			case 'nes_as':
				this.emu_wasm = true;
            	this.as_wrapper.wasm.gp_set_system(this.as_wrapper.global_player, to);
				break;
			case 'ps1_as':
				this.emu_wasm = true;
				this.emu_wasm_has_helper = true;
				this.as_wrapper.wasm.gp_set_system(this.as_wrapper.global_player, to);
				this.emu_wasm_helper = new PS1_helper(this);
				let uar = new Uint8Array(bios.BIOS);
				this.as_wrapper.copy_to_input_buffer(uar)
				this.as_wrapper.wasm.gp_load_BIOS(this.as_wrapper.global_player, uar.length);
				break;
			case 'gb':
				this.system = new GameBoy(bios, GB_variants.DMG);
				break;
			case 'gbc':
				this.system = new GameBoy(bios, GB_variants.GBC);
				break;
			case 'gb_as':
				this.emu_wasm = true;
				this.as_wrapper.wasm.gp_set_system(this.as_wrapper.global_player, to);
				break;
			case 'ps1':
				this.system = new PS1(bios);
				break;
			case 'spectrum':
				this.system = new ZXSpectrum(bios, ZXSpectrum_variants.s48k);
				break;
			default:
				alert('system not found');
				return;
		}
    }

    load_ROM_from_RAM(name, ROM) {
		if (this.emu_wasm) {
            this.as_wrapper.copy_to_input_buffer(ROM);
            this.as_wrapper.wasm.gp_load_ROM_from_RAM(this.as_wrapper.global_player, name, ROM.byteLength);
		} else {
			this.system.load_ROM_from_RAM(name, ROM);
		}
    }

	step_master(howmany) {
		dbg.do_break = false;
		if (this.emu_wasm) {
			this.as_wrapper.wasm.gp_step_master(this.as_wrapper.global_player, howmany);
			let d = this.as_wrapper.wasm.gp_get_framevars(this.as_wrapper.global_player);
			dbg.dump_from_wasm(d.dbg_info)
			return d;
		}
		else {
			this.system.step_master(howmany);
			return this.system.get_framevars();
		}
	}

    run_frame() {
		if (this.emu_wasm) {
			dbg.do_break = false;
            this.as_wrapper.wasm.gp_run_frame(this.as_wrapper.global_player);
            if (!this.emu_wasm_has_helper) {
				let rd = new Uint32Array(this.as_wrapper.wasm.memory.buffer);
				let to_copy = this.tech_specs.out_size >>> 2;
				let cbuf = new Uint32Array(this.shared_buf1);
				cbuf.set(rd.slice(this.out_ptr >>> 2, (this.out_ptr >>> 2) + to_copy))
				/*for (let i = 0; i < to_copy; i++) {
                    cbuf[i] = rd[i+(this.out_ptr)];
                }*/
				let d = this.as_wrapper.wasm.gp_get_framevars(this.as_wrapper.global_player);
				dbg.dump_from_wasm(d.dbg_info);
				return Object.assign({}, {buffer_num: 0}, d);
			}
			else {
				return Object.assign({}, {buffer_num: 0}, {vram_buffer: this.emu_wasm_helper.vram_buf});
			}
		} else {
			dbg.do_break = false;
			let r = this.system.run_frame();
			return Object.assign({}, r, this.system.get_framevars());
		}
    }

    get_specs() {
		if (this.emu_wasm) {
			this.tech_specs = this.as_wrapper.wasm.gp_get_specs(this.as_wrapper.global_player);
			this.out_ptr = this.tech_specs.out_ptr;
			if (this.emu_wasm_has_helper) {
				this.shared_buf1 = this.emu_wasm_helper.sab;
				this.shared_buf2 = this.emu_wasm_helper.sab;
				this.out_ptr = this.emu_wasm_helper.sab_offset;
			}
			else {
            	this.shared_buf1 = new SharedArrayBuffer(this.tech_specs.out_size*2);
            	this.shared_buf2 = new SharedArrayBuffer(this.tech_specs.out_size*2);
			}
			this.tech_specs.output_buffer = [this.shared_buf1, this.shared_buf2];
		} else {
			this.tech_specs = this.system.get_description();
		}
		return this.tech_specs;
    }
}

//console.log(R3000_disassemble(0x3c080013));