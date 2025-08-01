class cdfifo {
    max_items: i32 = 0

    length: i32 = 0
    head: i32 = 0

    buffer: StaticArray<u8>

    constructor(max_items: i32) {
        this.buffer = new StaticArray<u8>(max_items);
        this.max_items = max_items;
    }

    empty(): boolean {
        return this.length === 0;
    }

    full(): boolean {
        return this.length === this.max_items;
    }

    push(value: u8): i16 {
        if (this.length >= this.max_items)
            return -1
        this.buffer[(this.head + this.length) % this.max_items] = value;
        this.length++;
        return <i16>value;
    }

    clear(): void {
        this.length = 0;
        this.head = 0;
    }

    pop(): i16 {
        if (this.length <= 0)
            return -1;
        let r = this.buffer[this.head];
        this.head = (this.head + 1) % this.max_items;
        this.length--;

        return r;
    }
}


class PS1_cdrom_io {
    // 1f801800.0-3, index/status   index0-3
    index: u32 = 0
    // read-only
    adpcm_fifo_empty: u32 = 0
    paramater_fifo_empty: u32 = 0
    parameter_fifo_full: u32 = 0
    response_fifo_empty: u32 = 0
    data_fifo_empty: u32 = 0
    busysts: u32 = 0

    // 1f801801.0 W
    cmd: u32 = 0 // command register. write triggers command

    // 1f801802.0 W
    param: u32 = 0 // parameter byte(s) for next command. FIFO

    // 1f801803.0 W: request register
    SMEN: u32 = 0 // want command set interrupt on next command, 0 = no change, 1 = yes
    BFWR: u32 = 0 // ?
    BFRD: u32 = 0; // no/reset data FIFO, or yes/load data FIFO

    // 1f801803.0 read
    /*
        After ReadS/ReadN commands have generated INT1, software must set the Want Data bit (1F801803h.Index0.Bit7), then wait until Data Fifo becomes not empty (1F801800h.Bit6), the datablock (disk sector) can be then read from this register.

        0-7  Data 8bit  (one byte), or alternately,
        0-15 Data 16bit (LSB=First byte, MSB=Second byte)
        The PSX hardware allows to read 800h-byte or 924h-byte sectors, indexed as [000h..7FFh] or [000h..923h], when trying to read further bytes, then the PSX will repeat the byte at index [800h-8] or [924h-4] as padding value.
        Port 1F801802h can be accessed with 8bit or 16bit reads (ie. to read a 2048-byte sector, one can use 2048 load-byte opcodes, or 1024 load halfword opcodes, or, more conventionally, a 512 word DMA transfer; the actual CDROM databus is only 8bits wide, so CPU/DMA are apparently breaking 16bit/32bit reads into multiple 8bit reads from 1F801802h).
     */
    data_fifo: cdfifo = new cdfifo(2048);

    // 1f801801.1 1, or reads from index 0, 2, 3
    resp: cdfifo = new cdfifo(16); // response byte(s)

    // 1f801802.1 W, 1f1801803.0,2 R
    // interrupt enable IE
    // 0-4 IRQ bits
    irq_bits: u32 = 15
    unknown: u32 = 0

    // 803.1, R/W, 803.3 R
    // interrupt flag IF
    // read..

}

class PS1_cdrom {


    constructor() {

    }
}