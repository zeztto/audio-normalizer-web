import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
interface Props {
    originalAudioBuffer: AudioBuffer | null;
    processedAudioBuffer: AudioBuffer | null;
}
export function AudioPlayer({ originalAudioBuffer, processedAudioBuffer }: Props) {
    const [playing, setPlaying] = useState(false), [time, setTime] = useState(0), [volume, setVolume] = useState(0.8), [muted, setMuted] = useState(false), [version, setVersion] = useState<'original' | 'processed'>('processed'), [error, setError] = useState('');
    const active = version === 'original' ? originalAudioBuffer : processedAudioBuffer ?? originalAudioBuffer;
    const bufferRef = useRef(active), levelRef = useRef({ volume, muted });
    bufferRef.current = active;
    levelRef.current = { volume, muted };
    const context = useRef<AudioContext | null>(null), source = useRef<AudioBufferSourceNode | null>(null), gain = useRef<GainNode | null>(null), started = useRef(0), offset = useRef(0), generation = useRef(0);
    const disconnect = useCallback(() => { const node = source.current; source.current = null; if (node) {
        node.onended = null;
        try {
            node.stop();
        }
        catch { /* 이미 끝난 source */ }
        node.disconnect();
    } gain.current?.disconnect(); gain.current = null; }, []);
    const stop = useCallback(() => { generation.current++; disconnect(); offset.current = 0; setTime(0); setPlaying(false); }, [disconnect]);
    useEffect(() => { stop(); }, [active, stop]);
    useEffect(() => () => { generation.current++; disconnect(); const current = context.current; context.current = null; if (current && current.state !== 'closed')
        void current.close().catch(() => { }); }, [disconnect]);
    const playFrom = useCallback(async (position: number) => {
        const buffer = bufferRef.current;
        if (!buffer)
            return;
        const request = ++generation.current;
        disconnect();
        setError('');
        try {
            const current = context.current ?? new AudioContext();
            context.current = current;
            if (current.state === 'suspended')
                await current.resume();
            if (request !== generation.current || bufferRef.current !== buffer || current.state === 'closed')
                return;
            const node = current.createBufferSource(), level = current.createGain();
            node.buffer = buffer;
            level.gain.value = levelRef.current.muted ? 0 : levelRef.current.volume;
            node.connect(level);
            level.connect(current.destination);
            const start = position >= buffer.duration ? 0 : Math.max(0, position);
            offset.current = start;
            started.current = current.currentTime;
            source.current = node;
            gain.current = level;
            node.onended = () => { if (source.current !== node || request !== generation.current)
                return; source.current = null; node.disconnect(); level.disconnect(); gain.current = null; offset.current = 0; setTime(0); setPlaying(false); };
            node.start(0, start);
            setTime(start);
            setPlaying(true);
        }
        catch {
            if (request === generation.current) {
                disconnect();
                setPlaying(false);
                setError('재생을 시작하지 못했습니다. 다시 시도해 주세요.');
            }
        }
    }, [disconnect]);
    const pause = useCallback(() => { const buffer = bufferRef.current; if (context.current && source.current) {
        offset.current = Math.min(buffer?.duration ?? 0, Math.max(0, context.current.currentTime - started.current + offset.current));
        generation.current++;
        disconnect();
        setTime(offset.current);
    } setPlaying(false); }, [disconnect]);
    useEffect(() => { if (!playing)
        return; let frame = 0; const update = () => { if (!source.current || !context.current)
        return; const duration = bufferRef.current?.duration ?? 0; const elapsed = context.current.currentTime - started.current + offset.current; if (elapsed >= duration) {
        stop();
        return;
    } setTime(elapsed); frame = requestAnimationFrame(update); }; frame = requestAnimationFrame(update); return () => cancelAnimationFrame(frame); }, [playing, stop]);
    const seek = (values: number[]) => { const buffer = bufferRef.current, position = values[0]; if (!buffer || !Number.isFinite(position))
        return; const wasPlaying = playing; if (wasPlaying)
        pause(); offset.current = Math.min(buffer.duration, Math.max(0, position)); setTime(offset.current); if (wasPlaying && offset.current < buffer.duration)
        void playFrom(offset.current); };
    const level = (value: number) => { if (!Number.isFinite(value))
        return; const next = Math.min(1, Math.max(0, value)); setVolume(next); levelRef.current = { volume: next, muted }; if (gain.current && !muted)
        gain.current.gain.value = next; };
    const toggleMute = () => { const next = !muted; setMuted(next); levelRef.current = { volume, muted: next }; if (gain.current)
        gain.current.gain.value = next ? 0 : volume; };
    const clock = (value: number) => `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
    return <Card className="p-6 space-y-4"><h2>오디오 재생</h2>{error && <p role="alert">{error}</p>}
  {processedAudioBuffer && <RadioGroup aria-label="재생 버전" value={version} onValueChange={value => { if (value === 'original' || value === 'processed') {
        stop();
        setVersion(value);
    } }}><div className="flex flex-wrap gap-4"><div className="flex gap-2 items-center"><RadioGroupItem value="original" id="play-original"/><Label htmlFor="play-original">원본</Label></div><div className="flex gap-2 items-center"><RadioGroupItem value="processed" id="play-processed"/><Label htmlFor="play-processed">노멀라이즈 적용</Label></div></div></RadioGroup>}
  <div className="flex gap-4 items-center"><Button type="button" aria-label={playing ? '일시정지' : '재생'} onClick={() => { if (playing)
        pause();
    else
        void playFrom(offset.current); }} disabled={!active}>{playing ? <Pause className="w-5 h-5"/> : <Play className="w-5 h-5"/>}</Button><div className="flex-1 min-w-0"><Slider aria-label="재생 위치" value={[time]} min={0} max={active?.duration || 1} step={0.01} onValueChange={seek} disabled={!active}/><p className="text-sm">{clock(time)} / {clock(active?.duration ?? 0)}</p></div></div>
  <div className="flex flex-wrap gap-3 items-center"><Button type="button" variant="outline" aria-label={muted ? '음소거 해제' : '음소거'} aria-pressed={muted} onClick={toggleMute}>{muted ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}</Button><div className="w-40 max-w-full"><Slider aria-label="재생 음량" value={[volume]} min={0} max={1} step={0.01} onValueChange={value => level(value[0])}/></div><span>{muted ? 0 : Math.round(volume * 100)}%</span></div>
 </Card>;
}
