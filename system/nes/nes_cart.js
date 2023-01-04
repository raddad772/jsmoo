"use strict";

const NES_DEFAULT_IO_DEVICES = Object.freeze({
	UNPSECIFIED: 0,
	CONTROLLERS: 1,
	FOURSCORE: 2,
	FOUR_PLAYERS_ADAPTER: 3,
	VS_SYSTEM: 4,
	VS_SYSTEM_REVERSED: 5,
	VS_PINBALL: 6,
	VS_ZAPPER: 7,
	ZAPPER: 8,
	TWO_ZAPPERS: 9,
	BANDAI_HYPER_SHOT: 10,
	POWER_PAD_A: 11,
	POWER_PAD_B: 12,
	FAMILY_TRAINER_A: 13,
	FAMILY_TRAINER_B: 14,
	ARKANOID_VAUS_NES: 15,
	ARKANOID_VAUS_FAMICOM: 16,
	TWO_VAUS_FDR: 17,
	KONAMI_HYPER_SHOT: 18,
	COCONUTS_PACHINKO: 19,
	PUNCHING_BAG: 20,
	JISSEN_MAHJONG: 21,
	PARTY_TAP: 22,
	OEKA_KIDS_TABLET: 23,
	SUNSOFT_BARCODE: 24,
	MIRACLE_PIANO: 25,
	WHACK_A_MOLE: 26,
	TOP_RIDER: 27,
	DOUBLE_FISTED: 28, // two controllers at once
	FAMICOM_3D: 29,
	DOREMIKKO_KB: 30,
	ROB_GYRO: 31,
	FDR_NO_KEYBOARD: 32,
	ASCII_TURBO_FILE: 33,
	IGS_STORAGE_BATTLE_BOX: 34,
	FDR_WITH_KEYBOARD: 35,
	DONGDA_PEC586_KEYBOARD: 36,
	BIT_CORP_BIT_79_KEYBOARD: 37,
	SUBOR_KEYBOARD: 38,
	SUBOR_KEYBOARD_M_3x8: 39,
	SUBOR_KEYBOARD_M_24: 40,
	SNES_MOUSE: 41,
	MULTICART: 42,
	SNES_CONTROLLERS: 43,
	RACERMATE: 44,
	UFORCE: 45,
	ROB_STACK: 46,
	CITY_PATROLMAN_GUN: 47,
	SHARP_C1_CASETTE: 48,
	CONTROLLER_SWAPPED: 49,
	EXCALIBUR_SUDOKU: 50,
	ABL_PINBALL: 51,
	GOLDEN_NUGGET_CASINO: 52
})

const SER_NES_cart = ['valid', 'trainer', 'CHR_ROM', 'PRG_ROM', 'header', 'mapper'];
const SER_SUPPORTED_MAPPERS = [0, 1, 4, 23]

class NES_cart {
	/**
	 * @param {NES_clock} clock
	 * @param {NES_bus} bus
	 */
	constructor(clock, bus) {
		this.valid = false;
		this.trainer = [];
		this.CHR_ROM = [];
		this.PRG_ROM = [];
		this.bus = bus;
		this.clock = clock;
		this.header = {
			mapper_number: 0,
			nes_timing: 0,
			submapper: 0,
			mirroring: 0, // 0 = horizontal or mapper-controlled, 1 = vertical
			battery_present: 0, //
			trainer_present: 0, // 512-byte trainer
			four_screen_mode: 0, // this has to do with extra CHR RAM
			chr_ram_present: 0,
			chr_rom_size: 0,
			prg_rom_size: 0,
			prg_ram_size: 0, // How much PRG RAM there is
			prg_nvram_size: 0,
			chr_ram_size: 0,
			chr_nvram_size: 0
		}

		this.mapper = null;
	}

	serialize() {
		let o = {
			version:1,
			mapper_number: this.header.mapper_number
		};
		serialization_helper(o, this, SER_NES_cart);
		return o;
	}

	deserialize(from) {
		if (from.version !== 1) {
			console.log('BAD VERSION NES CART');
			return false;
		}
		if (SER_SUPPORTED_MAPPERS.indexOf(from.mapper_number) === -1) {
			console.log('UNSUPPORTED MAPPER VERSION');
			return false;
		}
		return deserialization_helper(this, from, SER_NES_cart);
	}

	load_cart_from_RAM(inp) {
		let fil = new Uint8Array(inp);
		if ((fil[0] !== 0x4E) || (fil[1] !== 0x45) ||
			(fil[2] !== 0x53) || (fil[3] !== 0x1A)) {
			alert('Bad iNES header');
			return false;
		}
		let worked = true;
		if ((fil[7] & 12) === 8)
			worked = this.read_ines2_header(fil);
		else
			worked = this.read_ines1_header(fil);
		if (!worked) return false;


		this.read_ROM_RAM(fil, 16 + (this.header.trainer_present ? 512 : 0));
		worked = this.setup_mapper();
		return worked;
	}

	// Function to detect mapper type and do its setup. We don't support mappers yet.
	setup_mapper() {
		switch(this.header.mapper_number) {
			case 0: // no mapper
				this.mapper = new NES_mapper_none(this.clock, this.bus);
				break;
			case 1: // MMC1
				this.mapper = new NES_mapper_MMC1(this.clock, this.bus);
				break;
			case 2: // UxROM
				this.mapper = new NES_mapper_UXROM(this.clock, this.bus);
				break;
			case 4: // MMC3
				this.mapper = new NES_mapper_MMC3b(this.clock, this.bus);
				break;
			case 7: // AxROM
				this.mapper = new NES_mapper_AXROM(this.clock, this.bus);
				break;
			case 23: // VRC2c, VRC4e, etc.
				this.mapper = new NES_mapper_VRC2B_4E_4F(this.clock, this.bus);
				this.mapper.is_vrc4 = true;
				break;
			default:
				console.log('Unknown mapper number', this.header.mapper_number);
				break;
		}
		this.mapper.set_cart(this);
		return true;
	}

	/**
	 *
	 * @param {Uint8Array} inp
	 * @param offset
	 */
	read_ROM_RAM(inp, offset) {
		this.PRG_ROM = new Uint8Array(this.header.prg_rom_size);
		this.CHR_ROM = new Uint8Array(this.header.chr_rom_size);

		this.PRG_ROM.set(inp.slice(offset, offset+this.header.prg_rom_size));
		this.CHR_ROM.set(inp.slice(offset+this.header.prg_rom_size, offset+this.header.prg_rom_size+this.header.chr_rom_size));
		console.log('Read', this.PRG_ROM.byteLength, 'PRG ROM bytes');
		console.log('Read', this.CHR_ROM.byteLength, 'CHR ROM bytes');
	}

	read_ines1_header(fil) {
		tconsole.addl(null, 'iNES version 1 header found');
		this.header.prg_rom_size = 16384 * fil[4];
		this.header.chr_rom_size = 8192 * fil[5];
		this.header.chr_ram_present = this.header.chr_rom_size === 0;
		if (this.header.chr_ram_present) this.header.chr_ram_size = 8192;
		this.header.mirroring = fil[6] & 1;
		this.header.battery_present = (fil[6] & 2) >>> 1;
		this.header.trainer_present = (fil[6] & 4) >>> 2;
		this.header.four_screen_mode = (fil[6] & 8) >>> 3;
		this.header.mapper_number = (fil[6] >>> 4) | (fil[7] & 0xF0);
		console.log('MAPPER', this.header.mapper_number);
		this.header.prg_ram_size = fil[8] !== 0 ? fil[8] * 8192 : 8192;
		this.header.nes_timing = (fil[9] & 1) ? NES_TIMINGS.PAL : NES_TIMINGS.NTSC;
		return true;
	}

	read_ines2_header(fil) {
		tconsole.addl(null, 'iNES version 2 header found');
		let prgrom_msb = fil[9] & 0x0F;
		let chrrom_msb = (fil[9] & 0xF0) >>> 4;
		if (prgrom_msb === 0x0F) {
			let E = (fil[4] & 0xFC) >>> 2;
			let M = fil[4] & 0x03;
			this.header.prg_rom_size = (2 ** E) * ((M*2)+1);
		} else {
			this.header.prg_rom_size = ((prgrom_msb << 8) | fil[4]) * 16384;
		}
		tconsole.addl(null, 'PRGROM found: ' + (this.header.prg_rom_size / 1024) + 'kb');

		if (chrrom_msb === 0x0F) {
			let E = (fil[5] & 0xFC) >>> 2;
			let M = fil[5] & 0x03;
			this.header.chr_rom_size = (2 ** E) * ((M*2)+1);
		} else {
			this.header.chr_rom_size = ((chrrom_msb << 8) | fil[5]) * 8192;
		}
		tconsole.addl(null, 'CHR ROM found: ' + (this.header.chr_rom_size));

		this.header.mirroring = fil[6] & 1;
		this.header.battery_present = (fil[6] & 2) >>> 1;
		this.header.trainer_present = (fil[6] & 4) >>> 2;
		this.header.four_screen_mode = (fil[6] & 8) >>> 3;
		this.header.mapper_number = (fil[6] >>> 4) | (fil[7] & 0xF0) | ((fil[8] & 0x0F) << 8);
		this.header.submapper = fil[8] >>> 4;

		let prg_shift = fil[10] & 0x0F;
		let prgnv_shift = fil[10] >>> 4;
		if (prg_shift !== 0) this.header.prg_ram_size = 64 << prg_shift;
		if (prgnv_shift !== 0) this.header.prg_nvram_size = 64 << prgnv_shift;

		let chr_shift = fil[11] & 0x0F;
		let chrnv_shift = fil[11] >>> 4;
		if (chr_shift !== 0) this.header.chr_ram_size = 64 << chr_shift;
		if (chrnv_shift !== 0) this.header.chr_nvram_size = 64 << chrnv_shift;
		switch(fil[12] & 3) {
			case 0:
				this.header.nes_timing = NES_TIMINGS.NTSC;
				break;
			case 1:
				this.header.nes_timing = NES_TIMINGS.PAL;
				break;
			case 2:
				alert('WTF even is this');
				break;
			case 3:
				this.header.nes_timing = NES_TIMINGS.DENDY;
				break;
		}
		return true;
	}
}
