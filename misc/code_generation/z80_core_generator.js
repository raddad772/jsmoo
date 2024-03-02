"use strict";

// opcode
// prefix
// two-prefix

//import {Z80_prefix_to_codemap, Z80_prefixes} from "../../as-emu-cores/assembly/component/cpu/z80/z80_opcodes";

const Z80_matrix_size = Z80_MAX_OPCODE * Z80_prefixes.length;

function Z80replace_for_C(whatr) {
    whatr = whatr.replaceAll('regs.exchange_shadow_af()', 'Z80_regs_exchange_shadow_af(regs)')
    whatr = whatr.replaceAll('regs.exchange_shadow()', 'Z80_regs_exchange_shadow(regs)');
    whatr = whatr.replaceAll('regs.exchange_de_hl()', 'Z80_regs_exchange_de_hl(regs)')
    whatr = whatr.replaceAll('regs.exchange_shadow_af()', 'Z80_regs_exchange_shadow_af(regs)')
    whatr = whatr.replaceAll('Z80P.', 'Z80P_')
    whatr = whatr.replaceAll('regs.F.setbyte(', 'Z80_regs_F_setbyte(&regs->F, ');
    whatr = whatr.replaceAll('regs.F.getbyte()', 'Z80_regs_F_getbyte(&regs->F)');
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

class Z80_get_opc_by_prefix_ret {
    constructor(opc, sub) {
        this.opc = opc;
        this.sub = sub;
    }
}

function Z80hacksub(arg, sub) {
    if (arg === 'HL') {
        switch(sub) {
            case 'IX':
                return 'IX';
            case 'IY':
                return 'IY';
        }
    }
    if (arg === 'H') {
        switch(sub) {
            case 'IX':
                return 'IXH';
            case 'IY':
                return 'IYH';
        }
    }
    if (arg === 'L') {
        switch(sub) {
            case 'IX':
                return 'IXL';
            case 'IY':
                return 'IYL';
        }
    }
    return arg;
}

function Z80_get_opc_by_prefix(prfx, i) {
    switch(prfx) {
        case 0:
            return new Z80_get_opc_by_prefix_ret(Z80_opcode_matrix[i], null);
        case 0xCB:
            return new Z80_get_opc_by_prefix_ret(Z80_CB_opcode_matrix[i], null);
        case 0xDD: // Substitute IX
            return new Z80_get_opc_by_prefix_ret(Z80_opcode_matrix[i], 'IX');
        case 0xED:
            return new Z80_get_opc_by_prefix_ret(Z80_ED_opcode_matrix[i], null);
        case 0xFD: // Substitute IY
            return new Z80_get_opc_by_prefix_ret(Z80_opcode_matrix[i], 'IY');
        case 0xDDCB: // CBd but with substitute IX+d
            return new Z80_get_opc_by_prefix_ret(Z80_CBd_opcode_matrix[i], 'IX');
        case 0xFDCB:
            return new Z80_get_opc_by_prefix_ret(Z80_CBd_opcode_matrix[i], 'IY');
        default:
            console.log('WHAT?', hex2(prfx), hex2(i));
            return;
    }
}

class Z80_switchgen {
    constructor(indent, what, sub, is_C) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.in_case = false;
        this.last_case = 0;
        this.exclude_EI = false;
        this.added_lines = 0;
        this.has_footer = false;
        this.no_addr_at_end = false;
        if (!is_C)
            this.outstr = this.indent1 + 'switch(regs.TCU) {\n';
        else
            this.outstr = this.indent1 + 'switch(regs->TCU) {\n';
        this.has_cycle = false;
        this.on_cycle = [];
        this.is_C = is_C;

        this.old_wr = 0;
        this.old_rd = 0;
        this.old_io = 0;
        this.old_mrq = 0;

        this.opcode_info = what;
    }

    psaddl(what) {
        this.added_lines++;
        if (this.is_C) what = Z80replace_for_C(what);
        this.outstr = this.indent1 + what + '\n' + this.outstr;
    }

    SP_inc() {
        this.addl('regs.SP = (regs.SP + 1) & 0xFFFF;');
    }

    SP_dec() {
        this.addl('regs.SP = (regs.SP - 1) & 0xFFFF;');
    }

    pop16rip(where) {
        this.read('regs.SP', 'regs.TR');
        this.SP_inc();

        this.read('regs.SP', 'regs.t[0]');
        this.SP_inc();
        this.addl('regs.TR |= regs.t[0] << 8;');
        this.writereg(where, 'regs.TR');
    }

    push16rip(what) {
        this.SP_dec();
        this.write('regs.SP', this.readregH(what));
        this.SP_dec();
        this.write('regs.SP', this.readregL(what));
    }

    push16(what) {
        this.SP_dec();
        this.write('regs.SP', '((' + what + ') >>> 8) & 0xFF');
        this.SP_dec();
        this.write('regs.SP', '(' + what + ') & 0xFF');
    }

    addl(what) {
        this.added_lines++;
        if (this.has_cycle) {
            if (this.is_C) what = Z80replace_for_C(what);
            this.outstr += this.indent3 + what + '\n';
        }
        else
            this.on_cycle.push(what);
    }

    // We actually ignore the input cycle #
    // This is determined automatically
    // Passed in is reference cycle # and/or a comment for the bros
    addcycle(whatup) {
        if (this.in_case) {
            if (!this.is_C)
                this.outstr += this.indent3 + 'break;\n';
            else
                this.outstr += this.indent3 + 'break; }\n';
        }
        let what = (parseInt(this.last_case) + 1).toString();
        this.last_case = what;
        this.in_case = true;
        if (typeof (whatup) !== 'undefined') {
            if (!this.is_C)
                this.outstr += this.indent2 + 'case ' + what + ': // ' + whatup + '\n';
            else
                this.outstr += this.indent2 + 'case ' + what + ': { // ' + whatup + '\n';
        }
        else {
            if (!this.is_C)
                this.outstr += this.indent2 + 'case ' + what + ':\n';
            else
                this.outstr += this.indent2 + 'case ' + what + ': {\n';
        }
        if (!this.has_cycle) {
            this.has_cycle = true;
            for (let i in this.on_cycle) {
                this.addl(this.on_cycle[i])
            }
            this.on_cycle = [];
            this.has_cycle = true;
        }

    }

    // This is a final "cycle" only SOME functions use, mostly to get final data read done
    cleanup() {
        this.has_footer = true;
        this.addcycle('cleanup_custom');
    }

    regular_end() {
        this.addl('// Following is auto-generated code for instruction finish')
        if (!this.has_footer) {
            this.addcycle('cleanup_custom');
        }
        if (!this.no_addr_at_end)
            this.addr_to_PC_then_inc();
        this.RWMIO(0, 0, 0, 0);
        this.addl('regs.TCU = 0;');
        if (!this.exclude_EI)
            this.addl('regs.EI = 0;');
        this.addl('regs.P = 0;');
        this.addl('regs.prefix = 0x00;');
        this.addl('regs.rprefix = Z80P.HL;');
        this.addl('regs.IR = Z80_S_DECODE;');
        this.addl('regs.poll_IRQ = true;');
        this.addl('break;');
    }

    RWMIO(rd, wr, mrq, io) {
        let ostr = '';
        let ndsp = false;
        if (rd !== this.old_rd) {
            ostr += 'pins.RD = ' + rd + ';';
            this.old_rd = rd;
            ndsp = true;
        }
        if (wr !== this.old_wr) {
            if (ndsp) ostr += ' ';
            ostr += 'pins.WR = ' + wr + ';';
            this.old_wr = wr;
            ndsp = true;
        }
        if (mrq !== this.old_mrq) {
            if (ndsp) ostr += ' ';
            ostr += 'pins.MRQ = ' + mrq + ';';
            this.old_mrq = mrq;
            ndsp = true;
        }
        if (io !== this.old_io) {
            if (ndsp) ostr += ' ';
            ostr += 'pins.IO = '+ io + ';';
            this.old_io = io;
            ndsp = true;
        }
        if (ostr.length > 0) this.addl(ostr);
    }

    addr_to_PC_then_inc() {
        this.addl('pins.Addr = regs.PC;');
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    finished() {
        if ((!this.in_case) && (this.added_lines === 0)) {
            return '';
        }
        this.regular_end();

        if (!this.is_C)
            this.outstr += this.indent1 + '}\n';
        else
            this.outstr += this.indent1 + '}}\n';
        return this.outstr;
    }

    post_IN_O_R() {
        this.addl('regs.F.X = (regs.PC >>> 11) & 1;');
        this.addl('regs.F.Y = (regs.PC >>> 13) & 1;');
        this.addl('if (regs.F.C) {');
        this.addl('    if (regs.data & 0x80) {')
        this.addl('        regs.F.PV ^= Z80_parity((regs.B - 1) & 7) ^ 1;');
        this.addl('        regs.F.H = +((regs.B & 0x0F) ' + GENEQO + ' 0);');
        this.addl('    }')
        this.addl('    else {')
        this.addl('        regs.F.PV ^= Z80_parity((regs.B + 1) & 7) ^ 1;');
        this.addl('        regs.F.H = +((regs.B & 0x0F) ' + GENEQO + ' 0x0F);');
        this.addl('    }');
        this.addl('}');
        this.addl('else {');
        this.addl('    regs.F.PV ^= Z80_parity(regs.B & 7) ^ 1;');
        this.addl('}');
    }

    addcycles(howmany) {
        this.RWMIO(0, 0, 0, 0);
        let first = true;
        for (let i = 0; i < howmany; i++) {
            if (first) this.addcycle('Adding ' + howmany + ' cycles');
            else this.addcycle();
            first = false;
        }
    }

    displace(withwhat, outto, clocks_to_wait=5) {
        if ((withwhat !== 'IX') && (withwhat !== 'IY')) {
            this.addl(outto + ' = ' + this.readreg(withwhat) + ';');
            return;
        }
        this.operand8('regs.TR');
        this.addcycles(clocks_to_wait);
        withwhat = this.readreg(withwhat);
        if (!this.is_C)
            this.addl('regs.WZ = (' + withwhat + ' + mksigned8(regs.TR)) & 0xFFFF;');
        else
            this.addl('regs.WZ = (((i32)' + withwhat + ') + ((i32)(i8)regs.TR)) & 0xFFFF;');
        this.addl(outto + ' = regs.WZ;');
    }

    write(where, val) {
        this.addcycle('write begin');
        // addr T0-T2
        // MRQ T0-T1
        // WR T1 only

        this.RWMIO(0, 0, 0, 0);
        if (where !== 'pins.Addr') {
            this.addl('pins.Addr = (' + where + ');');
        }

        this.addcycle();
        this.addl('pins.D = (' + val + ');');
        this.RWMIO(0, 1, 1, 0);

        this.addcycle('write end');
        this.RWMIO(0, 0, 0, 0);
    }

    out(addr, from) {
        /*
        Port addr T0-T1-TW-T2
        IORQ T1-TW
        RD T1-TW
        data latched T2

        WR T1-TW
        data output on D starts T0
         */
        this.addcycle('OUT start');
        this.RWMIO(0, 0, 0, 0)
        this.addl('pins.Addr = ' + addr + ';');
        this.addl('pins.D = ' + from + ';');
        this.addl('regs.data = pins.D;');

        this.addcycle('OUT continues')
        this.RWMIO(0, 0, 0, 0);

        this.addcycle('WAIT STATE');
        this.RWMIO(0, 1, 0, 1);

        this.addcycle('OUT end');
        this.RWMIO(0, 0, 0, 0);
    }

    in(addr, to) {
        /*
        Port addr T0-T1-TW-T2
        IORQ T1-TW
        RD T1-TW
        data latched T2

        WR T1-TW
        data output on D starts T0
         */
        this.addcycle('IN start');
        this.RWMIO(0, 0, 0, 0);
        this.addl('pins.Addr = ' + addr + ';');

        this.addcycle('IN actual read');
        //this.RWM(0, 0, 0, 1);

        this.addcycle('IN wait state');
        this.RWMIO(1, 0, 0, 1);


        this.addcycle('IN end/latch');
        this.RWMIO(0, 0, 0, 0);
        this.addl(to + ' = pins.D;');
        this.addl('regs.data = pins.D;');
    }

    operand8(what) {
        this.read('regs.PC', what)
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    operand16(what) {
        this.read('regs.PC', what);
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');

        this.read('regs.PC', 'regs.t[4]');
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
        this.addl(what + ' |= (regs.t[4] << 8);');
    }

    read(where, to) {
        // address T0-2
        // MREQ T0-1
        // RD T0-1

        this.addcycle('Start read')
        this.addl('pins.Addr = (' + where + ');');
        this.RWMIO(0, 0, 0, 0);

        this.addcycle('signal');
        this.RWMIO(1, 0, 1, 0)

        this.addcycle('Read end/latch')
        this.addl(to + ' = pins.D;');
        this.RWMIO(0, 0, 0, 0);
    }

    DEr(out=null) {
        if (out !== null) this.addl(out + ' = ((regs.D << h) | regs.E);');
        return '((regs.D << 8) | regs.E)';
    }

    BCr(out=null) {
        if (out !== null) this.addl(out + ' = ((regs.B << h) | regs.C);');
        return '((regs.B << 8) | regs.C)';
    }

    HLr(out=null) {
        if (out !== null) this.addl(out + ' = ((regs.H << h) | regs.L);');
        return '((regs.H << 8) | regs.L)';
    }

    Q(val) {
        this.addl('regs.Q = ' + val + ';');
    }

    readregH(r) {
        switch(r) {
            case 'HL':
                return 'regs.H';
            case 'AF':
                return 'regs.A';
            case 'BC':
                return 'regs.B';
            case 'DE':
                return 'regs.D';
            case 'SP':
                return '((regs.SP & 0xFF00) >>> 8)';
            case 'IX':
                return '((regs.IX & 0xFF00) >>> 8)';
            case 'IY':
                return '((regs.IY & 0xFF00) >>> 8)';
            default:
                if (r === '(regs.B << 8) | regs.C') debugger;
                console.log('UNDONE ZREGRIPH', r);
                break;
        }
    }

    readregL(r) {
        switch(r) {
            case 'HL':
                return 'regs.L';
            case 'AF':
                return 'regs.F.getbyte()';
            case 'BC':
                return 'regs.C';
            case 'DE':
                return 'regs.E';
            case 'IX':
                return '(regs.IX & 0xFF)';
            case 'IY':
                return '(regs.IY & 0xFF)';
            case 'SP':
                return '(regs.SP & 0xFF)';
            default:
                console.log('UNDONE ZREGRIPL', r);
                break;
        }
    }

    readreg(r) {
        switch(r) {
            case 'A':
                return 'regs.A';
            case 'B':
                return 'regs.B';
            case 'C':
                return 'regs.C';
            case 'D':
                return 'regs.D';
            case 'E':
                return 'regs.E';
            case '_H':
            case 'H':
                return 'regs.H';
            case '_L':
            case 'L':
                return 'regs.L';
            case 'I':
                return 'regs.I';
            case 'R':
                return 'regs.R';
            case 'F':
                return 'regs.F';
            case 'AF':
                return '(regs.A << 8) | regs.F.getbyte()';
            case 'BC':
                return '(regs.B << 8) | regs.C';
            case 'DE':
                return '(regs.D << 8) | regs.E';
            case '_HL':
            case 'HL':
                return '(regs.H << 8) | regs.L';
            case 'IX':
                return 'regs.IX';
            case 'IY':
                return 'regs.IY';
            case 'WZ':
                return 'regs.WZ';
            case 'regs.TA':
                debugger;
                return 'regs.TA';
            case 'regs.junkvar':
                return 'regs.junkvar';
            case 'AFs':
                return 'regs.AFs';
            case 'SP':
                return 'regs.SP';
            case 'IXH':
                return ('((regs.IX & 0xFF00) >>> 8)');
            case 'IXL':
                return ('(regs.IX & 0xFF)');
            case 'IYH':
                return ('((regs.IY & 0xFF00) >>> 8)');
            case 'IYL':
                return ('(regs.IY & 0xFF)');
            default:
                if (typeof r === 'undefined') debugger;
                console.log('UNDONE ZREGRIP', r);
                return 'ERROR';
        }
    }

    writereg(r, val) {
        switch(r) {
            case 'IX':
                this.addl('regs.IX = ' + val + ';');
                break;
            case 'IY':
                this.addl('regs.IY = ' + val + ';');
                break;
            case 'SP':
                this.addl('regs.SP = ' + val + ';');
                break;
            case 'A':
                this.addl('regs.A = ' + val + ';');
                break;
            case 'B':
                this.addl('regs.B = ' + val + ';');
                break;
            case 'C':
                this.addl('regs.C = ' + val + ';');
                break;
            case 'D':
                this.addl('regs.D = ' + val + ';');
                break;
            case 'E':
                this.addl('regs.E = ' + val + ';');
                break;
            case 'F':
                this.addl('regs.F.setbyte(' + val + ');');
                break;
            case '_H':
            case 'H':
                this.addl('regs.H = ' + val + ';');
                break;
            case '_L':
            case 'L':
                this.addl('regs.L = ' + val + ';');
                break;
            case 'AF':
                this.addl('regs.A = ((' + val + ') & 0xFF00) >>> 8;');
                this.addl('regs.F.setbyte((' + val + ') & 0xFF);');
                break;
            case 'BC':
                this.addl('regs.B = ((' + val + ') & 0xFF00) >>> 8;');
                this.addl('regs.C = (' + val + ') & 0xFF;');
                break;
            case 'DE':
                this.addl('regs.D = ((' + val + ') & 0xFF00) >>> 8;');
                this.addl('regs.E = (' + val + ') & 0xFF;');
                break;
            case '_HL':
            case 'HL':
                this.addl('regs.H = ((' + val + ') & 0xFF00) >>> 8;');
                this.addl('regs.L = (' + val + ') & 0xFF;');
                break;
            case 'I':
                this.addl('regs.I = (' + val + ');');
                break;
            case 'R':
                this.addl('regs.R = (' + val + ');');
                break;
            case 'WZ':
                this.addl('regs.WZ = (' + val + ');');
                break;
            case 'regs.WZ':
                this.addl('regs.WZ = (' + val + ');');
                break;
            case 'regs.junkvar':
                this.addl('// JUNKVAR set here to ' + val);
                break;
            case 'AFs':
                this.addl('regs.AF_ = ((' + val + ') << 8) | (regs.IX & 0xFF);');
                break;
            case 'IXH':
                this.addl('regs.IX = ((' + val + ') << 8) | (regs.IX & 0xFF);');
                break;
            case 'IXL':
                this.addl('regs.IX = (regs.IX & 0xFF00) | ((' + val + ') & 0xFF);');
                break;
            case 'IYH':
                this.addl('regs.IY = ((' + val + ') << 8) | (regs.IY & 0xFF);');
                break;
            case 'IYL':
                this.addl('regs.IY = (regs.IY & 0xFF00) | ((' + val + ') & 0xFF);');
                break;
            case '_':
                break;
            default:
                console.log('UNDONE ZREGRIPW', r);
                break;
        }
    }

    writeregL(r, val) {
        switch(r) {
            case 'HL':
                this.addl('regs.L = (' + val + ');');
                break;
            case 'AF':
                this.addl('regs.F.setbyte(' + val + ');');
                break;
            case 'BC':
                this.addl('regs.C = (' + val + ');');
                break;
            case 'DE':
                this.addl('regs.E = (' + val + ');');
                break;
            case 'SP':
                this.addl('regs.SP = (regs.SP & 0xFF00) | (' + val + ');');
                break;
            case 'IX':
                this.addl('regs.IX = (regs.IX & 0xFF00) | (' + val + ');');
                break;
            case 'IY':
                this.addl('regs.IY = (regs.IY & 0xFF00) | (' + val + ');');
                break;
            default:
                console.log('UNKNOWN ZREGRIPWL', r);
                break;
        }
    }

    writeregH(r, val) {
        switch(r) {
            case 'HL':
                this.addl('regs.H = (' + val + ');');
                break;
            case 'AF':
                this.addl('regs.A = (' + val + ');');
                break;
            case 'BC':
                this.addl('regs.B = (' + val + ');');
                break;
            case 'DE':
                this.addl('regs.D = (' + val + ');');
                break;
            case 'SP':
                this.addl('regs.SP = (' + val + ' << 8) | (regs.SP & 0xFF);');
                break;
            case 'IX':
                this.addl('regs.IX = (' + val + ' << 8) | (regs.IX & 0xFF);');
                break;
            case 'IY':
                this.addl('regs.IY = (' + val + ' << 8) | (regs.IY & 0xFF);');
                break;
            default:
                console.log('UNKNOWN ZREGRIPWH', r);
                break;
        }
    }


    ADD(x, y, c, out='regs.TR', do_declare=true) {
        if (do_declare) {
            this.addl('let x = ' + x + ';');
            this.addl('let y = ' + y + ';');
            this.addl('let z = x + y + ' + c + ';');
        } else {
            this.addl('x = ' + x + ';');
            this.addl('y = ' + y + ';');
            this.addl('z = x + y + ' + c + ';');
        }
        this.addl('regs.F.C = +(z > 0xFF);')
        this.addl('regs.F.N = 0;');
        this.addl('regs.F.PV = ((((x ^ y) ^ 0xFF) & (x ^ z)) & 0x80) >>> 7;');
        this.setX('z');
        this.addl('regs.F.H = ((x ^ y ^ z) & 0x10) >>> 4;');
        this.setY('z');
        this.setZ('z & 0xFF');
        this.setS8('z');
        this.addl(out + ' = z & 0xFF;');
    }
    
    AND(x, y, out) {
        this.addl('let z = (' + x + ') & (' + y + ');');
        this.addl('regs.F.C = regs.F.N = 0;');
        this.setP('z');
        this.setX('z');
        this.addl('regs.F.H = 1;');
        this.setY('z');
        this.setZ('z');
        this.setS8('z');
        this.addl(out + ' = z;');
    }

    BIT(bit, x, out=null) {
        this.addl('let z = (' + x + ') & (1 << ' + bit + ');');

        this.addl('regs.F.N = 0;');
        this.setP('z');
        this.addl('regs.F.H = 1;');
        this.setXY(x);
        this.setZ('z');
        this.setS8('z');
        if ((out !== null) && (out !== x)) this.addl(out + ' = ' + x + ';');
    }

    CP(x, y) {
        if (GENTARGET === 'c') {
            this.addl('i32 x = (i32)' + x + ';');
            this.addl('i32 y = (i32)' + y + ';');
            this.addl('i32 z = x - y;');
        }
        else if (GENTARGET === 'as') {
            this.addl('let x: i32 = <i32>' + x + ';');
            this.addl('let y: i32 = <i32>' + y + ';');
            this.addl('let z: i32 = x - y;');
        }
        else {
            this.addl('let x = ' + x + ';');
            this.addl('let y = ' + y + ';');
            this.addl('let z = x - y;');
        }

        this.addl('regs.F.C = +(z < 0);');
        this.addl('regs.F.N = 1;');
        this.addl('regs.F.PV = (((x ^ y) & (x ^ z)) & 0x80) >>> 7;');
        this.setXY('y');
        this.addl('regs.F.H = ((x ^ y ^ z) & 0x10) >>> 4;');
        this.addl('regs.F.Z = +((z & 0xFF) ' + GENEQO + ' 0);');
        this.setS8('z');
    }

    CPD() {
        this.addl('regs.WZ = (regs.WZ - 1) & 0xFFFF;');
        this.addl('regs.TA = ' + this.readreg('HL') + ';');
        this.read('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA - 1) & 0xFFFF;')
        this.writereg('HL', 'regs.TA');
        this.addcycles(5);
        this.addl('regs.TA = (((regs.B << 8) | regs.C) - 1) & 0xFFFF;');
        this.addl('regs.B = (regs.TA & 0xFF00) >>> 8;');
        this.addl('regs.C = regs.TA & 0xFF;');
        this.addl('let n = regs.A - regs.TR;');
        this.addl('regs.F.N = 1;');
        this.addl('regs.F.PV = +(regs.TA !== 0);');
        this.addl('regs.F.H = ((regs.A ^ regs.TR ^ n) & 0x10) >>> 4;');
        this.addl('regs.F.X = ((n - regs.F.H) & 8) >>> 3;');
        this.addl('regs.F.Y = ((n - regs.F.H) & 2) >>> 1;');
        this.addl('regs.F.Z = +(n ' + GENEQO + ' 0);');
        this.setS8('n');
    }

    CPI() {
        this.Q(1)
        this.addl('regs.WZ = (regs.WZ + 1) & 0xFFFF;');
        this.addl('regs.TA = ' + this.readreg('_HL') + ';');
        this.read('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA + 1) & 0xFFFF;');
        this.writereg('_HL', 'regs.TA');
        this.addcycles(5);
        if (!this.is_C)
            this.addl('let n = (regs.A - regs.TR) & 0xFF;');
        else
            this.addl('u32 n = (regs.A - regs.TR) & 0xFF;');
        this.addl('regs.F.N = 1;');
        this.addl('regs.TA = (((regs.B << 8) | regs.C) - 1) & 0xFFFF;');
        if (!this.is_C)
            this.addl('regs.F.PV = +(regs.TA !== 0);');
        else
            this.addl('regs.F.PV = regs.TA != 0;');
        this.addl('regs.F.H = ((regs.A ^ regs.TR ^ n) & 0x10) >>> 4;');
        this.addl('regs.B = (regs.TA & 0xFF00) >>> 8;');
        this.addl('regs.C = regs.TA & 0xFF;');
        this.addl('regs.TR = (n - regs.F.H) & 0xFF;');
        this.addl('regs.F.X = (regs.TR & 8) >>> 3;');
        this.addl('regs.F.Y = (regs.TR & 2) >>> 1;')
        this.addl('regs.F.Z = +(n ' + GENEQO + ' 0);');
        this.setS8('n');
    }

    DEC(what) {
        this.addl('regs.TR = ((' + what + ') - 1) & 0xFF;');
        this.addl('regs.F.N = 1;');
        this.addl('regs.F.PV = +(regs.TR ' + GENEQO + ' 0x7F);');
        this.setXY('regs.TR');
        this.addl('regs.F.H = +((regs.TR & 0x0F) ' + GENEQO + ' 0x0F);');
        this.setZ('regs.TR');
        this.setS8('regs.TR');
    }

    IN(x) {
        this.addl('regs.F.N = regs.F.H = 0;');
        this.setXY(x);
        this.setP(x);
        this.setZ(x);
        this.setS8(x);
    }

    INC(x) {
        this.addl('regs.TR = ((' + x + ') + 1) & 0xFF;');
        this.addl('regs.F.N = 0;');
        this.addl('regs.F.PV = +(regs.TR ' + GENEQO + ' 0x80);');
        this.setXY('regs.TR');
        this.addl('regs.F.H = +((regs.TR & 0x0F) ' + GENEQO + ' 0);');
        this.addl('regs.F.Z = +(regs.TR ' + GENEQO + ' 0);');
        this.setS8('regs.TR');
    }

    IND() {
        this.Q(1);
        this.addl('regs.WZ = (((regs.B << 8) | regs.C) - 1) & 0xFFFF;');
        this.addcycle();
        this.addl('regs.TA = ' + this.readreg('BC') + ';');
        this.in('regs.TA', 'regs.TR');
        this.addl('regs.B = (regs.B - 1) & 0xFF;');
        this.addl('regs.TA = (regs.H << 8) | regs.L;');
        this.write('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA - 1) & 0xFFFF;');
        this.writereg('HL', 'regs.TA');
        this.addl('regs.F.C = ((((regs.C - 1) & 0xFF) + regs.TR) & 0x100) >>> 8;');
        this.addl('regs.F.N = (regs.TR & 0x80) >>> 7;');
        this.addl('regs.TA = ((regs.C - 1) & 0xFF) + regs.TR & 7 ^ regs.B;');
        this.setP('regs.TA');
        this.setXY('regs.B');
        this.addl('regs.F.H = regs.F.C;');
        this.setZ('regs.B');
        this.setS8('regs.B');
    }

    INI() {
        this.Q(1);
        this.addcycle();
        this.addl('regs.TA = (regs.B << 8) | regs.C;')
        this.addl('regs.WZ = (regs.TA + 1) & 0xFFFF;');
        this.in('regs.TA', 'regs.TR');
        this.addl('regs.B = (regs.B - 1) & 0xFF;');
        this.addl('regs.TA = (regs.H << 8) | regs.L;')
        this.write('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA + 1) & 0xFFFF;');
        this.addl('regs.H = (regs.TA & 0xFF00) >>> 8;');
        this.addl('regs.L = regs.TA & 0xFF;');

        this.addl('regs.F.C = ((regs.C + 1 + regs.TR) & 0x100) >>> 8;');
        //this.addl('regs.F.C = ((((regs.C + 1) & 0xFF) + regs.TR) & 0x100) >>> 8;');
        this.addl('regs.F.N = (regs.TR & 0x80) >>> 7;');
        this.addl('regs.TA = ((regs.C + 1) & 0xFF) + regs.TR & 7 ^ regs.B;');
        this.setP('regs.TA');
        this.setXY('regs.B');
        this.addl('regs.F.H = regs.F.C;');
        this.setZ('regs.B');
        this.setS8('regs.B');
    }
    
    LDD() {
        this.addl('regs.TA = ' + this.readreg('HL') + ';');
        this.read('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA - 1) & 0xFFFF;');
        this.addl('regs.H = (regs.TA & 0xFF00) >>> 8;');
        this.addl('regs.L = regs.TA & 0xFF;');

        this.addl('regs.TA = (regs.D << 8) | regs.E;');
        this.write('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA - 1) & 0xFFFF;');
        this.addl('regs.D = (regs.TA & 0xFF00) >>> 8;');
        this.addl('regs.E = regs.TA & 0xFF;');
        this.addcycles(2);
        this.addl('regs.F.N = regs.F.H = 0;');
        this.addl('regs.TA = (((regs.B << 8) | regs.C) - 1) & 0xFFFF;');
        this.writereg('BC', 'regs.TA');
        this.addl('regs.F.PV = +(regs.TA !== 0);');
        this.addl('regs.TA = (regs.A + regs.TR) & 0xFF;');
        this.addl('regs.F.X = (regs.TA & 8) >>> 3;');
        this.addl('regs.F.Y = (regs.TA & 2) >>> 1;');
    }

    LDI() {
        this.addl('regs.TA = (regs.H << 8) | regs.L;');
        this.read('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA + 1) & 0xFFFF;');
        this.writereg('HL', 'regs.TA');
        this.addl('regs.TA = (regs.D << 8) | regs.E;');
        this.write('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA + 1) & 0xFFFF;');
        this.writereg('DE', 'regs.TA');
        this.addcycles(2);
        this.addl('regs.F.N = regs.F.H = 0;');
        this.addl('regs.TA = (regs.A + regs.TR) & 0xFF;');
        this.addl('regs.F.X = (regs.TA & 8) >>> 3;');
        this.addl('regs.F.Y = (regs.TA & 2) >>> 1;');
        this.addl('regs.TA = (((regs.B << 8) | regs.C) - 1) & 0xFFFF;');
        this.writereg('BC', 'regs.TA');
        this.addl('regs.F.PV = +(regs.TA !== 0);');
    }

    OR(x, y, out=null) {
        this.addl('let z = (' + x + ') | (' + y + ');');

        this.addl('regs.F.C = regs.F.N = regs.F.H = 0;');
        this.setXY('z');
        this.setP('z');
        this.setZ('z');
        this.setS8('z');
        if (out !== null) this.addl(out + ' = z;');
    }

    OUTD() {
        this.addcycle();
        this.addl('regs.TA = ' + this.readreg('HL') + ';');
        this.read('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA - 1) & 0xFFFF;');
        this.writereg('HL', 'regs.TA');
        this.addl('regs.B = (regs.B - 1) & 0xFF;');
        this.addl('regs.TA = ' + this.readreg('BC') + ';');
        this.out('regs.TA', 'regs.TR');
        this.addl('regs.WZ = (regs.TA - 1) & 0xFFFF;');

        this.addl('regs.F.C = ((regs.L + regs.TR) & 0x100) >>> 8;');
        this.addl('regs.F.N = (regs.TR & 0x80) >>> 7;');
        this.addl('regs.TR = (regs.L + regs.TR & 7 ^ regs.B) & 0xFF;');
        this.setP('regs.TR');
        this.setXY('regs.B');
        this.addl('regs.F.H = regs.F.C;');
        this.setZ('regs.B');
        this.setS8('regs.B');
    }

    OUTI() {
        this.addcycle();
        this.addl('regs.TA = ' + this.readreg('HL') + ';');
        this.read('regs.TA', 'regs.TR');
        this.addl('regs.TA = (regs.TA + 1) & 0xFFFF;');
        this.writereg('HL', 'regs.TA');
        this.addl('regs.B = (regs.B - 1) & 0xFF;');
        this.addl('regs.TA = ' + this.readreg('BC') + ';');
        this.out('regs.TA', 'regs.TR');
        this.addl('regs.WZ = (regs.TA + 1) & 0xFFFF;');

        this.addl('regs.F.C = ((regs.L + regs.TR) & 0x100) >>> 8;');
        this.addl('regs.F.N = (regs.TR & 0x80) >>> 7;');
        this.addl('regs.TR = (regs.L + regs.TR & 7 ^ regs.B) & 0xFF;');
        this.setP('regs.TR');
        this.setXY('regs.B');
        this.addl('regs.F.H = regs.F.C;');
        this.setZ('regs.B');
        this.setS8('regs.B');
    }

    RES(bit, x, out='regs.TR') {
        this.addl(out + ' = ' + x + ' & ((1 << ' + bit + ') ^ 0xFF);');
    }

    RL(x, out=null) {
        this.addl('let x = ' + x + ';');
        this.addl('let c = (x & 0x80) >>> 7;');
        this.addl('x = ((x << 1) | regs.F.C) & 0xFF;');

        this.addl('regs.F.C = c;');
        this.addl('regs.F.N = regs.F.H = 0;');
        this.setP('x');
        this.setXY('x');
        this.setZ('x');
        this.setS8('x');

        if (out !== null) this.addl(out + ' = x;');
    }

    RLC(x, out=null) {
        this.addl('let x = ' + x + ';');
        this.addl('x = ((x << 1) | (x >>> 7)) & 0xFF;');

        this.addl('regs.F.C = x & 1;');
        this.addl('regs.F.N = regs.F.H = 0;');
        this.setP('x');
        this.setXY('x');
        this.setZ('x');
        this.setS8('x');

        if (out !== null) this.addl(out + ' = x;');
    }

    RR(x, out=null) {
        this.addl('let x = ' + x + ';');
        this.addl('let c = x & 1;');
        this.addl('x = (x >>> 1) | (regs.F.C << 7);');

        this.addl('regs.F.C = c;');
        this.addl('regs.F.N = regs.F.H = 0;');
        this.setP('x');
        this.setXY('x');
        this.setZ('x');
        this.setS8('x');

        if (out !== null) this.addl(out + ' = x;');
    }

    RRC(x, out=null) {
        this.addl('let x = ' + x + ';');
        this.addl('x = ((x >>> 1) | (x << 7)) & 0xFF;');

        this.addl('regs.F.C = (x & 0x80) >>> 7;');
        this.addl('regs.F.N = regs.F.H = 0;');
        this.setP('x');
        this.setXY('x');
        this.setZ('x');
        this.setS8('x');

        if (out !== null) this.addl(out + ' = x;');
    }

    SET(bit, x, out=null) {
        if (out !== null) this.addl(out + ' = ' + x + ' | (1 << ' + bit + ');');
        else this.addl('regs.t[0] = ' + x + ' | (1 << ' + bit + ');');
    }

    SLA(x, out=null) {
        this.addl('let x = ' + x + ';');
        this.addl('let c = (x & 0x80) >>> 7;');
        this.addl('x = (x << 1) & 0xFF;');

        this.addl('regs.F.C = c;');
        this.addl('regs.F.N = regs.F.H = 0;')
        this.setP('x');
        this.setXY('x');
        this.setZ('x');
        this.setS8('x');

        if (out !== null) this.addl(out + ' = x;');
    }

    SLL(x, out=null) {
        if (!this.is_C)
            this.addl('let x = ' + x + ';');
        else
            this.addl('u32 x = ' + x + ';');
        this.addl('let c = (x & 0x80) >>> 7;');
        this.addl('x = ((x << 1) | 1) & 0xFF;');

        this.addl('regs.F.C = c;');
        this.addl('regs.F.N = regs.F.H = 0;')
        this.setP('x');
        this.setXY('x');
        this.setZ('x');
        this.setS8('x');

        if (out !== null) this.addl(out + ' = x;');
    }

    SRA(x, out=null) {
        this.addl('let x = ' + x + ';');
        this.addl('let c = x & 1;');
        this.addl('x = (x & 0x80) | (x >>> 1);');

        this.addl('regs.F.C = c;');
        this.addl('regs.F.N = regs.F.H = 0;')
        this.setP('x');
        this.setXY('x');
        this.setZ('x');
        this.setS8('x');

        if (out !== null) this.addl(out + ' = x;');
    }

    SRL(x, out=null) {
        this.addl('let x = ' + x + ';');
        this.addl('let c = x & 1;');
        this.addl('x = (x >>> 1) & 0xFF;');

        this.addl('regs.F.C = c;');
        this.addl('regs.F.N = regs.F.H = 0;')
        this.setP('x');
        this.setXY('x');
        this.setZ('x');
        this.setS8('x');

        if (out !== null) this.addl(out + ' = x;');
    }


    SUB(x, y, c, out=null, do_declare=true) {
        if (GENTARGET === 'as') {
            if (do_declare) {
                this.addl('let x: i32 = (<i32>' + x + ');');
                this.addl('let y: i32 = (<i32>' + y + ');');
                this.addl('let c = <i32>(+(' + c + '));');
                this.addl('let z = <i32>(<i32>x - <i32>y - <i32>c) & 0x1FF;');
            }
            else {
                this.addl('x = (' + x + ');');
                this.addl('y = (' + y + ');');
                this.addl('c = +(' + c + ');');
                this.addl('z = (x - y - c) & 0x1FF;');
            }
        }
        else {
            if (do_declare) {
                this.addl('let x = (' + x + ');');
                this.addl('let y = (' + y + ');');
                this.addl('let c = +(' + c + ');');
                this.addl('let z = (x - y - c) & 0x1FF;');
            }
            else {
                this.addl('x = (' + x + ');');
                this.addl('y = (' + y + ');');
                this.addl('c = +(' + c + ');');
                this.addl('z = (x - y - c) & 0x1FF;');
            }
        }
        this.addl('regs.F.C = (z & 0x100) >>> 8;');
        this.addl('regs.F.N = 1;');
        this.addl('regs.F.PV = (((x ^ y) & (x ^ z)) & 0x80) >>> 7;');
        this.setXY('z');
        this.addl('regs.F.H = ((x ^ y ^ z) & 0x10) >>> 4;');
        this.addl('regs.F.Z = +((z & 0xFF) ' + GENEQO + ' 0);')
        this.setS8('z');
        if (out !== null) this.addl(out + ' = z & 0xFF;');
    }

    XOR(x, y, out=null) {
        this.addl('let z = (' + x + ') ^ (' + y + ');');

        this.addl('regs.F.C = regs.F.N = regs.F.H = 0;');
        this.setXY('z');
        this.setP('z');
        this.setZ('z');
        this.setS8('z');

        if (out !== null) this.addl(out + ' = z;');
    }

    setHto(what) {
        this.addl('regs.F.H = ' + what);
    }
    setS8(what) {
        this.addl('regs.F.S = ((' + what + ') & 0x80) >>> 7;');
    }

    setP(what) {
        this.addl('regs.F.PV = Z80_parity(' + what + ');');
    }

    setZ(what) {
        this.addl('regs.F.Z = +((' + what + ') ' + GENEQO + ' 0);');
    }

    setX(what) {
        this.addl('regs.F.X = ((' + what + ') & 8) >>> 3;');
    }

    setY(what) {
        this.addl('regs.F.Y = ((' + what + ') & 0x20) >>> 5;');
    }

    setXY(what) {
        this.setX(what);
        this.setY(what);
    }
}


function Z80_replace_arg(arg, sub) {
    // _HL means it can't be replaced
    // Otherwise, HL will be replaced with sub, if sub is not null
    if (arg === '_') {
        return 'regs.junkvar';
    }
    if (arg === 'addr') {
        return 'WZ';
    }
    if ((typeof arg === 'string') && (arg !== '_HL') && ((arg.indexOf('HL') !== -1))) {
        return arg.replace('HL', sub);
    }
    return arg;
}

function generate_z80_c(is_C=true) {
    save_js('z80_opcodes.c', generate_z80_core_c());
}

/**
 * @param {String} indent
 * @param {Z80_opcode_info} opcode_info
 * @param {null|String} sub
 */
function Z80_generate_instruction_function(indent, opcode_info, sub, CMOS, as=false, is_C=false) {
    let r;
    let indent2 = indent + '    ';
    if (is_C) {
        indent = '';
        indent = '    ';
    }
    let bnum;
    let ag = new Z80_switchgen(indent2, opcode_info, sub, is_C);
    if (sub === null) sub = 'HL';
    if (typeof opcode_info === 'undefined') debugger;
    let arg1 = opcode_info.arg1;
    let arg2 = opcode_info.arg2;
    let arg3 = opcode_info.arg3;

    /*if (opcode_info.ins === Z80_MN.ADC_a_irr) {
        console.log(arg1, typeof arg1, arg1.indexOf('HL'));
    }*/
    // Do IX/IY substitution
    arg1 = Z80_replace_arg(arg1, sub);
    arg2 = Z80_replace_arg(arg2, sub);
    arg3 = Z80_replace_arg(arg3, sub);
    let argH, argL;
    let HLH, HLL;
    let replaced;
    switch(opcode_info.ins) {
        case Z80_MN.IRQ: // process IRQ
            ag.addcycle();
            //ag.addl('if (pins.IRQ_maskable && (!regs.IFF1 || regs.EI)) { regs.TCU = 19; break;}');
            ag.addl('regs.R = (regs.R + 1) & 0x7F;');
            ag.addl('pins.RD = 0; pins.WR = 0; pins.IO = 0; pins.MRQ = 0;');

            ag.push16('regs.PC');

            // case 0 has 6-7 wait
            // case 1 has 7-5 wait
            // case 2 has 6 cycles of reads and a 7-wait, adding up to 13
            // total 13 required
            // case 0 should skip 7-6 of them
            // case 1 should skip 6-8 of them
            // case 2 should skip none of them
            // but we've already used 1.
            if (GENTARGET === 'as') {
                ag.addl('let wait: u32;')
            }
            else if (GENTARGET === 'js') {
                ag.addl('let wait;')
            }
            else if (GENTARGET === 'c') {
                ag.addl('u32 wait;');
            }
            ag.addl('switch(pins.IRQ_maskable ? regs.IM : 1) {');
            ag.addl('case 0:');
            ag.addl('    regs.t[0] = 0;')
            ag.addl('    regs.WZ = pins.D;');
            ag.addl('    wait = 12 - (((pins.D | 0x38) ' + GENEQO + ' 0xFF) ? 6 : 7);');
            ag.addl('    regs.TCU += wait;');
            ag.addl('    break;')
            ag.addl('case 1:');
            ag.addl('    regs.t[0] = 0;')
            ag.addl('    regs.WZ = regs.IRQ_vec;');
            ag.addl('    wait = 12 - (pins.IRQ_maskable ? 7 : 5);');
            ag.addl('    regs.TCU += wait;')
            ag.addl('    break;');
            ag.addl('case 2:');
            ag.addl('    regs.t[0] = 1;')
            ag.addl('    regs.TA = (regs.I << 8) | pins.D;');
            ag.addl('    regs.WZ = 0;');
            ag.addl('    break;')
            ag.addl('}');
            ag.read('regs.TA', 'regs.WZ');
            ag.addl('regs.TA = (regs.TA + 1) & 0xFFFF;');
            ag.read('regs.TA', 'regs.TR');
            ag.addl('if (regs.t[0] ' + GENEQO + ' 1) { regs.WZ |= regs.TR << 8; }');
            ag.addcycles(6);

            ag.addl('regs.PC = regs.WZ;');
            ag.addl('regs.IFF1 = 0;');
            ag.addl('if (pins.IRQ_maskable) regs.IFF2 = 0;');
            ag.addl('regs.HALT = 0;');
            ag.addl('if (regs.P) regs.F.PV = 0;');
            ag.addl('regs.P = 0;');
            ag.addl('regs.Q = 0;');
            ag.addl('regs.IRQ_vec = 0;');
            break;
        case Z80_MN.RESET:
            // disables the maskable interrupt, selects interrupt mode 0, zeroes registers I & R and zeroes the program counter (PC)
            ag.addcycle();
            ag.RWMIO(0, 0, 0, 0);
            ag.addl('regs.IFF1 = regs.IFF2 = 0; // disable interrupt')
            ag.addl('regs.IM = 0;');
            ag.addl('regs.I = 0;');
            ag.addl('regs.R = 0;');
            ag.addl('regs.PC = 0;');
            break;
        case Z80_MN.ADC_a_irr:  //n16&
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.ADD('regs.A', 'regs.TR', 'regs.F.C', 'regs.A');
            break;
        case Z80_MN.ADC_a_n:  //
            ag.Q(1);
            ag.operand8('regs.TR');
            ag.ADD('regs.A', 'regs.TR', 'regs.F.C', 'regs.A');
            break;
        case Z80_MN.ADC_a_r:  //n8&
            ag.Q(1);
            ag.cleanup();
            ag.ADD('regs.A', ag.readreg(Z80hacksub(arg1, sub)), 'regs.F.C', 'regs.A')
            break;
        case Z80_MN.ADC_hl_rr:  //n16&
            argL = ag.readregL(arg1);
            argH = ag.readregH(arg1);
            ag.Q(1);
            if (GENTARGET === 'as') {
                ag.psaddl('let x: u32, y: u32, z: u32;');
            }
            else {
                ag.psaddl('let x, y, z;');
            }
            ag.addcycles(4);
            ag.addl('regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;');
            ag.ADD('regs.L', argL, 'regs.F.C', 'regs.L', false);
            ag.addcycles(3);
            ag.ADD('regs.H', argH, 'regs.F.C', 'regs.H', false);
            ag.addl('regs.F.Z = +((regs.H ' + GENEQO + ' 0) && (regs.L ' + GENEQO + ' 0));');
            break;
        case Z80_MN.ADD_a_irr:  //n16&
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.ADD('regs.A', 'regs.TR', '0', 'regs.A');
            break;
        case Z80_MN.ADD_a_n:  //
            ag.Q(1);
            ag.operand8('regs.TR');
            ag.ADD('regs.A', 'regs.TR', '0', 'regs.A');
            break;
        case Z80_MN.ADD_a_r:  //n8&
            ag.Q(1);
            ag.ADD('regs.A', ag.readreg(Z80hacksub(arg1, sub)), '0', 'regs.A');
            break;
        case Z80_MN.ADD_hl_rr:  //n16&
            argH = ag.readregH(arg1);
            argL = ag.readregL(arg1);
            ag.addl('// SUB was ' + sub);
            ag.Q(1);
            if (GENTARGET === 'as') {
                ag.psaddl('let x: u32, y: u32, z: u32;');
            }
            else {
                ag.psaddl('let x, y, z;');
            }
            switch(sub) {
                case 'IX':
                    HLH = '((regs.IX & 0xFF00) >>> 8)';
                    HLL = '(regs.IX & 0xFF)'
                    ag.addl('regs.WZ = (regs.IX + 1) & 0xFFFF;');
                    break;
                case 'IY':
                    HLH = '((regs.IY & 0xFF00) >>> 8)';
                    HLL = '(regs.IY & 0xFF)'
                    ag.addl('regs.WZ = (regs.IY + 1) & 0xFFFF;');
                    break;
                default:
                    HLH = 'regs.H';
                    HLL = 'regs.L'
                    ag.addl('regs.WZ = (((regs.H << 8) | regs.L) + 1) & 0xFFFF;');
                    break;
            }
            ag.addl('regs.t[0] = regs.F.PV; regs.t[1] = regs.F.Z; regs.t[2] = regs.F.S;');
            ag.addcycles(4);
            ag.ADD(HLL, argL, '0', 'regs.t[4]', false);
            ag.addcycles(3);
            ag.ADD(HLH, argH, 'regs.F.C', 'regs.t[5]', false);
            ag.addl('regs.F.PV = regs.t[0]; regs.F.Z = regs.t[1]; regs.F.S = regs.t[2];');
            switch(sub) {
                case 'IX':
                    ag.addl('regs.IX = (regs.t[5] << 8) | regs.t[4];');
                    break;
                case 'IY':
                    ag.addl('regs.IY = (regs.t[5] << 8) | regs.t[4];');
                    break;
                default:
                    ag.addl('regs.H = regs.t[5];');
                    ag.addl('regs.L = regs.t[4];');
                    break;
            }
            break;
        case Z80_MN.AND_a_irr:  //n16&
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.AND('regs.A', 'regs.TR', 'regs.A');
            break;
        case Z80_MN.AND_a_n:  //
            ag.Q(1);
            ag.operand8('regs.TR');
            ag.AND('regs.A', 'regs.TR', 'regs.A');
            break;
        case Z80_MN.AND_a_r:  //n8&
            ag.Q(1);
            ag.AND('regs.A', ag.readreg(Z80hacksub(arg1, sub)), 'regs.A');
            break;
        case Z80_MN.BIT_o_irr:  //n3, n16&
            ag.Q(1);
            ag.read(ag.readreg(arg2), 'regs.TR');
            ag.BIT(arg1, 'regs.TR');
            ag.setXY('(regs.WZ >>> 8)');
            ag.addcycle('wait');
            break;
        case Z80_MN.BIT_o_irr_r:  //n3, n16&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg2), 'regs.TR');
            ag.BIT(arg1, 'regs.TR');
            ag.addcycle('wait');
            ag.setXY('(regs.WZ >>> 8)');
            break;
        case Z80_MN.BIT_o_r:  //n3, n8&
            ag.Q(1);
            ag.BIT(arg1, ag.readreg(arg2));
            break;
        case Z80_MN.CALL_c_nn:  //bool c
            ag.Q(0);
            ag.operand16('regs.WZ');
            ag.addl('regs.TA = regs.WZ;');
            ag.addl('regs.TR = +(' + arg1 + ');');
            // regs.TR is now true or false
            // if we don't do it, skip the push and call...
            ag.addl('if (!regs.TR) { regs.TA = regs.PC; regs.TCU+=7; break; }');
            ag.addcycle();
            ag.push16('regs.PC');
            ag.addl('regs.PC = regs.TA;');
            break;
        case Z80_MN.CALL_nn:  //
            ag.Q(0);
            ag.operand16('regs.WZ');
            ag.addcycle();
            ag.push16('regs.PC');
            ag.cleanup();
            ag.addl('regs.PC = regs.WZ;');
            break;
        case Z80_MN.CCF:  //
            ag.addl('if (regs.Q) { regs.F.X = regs.F.Y = 0; } ');
            ag.addl('regs.F.H = regs.F.C;');
            ag.addl('regs.F.C = +(!regs.F.C);');
            ag.addl('regs.F.N = 0;');
            ag.addl('regs.F.X |= (regs.A & 8) >>> 3;');
            ag.addl('regs.F.Y |= (regs.A & 0x20) >>> 5;');
            ag.Q(1);
            break;
        case Z80_MN.CP_a_irr:  //n16& x
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.CP('regs.A', 'regs.TR');
            break;
        case Z80_MN.CP_a_n:  //
            ag.Q(1);
            ag.operand8('regs.TR');
            ag.CP('regs.A', 'regs.TR');
            break;
        case Z80_MN.CP_a_r:  //n8& x
            ag.Q(1);
            ag.CP('regs.A', ag.readreg(Z80hacksub(arg1, sub)));
            break;
        case Z80_MN.CPD:  //
            ag.Q(1);
            ag.CPD();
            break;
        case Z80_MN.CPDR:  //
            ag.Q(1)
            ag.CPD();
            ag.addl('if (((regs.B ' + GENEQO + ' 0) && (regs.C ' + GENEQO + ' 0)) || (regs.F.Z)) {regs.TCU += 5; break; }');
            ag.addcycle();
            ag.addl('regs.PC = (regs.PC - 2) & 0xFFFF;');
            ag.addl('regs.WZ = (regs.PC + 1) & 0xFFFF;');
            ag.addl('regs.F.X = (regs.PC >>> 11) & 1;');
            ag.addl('regs.F.Y = (regs.PC >>> 13) & 1;')
            ag.addcycles(4);
            break;
        case Z80_MN.CPI:  //
            ag.CPI();
            break;
        case Z80_MN.CPIR:  //
            ag.CPI();
            ag.addl('if (((regs.B ' + GENEQO + ' 0) && (regs.C ' + GENEQO + ' 0)) || (regs.F.Z)) {regs.TCU += 5; break; }');
            ag.addcycle();
            ag.addl('regs.PC = (regs.PC - 2) & 0xFFFF;');
            ag.addl('regs.WZ = (regs.PC + 1) & 0xFFFF;');
            ag.addl('regs.F.X = (regs.PC >>> 11) & 1;');
            ag.addl('regs.F.Y = (regs.PC >>> 13) & 1;')
            ag.addcycles(4);
            break;
        case Z80_MN.CPL:  //
            ag.Q(1);
            ag.addl('regs.A ^= 0xFF;');
            ag.addl('regs.F.N = regs.F.H = 1;');
            ag.setXY('regs.A');
            break;
        case Z80_MN.DAA:  //
            ag.Q(1);
            ag.addl('let a = regs.A;');
            ag.addl('if (regs.F.C || (regs.A > 0x99)) { regs.A = (regs.A + (regs.F.N ? -0x60: 0x60)) & 0xFF; regs.F.C = 1; }')
            ag.addl('if (regs.F.H || ((regs.A & 0x0F) > 0x09)) { regs.A = (regs.A + (regs.F.N ? -6 : 6)) & 0xFF; }');

            ag.addl('regs.F.PV = Z80_parity(regs.A);');
            ag.setXY('regs.A');
            ag.addl('regs.F.H = ((a ^ regs.A) & 0x10) >>> 4;');
            ag.addl('regs.F.Z = +(regs.A ' + GENEQO + ' 0);');
            ag.setS8('regs.A');
            break;
        case Z80_MN.DEC_irr:  //n16&
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.addcycle();
            ag.DEC('regs.TR');
            ag.write('regs.TA', 'regs.TR');
            break;
        case Z80_MN.DEC_r:  //n8&
            ag.Q(1);
            replaced = false;
            if (arg1 === 'H')  {
                switch(sub) {
                    case 'IX':
                        ag.DEC('(regs.IX & 0xFF00) >>> 8');
                        ag.addl('regs.IX = (regs.TR << 8) | (regs.IX & 0xFF);');
                        replaced = true;
                        break;
                    case 'IY':
                        ag.DEC('(regs.IY & 0xFF00) >>> 8');
                        ag.addl('regs.IY = (regs.TR << 8) | (regs.IY & 0xFF);');
                        replaced = true;
                        break;
                }
            } else if (arg1 === 'L') {
                switch(sub) {
                    case 'IX':
                        ag.DEC('regs.IX & 0xFF');
                        ag.addl('regs.IX = (regs.IX & 0xFF00) | regs.TR;');
                        replaced = true;
                        break;
                    case 'IY':
                        ag.DEC('regs.IY & 0xFF');
                        ag.addl('regs.IY = (regs.IY & 0xFF00) | regs.TR;');
                        replaced = true;
                        break;
                }
            }
            if (!replaced) {
                ag.DEC(ag.readreg(arg1));
                ag.writereg(arg1, 'regs.TR');
            }
            break;
        case Z80_MN.DEC_rr:  //n16&
            ag.Q(0);
            ag.addcycles(2);
            ag.addl('regs.TA = ' + ag.readreg(arg1) + ';');
            ag.addl('regs.TA = (regs.TA - 1) & 0xFFFF;');
            ag.writereg(arg1, 'regs.TA');
            break;
        case Z80_MN.DI:  //
            ag.cleanup();
            ag.Q(0);
            ag.addl('regs.IFF1 = regs.IFF2 = 0;');
            break;
        case Z80_MN.DJNZ_e:  //
            ag.Q(0);
            ag.addcycle();
            ag.operand8('regs.TR');
            if (!is_C)
                ag.addl('regs.TR = mksigned8(regs.TR);');
            ag.addl('regs.B = (regs.B - 1) & 0xFF;');
            ag.addl('if (regs.B ' + GENEQO + ' 0) { regs.TCU += 5; break; }');
            if (!is_C)
                ag.addl('regs.WZ = (regs.PC + regs.TR) & 0xFFFF;');
            else
                ag.addl('regs.WZ = ((u32)(((i32)regs.PC) + ((i32)(i8)regs.TR))) & 0xFFFF;');
            ag.addl('regs.PC = regs.WZ;');
            ag.addcycles(5);
            break;
        case Z80_MN.EI:  //
            ag.Q(0);
            ag.addl('regs.IFF1 = regs.IFF2 = regs.EI = 1;')
            ag.exclude_EI = true;
            break;
        case Z80_MN.EX_irr_rr:  //n16&, n16&
            ag.Q(0);
            ag.addl('regs.TA = ' + ag.readreg(arg1) + ';');
            ag.read('regs.TA', 'regs.WZ');
            ag.addl('regs.TA = (regs.TA + 1) & 0xFFFF;');
            ag.read('regs.TA', 'regs.TR');
            ag.addl('regs.WZ |= (regs.TR << 8);');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), ag.readregL(arg2));
            ag.write('regs.TA', ag.readregH(arg2));
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.writereg(arg2, 'regs.WZ');
            break;
        case Z80_MN.EX_rr_rr:  //n16&, n16&
            ag.Q(0);
            if (arg1 === 'AF') ag.addl('regs.exchange_shadow_af();')
            else ag.addl('regs.exchange_de_hl();');
            //ag.addl('regs.TR = ' + ag.readreg(arg1) + ';');
            //ag.writereg(arg2, ag.readreg(arg1));
            //ag.writereg(arg1, 'regs.TR');

            //ag.addl(arg1 + ' = regs.TR;');
            break;
        case Z80_MN.EXX:  //
            ag.Q(0);
            ag.cleanup();
            ag.addl('regs.exchange_shadow();');
            break;
        case Z80_MN.HALT:  //
            ag.Q(0);
            ag.addl('regs.HALT = 1;');
            break;
        case Z80_MN.IM_o:  //n2
            ag.Q(0);
            //ag.addcycles(4);
            ag.addl('regs.IM = ' + arg1 + ';');
            break;
        case Z80_MN.IN_a_in:  //
            ag.Q(0);
            ag.operand8('regs.WZ');
            ag.addl('regs.WZ |= (regs.A << 8);');
            ag.in('regs.WZ', 'regs.A');
            ag.addl('regs.WZ = (regs.WZ + 1) & 0xFFFF;');
            break;
        case Z80_MN.IN_r_ic:  //n8&
            ag.Q(1);
            ag.addl('regs.TA = (regs.B << 8) | regs.C;');
            ag.in('regs.TA', 'regs.TR');
            ag.IN('regs.TR');
            ag.writereg(arg1, 'regs.TR');
            if ((arg1 === 'B') || (arg1 === 'C')) {
                ag.addl('regs.TA = (regs.B << 8) | regs.C;');
            }
            ag.addl('regs.WZ = (regs.TA + 1) & 0xFFFF;');
            break;
        case Z80_MN.IN_ic:  //
            ag.Q(1);
            ag.addl('regs.TA = (regs.B << 8) | regs.C;');
            ag.in('regs.TA', 'regs.TR');
            ag.IN('regs.TR');
            ag.addl('regs.WZ = (regs.TA + 1) & 0xFFFF;');
            break;
        case Z80_MN.INC_irr:  //n16&
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.addcycle();
            ag.INC('regs.TR');
            ag.write('regs.TA', 'regs.TR');
            break;
        case Z80_MN.INC_r:  //n8&
            ag.Q(1);
            replaced = false;
            if (arg1 === 'H')  {
                switch(sub) {
                    case 'IX':
                        ag.INC('(regs.IX & 0xFF00) >>> 8');
                        ag.addl('regs.IX = (regs.TR << 8) | (regs.IX & 0xFF);');
                        replaced = true;
                        break;
                    case 'IY':
                        ag.INC('(regs.IY & 0xFF00) >>> 8');
                        ag.addl('regs.IY = (regs.TR << 8) | (regs.IY & 0xFF);');
                        replaced = true;
                        break;
                }
            } else if (arg1 === 'L') {
                switch(sub) {
                    case 'IX':
                        ag.INC('regs.IX & 0xFF');
                        ag.addl('regs.IX = (regs.IX & 0xFF00) | regs.TR;');
                        replaced = true;
                        break;
                    case 'IY':
                        ag.INC('regs.IY & 0xFF');
                        ag.addl('regs.IY = (regs.IY & 0xFF00) | regs.TR;');
                        replaced = true;
                        break;
                }
            }
            if (!replaced) {
                ag.INC(ag.readreg(arg1));
                ag.writereg(arg1, 'regs.TR');
            }
            break;
        case Z80_MN.INC_rr:  //n16&
            ag.Q(0);
            ag.addcycles(2);
            ag.addl('regs.TR = ((' + ag.readreg(arg1) + ' ) + 1) & 0xFFFF;');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.IND:  //
            ag.IND();
            break;
        case Z80_MN.INDR:  //
            ag.IND();
            ag.addl('if (regs.B ' + GENEQO + ' 0) { regs.TCU += 5; break; }');
            ag.addcycle();
            ag.addl('regs.PC = (regs.PC - 2) & 0xFFFF;');
            ag.post_IN_O_R();
            ag.addcycles(4);
            break;
        case Z80_MN.INI:  //
            ag.INI();
            break;
        case Z80_MN.INIR:  //
            ag.INI();
            ag.addl('if (regs.B ' + GENEQO + ' 0) { regs.TCU += 5; break; }');
            ag.addcycle();
            ag.addl('regs.PC = (regs.PC - 2) & 0xFFFF;');
            ag.post_IN_O_R();
            ag.addcycles(4);
            break;
       case Z80_MN.JP_c_nn:  //bool
           ag.Q(0);
           ag.operand16('regs.WZ');
           if (arg1 === '1') {
               ag.addl('regs.PC = regs.WZ;');
           } else {
               ag.addl('if (' + arg1 + ') regs.PC = regs.WZ;');
           }
           break;
        case Z80_MN.JP_rr:  //n16&
            ag.Q(0);
            ag.addl('regs.PC = ' + ag.readreg((arg1)) + ';');
            break;
        case Z80_MN.JR_c_e:  //bool
            ag.Q(0);
            ag.operand8('regs.TR');
            if (!is_C)
                ag.addl('regs.TR = mksigned8(regs.TR);');
            ag.addl('if (!(' + arg1 + ')) { regs.TCU += 5; break; }');
            if (!is_C)
                ag.addl('regs.WZ = (regs.PC + regs.TR) & 0xFFFF;');
            else
                ag.addl('regs.WZ = ((u32)(((i32)regs.PC) + ((i32)(i8)regs.TR))) & 0xFFFF;');

            ag.addl('regs.PC = regs.WZ;');
            ag.addcycles(5);
            break;
        case Z80_MN.LD_a_inn:  //
            ag.Q(0);
            ag.operand16('regs.WZ');
            ag.read('regs.WZ', 'regs.A');
            ag.addl('regs.WZ = (regs.WZ + 1) & 0xFFFF;');
            break;
        case Z80_MN.LD_a_irr:  //n16& x
            ag.Q(0);
            ag.addl('regs.WZ = ' + ag.readreg(arg1) + ';');
            ag.read('regs.WZ', 'regs.A');
            ag.addl('regs.WZ = (regs.WZ + 1) & 0xFFFF;');
            break;
        case Z80_MN.LD_inn_a:  //
            ag.Q(0);
            ag.operand16('regs.WZ');
            ag.write('regs.WZ', 'regs.A');
            ag.addl('regs.WZ = ((regs.WZ + 1) & 0xFF) | (regs.A << 8);');
            break;
        case Z80_MN.LD_inn_rr:  //n16&
            ag.Q(0);
            ag.operand16('regs.WZ');
            ag.write('regs.WZ', ag.readregL(arg1));
            ag.addl('regs.WZ = (regs.WZ + 1) & 0xFFFF;');
            ag.write('regs.WZ', ag.readregH(arg1));
            break;
        case Z80_MN.LD_irr_a:  //n16&
            ag.Q(0);
            ag.addl('regs.WZ = ' + ag.readreg(arg1) + ';');
            ag.write('regs.WZ', 'regs.A');
            ag.addl('regs.WZ = ((regs.WZ + 1) & 0xFF) | (regs.A << 8);');
            break;
        case Z80_MN.LD_irr_n:  //n16&
            ag.Q(0);
            ag.displace(arg1, 'regs.TA', 2);
            ag.operand8('regs.TR');
            ag.write('regs.TA', 'regs.TR');
            break;
        case Z80_MN.LD_irr_r:  //n16&, n8&
            ag.Q(0);
            ag.displace(arg1, 'regs.TA');
            ag.write('regs.TA', ag.readreg(arg2));
            break;
        case Z80_MN.LD_r_n:  //n8&
            ag.Q(0);
            ag.operand8('regs.TR');
            arg1 = Z80hacksub(arg1, sub);
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.LD_r_irr:  //n8&, n16&
            ag.Q(0);
            ag.displace(arg2, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            arg1 = Z80hacksub(arg1, sub);
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.LD_r_r:  //n8&, n8&
            ag.Q(0);
            ag.writereg(Z80hacksub(arg1, sub), ag.readreg(Z80hacksub(arg2, sub)));
            break;
        case Z80_MN.LD_r_r1:  //n8&, n8&
            ag.Q(0);
            ag.addcycle();
            ag.writereg(arg1, ag.readreg(arg2));
            break;
        case Z80_MN.LD_r_r2:  //n8&, n8&
            ag.Q(1);
            ag.addcycle();
            ag.addl('let x = ' + ag.readreg(arg2) + ';');
            ag.writereg(arg1, ag.readreg(arg2));
            ag.addl('regs.F.N = regs.F.H = 0;');
            ag.setXY('x');
            ag.addl('regs.F.PV = regs.IFF2;');
            ag.setZ('x');
            ag.setS8('x');
            if (!CMOS) ag.addl('regs.P = 1;');
            else ag.addl('regs.P = 0;');
            break;
        case Z80_MN.LD_rr_inn:  //n16&
            ag.Q(0);
            ag.operand16('regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.writeregL(arg1, 'regs.TR');
            ag.addl('regs.TA = (regs.TA + 1) & 0xFFFF;');
            ag.addl('regs.WZ = regs.TA;');
            ag.read('regs.TA', 'regs.TR');
            ag.writeregH(arg1, 'regs.TR');
            break;
        case Z80_MN.LD_rr_nn:  //n16&
            ag.Q(0);
            ag.operand16('regs.TR');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.LD_sp_rr:  //n16&
            ag.Q(0);
            ag.addcycles(2);
            ag.addl('regs.SP = ' + ag.readreg(arg1) + ';');
            break;
        case Z80_MN.LDD:  //
            ag.Q(1);
            ag.LDD();
            break;
        case Z80_MN.LDDR:  //
            ag.Q(1);
            ag.LDD();

            ag.addl('if ((regs.B ' + GENEQO + ' 0) && (regs.C ' + GENEQO + ' 0)) { regs.TCU += 5; break; }');
            ag.addcycle();
            ag.addl('regs.PC = (regs.PC - 2) & 0xFFFF;');
            ag.addl('regs.WZ = (regs.PC + 1) & 0xFFFF;');
            ag.addl('regs.F.X = (regs.PC >>> 11) & 1;');
            ag.addl('regs.F.Y = (regs.PC >>> 13) & 1;')

            ag.addcycles(4);
            break;
        case Z80_MN.LDI:  //
            ag.Q(1);
            ag.LDI();
            break;
        case Z80_MN.LDIR:  //
            ag.Q(1);
            ag.LDI();
            ag.addl('if ((regs.B ' + GENEQO + ' 0) && (regs.C ' + GENEQO + ' 0)) { regs.TCU += 5; break; }');
            ag.addcycle()
            ag.addl('regs.PC = (regs.PC - 2) & 0xFFFF;');
            ag.addl('regs.WZ = (regs.PC + 1) & 0xFFFF;');
            ag.addl('regs.F.X = (regs.PC >>> 11) & 1;');
            ag.addl('regs.F.Y = (regs.PC >>> 13) & 1;')
            ag.addcycles(4);
            break;
        case Z80_MN.NEG:  //
            ag.Q(1);
            ag.SUB('0', 'regs.A', 0, 'regs.A');
            break;
        case Z80_MN.NOP:  //
            ag.Q(0);
            break;
        case Z80_MN.OR_a_irr:  //n16&
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.OR('regs.A', 'regs.TR', 'regs.A');
            break;
        case Z80_MN.OR_a_n:  //
            ag.Q(1);
            ag.operand8('regs.TR');
            ag.OR('regs.A', 'regs.TR', 'regs.A');
            break;
        case Z80_MN.OR_a_r:  //n8&
            ag.Q(1);
            ag.OR('regs.A', ag.readreg(Z80hacksub(arg1, sub)), 'regs.A');
            break;
        case Z80_MN.OTDR:  //
            ag.Q(1);
            ag.OUTD();
            ag.addl('if (regs.B ' + GENEQO + ' 0) { regs.TCU += 5; break; }');
            ag.addcycle();
            ag.addl('regs.PC = (regs.PC - 2) & 0xFFFF;');
            ag.post_IN_O_R();
            ag.addcycles(4);
            break;
        case Z80_MN.OTIR:  //
            ag.Q(1);
            ag.OUTI();
            ag.addl('if (regs.B ' + GENEQO + ' 0) { regs.TCU += 5; break; }');
            ag.addcycle();
            ag.addl('regs.PC = (regs.PC - 2) & 0xFFFF;');
            ag.post_IN_O_R();
            ag.addcycles(4);
            break;
        case Z80_MN.OUT_ic_r:  //n8&
            ag.Q(0);
            ag.addl('regs.TA = ' + ag.readreg('BC') + ';');
            ag.out('regs.TA', ag.readreg(arg1));
            ag.addl('regs.WZ = (regs.TA + 1) & 0xFFFF;');
            break;
        case Z80_MN.OUT_ic:  //
            ag.Q(0);
            ag.addl('regs.TA = ' + ag.readreg('BC') + ';');
            if (!CMOS) ag.out('regs.TA', '0x00');
            else ag.out('regs.TA', '0xFF');
            break;
        case Z80_MN.OUT_in_a:  //
            ag.Q(0);
            ag.operand8('regs.WZ');
            ag.addl('regs.WZ |= (regs.A << 8);');
            ag.out('regs.WZ', 'regs.A');
            ag.addl('regs.WZ = ((regs.WZ + 1) & 0xFF) | (regs.WZ & 0xFF00);');
            break;
        case Z80_MN.OUTD:  //
            ag.Q(1);
            ag.OUTD();
            break;
        case Z80_MN.OUTI:  //
            ag.Q(1);
            ag.OUTI();
            break;
        case Z80_MN.POP_rr:  //n16&
            ag.Q(0);
            ag.pop16rip(arg1);
            break;
        case Z80_MN.PUSH_rr:  //n16&
            ag.Q(0);
            ag.addcycle();
            ag.push16rip(arg1);
            break;
        case Z80_MN.RES_o_irr:  //n3, n16&
            ag.Q(1);
            ag.read(ag.readreg(arg2), 'regs.TR');
            ag.addcycle('wait');
            ag.RES(arg1, 'regs.TR', 'regs.TR');
            ag.write(ag.readreg(arg2), 'regs.TR');
            break;
        case Z80_MN.RES_o_irr_r:  //n3, n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg2), 'regs.TR');
            ag.addcycle('wait');
            ag.RES(arg1, 'regs.TR', 'regs.TR');
            ag.writereg(arg3, 'regs.TR');
            ag.write(ag.readreg(arg2), 'regs.TR');
            break;
        case Z80_MN.RES_o_r:  //n3, n8&
            ag.Q(1);
            ag.RES(arg1, ag.readreg(arg2), ag.readreg(arg2));
            break;
        case Z80_MN.RET:  //
            ag.Q(0);
            ag.pop16rip('WZ');
            ag.addl('regs.PC = regs.WZ;');
            break;
        case Z80_MN.RET_c:  //bool c
            ag.Q(0);
            ag.addcycle(0);
            ag.addl('if (!(' + arg1 + ')) { regs.TCU += 6; break; }');
            ag.pop16rip('WZ');
            ag.addl('regs.PC = regs.WZ;');
            break;
        case Z80_MN.RETI:  //
            ag.Q(0);
            ag.pop16rip('WZ');
            ag.addl('regs.PC = regs.WZ;');
            ag.addl('regs.IFF1 = regs.IFF2;');
            break;
        case Z80_MN.RETN:  //
            ag.Q(0);
            ag.pop16rip('WZ');
            ag.addl('regs.PC = regs.WZ;');
            ag.addl('regs.IFF1 = regs.IFF2;');
            break;
        case Z80_MN.RL_irr:  //n16&
            ag.Q(1);
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.RL('regs.TR', 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.RL_irr_r:  //n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.RL('regs.TR', 'regs.TR');
            ag.writereg(arg2, 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.RL_r:  //n8&
            ag.Q(1);
            ag.RL(ag.readreg(arg1), 'regs.TR');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.RLA:  //
            ag.Q(1);
            ag.addl('let c = (regs.A & 0x80) >>> 7;');
            ag.addl('regs.A = ((regs.A << 1) | regs.F.C) & 0xFF;');
            ag.addl('regs.F.C = c;');
            ag.addl('regs.F.N = regs.F.H = 0;');
            ag.setXY('regs.A');
            break;
        case Z80_MN.RLC_irr:  //n16&
            ag.Q(1);
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.RLC('regs.TR', 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.RLC_irr_r:  //n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.RLC('regs.TR', 'regs.TR');
            ag.writereg(arg2, 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.RLC_r:  //n8&
            ag.Q(1);
            ag.RLC(ag.readreg(arg1), 'regs.TR');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.RLCA:  //
            ag.Q(1);
            ag.addl('let c = (regs.A & 0x80) >>> 7;');
            ag.addl('regs.A = ((regs.A << 1) | c) & 0xFF;')

            ag.addl('regs.F.C = c;');
            ag.addl('regs.F.N = regs.F.H = 0;');
            ag.setXY('regs.A');
            break;
        case Z80_MN.RLD:  //
            ag.Q(1);
            ag.addl('regs.WZ = ' + ag.readreg(arg1) + ';');
            ag.read('regs.WZ', 'regs.TR');
            ag.addcycle();
            ag.write('regs.WZ', '((regs.TR << 4) & 0xF0) | (regs.A & 0x0F)');
            ag.addl('regs.WZ = (regs.WZ + 1) & 0xFFFF;');
            ag.addcycles(3);
            ag.addl('regs.A = (regs.A & 0xF0) | (regs.TR >>> 4);');

            ag.addl('regs.F.N = regs.F.H = 0;');
            ag.setP('regs.A');
            ag.setXY('regs.A');
            ag.setZ('regs.A');
            ag.setS8('regs.A');
            break;
        case Z80_MN.RR_irr:  //n16&
            ag.Q(1);
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.RR('regs.TR', 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.RR_irr_r:  //n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.RR('regs.TR', 'regs.TR');
            ag.writereg(arg2, 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.RR_r:  //n8&
            ag.Q(1);
            ag.RR(ag.readreg(arg1), 'regs.TR');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.RRA:  //
            ag.Q(1);
            ag.addl('let c = regs.A & 1;');
            ag.addl('regs.A = (regs.F.C << 7) | (regs.A >>> 1);');

            ag.addl('regs.F.C = c;');
            ag.addl('regs.F.N = regs.F.H = 0;');
            ag.setXY('regs.A');
            break;
        case Z80_MN.RRC_irr:  //n16&
            ag.Q(1);
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.RRC('regs.TR', 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.RRC_irr_r:  //n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.RRC('regs.TR', 'regs.TR');
            ag.writereg(arg2, 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.RRC_r:  //n8&
            ag.Q(1);
            ag.RRC(ag.readreg(arg1), 'regs.TR');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.RRCA:  //
            ag.Q(1);
            ag.addl('let c = regs.A & 1;');
            ag.addl('regs.A = (c << 7) | (regs.A >>> 1);');
            ag.addl('regs.F.C = c;');
            ag.addl('regs.F.N = regs.F.H = 0;');
            ag.setXY('regs.A');
            break;
        case Z80_MN.RRD:  //
            ag.Q(1)
            ag.addl('regs.WZ = ' + ag.readreg(arg1) +';');
            ag.read('regs.WZ', 'regs.TR');
            ag.addcycle();
            ag.write('regs.WZ', '((regs.TR >>> 4) | (regs.A << 4)) & 0xFF');
            ag.addl('regs.WZ = (regs.WZ + 1) & 0xFFFF;');
            ag.addcycles(3);
            ag.addl('regs.A = (regs.A & 0xF0) | (regs.TR & 0x0F);');

            ag.addl('regs.F.N = regs.F.H = 0;');
            ag.setP('regs.A');
            ag.setXY('regs.A');
            ag.setZ('regs.A');
            ag.setS8('regs.A');
            break;
        case Z80_MN.RST_o:  //n3
            ag.Q(0);
            ag.addcycle();
            ag.push16('regs.PC');
            ag.addl('regs.WZ = ' + hex0x2(parseInt(arg1) << 3) + ';');
            ag.addl('regs.PC = regs.WZ;');
            break;
        case Z80_MN.SBC_a_irr:  //n16&
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.SUB('regs.A', 'regs.TR', 'regs.F.C', 'regs.A');
            break;
        case Z80_MN.SBC_a_n:  //
            ag.Q(1);
            ag.operand8('regs.TR');
            ag.SUB('regs.A', 'regs.TR', 'regs.F.C', 'regs.A');
            break;
        case Z80_MN.SBC_a_r:  //n8&
            ag.Q(1);
            ag.SUB('regs.A', ag.readreg(Z80hacksub(arg1, sub)), 'regs.F.C', 'regs.A');
            break;
        case Z80_MN.SBC_hl_rr:  //n16&
            ag.Q(1);
            if (GENTARGET === 'as') {
                ag.psaddl('let x: i32, y: i32, z: i32, c: i32;');
            }
            else {
                ag.psaddl('let x, y, z, c;');

            }

            ag.addl('regs.TA = ' + ag.readreg('HL') + ';');
            ag.addl('regs.WZ = (regs.TA + 1) & 0xFFFF;');
            ag.addcycles(4);
            ag.SUB('regs.L', ag.readregL(arg1), 'regs.F.C', 'regs.t[0]', false);
            ag.addcycles(3);
            ag.SUB('regs.H', ag.readregH(arg1), 'regs.F.C', 'regs.t[1]', false);
            ag.addl('regs.H = regs.t[1];');
            ag.addl('regs.L = regs.t[0];');
            ag.addl('regs.F.Z = +((regs.H ' + GENEQO + ' 0) && (regs.L ' + GENEQO + ' 0));');
            break;
        case Z80_MN.SCF:  //
            ag.addl('if (regs.Q) { regs.F.X = 0; regs.F.Y = 0; }');
            ag.addl('regs.F.C = regs.Q = 1;');
            ag.addl('regs.F.N = regs.F.H = 0;');
            ag.addl('regs.F.X |= ((regs.A & 8) >>> 3);');
            ag.addl('regs.F.Y |= ((regs.A & 0x20) >>> 5);');
            break;
        case Z80_MN.SET_o_irr:  //n3, n16&
            ag.Q(1);
            ag.read(ag.readreg(arg2), 'regs.TR');
            ag.SET(arg1, 'regs.TR', 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg2), 'regs.TR');
            break;
        case Z80_MN.SET_o_irr_r:  //n3, n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg2), 'regs.TR');
            ag.SET(arg1, 'regs.TR', 'regs.TR');
            ag.addcycle('wait');
            ag.writereg(arg3, 'regs.TR');
            ag.write(ag.readreg(arg2), 'regs.TR');
            break;
        case Z80_MN.SET_o_r:  //n3, n8&
            ag.Q(1);
            ag.SET(arg1, ag.readreg(arg2), 'regs.TR');
            ag.writereg(arg2, 'regs.TR');
            break;
        case Z80_MN.SLA_irr:  //n16&
            ag.Q(1);
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.SLA('regs.TR', 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.SLA_irr_r:  //n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.SLA('regs.TR', 'regs.TR');
            ag.writereg(arg2, 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.SLA_r:  //n8&
            ag.Q(1);
            ag.SLA(ag.readreg(arg1), 'regs.TR');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.SLL_irr:  //n16&
            ag.Q(1);
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.addcycle('wait');
            ag.SLL('regs.TR', 'regs.TR');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.SLL_irr_r:  //n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.SLL('regs.TR', 'regs.TR');
            ag.writereg(arg2, 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.SLL_r:  //n8&
            ag.Q(1);
            ag.SLL(ag.readreg(arg1), 'regs.TR');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.SRA_irr:  //n16&
            ag.Q(1);
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.SRA('regs.TR', 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.SRA_irr_r:  //n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.SRA('regs.TR', 'regs.TR');
            ag.writereg(arg2, 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.SRA_r:  //n8&
            ag.Q(1);
            ag.SRA(ag.readreg(arg1), 'regs.TR');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.SRL_irr:  //n16&
            ag.Q(1);
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.SRL('regs.TR', 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.SRL_irr_r:  //n16&, n8&
            ag.Q(1);
            ag.addcycle('wait');
            ag.addcycle('wait');
            ag.read(ag.readreg(arg1), 'regs.TR');
            ag.SRL('regs.TR', 'regs.TR');
            ag.writereg(arg2, 'regs.TR');
            ag.addcycle('wait');
            ag.write(ag.readreg(arg1), 'regs.TR');
            break;
        case Z80_MN.SRL_r:  //n8&
            ag.Q(1);
            ag.SRL(ag.readreg(arg1), 'regs.TR');
            ag.writereg(arg1, 'regs.TR');
            break;
        case Z80_MN.SUB_a_irr:  //n16&
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.SUB('regs.A', 'regs.TR', '0', 'regs.A');
            break;
        case Z80_MN.SUB_a_n:  //
            ag.Q(1);
            ag.operand8('regs.TR');
            ag.SUB('regs.A', 'regs.TR', '0', 'regs.A');
            break;
        case Z80_MN.SUB_a_r:  //n8&
            ag.Q(1);
            ag.SUB('regs.A', ag.readreg(Z80hacksub(arg1, sub)), '0', 'regs.A');
            break;
        case Z80_MN.XOR_a_irr:  //n16&
            ag.Q(1);
            ag.displace(arg1, 'regs.TA');
            ag.read('regs.TA', 'regs.TR');
            ag.XOR('regs.A', 'regs.TR', 'regs.A');
            break;
        case Z80_MN.XOR_a_n:  //
            ag.Q(1);
            ag.operand8('regs.TR');
            ag.XOR('regs.A', 'regs.TR', 'regs.A');
            break;
        case Z80_MN.XOR_a_r:  //n8&
            ag.Q(1);
            ag.XOR('regs.A', ag.readreg(Z80hacksub(arg1, sub)), 'regs.A');
            break;
    }
    if (as)
        return 'function(regs: z80_regs, pins: z80_pins): void { // ' + opcode_info.mnemonic + '\n' + ag.finished() + indent + '}';
    else if (GENTARGET === 'js')
        return 'function(regs, pins) { //' + opcode_info.mnemonic + '\n' + ag.finished() + indent + '}';
    else if (GENTARGET === 'c')
        return ag.finished() + '}';
    else
        return 'HOOLIGAN!';
}

function Z80_get_matrix_by_prefix(prfx, i) {
    switch(prfx) {
        case 0:
            return 'Z80_opcode_matrix[' + hex0x2(i) + '], // ' + hex2(i) + '\n';
        case 0xCB:
            return 'Z80_CB_opcode_matrix[' + hex0x2(i) + '], // CB ' + hex2(i) + '\n';
        case 0xED:
            return 'Z80_ED_opcode_matrix[' + hex0x2(i) + '], // ED ' + hex2(i) + '\n';
        case 0xDD:
            return 'Z80_opcode_matrix[' + hex0x2(i) + '], // DD ' + hex2(i) + '\n';
        case 0xFD:
            return 'Z80_opcode_matrix[' + hex0x2(i) + '], // FD ' + hex2(i) + '\n';
        case 0xDDCB:
            return 'Z80_CBd_opcode_matrix[' + hex0x2(i) + '], // CB DD ' + hex2(i) + '\n';
        case 0xFDCB:
            return 'Z80_CBd_opcode_matrix[' + hex0x2(i) + '], // CB FD ' + hex2(i) + '\n';
    }
}

function Z80_get_matrix_by_prefix_as(prfx, i) {
    switch(prfx) {
        case 0:
            return 'Z80_opcode_matrix.get(' + hex0x2(i) + '), // ' + hex2(i) + '\n';
        case 0xCB:
            return 'Z80_CB_opcode_matrix.get(' + hex0x2(i) + '), // CB ' + hex2(i) + '\n';
        case 0xED:
            return 'Z80_ED_opcode_matrix.get(' + hex0x2(i) + '), // ED ' + hex2(i) + '\n';
        case 0xDD:
            return 'Z80_opcode_matrix.get(' + hex0x2(i) + '), // DD ' + hex2(i) + '\n';
        case 0xFD:
            return 'Z80_opcode_matrix.get(' + hex0x2(i) + '), // FD ' + hex2(i) + '\n';
        case 0xDDCB:
            return 'Z80_CBd_opcode_matrix.get(' + hex0x2(i) + '), // CB DD ' + hex2(i) + '\n';
        case 0xFDCB:
            return 'Z80_CBd_opcode_matrix.get(' + hex0x2(i) + '), // CB FD ' + hex2(i) + '\n';
    }
}


function generate_z80_core_as(CMOS) {
    let output_name = 'z80_decoded_opcodes';
    let outstr = 'import {Z80_opcode_functions, Z80_opcode_matrix, Z80_CB_opcode_matrix, Z80_CBd_opcode_matrix, Z80_ED_opcode_matrix, Z80_MAX_OPCODE, Z80_S_DECODE, Z80_parity} from "./z80_opcodes"\n' +
    'import {z80_pins, z80_regs, Z80P} from "./z80"\n'
    outstr += 'import {mksigned8} from "../../../helpers/helpers"\n'
    outstr += '\nexport var ' + output_name + ': Array<Z80_opcode_functions> = new Array<Z80_opcode_functions>(((Z80_MAX_OPCODE+1)*7));';
    outstr += '\n\nfunction z80_get_opcode_function(opcode: u32): Z80_opcode_functions {';
    outstr += '\n    switch(opcode) {\n'
    let indent = '        ';
    let firstin = false;
    let num_opcodes = 0;
    for (let p in Z80_prefixes) {
        let prfx = Z80_prefixes[p];
        for (let i = 0; i <= Z80_MAX_OPCODE; i++) {
            num_opcodes++;
            let matrix_code = Z80_prefix_to_codemap[prfx] + i;
            let mystr = indent + 'case ' + hex0x2(matrix_code) + ': return new Z80_opcode_functions(';
            let r = Z80_get_opc_by_prefix(prfx, i);
            let ra;
            if ((typeof r === 'undefined') || (typeof r.opc === 'undefined')) {
                mystr += Z80_get_matrix_by_prefix_as(0, 0);
                ra = Z80_generate_instruction_function(indent, Z80_get_opc_by_prefix(0, 0), null, CMOS, true);
            }
            else {
                let sre = Z80_get_matrix_by_prefix_as(prfx, i);
                if (typeof sre === 'undefined') {
                    console.log('WHAT?', hex2(prfx), hex2(i));
                }
                mystr += sre;
                ra = Z80_generate_instruction_function(indent, r.opc, r.sub, CMOS, true);
            }
            mystr += '            ' + ra + ');';
            if (firstin)
                outstr += '\n';
            firstin = true;
            outstr += mystr;
        }
    }
    outstr += '\n    }';
    outstr += "\n    return new Z80_opcode_functions(Z80_opcode_matrix.get(0), function(regs: z80_regs, pins: z80_pins): void { console.log('INVALID OPCODE');});";
    outstr += '\n}'
    outstr += '\n\nfor (let i = 0; i <= ' + num_opcodes + '; i++) {';
    outstr += '\n    ' + output_name + '[i] = z80_get_opcode_function(i);';
    outstr += '\n}\n'
    return outstr;
}

function generate_z80_core(CMOS) {
    let outstr = '"use strict";\n\nconst z80_decoded_opcodes = Object.freeze({\n';
    let indent = '    ';
    let firstin = false;
    for (let p in Z80_prefixes) {
        let prfx = Z80_prefixes[p];
        for (let i = 0; i <= Z80_MAX_OPCODE; i++) {
            let matrix_code = Z80_prefix_to_codemap[prfx] + i;
            let mystr = indent + hex0x2(matrix_code) + ': new Z80_opcode_functions(';
            let r = Z80_get_opc_by_prefix(prfx, i);
            let ra;
            if ((typeof r === 'undefined') || (typeof r.opc === 'undefined')) {
                mystr += 'Z80_opcode_matrix[0x00],\n';
                ra = Z80_generate_instruction_function(indent, Z80_opcode_matrix[0], null, CMOS);
            }
            else {
                let sre = Z80_get_matrix_by_prefix(prfx, i);
                if (typeof sre === 'undefined') {
                    console.log('WHAT?', hex2(prfx), hex2(i));
                }
                mystr += sre;
                ra = Z80_generate_instruction_function(indent, r.opc, r.sub, CMOS);
            }
            mystr += '        ' + ra + ')';
            if (firstin)
                outstr += ',\n';
            firstin = true;
            outstr += mystr;
        }
    }
    outstr += '\n});';
    return outstr;
}

function Z80_C_func_name(opc, prefix, r)
{
    return "Z80_ins_" + hex2(prefix) + '_' + hex2(opc) + '_' + Z80_MN_R[r.ins];
}

function Z80_C_func_signature(opc, prefix, r)
{
    return 'void ' + Z80_C_func_name(opc, prefix, r) + '(struct Z80_regs* regs, struct Z80_pins* pins)';
}

function Z80_C_func_dec(opc, prefix, r) {
    return Z80_C_func_signature(opc, prefix, r) + '; // ' + r.mnemonic + '\n';
}

function generate_z80_core_h(CMOS) {
    let header = '#ifndef _JSMOOCH_Z80_OPCODES_H\n' +
        '#define _JSMOOCH_Z80_OPCODES_H\n' +
        '\n' +
        '#include "z80.h"\n' +
        '#include "z80_opcodes.h"\n' +
        '\n' +
        '// This file mostly generated by sm83_opcodes.js in JSMoo\n' +
        '\n' +
        'extern Z80_ins_func Z80_decoded_opcodes[1806];\n'

    return header + '\n#endif\n';
}
//console.log(generate_z80_core_h());

function generate_z80_opcode_table(CMOS) {
    let o2 = 'Z80_ins_func Z80_decoded_opcodes[' + ((Z80_MAX_OPCODE+1)*7).toString() + '] = {\n';
    let perline = 0;
    for (let p in Z80_prefixes) {
        let prfx = Z80_prefixes[p];
        for (let i = 0; i <= Z80_MAX_OPCODE; i++) {
            let on = Z80_prefix_to_codemap[prfx] + i;
            let opc = Z80_get_opc_by_prefix(prfx, i).opc;
            let mstr = '';
	        if (typeof opc === 'undefined') {
                o2 += '  &Z80_ins_00_00_NOP,';
            }
            else {
                mstr = Z80_C_func_dec(i, prfx, opc);
                o2 += '  &' + Z80_C_func_name(i, prfx, opc) + ',';
            }
            perline++;
            if (perline === 5) {
                perline = 0;
                o2 += '\n';
            } else o2 += ' ';
        }
    }
    o2 += '\n};\n';
    return o2;
}


function generate_z80_core_c(CMOS) {
    let outstr = '#include "helpers/int.h"\n' +
        '#include "z80.h"\n' +
        '\n' +
        '// This file auto-generated by z80_core_generator.js in JSMoo\n' +
        '\n';
    let indent = '';
    let firstin = false;
    for (let p in Z80_prefixes) {
        let prfx = Z80_prefixes[p];
        for (let i = 0; i <= Z80_MAX_OPCODE; i++) {
            let matrix_code = Z80_prefix_to_codemap[prfx] + i;
            let r = Z80_get_opc_by_prefix(prfx, i);
            if ((typeof r === 'undefined') || (typeof r.opc === 'undefined')) {
                //ra = Z80_generate_instruction_function(indent, Z80_opcode_matrix[0], null, CMOS, false, true);
                continue;
            }
            let opc = r.opc;
            let mystr = Z80_C_func_signature(i, prfx, opc) + '\n{\n';
            let ra;
            /*let sre = Z80_get_matrix_by_prefix(prfx, i);
            if (typeof sre === 'undefined') {
                console.log('WHAT?', hex2(prfx), hex2(i));
            }
            mystr += sre;*/
            ra = Z80_generate_instruction_function(indent, r.opc, r.sub, CMOS, false, true);
            mystr += ra + '\n';
            if (firstin)
                outstr += '\n';
            firstin = true;
            outstr += mystr;
        }
    }
    outstr += '\n' + generate_z80_opcode_table();
    return outstr;
}

//generate_z80_core();
//console.log(Z80_generate_instruction_function('', Z80_opcode_matrix[0x8E], null));
