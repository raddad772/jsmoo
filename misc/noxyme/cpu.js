/*
 From JAMES. Not for production or re-use, just for testing for a friend.
 */
/*
 *
 *	CPU Common Module
 *
 */

export const dummypage = new Uint8Array(0x100).fill(0xff);

export default class Cpu {
	fActive = false;
	fSuspend = false;
	pc = 0;
	memorymap = [];
	check_interrupt = Cpu.dummy_handler;
	breakpointmap = new Int32Array(0x800);
	breakpoint = Cpu.dummy_handler;
	undef = Cpu.dummy_handler;
	undefsize = 0;
	clock = 0;
	frac = 0;
	cycle = 0;

	constructor(clock = 0) {
		for (let i = 0; i < 0x100; i++)
			this.memorymap.push({base: dummypage, read: null, write: () => {}, fetch: null});
		this.clock = clock;
	}

	set_breakpoint(addr) {
		this.breakpointmap[addr >> 5] |= 1 << (addr & 0x1f);
	}

	clear_breakpoint(addr) {
		this.breakpointmap[addr >> 5] &= ~(1 << (addr & 0x1f));
	}

	clear_all_breakpoint() {
		this.breakpointmap.fill(0);
	}

	reset() {
		console.log("CPU RESET")
		this.fActive = true;
		this.fSuspend = false;
		this.frac = 0;
		this.cycle = 0;
	}

	enable() {
		if (this.fActive)
			return;
		this.reset();
	}

	disable() {
		this.fActive = false;
	}

	suspend() {
		if (!this.fActive || this.fSuspend)
			return;
		this.fSuspend = true;
	}

	resume() {
		if (!this.fActive || !this.fSuspend)
			return;
		this.fSuspend = false;
	}

	interrupt() {
		if (!this.fActive)
			return false;
		this.resume();
		return true;
	}

	execute(rate) {
		if (!this.fActive)
			return;
		for (this.cycle += Math.floor((this.frac += this.clock) / rate), this.frac %= rate; this.cycle > 0;) {
			if (this.check_interrupt !== Cpu.dummy_handler && this.check_interrupt())
				continue;
			if (this.fSuspend)
				return void(this.cycle = 0);
			if (this.breakpoint !== Cpu.dummy_handler && this.breakpointmap[this.pc >>> 5] >> (this.pc & 31) & 1)
				this.breakpoint(this.pc);
			this._execute();
		}
	}

	execute1() {
		if (!this.fActive || this.check_interrupt && this.check_interrupt() || this.fSuspend)
			return;
		if (this.breakpoint && this.breakpointmap[this.pc >>> 5] >> (this.pc & 31) & 1)
			this.breakpoint(this.pc);
		this._execute();
	}

	_execute() {
	}

	/*fetch() {
		/*const page = this.memorymap[(this.pc >> 8)&0xff];
		const data = !page.fetch ? page.base[this.pc & 0xff] : page.fetch(this.pc & 0xff);

		this.pc = this.pc + 1 & 0xffff;
		return data;
	}*/

	/*read(addr) {
		const page = this.memorymap[(addr >> 8)&0xff];
		return !page.read ? page.base[addr & 0xff] : page.read(addr);
	}*/

	/*write(addr, data) {
		const page = this.memorymap[(addr >> 8)&0xff];
		!page.write ? void(page.base[addr & 0xff] = data) : page.write(addr, data);
	}*/

	static dummy_handler() {}
}

