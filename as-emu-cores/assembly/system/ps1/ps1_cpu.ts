import {R3000} from "../../component/cpu/r3000/r3000";
import {PS1_mem} from "./ps1_mem";

export class PS1_CPU {
    core: R3000

    constructor(mem: PS1_mem) {
        this.core = new R3000(mem);
    }

    enable_tracing(): void {
        this.core.enable_tracing();
    }

    disable_tracing(): void {
        this.core.disable_tracing();
    }

    reset(): void {
        this.core.reset();
    }

    cycle(): void {
        this.core.cycle();
    }
}
