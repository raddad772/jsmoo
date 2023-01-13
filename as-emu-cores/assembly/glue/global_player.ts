import {console_mt_struct, machine_description, systemEmulator} from "../system/interface";
import {NES_VARIANTS} from "../system/nes/nes_common";
import {NES} from "../system/nes/nes";
import {GB_variants} from "../system/gb/gb_common";
import {GameBoy} from "../system/gb/gb";
import {PS1} from "../system/ps1/ps1";
import {dbg, debugger_info_t, EMU_GLOBALS} from "../helpers/debug";
import {bigstr_output} from "../component/cpu/r3000/r3000";

export class framevars_t {
    master_frame: u64 = 0
    x: u32 = 0
    scanline: u32 = 0
    dbg_info: debugger_info_t = new debugger_info_t();
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

    step_master(howmany: i32): void {
        this.system.step_master(<u32>howmany);
    }

    get_mt_struct(): console_mt_struct {
        return this.system.get_mt_struct();
    }

    play(): void {
        dbg.do_break = false;
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

    ui_event(dest: EMU_GLOBALS, what: string, val_bool: boolean): void {
        switch(dest) {
            case EMU_GLOBALS.global_player:
                break;
            case EMU_GLOBALS.debug:
                dbg.ui_event(what, val_bool);
                break;
            default:
                console.log('UNHANDLED UI EVENT ' + what);
                break;
        }
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
        dbg.syskind = ct;
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

    load_BIOS(sz: u32): void {
        this.system.load_BIOS(this.input_buffer, sz);
    }

    load_rom(name: string, sz: u32): void {
        //let r: usize = this.input_buffer;
        this.system.load_ROM(name, this.input_buffer, sz);
    }

    get_framevars(): framevars_t {
        let d = this.system.get_framevars();
        d.dbg_info = dbg.get_dbg_info();
        return d;
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
    //console.log('new_global_player');
    return new global_player_t();
}

export function gp_load_BIOS(player: global_player_t, size: u32): void {
    //console.log('gp_load_BIOS');
    player.load_BIOS(size);
}

export function gp_step_master(player: global_player_t, howmany: i32): void {
    dbg.do_break = false;
    player.step_master(howmany);
}

// yes <i32><u32>0xFFFFFFFF = -1
// yes <i32><i16>-1 = -1
// yes <u32><i32>-1 = 0xFFFFFFFF
// yes <i16><i32>-1 = -1
// yes <i32>0xFFFFFFFF = -1
// yes let a: i32 = 0xFFFFFFFF; = -1
// yes a: u32 = 0xFFFFFFFF; <i32>a < 0
// yes PC + (<u32>(<i16>(opcode & 0xFFFF))*4);
function test_assumptions(): void {
    let a: u32 = <u32>(<i16>0xFFFF);
    let b: u32 = <u32>(<i32>a>>1);
    console.log('!!!!!!!!!!RESULT ' + a.toString(16));
}

export function gp_set_system(player: global_player_t, to: String): void {
    //test_assumptions();
    //console.log('gp_set_system');
    player.ext_set_system(to);
}

export function gp_ui_event(player: global_player_t, dest: u32, what: string, val_bool: boolean): void {
    //console.log('UI EVENT ' + what + ' ' + val_bool.toString());
    player.ui_event(dest, what, val_bool);
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
    //console.log('gp_get_mt');
    return player.get_mt_struct();
}

export function gp_load_ROM_from_RAM(player: global_player_t, name: string, sz: u32): void {
    //console.log('gp_load_ROM_from_RAM');
    player.load_rom(name, sz);
}

export function gp_dump_debug(player: global_player_t): Array<string> {
    return player.system.dump_debug().strings;
}

export function gp_run_frame(player: global_player_t): u32 {
    return player.run_frame();
}

export function gp_get_specs(player: global_player_t): machine_description {
    //console.log('gp_get_specs');
    return player.tech_specs;
}

export function gp_get_input_buffer(player: global_player_t): usize {
    return player.input_buffer;
}

export function gp_get_framevars(player: global_player_t): framevars_t {
    return player.get_framevars();
}