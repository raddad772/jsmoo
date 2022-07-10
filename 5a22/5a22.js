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

RMODES = Object.freeze({
	WRAM_REFRESH: 0,
	HDMA: 1,
	DMA: 2,
	CPU: 3,
});

// So
// A 5A22 is basically a state machine that can be in 1 of 3 states,
//  in these priorities:

// 1. Do nothing during DRAM refresh for 40 cycles
// 2. Execute HDMA for up to 8 master clocks
// 3. Execute DMA (this is completely halted by HDMA) for up to 8 master clocks
// 4. Execute CPU cycle, IRQ/NMI poll, ALU cycle for up to 12 master clocks

// Furthermore, we want to be able to step in and out in arbitrary number
//  of master clock cycles
// SNES timing is based around a scanline. At the start of a scanline,
//  things are latched (locked into stone):
//   1) where HDMA setup will trigger
//   2) where HDMA will trigger

// So HDMA and DMA should be their own state machine just like CPU

// In between each block, an "edge" should happen, which re-evaluates
//  HDMA/DMA/DRAM refresh/etc.

const R5A22_priorities = Object.freeze({
	HIGHEST: 0,      // Mostly for internal CPU timers
	WRAM_REFRESH: 1,
	HDMA: 2,
	DMA: 3,
	CPU: 4
});

const R5A22_events = {
	SCANLINE_START: 0,
	IRQ: 1,  // HIRQ or HVIRQ
	WRAM_REFRESH: 2,
	HDMA_SETUP: 4,
	HDMA: 5,
	NONE: 19,
	DMA: 20,  // This happens immediately on-demand
	VIRQ: 21, // This happens on scanline start only
}

const RM = Object.freeze({
	CPU: 0,
	DMA: 1,
	HDMA: 2,
	WRAM_REFRESH: 3 // We could step out in the middle of it
})

class ricoh5A22 {
	/**
	 * @param {*} version
	 * @param {snes_memmap} mem_map
	 * @param {SNES_clock} clock
	 */
	constructor(version, mem_map, clock) {
		this.cpu = new w65c816(clock);
		this.CPUregs = new Uint8Array(0x100);
		this.version = version;
		this.clock = clock;
		this.clock.cpu_deficit = 0;

		this.events_list = [];

		this.tracing = false;

		this.ROMspeed = 8; // default to slow rom

        this.steps_for_CPU_cycle_left = 0;
		this.steps_left = 0;
		this.cpu_addr = 0;

		this.mem_map = mem_map;
		this.mem_map.read_cpu = this.reg_read.bind(this);
		this.mem_map.write_cpu = this.reg_write.bind(this);
		clock.set_cpu(this);

		this.scanline = {
			events: {},
			current_priority: 7,
		}

		this.event_ptrs = {
			[R5A22_events.HDMA]: null,
			[R5A22_events.HDMA_SETUP]: null,
			[R5A22_events.IRQ]: null,
			[R5A22_events.WRAM_REFRESH]: null,
			[R5A22_events.SCANLINE_START]: null
		}

		this.current_event = 0;
		this.next_event = 0;
		this.current_mode = RM.CPU;

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
			dma_running: false,
			hdma_running: false,
        	dma_active: false,
		}

		this.counters = {
			dma: 0
		}

		this.dma = new r5a22DMA(mem_map, this.status, this.clock);

		this.mode = RMODES.CPU;
		this.old_mode = RMODES.CPU;
		this.mode_left = 0; // How many cycles left in current mode, such as WRAM_REFRESH

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
			rdmpy: 0, // $4216-4217

			htime: 0x1FF, // HIRQ time
			vtime: 0x1FF, // VIRQ time
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

	enable_tracing() {
		if (this.tracing) return;
		this.cpu.enable_tracing(this.read_trace.bind(this))
		this.tracing = true;
	}

	disable_tracing() {
		if (!this.tracing) return;
		this.cpu.disable_tracing();
		this.tracing = false;
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
					console.log('IS ENABLED!');
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

	set_nmi_bit(newval) {
		let onmi = this.io.nmi_enable;
		this.io.nmi_enable = newval;

		if ((!onmi && this.io.nmi_enable) && this.status.nmi_line) {
			this.status.nmi_transition = 1;
		}
	}

	reg_write(addr, val) {
		console.log('5A22 write', hex0x4(addr), hex0x2(val));
		if ((addr & 0x4300) === 0x4300) { this.dma.reg_write(addr, val); return; }
		switch(addr) {
			case 0x4200: // NMI timing
				this.io.hirq_enable = (val & 0x10) >>> 4;
				this.io.virq_enable = (val & 0x20) >>> 5;
				this.io.irq_enable = this.io.hirq_enable | this.io.virq_enable;
				// If VIRQ is enabled, HIRQ is NOT enabled, and we're on the IRQ line...
				if (this.io.virq_enable && !this.io.hirq_enable && this.status.irq_line) {
					this.status.irq_transition = 1;
				}
				else if (!this.io.irq_enable) { // Else if IRQ is not enabled
					this.status.irq_line = 0;
					this.status.irq_transition = 0;
				}
				this.set_nmi_bit(this.io.nmi_enable);

				this.reschedule_scanline_irqbits();
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
				if (val !== 0) {
					this.status.dma_pending = true;
					this.rescheduled = true;
				}
				return;
			case 0x420C: // HDMA enables
				for (let n = 0; n < 8; n++) {
					this.dma.channels[n].hdma_enable = (val >>> (n - 1)) & 1;
				}
				console.log('HDMA CHANNEL WRITE', val);
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

	// So. We have a state machine
	// When we enter, we may have more steps to subtract from last op
	// Then, each time we advance, we determine:
	// Is WRAM refresh pending/active? If so, do that
	// Is HDMA setup pending & timing right? If so, do that
	// Is HDMA pending/active and/or timing right? If so, do that
	// Is DMA pending/active? If so, do that
	// Else, cycle the CPU and run the ALU.

	// But we're going to optimize this!

	// If we're at the WRAM trigger point, we must...trigger WRAM!

	// dma_pending is known INSTANTLY because it's a register write that hooks
	//  this.dma_pending.

	// hdma_setup only matters if
	//  (a) we are at the trigger point and it is pending (for Y=0 I believe)

	// hdma is more complex, but it only matters if
	//  (a) it is active with a transfer
	//  (b) we are at the trigger-point and it is pending

	// IRQ bits may have changed...
	reschedule_scanline_irqbits() {
		console.log('scanline reschedule due to IRQ bit write...')
		let e = null;
		let old_irq_time = -1;
		let old_irq_event = -1;
		let new_irq_time = -1;
		if (this.event_ptrs[IRQ] !== null) {
			for (let i in this.events_list) {
				if (this.events_list[i][1] === R5A22_events.IRQ) {
					old_irq_time = this.events_list[i][0];
					old_irq_event = i;
					break;
				}
			}
		}
		if (this.io.hirq_enable && (!this.io.virq_enable || (this.io.virq_enable && this.io.vtime === scanline.ppu_y))) {
			new_irq_time = 0 ? 10 : 14 + (this.io.htime * 4);
			e = [this.io.htime === new_irq_time, R5A22_events.IRQ, false];
			this.event_ptrs[R5A22_events.IRQ] = e;
		}
		else if (!this.io.hirq_enable && (this.io.virq_enable && this.io.vtime === scanline.ppu_y)) {
			new_irq_time = 10;
			e = [new_irq_time, R5A22_events.IRQ, false];
			this.event_ptrs[R5A22_events.IRQ] = e;
		}
		// Check different permutations of rescheduling

		// Don't reschedule if it hasn't changed
		if (old_irq_time === new_irq_time) return;
		// Don't reschedule if new time is after current scanline position 'cuz it won't trigger
		if (this.scanline.cycles_since_scanline_start > new_irq_time && old_irq_time < this.scanline.cycles_since_scanline_start) return;
		// Let CPU inner loop know its timing data is now invalid
		this.rescheduled = true;
		// delete if new -1
		if (new_irq_time === -1) {
			this.event_ptrs[R5A22_events.IRQ] = null; // Quick "delete"
			this.events_list = this.events_list.splice(old_irq_event, 1);
		}
		else if (old_irq_time === -1) { // create if old -1, and re-sort
			this.events_list.push(e);
			this.events_list = this.events_list.sort((a, b) => (a[0] > b[0] ? 1 : -1));
		}
		else { // Modify otherwise, by delete and re-add
			this.events_list.splice(old_irq_event, 1);
			this.events_list.push(e);
			this.events_list = this.events_list.sort((a, b) => (a[0] > b[0] ? 1 : -1));
		}
		// Reset our current event index
		// This is a naive slow way of doing ALL of this, it is just proof-of-concept
		let oldi = 0;
		for (let i = 1; i < this.events_list.length; i++) {
			if (this.events_list[i][0] > this.scanline.cycles_since_scanline_start)
				break;
			oldi = i;
		}
		this.current_event = oldi;
		// Set when next event will be
		this.next_event = this.event_ptrs[this.current_event][0];
	}

	schedule_scanline() {
		// Setup events
		// Events are in...cycle#, kind, triggered   order.
		this.events_list = [[0, R5A22_events.SCANLINE_START, true]];
		let e;
		let scanline = this.clock.scanline;
		this.event_ptrs[R5A22_events.HDMA_SETUP] = this.event_ptrs[R5A22_events.HDMA] =
			this.event_ptrs[R5A22_events.IRQ] = null;

		// Check HDMA setup
		if (scanline.hdma_setup_position !== 0) {
			e = [scanline.hdma_setup_position, R5A22_events.HDMA_SETUP, false];
			this.event_ptrs[R5A22_events.HDMA_SETUP] = e;
			this.events_list.push(e);
		}

		// Add WRAM refresh
		e = [scanline.dram_refresh, R5A22_events.WRAM_REFRESH, false];
		this.event_ptrs[R5A22_events.WRAM_REFRESH] = e;
		this.events_list.push(e);

		// Check HDMA trigger
		if (scanline.hdma_position !== 0) {
			e = [scanline.hdma_position, R5A22_events.HDMA, false];
			this.event_ptrs[R5A22_events.HDMA] = e;
			this.events_list.push(e);
		}

		// Check for HIRQ, HVIRQ
		if (this.io.hirq_enable && (!this.io.virq_enable || (this.io.virq_enable && this.io.vtime === scanline.ppu_y))) {
			e = [this.io.htime === 0 ? 10 : 14 + (this.io.htime * 4), R5A22_events.IRQ, false];
			this.event_ptrs[R5A22_events.IRQ] = e;
			this.events_list.push(e);
		}
		else if (!this.io.hirq_enable && (this.io.virq_enable && this.io.vtime === scanline.ppu_y)) {
			e = [10, R5A22_events.IRQ, false];
			this.event_ptrs[R5A22_events.IRQ] = e;
			this.events_list.push(e);
		}

		// Sort the list
		this.events_list = this.events_list.sort((a, b) => (a[0] > b[0] ? 1 : -1));

		// Set current event pointer
		this.current_event = 0;

		// Set when next event will be
		this.next_event = this.events_list[this.current_event][1];
		console.log('NEXT EVENT', this.current_event, this.next_event);
		console.log('EVENT LIST', this.events_list);
	}


	// dma can check if dma_active or dma_pending, and act accordingly

	// If none of those, do a CPU cycle.

	// Timers can also trigger for NMI or IRQ.

	// HOWEVER! We can do BLOCKS of CPU cycles.
	// NMI output low on first vblank line. clears $4200 bit 7
	// NMI output high at H=0 V=0 or $4210 read
	// H-IRQ goes low every scanline at (HTIME=0 ? 10 : 14+H*4) master cycles,
	// V-IRQ goes low at scanline VTIME
	// HV-IRQ only goes low at that dot of that scanline
	// IRQ high when $4211 read, or when IRQs disabled by write to $4200

	// So events that CAN happen in a scanline:
	// V-IRQ at start if correct scanline
	// H-IRQ at any time, if H-IRQ is enabled
	// NMI set/clear at start of scanline depending on which scanline
	// WRAM refresh at ~538 cycles
	// HDMA setup at around ~28 cycles
	// HDMA evaluation at ~1104 cycles

	// We are going to have a scanline-based state machine.
	// We can be part way through a scanline, for instance, when stepping.
	// We will have a calculated timeline of events to follow. If someone writes to registers during
	//  that time, the timeline will be recalculated.
	do_steps(howmany) {
		this.clock.cpu_deficit += howmany;

		// Check if we're in WRAM refresh, in which case, nothing other than an IRQ timer check will happen
		if (this.mode === RM.WRAM_REFRESH) {
			let can_do = this.clock.cpu_deficit > this.mode_left ? this.mode_left : this.clock.cpu_deficit;
			this.mode = RM.WRAM_REFRESH;
			if (can_do < this.mode_left) {
				this.mode_left = can_do < this.clock.cpu_deficit ? this.clock.cpu_deficit : 0;
			}
			this.clock.advance_steps_from_cpu(can_do);
			if (this.clock.cpu_deficit > 0)
				this.mode = this.old_mode;
			else
				return;
		}
		let scanline = this.clock.scanline;
		while(this.clock.cpu_deficit > 0) {
			console.log('CPU DEFICIT', this.clock.cpu_deficit, this.clock.cycles_since_scanline_start, this.next_event);
			// Check if we tripped a new-scanline scheduling
			//debugger;
			if (scanline.cpu_new_scanline) {
				scanline.cpu_new_scanline = false;
				this.schedule_scanline();
				if (scanline.ppu_y === 0) {
					this.status.nmi_transition = +(this.status.nmi_line !== 0);
					this.status.nmi_line = 0;
				}
				if (scanline.vblank_start) {
					this.status.nmi_transition = +(this.status.nmi_line === 0);
					this.status.nmi_line = 1;
				}
			}

			this.clock.dma_counter = 0;
			// Check if we need to process an event
			if (this.clock.cycles_since_scanline_start >= this.next_event) {
				let ev = this.events_list[this.current_event];
				let already_true = ev[2];
				ev[2] = true;
				this.current_event++;
				this.next_event = this.current_event >= this.events_list.length ? this.clock.scanline.cycles : this.events_list[this.current_event][0];
				if (already_true) continue; // Somehow already got processed
				switch(ev[1]) {
					case R5A22_events.SCANLINE_START:
						break;
					case R5A22_events.IRQ:
						if (!this.status.irq_line) {
							this.status.irq_transition = 1;
							this.status.irq_line = 1;
						}
						break;
					case R5A22_events.HDMA_SETUP:
						if (!this.clock.scanline.hdma_setup_triggered ) {
							this.clock.dma_counter = 0;
							this.dma.hdma_setup();
							this.clock.hdma_setup_triggered = true;
							this.clock.advance_steps_from_cpu(this.clock.dma_counter);
							this.clock.dma_counter = 0;
						}
						break;
					case R5A22_events.HDMA:
						if (this.hdma_is_enabled) {
							this.status.hdma_pending = true;
						}
						break;
					case R5A22_events.WRAM_REFRESH:
						let can_do = this.clock.cpu_deficit > 40 ? 40 : this.clock.cpu_deficit;
						if (can_do < 40) {
							this.mode_left = can_do < 40 ? 40 - can_do : 0;
							this.old_mode = this.mode;
							this.mode = RM.WRAM_REFRESH;
						}
						this.clock.advance_steps_from_cpu(can_do);
						if (can_do < 40) {
							return;
						}
						break;
				}
				continue;
			}

			/*if (this.clock.scanline.vblank_start) {
				// NMI out low (1)
				if (this.status.nmi_line !== 1) {
					this.status.nmi_transition = 1;
					this.status.nmi_line = 1;
				}
			}
			else if (this.clock.scanline.ppu_y === 0) {
				if (this.status.nmi_line !== 0) {
					this.status.nmi_transition = 0;
					this.status.nmi_line = 0;
				}
			}*/
			// Do HDMA setup
			if (this.status.hdma_pending) {
				// run HDMA
				this.clock.dma_counter = 0;
				if (!this.status.dma_running) {
					// Wait up to 8 cycles
					this.clock.dma_counter += (this.clock.cycles_since_reset & 7);
				}
				else {
					// Step on DMA and cancel it
					this.status.dma_running = false;
					this.status.dma_pending = false;
				}

				this.status.hdma_pending = false;
				this.dma.hdma_run();
				this.clock.advance_steps_from_cpu(this.clock.dma_counter);
				console.log('after HDMA run, cycle is at ' + this.clock.cycles_since_scanline_start + ' of ' + this.clock.scanline.cycles + ' after running ' + this.clock.dma_counter + ' cycles.');
				this.clock.dma_counter = 0;
				continue;
			}

			// Run DMA for any available cycles
			let maxe = this.next_event > this.clock.scanline.cycles ? this.clock.scanline.cycles : this.next_event;
			let can_do = (maxe - this.clock.cycles_since_scanline_start);
			//debugger;
			if (this.status.dma_pending || this.status.dma_running) {
				// run DMA for X cycles
				this.clock.dma_counter = 0;
				if (this.status.dma_pending) {
					this.clock.dma_counter += 8;
					this.status.dma_pending = false;
					if (!this.status.dma_running) this.dma.dma_start();
					this.status.dma_running = true;
				}
				this.dma.dma_run(can_do);
				this.clock.advance_steps_from_cpu(this.clock.dma_counter)
				this.clock.dma_counter = 0;
				continue;
			}

			// Now that we're out of all the HDMA and DMA junk,
			//  we can set our lines...
			if (!this.status.irq_lock) {
				if (this.status.nmi_transition) {
					this.cpu.pins.NMI = this.status.nmi_line;
					this.status.nmi_transition = 0;
				}
				if (this.status.irq_transition) {
					this.cpu.pins.IRQ = this.status.irq_line;
					this.status.irq_transition = 0;
				}
			}
			this.status.irq_lock = 0;

			// OK now we're not in DMA or HDMA so cycle the processor
			this.cycle_cpu(can_do);
		}
	}

	// Called from inside do_steps() when an IRQ is to be triggered and ONLY THEN
	eval_hvirqs() {
		console.log('IRQ TRIGGERED!');
		if (this.status.irq_line) {
			this.status.irq_transition = 1;
			this.status.irq_line = 1; // ??
		}
	}

	// Run HDMA setup each frame
	eval_hdma_setup() {
		for (let n = 0; n < 8; n++) {
			this.dma.channels[n].hdma_setup();
		}
		this.status.irq_lock = 1;
	}

	// Evaluate if we should launch HDMA, and do so
	eval_hdma() {

	}

	service_CPU_cycle() {
		// Interpret CPU pins and dispatch writes or reads, also, do tracing stuff
		if (this.cpu.pins.PDV) { // Read/write. THIS ONLY WORKS FOR PDV MODE not expanded pins
			if (this.cpu.pins.RW) { // Write
				this.mem_map.dispatch_write(this.cpu_addr, this.cpu.pins.D);
				if (this.cpu.trace_on) {
					dbg.traces.add(TRACERS.WDC, this.clock.cpu_has, trace_format_write('WDC', WDC_COLOR, this.cpu.trace_cycles, this.cpu_addr & 0xFFFF, this.cpu.pins.D, this.cpu_addr >>> 16));
				}
			}
			else { // Read
				let r = this.mem_map.dispatch_read(this.cpu_addr, this.cpu.pins.D);
				if (r !== null) this.cpu.pins.D = r;
				if (this.cpu.trace_on) {
					dbg.traces.add(TRACERS.WDC, this.clock.cpu_has, trace_format_read('WDC', WDC_COLOR, this.cpu.trace_cycles, this.cpu_addr & 0xFFFF, this.cpu.pins.D, this.cpu_addr >>> 16));
				}
			}
		}
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

	cycle_cpu(howmany) {
		let steps = howmany;
		this.rescheduled = false;
		while (steps > 0) {
			this.cpu.cycle();
			this.cpu_addr = (this.cpu.pins.BA << 16) + this.cpu.pins.Addr;
			let master_cycles =this.cpu.pins.PDV ? SNES_mem_timing(this.cpu_addr, this.ROMspeed) : 6;
			this.clock.advance_steps_from_cpu(master_cycles);
			// Do timing info...
			this.service_CPU_cycle();
			steps -= master_cycles;
			if (this.rescheduled) return;
		}
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
				console.log('DMA!', this.status.dma_pending, this.status.hdma_pending);
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

