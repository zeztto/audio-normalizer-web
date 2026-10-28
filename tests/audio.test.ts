import test from 'node:test';
import assert from 'node:assert/strict';
import {installOfflineAdapter,audio} from './audioPlatform';
installOfflineAdapter();
import {analyzeAudio,normalizeAudio,audioBufferToWav} from '../src/app/utils/audioProcessor';
const buffer=(values:number[],sampleRate=48000)=>audio([values],sampleRate);
test('silence is a finite zero signal and normalization preserves it',async()=>{const b=buffer([0,0,0]);const result=await normalizeAudio(b,'peak',-3);assert.deepEqual([...result.getChannelData(0)],[0,0,0]);});
test('analysis rejects non-finite input rather than silently emitting a corrupted result',()=>{assert.throws(()=>analyzeAudio(buffer([0,NaN,Infinity])));});
test('WAV rejects unsupported bit depth and non-finite samples',async()=>{await assert.rejects(audioBufferToWav(buffer([0.25]),32));await assert.rejects(audioBufferToWav(buffer([NaN]),16));});

test('RMS normalization preserves waveform ratios when a requested gain would clip',async()=>{const b=buffer([1,...Array(100).fill(0.2)]);const result=await normalizeAudio(b,'rms',-6);assert.ok(Math.abs(result.getChannelData(0)[1]-0.2)<1e-6);assert.equal(result.getChannelData(0)[0],1);});
test('PCM24 odd data length includes RIFF word padding',async()=>{const blob=await audioBufferToWav(buffer([0,0.25,-0.25]),24);assert.equal(blob.size,54);const v=new DataView(await blob.arrayBuffer());assert.equal(v.getUint32(4,true),46);assert.equal(v.getUint32(40,true),9);});

import {decodeWave} from './independentWave';
import {normalizationGain} from '../src/app/utils/audioProcessor';
test('Peak and RMS requested levels are achieved without altering the source buffer',async()=>{
 const input=audio([[0,0.25,0,-0.25],[0,-0.125,0,0.125]]);const original=[...input.getChannelData(0)];
 const peak=await normalizeAudio(input,'peak',-3);assert.ok(Math.abs(analyzeAudio(peak).peak-(-3))<1e-5);
 const rms=await normalizeAudio(input,'rms',-18);assert.ok(Math.abs(analyzeAudio(rms).rms-(-18))<1e-5);assert.deepEqual([...input.getChannelData(0)],original);
 assert.equal(normalizationGain(audio([[0,0]]),'peak',-3).applied,1);
 await assert.rejects(normalizeAudio(input,'lufs' as never,-16));await assert.rejects(normalizeAudio(input,'peak',NaN));
});
for(const bits of [16,24])test(`PCM${bits} RIFF is independently decoded with correct signed stereo samples`,async()=>{
 const values=[[-1,-0.25,0,0.25,1],[1,0.25,0,-0.25,-1]],input=audio(values);const blob=await audioBufferToWav(input,bits),bytes=await blob.arrayBuffer(),view=new DataView(bytes),decoded=decodeWave(bytes);
 assert.equal(decoded.sampleRate,48000);assert.equal(decoded.channelData.length,2);assert.equal(decoded.channelData[0].length,5);
 assert.equal(view.getUint16(20,true),1);assert.equal(view.getUint16(22,true),2);assert.equal(view.getUint16(34,true),bits);assert.equal(view.getUint32(28,true),48000*2*bits/8);assert.equal(view.getUint16(32,true),2*bits/8);assert.equal(view.getUint32(4,true),bytes.byteLength-8);
 for(let c=0;c<2;c++)for(let i=0;i<5;i++)assert.ok(Math.abs(decoded.channelData[c][i]-values[c][i])<=2/2**(bits-1));
});
for(const rate of [44100,96000])test(`resampled WAV header, duration and independent decode agree at ${rate}Hz`,async()=>{
 const input=audio([Array.from({length:4800},(_,i)=>0.25*Math.sin(2*Math.PI*1000*i/48000))]);const blob=await audioBufferToWav(input,24,rate),decoded=decodeWave(await blob.arrayBuffer());assert.equal(decoded.sampleRate,rate);assert.equal(decoded.channelData[0].length,rate/10);assert.ok(decoded.channelData[0].every(Number.isFinite));
});
test('WAV rejects invalid sample rate and out-of-range PCM before producing a file',async()=>{await assert.rejects(audioBufferToWav(buffer([0]),16,NaN));await assert.rejects(audioBufferToWav(buffer([0]),16,-1));await assert.rejects(audioBufferToWav(buffer([2]),16));});
