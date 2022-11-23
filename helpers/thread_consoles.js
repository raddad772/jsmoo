"use strict";

class threaded_console_t {
    constructor(el, direction = 1, maxlines = 30, scrollbar=false, draw_on_add = false) {
        this.elname = el;
        this.direction = direction;
        this.buffer = [];

        this.with_msg = {
            scrollbar: scrollbar,
            direction: direction,
            elname: el,
            max_lines: maxlines,
        }
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
        //this.container = document.getElementById(this.elname + "container");
        //this.textconsole = document.getElementById(this.elname);
        this.init_done = true;
    }

    clear(draw=null) {
        this.buffer = [];
        if (draw === null) draw = this.draw_on_add;
        emulator_worker.send_textconsole_message({options: this.with_msg, cmd: 'clear', args: {draw: draw}});
    }

    draw() {
        this.init();
        emulator_worker.send_textconsole_message({options: this.with_msg, cmd: 'draw'});
    }

    addl(order, line, bgcolor=null, draw= null) {
        emulator_worker.send_textconsole_message({options: this.with_msg, cmd: 'addl', args: {order: order, line: line, bgcolor: bgcolor, draw: draw}})
    }
}

const tconsole = new threaded_console_t('tconsole');
const dconsole = new threaded_console_t('dconsole');
