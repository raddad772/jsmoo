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
	 * @param {*} version
	 * @param {snes_memmap} mem_map
	 */
	constructor(version, mem_map) {
		this.cpu = new w65c816();
		this.CPUregs = new Uint8Array(0x100);
		this.version = version;

		this.ROMspeed = 8; // default to slow rom

        this.steps_for_CPU_cycle_left = 0;
		this.scanline_start = 0;
		this.steps_left = 0;
		this.cpu_addr = 0;
		this.cpu_addrlow = 0;
		this.cpu_bank = 0;

		this.mem_map = mem_map;
		this.mem_map.read_cpu = this.reg_read;
		this.mem_map.write_cpu = this.reg_write;

		this.dma = new r5a22DMA(mem_map);

		this.io = {
			hirqEnable: 0,
			virqEnable: 0,
			irqEnable: 0,
			nmiEnable: 0,
			autoJoypadPoll: 0,

			wrmpya: 0xFF,   // $4202
			wrmpyb: 0xFF,   // $4203
			wrdiva: 0xFFFF, // $4204-4205
			wrdivb: 0xFF,   // $4026

			rddiv: 0, // $4214-4215
			rdmpy: 0 // $4216-4217
		};

		this.alu = {
			mpyctr: 0,
			divctr: 0,
			shift: 0
		};


		this.auto_joypad_counter = 33; // disabled
	}

	reg_read(addr) {
		console.log('5A22 read', hex0x4(addr));
		switch(addr) {
			case 0x4214: // Hardware multiplier stuff
				return this.io.rddiv & 0xFF;
			case 0x4215:
				return (this.io.rddiv >>> 8) & 0xFF;
			case 0x4216:
				return this.io.rdmpy & 0xFF;
			case 0x4217:
				return (this.io.rdmpy >>> 8) & 0xFF;
		}
		return null;
	}

	reg_write(addr, val) {
		console.log('5A22 write', hex0x4(addr), hex0x2(val));
		switch(addr) {
			case 0x4202: // Multiplicand A
				this.io.wrmpya = val;
				return;
			case 0x4203: // Multiplier B & start
				this.io.rdmpy = 0;
				if (this.alu.mpyctr || this.alu.divctr) return;
				this.io.wrmpyb = val;
				this.io.rddiv = (this.io.wrmpyb << 8) | this.io.wrmpya;
				this.alu.mpyctr = 8;
				this.alu.shift = this.io.wrmpyb;
				return;
			case 0x4204: // Dividend lo
				this.io.wrdiva = (this.io.wrdiva & 0xFF00) + val;
				return;
			case 0x4205:
				this.io.wrdiva = (this.io.wrdiva & 0xFF) + (val << 8);
				return;
			case 0x4206:
				this.io.rdmpy = this.io.wrdiva;
				if(this.alu.mpyctr || this.alu.divctr) return;

				this.io.wrdivb = val;

				this.alu.divctr = 16;
				this.alu.shift = this.io.wrdivb << 16;
				return;
		}
	}

	alu_cycle(num=1) {
		while (num > 0) {
			if (this.alu.mpyctr) {
				this.alu.mpyctr--;
				if (this.io.rddiv & 1) this.io.rdmpy += this.alu.shift;
				this.io.rddiv >>>= 1;
				this.alu.shift <<= 1;
			}

			if (this.alu.divctr) {
				this.alu.divctr--;
				this.io.rddiv <<= 1;
				this.alu.shift >>>= 1;
				if (this.io.rdmpy >= this.alu.shift) {
					this.io.rdmpy -= this.alu.shift;
					this.io.rddiv |= 1;
				}
			}
			num--;
		}
	}

	reset() {
		this.cpu.pins.RES = 1;
		this.dma.reset();
		this.multiplier.reset();
	}

	service_CPU_cycle() {
		// Determine bus

		if (this.cpu.pins.PDV) { // Read/write
			if (this.cpu.pins.RW) { // Write
				this.mem_map.dispatch_write(this.cpu_addr, this.cpu.pins.D);
			}
			else { // Read
				let r = this.mem_map.dispatch_read(this.cpu_addr);
				if (r !== null) this.cpu.pins.D = r;
			}
		}

		this.steps_left -= this.steps_for_CPU_cycle_left;
		this.steps_for_CPU_cycle_left = 0;
	}

	/**
	 * @param {SNEStiming} timing
	 */
	steps(timing) {
		// Dispatch IRQ, NMI, DMA, CPU cycles, etc.

		if (timing.ppu_y === 0) {
			// HDMA setup
			this.auto_joypad_counter = 33;
		}

		this.steps_left = timing.cycles;
		if (this.scanline_start !== 0) {
			this.steps_left -= this.scanline_start;
		}

		while(this.steps_left > 0) {
			let place_in_scanline = (timing.cycles - this.steps_left);

			// Shall we refresh DRAM?
			if ((place_in_scanline >= timing.dram_refresh) && (place_in_scanline < (timing.dram_refresh + 40))) {
				this.steps_left -= 40;
				place_in_scanline += 40;
				this.alu_cycle(5); // mul/div goes on during DRAM refresh
			}

			// Shall we setup HDMA?
			if (!timing.hdma_setup_triggered && (place_in_scanline >= timing.hdma_setup_position)) {
				timing.hdma_setup_triggered = true;
				this.hdma_setup();
				// if hdmaEnable, hdmaPending = true, hdmaMode = 0
			}

			// Shall we execute HDMA?
			if (!timing.hdma_triggered && (place_in_scanline >= timing.hdma_position)) {
				timing.hdma_triggered = true;
				// if hdmaActive()    dhma_pending = true. hdma_mode = 1;
			}




			// now do 65816 stuff
			this.cpu.cycle();

			this.cpu_addr = (this.cpu.pins.BA << 16) + this.cpu.pins.Addr;
			this.steps_for_CPU_cycle_left = this.cpu.pins.PDV ? SNES_mem_timing(this.cpu_addr, this.ROMspeed) : 6;
			// Do timing info...
			if (this.steps_for_CPU_cycle_left > this.steps_left)
				return;
			this.service_CPU_cycle();
		}
	}
}

