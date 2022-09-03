"use strict";

const Z80_MAX_OPCODE = 0xFF;
// opcode
// prefix
// two-prefix
const Z80_prefixes = [null, 0xCB, 0xDD, 0xED, 0xFD, 0xDDCB, 0xFDCB]
const Z80_matrix_size = Z80_MAX_OPCODE * Z80_prefixes.length;

const Z80_prefix_to_codemap = Object.freeze({
    [Z80_prefixes[0]]: 0x00,
    [Z80_prefixes[1]]: Z80_MAX_OPCODE;
    [Z80_prefixes[2]]: Z80_MAX_OPCODE * 2;
    [Z80_prefixes[3]]: Z80_MAX_OPCODE * 3;
    [Z80_prefixes[4]]: Z80_MAX_OPCODE * 4;
    [Z80_prefixes[5]]: Z80_MAX_OPCODE * 5;
    [Z80_prefixes[6]]: Z80_MAX_OPCODE * 6;
});

class Z80_get_opc_by_prefix_ret {
    constructor(opc, sub) {
        this.opc = opc;
        this.sub = sub;
    }
}

function Z80_get_opc_by_prefix(prfx, i) {
    switch(prfx) {
        case null:
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
            return new Z80_get_opc_by_prefix_ret(Z80_CBd_opcode_matrix[i], 'IX+d');
        case 0xFDCB:
            return new Z80_get_opc_by_prefix_ret(Z80_CBd_opcode_matrix[i], 'IY+d');
    }
}

class Z80_switchgen {
    constructor(indent, what, sub) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.in_case = false;
        this.last_case = 0;
        this.has_footer = false;
        this.no_addr_at_end = false;
        this.no_RW_at_end = false;
        this.outstr = '';

        this.old_wr = 0;
        this.old_rd = 0;
        this.old_io = 0;

        this.opcode_info = what;

        this.clear(indent, what);
    }

    addl(what) {
        this.outstr += this.indent3 + what + '\n';
    }

    // We actually ignore the input cycle #
    // This is determined automatically
    // Passed in is reference cycle # and/or a comment for the bros
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

    // This is a final "cycle" only SOME functions use, mostly to get final data read done
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
            this.RWIO(1, 0, 0);
        this.addl('regs.TCU = 0;')
        this.addl('break;')
    }

    RWIO(rd, wr, io) {
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
        if (io !== this.old_io) {
            if (ndsp) ostr += ' ';
            ostr += 'pins.IO = '+ io + ';';
            this.old_io = io;
            ndsp = true;
        }
        this.addl(ostr);
    }

    addr_to_PC_then_inc() {
        this.addl('pins.Addr = regs.PC;');
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    finished() {
        if (!this.in_case) {
            return '';
        }
        this.regular_end();

        this.outstr += this.indent1 + '}\n';
        return this.outstr;
    }

}

/**
 * @param {String} indent
 * @param {Z80_opcode_info} opcode_info
 * @param {null|String} sub
 * @constructor
 */
function Z80_generate_instruction_function(indent, opcode_info, sub) {
    let r;
    let indent2 = indent + '    ';
    let bnum;
    let ag = new Z80_switchgen(indent2, opcode_info.opcode, sub);
    switch(opcode_info.ins) {

    }
}

function generate_z80_core() {
    let outstr = '"use strict";\n\nconst z80_decoded_opcodes = Object.freeze({\n';
    let indent = '    ';
    let firstin = false;
    for (let p in Z80_prefixes) {
        let prfx = Z80_prefixes[prfx];
        for (let i = 0; i <= Z80_MAX_OPCODE; i++) {
            let mystr = indent + hex0x2(i) + ': new Z80_opcode_functions(';
            let matrix_code = Z80_prefix_to_codemap[prfx] + i;
            let r = Z80_get_opc_by_prefix(prfx, i);
            let ra;
            if (typeof r === 'undefined') {
                mystr += 'Z80_opcode_matrix[0x00],\n';
                ra = Z80_generate_instruction_function(indent, Z80_opcode_matrix[0], null);
            }
            else {
                ra = Z80_generate_instruction_function(indent, r.opc, r.sub);
            }
            mystr += '        ' + r + ')';
            if (firstin)
                outstr += ',\n';
            firstin = true;
            outstr += mystr;
        }
        outstr += '\n});';
        return outstr;
    }
}

generate_z80_core();