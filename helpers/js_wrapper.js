"use strict";

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
    '/system/nes/cpu/rp2a03.js', '/component/controller/nes_joypad.js', '/system/nes/cpu/r2a03.js',
    '/system/nes/nes_bus.js', '/system/nes/nes_cart.js', '/system/nes/nes_clock.js',
    '/system/nes/ppu/nes_ppu.js', '/system/nes/mappers/nomapper.js', '/system/nes/mappers/mmc3b.js',
    '/system/nes/mappers/vrc2b_4e_4f.js', '/system/nes/mappers/mmc1.js', '/system/nes/nes.js'
)

// Z80 (Spectrum, SMS/GG)
importScripts(
	'/component/cpu/z80/z80_opcodes.js', '/component/cpu/z80/z80_generated_opcodes.js',
	'/component/cpu/z80/z80_disassembler.js', '/component/cpu/z80/z80.js'
)

// SMS/GG
importScripts(
	'/component/controller/sms_joypad.js', '/system/sms_gg/sms_gg.js', '/system/sms_gg/sms_gg_io.js',
	'/system/sms_gg/sms_gg_mapper_sega.js', '/system/sms_gg/sms_gg_vdp.js'
)

// ZX Spectrum
importScripts(
	'/system/zxspectrum/ula.js', '/system/zxspectrum/tape_deck.js', '/system/zxspectrum/zxspectrum.js'
)

// GameBoy
importScripts(
	'/component/cpu/sm83/sm83_disassembler.js', '/component/cpu/sm83/sm83_opcodes.js',
	'/component/cpu/sm83/sm83.js', '/component/cpu/sm83/sm83_generated_opcodes.js',
	'/system/gb/gb_cart.js', '/system/gb/gb_ppu_fifo.js',
	'/system/gb/mappers/nomapper.js', '/system/gb/mappers/mbc1.js',
	'/system/gb/mappers/mbc2.js', '/system/gb/mappers/mbc3.js',
	'/system/gb/mappers/mbc5.js', '/system/gb/gb_cpu.js',
	'/system/gb/gb.js'
)

class js_wrapper_t {
    constructor() {
        /**
         * @type {NES|null}
         */
        this.system = null;
		this.input_buffer = new Int32Array(256);
    }

    update_keymap(keymap) {
		for (let i in keymap)
		{
			this.input_buffer[keymap[i].buf_pos] = keymap[i].value;
		}
		this.system.map_inputs(this.input_buffer);
    }

    set_system(to, bios) {
		if (this.system !== null) {
			this.system.killall();
			delete this.system;
			this.system = null;
		}
		if (typeof to !== 'undefined') {
			this.system_kind = to;
		}
		console.log('SETTING SYSTEM', this.system_kind, bios)
		switch(this.system_kind) {
			case 'gg':
				this.system = new SMSGG(bios, SMSGG_variants.GG, REGION.NTSC);
				//load_bios('/gg/roms/bios.gg');
				break;
			case 'gb':
				this.system = new GameBoy(bios, GB_variants.DMG);
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
			case 'spectrum':
				this.system = new ZXSpectrum(bios, ZXSpectrum_variants.s48k);
				break;
			default:
				alert('system not found');
				return;
		}
    }

    load_ROM_from_RAM(name, ROM) {
        this.system.load_ROM_from_RAM(name, ROM);
    }

	step_master(howmany) {
		dbg.do_break = false;
		this.system.step_master(howmany);
		return this.system.get_framevars();
	}

    run_frame() {
		dbg.do_break = false;
        let r = this.system.run_frame();
		return Object.assign({}, r, this.system.get_framevars());
    }

    get_specs() {
        return this.system.get_description();
    }
}