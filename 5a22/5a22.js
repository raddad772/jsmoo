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

RMODES = Object.freeze({CPU: 0, DMA: 1, HDMA: 2})
let SNES_DO_TRACING = false;
let MAX_TRACES = 100;

class ricoh5A22 {
	/**
	 * @param {*} version
	 * @param {snes_memmap} mem_map
	 * @param {SNES_clock} clock
	 */
	constructor(version, mem_map, clock) {
		this.cpu = new w65c816();
		this.CPUregs = new Uint8Array(0x100);
		this.version = version;
		this.timing = null;
		this.clock = clock;

		this.ROMspeed = 8; // default to slow rom

        this.steps_for_CPU_cycle_left = 0;
		this.scanline_start = 0;
		this.steps_left = 0;
		this.cpu_addr = 0;
		if (SNES_DO_TRACING) {
			this.cpu.enable_tracing(this.read_trace.bind(this))
		}
		this.cpu_addrlow = 0;
		this.cpu_bank = 0;

		this.mem_map = mem_map;
		this.mem_map.read_cpu = this.reg_read.bind(this);
		this.mem_map.write_cpu = this.reg_write.bind(this);

		this.status = {
			nmi_hold: 0,
			nmi_line: 0,
			nmi_transition: 0,

			irq_lock: 0,
			irq_hold: 0,
			irq_line: 0,
			irq_transition: 0,
        	dma_pending: false,
        	hdma_pending: false,
        	dma_active: false,
		}

		this.counters = {
			dma: 0
		}

		this.dma = new r5a22DMA(mem_map, this.dma_edge, this.status, this.counters);

		this.mode = RMODES.CPU;


		this.io = {
			hirq_enable: 0,
			virq_enable: 0,
			irq_enable: 0,
			nmi_enable: 0,
			auto_joypad_poll: 0,

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

	read_trace(bank, addr) {
		return this.mem_map.dispatch_read(addr, 0, false);
	}

	// Basically, check for DMA triggers and squashing each other, etc.
	dma_edge() {
		this.counters.dma = 0;
		if (this.status.dma_active) {
			if (this.status.hdma_pending) {
				this.status.hdma_pending = false;
				if (this.hdma_is_enabled()) {
					if (!this.dma_is_enabled()) {
						this.steps_left -= 8 - (this.timing.cycles_since_reset & 7);
						this.clock.cpu_has += 8 - (this.timing.cycles_since_reset & 7);
					}
					if (this.status.hdma_mode === 0) this.dma.hdma_setup();
					else this.dma.hdma_run();
					if (!this.dma_is_enabled()) {
						this.steps_left -= this.counters.dma;
						this.status.dma_active = false;
					}
				}
			}

			if (this.status.dma_pending) {
				this.status.dma_pending = false;
				if (this.dma_is_enabled()) {
					this.steps_left -= 8 - (this.timing.cycles_since_reset & 7);
					this.dma.dma_run();
					this.steps_left -= this.counters.dma;
					this.counters.dma = 0;
					this.status.dma_active = false;
				}
			}
		}

		if (!this.status.dma_active) {
			if (this.status.dma_pending || this.status.hdma_pending) {
				this.status.dma_active = true;
			}
		}
	}

	read_nmi(have_effect=true) {
		let r = this.status.nmi_line;
		if (!this.status.nmi_hold && have_effect) {
			this.status.nmi_line = 0;
		}
		return r;
	}

	read_irq(have_effect=true) {
		let r = this.status.irq_line;
		if (!this.status.irq_hold && have_effect) {
			this.status.irq_line = 0;
			this.status.irq_transition = 0;
		}
		return r;
	}

	reg_read(addr, val=0, have_effect=true) { // Val is for open bus
		console.log('5A22 read', hex0x4(addr));
		if ((addr & 0x4300) === 0x4300) { this.dma.reg_read(addr, val, have_effect); return; }
		switch(addr) {
			case 0x4210: // NMI read
				val &= 0x70;
				val |= this.read_nmi(have_effect) << 7;
				val |= (this.version.rev);
				return val;
			case 0x4211: // IRQ read
				val &= 0x7F;
				val |= this.read_irq(have_effect) << 7;
				return val;
			case 0x4214: // Hardware multiplier stuff
				return this.io.rddiv & 0xFF;
			case 0x4215:
				return (this.io.rddiv >>> 8) & 0xFF;
			case 0x4216:
				return this.io.rdmpy & 0xFF;
			case 0x4217:
				return (this.io.rdmpy >>> 8) & 0xFF;
		}
		return val;
	}

	reg_write(addr, val) {
		console.log('5A22 write', hex0x4(addr), hex0x2(val));
		if ((addr & 0x4300) === 0x4300) { this.dma.reg_write(addr, val); return; }
		switch(addr) {
			case 0x4200: // NMI timing
				this.io.hirq_enable = (val & 0x10) >>> 4;
				this.io.virq_enable = (val & 0x20) >>> 5;
				this.io.irq_enable = this.io.hirq_enable | this.io.virq_enable;
				if (this.io.virq_enable && !this.io.hirq_enable && this.status.irq_line) {
					this.status.irq_transition = 1;
				}
				else if (!this.io.irq_enable) {
					this.status.irq_line = 0;
					this.status.irq_transition = 0;
				}
				let onmi = this.io.nmi_enable;
				this.io.nmi_enable = (val & 0x80) >>> 7;

				if ((!onmi && this.io.nmi_enable) && this.status.nmi_line) {
					this.status.nmi_transition = 1;
				}

				this.status.irq_lock = 1;
				return;
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
			case 0x4207: // HTIME lo
				this.io.htime = (((((this.io.htime >>> 2) - 1) & 0x100) | val) + 1) << 2;
				return;
			case 0x4208: // HTIME hi
				this.io.htime = (((((this.io.htime >>> 2) - 1) & 0xFF) | ((val & 1) << 8)) + 1) << 2;
				return;
			case 0x4209: // VTIME lo
				this.io.vtime = (this.io.vtime & 0x100) | val;
				return;
			case 0x420A: // VTIME hi
				this.io.vtime = (this.io.vtime & 0xFF) | ((val & 1) << 8);
				return;
			case 0x420B: // DMA enables
				for (let n = 0; n < 8; n++) {
					this.dma.channels[n].dma_enable = (val >>> (n - 1)) & 1;
				}
				if (val !== 0) this.status.dma_pending = true;
				return;
			case 0x420C: // HDMA enables
				for (let n = 0; n < 8; n++) {
					this.dma.channels[n].hdma_enable = (val >>> (n - 1)) & 1;
				}
				return;
			case 0x420D: // Cycle speed of ROM
				this.ROMspeed = (val & 1) ? 6 : 8;
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
	}

	service_CPU_cycle() {
		// Determine bus
		//if (this.cpu.pins.Addr === 0x803C) console.log(this.cpu.pins.trace_cycles, '803C!', this.cpu.pins.PDV);
		if (this.cpu.pins.PDV) { // Read/write
			if (this.cpu.pins.RW) { // Write
				this.mem_map.dispatch_write(this.cpu_addr, this.cpu.pins.D);
				if (SNES_DO_TRACING) {
					this.cpu.pins.traces.push(this.cpu.trace_format_write(this.cpu_addr, this.cpu.pins.D));
				}
			}
			else { // Read
				let r = this.mem_map.dispatch_read(this.cpu_addr, this.cpu.pins.D);
				//if (this.cpu_addr === 0x803C) console.log('GOT BACK-----------', hex0x2(r));
				if (r !== null) this.cpu.pins.D = r;
				if (SNES_DO_TRACING) {
					this.cpu.pins.traces.push(this.cpu.trace_format_read(this.cpu_addr, this.cpu.pins.D));
				}
			}
		}
		if (SNES_DO_TRACING) {
			if (this.cpu.pins.traces.length > 0) {
				for (let i in this.cpu.pins.traces) {
					dconsole.addl(this.cpu.pins.traces[i]);
				}
				this.cpu.pins.traces = [];
			}
		}

		this.steps_left -= this.steps_for_CPU_cycle_left;
		this.clock.cpu_has += this.steps_for_CPU_cycle_left;
		this.steps_for_CPU_cycle_left = 0;
	}

	dma_is_enabled() {
		let r = false;
		let n = 0;
		while (n < 8 && !r) { r |= this.dma.channels[n].dma_enable; n++; }
		return r;
	}

	hdma_is_enabled() {
		let r = false;
		let n = 0;
		while (n < 8 && !r) { r |= this.dma.channels[n].hdma_enable; n++; }
		return r;
	}

	hdma_is_active() {
		let r = false;
		let n = 0;
		while (n < 8 && !r) { r |= this.dma.channels[n].hdma_is_active(); n++; }
		return r;
	}

	hdma_reset() {
		for (let n = 0; n < 8; n++) this.dma.channels[n].hdma_reset();
	}

	/**
	 * @param {SNEStiming} timing
	 */
	steps(timing) {
		this.timing = timing;
		// Dispatch IRQ, NMI, DMA, CPU cycles, etc.
		if (timing.ppu_y === 0) {
			// HDMA setup
			this.auto_joypad_counter = 33;
		}

		this.steps_left += timing.cycles;
		if (this.steps_left < 0) {
			this.steps_left -= 40; // RAM refresh
			this.clock.cpu_has += 40;
			console.log('SKIPPED WHOLE LINE FROM ' + Math.abs(this.steps_left) + ' STEPS LEFT!');
		}

		while(this.steps_left > 0) {
			let place_in_scanline = (timing.cycles - this.steps_left);

			// Shall we refresh DRAM?
			if ((place_in_scanline >= timing.dram_refresh) && (place_in_scanline < (timing.dram_refresh + 40))) {
				this.steps_left -= 40;
				this.clock.cpu_has += 40;
				place_in_scanline += 40;
				this.alu_cycle(5); // mul/div goes on during DRAM refresh
				// We don't need a continue; here
			}

			// Shall we setup HDMA?
			if (!timing.hdma_setup_triggered && (place_in_scanline >= timing.hdma_setup_position)) {
				timing.hdma_setup_triggered = true;
				this.hdma_reset();
				if (this.hdma_is_enabled()) {
					// Restart-ish HDMA
					this.status.hdma_pending = true;
					this.status.hdma_mode = 0;
				}
			}

			// Shall we execute HDMA?
			if (!timing.hdma_triggered && (place_in_scanline >= timing.hdma_position)) {
				timing.hdma_triggered = true;
				if (this.hdma_is_active()) {
					this.status.hdma_pending = true;
					this.status.hdma_mode = 1;
				}
				// if hdmaActive()    hdma_pending = true. hdma_mode = 1;
			}

			// DMA it out
			if (this.status.dma_pending || this.status.hdma_pending) {
				console.log('DMA!');
				this.dma_edge();
				continue;
			}
			this.clock.cpu_has += this.counters.dma;
			this.steps_left -= this.counters.dma;
			this.counters.dma = 0;

			switch(RMODES.CPU) {
				case RMODES.HDMA:
					break;
				case RMODES.DMA:
					break;
				case RMODES.CPU:
					this.cpu.cycle();

					this.cpu_addr = (this.cpu.pins.BA << 16) + this.cpu.pins.Addr;
					this.steps_for_CPU_cycle_left = this.cpu.pins.PDV ? SNES_mem_timing(this.cpu_addr, this.ROMspeed) : 6;
					// Do timing info...
					this.service_CPU_cycle();
					break;
			}
		}
	}
}

