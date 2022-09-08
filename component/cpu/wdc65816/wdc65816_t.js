"use strict";

/*
 WDC 65816 emulator.
 Runs pretty fast, fast enough for SNES emulation on a low-range PC.
 All non-Emulation mode opcodes have been verified.
  Emulation mode is currently verified as "NOT VERY GOOD", due to memory access wrapping, timings, etc. not being fixed. It will probably mostly work,
 but needs some work.

 TODO:
  * Verify & complete Emulation mode addressing & opcodes

 */


const WDC_BOOTUP = WDC_OM.S_RESET;

const WDC_OP_RESET = 0x100;
const WDC_OP_NMI = 0x103;
const WDC_OP_IRQ = 0x102;
const WDC_OP_ABORT = 0x101;
const WDC_PINS_SEPERATE_PDV = false;


function padl(what, howmuch) {
	while(what.length < howmuch) {
		what = ' ' + what;
	}
	return what;
}
let WDC_TRACE_CYCLES_BREAK = (1364 * 260 * 60 * 10);
let WDC_TRACE_BROKE = true;

// Processor status register
class wdc65816_P {
	constructor() {
		this.C = this.Z = this.I = this.D = this.X = this.M = this.V = this.N = 0;
	}
	
	getbyte_emulated() {
		return this.getbyte_native();
	}

	setbyte_emulated(val) {
		this.C = val & 0x01;
		this.Z = (val & 0x02) >>> 1;
		this.I = (val & 0x04) >>> 2;
		this.D = (val & 0x08) >>> 3;
		this.X = 1;
		this.M = 1;
		this.V = (val & 0x40) >>> 6;
		this.N = (val & 0x80) >>> 7;
	}

	formatbyte_emulated() {
		return this.formatbyte_native();
	}

	formatbyte_native() {
		let outstr = '';
		outstr += this.N ? 'N' : 'n';
		outstr += this.V ? 'V' : 'v';
		outstr += this.M ? 'M' : 'm';
		outstr += this.X ? 'X' : 'x';
		outstr += this.D ? 'D' : 'd';
		outstr += this.I ? 'I' : 'i';
		outstr += this.Z ? 'Z' : 'z';
		outstr += this.C ? 'C' : 'c';
		return outstr;
	}

	getbyte_native() {
		return this.C | (this.Z << 1) | (this.I << 2) | (this.D << 3) | (this.X << 4) | (this.M << 5) | (this.V << 6) | (this.N << 7);
	}
	
	setbyte_native(val) {
		this.C = val & 0x01;
		this.Z = (val & 0x02) >>> 1;
		this.I = (val & 0x04) >>> 2;
		this.D = (val & 0x08) >>> 3;
		this.X = (val & 0x10) >>> 4;
		this.M = (val & 0x20) >>> 5;
		this.V = (val & 0x40) >>> 6;
		this.N = (val & 0x80) >>> 7;
	}
}

// Register file
class wdc65816_registers {
	constructor() {
		// Hidden registers used internally to track state
		this.IR = 0; // Instruction register. Holds opcode.
		this.TCU = 0; // Timing Control Unit, counts up during execution. Set to 0 at instruction fetch, incremented every cycle thereafter
		this.MD = 0; // Memory Data Register, holds last known "good" RAM value from a read. Mostly this is not used correctly inside the emukator
		this.TR = 0; // Temp Register, for operations
		this.TA = 0; // Temporary register, for operations, usually used for addresses
		this.skipped_cycle = false; // For when we...skip a cycle! For timing of jumps and such
		this.STP = false; // Are we in STOP?
		this.WAI = false; // Are we in WAIT?

		// Registers exposed to programs
		this.C = 0; // B (high 8 bits) and A (low 8 bits) = C.
		this.D = 0; // Direct Page register
		this.X = 0; // X index
		this.Y = 0; // Y index
		this.P = new wdc65816_P(); // Processor Status
		this.PBR = 0; // Program Bank Register
		this.PC = 0; // Program Counter
		this.S = 0; // Stack pointer
		this.DBR = 0; // Data Bank Register
		this.E = 0; // Hidden "Emulation" bit


		this.old_I = 0; // old I flag, for use timing IRQs
		this.NMI_pending = false;
		this.IRQ_pending = false;
	}
}

// The pin-interface to the chip.
// Note here that we do NOT follow all the conventions of real pins:
//  1. We do not duplex the bank number and data on different clock phases, we just pretend we have an extra 8 pins
//  2. Logical 1 is ALWAYS "asserted," even though some of the pins use the opposite
//  3. We combine the VPB, VPA, and VDA pins into one, PDV, for R5A22 emulation purposes. This can be changed during the generation of the opcodes.
class wdc65816_pins {
	constructor() {
		this.VPB = 0; // Output. Vector Pull, gets folded into PDV
		this.ABORT = 0; // Input. Abort. Not sure if emulated?
		this.IRQ = 0; // in. IRQ
		this.ML = 0; // out. Not emulated
		this.NMI = 0; // in. NMIs
		this.VPA = 0; // out. Valid Program Address, gets folded into PDV
		this.VDA = 0; // out. Valid Data Address, gets folded into PDV
		this.Addr = 0; // out. Address pins 0-15
		this.BA = 0; // out. Bank Address, 8 bits
		this.D = 0; // in/out Data in/out, 8 bits
		this.RW = 0; // 0 = reading, 1 = writing, *IF* PDV asserted
		this.E = 0; // state of Emulation bit
		this.MX = 0; // M and X flags set. Not emulated
		this.RES = 0; // RESET signal. Not emulated

		this.PDV = 0; // combined program, data, vector pin, to simplify.

		this.NMI = 0;
		this.IRQ = 0;
	}
}


class WDC_disassembly_output {
	constructor(E, M, X) {
		this.data8 = null;
		this.data16 = null;
		this.data24 = null;

		this.E = E;
		this.M = M;
		this.X = X;

		this.mnemonic = 'UKN ###';
		this.disassembled = 'ULN ###';
	}
}

class wdc65816_t {
	constructor(clock) {
		// The "clock" is only used for formatting traces. You can change or remove this behavior.
		this.clock = clock;
		this.regs = new wdc65816_registers();
		this.pins = new wdc65816_pins();
		this.PCO = 0; // Old PC, for instruction fetch
		this.regs.IR = WDC_BOOTUP; // Set instruction register to special "WDC_BOOTUP"

		this.regs.STP = false;
		this.regs.WAI = false;
		this.RES_pending = true;

		this.trace_cycles = 0;
		this.trace_on = false;
		this.trace_peek = function(BA, Addr){return 0xC0;}; // A function to do reads without consequence, for debugging and tracing

		this.NMI_old = 0;
		this.NMI_ack = false;
		this.NMI_count = 0;

		this.IRQ_ack = false;
		this.IRQ_count = 0;
	}
	
	cycle() {
		// Perform 1 processor cycle
		this.trace_cycles++;
		if (this.regs.STP) return;
		if (this.pins.IRQ) {
			this.IRQ_count++;
			if (this.IRQ_count >= 2) {
				this.pins.IRQ = 0; // This is an optimization, not an actual behavior
				this.IRQ_count = 0;
				this.regs.IRQ_pending = true;
				this.IRQ_ack = false;
				//console.log('IRQ pending');
			}
		}
		// NMI fires anytime there's a transition and it is held for two cycles
		if (this.pins.NMI === this.NMI_old)
			this.NMI_count = 0;
		else
			this.NMI_count++;
		if (this.NMI_count > 1) {
			//console.log('NMI pending,', this.pins.NMI, this.NMI_old, this.clock.ppu_y);
			this.NMI_old = this.pins.NMI;
			this.NMI_ack = false;
			this.NMI_count = 0;
			this.regs.NMI_pending = true;
		}

		this.regs.TCU++;
		if (this.regs.TCU === 1) {
			// Do NMI check
			this.PCO = this.pins.Addr; // PCO is PC for tracing purposes
			this.regs.IR = this.pins.D;
			if (this.regs.NMI_pending && !this.NMI_ack) {
				this.NMI_ack = true;
				this.regs.NMI_pending = false;
				this.regs.IR = WDC_OP_NMI;
				//console.log('NMI EXEC!', this.clock.ppu_y);
			}
			// Do IRQ check
			else if (this.regs.IRQ_pending && !this.IRQ_ack && !this.regs.old_I) {
				this.IRQ_ack = true;
				this.regs.IRQ_pending = false;
				this.regs.IR = WDC_OP_IRQ;
				//console.log('IRQ EXEC!')
			}
			this.regs.old_I = this.regs.P.I;
			this.current_instruction = WDC_get_decoded_opcode(this.regs);
			if ((this.regs.IR === 0) || (dbg.brk_on_NMIRQ && (this.regs.IR === WDC_OP_IRQ || this.regs.IR === WDC_OP_NMI))) {
				console.log('BREAK at cycle', this.trace_cycles, ' FOR IR ', hex2(this.regs.IR));
				dbg.break();
			}
			if ((this.trace_cycles > WDC_TRACE_CYCLES_BREAK) && (!WDC_TRACE_BROKE)) {
				console.log('BREAK at cycle', this.trace_cycles, ' FOR TRACE CYCLE COUNT BREAK');
				WDC_TRACE_BROKE = true;
				dbg.break();
			}
			if (this.trace_on) {
				dbg.traces.add(TRACERS.WDC, this.clock.cpu_has, this.trace_format(this.disassemble(), this.PCO));
			}
		}
		this.IRQ_ack = false;
		this.NMI_ack = false;

		this.current_instruction.exec_func(this.regs, this.pins);
	}

	trace_peek8(bank, addr) {
		return this.trace_peek(bank, addr & 0xFFFF);
	}

	trace_peek16(bank, addr) {
		let ret = this.trace_peek(bank, addr & 0xFFFF);
		ret |= this.trace_peek(bank, (addr+1) & 0xFFFF) << 8;
		return ret;
	}

	trace_peek24(bank, addr) {
		let ret = this.trace_peek(bank, addr & 0xFFFF);
		ret |= this.trace_peek(bank, (addr+1) & 0xFFFF) << 8;
		ret |= this.trace_peek(bank, (addr+2) & 0xFFFF) << 16;
		return ret;
	}

	// This must be called while regs.PBR and regs.PC are accurate for the instruction.
	// Turns out disassembly was pretty easy per-opcode...
	disassemble() {
		let PBR = this.pins.BA;
		let PC = this.pins.Addr;
		let opcode = this.regs.IR;
		let opcode_info = WDC_opcode_matrix[opcode];
		let output = new WDC_disassembly_output(this.regs.E, this.regs.P.M, this.regs.P.X);
		output.mnemonic = opcode_info.mnemonic;
		let addr_mode = array_of_array_contains(WDC_opcode_AM_R, opcode);
		PC += 1;
		switch (parseInt(addr_mode)) {
			case WDC_AM.A:
			case WDC_AM.A_INDEXED_IND:
			case WDC_AM.A_IND:
				output.data16 = this.trace_peek16(PBR, PC);
				break;
			case WDC_AM.AL:
			case WDC_AM.AL_INDEXED_X:
				output.data24 = this.trace_peek24(PBR, PC);
				break;
			case WDC_AM.A_INDEXED_X:
			case WDC_AM.A_INDEXED_Y:
				output.data16 = this.trace_peek16(PBR, PC);
				break;
			case WDC_AM.ACCUM:
				break;
			case WDC_AM.XYC:
				output.data16 = this.trace_peek16(PBR, PC);
				break;
			case WDC_AM.D:
			case WDC_AM.D_INDEXED_IND:
			case WDC_AM.D_IND:
			case WDC_AM.D_IND_INDEXED:
			case WDC_AM.D_IND_L_INDEXED:
			case WDC_AM.D_IND_L:
			case WDC_AM.D_INDEXED_X:
			case WDC_AM.D_INDEXED_Y:
				output.data8 = this.trace_peek8(PBR, PC);
				break;
			case WDC_AM.IMMb:
			case WDC_AM.IMM:
				let affected_by_X = WDC_A_OR_M_X.has(opcode_info.ins);
				let affected_by_M = !affected_by_X;
				if (opcode_info.ins === WDC_OM.SEP || opcode_info.ins === WDC_OM.REP) {
					output.data8 = this.trace_peek8(PBR, PC);
				}
				else if ((affected_by_X && !this.regs.P.X) || (affected_by_M && !this.regs.P.M))
					output.data16 = this.trace_peek16(PBR, PC);
				else
					output.data8 = this.trace_peek8(PBR, PC);
				break;
			// argh
			case WDC_AM.I:
				break;
			case WDC_AM.PC_R:
				output.data8 = this.trace_peek8(PBR, PC);
				break;
			case WDC_AM.PC_RL:
				output.data16 = this.trace_peek16(PBR, PC);
				break;
			case WDC_AM.STACK:
				break;
			case WDC_AM.STACKd:
			case WDC_AM.STACKf:
				output.data16 = this.trace_peek16(PBR, PC);
				break;
			case WDC_AM.STACKe:
			case WDC_AM.STACKj:
				output.data8 = this.trace_peek8(PBR, PC);
				break;
			case WDC_AM.STACK_R:
			case WDC_AM.STACK_R_IND_INDEXED:
				output.data8 = this.trace_peek8(PBR, PC);
				break;
		}
		PC -= 1;
		let dis_out = 'UKN ###';

		// Now make actual disassembly output
		dis_out = WDC_OP_MN_str[opcode_info.ins];
		switch(parseInt(addr_mode)) {
			case WDC_AM.A:
				dis_out += ' !$' + hex4(output.data16);
				break;
			case WDC_AM.A_INDEXED_IND:
				dis_out += ' (!$' + hex4(output.data16) + ', x)';
				break;
			case WDC_AM.A_IND:
				dis_out += ' (!$' + hex4(output.data16) + ')';
				break;
			case WDC_AM.AL:
				if (opcode_info.ins === WDC_OM.JSL) {
					dis_out += ' >$' + hex6(output.data24);
				}
				else {
					dis_out += ' (>$' + hex6(output.data24) + ')';
				}
				break;
			case WDC_AM.AL_INDEXED_X:
				dis_out += ' >$' + hex6(output.data24) + ', x';
				break;
			case WDC_AM.A_INDEXED_X:
				dis_out += ' !$' + hex4(output.data16) + ', x';
				break;
			case WDC_AM.A_INDEXED_Y:
				dis_out += ' !$' + hex4(output.data16) + ', y';
				break;
			case WDC_AM.XYC:
				dis_out += ' $' + hex2(output.data16 >> 8) + ', $' + hex2(output.data16 & 0xFF);
				break;
			case WDC_AM.ACCUM:
				dis_out += ' A';
				break;
			case WDC_AM.D:
				dis_out += ' <$' + hex2(output.data8);
				break;
			case WDC_AM.D_INDEXED_IND:
				dis_out += ' (<$' + hex2(output.data8) + ', x)';
				break;
			case WDC_AM.D_IND:
				dis_out += ' (<$' + hex2(output.data8) + ')';
				break;
			case WDC_AM.D_IND_INDEXED:
				dis_out += ' (<$' + hex2(output.data8) + '), y';
				break;
			case WDC_AM.D_IND_L_INDEXED:
				dis_out += ' [<$' + hex2(output.data8) + '], y';
				break;
			case WDC_AM.D_IND_L:
				dis_out += ' [<$' + hex2(output.data8) + ']';
				break;
			case WDC_AM.D_INDEXED_X:
				dis_out += ' <$' + hex2(output.data8) + ', x';
				break;
			case WDC_AM.D_INDEXED_Y:
				dis_out += ' <$' + hex2(output.data8) + ', y';
				break;
			case WDC_AM.IMMb:
			case WDC_AM.IMM:
				if (output.data8 !== null) dis_out += ' #$' + hex2(output.data8);
				if (output.data16 !== null) dis_out += ' #$' + hex4(output.data16);
				break;
			case WDC_AM.Ib:
			case WDC_AM.Ic:
			case WDC_AM.Id:
			case WDC_AM.Ie:
			case WDC_AM.I:
				break;
			case WDC_AM.PC_R:
				dis_out += ' r' + mksigned8(output.data8);
				break;
			case WDC_AM.PC_RL:
				dis_out += ' r' + mksigned16(output.data16);
				break;
			case WDC_AM.STACKd:
			case WDC_AM.STACKf:
				dis_out += ' $' + hex4(output.data16);
				break;
			case WDC_AM.STACKe:
			case WDC_AM.STACKj:
				dis_out += ' $' + hex2(output.data8);
				break;
			case WDC_AM.STACK_R:
				dis_out += ' $' + hex2(output.data8) + ', s';
				break;
			case WDC_AM.STACK_R_IND_INDEXED:
				dis_out += ' ($' + hex2(output.data8) + ',s),y';
				break;
		}
		output.disassembled = dis_out;
		return output;
	}

	enable_tracing(peek_func) {
		this.trace_peek = peek_func;
		this.trace_cycles = 0;
		this.trace_on = true;
	}

	disable_tracing() {
		this.trace_peek = function(BA, Addr){return 0xC0;}
		this.trace_on = false;
	}

	trace_format(da_out, PCO) {
		let outstr = trace_start_format('WDC', WDC_COLOR, this.clock.cpu_has, ' ', PCO, this.regs.PBR);
		// General trace format is...
		// (cycles) PC: LDA d,x   (any byte operands)   E: C: X: Y: S: MX: P: D: DBR:
		outstr += da_out.disassembled;
		let sp = da_out.disassembled.length;
		while(sp < TRACE_INS_PADDING) {
			outstr += ' ';
			sp++;
		}

		/*if (da_out.data8 !== null) outstr += hex0x2(da_out.data8) + '      ';
		else if (da_out.data16 !== null) outstr += hex2((da_out.data16 & 0xFF00) >>> 8) + ' ' + hex2(da_out & 0xFF) + '   ';
		else if (da_out.data24 !== null) outstr += hex2((da_out.data24 & 0xFF0000) >>> 16) + ' ' + hex2((da_out.data24 & 0xFF00) >>> 8) + ' ' + hex2((da_out.data24 & 0xFF) >>> 8);*/

		outstr += 'PC:' + hex2(this.regs.PBR) + hex4(this.regs.PC) + ' ';
		outstr += 'E:' + this.regs.E + ' C:' + hex4(this.regs.C);
		outstr += ' X:' + hex4(this.regs.X) + ' Y:' + hex4(this.regs.Y);
		outstr += ' S:' + hex4(this.regs.S);
		outstr += ' P:';
		if (this.regs.E) outstr += this.regs.P.formatbyte_emulated();
		else             outstr += this.regs.P.formatbyte_native();
		outstr += ' D:' + hex0x4(this.regs.D) + ' DBR:' + hex0x2(this.regs.DBR);
		return outstr;
	}

	reset() {
		// TODO: kinda fix this
		console.log("RESET!");
		this.pins.RES = 0;
		this.RES_pending = false;
		this.regs.TCU = 0;
		if (this.regs.STP) {
			console.log('RST clearing STP');
			this.regs.STP = false;
		}
		else {
			console.log('SETTING RESET');
			this.pins.D = WDC_OP_RESET;
		}
	}
}

const WDC_EMX_table = Object.freeze({
    0: 0, // E0 M0 X0
    1: 1, // E1 M0 X0
    2: 2, // E0 M1 X0
    3: 3, // E1 M1 X0
    4: 4, // E0 M0 X1
    5: 5, // E1 M0 X1
    6: 6, // E0 M1 X1
    7: 7  // E1 M1 X1
});

function WDC_get_decoded_opcode(regs) {
    let ret;
    if (regs.E) {
        ret = wdc65816_decoded_opcodes[WDC_EMX_table[7]][regs.IR];
    }
    else {
        let flag = WDC_EMX_table[regs.P.M*2 + regs.P.X*4];
        ret = wdc65816_decoded_opcodes[flag][regs.IR];
    }
    if ((ret === null) || (typeof(ret) === 'undefined')) {
        ret = wdc65816_decoded_opcodes[WDC_EMX_table[0]][regs.IR];
    }
    return ret;
}
