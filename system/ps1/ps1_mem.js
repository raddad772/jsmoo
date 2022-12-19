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

// Class to hold external interface, including function pointers
class R3000_bus_interface_t {
    constructor() {
        this.pipe = new R3000_pipeline_t();
        this.pins = new R3000_pins_t();
        this.mem = new PS1_mem();
    }
}

