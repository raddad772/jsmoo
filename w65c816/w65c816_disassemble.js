class disassembly_output {
    constructor(addr, strout) {
        this.addr = addr;
        this.strout = strout;
        this.pins = {};
        this.regs = {};
    }
}

class w65c816_disassembler {
    constructor() {
        this.buf = new Uint8Array();
        this.addr_mode = 0;
        this.E = 1;
        this.M = 1;
        this.X = 1;
        // ADC AND BIT CMP CPX CPY EOR LDA LDX LDY ORA SBC STA STX STY STZ JMP JSR ASL DEC INC LSR ROL ROR TRB TSB
    }

    w65c816_disassemble(bytes, E, M, X) {
        this.buf = buf_copy(bytes);
        this.E = E;
        this.M = M;
        this.X = X;
        let outstr = "";

    }
}