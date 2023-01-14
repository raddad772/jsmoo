// Based on RustStation implementation, because I didn't want to do it

import {Peripheral, PeripheralKind, u8DsrState} from "./ps1_device";
import {PS1, PS1_IRQ} from "./ps1";
import {MT} from "./ps1_mem";
import {hex2} from "../../helpers/helpers";

class Optional<T> {
    value: T
    null: boolean = false

    constructor(val: T) {
        this.value = val;
    }
}

enum Target {
    PadMemCard1,
    PadMemCard2
}

enum TransferStateKind {
    Idle,
    TxStart,
    RxAvailable
}

class TransferState {
    kind: TransferStateKind = TransferStateKind.Idle
    delay: i32 = 0
    rx_available_delay: i32 = 0
    value: u8 = 0

    is_idle(): boolean {
        return this.kind === TransferStateKind.Idle;
    }
}

export enum DsrStateKind {
    Idle,
    Pending,
    Active
}

export class DsrState {
    kind: DsrStateKind = DsrStateKind.Idle
    delay: i32 = 0
    duration: i32 = 0

    constructor(kind: DsrStateKind=DsrStateKind.Idle, delay: i32 = 0, duration: i32 = 0) {
        this.kind = kind;
        this.delay = delay;
        this.duration = duration;
    }

    is_active(): u32 {
        return +(this.kind === DsrStateKind.Active);
    }


    delay_by(offset: i32): void {
        if (this.kind === DsrStateKind.Pending)
            this.delay += offset;
    }

    new_delay_by(offset: i32): DsrState {
        switch(this.kind) {
            case DsrStateKind.Idle:
                return new DsrState(DsrStateKind.Idle, 0, 0);
            case DsrStateKind.Pending:
                return new DsrState(DsrStateKind.Pending, this.delay+offset, this.duration);
            default:
                unreachable()
                return new DsrState(DsrStateKind.Active, this.delay, this.duration)
        }
    }

    to_dsr(): i32 {
        switch(this.kind) {
            case DsrStateKind.Idle:
                return -1;
            case DsrStateKind.Pending:
                return this.delay;
            case DsrStateKind.Active:
                return -1;
        }
    }

    run(cycles: i32): void {
        while (cycles > 0) {
            switch(this.kind) {
                case DsrStateKind.Idle:
                    cycles = 0;
                    break;
                case DsrStateKind.Pending:
                    if (this.delay > cycles) {
                        this.delay = this.delay - cycles;
                        cycles = 0;
                        this.kind = DsrStateKind.Pending;
                    } else {
                        cycles -= this.delay;
                        this.delay = 0;
                        this.kind = DsrStateKind.Active;
                    }
                    break;
                case DsrStateKind.Active:
                    if (this.duration > cycles) {
                        this.duration = this.duration - cycles;
                        cycles = 0;
                    } else {
                        cycles -= this.duration;
                        this.kind = DsrStateKind.Idle;
                    }
            }
        }
    }
}

function Target_from(ctrl: u16): Target {
    if ((ctrl & 0x2000) === 0) return Target.PadMemCard1;
    return Target.PadMemCard2;
}

export class PS1_pad_memcard {
    baud_div: u16 = 0
    mode: u8 = 0
    tx_en: u32 = 0
    tx_pending: i16 = -1
    select: u32 = 0
    target: Target = Target.PadMemCard1
    unknown: u8 = 0
    rx_en: u32 = 0
    dsr_it: u32 = 0
    interrupt: u32 = 0
    response: u8 = 0xFF
    rx_not_empty: u32 = 0

    pad1: Peripheral = new Peripheral();
    pad1_dsr: DsrState = new DsrState();

    pad2: Peripheral = new Peripheral();
    pad2_dsr: DsrState = new DsrState();

    memcard1: Peripheral = new Peripheral();
    memcard1_dsr: DsrState = new DsrState();

    memcard2: Peripheral = new Peripheral();
    memcard2_dsr: DsrState = new DsrState();

    transfer_state: TransferState = new TransferState()

    maybe_exchange_byte(): void {
        if (this.tx_pending === -1) return;
        if (!this.tx_en) return;
        if (!this.transfer_state.is_idle()) return;
        console.log('OK EXCHANGE!')

        let to_send: u8 = <u8>this.tx_pending;

        if ((this.baud_div < 80) || (this.baud_div > 239)) {
            console.log('WARNING unimplemented baud divider! ' + this.baud_div.toString());
            return;
        }
        if (!this.select) {
            console.log('WARNING pad/memcard TX without selection');
            return;
        }

        this.tx_pending = -1;
        let bd: i32 = <i32>this.baud_div;
        let to_tx_start = bd - 40;
        let tx_total = (bd - 11) * 11
        let to_tx_end = tx_total - to_tx_start;

        let to_dsr_start = tx_total - bd;

        let padr: u8DsrState; // = new u8DsrState();
        let mcr: u8DsrState; // = new u8DsrState
        let resp: u8 = 0;

        switch(this.target) {
            case Target.PadMemCard1:
                padr = this.pad1.exchange_byte(to_send);
                mcr = this.memcard1.exchange_byte(to_send);

                this.pad1_dsr = padr.r2;
                this.pad1_dsr.delay_by(to_dsr_start);
                this.memcard1_dsr = mcr.r2;
                this.memcard1_dsr.delay_by(to_dsr_start);
                resp = padr.r1 * mcr.r1;
                break;
            case Target.PadMemCard2:
                padr = this.pad2.exchange_byte(to_send);
                mcr = this.memcard2.exchange_byte(to_send);

                this.pad2_dsr = padr.r2;
                this.pad2_dsr.delay_by(to_dsr_start);
                this.memcard2_dsr = mcr.r2;
                this.memcard2_dsr.delay_by(to_dsr_start);
                resp = padr.r1 * mcr.r1;
                break;
            default:
                unreachable();
                console.log('WHATT????');
                return;
        }

        this.transfer_state.kind = TransferStateKind.TxStart;
        this.transfer_state.delay = to_tx_start;
        this.transfer_state.rx_available_delay = to_tx_end;
        this.transfer_state.value = resp;
    }

    CPU_read(offset: u32, size: MT): u32 {
        switch(offset) {
            case 0:
                if (size !== MT.u8) {
                    console.log('Unhandled gamepad RX access not u8: ' + size.toString());
                    return 0;
                }
                return this.get_response();
            case 4:
                return this.stat();
            case 8:
                return <u32>this.mode;
            case 10:
                return <u32>this.control();
            case 14:
                return <u32>this.baud_div;
            default:
                console.log('Bad gamepad/memcard read? ' + offset.toString());
                return 0;
        }
    }

    CPU_write(offset: u32, size: MT, value: u32, ps1: PS1): void {
        console.log('WRITE! ' + hex2(offset) + ' ' + hex2(value));
        let v = <u16>value;
        switch(offset) {
            case 0:
                if (size !== MT.u8) {
                    console.log('Unimplemented gamepad TX access kind ' + size.toString());
                    return;
                }

                if (this.tx_pending > 0) {
                    console.log('WARNING dropping pad/memcard byte before send');
                }

                this.tx_pending = <i16>(v & 0xFF);
                break;
            case 8:
                this.set_mode(<u8>(v & 0xFF));
                break;
            case 10:
                if ((size !== MT.u16) && (size !== MT.u8)) {
                    console.log('Unimplemented gamepad control access kind ' + size.toString());
                    return;
                }
                this.set_control(v);
                ps1.set_irq(PS1_IRQ.PadMemCardByteRecv, this.interrupt)
                break;
            case 14:
                this.baud_div = v;
                break;
            default:
                console.log('Write to gamepad register undone ' + offset.toString());
                break;
        }

        this.maybe_exchange_byte();
    }

    dsr_active(): u32 {
        return this.pad1_dsr.is_active() |
            this.pad2_dsr.is_active() |
            this.memcard1_dsr.is_active() |
            this.memcard2_dsr.is_active()
    }

    get_response(): u8 {
        let r: u8 = this.response;

        this.rx_not_empty = 0;
        this.response = 0xFF;

        return r;
    }

    stat(): u32 {
        let stat: u32 = 0;

        let tx_ready: u32 = 0
        if (this.transfer_state.kind === TransferStateKind.TxStart) tx_ready = 0;
        else tx_ready = +(this.tx_pending === -1);

        stat |= <u32>tx_ready;
        stat |= (<u32>this.rx_not_empty) << 1;
        stat |= 4;
        stat |= this.dsr_active() << 7;
        stat |= this.interrupt << 9;
        return stat;
    }

    set_mode(mode: u8): void {
        if (mode === this.mode) return;
        if (!this.transfer_state.is_idle()) {
            console.log('WARNING Pad/Memcard change mode during transfer');
        }
        this.mode = mode;
    }

    control(): u16 {
        let ctrl: u16 = 0;
        ctrl |= <u16>this.unknown;
        ctrl |= <u16>this.tx_en;
        ctrl |= <u16>(this.select << 1)
        ctrl |= <u16>(this.rx_en << 2)
        ctrl |= <u16>(this.dsr_it << 12);
        ctrl |= <u16>(this.target << 13);

        return ctrl;
    }

    set_control(ctrl: u16): void {
        let prev_select = this.select;
        let prev_target = this.target;
        if ((ctrl & 0x40) !== 0) {
            // Soft reset
            this.baud_div = 0;
            this.mode = 0;
            this.select = 0;
            this.target = Target.PadMemCard1;
            this.unknown = 0;
            this.interrupt = 0;
            this.rx_not_empty = 0;
            this.transfer_state.kind = TransferStateKind.Idle;
        }
        else {
            if ((ctrl & 0x10) !== 0) // IRQ ack
                this.interrupt = 0;

            this.unknown = <u8>ctrl & 0x28;

            this.tx_en = ctrl & 1;
            this.select = (ctrl >>> 1) & 1;
            this.rx_en = (ctrl >>> 2) & 1;
            this.dsr_it = (ctrl >>> 12) & 1;
            this.target = Target_from(ctrl);

            if (this.rx_en) {
                console.log('Gamepad rx_en not implemented!!!');
                return;
            }

            if (!this.interrupt) {
                this.refresh_irq_level();
                if (this.interrupt) {
                    console.log('dsr_it enabled while DSR signal is active!');
                    return;
                }
            }

            if (ctrl & 0xF00) {
                console.log('Unsupported gamepad interrpts! ' + ctrl.toString());
            }
        }

        if (this.select && (!prev_select || (this.target !== prev_target))) {
            switch(this.target) {
                case Target.PadMemCard1:
                    this.pad1.select();
                    this.memcard1.select();
                    break;
                case Target.PadMemCard2:
                    this.pad2.select();
                    this.memcard2.select();
                    break;
                default:
                    console.log('HOW!?!?!?');
                    return;
            }
        }

        if ((!this.select) || (this.target !== Target.PadMemCard1)) {
            this.pad1_dsr.kind = DsrStateKind.Idle;
            this.memcard1_dsr.kind = DsrStateKind.Idle;
        }

        if ((!this.select) || (this.target !== Target.PadMemCard2)) {
            this.pad2_dsr.kind = DsrStateKind.Idle;
            this.memcard2_dsr.kind = DsrStateKind.Idle;
        }

        let prev_interrupt = this.interrupt;
        this.refresh_irq_level();

        if (!prev_interrupt && this.interrupt) {
            console.log('WARNING Gamepad IRQ ack while DSR is active!');
        }
    }

    refresh_irq_level(): void { this.interrupt |= this.dsr_active() & this.dsr_it; }
}

export function run_controller(psx: PS1, cycles: i32): void {
    run_transfer(psx, cycles);
    run_dsr(psx, cycles);
}

export function run_transfer(psx: PS1, cycles: i32): void {
    while (cycles > 0) {
        let elapsed: i32 = 0
        let ts = psx.mem.pad_memcard.transfer_state
        switch(ts.kind) {
            case TransferStateKind.Idle:
                elapsed = cycles;
                break;
            case TransferStateKind.TxStart:
                if (cycles < ts.delay) {
                    ts.delay = ts.delay - cycles;
                    elapsed = cycles;
                }
                else {
                    ts.kind = TransferStateKind.RxAvailable;
                    // HEREI S GOOD? pad_memcardmod.rs line 370
                    ts.delay = ts.rx_available_delay;
                    elapsed = ts.delay;
                }
                break;
            case TransferStateKind.RxAvailable:
                if (cycles < ts.delay) {
                    ts.kind = TransferStateKind.RxAvailable;
                    ts.delay = ts.rx_available_delay = ts.delay - cycles;
                    elapsed = cycles;
                }
                else {
                    if (psx.mem.pad_memcard.rx_not_empty) {
                        console.log("ERROR! Gamepad RX while FIFO isn't empty!");
                    }
                    psx.mem.pad_memcard.response = ts.value;
                    psx.mem.pad_memcard.rx_not_empty = 1;
                    psx.mem.pad_memcard.transfer_state.kind = TransferStateKind.Idle;
                    elapsed = ts.delay;
                }
                break;
        }

        psx.mem.pad_memcard.maybe_exchange_byte();

        cycles -= elapsed;
    }
}

function run_dsr(psx: PS1, cycles: i32): void {
    let pmc = psx.mem.pad_memcard;
    pmc.pad1_dsr.run(cycles);
    pmc.pad2_dsr.run(cycles);
    pmc.memcard1_dsr.run(cycles);
    pmc.memcard2_dsr.run(cycles);

    pmc.refresh_irq_level();
    psx.set_irq(PS1_IRQ.PadMemCardByteRecv, pmc.interrupt);
}

export function run_controllers(psx: PS1, cycles: i32): void {
    run_controller(psx, cycles);
}