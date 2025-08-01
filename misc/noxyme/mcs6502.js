/*
 From JAMES. Not for production or re-use, just for testing for a friend.
 */

/*
 *
 *	MCS6502 Emulator
 *
 */

import Cpu from './cpu.js';

export default class MCS6502 extends Cpu {
	a = 0;
	iy = 0;
	ix = 0;
	sp = 0;
	ccr = 0; // ccr:nv1bdizc

	constructor(clock) {
		super(clock);
	}

	reset() {
		super.reset();
		this.ccr |= 0x24;
		this.sp = 0xff;
		this.pc = this.read16(0xfffc);
	}

	interrupt() {
		if (!super.interrupt() || this.ccr & 4)
			return false;
		return this.cycle -= cc[0], this.push16(this.pc), this.push(this.ccr &= ~0x10), this.ccr |= 4, this.pc = this.read16(0xfffe), true;
	}

	non_maskable_interrupt() {
		if (!super.interrupt())
			return false;
		return this.cycle -= cc[0], this.push16(this.pc), this.push(this.ccr &= ~0x10), this.ccr |= 4, this.pc = this.read16(0xfffa), true;
	}

	fetch() {
		const r = this.read8(this.pc)
		this.pc = (this.pc + 1) & 0xFFFF;
		return r;
	}

	read(addr) {
		return this.read8(addr);
	}

	write(addr, val) {
		this.write8(addr, val);
	}

	_execute() {
		let ea, op = this.fetch();
		this.cycle -= cc[op];
		//console.log('TEST ',op,this.pc)
		switch (op) {
		case 0x00: // BRK
			return this.fetch(), this.push16(this.pc), this.push(this.ccr | 0x10), this.ccr |= 0x04, this.ccr &= 0xF7, void(this.pc = this.read16(0xfffe));
		case 0x01: // ORA (n,X)
			return void(this.a = this.mov8(this.a | this.read(this.read16z(this.fetch() + this.ix & 0xff))));
		case 0x05: // ORA n
			return void(this.a = this.mov8(this.a | this.read(this.fetch())));
		case 0x06: // ASL n
			return ea = this.fetch(), this.write(ea, this.asl8(this.read(ea)));
		case 0x08: // PHP
			return this.push(this.ccr | 0x30);
		case 0x09: // ORA #n
			return void(this.a = this.mov8(this.a | this.fetch()));
		case 0x0a: // ASLA
			return void(this.a = this.asl8(this.a));
		case 0x0d: // ORA nn
			return void(this.a = this.mov8(this.a | this.read(this.fetch16())));
		case 0x0e: // ASL nn
			return ea = this.fetch16(), this.write(ea, this.asl8(this.read(ea)));
		case 0x10: // BPL
			return !(this.ccr & 0x80) && (this.cycle -= 1), this.bcc(!(this.ccr & 0x80));
		case 0x11: // ORA (n),Y
			return void(this.a = this.mov8(this.a | this.read(this.read16z(this.fetch()) + this.iy & 0xffff)));
		case 0x15: // ORA n,X
			return void(this.a = this.mov8(this.a | this.read(this.fetch() + this.ix & 0xff)));
		case 0x16: // ASL n,X
			return ea = this.fetch() + this.ix & 0xff, this.write(ea, this.asl8(this.read(ea)));
		case 0x18: // CLC
			return void(this.ccr &= ~1);
		case 0x19: // ORA nn,Y
			return void(this.a = this.mov8(this.a | this.read(this.fetch16() + this.iy & 0xffff)));
		case 0x1d: // ORA nn,X
			return void(this.a = this.mov8(this.a | this.read(this.fetch16() + this.ix & 0xffff)));
		case 0x1e: // ASL nn,X
			return ea = this.fetch16() + this.ix & 0xffff, this.write(ea, this.asl8(this.read(ea)));
		case 0x20: // JSR nn
			return ea = this.fetch16(), this.push16((this.pc-1)&0xFFFF), void(this.pc = ea);
		case 0x21: // AND (n,X)
			return void(this.a = this.mov8(this.a & this.read(this.read16z(this.fetch() + this.ix & 0xff))));
		case 0x24: // BIT n
			return this.bit8(this.a, this.read(this.fetch()));
		case 0x25: // AND n
			return void(this.a = this.mov8(this.a & this.read(this.fetch())));
		case 0x26: // ROL n
			return ea = this.fetch(), this.write(ea, this.rol8(this.read(ea)));
		case 0x28: // PLP
			return void(this.ccr = (this.pull() | 0x20) & 0xEF);
		case 0x29: // AND #n
			return void(this.a = this.mov8(this.a & this.fetch()));
		case 0x2a: // ROLA
			return void(this.a = this.rol8(this.a));
		case 0x2c: // BIT nn
			return this.bit8(this.a, this.read(this.fetch16()));
		case 0x2d: // AND nn
			return void(this.a = this.mov8(this.a & this.read(this.fetch16())));
		case 0x2e: // ROL nn
			return ea = this.fetch16(), this.write(ea, this.rol8(this.read(ea)));
		case 0x30: // BMI
			return this.ccr & 0x80 && (this.cycle -= 1), this.bcc((this.ccr & 0x80) !== 0);
		case 0x31: // AND (n),Y
			return void(this.a = this.mov8(this.a & this.read(this.read16z(this.fetch()) + this.iy & 0xffff)));
		case 0x35: // AND n,X
			return void(this.a = this.mov8(this.a & this.read(this.fetch() + this.ix & 0xff)));
		case 0x36: // ROL n,X
			return ea = this.fetch() + this.ix & 0xff, this.write(ea, this.rol8(this.read(ea)));
		case 0x38: // SEC
			return void(this.ccr |= 1);
		case 0x39: // AND nn,Y
			return void(this.a = this.mov8(this.a & this.read(this.fetch16() + this.iy & 0xffff)));
		case 0x3d: // AND nn,X
			return void(this.a = this.mov8(this.a & this.read(this.fetch16() + this.ix & 0xffff)));
		case 0x3e: // ROL nn,X
			return ea = this.fetch16() + this.ix & 0xffff, this.write(ea, this.rol8(this.read(ea)));
		case 0x40: // RTI
			return this.ccr = (this.pull() & 0xEF) | 0x20, void(this.pc = this.pull16());
		case 0x41: // EOR (n,X)
			return void(this.a = this.mov8(this.a ^ this.read(this.read16z(this.fetch() + this.ix & 0xff))));
		case 0x45: // EOR n
			return void(this.a = this.mov8(this.a ^ this.read(this.fetch())));
		case 0x46: // LSR n
			return ea = this.fetch(), this.write(ea, this.lsr8(this.read(ea)));
		case 0x48: // PHA
			return this.push(this.a);
		case 0x49: // EOR #n
			return void(this.a = this.mov8(this.a ^ this.fetch()));
		case 0x4a: // LSRA
			return void(this.a = this.lsr8(this.a));
		case 0x4c: // JMP nn
			return void(this.pc = this.fetch16());
		case 0x4d: // EOR nn
			return void(this.a = this.mov8(this.a ^ this.read(this.fetch16())));
		case 0x4e: // LSR nn
			return ea = this.fetch16(), this.write(ea, this.lsr8(this.read(ea)));
		case 0x50: // BVC
			return !(this.ccr & 0x40) && (this.cycle -= 1), this.bcc(!(this.ccr & 0x40));
		case 0x51: // EOR (n),Y
			return void(this.a = this.mov8(this.a ^ this.read(this.read16z(this.fetch()) + this.iy & 0xffff)));
		case 0x55: // EOR n,X
			return void(this.a = this.mov8(this.a ^ this.read(this.fetch() + this.ix & 0xff)));
		case 0x56: // LSR n,X
			return ea = this.fetch() + this.ix & 0xff, this.write(ea, this.lsr8(this.read(ea)));
		case 0x58: // CLI
			return void(this.ccr &= ~4);
		case 0x59: // EOR nn,Y
			return void(this.a = this.mov8(this.a ^ this.read(this.fetch16() + this.iy & 0xffff)));
		case 0x5d: // EOR nn,X
			return void(this.a = this.mov8(this.a ^ this.read(this.fetch16() + this.ix & 0xffff)));
		case 0x5e: // LSR nn,X
			return ea = this.fetch16() + this.ix & 0xffff, this.write(ea, this.lsr8(this.read(ea)));
		case 0x60: // RTS
			return void(this.pc = (this.pull16()+1) & 0xFFFF);
		case 0x61: // ADC (n,X)
			return void(this.a = this.adc8(this.read(this.read16z(this.fetch() + this.ix & 0xff))));
		case 0x65: // ADC n
			return void(this.a = this.adc8(this.read(this.fetch())));
		case 0x66: // ROR n
			return ea = this.fetch(), this.write(ea, this.ror8(this.read(ea)));
		case 0x68: // PLA
			return this.a = this.pull(), this.ccr = (this.ccr & 0x7D) | (+(this.a === 0) << 1) | (this.a & 0x80);
		case 0x69: // ADC #n
			return void(this.a = this.adc8(this.fetch()));
		case 0x6a: // RORA
			return void(this.a = this.ror8(this.a));
		case 0x6c: // JMP (nn)
			return void(this.pc = this.read16(this.fetch16()));
		case 0x6d: // ADC nn
			return void(this.a = this.adc8(this.read(this.fetch16())));
		case 0x6e: // ROR nn
			return ea = this.fetch16(), this.write(ea, this.ror8(this.read(ea)));
		case 0x70: // BVS
			return this.ccr & 0x40 && (this.cycle -= 1), this.bcc((this.ccr & 0x40) !== 0);
		case 0x71: // ADC (n),Y
			return void(this.a = this.adc8(this.read(this.read16z(this.fetch()) + this.iy & 0xffff)));
		case 0x75: // ADC n,X
			return void(this.a = this.adc8(this.read(this.fetch() + this.ix & 0xff)));
		case 0x76: // ROR n,X
			return ea = this.fetch() + this.ix & 0xff, this.write(ea, this.ror8(this.read(ea)));
		case 0x78: // SEI
			return void(this.ccr |= 4);
		case 0x79: // ADC nn,Y
			return void(this.a = this.adc8(this.read(this.fetch16() + this.iy & 0xffff)));
		case 0x7d: // ADC nn,X
			return void(this.a = this.adc8(this.read(this.fetch16() + this.ix & 0xffff)));
		case 0x7e: // ROR nn,X
			return ea = this.fetch16() + this.ix & 0xffff, this.write(ea, this.ror8(this.read(ea)));
		case 0x81: // STA (n,X)
			return this.write(this.read16z(this.fetch() + this.ix & 0xff), this.a);
		case 0x84: // STY n
			return this.write(this.fetch(), this.iy);
		case 0x85: // STA n
			return this.write(this.fetch(), this.a);
		case 0x86: // STX n
			return this.write(this.fetch(), this.ix);
		case 0x88: // DEY
			return void(this.iy = this.mov8(this.iy - 1 & 0xff));
		case 0x8a: // TXA
			return void(this.a = this.mov8(this.ix));
		case 0x8c: // STY nn
			return this.write(this.fetch16(), this.iy);
		case 0x8d: // STA nn
			return this.write(this.fetch16(), this.a);
		case 0x8e: // STX nn
			return this.write(this.fetch16(), this.ix);
		case 0x90: // BCC
			return !(this.ccr & 1) && (this.cycle -= 1), this.bcc(!(this.ccr & 1));
		case 0x91: // STA (n),Y
			return this.write(this.read16z(this.fetch()) + this.iy & 0xffff, this.a);
		case 0x94: // STY n,X
			return this.write(this.fetch() + this.ix & 0xff, this.iy);
		case 0x95: // STA n,X
			return this.write(this.fetch() + this.ix & 0xff, this.a);
		case 0x96: // STX n,Y
			return this.write(this.fetch() + this.iy & 0xff, this.ix);
		case 0x98: // TYA
			return void(this.a = this.mov8(this.iy));
		case 0x99: // STA nn,Y
			return this.write(this.fetch16() + this.iy & 0xffff, this.a);
		case 0x9a: // TXS
			return void(this.sp = this.ix);
		case 0x9d: // STA nn,X
			return this.write(this.fetch16() + this.ix & 0xffff, this.a);
		case 0xa0: // LDY #n
			return void(this.iy = this.mov8(this.fetch()));
		case 0xa1: // LDA (n,X)
			return void(this.a = this.mov8(this.read(this.read16z(this.fetch() + this.ix & 0xff))));
		case 0xa2: // LDX #n
			return void(this.ix = this.mov8(this.fetch()));
		case 0xa4: // LDY n
			return void(this.iy = this.mov8(this.read(this.fetch())));
		case 0xa5: // LDA n
			return void(this.a = this.mov8(this.read(this.fetch())));
		case 0xa6: // LDX n
			return void(this.ix = this.mov8(this.read(this.fetch())));
		case 0xa8: // TAY
			return void(this.iy = this.mov8(this.a));
		case 0xa9: // LDA #n
			return void(this.a = this.mov8(this.fetch()));
		case 0xaa: // TAX
			return void(this.ix = this.mov8(this.a));
		case 0xac: // LDY nn
			return void(this.iy = this.mov8(this.read(this.fetch16())));
		case 0xad: // LDA nn
			return void(this.a = this.mov8(this.read(this.fetch16())));
		case 0xae: // LDX nn
			return void(this.ix = this.mov8(this.read(this.fetch16())));
		case 0xb0: // BCS
			return this.ccr & 1 && (this.cycle -= 1), this.bcc((this.ccr & 1) !== 0);
		case 0xb1: // LDA (n),Y
			return void(this.a = this.mov8(this.read(this.read16z(this.fetch()) + this.iy & 0xffff)));
		case 0xb4: // LDY n,X
			return void(this.iy = this.mov8(this.read(this.fetch() + this.ix & 0xff)));
		case 0xb5: // LDA n,X
			return void(this.a = this.mov8(this.read(this.fetch() + this.ix & 0xff)));
		case 0xb6: // LDX n,Y
			return void(this.ix = this.mov8(this.read(this.fetch() + this.iy & 0xff)));
		case 0xb8: // CLV
			return void(this.ccr &= ~0x40);
		case 0xb9: // LDA nn,Y
			return void(this.a = this.mov8(this.read(this.fetch16() + this.iy & 0xffff)));
		case 0xba: // TSX
			return void(this.ix = this.mov8(this.sp));
		case 0xbc: // LDY nn,X
			return void(this.iy = this.mov8(this.read(this.fetch16() + this.ix & 0xffff)));
		case 0xbd: // LDA nn,X
			return void(this.a = this.mov8(this.read(this.fetch16() + this.ix & 0xffff)));
		case 0xbe: // LDX nn,Y
			return void(this.ix = this.mov8(this.read(this.fetch16() + this.iy & 0xffff)));
		case 0xc0: // CPY #n
			return this.cmp8(this.iy, this.fetch());
		case 0xc1: // CMP (n,X)
			return this.cmp8(this.a, this.read(this.read16z(this.fetch() + this.ix & 0xff)));
		case 0xc4: // CPY n
			return this.cmp8(this.iy, this.read(this.fetch()));
		case 0xc5: // CMP n
			return this.cmp8(this.a, this.read(this.fetch()));
		case 0xc6: // DEC n
			return ea = this.fetch(), this.write(ea, this.mov8(this.read(ea) - 1 & 0xff));
		case 0xc8: // INY
			return void(this.iy = this.mov8(this.iy + 1 & 0xff));
		case 0xc9: // CMP #n
			return this.cmp8(this.a, this.fetch());
		case 0xca: // DEX
			return void(this.ix = this.mov8(this.ix - 1 & 0xff));
		case 0xcc: // CPY nn
			return this.cmp8(this.iy, this.read(this.fetch16()));
		case 0xcd: // CMP nn
			return this.cmp8(this.a, this.read(this.fetch16()));
		case 0xce: // DEC nn
			return ea = this.fetch16(), this.write(ea, this.mov8(this.read(ea) - 1 & 0xff));
		case 0xd0: // BNE
			return !(this.ccr & 2) && (this.cycle -= 1), this.bcc(!(this.ccr & 2));
		case 0xd1: // CMP (n),Y
			return this.cmp8(this.a, this.read(this.read16z(this.fetch()) + this.iy & 0xffff));
		case 0xd5: // CMP n,X
			return this.cmp8(this.a, this.read(this.fetch() + this.ix & 0xff));
		case 0xd6: // DEC n,X
			return ea = this.fetch() + this.ix & 0xff, this.write(ea, this.mov8(this.read(ea) - 1 & 0xff));
		case 0xd8: // CLD
			return void(this.ccr &= ~8);
		case 0xd9: // CMP nn,Y
			return this.cmp8(this.a, this.read(this.fetch16() + this.iy & 0xffff));
		case 0xdd: // CMP nn,X
			return this.cmp8(this.a, this.read(this.fetch16() + this.ix & 0xffff));
		case 0xde: // DEC nn,X
			return ea = this.fetch16() + this.ix & 0xffff, this.write(ea, this.mov8(this.read(ea) - 1 & 0xff));
		case 0xe0: // CPX #n
			return this.cmp8(this.ix, this.fetch());
		case 0xe1: // SBC (n,X)
			return void(this.a = this.sbc8(this.read(this.read16z(this.fetch() + this.ix & 0xff))));
		case 0xe4: // CPX n
			return this.cmp8(this.ix, this.read(this.fetch()));
		case 0xe5: // SBC n
			return void(this.a = this.sbc8(this.read(this.fetch())));
		case 0xe6: // INC n
			return ea = this.fetch(), this.write(ea, this.mov8(this.read(ea) + 1 & 0xff));
		case 0xe8: // INX
			return void(this.ix = this.mov8(this.ix + 1 & 0xff));
		case 0xe9: // SBC #n
			return void(this.a = this.sbc8(this.fetch()));
		case 0xea: // NOP
			return;
		case 0xec: // CPX nn
			return this.cmp8(this.ix, this.read(this.fetch16()));
		case 0xed: // SBC nn
			return void(this.a = this.sbc8(this.read(this.fetch16())));
		case 0xee: // INC nn
			return ea = this.fetch16(), this.write(ea, this.mov8(this.read(ea) + 1 & 0xff));
		case 0xf0: // BEQ
			return this.ccr & 2 && (this.cycle -= 1), this.bcc((this.ccr & 2) !== 0);
		case 0xf1: // SBC (n),Y
			return void(this.a = this.sbc8(this.read(this.read16z(this.fetch()) + this.iy & 0xffff)));
		case 0xf5: // SBC n,X
			return void(this.a = this.sbc8(this.read(this.fetch() + this.ix & 0xff)));
		case 0xf6: // INC n,X
			return ea = this.fetch() + this.ix & 0xff, this.write(ea, this.mov8(this.read(ea) + 1 & 0xff));
		case 0xf8: // SED
			return void(this.ccr |= 8);
		case 0xf9: // SBC nn,Y
			return void(this.a = this.sbc8(this.read(this.fetch16() + this.iy & 0xffff)));
		case 0xfd: // SBC nn,X
			return void(this.a = this.sbc8(this.read(this.fetch16() + this.ix & 0xffff)));
		case 0xfe: // INC nn,X
			return ea = this.fetch16() + this.ix & 0xffff, this.write(ea, this.mov8(this.read(ea) + 1 & 0xff));
		default:
			this.undefsize = 1;
			this.undef();
			return;
		}
	}

	mov8(src) {
		return this.ccr = this.ccr & ~0x82 | src & 0x80 | !src << 1, src;
	}

	asl8(dst) {
		const r = dst << 1 & 0xff, c = dst >> 7;
		return this.ccr = this.ccr & ~0x83 | r & 0x80 | !r << 1 | c, r;
	}

	bit8(dst, src) {
		const r = dst & src;
		this.ccr = this.ccr & ~0xc2 | src & 0xc0 | !r << 1;
	}

	rol8(dst) {
		const r = dst << 1 & 0xff | this.ccr & 1, c = dst >> 7;
		return this.ccr = this.ccr & ~0x83 | r & 0x80 | !r << 1 | c, r;
	}

	lsr8(dst) {
		const r = dst >> 1, c = dst & 1;
		return this.ccr = this.ccr & ~0x83 | !r << 1 | c, r;
	}

	adc8(src) {
		let o;
		let cf = this.ccr & 1;
		let v;
		if (this.ccr & 8) {
			o = (this.a & 0x0F) + (src & 0x0F) + cf;
			if (o > 9) o += 6;
			cf = +(o > 0x0F)
			o = (this.a & 0xF0) + (src & 0xF0) + (cf << 4) + (o & 0x0F)
			v = +(o>0x7F);
			if (o > 0x9F) o += 0x60;
			cf = +(o > 0x99);
			// Note: V may not strictly be correctly calculated,
			// but is technically meaningless in 6502
		} else {
			o =  this.a + src + cf;
			v = ((this.a ^ src ^ 0xFF) & (this.a ^ o) & 0x80) >>> 7;
			cf = (o & 0x100) >>> 8;
		}

		this.ccr = (this.ccr & ~0xc3) | o & 0x80 | (v << 6) | +(!(o & 0xFF)) << 1 | cf, o;
		return o & 0xFF;
	}

	ror8(dst) {
		const r = dst >> 1 | this.ccr << 7 & 0x80, c = dst & 1;
		return this.ccr = this.ccr & ~0x83 | r & 0x80 | !r << 1 | c, r;
	}

	cmp8(dst, src) {
		const r = dst - src & 0xff, c = dst & ~src | ~src & ~r | ~r & dst;
		this.ccr = this.ccr & ~0x83 | r & 0x80 | !r << 1 | c >> 7 & 1;
	}

	sbc8(i) {
		i ^= 0xFF;
		let o;
		let cf = this.ccr & 1;
		let v = (this.ccr >>> 6) & 1;
		if (this.ccr & 8) {
			o = (this.a & 0x0F) + (i & 0x0F) + (this.ccr & 1);
			if (o <= 0x0F) o -= 0x06;
			cf = +(o > 0x0F);
			o = (this.a & 0xF0) + (i & 0xF0) + (cf << 4) + (o & 0x0F);
			if (o <= 0xFF) o -= 0x60;
		}
		else {
			o = this.a + i + cf;
			v = ((this.a ^ i ^ 0x1FF) & (this.a ^ o) & 0x80) >>> 7;
		}
		cf = (o & 0x1FF) >>> 8;
		this.ccr = (this.ccr & ~0xc3) | (o & 0x80) | (v << 6) | +(!(o & 0xFF)) << 1 | cf;
		return o & 0xFF;
	}

	bcc(cond) {
		const d = this.fetch();
		if (cond) this.pc = this.pc + d - (d << 1 & 0x100) & 0xffff;
	}

	push(r) {
		this.write(this.sp | 0x100, r & 0xFF), this.sp = this.sp - 1 & 0xff;
	}

	pull() {
		this.sp = (this.sp + 1) & 0xff
		return this.read(this.sp | 0x100);
	}

	push16(r) {
		this.push(r >> 8), this.push(r & 0xff);
	}

	pull16() {
		const r = this.pull();
		return r | this.pull() << 8;
	}

	fetch16() {
		const data = this.fetch();
		return data | this.fetch() << 8;
	}

	read16(addr) {
		const data = this.read(addr);
		return data | this.read(addr + 1 & 0xffff) << 8;
	}

	read16z(addr) {
		const data = this.read(addr);
		return data | this.read(addr + 1 & 0xff) << 8;
	}
}

const cc = Uint8Array.of(
	 7, 6, 0, 8, 3, 3, 5, 5, 3, 2, 2, 2, 4, 4, 6, 6,
	 2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	 6, 6, 0, 8, 3, 3, 5, 5, 4, 2, 2, 2, 4, 4, 6, 6,
	 2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	 6, 6, 0, 8, 3, 3, 5, 5, 3, 2, 2, 2, 3, 4, 6, 6,
	 2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	 6, 6, 0, 8, 3, 3, 5, 5, 4, 2, 2, 2, 5, 4, 6, 6,
	 2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	 2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4,
	 2, 6, 0, 6, 4, 4, 4, 4, 2, 5, 2, 5, 5, 5, 5, 5,
	 2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4,
	 2, 5, 0, 5, 4, 4, 4, 4, 2, 4, 2, 4, 4, 4, 4, 4,
	 2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6,
	 2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	 2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6,
	 2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7);

