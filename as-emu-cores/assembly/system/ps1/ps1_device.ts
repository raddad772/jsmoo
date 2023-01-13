// Thanks to rustation-ng

import {DsrState, DsrStateKind} from "./ps1_pad";
import {Button} from "./ps1_gamepad";

export class u8DsrState {
    r1: u8
    r2: DsrState

    constructor(r1: u8 = 0xFF, r2: DsrState|null = null) {
        this.r1 = r1;
        if (r2 === null)
            this.r2 = new DsrState();
        else
            this.r2 = r2;
    }
}

export interface DeviceInterface {
    memory: Array<u8>

    // Human-readable description
    description(): string;

    // called when /select signal goes low
    select(): void;

    handle_command(seq: u8, cmd: u8): u8DsrState;
    write_counter(): u32;
    connected(): void;

    set_button_state(button: Button, state: u32): void;
}

class DisconnectedDevice implements DeviceInterface {
    memory: Array<u8>

    constructor() {
        this.memory = new Array<u8>(0);
    }

    description(): string {
        return 'Disconnected';
    }

    set_button_state(button: Button, state: u32): void {};

    handle_command(seq: u8, cmd: u8): u8DsrState {
        return new u8DsrState(0xFF, new DsrState());
    }

    connected(): void {}
    write_counter(): u32 {return 0};
    select(): void {}
}

export enum PeripheralKind {
    Disconnected,
    GamePad,
    MemoryCard
}

export class Peripheral {
    kind: PeripheralKind = PeripheralKind.Disconnected
    device: DeviceInterface
    seq: u8 = 0
    active: boolean = false

    constructor(device: DeviceInterface|null = null) {
        if (device === null) this.device = new DisconnectedDevice();
        else this.device = device;
    }

    select(): void {
        this.active = true;
        this.seq = 0;
        this.device.select();
    }

    exchange_byte(cmd: u8): u8DsrState {
        if (!this.active)
            return new u8DsrState(0xFF, new DsrState());

        let r = this.device.handle_command(this.seq, cmd);

        this.active = r.r2.kind !== DsrStateKind.Idle;
        this.seq += 1;

        return r;
    }

    connect_device(device: DeviceInterface): void {
        this.device = device;
        this.device.connected();
    }

    disconnect_device(): void {
        this.device = new DisconnectedDevice();
    }
}

export function disconnected_gamepad(): Peripheral { return new Peripheral(); }
export function disconnected_memory_card(): Peripheral { return new Peripheral(); }

