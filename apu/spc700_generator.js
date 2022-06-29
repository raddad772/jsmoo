"use strict";

const SPC_MN = Object.freeze({
    UNKNOWN: 0,
    ADC: 1,
    ADDW: 2,
    AND: 3,
    AND1: 4,
    ASL: 5,
    BBC: 6,
    BBS: 7,
    BCC: 8,
    BCS: 9,
    BEQ: 10,
    BMI: 11,
    BNE: 12,
    BPL: 13,
    BVC: 14,
    BVS: 15,
    BRA: 16,
    BRK: 17,
    CALL: 18,
    CBNE: 19,
    CLR1: 20,
    CLRC: 21,
    CLRP: 22,
    CLRV: 23,
    CMP: 24,
    CMPW: 25,
    DAA: 26,
    DAS: 27,
    DBNZ: 28,
    DEC: 29,
    DECW: 30,
    DI: 31,
    DIV: 32,
    EI: 33,
    EOR: 34,
    EOR1: 35,
    INC: 36,
    INCW: 37,
    JMP: 38,
    LSR: 39,
    MOV: 40,
    MOV1: 41,
    MOVW: 42,
    MUL: 43,
    NOP: 44,
    NOT1: 45,
    NOTC: 46,
    OR: 47,
    OR1: 48,
    PCALL: 49,
    POP: 50,
    PUSH: 51,
    RET: 52,
    RET1: 53,
    ROL: 54,
    ROR: 55,
    SBC: 56,
    SET1: 57,
    SETC: 58,
    SETP: 59,
    SLEEP: 60,
    STOP: 61,
    SUBW: 62,
    TCALL: 63,
    TCLR1: 64,
    TSET1: 65,
    XCN: 66
});

const SPC_AM = Object.freeze({
    I: 0, // Implied
    PC_R: 2, // PC relative
    IND_XY: 3, // X/Y indirect Zero Page
    RX: 4, // register X
    RY: 5, // register Y
    RA: 6, // register A
    A_IND_X: 7, // [!absolute + x]
    MOV: 8, // MOV has its own stuff
    DP_IMM: 9, // dp, #imm
    X_IMM: 10, // X, #imm
    X_DP: 11, // X, dp
    X_A: 12, // X, !abs
    Y_IMM: 13, // Y, #imm
    Y_DP: 14, // Y, dp
    Y_A: 15, // Y, !abs
    DP_DP: 16, // dp, dp
    MEMBITR: 17, // 2 bytes. 13 bits absolute address, 3 bits bit #
    MEMBITW: 22, // 2 bytes. 13 bits absolute address, 3 bits bit #
    DP: 18, // dp
    DP_INDEXED_X: 19,
    MOVW: 20,
    PC_R_BIT: 21, // PC relative based on a bit
});

class SPC_OP_INFO {
    constructor(opcode, mnemonic, operand, ins, addr_mode, cycles) {
        this.opcode = opcode;
        this.mnemonic = mnemonic;
        this.operand = operand;
        this.ins = ins;
        this.addr_mode = addr_mode;
        this.cycles = cycles;
    }
}

/*
 */
const SPC_INS = Object.freeze({
    0x00: new SPC_OP_INFO(0x00, 'NOP', '', SPC_MN.NOP, SPC_AM.I, 2), // X
    0x01: new SPC_OP_INFO(0x01, 'TCALL', '0', SPC_MN.TCALL, SPC_AM.I, 8), // X
    0x0B: new SPC_OP_INFO(0x0B, 'ASL', 'd', SPC_MN.ASL, SPC_AM.DP, 4), // X
    0x10: new SPC_OP_INFO(0x10, 'BPL', 'r', SPC_MN.BPL, SPC_AM.PC_R, 2), // +2 for branch
    0x19: new SPC_OP_INFO(0x19, 'OR', '(X), (Y)', SPC_MN.OR, SPC_AM.IND_XY, 5), // X
    0x1D: new SPC_OP_INFO(0x1D, 'DEC', 'X', SPC_MN.DEC, SPC_AM.RX, 2), // X
    0x1F: new SPC_OP_INFO(0x1F, 'JMP', '[!a+X]', SPC_MN.JMP, SPC_AM.A_IND_X, 6), // X
    0x2F: new SPC_OP_INFO(0x2F, 'BRA', 'r', SPC_MN.BRA, SPC_AM.PC_R, 4), // X
    0x5D: new SPC_OP_INFO(0x5D, 'MOV', 'X, A', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0x78: new SPC_OP_INFO(0x78, 'CMP', 'dp, #imm', SPC_MN.CMP, SPC_AM.DP_IMM, 5), // X
    0x7E: new SPC_OP_INFO(0x7E, 'CMP', 'Y, d', SPC_MN.CMP, SPC_AM.Y_DP, 3), // X
    0x8F: new SPC_OP_INFO(0x8F, 'MOV', 'd, #imm', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xAA: new SPC_OP_INFO(0xAA, 'MOV1', 'C, m.b', SPC_MN.MOV1, SPC_AM.MEMBITR, 4), // X
    0xAB: new SPC_OP_INFO(0xAB, 'INC', 'd', SPC_MN.INC, SPC_AM.DP, 4), // X
    0xBA: new SPC_OP_INFO(0xBA, 'MOVW', 'YA, d', SPC_MN.MOVW, SPC_AM.MOVW, 5), // X
    0xBB: new SPC_OP_INFO(0xBB, 'INC', 'd+X', SPC_MN.INC, SPC_AM.DP_INDEXED_X, 5), // X
    0xBD: new SPC_OP_INFO(0xBD, 'MOV', 'SP, X', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0xC0: new SPC_OP_INFO(0xC0, 'DI', '', SPC_MN.DI, SPC_AM.I, 3), // X
    0xC4: new SPC_OP_INFO(0xC4, 'MOV', 'd, A', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xC6: new SPC_OP_INFO(0xC6, 'MOV', '(X), A', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xCB: new SPC_OP_INFO(0xCB, 'MOV', 'd, Y', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xCC: new SPC_OP_INFO(0xCC, 'MOV', '!a, Y', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xCD: new SPC_OP_INFO(0xCD, 'MOV', 'X, #imm', SPC_MN.MOV, SPC_AM.MOV,2), // X
    0xD0: new SPC_OP_INFO(0xD0, 'BNE', 'r', SPC_MN.BNE, SPC_AM.PC_R, 2), // X
    0xD7: new SPC_OP_INFO(0xD7, 'MOV', '[dp]+Y, A', SPC_MN.MOV, SPC_AM.MOV, 7), // X
    0xDA: new SPC_OP_INFO(0xDA, 'MOVW', 'd, YA', SPC_MN.MOVW, SPC_AM.MOVW, 5), // X
    0xDB: new SPC_OP_INFO(0xDB, 'MOV', 'dp+X, Y', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xDD: new SPC_OP_INFO(0xDD, 'MOV', 'A, Y', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0xE4: new SPC_OP_INFO(0xE4, 'MOV', 'A, d', SPC_MN.MOV, SPC_AM.MOV, 3), // X
    0xE8: new SPC_OP_INFO(0xE8, 'MOV', 'A, #imm', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0xEB: new SPC_OP_INFO(0xEB, 'MOV', 'Y, d', SPC_MN.MOV, SPC_AM.MOV, 3), // X
    0xEF: new SPC_OP_INFO(0xEF, 'SLEEP', '', SPC_MN.SLEEP, SPC_AM.I, 3), // X
    0xF3: new SPC_OP_INFO(0xF3, 'BBC', 'd.n, r', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0xF4: new SPC_OP_INFO(0xF4, 'MOV', 'A, d+X', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xF5: new SPC_OP_INFO(0xF5, 'MOV', '!a+X', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xF6: new SPC_OP_INFO(0xF6, 'MOV', '!a+Y', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xFB: new SPC_OP_INFO(0xFB, 'MOV', 'Y, d+X', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xFC: new SPC_OP_INFO(0xFC, 'INC', 'Y', SPC_MN.INC, SPC_AM.RY, 2), // X
    0xFF: new SPC_OP_INFO(0xFF, 'STOP', '', SPC_MN.STOP, SPC_AM.I, 2), // X
})

class SPC_funcgen {
    constructor(indent, opc_info) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.cycles = opc_info.cycles;
        this.outstr = '';
        this.addl1(hex0x2(opc_info.opcode) + ': function(cpu, regs) { // ' + opc_info.mnemonic + ' ' + opc_info.operand);
        this.addl('regs.opc_cycles = ' + opc_info.cycles + ';');
    }

    from_PC_inc(who) {
        this.addl(who + ' = cpu.read8(regs.PC++);');
        this.addl('regs.PC &= 0xFFFF;');
    }

    TR_from_PC_inc() {
        this.from_PC_inc('regs.TR')
    }

    TA_from_PC_inc() {
        this.from_PC_inc('regs.TA');
    }

    TA16_from_PC_incs() {
        this.addl('regs.TA = cpu.read8(regs.PC++);');
        this.addl('regs.PC &= 0xFFFF;');
        this.addl('regs.TA += cpu.read8(regs.PC++) << 8;');
        this.addl('regs.PC &= 0xFFFF;');
    }

    TA16_from_DP_1inc(who) {
        this.addl('regs.TA = cpu.read8D(' + who +'++);');
        this.addl(who + ' &= 0xFF;');
        this.addl('regs.TA += cpu.read8D(' + who + ') << 8;');
    }

    load(where, what) {
        this.addl(what + ' = cpu.read8(' + where + ');');
    }

    load_D(where, what) {
        this.addl(what + ' = cpu.read8D((' + where + '));');
    }

    store(where, what) {
        this.addl('cpu.write8(' + where + ', ' + what +');');
    }

    store_D(where, what) {
        this.addl('cpu.write8D((' + where + '), ' + what + ');');
    }

    store16_D(where, what) {
        this.addl('cpu.write8D((' + where + '), ' + what + ' & 0xFF);')
        this.addl('cpu.write8D((' + where + ') + 1, ((' + what + ') >>> 8) & 0xFF);')
    }

    load16_2D(where, lo, hi) {
        this.load_D(where, lo);
        this.load_D(where + ' + 1', hi);
    }

    store16_2D(where, lo, hi) {
        this.store_D(where, lo);
        this.store_D(where + ' + 1', hi);
    }

    ADC(who, y) {
        this.addl('let z = (' + who + ') + (' + y + ') + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        this.addl('regs.P.H = (((' + who + ') ^ (' + y + ') ^ z) & 0x10) >>> 4;');
        this.addl('regs.P.V = (((~((' + who + ') ^ (' + y + ' ))) & ((' + who + ') ^ z)) & 0x80) >>> 7;');
        this.addl('regs.P.N = (z & 0x80) >>> 8;');
        this.addl(who + ' = z;');
    }

    AND(who, y) {
        this.addl(who + ' &= (' + y + ');');
        this.setz(who);
        this.setn(who);
    }

    ASL(who) {
        this.addl('regs.P.C = ((' + who + ') & 0x80) >>> 7;');
        this.addl(who + ' <<= 1;');
        this.setz(who);
        this.setn(who);
    }

    BR(when, where) {
        let indent = '';
        if (when !== 'true') {
            this.addl('if (' + when + ') {');
            indent = '    '
        }
        this.addl(indent + 'regs.PC = (regs.PC + mksigned8(' + where + ')) & 0xFFFF;');
        this.addl(indent + 'regs.opc_cycles += 2');
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

    DEC(who) {
        this.addl(who + ' = (' + who + ' - 1) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    DI() {
        this.addl('regs.P.I = 0;');
    }

    INC(who) {
        this.addl(who + ' = (' + who + ' + 1) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    OR(who, who2) {
        this.addl(who + ' &= ' + who2);
        this.setz(who);
        this.setn(who);
    }

    PUSH(what) {
        this.addl('cpu.write8(0x100 + regs.SP--, ' + what + ');');
        this.addl('regs.SP &= 0xFF;');
    }

    TCALL(opcode) {
        let vec;
        switch(opcode) {
            case 0x01:
                vec = 0xFFDE;
                break;
            case 0x11:
                vec = 0xFFDC;
                break;
            case 0x21:
                vec = 0xFFDA;
                break;
            case 0x31:
                vec = 0xFFD8;
                break;
            case 0x41:
                vec = 0xFFD6;
                break;
            case 0x51:
                vec = 0xFFD4;
                break;
            case 0x61:
                vec = 0xFFD2;
                break;
            case 0x71:
                vec = 0xFFD0;
                break;
            case 0x81:
                vec = 0xFFCE;
                break;
            case 0x91:
                vec = 0xFFCC;
                break;
            case 0xA1:
                vec = 0xFFCA;
                break;
            case 0xB1:
                vec = 0xFFC8;
                break;
            case 0xC1:
                vec = 0xFFC6;
                break;
            case 0xD1:
                vec = 0xFFC4;
                break;
            case 0xE1:
                vec = 0xFFC2;
                break;
            case 0xF1:
                vec = 0xFFC0;
                break;
        }
        this.PUSH('(regs.PC >>> 8) & 0xFF');
        this.PUSH('(regs.PC & 0xFF)');
        this.addl('regs.PC = ' + hex0x4(vec) + ';');
    }

    DOINS(ins, operand, operand2, addr_mode, opcode) {
        switch(ins) {
            case SPC_MN.TCALL:
                this.TCALL(opcode);
                break;
            case SPC_MN.DI:
                this.DI();
                break;
            case SPC_MN.CMP:
                this.CMP(operand, operand2);
                break;
            case SPC_MN.DEC:
                this.DEC(operand);
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
            case SPC_MN.BRA:
                this.TR_from_PC_inc();
                this.BR('true', 'regs.TR');
                break;
            case SPC_MN.BNE:
                this.TR_from_PC_inc();
                this.BR('!regs.P.Z', 'regs.TR');
                break;
            case SPC_MN.BPL:
                this.TR_from_PC_inc();
                this.BR('!regs.P.N', 'regs.TR');
                break;
            case SPC_MN.JMP:
                this.addl('regs.PC = ' + operand + ';');
                break;
            case SPC_MN.MOV1:
                if (addr_mode === SPC_AM.MEMBITR)
                    this.addl('regs.P.C = ((' + operand + ') >>> ((' + operand2 + ') - 1)) & 1;');
                else
                    this.addl(operand + ' = regs.P.C <<< ' + operand2 + ';');
                break;
            case SPC_MN.SLEEP:
                this.addl('cpu.WAI = true;');
                break;
            case SPC_MN.STOP:
                this.addl('cpu.STP = true;')
                break;
            default:
                console.log('Missing ins2', ins, operand);
                break;
        }
    }

    ADDRINS(addr_mode, ins, opcode) {
        switch(addr_mode) {
            case SPC_AM.I: // implied
                this.DOINS(ins, null, null, addr_mode, opcode);
                break;
            case SPC_AM.DP: // d
                this.TA_from_PC_inc();
                this.load_D('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TR');
                this.store_D('regs.TA', 'regs.TR');
                break;
            case SPC_AM.DP_IMM: // dp, #imm
                this.TR_from_PC_inc();
                this.TA_from_PC_inc();
                this.load_D('regs.TA', 'regs.TA');
                this.DOINS(ins, 'regs.TA', 'regs.TR');
                break;
            case SPC_AM.DP_INDEXED_X: // d+X
                this.TA_from_PC_inc();
                this.addl('regs.TA = (regs.TA + regs.X) & 0xFF;');
                this.load_D('regs.TA', 'regs.TR');
                this.DOINS(ins,  'regs.TR');
                this.store_D('regs.TA', 'regs.TR');
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
                this.load('regs.X', 'regs.TA');
                this.load('regs.Y', 'regs.TR');
                this.DOINS(ins,'regs.TR', 'regs.TA');
                this.store('regs.X', 'regs.TR');
                break;
            case SPC_AM.A_IND_X: // [!a+X]
                this.TA16_from_PC_incs();
                this.addl('regs.TA = (regs.TA + regs.X) & 0xFFFF;');
                this.DOINS(ins, 'regs.TA');
                break;
            case SPC_AM.Y_DP: // Y, d
                this.TA_from_PC_inc();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins,'regs.Y', 'regs.TR');
                break;
            case SPC_AM.PC_R:
                this.DOINS(ins, 'regs.TA', null);
                break;
            case SPC_AM.PC_R_BIT: // d.bit, r  .. but backwards from normal
                this.TR_from_PC_inc();
                this.TA_from_PC_inc();
                this.load('regs.TA', 'regs.TA');
                switch(opcode) {
                    case 0x13: // 0
                        this.BR('(regs.TA & 1) === 0', 'regs.TR');
                        break;
                    case 0x33:
                        this.BR('(regs.TA & 2) === 0', 'regs.TR');
                        break;
                    case 0x53:
                        this.BR('(regs.TA & 0x04) === 0', 'regs.TR');
                        break;
                    case 0x73:
                        this.BR('(regs.TA & 0x08) === 0', 'regs.TR');
                        break;
                    case 0x93:
                        this.BR('(regs.TA & 0x10) === 0', 'regs.TR');
                        break;
                    case 0xB3:
                        this.BR('(regs.TA & 0x20) === 0', 'regs.TR');
                        break;
                    case 0xD3:
                        this.BR('(regs.TA & 0x40) === 0', 'regs.TR');
                        break;
                    case 0xF3:
                        this.BR('(regs.TA & 0x80) === 0', 'regs.TR');
                        break;
                }
                break;
            case SPC_AM.MEMBITR:
                this.TA16_from_PC_incs();
                this.addl('regs.TR = (regs.TA >>> 13) & 7;');
                this.load('regs.TA & 0x1FFF', 'regs.TA');
                this.DOINS(ins, 'regs.TA', 'regs.TR', addr_mode);
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
            case 0x8F: // d, #imm     operands last to first, except BBC, BBS, CBNE, and DBNZ
                this.TR_from_PC_inc();
                this.TA_from_PC_inc();
                this.store_D('regs.TA', 'regs.TR');
                break;
            case 0xBD: // SP, X
                this.addl('regs.SP = regs.X;');
                break;
            case 0xC4: // d, A
                this.TA_from_PC_inc();
                this.store_D('regs.TA', 'regs.A');
                break;
            case 0xC6: // (X), A
                this.store('regs.X', 'regs.A')
                break;
            case 0xCB: // d, Y
                this.TA_from_PC_inc();
                this.store_D('regs.TA', 'regs.Y');
                break;
            case 0xCC: // !a, Y
                this.TA16_from_PC_incs();
                this.store('regs.TA', 'regs.Y');
                break;
            case 0xCD: // X, #imm
                test = 'regs.X';
                this.TR_from_PC_inc();
                this.addl('regs.X = regs.TR;');
                break;
            case 0xD7: // [dp]+Y, A
                this.TR_from_PC_inc();
                this.TA16_from_DP_1inc('regs.TR');
                this.addl('regs.TA = (regs.TA + regs.Y) & 0xFFFF;');
                this.store('regs.TA', 'regs.A');
                break;
            case 0xDB: // [dp]+X, Y
                this.TR_from_PC_inc();
                this.TA16_from_DP_1inc('regs.TR');
                this.addl('regs.TA = (regs.TA + regs.X) & 0xFFFF;');
                this.store('regs.TA', 'regs.A');
                break;
            case 0xDD: // A, Y
                test = 'regs.A';
                this.addl('regs.A = regs.Y;');
                break;
            case 0xE4: // A, d
                test = 'regs.A';
                this.TA_from_PC_inc();
                this.load_D('regs.TA', 'regs.A');
                break;
            case 0xE8: // A, #imm
                test = 'regs.A';
                this.from_PC_inc('regs.A');
                break;
            case 0xEB: // Y, d
                test = 'regs.Y';
                this.TA_from_PC_inc();
                this.load_D('regs.TA', 'regs.Y');
                break;
            case 0xF4: // A, d+X
                test = 'regs.A';
                this.TA_from_PC_inc();
                this.load_D('regs.TA + regs.X', 'regs.A');
                break;
            case 0xF5: // A, !a+X
                test = 'regs.A';
                this.TA16_from_PC_incs();
                this.load('(regs.TA + regs.X) & 0xFFFF', 'regs.A');
                break;
            case 0xF6: // A, !a+Y
                test = 'regs.A';
                this.TA16_from_PC_incs();
                this.load('(regs.TA + regs.Y) & 0xFFFF', 'regs.A');
                break;
            case 0xFB: // Y, d+X
                test = 'regs.Y';
                this.TA_from_PC_inc();
                this.load_D('regs.TA + regs.X', 'regs.A');
                break;
        }
        if (test !== null) {
            this.setz(test);
            this.setn(test);
        }
    }

    MOVW(ins) {
        switch(ins) {
            case 0xBA: // YA, d
                this.TA_from_PC_inc();
                this.load16_2D('regs.TA', 'regs.A', 'regs.Y');
                this.addl('regs.P.N = (regs.Y & 0x80) >>> 8;');
                this.addl('regs.P.Z = +(regs.Y === 0 && regs.A === 0);');
                break;
            case 0xDA: // d, YA
                this.TA_from_PC_inc();
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

function SPC_get_decoded_opcode(regs) {
    let opcf = SPC_decoded_opcodes[regs.IR];
    if (typeof opcf === 'undefined') return null;
    return opcf;
}