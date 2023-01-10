import {MT_FIFO16} from "../../helpers/mt_fifo";

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
	__get(key: u32) {
		return load<T>(this.ptr+key);
	}

	@operator("[]=")
	__set(key: u32, value: T): void {
		store<T>(this.ptr+key, value);
	}
}

export class PS1_GPU {
    MMIO_buffer: usize
    GP0_buffer: usize
    GP1_buffer: usize
    GP0FIFO: MT_FIFO16
    GP1FIFO: MT_FIFO16
    MMIO: heapArrayT<u32>

    GPU_FIFO_tag: i32 = 0
    IRQ_bit: u32 = 0

    constructor() {
        //this.output_shared_buffers = [new SharedArrayBuffer(1024 * 512 * 2), new SharedArrayBuffer(1024 * 512 * 2)];
        //this.output = [new Uint8Array(this.output_shared_buffers[0]), new Uint8Array(this.output_shared_buffers[1])];

        //this.gpu_thread = new Worker('/system/ps1/gpu/ps1_sw_mt_gpu_worker.js');
        //this.gpu_thread.onmessage = this.on_gpu_message.bind(this);
        //this.gpu_thread.onerror = function (a, b, c) {
        //    console.log('ERR', a, b, c);
        //}

        //this.VRAMb = new SharedArrayBuffer(2*1024*1024); // 2MB VRAM shared-buffer

        this.MMIO_buffer = heap.alloc(96);
        this.GP0_buffer = heap.alloc(256);
        this.GP1_buffer = heap.alloc(256);
        this.GP0FIFO = new MT_FIFO16(this.GP0_buffer);
        this.GP1FIFO = new MT_FIFO16(this.GP1_buffer);
        this.GP0FIFO.clear();
        this.GP1FIFO.clear();
        this.MMIO = new heapArrayT<u32>(this.MMIO_buffer, 96);

        this.IRQ_bit = 0;

        this.GPU_FIFO_tag = 0;

    }

    play(num: i32) {
        this.MMIO.setUint32(GPUPLAYING, 1);
    }

    pause() {
        console.log('GPUPAUS');
        this.MMIO.setUint32(GPUPLAYING, 0);
    }

    stop(): void {
        // Terminate thread
        this.MMIO.setUint32(GPUQUIT, 1);
    }

    gp0(cmd: u32): void {
        //if ((cmd >>> 24) === 0xA0) dbg.break();
        //if (cmd === 0xFFFF801F) dbg.break();
        //console.log('HEY?', hex8(cmd));
        this.GP0FIFO.put_item_blocking(cmd, this.GPU_FIFO_tag++)
    }

    gp1(cmd: u32): void {
        //console.log('SEND GP1 cmd', hex8(cmd >>> 8));
        this.GP1FIFO.put_item_blocking(cmd, this.GPU_FIFO_tag++);
    }

    get_gpuread(): u32 {
        return this.MMIO.getUint32(GPUREAD);
    }

    get_gpustat(): u32 {
        let g = this.MMIO.getUint32(GPUSTAT);
        // Fill interrupt bit
        g |= this.IRQ_bit << 24;
        // Fill FIFO full bit
        if (((g >>> 29) & 3) === 1)
            g |= this.GP0FIFO.full() ? 0 : 1;

        return g;
    }
}