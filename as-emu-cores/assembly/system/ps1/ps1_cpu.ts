import {R3000} from "../../component/cpu/r3000/r3000";
import {PS1_mem} from "./ps1_mem";

export class PS1_CPU {
    core: R3000

    constructor(mem: PS1_mem) {
        this.core = new R3000(mem);
    }

    enable_tracing() {
        this.core.enable_tracing();
    }

    disable_tracing() {
        this.core.disable_tracing();
    }

    reset() {
        this.core.reset();
    }

    cycle() {
        this.core.cycle();
    }
}