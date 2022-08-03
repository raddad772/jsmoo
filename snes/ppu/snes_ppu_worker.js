function PPU_worker_function()
{
    console.log('INVOKED');
    onmessage = function (e) {
        //console.log('Worker: Message received from main script', e.data);
        let msg = e.data;
        let y_start = msg.y_start;
        let y_end = msg.y_end;
        let reply_output = new Uint16Array(256*((y_end-y_start)+1));
        for (let y = y_start; y < y_end; y++) {
            PPUF_render_scanline
        }

        const reply = {worker_num: e.data.worker_num}
        console.log(e.data.say);
        postMessage(reply);
    }
}

if (window !== self) PPU_worker_function();

class SNES_PPU_worker {
    constructor() {
        // onMessage, PostMessage,
    }
}