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

        this.temp_regs_used = [false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false]
    }

    allocate_temp_reg() {
        for (let i = 0; i < 16; i++) {
            if (!this.temp_regs_used[i]) {
                this.temp_regs_used[i] = true;
                return 'regs.TR[' + i + ']';
            }
        }
    }

    deallocate_temp_reg(which) {
        let rnum = parseInt(which.replace('regs.TR[', '').replace(']', ''));
        this.temp_regs_used[rnum] = false;
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
        console.log('NEW CYCLE', what, whatup);
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

    addr_to_PC_then_inc() {
        this.addl('pins.Addr = regs.PC;');
        this.addl('regs.PC = (regs.PC + 2) & 0xFFFFFFFF;');
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

    addcycles(howmany, actually_make_them=true) {
        if (!actually_make_them) console.log('PLEASE IMPLEMENT actually_make_them');
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


    readDR(reg, output, Tsize='L') {
        switch(Tsize) {
            case 'L':
                this.addl(output + ' = ' + '(regs.D[' + reg.number + '] & 0xFFFFFFFF);');
                return;
            case 'W':
                this.addl(output + ' = ' + '(regs.D[' + reg.number + '] & 0xFFFF);');
                return;
            case 'B':
                this.addl(output + ' = ' + '(regs.D[' + reg.number + '] & 0xFF);');
                return;
        }
    }

    readAR(reg, output, Tsize='L') {
        switch(Tsize) {
            case 'L':
                this.addl(output + ' = regs.A[' + reg.number + '] & 0xFFFFFFFF;');
                return;
            case 'W':
                this.addl(output + ' = regs.A[' + reg.number + '] & 0xFFFF;');
                return;
            case 'B':
                this.addl(output + ' = regs.A[' + reg.number + '] & 0xFF;');
                return;
        }
    }

    inc_PC2() {
        this.addl('regs.PC = (regs.PC + 2) & 0xFFFFFF;');
    }

    readM(upper, lower, address, output) {
        if (upper && lower) {
            this.readAddrW(address, output);
            return;
        }
        this.readAddrW(address + ' & 0xFFFFFFFE', output);
        if (upper) this.addl(output + ' = (' + output + ' & 0xFF00) >>> 8;');
        else this.addl(output + ' &= 0xFF;');
    }

    extension(Tsize, output) {
        switch(Tsize) {
            case 'B':
                this.idle(4);
                this.addl('regs.IR = regs.IRC;');
                this.readM(1, 1, 'regs.PC & 0xFFFFFE', 'regs.IRC');
                this.inc_PC2();
                this.addl(output + ' = regs.IR & 0xFF;');
                return;
            case 'W':
                this.idle(4);
                this.addl('regs.IR = regs.IRC;');
                this.readM(1, 1, 'regs.PC & 0xFFFFFE', 'regs.IRC');
                this.inc_PC2();
                this.addl(output + ' = regs.IR;');
                return;
            case 'L':
                this.addl('let hi, lo;');
                this.extension('W', 'hi');
                this.extension('W', 'lo');
                this.addl(output + ' = (hi << 16) | lo;');
                debugger;
        }
    }

    /* Instruction support functions */
    /**
     * @param Tsize
     * @param {M68K_EA} ea
     * @param {string} output
     * @returns {number}
     */
    fetch(Tsize, ea, output) { // NOT COMPLETE
        if (ea.valid) {
            console.log('HMMM?', ea);
            return ea.address;
        }
        ea.valid = true;

        let TR1, TR2, TR3;
        switch(ea.mode) {
            case M68K_AM.DataRegisterDirect:
                this.readDR(new M68K_DR(ea.reg), output);
                ea.address = output;
                return;
            case M68K_AM.AddressRegisterDirect:
                this.readAR(new M68K_AR(ea.reg), output);
                ea.address = output;
                return;
            case M68K_AM.AddressRegisterIndirect:
                this.readAR(new M68K_AR(ea.reg), output);
                ea.address = output;
                return;
            case M68K_AM.AddressRegisterIndirectWithPostIncrement:
                this.readAR(new M68K_AR(ea.reg), output);
                ea.address = output;
                return;
            case M68K_AM.AddressRegisterIndirectWithPreDecrement:
                this.readAR(new M68K_AR(ea.reg), output);
                ea.address = output;
                return;
            case M68K_AM.AddressRegisterIndirectWithDisplacement:
                this.readAR(new M68K_AR(ea.reg), output);
                ea.address = output;
                return;
            case M68K_AM.AddressRegisterIndirectWithIndex:
                this.idle(2);
                TR1 = this.allocate_temp_reg();
                TR2 = this.allocate_temp_reg();
                this.extension('W', TR1);
                this.addl('let index = (' + TR1 + ' & 0x8000) ? regs.A[(' + TR1 + ' >>> 12) & 7] : regs.D[(' + TR1 + ' >>> 12) & 7];');
                this.addl('if (!(' + TR1 + ' & 0x800)) index = mksigned16(index & 0xFFFF);');
                this.readAR(ea.reg, TR2);
                this.addl(output + ' = ((' + TR2 + ' + index + mksigned8(' + TR1 + ' & 0xFF)) & 0xFFFFFFFF);');
                ea.address = output;
                return;
            case M68K_AM.AbsoluteShortIndirect:
                TR1 = this.allocate_temp_reg();
                this.extension('W', TR1);
                this.addl(output + ' = mksigned16(' + TR1 + ')');
                ea.address = output;
                return;
            case M68K_AM.AbsoluteLongIndirect:
                TR1 = this.allocate_temp_reg();
                this.extension('L', TR1);
                this.addl(output + ' = ' + TR1 + ';');
                ea.address = output;
                return;
            case M68K_AM.ProgramCounterIndirectWithDisplacement:
                TR1 = this.allocate_temp_reg();
                TR2 = this.allocate_temp_reg();
                this.addl(TR2 + ' = (regs.PC - 2) & 0xFFFFFFFF;');
                this.extension('W', TR1);
                this.addl(output + ' = ((' + TR2 + ' + mksigned16(' + TR1 + ')) & 0xFFFFFFFF);');
                ea.address = output;
                return;
            case M68K_AM.ProgramCounterIndirectWithIndex:
                this.idle(2);
                TR1 = this.allocate_temp_reg();
                TR2 = this.allocate_temp_reg();
                this.addl(TR1 + ' = (regs.PC - 2) & 0xFFFFFFFF;');
                this.extension('W', TR2);
                this.addl('let index = (' + TR2 + ' & 0x8000) ? regs.A[(' + TR2 + ' >>> 12) & 7] : regs.D[(' + TR2 + ' >>> 12) & 7];');
                this.addl('if(!(' + TR2 + ' & 0x800)) index = mksigned16(index & 0xFFFF);');
                this.addl(output + ' = (' + TR1 + ' + index + mksigned8(' + TR2 + ' & 0xFF)) & 0xFFFFFFFF');
                ea.address = output;
                return;
            case M68K_AM.Immediate:
                TR1 = this.allocate_temp_reg();
                this.extension(Tsize, output);
                ea.address = output;
                return;
        }
        debugger; // should never occur
        return ea.address = '0';
    }

    read(Tsize, what, output, hold=false, fast=false) {
        //if (typeof(what) === M68K_MN)
                console.log('OUTPUT!', output);
        switch(what.kind) {
            case 'EA': // read<Tsize>(EffectiveAddress)
                return this.readEA(Tsize, what, output, hold, fast);
            case 'DR':
                return this.readDR(what, output, Tsize)
            case 'AR':
                return this.readAR(what, output, Tsize);
            default:
                console.log('INVESTIGATE3', what);
                return '40';
        }
    }

    readAddrB(addr, output) {
        this.readAddrW(addr + ' & 0xFFFFFFFE', output);
        if (output !== null) this.addl(output + ' = ((' + addr + ') & 1) ? ((' + output + ' & 0xFF00) >>> 8) : (' + output + ' & 0xFF;');
    }

    readAddrW(addr, output) {
        this.addcycle('read 1');
        this.addl('pins.Addr = ' + addr + ';');
        this.RWAUL(0, 1, 1, 1);
        this.addcycle('read 2');
        this.RWAUL(0, 0, 0, 0);
        if (output !== null) this.addl(output + ' = pins.D;');
        this.addcycle('read 3');
        this.addcycle('read 4');
    }

    readAddrL(addr, output) {
        let TR1 = this.allocate_temp_reg();
        if (output !== null) {
            this.readAddrW(addr, TR1);
            this.readAddrW('(' + addr + ' + 2) & 0xFFFFFFFF', output);
            this.addl(output + ' |= (' + TR1 + ' << 16);');
        }
        else {
            this.readAddrW(addr, null);
            this.readAddrW('(' + addr + ' + 2) & 0xFFFFFFFF', output);
        }
    }

    readAddr(Tsize, addr, output) {
        switch(Tsize) {
            case 'B':
                this.readAddrB(addr, output);
                return;
            case 'W':
                this.readAddrW(addr, output);
                return;
            case 'L':
                this.readAddrL(addr, output);
                return;
        }
        debugger;
    }

    bytes(Tsize) {
        switch(Tsize) {
            case 'B':
                return 1;
            case 'W':
                return 2;
            case 'L':
                return 4;
        }
        debugger;
    }

    readEA(Tsize, ea, output, hold, fast) { // NOT COMPLETE
        let TR0 = this.allocate_temp_reg();
        this.fetch(Tsize, ea, TR0);
        let TR1;
        let TR2;
        switch(ea.mode) {
            case M68K_AM.DataRegisterDirect:
                this.addl(output + ' = ' + this.clip(Tsize, ea.address) + ';');
                return;
            case M68K_AM.AddressRegisterDirect:
                this.addl(output + ' = ' + this.sign(Tsize, ea.address) + ';');
                return;
            case M68K_AM.AddressRegisterIndirect:
                this.readAddr(Tsize, ea.address, output);
                return;
            case M68K_AM.AddressRegisterIndirectWithPostIncrement:
                TR1 = this.allocate_temp_reg();
                TR2 = this.allocate_temp_reg();
                let inc;
                if ((Tsize === 'B') && (ea.reg === 7)) {
                    inc = 2;
                } else {
                    inc = this.bytes(Tsize);
                }
                this.addl(TR2 + ' = (' + ea.address + ' + ' + TR2 + ') & 0xFFFFFFFF;');
                this.readAddr(Tsize, TR2, TR1);
                if (!hold) this.writeAR(new M68K_AR(ea.reg), ea.address = TR2);
                this.addl(output + ' = ' + TR1 + ';');
                this.deallocate_temp_reg(TR1);
                this.deallocate_temp_reg(TR2);
                return;
            case M68K_AM.AddressRegisterIndirectWithPreDecrement:
                if (!fast) this.addcycles(2);
                TR1 = this.allocate_temp_reg();
                TR2 = this.allocate_temp_reg();
                let dec;
                if ((Tsize === 'B') && (ea.reg === 7)) {
                    dec = 2;
                } else {
                    dec = this.bytes(Tsize);
                }
                this.addl(TR2 + ' = (' + ea.address + ' - ' + TR2 + ') & 0xFFFFFFFF;');
                this.readAddr(Tsize, TR2, TR1);
                if (!hold) this.writeAR(new M68K_AR(ea.reg), ea.address = TR2);
                this.addl(output + ' = ' + TR1 + ';');
                this.deallocate_temp_reg(TR1);
                this.deallocate_temp_reg(TR2);
                return;
            case M68K_AM.AddressRegisterIndirectWithDisplacement:
                this.read(Tsize, ea.address, output);
                return;
            case M68K_AM.AddressRegisterIndirectWithIndex:
                this.read(Tsize, ea.address, output);
                return;
            case M68K_AM.AbsoluteShortIndirect:
                this.read(Tsize, ea.address, output);
                return;
            case M68K_AM.AbsoluteLongIndirect:
                this.read(Tsize, ea.address, output);
                return;
            case M68K_AM.ProgramCounterIndirectWithDisplacement:
                this.read(Tsize, ea.address, output);
                return;
            case M68K_AM.ProgramCounterIndirectWithIndex:
                this.read(Tsize, ea.address, output);
                return;
            case M68K_AM.Immediate:
                this.addl(output + ' = ' + this.clip(Tsize, ea.address) + ';');
                return;
        }
        debugger;
        return 0;
    }

    writeDR(Tsize, what, value) {
        switch(Tsize) {
            case 'B':
                this.addl('regs.D[' + what.number + '] = (' + value + ') & 0xFF;');
                return;
            case 'W':
                this.addl('regs.D[' + what.number + '] = (' + value + ') & 0xFFFF;');
                return;
            case 'L':
                this.addl('regs.D[' + what.number + '] = (' + value + ') & 0xFFFFFFFF;');
                return;
        }
        debugger;
    }

    writeAR(Tsize, what, value) {
        switch(Tsize) {
            case 'B':
                this.addl('regs.A[' + what.number + '] = (' + value + ') & 0xFF;');
                return;
            case 'W':
                this.addl('regs.A[' + what.number + '] = (' + value + ') & 0xFFFF;');
                return;
            case 'L':
                this.addl('regs.A[' + what.number + '] = (' + value + ') & 0xFFFFFFFF;');
                return;
        }
        debugger;
    }

    write(Tsize, what, value) {
        console.log('YO!', what)
        switch(what.kind) {
            case 'DR':
                this.writeDR(Tsize, what, value);
                break;
            case 'AR':
                this.writeAR(Tsize, what, value);
                break;
            case 'EA':
                this.writeEA(Tsize, what, value);
                break;
            default:
                debugger;
        }
    }

    sign(Tsize, value) {
        switch(Tsize) {
            case 'B':
                return '((' + value + ' > 0x80) ? (-0x100 - ' + value + ') : ' + value + ');';
            case 'W':
                return '((' + value + ' > 0x8000) ? (-0x10000 - ' + value + ') : ' + value + ');';
            case 'L':
                return '((' + value + ' > 0x80000000) ? (-0x100000000 - ' + value + ') : ' + value + ');';
        }
    }

    clip(Tsize, value) {
        switch(Tsize) {
            case 'B':
                return '((' + value + ') & 0xFF)';
            case 'W':
                return '((' + value + ') & 0xFFFF)';
            case 'L':
                return '((' + value + ') & 0xFFFFFFFF)';
        }
        debugger;
        return 40;
    }

    // Set negative bit for 8-, 16-, or 32-bit value as if it is signed
    setN(Tsize, what) {
        switch(Tsize) {
            case 'B':
                this.addl('regs.N = +(((' + what + ') & 0xFF) > 0x7F);');
                return;
            case 'W':
                this.addl('regs.N = +(((' + what + ') & 0xFFFF) > 0x7FFF);');
                return;
            case 'L':
                this.addl('regs.N = +(((' + what + ') & 0xFFFFFFFF) > 0x7FFFFFFF);');
                return;
        }
        debugger;
    }

    prefetch(output=null) {
        this.addcycle('PREFETCH');
        this.addcycles(3)
        this.addl('regs.IR = regs.IRC;');
        this.readM(1, 1, 'regs.PC & 0xFFFFFFFE', 'regs.IRC');
        this.inc_PC2();
        if (output !== null)
            this.addl(output + ' = regs.IR;');
        this.addl('//PREFETCH END')
    }

    msb(Tsize) {
        switch(Tsize) {
            case 'L':
                return '0x80000000';
            case 'W':
                return '0x8000';
            case 'B':
                return '0x80';
        }
    }

    readCCR(output) {
        this.addl(output + ' = regs.C | (regs.V << 1) | (regs.Z << 2) | (regs.N << 3) | (regs.X << 4);');
    }

    writeCCR(input) {
        this.addl('regs.C = ' + input + ' & 1;');
        this.addl('regs.V = (' + input + ' & 2) >>> 1;');
        this.addl('regs.Z = (' + input + ' & 4) >>> 2;');
        this.addl('regs.N = (' + input + ' & 8) >>> 3;');
        this.addl('regs.X = (' + input + ' & 0x10) >>> 4;');
    }

    readSR(output) {
        this.addl(output + ' = regs.C | (regs.V << 1) | (regs.Z << 2) | (regs.N << 3) | (regs.X << 4) | (regs.I << 8) | (regs.S << 13) | (regs.T << 15);');
    }

    writeSR(input) {
        this.writeCCR(input);
        this.addl('if (regs.S !== ((' + input + ' >>> 13) & 1) {');
        let swap = this.allocate_temp_reg();
        this.addl('    ' + swap + ' = regs.A[7];');
        this.addl('    regs.A[7] = regs.SP;');
        this.addl('    regs.SP = ' + swap + ';');
        this.addl('}');

        this.addl('regs.I = (' + input + ' & 0x700) >>> 8;');
        this.addl('regs.S = (' + input + ' & 0x2000) >>> 13;');
        this.addl('regs.T = (' + input + ' & 0x8000) >>> 15;');
    }

    check_supervisor(do_prefetch) {
        this.addl('if (!regs.S) {')
        this.addl('    regs.PC = (regs.PC - 4) & 0xFFFFFFFF;');
        this.addl('    regs.EXC = M68K_EX.Unprivileged;');
        this.addl('    regs.EXC_vec = ' + hex4(M68K_VEC.Unprivileged) + ';');
        this.addl('    regs.TCU = 0;');
        this.addl('    return;');
        if (do_prefetch) this.prefetch();
        this.addl('}')
    }

    // *************So-called algorithms
    ADD(Tsize, source, target, out, extend=false) {
        let result = this.allocate_temp_reg();
        let carries = this.allocate_temp_reg();
        let overflow = this.allocate_temp_reg();

        if (extend)
            this.addl(result + ' = (' + target + ' + ' + source + ' + regs.X) & 0xFFFFFFFF;')
        else
            this.addl(result + ' = (' + target + ' + ' + source + ') & 0xFFFFFFFF;');
        this.addl(carries + ' = ' + target + ' ^ ' + source + ' ^ ' + result + ';');
        this.addl(overflow + ' = (' + target + ' ^ ' + result + ') & (' + source + ' ^ ' + result + ');');
        this.addl('regs.C = +(((' + carries + ' ^ ' + overflow + ') & ' + this.msb(Tsize) + ') === ' + this.msb(Tsize) + ');');
        this.addl('regs.V = +((' + overflow + ' & ' + this.msb(Tsize) + ') === ' + this.msb(Tsize) + ');');
        if (extend)
            this.addl('regs.Z = (' + this.clip(Tsize, result) + ') ? 0 : regs.Z;');
        else
            this.addl('regs.Z = (' + this.clip(Tsize, result) + ') ? 0 : 1;');
        this.addl('regs.N = +((' + this.sign(Tsize, result) + ') < 0);');
        this.addl('regs.X = regs.C;');

        this.addl(out + ' = ' + this.clip(Tsize, result) + ';');
    }


    AND(Tsize, source, target, out) {
        this.addl('let result = ' + target + ' & ' + source + ';');
        this.addl('regs.C = regs.V = 0;');
        ///let TR = this.allocate_temp_reg();
        this.addl(out + ' = ' + this.clip(Tsize, 'result') + ';');
        this.addl('regs.Z = +(' + out + ' === 0);');
        this.setN(Tsize, out);
        //this.addl(out + ' = ' + this.clip(Tsize, 'result') + ';');
    }

    ASL(Tsize, result, shift, output) {
        let carry = this.allocate_temp_reg();
        let overflow = this.allocate_temp_reg();
        let before = this.allocate_temp_reg();
        this.addl('for (let i = 0; i < ' + shift + '; i++) {')
        this.addl(carry + ' = +((' + result + ' & ' + this.msb(Tsize) + ') === ' + this.msb(Tsize) + ');');
        this.addl(before + ' = ' + result + ';');
        this.addl(result + ' = (' + result + ' << 1) & 0xFFFFFFFF;');
        this.addl(overflow + ' |= ' + before + ' ^ ' + result);
        this.addl('}');

        this.addl('regs.C = ' + carry + ';');
        this.addl('regs.V = +(' + this.sign(Tsize, overflow) + ' < 0)');
        this.addl('regs.Z = +(' + this.clip(Tsize, result) + ' === 0);');
        this.addl('regs.N = +(' + this.sign(Tsize, result) + ' < 0);');
        this.addl('if (' + shift + ') regs.X = regs.C;');
        this.addl(output + ' = ' + this.clip(Tsize, result) + ';');
    }

    // ************** instructions themselves
    instructionABCD(parsed, from, mwith) {
        if (from.mode === M68K_AM.DataRegisterDirect) this.addcycles(2);
        let source = this.allocate_temp_reg();
        let target = this.allocate_temp_reg();
        let result = this.allocate_temp_reg();
        let c = this.allocate_temp_reg();
        let v = this.allocate_temp_reg();
        let previous = this.allocate_temp_reg();

        this.read('B', from, source);
        this.read('B', mwith, target, true, true)
        this.addl(result + ' = ' + source + ' + ' + target + ' + regs.X;');
        this.addl(c + ' = ' + v + ' = 0;');

        this.addl('if (((' + target + ' ^ ' + source + ' ^ ' + result + ') & 0x10) || ((' + result + ' & 0x0F) >= 0x0A)) {');
        this.addl('    ' + previous + ' = ' + result + ';');
        this.addl('    ' + result + ' += 0x06;');
        this.addl('    ' + v + ' |= +(((' + previous + ' ^ 0xFF) & 0x80) & (' + result + ' & 0x80));');
        this.addl('}');

        this.addl('if (' + result + ' > 0xA0) {');
        this.addl('    ' + previous + ' = ' + result + ';');
        this.addl('    ' + result + ' += 0x60;');
        this.addl('    ' + c + ' = 1;');
        this.addl('    ' + v + ' |= (((' + previous + ' ^ 0xFF) & 0x80) & (' + result + ' & 0x80));');
        this.addl('}');

        this.prefetch();
        this.write('B', mwith, result);

        this.addl('regs.C = ' + c + ';');
        this.addl('regs.V = ' + v + ';');
        this.addl('regs.Z = (' + this.clip('B', result) + ') ? 0 : regs.Z;');
        this.addl('regs.N = +(' + this.sign('B', result) + ' < 0);');
        this.addl('regs.X = regs.C;');
    }

    instructionADD(parsed, from, mwith) {
        let source, target, result;
        source = this.allocate_temp_reg();
        target = this.allocate_temp_reg();
        result = this.allocate_temp_reg();
        switch(parsed.Ttype) {
            case 'EA_DR':
                if ((parsed.Tsize !== 'L') || (from.mode === M68K_AM.DataRegisterDirect) || (from.mode === M68K_AM.AddressRegisterDirect) || (from.mode === M68K_AM.Immediate)) {
                    this.addcycles(4);
                }
                else
                    this.addcycles(2);
                this.read(parsed.Tsize, from, source);
                this.read(parsed.Tsize, mwith, target);
                this.ADD(parsed.Tsize, source, target, result);
                this.prefetch();
                this.write(parsed.Tsize, mwith, result);
                break;
            case 'DR_EA':
                this.read(parsed.Tsize, from, source);
                this.read(parsed.Tsize, mwith, target, true);
                this.ADD(parsed.Tsize, source, target, result);
                this.prefetch();
                this.write(parsed.Tsize, mwith, result);
                break;
        }
    }

    instructionADDA(parsed, from, mwith) {
        if ((parsed.Tsize !== 'L') || (from.mode === M68K_AM.DataRegisterDirect) || (from.mode === M68K_AM.AddressRegisterDirect) || (from.mode === M68K_AM.Immediate))
            this.addcycles(4);
        else
            this.addcycles(2);
        let source = this.allocate_temp_reg();
        let target = this.allocate_temp_reg();
        this.read(parsed.Tsize, from, source);
        this.addl(source + ' = ' + this.sign(parsed.Tsize, source) + ';');
        this.read('L', mwith, target);
        this.prefetch();
        this.write('L', mwith, '(' + source + ' + ' + target + ') & 0xFFFFFFFF');
    }

    instructionADDI(parsed, mwith) {
        if((parsed.Tsize === 'L') && (mwith.mode === M68K_AM.DataRegisterDirect))
            this.idle(4);
        let source = this.allocate_temp_reg();
        let target = this.allocate_temp_reg();
        let result = this.allocate_temp_reg();
        this.extension(parsed.Tsize, source);
        this.read(parsed.Tsize, mwith, target, true);
        this.ADD(parsed.Tsize, source, target, result);
        this.prefetch();
        this.write(parsed.Tsize, mwith, result);
    }

    instructionADDQ(parsed, immediate, mwith) {
        let source = this.allocate_temp_reg();
        let target = this.allocate_temp_reg();
        let result = this.allocate_temp_reg();
        switch(parsed.Ttype) {
            case 'EA':
                if ((parsed.Tsize === 'L') && (mwith.mode === M68K_AM.DataRegisterDirect)) this.idle(4);
                this.addl(source + ' = ' + immediate + ';');
                this.read(parsed.Tsize, mwith, target, true);
                this.ADD(parsed.Tsize, source, target, result);
                this.prefetch();
                this.write(Tsize, mwith, result);
                break;
            case 'AR':
                this.idle(4);
                this.read('L', mwith, source);
                this.addl(result + ' = (' + source + ' + ' + immediate + ') & 0xFFFFFFFF;');
                this.prefetch();
                this.write('L', mwith, result);
                break;
            default:
                console.log('INVESTIGATE!');
                debugger;
        }
    }

    instructionADDX(parsed, from, mwith) {
        if ((parsed.Tsize === 'L') && (from.mode === M68K_AM.DataRegisterDirect)) this.idle(4);
        let source = this.allocate_temp_reg();
        let target = this.allocate_temp_reg();
        let result = this.allocate_temp_reg();
        this.read(parsed.Tsize, from, source);
        this.read(parsed.Tsize, mwith, target, true, true);
        this.ADD(parsed.Tsize, source, target, result, true);
        this.prefetch();
        this.write(parsed.Tsize, mwith, result);
    }

    /**
     * @param {M68K_MN_parse_ret} parsed
     * @param from
     * @param mwith
     */
    instructionAND(parsed, from, mwith) {
        let result, source, target;
        this.addl('//instructionAND');
        switch (parsed.Ttype) {
            case 'EA_DR':
                if (parsed.Tsize === 'L') {
                    if ((from.mode === M68K_AM.DataRegisterDirect) || (from.mode === M68K_AM.Immediate))
                        this.idle(4);
                    else
                        this.idle(2);
                }
                source = this.allocate_temp_reg();
                target = this.allocate_temp_reg();
                this.read(parsed.Tsize, from, source);
                this.read(parsed.Tsize, mwith, target);
                result = this.allocate_temp_reg();
                this.AND(parsed.Tsize, source, target, result);
                this.prefetch();
                this.write(parsed.Tsize, mwith, result);
                break;
            case 'DR_EA':
                source = this.allocate_temp_reg();
                target = this.allocate_temp_reg();
                this.read(parsed.Tsize, from, source);
                this.read(parsed.Tsize, mwith, target, true);
                result = this.allocate_temp_reg();
                this.AND(parsed.Tsize, source, target, result);
                this.prefetch();
                this.write(parsed.Tsize, mwith, result)
                break;
            default:
                console.log('INVESTIGATE2');
                break;
        }
    }

    instructionANDI(pa, mwith) {
        if ((pa.Tsize === 'L') && (mwith.mode === M68K_AM.DataRegisterDirect)) this.idle(4);
        let source = this.allocate_temp_reg();
        let target = this.allocate_temp_reg();
        let result = this.allocate_temp_reg();
        this.extension(pa.Tsize, source);
        this.read(pa.Tsize, mwith, target, true);
        this.AND(pa.Tsize, source, target, result);
        this.prefetch();
        this.write(pa.Tsize, mwith, result);
    }

    instructionANDI_TO_CCR(pa) {
        let data = this.allocate_temp_reg();
        let TR = this.allocate_temp_reg();
        this.extension('W', data);
        this.readCCR(TR);
        this.addl (TR + ' &= ' + data + ';');
        this.writeCCR(TR);
        this.idle(8);
        this.readAddr('W', 'regs.PC', null);
        this.prefetch();
    }

    instructionANDI_TO_SR(pa) {
        this.check_supervisor(true);
        let data = this.allocate_temp_reg();
        let TR = this.allocate_temp_reg();
        this.extension('W', data);
        this.readSR(TR);
        this.addl(TR + ' &= ' + data + ';');
        this.writeSR(TR);
        this.idle(8);
        this.readAddr('W', 'regs.PC', null)
        this.prefetch();
    }

    instructionASL(pa, arg1, arg2) {
        let count, mwith, from, result, TR, skip;
        switch(pa.Ttype) {
            case 'IMM':
                count = arg1;
                mwith = arg2;
                this.idle(((pa.Tsize !== 4) ? 2 : 4) + parseInt(count) * 2);
                TR = this.allocate_temp_reg();
                this.read(pa.Tsize, mwith, TR);
                result = this.allocate_temp_reg();
                this.ASL(pa.Tsize, parseInt(count), result);
                this.prefetch();
                this.write(pa.Tsize, result);
                return;
            case 'REG':
                count = this.allocate_temp_reg();
                skip = this.allocate_temp_reg();
                from = arg1;
                mwith = arg2;
                this.read('L', from, count);
                this.addl(count + ' &= ' + 63 + ';');
                let r = (pa.Tsize !== 'L') ? 2 : 4;
                // ARGH!
                this.addl(skip + ' = 130 - (' + r + ' + ' + count + ' * 2);');
                this.addl('regs.TCU += ' + skip + ';');
                this.addcycles(130, false);
                //
                TR = this.allocate_temp_reg();
                this.read(pa.Tsize, mwith, TR);
                this.ASL(pa.Tsize, TR, count, result);
                this.prefetch();
                this.write(pa.Tsize, mwith, result);
                return;
            case 'EA':
                mwith = arg1;
                TR = this.allocate_temp_reg();
                result = this.allocate_temp_reg();
                this.read('W', mwith, TR,true);
                this.ASL('W', 1, result);
                this.prefetch();
                this.write('W', mwith, result);
                return;
        }
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
    let MN = opcode_info.ins_name;

    let parsed = M68K_MN_parse(MN);
    let MN_n = M68K_MN[parsed.outstr];
    if (typeof MN_n !== 'number') console.log('WHAT? OUTRAGEOUS!', MN_n, parsed.outstr);
    switch(parsed.outstr) {
        case 'ABCD':
        case 'ADD':
        case 'AND':
        case 'ADDA':
        case 'ADDQ':
        case 'ADDX':
            ag['instruction' + parsed.outstr](parsed, arg1, arg2);
            break;
        case 'ADDI':
        case 'ANDI':
            ag['instruction' + parsed.outstr](parsed, arg1);
            break;
        case 'ANDI_TO_CCR':
        case 'ANDI_TO_SR':
            ag['instruction' + parsed.outstr](parsed);
            break;
        case undefined:
            console.log('WAIT WHAT?');
            break;
        default:
            console.log('INVESTIGATE1');
            break;
    }

    /*switch(MN_n) {
        case M68K_MN.
    }*/

    //e
    //switch(opcode_info)
    return ag.finished();
}

class M68K_MN_parse_ret {
    constructor() {
        this.Tsize = null;
        this.Ttype = null;
        this.outstr = '';
    }
}
function M68K_MN_parse(MN) {
    let out = new M68K_MN_parse_ret();
    let ostr = MN;
    if (ostr.indexOf('_B') !== -1) {
        out.Tsize = 'B';
        ostr = ostr.replace('_B', '');
    }
    else if (ostr.indexOf('_W') !== -1) {
        out.Tsize = 'W';
        ostr = ostr.replace('_W', '');
    }
    else if (ostr.indexOf('_L') !== -1) {
        out.Tsize = 'L';
        ostr = ostr.replace('_L', '');
    }

    if (ostr.indexOf('_EA_DR') !== -1) {
        out.Ttype = 'EA_DR';
        ostr = ostr.replace('_EA_DR', '');
    }
    else if (ostr.indexOf('_DR_EA') !== -1) {
        out.Ttype = 'DR_EA';
        ostr = ostr.replace('_DR_EA', '');
    }
    else if (ostr.indexOf('_DR_DR') !== -1) {
        out.Ttype = 'DR_DR';
        ostr = ostr.replace('_DR_DR', '');
    }
    else if (ostr.indexOf('_IMM_EA') !== -1) {
        out.Ttype = 'IMM_EA';
        ostr = ostr.replace('_IMM_EA', '');
    }
    else if (ostr.indexOf('_IMM_AR') !== -1) {
        out.Ttype = 'IMM_AR';
        ostr = ostr.replace('_IMM_AR', '');
    }
    else if (ostr.indexOf('_AR_AR') !== -1) {
        out.Ttype = 'AR_AR';
        ostr = ostr.replace('_AR_AR', '');
    }
    else if (ostr.indexOf('_DR_AR') !== -1) {
        out.Ttype = 'DR_AR';
        ostr = ostr.replace('_DR_AR', '');
    }
    else if (ostr.indexOf('_EA') !== -1) {
        out.Ttype = 'EA';
        ostr = ostr.replace('_EA', '');
    }
    else if (ostr.indexOf('_REG') !== -1) {
        out.Ttype = 'REG';
        ostr = ostr.replace('_REG', '');
    }
    else if (ostr.indexOf('_IMM') !== -1) {
        out.Ttype = 'IMM';
        ostr = ostr.replace('_IMM', '');
    }
    else if (ostr.indexOf('_AR') !== -1) {
        out.Ttype = 'AR';
        ostr = ostr.replace('_AR', '');
    }
    out.outstr = ostr;
    return out;
}

function M68K_generate_core() {
    /**
     * @type {Array<M68K_ins>[]}
     */
    let ins_matrix = fill_m68k_opcode_table();
    // Array of objects to call with
    let opt_matrix = new Array(65536);
    let opc_info = ins_matrix[0xC402]; // ABCD 2 2 hopefully
    let func_matrix = {};
    /*for (let i = 0; i < 65536; i++) {
        let r = ins_matrix[i];
        if (typeof r === 'undefined') continue;
        if (r.ins_name === 'ILLEGAL') continue;

        let parsed = M68K_MN_parse(r.ins_name);
        let MN_n = M68K_MN[parsed.outstr];
        //if (parsed.outstr.indexOf('_') !== -1) console.log('NO!', parsed.outstr);
        if (typeof MN_n !== 'number') console.log('WHAT?', MN_n, parsed.outstr);

        //let Tsize=null, Ttype=null;

        //if ((Tsize === null) && (Ttype === null)) console.log(MN)
    }*/
    let a = M68K_generate_instruction_function('', opc_info, opt_matrix);
    console.log(a);
    func_matrix[opc_info.ins_name] = a;

    //console.log(func_matrix, opt_matrix);
}

M68K_generate_core();