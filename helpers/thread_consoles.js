"use strict";

class threaded_console_t {
    constructor(name) {
        this.name = name;
    }

    addl(what) {
        console.log(this.name, what);
    }
}

const tconsole = new threaded_console_t('tconsole');
const dconsole = new threaded_console_t('dconsole');