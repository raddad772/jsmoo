"use strict";

class SM83_regs_F {
    constructor() {
        this.Z = 0;
        this.N = 0;
        this.H = 0;
        this.C = 0;
    }

    getbyte() {
        return (this.C << 4) | (this.H << 5) | (this.N << 6) | (this.Z << 7);
    }

    setbyte(val) {
        this.C = (val & 0x10) >>> 4;
        this.H = (val & 0x20) >>> 5;
        this.N = (val & 0x40) >>> 6;
        this.Z = (val & 0x80) >>> 7;
    }

    formatbyte() {
		let outstr = '';
		outstr += this.C ? 'C' : 'c';
		outstr += this.H ? 'H' : 'h';
		outstr += this.N ? 'N' : 'n';
		outstr += this.Z ? 'Z' : 'z';
		return outstr;
    }
}

class SM83_regs_t {
    constructor() {
        // CPU registers
        this.A = 0;
        this.F = new SM83_regs_F();
        this.B = 0;
        this.C = 0;
        this.D = 0;
        this.E = 0;
        this.H = 0;
        this.L = 0;
        this.SP = 0;
        this.PC = 0;

        this.EI = 0;
        this.HLT = 0;
        this.STP = 0;
        this.IME = 0;

        this.halt_bug = 0;

        this.interrupt_latch = 0;
        this.interrupt_flag = 0;


        // internal/speculative
        this.TCU = 0; // "Timing Control Unit" basically which cycle of an op we're on
        this.IR = 0; // "Instruction Register" currently-executing register

        this.TR = 0; // Temporary Register
        this.TA = 0; // Temporary Address
        this.RR = 0; // Remorary Register

        this.prefix = 0;
    }

    stoppable() {
        return false;
    }
}

class SM83_pins_t {
    constructor() {
        this.RD = 0; // External read request
        this.WR = 0; // External write request
        this.MRQ = 0; // Extermal memory request
        this.IRQ0 = 0;
        this.IRQ0_ack = 0;
        this.IRQ1 = 0;
        this.IRQ1_ack = 0;
        this.IRQ2 = 0;
        this.IRQ2_ack = 0;
        this.IRQ3 = 0;
        this.IRQ3_ack = 0;
        this.IRQ4 = 0;
        this.IRQ4_ack = 0;
        // IRQ5-7 are not connected in gameboy

        this.D = 0; // Data; 8 bits
        this.Addr = 0; // Address; 16 bits
    }
}

class SM83_t {
    constructor() {
        this.regs = new SM83_regs_t();
        this.pins = new SM83_pins_t();

        this.trace_on = false;
        this.trace_peek = null;

        this.trace_cycles = 0;
        this.current_instruction = SM83_opcode_matrix[SM83_S_RESET];
    }

    enable_tracing(trace_peek=null) {
        this.trace_on = true;
        if (trace_peek !== null)
            this.trace_peek = trace_peek;
    }

    disable_tracing() {
        if (!this.trace_on) return;
        this.trace_on = false;
    }

    trace_format(dass, PCO) {
		let outstr = trace_start_format('SM83', SM83_COLOR, this.trace_cycles, ' ', PCO);
		// General trace format is...
		outstr += dass;
		let sp = dass.length;
		while(sp < TRACE_INS_PADDING) {
			outstr += ' ';
			sp++;
		}

		outstr += 'TCU:' + this.regs.TCU + ' ';
        outstr += 'PC:' + hex4(this.regs.PC) + ' ';
		outstr += ' A:' + hex2(this.regs.A);
		outstr += ' B:' + hex2(this.regs.B);
		outstr += ' C:' + hex2(this.regs.C);
		outstr += ' D:' + hex2(this.regs.D);
		outstr += ' E:' + hex2(this.regs.E);
		outstr += ' HL:' + hex4((this.regs.H << 8) | (this.regs.L));
		outstr += ' SP:' + hex4(this.regs.SP);
		outstr += ' F:' + this.regs.F.formatbyte();
        return outstr;
	}

    reset() {
        this.regs.PC = 0;
        this.regs.TCU = 0;
    }

    ins_cycles() {
        switch(this.regs.TCU) {
            case 1: // Initial opcode fetch has already been done as last cycle of last instruction
                this.regs.IR = this.pins.D;
                if (this.regs.IR === 0xCB) {
                    this.prefix = 0xCB;
                    this.regs.IR = SM83_S_DECODE;
                    this.pins.Addr = this.regs.PC; this.regs.PC = (this.regs.PC + 1) & 0xFFFF; break;
                }

                this.current_instruction = sm83_decoded_opcodes[this.regs.IR];
                this.regs.prefix = 0;
                this.regs.TCU = 0;
                break;
            case 2:
                this.regs.IR = this.pins.D;
                if (this.regs.IR === 0xCB) {
                    console.log('UM?');
                    this.regs.TCU--;
                    this.pins.Addr = this.regs.PC;
                    this.regs.PC = (this.regs.PC + 1) & 0xFFFF;
                    this.regs.IR = SM83_S_DECODE;
                    break;
                }
                console.log('SETTING INS', hex2(this.regs.IR));
                this.regs.prefix = 0x00;
                this.regs.TCU = 0;
                this.current_instruction = sm83_decoded_opcodes[SM83_prefix_to_codemap[0xCB] + this.regs.IR];
                break;
        }
    }

    cycle() {
        this.regs.TCU++;
        this.trace_cycles++;
        if (this.regs.IR === SM83_S_DECODE) {
            // operand()
            // if CB, operand() again
            if ((this.regs.TCU === 1) && (this.regs.prefix === 0)) this.PCO = this.pins.Addr;
            this.ins_cycles();
        } else {
            if (this.trace_on && this.regs.TCU === 1) {
                this.last_trace_cycle = this.PCO;
                dbg.traces.add(TRACERS.SM83, this.trace_cycles, this.trace_format(SM83_disassemble(this.PCO, this.trace_peek), this.PCO));
            }
            // Execute an actual opcode
            this.current_instruction.exec_func(this.regs, this.pins);
        }
    }

}