"use strict";

// So, a quick note.
// Most of this code is based off of https://www.westerndesigncenter.com/wdc/documentation/w65c816s.pdf
// I also took some inspiration from Higan's way of doing ADC and SUB, and also general way
//  of generating instructions from "algorithms."
// However, I started this before I looked at Higan, and the code generation approach is
//  my own terrible fault.
// That pdf has several easy-to-find errors. I can't imagine how many difficult-to-find ones there are.
// However, it's an amazingly good resource, letting you know (for the most part) what the
//  CPU is doing each cycle during an operation.

// Function that checks opcode_AM_R, which is used to generate opcode_AM
function check_addressing_matrix() {
    console.log('Checking addressing matrix...')
    let testourset = function(i, ourset, ourthere, addrmode, mnemonic) {
        if (addrmode.includes(i)) {
            ourthere[i] = true;
            if (i in ourset) {
                console.log('$' + hex2(i) + ' found more than once: ' + ourset[i] + ' and ' + mnemonic);
            }
            ourset[i] = mnemonic;
        }
    };

    let ourset = {}, ourthere = {};
    for (let i = 0; i < 256; i++) {
        ourthere[i] = false;
    }
    for (let i in opcode_AM_R) {
        let opcodes = opcode_AM_R[i];
        for (let j = 0; j < opcodes.length; j++) {
            let opcode = opcodes[j];
            testourset(opcode, ourset, ourthere, opcodes, opcode_AM_MN[j]);
        }
    }
    for(let i = 0; i < 256; i++) {
        if (!ourset.hasOwnProperty(i)) {
            console.log('$' + hex2(i) + ' not found!');
        }
    }
}

function check_mnemonic_matrix() {
    console.log('Checking mnemonic matrix...')
    let testourset = function(i, ourset, ourthere, opcodes, mnemonic) {
        if (opcodes.includes(i)) {
            ourthere[i] = true;
            if (i in ourset) {
                console.log('$' + hex2(i) + ' found more than once: ' + ourset[i] + ' and ' + mnemonic);
            }
            ourset[i] = mnemonic;
        }
    };

    let ourset = {}, ourthere = {};
    for (let i = 0; i < 256; i++) {
        ourthere[i] = false;
    }
    for (let i in opcode_MN_R) {
        let opcodes = opcode_MN_R[i];
        for (let j in opcodes) {
            let opcode = opcodes[j];
            testourset(opcode, ourset, ourthere, opcodes, opcode_MN[j]);
        }
    }
    for(let i = 0; i < 256; i++) {
        if (!ourset.hasOwnProperty(i)) {
            console.log('$' + hex2(i) + ' not found!');
        }
    }
}
check_addressing_matrix();
check_mnemonic_matrix();

function array_of_array_contains(array, el) {
    for (let j in array) {
        if (!(typeof(array[j].find(value => value === el)) === 'undefined')) {
            return j;
        }
    }
    return -1;
}

class opcode_info {
    constructor(opcode, ins, addr_mode_split, mnemonic) {
        this.opcode = opcode;
        this.ins = ins;
        this.addr_mode = addr_mode_split;
        this.mnemonic = mnemonic;
    }
}

function ins_backwards(ins) {
    ins = parseInt(ins);
    for (let j in OM) {
        if (OM[j] === ins)
            return 'OM.' + j;
    }
    return 'UNKNOWN';
}

function addr_backwards(addr_mode) {
    addr_mode = parseInt(addr_mode);
    for (let j in AM) {
        if (AM[j] === addr_mode)
            return 'AM.' + j;
    }
    return 'UNKNOWN';
}

function generate_opcodes_struct(indent) {
    let outstr = indent + 'const opcode_matrix = Object.freeze({\n';
    let has_been = false;
    for (let opcode = 0; opcode <= MAX_OPCODE; opcode++) {
        if (has_been)
            outstr += ',\n';
        has_been = true;
        let ins = array_of_array_contains(opcode_MN_R, opcode);
        let addr_mode = array_of_array_contains(opcode_AM_R, opcode);
        let addr_mode_split = array_of_array_contains(opcode_AM_SPLIT_R, opcode);
        if (ins === -1 || addr_mode === -1 || addr_mode_split === -1) {
            console.log('FAILED CONSTRUCTION could not find opcode ', hex2(opcode), ins, addr_mode, addr_mode_split);
            return '';
        }
        let thistr = indent + '    0x' + hex2(opcode) + ': new opcode_info(0x' + hex2(opcode) + ', ' + ins_backwards(ins) + ', ' + addr_backwards(addr_mode_split) + ', "' + opcode_MN[ins] + ' ' + opcode_AM_MN[addr_mode] + '")'
        outstr += thistr;
    }
    outstr += '\n' + indent + '});'
    return outstr;
}

// created by
// console.log(generate_opcodes_struct());
const opcode_matrix = Object.freeze({
    0x00: new opcode_info(0x00, OM.BRK, AM.STACKj, "BRK s"),
    0x01: new opcode_info(0x01, OM.ORA, AM.D_INDEXED_IND, "ORA (d,x)"),
    0x02: new opcode_info(0x02, OM.COP, AM.STACKj, "COP s"),
    0x03: new opcode_info(0x03, OM.ORA, AM.STACK_R, "ORA d,s"),
    0x04: new opcode_info(0x04, OM.TSB, AM.Db, "TSB d"),
    0x05: new opcode_info(0x05, OM.ORA, AM.D, "ORA d"),
    0x06: new opcode_info(0x06, OM.ASL, AM.Db, "ASL d"),
    0x07: new opcode_info(0x07, OM.ORA, AM.D_IND_L, "ORA [d]"),
    0x08: new opcode_info(0x08, OM.PHP, AM.STACKc, "PHP s"),
    0x09: new opcode_info(0x09, OM.ORA, AM.IMM, "ORA #"),
    0x0A: new opcode_info(0x0A, OM.ASL, AM.ACCUM, "ASL A"),
    0x0B: new opcode_info(0x0B, OM.PHD, AM.STACKc, "PHD s"),
    0x0C: new opcode_info(0x0C, OM.TSB, AM.Ad, "TSB a"),
    0x0D: new opcode_info(0x0D, OM.ORA, AM.A, "ORA a"),
    0x0E: new opcode_info(0x0E, OM.ASL, AM.Ad, "ASL a"),
    0x0F: new opcode_info(0x0F, OM.ORA, AM.AL, "ORA al"),
    0x10: new opcode_info(0x10, OM.BPL, AM.PC_R, "BPL r"),
    0x11: new opcode_info(0x11, OM.ORA, AM.D_IND_INDEXED, "ORA (d),y"),
    0x12: new opcode_info(0x12, OM.ORA, AM.D_IND, "ORA (d)"),
    0x13: new opcode_info(0x13, OM.ORA, AM.STACK_R_IND_INDEXED, "ORA (d,s),y"),
    0x14: new opcode_info(0x14, OM.TRB, AM.Db, "TRB d"),
    0x15: new opcode_info(0x15, OM.ORA, AM.D_INDEXED_X, "ORA d,x"),
    0x16: new opcode_info(0x16, OM.ASL, AM.D_INDEXED_Xb, "ASL d,x"),
    0x17: new opcode_info(0x17, OM.ORA, AM.D_IND_L_INDEXED, "ORA [d],y"),
    0x18: new opcode_info(0x18, OM.CLC, AM.I, "CLC i"),
    0x19: new opcode_info(0x19, OM.ORA, AM.A_INDEXED_Y, "ORA a,y"),
    0x1A: new opcode_info(0x1A, OM.INC, AM.ACCUM, "INC A"),
    0x1B: new opcode_info(0x1B, OM.TCS, AM.I, "TCS i"),
    0x1C: new opcode_info(0x1C, OM.TRB, AM.Ad, "TRB a"),
    0x1D: new opcode_info(0x1D, OM.ORA, AM.A_INDEXED_X, "ORA a,x"),
    0x1E: new opcode_info(0x1E, OM.ASL, AM.A_INDEXED_Xb, "ASL a,x"),
    0x1F: new opcode_info(0x1F, OM.ORA, AM.AL_INDEXED_X, "ORA al,x"),
    0x20: new opcode_info(0x20, OM.JSR, AM.Ac, "JSR a"),
    0x21: new opcode_info(0x21, OM.AND, AM.D_INDEXED_IND, "AND (d,x)"),
    0x22: new opcode_info(0x22, OM.JSL, AM.AL, "JSL al"),
    0x23: new opcode_info(0x23, OM.AND, AM.STACK_R, "AND d,s"),
    0x24: new opcode_info(0x24, OM.BIT, AM.D, "BIT d"),
    0x25: new opcode_info(0x25, OM.AND, AM.D, "AND d"),
    0x26: new opcode_info(0x26, OM.ROL, AM.Db, "ROL d"),
    0x27: new opcode_info(0x27, OM.AND, AM.D_IND_L, "AND [d]"),
    0x28: new opcode_info(0x28, OM.PLP, AM.STACKb, "PLP s"),
    0x29: new opcode_info(0x29, OM.AND, AM.IMM, "AND #"),
    0x2A: new opcode_info(0x2A, OM.ROL, AM.ACCUM, "ROL A"),
    0x2B: new opcode_info(0x2B, OM.PLD, AM.STACKb, "PLD s"),
    0x2C: new opcode_info(0x2C, OM.BIT, AM.A, "BIT a"),
    0x2D: new opcode_info(0x2D, OM.AND, AM.A, "AND a"),
    0x2E: new opcode_info(0x2E, OM.ROL, AM.Ad, "ROL a"),
    0x2F: new opcode_info(0x2F, OM.AND, AM.AL, "AND al"),
    0x30: new opcode_info(0x30, OM.BMI, AM.PC_R, "BMI r"),
    0x31: new opcode_info(0x31, OM.AND, AM.D_IND_INDEXED, "AND (d),y"),
    0x32: new opcode_info(0x32, OM.AND, AM.D_IND, "AND (d)"),
    0x33: new opcode_info(0x33, OM.AND, AM.STACK_R_IND_INDEXED, "AND (d,s),y"),
    0x34: new opcode_info(0x34, OM.BIT, AM.D_INDEXED_X, "BIT d,x"),
    0x35: new opcode_info(0x35, OM.AND, AM.D_INDEXED_X, "AND d,x"),
    0x36: new opcode_info(0x36, OM.ROL, AM.D_INDEXED_Xb, "ROL d,x"),
    0x37: new opcode_info(0x37, OM.AND, AM.D_IND_L_INDEXED, "AND [d],y"),
    0x38: new opcode_info(0x38, OM.SEC, AM.I, "SEC i"),
    0x39: new opcode_info(0x39, OM.AND, AM.A_INDEXED_Y, "AND a,y"),
    0x3A: new opcode_info(0x3A, OM.DEC, AM.ACCUM, "DEC A"),
    0x3B: new opcode_info(0x3B, OM.TSC, AM.I, "TSC i"),
    0x3C: new opcode_info(0x3C, OM.BIT, AM.A_INDEXED_X, "BIT a,x"),
    0x3D: new opcode_info(0x3D, OM.AND, AM.A_INDEXED_X, "AND a,x"),
    0x3E: new opcode_info(0x3E, OM.ROL, AM.A_INDEXED_Xb, "ROL a,x"),
    0x3F: new opcode_info(0x3F, OM.AND, AM.AL_INDEXED_X, "AND al,x"),
    0x40: new opcode_info(0x40, OM.RTI, AM.STACKg, "RTI s"),
    0x41: new opcode_info(0x41, OM.EOR, AM.D_INDEXED_IND, "EOR (d,x)"),
    0x42: new opcode_info(0x42, OM.WDM, AM.I, "WDM i"),
    0x43: new opcode_info(0x43, OM.EOR, AM.STACK_R, "EOR d,s"),
    0x44: new opcode_info(0x44, OM.MVP, AM.XYCb, "MVP xyc"),
    0x45: new opcode_info(0x45, OM.EOR, AM.D, "EOR d"),
    0x46: new opcode_info(0x46, OM.LSR, AM.Db, "LSR d"),
    0x47: new opcode_info(0x47, OM.EOR, AM.D_IND_L, "EOR [d]"),
    0x48: new opcode_info(0x48, OM.PHA, AM.STACKc, "PHA s"),
    0x49: new opcode_info(0x49, OM.EOR, AM.IMM, "EOR #"),
    0x4A: new opcode_info(0x4A, OM.LSR, AM.ACCUM, "LSR A"),
    0x4B: new opcode_info(0x4B, OM.PHK, AM.STACKc, "PHK s"),
    0x4C: new opcode_info(0x4C, OM.JMP, AM.Ab, "JMP a"),
    0x4D: new opcode_info(0x4D, OM.EOR, AM.A, "EOR a"),
    0x4E: new opcode_info(0x4E, OM.LSR, AM.Ad, "LSR a"),
    0x4F: new opcode_info(0x4F, OM.EOR, AM.AL, "EOR al"),
    0x50: new opcode_info(0x50, OM.BVC, AM.PC_R, "BVC r"),
    0x51: new opcode_info(0x51, OM.EOR, AM.D_IND_INDEXED, "EOR (d),y"),
    0x52: new opcode_info(0x52, OM.EOR, AM.D_IND, "EOR (d)"),
    0x53: new opcode_info(0x53, OM.EOR, AM.STACK_R_IND_INDEXED, "EOR (d,s),y"),
    0x54: new opcode_info(0x54, OM.MVN, AM.XYC, "MVN xyc"),
    0x55: new opcode_info(0x55, OM.EOR, AM.D_INDEXED_X, "EOR d,x"),
    0x56: new opcode_info(0x56, OM.LSR, AM.D_INDEXED_Xb, "LSR d,x"),
    0x57: new opcode_info(0x57, OM.EOR, AM.D_IND_L_INDEXED, "EOR [d],y"),
    0x58: new opcode_info(0x58, OM.CLI, AM.I, "CLI i"),
    0x59: new opcode_info(0x59, OM.EOR, AM.A_INDEXED_Y, "EOR a,y"),
    0x5A: new opcode_info(0x5A, OM.PHY, AM.STACKc, "PHY s"),
    0x5B: new opcode_info(0x5B, OM.TCD, AM.I, "TCD i"),
    0x5C: new opcode_info(0x5C, OM.JMP, AM.ALb, "JMP al"),
    0x5D: new opcode_info(0x5D, OM.EOR, AM.A_INDEXED_X, "EOR a,x"),
    0x5E: new opcode_info(0x5E, OM.LSR, AM.A_INDEXED_Xb, "LSR a,x"),
    0x5F: new opcode_info(0x5F, OM.EOR, AM.AL_INDEXED_X, "EOR al,x"),
    0x60: new opcode_info(0x60, OM.RTS, AM.STACKh, "RTS s"),
    0x61: new opcode_info(0x61, OM.ADC, AM.D_INDEXED_IND, "ADC (d,x)"),
    0x62: new opcode_info(0x62, OM.PER, AM.STACKf, "PER s"),
    0x63: new opcode_info(0x63, OM.ADC, AM.STACK_R, "ADC d,s"),
    0x64: new opcode_info(0x64, OM.STZ, AM.D, "STZ d"),
    0x65: new opcode_info(0x65, OM.ADC, AM.D, "ADC d"),
    0x66: new opcode_info(0x66, OM.ROR, AM.Db, "ROR d"),
    0x67: new opcode_info(0x67, OM.ADC, AM.D_IND_L, "ADC [d]"),
    0x68: new opcode_info(0x68, OM.PLA, AM.STACKb, "PLA s"),
    0x69: new opcode_info(0x69, OM.ADC, AM.IMM, "ADC #"),
    0x6A: new opcode_info(0x6A, OM.ROR, AM.ACCUM, "ROR A"),
    0x6B: new opcode_info(0x6B, OM.RTL, AM.STACKi, "RTL s"),
    0x6C: new opcode_info(0x6C, OM.JMP, AM.A_INDb, "JMP (a)"),
    0x6D: new opcode_info(0x6D, OM.ADC, AM.A, "ADC a"),
    0x6E: new opcode_info(0x6E, OM.ROR, AM.Ad, "ROR a"),
    0x6F: new opcode_info(0x6F, OM.ADC, AM.AL, "ADC al"),
    0x70: new opcode_info(0x70, OM.BVS, AM.PC_R, "BVS r"),
    0x71: new opcode_info(0x71, OM.ADC, AM.D_IND_INDEXED, "ADC (d),y"),
    0x72: new opcode_info(0x72, OM.ADC, AM.D_IND, "ADC (d)"),
    0x73: new opcode_info(0x73, OM.ADC, AM.STACK_R_IND_INDEXED, "ADC (d,s),y"),
    0x74: new opcode_info(0x74, OM.STZ, AM.D_INDEXED_X, "STZ d,x"),
    0x75: new opcode_info(0x75, OM.ADC, AM.D_INDEXED_X, "ADC d,x"),
    0x76: new opcode_info(0x76, OM.ROR, AM.D_INDEXED_Xb, "ROR d,x"),
    0x77: new opcode_info(0x77, OM.ADC, AM.D_IND_L_INDEXED, "ADC [d],y"),
    0x78: new opcode_info(0x78, OM.SEI, AM.I, "SEI i"),
    0x79: new opcode_info(0x79, OM.ADC, AM.A_INDEXED_Y, "ADC a,y"),
    0x7A: new opcode_info(0x7A, OM.PLY, AM.STACKb, "PLY s"),
    0x7B: new opcode_info(0x7B, OM.TDC, AM.I, "TDC i"),
    0x7C: new opcode_info(0x7C, OM.JMP, AM.A_INDEXED_IND, "JMP (a,x)"),
    0x7D: new opcode_info(0x7D, OM.ADC, AM.A_INDEXED_X, "ADC a,x"),
    0x7E: new opcode_info(0x7E, OM.ROR, AM.A_INDEXED_Xb, "ROR a,x"),
    0x7F: new opcode_info(0x7F, OM.ADC, AM.AL_INDEXED_X, "ADC al,x"),
    0x80: new opcode_info(0x80, OM.BRA, AM.PC_R, "BRA r"),
    0x81: new opcode_info(0x81, OM.STA, AM.D_INDEXED_IND, "STA (d,x)"),
    0x82: new opcode_info(0x82, OM.BRL, AM.PC_RL, "BRL rl"),
    0x83: new opcode_info(0x83, OM.STA, AM.STACK_R, "STA d,s"),
    0x84: new opcode_info(0x84, OM.STY, AM.D, "STY d"),
    0x85: new opcode_info(0x85, OM.STA, AM.D, "STA d"),
    0x86: new opcode_info(0x86, OM.STX, AM.D, "STX d"),
    0x87: new opcode_info(0x87, OM.STA, AM.D_IND_L, "STA [d]"),
    0x88: new opcode_info(0x88, OM.DEY, AM.I, "DEY i"),
    0x89: new opcode_info(0x89, OM.BIT, AM.IMM, "BIT #"),
    0x8A: new opcode_info(0x8A, OM.TXA, AM.I, "TXA i"),
    0x8B: new opcode_info(0x8B, OM.PHB, AM.STACKc, "PHB s"),
    0x8C: new opcode_info(0x8C, OM.STY, AM.A, "STY a"),
    0x8D: new opcode_info(0x8D, OM.STA, AM.A, "STA a"),
    0x8E: new opcode_info(0x8E, OM.STX, AM.A, "STX a"),
    0x8F: new opcode_info(0x8F, OM.STA, AM.AL, "STA al"),
    0x90: new opcode_info(0x90, OM.BCC, AM.PC_R, "BCC r"),
    0x91: new opcode_info(0x91, OM.STA, AM.D_IND_INDEXED, "STA (d),y"),
    0x92: new opcode_info(0x92, OM.STA, AM.D_IND, "STA (d)"),
    0x93: new opcode_info(0x93, OM.STA, AM.STACK_R_IND_INDEXED, "STA (d,s),y"),
    0x94: new opcode_info(0x94, OM.STY, AM.D_INDEXED_X, "STY d,x"),
    0x95: new opcode_info(0x95, OM.STA, AM.D_INDEXED_X, "STA d,x"),
    0x96: new opcode_info(0x96, OM.STX, AM.D_INDEXED_Y, "STX d,y"),
    0x97: new opcode_info(0x97, OM.STA, AM.D_IND_L_INDEXED, "STA [d],y"),
    0x98: new opcode_info(0x98, OM.TYA, AM.I, "TYA i"),
    0x99: new opcode_info(0x99, OM.STA, AM.A_INDEXED_Y, "STA a,y"),
    0x9A: new opcode_info(0x9A, OM.TXS, AM.I, "TXS i"),
    0x9B: new opcode_info(0x9B, OM.TXY, AM.I, "TXY i"),
    0x9C: new opcode_info(0x9C, OM.STZ, AM.A, "STZ a"),
    0x9D: new opcode_info(0x9D, OM.STA, AM.A_INDEXED_X, "STA a,x"),
    0x9E: new opcode_info(0x9E, OM.STZ, AM.A_INDEXED_X, "STZ a,x"),
    0x9F: new opcode_info(0x9F, OM.STA, AM.AL_INDEXED_X, "STA al,x"),
    0xA0: new opcode_info(0xA0, OM.LDY, AM.IMM, "LDY #"),
    0xA1: new opcode_info(0xA1, OM.LDA, AM.D_INDEXED_IND, "LDA (d,x)"),
    0xA2: new opcode_info(0xA2, OM.LDX, AM.IMM, "LDX #"),
    0xA3: new opcode_info(0xA3, OM.LDA, AM.STACK_R, "LDA d,s"),
    0xA4: new opcode_info(0xA4, OM.LDY, AM.D, "LDY d"),
    0xA5: new opcode_info(0xA5, OM.LDA, AM.D, "LDA d"),
    0xA6: new opcode_info(0xA6, OM.LDX, AM.D, "LDX d"),
    0xA7: new opcode_info(0xA7, OM.LDA, AM.D_IND_L, "LDA [d]"),
    0xA8: new opcode_info(0xA8, OM.TAY, AM.I, "TAY i"),
    0xA9: new opcode_info(0xA9, OM.LDA, AM.IMM, "LDA #"),
    0xAA: new opcode_info(0xAA, OM.TAX, AM.I, "TAX i"),
    0xAB: new opcode_info(0xAB, OM.PLB, AM.STACKb, "PLB s"),
    0xAC: new opcode_info(0xAC, OM.LDY, AM.A, "LDY a"),
    0xAD: new opcode_info(0xAD, OM.LDA, AM.A, "LDA a"),
    0xAE: new opcode_info(0xAE, OM.LDX, AM.A, "LDX a"),
    0xAF: new opcode_info(0xAF, OM.LDA, AM.AL, "LDA al"),
    0xB0: new opcode_info(0xB0, OM.BCS, AM.PC_R, "BCS r"),
    0xB1: new opcode_info(0xB1, OM.LDA, AM.D_IND_INDEXED, "LDA (d),y"),
    0xB2: new opcode_info(0xB2, OM.LDA, AM.D_IND, "LDA (d)"),
    0xB3: new opcode_info(0xB3, OM.LDA, AM.STACK_R_IND_INDEXED, "LDA (d,s),y"),
    0xB4: new opcode_info(0xB4, OM.LDY, AM.D_INDEXED_X, "LDY d,x"),
    0xB5: new opcode_info(0xB5, OM.LDA, AM.D_INDEXED_X, "LDA d,x"),
    0xB6: new opcode_info(0xB6, OM.LDX, AM.D_INDEXED_Y, "LDX d,y"),
    0xB7: new opcode_info(0xB7, OM.LDA, AM.D_IND_L_INDEXED, "LDA [d],y"),
    0xB8: new opcode_info(0xB8, OM.CLV, AM.I, "CLV i"),
    0xB9: new opcode_info(0xB9, OM.LDA, AM.A_INDEXED_Y, "LDA a,y"),
    0xBA: new opcode_info(0xBA, OM.TSX, AM.I, "TSX i"),
    0xBB: new opcode_info(0xBB, OM.TYX, AM.I, "TYX i"),
    0xBC: new opcode_info(0xBC, OM.LDY, AM.A_INDEXED_X, "LDY a,x"),
    0xBD: new opcode_info(0xBD, OM.LDA, AM.A_INDEXED_X, "LDA a,x"),
    0xBE: new opcode_info(0xBE, OM.LDX, AM.A_INDEXED_Y, "LDX a,y"),
    0xBF: new opcode_info(0xBF, OM.LDA, AM.AL_INDEXED_X, "LDA al,x"),
    0xC0: new opcode_info(0xC0, OM.CPY, AM.IMM, "CPY #"),
    0xC1: new opcode_info(0xC1, OM.CMP, AM.D_INDEXED_IND, "CMP (d,x)"),
    0xC2: new opcode_info(0xC2, OM.REP, AM.IMM, "REP #"),
    0xC3: new opcode_info(0xC3, OM.CMP, AM.STACK_R, "CMP d,s"),
    0xC4: new opcode_info(0xC4, OM.CPY, AM.D, "CPY d"),
    0xC5: new opcode_info(0xC5, OM.CMP, AM.D, "CMP d"),
    0xC6: new opcode_info(0xC6, OM.DEC, AM.Db, "DEC d"),
    0xC7: new opcode_info(0xC7, OM.CMP, AM.D_IND_L, "CMP [d]"),
    0xC8: new opcode_info(0xC8, OM.INY, AM.I, "INY i"),
    0xC9: new opcode_info(0xC9, OM.CMP, AM.IMM, "CMP #"),
    0xCA: new opcode_info(0xCA, OM.DEX, AM.I, "DEX i"),
    0xCB: new opcode_info(0xCB, OM.WAI, AM.Id, "WAI i"),
    0xCC: new opcode_info(0xCC, OM.CPY, AM.A, "CPY a"),
    0xCD: new opcode_info(0xCD, OM.CMP, AM.A, "CMP a"),
    0xCE: new opcode_info(0xCE, OM.DEC, AM.Ad, "DEC a"),
    0xCF: new opcode_info(0xCF, OM.CMP, AM.AL, "CMP al"),
    0xD0: new opcode_info(0xD0, OM.BNE, AM.PC_R, "BNE r"),
    0xD1: new opcode_info(0xD1, OM.CMP, AM.D_IND_INDEXED, "CMP (d),y"),
    0xD2: new opcode_info(0xD2, OM.CMP, AM.D_IND, "CMP (d)"),
    0xD3: new opcode_info(0xD3, OM.CMP, AM.STACK_R_IND_INDEXED, "CMP (d,s),y"),
    0xD4: new opcode_info(0xD4, OM.PEI, AM.STACKe, "PEI s"),
    0xD5: new opcode_info(0xD5, OM.CMP, AM.D_INDEXED_X, "CMP d,x"),
    0xD6: new opcode_info(0xD6, OM.DEC, AM.D_INDEXED_Xb, "DEC d,x"),
    0xD7: new opcode_info(0xD7, OM.CMP, AM.D_IND_L_INDEXED, "CMP [d],y"),
    0xD8: new opcode_info(0xD8, OM.CLD, AM.I, "CLD i"),
    0xD9: new opcode_info(0xD9, OM.CMP, AM.A_INDEXED_Y, "CMP a,y"),
    0xDA: new opcode_info(0xDA, OM.PHX, AM.STACKc, "PHX s"),
    0xDB: new opcode_info(0xDB, OM.STP, AM.Ic, "STP i"),
    0xDC: new opcode_info(0xDC, OM.JML, AM.A_IND, "JML (a)"),
    0xDD: new opcode_info(0xDD, OM.CMP, AM.A_INDEXED_X, "CMP a,x"),
    0xDE: new opcode_info(0xDE, OM.DEC, AM.A_INDEXED_Xb, "DEC a,x"),
    0xDF: new opcode_info(0xDF, OM.CMP, AM.AL_INDEXED_X, "CMP al,x"),
    0xE0: new opcode_info(0xE0, OM.CPX, AM.IMM, "CPX #"),
    0xE1: new opcode_info(0xE1, OM.SBC, AM.D_INDEXED_IND, "SBC (d,x)"),
    0xE2: new opcode_info(0xE2, OM.SEP, AM.IMM, "SEP #"),
    0xE3: new opcode_info(0xE3, OM.SBC, AM.STACK_R, "SBC d,s"),
    0xE4: new opcode_info(0xE4, OM.CPX, AM.D, "CPX d"),
    0xE5: new opcode_info(0xE5, OM.SBC, AM.D, "SBC d"),
    0xE6: new opcode_info(0xE6, OM.INC, AM.Db, "INC d"),
    0xE7: new opcode_info(0xE7, OM.SBC, AM.D_IND_L, "SBC [d]"),
    0xE8: new opcode_info(0xE8, OM.INX, AM.I, "INX i"),
    0xE9: new opcode_info(0xE9, OM.SBC, AM.IMM, "SBC #"),
    0xEA: new opcode_info(0xEA, OM.NOP, AM.I, "NOP i"),
    0xEB: new opcode_info(0xEB, OM.XBA, AM.Ib, "XBA i"),
    0xEC: new opcode_info(0xEC, OM.CPX, AM.A, "CPX a"),
    0xED: new opcode_info(0xED, OM.SBC, AM.A, "SBC a"),
    0xEE: new opcode_info(0xEE, OM.INC, AM.Ad, "INC a"),
    0xEF: new opcode_info(0xEF, OM.SBC, AM.AL, "SBC al"),
    0xF0: new opcode_info(0xF0, OM.BEQ, AM.PC_R, "BEQ r"),
    0xF1: new opcode_info(0xF1, OM.SBC, AM.D_IND_INDEXED, "SBC (d),y"),
    0xF2: new opcode_info(0xF2, OM.SBC, AM.D_IND, "SBC (d)"),
    0xF3: new opcode_info(0xF3, OM.SBC, AM.STACK_R_IND_INDEXED, "SBC (d,s),y"),
    0xF4: new opcode_info(0xF4, OM.PEA, AM.STACKd, "PEA s"),
    0xF5: new opcode_info(0xF5, OM.SBC, AM.D_INDEXED_X, "SBC d,x"),
    0xF6: new opcode_info(0xF6, OM.INC, AM.D_INDEXED_Xb, "INC d,x"),
    0xF7: new opcode_info(0xF7, OM.SBC, AM.D_IND_L_INDEXED, "SBC [d],y"),
    0xF8: new opcode_info(0xF8, OM.SED, AM.I, "SED i"),
    0xF9: new opcode_info(0xF9, OM.SBC, AM.A_INDEXED_Y, "SBC a,y"),
    0xFA: new opcode_info(0xFA, OM.PLX, AM.STACKb, "PLX s"),
    0xFB: new opcode_info(0xFB, OM.XCE, AM.I, "XCE i"),
    0xFC: new opcode_info(0xFC, OM.JSR, AM.A_INDEXED_INDb, "JSR (a,x)"),
    0xFD: new opcode_info(0xFD, OM.SBC, AM.A_INDEXED_X, "SBC a,x"),
    0xFE: new opcode_info(0xFE, OM.INC, AM.A_INDEXED_Xb, "INC a,x"),
    0xFF: new opcode_info(0xFF, OM.SBC, AM.AL_INDEXED_X, "SBC al,x"),
    0x100: new opcode_info(0x100, OM.S_RESET, AM.STACK, "RESET s"),
    0x101: new opcode_info(0x101, OM.S_ABORT, AM.STACK, "ABORT s"),
    0x102: new opcode_info(0x102, OM.S_IRQ, AM.STACK, "IRQ s"),
    0x103: new opcode_info(0x103, OM.S_NMI, AM.STACK, "NMI s")
});

class opcode_functions {
    constructor(opcode_info, exec_func, disassemble_func, affected_by_E, affected_by_M, affected_by_X, affected_by_D) {
        this.opcode = opcode_info.opcode;
        this.ins = opcode_info.ins;
        this.addr_mode = opcode_info.addr_mode;
        this.mnemonic = opcode_info.mnemonic;
        this.exec_func = exec_func;
        this.disassemble_func = disassemble_func;
        this.affected_by_E = affected_by_E;
        this.affected_by_M = affected_by_M;
        this.affected_by_X = affected_by_X;
        this.affected_by_D = affected_by_D;
    }
}

function mksigned8(what) {
    return -(0x100 - (what & 0xFF));
}

function mksigned16(what) {
    return -(0x10000 - (what & 0xFFFF));
}

class switchgen {
    constructor(indent, what) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.in_case = false;
        this.last_case = 0;
        this.has_footer = false;
        this.has_custom_end = false;
        this.outstr = '';
        this.clear();
    }

    clear(indent, what) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.in_case = false;
        this.last_case = 0;
        this.has_footer = false;
        this.has_custom_end = false;
        this.outstr = this.indent1 + 'switch(' + what + ') {\n';
    }

    // We actually ignore the input cycle #
    // This is determined automatically
    // Passed in is reference cycle # from WDC doc, which is not 0-based
    addcycle(what) {
        if (this.in_case)
            this.outstr += this.indent3 + 'break;\n';
        what = (parseInt(this.last_case) + 1).toString();
        this.last_case = what;
        this.in_case = true;
        this.outstr += this.indent2 + 'case ' + what + ':\n';
    }

    // This is a final "cycle" only SOME functions use, mostly to get final data read or written
    cleanup() {
        this.has_footer = true;
        this.addcycle();
    }

    addr_to(low, high) {
        this.addl('pins.Addr = (' + low + '); pins.BA = (' + high + ');');
    }

    D_to_TRH() {
        this.addl('pins.D = (regs.TR >>> 8) & 0xFF;');
    }

    D_to_TRL() {
        this.addl('pins.D = regs.TR & 0xFF');
    }

    addr_inc() {
        this.addl('pins.Addr = (pins.Addr + 1) & 0xFFFF;');
    }

    addr_dec() {
        this.addl('pins.Addr = (pins.Addr - 1) & 0xFFFF;' );
    }

    addr_to_DBR(who) {
        this.addr_to(who, 'regs.DBR');
    }

    addr_to_PBR(who) {
        this.addr_to(who, 'regs.PBR');
    }

    addr_to_ZB(who) {
        this.addr_to(who, '0');
    }

    get_TA_from_PC_noPRDV() {
        this.get_TA_from_PC();
        this.RPDV(0, 0, 0, 0);
    }

    get_TA_from_PC() {
        this.addcycle(2); // usually #2
        this.RPDV(0, 1, 0, 0);
        this.addr_to_PC_then_inc();
        this.addcycle(3); // 3
        this.addl('regs.TA = pins.D & 0xFF;')
        this.addr_to_PC_then_inc();
        this.addcycle(4); // 4
        this.addl('regs.TA += (pins.D & 0xFF) << 8;');
    }

    addr_to_PC_then_inc() {
        this.outstr += this.indent3 + 'pins.Addr = regs.PC; pins.BA = regs.PBR;\n';
        this.outstr += this.indent3 + 'regs.PC = (regs.PC + 1) & 0xFFFF;\n';
    }

    addr_to_S_then_dec() {
        this.addl('pins.Addr = regs.S; pins.BA = 0;');
        this.addl('regs.S = (regs.S - 1) & 0xFFFF;');
        this.addl('if (regs.E) regs.S = (regs.S & 0xFF) | 0x0100;');
    }

    addr_to_PC() {
        this.addl('pins.Addr = regs.PC; pins.BA = regs.PBR;');
    }

    addl(what) {
        this.outstr += this.indent3 + what + '\n';
    }

    addr_to_ta_pbr() {
        this.addl('pins.Addr = regs.TA; pins.BA = regs.PBR;');
    }

    get_mem_from_TA16() {
        this.addcycle();
        this.RPDV(0, 1, 0, 0);
        this.addr_to_ta_pbr();
        this.addcycle();
        this.addl('regs.TR = pins.D & 0xFF;')
        this.addl('regs.TA = (regs.TA + 1) & 0xFFFF');
        this.addr_to_ta_pbr();
        this.addcycle();
        this.addl('regs.TR += (pins.D & 0xFF) << 8;');
    }

    custom_end() {
        this.has_custom_end = true;
    }

    regular_end() {
        this.addl('// Following is auto-generated code for instruction finish')
        if (!this.has_footer) {
            this.addcycle();
        }
        this.addl('// Set up instruction fetch');
        this.addr_to_PC();
        this.RPDV(0, 1, 1, 0);
        this.addl('// Signal new instruction is beginning');
        this.addl('regs.TCU = -1;')
        this.addl('// Signal the instruction is finished');
        this.addl('return true;')
    }

    finished() {
        if (!this.in_case) {
            return '';
        }
        //this.addcycle((parseInt(this.last_case) + 1).toString());
        if (!this.has_custom_end) {
            this.regular_end();
        };

        this.outstr += this.indent1 + '}\n';
        this.outstr += this.indent1 + 'return false;';
        return this.outstr;
    }

    setn8(who) {
        this.addl('regs.P.N = ' + who + ' & 0x80;');
    }
    setn16(who) {
        this.addl('regs.P.N = (' + who + ' & 0x8000) >> 8;');
    }
    setz(who) {
        this.addl('regs.P.Z = (' + who + ' === 0) ? 2 : 0;');
    }

    ADC8(D) {
        this.addl('let A = regs.C & 0xFF; regs.TR &= 0xFF;');
        if (D === 0) {
            this.addl('let result = A + regs.TR + regs.P.C;');
        }
        else {
            this.addl('let result = (A & 0x0F) + (regs.TR & 0x0F) + (CF << 0);')
            this.addl('if (result > 0x09) result += 0x06;')
            this.addl('regs.P.C = result > 0x0F ? 1 : 0;')
            this.addl('result = (A & 0xF0) + (regs.TR & 0xF0) + (regs.P.C << 4) + (result & 0x0F);')
        }

        this.addl('regs.P.V = ~(A ^ regs.TR) & (A ^ result) & 0x80;')
        if (D !== 0) {
            this.addl('if (result > 0x9F) result += 0x60;');
        }
        this.addl('regs.P.C = result > 0xFF ? 1 : 0;')
        this.setz('(result & 0xFF)');
        this.setn16('result');
        this.addl('regs.C = (regs.C & 0xFF00) | (result & 0xFF);')
    }

    ADC16(D) {
        if (D === 0) {
            this.addl('let result = regs.C + regs.TR + regs.P.C;')
        }
        else {
            this.addl('let result = (regs.C & 0x000F) + (regs.TR & 0x000F) + (regs.P.C << 0);');
            this.addl('if (result > 0x0009) result += 0x0006;');
            this.addl('regs.P.C = result > 0x000F ? 1 : 0;')
            this.addl('result = (regs.C & 0x00F0) + (regs.TR & 0x00F0) + (regs.P.C << 4) + (result & 0x000F);');
            this.addl('if (result > 0x009F) result += 0x0060;');
            this.addl('regs.P.C = result > 0x00FF ? 1 : 0;')
            this.addl('result = (regs.C & 0x0F00) + (regs.TR & 0x0F00) + (regs.P.C << 8) + (result & 0x00FF);');
            this.addl('if (result > 0x09FF) result += 0x0600;');
            this.addl('regs.P.C = result > 0x0FFF ? 1 : 0;')
            this.addl('result = (regs.C & 0xF000) + (regs.TR & 0xF000) + (regs.P.C << 12) + (result & 0x0FFF);');
        }

        this.addl('regs.P.V = ~(regs.C ^ regs.TR) & (regs.C ^ result) & 0x8000;');
        if (D !== 0) {
            this.addl('if (result > 0x9FFF) result += 0x6000;');
        }
        this.addl('regs.P.C = (result > 0xFFFF) ? 1 : 0;')
        this.setz('(result & 0xFFFF)');
        this.setn16('result');
        this.addl('regs.C = result;')
    }

    AND8() {
        this.addl('let A = regs.C & 0xFF;')
        this.addl('A &= regs.TR & 0xFF;');
        this.setz('A');
        this.setn8('A');
        this.addl('regs.C = (regs.C & 0xFF00) | A;');
    }

    AND16() {
        this.addl('regs.C &= regs.TR');
        this.setz('regs.C');
        this.setn16('regs.C');
    }

    ASL8() {
        this.addl('regs.P.C = (regs.TR & 0x80) >> 7;')
        this.addl('regs.TR = (regs.TR & 0xFF) << 1;');
        this.setz('regs.TR');
        this.setn8('regs.TR');
    }

    ASL16() {
        this.addl('regs.P.C = (regs. TR & 0x8000) >> 15;');
        this.addl('regs.TR = (regs.TR & 0xFFFF) << 1;');
        this.setz('regs.TR');
        this.setn16('regs.TR');
    }

    BIT8() {
        this.addl('regs.P.Z = (regs.C & regs.TR & 0xFF) == 0 ? 2 : 0;');
        this.addl('regs.P.V = regs.TR & 0x40;');
        this.addl('regs.P.N = regs.TR & 0x80;');
    }

    BIT16() {
        this.addl('regs.P.Z = (regs.C & regs.TR & 0xFFFF) == 0 ? 2 : 0;');
        this.addl('regs.P.V = (regs.TR & 0x4000) >> 8;');
        this.addl('regs.P.N = (regs.TR & 0x8000) >> 8;');
    }

    cmp8(who) {
        this.addl('let result = mksigned8(' + who + ') - regs.TR;')
        this.addl('regs.P.C = (result >= 0) ? 1 : 0;')
        this.setz('(result & 0xFF)');
        this.setn8('(result & 0xFF)');
    }

    cmp16(who) {
        this.addl('let result = mksigned16(' + who + ') - regs.TR;')
        this.addl('regs.P.C = (result >= 0) ? 1 : 0;')
        this.setz('result');
        this.setn16('result');
    }

    CMP8(){
        this.cmp8('regs.C');
    }


    CMP16() {
        this.cmp16('regs.C');
    }

    CPX8() {
        this.cmp8('regs.X');
    }

    CPX16() {
        this.cmp16('regs.X');
    }

    CPY8() {
        this.cmp8('regs.Y');
    }

    CPY16() {
        this.cmp16('regs.Y');
    }

    DEXY8(who) {
        this.addl(who + ' = (' + who + ' - 1) & 0xFF;');
        this.setz(who);
        this.setn8(who);
    }

    DEXY16(who) {
        this.addl(who + ' = (' + who + ' - 1) & 0xFFFF;');
        this.setz(who);
        this.setn16(who);
    }

    set_reg_low(who, to) {
        this.addl(who + ' = (' + who + ' & 0xFF00) + ((' + to + ') & 0xFF);');
    }

    EOR8() {
        this.addl('let A = (regs.C & 0xFF) ^ regs.TR;')
        this.setz('A');
        this.setn8('A');
        this.set_reg_low('regs.C', 'A');
    }

    EOR16() {
        this.addl('regs.C ^= regs.TR;')
        this.setz('regs.C');
        this.setn16('regs.C');
    }

    INXY8(who) {
        this.addl(who + ' = (' + who + ' + 1) & 0xFF');
        this.setz(who);
        this.setn8(who);
    }

    INXY16(who) {
        this.addl(who + ' = (' + who + ' + 1) & 0xFFFF');
        this.setz(who);
        this.setn16(who);
    }

    LDA8() {
        this.set_reg_low('regs.C', 'regs.TR');
        this.setz('regs.TR');
        this.setn8('regs.TR');
    }

    LDA16() {
        this.addl('regs.C = regs.TR & 0xFFFF;');
        this.setz('regs.C');
        this.setn16('regs.C');
    }

    LDXY8(who) {
        this.set_reg_low(who, 'regs.TR');
        this.setz('regs.TR');
        this.setn8('regs.TR');
    }

    LDXY16(who) {
        this.addl(who + ' = regs.TR;')
        this.setz('regs.TR');
        this.setn16('regs.TR');
    }

    push_L(what, decrement) {
        if (typeof(decrement) === 'undefined')
            decrement = true;
        this.addl('pins.D = ' + what + ' & 0xFF;');
        if (decrement)
            this.addr_to_S_then_dec();
        else
            this.addr_to('regs.S');
    }

    push_H(what, decrement) {
        if (typeof(decrement) === 'undefined')
            decrement = true;
        this.addl('pins.D = (' + what + '& 0xFF00) >> 8;');
        if (decrement)
            this.addr_to_S_then_dec();
        else
            this.addr_to('regs.S', '0');
    }

    LSR8() {
        this.addl('regs.P.C = regs.TR & 1;');
        this.addl('regs.TR >>>= 1;');
        this.setz('regs.TR');
        this.setn8('regs.TR');
    }

    LSR16() {
        this.addl('regs.P.C = regs.TR & 1;');
        this.addl('regs.TR >>>= 1;');
        this.setz('regs.TR');
        this.setn16('regs.TR');
    }

    ORA8() {
        this.addl('let A = (regs.TR | regs.C) & 0xFF;');
        this.setz('A');
        this.setn8('A');
        this.set_reg_low('regs.C', 'A');
    }

    ORA16() {
        this.addl('regs.C |= regs.TR;');
        this.setz('regs.C');
        this.setn16('regs.C');
    }

    add_ins(ins, E, M, X, D) {
        switch(ins) {
            case OM.ADC:
                if (E || M)
                    this.ADC8(D);
                else
                    this.ADC16(D);
                break;
            case OM.AND:
                if (E || M)
                    this.AND8(D);
                else
                    this.AND16(D);
                break;
            case OM.ASL:
                if (E || M)
                    this.ASL8();
                else
                    this.ASL16();
                break;
            case OM.BIT:
                if (E || M)
                    this.BIT8();
                else
                    this.BIT16();
                break;
            case OM.CMP:
                if (E || M)
                    this.CMP8();
                else
                    this.CMP16();
                break;
            case OM.CPX:
                if (E || X)
                    this.CPX8();
                else
                    this.CPX16();
                break;
            case OM.CPY:
                if (E || X)
                    this.CPY8();
                else
                    this.CPY16();
                break;
            case OM.DEC:
                if (E || M)
                    this.DEXY8('regs.TR');
                else
                    this.DEXY16('regs.TR');
                break;
            case OM.DEX:
                if (E || X)
                    this.DEXY8('regs.X');
                else
                    this.DEXY16('regs.X');
                break;
            case OM.DEY:
                if (E || X)
                    this.DEXY8('regs.Y');
                else
                    this.DEXY16('regs.Y');
                break;
            case OM.EOR:
                if (E || M)
                    this.EOR8();
                else
                    this.EOR16();
                break;
            case OM.INC:
                if (E || M)
                    this.INXY8('regs.TR');
                else
                    this.INXY16('regs.TR');
                break;
            case OM.INX:
                if (E || X)
                    this.INXY8('regs.X');
                else
                    this.INXY16('regs.X');
                break;
            case OM.INY:
                if (E || X)
                    this.INXY8('regs.Y');
                else
                    this.INXY16('regs.Y');
                break;
            case OM.LDA:
                if (E || M)
                    this.LDA8();
                else
                    this.LDA16();
                break;
            case OM.LDX:
                if (E || X)
                    this.LDXY8('regs.X');
                else
                    this.LDXY16('regs.X');
                break;
            case OM.LDY:
                if (E || X)
                    this.LDXY8('regs.Y');
                else
                    this.LDXY16('regs.Y');
                break;
            case OM.LSR:
                if (E || M)
                    this.LSR8();
                else
                    this.LSR16();
                break;
            case OM.ORA:
                if (E || M)
                    this.ORA8();
                else
                    this.ORA16();
                break;
        }
    }

    RPDV(W, P, D, V) {
        this.outstr += this.indent3 + "pins.RW = " + W + "; pins.VPA = " + P + "; pins.VDA = " + D + "; pins.VPB = " + V + ";\n";
    }

}


const A_OR_M_X = Object.freeze(new Set([OM.CPY, OM.CPY, OM.STX, OM.STY, OM.LDX, OM.LDY]));
const A_R_INS = Object.freeze(new Set([OM.ADC, OM.AND, OM.BIT, OM.CMP, OM.EOR, OM.LDA, OM.LDX, OM.LDY, OM.ORA, OM.SBC]));
function A_R_OR_W(ins) {
    return (A_R_INS.has(ins) ? 0 : 1);
}

class generate_instruction_function_return {
    constructor(strout, E, M, X, D, aE, aM, aX, aD) {
        this.strout = strout;
        this.E = E;
        this.M = M;
        this.X = X;
        this.D = D;
        this.affected_by_E = aE;
        this.affected_by_M = aM;
        this.affected_by_X = aX;
        this.affected_by_D = aD;
    }
}

function generate_instruction_function(indent, opcode_info, E, M, X, D) {
    let opc2 = hex2(opcode_info.opcode);
    let opcode_infostr = 'opcode_matrix[' + opc2 + ']';
    let opcode = opcode_info.opcode;
    let cycle = 0;
    let affected_by_E = false;
    let affected_by_M = false;
    let affected_by_X = false;
    let affected_by_D = false;
    let indent2 = indent + '    ';
    let indent3 = indent2 + '    ';
    let indent4 = indent3 + '    ';
    let ag = new switchgen(indent2,'regs.TCU')
    let mem16 = false;
    let RW = 0;

    // Gets 2 bytes, skips a cycle depending on complicated semantics
    this.get2_to_TA_d0 = function() {

    }

    this.fetch_D0_and_skip_cycle = function() {
            ag.addcycle(2);
            ag.addr_to_PC_then_inc();
            ag.RPDV(0, 1, 0, 0);
            ag.addl('regs.skipped_cycle = false;');
            ag.addl('if ((regs.D & 0xFF) === 0) { regs.skipped_cycle = true; regs.TCU++; }');

            ag.addcycle('2a');
            ag.addl('regs.TA = pins.D & 0xFF;');
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(3);
            ag.addl('if (skipped_cycle) regs.TA = pins.D & 0xFF;')

    }

    // Function to do a variable-sized fetch in middle of RMW
    this.fetch_rmw_8or16 = function() {
        if (mem16) {
            ag.addcycle('3a');
            ag.addl('regs.TR = pins.D & 0xFF');
            ag.addr_inc();

            ag.addcycle(4);
            ag.addl('regs.TR += (pins.D & 0xFF) << 8;');
        }
        else {
            ag.addcycle(4);
            ag.addl('regs.TR = pins.D & 0xFF;');
        }
        if (E) ag.RPDV(1, 0, 0, 0);
        else   ag.RPDV(0, 0, 0, 0);
    };

    // Function to finish up Read-Modify-Write instructions
    this.finish_rmw = function() {
        if (mem16) {
            ag.addcycle('7a');
            ag.RPDV(1, 0, 1, 0);
            ag.D_to_TRH();

            ag.addcycle(7);
            ag.addr_dec();
        }
        else {
            ag.addcycle(7);
            ag.RPDV(1, 0, 1, 0);
        }
        ag.D_to_TRL();
    }

    this.finish_RW8or16p = function() {
        // For many instructions that can read OR write either 8 or 16 bits of data,
        //  this is the last step to write them out.
        if (RW === 0) {
            if (mem16) {
                ag.addcycle('4a');
                ag.addl('regs.TR = pins.D & 0xFF;');
                ag.addr_inc();

                ag.cleanup();
                ag.addl('regs.TR += (pins.D & 0xFF) << 8;');
            }
            else {
                ag.cleanup();
                ag.addl('regs.TR = pins.D & 0xFF;')
            }
            ag.add_ins(opcode_info.ins, E, M, X, D);
        }
        else {
            ag.add_ins(opcode_info.ins, E, M, X, D);
            ag.D_to_TRL();
            if (mem16) {
                ag.addcycle('4a');
                ag.addr_inc();
                ag.D_to_TRH();
            }
        }
    }

    // Set for many read-modify-write style instructions
    this.set_em16rmw = function() {
        affected_by_E = true;
        affected_by_M = true;
        mem16 = !(E | M);
    }

    // Set for many instructions that can read or write and change mem size based on different
    //  flags
    this.set_exm16rw = function() {
        affected_by_E = true;
        affected_by_X = A_OR_M_X.has(opcode_info.ins);
        affected_by_M = !affected_by_X;
        if ((affected_by_X && X) || (affected_by_M && M))
            mem16 = true;
        if (E)
            mem16 = false;
        RW = A_R_OR_W(opcode_info.ins);
    };

    this.RMW_indexed = function(who) {
        this.set_exm16rw();

        ag.addcycle(2);
        ag.RPDV(0, 1, 0, 0);
        ag.addr_to_PC_then_inc();

        ag.addcycle(3);
        ag.addl('regs.TA = pins.D & 0xFF');
        ag.addr_to_PC_then_inc();

        // Add 1 cycle for:
        //  indexing across page boundaries
        //  write
        //  X=0
        //  when X=1 or emulaion mode, addresses invalid

        // So, decide whether to skip cycle 3a (4).
        // We skip it if:
        //  We're doing a read
        //  X=1 or emulation mode
        // But we DO NOT skip it if:
        //  we index across a page boundary
        ag.addl('regs.TR = regs.TA + (' + who + ' & 0xFF);');
        ag.addl('regs.skipped_cycle = false;');
        if  ((RW === 0) || (X === 1) || (E === 1))
        {
            ag.addl('if (regs.TR < 0x100) { regs.skipped_cycle = true; regs.TCU++; } ') // Skip cycle
        }
        ag.addcycle('3a');
        ag.addl('regs.TA += ((pins.D) & 0xFF) << 8;');
        ag.RPDV(0, 0, 0, 0);
        ag.addr_to_DBR('((pins.D & 0xFF) << 8) + ((regs.TA + ' + who + ') & 0xFF)');

        ag.addcycle(4);
        ag.addl('if (regs.skipped_cycle) regs.TA += ((pins.D) & 0xFF) << 8;');
        ag.addr_to_DBR('(' + who + ' + regs.TA) & 0xFFFF')
        this.finish_RW8or16p();
    };

    ag.addl('// ' + opcode_info.mnemonic + ' E=' + E + " M=" + M + " X=" + X);
    affected_by_D = ((opcode_info.ins === OM.ADC) || (opcode_info.ins === OM.SBC));
    switch(opcode_info.addr_mode) {
        case(AM.A):
            this.set_exm16rw();
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D & 0xFF;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addr_to_DBR('regs.TA + ((pins.D & 0xFF) << 8)');
            ag.RPDV(RW, 0, 1, 0);
            this.finish_RW8or16p();
            break; // AM.A absolute Af
        case AM.Ab: // JMP a
            ag.addcycle(2);
            regs.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D & 0xFF;');
            ag.addr_to_PC_then_inc();

            ag.cleanup();
            ag.addl('regs.PC = ((pins.D & 0xFF) << 8) + regs.TA;');
            break;
        case AM.Ac: // JSR a
            affected_by_E = true;
            ag.get_TA_from_PC();
            ag.addcycle(5);
            ag.RPDV(1, 0, 1, 0);
            ag.push_H('regs.PC');
            ag.addcycle(6);
            ag.push_L('regs.PC');
            ag.addl('regs.PC = regs.TA;');
            break;
        case AM.Ad: // Abslute a R-M-W
            ag.addl('//case AM.Ad')
            this.set_em16rmw();

            ag.get_TA_from_PC();
            ag.addr_to_DBR('regs.TA');
            this.fetch_rmw_8or16();
            ag.add_ins(opcode_info.ins, E, M, X, D);

            this.finish_rmw();
            break;
        case AM.A_INDEXED_IND:
            // JMP (a,x)
            ag.get_TA_from_PC(); // 1-3
            ag.addl('regs.TA = (regs.X + regs.TA) & 0xFFFF');
            ag.get_mem_from_TA16();
            ag.addl('regs.PC = regs.TR');
            break;
        case AM.A_INDEXED_INDb:
            // JSR (a,x)
            // This one is REALLY FUNKY
            // Can't really do a lot of automatic code here
            affected_by_E = true;
            ag.addcycle(2); // 2 PBR, PC+1 -> AAL
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3); // 3 0,S <- PCH
            ag.RPDV(1, 0, 1, 0);
            ag.addl('regs.TA = pins.D & 0xFF');
            ag.push_H('regs.PC');

            ag.addcycle(4); // 4 0,S-1 <- PCL
            ag.push_L('regs.PC');

            ag.addcycle(5); // 5 PBR, PC+2 -> AAH
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(6); // 6 PBR, PC+2  IO (grab AAH)
            ag.RPDV(0, 0, 0, 0);
            ag.addl('regs.TA += (pins.D & 0xFF) << 8;');
            ag.addl('regs.TA = (regs.TA + regs.X) & 0xFFFF;');

            ag.addcycle(7); // 7 PBR, AA+X
            ag.RPDV(0, 1, 0, 0);
            ag.addl('pins.Addr = regs.TA;');

            ag.addcycle(8); // 8 PBR, AA+X+1 <- PCL
            ag.addl('pins.Addr = (pins.Addr + 1) & 0xFFFF;');
            ag.addl('regs.PC = pins.D & 0xFF;');

            ag.cleanup();
            ag.addl('regs.PC += ((pins.D & 0xFF) << 8);')
            break;
        case AM.A_IND: // JML (a)
            ag.addcycle(2);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);// capture AAL
            ag.addl('regs.TA = pins.D & 0xFF;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4); // capture AAH, start PCL fetch
            ag.RPDV(0, 0, 1, 0);
            ag.addl('pins.Addr = regs.TA + ((pins.D & 0xFF) << 8); pins.BA = 0;');

            ag.addcycle(5); // 4 capture PCL
            ag.addl('regs.TR = pins.D & 0xFF;');
            ag.addl('pins.Addr = (pins.Addr + 1) & 0xFFFF;');

            ag.addcycle(6); // 5 capture PCH
            ag.addl('regs.PC = regs.TR + ((pins.D & 0xFF) << 8);');
            ag.addl('pins.Addr = (pins.Addr + 1) & 0xFFFF;');

            ag.cleanup();
            ag.addl('regs.PBR = pins.D & 0xFF;');
            break;
        case AM.A_INDb: // JMP (a)
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D & 0xFF;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('regs.TA + ((pins.D & 0xFF) << 8)');

            ag.addcycle(5);
            ag.addl('regs.TR = pins.D & 0xFF;');
            ag.addr_inc();

            ag.cleanup();
            ag.addl('regs.PC = regs.TR + ((pins.D & 0xFF) << 8);');
            break;
        case AM.AL:
            this.set_exm16rw();
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D & 0xFF;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addl('regs.TA += (pins.D & 0xFF) << 8;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(5);
            ag.addr_to('regs.TA', 'pins.D & 0xFF');
            ag.RPDV(RW, 0, 1, 0);
            if (RW === 0) { // Doing a read
                if (mem16) {
                    ag.addcycle('5a');
                    ag.addl('regs.TR = pins.D & 0xFF;');
                    ag.addr_inc();

                    ag.cleanup();
                    ag.addl('regs.TR += (pins. D & 0xFF) << 8;');
                    ag.add_ins(opcode_info.ins, E, M, X, D);
                }
                else {
                    ag.cleanup();
                    ag.addl('regs.TR = pins.D & 0xFF;')
                    ag.add_ins(opcode_info.ins, E, M, X, D);
                }
            }
            else { // Doing a write
                ag.add_ins(opcode_info.ins, E, M, X, D);
                ag.D_to_TRL();
                if (mem16) {
                    ag.addcycle('5a');
                    ag.addr_inc();
                    ag.D_to_TRH();
                }
            }
            break;
        case AM.ALb: // JMP
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D & 0xFF;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addl('regs.TA += (pins.D & 0xFF) << 8;');
            ag.addr_to_PC_then_inc();

            ag.cleanup();
            ag.addr_to('regs.TA', 'pins.D & 0xFF');
            break;
        case AM.ALc: // JSL long
            affected_by_E = true;
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D & 0xFF;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.RPDV(1, 0, 1, 0);
            ag.addl('regs.TA += (pins.D & 0xFF) << 8;');
            ag.push_H('regs.PBR', false);

            ag.addcycle(5);
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(6);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(7);
            ag.addl('regs.PBR = pins.D & 0xFF');
            ag.RPDV(1, 0, 1, 0);
            ag.push_H('regs.PC');

            ag.addcycle(8);
            ag.push_L('regs.PC');
            ag.addl('regs.PC = regs.TA;')
            break;
        case AM.AL_INDEXED_X:
            this.set_exm16rw();
            ag.addcycle(2); // LD AAL
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3); // LD AAH
            ag.addl('regs.TA = pins.D & 0xFF');
            ag.addr_to_PC_then_inc()

            ag.addcycle(4); // LD AAB
            ag.addl('regs.TA += (pins.D & 0xFF) << 8;')
            ag.addr_to_PC_then_inc();

            ag.addcycle(5); // capture AAB
            ag.addr_to('regs.TA', 'pins.D & 0xFF');
            ag.RPDV(RW, 0, 1, 0);
            this.finish_RW8or16p();
            break;
        case AM.A_INDEXED_X:
            this.RMW_indexed('regs.X');
            break;
        case AM.A_INDEXED_Xb: // R-M-W a,x  6b
            this.set_em16rmw();
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D & 0xFF;')

            ag.addcycle(4);
            ag.RPDV(0, 0, 0, 0);
            ag.addr_to_DBR('((pins.D & 0xFF) << 8) + ((regs.TA + regs.X) & 0xFF)');
            ag.addl('regs.TA = (regs.TA + ((pins.D & 0xFF) << 8) + regs.X) & 0xFFFF');

            ag.addcycle(5);
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_DBR('regs.TA');

            if (mem16) {
                ag.addcycle('5a');
                ag.addl('regs.TR = pins.D & 0xFF;');
                ag.addr_inc();
            }

            ag.addcycle(6);
            if (M) ag.RPDV(1, 0, 0, 0);
            else   ag.RPDV(0, 0, 0, 0);
            if (mem16) ag.addl('regs.TR += (pins.D & 0xFF) << 8;');
            else       ag.addl('regs.TR = (pins.D & 0xFF);')

            ag.add_ins(opcode_info.ins, E, M, X, D);

            this.finish_rmw();
            break;
        case AM.A_INDEXED_Y:
            this.RMW_indexed('regs.Y');
            break;
        case AM.ACCUM:
            affected_by_E = affected_by_M = true;
            ag.addcycle(2);
            ag.RPDV(0, 0, 0, 0);
            if (M|E) ag.addl('regs.TR = regs.C & 0xFF;');
            else     ag.addl('regs.TR = regs.C;');
            ag.add_ins(opcode_info.ins, E, M, X, D);
            if (M|E) ag.addl('regs.C = (regs.C & 0xFF00) | (regs.TR & 0x00FF);');
            else     ag.addl('regs.C = regs.TR & 0xFFFF;');
            break;
        case AM.XYC:
            ag.addcycle(2);
            ag.addl('if (regs.in_blockmove) {');
            ag.addl('    regs.MD++;');
            ag.addl('} else {');
            ag.addl('    regs.MD = 0;');
            ag.addl('    regs.in_blockmove = true;');
            ag.addl('}')
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.DBR = pins.D & 0xFF;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addl('regs.TA = pins.D & 0xFF');
            ag.addr_to('(regs.X + regs.MD) & 0xFFFF', 'regs.TA');
            ag.RPDV(0, 0, 1, 0);

            ag.addcycle(5);
            ag.RPDV(1, 0, 1, 0);
            ag.addr_to('(regs.Y + regs.MD) & 0xFFFF', 'regs.DBR');

            ag.addcycle(6);
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(7);

            ag.cleanup();
            ag.addl('regs.C = (regs.C - 1) & 0xFFFF;');
            ag.addl('if (regs.C === 0xFFFF) { // Time to exit loop!');
            ag.addl('    regs.in_blockmove = false;');
            ag.addl("    // we'll just let PC go to the next instruction now");
            ag.addl('} else { // Still in loop!');
            ag.addl('    regs.PC = (regs.PC - 3) & 0xFFFF;');
            ag.addl('}')
            break;
        case AM.XYCb:
            ag.addcycle(2);
            ag.addl('if (regs.in_blockmove) {');
            ag.addl('    regs.MD++;');
            ag.addl('} else {');
            ag.addl('    regs.MD = 0;');
            ag.addl('    regs.in_blockmove = true;');
            ag.addl('}')
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.DBR = pins.D & 0xFF;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addl('regs.TA = pins.D & 0xFF');
            ag.addr_to('(regs.X - regs.MD) & 0xFFFF', 'regs.TA');
            ag.RPDV(0, 0, 1, 0);

            ag.addcycle(5);
            ag.RPDV(1, 0, 1, 0);
            ag.addr_to('(regs.Y - regs.MD) & 0xFFFF', 'regs.DBR');

            ag.addcycle(6);
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(7);

            ag.cleanup();
            ag.addl('regs.C = (regs.C + 1) & 0xFFFF;');
            ag.addl('if (regs.C === 0xFFFF) { // Time to exit loop!');
            ag.addl('    regs.in_blockmove = false;');
            ag.addl("    // we'll just let PC go to the next instruction now");
            ag.addl('} else { // Still in loop!');
            ag.addl('    regs.PC = (regs.PC - 3) & 0xFFFF;');
            ag.addl('}');
            break;
        case AM.D:
            this.set_exm16rw();

            this.fetch_D0_and_skip_cycle();
            ag.RPDV(RW, 0, 1, 0);
            ag.addr_to_ZB('(regs.D + (pins.D & 0xFF)) & 0xFFFF');

            this.finish_RW8or16p();
            break;
        case AM.Db:
            // R-M-W direct
            this.set_em16rmw();

            this.fetch_D0_and_skip_cycle();
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('(regs.TA + regs.D) & 0xFFFF;');

            this.fetch_rmw_8or16();
            ag.add_ins(opcode_info.ins, E, M, X, D);

            this.finish_rmw();
            break;
        case AM.D_INDEXED_IND:
            this.set_exm16rw();

            this.fetch_D0_and_skip_cycle();

            ag.RPDV(0, 0, 0, 0);
            ag.addl('regs.TA = (regs.TA + regs.D + regs.X) & 0xFFFF');

            ag.addcycle(4);
            ag.addr_to_ZB('regs.TA');
            ag.RPDV(0, 0, 1, 0);

            ag.addcycle(5);
            ag.addl('regs.TA = pins.D & 0xFF;');
            ag.addr_inc();

            ag.addcycle(6);
            ag.addr_to_DBR('(regs.TA + ((pins.D & 0xFF) << 8))');
            ag.RPDV(RW, 0, 1, 0);
            this.finish_RW8or16p();
            break;
        case AM.D_IND: // "Direct indirect"
            this.set_exm16rw();
            this.fetch_D0_and_skip_cycle();
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('(regs.D + regs.TA) & 0xFFFF');

            ag.addcycle(4);
            ag.addl('regs.TA = pins.D & 0xFF;')
            ag.addr_inc();

            ag.addcycle(5);
            this.addr_to_DBR('(regs.TA + ((pins.D & 0xFF) << 8))');
            ag.RPDV(RW, 0, 1, 0);
            this.finish_RW8or16p();
            break;
        case AM.D_IND_INDEXED: // (d), y
            this.set_exm16rw();
            this.fetch_D0_and_skip_cycle();

            this.get2_to_TA_d0();
    }
    let outstr = 'function(regs, pins) { // ' + opcode_info.mnemonic + '\n' + ag.finished() + indent + '}';
    return new generate_instruction_function_return(outstr, E, M, X, D, affected_by_E, affected_by_M, affected_by_X, affected_by_D);
}

function generate_instruction_codes(indent) {
    let outstr = '';
    let firstin = false;
    for (let opcode = 0; opcode <= MAX_OPCODE; opcode++) {
        let opcode_info = opcode_matrix[opcode];
        if (firstin)
            outstr += ',\n';
        firstin = true;
        let opc2 = '0x' + hex2(opcode);
        let mystr = indent + '    ' + opc2 + ': new opcode_functions(opcode_matrix[' + opc2 + '],\n';
        let E = 0, X = 0, M = 1, D = 0;
        let r = generate_instruction_function(indent + '        ', opcode_info, E, M, X, D);
        mystr += indent + '        ' + r.strout + ',\n';
        mystr += indent + '        function(){},\n';
        mystr += indent + '        ' + (r.affected_by_E ? 'true, ' : 'false, ');
        mystr += r.affected_by_M ? 'true, ' : 'false, ';
        mystr += r.affected_by_X ? 'true, ' : 'false, ';
        mystr += r.affected_by_D ? 'true' : 'false';
        mystr += ')'
        outstr += mystr;
    }
    return('const yo = Object.freeze({\n' + outstr + '\n});');
}
console.log(generate_instruction_codes(''));
