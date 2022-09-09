"use strict";

class Z80_disassembly_output {
    constructor() {
        this.mnemonic = 'UKN ###';
        this.disassembled = 'UKN ###';
    }
}

/* Z80 instruction decoding courtesy algorithm at
    http://www.z80.info/decoding.htm
 */

const Z80D_tabl_r = ['B', 'C', 'D', 'E', 'H', 'L', '(HL)', 'A'];
const Z80D_tabl_rp = ['BC', 'DE', 'HL', 'SP'];
const Z80D_tabl_rp2 = ['BC', 'DE', 'HL', 'AF'];
const Z80D_tabl_cc = ['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M'];
const Z80D_tabl_alu = ['ADD A, ', 'ADC A, ', 'SUB', 'SBC A, ', 'AND', 'XOR', 'OR', 'CP'];
const Z80D_tabl_rot = ['RLC', 'RRC', 'RL', 'RR', 'SLA', 'SRA', 'SSL', 'SRL'];
const Z80D_tabl_im = ['0', '0/1', '1', '2', '0', '0/1', '1', '2'];
const Z80D_tabl_bli = [[], [], [], [],
    ['LDI', 'CPI', 'INI', 'OUTI'], // 4, 0...3
    ['LDD', 'CPD', 'IND', 'OUTD'], // 5, 0...3
    ['LDIR', 'CPIR', 'INIR', 'OTIR'], // 6, 0...3
    ['LDDR', 'CPDR', 'INDR', 'OTDR'], // 7, 0...3
];

function Z80_disassemble(PC, IR, peek_func) {
    let opcode = IR;
    //let ins = z80_decoded_opcodes[opcode].ins;
    //let mnemonic = z80_decoded_opcodes[opcode].mnemonic;
    let output = new Z80_disassembly_output();
    //output.mnemonic = mnemonic;
    PC = (PC + 1) & 0xFFFF;
    if (IR === Z80_S_DECODE) {
        output.disassembled = 'DECODE';
        return output;
    }
    else if (IR === Z80_S_RESET) {
        output.disassembled = 'RESET';
        return output;
    }
    else if (IR === Z80_S_IRQ) {
        output.disassembled = 'IRQ';
        return output;
    }

    let H, L, HL;
    let repl0 = function(reg) {
        let o = reg;
        if (o === 'HL') o = HL;
        if (o === 'L') o = L;
        if (o === 'H') o = H;
        if (o === '(HL)') o = '(' + HL + ')';
        return o;
    }
    let fetch = function() {
        let r = peek_func(PC, 0, false);
        PC = (PC + 1) & 0xFFFF;
        return r;
    }

    let sread8 = function() {
        let r = mksigned8(peek_func(PC, 0, false));
        PC = (PC + 1) & 0xFFFF;
        return '$' + hex4((PC + r) & 0xFFFF);
    }

    let read8 = function() {
        let r =  '$' + hex2(peek_func(PC, 0, false));
        PC = (PC + 1) & 0xFFFF;
        return r;
    }

    let read16 = function() {
        let r =  '$' + hex4(peek_func(PC, 0, false) + (peek_func((PC+1) & 0xFFFF, 0, false) << 8));
        PC = (PC + 2) & 0xFFFF;
        return r;
    }

    let current_prefix = 0x00;
    let current_byte = opcode;

    let ostr = '';

    let decoded_bytes = 0;
    // So we don't loop forever
    // Decode regular
    while(decoded_bytes < 16) {
        // First decide what to do: update prefix or decode
        if (current_byte === 0xDD) {
            current_prefix = 0xDD;
            decoded_bytes++;
            current_byte = fetch();
            continue;
        }

        if (current_byte === 0xFD) {
            current_prefix = 0xFD;
            decoded_bytes++;
            current_byte = fetch();
            continue;
        }

        if ((current_byte === 0xCB) && (current_prefix === 0)) {
            // prefix = CB for reglar
            current_prefix = 0xCB;
            current_byte = fetch();
            decoded_bytes++;
            continue;
        }
        else if ((current_byte === 0xCB) && ((current_prefix === 0xDD) || (current_prefix === 0xFD))) {
            current_prefix = (current_prefix << 8) | 0xCB;
            current_byte = fetch();
            decoded_bytes++;
            continue;
        }
        else if (current_byte === 0xED) {
            current_prefix = 0xED; // lose IX/IY
            decoded_bytes++;
            current_byte = fetch();
            continue;
        }

        let x = (current_byte & 0xC0) >>> 6;
        let y = (current_byte & 0x38) >>> 3;
        let z = (current_byte & 7);
        let p = (y >>> 1);
        let q = y % 2;
        let d, IXY;
        HL = 'HL';
        L = 'L';
        H = 'H';
        switch(current_prefix) {
            case 0xDD:
            case 0xFD:
            case 0x00:
                if (current_prefix === 0xDD) {
                    //console.log('DOIN IX');
                    HL = 'IX';
                    L = 'IXL';
                    H = 'IXH';
                }
                else if (current_prefix === 0xFD) {
                    //console.log('DOIN IY');
                    HL = 'IY';
                    L = 'IYL';
                    H = 'IYH';
                }
                switch (x) {
                    case 0: // x = 0
                        switch (z) {
                            case 0: // x=0 z=0
                                switch (y) {
                                    case 0:
                                        ostr = 'NOP';
                                        break;
                                    case 1:
                                        ostr = "EX AF, AF'";
                                        break;
                                    case 2:
                                        ostr = 'DJNZ ' + read8();
                                        break;
                                    case 3:
                                        ostr = 'JR ' + sread8();
                                        break;
                                    case 4:
                                    case 5:
                                    case 6:
                                    case 7:
                                        ostr = 'JR ' + Z80D_tabl_cc[y - 4] + ', ' + sread8();
                                        break;
                                }

                                break;
                            case 1: // x = 0, z = 1
                                if (q === 0) ostr = "LD " + repl0(Z80D_tabl_rp[p]) + ', ' + read16();
                                else ostr = "ADD " + repl0('HL') + ", " + Z80D_tabl_rp[p];
                                break;
                            case 2: // x = 0, z = 2
                                switch (p) {
                                    case 0:
                                        if (q === 0) ostr = 'LD (BC), A';
                                        else ostr = 'LD A, (BC)';
                                        break;
                                    case 1:
                                        if (q === 0) ostr = 'LD (DE), A';
                                        else ostr = 'LD A, (DE)';
                                        break;
                                    case 2:
                                        if (q === 0) ostr = 'LD (' + read16() + '), ' + repl0('HL');
                                        else ostr = ostr = 'LD ' + repl0('HL') + ',(' + read16() + ')';
                                        break;
                                    case 3:
                                        if (q === 0) ostr = 'LD (' + read16() + '), A';
                                        else ostr = 'LD A, (' + read16() + ')';
                                        break;
                                }
                                break;
                            case 3: // x = 0, z = 3
                                if (q === 0) ostr = 'INC ' + repl0(Z80D_tabl_rp[p]);
                                else ostr = 'DEC ' + repl0(Z80D_tabl_rp[p]);
                                break;
                            case 4: // x = 0 z = 3
                                ostr = 'INC ' + repl0(Z80D_tabl_r[y]);
                                break;
                            case 5:
                                ostr = 'DEC ' + repl0(Z80D_tabl_r[y]);
                                break;
                            case 6:
                                ostr = 'LD ' + repl0(Z80D_tabl_r[y]) + ', ' + read8();
                                break;
                            case 7:
                                ostr = ['RLCA', 'RRCA', 'RLA', 'RRA', 'DAA', 'CPL', 'SCF', 'CCF'][y];
                                break;
                        }
                        break;
                    case 1: // x = 1
                        if ((z === 6) && (y === 6)) ostr = 'HALT';
                        else ostr = 'LD ' + repl0(Z80D_tabl_r[y]) + ', ' + repl0(Z80D_tabl_r[z]);
                        break;
                    case 2: // x = 2
                        ostr = Z80D_tabl_alu[y] + ' ' + repl0(Z80D_tabl_r[z]);
                        break;
                    case 3: // x = 3
                        switch (z) {
                            case 0: // x=3 z=0
                                ostr = 'RET ' + Z80D_tabl_cc[y];
                                break;
                            case 1: // x=3 z=1
                                if (q === 0)
                                    ostr = 'POP ' + repl0(Z80D_tabl_rp2[p]);
                                else
                                    ostr = ['RET', 'EXX', 'JP HL', 'LD SP, ' + repl0('HL')][p];
                                break;
                            case 2:
                                ostr = 'JP ' + Z80D_tabl_cc[y] + ', ' + read16();
                                break;
                            case 3: // x=3 z=3
                                switch (y) {
                                    case 0:
                                        ostr = 'JP ' + read16();
                                        break;
                                    case 1:
                                        console.log('SHOULDNT BE HERE CB');
                                        break;
                                    case 2:
                                        ostr = 'OUT (' + read8() + '), A';
                                        break;
                                    case 3:
                                        ostr = 'IN (' + read8() + '), A';
                                        break;
                                    case 4:
                                    case 5:
                                    case 6:
                                    case 7:
                                        ostr = ['', '', '', '', 'EX (SP), ' + repl0('HL'), 'EX DE, ' + repl0('HL'), 'DI', 'EI'][y];
                                        break;
                                }
                                break;
                            case 4: // x=3 z=4
                                ostr = 'CALL ' + Z80D_tabl_cc[y] + ', ' + read16();
                                break;
                            case 5: // x=3 z=5
                                if (q === 0) ostr = 'PUSH ' + repl0(Z80D_tabl_rp2[p]);
                                else ostr = 'CALL ' + read16();
                                break;
                            case 6: // x=3 z=6
                                ostr = Z80D_tabl_alu[y] + ' ' + read8();
                                break;
                            case 7: // x=3 z=7
                                ostr = 'RST ' + y * 8;
                                break;
                        }
                }
            break;
        case 0xCB: // prefix 0xCB
            switch(x) {
                case 0:
                    ostr = Z80D_tabl_rot[y] + ' ' + Z80D_tabl_r[z];
                    break;
                case 1:
                    ostr = 'BIT ' + y + ', ' + Z80D_tabl_r[z];
                    break;
                case 2:
                    ostr = 'RES ' + y + ', ' + Z80D_tabl_r[z];
                    break;
                case 3:
                    ostr = 'SET ' + y + ', ' + Z80D_tabl_r[z];
                    break;
            }
            break;
        case 0xED:
            switch(x) {
                case 0:
                case 3:
                    ostr = 'INVALID NONI NOP';
                    break;
                case 1: // 0xED x=1
                    switch(z) {
                        case 0: // 0xED x=1 z=0
                            if (y === 6) ostr = 'IN (C)';
                            else ostr = 'IN ' + Z80D_tabl_r[y] + ', (C)';
                            break;
                        case 1:
                            if (y === 6) ostr = 'OUT (C)';
                            else ostr = 'OUT ' + Z80D_tabl_r[y] + ', (C)';
                            break;
                        case 2: // 0xED x=1 z=2
                            if (q === 0) ostr = 'SBC HL, ' + Z80D_tabl_rp[p];
                            else ostr = 'ADC HL, ' + Z80D_tabl_rp[p];
                            break;
                        case 3: // 0xED x=1 z=3
                            if (q === 0) ostr = 'LD (' + read16() + '), ' + Z80D_tabl_rp[p];
                            else ostr = 'LD ' + Z80D_tabl_rp[p] + ', (' + read16() + ')';
                            break;
                        case 4:
                            ostr = 'NEG';
                            break;
                        case 5:
                            if (y === 1) ostr = 'RETI';
                            else ostr = 'RETN';
                            break;
                        case 6: // 0xED x=1 z=6
                            ostr = 'IM ' + Z80D_tabl_im[y];
                            break;
                        case 7: // 0xED x=1 z=7
                            ostr = ['LD I, A', 'LD R, A', 'LD A, I', 'LD A, R', 'RRD', 'RLD', 'NOP', 'NOP'][y];
                            break;
                    }
                    break;
                case 2: // 0xED x=2
                    if ((z <= 3) && (y >= 4)) {
                        //console.log(typeof z, typeof y, z, y, Z80D_tabl_bli);
                        ostr = Z80D_tabl_bli[y][z];
                    }
                    else
                        ostr = 'INVALID#2 NONI NOP';
                    break;
            }
            break;
        case 0xDDCB:
        case 0xFDCB:
            if (current_prefix === 0xDDCB) IXY = 'IX';
            else IXY = 'IY';
            d = '$' + hex2(current_byte);
            current_byte = fetch();
            decoded_bytes++;
            x = (current_byte & 0xC0) >>> 6;
            y = (current_byte & 0x38) >>> 3;
            z = (current_byte & 7);
            switch(x) {
                case 0: // CBd x=0
                    if (z !== 6) ostr = 'LD ' + Z80D_tabl_r[z] + ', ' + Z80D_tabl_rot[y] + '(' + IXY + '+' + d + ')';
                    else ostr = Z80D_tabl_rot[y] + ' (' + IXY + '+' + d + ')';
                    break;
                case 1: // CBd x=1
                    ostr = 'BIT ' + y + ', (' + IXY + '+' + d + ')';
                    break;
                case 2: // CBd x=2
                    if (z !== 6) ostr = 'LD ' + Z80D_tabl_r[z] + ', RES ' + y + ', (' + IXY + '+' + d + ')';
                    else ostr = 'RES ' + y + ', (' + IXY + '+' + d + ')';
                    break;
                case 3: // CBd x=3
                    if (z !== 6) ostr = 'LD ' + Z80D_tabl_r[z] + ', SET ' + y + ', (' + IXY + '+' + d + ')';
                    else ostr = 'SET ' + y + ', (' + IXY + '+' + d + ')';
                    break;
            }
            break;
        default:
            console.log('HOW DID WE GET HERE GOVNA');
            break;
        }
        if (ostr !== '') break;
        decoded_bytes++;
    }
    output.disassembled = ostr;
    return output;
}


function test_Z80_disassemble() {
    let mem = new Uint8Array(100);
    //let ins = [0x02, 0x05, 0x06, 0xFD, 0x22, 0x05, 0x06, 0];
    //let PCs = [0x00, 0x03];
    // bit 1, b
    //let ins = [0x35, 0xDD, 0x35, 0xCB, 0x48]
    //let PCs = [0x00, 0x01, 0x03]
    //let ins = [0xFD, 0xDD, 0xCB, 0x10, 0xDC, 0xED, 0xB0]
    //let PCs = [0x00, 5];
    let ins = [0xA7, 0xFD, 0xE5];
    let PCs = [0, 1];
    for (let i = 0; i < ins.length; i++) {
        mem[i] = ins[i];
    }

    let readit = function(addr) {
        console.log(addr);
        return mem[addr];
    }

    for (let i = 0; i < PCs.length; i++) {
        let PC = PCs[i];
        let o = Z80_disassemble(PC, ins[PC], readit);
        console.log(hex4(PC), o.disassembled);
    }
}
//test_Z80_disassemble();