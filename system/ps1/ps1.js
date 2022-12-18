"use strict";

// 33.8688 MHz / 60
const PS1_CYCLES_PER_FRAME = 564480

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

        this.cycles_left_this_frame = PS1_CYCLES_PER_FRAME;

        this.cpu_frame_cycle = 0;
        this.cpu_master_clock = 0;
        this.master_clock = 0;
    }
}

class PS1 {
    constructor() {
        this.bus = new PS1_bus();
        this.clock = new PS1_clock();

        this.cpu = new PS1_CPU(this.clock, this.bus);
        this.gpu = new PS1_GTE2(this.clock, this.bus);

        this.cycles_left = 0;

        this.controller1_in = new ps1_dualshock_inputs();
        this.controller2_in = new ps1_dualshock_inputs();

        this.BIOS = new Uint8Array(0);

        dbg.add_cpu(D_RESOURCE_TYPES.R3000, this.cpu);
    }

    /**
     * @param {Uint8Array} inp
     */
    load_BIOS_from_RAM(inp) {
        this.BIOS = new Uint8Array(inp.byteLength);
        this.BIOS.set(new Uint8Array(inp));
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
        this.cpu.update_inputs(this.controller1_in, this.controller2_in);
    }

    load_ROM_from_RAM(name, ROM) {
        console.log('Loading CD....')
        this.cdrom.load_ROM_from_RAM(ROM);
        this.reset();
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
            if (this.clock.cycles_left_this_frame <= 0) this.clock.cycles_left_this_frame += PS1_CYCLES_PER_FRAME;

            this.cpu.cycle();
            this.clock.cpu_frame_cycle++;
            this.clock.cpu_master_clock += cpu_step;

            this.clock.master_clock++;

            this.cycles_left--;
            if (dbg.do_break) break;
        }
    }

    get_framevars() {
        return {master_frame: this.clock.master_frame, x: this.clock.draw_x, scanline: this.clock.draw_y};
    }

    run_frame() {
        this.run_cycles(this.clock.cycles_left_this_frame;);
        return {buffer_num: this.gpu.last_used_buffer }//, sound_buffer: this.apu.output.get_buffer()}
    }
}