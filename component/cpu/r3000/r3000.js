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

        // Coprocessor registers, of which there are 64
        this.COP0 = [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0
        ]

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
    }

    clear() {
        this.kind = R3000_pipe_kind.empty;
        this.target = this.value = this.new_PC = -1;
        this.op = null;
        this.lr = 0;
        this.lr_val = 0;
        this.lr_mask = 0;
        this.left_bits = this.right_bits = 0;
    }
}

class R3000_pipeline_t {
    constructor() {
        this.head = this.tail = 0;
        this.num_items = 0;
        this.MAX = 4;
        this.MASK = 3;

        /**
         * @type {R3000_pipeline_item_t|null}
         **/
        this.current = null;

        /**
         * @type {R3000_pipeline_item_t[]}
         */
        this.items = [];

        for (let i = 0; i < this.MAX; i++) {
            this.items[i] = new R3000_pipeline_item_t();
        }
    }

    any_there() {
        return this.num_items > 0;
    }

    clear() {
        this.head = this.tail = 0;
        for (let i = 0; i < this.MAX; i++) {
            this.items[i].clear()
        }
        this.num_items = 0;
    }

    empty() {
        return this.num_items === 0;
    }

    full() {
        return this.num_items === this.MAX;
    }

    /**
     * @returns {null|R3000_pipeline_item_t}
     */
    push() {
        if (this.num_items >= this.MAX) {
            console.log('PIPE FULL!');
            return null;
        }
        let r = this.items[this.tail];
        this.tail = (this.tail + 1) & 7;
        this.num_items++;
        return r;
    }

    /**
     * @returns {null|R3000_pipeline_item_t}
     */
    pop() {
        if (this.num_items === 0) return null;
        let r = this.items[this.head];
        this.head = (this.head + 1) & this.MASK;
        this.current = r;
        this.num_items--;
        return r;
    }

    /**
     * @returns {null|R3000_pipeline_item_t}
     */
    peek() {
        if (this.num_items === 0) return null;
        let r = this.items[this.head];
        this.head = (this.head + 1) & this.MASK;
        this.num_items--;
        return r;
    }

}

class R3000 {
    constructor() {
        this.regs = new R3000_regs_t();
        this.bus = new R3000_bus_interface_t();
        this.opcode_table = R3000_generate_opcodes();
    }

    reset() {
        this.bus.pipe.clear();
        this.regs.PC = 0x1FC00000;
        // Fill instruction pipe with enough instructions
        this.fetch_and_decode();
        this.fetch_and_decode();
        // Setup COP0 registers

    }

    cycle() {
        // Pop things off the stack and execute until we get a cycle_advance
        let current = this.bus.pipe.pop();
        if ((current === null) || (current.kind === R3000_pipe_kind.empty)) {
            console.log('PIPE EMPTY!?');
            return;
        }

        // Load delay slot, *OR*. We don't do both.
        if (current.target > 0) {// R0 stays 0
            if (current.lr) {
                let v = (this.regs.R[current.target] & (current.lr_mask ^ 0xFFFFFFFF)) | current.value;
                this.regs.R[current.target] = v;
            }
            else
                this.regs.R[current.target] = current.value;
        }
        else {
            if (current.op !== null)
                current.op.func(current.opcode, current.op, current.op.arg, this.regs, this.bus, current.op.arg);
        }

        // Branch delay slot
        if (current.new_PC > -1)
            this.regs.PC = current.new_PC;

        this.fetch_and_decode();
        current.clear();
    }

    decode(IR, current) {
        // SPECIAL
        let p1 = (IR & 0xFC000000) >>> 26;
        let p2 = (IR & 0x3F);
        if (p1 === 0)
            current.op = this.R3000_op_table[0x3F + p2]
        else
            current.op = this.R3000_op_table[p1]
    }

    fetch_and_decode() {
        let IR = this.bus.mem.CPU_read(this.regs.PC);
        let current = this.bus.pipe.push();
        this.decode(IR, current);
        current.opcode = IR;
        this.regs.PC += 4;
    }
}