"use strict";

class Z80_cycle {
    constructor(addr, val, RD, WR, MRQ, IO) {
        this.addr = addr;
        this.val = val;
        this.RD = RD;
        this.WR = WR;
        this.MRQ = MRQ;
        this.IO = IO;
    }

    serializable() {
        let ostr = '';
        ostr += this.RD ? 'r' : '-';
        ostr += this.WR ? 'w' : '-';
        ostr += this.MRQ ? 'm' : '-';
        ostr += this.IO ? 'i' : '-';
        return [this.addr, this.val, ostr];
    }
}

class Z80_t_states {
    constructor() {
        this.cycles = [];
        this.state = {
            RD: 0,
            WR: 0,
            MRQ: 0,
            IO: 0,
            addr: 0,
            D: 0
        }
    }

    add(addr, val, RD, WR, MRQ, IO) {
        this.cycles.push(new Z80_cycle(addr, val, RD, WR, MRQ, IO));
    }

    serializeable() {
        let out = [];
        for (let i in this.cycles) {
            out.push(this.cycles[i].serializeable());
        }
        return out;
    }
}

function Z80T_pins_RDR(pins) {
    return ((pins.indexOf('r') !== -1) && (pins.indexOf('m') !== -1));
}

function Z80T_pins_WRR(pins) {
    return ((pins.indexOf('w') !== -1) && (pins.indexOf('m') !== -1));
}

function Z80T_pins_RDIO(pins) {
    return ((pins.indexOf('r') !== -1) && (pins.indexOf('i') !== -1));
}

function Z80T_pins_WRIO(pins) {
    return ((pins.indexOf('w') !== -1) && (pins.indexOf('i') !== -1));
}

class Z80_proc_test {
    constructor() {
        // Serialized
        this.name = '';
        this.ports = {};
        this.initial = {};
        this.final = {};
        this.cycles = new Z80_t_states();

        // not serialized
        this.current_cycle = 0;
    }

    serializable() {
        return {
            name: this.name,
            initial: this.initial,
            final: this.final,
            cycles: this.cycles.serializeable()
        }
    }

    finalize(regs) {
        regs.dump_to(this.final);
        let initial_RAMs = [];
        let final_RAMs = [];
        let ports = [];
        let initial_set = new Set();
        let final_set = new Set();
        for (let i in this.cycles.cycles) {
            let cycle = this.cycles.cycles[i];
           let addr = cycle[0];
           let val = cycle[1];
           let pins = cycle[2];
           if (addr !== null && val !== null) {
               if (Z80T_pins_RDR(pins)) {
                   if (!initial_set.has(addr)) {
                       initial_set.add(addr);
                       initial_RAMs.push([addr, val]);
                   }
               } else if (Z80T_pins_RDIO(pins)) {
                   ports.push([addr, val, 'r']);
               }
               if (Z80T_pins_WRR(pins)) {
                   if (!initial_set.has(addr)) {
                       initial_set.add(addr);
                       initial_RAMs.push([addr, 0]);
                   }
               } else if (Z80T_pins_WRIO(pins)) {
                   ports.push([addr, val, 'w'])
               }
               if ((!final_set.has(addr)) && (Z80T_pins_RDR(pins) || Z80T_pins_WRR(pins))) {
                   final_set.add(addr);
                   final_RAMs.push([addr, val]);
               } else {
                   for (let j in final_RAMs) {
                       if (final_RAMs[j][0] === addr) {
                           final_RAMs[j][1] = val;
                           break;
                       }
                   }
               }
           }
        }
        initial_RAMs = initial_RAMs.sort((a, b) => {return a[0] - b[0]});
        final_RAMs = final_RAMs.sort((a, b) => {return a[0] - b[0]});
        this.initial.ram = initial_RAMs;
        this.final.ram = final_RAMs;
        this.ports = ports;
    }

    add_cycle(addr, val, RD, WR, MRQ, IO) {
        this.cycles.add(addr, val, RD, WR, MRQ, IO);
    }
}

class Z80T_F {
    constructor(from) {
        this.S = 0;
        this.Z = 0;
        this.Y = 0;
        this.H = 0;
        this.X = 0;
        this.PV = 0;
        this.setbyte(from);
    }
}