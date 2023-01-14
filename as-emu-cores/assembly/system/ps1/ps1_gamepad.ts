// Very heavily inspried by Rustation-ng

// according to position in the serial protocol
import {DeviceInterface, u8DsrState} from "./ps1_device";
import {DsrStateKind} from "./ps1_pad";

export enum Button {
    Select,
    L3,
    R3,
    Start,
    DUp,
    DRight,
    DDown,
    DLeft,
    L2,
    R2,
    L1,
    R1,
    Triangle,
    Circle,
    Cross,
    Square,
    Analog = 255
}

export class PS1_DigitalPad implements DeviceInterface {
    state: u16
    memory: Array<u8> = new Array<u8>(0);

    constructor(state: u16 = 0xFFFF) {
        this.state = state;
    }

    select(): void {}
    write_counter(): u32 { return 0; }
    connected(): void {}

    description(): string { return 'PS1 Digital Controller (SCPH-1080)'};

    handle_command(seq: u8, cmd: u8): u8DsrState {
        let d = new u8DsrState();
        let resp: u8;
        let send_dsr: boolean;
        console.log('HANDLE CMD! ' + seq.toString());
        switch(seq) {
            case 0:
                resp = 0xFF;
                send_dsr = cmd === 0x01;
                break;
            case 1:
                resp = 0x41;
                send_dsr = cmd === 0x42;
                break;
            case 2:
                resp = 0x5a;
                send_dsr = true;
                break;
            case 3:
                resp = <u8>this.state;
                send_dsr = true;
                break;
            case 4:
                resp = <u8>(this.state >>> 8);
                send_dsr = false;
                break;
            default:
                console.log('ERROR SHOULD NOT BE HERE');
                return d;
        }
        if (send_dsr) {
            d.r2.kind = DsrStateKind.Pending;
            d.r2.delay = 360;
            d.r2.duration = 90;
        }
        return d;
    }

    set_button_state(button: Button, state: u32): void {
        if (button === Button.Analog) return;
        let s = this.state;
        let mask: u16 = 1 << <u16>button;
        if (state) s &= (mask ^ 0xFFFF);
        else s |= mask;

        // No support of L3/R3 on digipad, so set these to 1
        this.state = s | 0x06;
    }
}