'use strict';

class canvas_manager_t {
    constructor(el_name) {
        this.el_name = el_name;
        this.el = this.el = document.getElementById(this.el_name);;
        this.context = null;


        this.el_w = 0;
        this.el_h = 0;

        this.new_scale = 1;
        this.scale = 1;
        this.new_width = 0;
        this.new_height = 0;
        this.height = 0;
        this.width = 0;
        this.width_before = 0;
        this.pa_w = 0;
        this.pa_h = 0;
        this.ar_w = 8;
        this.ar_h = 7;
        this.new_ar_w = 8;
        this.new_ar_h = 7;

        this.overscan_left = 0;
        this.overscan_right = 0;
        this.overscan_top = 0;
        this.overscan_bottom = 0;

        this.new_overscan_top = 0;
        this.new_overscan_left = 0;
        this.new_overscan_right = 0;
        this.new_overscan_bottom = 0;

        this.new_correct_overscan = true
        this.new_correct_PAR = true

        this.correct_overscan = false
        this.correct_PAR = false

        this.xmul = 1;
        this.ymul = 1;
    }

    set_size(width, height, ar_w = null, ar_h = null, calc_bottom_as=null) {
        this.new_width = width;
        this.new_height = height;
        this.new_ar_w = ar_w;
        this.new_ar_h = ar_h;
        if (calc_bottom_as === null) calc_bottom_as = height;
        this.calc_bottom_as = calc_bottom_as;
    }

    set_scale(scale) {
        this.new_scale = scale;
    }

    set_overscan(left, right, top, bottom) {
        this.new_overscan_left = left;
        this.new_overscan_right = right;
        this.new_overscan_top = top;
        this.new_overscan_bottom = bottom;
    }

    set_par_correct(onoff) {
        this.new_correct_PAR = onoff;
    }

    set_overscan_correct(onoff) {
        this.new_correct_overscan = onoff;
    }

    get_context() {
        if (this.context === null){
            this.context = this.el.getContext('2d');
        }
        return this.context;
    }

    fixup_dimensions() {
        if ((this.new_width !== this.width) || (this.new_height !== this.height) ||
            (this.new_ar_h !== this.ar_h) || (this.new_ar_w !== this.ar_w) ||
            (this.new_scale !== this.scale) || (this.new_overscan_left !== this.overscan_left) ||
            (this.new_overscan_right !== this.overscan_right) || (this.new_overscan_top !== this.overscan_top) ||
            (this.new_overscan_bottom !== this.overscan_bottom) ||
            (this.new_correct_overscan !== this.correct_overscan) || (this.new_correct_PAR !== this.correct_PAR))
        {
            this.width = this.new_width;
            this.height = this.new_height;
            this.ar_h = this.new_ar_h;
            this.ar_w = this.new_ar_w;
            this.scale = this.new_scale;
            this.overscan_top = this.new_overscan_top;
            this.overscan_bottom = this.new_overscan_bottom;
            this.overscan_left = this.new_overscan_left;
            this.overscan_right = this.new_overscan_right;
            this.correct_overscan = this.new_correct_overscan;
            this.correct_PAR = this.new_correct_PAR;

            if ((this.ar_h === null) || (!this.correct_PAR)) {
                this.xmul = this.ymul = 1;
            }
            else {
                let whar = this.width / this.calc_bottom_as
                let myar = this.ar_w / this.ar_h;
                this.xmul = myar / whar;
                this.ymul = 1;
                if ((this.xmul > 0.98) && (this.xmul < 1.02)) this.xmul = 1;
                if (this.xmul < 1) {
                    this.xmul = 1;
                    this.ymul = whar / myar;
                }
            }

            if (this.correct_overscan) {
                this.el_h = this.height - (this.overscan_top + this.overscan_bottom);
                this.el_w = this.width - (this.overscan_left + this.overscan_right);
            } else {
                this.el_h = this.height;
                this.el_w = this.width;
            }

            this.pa_w = this.el_w;
            this.pa_h = this.el_h;

            this.el_h = Math.floor(this.el_h * this.scale * this.ymul);
            this.el_w = Math.floor(this.el_w * this.scale * this.xmul);
            this.el.height = this.el_h;
            this.el.width = this.el_w;
        }
    }

    /**
     * @returns {ImageData}
     */
    get_imgdata() {
        this.fixup_dimensions();
        this.get_context();
        return this.context.getImageData(0, 0, this.pa_w, this.pa_h);
    }

    put_imgdata(data) {
        //this.get_context();
        this.context.putImageData(data, 0, 0);
        if ((this.scale !== 1) || (this.xmul !== 1) || (this.ymul !== 1)) {
            this.context.globalCompositeOperation = 'copy';
            this.context.drawImage(this.el, 0, 0, this.pa_w, this.pa_h, 0, 0, Math.floor(this.pa_w*this.scale*this.xmul), Math.floor(this.pa_h*this.scale*this.ymul));
        }
    }
}
