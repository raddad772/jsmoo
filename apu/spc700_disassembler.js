"use strict";

class SPC_disassembly_output {
	constructor() {
		this.addr = 0;
        this.mnemonic = 'UKN ###';
		this.disassembled = 'ULN ###';
	}
}

/**
 * @param {spc700} cpu
 */
function spc700_disassemble(cpu) {
    let PC = (cpu.regs.PC - 1) & 0xFFFF;
	let opcode = cpu.regs.IR;
	let opcode_info = SPC_INS[opcode];
	let output = new SPC_disassembly_output();
	output.addr = PC;
	if (typeof opcode_info === 'undefined') {
		return output;
	}
	let addr_mode = opcode_info.addr_mode;
	output.mnemonic = opcode_info.mnemonic;
	output.disassembled = output.mnemonic;

	let read8 = function(addr) {
		return cpu.trace_peek(addr & 0xFFFF);
	}

	let read16 = function(addr) {
		return cpu.trace_peek(addr) + (cpu.trace_peek((addr + 1) & 0xFFFF) << 8);
	}

	PC += 1;
	switch(parseInt(addr_mode)) {
		case SPC_AM.I: // implied
			break;
		case SPC_AM.PC_R:
			output.disassembled += ' ' + mksigned8(cpu.trace_peek(PC));
			break;
		case SPC_AM.IND_XY:
			output.disassembled += ' (X), (Y)';
			break;
		case SPC_AM.RX:
			output.disassembled += ' X';
			break;
		case SPC_AM.RY:
			output.disassembled += ' Y';
			break;
		case SPC_AM.RA:
			output.disassembled += ' A';
			break;
		case SPC_AM.A_IND_X:
			output.disassembled += ' [!$' + hex4(read16(PC)) + '+X]';
			break;
		case SPC_AM.DP_IMM:
			output.disassembled += ' $' + hex2(read8(PC+1)) + ', #$' + hex2(read8(PC));
			break;
		case SPC_AM.X_IMM:
			output.disassembled += ' X, #$' + hex2(read8(PC));
			break;
		case SPC_AM.X_DP:
			output.disassembled += 'X, $' + hex2(read8(PC));
			break;
		case SPC_AM.X_A:
			output.disassembled += 'X, !$' + hex4(read16(PC));
			break;
		case SPC_AM.Y_IMM:
			output.disassembled += ' Y, #$' + hex2(read8(PC));
			break;
		case SPC_AM.Y_DP:
			output.disassembled += ' Y, $' + hex2(read8(PC));
			break;
		case SPC_AM.Y_A:
			output.disassembled += " Y, !$" + hex4(read16(PC));
			break;
		case SPC_AM.DP_DP:
			output.disassembled += ' $' + hex2(read8((PC+1) & 0xFFFF)) + ', $' + hex2(read8(PC));
			break;
		case SPC_AM.MEMBITR:
		case SPC_AM.MEMBITW:
			let r = read16(PC);
			output.disassembled += ' d.' + (r >> 13) +', !$' + hex4(r & 0x1FFF);
			break;
		case SPC_AM.DP:
			output.disassembled += ' $' + hex2(read8(PC));
			break;
		case SPC_AM.DP_INDEXED_X:
			output.disassembled += ' $' + hex2(read8(PC)) + '+X';
			break;
		case SPC_AM.PC_R_BIT: // d.bit, r backwards
			output.disassembled += '.' + (opcode_info.opcode >> 4) + ' !$' + hex2(read8(PC+1)) + ' ' + mksigned8(read8(PC));
			break;
		case SPC_AM.MOV:
			switch(opcode_info.opcode) {
				case 0x5D:
					output.disassembled += ' X, A';
					break;
				case 0x8F:
					output.disassembled += ' $' + hex2(read8(PC+1)) + ', #$' + hex2(read8(PC));
					break;
				case 0xBD:
					output.disassembled += ' SP, X';
					break;
				case 0xC4:
					output.disassembled += ' $' + hex2(read8(PC)) +', A';
					break;
				case 0xC6:
					output.disassembled += ' (X), A';
					break;
				case 0xCB:
					output.disassembled += ' $' + hex2(read8(PC)) + ', Y';
					break;
				case 0xCC:
					output.disassembled += ' !$' + hex4(read16(PC)) + ', Y';
					break;
				case 0xCD:
					output.disassembled += ' X, #$' + hex2(read8(PC));
					break;
				case 0xD7:
					output.disassembled += ' [$' + hex2(read8(PC)) + ']+Y, A';
					break;
				case 0xDB:
					output.disassembled += ' [$' + hex2(read8(PC)) + ']+X, A';
					break;
				case 0xDD:
					output.disassembled += ' A, Y';
					break;
				case 0xE4:
					output.disassembled += ' A, $' + hex2(read8(PC));
					break;
				case 0xE8:
					output.disassembled += ' A, #$' + hex2(read8(PC));
					break;
				case 0xEB:
					output.disassembled += ' Y, $' + hex2(read8(PC));
					break;
				case 0xF4:
					output.disassembled += ' A, $' + hex2(read8(PC)) + '+X';
					break;
				case 0xF5:
					output.disassembled += ' A, !$' + hex4(read16(PC)) + '+X';
					break;
				case 0xF6:
					output.disassembled += ' A, !$' + hex4(read16(PC)) + '+Y';
					break;
				case 0xFB:
					output.disassembled += ' Y, $' + hex2(read8(PC)) + '+X';
					break;
				default:
					output.disassembled += ' UKN ' + hex2(opcode_info.opcode);
					break;
			}
			break;
		case SPC_AM.MOVW:
			switch(opcode_info.opcode) {
				case 0xBA:
					output.disassembled += ' YA, $' + hex2(read8(PC));
					break;
				case 0xDA:
					output.disassembled += ' $' + hex2(read8(PC)) + ', YA';
					break;
			}
			break;
	}
	return output;
}