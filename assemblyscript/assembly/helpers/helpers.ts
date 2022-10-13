// For relative addressing
export function mksigned8(what: u32): i32 {
     return what >= 0x80 ? -(0x100 - what) : what;
}

export function mksigned13(what: u32): i32 {
    return what >= 0x1000 ? -(0x2000 - what) : what;
}

export function mksigned16(what: u32): i32 {
     return what >= 0x8000 ? -(0x10000 - what) : what;
}

export function hex2(val: u32): String {
    let outstr: String = val.toString(16);
    if (outstr.length == 1) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

export function hex4(val: u32): String {
    let outstr = val.toString(16);
    while(outstr.length < 4) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

export function hex6(val: u32): String {
    let outstr = val.toString(16);
    while(outstr.length < 6) outstr = '0' + outstr;
    return outstr.toUpperCase();
}

export function hex0x2(val: u32): String {
    return '0x' + hex2(val);
}

export function hex0x4(val: u32): String {
    return '0x' + hex4(val);
}

export function hex0x6(val: u32): String {
    return '0x' + hex6(val);
}
