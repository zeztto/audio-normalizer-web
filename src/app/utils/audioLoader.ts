import { analyzeAudio } from './audioProcessor';
export const MAX_AUDIO_FILE_BYTES = 50 * 1024 * 1024;
export async function loadAudioFile(file: File, signal?: AbortSignal): Promise<AudioBuffer> {
    if (file.size === 0 || file.size > MAX_AUDIO_FILE_BYTES)
        throw new Error('오디오 파일은 0byte보다 크고 50MB 이하여야 합니다.');
    if (file.type && !file.type.startsWith('audio/'))
        throw new Error('오디오 파일을 선택해 주세요.');
    if (typeof AudioContext === 'undefined')
        throw new Error('Web Audio를 지원하는 최신 브라우저를 이용해 주세요.');
    signal?.throwIfAborted();
    let bytes: ArrayBuffer;
    try {
        bytes = await file.arrayBuffer();
    }
    catch {
        throw new Error('오디오 파일을 읽지 못했습니다.');
    }
    signal?.throwIfAborted();
    let context: AudioContext;
    try { context = new AudioContext(); } catch { throw new Error('오디오 읽기 기능을 시작하지 못했습니다.'); }
    const close = async () => { if (context.state !== 'closed')
        try {
            await context.close();
        }
        catch { /* 이미 종료된 context의 cleanup은 다시 시도하지 않습니다. */ } };
    const abort = () => { void close(); };
    signal?.addEventListener('abort', abort, { once: true });
    try {
        const decoded = await context.decodeAudioData(bytes);
        signal?.throwIfAborted();
        analyzeAudio(decoded);
        return decoded;
    }
    catch (error) {
        if (signal?.aborted)
            throw signal.reason;
        if (error instanceof Error && /지원 범위|샘플|채널 길이/.test(error.message))
            throw error;
        throw new Error('오디오를 decode하지 못했습니다. 브라우저가 지원하는 파일인지 확인해 주세요.');
    }
    finally {
        signal?.removeEventListener('abort', abort);
        await close();
    }
}
