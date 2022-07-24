"use strict";

const HDMA_LENGTHS = Object.freeze([1, 2, 2, 4, 4, 4, 2, 4]);

class dmaChannel {
    /**
     * @param {snes_memmap} mem_map
     * @param {*} status
     * @param {SNES_clock} clock
     * @param {Number} dma_num
     */
    constructor(mem_map, status, clock, dma_num) {
        this.dma_num = dma_num
        this.mem_map = mem_map;
        this.dma_enable = 0;
        this.status = status;
        this.hdma_enable = 0;
        this.direction = 0;
        this.indirect = 0;
        this.unused = 0;
        this.reverse_transfer = 0;
        this.fixed_transfer = 0;
        this.transfer_mode = 0;
        this.target_address = 0;
        this.source_address = 0;
        this.dma_pause = false;
        this.source_bank = 0;
        this.transfer_size = 0;
        this.indirect_bank = 0;
        this.indirect_address = 0;
        this.hdma_address = 0;
        this.line_counter = 0;
        this.hdma_completed = 0;
        this.hdma_do_transfer = 0;
        this.next = null;
        this.clock = clock;
        this.took_cycles = 0;
        this.index = 0;
    }

    hdma_is_active() {
        return this.hdma_enable && !this.hdma_completed;
    }

    hdma_reset() {
        this.hdma_completed = false;
        this.hdma_do_transfer = false;
    }

    dma_run(howmany) {
        if (!this.dma_enable) return howmany;
        //console.log('DMA #', this.dma_num, 'RUN WITH', this.transfer_size, 'BYTES LEFT AND', howmany, 'CYCLES');
        //console.log('DMA INFO:', this.direction, this.fixed_transfer, this.source_address, this.source_bank);
        if (this.dma_pause) return howmany;

        //this.dma_edge();

        if (this.transfer_size > 0) {
            if (this.index === 0) { // 8 cycles for setup
                this.clock.dma_counter += 8;
            }
            do {
                this.transfer(this.source_bank << 16 | this.source_address, this.index);
                this.index++;
                this.clock.dma_counter += 8;
                if (!this.fixed_transfer) {
                    if (this.reverse_transfer)
                        this.source_address--;
                    else
                        this.source_address++;
                    this.source_address &= 0xFFFF;
                }
                howmany -= 8;
                if (howmany < 1) break;
                //console.log(this.transfer_size);
                //this.dma_edge()
            } while (this.dma_enable && --this.transfer_size);
        }
        this.dma_enable = !(this.transfer_size < 1);

        return howmany;
    }

    hdma_setup() {
        //console.log('HDMA SETUP!');
        this.hdma_do_transfer = true;
        if (!this.hdma_enable) return;

        //this.dma_enable = false;
        this.dma_pause = true;
        this.hdma_address = this.source_address;
        this.line_counter = 0;
        this.hdma_reload();
        this.dma_pause = false;
    }

    hdma_is_finished() {
        let channel = this.next;
        while(channel !== null) {
            if (channel.hdma_is_active()) return false;
            channel = channel.next;
        }
        return true;
    }

    hdma_reload() {
        this.clock.dma_counter += 8;
        let data = this.mem_map.dispatch_read(this.source_bank << 16 | this.hdma_address);
        if ((this.line_counter & 0x7F) === 0) {
            this.line_counter = data;
            this.hdma_address++;

            this.hdma_completed = +(this.line_counter === 0);
            this.hdma_do_transfer = !this.hdma_completed;

            if (this.indirect) {
                this.clock.dma_counter += 8;
                data = this.mem_map.dispatch_read(this.source_bank << 16 | this.hdma_address);
                this.hdma_address++;
                this.indirect_address = data << 8;
                if (this.hdma_completed && this.hdma_is_finished()) return;

                this.clock.dma_counter += 8;
                data = this.mem_map.dispatch_read(this.source_bank << 16 | this.hdma_address);
                this.hdma_address++;
                this.indirect_address = (data << 8) | (this.indirect_address >>> 8);
            }
        }
    }

    hdma_advance() {
        if (!this.hdma_is_active()) return;
        this.line_counter--;
        this.hdma_do_transfer = (this.line_counter & 0x80) >>> 7;
        this.hdma_reload();
    }

    hdma_transfer() {
        if (!this.hdma_is_active()) return;
        this.dma_enable = false; // HDMA interrupt DMA
        if (!this.hdma_do_transfer) return;
        for (let index = 0; index < HDMA_LENGTHS[this.transfer_mode]; index++) {
            let addr;
            if (this.indirect) {
                addr = (this.indirect_bank << 16) | this.indirect_address;
                this.indirect_address++;
            } else {
                addr = (this.source_bank << 16) | this.source_address;
                this.source_address++;
            }
            this.transfer(addr, index);
        }
    }

    validA(addr) {
        if ((addr & 0x40FF00) === 0x2100) return false;
        if ((addr & 0x40FE00) === 0x4000) return false;
        if ((addr & 0x40FFE0) === 0x4200) return false;
        return (addr & 0x40FF80) !== 0x4300;
    }

    readA(addr) {
        //console.log('READA +8')
        this.clock.dma_counter += 8;
        return this.validA(addr) ? this.mem_map.dispatch_read(addr) : 0
    }

    readB(addr, valid) {
        //console.log('READB +8')
        this.clock.dma_counter += 8;
        return valid ? this.mem_map.dispatch_read(0x2100 | addr) : 0
    }

    writeA(addr, val) {
        if (this.validA(addr)) this.mem_map.dispatch_write(addr, val);
    }

    writeB(addr, val, valid) {
        //console.log('WRITEB!', hex2(addr), hex2(val), valid);
        if (valid) this.mem_map.dispatch_write(0x2100 | addr, val);
    }

    transfer(addrA, index) {
        let addrB = this.target_address;
        switch(this.transfer_mode) {
            case 1:
            case 5:
                addrB += (index & 1); break;
            case 3:
            case 7:
                addrB += ((index >>> 1)) & 1; break;
            case 4:
                addrB += index; break;
        }
        let valid = addrB !== 0x80 || ((addr & 0xFE0000) !== 0x7E0000 && (addrA & 0x40E000) !== 0x0000);
        let data;
        //console.log('TRANSFER ACTUAL ADDR', this.direction, valid, hex6(addrA), hex2(addrB));
        if (this.direction === 0) {
            data = this.readA(addrA);
            //console.log('DMA AB ' + hex6(addrA) + ' to ' + hex4(0x2100 | addrB) + ': ' + hex2(data));
            this.writeB(addrB, data, valid);
        } else {
            data = this.readB(addrB, valid);
            //console.log('DMA BA ' + hex4(0x2100 | addrB) + ' to ' + hex6(addrA) + ': ' + hex2(data));
            this.writeA(addrA, data);
        }
    }
}


class r5a22DMA {
    /**
     * @param {snes_memmap} mem_map
     * @param {*} status
     * @param {SNES_clock} clock
     */
    constructor(mem_map, status, clock) {
        this.mem_map = mem_map;

        this.status = status;
        this.clock = clock;

        this.channels = {};
        for (let i = 0; i < 8; i++) {
            this.channels[i] = new dmaChannel(this.mem_map, this.status, this.clock, i);
        }
        for (let i = 0; i < 7; i++) {
            this.channels[i].next = this.channels[i+1];
        }
    }

    reset() {

    }

    reg_read(addr, val, have_effect=true) {
        let channel = this.channels[((addr >>> 4) & 7)];

        switch(addr & 0xFF8F) {
            case 0x4300: // DMAPx
                return (channel.transfer_mode) | (channel.fixed_transfer << 3) | (channel.reverse_transfer << 4) | (channel.unused << 5) | (channel.indirect << 6) || (channel.direction << 7);
            case 0x4301:
                return channel.target_address;
            case 0x4302:
                return channel.source_address & 0xFF;
            case 0x4303:
                return (channel.source_address >>> 8) & 0xFF;
            case 0x4304:
                return channel.source_bank;
            case 0x4305:
                return channel.transfer_size & 0xFF;
            case 0x4306:
                return (channel.transfer_size >>> 8) & 0xFF;
            case 0x4307:
                return channel.indirect_bank;
            case 0x4308:
                return channel.hdma_address & 0xFF;
            case 0x4309:
                return (channel.hdma_address >>> 8) & 0xFF;
            case 0x430a:
                return channel.line_counter;
            case 0x430b:
                return channel.unknown_byte;
            case 0x430f:
                return channel.unknown_byte;
        }
        return val;
    }

    reg_write(addr, val) {
        let channel = this.channels[((addr >>> 4) & 7)];
        //console.log('DMA WRITE', channel.dma_num, hex4(addr), hex4(addr & 0xFF8F), hex2(val));
        switch(addr & 0xFF8F) {
            case 0x4300: // DMAPx various controls
                channel.transfer_mode = val & 7;
                channel.fixed_transfer = (val >>> 3) & 1;
                channel.reverse_transfer = (val >>> 4) & 1;
                channel.unused = (val >>> 5) & 1;
                channel.indirect = (val >>> 6) & 1;
                channel.direction = (val >>> 7) & 1;
                return;
            case 0x4301:
                channel.target_address = val;
                return;
            case 0x4302:
                channel.source_address = (channel.source_address & 0xFF00) | val;
                return;
            case 0x4303:
                channel.source_address = (val << 8) | (channel.source_address & 0xFF);
                return;
            case 0x4304:
                channel.source_bank = val;
                return;
            case 0x4305:
                channel.transfer_size = (channel.transfer_size & 0xFF00) | val;
                return;
            case 0x4306:
                channel.transfer_size = (val << 8) | (channel.transfer_size & 0xFF);
                return;
            case 0x4307:
                channel.indirect_bank = val;
                return;
            case 0x4308:
                channel.hdma_address = (channel.hdma_address & 0xFF00) | val;
                return;
            case 0x4309:
                channel.hdma_address = (val << 8) | (channel.hdma_address & 0xFF);
                return;
            case 0x430A:
                channel.line_counter = val;
                return;
            case 0x430B:
                channel.unknown = val;
                return;
            case 0x430F:
                channel.unknown = val;
                return;
        }
    }

    hdma_run() {
        this.clock.dma_counter += 8;
        for (let n = 0; n < 8; n++) {
            this.channels[n].hdma_transfer();
        }
        let active = 0;
        for (let n = 0; n < 8; n++) {
            this.channels[n].hdma_advance();
            //if (this.channels[n].hdma_)
        }
        this.status.irq_lock = 1;
    }

    dma_start() {
        for (let n = 0; n < 8; n++) {
            this.channels[n].index = 0;
        }
    }

    dma_run(howmany) {
        // Note we're not emulating 8 cycle per channel setup yet
        for (let n = 0; n < 8; n++) {
            howmany = this.channels[n].dma_run(howmany);
            if (howmany < 1) break;
        }
        this.status.irq_lock = 1;
        return howmany;
    }

    hdma_setup() {
        this.clock.dma_counter += 8;
        for (let n = 0; n < 8; n++) { this.channels[n].hdma_setup(); }
        this.status.irq_lock = 1;
    }


}