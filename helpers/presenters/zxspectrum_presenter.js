"use strict";

// 0-7, or 8-15 for bright ones
const ZXSpectrum_palette = Object.freeze({
    0: {0: [0, 0, 0], 1: [0, 0, 0xD8],
        2: [0xD8, 0, 0], 3: [0xD8, 0, 0xD8],
        4: [0, 0xD8, 0], 5: [0, 0xD8, 0xD8],
        6: [0xD8, 0xD8, 0], 7: [0xD8, 0xD8, 0xD8]},
    1: {0: [0, 0, 0], 1: [0, 0, 0xFF],
        2: [0xFF, 0, 0], 3: [0xFF, 0, 0xFF],
        4: [0, 0xFF, 0], 5: [0, 0xFF, 0xFF],
        6: [0xFF, 0xFF, 0], 7: [0xFF, 0xFF, 0xFF]}
})


/**
 * @param data
 * @param {ImageData} imgdata
 * @param {SharedArrayBuffer} ULA_output_buffer
 */
function ZXSpectrum_present(data, imgdata, ULA_output_buffer) {
    // 352x304
    let output = new Uint8Array(ULA_output_buffer);
    for (let ry = 0; ry < 304; ry++) {
        let y = ry;
        for (let rx = 0; rx < 352; rx++) {
            let x = rx;
            let di = ((y * 352) + x) * 4;
            let ulai = (y * 352) + x;

            let color = output[ulai];
            let pal = (color & 0x08) >>> 3;
            color &= 7;

            imgdata[di] = ZXSpectrum_palette[pal][color][0];
            imgdata[di+1] = ZXSpectrum_palette[pal][color][1];
            imgdata[di+2] = ZXSpectrum_palette[pal][color][2];
            imgdata[di+3] = 255;
        }
    }
}

