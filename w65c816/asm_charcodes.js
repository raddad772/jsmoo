const INIT_ASM = `
; HI!
.config
# 16 * 65536
ROM_SIZE $100000

.vectors
RESET EMU_START

.STRPTR:$20
.FONTPTR:$23
.SCRPTR:$26
.TMPVAR:$30
.INNERLOOP:$44
.OUTERLOOP:$46

.EMU_START:$2020
; Let the compiler know it's emulated mode here
:E1
CLC
XCE

:NATIVE M1 X1
JMP >NATIVE_START

.HELLOWORLD:$02F000
;DCB $48, $65, $6c, $6c, $6f, $2c, $20, $77, $6f, $72, $6c, $64, $21, $00
;ASC "This is so exciting!"
ASC "Hello, world!"

.PRINT_HELLOWORLD:$040900
SEP #$30
:E0 M1 X1
; $0020, $0021, $0022 to have a long-pointer to a null-terminated string.
LDA #$00
STA <$20
LDA #$F0
STA <$21
LDA #$02
STA <$22
REP #$30
; X and Y to have X and Y coords on screen
LDX #1
LDY #5
JSL >RENDERSTR
LDA <$AB
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
PHD

REP #$30
:M0 X0
; Multiply X by 8 and Y by 16! Bound them onto screen!
TXA
ASL A
ASL A
ASL A
AND #$FF
TAX

TYA
ASL A
ASL A
ASL A
ASL A
AND #$FF
TAY

; Start algorithm.
SEP #$20 ; 8-bit memory read & write, high pointer of 2 pointers

; 23-$25 is the font character address
LDA #$01
PHA ; Push A to stack...
PLB ; So that we can update DBR with it

LDA #$02
STA <$25
;STA <$28
;TCD
STZ $26
STZ $27
STZ $23
STZ $24

; Our actual loop starts here
.RENDERSTRLOOPSTART
; Now, fetch first character into A
SEP #$20
LDA [STRPTR] ; Read from string pointer
BEQ RENDERSTRLOOPDONE
.RENDERSTRCONT
SEC
SBC #$20    ; First char is 32
REP #$20    ; 16-bit M/A
; Add 1, multiply by 16, subtract 4. This is because they are stored in reversed order, and the top 3 rows are
;  always blank.
:M0
INC A
ASL A
ASL A
ASL A
ASL A
SEC
SBC #4
STA <FONTPTR
; Time to calculate screen address. Y * 256 + X.
; X & Y hold current pixel address
TYA              ; Y->A
XBA              ; * 256
CLC
STX <TMPVAR      ; X->TMPVAR
ADC <TMPVAR      ; Y*256+X
STA <SCRPTR      ; Set our screen pointer to that

; Now we must render 13 lines of 8 pixels! YAY!
LDA #13
STA <OUTERLOOP   ; Outer loop will be 13 long
.RS_OUTER_START  ; Outer loop starts here
LDA #8
STA <INNERLOOP   ; Inner loop will be 8 long
LDA [<FONTPTR]   ; Load this row of pixels
BEQ CLRLINE 
STA <TMPVAR      ; Store in our temporary variable
.RS_INNER_START
SEP #$20         ; 8-bit A/M mode
ASL <TMPVAR
LDA #0           ; Clear A
ROL A            ; Put carry bit into A now
STA (<SCRPTR)    ; Write to screen pixel
; Now increase the 16-bit screen pixel address
REP #$20         ; 16-bit A/M mode
INC <SCRPTR

; Now, decrement inner loop counter
DEC <INNERLOOP
BNE RS_INNER_START  

.INNERLOOPSKIP
; So now we're on the next row. 
; Increase pixel address by 248 to get to next row
LDA <SCRPTR
CLC
ADC #248
STA <SCRPTR

; Decrease font address by 1, because remember it's stored in backwards order for some reason 
DEC <FONTPTR
DEC <OUTERLOOP
BNE RS_OUTER_START

REP #$20
INC <STRPTR
; Increase screen X coord
TXA
ADC #10
TAX
SEP #$20
JMP RENDERSTRLOOPSTART

.CLRLINE
REP #$20
PHX
LDX <SCRPTR
STA !0,x
STA !2,x
STA !4,x
STA !6,x
TXA
ADC #8
STA <SCRPTR
PLX
BRA INNERLOOPSKIP

;.CLRLINE
;REP #$20         ; 16-bit memory read/write
;LDA #0
;STA (<SCRPTR)    ; Write to screen pixel
;INC <SCRPTR
;INC <SCRPTR
;STA (<SCRPTR)    ; Write to screen pixel
;INC <SCRPTR
;INC <SCRPTR
;STA (<SCRPTR)    ; Write to screen pixel
;INC <SCRPTR
;INC <SCRPTR
;STA (<SCRPTR)    ; Write to screen pixel
;INC <SCRPTR
;INC <SCRPTR
;BRA INNERLOOPSKIP


; Loop done! Restore everything and return long
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