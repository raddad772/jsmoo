import {NES_bus, NES_clock, NES_TIMINGS} from "./nes_common";
import {NES_mapper_none} from "./mappers/mapper_none";
import {NES_MMC3b} from "./mappers/mmc3b";

class NES_cart_header {
    mapper_number: u32 = 0;
    nes_timing: u32 = 0;
    submapper: u32 = 0;
    mirroring: u32 = 0;
    battery_present: u32 = 0;
    trainer_present: u32 = 0;
    four_screen_mode: u32 = 0;
    chr_ram_present: u32 = 0;
    chr_rom_size: u32 = 0;
    prg_rom_size: u32 = 0;
    prg_ram_size: u32 = 0;
    prg_nvram_size: u32 = 0;
    chr_ram_size: u32 = 0;
    chr_nvram_size: u32 = 0;
}

export class NES_cart {
    clock: NES_clock
    bus: NES_bus
    header: NES_cart_header

    valid: bool = false
    PRG_ROM: Uint8Array
    CHR_ROM: Uint8Array
    constructor(clock: NES_clock, bus: NES_bus) {
        this.clock = clock;
        this.bus = bus;
        this.header = new NES_cart_header();
        this.PRG_ROM = new Uint8Array(1);
        this.CHR_ROM = new Uint8Array(1);
    }

    reset(): void {

    }

    load_cart_from_RAM(fil: Uint8Array): bool {
		if ((fil[0] !== 0x4E) || (fil[1] !== 0x45) ||
			(fil[2] !== 0x53) || (fil[3] !== 0x1A)) {
			console.log('Bad iNES header');
			return false;
		}
		let worked: bool = true;
		if ((fil[7] & 12) === 8)
			worked = this.read_ines2_header(fil);
		else
			worked = this.read_ines1_header(fil);
		if (!worked) return false;

		this.read_ROM_RAM(fil, 16 + (this.header.trainer_present ? 512 : 0));
		this.valid = worked = this.setup_mapper();
		return worked;
    }

    setup_mapper(): bool {
        switch(this.header.mapper_number) {
            case 0: // no mapper
                this.bus.mapper = new NES_mapper_none(this.clock, this.bus);
                break;
            case 4:
                this.bus.mapper = new NES_MMC3b(this.clock, this.bus);
                break;
            default:
                console.log('Unknown mapper number dawg! ' + this.header.mapper_number.toString());
                return false;
        }
        this.bus.mapper.set_cart(this);
        return true;
    }

    read_ROM_RAM(inp: Uint8Array, offset: u32): void {
        this.PRG_ROM = new Uint8Array(this.header.prg_rom_size);
        this.CHR_ROM = new Uint8Array(this.header.chr_rom_size);

		this.PRG_ROM.set(inp.slice(offset, offset+this.header.prg_rom_size));
		this.CHR_ROM.set(inp.slice(offset+this.header.prg_rom_size, offset+this.header.prg_rom_size+this.header.chr_rom_size));
		console.log('Read ' + this.PRG_ROM.byteLength.toString() + ' PRG ROM bytes');
		console.log('Read ' + this.CHR_ROM.byteLength.toString() + ' CHR ROM bytes');
    }

    read_ines1_header(fil: Uint8Array): bool {
		console.log('iNES version 1 header found');
		this.header.prg_rom_size = 16384 * fil[4];
		this.header.chr_rom_size = 8192 * fil[5];
		this.header.chr_ram_present = +(this.header.chr_rom_size === 0);
		if (this.header.chr_ram_present) this.header.chr_ram_size = 8192;
		this.header.mirroring = fil[6] & 1;
		this.header.battery_present = (fil[6] & 2) >>> 1;
		this.header.trainer_present = (fil[6] & 4) >>> 2;
		this.header.four_screen_mode = (fil[6] & 8) >>> 3;
		this.header.mapper_number = (fil[6] >>> 4) | (fil[7] & 0xF0);
		console.log('MAPPER ' + this.header.mapper_number.toString());
		this.header.prg_ram_size = fil[8] !== 0 ? fil[8] * 8192 : 8192;
		this.header.nes_timing = (fil[9] & 1) ? NES_TIMINGS.PAL : NES_TIMINGS.NTSC;
		return true;
	}

    read_ines2_header(fil: Uint8Array): bool {
		console.log('iNES version 2 header found');
		let prgrom_msb: u32 = fil[9] & 0x0F;
		let chrrom_msb: u32 = (fil[9] & 0xF0) >>> 4;
		if (prgrom_msb === 0x0F) {
			let E = (fil[4] & 0xFC) >>> 2;
			let M = fil[4] & 0x03;
			this.header.prg_rom_size = (2 ** E) * ((M*2)+1);
		} else {
			this.header.prg_rom_size = ((prgrom_msb << 8) | fil[4]) * 16384;
		}
		console.log('PRGROM found: ' + (this.header.prg_rom_size / 1024).toString() + 'kb');

		if (chrrom_msb === 0x0F) {
			let E = (fil[5] & 0xFC) >>> 2;
			let M = fil[5] & 0x03;
			this.header.chr_rom_size = (2 ** E) * ((M*2)+1);
		} else {
			this.header.chr_rom_size = ((chrrom_msb << 8) | fil[5]) * 8192;
		}
		console.log('CHR ROM found: ' + (this.header.chr_rom_size).toString());

		this.header.mirroring = fil[6] & 1;
		this.header.battery_present = (fil[6] & 2) >>> 1;
		this.header.trainer_present = (fil[6] & 4) >>> 2;
		this.header.four_screen_mode = (fil[6] & 8) >>> 3;
		this.header.mapper_number = (fil[6] >>> 4) | (fil[7] & 0xF0) | ((fil[8] & 0x0F) << 8);
		this.header.submapper = fil[8] >>> 4;

		let prg_shift: u32 = fil[10] & 0x0F;
		let prgnv_shift: u32 = fil[10] >>> 4;
		if (prg_shift !== 0) this.header.prg_ram_size = 64 << prg_shift;
		if (prgnv_shift !== 0) this.header.prg_nvram_size = 64 << prgnv_shift;

		let chr_shift: u32 = fil[11] & 0x0F;
		let chrnv_shift: u32 = fil[11] >>> 4;
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
				console.log('WTF even is this');
				break;
			case 3:
				this.header.nes_timing = NES_TIMINGS.DENDY;
				break;
		}
		return true;
	}

}

