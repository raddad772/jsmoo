import {NES_TIMINGS, NES_VARIANTS} from "../nes/nes_common";
import {m6502} from "../../component/cpu/m6502/m6502";
import {NES_joypad} from "../../component/controller/nes_joypad";
import {NES_controllerport} from "../nes/cpu/controller_port";
import {nesm6502_opcodes_decoded} from "../nes/cpu/nesm6502_generated_opcodes";
import {NES_mirror_ppu_horizontal, NES_PPU_mirror_modes} from "../nes/mappers/interface";
import {heapArray8} from "../nes/nes_cart";

import {
    NROM_a12_watch,
    NROM_CPU_read,
    NROM_CPU_write,
    NROM_cycle,
    NROM_PPU_read,
    NROM_PPU_write,
    NROM_reset, NROM_set_cart
} from "./mappers/nrom";
import {nespad_inputs} from "../nes/nes";

export class flatNES {
    // class NES_clock
    clock_master_clock: u64 = 0     // Master clock cycles since restart
    clock_master_frame: u64 = 0
    clock_cpu_master_clock: u64 = 0 // CPU's clock
    clock_ppu_master_clock: u64 = 0 // PPU's clock
    clock_trace_cycles: u64 = 0
    clock_frames_since_restart: u64 = 0

    clock_cpu_frame_cycle: u32 = 0
    clock_ppu_frame_cycle: u32 = 0
    clock_ppu_y: u32 = 0
    clock_frame_odd: u32 = 0
    clock_vblank: u32 = 0

    // class NES_timing
    timing_frame_lines: u32 = 262  // NTSC defaults values
    timing_cpu_divisor: u32 = 12
    timing_ppu_divisor: u32 = 4
    timing_bottom_rendered_line: u32 = 239
    timing_post_render_ppu_idle: u32 = 240
    timing_vblank_start: u32 = 241
    timing_vblank_end: u32 = 261
    timing_ppu_pre_render: u32 = 261

    // class ricoh2A03
    cpu_tracing: bool = false;
    cpu_dma_addr: u32 = 0
    cpu_dma_running: u32 = 0
    cpu_dma_bytes_left: u32 = 0
    cpu_dma_step: u32 = 0
    cpu: m6502 = new m6502(nesm6502_opcodes_decoded);
    cpu_joypad1: NES_joypad = new NES_joypad(1);
    cpu_joypad2: NES_joypad = new NES_joypad(2);
    cpu_controller_port1: NES_controllerport = new NES_controllerport();
    cpu_controller_port2: NES_controllerport = new NES_controllerport();

    // class NES_cart
    cart_header_mapper_number: u32 = 0;
    cart_header_nes_timing: u32 = 0;
    cart_header_submapper: u32 = 0;
    cart_header_mirroring: NES_PPU_mirror_modes = NES_PPU_mirror_modes.Horizontal;
    cart_header_battery_present: u32 = 0;
    cart_header_trainer_present: u32 = 0;
    cart_header_four_screen_mode: u32 = 0;
    cart_header_chr_ram_present: u32 = 0;
    cart_header_chr_rom_size: u32 = 0;
    cart_header_prg_rom_size: u32 = 0;
    cart_header_prg_ram_size: u32 = 0;
    cart_header_prg_nvram_size: u32 = 0;
    cart_header_chr_ram_size: u32 = 0;
    cart_header_chr_nvram_size: u32 = 0;

    cart_valid: bool = false
    cart_PRG_ROM: Uint8Array = new Uint8Array(0)
    cart_CHR_ROM: Uint8Array = new Uint8Array(0)

    // class NES_ppu_io
    ppu_io_nmi_enable: u32 = 0
    ppu_io_sprite_overflow: u32 = 0
    ppu_io_sprite0_hit: u32 = 0
    ppu_io_vram_increment: u32 = 1

    ppu_io_sprite_pattern_table: u32 = 0
    ppu_io_bg_pattern_table: u32 = 0

    ppu_io_v: u32 = 0 // VRAM access address
    ppu_io_t: u32 = 0 // Latch value for VRAM access and PPU scroll
    ppu_io_x: u32 = 0 // Fine X scroll
    ppu_io_w: u32 = 0 // low/high latch

    ppu_io_greyscale: u32 = 0
    ppu_io_bg_hide_left_8: u32 = 0
    ppu_io_sprite_hide_left_8: u32 = 0
    ppu_io_bg_enable: u32 = 0
    ppu_io_sprite_enable: u32 = 0
    ppu_io_OAM_addr: u32 = 0

    ppu_io_emph_r: u32 = 0
    ppu_io_emph_g: u32 = 0
    ppu_io_emph_b: u32 = 0
    ppu_io_emph_bits: u16 = 0

    // class NES_ppu_status
    ppu_status_sprite_height: u32 = 8;
    ppu_status_nmi_out: u32 = 0

    // class NES PPU effectbuffer
    ppu_eb_length: i32
    ppu_eb_items: StaticArray<i64>

    // class NES_PPU_latch
    ppu_latch_VRAM_read: u32 = 0

    ppu_line_cycle: i32 = 0;
    ppu_OAM: StaticArray<u32> = new StaticArray<u32>(256);
    ppu_secondary_OAM: StaticArray<u32> = new StaticArray<u32>(32);
    ppu_secondary_OAM_index: u32 = 0;
    ppu_secondary_OAM_sprite_index: u32 = 0;
    ppu_secondary_OAM_sprite_total: u32 = 0;
    ppu_secondary_OAM_lock: bool = false;

    ppu_OAM_transfer_latch: u32 = 0;
    ppu_OAM_eval_index: u32 = 0;
    ppu_OAM_eval_done: u32 = 0;

    ppu_sprite0_on_next_line: bool = false;
    ppu_sprite0_on_this_line: bool = false;

    ppu_CGRAM: StaticArray<u32> = new StaticArray<u32>(32);

    ppu_bg_fetches0: u32 = 0
    ppu_bg_fetches1: u32 = 0
    ppu_bg_fetches2: u32 = 0
    ppu_bg_fetches3: u32 = 0
    ppu_bg_shifter: u32 = 0;
    ppu_bg_palette_shifter: u32 = 0;
    ppu_bg_tile_fetch_addr: u32 = 0;
    ppu_bg_tile_fetch_buffer: u32 = 0;
    ppu_sprite_pattern_shifters: StaticArray<u32> = new StaticArray<u32>(8);
    ppu_sprite_attribute_latches: StaticArray<u32> = new StaticArray<u32>(8);
    ppu_sprite_x_counters: StaticArray<i32> = new StaticArray<i32>(8);
    ppu_sprite_y_lines: StaticArray<i32> = new StaticArray<i32>(8);
    ppu_last_sprite_addr: u32 = 0;

    ppu_out_buffer: usize = 0

    // mapper interface stuff
    mapper_cycle: (nes: flatNES, howmany: u32)=>void
    mapper_CPU_read: (nes: flatNES, addr: u32, val: u32)=>u32;
    mapper_CPU_write: (nes: flatNES, addr: u32, val: u32)=>void;
    mapper_PPU_read_effect: (nes: flatNES, addr: u32)=>u32;
    mapper_PPU_read_noeffect: (nes: flatNES, addr: u32)=>u32;
    mapper_PPU_write: (nes: flatNES, addr: u32, val: u32)=>void;
    mapper_reset: (nes: flatNES)=>void;
    mapper_set_cart: (nes: flatNES)=>void;
    mapper_a12_watch: (nes: flatNES, addr: u32)=>void;

    // mapper variables
    mirror_ppu_addr: (addr: u32) => u32 = NES_mirror_ppu_horizontal;
    mapper_CHR_ROM: StaticArray<u8>
    mapper_PRG_ROM: StaticArray<u8>
    mapper_CIRAM: StaticArray<u8>
    mapper_CPU_RAM: StaticArray<u8>
    mapper_ppu_mirror: NES_PPU_mirror_modes = NES_PPU_mirror_modes.Horizontal;
    mapper_PRG_ROM_size: u32

    // normal stuff

    variant: NES_VARIANTS

    constructor(variant: NES_VARIANTS, out_buffer: usize) {
        this.variant = variant;

        // Some mapper stuff
        this.mapper_cycle = NROM_cycle;
        this.mapper_CPU_read = NROM_CPU_read;
        this.mapper_CPU_write = NROM_CPU_write;
        this.mapper_PPU_read_effect = NROM_PPU_read;
        this.mapper_PPU_read_noeffect = NROM_PPU_read;
        this.mapper_PPU_write = NROM_PPU_write;
        this.mapper_reset = NROM_reset;
        this.mapper_set_cart = NROM_set_cart;
        this.mapper_a12_watch = NROM_a12_watch;

        // more mapper stuff
        this.mapper_CHR_ROM = new StaticArray<u8>(0x2000);
        this.mapper_PRG_ROM = new StaticArray<u8>(0x8000);
        this.mapper_PRG_ROM_size = 0
        this.mapper_CIRAM = new StaticArray<u8>(0x2000); // PPU RAM
        this.mapper_CPU_RAM = new StaticArray<u8>(0x800);
        this.mapper_ppu_mirror = 0;
        this.cart_header_mapper_number = 0;

        // PPU effect buffer pre-
        let length = 4 * 4;
        this.ppu_eb_items = new StaticArray<i64>(length);

        // NES_clock
        this.timing_set_variant();

        // NES_cart
        this.cart_PRG_ROM = new Uint8Array(0);
        this.cart_CHR_ROM = new Uint8Array(0);

        // PPU effect buffer
        this.ppu_eb_length = <i32>length;
        for (let i: u32 = 0; i < <u32>length; i++) {
            this.ppu_eb_items[i] = -1;
        }

        // PPU
        this.ppu_out_buffer = out_buffer;

        // mapper again
        this.cart_setup_mapper()
        this.reset();
    }

    reset(): void {
        // class NES_clock
        this.clock_cpu_master_clock = 0;
        this.clock_ppu_master_clock = 0;
        this.clock_ppu_y = 0;
        this.clock_master_clock = 0;
        this.clock_master_frame = 0;
        this.clock_trace_cycles = 0;
        this.clock_frames_since_restart = 0;
        this.clock_cpu_frame_cycle = 0;
        this.clock_ppu_frame_cycle = 0;
        this.clock_ppu_y = 0;
        this.clock_frame_odd = 0;

        // class ricoh2A03
        this.cpu_controller_port1.device = this.cpu_joypad1;
        this.cpu_controller_port2.device = this.cpu_joypad2;

        this.cpu.reset();

        // class PPU PPU
        this.ppu_line_cycle = 0;
        this.ppu_io_w = 0;
    }

    cart_load_cart_from_RAM(ibuf: usize, sz: u32): bool {
		let fil: heapArray8 = new heapArray8(ibuf, sz);
		// @ts-ignore
		if ((fil[0] !== 0x4E) || (fil[1] !== 0x45) || (fil[2] !== 0x53) || (fil[3] !== 0x1A)) {
			console.log('Bad iNES header');
			return false;
		}
		let worked: bool;
		// @ts-ignore
		if ((fil[7] & 12) === 8)
			worked = this.cart_read_ines2_header(fil);
		else
			worked = this.cart_read_ines1_header(fil);
		if (!worked) return false;

		this.cart_read_ROM_RAM(fil, 16 + (this.cart_header_trainer_present ? 512 : 0));
		this.cart_valid = worked = this.cart_setup_mapper();
		return worked;
    }

    cart_setup_mapper(): bool {
        switch(this.cart_header_mapper_number) {
            case 0: // no mapper
                //this.bus.mapper = new NES_mapper_none(this.clock, this.bus);
                this.mapper_cycle = NROM_cycle;
                this.mapper_CPU_read = NROM_CPU_read;
                this.mapper_CPU_write = NROM_CPU_write;
                this.mapper_PPU_read_effect = NROM_PPU_read;
                this.mapper_PPU_read_noeffect = NROM_PPU_read;
                this.mapper_PPU_write = NROM_PPU_write;
                this.mapper_reset = NROM_reset;
                this.mapper_set_cart = NROM_set_cart;
                this.mapper_a12_watch = NROM_a12_watch;
                break;
			/*case 1: // MMC1
				this.bus.mapper = new NES_mapper_MMC1(this.clock, this.bus);
				break;
			case 2: // UxROM
				this.bus.mapper = new NES_mapper_UXROM(this.clock, this.bus);
				break;
			case 3: // CxROM
				this.bus.mapper = new NES_mapper_CXROM(this.clock, this.bus);
				break;
			case 4: // MMC3
                this.bus.mapper = new NES_MMC3b(this.clock, this.bus);
                break;
			case 7: // AXROM
				this.bus.mapper = new NES_mapper_AXROM(this.clock, this.bus);
				break;
			case 23: // VRC4
				this.bus.mapper = new NES_mapper_VRC2B_4E_4F(this.clock, this.bus, true);
				break;
			case 206: // DXROM
				this.bus.mapper = new NES_mapper_DXROM(this.clock, this.bus);
				break;*/
            default:
                console.log('Unknown mapper number dawg! ' + this.cart_header_mapper_number.toString());
                return false;
        }
        this.mapper_set_cart(this);

        return true;
    }

    cart_read_ROM_RAM(inp: heapArray8, offset: u32): void {
        this.cart_PRG_ROM = new Uint8Array(this.cart_header_prg_rom_size);
        this.cart_CHR_ROM = new Uint8Array(this.cart_header_chr_rom_size);
		let p: u32 = 0;
		for (let i: u32 = offset, k: u32 = offset+this.cart_header_prg_rom_size; i < k; i++) {
			// @ts-ignore
			this.cart_PRG_ROM[p] = inp[i];
			p++;
		}
		p = 0;
		//this.PRG_ROM.set(inp.slice(offset, offset+this.cart_header_prg_rom_size));
		for (let i: u32 = offset+this.cart_header_prg_rom_size, k=offset+this.cart_header_prg_rom_size+this.cart_header_chr_rom_size; i < k; i++) {
			// @ts-ignore
			this.cart_CHR_ROM[p] = inp[i];
			p++;
		}
		//this.CHR_ROM.set(inp.slice(offset+this.cart_header_prg_rom_size, offset+this.cart_header_prg_rom_size+this.cart_header_chr_rom_size));
		console.log('Read ' + this.cart_PRG_ROM.byteLength.toString() + ' PRG ROM bytes');
		console.log('Read ' + this.cart_CHR_ROM.byteLength.toString() + ' CHR ROM bytes');
    }

    cart_read_ines1_header(fil: heapArray8): bool {
		console.log('iNES version 1 header found');
		// @ts-ignore
		this.cart_header_prg_rom_size = 16384 * fil[4];
		// @ts-ignore
		this.cart_header_chr_rom_size = 8192 * fil[5];
		this.cart_header_chr_ram_present = +(this.cart_header_chr_rom_size === 0);
		if (this.cart_header_chr_ram_present) this.cart_header_chr_ram_size = 8192;
		// @ts-ignore
		this.cart_header_mirroring = fil[6] & 1;
		if (this.cart_header_mirroring === 0) this.cart_header_mirroring = NES_PPU_mirror_modes.Horizontal;
		else this.cart_header_mirroring = NES_PPU_mirror_modes.Vertical;
		// @ts-ignore
		this.cart_header_battery_present = (fil[6] & 2) >>> 1;
		// @ts-ignore
		this.cart_header_trainer_present = (fil[6] & 4) >>> 2;
		// @ts-ignore
		this.cart_header_four_screen_mode = (fil[6] & 8) >>> 3;
		// @ts-ignore
		this.cart_header_mapper_number = (fil[6] >>> 4) | (fil[7] & 0xF0);
		console.log('MAPPER ' + this.cart_header_mapper_number.toString());
		// @ts-ignore
		this.cart_header_prg_ram_size = fil[8] !== 0 ? fil[8] * 8192 : 8192;
		// @ts-ignore
		this.cart_header_nes_timing = (fil[9] & 1) ? NES_TIMINGS.PAL : NES_TIMINGS.NTSC;
		return true;
	}

    cart_read_ines2_header(fil: heapArray8): bool {
		console.log('iNES version 2 header found');
		// @ts-ignore
		let prgrom_msb: u32 = fil[9] & 0x0F;
		// @ts-ignore
		let chrrom_msb: u32 = (fil[9] & 0xF0) >>> 4;
		if (prgrom_msb === 0x0F) {
			// @ts-ignore
			let E = (fil[4] & 0xFC) >>> 2;
			// @ts-ignore
			let M = fil[4] & 0x03;
			this.cart_header_prg_rom_size = (2 ** E) * ((M*2)+1);
		} else {
			// @ts-ignore
			this.cart_header_prg_rom_size = ((prgrom_msb << 8) | fil[4]) * 16384;
		}
		console.log('PRGROM found: ' + (this.cart_header_prg_rom_size / 1024).toString() + 'kb');

		if (chrrom_msb === 0x0F) {
			// @ts-ignore
			let E = (fil[5] & 0xFC) >>> 2;
			// @ts-ignore
			let M = fil[5] & 0x03;
			this.cart_header_chr_rom_size = (2 ** E) * ((M*2)+1);
		} else {
			// @ts-ignore
			this.cart_header_chr_rom_size = ((chrrom_msb << 8) | fil[5]) * 8192;
		}
		console.log('CHR ROM found: ' + (this.cart_header_chr_rom_size).toString());

		// @ts-ignore
		this.cart_header_mirroring = fil[6] & 1;
		// @ts-ignore
		this.cart_header_battery_present = (fil[6] & 2) >>> 1;
		// @ts-ignore
		this.cart_header_trainer_present = (fil[6] & 4) >>> 2;
		// @ts-ignore
		this.cart_header_four_screen_mode = (fil[6] & 8) >>> 3;
		// @ts-ignore
		this.cart_header_mapper_number = (fil[6] >>> 4) | (fil[7] & 0xF0) | ((fil[8] & 0x0F) << 8);
		// @ts-ignore
		this.cart_header_submapper = fil[8] >>> 4;

		// @ts-ignore
		let prg_shift: u32 = fil[10] & 0x0F;
		// @ts-ignore
		let prgnv_shift: u32 = fil[10] >>> 4;
		if (prg_shift !== 0) this.cart_header_prg_ram_size = 64 << prg_shift;
		if (prgnv_shift !== 0) this.cart_header_prg_nvram_size = 64 << prgnv_shift;

		// @ts-ignore
		let chr_shift: u32 = fil[11] & 0x0F;
		// @ts-ignore
		let chrnv_shift: u32 = fil[11] >>> 4;
		if (chr_shift !== 0) this.cart_header_chr_ram_size = 64 << chr_shift;
		if (chrnv_shift !== 0) this.cart_header_chr_nvram_size = 64 << chrnv_shift;
		// @ts-ignore
		switch(fil[12] & 3) {
			case 0:
				this.cart_header_nes_timing = NES_TIMINGS.NTSC;
				break;
			case 1:
				this.cart_header_nes_timing = NES_TIMINGS.PAL;
				break;
			case 2:
				console.log('WTF even is this');
				break;
			case 3:
				this.cart_header_nes_timing = NES_TIMINGS.DENDY;
				break;
		}
		return true;
	}

    cpu_update_inputs(inp1: nespad_inputs, inp2: nespad_inputs): void {
        this.cpu_joypad1.buffer_input(inp1);
        this.cpu_joypad2.buffer_input(inp2);
    }

    cpu_notify_NMI(level: u32): void {
        this.cpu.pins.NMI = +level;
    }

    cpu_notify_IRQ(level: u32): void {
        if ((+level) === 0) this.cpu.IRQ_ack = true;
        else if ((+level) !== this.cpu.pins.IRQ) this.cpu.IRQ_ack = false;
        this.cpu.pins.IRQ = +level;
    }

    cpu_reset(): void {
        this.cpu.reset();
        this.clock_cpu_frame_cycle = 0;
        this.cpu_dma_running = 0;
    }

    cpu_run_cycle(): void {
        // Do DMA if we're engaged in that
        if (this.cpu_dma_running) {
            this.cpu_dma_step++;
            if (this.cpu_dma_step === 1) {
                return;
            }
            this.cpu_dma_step = 0;
            this.ppu_reg_write(0x2004, this.mapper_CPU_read(this, this.cpu_dma_addr, 0));
            this.cpu_dma_bytes_left--;
            this.cpu_dma_addr = (this.cpu_dma_addr + 1) & 0xFFFF;
            if (this.cpu_dma_bytes_left === 0) {
                this.cpu_dma_running = 0;
            }
            return;
        }

        // Service RW pins
        if (!this.cpu.pins.RW) {
            this.cpu.pins.D = this.mapper_CPU_read(this, this.cpu.pins.Addr, this.cpu.pins.D);
            //if (this.tracing) {
                //dbg.traces.add(TRACERS.M6502, this.clock_trace_cycles, trace_format_read('MOS', MOS_COLOR, this.clock_trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
            //}
        }
        this.clock_trace_cycles++;
        this.cpu.cycle();
        if (this.cpu.pins.RW) {
            this.mapper_CPU_write(this, this.cpu.pins.Addr, this.cpu.pins.D);
            /*if (this.tracing) {
                //dbg.traces.add(TRACERS.M6502, this.clock_trace_cycles, trace_format_write('MOS', MOS_COLOR, this.clock_trace_cycles, this.cpu.pins.Addr, this.cpu.pins.D));
            }*/
        }
    }

    //@ts-ignore
    @inline
    cpu_reg_read(addr: u32, val: u32): u32 {
        switch(addr) {
            case 0x4016: // JOYSER0
                return this.cpu_controller_port1.data();
            case 0x4017: // JOYSER1
                return 0;
        }
        return val;
    }

    //@ts-ignore
    @inline
    cpu_reg_write(addr: u32, val: u32): void {
        switch(addr) {
            case 0x4014: //OAMDMA
                this.cpu_dma_addr = val << 8;
                this.cpu_dma_running = 1;
                this.cpu_dma_bytes_left = 256;
                this.cpu_dma_step = 0;
                return;
            case 0x4016: // JOYSER0
                this.cpu_controller_port1.latch(val & 1);
                return;
       }
    }

    timing_set_variant(): void {
        this.timing_post_render_ppu_idle = 240;
        this.timing_vblank_start = 241;
        this.timing_vblank_end = 261;
        this.timing_ppu_pre_render = 261;
        switch(this.variant) {
            case NES_VARIANTS.NTSCU:
            case NES_VARIANTS.NTSCJ:
                this.timing_bottom_rendered_line = 239;
                this.timing_frame_lines = 262;
                this.timing_cpu_divisor = 12;
                this.timing_ppu_divisor = 4;
                break;
            case NES_VARIANTS.PAL:
                this.timing_bottom_rendered_line = 238;
                this.timing_frame_lines = 312;
                this.timing_cpu_divisor = 16;
                this.timing_ppu_divisor = 5;
                break;
        }
    }
    
    // PPU functions
    ppu_write_cgram(addr: u32, val: u32): void {
        this.mapper_a12_watch(this,addr | 0x3F00)
        if ((addr & 0x13) === 0x10) addr &= 0xEF;
        this.ppu_CGRAM[addr & 0x1F] = val & 0x3F;
    }

    ppu_read_cgram(addr: u32): u32 {
      if((addr & 0x13) === 0x10) addr &= 0xEF;
      let data: u32 = this.ppu_CGRAM[addr & 0x1F];
      if(this.ppu_io_greyscale) data &= 0x30;
      return data;
    }

    ppu_mem_write(addr: u32, val: u32): void {
        if ((addr & 0x3FFF) < 0x3F00) this.mapper_PPU_write(this, addr, val);
        else this.ppu_write_cgram(addr, val);
    }

    @inline ppu_rendering_enabled(): bool {
        return this.ppu_io_bg_enable || this.ppu_io_sprite_enable;
    }

    ppu_new_frame(): void {
        this.clock_ppu_y = 0;
        this.clock_frames_since_restart++;
        this.clock_frame_odd = (this.clock_frame_odd + 1) & 1;
        this.clock_master_frame++;
        this.clock_cpu_frame_cycle = 0;
    }

    ppu_new_scanline(): void {
        if (this.clock_ppu_y === this.timing_ppu_pre_render)
            this.ppu_new_frame();
        else {
            this.clock_ppu_y++;
        }

        if (this.clock_ppu_y == this.timing_vblank_start) {
            this.clock_vblank = 1;
            this.ppu_update_nmi();
        }
        else if (this.clock_ppu_y == this.timing_vblank_end) {
            this.clock_vblank = 0;
            this.ppu_update_nmi();
        }
        this.ppu_line_cycle = 0;
    }

    // @ts-ignore
    @inline
    ppu_fetch_chr_line(table: u32, tile: u32, line: u32): u32 {
        let r: u32 = (0x1000 * table) + (tile * 16) + line;
        let low: u32 = this.mapper_PPU_read_effect(this, r);
        let high: u32 = this.mapper_PPU_read_effect(this, r + 8);
        this.ppu_last_sprite_addr = r + 8;
        let output: u32 = 0;
        for (let i = 0; i < 8; i++) {
            output <<= 2;
            output |= (low & 1) | ((high & 1) << 1);
            low >>>= 1;
            high >>>= 1;
        }
        return output;
    }

    // @ts-ignore
    @inline
    ppu_fetch_chr_addr(table: u32, tile: u32, line: u32): u32 {
        return (0x1000 * table) + (tile * 16) + line;
    }

    // @ts-ignore
    @inline
    ppu_fetch_chr_line_low(addr: u32): u32 {
        let low: u32 = this.mapper_PPU_read_effect(this, addr);
        let output: u32 = 0;
        for (let i: u32 = 0; i < 8; i++) {
            output <<= 2;
            output |= (low & 1);
            low >>>= 1;
        }
        return output;
    }

    // @ts-ignore
    @inline
    ppu_fetch_chr_line_high(addr: u32, o: u32): u32 {
        let high: u32 = this.mapper_PPU_read_effect(this, addr + 8);
        let output: u32 = 0;
        for (let i: u32 = 0; i < 8; i++) {
            output <<= 2;
            output |= ((high & 1) << 1);
            high >>>= 1;
        }
        return output | o;
    }
    @inline ppu_perform_bg_fetches(): void { // Only called from prerender and visible scanlines
        const lc = this.ppu_line_cycle;

        // Only do things on odd cycles
        if ((lc & 1) === 0) return;

        let v = this.ppu_io_v;

        const in_tile_y: u32 = (v >>> 12) & 7; // Y position inside tile

        if (((lc > 0) && (lc <= 256)) || (lc > 320)) {
            // Do memory accesses and shifters
            switch (lc & 7) {
                case 1: // nametable, tile #
                    this.ppu_bg_fetches0 = this.mapper_PPU_read_effect(this, 0x2000 | (v & 0xFFF));
                    this.ppu_bg_tile_fetch_addr = this.ppu_fetch_chr_addr(this.ppu_io_bg_pattern_table, this.ppu_bg_fetches0, in_tile_y);
                    //this.bg_tile_fetch_buffer = 0;
                    // Reload shifters if needed
                    if (lc !== 1) { // reload shifter at interval #9 9....257
                        this.ppu_bg_shifter = (this.ppu_bg_shifter >>> 16) | (this.ppu_bg_fetches2 << 16) | (this.ppu_bg_fetches3 << 24);
                        this.ppu_bg_palette_shifter = ((this.ppu_bg_palette_shifter << 2) | this.ppu_bg_fetches1) & 0x0F; //(this.bg_palette_shifter >>> 8) | (this.bg_fetches1 << 8);
                    }
                    return;
                case 3: // attribute table
                    let attrib_addr: u32 = 0x23C0 | (v & 0x0C00) | ((v >>> 4) & 0x38) | ((v >>> 2) & 7);
                    let shift: u32 = ((v >>> 4) & 0x04) | (v & 0x02);
                    this.ppu_bg_fetches1 = (this.mapper_PPU_read_effect(this, attrib_addr) >>> shift) & 3;
                    return;
                case 5: // low buffer
                    this.ppu_bg_tile_fetch_buffer = this.ppu_fetch_chr_line_low(this.ppu_bg_tile_fetch_addr);
                    return;
                case 7: // high buffer
                    this.ppu_bg_tile_fetch_buffer = this.ppu_fetch_chr_line_high(this.ppu_bg_tile_fetch_addr, this.ppu_bg_tile_fetch_buffer);
                    this.ppu_bg_fetches2 = this.ppu_bg_tile_fetch_buffer & 0xFF;
                    this.ppu_bg_fetches3 = this.ppu_bg_tile_fetch_buffer >>> 8;
                    return;
            }
        }
    }

    // Do evaluation of next line of sprites
    ppu_oam_evaluate_slow(): void {
        let odd: u32 = this.ppu_line_cycle & 1;
        let eval_y: u32 = this.clock_ppu_y;
        if (this.ppu_line_cycle < 65) {
            if (this.ppu_line_cycle === 1) {
                this.ppu_secondary_OAM_sprite_total = 0;
                this.ppu_secondary_OAM_index = 0;
                this.ppu_OAM_eval_index = 0;
                this.ppu_secondary_OAM_lock = false;
                this.ppu_OAM_eval_done = 0;
                this.ppu_sprite0_on_next_line = false;
                for (let n = 0; n < 32; n++) {
                    this.ppu_secondary_OAM[n] = 0xFF;
                }
            }
            return;
        }
        if (this.ppu_line_cycle <= 256) { // and >= 65...
            if (this.ppu_OAM_eval_done) return;
            if (!odd) {
                this.ppu_OAM_transfer_latch = this.ppu_OAM[this.ppu_OAM_eval_index];
                if (!this.ppu_secondary_OAM_lock) {
                    this.ppu_secondary_OAM[this.ppu_secondary_OAM_index] = this.ppu_OAM_transfer_latch;
                    if ((eval_y >= this.ppu_OAM_transfer_latch) && (eval_y < (this.ppu_OAM_transfer_latch + this.ppu_status_sprite_height))) {
                        if (this.ppu_OAM_eval_index === 0) this.ppu_sprite0_on_next_line = true;
                        this.ppu_secondary_OAM[this.ppu_secondary_OAM_index + 1] = this.ppu_OAM[this.ppu_OAM_eval_index + 1];
                        this.ppu_secondary_OAM[this.ppu_secondary_OAM_index + 2] = this.ppu_OAM[this.ppu_OAM_eval_index + 2];
                        this.ppu_secondary_OAM[this.ppu_secondary_OAM_index + 3] = this.ppu_OAM[this.ppu_OAM_eval_index + 3];
                        this.ppu_secondary_OAM_index += 4;
                        this.ppu_secondary_OAM_sprite_total++;
                        //this.ppu_secondary_OAM_lock = this.ppu_secondary_OAM_index >= 32;
                        this.ppu_OAM_eval_done |= +(this.ppu_secondary_OAM_index >= 32);
                    }
                }
                this.ppu_OAM_eval_index += 4;
                if (this.ppu_OAM_eval_index >= 256) {
                    this.ppu_OAM_eval_index = 0;
                    this.ppu_secondary_OAM_lock = true;
                    this.ppu_OAM_eval_done = 1;
                }
            }
            return;
        }

        if ((this.ppu_line_cycle >= 257) && (this.ppu_line_cycle <= 320)) { // Sprite tile fetches
            if (this.ppu_line_cycle === 257) { // Do some housekeeping on cycle 257
                this.ppu_sprite0_on_this_line = this.ppu_sprite0_on_next_line;
                this.ppu_secondary_OAM_index = 0;
                this.ppu_secondary_OAM_sprite_index = 0;
                if (!this.ppu_io_sprite_overflow) {
                    // Perform weird sprite overflow glitch
                    let n: u32 = 0;
                    let m: u32 = 0;
                    let f: u32 = 0;
                    while (n < 64) {
                        let e: u32 = this.ppu_OAM[(n * 4) + m];
                        // If value is in range....
                        if ((eval_y >= e) && (eval_y < (e + this.ppu_status_sprite_height))) {
                            // Set overflow flag if needed
                            f++;
                            if (f > 8) {
                                this.ppu_io_sprite_overflow = 1;
                                break;
                            }
                            m = (m + 4) & 0x03;
                            n++;
                        }
                        // Value is not in range...
                        else {
                            n++;
                            m = (m + 4) & 0x03; // Here is the hardware bug. This should be set to 0 instead!
                        }
                    }
                }
            }

            // Sprite data fetches into shift registers
            let sub_cycle = (this.ppu_line_cycle - 257) & 0x07;
            switch (sub_cycle) {
                case 0: // Read Y coordinate.  257
                    let syl: i32 = eval_y - this.ppu_secondary_OAM[this.ppu_secondary_OAM_index];
                    if (syl < 0) syl = 0;
                    if (syl > <i32>(this.ppu_status_sprite_height - 1)) syl = this.ppu_status_sprite_height - 1;
                    this.ppu_sprite_y_lines[this.ppu_secondary_OAM_sprite_index] = syl;
                    this.ppu_secondary_OAM_index++;
                    break;
                case 1: // Read tile number 258, and do garbage NT address
                    this.ppu_sprite_pattern_shifters[this.ppu_secondary_OAM_sprite_index] = this.ppu_secondary_OAM[this.ppu_secondary_OAM_index];
                    this.ppu_secondary_OAM_index++;
                    this.mapper_a12_watch(this, this.ppu_io_v);
                    break;
                case 2: // Read attributes 259
                    this.ppu_sprite_attribute_latches[this.ppu_secondary_OAM_sprite_index] = this.ppu_secondary_OAM[this.ppu_secondary_OAM_index];
                    this.ppu_secondary_OAM_index++;
                    break;
                case 3: // Read X-coordinate 260 and do garbage NT access
                    this.ppu_sprite_x_counters[this.ppu_secondary_OAM_sprite_index] = this.ppu_secondary_OAM[this.ppu_secondary_OAM_index];
                    this.ppu_secondary_OAM_index++;
                    this.mapper_a12_watch(this, this.ppu_io_v);
                    break;
                case 4: // Fetch tiles for the shifters 261
                    break;
                case 5:
                    let tn: u32 = this.ppu_sprite_pattern_shifters[this.ppu_secondary_OAM_sprite_index];
                    let sy: i32 = this.ppu_sprite_y_lines[this.ppu_secondary_OAM_sprite_index];
                    let table: u32 = this.ppu_io_sprite_pattern_table;
                    let attr: u32 = this.ppu_sprite_attribute_latches[this.ppu_secondary_OAM_sprite_index];
                    // Vertical flip....
                    if (attr & 0x80) sy = (this.ppu_status_sprite_height - 1) - sy;
                    if (this.ppu_status_sprite_height === 16) {
                        table = tn & 1;
                        tn &= 0xFE;
                    }
                    if (sy > 7) {
                        sy -= 8;
                        tn += 1;
                    }
                    this.ppu_sprite_pattern_shifters[this.ppu_secondary_OAM_sprite_index] = this.ppu_fetch_chr_line(table, tn, sy);
                    break;
                case 7:
                    this.mapper_a12_watch(this, this.ppu_last_sprite_addr);
                    this.ppu_secondary_OAM_sprite_index++;
                    break;
            }
        }
    }

    // Do sprite counters & memory address updates
    ppu_cycle_scanline_addr(): void {
        const lc = this.ppu_line_cycle;
        let io_v = this.ppu_io_v;
        if (this.clock_ppu_y < this.timing_bottom_rendered_line) {
            // Sprites
            if ((lc > 0) && (lc < 257)) {
                this.ppu_sprite_x_counters[0]--;
                this.ppu_sprite_x_counters[1]--;
                this.ppu_sprite_x_counters[2]--;
                this.ppu_sprite_x_counters[3]--;
                this.ppu_sprite_x_counters[4]--;
                this.ppu_sprite_x_counters[5]--;
                this.ppu_sprite_x_counters[6]--;
                this.ppu_sprite_x_counters[7]--;
            }
        }
        if (!(this.ppu_io_bg_enable | this.ppu_io_sprite_enable) || (lc === 0)) return;
        // Cycle # 8, 16,...248, and 328, 336. BUT NOT 0
        if (lc == 256) {
            if ((io_v & 0x7000) !== 0x7000) { // if fine y !== 7
                io_v += 0x1000;               // add 1 to fine y
            }
            else {                                   // else it is overflow so
                io_v &= 0x8FFF;                 // clear fine y to 0
                let y: u32 = (io_v & 0x03E0) >>> 5;  // get coarse y
                if (y == 29) {                      // y overflows 30->0 with vertical nametable swap
                    y = 0;
                    io_v ^= 0x0800;             // Change vertical nametable
                } else if (y == 31) {               // y also overflows at 31 but without nametable swap
                    y = 0;
                }
                else                                 // just add to coarse scroll
                    y += 1;
                io_v = (io_v & 0xFC1F) | (y << 5); // put scroll back in
            }
            this.ppu_io_v = io_v;
            return;
        }
        if (((lc & 7) == 0) && ((lc >= 328) || (lc <= 256))) {
            // INCREMENT HORIZONTAL SCROLL IN v
            if ((io_v & 0x1F) == 0x1F) // If X scroll is 31...
                this.ppu_io_v = (io_v & 0xFFE0) ^ 0x0400; // clear x scroll to 0 (& FFE0) and swap nametable (^ 0x400)
            else
                this.ppu_io_v++;  // just increment the X scroll
            return;
        }
        // INCREMENT VERTICAL SCROLL IN v
        // Cycles 257...320, copy parts of T to V over and over...
        if ((lc == 257) && this.ppu_rendering_enabled())
            this.ppu_io_v = (this.ppu_io_v & 0xFBE0) | (this.ppu_io_t & 0x41F);
    }

    ppu_cycle_visible(): void {
        let sx: i32 = this.ppu_line_cycle-1;
        let sy: i32 = this.clock_ppu_y;
        let bo: u32 = (sy * 256) + sx;
        if (!this.ppu_rendering_enabled()) {
            if (this.ppu_line_cycle < 256)
                store<u16>(this.ppu_out_buffer+(bo*2), <u16>this.ppu_CGRAM[0] | this.ppu_io_emph_bits);
            return;
        }

        if (this.ppu_line_cycle < 1) {
            if (this.clock_ppu_y == 0)
                this.clock_ppu_frame_cycle = 0;
            return;
        }

        //this.scanline_timer.record_split('startup');

        this.ppu_cycle_scanline_addr();
        this.ppu_oam_evaluate_slow();
        this.ppu_perform_bg_fetches();
        if (this.ppu_line_cycle >= 256) return;

        // Shift out some bits for backgrounds
        let bg_shift: u32 = 0, bg_color: u32 = 0;
        let bg_has_pixel: bool = false;
        if (this.ppu_io_bg_enable) {
            bg_shift = (((sx & 7) + this.ppu_io_x) & 15) * 2;
            bg_color = (this.ppu_bg_shifter >>> bg_shift) & 3;
            bg_has_pixel = bg_color !== 0;
        }
        let sprite_has_pixel: bool = false;
        if (bg_has_pixel) {
            let agb = this.ppu_bg_palette_shifter;
            if (this.ppu_io_x + (sx & 0x07) < 8) agb >>>= 2;
            bg_color = this.ppu_CGRAM[bg_color | ((agb & 3) << 2)];
        }
        else bg_color = this.ppu_CGRAM[0];

        //this.scanline_timer.record_split('bgcolor')

        let sprite_priority = 0;
        let sprite_color = 0;

        // Check if any sprites need drawing
        //for (let m = 0; m < 8; m++) {
        for (let m: i32 = 7; m >= 0; m--) {
            let sxc: i32 = this.ppu_sprite_x_counters[m];
            if ((sxc >= -8) &&
                (sxc <= -1)) {
                let sal: u32 = this.ppu_sprite_attribute_latches[m];
                let sps: u32 = this.ppu_sprite_pattern_shifters[m];
                let s_x_flip: u32 = (sal & 0x40) >>> 6;
                let my_color: u32 = 0;
                if (s_x_flip) {
                    my_color = (sps & 0xC000) >>> 14;
                    this.ppu_sprite_pattern_shifters[m] = sps << 2;
                } else {
                    my_color = sps & 3;
                    this.ppu_sprite_pattern_shifters[m] = sps >>> 2;
                }
                if (my_color !== 0) {
                    sprite_has_pixel = true;
                    my_color |= (sal & 3) << 2;
                    sprite_priority = (sal & 0x20) >>> 5;
                    sprite_color = this.ppu_CGRAM[0x10 + my_color];
                    if ((!this.ppu_io_sprite0_hit) && (this.ppu_sprite0_on_this_line) && (m === 0) && bg_has_pixel && (this.ppu_line_cycle < 256)) {
                        this.ppu_io_sprite0_hit = 1;
                    }
                }
            }
        }
        //this.scanline_timer.record_split('sprite_eval');

        // Decide background or sprite
        let out_color: u32 = bg_color;
        if (this.ppu_io_sprite_enable) {
            if (sprite_color !== 0) {
                if (!bg_has_pixel) {
                    out_color = sprite_color;
                } else {
                    if (!sprite_priority) out_color = sprite_color;
                    else out_color = bg_color;
                }
            }
        }

        store<u16>(this.ppu_out_buffer+(bo*2), <u16>out_color | this.ppu_io_emph_bits);
    }

    ppu_cycle_postrender(): void {
        // 240, (also 241-260)
        // LITERALLY DO NOTHING
        if ((this.clock_ppu_y === this.timing_vblank_start) && (this.ppu_line_cycle === 1)) {
            this.ppu_status_nmi_out = 1;
            this.ppu_update_nmi();
        }
    }

    // Get tile info into shifters using screen X, Y coordinates
    ppu_cycle_prerender(): void {
        if ((this.clock_frame_odd) && (this.ppu_line_cycle === 0)) this.ppu_line_cycle++;
        let lc = this.ppu_line_cycle;
        if (lc === 1) {
            this.ppu_io_sprite0_hit = 0;
            this.ppu_io_sprite_overflow = 0;
            this.ppu_status_nmi_out = 0;
            this.ppu_update_nmi();
        }
        if (this.ppu_rendering_enabled()) {
            if (lc === 257) this.ppu_io_v = (this.ppu_io_v & 0xFBE0) | (this.ppu_io_t & 0x41F);
            if ((this.ppu_rendering_enabled()) && (this.ppu_line_cycle >= 280) && (this.ppu_line_cycle <= 304)) this.ppu_io_v = (this.ppu_io_v & 0x041F) | (this.ppu_io_t & 0x7BE0);
        }
        if (this.ppu_io_sprite_enable && (this.ppu_line_cycle >= 257)) {
            this.ppu_oam_evaluate_slow();
        }
    }

    ppu_render_cycle(): void {
        if (this.clock_ppu_y < this.timing_post_render_ppu_idle) { // 0-239
            this.ppu_cycle_visible();
            return;
        }
        else if (this.clock_ppu_y < this.timing_ppu_pre_render) { // 240-260
            this.ppu_cycle_postrender();
            return;
        }
        this.ppu_cycle_prerender(); // 261
    }

    ppu_cycle(howmany: u32): u32 {
        for (let i: u32 = 0; i < howmany; i++) {
            let r: i64 = this.ppu_eb_get((this.clock_ppu_master_clock / this.timing_ppu_divisor));
            if (r >= 0) {
                this.ppu_io_v = <u32>r;
                this.mapper_a12_watch(this, <u32>r);
            }
            this.ppu_render_cycle();
            this.ppu_line_cycle++;
            this.clock_ppu_frame_cycle++;
            if (this.ppu_line_cycle === 341) this.ppu_new_scanline();
            this.clock_ppu_master_clock += this.timing_ppu_divisor;
        }
        return howmany
    }

    ppu_update_nmi(): void {
        if (this.ppu_status_nmi_out && this.ppu_io_nmi_enable) {
            this.cpu_notify_NMI(1);
        }
        else {
            this.cpu_notify_NMI(0);
        }
    }

    //@ts-ignore
    @inline
    ppu_reg_read(addr: u32, val: u32): u32 {
        let output: u32 = val;
        switch((addr & 7) | 0x2000) {
            case 0x2002:
                output = (this.ppu_io_sprite_overflow << 5) | (this.ppu_io_sprite0_hit << 6) | (this.ppu_status_nmi_out << 7);
                //if (has_effect) {
                    this.ppu_status_nmi_out = 0;
                    this.ppu_update_nmi();

                    this.ppu_io_w = 0;
                //}
                break;
            case 0x2004: // OAMDATA
                output = this.ppu_OAM[this.ppu_io_OAM_addr];
                // reads do not increment counter
                break;
            case 0x2007:
                if (this.ppu_rendering_enabled() && ((this.clock_ppu_y < this.timing_vblank_start) || (this.clock_ppu_y > this.timing_vblank_end))) {
                    return 0;
                }
                if ((this.ppu_io_v & 0x3FF) >= 0x3F00) {
                    output = this.ppu_read_cgram(addr);
                }
                else {
                    output = this.ppu_latch_VRAM_read;
                    this.ppu_latch_VRAM_read = this.mapper_PPU_read_effect(this, this.ppu_io_v & 0x3FFF);
                }
                this.ppu_io_v = (this.ppu_io_v + this.ppu_io_vram_increment) & 0x7FFF;
                break;
            default:
                console.log('READ UNIMPLEMENTED ' + addr.toString(16));
                break;
        }
        return output;
    }

    //@ts-ignore
    @inline
    ppu_reg_write(addr: u32, val: u32): void {
        switch ((addr & 7) | 0x2000) {
            case 0x2000: // PPUCTRL
                this.ppu_io_sprite_pattern_table = (val & 8) >>> 3;
                this.ppu_io_bg_pattern_table = (val & 0x10) >>> 4;
                this.ppu_status_sprite_height = (val & 0x20) >>> 5 ? 16 : 8;
                this.ppu_io_nmi_enable = (val & 0x80) >>> 7;
                this.ppu_io_vram_increment = (val & 4) ? 32 : 1;

                this.ppu_io_t = (this.ppu_io_t & 0x73FF) | ((val & 3) << 10);

                this.ppu_update_nmi();
                return;
            case 0x2001: // PPUMASK
                this.ppu_io_greyscale = val & 1;
                this.ppu_io_bg_hide_left_8 = (val & 2) >>> 1;
                this.ppu_io_sprite_hide_left_8 = (val & 4) >>> 2;
                this.ppu_io_bg_enable = (val & 8) >>> 3;
                this.ppu_io_sprite_enable = (val & 0x10) >>> 4;

                this.ppu_io_emph_r = ((val & 0x20) >>> 5);
                this.ppu_io_emph_g = ((val & 0x40) >>> 6);
                this.ppu_io_emph_b = ((val & 0x80) >>> 7);
                this.ppu_io_emph_bits = <u16>((val & 0xE0) << 1);
                return;
            case 0x2003: // OAMADDR
                this.ppu_io_OAM_addr = val;
                return;
            case 0x2004: // OAMDATA
                this.ppu_OAM[this.ppu_io_OAM_addr] = val;
                this.ppu_io_OAM_addr = (this.ppu_io_OAM_addr + 1) & 0xFF;
                return;
            case 0x2005: // PPUSCROLL
                if (this.ppu_io_w === 0) {
                    this.ppu_io_x = val & 7;
                    this.ppu_io_t = (this.ppu_io_t & 0x7FE0) | (val >>> 3);
                    this.ppu_io_w = 1;
                } else {
                    this.ppu_io_t = (this.ppu_io_t & 0x0C1F) | ((val & 0xF8) << 2) | ((val & 7) << 12);
                    this.ppu_io_w = 0;
                }
                //console.log('AS PPUSCROLL ON LINE ' + this.clock_ppu_y.toString() + ': ' + val.toString() + ', ' + this.ppu_io_t.toString());
                return;
            case 0x2006: // PPUADDR
                if (this.ppu_io_w === 0) {
                    this.ppu_io_t = (this.ppu_io_t & 0xFF) | ((val & 0x3F) << 8);
                    this.ppu_io_w = 1;
                } else {
                    this.ppu_io_t = (this.ppu_io_t & 0x7F00) | val;
                    this.ppu_eb_set((this.clock_ppu_master_clock / this.timing_ppu_divisor) + (3 * this.timing_ppu_divisor), this.ppu_io_t);
                    this.ppu_io_w = 0;
                }
                return;
            case 0x2007: // PPUDATA
                if (this.ppu_rendering_enabled() && ((this.clock_ppu_y < this.timing_vblank_start) || (this.clock_ppu_y > this.timing_vblank_end))) {
                    console.log('REJECT WRITE ' + this.clock_ppu_y.toString() + ' ' + this.ppu_io_sprite_enable.toString() + ' ' + this.ppu_io_bg_enable.toString() + ' ' + this.ppu_io_v.toString(16) + ' ' + val.toString(16));
                    return;
                }
                this.ppu_mem_write(this.ppu_io_v, val);
                this.ppu_io_v = (this.ppu_io_v + this.ppu_io_vram_increment) & 0x7FFF;
                this.mapper_a12_watch(this,this.ppu_io_v & 0x3FFF);
                return;
        }
    }

    //@ts-ignore
    @inline
    ppu_eb_get(cycle: u64): i64 {
        let ci: i32 = <i32>cycle % this.ppu_eb_length;
        let r: i64 = this.ppu_eb_items[ci];
        this.ppu_eb_items[ci] = -1;
        return r;
    }

    //@ts-ignore
    @inline
    ppu_eb_set(cycle: u64, value: u32): void {
        this.ppu_eb_items[<i32>(cycle % this.ppu_eb_length)] = <i64>value;
    }

}