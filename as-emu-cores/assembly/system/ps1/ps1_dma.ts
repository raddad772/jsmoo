import {hex8} from "../../helpers/helpers";
import {DMAe, PS1_mem} from "./ps1_mem";

// Mostly borrowed from Rustation-ng

export class PS1_DMA_channel {
    num: u32
    enable: u32 = 0
    step: DMAe = DMAe.increment;
    sync: DMAe = DMAe.manual;
    direction: DMAe = DMAe.to_ram;
    trigger: u32 = 0
    chop: u32 = 0
    chop_dma_size: u32 = 0
    chop_cpu_size: u32 = 0
    unknown: u32 = 0
    base_addr: u32 = 0
    block_size: u32 = 0
    block_count: u32 = 0

    constructor(num: u32) {
        this.num = num;
    }

    done(): void {
        this.trigger = 0;
        this.enable = 0;
    }

    transfer_size(): i32 {
        let bs = this.block_size;
        let bc = this.block_count;
        switch(this.sync) {
            case DMAe.manual:
                return bs;
            case DMAe.request:
                return bc * bs;
            case DMAe.linked_list:
                return -1;
        }
        unreachable();
        return -1;
    }

    get_control(): u32 {
        return this.direction |
            (this.step << 1) |
            (this.chop << 8) |
            (this.sync << 9) |
            (this.chop_dma_size << 16) |
            (this.chop_cpu_size << 20) |
            (this.enable << 24) |
            (this.trigger << 28) |
            (this.unknown << 29);
    }

    active(): u32 {
        let enable = (this.sync === DMAe.manual) ? this.trigger : true;
        return enable && this.enable;
    }

    set_control(val: u32): void {
        this.direction = (val & 1) ? DMAe.from_ram : DMAe.to_ram;
        this.step = ((val >>> 1) & 1) ? DMAe.decrement : DMAe.increment;
        this.chop = (val >>> 8) & 1;
        switch ((val >>> 9) & 3) {
            case 0:
                this.sync = DMAe.manual;
                break;
            case 1:
                this.sync = DMAe.request;
                break;
            case 2:
                this.sync = DMAe.linked_list;
                break;
            default:
                console.log('Unknown DMA mode 3');
                break;
        }
        this.chop_dma_size = (val >>> 16) & 7;
        this.chop_cpu_size = (val >>> 20) & 7;
        this.enable = (val >>> 24) & 1;
        this.trigger = (val >>> 28) & 1;
        this.unknown = (val >>> 29) & 3;
    }
}

export class PS1_DMA {
    control: u32 = 0x7654321;
    irq_enable: u32 = 0
    irq_enable_ch: u32 = 0
    irq_flags_ch: u32 = 0
    irq_force: u32 = 0
    unknown1: u32 = 0
    channels: Array<PS1_DMA_channel> = new Array<PS1_DMA_channel>();
    mem: PS1_mem|null=null;

    constructor() {
        for (let i: u32 = 0; i < 7; i++) {
            this.channels.push(new PS1_DMA_channel(i));
        }
    }

    irq_status(): u32 {
        return +(this.irq_force || (this.irq_enable && (this.irq_flags_ch & this.irq_enable_ch)));
    }

    write(addr: u32, size: u32, val: u32): void {
        let ch_num = ((addr - 0x80) & 0x70) >>> 4;
        let reg = (addr & 0x0F);
        let ch_activated = false;
        let ch: PS1_DMA_channel;
        switch(ch_num) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                ch = this.channels[ch_num];
                switch(reg) {
                    case 0:
                        ch.base_addr = val & 0xFFFFF;
                        break;
                    case 4:
                        ch.block_size = val & 0xFFFF
                        ch.block_count = (val >> 16) & 0xFFFF;
                        break;
                    case 8:
                        ch.set_control(val);
                        break;
                    default:
                        console.log('Unimplemented per-channel DMA register write: ' + ch_num.toString() + ' ' + reg.toString() +  hex8(addr));
                        return;
                }
                if (ch.active()) this.mem!.do_dma(ch);
                break;
            case 7: // common registers
                switch(reg) {
                    case 0: // DPCR - DMA Control register 0x1F8010F0:
                        this.control = val;
                        return;
                    case 4: // DICR - DMA Interrupt register case 0x1F8010F4:
                        // Low 5 bits are R/w, we don't know what
                        this.unknown1 = val & 31;
                        this.irq_force = (val >>> 15) & 1;
                        this.irq_enable_ch = (val >>> 16) & 0x7F;
                        this.irq_enable = (val >>> 23) & 1;
                        let to_ack = (val >>> 24) & 0x3F;
                        this.irq_flags_ch &= (to_ack ^ 0x3F);
                        return;
                    default:
                        console.log('Unhandled DMA write: ' + ch_num.toString() + ' ' + reg.toString() + ' '  + hex8(addr));
                        return;
                }
        }
    }

    read(addr: u32, val: u32): u32 {
        let ch_num = ((addr - 0x80) & 0x70) >>> 4;
        let reg = (addr & 0x0F);
        switch(ch_num) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                let ch = this.channels[ch_num];
                switch(reg) {
                    case 0:
                        return ch.base_addr;
                    case 4:
                        return (ch.block_count << 16) | ch.block_size;
                    case 8:
                        return ch.get_control();
                    default:
                        console.log('Unimplemented per-channel DMA register: ' + ch_num.toString() + ' ' + reg.toString() +  hex8(addr));
                        return 0xFFFFFFFF;
                }
            case 7:
                switch(reg) {
                    case 0: // DPCR - DMA control 0x1F8010F0:
                        return this.control;
                    case 4: // DPIR - DMA interrupt control 0x1F8010F4:
                        return this.unknown1 | (this.irq_force << 15) | (this.irq_enable_ch << 16) |
                            (this.irq_enable << 23) | (this.irq_flags_ch << 24) | (this.irq_status() << 31);
                    default:
                        console.log('Unimplemented per-channel DMA register write: ' + ch_num.toString() + ' ' + reg.toString() +  hex8(addr));
                        return 0xFFFFFFFF;
                }

            default:
                console.log('Unhandled DMA read ' + hex8(addr));
        }
        return 0xFFFFFFFF;
    }
}

