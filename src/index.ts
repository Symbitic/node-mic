import { PassThrough } from 'stream';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { extractMetadata } from './metadata.js';
import { AudioStream } from './audio.js';
import { findAlsa, findRec, findSox } from './bins.js';
import { isMac, isWindows } from '../scripts/constants.js';

export interface MicOptions {
    endian: 'big' | 'little';
    bitwidth: number;
    encoding: 'signed-integer' | 'unsigned-integer';
    rate: number;
    channels: number;
    device: string;
    threshold: number;
    fileType: 'wav' | 'raw';
    debug: boolean;
}

export default class Mic {
    private _rate: string;
    private _channels: string;
    private _device: string;
    private _fileType: string;
    private _debug: boolean;
    private _audioStream: AudioStream;
    private _infoStream: PassThrough;
    private _format: string;
    private _audioProcessOptions: SpawnOptions;
    private _encoding: string;
    private _bitwidth: string;
    private _endian: string;
    private _audioProcess: ChildProcess | null;

    constructor(options: Partial<MicOptions> = {}) {
        this._endian = options.endian || 'little';
        this._bitwidth = String(options.bitwidth || 16);
        this._encoding = options.encoding || 'signed-integer';
        this._rate = String(options.rate || 16000);
        this._channels = String(options.channels || 1);
        this._device = options.device || '';
        this._fileType = options.fileType || 'wav';
        const threshold = options.threshold || 0;
        this._debug = options.debug || false;
        const stderr = this._debug ? 'pipe' : 'ignore';
        this._infoStream = new PassThrough();
        this._audioStream = new AudioStream({ debug: this._debug });
        this._audioProcessOptions = {
            stdio: ['ignore', 'pipe', stderr]
        };
        this._audioProcess = null;

        // Setup format variable for arecord call
        const formatEndian = this._endian === 'big' ? 'BE' : 'LE';
        const formatEncoding = this._encoding === 'unsigned-integer' ? 'U' : 'S';

        this._format = `${formatEncoding}${this._bitwidth}_${formatEndian}`;
        this._audioStream.threshold = threshold;

        if (this._debug) {
            this._infoStream.on('data', (data: any) => {
                console.log(`Received Info: ${data}`);
                try {
                    if (this._audioProcess !== null) {
                        const metadata = extractMetadata(data.toString());
                        this._audioStream.emit('metadata', metadata);
                    }
                } catch (error) {
                    console.log(error);
                }
            });
            this._infoStream.on('error', (error) => {
                console.log(`Error in Info Stream: ${error.message}`);
            });
        }
    }

    start() {
        if (this._audioProcess !== null) {
            if (this._debug) {
                throw new Error("Microphone already active");
            }
        }

        if (isWindows) {
            const sox = findSox();
            this.spawnWindows(sox);
        } else if (isMac) {
            const rec = findRec();
            this.spawnMac(rec);
        } else {
            const arecord = findAlsa();
            this.spawnLinux(arecord);
        }

        this._audioProcess.on('exit', (code: number, sig: any) => {
            if (code && !sig) {
                if (this._debug) {
                    console.log(`Recording has finished with code = ${code}`);
                }
                this._audioStream.emit('exit', code);
            }
        });
        
        this._audioProcess.stdout.pipe(this._audioStream);
        if (this._debug) {
            this._audioProcess.stderr.pipe(this._infoStream);
        }

        this._audioStream.emit('started');
    }

    protected spawnWindows(sox: string) {
        const options = [
            '-q',
            '-t', 'waveaudio', 
            '-d',
            '-r', this._rate, 
            '-c', this._channels, 
            '-e', this._encoding,
            '-b', this._bitwidth,
            '-t', this._fileType, 
            '--endian', this._endian,
            '-'
        ];
        this._audioProcess = spawn(sox, options, this._audioProcessOptions);
    }

    protected spawnMac(rec: string) {
        const options = [
            '-q',
            '-r', this._rate, 
            '-c', this._channels, 
            '-t', this._fileType,
            '-b', this._bitwidth,
            '-e', this._encoding,
            '--endian', this._endian,
            '-'
        ];
        this._audioProcess = spawn(rec, options, this._audioProcessOptions);
    }

    protected spawnLinux(arecord: string) {
        console.log(arecord)
        const options = [
            '-q',
            '-r', this._rate,
            '-c', this._channels,
            '-t', this._fileType,
            '-f', this._format,
        ];
        if (this._device) {
            options.push('-D', this._device);
        }
        console.log(options.join(' '))
        this._audioProcess = spawn(arecord, options, this._audioProcessOptions);
    }

    stop() {
        if (this._audioProcess !== null) {
            this._audioProcess.kill('SIGTERM');
            this._audioProcess = null;
            this._audioStream.emit('stopped');
            if (this._debug) {
                console.log('Microphone stopped');
            }
        }
    }

    pause() {
        if (this._audioProcess !== null) {
            if (!isWindows) {
                this._audioProcess.kill('SIGSTOP');
            }
            this._audioStream.pause();
            this._audioStream.emit('paused');
            if (this._debug) {
                console.log('Microphone paused');
            }
        }
    }

    resume() {
        if (this._audioProcess !== null) {
            if (!isWindows) {
                this._audioProcess.kill('SIGCONT');
            }
            this._audioStream.resume();
            this._audioStream.emit('unpaused');
            if (this._debug) {
                console.log('Microphone resumed');
            }
        }
    }

    getAudioStream() {
        return this._audioStream;
    }
}
