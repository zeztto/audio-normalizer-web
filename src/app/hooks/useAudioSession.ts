import { useCallback, useEffect, useRef, useState } from 'react';
import { loadAudioFile } from '../utils/audioLoader';
import { audioBufferToWav, normalizeAudio, normalizationGain, analyzeAudio, downloadBlob, type NormalizationType } from '../utils/audioProcessor';
export function useAudioSession() {
    const [original, setOriginal] = useState<AudioBuffer | null>(null), [processed, setProcessed] = useState<AudioBuffer | null>(null), [name, setName] = useState(''), [error, setError] = useState<string | null>(null), [notice, setNotice] = useState('');
    const [applied, setApplied] = useState<{
        type: NormalizationType;
        target: number;
        limited: boolean;
        silent: boolean;
        peak: number;
        rms: number;
    } | null>(null);
    const [loading, setLoading] = useState(false), [processing, setProcessing] = useState(false), [exporting, setExporting] = useState(false);
    const epoch = useRef(0), normalizeId = useRef(0), exportId = useRef(0), controller = useRef<AbortController | null>(null), source = useRef<AudioBuffer | null>(null), result = useRef<AudioBuffer | null>(null), filename = useRef('audio');
    const reset = useCallback(() => { epoch.current++; normalizeId.current++; exportId.current++; controller.current?.abort(); controller.current = null; source.current = null; result.current = null; filename.current = 'audio'; setOriginal(null); setProcessed(null); setApplied(null); setName(''); setError(null); setNotice(''); setLoading(false); setProcessing(false); setExporting(false); }, []);
    useEffect(() => () => { epoch.current++; normalizeId.current++; exportId.current++; controller.current?.abort(); source.current = null; result.current = null; }, []);
    const load = useCallback(async (file: File) => {
        reset();
        const current = epoch.current, abort = new AbortController();
        controller.current = abort;
        setLoading(true);
        try {
            const buffer = await loadAudioFile(file, abort.signal);
            if (current !== epoch.current || abort.signal.aborted)
                return;
            const safeName = Array.from(file.name.replace(/\.[^/.]+$/, '').replace(/[/\\]/g, '_'), char => char.codePointAt(0)! < 32 || char.codePointAt(0) === 127 ? '_' : char).join('').slice(0, 128) || 'audio';
            filename.current = safeName;
            source.current = buffer;
            setOriginal(buffer);
            setName(safeName);
        }
        catch (error) {
            if (current === epoch.current && !abort.signal.aborted)
                setError(error instanceof Error ? error.message : '오디오를 읽지 못했습니다.');
        }
        finally {
            if (current === epoch.current) {
                setLoading(false);
                controller.current = null;
            }
        }
    }, [reset]);
    const normalize = useCallback(async (type: NormalizationType, target: number) => {
        const buffer = source.current;
        if (!buffer)
            return;
        const current = epoch.current, id = ++normalizeId.current;
        exportId.current++;
        setExporting(false);
        result.current = null;
        setProcessed(null);
        setApplied(null);
        setError(null);
        setNotice('');
        setProcessing(true);
        try {
            const gain = normalizationGain(buffer, type, target), normalized = await normalizeAudio(buffer, type, target);
            if (current !== epoch.current || id !== normalizeId.current || source.current !== buffer)
                return;
            result.current = normalized;
            setProcessed(normalized);
            const metrics = analyzeAudio(normalized);
            setApplied({ type, target, limited: gain.limited, silent: gain.silent, peak: metrics.peak, rms: metrics.rms });
            setNotice(gain.silent ? '무음은 레벨을 올리지 않고 그대로 유지했습니다.' : gain.limited ? '클리핑 방지 또는 최대 +20dB 증폭 한도로 목표보다 낮게 적용되었습니다.' : `${type === 'peak' ? '피크' : 'RMS'} 목표 ${target.toFixed(1)} dBFS를 적용했습니다.`);
        }
        catch (error) {
            if (current === epoch.current && id === normalizeId.current)
                setError(error instanceof Error ? error.message : '오디오 처리에 실패했습니다.');
        }
        finally {
            if (current === epoch.current && id === normalizeId.current)
                setProcessing(false);
        }
    }, []);
    const exportWav = useCallback(async (bits: number, rate: number) => {
        const buffer = result.current ?? source.current;
        if (!buffer)
            return;
        const current = epoch.current, id = ++exportId.current, base = filename.current, normalized = !!result.current;
        setError(null);
        setExporting(true);
        try {
            const blob = await audioBufferToWav(buffer, bits, rate);
            if (current !== epoch.current || id !== exportId.current || buffer !== (result.current ?? source.current))
                return;
            downloadBlob(blob, `${base}_${normalized ? 'normalized' : 'converted'}.wav`);
            setNotice(`PCM${bits} WAV 다운로드를 시작했습니다.`);
        }
        catch (error) {
            if (current === epoch.current && id === exportId.current)
                setError(error instanceof Error ? error.message : 'WAV를 내보내지 못했습니다.');
        }
        finally {
            if (current === epoch.current && id === exportId.current)
                setExporting(false);
        }
    }, []);
    return { original, processed, applied, name, error, notice, loading, processing, exporting, load, normalize, exportWav, reset };
}
