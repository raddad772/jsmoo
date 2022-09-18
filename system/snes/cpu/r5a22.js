"use scrict";
/*
Ricoh 5A22, i.e., the CPU at the heart of the SNES.
It includes:
 * WDC 65816 CPU, which is paused for DMA & WRAM refresh, and whose two-phase clock is stretched to 3/3, 3/5,or 3/9 master cycles depending on memory access
 * DMA/HDMA controllers which take 8 master cycles per transfer (+overhead on activation),
 * DRAM refresh circuitry,
 * IRQ timers,
 * an 8x8=16 multiplier and 16/8=8,8 dividing ALU
 * 2 busses, A (24x8-bit normal bus) and B (8x8-bit peripheral bus accessed by read/write of certain memory addresses)
 */


/*
*/

/**
 * @param {Number} addr
 * @param {Number} ROMspeed
 * @returns {number}
 * @constructor
 */
function SNES_mem_timing(addr, ROMspeed) {
	// Taken from a byuu post on a forum, thanks byuu!
	// Determine CPU cycle length in master clocks based on address currently in use (speed is 6 if no address being read/written)

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

/*
 So...
  A 5A22 is basically a state machine that can be in 1 of 3 states,
 in these priorities:

 1. Do nothing during DRAM refresh for 40 master clocks
 2. Execute HDMA for 8 master clocks per byte
 3. Execute DMA (this is completely halted by HDMA) for 8 master clocks per byte
 4. Execute CPU cycle, IRQ/NMI poll, ALU cycle for 6-12 master clocks

  Furthermore, we want to be able to step in and out in arbitrary number
 of master clock cycles.
  SNES timing is based around a scanline. At the start of a scanline,
 things are latched (locked into stone):
   1) where HDMA setup will trigger
   2) where HDMA will trigger

*/

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

class SNES_controllerport {
	constructor() {
		this.device = null;
		this.mdata = 0;
	}

	data() {
		if (this.device) return this.device.data() & 3;
		return 0;
	}

	latch(what) {
		if (this.device) return this.device.latch(what);
	}
}

// Since this only exists in a SNES, it is not generic, but includes a lot of SNES emulation-specific logic.
class ricoh5A22 {
	/**
	 * @param {*} version
	 * @param {snes_memmap} mem_map
	 * @param {SNES_clock} clock
	 */
	constructor(version, mem_map, clock) {
		this.cpu = new wdc65816_t(clock);
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

		this.event_ptrs = {
			[R5A22_events.HDMA]: null,
			[R5A22_events.HDMA_SETUP]: null,
			[R5A22_events.IRQ]: null,
			[R5A22_events.WRAM_REFRESH]: null,
			[R5A22_events.SCANLINE_START]: null
		}

		this.current_event = 0;
		this.next_event = 0;
		this.current_mode = RMODES.CPU;

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
			auto_joypad_counter: 33,
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
			pio: 0,

			wrmpya: 0xFF,   // $4202
			wrmpyb: 0xFF,   // $4203
			wrdiva: 0xFFFF, // $4204-4205
			wrdivb: 0xFF,   // $4026

			rddiv: 0, // $4214-4215
			rdmpy: 0, // $4216-4217

			hcounter: 0,
			vcounter: 0,

			htime: 0x1FF, // HIRQ time
			vtime: 0x1FF, // VIRQ time

			joy1: 0,
			joy2: 0,
			joy3: 0,
			joy4: 0,
		};

		this.latch = {
			counters: 0,
		}

		this.alu = {
			mpyctr: 0,
			divctr: 0,
			shift: 0
		};

		this.controller_port1 = new SNES_controllerport(1);
		this.controller_port2 = new SNES_controllerport(2);

		this.joypad1 = new SNES_joypad(1);
		this.joypad2 = new SNES_joypad(2);
		this.controller_port1.device = this.joypad1;
		this.controller_port2.device = this.joypad2;
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

	read_nmi(has_effect=true) {
		//let r = this.status.nmi_line;
		let r = this.cpu.pins.NMI;
		/*if (!this.status.nmi_hold && has_effect) {
			console.log('READ NMI CLEAR', this.status.nmi_line, this.status.nmi_transition);
			this.status.nmi_line = 0;
		}*/
		if (has_effect)
			this.cpu.pins.NMI = 0;
		return r;
	}

	read_irq(has_effect=true) {
		let r = this.status.irq_line;
		if (!this.status.irq_hold && has_effect) {
			this.status.irq_line = 0;
			this.status.irq_transition = 0;
		}
		return r;
	}

	latch_ppu_counters() {
		this.io.vcounter = this.clock.scanline.ppu_y;
		this.io.hcounter = Math.floor(this.clock.cycles_since_scanline_start / 4);
		this.latch.counters = 1;
	}

	reg_read(addr, val=0, has_effect=true) { // Val is for open bus
		//console.log('5A22 read', hex0x4(addr));
		//if ((addr & 0x4300) === 0x4300) { return this.dma.reg_read(addr, val, has_effect); }
		if ((addr >= 0x4300) && (addr <= 0x43FF)) { return this.dma.reg_read(addr, val, has_effect); }
		switch(addr) {
			case 0x4016: // URGH
				return this.controller_port1.data();
			case 0x4017:
				return this.controller_port2.data();
			case 0x4210: // NMI read
				val &= 0x70;
				val |= this.read_nmi(has_effect) << 7;
				val |= (this.version.rev);
				return val;
			case 0x4211: // IRQ read
				val &= 0x7F;
				val |= this.read_irq(has_effect) << 7;
				return val;
			case 0x4212: // HVBJOY
				val = +(this.io.auto_joypad_poll && this.status.auto_joypad_counter < 33);
				// hblank
				let hdot = Math.floor(this.clock.cycles_since_scanline_start / 4);
				val |= ((hdot === 0) || (hdot >= 256)) ? 0x40 : 0;
				val |= this.clock.scanline.vblank ? 0x80 : 0;
				//console.log('4212', hex2(val));
				return val;
			case 0x4213: // JOYSER1
				return this.io.pio;
			case 0x4214: // Hardware multiplier stuff
				return this.io.rddiv & 0xFF;
			case 0x4215:
				return (this.io.rddiv >>> 8) & 0xFF;
			case 0x4216:
				return this.io.rdmpy & 0xFF;
			case 0x4217:
				return (this.io.rdmpy >>> 8) & 0xFF;
			case 0x4218:
				return this.io.joy1 & 0xFF;
			case 0x4219:
				return ((this.io.joy1) >>> 8) & 0xFF;
			case 0x421A:
				return this.io.joy2 & 0xFF;
			case 0x421B:
				return ((this.io.joy2) >>> 8) & 0xFF;
			case 0x421C:
				return this.io.joy3 & 0xFF;
			case 0x421D:
				return ((this.io.joy3) >>> 8) & 0xFF;
			case 0x421E:
				return this.io.joy4 & 0xFF;
			case 0x421F:
				return ((this.io.joy4) >>> 8) & 0xFF;
			default:
				console.log('UNIMPLEMENTED CPU READ', hex4(addr), hex2(val));
				break;
		}
		return val;
	}

	set_nmi_enabled(newval) {
		let onmi = this.io.nmi_enable;
		this.io.nmi_enable = newval;

		if ((!onmi && this.io.nmi_enable) && this.status.nmi_line) {
			//console.log('SET NMI TRANSITION IF NMI WENT FROMO FF TO ON AND NMI LINE 1');
			this.status.nmi_transition = 1;
		}
	}

	reg_write(addr, val) {
		//console.log('5A22 write', hex0x4(addr), hex0x2(val));
		//if ((addr & 0x4300) === 0x4300) { this.dma.reg_write(addr, val); return; }
		if ((addr >= 0x4300) && (addr <= 0x43FF)) { this.dma.reg_write(addr, val); return; }
		switch(addr) {
			case 0x4016: // JOYSER0
				this.controller_port1.latch(0);
				this.controller_port2.latch(0);
				break;
			case 0x4200: // NMI timing
				this.io.auto_joypad_poll = val & 1;
				if (!this.io.auto_joypad_poll) this.status.auto_joypad_counter = 33; // 33 is disable
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
				this.set_nmi_enabled((val & 0x80) >>> 7);

				//console.log('Reschedule scanline due to write of ', hex2(val), ' at ', this.clock.scanline.ppu_y);
				this.reschedule_scanline_irqbits();
				this.status.irq_lock = 1;
				return;
			case 0x4201: // WRIO, a weird one
				if ((!(this.io.pio & 0x80)) && !(val & 0x80)) this.latch_ppu_counters();
				this.io.pio = val;
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
				//this.io.htime = (((((this.io.htime >>> 2) - 1) & 0x100) | val) + 1) << 2;
				this.io.htime = (this.io.htime >>> 2) - 1;
				this.io.htime = (this.io.htime & 0x100) | val;
				this.io.htime = (this.io.htime + 1) << 2;
				return;
			case 0x4208: // HTIME hi
				this.io.htime = (this.io.htime >>> 2) - 1;
				this.io.htime = (this.io.htime & 0xFF) | ((val & 1) << 8);
				this.io.htime = (this.io.htime + 1) << 2;
				return;
			case 0x4209: // VTIME lo
				this.io.vtime = (this.io.vtime & 0x100) | val;
				return;
			case 0x420A: // VTIME hi
				this.io.vtime = (this.io.vtime & 0xFF) | ((val & 1) << 8);
				return;
			case 0x420B: // DMA enables
				//console.log('DMA ENABLE', hex2(val));
				for (let n = 0; n < 8; n++) {
					//console.log('CHANNEL ', n, (val >>> n) & 1);
					this.dma.channels[n].dma_enable = (val >>> n) & 1;
				}
				if ((dbg.log_DMAs) && (val !== 0))
				{
					for (let n = 0; n < 8; n++) {
						if ((val >>> n) & 1) {
							let nle = new SNES_DMA_log_entry_t();
							let chan = this.dma.channels[n];
							nle.frame = this.clock.frames_since_restart;
							nle.ppu_y = this.clock.scanline.ppu_y;
							nle.channel = n;
							nle.master_clock = this.clock.cycles_since_reset;

							nle.A_addr = hex6((chan.source_bank << 16) | (chan.source_address));
							nle.B_addr = hex2(chan.target_address);
							nle.bytes = chan.transfer_size;
							nle.fixed_transfer = chan.fixed_transfer;
							nle.transfer_mode = chan.transfer_mode;
							dbg.DMA_logs.push(nle);
						}
					}
				}
				if (val !== 0) {
					//console.log('DMA AT FRAME ', this.clock.frames_since_restart, ' SCANLINE', this.clock.scanline.ppu_y, hex2(val));
					//console.log('DMA INFO', this.dma.channels[1]);
					this.status.dma_pending = true;
					this.rescheduled = true;
				}
				return;
			case 0x420C: // HDMA enables
				for (let n = 0; n < 8; n++) {
					this.dma.channels[n].hdma_enable = (val >>> n) & 1;
				}
				//if (val !== 0) console.log('HDMA CHANNEL WRITE', val, this.dma.channels[7]);
				return;
			case 0x420D: // Cycle speed of ROM
				this.ROMspeed = (val & 1) ? 6 : 8;
				return;
			default:
				console.log('UNIMPLEMENTED CPU WRITE', hex4(addr), hex2(val));
				break;
		}
	}

	alu_cycle(num=1) {
		if (!this.alu.mpyctr  && !this.alu.divctr) return;
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
		//this.cpu.pins.RES = 1;
		this.cpu.pins.TCU = 0;
		this.cpu.pins.D = WDC_OP_RESET;
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
		//console.log('scanline reschedule due to IRQ bit write...')
		let e = null;
		let old_irq_time = -1;
		let old_irq_event = -1;
		let new_irq_time = -1;
		let scanline = this.clock.scanline;
		if (this.event_ptrs[R5A22_events.IRQ] !== null) {
			for (let i in this.events_list) {
				if (this.events_list[i][1] === R5A22_events.IRQ) {
					old_irq_time = this.events_list[i][0];
					old_irq_event = i;
					break;
				}
			}
		}
		if (this.io.hirq_enable && (!this.io.virq_enable || (this.io.virq_enable && this.io.vtime === scanline.ppu_y))) {
			new_irq_time = 0 ? 10 : 14 + this.io.htime;
			e = [this.io.htime === new_irq_time, R5A22_events.IRQ, false];
			this.event_ptrs[R5A22_events.IRQ] = e;
		}
		else if (!this.io.hirq_enable && (this.io.virq_enable && this.io.vtime === this.clock.scanline.ppu_y)) {
			new_irq_time = 10;
			e = [new_irq_time, R5A22_events.IRQ, false];
			this.event_ptrs[R5A22_events.IRQ] = e;
		}
		// Check different permutations of rescheduling

		// Don't reschedule if it hasn't changed
		if (old_irq_time === new_irq_time) return;
		// Don't reschedule if new time is after current scanline position 'cuz it won't trigger
		if (this.clock.cycles_since_scanline_start > new_irq_time && old_irq_time < this.clock.cycles_since_scanline_start) return;
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
			if (this.events_list[i][0] > this.clock.cycles_since_scanline_start)
				break;
			oldi = i;
		}
		this.current_event = oldi;
		//this.current_event = 0;
		// Set when next event will be
		this.next_event = this.event_ptrs[this.current_event][0];
		//console.log('NEW EVENTS LIST', this.current_event, this.next_event, this.events_list);
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
			//console.log('WE HAVE ONE HERE', scanline.ppu_y);
			e = [scanline.hdma_position, R5A22_events.HDMA, false];
			this.event_ptrs[R5A22_events.HDMA] = e;
			this.events_list.push(e);
		}

		// Check for HIRQ, HVIRQ
		if (this.io.hirq_enable && (!this.io.virq_enable || (this.io.virq_enable && this.io.vtime === scanline.ppu_y))) {
			e = [this.io.htime === 0 ? 10 : 14 + this.io.htime, R5A22_events.IRQ, false];
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
		this.next_event = this.events_list[this.current_event][0];
		//console.log(this.events_list);
		//console.log('NEXT EVENT', this.current_event, this.next_event);
		//console.log('EVENT LIST', this.events_list);
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
		if (this.clock.cpu_deficit > 1364) {
			debugger;
		}
		//console.log('CPU DEFICIT', this.clock.cpu_deficit, this.clock.cycles_since_scanline_start, this.next_event);
		this.clock.cpu_deficit += howmany;

		// Check if we're in WRAM refresh, in which case, nothing other than an IRQ timer check will happen
		if (this.mode === RMODES.WRAM_REFRESH) {
			let can_do = this.clock.cpu_deficit > this.mode_left ? this.mode_left : this.clock.cpu_deficit;
			if (this.mode === this.old_mode)
				debugger;
			if (this.mode_left < 1) {
				this.mode = this.old_mode;
			}
			else {
				if (can_do < 1) debugger;
				this.mode = RMODES.WRAM_REFRESH;
				if (can_do < this.mode_left) {
					this.mode_left = can_do < this.clock.cpu_deficit ? this.clock.cpu_deficit : 0;
				}
				this.clock.advance_steps_from_cpu(can_do);
				if (this.clock.cpu_deficit > 0)
					this.mode = this.old_mode;
				else
					return;
			}
		}
		let scanline = this.clock.scanline;
		while(this.clock.cpu_deficit > 0) {
			// Check if we tripped a new-scanline scheduling
			//debugger;
			if (scanline.cpu_new_scanline) {
				scanline.cpu_new_scanline = false;
				this.schedule_scanline();
				if (scanline.ppu_y === 0) {
					this.status.nmi_transition = +(this.status.nmi_line !== 0);
					this.status.nmi_line = 0;
					if (this.io.nmi_enable)
						this.cpu.pins.NMI = 0;
					//console.log('VB END', this.status.nmi_line, this.status.nmi_transition);
				}
				if (scanline.vblank_start) {
					this.status.nmi_transition = +(this.status.nmi_line === 0);
					if (this.io.nmi_enable)
						this.cpu.pins.NMI = 1;
					this.status.nmi_line = 1;
					//console.log('VB START', this.status.nmi_line, this.status.nmi_transition);
				}
			}

			this.clock.dma_counter = 0;
			// Check if we need to process an event
			if (this.clock.cycles_since_scanline_start >= this.next_event) {
				let ev = this.events_list[this.current_event];
				//console.log(this.clock.scanline.ppu_y, 'EVENT HIT', ev, this.clock.cycles_since_scanline_start)
				let already_true = ev[2];
				ev[2] = true;
				this.current_event++;
				this.next_event = this.current_event >= this.events_list.length ? this.clock.scanline.cycles : this.events_list[this.current_event][0];
				//console.log('ENXT EVENT:', this.next_event);
				if (already_true) continue; // Somehow already got processed
				switch(ev[1]) {
					case R5A22_events.SCANLINE_START:
						break;
					case R5A22_events.IRQ:
						//console.log('IRQ HIT', this.clock.scanline.ppu_y, this.clock.cycles_since_scanline_start, this.io.htime, 'WDC_VT', this.io.vtime, this.io.hirq_enable, this.io.virq_enable, ev[0]);
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
						//console.log('HDMA hit');
						if (this.hdma_is_enabled()) {
							//console.log('HDMA PEND SET');
							this.status.hdma_pending = true;
						}
						break;
					case R5A22_events.WRAM_REFRESH:
						let can_do = this.clock.cpu_deficit > 40 ? 40 : this.clock.cpu_deficit;
						if (can_do < 1) debugger;
						if (can_do < 40) {
							this.mode_left = can_do < 40 ? 40 - can_do : 0;
/*							if (this.mode === 3) {
								debugger; // WRAM refresh in middle of WRAM refresh!?
							}*/
							//console.log('WRAM REFRESH SPLIT');
							this.old_mode = this.mode;
							this.mode = RMODES.WRAM_REFRESH;
						}
						this.clock.advance_steps_from_cpu(can_do);
						if (can_do < 40) {
							//console.log('WRAM REFRESH RETURN');
							return;
						}
						break;
				}
				if (dbg.do_break) return;
				continue;
			}

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
					// NEVERMIND this is per-channel
					//this.status.dma_running = false;
					//this.status.dma_pending = false;
				}

				this.status.hdma_pending = false;
				this.dma.hdma_run();
				this.clock.advance_steps_from_cpu(this.clock.dma_counter);
				//console.log('after HDMA run, cycle is at ' + this.clock.cycles_since_scanline_start + ' of ' + this.clock.scanline.cycles + ' after running ' + this.clock.dma_counter + ' cycles.');
				this.clock.dma_counter = 0;
				//console.log('HDMA FINISHED!');
				if (dbg.do_break) return;
				continue;
			}

			// Run DMA for any available cycles
			let maxe = this.next_event > this.clock.scanline.cycles ? this.clock.scanline.cycles : this.next_event;
			maxe -= this.clock.cycles_since_scanline_start;
			if (typeof maxe === 'undefined')
				debugger;
			//let can_do = (maxe - this.clock.cycles_since_scanline_start);
			let can_do = this.clock.cpu_deficit > maxe ? maxe : this.clock.cpu_deficit;
			if (can_do < 1) debugger;
			//debugger;
			if (this.status.dma_pending || this.status.dma_running) {
				// run DMA for X cycles
				//console.log('DMA!');
				this.clock.dma_counter = 0;
				if (this.status.dma_pending) {
					this.clock.dma_counter += 8;
					this.status.dma_pending = false;
					if (!this.status.dma_running) this.dma.dma_start();
					this.status.dma_running = true;
				}
				let rt = this.dma.dma_run(can_do);
				let anyleft = rt[0];
				let anyactive = rt[1];
				this.clock.advance_steps_from_cpu(this.clock.dma_counter)
				// Leftover cycles mean DMA is no longer running
				if (!anyactive) {
					this.status.dma_running = false;
				}
				this.clock.dma_counter = 0;
				if (dbg.do_break) return;
				continue;
			}

			// Now that we're out of all the HDMA and DMA junk,
			//  we can set our lines...

			// OK now we're not in DMA or HDMA so cycle the processor
			if (!this.status.irq_lock) {
				/*if (this.status.nmi_transition && this.io.nmi_enable) {
					this.status.nmi_transition = 0;*/
				//this.cpu.pins.NMI = this.status.nmi_line;
				//console.log('SETTING CPU PIN NMI TO', this.status.nmi_line, this.status.nmi_transition);
				//}
				if (this.status.irq_transition && this.io.irq_enable) {
					this.cpu.pins.IRQ = this.status.irq_line;
					this.status.irq_transition = 0;
				}
			}
			//console.log('RUNNING CPU FOR', can_do, 'CYCLES. CURRENT', this.clock.cycles_since_scanline_start, ' AND NEXT EVENT IS', this.next_event);
			this.cycle_cpu(can_do);
			if (dbg.do_break) return;
		}
	}

	// Called from inside run_cycles() when an IRQ is to be triggered and ONLY THEN
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
					dbg.traces.add(TRACERS.WDC, this.clock.cpu_has, trace_format_write('WDC', WDC_COLOR, this.clock.cpu_has, this.cpu_addr & 0xFFFF, this.cpu.pins.D, this.cpu_addr >>> 16));
				}
			}
			else { // Read
				let r = this.mem_map.dispatch_read(this.cpu_addr, this.cpu.pins.D);
				if (r !== null) this.cpu.pins.D = r;
				if (this.cpu.trace_on) {
					dbg.traces.add(TRACERS.WDC, this.clock.cpu_has, trace_format_read('WDC', WDC_COLOR, this.clock.cpu_has, this.cpu_addr & 0xFFFF, this.cpu.pins.D, this.cpu_addr >>> 16));
				}
			}
		}
		/*if (dbg.watch_on) {
			if (dbg.watch.evaluate()) {
				dbg.break();
				console.log('BREAK FOR WATCHPOINT')
			}
		}*/
		this.alu_cycle(1);
	}

	auto_joypad_edge() {
		//console.log('JOYPAD EDGE', this.io.auto_joypad_poll);
		if (!this.io.auto_joypad_poll) return;
		let hcounter = Math.floor(this.clock.cycles_since_scanline_start / 4);
		if ((this.clock.scanline.ppu_y === this.clock.scanline.bottom_scanline) && (hcounter >= 130) && (hcounter <= 256)) {
			// Begin new polling sequence at bottom scanline near right edge I guess
			this.status.auto_joypad_counter = 0;
		}
		if (this.status.auto_joypad_counter >= 33) return;

		if (this.status.auto_joypad_counter === 0) {
			// latch controller states on the first polling cycle
			this.controller_port1.latch(1);
			this.controller_port2.latch(1);
		}

		if (this.status.auto_joypad_counter === 1) {
			// Release latch and begin reading on the second cycle
			this.controller_port1.latch(0);
			this.controller_port2.latch(0);

			this.io.joy1 = this.io.joy2 = this.io.joy3 = this.io.joy4 = 0;
		}

		if (this.status.auto_joypad_counter >= 2 && (!(this.status.auto_joypad_counter & 1))) {
			// sixteen bits are shifted into joy(1-4), 1 bit per 256 clocks
			let p0 = this.controller_port1.data();
			let p1 = this.controller_port2.data();

			this.io.joy1 = ((this.io.joy1 << 1) | (p0 & 1)) & 0xFFFF;
			this.io.joy2 = ((this.io.joy2 << 1) | (p1 & 1)) & 0xFFFF;
			this.io.joy3 = ((this.io.joy3 << 1) | ((p0 >>> 1) & 1)) & 0xFFFF;
			this.io.joy4 = ((this.io.joy4 << 1) | ((p1 >>> 1) & 1)) & 0xFFFF;
		}
		this.status.auto_joypad_counter++;
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
			this.status.irq_lock = 0;
			this.cpu.cycle();
			if (typeof(this.cpu.pins.D) === 'undefined') {
				console.log(this.cpu);
				dbg.break();
				return;
			}
			this.cpu_addr = (this.cpu.pins.BA << 16) + this.cpu.pins.Addr;
			let master_cycles = this.cpu.pins.PDV ? SNES_mem_timing(this.cpu_addr, this.ROMspeed) : 6;
			this.clock.advance_steps_from_cpu(master_cycles);
			// Do timing info...
			this.service_CPU_cycle();
			steps -= master_cycles;
			if (this.rescheduled) return;
			if (dbg.do_break) return;
		}
	}
}

