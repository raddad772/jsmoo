"use strict";

/**
 * @param {*} version
 **/

class SNEStiming {
    constructor(version) {
		this.ppu_y = 0;
		this.dots = new Uint8Array(340);
		for (let i = 0; i < 340; i++) {
			this.dots[i] = 4; // 4 master cycles per dot...mostly!
		}
		this.dots[323] = 6;
		this.dots[327] = 6;

		this.frame_since_restart = 0;

		// Technically we start in vblank and hblank but...not gonna trigger CPU first frame. ARE WE?
		// Load up with first-frame data
		this.vblank = false;
		this.vblank_start = false;
		this.hblank_stop = 21;
		this.hblank_start = 277;
		this.dots = 340;
		this.hdma_setup_triggered = false;
		this.frame_lines = 262;
		this.version = version;
		this.dram_refresh = this.version.rev === 1 ? 530 : 538
		this.cycles = 1364;
		this.interlaced = false;
		this.frame = 0;  // 0 or 1 even or odd, basically
		this.cycles_since_reset = 0; // Master cycles since reset. Yeah.
		this.bottom_scanline = 0xE1; // by default
		this.hdma_setup_position = (version.rev === 1 ? 12 + 8 - (this.cycles_since_reset & 7) : 12 + (this.cycles_since_reset & 7));
		this.hdma_setup_triggered = false;

        this.cpu_new_scanline = true;
        this.ppu_new_scanline = true;
        this.apu_new_scanline = true;

		this.hdma_position = 1104;
		this.hdma_triggered = false;

		this.fblank = false;
    }

	set_interlaced(val) {
		this.interlaced = val;
		this.frame_lines = 262 + (1 * (this.interlaced && this.frame === 0));
	}

	new_frame() {
		this.ppu_y = 0;
		this.frame = (this.frame + 1) & 0x01;
		this.frame_lines = 262 + (1 * (this.interlaced && this.frame === 1));
	}

	next_scanline() {
		this.ppu_y += 1;
        this.cpu_new_scanline = true;
        this.ppu_new_scanline = true;
        this.apu_new_scanline = true;
		if (this.ppu_y > 261) this.new_frame();

		this.cycles_since_reset += this.cycles;
		this.cycles = 1364;

		this.vblank_start = false;
        this.hdma_setup_position = 0;
		if (this.ppu_y === 0) {
			// vblank ends
			// 1364 master cycles
			// no output
			this.hdma_setup_position = (this.version.rev === 1 ? 12 + 8 - (this.cycles_since_reset & 7) : 12 + (this.cycles_since_reset & 7));
			this.hdma_setup_triggered = false;
			this.vblank = false;
			this.cycles = 1364;
			this.frame_since_restart++;
		}
		else if ((this.ppu_y > 0) && (this.ppu_y < this.bottom_scanline)) {
			// 1364 master cycles, 324 dots
			this.cycles = 1364;
		}
		else if (this.ppu_y === this.bottom_scanline) {
		    // vblank begins
			this.vblank = true;
			this.vblank_start = true;
			this.cycles = 1364;
		}
		else {
			// during vblank
			this.cycles = 1364;
		}
		if (this.ppu_y === 0xF0 && !this.interlaced) {
			this.cycles = 1360;
		}

		this.hdma_position = 0;
        if (!this.vblank) { // Every visible scanline, hdma
			this.hdma_position = 1104;
			this.hdma_triggered = false;
		}

		this.dram_refresh = 538 - (this.cycles_since_reset & 7);
	}
}


class SNES_clock {
    constructor(version) {
        // The "master clock" against which everything is judged.
        // Things should not go more than a little ahead of this.
        this.version = version;
        this.frames_since_restart = 0;
        this.start_of_scanline = true;
        this.cycles_since_scanline_start = 0;

        this.cpu_step = 12; // Biggest possible CPU step is 12, with the exception of DRAM refresh.
        this.apu_step = 20; // Every 20 cycles, 1 APU cycle
        this.ppu_step = 0; // Every 4 cycles, 1 PPU dot, but we will step it accordingly.

        // How many master clocks we're executed this scanline
        // Note that this doesn't reset to 0 at the end of a scanline,
        //  but should reset to under the "_step" for it.
        this.cpu_has = 0;
        this.apu_has = 0;
        this.ppu_has = 0;

        // How many master clocks we're BEHIND. This number can be negative,
        //  which means don't do anything for that number of cycles.
        this.cpu_deficit = 0;
        this.apu_deficit = 0;
        this.ppu_deficit = 0;
		this.last_autojoypad = 0;

		this.cycles_since_reset = 0;

        // Frame counter
        this.frame_counter = 0;

        this.scanline = new SNEStiming(version);

		this.dma_counter = 0;

		this.scanline_render_due = false;
		this.ppu_display_due = false;
    }

    /**
     * @param {ricoh5A22} cpu
     */
    set_cpu(cpu) {
        this.cpu = cpu;
    }

    /**
     * @param {SNES_slow_1st_PPU} ppu
     */
    set_ppu(ppu) {
        this.ppu = ppu;
    }

    /**
     * @param {spc700} apu
     */
    set_apu(apu) {
        this.apu = apu;
    }

    new_frame() {
        // I forget why I even put this logic in here...delay maybe? 1/0 on that register???
		//console.log('NEW FRAME', this.frames_since_restart+1);
		this.ppu.present();
		this.frames_since_restart++;
    }

	set_fblank(to_what) {
		this.scanline.fblank = to_what;
		//this.scanline.fblank = false;
		//console.log('%c Oh my heavens! ', 'background: #222; color: #bada55');
		//console.log('%c FBLANK: '+ to_what + ' y' + this.scanline.ppu_y, 'background: #222; color: #bada55');
		//dbg.break();
	}

    // This function is called from inside the main CPU scheduler
    advance_steps_from_cpu(howmany) {
        this.start_of_scanline = false;
        this.cpu_deficit -= howmany;
        this.apu_deficit += howmany;
        this.ppu_deficit += howmany;
		this.cpu_has += howmany;
        this.cycles_since_reset += howmany;

		let keycycles = howmany + (this.cycles_since_reset - this.last_autojoypad);
		//console.log('KEYCYCLES:', keycycles, this.cycles_since_reset, this.last_autojoypad);

		if (Math.floor(keycycles / 128) >= 1) {
			while(keycycles > 0) {
				keycycles -= 128;
				this.cpu.auto_joypad_edge();
			}
			this.last_autojoypad = this.cycles_since_reset;
		}

        //console.log('CYCLES SINCE', this.cycles_since_scanline_start,howmany);
		this.cycles_since_scanline_start += howmany;
		/*if (dbg.keep_up_APU) {
				this.apu.catch_up();
		}*/
        if (this.cycles_since_scanline_start >= this.scanline.cycles) {
            //console.log('%c Oh my heavens! ', 'background: #222; color: #bada55');
			// Make sure other processors are caught up
            this.apu.catch_up();
            this.ppu.catch_up();
			this.cycles_since_scanline_start -= this.scanline.cycles;

            this.start_of_scanline = true;
            this.scanline.cycles_since_reset = 0;
			if (this.scanline.ppu_y < (this.scanline.frame_lines-1)) {
				this.ppu.render_scanline();
			}
			this.scanline.next_scanline();
			if (this.scanline.vblank_start) {
				this.ppu_display_due = true;
			}
			this.cycles_since_reset += this.scanline.cycles_since_reset;
            if (this.scanline.frame_since_restart !== this.frame_counter) {
                this.new_frame();
                this.frame_counter = this.scanline.frame_since_restart;
            }
        }
    }
}