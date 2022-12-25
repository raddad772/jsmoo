import {NES} from "./nes"
import {NES_VARIANTS} from "./nes_common";

export function new_NES(): NES {
    return new NES(NES_VARIANTS.NTSCU);
}