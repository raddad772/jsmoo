"use strict";

function SNES_presenter(data, imgdata, SNES_output_buffer) {
    let buf = new Uint16Array(SNES_output_buffer);
    for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 256; x++) {
            let di = (y * 256 * 4) + (x * 4);
            let ppui = (y * 256) + x;
            let ppuo = buf[ppui];
            imgdata[di] = (ppuo & 0x7C00) >>> 7;
            imgdata[di + 1] = (ppuo & 0x3E0) >>> 2;
            imgdata[di + 2] = (ppuo & 0x1F) << 3;
            imgdata[di + 3] = 255;
        }
    }
}