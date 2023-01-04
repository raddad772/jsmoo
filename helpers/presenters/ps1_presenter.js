"use strict";

function PS1_present(data, imgdata, PS1_output_buffer) {
    let gbo = new Uint16Array(PS1_output_buffer);
    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 1024; x++) {
            let ppui = ((y * 1024) + x);
            let di = ((y * 1024) + x) * 4;
            let c = gbo[ppui];
            let r = (c & 0x1F) << 3;
            let g = ((c >>> 5) & 0x1F) << 3;
            let b = ((c >>> 10) & 0x1F) << 3;
            imgdata[di] = r | (r >>> 5);
            imgdata[di+1] = g | (g >>> 5);
            imgdata[di+2] = b | (b >>> 5);
            imgdata[di+3] = 255;
        }
    }
}
