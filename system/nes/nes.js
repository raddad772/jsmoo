"use strict";

class NES {
    constructor() {
        this.bus = new NES_bus();
        this.clock = new NES_clock();
        this.cart = new NES_cart(this.clock, this.bus);
        this.cpu = new ricoh2A03(this.clock, this.bus);
        this.ppu = new NES_ppu(document.getElementById('snescanvas'), this.clock, this.bus);
        this.cycles_left = 0;
        this.here = 0;
        input_config.connect_controller('snes1');
    }

    killall() {
        input_config.disconnect_controller('snes1');
    }

	get_description() {
        let d = new machine_description('Nintendo Entertainment System');
        d.technical.standard = 'NTSC';
        d.technical.fps = 60;
        d.input_types = [INPUT_TYPES.SNES_CONTROLLER];
        d.technical.x_resolution = 256;
        d.technical.y_resolution = 240;
        return d;
	}

    present() {
        this.ppu.present();
    }

    run_frame() {
        let current_frame = this.clock.master_frame;
        while (this.clock.master_frame === current_frame) {
            this.run_scanline();
            if (dbg.do_break) break;
        }
        //this.ppu.render_bgtables_from_memory(0, 260, true);
        //this.ppu.render_chr_tables_from_memory(0, 260*3);
    }

    catch_up() {}

    step_master(howmany) {
        this.run_cycles(howmany);
    }

    run_scanline() {
        let cpu_step = this.clock.timing.cpu_divisor;
        let ppu_step = this.clock.timing.ppu_divisor;
        let done = 0>>>0;
        let start_y = this.clock.ppu_y;
        while (this.clock.ppu_y === start_y) {
            this.clock.master_clock += cpu_step;
            this.cpu.run_cycle();
            this.clock.cpu_frame_cycle++;
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
            if (dbg.do_break) break;
        }
    }

    run_cycles(howmany) {
        this.cycles_left += howmany;
        let cpu_step = this.clock.timing.cpu_divisor;
        let ppu_step = this.clock.timing.ppu_divisor;
        let done = 0>>>0;
        while (this.cycles_left >= cpu_step) {
            this.clock.master_clock += cpu_step;
            this.cpu.run_cycle();
            this.clock.cpu_frame_cycle++;
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
            if (dbg.do_break) break;
        }
    }

    reset() {
        this.clock.reset();
        this.cpu.reset();
        this.ppu.reset();
        this.cart.mapper.reset();
    }

    load_ROM_from_RAM(ROM) {
        console.log('Loading ROM...');
        this.cart.load_cart_from_RAM(ROM);
        this.reset();
    }
}