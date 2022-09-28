"use strict";

const ZXT = {
    unknown: 5,
    program: 0,
    number_array: 1,
    character_array: 2,
    code_file: 3
}

const SER_ZXSpectrum_tape_deck = [
    'TAPE', 'head_pos'
];


class ZXSpectrum_tape_deck {
    constructor() {
        this.TAPE = new Uint8Array(1);
        this.head_pos = 0;
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_ZXSpectrum_tape_deck);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('wrong Spectrum Tape Deck version');
            return false;
        }
        return deserialization_helper(this, from, SER_ZXSpectrum_tape_deck);
    }

    reset() {
        this.head_pos = 0;
    }

    load_ROM_from_RAM(what) {
        this.reset();
        let ubi = new Uint8Array(what);
        let pos = 0;
        let total_size = 0;
        let blocks = [];
        while(pos<(ubi.byteLength-1)) {
            // Fetch block size
            let block_size = ubi[pos] + (ubi[pos+1] << 8);
            pos += 2;
            // Allocate and copy block
            total_size += block_size;
            let block = new Uint8Array(block_size);
            block.set(ubi.slice(pos, pos+block_size));
            blocks.push(block);
            pos += block_size;
        }
        console.log('Just parsed', blocks.length, 'blocks of total size', total_size);
        this.TAPE = new Uint8Array(total_size);
        let tpos = 0;
        for (let i = 0; i < blocks.length; i++) {
            for (let j = 0; j < blocks[i].length; j++) {
                this.TAPE[tpos] = blocks[i][j];
                tpos++;
            }
        }
        console.log('tpos:', tpos);
    }

    /**
     * @param {z80_t} cpu
     * @param {function} write_func
     */
    fast_load(cpu, write_func) {
        // Replaces ROM code at 056B with instant-load kind.
        // Everything should be the same at exit, but without
        // actually doing all the waiting.
        let A = (cpu.regs.AF_ >> 8) & 0xFF;
        let F = cpu.regs.AF_ & 0xFF;
        let actually_load = (F & 1) === 1; // 0 = VERIFY
        cpu.regs.H = 0;
        cpu.regs.L = this.TAPE[this.head_pos];
        cpu.regs.H ^= cpu.regs.L;
        this.head_pos++;
        if (this.head_pos >= this.TAPE.byteLength) this.head_pos = 0;
       if ((A ^ cpu.regs.H) !== 0) { // Early-return
            return;
        }
        let DE = (cpu.regs.D << 8) | cpu.regs.E;
        let IX = cpu.regs.IX;
        DE = (DE - 2) & 0xFFFF;
        while(DE > 0) {
            cpu.regs.L = this.TAPE[this.head_pos];
            this.head_pos++;
            if (this.head_pos >= this.TAPE.byteLength) this.head_pos = 0;
            cpu.regs.H ^= cpu.regs.L;
            if (actually_load) write_func(IX, cpu.regs.L);
            DE = (DE - 1) & 0xFFFF;
            IX = (IX + 1) & 0xFFFF;
        }
        // Last byte is not loaded into RAM
        cpu.regs.L = this.TAPE[this.head_pos];
        this.head_pos++;
        if (this.head_pos >= this.TAPE.byteLength) this.head_pos = 0;
        cpu.regs.H ^= cpu.regs.L;

        cpu.regs.D = cpu.regs.E = 0;
        cpu.regs.IX = IX;
        cpu.regs.A = cpu.regs.H;
        cpu.regs.F.C = +(cpu.regs.A === 0);
    }
}
