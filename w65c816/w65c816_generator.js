// Function that checks opcode_AM_R, which is used to generate opcode_AM
function check_addressing_matrix() {
    let testourset = function(i, ourset, ourthere, addrmode, pneumonic) {
        if (addrmode.has(i)) {
            ourthere[i] = true;
            if (i in ourset) {
                console.log('$' + hex2(i) + ' found more than once: ' + ourset[i] + ' and ' + pneumonic);
            }
            ourset[i] = pneumonic;
        }
    };

    let ourset = {}, ourthere = {};
    for (let i = 0; i < 256; i++) {
        ourthere[i] = false;
    }
    for (let i=0; i < opcode_AM_R.size; i++) {
        let opcodes = opcode_AM_R.get(i);
        let index = 0;
        opcodes.forEach(function(opcode) {
            testourset(opcode, ourset, ourthere, opcodes, opcode_AM_PN.get(index));
            index++;
        })
    }
    for(let i = 0; i < 256; i++) {
        if (!ourset.hasOwnProperty(i)) {
            console.log('$' + hex2(i) + ' not found!');
        }
    }
}
check_addressing_matrix();
