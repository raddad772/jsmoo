// The entry file of the WebAssembly module.
// Basically all exports to JavaScript must go here
export {
    TST_M6502_get,
    TST_M6502_new,
    TST_M6502_set,
    TST_M6502_cycle,
    TST_Z80_get,
    TST_Z80_new,
    TST_Z80_set,
    TST_Z80_cycle
} from "./glue/cpu_tester";

export {
    gp_load_ROM_from_RAM,
    gp_load_BIOS,
    gp_run_frame,
    gp_dump_debug,
    gp_set_system,
    gp_ui_event,
    gp_step_master,
    new_global_player,
    gp_get_specs,
    gp_get_input_buffer,
    gp_get_framevars,
    gp_play, gp_pause, gp_stop, gp_get_mt
} from "./glue/global_player";
