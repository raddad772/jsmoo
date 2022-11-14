'use strict';

class canvas_manager_t {
    constructor(el_name) {
        this.el_name = el_name;
        this.el = this.el = document.getElementById(this.el_name);;
        this.context = null;

        this.scale = 1;
        this.height = 0;
        this.width = 0;
        this.width_before = 0;
        this.ar_w = 3;
        this.ar_h = 3;

        this.xmul = 1;
        this.ymul = 1;
    }

    set_size(width, height, ar_w = 1, ar_h = 1) {
        let whar = width / height;
        let myar = ar_w / ar_h;
        this.xmul = myar / whar;
        this.ymul = 1;
        if ((this.xmul > 0.98) && (this.xmul < 1.02)) this.xmul = 1;
        if (this.xmul < 1) {
            console.log('XMUL!', this.xmul);
            this.xmul = 1;
            this.ymul = whar / myar;
        }
        console.log('X, Y MUL', this.xmul, this.ymul)
        if ((width !== this.width) || (height !== this.height) || (ar_w !== this.ar_w) || (ar_h !== this.ar_h)) {
            this.ar_w = ar_w;
            this.ar_h = ar_h;
            this.width = width;
            this.height = height;
            this.width_before = width;
            this.el.height = Math.floor(height * this.scale * this.ymul);
            this.el.width = Math.floor(width * this.scale * this.xmul);
        }
    }

    set_scale(scale) {
        if (scale !== this.scale) {
            this.el.height = Math.floor(this.height * scale * this.ymul);
            this.el.width = Math.floor(this.width * scale * this.xmul);
        }
        this.scale = scale;
    }

    get_context() {
        if (this.context === null){
            this.context = this.el.getContext('2d');
        }
        return this.context;
    }

    /**
     * @returns {ImageData}
     */
    get_imgdata() {
        this.get_context();
        return this.context.getImageData(0, 0, this.width, this.height);
    }

    put_imgdata(data) {
        this.get_context();
        this.context.putImageData(data, 0, 0);
        if ((this.scale !== 1) || (this.xmul !== 1)) {
            this.context.globalCompositeOperation = 'copy';
            this.context.drawImage(this.el, 0, 0, this.width, this.height, 0, 0, Math.floor(this.width*this.scale*this.xmul), Math.floor(this.height*this.scale*this.ymul));
        }
    }
}
