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

        this.unknown_read_mem = new Set();
        this.unknown_wrote_mem = new Set();
        this.ps1 = null;
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
            addr &= 0xFFFFFFFD;
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

/*
WRITE ADDRS (25)[
ps1_mem.js:181 READ ADDRS [case 0x1F000084']
 */

    CPU_write(addr, size, val) {
        addr = this.deKSEG(addr);
        if ((addr < 0x800000) && !this.cache_isolated) {
            if ((addr & 0xFFFFFFFC) === 0x0000e1e8) {
                console.log('WRITE TO BP', size, hex8(val));
                //dbg.break()
            }
            return this.write_mem_generic(PS1_meme.MRAM, addr & 0x1FFFFF, size, val)

        }
        if (((addr >= 0x1F800000) && (addr <= 0x1F800400)) && !this.cache_isolated)
            return this.write_mem_generic(PS1_meme.scratchpad, addr & 0x3FF, size, val);

        if ((addr >= 0x1F801070) && (addr <= 0x1F801074)) {
            this.CPU_write_reg(addr, size, val);
            return;
        }

        switch(addr) {
            case 0x1F802041: // F802041h 1 PSX: POST (external 7 segment display, indicate BIOS boot status
                console.log('WRITE POST STATUS!', val);
                return;
            case 0x1F8010F0: // DPCR - DMA control
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

        switch(addr) {
            case 0x1F8010F0: // DPCR - DMA Control register
                break;
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
    let d = a & 0xFFFFFFFF;
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



