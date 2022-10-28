// GENTARGET = js or as

class M68K_switchgen {
    constructor(indent, what) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.indent3 = '    ' + this.indent2;
        this.in_case = false;
        this.last_case = 0;
        this.added_lines = 0;
        this.has_footer = false;
        this.no_addr_at_end = false;
        this.outstr = this.indent1 + 'switch(regs.TCU) {\n';
        this.has_cycle = false;
        this.on_cycle = [];

        this.old_astrobe = 0;
        this.old_rw = 0;
        this.old_uds = 0;
        this.old_lds = 0;

        this.opcode_info = what;
    }

    psaddl(what) {
        this.added_lines++;
        this.outstr = this.indent1 + what + '\n' + this.outstr;
    }

    addl(what) {
        this.added_lines++;
        if (this.has_cycle)
            this.outstr += this.indent3 + what + '\n';
        else
            this.on_cycle.push(what);
    }

    idle(howmany) {
        this.addcycles(howmany);
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
        // TODO: fix this
        /*
        this.RWM(0, 0, 0, 0);
        this.addl('regs.TCU = 0;');
        this.addl('regs.EI = 0;');
        this.addl('regs.P = 0;');
        this.addl('regs.prefix = 0x00;');
        this.addl('regs.rprefix = Z80P.HL;');
        this.addl('regs.IR = Z80_S_DECODE;');
        this.addl('regs.poll_IRQ = true;');*/
        this.addl('break;');
    }

    RWAUL(rw, addr_strobe, uds, lds) {
        let ostr = '';
        let ndsp = false;
        if (rw !== this.old_rw) {
            ostr += 'pins.RW = ' + rw + ';';
            this.old_rw = rw;
            ndsp = true;
        }
        if (addr_strobe !== this.old_astrobe) {
            if (ndsp) ostr += ' ';
            ostr += 'pins.AS = ' + addr_strobe + ';';
            this.old_astrobe = addr_strobe;
            ndsp = true;
        }
        if (uds !== this.old_uds) {
            if (ndsp) ostr += ' ';
            ostr += 'pins.UDS = ' + uds + ';';
            this.old_uds = uds;
            ndsp = true;
        }
        if (lds !== this.old_lds) {
            if (ndsp) ostr += ' ';
            ostr += 'pins.LDS = ' + lds + ';';
            this.old_lds = lds;
            ndsp = true;
        }
        if (ostr.length > 0) this.addl(ostr);
    }

    finished() {
        if ((!this.in_case) && (this.added_lines === 0)) {
            return '';
        }
        this.regular_end();

        this.outstr += this.indent1 + '}\n';
        return this.outstr;
    }

    addcycles(howmany) {
        this.RWAUL(0, 0, 0, 0);
        let first = true;
        for (let i = 0; i < howmany; i++) {
            if (first) this.addcycle('Adding ' + howmany + ' cycles');
            else this.addcycle();
            first = false;
        }
    }

    /* Bus activity */
    read16(addr, to) {
        /* 16-bit Read
           S0 - RW assert READ (0)
           S1 - assert address
           S2 - assert AS, UDS/LDS
           S3 - nothing
           S4 - waits for DTACK (not emulated)
           S5 - nothing
           S6 - data driven to bus
           S7 - data is latched. AS, UDS, LDS negated. address bus disconnect. negate DTACK

           16-bit write
           S0 - RW assert to READ (0)
           S1 - assert address
           S2 - assert AS, RW assert to WRITE (1)
           S3 - data placed on data bus
           S4 - assert UDS/LDS, wait for DTACK.
           S5 - nothing
           S6 - nothing
           S7 - negate AS, UDS, LDS, data, address. negate DTACK

           16-bit RMW

         */
    }

    /* Instructions */

    read_B_EA(ea, what, hold, fast) {
        let ostr = what + ' = ';
        switch(ea.mode) {
            case M68K_AM.DataRegisterDirect:
                ostr += 'regs.D['
        }
        return what + ' = ' + '';
    }
}


/**
 * @param {String} indent
 * @param {M68K_ins} opcode_info
 */
function M68K_generate_instruction_function(indent, opcode_info, opt_matrix) {
    let indent2 = indent + '    ';
    let ag = new M68K_switchgen(indent2, opcode_info);
    if (typeof opcode_info === 'undefined') debugger;
    let arg1 = opcode_info.arg1;
    let arg2 = opcode_info.arg2;
    let options = '';
    let EA_to_obj = function(ea) { return '{mode:' + ea.mode + ', reg:' + ea.reg +'}'; }

    switch(opcode_info.MN) {
        case M68K_MN.ABCD:
            opt_matrix[opcode_info.opcode] = '{from: ' + EA_to_obj(arg1) + ', mwith: ' + EA_to_obj(arg2) + '}';
            break;
        case M68K_MN.AND_B_EA_DR:
            opt_matrix[opcode_info.opcode] = '{from: ' + EA_to_obj(arg1) + ', mwith: ' + arg2.number + '}';
            ag.idle(2);
            ag.read_EA('args.from', 'regs.TR');
            break;
        default:
            console.log('UNKNOWN OPCODE ' + hex4(opcode_info.opcode), opcode_info.MN, M68K_MN_R[opcode_info.MN]);
            break;
    }

    return 'function M68K_' + opcode_info.ins_name + '(regs, pins, args) { //' + opcode_info.ins_name + '\n' + ag.finished() + indent + '}';
}

function M68K_generate_core() {
    let ins_matrix = fill_m68k_opcode_table();
    // Array of objects to call with
    let opt_matrix = new Array(65536);
    let opc_info = ins_matrix[0xC402]; // ABCD 2 2 hopefully
    let func_matrix = {};
    let i = 0;
    let a = M68K_generate_instruction_function('', opc_info, opt_matrix);
    func_matrix[opc_info.ins_name] = a;

    console.log(func_matrix, opt_matrix);
}

//M68K_generate_core();