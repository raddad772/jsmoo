import {machine_description, systemEmulator} from "../system/interface";
import {NES_VARIANTS} from "../system/nes/nes_common";
import {NES} from "../system/nes/nes";

export enum JSMOO_SYSTEMS {
    NONE = 0,
    NES_USA,
    SMS2_USA,
    SPECTRUM48,
    SNES_USA,

    TEST_NESM6502
}

class bios_manager_t {

}

export class global_player_t {
    system_kind: JSMOO_SYSTEMS = JSMOO_SYSTEMS.NONE
    playing: bool = false
    system!: systemEmulator
    ready: bool = false;
    tech_specs: machine_description = new machine_description();
    bios_manager: bios_manager_t

    constructor() {
        this.bios_manager = new bios_manager_t();
    }

    set_system(to: JSMOO_SYSTEMS): void {
        console.log('GP setting system ' + to.toString());
        if (this.system_kind == to) {
            this.system.reset();
            console.log('SET TO SAME, LEAVING');
            return;
        }
        if (this.system_kind !== JSMOO_SYSTEMS.NONE) this.system.killall();
        switch(to) {
            case JSMOO_SYSTEMS.NES_USA:
                console.log('SETING NES');
                this.system = new NES(NES_VARIANTS.NTSCU);
                break;
            default:
                console.log('UNIMPLEMENTED SYSTEM');
                return;
        }
        this.tech_specs = this.system.get_description();
        this.ready = true;
    }

    ext_set_system(to: String): bool {
        let ct: JSMOO_SYSTEMS = JSMOO_SYSTEMS.NONE;
        if (to == 'nes') {
            ct = JSMOO_SYSTEMS.NES_USA;
        }
        switch(ct) {
            case JSMOO_SYSTEMS.NES_USA:
                this.set_system(JSMOO_SYSTEMS.NES_USA);
                return true;
            default:
                console.log('UNKNOWN SYSTEM ' + to);
                return false;
        }
    }

    load_rom(what: Uint8Array): void {
        this.system.load_ROM(what);
    }

    run_frame(): void {
        if (this.system !== null) this.system.finish_frame();
    }

    present(): void {
        //if (this.system !== null) this.system.present();
    }
}

export function new_global_player(): global_player_t {
    return new global_player_t();
}

export function gp_set_system(player: global_player_t, to: String): void {
    player.ext_set_system(to);
}

export function gp_load_ROM_from_RAM(player: global_player_t, ROM: Uint8Array): void {
    player.load_rom(ROM);
}

export function gp_run_frame(player: global_player_t): void {
    player.run_frame();
}

export function gp_get_specs(player: global_player_t): machine_description {
    return player.tech_specs;
}
