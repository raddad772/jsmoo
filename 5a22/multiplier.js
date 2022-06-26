"use strict";

const MULT_OPS = Object.freeze({NONE: 0, MUL: 1, DIV: 2});

class r5a22multiplier {
    constructor(mem_map) {
        this.mem_map = mem_map;


        this.w
        
    }

    reset() {

    }

    cycle() {

    }
    
    reg_read(addr) {
        switch(addr) {
            case 0x4214:
                return this.quotient & 0xFF;
            case 0x4215:
                return (this.quotient & 0xFF00) >>> 8;
            case 0x4216:
                return this.product_remainder & 0xFF;
            case 0x4217:
                return (this.product_remainder & 0xFF00) >>> 8;
        }
    }

    reg_write(addr, val) {
        switch(addr) {
            case 0x4202:
                this.multplicand_a = val;
                break;
            case 0x4203:
                this.multiplier_b = val;
                this.start_mul();
                break;
            case 0x4204:
                this.dividend = (this.dividend & 0xFF00) + val;
                break;
            case 0x4205:
                this.dividend = (val << 8) + (this.dividend & 0xFF);
                break;
            case 0x4206:
                this.divisor = val;
                this.start_div();
                break;
        }
    }
    
}