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
   
const BOOTUP = 256;

let VEC_RST_LO = 0x00FFFC;
let VEC_RST_HI = 0x00FFFD;


class w65c816_P {
	constructor(pins) {
		this.C = this.Z = this.I = this.D = this.X = this.M = this.V = this.N = 0;
	}
	
	getbyte() {
		return this.C | (this.Z << 1) | (this.I << 2) | (this.D << 3) | (this.X << 4) | (this.M << 5) | (this.V << 6) | (this.N << 7);
	}
	
	setbyte(val) {
		this.C = val & 0x01;
		this.Z = (val & 0x02) >> 1;
		this.I = (val & 0x04) >> 2;
		this.D = (val & 0x08) >> 3;
		this.X = (val & 0x10) >> 4;
		this.M = (val & 0x20) >> 5;
		this.V = (val & 0x40) >> 6;
		this.N = (val & 0x80) >> 7;
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
		this.skipped_cycle = false;
		this.in_blockmove = false;

		// Registers exposed to programs
		this.C = 0; // B...A = C.
		this.D = 0; // Direct
		this.X = 0; // Y index
		this.Y = 0; // X index
		this.P = new w65c816_P(); // Processor Status
		this.PBR = 0; // Program Bank Register
		this.PC = 0; // Program Counter
		this.S = 0; // Stack pointer
		this.DBR = 0; // Data Bank Register
		this.E = 0; // Hidden "Emulation" bit
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

class OPERAND_t {
	constructor() {
		this.NONE = 0;
		this.CH = 1;
		this.CL = 2;
		this.C = 3;
		this.X = 4;
		this.XH = 5;
		this.XL = 6;
		this.Y = 7;
		this.YH = 8;
		this.YL = 9;
		this.P = 10;
		this.PBR = 11;
		this.DBR = 12;
		this.PC = 13;
		this.PCH = 14;
		this.PCL = 15;
		this.S = 16;
		this.SH = 17;
		this.SL = 18;
		this.D = 19;
		this.DH = 20;
		this.DL = 21;
		this.MD = 22;
		this.MDH = 23;
		this.MDL = 24;
		this.IR = 25;
	}
}



const OPERANDS = Object.freeze(new OPERAND_t());

class micro_code {
	constructor({name, action=function(){}, operand=-1, addr=-1, VPA=-1, VDA=-1, VPB=-1, RW=-1}) {
		this.name = name;
		this.do_pins = false;
		this.VPA = VPA;
		this.VDA = VDA;
		this.VPB = VPB;
		this.RW = RW;
		
		if (VPA > -1 || VDA > -1 || VPB > -1 || RW > -1) {this.do_pins = true; }
		this.action = action;
		this.operand = operand;
		this.addr = addr;
		
		this.num_cycles_to_execute = 1;
		this.num_cycles_executed = 0;
	}
	
	execute(cpu) {
		if (this.do_pins) {
			cpu.pins.VPA = this.VPA > -1 ? this.VPA : cpu.pins.VPA;
			cpu.pins.VDA = this.VDA > -1 ? this.VDA : cpu.pins.VDA;
			cpu.pins.VPB = this.VPB > -1 ? this.VPB : cpu.pins.VPB;
			cpu.pins.RW = this.RW > -1 ? this.RW : cpu.pins.RW;
		}
		let r = this.action(cpu, this.operand, this.addr);
	}
}

function MKCODE({name='UNNAMED', action=function(cpu, operand, addr){}, internal=false, operand=OPERANDS.NONE, addr=0x0000, VPA=-1, VDA=-1, VPB=-1, RW=-1}) {
	let nVPA = -1;
	let nVDA = -1;
	let nVPB = -1;
	let nRW = -1;
	if (action.has_pins) {
		nVPA = action.VPA;
		nVDA = action.VDA;
		nVPB = action.VPB;
		nRW = action.RW;
	}
	// If these are passed in, they override the action default
	if (VPA > -1) nVPA = VPA;
	if (VDA > -1) nVDA = VDA;
	if (VPB > -1) nVPB = VPB;
	if (RW > -1) nRW = RW;
	let code = new micro_code({name:name, action:action, internal:internal, operand:operand, addr:addr, VPA:nVPA, VDA:nVDA, VPB:nVPB, RW:nRW});
	return code;
}

function set_pins(func, VPA, VPD, VPB, RW) {
	func.has_pins = true;
	func.VPA = VPA;
	func.VPD = VPD;
	func.VPB = VPB;
	func.RW = RW;
}

function NOP(cpu) {
};
set_pins(NOP, 0, 0, 0, 0);

// Set Address pins to Stack
function M_SET_Addr_TO_S(cpu) {
	cpu.pins.BA = 0;
	if (cpu.reg.E) {
		cpu.pins.Addr = (cpu.reg.S & 0xFF) | 0x100;
	}
	else {
		cpu.pins.Addr = cpu.reg.S & 0xFFFF;
	}	
}

// Set CPU flags, pins during reset
function M_RST_FLAGS(cpu) {
	M_SET_E(cpu, 1);
	cpu.pins.RW = 1;
	cpu.pins.VDA = 0;
	cpu.pins.VPA = 0;
	cpu.pins.VPB = 0;
	console.log('Remember to finish flags set for reset here bro')
	cpu.reg.D = 0;	
	cpu.reg.DBR = 0;
	cpu.reg.PBR = 0;
	cpu.reg.S &= 0x1FF;
	cpu.reg.X &= 0xFF;
	cpu.reg.Y &= 0xFF;
	cpu.reg.P.D = 0;
	cpu.reg.P.C = 1;
	cpu.reg.P.I = 1;
	cpu.reg.P.M = 1;
	cpu.reg.P.X = 1;
}

// Set address lines
function M_SET_Addr(cpu, addr, ba) {
	if (typeof(ba) === 'undefined') {
		ba = 0;
	}
 	if (cpu.reg.E) {
		cpu.pins.BA = 0;
	}
	else {
		cpu.pins.BA = ba && 0xFF;
	}
	cpu.pins.Addr = addr & 0xFFFF;
}

// Change emulation mode
function M_SET_E(cpu, val) {
	let old_E = cpu.reg.E;
	cpu.pins.E = val;
	cpu.reg.E = val;
	if (old_E !== cpu.reg.E) {
		if (old_E == 1) {
			// Disable Emulation mode
		}
		else {
			// Enable Emulation mode
		}
	}
}

// Decrement Stack pointer
function M_DEC_S(cpu) {
	cpu.reg.S -= 1;
	if (cpu.reg.S < 0) {
		if (cpu.reg.E)
			cpu.reg.S = 0xFF;
		else
			cpu.reg.S = 0xFFFF;
	}
}

function M_INC_PC(cpu) {
	cpu.reg.PC = (cpu.reg.PC + 1) & 0xFFFF;
}

function M_SET_OPERAND(cpu, operand, value) {
	switch(operand) {
		case OPERANDS.NONE:
			break;
		case OPERANDS.CL:
			cpu.reg.C = cpu.reg.C & 0xFF00 | (value & 0xFF);
			break;
		case OPERANDS.CH:
			cpu.reg.C = cpu.reg.C & 0x00FF | ((value & 0xFF) << 8);
			break;
		case OPERANDS.C:
			cpu.reg.C = value & 0xFFFF;
			break;
		case OPERANDS.X:
			cpu.reg.X = value & 0xFFFF;
			break;
		case OPERANDS.XL:
			cpu.reg.X = (cpu.reg.X & 0xFF00) | (value & 0xFF);
			break;
		case OPERANDS.XH:
			cpu.reg.X = (cpu.reg.X & 0xFF) | ((value & 0xFF) << 8);
			break;
		case OPERANDS.Y:
			cpu.reg.Y = value & 0xFFFF;
			break;
		case OPERANDS.YL:
			cpu.reg.Y = (cpu.reg.Y & 0xFF00) | (value & 0xFF);
			break;
		case OPERANDS.YH:
			cpu.reg.Y = (cpu.reg.Y & 0xFF) | ((value & 0xFF) << 8);
			break;
		case OPERANDS.P:
			cpu.reg.P.setbyte(value);
			break;
		case OPERANDS.PBR:
			cpu.reg.PBR = value & 0xFFFF;
			break;
		case OPERANDS.DBR:
			cpu.reg.DBR = value & 0xFFFF;
			break;
		case OPERANDS.PC:
			cpu.reg.PC = value & 0xFFFF;
			break;
		case OPERANDS.PCH:
			cpu.reg.PC = (cpu.reg.PC & 0xFF) | ((value & 0xFF) << 8);
			break;	
		case OPERANDS.PCL:
			cpu.reg.PC = (cpu.reg.PC & 0xFF00) | (value & 0xFF);
			break;
		case OPERANDS.S:
			cpu.reg.S = value & 0xFFFF;
			break;
		case OPERANDS.SH:
			cpu.reg.S = (cpu.reg.S & 0xFF) | ((value & 0xFF) << 8);
			break;
		case OPERANDS.SL:
			cpu.reg.S = (cpu.reg.S & 0xFF00) | (value & 0xFF);
			break;
		case OPERANDS.D:
			cpu.reg.D = value & 0xFFFF;
			break;
		case OPERANDS.DH:
			cpu.reg.D = (cpu.reg.D & 0xFF) | ((value & 0xFF) << 8);
			break;
		case OPERANDS.DL:
			cpu.reg.D = (cpu.reg.D & 0xFF00) | (value & 0xFF);
			break;
		case OPERANDS.MD:
			cpu.reg.MD = value;
			break;
		case OPERANDS.MDL:
			cpu.reg.MD = (cpu.reg.MD & 0xFF00) | (value & 0xFF);
			break;
		case OPERANDS.MDH:
			cpu.reg.MD = (cpu.reg.MD & 0x00FF) | ((value & 0xFF) << 8);
			break;
		case OPERANDS.IR:
			cpu.reg.IR = value;
			break;
		}
}

// C_ are microcode routines, like push a byte to stack
function C_PUSH_PBR(cpu) {
	M_SET_Addr_TO_S(cpu);
	cpu.pins.D = cpu.regs.PBR;
	M_DEC_S(cpu);
}
set_pins(C_PUSH_PBR, 0, 1, 0, 1);

function C_PUSH_PCH(cpu) {
	M_SET_Addr_TO_S(cpu);
	cpu.pins.D = (cpu.regs.PC >> 8) & 0xFF;
	M_DEC_S(cpu);
}
set_pins(C_PUSH_PCH, 0, 1, 0, 1);

function C_PUSH_PCL(cpu) {
	M_SET_Addr_TO_S(cpu);
	cpu.pins.D = cpu.regs.PC & 0xFF;
	M_DEC_S(cpu);
}
set_pins(C_PUSH_PCL, 0, 1, 0, 1);

function C_PUSH_P(cpu) {
	M_SET_Addr_TO_S(cpu);
	if (cpu.reg.E)
		cpu.pins.D = cpu.regs.P & 0xF7; // Clear bit 4
	else
		cpu.pins.D = cpu.regs.P;
	M_DEC_S(cpu);
}
set_pins(C_PUSH_P, 0, 1, 0, 1);

function C_READ(cpu, operand, addr) {
	cpu.latched = operand;
	M_SET_Addr(cpu, addr, ((addr >> 16) & 0xFF));
}
set_pins(C_READ, 0, 1, 0, 0);

function C_READ_VPB(cpu, operand, addr) {
	cpu.latched = operand;
	M_SET_Addr(cpu, addr, ((addr >> 16) & 0xFF));
}
set_pins(C_READ_VPB, 0, 1, 1, 0);


class microcodelist {
	constructor() {
		this.actions = [];
		this.cleanup = function() {}; // Cleanup after last instruction. Defaults to do nothing
	}
	
	push(what) {
		this.actions.push(what);
	}
	
	clear() {
		this.actions = [];
		this.cleanup = function() {};
	}
	
};

class w65c816 {
	#last_RES = 0;
	#NMI_count = 0;
	#NMI_pending;
	#ABORT_pending;
	#RES_pending;
	#IRQ_pending;
	
	constructor() {
		this.reg = new w65c816_registers();
		this.pins = new w65c816_pins();
		this.#last_RES = 0;
		this.#NMI_count = 0;
		this.reg.IR = BOOTUP;
		this.fetch_addr = 0;
		
		this.STPWAI = false;
		this.#NMI_pending = false;
		this.#ABORT_pending = false;
		this.#IRQ_pending = false;
		this.#RES_pending = true;
		
		this.cached_microcodes = new Map();
		this.microcode = new microcodelist();
		this.addr_mode = 
		
		this.decoded_opcodes = new Map();
		this.decoded_opcodes[0] = new Map();
		this.decoded_opcodes[1] = new Map();
		
		this.latched = OPERANDS.NONE;
	}
	
	cycle() {
		if ((this.reg.TCU === 0) && (this.#RES_pending)) {
			this.reset();
			return;
		}
		
		
		// OK, check if we're STOP or WAIting
		if (this.STPWAI) {
			// Don't do anything
			return;
		}
		
		// Last cycle was a read, so we have to respect that
		if (!this.pins.RW) {
			M_SET_OPERAND(this, this.latched, this.pins.D);
		}
		this.latched = OPERANDS.NONE;
		
		// Check if we need to be fetching an opcode
		if (this.reg.TCU >= this.microcode.actions.length) {
			this.fetch_opcode();
			return;
		}
		if (this.reg.TCU === 1) {
			// Decode instruction
			this.fetch_addr = 0;
			this.decode_opcode(this.E, this.IR);
		}
		if (this.reg.TCU > 1) {
			// Execute microcode
		}
		
	}
	
	decode_opcode(IR) {
		let microcode = this.decoded_opcodes[this.reg.E][this.reg.M][this.reg.X][IR];
		if (typeof(microcode) === 'undefined') {
			// Actually decode
			microcode = new microcode_list();
			microcode.push(MKCODE('NOP', NOP, true));
			switch(IR) {
				case 0x00: // BRK s
					break;	
				case 0x01: // ORA (d,x) Direc Ix Ind X
					this.addr_mode = ADDR_MODES.DIRECT_INDEXED_IND_X;
				microcode.push(MKCODE('AM', FETCH_AM_VAR_E, false));
				break;	
				case 0x02: // COP s. stack
					break;	
				case 0x03: // ORA d,s stack relative
					break;	
				case 0x04: // TSB d direct
					break;	
				case 0x05: // ORA d direct
					break;	
				case 0x06: // ASL d direct
					break;	
				case 0x07: // ORA [d] direct ind long
					break;
				case 0x08: // PHP s stack
					break;	
				case 0x09: // ORA # immediate
					break;	
				case 0x0A: // ASL a absolute
					break;	
				case 0x0B: // PHD s stack
					break;	
				case 0x0C: // TSB a absolute
					break;	
				case 0x0D: // ORA a absolute
					break;	
				case 0x0E: // ASL a
					break;	
				case 0x0F: // OR al
					break;	
				case 0x10: // BPL r
					break;	
				case 0x11: // ORA (d), y
					break;	
				case 0x12: // ORA (d)
					break;	
				case 0x13: // ORA(d,s),y
					break;	
				case 0x14: // TRB d
					break;	
				case 0x15: // ORA d,x
					break;	
				case 0x16: // ASL d,x
					break;	
				case 0x17: // ORA [d],y
					break;	
				case 0x18: // CLC i
					break;	
				case 0x19: // ORA a,y
					break;	
				case 0x1A: // INC A
					break;	
				case 0x1B: // TCS i
					break;	
				case 0x1C: // TRB a
					break;	
				case 0x1D: // ORA a,x
					break;	
				case 0x1E: // ASL a,x
					break;	
				case 0x1F: // ORA al, x
					break;	
				case 0x20: // JSR a
					break;	
				case 0x21: // AND (d,x)
					break;	
				case 0x22: // JSL al
					break;	
				case 0x23: // AND d,s
					break;	
				case 0x24: // BIT d
					break;	
				case 0x25: // AND d
					break;	
				case 0x26: // ROL d
					break;	
				case 0x27: // AND [d]
					break;	
				case 0x28: // PLP s
					break;	
				case 0x29: // AND #
					break;	
				case 0x2A: // ROL A
					break;	
				case 0x2B: // PLD s
					break;	
				case 0x2C: // BIT a
					break;	
				case 0x2D: // AND a
					break;	
				case 0x2E: // ROL a
					break;	
				case 0x2F: // AND al
					break;	
				case 0x30: // BMI R
					break;	
				case 0x31: // AND (d),y
					break;	
				case 0x32: //
					break;	
				case 0x33: //
					break;	
				case 0x34: //
					break;	
				case 0x35: //
					break;	
				case 0x36: //
					break;	
				case 0x37: //
					break;	
				case 0x38: //
					break;	
				case 0x39: //
					break;	
				case 0x3A: //
					break;	
				case 0x3B: //
					break;	
				case 0x3C: //
					break;	
				case 0x3D: //
					break;	
				case 0x3E: //
					break;	
				case 0x3F: //
					break;	
				case 0x40: //
					break;	
				case 0x41: //
					break;	
				case 0x42: //
					break;	
				case 0x43: //
					break;	
				case 0x44: //
					break;	
				case 0x45: //
					break;	
				case 0x46: //
					break;	
				case 0x47: //
					break;	
				case 0x48: //
					break;	
				case 0x49: //
					break;	
				case 0x4A: //
					break;	
				case 0x4B: //
					break;	
				case 0x4C: //
					break;	
				case 0x4D: //
					break;	
				case 0x4E: //
					break;	
				case 0x4F: //
					break;	
				case 0x50: //
					break;	
				case 0x51: //
					break;	
				case 0x52: //
					break;	
				case 0x53: //
					break;	
				case 0x54: //
					break;	
				case 0x55: //
					break;	
				case 0x56: //
					break;	
				case 0x57: //
					break;	
				case 0x58: //
					break;	
				case 0x59: //
					break;	
				case 0x5A: //
					break;	
				case 0x5B: //
					break;	
				case 0x5C: //
					break;	
				case 0x5D: //
					break;	
				case 0x5E: //
					break;	
				case 0x5F: //
					break;	
				case 0x60: //
					break;	
				case 0x61: //
					break;	
				case 0x62: //
					break;	
				case 0x63: //
					break;	
				case 0x64: //
					break;	
				case 0x65: //
					break;	
				case 0x66: //
					break;	
				case 0x67: //
					break;	
				case 0x68: //
					break;	
				case 0x69: //
					break;	
				case 0x6A: //
					break;	
				case 0x6B: //
					break;	
				case 0x6C: //
					break;	
				case 0x6D: //
					break;	
				case 0x6E: //
					break;	
				case 0x6F: //
					break;	
				case 0x70: //
					break;	
				case 0x71: //
					break;	
				case 0x72: //
					break;	
				case 0x73: //
					break;	
				case 0x74: //
					break;	
				case 0x75: //
					break;	
				case 0x76: //
					break;	
				case 0x77: //
					break;	
				case 0x78: //
					break;	
				case 0x79: //
					break;	
				case 0x7A: //
					break;	
				case 0x7B: //
					break;	
				case 0x7C: //
					break;	
				case 0x7D: //
					break;	
				case 0x7E: //
					break;	
				case 0x7F: //
					break;
				/*
				case 0x0: //
					break;	
				case 0x1: //
					break;	
				case 0x2: //
					break;	
				case 0x3: //
					break;	
				case 0x4: //
					break;	
				case 0x5: //
					break;	
				case 0x6: //
					break;	
				case 0x7: //
					break;	
				case 0x8: //
					break;	
				case 0x9: //
					break;	
				case 0xA: //
					break;	
				case 0xB: //
					break;	
				case 0xC: //
					break;	
				case 0xD: //
					break;	
				case 0xE: //
					break;	
				case 0xF: //
					break;	
					*/	
				}
		}
	}
	
	fetch_opcode() {
		this.reg.TCU = 0;
		this.latched = OPERANDS.IR;	
		M_SET_Addr(this, this.reg.PC, this.reg.PBR);
		this.pins.VDA = 1;
		this.pins.VPA = 1;
		this.pins.RW = 0;
		this.pins.VPB = 0;
	}
	
	reset() {
		var codelist = this.microcode;
		codelist.clear();
		codelist.push(MKCODE('NOP', NOP, true));
		codelist.push(MKCODE('RST_FLAGS', true, M_RST_FLAGS));
		if (!this.reg.E) {
			codelist.push(MKCODE('PUSH_PBR', C_PUSH_PBR, false));
		}
		// VPA VDA VPB RW
		codelist.push(MKCODE('PUSH_PCH', C_PUSH_PCH, false));
		codelist.push(MKCODE('PUSH_PCL', C_PUSH_PCL, false));
		codelist.push(MKCODE('PUSH_P', C_PUSH_P, false));
		codelist.push(MKCODE('READ_LOW', C_READ_VPB, false, OPERAND.PCL, VEC_RST_LO));
		codelist.push(MKCODE('READ_HIGH', C_READ_VPB, false, OPERAND.PCH, VEC_RST_HI));
		codelist.cleanup = function(cpu) {cpu.#RES_pending = false;}
	}
};