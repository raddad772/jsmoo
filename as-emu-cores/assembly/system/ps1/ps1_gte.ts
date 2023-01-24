// Based on RustStation implementation, because I didn't want to do it


// how to do 16-bit signed fixed-point multiply, in JavaScript.
// simple as other languages actually
// ON LOAD, sign-extend to 32 bits. a = (a << 16) >> 16
// result = (a * b) >> 12
// for over/underflow for saturation,
// < -0x8000
// > 0x7FFF


import {hex2, hex4, hex8} from "../../helpers/helpers";
import {PS1_clock} from "./ps1_misc";

const UNR_TABLE: StaticArray<u8> = [
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
    0x00
];

//@ts-ignore
@inline
function GTEdivide(numerator: u16, divisor: u16): u32 {
    let shift = clz<u32>(<u32>divisor) - 16;
    let n: u64 = <u64>numerator << shift;
    let d: u64 = <u64>divisor << shift;
    let rec: u64 = <u64>reciprocal(<u16>d);
    let res = (n * rec + 0x8000) >> 16;
    if (res <= 0x1FFFF)
        return <u32>res;
    else
        return 0x1FFFF;
}

//@ts-ignore
@inline
function reciprocal(d: u16): u32 {
    let index = ((d & 0x7FFF) + 0x40) >>>7;
    let factor = <i32>UNR_TABLE[index] + 0x101;
    let di: i32 = <i32>(d | 0x8000);
    let tmp = ((di * -factor) + 0x80) >> 8;

    return <u32>(((factor * (0x20000 + tmp)) + 0x80) >> 8);
}

//@ts-ignore
@inline
function saturate5s(v: i16): u32 {
    if (v < 0) return 0;
    else if (v > 0x1f) return 0x1f;
    return <u32>v & 0x1F;
}

enum Matrix {
    Rotation = 0,
    Light = 1,
    Color = 2,
    Invalid = 3,
}

enum ControlVector {
   Translation = 0,
   BackgroundColor = 1,
   FarColor = 2,
   Zero = 3
}

class GTECmdCfg {
    shift: u8 = 0
    clamp_negative: u32 = 0
    matrix: Matrix = Matrix.Rotation
    vector_mul: u8 = 0
    vector_add: ControlVector = ControlVector.Translation

    from_command(cmd: u32): void {
        this.shift = ((cmd & (1 << 19)) !== 0) ? 12 : 0;
        this.clamp_negative = +((cmd & (1 << 10)) !== 0)
        this.matrix = ((cmd >>> 17) & 3);
        this.vector_mul = <u8>((cmd >>> 15) & 3);
        this.vector_add = ((cmd >>> 13)) & 3;
    }
}

//@ts-ignore
@inline
function mtx(x: u32, y: u32, z: u32): u32 {
    return (x*9) + (y*3) + z;
}

export class PS1_GTE {
    clock: PS1_clock
    config: GTECmdCfg = new GTECmdCfg();
    config0: GTECmdCfg = new GTECmdCfg();
    op_going: u32 = 0;
    op_kind: u32 = 0; // GTE opcodes here
    clock_start: u64 = 0; // Clock at time of instruction start
    clock_end: u64 = 0; // Clock at time of instruction end
    ofx: i32 = 0
    ofy: i32 = 0
    h: u16 = 0
    dqa: i16 = 0
    dqb: i32 = 0
    zsf3: i16 = 0
    zsf4: i16 = 0

    flags: u32 = 0
    mac: StaticArray<i32> = new StaticArray<i32>(4);
    otz: u16 = 0
    rgb: StaticArray<u8> = new StaticArray<u8>(4);
    ir: StaticArray<i16> = new StaticArray<i16>(4);
    z_fifo: StaticArray<u16> = new StaticArray<u16>(4);
    lzcs: u32 = 0
    lzcr: u8 = 0
    reg_23: u32 = 0

    // 3x3x3, i16
    matrices: StaticArray<StaticArray<StaticArray<i16>>> = new StaticArray<StaticArray<StaticArray<i16>>>(3);
    control_vectors: StaticArray<StaticArray<i32>> = new StaticArray<StaticArray<i32>>(4);
    v: StaticArray<StaticArray<i16>> = new StaticArray<StaticArray<i16>>(4);

    // 4x2
    xy_fifo: StaticArray<StaticArray<i16>> = new StaticArray<StaticArray<i16>>(4);

    // 3x4
    rgb_fifo: StaticArray<StaticArray<u8>> = new StaticArray<StaticArray<u8>>(3);

    cycle_count: i64 = 0;

    constructor(clock: PS1_clock) {
        this.clock = clock;
        for (let r: u32 = 0; r < 3; r++) {
            this.matrices[r] = new StaticArray<StaticArray<i16>>(3);
            for (let j: u32 = 0; j < 3; j++) {
                this.matrices[r][j] = new StaticArray<i16>(3);
                for (let c: u32 = 0; c < 3; c++) {
                    this.matrices[r][j][c] = 0;
                }
            }
        }

        for (let r: u32 = 0; r < 4; r++) {
            this.control_vectors[r] = new StaticArray<i32>(3);
            this.v[r] = new StaticArray<i16>(3);
            this.xy_fifo[r] = new StaticArray<i16>(2);
            for (let j: u32 = 0; j < 3; j++) {
                this.control_vectors[r][j] = 0;
                this.v[r][j] = 0;
            }
        }

        for (let r: u32 = 0; r < 3; r++) {
            this.rgb_fifo[r] = new StaticArray<u8>(4);
            for (let j: u32 = 0; j < 4; j++) {
                this.rgb_fifo[r][j] = 0;
            }
        }
        this.config0.from_command(0);
    }

    command(cmd: u32): void {
        let opc: u32 = cmd & 0x3F;
        this.config.from_command(cmd);
        this.flags = 0;
        switch(opc) {
            case 0x01: this.cmd_RTPS(this.config); this.cycle_count = 14; break;
            case 0x06: this.cmd_NCLIP(); this.cycle_count = 7; break;
            case 0x0C: this.cmd_OP(this.config); this.cycle_count = 5; break;
            case 0x10: this.cmd_DPCS(this.config); this.cycle_count = 7; break;
            case 0x11: this.cmd_INTPL(this.config); this.cycle_count = 7; break;
            case 0x12: this.cmd_MVMVA(this.config); this.cycle_count = 7; break;
            case 0x13: this.cmd_NCDS(this.config); this.cycle_count = 18; break;
            case 0x16: this.cmd_NCDT(this.config); this.cycle_count = 43; break;
            case 0x1B: this.cmd_NCCS(this.config); this.cycle_count = 16; break;
            case 0x1C: this.cmd_CC(this.config); this.cycle_count = 10; break;
            case 0x1E: this.cmd_NCS(this.config); this.cycle_count = 13; break;
            case 0x20: this.cmd_NCT(this.config); this.cycle_count = 29; break;
            case 0x28: this.cmd_SQR(this.config); this.cycle_count = 4; break;
            case 0x29: this.cmd_DCPL(this.config); this.cycle_count = 7; break;
            case 0x2A: this.cmd_DPCT(this.config); this.cycle_count = 16; break;
            case 0x2D: this.cmd_AVSZ3(); this.cycle_count = 4; break;
            case 0x2E: this.cmd_AVSZ4(); this.cycle_count = 4; break;
            case 0x30: this.cmd_RTPT(this.config); this.cycle_count = 22; break;
            case 0x3D: this.cmd_GPF(this.config); this.cycle_count = 4; break;
            case 0x3E: this.cmd_GPL(this.config); this.cycle_count = 4; break;
            case 0x3F: this.cmd_NCCT(this.config); this.cycle_count = 38; break;
            default:
                console.log('Unsupported GTE opcode ' + hex2(opc));
                break;
        }

        this.flags |= (((this.flags & 0x7f87e000) !== 0) ? 1 : 0) << 31;
    }

    write_reg(reg: u32, val: u32): void {
        switch(reg) {
            case 0:
                this.v[0][0] = <i16>val;
                this.v[0][1] = <i16>(val >>> 16);
                break;
            case 1:
                this.v[0][2] = <i16>val;
                break;
            case 2:
                this.v[1][0] = <i16>val;
                this.v[1][1] = <i16>(val >>> 16);
                break;
            case 3:
                this.v[1][2] = <i16>val;
                break;
            case 4:
                this.v[2][0] = <i16>val;
                this.v[2][1] = <i16>(val >>> 16);
                break;
            case 5:
                this.v[2][2] = <i16>val;
                break;
            case 6:
                this.rgb[0] = <u8>val;
                this.rgb[1] = <u8>(val >> 8)
                this.rgb[2] = <u8>(val >> 16)
                this.rgb[3] = <u8>(val >> 24)
                break;
            case 7: this.otz = <u16>val; break;
            case 8: this.ir[0] = <i16>val; break;
            case 9: this.ir[1] = <i16>val; break;
            case 10: this.ir[2] = <i16>val; break;
            case 11: this.ir[3] = <i16>val; break;
            case 12:
                this.xy_fifo[0][0] = <i16>val;
                this.xy_fifo[0][1] = <i16>(val >> 16);
                break;
            case 13:
                this.xy_fifo[1][0] = <i16>val;
                this.xy_fifo[1][1] = <i16>(val >> 16);
                break;
            case 14:
                this.xy_fifo[2][0] = <i16>val;
                this.xy_fifo[2][1] = <i16>(val >> 16);
                break;
            case 15:
                //this.xy_fifo[3][0] ;
                //this.xy_fifo[3][1];
                this.xy_fifo[0][0] = this.xy_fifo[1][0];
                this.xy_fifo[0][1] = this.xy_fifo[1][1];
                this.xy_fifo[1][0] = this.xy_fifo[2][0];
                this.xy_fifo[1][1] = this.xy_fifo[2][1];
                this.xy_fifo[2][0] = this.xy_fifo[3][0] = <i16>val;
                this.xy_fifo[2][1] = this.xy_fifo[3][1] = <i16>(val >> 16);
                break;
            case 16: this.z_fifo[0] = <u16>val; break;
            case 17: this.z_fifo[1] = <u16>val; break;
            case 18: this.z_fifo[2] = <u16>val; break;
            case 19: this.z_fifo[3] = <u16>val; break;
            case 20:
                this.rgb_fifo[0][0] = <u8>val;
                this.rgb_fifo[0][1] = <u8>(val >> 8)
                this.rgb_fifo[0][2] = <u8>(val >> 16)
                this.rgb_fifo[0][3] = <u8>(val >> 24)
                break;
            case 21:
                this.rgb_fifo[1][0] = <u8>val;
                this.rgb_fifo[1][1] = <u8>(val >> 8)
                this.rgb_fifo[1][2] = <u8>(val >> 16)
                this.rgb_fifo[1][3] = <u8>(val >> 24)
                break;
            case 22:
                this.rgb_fifo[2][0] = <u8>val;
                this.rgb_fifo[2][1] = <u8>(val >> 8)
                this.rgb_fifo[2][2] = <u8>(val >> 16)
                this.rgb_fifo[2][3] = <u8>(val >> 24)
                break;
            case 23: this.reg_23 = val; break;
            case 24: this.mac[0] = <i32>val; break;
            case 25: this.mac[1] = <i32>val; break;
            case 26: this.mac[2] = <i32>val; break;
            case 27: this.mac[3] = <i32>val; break;
            case 28:
                this.ir[1] = <i16>(((val) & 0x1F) << 7);
                this.ir[2] = <i16>(((val >>> 5) & 0x1F) << 7);
                this.ir[3] = <i16>(((val >>> 10) & 0x1F) << 7);
                break;
            case 29:
                break;
            case 30:
                this.lzcs = val;
                let tmp: u32 = ((val >>> 31) & 1) ? (val ^ 0xFFFFFFFF) : val;
                this.lzcr = <u8>clz<u32>(tmp);
                break;
            case 31:
                console.log('Write to read-only GTE reg 31');
                break;
            case 32: // 0
                this.matrices[0][0][0] = <i16>val;
                this.matrices[0][0][1] = <i16>(val >> 16);
                break;
            case 33: // 1
                this.matrices[0][0][2] = <i16>val;
                this.matrices[0][1][0] = <i16>(val >> 16);
                break;
            case 34: // 2
                this.matrices[0][1][1] = <i16>val;
                this.matrices[0][1][2] = <i16>(val >> 16);
                break;
            case 35: // 3
                this.matrices[0][2][0] = <i16>val;
                this.matrices[0][2][1] = <i16>(val >> 16);
                break;
            case 36: // 4
                this.matrices[0][2][2] = <i16>val;
                break;
            case 37: // 5-7
            case 38:
            case 39:
                this.control_vectors[0][reg - 37] = <i32>val;
                break;
            case 40: // 8
                this.matrices[1][0][0] = <i16>val;
                this.matrices[1][0][1] = <i16>(val >> 16);
                break;
            case 41: // 9
                this.matrices[1][0][2] = <i16>val;
                this.matrices[1][1][0] = <i16>(val >> 16);
                break;
            case 42: // 10
                this.matrices[1][1][1] = <i16>val;
                this.matrices[1][1][2] = <i16>(val >> 16);
                break;
            case 43: // 11
                this.matrices[1][2][0] = <i16>val;
                this.matrices[1][2][1] = <i16>(val >> 16);
                break;
            case 44: // 12
                this.matrices[1][2][2] = <i16>val;
                break;
            case 45: // 13-15
            case 46:
            case 47:
                this.control_vectors[1][reg - 45] = <i32>val;
                break;
            case 48: // 16
                this.matrices[2][0][0] = <i16>val;
                this.matrices[2][0][1] = <i16>(val >> 16);
                break;
            case 49: // 17
                this.matrices[2][0][2] = <i16>val;
                this.matrices[2][1][0] = <i16>(val >> 16);
                break;
            case 50: // 18
                this.matrices[2][1][1] = <i16>val;
                this.matrices[2][1][2] = <i16>(val >> 16);
                break;
            case 51: // 19
                this.matrices[2][2][0] = <i16>val;
                this.matrices[2][2][1] = <i16>(val >> 16);
                break;
            case 52: // 20
                this.matrices[2][2][2] = <i16>val;
                break;
            case 53: // 21-23
            case 54:
            case 55:
                this.control_vectors[2][reg - 53] = <i32>val;
                break;
            case 56: // 24
                this.ofx = <i32>val;
                break;
            case 57: // 25
                this.ofy = <i32>val;
                break;
            case 58: // 26
                this.h = <u16>val;
                break;
            case 59: // 27
                this.dqa = <i16>val;
                break;
            case 60: // 28
                this.dqb = <i32>val;
                break;
            case 61: // 29
                this.zsf3 = <i16>val;
                break;
            case 62: // 30
                this.zsf4 = <i16>val;
                break;
            case 63: // 31
                /*this.flags = val & 0x7ff_ff00;
                let msb: u32 = ((val & 0x7f87_e000) !== 0) ? 1 : 0;
                this.flags |= msb << 31;*/
                this.flags = (val & 0x7ffff000) | ((val & 0x7f87e000) ? (1 << 31) : 0);
                //let old_flags = this.flags;
                //this.flags = val & 0x7FFFF00;
                //this.flags |= (((old_flags & 0x7f87e000) !== 0) ? 1 : 0) << 31;
                break;
        }
    }

    read_reg(reg: u32): u32 {
        switch(reg) {
            case 0: return (<u32><u16>this.v[0][0]) | ((<u32><u16>this.v[0][1]) << 16);
            case 1: return <u32><i32>this.v[0][2];
            case 2: return (<u32><u16>this.v[1][0]) | ((<u32><u16>this.v[1][1]) << 16);
            case 3: return <u32><i32>this.v[1][2];
            case 4: return (<u32><u16>this.v[2][0]) | ((<u32><u16>this.v[2][1]) << 16);
            case 5: return <u32><i32>this.v[2][2];
            case 6: return <u32>this.rgb[0] | (<u32>this.rgb[1] << 8) | (<u32>this.rgb[2] << 16) | (<u32>this.rgb[3] << 24);
            case 7: return <u32>this.otz;
            case 8:
                console.log('IR0 WRITE! ' + hex4(<u32>this.ir[0]) + '.to ' + hex8(<u32><i32>this.ir[0]));
                return <u32>this.ir[0];
            case 9: return <u32>this.ir[1];
            case 10: return <u32>this.ir[2];
            case 11: return <u32>this.ir[3];
            case 12: return <u32><u16>this.xy_fifo[0][0] | (<u32><u16>this.xy_fifo[0][1] << 16);
            case 13: return <u32><u16>this.xy_fifo[1][0] | (<u32><u16>this.xy_fifo[1][1] << 16);
            case 14: return <u32><u16>this.xy_fifo[2][0] | (<u32><u16>this.xy_fifo[2][1] << 16);
            case 15: return <u32><u16>this.xy_fifo[2][0] | (<u32><u16>this.xy_fifo[3][1] << 16);
            case 16: return <u32>this.z_fifo[0];
            case 17: return <u32>this.z_fifo[1];
            case 18: return <u32>this.z_fifo[2];
            case 19: return <u32>this.z_fifo[3];
            case 20: return <u32>this.rgb_fifo[0][0] | (<u32>this.rgb_fifo[0][1] << 8) | (<u32>this.rgb_fifo[0][2] << 16) | (<u32>this.rgb_fifo[0][3] << 24);
            case 21: return <u32>this.rgb_fifo[1][0] | (<u32>this.rgb_fifo[1][1] << 8) | (<u32>this.rgb_fifo[1][2] << 16) | (<u32>this.rgb_fifo[1][3] << 24);
            case 22: return <u32>this.rgb_fifo[2][0] | (<u32>this.rgb_fifo[2][1] << 8) | (<u32>this.rgb_fifo[2][2] << 16) | (<u32>this.rgb_fifo[2][3] << 24);
            case 23: return this.reg_23;
            case 24: return <u32>this.mac[0];
            case 25: return <u32>this.mac[1];
            case 26: return <u32>this.mac[2];
            case 27: return <u32>this.mac[3];
            case 28:
            case 29:
                return saturate5s(this.ir[1] >>> 7) | (saturate5s(this.ir[2] >>> 7) << 5) | (saturate5s(this.ir[3] >>> 7) << 10);
            case 30: return this.lzcs;
            case 31: return <u32>this.lzcr;
            case 32: return (<u32><u16>this.matrices[0][0][0]) | ((<u32><u16>this.matrices[0][0][1]) << 16);
            case 33: return (<u32><u16>this.matrices[0][0][2]) | ((<u32><u16>this.matrices[0][1][0]) << 16);
            case 34: return (<u32><u16>this.matrices[0][1][1]) | ((<u32><u16>this.matrices[0][1][2]) << 16);
            case 35: return (<u32><u16>this.matrices[0][2][0]) | ((<u32><u16>this.matrices[0][2][1]) << 16);
            case 36: return <u32><i32>this.matrices[0][2][2];
            case 37:
            case 38:
            case 39:
                return <u32>this.control_vectors[0][reg - 37];
            case 40: return (<u32><u16>this.matrices[1][0][0]) | ((<u32><u16>this.matrices[1][0][1]) << 16);
            case 41: return (<u32><u16>this.matrices[1][0][2]) | ((<u32><u16>this.matrices[1][1][0]) << 16);
            case 42: return (<u32><u16>this.matrices[1][1][1]) | ((<u32><u16>this.matrices[1][1][2]) << 16);
            case 43: return (<u32><u16>this.matrices[1][2][0]) | ((<u32><u16>this.matrices[1][2][1]) << 16);
            case 44: return <u32><i32>this.matrices[1][2][2];
            case 45:
            case 46:
            case 47:
                return <u32>this.control_vectors[1][reg - 45];
            case 48: return (<u32><u16>this.matrices[2][0][0]) | ((<u32><u16>this.matrices[2][0][1]) << 16);
            case 49: return (<u32><u16>this.matrices[2][0][2]) | ((<u32><u16>this.matrices[2][1][0]) << 16);
            case 50: return (<u32><u16>this.matrices[2][1][1]) | ((<u32><u16>this.matrices[2][1][2]) << 16);
            case 51: return (<u32><u16>this.matrices[2][2][0]) | ((<u32><u16>this.matrices[2][2][1]) << 16);
            case 52: return <u32><i32>this.matrices[2][2][2];
            case 53:
            case 54:
            case 55:
                return <u32>this.control_vectors[2][reg - 53];
            case 56: return <u32>this.ofx;
            case 57: return <u32>this.ofy;
            case 58: return <u32>(<i16>this.h << 16); // H reads back as signed even though unsigned
            case 59: return <u32>this.dqa;
            case 60: return <u32>this.dqb;
            case 61: return <u32>this.zsf3;
            case 62: return <u32>this.zsf4;
            case 63: return this.flags;
        }
        unreachable();
        return 0;
    }

    cmd_RTPT(config: GTECmdCfg): void {
        this.do_RTP(config, 0);
        this.do_RTP(config, 1);

        let pf = this.do_RTP(config, 2);

        this.depth_queueing(pf);
    }

    cmd_GPF(config: GTECmdCfg): void {
        let ir0: i32 = <i32>this.ir[0];

        for (let i = 1; i < 4; i++) {
            let ir: i32 = <i32>this.ir[i];

            this.mac[i] = (ir * ir0) >> config.shift;
        }

        this.mac_to_ir(config);
        this.mac_to_rgb_fifo();
    }

    cmd_GPL(config: GTECmdCfg): void {
        let ir0: i32 = <i32>this.ir[0];
        let shift: u8 = config.shift;
        for (let i = 1; i < 4; i++) {
            let ir: i32 = <i32>this.ir[i];

            let ir_prod: i64 = <i64>(ir * ir0);

            let mac = (<i64>this.mac[i]) << shift;

            let sum = this.i64_to_i44(<u8>(i - 1), mac + ir_prod);

            this.mac[i] = <i32>(sum >> shift);
        }
        this.mac_to_ir(config);
        this.mac_to_rgb_fifo();
    }

    cmd_NCCT(config: GTECmdCfg): void {
        this.do_ncc(config, 0);
        this.do_ncc(config, 1);
        this.do_ncc(config, 2);
    }

    do_RTP(config: GTECmdCfg, vector_index: u32): u32 {
        let z_shifted: i32 = 0;

        let rm = Matrix.Rotation;
        let tr = ControlVector.Translation;

        for (let r = 0; r < 3; r++) {
            let res: i64 = (<i64>this.control_vectors[tr][r]) << 12;
            for (let c = 0; c < 3; c++) {
                let v: i32 = <i32>this.v[vector_index][c];
                let m: i32 = <i32>this.matrices[rm][r][c];
                let rot = v * m;

                res = this.i64_to_i44(<u8>c, <i64>res + <i64>rot);
            }
            this.mac[r+1] = <i32>(res >> this.config.shift);
            z_shifted = <i32>(res >> 12);
        }

        let val = this.mac[1];
        this.ir[1] = this.i32_to_i16_saturate(this.config, 0, val);
        val = this.mac[2];
        this.ir[2] = this.i32_to_i16_saturate(this.config, 1, val);

        // Weird behavior on Z clip
        let min: i32 = -32768;
        let max: i32 = 32767;
        if ((z_shifted > max) || (z_shifted < min))
            this.set_flag(22);

        min = config.clamp_negative ? 0 : -32768;
        val = this.mac[3];
        if (val < min) this.ir[3] = <i16>min;
        else if (val > max) this.ir[3] = 32767;
        else this.ir[3] = <i16>val;

        let z_saturated: u16;
        if (z_shifted < 0) {
            this.set_flag(18);
            z_saturated = 0;
        }
        else if (z_shifted > 65535) {
            this.set_flag(18);
            z_saturated = 65535;
        } else {
            z_saturated = <u16>z_shifted;
        }

        this.z_fifo[0] = this.z_fifo[1];
        this.z_fifo[1] = this.z_fifo[2];
        this.z_fifo[2] = this.z_fifo[3];
        this.z_fifo[3] = z_saturated;

        let projection_factor: u32;
        if (z_saturated > (this.h / 2)) {
            projection_factor = GTEdivide(this.h, z_saturated);
        }
        else {
            this.set_flag(17);
            projection_factor = 0x1FFFF;
        }

        let factor: i64 = projection_factor;
        let x: i64 = <i64>this.ir[1];
        let y: i64 = <i64>this.ir[2];
        let ofx: i64 = <i64>this.ofx;
        let ofy: i64 = <i64>this.ofy;

        let screen_xa = x * factor * ofx;
        let screen_ya = y * factor * ofy;

        this.check_mac_overflow(screen_xa);
        this.check_mac_overflow(screen_ya);

        let screen_x: i32 = <i32>(screen_xa >> 16);
        let screen_y: i32 = <i32>(screen_ya >> 16);

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

    check_mac_overflow(val: i64): void {
        if (val < -0x80000000) {
            this.set_flag(15);
        } else if (val > 0x7fffffff) {
            this.set_flag(16);
        }
    }

    i32_to_i11_saturate(flag: u8, val: i32): i16 {
        if (val < -0x400) {
            this.set_flag(14 - flag);
            return -0x400;
        }
        else if (val > 0x3FF) {
            this.set_flag(14 - flag);
            return 0x3FF;
        }
        return <i16>val;
    }

    i32_to_i16_saturate(config: GTECmdCfg, flag: u8, val: i32): i16 {
        let min: i32 = config.clamp_negative ? 0 : -32768;
        let max: i32 = 32767;

        if (val > max) {
            this.set_flag(24 - flag);
            return 32767;
        }
        else if (val < min) {
            this.set_flag(24 - flag);
            return -32768;
        } else {
            return <i16>val;
        }
    }

    @inline
    i64_to_i44(flag: u8, val: i64): i64 {
        if (val > 0x7FFFFFFFFFF) {
            this.set_flag(30 - flag);
        }
        else if (val < -0x80000000000) {
            this.set_flag(27 - flag);
        }

        // sign-extend result
        return (val << 20) >> 20;
    }

    set_flag(bit: u8): void { this.flags |= (1 << bit); }

    cmd_RTPS(config: GTECmdCfg): void {
        let pf = this.do_RTP(config, 0);
        this.depth_queueing(pf);
    }

    depth_queueing(pf: u32): void {
        let factor: i64 = <i64>pf;
        let dqa = <i64>this.dqa;
        let dqb = <i64>this.dqb;

        let depth = dqb + dqa * factor;

        this.check_mac_overflow(depth);

        this.mac[0] = <i32>depth;

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
            this.ir[0] = <i16>depth;
    }

    cmd_NCLIP(): void {
        let x0 = <i32>this.xy_fifo[0][0];
        let y0 = <i32>this.xy_fifo[0][1];

        let x1 = <i32>this.xy_fifo[1][0] & 0xFFFFFFFF;
        let y1 = <i32>this.xy_fifo[1][1] & 0xFFFFFFFF;

        let x2 = <i32>this.xy_fifo[2][0] & 0xFFFFFFFF;
        let y2 = <i32>this.xy_fifo[2][1] & 0xFFFFFFFF;

        let a = x0 * (y1 - y2);
        let b = x1 * (y2 - y0);
        let c = x2 * (y0 - y1);

        let sum: i64 = <i64>a + <i64>b + <i64>c;

        this.check_mac_overflow(sum);

        this.mac[0] = <i32>sum;
    }

    cmd_OP(config: GTECmdCfg): void {
        let rm = Matrix.Rotation;

        let ir1 = <i32>this.ir[1];
        let ir2 = <i32>this.ir[2];
        let ir3 = <i32>this.ir[3];

        let r0 = <i32>this.matrices[rm][0][0];
        let r1 = <i32>this.matrices[rm][1][1];
        let r2 = <i32>this.matrices[rm][2][2];

        let shift = config.shift;

        this.mac[1] = (r1 * ir3 - r2 * ir2) >> shift;
        this.mac[2] = (r2 * ir1 - r0 * ir3) >> shift;
        this.mac[3] = (r0 * ir2 - r1 * ir1) >> shift;

        this.mac_to_ir(config);
    }

    mac_to_ir(config: GTECmdCfg): void {
        this.ir[1] = this.i32_to_i16_saturate(config, 0, this.mac[1])
        this.ir[2] = this.i32_to_i16_saturate(config, 1, this.mac[2])
        this.ir[3] = this.i32_to_i16_saturate(config, 2, this.mac[3])
    }

    cmd_DPCS(config: GTECmdCfg): void {
        let fca = ControlVector.FarColor;
        let rgb = new StaticArray<u8>(3);
        rgb[0] = this.rgb[0];
        rgb[1] = this.rgb[1];
        rgb[2] = this.rgb[2];


        for (let i = 0; i < 3; i++) {
            let fc: i64 = (<i64>this.control_vectors[fca][i]) << 12;
            let col = (<i64>rgb[i]) << 16;

            let sub = fc - col;

            let tmp = <i32>(this.i64_to_i44(<u8>i, sub) >> config.shift);

            let ir0 = <i64>this.ir[0];

            let sat: i64 = <i64>this.i32_to_i16_saturate(this.config0, <u8>i, tmp);

            let res = this.i64_to_i44(<u8>i, col + ir0 * sat);

            this.mac[i + 1] = <i32>(res >> this.config.shift);
        }

        this.mac_to_ir(config);
        this.mac_to_rgb_fifo();
    }

    mac_to_rgb_fifo(): void {
        let mac1 = this.mac[1];
        let mac2 = this.mac[2];
        let mac3 = this.mac[3];

        let r: u8 = mac_to_color(this, mac1, 0);
        let g: u8 = mac_to_color(this, mac2, 1);
        let b: u8 = mac_to_color(this, mac3, 2);
        this.rgb_fifo[0][0] = this.rgb_fifo[1][0]
        this.rgb_fifo[0][1] = this.rgb_fifo[1][1]
        this.rgb_fifo[0][2] = this.rgb_fifo[1][2]
        this.rgb_fifo[0][3] = this.rgb_fifo[1][3]

        this.rgb_fifo[1][0] = this.rgb_fifo[2][0];
        this.rgb_fifo[1][1] = this.rgb_fifo[2][1];
        this.rgb_fifo[1][2] = this.rgb_fifo[2][2];
        this.rgb_fifo[1][3] = this.rgb_fifo[2][3];

        this.rgb_fifo[2][0] = r;
        this.rgb_fifo[2][1] = g;
        this.rgb_fifo[2][2] = b;
        this.rgb_fifo[2][3] = this.rgb[3];
    }

    cmd_INTPL(config: GTECmdCfg): void {
        let fca = ControlVector.FarColor;

        for (let i = 0; i < 3; i++) {
            let fc = (<i64>this.control_vectors[fca][i]) << 12;
            let ir = (<i64>this.ir[i + 1]) << 12;

            let sub = fc - ir;
            let tmp = <i32>(this.i64_to_i44(<u8>i, sub) >> config.shift)
            let ir0 = <i64>this.ir[0];
            let sat = this.i32_to_i16_saturate(this.config0, <u8>i, tmp)
            let res = this.i64_to_i44(<u8>i, ir + ir0 * sat);
            this.mac[i + 1] = <i32>(res >> this.config.shift);
        }
        this.mac_to_ir(config);
        this.mac_to_rgb_fifo();
    }

    cmd_MVMVA(config: GTECmdCfg): void {
        this.v[3][0] = this.ir[1];
        this.v[3][1] = this.ir[2];
        this.v[3][2] = this.ir[3];

        this.multiply_matrix_by_vector(config, config.matrix, config.vector_mul, this.config.vector_add);
    }

    cmd_NCDS(config: GTECmdCfg): void {
        this.do_ncd(config, 0);
    }

    cmd_NCDT(config: GTECmdCfg): void {
        this.do_ncd(config, 0);
        this.do_ncd(config, 1);
        this.do_ncd(config, 2);
    }

    cmd_NCCS(config: GTECmdCfg): void {
        this.do_ncc(config, 0);
    }

    cmd_CC(config: GTECmdCfg): void {
        this.v[3][0] = this.ir[1];
        this.v[3][1] = this.ir[2];
        this.v[3][2] = this.ir[3];

        this.multiply_matrix_by_vector(config, Matrix.Color, 3, ControlVector.BackgroundColor);

        let crol: StaticArray<u8> = new StaticArray<u8>(3);
        crol[0] = this.rgb[0];
        crol[1] = this.rgb[1];
        crol[2] = this.rgb[2];

        for (let i = 0; i < 3; i++) {
            let col: i32 = (<i32>crol[i]) << 4;
            let ir: i32 = <i32>this.ir[i + 1];

            this.mac[i + 1] = (col * ir) >> config.shift;
        }

        this.mac_to_ir(config);
        this.mac_to_rgb_fifo();
    }

    do_nc(config: GTECmdCfg, vector_index: u8): void {
        this.multiply_matrix_by_vector(config, Matrix.Light, vector_index, ControlVector.Zero);

        this.v[3][0] = this.ir[1];
        this.v[3][1] = this.ir[2];
        this.v[3][2] = this.ir[3];

        this.multiply_matrix_by_vector(config, Matrix.Color, 3, ControlVector.BackgroundColor);

        this.mac_to_rgb_fifo();
    }

    do_dpc(config: GTECmdCfg): void {
        let fca = ControlVector.FarColor;

        let crol: StaticArray<u8> = new StaticArray<u8>(3);
        crol[0] = this.rgb_fifo[0][0];
        crol[1] = this.rgb_fifo[0][1];
        crol[2] = this.rgb_fifo[0][2];

        for (let i = 0; i < 3; i++) {
            let fc = (<i64>this.control_vectors[fca][i]) << 12;
            let col = (<i64>crol[i]) << 16;

            let sub = fc - col;
            let tmp = <i32>(this.i64_to_i44(<u8>i, sub) >> config.shift);
            let ir0: i64 = <i64>this.ir[0];
            let sat: i64 = <i64>this.i32_to_i16_saturate(this.config0, <u8>i, tmp);

            let res = this.i64_to_i44(<u8>i, col + ir0 * sat);

            this.mac[i + 1] = <i32>(res >> config.shift);
        }

        this.mac_to_ir(config);
        this.mac_to_rgb_fifo();
    }

    cmd_AVSZ4(): void {
        let z0: u32 = this.z_fifo[0];
        let z1: u32 = this.z_fifo[1];
        let z2: u32 = this.z_fifo[2];
        let z3: u32 = this.z_fifo[3];

        let sum = z0 + z1 + z2 + z3;

        let zsf4 = <i64>this.zsf4;

        let average = zsf4 * <i64>sum;

        this.check_mac_overflow(average);

        this.mac[0] = <i32>average;
        this.otz = this.i64_to_otz(average);
    }

    cmd_AVSZ3(): void {
        let z1: u32 = this.z_fifo[1];
        let z2: u32 = this.z_fifo[2];
        let z3: u32 = this.z_fifo[3];

        let sum = z1 + z2 + z3;
        console.log('AVSZ! ' + hex4(z1) + ' ' + hex4(z2) + ' ' + hex4(z3))

        let zsf3: i64 = <i64> this.zsf3;
        let average = zsf3 * <i64>sum;

        this.check_mac_overflow(average);

        this.mac[0] = <i32>average;
        this.otz = this.i64_to_otz(average);
    }

    i64_to_otz(average: i64): u16 {
        let value = average >> 12;

        if (value < 0) {
            this.set_flag(18);
            return 0;
        } else if (value > 0xFFFF) {
            this.set_flag(18);
            return 0xFFFF;
        }
        return <u16>value;
    }

    cmd_DPCT(config: GTECmdCfg): void {
        this.do_dpc(config);
        this.do_dpc(config);
        this.do_dpc(config);
    }

    cmd_SQR(config: GTECmdCfg): void {
        for (let i = 1; i < 4; i++) {
            let ir: i32 = <i32>this.ir[i];
            this.mac[i] = (ir * ir) >> config.shift;
        }
        this.mac_to_ir(config);
    }

    cmd_NCS(config: GTECmdCfg): void {
        this.do_nc(config, 0);
    }

    cmd_NCT(config: GTECmdCfg): void {
        this.do_nc(config, 0);
        this.do_nc(config, 1);
        this.do_nc(config, 2);
    }

    do_ncc(config: GTECmdCfg, vector_index: u8): void {
        this.multiply_matrix_by_vector(config, Matrix.Light, vector_index, ControlVector.Zero);

        this.v[3][0] = this.ir[1];
        this.v[3][1] = this.ir[2];
        this.v[3][2] = this.ir[3];

        this.multiply_matrix_by_vector(config, Matrix.Color, 3, ControlVector.BackgroundColor);

        let crol: StaticArray<u8> = new StaticArray<u8>(3);
        crol[0] = this.rgb[0];
        crol[1] = this.rgb[1];
        crol[2] = this.rgb[2];

        for (let i = 0; i < 3; i++) {
            let col: i32 = (<i32>crol[i]) << 4;
            let ir: i32 = <i32>this.ir[i + 1];

            this.mac[i + 1] = (col * ir) >> config.shift;
        }

        this.mac_to_ir(config);
        this.mac_to_rgb_fifo();
    }

    do_ncd(config: GTECmdCfg, vector_index: u8): void {
        this.multiply_matrix_by_vector(config, Matrix.Light, vector_index, ControlVector.Zero);

        this.v[3][0] = this.ir[1];
        this.v[3][1] = this.ir[2];
        this.v[3][2] = this.ir[3];

        this.multiply_matrix_by_vector(config, Matrix.Color, 3, ControlVector.BackgroundColor);

        this.cmd_DCPL(config);
    }

    cmd_DCPL(config: GTECmdCfg): void {
        let fca = ControlVector.FarColor;

        let crol: StaticArray<u8> = new StaticArray<u8>(3);
        crol[0] = this.rgb[0];
        crol[1] = this.rgb[1];
        crol[2] = this.rgb[2];

        for (let i = 0; i < 3; i++) {
            let fc = (<i64>this.control_vectors[fca][i]) << 12;
            let ir: i32 = <i32>this.ir[i + 1];
            let col = (<i32>crol[i]) << 4;

            let shading: i64 = <i64>(col * ir);

            let tmpr = fc - shading;

            let tmp: i32 = <i32>(this.i64_to_i44(<u8>i, tmpr) >> config.shift);
            let ir0 = <i64>this.ir[0];
            let res: i64 = <i64>this.i32_to_i16_saturate(this.config0, <u8>i, tmp);

            res = this.i64_to_i44(<u8>i, shading + ir0 * res);

            this.mac[i+1] = <i32>(res >> config.shift);
        }
        this.mac_to_ir(config);
        this.mac_to_rgb_fifo();
    }

    multiply_matrix_by_vector(config: GTECmdCfg, mat: Matrix, vei: u8, crv: ControlVector): void {
        let vector_index: i32 = <i32>vei;
        if (mat === Matrix.Invalid) {
            console.log('GTE mul with invalid matrix')
            return;
        }

        if (crv === ControlVector.FarColor) {
            console.log('GTE multiply with far color. special...');
            return;
        }

        for (let r = 0; r < 3; r++) {
            let res = (<i64>this.control_vectors[crv][r]) << 12;

            for (let c = 0; c < 3; c++) {
                let v: i32 = <i32>this.v[vector_index][c];
                let m: i32 = <i32>this.matrices[mat][r][c];

                let product = v * m;

                res = this.i64_to_i44(<u8>r, res + product);
            }

            this.mac[r + 1] = <i32>(res >> config.shift);
        }

        this.mac_to_ir(config);
    }
}

// @ts-ignore
@inline
function mac_to_color(gte: PS1_GTE, mac: i32, which: u8): u8 {
    let c = mac >> 4;
    if (c < 0) {
        gte.set_flag(21 - which);
        return 0;
    }
    else if (c > 0xFF) {
        gte.set_flag(21 - which);
        return 0xFF;
    }
    return <u8>c;
}
