class ADDRESS_MODES_t {
	constructor() {
		this.A = 0;                     // a        absolute
        this.ACCUM = 1;                 // A        accumulator
        this.A_INDEXED_X = 2;           // a,x      absolute indexed X
        this.A_INDEXED_Y = 3;           // a,y      absolute indexed Y
        this.AL = 4;                    // al       absolute long
        this.AL_INDEXED_X = 5;          // al,x     absolute long indexed
        this.A_IND = 6;                 // (a)      absolute indirect
        this.A_INDEXED_IND = 7;         // (a,x)    absolute indexed indirect
        this.D = 8;                     // d        direct
        this.STACK_R = 9;               // r        stack-relative
        this.D_INDEXED_X = 10;          // d,x      direct indexed X
        this.D_INDEXED_Y = 11;          // d,y      direct indexed Y
        this.D_IND = 12;                // (d)      direct indirect
        this.D_IND_L = 13;              // [d]      direct indirect long
        this.STACK_R_IND_INDEXED = 14;  // (d,s),y  stack-relative indirect indexed
        this.D_INDEXED_IND = 15;        // (d,x)    direct indexed indirect
        this.D_IND_INDEXED = 16;        // (d),y    direct indirect indexed
        this.D_IND_L_INDEXED = 17;      // [d],y    direct indirect long indexed
        this.I = 18;                    // i        implied
        this.PC_R = 19;                 // r        PC Relative
        this.PC_RL = 20;                // rl       PC Relative long
        this.STACK = 21;                // s        Stack
        this.XYC = 22;                  // xyc      block move
        this.IMM = 23;                  // #        immediate
	}
}
const ADDR_MODES = Object.freeze(new ADDRESS_MODES_t());

const opcode_AM_PN = new Map([
    [ADDR_MODES.A, 'a'],
    [ADDR_MODES.ACCUM, 'A'],
    [ADDR_MODES.A_INDEXED_X, 'a,x'],
    [ADDR_MODES.A_INDEXED_Y, 'a,y'],
    [ADDR_MODES.AL, 'al'],
    [ADDR_MODES.AL_INDEXED_X, 'al,x'],
    [ADDR_MODES.A_IND, '(a)'],
    [ADDR_MODES.A_INDEXED_IND, '(a,x)'],
    [ADDR_MODES.D, 'd'],
    [ADDR_MODES.STACK_R, 'd,s'],
    [ADDR_MODES.D_INDEXED_X, 'd,x'],
    [ADDR_MODES.D_INDEXED_Y, 'd,y'],
    [ADDR_MODES.D_IND, '(d)'],
    [ADDR_MODES.D_IND_L, '[d]'],
    [ADDR_MODES.STACK_R_IND_INDEXED, '(d,s),y'],
    [ADDR_MODES.D_INDEXED_IND, '(d,x)'],
    [ADDR_MODES.D_IND_INDEXED, '(d),y'],
    [ADDR_MODES.D_IND_L_INDEXED, '[d],y'],
    [ADDR_MODES.I, 'i'],
    [ADDR_MODES.PC_R, 'r'],
    [ADDR_MODES.PC_RL, 'rl'],
    [ADDR_MODES.STACK, 's'],
    [ADDR_MODES.XYC, 'xyc'],
    [ADDR_MODES.IMM, '#']
]);

// This addressing matrix is made by hand. The "non-reverse" one is generated with a function below
const opcode_AM_R = new Map([
    [ADDR_MODES.A, new Set([0x0C, 0x0D, 0x0E, 0x1C, 0x20, 0x2C, 0x2D, 0x2E, 0x4C, 0x4D, 0x4E, 0x6D, 0x6E, 0x8C, 0x8D, 0x8E, 0x9C, 0xAC, 0xAD, 0xAE, 0xCC, 0xCD, 0xCE, 0xEC, 0xED, 0xEE])],
    [ADDR_MODES.ACCUM, new Set([0x0A, 0x1A, 0x2A, 0x3A, 0x4A, 0x6A])],
    [ADDR_MODES.A_INDEXED_X, new Set([0x1D, 0x1E, 0x3C, 0x3D, 0x3E, 0x5D, 0x5E, 0x7D, 0x7E, 0x9D, 0x9E, 0xBC, 0xBD, 0xDD, 0xDE, 0xFD, 0xFE])],
    [ADDR_MODES.A_INDEXED_Y, new Set([0x19, 0x39, 0x59, 0x79, 0x99, 0xB9, 0xBE, 0xD9, 0xF9])],
    [ADDR_MODES.AL, new Set([0x0F, 0x22, 0x2F, 0x4F, 0x5C, 0x6F, 0x8F, 0xAF, 0xCF, 0xEF])],
    [ADDR_MODES.AL_INDEXED_X, new Set([0x1F, 0x3F, 0x5F, 0x7F, 0x9F, 0xBF, 0xDF, 0xFF])],
    [ADDR_MODES.A_IND, new Set([0x6C, 0xDC])],
    [ADDR_MODES.A_INDEXED_IND, new Set([0x7C, 0xFC])],
    [ADDR_MODES.D, new Set([0x04, 0x05, 0x06, 0x14, 0x24, 0x25, 0x26, 0x45, 0x46, 0x64, 0x65, 0x66, 0x84, 0x85, 0x86, 0xA4, 0xA5, 0xA6, 0xC4, 0xC5, 0xC6, 0xE4, 0xE5, 0xE6])],
    [ADDR_MODES.STACK_R, new Set([0x03, 0x23, 0x43, 0x63, 0x83, 0xA3, 0xC3, 0xE3])],
    [ADDR_MODES.D_INDEXED_X, new Set([0x15, 0x16, 0x34, 0x35, 0x36, 0x55, 0x56, 0x74, 0x75, 0x76, 0x94, 0x95, 0xB4, 0xB5, 0xD5, 0xD6, 0xF5, 0xF6])],
    [ADDR_MODES.D_INDEXED_Y, new Set([0x96, 0xB6])],
    [ADDR_MODES.D_IND, new Set([0x12, 0x32, 0x52, 0x72, 0x92, 0xB2, 0xD2, 0xF2])],
    [ADDR_MODES.D_IND_L, new Set([0x07, 0x27, 0x47, 0x67, 0x87, 0xA7, 0xC7, 0xE7])],
    [ADDR_MODES.STACK_R_IND_INDEXED, new Set([0x13, 0x33, 0x53, 0x73, 0x93, 0xB3, 0xD3, 0xF3])],
    [ADDR_MODES.D_INDEXED_IND, new Set([0x01, 0x21, 0x41, 0x61, 0x81, 0xA1, 0xC1, 0xE1])],
    [ADDR_MODES.D_IND_INDEXED, new Set([0x11, 0x31, 0x51, 0x71, 0x91, 0xB1, 0xD1, 0xF1])],
    [ADDR_MODES.D_IND_L_INDEXED, new Set([0x17, 0x37, 0x57, 0x77, 0x97, 0xB7, 0xD7, 0xF7])],
    [ADDR_MODES.I, new Set([0x18, 0x1B, 0x38, 0x3B, 0x42, 0x58, 0x5B, 0x78, 0x7B, 0x88, 0x8A, 0x98, 0x9A, 0x9B, 0xA8, 0xAA, 0xB8, 0xBA, 0xBB, 0xC8, 0xCA, 0xCB, 0xD8, 0xDB, 0xE8, 0xEA, 0xEB, 0xF8, 0xFB])],
    [ADDR_MODES.PC_R, new Set([0x10, 0x30, 0x50, 0x70, 0x80, 0x90, 0xB0, 0xD0, 0xF0])],
    [ADDR_MODES.PC_RL, new Set([0x82])],
    [ADDR_MODES.STACK, new Set([0x00, 0x02, 0x08, 0x0B, 0x28, 0x2B, 0x40, 0x48, 0x4B, 0x5A, 0x60, 0x62, 0x68, 0x6B, 0x7A, 0x8B, 0xAB, 0xD4, 0xDA, 0xF4, 0xFA])],
    [ADDR_MODES.XYC, new Set([0x44, 0x54])],
    [ADDR_MODES.IMM, new Set([0x09, 0x29, 0x49, 0x69, 0x89, 0xA0, 0xA2, 0xA9, 0xC0, 0xC2, 0xC9, 0xE0, 0xE2, 0xE9])]
]);

