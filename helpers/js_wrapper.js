"use strict";

/* Wrap JavaScript emulators like as_wrapper.js does AS ones. */
// import NES
importScripts('/debugging.js', '/helpers/machine_description.js', '/helpers/thread_consoles.js', '/helpers.js');

importScripts( '/component/cpu/m6502/m6502_opcodes.js', '/component/cpu/m6502/m6502.js', '/component/cpu/m6502/nesm6502_generated_opcodes.js',
    '/system/nes/cpu/rp2a03.js', '/component/controller/nes_joypad.js', '/system/nes/cpu/r2a03.js',
    '/system/nes/nes_bus.js', '/system/nes/nes_cart.js', '/system/nes/nes_clock.js',
    '/system/nes/ppu/nes_ppu.js', '/system/nes/mappers/nomapper.js', '/system/nes/mappers/mmc3b.js',
    '/system/nes/mappers/vrc2b_4e_4f.js', '/system/nes/mappers/mmc1.js', '/system/nes/nes.js')

class js_wrapper_t {
    constructor() {
        /**
         * @type {NES|null}
         */
        this.system = null;
    }

    update_keymap(keymap) {
        console.log('UPDATE!', keymap);
    }

    /*
        gp_load_ROM_from_RAM,
        gp_run_frame,
        gp_set_system,
        new_global_player,
        gp_get_specs,
        gp_get_input_buffer
     */

    set_system(to) {
		if (this.system !== null) {
			this.system.killall();
			delete this.system;
			this.system = null;
		}
		if (typeof to !== 'undefined') {
			this.system_kind = to;
		}
		console.log('SETTING SYSTEM', this.system_kind)
		switch(this.system_kind) {
			case 'gg':
				this.system = new SMSGG(this.bios_manager.bioses['gg'], SMSGG_variants.GG, REGION.NTSC);
				//load_bios('/gg/roms/bios.gg');
				break;
			case 'gb':
				this.system = new GameBoy(this.bios_manager.bioses['gb'], GB_variants.DMG);
				break;
			case 'sms':
				this.system = new SMSGG(this.bios_manager.bioses['sms'], SMSGG_variants.SMS2, REGION.NTSC);
				break;
			case 'snes':
				this.system = new SNES();
				break;
			case 'nes':
				this.system = new NES();
				break;
			case 'spectrum':
				this.system = new ZXSpectrum(this.bios_manager.bioses['spectrum'], ZXSpectrum_variants.s48k);
				break;
			default:
				alert('system not found');
				return;
		}
		console.log('SET DONE');
    }

    load_ROM_from_RAM(ROM) {
        this.system.load_ROM_from_RAM(ROM);
    }

    run_frame(framebuffer) {
        this.system.run_frame(framebuffer);
    }

    get_specs() {
		console.log("GET DESC");
        return this.system.get_description();
    }
}