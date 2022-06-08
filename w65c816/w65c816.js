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
   
const BOOTUP = OM.S_RESET;

let VEC_RST_LO = 0x00FFFC;
let VEC_RST_HI = 0x00FFFD;


class w65c816_P {
	constructor(pins) {
		this.C = this.Z = this.I = this.D = this.X = this.M = this.V = this.N = 0;
	}
	
	getbyte_emulated() {

	}

	setbyte_emulate() {

	}

	getbyte_native() {
		return this.C | (this.Z << 1) | (this.I << 2) | (this.D << 3) | (this.X << 4) | (this.M << 5) | (this.V << 6) | (this.N << 7);
	}
	
	setbyte_native(val) {
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
		this.skipped_cycle = false; // For when we...skip a cycle! For certain ops
		this.in_blockmove = false;  // For when we are in a blockmove

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

class w65c816 {
	#last_RES = 0;
	#NMI_count = 0;
	#NMI_pending;
	#ABORT_pending;
	#RES_pending;
	#IRQ_pending;
	
	constructor() {
		this.regs = new w65c816_registers();
		this.pins = new w65c816_pins();
		this.#last_RES = 0;
		this.#NMI_count = 0;
		this.regs.IR = BOOTUP;
		this.fetch_addr = 0;
		
		this.STPWAI = false;
		this.#NMI_pending = false;
		this.#ABORT_pending = false;
		this.#IRQ_pending = false;
		this.#RES_pending = true;
	}
	
	cycle() {
		if ((this.regs.TCU === 0) && (this.#RES_pending)) {
			this.reset();
			return;
		}

		this.regs.TCU++;
		if (this.regs.TCU === 1) {
			this.regs.IR = this.pins.D & 0xFF;
			this.current_instruction = decode_opcode(this.regs);
		}
		this.current_instruction.exec_func(this.regs, this.pins);
	}
	
	decode_opcode() {
		this.current_instruction = null; // FILL THIS IN
	}
	
	reset() {
		// Do more
		this.regs.TCU = 0;
		this.regs.IR = OM.S_RESET;
	}
}