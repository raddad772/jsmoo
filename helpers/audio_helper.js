"use strict";
class ConsoleAudioContext {
    constructor() {
        this.setup = false;
        this.in_setup = false;
        this.audio_context = null;
        this.audio_node = null;
    }

    async grab_context() {
        if ((this.setup) || (this.in_setup)) return;
        console.log('Setting up audio context')
        this.in_setup = true;
        this.audio_context = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: 48000,
        })
        await this.audio_context.audioWorklet.addModule('/helpers/audio_worklet.js')
        this.audio_node = new AudioWorkletNode(this.audio_context, 'console-audio-processor');
        this.audio_node.connect(this.audio_context.destination);
        this.audio_node.port.onmessage = this.handle_audio_message.bind(this);
        this.setup = true;
        this.in_setup = false;
    }

    handle_audio_message(e) {
        console.log('GOT AUDIO MESSAGE', e);
    }
}
