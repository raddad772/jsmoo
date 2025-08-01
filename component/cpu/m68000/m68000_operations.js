"use strict";

/*
the general idea
is that the 65536-entry opcode table
will be translated toa  65536-entry addr, opcode table

so

addrInstruction8(regs, pins, ALU) {
    do_stuff;
    ALU(x);
    do_stuff;
}

addrInstruction16(regs, pins, ALU) {
}


that kinda thing
 */

