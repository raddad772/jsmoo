"use strict";

const INPUT_TYPES = Object.freeze({
    NES_CONTROLLER: 0,
    SNES_CONTROLLER: 1,
    KEYBOARD: 2,
    SMS_CONTROLLER: 3,
    GB_CONTROLLER: 4
})

// Example machine
class machine_description {
    constructor(name) {
        this.name = name;

        this.technical = {
            timing: 'frame',
            fps: 60,
            standard: 'NTSC',
            x_resolution: 256,
            y_resolution: 224,
        }

        this.input_types = [INPUT_TYPES.SNES_CONTROLLER];
    }
}
