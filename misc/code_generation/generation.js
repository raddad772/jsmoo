"use strict";

var seed_input;
window.onload = function() {
    seed_input = document.getElementById('seed');
    dconsole = new dct();
    seed_input.value = "apples and oranges";
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
    generate_SPC700_tests(seed);
}

function generate_wdc65816_js() {
	save_js('wdc65816_generated_opcodes.js', '"use strict";\n\nconst wdc65816_decoded_opcodes = Object.freeze(\n' + decode_opcodes() + ');');
}

function generate_spc700_js() {
    save_js('spc700_generated_opcodes.js', '"use strict";\n\nconst SPC_decoded_opcodes = Object.freeze(\n' + SPC_decode_opcodes() + ');');
}

function generate_nes6502_js() {
    save_js('nesm6502_generated_opcodes.js', generate_nes6502_core());
}

