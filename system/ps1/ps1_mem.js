"use strict";

 /*
  1F800000h 400h Scratchpad (1K Fast RAM) (Data Cache mapped to fixed address)

  */

const PS1_meme = Object.freeze({
    scratchpad: 0,
    MRAM: 1,
    VRAM: 2,
    BIOS: 3,
});

const PS1_MT_r = ['i8', 'i16', 'i32', 'u8', 'u16', 'u32']

const PS1_MT = Object.freeze({
    i8: 0,
    i16: 1,
    i32: 2,
    u8: 3,
    u16: 4,
    u32: 5
})

/**
 * @param {DataView} buf
 * @param {Number} addr
 * @param {Number} sz
 * @returns {Number}
 */
function PS1_read_mem(buf, addr, sz) {
    switch(sz) {
        case PS1_MT.i8:
            return buf.getInt8(addr);
        case PS1_MT.i16:
            return buf.getInt16(addr, true);
        case PS1_MT.i32:
            return buf.getInt32(addr, true);
        case PS1_MT.u8:
            return buf.getUint8(addr);
        case PS1_MT.u16:
            return buf.getUint16(addr, true);
        case PS1_MT.u32:
            return buf.getUint32(addr, true);
        default:
            console.log('BAD SIZE');
            return null;
    }
}

/**
 * @param {DataView} buf
 * @param {Number} addr
 * @param {Number} sz
 * @param {Number} val
 */
function PS1_write_mem(buf, addr, sz, val) {
    switch(sz) {
        case PS1_MT.i8:
            return buf.setInt8(addr, val);
        case PS1_MT.i16:
            return buf.setInt16(addr, val,true);
        case PS1_MT.i32:
            return buf.setInt32(addr, val,true);
        case PS1_MT.u8:
            return buf.setUint8(addr, val);
        case PS1_MT.u16:
            return buf.setUint16(addr, val,true);
        case PS1_MT.u32:
            return buf.setUint32(addr, val,true);
    }
}

const PS1_DMAe = Object.freeze({
    to_ram: 0,
    from_ram: 1,
    increment: 0,
    decrement: 1,
    manual: 0,
    request: 1,
    linked_list: 2
})

const PS1_DMA_ports = Object.freeze({
   MDEC_in: 0,
   MDEC_out: 1,
   GPU: 2,
   cdrom: 3,
   SPU: 4,
   PIO: 5,
   OTC: 6
});

class PS1_DMA_channel {
    constructor(num) {
        this.num = num;
        this.enable = 0;
        this.step = PS1_DMAe.increment;
        this.sync = PS1_DMAe.manual;
        this.direction = PS1_DMAe.to_ram;
        this.trigger = 0;
        this.chop = 0;
        this.chop_dma_size = 0;
        this.chop_cpu_size = 0;
        this.unknown = 0;
        this.base_addr = 0;
        this.block_size = 0;
        this.block_count = 0;
    }

    done() {
        this.trigger = 0;
        this.enable = 0;
    }

    transfer_size() {
        let bs = this.block_size;
        let bc = this.block_count;
        switch(this.sync) {
            case PS1_DMAe.manual:
                return bs;
            case PS1_DMAe.request:
                return bc * bs;
            case PS1_DMAe.linked_list:
                return null;
        }
    }

    get_control() {
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

    active() {
        let enable = (this.sync === PS1_DMAe.manual) ? this.trigger : true;
        return enable && this.enable;
    }

    set_control(val) {
        this.direction = (val & 1) ? PS1_DMAe.from_ram : PS1_DMAe.to_ram;
        this.step = ((val >>> 1) & 1) ? PS1_DMAe.decrement : PS1_DMAe.increment;
        this.chop = (val >>> 8) & 1;
        switch ((val >>> 9) & 3) {
            case 0:
                this.sync = PS1_DMAe.manual;
                break;
            case 1:
                this.sync = PS1_DMAe.request;
                break;
            case 2:
                this.sync = PS1_DMAe.linked_list;
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
    /**
     * @param do_dma
     */
    constructor(do_dma) {
        this.control = 0x7654321;

        this.irq_enable = 0;
        this.irq_enable_ch = 0;
        this.irq_flags_ch = 0;
        this.irq_force = 0;
        this.unknown1 = 0;

        this.do_dma = do_dma;

        /**
         * @type {PS1_DMA_channel[]}
         */
        this.channels = [new PS1_DMA_channel(0), new PS1_DMA_channel(1), new PS1_DMA_channel(2), new PS1_DMA_channel(3), new PS1_DMA_channel(4), new PS1_DMA_channel(5), new PS1_DMA_channel(6)];
    }

    irq_status() {
        return +(this.irq_force || (this.irq_enable && (this.irq_flags_ch & this.irq_enable_ch)));
    }

    write(addr, size, val, has_effect) {
        let ch_num = ((addr - 0x80) & 0x70) >>> 4;
        let reg = (addr & 0x0F);
        let ch_activated = false;
        /**
         * @type {PS1_DMA_channel}
         */
        let ch;
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
                        ch.base_addr = (val>>>0) & 0xFFFFF;
                        break;
                    case 4:
                        ch.block_size = (val & 0xFFFF) >>> 0;
                        ch.block_count = (val >>> 16) & 0xFFFF;
                        break;
                    case 8:
                        ch.set_control(val);
                        break;
                    default:
                        console.log('Unimplemented per-channel DMA register write', ch_num, reg, hex8(addr));
                        return;
                }
                if (ch.active()) ch_activated = true;
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
                        console.log('Unhandled DMA write', ch_num, reg, hex8(addr));
                        return;
                }
        }
        if (ch_activated) this.do_dma(ch);
    }

    read(addr, size, val, has_effect=true) {
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
                        console.log('Unimplemented per-channel DMA register', ch_num, reg, hex8(addr));
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
                        console.log('Unimplemented per-channel DMA register2', ch_num, reg, hex8(addr));
                        return 0xFFFFFFFF;
                }

            default:
                console.log('Unhandled DMA read', hex8(addr));
        }
        return 0xFFFFFFFF;
    }
}


class PS1_mem {
    constructor() {
        this.scratchpad_ab = new ArrayBuffer(1024);
        this.MRAM_ab = new ArrayBuffer(2 * 1024 * 1024);
        this.VRAM_ab = new ArrayBuffer(1024 * 1024);
        this.BIOS_ab = new ArrayBuffer(512 * 1024);
        this.BIOS_untouched = new ArrayBuffer(512 * 1024);

        this.scratchpad = new DataView(this.scratchpad_ab);
        this.MRAM = new DataView(this.MRAM_ab);
        this.VRAM = new DataView(this.VRAM_ab);
        this.BIOS = new DataView(this.BIOS_ab);
        this.cache_isolated = false;

        this.CPU_read_reg = function(addr, size, val, has_effect=true) {debugger;};
        this.CPU_write_reg = function(addr, size, val) {debugger;};

        this.io = {
            dma: new PS1_DMA(this.do_dma.bind(this))
        }

        this.unknown_read_mem = new Set();
        this.unknown_wrote_mem = new Set();
        this.ps1 = null;
    }

    /**
     * @param {PS1_DMA_channel} ch
     */
    do_dma(ch) {
        // Executes DMA for a channel
        // We'll just do an instant copy for now
        if (ch.sync === PS1_DMAe.linked_list)
            this.do_dma_linked_list(ch);
        else
            this.do_dma_block(ch);
        ch.done();

    }

    /**
     * @param {PS1_DMA_channel} ch
     */
    do_dma_linked_list(ch) {
        let addr = ch.base_addr & 0x1FFFFC;
        if (ch.direction === PS1_DMAe.to_ram) {
            console.log('Invalid DMA direction for linked list mode');
            return;
        }

        if (ch.num !== PS1_DMA_ports.GPU) {
            console.log('Invalid DMA dest for linked list mode', ch.num);
            return;
        }

        while(true) {
            let header = this.CPU_read(addr, PS1_MT.u32, 0);
            let copies = (header >>> 24) & 0xFF;

            while (copies > 0) {
                addr = (addr + 4) & 0x1FFFFC;
                let cmd = this.CPU_read(addr, PS1_MT.u32, 0);
                this.ps1.gpu.gp0(cmd);

                copies--;
            }

            // Following Mednafen on this?
            if ((header & 0x800000) !== 0)
                break;

            addr = header & 0x1FFFFC;
        }
    }

    /**
     * @param {PS1_DMA_channel} ch
     */
    do_dma_block(ch) {
        let step = (ch.step === PS1_DMAe.increment) ? 4 : -4;
        let addr = ch.base_addr;
        let copies = ch.transfer_size();
        if (copies === null) {
            console.log("Couldn't decide DMA transfer size");
            return;
        }

        while (copies > 0) {
            let cur_addr = addr & 0x1FFFFC;
            let src_word;
            switch(ch.direction) {
                case PS1_DMAe.from_ram:
                    src_word = this.CPU_read(cur_addr, PS1_MT.u32, 0);
                    switch(ch.num) {
                        case PS1_DMA_ports.GPU:
                            this.ps1.gpu.gp0(src_word);
                            break;
                        case PS1_DMA_ports.MDEC_in:
                            this.ps1.MDEC.command(src_word);
                            break;
                        case PS1_DMA_ports.SPU: // Ignore SPU transfer for now
                            break;
                        default:
                            console.log('UNHANDLED DMA PORT!', ch.num);
                            return;
                    }
                    break;
                case PS1_DMAe.to_ram:
                    switch(ch.num) {
                        case PS1_DMA_ports.OTC:
                            src_word = (copies === 1) ? 0xFFFFFF : ((addr - 4) & 0x1FFFFF);
                            break;
                        case PS1_DMA_ports.GPU:
                            console.log('unimplemented DMA GPU read');
                            src_word = 0;
                            break;
                        case PS1_DMA_ports.cdrom:
                            src_word = this.cdrom.dma_read_word();
                            break;
                        case PS1_DMA_ports.MDEC_out:
                            src_word = 0;
                            break;
                        default:
                            console.log('UNKNOWN DMA PORT', ch.num);
                            src_word = 0;
                            break;
                    }
                    this.CPU_write(cur_addr, PS1_MT.u32, src_word>>>0);
                    break;
            }
            addr = ((addr + step) & 0xFFFFFFFF) >>> 0;
            copies--;
            //this.ps1.cpu.core.cycles_left--;
        }
    }

    deKSEG(addr) {
        return (addr & 0x1FFFFFFF)>>>0;
    }

    BIOS_patch(addr, val) {
        this.BIOS.setUint32(addr, val, true);
    }

    BIOS_patch_reset() {
        let b_src = new Uint32Array(this.BIOS_untouched);
        let b_dst = new Uint32Array(this.BIOS_ab);
        b_dst.set(b_src);
    }

    reset() {
        this.BIOS_patch_reset();
    }

    write_mem_generic(kind, addr, size, val) {
        if ((size === PS1_MT.i16) || (size === PS1_MT.u16)) {
            val &= 0xFFFF;
        }
        else if ((size === PS1_MT.i8) || (size === PS1_MT.u8))
            val &= 0xFF;

        switch(kind) {
            case PS1_meme.scratchpad:
                PS1_write_mem(this.scratchpad, addr, size, val);
                return;
            case PS1_meme.MRAM:
                PS1_write_mem(this.MRAM, addr, size, val);
                return;
            case PS1_meme.VRAM:
                PS1_write_mem(this.VRAM, addr, size, val);
                return;
            default:
                console.log('UNKNOWN MEM TYPE');
                return val;
        }
    }

    read_mem_generic(kind, addr, size, val) {
        if ((size === PS1_MT.i16) || (size === PS1_MT.u16))
            addr &= 0xFFFFFFFE;
        else if ((size === PS1_MT.i32) || (size === PS1_MT.u32))
            addr &= 0xFFFFFFFC;
        switch(kind) {
            case PS1_meme.scratchpad:
                return PS1_read_mem(this.scratchpad, addr, size);
            case PS1_meme.MRAM:
                return PS1_read_mem(this.MRAM, addr, size);
            case PS1_meme.VRAM:
                return PS1_read_mem(this.VRAM, addr, size);
            case PS1_meme.BIOS:
                let r = PS1_read_mem(this.BIOS, addr, size);
                return r;
            default:
                console.log('UNKNOWN MEM TYPE');
                return val;
        }
    }

    update_SR(newSR) {
        this.cache_isolated = +((newSR & 0x10000) === 0x10000);
    }

    dump_unknown() {
        let wl = [], rl = [];
        for (let i of this.unknown_wrote_mem) {
            wl.push(hex8(i));
        }
        for (let i of this.unknown_read_mem) {
            rl.push(hex8(i));
        }
        wl = wl.sort();
        rl = rl.sort();
        if (wl.length > 0) console.log('WRITE ADDRS', wl);
        if (rl.length > 0) console.log('READ ADDRS', rl);
    }

    CPU_write(addr, size, val) {
        addr = this.deKSEG(addr);
        //if ((addr & 0xFFFFFFFC) === 80014124)
        if (((addr & 0xFFFFFFFC) === 0x00014128)) {
            console.log('WRITE TO ADDR', hex8(addr), PS1_MT_r[size], hex8(val), this.ps1.cpu.core.clock.trace_cycles);
            //dbg.break();
            //debugger;
        }
        if ((addr < 0x800000) && !this.cache_isolated) {
            return this.write_mem_generic(PS1_meme.MRAM, addr & 0x1FFFFF, size, val)
        }
        if (((addr >= 0x1F800000) && (addr <= 0x1F800400)) && !this.cache_isolated)
            return this.write_mem_generic(PS1_meme.scratchpad, addr & 0x3FF, size, val);

        if ((addr >= 0x1F801070) && (addr <= 0x1F801074)) {
            this.CPU_write_reg(addr, size, val);
            return;
        }

        if ((addr >= 0x1F801080) && (addr <= 0x1F8010FF)) {
            this.io.dma.write(addr, size, val);
            return;
        }

        switch(addr) {
            case 0x1F802041: // F802041h 1 PSX: POST (external 7 segment display, indicate BIOS boot status
                //console.log('WRITE POST STATUS!', val);
                return;
            // ...
            case 0x1F801810: // GP0 Send GP0 Commands/Packets (Rendering and VRAM Access)
                this.ps1.gpu.gp0(val);
                return;
            case 0x1F801814: // GP0 Send GP0 Commands/Packets (Rendering and VRAM Access)
                this.ps1.gpu.gp1(val);
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

    CPU_read(addr, size, val, has_effect=true) {
        addr = this.deKSEG(addr);
        // 2MB MRAM mirrored 4 times
        if (addr < 0x00800000) {
            let r = this.read_mem_generic(PS1_meme.MRAM, addr & 0x1FFFFF, size, val);
            return r;
        }
        // 1F800000 1024kb of scratchpad
        if ((addr >= 0x1F800000) && (addr < 0x1F800400)) {
            return this.read_mem_generic(PS1_meme.scratchpad, addr & 0x3FF, size, val);
        }
        // 1FC00000h 512kb BIOS
        if ((addr >= 0x1FC00000) && (addr < 0x1FC080000)) {
            return this.read_mem_generic(PS1_meme.BIOS, addr & 0x7FFFF, size, val);
        }

        if ((addr >= 0x1F801070) && (addr <= 0x1F801074)) {
            return this.CPU_read_reg(addr, size, val, has_effect);
        }
        if ((addr >= 0x1F801080) && (addr <= 0x1F8010FF)) {
            return this.io.dma.read(addr, size, val);
        }

        switch(addr) {
            case 0x1F8010A8: // DMA2 GPU thing
            case 0x1F801810: // GP0/GPUREAD
                return this.ps1.gpu.get_gpuread();
            case 0x1F801814: // GPUSTAT Read GPU Status Register
                return this.ps1.gpu.get_gpustat();
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
            case PS1_MT.u32:
            case PS1_MT.i32:
                return 0xFFFFFFFF;
            case PS1_MT.u16:
            case PS1_MT.i16:
                return 0xFFFF;
            case PS1_MT.u8:
            case PS1_MT.i8:
                return 0xFF;
        }

    }
}

class u32_dual_return {
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

function u32_multiply(a, b) {
    let ret = new u32_dual_return();
    let c = BigInt(a >>> 0);
    let d = BigInt(b >>> 0);
    let e = c * d;
    ret.hi = Number(BigInt.asUintN(32, e >> BigInt(32)))
    ret.lo = Number(BigInt.asUintN(32, e))
    return ret;
}

function i32_multiply(a, b) {
    let ret = new u32_dual_return();
    let c = BigInt(a & 0xFFFFFFFF);
    let d = BigInt(b & 0xFFFFFFFF);
    let e = c * d;
    let hi = (e >> BigInt(32)) & BigInt(0xFFFFFFFF);
    let lo = e & BigInt(0xFFFFFFFF);
    ret.hi = Number(hi)
    ret.lo = Number(lo);
    return ret;
}


function i32_divide(a, b)
{
    let ret = new u32_dual_return();
    let c = a & 0xFFFFFFFF;
    let d = b & 0xFFFFFFFF;
    ret.lo = (c / d) & 0xFFFFFFFF
    ret.hi = c % d;
    return ret;
}

function u32_divide(a, b) {
    let ret = new u32_dual_return();
    let c = a >>> 0;
    let d = b >>> 0;
    ret.lo = (c / d) >>> 0;
    ret.hi = c % d;
    return ret;
}

function mtest() {
    let a = -1;
    let b = 6;
    let r = i32_multiply(a, b);
    console.log('MULTIPLY', hex4(a), 'by', hex4(b) + '.', hex4(r.hi), hex4(r.lo))
}
//mtest()

class R3000_multiplier_t {
    constructor(clock) {
        this.clock = clock;
        this.HI = 0;
        this.LO = 0;

        this.op1 = 0;
        this.op2 = 0;
        this.op_going = 0;
        this.op_kind = 0; // 0 for multiply signed, 1 for multiply unsinged
                          // 2 for div signed, 2 for div unsigned
        this.clock_start = 0; // Clock time of start
        this.clock_end = 0; // Clock time of end
    }
    
    set(hi, lo, op1, op2, op_kind, cycles) {
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
        }
        this.HI = ret.hi;
        this.LO = ret.lo;

        this.op_going = 0;
    }
}



