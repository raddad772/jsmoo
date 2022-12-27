"use strict";

class R3000_regs_t {
    constructor() {
        // MIPS general-purpose registers, of which there are 32
        this.R = [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ];

        // Multiply/divide registers
        this.HI = this.LO = 0;

        // Coprocessor registers, of which there are 32
        this.COP0 = [
            0, 0, 0, 0, 0, 0, 0, 0, // data regs
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, // control regs
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ]

        this.trace_on = false;

        // Internal registers
        this.next_addr_decode = 0;
        this.PC = 0; // Processor doesn't exactly use a PC but we do for convenience
    }
}

class R3000_pins_t {
    constructor() {
        this.Addr = 0;
        this.D = 0;
        this.RD = 0;
        this.WR = 0;
    }
}

/*
   Delay slots and branch delays.

   XOR J J

   will execut XOR, Jump, first instruction at Jump, then second Jump!

   lw r2,imm

   r2 not updated next cycle, it is updated the cycle after.

   in order to accomodate this madness, we have a FIFO queue

    each slot, when it is placed, can be of 2 types:
      set register to X,
      set PC to X + actual normal instruction

    It is just a FIFO queue, and each cycle we tick, we remove instructions until we get a normal one.

    Instructions can add to this pipeline, so they can jump (affecting PC-set of instruction AFTER next),

    This is maintained with enough instructions in it because decoder does not execute instruction.

    There is classic fetch-decode-execute where load/store ops take more than 1 cycle but all else take 1.

    SO it's like

    execute(0)
    fetch(2)
    decode(2)

    execute(1)
    fetch(3)
    decode(3)

    execute(2)
    fetch(4)
    decode(4)

 */

const R3000_pipe_kind = Object.freeze({
    empty: 0,
    set_register: 1,
    instruction_advance_cycle: 2
});

class R3000_pipeline_item_t {
    constructor() {
        this.kind = R3000_pipe_kind.empty;
        this.target = -1;
        this.value = -1;
        /**
         * @type {null|R3000_opcode}
         */
        this.op = null;
        this.lr = 0;
        this.lr_mask = 0;
        this.opcode = 0;
        this.new_PC = -1;
        this.addr = 0; // Address of opcode
    }

    copy(from) {
        this.kind = from.kind;
        this.target = from.target;
        this.value = from.value;
        this.new_PC = from.new_PC;
        this.op = from.op;
        this.opcode = from.opcode;
        this.lr = from.lr;
        this.lr_mask = from.lr_mask;
        this.addr = from.addr;
    }

    clear() {
        this.kind = R3000_pipe_kind.empty;
        this.target = this.value = this.new_PC = -1;
        this.op = null;
        this.lr = 0;
        this.lr_mask = 0;
    }
}

class R3000_pipeline_t {
    constructor() {
        /**
         * @type {R3000_pipeline_item_t[]}
         */
        this.items = [new R3000_pipeline_item_t(), new R3000_pipeline_item_t()];
        this.base = 0;
        this.num_items = 0;

        /**
         * @type {R3000_pipeline_item_t}
         **/
        this.current = new R3000_pipeline_item_t();

    }

    /**
     * @returns {null|R3000_pipeline_item_t}
     */
    push() {
        if (this.num_items === 2) return null;
        let r = this.items[this.num_items];
        this.num_items++;
        return r;
    }

    clear() {
        this.items[0].clear();
        this.items[1].clear();
        this.num_items = 0;
        this.current.clear();
    }

    empty() {
        return this.num_items === 0;
    }

    full() {
        return this.num_items === 2;
    }

    /**
     * @returns {null|R3000_pipeline_item_t}
     */
    get_next() {
        return this.items[0];
    }

    /**
     * @returns {R3000_pipeline_item_t}
     */
    move_forward() {
        //console.log('MOVE FORWARD!', this.current, this.items);
        this.current.copy(this.items[0]);
        this.items[0].copy(this.items[1]);
        this.items[1].clear();
        this.num_items--;

        return this.current;
    }

}

class R3000 {
    /**
     * @param {PS1_mem} mem
     */
    constructor(mem) {
        this.clock = new PS1_clock();
        this.regs = new R3000_regs_t();
        this.pipe = new R3000_pipeline_t();
        this.pins = new R3000_pins_t();
        this.mem = mem;
        this.multiplier = new R3000_multiplier_t(this.clock);
        this.op_table = R3000_generate_opcodes();
        this.trace_on = false;

        this.debug_reg_list = [];
        this.debug_tracelog = '';
        this.debug_on = true;
        this.any_debug = false;
        this.cache_isolated = false;
    }

    enable_tracing() {
        console.log('R3000 ENABLE TRACING')
        this.trace_on = true;
        this.regs.trace_on = true;
    }

    disable_tracing() {
        console.log('R3000 DISABLE TRACING')
        this.trace_on = false;
        this.regs.trace_on = false;
    }

    reset() {
        console.log('RESET R3000')
        this.pipe.clear()
        this.regs.PC = 0x1FC00000;
        //console.log('REGS PC!', this.regs.PC);
        // Fill instruction pipe with enough instructions
        // Setup COP0 registers
    }

    trace_format(disasm, PCO) {
        let outstr = trace_start_format('R3K', R3000_COLOR, this.clock.trace_cycles-1, ' ', PCO)
        outstr += disasm;
		let sp = disasm.length;
		while(sp < 30) {
			outstr += ' ';
			sp++;
		}
        outstr += ' PC:' + hex8(PCO);
        if (this.debug_reg_list.length > 0) {
            for (let i in this.debug_reg_list) {
                let rn = this.debug_reg_list[i];
                if (this.debug_on) {
                    this.debug_tracelog += ' R' + dec2(rn) + ' ' + hex8(this.regs.R[rn]>>>0).toLowerCase();
                }
                outstr += ' ' + R3000_reg_alias[rn] + ':' + hex8(this.regs.R[rn]);
            }
        }
        this.debug_reg_list = [];
        return outstr;
    }

    cycle() {
        // Pop things off the stack and execute until we get a cycle_advance
        //console.log('PC!', this.regs.PC);
        this.clock.trace_cycles++;
        if (this.pipe.num_items < 1)
            this.fetch_and_decode();
        let current = this.pipe.move_forward();
        //console.log('OP!', current.op)

        if (this.debug_on) {
            this.debug_add(current.opcode, current.addr)
        }
        current.op.func(current.opcode, current.op, this);

        this.delay_slots(current);

        if (this.trace_on) {
            dbg.traces.add(TRACERS.R3000, this.clock.trace_cycles-1, this.trace_format(R3000_disassemble(current.opcode).disassembled, current.addr))
        }

        current.clear();

        this.fetch_and_decode();
    }

    get_debug_file() {
        let o = this.debug_tracelog + '\r\n';
        this.debug_tracelog = '';
        this.any_debug = false;
        let a = 'PC 00000000 OP 00000000 R00 00000000 R01 00000000 R02 00000000 R03 00000000 R04 00000000 R05 00000000 R06 00000000 R07 00000000 R08 00000000 R09 00000000 R10 00000000 R11 00000000 R12 00000000 R13 00000000 R14 00000000 R15 00000000 R16 00000000 R17 00000000 R18 00000000 R19 00000000 R20 00000000 R21 00000000 R22 00000000 R23 00000000 R24 00000000 R25 00000000 R26 00000000 R27 00000000 R28 00000000 R29 00000000 R30 00000000 R31 00000000 CAUSE 00000000 IRQ 0000 D8 00 D16 0000 D32 00000000\r\n';
        a += 'PC 00000000 OP 00000000\r\n';
        a += 'PC 00000000 OP 00000000\r\n';
        a += 'PC 00000000 OP 00000000\r\n';
        a += 'PC 00000000 OP 00000000';
        return a + o;
    }

    /**
     * @param {R3000_opcode} opcode
     * @param {number} PC
     */
    debug_add(opcode, PC) {
        this.debug_tracelog += '\r\nPC ' + hex8(PC).toLowerCase() + ' OP ' + hex8(opcode).toLowerCase();
    }

    /**
     * @param {R3000_pipeline_item_t} which
     */
    delay_slots(which) {
        // Load delay slot from instruction before this one
        if (which.target > 0) {// R0 stays 0
            if (which.lr)
                this.regs.R[which.target] = (this.regs.R[which.target] & (which.lr_mask ^ 0xFFFFFFFF)) | which.value;
            else
                this.regs.R[which.target] = which.value;
            if (this.trace_on)
                this.debug_reg_list.append(which.target);
            which.target = -1;
        }

        // Branch delay slot
        if (which.new_PC > -1) {
            this.regs.PC = which.new_PC;
            which.new_PC = -1;
        }
    }

    decode(IR, current) {
        // SPECIAL
        let p1 = (IR & 0xFC000000) >>> 26;
        let p2 = (IR & 0x3F);
        if (p1 === 0) {
            //console.log('GRABBING', 0x3F + p2)
            current.op = this.op_table[0x3F + p2]
        }
        else {
            //console.log('GRABBING', p1)
            current.op = this.op_table[p1]
        }
    }

    fetch_and_decode() {
        let IR = this.mem.CPU_read(this.regs.PC, PS1_MT.u32);
        //console.log('FETCH AND DECODE PC:', hex8(this.regs.PC), 'VAL:', hex8(IR))
        let current = this.pipe.push();
        this.decode(IR, current);
        current.opcode = IR;
        current.addr = this.regs.PC;
        //console.log('HEY!', this.pipe);
        this.regs.PC += 4;
    }

        /**
     * @param {number} COP
     * @param {number} num
     * @param {number} val
     * @constructor
     */
    COP_write_reg(COP, num, val) {
        if (COP === 0) {
            // TODO: add 1-cycle delay
            if (num === 12) {
                console.log('REG12 WRITE!', hex8(val));
                this.mem.update_SR(val);
            }
            this.regs.COP0[num] = val;
            return;
        }
        console.log('write to unimplemented COP', COP);
    }

    COP_read_reg(COP, num, val) {
        if (COP === 0) {
            return this.regs.COP0[num];
        }
        console.log('read from unimplemented COP', COP);
        return 0xFF;
    }

    exception(code, branch_delay=false, cop0=false) {
        console.log('EXCEPTION!');
        code <<= 2;
        let vector = 0x80000080;
        if (this.regs.COP0[R3000_COP0_reg.SR] & 0x400000) {
            vector = 0xBFC00180;
        }
        let raddr;
        if (!branch_delay)
            raddr = (this.regs.PC - 4) & 0xFFFFFFFF;
        else
        {
            raddr = this.regs.PC;
            code |= 0x80000000;
        }
        this.regs.COP0[R3000_COP0_reg.EPC] = raddr;
        this.flush_pipe();

        if (cop0)
            vector -= 0x40;

        this.regs.PC = vector;
        this.regs.COP0[R3000_COP0_reg.Cause] = code;
        let lstat = this.regs.COP0[R3000_COP0_reg.SR];
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