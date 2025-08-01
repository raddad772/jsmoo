"use strict";

const ARM_MN_list = [
    'Branch', 'BranchExchangeRegister', 'DataImmediate', 'DataImmediateShift',
    'DataRegisterShift', 'LoadImmediate', 'LoadRegister', 'MemorySwap',
    'MoveHalfImmediate', 'MoveHalfRegister', 'MoveImmediateOffset', 'MoveMultiple',
    'MoveRegisterOffset', 'MoveToRegisterFromStatus', 'MoveToStatusFromImmediate', 'MoveToStatusFromRegister',
    'Multiply', 'MultiplyLong', 'SoftwareInterrupt', 'Undefined'
]

function ARM_MN_gen() {
    let per_line = 4;
    let mn = 'const ARM_MN = Object.freeze({';
    let mn_r = 'const ARM_MN_R = Object.freeze({';
    let cnt = 0;
    let on_line = 0;
    for (let i in ARM_MN_list) {
        if (on_line === 0) {
            mn += '\n    ';
            mn_r += '\n    ';
        }
        mn += ARM_MN_list[i] + ': ' + cnt + ', ';
        mn_r += cnt + ": '" + ARM_MN_list[i] + "', ";
        on_line++;
        if (on_line > per_line) on_line = 0;
        cnt++;
    }
    return mn + '\n});\n\n' + mn_r + '\n});\n';
}
//console.log(ARM_MN_gen());

class ARM_pins_ot {
    constructor() {
        this.SEQ = 0;
        this.MREQ = 0;
        this.RW = 0;

        this.entry = 1;
    }

    copy_from(where) {
        this.SEQ = where.SEQ;
        this.MREQ = where.MREQ;
        this.RW = where.RW;
        this.entry = where.entry;
    }
}

const ARM_codegen_functions = ['armLoadImmediate', 'armLoadRegister', 'armMemSwap',
    'armBranch', 'armBranchExR', 'armDataProcImmediate', 'armDataProcShift', 'armDataProcReg',
]

class ARM_codegen {
    constructor() {
        this.pins_at_cycle_start = new ARM_pins_ot();
        this.pins_current = new ARM_pins_ot();

        this.reset_pins();

        // So...
        this.num_entries = 1;

        this.outstr = ['', '', '', '', '', '']; // Max 6 reentries
        this.indent = '';
        this.indent2 = '    ';
        this.indent3 = '        ';
        this.fn_sig = 'YOU FORGOT TO SET FN SIG';
    }

    set_fn_sig(what) {
    this.fn_sig = what;
    }

    addl(what, indent=this.indent3) {
        this.outstr[this.num_entries-1] += indent + what + '\n';
    }

    reset_pins() {
        this.pins_at_cycle_start.SEQ = this.pins_at_cycle_start.MREQ = 1;
        this.pins_at_cycle_start.RW = 0;
        this.pins_at_cycle_start.entry = 1;

        this.pins_current.copy_from(this.pins_at_cycle_start);
    }





    // ---------------------------------
    store(modestr, address, data) {
        this.addl('regs.word = ' + data + ';');
        this.addl('regs.mode = ' + modestr + ';');
        this.addl('regs.pipe.nonsequential = true;');
        this.addl('pins.Addr = ' + address + ';');
        this.addl('if (regs.mode & ARMe.Half) { regs.word &= 0xFFFF; regs.word |= (regs.word << 16); }');
        this.addl('if (regs.mode & ARMe.Byte) { regs.word &= 0xFF; regs.word |= (regs.word << 8); regs.word |= (regs.word << 16); }');
        this.addl('pins.Addr = ' + address + ';');
        this.addl('pins.D = ' + data + ';');
        this.addl('pins.get_hint = ARMe.Store | regs.mode;');
        this.addl('regs.reenter = ' + ++this.num_entries + ';');
        this.addl('break;');
        this.outstr[this.num_entries-1] += this.indent2 + 'case ' + this.num_entries + ':\n';
    }

    load(output, modestr, address) {
        this.addl('regs.addr = ' + address + ';');
        this.addl('regs.mode = ' + modestr + ';');
        this.addl('regs.pipe.nonsequential = true;');
        this.addl('pins.Addr = regs.addr;');
        this.addl('pins.get_hint = ARMe.Load | regs.mode;');
        this.addl('regs.reenter = ' + ++this.num_entries + ';');
        this.addl('break;');
        this.outstr[this.num_entries] += this.indent2 + 'case ' + this.num_entries + ':\n';
        this.addl('regs.reenter = 0;');
        this.addl('regs.word = pins.D;');
        this.addl('if (regs.mode & ARMe.Half) {');
        this.addl('    regs.addr &= 1;');
        this.addl('    regs.word = (regs.mode & ARMe.Signed) ? mksigned16(word) : mkunsigned16(word);');
        this.addl('}');
        this.addl('if (regs.mode & ARMe.Byte) {');
        this.addl('regs.addr = 0;');
        this.addl('regs.word = (regs.mode & ARMe.Signed) ? mksigned8(word) : mkunsigned8(word);');
        this.addl('}');
        this.addl('if (regs.mode & ARMe.Signed)');
        this.addl('regs.word = ARM_ASR(regs, regs.word, (regs.addr & 3) << 3);');
        this.addl('else');
        this.addl('regs.word = ARM_ROR(regs, regs.word, (regs.addr & 3) << 3);');
        this.addl('' + output + ' = regs.word;');
    }

    // *****************************
    armLoadImmediate() {
        this.set_fn_sig(function ARM_armLoadImmediate(regs, pins, immediate, half, d, n, writeback, up, pre) {});
        outstr  = '\n'
        this.addl('regs.rn = regs.cur[n];');
        this.addl('regs.rd = regs.cur[d];');

        this.addl('if (pre === 1) regs.rn = (up ? (regs.rn + immediate) : (regs.rn - immediate)) & 0xFFFFFFFF;');
        outstr = ARMgen_load('        ', outstr, 'regs.rd', 2, '(half ? ARMe.Half : ARMe.Byte) | ARMe.Nonsequential | ARMe.Signed', 'regs.rn');
        this.addl('if (pre === 0) regs.rn = (up ? (regs.rn + immediate) : (regs.rn - immediate)) & 0xFFFFFFFF;');
        this.addl('if ((pre === 0) || writeback) regs.cur[n] = regs.rn;');
        this.addl('regs.cur[d] = regs.rd;');
        this.addl('break;');
        this.addl('}\n');
        outstr += '}\n'
    }

}

function ARMgen_armLoadImmediate() {
    outstr  = 'function ARM_armLoadImmediate(regs, pins, immediate, half, d, n, writeback, up, pre) {\n'
    this.addl('regs.rn = regs.cur[n];');
    this.addl('regs.rd = regs.cur[d];');

    this.addl('if (pre === 1) regs.rn = (up ? (regs.rn + immediate) : (regs.rn - immediate)) & 0xFFFFFFFF;');
    outstr = ARMgen_load('        ', outstr, 'regs.rd', 2, '(half ? ARMe.Half : ARMe.Byte) | ARMe.Nonsequential | ARMe.Signed', 'regs.rn');
    this.addl('if (pre === 0) regs.rn = (up ? (regs.rn + immediate) : (regs.rn - immediate)) & 0xFFFFFFFF;');
    this.addl('if ((pre === 0) || writeback) regs.cur[n] = regs.rn;');
    this.addl('regs.cur[d] = regs.rd;');
    this.addl('break;');
    this.addl('}\n')
    outstr += '}\n'
    console.log(outstr);
}

function ARMgen_armLoadRegister() {
    let outstr = '';
    outstr  = 'function ARM_armLoadRegister(regs, pins, m, half, d, n, writeback, up, pre) {\n'
    this.addl('switch(regs.TCU) {\n');
    this.addl('case 1:\n');
    this.addl('regs.rn = regs.cur[n];');
    this.addl('regs.rm = regs.cur[m];');
    this.addl('regs.rd = regs.cur[d];');
    this.addl('if (pre === 1) regs.rn = (up ? (regs.rn + regs.rm) : (regs.rn - regs.rm)) & 0xFFFFFFFF;');
    outstr = ARMgen_load('        ', outstr, 'regs.rd', 2, '(half ? ARMe.Half : ARMe.Byte) | ARMe.Nonsequential | ARMe.Signed', 'regs.rn');
    this.addl('if (pre === 0) regs.rn = (up ? (regs.rn + regs.rm) : (regs.rn - regs.rm)) & 0xFFFFFFFF;');
    this.addl('\n');
    this.addl('if ((pre === 0) || writeback) regs.cur[n] = regs.rn;');
    this.addl('regs.cur[d] = regs.rd;');
    this.addl('break;');
    this.addl('}\n')
    outstr += '}\n'
    console.log(outstr);
}

/*
function ARM_armMemSwap(regs, pins, m ,d, n, byte) {
    regs.word = load((byte ? ARMe.Byte : ARMe.Word) | ARMe.Nonsequential, regs.cur[n]);
    store((byte ? ARMe.Byte : ARMe.Word) | ARMe.Nonsequential, regs.cur[n], regs.cur[m]);
    regs.cur[d] = regs.word;
}

 */
function ARMgen_armMemSwap() {
    let outstr = '';
    outstr  = 'function ARM_armMemSwap(regs, pins, m ,d, n, byte) {\n'
    this.addl('switch(regs.TCU) {\n');
    this.addl('case 1:\n');
    outstr = ARMgen_load('        ', outstr, 'regs.word', 2, '(byte ? ARMe.Half : ARMe.Byte) | ARMe.Nonsequential', 'regs.cur[n]');
    outstr = ARMgen_store('        ', outstr, 3, '(byte ? ARMe.Byte : ARMe.Word) | ARMe.Nonsequential', 'regs.cur[n]', 'regs.cur[m]');
    this.addl('regs.cur[d] = regs.word;');
    this.addl('break;');
    this.addl('}\n')
    outstr += '}\n'
    console.log(outstr);
}

//ARMgen_armMemSwap()
