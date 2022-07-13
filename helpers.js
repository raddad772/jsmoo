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
}

var tconsole = new console_t('textconsole', 80);
var dconsole = new console_t('disassembly', 258);

// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function save_js(filename, data) {
    const blob = new Blob([data], {type: 'text/javascript'});
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
    if (trace_cycles === 321133) dbg.break();
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
