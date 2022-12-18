"use strict";

class PS1_GTE2 {
    constructor() {
        this.output_shared_buffers = [new SharedArrayBuffer(640*480*3), new SharedArrayBuffer(640*480*3)];
        this.output = [new Uint8Array(this.output_shared_buffers[0]), new Uint8Array(this.output_shared_buffers[1])];
        this.cur_output_num = 1;
        this.cur_output = this.output[1];
        this.last_used_buffer = 1;
   }
}