"use strict";

const GB_INSTANT_OAM = false;
const GB_QUICK_BOOT = true;

// number of 16KB banks
const GB_ROMBANKS = Object.freeze({
    0: 0, // 32kb/no banking
    1: 4, // 64kb/4 banks
    2: 8,
    3: 16,
    4: 32,
    5: 64,
    6: 128,
    7: 256,
    8: 512,
    0x52: 72,
    0x53: 80,
    0x54: 96
})

const GB_MAPPERS = Object.freeze({
    none: 0,
    MBC1: 1,
    MBC2: 2,
    MMM01: 3,
    MBC3: 4,
    MBC5: 5,
    MBC6: 6,
    MBC7: 7,
    POCKET_CAMERA: 8,
    BANDAI_TAMA5: 9,
    HUC3: 10,
    HUC1: 11
})

class GB_cart {
    /**
     * @param {number} variant
     * @param {bios_t} bios
     * @param {GB_bus} bus
     * @param {GB_clock} clock
     */
    constructor(variant, bios, clock, bus) {
        this.ROM = new Uint8Array(0);
        this.variant = variant;
        this.bus = bus;
        this.clock = clock;
        this.bios = bios;

        this.mapper = null;

        this.header = {
            ROM_banks: 0,
            ROM_size: 0,
            RAM_size: 0,
            RAM_banks: 0,
            RAM_mask: 0,
            mapper: 0,
            ram_present: 0,
            battery_present: 0,
            timer_present: 0,
            rumble_present: 0,
            sensor_present: 0,
            sgb_functions: 0,
            gb_compatible: 0,
            cgb_compatible: 0
        }
    }

    load_ROM_from_RAM(what) {
        let inp = new Uint8Array(what);

        // Look for header
        if ((inp[0x104] !== 0xCE) || (inp[0x105] !== 0xED)) {
            console.log('Did not detect Nintendo header');
            return;
        }

        this.header.ROM_banks = GB_ROMBANKS[inp[0x0148]];
        this.header.ROM_size = (this.header.ROM_banks ? (this.header.ROM_banks * 16384) : 32768);
        this.ROM = new Uint8Array(this.header.ROM_size);

        this.clock.cgb_enable = (inp[0x143] === 0x80) || (inp[0x143] === 0xC0);
        console.log('CGB ENABLE?', this.clock.cgb_enable);

        switch(inp[0x149]) {
            case 0:
                this.header.RAM_size = 0;
                this.header.RAM_banks = 0;
                this.header.RAM_mask = 0;
                break;
            case 1:
                this.header.RAM_size = 2048;
                this.header.RAM_mask = 0x7FF;
                this.header.RAM_banks = 0;
                break;
            case 2:
                this.header.RAM_mask = 0x1FFF;
                this.header.RAM_size = 8192;
                this.header.RAM_banks = 0;
                break;
            case 3:
                this.header.RAM_mask = 0x1FFF;
                this.header.RAM_size = 32768;
                this.header.RAM_banks = 4;
                break;
            case 4:
                this.header.RAM_mask = 0x1FFF;
                this.header.RAM_size = 131072;
                this.header.RAM_banks = 16;
                break;
            case 5:
                this.header.RAM_mask = 0x1FFF;
                this.header.RAM_size = 65536;
                this.header.RAM_banks = 8;
                break;
            default:
                console.log('UNKNOWN RAM SIZE', inp[0x149])
                break;
        }
        this.RAM = new Uint8Array(this.header.RAM_size);

        this.header.battery_present = 0;
        this.header.timer_present = 0;
        this.header.rumble_present = 0;
        this.header.sensor_present = 0;
        let mn = inp[0x0147];
        this.header.mapper = GB_MAPPERS.none;
        console.log('MAPPER', hex2(mn))
        switch(mn) {
            case 0:
                this.header.mapper = GB_MAPPERS.none;
                break;
            case 1: // MBC1
            case 2: // MBC1+RAM
            case 3: // MBC1+RAM+BATTERY
                this.header.mapper = GB_MAPPERS.MBC1;
                break;
            case 6: // MBC2+BATTERY
            case 5: // MBC2
                this.header.mapper = GB_MAPPERS.MBC2;
                break;
            case 0x0D:
            case 0x0C:
            case 0x0B: // MMM01
                this.header.mapper = GB_MAPPERS.MMM01;
                break;
            case 0x0F: // MMBC3+TIMER+BATTERY
            case 0x10: // MMBC3+TIMER+RAM+BATTERY
            case 0x11: // MMBC3
            case 0x12: // MMBC3+RAM
            case 0x13: // MMBC3+RAM+BATTERY
                this.header.mapper = GB_MAPPERS.MBC3;
                break;
            case 0x19:
            case 0x1A:
            case 0x1B:
            case 0x1C:
            case 0x1D:
            case 0x1E:
                this.header.mapper = GB_MAPPERS.MBC5;
                break;
            case 0x20:
                this.header.mapper = GB_MAPPERS.MBC6;
                break;
            case 0x22:
                this.header.mapper = GB_MAPPERS.MBC7;
                break;
            case 0xFC:
                this.header.mapper = GB_MAPPERS.POCKET_CAMERA;
                break;
            case 0xFD:
                this.header.mapper = GB_MAPPERS.BANDAI_TAMA5;
                break;
            case 0xFE:
                this.header.mapper = GB_MAPPERS.HUC3;
                break;
            case 0xFF:
                this.header.mapper = GB_MAPPERS.HUC1;
                break;
            default:
                console.log('Unrecognized mapper', mn);
                return;
        }

        switch(mn) {
            case 0x02: // MBC1+RAM
                this.header.ram_present = 1;
                break;
            case 0x03: // MBC1+RAM+BATTERY
                this.header.battery_present = 1;
                this.header.ram_present = 1;
                break;
            case 0x06: // MBC2+BATTERY
                this.header.battery_present = 1;
                break;
            case 0x08: // ROM+RAM
                this.header.ram_present = 1;
                break;
            case 0x09: // ROM+RAM+BATTERY
                this.header.battery_present = 1;
                this.header.ram_present = 1;
                break;
            case 0x0C: // MMM01+RAM
                this.header.ram_present = 1;
                break;
            case 0x0D: // MMM01+RAM+BATTERY
                this.header.battery_present = 1;
                this.header.ram_present = 1;
                break;
            case 0x0F: // MMBC3+TIMER+BATTERY
                this.header.timer_present = 1;
                this.header.battery_present = 1;
                break;
            case 0x10: // MMBC3+TIMER+RAM+BATTERY
                this.header.timer_present = 1;
                this.header.battery_present = 1;
                this.header.ram_present = 1;
                break;
            case 0x12: // MMBC3+RAM
                this.header.ram_present = 1;
                break;
            case 0x13: // MMBC3+RAM+BATTERY
                this.header.ram_present = 1;
                this.header.battery_present = 1;
                break;
            case 0x1A: // +RAM
                this.header.ram_present = 1;
                break;
            case 0x1B: // +RAM+BATTERY
                this.header.ram_present = 1;
                this.header.battery_present = 1;
                break;
            case 0x1C: // +RUMBLE
                this.header.rumble_present = 1;
                break;
            case 0x1D: // +RUMBLE+RAM
                this.header.rumble_present = 1;
                this.header.ram_present = 1;
                break;
            case 0x1E: // +RUMBLE+RAM+BATTERY
                this.header.rumble_present = 1;
                this.header.ram_present = 1;
                this.header.battery_present = 1;
                break;
            case 0x22: // +SENSOR+RUMBLE+RAM+BATTERY
                this.header.rumble_present = 1;
                this.header.ram_present = 1;
                this.header.battery_present = 1;
                this.header.sensor_present = 1;
                break;
            case 0xFF: // +RAM+BATTERY
                this.header.ram_present = 1;
                this.header.battery_present = 1;
                break;
        }
        this.read_ROM(inp);
        this.setup_mapper();
    }

    read_ROM(inp) {
		this.ROM.set(inp.slice(0, this.header.ROM_size));
    }

    setup_mapper() {
        switch(this.header.mapper) {
            case GB_MAPPERS.none:
                this.mapper = new GB_MAPPER_none(this.clock, this.bus);
                break;
            case GB_MAPPERS.MBC1:
                this.mapper = new GB_MAPPER_MBC1(this.clock, this.bus);
                break;
            case GB_MAPPERS.MBC2:
                this.mapper = new GB_MAPPER_MBC2(this.clock, this.bus);
                break;
            case GB_MAPPERS.MBC3:
                this.mapper = new GB_MAPPER_MBC3(this.clock, this.bus);
                break;
            case GB_MAPPERS.MBC5:
                this.mapper = new GB_MAPPER_MBC5(this.clock, this.bus);
                break;
            default:
                console.log('UNSUPPORTED MAPPER SO FAR', this.header.mapper);
                return;
        }
        //this.bus.load_bios(this.bios);
        this.mapper.set_cart(this, this.bus.BIOS);
    }
}

