# node-mic

A cross-platform Node.js package for recording audio streams from a microphone.

## Installation

Node-mic uses [arecord](https://alsa-project.org/) on Linux and [sox](http://sox.sourceforge.net/) on Windows and macOS.
If sox is not already installed, node-mic will attempt to download the latest version.

On the new M1 Mac, that requires installing [brew.sh](https://brew.sh/) (Intel Macs should work fine without it).

On Linux, it will warn if arecord is not found and remind you to install it using your package manager.

On Debian-based distros, try running this:

    sudo apt-get update && sudo apt-get install alsa-utils

On RedHat-based distros, try running this:

    sudo dnf install alsa-utils

After that's done, you can try testing it to make sure your microphone is detected.

    arecord temp.wav

## Example

```js
import fs from 'fs';
import NodeMic from 'node-mic';

const mic = new NodeMic({
    rate: 16000,
    channels: 1,
    threshold: 6
});

const micInputStream = mic.getAudioStream();
const outputFileStream = fs.createWriteStream('output.raw');

micInputStream.pipe(outputFileStream);

micInputStream.on('data', (data) => {
    // Do something with the data.
});

micInputStream.on('error', (err) => {
    console.log(`Error: ${err.message}`);
});

micInputStream.on('started', () => {
    console.log('Started');
    setTimeout(() => {
        mic.pause();
    }, 5000);
});

micInputStream.on('stopped', () => {
    console.log('Stopped');
});

micInputStream.on('paused', () => {
    console.log('Paused');
    setTimeout(() => {
        mic.resume();
    }, 5000);
});

micInputStream.on('unpaused', () => {
    console.log('Unpaused');
    setTimeout(() => {
        mic.stop();
    }, 5000);
});

micInputStream.on('silence', () => {
    console.log('Silence');
});

micInputStream.on('exit', (code) => {
    console.log(`Exited with code: ${code}`);
});

mic.start();
```

The above example should save the output to a file named `output.raw`. Note that arecord pipes the 44 byte WAV header, whereas SOX does not. So we need to provide the file format details to the player:

    aplay -f S16_LE -r 16000 -c 1 output.raw # Linux

or

    play -b 16 -e signed -c 1 -r 16000 output.raw # Windows/Mac

## API

### Mic(options)

Creates a new microphone object. It inherits all the events from [stream.Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform).

Accepts the following parameters (all optional):

* `options`
    * `endian`: Endian format. (default `little`)
    * `bitwidth`: Bit size. (default: `16`)
    * `encoding`: Signed or unsigned. (default: `signed-integer`)
    * `rate`: Bit rate. (default: `16000`)
    * `channels`: Number of channels. (default: `1`)
    * `device`: Which device to use. Linux only. (default: `plughw:0,0`)
    * `threshold`: The `'silence'` signal is raised after reaching these many consecutive frames. (default: `0`)
    * `fileType`: Recording format. `raw` or `wav`. (default: `raw`)
    * `debug`: If `true` then extra debug information is printed. (default: `false`)

### mic.start()
Starts the recording. Emits the `'started'` signal.

### mic.stop()
Stops the recording. Emits the `'stopped'` signal.

### mic.pause()
Pauses the recording. Emits the `'paused'` signal.

### mic.resume()
Resumes the recording. Emits the `'unpaused'` signal.

### mic.getAudioStream()
This returns a simple `Transform` stream that contains the data. The stream can be directly piped to a speaker or a file.

### mic.on('data')

This signal is emitted every time data is available. `data` is an audio waveform.

### mic.on('exit')

This signal is emitted when the recording process has finished.

### mic.on('error')

This signal is emitted whenever an error occurs.

## License

The MIT License (MIT). See [LICENSE](LICENSE) for more information.

Copyright (c) 2021 Alex Shaw <alex.shaw.as@gmail.com>

Forked from [mic](https://github.com/ran-j/mic6).

Copyright (c) 2016 Ashish Bajaj <bajaj.ashish@gmail.com>
