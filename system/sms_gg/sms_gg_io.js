"use strict";

class SMSGG_controller_port {
    constructor(variant, which) {
        this.variant = variant;
        this.which = which;

        this.TR_level = 1;
        this.TH_level = 1;
        this.TR_direction = 1;
        this.TH_direction = 1;
        this.empty_pins = {
            tr: 1, // button 2
            th: 1,
            tl: 1, // button 1
            up: 1,
            down: 1,
            left: 1,
            right: 1
        }

        /**
         * @type {SMSGG_gamepad | null}
         */
        this.attached_device = null;

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

class SMSGG_reset_button {
    constructor(variant) {
        this.value = 1;
        this.variant = variant;
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

class SMSGG_pause_button {
    constructor(variant) {
        this.value = 0;
    }

    poll() {
        // Read input and return here
        return this.value;
    }
}

class SMSGG_bus {
    constructor(variant, region) {
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

        this.portA = new SMSGG_controller_port('A');
        this.portB = new SMSGG_controller_port('B');
        this.reset_button = new SMSGG_reset_button(variant);
        this.pause_button = new SMSGG_pause_button(variant);

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
                break;
        }

    }

    reset() {
        this.mapper.reset();
    }

    // 0x3E memory control
    write_reg_memory_ctrl(val) {
        this.mapper.set_bios(((val & 8) >>> 3) ^ 1); // 1 = disabled, 0 = enabled
        this.mapper.enable_cart = ((val & 0x40) >>> 6) ^ 1;
        console.log('SET BIOS, CART ENABLE TO', this.mapper.enable_bios, this.mapper.enable_cart);
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
        r = (pinsB & 3) << 6;
        if (this.portA.TR_direction === 0) {
            r = (r & 0xDF) | (this.portA.TR_level << 5);
        }
        //console.log('RETURNING', hex2(r))
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
        this.reset_button.latch();
        let r = (pinsB >>> 2) & 0x0F;
        r |= this.reset_button.value << 4;
        r |= 0x20;
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
        if ((addr < 7) && (this.vdp.mode === SMSGG_vdp_modes.GG)) {
            // GameGear mode registers, start out at C0 7F FF 00 FF 00 FF
        }
        else if (addr <= 0x3F)
            return 0xFF;
        if (addr <= 0x7F) {
            if (addr & 1) return this.vdp.read_hcounter();
            return this.vdp.read_vcounter();
        }
        if (addr <= 0xBF) {
            if (addr & 1) return this.vdp.read_status();
            return this.vdp.read_data();
        }
        if ((addr === 0xC0) || (addr === 0xDC)) return this.read_reg_ioport1(val);
        if ((addr === 0xC1) || (addr === 0xDD)) return this.read_reg_ioport2(val);
        // $C0 and $DC are the IO A/B
        // $C1 and DD are te IO B/misc.
        // all else is 0xFF
        return 0xFF;
    }

    cpu_out_gg(addr, val) {
        addr &= 0xFF;
        if ((addr < 7) && (this.vdp.mode === SMSGG_vdp_modes.GG)) {
            // GameGear mode registers, start out at C0 7F FF 00 FF 00 FF
        }
        else if (addr <= 0x3F) {
            if (addr & 1) this.write_reg_io_ctrl(val);
            else this.write_reg_memory_ctrl(val);
            return;
        }
        if (addr <= 0x7F) {
            // writes to PSG, not implemented yet
            return
        }
        if (addr <= 0xBF) {
            if (addr & 1) this.vdp.write_control(val);
            else this.vdp.write_data(val);
            return;
        }
        return;

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

    load_ROM_from_RAM(inbuf) {
        this.mapper.load_ROM_from_RAM(inbuf);
    }
}
