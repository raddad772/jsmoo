"use strict";

var seed_input, numtests_input;
window.onload = function() {
    seed_input = document.getElementById('seed');
    dconsole = new dct();
    seed_input.value = "apples and oranges";
    numtests_input = document.getElementById('numtests');
    numtests_input.value = '1000';
}

class dct {
    constructor() {
        this.el = document.getElementById('statushere');
    }

    addl(order, what) {
        console.log('LOG:', what);
        this.el.innerHTML = what;
    }
}
var dconsole;

function generate_spc_tests() {
    let seed = seed_input.value;
    if (seed.length < 1) {
        alert('Please use a seed!');
        return;
    }
    let numtests = parseInt(numtests_input.value);
    if (!numtests) {
        alert('Please enter a valid number of tests to generate per opcode');
        return;
    }
    SPC_NUM_TO_GENERATE = numtests;
    generate_SPC700_tests(seed);
}

function set_gentarget(to) {
    GENTARGET = to; // JavaScript
    GENEQO = (GENTARGET === 'as') ? '==' : '===';
}

function generate_wdc65816_js() {
    set_gentarget('js');
	save_js('wdc65816_generated_opcodes.js', '"use strict";\n\nconst wdc65816_decoded_opcodes = Object.freeze(\n' + decode_opcodes() + ');');
}

function generate_spc700_js() {
    set_gentarget('js');
    save_js('spc700_generated_opcodes.js', '"use strict";\n\nconst SPC_decoded_opcodes = Object.freeze(\n' + SPC_decode_opcodes() + ');');
}

function generate_nes6502_js() {
    set_gentarget('js');
    save_js('nesm6502_generated_opcodes.js', generate_nes6502_core());
}

function generate_nes6502_as() {
    set_gentarget('as');
    save_js('nesm6502_generated_opcodes.ts', generate_nes6502_core_as());
}

function generate_65c02_js() {
    set_gentarget('js');
    save_js('m65c02_generated_opcodes.js', generate_6502_cmos_core());
}

function generate_z80_js() {
    set_gentarget('js');
    save_js('z80_generated_opcodes.js', generate_z80_core(false));
}

function generate_sm83_js() {
    set_gentarget('js');
    save_js('sm83_generated_opcodes.js', generate_sm83_core());
}

function generate_sm83_as() {
    set_gentarget('as');
    save_js('sm83_generated_opcodes.ts', generate_sm83_core());
}


function click_generate_sm83_tests() {
    let seed = seed_input.value;
    if (seed.length < 1) {
        alert('Please use a seed!');
        return;
    }
    let numtests = parseInt(numtests_input.value);
    if (!numtests) {
        alert('Please enter a valid number of tests to generate per opcode');
        return;
    }

    SM83_NUM_TO_GENERATE = numtests;
    generate_SM83_tests(seed);
}
function click_generate_z80_tests() {
    let seed = seed_input.value;
    if (seed.length < 1) {
        alert('Please use a seed!');
        return;
    }
    let CMOS = document.getElementById('Z80cmos').checked;
    let simplified_mem = document.getElementById('Z80simplmem').checked;
    let refresh = document.getElementById('Z80refresh').checked;
    let nullwaits = document.getElementById("Z80nullwait").checked;
    let numtests = parseInt(numtests_input.value);
    if (!numtests) {
        alert('Please enter a valid number of tests to generate per opcode');
        return;
    }

    Z80_DO_FULL_MEMCYCLES = !simplified_mem;
    Z80_DO_MEM_REFRESHES = refresh; // Put I/R on address bus
    SM83_NUM_TO_GENERATE = numtests;
    Z80_NULL_WAIT_STATES = nullwaits;
    generate_Z80_tests(seed, CMOS);
}