import {R3000} from "../../component/cpu/r3000/r3000";
import {PS1_mem} from "./ps1_mem";
import {PS1_clock} from "./ps1_misc";

export class PS1_CPU {
    core: R3000

    constructor(mem: PS1_mem, clock: PS1_clock) {
        this.core = new R3000(mem, clock);
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

    cycle(howmany: i32): void {
        this.core.cycle(howmany);
    }
}
