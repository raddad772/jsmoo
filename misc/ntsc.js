//https://forums.nesdev.org/viewtopic.php?f=2&t=14338
/**
 * NTSC_DecodeLine(Width, Signal, Target, Phase0)
 *
 * Convert NES NTSC graphics signal into RGB using integer arithmetics only.
 *
 * Width: Number of NTSC signal samples.
 *        For a 256 pixels wide screen, this would be 256*8. 283*8 if you include borders.
 *
 * Signal: An array of Width samples.
 *         The following sample values are recognized:
 *          -29 = Luma 0 low   32 = Luma 0 high (-38 and  6 when attenuated)
 *          -15 = Luma 1 low   66 = Luma 1 high (-28 and 31 when attenuated)
 *           22 = Luma 2 low  105 = Luma 2 high ( -1 and 58 when attenuated)
 *           71 = Luma 3 low  105 = Luma 3 high ( 34 and 58 when attenuated)
 *         In this scale, sync signal would be -59 and colorburst would be -40 and 19,
 *         but these are not interpreted specially in this function.
 *         The value is calculated from the relative voltage with:
 *                   floor((voltage-0.518)*1000/12)-15
 *
 * Target: Pointer to a storage for Width RGB32 samples (00rrggbb).
 *         Note that the function will produce a RGB32 value for _every_ half-clock-cycle.
 *         This means 2264 RGB samples if you render 283 pixels per scanline (incl. borders).
 *         The caller can pick and choose those columns they want from the signal
 *         to render the picture at their desired resolution.
 *
 * Phase0: An integer in range 0-11 that describes the phase offset into colors on this scanline.
 *         Would be generated from the PPU clock cycle counter at the start of the scanline.
 *         In essence it conveys in one integer the same information that real NTSC signal
 *         would convey in the colorburst period in the beginning of each scanline.
 */
/*
void NTSC_DecodeLine(int Width,
                     const char Signal[/*Width*/],
//                     unsigned Target[/*Width*/],
//                     int Phase0)
//{
//    static constexpr int Ywidth = 12, Iwidth = 23, Qwidth = 23;
    /* Ywidth, Iwidth and Qwidth are the filter widths for Y,I,Q respectively.
     * All widths at 12 produce the best signal quality.
     * 12,24,24 would be the closest values matching the NTSC spec.
     * But off-spec values 12,22,26 are used here, to bring forth mild
     * "chroma dots", an artifacting common with badly tuned TVs.
     * Larger values = more horizontal blurring.
     *//*
    static constexpr int Contrast = 167941, Saturation = 144044;

    static constexpr char sinetable[27] = {0,4,7,8,7,4, 0,-4,-7,-8,-7,-4,
                                           0,4,7,8,7,4, 0,-4,-7,-8,-7,-4,
                                           0,4,7}; // 8*sin(x*2pi/12)
    // To finetune hue, you would have to recalculate sinetable[].
    // Coarse changes can be made with Phase0.

    auto Read = [=](int pos) -> char { return pos>=0 ? Signal[pos] : 0; };
    auto Cos  = [=](int pos) -> char { return sinetable[(pos+36)%12  +Phase0]; };
    auto Sin  = [=](int pos) -> char { return sinetable[(pos+36)%12+3+Phase0];   };

    int ysum = 0, isum = 0, qsum = 0;
    for(int s=0; s<Width; ++s)
    {
        ysum += Read(s)          - Read(s-Ywidth);
        isum += Read(s) * Cos(s) - Read(s-Iwidth) * Cos(s-Iwidth);
        qsum += Read(s) * Sin(s) - Read(s-Qwidth) * Sin(s-Qwidth);
        constexpr int br=Contrast, sa=Saturation;
        constexpr int yr = br/Ywidth, ir = br* 1.994681e-6*sa/Iwidth, qr = br* 9.915742e-7*sa/Qwidth;
        constexpr int yg = br/Ywidth, ig = br* 9.151351e-8*sa/Iwidth, qg = br*-6.334805e-7*sa/Qwidth;
        constexpr int yb = br/Ywidth, ib = br*-1.012984e-6*sa/Iwidth, qb = br* 1.667217e-6*sa/Qwidth;
        int r = std::min(255,std::max(0, (ysum*yr + isum*ir + qsum*qr) / 65536 ));
        int g = std::min(255,std::max(0, (ysum*yg + isum*ig + qsum*qg) / 65536 ));
        int b = std::min(255,std::max(0, (ysum*yb + isum*ib + qsum*qb) / 65536 ));
        Target[s] = (r << 16) | (g << 8) | b;
    }
}
 */

//create SIMD version for TS?