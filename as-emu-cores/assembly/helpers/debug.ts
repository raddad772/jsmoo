import {JSMOO_SYSTEMS} from "../glue/global_player";
import {R3000} from "../component/cpu/r3000/r3000";
import {m6502} from "../component/cpu/m6502/m6502";
import {SM83_t} from "../component/cpu/sm83/sm83";
import {hex8, padl} from "./helpers";

export enum D_RESOURCE_TYPES {
    none,
    R5A22,
    SPC700,
    WDC65C816,
    M6502,
    Z80,
    SM83,
    R3000
}

export const R3000_COLOR = '{b}';
export const TRACE_COLOR = true;
export const TRACE_ADDR = '{*}';

// @ts-ignore
@inline
function trace46(addr: u64): string {
    return hex8(<u32>addr);
}

function kindstr(kind: D_RESOURCE_TYPES): string {
    switch(kind) {
        case D_RESOURCE_TYPES.M6502:
            return '(M6502)';
        case D_RESOURCE_TYPES.SM83:
            return '(SM83)';
        case D_RESOURCE_TYPES.R3000:
            return '(R3000)';
        default:
            return 'UNKNOWN'
    }
}

export function trace_start_format(kind: string, kind_color: string, trace_cycles: u64, middle: string, addr: u64): string {
    let outstr: string = '';
    if (TRACE_COLOR)
        outstr = kind_color + kind + '{/}';
    else
        outstr = kind;
    outstr += '(' + padl(trace_cycles.toString(), 6) + ')' + middle;
    if (TRACE_COLOR)
        outstr += TRACE_ADDR + trace46(addr) + '{/} ';
    else
        outstr += trace46(addr) + ' ';
    return outstr;
}

class stringFIFO {
    max_items: u32
    length: u32 = 0
    head: u32 = 0
    array: Array<string>
    constructor(max_items: u32) {
        this.max_items = max_items;
        this.array = new Array<string>(max_items);
    }

    add(str: string): void {
        if (this.length === this.max_items) {
            // Circle the FIFO around
            let old_head = this.head;
            this.head = (this.head + 1) % this.max_items;
            this.array[old_head] = str;
            return;
        }
        else {
            this.array[(this.head+this.length)%this.max_items] = str;
            this.length++;
        }
    }

    empty(): bool {
        return this.length === 0;
    }

    clear(): void {
        this.head = 0;
        this.length = 0;
    }

    pop(): string {
        if (this.length === 0) return '';
        this.length--;
        let r = this.array[this.head];
        this.head = (this.head + 1) % this.max_items;
        return r;
    }
}

class traces_t {
    limit_traces: bool = false
    oldest_trace: u32 = 0
    num_traces: u32 = 0
    max_traces: u32 = 400
    traces: stringFIFO = new stringFIFO(200);

    add(kind: D_RESOURCE_TYPES, master_clock: i64, trace: string): void {
        this.traces.add(trace);
    }

    clear(): void {
        this.traces.clear();
    }

    do_empty(): Array<string> {
        let d: Array<string> = new Array<string>();
        while(this.traces.length > 0) {
            d.push(this.traces.pop());
        }
        return d;
    }
}

export enum EMU_GLOBALS {
    global_player,
    debug
}

export class debugger_ui_event {
    dest: EMU_GLOBALS = EMU_GLOBALS.debug;
    what: string = ''
    val_bool: bool = false

    constructor(dest: EMU_GLOBALS, what: string, val: bool) {
        this.dest = dest;
        this.what = what;
        this.val_bool = val;
    }
}

class debug_cpu {
    kind: D_RESOURCE_TYPES = D_RESOURCE_TYPES.none;
    ptr: usize = 0;

    enable_tracing(): void {
        switch(this.kind) {
            case D_RESOURCE_TYPES.R3000:
                changetype<R3000>(this.ptr).enable_tracing();
                break;
            case D_RESOURCE_TYPES.M6502:
                changetype<m6502>(this.ptr).enable_tracing();
                break;
            case D_RESOURCE_TYPES.SM83:
                changetype<SM83_t>(this.ptr).enable_tracing();
                break;
            default:
                console.log('enable tracing for unsupported kind');
                break;
        }
    }

    disable_tracing(): void {
        switch(this.kind) {
            case D_RESOURCE_TYPES.R3000:
                changetype<R3000>(this.ptr).disable_tracing();
                break;
            case D_RESOURCE_TYPES.M6502:
                changetype<m6502>(this.ptr).disable_tracing();
                break;
            case D_RESOURCE_TYPES.SM83:
                changetype<SM83_t>(this.ptr).disable_tracing();
                break;
            default:
                console.log('disable tracing for unsupported kind');
                break;
        }
    }
}

export class debugger_info_t {
    broke: boolean = false;
    traces: Array<string> = new Array<string>();
}

class debugger_t {
    do_break: bool = false
    brk_on_NMIRQ: bool = false
    watch_on: bool = false
    tracing: bool = false;
    traces: traces_t = new traces_t();
    syskind: JSMOO_SYSTEMS = JSMOO_SYSTEMS.NONE;
    tracing_for: StaticArray<boolean> = new StaticArray<boolean>(50);
    cpus: Array<debug_cpu> = new Array<debug_cpu>();
    send_break: boolean = false;

    constructor() {

    }

    get_dbg_info(): debugger_info_t {
        let d = new debugger_info_t();
        d.broke = this.send_break;
        this.send_break = false;

        d.traces = this.traces.do_empty();

        return d;
    }

    add_cpu(kind: D_RESOURCE_TYPES, cpu: usize): void {
        let mcpu: debug_cpu = new debug_cpu();
        mcpu.kind = kind;
        mcpu.ptr = cpu;
        let found = false;
        for (let k = 0; k < this.cpus.length; k++) {
            if (this.cpus[k].kind === kind) {
                found = true;
                this.cpus[k].ptr = cpu;
            }
        }
        if (!found) {
            this.cpus.push(mcpu);
        }
    }

    remove_cpu(kind: D_RESOURCE_TYPES): void {
        let found = false;
        let i: i32 = -1;
        for (let k = 0; k < this.cpus.length; k++) {
            if (this.cpus[k].kind === kind) {
                let i = k;
                found = true;
                break;
            }
        }
        if (found) {
            console.log('IMPLEMENT CPUS TRIM!');
            //delete this.cpus[i];
        }
    }

    break(who: D_RESOURCE_TYPES = D_RESOURCE_TYPES.none): void {
        console.log('DOING BREAK');
        this.do_break = true;
        this.send_break = true;
    }

    enable_tracing(): void {
        this.tracing = true;
        this.cpu_refresh_tracing();
    }

    disable_tracing(): void {
        this.tracing = false;
        this.cpu_refresh_tracing();
    }

    enable_tracing_for(kind: D_RESOURCE_TYPES): void {
        let old = this.tracing_for[kind];
        this.tracing_for[kind] = true;
        if (!old) this.cpu_refresh_tracing();
    }

    disable_tracing_for(kind: D_RESOURCE_TYPES): void {
        let old = this.tracing_for[kind];
        this.tracing_for[kind] = false
        if (old) this.cpu_refresh_tracing();
    }

    cpu_refresh_tracing(): void {
        for (let k = 0; k < this.cpus.length; k++) {
            if (this.cpus[k].kind === D_RESOURCE_TYPES.none) continue;
            if (!this.tracing) {
                this.cpus[k].disable_tracing();
                continue;
            }
            if (this.tracing_for[this.cpus[k].kind]) {
                this.cpus[k].enable_tracing();
            }
            else {
                this.cpus[k].disable_tracing();
            }
        }
    }

    process_CPU_trace(set_to: boolean): void {
        if (set_to) {
            this.enable_tracing()
            switch (this.syskind) {
                case JSMOO_SYSTEMS.PS1:
                    dbg.enable_tracing_for(D_RESOURCE_TYPES.R3000);
                    break;
                case JSMOO_SYSTEMS.DMG:
                    dbg.enable_tracing_for(D_RESOURCE_TYPES.SM83);
                    break;
                case JSMOO_SYSTEMS.GBC:
                    dbg.enable_tracing_for(D_RESOURCE_TYPES.SM83);
                    break;
                case JSMOO_SYSTEMS.NES_USA:
                    dbg.enable_tracing_for(D_RESOURCE_TYPES.M6502);
                    break;
                default:
                    console.log('Unknown tracing partner');
                    break;
            }
        }
        else {
            this.disable_tracing();
            switch(this.syskind) {
                case JSMOO_SYSTEMS.PS1:
                    dbg.disable_tracing_for(D_RESOURCE_TYPES.R3000);
                    break;
                case JSMOO_SYSTEMS.DMG:
                    dbg.disable_tracing_for(D_RESOURCE_TYPES.SM83);
                    break;
                case JSMOO_SYSTEMS.GBC:
                    dbg.disable_tracing_for(D_RESOURCE_TYPES.SM83);
                    break;
                case JSMOO_SYSTEMS.NES_USA:
                    dbg.disable_tracing_for(D_RESOURCE_TYPES.M6502);
                    break;
                default:
                    console.log('Unknown tracing partner');
                    break;
            }
        }
    }

    ui_event(what: string, val_bool: boolean): void {
        if (what == 'tracingCPU') {
            this.process_CPU_trace(val_bool);
            return;
        }
        if (what == 'brk_on_NMIRQ') {
            this.brk_on_NMIRQ = val_bool;
            return;
        }
        if (what == 'watch_on') {
            this.watch_on = val_bool;
            return;
        }
        console.log('UNHANDLED DBG EVENT ' + what);
    }
}

export const dbg = new debugger_t();

