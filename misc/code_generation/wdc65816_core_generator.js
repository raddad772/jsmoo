"use strict";

// BIG TODO: implement diff-based RPDV, so pins are not set and reset SO MUCH

// is this still true?
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


// Current instruction coding has 5 encodings, for E=0 M=0/1 X=0/1, and E=1 M=1 X=1.

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
                return WDC_VEC.BRK_E;
            return WDC_VEC.BRK_N;
        case WDC_OM.COP:
            if (E)
                return WDC_VEC.COP_E;
            return WDC_VEC.COP_N;
        case WDC_OM.S_IRQ:
            if (E)
                return WDC_VEC.IRQ_E;
            return WDC_VEC.IRQ_N;
        case WDC_OM.S_ABORT:
            if (E)
                return WDC_VEC.ABORT_E;
            return WDC_VEC.ABORT_N;
        case WDC_OM.S_NMI:
            if (E)
                return WDC_VEC.NMI_E;
            return WDC_VEC.NMI_N;
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
            testourset(opcode, ourset, ourthere, opcodes, WDC_opcode_AM_MN[j]);
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
    let outstr = indent + 'const WDC_opcode_matrix = Object.freeze({\n';
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
        let thistr = indent + '    0x' + hex2(opcode) + ': new WDC_opcode_info(0x' + hex2(opcode) + ', ' + ins_backwards(ins) + ', ' + addr_backwards(addr_mode_split) + ', "' + WDC_OP_MN_str[ins] + ' ' + WDC_opcode_AM_MN[addr_mode] + '")'
        outstr += thistr;
    }
    outstr += '\n' + indent + '});'
    return outstr;
}


// created by
//console.log(generate_opcodes_struct(''));

class WDC_switchgen {
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
        if (WDC_PINS_SEPERATE_PDV) {
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
        if (WDC_PINS_SEPERATE_PDV) {
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
        if (!WDC_PINS_SEPERATE_PDV) {
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
        if (WDC_PINS_SEPERATE_PDV) {
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

function WDC_generate_instruction_function(indent, opcode_info, E, M, X) {
    let affected_by_E = false;
    let affected_by_M = false;
    let affected_by_X = false;
    let affected_by_D = false;
    let indent2 = indent + '    ';
    let ag = new WDC_switchgen(indent2,'regs.TCU')
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
            if (WDC_PINS_SEPERATE_PDV)
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
        case WDC_AM.Ad: // Absolute a R-M-W
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
            if (WDC_PINS_SEPERATE_PDV) {
                ag.addl('if (regs.skipped_cycle === 1) { regs.TA = pins.D; pins.RW = 0; pins.VPA = 0; pins.VDA = 0; }');
            } else {
                ag.addl('if (regs.skipped_cycle === 1) { regs.TA = pins.D; pins.RW = 0; pins.PDV = 0; } ');
                ag.old_rw = 0; ag.old_pdv = 0;
            }

            ag.cleanup();
            if (WDC_PINS_SEPERATE_PDV) {
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
    for (let opcode = 0; opcode <= WDC_MAX_OPCODE; opcode++) {
        let opcode_info = WDC_opcode_matrix[opcode];
        let opc2 = '0x' + hex2(opcode);
        let mystr = indent + '    ' + opc2 + ': new WDC_opcode_functions(WDC_opcode_matrix[' + opc2 + '],\n';
        let r = WDC_generate_instruction_function(indent + '        ', opcode_info, E, M, X);
        if (r.strout.length === 0) {
            console.log('EMPTY!', opc2);
        }
        mystr += indent + '        ' + r.strout + ',\n';
        // Disassemble_func
        mystr += indent + '        ' + (r.affected_by_E ? 'true, ' : 'false, ');
        mystr += r.affected_by_M ? 'true, ' : 'false, ';
        mystr += r.affected_by_X ? 'true)' : 'false)';

        if (firstin)
            outstr += ',\n';
        firstin = true;
        outstr += mystr;
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
/*const WDC_EMX_table = Object.freeze({
    0: 0, // E0 M0 X0
    1: 1, // E1 M0 X0
    2: 2, // E0 M1 X0
    3: 1, // E1 M1 X0
    4: 3, // E0 M0 X1
    5: 1, // E1 M0 X1
    6: 4, // E0 M1 X1
    7: 1  // E1 M1 X1
});*/

function decode_opcodes() {
    // Intended data structure will be accessed like...yo[E + M*2 + X*4 + D*8][opcode]
    let IDT = '    ';
    let outstr = '{\n';
    //let already_done = [];
    for (let E = 0; E < 2; E++) {
        for (let M = 0; M < 2; M++) {
            for (let X = 0; X < 2; X++) {
                let flag = WDC_EMX_table[E + M*2 + X*4]
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

function generate_ins_AM(indent) {
    let ostr = 'const ins_AM = Object.freeze({\n';
    for (let ins = 0; ins <= WDC_MAX_INS; ins++) {
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
            let opcode = WDC_opcode_matrix[opcoden];
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
