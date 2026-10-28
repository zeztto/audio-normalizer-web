export class TestAudioBuffer {
 readonly numberOfChannels:number;readonly length:number;readonly sampleRate:number;readonly duration:number;private channels:Float32Array<ArrayBuffer>[];
 constructor(options:{numberOfChannels:number;length:number;sampleRate:number}){this.numberOfChannels=options.numberOfChannels;this.length=options.length;this.sampleRate=options.sampleRate;this.duration=options.length/options.sampleRate;this.channels=Array.from({length:this.numberOfChannels},()=>new Float32Array(this.length));}
 getChannelData(channel:number){return this.channels[channel];}
 copyToChannel(source:Float32Array,channel:number,start=0){this.channels[channel].set(source,start);}
 copyFromChannel(destination:Float32Array,channel:number,start=0){destination.set(this.channels[channel].subarray(start,start+destination.length));}
}
export class TestOfflineContext {
 destination={};private source:{buffer:AudioBuffer|null}|null=null;private gain={gain:{value:1}};
 constructor(private channels:number,private length:number,private rate:number){if(length<1||!Number.isInteger(rate)||rate<3000||rate>384000)throw new RangeError('invalid audio dimensions');}
 createBufferSource(){const source={buffer:null as AudioBuffer|null,connect(){},start(){}};this.source=source;return source;}
 createGain(){return {...this.gain,connect(){}};}
 async startRendering():Promise<AudioBuffer>{const out=new TestAudioBuffer({numberOfChannels:this.channels,length:this.length,sampleRate:this.rate});const input=this.source!.buffer!;for(let channel=0;channel<this.channels;channel++){const from=input.getChannelData(channel),to=out.getChannelData(channel);for(let i=0;i<to.length;i++){const position=i*input.sampleRate/this.rate,left=Math.min(from.length-1,Math.floor(position)),right=Math.min(from.length-1,left+1),fraction=position-left;to[i]=(from[left]*(1-fraction)+from[right]*fraction)*this.gain.gain.value;}}return out as unknown as AudioBuffer;}
}
export function installOfflineAdapter(){const previous=Object.getOwnPropertyDescriptor(globalThis,'OfflineAudioContext');Object.defineProperty(globalThis,'OfflineAudioContext',{configurable:true,writable:true,value:TestOfflineContext});return ()=>{if(previous)Object.defineProperty(globalThis,'OfflineAudioContext',previous);else Reflect.deleteProperty(globalThis,'OfflineAudioContext');};}
export function audio(values:number[][],sampleRate=48000):AudioBuffer{const buffer=new TestAudioBuffer({numberOfChannels:values.length,length:values[0].length,sampleRate});values.forEach((channel,index)=>buffer.copyToChannel(new Float32Array(channel),index));return buffer as unknown as AudioBuffer;}
