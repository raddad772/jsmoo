"use strict";

/*****************************************************************************/
/*
 * NTSC/CRT - integer-only NTSC video signal encoding / decoding emulation
 *
 *   by EMMIR 2018-2023
 *
 *   YouTube: https://www.youtube.com/@EMMIR_KC/videos
 *   Discord: https://discord.com/invite/hdYctSmyQJ
 * ported to JS by RadDad772
 */
/*****************************************************************************/
/* crt.h
 *
 * An interface to convert a digital image to an analog NTSC signal
 * and decode the NTSC signal back into a digital image.
 * Can easily be integrated into real-time applications
 * or be used as a command-line tool.
 *
 */

/* SAMPLE RATE: 14.31818 MHz.
 * Which, divided by 4, gives us 3.579545 MHz for the chroma carrier
 */

/* do bloom emulation (side effect: makes screen have black borders) */
const CRT_DO_BLOOM  =  1>>>0
const CRT_DO_VSYNC  =  1>>>0  /* look for VSYNC */
const CRT_DO_HSYNC  =  1>>>0  /* look for HSYNC */

const CRT_CB_FREQ   =  4>>>0 /* carrier frequency relative to sample rate */
const CRT_HRES      = Math.floor(2275 * CRT_CB_FREQ / 10)>>>0 /* horizontal resolution */
const CRT_VRES      = 262>>>0                       /* vertical resolution */
const CRT_INPUT_SIZE = (CRT_HRES * CRT_VRES)>>>0

const CRT_TOP       =  21>>>0     /* first line with active video */
const CRT_BOT       =  261>>>0    /* final line with active video */
const CRT_LINES     = (CRT_BOT - CRT_TOP)>>>0 /* number of active video lines */

class ntsc_NTSC_SETTINGS {
    constructor() {
        this.rgb = null; // 32-bit RGB packed
        this.w = this.h = 0>>>0; // width and height
        this.as_color = 1; // 0 = mono 1 = color
        this.field = 0>>>0; // 0 = even 1 = odd
    }
}

class ntsc_CRT {
    constructor() {
        this.analog = new Int8Array(CRT_INPUT_SIZE);
        this.inp = new Int8Array(CRT_INPUT_SIZE);
        this.hsync = this.vsync = this.brightness = this.contrast = this.saturation = 0>>>0;
        this.black_point = this.white_point = this.outw = this.outh = 0>>>0;
        this.out = null;

        this.iirY = new IIRLP();
        this.iirI = new IIRLP();
        this.iirQ = new IIRLP();
        this.eqY = new ntsc_EQF();
        this.eqI = new ntsc_EQF();
        this.eqQ = new ntsc_EQF();
    }

    /* Initializes the class. Sets up filters.
     *   w   - width of the output image
     *   h   - height of the output image
     *   out - pointer to output image data 32-bit RGB packed as 0xXXRRGGBB
     */
    init(w, h, out) {
        for (let i = 0; i < CRT_INPUT_SIZE; i++) {
            this.analog[i] = this.inp[i] = 0;
        }
        this.resize(w, h, out);
        this.reset();
        /* kilohertz to line sample conversion */
        function kHz2L(kHz) {return (CRT_HRES * (kHz * 100) / L_FREQ)>>>0 }

        /* band gains are pre-scaled as 16-bit fixed point
         * if you change the EQ_P define, you'll need to update these gains too
         */
        this.eqY.init(kHz2L(1500), kHz2L(3000), CRT_HRES, 65536, 8192, 9175);
        this.eqI.init(kHz2L(80),   kHz2L(1150), CRT_HRES, 65536, 65536, 1311);
        this.eqQ.init(kHz2L(80),   kHz2L(1000), CRT_HRES, 65536, 65536, 0);

        this.iirY.init(L_FREQ, Y_FREQ);
        this.iirI.init(L_FREQ, I_FREQ);
        this.iirQ.init(L_FREQ, Q_FREQ);
    }

    /* Updates the output image parameters
     *   w   - width of the output image
     *   h   - height of the output image
     *   out - pointer to output image data 32-bit RGB packed as 0xXXRRGGBB
     */
    resize(w, h, out) {
        this.outw = w;
        this.outh = h;
        this.out = out;
    }

    // Revert settings to defaults
    reset() {
        this.saturation = 18;
        this.brightness = 0;
        this.contrast = 179;
        this.black_point = 0;
        this.white_point = 100;
        this.hsync = 0;
        this.vsync = 0;
    }

    // Convert!
    /**
     * @param {ntsc_NTSC_SETTINGS} s
     */
    crt_2ntsc(s) {

        let cc = new Int32Array([0, 1, 0, -1]);
        let destw, desth;
        if (CRT_DO_BLOOM) {
            destw = (AV_LEN * 55500) >> 16;
            desth = (CRT_LINES * 63500) >> 16;
        }
        else {
            destw = AV_LEN;
            desth = (CRT_LINES * 64500) >> 16;
        }
        let x, y, xo, yo, n;
        x = y= xo = yo = n = 0 >>> 0;

        xo = AV_BEG  + 4 + (AV_LEN    - destw) / 2;
        yo = CRT_TOP + 4 + (CRT_LINES - desth) / 2;

        s.field &= 1;

        /* align signal */
        xo = (xo & ~3);
        let even = new Int32Array([ 46, 50, 96, 100 ]);
        let odd =  new Int32Array([ 4, 50, 96, 100 ]);

        for (n = 0; n < CRT_VRES; n++) {
            let t; /* time */
            //signed char *line = &this.analog[n * CRT_HRES];
            let lineoffset = n * CRT_HRES;

            t = LINE_BEG;

            if (n <= 3 || (n >= 7 && n <= 9)) {
                /* equalizing pulses - small blips of sync, mostly blank */
                while (t < (4   * CRT_HRES / 100)) this.analog[lineoffset + t++] = SYNC_LEVEL;
                while (t < (50  * CRT_HRES / 100)) this.analog[lineoffset + t++] = BLANK_LEVEL;
                while (t < (54  * CRT_HRES / 100)) this.analog[lineoffset + t++] = SYNC_LEVEL;
                while (t < (100 * CRT_HRES / 100)) this.analog[lineoffset + t++] = BLANK_LEVEL;
            } else if (n >= 4 && n <= 6) {
                let offs = even;
                if (s.field === 1) {
                    offs = odd;
                }
                /* vertical sync pulse - small blips of blank, mostly sync */
                while (t < (offs[0] * CRT_HRES / 100)) this.analog[lineoffset + t++] = SYNC_LEVEL;
                while (t < (offs[1] * CRT_HRES / 100)) this.analog[lineoffset + t++] = BLANK_LEVEL;
                while (t < (offs[2] * CRT_HRES / 100)) this.analog[lineoffset + t++] = SYNC_LEVEL;
                while (t < (offs[3] * CRT_HRES / 100)) this.analog[lineoffset + t++] = BLANK_LEVEL;
            } else {
                /* video line */
                while (t < SYNC_BEG) this.analog[lineoffset + t++] = BLANK_LEVEL; /* FP */
                while (t < BW_BEG)   this.analog[lineoffset + t++] = SYNC_LEVEL;  /* SYNC */
                while (t < AV_BEG)   this.analog[lineoffset + t++] = BLANK_LEVEL; /* BW + CB + BP */
                if (n < CRT_TOP) {
                    while (t < CRT_HRES) this.analog[lineoffset + t++] = BLANK_LEVEL;
                }
                if (s.as_color) {
                    /* CB_CYCLES of color burst at 3.579545 Mhz */
                    for (t = CB_BEG; t < CB_BEG + (CB_CYCLES * CRT_CB_FREQ); t++) {
                        this.analog[lineoffset + t] = BLANK_LEVEL + (cc[(t + 0) & 3] * BURST_LEVEL);
                    }
                }
            }
        }

        for (y = 0; y < desth; y++) {
            let field_offset;
            let syA, syB;

            field_offset = ((s.field * s.h + desth) / desth / 2) >>> 0;
            syA = ((y * s.h) / desth) >>> 0;
            syB = ((y * s.h + desth / 2) / desth) >>> 0;

            syA += field_offset;
            syB += field_offset;

            if (syA >= s.h) syA = s.h;
            if (syB >= s.h) syB = s.h;

            syA *= s.w;
            syB *= s.w;

            this.iirY.reset();
            this.iirI.reset();
            this.iirQ.reset();

            for (x = 0; x < destw; x++) {
                let fy, fi, fq;
                let pA, pB;
                let rA, gA, bA;
                let rB, gB, bB;
                let sx, ph;
                let ire; /* composite signal */

                sx = (x * s.w) / destw;
                pA = s.rgb[sx + syA];
                pB = s.rgb[sx + syB];
                rA = (pA >> 16) & 0xff;
                gA = (pA >>  8) & 0xff;
                bA = (pA >>  0) & 0xff;
                rB = (pB >> 16) & 0xff;
                gB = (pB >>  8) & 0xff;
                bB = (pB >>  0) & 0xff;

                /* RGB to YIQ blend with potential pixel below */
                fy = (19595 * rA + 38470 * gA +  7471 * bA
                    + 19595 * rB + 38470 * gB +  7471 * bB) >> 15;
                fi = (39059 * rA - 18022 * gA - 21103 * bA
                    + 39059 * rB - 18022 * gB - 21103 * bB) >> 15;
                fq = (13894 * rA - 34275 * gA + 20382 * bA
                    + 13894 * rB - 34275 * gB + 20382 * bB) >> 15;
                ph = CC_PHASE(y + yo);
                ire = BLACK_LEVEL + this.black_point;
                /* bandlimit Y,I,Q */
                fy = this.iirY.f(fy);
                fi = this.iirI.f(fi) * ph * cc[(x + 0) & 3];
                fq = this.iirQ.f(fq) * ph * cc[(x + 3) & 3];
                ire += (fy + fi + fq) * (WHITE_LEVEL * this.white_point / 100) >> 10;
                if (ire < 0)   ire = 0;
                if (ire > 110) ire = 110;

                this.analog[(x + xo) + (y + yo) * CRT_HRES] = ire;
            }
        }
    }

    /* Decodes the NTSC signal generated by crt_2ntsc()
     *   noise - the amount of noise added to the signal (0 - inf)
     */
    crt_draw(noise) {
        class AVS {
            constructor() {
                this.y = this.i = this.q = 0>>>0;
            }
        }
        let out = [];
        for (let i = 0; i < AV_LEN+1; i++)
            out[i] = new AVS();

        let yiqA = null;
        let yiqB = null;
        let yiqAo, yiqBo;
        let i, j, line, prev_e, max_e;
        let bright = this.brightness - (BLACK_LEVEL + this.black_point);
        let sig = null;
        let s = 0>>>0;
        let field, ratio;
        let ccref = new Int32Array(4); /* color carrier signal */
        ccref[0] = ccref[1] = ccref[2] = ccref[3] = 0;

        let rn = 194; /* 'random' noise */
        console.log('here1')
        for (i = 0; i < CRT_INPUT_SIZE; i++) {
            rn = (214019 * rn + 140327895);

            /* signal + noise */
            s = this.analog[i] + (((((rn >> 16) & 0xff) - 0x7f) * noise) >> 8);
            if (s >  127) { s =  127; }
            if (s < -127) { s = -127; }
            this.inp[i] = s;
        }

        /* Look for vertical sync.
         *
         * This is done by integrating the signal and
         * seeing if it exceeds a threshold. The threshold of
         * the vertical sync pulse is much higher because the
         * vsync pulse is a lot longer than the hsync pulse.
         * The signal needs to be integrated to lessen
         * the noise in the signal.
         */
        let found = false;
        console.log('here2')
        for (i = -VSYNC_WINDOW; i < VSYNC_WINDOW; i++) {
            line = POSMOD(this.vsync + i, CRT_VRES);
            sig = this.inp + line * CRT_HRES;
            s = 0;
            for (j = 0; j < CRT_HRES; j++) {
                s += sig[j];
                /* increase the multiplier to make the vsync
                 * more stable when there is a lot of noise
                 */
                if (s <= (100 * SYNC_LEVEL)) {
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        if (CRT_DO_VSYNC)
            this.vsync = line; /* vsync found (or gave up) at this line */
        else
            this.vsync = 0;
        /* if vsync signal was in second half of line, odd field */
        field = (j > (CRT_HRES / 2));
        if (CRT_DO_BLOOM) {
            max_e = (128 + (noise / 2)) * AV_LEN;
            prev_e = (16384 / 8);
        }
        /* ratio of output height to active video lines in the signal */
        ratio = (this.outh << 16) / CRT_LINES;
        ratio = (ratio + 32768) >> 16;

        field = (field * (ratio / 2));

        console.log('here3')
        for (line = CRT_TOP; line < CRT_BOT; line++) {
            let pos, ln;
            let scanL, scanR, dx, L, R, line_w;
            let cL = null;
            let cR = null;
            let wave = new Int32Array(4);
            let dci, dcq, xpos, ypos, beg, end, phasealign;

            beg = (line - CRT_TOP) * this.outh / CRT_LINES + field;
            end = (line - CRT_TOP + 1) * this.outh / CRT_LINES + field;

            if (beg >= this.outh) { continue; }
            if (end > this.outh) { end = this.outh; }

            /* Look for horizontal sync.
             * See comment above regarding vertical sync.
             */
            ln = (POSMOD(line + this.vsync, CRT_VRES)) * CRT_HRES;
            sig = this.inp + ln + this.hsync;
            s = 0;
            for (i = -HSYNC_WINDOW; i < HSYNC_WINDOW; i++) {
                s += sig[SYNC_BEG + i];
                if (s <= (4 * SYNC_LEVEL)) {
                    break;
                }
            }
            if (CRT_DO_HSYNC)
                this.hsync = POSMOD(i + this.hsync, CRT_HRES);
            else
                this.hsync = 0;
            
            sig = this.inp + ln + (this.hsync & ~3); /* burst @ 1/CB_FREQ sample rate */
            for (i = CB_BEG; i < CB_BEG + (CB_CYCLES * CRT_CB_FREQ); i++) {
                let p = (ccref[i & 3] * 127 / 128) >>> 0; /* fraction of the previous */
                let n = sig[i];                   /* mixed with the new sample */
                ccref[i & 3] = p + n;
            }

            xpos = POSMOD(AV_BEG + this.hsync, CRT_HRES);
            ypos = POSMOD(line + this.vsync, CRT_VRES);
            pos = xpos + ypos * CRT_HRES;
            phasealign = pos & 3;

            /* amplitude of carrier = saturation, phase difference = hue */
            dci = ccref[(phasealign + 1) & 3] - ccref[(phasealign + 3) & 3];
            dcq = ccref[(phasealign + 2) & 3] - ccref[(phasealign + 0) & 3];

            wave[0] = -dcq * this.saturation;
            wave[1] =  dci * this.saturation;
            wave[2] =  dcq * this.saturation;
            wave[3] = -dci * this.saturation;

            sig = this.inp + pos;
            if (CRT_DO_BLOOM) {
                s = 0;
                for (i = 0; i < AV_LEN; i++) {
                    s += sig[i]; /* sum up the scan line */
                }
                /* bloom emulation */
                prev_e = (prev_e * 123 / 128) + ((((max_e >> 1) - s) << 10) / max_e);
                line_w = (AV_LEN * 112 / 128) + (prev_e >> 9);

                dx = (line_w << 12) / this.outw;
                scanL = ((AV_LEN / 2) - (line_w >> 1) + 8) << 12;
                scanR = (AV_LEN - 1) << 12;

                L = (scanL >> 12);
                R = (scanR >> 12);
            }
            else {
                dx = ((AV_LEN - 1) << 12) / this.outw;
                scanL = 0;
                scanR = (AV_LEN - 1) << 12;
                L = 0;
                R = (AV_LEN - 1);
            }
            this.eqY.reset();
            this.eqI.reset();
            this.eqQ.reset();

            for (i = L; i < R; i++) {
                out[i].y = this.eqY.f(sig[i] + bright) << 4;
                out[i].i = this.eqI.f(sig[i] * wave[(i + 0) & 3] >> 9) >> 3;
                out[i].q = this.eqQ.f(sig[i] * wave[(i + 3) & 3] >> 9) >> 3;
            }

            cL = this.out;
            let cLO =  beg * this.outw;
            cR = cL + this.outw;

            console.log('here4')
            for (pos = scanL; pos < scanR && cL < cR; pos += dx) {
                let y, i, q;
                let r, g, b;
                let aa, bb;

                R = pos & 0xfff;
                L = 0xfff - R;
                s = pos >> 12;

                yiqA = this.out;
                yiqB = this.out;
                yiqAo = s;
                yiqBo = s + 1;

                /* interpolate between samples if needed */
                y = ((yiqA[yiqAo].y * L) >>  2) + ((yiqB[yiqBo].y * R) >>  2);
                i = ((yiqA[yiqAo].i * L) >> 14) + ((yiqB[yiqBo].i * R) >> 14);
                q = ((yiqA[yiqAo].q * L) >> 14) + ((yiqB[yiqBo].q * R) >> 14);

                /* YIQ to RGB */
                r = (((y + 3879 * i + 2556 * q) >> 12) * this.contrast) >> 8;
                g = (((y - 1126 * i - 2605 * q) >> 12) * this.contrast) >> 8;
                b = (((y - 4530 * i + 7021 * q) >> 12) * this.contrast) >> 8;

                if (r < 0) r = 0;
                if (g < 0) g = 0;
                if (b < 0) b = 0;
                if (r > 255) r = 255;
                if (g > 255) g = 255;
                if (b > 255) b = 255;

                aa = (r << 16 | g << 8 | b);
                bb = this.out[cLO]
                /* blend with previous color there */
                this.out[cLO] = (((aa & 0xfefeff) >> 1) + ((bb & 0xfefeff) >> 1));
                cLO++;
            }

            /* duplicate extra lines */
            /*ln = this.outw * 4;
            for (s = beg + 1; s < end; s++) {
                memcpy(this.out + s * this.outw, this.out + (s - 1) * this.outw, ln);
            }*/
        }

    }
}

/* crt.c
 *                      FULL HORIZONTAL LINE SIGNAL (~63500 ns)
 * |---------------------------------------------------------------------------|
 *   HBLANK (~10900 ns)                 ACTIVE VIDEO (~52600 ns)
 * |-------------------||------------------------------------------------------|
 *   
 *   
 *   WITHIN HBLANK PERIOD:
 *   
 *   FP (~1500 ns)  SYNC (~4700 ns)  BW (~600 ns)  CB (~2500 ns)  BP (~1600 ns)
 * |--------------||---------------||------------||-------------||-------------|
 *      BLANK            SYNC           BLANK          BLANK          BLANK
 * 
 */
const LINE_BEG     =    0>>>0
const FP_ns        =    1500>>>0      /* front porch */
const SYNC_ns      =    4700>>>0      /* sync tip */
const BW_ns        =    600>>>0       /* breezeway */
const CB_ns        =    2500>>>0      /* color burst */
const BP_ns        =    1600>>>0      /* back porch */
const AV_ns        =    52600>>>0     /* active video */
const HB_ns        =   (FP_ns + SYNC_ns + BW_ns + CB_ns + BP_ns)>>>0 /* h blank */
/* line duration should be ~63500 ns */
const LINE_ns      =   (FP_ns + SYNC_ns + BW_ns + CB_ns + BP_ns + AV_ns)>>>0

/* convert nanosecond offset to its corresponding point on the sampled line */
function ns2pos(ns)    { return Math.floor((ns) * CRT_HRES / LINE_ns) >>>0; }
/* starting points for all the different pulses */
const FP_BEG       =   ns2pos(0)
const SYNC_BEG     =   ns2pos(FP_ns)
const BW_BEG       =   ns2pos(FP_ns + SYNC_ns)
const CB_BEG       =   ns2pos(FP_ns + SYNC_ns + BW_ns)
const BP_BEG       =   ns2pos(FP_ns + SYNC_ns + BW_ns + CB_ns)
const AV_BEG       =   ns2pos(HB_ns)
const AV_LEN       =   ns2pos(AV_ns)

/* somewhere between 7 and 12 cycles */
const CB_CYCLES   = 10>>>0

/* frequencies for bandlimiting */
const L_FREQ      =     1431818>>>0 /* full line */
const Y_FREQ      =     420000>>>0  /* Luma   (Y) 4.2  MHz of the 14.31818 MHz */
const I_FREQ      =     150000>>>0  /* Chroma (I) 1.5  MHz of the 14.31818 MHz */
const Q_FREQ      =     55000>>>0   /* Chroma (Q) 0.55 MHz of the 14.31818 MHz */

/* IRE units (100 = 1.0V, -40 = 0.0V) */
const WHITE_LEVEL  =    100>>>0
const BURST_LEVEL  =    20>>>0
const BLACK_LEVEL  =    7>>>0
const BLANK_LEVEL  =    0>>>0
const SYNC_LEVEL   =   -40>>>0

/* 227.5 subcarrier cycles per line means every other line has reversed phase */
function CC_PHASE(ln)   { return (((ln) & 1) ? -1 : 1)>>>0 }
/* ensure negative values for x get properly modulo'd */
function POSMOD(x, n)   { return(((x) % (n) + (n)) % (n))>>>0 }

/*****************************************************************************/
/***************************** FIXED POINT MATH ******************************/
/*****************************************************************************/

const T14_2PI       =    16384>>>0
const T14_MASK      =    (T14_2PI - 1)>>>0
const T14_PI        =    (T14_2PI / 2)>>>0

const sigpsin15 = new Int32Array([ /* significant points on sine wave (15-bit) */
    0x0000,
    0x0c88,0x18f8,0x2528,0x30f8,0x3c50,0x4718,0x5130,0x5a80,
    0x62f0,0x6a68,0x70e0,0x7640,0x7a78,0x7d88,0x7f60,0x8000,
    0x7f60
]);

function sintabil8(n)
{
    let f, i, a, b;
    f = i = a = b = 0 >>>0;
    
    /* looks scary but if you don't change T14_2PI
     * it won't cause out of bounds memory reads
     */
    f = n >> 0 & 0xff;
    i = n >> 8 & 0xff;
    a = sigpsin15[i];
    b = sigpsin15[i + 1];
    return (a + ((b - a) * f >> 8));
}

class int_wrapper {
    constructor() {
        this.val = 0>>>0;
    }
}

/* 14-bit interpolated sine/cosine */
/**
 * @param {int_wrapper} s
 * @param {int_wrapper} c
 * @param {Number} n
 */
function sincos14(s, c, n)
{
    let h;
    
    n &= T14_MASK;
    h = n & ((T14_2PI >> 1) - 1);
    
    if (h > ((T14_2PI >> 2) - 1)) {
        c.val = -sintabil8(h - (T14_2PI >> 2));
        s.val = sintabil8((T14_2PI >> 1) - h);
    } else {
        c.val = sintabil8((T14_2PI >> 2) - h);
        s.val = sintabil8(h);
    }
    if (n > ((T14_2PI >> 1) - 1)) {
        c.val = -c.val;
        s.val = -s.val;
    }
}

const EXP_P      =   11>>>0
const EXP_ONE    =   (1 << EXP_P)>>>0
const EXP_MASK   =   (EXP_ONE - 1)>>>0
const EXP_PI     =   6434>>>0
function EXP_MUL(x, y) { return (((x) * (y)) >> EXP_P) }
function EXP_DIV(x, y) { return (((x) << EXP_P) / (y)) }

const e11 = new Int32Array([
    EXP_ONE,
    5567>>>0,  /* e   */
    15133>>>0, /* e^2 */
    41135>>>0, /* e^3 */
    111817>>>0 /* e^4 */

])

/* fixed point e^x */
function expx(n)
{
    let neg, idx, res, nxt, acc, del, i;
    neg = idx = res = nxt = acc = del = i = 0>>>0;

    if (n === 0) {
        return EXP_ONE;
    }
    neg = n < 0;
    if (neg) {
        n = -n;
    }
    idx = n >>> EXP_P;
    res = EXP_ONE;
    for (i = 0; i < idx / 4; i++) {
        res = EXP_MUL(res, e11[4]);
    }
    idx &= 3;
    if (idx > 0) {
        res = EXP_MUL(res, e11[idx]);
    }
    
    n &= EXP_MASK;
    nxt = EXP_ONE;
    acc = 0;
    del = 1;
    for (i = 1; i < 17; i++) {
        acc += nxt / del;
        nxt = EXP_MUL(nxt, n);
        del *= i;
        if (del > nxt || nxt <= 0 || del <= 0) {
            break;
        }
    }
    res = EXP_MUL(res, acc);

    if (neg) {
        res = EXP_DIV(EXP_ONE, res);
    }
    return res;
}

/*****************************************************************************/
/********************************* FILTERS ***********************************/
/*****************************************************************************/

const HISTLEN  =   3>>>0
const HISTOLD  =   (HISTLEN - 1)>>>0 /* oldest entry */
const HISTNEW  =   0>>>0             /* newest entry */

const EQ_P     =   16>>>0 /* if changed, the gains will need to be adjusted */
const EQ_R     =   (1 << (EQ_P - 1))>>>0 /* rounding */

/* three band equalizer */
class ntsc_EQF {
    constructor() {
        this.lf = this.hf = 0>>>0; // fractions
        this.g = new Int32Array(3); // gains
        this.fL = new Int32Array(4);
        this.fH = new Int32Array(4);
        this.h = new Int32Array(HISTLEN); // history
    }

    /* f_lo - low cutoff frequency
     * f_hi - high cutoff frequency
     * rate - sampling rate
     * g_lo, g_mid, g_hi - gains
     */
    init(f_lo, f_hi, rate, g_lo, g_mid, g_hi) {
        let sn, cs;
        sn = new int_wrapper();
        cs = new int_wrapper();

        this.lf = this.hf = 0>>>0;
        this.g[0] = this.g[1] = this.g[2] = 0;
        this.fL[0] = this.fL[1] = this.fL[2] = this.fL[3] = 0;
        this.fH[0] = this.fH[1] = this.fH[2] = this.fH[3] = 0;
        for (let i = 0; i < HISTLEN; i++)
            this.h[i] = 0;

        this.g[0] = g_lo;
        this.g[1] = g_mid;
        this.g[2] = g_hi;

        sincos14(sn, cs, (T14_PI * f_lo / rate) >>> 0);
        if (EQ_P >= 15)
            this.lf = (2 * (sn << (EQ_P - 15)))>>>0;
        else
            this.lf = (2 * (sn >> (15 - EQ_P)))>>>0;

        sincos14(sn, cs, (T14_PI * f_hi / rate) >>> 0);
        if (EQ_P >= 15)
            this.hf = (2 * (sn << (EQ_P - 15)))>>>0;
        else
            this.hf = (2 * (sn >> (15 - EQ_P)))>>>0;
    }

    reset() {
        this.fL[0] = this.fL[1] = this.fL[2] = this.fL[3] = 0;
        this.fH[0] = this.fH[1] = this.fH[2] = this.fH[3] = 0;
        for (let i = 0; i < 4; i++)
            this.h[i] = 0;
    }

    f(s) {
        let i=0>>>0;
        let r = new Int32Array(3);

        this.fL[0] += ((this.lf * (s - this.fL[0]) + EQ_R) >> EQ_P)>>>0;
        this.fH[0] += ((this.hf * (s - this.fH[0]) + EQ_R) >> EQ_P)>>>0;

        for (i = 1; i < 4; i++) {
            this.fL[i] += (this.lf * (this.fL[i - 1] - this.fL[i]) + EQ_R) >> EQ_P;
            this.fH[i] += (this.hf * (this.fH[i - 1] - this.fH[i]) + EQ_R) >> EQ_P;
        }

        r[0] = this.fL[3];
        r[1] = this.fH[3] - this.fL[3];
        r[2] = this.h[HISTOLD] - this.fH[3];

        for (i = 0; i < 3; i++) {
            r[i] = (r[i] * this.g[i]) >> EQ_P;
        }

        for (i = HISTOLD; i > 0; i--) {
            this.h[i] = this.h[i - 1];
        }
        this.h[HISTNEW] = s;

        return (r[0] + r[1] + r[2]);
    }
}

/* hi-pass for debugging */
const HIPASS = 0

/* infinite impulse response low pass filter for bandlimiting YIQ */
class IIRLP {
    constructor() {
        this.c = this.h = 0>>>0;
    }

    /* freq  - total bandwidth
     * limit - max frequency
     */
    init(freq, limit) {
        let rate = 0>>>0;
        this.c = this.h = 0>>>0;
        rate = ((freq << 9) / limit) >>> 0;
        this.c = EXP_ONE - expx((-((EXP_PI << 9) / rate)) >>> 0);
    }

    reset() {
        this.h = 0;
    }

    f(s) {
        this.h += EXP_MUL(s - this.h, this.c);
        if (HIPASS)
            return s - this.h;
        else
            return this.h;
    }
}



/* search windows, in samples */
const HSYNC_WINDOW = 8>>>0
const VSYNC_WINDOW = 8>>>0

