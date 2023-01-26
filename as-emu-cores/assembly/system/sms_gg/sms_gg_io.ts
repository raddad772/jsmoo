import {REGION, SMSGG, SMSGG_variants} from "./sms_gg";
import {SMSGG_gamepad, smspad_inputs} from "../../component/controller/sms_joypad";
import {SMSGG_VDP} from "./sms_gg_vdp";
import {SN76489} from "../../component/audio/sn76489/sn76489";
import {SMSGG_mapper_sega} from "./sms_gg_mapper_sega";


function cpu_in_sms1(bus: SMSGG_bus, addr: u32, val: u32): u32 {
    addr &= 0xFF;
    if (addr <= 0x3F) {
        // reads return last byte of the instruction which read the port
        return val;
    }
    if (addr <= 0x7F) {
        if (addr & 1) return bus.vdp!.read_hcounter();
        return bus.vdp!.read_vcounter();
    }
    if (addr <= 0xBF) {
        if (addr & 1) return bus.vdp!.read_status();
        return bus.vdp!.read_data();
    }
    // C0-FF, even is /O port A/B reg
    // Odd is I/O port B/misc.
    if (addr & 1) return bus.read_reg_ioport2(val);
    return bus.read_reg_ioport1(val);
}

function cpu_out_sms1(bus: SMSGG_bus, addr: u32, val: u32): void {
    addr &= 0xFF;
    if (addr <= 0x3F) {
        // even memory control
        // odd I/O control
        if (addr & 1) bus.write_reg_io_ctrl(val);
        else bus.write_reg_memory_ctrl(val);
        return;
    }
    if  (addr <= 0x7F) {
        bus.sn76489!.write_data(val);
        return;
    }
    if (addr <= 0xBF) {
        // even goes to VDP data
        // odd goes to VDP control
        if (addr & 1) bus.vdp!.write_control(val);
        else bus.vdp!.write_data(val);
        return;
    }
    // C0-FF, no effect
}

function cpu_in_sms2(bus: SMSGG_bus, addr: u32, val: u32): u32 {
    addr &= 0xFF;
    //console.log('IN', hex2(addr));
    if (addr <= 0x3F) {
        // reads return last byte of the instruction which read the port
        return 0xFF;
    }
    if (addr <= 0x7F) {
        if (addr & 1) return bus.vdp!.read_hcounter();
        return bus.vdp!.read_vcounter();
    }
    if (addr <= 0xBF) {
        if (addr & 1) return bus.vdp!.read_status();
        return bus.vdp!.read_data();
    }
    // C0-FF, even is /O port A/B reg
    // Odd is I/O port B/misc.
    if (addr & 1) return bus.read_reg_ioport2(val);
    return bus.read_reg_ioport1(val);

}

function cpu_out_sms2(bus: SMSGG_bus, addr: u32, val: u32): void {
    addr &= 0xFF;
    if (addr <= 0x3F) {
        // even memory control
        // odd I/O control
        if (addr & 1) bus.write_reg_io_ctrl(val);
        else bus.write_reg_memory_ctrl(val);
        return;
    }
    if  (addr <= 0x7F) {
        bus.sn76489!.write_data(val);
        return;
    }
    if (addr <= 0xBF) {
        // even goes to VDP data
        // odd goes to VDP control
        if (addr & 1) bus.vdp!.write_control(val);
        else bus.vdp!.write_data(val);
        return;
    }
    // C0-FF, no effect
}

function cpu_in_gg(bus: SMSGG_bus, addr: u32, val: u32): u32 {
    addr &= 0xFF;
    switch(addr) {
        case 0: // Various stuff
            // TODO: make this more complete
            return 0x40 | (bus.gg_joymap!.start ? 0x80 : 0);
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            return 0;
        case 6:
        case 7:
            return 0;
        /*case 0xDC: // JOYP1
            // up down left right b1 b2
            let buttons = bus.gg_joymap.latch();
            let val = buttons.up ? 0 : 1;
            val |= buttons.down ? 0 : 2;
            val |= buttons.left ? 0 : 4;
            val |= buttons.right ? 0 : 8;
            val |= buttons.b1 ? 0 : 0x10;
            val |= buttons.b2 ? 0 : 0x20;
            val |= 0xC0;
            return val;
        case 0xDD:
            return 0xFF;*/

    }
    if (addr <= 0x3F) {
        // reads return last byte of the instruction which read the port
        return 0xFF;
    }
    if (addr <= 0x7F) {
        if (addr & 1) return bus.vdp!.read_hcounter();
        return bus.vdp!.read_vcounter();
    }
    if (addr <= 0xBF) {
        if (addr & 1) return bus.vdp!.read_status();
        return bus.vdp!.read_data();
    }
    // C0-FF, even is /O port A/B reg
    // Odd is I/O port B/misc.
    if (addr & 1) return bus.read_reg_ioport2(val);
    return bus.read_reg_ioport1(val);

}

function cpu_out_gg(bus: SMSGG_bus, addr: u32, val: u32): void {
    addr &= 0xFF;
    if (addr <= 0x3F) {
        // even memory control
        // odd I/O control
        if (addr & 1) bus.write_reg_io_ctrl(val);
        else bus.write_reg_memory_ctrl(val);
        return;
    }
    if  (addr <= 0x7F) {
        bus.sn76489!.write_data(val);
        return;
    }
    if (addr <= 0xBF) {
        // even goes to VDP data
        // odd goes to VDP control
        if (addr & 1) bus.vdp!.write_control(val);
        else bus.vdp!.write_data(val);
        return;
    }
    // C0-FF, no effect
}



class SMSGG_controller_port {
    variant: SMSGG_variants
    which: PORTS

    TR_level: u32 = 1
    TH_level: u32 = 1
    TR_direction: u32 = 1
    TH_direction: u32 = 1

    attached_device: SMSGG_gamepad|null = null;

    constructor(variant: SMSGG_variants, which: PORTS) {
        this.variant = variant;
        this.which = which;
    }

    write(): void {
    }

    read(): u32 {
        let ad = this.attached_device;
        if (!ad) return 0x7f;
        return ad.read();
    }

    reset(): void {
        this.TR_level = 1;
        this.TH_level = 1;
        this.TR_direction = 1;
        this.TH_direction = 1;
    }
}

class SMSGG_reset_button {
    value: u32 = 1
    variant: SMSGG_variants
    constructor(variant: SMSGG_variants) {
        this.variant = variant;
    }

    latch(): void {
        if (this.variant === SMSGG_variants.GG) this.value = 1; // GG has no reset button
        else {
            this.value = 1; // TODO: set to 0 if pressed
        }
    }

    read(): u32 {
        return this.value;
    }
}

class SMSGG_pause_button {
    value: u32 = 0
    variant: SMSGG_variants

    constructor(variant: SMSGG_variants) {
        this.variant = variant
    }

    poll(): u32 {
        // TODO: Read input and return here
        return this.value;
    }
}

enum PORTS {A, B}

export class SMSGG_bus {
    variant: SMSGG_variants
    region: REGION

    vdp: SMSGG_VDP|null = null

    system: SMSGG|null = null
    sn76489: SN76489|null = null;

    mapper: SMSGG_mapper_sega

    controllerA: SMSGG_gamepad
    portA: SMSGG_controller_port
    portB: SMSGG_controller_port

    io_disable: u32 = 0

    cpu_in: (bus: SMSGG_bus, addr: u32, val: u32) => u32 = cpu_in_sms2;
    cpu_out: (bus: SMSGG_bus, addr: u32, val: u32) => void = cpu_out_sms2;

    gg_joymap: smspad_inputs|null=null

    constructor(variant: SMSGG_variants, region: REGION, gg_joymap: smspad_inputs) {
        this.variant = variant;
        this.region = region;

        this.mapper = new SMSGG_mapper_sega(variant);

        this.controllerA = new SMSGG_gamepad(variant, 1);
        this.portA = new SMSGG_controller_port(variant,PORTS.A);
        this.portB = new SMSGG_controller_port(variant, PORTS.B);
        this.portA.attached_device = this.controllerA;

        switch(variant) {
            case SMSGG_variants.SMS1:
                this.cpu_in = cpu_in_sms1;
                this.cpu_out = cpu_out_sms1;
                break;
            case SMSGG_variants.SMS2:
                this.cpu_in = cpu_in_sms2;
                this.cpu_out = cpu_out_sms2;
                break;
            default: // GameGear is only emulated one left
                this.cpu_in = cpu_in_gg;
                this.cpu_out = cpu_out_gg;
                this.gg_joymap = gg_joymap;
                break;
        }
    }

    update_inputs(inp1: smspad_inputs, inp2: smspad_inputs): void {
        this.controllerA.buffer_input(inp1);
        //this.controllerB.buffer_input(inp2);
    }

    reset(): void {
        this.mapper.reset();
    }

    // 0x3E memory control
    write_reg_memory_ctrl(val: u32): void {
        if (this.variant !== SMSGG_variants.GG) {
            this.mapper.set_bios(((val & 8) >>> 3) ^ 1); // 1 = disabled, 0 = enabled
            this.mapper.enable_cart = ((val & 0x40) >>> 6) ^ 1;
        }
        this.io_disable = (val & 4) >>> 2;
    }

    write_reg_io_ctrl(val: u32): void {
        let thl1 = this.portA.TH_level;
        let thl2 = this.portB.TH_level;

        this.portA.TR_direction = val & 1;
        this.portA.TH_direction = (val & 2) >>> 1;
        this.portB.TR_direction = (val & 4) >>> 2;
        this.portB.TH_direction = (val & 8) >>> 3;

        if (this.region === REGION.NTSCJ) {
            // Japanese sets level to direction
            this.portA.TH_level = this.portA.TH_direction;
            this.portB.TH_level = this.portB.TH_direction;
        } else {
            // others allow us to just set stuff directly I guess
            this.portA.TR_level = (val & 0x10) >>> 4;
            this.portA.TH_level = (val & 0x20) >>> 5;
            this.portB.TR_level = (val & 0x40) >>> 6;
            this.portB.TH_level = (val & 0x80) >>> 7;
        }
    }

    read_reg_ioport1(val: u32): u32 {
        /*
        D7 : Port B DOWN pin input
         D6 : Port B UP pin input
         D5 : Port A TR pin input
         D4 : Port A TL pin input
         D3 : Port A RIGHT pin input
         D2 : Port A LEFT pin input
         D1 : Port A DOWN pin input
         D0 : Port A UP pin input
         */
        let pinsA = this.portA.read();
        let pinsB = this.portB.read();
        let r: u32 = (pinsA & 0x3F);
        r |= (pinsB & 3) << 6;
        if (this.portA.TR_direction === 0) {
            r = (r & 0xDF) | (this.portA.TR_level << 5);
        }
        return r;
    }

    read_reg_ioport2(val: u32): u32 {
        /*
         D7 : Port B TH pin input
         D6 : Port A TH pin input
         D5 : Unused
         D4 : RESET button (1= not pressed, 0= pressed)
         D3 : Port B TR pin input
         D2 : Port B TL pin input
         D1 : Port B RIGHT pin input
         D0 : Port B LEFT pin input
         */
        let pinsA = this.portA.read();
        let pinsB = this.portB.read();
        //this.reset_button.latch();
        let r: u32 = (pinsB >>> 2) & 0x0F;
        //r |= this.reset_button.value << 4;
        r |= 0x20 | 0x10;
        r |= (pinsA & 0x40);
        r |= (pinsB & 0x40) << 1;
        if (this.portB.TR_direction === 0) r = (r & 0xF7) | (this.portB.TR_level << 3);
        if (this.portA.TH_direction === 0) r = (r & 0xBF) | (this.portA.TH_level << 6);
        if (this.portB.TH_direction === 0) r = (r & 0x7F) | (this.portB.TH_level << 7);
        return r;
    }

    cpu_read(addr: u32, val: u32): u32 {
        return this.mapper.read(addr, val);
    }

    cpu_write(addr: u32, val: u32): void {
        this.mapper.write(addr, val);
    }

    load_ROM_from_RAM(name: string, what: usize, sz: u32): void {
        this.mapper.load_ROM_from_RAM(name, what, sz);
    }
}
