import {SM83_opcode_functions, SM83_opcode_matrix, SM83_opcode_matrixCB, SM83_MAX_OPCODE, SM83_S_DECODE} from "../../../component/cpu/sm83/sm83_opcodes";
import {SM83_pins_t, SM83_regs_t} from "./sm83";
import {mksigned8} from "../../../helpers/helpers"

export var sm83_decoded_opcodes: Array<SM83_opcode_functions> = new Array<SM83_opcode_functions>(SM83_MAX_OPCODE+0xFF);

function sm83_get_opcode_function(opcode: u32): SM83_opcode_functions {
    switch(opcode) {
        case 0x00: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x01: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x01),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD16_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TR = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x02: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x02),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_di
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
        });
        case 0x03: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x03),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC16_di
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
        });
        case 0x04: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x04),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.B = ((regs.B) + 1) & 0xFF;
                    regs.F.H = +(((regs.B) & 0x0F) == 0);
                    regs.F.N = 0;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x05: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x05),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.B = ((regs.B) - 1) & 0xFF;
                    regs.F.H = +(((regs.B) & 0x0F) == 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x06: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x06),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x07: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x07),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLCA
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.A = ((regs.A << 1) | (regs.A >>> 7)) & 0xFF;
                    regs.F.C = regs.A & 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    regs.F.Z = 0;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x08: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x08),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD16_addr_di
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x09: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x09),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD16_di_di
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
        });
        case 0x0A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x0A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind
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
        });
        case 0x0B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x0B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC16_di
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
        });
        case 0x0C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x0C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.C = ((regs.C) + 1) & 0xFF;
                    regs.F.H = +(((regs.C) & 0x0F) == 0);
                    regs.F.N = 0;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x0D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x0D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.C = ((regs.C) - 1) & 0xFF;
                    regs.F.H = +(((regs.C) & 0x0F) == 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x0E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x0E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x0F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x0F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRCA
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.A = (((regs.A) << 7) | ((regs.A) >>> 1)) & 0xFF;
                    regs.F.C = ((regs.A) & 0x80) >>> 7;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    regs.F.Z = 0;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x10: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x10),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // STOP
            switch(regs.TCU) {
                case 1:
                    if (!regs.stoppable()) {break;}
                    console.log('STP!');
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
        });
        case 0x11: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x11),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD16_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TR = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x12: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x12),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_di
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
        });
        case 0x13: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x13),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC16_di
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
        });
        case 0x14: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x14),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.D = ((regs.D) + 1) & 0xFF;
                    regs.F.H = +(((regs.D) & 0x0F) == 0);
                    regs.F.N = 0;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x15: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x15),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.D = ((regs.D) - 1) & 0xFF;
                    regs.F.H = +(((regs.D) & 0x0F) == 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x16: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x16),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x17: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x17),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLA
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.A) & 0x80) >>> 7;
                    regs.A = (((regs.A) << 1) & 0xFE) | regs.F.C;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    regs.F.Z = 0;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x18: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x18),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JR_cond_rel
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x19: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x19),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD16_di_di
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
        });
        case 0x1A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x1A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind
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
        });
        case 0x1B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x1B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC16_di
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
        });
        case 0x1C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x1C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.E = ((regs.E) + 1) & 0xFF;
                    regs.F.H = +(((regs.E) & 0x0F) == 0);
                    regs.F.N = 0;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x1D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x1D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.E = ((regs.E) - 1) & 0xFF;
                    regs.F.H = +(((regs.E) & 0x0F) == 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x1E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x1E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x1F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x1F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRA
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.A) & 1;
                    regs.A = ((regs.A) >>> 1) | (regs.F.C << 7);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    regs.F.Z = 0;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x20: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x20),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JR_cond_rel
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.Z == 0)) { regs.TCU += 1; break; } // CHECKHERE
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
        });
        case 0x21: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x21),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD16_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TR = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x22: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x22),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_inc_di
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
        });
        case 0x23: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x23),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC16_di
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
        });
        case 0x24: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x24),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.H = ((regs.H) + 1) & 0xFF;
                    regs.F.H = +(((regs.H) & 0x0F) == 0);
                    regs.F.N = 0;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x25: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x25),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.H = ((regs.H) - 1) & 0xFF;
                    regs.F.H = +(((regs.H) & 0x0F) == 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x26: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x26),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x27: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x27),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DAA
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
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x28: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x28),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JR_cond_rel
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.Z == 1)) { regs.TCU += 1; break; } // CHECKHERE
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
        });
        case 0x29: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x29),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD16_di_di
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
        });
        case 0x2A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x2A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind_inc
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
        });
        case 0x2B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x2B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC16_di
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
        });
        case 0x2C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x2C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.L = ((regs.L) + 1) & 0xFF;
                    regs.F.H = +(((regs.L) & 0x0F) == 0);
                    regs.F.N = 0;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x2D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x2D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.L = ((regs.L) - 1) & 0xFF;
                    regs.F.H = +(((regs.L) & 0x0F) == 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x2E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x2E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x2F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x2F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CPL
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
        });
        case 0x30: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x30),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JR_cond_rel
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.C == 0)) { regs.TCU += 1; break; } // CHECKHERE
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
        });
        case 0x31: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x31),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD16_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TR = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x32: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x32),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_dec_di
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
        });
        case 0x33: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x33),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC16_di
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
        });
        case 0x34: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x34),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC_ind
            switch(regs.TCU) {
                case 1: // Do read
                    regs.TA = (regs.H << 8) | regs.L;
                    pins.Addr = (regs.TA);
                    break;
                case 2: // Do write
                    regs.TR = pins.D;
                    regs.TR = ((regs.TR) + 1) & 0xFF;
                    regs.F.H = +(((regs.TR) & 0x0F) == 0);
                    regs.F.N = 0;
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x35: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x35),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC_ind
            switch(regs.TCU) {
                case 1: // Do read
                    regs.TA = (regs.H << 8) | regs.L;
                    pins.Addr = (regs.TA);
                    break;
                case 2: // Do write
                    regs.TR = pins.D;
                    regs.TR = ((regs.TR) - 1) & 0xFF;
                    regs.F.H = +(((regs.TR) & 0x0F) == 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x36: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x36),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x37: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x37),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SCF
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
        });
        case 0x38: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x38),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JR_cond_rel
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.C == 1)) { regs.TCU += 1; break; } // CHECKHERE
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
        });
        case 0x39: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x39),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD16_di_di
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
        });
        case 0x3A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x3A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind_dec
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
        });
        case 0x3B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x3B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC16_di
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
        });
        case 0x3C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x3C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // INC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.A = ((regs.A) + 1) & 0xFF;
                    regs.F.H = +(((regs.A) & 0x0F) == 0);
                    regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x3D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x3D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DEC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.A = ((regs.A) - 1) & 0xFF;
                    regs.F.H = +(((regs.A) & 0x0F) == 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x3E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x3E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0x3F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x3F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CCF
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
        });
        case 0x40: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x40),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x41: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x41),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x42: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x42),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x43: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x43),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x44: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x44),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x45: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x45),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x46: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x46),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind
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
        });
        case 0x47: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x47),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x48: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x48),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x49: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x49),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x4A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x4A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x4B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x4B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x4C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x4C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x4D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x4D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x4E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x4E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind
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
        });
        case 0x4F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x4F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x50: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x50),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x51: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x51),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x52: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x52),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x53: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x53),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x54: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x54),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x55: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x55),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x56: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x56),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind
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
        });
        case 0x57: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x57),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x58: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x58),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x59: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x59),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x5A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x5A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x5B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x5B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x5C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x5C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x5D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x5D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x5E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x5E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind
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
        });
        case 0x5F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x5F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x60: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x60),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x61: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x61),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x62: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x62),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x63: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x63),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x64: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x64),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x65: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x65),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x66: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x66),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind
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
        });
        case 0x67: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x67),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x68: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x68),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x69: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x69),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x6A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x6A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x6B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x6B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x6C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x6C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x6D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x6D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x6E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x6E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind
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
        });
        case 0x6F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x6F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x70: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x70),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_di
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
        });
        case 0x71: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x71),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_di
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
        });
        case 0x72: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x72),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_di
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
        });
        case 0x73: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x73),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_di
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
        });
        case 0x74: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x74),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_di
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
        });
        case 0x75: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x75),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_di
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
        });
        case 0x76: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x76),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // HALT
            switch(regs.TCU) {
                case 1:
                    console.log('HALT!');
                    if ((!regs.IME) && (regs.interrupt_latch !== 0)) regs.halt_bug = 1; 
                    regs.HLT = 1;
                    if (regs.HLT) { regs.poll_IRQ = true; regs.TCU--; }
                    pins.RD = 0; pins.MRQ = 0;
                    break;
                case 2: // cleanup_custom
                    //YOYOYO
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    pins.RD = 1; pins.MRQ = 1;
                    break;
            }
        });
        case 0x77: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x77),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_ind_di
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
        });
        case 0x78: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x78),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x79: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x79),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x7A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x7A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x7B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x7B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x7C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x7C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x7D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x7D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x7E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x7E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_ind
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
        });
        case 0x7F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x7F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di
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
        });
        case 0x80: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x80),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.B);
                    let y = ((regs.A) & 0x0F) + ((regs.B) & 0x0F);
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x81: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x81),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.C);
                    let y = ((regs.A) & 0x0F) + ((regs.C) & 0x0F);
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x82: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x82),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.D);
                    let y = ((regs.A) & 0x0F) + ((regs.D) & 0x0F);
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x83: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x83),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.E);
                    let y = ((regs.A) & 0x0F) + ((regs.E) & 0x0F);
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x84: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x84),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.H);
                    let y = ((regs.A) & 0x0F) + ((regs.H) & 0x0F);
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x85: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x85),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.L);
                    let y = ((regs.A) & 0x0F) + ((regs.L) & 0x0F);
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x86: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x86),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_ind
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
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x87: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x87),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.A);
                    let y = ((regs.A) & 0x0F) + ((regs.A) & 0x0F);
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x88: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x88),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.B) + regs.F.C;
                    let y = ((regs.A) & 0x0F) + ((regs.B) & 0x0F) + regs.F.C;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x89: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x89),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.C) + regs.F.C;
                    let y = ((regs.A) & 0x0F) + ((regs.C) & 0x0F) + regs.F.C;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x8A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x8A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.D) + regs.F.C;
                    let y = ((regs.A) & 0x0F) + ((regs.D) & 0x0F) + regs.F.C;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x8B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x8B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.E) + regs.F.C;
                    let y = ((regs.A) & 0x0F) + ((regs.E) & 0x0F) + regs.F.C;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x8C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x8C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.H) + regs.F.C;
                    let y = ((regs.A) & 0x0F) + ((regs.H) & 0x0F) + regs.F.C;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x8D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x8D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.L) + regs.F.C;
                    let y = ((regs.A) & 0x0F) + ((regs.L) & 0x0F) + regs.F.C;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x8E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x8E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADC_di_ind
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
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x8F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x8F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = (regs.A) + (regs.A) + regs.F.C;
                    let y = ((regs.A) & 0x0F) + ((regs.A) & 0x0F) + regs.F.C;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x90: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x90),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SUB_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.B)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.B) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x91: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x91),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SUB_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.C)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.C) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x92: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x92),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SUB_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.D)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.D) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x93: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x93),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SUB_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.E)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.E) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x94: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x94),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SUB_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.H)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.H) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x95: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x95),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SUB_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.L)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.L) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x96: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x96),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SUB_di_ind
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
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x97: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x97),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SUB_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.A)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.A) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x98: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x98),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SBC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.B) - regs.F.C) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.B) &0x0F) - regs.F.C) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x99: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x99),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SBC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.C) - regs.F.C) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.C) &0x0F) - regs.F.C) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x9A: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x9A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SBC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.D) - regs.F.C) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.D) &0x0F) - regs.F.C) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x9B: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x9B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SBC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.E) - regs.F.C) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.E) &0x0F) - regs.F.C) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x9C: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x9C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SBC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.H) - regs.F.C) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.H) &0x0F) - regs.F.C) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x9D: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x9D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SBC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.L) - regs.F.C) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.L) &0x0F) - regs.F.C) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x9E: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x9E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SBC_di_ind
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
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x9F: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x9F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SBC_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.A) - regs.F.C) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.A) &0x0F) - regs.F.C) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA0: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // AND_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) & (regs.B);
                    regs.F.C = regs.F.N = 0;
                    regs.F.H = 1;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA1: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // AND_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) & (regs.C);
                    regs.F.C = regs.F.N = 0;
                    regs.F.H = 1;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA2: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // AND_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) & (regs.D);
                    regs.F.C = regs.F.N = 0;
                    regs.F.H = 1;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA3: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // AND_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) & (regs.E);
                    regs.F.C = regs.F.N = 0;
                    regs.F.H = 1;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA4: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // AND_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) & (regs.H);
                    regs.F.C = regs.F.N = 0;
                    regs.F.H = 1;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA5: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // AND_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) & (regs.L);
                    regs.F.C = regs.F.N = 0;
                    regs.F.H = 1;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA6: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // AND_di_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (regs.A) & (regs.TR);
                    regs.F.C = regs.F.N = 0;
                    regs.F.H = 1;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA7: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // AND_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) & (regs.A);
                    regs.F.C = regs.F.N = 0;
                    regs.F.H = 1;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA8: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // XOR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) ^ (regs.B);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xA9: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xA9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // XOR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) ^ (regs.C);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xAA: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xAA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // XOR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) ^ (regs.D);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xAB: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xAB),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // XOR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) ^ (regs.E);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xAC: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xAC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // XOR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) ^ (regs.H);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xAD: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xAD),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // XOR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) ^ (regs.L);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xAE: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xAE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // XOR_di_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (regs.A) ^ (regs.TR);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xAF: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xAF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // XOR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) ^ (regs.A);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB0: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // OR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) | (regs.B);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB1: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // OR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) | (regs.C);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB2: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // OR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) | (regs.D);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB3: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // OR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) | (regs.E);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB4: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // OR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) | (regs.H);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB5: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // OR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) | (regs.L);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB6: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // OR_di_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (regs.A) | (regs.TR);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB7: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // OR_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.TR = (regs.A) | (regs.A);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB8: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CP_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.B)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.B) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((x & 0xFF) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xB9: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xB9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CP_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.C)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.C) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((x & 0xFF) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xBA: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xBA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CP_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.D)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.D) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((x & 0xFF) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xBB: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xBB),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CP_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.E)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.E) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((x & 0xFF) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xBC: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xBC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CP_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.H)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.H) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((x & 0xFF) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xBD: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xBD),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CP_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.L)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.L) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((x & 0xFF) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xBE: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xBE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CP_di_ind
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
                    regs.F.Z = +((x & 0xFF) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xBF: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xBF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CP_di_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let x = ((regs.A) - (regs.A)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.A) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((x & 0xFF) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xC0: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RET_cond
            switch(regs.TCU) {
                case 1:
                    if (!(regs.F.Z == 0)) { pins.RD = 0; pins.MRQ = 0; regs.TCU += 3; break; } // CHECKHERE
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
        });
        case 0xC1: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // POP_di
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
        });
        case 0xC2: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JP_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.Z == 0)) { regs.TCU++; }
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
                    regs.PC = regs.TA
                    pins.RD = 0; pins.MRQ = 0;
                    break;
                case 4: // cleanup_custom
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    pins.RD = 1; pins.MRQ = 1;
                    break;
            }
        });
        case 0xC3: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JP_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
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
        });
        case 0xC4: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CALL_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.Z == 0)) { regs.TCU += 3; break; } // CHECKHERE
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
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
        });
        case 0xC5: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // PUSH_di
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
        });
        case 0xC6: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    let x = (regs.A) + (regs.TR);
                    let y = ((regs.A) & 0x0F) + ((regs.TR) & 0x0F);
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xC7: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RST_imp
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
        });
        case 0xC8: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RET_cond
            switch(regs.TCU) {
                case 1:
                    if (!(regs.F.Z == 1)) { pins.RD = 0; pins.MRQ = 0; regs.TCU += 3; break; } // CHECKHERE
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
        });
        case 0xC9: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xC9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RET
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
        });
        case 0xCA: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xCA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JP_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.Z == 1)) { regs.TCU++; }
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
                    regs.PC = regs.TA
                    pins.RD = 0; pins.MRQ = 0;
                    break;
                case 4: // cleanup_custom
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    pins.RD = 1; pins.MRQ = 1;
                    break;
            }
        });
        case 0xCB: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xCC: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xCC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CALL_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.Z == 1)) { regs.TCU += 3; break; } // CHECKHERE
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
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
        });
        case 0xCD: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xCD),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CALL_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(1)) { regs.TCU += 3; break; } // CHECKHERE
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
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
        });
        case 0xCE: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xCE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADC_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    let x = (regs.A) + (regs.TR) + regs.F.C;
                    let y = ((regs.A) & 0x0F) + ((regs.TR) & 0x0F) + regs.F.C;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 0;
                    regs.TR = (x & 0xFF);
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xCF: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xCF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RST_imp
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
        });
        case 0xD0: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xD0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RET_cond
            switch(regs.TCU) {
                case 1:
                    if (!(regs.F.C == 0)) { pins.RD = 0; pins.MRQ = 0; regs.TCU += 3; break; } // CHECKHERE
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
        });
        case 0xD1: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xD1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // POP_di
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
        });
        case 0xD2: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xD2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JP_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.C == 0)) { regs.TCU++; }
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
                    regs.PC = regs.TA
                    pins.RD = 0; pins.MRQ = 0;
                    break;
                case 4: // cleanup_custom
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    pins.RD = 1; pins.MRQ = 1;
                    break;
            }
        });
        case 0xD3: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xD4: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xD4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CALL_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.C == 0)) { regs.TCU += 3; break; } // CHECKHERE
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
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
        });
        case 0xD5: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xD5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // PUSH_di
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
        });
        case 0xD6: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xD6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SUB_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    let x = ((regs.A) - (regs.TR)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.TR) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xD7: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xD7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RST_imp
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
        });
        case 0xD8: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xD8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RET_cond
            switch(regs.TCU) {
                case 1:
                    if (!(regs.F.C == 1)) { pins.RD = 0; pins.MRQ = 0; regs.TCU += 3; break; } // CHECKHERE
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
        });
        case 0xD9: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xD9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RETI
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
        });
        case 0xDA: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xDA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JP_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.C == 1)) { regs.TCU++; }
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
                    regs.PC = regs.TA
                    pins.RD = 0; pins.MRQ = 0;
                    break;
                case 4: // cleanup_custom
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    pins.RD = 1; pins.MRQ = 1;
                    break;
            }
        });
        case 0xDB: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xDC: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xDC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CALL_cond_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    if (!(regs.F.C == 1)) { regs.TCU += 3; break; } // CHECKHERE
                    break;
                case 3:
                    regs.RR = pins.D;
                    regs.TA |= (regs.RR << 8);
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
        });
        case 0xDD: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xDE: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xDE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SBC_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    let x = ((regs.A) - (regs.TR) - regs.F.C) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.TR) &0x0F) - regs.F.C) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.TR = x & 0xFF;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xDF: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xDF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RST_imp
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
        });
        case 0xE0: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xE0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LDH_addr_di
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0xE1: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xE1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // POP_di
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
        });
        case 0xE2: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xE2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LDH_ind_di
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
        });
        case 0xE3: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xE4: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xE5: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xE5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // PUSH_di
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
        });
        case 0xE6: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xE6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // AND_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (regs.A) & (regs.TR);
                    regs.F.C = regs.F.N = 0;
                    regs.F.H = 1;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xE7: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xE7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RST_imp
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
        });
        case 0xE8: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xE8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // ADD_di_rel
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0xE9: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xE9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // JP_di
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
        });
        case 0xEA: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xEA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_addr_di
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0xEB: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xEC: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xED: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xEE: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xEE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // XOR_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (regs.A) ^ (regs.TR);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xEF: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xEF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RST_imp
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
        });
        case 0xF0: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xF0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LDH_di_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0xF1: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xF1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // POP_di_AF
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
        });
        case 0xF2: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xF2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LDH_di_ind
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
        });
        case 0xF3: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xF3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // DI
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.IME = 0;
                    console.log('DI!');
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xF4: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xF5: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xF5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // PUSH_di
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
        });
        case 0xF6: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xF6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // OR_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.TR = (regs.A) | (regs.TR);
                    regs.F.C = regs.F.N = regs.F.H = 0;
                    regs.F.Z = +((regs.TR) == 0);
                    regs.A = regs.TR;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xF7: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xF7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RST_imp
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
        });
        case 0xF8: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xF8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_di_rel
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0xF9: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xF9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD16_di_di
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
        });
        case 0xFA: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xFA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // LD_di_addr
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // Do read
                    regs.TA = pins.D;
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
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
        });
        case 0xFB: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xFB),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // EI
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    console.log('EI!');
                    regs.IME_DELAY = 2;
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xFC: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xFD: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xFE: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xFE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // CP_di_da
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = (regs.PC);
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    let x = ((regs.A) - (regs.TR)) & 0xFFFF;
                    let y = (((regs.A) & 0x0F) - ((regs.TR) & 0x0F)) & 0xFFFF;
                    regs.F.C = +(x > 0xFF);
                    regs.F.H = +(y > 0x0F);
                    regs.F.N = 1;
                    regs.F.Z = +((x & 0xFF) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0xFF: return new SM83_opcode_functions(SM83_opcode_matrix.get(0xFF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RST_imp
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
        });
        case 0x100: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x100),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // S_IRQ
            switch(regs.TCU) {
                case 1:
                    regs.IME = 0;
                    pins.RD = 0; pins.MRQ = 0;
                    break;
                case 2:
                    regs.PC = (regs.PC - 1) & 0xFFFF;
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
        });
        case 0x101: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x101),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RESET
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
        });
        case 0x102: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.B = ((regs.B << 1) | (regs.B >>> 7)) & 0xFF;
                    regs.F.C = regs.B & 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x103: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x01),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.C = ((regs.C << 1) | (regs.C >>> 7)) & 0xFF;
                    regs.F.C = regs.C & 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x104: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x02),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.D = ((regs.D << 1) | (regs.D >>> 7)) & 0xFF;
                    regs.F.C = regs.D & 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x105: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x03),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.E = ((regs.E << 1) | (regs.E >>> 7)) & 0xFF;
                    regs.F.C = regs.E & 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x106: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x04),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.H = ((regs.H << 1) | (regs.H >>> 7)) & 0xFF;
                    regs.F.C = regs.H & 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x107: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x05),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.L = ((regs.L << 1) | (regs.L >>> 7)) & 0xFF;
                    regs.F.C = regs.L & 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x108: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x06),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLC_ind
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
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x109: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x07),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RLC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.A = ((regs.A << 1) | (regs.A >>> 7)) & 0xFF;
                    regs.F.C = regs.A & 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x10A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x08),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.B = (((regs.B) << 7) | ((regs.B) >>> 1)) & 0xFF;
                    regs.F.C = ((regs.B) & 0x80) >>> 7;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x10B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x09),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.C = (((regs.C) << 7) | ((regs.C) >>> 1)) & 0xFF;
                    regs.F.C = ((regs.C) & 0x80) >>> 7;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x10C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x0A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.D = (((regs.D) << 7) | ((regs.D) >>> 1)) & 0xFF;
                    regs.F.C = ((regs.D) & 0x80) >>> 7;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x10D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x0B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.E = (((regs.E) << 7) | ((regs.E) >>> 1)) & 0xFF;
                    regs.F.C = ((regs.E) & 0x80) >>> 7;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x10E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x0C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.H = (((regs.H) << 7) | ((regs.H) >>> 1)) & 0xFF;
                    regs.F.C = ((regs.H) & 0x80) >>> 7;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x10F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x0D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.L = (((regs.L) << 7) | ((regs.L) >>> 1)) & 0xFF;
                    regs.F.C = ((regs.L) & 0x80) >>> 7;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x110: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x0E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRC_ind
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
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x111: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x0F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RRC_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.A = (((regs.A) << 7) | ((regs.A) >>> 1)) & 0xFF;
                    regs.F.C = ((regs.A) & 0x80) >>> 7;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x112: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x10),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.B) & 0x80) >>> 7;
                    regs.B = (((regs.B) << 1) & 0xFE) | regs.F.C;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x113: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x11),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.C) & 0x80) >>> 7;
                    regs.C = (((regs.C) << 1) & 0xFE) | regs.F.C;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x114: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x12),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.D) & 0x80) >>> 7;
                    regs.D = (((regs.D) << 1) & 0xFE) | regs.F.C;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x115: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x13),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.E) & 0x80) >>> 7;
                    regs.E = (((regs.E) << 1) & 0xFE) | regs.F.C;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x116: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x14),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.H) & 0x80) >>> 7;
                    regs.H = (((regs.H) << 1) & 0xFE) | regs.F.C;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x117: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x15),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.L) & 0x80) >>> 7;
                    regs.L = (((regs.L) << 1) & 0xFE) | regs.F.C;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x118: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x16),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RL_ind
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
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x119: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x17),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.A) & 0x80) >>> 7;
                    regs.A = (((regs.A) << 1) & 0xFE) | regs.F.C;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x11A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x18),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RR_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.B) & 1;
                    regs.B = ((regs.B) >>> 1) | (regs.F.C << 7);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x11B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x19),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RR_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.C) & 1;
                    regs.C = ((regs.C) >>> 1) | (regs.F.C << 7);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x11C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x1A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RR_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.D) & 1;
                    regs.D = ((regs.D) >>> 1) | (regs.F.C << 7);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x11D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x1B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RR_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.E) & 1;
                    regs.E = ((regs.E) >>> 1) | (regs.F.C << 7);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x11E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x1C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RR_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.H) & 1;
                    regs.H = ((regs.H) >>> 1) | (regs.F.C << 7);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x11F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x1D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RR_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.L) & 1;
                    regs.L = ((regs.L) >>> 1) | (regs.F.C << 7);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x120: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x1E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RR_ind
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
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x121: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x1F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RR_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.A) & 1;
                    regs.A = ((regs.A) >>> 1) | (regs.F.C << 7);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x122: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x20),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SLA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.B) & 0x80) >>> 7;
                    regs.B = ((regs.B) << 1) & 0xFF;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x123: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x21),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SLA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.C) & 0x80) >>> 7;
                    regs.C = ((regs.C) << 1) & 0xFF;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x124: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x22),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SLA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.D) & 0x80) >>> 7;
                    regs.D = ((regs.D) << 1) & 0xFF;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x125: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x23),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SLA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.E) & 0x80) >>> 7;
                    regs.E = ((regs.E) << 1) & 0xFF;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x126: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x24),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SLA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.H) & 0x80) >>> 7;
                    regs.H = ((regs.H) << 1) & 0xFF;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x127: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x25),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SLA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.L) & 0x80) >>> 7;
                    regs.L = ((regs.L) << 1) & 0xFF;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x128: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x26),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SLA_ind
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
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x129: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x27),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SLA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = ((regs.A) & 0x80) >>> 7;
                    regs.A = ((regs.A) << 1) & 0xFF;
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x12A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x28),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.B) & 1;
                    regs.B = ((regs.B) & 0x80) | ((regs.B) >>> 1);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x12B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x29),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.C) & 1;
                    regs.C = ((regs.C) & 0x80) | ((regs.C) >>> 1);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x12C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x2A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.D) & 1;
                    regs.D = ((regs.D) & 0x80) | ((regs.D) >>> 1);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x12D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x2B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.E) & 1;
                    regs.E = ((regs.E) & 0x80) | ((regs.E) >>> 1);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x12E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x2C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.H) & 1;
                    regs.H = ((regs.H) & 0x80) | ((regs.H) >>> 1);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x12F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x2D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.L) & 1;
                    regs.L = ((regs.L) & 0x80) | ((regs.L) >>> 1);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x130: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x2E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRA_ind
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
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x131: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x2F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRA_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    let carry = (regs.A) & 1;
                    regs.A = ((regs.A) & 0x80) | ((regs.A) >>> 1);
                    regs.F.C = carry;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x132: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x30),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SWAP_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.B = (((regs.B) << 4) | ((regs.B) >>> 4)) & 0xFF;
                    regs.F.C = regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x133: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x31),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SWAP_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.C = (((regs.C) << 4) | ((regs.C) >>> 4)) & 0xFF;
                    regs.F.C = regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x134: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x32),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SWAP_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.D = (((regs.D) << 4) | ((regs.D) >>> 4)) & 0xFF;
                    regs.F.C = regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x135: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x33),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SWAP_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.E = (((regs.E) << 4) | ((regs.E) >>> 4)) & 0xFF;
                    regs.F.C = regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x136: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x34),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SWAP_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.H = (((regs.H) << 4) | ((regs.H) >>> 4)) & 0xFF;
                    regs.F.C = regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x137: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x35),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SWAP_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.L = (((regs.L) << 4) | ((regs.L) >>> 4)) & 0xFF;
                    regs.F.C = regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x138: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x36),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SWAP_ind
            switch(regs.TCU) {
                case 1: // Do read
                    regs.TA = (regs.H << 8) | regs.L
                    pins.Addr = (regs.TA);
                    break;
                case 2: // Do write
                    regs.TR = pins.D;
                    regs.TR = (((regs.TR) << 4) | ((regs.TR) >>> 4)) & 0xFF;
                    regs.F.C = regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x139: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x37),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SWAP_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.A = (((regs.A) << 4) | ((regs.A) >>> 4)) & 0xFF;
                    regs.F.C = regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x13A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x38),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.C = (regs.B) & 1;
                    regs.B = (regs.B) >>> 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.B) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x13B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x39),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.C = (regs.C) & 1;
                    regs.C = (regs.C) >>> 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.C) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x13C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x3A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.C = (regs.D) & 1;
                    regs.D = (regs.D) >>> 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.D) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x13D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x3B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.C = (regs.E) & 1;
                    regs.E = (regs.E) >>> 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.E) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x13E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x3C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.C = (regs.H) & 1;
                    regs.H = (regs.H) >>> 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.H) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x13F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x3D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.C = (regs.L) & 1;
                    regs.L = (regs.L) >>> 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.L) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x140: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x3E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRL_ind
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
                    regs.F.Z = +((regs.TR) == 0);
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
        });
        case 0x141: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x3F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SRL_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.C = (regs.A) & 1;
                    regs.A = (regs.A) >>> 1;
                    regs.F.H = regs.F.N = 0;
                    regs.F.Z = +((regs.A) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x142: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x40),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.B & 1) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x143: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x41),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.C & 1) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x144: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x42),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.D & 1) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x145: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x43),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.E & 1) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x146: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x44),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.H & 1) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x147: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x45),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.L & 1) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x148: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x46),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.TR & 1) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x149: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x47),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.A & 1) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x14A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x48),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.B & 2) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x14B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x49),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.C & 2) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x14C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x4A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.D & 2) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x14D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x4B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.E & 2) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x14E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x4C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.H & 2) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x14F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x4D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.L & 2) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x150: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x4E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.TR & 2) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x151: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x4F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.A & 2) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x152: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x50),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.B & 4) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x153: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x51),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.C & 4) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x154: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x52),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.D & 4) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x155: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x53),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.E & 4) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x156: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x54),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.H & 4) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x157: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x55),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.L & 4) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x158: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x56),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.TR & 4) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x159: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x57),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.A & 4) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x15A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x58),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.B & 8) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x15B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x59),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.C & 8) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x15C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x5A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.D & 8) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x15D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x5B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.E & 8) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x15E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x5C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.H & 8) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x15F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x5D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.L & 8) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x160: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x5E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.TR & 8) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x161: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x5F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.A & 8) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x162: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x60),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.B & 16) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x163: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x61),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.C & 16) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x164: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x62),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.D & 16) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x165: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x63),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.E & 16) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x166: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x64),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.H & 16) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x167: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x65),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.L & 16) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x168: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x66),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.TR & 16) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x169: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x67),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.A & 16) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x16A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x68),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.B & 32) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x16B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x69),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.C & 32) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x16C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x6A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.D & 32) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x16D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x6B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.E & 32) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x16E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x6C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.H & 32) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x16F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x6D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.L & 32) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x170: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x6E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.TR & 32) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x171: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x6F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.A & 32) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x172: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x70),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.B & 64) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x173: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x71),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.C & 64) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x174: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x72),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.D & 64) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x175: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x73),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.E & 64) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x176: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x74),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.H & 64) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x177: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x75),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.L & 64) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x178: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x76),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.TR & 64) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x179: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x77),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.A & 64) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x17A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x78),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.B & 128) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x17B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x79),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.C & 128) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x17C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x7A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.D & 128) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x17D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x7B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.E & 128) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x17E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x7C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.H & 128) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x17F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x7D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.L & 128) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x180: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x7E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_ind
            switch(regs.TCU) {
                case 1: // Do read
                    pins.Addr = ((regs.H << 8) | regs.L);
                    break;
                case 2: // cleanup_custom
                    regs.TR = pins.D;
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.TR & 128) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x181: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x7F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // BIT_idx_di
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    regs.F.H = 1;
                    regs.F.N = 0;
                    regs.F.Z = +((regs.A & 128) == 0);
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x182: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x80),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x183: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x81),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x184: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x82),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x185: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x83),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x186: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x84),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x187: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x85),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x188: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x86),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_ind
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
        });
        case 0x189: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x87),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x18A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x88),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x18B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x89),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x18C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x8A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x18D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x8B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x18E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x8C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x18F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x8D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x190: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x8E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_ind
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
        });
        case 0x191: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x8F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x192: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x90),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x193: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x91),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x194: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x92),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x195: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x93),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x196: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x94),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x197: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x95),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x198: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x96),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_ind
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
        });
        case 0x199: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x97),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x19A: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x98),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x19B: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x99),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x19C: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x9A),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x19D: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x9B),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x19E: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x9C),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x19F: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x9D),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1A0: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x9E),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_ind
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
        });
        case 0x1A1: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0x9F),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1A2: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1A3: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1A4: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1A5: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1A6: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1A7: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1A8: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_ind
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
        });
        case 0x1A9: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1AA: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1AB: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xA9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1AC: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xAA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1AD: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xAB),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1AE: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xAC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1AF: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xAD),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1B0: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xAE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_ind
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
        });
        case 0x1B1: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xAF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1B2: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1B3: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1B4: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1B5: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1B6: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1B7: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1B8: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_ind
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
        });
        case 0x1B9: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1BA: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1BB: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xB9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1BC: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xBA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1BD: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xBB),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1BE: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xBC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1BF: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xBD),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1C0: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xBE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_ind
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
        });
        case 0x1C1: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xBF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // RES_idx_di
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
        });
        case 0x1C2: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1C3: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1C4: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1C5: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1C6: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1C7: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1C8: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_ind
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
        });
        case 0x1C9: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1CA: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1CB: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xC9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1CC: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xCA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1CD: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xCB),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1CE: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xCC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1CF: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xCD),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1D0: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xCE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_ind
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
        });
        case 0x1D1: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xCF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1D2: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1D3: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1D4: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1D5: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1D6: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1D7: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1D8: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_ind
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
        });
        case 0x1D9: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1DA: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1DB: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xD9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1DC: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xDA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1DD: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xDB),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1DE: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xDC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1DF: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xDD),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1E0: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xDE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_ind
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
        });
        case 0x1E1: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xDF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1E2: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1E3: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1E4: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1E5: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1E6: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1E7: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1E8: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_ind
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
        });
        case 0x1E9: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1EA: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1EB: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xE9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1EC: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xEA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1ED: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xEB),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1EE: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xEC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1EF: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xED),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1F0: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xEE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_ind
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
        });
        case 0x1F1: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xEF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1F2: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF0),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1F3: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF1),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1F4: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF2),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1F5: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF3),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1F6: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF4),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1F7: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF5),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1F8: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF6),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_ind
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
        });
        case 0x1F9: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF7),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1FA: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF8),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1FB: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xF9),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1FC: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xFA),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1FD: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xFB),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1FE: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xFC),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x1FF: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xFD),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x200: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xFE),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_ind
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
        });
        case 0x201: return new SM83_opcode_functions(SM83_opcode_matrixCB.get(0xFF),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // SET_idx_di
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
        });
        case 0x202: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
        case 0x203: return new SM83_opcode_functions(SM83_opcode_matrix.get(0x00),
            function(regs: SM83_regs_t, pins: SM83_pins_t): void { // NOP
            switch(regs.TCU) {
                case 1: // cleanup_custom
                    //NOPE!
                    // Following is auto-generated code for instruction finish
                    pins.Addr = regs.PC;
                    regs.PC = (regs.PC + 1) & 0xFFFF;
                    regs.TCU = 0;
                    regs.IR = SM83_S_DECODE;
                    regs.poll_IRQ = true;
                    break;
            }
        });
    }
    return new SM83_opcode_functions(SM83_opcode_matrix.get(0), function(regs: SM83_regs_t, pins: SM83_pins_t): void { console.log('INVALID OPCODE');});
}

for (let i = 0; i <= (SM83_MAX_OPCODE+0xFF); i++) {
    sm83_decoded_opcodes[i] = sm83_get_opcode_function(i);
}
