"use strict";


const M6502_BOOTUP = M6502_MN.RESET;

class M6502_disassembly_output {
    constructor() {
        this.data8 = null;
        this.mnemonic = 'UKN ###';
        this.disassembled = 'UKN ###';
    }
}

// P status register
class m6502_P {
    constructor() {
        this.C = 0;
        this.Z = 0;
        this.I = 0;
        this.D = 0;
        this.B = 0;
        this.V = 0;
        this.N = 0;
    }

    formatbyte() {
		let outstr = '';
		outstr += this.N ? 'N' : 'n';
		outstr += this.V ? 'V-' : 'v-';
		outstr += this.B ? 'B' : 'b';
		outstr += this.D ? 'D' : 'd';
		outstr += this.I ? 'I' : 'i';
		outstr += this.Z ? 'Z' : 'z';
		outstr += this.C ? 'C' : 'c';
		return outstr;
    }

    getbyte() {
        return this.C | (this.Z << 1) | (this.I << 2) | (this.D << 3) | (this.B << 4) | 0x20 | (this.V << 6) | (this.N << 7) | 0x20;
    }

    setbyte(val) {
        this.C = val & 1;
        this.Z = (val & 0x02) >>> 1;
        this.I = (val & 0x04) >>> 2;
        this.D = (val & 0x08) >>> 3;
        this.B = 1; // Confirmed via Visual6502
        this.V = (val & 0x40) >>> 6;
        this.N = (val & 0x80) >>> 7;
    }

    serialize() {
        return this.getbyte();
    }

    deserialize(from) {
        this.setbyte(from);
        return true;
    }
}

const SER_6502_REG = ['TCU', 'IR', 'TA', 'TR', 'skipped_cycle', 'HLT', 'A', 'X', 'Y', 'P', 'PC', 'S', 'IRQ_pending', 'NMI_pending', 'old_I', 'STP', 'WAIT'];
// register file
class m6502_registers_t {
    constructor() {
        // Control internal cycle states
        this.TCU = 0; // Timing Control Unit
        this.IR = 0; // Instruction Regiser
        this.TA = 0;
        this.TR = 0;
        this.skipped_cycle = false;
        this.HLT = 0;

        this.A = 0;
        this.X = 0;
        this.Y = 0;
        this.PC = 0;
        this.S = 0;
        this.P = new m6502_P();

        this.IRQ_pending = false;
        this.NMI_pending = false;
        this.old_I = 0; // for tracking interrupt

        // For 65C02, STP and WAI
        this.STP = false;
        this.WAI = false;
    }

    serialize() {
        let o = {
            version: 1,
        }
        serialization_helper(o, this, SER_6502_REG);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('Wrong m6502 version!');
            return false;
        }
        return deserialization_helper(this, from, SER_6502_REG);
    }
}

const SER_6502_PIN = ['Addr', 'D', 'RW', 'IRQ', 'NMI', 'RST'];
class m6502_pins_t {
    constructor() {
        // NOT a lot of pins to care about
        this.Addr = 0; // Address
        this.D = 0; // Data
        this.RW = 0; // Read/write

        this.IRQ = 0;
        this.NMI = 0;
        this.RST = 0;
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_6502_PIN);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG M6502 PIN VER');
            return false;
        }
        return deserialization_helper(this, from, SER_6502_PIN);
    }
}

const SER_6502 = ['PCO', 'NMI_old', 'NMI_ack', 'IRQ_ack', 'IRQ_count', 'first_reset', 'pins', 'regs']
class m6502_t {
    /**
     * @param opcode_table
     * @param {NES_clock} clock
     */
    constructor(opcode_table, clock=null) {
        this.regs = new m6502_registers_t();
        this.pins = new m6502_pins_t();
        this.opcode_table = opcode_table;
        this.PCO = 0;
        this.clock = clock;
        this.regs.IR = M6502_BOOTUP; // Set instruction register to special "WDC_BOOTUP"

        this.clock.trace_cycles = 0;
        this.trace_on = false;
        this.trace_peek = function(addr) { return 0xCD; }

        this.NMI_old = 0;
        this.NMI_ack = false;
        this.NMI_count = 0;

        this.IRQ_ack = false;
        this.IRQ_count = 0;

        this.first_reset = true;

        this.current_instruction = function(pins,addr) {};
    }

    serialize() {
        let o = {
            version: 1
        }
        serialization_helper(o, this, SER_6502);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG M6502 VERSION');
            return false;
        }
        let r = deserialization_helper(this, from, SER_6502);
        this.current_instruction = this.opcode_table[this.regs.IR];
        return r;
    }

    cycle() {
        // Perform 1 processor cycle
        this.clock.trace_cycles++;
        if (this.regs.HLT || this.regs.STP) return;
        if (this.pins.IRQ) {
            this.IRQ_count++;
            if (this.IRQ_count >= 1) {
                this.pins.IRQ = 0;
                this.IRQ_count = 0;
                this.regs.IRQ_pending = true;
                this.IRQ_ack = false;
            }
        }
        else this.IRQ_count = 0;

        // Edge-sensitive 0->1
        if (this.pins.NMI !== this.NMI_old) {
            if (this.pins.NMI === 0) { // Reset NMI status
                this.NMI_ack = false;
            }
            else { // Make NMI pending
                this.NMI_ack = false;
                this.regs.NMI_pending = true;
            }
            this.NMI_old = this.pins.NMI;
        }
        /*if (this.pins.NMI) {
            this.NMI_count++;
            if (this.NMI_count >= 2) {
                this.pins.NMI = 0;
                this.NMI_count = 0;
                this.regs.NMI_pending = true;
                this.NMI_ack = false;
            }
        }*/

        /*if (this.pins.NMI === this.NMI_old)
            this.NMI_count = 0;
        else
            this.NMI_count++;
        if (this.NMI_count > 1) {
            this.NMI_old = this.pins.NMI;
            this.NMI_ack = false;
            this.NMI_count = 0;
            this.regs.NMI_pending = true;
        }*/

        this.regs.TCU++;
        if (this.regs.TCU === 1) {
            this.PCO = this.pins.Addr; // Capture PC before it runs away
            this.regs.IR = this.pins.D;
            if (this.regs.NMI_pending && !this.NMI_ack) {
                this.NMI_ack = true;
                this.regs.NMI_pending = false;
                this.regs.IR = M6502_OP_NMI;
                if (dbg.brk_on_NMIRQ) dbg.break(D_RESOURCE_TYPES.M6502);
            } else if (this.regs.IRQ_pending && !this.IRQ_ack && !this.regs.old_I) {
                this.IRQ_ack = true;
                this.regs.IRQ_pending = false;
                this.regs.IR = M6502_OP_IRQ;
                if (dbg.brk_on_NMIRQ) dbg.break(D_RESOURCE_TYPES.M6502);
            }
            this.regs.old_I = this.regs.P.I;
            if (typeof this.regs.IR === 'undefined') {
                dbg.break();
                return;
            }
			this.current_instruction = this.opcode_table[this.regs.IR];
            if (this.current_instruction.addr_mode === M6502_AM.NONE) {
                console.log('INVALID OPCODE');
                dbg.break();
            }
            if (this.trace_on) {
                if (typeof this.regs.A === 'undefined') {
                    dbg.break();
                    return;
                }
                dbg.traces.add(TRACERS.M6502, this.clock.trace_cycles-1, this.trace_format(this.disassemble(), this.PCO));
            }
        }
        this.IRQ_ack = false;
        this.NMI_ack = false;

        this.current_instruction.exec_func(this.regs, this.pins);
    }

    // Must be called while regs.PC is accurate for the instruction we care about
    disassemble() {
        let PC = this.pins.Addr;
        let opcode = this.regs.IR;
        let opcode_info = this.opcode_table[opcode];
        let output = new M6502_disassembly_output();
        output.mnemonic = opcode_info.mnemonic;
        let addr_mode = opcode_info.addr_mode;
        PC = (PC + 1) & 0xFFFF;
        let cpu = this;

        let read8 = function() {
            return '$' + hex2(cpu.trace_peek(PC));
        }

        let read16 = function() {
            return '$' + hex4(cpu.trace_peek(PC) + (cpu.trace_peek(PC+1) << 8));
        }

        let outstr;
        //let outstr = output.mnemonic.slice(0,3);
        if (output.mnemonic.indexOf(' ') === -1) {
            outstr = output.mnemonic;
        }
        else {
            outstr = output.mnemonic.slice(0, output.mnemonic.indexOf(' '));
        }
        switch(addr_mode) {
            case M6502_AM.IMPLIED:
            case M6502_AM.NONE:
                break;
            case M6502_AM.ACCUM:
                outstr += ' A';
                break;
            case M6502_AM.ZP_INDw:
            case M6502_AM.ZP_INDr:
                outstr += ' (' + read8() + ')'
                break;
            case M6502_AM.IMM:
                outstr += ' #' + read8();
                break;
            case M6502_AM.IND:
                outstr += ' (' + read8() + ')';
                break;
            case M6502_AM.ABS_IND_Xr:
                outstr += ' (' + read16() + ',x)';
                break;
            case M6502_AM.IND_Yr:
            case M6502_AM.IND_Yw:
            case M6502_AM.IND_Ym:
                outstr += ' (' + read8() + '),y';
                break;
            case M6502_AM.X_INDw:
            case M6502_AM.X_INDm:
            case M6502_AM.X_INDr:
                outstr += ' (' + read8() + ',x)';
                break;
            case M6502_AM.ABSw:
            case M6502_AM.ABSr:
            case M6502_AM.ABSm:
            case M6502_AM.ABSjsr:
            case M6502_AM.ABSjmp:
                outstr += ' ' + read16();
                break;
            case M6502_AM.ABS_Xw:
            case M6502_AM.ABS_Xm:
            case M6502_AM.ABS_Xr:
                outstr += ' ' + read16() + ',x';
                break;
            case M6502_AM.ABS_Yw:
            case M6502_AM.ABS_Ym:
            case M6502_AM.ABS_Yr:
                outstr += ' ' + read16() + ',y';
                break;
            case M6502_AM.ZPw:
            case M6502_AM.ZPm:
            case M6502_AM.ZPr:
                outstr += ' ' + read8();
                break;
            case M6502_AM.ZP_Xw:
            case M6502_AM.ZP_Xm:
            case M6502_AM.ZP_Xr:
                outstr += ' ' + read8() + ',x';
                break;
            case M6502_AM.ZP_Yw:
            case M6502_AM.ZP_Ym:
            case M6502_AM.ZP_Yr:
                outstr += ' ' + read8() + ',y';
                break;
            case M6502_AM.PC_REL:
                outstr += ' $' + hex4((mksigned8(this.trace_peek(PC)) + PC + 1) & 0xFFFF);
                break;
            case M6502_AM.INDjmp:
                outstr += ' (' + read16() + ')';
                break;
            case M6502_AM.PC_REL_ZP:
                outstr += ' ' + read8() + ', $' + hex4(mksigned8(this.trace_peek(PC+1)) + PC + 2)
                break;
            default:
                console.log('UNKNOWN AM', addr_mode);
                break;
        }
        output.disassembled = outstr;
        return output;
    }

    enable_tracing(peek_func) {
        this.trace_peek = peek_func;
        //this.clock.trace_cycles = 0;
        this.trace_on = true;
    }

    disable_tracing() {
        this.trace_peek = function(addr) { return 0xC0; }
        this.trace_on = false;
    }

	trace_format(da_out, PCO) {
		let outstr = trace_start_format('MOS', MOS_COLOR, this.clock.trace_cycles-1, ' ', PCO);
		// General trace format is...
		outstr += da_out.disassembled;
		let sp = da_out.disassembled.length;
		while(sp < TRACE_INS_PADDING) {
			outstr += ' ';
			sp++;
		}

		outstr += 'PC:' + hex4(this.regs.PC) + ' ';
		outstr += ' A:' + hex2(this.regs.A);
		outstr += ' X:' + hex2(this.regs.X) + ' Y:' + hex2(this.regs.Y);
		outstr += ' S:' + hex2(this.regs.S);
		outstr += ' P:' + this.regs.P.formatbyte();
        return outstr;
	}

    power_on() {
        // Initial values from Visual6502
        this.regs.A = 0xCC;
        this.regs.S = 0xFD;
        this.pins.D = 0x60;
        this.pins.RW = 0;
        this.regs.X = this.regs.Y = 0;
        this.regs.P.I = 1;
        this.regs.P.Z = 1;
        this.regs.PC = 0;
    }

    reset() {
        this.pins.RST = 0;
        this.RES_pending = false;
        this.regs.TCU = 0;
        this.pins.D = M6502_OP_RESET;
        this.pins.RW = 1;
        this.regs.P.B = 1;
        this.regs.P.D = 0;
        this.regs.P.I = 1;
        this.regs.WAI = false;
        this.regs.STP = false;
        if (this.first_reset) this.power_on();
        this.first_reset = false;
    }
}


//
