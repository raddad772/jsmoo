"use strict";

/*
List of differences between original NMOS 6502 and CMOS version
 Taken care of? | NMOS
    maybe         NMOS indexed read across page boundary causes extra read of invalid address. CMOS is extra operand read
    yes           NMOS invalid opcodes. CMOS has none, any are NOP
    yes           JMP indirect xxFF, NMOS wraps, CMOS adds an extra cycle to increment
    yes           RMW NMOS does RWW, CMOS does RRW
    yes           NMOS doesn't touch decimal flag  at reset, CMOS sets to 0 on reset and interrupt
    no            after decimal op, N, V< and Z invalid on NMOS. valid on CMOS, takes +1 cycle
    CMOS-like one NMOS ignores the BRK instruction and loads the interrupt vector. CMOS does both
    yes           RMW absolute indexed in same page. NMOS = 7 cycles, CMOS = 6
 */

//let GENTARGET = 'js'; // JavaScript


function replace_for_C(whatr) {
    if (whatr.includes('getbyte()')) {
        console.log('ARGH1!!!', whatr);
    }
    whatr = whatr.replaceAll('regs.P.setbyte(', 'M6502_regs_P_setbyte(&(regs->P), ');
    whatr = whatr.replaceAll('regs.P.getbyte()', 'M6502_regs_P_getbyte(&regs.P)');
    if (whatr.includes('regs.P.getbyte()')) {
        console.log('ARGH2!!!', whatr);
    }
    whatr = whatr.replaceAll('pins.', 'pins->') // Reference to pointer
    whatr = whatr.replaceAll('regs.', 'regs->') // Reference to pointer
    whatr = whatr.replaceAll('>>>', '>>'); // Translate >>> to >>
    whatr = whatr.replaceAll('===', '=='); // === becomes ==
    whatr = whatr.replaceAll('!==', '!=');
    whatr = whatr.replaceAll('let ', 'u32 '); // Inline variable declarations
    whatr = whatr.replaceAll('true', 'TRUE');
    whatr = whatr.replaceAll('false', 'FALSE');
    //what = what.replaceAll('mksigned8(regs->TA)', '(i32)(i8)regs->TA')
    //what = what.replaceAll('mksigned8(regs->TR)', '(i32)(i8)regs->TR')
    return whatr;
}

function M65C02_TEST_ABS_Xm(ins) {
    return ((ins === M6502_MN.DEC) || (ins === M6502_MN.INC));
}

function str_m6502_ocode_matrix(opc, variant) {
    let opc2 = hex0x2(opc);
    if (GENTARGET === 'js') {
        switch (M6502_VARIANTS_R[variant]) {
            case 'stock':
                return 'M6502_stock_matrix[' + opc2 + ']';
            case 'stock_undocumented':
                return 'M6502_undocumented_matrix[' + opc2 + ']';
            case 'cmos':
                return 'M6502_cmos_matrix[' + opc2 + ']';
            case 'invalid':
                return 'M6502_invalid_matrix[' + opc2 + ']';
            default:
                console.log('UNKNOWN !? ', opc, variant);
                return 'WHAT';
        }
    } else {
        switch (M6502_VARIANTS_R[variant]) {
            case 'stock':
                return 'M6502_stock_matrix.get(' + opc2 + ')';
            case 'stock_undocumented':
                return 'M6502_undocumented_matrix.get(' + opc2 + ')';
            case 'cmos':
                return 'M6502_cmos_matrix.get(' + opc2 + ')';
            case 'invalid':
                return 'M6502_invalid_matrix.get(' + opc2 + ')';
            default:
                console.log('UNKNOWN !? ', opc, variant);
                return 'WHAT';
        }

    }
}

function final_m6502_opcode_matrix(variant_list) {
    let output_matrix = [];
    for (let v in variant_list) {
        for (let i = 0; i <= M6502_MAX_OPCODE; i++) {
            switch (M6502_VARIANTS_R[variant_list[v]]) {
                case 'stock':
                    if (typeof M6502_stock_matrix[i] !== 'undefined')
                        output_matrix[i] = M6502_stock_matrix[i];
                    break;
                case 'stock_undocumented':
                    if (typeof M6502_undocumented_matrix[i] !== 'undefined') {
                        output_matrix[i] = M6502_undocumented_matrix[i];
                    }
                    break;
                case 'cmos':
                    if (typeof M6502_cmos_matrix[i] !== 'undefined') {
                        output_matrix[i] = M6502_cmos_matrix[i];
                    }
                    break;
                default:
                    console.log('WHAT !?', variant_list);
                    break;
            }
        }
    }
    for (let i = 0; i <= M6502_MAX_OPCODE; i++) {
        if (typeof output_matrix[i] === 'undefined') {
            output_matrix[i] = M6502_invalid_matrix[i];
        }
    }
    return output_matrix;
}

function M6502_XAW(ins) {
    switch(ins) {
        case M6502_MN.STA:
        case M6502_MN.LDA:
            return 'regs.A';
        case M6502_MN.STX:
        case M6502_MN.LDX:
            return 'regs.X';
        case M6502_MN.STY:
        case M6502_MN.LDY:
            return 'regs.Y';
        case M6502_MN.STZ:
            return '0';
        default:
            console.log('M6502 XAW unknown instruction', ins);
            return null;
    }
}

class m6502_switchgen {
    constructor(indent, what, BCD_support, variant, is_C) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.variant = variant;
        this.in_case = false;
        this.last_case = 0;
        this.has_footer = false;
        this.no_addr_at_end = false;
        this.no_RW_at_end = false;
        this.BCD_support = BCD_support;
        this.has_custom_end = false;
        this.outstr = '';
        this.is_C = is_C;
        this.CMOS = variant === M6502_VARIANTS.CMOS;

        // We start any instruction on a addr_to_ZP of a valid address
        this.old_rw = 0;

        this.clear(indent, what);
    }

    clear(indent, what) {
        this.indent1 = indent + '    ';
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.in_case = false;
        this.last_case = 0;
        this.has_footer = false;
        this.no_addr_at_end = false;
        this.no_RW_at_end = false;
        this.has_custom_end = false;
        if (!this.is_C)
            this.outstr = this.indent1 + 'switch(regs.TCU) {\n';
        else
            this.outstr = this.indent1 + 'switch(regs->TCU) {\n';
        this.old_rw = 0;
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
        if (typeof (whatup) !== 'undefined')
            this.outstr += this.indent2 + 'case ' + what + ': // ' + whatup + '\n';
        else
            this.outstr += this.indent2 + 'case ' + what + ':\n';
    }

    addl(what) {
        if (!this.is_C)
            this.outstr += this.indent3 + what + '\n';
        else {
            what = replace_for_C(what);
            if (what.includes("regs.P.getbyte()")) {
                console.log("HA!", what, replace_for_C(what));
            }
            this.outstr += this.indent3 + what + '\n';
        }
    }

    // This is a final "cycle" only SOME functions use, mostly to get final data addr_to_ZP or written
    cleanup() {
        this.has_footer = true;
        this.addcycle('cleanup_custom');
    }


    regular_end() {
        this.addl('// Following is auto-generated code for instruction finish')
        if (!this.has_footer) {
            this.addcycle('cleanup');
        }
        if (!this.no_addr_at_end)
            this.addr_to_PC_then_inc();
        if (!this.no_RW_at_end)
            this.RW(0);
        this.addl('regs.TCU = 0;')
        this.addl('break;')
    }

    RW(what, force=false) {
        if ((what !== this.old_rw) || force) {
            this.addl('pins.RW = ' + what.toString() + ';');
            this.old_rw = what;
        }
    }

    addr_to_PC() {
        this.addl('pins.Addr = regs.PC;');
    }

    addr_to_PC_then_inc() {
        this.addl('pins.Addr = regs.PC;');
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    addr_to(what) {
        this.addl('pins.Addr = (' + what + ');');
    }

    finished() {
        if (!this.in_case) {
            return '';
        }
        this.regular_end();

        this.outstr += this.indent1 + '}\n';
        return this.outstr;
    }

    setz(what) {
        this.addl('regs.P.Z = +((' + what + ') ' + GENEQO + ' 0);');
    }

    setn(what) {
        this.addl('regs.P.N = ((' + what + ') & 0x80) >>> 7;');
    }

    addr_to_ZP(where) {
        this.addl('pins.Addr = ' + where + ';');
    }

    addr_inc() {
        this.addl('pins.Addr = (pins.Addr + 1) & 0xFFFF;');
    }

    addr_inc_wrap() {
        this.addl('pins.Addr = (pins.Addr & 0xFF00) | ((pins.Addr + 1) & 0xFF);');
    }

    addr_inc_ZP() {
        this.addl('pins.Addr = (pins.Addr + 1) & 0xFF;');
    }

    operand() {
        this.addl('pins.Addr = regs.PC;');
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    addr_to_S_after_inc() {
        this.addl('regs.S = (regs.S + 1) & 0xFF;');
        this.addl('pins.Addr = regs.S | 0x100;');
    }

    addr_to_S_then_dec() {
        this.addl('pins.Addr = regs.S | 0x100;');
        this.addl('regs.S = (regs.S - 1) & 0xFF;');
    }

    STP() {
        this.addcycle();
        this.addl('pins.Addr = regs.PC;');

        this.addcycle();

        this.cleanup();
        this.addl('regs.STP = true;');
    }

    WAI() {
        this.addcycle(2);
        this.addl('pins.Addr = regs.PC;');

        this.addl('if (!regs.IRQ_pending && !regs.NMI_pending) regs.TCU--;');
        this.addcycle(3)
        //this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    BRK(vector='0xFFFE', set_b=true, add_one_to_pc=false) {
        this.addcycle();
        this.addl('regs.P.B = ' + (+set_b) + ';');
        this.operand();

        this.addcycle();
        this.addr_to_S_then_dec();
        if (add_one_to_pc) this.addl('regs.TR = (regs.PC - 2) & 0xFFFF;');
        else this.addl('regs.TR = regs.PC;');
        this.addl('pins.D = (regs.TR >>> 8) & 0xFF;');
        this.RW(1);

        this.addcycle();
        this.addr_to_S_then_dec();
        this.addl('pins.D = regs.TR & 0xFF;');
        this.RW(1);

        this.addcycle();
        this.addr_to_S_then_dec();
        if (!this.is_C)
            this.addl('pins.D = regs.P.getbyte();');
        else
            this.addl('pins->D = M6502_regs_P_getbyte(&regs.P);');
        this.RW(1);

        this.addcycle();
        this.addl('regs.P.B = 1; // Confirmed via Visual6502 that this bit is actually set always during NMI, IRQ, and BRK');
        this.addl('regs.new_I = 1;');
        if (this.CMOS) this.addl('regs.P.D = 0;'); // for 65C02
        this.RW(0);
        this.addr_to(vector);

        this.addcycle();
        this.RW(0);
        this.addl('regs.PC = pins.D;');
        this.addr_inc();

        this.cleanup();
        this.addl('regs.PC |= (pins.D << 8);');
    }

    interrupt(vector) {
        this.addcycle();
        this.addcycle();

        this.addcycle();
        this.RW(1);
        this.addr_to_S_then_dec();
        this.addl('pins.D = (regs.PC & 0xFF00) >>> 8;');

        this.addcycle();
        this.addr_to_S_then_dec();
        this.addl('pins.D = regs.PC & 0xFF;');

        this.addcycle();
        this.addr_to_S_then_dec();
        if (!this.is_C)
            this.addl('pins.D = regs.P.getbyte() | 0x20;');
        else
            this.addl('pins->D = M6502_regs_P_getbyte(&regs.P) | 0x20;');
        this.addl('regs.new_I = 1;');

        this.addcycle();
        this.RW(0);
        this.addl('pins.Addr = ' + vector + ';');

        this.addcycle();
        this.addl('regs.TA = pins.D;');
        this.addr_inc();

        this.cleanup();
        this.addl('regs.PC = regs.TA | (pins.D << 8);');
    }

    IRQ() {
        this.BRK('0xFFFE', false, true);
    }

    NMI() {
        this.BRK('0xFFFA', false, true);
    }

    RESET() {
        // This behavior is mostly taken from WDC65816, dumbly.
        this.addcycle(3);
        this.RW(0, true);
        this.addr_to_S_then_dec();

        this.addcycle(4);
        this.addr_to_S_then_dec();

        this.addcycle(5);
        this.addr_to_S_then_dec();

        this.addcycle(6);
        this.addr_to_S_then_dec();

        this.addcycle(7);
        this.addr_to('0xFFFC');

        this.addcycle(8);
        this.addl('regs.PC = pins.D;');
        this.addr_inc();

        this.cleanup();
        this.addl('regs.PC |= (pins.D << 8);');
    }

    Pull(what) {
        this.addcycle('spurious read');
        this.addl('pins.Addr = regs.PC;');

        this.addcycle('spurious stack read');
        this.addl('pins.Addr = regs.S | 0x100;');

        this.addcycle('good stack read')
        this.addr_to_S_after_inc();

        this.cleanup();
        this.addl(what + ' = pins.D;');
        this.setz(what);
        this.setn(what);
    }

    Push(what) {
        this.addcycle();
        this.addl('pins.Addr = regs.PC;');
        this.addcycle();
        this.addr_to_S_then_dec();
        this.addl('pins.D = ' + what + ';');
        this.RW(1);
    }

    PullP() {
        this.addcycle();
        this.addl('pins.Addr = regs.PC;');
        this.addcycle('spurious stack read');
        this.addl('pins.Addr = regs.S | 0x100;');
        this.addl('regs.S = (regs.S + 1) & 0xFF;');
        this.addcycle();
        this.addl('pins.Addr = regs.S | 0x100;');
        this.cleanup();
        this.addl('regs.TR = regs.P.I;');
        if (!this.is_C)
            this.addl('regs.P.setbyte(pins.D);');
        else
            this.addl('M6502_regs_P_setbyte(&regs.P, pins.D);');
        this.addl('regs.new_I = regs.P.I;');
        this.addl('regs.P.I = regs.TR;')
    }

    PushP() {
        this.addcycle();
        this.addl('pins.Addr = regs.PC;');
        this.addcycle();
        this.addr_to_S_then_dec();
        if (!this.is_C)
            this.addl('pins.D = regs.P.getbyte() | 0x30;');
        else
            this.addl('pins->D = M6502_regs_P_getbyte(&regs.P) | 0x30;');
        this.RW(1);
    }

    RTI() {
        this.addcycle('spurious read');
        this.operand();

        this.addcycle('spurious stack read');
        this.addl('pins.Addr = regs.S | 0x100;');

        this.addcycle('Read P');
        this.addr_to_S_after_inc();

        this.addcycle('Read PCL');
        if (!this.is_C)
            this.addl('regs.P.setbyte(pins.D);');
        else
            this.addl('M6502_regs_P_setbyte(&regs.P, pins.D);');
        this.addl('regs.new_I = regs.P.I;');
        this.addr_to_S_after_inc();

        this.addcycle('read PCH');
        this.addl('regs.PC = pins.D;');
        this.addr_to_S_after_inc();

        this.cleanup();
        this.addl('regs.PC |= (pins.D << 8);');
    }

    RTS() {
        this.addcycle('spurious read');
        this.operand();

        this.addcycle('spurious stack read');
        this.addl('pins.Addr = regs.S | 0x100;');

        this.addcycle('read PCL');
        this.addr_to_S_after_inc();

        this.addcycle('read PCH');
        this.addl('regs.PC = pins.D;');
        this.addr_to_S_after_inc();

        this.addcycle('spurious read');
        this.addl('regs.PC |= (pins.D << 8);');
        this.operand();
    }

    Transfer(source, target, do_flags) {
        this.addcycle();
        this.addl('pins.Addr = regs.PC;');
        this.addl(target + ' = ' + source + ';');
        if (do_flags) {
            this.setz(target);
            this.setn(target);
        }
    }

    ADC(what='regs.TR') {
        if (GENTARGET === 'as') {
            this.addl('let o: i32;');
            this.addl('let i: i32 = ' + what + ';');
        }
        else if (GENTARGET === 'js') {
            this.addl('let o;');
            this.addl('let i = ' + what + ';');
        }
        else if (GENTARGET === 'c') {
            this.addl(';i32 o;');
            this.addl(';i32 i = ' + what + ';');
        }
        if (this.BCD_support) {
            this.addl('if (regs.P.D) {');
            this.addl('    o = (regs.A & 0x0F) + (i & 0x0F) + (regs.P.C);');
            this.addl('    if (o > 0x09) o += 0x06;');
            this.addl('    regs.P.C = +(o > 0x0F);');
            this.addl('    o = (regs.A & 0xF0) + (i & 0xF0) + (regs.P.C << 4) + (o & 0x0F);');
            this.addl('    if (o > 0x9F) o += 0x60;');
            this.addl('} else {');
            this.addl('    o = i + regs.A + regs.P.C;');
            this.addl('    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;');
            this.addl('}');
        } else {
            this.addl('o = i + regs.A + regs.P.C;');
            this.addl('regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;');
        }
        this.addl('regs.P.C = +(o > 0xFF);');
        this.addl('regs.A = o & 0xFF;');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    AND(what='regs.TR') {
        this.addl('regs.A &= ' + what + ';');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    ASL(what='regs.TR') {
        this.addl('regs.P.C = (' + what + ' & 0x80) >>> 7;');
        this.addl(what + ' = (' + what + ' << 1) & 0xFF;');
        this.setz(what);
        this.setn(what);
    }

    BIT(what='regs.TR') {
        this.setz('regs.A & ' + what);
        this.setn(what);
        this.addl('regs.P.V = (' + what + ' & 0x40) >>> 6;');
    }

    BITZ(what='regs.TR') {
        this.setz('regs.A & ' + what);
    }

    CMP(what, from='regs.TR') { // CPX, CPY too
        if (GENTARGET === 'as')
            this.addl('let o: i32 = ' + what + ' - ' + from + ';');
        else if (GENTARGET === 'js')
            this.addl('let o = ' + what + ' - ' + from + ';');
        else if (GENTARGET === 'c')
            this.addl(';i32 o = ' + what + ' - ' + from + ';');
        this.addl('regs.P.C = +(!((o & 0x100) >>> 8));');
        this.setz('o & 0xFF');
        this.setn('o');
    }

    DEC(what='regs.TR') {
        this.addl(what + ' = (' + what + ' - 1) & 0xFF;');
        this.setz(what);
        this.setn(what);
    }

    EOR(what='regs.TR') {
        this.addl('regs.A ^= ' + what + ';');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    INC(what='regs.TR') {
        this.addl(what + ' = (' + what + ' + 1) & 0xFF;');
        this.setz(what);
        this.setn(what);
    }

    LD(what, from='regs.TR') {
        this.addl(what + ' = ' + from + ';');
        this.setz(what);
        this.setn(what);
    }

    LSR(what='regs.TR') {
        this.addl('regs.P.C = ' + what + ' & 1;');
        this.addl(what + ' >>>= 1;');
        this.setz(what);
        this.addl('regs.P.N = 0;');
    }

    ORA(what='regs.TR') {
        this.addl('regs.A |= ' + what + ';');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    ROL(what='regs.TR') {
        if (GENTARGET === 'as') this.addl('let c: u32 = regs.P.C;');
        else if (GENTARGET === 'js') this.addl('let c = regs.P.C;');
        else if (GENTARGET === 'c') this.addl(';u32 c = regs.P.C;');
        this.addl('regs.P.C = (' + what + ' & 0x80) >>> 7;');
        this.addl(what + ' = ((' + what + ' << 1) | c) & 0xFF;');
        this.setz(what);
        this.setn(what);
    }

    ROR(what='regs.TR') {
        if (GENTARGET === 'as') this.addl('let c: u32 = regs.P.C;');
        else if (GENTARGET === 'js') this.addl('let c = regs.P.C;');
        else if (GENTARGET === 'c') this.addl(';u32 c = regs.P.C;');
        this.addl('regs.P.C = ' + what + ' & 1;');
        this.addl(what + ' = (c << 7) | (' + what + ' >>> 1);');
        this.setz(what);
        this.setn(what);
    }

    TRB(what='regs.TR') {
        this.setz(what + ' & regs.A');
        this.addl(what + ' &= (regs.A ^ 0xFF);');
    }

    TSB(what='regs.TR') {
        this.setz(what + ' & regs.A');
        this.addl(what + ' |= regs.A;');
    }

    TA_equals_PC_signed8(w)
    {
        if (!this.is_C)
            this.addl('regs.TA = (regs.PC + mksigned8(' + w + ')) & 0xFFFF;');
        else
            this.addl('regs->TA = (((i32)regs->PC) + ((i32)(i8)' + w + ')) & 0xFFFF;')
    }

    BRAA() { // Always branch
        this.addcycle();
        this.operand();

        this.addcycle();
        this.TA_equals_PC_signed8('pins.D');
        this.addl('pins.Addr = regs.PC;');
        this.addl('if ((regs.TA & 0xFF00) ' + GENEQO + ' (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page');

        this.addcycle('extra idle on page cross');
        this.addl('pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);');

        this.cleanup();
        this.addl('regs.PC = regs.TA;');
    }

    BRAZP(cond) {  // 4, 5, or 6?
        this.addcycle(2);
        this.operand();

        this.addcycle(3);
        this.addl('pins.Addr = pins.D;');

        this.addcycle(4); // spurious write
        this.addl(cond);
        this.RW(1);

        this.addcycle(5);
        this.RW(0);
        this.operand();
        this.addl('if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }')

        this.addcycle(5);
        //this.addl('regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;');
        this.TA_equals_PC_signed8('pins.D');
        this.addl('pins.Addr = regs.PC;');
        this.addl('if ((regs.TA & 0xFF00) ' + GENEQO + ' (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page');

        this.addcycle('6 extra idle on page cross');
        this.addl('pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);');

        this.cleanup();
        this.addl('regs.PC = regs.TA;');
    }

    BRA(cond) { // 2, or 3, or 4
        this.addcycle(); // This will be our last cycle if cond is False
        this.addl(cond); // regs.TR is now True or False
        // If regs.TR is False, skip 2 cycles
        // PageCrossed idle, then reegular idle, so addr is either last operand or
        //  pagedcrossed addr
        this.operand();
        this.addl('if (!regs.TR) { regs.TA = regs.PC; regs.TCU += 2; break; }')

        this.addcycle();
        //this.addl('regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;');
        this.TA_equals_PC_signed8('pins.D');

        this.addl('pins.Addr = regs.PC;');
        this.addl('if ((regs.TA & 0xFF00) ' + GENEQO + ' (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page');

        this.addcycle('extra idle on page cross');
        this.addl('pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);');

        this.cleanup();
        this.addl('regs.PC = regs.TA;');
    }

    SBC(what='regs.TR') {
        if (GENTARGET === 'as') {
            this.addl('let o: i32;');
            this.addl('let i: i32 = ' + what + ' ^ 0xFF;');
        }
        else if (GENTARGET === 'js') {
            this.addl('let o;');
            this.addl('let i = ' + what + ' ^ 0xFF;');
        }
        else if (GENTARGET === 'c') {
            this.addl(';i32 o;');
            this.addl(';i32 i = ' + what + ' ^ 0xFF;');
        }

        if (this.BCD_support) {
            this.addl('if (regs.P.D) {');
            this.addl('    o = (regs.A & 0x0F) + (i & 0x0F) + regs.P.C;');
            this.addl('    if (o <= 0x0F) o -= 0x06;');
            this.addl('    regs.P.C = +(o > 0x0F);');
            this.addl('    o = (regs.A & 0xF0) + (i & 0xF0) + (regs.P.C << 4) + (o & 0x0F);');
            this.addl('    if (o <= 0xFF) o -= 0x60;');
            this.addl('} else {');
            this.addl('    o = regs.A + i + regs.P.C;');
            this.addl('    regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;');
            this.addl('}');
        } else {
            this.addl('o = regs.A + i + regs.P.C;');
            this.addl('regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;');
        }
        this.addl('regs.P.C = +(o > 0xFF);');
        this.addl('regs.A = o & 0xFF;');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    // Clear bit bnum in reg
    RMB(bnum, reg) {
        this.addl(reg + ' &= ' + hex0x2(0xFF ^ (1 << bnum)) + ';');
    }

    // Set bit bnum in reg
    SMB(bnum, reg) {
        this.addl(reg + ' |= ' + hex0x2(1 << bnum) + ';');
    }

    /**
     * @param {M6502_opcode_info} opcode_info
     * @param out_reg
     */
    add_ins(opcode_info, out_reg='regs.TR') {
        let ins = opcode_info.ins;
        switch(ins) {
            case M6502_MN.NOP24:
                break;
            case M6502_MN.ADC:
                this.ADC(out_reg);
                break;
            case M6502_MN.AND:
                this.AND(out_reg);
                break;
            case M6502_MN.ASL:
                this.ASL(out_reg);
                break;
            case M6502_MN.BIT:
                this.BIT(out_reg);
                break;
            case M6502_MN.NOPL:
                // Literally NO oPeration-at-aL
                break;
            case M6502_MN.BITZ: // version of BIT that only affects Z
                this.BITZ(out_reg);
                break;
            case M6502_MN.CMP:
                this.CMP('regs.A', out_reg);
                break;
            case M6502_MN.CPX:
                this.CMP('regs.X', out_reg);
                break;
            case M6502_MN.CPY:
                this.CMP('regs.Y', out_reg);
                break;
            case M6502_MN.DEC:
                this.DEC(out_reg);
                break;
            case M6502_MN.EOR:
                this.EOR(out_reg);
                break;
            case M6502_MN.INC:
                this.INC(out_reg);
                break;
            case M6502_MN.LDA:
                this.LD('regs.A', out_reg);
                break;
            case M6502_MN.LDX:
                this.LD('regs.X', out_reg);
                break;
            case M6502_MN.LDY:
                this.LD('regs.Y', out_reg);
                break;
            case M6502_MN.LSR:
                this.LSR(out_reg);
                break;
            case M6502_MN.ORA:
                this.ORA(out_reg);
                break;
            case M6502_MN.ROL:
                this.ROL(out_reg);
                break;
            case M6502_MN.ROR:
                this.ROR(out_reg);
                break;
            case M6502_MN.SBC:
                this.SBC(out_reg);
                break;
            case M6502_MN.TRB:
                this.TRB(out_reg);
                break;
            case M6502_MN.TSB:
                this.TSB(out_reg);
                break;
            case M6502_MN.RMB0:
            case M6502_MN.RMB1:
            case M6502_MN.RMB2:
            case M6502_MN.RMB3:
            case M6502_MN.RMB4:
            case M6502_MN.RMB5:
            case M6502_MN.RMB6:
            case M6502_MN.RMB7:
                this.RMB(opcode_info.opcode >>> 4, out_reg);
                break;
            case M6502_MN.SMB0:
            case M6502_MN.SMB1:
            case M6502_MN.SMB2:
            case M6502_MN.SMB3:
            case M6502_MN.SMB4:
            case M6502_MN.SMB5:
            case M6502_MN.SMB6:
            case M6502_MN.SMB7:
                this.SMB((opcode_info.opcode - 0x80) >>> 4, out_reg);
                break;
            default:
                console.log('M6502 unhandled instruction ', ins);
                break;
        }
    }

}
/**
 * @param {string} indent
 * @param {M6502_opcode_info} opcode_info
 * @param {boolean} BCD_support
 * @param {string} INVALID_OP
 * @param {Number} final_variant
 * @param {boolean} is_C
 */
function m6502_generate_instruction_function(indent, opcode_info, BCD_support=true, INVALID_OP='', final_variant, is_C=false) {
    let r;
    let indent2 = indent + '    ';
    if (is_C) {
        indent = '';
        indent2 = '    ';
    }
    let bnum;
    let ag = new m6502_switchgen(indent2, opcode_info.opcode, BCD_support, final_variant, is_C);
    let CMOS = final_variant === M6502_VARIANTS.CMOS;
    let is_ADCSBA = (opcode_info.ins === M6502_MN.ADC) || (opcode_info.ins === M6502_MN.SBC);
    //ag.addl('// ' + opcode_info.mnemonic)
    switch(opcode_info.addr_mode) {
        case M6502_AM.ACCUM:
            ag.addcycle();
            ag.addl('pins.Addr = regs.PC;');
            ag.add_ins(opcode_info, 'regs.A');
            break;
        case M6502_AM.IMPLIED:
            switch(opcode_info.ins) {
                case M6502_MN.S_RESET:
                    ag.RESET();
                    break;
                case M6502_MN.S_NMI:
                    ag.NMI();
                    break;
                case M6502_MN.S_IRQ:
                    ag.IRQ();
                    break;
                case M6502_MN.BRK:
                    ag.BRK();
                    break;
                case M6502_MN.STP:
                    ag.STP();
                    break;
                case M6502_MN.WAI:
                    ag.WAI();
                    break;
                case M6502_MN.PHP:
                    ag.PushP();
                    break;
                case M6502_MN.PHX:
                    ag.Push('regs.X');
                    break;
                case M6502_MN.PHY:
                    ag.Push('regs.Y');
                    break;
                case M6502_MN.PLX:
                    ag.Pull('regs.X');
                    break;
                case M6502_MN.PLY:
                    ag.Pull('regs.Y');
                    break;
                case M6502_MN.CLC:
                    ag.addcycle();
                    ag.addr_to_PC();
                    ag.addl('regs.P.C = 0;');
                    break;
                case M6502_MN.PLP:
                    ag.PullP();
                    break;
                case M6502_MN.SEC:
                    ag.addcycle();
                    ag.addr_to_PC();
                    ag.addl('regs.P.C = 1;');
                    break;
                case M6502_MN.RTI:
                    ag.RTI();
                    break;
                case M6502_MN.PHA:
                    ag.Push('regs.A');
                    break;
                case M6502_MN.CLI:
                    ag.addcycle();
                    ag.addr_to_PC();
                    ag.cleanup();
                    ag.addl('regs.new_I = 0;');
                    break;
                case M6502_MN.RTS:
                    ag.RTS();
                    break;
                case M6502_MN.PLA:
                    ag.Pull('regs.A');
                    break;
                case M6502_MN.SEI:
                    ag.addcycle();
                    ag.addr_to_PC();
                    ag.cleanup();
                    ag.addl('regs.new_I = 1;');
                    break;
                case M6502_MN.DEY:
                    ag.addcycle();
                    ag.addl('pins.Addr = regs.PC;');
                    ag.DEC('regs.Y');
                    break;
                case M6502_MN.TXA:
                    ag.Transfer('regs.X', 'regs.A', 1);
                    break;
                case M6502_MN.TYA:
                    ag.Transfer('regs.Y', 'regs.A', 1);
                    break;
                case M6502_MN.TXS:
                    ag.Transfer('regs.X', 'regs.S', 0);
                    break;
                case M6502_MN.TAY:
                    ag.Transfer('regs.A', 'regs.Y', 1);
                    break;
                case M6502_MN.TAX:
                    ag.Transfer('regs.A', 'regs.X', 1);
                    break;
                case M6502_MN.CLV:
                    ag.addcycle();
                    ag.addr_to_PC();
                    ag.addl('regs.P.V = 0;');
                    break;
                case M6502_MN.TSX:
                    ag.Transfer('regs.S', 'regs.X', 1);
                    break;
                case M6502_MN.INY:
                    ag.addcycle();
                    ag.addl('pins.Addr = regs.PC;');
                    ag.INC('regs.Y');
                    break;
                case M6502_MN.DEX:
                    ag.addcycle();
                    ag.addl('pins.Addr = regs.PC;');
                    ag.DEC('regs.X');
                    break;
                case M6502_MN.CLD:
                    ag.addcycle();
                    ag.addr_to_PC();
                    ag.addl('regs.P.D = 0;');
                    break;
                case M6502_MN.INX:
                    ag.addcycle();
                    ag.addl('pins.Addr = regs.PC;');
                    ag.INC('regs.X');
                    break;
                case M6502_MN.NOP: // 1 byte 2 cycle
                    ag.addcycle();
                    ag.addl('pins.Addr = regs.PC;');
                    break;
                case M6502_MN.NOP11:  // 1 byte 1 cycle
                    ag.cleanup();
                    break;
                case M6502_MN.NOP22: // 2 byte 2 cycle
                    ag.addcycle();
                    ag.operand();
                    break;
                case M6502_MN.NOP24: // 2 byte 4 cycle
                    ag.addcycle();
                    ag.operand();
                    ag.addcycle();
                    ag.addcycle();
                    break;
                case M6502_MN.NOP34: // 3 byte 4 cycle
                    ag.addcycle();
                    ag.operand();
                    ag.addcycle();
                    ag.operand();
                    ag.addcycle();
                    break;
                case M6502_MN.NOP38: // 3 byte 8 cycle
                    ag.addcycle();
                    ag.operand();
                    ag.addcycle();
                    ag.operand();
                    ag.addcycle();
                    ag.addcycle();
                    ag.addcycle();
                    ag.addcycle();
                    ag.addcycle();
                    break;
                case M6502_MN.SED:
                    ag.addcycle();
                    ag.addr_to_PC();
                    ag.addl('regs.P.D = 1;');
                    break;
                default:
                    console.log('M6502 IMPLIED unknown ins', opcode_info);
                    break;
            }
            break;
        case M6502_AM.ZPr: // 3 cycles like LDA ZP
            ag.addcycle();
            ag.operand();
            ag.addcycle();
            ag.addr_to_ZP('pins.D');

            if (is_ADCSBA && CMOS) {
                ag.addl('if (!regs.P.D) { regs.TCU++; break; }');
                ag.addcycle('Empty cycle for D');
            }

            ag.cleanup();
            ag.add_ins(opcode_info, 'pins.D');
            break;
        case M6502_AM.ZPw: // 3 cycles like STA ZP
            ag.addcycle();
            ag.operand();

            ag.addcycle();
            ag.addr_to_ZP('pins.D');

            // Perform instruction whatever it is;
            ag.addl('pins.D = ' + M6502_XAW(opcode_info.ins) + ';');
            ag.RW(1);
            break;
        case M6502_AM.ZPm: // 5 cycles like DEC zp
            ag.addcycle('fetch ZP');
            ag.operand();

            ag.addcycle('capture data');
            ag.addr_to_ZP('pins.D');

            ag.addcycle('spurious read/write');
            if (!CMOS) ag.RW(1);

            ag.addcycle('real write');
            ag.RW(1);
            ag.add_ins(opcode_info, 'pins.D');
            break;
        case M6502_AM.ZP_Xr: // Like LDA zp, X. 4 cycles
        case M6502_AM.ZP_Yr:
            r = (opcode_info.addr_mode === M6502_AM.ZP_Xr) ? 'regs.X' : 'regs.Y';
            ag.addcycle();
            ag.operand();

            ag.addcycle('spurious read');
            ag.addl('regs.TA = (pins.D + ' + r + ') & 0xFF;');
            ag.addr_to_ZP('pins.D');

            ag.addcycle();
            ag.addl('pins.Addr = regs.TA;');

            if (is_ADCSBA && CMOS) {
                ag.addl('if (!regs.P.D) { regs.TCU++; break; }');
                ag.addcycle('Empty cycle for D');
            }

            ag.cleanup();
            ag.add_ins(opcode_info, 'pins.D');
            break;
        case M6502_AM.ZP_Xw: // Like STA zp, X. 3 cycles
        case M6502_AM.ZP_Yw:
            r = (opcode_info.addr_mode === M6502_AM.ZP_Xw) ? 'regs.X' : 'regs.Y';
            ag.addcycle();
            ag.operand();

            ag.addcycle('spurious read');
            ag.addl('pins.Addr = pins.D;')

            ag.addcycle('write data');
            ag.addl('pins.Addr = (pins.Addr + ' + r + ') & 0xFF;');
            ag.RW(1);
            ag.addl('pins.D = ' + M6502_XAW(opcode_info.ins) + ';');
            break;
        case M6502_AM.ZP_Xm: // like ROR zp, X. 6 cycles
        case M6502_AM.ZP_Ym:
            r = (opcode_info.addr_mode === M6502_AM.ZP_Xm) ? 'regs.X' : 'regs.Y';
            ag.addcycle();
            ag.operand();

            ag.addcycle('spurious read');
            ag.addl('regs.TA = (pins.D + ' + r + ') & 0xFF;');
            ag.addr_to_ZP('pins.D');

            ag.addcycle();
            ag.addl('pins.Addr = regs.TA;');

            ag.addcycle('spurious read/write');
            ag.addl('regs.TR = pins.D;');
            if (!CMOS) ag.RW(1);
            ag.add_ins(opcode_info);

            ag.addcycle();
            ag.RW(1);
            ag.addl('pins.D = regs.TR;');
            break;
        case M6502_AM.ABSr: // like LDA abs., 4 cycles
            ag.addcycle();
            ag.operand();

            ag.addcycle();
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            ag.addcycle();
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);')

            if (is_ADCSBA && CMOS) {
                ag.addl('if (!regs.P.D) { regs.TCU++; break; }');
                ag.addcycle('Empty cycle for D');
            }

            ag.cleanup();
            ag.add_ins(opcode_info, 'pins.D');
            break;
        case M6502_AM.ABSw: // like STA abs., 4 cycles
            ag.addcycle();
            ag.operand();

            ag.addcycle();
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            ag.addcycle();
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);')
            ag.addl('pins.D = ' + M6502_XAW(opcode_info.ins) + ';');
            ag.RW(1);
            break;
        case M6502_AM.ABSm: // like DEC abs., 6 cycles
            ag.addcycle();
            ag.operand();

            ag.addcycle();
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            ag.addcycle();
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);')

            ag.addcycle();
            if (!CMOS) ag.RW(1);

            ag.addcycle();
            ag.add_ins(opcode_info, 'pins.D');
            ag.RW(1);
            break;
        case M6502_AM.ABS_Xr: // Like LDA abs, X. 4-5 cycles
        case M6502_AM.ABS_Yr:
            r = (opcode_info.addr_mode === M6502_AM.ABS_Xr) ? 'regs.X' : 'regs.Y';
            ag.addcycle();
            ag.operand();

            ag.addcycle();
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            ag.addcycle();
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);')
            // Check if we have crossed a page
            ag.addl('regs.TA = (pins.Addr + ' + r + ') & 0xFFFF;');
            if (!CMOS) {
                ag.addl('if ((regs.TA & 0xFF00) ' + GENEQO + ' (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }');
                ag.addl('pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);');
            }
            else {
                if (is_ADCSBA)
                    ag.addl('if ((regs.TA & 0xFF00) ' + GENEQO + ' (pins.Addr & 0xFF00)) { regs.TCU += (regs.P.D) ? 1 : 2; pins.Addr = regs.TA; break; }');
                else
                    ag.addl('if ((regs.TA & 0xFF00) ' + GENEQO + ' (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }');

                ag.addl('pins.Addr = (regs.PC - 1) & 0xFFFF;');
            }

            ag.addcycle('optional')
            ag.addl('pins.Addr = regs.TA;');

            if (is_ADCSBA && CMOS) {
                ag.addl('if (!regs.P.D) { regs.TCU++; break; }');
                ag.addcycle('Empty cycle for D');
                ag.addl('pins.Addr = regs.TA;');
            }

            ag.cleanup();
            ag.add_ins(opcode_info, 'pins.D');
            break;
        case M6502_AM.ABS_IND_Xr: // JMP (abs,X). 6 cycles
            /*
            0: (3) ['347D', '7C', 'read']
            1: (3) ['347E', '7C', 'read']
            2: (3) ['347F', '53', 'read']
            3: (3) ['347E', '7C', 'read']
            4: (3) ['53F1', '94', 'read']
            5: (3) ['53F2', '83', 'read']
             */
            ag.addcycle('read ABSL');
            ag.operand();

            ag.addcycle('read ABSH');
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            ag.addcycle('add X');
            //ag.addl('pins.Addr = ((regs.TA + regs.X) & 0xFF) | (pins.D << 8);');
            ag.addl('pins.Addr = (pins.Addr - 1) & 0xFFFF;');
            ag.addl('regs.TA = ((regs.TA | (pins.D << 8)) + regs.X) & 0xFFFF;');

            ag.addcycle('read PCL');
            ag.addl('pins.Addr = regs.TA;');

            ag.addcycle('read PCH');
            ag.addl('regs.PC = pins.D;');
            ag.addr_inc();

            ag.cleanup();
            ag.addl('regs.PC |= pins.D << 8;');
            break;
        case M6502_AM.ABS_Xw: // Like STA abs, X. 5 cycles
        case M6502_AM.ABS_Yw:
            r = (opcode_info.addr_mode === M6502_AM.ABS_Xw) ? 'regs.X' : 'regs.Y';
            ag.addcycle('get ABSL');
            ag.operand();

            ag.addcycle('get ABSH');
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            ag.addcycle('idle incorrect');
            ag.addl('regs.TA |= pins.D << 8;');
            if (!CMOS) ag.addl('pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + ' + r + ') & 0xFF);');
            else ag.addl('pins.Addr = (regs.PC - 1) & 0xFFFF;');

            ag.addcycle();
            ag.addl('pins.Addr = (regs.TA + ' + r + ') & 0xFFFF;');
            ag.RW(1);
            ag.addl('pins.D = ' + M6502_XAW(opcode_info.ins) + ';');
            break;
        case M6502_AM.ABS_Xm: // Like ASL abs, X  7 cycles NMOS, 7/6 if same page CMOS
        case M6502_AM.ABS_Ym:
            r = (opcode_info.addr_mode === M6502_AM.ABS_Xm) ? 'regs.X' : 'regs.Y';
            ag.addcycle();
            ag.operand();

            ag.addcycle();
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            if (!CMOS) { // not CMOS or DEC or INC
                ag.addcycle('spurious read');
                ag.addl('regs.TA |= pins.D << 8;');
                ag.addl('pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + ' + r + ') & 0xFF);');

                ag.addcycle('real read');
                ag.addl('pins.Addr = (regs.TA + ' + r + ') & 0xFFFF;');
            }

            else if (CMOS && !M65C02_TEST_ABS_Xm(opcode_info.ins)) { // CMOS and not DEC or INC
                ag.addcycle();
                ag.addl('regs.TA |= pins.D << 8;');
                ag.addl('regs.TR = (regs.TA + ' + r + ') & 0xFFFF;');
                ag.addl('if ((regs.TA & 0xFF00) ' + GENEQO + ' (regs.TR & 0xFF00)) { pins.Addr = regs.TR;  regs.TCU++; break; }');
                ag.addl('pins.Addr = (regs.PC - 1) & 0xFFFF;');

                ag.addcycle()
                ag.addl('pins.Addr = regs.TR;');
            }
            else { // CMOS and DEC or INC
                ag.addcycle('spurious read');
                ag.addl('regs.TA |= pins.D << 8;');
                ag.addl('pins.Addr = (regs.PC - 1) & 0xFFFF;');

                ag.addcycle('real read');
                ag.addl('pins.Addr = (regs.TA + ' + r + ') & 0xFFFF;');

            }

            ag.addcycle('spurious read/write');
            ag.addl('regs.TR = pins.D;');
            if (!CMOS) ag.RW(1);

            ag.addcycle();
            ag.add_ins(opcode_info);
            ag.RW(1);
            ag.addl('pins.D = regs.TR;');
            break;
        case M6502_AM.INDjmp: // JMP ($abs) 5 cycles
            ag.addcycle('read ABSL');
            ag.operand();

            ag.addcycle('read ABSH');
            ag.operand();
            ag.addl('regs.TA = pins.D;');

            ag.addcycle('read PCL');
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);');

            ag.addcycle('read PCH');
            ag.addl('regs.PC = pins.D;');
            if (!CMOS) ag.addr_inc_wrap();
            else {
                ag.addl('regs.TA = (pins.Addr + 1) & 0xFFFF;');
                ag.addl('pins.Addr = (pins.Addr & 0xFF00) | ((pins.Addr + 1) & 0xFF);');

                ag.addcycle('extra cycle for CMOS page increment');
                ag.addl('pins.Addr = regs.TA;');
            }

            ag.cleanup();
            ag.addl('regs.PC |= pins.D << 8;');
            break;
        case M6502_AM.ABSjmp:
            ag.addcycle();
            ag.operand();

            ag.addcycle();
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            ag.cleanup();
            ag.addl('regs.PC = regs.TA | (pins.D << 8);');
            break;
        case M6502_AM.ABSjsr:
            ag.addcycle(); // 2
            ag.operand();

            ag.addcycle('spurious stack read'); // 3
            ag.addl('regs.TA = pins.D;');
            ag.addl('regs.TR = regs.PC;');
            ag.addr_to_S_then_dec();

            ag.addcycle('stack write PCH'); // 4
            ag.RW(1);
            ag.addl('pins.D = (regs.PC & 0xFF00) >>> 8;');

            ag.addcycle('stack write PCL'); // 5
            ag.addr_to_S_then_dec();
            ag.addl('pins.D = regs.PC & 0xFF;');

            ag.addcycle(); // 6 fetch last one
            ag.addl('pins.Addr = regs.TR;');
            ag.RW(0);

            ag.cleanup();
            ag.addl('regs.PC = regs.TA | (pins.D << 8);');
            break;
        case M6502_AM.IMM:
            ag.addcycle();
            ag.operand();

            if (is_ADCSBA && CMOS) {
                ag.addl('if (!regs.P.D) { regs.TCU++; break; }');
                ag.addcycle('Empty cycle for D');
            }

            ag.cleanup();
            ag.add_ins(opcode_info, 'pins.D');
            break;
        case M6502_AM.IND: // This is a JMP
            ag.addcycle();
            ag.operand();

            ag.addcycle();
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            ag.addcycle();
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);');

            ag.addcycle();
            ag.addl('regs.TA = (pins.D + 1) & 0xFF;');

            ag.cleanup();
            ag.addl('regs.PC = (pins.D << 8) | regs.TA;');
            break;
        case M6502_AM.X_INDr: // like ORA (oper,X) 6 cycles
            ag.addcycle();
            ag.operand();

            ag.addcycle('spurious read');
            ag.addl('pins.Addr = pins.D;');
            ag.addl('regs.TA = (pins.D + regs.X) & 0xFF;');

            ag.addcycle('real read ABS L');
            ag.addl('pins.Addr = regs.TA;');

            ag.addcycle('read ABS H');
            ag.addl('regs.TA = pins.D;');
            ag.addr_inc_ZP();

            ag.addcycle('Read from addr');
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);');

            if (is_ADCSBA && CMOS) {
                ag.addl('if (!regs.P.D) { regs.TCU++; break; }');
                ag.addcycle('Empty cycle for D');
            }

            ag.cleanup('Do ALU');
            ag.add_ins(opcode_info, 'pins.D');
            break;
        case M6502_AM.X_INDw: // Like STA (oper,X) 6 cycles
            ag.addcycle();
            ag.operand();

            ag.addcycle('spurious read');
            ag.addl('pins.Addr = pins.D;');
            ag.addl('regs.TA = (pins.D + regs.X) & 0xFF;');

            ag.addcycle('real read ABS L');
            ag.addl('pins.Addr = regs.TA;');

            ag.addcycle('read ABS H');
            ag.addl('regs.TA = pins.D;');
            ag.addr_inc_ZP();

            ag.addcycle('Write result to addr');
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);');
            ag.addl('pins.D = ' + M6502_XAW(opcode_info.ins) + ';');
            ag.RW(1);
            break;
        case M6502_AM.ZP_INDr: // 5 cycles, 6 if ADC/SBC. this is 65C02-only
            ag.addcycle();
            ag.operand();

            ag.addcycle('real read ABS L');
            ag.addl('pins.Addr = pins.D;');

            ag.addcycle('read ABS H');
            ag.addl('regs.TA = pins.D;');
            ag.addr_inc_ZP();

            ag.addcycle('Read from addr');
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);');

            if (is_ADCSBA && CMOS) {
                ag.addl('if (!regs.P.D) { regs.TCU++; break; }');
                ag.addcycle('Empty cycle for D');
            }

            ag.cleanup('Do ALU');
            ag.add_ins(opcode_info, 'pins.D');
            break;
        case M6502_AM.ZP_INDw: // 5 cycles, 6 if ADC/SBC
            ag.addcycle();
            ag.operand();

            ag.addcycle('real read ABS L');
            ag.addl('pins.Addr = pins.D;');

            ag.addcycle('read ABS H');
            ag.addl('regs.TA = pins.D;');
            ag.addr_inc_ZP();

            ag.addcycle('Write to addr');
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);');
            ag.RW(1);
            ag.addl('pins.D = ' + M6502_XAW(opcode_info.ins) + ';');
            break;
        case M6502_AM.X_INDm: // For undocumented opcodes
            console.log('X_INDm not implemented for opcode ' + hex0x2(opcode_info.opcode));
            break;
        case M6502_AM.IND_Ym: // For undocumented opcodes
            console.log('IND_Ym not implemented for opcode ' + hex0x2(opcode_info.opcode));
            break;
        case M6502_AM.IND_Yr: // Like LDA (oper), Y 5-6 cycles
            ag.addcycle('Get ZP');
            ag.operand();

            ag.addcycle('get ABS L');
            ag.addl('pins.Addr = pins.D;');

            ag.addcycle('get ABS H');
            ag.addl('regs.TR = pins.D;');
            ag.addl('regs.TA = pins.D + regs.Y;')
            ag.addr_inc_ZP();

            ag.addcycle('idle if crossed')
            // top of before, bottom of after (+Y)
            ag.addl('regs.TR = (regs.TR + (pins.D << 8)) & 0xFFFF;'); // before
            ag.addl('regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;'); // after

            if (!CMOS) {
                ag.addl('if ((regs.TR & 0xFF00) ' + GENEQO + ' (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }');
                ag.addl('pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);');
            }
            else {
                if (is_ADCSBA)
                    ag.addl('if ((regs.TR & 0xFF00) ' + GENEQO + ' (regs.TA & 0xFF00)) { regs.TCU += (regs.P.D) ? 1 : 2; pins.Addr = regs.TA; break; }');
                else
                    ag.addl('if ((regs.TR & 0xFF00) ' + GENEQO + ' (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }');
                ag.addl('pins.Addr = (regs.PC - 1) & 0xFFFF;');
            }

            ag.addcycle();
            ag.addl('pins.Addr = regs.TA;');

            if (is_ADCSBA && CMOS) {
                ag.addl('if (!regs.P.D) { regs.TCU++; break; }');
                ag.addcycle('Empty cycle for D');
                ag.addl('pins.Addr = regs.TA;');
            }

            ag.cleanup();
            ag.add_ins(opcode_info, 'pins.D');
            break;
        case M6502_AM.IND_Yw: // Like STA (oper), Y  6 cycles
            ag.addcycle('get ZP');
            ag.operand();

            ag.addcycle('get ABS L');
            ag.addl('pins.Addr = pins.D;');

            ag.addcycle('get ABS H');
            ag.addl('regs.TA = pins.D + regs.Y;');
            ag.addl('regs.TR = (pins.D + regs.Y) & 0xFF;');
            ag.addr_inc_ZP();

            ag.addcycle('always idle');
            ag.addl('regs.TA = (regs.TA + (pins.D << 8)) & 0xFFFF;');
            if (!CMOS) ag.addl('pins.Addr = (pins.D << 8) | regs.TR;');
            else ag.addl('pins.Addr = (regs.PC - 1) & 0xFFFF;');

            ag.addcycle('write data')
            ag.addl('pins.Addr = regs.TA;')
            ag.RW(1);
            ag.addl('pins.D = ' + M6502_XAW(opcode_info.ins) + ';');
            break;
        case M6502_AM.PC_REL_ZP: // For branch bit test instructions. 5, 6, 7 cycles
            switch(opcode_info.ins) {
                case M6502_MN.BBR0:
                case M6502_MN.BBR1:
                case M6502_MN.BBR2:
                case M6502_MN.BBR3:
                case M6502_MN.BBR4:
                case M6502_MN.BBR5:
                case M6502_MN.BBR6:
                case M6502_MN.BBR7:
                    bnum = opcode_info.opcode >>> 4;
                    bnum = 1 << bnum;
                    r = '!(pins.D & ' + hex0x2(bnum) + ')';
                    break;
                case M6502_MN.BBS0:
                case M6502_MN.BBS1:
                case M6502_MN.BBS2:
                case M6502_MN.BBS3:
                case M6502_MN.BBS4:
                case M6502_MN.BBS5:
                case M6502_MN.BBS6:
                case M6502_MN.BBS7:
                    bnum = (opcode_info.opcode - 0x80) >>> 4;
                    bnum = 1 << bnum;
                    r = '!!(pins.D & ' + hex0x2(bnum) + ')';
                    break;
                default:
                    console.log('Unknown PC_REL_ZP instructions');
                    break;
            }
            ag.BRAZP('regs.TR = ' + r + ';');
            break;
        case M6502_AM.PC_REL: // For branch instructions.
            // 2 cycles
            // 3 if branch taken, same page
            // 4 if branch taken, different page
            switch(opcode_info.ins) {
                case M6502_MN.BPL:
                    r = 'regs.P.N ' + GENEQO + ' 0';
                    break;
                case M6502_MN.BMI:
                    r = 'regs.P.N ' + GENEQO + ' 1';
                    break;
                case M6502_MN.BVC:
                    r = 'regs.P.V ' + GENEQO + ' 0';
                    break;
                case M6502_MN.BVS:
                    r = 'regs.P.V ' + GENEQO + ' 1';
                    break;
                case M6502_MN.BCC:
                    r = 'regs.P.C ' + GENEQO + ' 0';
                    break;
                case M6502_MN.BCS:
                    r = 'regs.P.C ' + GENEQO + ' 1';
                    break;
                case M6502_MN.BNE:
                    r = 'regs.P.Z ' + GENEQO + ' 0';
                    break;
                case M6502_MN.BEQ:
                    r = 'regs.P.Z ' + GENEQO + ' 1';
                    break;
                case M6502_MN.BRA:
                    ag.BRAA();
                    r = false;
                    break;
                default:
                    console.log('M6502 Unknown case PC relative addressing', opcode_info.ins);
                    return '';
            }
            if (r !== false) ag.BRA('regs.TR = +(' + r + ');');
            break;
        case M6502_AM.NONE:
            ag.addl('// Invalid operation')
            ag.addl(INVALID_OP);
            break;
        default:
            console.log('M6502 unknown address mode', opcode_info.addr_mode, 'on opcode', opcode_info);
            break;
    }
    if (GENTARGET === 'js')
        return 'function(regs, pins) { //' + opcode_info.mnemonic + '\n' + ag.finished() + indent + '}';
    else if (GENTARGET === 'as') {
        return 'function(regs: m6502_regs, pins: m6502_pins): void { // ' + opcode_info.mnemonic + '\n' + ag.finished() + indent + '}';
    }
    else if (GENTARGET === 'c') {
        return ag.finished() + '}';
    }
}

function generate_6502_core(variant_list, final_variant, output_name, BCD_SUPPORT, INVALID_OP, is_C=false) {
    let opc_matrix = final_m6502_opcode_matrix(variant_list);
    let outstr = '"use strict";\n\nconst ' + output_name + ' = Object.freeze({\n';
    let indent = '    ';
    let firstin = false;
    for (let i = 0; i <= M6502_MAX_OPCODE; i++) {
        let mystr = indent + hex0x2(i) + ': new M6502_opcode_functions(';
        let opc = opc_matrix[i];
        mystr += str_m6502_ocode_matrix(opc.opcode, opc.variant) + ',\n';
        let r = m6502_generate_instruction_function(indent, opc_matrix[i], BCD_SUPPORT, INVALID_OP, final_variant, is_C);
        mystr += '        ' + r + ')';
        if (firstin)
            outstr += ',\n';
        firstin = true;
        outstr += mystr;
    }
    outstr += '\n});';
    return outstr;
}

function generate_6502_core_as(variant_list, final_variant, output_name, BCD_SUPPORT, INVALID_OP, is_C=false) {
    let opc_matrix = final_m6502_opcode_matrix(variant_list);
    let outstr = 'import {M6502_opcode_functions, M6502_stock_matrix, M6502_invalid_matrix, M6502_MAX_OPCODE} from "../../../component/cpu/m6502/m6502_opcodes";\n' +
        'import {m6502_pins, m6502_regs} from "../../../component/cpu/m6502/m6502";\n'
    outstr += 'import {mksigned8} from "../../../helpers/helpers"\n'
    outstr += '\nexport var ' + output_name + ': Array<M6502_opcode_functions> = new Array<M6502_opcode_functions>(M6502_MAX_OPCODE+1);';
    outstr += '\n\nfunction nesm6502_get_opcode_function(opcode: u32): M6502_opcode_functions {';
    outstr += '\n    switch(opcode) {\n'
    let indent = '        ';
    let firstin = false;
    for (let i = 0; i <= M6502_MAX_OPCODE; i++) {
    //for (let i = 0; i <= 5; i++) {
        let mystr = indent + 'case ' + hex0x2(i) + ': return new M6502_opcode_functions(';
        let opc = opc_matrix[i];
        mystr += str_m6502_ocode_matrix(opc.opcode, opc.variant) + ',\n';
        let r = m6502_generate_instruction_function(indent, opc_matrix[i], BCD_SUPPORT, INVALID_OP, final_variant, is_C);
        mystr += '            ' + r + ');';
        if (firstin)
            outstr += '\n';
        firstin = true;
        outstr += mystr;
    }
    outstr += '\n    }';
    outstr += "\n    return new M6502_opcode_functions(M6502_invalid_matrix.get(opcode), function(regs: m6502_regs, pins: m6502_pins): void { console.log('INVALID OPCODE');});";
    outstr += '\n}'
    outstr += '\n\nfor (let i = 0; i <= M6502_MAX_OPCODE; i++) {';
    outstr += '\n    ' + output_name + '[i] = nesm6502_get_opcode_function(i);';
    outstr += '\n}\n'
    return outstr;
}

function generate_6502_core_c(variant_list, final_variant, output_name, BCD_SUPPORT, INVALID_OP, is_C=true) {
    let opc_matrix = final_m6502_opcode_matrix(variant_list);
    let outstr = '#include "helpers/int.h"\n' +
        '#include "nesm6502_opcodes.h"\n' +
        '#include "m6502.h"\n' +
        '\n' +
        '// This file auto-generated by m6502_core_generator.js in JSMoo\n' +
        '\n';
    let indent = '    ';
    let firstin = false;
    for (let i in opc_matrix) {
        let opc = opc_matrix[i];
        if (opc.ins === M6502_MN.NONE) continue;
        let mystr = M6502_C_func_signature(opc) + '\n{\n';
        // opcode, ins, addr_mode, mnemonic, variant
        let r = m6502_generate_instruction_function(indent, opc, BCD_SUPPORT, INVALID_OP, final_variant, is_C);
        mystr += r + '\n';
        if (firstin)
            outstr += '\n';
        firstin = true;
        outstr += mystr;
    }
    outstr += '\n';
    return outstr;
}


/*
{
    for (let i in opc_matrix) {
        mystr += str_m6502_ocode_matrix(opc.opcode, opc.variant) + ',\n';
        let r = m6502_generate_instruction_function(indent, opc_matrix[i], BCD_SUPPORT, INVALID_OP, final_variant, is_C);
        mystr += '        ' + r + ')';
        if (firstin)
            outstr += ',\n';
        firstin = true;
        outstr += mystr;
    }
    outstr += '\n});';
    return outstr;
}*/

function generate_nes6502_core_as() {
    return generate_6502_core_as([M6502_VARIANTS.STOCK], M6502_VARIANTS.STOCK, 'nesm6502_opcodes_decoded', false, '');
}

function generate_nesm6502_core_c(is_C=true) {
    return generate_6502_core_c([M6502_VARIANTS.STOCK], M6502_VARIANTS.STOCK, 'nesm6502_opcodes_decoded', false, '', true);
}

    function generate_nesm6502_c(is_C=true) {
    set_gentarget('c');
    save_js('nesm6502_opcodes.c', generate_nesm6502_core_c());
}

function generate_6502_cmos_core() {
    return generate_6502_core([M6502_VARIANTS.STOCK, M6502_VARIANTS.CMOS], M6502_VARIANTS.CMOS, 'm65c02_opcodes_decoded', true, '');
}

function M6502_opcode_func_gen_c(variant_list, final_variant, output_name, BCD_SUPPORT, INVALID_OP, is_C=true) {
/*    let outstr = '#include "helpers/int.h"\n' +
        '#include "m6502_opcodes.h"\n' +
        '#include "sm83.h"\n' +
        '\n' +
        '// This file auto-generated by m6502_core_generator.js in JSMoo\n' +
        '\n';
    let indent = '    ';
    let firstin = false;*/
    let opc_matrix = final_m6502_opcode_matrix(variant_list);
    let o = 'void M6502_ins_NONE(struct M6502_regs *regs, struct M6502_pins *pins);\n';
    let o2 = "M6502_ins_func M6502_decoded_opcodes[0x103] = {\n";
    let perline = 0;
    let last_i = 0;
    for (let i in opc_matrix) {
        let mo = opc_matrix[i];
        let mystr='';
        if (mo.ins === M6502_MN.NONE) {
            o2 += '  &M6502_ins_NONE,';
        }
        else {
            mystr = M6502_C_func_dec(mo);
            o2 += '  &' + M6502_C_func_name(mo) + ',';
        }
        perline++;
        if (perline === 5) {
            perline = 0;
            o2 += '\n';
        }
        else o2 += ' ';
        o += mystr;
    }
    o2 += '\n};\n';

    let header = '#ifndef _JSMOOCH_M6502_OPCODES_H\n' +
        '#define _JSMOOCH_M6502_OPCODES_H\n' +
        '\n' +
        '#include "m6502_misc.h"\n' +
        '\n' +
        '// This file mostly generated by m6502_core_generator.js in JSMoo\n' +
        '\n'

    return header + o + '\n' + o2 + '\n#endif\n';
}
//console.log(M6502_opcode_func_gen_c([M6502_VARIANTS.STOCK], M6502_VARIANTS.STOCK, 'nesm6502_opcodes_decoded', false, ''));
