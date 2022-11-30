"use strict";

class ARM7_core_t {
    constructor(variant) {
        this.variant = variant;
        this.regs = new ARMregsbank_t();
        this.pins = new ARMpins_t();
    }

    reset() {
        this.regs.set_regs_mode(ARM_modes.SVC);
        this.regs.CPSR.I = this.regs.CPSR.F = 1;
        this.set_ARM_mode();
        this.regs.PC = 0;
    }

    cycle() {
        if (this.regs.IR === ARM_S_DECODE) {

        } else {
            this.exec_func(regs, pins, this.regs.IR);
            if (this.regs.entrypoint === 0) {
                this.regs.IR = ARM_S_DECODE;
            } else {
                // Service memory etc.
            }
        }
    }
}



