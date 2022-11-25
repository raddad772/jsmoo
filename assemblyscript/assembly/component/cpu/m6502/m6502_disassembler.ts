import {M6502_AM, M6502_opcode_functions} from "./m6502_opcodes";
import {hex2, hex4, mksigned8} from "../../../helpers/helpers";
import {m6502} from "./m6502";

export class M6502_disassembly_output {
    data8: u32|null=null;
    mnemonic: string = 'UKN ###'
    disassembled: string = 'UKN ###'
}

export function M6502_disassemble(PC: u32, cpu: m6502): M6502_disassembly_output {
    let opcode: u32 = cpu.trace_peek(PC);
    PC = (PC + 1) & 0xFFFF;
    let opcode_info: M6502_opcode_functions = cpu.opcode_set[opcode];
    let output = new M6502_disassembly_output();
    output.mnemonic = opcode_info.mnemonic;
    let addr_mode: M6502_AM = opcode_info.addr_mode;

    let read8 = function () {
        return '$' + hex2(cpu.trace_peek(PC));
    }

    let read16 = function () {
        return '$' + hex4(cpu.trace_peek(PC) + (cpu.trace_peek(PC + 1) << 8));
    }

    let outstr: string = '';
    //let outstr = output.mnemonic.slice(0,3);
    if (output.mnemonic.indexOf(' ') === -1) {
        outstr = output.mnemonic;
    } else {
        outstr = output.mnemonic.slice(0, output.mnemonic.indexOf(' '));
    }
    switch (addr_mode) {
        case M6502_AM.IMPLIED:
        case M6502_AM.NONE:
            break;
        case M6502_AM.ACCUM:
            outstr += ' A';
            break;
        case M6502_AM.ZP_INDw:
        case M6502_AM.ZP_INDr:
            outstr += ' (' + read8() + ')'
            break;
        case M6502_AM.IMM:
            outstr += ' #' + read8();
            break;
        case M6502_AM.IND:
            outstr += ' (' + read8() + ')';
            break;
        case M6502_AM.ABS_IND_Xr:
            outstr += ' (' + read16() + ',x)';
            break;
        case M6502_AM.IND_Yr:
        case M6502_AM.IND_Yw:
        case M6502_AM.IND_Ym:
            outstr += ' (' + read8() + '),y';
            break;
        case M6502_AM.X_INDw:
        case M6502_AM.X_INDm:
        case M6502_AM.X_INDr:
            outstr += ' (' + read8() + ',x)';
            break;
        case M6502_AM.ABSw:
        case M6502_AM.ABSr:
        case M6502_AM.ABSm:
        case M6502_AM.ABSjsr:
        case M6502_AM.ABSjmp:
            outstr += ' ' + read16();
            break;
        case M6502_AM.ABS_Xw:
        case M6502_AM.ABS_Xm:
        case M6502_AM.ABS_Xr:
            outstr += ' ' + read16() + ',x';
            break;
        case M6502_AM.ABS_Yw:
        case M6502_AM.ABS_Ym:
        case M6502_AM.ABS_Yr:
            outstr += ' ' + read16() + ',y';
            break;
        case M6502_AM.ZPw:
        case M6502_AM.ZPm:
        case M6502_AM.ZPr:
            outstr += ' ' + read8();
            break;
        case M6502_AM.ZP_Xw:
        case M6502_AM.ZP_Xm:
        case M6502_AM.ZP_Xr:
            outstr += ' ' + read8() + ',x';
            break;
        case M6502_AM.ZP_Yw:
        case M6502_AM.ZP_Ym:
        case M6502_AM.ZP_Yr:
            outstr += ' ' + read8() + ',y';
            break;
        case M6502_AM.PC_REL:
            outstr += ' $' + hex4((mksigned8(cpu.trace_peek(PC)) + PC + 1) & 0xFFFF);
            break;
        case M6502_AM.INDjmp:
            outstr += ' (' + read16() + ')';
            break;
        case M6502_AM.PC_REL_ZP:
            outstr += ' ' + read8() + ', $' + hex4(mksigned8(cpu.trace_peek(PC + 1)) + PC + 2)
            break;
        default:
            console.log('UNKNOWN AM ' + addr_mode.toString());
            break;
    }
    output.disassembled = outstr;
    return output;
}

export function M6502_disassemble_context(cpu: m6502): string {
    let outstr: string = '';
    outstr += 'PC:' + hex4(cpu.regs.PC) + ' ';
    outstr += ' A:' + hex2(cpu.regs.A);
    outstr += ' X:' + hex2(cpu.regs.X) + ' Y:' + hex2(cpu.regs.Y);
    outstr += ' S:' + hex2(cpu.regs.S);
    outstr += ' P:' + cpu.regs.P.formatbyte();
    return outstr;
}