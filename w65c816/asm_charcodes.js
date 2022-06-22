
const INIT_ASM = `
.config
# 16 * 65536
ROM_SIZE $100000

; This section holds vectors for NMI, RESET, etc. if they are set
.vectors
RESET EMU_START

.EMU_START
CLC
XCE
:E0 M1 X1
REP #$FF
SEP #$9E
LDA #$E2FE
SBC #$A005

`
const INIT_ASM2 = `
; This section holds configuration data for the assembler
.config
# 16 * 65536
ROM_SIZE $100000

; This section holds vectors for NMI, RESET, etc. if they are set
.vectors
RESET EMU_START

; We define a few labels to use as convenient variable names later on.
; We put them in the zero-page to simplify addressing them.
.STRPTR:$20
.FONTPTR:$23
.SCRPTR:$26
.TMPVAR:$30
.INNERLOOP:$44
.OUTERLOOP:$46

.BTPTRL:$50
.BTVAR:$53

; Here's where we jump on reset, in emulation mode
.EMU_START:$2020
; Let the compiler know it's emulated mode here.
; A bit of note about program structure, we're testing some basic instructions and making it easy to debug
;  them, so we'll do a few pointless or silly things.
:E1
CLC   ; Clear C
XCE   ; eXchange C and E, which will put us in native mode

:NATIVE M1 X1     ; let assembler know we're now in native mode with M=1 X=1. It doesn't follow XCE correctly yet
JMP >BASIC_TEST   ;

.BASIC_TEST       ; *BASIC* test of LDA, STA, LDX, STX, LDY, STX, CMP, CPX, CPY, ADC, SBC, in a few addressing
                  ;   modes.
                  
.BASIC_TEST
:E0 M1 X1
REP #$30
LDA #$0053
STA !BTPRL




JMP >NATIVE_START ; This will be a long-jump with 24-bit destination in high bank, to test instructions



; Here is where we store our string
.HELLOWORLD:$02F000
ASC "Hello, world!"
; The ASC directive stores an ASCII string as a null-terminated string in memory at the current address.

; This function loads the correct pointers for the "Hello, world!" string and calls the print function
.PRINT_HELLOWORLD:$040900
SEP #$30     ; Set 8-bit M & X modes
:E0 M1 X1
; $0020, $0021, $0022 to have a long-pointer to a null-terminated string. We load in $02F000, the address
;  of our string.
LDA #$00
STA <$20
LDA #$F0
STA <$21
LDA #$02
STA <$22
REP #$30
; X and Y to have X and Y coords on screen
LDX #1          ; Column 1
LDY #5          ; Row 5
JSL >RENDERSTR  ; Call the renderstr function
STP

; This is where we jumped to earlier to test the long-jump instruction
.NATIVE_START:$040200
:E0 M1 X1     ; The assembler cannot reliably ascertain the mode after a jump, so we should usually tell it
REP #$30      ; Right before we go full 16-bit
LDA #$ABCD    ; Check a 16-bit absolute load works properly, manually
STA !$2010    ; Check a 16-bit absolute store works properly, manually 
LDA #0        ; Check a 16-bit immediate load works properly
LDA !$2010    ; Check that A is now $ABCD again
STA >$010410  ; Check a 16-bit absolute long store works properly, this will be visible on the screen as 2 pixels
JMP PRINT_HELLOWORLD ; Now go to our function that prints hello world


; RENDERSTR renders an ASCII string to screen.

; RENDERSTR expects...
; $010000-$01FFFF to be a 256x256 monochrome monitor with 1-byte pixels
; $0020, $0021, $0022 to have a long-pointer to a null-terminated string.
; $0023, $0024, $0025, $0026, $0027, $0028 to be free for usage.
; This adrress will be modified until the NULL is reached, so it won't be preserved. 
; X register has x text coord to start
; Y register has y text coord to start
.RENDERSTR:$030010
; Save registers we're going to restore before returning
PHA
PHB    ; Note this isn't push B, but push DBR
PHP    ; Easy way to restore previous processor status
PHD    ; Push D

REP #$30 ; Set 16-bit index and accumulator
; Multiply X by 8 and Y by 16! Then AND by 0xFF to make sure the coordinates are on screen!
TXA       ; X->A
ASL A     ; A << 1 (*2)
ASL A     ; A << 1 (*4)
ASL A     ; A << 1 (*8)
AND #$FF  ; AND 0xFF
TAX       ; A->X

TYA       ; Y->A
ASL A     ; A << 1 (*2)
ASL A     ; A << 1 (*4)
ASL A     ; A << 1 (*8)
ASL A     ; A << 1 (*16)
AND #$FF  ; AND 0xFF
TAY       ; A->Y

; Start algorithm.
SEP #$20 ; 8-bit memory read & write
LDA #$01
PHA ; Push A to stack...
PLB ; So that we can update DBR with it
    ; We want DBR to point to the region we will draw the screen in. This saves us a bunch of cycles
    ; in the inner loop.
    ; No you can't just directly transfer.

; At $23-$25 we will store our current pointer into the font data.
; This is located in data bank 2, so we set the MSB to 0x02
LDA #$02
STA <$25
; Zero out some more values just because
STZ $26
STZ $27
STZ $23
STZ $24

; Our actual loop starts here
.RENDERSTRLOOPSTART
; Now, fetch first character into A
SEP #$20                ; 8-bit memory read
LDA [STRPTR]            ; Read from string pointer
BNE RENDERSTRCONT       ; Continue execution if the charater we read is not NULL
JMP RENDERSTRLOOPDONE   ; Jump to loop done, if the character was NULL
.RENDERSTRCONT          ; Continuing execution here...
SEC         ; We always SET carry before a subtract, if we don't want an extra 1 removed
SBC #$20    ; First char of font is 32, so we subtract 32
REP #$20    ; 16-bit memory accesses
; Now we must add 1, multiply by 16, subtract 4.
; First, we add 1, because the fonts are stored in reverse row order. So to start drawing from
;  the top, we need to get to the character AFTER the one we want.
; Then we multiply by 16, because each character is 16 bytes long.
; Then we subtract 4. 1 is to get us to the correct character, and 3 is to skip 3 lines that are always blank. 
INC A        ; +1
ASL A        ; << 1 (*2)
ASL A        ; << 2 (*4)
ASL A        ; << 3 (*8)
ASL A        ; << 4 (*16)
SEC          ; Set Carry
SBC #4       ; Subtract 4
STA <FONTPTR ; Store in our FONT POINTER
; Time to calculate memory address of the screen coordinates. We do this by multiplying Y by 256 and adding X.
; X & Y hold current pixel address.
TYA              ; Y->A
XBA              ; This exchanges upper and lower bytes of A. Effectively * 256 if upper byte is clear.
STX <TMPVAR      ; X->TMPVAR
CLC              ; Clear carry before ADDC
ADC <TMPVAR      ; A+TMPVAR(X)
STA <SCRPTR      ; Set our screen pointer to that

; Now we must render 13 lines of 8 pixels! YAY!
; The upper 3 lines are never ever used, so why render the empty lines? 
LDA #13
STA <OUTERLOOP   ; Outer loop will be 13 long
.RS_OUTER_START  ; Outer loop starts here
SEP #$20         ; Make sure to set 8-bit memory access
LDA [<FONTPTR]   ; Load this row of pixels, stored as 1 bit per pixel
BEQ CLRLINE      ; If this row of pixels is empty, go to a specialized section that will draw it faster
STA <TMPVAR      ; Store the pixels in our temporary variable, we don't want to modify the font itself

; Render 8 pixels.
; I unrolled the loop for a few reasons. Not only does it save on branch-related cycles, but it allows me
;  to keep certain variables in the very small number of registers, which saves a lot more cycles, since I
;  no longer need those registers to process decrementing the loop counter.
; First a few preparations  
REP #$20      ; Set 16-bit memory mode
PHX           ; Store X for later
LDX <SCRPTR   ; Load screen pointer to X

; Now, the first iteration of the loop, which will be done 4 times total.
LDA #0        ; Clear A
ROR <TMPVAR   ; Rotate out rightmost pixel to the Carry flag
ROL A         ; Rotate it into A
XBA           ; Swap A & B, leaving the high byte with the pixel and the low byte empty
ROR <TMPVAR   ; Rorate out next rightmost pixel into carry flag
ROL A         ; Rotate into A. B + A is now two bytes representing two pixels. B is 0x02 if there's a pixel instead of 0x01 but that doesn't matter
STA !6,x      ; Store at positions 6&7 since we're going right to left. Use direct indexed by x addressing mode, to save cycles and keep us from doing unncessary arithmetic.

; Then repeat 3 more times for groups of 2 pixels
LDA #0
ROR <TMPVAR
ROL A
XBA
ROR <TMPVAR
ROL A
STA !4,x     ; Positions 4&5 now

LDA #0
ROR <TMPVAR
ROL A
XBA
ROR <TMPVAR
ROL A
STA !2,x     ; 2 & 3

LDA #0
ROR <TMPVAR
ROL A
XBA
ROR <TMPVAR
ROL A
STA !0,x    ; 0 & 1

TXA         ; Gotta do a little math on SCRPTR. Instead of recalculating the memory coordinates, just advance by
            ; 1 row.
ADC #256    ; Each row is 256 bytes
PLX         ; Restore X we saved before

.INNERLOOPSKIP
STA <SCRPTR ; Store our newly-calculated screen memory address. We do it here because the CLRLINE subfunction works that way.


DEC <FONTPTR       ; Decrease font address by 1, because remember it's stored in backwards order for some reason
DEC <OUTERLOOP     ; Decrease our outer loop counter
BNE RS_OUTER_START ; If we're not at zero, go back to loop start

; We've completed a character, time to do a few things...
REP #$20      ; Set 16-bit memory accesses
INC <STRPTR   ; Increment the pointer into the NULL-terminated string we're printing
; Increase screen X coord
TXA           ; X->A
; Note we skip a CLC here, because our last arithmetic operation, INC <STRPTR, will never set carry, unless we
;  have a 65,536-character-long string.
ADC #10       ; Font is 8 pixels wide, but fills up all 8, so we give 1 extra pixel on each side.
TAX           ; A->X
JMP RENDERSTRLOOPSTART

; This will write an empty line out a bit faster than the equivalent generic code
.CLRLINE
REP #$20
LDA #0
PHX
LDX <SCRPTR
STA !6,x
STA !4,x
STA !2,x
STA !0,x
TXA
ADC #256
PLX
BRA INNERLOOPSKIP ; BRA a little faster than JMP here

; We end up here when the print function is finished
.RENDERSTRLOOPDONE
REP #$30
PLD
PLP
PLB
PLA
RTL


; from https://courses.cs.washington.edu/courses/cse457/98a/tech/OpenGL/font.c
; our font will be placed in 16-character blocks 
; start at 32 for space
; note: this is stored in the exact opposite way you'd expect, right-to-left and bottom-to-top.
; you'd generally expect left-to-right and top-to-bottom. made the algorithm to draw a little more fun.
.FONT:$020000
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 
;!, $020010
DCB $00, $00, $18, $18, $00, $00, $18, $18, $18, $18, $18, $18, $18, $00, $00, $00 
;", $020020
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $36, $36, $36, $36, $00, $00, $00 
;#, $020030
DCB $00, $00, $00, $66, $66, $ff, $66, $66, $ff, $66, $66, $00, $00, $00, $00, $00 
;$, $020040
DCB $00, $00, $18, $7e, $ff, $1b, $1f, $7e, $f8, $d8, $ff, $7e, $18, $00, $00, $00 
;%, $020050
DCB $00, $00, $0e, $1b, $db, $6e, $30, $18, $0c, $76, $db, $d8, $70, $00, $00, $00 
;&, $020060
DCB $00, $00, $7f, $c6, $cf, $d8, $70, $70, $d8, $cc, $cc, $6c, $38, $00, $00, $00 
;', $020070
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $18, $1c, $0c, $0e, $00, $00, $00 
;(, $020080
DCB $00, $00, $0c, $18, $30, $30, $30, $30, $30, $30, $30, $18, $0c, $00, $00, $00 
;), $020090
DCB $00, $00, $30, $18, $0c, $0c, $0c, $0c, $0c, $0c, $0c, $18, $30, $00, $00, $00 
;*, $0200A0
DCB $00, $00, $00, $00, $99, $5a, $3c, $ff, $3c, $5a, $99, $00, $00, $00, $00, $00 
;+, $0200B0
DCB $00, $00, $00, $18, $18, $18, $ff, $ff, $18, $18, $18, $00, $00, $00, $00, $00 
;,, $0200C0
DCB $00, $00, $30, $18, $1c, $1c, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 
;-, $0200D0
DCB $00, $00, $00, $00, $00, $00, $ff, $ff, $00, $00, $00, $00, $00, $00, $00, $00 
;., $0200E0
DCB $00, $00, $00, $38, $38, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 
;/, $0200F0
DCB $00, $60, $60, $30, $30, $18, $18, $0c, $0c, $06, $06, $03, $03, $00, $00, $00 
;0, $020100
DCB $00, $00, $3c, $66, $c3, $e3, $f3, $db, $cf, $c7, $c3, $66, $3c, $00, $00, $00 
;1, $020110
DCB $00, $00, $7e, $18, $18, $18, $18, $18, $18, $18, $78, $38, $18, $00, $00, $00 
;2, $020120
DCB $00, $00, $ff, $c0, $c0, $60, $30, $18, $0c, $06, $03, $e7, $7e, $00, $00, $00 
;3, $020130
DCB $00, $00, $7e, $e7, $03, $03, $07, $7e, $07, $03, $03, $e7, $7e, $00, $00, $00 
;4, $020140
DCB $00, $00, $0c, $0c, $0c, $0c, $0c, $ff, $cc, $6c, $3c, $1c, $0c, $00, $00, $00 
;5, $020150
DCB $00, $00, $7e, $e7, $03, $03, $07, $fe, $c0, $c0, $c0, $c0, $ff, $00, $00, $00 
;6, $020160
DCB $00, $00, $7e, $e7, $c3, $c3, $c7, $fe, $c0, $c0, $c0, $e7, $7e, $00, $00, $00 
;7, $020170
DCB $00, $00, $30, $30, $30, $30, $18, $0c, $06, $03, $03, $03, $ff, $00, $00, $00 
;8, $020180
DCB $00, $00, $7e, $e7, $c3, $c3, $e7, $7e, $e7, $c3, $c3, $e7, $7e, $00, $00, $00 
;9, $020190
DCB $00, $00, $7e, $e7, $03, $03, $03, $7f, $e7, $c3, $c3, $e7, $7e, $00, $00, $00 
;:, $0201A0
DCB $00, $00, $00, $38, $38, $00, $00, $38, $38, $00, $00, $00, $00, $00, $00, $00 
;;, $0201B0
DCB $00, $00, $30, $18, $1c, $1c, $00, $00, $1c, $1c, $00, $00, $00, $00, $00, $00 
;<, $0201C0
DCB $00, $00, $06, $0c, $18, $30, $60, $c0, $60, $30, $18, $0c, $06, $00, $00, $00 
;=, $0201D0
DCB $00, $00, $00, $00, $ff, $ff, $00, $ff, $ff, $00, $00, $00, $00, $00, $00, $00 
;>, $0201E0
DCB $00, $00, $60, $30, $18, $0c, $06, $03, $06, $0c, $18, $30, $60, $00, $00, $00 
;?, $0201F0
DCB $00, $00, $18, $00, $00, $18, $18, $0c, $06, $03, $c3, $c3, $7e, $00, $00, $00 
;@, $020200
DCB $00, $00, $3f, $60, $cf, $db, $d3, $dd, $c3, $7e, $00, $00, $00, $00, $00, $00 
;A, $020210
DCB $00, $00, $c3, $c3, $c3, $c3, $ff, $c3, $c3, $c3, $66, $3c, $18, $00, $00, $00 
;B, $020220
DCB $00, $00, $fe, $c7, $c3, $c3, $c7, $fe, $c7, $c3, $c3, $c7, $fe, $00, $00, $00 
;C, $020230
DCB $00, $00, $7e, $e7, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $e7, $7e, $00, $00, $00 
;D, $020240
DCB $00, $00, $fc, $ce, $c7, $c3, $c3, $c3, $c3, $c3, $c7, $ce, $fc, $00, $00, $00 
;E, $020250
DCB $00, $00, $ff, $c0, $c0, $c0, $c0, $fc, $c0, $c0, $c0, $c0, $ff, $00, $00, $00 
;F, $020260
DCB $00, $00, $c0, $c0, $c0, $c0, $c0, $c0, $fc, $c0, $c0, $c0, $ff, $00, $00, $00 
;G, $020270
DCB $00, $00, $7e, $e7, $c3, $c3, $cf, $c0, $c0, $c0, $c0, $e7, $7e, $00, $00, $00 
;H, $020280
DCB $00, $00, $c3, $c3, $c3, $c3, $c3, $ff, $c3, $c3, $c3, $c3, $c3, $00, $00, $00 
;I, $020290
DCB $00, $00, $7e, $18, $18, $18, $18, $18, $18, $18, $18, $18, $7e, $00, $00, $00 
;J, $0202A0
DCB $00, $00, $7c, $ee, $c6, $06, $06, $06, $06, $06, $06, $06, $06, $00, $00, $00 
;K, $0202B0
DCB $00, $00, $c3, $c6, $cc, $d8, $f0, $e0, $f0, $d8, $cc, $c6, $c3, $00, $00, $00 
;L, $0202C0
DCB $00, $00, $ff, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $00, $00, $00 
;M, $0202D0
DCB $00, $00, $c3, $c3, $c3, $c3, $c3, $c3, $db, $ff, $ff, $e7, $c3, $00, $00, $00 
;N, $0202E0
DCB $00, $00, $c7, $c7, $cf, $cf, $df, $db, $fb, $f3, $f3, $e3, $e3, $00, $00, $00 
;O, $0202F0
DCB $00, $00, $7e, $e7, $c3, $c3, $c3, $c3, $c3, $c3, $c3, $e7, $7e, $00, $00, $00 
;P, $020300
DCB $00, $00, $c0, $c0, $c0, $c0, $c0, $fe, $c7, $c3, $c3, $c7, $fe, $00, $00, $00 
;Q, $020310
DCB $00, $00, $3f, $6e, $df, $db, $c3, $c3, $c3, $c3, $c3, $66, $3c, $00, $00, $00 
;R, $020320
DCB $00, $00, $c3, $c6, $cc, $d8, $f0, $fe, $c7, $c3, $c3, $c7, $fe, $00, $00, $00 
;S, $020330
DCB $00, $00, $7e, $e7, $03, $03, $07, $7e, $e0, $c0, $c0, $e7, $7e, $00, $00, $00 
;T, $020340
DCB $00, $00, $18, $18, $18, $18, $18, $18, $18, $18, $18, $18, $ff, $00, $00, $00 
;U, $020350
DCB $00, $00, $7e, $e7, $c3, $c3, $c3, $c3, $c3, $c3, $c3, $c3, $c3, $00, $00, $00 
;V, $020360
DCB $00, $00, $18, $3c, $3c, $66, $66, $c3, $c3, $c3, $c3, $c3, $c3, $00, $00, $00 
;W, $020370
DCB $00, $00, $c3, $e7, $ff, $ff, $db, $db, $c3, $c3, $c3, $c3, $c3, $00, $00, $00 
;X, $020380
DCB $00, $00, $c3, $66, $66, $3c, $3c, $18, $3c, $3c, $66, $66, $c3, $00, $00, $00 
;Y, $020390
DCB $00, $00, $18, $18, $18, $18, $18, $18, $3c, $3c, $66, $66, $c3, $00, $00, $00 
;Z, $0203A0
DCB $00, $00, $ff, $c0, $c0, $60, $30, $7e, $0c, $06, $03, $03, $ff, $00, $00, $00 
;[
DCB $00, $00, $3c, $30, $30, $30, $30, $30, $30, $30, $30, $30, $3c, $00, $00, $00 
;\\
DCB $00, $03, $03, $06, $06, $0c, $0c, $18, $18, $30, $30, $60, $60, $00, $00, $00 
;]
DCB $00, $00, $3c, $0c, $0c, $0c, $0c, $0c, $0c, $0c, $0c, $0c, $3c, $00, $00, $00 
;^
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $c3, $66, $3c, $18, $00, $00, $00 
;_
DCB $ff, $ff, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 
;\`
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $18, $38, $30, $70, $00, $00, $00 
;a
DCB $00, $00, $7f, $c3, $c3, $7f, $03, $c3, $7e, $00, $00, $00, $00, $00, $00, $00 
;b
DCB $00, $00, $fe, $c3, $c3, $c3, $c3, $fe, $c0, $c0, $c0, $c0, $c0, $00, $00, $00 
;c
DCB $00, $00, $7e, $c3, $c0, $c0, $c0, $c3, $7e, $00, $00, $00, $00, $00, $00, $00 
;d
DCB $00, $00, $7f, $c3, $c3, $c3, $c3, $7f, $03, $03, $03, $03, $03, $00, $00, $00 
;e
DCB $00, $00, $7f, $c0, $c0, $fe, $c3, $c3, $7e, $00, $00, $00, $00, $00, $00, $00
DCB $00, $00, $30, $30, $30, $30, $30, $fc, $30, $30, $30, $33, $1e, $00, $00, $00 
DCB $7e, $c3, $03, $03, $7f, $c3, $c3, $c3, $7e, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $c3, $c3, $c3, $c3, $c3, $c3, $fe, $c0, $c0, $c0, $c0, $00, $00, $00 
DCB $00, $00, $18, $18, $18, $18, $18, $18, $18, $00, $00, $18, $00, $00, $00, $00 
DCB $38, $6c, $0c, $0c, $0c, $0c, $0c, $0c, $0c, $00, $00, $0c, $00, $00, $00, $00 
DCB $00, $00, $c6, $cc, $f8, $f0, $d8, $cc, $c6, $c0, $c0, $c0, $c0, $00, $00, $00 
DCB $00, $00, $7e, $18, $18, $18, $18, $18, $18, $18, $18, $18, $78, $00, $00, $00 
DCB $00, $00, $db, $db, $db, $db, $db, $db, $fe, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $c6, $c6, $c6, $c6, $c6, $c6, $fc, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $7c, $c6, $c6, $c6, $c6, $c6, $7c, $00, $00, $00, $00, $00, $00, $00 
DCB $c0, $c0, $c0, $fe, $c3, $c3, $c3, $c3, $fe, $00, $00, $00, $00, $00, $00, $00 
DCB $03, $03, $03, $7f, $c3, $c3, $c3, $c3, $7f, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $c0, $c0, $c0, $c0, $c0, $e0, $fe, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $fe, $03, $03, $7e, $c0, $c0, $7f, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $1c, $36, $30, $30, $30, $30, $fc, $30, $30, $30, $00, $00, $00, $00 
DCB $00, $00, $7e, $c6, $c6, $c6, $c6, $c6, $c6, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $18, $3c, $3c, $66, $66, $c3, $c3, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $c3, $e7, $ff, $db, $c3, $c3, $c3, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $c3, $66, $3c, $18, $3c, $66, $c3, $00, $00, $00, $00, $00, $00, $00 
DCB $c0, $60, $60, $30, $18, $3c, $66, $66, $c3, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $ff, $60, $30, $18, $0c, $06, $ff, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $0f, $18, $18, $18, $38, $f0, $38, $18, $18, $18, $0f, $00, $00, $00 
DCB $18, $18, $18, $18, $18, $18, $18, $18, $18, $18, $18, $18, $18, $00, $00, $00 
DCB $00, $00, $f0, $18, $18, $18, $1c, $0f, $1c, $18, $18, $18, $f0, $00, $00, $00 
DCB $00, $00, $00, $00, $00, $00, $06, $8f, $f1, $60, $00, $00, $00, $00, $00, $00 




`