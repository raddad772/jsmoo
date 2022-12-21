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
            return buf.getInt16(addr, false);
        case PS1_MT.i32:
            return buf.getInt32(addr, false);
        case PS1_MT.u8:
            return buf.getUint8(addr);
        case PS1_MT.u16:
            return buf.getUint16(addr, false);
        case PS1_MT.u32:
            return buf.getUint32(addr, false);
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
            return buf.setInt16(addr, val,false);
        case PS1_MT.i32:
            return buf.setInt32(addr, val,false);
        case PS1_MT.u8:
            return buf.setUint8(addr, val);
        case PS1_MT.u16:
            return buf.setUint16(addr, val,false);
        case PS1_MT.u32:
            return buf.setUint32(addr, val,false);
    }
}



class PS1_mem {
    constructor() {
        this.scratchpad_ab = new ArrayBuffer(1024);
        this.MRAM_ab = new ArrayBuffer(2 * 1024 * 1024);
        this.VRAM_ab = new ArrayBuffer(1024 * 1024);
        this.BIOS_ab = new ArrayBuffer(512 * 1024);

        this.scratchpad = new DataView(this.scratchpad_ab);
        this.MRAM = new DataView(this.MRAM_ab);
        this.VRAM = new DataView(this.VRAM_ab);
        this.BIOS = new DataView(this.BIOS_ab);
    }

    deKSEG(addr) {
        return addr & 0x1FFFFFFF;
    }

    write_mem_generic(kind, addr, size, val) {
        if ((size === PS1_MT.i16) || (size === PS1_MT.u16)) {
            addr >>= 1;
            val &= 0xFFFF;
        }
        else if ((size === PS1_MT.i32) || (size === PS1_MT.u32))
            addr >>= 2;
        else
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
                return PS1_read_mem(this.BIOS, addr, size);
            default:
                console.log('UNKNOWN MEM TYPE');
                return val;
        }
    }

    CPU_write(addr, size, val) {
        addr = this.deKSEG(addr);
        if (addr < 0x800000)
            return this.write_mem_generic(PS1_meme.MRAM, addr & 0x1FFFFF, size, val)
        if ((addr >= 0x1F800000) && (addr <= 0x1F800400))
            return this.write_mem_generic(PS1_meme.scratchpad, addr & 0x3FF, size, val);

        console.log('WRITE TO UNKNOWN LOCATION', hex8(addr));
    }

    CPU_read(addr, size, val, has_effect=true) {
        addr = this.deKSEG(addr);
        // 2MB MRAM mirrored 4 times
        if (addr < 0x800000)
            return this.read_mem_generic(PS1_meme.MRAM, addr & 0x1FFFFF, size, val);
        // 1F800000 1024kb of scratchpad
        if ((addr >= 0x1F800000) && (addr < 0x1F800400))
            return this.read_mem_generic(PS1_meme.scratchpad, addr & 0x3FF, size, val);
        // 1FC00000h 512kb BIOS
        if ((addr >= 0x1FC00000) && (addr < 0x1FC080000))
            return this.read_mem_generic(PS1_meme.BIOS, addr & 0x7FFFF, size, val);

        console.log('UNKNOWN READ FROM', hex8(addr));
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
mtest()

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


