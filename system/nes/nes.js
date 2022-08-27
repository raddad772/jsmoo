class nes_cart {
    function() {
    }
}

class NES {
    constructor(jsanimator) {
        this.bus = new NES_bus();
        this.clock = new NES_clock();
        this.cart = new NES_cart(this.clock, this.bus);
        this.cpu = new ricoh2A03(this.clock, this.bus);
        this.ppu = new NES_ppu(document.getElementById('snescanvas'), this.clock, this.bus);
        this.cycles_left = 0;

        this.jsanimator = jsanimator;
        this.jsanimator.callback = this.do_frame.bind(this);
    }

    do_frame() {
        if (dbg.frames_til_pause !== 0) {
            dbg.frames_til_pause--;
            ui_el.frames_til_pause.value = dbg.frames_til_pause;
            if (dbg.frames_til_pause === 0) {
                this.jsanimator.pause();
                stop_fps_count();
            }
        }
        for (let i = 0; i < this.clock.timing.frame_lines; i++) {
            this.run_scanline();
        }
        this.ppu.present();
    }

    run_scanline() {
        let to_do = (this.clock.timing.clocks_per_line - this.clock.clocks_this_line);
        this.run_cycles(to_do);
    }

    run_cycles(howmany) {
        this.cycles_left += howmany;
        let cpu_step = this.clock.timing.cpu_divisor;
        let ppu_step = this.clock.timing.ppu_divisor;
        let done = 0>>>0;
        while (this.cycles_left >= cpu_step) {
            this.clock.master_clock += cpu_step;
            this.cpu.run_cycle();
            this.clock.cpu_master_clock += cpu_step;
            this.clock.clocks_this_line += cpu_step;
            let ppu_left = this.clock.master_clock - this.clock.ppu_master_clock;
            done = 0;
            while (ppu_left >= ppu_step) {
                ppu_left -= ppu_step;
                done += ppu_step;
            }
            this.ppu.cycle(done / ppu_step);
            this.clock.ppu_master_clock += done;
            this.cycles_left -= cpu_step;
        }
    }

    reset() {
        this.clock.reset();
        this.cpu.reset();
        this.ppu.reset();
    }

    load_ROM_from_RAM(ROM) {
        console.log('Loading ROM...');
        this.cart.load_cart_from_RAM(ROM);
        this.reset();
    }
}