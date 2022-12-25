export async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
      "console.log"(text) {
        // ~lib/bindings/dom/console.log(~lib/string/String) => void
        text = __liftString(text >>> 0);
        console.log(text);
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    TST_M6502_get(obj) {
      // assembly/glue/cpu_tester/TST_M6502_get(assembly/glue/cpu_tester/TST_M6502) => assembly/glue/cpu_tester/TST_M6502_IO
      obj = __lowerInternref(obj) || __notnull();
      return __liftRecord29(exports.TST_M6502_get(obj) >>> 0);
    },
    TST_M6502_new() {
      // assembly/glue/cpu_tester/TST_M6502_new() => assembly/glue/cpu_tester/TST_M6502
      return __liftInternref(exports.TST_M6502_new() >>> 0);
    },
    TST_M6502_set(obj, to) {
      // assembly/glue/cpu_tester/TST_M6502_set(assembly/glue/cpu_tester/TST_M6502, assembly/glue/cpu_tester/TST_M6502_IO) => void
      obj = __retain(__lowerInternref(obj) || __notnull());
      to = __lowerRecord29(to) || __notnull();
      try {
        exports.TST_M6502_set(obj, to);
      } finally {
        __release(obj);
      }
    },
    TST_M6502_cycle(obj) {
      // assembly/glue/cpu_tester/TST_M6502_cycle(assembly/glue/cpu_tester/TST_M6502) => void
      obj = __lowerInternref(obj) || __notnull();
      exports.TST_M6502_cycle(obj);
    },
    gp_load_ROM_from_RAM(player, sz) {
      // assembly/glue/global_player/gp_load_ROM_from_RAM(assembly/glue/global_player/global_player_t, u32) => void
      player = __lowerInternref(player) || __notnull();
      exports.gp_load_ROM_from_RAM(player, sz);
    },
    gp_run_frame(player) {
      // assembly/glue/global_player/gp_run_frame(assembly/glue/global_player/global_player_t) => u32
      player = __lowerInternref(player) || __notnull();
      return exports.gp_run_frame(player) >>> 0;
    },
    gp_set_system(player, to) {
      // assembly/glue/global_player/gp_set_system(assembly/glue/global_player/global_player_t, ~lib/string/String) => void
      player = __retain(__lowerInternref(player) || __notnull());
      to = __lowerString(to) || __notnull();
      try {
        exports.gp_set_system(player, to);
      } finally {
        __release(player);
      }
    },
    new_global_player() {
      // assembly/glue/global_player/new_global_player() => assembly/glue/global_player/global_player_t
      return __liftInternref(exports.new_global_player() >>> 0);
    },
    gp_get_specs(player) {
      // assembly/glue/global_player/gp_get_specs(assembly/glue/global_player/global_player_t) => assembly/system/interface/machine_description
      player = __lowerInternref(player) || __notnull();
      return __liftRecord32(exports.gp_get_specs(player) >>> 0);
    },
    gp_get_input_buffer(player) {
      // assembly/glue/global_player/gp_get_input_buffer(assembly/glue/global_player/global_player_t) => usize
      player = __lowerInternref(player) || __notnull();
      return exports.gp_get_input_buffer(player) >>> 0;
    },
    gp_get_framevars(player) {
      // assembly/glue/global_player/gp_get_framevars(assembly/glue/global_player/global_player_t) => assembly/glue/global_player/framevars_t
      player = __lowerInternref(player) || __notnull();
      return __liftRecord61(exports.gp_get_framevars(player) >>> 0);
    },
  }, exports);
  function __liftRecord29(pointer) {
    // assembly/glue/cpu_tester/TST_M6502_IO
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      A: new Uint32Array(memory.buffer)[pointer + 0 >>> 2],
      X: new Uint32Array(memory.buffer)[pointer + 4 >>> 2],
      Y: new Uint32Array(memory.buffer)[pointer + 8 >>> 2],
      PC: new Uint32Array(memory.buffer)[pointer + 12 >>> 2],
      S: new Uint32Array(memory.buffer)[pointer + 16 >>> 2],
      P: new Uint32Array(memory.buffer)[pointer + 20 >>> 2],
      IR: new Uint32Array(memory.buffer)[pointer + 24 >>> 2],
      pins_D: new Uint32Array(memory.buffer)[pointer + 28 >>> 2],
      pins_Addr: new Uint32Array(memory.buffer)[pointer + 32 >>> 2],
      pins_RW: new Uint32Array(memory.buffer)[pointer + 36 >>> 2],
      TCU: new Uint32Array(memory.buffer)[pointer + 40 >>> 2],
      RES_pending: new Uint32Array(memory.buffer)[pointer + 44 >>> 2],
    };
  }
  function __lowerRecord29(value) {
    // assembly/glue/cpu_tester/TST_M6502_IO
    // Hint: Opt-out from lowering as a record by providing an empty constructor
    if (value == null) return 0;
    const pointer = exports.__pin(exports.__new(48, 29));
    new Uint32Array(memory.buffer)[pointer + 0 >>> 2] = value.A;
    new Uint32Array(memory.buffer)[pointer + 4 >>> 2] = value.X;
    new Uint32Array(memory.buffer)[pointer + 8 >>> 2] = value.Y;
    new Uint32Array(memory.buffer)[pointer + 12 >>> 2] = value.PC;
    new Uint32Array(memory.buffer)[pointer + 16 >>> 2] = value.S;
    new Uint32Array(memory.buffer)[pointer + 20 >>> 2] = value.P;
    new Uint32Array(memory.buffer)[pointer + 24 >>> 2] = value.IR;
    new Uint32Array(memory.buffer)[pointer + 28 >>> 2] = value.pins_D;
    new Uint32Array(memory.buffer)[pointer + 32 >>> 2] = value.pins_Addr;
    new Uint32Array(memory.buffer)[pointer + 36 >>> 2] = value.pins_RW;
    new Uint32Array(memory.buffer)[pointer + 40 >>> 2] = value.TCU;
    new Uint32Array(memory.buffer)[pointer + 44 >>> 2] = value.RES_pending;
    exports.__unpin(pointer);
    return pointer;
  }
  function __liftRecord33(pointer) {
    // assembly/system/interface/overscan_info
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      top: new Uint32Array(memory.buffer)[pointer + 0 >>> 2],
      bottom: new Uint32Array(memory.buffer)[pointer + 4 >>> 2],
      left: new Uint32Array(memory.buffer)[pointer + 8 >>> 2],
      right: new Uint32Array(memory.buffer)[pointer + 12 >>> 2],
    };
  }
  function __liftRecord14(pointer) {
    // assembly/system/interface/input_map_keypoint
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      uber: __liftString(new Uint32Array(memory.buffer)[pointer + 0 >>> 2]),
      name: __liftString(new Uint32Array(memory.buffer)[pointer + 4 >>> 2]),
      buf_pos: new Uint32Array(memory.buffer)[pointer + 8 >>> 2],
      internal_code: new Uint32Array(memory.buffer)[pointer + 12 >>> 2],
    };
  }
  function __liftRecord32(pointer) {
    // assembly/system/interface/machine_description
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      name: __liftString(new Uint32Array(memory.buffer)[pointer + 0 >>> 2]),
      timing: new Int32Array(memory.buffer)[pointer + 4 >>> 2],
      fps: new Uint32Array(memory.buffer)[pointer + 8 >>> 2],
      standard: new Int32Array(memory.buffer)[pointer + 12 >>> 2],
      x_resolution: new Uint32Array(memory.buffer)[pointer + 16 >>> 2],
      y_resolution: new Uint32Array(memory.buffer)[pointer + 20 >>> 2],
      xrw: new Uint32Array(memory.buffer)[pointer + 24 >>> 2],
      xrh: new Uint32Array(memory.buffer)[pointer + 28 >>> 2],
      overscan: __liftRecord33(new Uint32Array(memory.buffer)[pointer + 32 >>> 2]),
      out_ptr: new Uint32Array(memory.buffer)[pointer + 36 >>> 2],
      out_size: new Uint32Array(memory.buffer)[pointer + 40 >>> 2],
      keymap: __liftArray(pointer => __liftRecord14(new Uint32Array(memory.buffer)[pointer >>> 2]), 2, new Uint32Array(memory.buffer)[pointer + 44 >>> 2]),
    };
  }
  function __liftRecord61(pointer) {
    // assembly/glue/global_player/framevars_t
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      master_frame: new BigUint64Array(memory.buffer)[pointer + 0 >>> 3],
      x: new Uint32Array(memory.buffer)[pointer + 8 >>> 2],
      scanline: new Uint32Array(memory.buffer)[pointer + 12 >>> 2],
    };
  }
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __lowerString(value) {
    if (value == null) return 0;
    const
      length = value.length,
      pointer = exports.__new(length << 1, 2) >>> 0,
      memoryU16 = new Uint16Array(memory.buffer);
    for (let i = 0; i < length; ++i) memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
    return pointer;
  }
  function __liftArray(liftElement, align, pointer) {
    if (!pointer) return null;
    const
      memoryU32 = new Uint32Array(memory.buffer),
      dataStart = memoryU32[pointer + 4 >>> 2],
      length = memoryU32[pointer + 12 >>> 2],
      values = new Array(length);
    for (let i = 0; i < length; ++i) values[i] = liftElement(dataStart + (i << align >>> 0));
    return values;
  }
  class Internref extends Number {}
  const registry = new FinalizationRegistry(__release);
  function __liftInternref(pointer) {
    if (!pointer) return null;
    const sentinel = new Internref(__retain(pointer));
    registry.register(sentinel, pointer);
    return sentinel;
  }
  function __lowerInternref(value) {
    if (value == null) return 0;
    if (value instanceof Internref) return value.valueOf();
    throw TypeError("internref expected");
  }
  const refcounts = new Map();
  function __retain(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount) refcounts.set(pointer, refcount + 1);
      else refcounts.set(exports.__pin(pointer), 1);
    }
    return pointer;
  }
  function __release(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount === 1) exports.__unpin(pointer), refcounts.delete(pointer);
      else if (refcount) refcounts.set(pointer, refcount - 1);
      else throw Error(`invalid refcount '${refcount}' for reference '${pointer}'`);
    }
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  return adaptedExports;
}
