"use strict";

class r5a22DMAChannel {
    constructor() {
        this.reverse_transfer = 0;
        this.HDMA_indirect_addressing = 0;
        this.unused_bit_43x0 = 0;
        this.a_address_fixed = 0;
        this.a_address_decrement = 0;
        this.transfer_mode = 0;
        this.b_address = 0;
        this.a_address = 0;
        this.a_bank = 0;
        this.dma_count_or_hdma_indirect_address = 0;
        this.indirect_bank = 0;
        this.address = 0;
        this.repeat = 0;
        this.line_count = 0;
        this.unknown_byte = 0;
        this.do_transfer = 0;
    }
}

class r5a22DMA {
    constructor(mem_map) {
        this.mem_map = mem_map;

        this.dma_pending = false;
        this.hdma_pending = false;
        this.dma_active = false;

        this.dma_setup_triggered = false;
    }

    reset() {

    }
}