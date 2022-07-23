/*
	// Basically, check for DMA triggers and squashing each other, etc.
	dma_edge() {
		this.counters.dma = 0;
		if (this.status.dma_active) {
			if (this.status.hdma_pending) {
				this.status.hdma_pending = false;
				if (this.hdma_is_enabled()) {
					if (!this.dma_is_enabled()) {
						this.steps_left -= 8 - (this.timing.cycles_since_reset & 7);
						this.clock.cpu_has += 8 - (this.timing.cycles_since_reset & 7);
					}
					if (this.status.hdma_mode === 0) this.dma.hdma_setup();
					else this.dma.hdma_run();
					if (!this.dma_is_enabled()) {
						this.steps_left -= this.counters.dma;
						this.status.dma_active = false;
					}
				}
			}

			if (this.status.dma_pending) {
				this.status.dma_pending = false;
				if (this.dma_is_enabled()) {
					console.log('IS ENABLED!');
					this.steps_left -= 8 - (this.timing.cycles_since_reset & 7);
					this.dma.dma_run();
					this.steps_left -= this.counters.dma;
					this.counters.dma = 0;
					this.status.dma_active = false;
				}
			}
		}

		if (!this.status.dma_active) {
			if (this.status.dma_pending || this.status.hdma_pending) {
				this.status.dma_active = true;
			}
		}
	}*/


	/**
	 * @param {SNEStiming} timing
	 */
/*
	steps(timing) {
		this.timing = timing;
		// Dispatch IRQ, NMI, DMA, CPU cycles, etc.
		if (timing.ppu_y === 0) {
			// HDMA setup
			this.auto_joypad_counter = 33;
		}

		this.steps_left += timing.cycles;
		if (this.steps_left < 0) {
			this.steps_left -= 40; // RAM refresh
			this.clock.cpu_has += 40;
			console.log('SKIPPED WHOLE LINE FROM ' + Math.abs(this.steps_left) + ' STEPS LEFT!');
		}

		while(this.steps_left > 0) {
			let place_in_scanline = (timing.cycles - this.steps_left);

			// Shall we refresh DRAM?
			if ((place_in_scanline >= timing.dram_refresh) && (place_in_scanline < (timing.dram_refresh + 40))) {
				this.steps_left -= 40;
				this.clock.cpu_has += 40;
				place_in_scanline += 40;
				this.alu_cycle(5); // mul/div goes on during DRAM refresh
				// We don't need a continue; here
			}

			// Shall we setup HDMA?
			if (!timing.hdma_setup_triggered && (place_in_scanline >= timing.hdma_setup_position)) {
				timing.hdma_setup_triggered = true;
				this.hdma_reset();
				if (this.hdma_is_enabled()) {
					// Restart-ish HDMA
					this.status.hdma_pending = true;
					this.status.hdma_mode = 0;
				}
			}

			// Shall we execute HDMA?
			if (!timing.hdma_triggered && (place_in_scanline >= timing.hdma_position)) {
				timing.hdma_triggered = true;
				if (this.hdma_is_active()) {
					this.status.hdma_pending = true;
					this.status.hdma_mode = 1;
				}
				// if hdmaActive()    hdma_pending = true. hdma_mode = 1;
			}

			// DMA it out
			if (this.status.dma_pending || this.status.hdma_pending) {
				//console.log('DMA!', this.status.dma_pending, this.status.hdma_pending);
				this.dma_edge();
				continue;
			}
			this.clock.cpu_has += this.counters.dma;
			this.steps_left -= this.counters.dma;
			this.counters.dma = 0;

			switch(RMODES.CPU) {
				case RMODES.HDMA:
					break;
				case RMODES.DMA:
					break;
				case RMODES.CPU:
					this.cpu.cycle();

					this.cpu_addr = (this.cpu.pins.BA << 16) + this.cpu.pins.Addr;
					this.steps_for_CPU_cycle_left = this.cpu.pins.PDV ? SNES_mem_timing(this.cpu_addr, this.ROMspeed) : 6;
					// Do timing info...
					this.service_CPU_cycle();
					break;
			}
		}
	}

 */