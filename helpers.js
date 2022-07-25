"use strict";

/**
 * @param {Number} val
 */
function hex2(val) {
    let outstr = val.toString(16);
    if (outstr.length === 1) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

/**
 * @param {Number} val
 */
function hex4(val) {
    let outstr = val.toString(16);
    if (outstr.length < 4) outstr = '0' + outstr;
    if (outstr.length < 4) outstr = '0' + outstr;
    if (outstr.length < 4) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

/**
 * @param {Number} val
 */
function hex6(val) {
    let outstr = val.toString(16);
    if (outstr.length < 6) outstr = '0' + outstr;
    if (outstr.length < 6) outstr = '0' + outstr;
    if (outstr.length < 6) outstr = '0' + outstr;
    if (outstr.length < 6) outstr = '0' + outstr;
    if (outstr.length < 6) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

/**
 * @param {Number} val
 */
function hex0x2(val) {
    return '0x' + hex2(val);
}

/**
 * @param {Number} val
 */
function hex0x4(val) {
    return '0x' + hex4(val);
}

/**
 * @param {Number} val
 */
function hex0x6(val) {
    return '0x' + hex6(val);
}

function buf_copy(src)  {
    var dst = new ArrayBuffer(src.byteLength);
    new Uint8Array(dst).set(new Uint8Array(src));
    return dst;
}

function txf(instr) {
    let otag = '{';
    let ctag = '}';
    let in_tag = false;
    let outstr = '';
    let stack = [];
    for (let i in instr) {
        let ch = instr[i];
        if (ch === otag) {
            in_tag = true;
            continue;
        }
        if (in_tag) {
            switch(ch) {
                case '/':
                    while(stack.length !== 0) {
                        let c = stack.pop();
                        switch (c) {
                            case 'R':
                            case 'r':
                            case 'B':
                            case 'b':
                            case 'G':
                            case 'g':
                                outstr += '</span>';
                                break;
                            case '*':
                                outstr += '</b>';
                                break;
                        }
                    }
                    continue;
                case 'R':
                case 'r':
                    outstr += '<span style="color: red;">';
                    break;
                case 'B':
                case 'b':
                    outstr += '<span style="color: blue;">';
                    break;
                case 'G':
                case 'g':
                    outstr += '<span style="color: green;">';
                    break;
                case '*':
                    outstr += '<b>';
                    break;
                case ctag:
                    in_tag = false;
                    continue;
            }
            stack.push(ch);
            continue;
        }
        outstr += ch;
    }
    return outstr;
}

class console_t {
    constructor(el, direction = 1, maxlines = 30, scrollbar=false, draw_on_add = false) {
        this.elname = el;
        this.direction = direction;
        this.buffer = [];
        this.draw_on_add = draw_on_add;
        this.scrollbar = scrollbar;
        this.max_lines = maxlines;
        this.container = null;
        this.textconsole = null;
        this.init_done = false;
        this.last_order = 0;
    }

    init() {
        if (this.init_done) return;
        this.container = document.getElementById(this.elname + "container");
        this.textconsole = document.getElementById(this.elname);
        this.init_done = true;
    }

    clear(draw=null) {
        this.buffer = [];
        if (draw === null) draw = this.draw_on_add;
        if (draw) {
            this.init();
            this.textconsole.innerHTML = "";
        }
    }

    draw() {
        this.init();
        let outstr = '';
        for (let i in this.buffer) {
            let bgcolor = this.buffer[i][1];
            let fmt_txt = txf(this.buffer[i][2]);
            if (bgcolor !== null) {
                outstr += '<span style="display: block; background-color: ' + bgcolor + ';">' + fmt_txt + '</span>';
            }
            else {
                if (i !== 0) outstr += '\n';
                outstr += fmt_txt;
            }
        }
        this.textconsole.innerHTML = outstr;
        if (this.scrollbar) {
            var txcontainer = this.container;
            if (this.direction === 1) {
                window.setTimeout(function () {
                    txcontainer.scrollTop = txcontainer.scrollHeight;
                }, 0);
            }
            else {
                window.setTimeout(function () {
                    txcontainer.scrollTop = 0;
                }, 0);
            }
        }
    }

    addl(order, line, bgcolor=null, draw= null) {
        if (order === null) {
            order = this.last_order;
            this.last_order++;
        }
        if (draw === null) draw = this.draw_on_add;
        if (this.direction === 1)
            this.addl_down(order, line, bgcolor);
        else
            this.addl_up(order, line, bgcolor);
        if (draw)
            this.draw();
    }

    sort_down() {
        this.buffer = this.buffer.sort((a, b) => {return a[0] - b[0];})
    }

    sort_up() {
        this.buffer = this.buffer.sort((a, b) => {return b[0] - a[0];})
    }

    sort() {
        if (this.direction === 1) this.sort_down();
        else this.sort_up();
    }

    addl_up(order, line, bgcolor) {
        this.buffer.unshift([order, bgcolor, line]);
        this.sort_up();
        if (this.buffer.length > this.max_lines) {
            this.buffer = this.buffer.slice(0, this.buffer.length-1);
            //this.buffer = this.buffer.slice(1);
        }
    }

    addl_down(order, line, bgcolor) {
        this.buffer.push([order, bgcolor, line]);
        this.sort_down();
        if (this.buffer.length > this.max_lines) {
            this.buffer = this.buffer.slice(1);
        }
    }

}

/*class old_console_t {
    constructor(elname, maxlines=30) {
        this.elname = elname;
        this.buffer = [];
        this.max_lines = maxlines;
        this.container = null;
        this.textconsole = null;
    }

    clear() {
        this.buffer = [];
        this.textconsole.innerHTML = "";
    }

    draw() {
        let outstr = '';
        for (let i in this.buffer) {
            if (i !== 0) outstr;
            outstr += txf(this.buffer[i][1]);
            let bgcolor = this.buffer[i][0];
            if (bgcolor !== null) {
                outstr = '<span style="display: block; background-color:' + bgcolor + ';">' + outstr + '</span>';
            }
            else {
                if (i !== 0) outstr += '\n';
            }
        }
        var tcxcontainer = this.container;
        this.textconsole.innerHTML = outstr;
        window.setTimeout(function(){
            tcxcontainer.scrollTop = tcxcontainer.scrollHeight;
        }, 0);
    }

    init() {
        if (this.textconsole !== null) return;
        this.container = document.getElementById(this.elname + "container");
        this.textconsole = document.getElementById(this.elname);
    }

    addl(line, draw=true, bgcolor=null) {
        //let ft = txf(line);
        let ft = line;
        if (this.textconsole === null) {
            this.init();
        }
        this.buffer.unshift([bgcolor, ft]);
        if (this.buffer.length > this.max_lines) {
            this.buffer = this.buffer.slice(-1);
        }
        if (draw)
            this.draw();
    }
}*/

// Top one, going up.
var dconsole = new console_t('disassembly', -1, 258, false, false);
// Bottom one, going down.
var tconsole = new console_t('textconsole', 1, 20, true, true);
// Memory dump console
var mconsole = new console_t('memdumpconsole', 1, 30, false, false);

// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function save_js(filename, data, kind = 'text/javascript') {
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
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

///////

function trace46(addr, bank=null) {
    let outstr = '';
    if (bank !== null)
        outstr += hex2(bank) + ' ';
    else
        outstr += '   ';
    outstr += hex4(addr);
    return outstr + ' ';
}

function trace_start_format(kind, kind_color, trace_cycles, middle, addr, bank=null) {
    let outstr;
    if (TRACE_COLOR)
        outstr = kind_color + kind + '{/}';
    else
        outstr = kind;
    outstr += '(' + padl(trace_cycles.toString(), 6) + ')' + middle;
    if (TRACE_COLOR)
        outstr += TRACE_ADDR + trace46(addr, bank) + '{/} ';
    else
        outstr += trace46(addr, bank) + ' ';
    return outstr;
}

function trace_format_read(kind, kind_color, trace_cycles, addr, val, bank=null) {
    let outstr;
    if (typeof val === 'undefined') {
        val = 'UNDEFINED';
    }
    if (val === null) {
        val = 'OPENBUS';
    }
    else {
        val = hex2(val);
    }
    if (TRACE_COLOR) {
        outstr = trace_start_format(kind, kind_color, trace_cycles, TRACE_READ + 'r', addr, bank)
        outstr += ' {/}' + TRACE_READ + '$' + val + '{/}';
    }
    else {
        outstr = trace_start_format(kind, kind_color, trace_cycles, 'r', addr, bank)
        outstr += ' ' + val;
    }
    return outstr;
}

function trace_format_write(kind, kind_color, trace_cycles, addr, val, bank=null) {
    let outstr;
    if (TRACE_COLOR) {
        outstr = trace_start_format(kind, kind_color, trace_cycles, TRACE_WRITE + 'w', addr, bank)
        outstr += ' {/}' + TRACE_WRITE + '$' + hex2(val) + '{/}';
    }
    else {
        outstr = trace_start_format(kind, kind_color, trace_cycles, 'w', addr, bank)
        outstr += ' $' + hex2(val) + '{/}';
    }
    return outstr;
}

function trace_format_IO(kind, kind_color, trace_cycles, addr, bank=null) {
    let outstr;
    if (TRACE_COLOR)
        outstr = kind_color + kind + '{/}';
    else
        outstr = kind;
    outstr += '(' + padl(trace_cycles.toString(), 6) + ')';
    outstr += '   IO ';
    if (TRACE_COLOR)
        outstr += TRACE_ADDR + trace46(addr, bank) + '{/}';
    else
        outstr += trace46(addr, bank);
    return outstr;
}
