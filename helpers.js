function hex2(val) {
    let outstr = val.toString(16);
    if (outstr.length === 1) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

function buf_copy(src)  {
    var dst = new ArrayBuffer(src.byteLength);
    new Uint8Array(dst).set(new Uint8Array(src));
    return dst;
}

class console_t {
    constructor() {
        this.buffer = [];
        this.max_lines = 20;
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
        this.container = document.getElementById("textconsolecontainer");
        this.textconsole = document.getElementById("textconsole");
    }

    add_line(line) {
        if (this.textconsole === null) {
            this.init();
        }
        this.buffer.push(line);
        if (this.buffer.length > this.max_lines) {
            this.buffer = this.buffer.slice(1);
        }
        this.draw();
    }
}

var tconsole = new console_t();