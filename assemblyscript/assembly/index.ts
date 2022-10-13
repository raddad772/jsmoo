// The entry file of the WebAssembly module.
// Basically all exports for JavaScript must go here
export {
    gp_load_ROM_from_RAM,
    gp_run_frame,
    gp_set_system,
    new_global_player,
    gp_get_specs
} from "./glue/global_player";

