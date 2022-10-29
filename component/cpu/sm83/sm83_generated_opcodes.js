"use strict";

const sm83_decoded_opcodes = Object.freeze({
    0x00: new SM83_opcode_functions(SM83_opcode_matrix[0x00], // 00
        function(regs, pins) { //NOP
    }),
    0x01: new SM83_opcode_functions(SM83_opcode_matrix[0x01], // 01
        function(regs, pins) { //LD16_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TR = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3: // cleanup_custom
                regs.RR = pins.D;
                regs.TR |= (regs.RR << 8);
                regs.B = (regs.TR & 0xFF00) >>> 8;
                regs.C = regs.TR & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x02: new SM83_opcode_functions(SM83_opcode_matrix[0x02], // 02
        function(regs, pins) { //LD_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.B << 8) | regs.C;
                pins.Addr = (regs.TA);
                pins.D = regs.A;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x03: new SM83_opcode_functions(SM83_opcode_matrix[0x03], // 03
        function(regs, pins) { //INC16_di
        switch(regs.TCU) {
            case 1:
                let a = (regs.B << 8) | regs.C;
                a = (a + 1) & 0xFFFF;
                regs.B = (a & 0xFF00) >>> 8;
                regs.C = a & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x04: new SM83_opcode_functions(SM83_opcode_matrix[0x04], // 04
        function(regs, pins) { //INC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = ((regs.B) + 1) & 0xFF;
                regs.F.H = +(((regs.B) & 0x0F) === 0);
                regs.F.N = 0;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x05: new SM83_opcode_functions(SM83_opcode_matrix[0x05], // 05
        function(regs, pins) { //DEC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = ((regs.B) - 1) & 0xFF;
                regs.F.H = +(((regs.B) & 0x0F) === 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x06: new SM83_opcode_functions(SM83_opcode_matrix[0x06], // 06
        function(regs, pins) { //LD_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 2: // cleanup_custom
                regs.B = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x07: new SM83_opcode_functions(SM83_opcode_matrix[0x07], // 07
        function(regs, pins) { //RLCA
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = ((regs.A << 1) | (regs.A >>> 7)) & 0xFF;
                regs.F.C = regs.A & 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                regs.F.Z = 0;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x08: new SM83_opcode_functions(SM83_opcode_matrix[0x08], // 08
        function(regs, pins) { //LD16_addr_di
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3: // Do write
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                pins.Addr = (regs.TA);
                pins.D = regs.SP & 0xFF;
                pins.RD = 0; pins.WR = 1;
                break;
            case 4: // Do write
                pins.Addr = ((regs.TA + 1) & 0xFFFF);
                pins.D = (regs.SP & 0xFF00) >>> 8;
                // Following is auto-generated code for instruction finish
                break;
            case 5: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x09: new SM83_opcode_functions(SM83_opcode_matrix[0x09], // 09
        function(regs, pins) { //ADD16_di_di
        switch(regs.TCU) {
            case 1: // idle
                let target = (regs.H << 8) | regs.L;
                let source = (regs.B << 8) | regs.C;
                let x = target + source;
                let y = (target & 0xFFF) + (source & 0xFFF);
                regs.H = (x & 0xFF00) >>> 8;
                regs.L = x & 0xFF;
                regs.F.C = +(x > 0xFFFF);
                regs.F.H = +(y > 0x0FFF);
                regs.F.N = 0;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x0A: new SM83_opcode_functions(SM83_opcode_matrix[0x0A], // 0A
        function(regs, pins) { //LD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.B << 8) | regs.C
                pins.Addr = (regs.TA);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x0B: new SM83_opcode_functions(SM83_opcode_matrix[0x0B], // 0B
        function(regs, pins) { //DEC16_di
        switch(regs.TCU) {
            case 1:
                let a = (regs.B << 8) | regs.C;
                a = (a - 1) & 0xFFFF;
                regs.B = (a & 0xFF00) >>> 8;
                regs.C = a & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x0C: new SM83_opcode_functions(SM83_opcode_matrix[0x0C], // 0C
        function(regs, pins) { //INC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = ((regs.C) + 1) & 0xFF;
                regs.F.H = +(((regs.C) & 0x0F) === 0);
                regs.F.N = 0;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x0D: new SM83_opcode_functions(SM83_opcode_matrix[0x0D], // 0D
        function(regs, pins) { //DEC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = ((regs.C) - 1) & 0xFF;
                regs.F.H = +(((regs.C) & 0x0F) === 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x0E: new SM83_opcode_functions(SM83_opcode_matrix[0x0E], // 0E
        function(regs, pins) { //LD_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 2: // cleanup_custom
                regs.C = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x0F: new SM83_opcode_functions(SM83_opcode_matrix[0x0F], // 0F
        function(regs, pins) { //RRCA
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = (((regs.A) << 7) | ((regs.A) >>> 1)) & 0xFF;
                regs.F.C = ((regs.A) & 0x80) >>> 7;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                regs.F.Z = 0;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x10: new SM83_opcode_functions(SM83_opcode_matrix[0x10], // 10
        function(regs, pins) { //STOP
        switch(regs.TCU) {
            case 1:
                if (!regs.stoppable()) {break;}
                regs.STP = 1;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2:
                if (regs.STP) regs.TCU--;
                // Following is auto-generated code for instruction finish
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x11: new SM83_opcode_functions(SM83_opcode_matrix[0x11], // 11
        function(regs, pins) { //LD16_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TR = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3: // cleanup_custom
                regs.RR = pins.D;
                regs.TR |= (regs.RR << 8);
                regs.D = (regs.TR & 0xFF00) >>> 8;
                regs.E = regs.TR & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x12: new SM83_opcode_functions(SM83_opcode_matrix[0x12], // 12
        function(regs, pins) { //LD_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.D << 8) | regs.E;
                pins.Addr = (regs.TA);
                pins.D = regs.A;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x13: new SM83_opcode_functions(SM83_opcode_matrix[0x13], // 13
        function(regs, pins) { //INC16_di
        switch(regs.TCU) {
            case 1:
                let a = (regs.D << 8) | regs.E;
                a = (a + 1) & 0xFFFF;
                regs.D = (a & 0xFF00) >>> 8;
                regs.E = a & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x14: new SM83_opcode_functions(SM83_opcode_matrix[0x14], // 14
        function(regs, pins) { //INC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = ((regs.D) + 1) & 0xFF;
                regs.F.H = +(((regs.D) & 0x0F) === 0);
                regs.F.N = 0;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x15: new SM83_opcode_functions(SM83_opcode_matrix[0x15], // 15
        function(regs, pins) { //DEC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = ((regs.D) - 1) & 0xFF;
                regs.F.H = +(((regs.D) & 0x0F) === 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x16: new SM83_opcode_functions(SM83_opcode_matrix[0x16], // 16
        function(regs, pins) { //LD_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 2: // cleanup_custom
                regs.D = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x17: new SM83_opcode_functions(SM83_opcode_matrix[0x17], // 17
        function(regs, pins) { //RLA
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.A) & 0x80) >>> 7;
                regs.A = (((regs.A) << 1) & 0xFE) | regs.F.C;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                regs.F.Z = 0;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x18: new SM83_opcode_functions(SM83_opcode_matrix[0x18], // 18
        function(regs, pins) { //JR_cond_rel
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                if (!(1)) { regs.TCU += 1; break; } // CHECKHERE
                break;
            case 2:
                regs.TA = pins.D;
                regs.PC = (mksigned8(regs.TA) + regs.PC) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x19: new SM83_opcode_functions(SM83_opcode_matrix[0x19], // 19
        function(regs, pins) { //ADD16_di_di
        switch(regs.TCU) {
            case 1: // idle
                let target = (regs.H << 8) | regs.L;
                let source = (regs.D << 8) | regs.E;
                let x = target + source;
                let y = (target & 0xFFF) + (source & 0xFFF);
                regs.H = (x & 0xFF00) >>> 8;
                regs.L = x & 0xFF;
                regs.F.C = +(x > 0xFFFF);
                regs.F.H = +(y > 0x0FFF);
                regs.F.N = 0;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x1A: new SM83_opcode_functions(SM83_opcode_matrix[0x1A], // 1A
        function(regs, pins) { //LD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.D << 8) | regs.E
                pins.Addr = (regs.TA);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1B: new SM83_opcode_functions(SM83_opcode_matrix[0x1B], // 1B
        function(regs, pins) { //DEC16_di
        switch(regs.TCU) {
            case 1:
                let a = (regs.D << 8) | regs.E;
                a = (a - 1) & 0xFFFF;
                regs.D = (a & 0xFF00) >>> 8;
                regs.E = a & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x1C: new SM83_opcode_functions(SM83_opcode_matrix[0x1C], // 1C
        function(regs, pins) { //INC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = ((regs.E) + 1) & 0xFF;
                regs.F.H = +(((regs.E) & 0x0F) === 0);
                regs.F.N = 0;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1D: new SM83_opcode_functions(SM83_opcode_matrix[0x1D], // 1D
        function(regs, pins) { //DEC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = ((regs.E) - 1) & 0xFF;
                regs.F.H = +(((regs.E) & 0x0F) === 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1E: new SM83_opcode_functions(SM83_opcode_matrix[0x1E], // 1E
        function(regs, pins) { //LD_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 2: // cleanup_custom
                regs.E = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1F: new SM83_opcode_functions(SM83_opcode_matrix[0x1F], // 1F
        function(regs, pins) { //RRA
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.A) & 1;
                regs.A = ((regs.A) >>> 1) | (regs.F.C << 7);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                regs.F.Z = 0;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x20: new SM83_opcode_functions(SM83_opcode_matrix[0x20], // 20
        function(regs, pins) { //JR_cond_rel
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                if (!(regs.F.Z === 0)) { regs.TCU += 1; break; } // CHECKHERE
                break;
            case 2:
                regs.TA = pins.D;
                regs.PC = (mksigned8(regs.TA) + regs.PC) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x21: new SM83_opcode_functions(SM83_opcode_matrix[0x21], // 21
        function(regs, pins) { //LD16_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TR = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3: // cleanup_custom
                regs.RR = pins.D;
                regs.TR |= (regs.RR << 8);
                regs.H = (regs.TR & 0xFF00) >>> 8;
                regs.L = regs.TR & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x22: new SM83_opcode_functions(SM83_opcode_matrix[0x22], // 22
        function(regs, pins) { //LD_ind_inc_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                pins.D = regs.A;
                regs.TA = (regs.TA + 1) & 0xFFFF;
                regs.H = (regs.TA & 0xFF00) >>> 8;
                regs.L = regs.TA & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x23: new SM83_opcode_functions(SM83_opcode_matrix[0x23], // 23
        function(regs, pins) { //INC16_di
        switch(regs.TCU) {
            case 1:
                let a = (regs.H << 8) | regs.L;
                a = (a + 1) & 0xFFFF;
                regs.H = (a & 0xFF00) >>> 8;
                regs.L = a & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x24: new SM83_opcode_functions(SM83_opcode_matrix[0x24], // 24
        function(regs, pins) { //INC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = ((regs.H) + 1) & 0xFF;
                regs.F.H = +(((regs.H) & 0x0F) === 0);
                regs.F.N = 0;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x25: new SM83_opcode_functions(SM83_opcode_matrix[0x25], // 25
        function(regs, pins) { //DEC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = ((regs.H) - 1) & 0xFF;
                regs.F.H = +(((regs.H) & 0x0F) === 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x26: new SM83_opcode_functions(SM83_opcode_matrix[0x26], // 26
        function(regs, pins) { //LD_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 2: // cleanup_custom
                regs.H = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x27: new SM83_opcode_functions(SM83_opcode_matrix[0x27], // 27
        function(regs, pins) { //DAA
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let a = regs.A;
                if (!regs.F.N) {
                    if (regs.F.H || ((regs.A & 0x0F) > 0x09)) a += 0x06;
                    if (regs.F.C || (regs.A > 0x99)) {
                        a += 0x60;
                        regs.F.C = 1;
                    }
                } else {
                    a -= (0x06 * regs.F.H);
                    a -= (0x60 * regs.F.C);
                }
                regs.A = a & 0xFF;
                regs.F.H = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x28: new SM83_opcode_functions(SM83_opcode_matrix[0x28], // 28
        function(regs, pins) { //JR_cond_rel
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                if (!(regs.F.Z === 1)) { regs.TCU += 1; break; } // CHECKHERE
                break;
            case 2:
                regs.TA = pins.D;
                regs.PC = (mksigned8(regs.TA) + regs.PC) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x29: new SM83_opcode_functions(SM83_opcode_matrix[0x29], // 29
        function(regs, pins) { //ADD16_di_di
        switch(regs.TCU) {
            case 1: // idle
                let target = (regs.H << 8) | regs.L;
                let source = (regs.H << 8) | regs.L;
                let x = target + source;
                let y = (target & 0xFFF) + (source & 0xFFF);
                regs.H = (x & 0xFF00) >>> 8;
                regs.L = x & 0xFF;
                regs.F.C = +(x > 0xFFFF);
                regs.F.H = +(y > 0x0FFF);
                regs.F.N = 0;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x2A: new SM83_opcode_functions(SM83_opcode_matrix[0x2A], // 2A
        function(regs, pins) { //LD_di_ind_inc
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                regs.TA = (regs.TA + 1) & 0xFFFF;
                regs.H = (regs.TA & 0xFF00) >>> 8;
                regs.L = regs.TA & 0xFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x2B: new SM83_opcode_functions(SM83_opcode_matrix[0x2B], // 2B
        function(regs, pins) { //DEC16_di
        switch(regs.TCU) {
            case 1:
                let a = (regs.H << 8) | regs.L;
                a = (a - 1) & 0xFFFF;
                regs.H = (a & 0xFF00) >>> 8;
                regs.L = a & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x2C: new SM83_opcode_functions(SM83_opcode_matrix[0x2C], // 2C
        function(regs, pins) { //INC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = ((regs.L) + 1) & 0xFF;
                regs.F.H = +(((regs.L) & 0x0F) === 0);
                regs.F.N = 0;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x2D: new SM83_opcode_functions(SM83_opcode_matrix[0x2D], // 2D
        function(regs, pins) { //DEC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = ((regs.L) - 1) & 0xFF;
                regs.F.H = +(((regs.L) & 0x0F) === 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x2E: new SM83_opcode_functions(SM83_opcode_matrix[0x2E], // 2E
        function(regs, pins) { //LD_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 2: // cleanup_custom
                regs.L = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x2F: new SM83_opcode_functions(SM83_opcode_matrix[0x2F], // 2F
        function(regs, pins) { //CPL
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A ^= 0xFF;
                regs.F.H = regs.F.N = 1;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x30: new SM83_opcode_functions(SM83_opcode_matrix[0x30], // 30
        function(regs, pins) { //JR_cond_rel
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                if (!(regs.F.C === 0)) { regs.TCU += 1; break; } // CHECKHERE
                break;
            case 2:
                regs.TA = pins.D;
                regs.PC = (mksigned8(regs.TA) + regs.PC) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x31: new SM83_opcode_functions(SM83_opcode_matrix[0x31], // 31
        function(regs, pins) { //LD16_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TR = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3: // cleanup_custom
                regs.RR = pins.D;
                regs.TR |= (regs.RR << 8);
                regs.SP = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x32: new SM83_opcode_functions(SM83_opcode_matrix[0x32], // 32
        function(regs, pins) { //LD_ind_dec_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                pins.D = regs.A;
                regs.TA = (regs.TA - 1) & 0xFFFF;
                regs.H = (regs.TA & 0xFF00) >>> 8;
                regs.L = regs.TA & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x33: new SM83_opcode_functions(SM83_opcode_matrix[0x33], // 33
        function(regs, pins) { //INC16_di
        switch(regs.TCU) {
            case 1:
                let a = regs.SP;
                a = (a + 1) & 0xFFFF;
                regs.SP = a;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x34: new SM83_opcode_functions(SM83_opcode_matrix[0x34], // 34
        function(regs, pins) { //INC_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR = ((regs.TR) + 1) & 0xFF;
                regs.F.H = +(((regs.TR) & 0x0F) === 0);
                regs.F.N = 0;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x35: new SM83_opcode_functions(SM83_opcode_matrix[0x35], // 35
        function(regs, pins) { //DEC_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR = ((regs.TR) - 1) & 0xFF;
                regs.F.H = +(((regs.TR) & 0x0F) === 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x36: new SM83_opcode_functions(SM83_opcode_matrix[0x36], // 36
        function(regs, pins) { //LD_ind_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TA = (regs.H << 8) | regs.L;
                break;
            case 2: // Do write
                regs.TR = pins.D;
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x37: new SM83_opcode_functions(SM83_opcode_matrix[0x37], // 37
        function(regs, pins) { //SCF
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.C = 1;
                regs.F.H = regs.F.N = 0;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x38: new SM83_opcode_functions(SM83_opcode_matrix[0x38], // 38
        function(regs, pins) { //JR_cond_rel
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                if (!(regs.F.C === 1)) { regs.TCU += 1; break; } // CHECKHERE
                break;
            case 2:
                regs.TA = pins.D;
                regs.PC = (mksigned8(regs.TA) + regs.PC) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x39: new SM83_opcode_functions(SM83_opcode_matrix[0x39], // 39
        function(regs, pins) { //ADD16_di_di
        switch(regs.TCU) {
            case 1: // idle
                let target = (regs.H << 8) | regs.L;
                let source = regs.SP;
                let x = target + source;
                let y = (target & 0xFFF) + (source & 0xFFF);
                regs.H = (x & 0xFF00) >>> 8;
                regs.L = x & 0xFF;
                regs.F.C = +(x > 0xFFFF);
                regs.F.H = +(y > 0x0FFF);
                regs.F.N = 0;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x3A: new SM83_opcode_functions(SM83_opcode_matrix[0x3A], // 3A
        function(regs, pins) { //LD_di_ind_dec
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                regs.TA = (regs.TA - 1) & 0xFFFF;
                regs.H = (regs.TA & 0xFF00) >>> 8;
                regs.L = regs.TA & 0xFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x3B: new SM83_opcode_functions(SM83_opcode_matrix[0x3B], // 3B
        function(regs, pins) { //DEC16_di
        switch(regs.TCU) {
            case 1:
                let a = regs.SP;
                a = (a - 1) & 0xFFFF;
                regs.SP = a;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x3C: new SM83_opcode_functions(SM83_opcode_matrix[0x3C], // 3C
        function(regs, pins) { //INC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = ((regs.A) + 1) & 0xFF;
                regs.F.H = +(((regs.A) & 0x0F) === 0);
                regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x3D: new SM83_opcode_functions(SM83_opcode_matrix[0x3D], // 3D
        function(regs, pins) { //DEC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = ((regs.A) - 1) & 0xFF;
                regs.F.H = +(((regs.A) & 0x0F) === 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x3E: new SM83_opcode_functions(SM83_opcode_matrix[0x3E], // 3E
        function(regs, pins) { //LD_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 2: // cleanup_custom
                regs.A = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x3F: new SM83_opcode_functions(SM83_opcode_matrix[0x3F], // 3F
        function(regs, pins) { //CCF
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.C ^= 1;
                regs.F.H = regs.F.N = 0;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x40: new SM83_opcode_functions(SM83_opcode_matrix[0x40], // 40
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.B;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x41: new SM83_opcode_functions(SM83_opcode_matrix[0x41], // 41
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.C;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x42: new SM83_opcode_functions(SM83_opcode_matrix[0x42], // 42
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.D;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x43: new SM83_opcode_functions(SM83_opcode_matrix[0x43], // 43
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.E;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x44: new SM83_opcode_functions(SM83_opcode_matrix[0x44], // 44
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.H;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x45: new SM83_opcode_functions(SM83_opcode_matrix[0x45], // 45
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.L;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x46: new SM83_opcode_functions(SM83_opcode_matrix[0x46], // 46
        function(regs, pins) { //LD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.B = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x47: new SM83_opcode_functions(SM83_opcode_matrix[0x47], // 47
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.A;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x48: new SM83_opcode_functions(SM83_opcode_matrix[0x48], // 48
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.B;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x49: new SM83_opcode_functions(SM83_opcode_matrix[0x49], // 49
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.C;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x4A: new SM83_opcode_functions(SM83_opcode_matrix[0x4A], // 4A
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.D;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x4B: new SM83_opcode_functions(SM83_opcode_matrix[0x4B], // 4B
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.E;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x4C: new SM83_opcode_functions(SM83_opcode_matrix[0x4C], // 4C
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.H;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x4D: new SM83_opcode_functions(SM83_opcode_matrix[0x4D], // 4D
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.L;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x4E: new SM83_opcode_functions(SM83_opcode_matrix[0x4E], // 4E
        function(regs, pins) { //LD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.C = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x4F: new SM83_opcode_functions(SM83_opcode_matrix[0x4F], // 4F
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.A;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x50: new SM83_opcode_functions(SM83_opcode_matrix[0x50], // 50
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.B;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x51: new SM83_opcode_functions(SM83_opcode_matrix[0x51], // 51
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.C;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x52: new SM83_opcode_functions(SM83_opcode_matrix[0x52], // 52
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.D;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x53: new SM83_opcode_functions(SM83_opcode_matrix[0x53], // 53
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.E;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x54: new SM83_opcode_functions(SM83_opcode_matrix[0x54], // 54
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.H;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x55: new SM83_opcode_functions(SM83_opcode_matrix[0x55], // 55
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.L;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x56: new SM83_opcode_functions(SM83_opcode_matrix[0x56], // 56
        function(regs, pins) { //LD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x57: new SM83_opcode_functions(SM83_opcode_matrix[0x57], // 57
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.A;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x58: new SM83_opcode_functions(SM83_opcode_matrix[0x58], // 58
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.B;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x59: new SM83_opcode_functions(SM83_opcode_matrix[0x59], // 59
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.C;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x5A: new SM83_opcode_functions(SM83_opcode_matrix[0x5A], // 5A
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.D;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x5B: new SM83_opcode_functions(SM83_opcode_matrix[0x5B], // 5B
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.E;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x5C: new SM83_opcode_functions(SM83_opcode_matrix[0x5C], // 5C
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.H;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x5D: new SM83_opcode_functions(SM83_opcode_matrix[0x5D], // 5D
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.L;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x5E: new SM83_opcode_functions(SM83_opcode_matrix[0x5E], // 5E
        function(regs, pins) { //LD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.E = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x5F: new SM83_opcode_functions(SM83_opcode_matrix[0x5F], // 5F
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.A;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x60: new SM83_opcode_functions(SM83_opcode_matrix[0x60], // 60
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.B;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x61: new SM83_opcode_functions(SM83_opcode_matrix[0x61], // 61
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.C;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x62: new SM83_opcode_functions(SM83_opcode_matrix[0x62], // 62
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.D;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x63: new SM83_opcode_functions(SM83_opcode_matrix[0x63], // 63
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.E;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x64: new SM83_opcode_functions(SM83_opcode_matrix[0x64], // 64
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.H;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x65: new SM83_opcode_functions(SM83_opcode_matrix[0x65], // 65
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.L;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x66: new SM83_opcode_functions(SM83_opcode_matrix[0x66], // 66
        function(regs, pins) { //LD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.H = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x67: new SM83_opcode_functions(SM83_opcode_matrix[0x67], // 67
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.A;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x68: new SM83_opcode_functions(SM83_opcode_matrix[0x68], // 68
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.B;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x69: new SM83_opcode_functions(SM83_opcode_matrix[0x69], // 69
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.C;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x6A: new SM83_opcode_functions(SM83_opcode_matrix[0x6A], // 6A
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.D;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x6B: new SM83_opcode_functions(SM83_opcode_matrix[0x6B], // 6B
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.E;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x6C: new SM83_opcode_functions(SM83_opcode_matrix[0x6C], // 6C
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.H;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x6D: new SM83_opcode_functions(SM83_opcode_matrix[0x6D], // 6D
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.L;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x6E: new SM83_opcode_functions(SM83_opcode_matrix[0x6E], // 6E
        function(regs, pins) { //LD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.L = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x6F: new SM83_opcode_functions(SM83_opcode_matrix[0x6F], // 6F
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.A;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x70: new SM83_opcode_functions(SM83_opcode_matrix[0x70], // 70
        function(regs, pins) { //LD_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                pins.D = regs.B;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x71: new SM83_opcode_functions(SM83_opcode_matrix[0x71], // 71
        function(regs, pins) { //LD_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                pins.D = regs.C;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x72: new SM83_opcode_functions(SM83_opcode_matrix[0x72], // 72
        function(regs, pins) { //LD_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                pins.D = regs.D;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x73: new SM83_opcode_functions(SM83_opcode_matrix[0x73], // 73
        function(regs, pins) { //LD_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                pins.D = regs.E;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x74: new SM83_opcode_functions(SM83_opcode_matrix[0x74], // 74
        function(regs, pins) { //LD_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                pins.D = regs.H;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x75: new SM83_opcode_functions(SM83_opcode_matrix[0x75], // 75
        function(regs, pins) { //LD_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                pins.D = regs.L;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x76: new SM83_opcode_functions(SM83_opcode_matrix[0x76], // 76
        function(regs, pins) { //HALT
        switch(regs.TCU) {
            case 1:
                regs.HLT = 1;
                if ((!regs.IME) && (regs.interrupt_latch !== 0)) regs.halt_bug = 1; 
                if (regs.HLT) regs.TCU--;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x77: new SM83_opcode_functions(SM83_opcode_matrix[0x77], // 77
        function(regs, pins) { //LD_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                pins.D = regs.A;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x78: new SM83_opcode_functions(SM83_opcode_matrix[0x78], // 78
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.B;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x79: new SM83_opcode_functions(SM83_opcode_matrix[0x79], // 79
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.C;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x7A: new SM83_opcode_functions(SM83_opcode_matrix[0x7A], // 7A
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.D;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x7B: new SM83_opcode_functions(SM83_opcode_matrix[0x7B], // 7B
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.E;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x7C: new SM83_opcode_functions(SM83_opcode_matrix[0x7C], // 7C
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.H;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x7D: new SM83_opcode_functions(SM83_opcode_matrix[0x7D], // 7D
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.L;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x7E: new SM83_opcode_functions(SM83_opcode_matrix[0x7E], // 7E
        function(regs, pins) { //LD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x7F: new SM83_opcode_functions(SM83_opcode_matrix[0x7F], // 7F
        function(regs, pins) { //LD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.A;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x80: new SM83_opcode_functions(SM83_opcode_matrix[0x80], // 80
        function(regs, pins) { //ADD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.B);
                let y = ((regs.A) & 0x0F) + ((regs.B) & 0x0F);
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x81: new SM83_opcode_functions(SM83_opcode_matrix[0x81], // 81
        function(regs, pins) { //ADD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.C);
                let y = ((regs.A) & 0x0F) + ((regs.C) & 0x0F);
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x82: new SM83_opcode_functions(SM83_opcode_matrix[0x82], // 82
        function(regs, pins) { //ADD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.D);
                let y = ((regs.A) & 0x0F) + ((regs.D) & 0x0F);
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x83: new SM83_opcode_functions(SM83_opcode_matrix[0x83], // 83
        function(regs, pins) { //ADD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.E);
                let y = ((regs.A) & 0x0F) + ((regs.E) & 0x0F);
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x84: new SM83_opcode_functions(SM83_opcode_matrix[0x84], // 84
        function(regs, pins) { //ADD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.H);
                let y = ((regs.A) & 0x0F) + ((regs.H) & 0x0F);
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x85: new SM83_opcode_functions(SM83_opcode_matrix[0x85], // 85
        function(regs, pins) { //ADD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.L);
                let y = ((regs.A) & 0x0F) + ((regs.L) & 0x0F);
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x86: new SM83_opcode_functions(SM83_opcode_matrix[0x86], // 86
        function(regs, pins) { //ADD_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = (regs.A) + (regs.TR);
                let y = ((regs.A) & 0x0F) + ((regs.TR) & 0x0F);
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x87: new SM83_opcode_functions(SM83_opcode_matrix[0x87], // 87
        function(regs, pins) { //ADD_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.A);
                let y = ((regs.A) & 0x0F) + ((regs.A) & 0x0F);
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x88: new SM83_opcode_functions(SM83_opcode_matrix[0x88], // 88
        function(regs, pins) { //ADC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.B) + regs.F.C;
                let y = ((regs.A) & 0x0F) + ((regs.B) & 0x0F) + regs.F.C;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x89: new SM83_opcode_functions(SM83_opcode_matrix[0x89], // 89
        function(regs, pins) { //ADC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.C) + regs.F.C;
                let y = ((regs.A) & 0x0F) + ((regs.C) & 0x0F) + regs.F.C;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x8A: new SM83_opcode_functions(SM83_opcode_matrix[0x8A], // 8A
        function(regs, pins) { //ADC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.D) + regs.F.C;
                let y = ((regs.A) & 0x0F) + ((regs.D) & 0x0F) + regs.F.C;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x8B: new SM83_opcode_functions(SM83_opcode_matrix[0x8B], // 8B
        function(regs, pins) { //ADC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.E) + regs.F.C;
                let y = ((regs.A) & 0x0F) + ((regs.E) & 0x0F) + regs.F.C;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x8C: new SM83_opcode_functions(SM83_opcode_matrix[0x8C], // 8C
        function(regs, pins) { //ADC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.H) + regs.F.C;
                let y = ((regs.A) & 0x0F) + ((regs.H) & 0x0F) + regs.F.C;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x8D: new SM83_opcode_functions(SM83_opcode_matrix[0x8D], // 8D
        function(regs, pins) { //ADC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.L) + regs.F.C;
                let y = ((regs.A) & 0x0F) + ((regs.L) & 0x0F) + regs.F.C;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x8E: new SM83_opcode_functions(SM83_opcode_matrix[0x8E], // 8E
        function(regs, pins) { //ADC_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = (regs.A) + (regs.TR) + regs.F.C;
                let y = ((regs.A) & 0x0F) + ((regs.TR) & 0x0F) + regs.F.C;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x8F: new SM83_opcode_functions(SM83_opcode_matrix[0x8F], // 8F
        function(regs, pins) { //ADC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = (regs.A) + (regs.A) + regs.F.C;
                let y = ((regs.A) & 0x0F) + ((regs.A) & 0x0F) + regs.F.C;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x90: new SM83_opcode_functions(SM83_opcode_matrix[0x90], // 90
        function(regs, pins) { //SUB_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.B)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.B) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x91: new SM83_opcode_functions(SM83_opcode_matrix[0x91], // 91
        function(regs, pins) { //SUB_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.C)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.C) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x92: new SM83_opcode_functions(SM83_opcode_matrix[0x92], // 92
        function(regs, pins) { //SUB_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.D)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.D) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x93: new SM83_opcode_functions(SM83_opcode_matrix[0x93], // 93
        function(regs, pins) { //SUB_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.E)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.E) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x94: new SM83_opcode_functions(SM83_opcode_matrix[0x94], // 94
        function(regs, pins) { //SUB_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.H)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.H) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x95: new SM83_opcode_functions(SM83_opcode_matrix[0x95], // 95
        function(regs, pins) { //SUB_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.L)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.L) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x96: new SM83_opcode_functions(SM83_opcode_matrix[0x96], // 96
        function(regs, pins) { //SUB_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = ((regs.A) - (regs.TR)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.TR) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x97: new SM83_opcode_functions(SM83_opcode_matrix[0x97], // 97
        function(regs, pins) { //SUB_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.A)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.A) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x98: new SM83_opcode_functions(SM83_opcode_matrix[0x98], // 98
        function(regs, pins) { //SBC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.B) - regs.F.C) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.B) &0x0F) - regs.F.C) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x99: new SM83_opcode_functions(SM83_opcode_matrix[0x99], // 99
        function(regs, pins) { //SBC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.C) - regs.F.C) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.C) &0x0F) - regs.F.C) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x9A: new SM83_opcode_functions(SM83_opcode_matrix[0x9A], // 9A
        function(regs, pins) { //SBC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.D) - regs.F.C) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.D) &0x0F) - regs.F.C) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x9B: new SM83_opcode_functions(SM83_opcode_matrix[0x9B], // 9B
        function(regs, pins) { //SBC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.E) - regs.F.C) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.E) &0x0F) - regs.F.C) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x9C: new SM83_opcode_functions(SM83_opcode_matrix[0x9C], // 9C
        function(regs, pins) { //SBC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.H) - regs.F.C) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.H) &0x0F) - regs.F.C) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x9D: new SM83_opcode_functions(SM83_opcode_matrix[0x9D], // 9D
        function(regs, pins) { //SBC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.L) - regs.F.C) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.L) &0x0F) - regs.F.C) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x9E: new SM83_opcode_functions(SM83_opcode_matrix[0x9E], // 9E
        function(regs, pins) { //SBC_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = ((regs.A) - (regs.TR) - regs.F.C) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.TR) &0x0F) - regs.F.C) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x9F: new SM83_opcode_functions(SM83_opcode_matrix[0x9F], // 9F
        function(regs, pins) { //SBC_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.A) - regs.F.C) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.A) &0x0F) - regs.F.C) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA0: new SM83_opcode_functions(SM83_opcode_matrix[0xA0], // A0
        function(regs, pins) { //AND_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) & (regs.B);
                regs.F.C = regs.F.N = 0;
                regs.F.H = 1;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA1: new SM83_opcode_functions(SM83_opcode_matrix[0xA1], // A1
        function(regs, pins) { //AND_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) & (regs.C);
                regs.F.C = regs.F.N = 0;
                regs.F.H = 1;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA2: new SM83_opcode_functions(SM83_opcode_matrix[0xA2], // A2
        function(regs, pins) { //AND_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) & (regs.D);
                regs.F.C = regs.F.N = 0;
                regs.F.H = 1;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA3: new SM83_opcode_functions(SM83_opcode_matrix[0xA3], // A3
        function(regs, pins) { //AND_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) & (regs.E);
                regs.F.C = regs.F.N = 0;
                regs.F.H = 1;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA4: new SM83_opcode_functions(SM83_opcode_matrix[0xA4], // A4
        function(regs, pins) { //AND_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) & (regs.H);
                regs.F.C = regs.F.N = 0;
                regs.F.H = 1;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA5: new SM83_opcode_functions(SM83_opcode_matrix[0xA5], // A5
        function(regs, pins) { //AND_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) & (regs.L);
                regs.F.C = regs.F.N = 0;
                regs.F.H = 1;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA6: new SM83_opcode_functions(SM83_opcode_matrix[0xA6], // A6
        function(regs, pins) { //AND_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.TR = (regs.A) & (regs.TR);
                regs.F.C = regs.F.N = 0;
                regs.F.H = 1;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA7: new SM83_opcode_functions(SM83_opcode_matrix[0xA7], // A7
        function(regs, pins) { //AND_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) & (regs.A);
                regs.F.C = regs.F.N = 0;
                regs.F.H = 1;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA8: new SM83_opcode_functions(SM83_opcode_matrix[0xA8], // A8
        function(regs, pins) { //XOR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) ^ (regs.B);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xA9: new SM83_opcode_functions(SM83_opcode_matrix[0xA9], // A9
        function(regs, pins) { //XOR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) ^ (regs.C);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xAA: new SM83_opcode_functions(SM83_opcode_matrix[0xAA], // AA
        function(regs, pins) { //XOR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) ^ (regs.D);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xAB: new SM83_opcode_functions(SM83_opcode_matrix[0xAB], // AB
        function(regs, pins) { //XOR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) ^ (regs.E);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xAC: new SM83_opcode_functions(SM83_opcode_matrix[0xAC], // AC
        function(regs, pins) { //XOR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) ^ (regs.H);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xAD: new SM83_opcode_functions(SM83_opcode_matrix[0xAD], // AD
        function(regs, pins) { //XOR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) ^ (regs.L);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xAE: new SM83_opcode_functions(SM83_opcode_matrix[0xAE], // AE
        function(regs, pins) { //XOR_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.TR = (regs.A) ^ (regs.TR);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xAF: new SM83_opcode_functions(SM83_opcode_matrix[0xAF], // AF
        function(regs, pins) { //XOR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) ^ (regs.A);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB0: new SM83_opcode_functions(SM83_opcode_matrix[0xB0], // B0
        function(regs, pins) { //OR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) | (regs.B);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB1: new SM83_opcode_functions(SM83_opcode_matrix[0xB1], // B1
        function(regs, pins) { //OR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) | (regs.C);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB2: new SM83_opcode_functions(SM83_opcode_matrix[0xB2], // B2
        function(regs, pins) { //OR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) | (regs.D);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB3: new SM83_opcode_functions(SM83_opcode_matrix[0xB3], // B3
        function(regs, pins) { //OR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) | (regs.E);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB4: new SM83_opcode_functions(SM83_opcode_matrix[0xB4], // B4
        function(regs, pins) { //OR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) | (regs.H);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB5: new SM83_opcode_functions(SM83_opcode_matrix[0xB5], // B5
        function(regs, pins) { //OR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) | (regs.L);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB6: new SM83_opcode_functions(SM83_opcode_matrix[0xB6], // B6
        function(regs, pins) { //OR_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.TR = (regs.A) | (regs.TR);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB7: new SM83_opcode_functions(SM83_opcode_matrix[0xB7], // B7
        function(regs, pins) { //OR_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.TR = (regs.A) | (regs.A);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB8: new SM83_opcode_functions(SM83_opcode_matrix[0xB8], // B8
        function(regs, pins) { //CP_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.B)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.B) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((x & 0xFF) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xB9: new SM83_opcode_functions(SM83_opcode_matrix[0xB9], // B9
        function(regs, pins) { //CP_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.C)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.C) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((x & 0xFF) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xBA: new SM83_opcode_functions(SM83_opcode_matrix[0xBA], // BA
        function(regs, pins) { //CP_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.D)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.D) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((x & 0xFF) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xBB: new SM83_opcode_functions(SM83_opcode_matrix[0xBB], // BB
        function(regs, pins) { //CP_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.E)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.E) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((x & 0xFF) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xBC: new SM83_opcode_functions(SM83_opcode_matrix[0xBC], // BC
        function(regs, pins) { //CP_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.H)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.H) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((x & 0xFF) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xBD: new SM83_opcode_functions(SM83_opcode_matrix[0xBD], // BD
        function(regs, pins) { //CP_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.L)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.L) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((x & 0xFF) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xBE: new SM83_opcode_functions(SM83_opcode_matrix[0xBE], // BE
        function(regs, pins) { //CP_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = ((regs.A) - (regs.TR)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.TR) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((x & 0xFF) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xBF: new SM83_opcode_functions(SM83_opcode_matrix[0xBF], // BF
        function(regs, pins) { //CP_di_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let x = ((regs.A) - (regs.A)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.A) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((x & 0xFF) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xC0: new SM83_opcode_functions(SM83_opcode_matrix[0xC0], // C0
        function(regs, pins) { //RET_cond
        switch(regs.TCU) {
            case 1:
                if (!(regs.F.Z === 0)) { pins.RD = 0; pins.MRQ = 0; regs.TCU += 3; break; } // CHECKHERE
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do read
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                pins.RD = 1; pins.MRQ = 1;
                break;
            case 3: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 4:
                regs.TR = pins.D;
                regs.TA |= (regs.TR << 8);
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 5: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xC1: new SM83_opcode_functions(SM83_opcode_matrix[0xC1], // C1
        function(regs, pins) { //POP_di
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.C = pins.D;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 3: // cleanup_custom
                regs.B = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xC2: new SM83_opcode_functions(SM83_opcode_matrix[0xC2], // C2
        function(regs, pins) { //JP_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(regs.F.Z === 0)) { regs.TCU += 1; break; } // CHECKHERE
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xC3: new SM83_opcode_functions(SM83_opcode_matrix[0xC3], // C3
        function(regs, pins) { //JP_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(1)) { regs.TCU += 1; break; } // CHECKHERE
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xC4: new SM83_opcode_functions(SM83_opcode_matrix[0xC4], // C4
        function(regs, pins) { //CALL_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(regs.F.Z === 0)) { regs.TCU += 3; break; } // CHECKHERE
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 5: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                break;
            case 6: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xC5: new SM83_opcode_functions(SM83_opcode_matrix[0xC5], // C5
        function(regs, pins) { //PUSH_di
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.B;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.C;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xC6: new SM83_opcode_functions(SM83_opcode_matrix[0xC6], // C6
        function(regs, pins) { //ADD_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = (regs.A) + (regs.TR);
                let y = ((regs.A) & 0x0F) + ((regs.TR) & 0x0F);
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xC7: new SM83_opcode_functions(SM83_opcode_matrix[0xC7], // C7
        function(regs, pins) { //RST_imp
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = 0x0000;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xC8: new SM83_opcode_functions(SM83_opcode_matrix[0xC8], // C8
        function(regs, pins) { //RET_cond
        switch(regs.TCU) {
            case 1:
                if (!(regs.F.Z === 1)) { pins.RD = 0; pins.MRQ = 0; regs.TCU += 3; break; } // CHECKHERE
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do read
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                pins.RD = 1; pins.MRQ = 1;
                break;
            case 3: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 4:
                regs.TR = pins.D;
                regs.TA |= (regs.TR << 8);
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 5: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xC9: new SM83_opcode_functions(SM83_opcode_matrix[0xC9], // C9
        function(regs, pins) { //RET
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 3:
                regs.TR = pins.D;
                regs.TA |= (regs.TR << 8);
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xCA: new SM83_opcode_functions(SM83_opcode_matrix[0xCA], // CA
        function(regs, pins) { //JP_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(regs.F.Z === 1)) { regs.TCU += 1; break; } // CHECKHERE
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xCB: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xCC: new SM83_opcode_functions(SM83_opcode_matrix[0xCC], // CC
        function(regs, pins) { //CALL_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(regs.F.Z === 1)) { regs.TCU += 3; break; } // CHECKHERE
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 5: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                break;
            case 6: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xCD: new SM83_opcode_functions(SM83_opcode_matrix[0xCD], // CD
        function(regs, pins) { //CALL_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(1)) { regs.TCU += 3; break; } // CHECKHERE
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 5: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                break;
            case 6: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xCE: new SM83_opcode_functions(SM83_opcode_matrix[0xCE], // CE
        function(regs, pins) { //ADC_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = (regs.A) + (regs.TR) + regs.F.C;
                let y = ((regs.A) & 0x0F) + ((regs.TR) & 0x0F) + regs.F.C;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 0;
                regs.TR = (x & 0xFF);
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xCF: new SM83_opcode_functions(SM83_opcode_matrix[0xCF], // CF
        function(regs, pins) { //RST_imp
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = 0x0008;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xD0: new SM83_opcode_functions(SM83_opcode_matrix[0xD0], // D0
        function(regs, pins) { //RET_cond
        switch(regs.TCU) {
            case 1:
                if (!(regs.F.C === 0)) { pins.RD = 0; pins.MRQ = 0; regs.TCU += 3; break; } // CHECKHERE
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do read
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                pins.RD = 1; pins.MRQ = 1;
                break;
            case 3: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 4:
                regs.TR = pins.D;
                regs.TA |= (regs.TR << 8);
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 5: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xD1: new SM83_opcode_functions(SM83_opcode_matrix[0xD1], // D1
        function(regs, pins) { //POP_di
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.E = pins.D;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 3: // cleanup_custom
                regs.D = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xD2: new SM83_opcode_functions(SM83_opcode_matrix[0xD2], // D2
        function(regs, pins) { //JP_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(regs.F.C === 0)) { regs.TCU += 1; break; } // CHECKHERE
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xD3: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xD4: new SM83_opcode_functions(SM83_opcode_matrix[0xD4], // D4
        function(regs, pins) { //CALL_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(regs.F.C === 0)) { regs.TCU += 3; break; } // CHECKHERE
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 5: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                break;
            case 6: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xD5: new SM83_opcode_functions(SM83_opcode_matrix[0xD5], // D5
        function(regs, pins) { //PUSH_di
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.D;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.E;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xD6: new SM83_opcode_functions(SM83_opcode_matrix[0xD6], // D6
        function(regs, pins) { //SUB_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = ((regs.A) - (regs.TR)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.TR) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xD7: new SM83_opcode_functions(SM83_opcode_matrix[0xD7], // D7
        function(regs, pins) { //RST_imp
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = 0x0010;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xD8: new SM83_opcode_functions(SM83_opcode_matrix[0xD8], // D8
        function(regs, pins) { //RET_cond
        switch(regs.TCU) {
            case 1:
                if (!(regs.F.C === 1)) { pins.RD = 0; pins.MRQ = 0; regs.TCU += 3; break; } // CHECKHERE
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do read
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                pins.RD = 1; pins.MRQ = 1;
                break;
            case 3: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 4:
                regs.TR = pins.D;
                regs.TA |= (regs.TR << 8);
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 5: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xD9: new SM83_opcode_functions(SM83_opcode_matrix[0xD9], // D9
        function(regs, pins) { //RETI
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 3:
                regs.TR = pins.D;
                regs.TA |= (regs.TR << 8);
                regs.PC = regs.TA;
                regs.IME = 1;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xDA: new SM83_opcode_functions(SM83_opcode_matrix[0xDA], // DA
        function(regs, pins) { //JP_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(regs.F.C === 1)) { regs.TCU += 1; break; } // CHECKHERE
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xDB: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xDC: new SM83_opcode_functions(SM83_opcode_matrix[0xDC], // DC
        function(regs, pins) { //CALL_cond_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3:
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                if (!(regs.F.C === 1)) { regs.TCU += 3; break; } // CHECKHERE
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 4: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 5: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = regs.TA;
                // Following is auto-generated code for instruction finish
                break;
            case 6: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xDD: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xDE: new SM83_opcode_functions(SM83_opcode_matrix[0xDE], // DE
        function(regs, pins) { //SBC_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = ((regs.A) - (regs.TR) - regs.F.C) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.TR) &0x0F) - regs.F.C) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.TR = x & 0xFF;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xDF: new SM83_opcode_functions(SM83_opcode_matrix[0xDF], // DF
        function(regs, pins) { //RST_imp
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = 0x0018;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xE0: new SM83_opcode_functions(SM83_opcode_matrix[0xE0], // E0
        function(regs, pins) { //LDH_addr_di
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do write
                regs.TA = pins.D;
                regs.TA |= 0xFF00;
                pins.Addr = (regs.TA);
                pins.D = regs.A;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xE1: new SM83_opcode_functions(SM83_opcode_matrix[0xE1], // E1
        function(regs, pins) { //POP_di
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.L = pins.D;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 3: // cleanup_custom
                regs.H = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xE2: new SM83_opcode_functions(SM83_opcode_matrix[0xE2], // E2
        function(regs, pins) { //LDH_ind_di
        switch(regs.TCU) {
            case 1: // Do write
                regs.TA = 0xFF00 | regs.C;
                pins.Addr = (regs.TA);
                pins.D = regs.A;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xE3: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xE4: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xE5: new SM83_opcode_functions(SM83_opcode_matrix[0xE5], // E5
        function(regs, pins) { //PUSH_di
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.H;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.L;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xE6: new SM83_opcode_functions(SM83_opcode_matrix[0xE6], // E6
        function(regs, pins) { //AND_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.TR = (regs.A) & (regs.TR);
                regs.F.C = regs.F.N = 0;
                regs.F.H = 1;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xE7: new SM83_opcode_functions(SM83_opcode_matrix[0xE7], // E7
        function(regs, pins) { //RST_imp
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = 0x0020;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xE8: new SM83_opcode_functions(SM83_opcode_matrix[0xE8], // E8
        function(regs, pins) { //ADD_di_rel
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                regs.TR = pins.D;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 3:
                let target = regs.SP;
                regs.F.C = +(((target & 0xFF) + regs.TR) > 0xFF);
                regs.F.H = +(((target & 0x0F) + (regs.TR & 0x0F)) > 0x0F);
                regs.F.N = regs.F.Z = 0;
                target = (target + mksigned8(regs.TR)) & 0xFFFF;
                regs.SP = target;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xE9: new SM83_opcode_functions(SM83_opcode_matrix[0xE9], // E9
        function(regs, pins) { //JP_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.PC = (regs.H << 8) | regs.L;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xEA: new SM83_opcode_functions(SM83_opcode_matrix[0xEA], // EA
        function(regs, pins) { //LD_addr_di
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3: // Do write
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                pins.Addr = (regs.TA);
                pins.D = regs.A;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xEB: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xEC: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xED: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xEE: new SM83_opcode_functions(SM83_opcode_matrix[0xEE], // EE
        function(regs, pins) { //XOR_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.TR = (regs.A) ^ (regs.TR);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xEF: new SM83_opcode_functions(SM83_opcode_matrix[0xEF], // EF
        function(regs, pins) { //RST_imp
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = 0x0028;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xF0: new SM83_opcode_functions(SM83_opcode_matrix[0xF0], // F0
        function(regs, pins) { //LDH_di_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                regs.TA |= 0xFF00;
                pins.Addr = (regs.TA);
                // Following is auto-generated code for instruction finish
                break;
            case 3: // cleanup_custom
                regs.A = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xF1: new SM83_opcode_functions(SM83_opcode_matrix[0xF1], // F1
        function(regs, pins) { //POP_di_AF
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.SP);
                break;
            case 2: // Do read
                regs.TR = pins.D;
                regs.F.setbyte(regs.TR & 0xF0);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                pins.Addr = (regs.SP);
                regs.SP = (regs.SP + 1) & 0xFFFF;
                // Following is auto-generated code for instruction finish
                break;
            case 3: // cleanup_custom
                regs.A = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xF2: new SM83_opcode_functions(SM83_opcode_matrix[0xF2], // F2
        function(regs, pins) { //LDH_di_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = 0xFF00 | regs.C;
                pins.Addr = (regs.TA);
                // Following is auto-generated code for instruction finish
                break;
            case 2: // cleanup_custom
                regs.A = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xF3: new SM83_opcode_functions(SM83_opcode_matrix[0xF3], // F3
        function(regs, pins) { //DI
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.IME = 0;
                regs.IE = 0;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xF4: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xF5: new SM83_opcode_functions(SM83_opcode_matrix[0xF5], // F5
        function(regs, pins) { //PUSH_di
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.A;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.F.getbyte();
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xF6: new SM83_opcode_functions(SM83_opcode_matrix[0xF6], // F6
        function(regs, pins) { //OR_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.TR = (regs.A) | (regs.TR);
                regs.F.C = regs.F.N = regs.F.H = 0;
                regs.F.Z = +((regs.TR) === 0);
                regs.A = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xF7: new SM83_opcode_functions(SM83_opcode_matrix[0xF7], // F7
        function(regs, pins) { //RST_imp
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = 0x0030;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0xF8: new SM83_opcode_functions(SM83_opcode_matrix[0xF8], // F8
        function(regs, pins) { //LD_di_di_rel
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2:
                regs.TR = pins.D;
                let source = regs.SP;
                regs.F.C = +(((source & 0xFF) + regs.TR) > 0xFF);
                regs.F.H = +(((source & 0x0F) + (regs.TR & 0x0F)) > 0x0F);
                regs.F.N = regs.F.Z = 0;
                source = (source + mksigned8(regs.TR)) & 0xFFFF;
                regs.H = (source & 0xFF00) >>> 8;
                regs.L = source & 0xFF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xF9: new SM83_opcode_functions(SM83_opcode_matrix[0xF9], // F9
        function(regs, pins) { //LD16_di_di
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.H << 8) | regs.L;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0xFA: new SM83_opcode_functions(SM83_opcode_matrix[0xFA], // FA
        function(regs, pins) { //LD_di_addr
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // Do read
                regs.TA = pins.D;
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 3: // Do read
                regs.RR = pins.D;
                regs.TA |= (regs.RR << 8);
                pins.Addr = (regs.TA);
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                regs.A = pins.D;
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xFB: new SM83_opcode_functions(SM83_opcode_matrix[0xFB], // FB
        function(regs, pins) { //EI
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.IE = 2;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xFC: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xFD: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0xFE: new SM83_opcode_functions(SM83_opcode_matrix[0xFE], // FE
        function(regs, pins) { //CP_di_da
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = (regs.PC);
                if (regs.halt_bug) regs.halt_bug = 0;
                else regs.PC = (regs.PC + 1) & 0xFFFF;
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                let x = ((regs.A) - (regs.TR)) & 0xFFFF;
                let y = (((regs.A) & 0x0F) - ((regs.TR) & 0x0F)) & 0xFFFF;
                regs.F.C = +(x > 0xFF);
                regs.F.H = +(y > 0x0F);
                regs.F.N = 1;
                regs.F.Z = +((x & 0xFF) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0xFF: new SM83_opcode_functions(SM83_opcode_matrix[0xFF], // FF
        function(regs, pins) { //RST_imp
        switch(regs.TCU) {
            case 1:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = regs.PC & 0xFF;
                regs.PC = 0x0038;
                // Following is auto-generated code for instruction finish
                break;
            case 4: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x100: new SM83_opcode_functions(SM83_opcode_matrix[0x100], // 100
        function(regs, pins) { //undefined
        switch(regs.TCU) {
            case 1:
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2:
                regs.SP = (regs.SP - 1) & 0xFFFF;
                break;
            case 3: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF00) >>> 8;
                regs.SP = (regs.SP - 1) & 0xFFFF;
                pins.WR = 1; pins.MRQ = 1;
                break;
            case 4: // Do write
                pins.Addr = (regs.SP);
                pins.D = (regs.PC & 0xFF);
                break;
            case 5:
                regs.PC = regs.IV;
                // Following is auto-generated code for instruction finish
                pins.WR = 0; pins.MRQ = 0;
                break;
            case 6: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x101: new SM83_opcode_functions(SM83_opcode_matrix[0x101], // 101
        function(regs, pins) { //RESET
        switch(regs.TCU) {
            case 1:
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.MRQ = 0;
                break;
            case 2: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.MRQ = 1;
                break;
        }
    }),
    0x102: new SM83_opcode_functions(SM83_opcode_matrixCB[0x00], // CB 00
        function(regs, pins) { //RLC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = ((regs.B << 1) | (regs.B >>> 7)) & 0xFF;
                regs.F.C = regs.B & 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x103: new SM83_opcode_functions(SM83_opcode_matrixCB[0x01], // CB 01
        function(regs, pins) { //RLC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = ((regs.C << 1) | (regs.C >>> 7)) & 0xFF;
                regs.F.C = regs.C & 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x104: new SM83_opcode_functions(SM83_opcode_matrixCB[0x02], // CB 02
        function(regs, pins) { //RLC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = ((regs.D << 1) | (regs.D >>> 7)) & 0xFF;
                regs.F.C = regs.D & 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x105: new SM83_opcode_functions(SM83_opcode_matrixCB[0x03], // CB 03
        function(regs, pins) { //RLC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = ((regs.E << 1) | (regs.E >>> 7)) & 0xFF;
                regs.F.C = regs.E & 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x106: new SM83_opcode_functions(SM83_opcode_matrixCB[0x04], // CB 04
        function(regs, pins) { //RLC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = ((regs.H << 1) | (regs.H >>> 7)) & 0xFF;
                regs.F.C = regs.H & 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x107: new SM83_opcode_functions(SM83_opcode_matrixCB[0x05], // CB 05
        function(regs, pins) { //RLC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = ((regs.L << 1) | (regs.L >>> 7)) & 0xFF;
                regs.F.C = regs.L & 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x108: new SM83_opcode_functions(SM83_opcode_matrixCB[0x06], // CB 06
        function(regs, pins) { //RLC_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L;
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR = ((regs.TR << 1) | (regs.TR >>> 7)) & 0xFF;
                regs.F.C = regs.TR & 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x109: new SM83_opcode_functions(SM83_opcode_matrixCB[0x07], // CB 07
        function(regs, pins) { //RLC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = ((regs.A << 1) | (regs.A >>> 7)) & 0xFF;
                regs.F.C = regs.A & 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x10A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x08], // CB 08
        function(regs, pins) { //RRC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = (((regs.B) << 7) | ((regs.B) >>> 1)) & 0xFF;
                regs.F.C = ((regs.B) & 0x80) >>> 7;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x10B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x09], // CB 09
        function(regs, pins) { //RRC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = (((regs.C) << 7) | ((regs.C) >>> 1)) & 0xFF;
                regs.F.C = ((regs.C) & 0x80) >>> 7;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x10C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x0A], // CB 0A
        function(regs, pins) { //RRC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = (((regs.D) << 7) | ((regs.D) >>> 1)) & 0xFF;
                regs.F.C = ((regs.D) & 0x80) >>> 7;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x10D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x0B], // CB 0B
        function(regs, pins) { //RRC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = (((regs.E) << 7) | ((regs.E) >>> 1)) & 0xFF;
                regs.F.C = ((regs.E) & 0x80) >>> 7;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x10E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x0C], // CB 0C
        function(regs, pins) { //RRC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = (((regs.H) << 7) | ((regs.H) >>> 1)) & 0xFF;
                regs.F.C = ((regs.H) & 0x80) >>> 7;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x10F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x0D], // CB 0D
        function(regs, pins) { //RRC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = (((regs.L) << 7) | ((regs.L) >>> 1)) & 0xFF;
                regs.F.C = ((regs.L) & 0x80) >>> 7;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x110: new SM83_opcode_functions(SM83_opcode_matrixCB[0x0E], // CB 0E
        function(regs, pins) { //RRC_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR = (((regs.TR) << 7) | ((regs.TR) >>> 1)) & 0xFF;
                regs.F.C = ((regs.TR) & 0x80) >>> 7;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x111: new SM83_opcode_functions(SM83_opcode_matrixCB[0x0F], // CB 0F
        function(regs, pins) { //RRC_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = (((regs.A) << 7) | ((regs.A) >>> 1)) & 0xFF;
                regs.F.C = ((regs.A) & 0x80) >>> 7;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x112: new SM83_opcode_functions(SM83_opcode_matrixCB[0x10], // CB 10
        function(regs, pins) { //RL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.B) & 0x80) >>> 7;
                regs.B = (((regs.B) << 1) & 0xFE) | regs.F.C;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x113: new SM83_opcode_functions(SM83_opcode_matrixCB[0x11], // CB 11
        function(regs, pins) { //RL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.C) & 0x80) >>> 7;
                regs.C = (((regs.C) << 1) & 0xFE) | regs.F.C;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x114: new SM83_opcode_functions(SM83_opcode_matrixCB[0x12], // CB 12
        function(regs, pins) { //RL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.D) & 0x80) >>> 7;
                regs.D = (((regs.D) << 1) & 0xFE) | regs.F.C;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x115: new SM83_opcode_functions(SM83_opcode_matrixCB[0x13], // CB 13
        function(regs, pins) { //RL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.E) & 0x80) >>> 7;
                regs.E = (((regs.E) << 1) & 0xFE) | regs.F.C;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x116: new SM83_opcode_functions(SM83_opcode_matrixCB[0x14], // CB 14
        function(regs, pins) { //RL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.H) & 0x80) >>> 7;
                regs.H = (((regs.H) << 1) & 0xFE) | regs.F.C;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x117: new SM83_opcode_functions(SM83_opcode_matrixCB[0x15], // CB 15
        function(regs, pins) { //RL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.L) & 0x80) >>> 7;
                regs.L = (((regs.L) << 1) & 0xFE) | regs.F.C;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x118: new SM83_opcode_functions(SM83_opcode_matrixCB[0x16], // CB 16
        function(regs, pins) { //RL_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                let carry = ((regs.TR) & 0x80) >>> 7;
                regs.TR = (((regs.TR) << 1) & 0xFE) | regs.F.C;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x119: new SM83_opcode_functions(SM83_opcode_matrixCB[0x17], // CB 17
        function(regs, pins) { //RL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.A) & 0x80) >>> 7;
                regs.A = (((regs.A) << 1) & 0xFE) | regs.F.C;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x11A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x18], // CB 18
        function(regs, pins) { //RR_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.B) & 1;
                regs.B = ((regs.B) >>> 1) | (regs.F.C << 7);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x11B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x19], // CB 19
        function(regs, pins) { //RR_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.C) & 1;
                regs.C = ((regs.C) >>> 1) | (regs.F.C << 7);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x11C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x1A], // CB 1A
        function(regs, pins) { //RR_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.D) & 1;
                regs.D = ((regs.D) >>> 1) | (regs.F.C << 7);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x11D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x1B], // CB 1B
        function(regs, pins) { //RR_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.E) & 1;
                regs.E = ((regs.E) >>> 1) | (regs.F.C << 7);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x11E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x1C], // CB 1C
        function(regs, pins) { //RR_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.H) & 1;
                regs.H = ((regs.H) >>> 1) | (regs.F.C << 7);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x11F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x1D], // CB 1D
        function(regs, pins) { //RR_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.L) & 1;
                regs.L = ((regs.L) >>> 1) | (regs.F.C << 7);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x120: new SM83_opcode_functions(SM83_opcode_matrixCB[0x1E], // CB 1E
        function(regs, pins) { //RR_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                let carry = (regs.TR) & 1;
                regs.TR = ((regs.TR) >>> 1) | (regs.F.C << 7);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x121: new SM83_opcode_functions(SM83_opcode_matrixCB[0x1F], // CB 1F
        function(regs, pins) { //RR_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.A) & 1;
                regs.A = ((regs.A) >>> 1) | (regs.F.C << 7);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x122: new SM83_opcode_functions(SM83_opcode_matrixCB[0x20], // CB 20
        function(regs, pins) { //SLA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.B) & 0x80) >>> 7;
                regs.B = ((regs.B) << 1) & 0xFF;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x123: new SM83_opcode_functions(SM83_opcode_matrixCB[0x21], // CB 21
        function(regs, pins) { //SLA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.C) & 0x80) >>> 7;
                regs.C = ((regs.C) << 1) & 0xFF;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x124: new SM83_opcode_functions(SM83_opcode_matrixCB[0x22], // CB 22
        function(regs, pins) { //SLA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.D) & 0x80) >>> 7;
                regs.D = ((regs.D) << 1) & 0xFF;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x125: new SM83_opcode_functions(SM83_opcode_matrixCB[0x23], // CB 23
        function(regs, pins) { //SLA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.E) & 0x80) >>> 7;
                regs.E = ((regs.E) << 1) & 0xFF;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x126: new SM83_opcode_functions(SM83_opcode_matrixCB[0x24], // CB 24
        function(regs, pins) { //SLA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.H) & 0x80) >>> 7;
                regs.H = ((regs.H) << 1) & 0xFF;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x127: new SM83_opcode_functions(SM83_opcode_matrixCB[0x25], // CB 25
        function(regs, pins) { //SLA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.L) & 0x80) >>> 7;
                regs.L = ((regs.L) << 1) & 0xFF;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x128: new SM83_opcode_functions(SM83_opcode_matrixCB[0x26], // CB 26
        function(regs, pins) { //SLA_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                let carry = ((regs.TR) & 0x80) >>> 7;
                regs.TR = ((regs.TR) << 1) & 0xFF;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x129: new SM83_opcode_functions(SM83_opcode_matrixCB[0x27], // CB 27
        function(regs, pins) { //SLA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = ((regs.A) & 0x80) >>> 7;
                regs.A = ((regs.A) << 1) & 0xFF;
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x12A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x28], // CB 28
        function(regs, pins) { //SRA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.B) & 1;
                regs.B = ((regs.B) & 0x80) | ((regs.B) >>> 1);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x12B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x29], // CB 29
        function(regs, pins) { //SRA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.C) & 1;
                regs.C = ((regs.C) & 0x80) | ((regs.C) >>> 1);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x12C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x2A], // CB 2A
        function(regs, pins) { //SRA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.D) & 1;
                regs.D = ((regs.D) & 0x80) | ((regs.D) >>> 1);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x12D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x2B], // CB 2B
        function(regs, pins) { //SRA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.E) & 1;
                regs.E = ((regs.E) & 0x80) | ((regs.E) >>> 1);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x12E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x2C], // CB 2C
        function(regs, pins) { //SRA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.H) & 1;
                regs.H = ((regs.H) & 0x80) | ((regs.H) >>> 1);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x12F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x2D], // CB 2D
        function(regs, pins) { //SRA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.L) & 1;
                regs.L = ((regs.L) & 0x80) | ((regs.L) >>> 1);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x130: new SM83_opcode_functions(SM83_opcode_matrixCB[0x2E], // CB 2E
        function(regs, pins) { //SRA_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                let carry = (regs.TR) & 1;
                regs.TR = ((regs.TR) & 0x80) | ((regs.TR) >>> 1);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x131: new SM83_opcode_functions(SM83_opcode_matrixCB[0x2F], // CB 2F
        function(regs, pins) { //SRA_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                let carry = (regs.A) & 1;
                regs.A = ((regs.A) & 0x80) | ((regs.A) >>> 1);
                regs.F.C = carry;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x132: new SM83_opcode_functions(SM83_opcode_matrixCB[0x30], // CB 30
        function(regs, pins) { //SWAP_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = (((regs.B) << 4) | ((regs.B) >>> 4)) & 0xFF;
                regs.F.C = regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x133: new SM83_opcode_functions(SM83_opcode_matrixCB[0x31], // CB 31
        function(regs, pins) { //SWAP_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = (((regs.C) << 4) | ((regs.C) >>> 4)) & 0xFF;
                regs.F.C = regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x134: new SM83_opcode_functions(SM83_opcode_matrixCB[0x32], // CB 32
        function(regs, pins) { //SWAP_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = (((regs.D) << 4) | ((regs.D) >>> 4)) & 0xFF;
                regs.F.C = regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x135: new SM83_opcode_functions(SM83_opcode_matrixCB[0x33], // CB 33
        function(regs, pins) { //SWAP_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = (((regs.E) << 4) | ((regs.E) >>> 4)) & 0xFF;
                regs.F.C = regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x136: new SM83_opcode_functions(SM83_opcode_matrixCB[0x34], // CB 34
        function(regs, pins) { //SWAP_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = (((regs.H) << 4) | ((regs.H) >>> 4)) & 0xFF;
                regs.F.C = regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x137: new SM83_opcode_functions(SM83_opcode_matrixCB[0x35], // CB 35
        function(regs, pins) { //SWAP_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = (((regs.L) << 4) | ((regs.L) >>> 4)) & 0xFF;
                regs.F.C = regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x138: new SM83_opcode_functions(SM83_opcode_matrixCB[0x36], // CB 36
        function(regs, pins) { //SWAP_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR = (((regs.TR) << 4) | ((regs.TR) >>> 4)) & 0xFF;
                regs.F.C = regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x139: new SM83_opcode_functions(SM83_opcode_matrixCB[0x37], // CB 37
        function(regs, pins) { //SWAP_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = (((regs.A) << 4) | ((regs.A) >>> 4)) & 0xFF;
                regs.F.C = regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x13A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x38], // CB 38
        function(regs, pins) { //SRL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.C = (regs.B) & 1;
                regs.B = (regs.B) >>> 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.B) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x13B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x39], // CB 39
        function(regs, pins) { //SRL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.C = (regs.C) & 1;
                regs.C = (regs.C) >>> 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.C) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x13C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x3A], // CB 3A
        function(regs, pins) { //SRL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.C = (regs.D) & 1;
                regs.D = (regs.D) >>> 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.D) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x13D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x3B], // CB 3B
        function(regs, pins) { //SRL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.C = (regs.E) & 1;
                regs.E = (regs.E) >>> 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.E) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x13E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x3C], // CB 3C
        function(regs, pins) { //SRL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.C = (regs.H) & 1;
                regs.H = (regs.H) >>> 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.H) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x13F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x3D], // CB 3D
        function(regs, pins) { //SRL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.C = (regs.L) & 1;
                regs.L = (regs.L) >>> 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.L) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x140: new SM83_opcode_functions(SM83_opcode_matrixCB[0x3E], // CB 3E
        function(regs, pins) { //SRL_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.F.C = (regs.TR) & 1;
                regs.TR = (regs.TR) >>> 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.TR) === 0);
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x141: new SM83_opcode_functions(SM83_opcode_matrixCB[0x3F], // CB 3F
        function(regs, pins) { //SRL_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.C = (regs.A) & 1;
                regs.A = (regs.A) >>> 1;
                regs.F.H = regs.F.N = 0;
                regs.F.Z = +((regs.A) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x142: new SM83_opcode_functions(SM83_opcode_matrixCB[0x40], // CB 40
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.B & 1) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x143: new SM83_opcode_functions(SM83_opcode_matrixCB[0x41], // CB 41
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.C & 1) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x144: new SM83_opcode_functions(SM83_opcode_matrixCB[0x42], // CB 42
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.D & 1) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x145: new SM83_opcode_functions(SM83_opcode_matrixCB[0x43], // CB 43
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.E & 1) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x146: new SM83_opcode_functions(SM83_opcode_matrixCB[0x44], // CB 44
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.H & 1) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x147: new SM83_opcode_functions(SM83_opcode_matrixCB[0x45], // CB 45
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.L & 1) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x148: new SM83_opcode_functions(SM83_opcode_matrixCB[0x46], // CB 46
        function(regs, pins) { //BIT_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.TR & 1) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x149: new SM83_opcode_functions(SM83_opcode_matrixCB[0x47], // CB 47
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.A & 1) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x14A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x48], // CB 48
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.B & 2) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x14B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x49], // CB 49
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.C & 2) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x14C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x4A], // CB 4A
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.D & 2) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x14D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x4B], // CB 4B
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.E & 2) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x14E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x4C], // CB 4C
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.H & 2) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x14F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x4D], // CB 4D
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.L & 2) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x150: new SM83_opcode_functions(SM83_opcode_matrixCB[0x4E], // CB 4E
        function(regs, pins) { //BIT_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.TR & 2) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x151: new SM83_opcode_functions(SM83_opcode_matrixCB[0x4F], // CB 4F
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.A & 2) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x152: new SM83_opcode_functions(SM83_opcode_matrixCB[0x50], // CB 50
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.B & 4) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x153: new SM83_opcode_functions(SM83_opcode_matrixCB[0x51], // CB 51
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.C & 4) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x154: new SM83_opcode_functions(SM83_opcode_matrixCB[0x52], // CB 52
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.D & 4) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x155: new SM83_opcode_functions(SM83_opcode_matrixCB[0x53], // CB 53
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.E & 4) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x156: new SM83_opcode_functions(SM83_opcode_matrixCB[0x54], // CB 54
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.H & 4) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x157: new SM83_opcode_functions(SM83_opcode_matrixCB[0x55], // CB 55
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.L & 4) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x158: new SM83_opcode_functions(SM83_opcode_matrixCB[0x56], // CB 56
        function(regs, pins) { //BIT_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.TR & 4) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x159: new SM83_opcode_functions(SM83_opcode_matrixCB[0x57], // CB 57
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.A & 4) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x15A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x58], // CB 58
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.B & 8) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x15B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x59], // CB 59
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.C & 8) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x15C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x5A], // CB 5A
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.D & 8) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x15D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x5B], // CB 5B
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.E & 8) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x15E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x5C], // CB 5C
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.H & 8) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x15F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x5D], // CB 5D
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.L & 8) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x160: new SM83_opcode_functions(SM83_opcode_matrixCB[0x5E], // CB 5E
        function(regs, pins) { //BIT_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.TR & 8) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x161: new SM83_opcode_functions(SM83_opcode_matrixCB[0x5F], // CB 5F
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.A & 8) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x162: new SM83_opcode_functions(SM83_opcode_matrixCB[0x60], // CB 60
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.B & 16) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x163: new SM83_opcode_functions(SM83_opcode_matrixCB[0x61], // CB 61
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.C & 16) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x164: new SM83_opcode_functions(SM83_opcode_matrixCB[0x62], // CB 62
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.D & 16) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x165: new SM83_opcode_functions(SM83_opcode_matrixCB[0x63], // CB 63
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.E & 16) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x166: new SM83_opcode_functions(SM83_opcode_matrixCB[0x64], // CB 64
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.H & 16) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x167: new SM83_opcode_functions(SM83_opcode_matrixCB[0x65], // CB 65
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.L & 16) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x168: new SM83_opcode_functions(SM83_opcode_matrixCB[0x66], // CB 66
        function(regs, pins) { //BIT_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.TR & 16) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x169: new SM83_opcode_functions(SM83_opcode_matrixCB[0x67], // CB 67
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.A & 16) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x16A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x68], // CB 68
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.B & 32) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x16B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x69], // CB 69
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.C & 32) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x16C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x6A], // CB 6A
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.D & 32) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x16D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x6B], // CB 6B
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.E & 32) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x16E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x6C], // CB 6C
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.H & 32) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x16F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x6D], // CB 6D
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.L & 32) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x170: new SM83_opcode_functions(SM83_opcode_matrixCB[0x6E], // CB 6E
        function(regs, pins) { //BIT_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.TR & 32) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x171: new SM83_opcode_functions(SM83_opcode_matrixCB[0x6F], // CB 6F
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.A & 32) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x172: new SM83_opcode_functions(SM83_opcode_matrixCB[0x70], // CB 70
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.B & 64) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x173: new SM83_opcode_functions(SM83_opcode_matrixCB[0x71], // CB 71
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.C & 64) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x174: new SM83_opcode_functions(SM83_opcode_matrixCB[0x72], // CB 72
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.D & 64) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x175: new SM83_opcode_functions(SM83_opcode_matrixCB[0x73], // CB 73
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.E & 64) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x176: new SM83_opcode_functions(SM83_opcode_matrixCB[0x74], // CB 74
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.H & 64) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x177: new SM83_opcode_functions(SM83_opcode_matrixCB[0x75], // CB 75
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.L & 64) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x178: new SM83_opcode_functions(SM83_opcode_matrixCB[0x76], // CB 76
        function(regs, pins) { //BIT_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.TR & 64) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x179: new SM83_opcode_functions(SM83_opcode_matrixCB[0x77], // CB 77
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.A & 64) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x17A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x78], // CB 78
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.B & 128) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x17B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x79], // CB 79
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.C & 128) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x17C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x7A], // CB 7A
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.D & 128) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x17D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x7B], // CB 7B
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.E & 128) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x17E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x7C], // CB 7C
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.H & 128) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x17F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x7D], // CB 7D
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.L & 128) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x180: new SM83_opcode_functions(SM83_opcode_matrixCB[0x7E], // CB 7E
        function(regs, pins) { //BIT_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                pins.Addr = ((regs.H << 8) | regs.L);
                break;
            case 2: // cleanup_custom
                regs.TR = pins.D;
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.TR & 128) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x181: new SM83_opcode_functions(SM83_opcode_matrixCB[0x7F], // CB 7F
        function(regs, pins) { //BIT_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.F.H = 1;
                regs.F.N = 0;
                regs.F.Z = +((regs.A & 128) === 0);
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x182: new SM83_opcode_functions(SM83_opcode_matrixCB[0x80], // CB 80
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B &= 0xFE;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x183: new SM83_opcode_functions(SM83_opcode_matrixCB[0x81], // CB 81
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C &= 0xFE;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x184: new SM83_opcode_functions(SM83_opcode_matrixCB[0x82], // CB 82
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D &= 0xFE;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x185: new SM83_opcode_functions(SM83_opcode_matrixCB[0x83], // CB 83
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E &= 0xFE;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x186: new SM83_opcode_functions(SM83_opcode_matrixCB[0x84], // CB 84
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H &= 0xFE;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x187: new SM83_opcode_functions(SM83_opcode_matrixCB[0x85], // CB 85
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L &= 0xFE;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x188: new SM83_opcode_functions(SM83_opcode_matrixCB[0x86], // CB 86
        function(regs, pins) { //RES_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                pins.Addr = (regs.TA);
                pins.D = regs.TR & 0xFE;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x189: new SM83_opcode_functions(SM83_opcode_matrixCB[0x87], // CB 87
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A &= 0xFE;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x18A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x88], // CB 88
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B &= 0xFD;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x18B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x89], // CB 89
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C &= 0xFD;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x18C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x8A], // CB 8A
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D &= 0xFD;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x18D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x8B], // CB 8B
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E &= 0xFD;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x18E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x8C], // CB 8C
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H &= 0xFD;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x18F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x8D], // CB 8D
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L &= 0xFD;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x190: new SM83_opcode_functions(SM83_opcode_matrixCB[0x8E], // CB 8E
        function(regs, pins) { //RES_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                pins.Addr = (regs.TA);
                pins.D = regs.TR & 0xFD;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x191: new SM83_opcode_functions(SM83_opcode_matrixCB[0x8F], // CB 8F
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A &= 0xFD;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x192: new SM83_opcode_functions(SM83_opcode_matrixCB[0x90], // CB 90
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B &= 0xFB;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x193: new SM83_opcode_functions(SM83_opcode_matrixCB[0x91], // CB 91
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C &= 0xFB;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x194: new SM83_opcode_functions(SM83_opcode_matrixCB[0x92], // CB 92
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D &= 0xFB;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x195: new SM83_opcode_functions(SM83_opcode_matrixCB[0x93], // CB 93
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E &= 0xFB;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x196: new SM83_opcode_functions(SM83_opcode_matrixCB[0x94], // CB 94
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H &= 0xFB;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x197: new SM83_opcode_functions(SM83_opcode_matrixCB[0x95], // CB 95
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L &= 0xFB;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x198: new SM83_opcode_functions(SM83_opcode_matrixCB[0x96], // CB 96
        function(regs, pins) { //RES_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                pins.Addr = (regs.TA);
                pins.D = regs.TR & 0xFB;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x199: new SM83_opcode_functions(SM83_opcode_matrixCB[0x97], // CB 97
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A &= 0xFB;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x19A: new SM83_opcode_functions(SM83_opcode_matrixCB[0x98], // CB 98
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B &= 0xF7;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x19B: new SM83_opcode_functions(SM83_opcode_matrixCB[0x99], // CB 99
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C &= 0xF7;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x19C: new SM83_opcode_functions(SM83_opcode_matrixCB[0x9A], // CB 9A
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D &= 0xF7;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x19D: new SM83_opcode_functions(SM83_opcode_matrixCB[0x9B], // CB 9B
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E &= 0xF7;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x19E: new SM83_opcode_functions(SM83_opcode_matrixCB[0x9C], // CB 9C
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H &= 0xF7;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x19F: new SM83_opcode_functions(SM83_opcode_matrixCB[0x9D], // CB 9D
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L &= 0xF7;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1A0: new SM83_opcode_functions(SM83_opcode_matrixCB[0x9E], // CB 9E
        function(regs, pins) { //RES_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                pins.Addr = (regs.TA);
                pins.D = regs.TR & 0xF7;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1A1: new SM83_opcode_functions(SM83_opcode_matrixCB[0x9F], // CB 9F
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A &= 0xF7;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1A2: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA0], // CB A0
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B &= 0xEF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1A3: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA1], // CB A1
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C &= 0xEF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1A4: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA2], // CB A2
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D &= 0xEF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1A5: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA3], // CB A3
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E &= 0xEF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1A6: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA4], // CB A4
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H &= 0xEF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1A7: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA5], // CB A5
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L &= 0xEF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1A8: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA6], // CB A6
        function(regs, pins) { //RES_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                pins.Addr = (regs.TA);
                pins.D = regs.TR & 0xEF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1A9: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA7], // CB A7
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A &= 0xEF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1AA: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA8], // CB A8
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B &= 0xDF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1AB: new SM83_opcode_functions(SM83_opcode_matrixCB[0xA9], // CB A9
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C &= 0xDF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1AC: new SM83_opcode_functions(SM83_opcode_matrixCB[0xAA], // CB AA
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D &= 0xDF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1AD: new SM83_opcode_functions(SM83_opcode_matrixCB[0xAB], // CB AB
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E &= 0xDF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1AE: new SM83_opcode_functions(SM83_opcode_matrixCB[0xAC], // CB AC
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H &= 0xDF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1AF: new SM83_opcode_functions(SM83_opcode_matrixCB[0xAD], // CB AD
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L &= 0xDF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1B0: new SM83_opcode_functions(SM83_opcode_matrixCB[0xAE], // CB AE
        function(regs, pins) { //RES_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                pins.Addr = (regs.TA);
                pins.D = regs.TR & 0xDF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1B1: new SM83_opcode_functions(SM83_opcode_matrixCB[0xAF], // CB AF
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A &= 0xDF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1B2: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB0], // CB B0
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B &= 0xBF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1B3: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB1], // CB B1
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C &= 0xBF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1B4: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB2], // CB B2
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D &= 0xBF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1B5: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB3], // CB B3
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E &= 0xBF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1B6: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB4], // CB B4
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H &= 0xBF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1B7: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB5], // CB B5
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L &= 0xBF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1B8: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB6], // CB B6
        function(regs, pins) { //RES_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                pins.Addr = (regs.TA);
                pins.D = regs.TR & 0xBF;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1B9: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB7], // CB B7
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A &= 0xBF;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1BA: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB8], // CB B8
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B &= 0x7F;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1BB: new SM83_opcode_functions(SM83_opcode_matrixCB[0xB9], // CB B9
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C &= 0x7F;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1BC: new SM83_opcode_functions(SM83_opcode_matrixCB[0xBA], // CB BA
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D &= 0x7F;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1BD: new SM83_opcode_functions(SM83_opcode_matrixCB[0xBB], // CB BB
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E &= 0x7F;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1BE: new SM83_opcode_functions(SM83_opcode_matrixCB[0xBC], // CB BC
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H &= 0x7F;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1BF: new SM83_opcode_functions(SM83_opcode_matrixCB[0xBD], // CB BD
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L &= 0x7F;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1C0: new SM83_opcode_functions(SM83_opcode_matrixCB[0xBE], // CB BE
        function(regs, pins) { //RES_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                pins.Addr = (regs.TA);
                pins.D = regs.TR & 0x7F;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1C1: new SM83_opcode_functions(SM83_opcode_matrixCB[0xBF], // CB BF
        function(regs, pins) { //RES_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A &= 0x7F;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1C2: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC0], // CB C0
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.B | 0x01;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1C3: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC1], // CB C1
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.C | 0x01;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1C4: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC2], // CB C2
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.D | 0x01;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1C5: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC3], // CB C3
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.E | 0x01;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1C6: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC4], // CB C4
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.H | 0x01;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1C7: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC5], // CB C5
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.L | 0x01;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1C8: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC6], // CB C6
        function(regs, pins) { //SET_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR |= 0x01;
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1C9: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC7], // CB C7
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.A | 0x01;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1CA: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC8], // CB C8
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.B | 0x02;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1CB: new SM83_opcode_functions(SM83_opcode_matrixCB[0xC9], // CB C9
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.C | 0x02;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1CC: new SM83_opcode_functions(SM83_opcode_matrixCB[0xCA], // CB CA
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.D | 0x02;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1CD: new SM83_opcode_functions(SM83_opcode_matrixCB[0xCB], // CB CB
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.E | 0x02;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1CE: new SM83_opcode_functions(SM83_opcode_matrixCB[0xCC], // CB CC
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.H | 0x02;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1CF: new SM83_opcode_functions(SM83_opcode_matrixCB[0xCD], // CB CD
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.L | 0x02;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1D0: new SM83_opcode_functions(SM83_opcode_matrixCB[0xCE], // CB CE
        function(regs, pins) { //SET_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR |= 0x02;
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1D1: new SM83_opcode_functions(SM83_opcode_matrixCB[0xCF], // CB CF
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.A | 0x02;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1D2: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD0], // CB D0
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.B | 0x04;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1D3: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD1], // CB D1
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.C | 0x04;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1D4: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD2], // CB D2
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.D | 0x04;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1D5: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD3], // CB D3
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.E | 0x04;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1D6: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD4], // CB D4
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.H | 0x04;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1D7: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD5], // CB D5
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.L | 0x04;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1D8: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD6], // CB D6
        function(regs, pins) { //SET_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR |= 0x04;
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1D9: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD7], // CB D7
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.A | 0x04;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1DA: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD8], // CB D8
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.B | 0x08;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1DB: new SM83_opcode_functions(SM83_opcode_matrixCB[0xD9], // CB D9
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.C | 0x08;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1DC: new SM83_opcode_functions(SM83_opcode_matrixCB[0xDA], // CB DA
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.D | 0x08;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1DD: new SM83_opcode_functions(SM83_opcode_matrixCB[0xDB], // CB DB
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.E | 0x08;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1DE: new SM83_opcode_functions(SM83_opcode_matrixCB[0xDC], // CB DC
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.H | 0x08;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1DF: new SM83_opcode_functions(SM83_opcode_matrixCB[0xDD], // CB DD
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.L | 0x08;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1E0: new SM83_opcode_functions(SM83_opcode_matrixCB[0xDE], // CB DE
        function(regs, pins) { //SET_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR |= 0x08;
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1E1: new SM83_opcode_functions(SM83_opcode_matrixCB[0xDF], // CB DF
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.A | 0x08;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1E2: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE0], // CB E0
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.B | 0x10;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1E3: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE1], // CB E1
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.C | 0x10;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1E4: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE2], // CB E2
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.D | 0x10;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1E5: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE3], // CB E3
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.E | 0x10;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1E6: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE4], // CB E4
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.H | 0x10;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1E7: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE5], // CB E5
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.L | 0x10;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1E8: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE6], // CB E6
        function(regs, pins) { //SET_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR |= 0x10;
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1E9: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE7], // CB E7
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.A | 0x10;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1EA: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE8], // CB E8
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.B | 0x20;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1EB: new SM83_opcode_functions(SM83_opcode_matrixCB[0xE9], // CB E9
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.C | 0x20;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1EC: new SM83_opcode_functions(SM83_opcode_matrixCB[0xEA], // CB EA
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.D | 0x20;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1ED: new SM83_opcode_functions(SM83_opcode_matrixCB[0xEB], // CB EB
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.E | 0x20;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1EE: new SM83_opcode_functions(SM83_opcode_matrixCB[0xEC], // CB EC
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.H | 0x20;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1EF: new SM83_opcode_functions(SM83_opcode_matrixCB[0xED], // CB ED
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.L | 0x20;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1F0: new SM83_opcode_functions(SM83_opcode_matrixCB[0xEE], // CB EE
        function(regs, pins) { //SET_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR |= 0x20;
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1F1: new SM83_opcode_functions(SM83_opcode_matrixCB[0xEF], // CB EF
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.A | 0x20;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1F2: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF0], // CB F0
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.B | 0x40;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1F3: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF1], // CB F1
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.C | 0x40;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1F4: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF2], // CB F2
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.D | 0x40;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1F5: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF3], // CB F3
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.E | 0x40;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1F6: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF4], // CB F4
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.H | 0x40;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1F7: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF5], // CB F5
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.L | 0x40;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1F8: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF6], // CB F6
        function(regs, pins) { //SET_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR |= 0x40;
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x1F9: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF7], // CB F7
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.A | 0x40;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1FA: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF8], // CB F8
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.B = regs.B | 0x80;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1FB: new SM83_opcode_functions(SM83_opcode_matrixCB[0xF9], // CB F9
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.C = regs.C | 0x80;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1FC: new SM83_opcode_functions(SM83_opcode_matrixCB[0xFA], // CB FA
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.D = regs.D | 0x80;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1FD: new SM83_opcode_functions(SM83_opcode_matrixCB[0xFB], // CB FB
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.E = regs.E | 0x80;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1FE: new SM83_opcode_functions(SM83_opcode_matrixCB[0xFC], // CB FC
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.H = regs.H | 0x80;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x1FF: new SM83_opcode_functions(SM83_opcode_matrixCB[0xFD], // CB FD
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.L = regs.L | 0x80;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x200: new SM83_opcode_functions(SM83_opcode_matrixCB[0xFE], // CB FE
        function(regs, pins) { //SET_idx_ind
        switch(regs.TCU) {
            case 1: // Do read
                regs.TA = (regs.H << 8) | regs.L
                pins.Addr = (regs.TA);
                break;
            case 2: // Do write
                regs.TR = pins.D;
                regs.TR |= 0x80;
                pins.Addr = (regs.TA);
                pins.D = regs.TR;
                // Following is auto-generated code for instruction finish
                pins.RD = 0; pins.WR = 1;
                break;
            case 3: // cleanup_custom
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                pins.RD = 1; pins.WR = 0;
                break;
        }
    }),
    0x201: new SM83_opcode_functions(SM83_opcode_matrixCB[0xFF], // CB FF
        function(regs, pins) { //SET_idx_di
        switch(regs.TCU) {
            case 1: // cleanup_custom
                regs.A = regs.A | 0x80;
                // Following is auto-generated code for instruction finish
                pins.Addr = regs.PC;
                regs.PC = (regs.PC + 1) & 0xFFFF;
                regs.TCU = 0;
                regs.IR = SM83_S_DECODE;
                regs.poll_IRQ = true;
                break;
        }
    }),
    0x202: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    }),
    0x203: new SM83_opcode_functions(SM83_opcode_matrix[0x00],
        function(regs, pins) { //NOP
    })
});