const ORDER = 2
const Q = 4.318;

class iir_filter_t {
    constructor() {
        this.b = new Float32Array(ORDER + 1);
        this.a = new Float32Array(ORDER + 1);
        this.x = new Float32Array(ORDER + 1);
        this.y = new Float32Array(ORDER + 1);
    }

    init(cutoff_freq, sample_rate) {
        let omega = 2.0 * Math.PI * cutoff_freq / sample_rate;
        let alpha = Math.sin(omega) / (2.0 * Q);
        let cos_omega = Math.cos(omega);
        let a0 = 1.0 + alpha;

        this.b[0] = (1 - cos_omega) / 2;
        this.b[1] = 1 - cos_omega;
        this.b[2] = (1 - cos_omega) / 2;

        this.a[0] = a0;
        this.a[1] = -2 * cos_omega / a0;
        this.a[2] = (1 - alpha) / a0;

        for (let i = 0; i <= ORDER; i++) {
            this.x[i] = 0;
            this.y[i] = 0;
        }
    }

    add_sample(x) {
        let y = this.b[0] * x + this.b[1] * this.x[0] + this.b[2] * this.x[1] -
            this.a[1] * this.y[0] - this.a[2] * this.y[1];

        this.x[1] = this.x[0];
        this.x[0] = x;
        this.y[1] = this.y[0];
        this.y[0] = y;

        return y;
    }
}
