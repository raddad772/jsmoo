import {console_mt_struct, machine_description, systemEmulator} from "../system/interface";
import {NES_VARIANTS} from "../system/nes/nes_common";
import {NES} from "../system/nes/nes";
import {GB_variants} from "../system/gb/gb_common";
import {GameBoy} from "../system/gb/gb";
import {PS1} from "../system/ps1/ps1";

export class framevars_t {
    master_frame: u64 = 0
    x: u32 = 0
    scanline: u32 = 0
}

export enum JSMOO_SYSTEMS {
    NONE = 0,
    NES_USA,
    SMS2_USA,
    SPECTRUM48,
    SNES_USA,

    TEST_NESM6502,

    DMG,
    GBC,
    PS1
}

export enum input_types {
    CONTROLLER = 0,
    KEYBOARD
}

export class global_player_t {
    system_kind: JSMOO_SYSTEMS = JSMOO_SYSTEMS.NONE
    playing: bool = false
    system!: systemEmulator
    ready: bool = false;
    tech_specs: machine_description = new machine_description();
    video_output_buffer: usize = heap.alloc(1024*1024*2);
    input_buffer: usize = heap.alloc(1024*1024*6);

    constructor() {
        this.ready = false;
    }

    get_mt_struct(): console_mt_struct {
        return this.system.get_mt_struct();
    }

    play(): void {
        this.system.play();
    }

    pause(): void {
        this.system.pause();
    }

    stop(): void {
        this.system.stop();
    }

    set_system(to: JSMOO_SYSTEMS): void {
        if (this.system_kind == to) {
            this.system.reset();
            return;
        }
        if (this.system_kind !== JSMOO_SYSTEMS.NONE) this.system.killall();

        switch(to) {
            case JSMOO_SYSTEMS.NES_USA:
                this.system = new NES(NES_VARIANTS.NTSCU, this.video_output_buffer);
                break;
            case JSMOO_SYSTEMS.DMG:
                this.system = new GameBoy(GB_variants.DMG, this.video_output_buffer);
                break;
            case JSMOO_SYSTEMS.PS1:
                this.system = new PS1();
                break;
            default:
                console.log('UNIMPLEMENTED SYSTEM');
                return;
        }
        this.tech_specs = this.system.get_description();
        this.tech_specs.out_ptr = this.video_output_buffer;
        this.ready = true;
    }

    ext_set_system(to: String): bool {
        let ct: JSMOO_SYSTEMS = JSMOO_SYSTEMS.NONE;
        if (to == 'nes_as') {
            ct = JSMOO_SYSTEMS.NES_USA;
        }
        if (to === 'gb_as') {
            ct = JSMOO_SYSTEMS.DMG;
        }
        if (to === 'ps1_as') {
            ct = JSMOO_SYSTEMS.PS1;
        }
        switch(ct) {
            case JSMOO_SYSTEMS.NES_USA:
                this.set_system(JSMOO_SYSTEMS.NES_USA);
                return true;
            case JSMOO_SYSTEMS.DMG:
                this.set_system(JSMOO_SYSTEMS.DMG);
                return true;
            case JSMOO_SYSTEMS.PS1:
                this.set_system(JSMOO_SYSTEMS.PS1);
                return true;
            default:
                console.log('UNKNOWN SYSTEM ' + to);
                return false;
        }
    }

    load_rom(name: string, sz: u32): void {
        //let r: usize = this.input_buffer;
        this.system.load_ROM(name, this.input_buffer, sz);
    }

    get_framevars(): framevars_t {
        return this.system.get_framevars();
    }

    run_frame(): u32 {
        if (this.system !== null) {
            this.system.map_inputs(this.input_buffer);
            return this.system.finish_frame();
        }
        return 0;
    }
}

export function new_global_player(): global_player_t {
    return new global_player_t();
}

export function gp_set_system(player: global_player_t, to: String): void {
    player.ext_set_system(to);
}

export function gp_play(player: global_player_t): void {
    player.play();
}

export function gp_pause(player: global_player_t): void {
    player.pause();
}

export function gp_stop(player: global_player_t): void {
    player.stop();
}

export function gp_get_mt(player: global_player_t): console_mt_struct {
    return player.get_mt_struct();
}

export function gp_load_ROM_from_RAM(player: global_player_t, name: string, sz: u32): void {
    player.load_rom(name, sz);
}

export function gp_run_frame(player: global_player_t): u32 {
    return player.run_frame();
}

export function gp_get_specs(player: global_player_t): machine_description {
    return player.tech_specs;
}

export function gp_get_input_buffer(player: global_player_t): usize {
    return player.input_buffer;
}

export function gp_get_framevars(player: global_player_t): framevars_t {
    return player.get_framevars();
}