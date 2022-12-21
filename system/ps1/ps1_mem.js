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

class PS1_fastRAM {
    constructor(arr) {
        this.i8 = new Int8Array(arr);
        this.i16 = new Int16Array(arr);
        this.i32 = new Int32Array(arr);
        this.u8 = new Uint8Array(arr);
        this.u16 = new Uint16Array(arr);
        this.u32 = new Uint32Array(arr);

        this.f = [
            this.i8, this.i16, this.i32,
            this.u8, this.u16, this.u32
        ]
    }
}


class PS1_mem {
    constructor() {
        this.scratchpad_ab = new ArrayBuffer(1024);
        this.MRAM_ab = new ArrayBuffer(2 * 1024 * 1024);
        this.VRAM_ab = new ArrayBuffer(1024 * 1024);
        this.BIOS_ab = new ArrayBuffer(512 * 1024);

        this.scratchpad = new PS1_fastRAM(this.scratchpad_ab);
        this.MRAM = new PS1_fastRAM(this.MRAM_ab);
        this.VRAM = new PS1_fastRAM(this.VRAM_ab);
        this.BIOS = new PS1_fastRAM(this.BIOS_ab);
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
                this.scratchpad.f[size][addr] = val;
                return;
            case PS1_meme.MRAM:
                this.MRAM.f[size][addr] = val;
                return;
            case PS1_meme.VRAM:
                this.VRAM.f[size][addr] = val;
                return;
            default:
                console.log('UNKNOWN MEM TYPE');
                return val;
        }
    }

    read_mem_generic(kind, addr, size, val) {
        if ((size === PS1_MT.i16) || (size === PS1_MT.u16))
            addr >>= 1;
        else if ((size === PS1_MT.i32) || (size === PS1_MT.u32))
            addr >>= 2;
        switch(kind) {
            case PS1_meme.scratchpad:
                return this.scratchpad.f[size][addr];
            case PS1_meme.MRAM:
                return this.MRAM.f[size][addr];
            case PS1_meme.VRAM:
                return this.VRAM.f[size][addr];
            case PS1_meme.BIOS:
                return this.BIOS.f[size][addr];
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
    constructor() {
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


// Class to hold external interface, including function pointers
class R3000_bus_interface_t {
    constructor(clock) {
        this.pipe = new R3000_pipeline_t();
        this.pins = new R3000_pins_t();
        this.mem = new PS1_mem();
        this.clock = clock;
        this.multiplier = new R3000_multiplier_t();
    }

    /**
     * @param {number} COP
     * @param {R3000_regs_t} regs
     * @param {number} num
     * @param {number} val
     * @constructor
     */
    COP_write_reg(COP, regs, num, val) {
        if (COP === 0) {
            // TODO: add 1-cycle delay
            regs.COP0[num] = val;
            return;
        }
        console.log('write to unimplemented COP');
    }

    COP_read_reg(COP, regs, num, val) {
        if (COP === 0) {
            return regs.COP0;
        }
        console.log('read from unimplemented COP');
        return 0xFF;
    }
    
}

