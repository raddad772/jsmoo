"use strict";


/**
 *
 */

/*
the general idea
is that the 65536-entry opcode table
will be translated toa  65536-entry addr, opcode table

so

addrInstruction8(regs, pins, ALU) {
    do_stuff;
    ALU(x);
    do_stuff;
}

addrInstruction16(regs, pins, ALU) {
}


that kinda thing.

now these functions, they can come in different sizes.
8, 16, or 32-bits. byte, word, longword.

I'll use B,W,LW or 8,16,32 to refer to them?

AND8, AND16, AND32 vs ANDB, ANDW, ANDLW

OK yeah 8/16/32

JavaScript doesn't have templating or specialization. so...

furthermore, each function needs a small library of sub-functions, like
read<size>
write<size>

and the ALU become like
AND<Size>

they also need things like
Another thing is, for instance, AND EA, DR where from mode is certain things
is 4 cycles
vs 2 cycles for normal
they also need to know what their size is, like a parameter

they should therefore
probably
still be switch statements
but structured differently.

the TCU # should be tracked by the generator


so functions need differnet classes of arguments:
they need template-arguments, used at generation time,
and regular arguments, at run-time


effectively we're creating a basic template system to generate a bunch
of specializations, based on template arguments, and argument types.

great

then once all those functions are generated, the m68000 opcode bindiings
need to be traversed to match up

name: template: argument types

In order to bind the opcode table to the instructions,
instructions will only be allowed a Size template parameter, and EA or DR arguments

so like

template<u32 Size> auto M68000::instructionADD(EffectiveAddress from, DataRegister with) -> void {
  if constexpr(Size == Long) {
    if(from.mode == DataRegisterDirect || from.mode == AddressRegisterDirect || from.mode == Immediate) {
      idle(4);
    } else {
      idle(2);
    }
  }
  auto source = read<Size>(from);
  auto target = read<Size>(with);
  auto result = ADD<Size>(source, target);
  prefetch();
  write<Size>(with, result);
}

to generate a function body for this, the code will need to know its size,
and have access to the arguments and their types.


 */


/*
    Usually I use a 1-pass system,
 */


class M68KTS_func {
    constructor(Size, arg1, arg2, name) {
        this.Size = 0;
        this.arg1_type = arg1.kind;
        this.arg2_type = arg2.kind;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.name = name;
    }
}

// Step 1 input
// Size B,W,L
// first class function
/*<Size: B, W, L>AND(from: DR, mwith: EA) {
    if (Size === M68KT.L) {
            if ((from.mode === M68K_AM.DataRegisterDirect) || (from.mode === M68K_AM.AddressRegisterDirect || (from.mode === M68K_AM.Immediate)) {
                idle(4);
            }
            else {
                idle(2);
            }
    }
    regs.source = read<Size>(from);
    regs.target = read<Size>(mwith);
    regs.result = ADD<Size>(regs.source, regs.target);
    prefetch();
    write<Size>(mwith, result);
}

<Size: B, W, L>AND(from: EA, mwith: DR) {
  regs.source = read<Size>(from);
  regs.target = read<Size, Hold>(mwith);
  regs.result = ADD<Size>(regs.source, regs.target);
  prefetch();
  write<Size>(mwith, result);
}

// Second-class function
<Size: B, W, L>AND(source, target)
{
    u32
    result = target & source;

    r.c = 0;
    r.v = 0;
    r.z = clip<Size>(result) == 0;
    r.n = sign<Size>(result) < 0;

    return clip<Size>(result);
}



// Third-class function
clip_B(what) {
    return what + ' & 0xFF';
}

clip_W(what) {
    return what + ' & 0xFFFF';
}

// Intermediate
case M68K_MN.ADD_B_DR_EA: return function(Targs, from, mwith) {
        if (Targs.Size === 32) {
            if ((from.mode === M68K_AM.DataRegisterDirect) || (from.mode === M68K_AM.AddressRegisterDirect || (from.mode === M68K_AM.Immediate)) {
                idle(4);
            }
            else {
                idle(2);
            }
        }
        regs.source = read_B(from);
        regs.target = read_B(mwith);
        regs.result = ADD_B_DR_EA(regs.source, regs.target);
        prefetch();
        write<B>(mwith, result);
    }
})

// Output
let M68KI_T = Object.freeze({
    [M68K_MN.ADD_B_DR_EA]: function (regs, pins) {
        switch (regs.TCU) {
            case 0: // do read<B> step 1
                break;
            case 1: // do read<B> step 2
                break;
        }
    }
}
*/




/*const M68K_arg_types = Object.freeze({
    EffectiveAddress: 0,
    DataRegister: 1,
    number: 2
});

const M68K_TS_Size = Object.freeze({
    // This refers to the size of the attempting object
    Byte: 0,
    Word: 1,
    LongWord: 2,

    // These named things can be 0 or 1 basically
    Reverse: 1,
    Extend: 1,
    Hold: 1,
    Fast: 1
})

const M68K_TS_
*/