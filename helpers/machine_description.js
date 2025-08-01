"use strict";

const INPUT_TYPES = Object.freeze({
    NES_CONTROLLER: 0,
    SNES_CONTROLLER: 1,
    KEYBOARD: 2,
    SMS_CONTROLLER: 3,
    GB_CONTROLLER: 4,
    PS1_DUALSHOCK: 5
})

const MD_TIMING = {
    frame: 0,
    line: 1,
    timestep: 2
}

const MD_STANDARD = {
    NSTC: 0,
    PAL: 1,
    LCD: 2
}

const SCREENVAR_FIELDS = {
    current_frame: 0,
    current_scanline: 1,
    current_x: 2
}


class md_input_map_keypoint {
    uber = '';
    name = '';
    buf_pos = 0;
    internal_code = 0;
}

// Example machine
class machine_description {
    constructor() {
        this.name = name;
        this.timing = MD_TIMING.frame;
        this.fps = 60
        this.standard = MD_STANDARD.NTSC;
        this.x_resolution = 256;
        this.y_resolution = 224;
        this.xrw = 4
        this.xrh = 3

        this.overscan = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        }

        this.output_buffer = [];
        /**
         * @type {Array<md_input_map_keypoint>}
         */
        this.keymap = [];
        this.input_types = [INPUT_TYPES.SNES_CONTROLLER];
    }
}
