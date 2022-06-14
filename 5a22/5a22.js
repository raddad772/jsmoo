"use scrict";
/*
Timing Notes
The 42xxh Ports are clocked by the CPU Clock, meaning that one needs the same amount of "wait" opcodes no matter if the CPU Clock is 3.5MHz or 2.6MHz. When reading the result, the "MOV r,[421xh]" opcode does include 3 cycles (spent on reading the 3-byte opcode), meaning that one needs to insert only 5 cycles for MUL and only 13 for DIV.
Some special cases: If the the upper "N" bits of 4202h are all zero, then it seems that one may wait "N" cycles less. If memory REFRESH occurs (once and when), then the result seems to be valid within even less wait opcodes.
The maths operations are started only on WRMPYB/WRDIVB writes (not on WRMPYA/WRDIVL/WRDIVH writes; unlike the PPU maths which start on any M7A/M7B write).
*/

/*so mul and div happen 1 cycle of operation per 1 cycle of CPU which can take variable master cycles ok
but unlike CPU core they are not interrupted by DRAM refresh
*/

class ricoh5A22 {
	constructor(busA, busB, clock) {
		this.cpu = new w65c816();
		this.busA = busA;
		this.busB = busB;
		this.clock = clock;

        this.steps_for_CPU_cycle_left = 0;
	}

	reset() {
		this.cpu.pins.RES = 1;
	}

	steps(scanline) {
		// Dispatch IRQ, NMI, DMA, CPU cycles, etc.

	}
}

