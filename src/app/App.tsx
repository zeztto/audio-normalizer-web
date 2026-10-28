import {Headphones} from 'lucide-react';
import {AudioUploader} from './components/AudioUploader';import {WaveformVisualizer} from './components/WaveformVisualizer';import {AudioPlayer} from './components/AudioPlayer';import {NormalizerControls} from './components/NormalizerControls';import {ExportControls} from './components/ExportControls';import {useAudioSession} from './hooks/useAudioSession';
export default function App(){
 const audio=useAudioSession(),busy=audio.processing||audio.exporting;
 return <div className="min-h-screen bg-background"><header className="border-b"><div className="max-w-7xl mx-auto px-4 py-6 space-y-3"><h1 className="flex items-center gap-3"><Headphones className="w-8 h-8 shrink-0"/>오디오 노멀라이저</h1><p>오디오를 브라우저에서 읽고 Peak·RMS 레벨을 조정하여 PCM WAV로 저장합니다.</p></div></header><main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
  {audio.error&&<p role="alert" className="border border-destructive rounded-md p-4 text-destructive">{audio.error}</p>}
  {!audio.original?<AudioUploader loading={audio.loading} onFileSelect={file=>{void audio.load(file);}}/>:<>
   <p className="break-all">{audio.name} · {audio.original.numberOfChannels}채널 · {audio.original.sampleRate.toLocaleString()} Hz · {audio.original.duration.toFixed(2)}초</p>
   <WaveformVisualizer originalAudioBuffer={audio.original} processedAudioBuffer={audio.processed} showComparison={!!audio.processed}/>
   {audio.applied&&<p>현재 결과: {audio.applied.silent?'무음 유지':`${audio.applied.type==='peak'?'피크':'RMS'} 목표 ${audio.applied.target.toFixed(1)} dBFS${audio.applied.limited?' · 안전 증폭 한도 적용':''}`} · 실제 피크 {Number.isFinite(audio.applied.peak)?audio.applied.peak.toFixed(1):'−∞'} dBFS · RMS {Number.isFinite(audio.applied.rms)?audio.applied.rms.toFixed(1):'−∞'} dBFS</p>}
   <AudioPlayer originalAudioBuffer={audio.original} processedAudioBuffer={audio.processed}/>
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><NormalizerControls audioBuffer={audio.original} onNormalize={(type,target)=>{void audio.normalize(type,target);}} isProcessing={busy}/><ExportControls audioBuffer={audio.processed??audio.original} fileName={audio.name} onExport={(_format,bits,rate)=>{void audio.exportWav(bits,rate);}} isExporting={busy} hasNormalized={!!audio.processed}/></div>
   <button type="button" onClick={audio.reset} className="underline">새 파일 선택</button>
  </>}
  {audio.notice&&<p role="status">{audio.notice}</p>}
 </main><footer className="max-w-7xl mx-auto border-t px-4 py-6 text-sm text-muted-foreground">파일은 브라우저 메모리에서 처리하며 서버 전송이나 저장소 기록을 하지 않습니다. 새로고침하면 작업이 사라집니다.</footer></div>;
}
