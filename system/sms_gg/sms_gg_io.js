"use strict";

const SER_SMSGG_controller_port = [
    'variant', 'which', 'TR_level',
    'TH_level', 'TR_direction', 'TH_direction'
]
class SMSGG_controller_port {
    constructor(variant, which) {
        this.variant = variant;
        this.which = which;

        this.TR_level = 1;
        this.TH_level = 1;
        this.TR_direction = 1;
        this.TH_direction = 1;

        /**
         * @type {SMSGG_gamepad | null}
         */
        this.attached_device = null;
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_SMSGG_controller_port);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG SMSGG_controller_port version!');
            return false;
        }
        return deserialization_helper(this, from, SER_SMSGG_controller_port);
    }

    write() {
    }

    read() {
        if (this.attached_device === null) return 0x7f;
        return this.attached_device.read();
    }

    reset() {
        this.TR_level = 1;
        this.TH_level = 1;
        this.TR_direction = 1;
        this.TH_direction = 1;
    }
}

const SER_SMSGG_reset_button = [
    'value', 'variant'
]
class SMSGG_reset_button {
    constructor(variant) {
        this.value = 1;
        this.variant = variant;
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_SMSGG_reset_button);
        return o;
    }

    deserialize(from) {
        deserialization_helper(this, from, SER_SMSGG_reset_button);
    }

    latch() {
        if (this.variant === SMSGG_variants.GG) this.value = 1; // GG has no reset button
        else {
            this.value = 1; // Set to 0 if pressed
        }
    }

    read() {
        return this.value;
    }

}

const SER_SMSGG_pause_button = [
    'value'
]
class SMSGG_pause_button {
    constructor(variant) {
        this.value = 0;
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_SMSGG_pause_button);
        return o;
    }

    deserialize(from) {
        deserialization_helper(this, from, SER_SMSGG_pause_button);
    }

    poll() {
        // Read input and return here
        return this.value;
    }
}

const SER_SMSGG_bus = [
    'variant', 'region', 'mapper',
    'controllerA',
    'portA', 'portB', 'reset_button', 'pause_button',
    'io'
];
class SMSGG_bus {
    constructor(variant, region, gg_joymap) {
        this.variant = variant;
        this.region = region;
        /**
         * @type {SMSGG_VDP}
         */
        this.vdp = null;

        /**
         * @type {SMSGG}
         */
        this.system = null;

        this.mapper = new SMSGG_mapper_sega(variant);

        this.notify_IRQ = function(level) { debugger; }
        this.notify_NMI = function(level) { debugger; }

        this.controllerA = new SMSGG_gamepad(variant, 1);
        this.portA = new SMSGG_controller_port(variant,'A');
        this.portB = new SMSGG_controller_port(variant, 'B');
        this.portA.attached_device = this.controllerA;

        //this.reset_button = new SMSGG_reset_button(variant);
        //this.pause_button = new SMSGG_pause_button(variant);
        /**
         * @type {null|controller_input_config_t}
         */

        this.io = {
            disable: 0,
        }

        switch(variant) {
            case SMSGG_variants.SMS1:
                this.cpu_in = this.cpu_in_sms1.bind(this)
                this.cpu_out = this.cpu_out_sms1.bind(this)
                break;
            case SMSGG_variants.SMS2:
                this.cpu_in = this.cpu_in_sms2.bind(this)
                this.cpu_out = this.cpu_out_sms2.bind(this)
                break;
            default: // GameGear is only emulated one left
                this.cpu_in = this.cpu_in_gg.bind(this);
                this.cpu_out = this.cpu_out_gg.bind(this);
                this.gg_joymap = gg_joymap;
                break;
        }
    }

    /**
     * @param {smspad_inputs} inp1
     * @param {smspad_inputs} inp2
     */
    update_inputs(inp1, inp2) {
        this.controllerA.buffer_input(inp1);
        //this.controllerB.buffer_input(inp2);
    }

    serialize() {
        let o = {version: 1};
        serialization_helper(o, this, SER_SMSGG_bus);
        return o;
    }

    deserialize(from) {
        if (from.version !== 1) {
            console.log('WRONG SMSGG_bus version!');
            return false;
        }
        return deserialization_helper(this, from, SER_SMSGG_bus);
    }

    reset() {
        this.mapper.reset();
    }

    // 0x3E memory control
    write_reg_memory_ctrl(val) {
        if (this.variant !== SMSGG_variants.GG) {
            this.mapper.set_bios(((val & 8) >>> 3) ^ 1); // 1 = disabled, 0 = enabled
            this.mapper.enable_cart = ((val & 0x40) >>> 6) ^ 1;
            //if (!this.mapper.enable_cart) dbg.break();
        }
        this.io.disable = (val & 4) >>> 2;
    }

    write_reg_io_ctrl(val) {
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

    read_reg_ioport1(val) {
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
        let r = (pinsA & 0x3F);
        r |= (pinsB & 3) << 6;
        if (this.portA.TR_direction === 0) {
            r = (r & 0xDF) | (this.portA.TR_level << 5);
        }
        return r;
    }

    read_reg_ioport2(val) {
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
        let r = (pinsB >>> 2) & 0x0F;
        //r |= this.reset_button.value << 4;
        r |= 0x20 | 0x10;
        r |= (pinsA & 0x40);
        r |= (pinsB & 0x40) << 1;
        if (this.portB.TR_direction === 0) r = (r & 0xF7) | (this.portB.TR_level << 3);
        if (this.portA.TH_direction === 0) r = (r & 0xBF) | (this.portA.TH_level << 6);
        if (this.portB.TH_direction === 0) r = (r & 0x7F) | (this.portB.TH_level << 7);
        return r;
    }

    cpu_in_sms2(addr, val, has_effect=true) {
        addr &= 0xFF;
        //console.log('IN', hex2(addr));
        if (addr <= 0x3F) {
            // reads return last byte of the instruction which read the port
            return 0xFF;
        }
        if (addr <= 0x7F) {
            if (addr & 1) return this.vdp.read_hcounter();
            return this.vdp.read_vcounter();
        }
        if (addr <= 0xBF) {
            if (addr & 1) return this.vdp.read_status();
            return this.vdp.read_data();
        }
        // C0-FF, even is /O port A/B reg
        // Odd is I/O port B/misc.
        if (addr & 1) return this.read_reg_ioport2(val);
        return this.read_reg_ioport1(val);

    }

    cpu_out_sms2(addr, val) {
        addr &= 0xFF;
        if (addr <= 0x3F) {
            // even memory control
            // odd I/O control
            if (addr & 1) this.write_reg_io_ctrl(val);
            else this.write_reg_memory_ctrl(val);
            return;
        }
        if  (addr <= 0x7F) {
            // writes go to PSG, not implemented yet
            return;
        }
        if (addr <= 0xBF) {
            // even goes to VDP data
            // odd goes to VDP control
            if (addr & 1) this.vdp.write_control(val);
            else this.vdp.write_data(val);
            return;
        }
        // C0-FF, no effect
    }

    cpu_in_gg(addr, val, has_effect=true) {
        addr &= 0xFF;
        //console.log('IN', hex2(addr));
        switch(addr) {
            case 0: // Various stuff
                // TODO: make this more complete
                return 0x40 | (this.gg_joymap.start ? 0x80 : 0);
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
                let buttons = this.gg_joymap.latch();
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
            if (addr & 1) return this.vdp.read_hcounter();
            return this.vdp.read_vcounter();
        }
        if (addr <= 0xBF) {
            if (addr & 1) return this.vdp.read_status();
            return this.vdp.read_data();
        }
        // C0-FF, even is /O port A/B reg
        // Odd is I/O port B/misc.
        if (addr & 1) return this.read_reg_ioport2(val);
        return this.read_reg_ioport1(val);

    }

    cpu_out_gg(addr, val) {
        addr &= 0xFF;
        if (addr <= 0x3F) {
            // even memory control
            // odd I/O control
            if (addr & 1) this.write_reg_io_ctrl(val);
            else this.write_reg_memory_ctrl(val);
            return;
        }
        if  (addr <= 0x7F) {
            // writes go to PSG, not implemented yet
            return;
        }
        if (addr <= 0xBF) {
            // even goes to VDP data
            // odd goes to VDP control
            if (addr & 1) this.vdp.write_control(val);
            else this.vdp.write_data(val);
            return;
        }
        // C0-FF, no effect
    }

    cpu_in_sms1(addr, val, has_effect=true) {
        addr &= 0xFF;
        if (addr <= 0x3F) {
            // reads return last byte of the instruction which read the port
            return val;
        }
        if (addr <= 0x7F) {
            if (addr & 1) return this.vdp.read_hcounter();
            return this.vdp.read_vcounter();
        }
        if (addr <= 0xBF) {
            if (addr & 1) return this.vdp.read_status();
            return this.vdp.read_data();
        }
        // C0-FF, even is /O port A/B reg
        // Odd is I/O port B/misc.
        if (addr & 1) return this.read_reg_ioport2(val);
        return this.read_reg_ioport1(val);
    }

    cpu_out_sms1(addr, val, has_effect=true) {
        addr &= 0xFF;
        if (addr <= 0x3F) {
            // even memory control
            // odd I/O control
            if (addr & 1) this.write_reg_io_ctrl(val);
            else this.write_reg_memory_ctrl(val);
            return;
        }
        if  (addr <= 0x7F) {
            // writes go to PSG, not implemented yet
            return;
        }
        if (addr <= 0xBF) {
            // even goes to VDP data
            // odd goes to VDP control
            if (addr & 1) this.vdp.write_control(val);
            else this.vdp.write_data(val);
            return;
        }
        // C0-FF, no effect
    }

    cpu_read(addr, val, has_effect=true) {
        return this.mapper.read(addr, val, has_effect);
    }

    cpu_write(addr, val) {
        this.mapper.write(addr, val);
    }

    load_ROM_from_RAM(name, inbuf) {
        this.mapper.load_ROM_from_RAM(name, inbuf);
    }
}
