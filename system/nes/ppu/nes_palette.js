"use strict";

/*const NES_palette_str = "\
 84  84  84    0  30 116    8  16 144   48   0 136   68   0 100   92   0  48   84   4   0   60  24   0   32  42   0    8  58   0    0  64   0    0  60   0    0  50  60    0   0   0  0 0 0  0 0 0 \
152 150 152    8  76 196   48  50 236   92  30 228  136  20 176  160  20 100  152  34  32  120  60   0   84  90   0   40 114   0    8 124   0    0 118  40    0 102 120    0   0   0  0 0 0  0 0 0 \
236 238 236   76 154 236  120 124 236  176  98 236  228  84 236  236  88 180  236 106 100  212 136  32  160 170   0  116 196   0   76 208  32   56 204 108   56 180 204   60  60  60  0 0 0  0 0 0 \
236 238 236  168 204 236  188 188 236  212 178 236  236 174 236  236 174 212  236 180 176  228 196 144  204 210 120  180 222 120  168 226 144  152 226 180  160 214 228  160 162 160  0 0 0  0 0 0 ";

function NES_parse_palette() {
    //for (let i = 0; i < 64; i++) {

    //}
    let arr = NES_palette_str.split(' ');
    let out = [];
    for (let i in arr) {
        if (arr[i] === '') continue;
        out.push(parseInt(arr[i]));
    }
    let outstr = '';
    for (let num = 0; num < 64; num++) {
        let i = num*3;
        outstr += 'NES_palette[' + num + '] = 0xFF' +  hex2(out[i+2]) + hex2(out[i+1]) + hex2(out[i]) + ';\n';
    }
    console.log(outstr);
}
NES_parse_palette();*/

const NES_palette = new Uint32Array(64);

NES_palette[0] = 0xFF545454;
NES_palette[1] = 0xFF741E00;
NES_palette[2] = 0xFF901008;
NES_palette[3] = 0xFF880030;
NES_palette[4] = 0xFF640044;
NES_palette[5] = 0xFF30005C;
NES_palette[6] = 0xFF000454;
NES_palette[7] = 0xFF00183C;
NES_palette[8] = 0xFF002A20;
NES_palette[9] = 0xFF003A08;
NES_palette[10] = 0xFF004000;
NES_palette[11] = 0xFF003C00;
NES_palette[12] = 0xFF3C3200;
NES_palette[13] = 0xFF000000;
NES_palette[14] = 0xFF000000;
NES_palette[15] = 0xFF000000;
NES_palette[16] = 0xFF989698;
NES_palette[17] = 0xFFC44C08;
NES_palette[18] = 0xFFEC3230;
NES_palette[19] = 0xFFE41E5C;
NES_palette[20] = 0xFFB01488;
NES_palette[21] = 0xFF6414A0;
NES_palette[22] = 0xFF202298;
NES_palette[23] = 0xFF003C78;
NES_palette[24] = 0xFF005A54;
NES_palette[25] = 0xFF007228;
NES_palette[26] = 0xFF007C08;
NES_palette[27] = 0xFF287600;
NES_palette[28] = 0xFF786600;
NES_palette[29] = 0xFF000000;
NES_palette[30] = 0xFF000000;
NES_palette[31] = 0xFF000000;
NES_palette[32] = 0xFFECEEEC;
NES_palette[33] = 0xFFEC9A4C;
NES_palette[34] = 0xFFEC7C78;
NES_palette[35] = 0xFFEC62B0;
NES_palette[36] = 0xFFEC54E4;
NES_palette[37] = 0xFFB458EC;
NES_palette[38] = 0xFF646AEC;
NES_palette[39] = 0xFF2088D4;
NES_palette[40] = 0xFF00AAA0;
NES_palette[41] = 0xFF00C474;
NES_palette[42] = 0xFF20D04C;
NES_palette[43] = 0xFF6CCC38;
NES_palette[44] = 0xFFCCB438;
NES_palette[45] = 0xFF3C3C3C;
NES_palette[46] = 0xFF000000;
NES_palette[47] = 0xFF000000;
NES_palette[48] = 0xFFECEEEC;
NES_palette[49] = 0xFFECCCA8;
NES_palette[50] = 0xFFECBCBC;
NES_palette[51] = 0xFFECB2D4;
NES_palette[52] = 0xFFECAEEC;
NES_palette[53] = 0xFFD4AEEC;
NES_palette[54] = 0xFFB0B4EC;
NES_palette[55] = 0xFF90C4E4;
NES_palette[56] = 0xFF78D2CC;
NES_palette[57] = 0xFF78DEB4;
NES_palette[58] = 0xFF90E2A8;
NES_palette[59] = 0xFFB4E298;
NES_palette[60] = 0xFFE4D6A0;
NES_palette[61] = 0xFFA0A2A0;
NES_palette[62] = 0xFF000000;
NES_palette[63] = 0xFF000000;
