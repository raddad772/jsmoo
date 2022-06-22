"use strict";

function hex2(val) {
    let outstr = val.toString(16);
    if (outstr.length === 1) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

function hex4(val) {
    let outstr = val.toString(16);
    if (outstr.length < 4) outstr = '0' + outstr;
    if (outstr.length < 4) outstr = '0' + outstr;
    if (outstr.length < 4) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

function hex6(val) {
    let outstr = val.toString(16);
    if (outstr.length < 6) outstr = '0' + outstr;
    if (outstr.length < 6) outstr = '0' + outstr;
    if (outstr.length < 6) outstr = '0' + outstr;
    if (outstr.length < 6) outstr = '0' + outstr;
    if (outstr.length < 6) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

function hex0x2(val) {
    return '0x' + hex2(val);
}

function hex0x4(val) {
    return '0x' + hex4(val);
}

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
    constructor(elname) {
        this.elname = elname;
        this.buffer = [];
        this.max_lines = 30;
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
            if (i !== 0) outstr += '\n';
            outstr += this.buffer[i];
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

    addl(line) {
        let ft = txf(line);
        if (this.textconsole === null) {
            this.init();
        }
        this.buffer.push(ft);
        if (this.buffer.length > this.max_lines) {
            this.buffer = this.buffer.slice(1);
        }
        this.draw();
    }
}

var tconsole = new console_t('textconsole');
var dconsole = new console_t('disassembly');

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