import {useState} from 'react';
import {Activity} from 'lucide-react';
import {Button} from './ui/button';import {Card} from './ui/card';import {Label} from './ui/label';import {RadioGroup,RadioGroupItem} from './ui/radio-group';import {Slider} from './ui/slider';
import type {NormalizationType} from '../utils/audioProcessor';
export type {NormalizationType} from '../utils/audioProcessor';
interface Props {audioBuffer:AudioBuffer|null;onNormalize:(type:NormalizationType,target:number)=>void;isProcessing:boolean;}
export function NormalizerControls({audioBuffer,onNormalize,isProcessing}:Props){
 const [type,setType]=useState<NormalizationType>('peak'),[target,setTarget]=useState(-3);const range=type==='peak'?{min:-20,max:0}:{min:-30,max:-6};
 return <Card className="p-6 space-y-5"><h2 className="flex items-center gap-2"><Activity className="w-5 h-5"/>노멀라이즈 설정</h2>
  <RadioGroup aria-label="노멀라이즈 방식" value={type} onValueChange={value=>{if(value==='peak'||value==='rms'){setType(value);setTarget(value==='peak'?-3:-18);}}} disabled={isProcessing}>
   <div className="flex items-center gap-2"><RadioGroupItem value="peak" id="normalize-peak"/><Label htmlFor="normalize-peak">피크 (Peak)</Label></div>
   <div className="flex items-center gap-2"><RadioGroupItem value="rms" id="normalize-rms"/><Label htmlFor="normalize-rms">실효값 (RMS)</Label></div>
  </RadioGroup>
  <div className="space-y-3"><Label id="target-level-label">{type==='peak'?'피크':'RMS'} 목표 레벨: {target.toFixed(1)} dBFS</Label><Slider aria-labelledby="target-level-label" aria-label="목표 레벨" value={[target]} min={range.min} max={range.max} step={0.1} onValueChange={value=>setTarget(value[0])} disabled={isProcessing}/></div>
  <p className="text-sm text-muted-foreground">최대 증폭은 +20dB이며 출력 피크가 0dBFS를 넘지 않도록 gain을 제한합니다. RMS 목표에 도달하지 못할 수 있습니다.</p>
  <Button type="button" disabled={!audioBuffer||isProcessing} onClick={()=>onNormalize(type,target)}>{isProcessing?'처리 중…':'노멀라이즈 적용'}</Button>
 </Card>;
}
