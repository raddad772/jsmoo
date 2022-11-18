"use strict";

const MCS48_variants = Object.freeze({
    i8020: 0,  // 8048 w 13 I/O lines, 1K ROM 64B RAM
    i8021: 1,  // 8048 w 21 I/O lnes, 1K ROM 64B RAM
    i8022: 2,  // 8048 w A/D converter, 2K ROM 64B RAM
    i8035: 3,  // .. 64B RAM
    i8038: 4,  // .. 64B RAM
    i8039: 5,  //  128B RAM
    i8040: 6,  //  256B RAM
    i8048: 7,  // 1K ROM, 64B RAM, 27 IO ports
    i8049: 8,  // 2K ROM, 128B RAM, 27 IO ports
    i8050: 9,  // 4K ROM, 256B RAM
    i8648: 10, // 1K factory OTP EPROM, 64B RAM
    i8748: 11, // 1K EPROM, 64B RAM, 2x 8-bit timers, 27x IO ports
    i8749: 12, // 2K EPROM, 128B RAM, 2x 8-bit timers, 27x IO ports
    i87p50: 13, // ext. ROM socket, 256B RAM,
})

class MCS48_regs {
    constructor() {
        // Registers
        this.PC = 0; // 12-bit PC
        this.SP = 0; // 3-bit SP


        // T0/T1 functionality
        this.TCNT_mode = 0; // 0 = off, 1 = timer, 2 = counter
        this.TCNT = 0; // Timer/counter, 8 bits
        this.TCNT_overflow = 0; // Timer/counter overflow
        this.TCNT_prescaler = 0; // Prescaler for timer mode

        // Internal-to-emulator registers
        this.TCU = 0;

    }
}

class MCS48_pins {
    constructor() {
        this.RD = 0;
        this.WR = 0;
        this.Addr = 0; // 12 pins, multiplexed from 8 Bus and 4 Port 2
        this.D = 0; // Data pins. Abstracted from multiplex with 8 Bus pins
        this.Port1 = 0; // 8-bit bidirectional port
        this.Port2 = 0; // 8-bit bidirectional port
        this.T0 = 0; // Input pin testable with jump
        this.T1 = 0; // Input pin testable with jump/event counter
        this.INT = 0; // Interrupt pin

    }
}