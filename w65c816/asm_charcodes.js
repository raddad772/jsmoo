const INIT_ASM = `
; HI!
.config
# 16 * 65536
ROM_SIZE $100000

.vectors
RESET EMU_START

.INNERLOOP:$0044
.OUTERLOOP:$0045
.FONTTMP:$0046

.EMU_START:$2020
; Let the compiler know it's emulated mode here
:E1
CLC
XCE

:NATIVE M1 X1
JMP >NATIVE_START

.HELLOWORLD:$02F005
DCB $48, $65, $6c, $6c, $6f, $2c, $20, $77, $6f, $72, $6c, $64, $21, $00

.PRINT_HELLOWORLD:$040900
SEP #$30
:E0 M1 X1
; $0020, $0021, $0022 to have a long-pointer to a null-terminated string.
LDA #$05
STA <$20
LDA #$F0
STA <$21
LDA #$02
STA <$22
JSL >RENDERSTR
LDA $AB
STP

.NATIVE_START:$040200
:E0 M1 X1
REP #$30
:E0 M0 X0
LDA #$ABCD  ; Should have done 16-bit load
STA !$2010   ; Should store 16 bits
LDA #0
LDA !$2010
STA >$010410
JMP PRINT_HELLOWORLD



; RENDERSTR expects...
; $010000-$01FFFF to be a 256x256 monochrome monitor with 1-byte pixels
; $0020, $0021, $0022 to have a long-pointer to a null-terminated string.
; $0023, $0024, $0025, $0026, $0027, $0028 to be free for usage.
; This will be mutated until the NULL is reached 
; X to have x text coord to start
; Y to have y text coord to start
.RENDERSTR:$030010
; Save flags we're going to restore before returning
PHA
PHB
PHP
SEP #$30
PHD
PHA

:M0 X0
; Multiply X by 8 and Y by 16! Bound them onto screen!
TXA
AND #$1F
CLC
ROL A
CLC
ROL A
CLC
ROL A
TAX

TYA
AND #$0F
CLC
ROL A
CLC
ROL A
CLC
ROL A
CLC
ROL A
TAY

; Start algorithm.
REP #$20 ; 8-bit memory read & write, high pointer of 2 pointers
:M1
; 23-$25 is the font character address
LDA #$02
STA <$25
; 26-$28 is the screen address
LDA #$01
STA <$28
STZ $26
STZ $27
STZ $23
STZ $24
STZ $30
STZ $31
STZ $32

.RENDERSTRLOOPSTART
; Now, fetch first character into A
CLC
LDA [$20] ; Read 24-bit address from $20, $21, $22 and get that into A
; Next, calculate address of bytes holding the scanlines for the character A
BNE RENDERSTRCONT
JMP RENDERSTRLOOPDONE
.RENDERSTRCONT
SBC #32    ; First char is 32
SEP #$20
:M0
CLC
ROL A
CLC
ROL A
CLC
ROL A
CLC
ROL A
STA <$26
; $26-$28 now holds address of first scanline of font
; Time to calcualte screen address. Y * 256 + X.
; X & Y hold current pixel address
TYA
XBA     ; Y * 256
STX <$30
CLC
ADC <$30 ; + X
STA <$23 ; $23-25 now holds the pixel address


; Now we must render 16 lines of 8 pixels! YAY!
; Y will hold the line counter
; X will hold the pixel counter
:M1 X1
SEP #$30
LDA #16
STA <OUTERLOOP
.RS_OUTER_START
; $23 is screen pixel address 
; $26 is font
SEP #$30
LDA #8
STA <INNERLOOP
LDA [$26]   ; Load font
STA <FONTTMP
.RS_INNER_START
SEP #$30
LDA <FONTTMP
CLC
ROL A       ; Rotate highest (leftmost) bit out to Carry
STA <FONTTMP     ; Store font back
LDA #0      ; Clear A
ROL A       ; Put carry bit into A now
STA [$23]   ; Write to screen pixel
; Now increase the 16-bit screen pixel address
REP #$30
LDA <$23
INC A
STA <$23

; Now, decrement inner loop counter $44
DEC <INNERLOOP
BNE RS_INNER_START  

; One last rotate
SEP #$30
LDA [$26]
CLC
ROL A
STA [$26]
REP #$30
; Increase pixel address by 240 for next row
LDA <$23
ADC #240
STA <$23

; Increase font address by 1 
INC $26
DEC <OUTERLOOP
BNE RS_OUTER_START

JMP RENDERSTRLOOPSTART

; Loop done! Restore everything and return long
.RENDERSTRLOOPDONE
PLY
PLX
PLA
PLD
PLP
PLB
PLA
RTL


; from https://courses.cs.washington.edu/courses/cse457/98a/tech/OpenGL/font.c
; our font will be placed in 16-character blocks 
; start at 32 for space
.FONT:$020000
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $18, $18, $00, $00, $18, $18, $18, $18, $18, $18, $18, $00, $00, $00 
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $36, $36, $36, $36, $00, $00, $00 
DCB $00, $00, $00, $66, $66, $ff, $66, $66, $ff, $66, $66, $00, $00, $00, $00, $00 
DCB $00, $00, $18, $7e, $ff, $1b, $1f, $7e, $f8, $d8, $ff, $7e, $18, $00, $00, $00 
DCB $00, $00, $0e, $1b, $db, $6e, $30, $18, $0c, $76, $db, $d8, $70, $00, $00, $00 
DCB $00, $00, $7f, $c6, $cf, $d8, $70, $70, $d8, $cc, $cc, $6c, $38, $00, $00, $00 
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $18, $1c, $0c, $0e, $00, $00, $00 
DCB $00, $00, $0c, $18, $30, $30, $30, $30, $30, $30, $30, $18, $0c, $00, $00, $00 
DCB $00, $00, $30, $18, $0c, $0c, $0c, $0c, $0c, $0c, $0c, $18, $30, $00, $00, $00 
DCB $00, $00, $00, $00, $99, $5a, $3c, $ff, $3c, $5a, $99, $00, $00, $00, $00, $00 
DCB $00, $00, $00, $18, $18, $18, $ff, $ff, $18, $18, $18, $00, $00, $00, $00, $00 
DCB $00, $00, $30, $18, $1c, $1c, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $00, $00, $00, $00, $ff, $ff, $00, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $00, $38, $38, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $60, $60, $30, $30, $18, $18, $0c, $0c, $06, $06, $03, $03, $00, $00, $00 
DCB $00, $00, $3c, $66, $c3, $e3, $f3, $db, $cf, $c7, $c3, $66, $3c, $00, $00, $00 
DCB $00, $00, $7e, $18, $18, $18, $18, $18, $18, $18, $78, $38, $18, $00, $00, $00 
DCB $00, $00, $ff, $c0, $c0, $60, $30, $18, $0c, $06, $03, $e7, $7e, $00, $00, $00 
DCB $00, $00, $7e, $e7, $03, $03, $07, $7e, $07, $03, $03, $e7, $7e, $00, $00, $00 
DCB $00, $00, $0c, $0c, $0c, $0c, $0c, $ff, $cc, $6c, $3c, $1c, $0c, $00, $00, $00 
DCB $00, $00, $7e, $e7, $03, $03, $07, $fe, $c0, $c0, $c0, $c0, $ff, $00, $00, $00 
DCB $00, $00, $7e, $e7, $c3, $c3, $c7, $fe, $c0, $c0, $c0, $e7, $7e, $00, $00, $00 
DCB $00, $00, $30, $30, $30, $30, $18, $0c, $06, $03, $03, $03, $ff, $00, $00, $00 
DCB $00, $00, $7e, $e7, $c3, $c3, $e7, $7e, $e7, $c3, $c3, $e7, $7e, $00, $00, $00 
DCB $00, $00, $7e, $e7, $03, $03, $03, $7f, $e7, $c3, $c3, $e7, $7e, $00, $00, $00 
DCB $00, $00, $00, $38, $38, $00, $00, $38, $38, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $30, $18, $1c, $1c, $00, $00, $1c, $1c, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $06, $0c, $18, $30, $60, $c0, $60, $30, $18, $0c, $06, $00, $00, $00 
DCB $00, $00, $00, $00, $ff, $ff, $00, $ff, $ff, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $60, $30, $18, $0c, $06, $03, $06, $0c, $18, $30, $60, $00, $00, $00 
DCB $00, $00, $18, $00, $00, $18, $18, $0c, $06, $03, $c3, $c3, $7e, $00, $00, $00 
DCB $00, $00, $3f, $60, $cf, $db, $d3, $dd, $c3, $7e, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $c3, $c3, $c3, $c3, $ff, $c3, $c3, $c3, $66, $3c, $18, $00, $00, $00 
DCB $00, $00, $fe, $c7, $c3, $c3, $c7, $fe, $c7, $c3, $c3, $c7, $fe, $00, $00, $00 
DCB $00, $00, $7e, $e7, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $e7, $7e, $00, $00, $00 
DCB $00, $00, $fc, $ce, $c7, $c3, $c3, $c3, $c3, $c3, $c7, $ce, $fc, $00, $00, $00 
DCB $00, $00, $ff, $c0, $c0, $c0, $c0, $fc, $c0, $c0, $c0, $c0, $ff, $00, $00, $00 
DCB $00, $00, $c0, $c0, $c0, $c0, $c0, $c0, $fc, $c0, $c0, $c0, $ff, $00, $00, $00 
DCB $00, $00, $7e, $e7, $c3, $c3, $cf, $c0, $c0, $c0, $c0, $e7, $7e, $00, $00, $00 
DCB $00, $00, $c3, $c3, $c3, $c3, $c3, $ff, $c3, $c3, $c3, $c3, $c3, $00, $00, $00 
DCB $00, $00, $7e, $18, $18, $18, $18, $18, $18, $18, $18, $18, $7e, $00, $00, $00 
DCB $00, $00, $7c, $ee, $c6, $06, $06, $06, $06, $06, $06, $06, $06, $00, $00, $00 
DCB $00, $00, $c3, $c6, $cc, $d8, $f0, $e0, $f0, $d8, $cc, $c6, $c3, $00, $00, $00 
DCB $00, $00, $ff, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $c0, $00, $00, $00 
DCB $00, $00, $c3, $c3, $c3, $c3, $c3, $c3, $db, $ff, $ff, $e7, $c3, $00, $00, $00 
DCB $00, $00, $c7, $c7, $cf, $cf, $df, $db, $fb, $f3, $f3, $e3, $e3, $00, $00, $00 
DCB $00, $00, $7e, $e7, $c3, $c3, $c3, $c3, $c3, $c3, $c3, $e7, $7e, $00, $00, $00 
DCB $00, $00, $c0, $c0, $c0, $c0, $c0, $fe, $c7, $c3, $c3, $c7, $fe, $00, $00, $00 
DCB $00, $00, $3f, $6e, $df, $db, $c3, $c3, $c3, $c3, $c3, $66, $3c, $00, $00, $00 
DCB $00, $00, $c3, $c6, $cc, $d8, $f0, $fe, $c7, $c3, $c3, $c7, $fe, $00, $00, $00 
DCB $00, $00, $7e, $e7, $03, $03, $07, $7e, $e0, $c0, $c0, $e7, $7e, $00, $00, $00 
DCB $00, $00, $18, $18, $18, $18, $18, $18, $18, $18, $18, $18, $ff, $00, $00, $00 
DCB $00, $00, $7e, $e7, $c3, $c3, $c3, $c3, $c3, $c3, $c3, $c3, $c3, $00, $00, $00 
DCB $00, $00, $18, $3c, $3c, $66, $66, $c3, $c3, $c3, $c3, $c3, $c3, $00, $00, $00 
DCB $00, $00, $c3, $e7, $ff, $ff, $db, $db, $c3, $c3, $c3, $c3, $c3, $00, $00, $00 
DCB $00, $00, $c3, $66, $66, $3c, $3c, $18, $3c, $3c, $66, $66, $c3, $00, $00, $00 
DCB $00, $00, $18, $18, $18, $18, $18, $18, $3c, $3c, $66, $66, $c3, $00, $00, $00 
DCB $00, $00, $ff, $c0, $c0, $60, $30, $7e, $0c, $06, $03, $03, $ff, $00, $00, $00 
DCB $00, $00, $3c, $30, $30, $30, $30, $30, $30, $30, $30, $30, $3c, $00, $00, $00 
DCB $00, $03, $03, $06, $06, $0c, $0c, $18, $18, $30, $30, $60, $60, $00, $00, $00 
DCB $00, $00, $3c, $0c, $0c, $0c, $0c, $0c, $0c, $0c, $0c, $0c, $3c, $00, $00, $00 
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $c3, $66, $3c, $18, $00, $00, $00 
DCB $ff, $ff, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $00, $00, $00, $00, $00, $00, $00, $18, $38, $30, $70, $00, $00, $00 
DCB $00, $00, $7f, $c3, $c3, $7f, $03, $c3, $7e, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $fe, $c3, $c3, $c3, $c3, $fe, $c0, $c0, $c0, $c0, $c0, $00, $00, $00 
DCB $00, $00, $7e, $c3, $c0, $c0, $c0, $c3, $7e, $00, $00, $00, $00, $00, $00, $00 
DCB $00, $00, $7f, $c3, $c3, $c3, $c3, $7f, $03, $03, $03, $03, $03, $00, $00, $00 
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