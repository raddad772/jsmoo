import {hex8} from "./helpers";

const mutex_unlocked: i32 = 0;
const mutex_locked: i32 = 1;


// Basic spinlock. Spinning is not a performance issue since this only takes as long as an allocation
export function mutex_lock(buf: usize, index: u32): void {
    let yo = 0;
    for (;;) {
        yo++;
        if (yo > 500) console.log('WATIING ON LOCK');
        // If we succesfully atomically compare and exchange unlocked for locked, we have the mutex
        if (atomic.cmpxchg<i32>(buf+index, mutex_unlocked, mutex_locked) === mutex_unlocked)
            return;
        // Wait for unlocked state to try for locked
        for (;;) {
            if (atomic.load<i32>(buf+index) === mutex_unlocked) break;
        }
    }
}

export function mutex_unlock(buf: usize, index: u32): void {
    if (atomic.cmpxchg<i32>(buf+index, mutex_locked, mutex_unlocked) !== mutex_locked) {
        // This only happens if someone else unlocked our mutex, or we did it more than once...
        throw new Error('Is this the right thing to do here? Mutex in inconsistent state');
    }
}

export class MT_FIFO16 {
    buf: usize = 0;
    FIFO: Int32Array = new Int32Array(196);
    output_tag: u32 = 0

    constructor(buf: usize) {
        console.log('SET BUF: ' + buf.toString())
        this.buf = buf;
    }

    put_bad(index: u32, item: u32): void {
        console.log('PUT TO ' + hex8(this.buf+(index*4)) + ': ' + hex8(<u32>item));
        store<i32>(this.buf+(index*4), <i32>item);
    }

    clear(): void {
        mutex_lock(this.buf, (34*4));
        store<i32>(this.buf+(32*4), 0); // head = 0
        store<i32>(this.buf+(33*4), 0); // length = 0
        mutex_unlock(this.buf, (34*4));
    }

    full(): boolean {
        return atomic.load<i32>(this.buf+(33*4)) > 15;
    }

    put_item_blocking(item: u32, tag: u32): void {
        if (atomic.load<i32>(this.buf+(33*4)) > 15) {
            console.log('Waiting on GP0 to empty buffer...')
            while (atomic.load<i32>(this.buf+(33*4)) > 15) {
            }
            console.log('Buffer emptied');
        }

        //console.log('Set Mutex ' + hex8(item))
        mutex_lock(this.buf, (34*4));
        let head = load<i32>(this.buf+(32*4));
        let num_items = load<i32>(this.buf+(33*4));

        let h = ((head + num_items) & 15) * 2
        store<i32>(this.buf+(h*4), <i32>item);
        store<i32>(this.buf+((h+1)*4), <i32>tag);
        // length++
        store<i32>(this.buf+(33*4), num_items + 1)
        // head does not move when appending to FIFO

        mutex_unlock(this.buf, (34*4));
        //console.log('Unset Mutex')
    }

    get_item(): i32|null {
        if (atomic.load<i32>(this.buf+(33*4)) === 0) {
            return null;
        }
        mutex_lock(this.buf, (34*4));
        let item: i32|null = null;

        let head = load<i32>(this.buf+(32*4));
        let num_items = load<i32>(this.buf+(33*4));
        if (num_items > 0) {
            item = this.FIFO[head*2];
            this.output_tag = load<i32>(this.buf+(((head*2)+1)*4));
            store<i32>(this.buf+((head*2)*4), <i32>0xBEEFCACE);  // zero old place
            store<i32>(this.buf+(32*4), (head+1) & 15);  // head++
            store<i32>(this.buf+(33*4), --num_items);    // length--;
        }

        mutex_unlock(this.buf, (34*4));
        return item;
    }
}
