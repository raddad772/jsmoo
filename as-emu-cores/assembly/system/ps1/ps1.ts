// 33.8688 MHz / 60
import {
    console_mt_struct,
    input_map_keypoint,
    machine_description,
    MD_STANDARD,
    MD_TIMING,
    systemEmulator
} from "../interface";
import {memkind, MT, PS1_mem} from "./ps1_mem";
import {D_RESOURCE_TYPES, dbg} from "../../helpers/debug";
import {PS1_CPU} from "./ps1_cpu";
import {PS1_GPU} from "./ps1_gpu";
import {PS1_bus, PS1_clock} from "./ps1_misc";
import {framevars_t} from "../../glue/global_player";
import {bigstr_output} from "../../component/cpu/r3000/r3000";
import {run_controllers} from "./ps1_pad";
import {Button} from "./ps1_gamepad";
import {hex8} from "../../helpers/helpers";

const PS1_CYCLES_PER_FRAME_NTSC = 564480
const PS1_CYCLES_PER_FRAME_PAL = 677376

export enum PS1_IRQ {
    VBlank,
    GPU,
    CDROM,
    DMA,
    TMR0,
    TMR1,
    TMR2,
    PadMemCardByteRecv,
    SIO,
    SPU,
    PIOLightpen
}


export class heapArray2 {
    ptr: usize = 0;
	sz: u32 = 0;

	constructor(ptr: usize, sz: u32) {
		this.ptr = ptr;
		this.sz = sz;
	}

	getUint8(addr: u32): u8 {
        return load<u8>(this.ptr+addr);
    }

    getUint32(addr: u32): u32 {
        return load<u32>(this.ptr+addr);
    }

    @operator("[]")
	__get(key: u32): u32 {
		return load<u32>(this.ptr+key);
	}

	@operator("[]=")
	__set(key: u32, value: u32): void {
		store<u32>(this.ptr+key, value);
	}
}


let PS1_inputmap: Array<input_map_keypoint> = new Array<input_map_keypoint>(28);
// up down left right start select l1 l2 r1 r2 circle square triangle x
function fill_PS1_inputmap(): void {
    for (let i = 0; i < 28; i++) {
        let kp = new input_map_keypoint();
        kp.internal_code = i;
        kp.buf_pos = i;
        kp.uber = (i < 14) ? 'p1' : 'p2';
        let k = (i < 14) ? i : i - 14;
        switch(k) {
            case 0:
                kp.name = 'up';
                break;
            case 1:
                kp.name = 'down';
                break;
            case 2:
                kp.name = 'left';
                break;
            case 3:
                kp.name = 'right';
                break;
            case 4:
                kp.name = 'start';
                break;
            case 5:
                kp.name = 'select';
                break;
            case 6:
                kp.name = 'l1';
                break;
            case 7:
                kp.name = 'l2';
                break;
            case 8:
                kp.name = 'r1';
                break;
            case 9:
                kp.name = 'r2';
                break;
            case 10:
                kp.name = 'circle';
                break;
            case 11:
                kp.name = 'square';
                break;
            case 12:
                kp.name = 'triangle';
                break;
            case 13:
                kp.name = 'x';
                break;
        }
        PS1_inputmap[i] = kp;
    }
}
fill_PS1_inputmap();


export class ps1_dualshock_inputs {
    circle: u32 = 0
    square: u32 = 0
    triangle: u32 = 0
    x: u32 = 0
    up: u32 = 0
    down: u32 = 0
    left: u32 = 0
    right: u32 = 0
    start: u32 = 0
    select: u32 = 0
    l1: u32 = 0
    l2: u32 = 0
    r1: u32 = 0
    r2: u32 = 0
}

export class PS1 implements systemEmulator {
    clock: PS1_clock
    bus: PS1_bus = new PS1_bus()
    cpu: PS1_CPU
    gpu: PS1_GPU
    mem: PS1_mem
    playpausetrack: u32 = 1
    cycles_left: i64 = 0;

    //controller1_in: ps1_dualshock_inputs = new ps1_dualshock_inputs();
    //controller2_in: ps1_dualshock_inputs = new ps1_dualshock_inputs();

    framevars: framevars_t = new framevars_t();

    constructor() {
        let mem = new PS1_mem();
        let clock = new PS1_clock();
        let cpu = new PS1_CPU(mem, clock);

        this.gpu = new PS1_GPU();

        dbg.add_cpu(D_RESOURCE_TYPES.R3000, changetype<usize>(cpu.core));
        //this.load_BIOS_from_RAM(BIOS.BIOS)
        cpu.reset();
        this.cpu = cpu;
        this.mem = mem;
        this.clock = clock;

        this.mem.ps1 = this;
        this.gpu.ps1 = this;
        this.mem.cpu = this.cpu.core;
        //this.clock = clock;
    }

    set_irq(from: PS1_IRQ, level: u32): void {
        this.cpu.core.io.I_STAT.set_level(level, from);
        this.cpu.core.update_I_STAT();
    }

    get_description(): machine_description {
        let d = new machine_description();
        d.name = 'PlayStation 1 (AS)';
        d.fps = 60;
        d.timing = MD_TIMING.frame;
        d.standard = MD_STANDARD.NTSC;
        d.x_resolution = 1024;
        d.y_resolution = 512;
        d.xrh = 1024;
        d.xrw = 512;

        d.overscan.top = d.overscan.bottom = d.overscan.left = d.overscan.right = 0;

        d.out_ptr = changetype<usize>(this.mem.VRAM_ab);
        d.out_size = (1024*512*2*2)

        for (let i = 0, k = PS1_inputmap.length; i < k; i++) {
            d.keymap.push(PS1_inputmap[i]);
        }
        return d;
    }

    finish_scanline(): u32 {
        console.log('NOT SUPPORT SCANLINE ADVANCE');
        return 0;
    }

    play(): void { this.gpu.play(this.playpausetrack); }

    pause(): void {
        this.gpu.pause()//this.playpausetrack++);
        this.mem.dump_unknown();
    }

    stop(): void {
        this.gpu.stop();
    }

    get_mt_struct(): console_mt_struct {
        let d = new console_mt_struct();
        d.gp0_ptr = this.gpu.GP0_buffer;
        d.gp1_ptr = this.gpu.GP1_buffer;
        d.mmio_ptr = this.gpu.MMIO_buffer;
        d.vram_ptr = changetype<usize>(this.mem.VRAM_ab);
        return d;
    }


    load_BIOS(what: usize, sz: u32): void {
        console.log('Loading BIOS...')
        this.mem.load_BIOS_from_RAM(what, sz);
        this.mem.BIOS_patch_reset();
    }

    dump_debug(): bigstr_output {
        // NOT USED FOR BG DUMP
        return this.dump_thingy();
        //return this.cpu.core.get_debug_file();
        //console.log('WHAT?');
        //this.mem.dump_unknown();
    }

    dump_thingy(): bigstr_output {
        let d: bigstr_output = new bigstr_output();

        /*for (let i = 0; i < <i32>this.gpu.gp0sendnum; i++) {
            d.add(hex8(this.gpu.gp0send[i]));
        }*/

        return d;
    }

    killall(): void {
        dbg.remove_cpu(D_RESOURCE_TYPES.R3000);
    }

    map_inputs(buffer: usize): void {
        this.mem.controller1.device.set_button_state(Button.DUp, load<u32>((4*0)+buffer));
        this.mem.controller1.device.set_button_state(Button.DDown, load<u32>((4*1)+buffer));
        this.mem.controller1.device.set_button_state(Button.DLeft, load<u32>((4*2)+buffer));
        this.mem.controller1.device.set_button_state(Button.DRight, load<u32>((4*3)+buffer));
        this.mem.controller1.device.set_button_state(Button.Start, load<u32>((4*4)+buffer));
        this.mem.controller1.device.set_button_state(Button.Select, load<u32>((4*5)+buffer));
        this.mem.controller1.device.set_button_state(Button.L1, load<u32>((4*6)+buffer));
        this.mem.controller1.device.set_button_state(Button.L2, load<u32>((4*7)+buffer));
        this.mem.controller1.device.set_button_state(Button.R1, load<u32>((4*8)+buffer));
        this.mem.controller1.device.set_button_state(Button.R2, load<u32>((4*9)+buffer));
        this.mem.controller1.device.set_button_state(Button.Circle, load<u32>((4*10)+buffer));
        this.mem.controller1.device.set_button_state(Button.Square, load<u32>((4*11)+buffer));
        this.mem.controller1.device.set_button_state(Button.Triangle, load<u32>((4*12)+buffer));
        this.mem.controller1.device.set_button_state(Button.Cross, load<u32>((4*13)+buffer));
        this.mem.controller2.device.set_button_state(Button.DUp, load<u32>((4*14)+buffer));
        this.mem.controller2.device.set_button_state(Button.DDown, load<u32>((4*15)+buffer));
        this.mem.controller2.device.set_button_state(Button.DLeft, load<u32>((4*16)+buffer));
        this.mem.controller2.device.set_button_state(Button.DRight, load<u32>((4*17)+buffer));
        this.mem.controller2.device.set_button_state(Button.Start, load<u32>((4*18)+buffer));
        this.mem.controller2.device.set_button_state(Button.Select, load<u32>((4*19)+buffer));
        this.mem.controller2.device.set_button_state(Button.L1, load<u32>((4*20)+buffer));
        this.mem.controller2.device.set_button_state(Button.L2, load<u32>((4*21)+buffer));
        this.mem.controller2.device.set_button_state(Button.R1, load<u32>((4*22)+buffer));
        this.mem.controller2.device.set_button_state(Button.R2, load<u32>((4*23)+buffer));
        this.mem.controller2.device.set_button_state(Button.Circle, load<u32>((4*24)+buffer));
        this.mem.controller2.device.set_button_state(Button.Square, load<u32>((4*25)+buffer));
        this.mem.controller2.device.set_button_state(Button.Triangle, load<u32>((4*26)+buffer));
        this.mem.controller2.device.set_button_state(Button.Cross, load<u32>((4*27)+buffer));
        /*for (let i = 0; i < 28; i++) {
            let v = load<u32>((4*i)+buffer)
            if (v !== 0) {
                console.log('CK' + i.toString());
            }
        }*/
        //this.cpu.update_inputs(this.controller1_in, this.controller2_in);
    }

    load_ROM(name: string, buf: usize, size: u32): void {
        if ((name.toUpperCase().indexOf('.EXE') !== -1) || (name.toUpperCase().indexOf('.PS-EXE') !== -1)) {
            console.log('Loading EXE...');
            this.sideload_EXE(buf, size);
        }
        else {
            console.log('Loading CD....')
            //this.cdrom.load_ROM_from_RAM(ROM);
            this.reset();
        }
    }


    // Closely followed code from https://github.com/RobertPeip/FPSXApp/blob/main/Project/FPSXApp/Memory.cpp#L71-L132
    // With permission from author to not be GPL3'd
    sideload_EXE(buf: usize, sz: u32): void {
        let r = new heapArray2(buf, sz);
        // 80 83 45 88 32 69 88 69
        if ((r.getUint8(0) === 80) && (r.getUint8(1) === 83) && (r.getUint8(2) === 45) &&
            (r.getUint8(3) === 88) && (r.getUint8(4) === 32) && (r.getUint8(5) === 69) &&
            (r.getUint8(6) === 88) && (r.getUint8(7) === 69)) {
            //console.log('START LOAD')
            let initial_pc = r.getUint32(0x10);
            let initial_gp = r.getUint32(0x14);
            let load_addr = r.getUint32(0x18);
            let file_size = r.getUint32(0x1C);
            //console.log('FILE SIZE! ' + file_size.toString() + ' ' + sz.toString());
            let memfill_start = r.getUint32(0x28);
            let memfill_size = r.getUint32(0x2C);
            let initial_sp_base = r.getUint32(0x30);
            let initial_sp_offset = r.getUint32(0x34);
            this.mem.BIOS_patch_reset();

            if (file_size >= 4) {
                file_size = floor<i32>((file_size + 3) / 4);
                let address_read = 0x800;
                let address_write = load_addr & 0x1FFFFF;
                for (let i: u32 = 0; i < file_size; i++) {
                    let data = r.getUint32(address_read);
                    this.mem.write_mem_generic(memkind.MRAM, address_write, MT.u32, data);
                    address_read += 4;
                    address_write += 4;
                }
            }

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

    reset(): void {
        this.cpu.reset();
        //this.gpu.reset();
    }

    step_master(cycles: u32): u32 {
        this.cycles_left = 0;
        this.run_cycles(cycles);
        this.mem.dump_unknown();
        return 0;
    }

    run_cycles(howmany: i32): void {
        this.cycles_left += <i64>howmany;
        let block = 20;
        while (this.cycles_left > 0) {
            if (block < this.cycles_left) block = <i32>this.cycles_left;
            run_controllers(this, block);
            this.cpu.cycle(block);
            this.clock.cycles_left_this_frame -= block;

            if (this.clock.cycles_left_this_frame <= 0) {
                this.clock.cycles_left_this_frame += PS1_CYCLES_PER_FRAME_NTSC;
                this.set_irq(PS1_IRQ.VBlank, 1);
            }

            this.clock.cpu_frame_cycle += block;
            this.clock.cpu_master_clock += block;

            this.clock.master_clock += block;

            this.cycles_left -= block;
            if (dbg.do_break) break;
        }
    }

    get_framevars(): framevars_t {
        let d = new framevars_t();
        d.master_frame = this.clock.master_frame;
        d.x = 0;
        d.scanline = 0;
        d.console = this.cpu.core.console;
        this.cpu.core.console = '';
        return d;
    }

    finish_frame(): u32 {
        //console.log('RUNNING ' + this.clock.cycles_left_this_frame.toString() + ' CYCLES!');
        //this.run_cycles(<i32>this.clock.cycles_left_this_frame);
        this.run_cycles(PS1_CYCLES_PER_FRAME_NTSC);
        return 0;
    }
}