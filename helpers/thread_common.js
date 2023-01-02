"use strict";

const AUDIOWORKER_STATE = Object.freeze({
    wait_for_init: 0,
    paused: 1,
    play: 2
});

class audio_description_t {

}

const SPECTRUM_KEYS = Object.freeze([
    '1', '2', '3', '4', '5', '0', '9', '8', '7', '6', 'q', 'w', 'e', 'r', 't',
    'p', 'o', 'i', 'u', 'y', 'a', 's', 'd', 'f', 'g', 'enter', 'l', 'k', 'j', 'h',
    'caps', 'z', 'x', 'c', 'v', 'space', 'shift', 'm', 'n', 'b'
]);

const GPU_messages = Object.freeze({
    unknown: 0,
    startup: 1,
})

const emulator_messages = Object.freeze({
    unknown: 0,
    // Parent to child
    frame_requested: 1,
    change_system: 2,
    load_rom: 3,
    load_bios: 4,
    reset: 5,
    specs: 6,
    text_transmit: 9,
    startup: 100,

    step1_done: 1001,
    step2_done: 1002,
    step3_done: 1003,

    dbg_break: 1048,

    request_savestate: 500,
    send_loadstate: 502,

    ui_event: 200,
    dump_something: 201,
    return_something: 202,

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

const SNES_STR = 'snes';
const NES_STR = 'nes';
const NES_AS_STR = 'nes_as';
const COMMODORE64_STR = 'c64';
const GG_STR = 'gg';
const SMS_STR = 'sms';
const GENESIS_STR = 'megadrive';
const GB_STR = 'gb';
const GB_AS_STR = 'gb_as';
const GBC_STR = 'gbc';
const SPECTRUM_STR = 'spectrum';
const GENERICZ80_STR = 'genericz80'
const PS1_STR = 'ps1';

//const DEFAULT_SYSTEM = SPECTRUM_STR;
//const DEFAULT_SYSTEM = SNES_STR;
//const DEFAULT_SYSTEM = SMS_STR;
//const DEFAULT_SYSTEM = GB_STR;
//const DEFAULT_SYSTEM = GB_AS_STR;
//const DEFAULT_SYSTEM = GBC_STR;
//const DEFAULT_SYSTEM = GG_STR;
//const DEFAULT_SYSTEM = NES_STR;
//const DEFAULT_SYSTEM = NES_AS_STR;
const DEFAULT_SYSTEM = PS1_STR;


const mutex_unlocked = 0;
const mutex_locked = 1;

// Basic spinlock. Spinning is not a performance issue since this only takes as long as an allocation
function mutex_lock(buf, index) {
    let yo = 0;
    for (;;) {
        yo++;
        if (yo > 500) console.log('WATIING ON LOCK');
        // If we succesfully atomically compare and exchange unlocked for locked, we have the mutex
        if (Atomics.compareExchange(buf, index, mutex_unlocked, mutex_locked) === mutex_unlocked)
            return;
        // Wait for unlocked state to try for locked
        for (;;) {
            if (Atomics.load(buf, index) === mutex_unlocked) break;
        }
    }
}

function mutex_unlock(buf, index) {
    if (Atomics.compareExchange(buf, index, mutex_locked, mutex_unlocked) !== mutex_locked) {
        // This only happens if someone else unlocked our mutex, or we did it more than once...
        throw new Error('Is this the right thing to do here? Mutex in inconsistent state');
    }
}
