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
        outstr += 'NES_palette[' + num + '] = 0xFF' +  hex2(out[i]) + hex2(out[i+1]) + hex2(out[i+2]) + ';\n';
    }
    console.log(outstr);
}
NES_parse_palette();*/

const NES_palette = new Uint32Array(64);
NES_palette[0] = 0xFF545454;
NES_palette[1] = 0xFF001E74;
NES_palette[2] = 0xFF081090;
NES_palette[3] = 0xFF300088;
NES_palette[4] = 0xFF440064;
NES_palette[5] = 0xFF5C0030;
NES_palette[6] = 0xFF540400;
NES_palette[7] = 0xFF3C1800;
NES_palette[8] = 0xFF202A00;
NES_palette[9] = 0xFF083A00;
NES_palette[10] = 0xFF004000;
NES_palette[11] = 0xFF003C00;
NES_palette[12] = 0xFF00323C;
NES_palette[13] = 0xFF000000;
NES_palette[14] = 0xFF000000;
NES_palette[15] = 0xFF000000;
NES_palette[16] = 0xFF989698;
NES_palette[17] = 0xFF084CC4;
NES_palette[18] = 0xFF3032EC;
NES_palette[19] = 0xFF5C1EE4;
NES_palette[20] = 0xFF8814B0;
NES_palette[21] = 0xFFA01464;
NES_palette[22] = 0xFF982220;
NES_palette[23] = 0xFF783C00;
NES_palette[24] = 0xFF545A00;
NES_palette[25] = 0xFF287200;
NES_palette[26] = 0xFF087C00;
NES_palette[27] = 0xFF007628;
NES_palette[28] = 0xFF006678;
NES_palette[29] = 0xFF000000;
NES_palette[30] = 0xFF000000;
NES_palette[31] = 0xFF000000;
NES_palette[32] = 0xFFECEEEC;
NES_palette[33] = 0xFF4C9AEC;
NES_palette[34] = 0xFF787CEC;
NES_palette[35] = 0xFFB062EC;
NES_palette[36] = 0xFFE454EC;
NES_palette[37] = 0xFFEC58B4;
NES_palette[38] = 0xFFEC6A64;
NES_palette[39] = 0xFFD48820;
NES_palette[40] = 0xFFA0AA00;
NES_palette[41] = 0xFF74C400;
NES_palette[42] = 0xFF4CD020;
NES_palette[43] = 0xFF38CC6C;
NES_palette[44] = 0xFF38B4CC;
NES_palette[45] = 0xFF3C3C3C;
NES_palette[46] = 0xFF000000;
NES_palette[47] = 0xFF000000;
NES_palette[48] = 0xFFECEEEC;
NES_palette[49] = 0xFFA8CCEC;
NES_palette[50] = 0xFFBCBCEC;
NES_palette[51] = 0xFFD4B2EC;
NES_palette[52] = 0xFFECAEEC;
NES_palette[53] = 0xFFECAED4;
NES_palette[54] = 0xFFECB4B0;
NES_palette[55] = 0xFFE4C490;
NES_palette[56] = 0xFFCCD278;
NES_palette[57] = 0xFFB4DE78;
NES_palette[58] = 0xFFA8E290;
NES_palette[59] = 0xFF98E2B4;
NES_palette[60] = 0xFFA0D6E4;
NES_palette[61] = 0xFFA0A2A0;
NES_palette[62] = 0xFF000000;
NES_palette[63] = 0xFF000000;
