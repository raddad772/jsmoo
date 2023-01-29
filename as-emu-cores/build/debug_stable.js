async function instantiate(module, imports = {}) {
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
      return __liftRecord45(exports.TST_M6502_get(obj) >>> 0);
    },
    TST_M6502_new() {
      // assembly/glue/cpu_tester/TST_M6502_new() => assembly/glue/cpu_tester/TST_M6502
      return __liftInternref(exports.TST_M6502_new() >>> 0);
    },
    TST_M6502_set(obj, to) {
      // assembly/glue/cpu_tester/TST_M6502_set(assembly/glue/cpu_tester/TST_M6502, assembly/glue/cpu_tester/TST_M6502_IO) => void
      obj = __retain(__lowerInternref(obj) || __notnull());
      to = __lowerRecord45(to) || __notnull();
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
    TST_Z80_get(obj) {
      // assembly/glue/cpu_tester/TST_Z80_get(assembly/glue/cpu_tester/TST_Z80) => assembly/glue/cpu_tester/TST_Z80_IO
      obj = __lowerInternref(obj) || __notnull();
      return __liftRecord48(exports.TST_Z80_get(obj) >>> 0);
    },
    TST_Z80_new() {
      // assembly/glue/cpu_tester/TST_Z80_new() => assembly/glue/cpu_tester/TST_Z80
      return __liftInternref(exports.TST_Z80_new() >>> 0);
    },
    TST_Z80_set(obj, to) {
      // assembly/glue/cpu_tester/TST_Z80_set(assembly/glue/cpu_tester/TST_Z80, assembly/glue/cpu_tester/TST_Z80_IO) => void
      obj = __retain(__lowerInternref(obj) || __notnull());
      to = __lowerRecord48(to) || __notnull();
      try {
        exports.TST_Z80_set(obj, to);
      } finally {
        __release(obj);
      }
    },
    TST_Z80_cycle(obj) {
      // assembly/glue/cpu_tester/TST_Z80_cycle(assembly/glue/cpu_tester/TST_Z80) => void
      obj = __lowerInternref(obj) || __notnull();
      exports.TST_Z80_cycle(obj);
    },
    gp_load_ROM_from_RAM(player, name, sz) {
      // assembly/glue/global_player/gp_load_ROM_from_RAM(assembly/glue/global_player/global_player_t, ~lib/string/String, u32) => void
      player = __retain(__lowerInternref(player) || __notnull());
      name = __lowerString(name) || __notnull();
      try {
        exports.gp_load_ROM_from_RAM(player, name, sz);
      } finally {
        __release(player);
      }
    },
    gp_load_BIOS(player, size) {
      // assembly/glue/global_player/gp_load_BIOS(assembly/glue/global_player/global_player_t, u32) => void
      player = __lowerInternref(player) || __notnull();
      exports.gp_load_BIOS(player, size);
    },
    gp_run_frame(player) {
      // assembly/glue/global_player/gp_run_frame(assembly/glue/global_player/global_player_t) => u32
      player = __lowerInternref(player) || __notnull();
      return exports.gp_run_frame(player) >>> 0;
    },
    gp_dump_debug(player) {
      // assembly/glue/global_player/gp_dump_debug(assembly/glue/global_player/global_player_t) => ~lib/array/Array<~lib/string/String>
      player = __lowerInternref(player) || __notnull();
      return __liftArray(pointer => __liftString(new Uint32Array(memory.buffer)[pointer >>> 2]), 2, exports.gp_dump_debug(player) >>> 0);
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
    gp_ui_event(player, dest, what, val_bool) {
      // assembly/glue/global_player/gp_ui_event(assembly/glue/global_player/global_player_t, u32, ~lib/string/String, bool) => void
      player = __retain(__lowerInternref(player) || __notnull());
      what = __lowerString(what) || __notnull();
      val_bool = val_bool ? 1 : 0;
      try {
        exports.gp_ui_event(player, dest, what, val_bool);
      } finally {
        __release(player);
      }
    },
    gp_step_master(player, howmany) {
      // assembly/glue/global_player/gp_step_master(assembly/glue/global_player/global_player_t, i32) => void
      player = __lowerInternref(player) || __notnull();
      exports.gp_step_master(player, howmany);
    },
    new_global_player() {
      // assembly/glue/global_player/new_global_player() => assembly/glue/global_player/global_player_t
      return __liftInternref(exports.new_global_player() >>> 0);
    },
    gp_get_specs(player) {
      // assembly/glue/global_player/gp_get_specs(assembly/glue/global_player/global_player_t) => assembly/system/interface/machine_description
      player = __lowerInternref(player) || __notnull();
      return __liftRecord52(exports.gp_get_specs(player) >>> 0);
    },
    gp_get_input_buffer(player) {
      // assembly/glue/global_player/gp_get_input_buffer(assembly/glue/global_player/global_player_t) => usize
      player = __lowerInternref(player) || __notnull();
      return exports.gp_get_input_buffer(player) >>> 0;
    },
    gp_get_framevars(player) {
      // assembly/glue/global_player/gp_get_framevars(assembly/glue/global_player/global_player_t) => assembly/glue/global_player/framevars_t
      player = __lowerInternref(player) || __notnull();
      return __liftRecord80(exports.gp_get_framevars(player) >>> 0);
    },
    gp_play(player) {
      // assembly/glue/global_player/gp_play(assembly/glue/global_player/global_player_t) => void
      player = __lowerInternref(player) || __notnull();
      exports.gp_play(player);
    },
    gp_pause(player) {
      // assembly/glue/global_player/gp_pause(assembly/glue/global_player/global_player_t) => void
      player = __lowerInternref(player) || __notnull();
      exports.gp_pause(player);
    },
    gp_stop(player) {
      // assembly/glue/global_player/gp_stop(assembly/glue/global_player/global_player_t) => void
      player = __lowerInternref(player) || __notnull();
      exports.gp_stop(player);
    },
    gp_get_mt(player) {
      // assembly/glue/global_player/gp_get_mt(assembly/glue/global_player/global_player_t) => assembly/system/interface/console_mt_struct
      player = __lowerInternref(player) || __notnull();
      return __liftRecord175(exports.gp_get_mt(player) >>> 0);
    },
  }, exports);
  function __liftRecord45(pointer) {
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
  function __lowerRecord45(value) {
    // assembly/glue/cpu_tester/TST_M6502_IO
    // Hint: Opt-out from lowering as a record by providing an empty constructor
    if (value == null) return 0;
    const pointer = exports.__pin(exports.__new(48, 45));
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
  function __liftRecord48(pointer) {
    // assembly/glue/cpu_tester/TST_Z80_IO
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      A: new Uint32Array(memory.buffer)[pointer + 0 >>> 2],
      B: new Uint32Array(memory.buffer)[pointer + 4 >>> 2],
      C: new Uint32Array(memory.buffer)[pointer + 8 >>> 2],
      D: new Uint32Array(memory.buffer)[pointer + 12 >>> 2],
      E: new Uint32Array(memory.buffer)[pointer + 16 >>> 2],
      H: new Uint32Array(memory.buffer)[pointer + 20 >>> 2],
      L: new Uint32Array(memory.buffer)[pointer + 24 >>> 2],
      F: new Uint32Array(memory.buffer)[pointer + 28 >>> 2],
      I: new Uint32Array(memory.buffer)[pointer + 32 >>> 2],
      R: new Uint32Array(memory.buffer)[pointer + 36 >>> 2],
      AF_: new Uint32Array(memory.buffer)[pointer + 40 >>> 2],
      BC_: new Uint32Array(memory.buffer)[pointer + 44 >>> 2],
      DE_: new Uint32Array(memory.buffer)[pointer + 48 >>> 2],
      HL_: new Uint32Array(memory.buffer)[pointer + 52 >>> 2],
      PC: new Uint32Array(memory.buffer)[pointer + 56 >>> 2],
      SP: new Uint32Array(memory.buffer)[pointer + 60 >>> 2],
      IX: new Uint32Array(memory.buffer)[pointer + 64 >>> 2],
      IY: new Uint32Array(memory.buffer)[pointer + 68 >>> 2],
      WZ: new Uint32Array(memory.buffer)[pointer + 72 >>> 2],
      EI: new Uint32Array(memory.buffer)[pointer + 76 >>> 2],
      P: new Uint32Array(memory.buffer)[pointer + 80 >>> 2],
      Q: new Uint32Array(memory.buffer)[pointer + 84 >>> 2],
      IR: new Uint32Array(memory.buffer)[pointer + 88 >>> 2],
      IFF1: new Uint32Array(memory.buffer)[pointer + 92 >>> 2],
      IFF2: new Uint32Array(memory.buffer)[pointer + 96 >>> 2],
      IM: new Uint32Array(memory.buffer)[pointer + 100 >>> 2],
      pins_D: new Uint32Array(memory.buffer)[pointer + 104 >>> 2],
      pins_Addr: new Uint32Array(memory.buffer)[pointer + 108 >>> 2],
      pins_RD: new Uint32Array(memory.buffer)[pointer + 112 >>> 2],
      pins_WR: new Uint32Array(memory.buffer)[pointer + 116 >>> 2],
      pins_IO: new Uint32Array(memory.buffer)[pointer + 120 >>> 2],
      pins_MRQ: new Uint32Array(memory.buffer)[pointer + 124 >>> 2],
      prefix: new Uint32Array(memory.buffer)[pointer + 128 >>> 2],
      rprefix: new Uint32Array(memory.buffer)[pointer + 132 >>> 2],
      TCU: new Int32Array(memory.buffer)[pointer + 136 >>> 2],
    };
  }
  function __lowerRecord48(value) {
    // assembly/glue/cpu_tester/TST_Z80_IO
    // Hint: Opt-out from lowering as a record by providing an empty constructor
    if (value == null) return 0;
    const pointer = exports.__pin(exports.__new(140, 48));
    new Uint32Array(memory.buffer)[pointer + 0 >>> 2] = value.A;
    new Uint32Array(memory.buffer)[pointer + 4 >>> 2] = value.B;
    new Uint32Array(memory.buffer)[pointer + 8 >>> 2] = value.C;
    new Uint32Array(memory.buffer)[pointer + 12 >>> 2] = value.D;
    new Uint32Array(memory.buffer)[pointer + 16 >>> 2] = value.E;
    new Uint32Array(memory.buffer)[pointer + 20 >>> 2] = value.H;
    new Uint32Array(memory.buffer)[pointer + 24 >>> 2] = value.L;
    new Uint32Array(memory.buffer)[pointer + 28 >>> 2] = value.F;
    new Uint32Array(memory.buffer)[pointer + 32 >>> 2] = value.I;
    new Uint32Array(memory.buffer)[pointer + 36 >>> 2] = value.R;
    new Uint32Array(memory.buffer)[pointer + 40 >>> 2] = value.AF_;
    new Uint32Array(memory.buffer)[pointer + 44 >>> 2] = value.BC_;
    new Uint32Array(memory.buffer)[pointer + 48 >>> 2] = value.DE_;
    new Uint32Array(memory.buffer)[pointer + 52 >>> 2] = value.HL_;
    new Uint32Array(memory.buffer)[pointer + 56 >>> 2] = value.PC;
    new Uint32Array(memory.buffer)[pointer + 60 >>> 2] = value.SP;
    new Uint32Array(memory.buffer)[pointer + 64 >>> 2] = value.IX;
    new Uint32Array(memory.buffer)[pointer + 68 >>> 2] = value.IY;
    new Uint32Array(memory.buffer)[pointer + 72 >>> 2] = value.WZ;
    new Uint32Array(memory.buffer)[pointer + 76 >>> 2] = value.EI;
    new Uint32Array(memory.buffer)[pointer + 80 >>> 2] = value.P;
    new Uint32Array(memory.buffer)[pointer + 84 >>> 2] = value.Q;
    new Uint32Array(memory.buffer)[pointer + 88 >>> 2] = value.IR;
    new Uint32Array(memory.buffer)[pointer + 92 >>> 2] = value.IFF1;
    new Uint32Array(memory.buffer)[pointer + 96 >>> 2] = value.IFF2;
    new Uint32Array(memory.buffer)[pointer + 100 >>> 2] = value.IM;
    new Uint32Array(memory.buffer)[pointer + 104 >>> 2] = value.pins_D;
    new Uint32Array(memory.buffer)[pointer + 108 >>> 2] = value.pins_Addr;
    new Uint32Array(memory.buffer)[pointer + 112 >>> 2] = value.pins_RD;
    new Uint32Array(memory.buffer)[pointer + 116 >>> 2] = value.pins_WR;
    new Uint32Array(memory.buffer)[pointer + 120 >>> 2] = value.pins_IO;
    new Uint32Array(memory.buffer)[pointer + 124 >>> 2] = value.pins_MRQ;
    new Uint32Array(memory.buffer)[pointer + 128 >>> 2] = value.prefix;
    new Uint32Array(memory.buffer)[pointer + 132 >>> 2] = value.rprefix;
    new Int32Array(memory.buffer)[pointer + 136 >>> 2] = value.TCU;
    exports.__unpin(pointer);
    return pointer;
  }
  function __liftRecord53(pointer) {
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
  function __liftRecord6(pointer) {
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
  function __liftRecord52(pointer) {
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
      overscan: __liftRecord53(new Uint32Array(memory.buffer)[pointer + 32 >>> 2]),
      out_ptr: new Uint32Array(memory.buffer)[pointer + 36 >>> 2],
      out_size: new Uint32Array(memory.buffer)[pointer + 40 >>> 2],
      keymap: __liftArray(pointer => __liftRecord6(new Uint32Array(memory.buffer)[pointer >>> 2]), 2, new Uint32Array(memory.buffer)[pointer + 44 >>> 2]),
    };
  }
  function __liftRecord81(pointer) {
    // assembly/helpers/debug/debugger_info_t
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      broke: new Uint8Array(memory.buffer)[pointer + 0 >>> 0] != 0,
      traces: __liftArray(pointer => __liftString(new Uint32Array(memory.buffer)[pointer >>> 2]), 2, new Uint32Array(memory.buffer)[pointer + 4 >>> 2]),
    };
  }
  function __liftRecord80(pointer) {
    // assembly/glue/global_player/framevars_t
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      master_frame: new BigUint64Array(memory.buffer)[pointer + 0 >>> 3],
      x: new Uint32Array(memory.buffer)[pointer + 8 >>> 2],
      scanline: new Uint32Array(memory.buffer)[pointer + 12 >>> 2],
      dbg_info: __liftRecord81(new Uint32Array(memory.buffer)[pointer + 16 >>> 2]),
      console: __liftString(new Uint32Array(memory.buffer)[pointer + 20 >>> 2]),
    };
  }
  function __liftRecord175(pointer) {
    // assembly/system/interface/console_mt_struct
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      vram_ptr: new Uint32Array(memory.buffer)[pointer + 0 >>> 2],
      gp0_ptr: new Uint32Array(memory.buffer)[pointer + 4 >>> 2],
      gp1_ptr: new Uint32Array(memory.buffer)[pointer + 8 >>> 2],
      mmio_ptr: new Uint32Array(memory.buffer)[pointer + 12 >>> 2],
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
