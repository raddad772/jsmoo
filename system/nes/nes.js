"use strict";

const SER_NES = ['clock', 'cart', 'cpu', 'ppu', 'cycles_left']

class NES {
    /**
     * @param {canvas_manager_t} canvas_manager
     */
    constructor(canvas_manager) {
        this.bus = new NES_bus();
        this.clock = new NES_clock();
        this.cart = new NES_cart(this.clock, this.bus);
        this.cpu = new ricoh2A03(this.clock, this.bus);
        this.ppu = new NES_ppu(canvas_manager, this.clock, this.bus);
        this.cycles_left = 0;

        this.display_enabled = true;
        input_config.connect_controller('nes1');
        dbg.add_cpu(D_RESOURCE_TYPES.M6502, this.cpu);
    }

    serialize() {
        let o = {
            version: 1,
            system: 'NES',
            rom_name: ''
        }
        serialization_helper(o, this, SER_NES);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('BAD NES VERSION!');
            return false;
        }
        if (from.system !== 'NES') {
            console.log('WRONG SYSTEM!');
            return false;
        }
        return deserialization_helper(this, from, SER_NES);
    }

    enable_display(to) {
        if (to !== this.display_enabled) {
            this.display_enabled = to;
        }
    }

    killall() {
        dbg.remove_cpu(D_RESOURCE_TYPES.M6502);
        input_config.disconnect_controller('nes1');
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

    update_status(current_frame, current_scanline, current_x) {
        current_frame.innerHTML = this.clock.frames_since_restart;
        current_scanline.innerHTML = this.clock.ppu_y;
        current_x.innerHTML = this.ppu.line_cycle;
    }

    present() {
        if (this.display_enabled)
            this.ppu.present();
    }

    run_frame() {
        let current_frame = this.clock.master_frame;
        while (this.clock.master_frame === current_frame) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }
    }

    catch_up() {}

    step_master(howmany) {
        this.run_cycles(howmany);
    }

    step_scanlines(howmany) {
        for (let i = 0; i < howmany; i++) {
            this.finish_scanline();
            if (dbg.do_break) break;
        }
    }

    finish_scanline() {
        let cpu_step = this.clock.timing.cpu_divisor;
        let ppu_step = this.clock.timing.ppu_divisor;
        let done = 0>>>0;
        let start_y = this.clock.ppu_y;
        while (this.clock.ppu_y === start_y) {
            this.clock.master_clock += cpu_step;
            this.cpu.run_cycle();
            this.cart.mapper.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;
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