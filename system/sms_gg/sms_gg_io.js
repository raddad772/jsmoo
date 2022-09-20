"use strict";

class SMSGG_gamepad {
    constructor(variant) {
        this.variant = variant;
        this.pins = {
            tr: 1, // button 2
            th: 1,
            tl: 1, // button 1
            up: 1,
            down: 1,
            left: 1,
            right: 1
        }

        this.io = {
            tr_direction: 0,
            tr_out_level: 0,
            th_direction: 0,
            th_out_level: 0
        }
    }

    set_pins(tr_direction, tr_out_level, th_direction, th_out_level) {
        // US, european, etc. will return the same data written
        // Japanese will return different data
        this.pins.tr = tr_out_level;
        this.pins.th = th_out_level;
    }

    latch() {
        // Set our pins based on current input. 1 is high
        this.pins.up = 1;
        this.pins.down = 1;
        this.pins.left = 1;
        this.pins.right = 1;
        this.pins.tl = 1;
        this.pins.tr = 1;
    }
}

class SMSGG_controller_port {
    constructor(variant, which) {
        this.variant = variant;
        this.which = which;

        this.TR_input = 0;
        this.TH_input = 0;

        this.TR_output = 0;
        this.TH_output = 0;

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

    set_pins(tr_direction, tr_out_level, th_direction, th_out_level) {
        if (this.attached_device === null) return;
        this.attached_device.set_pins(tr_direction, tr_out_level, th_direction, th_out_level);
    }

    latch() {
        if (this.attached_device === null) return;
        this.attached_device.latch();
    }

    read_pins() {
        if (this.attached_device === null) return this.empty_pins;
        else return this.attached_device.pins;
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
    constructor(variant) {
        this.variant = variant;
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
        this.mapper.set_bios(!(val & 8)); // 1 = disabled, 0 = enabled
        this.mapper.enable_cart = +(!(val & 0x20));
        this.io.disable = (val & 4) >>> 2;
    }

    write_reg_io_ctrl(val) {
        this.portA.set_pins(val & 1, (val & 0x10) >>> 4, (val & 2) >>> 1, (val & 0x20) >>> 5);
        this.portB.set_pins((val & 4) >>> 2, (val & 0x40) >>> 6, (val & 8) >>> 3, (val & 0x80) >>> 7)
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
                this.portA.latch();
        this.portB.latch();
        let pinsA = this.portA.read_pins();
        let pinsB = this.portB.read_pins();
        let r = (pinsA.up) | (pinsA.down << 1) | (pinsA.left << 2) | (pinsA.right << 3) | (pinsA.tl << 4) | (pinsA.tr << 5) | 0x20 | (pinsB.up << 6) | (pinsB.down << 7);
        console.log('RETURNING', hex2(r))
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
        this.portA.latch();
        this.portB.latch();
        let pinsA = this.portA.read_pins();
        let pinsB = this.portB.read_pins();
        this.reset_button.latch();
        return (pinsB.left) | (pinsB.right << 1) | (pinsB.tl << 2) | (pinsB.tr << 3) | (this.reset_button.read() << 4) | (pinsA.th << 6) | (pinsB.th << 7);
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
