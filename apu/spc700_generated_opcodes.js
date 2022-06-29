"use strict";

const SPC_decoded_opcodes = Object.freeze(
{
        0x00: function(cpu, regs) { // NOP 
            regs.opc_cycles = 2;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x01: function(cpu, regs) { // TCALL 0
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFDE;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x0B: function(cpu, regs) { // ASL d
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.P.C = ((regs.TR) & 0x80) >>> 7;
            regs.TR <<= 1;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x10: function(cpu, regs) { // BPL r
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            if (!regs.P.N) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x19: function(cpu, regs) { // OR (X), (Y)
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.X);
            regs.TR = cpu.read8(regs.Y);
            regs.TR &= regs.TA
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.X, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x1D: function(cpu, regs) { // DEC X
            regs.opc_cycles = 2;
            regs.X = (regs.X - 1) & 0xFF;
            regs.P.Z = +((regs.X) === 0);
            regs.P.N = ((regs.X) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x1F: function(cpu, regs) { // JMP [!a+X]
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA = (regs.TA + regs.X) & 0xFFFF;
            regs.PC = regs.TA;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x2F: function(cpu, regs) { // BRA r
            regs.opc_cycles = 4;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
            regs.opc_cycles += 2
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x5D: function(cpu, regs) { // MOV X, A
            regs.opc_cycles = 2;
            regs.X = regs.A;
            regs.P.Z = +((regs.X) === 0);
            regs.P.N = ((regs.X) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x78: function(cpu, regs) { // CMP dp, #imm
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8D((regs.TA));
            let z = regs.TA - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x7E: function(cpu, regs) { // CMP Y, d
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            let z = regs.Y - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x8F: function(cpu, regs) { // MOV d, #imm
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xAA: function(cpu, regs) { // MOV1 C, m.b
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA = cpu.read8(regs.TA & 0x1FFF);
            regs.P.C = ((regs.TA) >>> ((regs.TR) - 1)) & 1;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xAB: function(cpu, regs) { // INC d
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.TR = (regs.TR + 1) & 0xFF;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xBA: function(cpu, regs) { // MOVW YA, d
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.A = cpu.read8D((regs.TA));
            regs.Y = cpu.read8D((regs.TA + 1));
            regs.P.N = (regs.Y & 0x80) >>> 8;
            regs.P.Z = +(regs.Y === 0 && regs.A === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xBB: function(cpu, regs) { // INC d+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = (regs.TA + regs.X) & 0xFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.TR = (regs.TR + 1) & 0xFF;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xBD: function(cpu, regs) { // MOV SP, X
            regs.opc_cycles = 2;
            regs.SP = regs.X;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xC0: function(cpu, regs) { // DI 
            regs.opc_cycles = 3;
            regs.P.I = 0;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xC4: function(cpu, regs) { // MOV d, A
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            cpu.write8D((regs.TA), regs.A);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xC6: function(cpu, regs) { // MOV (X), A
            regs.opc_cycles = 4;
            cpu.write8(regs.X, regs.A);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xCB: function(cpu, regs) { // MOV d, Y
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            cpu.write8D((regs.TA), regs.Y);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xCC: function(cpu, regs) { // MOV !a, Y
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            cpu.write8(regs.TA, regs.Y);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xCD: function(cpu, regs) { // MOV X, #imm
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.X = regs.TR;
            regs.P.Z = +((regs.X) === 0);
            regs.P.N = ((regs.X) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD0: function(cpu, regs) { // BNE r
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            if (!regs.P.Z) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD7: function(cpu, regs) { // MOV [dp]+Y, A
            regs.opc_cycles = 7;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8D(regs.TR++);
            regs.TR &= 0xFF;
            regs.TA += cpu.read8D(regs.TR) << 8;
            regs.TA = (regs.TA + regs.Y) & 0xFFFF;
            cpu.write8(regs.TA, regs.A);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xDA: function(cpu, regs) { // MOVW d, YA
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            cpu.write8D((regs.TA), regs.A);
            cpu.write8D((regs.TA + 1), regs.Y);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xDB: function(cpu, regs) { // MOV dp+X, Y
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8D(regs.TR++);
            regs.TR &= 0xFF;
            regs.TA += cpu.read8D(regs.TR) << 8;
            regs.TA = (regs.TA + regs.X) & 0xFFFF;
            cpu.write8(regs.TA, regs.A);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xDD: function(cpu, regs) { // MOV A, Y
            regs.opc_cycles = 2;
            regs.A = regs.Y;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xE4: function(cpu, regs) { // MOV A, d
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.A = cpu.read8D((regs.TA));
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xE8: function(cpu, regs) { // MOV A, #imm
            regs.opc_cycles = 2;
            regs.A = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xEB: function(cpu, regs) { // MOV Y, d
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.Y = cpu.read8D((regs.TA));
            regs.P.Z = +((regs.Y) === 0);
            regs.P.N = ((regs.Y) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xEF: function(cpu, regs) { // SLEEP 
            regs.opc_cycles = 3;
            cpu.WAI = true;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xF3: function(cpu, regs) { // BBC d.n, r
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if ((regs.TA & 0x80) === 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xF4: function(cpu, regs) { // MOV A, d+X
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.A = cpu.read8D((regs.TA + regs.X));
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xF5: function(cpu, regs) { // MOV !a+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.A = cpu.read8((regs.TA + regs.X) & 0xFFFF);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xF6: function(cpu, regs) { // MOV !a+Y
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.A = cpu.read8((regs.TA + regs.Y) & 0xFFFF);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xFB: function(cpu, regs) { // MOV Y, d+X
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.A = cpu.read8D((regs.TA + regs.X));
            regs.P.Z = +((regs.Y) === 0);
            regs.P.N = ((regs.Y) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xFC: function(cpu, regs) { // INC Y
            regs.opc_cycles = 2;
            regs.Y = (regs.Y + 1) & 0xFF;
            regs.P.Z = +((regs.Y) === 0);
            regs.P.N = ((regs.Y) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xFF: function(cpu, regs) { // STOP 
            regs.opc_cycles = 2;
            cpu.STP = true;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,});