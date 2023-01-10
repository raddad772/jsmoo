///<reference path="../../../node_modules/assemblyscript/std/assembly/index.d.ts"/>
import {hex4, hex8} from "../../helpers/helpers";
import {PS1} from "./ps1";
import {R3000} from "../../component/cpu/r3000/r3000";
import {PS1_clock} from "./ps1_misc";

// @ts-ignore
@inline
function deKSEG(addr: u32) {
    return (addr & 0x1FFFFFFF)>>>0;
}


enum DMA_direction {
    to_ram, from_ram
}

enum DMA_inc {
    increment, decrement
}

enum DMA_mode {
    manual, request, linked_list
}

export enum PS1_DMA_ports {
   MDEC_in,
   MDEC_out,
   GPU,
   cdrom,
   SPU,
   PIO,
   OTC
}


export enum memkind {
    scratchpad,
    MRAM,
    VRAM,
    BIOS
}

export enum MT {
    i8,
    i16,
    i32,
    u8,
    u16,
    u32,
}

function PS1_MT_r(k: u32): string {
    switch(k) {
        case MT.i8: return 'i8';
        case MT.i16: return 'i16';
        case MT.i32: return 'i32';
        case MT.u8: return 'u8';
        case MT.u16: return 'u16';
        case MT.u32: return 'u32';
    }
    unreachable();
}

// @ts-ignore
@inline
function PS1_read_mem(buf: usize, addr: u32, sz: MT): u32 {
    switch(sz) {
        case MT.i8:
            return <u32>load<i8>(buf+addr);
        case MT.i16:
            return <u32>load<i16>(buf+addr);
        case MT.i32:
            return <u32>load<i32>(buf+addr);
        case MT.u8:
            return <u32>load<u8>(buf+addr);
        case MT.u16:
            return <u32>load<u16>(buf+addr);
        case MT.u32:
            return <u32>load<u32>(buf+addr);
        default:
            console.log('BAD SIZE');
            return 0xC0C0C0C0;
    }
}

// @ts-ignore
@inline
function PS1_write_mem(buf: usize, addr: u32, sz: MT, val: u32): void {
    switch(sz) {
        case MT.i8:
            store<i8>(buf+addr, <i8>val);
            return;
        case MT.i16:
            store<i16>(buf+addr, <i16>val);
            return;
        case MT.i32:
            store<i32>(buf+addr, <i32>val);
            return;
        case MT.u8:
            store<u8>(buf+addr, <u8>val);
            return;
        case MT.u16:
            store<u16>(buf+addr, <u16>val);
            return;
        case MT.u32:
            store<u32>(buf+addr, val);
            return;
        default:
            console.log('BAD SIZE');
    }
}

// @ts-ignore
@inline
function PS1_read_memarray<T>(buf: usize, addr: u32): T {
    return load<T>(buf+addr);
}

// @ts-ignore
@inline
function PS1_write_memarray<T>(buf: usize, addr: u32, val: T): void {
    store<T>(buf+addr, val)
}

enum DMAe {
    to_ram,
    from_ram,
    increment,
    decrement,
    manual,
    request,
    linked_list
}

enum DMA_ports {
   MDEC_in,
   MDEC_out,
   GPU,
   cdrom,
   SPU,
   PIO,
   OTC
}

class PS1_DMA_channel {
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

class PS1_DMA {
    control: u32 = 0x7654321;
    irq_enable: u32 = 0
    irq_enable_ch: u32 = 0
    irq_flags_ch: u32 = 0
    irq_force: u32 = 0
    unknown1: u32 = 0
    channels: Array<PS1_DMA_channel> = new Array<PS1_DMA_channel>();
    mem: PS1_mem;

    constructor(mem: PS1_mem) {
        this.mem = mem;

        for (let i: u32 = 0; i < 7; i++) {
            this.channels.push(new PS1_DMA_channel(i));
        }
    }

    irq_status(): u32 {
        return +(this.irq_force || (this.irq_enable && (this.irq_flags_ch & this.irq_enable_ch)));
    }

    write(addr: u32, size: u32, val: u32) {
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
                if (ch.active()) this.mem.do_dma(ch);
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


export class PS1_mem {
    scratchpad_ab: StaticArray<u32> = new StaticArray<u32>(1024/4);

    scratchpad: usize
    MRAM: usize
    VRAM: usize
    BIOS: usize
    MRAM_ab: StaticArray<u32> = new StaticArray<u32>((2 * 1024 * 1024) / 4);
    VRAM_ab: StaticArray<u32> = new StaticArray<u32>((1024 * 1024) / 4);
    BIOS_ab: StaticArray<u32> = new StaticArray<u32>((512 * 1024) / 4);
    BIOS_untouched: StaticArray<u32> = new StaticArray<u32>((512 * 1024) / 4);
    unknown_read_mem: Set<u32> = new Set();
    unknown_wrote_mem: Set<u32> = new Set();

    cpu: R3000|null=null;
    cache_isolated: u32 = 0;

    dma: PS1_DMA
    ps1: PS1|null=null;

    constructor() {
        this.scratchpad = changetype<usize>(this.scratchpad_ab);
        this.MRAM = changetype<usize>(this.MRAM_ab);
        this.VRAM = changetype<usize>(this.VRAM_ab);
        this.BIOS = changetype<usize>(this.BIOS_ab);
        this.dma = new PS1_DMA(this);
    }

    do_dma(ch: PS1_DMA_channel): void {
        // Executes DMA for a channel
        // We'll just do an instant copy for now
        if (ch.sync === DMAe.linked_list)
            this.do_dma_linked_list(ch);
        else
            this.do_dma_block(ch);
        ch.done();
    }

    do_dma_linked_list(ch: PS1_DMA_channel): void {
        let addr = ch.base_addr & 0x1FFFFC;
        if (ch.direction === DMAe.to_ram) {
            console.log('Invalid DMA direction for linked list mode');
            return;
        }

        if (ch.num !== PS1_DMA_ports.GPU) {
            console.log('Invalid DMA dest for linked list mode ' + ch.num.toString());
            return;
        }

        while(true) {
            let header = this.CPU_read(addr, MT.u32, 0);
            let copies = (header >>> 24) & 0xFF;

            while (copies > 0) {
                addr = (addr + 4) & 0x1FFFFC;
                let cmd = this.CPU_read(addr, MT.u32, 0);
                this.ps1!.gpu.gp0(cmd);

                copies--;
            }

            // Following Mednafen on this?
            if ((header & 0x800000) !== 0)
                break;

            addr = header & 0x1FFFFC;
        }
    }

    do_dma_block(ch: PS1_DMA_channel): void {
        let step = (ch.step === DMAe.increment) ? 4 : -4;
        let addr = ch.base_addr;
        let copies = ch.transfer_size();
        if (copies === null) {
            console.log("Couldn't decide DMA transfer size");
            return;
        }

        while (copies > 0) {
            let cur_addr = addr & 0x1FFFFC;
            let src_word: u32 = 0;
            switch(ch.direction) {
                case DMAe.from_ram:
                    src_word = this.CPU_read(cur_addr, MT.u32, 0);
                    switch(ch.num) {
                        case PS1_DMA_ports.GPU:
                            this.ps1!.gpu.gp0(src_word);
                            break;
                        case PS1_DMA_ports.MDEC_in:
                            //this.ps1!.MDEC.command(src_word);
                            break;
                        case PS1_DMA_ports.SPU: // Ignore SPU transfer for now
                            break;
                        default:
                            console.log('UNHANDLED DMA PORT! ' + ch.num.toString());
                            return;
                    }
                    break;
                case DMAe.to_ram:
                    switch(ch.num) {
                        case PS1_DMA_ports.OTC:
                            src_word = (copies === 1) ? 0xFFFFFF : ((addr - 4) & 0x1FFFFF);
                            break;
                        case PS1_DMA_ports.GPU:
                            console.log('unimplemented DMA GPU read');
                            src_word = 0;
                            break;
                        case PS1_DMA_ports.cdrom:
                            //src_word = this.cdrom.dma_read_word();
                            break;
                        case PS1_DMA_ports.MDEC_out:
                            src_word = 0;
                            break;
                        default:
                            console.log('UNKNOWN DMA PORT ' + ch.num.toString());
                            src_word = 0;
                            break;
                    }
                    this.CPU_write(cur_addr, MT.u32, src_word!);
                    break;
            }
            addr = ((addr + step) & 0xFFFFFFFF) >>> 0;
            copies--;
            //this.ps1.cpu.core.cycles_left--;
        }
    }

    load_BIOS_from_RAM(buf: usize, sz: u32): void {
        if (sz > (512*1024)) {
            console.log('bad BIOS image!?');
            return;
        }
        for (let i = 0; i < (sz / 4); i++) {
            this.BIOS_ab[i] = load<u32>(buf+(i*4));
            this.BIOS_untouched[i] = load<u32>(buf+(i*4))
        }
    }

    BIOS_patch(addr: u32, val: u32): void {
        store<u32>(this.BIOS+addr, val);
    }

    BIOS_patch_reset() {
        for (let i = 0; i < this.BIOS_untouched.length; i++) {
            this.BIOS_ab[i] = this.BIOS_untouched[i];
        }
    }

    reset(): void {
        this.BIOS_patch_reset();
        this.cache_isolated = 0;
    }

    @inline
    write_mem_generic(kind: memkind, addr: u32, size: MT, val: u32): void {
        if ((size === MT.i16) || (size === MT.u16))
            val &= 0xFFFF;
        else if ((size === MT.i8) || (size === MT.u8))
            val &= 0xFF;

        switch(kind) {
            case memkind.scratchpad:
                PS1_write_mem(this.scratchpad, addr, size, val);
                return;
            case memkind.MRAM:
                PS1_write_mem(this.MRAM, addr, size, val);
                return;
            case memkind.VRAM:
                PS1_write_mem(this.VRAM, addr, size, val);
                return;
            default:
                console.log('UNKNOWN MEM TYPE');
                return;
        }
    }

    @inline
    read_mem_generic(kind: memkind, addr: u32, size: MT, val: u32): u32 {
        if ((size === MT.i16) || (size === MT.u16))
            addr &= 0xFFFFFFFE;
        else if ((size === MT.i32) || (size === MT.u32))
            addr &= 0xFFFFFFFC;
        switch(kind) {
            case memkind.scratchpad:
                return PS1_read_mem(this.scratchpad, addr, size);
            case memkind.MRAM:
                return PS1_read_mem(this.MRAM, addr, size);
            case memkind.VRAM:
                return PS1_read_mem(this.VRAM, addr, size);
            case memkind.BIOS:
                return PS1_read_mem(this.BIOS, addr, size);
            default:
                console.log('UNKNOWN MEM TYPE');
                return val;
        }
    }

    update_SR(newSR: u32): void {
        this.cache_isolated = +((newSR & 0x10000) === 0x10000);
    }

    dump_unknown() {
        /*let wl = [], rl = [];
        for (let i of this.unknown_wrote_mem) {
            wl.push(hex8(i));
        }
        for (let i of this.unknown_read_mem) {
            rl.push(hex8(i));
        }
        wl = wl.sort();
        rl = rl.sort();
        if (wl.length > 0) console.log('WRITE ADDRS', wl);
        if (rl.length > 0) console.log('READ ADDRS', rl);*/
        console.log('Implement dump_unknown()');
    }

    CPU_write(addr: u32, size: MT, val: u32): void {
        addr = deKSEG(addr);
        if ((addr < 0x800000) && !this.cache_isolated) {
            return this.write_mem_generic(memkind.MRAM, addr & 0x1FFFFF, size, val)
        }
        if (((addr >= 0x1F800000) && (addr <= 0x1F800400)) && !this.cache_isolated)
            return this.write_mem_generic(memkind.scratchpad, addr & 0x3FF, size, val);

        if ((addr >= 0x1F801070) && (addr <= 0x1F801074)) {
            this.cpu!.CPU_write_reg(addr, val);
            return;
        }

        if ((addr >= 0x1F801080) && (addr <= 0x1F8010FF)) {
            this.dma.write(addr, size, val);
            return;
        }

        switch(addr) {
            case 0x00FF1F00: // Invalid addresses
            case 0x00FF1F04:
            case 0x00FF1F08:
            case 0x00FF1F0C:
            case 0x00FF1F2C:
            case 0x00FF1F34:
            case 0x00FF1F3C:
            case 0x00FF1F40:
            case 0x00FF1F4C:
            case 0x00FF1F50:
            case 0x00FF1F60:
            case 0x00FF1F64:
            case 0x00FF1F7C:
                return;
            case 0x1F802041: // F802041h 1 PSX: POST (external 7 segment display, indicate BIOS boot status
                //console.log('WRITE POST STATUS!', val);
                return;
            // ...
            case 0x1F801810: // GP0 Send GP0 Commands/Packets (Rendering and VRAM Access)
                this.ps1!.gpu.gp0(val);
                return;
            case 0x1F801814: // GP0 Send GP0 Commands/Packets (Rendering and VRAM Access)
                this.ps1!.gpu.gp1(val);
                return;
            case 0x1F801C00: //  Voice 0..23 stuff
            case 0x1F801C02:
            case 0x1F801C04:
            case 0x1F801C06:
            case 0x1F801C08:
            case 0x1F801C0A:
            case 0x1F801C10:
            case 0x1F801C12:
            case 0x1F801C14:
            case 0x1F801C16:
            case 0x1F801C18:
            case 0x1F801C1A:
            case 0x1F801C20:
            case 0x1F801C22:
            case 0x1F801C24:
            case 0x1F801C26:
            case 0x1F801C28:
            case 0x1F801C2A:
            case 0x1F801C30:
            case 0x1F801C32:
            case 0x1F801C34:
            case 0x1F801C36:
            case 0x1F801C38:
            case 0x1F801C3A:
            case 0x1F801C40:
            case 0x1F801C42:
            case 0x1F801C44:
            case 0x1F801C46:
            case 0x1F801C48:
            case 0x1F801C4A:
            case 0x1F801C50:
            case 0x1F801C52:
            case 0x1F801C54:
            case 0x1F801C56:
            case 0x1F801C58:
            case 0x1F801C5A:
            case 0x1F801C60:
            case 0x1F801C62:
            case 0x1F801C64:
            case 0x1F801C66:
            case 0x1F801C68:
            case 0x1F801C6A:
            case 0x1F801C70:
            case 0x1F801C72:
            case 0x1F801C74:
            case 0x1F801C76:
            case 0x1F801C78:
            case 0x1F801C7A:
            case 0x1F801C80:
            case 0x1F801C82:
            case 0x1F801C84:
            case 0x1F801C86:
            case 0x1F801C88:
            case 0x1F801C8A:
            case 0x1F801C90:
            case 0x1F801C92:
            case 0x1F801C94:
            case 0x1F801C96:
            case 0x1F801C98:
            case 0x1F801C9A:
            case 0x1F801CA0:
            case 0x1F801CA2:
            case 0x1F801CA4:
            case 0x1F801CA6:
            case 0x1F801CA8:
            case 0x1F801CAA:
            case 0x1F801CB0:
            case 0x1F801CB2:
            case 0x1F801CB4:
            case 0x1F801CB6:
            case 0x1F801CB8:
            case 0x1F801CBA:
            case 0x1F801CC0:
            case 0x1F801CC2:
            case 0x1F801CC4:
            case 0x1F801CC6:
            case 0x1F801CC8:
            case 0x1F801CCA:
            case 0x1F801CD0:
            case 0x1F801CD2:
            case 0x1F801CD4:
            case 0x1F801CD6:
            case 0x1F801CD8:
            case 0x1F801CDA:
            case 0x1F801CE0:
            case 0x1F801CE2:
            case 0x1F801CE4:
            case 0x1F801CE6:
            case 0x1F801CE8:
            case 0x1F801CEA:
            case 0x1F801CF0:
            case 0x1F801CF2:
            case 0x1F801CF4:
            case 0x1F801CF6:
            case 0x1F801CF8:
            case 0x1F801CFA:
            case 0x1F801D00:
            case 0x1F801D02:
            case 0x1F801D04:
            case 0x1F801D06:
            case 0x1F801D08:
            case 0x1F801D0A:
            case 0x1F801D10:
            case 0x1F801D12:
            case 0x1F801D14:
            case 0x1F801D16:
            case 0x1F801D18:
            case 0x1F801D1A:
            case 0x1F801D20:
            case 0x1F801D22:
            case 0x1F801D24:
            case 0x1F801D26:
            case 0x1F801D28:
            case 0x1F801D2A:
            case 0x1F801D30:
            case 0x1F801D32:
            case 0x1F801D34:
            case 0x1F801D36:
            case 0x1F801D38:
            case 0x1F801D3A:
            case 0x1F801D40:
            case 0x1F801D42:
            case 0x1F801D44:
            case 0x1F801D46:
            case 0x1F801D48:
            case 0x1F801D4A:
            case 0x1F801D50:
            case 0x1F801D52:
            case 0x1F801D54:
            case 0x1F801D56:
            case 0x1F801D58:
            case 0x1F801D5A:
            case 0x1F801D60:
            case 0x1F801D62:
            case 0x1F801D64:
            case 0x1F801D66:
            case 0x1F801D68:
            case 0x1F801D6A:
            case 0x1F801D70:
            case 0x1F801D72:
            case 0x1F801D74:
            case 0x1F801D76:
            case 0x1F801D78:
            case 0x1F801D7A: // voice stuff
            case 0x1F801D88: // Voice 0..23 Key ON (Start Attack/Decay/Sustain) (W)
            case 0x1F801D8A: // ..
            case 0x1F801DA2: // Sound RAM Reverb Work Area Start Address
                break;
            case 0x1F801D8C: // Voice 0..23 Key OFF (Start Release) (W)
            case 0x1F801D8E: // ...
            case 0x1F801D90: // Voice 0..23 Channel FM (pitch lfo) mode (R/W)
            case 0x1F801D92: // ..
            case 0x1F801D94: // Voice 0..23 Channel Noise mode (R/W)
            case 0x1F801D96: // ..
            case 0x1F801D98: // Voice 0..23 Channel Reverb mode (R/W)
            case 0x1F801D9A: // ..
            case 0x1F801DA6: // Sound RAM Data Transfer Address
            case 0x1F801DA8: // Sound RAM Data Transfer Fifo
            case 0x1F801DAA: // SPU Control Register (SPUCNT)
            case 0x1F801DAC: // Sound RAM Data Transfer Control
            case 0x1F801DB0: // CD volume L
            case 0x1F801DB2: // CD volume R
            case 0x1F801DB4: // Extern volume L
            case 0x1F801DB6: // Extern volume R
            case 0x1F801000: // Expansion 1 base addr
            case 0x1F801004: // Expansion 2 base addr
            case 0x1F801008: // Expansion 1 delay/size
            case 0x1F80100C: // Expansion 3 delay/size
            case 0x1F801010: // BIOS ROM delay/size
            case 0x1F801014: // SPU_DELAY delay/size
            case 0x1F801018: // CDROM_DELAY delay/size
            case 0x1F80101C: // Expansion 2 delay/size
            case 0x1F801020: // COM_DELAY /size
            case 0x1F801060: // RAM SIZE, 2mb mirrored in first 8mb
            case 0x1F801100: // Timer 0 dotclock
            case 0x1F801104: // ...
            case 0x1F801108: // ...
            case 0x1F801110: // Timer 1 hor. retrace
            case 0x1F801114: // ...
            case 0x1F801118: // ...
            case 0x1F801120: // Timer 2 1/8 system clock
            case 0x1F801124: // ...
            case 0x1F801128: // ...
            case 0x1F801D80: // SPU main vol L
            case 0x1F801D82: // ...R
            case 0x1F801D84: // Reverb output L
            case 0x1F801D86: // ... R
            case 0x1FFE0130: // Cache control
                break;
            default:
                if (!this.cache_isolated) this.unknown_wrote_mem.add(addr);
        }

        //console.log('WRITE TO UNKNOWN LOCATION', this.cache_isolated, hex8(addr), hex8(val));
    }

    CPU_read(addr: u32, size: MT, val: u32, has_effect=true) {
        addr = deKSEG(addr);
        // 2MB MRAM mirrored 4 times
        if (addr < 0x00800000) {
            let r = this.read_mem_generic(memkind.MRAM, addr & 0x1FFFFF, size, val);
            return r;
        }
        // 1F800000 1024kb of scratchpad
        if ((addr >= 0x1F800000) && (addr < 0x1F800400)) {
            return this.read_mem_generic(memkind.scratchpad, addr & 0x3FF, size, val);
        }
        // 1FC00000h 512kb BIOS
        if ((addr >= 0x1FC00000) && (addr < 0x1FC080000)) {
            return this.read_mem_generic(memkind.BIOS, addr & 0x7FFFF, size, val);
        }

        if ((addr >= 0x1F801070) && (addr <= 0x1F801074)) {
            return this.cpu!.CPU_read_reg(addr, size, val);
        }
        if ((addr >= 0x1F801080) && (addr <= 0x1F8010FF)) {
            return this.dma.read(addr, val);
        }

        switch(addr) {
            case 0x00FF1F00: // Invalid addresses?
            case 0x00FF1F04:
            case 0x00FF1F08:
            case 0x00FF1F0C:
            case 0x00FF1F50:
                return 0;
            case 0x1F80101C: // Expansion 2 Delay/size
                return 0x00070777;
            case 0x1F8010A8: // DMA2 GPU thing
            case 0x1F801810: // GP0/GPUREAD
                return this.ps1!.gpu.get_gpuread();
            case 0x1F801814: // GPUSTAT Read GPU Status Register
                return this.ps1!.gpu.get_gpustat();
            case 0x1F801C0C: // Voice 0..23 ADSR Current Volume
            case 0x1F801C1C: //
            case 0x1F801C2C:
            case 0x1F801C3C:
            case 0x1F801C4C:
            case 0x1F801C5C:
            case 0x1F801C6C:
            case 0x1F801C7C:
            case 0x1F801C8C:
            case 0x1F801C9C:
            case 0x1F801CAC:
            case 0x1F801CBC:
            case 0x1F801CCC:
            case 0x1F801CDC:
            case 0x1F801CEC:
            case 0x1F801CFC:
            case 0x1F801D0C:
            case 0x1F801D1C:
            case 0x1F801D2C:
            case 0x1F801D3C:
            case 0x1F801D4C:
            case 0x1F801D5C:
            case 0x1F801D6C:
            case 0x1F801D7C: // ..Voice 0..23 ADSR Current Volume
            case 0x1F801D88: // Voice 0..23 Key ON (Start Attack/Decay/Sustain) (W)
            case 0x1F801D8A: // ..
            case 0x1F801D8C: // Voice 0..23 Key OFF (Start Release) (W)
            case 0x1F801D8E: //  ...
                return 0;
            case 0x1F801DAC: // Sound RAM Data Transfer Control
                return 0;
            case 0x1F801DAA: // SPU Control Register
                return 0;
            case 0x1F801DAE: // SPU Status Register (SPUSTAT) (R)
                return 0;
            case 0x1F000084: // PIO
                break;
            default:
                this.unknown_read_mem.add(addr);
                break;
       }


        //console.log('UNKNOWN READ FROM', hex8(addr));
        switch(size) {
            case MT.u32:
            case MT.i32:
                return 0xFFFFFFFF;
            case MT.u16:
            case MT.i16:
                return 0xFFFF;
            case MT.u8:
            case MT.i8:
                return 0xFF;
        }

    }
}

class u32_dual_return {
    hi: u32 = 0
    lo: u32 = 0
    construct() {
        this.hi = 0;
        this.lo = 0;
    }

    hexhi() {
        return hex4(this.hi);
    }

    hexlo() {
        return hex4(this.lo);
    }
}

function u32_multiply(a: u32, b: u32): u32_dual_return {
    let ret = new u32_dual_return();
    let c = <u64>a
    let d = <u64>b
    let e: u64 = c * d;
    ret.hi = <u32>(e >>> 32);
    ret.lo = <u32>e;
    return ret;
}

function i32_multiply(a: u32, b: u32): u32_dual_return {
    let ret = new u32_dual_return();
    let c: i64 = ((<i64>a) << 32) >> 32;
    let d: i64 = ((<i64>b) << 32) >> 32;
    let e = c * d;
    ret.hi = <u32>(e >> 32);
    ret.lo = <u32>e;
    return ret;
}

function i32_divide(a: u32, b: u32): u32_dual_return
{
    let ret = new u32_dual_return();
    let c: i32 = <i32>a;
    let d: i32 = <i32>b;
    ret.lo = (c / d) & 0xFFFFFFFF
    ret.hi = c % d;
    return ret;
}

function u32_divide(a: u32, b: u32): u32_dual_return {
    let ret = new u32_dual_return();
    let c = a
    let d = b
    ret.lo = (c / d);
    ret.hi = c % d;
    return ret;
}

export class R3000_multiplier_t {
    clock: PS1_clock
    hi: u32 = 0
    lo: u32 = 0

    op1: u32 = 0
    op2: u32 = 0
    op_going: u32 = 0
    op_kind: u32 = 0
    clock_start: u32 = 0
    clock_end: u32 = 0
    constructor(clock: PS1_clock) {
        this.clock = clock;
    }

    set(hi: u32, lo: u32, op1: u32, op2: u32, op_kind: u32, cycles: u32) {
        this.hi = hi;
        this.lo = lo;
        this.op1 = op1;
        this.op2 = op2;

        this.op_going = 1;
        this.op_kind = op_kind;
        this.clock_start = this.clock.cpu_master_clock;
        this.clock_end = this.clock.cpu_master_clock+cycles;
    }

    // Finishes up multiply or divide
    finish() {
        if (!this.op_going)
            return;

        let ret;
        switch(this.op_kind) {
            case 0: // signed multiply
                ret = i32_multiply(this.op1, this.op2);
                break;
            case 1: // unsigned multiply
                ret = u32_multiply(this.op1, this.op2);
                break;
            case 2: // signed divide
                ret = i32_divide(this.op1, this.op2);
                break;
            case 3: // unsigned divide
                ret = u32_divide(this.op1, this.op2);
                break;
            default:
                unreachable();
        }
        this.hi = ret.hi;
        this.hi = ret.lo;

        this.op_going = 0;
    }
}
