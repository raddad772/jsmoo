"use strict";

class threaded_console_t {
    constructor(name) {
        this.name = name;
    }

    addl(what) {
        console.log(name, what);
    }
}

var tconsole = new threaded_console_t('tconsole')
var dconsole = new threaded_console_t('dconsole')