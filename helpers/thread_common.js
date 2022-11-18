"use strict";

const SPECTRUM_KEYS = Object.freeze([
    '1', '2', '3', '4', '5', '0', '9', '8', '7', '6', 'q', 'w', 'e', 'r', 't',
    'p', 'o', 'i', 'u', 'y', 'a', 's', 'd', 'f', 'g', 'enter', 'l', 'k', 'j', 'h',
    'caps', 'z', 'x', 'c', 'v', 'space', 'shift', 'm', 'n', 'b'
]);

const emulator_messages = Object.freeze({
    unknown: 0,
    // Parent to child
    frame_requested: 1,
    change_system: 2,
    load_rom: 3,
    load_bios: 4,
    reset: 5,
    specs: 6,
    startup: 100,

    step1_done: 1001,
    step2_done: 1002,
    step3_done: 1003,

    request_savestate: 500,
    send_loadstate: 502,

    ui_event: 200,

    // Child to parent
    frame_complete: 50,
    status_update: 51,
    render_traces: 300,
    mstep_complete: 301,

    savestate_return: 501,
});

const KBKINDS = {
    none: 0,
    spectrum48: 1
}

