"use strict";

/**
 * @param {ImageData} imgdata
 * @param {SharedArrayBuffer} NES_output_buffer
 */
function NES_present(imgdata, NES_output_buffer) {
    let neso = new Uint8Array(NES_output_buffer);
    for (let y = 0; y < 240; y++) {
        for (let x = 0; x < 256; x++) {
            let b_in = (y * 256) + x;
            let b_out = b_in * 4;
            let color = neso[b_in];
            color = NES_palette[color];

            imgdata[b_out] = (color & 0xFF0000) >>> 16;
            imgdata[b_out+1] = (color & 0xFF00) >>> 8;
            imgdata[b_out+2] = (color & 0xFF);
            //imgdata[b_out] = 0xFF;
            //imgdata[b_out+1] = 0;
            //imgdata[b_out+2] = 0;
            imgdata[b_out+3] = 0xFF;
        }
    }
}
