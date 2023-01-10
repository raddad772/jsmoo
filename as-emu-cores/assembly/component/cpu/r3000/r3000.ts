"use strict";

import {MT, PS1_mem, R3000_multiplier_t} from "../../../system/ps1/ps1_mem";
import {PS1_GTE} from "../../../system/ps1/ps1_gte";
import {R3000_generate_opcodes, R3000_opcode} from "./r3000_opcodes";
import {hex8} from "../../../helpers/helpers";
import {R3000_fNA} from "./r3000_instructions";
import {R3000_COP0_reg} from "./r3000_disassembler";
import {PS1_clock} from "../../../system/ps1/ps1_misc";

class R3000_regs_t {
    // MIPS general-purpose registers, of which there are 32
    R: StaticArray<u32> = new StaticArray<u32>(32);

    // Coprocessor registers, of which there are 32
    COP0: StaticArray<u32> = new StaticArray<u32>(32);
    trace_on: bool = false;
    PC: u32 = 0
}

class R3000_pins_t {
    Addr: u32 = 0
    D: u32 = 0
    RD: u32 = 0
    WR: u32 = 0
    IRQ: u32 = 0
}

export enum R3000_pipe_kind {
    empty,
    set_register,
    instruction_advance_cycle,
}

export class R3000_pipeline_item_t {
    kind: R3000_pipe_kind = R3000_pipe_kind.empty;
    target: i32 = -1;
    value: i64 = -1
    opcode: u32 = 0
    new_PC: u32 = 0
    addr: u32 = 0
    empty: bool = false
    op: R3000_opcode = new R3000_opcode(0, 'yo', R3000_fNA, 0);

    copy(from: R3000_pipeline_item_t): void {
        this.kind = from.kind;
        this.target = from.target;
        this.value = from.value;
        this.new_PC = from.new_PC;
        this.op = from.op;
        this.opcode = from.opcode;
        this.addr = from.addr;
    }

    clear(): void {
        this.kind = R3000_pipe_kind.empty;
        this.target = -1;
        this.value = -1;
        this.new_PC = 0;
    }
}

export class R3000_pipeline_t {
    items: StaticArray<R3000_pipeline_item_t> = new StaticArray<R3000_pipeline_item_t>(2);
    base: u32 = 0
    num_items: u32 = 0
    current: R3000_pipeline_item_t = new R3000_pipeline_item_t();
    empty_item: R3000_pipeline_item_t = new R3000_pipeline_item_t();
    constructor() {
        this.items[0] = new R3000_pipeline_item_t();
        this.items[1] = new R3000_pipeline_item_t();

        this.current = new R3000_pipeline_item_t();
        this.empty_item.empty = true;
    }

    push(): R3000_pipeline_item_t {
        if (this.num_items === 2) return this.empty_item;
        let r = this.items[this.num_items];
        this.num_items++;
        return r;
    }

    clear(): void {
        this.items[0].clear();
        this.items[1].clear();
        this.num_items = 0;
        this.current.clear();
    }

    empty(): bool {
        return this.num_items === 0;
    }

    full(): bool {
        return this.num_items === 2;
    }

    get_next(): R3000_pipeline_item_t {
        return this.items[0];
    }

    move_forward(): R3000_pipeline_item_t {
        if (this.num_items === 0) return this.empty_item;
        this.current.copy(this.items[0]);
        this.items[0].copy(this.items[1]);
        this.items[1].clear();
        this.num_items--;

        return this.current;
    }
}

class R3000_IO {
    I_STAT: u32 = 0
    I_MASK: u32 = 0
}

export class R3000 {
    mem: PS1_mem
    clock: PS1_clock = new PS1_clock();
    regs: R3000_regs_t = new R3000_regs_t();
    pipe: R3000_pipeline_t = new R3000_pipeline_t();
    pins: R3000_pins_t = new R3000_pins_t();
    multiplier: R3000_multiplier_t = new R3000_multiplier_t(this.clock);
    gte: PS1_GTE = new PS1_GTE(this.clock)
    op_table: StaticArray<R3000_opcode>
    trace_on: bool = false;
    console: string = '';
    io: R3000_IO = new R3000_IO();

    constructor(mem: PS1_mem) {
        this.mem = mem;
        this.op_table = R3000_generate_opcodes();
    }

    set_interrupt(which: u32): void {
        // TODO: make this edge-detecting to trigger
        this.io.I_STAT |= which;
        this.update_I_STAT();
    }

    update_I_STAT(): void {
        this.pins.IRQ = +((this.io.I_STAT & this.io.I_MASK) !== 0);
    }

        /* 1F801070h I_STAT - Interrupt status register (R=Status, W=Acknowledge)
1F801074h I_MASK - Interrupt mask register (R/W)
Status: Read I_STAT (0=No IRQ, 1=IRQ)
Acknowledge: Write I_STAT (0=Clear Bit, 1=No change)
Mask: Read/Write I_MASK (0=Disabled, 1=Enabled)


  0     IRQ0 VBLANK (PAL=50Hz, NTSC=60Hz)
  1     IRQ1 GPU   Can be requested via GP0(1Fh) command (rarely used)
  2     IRQ2 CDROM
  3     IRQ3 DMA
  4     IRQ4 TMR0  Timer 0 aka Root Counter 0 (Sysclk or Dotclk)
  5     IRQ5 TMR1  Timer 1 aka Root Counter 1 (Sysclk or H-blank)
  6     IRQ6 TMR2  Timer 2 aka Root Counter 2 (Sysclk or Sysclk/8)
  7     IRQ7 Controller and Memory Card - Byte Received Interrupt
  8     IRQ8 SIO
  9     IRQ9 SPU
  10    IRQ10 Controller - Lightpen Interrupt. Also shared by PIO and DTL cards.
  11-15 Not used (always zero)
  16-31 Garbage
         */
    CPU_write_reg(addr: u32, val: u32): void {
        switch(addr) {
            case 0x1F801070: // I_STAT write
                this.io.I_STAT &= (val>>>0);
                this.update_I_STAT();
                return;
            case 0x1F801074: // I_MASK write
                this.io.I_MASK = val;
                this.update_I_STAT();
                return;
        }
        console.log('Unhandled CPU write ' + hex8(addr) + ' ' + hex8(val));
    }

    CPU_read_reg(addr: u32, size: MT, val: u32): u32 {
        switch(addr) {
            case 0x1F801070: // I_STAT read
                return this.io.I_STAT;
            case 0x1F801074: // I_MASK read
                return this.io.I_MASK;
        }
        console.log('Unhandled CPU read ' + hex8(addr));
        return 0xFFFFFFFF;
    }

    enable_tracing(): void {
        console.log('R3000 ENABLE TRACING')
        this.trace_on = true;
        this.regs.trace_on = true;
    }

    disable_tracing(): void {
        console.log('R3000 DISABLE TRACING')
        this.trace_on = false;
        this.regs.trace_on = false;
    }

    reset(): void {
        console.log('RESET R3000')
        this.pipe.clear()
        //this.regs.PC =0x1FC00000;
        this.regs.PC = 0xBFC00000;
        //console.log('REGS PC!', this.regs.PC);
        // Fill instruction pipe with enough instructions
        // Setup COP0 registers
    }

    trace_format(disasm: string, PCO: u32): string {
        /*let outstr = trace_start_format('R3K', R3000_COLOR, this.clock.trace_cycles-1, ' ', PCO)
        outstr += disasm;
		let sp = disasm.length;
		while(sp < 30) {
			outstr += ' ';
			sp++;
		}
        if (this.debug_reg_list.length > 0) {
            for (let i in this.debug_reg_list) {
                let rn = this.debug_reg_list[i];
                if (this.debug_on) {
                    this.debug_tracelog += 'R' + dec2(rn) + ' ' + hex8(this.regs.R[rn]>>>0).toLowerCase() + ' ';
                }
                outstr += ' ' + R3000_reg_alias[rn] + ':' + hex8(this.regs.R[rn]);
            }
        }
        this.debug_reg_list = [];
        return outstr;*/
        return 'TEST';
    }

    cycle(): void {
        //console.log('PC!', this.regs.PC);
        this.clock.trace_cycles += 2;

        if (this.pins.IRQ && (this.regs.COP0[12] & 0x400) && (this.regs.COP0[12] & 1)) {
            this.exception(0, this.pipe.get_next().new_PC !== 0);
        }

        if (this.pipe.num_items < 1)
            this.fetch_and_decode();
        let current = this.pipe.move_forward();

        current.op.func(current.opcode, current.op, this);

        this.delay_slots(current);

        /*if (this.trace_on) {
            dbg.traces.add(TRACERS.R3000, this.clock.trace_cycles-1, this.trace_format(R3000_disassemble(current.opcode).disassembled, current.addr))
        }*/

        current.clear();

        this.fetch_and_decode();
    }

    delay_slots(which: R3000_pipeline_item_t) {
        // Load delay slot from instruction before this one
        if (which.target > 0) {// R0 stays 0
            this.regs.R[which.target] = which.value;
            /*if (this.trace_on) {
                this.debug_reg_list.push(which.target);
                //this.debug_tracelog += 'R' + dec2(which.target) + ' ' + hex8(this.regs.R[which.target]>>>0).toLowerCase() + ' ';

            }*/
            which.target = -1;
        }

        // Branch delay slot
        if (which.new_PC !== 0) {
            this.regs.PC = which.new_PC;
            if ((this.regs.PC === 0xB0)) {
                if (this.regs.R[9] === 0x3D) {
                    this.console += String.fromCharCode(this.regs.R[4]);
                    console.log(this.console);
                }
            }
            which.new_PC = 0;
        }
    }

    decode(IR: u32, current: R3000_pipeline_item_t): void {
        // SPECIAL
        let p1 = (IR & 0xFC000000) >> 26;
        let p2 = (IR & 0x3F);
        if (p1 === 0) {
            current.op = this.op_table[0x3F + p2]
        }
        else {
            current.op = this.op_table[p1]
        }
    }

    fetch_and_decode(): void {
        let IR: u32 = this.mem.CPU_read(this.regs.PC, MT.u32, 0);
        let current = this.pipe.push();
        this.decode(IR, current);
        current.opcode = IR;
        current.addr = this.regs.PC;
        this.regs.PC += 4;
    }

    COP_write_reg(COP: u32, num: u32, val: u32) {
        switch(COP) {
            case 0:
                // TODO: add 1-cycle delay
                if (num === 12) {
                    this.mem.update_SR(val);
                }
                this.regs.COP0[num] = val;
                return;
            case 2:
                this.gte.write_reg(num, val);
                return;
            default:
                console.log('write to unimplemented COP ' + COP.toString());
        }
    }

    COP_read_reg(COP: u32, num: u32): u32 {
        switch(COP) {
            case 0:
                return this.regs.COP0[num];
            case 2:
                return this.gte.read_reg(num);
            default:
                console.log('read from unimplemented COP ' + COP.toString());
                return 0xFF;
        }
    }

    exception(code: u32, branch_delay: bool = false, cop0: bool = false): void {
        //if (this.trace_on) {
            //dbg.traces.add(TRACERS.R3000, this.clock.trace_cycles-1, 'EXCEPTION ' + code);
        //}
        code <<= 2;
        let vector: u32 = 0x80000080;
        if (this.regs.COP0[R3000_COP0_reg.SR] & 0x400000) {
            vector = 0xBFC00180;
        }
        let raddr: u32;
        if (!branch_delay)
            raddr = this.regs.PC - 4;
        else
        {
            raddr = this.regs.PC;
            code |= 0x80000000;
        }
        this.regs.COP0[R3000_COP0_reg.EPC] = raddr>>>0;
        this.flush_pipe();

        if (cop0)
            vector -= 0x40;

        this.regs.PC = vector;
        this.regs.COP0[R3000_COP0_reg.Cause] = code;
        let lstat: u32 = this.regs.COP0[R3000_COP0_reg.SR];
        this.regs.COP0[R3000_COP0_reg.SR] = (lstat & 0xFFFFFFC0) | ((lstat & 0x0F) << 2);
    }

    // Apply any waiting register changes,
    //  first in pipe.current, then in later
    //  ones.
    // Then clear out the pipe.
    flush_pipe() {
        this.delay_slots(this.pipe.current);
        this.delay_slots(this.pipe.items[0]);
        this.delay_slots(this.pipe.items[1]);
        this.pipe.move_forward();
        this.pipe.move_forward();
    }
}