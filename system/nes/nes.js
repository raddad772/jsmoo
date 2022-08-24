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
        this.card = new nes_cart();

        this.clock = new NES_clock();
        this.cpu = new ricoh2A03(this.clock);
    }
}