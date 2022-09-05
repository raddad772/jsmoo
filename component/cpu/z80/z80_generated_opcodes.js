"use strict";

const z80_decoded_opcodes = Object.freeze({
    0x00: new Z80_opcode_functions(Z80_opcode_matrix[0x00], // 00
        function(regs, pins) { //NOP
    }),
    0x01: new Z80_opcode_functions(Z80_opcode_matrix[0x01], // 01
        function(regs, pins) { //
    }),
    0x02: new Z80_opcode_functions(Z80_opcode_matrix[0x02], // 02
        function(regs, pins) { //
    }),
    0x03: new Z80_opcode_functions(Z80_opcode_matrix[0x03], // 03
        function(regs, pins) { //
    }),
    0x04: new Z80_opcode_functions(Z80_opcode_matrix[0x04], // 04
        function(regs, pins) { //
    }),
    0x05: new Z80_opcode_functions(Z80_opcode_matrix[0x05], // 05
        function(regs, pins) { //
    }),
    0x06: new Z80_opcode_functions(Z80_opcode_matrix[0x06], // 06
        function(regs, pins) { //
    }),
    0x07: new Z80_opcode_functions(Z80_opcode_matrix[0x07], // 07
        function(regs, pins) { //
    }),
    0x08: new Z80_opcode_functions(Z80_opcode_matrix[0x08], // 08
        function(regs, pins) { //
    }),
    0x09: new Z80_opcode_functions(Z80_opcode_matrix[0x09], // 09
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = BC & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (BC & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x0A: new Z80_opcode_functions(Z80_opcode_matrix[0x0A], // 0A
        function(regs, pins) { //
    }),
    0x0B: new Z80_opcode_functions(Z80_opcode_matrix[0x0B], // 0B
        function(regs, pins) { //
    }),
    0x0C: new Z80_opcode_functions(Z80_opcode_matrix[0x0C], // 0C
        function(regs, pins) { //
    }),
    0x0D: new Z80_opcode_functions(Z80_opcode_matrix[0x0D], // 0D
        function(regs, pins) { //
    }),
    0x0E: new Z80_opcode_functions(Z80_opcode_matrix[0x0E], // 0E
        function(regs, pins) { //
    }),
    0x0F: new Z80_opcode_functions(Z80_opcode_matrix[0x0F], // 0F
        function(regs, pins) { //
    }),
    0x10: new Z80_opcode_functions(Z80_opcode_matrix[0x10], // 10
        function(regs, pins) { //
    }),
    0x11: new Z80_opcode_functions(Z80_opcode_matrix[0x11], // 11
        function(regs, pins) { //
    }),
    0x12: new Z80_opcode_functions(Z80_opcode_matrix[0x12], // 12
        function(regs, pins) { //
    }),
    0x13: new Z80_opcode_functions(Z80_opcode_matrix[0x13], // 13
        function(regs, pins) { //
    }),
    0x14: new Z80_opcode_functions(Z80_opcode_matrix[0x14], // 14
        function(regs, pins) { //
    }),
    0x15: new Z80_opcode_functions(Z80_opcode_matrix[0x15], // 15
        function(regs, pins) { //
    }),
    0x16: new Z80_opcode_functions(Z80_opcode_matrix[0x16], // 16
        function(regs, pins) { //
    }),
    0x17: new Z80_opcode_functions(Z80_opcode_matrix[0x17], // 17
        function(regs, pins) { //
    }),
    0x18: new Z80_opcode_functions(Z80_opcode_matrix[0x18], // 18
        function(regs, pins) { //
    }),
    0x19: new Z80_opcode_functions(Z80_opcode_matrix[0x19], // 19
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = DE & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (DE & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x1A: new Z80_opcode_functions(Z80_opcode_matrix[0x1A], // 1A
        function(regs, pins) { //
    }),
    0x1B: new Z80_opcode_functions(Z80_opcode_matrix[0x1B], // 1B
        function(regs, pins) { //
    }),
    0x1C: new Z80_opcode_functions(Z80_opcode_matrix[0x1C], // 1C
        function(regs, pins) { //
    }),
    0x1D: new Z80_opcode_functions(Z80_opcode_matrix[0x1D], // 1D
        function(regs, pins) { //
    }),
    0x1E: new Z80_opcode_functions(Z80_opcode_matrix[0x1E], // 1E
        function(regs, pins) { //
    }),
    0x1F: new Z80_opcode_functions(Z80_opcode_matrix[0x1F], // 1F
        function(regs, pins) { //RRA
    }),
    0x20: new Z80_opcode_functions(Z80_opcode_matrix[0x20], // 20
        function(regs, pins) { //
    }),
    0x21: new Z80_opcode_functions(Z80_opcode_matrix[0x21], // 21
        function(regs, pins) { //
    }),
    0x22: new Z80_opcode_functions(Z80_opcode_matrix[0x22], // 22
        function(regs, pins) { //
    }),
    0x23: new Z80_opcode_functions(Z80_opcode_matrix[0x23], // 23
        function(regs, pins) { //
    }),
    0x24: new Z80_opcode_functions(Z80_opcode_matrix[0x24], // 24
        function(regs, pins) { //
    }),
    0x25: new Z80_opcode_functions(Z80_opcode_matrix[0x25], // 25
        function(regs, pins) { //
    }),
    0x26: new Z80_opcode_functions(Z80_opcode_matrix[0x26], // 26
        function(regs, pins) { //
    }),
    0x27: new Z80_opcode_functions(Z80_opcode_matrix[0x27], // 27
        function(regs, pins) { //DAA
    }),
    0x28: new Z80_opcode_functions(Z80_opcode_matrix[0x28], // 28
        function(regs, pins) { //
    }),
    0x29: new Z80_opcode_functions(Z80_opcode_matrix[0x29], // 29
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = HL & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (HL & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x2A: new Z80_opcode_functions(Z80_opcode_matrix[0x2A], // 2A
        function(regs, pins) { //
    }),
    0x2B: new Z80_opcode_functions(Z80_opcode_matrix[0x2B], // 2B
        function(regs, pins) { //
    }),
    0x2C: new Z80_opcode_functions(Z80_opcode_matrix[0x2C], // 2C
        function(regs, pins) { //
    }),
    0x2D: new Z80_opcode_functions(Z80_opcode_matrix[0x2D], // 2D
        function(regs, pins) { //
    }),
    0x2E: new Z80_opcode_functions(Z80_opcode_matrix[0x2E], // 2E
        function(regs, pins) { //
    }),
    0x2F: new Z80_opcode_functions(Z80_opcode_matrix[0x2F], // 2F
        function(regs, pins) { //CPL
    }),
    0x30: new Z80_opcode_functions(Z80_opcode_matrix[0x30], // 30
        function(regs, pins) { //regs.F.C === 0
    }),
    0x31: new Z80_opcode_functions(Z80_opcode_matrix[0x31], // 31
        function(regs, pins) { //
    }),
    0x32: new Z80_opcode_functions(Z80_opcode_matrix[0x32], // 32
        function(regs, pins) { //
    }),
    0x33: new Z80_opcode_functions(Z80_opcode_matrix[0x33], // 33
        function(regs, pins) { //
    }),
    0x34: new Z80_opcode_functions(Z80_opcode_matrix[0x34], // 34
        function(regs, pins) { //
    }),
    0x35: new Z80_opcode_functions(Z80_opcode_matrix[0x35], // 35
        function(regs, pins) { //
    }),
    0x36: new Z80_opcode_functions(Z80_opcode_matrix[0x36], // 36
        function(regs, pins) { //
    }),
    0x37: new Z80_opcode_functions(Z80_opcode_matrix[0x37], // 37
        function(regs, pins) { //SCF
    }),
    0x38: new Z80_opcode_functions(Z80_opcode_matrix[0x38], // 38
        function(regs, pins) { //
    }),
    0x39: new Z80_opcode_functions(Z80_opcode_matrix[0x39], // 39
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = SP & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (SP & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x3A: new Z80_opcode_functions(Z80_opcode_matrix[0x3A], // 3A
        function(regs, pins) { //
    }),
    0x3B: new Z80_opcode_functions(Z80_opcode_matrix[0x3B], // 3B
        function(regs, pins) { //
    }),
    0x3C: new Z80_opcode_functions(Z80_opcode_matrix[0x3C], // 3C
        function(regs, pins) { //
    }),
    0x3D: new Z80_opcode_functions(Z80_opcode_matrix[0x3D], // 3D
        function(regs, pins) { //
    }),
    0x3E: new Z80_opcode_functions(Z80_opcode_matrix[0x3E], // 3E
        function(regs, pins) { //
    }),
    0x3F: new Z80_opcode_functions(Z80_opcode_matrix[0x3F], // 3F
        function(regs, pins) { //CCF
    }),
    0x40: new Z80_opcode_functions(Z80_opcode_matrix[0x40], // 40
        function(regs, pins) { //
    }),
    0x41: new Z80_opcode_functions(Z80_opcode_matrix[0x41], // 41
        function(regs, pins) { //
    }),
    0x42: new Z80_opcode_functions(Z80_opcode_matrix[0x42], // 42
        function(regs, pins) { //
    }),
    0x43: new Z80_opcode_functions(Z80_opcode_matrix[0x43], // 43
        function(regs, pins) { //
    }),
    0x44: new Z80_opcode_functions(Z80_opcode_matrix[0x44], // 44
        function(regs, pins) { //
    }),
    0x45: new Z80_opcode_functions(Z80_opcode_matrix[0x45], // 45
        function(regs, pins) { //
    }),
    0x46: new Z80_opcode_functions(Z80_opcode_matrix[0x46], // 46
        function(regs, pins) { //
    }),
    0x47: new Z80_opcode_functions(Z80_opcode_matrix[0x47], // 47
        function(regs, pins) { //
    }),
    0x48: new Z80_opcode_functions(Z80_opcode_matrix[0x48], // 48
        function(regs, pins) { //
    }),
    0x49: new Z80_opcode_functions(Z80_opcode_matrix[0x49], // 49
        function(regs, pins) { //
    }),
    0x4A: new Z80_opcode_functions(Z80_opcode_matrix[0x4A], // 4A
        function(regs, pins) { //
    }),
    0x4B: new Z80_opcode_functions(Z80_opcode_matrix[0x4B], // 4B
        function(regs, pins) { //
    }),
    0x4C: new Z80_opcode_functions(Z80_opcode_matrix[0x4C], // 4C
        function(regs, pins) { //
    }),
    0x4D: new Z80_opcode_functions(Z80_opcode_matrix[0x4D], // 4D
        function(regs, pins) { //
    }),
    0x4E: new Z80_opcode_functions(Z80_opcode_matrix[0x4E], // 4E
        function(regs, pins) { //
    }),
    0x4F: new Z80_opcode_functions(Z80_opcode_matrix[0x4F], // 4F
        function(regs, pins) { //
    }),
    0x50: new Z80_opcode_functions(Z80_opcode_matrix[0x50], // 50
        function(regs, pins) { //
    }),
    0x51: new Z80_opcode_functions(Z80_opcode_matrix[0x51], // 51
        function(regs, pins) { //
    }),
    0x52: new Z80_opcode_functions(Z80_opcode_matrix[0x52], // 52
        function(regs, pins) { //
    }),
    0x53: new Z80_opcode_functions(Z80_opcode_matrix[0x53], // 53
        function(regs, pins) { //
    }),
    0x54: new Z80_opcode_functions(Z80_opcode_matrix[0x54], // 54
        function(regs, pins) { //
    }),
    0x55: new Z80_opcode_functions(Z80_opcode_matrix[0x55], // 55
        function(regs, pins) { //
    }),
    0x56: new Z80_opcode_functions(Z80_opcode_matrix[0x56], // 56
        function(regs, pins) { //
    }),
    0x57: new Z80_opcode_functions(Z80_opcode_matrix[0x57], // 57
        function(regs, pins) { //
    }),
    0x58: new Z80_opcode_functions(Z80_opcode_matrix[0x58], // 58
        function(regs, pins) { //
    }),
    0x59: new Z80_opcode_functions(Z80_opcode_matrix[0x59], // 59
        function(regs, pins) { //
    }),
    0x5A: new Z80_opcode_functions(Z80_opcode_matrix[0x5A], // 5A
        function(regs, pins) { //
    }),
    0x5B: new Z80_opcode_functions(Z80_opcode_matrix[0x5B], // 5B
        function(regs, pins) { //
    }),
    0x5C: new Z80_opcode_functions(Z80_opcode_matrix[0x5C], // 5C
        function(regs, pins) { //
    }),
    0x5D: new Z80_opcode_functions(Z80_opcode_matrix[0x5D], // 5D
        function(regs, pins) { //
    }),
    0x5E: new Z80_opcode_functions(Z80_opcode_matrix[0x5E], // 5E
        function(regs, pins) { //
    }),
    0x5F: new Z80_opcode_functions(Z80_opcode_matrix[0x5F], // 5F
        function(regs, pins) { //
    }),
    0x60: new Z80_opcode_functions(Z80_opcode_matrix[0x60], // 60
        function(regs, pins) { //
    }),
    0x61: new Z80_opcode_functions(Z80_opcode_matrix[0x61], // 61
        function(regs, pins) { //
    }),
    0x62: new Z80_opcode_functions(Z80_opcode_matrix[0x62], // 62
        function(regs, pins) { //
    }),
    0x63: new Z80_opcode_functions(Z80_opcode_matrix[0x63], // 63
        function(regs, pins) { //
    }),
    0x64: new Z80_opcode_functions(Z80_opcode_matrix[0x64], // 64
        function(regs, pins) { //
    }),
    0x65: new Z80_opcode_functions(Z80_opcode_matrix[0x65], // 65
        function(regs, pins) { //
    }),
    0x66: new Z80_opcode_functions(Z80_opcode_matrix[0x66], // 66
        function(regs, pins) { //
    }),
    0x67: new Z80_opcode_functions(Z80_opcode_matrix[0x67], // 67
        function(regs, pins) { //
    }),
    0x68: new Z80_opcode_functions(Z80_opcode_matrix[0x68], // 68
        function(regs, pins) { //
    }),
    0x69: new Z80_opcode_functions(Z80_opcode_matrix[0x69], // 69
        function(regs, pins) { //
    }),
    0x6A: new Z80_opcode_functions(Z80_opcode_matrix[0x6A], // 6A
        function(regs, pins) { //
    }),
    0x6B: new Z80_opcode_functions(Z80_opcode_matrix[0x6B], // 6B
        function(regs, pins) { //
    }),
    0x6C: new Z80_opcode_functions(Z80_opcode_matrix[0x6C], // 6C
        function(regs, pins) { //
    }),
    0x6D: new Z80_opcode_functions(Z80_opcode_matrix[0x6D], // 6D
        function(regs, pins) { //
    }),
    0x6E: new Z80_opcode_functions(Z80_opcode_matrix[0x6E], // 6E
        function(regs, pins) { //
    }),
    0x6F: new Z80_opcode_functions(Z80_opcode_matrix[0x6F], // 6F
        function(regs, pins) { //
    }),
    0x70: new Z80_opcode_functions(Z80_opcode_matrix[0x70], // 70
        function(regs, pins) { //
    }),
    0x71: new Z80_opcode_functions(Z80_opcode_matrix[0x71], // 71
        function(regs, pins) { //
    }),
    0x72: new Z80_opcode_functions(Z80_opcode_matrix[0x72], // 72
        function(regs, pins) { //
    }),
    0x73: new Z80_opcode_functions(Z80_opcode_matrix[0x73], // 73
        function(regs, pins) { //
    }),
    0x74: new Z80_opcode_functions(Z80_opcode_matrix[0x74], // 74
        function(regs, pins) { //
    }),
    0x75: new Z80_opcode_functions(Z80_opcode_matrix[0x75], // 75
        function(regs, pins) { //
    }),
    0x76: new Z80_opcode_functions(Z80_opcode_matrix[0x76], // 76
        function(regs, pins) { //HALT
    }),
    0x77: new Z80_opcode_functions(Z80_opcode_matrix[0x77], // 77
        function(regs, pins) { //
    }),
    0x78: new Z80_opcode_functions(Z80_opcode_matrix[0x78], // 78
        function(regs, pins) { //
    }),
    0x79: new Z80_opcode_functions(Z80_opcode_matrix[0x79], // 79
        function(regs, pins) { //
    }),
    0x7A: new Z80_opcode_functions(Z80_opcode_matrix[0x7A], // 7A
        function(regs, pins) { //
    }),
    0x7B: new Z80_opcode_functions(Z80_opcode_matrix[0x7B], // 7B
        function(regs, pins) { //
    }),
    0x7C: new Z80_opcode_functions(Z80_opcode_matrix[0x7C], // 7C
        function(regs, pins) { //
    }),
    0x7D: new Z80_opcode_functions(Z80_opcode_matrix[0x7D], // 7D
        function(regs, pins) { //
    }),
    0x7E: new Z80_opcode_functions(Z80_opcode_matrix[0x7E], // 7E
        function(regs, pins) { //
    }),
    0x7F: new Z80_opcode_functions(Z80_opcode_matrix[0x7F], // 7F
        function(regs, pins) { //
    }),
    0x80: new Z80_opcode_functions(Z80_opcode_matrix[0x80], // 80
        function(regs, pins) { //
    }),
    0x81: new Z80_opcode_functions(Z80_opcode_matrix[0x81], // 81
        function(regs, pins) { //
    }),
    0x82: new Z80_opcode_functions(Z80_opcode_matrix[0x82], // 82
        function(regs, pins) { //
    }),
    0x83: new Z80_opcode_functions(Z80_opcode_matrix[0x83], // 83
        function(regs, pins) { //
    }),
    0x84: new Z80_opcode_functions(Z80_opcode_matrix[0x84], // 84
        function(regs, pins) { //
    }),
    0x85: new Z80_opcode_functions(Z80_opcode_matrix[0x85], // 85
        function(regs, pins) { //
    }),
    0x86: new Z80_opcode_functions(Z80_opcode_matrix[0x86], // 86
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = regs.TA;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TA = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x87: new Z80_opcode_functions(Z80_opcode_matrix[0x87], // 87
        function(regs, pins) { //
    }),
    0x88: new Z80_opcode_functions(Z80_opcode_matrix[0x88], // 88
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = B;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x89: new Z80_opcode_functions(Z80_opcode_matrix[0x89], // 89
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = C;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x8A: new Z80_opcode_functions(Z80_opcode_matrix[0x8A], // 8A
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = D;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x8B: new Z80_opcode_functions(Z80_opcode_matrix[0x8B], // 8B
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = E;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x8C: new Z80_opcode_functions(Z80_opcode_matrix[0x8C], // 8C
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = H;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x8D: new Z80_opcode_functions(Z80_opcode_matrix[0x8D], // 8D
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = L;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x8E: new Z80_opcode_functions(Z80_opcode_matrix[0x8E], // 8E
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = regs.TA;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x8F: new Z80_opcode_functions(Z80_opcode_matrix[0x8F], // 8F
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = A;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x90: new Z80_opcode_functions(Z80_opcode_matrix[0x90], // 90
        function(regs, pins) { //
    }),
    0x91: new Z80_opcode_functions(Z80_opcode_matrix[0x91], // 91
        function(regs, pins) { //
    }),
    0x92: new Z80_opcode_functions(Z80_opcode_matrix[0x92], // 92
        function(regs, pins) { //
    }),
    0x93: new Z80_opcode_functions(Z80_opcode_matrix[0x93], // 93
        function(regs, pins) { //
    }),
    0x94: new Z80_opcode_functions(Z80_opcode_matrix[0x94], // 94
        function(regs, pins) { //
    }),
    0x95: new Z80_opcode_functions(Z80_opcode_matrix[0x95], // 95
        function(regs, pins) { //
    }),
    0x96: new Z80_opcode_functions(Z80_opcode_matrix[0x96], // 96
        function(regs, pins) { //
    }),
    0x97: new Z80_opcode_functions(Z80_opcode_matrix[0x97], // 97
        function(regs, pins) { //
    }),
    0x98: new Z80_opcode_functions(Z80_opcode_matrix[0x98], // 98
        function(regs, pins) { //
    }),
    0x99: new Z80_opcode_functions(Z80_opcode_matrix[0x99], // 99
        function(regs, pins) { //
    }),
    0x9A: new Z80_opcode_functions(Z80_opcode_matrix[0x9A], // 9A
        function(regs, pins) { //
    }),
    0x9B: new Z80_opcode_functions(Z80_opcode_matrix[0x9B], // 9B
        function(regs, pins) { //
    }),
    0x9C: new Z80_opcode_functions(Z80_opcode_matrix[0x9C], // 9C
        function(regs, pins) { //
    }),
    0x9D: new Z80_opcode_functions(Z80_opcode_matrix[0x9D], // 9D
        function(regs, pins) { //
    }),
    0x9E: new Z80_opcode_functions(Z80_opcode_matrix[0x9E], // 9E
        function(regs, pins) { //
    }),
    0x9F: new Z80_opcode_functions(Z80_opcode_matrix[0x9F], // 9F
        function(regs, pins) { //
    }),
    0xA0: new Z80_opcode_functions(Z80_opcode_matrix[0xA0], // A0
        function(regs, pins) { //
    }),
    0xA1: new Z80_opcode_functions(Z80_opcode_matrix[0xA1], // A1
        function(regs, pins) { //
    }),
    0xA2: new Z80_opcode_functions(Z80_opcode_matrix[0xA2], // A2
        function(regs, pins) { //
    }),
    0xA3: new Z80_opcode_functions(Z80_opcode_matrix[0xA3], // A3
        function(regs, pins) { //
    }),
    0xA4: new Z80_opcode_functions(Z80_opcode_matrix[0xA4], // A4
        function(regs, pins) { //
    }),
    0xA5: new Z80_opcode_functions(Z80_opcode_matrix[0xA5], // A5
        function(regs, pins) { //
    }),
    0xA6: new Z80_opcode_functions(Z80_opcode_matrix[0xA6], // A6
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = regs.TA;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = (regs.A) & (regs.TR);
                regs.F.C = regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0xA7: new Z80_opcode_functions(Z80_opcode_matrix[0xA7], // A7
        function(regs, pins) { //
    }),
    0xA8: new Z80_opcode_functions(Z80_opcode_matrix[0xA8], // A8
        function(regs, pins) { //
    }),
    0xA9: new Z80_opcode_functions(Z80_opcode_matrix[0xA9], // A9
        function(regs, pins) { //
    }),
    0xAA: new Z80_opcode_functions(Z80_opcode_matrix[0xAA], // AA
        function(regs, pins) { //
    }),
    0xAB: new Z80_opcode_functions(Z80_opcode_matrix[0xAB], // AB
        function(regs, pins) { //
    }),
    0xAC: new Z80_opcode_functions(Z80_opcode_matrix[0xAC], // AC
        function(regs, pins) { //
    }),
    0xAD: new Z80_opcode_functions(Z80_opcode_matrix[0xAD], // AD
        function(regs, pins) { //
    }),
    0xAE: new Z80_opcode_functions(Z80_opcode_matrix[0xAE], // AE
        function(regs, pins) { //
    }),
    0xAF: new Z80_opcode_functions(Z80_opcode_matrix[0xAF], // AF
        function(regs, pins) { //
    }),
    0xB0: new Z80_opcode_functions(Z80_opcode_matrix[0xB0], // B0
        function(regs, pins) { //
    }),
    0xB1: new Z80_opcode_functions(Z80_opcode_matrix[0xB1], // B1
        function(regs, pins) { //
    }),
    0xB2: new Z80_opcode_functions(Z80_opcode_matrix[0xB2], // B2
        function(regs, pins) { //
    }),
    0xB3: new Z80_opcode_functions(Z80_opcode_matrix[0xB3], // B3
        function(regs, pins) { //
    }),
    0xB4: new Z80_opcode_functions(Z80_opcode_matrix[0xB4], // B4
        function(regs, pins) { //
    }),
    0xB5: new Z80_opcode_functions(Z80_opcode_matrix[0xB5], // B5
        function(regs, pins) { //
    }),
    0xB6: new Z80_opcode_functions(Z80_opcode_matrix[0xB6], // B6
        function(regs, pins) { //
    }),
    0xB7: new Z80_opcode_functions(Z80_opcode_matrix[0xB7], // B7
        function(regs, pins) { //
    }),
    0xB8: new Z80_opcode_functions(Z80_opcode_matrix[0xB8], // B8
        function(regs, pins) { //
    }),
    0xB9: new Z80_opcode_functions(Z80_opcode_matrix[0xB9], // B9
        function(regs, pins) { //
    }),
    0xBA: new Z80_opcode_functions(Z80_opcode_matrix[0xBA], // BA
        function(regs, pins) { //
    }),
    0xBB: new Z80_opcode_functions(Z80_opcode_matrix[0xBB], // BB
        function(regs, pins) { //
    }),
    0xBC: new Z80_opcode_functions(Z80_opcode_matrix[0xBC], // BC
        function(regs, pins) { //
    }),
    0xBD: new Z80_opcode_functions(Z80_opcode_matrix[0xBD], // BD
        function(regs, pins) { //
    }),
    0xBE: new Z80_opcode_functions(Z80_opcode_matrix[0xBE], // BE
        function(regs, pins) { //
    }),
    0xBF: new Z80_opcode_functions(Z80_opcode_matrix[0xBF], // BF
        function(regs, pins) { //
    }),
    0xC0: new Z80_opcode_functions(Z80_opcode_matrix[0xC0], // C0
        function(regs, pins) { //
    }),
    0xC1: new Z80_opcode_functions(Z80_opcode_matrix[0xC1], // C1
        function(regs, pins) { //
    }),
    0xC2: new Z80_opcode_functions(Z80_opcode_matrix[0xC2], // C2
        function(regs, pins) { //
    }),
    0xC3: new Z80_opcode_functions(Z80_opcode_matrix[0xC3], // C3
        function(regs, pins) { //
    }),
    0xC4: new Z80_opcode_functions(Z80_opcode_matrix[0xC4], // C4
        function(regs, pins) { //
    }),
    0xC5: new Z80_opcode_functions(Z80_opcode_matrix[0xC5], // C5
        function(regs, pins) { //
    }),
    0xC6: new Z80_opcode_functions(Z80_opcode_matrix[0xC6], // C6
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0xC7: new Z80_opcode_functions(Z80_opcode_matrix[0xC7], // C7
        function(regs, pins) { //
    }),
    0xC8: new Z80_opcode_functions(Z80_opcode_matrix[0xC8], // C8
        function(regs, pins) { //
    }),
    0xC9: new Z80_opcode_functions(Z80_opcode_matrix[0xC9], // C9
        function(regs, pins) { //undefined
    }),
    0xCA: new Z80_opcode_functions(Z80_opcode_matrix[0xCA], // CA
        function(regs, pins) { //
    }),
    0xCB: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xCC: new Z80_opcode_functions(Z80_opcode_matrix[0xCC], // CC
        function(regs, pins) { //
    }),
    0xCD: new Z80_opcode_functions(Z80_opcode_matrix[0xCD], // CD
        function(regs, pins) { //
    }),
    0xCE: new Z80_opcode_functions(Z80_opcode_matrix[0xCE], // CE
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0xCF: new Z80_opcode_functions(Z80_opcode_matrix[0xCF], // CF
        function(regs, pins) { //
    }),
    0xD0: new Z80_opcode_functions(Z80_opcode_matrix[0xD0], // D0
        function(regs, pins) { //
    }),
    0xD1: new Z80_opcode_functions(Z80_opcode_matrix[0xD1], // D1
        function(regs, pins) { //
    }),
    0xD2: new Z80_opcode_functions(Z80_opcode_matrix[0xD2], // D2
        function(regs, pins) { //
    }),
    0xD3: new Z80_opcode_functions(Z80_opcode_matrix[0xD3], // D3
        function(regs, pins) { //
    }),
    0xD4: new Z80_opcode_functions(Z80_opcode_matrix[0xD4], // D4
        function(regs, pins) { //
    }),
    0xD5: new Z80_opcode_functions(Z80_opcode_matrix[0xD5], // D5
        function(regs, pins) { //
    }),
    0xD6: new Z80_opcode_functions(Z80_opcode_matrix[0xD6], // D6
        function(regs, pins) { //
    }),
    0xD7: new Z80_opcode_functions(Z80_opcode_matrix[0xD7], // D7
        function(regs, pins) { //
    }),
    0xD8: new Z80_opcode_functions(Z80_opcode_matrix[0xD8], // D8
        function(regs, pins) { //
    }),
    0xD9: new Z80_opcode_functions(Z80_opcode_matrix[0xD9], // D9
        function(regs, pins) { //undefined
    }),
    0xDA: new Z80_opcode_functions(Z80_opcode_matrix[0xDA], // DA
        function(regs, pins) { //
    }),
    0xDB: new Z80_opcode_functions(Z80_opcode_matrix[0xDB], // DB
        function(regs, pins) { //
    }),
    0xDC: new Z80_opcode_functions(Z80_opcode_matrix[0xDC], // DC
        function(regs, pins) { //
    }),
    0xDD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xDE: new Z80_opcode_functions(Z80_opcode_matrix[0xDE], // DE
        function(regs, pins) { //
    }),
    0xDF: new Z80_opcode_functions(Z80_opcode_matrix[0xDF], // DF
        function(regs, pins) { //
    }),
    0xE0: new Z80_opcode_functions(Z80_opcode_matrix[0xE0], // E0
        function(regs, pins) { //
    }),
    0xE1: new Z80_opcode_functions(Z80_opcode_matrix[0xE1], // E1
        function(regs, pins) { //
    }),
    0xE2: new Z80_opcode_functions(Z80_opcode_matrix[0xE2], // E2
        function(regs, pins) { //
    }),
    0xE3: new Z80_opcode_functions(Z80_opcode_matrix[0xE3], // E3
        function(regs, pins) { //
    }),
    0xE4: new Z80_opcode_functions(Z80_opcode_matrix[0xE4], // E4
        function(regs, pins) { //
    }),
    0xE5: new Z80_opcode_functions(Z80_opcode_matrix[0xE5], // E5
        function(regs, pins) { //
    }),
    0xE6: new Z80_opcode_functions(Z80_opcode_matrix[0xE6], // E6
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                let z = (regs.A) & (regs.TR);
                regs.F.C = regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0xE7: new Z80_opcode_functions(Z80_opcode_matrix[0xE7], // E7
        function(regs, pins) { //
    }),
    0xE8: new Z80_opcode_functions(Z80_opcode_matrix[0xE8], // E8
        function(regs, pins) { //
    }),
    0xE9: new Z80_opcode_functions(Z80_opcode_matrix[0xE9], // E9
        function(regs, pins) { //
    }),
    0xEA: new Z80_opcode_functions(Z80_opcode_matrix[0xEA], // EA
        function(regs, pins) { //
    }),
    0xEB: new Z80_opcode_functions(Z80_opcode_matrix[0xEB], // EB
        function(regs, pins) { //
    }),
    0xEC: new Z80_opcode_functions(Z80_opcode_matrix[0xEC], // EC
        function(regs, pins) { //
    }),
    0xED: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xEE: new Z80_opcode_functions(Z80_opcode_matrix[0xEE], // EE
        function(regs, pins) { //undefined
    }),
    0xEF: new Z80_opcode_functions(Z80_opcode_matrix[0xEF], // EF
        function(regs, pins) { //5
    }),
    0xF0: new Z80_opcode_functions(Z80_opcode_matrix[0xF0], // F0
        function(regs, pins) { //
    }),
    0xF1: new Z80_opcode_functions(Z80_opcode_matrix[0xF1], // F1
        function(regs, pins) { //
    }),
    0xF2: new Z80_opcode_functions(Z80_opcode_matrix[0xF2], // F2
        function(regs, pins) { //
    }),
    0xF3: new Z80_opcode_functions(Z80_opcode_matrix[0xF3], // F3
        function(regs, pins) { //DI
    }),
    0xF4: new Z80_opcode_functions(Z80_opcode_matrix[0xF4], // F4
        function(regs, pins) { //
    }),
    0xF5: new Z80_opcode_functions(Z80_opcode_matrix[0xF5], // F5
        function(regs, pins) { //
    }),
    0xF6: new Z80_opcode_functions(Z80_opcode_matrix[0xF6], // F6
        function(regs, pins) { //
    }),
    0xF7: new Z80_opcode_functions(Z80_opcode_matrix[0xF7], // F7
        function(regs, pins) { //
    }),
    0xF8: new Z80_opcode_functions(Z80_opcode_matrix[0xF8], // F8
        function(regs, pins) { //
    }),
    0xF9: new Z80_opcode_functions(Z80_opcode_matrix[0xF9], // F9
        function(regs, pins) { //
    }),
    0xFA: new Z80_opcode_functions(Z80_opcode_matrix[0xFA], // FA
        function(regs, pins) { //regs.F.S === 1
    }),
    0xFB: new Z80_opcode_functions(Z80_opcode_matrix[0xFB], // FB
        function(regs, pins) { //EI
    }),
    0xFC: new Z80_opcode_functions(Z80_opcode_matrix[0xFC], // FC
        function(regs, pins) { //
    }),
    0xFD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xFE: new Z80_opcode_functions(Z80_opcode_matrix[0xFE], // FE
        function(regs, pins) { //
    }),
    0xFF: new Z80_opcode_functions(Z80_opcode_matrix[0xFF], // FF
        function(regs, pins) { //
    }),
    0x100: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x00], // CB 00
        function(regs, pins) { //
    }),
    0x101: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x01], // CB 01
        function(regs, pins) { //
    }),
    0x102: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x02], // CB 02
        function(regs, pins) { //
    }),
    0x103: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x03], // CB 03
        function(regs, pins) { //
    }),
    0x104: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x04], // CB 04
        function(regs, pins) { //
    }),
    0x105: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x05], // CB 05
        function(regs, pins) { //
    }),
    0x106: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x06], // CB 06
        function(regs, pins) { //
    }),
    0x107: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x07], // CB 07
        function(regs, pins) { //
    }),
    0x108: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x08], // CB 08
        function(regs, pins) { //
    }),
    0x109: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x09], // CB 09
        function(regs, pins) { //
    }),
    0x10A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x0A], // CB 0A
        function(regs, pins) { //
    }),
    0x10B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x0B], // CB 0B
        function(regs, pins) { //
    }),
    0x10C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x0C], // CB 0C
        function(regs, pins) { //
    }),
    0x10D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x0D], // CB 0D
        function(regs, pins) { //
    }),
    0x10E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x0E], // CB 0E
        function(regs, pins) { //
    }),
    0x10F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x0F], // CB 0F
        function(regs, pins) { //
    }),
    0x110: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x10], // CB 10
        function(regs, pins) { //
    }),
    0x111: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x11], // CB 11
        function(regs, pins) { //
    }),
    0x112: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x12], // CB 12
        function(regs, pins) { //
    }),
    0x113: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x13], // CB 13
        function(regs, pins) { //
    }),
    0x114: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x14], // CB 14
        function(regs, pins) { //
    }),
    0x115: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x15], // CB 15
        function(regs, pins) { //
    }),
    0x116: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x16], // CB 16
        function(regs, pins) { //
    }),
    0x117: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x17], // CB 17
        function(regs, pins) { //
    }),
    0x118: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x18], // CB 18
        function(regs, pins) { //
    }),
    0x119: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x19], // CB 19
        function(regs, pins) { //
    }),
    0x11A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x1A], // CB 1A
        function(regs, pins) { //
    }),
    0x11B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x1B], // CB 1B
        function(regs, pins) { //
    }),
    0x11C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x1C], // CB 1C
        function(regs, pins) { //
    }),
    0x11D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x1D], // CB 1D
        function(regs, pins) { //
    }),
    0x11E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x1E], // CB 1E
        function(regs, pins) { //
    }),
    0x11F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x1F], // CB 1F
        function(regs, pins) { //
    }),
    0x120: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x20], // CB 20
        function(regs, pins) { //
    }),
    0x121: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x21], // CB 21
        function(regs, pins) { //
    }),
    0x122: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x22], // CB 22
        function(regs, pins) { //
    }),
    0x123: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x23], // CB 23
        function(regs, pins) { //
    }),
    0x124: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x24], // CB 24
        function(regs, pins) { //
    }),
    0x125: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x25], // CB 25
        function(regs, pins) { //
    }),
    0x126: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x26], // CB 26
        function(regs, pins) { //
    }),
    0x127: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x27], // CB 27
        function(regs, pins) { //
    }),
    0x128: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x28], // CB 28
        function(regs, pins) { //
    }),
    0x129: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x29], // CB 29
        function(regs, pins) { //
    }),
    0x12A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x2A], // CB 2A
        function(regs, pins) { //
    }),
    0x12B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x2B], // CB 2B
        function(regs, pins) { //
    }),
    0x12C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x2C], // CB 2C
        function(regs, pins) { //
    }),
    0x12D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x2D], // CB 2D
        function(regs, pins) { //
    }),
    0x12E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x2E], // CB 2E
        function(regs, pins) { //
    }),
    0x12F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x2F], // CB 2F
        function(regs, pins) { //
    }),
    0x130: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x30], // CB 30
        function(regs, pins) { //
    }),
    0x131: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x31], // CB 31
        function(regs, pins) { //
    }),
    0x132: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x32], // CB 32
        function(regs, pins) { //
    }),
    0x133: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x33], // CB 33
        function(regs, pins) { //
    }),
    0x134: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x34], // CB 34
        function(regs, pins) { //
    }),
    0x135: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x35], // CB 35
        function(regs, pins) { //
    }),
    0x136: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x36], // CB 36
        function(regs, pins) { //
    }),
    0x137: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x37], // CB 37
        function(regs, pins) { //
    }),
    0x138: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x38], // CB 38
        function(regs, pins) { //
    }),
    0x139: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x39], // CB 39
        function(regs, pins) { //
    }),
    0x13A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x3A], // CB 3A
        function(regs, pins) { //
    }),
    0x13B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x3B], // CB 3B
        function(regs, pins) { //
    }),
    0x13C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x3C], // CB 3C
        function(regs, pins) { //
    }),
    0x13D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x3D], // CB 3D
        function(regs, pins) { //
    }),
    0x13E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x3E], // CB 3E
        function(regs, pins) { //
    }),
    0x13F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x3F], // CB 3F
        function(regs, pins) { //
    }),
    0x140: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x40], // CB 40
        function(regs, pins) { //
    }),
    0x141: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x41], // CB 41
        function(regs, pins) { //
    }),
    0x142: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x42], // CB 42
        function(regs, pins) { //
    }),
    0x143: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x43], // CB 43
        function(regs, pins) { //
    }),
    0x144: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x44], // CB 44
        function(regs, pins) { //
    }),
    0x145: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x45], // CB 45
        function(regs, pins) { //
    }),
    0x146: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x46], // CB 46
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                pins.Addr = _HL;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = ((regs.TR) & 1) << 0;
                regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.Y = ((regs.TR) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.F.X = (((regs.WZ >>> 8)) & 8) >>> 3;
                regs.F.Y = (((regs.WZ >>> 8)) & 0x20) >>> 5;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x147: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x47], // CB 47
        function(regs, pins) { //
    }),
    0x148: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x48], // CB 48
        function(regs, pins) { //
    }),
    0x149: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x49], // CB 49
        function(regs, pins) { //
    }),
    0x14A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x4A], // CB 4A
        function(regs, pins) { //
    }),
    0x14B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x4B], // CB 4B
        function(regs, pins) { //
    }),
    0x14C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x4C], // CB 4C
        function(regs, pins) { //
    }),
    0x14D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x4D], // CB 4D
        function(regs, pins) { //
    }),
    0x14E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x4E], // CB 4E
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                pins.Addr = _HL;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = ((regs.TR) & 1) << 1;
                regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.Y = ((regs.TR) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.F.X = (((regs.WZ >>> 8)) & 8) >>> 3;
                regs.F.Y = (((regs.WZ >>> 8)) & 0x20) >>> 5;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x14F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x4F], // CB 4F
        function(regs, pins) { //
    }),
    0x150: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x50], // CB 50
        function(regs, pins) { //
    }),
    0x151: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x51], // CB 51
        function(regs, pins) { //
    }),
    0x152: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x52], // CB 52
        function(regs, pins) { //
    }),
    0x153: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x53], // CB 53
        function(regs, pins) { //
    }),
    0x154: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x54], // CB 54
        function(regs, pins) { //
    }),
    0x155: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x55], // CB 55
        function(regs, pins) { //
    }),
    0x156: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x56], // CB 56
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                pins.Addr = _HL;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = ((regs.TR) & 1) << 2;
                regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.Y = ((regs.TR) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.F.X = (((regs.WZ >>> 8)) & 8) >>> 3;
                regs.F.Y = (((regs.WZ >>> 8)) & 0x20) >>> 5;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x157: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x57], // CB 57
        function(regs, pins) { //
    }),
    0x158: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x58], // CB 58
        function(regs, pins) { //
    }),
    0x159: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x59], // CB 59
        function(regs, pins) { //
    }),
    0x15A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x5A], // CB 5A
        function(regs, pins) { //
    }),
    0x15B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x5B], // CB 5B
        function(regs, pins) { //
    }),
    0x15C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x5C], // CB 5C
        function(regs, pins) { //
    }),
    0x15D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x5D], // CB 5D
        function(regs, pins) { //
    }),
    0x15E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x5E], // CB 5E
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                pins.Addr = _HL;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = ((regs.TR) & 1) << 3;
                regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.Y = ((regs.TR) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.F.X = (((regs.WZ >>> 8)) & 8) >>> 3;
                regs.F.Y = (((regs.WZ >>> 8)) & 0x20) >>> 5;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x15F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x5F], // CB 5F
        function(regs, pins) { //
    }),
    0x160: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x60], // CB 60
        function(regs, pins) { //
    }),
    0x161: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x61], // CB 61
        function(regs, pins) { //
    }),
    0x162: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x62], // CB 62
        function(regs, pins) { //
    }),
    0x163: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x63], // CB 63
        function(regs, pins) { //
    }),
    0x164: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x64], // CB 64
        function(regs, pins) { //
    }),
    0x165: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x65], // CB 65
        function(regs, pins) { //
    }),
    0x166: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x66], // CB 66
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                pins.Addr = _HL;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = ((regs.TR) & 1) << 4;
                regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.Y = ((regs.TR) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.F.X = (((regs.WZ >>> 8)) & 8) >>> 3;
                regs.F.Y = (((regs.WZ >>> 8)) & 0x20) >>> 5;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x167: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x67], // CB 67
        function(regs, pins) { //
    }),
    0x168: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x68], // CB 68
        function(regs, pins) { //
    }),
    0x169: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x69], // CB 69
        function(regs, pins) { //
    }),
    0x16A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x6A], // CB 6A
        function(regs, pins) { //
    }),
    0x16B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x6B], // CB 6B
        function(regs, pins) { //
    }),
    0x16C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x6C], // CB 6C
        function(regs, pins) { //
    }),
    0x16D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x6D], // CB 6D
        function(regs, pins) { //
    }),
    0x16E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x6E], // CB 6E
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                pins.Addr = _HL;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = ((regs.TR) & 1) << 5;
                regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.Y = ((regs.TR) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.F.X = (((regs.WZ >>> 8)) & 8) >>> 3;
                regs.F.Y = (((regs.WZ >>> 8)) & 0x20) >>> 5;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x16F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x6F], // CB 6F
        function(regs, pins) { //
    }),
    0x170: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x70], // CB 70
        function(regs, pins) { //
    }),
    0x171: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x71], // CB 71
        function(regs, pins) { //
    }),
    0x172: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x72], // CB 72
        function(regs, pins) { //
    }),
    0x173: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x73], // CB 73
        function(regs, pins) { //
    }),
    0x174: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x74], // CB 74
        function(regs, pins) { //
    }),
    0x175: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x75], // CB 75
        function(regs, pins) { //
    }),
    0x176: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x76], // CB 76
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                pins.Addr = _HL;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = ((regs.TR) & 1) << 6;
                regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.Y = ((regs.TR) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.F.X = (((regs.WZ >>> 8)) & 8) >>> 3;
                regs.F.Y = (((regs.WZ >>> 8)) & 0x20) >>> 5;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x177: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x77], // CB 77
        function(regs, pins) { //
    }),
    0x178: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x78], // CB 78
        function(regs, pins) { //
    }),
    0x179: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x79], // CB 79
        function(regs, pins) { //
    }),
    0x17A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x7A], // CB 7A
        function(regs, pins) { //
    }),
    0x17B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x7B], // CB 7B
        function(regs, pins) { //
    }),
    0x17C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x7C], // CB 7C
        function(regs, pins) { //
    }),
    0x17D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x7D], // CB 7D
        function(regs, pins) { //
    }),
    0x17E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x7E], // CB 7E
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // Start read
                regs.Q = 1;
                pins.Addr = _HL;
                pins.IO = undefined;
                break;
            case 2:
                pins.RD = 1;
                break;
            case 3: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = ((regs.TR) & 1) << 7;
                regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.X = ((regs.TR) & 8) >>> 3;
                regs.F.Y = ((regs.TR) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.F.X = (((regs.WZ >>> 8)) & 8) >>> 3;
                regs.F.Y = (((regs.WZ >>> 8)) & 0x20) >>> 5;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x17F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x7F], // CB 7F
        function(regs, pins) { //
    }),
    0x180: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x80], // CB 80
        function(regs, pins) { //
    }),
    0x181: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x81], // CB 81
        function(regs, pins) { //
    }),
    0x182: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x82], // CB 82
        function(regs, pins) { //
    }),
    0x183: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x83], // CB 83
        function(regs, pins) { //
    }),
    0x184: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x84], // CB 84
        function(regs, pins) { //
    }),
    0x185: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x85], // CB 85
        function(regs, pins) { //
    }),
    0x186: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x86], // CB 86
        function(regs, pins) { //
    }),
    0x187: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x87], // CB 87
        function(regs, pins) { //
    }),
    0x188: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x88], // CB 88
        function(regs, pins) { //
    }),
    0x189: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x89], // CB 89
        function(regs, pins) { //
    }),
    0x18A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x8A], // CB 8A
        function(regs, pins) { //
    }),
    0x18B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x8B], // CB 8B
        function(regs, pins) { //
    }),
    0x18C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x8C], // CB 8C
        function(regs, pins) { //
    }),
    0x18D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x8D], // CB 8D
        function(regs, pins) { //
    }),
    0x18E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x8E], // CB 8E
        function(regs, pins) { //
    }),
    0x18F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x8F], // CB 8F
        function(regs, pins) { //
    }),
    0x190: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x90], // CB 90
        function(regs, pins) { //
    }),
    0x191: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x91], // CB 91
        function(regs, pins) { //
    }),
    0x192: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x92], // CB 92
        function(regs, pins) { //
    }),
    0x193: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x93], // CB 93
        function(regs, pins) { //
    }),
    0x194: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x94], // CB 94
        function(regs, pins) { //
    }),
    0x195: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x95], // CB 95
        function(regs, pins) { //
    }),
    0x196: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x96], // CB 96
        function(regs, pins) { //
    }),
    0x197: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x97], // CB 97
        function(regs, pins) { //
    }),
    0x198: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x98], // CB 98
        function(regs, pins) { //
    }),
    0x199: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x99], // CB 99
        function(regs, pins) { //
    }),
    0x19A: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x9A], // CB 9A
        function(regs, pins) { //
    }),
    0x19B: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x9B], // CB 9B
        function(regs, pins) { //
    }),
    0x19C: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x9C], // CB 9C
        function(regs, pins) { //
    }),
    0x19D: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x9D], // CB 9D
        function(regs, pins) { //
    }),
    0x19E: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x9E], // CB 9E
        function(regs, pins) { //
    }),
    0x19F: new Z80_opcode_functions(Z80_CB_opcode_matrix[0x9F], // CB 9F
        function(regs, pins) { //
    }),
    0x1A0: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA0], // CB A0
        function(regs, pins) { //
    }),
    0x1A1: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA1], // CB A1
        function(regs, pins) { //
    }),
    0x1A2: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA2], // CB A2
        function(regs, pins) { //
    }),
    0x1A3: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA3], // CB A3
        function(regs, pins) { //
    }),
    0x1A4: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA4], // CB A4
        function(regs, pins) { //
    }),
    0x1A5: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA5], // CB A5
        function(regs, pins) { //
    }),
    0x1A6: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA6], // CB A6
        function(regs, pins) { //
    }),
    0x1A7: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA7], // CB A7
        function(regs, pins) { //
    }),
    0x1A8: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA8], // CB A8
        function(regs, pins) { //
    }),
    0x1A9: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xA9], // CB A9
        function(regs, pins) { //
    }),
    0x1AA: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xAA], // CB AA
        function(regs, pins) { //
    }),
    0x1AB: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xAB], // CB AB
        function(regs, pins) { //
    }),
    0x1AC: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xAC], // CB AC
        function(regs, pins) { //
    }),
    0x1AD: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xAD], // CB AD
        function(regs, pins) { //
    }),
    0x1AE: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xAE], // CB AE
        function(regs, pins) { //
    }),
    0x1AF: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xAF], // CB AF
        function(regs, pins) { //
    }),
    0x1B0: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB0], // CB B0
        function(regs, pins) { //
    }),
    0x1B1: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB1], // CB B1
        function(regs, pins) { //
    }),
    0x1B2: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB2], // CB B2
        function(regs, pins) { //
    }),
    0x1B3: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB3], // CB B3
        function(regs, pins) { //
    }),
    0x1B4: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB4], // CB B4
        function(regs, pins) { //
    }),
    0x1B5: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB5], // CB B5
        function(regs, pins) { //
    }),
    0x1B6: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB6], // CB B6
        function(regs, pins) { //
    }),
    0x1B7: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB7], // CB B7
        function(regs, pins) { //
    }),
    0x1B8: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB8], // CB B8
        function(regs, pins) { //
    }),
    0x1B9: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xB9], // CB B9
        function(regs, pins) { //
    }),
    0x1BA: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xBA], // CB BA
        function(regs, pins) { //
    }),
    0x1BB: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xBB], // CB BB
        function(regs, pins) { //
    }),
    0x1BC: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xBC], // CB BC
        function(regs, pins) { //
    }),
    0x1BD: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xBD], // CB BD
        function(regs, pins) { //
    }),
    0x1BE: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xBE], // CB BE
        function(regs, pins) { //
    }),
    0x1BF: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xBF], // CB BF
        function(regs, pins) { //
    }),
    0x1C0: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC0], // CB C0
        function(regs, pins) { //
    }),
    0x1C1: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC1], // CB C1
        function(regs, pins) { //
    }),
    0x1C2: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC2], // CB C2
        function(regs, pins) { //
    }),
    0x1C3: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC3], // CB C3
        function(regs, pins) { //
    }),
    0x1C4: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC4], // CB C4
        function(regs, pins) { //
    }),
    0x1C5: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC5], // CB C5
        function(regs, pins) { //
    }),
    0x1C6: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC6], // CB C6
        function(regs, pins) { //
    }),
    0x1C7: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC7], // CB C7
        function(regs, pins) { //
    }),
    0x1C8: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC8], // CB C8
        function(regs, pins) { //
    }),
    0x1C9: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xC9], // CB C9
        function(regs, pins) { //
    }),
    0x1CA: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xCA], // CB CA
        function(regs, pins) { //
    }),
    0x1CB: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xCB], // CB CB
        function(regs, pins) { //
    }),
    0x1CC: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xCC], // CB CC
        function(regs, pins) { //
    }),
    0x1CD: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xCD], // CB CD
        function(regs, pins) { //
    }),
    0x1CE: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xCE], // CB CE
        function(regs, pins) { //
    }),
    0x1CF: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xCF], // CB CF
        function(regs, pins) { //
    }),
    0x1D0: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD0], // CB D0
        function(regs, pins) { //
    }),
    0x1D1: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD1], // CB D1
        function(regs, pins) { //
    }),
    0x1D2: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD2], // CB D2
        function(regs, pins) { //
    }),
    0x1D3: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD3], // CB D3
        function(regs, pins) { //
    }),
    0x1D4: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD4], // CB D4
        function(regs, pins) { //
    }),
    0x1D5: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD5], // CB D5
        function(regs, pins) { //
    }),
    0x1D6: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD6], // CB D6
        function(regs, pins) { //
    }),
    0x1D7: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD7], // CB D7
        function(regs, pins) { //
    }),
    0x1D8: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD8], // CB D8
        function(regs, pins) { //
    }),
    0x1D9: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xD9], // CB D9
        function(regs, pins) { //
    }),
    0x1DA: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xDA], // CB DA
        function(regs, pins) { //
    }),
    0x1DB: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xDB], // CB DB
        function(regs, pins) { //
    }),
    0x1DC: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xDC], // CB DC
        function(regs, pins) { //
    }),
    0x1DD: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xDD], // CB DD
        function(regs, pins) { //
    }),
    0x1DE: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xDE], // CB DE
        function(regs, pins) { //
    }),
    0x1DF: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xDF], // CB DF
        function(regs, pins) { //
    }),
    0x1E0: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE0], // CB E0
        function(regs, pins) { //
    }),
    0x1E1: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE1], // CB E1
        function(regs, pins) { //
    }),
    0x1E2: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE2], // CB E2
        function(regs, pins) { //
    }),
    0x1E3: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE3], // CB E3
        function(regs, pins) { //
    }),
    0x1E4: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE4], // CB E4
        function(regs, pins) { //
    }),
    0x1E5: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE5], // CB E5
        function(regs, pins) { //
    }),
    0x1E6: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE6], // CB E6
        function(regs, pins) { //
    }),
    0x1E7: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE7], // CB E7
        function(regs, pins) { //
    }),
    0x1E8: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE8], // CB E8
        function(regs, pins) { //
    }),
    0x1E9: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xE9], // CB E9
        function(regs, pins) { //
    }),
    0x1EA: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xEA], // CB EA
        function(regs, pins) { //
    }),
    0x1EB: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xEB], // CB EB
        function(regs, pins) { //
    }),
    0x1EC: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xEC], // CB EC
        function(regs, pins) { //
    }),
    0x1ED: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xED], // CB ED
        function(regs, pins) { //
    }),
    0x1EE: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xEE], // CB EE
        function(regs, pins) { //
    }),
    0x1EF: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xEF], // CB EF
        function(regs, pins) { //
    }),
    0x1F0: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF0], // CB F0
        function(regs, pins) { //
    }),
    0x1F1: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF1], // CB F1
        function(regs, pins) { //
    }),
    0x1F2: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF2], // CB F2
        function(regs, pins) { //
    }),
    0x1F3: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF3], // CB F3
        function(regs, pins) { //
    }),
    0x1F4: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF4], // CB F4
        function(regs, pins) { //
    }),
    0x1F5: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF5], // CB F5
        function(regs, pins) { //
    }),
    0x1F6: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF6], // CB F6
        function(regs, pins) { //
    }),
    0x1F7: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF7], // CB F7
        function(regs, pins) { //
    }),
    0x1F8: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF8], // CB F8
        function(regs, pins) { //
    }),
    0x1F9: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xF9], // CB F9
        function(regs, pins) { //
    }),
    0x1FA: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xFA], // CB FA
        function(regs, pins) { //
    }),
    0x1FB: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xFB], // CB FB
        function(regs, pins) { //
    }),
    0x1FC: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xFC], // CB FC
        function(regs, pins) { //
    }),
    0x1FD: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xFD], // CB FD
        function(regs, pins) { //
    }),
    0x1FE: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xFE], // CB FE
        function(regs, pins) { //
    }),
    0x1FF: new Z80_opcode_functions(Z80_CB_opcode_matrix[0xFF], // CB FF
        function(regs, pins) { //
    }),
    0x200: new Z80_opcode_functions(Z80_opcode_matrix[0x00], // DD 00
        function(regs, pins) { //NOP
    }),
    0x201: new Z80_opcode_functions(Z80_opcode_matrix[0x01], // DD 01
        function(regs, pins) { //
    }),
    0x202: new Z80_opcode_functions(Z80_opcode_matrix[0x02], // DD 02
        function(regs, pins) { //
    }),
    0x203: new Z80_opcode_functions(Z80_opcode_matrix[0x03], // DD 03
        function(regs, pins) { //
    }),
    0x204: new Z80_opcode_functions(Z80_opcode_matrix[0x04], // DD 04
        function(regs, pins) { //
    }),
    0x205: new Z80_opcode_functions(Z80_opcode_matrix[0x05], // DD 05
        function(regs, pins) { //
    }),
    0x206: new Z80_opcode_functions(Z80_opcode_matrix[0x06], // DD 06
        function(regs, pins) { //
    }),
    0x207: new Z80_opcode_functions(Z80_opcode_matrix[0x07], // DD 07
        function(regs, pins) { //
    }),
    0x208: new Z80_opcode_functions(Z80_opcode_matrix[0x08], // DD 08
        function(regs, pins) { //
    }),
    0x209: new Z80_opcode_functions(Z80_opcode_matrix[0x09], // DD 09
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = BC & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (BC & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x20A: new Z80_opcode_functions(Z80_opcode_matrix[0x0A], // DD 0A
        function(regs, pins) { //
    }),
    0x20B: new Z80_opcode_functions(Z80_opcode_matrix[0x0B], // DD 0B
        function(regs, pins) { //
    }),
    0x20C: new Z80_opcode_functions(Z80_opcode_matrix[0x0C], // DD 0C
        function(regs, pins) { //
    }),
    0x20D: new Z80_opcode_functions(Z80_opcode_matrix[0x0D], // DD 0D
        function(regs, pins) { //
    }),
    0x20E: new Z80_opcode_functions(Z80_opcode_matrix[0x0E], // DD 0E
        function(regs, pins) { //
    }),
    0x20F: new Z80_opcode_functions(Z80_opcode_matrix[0x0F], // DD 0F
        function(regs, pins) { //
    }),
    0x210: new Z80_opcode_functions(Z80_opcode_matrix[0x10], // DD 10
        function(regs, pins) { //
    }),
    0x211: new Z80_opcode_functions(Z80_opcode_matrix[0x11], // DD 11
        function(regs, pins) { //
    }),
    0x212: new Z80_opcode_functions(Z80_opcode_matrix[0x12], // DD 12
        function(regs, pins) { //
    }),
    0x213: new Z80_opcode_functions(Z80_opcode_matrix[0x13], // DD 13
        function(regs, pins) { //
    }),
    0x214: new Z80_opcode_functions(Z80_opcode_matrix[0x14], // DD 14
        function(regs, pins) { //
    }),
    0x215: new Z80_opcode_functions(Z80_opcode_matrix[0x15], // DD 15
        function(regs, pins) { //
    }),
    0x216: new Z80_opcode_functions(Z80_opcode_matrix[0x16], // DD 16
        function(regs, pins) { //
    }),
    0x217: new Z80_opcode_functions(Z80_opcode_matrix[0x17], // DD 17
        function(regs, pins) { //
    }),
    0x218: new Z80_opcode_functions(Z80_opcode_matrix[0x18], // DD 18
        function(regs, pins) { //
    }),
    0x219: new Z80_opcode_functions(Z80_opcode_matrix[0x19], // DD 19
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = DE & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (DE & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x21A: new Z80_opcode_functions(Z80_opcode_matrix[0x1A], // DD 1A
        function(regs, pins) { //
    }),
    0x21B: new Z80_opcode_functions(Z80_opcode_matrix[0x1B], // DD 1B
        function(regs, pins) { //
    }),
    0x21C: new Z80_opcode_functions(Z80_opcode_matrix[0x1C], // DD 1C
        function(regs, pins) { //
    }),
    0x21D: new Z80_opcode_functions(Z80_opcode_matrix[0x1D], // DD 1D
        function(regs, pins) { //
    }),
    0x21E: new Z80_opcode_functions(Z80_opcode_matrix[0x1E], // DD 1E
        function(regs, pins) { //
    }),
    0x21F: new Z80_opcode_functions(Z80_opcode_matrix[0x1F], // DD 1F
        function(regs, pins) { //RRA
    }),
    0x220: new Z80_opcode_functions(Z80_opcode_matrix[0x20], // DD 20
        function(regs, pins) { //
    }),
    0x221: new Z80_opcode_functions(Z80_opcode_matrix[0x21], // DD 21
        function(regs, pins) { //
    }),
    0x222: new Z80_opcode_functions(Z80_opcode_matrix[0x22], // DD 22
        function(regs, pins) { //
    }),
    0x223: new Z80_opcode_functions(Z80_opcode_matrix[0x23], // DD 23
        function(regs, pins) { //
    }),
    0x224: new Z80_opcode_functions(Z80_opcode_matrix[0x24], // DD 24
        function(regs, pins) { //
    }),
    0x225: new Z80_opcode_functions(Z80_opcode_matrix[0x25], // DD 25
        function(regs, pins) { //
    }),
    0x226: new Z80_opcode_functions(Z80_opcode_matrix[0x26], // DD 26
        function(regs, pins) { //
    }),
    0x227: new Z80_opcode_functions(Z80_opcode_matrix[0x27], // DD 27
        function(regs, pins) { //DAA
    }),
    0x228: new Z80_opcode_functions(Z80_opcode_matrix[0x28], // DD 28
        function(regs, pins) { //
    }),
    0x229: new Z80_opcode_functions(Z80_opcode_matrix[0x29], // DD 29
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = IX & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (IX & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x22A: new Z80_opcode_functions(Z80_opcode_matrix[0x2A], // DD 2A
        function(regs, pins) { //
    }),
    0x22B: new Z80_opcode_functions(Z80_opcode_matrix[0x2B], // DD 2B
        function(regs, pins) { //
    }),
    0x22C: new Z80_opcode_functions(Z80_opcode_matrix[0x2C], // DD 2C
        function(regs, pins) { //
    }),
    0x22D: new Z80_opcode_functions(Z80_opcode_matrix[0x2D], // DD 2D
        function(regs, pins) { //
    }),
    0x22E: new Z80_opcode_functions(Z80_opcode_matrix[0x2E], // DD 2E
        function(regs, pins) { //
    }),
    0x22F: new Z80_opcode_functions(Z80_opcode_matrix[0x2F], // DD 2F
        function(regs, pins) { //CPL
    }),
    0x230: new Z80_opcode_functions(Z80_opcode_matrix[0x30], // DD 30
        function(regs, pins) { //regs.F.C === 0
    }),
    0x231: new Z80_opcode_functions(Z80_opcode_matrix[0x31], // DD 31
        function(regs, pins) { //
    }),
    0x232: new Z80_opcode_functions(Z80_opcode_matrix[0x32], // DD 32
        function(regs, pins) { //
    }),
    0x233: new Z80_opcode_functions(Z80_opcode_matrix[0x33], // DD 33
        function(regs, pins) { //
    }),
    0x234: new Z80_opcode_functions(Z80_opcode_matrix[0x34], // DD 34
        function(regs, pins) { //
    }),
    0x235: new Z80_opcode_functions(Z80_opcode_matrix[0x35], // DD 35
        function(regs, pins) { //
    }),
    0x236: new Z80_opcode_functions(Z80_opcode_matrix[0x36], // DD 36
        function(regs, pins) { //
    }),
    0x237: new Z80_opcode_functions(Z80_opcode_matrix[0x37], // DD 37
        function(regs, pins) { //SCF
    }),
    0x238: new Z80_opcode_functions(Z80_opcode_matrix[0x38], // DD 38
        function(regs, pins) { //
    }),
    0x239: new Z80_opcode_functions(Z80_opcode_matrix[0x39], // DD 39
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = SP & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (SP & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x23A: new Z80_opcode_functions(Z80_opcode_matrix[0x3A], // DD 3A
        function(regs, pins) { //
    }),
    0x23B: new Z80_opcode_functions(Z80_opcode_matrix[0x3B], // DD 3B
        function(regs, pins) { //
    }),
    0x23C: new Z80_opcode_functions(Z80_opcode_matrix[0x3C], // DD 3C
        function(regs, pins) { //
    }),
    0x23D: new Z80_opcode_functions(Z80_opcode_matrix[0x3D], // DD 3D
        function(regs, pins) { //
    }),
    0x23E: new Z80_opcode_functions(Z80_opcode_matrix[0x3E], // DD 3E
        function(regs, pins) { //
    }),
    0x23F: new Z80_opcode_functions(Z80_opcode_matrix[0x3F], // DD 3F
        function(regs, pins) { //CCF
    }),
    0x240: new Z80_opcode_functions(Z80_opcode_matrix[0x40], // DD 40
        function(regs, pins) { //
    }),
    0x241: new Z80_opcode_functions(Z80_opcode_matrix[0x41], // DD 41
        function(regs, pins) { //
    }),
    0x242: new Z80_opcode_functions(Z80_opcode_matrix[0x42], // DD 42
        function(regs, pins) { //
    }),
    0x243: new Z80_opcode_functions(Z80_opcode_matrix[0x43], // DD 43
        function(regs, pins) { //
    }),
    0x244: new Z80_opcode_functions(Z80_opcode_matrix[0x44], // DD 44
        function(regs, pins) { //
    }),
    0x245: new Z80_opcode_functions(Z80_opcode_matrix[0x45], // DD 45
        function(regs, pins) { //
    }),
    0x246: new Z80_opcode_functions(Z80_opcode_matrix[0x46], // DD 46
        function(regs, pins) { //
    }),
    0x247: new Z80_opcode_functions(Z80_opcode_matrix[0x47], // DD 47
        function(regs, pins) { //
    }),
    0x248: new Z80_opcode_functions(Z80_opcode_matrix[0x48], // DD 48
        function(regs, pins) { //
    }),
    0x249: new Z80_opcode_functions(Z80_opcode_matrix[0x49], // DD 49
        function(regs, pins) { //
    }),
    0x24A: new Z80_opcode_functions(Z80_opcode_matrix[0x4A], // DD 4A
        function(regs, pins) { //
    }),
    0x24B: new Z80_opcode_functions(Z80_opcode_matrix[0x4B], // DD 4B
        function(regs, pins) { //
    }),
    0x24C: new Z80_opcode_functions(Z80_opcode_matrix[0x4C], // DD 4C
        function(regs, pins) { //
    }),
    0x24D: new Z80_opcode_functions(Z80_opcode_matrix[0x4D], // DD 4D
        function(regs, pins) { //
    }),
    0x24E: new Z80_opcode_functions(Z80_opcode_matrix[0x4E], // DD 4E
        function(regs, pins) { //
    }),
    0x24F: new Z80_opcode_functions(Z80_opcode_matrix[0x4F], // DD 4F
        function(regs, pins) { //
    }),
    0x250: new Z80_opcode_functions(Z80_opcode_matrix[0x50], // DD 50
        function(regs, pins) { //
    }),
    0x251: new Z80_opcode_functions(Z80_opcode_matrix[0x51], // DD 51
        function(regs, pins) { //
    }),
    0x252: new Z80_opcode_functions(Z80_opcode_matrix[0x52], // DD 52
        function(regs, pins) { //
    }),
    0x253: new Z80_opcode_functions(Z80_opcode_matrix[0x53], // DD 53
        function(regs, pins) { //
    }),
    0x254: new Z80_opcode_functions(Z80_opcode_matrix[0x54], // DD 54
        function(regs, pins) { //
    }),
    0x255: new Z80_opcode_functions(Z80_opcode_matrix[0x55], // DD 55
        function(regs, pins) { //
    }),
    0x256: new Z80_opcode_functions(Z80_opcode_matrix[0x56], // DD 56
        function(regs, pins) { //
    }),
    0x257: new Z80_opcode_functions(Z80_opcode_matrix[0x57], // DD 57
        function(regs, pins) { //
    }),
    0x258: new Z80_opcode_functions(Z80_opcode_matrix[0x58], // DD 58
        function(regs, pins) { //
    }),
    0x259: new Z80_opcode_functions(Z80_opcode_matrix[0x59], // DD 59
        function(regs, pins) { //
    }),
    0x25A: new Z80_opcode_functions(Z80_opcode_matrix[0x5A], // DD 5A
        function(regs, pins) { //
    }),
    0x25B: new Z80_opcode_functions(Z80_opcode_matrix[0x5B], // DD 5B
        function(regs, pins) { //
    }),
    0x25C: new Z80_opcode_functions(Z80_opcode_matrix[0x5C], // DD 5C
        function(regs, pins) { //
    }),
    0x25D: new Z80_opcode_functions(Z80_opcode_matrix[0x5D], // DD 5D
        function(regs, pins) { //
    }),
    0x25E: new Z80_opcode_functions(Z80_opcode_matrix[0x5E], // DD 5E
        function(regs, pins) { //
    }),
    0x25F: new Z80_opcode_functions(Z80_opcode_matrix[0x5F], // DD 5F
        function(regs, pins) { //
    }),
    0x260: new Z80_opcode_functions(Z80_opcode_matrix[0x60], // DD 60
        function(regs, pins) { //
    }),
    0x261: new Z80_opcode_functions(Z80_opcode_matrix[0x61], // DD 61
        function(regs, pins) { //
    }),
    0x262: new Z80_opcode_functions(Z80_opcode_matrix[0x62], // DD 62
        function(regs, pins) { //
    }),
    0x263: new Z80_opcode_functions(Z80_opcode_matrix[0x63], // DD 63
        function(regs, pins) { //
    }),
    0x264: new Z80_opcode_functions(Z80_opcode_matrix[0x64], // DD 64
        function(regs, pins) { //
    }),
    0x265: new Z80_opcode_functions(Z80_opcode_matrix[0x65], // DD 65
        function(regs, pins) { //
    }),
    0x266: new Z80_opcode_functions(Z80_opcode_matrix[0x66], // DD 66
        function(regs, pins) { //
    }),
    0x267: new Z80_opcode_functions(Z80_opcode_matrix[0x67], // DD 67
        function(regs, pins) { //
    }),
    0x268: new Z80_opcode_functions(Z80_opcode_matrix[0x68], // DD 68
        function(regs, pins) { //
    }),
    0x269: new Z80_opcode_functions(Z80_opcode_matrix[0x69], // DD 69
        function(regs, pins) { //
    }),
    0x26A: new Z80_opcode_functions(Z80_opcode_matrix[0x6A], // DD 6A
        function(regs, pins) { //
    }),
    0x26B: new Z80_opcode_functions(Z80_opcode_matrix[0x6B], // DD 6B
        function(regs, pins) { //
    }),
    0x26C: new Z80_opcode_functions(Z80_opcode_matrix[0x6C], // DD 6C
        function(regs, pins) { //
    }),
    0x26D: new Z80_opcode_functions(Z80_opcode_matrix[0x6D], // DD 6D
        function(regs, pins) { //
    }),
    0x26E: new Z80_opcode_functions(Z80_opcode_matrix[0x6E], // DD 6E
        function(regs, pins) { //
    }),
    0x26F: new Z80_opcode_functions(Z80_opcode_matrix[0x6F], // DD 6F
        function(regs, pins) { //
    }),
    0x270: new Z80_opcode_functions(Z80_opcode_matrix[0x70], // DD 70
        function(regs, pins) { //
    }),
    0x271: new Z80_opcode_functions(Z80_opcode_matrix[0x71], // DD 71
        function(regs, pins) { //
    }),
    0x272: new Z80_opcode_functions(Z80_opcode_matrix[0x72], // DD 72
        function(regs, pins) { //
    }),
    0x273: new Z80_opcode_functions(Z80_opcode_matrix[0x73], // DD 73
        function(regs, pins) { //
    }),
    0x274: new Z80_opcode_functions(Z80_opcode_matrix[0x74], // DD 74
        function(regs, pins) { //
    }),
    0x275: new Z80_opcode_functions(Z80_opcode_matrix[0x75], // DD 75
        function(regs, pins) { //
    }),
    0x276: new Z80_opcode_functions(Z80_opcode_matrix[0x76], // DD 76
        function(regs, pins) { //HALT
    }),
    0x277: new Z80_opcode_functions(Z80_opcode_matrix[0x77], // DD 77
        function(regs, pins) { //
    }),
    0x278: new Z80_opcode_functions(Z80_opcode_matrix[0x78], // DD 78
        function(regs, pins) { //
    }),
    0x279: new Z80_opcode_functions(Z80_opcode_matrix[0x79], // DD 79
        function(regs, pins) { //
    }),
    0x27A: new Z80_opcode_functions(Z80_opcode_matrix[0x7A], // DD 7A
        function(regs, pins) { //
    }),
    0x27B: new Z80_opcode_functions(Z80_opcode_matrix[0x7B], // DD 7B
        function(regs, pins) { //
    }),
    0x27C: new Z80_opcode_functions(Z80_opcode_matrix[0x7C], // DD 7C
        function(regs, pins) { //
    }),
    0x27D: new Z80_opcode_functions(Z80_opcode_matrix[0x7D], // DD 7D
        function(regs, pins) { //
    }),
    0x27E: new Z80_opcode_functions(Z80_opcode_matrix[0x7E], // DD 7E
        function(regs, pins) { //
    }),
    0x27F: new Z80_opcode_functions(Z80_opcode_matrix[0x7F], // DD 7F
        function(regs, pins) { //
    }),
    0x280: new Z80_opcode_functions(Z80_opcode_matrix[0x80], // DD 80
        function(regs, pins) { //
    }),
    0x281: new Z80_opcode_functions(Z80_opcode_matrix[0x81], // DD 81
        function(regs, pins) { //
    }),
    0x282: new Z80_opcode_functions(Z80_opcode_matrix[0x82], // DD 82
        function(regs, pins) { //
    }),
    0x283: new Z80_opcode_functions(Z80_opcode_matrix[0x83], // DD 83
        function(regs, pins) { //
    }),
    0x284: new Z80_opcode_functions(Z80_opcode_matrix[0x84], // DD 84
        function(regs, pins) { //
    }),
    0x285: new Z80_opcode_functions(Z80_opcode_matrix[0x85], // DD 85
        function(regs, pins) { //
    }),
    0x286: new Z80_opcode_functions(Z80_opcode_matrix[0x86], // DD 86
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                pins.IO = undefined;
                break;
            case 4: // Adding 5 cycles
                break;
            case 5:
                break;
            case 6:
                break;
            case 7:
                break;
            case 8:
                regs.WZ = (regs.IX + mksigned8(regs.TR)) & 0xFFFF;
                regs.TA = regs.WZ;
                break;
            case 9: // Start read
                pins.Addr = regs.TA;
                
                break;
            case 10:
                pins.RD = 1;
                break;
            case 11: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TA = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 12: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x287: new Z80_opcode_functions(Z80_opcode_matrix[0x87], // DD 87
        function(regs, pins) { //
    }),
    0x288: new Z80_opcode_functions(Z80_opcode_matrix[0x88], // DD 88
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = B;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x289: new Z80_opcode_functions(Z80_opcode_matrix[0x89], // DD 89
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = C;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x28A: new Z80_opcode_functions(Z80_opcode_matrix[0x8A], // DD 8A
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = D;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x28B: new Z80_opcode_functions(Z80_opcode_matrix[0x8B], // DD 8B
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = E;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x28C: new Z80_opcode_functions(Z80_opcode_matrix[0x8C], // DD 8C
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = H;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x28D: new Z80_opcode_functions(Z80_opcode_matrix[0x8D], // DD 8D
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = L;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x28E: new Z80_opcode_functions(Z80_opcode_matrix[0x8E], // DD 8E
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                pins.IO = undefined;
                break;
            case 4: // Adding 5 cycles
                break;
            case 5:
                break;
            case 6:
                break;
            case 7:
                break;
            case 8:
                regs.WZ = (regs.IX + mksigned8(regs.TR)) & 0xFFFF;
                regs.TA = regs.WZ;
                break;
            case 9: // Start read
                pins.Addr = regs.TA;
                
                break;
            case 10:
                pins.RD = 1;
                break;
            case 11: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 12: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x28F: new Z80_opcode_functions(Z80_opcode_matrix[0x8F], // DD 8F
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = A;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x290: new Z80_opcode_functions(Z80_opcode_matrix[0x90], // DD 90
        function(regs, pins) { //
    }),
    0x291: new Z80_opcode_functions(Z80_opcode_matrix[0x91], // DD 91
        function(regs, pins) { //
    }),
    0x292: new Z80_opcode_functions(Z80_opcode_matrix[0x92], // DD 92
        function(regs, pins) { //
    }),
    0x293: new Z80_opcode_functions(Z80_opcode_matrix[0x93], // DD 93
        function(regs, pins) { //
    }),
    0x294: new Z80_opcode_functions(Z80_opcode_matrix[0x94], // DD 94
        function(regs, pins) { //
    }),
    0x295: new Z80_opcode_functions(Z80_opcode_matrix[0x95], // DD 95
        function(regs, pins) { //
    }),
    0x296: new Z80_opcode_functions(Z80_opcode_matrix[0x96], // DD 96
        function(regs, pins) { //
    }),
    0x297: new Z80_opcode_functions(Z80_opcode_matrix[0x97], // DD 97
        function(regs, pins) { //
    }),
    0x298: new Z80_opcode_functions(Z80_opcode_matrix[0x98], // DD 98
        function(regs, pins) { //
    }),
    0x299: new Z80_opcode_functions(Z80_opcode_matrix[0x99], // DD 99
        function(regs, pins) { //
    }),
    0x29A: new Z80_opcode_functions(Z80_opcode_matrix[0x9A], // DD 9A
        function(regs, pins) { //
    }),
    0x29B: new Z80_opcode_functions(Z80_opcode_matrix[0x9B], // DD 9B
        function(regs, pins) { //
    }),
    0x29C: new Z80_opcode_functions(Z80_opcode_matrix[0x9C], // DD 9C
        function(regs, pins) { //
    }),
    0x29D: new Z80_opcode_functions(Z80_opcode_matrix[0x9D], // DD 9D
        function(regs, pins) { //
    }),
    0x29E: new Z80_opcode_functions(Z80_opcode_matrix[0x9E], // DD 9E
        function(regs, pins) { //
    }),
    0x29F: new Z80_opcode_functions(Z80_opcode_matrix[0x9F], // DD 9F
        function(regs, pins) { //
    }),
    0x2A0: new Z80_opcode_functions(Z80_opcode_matrix[0xA0], // DD A0
        function(regs, pins) { //
    }),
    0x2A1: new Z80_opcode_functions(Z80_opcode_matrix[0xA1], // DD A1
        function(regs, pins) { //
    }),
    0x2A2: new Z80_opcode_functions(Z80_opcode_matrix[0xA2], // DD A2
        function(regs, pins) { //
    }),
    0x2A3: new Z80_opcode_functions(Z80_opcode_matrix[0xA3], // DD A3
        function(regs, pins) { //
    }),
    0x2A4: new Z80_opcode_functions(Z80_opcode_matrix[0xA4], // DD A4
        function(regs, pins) { //
    }),
    0x2A5: new Z80_opcode_functions(Z80_opcode_matrix[0xA5], // DD A5
        function(regs, pins) { //
    }),
    0x2A6: new Z80_opcode_functions(Z80_opcode_matrix[0xA6], // DD A6
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                pins.IO = undefined;
                break;
            case 4: // Adding 5 cycles
                break;
            case 5:
                break;
            case 6:
                break;
            case 7:
                break;
            case 8:
                regs.WZ = (regs.IX + mksigned8(regs.TR)) & 0xFFFF;
                regs.TA = regs.WZ;
                break;
            case 9: // Start read
                pins.Addr = regs.TA;
                
                break;
            case 10:
                pins.RD = 1;
                break;
            case 11: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = (regs.A) & (regs.TR);
                regs.F.C = regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z;
                // Following is auto-generated code for instruction finish
                break;
            case 12: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x2A7: new Z80_opcode_functions(Z80_opcode_matrix[0xA7], // DD A7
        function(regs, pins) { //
    }),
    0x2A8: new Z80_opcode_functions(Z80_opcode_matrix[0xA8], // DD A8
        function(regs, pins) { //
    }),
    0x2A9: new Z80_opcode_functions(Z80_opcode_matrix[0xA9], // DD A9
        function(regs, pins) { //
    }),
    0x2AA: new Z80_opcode_functions(Z80_opcode_matrix[0xAA], // DD AA
        function(regs, pins) { //
    }),
    0x2AB: new Z80_opcode_functions(Z80_opcode_matrix[0xAB], // DD AB
        function(regs, pins) { //
    }),
    0x2AC: new Z80_opcode_functions(Z80_opcode_matrix[0xAC], // DD AC
        function(regs, pins) { //
    }),
    0x2AD: new Z80_opcode_functions(Z80_opcode_matrix[0xAD], // DD AD
        function(regs, pins) { //
    }),
    0x2AE: new Z80_opcode_functions(Z80_opcode_matrix[0xAE], // DD AE
        function(regs, pins) { //
    }),
    0x2AF: new Z80_opcode_functions(Z80_opcode_matrix[0xAF], // DD AF
        function(regs, pins) { //
    }),
    0x2B0: new Z80_opcode_functions(Z80_opcode_matrix[0xB0], // DD B0
        function(regs, pins) { //
    }),
    0x2B1: new Z80_opcode_functions(Z80_opcode_matrix[0xB1], // DD B1
        function(regs, pins) { //
    }),
    0x2B2: new Z80_opcode_functions(Z80_opcode_matrix[0xB2], // DD B2
        function(regs, pins) { //
    }),
    0x2B3: new Z80_opcode_functions(Z80_opcode_matrix[0xB3], // DD B3
        function(regs, pins) { //
    }),
    0x2B4: new Z80_opcode_functions(Z80_opcode_matrix[0xB4], // DD B4
        function(regs, pins) { //
    }),
    0x2B5: new Z80_opcode_functions(Z80_opcode_matrix[0xB5], // DD B5
        function(regs, pins) { //
    }),
    0x2B6: new Z80_opcode_functions(Z80_opcode_matrix[0xB6], // DD B6
        function(regs, pins) { //
    }),
    0x2B7: new Z80_opcode_functions(Z80_opcode_matrix[0xB7], // DD B7
        function(regs, pins) { //
    }),
    0x2B8: new Z80_opcode_functions(Z80_opcode_matrix[0xB8], // DD B8
        function(regs, pins) { //
    }),
    0x2B9: new Z80_opcode_functions(Z80_opcode_matrix[0xB9], // DD B9
        function(regs, pins) { //
    }),
    0x2BA: new Z80_opcode_functions(Z80_opcode_matrix[0xBA], // DD BA
        function(regs, pins) { //
    }),
    0x2BB: new Z80_opcode_functions(Z80_opcode_matrix[0xBB], // DD BB
        function(regs, pins) { //
    }),
    0x2BC: new Z80_opcode_functions(Z80_opcode_matrix[0xBC], // DD BC
        function(regs, pins) { //
    }),
    0x2BD: new Z80_opcode_functions(Z80_opcode_matrix[0xBD], // DD BD
        function(regs, pins) { //
    }),
    0x2BE: new Z80_opcode_functions(Z80_opcode_matrix[0xBE], // DD BE
        function(regs, pins) { //
    }),
    0x2BF: new Z80_opcode_functions(Z80_opcode_matrix[0xBF], // DD BF
        function(regs, pins) { //
    }),
    0x2C0: new Z80_opcode_functions(Z80_opcode_matrix[0xC0], // DD C0
        function(regs, pins) { //
    }),
    0x2C1: new Z80_opcode_functions(Z80_opcode_matrix[0xC1], // DD C1
        function(regs, pins) { //
    }),
    0x2C2: new Z80_opcode_functions(Z80_opcode_matrix[0xC2], // DD C2
        function(regs, pins) { //
    }),
    0x2C3: new Z80_opcode_functions(Z80_opcode_matrix[0xC3], // DD C3
        function(regs, pins) { //
    }),
    0x2C4: new Z80_opcode_functions(Z80_opcode_matrix[0xC4], // DD C4
        function(regs, pins) { //
    }),
    0x2C5: new Z80_opcode_functions(Z80_opcode_matrix[0xC5], // DD C5
        function(regs, pins) { //
    }),
    0x2C6: new Z80_opcode_functions(Z80_opcode_matrix[0xC6], // DD C6
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x2C7: new Z80_opcode_functions(Z80_opcode_matrix[0xC7], // DD C7
        function(regs, pins) { //
    }),
    0x2C8: new Z80_opcode_functions(Z80_opcode_matrix[0xC8], // DD C8
        function(regs, pins) { //
    }),
    0x2C9: new Z80_opcode_functions(Z80_opcode_matrix[0xC9], // DD C9
        function(regs, pins) { //undefined
    }),
    0x2CA: new Z80_opcode_functions(Z80_opcode_matrix[0xCA], // DD CA
        function(regs, pins) { //
    }),
    0x2CB: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x2CC: new Z80_opcode_functions(Z80_opcode_matrix[0xCC], // DD CC
        function(regs, pins) { //
    }),
    0x2CD: new Z80_opcode_functions(Z80_opcode_matrix[0xCD], // DD CD
        function(regs, pins) { //
    }),
    0x2CE: new Z80_opcode_functions(Z80_opcode_matrix[0xCE], // DD CE
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x2CF: new Z80_opcode_functions(Z80_opcode_matrix[0xCF], // DD CF
        function(regs, pins) { //
    }),
    0x2D0: new Z80_opcode_functions(Z80_opcode_matrix[0xD0], // DD D0
        function(regs, pins) { //
    }),
    0x2D1: new Z80_opcode_functions(Z80_opcode_matrix[0xD1], // DD D1
        function(regs, pins) { //
    }),
    0x2D2: new Z80_opcode_functions(Z80_opcode_matrix[0xD2], // DD D2
        function(regs, pins) { //
    }),
    0x2D3: new Z80_opcode_functions(Z80_opcode_matrix[0xD3], // DD D3
        function(regs, pins) { //
    }),
    0x2D4: new Z80_opcode_functions(Z80_opcode_matrix[0xD4], // DD D4
        function(regs, pins) { //
    }),
    0x2D5: new Z80_opcode_functions(Z80_opcode_matrix[0xD5], // DD D5
        function(regs, pins) { //
    }),
    0x2D6: new Z80_opcode_functions(Z80_opcode_matrix[0xD6], // DD D6
        function(regs, pins) { //
    }),
    0x2D7: new Z80_opcode_functions(Z80_opcode_matrix[0xD7], // DD D7
        function(regs, pins) { //
    }),
    0x2D8: new Z80_opcode_functions(Z80_opcode_matrix[0xD8], // DD D8
        function(regs, pins) { //
    }),
    0x2D9: new Z80_opcode_functions(Z80_opcode_matrix[0xD9], // DD D9
        function(regs, pins) { //undefined
    }),
    0x2DA: new Z80_opcode_functions(Z80_opcode_matrix[0xDA], // DD DA
        function(regs, pins) { //
    }),
    0x2DB: new Z80_opcode_functions(Z80_opcode_matrix[0xDB], // DD DB
        function(regs, pins) { //
    }),
    0x2DC: new Z80_opcode_functions(Z80_opcode_matrix[0xDC], // DD DC
        function(regs, pins) { //
    }),
    0x2DD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x2DE: new Z80_opcode_functions(Z80_opcode_matrix[0xDE], // DD DE
        function(regs, pins) { //
    }),
    0x2DF: new Z80_opcode_functions(Z80_opcode_matrix[0xDF], // DD DF
        function(regs, pins) { //
    }),
    0x2E0: new Z80_opcode_functions(Z80_opcode_matrix[0xE0], // DD E0
        function(regs, pins) { //
    }),
    0x2E1: new Z80_opcode_functions(Z80_opcode_matrix[0xE1], // DD E1
        function(regs, pins) { //
    }),
    0x2E2: new Z80_opcode_functions(Z80_opcode_matrix[0xE2], // DD E2
        function(regs, pins) { //
    }),
    0x2E3: new Z80_opcode_functions(Z80_opcode_matrix[0xE3], // DD E3
        function(regs, pins) { //
    }),
    0x2E4: new Z80_opcode_functions(Z80_opcode_matrix[0xE4], // DD E4
        function(regs, pins) { //
    }),
    0x2E5: new Z80_opcode_functions(Z80_opcode_matrix[0xE5], // DD E5
        function(regs, pins) { //
    }),
    0x2E6: new Z80_opcode_functions(Z80_opcode_matrix[0xE6], // DD E6
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                let z = (regs.A) & (regs.TR);
                regs.F.C = regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x2E7: new Z80_opcode_functions(Z80_opcode_matrix[0xE7], // DD E7
        function(regs, pins) { //
    }),
    0x2E8: new Z80_opcode_functions(Z80_opcode_matrix[0xE8], // DD E8
        function(regs, pins) { //
    }),
    0x2E9: new Z80_opcode_functions(Z80_opcode_matrix[0xE9], // DD E9
        function(regs, pins) { //
    }),
    0x2EA: new Z80_opcode_functions(Z80_opcode_matrix[0xEA], // DD EA
        function(regs, pins) { //
    }),
    0x2EB: new Z80_opcode_functions(Z80_opcode_matrix[0xEB], // DD EB
        function(regs, pins) { //
    }),
    0x2EC: new Z80_opcode_functions(Z80_opcode_matrix[0xEC], // DD EC
        function(regs, pins) { //
    }),
    0x2ED: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x2EE: new Z80_opcode_functions(Z80_opcode_matrix[0xEE], // DD EE
        function(regs, pins) { //undefined
    }),
    0x2EF: new Z80_opcode_functions(Z80_opcode_matrix[0xEF], // DD EF
        function(regs, pins) { //5
    }),
    0x2F0: new Z80_opcode_functions(Z80_opcode_matrix[0xF0], // DD F0
        function(regs, pins) { //
    }),
    0x2F1: new Z80_opcode_functions(Z80_opcode_matrix[0xF1], // DD F1
        function(regs, pins) { //
    }),
    0x2F2: new Z80_opcode_functions(Z80_opcode_matrix[0xF2], // DD F2
        function(regs, pins) { //
    }),
    0x2F3: new Z80_opcode_functions(Z80_opcode_matrix[0xF3], // DD F3
        function(regs, pins) { //DI
    }),
    0x2F4: new Z80_opcode_functions(Z80_opcode_matrix[0xF4], // DD F4
        function(regs, pins) { //
    }),
    0x2F5: new Z80_opcode_functions(Z80_opcode_matrix[0xF5], // DD F5
        function(regs, pins) { //
    }),
    0x2F6: new Z80_opcode_functions(Z80_opcode_matrix[0xF6], // DD F6
        function(regs, pins) { //
    }),
    0x2F7: new Z80_opcode_functions(Z80_opcode_matrix[0xF7], // DD F7
        function(regs, pins) { //
    }),
    0x2F8: new Z80_opcode_functions(Z80_opcode_matrix[0xF8], // DD F8
        function(regs, pins) { //
    }),
    0x2F9: new Z80_opcode_functions(Z80_opcode_matrix[0xF9], // DD F9
        function(regs, pins) { //
    }),
    0x2FA: new Z80_opcode_functions(Z80_opcode_matrix[0xFA], // DD FA
        function(regs, pins) { //regs.F.S === 1
    }),
    0x2FB: new Z80_opcode_functions(Z80_opcode_matrix[0xFB], // DD FB
        function(regs, pins) { //EI
    }),
    0x2FC: new Z80_opcode_functions(Z80_opcode_matrix[0xFC], // DD FC
        function(regs, pins) { //
    }),
    0x2FD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x2FE: new Z80_opcode_functions(Z80_opcode_matrix[0xFE], // DD FE
        function(regs, pins) { //
    }),
    0x2FF: new Z80_opcode_functions(Z80_opcode_matrix[0xFF], // DD FF
        function(regs, pins) { //
    }),
    0x300: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x301: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x302: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x303: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x304: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x305: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x306: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x307: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x308: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x309: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x30A: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x30B: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x30C: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x30D: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x30E: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x30F: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x310: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x311: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x312: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x313: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x314: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x315: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x316: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x317: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x318: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x319: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x31A: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x31B: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x31C: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x31D: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x31E: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x31F: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x320: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x321: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x322: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x323: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x324: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x325: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x326: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x327: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x328: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x329: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x32A: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x32B: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x32C: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x32D: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x32E: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x32F: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x330: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x331: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x332: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x333: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x334: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x335: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x336: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x337: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x338: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x339: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x33A: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x33B: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x33C: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x33D: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x33E: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x33F: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x340: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x40], // ED 40
        function(regs, pins) { //
    }),
    0x341: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x41], // ED 41
        function(regs, pins) { //
    }),
    0x342: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x42], // ED 42
        function(regs, pins) { //
    }),
    0x343: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x43], // ED 43
        function(regs, pins) { //
    }),
    0x344: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x44], // ED 44
        function(regs, pins) { //NEG
    }),
    0x345: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x45], // ED 45
        function(regs, pins) { //RETN
    }),
    0x346: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x46], // ED 46
        function(regs, pins) { //
    }),
    0x347: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x47], // ED 47
        function(regs, pins) { //
    }),
    0x348: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x48], // ED 48
        function(regs, pins) { //
    }),
    0x349: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x49], // ED 49
        function(regs, pins) { //
    }),
    0x34A: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x4A], // ED 4A
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                x = regs.L;
                y = BC & 0xFF;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.H;
                y = (BC & 0xFF) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                regs.F.Z = +((regs.H === 0) && (regs.L === 0));
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x34B: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x4B], // ED 4B
        function(regs, pins) { //
    }),
    0x34C: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x4C], // ED 4C
        function(regs, pins) { //NEG
    }),
    0x34D: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x4D], // ED 4D
        function(regs, pins) { //RETI
    }),
    0x34E: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x4E], // ED 4E
        function(regs, pins) { //
    }),
    0x34F: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x4F], // ED 4F
        function(regs, pins) { //
    }),
    0x350: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x50], // ED 50
        function(regs, pins) { //
    }),
    0x351: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x51], // ED 51
        function(regs, pins) { //
    }),
    0x352: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x52], // ED 52
        function(regs, pins) { //
    }),
    0x353: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x53], // ED 53
        function(regs, pins) { //
    }),
    0x354: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x54], // ED 54
        function(regs, pins) { //NEG
    }),
    0x355: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x55], // ED 55
        function(regs, pins) { //RETN
    }),
    0x356: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x56], // ED 56
        function(regs, pins) { //
    }),
    0x357: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x57], // ED 57
        function(regs, pins) { //
    }),
    0x358: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x58], // ED 58
        function(regs, pins) { //
    }),
    0x359: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x59], // ED 59
        function(regs, pins) { //
    }),
    0x35A: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x5A], // ED 5A
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                x = regs.L;
                y = DE & 0xFF;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.H;
                y = (DE & 0xFF) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                regs.F.Z = +((regs.H === 0) && (regs.L === 0));
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x35B: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x5B], // ED 5B
        function(regs, pins) { //
    }),
    0x35C: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x5C], // ED 5C
        function(regs, pins) { //NEG
    }),
    0x35D: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x5D], // ED 5D
        function(regs, pins) { //RETI
    }),
    0x35E: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x5E], // ED 5E
        function(regs, pins) { //
    }),
    0x35F: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x5F], // ED 5F
        function(regs, pins) { //
    }),
    0x360: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x60], // ED 60
        function(regs, pins) { //
    }),
    0x361: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x61], // ED 61
        function(regs, pins) { //
    }),
    0x362: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x62], // ED 62
        function(regs, pins) { //
    }),
    0x363: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x63], // ED 63
        function(regs, pins) { //
    }),
    0x364: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x64], // ED 64
        function(regs, pins) { //NEG
    }),
    0x365: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x65], // ED 65
        function(regs, pins) { //RETN
    }),
    0x366: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x66], // ED 66
        function(regs, pins) { //
    }),
    0x367: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x67], // ED 67
        function(regs, pins) { //RRD
    }),
    0x368: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x68], // ED 68
        function(regs, pins) { //
    }),
    0x369: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x69], // ED 69
        function(regs, pins) { //
    }),
    0x36A: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x6A], // ED 6A
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                x = regs.L;
                y = HL & 0xFF;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.H;
                y = (HL & 0xFF) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                regs.F.Z = +((regs.H === 0) && (regs.L === 0));
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x36B: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x6B], // ED 6B
        function(regs, pins) { //
    }),
    0x36C: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x6C], // ED 6C
        function(regs, pins) { //NEG
    }),
    0x36D: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x6D], // ED 6D
        function(regs, pins) { //RETI
    }),
    0x36E: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x6E], // ED 6E
        function(regs, pins) { //
    }),
    0x36F: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x6F], // ED 6F
        function(regs, pins) { //RLD
    }),
    0x370: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x70], // ED 70
        function(regs, pins) { //
    }),
    0x371: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x71], // ED 71
        function(regs, pins) { //
    }),
    0x372: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x72], // ED 72
        function(regs, pins) { //
    }),
    0x373: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x73], // ED 73
        function(regs, pins) { //
    }),
    0x374: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x74], // ED 74
        function(regs, pins) { //NEG
    }),
    0x375: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x75], // ED 75
        function(regs, pins) { //RETN
    }),
    0x376: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x76], // ED 76
        function(regs, pins) { //
    }),
    0x377: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x77], // ED 77
        function(regs, pins) { //NOP
    }),
    0x378: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x78], // ED 78
        function(regs, pins) { //
    }),
    0x379: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x79], // ED 79
        function(regs, pins) { //
    }),
    0x37A: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x7A], // ED 7A
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                x = regs.L;
                y = SP & 0xFF;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.H;
                y = (SP & 0xFF) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                regs.F.Z = +((regs.H === 0) && (regs.L === 0));
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x37B: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x7B], // ED 7B
        function(regs, pins) { //
    }),
    0x37C: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x7C], // ED 7C
        function(regs, pins) { //NEG
    }),
    0x37D: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x7D], // ED 7D
        function(regs, pins) { //RETI
    }),
    0x37E: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x7E], // ED 7E
        function(regs, pins) { //
    }),
    0x37F: new Z80_opcode_functions(Z80_ED_opcode_matrix[0x7F], // ED 7F
        function(regs, pins) { //NOP
    }),
    0x380: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x381: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x382: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x383: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x384: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x385: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x386: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x387: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x388: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x389: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x38A: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x38B: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x38C: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x38D: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x38E: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x38F: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x390: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x391: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x392: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x393: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x394: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x395: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x396: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x397: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x398: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x399: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x39A: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x39B: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x39C: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x39D: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x39E: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x39F: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3A0: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xA0], // ED A0
        function(regs, pins) { //LDI
    }),
    0x3A1: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xA1], // ED A1
        function(regs, pins) { //CPI
    }),
    0x3A2: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xA2], // ED A2
        function(regs, pins) { //INI
    }),
    0x3A3: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xA3], // ED A3
        function(regs, pins) { //OUTI
    }),
    0x3A4: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3A5: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3A6: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3A7: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3A8: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xA8], // ED A8
        function(regs, pins) { //LDD
    }),
    0x3A9: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xA9], // ED A9
        function(regs, pins) { //CPD
    }),
    0x3AA: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xAA], // ED AA
        function(regs, pins) { //IND
    }),
    0x3AB: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xAB], // ED AB
        function(regs, pins) { //OUTD
    }),
    0x3AC: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3AD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3AE: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3AF: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3B0: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xB0], // ED B0
        function(regs, pins) { //LDIR
    }),
    0x3B1: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xB1], // ED B1
        function(regs, pins) { //CPIR
    }),
    0x3B2: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xB2], // ED B2
        function(regs, pins) { //INIR
    }),
    0x3B3: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xB3], // ED B3
        function(regs, pins) { //OTIR
    }),
    0x3B4: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3B5: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3B6: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3B7: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3B8: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xB8], // ED B8
        function(regs, pins) { //LDDR
    }),
    0x3B9: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xB9], // ED B9
        function(regs, pins) { //CPDR
    }),
    0x3BA: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xBA], // ED BA
        function(regs, pins) { //INDR
    }),
    0x3BB: new Z80_opcode_functions(Z80_ED_opcode_matrix[0xBB], // ED BB
        function(regs, pins) { //OTDR
    }),
    0x3BC: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3BD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3BE: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3BF: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C0: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C1: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C2: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C3: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C4: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C5: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C6: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C7: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C8: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3C9: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3CA: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3CB: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3CC: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3CD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3CE: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3CF: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D0: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D1: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D2: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D3: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D4: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D5: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D6: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D7: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D8: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3D9: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3DA: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3DB: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3DC: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3DD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3DE: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3DF: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E0: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E1: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E2: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E3: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E4: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E5: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E6: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E7: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E8: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3E9: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3EA: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3EB: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3EC: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3ED: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3EE: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3EF: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F0: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F1: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F2: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F3: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F4: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F5: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F6: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F7: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F8: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3F9: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3FA: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3FB: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3FC: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3FD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3FE: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x3FF: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x400: new Z80_opcode_functions(Z80_opcode_matrix[0x00], // FD 00
        function(regs, pins) { //NOP
    }),
    0x401: new Z80_opcode_functions(Z80_opcode_matrix[0x01], // FD 01
        function(regs, pins) { //
    }),
    0x402: new Z80_opcode_functions(Z80_opcode_matrix[0x02], // FD 02
        function(regs, pins) { //
    }),
    0x403: new Z80_opcode_functions(Z80_opcode_matrix[0x03], // FD 03
        function(regs, pins) { //
    }),
    0x404: new Z80_opcode_functions(Z80_opcode_matrix[0x04], // FD 04
        function(regs, pins) { //
    }),
    0x405: new Z80_opcode_functions(Z80_opcode_matrix[0x05], // FD 05
        function(regs, pins) { //
    }),
    0x406: new Z80_opcode_functions(Z80_opcode_matrix[0x06], // FD 06
        function(regs, pins) { //
    }),
    0x407: new Z80_opcode_functions(Z80_opcode_matrix[0x07], // FD 07
        function(regs, pins) { //
    }),
    0x408: new Z80_opcode_functions(Z80_opcode_matrix[0x08], // FD 08
        function(regs, pins) { //
    }),
    0x409: new Z80_opcode_functions(Z80_opcode_matrix[0x09], // FD 09
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = BC & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (BC & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x40A: new Z80_opcode_functions(Z80_opcode_matrix[0x0A], // FD 0A
        function(regs, pins) { //
    }),
    0x40B: new Z80_opcode_functions(Z80_opcode_matrix[0x0B], // FD 0B
        function(regs, pins) { //
    }),
    0x40C: new Z80_opcode_functions(Z80_opcode_matrix[0x0C], // FD 0C
        function(regs, pins) { //
    }),
    0x40D: new Z80_opcode_functions(Z80_opcode_matrix[0x0D], // FD 0D
        function(regs, pins) { //
    }),
    0x40E: new Z80_opcode_functions(Z80_opcode_matrix[0x0E], // FD 0E
        function(regs, pins) { //
    }),
    0x40F: new Z80_opcode_functions(Z80_opcode_matrix[0x0F], // FD 0F
        function(regs, pins) { //
    }),
    0x410: new Z80_opcode_functions(Z80_opcode_matrix[0x10], // FD 10
        function(regs, pins) { //
    }),
    0x411: new Z80_opcode_functions(Z80_opcode_matrix[0x11], // FD 11
        function(regs, pins) { //
    }),
    0x412: new Z80_opcode_functions(Z80_opcode_matrix[0x12], // FD 12
        function(regs, pins) { //
    }),
    0x413: new Z80_opcode_functions(Z80_opcode_matrix[0x13], // FD 13
        function(regs, pins) { //
    }),
    0x414: new Z80_opcode_functions(Z80_opcode_matrix[0x14], // FD 14
        function(regs, pins) { //
    }),
    0x415: new Z80_opcode_functions(Z80_opcode_matrix[0x15], // FD 15
        function(regs, pins) { //
    }),
    0x416: new Z80_opcode_functions(Z80_opcode_matrix[0x16], // FD 16
        function(regs, pins) { //
    }),
    0x417: new Z80_opcode_functions(Z80_opcode_matrix[0x17], // FD 17
        function(regs, pins) { //
    }),
    0x418: new Z80_opcode_functions(Z80_opcode_matrix[0x18], // FD 18
        function(regs, pins) { //
    }),
    0x419: new Z80_opcode_functions(Z80_opcode_matrix[0x19], // FD 19
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = DE & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (DE & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x41A: new Z80_opcode_functions(Z80_opcode_matrix[0x1A], // FD 1A
        function(regs, pins) { //
    }),
    0x41B: new Z80_opcode_functions(Z80_opcode_matrix[0x1B], // FD 1B
        function(regs, pins) { //
    }),
    0x41C: new Z80_opcode_functions(Z80_opcode_matrix[0x1C], // FD 1C
        function(regs, pins) { //
    }),
    0x41D: new Z80_opcode_functions(Z80_opcode_matrix[0x1D], // FD 1D
        function(regs, pins) { //
    }),
    0x41E: new Z80_opcode_functions(Z80_opcode_matrix[0x1E], // FD 1E
        function(regs, pins) { //
    }),
    0x41F: new Z80_opcode_functions(Z80_opcode_matrix[0x1F], // FD 1F
        function(regs, pins) { //RRA
    }),
    0x420: new Z80_opcode_functions(Z80_opcode_matrix[0x20], // FD 20
        function(regs, pins) { //
    }),
    0x421: new Z80_opcode_functions(Z80_opcode_matrix[0x21], // FD 21
        function(regs, pins) { //
    }),
    0x422: new Z80_opcode_functions(Z80_opcode_matrix[0x22], // FD 22
        function(regs, pins) { //
    }),
    0x423: new Z80_opcode_functions(Z80_opcode_matrix[0x23], // FD 23
        function(regs, pins) { //
    }),
    0x424: new Z80_opcode_functions(Z80_opcode_matrix[0x24], // FD 24
        function(regs, pins) { //
    }),
    0x425: new Z80_opcode_functions(Z80_opcode_matrix[0x25], // FD 25
        function(regs, pins) { //
    }),
    0x426: new Z80_opcode_functions(Z80_opcode_matrix[0x26], // FD 26
        function(regs, pins) { //
    }),
    0x427: new Z80_opcode_functions(Z80_opcode_matrix[0x27], // FD 27
        function(regs, pins) { //DAA
    }),
    0x428: new Z80_opcode_functions(Z80_opcode_matrix[0x28], // FD 28
        function(regs, pins) { //
    }),
    0x429: new Z80_opcode_functions(Z80_opcode_matrix[0x29], // FD 29
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = IY & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (IY & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x42A: new Z80_opcode_functions(Z80_opcode_matrix[0x2A], // FD 2A
        function(regs, pins) { //
    }),
    0x42B: new Z80_opcode_functions(Z80_opcode_matrix[0x2B], // FD 2B
        function(regs, pins) { //
    }),
    0x42C: new Z80_opcode_functions(Z80_opcode_matrix[0x2C], // FD 2C
        function(regs, pins) { //
    }),
    0x42D: new Z80_opcode_functions(Z80_opcode_matrix[0x2D], // FD 2D
        function(regs, pins) { //
    }),
    0x42E: new Z80_opcode_functions(Z80_opcode_matrix[0x2E], // FD 2E
        function(regs, pins) { //
    }),
    0x42F: new Z80_opcode_functions(Z80_opcode_matrix[0x2F], // FD 2F
        function(regs, pins) { //CPL
    }),
    0x430: new Z80_opcode_functions(Z80_opcode_matrix[0x30], // FD 30
        function(regs, pins) { //regs.F.C === 0
    }),
    0x431: new Z80_opcode_functions(Z80_opcode_matrix[0x31], // FD 31
        function(regs, pins) { //
    }),
    0x432: new Z80_opcode_functions(Z80_opcode_matrix[0x32], // FD 32
        function(regs, pins) { //
    }),
    0x433: new Z80_opcode_functions(Z80_opcode_matrix[0x33], // FD 33
        function(regs, pins) { //
    }),
    0x434: new Z80_opcode_functions(Z80_opcode_matrix[0x34], // FD 34
        function(regs, pins) { //
    }),
    0x435: new Z80_opcode_functions(Z80_opcode_matrix[0x35], // FD 35
        function(regs, pins) { //
    }),
    0x436: new Z80_opcode_functions(Z80_opcode_matrix[0x36], // FD 36
        function(regs, pins) { //
    }),
    0x437: new Z80_opcode_functions(Z80_opcode_matrix[0x37], // FD 37
        function(regs, pins) { //SCF
    }),
    0x438: new Z80_opcode_functions(Z80_opcode_matrix[0x38], // FD 38
        function(regs, pins) { //
    }),
    0x439: new Z80_opcode_functions(Z80_opcode_matrix[0x39], // FD 39
        function(regs, pins) { //
        let x, y, z;
        switch(regs.TCU) {
            case 1: // Adding 4 cycles
                regs.Q = 1;
                regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;
                regs.t[0] = regs.F.V; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;
                pins.IO = undefined;
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                x = regs.H;
                y = SP & 0xFF;
                z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.H = z & 0xFF;
                
                break;
            case 5: // Adding 3 cycles
                break;
            case 6:
                break;
            case 7:
                x = regs.L;
                y = (SP & 0xFF00) >>> 8;
                z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.L = z & 0xFF;
                regs.F.V = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];
                // Following is auto-generated code for instruction finish
                break;
            case 8: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x43A: new Z80_opcode_functions(Z80_opcode_matrix[0x3A], // FD 3A
        function(regs, pins) { //
    }),
    0x43B: new Z80_opcode_functions(Z80_opcode_matrix[0x3B], // FD 3B
        function(regs, pins) { //
    }),
    0x43C: new Z80_opcode_functions(Z80_opcode_matrix[0x3C], // FD 3C
        function(regs, pins) { //
    }),
    0x43D: new Z80_opcode_functions(Z80_opcode_matrix[0x3D], // FD 3D
        function(regs, pins) { //
    }),
    0x43E: new Z80_opcode_functions(Z80_opcode_matrix[0x3E], // FD 3E
        function(regs, pins) { //
    }),
    0x43F: new Z80_opcode_functions(Z80_opcode_matrix[0x3F], // FD 3F
        function(regs, pins) { //CCF
    }),
    0x440: new Z80_opcode_functions(Z80_opcode_matrix[0x40], // FD 40
        function(regs, pins) { //
    }),
    0x441: new Z80_opcode_functions(Z80_opcode_matrix[0x41], // FD 41
        function(regs, pins) { //
    }),
    0x442: new Z80_opcode_functions(Z80_opcode_matrix[0x42], // FD 42
        function(regs, pins) { //
    }),
    0x443: new Z80_opcode_functions(Z80_opcode_matrix[0x43], // FD 43
        function(regs, pins) { //
    }),
    0x444: new Z80_opcode_functions(Z80_opcode_matrix[0x44], // FD 44
        function(regs, pins) { //
    }),
    0x445: new Z80_opcode_functions(Z80_opcode_matrix[0x45], // FD 45
        function(regs, pins) { //
    }),
    0x446: new Z80_opcode_functions(Z80_opcode_matrix[0x46], // FD 46
        function(regs, pins) { //
    }),
    0x447: new Z80_opcode_functions(Z80_opcode_matrix[0x47], // FD 47
        function(regs, pins) { //
    }),
    0x448: new Z80_opcode_functions(Z80_opcode_matrix[0x48], // FD 48
        function(regs, pins) { //
    }),
    0x449: new Z80_opcode_functions(Z80_opcode_matrix[0x49], // FD 49
        function(regs, pins) { //
    }),
    0x44A: new Z80_opcode_functions(Z80_opcode_matrix[0x4A], // FD 4A
        function(regs, pins) { //
    }),
    0x44B: new Z80_opcode_functions(Z80_opcode_matrix[0x4B], // FD 4B
        function(regs, pins) { //
    }),
    0x44C: new Z80_opcode_functions(Z80_opcode_matrix[0x4C], // FD 4C
        function(regs, pins) { //
    }),
    0x44D: new Z80_opcode_functions(Z80_opcode_matrix[0x4D], // FD 4D
        function(regs, pins) { //
    }),
    0x44E: new Z80_opcode_functions(Z80_opcode_matrix[0x4E], // FD 4E
        function(regs, pins) { //
    }),
    0x44F: new Z80_opcode_functions(Z80_opcode_matrix[0x4F], // FD 4F
        function(regs, pins) { //
    }),
    0x450: new Z80_opcode_functions(Z80_opcode_matrix[0x50], // FD 50
        function(regs, pins) { //
    }),
    0x451: new Z80_opcode_functions(Z80_opcode_matrix[0x51], // FD 51
        function(regs, pins) { //
    }),
    0x452: new Z80_opcode_functions(Z80_opcode_matrix[0x52], // FD 52
        function(regs, pins) { //
    }),
    0x453: new Z80_opcode_functions(Z80_opcode_matrix[0x53], // FD 53
        function(regs, pins) { //
    }),
    0x454: new Z80_opcode_functions(Z80_opcode_matrix[0x54], // FD 54
        function(regs, pins) { //
    }),
    0x455: new Z80_opcode_functions(Z80_opcode_matrix[0x55], // FD 55
        function(regs, pins) { //
    }),
    0x456: new Z80_opcode_functions(Z80_opcode_matrix[0x56], // FD 56
        function(regs, pins) { //
    }),
    0x457: new Z80_opcode_functions(Z80_opcode_matrix[0x57], // FD 57
        function(regs, pins) { //
    }),
    0x458: new Z80_opcode_functions(Z80_opcode_matrix[0x58], // FD 58
        function(regs, pins) { //
    }),
    0x459: new Z80_opcode_functions(Z80_opcode_matrix[0x59], // FD 59
        function(regs, pins) { //
    }),
    0x45A: new Z80_opcode_functions(Z80_opcode_matrix[0x5A], // FD 5A
        function(regs, pins) { //
    }),
    0x45B: new Z80_opcode_functions(Z80_opcode_matrix[0x5B], // FD 5B
        function(regs, pins) { //
    }),
    0x45C: new Z80_opcode_functions(Z80_opcode_matrix[0x5C], // FD 5C
        function(regs, pins) { //
    }),
    0x45D: new Z80_opcode_functions(Z80_opcode_matrix[0x5D], // FD 5D
        function(regs, pins) { //
    }),
    0x45E: new Z80_opcode_functions(Z80_opcode_matrix[0x5E], // FD 5E
        function(regs, pins) { //
    }),
    0x45F: new Z80_opcode_functions(Z80_opcode_matrix[0x5F], // FD 5F
        function(regs, pins) { //
    }),
    0x460: new Z80_opcode_functions(Z80_opcode_matrix[0x60], // FD 60
        function(regs, pins) { //
    }),
    0x461: new Z80_opcode_functions(Z80_opcode_matrix[0x61], // FD 61
        function(regs, pins) { //
    }),
    0x462: new Z80_opcode_functions(Z80_opcode_matrix[0x62], // FD 62
        function(regs, pins) { //
    }),
    0x463: new Z80_opcode_functions(Z80_opcode_matrix[0x63], // FD 63
        function(regs, pins) { //
    }),
    0x464: new Z80_opcode_functions(Z80_opcode_matrix[0x64], // FD 64
        function(regs, pins) { //
    }),
    0x465: new Z80_opcode_functions(Z80_opcode_matrix[0x65], // FD 65
        function(regs, pins) { //
    }),
    0x466: new Z80_opcode_functions(Z80_opcode_matrix[0x66], // FD 66
        function(regs, pins) { //
    }),
    0x467: new Z80_opcode_functions(Z80_opcode_matrix[0x67], // FD 67
        function(regs, pins) { //
    }),
    0x468: new Z80_opcode_functions(Z80_opcode_matrix[0x68], // FD 68
        function(regs, pins) { //
    }),
    0x469: new Z80_opcode_functions(Z80_opcode_matrix[0x69], // FD 69
        function(regs, pins) { //
    }),
    0x46A: new Z80_opcode_functions(Z80_opcode_matrix[0x6A], // FD 6A
        function(regs, pins) { //
    }),
    0x46B: new Z80_opcode_functions(Z80_opcode_matrix[0x6B], // FD 6B
        function(regs, pins) { //
    }),
    0x46C: new Z80_opcode_functions(Z80_opcode_matrix[0x6C], // FD 6C
        function(regs, pins) { //
    }),
    0x46D: new Z80_opcode_functions(Z80_opcode_matrix[0x6D], // FD 6D
        function(regs, pins) { //
    }),
    0x46E: new Z80_opcode_functions(Z80_opcode_matrix[0x6E], // FD 6E
        function(regs, pins) { //
    }),
    0x46F: new Z80_opcode_functions(Z80_opcode_matrix[0x6F], // FD 6F
        function(regs, pins) { //
    }),
    0x470: new Z80_opcode_functions(Z80_opcode_matrix[0x70], // FD 70
        function(regs, pins) { //
    }),
    0x471: new Z80_opcode_functions(Z80_opcode_matrix[0x71], // FD 71
        function(regs, pins) { //
    }),
    0x472: new Z80_opcode_functions(Z80_opcode_matrix[0x72], // FD 72
        function(regs, pins) { //
    }),
    0x473: new Z80_opcode_functions(Z80_opcode_matrix[0x73], // FD 73
        function(regs, pins) { //
    }),
    0x474: new Z80_opcode_functions(Z80_opcode_matrix[0x74], // FD 74
        function(regs, pins) { //
    }),
    0x475: new Z80_opcode_functions(Z80_opcode_matrix[0x75], // FD 75
        function(regs, pins) { //
    }),
    0x476: new Z80_opcode_functions(Z80_opcode_matrix[0x76], // FD 76
        function(regs, pins) { //HALT
    }),
    0x477: new Z80_opcode_functions(Z80_opcode_matrix[0x77], // FD 77
        function(regs, pins) { //
    }),
    0x478: new Z80_opcode_functions(Z80_opcode_matrix[0x78], // FD 78
        function(regs, pins) { //
    }),
    0x479: new Z80_opcode_functions(Z80_opcode_matrix[0x79], // FD 79
        function(regs, pins) { //
    }),
    0x47A: new Z80_opcode_functions(Z80_opcode_matrix[0x7A], // FD 7A
        function(regs, pins) { //
    }),
    0x47B: new Z80_opcode_functions(Z80_opcode_matrix[0x7B], // FD 7B
        function(regs, pins) { //
    }),
    0x47C: new Z80_opcode_functions(Z80_opcode_matrix[0x7C], // FD 7C
        function(regs, pins) { //
    }),
    0x47D: new Z80_opcode_functions(Z80_opcode_matrix[0x7D], // FD 7D
        function(regs, pins) { //
    }),
    0x47E: new Z80_opcode_functions(Z80_opcode_matrix[0x7E], // FD 7E
        function(regs, pins) { //
    }),
    0x47F: new Z80_opcode_functions(Z80_opcode_matrix[0x7F], // FD 7F
        function(regs, pins) { //
    }),
    0x480: new Z80_opcode_functions(Z80_opcode_matrix[0x80], // FD 80
        function(regs, pins) { //
    }),
    0x481: new Z80_opcode_functions(Z80_opcode_matrix[0x81], // FD 81
        function(regs, pins) { //
    }),
    0x482: new Z80_opcode_functions(Z80_opcode_matrix[0x82], // FD 82
        function(regs, pins) { //
    }),
    0x483: new Z80_opcode_functions(Z80_opcode_matrix[0x83], // FD 83
        function(regs, pins) { //
    }),
    0x484: new Z80_opcode_functions(Z80_opcode_matrix[0x84], // FD 84
        function(regs, pins) { //
    }),
    0x485: new Z80_opcode_functions(Z80_opcode_matrix[0x85], // FD 85
        function(regs, pins) { //
    }),
    0x486: new Z80_opcode_functions(Z80_opcode_matrix[0x86], // FD 86
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                pins.IO = undefined;
                break;
            case 4: // Adding 5 cycles
                break;
            case 5:
                break;
            case 6:
                break;
            case 7:
                break;
            case 8:
                regs.WZ = (regs.IY + mksigned8(regs.TR)) & 0xFFFF;
                regs.TA = regs.WZ;
                break;
            case 9: // Start read
                pins.Addr = regs.TA;
                
                break;
            case 10:
                pins.RD = 1;
                break;
            case 11: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TA = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 12: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x487: new Z80_opcode_functions(Z80_opcode_matrix[0x87], // FD 87
        function(regs, pins) { //
    }),
    0x488: new Z80_opcode_functions(Z80_opcode_matrix[0x88], // FD 88
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = B;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x489: new Z80_opcode_functions(Z80_opcode_matrix[0x89], // FD 89
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = C;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x48A: new Z80_opcode_functions(Z80_opcode_matrix[0x8A], // FD 8A
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = D;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x48B: new Z80_opcode_functions(Z80_opcode_matrix[0x8B], // FD 8B
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = E;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x48C: new Z80_opcode_functions(Z80_opcode_matrix[0x8C], // FD 8C
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = H;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x48D: new Z80_opcode_functions(Z80_opcode_matrix[0x8D], // FD 8D
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = L;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x48E: new Z80_opcode_functions(Z80_opcode_matrix[0x8E], // FD 8E
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                pins.IO = undefined;
                break;
            case 4: // Adding 5 cycles
                break;
            case 5:
                break;
            case 6:
                break;
            case 7:
                break;
            case 8:
                regs.WZ = (regs.IY + mksigned8(regs.TR)) & 0xFFFF;
                regs.TA = regs.WZ;
                break;
            case 9: // Start read
                pins.Addr = regs.TA;
                
                break;
            case 10:
                pins.RD = 1;
                break;
            case 11: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 12: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x48F: new Z80_opcode_functions(Z80_opcode_matrix[0x8F], // FD 8F
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.Q = 1;
                let x = regs.A;
                let y = A;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.TR = z & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x490: new Z80_opcode_functions(Z80_opcode_matrix[0x90], // FD 90
        function(regs, pins) { //
    }),
    0x491: new Z80_opcode_functions(Z80_opcode_matrix[0x91], // FD 91
        function(regs, pins) { //
    }),
    0x492: new Z80_opcode_functions(Z80_opcode_matrix[0x92], // FD 92
        function(regs, pins) { //
    }),
    0x493: new Z80_opcode_functions(Z80_opcode_matrix[0x93], // FD 93
        function(regs, pins) { //
    }),
    0x494: new Z80_opcode_functions(Z80_opcode_matrix[0x94], // FD 94
        function(regs, pins) { //
    }),
    0x495: new Z80_opcode_functions(Z80_opcode_matrix[0x95], // FD 95
        function(regs, pins) { //
    }),
    0x496: new Z80_opcode_functions(Z80_opcode_matrix[0x96], // FD 96
        function(regs, pins) { //
    }),
    0x497: new Z80_opcode_functions(Z80_opcode_matrix[0x97], // FD 97
        function(regs, pins) { //
    }),
    0x498: new Z80_opcode_functions(Z80_opcode_matrix[0x98], // FD 98
        function(regs, pins) { //
    }),
    0x499: new Z80_opcode_functions(Z80_opcode_matrix[0x99], // FD 99
        function(regs, pins) { //
    }),
    0x49A: new Z80_opcode_functions(Z80_opcode_matrix[0x9A], // FD 9A
        function(regs, pins) { //
    }),
    0x49B: new Z80_opcode_functions(Z80_opcode_matrix[0x9B], // FD 9B
        function(regs, pins) { //
    }),
    0x49C: new Z80_opcode_functions(Z80_opcode_matrix[0x9C], // FD 9C
        function(regs, pins) { //
    }),
    0x49D: new Z80_opcode_functions(Z80_opcode_matrix[0x9D], // FD 9D
        function(regs, pins) { //
    }),
    0x49E: new Z80_opcode_functions(Z80_opcode_matrix[0x9E], // FD 9E
        function(regs, pins) { //
    }),
    0x49F: new Z80_opcode_functions(Z80_opcode_matrix[0x9F], // FD 9F
        function(regs, pins) { //
    }),
    0x4A0: new Z80_opcode_functions(Z80_opcode_matrix[0xA0], // FD A0
        function(regs, pins) { //
    }),
    0x4A1: new Z80_opcode_functions(Z80_opcode_matrix[0xA1], // FD A1
        function(regs, pins) { //
    }),
    0x4A2: new Z80_opcode_functions(Z80_opcode_matrix[0xA2], // FD A2
        function(regs, pins) { //
    }),
    0x4A3: new Z80_opcode_functions(Z80_opcode_matrix[0xA3], // FD A3
        function(regs, pins) { //
    }),
    0x4A4: new Z80_opcode_functions(Z80_opcode_matrix[0xA4], // FD A4
        function(regs, pins) { //
    }),
    0x4A5: new Z80_opcode_functions(Z80_opcode_matrix[0xA5], // FD A5
        function(regs, pins) { //
    }),
    0x4A6: new Z80_opcode_functions(Z80_opcode_matrix[0xA6], // FD A6
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                pins.IO = undefined;
                break;
            case 4: // Adding 5 cycles
                break;
            case 5:
                break;
            case 6:
                break;
            case 7:
                break;
            case 8:
                regs.WZ = (regs.IY + mksigned8(regs.TR)) & 0xFFFF;
                regs.TA = regs.WZ;
                break;
            case 9: // Start read
                pins.Addr = regs.TA;
                
                break;
            case 10:
                pins.RD = 1;
                break;
            case 11: // Read end
                regs.TR = pins.D;
                pins.RD = 0;
                let z = (regs.A) & (regs.TR);
                regs.F.C = regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z;
                // Following is auto-generated code for instruction finish
                break;
            case 12: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1;
                regs.TCU = 0;
                break;
        }
    }),
    0x4A7: new Z80_opcode_functions(Z80_opcode_matrix[0xA7], // FD A7
        function(regs, pins) { //
    }),
    0x4A8: new Z80_opcode_functions(Z80_opcode_matrix[0xA8], // FD A8
        function(regs, pins) { //
    }),
    0x4A9: new Z80_opcode_functions(Z80_opcode_matrix[0xA9], // FD A9
        function(regs, pins) { //
    }),
    0x4AA: new Z80_opcode_functions(Z80_opcode_matrix[0xAA], // FD AA
        function(regs, pins) { //
    }),
    0x4AB: new Z80_opcode_functions(Z80_opcode_matrix[0xAB], // FD AB
        function(regs, pins) { //
    }),
    0x4AC: new Z80_opcode_functions(Z80_opcode_matrix[0xAC], // FD AC
        function(regs, pins) { //
    }),
    0x4AD: new Z80_opcode_functions(Z80_opcode_matrix[0xAD], // FD AD
        function(regs, pins) { //
    }),
    0x4AE: new Z80_opcode_functions(Z80_opcode_matrix[0xAE], // FD AE
        function(regs, pins) { //
    }),
    0x4AF: new Z80_opcode_functions(Z80_opcode_matrix[0xAF], // FD AF
        function(regs, pins) { //
    }),
    0x4B0: new Z80_opcode_functions(Z80_opcode_matrix[0xB0], // FD B0
        function(regs, pins) { //
    }),
    0x4B1: new Z80_opcode_functions(Z80_opcode_matrix[0xB1], // FD B1
        function(regs, pins) { //
    }),
    0x4B2: new Z80_opcode_functions(Z80_opcode_matrix[0xB2], // FD B2
        function(regs, pins) { //
    }),
    0x4B3: new Z80_opcode_functions(Z80_opcode_matrix[0xB3], // FD B3
        function(regs, pins) { //
    }),
    0x4B4: new Z80_opcode_functions(Z80_opcode_matrix[0xB4], // FD B4
        function(regs, pins) { //
    }),
    0x4B5: new Z80_opcode_functions(Z80_opcode_matrix[0xB5], // FD B5
        function(regs, pins) { //
    }),
    0x4B6: new Z80_opcode_functions(Z80_opcode_matrix[0xB6], // FD B6
        function(regs, pins) { //
    }),
    0x4B7: new Z80_opcode_functions(Z80_opcode_matrix[0xB7], // FD B7
        function(regs, pins) { //
    }),
    0x4B8: new Z80_opcode_functions(Z80_opcode_matrix[0xB8], // FD B8
        function(regs, pins) { //
    }),
    0x4B9: new Z80_opcode_functions(Z80_opcode_matrix[0xB9], // FD B9
        function(regs, pins) { //
    }),
    0x4BA: new Z80_opcode_functions(Z80_opcode_matrix[0xBA], // FD BA
        function(regs, pins) { //
    }),
    0x4BB: new Z80_opcode_functions(Z80_opcode_matrix[0xBB], // FD BB
        function(regs, pins) { //
    }),
    0x4BC: new Z80_opcode_functions(Z80_opcode_matrix[0xBC], // FD BC
        function(regs, pins) { //
    }),
    0x4BD: new Z80_opcode_functions(Z80_opcode_matrix[0xBD], // FD BD
        function(regs, pins) { //
    }),
    0x4BE: new Z80_opcode_functions(Z80_opcode_matrix[0xBE], // FD BE
        function(regs, pins) { //
    }),
    0x4BF: new Z80_opcode_functions(Z80_opcode_matrix[0xBF], // FD BF
        function(regs, pins) { //
    }),
    0x4C0: new Z80_opcode_functions(Z80_opcode_matrix[0xC0], // FD C0
        function(regs, pins) { //
    }),
    0x4C1: new Z80_opcode_functions(Z80_opcode_matrix[0xC1], // FD C1
        function(regs, pins) { //
    }),
    0x4C2: new Z80_opcode_functions(Z80_opcode_matrix[0xC2], // FD C2
        function(regs, pins) { //
    }),
    0x4C3: new Z80_opcode_functions(Z80_opcode_matrix[0xC3], // FD C3
        function(regs, pins) { //
    }),
    0x4C4: new Z80_opcode_functions(Z80_opcode_matrix[0xC4], // FD C4
        function(regs, pins) { //
    }),
    0x4C5: new Z80_opcode_functions(Z80_opcode_matrix[0xC5], // FD C5
        function(regs, pins) { //
    }),
    0x4C6: new Z80_opcode_functions(Z80_opcode_matrix[0xC6], // FD C6
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + 0;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x4C7: new Z80_opcode_functions(Z80_opcode_matrix[0xC7], // FD C7
        function(regs, pins) { //
    }),
    0x4C8: new Z80_opcode_functions(Z80_opcode_matrix[0xC8], // FD C8
        function(regs, pins) { //
    }),
    0x4C9: new Z80_opcode_functions(Z80_opcode_matrix[0xC9], // FD C9
        function(regs, pins) { //undefined
    }),
    0x4CA: new Z80_opcode_functions(Z80_opcode_matrix[0xCA], // FD CA
        function(regs, pins) { //
    }),
    0x4CB: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x4CC: new Z80_opcode_functions(Z80_opcode_matrix[0xCC], // FD CC
        function(regs, pins) { //
    }),
    0x4CD: new Z80_opcode_functions(Z80_opcode_matrix[0xCD], // FD CD
        function(regs, pins) { //
    }),
    0x4CE: new Z80_opcode_functions(Z80_opcode_matrix[0xCE], // FD CE
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                let x = regs.A;
                let y = regs.TR;
                let z = x + y + regs.F.C;
                regs.F.C = +(z > 0xFF);
                regs.F.N = 0;
                regs.F.V = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = (((x ^ y ^ z) ^ 0xFF) & 0x10) >>> 4;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z & 0xFF) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z & 0xFF;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x4CF: new Z80_opcode_functions(Z80_opcode_matrix[0xCF], // FD CF
        function(regs, pins) { //
    }),
    0x4D0: new Z80_opcode_functions(Z80_opcode_matrix[0xD0], // FD D0
        function(regs, pins) { //
    }),
    0x4D1: new Z80_opcode_functions(Z80_opcode_matrix[0xD1], // FD D1
        function(regs, pins) { //
    }),
    0x4D2: new Z80_opcode_functions(Z80_opcode_matrix[0xD2], // FD D2
        function(regs, pins) { //
    }),
    0x4D3: new Z80_opcode_functions(Z80_opcode_matrix[0xD3], // FD D3
        function(regs, pins) { //
    }),
    0x4D4: new Z80_opcode_functions(Z80_opcode_matrix[0xD4], // FD D4
        function(regs, pins) { //
    }),
    0x4D5: new Z80_opcode_functions(Z80_opcode_matrix[0xD5], // FD D5
        function(regs, pins) { //
    }),
    0x4D6: new Z80_opcode_functions(Z80_opcode_matrix[0xD6], // FD D6
        function(regs, pins) { //
    }),
    0x4D7: new Z80_opcode_functions(Z80_opcode_matrix[0xD7], // FD D7
        function(regs, pins) { //
    }),
    0x4D8: new Z80_opcode_functions(Z80_opcode_matrix[0xD8], // FD D8
        function(regs, pins) { //
    }),
    0x4D9: new Z80_opcode_functions(Z80_opcode_matrix[0xD9], // FD D9
        function(regs, pins) { //undefined
    }),
    0x4DA: new Z80_opcode_functions(Z80_opcode_matrix[0xDA], // FD DA
        function(regs, pins) { //
    }),
    0x4DB: new Z80_opcode_functions(Z80_opcode_matrix[0xDB], // FD DB
        function(regs, pins) { //
    }),
    0x4DC: new Z80_opcode_functions(Z80_opcode_matrix[0xDC], // FD DC
        function(regs, pins) { //
    }),
    0x4DD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x4DE: new Z80_opcode_functions(Z80_opcode_matrix[0xDE], // FD DE
        function(regs, pins) { //
    }),
    0x4DF: new Z80_opcode_functions(Z80_opcode_matrix[0xDF], // FD DF
        function(regs, pins) { //
    }),
    0x4E0: new Z80_opcode_functions(Z80_opcode_matrix[0xE0], // FD E0
        function(regs, pins) { //
    }),
    0x4E1: new Z80_opcode_functions(Z80_opcode_matrix[0xE1], // FD E1
        function(regs, pins) { //
    }),
    0x4E2: new Z80_opcode_functions(Z80_opcode_matrix[0xE2], // FD E2
        function(regs, pins) { //
    }),
    0x4E3: new Z80_opcode_functions(Z80_opcode_matrix[0xE3], // FD E3
        function(regs, pins) { //
    }),
    0x4E4: new Z80_opcode_functions(Z80_opcode_matrix[0xE4], // FD E4
        function(regs, pins) { //
    }),
    0x4E5: new Z80_opcode_functions(Z80_opcode_matrix[0xE5], // FD E5
        function(regs, pins) { //
    }),
    0x4E6: new Z80_opcode_functions(Z80_opcode_matrix[0xE6], // FD E6
        function(regs, pins) { //
        switch(regs.TCU) {
            case 1: // operand8() start
                regs.Q = 1;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                break;
            case 3: // operand8() end
                regs.TR = pins.D;
                let z = (regs.A) & (regs.TR);
                regs.F.C = regs.F.N = 0;
                regs.F.P = Z80_parity(z);
                regs.F.X = ((z) & 8) >>> 3;
                regs.F.H = 1;
                regs.F.Y = ((z) & 0x20) >>> 5;
                regs.F.Z = +((z) === 0);
                regs.F.S = ((z) & 0x80) >>> 7;
                regs.A = z;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                pins.RD = 1; pins.IO = undefined;
                regs.TCU = 0;
                break;
        }
    }),
    0x4E7: new Z80_opcode_functions(Z80_opcode_matrix[0xE7], // FD E7
        function(regs, pins) { //
    }),
    0x4E8: new Z80_opcode_functions(Z80_opcode_matrix[0xE8], // FD E8
        function(regs, pins) { //
    }),
    0x4E9: new Z80_opcode_functions(Z80_opcode_matrix[0xE9], // FD E9
        function(regs, pins) { //
    }),
    0x4EA: new Z80_opcode_functions(Z80_opcode_matrix[0xEA], // FD EA
        function(regs, pins) { //
    }),
    0x4EB: new Z80_opcode_functions(Z80_opcode_matrix[0xEB], // FD EB
        function(regs, pins) { //
    }),
    0x4EC: new Z80_opcode_functions(Z80_opcode_matrix[0xEC], // FD EC
        function(regs, pins) { //
    }),
    0x4ED: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x4EE: new Z80_opcode_functions(Z80_opcode_matrix[0xEE], // FD EE
        function(regs, pins) { //undefined
    }),
    0x4EF: new Z80_opcode_functions(Z80_opcode_matrix[0xEF], // FD EF
        function(regs, pins) { //5
    }),
    0x4F0: new Z80_opcode_functions(Z80_opcode_matrix[0xF0], // FD F0
        function(regs, pins) { //
    }),
    0x4F1: new Z80_opcode_functions(Z80_opcode_matrix[0xF1], // FD F1
        function(regs, pins) { //
    }),
    0x4F2: new Z80_opcode_functions(Z80_opcode_matrix[0xF2], // FD F2
        function(regs, pins) { //
    }),
    0x4F3: new Z80_opcode_functions(Z80_opcode_matrix[0xF3], // FD F3
        function(regs, pins) { //DI
    }),
    0x4F4: new Z80_opcode_functions(Z80_opcode_matrix[0xF4], // FD F4
        function(regs, pins) { //
    }),
    0x4F5: new Z80_opcode_functions(Z80_opcode_matrix[0xF5], // FD F5
        function(regs, pins) { //
    }),
    0x4F6: new Z80_opcode_functions(Z80_opcode_matrix[0xF6], // FD F6
        function(regs, pins) { //
    }),
    0x4F7: new Z80_opcode_functions(Z80_opcode_matrix[0xF7], // FD F7
        function(regs, pins) { //
    }),
    0x4F8: new Z80_opcode_functions(Z80_opcode_matrix[0xF8], // FD F8
        function(regs, pins) { //
    }),
    0x4F9: new Z80_opcode_functions(Z80_opcode_matrix[0xF9], // FD F9
        function(regs, pins) { //
    }),
    0x4FA: new Z80_opcode_functions(Z80_opcode_matrix[0xFA], // FD FA
        function(regs, pins) { //regs.F.S === 1
    }),
    0x4FB: new Z80_opcode_functions(Z80_opcode_matrix[0xFB], // FD FB
        function(regs, pins) { //EI
    }),
    0x4FC: new Z80_opcode_functions(Z80_opcode_matrix[0xFC], // FD FC
        function(regs, pins) { //
    }),
    0x4FD: new Z80_opcode_functions(Z80_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x4FE: new Z80_opcode_functions(Z80_opcode_matrix[0xFE], // FD FE
        function(regs, pins) { //
    }),
    0x4FF: new Z80_opcode_functions(Z80_opcode_matrix[0xFF], // FD FF
        function(regs, pins) { //
    }),
    0x500: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x00], // CB DD 00
        function(regs, pins) { //
    }),
    0x501: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x01], // CB DD 01
        function(regs, pins) { //
    }),
    0x502: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x02], // CB DD 02
        function(regs, pins) { //
    }),
    0x503: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x03], // CB DD 03
        function(regs, pins) { //
    }),
    0x504: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x04], // CB DD 04
        function(regs, pins) { //
    }),
    0x505: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x05], // CB DD 05
        function(regs, pins) { //
    }),
    0x506: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x06], // CB DD 06
        function(regs, pins) { //
    }),
    0x507: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x07], // CB DD 07
        function(regs, pins) { //
    }),
    0x508: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x08], // CB DD 08
        function(regs, pins) { //
    }),
    0x509: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x09], // CB DD 09
        function(regs, pins) { //
    }),
    0x50A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0A], // CB DD 0A
        function(regs, pins) { //
    }),
    0x50B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0B], // CB DD 0B
        function(regs, pins) { //
    }),
    0x50C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0C], // CB DD 0C
        function(regs, pins) { //
    }),
    0x50D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0D], // CB DD 0D
        function(regs, pins) { //
    }),
    0x50E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0E], // CB DD 0E
        function(regs, pins) { //
    }),
    0x50F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0F], // CB DD 0F
        function(regs, pins) { //
    }),
    0x510: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x10], // CB DD 10
        function(regs, pins) { //
    }),
    0x511: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x11], // CB DD 11
        function(regs, pins) { //
    }),
    0x512: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x12], // CB DD 12
        function(regs, pins) { //
    }),
    0x513: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x13], // CB DD 13
        function(regs, pins) { //
    }),
    0x514: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x14], // CB DD 14
        function(regs, pins) { //
    }),
    0x515: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x15], // CB DD 15
        function(regs, pins) { //
    }),
    0x516: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x16], // CB DD 16
        function(regs, pins) { //
    }),
    0x517: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x17], // CB DD 17
        function(regs, pins) { //
    }),
    0x518: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x18], // CB DD 18
        function(regs, pins) { //
    }),
    0x519: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x19], // CB DD 19
        function(regs, pins) { //
    }),
    0x51A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1A], // CB DD 1A
        function(regs, pins) { //
    }),
    0x51B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1B], // CB DD 1B
        function(regs, pins) { //
    }),
    0x51C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1C], // CB DD 1C
        function(regs, pins) { //
    }),
    0x51D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1D], // CB DD 1D
        function(regs, pins) { //
    }),
    0x51E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1E], // CB DD 1E
        function(regs, pins) { //
    }),
    0x51F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1F], // CB DD 1F
        function(regs, pins) { //
    }),
    0x520: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x20], // CB DD 20
        function(regs, pins) { //
    }),
    0x521: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x21], // CB DD 21
        function(regs, pins) { //
    }),
    0x522: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x22], // CB DD 22
        function(regs, pins) { //
    }),
    0x523: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x23], // CB DD 23
        function(regs, pins) { //
    }),
    0x524: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x24], // CB DD 24
        function(regs, pins) { //
    }),
    0x525: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x25], // CB DD 25
        function(regs, pins) { //
    }),
    0x526: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x26], // CB DD 26
        function(regs, pins) { //
    }),
    0x527: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x27], // CB DD 27
        function(regs, pins) { //
    }),
    0x528: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x28], // CB DD 28
        function(regs, pins) { //
    }),
    0x529: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x29], // CB DD 29
        function(regs, pins) { //
    }),
    0x52A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2A], // CB DD 2A
        function(regs, pins) { //
    }),
    0x52B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2B], // CB DD 2B
        function(regs, pins) { //
    }),
    0x52C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2C], // CB DD 2C
        function(regs, pins) { //
    }),
    0x52D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2D], // CB DD 2D
        function(regs, pins) { //
    }),
    0x52E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2E], // CB DD 2E
        function(regs, pins) { //
    }),
    0x52F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2F], // CB DD 2F
        function(regs, pins) { //
    }),
    0x530: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x30], // CB DD 30
        function(regs, pins) { //
    }),
    0x531: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x31], // CB DD 31
        function(regs, pins) { //
    }),
    0x532: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x32], // CB DD 32
        function(regs, pins) { //
    }),
    0x533: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x33], // CB DD 33
        function(regs, pins) { //
    }),
    0x534: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x34], // CB DD 34
        function(regs, pins) { //
    }),
    0x535: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x35], // CB DD 35
        function(regs, pins) { //
    }),
    0x536: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x36], // CB DD 36
        function(regs, pins) { //
    }),
    0x537: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x37], // CB DD 37
        function(regs, pins) { //
    }),
    0x538: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x38], // CB DD 38
        function(regs, pins) { //
    }),
    0x539: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x39], // CB DD 39
        function(regs, pins) { //
    }),
    0x53A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3A], // CB DD 3A
        function(regs, pins) { //
    }),
    0x53B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3B], // CB DD 3B
        function(regs, pins) { //
    }),
    0x53C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3C], // CB DD 3C
        function(regs, pins) { //
    }),
    0x53D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3D], // CB DD 3D
        function(regs, pins) { //
    }),
    0x53E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3E], // CB DD 3E
        function(regs, pins) { //
    }),
    0x53F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3F], // CB DD 3F
        function(regs, pins) { //
    }),
    0x540: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x40], // CB DD 40
        function(regs, pins) { //
    }),
    0x541: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x41], // CB DD 41
        function(regs, pins) { //
    }),
    0x542: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x42], // CB DD 42
        function(regs, pins) { //
    }),
    0x543: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x43], // CB DD 43
        function(regs, pins) { //
    }),
    0x544: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x44], // CB DD 44
        function(regs, pins) { //
    }),
    0x545: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x45], // CB DD 45
        function(regs, pins) { //
    }),
    0x546: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x46], // CB DD 46
        function(regs, pins) { //
    }),
    0x547: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x47], // CB DD 47
        function(regs, pins) { //
    }),
    0x548: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x48], // CB DD 48
        function(regs, pins) { //
    }),
    0x549: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x49], // CB DD 49
        function(regs, pins) { //
    }),
    0x54A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4A], // CB DD 4A
        function(regs, pins) { //
    }),
    0x54B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4B], // CB DD 4B
        function(regs, pins) { //
    }),
    0x54C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4C], // CB DD 4C
        function(regs, pins) { //
    }),
    0x54D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4D], // CB DD 4D
        function(regs, pins) { //
    }),
    0x54E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4E], // CB DD 4E
        function(regs, pins) { //
    }),
    0x54F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4F], // CB DD 4F
        function(regs, pins) { //
    }),
    0x550: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x50], // CB DD 50
        function(regs, pins) { //
    }),
    0x551: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x51], // CB DD 51
        function(regs, pins) { //
    }),
    0x552: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x52], // CB DD 52
        function(regs, pins) { //
    }),
    0x553: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x53], // CB DD 53
        function(regs, pins) { //
    }),
    0x554: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x54], // CB DD 54
        function(regs, pins) { //
    }),
    0x555: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x55], // CB DD 55
        function(regs, pins) { //
    }),
    0x556: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x56], // CB DD 56
        function(regs, pins) { //
    }),
    0x557: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x57], // CB DD 57
        function(regs, pins) { //
    }),
    0x558: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x58], // CB DD 58
        function(regs, pins) { //
    }),
    0x559: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x59], // CB DD 59
        function(regs, pins) { //
    }),
    0x55A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5A], // CB DD 5A
        function(regs, pins) { //
    }),
    0x55B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5B], // CB DD 5B
        function(regs, pins) { //
    }),
    0x55C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5C], // CB DD 5C
        function(regs, pins) { //
    }),
    0x55D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5D], // CB DD 5D
        function(regs, pins) { //
    }),
    0x55E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5E], // CB DD 5E
        function(regs, pins) { //
    }),
    0x55F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5F], // CB DD 5F
        function(regs, pins) { //
    }),
    0x560: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x60], // CB DD 60
        function(regs, pins) { //
    }),
    0x561: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x61], // CB DD 61
        function(regs, pins) { //
    }),
    0x562: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x62], // CB DD 62
        function(regs, pins) { //
    }),
    0x563: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x63], // CB DD 63
        function(regs, pins) { //
    }),
    0x564: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x64], // CB DD 64
        function(regs, pins) { //
    }),
    0x565: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x65], // CB DD 65
        function(regs, pins) { //
    }),
    0x566: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x66], // CB DD 66
        function(regs, pins) { //
    }),
    0x567: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x67], // CB DD 67
        function(regs, pins) { //
    }),
    0x568: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x68], // CB DD 68
        function(regs, pins) { //
    }),
    0x569: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x69], // CB DD 69
        function(regs, pins) { //
    }),
    0x56A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6A], // CB DD 6A
        function(regs, pins) { //
    }),
    0x56B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6B], // CB DD 6B
        function(regs, pins) { //
    }),
    0x56C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6C], // CB DD 6C
        function(regs, pins) { //
    }),
    0x56D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6D], // CB DD 6D
        function(regs, pins) { //
    }),
    0x56E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6E], // CB DD 6E
        function(regs, pins) { //
    }),
    0x56F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6F], // CB DD 6F
        function(regs, pins) { //
    }),
    0x570: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x70], // CB DD 70
        function(regs, pins) { //
    }),
    0x571: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x71], // CB DD 71
        function(regs, pins) { //
    }),
    0x572: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x72], // CB DD 72
        function(regs, pins) { //
    }),
    0x573: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x73], // CB DD 73
        function(regs, pins) { //
    }),
    0x574: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x74], // CB DD 74
        function(regs, pins) { //
    }),
    0x575: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x75], // CB DD 75
        function(regs, pins) { //
    }),
    0x576: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x76], // CB DD 76
        function(regs, pins) { //
    }),
    0x577: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x77], // CB DD 77
        function(regs, pins) { //
    }),
    0x578: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x78], // CB DD 78
        function(regs, pins) { //
    }),
    0x579: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x79], // CB DD 79
        function(regs, pins) { //
    }),
    0x57A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7A], // CB DD 7A
        function(regs, pins) { //
    }),
    0x57B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7B], // CB DD 7B
        function(regs, pins) { //
    }),
    0x57C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7C], // CB DD 7C
        function(regs, pins) { //
    }),
    0x57D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7D], // CB DD 7D
        function(regs, pins) { //
    }),
    0x57E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7E], // CB DD 7E
        function(regs, pins) { //
    }),
    0x57F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7F], // CB DD 7F
        function(regs, pins) { //
    }),
    0x580: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x80], // CB DD 80
        function(regs, pins) { //
    }),
    0x581: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x81], // CB DD 81
        function(regs, pins) { //
    }),
    0x582: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x82], // CB DD 82
        function(regs, pins) { //
    }),
    0x583: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x83], // CB DD 83
        function(regs, pins) { //
    }),
    0x584: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x84], // CB DD 84
        function(regs, pins) { //
    }),
    0x585: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x85], // CB DD 85
        function(regs, pins) { //
    }),
    0x586: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x86], // CB DD 86
        function(regs, pins) { //
    }),
    0x587: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x87], // CB DD 87
        function(regs, pins) { //
    }),
    0x588: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x88], // CB DD 88
        function(regs, pins) { //
    }),
    0x589: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x89], // CB DD 89
        function(regs, pins) { //
    }),
    0x58A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8A], // CB DD 8A
        function(regs, pins) { //
    }),
    0x58B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8B], // CB DD 8B
        function(regs, pins) { //
    }),
    0x58C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8C], // CB DD 8C
        function(regs, pins) { //
    }),
    0x58D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8D], // CB DD 8D
        function(regs, pins) { //
    }),
    0x58E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8E], // CB DD 8E
        function(regs, pins) { //
    }),
    0x58F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8F], // CB DD 8F
        function(regs, pins) { //
    }),
    0x590: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x90], // CB DD 90
        function(regs, pins) { //
    }),
    0x591: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x91], // CB DD 91
        function(regs, pins) { //
    }),
    0x592: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x92], // CB DD 92
        function(regs, pins) { //
    }),
    0x593: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x93], // CB DD 93
        function(regs, pins) { //
    }),
    0x594: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x94], // CB DD 94
        function(regs, pins) { //
    }),
    0x595: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x95], // CB DD 95
        function(regs, pins) { //
    }),
    0x596: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x96], // CB DD 96
        function(regs, pins) { //
    }),
    0x597: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x97], // CB DD 97
        function(regs, pins) { //
    }),
    0x598: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x98], // CB DD 98
        function(regs, pins) { //
    }),
    0x599: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x99], // CB DD 99
        function(regs, pins) { //
    }),
    0x59A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9A], // CB DD 9A
        function(regs, pins) { //
    }),
    0x59B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9B], // CB DD 9B
        function(regs, pins) { //
    }),
    0x59C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9C], // CB DD 9C
        function(regs, pins) { //
    }),
    0x59D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9D], // CB DD 9D
        function(regs, pins) { //
    }),
    0x59E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9E], // CB DD 9E
        function(regs, pins) { //
    }),
    0x59F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9F], // CB DD 9F
        function(regs, pins) { //
    }),
    0x5A0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA0], // CB DD A0
        function(regs, pins) { //
    }),
    0x5A1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA1], // CB DD A1
        function(regs, pins) { //
    }),
    0x5A2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA2], // CB DD A2
        function(regs, pins) { //
    }),
    0x5A3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA3], // CB DD A3
        function(regs, pins) { //
    }),
    0x5A4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA4], // CB DD A4
        function(regs, pins) { //
    }),
    0x5A5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA5], // CB DD A5
        function(regs, pins) { //
    }),
    0x5A6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA6], // CB DD A6
        function(regs, pins) { //
    }),
    0x5A7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA7], // CB DD A7
        function(regs, pins) { //
    }),
    0x5A8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA8], // CB DD A8
        function(regs, pins) { //
    }),
    0x5A9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA9], // CB DD A9
        function(regs, pins) { //
    }),
    0x5AA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAA], // CB DD AA
        function(regs, pins) { //
    }),
    0x5AB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAB], // CB DD AB
        function(regs, pins) { //
    }),
    0x5AC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAC], // CB DD AC
        function(regs, pins) { //
    }),
    0x5AD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAD], // CB DD AD
        function(regs, pins) { //
    }),
    0x5AE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAE], // CB DD AE
        function(regs, pins) { //
    }),
    0x5AF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAF], // CB DD AF
        function(regs, pins) { //
    }),
    0x5B0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB0], // CB DD B0
        function(regs, pins) { //
    }),
    0x5B1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB1], // CB DD B1
        function(regs, pins) { //
    }),
    0x5B2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB2], // CB DD B2
        function(regs, pins) { //
    }),
    0x5B3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB3], // CB DD B3
        function(regs, pins) { //
    }),
    0x5B4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB4], // CB DD B4
        function(regs, pins) { //
    }),
    0x5B5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB5], // CB DD B5
        function(regs, pins) { //
    }),
    0x5B6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB6], // CB DD B6
        function(regs, pins) { //
    }),
    0x5B7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB7], // CB DD B7
        function(regs, pins) { //
    }),
    0x5B8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB8], // CB DD B8
        function(regs, pins) { //
    }),
    0x5B9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB9], // CB DD B9
        function(regs, pins) { //
    }),
    0x5BA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBA], // CB DD BA
        function(regs, pins) { //
    }),
    0x5BB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBB], // CB DD BB
        function(regs, pins) { //
    }),
    0x5BC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBC], // CB DD BC
        function(regs, pins) { //
    }),
    0x5BD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBD], // CB DD BD
        function(regs, pins) { //
    }),
    0x5BE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBE], // CB DD BE
        function(regs, pins) { //
    }),
    0x5BF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBF], // CB DD BF
        function(regs, pins) { //
    }),
    0x5C0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC0], // CB DD C0
        function(regs, pins) { //
    }),
    0x5C1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC1], // CB DD C1
        function(regs, pins) { //
    }),
    0x5C2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC2], // CB DD C2
        function(regs, pins) { //
    }),
    0x5C3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC3], // CB DD C3
        function(regs, pins) { //
    }),
    0x5C4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC4], // CB DD C4
        function(regs, pins) { //
    }),
    0x5C5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC5], // CB DD C5
        function(regs, pins) { //
    }),
    0x5C6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC6], // CB DD C6
        function(regs, pins) { //
    }),
    0x5C7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC7], // CB DD C7
        function(regs, pins) { //
    }),
    0x5C8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC8], // CB DD C8
        function(regs, pins) { //
    }),
    0x5C9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC9], // CB DD C9
        function(regs, pins) { //
    }),
    0x5CA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCA], // CB DD CA
        function(regs, pins) { //
    }),
    0x5CB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCB], // CB DD CB
        function(regs, pins) { //
    }),
    0x5CC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCC], // CB DD CC
        function(regs, pins) { //
    }),
    0x5CD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCD], // CB DD CD
        function(regs, pins) { //
    }),
    0x5CE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCE], // CB DD CE
        function(regs, pins) { //
    }),
    0x5CF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCF], // CB DD CF
        function(regs, pins) { //
    }),
    0x5D0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD0], // CB DD D0
        function(regs, pins) { //
    }),
    0x5D1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD1], // CB DD D1
        function(regs, pins) { //
    }),
    0x5D2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD2], // CB DD D2
        function(regs, pins) { //
    }),
    0x5D3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD3], // CB DD D3
        function(regs, pins) { //
    }),
    0x5D4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD4], // CB DD D4
        function(regs, pins) { //
    }),
    0x5D5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD5], // CB DD D5
        function(regs, pins) { //
    }),
    0x5D6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD6], // CB DD D6
        function(regs, pins) { //
    }),
    0x5D7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD7], // CB DD D7
        function(regs, pins) { //
    }),
    0x5D8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD8], // CB DD D8
        function(regs, pins) { //
    }),
    0x5D9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD9], // CB DD D9
        function(regs, pins) { //
    }),
    0x5DA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDA], // CB DD DA
        function(regs, pins) { //
    }),
    0x5DB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDB], // CB DD DB
        function(regs, pins) { //
    }),
    0x5DC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDC], // CB DD DC
        function(regs, pins) { //
    }),
    0x5DD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDD], // CB DD DD
        function(regs, pins) { //
    }),
    0x5DE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDE], // CB DD DE
        function(regs, pins) { //
    }),
    0x5DF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDF], // CB DD DF
        function(regs, pins) { //
    }),
    0x5E0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE0], // CB DD E0
        function(regs, pins) { //
    }),
    0x5E1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE1], // CB DD E1
        function(regs, pins) { //
    }),
    0x5E2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE2], // CB DD E2
        function(regs, pins) { //
    }),
    0x5E3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE3], // CB DD E3
        function(regs, pins) { //
    }),
    0x5E4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE4], // CB DD E4
        function(regs, pins) { //
    }),
    0x5E5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE5], // CB DD E5
        function(regs, pins) { //
    }),
    0x5E6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE6], // CB DD E6
        function(regs, pins) { //
    }),
    0x5E7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE7], // CB DD E7
        function(regs, pins) { //
    }),
    0x5E8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE8], // CB DD E8
        function(regs, pins) { //
    }),
    0x5E9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE9], // CB DD E9
        function(regs, pins) { //
    }),
    0x5EA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEA], // CB DD EA
        function(regs, pins) { //
    }),
    0x5EB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEB], // CB DD EB
        function(regs, pins) { //
    }),
    0x5EC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEC], // CB DD EC
        function(regs, pins) { //
    }),
    0x5ED: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xED], // CB DD ED
        function(regs, pins) { //
    }),
    0x5EE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEE], // CB DD EE
        function(regs, pins) { //
    }),
    0x5EF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEF], // CB DD EF
        function(regs, pins) { //
    }),
    0x5F0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF0], // CB DD F0
        function(regs, pins) { //
    }),
    0x5F1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF1], // CB DD F1
        function(regs, pins) { //
    }),
    0x5F2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF2], // CB DD F2
        function(regs, pins) { //
    }),
    0x5F3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF3], // CB DD F3
        function(regs, pins) { //
    }),
    0x5F4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF4], // CB DD F4
        function(regs, pins) { //
    }),
    0x5F5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF5], // CB DD F5
        function(regs, pins) { //
    }),
    0x5F6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF6], // CB DD F6
        function(regs, pins) { //
    }),
    0x5F7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF7], // CB DD F7
        function(regs, pins) { //
    }),
    0x5F8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF8], // CB DD F8
        function(regs, pins) { //
    }),
    0x5F9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF9], // CB DD F9
        function(regs, pins) { //
    }),
    0x5FA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFA], // CB DD FA
        function(regs, pins) { //
    }),
    0x5FB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFB], // CB DD FB
        function(regs, pins) { //
    }),
    0x5FC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFC], // CB DD FC
        function(regs, pins) { //
    }),
    0x5FD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFD], // CB DD FD
        function(regs, pins) { //
    }),
    0x5FE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFE], // CB DD FE
        function(regs, pins) { //
    }),
    0x5FF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFF], // CB DD FF
        function(regs, pins) { //
    }),
    0x600: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x00], // CB FD 00
        function(regs, pins) { //
    }),
    0x601: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x01], // CB FD 01
        function(regs, pins) { //
    }),
    0x602: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x02], // CB FD 02
        function(regs, pins) { //
    }),
    0x603: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x03], // CB FD 03
        function(regs, pins) { //
    }),
    0x604: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x04], // CB FD 04
        function(regs, pins) { //
    }),
    0x605: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x05], // CB FD 05
        function(regs, pins) { //
    }),
    0x606: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x06], // CB FD 06
        function(regs, pins) { //
    }),
    0x607: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x07], // CB FD 07
        function(regs, pins) { //
    }),
    0x608: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x08], // CB FD 08
        function(regs, pins) { //
    }),
    0x609: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x09], // CB FD 09
        function(regs, pins) { //
    }),
    0x60A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0A], // CB FD 0A
        function(regs, pins) { //
    }),
    0x60B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0B], // CB FD 0B
        function(regs, pins) { //
    }),
    0x60C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0C], // CB FD 0C
        function(regs, pins) { //
    }),
    0x60D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0D], // CB FD 0D
        function(regs, pins) { //
    }),
    0x60E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0E], // CB FD 0E
        function(regs, pins) { //
    }),
    0x60F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x0F], // CB FD 0F
        function(regs, pins) { //
    }),
    0x610: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x10], // CB FD 10
        function(regs, pins) { //
    }),
    0x611: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x11], // CB FD 11
        function(regs, pins) { //
    }),
    0x612: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x12], // CB FD 12
        function(regs, pins) { //
    }),
    0x613: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x13], // CB FD 13
        function(regs, pins) { //
    }),
    0x614: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x14], // CB FD 14
        function(regs, pins) { //
    }),
    0x615: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x15], // CB FD 15
        function(regs, pins) { //
    }),
    0x616: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x16], // CB FD 16
        function(regs, pins) { //
    }),
    0x617: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x17], // CB FD 17
        function(regs, pins) { //
    }),
    0x618: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x18], // CB FD 18
        function(regs, pins) { //
    }),
    0x619: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x19], // CB FD 19
        function(regs, pins) { //
    }),
    0x61A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1A], // CB FD 1A
        function(regs, pins) { //
    }),
    0x61B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1B], // CB FD 1B
        function(regs, pins) { //
    }),
    0x61C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1C], // CB FD 1C
        function(regs, pins) { //
    }),
    0x61D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1D], // CB FD 1D
        function(regs, pins) { //
    }),
    0x61E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1E], // CB FD 1E
        function(regs, pins) { //
    }),
    0x61F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x1F], // CB FD 1F
        function(regs, pins) { //
    }),
    0x620: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x20], // CB FD 20
        function(regs, pins) { //
    }),
    0x621: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x21], // CB FD 21
        function(regs, pins) { //
    }),
    0x622: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x22], // CB FD 22
        function(regs, pins) { //
    }),
    0x623: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x23], // CB FD 23
        function(regs, pins) { //
    }),
    0x624: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x24], // CB FD 24
        function(regs, pins) { //
    }),
    0x625: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x25], // CB FD 25
        function(regs, pins) { //
    }),
    0x626: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x26], // CB FD 26
        function(regs, pins) { //
    }),
    0x627: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x27], // CB FD 27
        function(regs, pins) { //
    }),
    0x628: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x28], // CB FD 28
        function(regs, pins) { //
    }),
    0x629: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x29], // CB FD 29
        function(regs, pins) { //
    }),
    0x62A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2A], // CB FD 2A
        function(regs, pins) { //
    }),
    0x62B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2B], // CB FD 2B
        function(regs, pins) { //
    }),
    0x62C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2C], // CB FD 2C
        function(regs, pins) { //
    }),
    0x62D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2D], // CB FD 2D
        function(regs, pins) { //
    }),
    0x62E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2E], // CB FD 2E
        function(regs, pins) { //
    }),
    0x62F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x2F], // CB FD 2F
        function(regs, pins) { //
    }),
    0x630: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x30], // CB FD 30
        function(regs, pins) { //
    }),
    0x631: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x31], // CB FD 31
        function(regs, pins) { //
    }),
    0x632: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x32], // CB FD 32
        function(regs, pins) { //
    }),
    0x633: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x33], // CB FD 33
        function(regs, pins) { //
    }),
    0x634: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x34], // CB FD 34
        function(regs, pins) { //
    }),
    0x635: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x35], // CB FD 35
        function(regs, pins) { //
    }),
    0x636: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x36], // CB FD 36
        function(regs, pins) { //
    }),
    0x637: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x37], // CB FD 37
        function(regs, pins) { //
    }),
    0x638: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x38], // CB FD 38
        function(regs, pins) { //
    }),
    0x639: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x39], // CB FD 39
        function(regs, pins) { //
    }),
    0x63A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3A], // CB FD 3A
        function(regs, pins) { //
    }),
    0x63B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3B], // CB FD 3B
        function(regs, pins) { //
    }),
    0x63C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3C], // CB FD 3C
        function(regs, pins) { //
    }),
    0x63D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3D], // CB FD 3D
        function(regs, pins) { //
    }),
    0x63E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3E], // CB FD 3E
        function(regs, pins) { //
    }),
    0x63F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x3F], // CB FD 3F
        function(regs, pins) { //
    }),
    0x640: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x40], // CB FD 40
        function(regs, pins) { //
    }),
    0x641: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x41], // CB FD 41
        function(regs, pins) { //
    }),
    0x642: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x42], // CB FD 42
        function(regs, pins) { //
    }),
    0x643: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x43], // CB FD 43
        function(regs, pins) { //
    }),
    0x644: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x44], // CB FD 44
        function(regs, pins) { //
    }),
    0x645: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x45], // CB FD 45
        function(regs, pins) { //
    }),
    0x646: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x46], // CB FD 46
        function(regs, pins) { //
    }),
    0x647: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x47], // CB FD 47
        function(regs, pins) { //
    }),
    0x648: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x48], // CB FD 48
        function(regs, pins) { //
    }),
    0x649: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x49], // CB FD 49
        function(regs, pins) { //
    }),
    0x64A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4A], // CB FD 4A
        function(regs, pins) { //
    }),
    0x64B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4B], // CB FD 4B
        function(regs, pins) { //
    }),
    0x64C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4C], // CB FD 4C
        function(regs, pins) { //
    }),
    0x64D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4D], // CB FD 4D
        function(regs, pins) { //
    }),
    0x64E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4E], // CB FD 4E
        function(regs, pins) { //
    }),
    0x64F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x4F], // CB FD 4F
        function(regs, pins) { //
    }),
    0x650: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x50], // CB FD 50
        function(regs, pins) { //
    }),
    0x651: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x51], // CB FD 51
        function(regs, pins) { //
    }),
    0x652: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x52], // CB FD 52
        function(regs, pins) { //
    }),
    0x653: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x53], // CB FD 53
        function(regs, pins) { //
    }),
    0x654: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x54], // CB FD 54
        function(regs, pins) { //
    }),
    0x655: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x55], // CB FD 55
        function(regs, pins) { //
    }),
    0x656: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x56], // CB FD 56
        function(regs, pins) { //
    }),
    0x657: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x57], // CB FD 57
        function(regs, pins) { //
    }),
    0x658: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x58], // CB FD 58
        function(regs, pins) { //
    }),
    0x659: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x59], // CB FD 59
        function(regs, pins) { //
    }),
    0x65A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5A], // CB FD 5A
        function(regs, pins) { //
    }),
    0x65B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5B], // CB FD 5B
        function(regs, pins) { //
    }),
    0x65C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5C], // CB FD 5C
        function(regs, pins) { //
    }),
    0x65D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5D], // CB FD 5D
        function(regs, pins) { //
    }),
    0x65E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5E], // CB FD 5E
        function(regs, pins) { //
    }),
    0x65F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x5F], // CB FD 5F
        function(regs, pins) { //
    }),
    0x660: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x60], // CB FD 60
        function(regs, pins) { //
    }),
    0x661: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x61], // CB FD 61
        function(regs, pins) { //
    }),
    0x662: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x62], // CB FD 62
        function(regs, pins) { //
    }),
    0x663: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x63], // CB FD 63
        function(regs, pins) { //
    }),
    0x664: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x64], // CB FD 64
        function(regs, pins) { //
    }),
    0x665: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x65], // CB FD 65
        function(regs, pins) { //
    }),
    0x666: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x66], // CB FD 66
        function(regs, pins) { //
    }),
    0x667: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x67], // CB FD 67
        function(regs, pins) { //
    }),
    0x668: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x68], // CB FD 68
        function(regs, pins) { //
    }),
    0x669: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x69], // CB FD 69
        function(regs, pins) { //
    }),
    0x66A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6A], // CB FD 6A
        function(regs, pins) { //
    }),
    0x66B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6B], // CB FD 6B
        function(regs, pins) { //
    }),
    0x66C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6C], // CB FD 6C
        function(regs, pins) { //
    }),
    0x66D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6D], // CB FD 6D
        function(regs, pins) { //
    }),
    0x66E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6E], // CB FD 6E
        function(regs, pins) { //
    }),
    0x66F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x6F], // CB FD 6F
        function(regs, pins) { //
    }),
    0x670: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x70], // CB FD 70
        function(regs, pins) { //
    }),
    0x671: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x71], // CB FD 71
        function(regs, pins) { //
    }),
    0x672: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x72], // CB FD 72
        function(regs, pins) { //
    }),
    0x673: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x73], // CB FD 73
        function(regs, pins) { //
    }),
    0x674: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x74], // CB FD 74
        function(regs, pins) { //
    }),
    0x675: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x75], // CB FD 75
        function(regs, pins) { //
    }),
    0x676: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x76], // CB FD 76
        function(regs, pins) { //
    }),
    0x677: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x77], // CB FD 77
        function(regs, pins) { //
    }),
    0x678: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x78], // CB FD 78
        function(regs, pins) { //
    }),
    0x679: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x79], // CB FD 79
        function(regs, pins) { //
    }),
    0x67A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7A], // CB FD 7A
        function(regs, pins) { //
    }),
    0x67B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7B], // CB FD 7B
        function(regs, pins) { //
    }),
    0x67C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7C], // CB FD 7C
        function(regs, pins) { //
    }),
    0x67D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7D], // CB FD 7D
        function(regs, pins) { //
    }),
    0x67E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7E], // CB FD 7E
        function(regs, pins) { //
    }),
    0x67F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x7F], // CB FD 7F
        function(regs, pins) { //
    }),
    0x680: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x80], // CB FD 80
        function(regs, pins) { //
    }),
    0x681: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x81], // CB FD 81
        function(regs, pins) { //
    }),
    0x682: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x82], // CB FD 82
        function(regs, pins) { //
    }),
    0x683: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x83], // CB FD 83
        function(regs, pins) { //
    }),
    0x684: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x84], // CB FD 84
        function(regs, pins) { //
    }),
    0x685: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x85], // CB FD 85
        function(regs, pins) { //
    }),
    0x686: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x86], // CB FD 86
        function(regs, pins) { //
    }),
    0x687: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x87], // CB FD 87
        function(regs, pins) { //
    }),
    0x688: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x88], // CB FD 88
        function(regs, pins) { //
    }),
    0x689: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x89], // CB FD 89
        function(regs, pins) { //
    }),
    0x68A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8A], // CB FD 8A
        function(regs, pins) { //
    }),
    0x68B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8B], // CB FD 8B
        function(regs, pins) { //
    }),
    0x68C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8C], // CB FD 8C
        function(regs, pins) { //
    }),
    0x68D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8D], // CB FD 8D
        function(regs, pins) { //
    }),
    0x68E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8E], // CB FD 8E
        function(regs, pins) { //
    }),
    0x68F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x8F], // CB FD 8F
        function(regs, pins) { //
    }),
    0x690: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x90], // CB FD 90
        function(regs, pins) { //
    }),
    0x691: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x91], // CB FD 91
        function(regs, pins) { //
    }),
    0x692: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x92], // CB FD 92
        function(regs, pins) { //
    }),
    0x693: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x93], // CB FD 93
        function(regs, pins) { //
    }),
    0x694: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x94], // CB FD 94
        function(regs, pins) { //
    }),
    0x695: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x95], // CB FD 95
        function(regs, pins) { //
    }),
    0x696: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x96], // CB FD 96
        function(regs, pins) { //
    }),
    0x697: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x97], // CB FD 97
        function(regs, pins) { //
    }),
    0x698: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x98], // CB FD 98
        function(regs, pins) { //
    }),
    0x699: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x99], // CB FD 99
        function(regs, pins) { //
    }),
    0x69A: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9A], // CB FD 9A
        function(regs, pins) { //
    }),
    0x69B: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9B], // CB FD 9B
        function(regs, pins) { //
    }),
    0x69C: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9C], // CB FD 9C
        function(regs, pins) { //
    }),
    0x69D: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9D], // CB FD 9D
        function(regs, pins) { //
    }),
    0x69E: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9E], // CB FD 9E
        function(regs, pins) { //
    }),
    0x69F: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0x9F], // CB FD 9F
        function(regs, pins) { //
    }),
    0x6A0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA0], // CB FD A0
        function(regs, pins) { //
    }),
    0x6A1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA1], // CB FD A1
        function(regs, pins) { //
    }),
    0x6A2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA2], // CB FD A2
        function(regs, pins) { //
    }),
    0x6A3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA3], // CB FD A3
        function(regs, pins) { //
    }),
    0x6A4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA4], // CB FD A4
        function(regs, pins) { //
    }),
    0x6A5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA5], // CB FD A5
        function(regs, pins) { //
    }),
    0x6A6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA6], // CB FD A6
        function(regs, pins) { //
    }),
    0x6A7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA7], // CB FD A7
        function(regs, pins) { //
    }),
    0x6A8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA8], // CB FD A8
        function(regs, pins) { //
    }),
    0x6A9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xA9], // CB FD A9
        function(regs, pins) { //
    }),
    0x6AA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAA], // CB FD AA
        function(regs, pins) { //
    }),
    0x6AB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAB], // CB FD AB
        function(regs, pins) { //
    }),
    0x6AC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAC], // CB FD AC
        function(regs, pins) { //
    }),
    0x6AD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAD], // CB FD AD
        function(regs, pins) { //
    }),
    0x6AE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAE], // CB FD AE
        function(regs, pins) { //
    }),
    0x6AF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xAF], // CB FD AF
        function(regs, pins) { //
    }),
    0x6B0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB0], // CB FD B0
        function(regs, pins) { //
    }),
    0x6B1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB1], // CB FD B1
        function(regs, pins) { //
    }),
    0x6B2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB2], // CB FD B2
        function(regs, pins) { //
    }),
    0x6B3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB3], // CB FD B3
        function(regs, pins) { //
    }),
    0x6B4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB4], // CB FD B4
        function(regs, pins) { //
    }),
    0x6B5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB5], // CB FD B5
        function(regs, pins) { //
    }),
    0x6B6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB6], // CB FD B6
        function(regs, pins) { //
    }),
    0x6B7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB7], // CB FD B7
        function(regs, pins) { //
    }),
    0x6B8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB8], // CB FD B8
        function(regs, pins) { //
    }),
    0x6B9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xB9], // CB FD B9
        function(regs, pins) { //
    }),
    0x6BA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBA], // CB FD BA
        function(regs, pins) { //
    }),
    0x6BB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBB], // CB FD BB
        function(regs, pins) { //
    }),
    0x6BC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBC], // CB FD BC
        function(regs, pins) { //
    }),
    0x6BD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBD], // CB FD BD
        function(regs, pins) { //
    }),
    0x6BE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBE], // CB FD BE
        function(regs, pins) { //
    }),
    0x6BF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xBF], // CB FD BF
        function(regs, pins) { //
    }),
    0x6C0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC0], // CB FD C0
        function(regs, pins) { //
    }),
    0x6C1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC1], // CB FD C1
        function(regs, pins) { //
    }),
    0x6C2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC2], // CB FD C2
        function(regs, pins) { //
    }),
    0x6C3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC3], // CB FD C3
        function(regs, pins) { //
    }),
    0x6C4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC4], // CB FD C4
        function(regs, pins) { //
    }),
    0x6C5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC5], // CB FD C5
        function(regs, pins) { //
    }),
    0x6C6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC6], // CB FD C6
        function(regs, pins) { //
    }),
    0x6C7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC7], // CB FD C7
        function(regs, pins) { //
    }),
    0x6C8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC8], // CB FD C8
        function(regs, pins) { //
    }),
    0x6C9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xC9], // CB FD C9
        function(regs, pins) { //
    }),
    0x6CA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCA], // CB FD CA
        function(regs, pins) { //
    }),
    0x6CB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCB], // CB FD CB
        function(regs, pins) { //
    }),
    0x6CC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCC], // CB FD CC
        function(regs, pins) { //
    }),
    0x6CD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCD], // CB FD CD
        function(regs, pins) { //
    }),
    0x6CE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCE], // CB FD CE
        function(regs, pins) { //
    }),
    0x6CF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xCF], // CB FD CF
        function(regs, pins) { //
    }),
    0x6D0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD0], // CB FD D0
        function(regs, pins) { //
    }),
    0x6D1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD1], // CB FD D1
        function(regs, pins) { //
    }),
    0x6D2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD2], // CB FD D2
        function(regs, pins) { //
    }),
    0x6D3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD3], // CB FD D3
        function(regs, pins) { //
    }),
    0x6D4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD4], // CB FD D4
        function(regs, pins) { //
    }),
    0x6D5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD5], // CB FD D5
        function(regs, pins) { //
    }),
    0x6D6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD6], // CB FD D6
        function(regs, pins) { //
    }),
    0x6D7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD7], // CB FD D7
        function(regs, pins) { //
    }),
    0x6D8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD8], // CB FD D8
        function(regs, pins) { //
    }),
    0x6D9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xD9], // CB FD D9
        function(regs, pins) { //
    }),
    0x6DA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDA], // CB FD DA
        function(regs, pins) { //
    }),
    0x6DB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDB], // CB FD DB
        function(regs, pins) { //
    }),
    0x6DC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDC], // CB FD DC
        function(regs, pins) { //
    }),
    0x6DD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDD], // CB FD DD
        function(regs, pins) { //
    }),
    0x6DE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDE], // CB FD DE
        function(regs, pins) { //
    }),
    0x6DF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xDF], // CB FD DF
        function(regs, pins) { //
    }),
    0x6E0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE0], // CB FD E0
        function(regs, pins) { //
    }),
    0x6E1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE1], // CB FD E1
        function(regs, pins) { //
    }),
    0x6E2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE2], // CB FD E2
        function(regs, pins) { //
    }),
    0x6E3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE3], // CB FD E3
        function(regs, pins) { //
    }),
    0x6E4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE4], // CB FD E4
        function(regs, pins) { //
    }),
    0x6E5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE5], // CB FD E5
        function(regs, pins) { //
    }),
    0x6E6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE6], // CB FD E6
        function(regs, pins) { //
    }),
    0x6E7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE7], // CB FD E7
        function(regs, pins) { //
    }),
    0x6E8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE8], // CB FD E8
        function(regs, pins) { //
    }),
    0x6E9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xE9], // CB FD E9
        function(regs, pins) { //
    }),
    0x6EA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEA], // CB FD EA
        function(regs, pins) { //
    }),
    0x6EB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEB], // CB FD EB
        function(regs, pins) { //
    }),
    0x6EC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEC], // CB FD EC
        function(regs, pins) { //
    }),
    0x6ED: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xED], // CB FD ED
        function(regs, pins) { //
    }),
    0x6EE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEE], // CB FD EE
        function(regs, pins) { //
    }),
    0x6EF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xEF], // CB FD EF
        function(regs, pins) { //
    }),
    0x6F0: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF0], // CB FD F0
        function(regs, pins) { //
    }),
    0x6F1: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF1], // CB FD F1
        function(regs, pins) { //
    }),
    0x6F2: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF2], // CB FD F2
        function(regs, pins) { //
    }),
    0x6F3: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF3], // CB FD F3
        function(regs, pins) { //
    }),
    0x6F4: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF4], // CB FD F4
        function(regs, pins) { //
    }),
    0x6F5: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF5], // CB FD F5
        function(regs, pins) { //
    }),
    0x6F6: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF6], // CB FD F6
        function(regs, pins) { //
    }),
    0x6F7: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF7], // CB FD F7
        function(regs, pins) { //
    }),
    0x6F8: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF8], // CB FD F8
        function(regs, pins) { //
    }),
    0x6F9: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xF9], // CB FD F9
        function(regs, pins) { //
    }),
    0x6FA: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFA], // CB FD FA
        function(regs, pins) { //
    }),
    0x6FB: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFB], // CB FD FB
        function(regs, pins) { //
    }),
    0x6FC: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFC], // CB FD FC
        function(regs, pins) { //
    }),
    0x6FD: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFD], // CB FD FD
        function(regs, pins) { //
    }),
    0x6FE: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFE], // CB FD FE
        function(regs, pins) { //
    }),
    0x6FF: new Z80_opcode_functions(Z80_CBd_opcode_matrix[0xFF], // CB FD FF
        function(regs, pins) { //
    })
});