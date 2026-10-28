import {useRef,useState} from 'react';
import {Upload} from 'lucide-react';
import {Button} from './ui/button';
import {Card} from './ui/card';
interface Props {onFileSelect:(file:File)=>void;loading:boolean;}
export function AudioUploader({onFileSelect,loading}:Props){
 const input=useRef<HTMLInputElement>(null);const [dragging,setDragging]=useState(false);
 return <Card className={`p-6 border-2 border-dashed ${dragging?'border-primary':'border-border'}`} onDragOver={event=>{event.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={event=>{event.preventDefault();setDragging(false);const file=event.dataTransfer.files[0];if(file)onFileSelect(file);}}>
  <div className="space-y-4 text-center"><Upload className="w-8 h-8 mx-auto"/><h2>오디오 파일 선택</h2><p>브라우저가 읽을 수 있는 오디오를 선택합니다. 파일은 50MB 이하만 지원합니다.</p><Button type="button" onClick={()=>input.current?.click()}>파일 선택</Button><p role="status">{loading?'파일을 읽고 있습니다. 다른 파일을 선택하면 현재 작업을 취소합니다.':'파일을 놓거나 파일 선택 버튼을 누르세요.'}</p></div>
  <input ref={input} type="file" accept="audio/*" aria-label="오디오 파일" className="hidden" onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)onFileSelect(file);}}/>
 </Card>;
}
