"use strict";

import {GB_bus, GB_clock, GBmappernull} from "./gb";
import {GB_variants} from "./gb_common";
import {GB_mapper} from "./mappers/interface";
import {heapArray} from "../nes/nes_cart";
import {GB_mapper_none} from "./mappers/nomapper";
import {hex2} from "../../helpers/helpers";
import {GB_mapper_MBC1} from "./mappers/mbc1";

const GB_QUICK_BOOT = true;

// number of 16KB banks
const GB_ROMBANKS: Map<u32, u32> = new Map<u32, u32>();
GB_ROMBANKS.set(0, 0);
GB_ROMBANKS.set(1, 4);
GB_ROMBANKS.set(2, 8);
GB_ROMBANKS.set(3, 16);
GB_ROMBANKS.set(4, 32);
GB_ROMBANKS.set(5, 64);
GB_ROMBANKS.set(6, 128);
GB_ROMBANKS.set(7, 256);
GB_ROMBANKS.set(8, 512);
GB_ROMBANKS.set(0x52, 72);
GB_ROMBANKS.set(0x53, 80);
GB_ROMBANKS.set(0x54, 96);

export enum GB_MAPPERS {
    none,
    MBC1,
    MBC2,
    MMM01,
    MBC3,
    MBC5,
    MBC6,
    MBC7,
    POCKET_CAMERA,
    BANDAI_TAMA5,
    HUC3,
    HUC1
}

class GB_cart_header {
    ROM_banks: u32 = 0;
    ROM_size: u32 = 0;
    RAM_size: u32 = 0;
    RAM_banks: u32 = 0;
    RAM_mask: u32 = 0;
    mapper: GB_MAPPERS = GB_MAPPERS.none;
    ram_present: u32 = 0;
    battery_present: u32 = 0;
    timer_present: u32 = 0;
    rumble_present: u32 = 0;
    sensor_present: u32 = 0;
    sgb_functions: u32 = 0;
    gb_compatible: u32 = 0;
    cgb_compatible: u32 = 0;

}

export class GB_cart {
    variant: GB_variants;
    clock: GB_clock;
    bus: GB_bus;

    ROM: StaticArray<u8> = new StaticArray<u8>(0);
    mapper: GB_mapper
    header: GB_cart_header

    constructor(variant: GB_variants, clock: GB_clock, bus: GB_bus) {
        this.variant = variant;
        this.bus = bus;
        this.clock = clock;

        this.header = new GB_cart_header();
        this.mapper = new GBmappernull();
    }

    load_ROM_from_RAM(ibuf: usize, sz: u32): void {
        let inp: heapArray = new heapArray(ibuf, sz);

        // Look for header
        // @ts-ignore
        if ((inp[0x104] !== 0xCE) || (inp[0x105] !== 0xED)) {
            console.log('Did not detect Nintendo header');
            return;
        }

        // @ts-ignore
        this.header.ROM_banks = GB_ROMBANKS.get(inp[0x0148]);
        this.header.ROM_size = (this.header.ROM_banks ? (this.header.ROM_banks * 16384) : 32768);
        this.ROM = new StaticArray<u8>(this.header.ROM_size);

        // @ts-ignore
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
                // @ts-ignore
                console.log('UNKNOWN RAM SIZE ' + inp[0x149].toString())
                break;
        }

        this.header.battery_present = 0;
        this.header.timer_present = 0;
        this.header.rumble_present = 0;
        this.header.sensor_present = 0;
        // @ts-ignore
        let mn: u32 = inp[0x0147];
        this.header.mapper = GB_MAPPERS.none;
        console.log('MAPPER ' + hex2(mn))
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
                console.log('Unrecognized mapper ' + hex2(mn));
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
            // @ts-ignore
            case 0x08: // ROM+RAM
                this.header.ram_present = 1;
                break;
            // @ts-ignore
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

    read_ROM(inp: heapArray): void {
		//this.ROM.set(inp.slice(0, this.header.ROM_size));
        for (let i: u32 = 0, k: u32 = this.header.ROM_size; i < k; i++) {
            // @ts-ignore
            this.ROM[i] = inp[i];
        }
    }

    setup_mapper(): void {
        switch(this.header.mapper) {
            case GB_MAPPERS.none:
                console.log('TRYING TO DO NONE!');
                this.mapper = new GB_mapper_none(this.clock, this.bus);
                break;
            case GB_MAPPERS.MBC1:
                this.mapper = new GB_mapper_MBC1(this.clock, this.bus);
                break;/*
            case GB_MAPPERS.MBC2:
                this.mapper = new GB_MAPPER_MBC2(this.clock, this.bus);
                break;
            case GB_MAPPERS.MBC3:
                this.mapper = new GB_MAPPER_MBC3(this.clock, this.bus);
                break;
            case GB_MAPPERS.MBC5:
                this.mapper = new GB_MAPPER_MBC5(this.clock, this.bus);
                break;*/
            default:
                console.log('UNSUPPORTED MAPPER SO FAR ' + hex2(this.header.mapper));
                return;
        }
        //this.bus.load_bios(this.bios);
        this.bus.mapper = this.mapper;
        this.mapper.set_cart(this, this.bus.BIOS);
    }
}

