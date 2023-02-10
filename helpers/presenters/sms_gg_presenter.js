"use strict";

function SMS_present(data, imgdata, SMS_output_buffer) {
    let smso = new Uint8Array(SMS_output_buffer)
    let brl = 224; // data.bottom_rendered_line
    for (let ry = 0; ry < brl; ry++) {
        let y = ry;
        for (let rx = 0; rx < 256; rx++) {
            let x = rx;
            let di = ((y * 256) + x) * 4;
            let ulai = (y * 256) + x;

            let color = smso[ulai];
            //if ((color !== 0) && (color !== 0xFF))
                //console.log('COLOR!', color);
            let r, g, b;
            b = ((color >>> 4) & 3) * 0x55;
            g = ((color >>> 2) & 3) * 0x55;
            r = (color & 3) * 0x55;

            imgdata[di] = r;
            imgdata[di+1] = g;
            imgdata[di+2] = b;
            imgdata[di+3] = 255;
        }
    }
}

function GG_present(data, imgdata, GG_output_buffer) {
    let ggo = new Uint16Array(GG_output_buffer);
    let ybottom = 192;//this.clock.timing.bottom_rendered_line+1;
    let ydiff = (ybottom - 144) >>> 1;
    for (let ry = ydiff; ry < (144+ydiff); ry++) {
        let y = ry;
        for (let rx = 48; rx < 208; rx++) {
            let x = rx;
            let di = (((y-ydiff) * 160) + (x-48)) * 4;
            let ulai = (y * 256) + x;
            let color = ggo[ulai];

            imgdata[di] = (color & 0x0F) * 0x11;
            imgdata[di+1] = ((color >>> 4) & 0x0F) * 0x11;
            imgdata[di+2] = ((color >>> 8) & 0x0F) * 0x11;
            imgdata[di+3] = 255;
        }
    }
}
