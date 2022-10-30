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

        this.IV = 0; // interrupt vector to execute

        // TODO: interrupt handling
        // https://gbdev.io/pandocs/Interrupts.html
        this.IE = 0; // Enable interrupt?
        this.IF = 0; // Interrupt flag
        this.HLT = 0;
        this.STP = 0;
        this.IME = 0; // Global enable interrupt

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
        this.poll_IRQ = false;
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
        console.log('TRACING ENABLED HERE!')
    }

    disable_tracing() {
        if (!this.trace_on) return;
        this.trace_on = false;
        console.log('TRACING DISABLED HERE!');
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
        this.regs.PC = 1;
        this.regs.TCU = 0;
        this.pins.Addr = 0;
        this.pins.RD = this.pins.MRQ = 1;
        this.pins.WR = 0;
        this.regs.IR = SM83_S_DECODE;
    }

    ins_cycles() {
        switch(this.regs.TCU) {
            case 1: // Initial opcode fetch has already been done as last cycle of last instruction
                this.regs.IR = this.pins.D;
                if (this.regs.IR === 0xCB) {
                    this.prefix = 0xCB;
                    this.regs.IR = SM83_S_DECODE;
                    this.pins.Addr = this.regs.PC;
                    this.regs.PC = (this.regs.PC + 1) & 0xFFFF;
                    break;
                }

                this.current_instruction = sm83_decoded_opcodes[this.regs.IR];
                if (this.trace_on) {
                    dbg.traces.add(TRACERS.SM83, this.trace_cycles, this.trace_format(SM83_disassemble(this.pins.Addr, this.trace_peek), this.pins.Addr));
                }

                this.regs.TCU = 1;
                this.current_instruction.exec_func(this.regs, this.pins);
                break;
            case 2:
                this.regs.IR = this.pins.D;
                this.current_instruction = sm83_decoded_opcodes[SM83_prefix_to_codemap[0xCB] + this.regs.IR];
                if (this.trace_on) {
                    dbg.traces.add(TRACERS.SM83, this.trace_cycles, this.trace_format(SM83_disassemble((this.pins.Addr-1) & 0xFFFF, this.trace_peek), this.pins.Addr));
                }
                this.regs.TCU = 1;
                this.current_instruction.exec_func(this.regs, this.pins);
                break;
        }
    }

    cycle() {
        this.regs.TCU++;
        // Enable interrupts on next cycle
        if (this.regs.IE > 0) {
            this.regs.IE--;
            if (this.regs.IE === 0) this.regs.IME = 1;
        }
        this.trace_cycles++;
        if ((this.regs.IR === SM83_S_DECODE) && (this.regs.TCU === 1) && (this.regs.poll_IRQ)) {
            this.regs.poll_IRQ = false;
            if (this.regs.IME > 0) {
                let mask = this.regs.IME & this.regs.IF;
                this.regs.IV = -1;
                if (mask & 1) { // VBLANK interrupt
                    this.regs.IF &= 0xFE;
                    this.regs.IV = 0x40;
                    console.log('VBLANK IRQ');
                } else if (mask & 2) { // STAT interrupt
                    this.regs.IF &= 0xFD;
                    this.regs.IV = 0x48;
                    console.log('STAT IRQ');
                } else if (mask & 4) { // Timer interrupt
                    this.regs.IF &= 0xFB;
                    this.regs.IV = 0x50;
                    console.log('TIMER IRQ');
                } else if (mask & 8) { // Serial interrupt
                    this.regs.IF &= 0xF7;
                    this.regs.IV = 0x58;
                    console.log('SERIAL IRQ');
                } else if (mask & 0x10) { // Joypad interrupt
                    this.regs.IF &= 0xEF;
                    this.regs.IV = 0x60;
                    console.log('JOYPAD IRQ');
                }
                if (this.regs.IV > 0) {
                    console.log('SO IRQ ACTUALLY GOING TO HAPPEN!');
                    if (dbg.brk_on_NMIRQ) dbg.break();
                    this.regs.IR = SM83_S_IRQ;
                    this.current_instruction = sm83_decoded_opcodes[SM83_S_IRQ];
                }
            }
        }


        if (this.regs.IR === SM83_S_DECODE) {
            // operand()
            // if CB, operand() again
            if (this.regs.TCU === 1) this.PCO = this.pins.Addr;
            this.ins_cycles();
        } else {
            // Execute an actual opcode
            this.current_instruction.exec_func(this.regs, this.pins);
        }
    }

}