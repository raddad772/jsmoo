"use strict";

// BIG TODO: implement diff-based RPDV, so pins are not set and reset SO MUCH


// PROBLEMS
// Code generation is complete. BUT:
// Large code generation
// * Direct addressing not correct when DL != 0 in Emulation mode
//   * expected behavior: DL=0 means always zero page, DL!=0 means page boundaries can be crossed
// * Actually lots of addressing issues in emulation mode
// * MVP, MVN assume 16-bit. Only tested for 16-bit
// * NMI etc. need logic. REP #04, SEP #04, CLI, SEI should update flags
//    on last cycle, BEFORE IRQ poll/opcode fetch.
// * process of opcode cycle should change to:
//    1) check IRQ held 2 cycles, check NMI held 2 cycles
//    2) elsewise fetch opcode
// * do this by counting cycles at a certain state I guess?
// * and NMI keep track of last trigger level?
// * this.check_irq()
// * RESET does not restart a STP'd processor like it should


/*
 Bank boundary wrapping occurs in both native and emulation mode (and does not depend on which mode the 65C816 is in). The following are confined to bank 0 ("confined to" means they address bank 0 and wrap at the bank 0 boundary):

    A. The direct page
    B. The stack
    C. [absolute] and (absolute) addressing modes (JMP is the only instruction available for either addressing mode)

The following are confined to bank K:

    A. X(absolute,X) addressing mode (JMP and JSR are the only instructions available for this addressing mode)
    B. The Program Counter (i.e. the PC register); again, this means branches wrap at the bank K boundary

source,destination addressing (i.e. the MVN and MVP instructions) wraps at both the source and destination bank boundaries.

Otherwise, wrapping does not occur at bank boundaries.
*/

/*
branch -3 (0xFD)

INX   PC=0x100
BVC   PC=0x101
-3    PC=0x102
INX   PC=0x103

goes back to the start of INX. so PC is from the "next instruction" which is where it is after anyway
*/

// So came into a bit of a problem. A naive encoding (with another doubling for D) ended
//  up with 8MB of code.
// Taking out D took us from 16 to 8 times, and got us down to 4.5MB.
// Only including unique function variations (necessitating a search) got us to 1.8MB
// Minifying got us to 464k. Which isn't so bad, really. But we need to think about better
//  space usage.
// Remember not all addressing modes are even done yet.

// Current instruction coding has 5 encodings, for E=0 M=0/1 X=0/1, and E=1 M=1 X=1.

// Really, this could be 3 encodings, wherein there is one for E=1, one for 8bit that
//  differs from E=1, and one for 16bit. The instruction can use a fast selection function
//  before call for emu/native8, native8_diff, or native16.
// Also, the final struct could be generated in-memory and not saved except for analysis...
// Also, the final struct could be generated as-needed. JIT compilers SHOULD compile these
//  in this case.
// RPDVs can be compressed, and other reduntant things removed.
// Pins.D can be assumed to be &0xFF on input.
// Also, the struct could have two generation methods: size, or readability.
// In size mode, it is minified using a minifier of some kind.

/* General idea behind this emulator.
    Pin-centric. However, a real 65816 has some big annoyances, like multiplexing
  BA0-7 and D0-7. We're not doing that.
    We are providing VDA (Valid Data Address), VPA (Valid Program Address),
  VP (Vector Pull), and RW (read on low, write on high). These must be decoded to understand
  if the processor is reading, writing, or operating internally.

    An opcode cycle looks like this:

    TCU = -1
    cycle() <-- inside here...
    regs.TCU++;
    if (TCU === 1) { // Decode and dispatch opcode
      IR = pins.D & 0xFF; // Here is our opcode
      instruction_to_exec = opcodes[E][X][M][D][IR]; // Just a huge jump table
   }
   instruction_to_exec(pins, regs);

   ...
   So, IN BETWEEN CALLS TO cycle(), you should...
     a) If pins.RW is set to R and there is a valid address, processor requesting read to pins.D
     b) If pins.RW is set to W and there is a valid address, pins.D is an outgoing write
     c) If there is no valid address, don't do anything.
  ...
 */


// So, a quick note.
// Most of this code is based off of https://www.westerndesigncenter.com/wdc/documentation/w65c816s.pdf
// I also took some inspiration from Higan's way of doing ADC and SUB, and also general way
//  of generating instructions from "algorithms."
// However, I started this before I looked at Higan, and the code generation approach is
//  my own terrible fault.
// That pdf has several easy-to-find errors. I can't imagine how many difficult-to-find ones there are.
// However, it's an amazingly good resource, letting you know (for the most part) what the
//  CPU is doing each cycle during an operation.

let CONSOLE_TRACE = true;

function get_vector(ins, E) {
    switch(ins) {
        case WDC_OM.BRK:
            if (E)
                return VEC.BRK_E;
            return VEC.BRK_N;
        case WDC_OM.COP:
            if (E)
                return VEC.COP_E;
            return VEC.COP_N;
        case WDC_OM.S_IRQ:
            if (E)
                return VEC.IRQ_E;
            return VEC.IRQ_N;
        case WDC_OM.S_ABORT:
            if (E)
                return VEC.ABORT_E;
            return VEC.ABORT_N;
        case WDC_OM.S_NMI:
            if (E)
                return VEC.NMI_E;
            return VEC.NMI_N;
    }
}

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
    for (let i in WDC_opcode_AM_R) {
        let opcodes = WDC_opcode_AM_R[i];
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
    for (let i in WDC_opcode_MN_R) {
        let opcodes = WDC_opcode_MN_R[i];
        for (let j in opcodes) {
            let opcode = opcodes[j];
            testourset(opcode, ourset, ourthere, opcodes, WDC_OP_MN_str[j]);
        }
    }
    for(let i = 0; i < 256; i++) {
        if (!ourset.hasOwnProperty(i)) {
            console.log('$' + hex2(i) + ' not found!');
        }
    }
}
// These check integrity of some stuff, not needed each times
//check_addressing_matrix();
//check_mnemonic_matrix();

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
    for (let j in WDC_OM) {
        if (WDC_OM[j] === ins)
            return 'WDC_OM.' + j;
    }
    return 'UNKNOWN';
}

function addr_backwards(addr_mode) {
    addr_mode = parseInt(addr_mode);
    for (let j in WDC_AM) {
        if (WDC_AM[j] === addr_mode)
            return 'WDC_AM.' + j;
    }
    return 'UNKNOWN';
}

function generate_opcodes_struct(indent) {
    let outstr = indent + 'const opcode_matrix = Object.freeze({\n';
    let has_been = false;
    for (let opcode = 0; opcode <= WDC_MAX_OPCODE; opcode++) {
        if (has_been)
            outstr += ',\n';
        has_been = true;
        let ins = array_of_array_contains(WDC_opcode_MN_R, opcode);
        let addr_mode = array_of_array_contains(WDC_opcode_AM_R, opcode);
        let addr_mode_split = array_of_array_contains(WDC_opcode_AM_SPLIT_R, opcode);
        if (ins === -1 || addr_mode === -1 || addr_mode_split === -1) {
            console.log('FAILED CONSTRUCTION could not find opcode ', hex2(opcode), ins, addr_mode, addr_mode_split);
            return '';
        }
        let thistr = indent + '    0x' + hex2(opcode) + ': new opcode_info(0x' + hex2(opcode) + ', ' + ins_backwards(ins) + ', ' + addr_backwards(addr_mode_split) + ', "' + WDC_OP_MN_str[ins] + ' ' + opcode_AM_MN[addr_mode] + '")'
        outstr += thistr;
    }
    outstr += '\n' + indent + '});'
    return outstr;
}


// created by
//console.log(generate_opcodes_struct(''));

const opcode_matrix = Object.freeze({
    0x00: new opcode_info(0x00, WDC_OM.BRK, WDC_AM.STACKj, "BRK s"),
    0x01: new opcode_info(0x01, WDC_OM.ORA, WDC_AM.D_INDEXED_IND, "ORA (d,x)"),
    0x02: new opcode_info(0x02, WDC_OM.COP, WDC_AM.STACKj, "COP s"),
    0x03: new opcode_info(0x03, WDC_OM.ORA, WDC_AM.STACK_R, "ORA d,s"),
    0x04: new opcode_info(0x04, WDC_OM.TSB, WDC_AM.Db, "TSB d"),
    0x05: new opcode_info(0x05, WDC_OM.ORA, WDC_AM.D, "ORA d"),
    0x06: new opcode_info(0x06, WDC_OM.ASL, WDC_AM.Db, "ASL d"),
    0x07: new opcode_info(0x07, WDC_OM.ORA, WDC_AM.D_IND_L, "ORA [d]"),
    0x08: new opcode_info(0x08, WDC_OM.PHP, WDC_AM.STACKc, "PHP s"),
    0x09: new opcode_info(0x09, WDC_OM.ORA, WDC_AM.IMM, "ORA #"),
    0x0A: new opcode_info(0x0A, WDC_OM.ASL, WDC_AM.ACCUM, "ASL A"),
    0x0B: new opcode_info(0x0B, WDC_OM.PHD, WDC_AM.STACKc, "PHD s"),
    0x0C: new opcode_info(0x0C, WDC_OM.TSB, WDC_AM.Ad, "TSB a"),
    0x0D: new opcode_info(0x0D, WDC_OM.ORA, WDC_AM.A, "ORA a"),
    0x0E: new opcode_info(0x0E, WDC_OM.ASL, WDC_AM.Ad, "ASL a"),
    0x0F: new opcode_info(0x0F, WDC_OM.ORA, WDC_AM.AL, "ORA al"),
    0x10: new opcode_info(0x10, WDC_OM.BPL, WDC_AM.PC_R, "BPL r"),
    0x11: new opcode_info(0x11, WDC_OM.ORA, WDC_AM.D_IND_INDEXED, "ORA (d),y"),
    0x12: new opcode_info(0x12, WDC_OM.ORA, WDC_AM.D_IND, "ORA (d)"),
    0x13: new opcode_info(0x13, WDC_OM.ORA, WDC_AM.STACK_R_IND_INDEXED, "ORA (d,s),y"),
    0x14: new opcode_info(0x14, WDC_OM.TRB, WDC_AM.Db, "TRB d"),
    0x15: new opcode_info(0x15, WDC_OM.ORA, WDC_AM.D_INDEXED_X, "ORA d,x"),
    0x16: new opcode_info(0x16, WDC_OM.ASL, WDC_AM.D_INDEXED_Xb, "ASL d,x"),
    0x17: new opcode_info(0x17, WDC_OM.ORA, WDC_AM.D_IND_L_INDEXED, "ORA [d],y"),
    0x18: new opcode_info(0x18, WDC_OM.CLC, WDC_AM.I, "CLC i"),
    0x19: new opcode_info(0x19, WDC_OM.ORA, WDC_AM.A_INDEXED_Y, "ORA a,y"),
    0x1A: new opcode_info(0x1A, WDC_OM.INC, WDC_AM.ACCUM, "INC A"),
    0x1B: new opcode_info(0x1B, WDC_OM.TCS, WDC_AM.I, "TCS i"),
    0x1C: new opcode_info(0x1C, WDC_OM.TRB, WDC_AM.Ad, "TRB a"),
    0x1D: new opcode_info(0x1D, WDC_OM.ORA, WDC_AM.A_INDEXED_X, "ORA a,x"),
    0x1E: new opcode_info(0x1E, WDC_OM.ASL, WDC_AM.A_INDEXED_Xb, "ASL a,x"),
    0x1F: new opcode_info(0x1F, WDC_OM.ORA, WDC_AM.AL_INDEXED_X, "ORA al,x"),
    0x20: new opcode_info(0x20, WDC_OM.JSR, WDC_AM.Ac, "JSR a"),
    0x21: new opcode_info(0x21, WDC_OM.AND, WDC_AM.D_INDEXED_IND, "AND (d,x)"),
    0x22: new opcode_info(0x22, WDC_OM.JSL, WDC_AM.ALc, "JSL al"),
    0x23: new opcode_info(0x23, WDC_OM.AND, WDC_AM.STACK_R, "AND d,s"),
    0x24: new opcode_info(0x24, WDC_OM.BIT, WDC_AM.D, "BIT d"),
    0x25: new opcode_info(0x25, WDC_OM.AND, WDC_AM.D, "AND d"),
    0x26: new opcode_info(0x26, WDC_OM.ROL, WDC_AM.Db, "ROL d"),
    0x27: new opcode_info(0x27, WDC_OM.AND, WDC_AM.D_IND_L, "AND [d]"),
    0x28: new opcode_info(0x28, WDC_OM.PLP, WDC_AM.STACKb, "PLP s"),
    0x29: new opcode_info(0x29, WDC_OM.AND, WDC_AM.IMM, "AND #"),
    0x2A: new opcode_info(0x2A, WDC_OM.ROL, WDC_AM.ACCUM, "ROL A"),
    0x2B: new opcode_info(0x2B, WDC_OM.PLD, WDC_AM.STACKb, "PLD s"),
    0x2C: new opcode_info(0x2C, WDC_OM.BIT, WDC_AM.A, "BIT a"),
    0x2D: new opcode_info(0x2D, WDC_OM.AND, WDC_AM.A, "AND a"),
    0x2E: new opcode_info(0x2E, WDC_OM.ROL, WDC_AM.Ad, "ROL a"),
    0x2F: new opcode_info(0x2F, WDC_OM.AND, WDC_AM.AL, "AND al"),
    0x30: new opcode_info(0x30, WDC_OM.BMI, WDC_AM.PC_R, "BMI r"),
    0x31: new opcode_info(0x31, WDC_OM.AND, WDC_AM.D_IND_INDEXED, "AND (d),y"),
    0x32: new opcode_info(0x32, WDC_OM.AND, WDC_AM.D_IND, "AND (d)"),
    0x33: new opcode_info(0x33, WDC_OM.AND, WDC_AM.STACK_R_IND_INDEXED, "AND (d,s),y"),
    0x34: new opcode_info(0x34, WDC_OM.BIT, WDC_AM.D_INDEXED_X, "BIT d,x"),
    0x35: new opcode_info(0x35, WDC_OM.AND, WDC_AM.D_INDEXED_X, "AND d,x"),
    0x36: new opcode_info(0x36, WDC_OM.ROL, WDC_AM.D_INDEXED_Xb, "ROL d,x"),
    0x37: new opcode_info(0x37, WDC_OM.AND, WDC_AM.D_IND_L_INDEXED, "AND [d],y"),
    0x38: new opcode_info(0x38, WDC_OM.SEC, WDC_AM.I, "SEC i"),
    0x39: new opcode_info(0x39, WDC_OM.AND, WDC_AM.A_INDEXED_Y, "AND a,y"),
    0x3A: new opcode_info(0x3A, WDC_OM.DEC, WDC_AM.ACCUM, "DEC A"),
    0x3B: new opcode_info(0x3B, WDC_OM.TSC, WDC_AM.I, "TSC i"),
    0x3C: new opcode_info(0x3C, WDC_OM.BIT, WDC_AM.A_INDEXED_X, "BIT a,x"),
    0x3D: new opcode_info(0x3D, WDC_OM.AND, WDC_AM.A_INDEXED_X, "AND a,x"),
    0x3E: new opcode_info(0x3E, WDC_OM.ROL, WDC_AM.A_INDEXED_Xb, "ROL a,x"),
    0x3F: new opcode_info(0x3F, WDC_OM.AND, WDC_AM.AL_INDEXED_X, "AND al,x"),
    0x40: new opcode_info(0x40, WDC_OM.RTI, WDC_AM.STACKg, "RTI s"),
    0x41: new opcode_info(0x41, WDC_OM.EOR, WDC_AM.D_INDEXED_IND, "EOR (d,x)"),
    0x42: new opcode_info(0x42, WDC_OM.WDM, WDC_AM.I, "WDM i"),
    0x43: new opcode_info(0x43, WDC_OM.EOR, WDC_AM.STACK_R, "EOR d,s"),
    0x44: new opcode_info(0x44, WDC_OM.MVP, WDC_AM.XYCb, "MVP xyc"),
    0x45: new opcode_info(0x45, WDC_OM.EOR, WDC_AM.D, "EOR d"),
    0x46: new opcode_info(0x46, WDC_OM.LSR, WDC_AM.Db, "LSR d"),
    0x47: new opcode_info(0x47, WDC_OM.EOR, WDC_AM.D_IND_L, "EOR [d]"),
    0x48: new opcode_info(0x48, WDC_OM.PHA, WDC_AM.STACKc, "PHA s"),
    0x49: new opcode_info(0x49, WDC_OM.EOR, WDC_AM.IMM, "EOR #"),
    0x4A: new opcode_info(0x4A, WDC_OM.LSR, WDC_AM.ACCUM, "LSR A"),
    0x4B: new opcode_info(0x4B, WDC_OM.PHK, WDC_AM.STACKc, "PHK s"),
    0x4C: new opcode_info(0x4C, WDC_OM.JMP, WDC_AM.Ab, "JMP a"),
    0x4D: new opcode_info(0x4D, WDC_OM.EOR, WDC_AM.A, "EOR a"),
    0x4E: new opcode_info(0x4E, WDC_OM.LSR, WDC_AM.Ad, "LSR a"),
    0x4F: new opcode_info(0x4F, WDC_OM.EOR, WDC_AM.AL, "EOR al"),
    0x50: new opcode_info(0x50, WDC_OM.BVC, WDC_AM.PC_R, "BVC r"),
    0x51: new opcode_info(0x51, WDC_OM.EOR, WDC_AM.D_IND_INDEXED, "EOR (d),y"),
    0x52: new opcode_info(0x52, WDC_OM.EOR, WDC_AM.D_IND, "EOR (d)"),
    0x53: new opcode_info(0x53, WDC_OM.EOR, WDC_AM.STACK_R_IND_INDEXED, "EOR (d,s),y"),
    0x54: new opcode_info(0x54, WDC_OM.MVN, WDC_AM.XYC, "MVN xyc"),
    0x55: new opcode_info(0x55, WDC_OM.EOR, WDC_AM.D_INDEXED_X, "EOR d,x"),
    0x56: new opcode_info(0x56, WDC_OM.LSR, WDC_AM.D_INDEXED_Xb, "LSR d,x"),
    0x57: new opcode_info(0x57, WDC_OM.EOR, WDC_AM.D_IND_L_INDEXED, "EOR [d],y"),
    0x58: new opcode_info(0x58, WDC_OM.CLI, WDC_AM.Ie, "CLI i"),
    0x59: new opcode_info(0x59, WDC_OM.EOR, WDC_AM.A_INDEXED_Y, "EOR a,y"),
    0x5A: new opcode_info(0x5A, WDC_OM.PHY, WDC_AM.STACKc, "PHY s"),
    0x5B: new opcode_info(0x5B, WDC_OM.TCD, WDC_AM.I, "TCD i"),
    0x5C: new opcode_info(0x5C, WDC_OM.JMP, WDC_AM.ALb, "JMP al"),
    0x5D: new opcode_info(0x5D, WDC_OM.EOR, WDC_AM.A_INDEXED_X, "EOR a,x"),
    0x5E: new opcode_info(0x5E, WDC_OM.LSR, WDC_AM.A_INDEXED_Xb, "LSR a,x"),
    0x5F: new opcode_info(0x5F, WDC_OM.EOR, WDC_AM.AL_INDEXED_X, "EOR al,x"),
    0x60: new opcode_info(0x60, WDC_OM.RTS, WDC_AM.STACKh, "RTS s"),
    0x61: new opcode_info(0x61, WDC_OM.ADC, WDC_AM.D_INDEXED_IND, "ADC (d,x)"),
    0x62: new opcode_info(0x62, WDC_OM.PER, WDC_AM.STACKf, "PER s"),
    0x63: new opcode_info(0x63, WDC_OM.ADC, WDC_AM.STACK_R, "ADC d,s"),
    0x64: new opcode_info(0x64, WDC_OM.STZ, WDC_AM.D, "STZ d"),
    0x65: new opcode_info(0x65, WDC_OM.ADC, WDC_AM.D, "ADC d"),
    0x66: new opcode_info(0x66, WDC_OM.ROR, WDC_AM.Db, "ROR d"),
    0x67: new opcode_info(0x67, WDC_OM.ADC, WDC_AM.D_IND_L, "ADC [d]"),
    0x68: new opcode_info(0x68, WDC_OM.PLA, WDC_AM.STACKb, "PLA s"),
    0x69: new opcode_info(0x69, WDC_OM.ADC, WDC_AM.IMM, "ADC #"),
    0x6A: new opcode_info(0x6A, WDC_OM.ROR, WDC_AM.ACCUM, "ROR A"),
    0x6B: new opcode_info(0x6B, WDC_OM.RTL, WDC_AM.STACKi, "RTL s"),
    0x6C: new opcode_info(0x6C, WDC_OM.JMP, WDC_AM.A_INDb, "JMP (a)"),
    0x6D: new opcode_info(0x6D, WDC_OM.ADC, WDC_AM.A, "ADC a"),
    0x6E: new opcode_info(0x6E, WDC_OM.ROR, WDC_AM.Ad, "ROR a"),
    0x6F: new opcode_info(0x6F, WDC_OM.ADC, WDC_AM.AL, "ADC al"),
    0x70: new opcode_info(0x70, WDC_OM.BVS, WDC_AM.PC_R, "BVS r"),
    0x71: new opcode_info(0x71, WDC_OM.ADC, WDC_AM.D_IND_INDEXED, "ADC (d),y"),
    0x72: new opcode_info(0x72, WDC_OM.ADC, WDC_AM.D_IND, "ADC (d)"),
    0x73: new opcode_info(0x73, WDC_OM.ADC, WDC_AM.STACK_R_IND_INDEXED, "ADC (d,s),y"),
    0x74: new opcode_info(0x74, WDC_OM.STZ, WDC_AM.D_INDEXED_X, "STZ d,x"),
    0x75: new opcode_info(0x75, WDC_OM.ADC, WDC_AM.D_INDEXED_X, "ADC d,x"),
    0x76: new opcode_info(0x76, WDC_OM.ROR, WDC_AM.D_INDEXED_Xb, "ROR d,x"),
    0x77: new opcode_info(0x77, WDC_OM.ADC, WDC_AM.D_IND_L_INDEXED, "ADC [d],y"),
    0x78: new opcode_info(0x78, WDC_OM.SEI, WDC_AM.Ie, "SEI i"),
    0x79: new opcode_info(0x79, WDC_OM.ADC, WDC_AM.A_INDEXED_Y, "ADC a,y"),
    0x7A: new opcode_info(0x7A, WDC_OM.PLY, WDC_AM.STACKb, "PLY s"),
    0x7B: new opcode_info(0x7B, WDC_OM.TDC, WDC_AM.I, "TDC i"),
    0x7C: new opcode_info(0x7C, WDC_OM.JMP, WDC_AM.A_INDEXED_IND, "JMP (a,x)"),
    0x7D: new opcode_info(0x7D, WDC_OM.ADC, WDC_AM.A_INDEXED_X, "ADC a,x"),
    0x7E: new opcode_info(0x7E, WDC_OM.ROR, WDC_AM.A_INDEXED_Xb, "ROR a,x"),
    0x7F: new opcode_info(0x7F, WDC_OM.ADC, WDC_AM.AL_INDEXED_X, "ADC al,x"),
    0x80: new opcode_info(0x80, WDC_OM.BRA, WDC_AM.PC_R, "BRA r"),
    0x81: new opcode_info(0x81, WDC_OM.STA, WDC_AM.D_INDEXED_IND, "STA (d,x)"),
    0x82: new opcode_info(0x82, WDC_OM.BRL, WDC_AM.PC_RL, "BRL rl"),
    0x83: new opcode_info(0x83, WDC_OM.STA, WDC_AM.STACK_R, "STA d,s"),
    0x84: new opcode_info(0x84, WDC_OM.STY, WDC_AM.D, "STY d"),
    0x85: new opcode_info(0x85, WDC_OM.STA, WDC_AM.D, "STA d"),
    0x86: new opcode_info(0x86, WDC_OM.STX, WDC_AM.D, "STX d"),
    0x87: new opcode_info(0x87, WDC_OM.STA, WDC_AM.D_IND_L, "STA [d]"),
    0x88: new opcode_info(0x88, WDC_OM.DEY, WDC_AM.I, "DEY i"),
    0x89: new opcode_info(0x89, WDC_OM.BIT, WDC_AM.IMM, "BIT #"),
    0x8A: new opcode_info(0x8A, WDC_OM.TXA, WDC_AM.I, "TXA i"),
    0x8B: new opcode_info(0x8B, WDC_OM.PHB, WDC_AM.STACKc, "PHB s"),
    0x8C: new opcode_info(0x8C, WDC_OM.STY, WDC_AM.A, "STY a"),
    0x8D: new opcode_info(0x8D, WDC_OM.STA, WDC_AM.A, "STA a"),
    0x8E: new opcode_info(0x8E, WDC_OM.STX, WDC_AM.A, "STX a"),
    0x8F: new opcode_info(0x8F, WDC_OM.STA, WDC_AM.AL, "STA al"),
    0x90: new opcode_info(0x90, WDC_OM.BCC, WDC_AM.PC_R, "BCC r"),
    0x91: new opcode_info(0x91, WDC_OM.STA, WDC_AM.D_IND_INDEXED, "STA (d),y"),
    0x92: new opcode_info(0x92, WDC_OM.STA, WDC_AM.D_IND, "STA (d)"),
    0x93: new opcode_info(0x93, WDC_OM.STA, WDC_AM.STACK_R_IND_INDEXED, "STA (d,s),y"),
    0x94: new opcode_info(0x94, WDC_OM.STY, WDC_AM.D_INDEXED_X, "STY d,x"),
    0x95: new opcode_info(0x95, WDC_OM.STA, WDC_AM.D_INDEXED_X, "STA d,x"),
    0x96: new opcode_info(0x96, WDC_OM.STX, WDC_AM.D_INDEXED_Y, "STX d,y"),
    0x97: new opcode_info(0x97, WDC_OM.STA, WDC_AM.D_IND_L_INDEXED, "STA [d],y"),
    0x98: new opcode_info(0x98, WDC_OM.TYA, WDC_AM.I, "TYA i"),
    0x99: new opcode_info(0x99, WDC_OM.STA, WDC_AM.A_INDEXED_Y, "STA a,y"),
    0x9A: new opcode_info(0x9A, WDC_OM.TXS, WDC_AM.I, "TXS i"),
    0x9B: new opcode_info(0x9B, WDC_OM.TXY, WDC_AM.I, "TXY i"),
    0x9C: new opcode_info(0x9C, WDC_OM.STZ, WDC_AM.A, "STZ a"),
    0x9D: new opcode_info(0x9D, WDC_OM.STA, WDC_AM.A_INDEXED_X, "STA a,x"),
    0x9E: new opcode_info(0x9E, WDC_OM.STZ, WDC_AM.A_INDEXED_X, "STZ a,x"),
    0x9F: new opcode_info(0x9F, WDC_OM.STA, WDC_AM.AL_INDEXED_X, "STA al,x"),
    0xA0: new opcode_info(0xA0, WDC_OM.LDY, WDC_AM.IMM, "LDY #"),
    0xA1: new opcode_info(0xA1, WDC_OM.LDA, WDC_AM.D_INDEXED_IND, "LDA (d,x)"),
    0xA2: new opcode_info(0xA2, WDC_OM.LDX, WDC_AM.IMM, "LDX #"),
    0xA3: new opcode_info(0xA3, WDC_OM.LDA, WDC_AM.STACK_R, "LDA d,s"),
    0xA4: new opcode_info(0xA4, WDC_OM.LDY, WDC_AM.D, "LDY d"),
    0xA5: new opcode_info(0xA5, WDC_OM.LDA, WDC_AM.D, "LDA d"),
    0xA6: new opcode_info(0xA6, WDC_OM.LDX, WDC_AM.D, "LDX d"),
    0xA7: new opcode_info(0xA7, WDC_OM.LDA, WDC_AM.D_IND_L, "LDA [d]"),
    0xA8: new opcode_info(0xA8, WDC_OM.TAY, WDC_AM.I, "TAY i"),
    0xA9: new opcode_info(0xA9, WDC_OM.LDA, WDC_AM.IMM, "LDA #"),
    0xAA: new opcode_info(0xAA, WDC_OM.TAX, WDC_AM.I, "TAX i"),
    0xAB: new opcode_info(0xAB, WDC_OM.PLB, WDC_AM.STACKb, "PLB s"),
    0xAC: new opcode_info(0xAC, WDC_OM.LDY, WDC_AM.A, "LDY a"),
    0xAD: new opcode_info(0xAD, WDC_OM.LDA, WDC_AM.A, "LDA a"),
    0xAE: new opcode_info(0xAE, WDC_OM.LDX, WDC_AM.A, "LDX a"),
    0xAF: new opcode_info(0xAF, WDC_OM.LDA, WDC_AM.AL, "LDA al"),
    0xB0: new opcode_info(0xB0, WDC_OM.BCS, WDC_AM.PC_R, "BCS r"),
    0xB1: new opcode_info(0xB1, WDC_OM.LDA, WDC_AM.D_IND_INDEXED, "LDA (d),y"),
    0xB2: new opcode_info(0xB2, WDC_OM.LDA, WDC_AM.D_IND, "LDA (d)"),
    0xB3: new opcode_info(0xB3, WDC_OM.LDA, WDC_AM.STACK_R_IND_INDEXED, "LDA (d,s),y"),
    0xB4: new opcode_info(0xB4, WDC_OM.LDY, WDC_AM.D_INDEXED_X, "LDY d,x"),
    0xB5: new opcode_info(0xB5, WDC_OM.LDA, WDC_AM.D_INDEXED_X, "LDA d,x"),
    0xB6: new opcode_info(0xB6, WDC_OM.LDX, WDC_AM.D_INDEXED_Y, "LDX d,y"),
    0xB7: new opcode_info(0xB7, WDC_OM.LDA, WDC_AM.D_IND_L_INDEXED, "LDA [d],y"),
    0xB8: new opcode_info(0xB8, WDC_OM.CLV, WDC_AM.I, "CLV i"),
    0xB9: new opcode_info(0xB9, WDC_OM.LDA, WDC_AM.A_INDEXED_Y, "LDA a,y"),
    0xBA: new opcode_info(0xBA, WDC_OM.TSX, WDC_AM.I, "TSX i"),
    0xBB: new opcode_info(0xBB, WDC_OM.TYX, WDC_AM.I, "TYX i"),
    0xBC: new opcode_info(0xBC, WDC_OM.LDY, WDC_AM.A_INDEXED_X, "LDY a,x"),
    0xBD: new opcode_info(0xBD, WDC_OM.LDA, WDC_AM.A_INDEXED_X, "LDA a,x"),
    0xBE: new opcode_info(0xBE, WDC_OM.LDX, WDC_AM.A_INDEXED_Y, "LDX a,y"),
    0xBF: new opcode_info(0xBF, WDC_OM.LDA, WDC_AM.AL_INDEXED_X, "LDA al,x"),
    0xC0: new opcode_info(0xC0, WDC_OM.CPY, WDC_AM.IMM, "CPY #"),
    0xC1: new opcode_info(0xC1, WDC_OM.CMP, WDC_AM.D_INDEXED_IND, "CMP (d,x)"),
    0xC2: new opcode_info(0xC2, WDC_OM.REP, WDC_AM.IMMb, "REP #"),
    0xC3: new opcode_info(0xC3, WDC_OM.CMP, WDC_AM.STACK_R, "CMP d,s"),
    0xC4: new opcode_info(0xC4, WDC_OM.CPY, WDC_AM.D, "CPY d"),
    0xC5: new opcode_info(0xC5, WDC_OM.CMP, WDC_AM.D, "CMP d"),
    0xC6: new opcode_info(0xC6, WDC_OM.DEC, WDC_AM.Db, "DEC d"),
    0xC7: new opcode_info(0xC7, WDC_OM.CMP, WDC_AM.D_IND_L, "CMP [d]"),
    0xC8: new opcode_info(0xC8, WDC_OM.INY, WDC_AM.I, "INY i"),
    0xC9: new opcode_info(0xC9, WDC_OM.CMP, WDC_AM.IMM, "CMP #"),
    0xCA: new opcode_info(0xCA, WDC_OM.DEX, WDC_AM.I, "DEX i"),
    0xCB: new opcode_info(0xCB, WDC_OM.WAI, WDC_AM.Id, "WAI i"),
    0xCC: new opcode_info(0xCC, WDC_OM.CPY, WDC_AM.A, "CPY a"),
    0xCD: new opcode_info(0xCD, WDC_OM.CMP, WDC_AM.A, "CMP a"),
    0xCE: new opcode_info(0xCE, WDC_OM.DEC, WDC_AM.Ad, "DEC a"),
    0xCF: new opcode_info(0xCF, WDC_OM.CMP, WDC_AM.AL, "CMP al"),
    0xD0: new opcode_info(0xD0, WDC_OM.BNE, WDC_AM.PC_R, "BNE r"),
    0xD1: new opcode_info(0xD1, WDC_OM.CMP, WDC_AM.D_IND_INDEXED, "CMP (d),y"),
    0xD2: new opcode_info(0xD2, WDC_OM.CMP, WDC_AM.D_IND, "CMP (d)"),
    0xD3: new opcode_info(0xD3, WDC_OM.CMP, WDC_AM.STACK_R_IND_INDEXED, "CMP (d,s),y"),
    0xD4: new opcode_info(0xD4, WDC_OM.PEI, WDC_AM.STACKe, "PEI s"),
    0xD5: new opcode_info(0xD5, WDC_OM.CMP, WDC_AM.D_INDEXED_X, "CMP d,x"),
    0xD6: new opcode_info(0xD6, WDC_OM.DEC, WDC_AM.D_INDEXED_Xb, "DEC d,x"),
    0xD7: new opcode_info(0xD7, WDC_OM.CMP, WDC_AM.D_IND_L_INDEXED, "CMP [d],y"),
    0xD8: new opcode_info(0xD8, WDC_OM.CLD, WDC_AM.I, "CLD i"),
    0xD9: new opcode_info(0xD9, WDC_OM.CMP, WDC_AM.A_INDEXED_Y, "CMP a,y"),
    0xDA: new opcode_info(0xDA, WDC_OM.PHX, WDC_AM.STACKc, "PHX s"),
    0xDB: new opcode_info(0xDB, WDC_OM.STP, WDC_AM.Ic, "STP i"),
    0xDC: new opcode_info(0xDC, WDC_OM.JML, WDC_AM.A_IND, "JML (a)"),
    0xDD: new opcode_info(0xDD, WDC_OM.CMP, WDC_AM.A_INDEXED_X, "CMP a,x"),
    0xDE: new opcode_info(0xDE, WDC_OM.DEC, WDC_AM.A_INDEXED_Xb, "DEC a,x"),
    0xDF: new opcode_info(0xDF, WDC_OM.CMP, WDC_AM.AL_INDEXED_X, "CMP al,x"),
    0xE0: new opcode_info(0xE0, WDC_OM.CPX, WDC_AM.IMM, "CPX #"),
    0xE1: new opcode_info(0xE1, WDC_OM.SBC, WDC_AM.D_INDEXED_IND, "SBC (d,x)"),
    0xE2: new opcode_info(0xE2, WDC_OM.SEP, WDC_AM.IMMb, "SEP #"),
    0xE3: new opcode_info(0xE3, WDC_OM.SBC, WDC_AM.STACK_R, "SBC d,s"),
    0xE4: new opcode_info(0xE4, WDC_OM.CPX, WDC_AM.D, "CPX d"),
    0xE5: new opcode_info(0xE5, WDC_OM.SBC, WDC_AM.D, "SBC d"),
    0xE6: new opcode_info(0xE6, WDC_OM.INC, WDC_AM.Db, "INC d"),
    0xE7: new opcode_info(0xE7, WDC_OM.SBC, WDC_AM.D_IND_L, "SBC [d]"),
    0xE8: new opcode_info(0xE8, WDC_OM.INX, WDC_AM.I, "INX i"),
    0xE9: new opcode_info(0xE9, WDC_OM.SBC, WDC_AM.IMM, "SBC #"),
    0xEA: new opcode_info(0xEA, WDC_OM.NOP, WDC_AM.I, "NOP i"),
    0xEB: new opcode_info(0xEB, WDC_OM.XBA, WDC_AM.Ib, "XBA i"),
    0xEC: new opcode_info(0xEC, WDC_OM.CPX, WDC_AM.A, "CPX a"),
    0xED: new opcode_info(0xED, WDC_OM.SBC, WDC_AM.A, "SBC a"),
    0xEE: new opcode_info(0xEE, WDC_OM.INC, WDC_AM.Ad, "INC a"),
    0xEF: new opcode_info(0xEF, WDC_OM.SBC, WDC_AM.AL, "SBC al"),
    0xF0: new opcode_info(0xF0, WDC_OM.BEQ, WDC_AM.PC_R, "BEQ r"),
    0xF1: new opcode_info(0xF1, WDC_OM.SBC, WDC_AM.D_IND_INDEXED, "SBC (d),y"),
    0xF2: new opcode_info(0xF2, WDC_OM.SBC, WDC_AM.D_IND, "SBC (d)"),
    0xF3: new opcode_info(0xF3, WDC_OM.SBC, WDC_AM.STACK_R_IND_INDEXED, "SBC (d,s),y"),
    0xF4: new opcode_info(0xF4, WDC_OM.PEA, WDC_AM.STACKd, "PEA s"),
    0xF5: new opcode_info(0xF5, WDC_OM.SBC, WDC_AM.D_INDEXED_X, "SBC d,x"),
    0xF6: new opcode_info(0xF6, WDC_OM.INC, WDC_AM.D_INDEXED_Xb, "INC d,x"),
    0xF7: new opcode_info(0xF7, WDC_OM.SBC, WDC_AM.D_IND_L_INDEXED, "SBC [d],y"),
    0xF8: new opcode_info(0xF8, WDC_OM.SED, WDC_AM.I, "SED i"),
    0xF9: new opcode_info(0xF9, WDC_OM.SBC, WDC_AM.A_INDEXED_Y, "SBC a,y"),
    0xFA: new opcode_info(0xFA, WDC_OM.PLX, WDC_AM.STACKb, "PLX s"),
    0xFB: new opcode_info(0xFB, WDC_OM.XCE, WDC_AM.I, "XCE i"),
    0xFC: new opcode_info(0xFC, WDC_OM.JSR, WDC_AM.A_INDEXED_INDb, "JSR (a,x)"),
    0xFD: new opcode_info(0xFD, WDC_OM.SBC, WDC_AM.A_INDEXED_X, "SBC a,x"),
    0xFE: new opcode_info(0xFE, WDC_OM.INC, WDC_AM.A_INDEXED_Xb, "INC a,x"),
    0xFF: new opcode_info(0xFF, WDC_OM.SBC, WDC_AM.AL_INDEXED_X, "SBC al,x"),
    0x100: new opcode_info(0x100, WDC_OM.S_RESET, WDC_AM.STACK, "S_RESET s"),
    0x101: new opcode_info(0x101, WDC_OM.S_ABORT, WDC_AM.STACK, "S_ABORT s"),
    0x102: new opcode_info(0x102, WDC_OM.S_IRQ, WDC_AM.STACK, "S_IRQ s"),
    0x103: new opcode_info(0x103, WDC_OM.S_NMI, WDC_AM.STACK, "S_NMI s")
});

class opcode_functions {
    constructor(opcode_info, exec_func, affected_by_E, affected_by_M, affected_by_X, affected_by_D) {
        this.opcode = opcode_info.opcode;
        this.ins = opcode_info.ins;
        this.addr_mode = opcode_info.addr_mode;
        this.mnemonic = opcode_info.mnemonic;
        this.exec_func = exec_func;
        this.affected_by_E = affected_by_E;
        this.affected_by_M = affected_by_M;
        this.affected_by_X = affected_by_X;
        this.affected_by_D = affected_by_D;
    }
}

// For relative addressing
function mksigned8(what) {
     return what >= 0x80 ? -(0x100 - what) : what;
}

function mksigned16(what) {
     return what >= 0x8000 ? -(0x10000 - what) : what;
}

class switchgen {
    constructor(indent, what) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.in_case = false;
        this.last_case = 0;
        this.has_footer = false;
        this.no_addr_at_end = false;
        this.no_RPDV_at_end = false;
        this.has_custom_end = false;
        this.outstr = '';

        // We start any instruction on a read of a valid address
        this.old_rw = 0;
        this.old_pdv = 1;

        this.clear(indent, what);
    }

    clear(indent, what) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.in_case = false;
        this.last_case = 0;
        this.has_footer = false;
        this.no_addr_at_end = false;
        this.no_RPDV_at_end = false;
        this.has_custom_end = false;
        this.outstr = this.indent1 + 'switch(' + what + ') {\n';

        this.old_rw = 0;
        this.old_pdv = 1;
    }

    // We actually ignore the input cycle #
    // This is determined automatically
    // Passed in is reference cycle # from WDC doc, which is not 0-based
    addcycle(whatup) {
        if (this.in_case)
            this.outstr += this.indent3 + 'break;\n';
        let what = (parseInt(this.last_case) + 1).toString();
        this.last_case = what;
        this.in_case = true;
        if (typeof(whatup) !== 'undefined')
            this.outstr += this.indent2 + 'case ' + what + ': // ' + whatup + '\n';
        else
            this.outstr += this.indent2 + 'case ' + what + ':\n';
    }

    check_irqs() {
        // Nevermind this was pointless
    }

    // This is a final "cycle" only SOME functions use, mostly to get final data read or written
    cleanup() {
        this.has_footer = true;
        this.addcycle('cleanup_custom');
        this.check_irqs();
    }

    no_modify_addr() {
        this.no_addr_at_end = true;
    }

    no_modify_RPDV() {
        this.no_RPDV_at_end = true;
    }

    addr_to(low, high) {
        this.addl('pins.Addr = (' + low + '); pins.BA = (' + high + ');');
    }

    D_to_TRH() {
        this.addl('pins.D = (regs.TR >>> 8) & 0xFF;');
    }

    D_to_TRL() {
        this.addl('pins.D = regs.TR & 0xFF;');
    }

    addr_inc() {
        this.addl('pins.Addr = (pins.Addr + 1) & 0xFFFF;');
    }
    addr_inc_unbound() {
        this.addl('pins.Addr++; if (pins.Addr === 0x10000) { pins.Addr = 0; pins.BA = (pins.BA + 1) & 0xFF; };');
    }

    addr_dec() {
        this.addl('pins.Addr = (pins.Addr - 1) & 0xFFFF;');
    }

    addr_dec_unbound() {
        this.addl('pins.Addr--; if (pins.Addr < 0) { pins.Addr = 0xFFFF; pins.BA = (pins.BA - 1) & 0xFF; };');
    }

    addr_to_DBR(who) {
        this.addr_to(who, 'regs.DBR');
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
        this.addl('regs.TA = pins.D;')
        this.addr_to_PC_then_inc_noPBR();
        this.addcycle(4); // 4
        this.addl('regs.TA += pins.D << 8;');
    }

    addr_to_PC_then_inc() {
        this.addl('pins.Addr = regs.PC; pins.BA = regs.PBR;');
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    addr_to_PC_then_inc_noPBR() {
        this.addl('pins.Addr = regs.PC;');
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    addr_to_S_after_inc() {
        this.addl('regs.S = (regs.S + 1) & 0xFFFF;');
        this.addl('if (regs.E) regs.S = (regs.S & 0xFF) | 0x0100;');
        this.addl('pins.Addr = regs.S; pins.BA = 0;');
    }

    addr_to_S_after_inc_unbound() {
        this.addl('regs.S = (regs.S + 1) & 0xFFFF;');
        //this.addl('if (regs.E) regs.S = (regs.S & 0xFF) | 0x0100;');
        this.addl('pins.Addr = regs.S; pins.BA = 0;');
    }

    addr_to_S_then_dec() {
        this.addl('pins.Addr = regs.S; pins.BA = 0;');
        this.addl('regs.S = (regs.S - 1) & 0xFFFF;');
        this.addl('if (regs.E) regs.S = (regs.S & 0xFF) | 0x0100;');
    }

    addr_to_S_then_dec_unbound() {
        this.addl('pins.Addr = regs.S; pins.BA = 0;');
        this.addl('regs.S = (regs.S - 1) & 0xFFFF;');
        //this.addl('if (regs.E) regs.S = (regs.S & 0xFF) | 0x0100;');
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
        this.addl('regs.TR = pins.D;')
        this.addl('regs.TA = (regs.TA + 1) & 0xFFFF;');
        this.addr_to_ta_pbr();
        this.addcycle();
        this.addl('regs.TR += pins.D << 8;');
    }

    regular_end() {
        this.addl('// Following is auto-generated code for instruction finish')
        if (!this.has_footer) {
            this.addcycle('cleanup');
            this.check_irqs();
        }
        if (!this.no_addr_at_end)
            this.addr_to_PC_then_inc();
        if (!this.no_RPDV_at_end)
            this.RPDV(0, 1, 1, 0);
        this.addl('regs.TCU = 0;')
        this.addl('break;')
    }

    finished() {
        if (!this.in_case) {
            return '';
        }
        //this.addcycle((parseInt(this.last_case) + 1).toString());
        if (!this.has_custom_end) {
            this.regular_end();
            /*this.outstr += this.indent2 + 'default:\n';
            this.addl('console.log("TCU " + regs.TCU.toString() + " not valid for current op!");');
            this.addl('break;');*/
        }

        this.outstr += this.indent1 + '}\n';
        //this.outstr += this.indent1 + 'return false;\n';
        return this.outstr;
    }

    setn8(who) {
        this.addl('regs.P.N = ((' + who + ') & 0x80) >>> 7;');
    }
    setn16(who) {
        this.addl('regs.P.N = ((' + who + ') & 0x8000) >>> 15;');
    }
    setz(who) {
        this.addl('regs.P.Z = +((' + who + ') === 0);');
    }

    ADC8() {
        this.addl('let A = regs.C & 0xFF; regs.TR &= 0xFF;');
        this.addl('let result;')
        this.addl('if (!regs.P.D) result = A + regs.TR + regs.P.C;');
        this.addl('else {');
        this.addl('    result = (A & 0x0F) + (regs.TR & 0x0F) + (regs.P.C << 0);')
        this.addl('    if (result > 0x09) result += 0x06;')
        this.addl('    regs.P.C = +(result > 0x0F);')
        this.addl('    result = (A & 0xF0) + (regs.TR & 0xF0) + (regs.P.C << 4) + (result & 0x0F);')
        this.addl('}')

        this.addl('regs.P.V = ((~(A ^ regs.TR)) & (A ^ result) & 0x80) >>> 7;')
        this.addl('if (regs.P.D && result > 0x9F) result += 0x60;');
        this.addl('regs.P.C = +(result > 0xFF);')
        this.setz('(result & 0xFF)');
        this.setn8('result');
        this.addl('regs.C = (regs.C & 0xFF00) | (result & 0xFF);')
    }

    ADC16() {
        this.addl('let result;');
        this.addl('if (!regs.P.D) result = regs.C + regs.TR + regs.P.C;');
        this.addl('else {');
        this.addl('    result = (regs.C & 0x000F) + (regs.TR & 0x000F) + (regs.P.C << 0);');
        this.addl('    if (result > 0x0009) result += 0x0006;');
        this.addl('    regs.P.C = +(result > 0x000F);')
        this.addl('    result = (regs.C & 0x00F0) + (regs.TR & 0x00F0) + (regs.P.C << 4) + (result & 0x000F);');
        this.addl('    if (result > 0x009F) result += 0x0060;');
        this.addl('    regs.P.C = +(result > 0x00FF);')
        this.addl('    result = (regs.C & 0x0F00) + (regs.TR & 0x0F00) + (regs.P.C << 8) + (result & 0x00FF);');
        this.addl('    if (result > 0x09FF) result += 0x0600;');
        this.addl('    regs.P.C = +(result > 0x0FFF);')
        this.addl('    result = (regs.C & 0xF000) + (regs.TR & 0xF000) + (regs.P.C << 12) + (result & 0x0FFF);');
        this.addl('}');

        this.addl('regs.P.V = ((~(regs.C ^ regs.TR)) & (regs.C ^ result) & 0x8000) >>> 15;');
        this.addl('if (regs.P.D && result > 0x9FFF) result += 0x6000;');
        this.addl('regs.P.C = +(result > 0xFFFF);')
        this.setz('(result & 0xFFFF)');
        this.setn16('result');
        this.addl('regs.C = (result & 0xFFFF);');
    }

    AND8() {
        this.addl('let A = regs.C & regs.TR & 0xFF;')
        this.setz('A');
        this.setn8('A');
        this.addl('regs.C = (regs.C & 0xFF00) + A;');
    }

    AND16() {
        this.addl('regs.C &= regs.TR;');
        this.setz('regs.C');
        this.setn16('regs.C');
    }

    ASL8() {
        this.addl('regs.P.C = (regs.TR & 0x80) >>> 7;')
        this.addl('regs.TR = (regs.TR & 0x7F) << 1;');
        this.setz('regs.TR');
        this.setn8('regs.TR');
    }

    ASL16() {
        this.addl('regs.P.C = (regs.TR & 0x8000) >>> 15;');
        this.addl('regs.TR = (regs.TR & 0x7FFF) << 1;');
        this.setz('regs.TR');
        this.setn16('regs.TR');
    }

    BIT8() {
        this.addl('regs.P.Z = +((regs.C & regs.TR & 0xFF) === 0);');
        this.addl('regs.P.V = (regs.TR & 0x40) >>> 6;');
        this.addl('regs.P.N = (regs.TR & 0x80) >>> 7;');
    }

    BIT16() {
        this.addl('regs.P.Z = +((regs.C & regs.TR & 0xFFFF) === 0);');
        this.addl('regs.P.V = (regs.TR & 0x4000) >>> 14;');
        this.addl('regs.P.N = (regs.TR & 0x8000) >>> 15;');
    }

    BIT8IMM() {
        this.addl('regs.P.Z = +((regs.C & regs.TR & 0xFF) === 0);');
    }

    BIT16IMM() {
        this.addl('regs.P.Z = +((regs.C & regs.TR & 0xFFFF) === 0);');
    }

    cmp8(who) {
        this.addl('regs.TR = (' + who + ' & 0xFF) - regs.TR;');
        this.addl('regs.P.C = +(regs.TR >= 0);');
        this.setz('regs.TR & 0xFF');
        this.setn8('regs.TR & 0xFF');
    }

    cmp16(who) {
        this.addl('regs.TR = (' + who + ') - regs.TR;');
        this.addl('regs.P.C = +(regs.TR >= 0);');
        this.setz('regs.TR');
        this.setn16('regs.TR');
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
        this.addl(who + ' = ((' + who + ') - 1) & 0xFF;');
        this.setz(who);
        this.setn8(who);
    }

    DEXY16(who) {
        this.addl(who + ' = ((' + who + ') - 1) & 0xFFFF;');
        this.setz(who);
        this.setn16(who);
    }

    set_reg_low(who, to) {
        this.addl(who + ' = ((' + who + ') & 0xFF00) + ((' + to + ') & 0xFF);');
    }

    EOR8() {
        this.addl('regs.TR = (regs.C & 0xFF) ^ regs.TR;')
        this.setz('regs.TR');
        this.setn8('regs.TR');
        this.set_reg_low('regs.C', 'regs.TR');
    }

    EOR16() {
        this.addl('regs.C ^= regs.TR;')
        this.setz('regs.C');
        this.setn16('regs.C');
    }

    INXY8(who) {
        this.addl(who + ' = ((' + who + ') + 1) & 0xFF;');
        this.setz(who);
        this.setn8(who);
    }

    INXY16(who) {
        this.addl(who + ' = ((' + who + ') + 1) & 0xFFFF;');
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
        this.addl('pins.D = (' + what + ') & 0xFF;');
        if (decrement)
            this.addr_to_S_then_dec();
        else
            this.addr_to('regs.S');
    }

    push_H(what, decrement) {
        if (typeof(decrement) === 'undefined')
            decrement = true;
        this.addl('pins.D = ((' + what + ') & 0xFF00) >>> 8;');
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
        this.addl('regs.TR = (regs.TR | regs.C) & 0xFF;');
        this.setz('regs.TR');
        this.setn8('regs.TR');
        this.set_reg_low('regs.C', 'regs.TR');
    }

    ORA16() {
        this.addl('regs.C |= regs.TR;');
        this.setz('regs.C');
        this.setn16('regs.C');
    }

    ROL8() {
        this.addl('let carry = regs.P.C;');
        this.addl('regs.P.C = (regs.TR & 0x80) >>> 7;');
        this.addl('regs.TR = ((regs.TR & 0x7F) << 1) | carry;');
        this.setz('regs.TR');
        this.setn8('regs.TR');
    }

    ROL16() {
        this.addl('let carry = regs.P.C;');
        this.addl('regs.P.C = (regs.TR & 0x8000) >>> 15;');
        this.addl('regs.TR = ((regs.TR & 0x7FFF) << 1) | carry;');
        this.setz('regs.TR');
        this.setn16('regs.TR');
    }

    ROR8() {
        this.addl('let carry = regs.P.C << 7;');
        this.addl('regs.P.C = regs.TR & 0x1;');
        this.addl('regs.TR = ((regs.TR & 0xFF) >>> 1) | carry;');
        this.setz('regs.TR');
        this.setn8('regs.TR');
    }

    ROR16() {
        this.addl('let carry = regs.P.C << 15;');
        this.addl('regs.P.C = regs.TR & 0x1;');
        this.addl('regs.TR = ((regs.TR & 0xFFFF) >>> 1) | carry;');
        this.setz('regs.TR');
        this.setn16('regs.TR');
    }

    SBC8() {
        // Thank you Higan source
        this.addl('let A = regs.C & 0xFF; let data = (~regs.TR) & 0xFF;');
        this.addl('let result;')
        this.addl('if (!regs.P.D) result = data + A + regs.P.C;');
        this.addl('else {');
        this.addl('    result = (A & 0x0F) + (data & 0x0F) + (regs.P.C);');
        this.addl('    if (result <= 0x0F) result -= 0x06;');
        this.addl('    regs.P.C = +(result > 0x0F);');
        this.addl('    result = (A & 0xF0) + (data & 0xF0) + (regs.P.C << 4) + (result & 0x0F);');
        this.addl('}');

        this.addl('regs.P.V = ((~(A ^ data)) & (A ^ result) & 0x80) >>> 7;');
        this.addl('if (regs.P.D && result <= 0xFF) result -= 0x60;')
        this.addl('regs.P.C = +(result > 0xFF);');
        this.setz('result & 0xFF');
        this.setn8('result');
        this.addl('regs.C = (regs.C & 0xFF00) | (result & 0xFF);');
    }

    SBC16() {
        this.addl('let data = (~regs.TR) & 0xFFFF;');
        this.addl('let result;')
        this.addl('if (!regs.P.D) result = regs.C + data + regs.P.C;');
        this.addl('else {');
        this.addl('    result = (regs.C & 0x000F) + (data & 0x000F) + (regs.P.C);');
        this.addl('    if (result <= 0x000F) result -= 0x0006;');
        this.addl('    regs.P.C = +(result > 0x000F);');

        this.addl('    result = (regs.C & 0x00F0) + (data & 0x00F0) + (regs.P.C << 4) + (result & 0x000F);');
        this.addl('    if (result <= 0x00FF) result -= 0x0060;');
        this.addl('    regs.P.C = +(result > 0x00FF);');

        this.addl('    result = (regs.C & 0x0F00) + (data & 0x0F00) + (regs.P.C << 8) + (result & 0x00FF);');
        this.addl('    if (result <= 0x0FFF) result -= 0x0600;');
        this.addl('    regs.P.C = +(result > 0x0FFF);');

        this.addl('    result = (regs.C & 0xF000) + (data & 0xF000) + (regs.P.C << 12) + (result & 0x0FFF);');
        this.addl('}');

        this.addl('regs.P.V = ((~(regs.C ^ data)) & (regs.C ^ result) & 0x8000) >>> 15;');
        this.addl('if (regs.P.D && result <= 0xFFFF) result -= 0x6000;');
        this.addl('regs.P.C = +(result > 0xFFFF);');
        this.setz('result & 0xFFFF');
        this.setn16('result');
        this.addl('regs.C = (result & 0xFFFF);');
    }

    TRB8() {
        this.addl('regs.P.Z = +((regs.TR & regs.C & 0xFF) === 0);');
        this.addl('regs.TR = (~regs.C) & regs.TR & 0xFF;');
    }

    TRB16() {
        this.addl('regs.P.Z = +((regs.TR & regs.C & 0xFFFF) === 0);');
        this.addl('regs.TR = (~regs.C) & regs.TR & 0xFFFF;');
    }

    TSB8() {
        this.addl('regs.P.Z = +((regs.TR & regs.C & 0xFF) === 0);');
        this.addl('regs.TR = (regs.C | regs.TR) & 0xFF;');
    }

    TSB16() {
        this.addl('regs.P.Z = +((regs.TR & regs.C & 0xFFFF) === 0);');
        this.addl('regs.TR = (regs.C | regs.TR) & 0xFFFF;');
    }

    // Upon enter emulation or setting X flag to 1
    SETX8() {
        this.addl('regs.X &= 0xFF;')
        this.addl('regs.Y &= 0xFF;')
    }

    // Upon enter emulation or setting M flag to 1
    SETM8() {
        // Nothing to do here really, top of A is not cleared
    }

    TT8(from, to) {
        this.addl(to + ' = ((' + to + ') & 0xFF00) + ((' + from + ') & 0xFF);');
        this.setz(from + ' & 0xFF');
        this.setn8(from);
    }

    TT16(from, to) {
        this.addl(to + ' = (' + from + ');');
        this.setz(from);
        this.setn16(from);
    }

    TAXY8(who) {
        this.TT8('regs.C', who);
    }

    TAXY16(who) {
        this.TT16('regs.C', who);
    }

    TXYA8(who) {
        this.TT8(who, 'regs.C');
    }

    TXYA16(who) {
        this.TT16(who, 'regs.C');
    }

    TCS(E) {
        this.addl('regs.S = regs.C;');
        if (E) this.addl('regs.S = (regs.S & 0xFF) + 0x100;');
    }

    TSX8() {
        this.addl('regs.X  = regs.S & 0xFF;');
        this.setz('regs.X');
        this.setn8('regs.X');
    }

    TSX16() {
        this.TT16('regs.S', 'regs.X');
    }

    TXS8() {
        this.addl('regs.S = regs.X');
    }

    TXS16() {
        this.addl('regs.S = regs.X');
    }

    XCE() {
        this.addl('let TMP = regs.P.C; regs.P.C = regs.E; regs.E = TMP;');
        this.addl('if (regs.E) {');
        this.addl('    regs.P.X = regs.P.M = 1;');
        this.addl('    regs.X &= 0xFF;');
        this.addl('    regs.Y &= 0xFF;');
        this.addl('    regs.S = (regs.S & 0xFF) | 0x100;');
        this.addl('}');
    }

    XBA() {
        this.addl('regs.C = ((regs.C << 8) & 0xFF00) + ((regs.C >>> 8) & 0xFF);');
        this.setz('regs.C & 0xFF');
        this.setn8('regs.C & 0xFF');
    }

    // Emulated Set bits from P
    SEPE() {
        // M and X gotta stay 1
        this.addl('regs.P.setbyte_emulated(regs.P.getbyte_emulated() | regs.TR);');
    }

    // Emulated Clear bits from P
    REPE(regs) {
        // M and X gotta stay 1
        // regs.TR | 0x30

        // P                = 1010
        //Clear             = 0111
        //Desired result    = 1000
        //Reversed clear    = 1000
        //Anded             = 1000
        //                    success!
        this.addl('regs.P.setbyte_emulated(regs.P.getbyte_emulated() & (~(regs.TR | 0x30) & 0xFF));');
    }

    // Native Set bits from P
    SEPN() {
        this.addl('regs.P.setbyte_native(regs.P.getbyte_native() | regs.TR);');
        this.addl('if (regs.P.X) { regs.X &= 0xFF, regs.Y &= 0xFF; }');
    }

    // Native Clear bits from P
    REPN() {
        this.addl('regs.P.setbyte_native(regs.P.getbyte_native() & (~regs.TR & 0xFF));');
    }

    PULL8(what) {
        this.addl(what + ' = ((' + what + ') & 0xFF00) + (regs.TR & 0xFF);');
        this.setz('regs.TR');
        this.setn8('regs.TR');
    }

    PULL16(what) {
        this.addl(what + ' = regs.TR;');
        this.setz('regs.TR');
        this.setn16('regs.TR');
    }


    PUSH8(what) {
        this.addl('regs.TR = (' + what + ') & 0xFF;');
    }

    PUSH16(what) {
        this.addl('regs.TR = (' + what + ');');
    }

    PULLP(E) {
        if (E)
            this.addl('regs.P.setbyte_emulated(regs.TR);');
        else
            this.addl('regs.P.setbyte_native(regs.TR);');
        this.addl('if (regs.P.X) {');
        this.addl('    regs.X &= 0xFF;');
        this.addl('    regs.Y &= 0xFF;');
        this.addl('}');
    }

    PUSHP(E) {
        if (E)
            this.addl('regs.TR = regs.P.getbyte_emulated();');
        else
            this.addl('regs.TR = regs.P.getbyte_native();');
    }

    // These S_ ones implement all of the instruction here, there's no table-based thing
    S_RESET() {
        // This is basically an IRQ, except stack is read, not written
        // We can discard result of these reads
        // Cycle #2 also does not happen due to 6502 emulation mode being set.
        /*this.addcycle(2);
        this.RPDV(0, 0, 0, 0);*/
        this.addcycle(3);
        if (PINS_SEPERATE_PDV) {
            this.RPDV(0, 0, 1, 0);
        }
        else {
            this.addl('pins.RW = 0; pins.PDV = 1;');
        }
        this.addr_to_S_then_dec();

        this.addcycle(4);
        this.addr_to_S_then_dec();

        this.addcycle(5);
        this.addr_to_S_then_dec();

        this.addcycle(6);
        this.addr_to_S_then_dec();

        this.addcycle(7);
        if (PINS_SEPERATE_PDV) {
            this.RPDV(0, 0, 1, 1);
        }
        this.addr_to_ZB('0xFFFC');
        this.addl('regs.DBR = 0;');
        this.addl('regs.D = 0;');
        this.addl('regs.PBR = 0;');
        this.SETX8();
        this.SETM8();
        this.addl('regs.S = (regs.S & 0xFF) | 0x100;');
        this.addl('regs.E = 1;');
        this.addl('regs.P.M = regs.P.X = regs.P.I = regs.P.C = 1;');
        this.addl('regs.P.D = 0;');
        this.addl('regs.STP = regs.WAI = false;');

        this.addcycle(8);
        this.addl('regs.PC = pins.D;')
        this.addr_inc_unbound();

        this.cleanup();
        this.addl('regs.PC += (pins.D << 8);')
        if (!PINS_SEPERATE_PDV) {
            this.addl('pins.PDV = 1;');
        }
    }

    INTERRUPT(ins, E) {
        if (ins === WDC_OM.BRK || ins === WDC_OM.COP) {
            // Get Signature Byte. Not a thing for NMI, IRQ
            this.addcycle(2);
            this.RPDV(0, 1, 0, 0);
            this.addr_to_PC_then_inc();
        }
        // After an NMI or IRQ, an instruction fetch will have happened and PC been incremented.
        if (!E) {
            this.addcycle(3);
            if ((ins === WDC_OM.S_NMI) || (ins === WDC_OM.S_IRQ)) {
                this.addl('regs.TR = (regs.PC - 1) & 0xFFFF;');
            }
            else {
                this.addl('regs.TR = regs.PC;');
            }
            this.addr_to_S_then_dec();
            this.RPDV(1, 0, 1, 0);
            this.addl('pins.D = regs.PBR;');

            this.addcycle(4);
        }
        else {
            this.addcycle(4);
            if ((ins === WDC_OM.S_NMI) || (ins === WDC_OM.S_IRQ)) {
                this.addl('regs.TR = (regs.PC - 1) & 0xFFFF;');
            }
            else {
                this.addl('regs.TR = regs.PC;');
            }
            this.RPDV(1, 0, 1, 0);
        }
        this.addr_to_S_then_dec();
        this.D_to_TRH();

        this.addcycle(5);
        this.addr_to_S_then_dec();
        this.D_to_TRL();

        this.addcycle(6);
        this.addr_to_S_then_dec();
        if (E && ins === WDC_OM.BRK)
            this.addl('pins.D = regs.P.getbyte_emulated() | 8;'); // Set BRK bit
        else if (E)
            this.addl('pins.D = regs.P.getbyte_emulated() & 0xF7;'); // Clear BRK bit
        else
            this.addl('pins.D = regs.P.getbyte_native();');

        this.addcycle(7);
        let vector = get_vector(ins, E);
        this.addr_to_ZB(hex0x4(vector));
        this.RPDV(0, 0, 1, 1);

        this.addcycle(8);
        this.addr_to_ZB(hex0x4(vector+1));
        this.addl('regs.TA = pins.D;');
        this.addl('regs.PBR = 0;');

        this.cleanup();
        this.addl('regs.PC = (pins.D << 8) + regs.TA;');
    }

    S_NMI(E) {
        this.INTERRUPT(WDC_OM.S_NMI, E);
        this.addl('regs.P.I = 1;');
        this.addl('regs.P.D = 0;');
    }

    S_ABORT(E) {
        this.INTERRUPT(WDC_OM.S_ABORT, E);
    }

    S_IRQ(E) {
        this.INTERRUPT(WDC_OM.S_IRQ, E);
        this.addl('regs.P.I = 1;');
        this.addl('regs.P.D = 0;');
    }

    add_ins(ins, E, M, X, addrmode=null) {
        this.addl('// instruction code follows')
        switch(ins) {
            case WDC_OM.ADC:
                if (E || M)
                    this.ADC8();
                else
                    this.ADC16();
                break;
            case WDC_OM.AND:
                if (E || M)
                    this.AND8();
                else
                    this.AND16();
                break;
            case WDC_OM.ASL:
                if (E || M)
                    this.ASL8();
                else
                    this.ASL16();
                break;
            case WDC_OM.BIT:
                if (addrmode === WDC_AM.IMM) {
                    if (E || M)
                        this.BIT8IMM();
                    else
                        this.BIT16IMM();
                } else {
                    if (E || M)
                        this.BIT8();
                    else
                        this.BIT16();
                }
                break;
            case WDC_OM.COP:
            case WDC_OM.BRK:
                this.INTERRUPT(ins, E);
                break;
            case WDC_OM.CLC:
                this.addl('regs.P.C = 0;');
                break;
            case WDC_OM.CLD:
                this.addl('regs.P.D = 0;');
                break;
            case WDC_OM.CLI:
                this.addl('regs.P.I = 0;');
                break;
            case WDC_OM.CLV:
                this.addl('regs.P.V = 0;');
                break;
            case WDC_OM.CMP:
                if (E || M)
                    this.CMP8();
                else
                    this.CMP16();
                break;
            case WDC_OM.CPX:
                if (E || X)
                    this.CPX8();
                else
                    this.CPX16();
                break;
            case WDC_OM.CPY:
                if (E || X)
                    this.CPY8();
                else
                    this.CPY16();
                break;
            case WDC_OM.DEC:
                if (E || M)
                    this.DEXY8('regs.TR');
                else
                    this.DEXY16('regs.TR');
                break;
            case WDC_OM.DEX:
                if (E || X)
                    this.DEXY8('regs.X');
                else
                    this.DEXY16('regs.X');
                break;
            case WDC_OM.DEY:
                if (E || X)
                    this.DEXY8('regs.Y');
                else
                    this.DEXY16('regs.Y');
                break;
            case WDC_OM.EOR:
                if (E || M)
                    this.EOR8();
                else
                    this.EOR16();
                break;
            case WDC_OM.INC:
                if (E || M)
                    this.INXY8('regs.TR');
                else
                    this.INXY16('regs.TR');
                break;
            case WDC_OM.INX:
                if (E || X)
                    this.INXY8('regs.X');
                else
                    this.INXY16('regs.X');
                break;
            case WDC_OM.INY:
                if (E || X)
                    this.INXY8('regs.Y');
                else
                    this.INXY16('regs.Y');
                break;
            case WDC_OM.JSL:
                console.log("Wait whats up with JSL?");
                //debugger;
                break;
            case WDC_OM.LDA:
                if (E || M)
                    this.LDA8();
                else
                    this.LDA16();
                break;
            case WDC_OM.LDX:
                if (E || X)
                    this.LDXY8('regs.X');
                else
                    this.LDXY16('regs.X');
                break;
            case WDC_OM.LDY:
                if (E || X)
                    this.LDXY8('regs.Y');
                else
                    this.LDXY16('regs.Y');
                break;
            case WDC_OM.LSR:
                if (E || M)
                    this.LSR8();
                else
                    this.LSR16();
                break;
            case WDC_OM.NOP:
                break;
            case WDC_OM.ORA:
                if (E || M)
                    this.ORA8();
                else
                    this.ORA16();
                break;
            case WDC_OM.PHA:
                if (E || M)
                    this.PUSH8('regs.C');
                else
                    this.PUSH16('regs.C');
                break;
            case WDC_OM.PHB:
                this.PUSH8('regs.DBR');
                break;
            case WDC_OM.PHD:
                this.PUSH16('regs.D');
                break;
            case WDC_OM.PHK:
                this.PUSH8('regs.PBR');
                break;
            case WDC_OM.PHP:
                this.PUSHP(E);
                break;
            case WDC_OM.PHX:
                if (E || X)
                    this.PUSH8('regs.X');
                else
                    this.PUSH16('regs.X');
                break;
            case WDC_OM.PHY:
                if (E || X)
                    this.PUSH8('regs.Y');
                else
                    this.PUSH16('regs.Y');
                break;
            case WDC_OM.PLA:
                if (E || M)
                    this.PULL8('regs.C');
                else
                    this.PULL16('regs.C');
                break;
            case WDC_OM.PLB:
                this.PULL8('regs.DBR');
                break;
            case WDC_OM.PLD:
                this.PULL16('regs.D');
                break;
            case WDC_OM.PLP:
                this.PULLP(E);
                break;
            case WDC_OM.PLX:
                if (E || X)
                    this.PULL8('regs.X');
                else
                    this.PULL16('regs.X');
                break;
            case WDC_OM.PLY:
                if (E || X)
                    this.PULL8('regs.Y');
                else
                    this.PULL16('regs.Y');
                break;
            case WDC_OM.REP:
                if (E)
                    this.REPE();
                else
                    this.REPN();
                break;
            case WDC_OM.ROL:
                if (E || M)
                    this.ROL8();
                else
                    this.ROL16();
                break;
            case WDC_OM.ROR:
                if (E || M)
                    this.ROR8();
                else
                    this.ROR16();
                break;
            case WDC_OM.SBC:
                if (E || M)
                    this.SBC8();
                else
                    this.SBC16();
                break;
            case WDC_OM.SEC:
                this.addl('regs.P.C = 1;');
                break;
            case WDC_OM.SED:
                this.addl('regs.P.D = 1;');
                break;
            case WDC_OM.SEI:
                this.addl('regs.P.I = 1;');
                break;
            case WDC_OM.SEP:
                if (E)
                    this.SEPE();
                else
                    this.SEPN();
                break;
            case WDC_OM.STA: // hmmm???
                this.addl('// #STA')
                if (E || M)
                    this.addl('regs.TR = regs.C & 0xFF;');
                else
                    this.addl('regs.TR = regs.C;');
                break;
            case WDC_OM.STX: // hmm...
                if (E || X)
                    this.addl('regs.TR = regs.X & 0xFF;');
                else
                    this.addl('regs.TR = regs.X;');
                break;
            case WDC_OM.STY:
                if (E || X)
                    this.addl('regs.TR = regs.Y & 0xFF;');
                else
                    this.addl('regs.TR = regs.Y;');
                break;
            case WDC_OM.STZ: // really?
                this.addl('regs.TR = 0;');
                break;
            // Flag sets
            case WDC_OM.TAX: // Transfer A->X
                if (E || X)
                    this.TAXY8('regs.X');
                else
                    this.TAXY16('regs.X')
                break;
            case WDC_OM.TAY:
                if (E || X)
                    this.TAXY8('regs.Y');
                else
                    this.TAXY16('regs.Y');
                break;
            case WDC_OM.TCD:
                this.TAXY16('regs.D');
                break;
            case WDC_OM.TCS:
                this.TCS(E);
                break;
            case WDC_OM.TDC:
                this.TXYA16('regs.D');
                break;
            case WDC_OM.TRB:
                if (E || M)
                    this.TRB8();
                else
                    this.TRB16();
                break;
            case WDC_OM.TSC:
                this.TXYA16('regs.S');
                break;
            case WDC_OM.TSB:
                if (E || M)
                    this.TSB8();
                else
                    this.TSB16();
                break;
            case WDC_OM.TSX:
                if (E || X)
                    this.TSX8()
                else
                    this.TSX16();
                break;
            case WDC_OM.TXA:
                if (E || M)
                    this.TXYA8('regs.X');
                else
                    this.TXYA16('regs.X');
                break;
            case WDC_OM.TXS:
                if (E || X)
                    this.TXS8();
                else
                    this.TXS16();
                break;
            case WDC_OM.TXY:
                if (E || X)
                    this.TT8('regs.X', 'regs.Y');
                else
                    this.TT16('regs.X', 'regs.Y');
                break;
            case WDC_OM.TYA:
                if (E || M)
                    this.TXYA8('regs.Y');
                else
                    this.TXYA16('regs.Y');
                break;
            case WDC_OM.TYX:
                if (E || X)
                    this.TT8('regs.Y', 'regs.X');
                else
                    this.TT16('regs.Y', 'regs.X');
                break;
            case WDC_OM.XBA:
                this.XBA();
                break;
            case WDC_OM.XCE:
                this.XCE();
                break;
            case WDC_OM.STP:
            case WDC_OM.WAI:
            case WDC_OM.WDM:
                break;
            default:
                console.log('UNKNOWN INSTRUCTION REQUESTED ' + ins);
                break;
        }
        this.addl('// instruction code ends')
    }

    RPDV(W, P, D, V) {
        if (PINS_SEPERATE_PDV) {
            this.addl('pins.RW = ' + W + "; pins.VPA = " + P + "; pins.VDA = " + D + "; pins.VPB = " + V + ";");
        } else {
            let do_W = W !== this.old_rw;
            let PDV = +(P || D);
            let do_PDV = PDV !== this.old_pdv;
            if (do_W && do_PDV) {
                this.addl('pins.RW = ' + W + '; pins.PDV = ' + PDV + ';');
            }
            else if (do_W) {
                this.addl('pins.RW = ' + W + ';');
            }
            else if (do_PDV) {
                this.addl('pins.PDV = ' + PDV + ';');
            }
            this.old_rw = W;
            this.old_pdv = PDV;
        }
    }

}


function A_R_OR_W(ins) {
    return +(!WDC_A_R_INS.has(ins));
}

class generate_instruction_function_return {
    constructor(strout, E, M, X, aE, aM, aX, aD) {
        this.strout = strout;
        this.E = E;
        this.M = M;
        this.X = X;
        this.affected_by_E = aE;
        this.affected_by_M = aM;
        this.affected_by_X = aX;
        this.affected_by_D = aD;
    }
}

function generate_instruction_function(indent, opcode_info, E, M, X) {
    let affected_by_E = false;
    let affected_by_M = false;
    let affected_by_X = false;
    let affected_by_D = false;
    let indent2 = indent + '    ';
    let ag = new switchgen(indent2,'regs.TCU')
    let mem16 = false;
    let RW = 0;

    let fetch_D0_and_skip_cycle = function() {
            ag.addcycle('fetch_D0_and_skip_cycle 2');
            ag.addr_to_PC_then_inc();
            ag.RPDV(0, 1, 0, 0);
            ag.addl('regs.skipped_cycle = false;');
            ag.addl('if ((regs.D & 0xFF) === 0) { regs.skipped_cycle = true; regs.TCU++; }');

            ag.addcycle('fetch_D0_and_skip_cycle 2a');
            ag.addl('regs.TA = pins.D;');
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle('fetch_D0_and_skip_cycle 3');
            ag.addl('if (regs.skipped_cycle) {');
            ag.addl('    regs.TA = pins.D;');
            if (PINS_SEPERATE_PDV)
                ag.addl('    pins.VDA = 0; pins.VPA = 0; pins.VPB = 0; pins.RW = 0;');
            else
                ag.addl('    pins.PDV = 0;');
            ag.addl('}');
    }

    // Function to do a variable-sized fetch in middle of RMW
    let fetch_rmw_8or16 = function(ZB = false) {
        if (mem16) {
            ag.addcycle('fetch_rmw_8or16 16L');
            ag.addl('regs.TR = pins.D;');
            if (ZB)
                ag.addr_inc();
            else
                ag.addr_inc_unbound();

            ag.addcycle('fetch_rmw_8or16 16H');
            ag.addl('regs.TR += pins.D << 8;');
        }
        else {
            ag.addcycle('fetch_rmw_8or16 8');
            ag.addl('regs.TR = pins.D;');
        }
        if (E) ag.RPDV(1, 0, 0, 0);
        else   ag.RPDV(0, 0, 0, 0);
    };

    // Function to finish up Read-Modify-Write instructions
    let finish_rmw = function(ZB=false) {
        ag.add_ins(opcode_info.ins, E, M, X);
        if (mem16) {
            ag.addcycle('finish_rmw mem16 H');
            ag.RPDV(1, 0, 1, 0);
            ag.D_to_TRH();

            ag.addcycle('finish_rmw mem16 L');
            if (ZB)
                ag.addr_dec();
            else
                ag.addr_dec_unbound();
        }
        else {
            ag.addcycle('finish_rmw mem8');
            ag.RPDV(1, 0, 1, 0);
        }
        ag.D_to_TRL();
    }

    let finish_R16p = function(use_PC, ZB=false, addrmode=null) {
        if (mem16) {
            ag.addcycle('finish_R16p');
            ag.addl('regs.TR = pins.D;');
            if (use_PC)
                ag.addr_to_PC_then_inc();
            else {
                if (ZB)
                    ag.addr_inc();
                else
                    ag.addr_inc_unbound();
            }

            ag.cleanup();
            ag.addl('regs.TR += pins.D << 8;');
        }
        else {
            ag.cleanup();
            ag.addl('regs.TR = pins.D;')
        }
        ag.add_ins(opcode_info.ins, E, M, X, addrmode);
    }

    let finish_RW8or16p = function(ZB= false) {
        // For many instructions that can read OR write either 8 or 16 bits of data,
        //  this is the last step to write them out.
        ag.RPDV(RW, 0, 1, 0);
        if (RW === 0) {
            finish_R16p(false, ZB);
        }
        else {
            ag.add_ins(opcode_info.ins, E, M, X);
            ag.D_to_TRL();
            if (mem16) {
                ag.addcycle('finish_RW8or16p W16H');
                if (ZB)
                    ag.addr_inc();
                else
                    ag.addr_inc_unbound();
                ag.D_to_TRH();
            }
        }
    }

    // Set for many read-modify-write style instructions
    let set_em16rmw = function() {
        affected_by_E = true;
        affected_by_M = true;
        mem16 = !(E | M);
    }

    let setstackmem = function() {
        affected_by_E = WDC_STACK_M.has(opcode_info.ins) || WDC_STACK_X.has(opcode_info.ins);
        affected_by_M = WDC_STACK_M.has(opcode_info.ins);
        affected_by_X = WDC_STACK_X.has(opcode_info.ins);
        mem16 = false;
        if (!X && WDC_STACK_X.has(opcode_info.ins)) mem16 = true;
        if (!M && WDC_STACK_M.has(opcode_info.ins)) mem16 = true;
        if (WDC_STACK_16.has(opcode_info.ins)) mem16 = true;
    }

    // Set for many instructions that can read or write and change mem size based on different
    //  flags
    let set_exm16rw = function() {
        affected_by_E = true;
        affected_by_X = WDC_A_OR_M_X.has(opcode_info.ins);
        affected_by_M = !affected_by_X;
        if ((affected_by_X && !X) || (affected_by_M && !M))
            mem16 = true;
        if (E)
            mem16 = false;
        RW = A_R_OR_W(opcode_info.ins);
    };

    let RMW_indexed = function(who) {
        set_exm16rw();

        ag.addcycle(2);
        ag.RPDV(0, 1, 0, 0);
        ag.addr_to_PC_then_inc();

        ag.addcycle(3);
        ag.addl('regs.TA = pins.D;');
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
        ag.addl('regs.skipped_cycle = false;');
        if ((RW === 0) && ((X === 1) || (E === 1))) {
            ag.addl('regs.TR = regs.TA + ((' + who + ') & 0xFF);');
            ag.addl('if (regs.TR < 0x100) { regs.skipped_cycle = true; regs.TCU++; } ') // Skip cycle
        }
        ag.addcycle('3a');
        ag.RPDV(0, 0, 0, 0);
        //'((pins.D << 8) + regs.TA + who) & 0xFFFF'
        ag.addl('regs.TR = regs.DBR;')
        ag.addl('regs.TA += pins.D << 8');
        //
        ag.addr_to_DBR('(pins.D << 8) + (regs.TA + (' + who + ' ) & 0xFF)');

        ag.addcycle(4);
        ag.addl('if (regs.skipped_cycle) regs.TA += pins.D << 8;');
        ag.addl('regs.TA += (' + who + ')');
        ag.addl('regs.TR = regs.DBR;');
        ag.addl('if (regs.TA > 0xFFFF) { regs.TA -= 0x10000; regs.TR = (regs.TR + 1) & 0xFF; }');
        ag.addr_to('regs.TA', 'regs.TR');
        finish_RW8or16p();
    };

    ag.addl('// ' + opcode_info.mnemonic + ' E=' + E + " M=" + M + " X=" + X);
    affected_by_D = ((opcode_info.ins === WDC_OM.ADC) || (opcode_info.ins === WDC_OM.SBC));
    switch(opcode_info.addr_mode) {
        case WDC_AM.A:
            set_exm16rw();
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addr_to_DBR('regs.TA + (pins.D << 8)');
            finish_RW8or16p();
            break; // AM.A absolute Af
        case WDC_AM.Ab: // JMP a
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.cleanup();
            ag.addl('regs.PC = (pins.D << 8) + regs.TA;');
            break;
        case WDC_AM.Ac: // JSR a
            affected_by_E = true;
            ag.get_TA_from_PC();
            ag.RPDV(0, 0, 0, 0)
            ag.addcycle(5);
            ag.RPDV(1, 0, 1, 0);
            ag.addl('regs.TR = (regs.PC - 1) & 0xFFFF');
            ag.push_H('regs.TR');
            ag.addcycle(6);
            ag.push_L('regs.TR');
            ag.addl('regs.PC = regs.TA;');
            break;
        case WDC_AM.Ad: // Abslute a R-M-W
            ag.addl('//case AM.Ad')
            set_em16rmw();

            ag.get_TA_from_PC();
            ag.addr_to_DBR('regs.TA');
            fetch_rmw_8or16();

            finish_rmw();
            break;
        case WDC_AM.A_INDEXED_IND:
            // JMP (a,x)
            ag.get_TA_from_PC(); // 1-3
            ag.addl('regs.TA = (regs.X + regs.TA) & 0xFFFF;');
            ag.RPDV(0, 0, 0, 0);
            // used to be get_TA_from_PC() or something
            ag.addcycle();
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_ta_pbr();
            ag.addcycle();
            ag.addl('regs.TR = pins.D;')
            ag.addr_inc_unbound();
            ag.cleanup();
            ag.addl('regs.PC = regs.TR + (pins.D << 8);');
            break;
        case WDC_AM.A_INDEXED_INDb: // JSR (a,x)
            // This one is REALLY FUNKY
            // Can't really do a lot of automatic code here
            affected_by_E = true;
            ag.addcycle(2); // 2 PBR, PC+1 -> AAL
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3); // 3 0,S <- PCH
            ag.RPDV(1, 0, 1, 0);
            ag.addl('regs.TA = pins.D;');
            ag.push_H('regs.PC');

            ag.addcycle(4); // 4 0,S-1 <- PCL
            ag.push_L('regs.PC');

            ag.addcycle(5); // 5 PBR, PC+2 -> AAH
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(6); // 6 PBR, PC+2  IO (grab AAH)
            ag.RPDV(0, 0, 0, 0);
            ag.addl('regs.TA = (regs.TA + regs.X + (pins.D << 8)) & 0xFFFF;');

            ag.addcycle(7); // 7 PBR, AA+X
            ag.RPDV(0, 1, 0, 0);
            ag.addl('pins.Addr = regs.TA;');

            ag.addcycle(8); // 8 PBR, AA+X+1 <- PCL
            ag.addl('pins.Addr = (pins.Addr + 1) & 0xFFFF;');
            ag.addl('regs.PC = pins.D;');

            ag.cleanup();
            ag.addl('regs.PC += (pins.D << 8);')
            break;
        case WDC_AM.A_IND: // JML (a)
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);// capture AAL
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4); // capture AAH, start PCL fetch
            ag.RPDV(0, 0, 1, 0);
            ag.addl('pins.Addr = regs.TA + (pins.D << 8); pins.BA = 0;');

            ag.addcycle(5); // 4 capture PCL
            ag.addl('regs.TR = pins.D;');
            ag.addl('pins.Addr = (pins.Addr + 1) & 0xFFFF;');

            ag.addcycle(6); // 5 capture PCH
            ag.addl('regs.PC = regs.TR + (pins.D << 8);');
            ag.addl('pins.Addr = (pins.Addr + 1) & 0xFFFF;');

            ag.cleanup();
            ag.addl('regs.PBR = pins.D;');
            break;
        case WDC_AM.A_INDb: // JMP (a)
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('regs.TA + (pins.D << 8)');

            ag.addcycle(5);
            ag.addl('regs.TR = pins.D;');
            ag.addr_inc_unbound();

            ag.cleanup();
            ag.addl('regs.PC = regs.TR + (pins.D << 8);');
            break;
        case WDC_AM.AL:
            set_exm16rw();
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addl('regs.TA += pins.D << 8;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(5);
            ag.addr_to('regs.TA', 'pins.D');
            ag.RPDV(RW, 0, 1, 0);
            if (RW === 0) { // Doing a read
                if (mem16) {
                    ag.addcycle('5a');
                    ag.addl('regs.TR = pins.D;');
                    ag.addr_inc_unbound();

                    ag.cleanup();
                    ag.addl('regs.TR += (pins. D & 0xFF) << 8;');
                    ag.add_ins(opcode_info.ins, E, M, X);
                }
                else {
                    ag.cleanup();
                    ag.addl('regs.TR = pins.D;')
                    ag.add_ins(opcode_info.ins, E, M, X);
                }
            }
            else { // Doing a write
                ag.add_ins(opcode_info.ins, E, M, X);
                ag.D_to_TRL();
                if (mem16) {
                    ag.addcycle('5a');
                    ag.addr_inc_unbound();
                    ag.D_to_TRH();
                }
            }
            break;
        case WDC_AM.ALb: // JMP
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addr_to_PC();
            ag.addl('regs.PC = regs.TA + (pins.D << 8);');

            ag.cleanup();
            ag.addl('regs.PBR = pins.D;');
            break;
        case WDC_AM.ALc: // JSL al
            affected_by_E = true;
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.RPDV(1, 0, 1, 0);
            ag.addl('regs.TA += pins.D << 8;');
            ag.push_L('regs.PBR', true);

            ag.addcycle(5);
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(6);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(7);
            ag.addl('regs.PBR = pins.D;');
            ag.RPDV(1, 0, 1, 0);
            ag.addl('regs.TR = (regs.PC - 1) & 0xFFFF;');
            ag.push_H('regs.TR');

            ag.addcycle(8);
            ag.push_L('regs.TR');
            ag.addl('regs.PC = regs.TA;')
            break;
        case WDC_AM.AL_INDEXED_X:
            set_exm16rw();
            ag.addcycle(2); // LD AAL
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3); // LD AAH
            ag.addl('regs.TA = pins.D');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4); // LD AAB
            ag.addl('regs.TA += pins.D << 8;')
            ag.addr_to_PC_then_inc();

            ag.addcycle(5); // capture AAB
            ag.addl('regs.TA += (pins.D << 16) + regs.X;');
            ag.addr_to('regs.TA & 0xFFFF', '(regs.TA >>> 16) & 0xFF');
            finish_RW8or16p();
            break;
        case WDC_AM.A_INDEXED_X:
            RMW_indexed('regs.X');
            break;
        case WDC_AM.A_INDEXED_Xb: // R-M-W a,x  6b
            set_em16rmw();
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D;')
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.RPDV(0, 0, 0, 0);
            ag.addl('regs.TR = regs.DBR;')
            ag.addl('regs.TA += (pins.D << 8) + regs.X;');
            ag.addl('if (regs.TA > 0xFFFF) { regs.TA -= 0x10000; regs.TR = (regs.TR + 1) & 0xFF; }');
            ag.addr_to_DBR('(pins.D << 8) + (regs.TA & 0xFF)');

            ag.addcycle(5);
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to('regs.TA', 'regs.TR');

            if (mem16) {
                ag.addcycle('5a');
                ag.addl('regs.TR = pins.D;');
                ag.addr_inc_unbound();
            }

            ag.addcycle(6);
            if (E) ag.RPDV(1, 0, 0, 0);
            else   ag.RPDV(0, 0, 0, 0);
            if (mem16) ag.addl('regs.TR += pins.D << 8;');
            else       ag.addl('regs.TR = pins.D;')

            finish_rmw();
            break;
        case WDC_AM.A_INDEXED_Y:
            RMW_indexed('regs.Y');
            break;
        case WDC_AM.ACCUM:
            affected_by_E = affected_by_M = true;
            ag.addcycle(2);
            ag.addr_to_PC();
            ag.RPDV(0, 0, 0, 0);
            if (M|E) ag.addl('regs.TR = regs.C & 0xFF;');
            else     ag.addl('regs.TR = regs.C;');
            ag.add_ins(opcode_info.ins, E, M, X);
            if (M|E) ag.addl('regs.C = (regs.C & 0xFF00) | (regs.TR & 0x00FF);');
            else     ag.addl('regs.C = regs.TR & 0xFFFF;');
            break;
        case WDC_AM.XYC: // MVN
            affected_by_X = affected_by_E = true;
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.DBR = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to('(regs.X + regs.MD) & 0xFFFF', 'regs.TA');
            ag.RPDV(0, 0, 1, 0);

            ag.addcycle(5);
            ag.RPDV(1, 0, 1, 0);
            ag.addr_to('(regs.Y + regs.MD) & 0xFFFF', 'regs.DBR');

            ag.addcycle(6);
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(7);

            ag.addl('regs.C = (regs.C - 1) & 0xFFFF;');
            if (X) {
                ag.addl('regs.X = (regs.X + 1) & 0xFF;');
                ag.addl('regs.Y = (regs.Y + 1) & 0xFF;');
            }
            else {
                ag.addl('regs.X = (regs.X + 1) & 0xFFFF;');
                ag.addl('regs.Y = (regs.Y + 1) & 0xFFFF;');
            }
            ag.addl('if (regs.C !== 0xFFFF) regs.PC = (regs.PC - 3) & 0xFFFF;');
            break;
        case WDC_AM.XYCb: // MVP
            affected_by_X = affected_by_E = true;
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.DBR = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.addl('regs.TA = pins.D');
            ag.addr_to('regs.X', 'regs.TA');
            ag.RPDV(0, 0, 1, 0);

            ag.addcycle(5);
            ag.RPDV(1, 0, 1, 0);
            ag.addr_to('regs.Y', 'regs.DBR');

            ag.addcycle(6);
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(7);

            ag.cleanup();
            ag.addl('regs.C = (regs.C - 1) & 0xFFFF;');
            if (X) {
                ag.addl('regs.X = (regs.X - 1) & 0xFF;');
                ag.addl('regs.Y = (regs.Y - 1) & 0xFF;');
            }
            else {
                ag.addl('regs.X = (regs.X - 1) & 0xFFFF;');
                ag.addl('regs.Y = (regs.Y - 1) & 0xFFFF;');
            }
            ag.addl('if (regs.C !== 0xFFFF) regs.PC = (regs.PC - 3) & 0xFFFF;');
            break;
        case WDC_AM.D:
            set_exm16rw();

            fetch_D0_and_skip_cycle();
            ag.addr_to_ZB('(regs.D + pins.D) & 0xFFFF');

            finish_RW8or16p(true);
            break;
        case WDC_AM.Db:
            // R-M-W direct
            set_em16rmw();

            fetch_D0_and_skip_cycle();
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('(regs.TA + regs.D) & 0xFFFF');

            fetch_rmw_8or16(true);

            finish_rmw(true);
            break;
        case WDC_AM.D_INDEXED_IND: // (d,x)
            set_exm16rw();

            fetch_D0_and_skip_cycle();

            ag.RPDV(0, 0, 0, 0);
            ag.addl('regs.TA = (regs.TA + regs.D + regs.X) & 0xFFFF;');

            ag.addcycle(4);
            ag.addr_to_ZB('regs.TA');
            ag.RPDV(0, 0, 1, 0);

            ag.addcycle(5);
            ag.addl('regs.TA = pins.D;');
            ag.addr_inc();

            ag.addcycle(6);
            ag.addr_to_DBR('regs.TA + (pins.D << 8)');
            finish_RW8or16p();
            break;
        case WDC_AM.D_IND: // "Direct indirect" (d)
            set_exm16rw();
            fetch_D0_and_skip_cycle();
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('(regs.D + regs.TA) & 0xFFFF');

            ag.addcycle(4);
            ag.addl('regs.TA = pins.D;')
            ag.addr_inc();

            ag.addcycle(5);

            ag.addr_to_DBR('(regs.TA + (pins.D << 8))');
            finish_RW8or16p();
            break;
        case WDC_AM.D_IND_INDEXED: // (d), y
            set_exm16rw();
            fetch_D0_and_skip_cycle();
            // Check into RMW_indexed
            // We're on cycle #3 now, DO is in regs.TA
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('(regs.D + regs.TA) & 0xFFFF');

            ag.addcycle(4);
            ag.addl('regs.TA = pins.D;')
            ag.addr_inc();

            // So, decide whether to skip cycle 4a
            // We add cycle if
            //  write
            //  X=0
            //  index across page boundaries

            // We skip it if:
            //  We're doing a read
            //  X=1 or emulation mode
            // But we DO NOT skip it if:
            //  we index across a page boundary
            ag.addl('regs.skipped_cycle = false;');
            ag.addl('regs.TR = regs.TA + (regs.Y & 0xFF);')
            if ((RW === 0) && ((X === 1) || (E === 1))) {
                ag.addl('if (regs.TR < 0x100) { regs.skipped_cycle = true; regs.TCU++; }')
            }

            ag.addcycle('4a');
            ag.addl('regs.TA += pins.D << 8;');
            ag.addl('pins.Addr = (pins.D << 8) + (regs.TR & 0xFF); pins.BA = regs.DBR;');
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(5);
            ag.addl('if (regs.skipped_cycle) regs.TA += pins.D << 8;')
            ag.addl('regs.TR = regs.DBR;')
            ag.addl('regs.TA += regs.Y;')
            ag.addl('if (regs.TA > 0xFFFF) { regs.TA -= 0x10000; regs.TR = (regs.TR + 1) & 0xFF; }')
            ag.addr_to('regs.TA', 'regs.TR');
            finish_RW8or16p();
            break;
        case WDC_AM.D_IND_L_INDEXED: // [d], y
            set_exm16rw();
            fetch_D0_and_skip_cycle();

            // We're in cycle #3 at this point
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('(regs.D + regs.TA) & 0xFFFF');

            ag.addcycle(4);
            ag.addl('regs.TA = pins.D;')
            ag.addr_inc();

            ag.addcycle(5);
            ag.addl('regs.TA = (regs.TA + (pins.D << 8) + regs.Y);');
            ag.addr_inc();

            ag.addcycle(6);
            ag.addl('regs.TR = pins.D;');
            ag.addl('if (regs.TA >= 0x10000) { regs.TA -= 0x10000; regs.TR = (regs.TR + 1) & 0xFF; }');
            ag.addr_to('regs.TA', 'regs.TR');
            finish_RW8or16p();
            break;
        case WDC_AM.D_IND_L: // [d]
            set_exm16rw();
            fetch_D0_and_skip_cycle();

            // Remember we're picking up in cycle 3
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('regs.D + regs.TA & 0xFFFF')

            ag.addcycle(4);
            ag.addl('regs.TA = pins.D;');
            ag.addr_inc_unbound();

            ag.addcycle(5);
            ag.addl('regs.TA += pins.D << 8;');
            ag.addr_inc_unbound();

            ag.addcycle(6);
            ag.addl('regs.TR = pins.D;');
            ag.addl('if (regs.TA > 0x10000) { regs.TA -= 0x10000; regs.TR = (regs.TR + 1) & 0xFF; }')
            ag.addr_to('regs.TA', 'regs.TR');
            finish_RW8or16p();
            break;
        case WDC_AM.D_INDEXED_X: // d,x
            set_exm16rw();
            fetch_D0_and_skip_cycle();

            // coming into in 3rd cycle...which is an IO cycle
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(4);
            if (E)
                ag.addr_to_ZB('(regs.TA + regs.X + regs.D) & 0xFF');
            else
                ag.addr_to_ZB('(regs.TA + regs.X + regs.D) & 0xFFFF');
            finish_RW8or16p(true);
            break;
        case WDC_AM.D_INDEXED_Xb: // d,x RMWs
            set_em16rmw();
            fetch_D0_and_skip_cycle();

            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(4);
            ag.RPDV(0, 0, 1, 0);
            if (E)
                ag.addr_to_ZB('(regs.TA + regs.X + regs.D) & 0xFF');
            else
                ag.addr_to_ZB('(regs.TA + regs.X + regs.D) & 0xFFFF');
            fetch_rmw_8or16(true);
            finish_rmw(true);
            break;
        case WDC_AM.D_INDEXED_Y:
            set_exm16rw();
            fetch_D0_and_skip_cycle();
            ag.RPDV(0, 0, 0, 0);
            ag.addcycle(4);
            if (E)
                ag.addr_to_ZB('(regs.TA + regs.Y + regs.D) & 0xFF');
            else
                ag.addr_to_ZB('(regs.TA + regs.Y + regs.D) & 0xFFFF');
            finish_RW8or16p(true);
            break;
        case WDC_AM.IMM:
            set_exm16rw();
            ag.addcycle('2');
            ag.RPDV(0,1,0,0);
            ag.addr_to_PC_then_inc();

            finish_R16p(true, false, WDC_AM.IMM);
            break;
        case WDC_AM.IMMb: // REP, SEP
            ag.addcycle('2');
            ag.RPDV(0,1,0,0);
            ag.addr_to_PC_then_inc();
            ag.addcycle('2a for REP/SEP');
            ag.addl('regs.TR = pins.D;');
            ag.RPDV(0, 0, 0, 0);
            ag.cleanup();
            ag.add_ins(opcode_info.ins, E, M, X);
            break
        case WDC_AM.I:
            ag.addcycle(2);
            //ag.addr_to_PC_then_inc();
            ag.RPDV(0, 0, 0, 0);
            if (opcode_info.ins === WDC_OM.WDM) {
                ag.addr_to_PC_then_inc();
            }
            else {
                ag.addr_to_PC();
            }
            ag.add_ins(opcode_info.ins, E, M, X);
            ag.cleanup();
            break;
        case WDC_AM.Ib:
            ag.addcycle();
            ag.RPDV(0, 0, 0, 0);
            ag.addr_to_PC();
            ag.addcycle();
            ag.cleanup();
            ag.add_ins(opcode_info.ins, E, M, X);
            break;
        case WDC_AM.Ic: // STP
            ag.addcycle(2);
            ag.addr_to_PC();
            ag.RPDV(0, 0, 0, 0);
            ag.addcycle(3);
            ag.no_modify_RPDV();
            ag.no_modify_addr();
            ag.cleanup();
            ag.addl('regs.STP = true;');
            break;
        case WDC_AM.Id: // WAI
            ag.addcycle(2);
            ag.addr_to_PC();
            ag.RPDV(0, 0, 0, 0);
            ag.addl('if (!regs.IRQ_pending && !regs.NMI_pending) regs.TCU--;')
            ag.addcycle(3);
            ag.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
            break;
        case WDC_AM.Ie: // SEI, CLI
            ag.addcycle(2);
            ag.RPDV(0, 0, 0, 0);
            ag.addr_to_PC();
            ag.cleanup();
            ag.add_ins(opcode_info.ins, E, M, X);
            break;
        case WDC_AM.PC_R:
            // +1 if branch taken
            // +1 if branch taken across page boundaries in emulation mode
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            switch(opcode_info.ins) {
                case WDC_OM.BCC: // Branch if carry clear
                    ag.addl('regs.TR = regs.P.C === 0;');
                    break;
                case WDC_OM.BCS: // Branch if carry set
                    ag.addl('regs.TR = regs.P.C === 1;');
                    break;
                case WDC_OM.BEQ: // Branch if zero flag set
                    ag.addl('regs.TR = regs.P.Z === 1;');
                    break;
                case WDC_OM.BNE: // Branch if zero flag clear
                    ag.addl('regs.TR = regs.P.Z === 0;');
                    break;
                case WDC_OM.BPL: // Branch if negative flag clear
                    ag.addl('regs.TR = regs.P.N === 0;');
                    break;
                case WDC_OM.BRA:
                    ag.addl('regs.TR = true;');
                    break;
                case WDC_OM.BMI: // Branch if negative flag set
                    ag.addl('regs.TR = regs.P.N === 1;');
                    break;
                case WDC_OM.BVS: // Branch if overflow set
                    ag.addl('regs.TR = regs.P.V === 1;');
                    break;
                case WDC_OM.BVC: // Branch if overflow clear
                    ag.addl('regs.TR = regs.P.V === 0;');
                    break;
            }

            ag.addl('regs.skipped_cycle = 0;')
            // Technically this is supposed to be skip if E and branch across page boundary
            // BUT
            // This is the one place it was too huge a pain to add perfect accuracy FOR RIGHT NOW
            // It can certainly be added by making specialized versions of this function
            if (!E) ag.addl('regs.TCU++; regs.skipped_cycle++;           // skip cycle for no E')
            ag.addl('if (!regs.TR) { regs.TCU++; regs.skipped_cycle++; } // skip cycle if NOT taken');

            ag.addcycle('2a');
            ag.addl('regs.TA = pins.D;');
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle('2b');
            if (PINS_SEPERATE_PDV) {
                ag.addl('if (regs.skipped_cycle === 1) { regs.TA = pins.D; pins.RW = 0; pins.VPA = 0; pins.VDA = 0; }');
            } else {
                ag.addl('if (regs.skipped_cycle === 1) { regs.TA = pins.D; pins.RW = 0; pins.PDV = 0; } ');
                ag.old_rw = 0; ag.old_pdv = 0;
            }

            ag.cleanup();
            if (PINS_SEPERATE_PDV) {
                ag.addl('if (regs.skipped_cycle === 2) { regs.TA = pins.D; pins.RW = 0; pins.VPA = 0; pins.VDA = 0; }');
            } else {
                ag.addl('if (regs.skipped_cycle === 2) { regs.TA = pins.D; pins.RW = 0; pins.PDV = 0; } ');
                ag.old_rw = 0; ag.old_pdv = 0;
            }
            ag.addl('if (regs.TR) regs.PC = (regs.PC + mksigned8(regs.TA)) & 0xFFFF;');
            break;
        case WDC_AM.PC_RL:
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.RPDV(0, 0, 0, 0);
            ag.addl('regs.TA = mksigned16(regs.TA + (pins.D << 8));');
            ag.addl('regs.PC = (regs.PC + regs.TA) & 0xFFFF;');
            break;
        case WDC_AM.STACK:
            switch(opcode_info.ins) {
                case WDC_OM.S_RESET:
                    ag.S_RESET();
                    break;
                case WDC_OM.S_NMI:
                    ag.S_NMI(E);
                    break;
                case WDC_OM.S_IRQ:
                    ag.S_IRQ(E);
                    break;
                case WDC_OM.S_ABORT:
                    ag.S_ABORT(E);
                    break;
            }
            break;
        case WDC_AM.STACKb: // Pulls
            setstackmem();
            affected_by_E = (opcode_info.ins === WDC_OM.PLD);
            // PLA, X, Y is 8 or 16
            // D is always 16
            // P is always 8bit, P
            // B is always 8bit, DBR,
            // K is always 8bit, PBR
            ag.addcycle(2);
            ag.addr_to_PC();
            ag.RPDV(0, 0, 0, 0);
            ag.addcycle(3);
            ag.addcycle(4);
            ag.RPDV(0, 0, 1, 0);
            if (mem16) {
                if (opcode_info.ins === WDC_OM.PLD)
                    ag.addr_to_S_after_inc_unbound();
                else
                    ag.addr_to_S_after_inc();


                ag.addcycle('4a');
                ag.addl('regs.TR = pins.D;');
                if (opcode_info.ins === WDC_OM.PLD)
                    ag.addr_to_S_after_inc_unbound();
                else
                    ag.addr_to_S_after_inc();

                ag.cleanup();
                ag.addl('regs.TR += (pins.D << 8);');
                if (opcode_info.ins === WDC_OM.PLD && E)
                    ag.addl('regs.S = (regs.S & 0xFF) + 0x100;');
            }
            else {
                ag.addr_to_S_after_inc();

                ag.cleanup();
                ag.addl('regs.TR = pins.D;');
            }
            ag.add_ins(opcode_info.ins, E, M, X);
            break;
        case WDC_AM.STACKc: // Pushes
            setstackmem();
            affected_by_E = (opcode_info.ins === WDC_OM.PHD);
            ag.addcycle(2);
            ag.addr_to_PC();
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(3);
            ag.RPDV(1, 0, 1, 0);
            ag.add_ins(opcode_info.ins, E, M, X);
            if (mem16) {
                if (opcode_info.ins === WDC_OM.PHD)
                    ag.addr_to_S_then_dec_unbound();
                else
                    ag.addr_to_S_then_dec();
                ag.addl('pins.D = (regs.TR & 0xFF00) >>> 8;');

                ag.addcycle();
                if (opcode_info.ins === WDC_OM.PHD)
                    ag.addr_to_S_then_dec_unbound();
                else
                    ag.addr_to_S_then_dec();
                ag.addl('pins.D = regs.TR & 0xFF;');
                if (opcode_info.ins === WDC_OM.PHD && E)
                    ag.addl('regs.S = (regs.S & 0xFF) + 0x100;');
            }
            else {
                ag.addr_to_S_then_dec();
                ag.addl('pins.D = regs.TR & 0xFF;');
            }
            break;
        case WDC_AM.STACKd: // PEA
            ag.addcycle(2);
            affected_by_E = true;
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TR = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.RPDV(1, 0, 1, 0);
            ag.addr_to_S_then_dec_unbound();

            ag.addcycle(5);
            ag.addr_to_S_then_dec_unbound();
            ag.addl('pins.D = regs.TR;');

            ag.cleanup();
            if (E)
                ag.addl('regs.S = (regs.S & 0xFF) + 0x100;');
            break;
        case WDC_AM.STACKe: // PEI
            fetch_D0_and_skip_cycle();
            affected_by_E = true;
            // We're now INSIDE cycle #3 with d in regs.TA
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('(regs.TA + regs.D) & 0xFFFF');

            ag.addcycle(4);
            ag.addl('regs.TR = pins.D;');
            ag.addr_inc();

            ag.addcycle(5);
            ag.RPDV(1, 0, 1, 0);
            ag.addr_to_S_then_dec_unbound();

            ag.addcycle(6);
            ag.addl('pins.D = regs.TR');
            ag.addr_to_S_then_dec_unbound();
            ag.cleanup();
            if (E)
                ag.addl('regs.S = (regs.S & 0xFF) + 0x100;');
            break;
        case WDC_AM.STACKf: // PER
            affected_by_E = true;
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.addl('regs.TR = pins.D;');
            ag.addr_to_PC_then_inc();

            ag.addcycle(4);
            ag.RPDV(0, 0, 0, 0);
            ag.addl('regs.TR = (regs.PC + regs.TR + (pins.D << 8)) & 0xFFFF;');

            ag.addcycle(5);
            ag.RPDV(1, 0, 1, 0);
            ag.addr_to_S_then_dec_unbound();
            ag.D_to_TRH();

            ag.addcycle(6);
            ag.addr_to_S_then_dec_unbound();
            ag.D_to_TRL();

            ag.cleanup();
            if (E) ag.addl('regs.S = (regs.S & 0xFF) + 0x100;');
            break;
        case WDC_AM.STACKg: // RTI
            affected_by_E = true;

            ag.addcycle(2);
            ag.RPDV(0, 0, 0, 0);
            ag.addr_to_PC();

            ag.addcycle(3);

            ag.addcycle(4);
            ag.addr_to_S_after_inc();
            ag.RPDV(0, 0, 1, 0);

            ag.addcycle(5);
            ag.addr_to_S_after_inc();
            if (E)
                ag.addl('regs.P.setbyte_emulated(pins.D);');
            else
                ag.addl('regs.P.setbyte_native(pins.D);');
            ag.addl('if (regs.P.X) {');
            ag.addl('    regs.X &= 0xFF;');
            ag.addl('    regs.Y &= 0xFF;');
            ag.addl('}');
            ag.addl('if (regs.P.E) regs.S = (regs.S & 0xFF) | 0x100;')

            ag.addcycle(6);
            ag.addr_to_S_after_inc();
            ag.addl('regs.TA = pins.D;');

            if (!E) { // 24-bit
                ag.addcycle(7);
                ag.addr_to_S_after_inc();
                ag.addl('regs.TA += pins.D << 8;');

                ag.cleanup();
                ag.addl('regs.PC = regs.TA;');
                ag.addl('regs.PBR = pins.D;');
            }
            else {    // 16-bit
                ag.cleanup();
                ag.addl('regs.PC = regs.TA + (pins.D << 8);');
            }
            //ag.addl('if (regs.NMI_servicing) regs.NMI_servicing = false;');
            break;
        case WDC_AM.STACKh: // RTS
            ag.addcycle(2);
            ag.RPDV(0,0,0,0);
            ag.addr_to_PC();

            ag.addcycle(3);

            ag.addcycle(4);
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_S_after_inc();

            ag.addcycle(5);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_S_after_inc();

            ag.addcycle(6)
            ag.RPDV(0, 0, 0, 0);
            ag.addl('regs.PC = (regs.TA + (pins.D << 8) + 1) & 0xFFFF;');
            break;
        case WDC_AM.STACKi: // RTL
            affected_by_E = true;
            ag.addcycle(2);
            ag.RPDV(0,0,0,0);
            ag.addr_to_PC();

            ag.addcycle(3);

            ag.addcycle(4);
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_S_after_inc();

            ag.addcycle(5);
            ag.addl('regs.TA = pins.D;');
            ag.addr_to_S_after_inc();

            ag.addcycle(6)
            ag.addr_to_S_after_inc();
            ag.addl('regs.PC = (regs.TA + (pins.D << 8) + 1) & 0xFFFF;');

            ag.cleanup();
            ag.addl('regs.PBR = pins.D;')
            if (E) ag.addl('regs.S = (regs.S & 0xFF) + 0x100;');
            break;
        case WDC_AM.STACKj: // BRK, COP
            // dont push PBR if in emulation mode
            affected_by_E = true;
            ag.add_ins(opcode_info.ins, E, M, X);

            ag.addl('regs.P.D = 0;');
            ag.addl('regs.P.I = 1;');

            break;
        case WDC_AM.STACK_R:
            set_exm16rw();
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.RPDV(0, 0, 0, 0);
            //ag.addr_to_PC();
            ag.addl('regs.TA = (pins.D + regs.S) & 0xFFFF;');

            // TODO: check this!!!!
            ag.addcycle(4);
            ag.addr_to_ZB('regs.TA');
            finish_RW8or16p();
            break;
        case WDC_AM.STACK_R_IND_INDEXED:
            set_exm16rw();
            ag.addcycle(2);
            ag.RPDV(0, 1, 0, 0);
            ag.addr_to_PC_then_inc();

            ag.addcycle(3);
            ag.RPDV(0, 0, 0, 0);
            //ag.addr_to_PC();
            ag.addl('regs.TA = (pins.D + regs.S) & 0xFFFF;');

            ag.addcycle(4);
            ag.RPDV(0, 0, 1, 0);
            ag.addr_to_ZB('regs.TA');

            ag.addcycle(5);
            ag.addl('regs.TR = pins.D;');
            ag.addr_inc();

            ag.addcycle(6);
            ag.addl('regs.TA = (regs.TR + (pins.D << 8) + regs.Y);')
            ag.addl('regs.TR = regs.DBR;');
            ag.addl('if (regs.TA >= 0x10000) { regs.TA -= 0x10000; regs.TR = (regs.TR + 1) & 0xFF; }')
            ag.RPDV(0, 0, 0, 0);

            ag.addcycle(7);
            ag.addr_to('regs.TA', 'regs.TR');
            finish_RW8or16p();
            break;
    }
    let outstr = 'function(regs, pins) { // ' + opcode_info.mnemonic + '\n' + ag.finished() + indent + '}';
    return new generate_instruction_function_return(outstr, E, M, X, affected_by_E, affected_by_M, affected_by_X, affected_by_D);
}

function generate_instruction_codes(indent, E, M, X) {
    let outstr = '';
    let firstin = false;
    let aryo;
    let keep_it = false;
    for (let opcode = 0; opcode <= WDC_MAX_OPCODE; opcode++) {
        let opcode_info = opcode_matrix[opcode];
        let opc2 = '0x' + hex2(opcode);
        let mystr = indent + '    ' + opc2 + ': new opcode_functions(opcode_matrix[' + opc2 + '],\n';
        let r = generate_instruction_function(indent + '        ', opcode_info, E, M, X);
        if (r.strout.length === 0) {
            console.log('EMPTY!', opc2);
        }
        mystr += indent + '        ' + r.strout + ',\n';
        // Disassemble_func
        mystr += indent + '        ' + (r.affected_by_E ? 'true, ' : 'false, ');
        mystr += r.affected_by_M ? 'true, ' : 'false, ';
        mystr += r.affected_by_X ? 'true)' : 'false)';

        //if ((E && r.affected_by_E) || (M && r.affected_by_M) || (X && r.affected_by_X) || (!E && !M && !X)) {
            if (firstin)
                outstr += ',\n';
            firstin = true;
            outstr += mystr;
        //}
    }
    return '{\n' + outstr + '\n}';
}

function EMX_to_flag(E, M, X) {
    let result = 0;
    if (E) return 1;
    if (!M && !X) return 0;
    return (1 + M + X*2);
}

function generate_EMX_truth_table() {
    let outstr = 'const EMX_truth_table = Object.freeze({\n';
    let outsubstrs = [];
    let IDT = '    ';
    let first = true;
    let last_emx = '';
    for (let X = 0; X < 2; X++) {
        for (let M = 0; M < 2; M++) {
            for (let E = 0; E < 2; E++) {
                if (!first) outstr += ', // ' + last_emx + '\n';
                first = false;
                outstr += IDT + (E + M*2 + X*4) + ': ' + EMX_to_flag(E, M, X);
                last_emx = 'E' + E + ' M' + M + ' X' + X;
            }
        }
    }
    outstr += '  // ' + last_emx + '\n});';
    return outstr;
}

//console.log(generate_EMX_truth_table());
// Lookup is E + M*2 + X*4
// disabling instruction crunching for now
/*const EMX_table = Object.freeze({
    0: 0, // E0 M0 X0
    1: 1, // E1 M0 X0
    2: 2, // E0 M1 X0
    3: 1, // E1 M1 X0
    4: 3, // E0 M0 X1
    5: 1, // E1 M0 X1
    6: 4, // E0 M1 X1
    7: 1  // E1 M1 X1
});*/

const EMX_table = Object.freeze({
    0: 0, // E0 M0 X0
    1: 1, // E1 M0 X0
    2: 2, // E0 M1 X0
    3: 3, // E1 M1 X0
    4: 4, // E0 M0 X1
    5: 5, // E1 M0 X1
    6: 6, // E0 M1 X1
    7: 7  // E1 M1 X1
});


function decode_opcodes() {
    // Intended data structure will be accessed like...yo[E + M*2 + X*4 + D*8][opcode]
    let IDT = '    ';
    let outstr = '{\n';
    //let already_done = [];
    for (let E = 0; E < 2; E++) {
        for (let M = 0; M < 2; M++) {
            for (let X = 0; X < 2; X++) {
                let flag = EMX_table[E + M*2 + X*4]
                // disabling instruction crunching for now
                // if (already_done.indexOf(flag) !== -1) continue;
                if (E && (!X || !M))
                    continue;
                let ME = E ? 1 : M;
                let XE = E ? 1 : X;
                //console.log('Generating F' + flag + ' for ' + E + ' ' + ME + ' ' + XE);
                outstr += IDT + '// E' + E + ' M' + ME + ' X' + XE + '\n';
                outstr += IDT + flag.toString() + ': ' + generate_instruction_codes(IDT, E, ME, XE) + ',\n';
                //already_done.push(flag);
            }
        }
    }
    outstr += '\n}';
    return outstr;
}

//console.log(decode_opcodes());
/*console.log('Starting opcode decode eval...');
let tr = performance.now();
let trattodo = Function(decode_opcodes());
let tr2 = performance.now() - tr;
console.log('Took ' + tr2 + 'ms');
const decoded_opcodes = Object.freeze(trattodo());*/

//console.log('const decoded_opcodes = Object.freeze(\n' + decode_opcodes() + ');');

function get_decoded_opcode(regs) {
    let flag = 0;
    let ret = null;
    /*if (regs.IR === 0xA9) {
        console.log('HERE for LDA');
    }*/
    if (regs.E) {
        //ret = decoded_opcodes[EMX_table[7]][regs.IR];
        ret = decoded_opcodes[EMX_table[7]][regs.IR];
    }
    else {
        let flag = EMX_table[regs.P.M*2 + regs.P.X*4];
        //console.log("FLAG!", typeof(flag))
        //if (decoded_opcodes[EMX_table[flag]].hasOwnProperty(regs.IR.toString()))
        ret = decoded_opcodes[flag][regs.IR];
        //else
        //    ret = decoded_opcodes[EMX_table[0]][regs.IR];
    }
    if ((ret === null) || (typeof(ret) === 'undefined')) {
        ret = decoded_opcodes[EMX_table[0]][regs.IR];
    }
    return ret;
}

function generate_ins_AM(indent) {
    let ostr = 'const ins_AM = Object.freeze({\n';
    for (let ins = 0; ins <= MAX_INS; ins++) {
        ostr += indent + '[OM.';
        for (let j in WDC_OM) {
            if (WDC_OM[j] === ins) {
                ostr += j + ']: [ ';
                break;
            }
        }
        let first = true;
        // Search through address modes
        for (let opcoden = 0; opcoden <= WDC_MAX_OPCODE; opcoden++) {
            let opcode = opcode_matrix[opcoden];
            if (opcode.ins !== ins) continue;
            let addr_mode = opcode.addr_mode;
            if (!first) {
                ostr += ', ';
            }
            first = false;
            ostr += 'AM.';
            for (let j in WDC_AM) {
                if (WDC_AM[j] === addr_mode) {
                    ostr += j;
                    break;
                }
            }
        }
        ostr += ' ],\n'
    }
    ostr += '});'
    return ostr;
}

//console.log(generate_ins_AM('    '));

const ins_AM = Object.freeze({
    [WDC_OM.ADC]: [ WDC_AM.D_INDEXED_IND, WDC_AM.STACK_R, WDC_AM.D, WDC_AM.D_IND_L, WDC_AM.IMM, WDC_AM.A, WDC_AM.AL, WDC_AM.D_IND_INDEXED, WDC_AM.D_IND, WDC_AM.STACK_R_IND_INDEXED, WDC_AM.D_INDEXED_X, WDC_AM.D_IND_L_INDEXED, WDC_AM.A_INDEXED_Y, WDC_AM.A_INDEXED_X, WDC_AM.AL_INDEXED_X ],
    [WDC_OM.AND]: [ WDC_AM.D_INDEXED_IND, WDC_AM.STACK_R, WDC_AM.D, WDC_AM.D_IND_L, WDC_AM.IMM, WDC_AM.A, WDC_AM.AL, WDC_AM.D_IND_INDEXED, WDC_AM.D_IND, WDC_AM.STACK_R_IND_INDEXED, WDC_AM.D_INDEXED_X, WDC_AM.D_IND_L_INDEXED, WDC_AM.A_INDEXED_Y, WDC_AM.A_INDEXED_X, WDC_AM.AL_INDEXED_X ],
    [WDC_OM.ASL]: [ WDC_AM.Db, WDC_AM.ACCUM, WDC_AM.Ad, WDC_AM.D_INDEXED_Xb, WDC_AM.A_INDEXED_Xb ],
    [WDC_OM.BCC]: [ WDC_AM.PC_R ],
    [WDC_OM.BCS]: [ WDC_AM.PC_R ],
    [WDC_OM.BEQ]: [ WDC_AM.PC_R ],
    [WDC_OM.BIT]: [ WDC_AM.D, WDC_AM.A, WDC_AM.D_INDEXED_X, WDC_AM.A_INDEXED_X, WDC_AM.IMM ],
    [WDC_OM.BMI]: [ WDC_AM.PC_R ],
    [WDC_OM.BNE]: [ WDC_AM.PC_R ],
    [WDC_OM.BPL]: [ WDC_AM.PC_R ],
    [WDC_OM.BRA]: [ WDC_AM.PC_R ],
    [WDC_OM.BRK]: [ WDC_AM.STACKj ],
    [WDC_OM.BRL]: [ WDC_AM.PC_RL ],
    [WDC_OM.BVC]: [ WDC_AM.PC_R ],
    [WDC_OM.BVS]: [ WDC_AM.PC_R ],
    [WDC_OM.CLC]: [ WDC_AM.I ],
    [WDC_OM.CLD]: [ WDC_AM.I ],
    [WDC_OM.CLI]: [ WDC_AM.I ],
    [WDC_OM.CLV]: [ WDC_AM.I ],
    [WDC_OM.CMP]: [ WDC_AM.D_INDEXED_IND, WDC_AM.STACK_R, WDC_AM.D, WDC_AM.D_IND_L, WDC_AM.IMM, WDC_AM.A, WDC_AM.AL, WDC_AM.D_IND_INDEXED, WDC_AM.D_IND, WDC_AM.STACK_R_IND_INDEXED, WDC_AM.D_INDEXED_X, WDC_AM.D_IND_L_INDEXED, WDC_AM.A_INDEXED_Y, WDC_AM.A_INDEXED_X, WDC_AM.AL_INDEXED_X ],
    [WDC_OM.COP]: [ WDC_AM.STACKj ],
    [WDC_OM.CPX]: [ WDC_AM.IMM, WDC_AM.D, WDC_AM.A ],
    [WDC_OM.CPY]: [ WDC_AM.IMM, WDC_AM.D, WDC_AM.A ],
    [WDC_OM.DEC]: [ WDC_AM.ACCUM, WDC_AM.Db, WDC_AM.Ad, WDC_AM.D_INDEXED_Xb, WDC_AM.A_INDEXED_Xb ],
    [WDC_OM.DEX]: [ WDC_AM.I ],
    [WDC_OM.DEY]: [ WDC_AM.I ],
    [WDC_OM.EOR]: [ WDC_AM.D_INDEXED_IND, WDC_AM.STACK_R, WDC_AM.D, WDC_AM.D_IND_L, WDC_AM.IMM, WDC_AM.A, WDC_AM.AL, WDC_AM.D_IND_INDEXED, WDC_AM.D_IND, WDC_AM.STACK_R_IND_INDEXED, WDC_AM.D_INDEXED_X, WDC_AM.D_IND_L_INDEXED, WDC_AM.A_INDEXED_Y, WDC_AM.A_INDEXED_X, WDC_AM.AL_INDEXED_X ],
    [WDC_OM.INC]: [ WDC_AM.ACCUM, WDC_AM.Db, WDC_AM.Ad, WDC_AM.D_INDEXED_Xb, WDC_AM.A_INDEXED_Xb ],
    [WDC_OM.INX]: [ WDC_AM.I ],
    [WDC_OM.INY]: [ WDC_AM.I ],
    [WDC_OM.JML]: [ WDC_AM.A_IND ],
    [WDC_OM.JMP]: [ WDC_AM.Ab, WDC_AM.ALb, WDC_AM.A_INDb, WDC_AM.A_INDEXED_IND ],
    [WDC_OM.JSL]: [ WDC_AM.ALc ],
    [WDC_OM.JSR]: [ WDC_AM.Ac, WDC_AM.A_INDEXED_INDb ],
    [WDC_OM.LDA]: [ WDC_AM.D_INDEXED_IND, WDC_AM.STACK_R, WDC_AM.D, WDC_AM.D_IND_L, WDC_AM.IMM, WDC_AM.A, WDC_AM.AL, WDC_AM.D_IND_INDEXED, WDC_AM.D_IND, WDC_AM.STACK_R_IND_INDEXED, WDC_AM.D_INDEXED_X, WDC_AM.D_IND_L_INDEXED, WDC_AM.A_INDEXED_Y, WDC_AM.A_INDEXED_X, WDC_AM.AL_INDEXED_X ],
    [WDC_OM.LDX]: [ WDC_AM.IMM, WDC_AM.D, WDC_AM.A, WDC_AM.D_INDEXED_Y, WDC_AM.A_INDEXED_Y ],
    [WDC_OM.LDY]: [ WDC_AM.IMM, WDC_AM.D, WDC_AM.A, WDC_AM.D_INDEXED_X, WDC_AM.A_INDEXED_X ],
    [WDC_OM.LSR]: [ WDC_AM.Db, WDC_AM.ACCUM, WDC_AM.Ad, WDC_AM.D_INDEXED_Xb, WDC_AM.A_INDEXED_Xb ],
    [WDC_OM.MVN]: [ WDC_AM.XYC ],
    [WDC_OM.MVP]: [ WDC_AM.XYCb ],
    [WDC_OM.NOP]: [ WDC_AM.I ],
    [WDC_OM.ORA]: [ WDC_AM.D_INDEXED_IND, WDC_AM.STACK_R, WDC_AM.D, WDC_AM.D_IND_L, WDC_AM.IMM, WDC_AM.A, WDC_AM.AL, WDC_AM.D_IND_INDEXED, WDC_AM.D_IND, WDC_AM.STACK_R_IND_INDEXED, WDC_AM.D_INDEXED_X, WDC_AM.D_IND_L_INDEXED, WDC_AM.A_INDEXED_Y, WDC_AM.A_INDEXED_X, WDC_AM.AL_INDEXED_X ],
    [WDC_OM.PEA]: [ WDC_AM.STACKd ],
    [WDC_OM.PEI]: [ WDC_AM.STACKe ],
    [WDC_OM.PER]: [ WDC_AM.STACKf ],
    [WDC_OM.PHA]: [ WDC_AM.STACKc ],
    [WDC_OM.PHB]: [ WDC_AM.STACKc ],
    [WDC_OM.PHD]: [ WDC_AM.STACKc ],
    [WDC_OM.PHK]: [ WDC_AM.STACKc ],
    [WDC_OM.PHP]: [ WDC_AM.STACKc ],
    [WDC_OM.PHX]: [ WDC_AM.STACKc ],
    [WDC_OM.PHY]: [ WDC_AM.STACKc ],
    [WDC_OM.PLA]: [ WDC_AM.STACKb ],
    [WDC_OM.PLB]: [ WDC_AM.STACKb ],
    [WDC_OM.PLD]: [ WDC_AM.STACKb ],
    [WDC_OM.PLP]: [ WDC_AM.STACKb ],
    [WDC_OM.PLX]: [ WDC_AM.STACKb ],
    [WDC_OM.PLY]: [ WDC_AM.STACKb ],
    [WDC_OM.REP]: [ WDC_AM.IMM ],
    [WDC_OM.ROL]: [ WDC_AM.Db, WDC_AM.ACCUM, WDC_AM.Ad, WDC_AM.D_INDEXED_Xb, WDC_AM.A_INDEXED_Xb ],
    [WDC_OM.ROR]: [ WDC_AM.Db, WDC_AM.ACCUM, WDC_AM.Ad, WDC_AM.D_INDEXED_Xb, WDC_AM.A_INDEXED_Xb ],
    [WDC_OM.RTI]: [ WDC_AM.STACKg ],
    [WDC_OM.RTL]: [ WDC_AM.STACKi ],
    [WDC_OM.RTS]: [ WDC_AM.STACKh ],
    [WDC_OM.SBC]: [ WDC_AM.D_INDEXED_IND, WDC_AM.STACK_R, WDC_AM.D, WDC_AM.D_IND_L, WDC_AM.IMM, WDC_AM.A, WDC_AM.AL, WDC_AM.D_IND_INDEXED, WDC_AM.D_IND, WDC_AM.STACK_R_IND_INDEXED, WDC_AM.D_INDEXED_X, WDC_AM.D_IND_L_INDEXED, WDC_AM.A_INDEXED_Y, WDC_AM.A_INDEXED_X, WDC_AM.AL_INDEXED_X ],
    [WDC_OM.SEP]: [ WDC_AM.IMM ],
    [WDC_OM.SEC]: [ WDC_AM.I ],
    [WDC_OM.SED]: [ WDC_AM.I ],
    [WDC_OM.SEI]: [ WDC_AM.I ],
    [WDC_OM.STA]: [ WDC_AM.D_INDEXED_IND, WDC_AM.STACK_R, WDC_AM.D, WDC_AM.D_IND_L, WDC_AM.A, WDC_AM.AL, WDC_AM.D_IND_INDEXED, WDC_AM.D_IND, WDC_AM.STACK_R_IND_INDEXED, WDC_AM.D_INDEXED_X, WDC_AM.D_IND_L_INDEXED, WDC_AM.A_INDEXED_Y, WDC_AM.A_INDEXED_X, WDC_AM.AL_INDEXED_X ],
    [WDC_OM.STP]: [ WDC_AM.Ic ],
    [WDC_OM.STX]: [ WDC_AM.D, WDC_AM.A, WDC_AM.D_INDEXED_Y ],
    [WDC_OM.STY]: [ WDC_AM.D, WDC_AM.A, WDC_AM.D_INDEXED_X ],
    [WDC_OM.STZ]: [ WDC_AM.D, WDC_AM.D_INDEXED_X, WDC_AM.A, WDC_AM.A_INDEXED_X ],
    [WDC_OM.TAX]: [ WDC_AM.I ],
    [WDC_OM.TAY]: [ WDC_AM.I ],
    [WDC_OM.TCD]: [ WDC_AM.I ],
    [WDC_OM.TCS]: [ WDC_AM.I ],
    [WDC_OM.TDC]: [ WDC_AM.I ],
    [WDC_OM.TRB]: [ WDC_AM.Db, WDC_AM.Ad ],
    [WDC_OM.TSB]: [ WDC_AM.Db, WDC_AM.Ad ],
    [WDC_OM.TSC]: [ WDC_AM.I ],
    [WDC_OM.TSX]: [ WDC_AM.I ],
    [WDC_OM.TXA]: [ WDC_AM.I ],
    [WDC_OM.TXS]: [ WDC_AM.I ],
    [WDC_OM.TXY]: [ WDC_AM.I ],
    [WDC_OM.TYA]: [ WDC_AM.I ],
    [WDC_OM.TYX]: [ WDC_AM.I ],
    [WDC_OM.WAI]: [ WDC_AM.Id ],
    [WDC_OM.WDM]: [ WDC_AM.I ],
    [WDC_OM.XBA]: [ WDC_AM.Ib ],
    [WDC_OM.XCE]: [ WDC_AM.I ],
    [WDC_OM.S_RESET]: [ WDC_AM.STACK ],
    [WDC_OM.S_NMI]: [ WDC_AM.STACK ],
    [WDC_OM.S_IRQ]: [ WDC_AM.STACK ],
    [WDC_OM.S_ABORT]: [ WDC_AM.STACK ],
    [WDC_OM.DCB]: [ WDC_AM.DCB ],
    [WDC_OM.ASC]: [ WDC_AM.ASC ]
});
