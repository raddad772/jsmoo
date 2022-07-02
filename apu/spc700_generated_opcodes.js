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
,        0x02: function(cpu, regs) { // SET1 dp.0
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR |= 0x01;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x03: function(cpu, regs) { // BBS dp.0, r
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if (regs.TA & 1) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x04: function(cpu, regs) { // OR A, dp
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.A |= regs.TR
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x05: function(cpu, regs) { // OR A, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.A |= regs.TR
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x06: function(cpu, regs) { // OR A, (X)
            regs.opc_cycles = 3;
            regs.TR = cpu.read8(regs.X);
            regs.A |= regs.TR
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x07: function(cpu, regs) { // OR A, [dp+X]
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TR = cpu.read8(regs.TA);
            regs.A |= regs.TR
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x08: function(cpu, regs) { // OR A, #
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.A |= regs.TR
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x09: function(cpu, regs) { // OR dp, dp
            regs.opc_cycles = 6;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TR));
            regs.TA2 = cpu.read8D((regs.TA));
            regs.TA2 |= regs.TR
            regs.P.Z = +((regs.TA2) === 0);
            regs.P.N = ((regs.TA2) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x0A: function(cpu, regs) { // OR1 C, m.b
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA = cpu.read8(regs.TA & 0x1FFF);
            let mask = 1 << regs.TR;
            let val = (regs.TA & mask) >>> regs.TR;
            val &= 0x01;
            regs.P.C |= val;
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
,        0x0C: function(cpu, regs) { // ASL !abs
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.P.C = ((regs.TR) & 0x80) >>> 7;
            regs.TR <<= 1;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.TA, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x0D: function(cpu, regs) { // PUSH P
            regs.opc_cycles = 4;
            cpu.write8(0x100 + regs.SP--, regs.P.getbyte());
            regs.SP &= 0xFF;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x0E: function(cpu, regs) { // TSET1 !abs
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.P.Z = +((regs.A - regs.TR) === 0);
            regs.P.N = ((regs.A - regs.TR) & 0x80) >>> 7;
            regs.TR |= regs.A;
            cpu.write8(regs.TA, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x0F: function(cpu, regs) { // BRK i
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, regs.PC & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, regs.P.getbyte());
            regs.SP &= 0xFF;
            regs.P.I = 0;
            regs.P.B = 1;
            regs.PC = cpu.read8(0xFFDE) + (cpu.read8(((0xFFDE) + 1) & 0xFFFF) << 8);
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
,        0x11: function(cpu, regs) { // TCALL i
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFDC;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x12: function(cpu, regs) { // CLR1 dp.0
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR &= 0xFE;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x13: function(cpu, regs) { // BBC dp.0
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if ((regs.TA & 1) === 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x14: function(cpu, regs) { // OR A, dp+X
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA + regs.X));
            regs.A |= regs.TR
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x15: function(cpu, regs) { // OR A, !abs+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            regs.A |= regs.TR
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x16: function(cpu, regs) { // OR A, !abs+Y
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            regs.A |= regs.TR
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x17: function(cpu, regs) { // OR A, [dp]+Y
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            regs.A |= regs.TR
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x18: function(cpu, regs) { // OR dp, #imm
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA2 = cpu.read8D((regs.TA));
            regs.TA2 |= regs.TR
            regs.P.Z = +((regs.TA2) === 0);
            regs.P.N = ((regs.TA2) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x19: function(cpu, regs) { // OR (X), (Y)
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.X);
            regs.TR = cpu.read8(regs.Y);
            regs.TR |= regs.TA
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.X, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x1A: function(cpu, regs) { // DECW dp
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA)) + (cpu.read8D((regs.TA) + 1) << 8);
            regs.TR = (regs.TR - 1) & 0xFFFF;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = (regs.TR & 0x8000) >>> 15;
            cpu.write8D((regs.TA), regs.TR & 0xFF);
            cpu.write8D((regs.TA) + 1, ((regs.TR) >>> 8) & 0xFF);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x1B: function(cpu, regs) { // ASL dp+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
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
,        0x1C: function(cpu, regs) { // ASL A
            regs.opc_cycles = 2;
            regs.P.C = ((regs.A) & 0x80) >>> 7;
            regs.A <<= 1;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
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
,        0x1E: function(cpu, regs) { // CMP X, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            let z = regs.X - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x1F: function(cpu, regs) { // JMP [!abs+X]
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA = (regs.TA + regs.X) & 0xFFFF;
            regs.TR = cpu.read8(regs.TA) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.PC = regs.TR;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x20: function(cpu, regs) { // CLRP i
            regs.opc_cycles = 2;
            regs.P.P = 0;
            regs.P.DO = 0;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x21: function(cpu, regs) { // TCALL 2
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFDA;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x22: function(cpu, regs) { // SET1 dp.1
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR |= 0x01;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x23: function(cpu, regs) { // BBS dp.1, r
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if (regs.TA & 2) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x24: function(cpu, regs) { // AND A, dp
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.A &= (regs.TR);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x25: function(cpu, regs) { // AND A, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.A &= (regs.TR);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x26: function(cpu, regs) { // AND A, (X)
            regs.opc_cycles = 3;
            regs.TR = cpu.read8(regs.X);
            regs.A &= (regs.TR);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x27: function(cpu, regs) { // AND A, [dp+X]
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TR = cpu.read8(regs.TA);
            regs.A &= (regs.TR);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x28: function(cpu, regs) { // AND A, #imm
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.A &= (regs.TR);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x29: function(cpu, regs) { // AND dp, dp
            regs.opc_cycles = 6;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TR));
            regs.TA2 = cpu.read8D((regs.TA));
            regs.TA2 &= (regs.TR);
            regs.P.Z = +((regs.TA2) === 0);
            regs.P.N = ((regs.TA2) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x2A: function(cpu, regs) { // OR1 C, /m.b
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA = cpu.read8(regs.TA & 0x1FFF);
            let mask = 1 << regs.TR;
            let val = (regs.TA & mask) >>> regs.TR;
            val &= 0x01;
            regs.P.C |= (val ? 0 : 1);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x2B: function(cpu, regs) { // ROL dp
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            let carry = regs.P.C;
            regs.P.C = (regs.TR & 0x80) >>> 7;
            regs.TR = (regs.TR << 1) | carry;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x2C: function(cpu, regs) { // ROL !abs
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            let carry = regs.P.C;
            regs.P.C = (regs.TR & 0x80) >>> 7;
            regs.TR = (regs.TR << 1) | carry;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.TA, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x2D: function(cpu, regs) { // PUSH A
            regs.opc_cycles = 4;
            cpu.write8(0x100 + regs.SP--, regs.A);
            regs.SP &= 0xFF;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x2E: function(cpu, regs) { // CBNE dp, r
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8D((regs.TA));
            if (regs.A !== regs.TA) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
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
,        0x30: function(cpu, regs) { // BMI r
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            if (regs.P.N) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x31: function(cpu, regs) { // TCALL 3
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFD8;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x32: function(cpu, regs) { // CLR1 dp.1
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR &= 0xFE;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x33: function(cpu, regs) { // BBC dp.1
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if ((regs.TA & 2) === 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x34: function(cpu, regs) { // AND A, dp+X
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA + regs.X));
            regs.A &= (regs.TR);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x35: function(cpu, regs) { // AND A, !abs+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            regs.A &= (regs.TR);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x36: function(cpu, regs) { // AND A, !abs+Y
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            regs.A &= (regs.TR);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x37: function(cpu, regs) { // AND A, [dp]+Y
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            regs.A &= (regs.TR);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x38: function(cpu, regs) { // AND dp, #imm
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA2 = cpu.read8D((regs.TA));
            regs.TA2 &= (regs.TR);
            regs.P.Z = +((regs.TA2) === 0);
            regs.P.N = ((regs.TA2) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x39: function(cpu, regs) { // AND (X), (Y)
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.X);
            regs.TR = cpu.read8(regs.Y);
            regs.TR &= (regs.TA);
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.X, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x3A: function(cpu, regs) { // INCW dp
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA)) + (cpu.read8D((regs.TA) + 1) << 8);
            regs.TR = (regs.TR + 1) & 0xFFFF;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = (regs.TR & 0x8000) >>> 15;
            cpu.write8D((regs.TA), regs.TR & 0xFF);
            cpu.write8D((regs.TA) + 1, ((regs.TR) >>> 8) & 0xFF);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x3B: function(cpu, regs) { // ROL dp+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8D((regs.TA));
            let carry = regs.P.C;
            regs.P.C = (regs.TR & 0x80) >>> 7;
            regs.TR = (regs.TR << 1) | carry;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x3C: function(cpu, regs) { // ROL A
            regs.opc_cycles = 2;
            let carry = regs.P.C;
            regs.P.C = (regs.A & 0x80) >>> 7;
            regs.A = (regs.A << 1) | carry;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x3D: function(cpu, regs) { // INC X
            regs.opc_cycles = 2;
            regs.X = (regs.X + 1) & 0xFF;
            regs.P.Z = +((regs.X) === 0);
            regs.P.N = ((regs.X) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x3E: function(cpu, regs) { // CMP X, dp
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            let z = regs.X - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x3F: function(cpu, regs) { // CALL !abs
            regs.opc_cycles = 8;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = regs.TR;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x40: function(cpu, regs) { // SETP i
            regs.opc_cycles = 2;
            regs.P.P = 1;
            regs.P.DO = 0x100;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x41: function(cpu, regs) { // TCALL 4
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFD6;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x42: function(cpu, regs) { // SET1 dp.2
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR |= 0x01;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x43: function(cpu, regs) { // BBS dp.2, r
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if (regs.TA & 4) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x44: function(cpu, regs) { // EOR A, dp
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.A ^= regs.TR;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x45: function(cpu, regs) { // EOR A, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.A ^= regs.TR;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x46: function(cpu, regs) { // EOR A, (X)
            regs.opc_cycles = 3;
            regs.TR = cpu.read8(regs.X);
            regs.A ^= regs.TR;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x47: function(cpu, regs) { // EOR A, [dp+X]
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TR = cpu.read8(regs.TA);
            regs.A ^= regs.TR;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x48: function(cpu, regs) { // EOR A, #imm
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.A ^= regs.TR;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x49: function(cpu, regs) { // EOR dp, dp
            regs.opc_cycles = 6;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TR));
            regs.TA2 = cpu.read8D((regs.TA));
            regs.TA2 ^= regs.TR;
            regs.P.Z = +((regs.TA2) === 0);
            regs.P.N = ((regs.TA2) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x4A: function(cpu, regs) { // AND1 m.b
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA = cpu.read8(regs.TA & 0x1FFF);
            let mask = 1 << regs.TR;
            let val = (regs.TA & mask) >>> regs.TR;
            val &= 0x01;
            regs.P.C &= val;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x4B: function(cpu, regs) { // LSR dp
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.P.C = (regs.TR) & 0x01;
            regs.TR >>>= 1
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x4C: function(cpu, regs) { // LSR !abs
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.P.C = (regs.TR) & 0x01;
            regs.TR >>>= 1
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.TA, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x4D: function(cpu, regs) { // PUSH X
            regs.opc_cycles = 4;
            cpu.write8(0x100 + regs.SP--, regs.X);
            regs.SP &= 0xFF;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x4E: function(cpu, regs) { // TCLR1 !abs
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.P.Z = +((regs.A - regs.TR) === 0);
            regs.P.N = ((regs.A - regs.TR) & 0x80) >>> 7;
            regs.TR &= (~regs.A) & 0xFF;
            cpu.write8(regs.TA, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x4F: function(cpu, regs) { // PCALL #imm
            regs.opc_cycles = 6;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = regs.TR + 0xFF00;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x50: function(cpu, regs) { // BVC r
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            if (!regs.P.V) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x51: function(cpu, regs) { // TCALL 5
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFD4;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x52: function(cpu, regs) { // CLR1 dp.2
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR &= 0xFE;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x53: function(cpu, regs) { // BBC dp.2
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if ((regs.TA & 0x04) === 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x54: function(cpu, regs) { // EOR A, dp+X
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA + regs.X));
            regs.A ^= regs.TR;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x55: function(cpu, regs) { // EOR A, !abs+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            regs.A ^= regs.TR;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x56: function(cpu, regs) { // EOR A, !abs+Y
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            regs.A ^= regs.TR;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x57: function(cpu, regs) { // EOR A, [dp]+Y
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            regs.A ^= regs.TR;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x58: function(cpu, regs) { // EOR dp, #imm
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA2 = cpu.read8D((regs.TA));
            regs.TA2 ^= regs.TR;
            regs.P.Z = +((regs.TA2) === 0);
            regs.P.N = ((regs.TA2) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x59: function(cpu, regs) { // EOR (X), (Y)
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.X);
            regs.TR = cpu.read8(regs.Y);
            regs.TR ^= regs.TA;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.X, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x5A: function(cpu, regs) { // CMPW 
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.TA = cpu.read8D((regs.TA+1));
            regs.TR += (regs.TA << 8);
            let z = ((regs.Y << 8) + regs.A) - regs.TR;
            regs.P.C = +(z >= 0);
            regs.P.Z = +((z & 0xFFFF) === 0);
            regs.P.N = (z & 0x8000) >>> 15;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x5B: function(cpu, regs) { // LSR dp+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8D((regs.TA));
            regs.P.C = (regs.TR) & 0x01;
            regs.TR >>>= 1
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x5C: function(cpu, regs) { // LSR A
            regs.opc_cycles = 2;
            regs.P.C = (regs.A) & 0x01;
            regs.A >>>= 1
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
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
,        0x5E: function(cpu, regs) { // CMP Y, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
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
,        0x5F: function(cpu, regs) { // JMP !abs
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.PC = regs.TR;
            cpu.write8(regs.TA, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x60: function(cpu, regs) { // CLRC i
            regs.opc_cycles = 2;
            regs.P.C = 0;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x61: function(cpu, regs) { // TCALL 6
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFD2;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x62: function(cpu, regs) { // SET1 dp.3
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR |= 0x01;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x63: function(cpu, regs) { // BBS dp.3, r
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if (regs.TA & 8) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x64: function(cpu, regs) { // CMP A, dp
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            let z = regs.A - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x65: function(cpu, regs) { // CMP A, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            let z = regs.A - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x66: function(cpu, regs) { // CMP A, (X)
            regs.opc_cycles = 3;
            regs.TR = cpu.read8(regs.X);
            let z = regs.A - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x67: function(cpu, regs) { // CMP A, [dp+X]
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TR = cpu.read8(regs.TA);
            let z = regs.A - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x68: function(cpu, regs) { // CMP A, #i
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            let z = regs.A - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x69: function(cpu, regs) { // CMP dp, dp
            regs.opc_cycles = 6;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TR));
            regs.TA2 = cpu.read8D((regs.TA));
            let z = regs.TA2 - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x6A: function(cpu, regs) { // AND1 C, /m.b
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA = cpu.read8(regs.TA & 0x1FFF);
            let mask = 1 << regs.TR;
            let val = (regs.TA & mask) >>> regs.TR;
            val = (~val) & 0x01;
            regs.P.C &= val;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x6B: function(cpu, regs) { // ROR dp
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            let carry = regs.P.C;
            regs.P.C = regs.TR& 1;
            regs.TR = (carry << 7) | (regs.TR >>> 1);
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x6C: function(cpu, regs) { // ROR !abs
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            let carry = regs.P.C;
            regs.P.C = regs.TR& 1;
            regs.TR = (carry << 7) | (regs.TR >>> 1);
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.TA, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x6D: function(cpu, regs) { // PUSH Y
            regs.opc_cycles = 4;
            cpu.write8(0x100 + regs.SP--, regs.Y);
            regs.SP &= 0xFF;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x6E: function(cpu, regs) { // DBNZ dp, r
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA2 = cpu.read8D((regs.TA));
            regs.TA2 = (regs.TA2 - 1) & 0xFF;
            if (regs.TA2 !== 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x6F: function(cpu, regs) { // RET i
            regs.opc_cycles = 5;
            regs.SP = (regs.SP + 1) & 0xFF;
            regs.PC = cpu.read8(0x100 + regs.SP);
            regs.SP = (regs.SP + 1) & 0xFF;
            regs.PC += cpu.read8(0x100 + regs.SP) << 8;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x70: function(cpu, regs) { // BVS r
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            if (regs.P.V) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x71: function(cpu, regs) { // TCALL 7
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFD0;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x72: function(cpu, regs) { // CLR1 dp.3
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR &= 0xFE;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x73: function(cpu, regs) { // BBC dp.3
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if ((regs.TA & 0x08) === 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x74: function(cpu, regs) { // CMP A, dp+X
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA + regs.X));
            let z = regs.A - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x75: function(cpu, regs) { // CMP A, !abs+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            let z = regs.A - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x76: function(cpu, regs) { // CMP A, !abs+Y
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            let z = regs.A - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x77: function(cpu, regs) { // CMP A, [dp]+Y
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            let z = regs.A - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
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
            regs.TA2 = cpu.read8D((regs.TA));
            let z = regs.TA2 - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x79: function(cpu, regs) { // CMP (X), (Y)
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.X);
            regs.TR = cpu.read8(regs.Y);
            let z = regs.TR - regs.TA;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x7A: function(cpu, regs) { // ADDW YA, dp
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.TA = cpu.read8D((regs.TA+1));
            regs.TR += (regs.TA << 8);
            let z;
            regs.P.C = 0;
            let y = regs.TR & 0xFF;
            z = regs.A + y;
            regs.P.C = +(z > 0xFF);
            regs.A = z & 0xFF;
            y = (regs.TR >>> 8) & 0xFF;
            z = regs.Y + y;
            regs.P.C = +(z > 0xFF);
            regs.P.H = ((regs.Y ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~(regs.Y ^ y)) & (regs.Y ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.Y = z & 0xFF;
            regs.P.Z = +(regs.A === 0 && regs.Y === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x7B: function(cpu, regs) { // ROR dp+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8D((regs.TA));
            let carry = regs.P.C;
            regs.P.C = regs.TR& 1;
            regs.TR = (carry << 7) | (regs.TR >>> 1);
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x7C: function(cpu, regs) { // ROR A
            regs.opc_cycles = 2;
            let carry = regs.P.C;
            regs.P.C = regs.A& 1;
            regs.A = (carry << 7) | (regs.A >>> 1);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x7D: function(cpu, regs) { // MOV A, X
            regs.opc_cycles = 2;
            regs.A = regs.X;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x7E: function(cpu, regs) { // CMP Y, dp
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
,        0x7F: function(cpu, regs) { // RET1 i
            regs.opc_cycles = 5;
            regs.SP = (regs.SP + 1) & 0xFF;
            regs.TR = cpu.read8(0x100 + regs.SP);
            regs.P.setbyte(regs.TR);
            regs.SP = (regs.SP + 1) & 0xFF;
            regs.PC = cpu.read8(0x100 + regs.SP);
            regs.SP = (regs.SP + 1) & 0xFF;
            regs.PC += cpu.read8(0x100 + regs.SP) << 8;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x80: function(cpu, regs) { // SETC i
            regs.opc_cycles = 2;
            regs.P.C = 1;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x81: function(cpu, regs) { // TCALL 8
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFCE;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x82: function(cpu, regs) { // SET1 dp.4
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR |= 0x01;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x83: function(cpu, regs) { // BBS dp.4, r
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if (regs.TA & 0x10) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x84: function(cpu, regs) { // ADC A, dp
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            let z = (regs.A) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ (regs.TR ))) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x85: function(cpu, regs) { // ADC !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            let z = (regs.A) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ (regs.TR ))) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x86: function(cpu, regs) { // ADC A, (X)
            regs.opc_cycles = 3;
            regs.TR = cpu.read8(regs.X);
            let z = (regs.A) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ (regs.TR ))) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x87: function(cpu, regs) { // ADC A, [dp+X]
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TR = cpu.read8(regs.TA);
            let z = (regs.A) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ (regs.TR ))) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x88: function(cpu, regs) { // ADC A, #imm
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            let z = (regs.A) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ (regs.TR ))) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x89: function(cpu, regs) { // ADC dp, dp
            regs.opc_cycles = 6;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TR));
            regs.TA2 = cpu.read8D((regs.TA));
            let z = (regs.TA2) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.TA2) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.TA2) ^ (regs.TR ))) & ((regs.TA2) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.TA2 = z & 0xFF;
            regs.P.Z = +((regs.TA2) === 0);
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x8A: function(cpu, regs) { // EOR1 C, m.b
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA = cpu.read8(regs.TA & 0x1FFF);
            let mask = 1 << regs.TR;
            let val = (regs.TA & mask) >>> regs.TR;
            val &= 0x01;
            regs.P.C ^= val;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x8B: function(cpu, regs) { // DEC dp
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.TR = (regs.TR - 1) & 0xFF;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x8C: function(cpu, regs) { // DEC !abs
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.TR = (regs.TR - 1) & 0xFF;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.TA, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x8D: function(cpu, regs) { // MOV Y, #imm
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.Y = regs.TR;
            regs.P.Z = +((regs.Y) === 0);
            regs.P.N = ((regs.Y) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x8E: function(cpu, regs) { // POP P
            regs.opc_cycles = 4;
            regs.SP = (regs.SP + 1) & 0xFF;
            regs.TR = cpu.read8(0x100 + regs.SP);
            regs.P.setbyte(regs.TR);
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
,        0x90: function(cpu, regs) { // BCC r
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            if (!regs.P.C) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x91: function(cpu, regs) { // TCALL 9
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFCC;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x92: function(cpu, regs) { // CLR1 dp.4
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR &= 0xFE;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x93: function(cpu, regs) { // BBC dp.4
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if ((regs.TA & 0x10) === 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x94: function(cpu, regs) { // ADC A, dp+X
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA + regs.X));
            let z = (regs.A) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ (regs.TR ))) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x95: function(cpu, regs) { // ADC A, !abs+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            let z = (regs.A) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ (regs.TR ))) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x96: function(cpu, regs) { // ADC A, !abs+Y
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            let z = (regs.A) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ (regs.TR ))) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x97: function(cpu, regs) { // ADC A, [dp]+Y
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            let z = (regs.A) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ (regs.TR ))) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x98: function(cpu, regs) { // ADC dp, #imm
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA2 = cpu.read8D((regs.TA));
            let z = (regs.TA2) + (regs.TR) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.TA2) ^ (regs.TR) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.TA2) ^ (regs.TR ))) & ((regs.TA2) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.TA2 = z & 0xFF;
            regs.P.Z = +((regs.TA2) === 0);
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x99: function(cpu, regs) { // ADC (X), (Y)
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.X);
            regs.TR = cpu.read8(regs.Y);
            let z = (regs.TR) + (regs.TA) + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.TR) ^ (regs.TA) ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.TR) ^ (regs.TA ))) & ((regs.TR) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.TR = z & 0xFF;
            regs.P.Z = +((regs.TR) === 0);
            cpu.write8(regs.X, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x9A: function(cpu, regs) { // SUBW YA, dp
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            regs.TA = cpu.read8D((regs.TA+1));
            regs.TR += (regs.TA << 8);
            regs.P.C = 1;
            let x, y, z;
            x = regs.A;
            y = (~regs.TR) & 0xFF;
            z = (x & 0xFF) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            x = regs.Y;
            regs.A = z & 0xFF;
            y = ((~regs.TR) >>> 8) & 0xFF;
            z = (x & 0xFF) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = ((x ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~(x ^ y)) & (x ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.Y = z & 0xFF;
            regs.P.Z = +(regs.Y === 0 && regs.A === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x9B: function(cpu, regs) { // DEC dp+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8D((regs.TA));
            regs.TR = (regs.TR - 1) & 0xFF;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x9C: function(cpu, regs) { // DEC A
            regs.opc_cycles = 2;
            regs.A = (regs.A - 1) & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x9D: function(cpu, regs) { // MOV X, SP
            regs.opc_cycles = 2;
            regs.X = regs.SP
            regs.P.Z = +((regs.X) === 0);
            regs.P.N = ((regs.X) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x9E: function(cpu, regs) { // DIV YA, X
            regs.opc_cycles = 12;
            let YA = (regs.Y << 8) + regs.A;
            regs.P.H = +((regs.Y & 15) >= (regs.X & 15));
            regs.P.V = +(regs.Y >= regs.X);
            if (regs.Y < (regs.X << 1)) {
                regs.A = Math.floor(YA / regs.X);
                regs.Y = YA % regs.X;
            } else {
                regs.A = 255 - Math.floor((YA - (regs.X << 9)) / (256 - regs.X));
                regs.Y = regs.X + (YA - (regs.X << 9)) % (256 - regs.X);
            }
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0x9F: function(cpu, regs) { // XCN i
            regs.opc_cycles = 5;
            regs.A = (regs.A << 4) | (regs.A >>> 4);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA0: function(cpu, regs) { // EI i
            regs.opc_cycles = 3;
            regs.P.I = 1;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA1: function(cpu, regs) { // TCALL 10
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFCA;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA2: function(cpu, regs) { // SET1 dp.5
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR |= 0x01;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA3: function(cpu, regs) { // BBS dp.5, r
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if (regs.TA & 0x20) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA4: function(cpu, regs) { // SBC A, dp
            regs.opc_cycles = 3;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA));
            let y = (~regs.TR) & 0xFF;
            let z = (regs.A) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ y)) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA5: function(cpu, regs) { // SBC A, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            let y = (~regs.TR) & 0xFF;
            let z = (regs.A) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ y)) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA6: function(cpu, regs) { // SBC A, (X)
            regs.opc_cycles = 3;
            regs.TR = cpu.read8(regs.X);
            let y = (~regs.TR) & 0xFF;
            let z = (regs.A) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ y)) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA7: function(cpu, regs) { // SBC A, [dp+X]
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TR = cpu.read8(regs.TA);
            let y = (~regs.TR) & 0xFF;
            let z = (regs.A) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ y)) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA8: function(cpu, regs) { // SBC A, #imm
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            let y = (~regs.TR) & 0xFF;
            let z = (regs.A) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ y)) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xA9: function(cpu, regs) { // SBC dp, dp
            regs.opc_cycles = 6;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TR));
            regs.TA2 = cpu.read8D((regs.TA));
            let y = (~regs.TR) & 0xFF;
            let z = (regs.TA2) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.TA2) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.TA2) ^ y)) & ((regs.TA2) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.TA2 = z & 0xFF;
            regs.P.Z = +((regs.TA2) === 0);
            cpu.write8D((regs.TA), regs.TA2);
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
            regs.P.C = ((regs.TA) >>> (regs.TR)) & 1;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xAB: function(cpu, regs) { // INC dp
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
,        0xAC: function(cpu, regs) { // INC !abs
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.TA);
            regs.TR = (regs.TR + 1) & 0xFF;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8(regs.TA, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xAD: function(cpu, regs) { // CMP Y, #imm
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            let z = regs.Y - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xAE: function(cpu, regs) { // POP A
            regs.opc_cycles = 4;
            regs.SP = (regs.SP + 1) & 0xFF;
            regs.A = cpu.read8(0x100 + regs.SP);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xAF: function(cpu, regs) { // MOV (X)+, A
            regs.opc_cycles = 4;
            cpu.write8(regs.X, regs.A);
            regs.X = (regs.X + 1) & 0xFF;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB0: function(cpu, regs) { // BCS r
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            if (regs.P.C) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB1: function(cpu, regs) { // TCALL 11
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFC8;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB2: function(cpu, regs) { // CLR1 dp.5
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR &= 0xFE;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB3: function(cpu, regs) { // BBC dp.5
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if ((regs.TA & 0x20) === 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB4: function(cpu, regs) { // SBC A, dp+X
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TA + regs.X));
            let y = (~regs.TR) & 0xFF;
            let z = (regs.A) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ y)) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB5: function(cpu, regs) { // SBC A, !abs+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            let y = (~regs.TR) & 0xFF;
            let z = (regs.A) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ y)) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB6: function(cpu, regs) { // SBC A, !abs+Y
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            let y = (~regs.TR) & 0xFF;
            let z = (regs.A) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ y)) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB7: function(cpu, regs) { // SBC A, [dp]+Y
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            regs.TA += regs.Y;
            regs.TR = cpu.read8(regs.TA & 0xFFFF);
            let y = (~regs.TR) & 0xFF;
            let z = (regs.A) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.A) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.A) ^ y)) & ((regs.A) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.A = z & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB8: function(cpu, regs) { // SBC dp, #imm
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA2 = cpu.read8D((regs.TA));
            let y = (~regs.TR) & 0xFF;
            let z = (regs.TA2) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.TA2) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.TA2) ^ y)) & ((regs.TA2) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.TA2 = z & 0xFF;
            regs.P.Z = +((regs.TA2) === 0);
            cpu.write8D((regs.TA), regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xB9: function(cpu, regs) { // SBC (X), (Y)
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.X);
            regs.TR = cpu.read8(regs.Y);
            let y = (~regs.TA) & 0xFF;
            let z = (regs.TR) + y + regs.P.C;
            regs.P.C = +(z > 0xFF);
            regs.P.H = (((regs.TR) ^ y ^ z) & 0x10) >>> 4;
            regs.P.V = (((~((regs.TR) ^ y)) & ((regs.TR) ^ z)) & 0x80) >>> 7;
            regs.P.N = (z & 0x80) >>> 7;
            regs.TR = z & 0xFF;
            regs.P.Z = +((regs.TR) === 0);
            cpu.write8(regs.X, regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xBA: function(cpu, regs) { // MOVW YA, dp
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
,        0xBB: function(cpu, regs) { // INC dp+X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TR = cpu.read8D((regs.TA));
            regs.TR = (regs.TR + 1) & 0xFF;
            regs.P.Z = +((regs.TR) === 0);
            regs.P.N = ((regs.TR) & 0x80) >>> 7;
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xBC: function(cpu, regs) { // INC A
            regs.opc_cycles = 2;
            regs.A = (regs.A + 1) & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
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
,        0xBE: function(cpu, regs) { // DAS A
            regs.opc_cycles = 3;
            if (!regs.P.C || regs.A > 0x99) {
                regs.A -= 0x60;
                regs.P.C = 0;
            }
            if (!regs.P.H || ((regs.A & 15) > 0x09)) {
                regs.A -= 0x06;
            }
            regs.A &= 0xFF;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xBF: function(cpu, regs) { // MOV A, (X)+
            regs.opc_cycles = 4;
            regs.A = cpu.read8(regs.X);
            regs.X = (regs.X + 1) & 0xFF;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
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
,        0xC1: function(cpu, regs) { // TCALL 12
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFC6;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xC2: function(cpu, regs) { // SET1 dp.6
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR |= 0x01;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xC3: function(cpu, regs) { // BBS dp.6, r
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if (regs.TA & 0x40) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
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
,        0xC5: function(cpu, regs) { // MOV !abs, A
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            cpu.write8(regs.TA, regs.A);
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
,        0xC7: function(cpu, regs) { // MOV [dp+X], A
            regs.opc_cycles = 7;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            regs.TA = cpu.read8((regs.TA) & 0xFFFF) + (cpu.read8(((regs.TA) + 1) & 0xFFFF) << 8);
            cpu.write8(regs.TA, regs.A);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xC8: function(cpu, regs) { // CMP X, #i
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            let z = regs.X - regs.TR;
            regs.P.C = +(z >= 0)
            regs.P.Z = +((z & 0xFF) === 0);
            regs.P.N = (z & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xC9: function(cpu, regs) { // MOV !abs, X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            cpu.write8(regs.TA, regs.X);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xCA: function(cpu, regs) { // MOV1 m.b, C
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TA2 = regs.P.C ? regs.TA2 | (regs.P.C << regs.TR) : + regs.TA2 & (~(regs.P.C << regs.TR)) & 0xFF;
            cpu.write8(regs.TA, regs.TA2);
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
,        0xCE: function(cpu, regs) { // POP X
            regs.opc_cycles = 4;
            regs.SP = (regs.SP + 1) & 0xFF;
            regs.X = cpu.read8(0x100 + regs.SP);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xCF: function(cpu, regs) { // MUL YA
            regs.opc_cycles = 9;
            let YA = regs.Y * regs.A;
            regs.A = YA & 0xFF;
            regs.Y = (YA >>> 8) & 0xFF;
            regs.P.Z = +((regs.Y) === 0);
            regs.P.N = ((regs.Y) & 0x80) >>> 7;
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
,        0xD1: function(cpu, regs) { // TCALL 13
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFC4;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD2: function(cpu, regs) { // CLR1 dp.6
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR &= 0xFE;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD3: function(cpu, regs) { // BBC dp.6
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if ((regs.TA & 0x40) === 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD4: function(cpu, regs) { // MOV dp+X, A
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            cpu.write8D((regs.TA + regs.X), regs.A);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD5: function(cpu, regs) { // MOV !abs+X, A
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.X;
            cpu.write8(regs.TA, regs.A);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD6: function(cpu, regs) { // MOV !abs+Y, A
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TA += regs.Y;
            cpu.write8(regs.TA, regs.A);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD7: function(cpu, regs) { // MOV [dp]+Y, A
            regs.opc_cycles = 7;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8((regs.TR) & 0xFFFF) + (cpu.read8(((regs.TR) + 1) & 0xFFFF) << 8);
            regs.TA = (regs.TA + regs.Y) & 0xFFFF;
            cpu.write8(regs.TA, regs.A);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD8: function(cpu, regs) { // MOV dp, X
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            cpu.write8D((regs.TA), regs.X);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xD9: function(cpu, regs) { // MOV dp+Y, X
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            cpu.write8D((regs.TA + regs.Y), regs.X);
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
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            cpu.write8D((regs.TA + regs.X), regs.Y);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xDC: function(cpu, regs) { // DEC Y
            regs.opc_cycles = 2;
            regs.Y = (regs.Y - 1) & 0xFF;
            regs.P.Z = +((regs.Y) === 0);
            regs.P.N = ((regs.Y) & 0x80) >>> 7;
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
,        0xDE: function(cpu, regs) { // CBNE dp+X, r
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8D((regs.TA + regs.X));
            if (regs.A !== regs.TA) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xDF: function(cpu, regs) { // DAA A
            regs.opc_cycles = 3;
            if (regs.P.C || regs.A > 0x99) {
                regs.A += 0x60;
                regs.P.C = 1;
            }
            if (regs.P.H || ((regs.A & 15) > 0x09)) {
                regs.A += 0x06;
            }
            regs.A &= 0xFF;
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xE0: function(cpu, regs) { // CLRV i
            regs.opc_cycles = 2;
            regs.P.V = 0;
            regs.P.H = 0;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xE1: function(cpu, regs) { // TCALL 14
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFC2;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xE2: function(cpu, regs) { // SET1 dp.7
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR |= 0x01;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xE3: function(cpu, regs) { // BBS dp.7, r
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.TA);
            if (regs.TA & 0x80) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xE4: function(cpu, regs) { // MOV A, dp
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
,        0xE5: function(cpu, regs) { // MOV A, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.A = cpu.read8(regs.TA);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xE6: function(cpu, regs) { // MOV A, (X)
            regs.opc_cycles = 3;
            regs.A = cpu.read8(regs.X);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xE7: function(cpu, regs) { // MOV A, [dp+X]
            regs.opc_cycles = 6;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.A = cpu.read8((regs.TA + regs.X) & 0xFFFF);
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
,        0xE9: function(cpu, regs) { // MOV X, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.X = cpu.read8(regs.TA);
            regs.P.Z = +((regs.X) === 0);
            regs.P.N = ((regs.X) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xEA: function(cpu, regs) { // NOT1 m.b
            regs.opc_cycles = 5;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            let mask = (1 << regs.TR);
            if (mask & regs.TA2)
                regs.TA2 &= (~mask) & 0xFF;
            else
                regs.TA2 |= mask;
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xEB: function(cpu, regs) { // MOV Y, dp
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
,        0xEC: function(cpu, regs) { // MOV Y, !abs
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.Y = cpu.read8(regs.TA);
            regs.P.Z = +((regs.Y) === 0);
            regs.P.N = ((regs.Y) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xED: function(cpu, regs) { // NOTC i
            regs.opc_cycles = 3;
            regs.P.C = regs.P.C ? 0 : 1;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xEE: function(cpu, regs) { // POP Y
            regs.opc_cycles = 4;
            regs.SP = (regs.SP + 1) & 0xFF;
            regs.Y = cpu.read8(0x100 + regs.SP);
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
,        0xF0: function(cpu, regs) { // BEQ r
            regs.opc_cycles = 2;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            if (regs.P.Z) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xF1: function(cpu, regs) { // TCALL 15
            regs.opc_cycles = 8;
            cpu.write8(0x100 + regs.SP--, (regs.PC >>> 8) & 0xFF);
            regs.SP &= 0xFF;
            cpu.write8(0x100 + regs.SP--, (regs.PC & 0xFF));
            regs.SP &= 0xFF;
            regs.PC = 0xFFC0;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xF2: function(cpu, regs) { // CLR1 dp.7
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA += cpu.read8(regs.PC++) << 8;
            regs.PC &= 0xFFFF;
            regs.TR = (regs.TA >>> 13) & 7;
            regs.TA &= 0x1FFF;
            regs.TA2 = cpu.read8(regs.TA);
            regs.TR = cpu.read8D((regs.TA2));
            regs.TR &= 0xFE;
            cpu.write8D((regs.TA2), regs.TR);
            cpu.write8(regs.TA, regs.TA2);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xF3: function(cpu, regs) { // BBC dp.n, r
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
,        0xF4: function(cpu, regs) { // MOV A, dp+X
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
,        0xF7: function(cpu, regs) { // MOV A, [dp]+Y
            regs.opc_cycles = 6;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8((regs.TR) & 0xFFFF) + (cpu.read8(((regs.TR) + 1) & 0xFFFF) << 8);
            regs.TA = (regs.TA + regs.Y) & 0xFFFF;
            regs.A = cpu.read8(regs.TA);
            regs.P.Z = +((regs.A) === 0);
            regs.P.N = ((regs.A) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xF8: function(cpu, regs) { // MOV X, dp
            regs.opc_cycles = 3;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.X = cpu.read8D((regs.TR));
            regs.P.Z = +((regs.X) === 0);
            regs.P.N = ((regs.X) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xF9: function(cpu, regs) { // MOV X, dp+Y
            regs.opc_cycles = 4;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.X = cpu.read8D((regs.TA + regs.Y));
            regs.P.Z = +((regs.X) === 0);
            regs.P.N = ((regs.X) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xFA: function(cpu, regs) { // MOV dp, dp
            regs.opc_cycles = 5;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TA = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.TR = cpu.read8D((regs.TR));
            cpu.write8D((regs.TA), regs.TR);
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xFB: function(cpu, regs) { // MOV Y, dp+X
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
,        0xFD: function(cpu, regs) { // MOV Y, A
            regs.opc_cycles = 2;
            regs.Y = regs.A;
            regs.P.Z = +((regs.Y) === 0);
            regs.P.N = ((regs.Y) & 0x80) >>> 7;
            cpu.cycles -= regs.opc_cycles;
            regs.IR = cpu.read8(regs.PC);
            regs.PC = (regs.PC + 1) & 0xFFFF;
        }
,        0xFE: function(cpu, regs) { // DBNZ Y, r
            regs.opc_cycles = 4;
            regs.TR = cpu.read8(regs.PC++);
            regs.PC &= 0xFFFF;
            regs.Y = (regs.Y - 1) & 0xFF;
            if (regs.Y !== 0) {
                regs.PC = (regs.PC + mksigned8(regs.TR)) & 0xFFFF;
                regs.opc_cycles += 2
            }
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