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


function ARMgen_load(indent, outstr, output, returnval, modestr, address) {
    outstr += indent + '    regs.addr = ' + address + ';\n';
    outstr += indent + '    regs.mode = ' + modestr + ';\n';
    outstr += indent + '    regs.pipe.nonsequential = true;\n';
    outstr += indent + '    pins.Addr = regs.addr;\n';
    outstr += indent + '    pins.get_hint = regs.mode;\n';
    outstr += indent + '    regs.reenter = ' + returnval + ';\n';
    outstr += indent + '    break;\n';
    outstr += indent + 'case ' + returnval + ':\n';
    outstr += indent + '    regs.reenter = 0;\n';
    outstr += indent + '    regs.word = pins.D;\n';
    outstr += indent + '    if (regs.mode & ARMe.Half) {\n';
    outstr += indent + '        regs.addr &= 1;\n';
    outstr += indent + '        regs.word = (regs.mode & ARMe.Signed) ? mksigned16(word) : mkunsigned16(word);\n';
    outstr += indent + '    }\n';
    outstr += indent + '    if (regs.mode & ARMe.Byte) {\n';
    outstr += indent + '        regs.addr = 0;\n';
    outstr += indent + '        regs.word = (regs.mode & ARMe.Signed) ? mksigned8(word) : mkunsigned8(word);\n';
    outstr += indent + '    }\n';
    outstr += indent + '    if (regs.mode & ARMe.Signed)\n';
    outstr += indent + '        regs.word = ARM_ASR(regs, regs.word, (regs.addr & 3) << 3);\n';
    outstr += indent + '    else\n';
    outstr += indent + '        regs.word = ARM_ROR(regs, regs.word, (regs.addr & 3) << 3);\n';
    outstr += indent + '    ' + output + ' = regs.word;\n';
    return outstr;
}

function ARMgen_armLoadImmediate() {
    let outstr = '';
    outstr  = 'function ARM_armLoadImmediate(regs, pins, immediate, half, d, n, writeback, up, pre) {\n'
    outstr += '    switch(regs.TCU) {\n';
    outstr += '        case 1:\n';
    outstr += '            regs.rn = regs.cur[n];\n';
    outstr += '            regs.rd = regs.cur[d];\n\n';

    outstr += '            if (pre === 1) regs.rn = (up ? (regs.rn + immediate) : (regs.rn - immediate)) & 0xFFFFFFFF;\n';
    outstr = ARMgen_load('        ', outstr, 'regs.rd', 2, '(half ? ARMe.Half : ARMe.Byte) | ARMe.Nonsequential | ARMe.Signed', 'regs.rn');
    outstr += '            if (pre === 0) regs.rn = (up ? (regs.rn + immediate) : (regs.rn - immediate)) & 0xFFFFFFFF;\n';
    outstr += '            if ((pre === 0) || writeback) regs.cur[n] = regs.rn;\n';
    outstr += '            regs.cur[d] = regs.rd;\n';
    outstr += '            break;\n';
    outstr += '    }\n'
    outstr += '}\n'
    console.log(outstr);
}

ARMgen_armLoadImmediate()
