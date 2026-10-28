import {decodeWave} from './independentWave';
import {audio} from './audioPlatform';
export class TestSource {
 buffer:AudioBuffer|null=null;onended:((event:Event)=>void)|null=null;startOffset=0;startWhen=0;stopCalls=0;disconnectCalls=0;
 connect(){}start(when=0,offset=0){this.startWhen=when;this.startOffset=offset;}stop(){this.stopCalls++;}disconnect(){this.disconnectCalls++;}
 finish(){this.onended?.(new Event('ended'));}
}
export class TestRealtimeContext {
 static instances:TestRealtimeContext[]=[];static decode:(bytes:ArrayBuffer)=>Promise<AudioBuffer>=async bytes=>{const data=decodeWave(bytes);return audio(data.channelData,data.sampleRate);};static resume:((context:TestRealtimeContext)=>Promise<void>)|null=null;
 state:AudioContextState='suspended';currentTime=0;destination={};sources:TestSource[]=[];gains:{gain:{value:number};disconnectCalls:number;connect:()=>void;disconnect:()=>void}[]=[];closeCalls=0;
 constructor(){TestRealtimeContext.instances.push(this);}
 decodeAudioData(bytes:ArrayBuffer){return TestRealtimeContext.decode(bytes);}
 async resume(){if(TestRealtimeContext.resume)await TestRealtimeContext.resume(this);this.state='running';}
 async close(){this.closeCalls++;this.state='closed';}
 createBufferSource(){const source=new TestSource();this.sources.push(source);return source;}
 createGain(){const gain={gain:{value:1},disconnectCalls:0,connect(){},disconnect(){this.disconnectCalls++;}};this.gains.push(gain);return gain;}
}
export function installRealtimeAdapter(){const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');Object.defineProperty(globalThis,'AudioContext',{configurable:true,writable:true,value:TestRealtimeContext});return ()=>{if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else Reflect.deleteProperty(globalThis,'AudioContext');};}
