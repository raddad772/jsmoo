"use strict";

/* We're not doing every pin individually. That's an unneccessary pain.
   We will group them where we can, and leave out ones like clock.
  
   VPB goes low to indicage hardware vector addresses being accessed during an interrupt request. Also BRK and COPm during cycles 7 and 8 of interrupt acknowledgement sequence
   RDY out. As output, pulled low after WAI is executed, signaling that it is WAiting for an interrupt. Pulled high when external RES, ABORT, NMI, or IRQ happens.
   RDYf in. Input version of RDY. If forced low externally, processor will halt. If forced high externally, processor will NOT stop after WAI.
   ABORT in. Assert low, current instruction will discard its value, and an ABORT interrupt will happen.
   IRQ in. Assert low will start interrupt sequence if Disable Interrupt flag is Clear.
   ML out. pulls low during read-modify-write instructions, basically saying bus isn't in use.
   NMI in. high-to-low - not just low - starts NMI interrupt.
   VPA - out. Valid Program Address. Used with VDA in Table 1
   VDD - in. IF set to 0, processor will not function and will lose all state.
   A: out. 16-bit address, or 0xFFFF if BE is high.
   VSS: out. ground. NOT EMULATED
   DBA: bidirectional. Data pins D0-D7 or bank BA0-BA7. On a real WD65C816, these would change twice per cycle to indicate upper bits of 24-bit address and then communicate the contents of that, either as a write or a read. Here we dispense with that, and provide D and BA seperately. BA is set to 0 in emulation mode. Or set to 0xFF if BE is asserted.
   RWB: out. when high, processor is reading. When low, writing. Easy! This remains high during reset.
   E: out. "Emulation," Reflects state of E bit.
   BE: in. when low, Address and Data will not be exported, instead will be set to all 1's.
   MX: out. high if M and X flags are set.
   VDA: See VPA
   RESB: Set low for 2 clock cycles, will reset the processor
   
  
  VDA VPA 
   0   0   Internal operation, address is garbage
   0   1   Program address
   1   0   Valid data address
   1   1   Opcode fetch
   
   Interrupt sequence
   Emulation mode
   PCH, PCL, P
   Native mode
   PBR, PCH, PCL, P
   */ 

const EMU_IRQ = 0xFFFE
const NAT_IRQ = 0xFFEE
const EMU_NMI = 0xFFFA
const NAT_NMI = 0xFFEA
const EMUNAT_RES = 0xFFFC
const EMU_ABORT = 0xFFF8
const NAT_ABORT = 0xFFE8
const EMU_COP = 0xFFF4
const NAT_COP = 0xFFE4
const NAT_BRK = 0xFFE6
   
const BOOTUP = WDC_OM.S_RESET;

let VEC_RST_LO = 0x00FFFC;
let VEC_RST_HI = 0x00FFFD;

const OP_RESET = 0x100;
const OP_NMI = 0x103;
const OP_IRQ = 0x102;
const OP_ABORT = 0x101;
const PINS_SEPERATE_PDV = false;

function padl(what, howmuch) {
	while(what.length < howmuch) {
		what = ' ' + what;
	}
	return what;
}
let TRACE_CYCLES_BREAK = 131000;
let TRACE_BROKE = false

class w65c816_P {
	constructor(pins) {
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

class w65c816_registers {
	constructor() {
		// Hidden registers used internally to track state
		this.IR = 0; // Instruction register. Holds opcode.
		this.TCU = 0; // Timing Control Unit, counts up during execution. Set to 0 at instruction fetch, incremented every cycle thereafter
		this.MD = 0; // Memory Data Register, holds last known "good" RAM value from a read
		this.TR = 0; // Temp Register, for operations
		this.TA = 0; // Temporary Address register
		this.skipped_cycle = false; // For when we...skip a cycle! For certain ops
		this.STP = false; // Are we in STOP?
		this.WAI = false; // Are we in WAIT?

		// Registers exposed to programs
		this.C = 0; // B...A = C.
		this.D = 0; // Direct Page
		this.X = 0; // X index
		this.Y = 0; // Y index
		this.P = new w65c816_P(); // Processor Status
		this.PBR = 0; // Program Bank Register
		this.PC = 0; // Program Counter
		this.S = 0; // Stack pointer
		this.DBR = 0; // Data Bank Register
		this.E = 0; // Hidden "Emulation" bit


		this.old_I = 0; // old I flag, for use with certain instructions.
		this.NMI_pending = false;
		this.IRQ_pending = false;
	}
}

// We're going to use 1 as asserted just because
class w65c816_pins {
	constructor() {
		this.VPB = 0; // Output. Vector Pull
		this.ABORT = 0; // Input. Abort
		this.IRQ = 0; // in. IRQ
		this.ML = 0; // out
		this.NMI = 0; // in
		this.VPA = 0; // out. Valid Program Address
		this.VDA = 0; // out. Valid Data Address
		this.Addr = 0; // out. Address pins 0-15
		this.BA = 0; // out. Bank Address, upper 8 bits
		this.D = 0; // in/out Data in/out
		this.RW = 0; // 0 = reading, 1 = writing
		this.E = 0; // state of Emulation bit
		this.MX = 0; // M and X flags set
		this.RES = 0; // RESET signal

		this.PDV = 0; // combined program, data, vector pin, to simplify.

		this.NMI = 0;
		this.IRQ = 0;
	}
}


class disassembly_output {
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

// Interrupt sequence
// 2 cycles "internal", setting flags?
// 1 cycle if native, write PB to stack
// 1 cycle write PCH to stack
// 1 cycle write PCL to stack
// 1 cycle write P to stack
// 1 cycle read vector low
// 1 cycle read vector high

class w65c816 {
	constructor(clock) {
		this.clock = clock;
		this.regs = new w65c816_registers();
		this.pins = new w65c816_pins();
		this.PCO = 0; // Old PC, for instruction fetch
		this.regs.IR = BOOTUP;

		this.regs.STP = false;
		this.regs.WAI = false;
		this.RES_pending = true;

		this.trace_cycles = 0;
		this.trace_on = false;
		this.trace_peek = function(BA, Addr){return 0xC0;};


		this.NMI_old = 0;
		this.NMI_ack = false;
		this.NMI_count = 0;

		this.IRQ_ack = false;
		this.IRQ_count = 0;
	}
	
	cycle() {
		this.trace_cycles++;
		if (this.regs.STP) return;
		if (this.pins.IRQ) {
			this.IRQ_count++;
			if (this.IRQ_count >= 2) {
				this.pins.IRQ = 0; // This is an optimization, not an actual behavior
				this.IRQ_count = 0;
				this.regs.IRQ_pending = true;
				this.IRQ_ack = false;
			}
		}
		// NMI fires
		//  anytime there's a transition and it is held for two cycles
		if (this.pins.NMI === this.NMI_old)
			this.NMI_count = 0;
		else
			this.NMI_count++;
		if (this.NMI_count > 1) {
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
				this.regs.IR = OP_NMI;
			}
			// Do IRQ check
			else if (this.regs.IRQ_pending && !this.IRQ_ack && !this.regs.old_I) {
				this.IRQ_ack = true;
				this.regs.IRQ_pending = false;
				this.regs.IR = OP_IRQ;
			}
			this.regs.old_I = this.regs.P.I;
			this.PCO = this.pins.Addr; // PCO is PC for tracing purposes
			this.current_instruction = get_decoded_opcode(this.regs);
			if (this.regs.IR === 0) {// || this.regs.IR === OP_IRQ || this.regs.IR === OP_NMI || this.regs.IR === 0x40) {
				console.log('BREAK at cycle', this.trace_cycles, ' FOR IR ', hex2(this.regs.IR));
				dbg.break();
			}
			if ((this.trace_cycles > TRACE_CYCLES_BREAK) && (!TRACE_BROKE)) {
				TRACE_BROKE = true;
				dbg.break();
			}
			if (this.trace_on) {
				dbg.traces.add(TRACERS.WDC, this.clock.cpu_has, this.trace_format(this.disassemble(), this.PCO));
			}
		}
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
		let opcode_info = opcode_matrix[opcode];
		let output = new disassembly_output(this.regs.E, this.regs.P.M, this.regs.P.X);
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
		let outstr = trace_start_format('WDC', WDC_COLOR, this.trace_cycles, ' ', PCO, this.regs.PBR);
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
		// Do more
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
			this.pins.D = OP_RESET;
		}
	}
}