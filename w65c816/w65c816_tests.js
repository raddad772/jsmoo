// This file generates test vectors for the 65c816 core.
// This file depends on the pin-centric method of emulation

class wd65c816_pins_expected {
    constructor(D, BA, Addr, RW, VDA, VPA, VPP, extra) {
        if (typeof(extra) === 'undefined') extra = function(regs, pins){return true;};
        this.D = D;
        this.BA = BA;
        this.Addr = Addr;
        this.RW = RW;
        this.VDA = VDA;
        this.VPA = VPA;
        this.VPP = VPP;
        this.extra = extra;
    }

    compare(pins) {
        let failed = false;
        failed |= pins.D !== this.D;
        failed |= pins.BA !== this.BA;
        failed |= pins.Addr !== this.Addr;
        failed |= pins.RW !== this.RW;
        failed |= pins.VDA !== this.VDA;
        failed |= pins.VPA !== this.VPA;
        failed |= pins.VPP !== this.VPP;
        failed |= !this.extra();
        if (failed) {
            console.log('Failure!', pins, this);
        }
        return !failed;
    }
}

function generate_program() {}