// The entry file of the WebAssembly module.
// Basically all exports to JavaScript must go here
export {
    TST_M6502_get,
    TST_M6502_new,
    TST_M6502_set,
    TST_M6502_cycle
} from "./glue/cpu_tester";

export {
    gp_load_ROM_from_RAM,
    gp_run_frame,
    gp_set_system,
    new_global_player,
    gp_get_specs,
    gp_get_input_buffer,
    gp_get_framevars,
} from "./glue/global_player";