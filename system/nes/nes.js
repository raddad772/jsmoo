class nes_cart {
    function() {
    }
}

class NES_clock {
    function() {

    }
}

class NES {
    constructor(jsanimator) {
        this.cart = new NES_cart();
        this.bus = new NES_bus();
        this.clock = new NES_clock();
        this.cpu = new ricoh2A03(this.clock, this.bus);
        this.ppu = new NES_ppu(this.clock, this.bus);
    }
}