import { m6502 } from './m6502'
import {nesm6502_opcodes_decoded} from "../../../system/nes/cpu/nesm6502_generated_opcodes";

export function new_m6502(): m6502 {
  return new m6502(nesm6502_opcodes_decoded);
}