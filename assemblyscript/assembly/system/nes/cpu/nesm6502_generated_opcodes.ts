import {M6502_opcode_functions, M6502_stock_matrix, M6502_invalid_matrix, M6502_MAX_OPCODE} from "../../../component/cpu/m6502/m6502_opcodes";
import {m6502_pins, m6502_regs} from "../../../component/cpu/m6502/m6502";
import {mksigned8} from "../../../helpers/helpers"

export var nesm6502_opcodes_decoded: Array<M6502_opcode_functions> = new Array<M6502_opcode_functions>(M6502_MAX_OPCODE+1);

function nesm6502_get_opcode_function(opcode: u32): M6502_opcode_functions {
    switch(opcode) {
        case 0x00: return new M6502_opcode_functions(M6502_stock_matrix.get(0x00),
            function(regs: m6502_regs, pins: m6502_pins): void { //BRK
                switch(regs.TCU) {
                    case 1:
                        regs.P.B = 1;
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        regs.TR = regs.PC
                        pins.D = (regs.TR >>> 8) & 0xFF;
                        pins.RW = 1;
                        break;
                    case 3:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        pins.D = regs.TR & 0xFF;
                        break;
                    case 4:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        pins.D = regs.P.getbyte();
                        break;
                    case 5:
                        regs.P.B = 1; // Confirmed via Visual6502 that this bit is actually set always during NMI, IRQ, and BRK
                        regs.P.I = 1;
                        pins.RW = 0;
                        pins.Addr = (0xFFFE);
                        break;
                    case 6:
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
        });
        case 0x01: return new M6502_opcode_functions(M6502_stock_matrix.get(0x01),
            function(regs: m6502_regs, pins: m6502_pins): void { //ORA (d,x)
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        break;
                    case 3: // real read ABS L
                        pins.Addr = regs.TA;
                        break;
                    case 4: // read ABS H
                        regs.TA = pins.D;
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 5: // Read from addr
                        pins.Addr = regs.TA | (pins.D << 8);
                        break;
                    case 6: // cleanup_custom
                        regs.A |= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x02: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x02),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x03: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x03),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x04: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x04),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x05: return new M6502_opcode_functions(M6502_stock_matrix.get(0x05),
            function(regs: m6502_regs, pins: m6502_pins): void { //ORA d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        regs.A |= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x06: return new M6502_opcode_functions(M6502_stock_matrix.get(0x06),
            function(regs: m6502_regs, pins: m6502_pins): void { //ASL d
                switch(regs.TCU) {
                    case 1: // fetch ZP
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // capture data
                        pins.Addr = pins.D;
                        break;
                    case 3: // spurious read/write
                        pins.RW = 1;
                        break;
                    case 4: // real write
                        regs.P.C = (pins.D & 0x80) >>> 7;
                        pins.D = (pins.D << 1) & 0xFF;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 5: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x07: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x07),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x08: return new M6502_opcode_functions(M6502_stock_matrix.get(0x08),
            function(regs: m6502_regs, pins: m6502_pins): void { //PHP
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        break;
                    case 2:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        pins.D = regs.P.getbyte() | 0x30;
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
        });
        case 0x09: return new M6502_opcode_functions(M6502_stock_matrix.get(0x09),
            function(regs: m6502_regs, pins: m6502_pins): void { //ORA #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        regs.A |= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x0A: return new M6502_opcode_functions(M6502_stock_matrix.get(0x0A),
            function(regs: m6502_regs, pins: m6502_pins): void { //ASL A
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
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
        });
        case 0x0B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x0B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x0C: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x0C),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x0D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x0D),
            function(regs: m6502_regs, pins: m6502_pins): void { //ORA a
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
                        regs.A |= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x0E: return new M6502_opcode_functions(M6502_stock_matrix.get(0x0E),
            function(regs: m6502_regs, pins: m6502_pins): void { //ASL a
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
                        pins.RW = 1;
                        break;
                    case 5:
                        regs.P.C = (pins.D & 0x80) >>> 7;
                        pins.D = (pins.D << 1) & 0xFF;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 6: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x0F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x0F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x10: return new M6502_opcode_functions(M6502_stock_matrix.get(0x10),
            function(regs: m6502_regs, pins: m6502_pins): void { //BPL r
                switch(regs.TCU) {
                    case 1:
                        regs.TR = +(regs.P.N === 0);
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }
                        break;
                    case 2:
                        regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;
                        pins.Addr = regs.PC;
                        if ((regs.TA & 0xFF00) === (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                        break;
                    case 3: // extra idle on page cross
                        pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 4: // cleanup_custom
                        regs.PC = regs.TA;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x11: return new M6502_opcode_functions(M6502_stock_matrix.get(0x11),
            function(regs: m6502_regs, pins: m6502_pins): void { //ORA (d),y
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
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 4: // idle if crossed
                        regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                        regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                        if ((regs.TR & 0xFF00) === (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 5:
                        pins.Addr = regs.TA;
                        break;
                    case 6: // cleanup_custom
                        regs.A |= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x12: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x12),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x13: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x13),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x14: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x14),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x15: return new M6502_opcode_functions(M6502_stock_matrix.get(0x15),
            function(regs: m6502_regs, pins: m6502_pins): void { //ORA d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // cleanup_custom
                        regs.A |= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x16: return new M6502_opcode_functions(M6502_stock_matrix.get(0x16),
            function(regs: m6502_regs, pins: m6502_pins): void { //ASL d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // spurious read/write
                        regs.TR = pins.D;
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
        });
        case 0x17: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x17),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x18: return new M6502_opcode_functions(M6502_stock_matrix.get(0x18),
            function(regs: m6502_regs, pins: m6502_pins): void { //CLC i
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.P.C = 0;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 2: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x19: return new M6502_opcode_functions(M6502_stock_matrix.get(0x19),
            function(regs: m6502_regs, pins: m6502_pins): void { //ORA a,y
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.A |= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x1A: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x1A),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x1B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x1B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x1C: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x1C),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x1D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x1D),
            function(regs: m6502_regs, pins: m6502_pins): void { //ORA a,x
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.A |= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x1E: return new M6502_opcode_functions(M6502_stock_matrix.get(0x1E),
            function(regs: m6502_regs, pins: m6502_pins): void { //ASL a,x
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
                        pins.Addr = (regs.TA + regs.X) & 0xFFFF;
                        break;
                    case 5: // spurious read/write
                        regs.TR = pins.D;
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
        });
        case 0x1F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x1F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x20: return new M6502_opcode_functions(M6502_stock_matrix.get(0x20),
            function(regs: m6502_regs, pins: m6502_pins): void { //JSR a
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious stack read
                        regs.TA = pins.D;
                        regs.TR = regs.PC;
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        break;
                    case 3: // stack write PCH
                        pins.RW = 1;
                        pins.D = (regs.PC & 0xFF00) >>> 8;
                        break;
                    case 4: // stack write PCL
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        pins.D = regs.PC & 0xFF;
                        break;
                    case 5:
                        pins.Addr = regs.TR;
                        pins.RW = 0;
                        break;
                    case 6: // cleanup_custom
                        regs.PC = regs.TA | (pins.D << 8);
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x21: return new M6502_opcode_functions(M6502_stock_matrix.get(0x21),
            function(regs: m6502_regs, pins: m6502_pins): void { //AND (d,x)
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        break;
                    case 3: // real read ABS L
                        pins.Addr = regs.TA;
                        break;
                    case 4: // read ABS H
                        regs.TA = pins.D;
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 5: // Read from addr
                        pins.Addr = regs.TA | (pins.D << 8);
                        break;
                    case 6: // cleanup_custom
                        regs.A &= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x22: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x22),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x23: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x23),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x24: return new M6502_opcode_functions(M6502_stock_matrix.get(0x24),
            function(regs: m6502_regs, pins: m6502_pins): void { //BIT d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        regs.P.Z = +((regs.A & pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        regs.P.V = (pins.D & 0x40) >>> 6;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x25: return new M6502_opcode_functions(M6502_stock_matrix.get(0x25),
            function(regs: m6502_regs, pins: m6502_pins): void { //AND d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        regs.A &= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x26: return new M6502_opcode_functions(M6502_stock_matrix.get(0x26),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROL d
                switch(regs.TCU) {
                    case 1: // fetch ZP
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // capture data
                        pins.Addr = pins.D;
                        break;
                    case 3: // spurious read/write
                        pins.RW = 1;
                        break;
                    case 4: // real write
                        let c: u32 = regs.P.C;
                        regs.P.C = (pins.D & 0x80) >>> 7;
                        pins.D = ((pins.D << 1) | c) & 0xFF;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 5: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x27: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x27),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x28: return new M6502_opcode_functions(M6502_stock_matrix.get(0x28),
            function(regs: m6502_regs, pins: m6502_pins): void { //PLP
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        break;
                    case 2: // spurious stack read
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S + 1) & 0xFF;
                        break;
                    case 3:
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 4: // cleanup_custom
                        regs.P.setbyte(pins.D);
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x29: return new M6502_opcode_functions(M6502_stock_matrix.get(0x29),
            function(regs: m6502_regs, pins: m6502_pins): void { //AND #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        regs.A &= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x2A: return new M6502_opcode_functions(M6502_stock_matrix.get(0x2A),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROL A
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        let c: u32 = regs.P.C;
                        regs.P.C = (regs.A & 0x80) >>> 7;
                        regs.A = ((regs.A << 1) | c) & 0xFF;
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
        });
        case 0x2B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x2B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x2C: return new M6502_opcode_functions(M6502_stock_matrix.get(0x2C),
            function(regs: m6502_regs, pins: m6502_pins): void { //BIT a
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
                        regs.P.Z = +((regs.A & pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        regs.P.V = (pins.D & 0x40) >>> 6;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x2D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x2D),
            function(regs: m6502_regs, pins: m6502_pins): void { //AND a
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
                        regs.A &= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x2E: return new M6502_opcode_functions(M6502_stock_matrix.get(0x2E),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROL a
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
                        pins.RW = 1;
                        break;
                    case 5:
                        let c: u32 = regs.P.C;
                        regs.P.C = (pins.D & 0x80) >>> 7;
                        pins.D = ((pins.D << 1) | c) & 0xFF;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 6: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x2F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x2F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x30: return new M6502_opcode_functions(M6502_stock_matrix.get(0x30),
            function(regs: m6502_regs, pins: m6502_pins): void { //BMI r
                switch(regs.TCU) {
                    case 1:
                        regs.TR = +(regs.P.N === 1);
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }
                        break;
                    case 2:
                        regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;
                        pins.Addr = regs.PC;
                        if ((regs.TA & 0xFF00) === (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                        break;
                    case 3: // extra idle on page cross
                        pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 4: // cleanup_custom
                        regs.PC = regs.TA;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x31: return new M6502_opcode_functions(M6502_stock_matrix.get(0x31),
            function(regs: m6502_regs, pins: m6502_pins): void { //AND (d),x
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
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 4: // idle if crossed
                        regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                        regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                        if ((regs.TR & 0xFF00) === (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 5:
                        pins.Addr = regs.TA;
                        break;
                    case 6: // cleanup_custom
                        regs.A &= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x32: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x32),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x33: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x33),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x34: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x34),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x35: return new M6502_opcode_functions(M6502_stock_matrix.get(0x35),
            function(regs: m6502_regs, pins: m6502_pins): void { //AND d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // cleanup_custom
                        regs.A &= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x36: return new M6502_opcode_functions(M6502_stock_matrix.get(0x36),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROL d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // spurious read/write
                        regs.TR = pins.D;
                        pins.RW = 1;
                        let c: u32 = regs.P.C;
                        regs.P.C = (regs.TR & 0x80) >>> 7;
                        regs.TR = ((regs.TR << 1) | c) & 0xFF;
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
        });
        case 0x37: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x37),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x38: return new M6502_opcode_functions(M6502_stock_matrix.get(0x38),
            function(regs: m6502_regs, pins: m6502_pins): void { //SEC
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.P.C = 1;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 2: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x39: return new M6502_opcode_functions(M6502_stock_matrix.get(0x39),
            function(regs: m6502_regs, pins: m6502_pins): void { //AND a,y
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.A &= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x3A: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x3A),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x3B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x3B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x3C: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x3C),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x3D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x3D),
            function(regs: m6502_regs, pins: m6502_pins): void { //AND a,x
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.A &= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x3E: return new M6502_opcode_functions(M6502_stock_matrix.get(0x3E),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROL a,x
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
                        pins.Addr = (regs.TA + regs.X) & 0xFFFF;
                        break;
                    case 5: // spurious read/write
                        regs.TR = pins.D;
                        pins.RW = 1;
                        break;
                    case 6:
                        let c: u32 = regs.P.C;
                        regs.P.C = (regs.TR & 0x80) >>> 7;
                        regs.TR = ((regs.TR << 1) | c) & 0xFF;
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
        });
        case 0x3F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x3F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x40: return new M6502_opcode_functions(M6502_stock_matrix.get(0x40),
            function(regs: m6502_regs, pins: m6502_pins): void { //RTI
                switch(regs.TCU) {
                    case 1: // spurious read
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious stack read
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 3: // Read P
                        regs.S = (regs.S + 1) & 0xFF;
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 4: // Read PCL
                        regs.P.setbyte(pins.D);
                        regs.S = (regs.S + 1) & 0xFF;
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 5: // read PCH
                        regs.PC = pins.D;
                        regs.S = (regs.S + 1) & 0xFF;
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 6: // cleanup_custom
                        regs.PC |= (pins.D << 8);
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x41: return new M6502_opcode_functions(M6502_stock_matrix.get(0x41),
            function(regs: m6502_regs, pins: m6502_pins): void { //EOR (d,x)
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        break;
                    case 3: // real read ABS L
                        pins.Addr = regs.TA;
                        break;
                    case 4: // read ABS H
                        regs.TA = pins.D;
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 5: // Read from addr
                        pins.Addr = regs.TA | (pins.D << 8);
                        break;
                    case 6: // cleanup_custom
                        regs.A ^= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x42: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x42),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x43: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x43),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x44: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x44),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x45: return new M6502_opcode_functions(M6502_stock_matrix.get(0x45),
            function(regs: m6502_regs, pins: m6502_pins): void { //EOR d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        regs.A ^= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x46: return new M6502_opcode_functions(M6502_stock_matrix.get(0x46),
            function(regs: m6502_regs, pins: m6502_pins): void { //LSR d
                switch(regs.TCU) {
                    case 1: // fetch ZP
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // capture data
                        pins.Addr = pins.D;
                        break;
                    case 3: // spurious read/write
                        pins.RW = 1;
                        break;
                    case 4: // real write
                        regs.P.C = pins.D & 1;
                        pins.D >>>= 1;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = 0;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 5: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x47: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x47),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x48: return new M6502_opcode_functions(M6502_stock_matrix.get(0x48),
            function(regs: m6502_regs, pins: m6502_pins): void { //PHA
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        break;
                    case 2:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        pins.D = regs.A
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
        });
        case 0x49: return new M6502_opcode_functions(M6502_stock_matrix.get(0x49),
            function(regs: m6502_regs, pins: m6502_pins): void { //EOR #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        regs.A ^= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x4A: return new M6502_opcode_functions(M6502_stock_matrix.get(0x4A),
            function(regs: m6502_regs, pins: m6502_pins): void { //LSR A
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
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
        });
        case 0x4B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x4B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x4C: return new M6502_opcode_functions(M6502_stock_matrix.get(0x4C),
            function(regs: m6502_regs, pins: m6502_pins): void { //JMP a
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
        });
        case 0x4D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x4D),
            function(regs: m6502_regs, pins: m6502_pins): void { //EOR a
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
                        regs.A ^= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x4E: return new M6502_opcode_functions(M6502_stock_matrix.get(0x4E),
            function(regs: m6502_regs, pins: m6502_pins): void { //LSR a
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
                        pins.RW = 1;
                        break;
                    case 5:
                        regs.P.C = pins.D & 1;
                        pins.D >>>= 1;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = 0;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 6: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x4F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x4F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x50: return new M6502_opcode_functions(M6502_stock_matrix.get(0x50),
            function(regs: m6502_regs, pins: m6502_pins): void { //BVC r
                switch(regs.TCU) {
                    case 1:
                        regs.TR = +(regs.P.V === 0);
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }
                        break;
                    case 2:
                        regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;
                        pins.Addr = regs.PC;
                        if ((regs.TA & 0xFF00) === (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                        break;
                    case 3: // extra idle on page cross
                        pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 4: // cleanup_custom
                        regs.PC = regs.TA;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x51: return new M6502_opcode_functions(M6502_stock_matrix.get(0x51),
            function(regs: m6502_regs, pins: m6502_pins): void { //EOR (d),y
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
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 4: // idle if crossed
                        regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                        regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                        if ((regs.TR & 0xFF00) === (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 5:
                        pins.Addr = regs.TA;
                        break;
                    case 6: // cleanup_custom
                        regs.A ^= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x52: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x52),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x53: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x53),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x54: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x54),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x55: return new M6502_opcode_functions(M6502_stock_matrix.get(0x55),
            function(regs: m6502_regs, pins: m6502_pins): void { //EOR d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // cleanup_custom
                        regs.A ^= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x56: return new M6502_opcode_functions(M6502_stock_matrix.get(0x56),
            function(regs: m6502_regs, pins: m6502_pins): void { //LSR d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // spurious read/write
                        regs.TR = pins.D;
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
        });
        case 0x57: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x57),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x58: return new M6502_opcode_functions(M6502_stock_matrix.get(0x58),
            function(regs: m6502_regs, pins: m6502_pins): void { //CLI
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.P.I = 0;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 2: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x59: return new M6502_opcode_functions(M6502_stock_matrix.get(0x59),
            function(regs: m6502_regs, pins: m6502_pins): void { //EOR a,y
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.A ^= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x5A: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x5A),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x5B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x5B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x5C: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x5C),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x5D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x5D),
            function(regs: m6502_regs, pins: m6502_pins): void { //EOR a,x
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.A ^= pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x5E: return new M6502_opcode_functions(M6502_stock_matrix.get(0x5E),
            function(regs: m6502_regs, pins: m6502_pins): void { //LSR a,x
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
                        pins.Addr = (regs.TA + regs.X) & 0xFFFF;
                        break;
                    case 5: // spurious read/write
                        regs.TR = pins.D;
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
        });
        case 0x5F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x5F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x60: return new M6502_opcode_functions(M6502_stock_matrix.get(0x60),
            function(regs: m6502_regs, pins: m6502_pins): void { //RTS
                switch(regs.TCU) {
                    case 1: // spurious read
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious stack read
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 3: // read PCL
                        regs.S = (regs.S + 1) & 0xFF;
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 4: // read PCH
                        regs.PC = pins.D;
                        regs.S = (regs.S + 1) & 0xFF;
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 5: // spurious read
                        regs.PC |= (pins.D << 8);
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 6: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x61: return new M6502_opcode_functions(M6502_stock_matrix.get(0x61),
            function(regs: m6502_regs, pins: m6502_pins): void { //ADC (d,x)
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        break;
                    case 3: // real read ABS L
                        pins.Addr = regs.TA;
                        break;
                    case 4: // read ABS H
                        regs.TA = pins.D;
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 5: // Read from addr
                        pins.Addr = regs.TA | (pins.D << 8);
                        break;
                    case 6: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D;
                        o = i + regs.A + regs.P.C;
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
        });
        case 0x62: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x62),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x63: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x63),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x64: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x64),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x65: return new M6502_opcode_functions(M6502_stock_matrix.get(0x65),
            function(regs: m6502_regs, pins: m6502_pins): void { //ADC d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D;
                        o = i + regs.A + regs.P.C;
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
        });
        case 0x66: return new M6502_opcode_functions(M6502_stock_matrix.get(0x66),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROR d
                switch(regs.TCU) {
                    case 1: // fetch ZP
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // capture data
                        pins.Addr = pins.D;
                        break;
                    case 3: // spurious read/write
                        pins.RW = 1;
                        break;
                    case 4: // real write
                        let c: u32 = regs.P.C;
                        regs.P.C = pins.D & 1;
                        pins.D = (c << 7) | (pins.D >>> 1);
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 5: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x67: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x67),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x68: return new M6502_opcode_functions(M6502_stock_matrix.get(0x68),
            function(regs: m6502_regs, pins: m6502_pins): void { //PLA
                switch(regs.TCU) {
                    case 1: // spurious read
                        pins.Addr = regs.PC;
                        break;
                    case 2: // spurious stack read
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 3: // good stack read
                        regs.S = (regs.S + 1) & 0xFF;
                        pins.Addr = regs.S | 0x100;
                        break;
                    case 4: // cleanup_custom
                        regs.A = pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x69: return new M6502_opcode_functions(M6502_stock_matrix.get(0x69),
            function(regs: m6502_regs, pins: m6502_pins): void { //ADC #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D;
                        o = i + regs.A + regs.P.C;
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
        });
        case 0x6A: return new M6502_opcode_functions(M6502_stock_matrix.get(0x6A),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROR A
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        let c: u32 = regs.P.C;
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
        });
        case 0x6B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x6B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x6C: return new M6502_opcode_functions(M6502_stock_matrix.get(0x6C),
            function(regs: m6502_regs, pins: m6502_pins): void { //JMP (d)
                switch(regs.TCU) {
                    case 1: // read ABSL
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // read ABSH
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TA = pins.D
                        break;
                    case 3: // read PCL
                        pins.Addr = regs.TA | (pins.D << 8);
                        break;
                    case 4: // read PCH
                        regs.PC = pins.D;
                        pins.Addr = (pins.Addr & 0xFF00) | ((pins.Addr + 1) & 0xFF);
                        break;
                    case 5: // cleanup_custom
                        regs.PC |= pins.D << 8;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x6D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x6D),
            function(regs: m6502_regs, pins: m6502_pins): void { //ADC a
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
                        let o: i32;
                        let i: i32 = pins.D;
                        o = i + regs.A + regs.P.C;
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
        });
        case 0x6E: return new M6502_opcode_functions(M6502_stock_matrix.get(0x6E),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROR a
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
                        pins.RW = 1;
                        break;
                    case 5:
                        let c: u32 = regs.P.C;
                        regs.P.C = pins.D & 1;
                        pins.D = (c << 7) | (pins.D >>> 1);
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 6: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x6F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x6F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x70: return new M6502_opcode_functions(M6502_stock_matrix.get(0x70),
            function(regs: m6502_regs, pins: m6502_pins): void { //BVS r
                switch(regs.TCU) {
                    case 1:
                        regs.TR = +(regs.P.V === 1);
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }
                        break;
                    case 2:
                        regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;
                        pins.Addr = regs.PC;
                        if ((regs.TA & 0xFF00) === (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                        break;
                    case 3: // extra idle on page cross
                        pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 4: // cleanup_custom
                        regs.PC = regs.TA;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x71: return new M6502_opcode_functions(M6502_stock_matrix.get(0x71),
            function(regs: m6502_regs, pins: m6502_pins): void { //ADC (d),y
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
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 4: // idle if crossed
                        regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                        regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                        if ((regs.TR & 0xFF00) === (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 5:
                        pins.Addr = regs.TA;
                        break;
                    case 6: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D;
                        o = i + regs.A + regs.P.C;
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
        });
        case 0x72: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x72),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x73: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x73),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x74: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x74),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x75: return new M6502_opcode_functions(M6502_stock_matrix.get(0x75),
            function(regs: m6502_regs, pins: m6502_pins): void { //ADC d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D;
                        o = i + regs.A + regs.P.C;
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
        });
        case 0x76: return new M6502_opcode_functions(M6502_stock_matrix.get(0x76),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROR d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // spurious read/write
                        regs.TR = pins.D;
                        pins.RW = 1;
                        let c: u32 = regs.P.C;
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
        });
        case 0x77: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x77),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x78: return new M6502_opcode_functions(M6502_stock_matrix.get(0x78),
            function(regs: m6502_regs, pins: m6502_pins): void { //SEI
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.P.I = 1;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 2: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x79: return new M6502_opcode_functions(M6502_stock_matrix.get(0x79),
            function(regs: m6502_regs, pins: m6502_pins): void { //ADC a,y
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D;
                        o = i + regs.A + regs.P.C;
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
        });
        case 0x7A: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x7A),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x7B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x7B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x7C: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x7C),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x7D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x7D),
            function(regs: m6502_regs, pins: m6502_pins): void { //ADC a,x
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D;
                        o = i + regs.A + regs.P.C;
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
        });
        case 0x7E: return new M6502_opcode_functions(M6502_stock_matrix.get(0x7E),
            function(regs: m6502_regs, pins: m6502_pins): void { //ROR a,x
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
                        pins.Addr = (regs.TA + regs.X) & 0xFFFF;
                        break;
                    case 5: // spurious read/write
                        regs.TR = pins.D;
                        pins.RW = 1;
                        break;
                    case 6:
                        let c: u32 = regs.P.C;
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
        });
        case 0x7F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x7F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x80: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x80),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x81: return new M6502_opcode_functions(M6502_stock_matrix.get(0x81),
            function(regs: m6502_regs, pins: m6502_pins): void { //STA (d,x)
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        break;
                    case 3: // real read ABS L
                        pins.Addr = regs.TA;
                        break;
                    case 4: // read ABS H
                        regs.TA = pins.D;
                        pins.Addr = (pins.Addr + 1) & 0xFF;
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
        });
        case 0x82: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x82),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x83: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x83),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x84: return new M6502_opcode_functions(M6502_stock_matrix.get(0x84),
            function(regs: m6502_regs, pins: m6502_pins): void { //STY d
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
        });
        case 0x85: return new M6502_opcode_functions(M6502_stock_matrix.get(0x85),
            function(regs: m6502_regs, pins: m6502_pins): void { //STA d
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
        });
        case 0x86: return new M6502_opcode_functions(M6502_stock_matrix.get(0x86),
            function(regs: m6502_regs, pins: m6502_pins): void { //STX d
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
        });
        case 0x87: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x87),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x88: return new M6502_opcode_functions(M6502_stock_matrix.get(0x88),
            function(regs: m6502_regs, pins: m6502_pins): void { //DEY
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.Y = (regs.Y - 1) & 0xFF;
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
        });
        case 0x89: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x89),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x8A: return new M6502_opcode_functions(M6502_stock_matrix.get(0x8A),
            function(regs: m6502_regs, pins: m6502_pins): void { //TXA
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
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
        });
        case 0x8B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x8B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x8C: return new M6502_opcode_functions(M6502_stock_matrix.get(0x8C),
            function(regs: m6502_regs, pins: m6502_pins): void { //STY a
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
                        pins.RW = 1;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 4: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x8D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x8D),
            function(regs: m6502_regs, pins: m6502_pins): void { //STA a
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
                        pins.RW = 1;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 4: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x8E: return new M6502_opcode_functions(M6502_stock_matrix.get(0x8E),
            function(regs: m6502_regs, pins: m6502_pins): void { //STX a
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
                        pins.RW = 1;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 4: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x8F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x8F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x90: return new M6502_opcode_functions(M6502_stock_matrix.get(0x90),
            function(regs: m6502_regs, pins: m6502_pins): void { //BCC
                switch(regs.TCU) {
                    case 1:
                        regs.TR = +(regs.P.C === 0);
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }
                        break;
                    case 2:
                        regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;
                        pins.Addr = regs.PC;
                        if ((regs.TA & 0xFF00) === (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                        break;
                    case 3: // extra idle on page cross
                        pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 4: // cleanup_custom
                        regs.PC = regs.TA;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x91: return new M6502_opcode_functions(M6502_stock_matrix.get(0x91),
            function(regs: m6502_regs, pins: m6502_pins): void { //STA (d),y
                switch(regs.TCU) {
                    case 1: // get ZP
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // get ABS L
                        pins.Addr = pins.D;
                        break;
                    case 3: // get ABS H
                        regs.TA = pins.D + regs.Y;
                        regs.TR = (pins.D + regs.Y) & 0xFF;
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 4: // always idle
                        regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
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
        });
        case 0x92: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x92),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x93: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x93),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x94: return new M6502_opcode_functions(M6502_stock_matrix.get(0x94),
            function(regs: m6502_regs, pins: m6502_pins): void { //STY d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        break;
                    case 3: // write data
                        pins.Addr = (pins.Addr + regs.X) & 0xFF;
                        pins.RW = 1;
                        pins.D = regs.Y;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 4: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x95: return new M6502_opcode_functions(M6502_stock_matrix.get(0x95),
            function(regs: m6502_regs, pins: m6502_pins): void { //STA d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        break;
                    case 3: // write data
                        pins.Addr = (pins.Addr + regs.X) & 0xFF;
                        pins.RW = 1;
                        pins.D = regs.A;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 4: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x96: return new M6502_opcode_functions(M6502_stock_matrix.get(0x96),
            function(regs: m6502_regs, pins: m6502_pins): void { //STX d,y
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        break;
                    case 3: // write data
                        pins.Addr = (pins.Addr + regs.Y) & 0xFF;
                        pins.RW = 1;
                        pins.D = regs.X;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 4: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x97: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x97),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x98: return new M6502_opcode_functions(M6502_stock_matrix.get(0x98),
            function(regs: m6502_regs, pins: m6502_pins): void { //TYA
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
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
        });
        case 0x99: return new M6502_opcode_functions(M6502_stock_matrix.get(0x99),
            function(regs: m6502_regs, pins: m6502_pins): void { //STA a,y
                switch(regs.TCU) {
                    case 1: // get ABSL
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // get ABSH
                        regs.TA = pins.D;
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 3: // idle incorrect
                        regs.TA |= pins.D << 8;
                        pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.Y) & 0xFF);
                        break;
                    case 4:
                        pins.Addr = (regs.TA + regs.Y) & 0xFFFF;
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
        });
        case 0x9A: return new M6502_opcode_functions(M6502_stock_matrix.get(0x9A),
            function(regs: m6502_regs, pins: m6502_pins): void { //TXS
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.S = regs.X;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 2: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0x9B: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x9B),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x9C: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x9C),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x9D: return new M6502_opcode_functions(M6502_stock_matrix.get(0x9D),
            function(regs: m6502_regs, pins: m6502_pins): void { //STA a,x
                switch(regs.TCU) {
                    case 1: // get ABSL
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // get ABSH
                        regs.TA = pins.D;
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 3: // idle incorrect
                        regs.TA |= pins.D << 8;
                        pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + regs.X) & 0xFF);
                        break;
                    case 4:
                        pins.Addr = (regs.TA + regs.X) & 0xFFFF;
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
        });
        case 0x9E: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x9E),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x9F: return new M6502_opcode_functions(M6502_invalid_matrix.get(0x9F),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xA0: return new M6502_opcode_functions(M6502_stock_matrix.get(0xA0),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDY #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        regs.Y = pins.D;
                        regs.P.Z = +((regs.Y) === 0);
                        regs.P.N = ((regs.Y) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xA1: return new M6502_opcode_functions(M6502_stock_matrix.get(0xA1),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDA (d,x)
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        break;
                    case 3: // real read ABS L
                        pins.Addr = regs.TA;
                        break;
                    case 4: // read ABS H
                        regs.TA = pins.D;
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 5: // Read from addr
                        pins.Addr = regs.TA | (pins.D << 8);
                        break;
                    case 6: // cleanup_custom
                        regs.A = pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xA2: return new M6502_opcode_functions(M6502_stock_matrix.get(0xA2),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDX #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        regs.X = pins.D;
                        regs.P.Z = +((regs.X) === 0);
                        regs.P.N = ((regs.X) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xA3: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xA3),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xA4: return new M6502_opcode_functions(M6502_stock_matrix.get(0xA4),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDY d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        regs.Y = pins.D;
                        regs.P.Z = +((regs.Y) === 0);
                        regs.P.N = ((regs.Y) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xA5: return new M6502_opcode_functions(M6502_stock_matrix.get(0xA5),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDA d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
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
        });
        case 0xA6: return new M6502_opcode_functions(M6502_stock_matrix.get(0xA6),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDX d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        regs.X = pins.D;
                        regs.P.Z = +((regs.X) === 0);
                        regs.P.N = ((regs.X) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xA7: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xA7),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xA8: return new M6502_opcode_functions(M6502_stock_matrix.get(0xA8),
            function(regs: m6502_regs, pins: m6502_pins): void { //TAY
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
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
        });
        case 0xA9: return new M6502_opcode_functions(M6502_stock_matrix.get(0xA9),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDA #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        regs.A = pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xAA: return new M6502_opcode_functions(M6502_stock_matrix.get(0xAA),
            function(regs: m6502_regs, pins: m6502_pins): void { //TAX
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
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
        });
        case 0xAB: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xAB),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xAC: return new M6502_opcode_functions(M6502_stock_matrix.get(0xAC),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDY a
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
                        regs.Y = pins.D;
                        regs.P.Z = +((regs.Y) === 0);
                        regs.P.N = ((regs.Y) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xAD: return new M6502_opcode_functions(M6502_stock_matrix.get(0xAD),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDA a
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
                        regs.A = pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xAE: return new M6502_opcode_functions(M6502_stock_matrix.get(0xAE),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDX a
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
                        regs.X = pins.D;
                        regs.P.Z = +((regs.X) === 0);
                        regs.P.N = ((regs.X) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xAF: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xAF),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xB0: return new M6502_opcode_functions(M6502_stock_matrix.get(0xB0),
            function(regs: m6502_regs, pins: m6502_pins): void { //BCS r
                switch(regs.TCU) {
                    case 1:
                        regs.TR = +(regs.P.C === 1);
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }
                        break;
                    case 2:
                        regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;
                        pins.Addr = regs.PC;
                        if ((regs.TA & 0xFF00) === (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                        break;
                    case 3: // extra idle on page cross
                        pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 4: // cleanup_custom
                        regs.PC = regs.TA;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xB1: return new M6502_opcode_functions(M6502_stock_matrix.get(0xB1),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDA (d),y
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
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 4: // idle if crossed
                        regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                        regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                        if ((regs.TR & 0xFF00) === (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 5:
                        pins.Addr = regs.TA;
                        break;
                    case 6: // cleanup_custom
                        regs.A = pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xB2: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xB2),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xB3: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xB3),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xB4: return new M6502_opcode_functions(M6502_stock_matrix.get(0xB4),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDY d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // cleanup_custom
                        regs.Y = pins.D;
                        regs.P.Z = +((regs.Y) === 0);
                        regs.P.N = ((regs.Y) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xB5: return new M6502_opcode_functions(M6502_stock_matrix.get(0xB5),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDA d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // cleanup_custom
                        regs.A = pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xB6: return new M6502_opcode_functions(M6502_stock_matrix.get(0xB6),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDX d,y
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.Y) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // cleanup_custom
                        regs.X = pins.D;
                        regs.P.Z = +((regs.X) === 0);
                        regs.P.N = ((regs.X) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xB7: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xB7),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xB8: return new M6502_opcode_functions(M6502_stock_matrix.get(0xB8),
            function(regs: m6502_regs, pins: m6502_pins): void { //CLV
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.P.V = 0;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 2: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xB9: return new M6502_opcode_functions(M6502_stock_matrix.get(0xB9),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDA a,y
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.A = pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xBA: return new M6502_opcode_functions(M6502_stock_matrix.get(0xBA),
            function(regs: m6502_regs, pins: m6502_pins): void { //TSX
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
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
        });
        case 0xBB: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xBB),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xBC: return new M6502_opcode_functions(M6502_stock_matrix.get(0xBC),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDY a,x
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.Y = pins.D;
                        regs.P.Z = +((regs.Y) === 0);
                        regs.P.N = ((regs.Y) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xBD: return new M6502_opcode_functions(M6502_stock_matrix.get(0xBD),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDA a,x
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.A = pins.D;
                        regs.P.Z = +((regs.A) === 0);
                        regs.P.N = ((regs.A) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xBE: return new M6502_opcode_functions(M6502_stock_matrix.get(0xBE),
            function(regs: m6502_regs, pins: m6502_pins): void { //LDX a,y
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        regs.X = pins.D;
                        regs.P.Z = +((regs.X) === 0);
                        regs.P.N = ((regs.X) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xBF: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xBF),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xC0: return new M6502_opcode_functions(M6502_stock_matrix.get(0xC0),
            function(regs: m6502_regs, pins: m6502_pins): void { //CPY #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        let o: i32 = regs.Y - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xC1: return new M6502_opcode_functions(M6502_stock_matrix.get(0xC1),
            function(regs: m6502_regs, pins: m6502_pins): void { //CMP (d,x)
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        break;
                    case 3: // real read ABS L
                        pins.Addr = regs.TA;
                        break;
                    case 4: // read ABS H
                        regs.TA = pins.D;
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 5: // Read from addr
                        pins.Addr = regs.TA | (pins.D << 8);
                        break;
                    case 6: // cleanup_custom
                        let o: i32 = regs.A - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xC2: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xC2),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xC3: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xC3),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xC4: return new M6502_opcode_functions(M6502_stock_matrix.get(0xC4),
            function(regs: m6502_regs, pins: m6502_pins): void { //CPY d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        let o: i32 = regs.Y - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xC5: return new M6502_opcode_functions(M6502_stock_matrix.get(0xC5),
            function(regs: m6502_regs, pins: m6502_pins): void { //CMP d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        let o: i32 = regs.A - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xC6: return new M6502_opcode_functions(M6502_stock_matrix.get(0xC6),
            function(regs: m6502_regs, pins: m6502_pins): void { //DEC d
                switch(regs.TCU) {
                    case 1: // fetch ZP
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // capture data
                        pins.Addr = pins.D;
                        break;
                    case 3: // spurious read/write
                        pins.RW = 1;
                        break;
                    case 4: // real write
                        pins.D = (pins.D - 1) & 0xFF;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 5: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xC7: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xC7),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xC8: return new M6502_opcode_functions(M6502_stock_matrix.get(0xC8),
            function(regs: m6502_regs, pins: m6502_pins): void { //INY
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.Y = (regs.Y + 1) & 0xFF;
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
        });
        case 0xC9: return new M6502_opcode_functions(M6502_stock_matrix.get(0xC9),
            function(regs: m6502_regs, pins: m6502_pins): void { //CMP #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        let o: i32 = regs.A - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xCA: return new M6502_opcode_functions(M6502_stock_matrix.get(0xCA),
            function(regs: m6502_regs, pins: m6502_pins): void { //DEX
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.X = (regs.X - 1) & 0xFF;
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
        });
        case 0xCB: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xCB),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xCC: return new M6502_opcode_functions(M6502_stock_matrix.get(0xCC),
            function(regs: m6502_regs, pins: m6502_pins): void { //CPY a
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
                        let o: i32 = regs.Y - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xCD: return new M6502_opcode_functions(M6502_stock_matrix.get(0xCD),
            function(regs: m6502_regs, pins: m6502_pins): void { //CMP a
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
                        let o: i32 = regs.A - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xCE: return new M6502_opcode_functions(M6502_stock_matrix.get(0xCE),
            function(regs: m6502_regs, pins: m6502_pins): void { //DEC a
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
                        pins.RW = 1;
                        break;
                    case 5:
                        pins.D = (pins.D - 1) & 0xFF;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 6: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xCF: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xCF),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xD0: return new M6502_opcode_functions(M6502_stock_matrix.get(0xD0),
            function(regs: m6502_regs, pins: m6502_pins): void { //BNE r
                switch(regs.TCU) {
                    case 1:
                        regs.TR = +(regs.P.Z === 0);
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }
                        break;
                    case 2:
                        regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;
                        pins.Addr = regs.PC;
                        if ((regs.TA & 0xFF00) === (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                        break;
                    case 3: // extra idle on page cross
                        pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 4: // cleanup_custom
                        regs.PC = regs.TA;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xD1: return new M6502_opcode_functions(M6502_stock_matrix.get(0xD1),
            function(regs: m6502_regs, pins: m6502_pins): void { //CMP (d),y
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
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 4: // idle if crossed
                        regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                        regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                        if ((regs.TR & 0xFF00) === (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 5:
                        pins.Addr = regs.TA;
                        break;
                    case 6: // cleanup_custom
                        let o: i32 = regs.A - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xD2: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xD2),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xD3: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xD3),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xD4: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xD4),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xD5: return new M6502_opcode_functions(M6502_stock_matrix.get(0xD5),
            function(regs: m6502_regs, pins: m6502_pins): void { //CMP d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // cleanup_custom
                        let o: i32 = regs.A - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xD6: return new M6502_opcode_functions(M6502_stock_matrix.get(0xD6),
            function(regs: m6502_regs, pins: m6502_pins): void { //DEC d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // spurious read/write
                        regs.TR = pins.D;
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
        });
        case 0xD7: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xD7),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xD8: return new M6502_opcode_functions(M6502_stock_matrix.get(0xD8),
            function(regs: m6502_regs, pins: m6502_pins): void { //CLD
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.P.D = 0;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 2: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xD9: return new M6502_opcode_functions(M6502_stock_matrix.get(0xD9),
            function(regs: m6502_regs, pins: m6502_pins): void { //CMP a,y
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        let o: i32 = regs.A - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xDA: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xDA),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xDB: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xDB),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xDC: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xDC),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xDD: return new M6502_opcode_functions(M6502_stock_matrix.get(0xDD),
            function(regs: m6502_regs, pins: m6502_pins): void { //CMP a,x
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        let o: i32 = regs.A - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xDE: return new M6502_opcode_functions(M6502_stock_matrix.get(0xDE),
            function(regs: m6502_regs, pins: m6502_pins): void { //DEC a,x
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
                        pins.Addr = (regs.TA + regs.X) & 0xFFFF;
                        break;
                    case 5: // spurious read/write
                        regs.TR = pins.D;
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
        });
        case 0xDF: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xDF),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xE0: return new M6502_opcode_functions(M6502_stock_matrix.get(0xE0),
            function(regs: m6502_regs, pins: m6502_pins): void { //CPX #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        let o: i32 = regs.X - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xE1: return new M6502_opcode_functions(M6502_stock_matrix.get(0xE1),
            function(regs: m6502_regs, pins: m6502_pins): void { //SBC (d,x)
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        pins.Addr = pins.D;
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        break;
                    case 3: // real read ABS L
                        pins.Addr = regs.TA;
                        break;
                    case 4: // read ABS H
                        regs.TA = pins.D;
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 5: // Read from addr
                        pins.Addr = regs.TA | (pins.D << 8);
                        break;
                    case 6: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D ^ 0xFF;
                        o = regs.A + i + regs.P.C;
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
        });
        case 0xE2: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xE2),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xE3: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xE3),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xE4: return new M6502_opcode_functions(M6502_stock_matrix.get(0xE4),
            function(regs: m6502_regs, pins: m6502_pins): void { //CPX d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        let o: i32 = regs.X - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xE5: return new M6502_opcode_functions(M6502_stock_matrix.get(0xE5),
            function(regs: m6502_regs, pins: m6502_pins): void { //SBC d
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = pins.D;
                        break;
                    case 3: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D ^ 0xFF;
                        o = regs.A + i + regs.P.C;
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
        });
        case 0xE6: return new M6502_opcode_functions(M6502_stock_matrix.get(0xE6),
            function(regs: m6502_regs, pins: m6502_pins): void { //INC d
                switch(regs.TCU) {
                    case 1: // fetch ZP
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // capture data
                        pins.Addr = pins.D;
                        break;
                    case 3: // spurious read/write
                        pins.RW = 1;
                        break;
                    case 4: // real write
                        pins.D = (pins.D + 1) & 0xFF;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 5: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xE7: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xE7),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xE8: return new M6502_opcode_functions(M6502_stock_matrix.get(0xE8),
            function(regs: m6502_regs, pins: m6502_pins): void { //INX
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.X = (regs.X + 1) & 0xFF;
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
        });
        case 0xE9: return new M6502_opcode_functions(M6502_stock_matrix.get(0xE9),
            function(regs: m6502_regs, pins: m6502_pins): void { //SBC #
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D ^ 0xFF;
                        o = regs.A + i + regs.P.C;
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
        });
        case 0xEA: return new M6502_opcode_functions(M6502_stock_matrix.get(0xEA),
            function(regs: m6502_regs, pins: m6502_pins): void { //NOP
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 2: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xEB: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xEB),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xEC: return new M6502_opcode_functions(M6502_stock_matrix.get(0xEC),
            function(regs: m6502_regs, pins: m6502_pins): void { //CPX a
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
                        let o: i32 = regs.X - pins.D;
                        regs.P.C = +(!((o & 0x100) >>> 8));
                        regs.P.Z = +((o & 0xFF) === 0);
                        regs.P.N = ((o) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xED: return new M6502_opcode_functions(M6502_stock_matrix.get(0xED),
            function(regs: m6502_regs, pins: m6502_pins): void { //SBC a
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
                        let o: i32;
                        let i: i32 = pins.D ^ 0xFF;
                        o = regs.A + i + regs.P.C;
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
        });
        case 0xEE: return new M6502_opcode_functions(M6502_stock_matrix.get(0xEE),
            function(regs: m6502_regs, pins: m6502_pins): void { //INC a
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
                        pins.RW = 1;
                        break;
                    case 5:
                        pins.D = (pins.D + 1) & 0xFF;
                        regs.P.Z = +((pins.D) === 0);
                        regs.P.N = ((pins.D) & 0x80) >>> 7;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 6: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        pins.RW = 0;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xEF: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xEF),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xF0: return new M6502_opcode_functions(M6502_stock_matrix.get(0xF0),
            function(regs: m6502_regs, pins: m6502_pins): void { //BEQ r
                switch(regs.TCU) {
                    case 1:
                        regs.TR = +(regs.P.Z === 1);
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }
                        break;
                    case 2:
                        regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;
                        pins.Addr = regs.PC;
                        if ((regs.TA & 0xFF00) === (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page
                        break;
                    case 3: // extra idle on page cross
                        pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 4: // cleanup_custom
                        regs.PC = regs.TA;
                        // Following is auto-generated code for instruction finish
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xF1: return new M6502_opcode_functions(M6502_stock_matrix.get(0xF1),
            function(regs: m6502_regs, pins: m6502_pins): void { //SBC (d),y
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
                        pins.Addr = (pins.Addr + 1) & 0xFF;
                        break;
                    case 4: // idle if crossed
                        regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;
                        regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;
                        if ((regs.TR & 0xFF00) === (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);
                        break;
                    case 5:
                        pins.Addr = regs.TA;
                        break;
                    case 6: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D ^ 0xFF;
                        o = regs.A + i + regs.P.C;
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
        });
        case 0xF2: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xF2),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xF3: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xF3),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xF4: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xF4),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xF5: return new M6502_opcode_functions(M6502_stock_matrix.get(0xF5),
            function(regs: m6502_regs, pins: m6502_pins): void { //SBC d,x
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D ^ 0xFF;
                        o = regs.A + i + regs.P.C;
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
        });
        case 0xF6: return new M6502_opcode_functions(M6502_stock_matrix.get(0xF6),
            function(regs: m6502_regs, pins: m6502_pins): void { //INC d,X
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2: // spurious read
                        regs.TA = (pins.D + regs.X) & 0xFF;
                        pins.Addr = pins.D;
                        break;
                    case 3:
                        pins.Addr = regs.TA;
                        break;
                    case 4: // spurious read/write
                        regs.TR = pins.D;
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
        });
        case 0xF7: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xF7),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xF8: return new M6502_opcode_functions(M6502_stock_matrix.get(0xF8),
            function(regs: m6502_regs, pins: m6502_pins): void { //SED
                switch(regs.TCU) {
                    case 1:
                        pins.Addr = regs.PC;
                        regs.P.D = 1;
                        // Following is auto-generated code for instruction finish
                        break;
                    case 2: // cleanup
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        regs.TCU = 0;
                        break;
                }
        });
        case 0xF9: return new M6502_opcode_functions(M6502_stock_matrix.get(0xF9),
            function(regs: m6502_regs, pins: m6502_pins): void { //SBC a,y
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D ^ 0xFF;
                        o = regs.A + i + regs.P.C;
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
        });
        case 0xFA: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xFA),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xFB: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xFB),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xFC: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xFC),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0xFD: return new M6502_opcode_functions(M6502_stock_matrix.get(0xFD),
            function(regs: m6502_regs, pins: m6502_pins): void { //SBC a,x
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
                        if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }
                        pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);
                        break;
                    case 4: // optional
                        pins.Addr = regs.TA;
                        break;
                    case 5: // cleanup_custom
                        let o: i32;
                        let i: i32 = pins.D ^ 0xFF;
                        o = regs.A + i + regs.P.C;
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
        });
        case 0xFE: return new M6502_opcode_functions(M6502_stock_matrix.get(0xFE),
            function(regs: m6502_regs, pins: m6502_pins): void { //INC a,x
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
                        pins.Addr = (regs.TA + regs.X) & 0xFFFF;
                        break;
                    case 5: // spurious read/write
                        regs.TR = pins.D;
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
        });
        case 0xFF: return new M6502_opcode_functions(M6502_invalid_matrix.get(0xFF),
            function(regs: m6502_regs, pins: m6502_pins): void { //
        });
        case 0x100: return new M6502_opcode_functions(M6502_stock_matrix.get(0x100),
            function(regs: m6502_regs, pins: m6502_pins): void { //RESET
                switch(regs.TCU) {
                    case 1: // 3
                        pins.RW = 0;
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
        });
        case 0x101: return new M6502_opcode_functions(M6502_stock_matrix.get(0x101),
            function(regs: m6502_regs, pins: m6502_pins): void { //NMI
                switch(regs.TCU) {
                    case 1:
                        regs.P.B = 0;
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        regs.TR = (regs.PC - 2) & 0xFFFF;
                        pins.D = (regs.TR >>> 8) & 0xFF;
                        pins.RW = 1;
                        break;
                    case 3:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        pins.D = regs.TR & 0xFF;
                        break;
                    case 4:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        pins.D = regs.P.getbyte();
                        break;
                    case 5:
                        regs.P.B = 1; // Confirmed via Visual6502 that this bit is actually set always during NMI, IRQ, and BRK
                        regs.P.I = 1;
                        pins.RW = 0;
                        pins.Addr = (0xFFFA);
                        break;
                    case 6:
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
        });
        case 0x102: return new M6502_opcode_functions(M6502_stock_matrix.get(0x102),
            function(regs: m6502_regs, pins: m6502_pins): void { //IRQ
                switch(regs.TCU) {
                    case 1:
                        regs.P.B = 0;
                        pins.Addr = regs.PC;
                        regs.PC = (regs.PC + 1) & 0xFFFF;
                        break;
                    case 2:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        regs.TR = (regs.PC - 2) & 0xFFFF;
                        pins.D = (regs.TR >>> 8) & 0xFF;
                        pins.RW = 1;
                        break;
                    case 3:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        pins.D = regs.TR & 0xFF;
                        break;
                    case 4:
                        pins.Addr = regs.S | 0x100;
                        regs.S = (regs.S - 1) & 0xFF;
                        pins.D = regs.P.getbyte();
                        break;
                    case 5:
                        regs.P.B = 1; // Confirmed via Visual6502 that this bit is actually set always during NMI, IRQ, and BRK
                        regs.P.I = 1;
                        pins.RW = 0;
                        pins.Addr = (0xFFFE);
                        break;
                    case 6:
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
        });
    }
    return new M6502_opcode_functions(M6502_invalid_matrix.get(opcode), function(regs: m6502_regs, pins: m6502_pins): void { console.log('INVALID OPCODE');});
}

for (let i = 0; i <= M6502_MAX_OPCODE; i++) {
    nesm6502_opcodes_decoded[i] = nesm6502_get_opcode_function(i);
}
