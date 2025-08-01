"use strict";

let rand_seed = 'apples and bananas';
let rand_seeded;


// We use seedable, repeatable RNGs to make reproducible tests.
// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function sfc32(a, b, c, d) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      let t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

// Optionally create hex2, hex4, mksigned8, and save_js if needed...
if (typeof hex2 !== 'function') {
    /**
     * @param {Number} val
     */
    window.hex2 = function(val) {
        let outstr = val.toString(16);
        if (outstr.length === 1) outstr = '0' + outstr;
        return outstr.toUpperCase();
    }
}

if (typeof hex4 !== 'function') {
    /**
     * @param {Number} val
     */
    window.hex4 = function(val) {
        let outstr = val.toString(16);
        if (outstr.length < 4) outstr = '0' + outstr;
        if (outstr.length < 4) outstr = '0' + outstr;
        if (outstr.length < 4) outstr = '0' + outstr;
        return outstr.toUpperCase();
    }
}

if (typeof mksigned8 !== 'function') {
    window.mksigned8 = function(what) {
         return what >= 0x80 ? -(0x100 - what) : what;
    }
}

if (typeof save_js !== 'function') {
    // https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
    window.save_js = function(filename, data, kind = 'text/javascript') {
        const blob = new Blob([data], {type: kind});
        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else{
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }
}

function pt_rnd8() {
    return Math.floor(rand_seeded() * 256) & 0xFF;
}

function pt_rnd16() {
    return Math.floor(rand_seeded() * 65536) & 0xFFFF;
}

