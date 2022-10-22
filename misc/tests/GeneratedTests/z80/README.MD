Very quick overview

Each .json file represents an instruction sequence. Each one contains 1000 tests in this format:

```json
{
  "name": "0A 0000",
  "initial": {
    "pc": 16826,
    "sp": 9383,
    "a": 64,
    "b": 95,
    "c": 205,
    "d": 147,
    "e": 168,
    "f": 79,
    "h": 98,
    "l": 251,
    "i": 60,
    "r": 66,
    "ei": 0,
    "wz": 56058,
    "ix": 14528,
    "iy": 18788,
    "af_": 48718,
    "bc_": 45204,
    "de_": 42805,
    "hl_": 59464,
    "im": 0,
    "p": 1,
    "q": 0,
    "iff1": 1,
    "iff2": 1,
    "ram": [
      [
        16826,
        10
      ],
      [
        24525,
        174
      ]
    ]
  },
  "final": {
    "a": 174,
    "b": 95,
    "c": 205,
    "d": 147,
    "e": 168,
    "f": 79,
    "h": 98,
    "l": 251,
    "i": 60,
    "r": 67,
    "af_": 48718,
    "bc_": 45204,
    "de_": 42805,
    "hl_": 59464,
    "ix": 14528,
    "iy": 18788,
    "pc": 16827,
    "sp": 9383,
    "wz": 24526,
    "iff1": 1,
    "iff2": 1,
    "im": 0,
    "ei": 0,
    "p": 0,
    "q": 0,
    "ram": [
      [
        16826,
        10
      ],
      [
        24525,
        174
      ]
    ]
  },
  "cycles": [
    [
      16826,
      null,
      "----"
    ],
    [
      16826,
      null,
      "r-m-"
    ],
    [
      15426,
      10,
      "----"
    ],
    [
      15426,
      null,
      "----"
    ],
    [
      24525,
      null,
      "----"
    ],
    [
      24525,
      null,
      "r-m-"
    ],
    [
      24525,
      174,
      "----"
    ]
  ]
}
```

Where "name" denotes human-readable name for discussion,

"Initial" is a structure describing the initial registers and ram configuration.

Of special note, the "wz" register may not be familiar; it's an internal register to the Z80.

Q is used to track if flags were modified for X/Y flag behavior in 2 instructions.

P tracks if "ld a,i" or "ld a,r" were executed last.

The "ram" section holds the contents of RAM.

Moving on, the "final" structure holds all the same info, but after the instruction has finished running.

Finally, "cycles" contains a list of processor bus states, sampled BETWEEN CYCLES.
We have this:

[24525, 174, "r-m-" ]

This means the Address pins are set to 24525, the Data pins set to 174, and READ and MEMORY REQUEST pins are set (r and m). There are also w for write and i for I/O REQUEST.

A null value for the address or data pins refers to when the bus is electrically disconnected from the processor internals, so the value doesn't matter. For convenience, we just use the last address generated, but this is a configurable option too.

IMPORTANT: here are the configurable options and their default values:

(unchecked) CMOS variant

(checked) Use simplified memory access T-states. With this ON, MRQ/RD and MRQ/WR will only pulse for 1 T-state, whereas the docs have them pulse for 2. This simplifies emulator development and speeds up execution at no cost to accuracy.

(checked) Put REFRESH values on address pins during opcode fetch

(unchecked) Put "null" during wait state. On a real Z80, during "internal operations," the address pins are electrically disconnected from the processor. They may hold either the last value, or junk. If this is checked, we will use the last value; otherwise, we will use "null" to show that the address is unimportant.

---

To use these tests, it depends a lot on if you want to check cycle-by-cycle or just before and after. The general pseudocode is:

```
load test .json;
for test in test.json:
    set initial processor state from test;
    set initial RAM state from test;
    
    for cycle in test:
        cycle processor
        if we are checking cycle-by-cycle:
            compare our R/W/MRQ/IO/Address/Data pins against the current cycle;
      
    compare final RAM state to test and report any errors;
    compare final processor state to test and report any errors;
```

The middle cycle section can be simplified if your emulator is not cycle-by-cycle or you do not want to worry about bus states being the same as the tests.

Thanks and please open an issue for any errors! These tests were created by translating Ares' Z80 core, then fixing up some bugs (which I made Issues for on Ares). But they're probably not perfect. I'd like them to be, though.
