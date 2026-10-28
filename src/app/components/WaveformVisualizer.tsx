import {useEffect,useRef} from 'react';
import {Card} from './ui/card';
import {buildWaveformColumns} from '../utils/waveform';
interface Props {originalAudioBuffer:AudioBuffer|null;processedAudioBuffer:AudioBuffer|null;showComparison?:boolean;}
function draw(canvas:HTMLCanvasElement,buffer:AudioBuffer,width:number,label:string){
 const height=160,dpr=window.devicePixelRatio||1;canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.round(height*dpr);canvas.style.width='100%';canvas.style.height=`${height}px`;
 const ctx=canvas.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#4b5563';ctx.font='14px sans-serif';ctx.fillText(label,8,18);
 const columns=buildWaveformColumns(buffer.getChannelData(0),width),amp=(height-32)/2,center=32+amp;
 ctx.fillStyle='#1f2937';
 for(let x=0;x<columns.length;x++){const {low,high}=columns[x];const top=center-Math.min(1,high)*amp,bottom=center-Math.max(-1,low)*amp;ctx.fillRect(x,top,1,Math.max(1,bottom-top));}
 ctx.strokeStyle='#b45309';ctx.lineWidth=1.5;for(const sign of [-1,1]){ctx.beginPath();for(let x=0;x<columns.length;x++){const y=center+sign*Math.min(1,columns[x].rms)*amp;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
 ctx.strokeStyle='#d1d5db';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,center);ctx.lineTo(width,center);ctx.stroke();
}
export function WaveformVisualizer({originalAudioBuffer,processedAudioBuffer,showComparison=false}:Props){
 const container=useRef<HTMLDivElement>(null),original=useRef<HTMLCanvasElement>(null),processed=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const element=container.current;if(!element)return;const render=()=>{const width=Math.max(1,Math.floor(element.clientWidth));if(original.current&&originalAudioBuffer)draw(original.current,originalAudioBuffer,width,'원본');if(processed.current&&processedAudioBuffer)draw(processed.current,processedAudioBuffer,width,'노멀라이즈 적용');};render();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(render);observer?.observe(element);window.addEventListener('resize',render);return()=>{observer?.disconnect();window.removeEventListener('resize',render);};},[originalAudioBuffer,processedAudioBuffer,showComparison]);
 return <Card className="p-4 space-y-3"><h2>파형 · 첫 번째 채널</h2><p className="text-sm text-muted-foreground">진한 선은 샘플 범위, 주황색 선은 구간 RMS입니다. 샘플 수가 가로 픽셀보다 적으면 같은 샘플을 반복해 표시합니다.</p><div ref={container} className="space-y-3 min-w-0"><canvas ref={original} aria-label="원본 파형" className="w-full block"/>{showComparison&&processedAudioBuffer&&<canvas ref={processed} aria-label="노멀라이즈 적용 파형" className="w-full block"/>}</div></Card>;
}
