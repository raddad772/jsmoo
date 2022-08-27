"use strict";

function str_m6502_ocode_matrix(opc, variant) {
    let opc2 = hex0x2(opc);
    switch(M6502_VARIANTS_R[variant]) {
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
}

function final_m6502_opcode_matrix(variant_list) {
    let output_matrix = [];
    for (let v in variant_list) {
        for (let i = 0; i <= M6502_MAX_OPCODE; i++) {
            switch (M6502_VARIANTS_R[v]) {
                case 'stock':
                    output_matrix[i] = M6502_stock_matrix[i];
                    break;
                case 'stock_undocumented':
                    output_matrix[i] = M6502_undocumented_matrix[i];
                    break;
                /*case 'cmos':
                    output_matrix[i] = M6502_cmos_matrix[i];
                    break;*/
                default:
                    console.log('WHAT !?', variant_list);
                    break;
            }
        }
    }
    for (let i = 0; i <= M6502_MAX_OPCODE; i++) {
        if (typeof output_matrix[i] === 'undefined')
            output_matrix[i] = M6502_invalid_matrix[i];
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
    constructor(indent, what, BCD_support) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.in_case = false;
        this.last_case = 0;
        this.has_footer = false;
        this.no_addr_at_end = false;
        this.no_RW_at_end = false;
        this.BCD_support = BCD_support;
        this.has_custom_end = false;
        this.outstr = '';

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
        this.outstr = this.indent1 + 'switch(regs.TCU) {\n';

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
        this.outstr += this.indent3 + what + '\n';
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
        this.addl('regs.P.Z = +((' + what + ') === 0);');
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

    BRK(vector='0xFFFE', set_b=true, add_one_to_pc=false) {
        this.addcycle();
        this.addl('regs.P.B = ' + (+set_b) + ';');
        this.operand();

        this.addcycle();
        this.addr_to_S_then_dec();
        if (add_one_to_pc) this.addl('regs.TR = (regs.PC - 2) & 0xFFFF;');
        else this.addl('regs.TR = regs.PC');
        this.addl('pins.D = (regs.TR >>> 8) & 0xFF;');
        this.RW(1);

        this.addcycle();
        this.addr_to_S_then_dec();
        this.addl('pins.D = regs.TR & 0xFF;');
        this.RW(1);

        this.addcycle();
        this.addr_to_S_then_dec();
        this.addl('pins.D = regs.P.getbyte();');
        this.RW(1);

        this.addcycle();
        this.addl('regs.P.B = 1; // Confirmed via Visual6502 that this bit is actually set always during NMI, IRQ, and BRK');
        this.addl('regs.P.I = 1;');
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
        this.addl('pins.D = regs.P.getbyte() | 0x20;');
        this.addl('regs.P.I = 1;');

        this.addcycle();
        this.RW(0);
        this.addl('pins.Addr = ' + vector + ';');

        this.addcycle();
        this.addl('regs.TA = pins.D');
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
        this.addl('pins.D = ' + what);
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
        this.addl('regs.P.setbyte(pins.D);');
    }

    PushP() {
        this.addcycle();
        this.addl('pins.Addr = regs.PC;');
        this.addcycle();
        this.addr_to_S_then_dec();
        this.addl('pins.D = regs.P.getbyte() | 0x30;');
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
        this.addl('regs.P.setbyte(pins.D);');
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
        this.addl('let o;');
        this.addl('let i = ' + what + ';');
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

    CMP(what, from='regs.TR') { // CPX, CPY too
        this.addl('let o = ' + what + ' - ' + from + ';');
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
        this.addl('let c = regs.P.C;');
        this.addl('regs.P.C = (' + what + ' & 0x80) >>> 7;');
        this.addl(what + ' = ((' + what + ' << 1) | c) & 0xFF;');
        this.setz(what);
        this.setn(what);
    }

    ROR(what='regs.TR') {
        this.addl('let c = regs.P.C;');
        this.addl('regs.P.C = ' + what + ' & 1;');
        this.addl(what + ' = (c << 7) | (' + what + ' >>> 1);');
        this.setz(what);
        this.setn(what);
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
        this.addl('regs.TA = (regs.PC + mksigned8(pins.D)) & 0xFFFF;');
        this.addl('pins.Addr = regs.PC;');
        this.addl('if ((regs.TA & 0xFF00) === (regs.PC & 0xFF00)) { regs.TCU++; break; } // Skip to end if same page');

        this.addcycle('extra idle on page cross');
        this.addl('pins.Addr = (regs.PC & 0xFF00) | (regs.TA & 0xFF);');

        this.cleanup();
        this.addl('regs.PC = regs.TA;');
    }

    SBC(what='regs.TR') {
        this.addl('let i = (~' + what + ') & 0xFF;');

        if (!this.BCD_support) {
            this.addl('let o = regs.A + i + regs.P.C;');
            this.addl('regs.P.V = ((~(regs.A ^ i)) & (regs.A ^ o) & 0x80) >>> 7;');
        } else {
            alert('SBC not implemented for decimal mode yet');
        }
        this.addl('regs.P.C = +(o > 0xFF);');
        this.addl('regs.A = o & 0xFF;');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    /**
     * @param {M6502_opcode_info} opcode_info
     * @param out_reg
     */
    add_ins(opcode_info, out_reg='regs.TR') {
        let ins = opcode_info.ins;
        switch(ins) {
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
 */
function m6502_generate_instruction_function(indent, opcode_info, BCD_support=true, INVALID_OP='') {
    let r;
    let indent2 = indent + '    ';
    let ag = new m6502_switchgen(indent2, opcode_info.opcode, BCD_support);
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
                case M6502_MN.PHP:
                    ag.PushP();
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
                    ag.addl('regs.P.I = 0;');
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
                    ag.addl('regs.P.I = 1;');
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
                case M6502_MN.NOP:
                    ag.addcycle();
                    ag.addl('pins.Addr = regs.PC;');
                    break;
                case M6502_MN.SED:
                    ag.addcycle();
                    ag.addr_to_PC();
                    ag.addl('regs.P.D = 1;');
                    break;
                default:
                    console.log('M6502 IMPLIED unknown ins', opcode_info.ins);
                    break;
            }
            break;
        case M6502_AM.ZPr: // 3 cycles like LDA ZP
            ag.addcycle();
            ag.operand();
            ag.addcycle();
            ag.addr_to_ZP('pins.D');
            ag.cleanup();
            ag.addl('regs.TR = pins.D;');
            ag.add_ins(opcode_info);
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

            ag.addcycle('spurious write');
            ag.RW(1);

            ag.addcycle('real write');
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

            ag.cleanup();
            //ag.addl('regs.TR = pins.D;');
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

            ag.addcycle('spurious write');
            ag.addl('regs.TR = pins.D;');
            ag.RW(1);
            ag.add_ins(opcode_info);

            ag.addcycle();
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
            ag.addl('regs.TR = pins.D;');
            ag.RW(1);

            ag.addcycle();
            ag.add_ins(opcode_info);
            ag.addl('pins.D = regs.TR');
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
            ag.addl('if ((regs.TA & 0xFF00) === (pins.Addr & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }');
            ag.addl('pins.Addr = (pins.D << 8) | (regs.TA & 0xFF);');

            ag.addcycle('optional')
            ag.addl('pins.Addr = regs.TA;');

            ag.cleanup();
            ag.add_ins(opcode_info, 'pins.D');
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
            ag.addl('pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + ' + r + ') & 0xFF);');

            ag.addcycle();
            ag.addl('pins.Addr = (regs.TA + ' + r + ') & 0xFFFF;');
            ag.RW(1);
            ag.addl('pins.D = ' + M6502_XAW(opcode_info.ins) + ';');
            break;
        case M6502_AM.ABS_Xm: // Like ASL abs, X  7 cycles
        case M6502_AM.ABS_Ym:
            r = (opcode_info.addr_mode === M6502_AM.ABS_Xm) ? 'regs.X' : 'regs.Y';
            ag.addcycle();
            ag.operand();

            ag.addcycle();
            ag.addl('regs.TA = pins.D;');
            ag.operand();

            ag.addcycle('spurious read');
            ag.addl('regs.TA |= pins.D << 8;');
            ag.addl('pins.Addr = (regs.TA & 0xFF00) | ((regs.TA + ' + r + ') & 0xFF);');

            ag.addcycle('real read');
            ag.addl('pins.Addr = (regs.TA + ' + r + ') & 0xFFFF;');

            ag.addcycle();
            ag.addl('regs.TR = pins.D');
            ag.RW(1);

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
            ag.addl('regs.TA = pins.D');

            ag.addcycle('read PCL');
            ag.addl('pins.Addr = regs.TA | (pins.D << 8);');

            ag.addcycle('read PCH');
            ag.addl('regs.PC = pins.D;');
            ag.addr_inc_wrap();

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
            /*
For JSR abs
0x20

Neither you nor Higan does what Visual6502 does.

At address 0000, put in
20 40 60

aka JSR $6040

Cycle 1 decode instruction, fetch $00
Cycle 2 fetch $01 ($40)
Cycle 3 spurious read of stack
Cycle 4 write stack
Cycle 5 write stack
Cycle 6 fetch $02 ($60)
(Cycle 7->correct PC of 6040)
             */
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

            ag.cleanup();
            ag.addl('regs.TR = pins.D;');
            ag.add_ins(opcode_info);
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

            ag.cleanup('Do ALU');
            ag.addl('regs.TR = pins.D;');
            ag.add_ins(opcode_info);
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

            ag.addl('if ((regs.TR & 0xFF00) === (regs.TA & 0xFF00)) { regs.TCU++; pins.Addr = regs.TA; break; }');
            ag.addl('pins.Addr = (regs.TR & 0xFF00) | (regs.TA & 0xFF);');

            ag.addcycle();
            ag.addl('pins.Addr = regs.TA;');

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
            ag.addl('pins.Addr = (pins.D << 8) | regs.TR;');

            ag.addcycle('write data')
            ag.addl('pins.Addr = regs.TA;')
            ag.RW(1);
            ag.addl('pins.D = ' + M6502_XAW(opcode_info.ins) + ';');
            break;
        case M6502_AM.PC_REL: // For branch instructions.
            // 2 cycles
            // 3 if branch taken, same page
            // 4 if branch taken, different page
            switch(opcode_info.ins) {
                case M6502_MN.BPL:
                    r = 'regs.P.N === 0';
                    break;
                case M6502_MN.BMI:
                    r = 'regs.P.N === 1';
                    break;
                case M6502_MN.BVC:
                    r = 'regs.P.V === 0';
                    break;
                case M6502_MN.BVS:
                    r = 'regs.P.V === 1';
                    break;
                case M6502_MN.BCC:
                    r = 'regs.P.C === 0';
                    break;
                case M6502_MN.BCS:
                    r = 'regs.P.C === 1';
                    break;
                case M6502_MN.BNE:
                    r = 'regs.P.Z === 0';
                    break;
                case M6502_MN.BEQ:
                    r = 'regs.P.Z === 1';
                    break;
                default:
                    console.log('M6502 Unknown case PC relative addressing');
                    return '';
            }
            ag.BRA('regs.TR = +(' + r + ');');
            break;
        case M6502_AM.NONE:
            ag.addl('// Invalid operation')
            ag.addl(INVALID_OP);
            break;
        default:
            console.log('M6502 unknown address mode', opcode_info.addr_mode, 'on opcode', opcode_info);
            break;
    }
    return 'function(regs, pins) { //' + opcode_info.mnemonic + '\n' + ag.finished() + indent + '}';
}


// Undocumented included, you'd want to pass [M6502_VARIANTS.STOCK_UNDOCUMENTED, M6502_VARIANTS.STOCK]
function generate_nes6502_core(INVALID_OP) {
    let R2A03_matrix = final_m6502_opcode_matrix([M6502_VARIANTS.STOCK]);
    let outstr = '"use strict";\n\nconst nesm6502_opcodes_decoded = Object.freeze({\n';
    let indent = '    ';
    let firstin = false;
    for (let i = 0; i <= M6502_MAX_OPCODE; i++) {
        let mystr = indent + hex0x2(i) + ': new M6502_opcode_functions(';
        let opc = R2A03_matrix[i];
        mystr += str_m6502_ocode_matrix(opc.opcode, opc.variant) + ',\n';
        let r = m6502_generate_instruction_function(indent, R2A03_matrix[i], false, INVALID_OP);
        mystr += '        ' + r + ')';
        if (firstin)
            outstr += ',\n';
        firstin = true;
        outstr += mystr;
    }
    outstr += '\n});'
    return outstr;
}

//console.log(generate_nes6502_core());