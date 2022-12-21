"use strict";

function GBC_present(data, imgdata, GB_output_buffer) {
    let gbo = new Uint16Array(GB_output_buffer);
    for (let y = 0; y < 144; y++) {
        for (let x = 0; x < 160; x++) {
            let ppui = (y * 160) + x;
            let di = ppui * 4;
            let r, g, b;
            let o = gbo[ppui];
            r = (o & 0x1F);
            g = (o >>> 5) & 0x1F;
            b = (o >>> 10) & 0x1F;
            r = (r << 3) | (r >> 2);
            g = (g << 3) | (g >> 2);
            b = (b << 3) | (b >> 2);
            imgdata[di] = r;
            imgdata[di+1] = g;
            imgdata[di+2] = b;
            imgdata[di+3] = 255;
        }
    }
    // draw lines around screen
    //this.draw_lines_around_screen(imgdata);
}
