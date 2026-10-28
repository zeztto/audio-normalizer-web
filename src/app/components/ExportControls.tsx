import {useState} from 'react';
import {Download} from 'lucide-react';import {Button} from './ui/button';import {Card} from './ui/card';import {Label} from './ui/label';import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from './ui/select';
export type ExportFormat='wav';
interface Props {audioBuffer:AudioBuffer|null;fileName:string;onExport:(format:ExportFormat,bits:number,rate:number)=>void;isExporting:boolean;hasNormalized:boolean;}
export function ExportControls({audioBuffer,fileName,onExport,isExporting,hasNormalized}:Props){
 const [bits,setBits]=useState(16),[rate,setRate]=useState(audioBuffer?.sampleRate??48000);const rates=[...new Set([audioBuffer?.sampleRate??48000,44100,48000,88200,96000,192000])].sort((a,b)=>a-b);
 return <Card className="p-6 space-y-5"><h2 className="flex items-center gap-2"><Download className="w-5 h-5"/>WAV 저장</h2><p>출력 형식: PCM WAV</p>
  <div className="space-y-2"><Label htmlFor="wav-bits">비트 깊이</Label><Select value={String(bits)} onValueChange={value=>setBits(Number(value))} disabled={isExporting}><SelectTrigger id="wav-bits" aria-label="비트 깊이"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="16">PCM16</SelectItem><SelectItem value="24">PCM24</SelectItem></SelectContent></Select></div>
  <div className="space-y-2"><Label htmlFor="wav-rate">출력 샘플레이트</Label><Select value={String(rate)} onValueChange={value=>setRate(Number(value))} disabled={isExporting}><SelectTrigger id="wav-rate" aria-label="출력 샘플레이트"><SelectValue/></SelectTrigger><SelectContent>{rates.map(value=><SelectItem key={value} value={String(value)}>{value.toLocaleString()} Hz</SelectItem>)}</SelectContent></Select></div>
  <p className="break-all">{fileName}_{hasNormalized?'normalized':'converted'}.wav</p>{!hasNormalized&&<p className="text-sm text-muted-foreground">현재 decode한 원본을 PCM으로 변환합니다. 피크가 PCM 범위를 넘으면 노멀라이즈가 필요합니다.</p>}
  <Button type="button" disabled={!audioBuffer||isExporting} onClick={()=>onExport('wav',bits,rate)}>{isExporting?'WAV 생성 중…':'WAV 다운로드'}</Button>
 </Card>;
}
