'use strict';

class canvas_manager_t {
    constructor(el_name) {
        this.el_name = el_name;
        this.el = this.el = document.getElementById(this.el_name);;
        this.context = null;

        this.scale = 1;
        this.height = 0;
        this.width = 0;
    }

    set_size(width, height) {
        if ((width !== this.width) || (height !== this.height)) {
            this.width = width;
            this.height = height;
            this.el.height = height * this.scale;
            this.el.width = width * this.scale;
        }
    }

    set_scale(scale) {
        if (scale !== this.scale) {
            this.el.height = height * scale;
            this.el.width = width * scale;
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
        if (this.scale !== 1) {
            this.context.globalCompositeOperation = 'copy';
            this.context.drawImage(this.el, 0, 0, this.width, this.height, 0, 0, this.width*this.scale, this.height*this.scale);
        }
    }
}
