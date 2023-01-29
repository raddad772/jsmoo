'use strict';

const DO_WASM_IMPORTS = false;

window.onload = function() {
    console.log('ONLOAD! ', tconsole);
}

// Bottom one, going down.
var tconsole = new console_t('textconsole', 1, 20, true, true);


async function test_z80_as() {
    await AS_test_pt_z80();
}