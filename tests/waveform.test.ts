import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {create, act} from 'react-test-renderer';
import {WaveformVisualizer} from '../src/app/components/WaveformVisualizer';
import {audio} from './audioPlatform';

function renderSamples(values:number[],width:number){
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'window');
 const fills:{x:number;y:number;width:number;height:number}[]=[];
 const listeners=new Set<unknown>();
 const context={scale(){},fillText(){},fillStyle:'',font:'',strokeStyle:'',lineWidth:1,fillRect(x:number,y:number,w:number,h:number){fills.push({x,y,width:w,height:h});},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 const canvas={width:0,height:0,style:{},getContext(){return context;}};
 Object.defineProperty(globalThis,'window',{configurable:true,value:{devicePixelRatio:2,addEventListener(_name:string,fn:unknown){listeners.add(fn);},removeEventListener(_name:string,fn:unknown){listeners.delete(fn);}}});
 let view:ReturnType<typeof create>|undefined;
 try{
  act(()=>{view=create(createElement(WaveformVisualizer,{originalAudioBuffer:audio([values]),processedAudioBuffer:null}),{createNodeMock:element=>element.type==='canvas'?canvas:{clientWidth:width}});});
  const bars=fills.filter(rect=>rect.width===1);
  assert.equal(bars.length,width,'each visible column must represent actual samples');
  assert.equal(canvas.width,width*2,'DPR affects the bitmap, not the sample mapping');
  return bars;
 }finally{
  if(view)act(()=>view!.unmount());
  assert.equal(listeners.size,0);
  if(descriptor)Object.defineProperty(globalThis,'window',descriptor);else Reflect.deleteProperty(globalThis,'window');
 }
}
test('actual canvas holds a short constant clip across all columns instead of drawing fake silence',()=>{
 const bars=renderSamples(Array(48).fill(0.5),480);
 assert.equal(bars[479].height,32,'last display column must hold the final real sample');
 assert.ok(bars.every(rect=>rect.height===32&&rect.y===64));
});
test('actual canvas proportional buckets include the final sample for a non-divisible clip length',()=>{
 const values=Array(481).fill(0);values[480]=1;
 const bars=renderSamples(values,480);
 assert.equal(bars[479].height,64,'the trailing sample must not disappear');
 assert.ok(bars.slice(0,-1).every(rect=>rect.height===1));
});
