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
/**
 * @param {Number} addr
 * @param {Number} ROMspeed
 * @returns {number}
 * @constructor
 */
function SNES_mem_timing(addr, ROMspeed) {
	// Taken from a byuu post on a forum, thanks byuu!

	let rspeed = ROMspeed || 8;

	// 00-3f, 80-bf:8000-ffff; 40-7f, c0-ff:0000-ffff
	if (addr & 0x408000) return addr & 0x800000 ? rspeed : 8;
	// 00-3f,80-bf:0000-1fff, 6000-7fff
	if (addr + 0x6000 & 0x4000) return 8;
	// 00-3f, 80-bf:2000-3fff, 4200-5fff
	if (addr - 0x4000 & 0x7e00) return 6;

	//00-34,80-bf:4000-41ff
	return 12;
}

class ricoh5A22 {
	/**
	 * @param {SNESbus} busA
	 * @param {SNESbus} busB
	 * @param version
	 * @param {CallableFunction} mem_map
	 */
	constructor(busA, busB, version, mem_map) {
		this.cpu = new w65c816();
		this.busA = busA;
		this.busB = busB;
		this.CPUregs = new Uint8Array(0x100);
		this.version = version;

		this.ROMspeed = 8; // default to slow rom

        this.steps_for_CPU_cycle_left = 0;
		this.scanline_start = 0;
		this.steps_left = 0;
		this.cpu_addr = 0;
		this.cpu_addrlow = 0;
		this.cpu_bank = 0;

		this.SRAM = new Uint8Array(512 * 1024);

		this.mem_map = mem_map;
		this.auto_joypad_counter = 33; // disabled
	}

	reset() {
		this.cpu.pins.RES = 1;
	}

	readwriteCPUreg() {
		let addr = this.cpu.pins.Addr;
		if (this.cpu.pins.RW) { // Write
			this.CPUregs[addr & 0xFF] = this.cpu.pins.D;
		}
		else { // Read
			this.cpu.pins.D = this.CPUregs[addr & 0xFF];
		}
	}

	service_CPU_cycle() {
		// Determine bus
		if(this.steps_for_CPU_cycle_left === 12) {
			this.readwriteCPUreg();
		}
		if ((this.cpu_bank <= 0x3F) && ((this.cpu_addrlow >= 0x2100 && this.cpu_addrlow <= 0x21FF) || (this.cpu_addrlow >= 0x4200 && this.cpu_addrlow <= 0x44FF))) {
			// BusB
			console.log('WRITE TO', hex0x4(this.cpu_addrlow));
		}
		else {
			// BusA
			// Map to WRAM or cartridge
			let ma = this.mem_map(this.cpu_addr);
			if (ma.RAMaddr) {
				// R/W RAM
				if (this.cpu.pins.RW)
					this.busA.write8(ma.RAMaddr, this.cpu.pins.D);
				else
					this.cpu.pins.D = this.busA.read8(ma.RAMaddr);
			}
			else if (ma.ROMaddr) {

				// R/W ROM
			}
			else if (ma.SRAMaddr) {
				if (this.cpu.pins.RW)
					this.SRAM[ma.SRAMaddr] = this.cpu.pins.D;
				else
					this.cpu.pins.D = this.SRAM[ma.SRAMaddr];
				// R/W SRAM
			}
		}

		this.steps_left -= this.steps_for_CPU_cycle_left;
		this.steps_for_CPU_cycle_left = 0;
	}

	/**
	 * @param {SNESscanline} scanline
	 */
	steps(scanline) {
		// Dispatch IRQ, NMI, DMA, CPU cycles, etc.

		if (scanline.y === 0) {
			// HDMA setup
			this.auto_joypad_counter = 33;
		}

		if (this.scanline_start !== 0) {
			// We left partway through a CPU cycle? Or DMA TRANSFER!?
			this.service_CPU_cycle();
		}

		this.scaline_start = this.steps_left;
		this.steps_left += scanline.cycles;
		while(this.steps_left > 0) {
			let place_in_scanline = scanline.cycles - (this.steps_left - this.scanline_start);

			if ((place_in_scanline >= scanline.dram_refresh) && (place_in_scanline < (scanline.dram_refresh + 40))) {
				// Simulate DRAM refresh time
				this.steps_left -= 40;
			}

			// if DmA
			// etc.

			// now do 65816 stuff
			this.cpu.cycle();

			this.cpu_addr = (this.cpu.pins.BA << 16) + this.cpu.pins.Addr;
			this.cpu_bank = this.cpu.pins.BA;
			this.cpu_addrlow = this.cpu.pins.Addr;
			this.steps_for_CPU_cycle_left = this.cpu.pins.PDV ? SNES_mem_timing(this.cpu_addr, this.ROMspeed) : 6;
			// Do timing info...
			if (this.steps_for_CPU_cycle_left > this.steps_left) {
				return;
			}
			this.service_CPU_cycle();

		}
	}
}

