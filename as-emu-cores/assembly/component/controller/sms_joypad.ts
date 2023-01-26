import {SMSGG, SMSGG_variants} from "../../system/sms_gg/sms_gg";

export class smspad_inputs {
    b1: u32 = 0;
    b2: u32 = 0;
    start: u32 = 0;
    up: u32 = 0;
    down: u32 = 0;
    left: u32 = 0;
    right: u32 = 0;
}

class SMSGG_gamepad_pins {
    tr: u32 = 1 // button 2
    th: u32 = 1
    tl: u32 = 1 // button 1
    up: u32 = 1
    down: u32 = 1
    left: u32 = 1
    right: u32 = 1
}

export class SMSGG_gamepad {
    num: u32
    input_waiting: smspad_inputs = new smspad_inputs();
    variant: SMSGG_variants
    pins: SMSGG_gamepad_pins = new SMSGG_gamepad_pins()

    constructor(variant: SMSGG_variants, num: u32) {
        this.variant = variant;
        this.num = num;
    }

    buffer_input(from: smspad_inputs): void {
        this.input_waiting.up = from.up;
        this.input_waiting.down = from.down;
        this.input_waiting.left = from.left;
        this.input_waiting.right = from.right;
        this.input_waiting.b1 = from.b1;
        this.input_waiting.b2 = from.b2;
        if (this.variant === SMSGG_variants.GG) {
            this.input_waiting.start = from.start;
        }
        else {
            if (this.num === 1) this.input_waiting.start = from.start;
        }
    }

    read(): u32 {
        this.latch();
        return (this.pins.up) | (this.pins.down << 1) | (this.pins.left << 2) | (this.pins.right << 3) | (this.pins.tl << 4) | (this.pins.tr << 5) | 0x40;
    }

    latch(): void {
        // Set our pins based on current input. 1 is high
        this.pins.up = this.input_waiting.up ? 0 : 1;
        this.pins.down = this.input_waiting.down ? 0 : 1;
        this.pins.left = this.input_waiting.left ? 0 : 1;
        this.pins.right = this.input_waiting.right ? 0 : 1;
        this.pins.tr = this.input_waiting.b2 ? 0 : 1;
        this.pins.tl = this.input_waiting.b1 ? 0 : 1;
    }
}
