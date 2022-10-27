"use strict";

const GB_variants = new Object.freeze({
    GAMEBOY: 0,
    GAMEBOY_COLOR: 1,
    SUPER_GAMEBOY: 2
})

class GB_mapper {
    constructor() {
    }
}

class GB_cart {
    /**
     * @param {GB_clock} clock
     * @param {GB_bus} bus
     */
    constructor(clock, bus) {
        this.clock = clock;
        this.bus = bus;
    }
}

class GB_clock {
    constructor() {
        this.hblank_pending = 0;
        this.ppu_mode = 0; // PPU mode. OAM search, etc.
        this.frames_since_restart = 0;

        this.master_clock = 0;
        this.ppu_master_clock = 0;
        this.cpu_master_clock = 0;

        this.ppu_y = 0;
        this.cpu_frame_cycle = 0;
        this.ppu_frame_cycle = 0;

        this.timing = {
            ppu_divisor: 1,
            cpu_divisor: 4
        }
    }
}

class GB_bus {
    constructor() {
        this.cart = null;
        this.mapper = null;

        this.CPU_read = function(addr, val, has_effect=true) {debugger;};
        this.CPU_write = function(addr, val){debugger;};
    }

}


class GB {
    /**
     * @param {Number} variant
     */
    constructor(variant) {
        this.variant = variant;
        this.bus = new GB_bus();
        this.clock = new GB_clock();
        this.cpu = new GB_CPU(this.variant, this.bus, this.clock);
        this.ppu = new GB_PPU(this.variant, this.bus, this.clock);

        this.cycles_left = 0;
        this.display_enabled = true;

        input_config.connect_controller('gb');
        dbg.add_cpu(D_RESOURCE_TYPES.SM83, this.cpu);
    }

    killall() {
        dbg.remove_cpu(D_RESOURCE_TYPES.SM83);
        input_config.disconnect_controller('gb');
    }

    get_description() {
        let d = new machine_description('GameBoy');
        switch(this.variant) {
            case GB_variants.GAMEBOY_COLOR:
                d.name = 'GameBoy Color';
                break;
            case GB_variants.SUPER_GAMEBOY:
                d.name = 'Super GameBoy';
                break;
        }
        d.technical.standard = 'LCD';
        d.technical.fps = 60;
        d.input_types = [INPUT_TYPES.GB_CONTROLLER];
        d.technical.x_resolution = 160;
        d.technical.y_resolution = 144;
        return d;
    }

    update_status(current_frame, current_scanline, current_x) {
        current_frame.innerHTML = this.clock.frames_since_restart;
        current_scanline.innerHTML = this.clock.ppu_y;
        current_x.innerHTML = this.ppu.line_cycle;
    }

    present() {
        this.ppu.present();
    }

    run_frame() {
        let current_frame = this.clock.frames_since_restart;
        while (this.clock.frames_since_restart === current_frame) {
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
            this.cpu.cycle();
            //this.cart.mapper.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;
            let ppu_left = this.clock.master_clock - this.clock.ppu_master_clock;
            done = 0;
            while (ppu_left >= ppu_step) {
                ppu_left -= ppu_step;
                done++;
            }
            this.ppu.cycle(done);
            this.clock.ppu_master_clock += done * ppu_step;
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
            this.cpu.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;
            let ppu_left = this.clock.master_clock - this.clock.ppu_master_clock;
            done = 0;
            while (ppu_left >= ppu_step) {
                ppu_left -= ppu_step;
                done++;
            }
            this.ppu.cycle(done);
            this.clock.ppu_master_clock += done * ppu_step;
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
        console.log('GB Loading ROM...');
        this.cart.load_cart_from_RAM(ROM);
        this.reset();
    }

}