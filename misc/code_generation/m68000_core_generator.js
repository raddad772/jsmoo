"use strict";


/**
 *
 */


class M68KTS_func {
    constructor(Size, arg1, arg2, name) {
        this.Size = 0;
        this.arg1_kind = arg1.kind;
        this.arg2_kind = arg2.kind;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.name = name;
    }
}

// So this core is basically,
// do the instruction all at once and then wait that many cycles.

