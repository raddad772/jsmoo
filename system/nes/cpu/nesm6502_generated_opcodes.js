"use strict";

const nesm6502_opcodes_decoded = Object.freeze({
    0x00: new M6502_opcode_functions(M6502_stock_matrix[0x00],
        function(regs, pins) { //BRK
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = (regs.PC >>> 8) & 0xFF;
                    pins.RW = 1;
                    break;
                case 3:
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = regs.PC & 0xFF;
                    break;
                case 4:
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = regs.P.getbyte() | 0x30;
                    break;
                case 5:
                    regs.P.I = 1;
                    pins.RW = 0;
                    pins.Addr = (0xFFFE);
                    break;
                case 6:
                    regs.PC = pins.D;
                    pins.Addr = (0xFFFF);
                    break;
                case 7: // cleanup_custom
                    regs.PC |= (pins.D << 8);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x01: new M6502_opcode_functions(M6502_stock_matrix[0x01],
        function(regs, pins) { //ORA (d,x)
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    regs.TA = pins.D + regs.X;
                    break;
                case 3: // real read ABS L
                    pins.Addr = regs.TA;
                    break;
                case 4: // read ABS H
                    regs.TA = pins.D;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 5: // Read from addr
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.TR | regs.A;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x02: new M6502_opcode_functions(M6502_stock_matrix[0x02],
        function(regs, pins) { //INVALID
    }),
    0x03: new M6502_opcode_functions(M6502_stock_matrix[0x03],
        function(regs, pins) { //INVALID
    }),
    0x04: new M6502_opcode_functions(M6502_stock_matrix[0x04],
        function(regs, pins) { //INVALID
    }),
    0x05: new M6502_opcode_functions(M6502_stock_matrix[0x05],
        function(regs, pins) { //ORA d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.TR | regs.A;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x06: new M6502_opcode_functions(M6502_stock_matrix[0x06],
        function(regs, pins) { //ASL d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.RW = 1;
                    break;
                case 4:
                    regs.P.C = (regs.TR & 0x80) >>> 7;
                    regs.TR = (regs.TR << 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 5: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x07: new M6502_opcode_functions(M6502_stock_matrix[0x07],
        function(regs, pins) { //INVALID
    }),
    0x08: new M6502_opcode_functions(M6502_stock_matrix[0x08],
        function(regs, pins) { //PHP
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = regs.P.getbyte() | 0x30;
                    pins.RW = 1;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x09: new M6502_opcode_functions(M6502_stock_matrix[0x09],
        function(regs, pins) { //ORA #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.TR | regs.A;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x0A: new M6502_opcode_functions(M6502_stock_matrix[0x0A],
        function(regs, pins) { //ASL A
            switch(regs.TCU) {
                case 1:
                    regs.P.C = (regs.A & 0x80) >>> 7;
                    regs.A = (regs.A << 1) & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x0B: new M6502_opcode_functions(M6502_stock_matrix[0x0B],
        function(regs, pins) { //INVALID
    }),
    0x0C: new M6502_opcode_functions(M6502_stock_matrix[0x0C],
        function(regs, pins) { //INVALID
    }),
    0x0D: new M6502_opcode_functions(M6502_stock_matrix[0x0D],
        function(regs, pins) { //ORA a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    regs.TR = regs.TR | regs.A;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x0E: new M6502_opcode_functions(M6502_stock_matrix[0x0E],
        function(regs, pins) { //ASL a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4:
                    regs.TR = pins.D;
                    pins.RW = 1;
                    break;
                case 5:
                    regs.P.C = (regs.TR & 0x80) >>> 7;
                    regs.TR = (regs.TR << 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x0F: new M6502_opcode_functions(M6502_stock_matrix[0x0F],
        function(regs, pins) { //INVALID
    }),
    0x10: new M6502_opcode_functions(M6502_stock_matrix[0x10],
        function(regs, pins) { //BPL r
            switch(regs.TCU) {
                case 1:
                    regs.TR = +(regs.P.N === 0);
                    if (!regs.TR) { regs.TCU += 2; break; }
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = (regs.PC + pins.D) & 0xFFFF;
                    pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                    if ((regs.TA & 0xFF00) === (PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                    break;
                case 3: // extra idle on page cross
                    break;
                case 4: // cleanup_custom
                    regs.PC = regs.TA;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x11: new M6502_opcode_functions(M6502_stock_matrix[0x11],
        function(regs, pins) { //ORA (d),y
            switch(regs.TCU) {
                case 1: // Get ZP
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // get ABS L
                    pins.Addr = pins.D;
                    break;
                case 3: // get ABS H
                    regs.TR = pins.D;
                    regs.TA = pins.D + regs.Y;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 4: // idle if crossed
                    regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                    regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                    if (regs.TR & 0xFF00 === regs.TA & 0xFF00) { regs.TCU++; pins.Addr = regs.TA; }
                    else pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                    break;
                case 5:
                    pins.Addr = regs.TA;
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.TR | regs.A;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x12: new M6502_opcode_functions(M6502_stock_matrix[0x12],
        function(regs, pins) { //INVALID
    }),
    0x13: new M6502_opcode_functions(M6502_stock_matrix[0x13],
        function(regs, pins) { //INVALID
    }),
    0x14: new M6502_opcode_functions(M6502_stock_matrix[0x14],
        function(regs, pins) { //INVALID
    }),
    0x15: new M6502_opcode_functions(M6502_stock_matrix[0x15],
        function(regs, pins) { //ORA d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.TR | regs.A;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x16: new M6502_opcode_functions(M6502_stock_matrix[0x16],
        function(regs, pins) { //ASL d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // spurious write
                    pins.RW = 1;
                    regs.P.C = (regs.TR & 0x80) >>> 7;
                    regs.TR = (regs.TR << 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    break;
                case 5:
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x17: new M6502_opcode_functions(M6502_stock_matrix[0x17],
        function(regs, pins) { //INVALID
    }),
    0x18: new M6502_opcode_functions(M6502_stock_matrix[0x18],
        function(regs, pins) { //CLC i
            switch(regs.TCU) {
                case 1:
                    regs.P.C = 0;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x19: new M6502_opcode_functions(M6502_stock_matrix[0x19],
        function(regs, pins) { //ORA a,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.Y) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.TR = regs.TR | regs.A;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x1A: new M6502_opcode_functions(M6502_stock_matrix[0x1A],
        function(regs, pins) { //INVALID
    }),
    0x1B: new M6502_opcode_functions(M6502_stock_matrix[0x1B],
        function(regs, pins) { //INVALID
    }),
    0x1C: new M6502_opcode_functions(M6502_stock_matrix[0x1C],
        function(regs, pins) { //INVALID
    }),
    0x1D: new M6502_opcode_functions(M6502_stock_matrix[0x1D],
        function(regs, pins) { //ORA a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.X) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.TR = regs.TR | regs.A;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x1E: new M6502_opcode_functions(M6502_stock_matrix[0x1E],
        function(regs, pins) { //ASL a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3: // spurious read
                    regs.TA |= pins.D << 8;
                    pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.X) & 0xFF);
                    break;
                case 4: // real read
                    pins.Addr = regs.TA;
                    break;
                case 5:
                    regs.TR = pins.D
                    pins.RW = 1;
                    break;
                case 6:
                    regs.P.C = (regs.TR & 0x80) >>> 7;
                    regs.TR = (regs.TR << 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 7: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x1F: new M6502_opcode_functions(M6502_stock_matrix[0x1F],
        function(regs, pins) { //INVALID
    }),
    0x20: new M6502_opcode_functions(M6502_stock_matrix[0x20],
        function(regs, pins) { //JSR a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3: // idle cycle
                    regs.TA |= pins.D << 8;
                    break;
                case 4:
                    regs.PC = (regs.PC - 1) & 0xFFFF;
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.RW = 1;
                    pins.D = (regs.PC & 0xFF00) >>> 8;
                    break;
                case 5:
                    pins.D = regs.PC & 0xFF;
                    regs.PC = regs.TA;
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x21: new M6502_opcode_functions(M6502_stock_matrix[0x21],
        function(regs, pins) { //AND (d,x)
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    regs.TA = pins.D + regs.X;
                    break;
                case 3: // real read ABS L
                    pins.Addr = regs.TA;
                    break;
                case 4: // read ABS H
                    regs.TA = pins.D;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 5: // Read from addr
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A &= regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.N) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x22: new M6502_opcode_functions(M6502_stock_matrix[0x22],
        function(regs, pins) { //INVALID
    }),
    0x23: new M6502_opcode_functions(M6502_stock_matrix[0x23],
        function(regs, pins) { //INVALID
    }),
    0x24: new M6502_opcode_functions(M6502_stock_matrix[0x24],
        function(regs, pins) { //BIT d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    regs.P.Z = +((regs.A & regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    this.regs.P.V = (regs.TR & 0x40) >>> 6;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x25: new M6502_opcode_functions(M6502_stock_matrix[0x25],
        function(regs, pins) { //AND d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A &= regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.N) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x26: new M6502_opcode_functions(M6502_stock_matrix[0x26],
        function(regs, pins) { //ROL d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.RW = 1;
                    break;
                case 4:
                    let c = this.regs.P.C;
                    regs.P.C = (regs.TR & 0x80) >>> 7;
                    regs.TR = (regs.TR << 1) | c;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 5: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x27: new M6502_opcode_functions(M6502_stock_matrix[0x27],
        function(regs, pins) { //INVALID
    }),
    0x28: new M6502_opcode_functions(M6502_stock_matrix[0x28],
        function(regs, pins) { //PLP
            switch(regs.TCU) {
                case 1:
                    break;
                case 2:
                    regs.S = (regs.S + 1) & 0xFF;
                    pins.Addr = regs.S | 0x100;
                    break;
                case 3: // cleanup_custom
                    regs.P.setbyte(pins.D);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x29: new M6502_opcode_functions(M6502_stock_matrix[0x29],
        function(regs, pins) { //AND #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A &= regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.N) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x2A: new M6502_opcode_functions(M6502_stock_matrix[0x2A],
        function(regs, pins) { //ROL A
            switch(regs.TCU) {
                case 1:
                    let c = this.regs.P.C;
                    regs.P.C = (regs.A & 0x80) >>> 7;
                    regs.A = (regs.A << 1) | c;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x2B: new M6502_opcode_functions(M6502_stock_matrix[0x2B],
        function(regs, pins) { //INVALID
    }),
    0x2C: new M6502_opcode_functions(M6502_stock_matrix[0x2C],
        function(regs, pins) { //BIT a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    regs.P.Z = +((regs.A & regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    this.regs.P.V = (regs.TR & 0x40) >>> 6;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x2D: new M6502_opcode_functions(M6502_stock_matrix[0x2D],
        function(regs, pins) { //AND a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    regs.A &= regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.N) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x2E: new M6502_opcode_functions(M6502_stock_matrix[0x2E],
        function(regs, pins) { //ROL a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4:
                    regs.TR = pins.D;
                    pins.RW = 1;
                    break;
                case 5:
                    let c = this.regs.P.C;
                    regs.P.C = (regs.TR & 0x80) >>> 7;
                    regs.TR = (regs.TR << 1) | c;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x2F: new M6502_opcode_functions(M6502_stock_matrix[0x2F],
        function(regs, pins) { //INVALID
    }),
    0x30: new M6502_opcode_functions(M6502_stock_matrix[0x30],
        function(regs, pins) { //BMI r
            switch(regs.TCU) {
                case 1:
                    regs.TR = +(regs.P.N === 1);
                    if (!regs.TR) { regs.TCU += 2; break; }
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = (regs.PC + pins.D) & 0xFFFF;
                    pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                    if ((regs.TA & 0xFF00) === (PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                    break;
                case 3: // extra idle on page cross
                    break;
                case 4: // cleanup_custom
                    regs.PC = regs.TA;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x31: new M6502_opcode_functions(M6502_stock_matrix[0x31],
        function(regs, pins) { //AND (d),x
            switch(regs.TCU) {
                case 1: // Get ZP
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // get ABS L
                    pins.Addr = pins.D;
                    break;
                case 3: // get ABS H
                    regs.TR = pins.D;
                    regs.TA = pins.D + regs.Y;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 4: // idle if crossed
                    regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                    regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                    if (regs.TR & 0xFF00 === regs.TA & 0xFF00) { regs.TCU++; pins.Addr = regs.TA; }
                    else pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                    break;
                case 5:
                    pins.Addr = regs.TA;
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A &= regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.N) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x32: new M6502_opcode_functions(M6502_stock_matrix[0x32],
        function(regs, pins) { //INVALID
    }),
    0x33: new M6502_opcode_functions(M6502_stock_matrix[0x33],
        function(regs, pins) { //INVALID
    }),
    0x34: new M6502_opcode_functions(M6502_stock_matrix[0x34],
        function(regs, pins) { //INVALID
    }),
    0x35: new M6502_opcode_functions(M6502_stock_matrix[0x35],
        function(regs, pins) { //AND d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A &= regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.N) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x36: new M6502_opcode_functions(M6502_stock_matrix[0x36],
        function(regs, pins) { //ROL d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // spurious write
                    pins.RW = 1;
                    let c = this.regs.P.C;
                    regs.P.C = (regs.TR & 0x80) >>> 7;
                    regs.TR = (regs.TR << 1) | c;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    break;
                case 5:
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x37: new M6502_opcode_functions(M6502_stock_matrix[0x37],
        function(regs, pins) { //INVALID
    }),
    0x38: new M6502_opcode_functions(M6502_stock_matrix[0x38],
        function(regs, pins) { //SEC
            switch(regs.TCU) {
                case 1:
                    regs.P.C = 1;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x39: new M6502_opcode_functions(M6502_stock_matrix[0x39],
        function(regs, pins) { //AND a,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.Y) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.A &= regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.N) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x3A: new M6502_opcode_functions(M6502_stock_matrix[0x3A],
        function(regs, pins) { //INVALID
    }),
    0x3B: new M6502_opcode_functions(M6502_stock_matrix[0x3B],
        function(regs, pins) { //INVALID
    }),
    0x3C: new M6502_opcode_functions(M6502_stock_matrix[0x3C],
        function(regs, pins) { //INVALID
    }),
    0x3D: new M6502_opcode_functions(M6502_stock_matrix[0x3D],
        function(regs, pins) { //AND a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.X) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.A &= regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.N) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x3E: new M6502_opcode_functions(M6502_stock_matrix[0x3E],
        function(regs, pins) { //ROL a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3: // spurious read
                    regs.TA |= pins.D << 8;
                    pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.X) & 0xFF);
                    break;
                case 4: // real read
                    pins.Addr = regs.TA;
                    break;
                case 5:
                    regs.TR = pins.D
                    pins.RW = 1;
                    break;
                case 6:
                    let c = this.regs.P.C;
                    regs.P.C = (regs.TR & 0x80) >>> 7;
                    regs.TR = (regs.TR << 1) | c;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 7: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x3F: new M6502_opcode_functions(M6502_stock_matrix[0x3F],
        function(regs, pins) { //INVALID
    }),
    0x40: new M6502_opcode_functions(M6502_stock_matrix[0x40],
        function(regs, pins) { //RTI
            switch(regs.TCU) {
                case 1:
                    break;
                case 2:
                    regs.S = (regs.S + 1) & 0xFF;
                    pins.Addr = regs.S | 0x100;
                    break;
                case 3:
                    regs.P.setbyte(pins.D);
                    regs.S = (regs.S + 1) & 0xFF;
                    pins.Addr = regs.S | 0x100;
                    break;
                case 4:
                    regs.PC = pins.D;
                    regs.S = (regs.S + 1) & 0xFF;
                    pins.Addr = regs.S | 0x100;
                    break;
                case 5:
                    regs.PC |= (pins.D << 8);
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x41: new M6502_opcode_functions(M6502_stock_matrix[0x41],
        function(regs, pins) { //EOR (d,x)
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    regs.TA = pins.D + regs.X;
                    break;
                case 3: // real read ABS L
                    pins.Addr = regs.TA;
                    break;
                case 4: // read ABS H
                    regs.TA = pins.D;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 5: // Read from addr
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.A ^ regs.TR;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x42: new M6502_opcode_functions(M6502_stock_matrix[0x42],
        function(regs, pins) { //INVALID
    }),
    0x43: new M6502_opcode_functions(M6502_stock_matrix[0x43],
        function(regs, pins) { //INVALID
    }),
    0x44: new M6502_opcode_functions(M6502_stock_matrix[0x44],
        function(regs, pins) { //INVALID
    }),
    0x45: new M6502_opcode_functions(M6502_stock_matrix[0x45],
        function(regs, pins) { //EOR d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.A ^ regs.TR;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x46: new M6502_opcode_functions(M6502_stock_matrix[0x46],
        function(regs, pins) { //LSR d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.RW = 1;
                    break;
                case 4:
                    regs.P.C = regs.TR & 1;
                    regs.TR >>>= 1;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = 0;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 5: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x47: new M6502_opcode_functions(M6502_stock_matrix[0x47],
        function(regs, pins) { //INVALID
    }),
    0x48: new M6502_opcode_functions(M6502_stock_matrix[0x48],
        function(regs, pins) { //PHA
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = regs.A
                    pins.RW = 1;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x49: new M6502_opcode_functions(M6502_stock_matrix[0x49],
        function(regs, pins) { //EOR #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.A ^ regs.TR;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x4A: new M6502_opcode_functions(M6502_stock_matrix[0x4A],
        function(regs, pins) { //LSR A
            switch(regs.TCU) {
                case 1:
                    regs.P.C = regs.A & 1;
                    regs.A >>>= 1;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = 0;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x4B: new M6502_opcode_functions(M6502_stock_matrix[0x4B],
        function(regs, pins) { //INVALID
    }),
    0x4C: new M6502_opcode_functions(M6502_stock_matrix[0x4C],
        function(regs, pins) { //JMP a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3: // cleanup_custom
                    regs.PC = regs.TA | (pins.D << 8);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x4D: new M6502_opcode_functions(M6502_stock_matrix[0x4D],
        function(regs, pins) { //EOR a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    regs.TR = regs.A ^ regs.TR;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x4E: new M6502_opcode_functions(M6502_stock_matrix[0x4E],
        function(regs, pins) { //LSR a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4:
                    regs.TR = pins.D;
                    pins.RW = 1;
                    break;
                case 5:
                    regs.P.C = regs.TR & 1;
                    regs.TR >>>= 1;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = 0;
                    pins.D = regs.TR
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x4F: new M6502_opcode_functions(M6502_stock_matrix[0x4F],
        function(regs, pins) { //INVALID
    }),
    0x50: new M6502_opcode_functions(M6502_stock_matrix[0x50],
        function(regs, pins) { //BVC r
            switch(regs.TCU) {
                case 1:
                    regs.TR = +(regs.P.V === 0);
                    if (!regs.TR) { regs.TCU += 2; break; }
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = (regs.PC + pins.D) & 0xFFFF;
                    pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                    if ((regs.TA & 0xFF00) === (PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                    break;
                case 3: // extra idle on page cross
                    break;
                case 4: // cleanup_custom
                    regs.PC = regs.TA;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x51: new M6502_opcode_functions(M6502_stock_matrix[0x51],
        function(regs, pins) { //EOR (d),y
            switch(regs.TCU) {
                case 1: // Get ZP
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // get ABS L
                    pins.Addr = pins.D;
                    break;
                case 3: // get ABS H
                    regs.TR = pins.D;
                    regs.TA = pins.D + regs.Y;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 4: // idle if crossed
                    regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                    regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                    if (regs.TR & 0xFF00 === regs.TA & 0xFF00) { regs.TCU++; pins.Addr = regs.TA; }
                    else pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                    break;
                case 5:
                    pins.Addr = regs.TA;
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.A ^ regs.TR;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x52: new M6502_opcode_functions(M6502_stock_matrix[0x52],
        function(regs, pins) { //INVALID
    }),
    0x53: new M6502_opcode_functions(M6502_stock_matrix[0x53],
        function(regs, pins) { //INVALID
    }),
    0x54: new M6502_opcode_functions(M6502_stock_matrix[0x54],
        function(regs, pins) { //INVALID
    }),
    0x55: new M6502_opcode_functions(M6502_stock_matrix[0x55],
        function(regs, pins) { //EOR d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = regs.A ^ regs.TR;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x56: new M6502_opcode_functions(M6502_stock_matrix[0x56],
        function(regs, pins) { //LSR d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // spurious write
                    pins.RW = 1;
                    regs.P.C = regs.TR & 1;
                    regs.TR >>>= 1;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = 0;
                    break;
                case 5:
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x57: new M6502_opcode_functions(M6502_stock_matrix[0x57],
        function(regs, pins) { //INVALID
    }),
    0x58: new M6502_opcode_functions(M6502_stock_matrix[0x58],
        function(regs, pins) { //CLI
            switch(regs.TCU) {
                case 1:
                    regs.P.I = 0;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x59: new M6502_opcode_functions(M6502_stock_matrix[0x59],
        function(regs, pins) { //EOR a,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.Y) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.TR = regs.A ^ regs.TR;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x5A: new M6502_opcode_functions(M6502_stock_matrix[0x5A],
        function(regs, pins) { //INVALID
    }),
    0x5B: new M6502_opcode_functions(M6502_stock_matrix[0x5B],
        function(regs, pins) { //INVALID
    }),
    0x5C: new M6502_opcode_functions(M6502_stock_matrix[0x5C],
        function(regs, pins) { //INVALID
    }),
    0x5D: new M6502_opcode_functions(M6502_stock_matrix[0x5D],
        function(regs, pins) { //EOR a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.X) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.TR = regs.A ^ regs.TR;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x5E: new M6502_opcode_functions(M6502_stock_matrix[0x5E],
        function(regs, pins) { //LSR a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3: // spurious read
                    regs.TA |= pins.D << 8;
                    pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.X) & 0xFF);
                    break;
                case 4: // real read
                    pins.Addr = regs.TA;
                    break;
                case 5:
                    regs.TR = pins.D
                    pins.RW = 1;
                    break;
                case 6:
                    regs.P.C = regs.TR & 1;
                    regs.TR >>>= 1;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = 0;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 7: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x5F: new M6502_opcode_functions(M6502_stock_matrix[0x5F],
        function(regs, pins) { //INVALID
    }),
    0x60: new M6502_opcode_functions(M6502_stock_matrix[0x60],
        function(regs, pins) { //RTS
            switch(regs.TCU) {
                case 1:
                    break;
                case 2:
                    regs.S = (regs.S + 1) & 0xFF;
                    pins.Addr = regs.S | 0x100;
                    break;
                case 3:
                    regs.PC = pins.D;
                    regs.S = (regs.S + 1) & 0xFF;
                    pins.Addr = regs.S | 0x100;
                    break;
                case 4:
                    regs.PC |= (pins.D << 8);
                    regs.PC = (regs.PC + 1) & 0xFFFF
                    // Following is auto-generated code for instruction finish
                    break;
                case 5: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x61: new M6502_opcode_functions(M6502_stock_matrix[0x61],
        function(regs, pins) { //ADC (d,x)
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    regs.TA = pins.D + regs.X;
                    break;
                case 3: // real read ABS L
                    pins.Addr = regs.TA;
                    break;
                case 4: // read ABS H
                    regs.TA = pins.D;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 5: // Read from addr
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    let o;
                    o = regs.TR + regs.A + regs.P.C;
                    regs.P.V = ((~(regs.A ^ regs.TR)) & (A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x62: new M6502_opcode_functions(M6502_stock_matrix[0x62],
        function(regs, pins) { //INVALID
    }),
    0x63: new M6502_opcode_functions(M6502_stock_matrix[0x63],
        function(regs, pins) { //INVALID
    }),
    0x64: new M6502_opcode_functions(M6502_stock_matrix[0x64],
        function(regs, pins) { //INVALID
    }),
    0x65: new M6502_opcode_functions(M6502_stock_matrix[0x65],
        function(regs, pins) { //ADC d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    let o;
                    o = regs.TR + regs.A + regs.P.C;
                    regs.P.V = ((~(regs.A ^ regs.TR)) & (A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x66: new M6502_opcode_functions(M6502_stock_matrix[0x66],
        function(regs, pins) { //ROR d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.RW = 1;
                    break;
                case 4:
                    let c = regs.P.C;
                    regs.P.C = regs.TR & 1;
                    regs.TR = (c << 7) | (regs.TR >>> 1);
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 5: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x67: new M6502_opcode_functions(M6502_stock_matrix[0x67],
        function(regs, pins) { //INVALID
    }),
    0x68: new M6502_opcode_functions(M6502_stock_matrix[0x68],
        function(regs, pins) { //PLA
            switch(regs.TCU) {
                case 1:
                    break;
                case 2:
                    regs.S = (regs.S + 1) & 0xFF;
                    pins.Addr = regs.S | 0x100;
                    break;
                case 3: // cleanup_custom
                    regs.A = pins.D;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x69: new M6502_opcode_functions(M6502_stock_matrix[0x69],
        function(regs, pins) { //ADC #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    let o;
                    o = regs.TR + regs.A + regs.P.C;
                    regs.P.V = ((~(regs.A ^ regs.TR)) & (A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x6A: new M6502_opcode_functions(M6502_stock_matrix[0x6A],
        function(regs, pins) { //ROR A
            switch(regs.TCU) {
                case 1:
                    let c = regs.P.C;
                    regs.P.C = regs.A & 1;
                    regs.A = (c << 7) | (regs.A >>> 1);
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x6B: new M6502_opcode_functions(M6502_stock_matrix[0x6B],
        function(regs, pins) { //INVALID
    }),
    0x6C: new M6502_opcode_functions(M6502_stock_matrix[0x6C],
        function(regs, pins) { //JMP (d)
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4:
                    regs.TA = (pins.D + 1) & 0xFF;
                    break;
                case 5: // cleanup_custom
                    regs.PC = (pins.D << 8) | regs.TA;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x6D: new M6502_opcode_functions(M6502_stock_matrix[0x6D],
        function(regs, pins) { //ADC a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    let o;
                    o = regs.TR + regs.A + regs.P.C;
                    regs.P.V = ((~(regs.A ^ regs.TR)) & (A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x6E: new M6502_opcode_functions(M6502_stock_matrix[0x6E],
        function(regs, pins) { //ROR a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4:
                    regs.TR = pins.D;
                    pins.RW = 1;
                    break;
                case 5:
                    let c = regs.P.C;
                    regs.P.C = regs.TR & 1;
                    regs.TR = (c << 7) | (regs.TR >>> 1);
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x6F: new M6502_opcode_functions(M6502_stock_matrix[0x6F],
        function(regs, pins) { //INVALID
    }),
    0x70: new M6502_opcode_functions(M6502_stock_matrix[0x70],
        function(regs, pins) { //BVS r
            switch(regs.TCU) {
                case 1:
                    regs.TR = +(regs.P.V === 1);
                    if (!regs.TR) { regs.TCU += 2; break; }
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = (regs.PC + pins.D) & 0xFFFF;
                    pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                    if ((regs.TA & 0xFF00) === (PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                    break;
                case 3: // extra idle on page cross
                    break;
                case 4: // cleanup_custom
                    regs.PC = regs.TA;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x71: new M6502_opcode_functions(M6502_stock_matrix[0x71],
        function(regs, pins) { //ADC (d),y
            switch(regs.TCU) {
                case 1: // Get ZP
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // get ABS L
                    pins.Addr = pins.D;
                    break;
                case 3: // get ABS H
                    regs.TR = pins.D;
                    regs.TA = pins.D + regs.Y;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 4: // idle if crossed
                    regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                    regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                    if (regs.TR & 0xFF00 === regs.TA & 0xFF00) { regs.TCU++; pins.Addr = regs.TA; }
                    else pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                    break;
                case 5:
                    pins.Addr = regs.TA;
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    let o;
                    o = regs.TR + regs.A + regs.P.C;
                    regs.P.V = ((~(regs.A ^ regs.TR)) & (A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x72: new M6502_opcode_functions(M6502_stock_matrix[0x72],
        function(regs, pins) { //INVALID
    }),
    0x73: new M6502_opcode_functions(M6502_stock_matrix[0x73],
        function(regs, pins) { //INVALID
    }),
    0x74: new M6502_opcode_functions(M6502_stock_matrix[0x74],
        function(regs, pins) { //INVALID
    }),
    0x75: new M6502_opcode_functions(M6502_stock_matrix[0x75],
        function(regs, pins) { //ADC d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // cleanup_custom
                    regs.TR = pins.D;
                    let o;
                    o = regs.TR + regs.A + regs.P.C;
                    regs.P.V = ((~(regs.A ^ regs.TR)) & (A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x76: new M6502_opcode_functions(M6502_stock_matrix[0x76],
        function(regs, pins) { //ROR d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // spurious write
                    pins.RW = 1;
                    let c = regs.P.C;
                    regs.P.C = regs.TR & 1;
                    regs.TR = (c << 7) | (regs.TR >>> 1);
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    break;
                case 5:
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x77: new M6502_opcode_functions(M6502_stock_matrix[0x77],
        function(regs, pins) { //INVALID
    }),
    0x78: new M6502_opcode_functions(M6502_stock_matrix[0x78],
        function(regs, pins) { //SEI
            switch(regs.TCU) {
                case 1:
                    regs.P.I = 1;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x79: new M6502_opcode_functions(M6502_stock_matrix[0x79],
        function(regs, pins) { //ADC a,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.Y) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    let o;
                    o = regs.TR + regs.A + regs.P.C;
                    regs.P.V = ((~(regs.A ^ regs.TR)) & (A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x7A: new M6502_opcode_functions(M6502_stock_matrix[0x7A],
        function(regs, pins) { //INVALID
    }),
    0x7B: new M6502_opcode_functions(M6502_stock_matrix[0x7B],
        function(regs, pins) { //INVALID
    }),
    0x7C: new M6502_opcode_functions(M6502_stock_matrix[0x7C],
        function(regs, pins) { //INVALID
    }),
    0x7D: new M6502_opcode_functions(M6502_stock_matrix[0x7D],
        function(regs, pins) { //ADC a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.X) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    let o;
                    o = regs.TR + regs.A + regs.P.C;
                    regs.P.V = ((~(regs.A ^ regs.TR)) & (A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x7E: new M6502_opcode_functions(M6502_stock_matrix[0x7E],
        function(regs, pins) { //ROR a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3: // spurious read
                    regs.TA |= pins.D << 8;
                    pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.X) & 0xFF);
                    break;
                case 4: // real read
                    pins.Addr = regs.TA;
                    break;
                case 5:
                    regs.TR = pins.D
                    pins.RW = 1;
                    break;
                case 6:
                    let c = regs.P.C;
                    regs.P.C = regs.TR & 1;
                    regs.TR = (c << 7) | (regs.TR >>> 1);
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 7: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x7F: new M6502_opcode_functions(M6502_stock_matrix[0x7F],
        function(regs, pins) { //INVALID
    }),
    0x80: new M6502_opcode_functions(M6502_stock_matrix[0x80],
        function(regs, pins) { //INVALID
    }),
    0x81: new M6502_opcode_functions(M6502_stock_matrix[0x81],
        function(regs, pins) { //STA (d,x)
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    regs.TA = pins.D + regs.X;
                    break;
                case 3: // real read ABS L
                    pins.Addr = regs.TA;
                    break;
                case 4: // read ABS H
                    regs.TA = pins.D;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 5: // Write result to addr
                    pins.Addr = regs.TA | (pins.D << 8);
                    pins.D = regs.A;
                    pins.RW = 1;
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x82: new M6502_opcode_functions(M6502_stock_matrix[0x82],
        function(regs, pins) { //INVALID
    }),
    0x83: new M6502_opcode_functions(M6502_stock_matrix[0x83],
        function(regs, pins) { //INVALID
    }),
    0x84: new M6502_opcode_functions(M6502_stock_matrix[0x84],
        function(regs, pins) { //STY d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    pins.D = regs.Y;
                    pins.RW = 1;
                    // Following is auto-generated code for instruction finish
                    break;
                case 3: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x85: new M6502_opcode_functions(M6502_stock_matrix[0x85],
        function(regs, pins) { //STA d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    pins.D = regs.A;
                    pins.RW = 1;
                    // Following is auto-generated code for instruction finish
                    break;
                case 3: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x86: new M6502_opcode_functions(M6502_stock_matrix[0x86],
        function(regs, pins) { //STX d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    pins.D = regs.X;
                    pins.RW = 1;
                    // Following is auto-generated code for instruction finish
                    break;
                case 3: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x87: new M6502_opcode_functions(M6502_stock_matrix[0x87],
        function(regs, pins) { //INVALID
    }),
    0x88: new M6502_opcode_functions(M6502_stock_matrix[0x88],
        function(regs, pins) { //DEY
    }),
    0x89: new M6502_opcode_functions(M6502_stock_matrix[0x89],
        function(regs, pins) { //INVALID
    }),
    0x8A: new M6502_opcode_functions(M6502_stock_matrix[0x8A],
        function(regs, pins) { //TXA
            switch(regs.TCU) {
                case 1:
                    regs.A = regs.X;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x8B: new M6502_opcode_functions(M6502_stock_matrix[0x8B],
        function(regs, pins) { //INVALID
    }),
    0x8C: new M6502_opcode_functions(M6502_stock_matrix[0x8C],
        function(regs, pins) { //STY a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    pins.D = regs.Y;
                    // Following is auto-generated code for instruction finish
                    break;
                case 4: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x8D: new M6502_opcode_functions(M6502_stock_matrix[0x8D],
        function(regs, pins) { //STA a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    pins.D = regs.A;
                    // Following is auto-generated code for instruction finish
                    break;
                case 4: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x8E: new M6502_opcode_functions(M6502_stock_matrix[0x8E],
        function(regs, pins) { //STX a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    pins.D = regs.X;
                    // Following is auto-generated code for instruction finish
                    break;
                case 4: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x8F: new M6502_opcode_functions(M6502_stock_matrix[0x8F],
        function(regs, pins) { //INVALID
    }),
    0x90: new M6502_opcode_functions(M6502_stock_matrix[0x90],
        function(regs, pins) { //BCC
            switch(regs.TCU) {
                case 1:
                    regs.TR = +(regs.P.C === 0);
                    if (!regs.TR) { regs.TCU += 2; break; }
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = (regs.PC + pins.D) & 0xFFFF;
                    pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                    if ((regs.TA & 0xFF00) === (PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                    break;
                case 3: // extra idle on page cross
                    break;
                case 4: // cleanup_custom
                    regs.PC = regs.TA;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x91: new M6502_opcode_functions(M6502_stock_matrix[0x91],
        function(regs, pins) { //STA (d),y
            switch(regs.TCU) {
                case 1: // get ZP
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // get ABS L
                    pins.Addr = pins.D;
                    break;
                case 3: // get ABS H
                    regs.TA = pins.D;
                    regs.TR = (pins.D + regs.Y) & 0xFF;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 4: // always idle
                    regs.TA |= pins.D << 8;
                    pins.Addr = (pins.D << 8) | regs.TR;
                    break;
                case 5: // write data
                    pins.Addr = regs.TA;
                    pins.RW = 1;
                    pins.D = regs.A;
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x92: new M6502_opcode_functions(M6502_stock_matrix[0x92],
        function(regs, pins) { //INVALID
    }),
    0x93: new M6502_opcode_functions(M6502_stock_matrix[0x93],
        function(regs, pins) { //INVALID
    }),
    0x94: new M6502_opcode_functions(M6502_stock_matrix[0x94],
        function(regs, pins) { //STY d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    pins.RW = 1;
                    pins.D = regs.Y;
                    // Following is auto-generated code for instruction finish
                    break;
                case 3: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x95: new M6502_opcode_functions(M6502_stock_matrix[0x95],
        function(regs, pins) { //STA d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    pins.RW = 1;
                    pins.D = regs.A;
                    // Following is auto-generated code for instruction finish
                    break;
                case 3: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x96: new M6502_opcode_functions(M6502_stock_matrix[0x96],
        function(regs, pins) { //STZ d,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = (pins.D + regs.Y) & 0xFFFF;
                    pins.RW = 1;
                    pins.D = 0;
                    // Following is auto-generated code for instruction finish
                    break;
                case 3: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x97: new M6502_opcode_functions(M6502_stock_matrix[0x97],
        function(regs, pins) { //INVALID
    }),
    0x98: new M6502_opcode_functions(M6502_stock_matrix[0x98],
        function(regs, pins) { //TYA
            switch(regs.TCU) {
                case 1:
                    regs.A = regs.Y;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x99: new M6502_opcode_functions(M6502_stock_matrix[0x99],
        function(regs, pins) { //STA a,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    regs.TA |= pins.D << 8;
                    pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.Y) & 0xFF);
                    break;
                case 4:
                    pins.Addr = regs.TA;
                    pins.RW = 1;
                    pins.D = regs.A;
                    // Following is auto-generated code for instruction finish
                    break;
                case 5: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x9A: new M6502_opcode_functions(M6502_stock_matrix[0x9A],
        function(regs, pins) { //TXS
            switch(regs.TCU) {
                case 1:
                    regs.S = regs.X;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x9B: new M6502_opcode_functions(M6502_stock_matrix[0x9B],
        function(regs, pins) { //INVALID
    }),
    0x9C: new M6502_opcode_functions(M6502_stock_matrix[0x9C],
        function(regs, pins) { //INVALID
    }),
    0x9D: new M6502_opcode_functions(M6502_stock_matrix[0x9D],
        function(regs, pins) { //STA a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    regs.TA |= pins.D << 8;
                    pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.X) & 0xFF);
                    break;
                case 4:
                    pins.Addr = regs.TA;
                    pins.RW = 1;
                    pins.D = regs.A;
                    // Following is auto-generated code for instruction finish
                    break;
                case 5: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x9E: new M6502_opcode_functions(M6502_stock_matrix[0x9E],
        function(regs, pins) { //INVALID
    }),
    0x9F: new M6502_opcode_functions(M6502_stock_matrix[0x9F],
        function(regs, pins) { //INVALID
    }),
    0xA0: new M6502_opcode_functions(M6502_stock_matrix[0xA0],
        function(regs, pins) { //LDY #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.Y = regs.TR;
                    regs.P.Z = +((regs.Y) === 0);
                    regs.P.N = ((regs.Y) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xA1: new M6502_opcode_functions(M6502_stock_matrix[0xA1],
        function(regs, pins) { //LDA (d,x)
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    regs.TA = pins.D + regs.X;
                    break;
                case 3: // real read ABS L
                    pins.Addr = regs.TA;
                    break;
                case 4: // read ABS H
                    regs.TA = pins.D;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 5: // Read from addr
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A = regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xA2: new M6502_opcode_functions(M6502_stock_matrix[0xA2],
        function(regs, pins) { //LDX #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.X = regs.TR;
                    regs.P.Z = +((regs.X) === 0);
                    regs.P.N = ((regs.X) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xA3: new M6502_opcode_functions(M6502_stock_matrix[0xA3],
        function(regs, pins) { //INVALID
    }),
    0xA4: new M6502_opcode_functions(M6502_stock_matrix[0xA4],
        function(regs, pins) { //LDY d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    regs.Y = regs.TR;
                    regs.P.Z = +((regs.Y) === 0);
                    regs.P.N = ((regs.Y) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xA5: new M6502_opcode_functions(M6502_stock_matrix[0xA5],
        function(regs, pins) { //LDA d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A = regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xA6: new M6502_opcode_functions(M6502_stock_matrix[0xA6],
        function(regs, pins) { //LDX d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    regs.X = regs.TR;
                    regs.P.Z = +((regs.X) === 0);
                    regs.P.N = ((regs.X) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xA7: new M6502_opcode_functions(M6502_stock_matrix[0xA7],
        function(regs, pins) { //INVALID
    }),
    0xA8: new M6502_opcode_functions(M6502_stock_matrix[0xA8],
        function(regs, pins) { //TAY
            switch(regs.TCU) {
                case 1:
                    regs.Y = regs.A;
                    regs.P.Z = +((regs.Y) === 0);
                    regs.P.N = ((regs.Y) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xA9: new M6502_opcode_functions(M6502_stock_matrix[0xA9],
        function(regs, pins) { //LDA #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A = regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xAA: new M6502_opcode_functions(M6502_stock_matrix[0xAA],
        function(regs, pins) { //TAX
            switch(regs.TCU) {
                case 1:
                    regs.X = regs.A;
                    regs.P.Z = +((regs.X) === 0);
                    regs.P.N = ((regs.X) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xAB: new M6502_opcode_functions(M6502_stock_matrix[0xAB],
        function(regs, pins) { //INVALID
    }),
    0xAC: new M6502_opcode_functions(M6502_stock_matrix[0xAC],
        function(regs, pins) { //LDY a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    regs.Y = regs.TR;
                    regs.P.Z = +((regs.Y) === 0);
                    regs.P.N = ((regs.Y) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xAD: new M6502_opcode_functions(M6502_stock_matrix[0xAD],
        function(regs, pins) { //LDA a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    regs.A = regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xAE: new M6502_opcode_functions(M6502_stock_matrix[0xAE],
        function(regs, pins) { //LDX a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    regs.X = regs.TR;
                    regs.P.Z = +((regs.X) === 0);
                    regs.P.N = ((regs.X) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xAF: new M6502_opcode_functions(M6502_stock_matrix[0xAF],
        function(regs, pins) { //INVALID
    }),
    0xB0: new M6502_opcode_functions(M6502_stock_matrix[0xB0],
        function(regs, pins) { //BCS r
            switch(regs.TCU) {
                case 1:
                    regs.TR = +(regs.P.C === 1);
                    if (!regs.TR) { regs.TCU += 2; break; }
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = (regs.PC + pins.D) & 0xFFFF;
                    pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                    if ((regs.TA & 0xFF00) === (PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                    break;
                case 3: // extra idle on page cross
                    break;
                case 4: // cleanup_custom
                    regs.PC = regs.TA;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xB1: new M6502_opcode_functions(M6502_stock_matrix[0xB1],
        function(regs, pins) { //LDA (d),y
            switch(regs.TCU) {
                case 1: // Get ZP
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // get ABS L
                    pins.Addr = pins.D;
                    break;
                case 3: // get ABS H
                    regs.TR = pins.D;
                    regs.TA = pins.D + regs.Y;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 4: // idle if crossed
                    regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                    regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                    if (regs.TR & 0xFF00 === regs.TA & 0xFF00) { regs.TCU++; pins.Addr = regs.TA; }
                    else pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                    break;
                case 5:
                    pins.Addr = regs.TA;
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A = regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xB2: new M6502_opcode_functions(M6502_stock_matrix[0xB2],
        function(regs, pins) { //INVALID
    }),
    0xB3: new M6502_opcode_functions(M6502_stock_matrix[0xB3],
        function(regs, pins) { //INVALID
    }),
    0xB4: new M6502_opcode_functions(M6502_stock_matrix[0xB4],
        function(regs, pins) { //LDY d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // cleanup_custom
                    regs.TR = pins.D;
                    regs.Y = regs.TR;
                    regs.P.Z = +((regs.Y) === 0);
                    regs.P.N = ((regs.Y) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xB5: new M6502_opcode_functions(M6502_stock_matrix[0xB5],
        function(regs, pins) { //LDA d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // cleanup_custom
                    regs.TR = pins.D;
                    regs.A = regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xB6: new M6502_opcode_functions(M6502_stock_matrix[0xB6],
        function(regs, pins) { //LDX d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // cleanup_custom
                    regs.TR = pins.D;
                    regs.X = regs.TR;
                    regs.P.Z = +((regs.X) === 0);
                    regs.P.N = ((regs.X) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xB7: new M6502_opcode_functions(M6502_stock_matrix[0xB7],
        function(regs, pins) { //INVALID
    }),
    0xB8: new M6502_opcode_functions(M6502_stock_matrix[0xB8],
        function(regs, pins) { //CLV
            switch(regs.TCU) {
                case 1:
                    regs.P.V = 0;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xB9: new M6502_opcode_functions(M6502_stock_matrix[0xB9],
        function(regs, pins) { //LDA a,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.Y) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.A = regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xBA: new M6502_opcode_functions(M6502_stock_matrix[0xBA],
        function(regs, pins) { //TSX
            switch(regs.TCU) {
                case 1:
                    regs.X = regs.S;
                    regs.P.Z = +((regs.X) === 0);
                    regs.P.N = ((regs.X) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xBB: new M6502_opcode_functions(M6502_stock_matrix[0xBB],
        function(regs, pins) { //INVALID
    }),
    0xBC: new M6502_opcode_functions(M6502_stock_matrix[0xBC],
        function(regs, pins) { //LDY a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.X) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.Y = regs.TR;
                    regs.P.Z = +((regs.Y) === 0);
                    regs.P.N = ((regs.Y) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xBD: new M6502_opcode_functions(M6502_stock_matrix[0xBD],
        function(regs, pins) { //LDA a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.X) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.A = regs.TR;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xBE: new M6502_opcode_functions(M6502_stock_matrix[0xBE],
        function(regs, pins) { //LDX a,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.Y) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.X = regs.TR;
                    regs.P.Z = +((regs.X) === 0);
                    regs.P.N = ((regs.X) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xBF: new M6502_opcode_functions(M6502_stock_matrix[0xBF],
        function(regs, pins) { //INVALID
    }),
    0xC0: new M6502_opcode_functions(M6502_stock_matrix[0xC0],
        function(regs, pins) { //CPY #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    let o = regs.Y - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xC1: new M6502_opcode_functions(M6502_stock_matrix[0xC1],
        function(regs, pins) { //CMP (d,x)
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    regs.TA = pins.D + regs.X;
                    break;
                case 3: // real read ABS L
                    pins.Addr = regs.TA;
                    break;
                case 4: // read ABS H
                    regs.TA = pins.D;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 5: // Read from addr
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    let o = regs.A - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xC2: new M6502_opcode_functions(M6502_stock_matrix[0xC2],
        function(regs, pins) { //INVALID
    }),
    0xC3: new M6502_opcode_functions(M6502_stock_matrix[0xC3],
        function(regs, pins) { //INVALID
    }),
    0xC4: new M6502_opcode_functions(M6502_stock_matrix[0xC4],
        function(regs, pins) { //CPY d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    let o = regs.Y - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xC5: new M6502_opcode_functions(M6502_stock_matrix[0xC5],
        function(regs, pins) { //CMP d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    let o = regs.A - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xC6: new M6502_opcode_functions(M6502_stock_matrix[0xC6],
        function(regs, pins) { //DEC d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.RW = 1;
                    break;
                case 4:
                    regs.TR = (regs.TR - 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 5: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xC7: new M6502_opcode_functions(M6502_stock_matrix[0xC7],
        function(regs, pins) { //INVALID
    }),
    0xC8: new M6502_opcode_functions(M6502_stock_matrix[0xC8],
        function(regs, pins) { //INY
    }),
    0xC9: new M6502_opcode_functions(M6502_stock_matrix[0xC9],
        function(regs, pins) { //CMP #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    let o = regs.A - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xCA: new M6502_opcode_functions(M6502_stock_matrix[0xCA],
        function(regs, pins) { //DEX
    }),
    0xCB: new M6502_opcode_functions(M6502_stock_matrix[0xCB],
        function(regs, pins) { //INVALID
    }),
    0xCC: new M6502_opcode_functions(M6502_stock_matrix[0xCC],
        function(regs, pins) { //CPY a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    let o = regs.Y - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xCD: new M6502_opcode_functions(M6502_stock_matrix[0xCD],
        function(regs, pins) { //CMP a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    let o = regs.A - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xCE: new M6502_opcode_functions(M6502_stock_matrix[0xCE],
        function(regs, pins) { //DEC a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4:
                    regs.TR = pins.D;
                    pins.RW = 1;
                    break;
                case 5:
                    regs.TR = (regs.TR - 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xCF: new M6502_opcode_functions(M6502_stock_matrix[0xCF],
        function(regs, pins) { //INVALID
    }),
    0xD0: new M6502_opcode_functions(M6502_stock_matrix[0xD0],
        function(regs, pins) { //BNE r
            switch(regs.TCU) {
                case 1:
                    regs.TR = +(regs.P.Z === 0);
                    if (!regs.TR) { regs.TCU += 2; break; }
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = (regs.PC + pins.D) & 0xFFFF;
                    pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                    if ((regs.TA & 0xFF00) === (PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                    break;
                case 3: // extra idle on page cross
                    break;
                case 4: // cleanup_custom
                    regs.PC = regs.TA;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xD1: new M6502_opcode_functions(M6502_stock_matrix[0xD1],
        function(regs, pins) { //CMP (d),y
            switch(regs.TCU) {
                case 1: // Get ZP
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // get ABS L
                    pins.Addr = pins.D;
                    break;
                case 3: // get ABS H
                    regs.TR = pins.D;
                    regs.TA = pins.D + regs.Y;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 4: // idle if crossed
                    regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                    regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                    if (regs.TR & 0xFF00 === regs.TA & 0xFF00) { regs.TCU++; pins.Addr = regs.TA; }
                    else pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                    break;
                case 5:
                    pins.Addr = regs.TA;
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    let o = regs.A - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xD2: new M6502_opcode_functions(M6502_stock_matrix[0xD2],
        function(regs, pins) { //INVALID
    }),
    0xD3: new M6502_opcode_functions(M6502_stock_matrix[0xD3],
        function(regs, pins) { //INVALID
    }),
    0xD4: new M6502_opcode_functions(M6502_stock_matrix[0xD4],
        function(regs, pins) { //INVALID
    }),
    0xD5: new M6502_opcode_functions(M6502_stock_matrix[0xD5],
        function(regs, pins) { //CMP d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // cleanup_custom
                    regs.TR = pins.D;
                    let o = regs.A - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xD6: new M6502_opcode_functions(M6502_stock_matrix[0xD6],
        function(regs, pins) { //DEC d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // spurious write
                    pins.RW = 1;
                    regs.TR = (regs.TR - 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    break;
                case 5:
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xD7: new M6502_opcode_functions(M6502_stock_matrix[0xD7],
        function(regs, pins) { //INVALID
    }),
    0xD8: new M6502_opcode_functions(M6502_stock_matrix[0xD8],
        function(regs, pins) { //CLD
            switch(regs.TCU) {
                case 1:
                    regs.P.D = 0;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xD9: new M6502_opcode_functions(M6502_stock_matrix[0xD9],
        function(regs, pins) { //CMP a,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.Y) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    let o = regs.A - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xDA: new M6502_opcode_functions(M6502_stock_matrix[0xDA],
        function(regs, pins) { //INVALID
    }),
    0xDB: new M6502_opcode_functions(M6502_stock_matrix[0xDB],
        function(regs, pins) { //INVALID
    }),
    0xDC: new M6502_opcode_functions(M6502_stock_matrix[0xDC],
        function(regs, pins) { //INVALID
    }),
    0xDD: new M6502_opcode_functions(M6502_stock_matrix[0xDD],
        function(regs, pins) { //CMP a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.X) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    let o = regs.A - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xDE: new M6502_opcode_functions(M6502_stock_matrix[0xDE],
        function(regs, pins) { //DEC a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3: // spurious read
                    regs.TA |= pins.D << 8;
                    pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.X) & 0xFF);
                    break;
                case 4: // real read
                    pins.Addr = regs.TA;
                    break;
                case 5:
                    regs.TR = pins.D
                    pins.RW = 1;
                    break;
                case 6:
                    regs.TR = (regs.TR - 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 7: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xDF: new M6502_opcode_functions(M6502_stock_matrix[0xDF],
        function(regs, pins) { //INVALID
    }),
    0xE0: new M6502_opcode_functions(M6502_stock_matrix[0xE0],
        function(regs, pins) { //CPX #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    let o = regs.X - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xE1: new M6502_opcode_functions(M6502_stock_matrix[0xE1],
        function(regs, pins) { //SBC (d,x)
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    regs.TA = pins.D + regs.X;
                    break;
                case 3: // real read ABS L
                    pins.Addr = regs.TA;
                    break;
                case 4: // read ABS H
                    regs.TA = pins.D;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 5: // Read from addr
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (~regs.TR) & 0xFF;
                    let i = (~regs.TR) & 0xFF;
                    let o = regs.A + i + regs.P.C;
                    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xE2: new M6502_opcode_functions(M6502_stock_matrix[0xE2],
        function(regs, pins) { //INVALID
    }),
    0xE3: new M6502_opcode_functions(M6502_stock_matrix[0xE3],
        function(regs, pins) { //INVALID
    }),
    0xE4: new M6502_opcode_functions(M6502_stock_matrix[0xE4],
        function(regs, pins) { //CPX d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    let o = regs.X - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xE5: new M6502_opcode_functions(M6502_stock_matrix[0xE5],
        function(regs, pins) { //SBC d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (~regs.TR) & 0xFF;
                    let i = (~regs.TR) & 0xFF;
                    let o = regs.A + i + regs.P.C;
                    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xE6: new M6502_opcode_functions(M6502_stock_matrix[0xE6],
        function(regs, pins) { //INC d
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.RW = 1;
                    break;
                case 4:
                    regs.TR = (regs.TR + 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 5: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xE7: new M6502_opcode_functions(M6502_stock_matrix[0xE7],
        function(regs, pins) { //INVALID
    }),
    0xE8: new M6502_opcode_functions(M6502_stock_matrix[0xE8],
        function(regs, pins) { //INX
    }),
    0xE9: new M6502_opcode_functions(M6502_stock_matrix[0xE9],
        function(regs, pins) { //SBC #
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (~regs.TR) & 0xFF;
                    let i = (~regs.TR) & 0xFF;
                    let o = regs.A + i + regs.P.C;
                    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xEA: new M6502_opcode_functions(M6502_stock_matrix[0xEA],
        function(regs, pins) { //NOP
            switch(regs.TCU) {
                case 1:
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xEB: new M6502_opcode_functions(M6502_stock_matrix[0xEB],
        function(regs, pins) { //INVALID
    }),
    0xEC: new M6502_opcode_functions(M6502_stock_matrix[0xEC],
        function(regs, pins) { //CPX a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    let o = regs.X - regs.TR;
                    regs.P.C = +(!((o & 0x100) >>> 8));
                    regs.P.Z = +((o & 0xFF) === 0);
                    regs.P.N = ((o) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xED: new M6502_opcode_functions(M6502_stock_matrix[0xED],
        function(regs, pins) { //SBC a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4: // cleanup_custom
                    regs.TR = (~regs.TR) & 0xFF;
                    let i = (~regs.TR) & 0xFF;
                    let o = regs.A + i + regs.P.C;
                    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xEE: new M6502_opcode_functions(M6502_stock_matrix[0xEE],
        function(regs, pins) { //INC a
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    break;
                case 4:
                    regs.TR = pins.D;
                    pins.RW = 1;
                    break;
                case 5:
                    regs.TR = (regs.TR + 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xEF: new M6502_opcode_functions(M6502_stock_matrix[0xEF],
        function(regs, pins) { //INVALID
    }),
    0xF0: new M6502_opcode_functions(M6502_stock_matrix[0xF0],
        function(regs, pins) { //BEQ r
            switch(regs.TCU) {
                case 1:
                    regs.TR = +(regs.P.Z === 1);
                    if (!regs.TR) { regs.TCU += 2; break; }
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = (regs.PC + pins.D) & 0xFFFF;
                    pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                    if ((regs.TA & 0xFF00) === (PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                    break;
                case 3: // extra idle on page cross
                    break;
                case 4: // cleanup_custom
                    regs.PC = regs.TA;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xF1: new M6502_opcode_functions(M6502_stock_matrix[0xF1],
        function(regs, pins) { //SBC (d),y
            switch(regs.TCU) {
                case 1: // Get ZP
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // get ABS L
                    pins.Addr = pins.D;
                    break;
                case 3: // get ABS H
                    regs.TR = pins.D;
                    regs.TA = pins.D + regs.Y;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 4: // idle if crossed
                    regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                    regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                    if (regs.TR & 0xFF00 === regs.TA & 0xFF00) { regs.TCU++; pins.Addr = regs.TA; }
                    else pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                    break;
                case 5:
                    pins.Addr = regs.TA;
                    break;
                case 6: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (~regs.TR) & 0xFF;
                    let i = (~regs.TR) & 0xFF;
                    let o = regs.A + i + regs.P.C;
                    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xF2: new M6502_opcode_functions(M6502_stock_matrix[0xF2],
        function(regs, pins) { //INVALID
    }),
    0xF3: new M6502_opcode_functions(M6502_stock_matrix[0xF3],
        function(regs, pins) { //INVALID
    }),
    0xF4: new M6502_opcode_functions(M6502_stock_matrix[0xF4],
        function(regs, pins) { //INVALID
    }),
    0xF5: new M6502_opcode_functions(M6502_stock_matrix[0xF5],
        function(regs, pins) { //SBC d,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (~regs.TR) & 0xFF;
                    let i = (~regs.TR) & 0xFF;
                    let o = regs.A + i + regs.P.C;
                    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xF6: new M6502_opcode_functions(M6502_stock_matrix[0xF6],
        function(regs, pins) { //INC d,X
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // spurious read
                    pins.Addr = pins.D;
                    break;
                case 3:
                    pins.Addr = (pins.D + regs.X) & 0xFFFF;
                    break;
                case 4: // spurious write
                    pins.RW = 1;
                    regs.TR = (regs.TR + 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    break;
                case 5:
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 6: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xF7: new M6502_opcode_functions(M6502_stock_matrix[0xF7],
        function(regs, pins) { //INVALID
    }),
    0xF8: new M6502_opcode_functions(M6502_stock_matrix[0xF8],
        function(regs, pins) { //SED
            switch(regs.TCU) {
                case 1:
                    regs.P.D = 1;
                    // Following is auto-generated code for instruction finish
                    break;
                case 2: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xF9: new M6502_opcode_functions(M6502_stock_matrix[0xF9],
        function(regs, pins) { //SBC a,y
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.Y) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.TR = (~regs.TR) & 0xFF;
                    let i = (~regs.TR) & 0xFF;
                    let o = regs.A + i + regs.P.C;
                    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xFA: new M6502_opcode_functions(M6502_stock_matrix[0xFA],
        function(regs, pins) { //INVALID
    }),
    0xFB: new M6502_opcode_functions(M6502_stock_matrix[0xFB],
        function(regs, pins) { //INVALID
    }),
    0xFC: new M6502_opcode_functions(M6502_stock_matrix[0xFC],
        function(regs, pins) { //INVALID
    }),
    0xFD: new M6502_opcode_functions(M6502_stock_matrix[0xFD],
        function(regs, pins) { //SBC a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    pins.Addr = regs.TA | (pins.D << 8);
                    regs.TA = (pins.Addr + regs.X) & 0xFFFF;
                    if (regs.TA & 0xFF00 === pins.Addr & 0xFF00) { regs.TCU++; regs.skipped_cycle = true; pins.Addr = regs.TA; }
                    else pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                    break;
                case 4: // optional
                    pins.Addr = regs.TA;
                    break;
                case 5: // cleanup_custom
                    regs.TR = (~regs.TR) & 0xFF;
                    let i = (~regs.TR) & 0xFF;
                    let o = regs.A + i + regs.P.C;
                    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;
                    regs.P.C = +(o > 0xFF);
                    regs.A = o & 0xFF;
                    regs.P.Z = +((regs.A) === 0);
                    regs.P.N = ((regs.A) & 0x80) >>> 7;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xFE: new M6502_opcode_functions(M6502_stock_matrix[0xFE],
        function(regs, pins) { //INC a,x
            switch(regs.TCU) {
                case 1:
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2:
                    regs.TA = pins.D;
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3: // spurious read
                    regs.TA |= pins.D << 8;
                    pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.X) & 0xFF);
                    break;
                case 4: // real read
                    pins.Addr = regs.TA;
                    break;
                case 5:
                    regs.TR = pins.D
                    pins.RW = 1;
                    break;
                case 6:
                    regs.TR = (regs.TR + 1) & 0xFF;
                    regs.P.Z = +((regs.TR) === 0);
                    regs.P.N = ((regs.TR) & 0x80) >>> 7;
                    pins.D = regs.TR;
                    // Following is auto-generated code for instruction finish
                    break;
                case 7: // cleanup
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    pins.RW = 0;
                    regs.TCU = 0;
                    break;
            }
    }),
    0xFF: new M6502_opcode_functions(M6502_stock_matrix[0xFF],
        function(regs, pins) { //INVALID
    }),
    0x100: new M6502_opcode_functions(M6502_stock_matrix[0x100],
        function(regs, pins) { //RESET
            switch(regs.TCU) {
                case 1: // 3
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    break;
                case 2: // 4
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    break;
                case 3: // 5
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    break;
                case 4: // 6
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    break;
                case 5: // 7
                    pins.Addr = (0xFFFC);
                    break;
                case 6: // 8
                    regs.PC = pins.D;
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 7: // cleanup_custom
                    regs.PC |= (pins.D << 8);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x101: new M6502_opcode_functions(M6502_stock_matrix[0x101],
        function(regs, pins) { //NMI
            switch(regs.TCU) {
                case 1:
                    break;
                case 2:
                    break;
                case 3:
                    pins.RW = 1;
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = (regs.PC & 0xFF00) >>> 8;
                    break;
                case 4:
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = regs.PC & 0xFF;
                    break;
                case 5:
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = regs.P.getbyte() | 0x20;
                    regs.P.I = 1;
                    break;
                case 6:
                    pins.RW = 0;
                    pins.Addr = 0xFFFA;
                    break;
                case 7:
                    regs.TA = pins.D
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 8: // cleanup_custom
                    regs.PC = regs.TA | (pins.D << 8);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    }),
    0x102: new M6502_opcode_functions(M6502_stock_matrix[0x102],
        function(regs, pins) { //IRQ
            switch(regs.TCU) {
                case 1:
                    break;
                case 2:
                    break;
                case 3:
                    pins.RW = 1;
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = (regs.PC & 0xFF00) >>> 8;
                    break;
                case 4:
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = regs.PC & 0xFF;
                    break;
                case 5:
                    pins.Addr = regs.S | 0x100;
                    regs.S = (regs.S - 1) & 0xFF;
                    pins.D = regs.P.getbyte() | 0x20;
                    regs.P.I = 1;
                    break;
                case 6:
                    pins.RW = 0;
                    pins.Addr = 0xFFFE;
                    break;
                case 7:
                    regs.TA = pins.D
                    pins.Addr = (pins.Addr + 1) & 0xFFFF;
                    break;
                case 8: // cleanup_custom
                    regs.PC = regs.TA | (pins.D << 8);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    break;
            }
    })
});