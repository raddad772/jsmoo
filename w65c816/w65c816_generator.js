"use strict";

// Function that checks opcode_AM_R, which is used to generate opcode_AM
function check_addressing_matrix() {
    console.log('Checking addressing matrix...')
    let testourset = function(i, ourset, ourthere, addrmode, mnemonic) {
        if (addrmode.includes(i)) {
            ourthere[i] = true;
            if (i in ourset) {
                console.log('$' + hex2(i) + ' found more than once: ' + ourset[i] + ' and ' + mnemonic);
            }
            ourset[i] = mnemonic;
        }
    };

    let ourset = {}, ourthere = {};
    for (let i = 0; i < 256; i++) {
        ourthere[i] = false;
    }
    for (let i in opcode_AM_R) {
        let opcodes = opcode_AM_R[i];
        for (let j = 0; j < opcodes.length; j++) {
            let opcode = opcodes[j];
            testourset(opcode, ourset, ourthere, opcodes, opcode_AM_MN[j]);
        }
    }
    for(let i = 0; i < 256; i++) {
        if (!ourset.hasOwnProperty(i)) {
            console.log('$' + hex2(i) + ' not found!');
        }
    }
}

function check_mnemonic_matrix() {
    console.log('Checking mnemonic matrix...')
    let testourset = function(i, ourset, ourthere, opcodes, mnemonic) {
        if (opcodes.includes(i)) {
            ourthere[i] = true;
            if (i in ourset) {
                console.log('$' + hex2(i) + ' found more than once: ' + ourset[i] + ' and ' + mnemonic);
            }
            ourset[i] = mnemonic;
        }
    };

    let ourset = {}, ourthere = {};
    for (let i = 0; i < 256; i++) {
        ourthere[i] = false;
    }
    for (let i in opcode_MN_R) {
        let opcodes = opcode_MN_R[i];
        for (let j in opcodes) {
            let opcode = opcodes[j];
            testourset(opcode, ourset, ourthere, opcodes, opcode_MN[j]);
        }
    }
    for(let i = 0; i < 256; i++) {
        if (!ourset.hasOwnProperty(i)) {
            console.log('$' + hex2(i) + ' not found!');
        }
    }
}
check_addressing_matrix();
check_mnemonic_matrix();