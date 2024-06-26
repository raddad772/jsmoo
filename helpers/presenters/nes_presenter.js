"use strict";

/**
 * @param data
 * @param {ImageData} imgdata
 * @param {SharedArrayBuffer} NES_output_buffer
 * @param {boolean} correct_overscan
 * @param overscan
 */
function NES_present(data, imgdata, NES_output_buffer, correct_overscan, overscan) {
    let neso = new Uint16Array(NES_output_buffer);
    let overscan_left = overscan.left;
    let overscan_right = overscan.right;
    let overscan_top = overscan.top;
    let overscan_bottom = overscan.bottom;
    if (!correct_overscan) { overscan_left = overscan_bottom = overscan_top = overscan_right = 0; }
    let w = 256 - (overscan_left + overscan_right);
    let img32 = new Uint32Array(imgdata.buffer);
    for (let nes_y = overscan_top; nes_y < (240 - overscan_bottom); nes_y++) {
        let out_y = nes_y - overscan_top;
        let nesyw = nes_y * 256;
        let outyw = out_y * w;
        for (let nes_x = overscan_left; nes_x < (256 - overscan_right); nes_x++) {
            let out_x = nes_x - overscan_left;
            let b_nes = (nesyw + nes_x);
            let b_out = (outyw + out_x);

            img32[b_out] = NES_palette[neso[b_nes]];
        }
    }
}
