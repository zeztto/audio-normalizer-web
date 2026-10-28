import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
export interface DecodedWave {sampleRate:number;channels:number;sampleWidth:number;frames:number;channelData:number[][];}
/** CPython's independent RIFF parser and integer signed-PCM conversion; test-only. */
export function decodeWave(bytes:ArrayBuffer):DecodedWave{
 const folder=mkdtempSync(join(tmpdir(),'own-wav-test-')),file=join(folder,'encoded.wav');
 try{writeFileSync(file,new Uint8Array(bytes));const result=spawnSync('python3',['-c',String.raw`import sys,wave,json
with wave.open(sys.argv[1],'rb') as f:
 channels=f.getnchannels();width=f.getsampwidth();frames=f.getnframes();rate=f.getframerate();raw=f.readframes(frames)
 assert f.getcomptype()=='NONE'
 assert width in (2,3)
 assert len(raw)==frames*channels*width
 data=[[] for _ in range(channels)]
 for frame in range(frames):
  for channel in range(channels):
   offset=(frame*channels+channel)*width
   value=int.from_bytes(raw[offset:offset+width],'little',signed=True)
   scale=2**(8*width-1) if value<0 else 2**(8*width-1)-1
   data[channel].append(value/scale)
 print(json.dumps(dict(sampleRate=rate,channels=channels,sampleWidth=width,frames=frames,channelData=data)))
`,file],{encoding:'utf8',maxBuffer:8*1024*1024});if(result.status!==0)throw new Error(`독립 WAV decoder 실패: ${result.stderr||result.error?.message}`);return JSON.parse(result.stdout) as DecodedWave;}
 finally{rmSync(folder,{recursive:true,force:true});}
}
