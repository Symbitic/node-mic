import NodeMic from './dist/index.js';
import fs from 'fs';

const mic = new NodeMic({
    rate: 16000,
    channels: 1,
    debug: true,
    threshold: 6
});

const micInputStream = mic.getAudioStream();
const outputFileStream = fs.createWriteStream('output.raw');

micInputStream.pipe(outputFileStream);

micInputStream.on('data', (data) => {
    //console.log('Recieved Input Stream: ' + data.length);
});

micInputStream.on('error', (err) => {
    console.log(`Error in Input Stream: ${err.message}`);
});

micInputStream.on('started', () => {
    console.log('Starting');
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
