"use strict";
/*
  Ricoh 2A03, i.e., the CPU at the heart of the NES.
  It includes:
    * custom M6502 processor with BCD removed
    * Some DMA capabilities
    * Sound output
    * Some memory-mapped registers
 */

class ricoh2A03 {
    /**
     * @param {NES_clock} clock
     */
    constructor(clock) {
        this.cpu = new m6502_t(nesm6502_opcodes_decoded);
        this.cpu.reset();
    }
}