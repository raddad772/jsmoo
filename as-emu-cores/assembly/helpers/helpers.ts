// For relative addressing
export function mksigned8(what: u32): i32 {
     return what >= 0x80 ? -(0x100 - what) : what;
}

export function mksigned13(what: u32): i32 {
    return what >= 0x1000 ? -(0x2000 - what) : what;
}

export function mksigned16h4(w: u32): string {
     let what: i32 = w >= 0x8000 ? -(0x10000 - <i32>w) : <i32>w;
     let o = hex5(abs<i32>(what * 4));
     return (what < 0 ? '-' : '+') + o + 'h';
}


export function mksigned16h(w: u32): string {
     let what: i32 = w >= 0x8000 ? -(0x10000 - <i32>w) : <i32>w;
     let o: string = hex4(abs<i32>(what));
     return (what < 0 ? '-' : '+') + o + 'h';
}

export function padl(what: string, howmuch: u32): string {
    let hm: i32 = <i32>howmuch;
    while(what.length < hm) {
		what = ' ' + what;
	}
	return what;
}



// @ts-ignore
@inline
export function mksigned16(what: u32): i32 {
     return what >= 0x8000 ? -(0x10000 - what) : what;
}

export function dec2(val: u32): string {
    let outstr = val.toString();
    while(outstr.length < 2) outstr = '0' + outstr;
    return outstr;
}

export function hex2(val: u32): string {
    let outstr = val.toString(16);
    while(outstr.length < 2) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

export function hex5(val: u32): string {
    let outstr = val.toString(16);
    while(outstr.length < 5) outstr = '0' + outstr;
    return outstr.toUpperCase();
}


export function hex4(val: u32): string {
    let outstr = val.toString(16);
    while(outstr.length < 4) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

export function hex6(val: u32): string {
    let outstr = val.toString(16);
    while(outstr.length < 6) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

export function hex8(val: u32): string {
    let outstr = val.toString(16);
    while(outstr.length < 8) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

export function hex0x2(val: u32): String {
    return '0x' + hex2(val);
}

export function hex0x4(val: u32): String {
    return '0x' + hex4(val);
}

export function hex0x6(val: u32): String {
    return '0x' + hex6(val);
}

class perf_split_t {
    name: String
    order: u32
    total: f64 = 0
    sample: f64 = 0
    constructor(name: String, order: u32) {
        this.name = name;
        this.order = order;
    }
}

export class perf_timer_t {
    name: String
    samples: u32 = 0
    splits: Map<String, perf_split_t> = new Map<String, perf_split_t>();
    splits_order: Map<u32, String> = new Map<u32, String>();
    splits_order_r: Map<String, u32> = new Map<String, u32>();

    sample_start: f64 = 0
    sample_end: f64 = 0
    sample_time_total: f64 = 0

    req_breakdowns: u32 = 0
    breakdown_every: u32 = 0

    num_keys: u32 = 0;

    constructor(name: String, breakdown_every: u32, splits: Array<String>) {
        this.name = name;
        this.breakdown_every = breakdown_every;

        for (let i: u32 = 0, k: u32 = <u32>splits.length; i < k; i++) {
            this.add_split(splits[i]);
        }
    }

    add_split(name: String): void {
        this.splits_order.set(this.num_keys, name);
        this.splits_order_r.set(name, this.num_keys);
        this.splits.set(name, new perf_split_t(name, this.num_keys));
        this.num_keys++;
    }

    start_sample(): void {
        this.sample_start = performance.now();
    }

    record_split(name: String): void {
        this.splits.get(name).sample = performance.now();
    }

    end_sample(): void {
        this.sample_end = performance.now();
        this.samples++;
        //this.sample_time_total += this.sample_end - this.sample_start;
        this.do_samples();
        this.req_breakdowns++;
        if (this.req_breakdowns >= this.breakdown_every) {
            this.req_breakdowns = 0;
            this.analyze();
            this.reset();
        }
    }

    analyze(): void {
        console.log('----Breakdown of performance for ' + this.name);
        console.log('Sample size: ' + this.samples.toString());
        let e = this.splits.keys()
        for (let sn: u32 = 0; sn < this.num_keys; sn++) {
            let split = this.splits.get(e[sn]);
            console.log(split.name + ': ' + (split.total / this.sample_time_total).toString() + ', avg ' + (split.total / this.samples).toString());
        }
        console.log('TOTAL TIME TAKEN ' + this.sample_time_total.toString());
    }

    // Reset statistics
    reset(): void {
        let e = this.splits.keys()
        for (let i: u32 = 0; i < this.num_keys; i++) {
            this.splits.get(e[i]).total = 0;
        }
        this.samples = 0;
        this.sample_time_total = 0;
    }

    // Take reported splits and tally up times
    do_samples(): void {
        let last_val = this.sample_start;
        let e = this.splits.keys();
        for (let i: u32 = 0; i < this.num_keys; i++) {
            const split = this.splits.get(e[i]);
            if (split.sample === 0) { console.log('YO ' + i.toString()); }
            //console.log(split.sample);
            split.total += (split.sample - last_val);
            last_val = split.sample;
        }
        this.sample_time_total += last_val;
    }
}
