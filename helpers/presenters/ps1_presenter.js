"use strict";

function PS1_present(data, imgdata, PS1_output_buffer) {
    let gbo = new Uint16Array(PS1_output_buffer);
    for (let y = 0; y < 480; y++) {
        for (let x = 0; x < 640; x++) {
            let ppui = ((y * 640) + x) * 3;
            let di = ((y * 640) + x) * 4;
            imgdata[di] = gbo[ppui];
            imgdata[di+1] = gbo[ppui+1];
            imgdata[di+2] = gbo[ppui+2];
            imgdata[di+3] = 255;
        }
    }
}
