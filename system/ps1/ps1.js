"use strict";

// 33.8688 MHz / 60
const PS1_CYCLES_PER_FRAME_NTSC = 564480
const PS1_CYCLES_PER_FRAME_PAL = 677376

let PS1_inputmap = [];
function fill_PS1_inputmap() {
    for (let i = 0; i < 24; i++) {
        let kp = new md_input_map_keypoint();
        let uber = (i < 12) ? 'p1' : 'p2';
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = uber;
        switch(i) {
            case 0:
            case 12:
                kp.name = 'up';
                break;
            case 1:
            case 13:
                kp.name = 'down';
                break;
            case 2:
            case 14:
                kp.name = 'left';
                break;
            case 3:
            case 15:
                kp.name = 'right';
                break;
            case 4:
            case 16:
                kp.name = 'select';
                break;
            case 5:
            case 17:
                kp.name = 'start';
                break;
            case 6:
            case 18:
                kp.name = 'circle';
                break;
            case 7:
            case 19:
                kp.name = 'square';
                break;
            case 8:
            case 20:
                kp.name = 'triangle';
                break;
            case 9:
            case 21:
                kp.name = 'x';
                break;
            case 10:
            case 22:
                kp.name = 'l';
                break;
            case 11:
            case 23:
                kp.name = 'r';
                break;
        }
        PS1_inputmap[i] = kp;
    }
}
fill_PS1_inputmap();


class PS1_bus {
    constructor() {
    }
}

class PS1_clock {
    constructor() {
        this.master_frame = 0;
        this.draw_x = 0;
        this.draw_y = 0;

        this.trace_cycles = 0;

        this.cycles_left_this_frame = PS1_CYCLES_PER_FRAME_NTSC;

        this.cpu_frame_cycle = 0;
        this.cpu_master_clock = 0;
        this.master_clock = 0;
    }
}

class PS1 {
    /**
     * @param {bios_t} BIOS
     */
    constructor(BIOS) {
        this.clock = new PS1_clock();
        this.bus = new PS1_bus(this.clock);
        this.mem = new PS1_mem();
        this.cpu = new PS1_CPU(this.clock, this.bus, this.mem);
        this.gpu = new PS1_GTE2(this.clock, this.bus);

        this.cycles_left = 0;

        this.controller1_in = new ps1_dualshock_inputs();
        this.controller2_in = new ps1_dualshock_inputs();

        dbg.add_cpu(D_RESOURCE_TYPES.R3000, this.cpu);
        this.load_BIOS_from_RAM(BIOS.BIOS)
        this.cpu.reset();
    }

    /**
     * @param {Uint8Array} inp
     */
    load_BIOS_from_RAM(inp) {
        console.log('Loading BIOS...')
        let src = new Uint32Array(inp);
        let dst = new Uint32Array(this.mem.BIOS_untouched)
        dst.set(src);
        this.mem.BIOS_patch_reset();
    }

    dump_dbg() {
        // NOT USED FOR BG DUMP
        return this.cpu.core.get_debug_file();
    }

    killall() {
        dbg.remove_cpu(D_RESOURCE_TYPES.R3000);
    }

    get_description() {
        let d = new machine_description();
        d.name = 'Sony PlayStation'
        d.timing = MD_TIMING.frame;
        d.standard = MD_STANDARD.NTSC;
        d.fps = 60;
        d.input_types = [INPUT_TYPES.PS1_DUALSHOCK];
        d.x_resolution = 640;
        d.y_resolution = 480;
        d.xrh = 8;
        d.xrw = 7;

        d.overscan.top = 0;
        d.overscan.bottom = 0;
        d.overscan.left = 0;
        d.overscan.right = 0;

        d.output_buffer[0] = this.gpu.output_shared_buffers[0];
        d.output_buffer[1] = this.gpu.output_shared_buffers[1];

        for (let i = 0; i < PS1_inputmap.length; i++) {
            d.keymap.push(PS1_inputmap[i]);
        }

        return d;
    }

    map_inputs(buffer) {
        this.controller1_in.up = buffer[0];
        this.controller1_in.down = buffer[1];
        this.controller1_in.left = buffer[2];
        this.controller1_in.right = buffer[3];
        this.controller1_in.circle = buffer[4];
        this.controller1_in.square = buffer[5];
        this.controller1_in.triangle = buffer[6];
        this.controller1_in.x = buffer[7];
        this.controller1_in.l = buffer[8];
        this.controller1_in.r = buffer[9];
        this.controller1_in.start = buffer[10];
        this.controller1_in.select = buffer[11];
        this.controller2_in.up = buffer[12];
        this.controller2_in.down = buffer[13];
        this.controller2_in.left = buffer[14];
        this.controller2_in.right = buffer[15];
        this.controller2_in.circle = buffer[16];
        this.controller2_in.square = buffer[17];
        this.controller2_in.triangle = buffer[18];
        this.controller2_in.x = buffer[19];
        this.controller2_in.l = buffer[20];
        this.controller2_in.r = buffer[21];
        this.controller2_in.start = buffer[22];
        this.controller2_in.select = buffer[23];
        //this.cpu.update_inputs(this.controller1_in, this.controller2_in);
    }

    load_ROM_from_RAM(name, ROM) {
        if (name.toUpperCase().indexOf('.EXE') !== -1) {
            //this.sideload_EXE(ROM);
        }
        else {
            console.log('Loading CD....')
            this.cdrom.load_ROM_from_RAM(ROM);
            this.reset();
        }
    }

    // Closely followed code from https://github.com/RobertPeip/FPSXApp/blob/main/Project/FPSXApp/Memory.cpp#L71-L132
    // With permission from author to not be GPL3'd
    sideload_EXE(mfile) {
        let r = new DataView(mfile.buffer);
        // 80 83 45 88 32 69 88 69
        if ((r.getUint8(0) === 80) && (r.getUint8(1) === 83) && (r.getUint8(2) === 45) &&
            (r.getUint8(3) === 88) && (r.getUint8(4) === 32) && (r.getUint8(5) === 69) &&
            (r.getUint8(6) === 88) && (r.getUint8(7) === 69)) {
            let initial_pc = r.getUint32(0x10, true);
            let initial_gp = r.getUint32(0x14, true);
            let load_addr = r.getUint32(0x18, true);
            let file_size = r.getUint32(0x1C, true);
            let memfill_start = r.getUint32(0x28);
            let memfill_size = r.getUint32(0x2C);
            let initial_sp_base = r.getUint32(0x30);
            let initial_sp_offset = r.getUint32(0x34);
            this.mem.BIOS_patch_reset();

            if (file_size >= 4) {
                file_size = Math.floor((file_size + 3) / 4);
                let address_read = 0x800;
                let address_write = load_addr & 0x1FFFFF;
                for (let i = 0; i < file_size; i++) {
                    let data = r.getUint32(address_read, true);
                    this.mem.write_mem_generic(PS1_meme.MRAM, address_write, PS1_MT.u32, data);
                    address_read += 4;
                    address_write += 4;
                }
            }
            console.log('Data patched in:', file_size * 4);

            // PC has to  e done first because we can't load it in thedelay slot?
            this.mem.BIOS_patch(0x6FF0, 0x3C080000 | (initial_pc >>> 16));    // lui $t0, (r_pc >> 16)
            this.mem.BIOS_patch(0x6FF4, 0x35080000 | (initial_pc & 0xFFFF));  // ori $t0, $t0, (r_pc & 0xFFFF)
            this.mem.BIOS_patch(0x6FF8, 0x3C1C0000 | (initial_gp >>> 16));    // lui $gp, (r_gp >> 16)
            this.mem.BIOS_patch(0x6FFC, 0x379C0000 | (initial_gp & 0xFFFF));  // ori $gp, $gp, (r_gp & 0xFFFF)

            let r_sp = initial_sp_base + initial_sp_offset;
            if (r_sp !== 0) {
                this.mem.BIOS_patch(0x7000, 0x3C1D0000 | (r_sp >>> 16));   // lui $sp, (r_sp >> 16)
                this.mem.BIOS_patch(0x7004, 0x37BD0000 | (r_sp & 0xFFFF)); // ori $sp, $sp, (r_sp & 0xFFFF)
            } else {
                this.mem.BIOS_patch(0x7000, 0); // NOP
                this.mem.BIOS_patch(0x7004, 0); // NOP
            }

            let r_fp = r_sp;
            if (r_fp !== 0) {
                this.mem.BIOS_patch(0x7008, 0x3C1E0000 | (r_fp >>> 16));   // lui $fp, (r_fp >> 16)
                this.mem.BIOS_patch(0x700C, 0x01000008);                   // jr $t0
                this.mem.BIOS_patch(0x7010, 0x37DE0000 | (r_fp & 0xFFFF)); // // ori $fp, $fp, (r_fp & 0xFFFF)
            } else {
                this.mem.BIOS_patch(0x7008, 0);   // nop
                this.mem.BIOS_patch(0x700C, 0x01000008);                   // jr $t0
                this.mem.BIOS_patch(0x7010, 0); // // nop
            }
            console.log('BIOS patched!');
        }
        else {
            console.log('Could not find valid header')
        }
    }

    reset() {
        this.cpu.reset();
        this.gpu.reset();
    }

    step_master(howmany) {
        this.cycles_left = 0;
        this.run_cycles(howmany);
    }

    run_cycles(howmany) {
        this.cycles_left += howmany;
        while (this.cycles_left > 0) {
            this.clock.cycles_left_this_frame--;
            if (this.clock.cycles_left_this_frame <= 0) {
                this.clock.cycles_left_this_frame += PS1_CYCLES_PER_FRAME_NTSC;
                this.cpu.core.set_interrupt(1);
            }

            this.cpu.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock++;

            this.clock.master_clock++;

            this.cycles_left--;
            if (dbg.do_break) break;
        }
    }

    get_framevars() {
        return {master_frame: this.clock.master_frame, x: this.clock.draw_x, scanline: this.clock.draw_y};
    }

    run_frame() {
        this.run_cycles(this.clock.cycles_left_this_frame);
        return {buffer_num: this.gpu.last_used_buffer }//, sound_buffer: this.apu.output.get_buffer()}
    }
}