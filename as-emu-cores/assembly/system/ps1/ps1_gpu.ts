import {MT_FIFO16} from "../../helpers/mt_fifo";
import {hex8} from "../../helpers/helpers";

const GPUSTAT = 0;
const GPUPLAYING = 1;
const GPUQUIT = 2;
const GPUGP1 = 3;
const GPUREAD = 4;
const LASTUSED = 23;


export class heapArrayT<T> {
	ptr: usize = 0;
	sz: u32 = 0;

	constructor(ptr: usize, sz: u32) {
		this.ptr = ptr;
		this.sz = sz;
	}

	getUint8(addr: u32): u8 {
        return load<u8>(this.ptr+addr);
    }

    getUint32(addr: u32): u32 {
        return load<u32>(this.ptr+addr);
    }

    @inline
    setUint32(addr: u32, val: u32): void {
        store<u32>(this.ptr+addr, val);
    }

    @operator("[]")
	__get(key: u32): T {
		return load<T>(this.ptr+key);
	}

	@operator("[]=")
	__set(key: u32, value: T): void {
		store<T>(this.ptr+key, value);
	}
}

export class PS1_GPU {
    MMIO_buffer: usize = 0
    GP0_buffer: usize = 0
    GP1_buffer: usize = 0
    GP0FIFO: MT_FIFO16
    GP1FIFO: MT_FIFO16
    MMIO: heapArrayT<u32>

    GPU_FIFO_tag: i32 = 0
    IRQ_bit: u32 = 0

    constructor() {
        let MMIO_buffer = heap.alloc(96);
        let GP0_buffer = heap.alloc(256);
        let GP1_buffer = heap.alloc(256);
        let GP0FIFO = new MT_FIFO16(GP0_buffer);
        let GP1FIFO = new MT_FIFO16(GP1_buffer);
        GP0FIFO.clear();
        GP1FIFO.clear();
        this.MMIO = new heapArrayT<u32>(MMIO_buffer, 96);
        this.GP0FIFO = GP0FIFO;
        this.GP1FIFO = GP1FIFO;

        this.IRQ_bit = 0;

        this.GPU_FIFO_tag = 0;
        this.GP0_buffer = GP0_buffer;
        this.GP1_buffer = GP1_buffer;
        this.MMIO_buffer = MMIO_buffer;
    }

    play(num: i32): void {
        this.MMIO.setUint32(GPUPLAYING*4, 1);
    }

    pause(): void {
        console.log('GPUPAUS');
        this.MMIO.setUint32(GPUPLAYING*4, 0);
    }

    stop(): void {
        // Terminate thread
        this.MMIO.setUint32(GPUQUIT*4, 1);
    }

    gp0(cmd: u32): void {
        //console.log('send GP0 ' + hex8(cmd));
        this.GP0FIFO.put_item_blocking(cmd, this.GPU_FIFO_tag++)
    }

    gp1(cmd: u32): void {
        //console.log('send GP1 ' + hex8(cmd))
        this.GP1FIFO.put_item_blocking(cmd, this.GPU_FIFO_tag++);
    }

    get_gpuread(): u32 {
        return this.MMIO.getUint32(GPUREAD*4);
    }

    get_gpustat(): u32 {
        let g = this.MMIO.getUint32(GPUSTAT*4);
        // Fill interrupt bit
        g |= this.IRQ_bit << 24;
        // Fill FIFO full bit
        //console.log('GET GPUSTAT! ' + hex8(g));
        if (((g >>> 29) & 3) === 1)
            g |= this.GP0FIFO.full() ? 0 : 1;

        return g;
    }
}