import { Transform, TransformOptions, TransformCallback } from 'stream';

export interface AudioStreamOptions extends TransformOptions {
    debug?: boolean;
}

export class AudioStream extends Transform {
    private _debug: boolean;
    private _silenceCount: number;
    private _threshold: number;

    /** Number of silences before exiting. */
    get threshold() {
        return this._threshold;
    }

    set threshold(numFrames: number) {
        this._threshold = numFrames;
    }

    /** Number of times it has been silent. */
    get count() {
        return this._silenceCount;
    }

    /** Reset the silence count to 0. */
    resetCount() {
        this._silenceCount = 0;
    }

    constructor(options?: AudioStreamOptions) {
        const { debug, ...transformOptions } = options;
        super(transformOptions);
        this._debug = debug || false;
        this._silenceCount = 0;
        this._threshold = 0;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
        let speechSample: any;
        let silenceLength = 0;

        if (this.threshold) {
            for (let i=0; i<chunk.length; i=i+2) {
                if (chunk[i+1] > 128) {
                    speechSample = (chunk[i+1] - 256) * 256;
                } else {
                    speechSample = chunk[i+1] * 256;
                }
                speechSample += chunk[i];

                if (Math.abs(speechSample) > 2000) {
                    if (this._debug) {
                        console.log('Found speech block');
                    }
                    // emit 'sound' if we hear a sound after a silence
                    if (this.count > this.threshold) {
                        this.emit('sound');
                    }
                    this.resetCount();
                    break;
                } else {
                    silenceLength++;
                }
            }
            if (silenceLength === chunk.length/2) {
                this._silenceCount++;
                if (this._debug) {
                    console.log('Found silence block: %d of %d', this.count, this.threshold);
                }
                // emit 'silence' only once each time the threshold condition is met
                if (this.count === this.threshold) {
                    this.emit('silence');
                }
            }
        }
        this.push(chunk);
        callback();
    }
}
