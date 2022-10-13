export interface NES_controller {
    data(): u32;
    latch(what: u32): u32;
}

export class NES_controllerport {
	device: NES_controller | null = null
    constructor() {
		this.device = null;
	}

	data(): u32 {
		if (this.device !== null) return this.device!.data() & 3;
		return 0;
	}

	latch(what: u32): u32 {
		if (this.device !== null) return this.device!.latch(what);
		return 0;
	}
}
