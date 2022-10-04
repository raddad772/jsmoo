"use strict";

class SPC_funcgen {
    constructor(indent, opc_info) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.cycles = opc_info.cycles;
        this.outstr = '';
        this.addl1(hex0x2(opc_info.opcode) + ': function(cpu, regs) { // ' + opc_info.mnemonic + ' ' + opc_info.operand);
        this.addl('regs.opc_cycles = ' + opc_info.cycles + ';');
    }

    fetch(who) {
        this.addl(who + ' = cpu.read8(regs.PC++);');
        this.addl('regs.PC &= 0xFFFF;');
    }

    fetch_TR() {
        this.fetch('regs.TR')
    }

    fetch_TA() {
        this.fetch('regs.TA');
    }

    fetch16() {
        this.addl('regs.TA = cpu.read8(regs.PC++);');
        this.addl('regs.PC &= 0xFFFF;');
        this.addl('regs.TA += cpu.read8(regs.PC++) << 8;');
        this.addl('regs.PC &= 0xFFFF;');
    }

    read(where, what) {
        this.addl(what + ' = cpu.read8(' + where + ');');
    }

    load(where, what) {
        this.addl(what + ' = cpu.read8D(' + where + ');');
    }

    read16(where, what) {
        this.addl(what + ' = cpu.read8((' + where + ') & 0xFFFF) + (cpu.read8(((' + where + ') + 1) & 0xFFFF) << 8);');
    }

    load16(where, what)
    {
        this.addl(what + ' = cpu.read8D((' + where + ')) + (cpu.read8D((' + where + ') + 1) << 8);');
    }

    write(where, what) {
        this.addl('cpu.write8(' + where + ', ' + what +');');
    }

    store(where, what) {
        this.addl('cpu.write8D((' + where + '), ' + what + ');');
    }

    store16(where, what) {
        this.addl('cpu.write8D((' + where + '), ' + what + ' & 0xFF);')
        this.addl('cpu.write8D((' + where + ') + 1, ((' + what + ') >>> 8) & 0xFF);')
    }

    load16_2D(where, lo, hi) {
        this.load(where, lo);
        this.load(where + ' + 1', hi);
    }

    store16_2D(where, lo, hi) {
        this.store(where, lo);
        this.store(where + ' + 1', hi);
    }

    ADC(who, y) {
        this.addl('let z = (' + who + ') + (' + y + ') + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        this.addl('regs.P.H = (((' + who + ') ^ (' + y + ') ^ z) & 0x10) >>> 4;');
        this.addl('regs.P.V = (((~((' + who + ') ^ (' + y + ' ))) & ((' + who + ') ^ z)) & 0x80) >>> 7;');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl(who + ' = z & 0xFF;');
        this.setz(who);
    }

    SBC(who, y) {
        this.addl('let y = (~' + y + ') & 0xFF;');
        this.addl('let z = (' + who + ') + y + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        this.addl('regs.P.H = (((' + who + ') ^ y ^ z) & 0x10) >>> 4;');
        this.addl('regs.P.V = (((~((' + who + ') ^ y)) & ((' + who + ') ^ z)) & 0x80) >>> 7;');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl(who + ' = z & 0xFF;');
        this.setz(who);
    }

    AND1f(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val  + ' & mask) >>> ' + bit + ';');
        this.addl('val = (~val) & 0x01;');
        this.addl('regs.P.C &= val;');
    }

    AND1(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val  + ' & mask) >>> ' + bit + ';');
        this.addl('val &= 0x01;');
        this.addl('regs.P.C &= val;');
    }

    OR1f(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val  + ' & mask) >>> ' + bit + ';');
        this.addl('val &= 0x01;');
        this.addl('regs.P.C |= (val ? 0 : 1);');
    }

    OR1(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val  + ' & mask) >>> ' + bit + ';');
        this.addl('val &= 0x01;');
        this.addl('regs.P.C |= val;')
    }

    EOR1(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val + ' & mask) >>> ' + bit + ';');
        this.addl('val &= 0x01;');
        this.addl('regs.P.C ^= val;');
    }

    ADDW() { // YA, TR
        this.addl('let z;');
        this.addl('regs.P.C = 0;');

        this.addl('let y = regs.TR & 0xFF;');
        this.addl('z = regs.A + y;');
        this.addl('regs.P.C = +(z > 0xFF);');
        //this.addl('regs.P.H = ((regs.A ^ y ^ z) & 0x10) >>> 4;');
        //this.addl('regs.P.V = (((~(regs.A ^ y)) & (regs.A ^ z)) & 0x80) >>> 7;');
        //this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl('regs.A = z & 0xFF;')

        this.addl('y = (regs.TR >>> 8) & 0xFF;');
        this.addl('z = regs.Y + y + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        this.addl('regs.P.H = ((regs.Y ^ y ^ z) & 0x10) >>> 4;');
        this.addl('regs.P.V = (((~(regs.Y ^ y)) & (regs.Y ^ z)) & 0x80) >>> 7;');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl('regs.Y = z & 0xFF;')

        this.addl('regs.P.Z = +(regs.A === 0 && regs.Y === 0);');
    }

    SUBW() { // YA, TR
        // CF = 1
        // z = SBC(x, y)
        // z |= SBC(x >> 8, y >> 8) << 8
        // ZF
        this.addl('regs.P.C = 1;');
        this.addl('let x, y, z;');

        this.addl('x = regs.A;');
        this.addl('y = (~regs.TR) & 0xFF;');
        this.addl('z = (x & 0xFF) + y + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        //this.addl('regs.P.H = ((x ^ y ^ z) & 0x10) >>> 4;');
        //this.addl('regs.P.V = (((~(x ^ y)) & (x ^ z)) & 0x80) >>> 7;');
        //this.addl('regs.P.N = (z & 0x80) >>> 7;');

        this.addl('x = regs.Y;');
        this.addl('regs.A = z & 0xFF;');
        this.addl('y = ((~regs.TR) >>> 8) & 0xFF;');
        this.addl('z = (x & 0xFF) + y + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        this.addl('regs.P.H = ((x ^ y ^ z) & 0x10) >>> 4;');
        this.addl('regs.P.V = (((~(x ^ y)) & (x ^ z)) & 0x80) >>> 7;');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl('regs.Y = z & 0xFF;');
        this.addl('regs.P.Z = +(regs.Y === 0 && regs.A === 0);')
    }

    XCN() {
        this.addl('regs.A = ((regs.A << 4) | (regs.A >>> 4)) & 0xFF;');
        this.setn('regs.A');
        this.setz('regs.A');
    }

    AND(who, y) {
        this.addl(who + ' &= (' + y + ');');
        this.setz(who);
        this.setn(who);
    }

    ASL(who) {
        this.addl('regs.P.C = ((' + who + ') & 0x80) >>> 7;');
        this.addl(who + ' = (' + who + ' << 1) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    LSR(who) {
        this.addl('regs.P.C = (' + who + ') & 0x01;');
        this.addl(who + ' >>>= 1');
        this.setz(who);
        this.setn(who);
    }

    BR(when, where) {
        let indent = '';
        if (when !== 'true') {
            this.addl('if (' + when + ') {');
            indent = '    ';
        }
        this.addl(indent + 'regs.PC = (regs.PC + mksigned8(' + where + ')) & 0xFFFF;');
        this.addl(indent + 'regs.opc_cycles += 2;');
        if (when !== 'true') {
            this.addl('}');
        }
    }

    CMP(operand1, operand2) {
        this.addl('let z = ' + operand1 + ' - ' + operand2 + ';');
        this.addl('regs.P.C = +(z >= 0)');
        this.addl('regs.P.Z = +((z & 0xFF) === 0);');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
    }

    // YA, TR
    CMPW() {
        this.addl('let z = ((regs.Y << 8) + regs.A) - regs.TR;');
        this.addl('regs.P.C = +(z >= 0);');
        this.addl('regs.P.Z = +((z & 0xFFFF) === 0);');
        this.addl('regs.P.N = (z & 0x8000) >>> 15;');
    }

    DEC(who) {
        this.addl(who + ' = (' + who + ' - 1) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    CBNE(cmp, r) {
        this.BR('regs.A !== ' + cmp, r);
    }

    DBNZ(who, r) {
        this.addl(who + ' = (' + who + ' - 1) & 0xFF;');
        this.BR(who + ' !== 0', r);
    }

    DECW(who) {
        this.addl(who + ' = (' + who + ' - 1) & 0xFFFF;');
        this.setz(who);
        this.addl('regs.P.N = (' + who + ' & 0x8000) >>> 15;');
    }

    INCW(who) {
        this.addl(who + ' = (' + who + ' + 1) & 0xFFFF;');
        this.setz(who);
        this.addl('regs.P.N = (' + who + ' & 0x8000) >>> 15;');
    }

    DIV() {
        this.addl('let YA = (regs.Y << 8) + regs.A;');
        this.addl('regs.P.H = +((regs.Y & 15) >= (regs.X & 15));');
        this.addl('regs.P.V = +(regs.Y >= regs.X);');
        this.addl('if (regs.Y < (regs.X << 1)) {');
        this.addl('    regs.A = Math.floor(YA / regs.X) & 0xFF;');
        this.addl('    regs.Y = (YA % regs.X) & 0xFF;')
        this.addl('} else {');
        this.addl('    regs.A = (255 - Math.floor((YA - (regs.X << 9)) / (256 - regs.X))) & 0xFF;');
        this.addl('    regs.Y = (regs.X + (YA - (regs.X << 9)) % (256 - regs.X)) & 0xFF;');
        this.addl('}');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    MUL() {
        this.addl('let YA = regs.Y * regs.A;');
        this.addl('regs.A = YA & 0xFF;');
        this.addl('regs.Y = (YA >>> 8) & 0xFF;');
        this.setz('regs.Y');
        this.setn('regs.Y');
    }

    ROL(who) {
        this.addl('let carry = regs.P.C;');
        this.addl('regs.P.C = (' + who + ' & 0x80) >>> 7;');
        this.addl(who + ' = ((' + who + ' << 1) | carry) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    ROR(who) {
        this.addl('let carry = regs.P.C;');
        this.addl('regs.P.C = ' + who + '& 1;');
        this.addl(who + ' = (carry << 7) | (' + who + ' >>> 1);')
        this.setz(who);
        this.setn(who);
    }

    INC(who) {
        this.addl(who + ' = (' + who + ' + 1) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    EOR(who, who2) {
        this.addl(who + ' ^= ' + who2 + ';');
        this.setz(who);
        this.setn(who);
    }

    NOT1(val, bit) {
        // bit = !bit
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('if (mask & ' + val + ')'); // We gotta unset, which means and the inverse
        this.addl('    ' + val + ' &= ((~mask) & 0xFF);');
        this.addl('else')
        this.addl('    ' + val + ' |= mask;');
    }

    OR(who, who2) {
        this.addl(who + ' |= ' + who2 + ';');
        this.setz(who);
        this.setn(who);
    }

    POP16(what) {
        this.addl('regs.SP = (regs.SP + 1) & 0xFF;');
        this.addl(what + ' = cpu.read8(0x100 + regs.SP);');
        this.addl('regs.SP = (regs.SP + 1) & 0xFF;');
        this.addl(what + ' += cpu.read8(0x100 + regs.SP) << 8;');
    }

    POP(what) {
        this.addl('regs.SP = (regs.SP + 1) & 0xFF;');
        this.addl(what + ' = cpu.read8(0x100 + regs.SP);');
    }

    PUSH(what) {
        this.addl('cpu.write8(0x100 + regs.SP--, ' + what + ');');
        this.addl('regs.SP &= 0xFF;');
    }

    BRK() {
        this.PUSH('(regs.PC >>> 8) & 0xFF');
        this.PUSH('regs.PC & 0xFF');
        this.PUSH('regs.P.getbyte()');
        this.addl('regs.P.I = 0;');
        this.addl('regs.P.B = 1;');
        this.read16('0xFFDE', 'regs.PC');
    }

    TCLR1(who) {
        this.addl('regs.P.Z = +((regs.A - ' + who + ') === 0);');
        this.addl('regs.P.N = ((regs.A - ' + who + ') & 0x80) >>> 7;');
        this.addl(who + ' &= (~regs.A) & 0xFF;');
    }

    TSET1(who) {
        this.addl('regs.P.Z = +((regs.A - ' + who + ') === 0);');
        this.addl('regs.P.N = ((regs.A - ' + who + ') & 0x80) >>> 7;');
        this.addl(who + ' |= regs.A;');
    }

    CALL(where, hex=false) {
        this.PUSH('(regs.PC >>> 8) & 0xFF');
        this.PUSH('(regs.PC & 0xFF)');
        if (hex)
            this.addl('regs.PC = ' + hex0x4(where) + ';');
        else
            this.addl('regs.PC = ' + where + ';');
    }

    DAA() {
        this.addl('if (regs.P.C || (regs.A > 0x99)) {');
        this.addl('    regs.A = (regs.A + 0x60) & 0xFF;');
        this.addl('    regs.P.C = 1;')
        this.addl('}');
        this.addl('if (regs.P.H || ((regs.A & 15) > 0x09)) {');
        this.addl('    regs.A = (regs.A + 0x06) & 0xFF;');
        this.addl('}');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    DAS() {
        this.addl('if (!regs.P.C || regs.A > 0x99) {');
        this.addl('    regs.A -= 0x60;');
        this.addl('    regs.P.C = 0;');
        this.addl('}');
        this.addl('if (!regs.P.H || ((regs.A & 15) > 0x09)) {');
        this.addl('    regs.A -= 0x06;');
        this.addl('}');
        this.addl('regs.A &= 0xFF;');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    TCALL(opcode) {
        let vec = 0xFFDE - ((opcode & 0xF0) >>> 3);
        this.PUSH('(regs.PC >>> 8) & 0xFF');
        this.PUSH('(regs.PC & 0xFF)');
        this.read(vec, 'regs.PC');
        this.addl('regs.PC |= cpu.read8(' + (vec+1) + ') << 8;');
    }

    DOINS(ins, operand, operand2, addr_mode, opcode) {
        let mask1, mask2;
        this.addl('// INS ' + ins + ' ADDR MODE ' + addr_mode);
        switch(ins) {
            case SPC_MN.RET: // PCL, PCH
                this.POP16('regs.PC');
                break;
            case SPC_MN.RET1: // flag, PCL, PCH
                this.POP('regs.TR');
                this.addl('regs.P.setbyte(regs.TR);');
                this.POP16('regs.PC');
                break;
            case SPC_MN.POP:
                switch(opcode) {
                    case 0xAE:
                        this.POP('regs.A');
                        break;
                    case 0x8E:
                        this.POP('regs.TR');
                        this.addl('regs.P.setbyte(regs.TR);');
                        break;
                    case 0xCE:
                        this.POP('regs.X');
                        break;
                    case 0xEE:
                        this.POP('regs.Y');
                        break;
                }
                break;
            case SPC_MN.PUSH:
                switch(opcode) {
                    case 0x2D:
                        this.PUSH('regs.A');
                        break;
                    case 0x0D:
                        this.PUSH('regs.P.getbyte()');
                        break;
                    case 0x4D:
                        this.PUSH('regs.X');
                        break;
                    case 0x6D:
                        this.PUSH('regs.Y');
                        break;
                }
                break;
            case SPC_MN.DAA:
                this.DAA();
                break;
            case SPC_MN.DAS:
                this.DAS();
                break;
            case SPC_MN.LSR:
                this.LSR(operand);
                break;
            case SPC_MN.DECW:
                this.DECW(operand);
                break;
            case SPC_MN.INCW:
                this.INCW(operand);
                break;
            case SPC_MN.TCALL:
                this.TCALL(opcode);
                break;
            case SPC_MN.CALL:
                this.CALL(operand);
                break;
            case SPC_MN.ADC:
                this.ADC(operand, operand2);
                break;
            case SPC_MN.ADDW:
                this.ADDW();
                break;
            case SPC_MN.TCLR1:
                this.TCLR1(operand);
                break;
            case SPC_MN.TSET1:
                this.TSET1(operand);
                break;
            case SPC_MN.SUBW:
                this.SUBW();
                break;
            case SPC_MN.AND1f:
                this.AND1f(operand, operand2);
                break;
            case SPC_MN.AND1:
                this.AND1(operand, operand2);
                break;
            case SPC_MN.OR1f:
                this.OR1f(operand, operand2);
                break;
            case SPC_MN.OR1:
                this.OR1(operand, operand2);
                break;
            case SPC_MN.ROL:
                this.ROL(operand);
                break;
            case SPC_MN.AND:
                this.AND(operand, operand2);
                break;
            case SPC_MN.SBC:
                this.SBC(operand, operand2);
                break;
            case SPC_MN.XCN:
                this.XCN();
                break;
            case SPC_MN.ROR:
                this.ROR(operand);
                break;
            case SPC_MN.EOR:
                this.EOR(operand, operand2);
                break;
            case SPC_MN.EOR1:
                this.EOR1(operand, operand2);
                break;
            case SPC_MN.DI:
                this.addl('regs.P.I = 0;');
                break;
            case SPC_MN.EI:
                this.addl('regs.P.I = 1;');
                break;
            case SPC_MN.CMP:
                this.CMP(operand, operand2);
                break;
            case SPC_MN.CMPW:
                this.CMPW();
                break;
            case SPC_MN.DEC:
                this.DEC(operand);
                break;
            case SPC_MN.CBNE:
                this.CBNE(operand, operand2)
                break;
            case SPC_MN.DBNZ:
                this.DBNZ(operand, operand2);
                break;
            case SPC_MN.INC:
                this.INC(operand);
                break;
            case SPC_MN.ASL:
                this.ASL(operand);
                break;
            case SPC_MN.OR:
                this.OR(operand, operand2);
                break;
            case SPC_MN.NOP:
                break;
            case SPC_MN.BRK:
                this.BRK();
                break;
            case SPC_MN.BCC: // Branch C = 0
                this.fetch_TR();
                this.BR('!regs.P.C', 'regs.TR');
                break;
            case SPC_MN.BCS: // Branch C = 1
                this.fetch_TR();
                this.BR('regs.P.C', 'regs.TR');
                break;
            case SPC_MN.BEQ: // Branch Z = 1
                this.fetch_TR();
                this.BR('regs.P.Z', 'regs.TR');
                break;
            case SPC_MN.BMI: // Branch N = 1
                this.fetch_TR();
                this.BR('regs.P.N', 'regs.TR');
                break;
            case SPC_MN.BNE: // branch Z = 0
                this.fetch_TR();
                this.BR('!regs.P.Z', 'regs.TR');
                break;
            case SPC_MN.BPL: // branch N = 0
                this.fetch_TR();
                this.BR('!regs.P.N', 'regs.TR');
                break;
            case SPC_MN.BVC: // branch V = 0
                this.fetch_TR();
                this.BR('!regs.P.V', 'regs.TR');
                break;
            case SPC_MN.BVS: // branch V = 1
                this.fetch_TR();
                this.BR('regs.P.V', 'regs.TR');
                break;
            case SPC_MN.BRA: // Always branch
                this.fetch_TR();
                this.BR('true', 'regs.TR');
                break;
            case SPC_MN.JMP:
                this.addl('regs.PC = ' + operand + ';');
                break;
            case SPC_MN.CLRC:
                this.addl('regs.P.C = 0;');
                break;
            case SPC_MN.CLRP:
                this.addl('regs.P.P = 0;');
                this.addl('regs.P.DO = 0;');
                break;
            case SPC_MN.SETC:
                this.addl('regs.P.C = 1;');
                break;
            case SPC_MN.SETP:
                this.addl('regs.P.P = 1;');
                this.addl('regs.P.DO = 0x100;');
                break;
            case SPC_MN.CLRV:
                this.addl('regs.P.V = 0;');
                this.addl('regs.P.H = 0;');
                break;
            case SPC_MN.MOV1:
                if (addr_mode === SPC_AM.MEMBITR)
                    this.addl('regs.P.C = ((' + operand + ') >>> (' + operand2 + ')) & 1;');
                else
                    this.addl(operand + ' = regs.P.C ? ' + operand + ' | (regs.P.C << ' + operand2 + ') : ' + operand + ' & ((~(1 << ' + operand2 + ')) & 0xFF);');
                break;
            case SPC_MN.SLEEP:
                this.addl('cpu.WAI = true;');
                break;
            case SPC_MN.STOP:
                this.addl('cpu.STP = true;')
                break;
            case SPC_MN.PCALL:
                this.CALL('regs.TR + 0xFF00');
                break;
            case SPC_MN.CLR1:
                this.load(operand, 'regs.TR');
                mask1 = 1 << BBCS1bit[opcode];
                this.addl('regs.TR &= ' + hex0x2(~mask1 & 0xFF) + ';');
                this.store(operand, 'regs.TR');
                break;
            case SPC_MN.SET1:
                this.load(operand, 'regs.TR');
                mask1 = 1 << BBCS1bit[opcode];
                this.addl('regs.TR |= ' + hex0x2(mask1) + ';');
                this.store(operand, 'regs.TR');
                break;
            case SPC_MN.NOT1:
                this.NOT1(operand, operand2);
                break;
            case SPC_MN.NOTC:
                this.addl('regs.P.C = regs.P.C ? 0 : 1;');
                break;
            default:
                console.log('Missing ins2', ins, operand);
                break;
        }
    }

    ADDRINS(addr_mode, ins, opcode) {
        switch(addr_mode) {
            case SPC_AM.RA_IMM: // A, #imm
                this.fetch_TR();
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_IND_X: // A, (X)
                this.load('regs.X', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_IND_INDEXED_X: // A, [dp+X]
                this.fetch_TA();
                this.addl('regs.TA += regs.X;')
                this.load16('regs.TA', 'regs.TA');
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_IND_Y_INDEXED: // A, [dp]+Y
                this.fetch_TA();
                this.load16('regs.TA', 'regs.TA');
                this.addl('regs.TA += regs.Y;');
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_DP: // A, dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_A: // A, !abs
                this.fetch16();
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_A_X: // RA, !abs+X
                this.fetch16();
                this.addl('regs.TA += regs.X;');
                this.read('regs.TA & 0xFFFF', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_A_Y: // RA, !abs+Y
                this.fetch16();
                this.addl('regs.TA += regs.Y;');
                this.read('regs.TA & 0xFFFF', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.YA_DP: // YA, dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.load('regs.TA+1', 'regs.TA');
                this.addl('regs.TR += (regs.TA << 8);')
                this.DOINS(ins, 'regs.TR');
                break;
            case SPC_AM.RA_DP_X: // A, dp+X
                this.fetch_TA();
                this.load('regs.TA + regs.X', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.I: // implied
                this.DOINS(ins, null, null, addr_mode, opcode);
                break;
            case SPC_AM.DP: // dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TR');
                this.store('regs.TA', 'regs.TR');
                break;
            case SPC_AM.DP_IMM: // dp, #imm
                this.fetch_TR();
                this.fetch_TA();
                this.load('regs.TA', 'regs.TA2');
                this.DOINS(ins, 'regs.TA2', 'regs.TR');
                if (ins === SPC_MN.CMP) break;
                this.store('regs.TA', 'regs.TA2')
                break;
            case SPC_AM.DP_INDEXED_X: // dp+X
                this.fetch_TA();
                this.addl('regs.TA += regs.X;');
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins,  'regs.TR');
                this.store('regs.TA', 'regs.TR');
                break;
            case SPC_AM.RA: // A
                this.DOINS(ins, 'regs.A');
                break;
            case SPC_AM.RX: // X
                this.DOINS(ins, 'regs.X');
                break;
            case SPC_AM.RY: // Y
                this.DOINS(ins,'regs.Y');
                break;
            case SPC_AM.IND_XY: // (X), (Y)
                this.load('regs.Y', 'regs.TA');
                this.load('regs.X', 'regs.TR');
                this.DOINS(ins,'regs.TR', 'regs.TA');
                if (ins === SPC_MN.CMP) break;
                this.store('regs.X', 'regs.TR');
                break;
            case SPC_AM.IMM:
                this.fetch_TR();
                this.DOINS(ins, 'regs.TR');
                break;
            case SPC_AM.A_IND_X: // [!abs+X]
                this.fetch16();
                this.addl('regs.TA = (regs.TA + regs.X) & 0xFFFF;');
                this.read16('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TR');
                break;
            case SPC_AM.Y_DP: // Y, d
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins,'regs.Y', 'regs.TR');
                break;
            case SPC_AM.DP_DP: // dp, dp2
                this.fetch_TR(); // dp2   TR = source, rhs
                this.fetch_TA(); // dp    TA = target, lhs
                this.load('regs.TR', 'regs.TR');
                this.load('regs.TA', 'regs.TA2');
                this.DOINS(ins, 'regs.TA2', 'regs.TR');
                if (ins === SPC_MN.CMP) break;
                this.store('regs.TA', 'regs.TA2');
                break;
            case SPC_AM.PC_R:
                this.DOINS(ins, 'regs.TA', null);
                break;
            case SPC_AM.PC_R_BIT: // d.bit, r  .. but backwards from normal
                this.fetch_TA();
                this.load('regs.TA', 'regs.TA');
                this.fetch_TR();
                switch(opcode) {
                    case 0x03: // BBS 0
                        this.BR('regs.TA & 1', 'regs.TR');
                        break;
                    case 0x13: // BBC 0
                        this.BR('(regs.TA & 1) === 0', 'regs.TR');
                        break;
                    case 0x23: // BBS 1
                        this.BR('regs.TA & 2', 'regs.TR');
                        break;
                    case 0x33: // BBC 1
                        this.BR('(regs.TA & 2) === 0', 'regs.TR');
                        break;
                    case 0x43: // BBS 2
                        this.BR('regs.TA & 4', 'regs.TR');
                        break;
                    case 0x53: // BBC 2
                        this.BR('(regs.TA & 0x04) === 0', 'regs.TR');
                        break;
                    case 0x63: // BBS 3
                        this.BR('regs.TA & 8', 'regs.TR');
                        break;
                    case 0x73: // BBC 3
                        this.BR('(regs.TA & 0x08) === 0', 'regs.TR');
                        break;
                    case 0x83: // BBS 4
                        this.BR('regs.TA & 0x10', 'regs.TR');
                        break;
                    case 0x93: // BBC 4
                        this.BR('(regs.TA & 0x10) === 0', 'regs.TR');
                        break;
                    case 0xA3: // BBS 5
                        this.BR('regs.TA & 0x20', 'regs.TR');
                        break;
                    case 0xB3: // BBC 5
                        this.BR('(regs.TA & 0x20) === 0', 'regs.TR');
                        break;
                    case 0xC3: // BBS 6
                        this.BR('regs.TA & 0x40', 'regs.TR');
                        break;
                    case 0xD3: // BBC 6
                        this.BR('(regs.TA & 0x40) === 0', 'regs.TR');
                        break;
                    case 0xE3: // BBS 7
                        this.BR('regs.TA & 0x80', 'regs.TR');
                        break;
                    case 0xF3: // BBC 7
                        this.BR('(regs.TA & 0x80) === 0', 'regs.TR');
                        break;
                }
                break;
            case SPC_AM.MEMBITR:
                this.fetch16();
                this.addl('regs.TR = (regs.TA >>> 13) & 7;');
                this.read('regs.TA & 0x1FFF', 'regs.TA');
                this.DOINS(ins, 'regs.TA', 'regs.TR', addr_mode);
                break;
            case SPC_AM.MEMBITW:
                this.fetch16();
                this.addl('regs.TR = (regs.TA >>> 13) & 7;'); // regs.TR is bit
                this.addl('regs.TA &= 0x1FFF;'); // regs.TA is addr
                this.read('regs.TA', 'regs.TA2'); // regs.TA2 is data
                this.DOINS(ins, 'regs.TA2', 'regs.TR', addr_mode);
                this.write('regs.TA', 'regs.TA2'); // write addr, data
                break;
            case SPC_AM.D_BIT:
                this.fetch_TA();
                this.DOINS(ins, 'regs.TA', null, addr_mode, opcode);
                break;
            case SPC_AM.JMPA:
                this.fetch16();
                this.addl('regs.PC = regs.TA');
                break;
            case SPC_AM.A:
                this.fetch16();
                if (opcode !== 0x5F) this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TR');
                if ((ins !== SPC_MN.CALL) && (ins !== SPC_MN.JMP)) {
                    this.write('regs.TA', 'regs.TR');
                }
                break;
            case SPC_AM.A16:
                this.fetch16();
                //this.read16('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TA');
                break;
            case SPC_AM.PC_R_D: // dp, r  r second byte
                this.fetch_TA();
                this.fetch_TR();
                this.load('regs.TA', 'regs.TA');
                this.DOINS(ins, 'regs.TA', 'regs.TR');
                break;
            case SPC_AM.PC_R_D_X: // dp+X, r  second byte
                this.fetch_TA();
                this.fetch_TR();
                this.load('regs.TA + regs.X', 'regs.TA');
                this.DOINS(ins, 'regs.TA', 'regs.TR');
                break;
            case SPC_AM.RX_IMM: // X, #imm
                this.fetch_TR();
                this.DOINS(ins, 'regs.X', 'regs.TR');
                break;
            case SPC_AM.RX_DP: // X, dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.X', 'regs.TR');
                break;
            case SPC_AM.RX_A: // X, !abs
                this.fetch16();
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.X', 'regs.TR');
                break;
            case SPC_AM.RY_IMM: // Y, #imm
                this.fetch_TR();
                this.DOINS(ins, 'regs.Y', 'regs.TR');
                break;
            case SPC_AM.RY_DP: // Y, dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.Y', 'regs.TR');
                break;
            case SPC_AM.RY_A: // Y, !abs
                this.fetch16();
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.Y', 'regs.TR');
                break;
            case SPC_AM.RY_R: // Y, r
                this.fetch_TR();
                this.DOINS(ins, 'regs.Y', 'regs.TR');
                break;
            case SPC_AM.DP_R: // dp, r
                this.fetch_TA();
                this.fetch_TR();
                this.load('regs.TA', 'regs.TA2');
                this.DOINS(ins, 'regs.TA2', 'regs.TR');
                this.store('regs.TA', 'regs.TA2');
                break;
            case SPC_AM.DPW: // dp (word)
                this.fetch_TA();
                this.load16('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TR');
                this.store16('regs.TA', 'regs.TR');
                break;
            case SPC_AM.YA_X:
                this.DIV();
                break;
            case SPC_AM.RYA:
                this.MUL();
                break;
            case SPC_AM.STACK:
                this.DOINS(ins, null, null, null, opcode);
                break;
            default:
                console.log('MISSING ADDR MODE', addr_mode, ins)
                break;
        }
    }

    MOV(ins) {
        let test = null;
        switch(ins) {
            case 0x5D: // X, A
                test = 'regs.X';
                this.addl('regs.X = regs.A;');
                break;
            case 0x7D: // A, X
                test = 'regs.A';
                this.addl('regs.A = regs.X;');
                break;
            case 0x8D: // Y, #imm
                test = 'regs.Y';
                this.fetch_TR();
                this.addl('regs.Y = regs.TR;');
                break;
            case 0x8F: // dp, #imm     operands last to first, except BBC, BBS, CBNE, and DBNZ
                this.fetch_TR();
                this.fetch_TA();
                this.store('regs.TA', 'regs.TR');
                break;
            case 0x9D: // X, SP
                test = 'regs.X';
                this.addl('regs.X = regs.SP');
                break;
            case 0xAF: // (X)+, A
                this.store('regs.X', 'regs.A');
                this.addl('regs.X = (regs.X + 1) & 0xFF;');
                break;
            case 0xBD: // SP, X
                this.addl('regs.SP = regs.X;');
                break;
            case 0xBF: // A, (X)+
                test = 'regs.A';
                this.load('regs.X', 'regs.A');
                this.addl('regs.X = (regs.X + 1) & 0xFF;');
                break;
            case 0xC4: // dp, A
                this.fetch_TA();
                this.store('regs.TA', 'regs.A');
                break;
            case 0xC5: // !abs, A
                this.fetch16();
                this.write('regs.TA', 'regs.A');
                break;
            case 0xC6: // (X), A
                this.store('regs.X', 'regs.A')
                break;
            case 0xC7: // [dp+X], A
                this.fetch_TA();
                this.addl('regs.TA += regs.X;');
                this.load16('regs.TA', 'regs.TA');
                this.write('regs.TA', 'regs.A');
                break;
            case 0xC9: // !abs, X
                this.fetch16();
                this.write('regs.TA', 'regs.X');
                break;
            case 0xCB: // dp, Y
                this.fetch_TA();
                this.store('regs.TA', 'regs.Y');
                break;
            case 0xCC: // !a, Y
                this.fetch16();
                this.write('regs.TA', 'regs.Y');
                break;
            case 0xCD: // X, #imm
                test = 'regs.X';
                this.fetch_TR();
                this.addl('regs.X = regs.TR;');
                break;
            case 0xD4: // dp+X, A
                this.fetch_TA();
                this.store('regs.TA + regs.X', 'regs.A');
                break;
            case 0xD5: // !abs+X, A
                this.fetch16();
                this.addl('regs.TA += regs.X;');
                this.write('regs.TA', 'regs.A');
                break;
            case 0xD6: // !abs+Y, A
                this.fetch16();
                this.addl('regs.TA += regs.Y;');
                this.write('regs.TA', 'regs.A');
                break;
            case 0xD7: // [dp]+Y, A
                this.fetch_TR();
                this.load16('regs.TR', 'regs.TA');
                this.addl('regs.TA = (regs.TA + regs.Y) & 0xFFFF;');
                this.write('regs.TA', 'regs.A');
                break;
            case 0xD8: // dp, X
                this.fetch_TA();
                this.store('regs.TA', 'regs.X');
                break;
            case 0xD9: // dp+Y, X
                this.fetch_TA();
                this.store('regs.TA + regs.Y', 'regs.X');
                break;
            case 0xDB: // dp+X, Y
                this.fetch_TA();
                this.store('regs.TA + regs.X', 'regs.Y');
                break;
            case 0xDD: // A, Y
                test = 'regs.A';
                this.addl('regs.A = regs.Y;');
                break;
            case 0xE4: // A, d
                test = 'regs.A';
                this.fetch_TA();
                this.load('regs.TA', 'regs.A');
                break;
            case 0xE5: // A, !abs
                test = 'regs.A';
                this.fetch16();
                this.read('regs.TA', 'regs.A');
                break;
            case 0xE6: // A, (X)
                test = 'regs.A';
                this.load('regs.X', 'regs.A');
                break;
            case 0xE7: // A, [dp+X]
                test = 'regs.A';
                this.fetch_TA();
                this.load16('regs.TA + regs.X', 'regs.TA2');
                this.read('regs.TA2', 'regs.A');
                break;
            case 0xE8: // A, #imm
                test = 'regs.A';
                this.fetch('regs.A');
                break;
            case 0xE9: // X, !abs
                test = 'regs.X';
                this.fetch16();
                this.read('regs.TA', 'regs.X');
                break;
            case 0xEB: // Y, d
                test = 'regs.Y';
                this.fetch_TA();
                this.load('regs.TA', 'regs.Y');
                break;
            case 0xEC: // Y, !abs
                test = 'regs.Y';
                this.fetch16();
                this.read('regs.TA', 'regs.Y');
                break;
            case 0xF4: // A, dp+X
                test = 'regs.A';
                this.fetch_TA();
                this.load('regs.TA + regs.X', 'regs.A');
                break;
            case 0xF5: // A, !a+X
                test = 'regs.A';
                this.fetch16();
                this.read('(regs.TA + regs.X) & 0xFFFF', 'regs.A');
                break;
            case 0xF6: // A, !a+Y
                test = 'regs.A';
                this.fetch16();
                this.read('(regs.TA + regs.Y) & 0xFFFF', 'regs.A');
                break;
            case 0xF7: // A, [dp]+Y
                test = 'regs.A';
                this.fetch_TR();
                this.load16('regs.TR', 'regs.TA');
                this.addl('regs.TA = (regs.TA + regs.Y) & 0xFFFF;');
                this.read('regs.TA', 'regs.A');
                break;
            case 0xF8: // X, dp
                test = 'regs.X';
                this.fetch_TR();
                this.load('regs.TR', 'regs.X');
                break;
            case 0xF9: // X, dp+Y
                test = 'regs.X';
                this.fetch_TA();
                this.load('regs.TA + regs.Y', 'regs.X');
                break;
            case 0xFA: // TA, TR  dp, dp
                this.fetch_TR();
                this.fetch_TA();
                this.load('regs.TR', 'regs.TR');
                this.store('regs.TA', 'regs.TR');
                break;
            case 0xFB: // Y, dp+X
                test = 'regs.Y';
                this.fetch_TA();
                this.load('regs.TA + regs.X', 'regs.Y');
                break;
            case 0xFD: // Y, A
                test = 'regs.Y';
                this.addl('regs.Y = regs.A;');
                break;
        }
        if (test !== null) {
            this.setz(test);
            this.setn(test);
        }
    }

    MOVW(ins) {
        switch(ins) {
            case 0xBA: // YA, dp
                this.fetch_TA();
                this.load16_2D('regs.TA', 'regs.A', 'regs.Y');
                this.addl('regs.P.N = (regs.Y & 0x80) >>> 7;');
                this.addl('regs.P.Z = +(0 === regs.A === regs.Y);');
                break;
            case 0xDA: // dp, YA
                this.fetch_TA();
                this.store16_2D('regs.TA', 'regs.A', 'regs.Y');
                break;
        }
    }

    setn(who) {
        this.addl('regs.P.N = ((' + who + ') & 0x80) >>> 7;');
    }

    setz(who) {
        this.addl('regs.P.Z = +((' + who + ') === 0);');
    }

    addl1(what) {
        this.outstr += this.indent1 + what + '\n';
    }

    addl(what) {
        this.outstr += this.indent2 + what + '\n';
    }

    fetch_from_PC(who) {
        this.addl(who + ' = cpu.read8(regs.PC);');
    }

    fetch_from_PC_and_inc(who) {
        this.fetch_from_PC(who);
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    finished() {
        this.addl('cpu.cycles -= regs.opc_cycles;');
        this.fetch_from_PC_and_inc('regs.IR');
        this.addl1('}')
        return this.outstr;
    }
}

function SPC_generate_instruction_function(indent, opcode) {
    let indent2 = indent + '    ';
    let opcode_info = SPC_INS[opcode];
    if (typeof opcode_info === 'undefined') {
        //console.log('SKIPPING OPCODE ' + hex0x2(opcode));
        return '';
    }
    let ag = new SPC_funcgen(indent2, opcode_info);
    switch(opcode_info.ins) {
        case SPC_MN.MOV:
            ag.MOV(opcode_info.opcode);
            break;
        case SPC_MN.MOVW:
            ag.MOVW(opcode_info.opcode);
            break;
        default:
            ag.ADDRINS(opcode_info.addr_mode, opcode_info.ins, opcode);
            break;
    }
    return ag.finished() + ',';
}

function SPC_decode_opcodes() {
    let outstr = '{\n';
    for (let i = 0; i < 256; i++) {
        outstr += SPC_generate_instruction_function('    ', i);
    }
    return outstr + '}';
}

function mainhere() {
    console.log(SPC_decode_opcodes());
    //console.log(SPC_generate_instruction_function('', 0x01));
}