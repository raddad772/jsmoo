import assert from "assert";
import { add } from "../build/debug_stable.js";
assert.strictEqual(add(1, 2), 3);
console.log("ok");
