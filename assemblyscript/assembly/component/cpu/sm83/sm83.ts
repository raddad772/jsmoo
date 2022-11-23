import {GB_variants} from "../../../system/gb/gb_common";
import {hex2, hex4} from "../../../helpers/helpers";
import {
    SM83_HALT,
    SM83_opcode_functions,
    SM83_opcode_matrix,
    SM83_prefix_to_codemap,
    SM83_S_DECODE, SM83_S_IRQ,
    SM83_S_RESET
} from "./sm83_opcodes";
import {GB_bus, GB_clock} from "../../../system/gb/gb";
import {dbg} from "../../../helpers/debug";
import {sm83_decoded_opcodes} from "./sm83_generated_opcodes";

export var SM83_PC_BRK: i32 = -1;

class SM83_regs_F {
        Z: u32 = 0;
        N: u32 = 0;
        H: u32 = 0;
        C: u32 = 0;

    getbyte(): u32 {
        return (this.C << 4) | (this.H << 5) | (this.N << 6) | (this.Z << 7);
    }

    setbyte(val: u32): void {
        this.C = (val & 0x10) >>> 4;
        this.H = (val & 0x20) >>> 5;
        this.N = (val & 0x40) >>> 6;
        this.Z = (val & 0x80) >>> 7;
    }

    formatbyte(): string {
		let outstr = '';
		outstr += this.C ? 'C' : 'c';
		outstr += this.H ? 'H' : 'h';
		outstr += this.N ? 'N' : 'n';
		outstr += this.Z ? 'Z' : 'z';
		return outstr;
    }
}

export class SM83_regs_t {
    A: u32 = 0
    F: SM83_regs_F = new SM83_regs_F()
    B: u32 = 0;
    C: u32 = 0;
    D: u32 = 0;
    E: u32 = 0;
    H: u32 = 0;
    L: u32 = 0;
    SP: u32 = 0;
    PC: u32 = 0;

    IV: i32 = 0; // interrupt vector to execute
    IME_DELAY: i32 = 0;

    IE: u32 = 0; // Enable interrupt?
    IF: u32 = 0; // Interrupt flag
    HLT: u32 = 0;
    STP: u32 = 0;
    IME: u32 = 0; // Global enable interrupt

    halt_bug: u32 = 0;

    interrupt_latch: u32 = 0;
    interrupt_flag: u32 = 0;


        // internal/speculative
    TCU: u32 = 0; // "Timing Control Unit" basically which cycle of an op we're on
    IR: u32 = 0; // "Instruction Register" currently-executing register

    TR: u32 = 0; // Temporary Register
    TA: u32 = 0; // Temporary Address
    RR: u32 = 0; // Remorary Register

    prefix: u32 = 0;
    poll_IRQ: bool = false;

    stoppable(): bool {
        return false;
    }
}

export class SM83_pins_t {
    RD: u32 = 0; // External read request
    WR: u32 = 0; // External write request
    MRQ: u32 = 0; // Extermal memory request

    D: u32 = 0; // Data; 8 bits
    Addr: u32 = 0; // Address; 16 bits
}

export class SM83_t {
    regs: SM83_regs_t = new SM83_regs_t();
    pins: SM83_pins_t = new SM83_pins_t();
    clock: GB_clock
    bus: GB_bus
    variant: GB_variants

    trace_on: bool = false;
    //trace_peek: null = null

    trace_cycles: u64 = 0
    current_instruction: SM83_opcode_functions = sm83_decoded_opcodes[SM83_S_RESET];

    constructor(variant: GB_variants, clock: GB_clock, bus: GB_bus) {
        this.clock = clock;
        this.bus = bus;

        this.variant = variant;
    }

    /*enable_tracing(trace_peek: null = null): void {
        console.log('ENABLE THIS ENABLE TRACING')
        this.trace_on = true;
        if (trace_peek !== null)
            this.trace_peek = trace_peek;
        console.log('TRACING ENABLED HERE!')
    }*/

    disable_tracing(): void {
        console.log('ENABLE THIS DISABLE TRACING');
        if (!this.trace_on) return;
        this.trace_on = false;
    }

    /*trace_format(dass, PCO) {
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
	}*/

    reset(): void {
        this.regs.PC = 1;
        this.regs.TCU = 0;
        this.pins.Addr = 0;
        this.pins.RD = this.pins.MRQ = 1;
        this.pins.WR = 0;
        this.regs.IR = SM83_S_DECODE;
    }

    ins_cycles(): void {
        switch(this.regs.TCU) {
            case 1: // Initial opcode fetch has already been done as last cycle of last instruction
                this.regs.IR = this.pins.D;
                if (this.regs.IR === 0xCB) {
                    this.regs.IR = SM83_S_DECODE;
                    this.pins.Addr = this.regs.PC;
                    this.regs.PC = (this.regs.PC + 1) & 0xFFFF;
                    break;
                }

                this.current_instruction = sm83_decoded_opcodes[this.regs.IR];
                /*if (this.trace_on) {
                    dbg.traces.add(TRACERS.SM83, this.trace_cycles, this.trace_format(SM83_disassemble(this.pins.Addr, this.trace_peek), this.pins.Addr));
                }*/

                this.current_instruction.exec_func(this.regs, this.pins);
                break;
            case 2:
                this.regs.IR = this.pins.D;
                this.current_instruction = sm83_decoded_opcodes[SM83_prefix_to_codemap.get(0xCB) + this.regs.IR];
                /*if (this.trace_on) {
                    dbg.traces.add(TRACERS.SM83, this.trace_cycles, this.trace_format(SM83_disassemble((this.pins.Addr-1) & 0xFFFF, this.trace_peek), this.pins.Addr));
                }*/
                this.regs.TCU = 1;
                this.current_instruction.exec_func(this.regs, this.pins);
                break;
        }
    }

    cycle(): void {
        this.regs.TCU++;
        this.trace_cycles++;
        // Enable interrupts on next cycle
        if (this.regs.IME_DELAY > 0) {
            this.regs.IME_DELAY--;
            if (this.regs.IME_DELAY <= 0) {
                this.regs.IME = 1;
            }
        }
        if ((this.regs.IR === SM83_HALT) ||
            ((this.regs.IR === SM83_S_DECODE) && (this.regs.TCU === 1) && (this.regs.poll_IRQ))) {
            let is_halt = ((this.regs.IR === SM83_HALT) && (this.regs.IME === 0));
            //if (dbg.watch_on) console.log('IRQ poll', this.regs.IME, this.regs.IF, this.regs.IE);
            this.regs.poll_IRQ = false;
            let imask: u32 = 0xFF;
            if ((this.regs.IME) || is_halt) {
                let mask = this.regs.IE & this.regs.IF & 0x1F;
                this.regs.IV = -1;
                imask = 0xFF;
                if (mask & 1) { // VBLANK interrupt
                    imask = 0xFE;
                    this.regs.IV = 0x40;
                } else if (mask & 2) { // STAT interrupt
                    //if (this.bus.ppu!.enabled)
                    imask = 0xFD;
                    this.regs.IV = 0x48;
                } else if (mask & 4) { // Timer interrupt
                    imask = 0xFB;
                    this.regs.IV = 0x50;
                } else if (mask & 8) { // Serial interrupt
                    imask = 0xF7;
                    this.regs.IV = 0x58;
                } else if (mask & 0x10) { // Joypad interrupt
                    imask = 0xEF;
                    this.regs.IV = 0x60;
                }
                if (this.regs.IV > 0) {
                    if (is_halt && (this.regs.IME === 0)) {
                        this.regs.HLT = 0;
                        this.regs.TCU++;
                    }
                    else {
                        //console.log('SO IRQ ACTUALLY GOING TO HAPPEN!', hex2(this.regs.IV));
                        if (dbg.brk_on_NMIRQ) {
                            console.log('NMIRQ BRK!');
                            dbg.break();
                        }
                        // Right here, the STAT is not supposed to be cleared if LCD disabled
                        if (this.regs.HLT) {
                            //console.log('HALT BUSTER!');
                            this.regs.PC = (this.regs.PC + 1) & 0xFFFF;
                        }// else {
                            //console.log('NO HALT BUST!');
                        //}
                        this.regs.IF &= imask;
                        this.regs.HLT = 0;
                        this.regs.IR = SM83_S_IRQ;
                        //console.log('SETTING IRQ!');
                        this.current_instruction = sm83_decoded_opcodes[SM83_S_IRQ];
                    }
                }
            }
        }

        if (this.regs.IR === SM83_S_DECODE) {
            // operand()
            // if CB, operand() again
            //if (this.regs.TCU === 1) this.PCO = this.pins.Addr;
            this.ins_cycles();
        } else {
            // Execute an actual opcode
            //console.log('EXEC IDX:' + this.current_instruction.exec_func.index.toString() + ' ' + hex4(this.regs.PC) + ' ' + this.current_instruction.mnemonic + ' ' + this.current_instruction.ins.toString());
            this.current_instruction.exec_func(this.regs, this.pins);
        }
        /*if (this.regs.PC === SM83_PC_BRK) {
            SM83_PC_BRK = -1;
            console.log('PCBRK!');
            dbg.break();
        }*/
    }
}
