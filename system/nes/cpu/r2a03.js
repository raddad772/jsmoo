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
     * @param {NES_bus} bus
     */
    constructor(clock, bus) {
        this.cpu = new m6502_t(nesm6502_opcodes_decoded);
        this.cpu.reset();

        this.bus = bus;

        this.bus.CPU_reg_write = this.reg_write.bind(this);
        this.bus.CPU_reg_read = this.reg_read.bind(this);

        this.clock = clock;

        this.cycles_deficit = 0;
    }

    reg_read(addr, val) {
        return val;
    }

    reg_write(addr, val) {
        switch(addr) {
            case 0x4014: //OAMDMA
                // TODO: make this better
                val <<= 8;
                for (let i = 0; i < 256; i++) {
                    this.bus.PPU_reg_write(0x2004, this.bus.CPU_read(val+i));
                    this.clock.advance_clock_from_cpu(2);
                }
                this.clock.advance_clock_from_cpu(1);
                return;
        }
    }
}