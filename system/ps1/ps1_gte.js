"use strict";

// Based on RustStation implementation, which modifications for JavaScript


// how to do 16-bit signed fixed-point multiply, in JavaScript.
// simple as other languages actually
// ON LOAD, sign-extend to 32 bits. a = (a << 16) >> 16
// result = (a * b) >> 12
// for over/underflow for saturation,
// < -0x8000
// > 0x7FFF

const GTEe = Object.freeze({
   Rotation: 0,
   Light: 1,
   Color: 2,
   Invalid: 3,

   Translation: 0,
   BackgroundColor: 1,
   FarColor: 2,
   Zero: 3
});


const UNR_TABLE = Object.freeze([
    0xff, 0xfd, 0xfb, 0xf9, 0xf7, 0xf5, 0xf3, 0xf1,
    0xef, 0xee, 0xec, 0xea, 0xe8, 0xe6, 0xe4, 0xe3,
    0xe1, 0xdf, 0xdd, 0xdc, 0xda, 0xd8, 0xd6, 0xd5,
    0xd3, 0xd1, 0xd0, 0xce, 0xcd, 0xcb, 0xc9, 0xc8,
    0xc6, 0xc5, 0xc3, 0xc1, 0xc0, 0xbe, 0xbd, 0xbb,
    0xba, 0xb8, 0xb7, 0xb5, 0xb4, 0xb2, 0xb1, 0xb0,
    0xae, 0xad, 0xab, 0xaa, 0xa9, 0xa7, 0xa6, 0xa4,
    0xa3, 0xa2, 0xa0, 0x9f, 0x9e, 0x9c, 0x9b, 0x9a,
    0x99, 0x97, 0x96, 0x95, 0x94, 0x92, 0x91, 0x90,
    0x8f, 0x8d, 0x8c, 0x8b, 0x8a, 0x89, 0x87, 0x86,
    0x85, 0x84, 0x83, 0x82, 0x81, 0x7f, 0x7e, 0x7d,
    0x7c, 0x7b, 0x7a, 0x79, 0x78, 0x77, 0x75, 0x74,
    0x73, 0x72, 0x71, 0x70, 0x6f, 0x6e, 0x6d, 0x6c,
    0x6b, 0x6a, 0x69, 0x68, 0x67, 0x66, 0x65, 0x64,
    0x63, 0x62, 0x61, 0x60, 0x5f, 0x5e, 0x5d, 0x5d,
    0x5c, 0x5b, 0x5a, 0x59, 0x58, 0x57, 0x56, 0x55,
    0x54, 0x53, 0x53, 0x52, 0x51, 0x50, 0x4f, 0x4e,
    0x4d, 0x4d, 0x4c, 0x4b, 0x4a, 0x49, 0x48, 0x48,
    0x47, 0x46, 0x45, 0x44, 0x43, 0x43, 0x42, 0x41,
    0x40, 0x3f, 0x3f, 0x3e, 0x3d, 0x3c, 0x3c, 0x3b,
    0x3a, 0x39, 0x39, 0x38, 0x37, 0x36, 0x36, 0x35,
    0x34, 0x33, 0x33, 0x32, 0x31, 0x31, 0x30, 0x2f,
    0x2e, 0x2e, 0x2d, 0x2c, 0x2c, 0x2b, 0x2a, 0x2a,
    0x29, 0x28, 0x28, 0x27, 0x26, 0x26, 0x25, 0x24,
    0x24, 0x23, 0x22, 0x22, 0x21, 0x20, 0x20, 0x1f,
    0x1e, 0x1e, 0x1d, 0x1d, 0x1c, 0x1b, 0x1b, 0x1a,
    0x19, 0x19, 0x18, 0x18, 0x17, 0x16, 0x16, 0x15,
    0x15, 0x14, 0x14, 0x13, 0x12, 0x12, 0x11, 0x11,
    0x10, 0x0f, 0x0f, 0x0e, 0x0e, 0x0d, 0x0d, 0x0c,
    0x0c, 0x0b, 0x0a, 0x0a, 0x09, 0x09, 0x08, 0x08,
    0x07, 0x07, 0x06, 0x06, 0x05, 0x05, 0x04, 0x04,
    0x03, 0x03, 0x02, 0x02, 0x01, 0x01, 0x00, 0x00,
    0x00,
]);

function GTEdivide(numerator, divisor) {
    let shift = Math.clz32(divisor) - 16;
    let n = numerator << shift;
    let d = divisor << shift;
    let rec = reciprocal(d);
    let res = (n * rec + 0x8000) >> 16;
    if (res <= 0x1FFFF)
        return res;
    else
        return 0x1FFFF;
}

function reciprocal(d) {
    let index = ((d & 0x7FFF) + 0x40) >>> 7;
    let factor = (UNR_TABLE[index] & 0xFFFFFFFF) + 0x101;
    d = (d | 0x8000) & 0xFFFFFFFF;
    let tmp = ((d * -factor) + 0x80) >>> 8;
    let r = ((factor * (0x20000 + tmp)) + 0x80) >>> 8;

    return r>>>0;
}

function saturate5s(v) {
    if (v < 0) return 0;
    else if (v > 0x1f) return 0x1f;
    return v & 0x1F;
}

class GTECmdCfg {
    constructor() {
        this.shift = 0;
        this.clamp_negative = 0;
        this.amtrix = 0;
        this.vector_mul = 0;
        this.vector_add = 0;
    }

    from_command(cmd) {
        this.shift = ((cmd & (1 << 19)) !== 0) ? 12 : 0;
        this.clamp_negative = +((cmd & (1 << 10)) !== 0)
        this.matrix = ((cmd >>> 17) & 3);
        this.vector_mul = (cmd >>> 15) & 3;
        this.vector_add = ((cmd >>> 13)) & 3;
    }
}

class PS1_GTE {
    /**
     * @param {PS1_clock} clock
     */
    constructor(clock) {
        this.clock = clock;

        this.config = new GTECmdCfg();
        this.op_going = 0;
        this.op_kind = 0; // GTE opcodes here
        this.clock_start = 0; // Clock at time of instruction start
        this.clock_end = 0; // Clock at time of instruction end

        this.ofx = this.ofy = this.h = this.dqa = this.dqb = this.zsf3 = this.zsf4 = 0;
        this.matrices =
            [[[0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0]]]
        this.control_vectors = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
        this.flags = 0;

        this.v =  [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
        this.mac = [0, 0, 0, 0];
        this.otz = 0;
        this.rgb = [0, 0, 0, 0];
        this.ir = [0, 0, 0, 0];
        this.xy_fifo = [[0, 0], [0, 0], [0, 0], [0, 0]];
        this.z_fifo = [0, 0, 0, 0];
        this.rgb_fifo = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        this.lzcs = 0;
        this.lzcr = 32;
        this.reg_23 = 0;
    }

    command(cmd) {
        let opc = cmd & 0x3F;
        this.config.from_command(cmd);
        this.flags = 0;
        switch(opc) {
            case 0x01: this.cmd_RTPS(); break;
            case 0x06: this.cmd_NCLIP(); break;
            case 0x0C: this.cmd_OP(); break;
            case 0x10: this.cmd_DPCS(); break;
            case 0x11: this.cmd_INTPL(); break;
            case 0x12: this.cmd_MVMVA(); break;
            case 0x13: this.cmd_NCDS(); break;
            case 0x16: this.cmd_NCDT(); break;
            case 0x1B: this.cmd_NCCS(); break;
            case 0x1C: this.cmd_CC(); break;
            case 0x1E: this.cmd_NCS(); break;
            case 0x20: this.cmd_NCT(); break;
            case 0x28: this.cmd_SQR(); break;
            case 0x29: this.cmd_DCPL(); break;
            case 0x2A: this.cmd_DPCT(); break;
            case 0x2D: this.CMD_AVSZ3(); break;
            case 0x2E: this.cmd_AVSZ4(); break;
            case 0x30: this.cmd_RTPT(); break;
            case 0x3D: this.cmd_GPF(); break;
            case 0x3E: this.cmd_GPL(); break;
            case 0x3F: this.cmd_NCCT(); break;
            default:
                console.log('Unsupported GTE opcode', hex2(opc));
                break;
        }

        this.flags |= (+((this.flags & 0x7f87e000) !== 0)) << 31;
    }

    write_reg(reg,val) {
        switch(reg) {
            case 0:
                this.v[0][0] = ((val & 0xFFFF) << 16) >> 16;
                this.v[0][1] = (val & 0xFFFF0000) >> 16;
                break;
            case 1: this.v[0][2] = ((val & 0xFFFF) << 16) >> 16; break;
            case 2:
                this.v[1][0] = ((val & 0xFFFF) << 16) >> 16;
                this.v[1][1] = (val & 0xFFFF0000) >> 16;
                break;
            case 3: this.v[1][2] = ((val & 0xFFFF) << 16) >> 16; break;
            case 4:
                this.v[2][0] = ((val & 0xFFFF) << 16) >> 16;
                this.v[2][1] = (val & 0xFFFF0000) >> 16;
                break;
            case 5: this.v[2][2] = ((val & 0xFFFF) << 16) >> 16; break;
            case 6:
                this.rgb[0] = val & 0xFF;
                this.rgb[1] = (val >>> 8) & 0xFF;
                this.rgb[2] = (val >>> 16) & 0xFF;
                break;
            case 7: this.otz = (val & 0xFFFF)>>>0; break;
            case 8: this.ir[0] = (val & 0xFFFF)>>>0; break;
            case 9: this.ir[1] = (val & 0xFFFF)>>>0; break;
            case 10: this.ir[2] = (val & 0xFFFF)>>>0; break;
            case 11: this.ir[3] = (val & 0xFFFF)>>>0; break;
            case 12:
                this.xy_fifo[0][0] = ((val & 0xFFFF) << 16) >> 16;
                this.xy_fifo[0][1] = (val & 0xFFFF0000) >> 16;
                break;
            case 13:
                this.xy_fifo[1][0] = ((val & 0xFFFF) << 16) >> 16;
                this.xy_fifo[1][1] = (val & 0xFFFF0000) >> 16;
                break;
            case 14:
                this.xy_fifo[2][0] = this.xy_fifo[3][0] = ((val & 0xFFFF) << 16) >> 16;
                this.xy_fifo[2][1] = this.xy_fifo[3][1] = (val & 0xFFFF0000) >> 16;
                break;
            case 15:
                this.xy_fifo[3][0] = this.xy_fifo[2][0] = ((val & 0xFFFF) << 16) >> 16;
                this.xy_fifo[3][1] = this.xy_fifo[2][1] = (val & 0xFFFF0000) >> 16;
                this.xy_fifo[0][0] = this.xy_fifo[1][0];
                this.xy_fifo[0][1] = this.xy_fifo[1][1];
                this.xy_fifo[1][0] = this.xy_fifo[2][0];
                this.xy_fifo[1][1] = this.xy_fifo[2][1];
                break;
            case 16: this.z_fifo[0] = (val & 0xFFFF)>>>0; break;
            case 17: this.z_fifo[1] = (val & 0xFFFF)>>>0; break;
            case 18: this.z_fifo[2] = (val & 0xFFFF)>>>0; break;
            case 19: this.z_fifo[3] = (val & 0xFFFF)>>>0; break;
            case 20:
                this.rgb_fifo[0][0] = val & 0xFF;
                this.rgb[0][1] = (val >>> 8) & 0xFF;
                this.rgb[0][2] = (val >>> 16) & 0xFF;
                break;
            case 21:
                this.rgb_fifo[1][0] = val & 0xFF;
                this.rgb[1][1] = (val >>> 8) & 0xFF;
                this.rgb[1][2] = (val >>> 16) & 0xFF;
                break;
            case 22:
                this.rgb_fifo[2][0] = val & 0xFF;
                this.rgb[2][1] = (val >>> 8) & 0xFF;
                this.rgb[2][2] = (val >>> 16) & 0xFF;
                break;
            case 23: this.reg_23 = val; break;
            case 24: this.mac[0] = val & 0xFFFFFFFF; break;
            case 25: this.mac[1] = val & 0xFFFFFFFF; break;
            case 26: this.mac[2] = val & 0xFFFFFFFF; break;
            case 27: this.mac[3] = val & 0xFFFFFFFF; break;
            case 28:
                this.ir[0] = (((val) & 0x1F) << 23) >> 16;
                this.ir[1] = (((val >>> 5) & 0x1F) << 23) >> 16;
                this.ir[2] = (((val >>> 10) & 0x1F) << 23) >> 16;
                break;
            case 29:
                break;
            case 30:
                this.lzcs = val;
                let tmp = ((val >>> 31) & 1) ? (val ^ 0xFFFFFFFF) : val;
                this.lzcr = Math.clz32(tmp);
                break;
            case 31:
                console.log('Write to read-only GTE reg 31');
                break;
            case 32: // 0
                this.matrices[0][0][0] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[0][0][1] = val >> 16;
                break;
            case 33: // 1
                this.matrices[0][0][2] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[0][1][0] = val >> 16;
                break;
            case 34: // 2
                this.matrices[0][1][1] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[0][1][2] = val >> 16;
                break;
            case 35: // 3
                this.matrices[0][2][0] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[0][2][1] = val >> 16;
                break;
            case 36: // 4
                this.matrices[0][2][2] = ((val & 0xFFFF) << 16) >> 16;
                break;
            case 37: // 5-7
            case 38:
            case 39:
                this.v[0][reg - 37] = val & 0xFFFFFFFF;
                break;
            case 40: // 8
                this.matrices[1][0][0] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[1][0][1] = val >> 16;
                break;
            case 41: // 9
                this.matrices[1][0][2] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[1][1][0] = val >> 16;
                break;
            case 42: // 10
                this.matrices[1][1][1] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[1][1][2] = val >> 16;
                break;
            case 43: // 11
                this.matrices[1][2][0] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[1][2][1] = val >> 16;
                break;
            case 44: // 12
                this.matrices[1][2][2] = ((val & 0xFFFF) << 16) >> 16;
                break;
            case 45: // 13-15
            case 46:
            case 47:
                this.v[1][reg - 45] = val & 0xFFFFFFFF;
                break;
            case 48: // 16
                this.matrices[2][0][0] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[2][0][1] = val >> 16;
                break;
            case 49: // 17
                this.matrices[2][0][2] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[2][1][0] = val >> 16;
                break;
            case 50: // 18
                this.matrices[2][1][1] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[2][1][2] = val >> 16;
                break;
            case 51: // 19
                this.matrices[2][2][0] = ((val & 0xFFFF) << 16) >> 16;
                this.matrices[2][2][1] = val >> 16;
                break;
            case 52: // 20
                this.matrices[2][2][2] = ((val & 0xFFFF) << 16) >> 16;
                break;
            case 53: // 21-23
            case 54:
            case 55:
                this.v[2][reg - 53] = val & 0xFFFFFFFF;
                break;
            case 56: // 24
                this.ofx = val & 0xFFFFFFFF;
                break;
            case 57: // 25
                this.ofy = val & 0xFFFFFFFF;
                break;
            case 58: // 26
                this.h = (val & 0xFFFF)>>>0;
                break;
            case 59: // 27
                this.dqa = ((val & 0xFFFF) << 16) >> 16;
                break;
            case 60: // 28
                this.dqb = val & 0xFFFFFFFF;
                break;
            case 61: // 29
                this.zsf3 = ((val & 0xFFFF) << 16) >> 16;
                break;
            case 62: // 30
                this.zsf4 = ((val & 0xFFFF) << 16) >> 16;
                break;
            case 63: // 31
                this.flags = val & 0x7FFFF00;
                this.flags |= (+((this.flags & 0x7f87e000) !== 0)) << 31;
                break;
        }
    }

    read_reg(reg) {
        switch(reg) {
            case 0: return this.v[0][0] | (this.v[0][1] << 16);
            case 1: return this.v[0][2];
            case 2: return this.v[1][0] | (this.v[1][1] << 16);
            case 3: return this.v[1][2];
            case 4: return this.v[2][0] | (this.v[2][1] << 16);
            case 5: return this.v[2][2];
            case 6: return this.rgb[0] | (this.rgb[1] << 8) | (this.rgb[2] << 16) | (this.rgb[3] << 24);
            case 7: return this.otz;
            case 8: return this.ir[0];
            case 9: return this.ir[1];
            case 10: return this.ir[2];
            case 11: return this.ir[3];
            case 12: return this.xy_fifo[0][0] | (this.xy_fifo[0][1] << 16);
            case 13: return this.xy_fifo[1][0] | (this.xy_fifo[1][1] << 16);
            case 14: return this.xy_fifo[2][0] | (this.xy_fifo[2][1] << 16);
            case 15: return this.xy_fifo[2][0] | (this.xy_fifo[3][1] << 16);
            case 16: return this.z_fifo[0];
            case 17: return this.z_fifo[1];
            case 18: return this.z_fifo[2];
            case 19: return this.z_fifo[3];
            case 20: return this.rgb_fifo[0][0] | (this.rgb_fifo[0][1] << 16);
            case 21: return this.rgb_fifo[1][0] | (this.rgb_fifo[1][1] << 16);
            case 22: return this.rgb_fifo[2][0] | (this.rgb_fifo[2][1] << 16);
            case 23: return this.reg_23;
            case 24: return this.mac[0];
            case 25: return this.mac[1];
            case 26: return this.mac[2];
            case 27: return this.mac[3];
            case 28:
            case 29:
                return saturate5s(this.ir[1] >>> 7) | (saturate5s(this.ir[2] >>> 7) << 5) | (saturate5s(this.ir[3] >>> 7) << 10);
            case 30: return this.lzcs;
            case 31: return this.lzcr;
            case 32: return this.matrices[0][0][0] | (this.matrices[0][0][1] << 16);
            case 33: return this.matrices[0][0][2] | (this.matrices[0][1][0] << 16);
            case 34: return this.matrices[0][1][1] | (this.matrices[0][1][2] << 16);
            case 35: return this.matrices[0][2][0] | (this.matrices[0][2][1] << 16);
            case 36: return this.matrices[0][2][2];
            case 37:
            case 38:
            case 39:
                return this.control_vectors[0][reg - 37];
            case 40: return this.matrices[1][0][0] | (this.matrices[1][0][1] << 16);
            case 41: return this.matrices[1][0][2] | (this.matrices[1][1][0] << 16);
            case 42: return this.matrices[1][1][1] | (this.matrices[1][1][2] << 16);
            case 43: return this.matrices[1][2][0] | (this.matrices[1][2][1] << 16);
            case 44: return this.matrices[1][2][2];
            case 45:
            case 46:
            case 47:
                return this.control_vectors[1][reg - 45];
            case 48: return this.matrices[2][0][0] | (this.matrices[2][0][1] << 16);
            case 49: return this.matrices[2][0][2] | (this.matrices[2][1][0] << 16);
            case 50: return this.matrices[2][1][1] | (this.matrices[2][1][2] << 16);
            case 51: return this.matrices[2][2][0] | (this.matrices[2][2][1] << 16);
            case 52: return this.matrices[2][2][2];
            case 53:
            case 54:
            case 55:
                return this.control_vectors[2][reg - 53];
            case 56: return this.ofx;
            case 57: return this.ofy;
            case 58: return (this.h << 16) >> 16; // H reads back as signed even though unsigned
            case 59: return this.dqa;
            case 60: return this.dqb;
            case 61: return this.zsf3;
            case 62: return this.zsf4;
            case 63: return this.flags;
        }
    }

    do_RTP(vector_index) {
        let z_shifted = 0;

        let rm = GTEe.Rotation;
        let tr = GTEe.Translation;

        for (let r = 0; r < 3; r++) {
            let res = (this.control_vectors[tr][r] & 0xFFFFFFFF)  << 12;
            for (let c = 0; c < 3; c++) {
                let v = this.v[vector_index][c] & 0xFFFFFFFF;
                let m = this.matrices[rm][r][c] & 0xFFFFFFFF;
                let rot = v * m;

                res = this.i64_to_i44(c, res + rot);
            }
            this.mac[r+1] = (res >> this.config.shift) & 0xFFFFFFFF;
            z_shifted = (res >> 12) & 0xFFFFFFFF;
        }

        this.ir[1] = this.i32_to_i16_saturate(0, this.mac[1]);
        this.ir[2] = this.i32_to_i16_saturate(0, this.mac[2]);
        // Weird behavior on Z clip

        let min = -32768;
        let max = 32767;
        if ((z_shifted > max) || (z_shifted < min)) this.set_flag(22);

        min = this.config.clamp_negative ? 0 : -32768;
        let val = this.mac[3];
        if (val < min) this.ir[3] = min;
        else if (val > max) this.ir[3] = max;
        else this.ir[3] = ((val & 0xFFFF) << 16) >> 16;

        let z_saturated;
        if (z_shifted < 0) {
            this.set_flag(18);
            z_saturated = 0;
        }
        else if (z_shifted > 32768) {
            this.set_flag(18);
            z_saturated = 32768;
        } else {
            z_saturated = z_shifted;
        }

        this.z_fifo[0] = this.z_fifo[1];
        this.z_fifo[1] = this.z_fifo[2];
        this.z_fifo[2] = this.z_fifo[3];
        this.z_fifo[3] = z_saturated;

        let projection_factor;
        if (z_saturated > (this.h / 2)) {
            projection_factor = GTEdivide(this.h, z_saturated);
        }
        else {
            this.set_flag(17);
            projection_factor = 0x1FFFF;
        }

        let factor = projection_factor & 0xFFFFFFFF;
        let x = this.ir[1] & 0xFFFFFFFF;
        let y = this.ir[2] & 0xFFFFFFFF;
        let ofx = this.ofx & 0xFFFFFFFF;
        let ofy = this.ofy & 0xFFFFFFFF;

        let screen_x = x * factor * ofx;
        let screen_y = y * factor * ofy;

        this.check_mac_overflow(screen_x);
        this.check_mac_overflow(screen_y);

        screen_x = (screen_x >> 16) & 0xFFFFFFFF;
        screen_y = (screen_y >> 16) & 0xFFFFFFFF;

        this.xy_fifo[3][0] = this.i32_to_i11_saturate(0, screen_x);
        this.xy_fifo[3][1] = this.i32_to_i11_saturate(1, screen_y);
        
        this.xy_fifo[0][0] = this.xy_fifo[1][0];
        this.xy_fifo[0][1] = this.xy_fifo[1][1];
        this.xy_fifo[1][0] = this.xy_fifo[2][0];
        this.xy_fifo[1][1] = this.xy_fifo[2][1];
        this.xy_fifo[2][0] = this.xy_fifo[3][0];
        this.xy_fifo[2][1] = this.xy_fifo[3][1];
        
        return projection_factor;
    }
    
    check_mac_overflow(val) {
        if (val < -0x80000000) {
            this.set_flag(15);
        } else if (val > 0x7fffffff) {
            this.set_flag(16);
        }
    }


    i32_to_i11_saturate(flag, val) {
        if (val < -0x400) {
            this.set_flag(14 - flag);
            return -0x400;
        }
        else if (val > 0x3FF) {
            this.set_flag(14 - flag);
            return 0x3FF;
        }
        return val;
    }
    i32_to_i16_saturate(flag, val, force_neg=false) {
        let min = this.config.clamp_negative ? 0 : -32768;
        min = force_neg ? -32768 : min;
        let max = 32767;

        if (val > max) {
            this.set_flag(24 - flag);
            return max;
        }
        else if (val < min) {
            this.set_flag(24 - flag);
            return min;
        } else {
            return ((val & 0xFFFF) << 16) >> 16;
        }
    }

    i64_to_i44(flag, val) {
        if (val > 0x7FFFFFFFFFF) {
            this.set_flag(30 - flag);
        }
        else if (val < -0x80000000000) {
            this.set_flag(27 - flag);
        }

        return val >> 20;
    }

    set_flag(bit) { this.flags |= (1 << bit); }

    cmd_RTPS() {
        let pf = this.do_RTP(0);
        this.depth_queueing(pf);
    }

    depth_queueing(pf) {
        let factor = pf & 0xFFFFFFFF;
        let dqa = this.dqa & 0xFFFFFFFF;
        let dqb = this.dqb & 0xFFFFFFFF;

        let depth = dqb + dqa * factor;

        this.check_mac_overflow(depth);

        this.mac[0] = depth & 0xFFFFFFFF;

        depth >>= 12;

        if (depth < 0) {
            this.set_flag(12);
            this.ir[0] = 0;
        }
        else if (depth > 4096) {
            this.set_flag(12);
            this.ir[0] = 4096;
        }
        else
            this.ir[0] = (depth >> 16) & 0xFFFFFFFF;
    }

    cmd_NCLIP() {
        let x0 = this.xy_fifo[0][0] & 0xFFFFFFFF;
        let y0 = this.xy_fifo[0][1] & 0xFFFFFFFF;

        let x1 = this.xy_fifo[1][0] & 0xFFFFFFFF;
        let y1 = this.xy_fifo[1][1] & 0xFFFFFFFF;

        let x2 = this.xy_fifo[2][0] & 0xFFFFFFFF;
        let y2 = this.xy_fifo[2][1] & 0xFFFFFFFF;

        let a = x0 * (y1 - y2);
        let b = x1 * (y2 - y0);
        let c = x2 * (y0 - y1);

        let sum = a + b + c;

        this.check_mac_overflow(sum);

        this.mac[0] = sum & 0xFFFFFFFF;
    }

    cmd_OP() {
        let rm = GTEe.Rotation;

        let ir1 = this.ir[1] & 0xFFFFFFFF;
        let ir2 = this.ir[2] & 0xFFFFFFFF;
        let ir3 = this.ir[3] & 0xFFFFFFFF;

        let r0 = this.matrices[rm][0][0] & 0xFFFFFFFF;
        let r1 = this.matrices[rm][1][1] & 0xFFFFFFFF;
        let r2 = this.matrices[rm][2][2] & 0xFFFFFFFF;

        let shift = this.config.shift;

        this.mac[1] = (r1 * ir3 - r2 * ir2) >> shift;
        this.mac[2] = (r2 * ir1 - r0 * ir3) >> shift;
        this.mac[3] = (r0 * ir2 - r1 * ir1) >> shift;

        this.mac_to_ir();
    }

    mac_to_ir() {
        this.ir[1] = this.i32_to_i16_saturate(0, self.mac[1])
        this.ir[2] = this.i32_to_i16_saturate(1, self.mac[2])
        this.ir[3] = this.i32_to_i16_saturate(2, self.mac[3])
    }

    cmd_DPCS() {
        let fc = GTEe.FarColor;
        let r = this.rgb[0];
        let g = this.rgb[1];
        let b = this.rgb[2];

        let col = [r, g, b];
        for (let i = 0; i < 3; i++) {
            let fc = (this.control_vectors[fc][i] & 0xFFFFFFFF) << 12;
            let col = (col[i] & 0xFFFFFFFF) << 16;

            let sub = fc - col;

            let tmp = (this.i64_to_i44(i, sub) >> this.config.shift) & 0xFFFFFFFF;

            let ir0 = this.ir[0] & 0xFFFFFFFF;

            let sat = this.i32_to_i16_saturate(i, tmp, true) & 0xFFFFFFFF;

            let res = this.i64_to_i44(i, col + ir0 * sat);

            this.mac[i + 1] = (res >> this.config.shift) & 0xFFFFFFFF;
        }

        this.mac_to_ir();
        this.mac_to_rgb_fifo();
    }

    mac_to_rgb_fifo() {
        let gte = this;
        let mac_to_color = function(mac, which) {
            let c = mac >> 4;
            if (c < 0) {
                gte.set_flag(21 - which);
                return 0;
            }
            else if (c > 0xFF) {
                gte.set_flag(21 - which);
                return 0xFF;
            }
            return c & 0xFF;
        }

        let mac1 = this.mac[1];
        let mac2 = this.mac[2];
        let mac3 = this.mac[3];

        let r = mac_to_color(this, mac1, 0);
        let g = mac_to_color(this, mac2, 1);
        let b = mac_to_color(this, mac3, 2);
        this.rgb_fifo[0][0] = this.rgb_fifo[1][0]
        this.rgb_fifo[0][1] = this.rgb_fifo[1][1]
        this.rgb_fifo[0][2] = this.rgb_fifo[1][2]
        this.rgb_fifo[0][3] = this.rgb_fifo[1][3]

        this.rgb_fifo[1][0] = this.rgb_fifo[2][0]
        this.rgb_fifo[1][1] = this.rgb_fifo[2][1]
        this.rgb_fifo[1][2] = this.rgb_fifo[2][2]
        this.rgb_fifo[1][3] = this.rgb_fifo[2][3]

        this.rgb_fifo[0][0] = r;
        this.rgb_fifo[0][1] = g;
        this.rgb_fifo[0][2] = b;
        this.rgb_fifo[0][2] = this.rgb[3];
    }

    cmd_INTPL() {
        let fca = GTEe.FarColor;

        for (let i = 0; i < 3; i++) {
            let fc = (this.control_vectors[fca][i] & 0xFFFFFFFF) << 12;
            let ir = (this.ir[i + 1] & 0xFFFFFFFF) << 12;

            let sub = fc - ir;
            let tmp = (this.i64_to_i44(i, sub) >> this.config.shift) & 0xFFFFFFFF;
            let ir0 = this.ir[0] & 0xFFFFFFFF;
            let sat = this.i32_to_i16_saturate(i, tmp, true)
            let res = this.i64_to_i44(i, ir + ir0 * sat);
            this.mac[i + 1] = (res >> this.config.shift) & 0xFFFFFFFF;
        }
        this.mac_to_ir();
        this.mac_to_rgb_fifo();
    }

    cmd_MVMVA() {
        this.v[3][0] = this.ir[1];
        this.v[3][1] = this.ir[2];
        this.v[3][2] = this.ir[3];

        this.multiply_matrix_by_vector(this.config, this.config.matrix, this.config.vector_mul, this.config.vector_add);
    }

    cmd_NCDS() {
        this.do_ncd(0);
    }

    cmd_NCDT() {
        this.do_ncd(0);
        this.do_ncd(1);
        this.do_ncd(2);
    }

    cmd_NCCS() {
        this.do_ncc(0);
    }

    do_ncc(vector_index) {

    }

    do_ncd(vector_index) {
        this.multiply_matrix_by_vector(this.config, GTEe.Light, vector_index, GTEe.Zero);

        this.v[3][0] = this.ir[1];
        this.v[3][1] = this.ir[2];
        this.v[3][2] = this.ir[3];

        this.multiply_matrix_by_vector(this.config, GTEe.Color, 3, GTEe.BackgroundColor);

        this.cmd_DCPL();
    }

    cmd_DCPL() {
        let fca = GTEe.FarColor;

        let r = this.rgb[0];
        let g = this.rgb[1];
        let b = this.rgb[2];

        let col = [r, g, b];
        for (let i = 0; i < 3; i++) {
            let fc = (this.control_vectors[fca][i] & 0xFFFFFFFF) << 12;
            let ir = this.ir[i + 1] & 0xFFFFFFFF;
            let col = (col[i] & 0xFFFFFFFF) << 4;

            let shading = (col * ir) & 0xFFFFFFFF;

            let tmp = fc - shading;

            tmp = (this.i64_to_i44(i, tmp) >> this.config.shift) & 0xFFFFFFFF;
            let ir0 = this.ir[0] & 0xFFFFFFFF;
            let res = this.i32_to_i16_saturate(i, tmp, true);

            res = this.i64_to_i44(i, shading + ir0 * res);

            this.mac[i+1] = (res >> this.config.shift) & 0xFFFFFFFF;
        }
        this.mac_to_ir();
        this.mac_to_rgb_fifo();
    }

    multiply_matrix_by_vector(config, mat, vector_index, crv) {
        if (mat === GTEe.Invalid) {
            console.log('GTE mul with invalid matrix')
        }

        if (crv === GTEe.FarColor) {
            console.log('GTE multiply with far color. special...');
        }

        for (let r = 0; r < 3; r++) {
            let res = (this.control_vectors[crv][r] & 0xFFFFFFFF) << 12;

            for (let c = 0; c < 3; c++) {
                let v = this.v[vector_index][c] & 0xFFFFFFFF;
                let m = this.matrices[mat][r][c] & 0xFFFFFFFF;

                let product = v * m;

                res = this.i64_to_i44(r, res + product);
            }

            this.mac[r + 1] = (res >> this.config.shift) & 0xFFFFFFFF;
        }

        this.mac_to_ir();
    }
}
