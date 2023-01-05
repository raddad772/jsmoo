function saturate5s(v) {
    if (v < 0) return 0;
    else if (v > 0x1f) return 0x1f;
    return v & 0x1F;
}

class PS1_GTE_regs {
    /**
     * @param {PS1_clock} clock
     */
    constructor(clock) {
        this.clock = clock;

        this.op_going = 0;
        this.op_kind = 0; // GTE opcodes here
        this.clock_start = 0; // Clock at time of instruction start
        this.clock_end = 0; // Clock at time of instruction end

        // 64 registers
        this.rregs = new Uint32Array(64);

        // Decomposed for faster evaluation
        this.V0x = this.V0y = this.V0z = 0;
        this.V1x = this.V1y = this.V1z = 0;
        this.V2x = this.V2y = this.V2z = 0;

        this.IR0 = 0;
        this.IR1 = this.IR2 = this.IR3 = 0;
        this.R = this.G = this.B = this.C = 0;
        this.RT11 = this.RT12 = this.RT13 =
            this.RT21 = this.RT22 = this.RT23 =
            this.RT31 = this.RT32 = this.RT33 = 0;
        this.L11 = this.L12 = this.L13 =
            this.L21 = this.L22 = this.L23 =
            this.L31 = this.L32 = this.L33 = 0;
        this.LR11 = this.LR12 = this.LR13 =
            this.LR21 = this.LR22 = this.LR23 =
            this.LR31 = this.LR32 = this.LR33 = 0;
    }

    execute(cmd) {
        switch(cmd) {

        }
        // Update flag
        this.rregs[63] |= (+((this.rregs[63] & 0x7f87e000) !== 0)) << 31;
    }

    write_reg(n, val) {
        // Now update named register sets
        switch(n) {
            case 0:
                this.V0x = (val) >> 16;
                this.V0y = ((val & 0xFFFF) << 16) >> 16;
                return;
            case 1:
                this.V0z = ((val & 0xFFFF) << 16) >> 16;
                return;
            case 2:
                this.V1x = (val) >> 16;
                this.V1y = ((val & 0xFFFF) << 16) >> 16;
                return;
            case 3:
                this.V1z = ((val & 0xFFFF) << 16) >> 16;
                return;
            case 4:
                this.V2x = (val) >> 16;
                this.V2y = ((val & 0xFFFF) << 16) >> 16;
                return;
            case 5:
                this.V2z = ((val & 0xFFFF) << 16) >> 16;
                return;
        }
        this.rregs[n] = val;
    }

    read_reg(n) {
        // Update named register sets we need to
        let val = this.rregs[n];
        switch(n) {
            case 0:
                val = (this.V0x & 0xFFFF) | ((this.V0y & 0xFFFF) << 16);
                break;
            case 1:
                val = this.V0z & 0xFFFF;
                break;
            case 2:
                val = (this.V1x & 0xFFFF) | ((this.V1y & 0xFFFF) << 16);
                break;
            case 3:
                val = this.V1z & 0xFFFF;
                break;
            case 4:
                val = (this.V2x & 0xFFFF) | ((this.V2y & 0xFFFF) << 16);
                break;
            case 5:
                val = this.V2z & 0xFFFF;
                break;
            case 28:
            case 29:
                let a = saturate5s(this.IR1 >> 7);
                let b = saturate5s(this.IR2 >> 7);
                let c = saturate5s(this.IR3 >> 7);

                val = a | (b << 5) | (c << 10);
                break;

        }
        this.rregs[n] = val;
        return val;
    }
}


class PS1_GTE {
    /**
     * @param {R3000_regs_t} regs
     */
    constructor(regs) {
        this.core_regs = regs;
        this.regs = PS1_GTE_regs;
    }
}

