Very quick overview of SM83 per-instruction tests

This set of tests works by M-state instead of T-state. I may produce a T-state one in the future, but if your emulator uses T-states you can still use this.

Each legal opcode (00-FF and CB 00 - CB FF) has a .json file. Each .json file represents an instruction sequence. Each one contains 1000 tests in this format:

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
    "ime": 0,
    "ei": 0,
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
    "pc": 16827,
    "sp": 9383,
    "ime": 0,
    "ei": 0,
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
      "---"
    ],
    [
      16826,
      null,
      "r-m"
    ],
    [
      15426,
      10,
      "---"
    ],
    [
      15426,
      null,
      "---"
    ],
    [
      24525,
      null,
      "---"
    ],
    [
      24525,
      null,
      "r-m"
    ],
    [
      24525,
      174,
      "---"
    ]
  ]
}
```

Where "name" denotes human-readable name for discussion,

"Initial" is a structure describing the initial registers and ram configuration. Please ignore the ie and IME registers for now.

The "ram" section holds the contents of RAM.

The "final" structure holds all the same info as "initial," but after the instruction has finished running.

Finally, "cycles" contains a list of processor bus states, sampled BETWEEN M-STATES.
We have this:

[24525, 174, "r-m" ]

This means the Address pins are set to 24525, the Data pins set to 174, and READ and MEMORY REQUEST pins are set (r and m). There is also w for write.

If you are using T-states, this probably happened during some number of the 4 cycles an M-state represents.

A null value for the address or data pins refers to when the bus is electrically disconnected from the processor internals, so the value doesn't matter. For convenience, we often just use the last address generated.

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
            compare our R/W/MRQ/Address/Data pins against the current cycle;
      
    compare final RAM state to test and report any errors;
    compare final processor state to test and report any errors;
```

The middle cycle section can be simplified if your emulator is not cycle-by-cycle or you do not want to worry about bus states being the same as the tests.

These tests assume 64K of flat RAM, no registers or memory mapping.  

Thanks and please open an issue for any errors! These tests were created by translating Ares' SM83 core, but they're probably not perfect. I'd like them to be, though.

With that said, my emulator passes these tests, and also passes all of Blarg's CPU instruction tests, as well as running games fine. 