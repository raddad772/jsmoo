"use strict";

const ARM_variants = Object.freeze({
    ARM7TDMI: 0,   // GBA
    ARM9: 1,       // DS
    ARM11: 2       // 3DS
})

/*const ARM_regs = Object.freeze([
    'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
    'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15',
    'CPSR',
    'R8_fiq', 'R9_fiq', 'R10_fiq', 'R11_fiq', 'R12_fiq', 'R13_fiq', 'R14_fiq',
    'SPSR_fiq', 'R13_svc', 'R14_svc', 'SPSR_svc',
    'R13_abt', 'R14_abt', 'SPSR_abt',
    'R13_irq', 'R14_irq', 'SPSR_irq',
    'R13_und', 'R14_und', 'SPSR_und',
    'invalid'
]);

function generate_ARM_regs_enum_JS() {
    let outstr = 'const ARMr = Object.freeze({\n';
    for (let i in ARM_regs) {
        let a = ARM_regs[i];
        outstr += '    ' + a + ': ' + i + ',\n';
    }
    outstr += '});'
    return outstr;
}
console.log(generate_ARM_regs_enum_JS());
*/

/*
  10000b 10h 16 - User (non-privileged)
  10001b 11h 17 - FIQ
  10010b 12h 18 - IRQ
  10011b 13h 19 - Supervisor (SWI)
  10111b 17h 23 - Abort
  11011b 1Bh 27 - Undefined
  11111b 1Fh 31 - System (privileged 'User' mode) (ARMv4 and up)
 */
const ARM_modes = Object.freeze({
    USR: 16,
    FIQ: 17,
    IRQ: 18,
    SVC: 19, // Supervisor
    ABT: 23,
    UND: 27,
    SYS: 31
});


const ARMr = Object.freeze({
    R8_norm: 0,
    R9_norm: 1,
    R10_norm: 2,
    R11_norm: 3,
    R12_norm: 4,
    R13_norm: 5,
    R14_norm: 6,
    R8_fiq: 7,
    R9_fiq: 8,
    R10_fiq: 9,
    R11_fiq: 10,
    R12_fiq: 11,
    R13_fiq: 12,
    R14_fiq: 13,
    SPSR_fiq: 14,
    R13_svc: 15,
    R14_svc: 16,
    SPSR_svc: 17,
    R13_abt: 18,
    R14_abt: 19,
    SPSR_abt: 20,
    R13_irq: 21,
    R14_irq: 22,
    SPSR_irq: 23,
    R13_und: 24,
    R14_und: 25,
    SPSR_und: 26,
    invalid: 27
});

class ARM_CPSR_t {
    /*
30    Z - Zero Flag       (0=Not Zero, 1=Zero)                   ; Condition
  29    C - Carry Flag      (0=Borrow/No Carry, 1=Carry/No Borrow) ; Code Flags
  28    V - Overflow Flag   (0=No Overflow, 1=Overflow)            ;/
  27    Q - Sticky Overflow (1=Sticky Overflow, ARMv5TE and up only)
  26-25 Reserved            (For future use) - Do not change manually!
  24    J - Jazelle Mode    (1=Jazelle Bytecode instructions) (if supported)
  23-10 Reserved            (For future use) - Do not change manually!
  9     E - Endian          (... Big endian)                  (ARM11 ?)
  8     A - Abort disable   (1=Disable Imprecise Data Aborts) (ARM11 only)
  7     I - IRQ disable     (0=Enable, 1=Disable)                     ;\
  6     F - FIQ disable     (0=Enable, 1=Disable)                     ; Control
  5     T - State Bit       (0=ARM, 1=THUMB) - Do not change manually!; Bits
  4-0   M4-M0 - Mode Bits   (See below)                               ;/

     */
    constructor() {
        this.N = 0; // Negative 31
        this.Z = 0; // Zero 30
        this.C = 0;  // Carry 29
        this.V = 0; // Overflow 28
        this.Q = 0; // Sticky Overflow, v5TE and up
        // 26-25 reserved
        this.J = 0; // 24 Jazelle mode
        // 13-10 reserved
        this.E = 0; // Little-endian 9
        this.A = 0; // Abort disable. ARM11+ 8
        this.I = 0; // IRQ disable 7
        this.F = 0; // FIQ disable 6
        this.T = 0; // 0 or 1, ARM or THUMB 5
        this.M = 0; // Mode bits, 5 of them 0-4
    }

    priviledged() {
        return (this.M !== ARM_modes.USR);

    }
    exception() {
        return (this.M !== ARM_modes.USR) && (this.M !== ARM_modes.SYS);
    }

    getword() {
        return 0 |
            (this.N << 31) | (this.Z << 30) | (this.C << 29) | (this.V << 28) | (this.Q << 27) |
            (this.J << 24) | (this.E << 9) | (this.A << 8) | (this.I << 7)
            (this.F << 6) | (this.T << 5) | this.M;
    }

    setword(val) {
        this.N = (val >>> 31) & 1;
        this.Z = (val >>> 30) & 1;
        this.C = (val >>> 29) & 1;
        this.V = (val >>> 28) & 1;
        this.Q = (val >>> 27) & 1;
        this.J = (val >>> 24) & 1;
        this.E = (val >>> 9) & 1;
        this.A = (val >>> 8) & 1;
        this.I = (val >>> 7) & 1;
        this.F = (val >>> 6) & 1;
        this.T = (val >>> 5) & 1;
        this.M = val & 0x3F;
    }
}

class ARMins_t {
    constructor() {
        this.addr = 0;
        this.ins = 0;
        this.thumb = 0;
    }
}

class ARMregsbank_t {
    constructor() {
        this.banked = [];
        for (let i = 0; i < 27; i++) {
            this.banked.push(0);
        }
        this.cur = new Array(17); // R0-R15, SPSR
        for (let i = 0; i < 17; i++) {
            this.cur[i] = 0;
        }
        this.carry = 0;
        this.set_regs_mode(ARM_modes.USR);
        this.regs_mode = ARM_modes.USR;
        this.CPSR = new ARM_CPSR_t();

        this.pipe = {
            reload: 1,
            nonsequential: 1,
            fetch: new ARMins_t(),
            decode: new ARMins_t(),
            execute: new ARMins_t(),
        }

        // Temporary variables for functions
        this.rn = 0;
        this.rd = 0;
        this.word = 0;
        this.addr = 0;
        this.mode = 0;

        // TCU = 0 is decode. = 1 is first entrypoint. if reenter != 0, there are more reentry points
        this.reenter = 0;

        this.TCU = 0;
        this.IR = 0; // Current executing instruction's opcode
    }

    set_regs_mode(to) {
        if (to === this.regs_mode) return;
        // Save existing registers
        switch(this.regs_mode) {
            case ARM_modes.USR:
                this.banked[ARMr.R8_norm] = this.cur[8];
                this.banked[ARMr.R9_norm] = this.cur[9];
                this.banked[ARMr.R10_norm] = this.cur[10];
                this.banked[ARMr.R11_norm] = this.cur[11];
                this.banked[ARMr.R12_norm] = this.cur[12];
                this.banked[ARMr.R13_norm] = this.cur[13];
                this.banked[ARMr.R14_norm] = this.cur[14];
                break;
            case ARM_modes.FIQ:
                this.banked[ARMr.R8_fiq] = this.cur[8];
                this.banked[ARMr.R9_fiq] = this.cur[9];
                this.banked[ARMr.R10_fiq] = this.cur[10];
                this.banked[ARMr.R11_fiq] = this.cur[11];
                this.banked[ARMr.R12_fiq] = this.cur[12];
                this.banked[ARMr.R13_fiq] = this.cur[13];
                this.banked[ARMr.R14_fiq] = this.cur[14];
                this.banked[ARMr.SPSR_fiq] = this.cur[16];
                break;
            case ARM_modes.SVC:
                this.banked[ARMr.R13_svc] = this.cur[13];
                this.banked[ARMr.R14_svc] = this.cur[14];
                this.banked[ARMr.SPSR_svc] = this.cur[16];
                break;
            case ARM_modes.ABT:
                this.banked[ARMr.R13_abt] = this.cur[13];
                this.banked[ARMr.R14_abt] = this.cur[14];
                this.banked[ARMr.SPSR_abt] = this.cur[16];
                break;
            case ARM_modes.IRQ:
                this.banked[ARMr.R13_irq] = this.cur[13];
                this.banked[ARMr.R14_irq] = this.cur[14];
                this.banked[ARMr.SPSR_irq] = this.cur[16];
                break;
            case ARM_modes.UND:
                this.banked[ARMr.R13_und] = this.cur[13];
                this.banked[ARMr.R14_und] = this.cur[14];
                this.banked[ARMr.SPSR_und] = this.cur[16];
                break;

        }
        // Load new registers
        switch(to) {
            case ARM_modes.USR:
                this.cur[8] = this.banked[ARMr.R8_norm];
                this.cur[9] = this.banked[ARMr.R9_norm];
                this.cur[10] = this.banked[ARMr.R10_norm];
                this.cur[11] = this.banked[ARMr.R11_norm];
                this.cur[12] = this.banked[ARMr.R12_norm];
                this.cur[13] = this.banked[ARMr.R13_norm];
                this.cur[14] = this.banked[ARMr.R14_norm];
                break;
            case ARM_modes.FIQ:
                this.cur[8] = this.banked[ARMr.R8_fiq];
                this.cur[9] = this.banked[ARMr.R9_fiq];
                this.cur[10] = this.banked[ARMr.R10_fiq];
                this.cur[11] = this.banked[ARMr.R11_fiq];
                this.cur[12] = this.banked[ARMr.R12_fiq];
                this.cur[13] = this.banked[ARMr.R13_fiq];
                this.cur[14] = this.banked[ARMr.R14_fiq];
                this.cur[16] = this.banked[ARMr.SPSR_fiq];
                break;
            case ARM_modes.SVC:
                this.cur[13] = this.banked[ARMr.R13_svc];
                this.cur[14] = this.banked[ARMr.R14_svc];
                this.cur[16] = this.banked[ARMr.SPSR_svc];
                break;
            case ARM_modes.ABT:
                this.cur[13] = this.banked[ARMr.R13_abt];
                this.cur[14] = this.banked[ARMr.R14_abt];
                this.cur[16] = this.banked[ARMr.SPSR_abt];
                break;
            case ARM_modes.IRQ:
                this.cur[13] = this.banked[ARMr.R13_irq];
                this.cur[14] = this.banked[ARMr.R14_irq];
                this.cur[16] = this.banked[ARMr.SPSR_irq];
                break;
            case ARM_modes.UND:
                this.cur[13] = this.banked[ARMr.R13_und];
                this.cur[14] = this.banked[ARMr.R14_und];
                this.cur[16] = this.banked[ARMr.SPSR_und];
                break;
            default:
                console.log('Unknown mode for register bank: ' + to);
                return;
        }
    }
}
