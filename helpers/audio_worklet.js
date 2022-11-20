"use strict";

/* SO this is copied straight out of RusticNES and
    modified a little because I cannot be bothered.
  If I extend or change it in the future I will add that here
 */

/*
Copyright 2018 Nicholas Flynt, aka "zeta0134"

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */



class ConsoleAudioProcessor extends AudioWorkletProcessor {
  constructor (...args) {
    super(...args)
    this.sampleBuffer = new Int16Array(0);
    this.lastPlayedSample = 0;
    this.port.onmessage = (e) => {
      if (e.data.type === "samples") {
        let mergedBuffer = new Int16Array(this.sampleBuffer.length + e.data.samples.length);
        mergedBuffer.set(this.sampleBuffer);
        mergedBuffer.set(e.data.samples, this.sampleBuffer.length);
        this.sampleBuffer = mergedBuffer;
      }
    }
  }
  process (inputs, outputs, parameters) {
    const output = outputs[0]
    const desired_length = output[0].length;
    //console.log("Want to play: ", desired_length);
    //console.log("Actual size: ", this.sampleBuffer.length);
    if (desired_length <= this.sampleBuffer.length) {
      // Queue up the buffer contents. Note that NES audio is in mono, so we'll replicate that
      // to every channel on the output. (I'm guessing usually 2?)
      output.forEach(channel => {
        for (let i = 0; i < channel.length; i++) {
          // Convert from i16 to float, ranging from -1 to 1
          channel[i] = (this.sampleBuffer[i] / 32768);
        }
      })
      // Set the new last played sample, this will be our hold value if we have an underrun
      this.lastPlayedSample = this.sampleBuffer[desired_length - 1];
      // Remove those contents from the buffer
      this.sampleBuffer = this.sampleBuffer.slice(desired_length);
      // Finally, tell the main thread so it can adjust its totals
      this.port.postMessage({"type": "samplesPlayed", "count": desired_length});
    } else {
      // Queue up nothing! Specifically, *repeat* the last sample, to hold the level; this won't
      // avoid a break in the audio, but it avoids ugly pops
      output.forEach(channel => {
        for (let i = 0; i < channel.length; i++) {
          channel[i] = (this.lastPlayedSample / 37268);
        }
      })
      // Tell the main thread that we've run behind
      this.port.postMessage({"type": "audioUnderrun", "count": output[0].length});
    }

    return true
  }
}

registerProcessor('console-audio-processor', ConsoleAudioProcessor)
