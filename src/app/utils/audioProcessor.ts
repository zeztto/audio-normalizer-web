function createOfflineContext(channels: number, length: number, rate: number): OfflineAudioContext {
    try { return new OfflineAudioContext(channels, length, rate); }
    catch { throw new Error('오디오 처리 기능을 시작하지 못했습니다.'); }
}
async function renderOffline(context: OfflineAudioContext): Promise<AudioBuffer> {
    try { return await context.startRendering(); }
    catch { throw new Error('오디오 처리에 실패했습니다. 다른 설정으로 다시 시도해 주세요.'); }
}
export type NormalizationType = 'peak' | 'rms';
export interface AudioMetrics {
    peak: number;
    rms: number;
    peakLinear: number;
    rmsLinear: number;
}
export const MAX_AUDIO_SAMPLES = 60000000;
export function analyzeAudio(buffer: AudioBuffer): AudioMetrics {
    if (!Number.isInteger(buffer.numberOfChannels) || buffer.numberOfChannels < 1 || buffer.numberOfChannels > 32 || !Number.isInteger(buffer.length) || buffer.length < 1 || buffer.length * buffer.numberOfChannels > MAX_AUDIO_SAMPLES || !Number.isInteger(buffer.sampleRate) || buffer.sampleRate < 3000 || buffer.sampleRate > 384000)
        throw new Error('오디오의 채널·길이·샘플레이트가 지원 범위를 벗어났습니다.');
    let peak = 0, sum = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        if (data.length !== buffer.length)
            throw new Error('오디오 채널 길이가 일치하지 않습니다.');
        for (const sample of data) {
            if (!Number.isFinite(sample))
                throw new Error('유효하지 않은 오디오 샘플이 포함되어 있습니다.');
            peak = Math.max(peak, Math.abs(sample));
            sum += sample * sample;
        }
    }
    const rms = Math.sqrt(sum / (buffer.length * buffer.numberOfChannels));
    return { peak: peak ? 20 * Math.log10(peak) : -Infinity, rms: rms ? 20 * Math.log10(rms) : -Infinity, peakLinear: peak, rmsLinear: rms };
}
export function normalizationGain(buffer: AudioBuffer, type: NormalizationType, target: number) {
    const metrics = analyzeAudio(buffer);
    const range = type === 'peak' ? [-20, 0] : type === 'rms' ? [-30, -6] : null;
    if (!range || !Number.isFinite(target) || target < range[0] || target > range[1])
        throw new Error('정규화 방식 또는 목표 레벨이 올바르지 않습니다.');
    if (metrics.peakLinear === 0)
        return { requested: 1, applied: 1, limited: false, silent: true };
    const requested = Math.pow(10, (target - (type === 'peak' ? metrics.peak : metrics.rms)) / 20);
    const applied = Math.min(requested, 10, 1 / metrics.peakLinear);
    return { requested, applied, limited: applied < requested * (1 - 1e-10), silent: false };
}
export async function normalizeAudio(buffer: AudioBuffer, type: NormalizationType, target: number): Promise<AudioBuffer> {
    const plan = normalizationGain(buffer, type, target);
    if (typeof OfflineAudioContext === 'undefined')
        throw new Error('Web Audio를 지원하는 최신 브라우저를 이용해 주세요.');
    const context = createOfflineContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = plan.applied;
    source.connect(gain);
    gain.connect(context.destination);
    source.start(0);
    const result = await renderOffline(context);
    for (let channel = 0; channel < result.numberOfChannels; channel++) {
        const data = result.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            if (!Number.isFinite(data[i]))
                throw new Error('오디오 처리 결과가 올바르지 않습니다.');
            data[i] = Math.max(-1, Math.min(1, data[i]));
        }
    }
    return result;
}
export async function resampleAudioBuffer(buffer: AudioBuffer, targetRate: number): Promise<AudioBuffer> {
    analyzeAudio(buffer);
    if (!Number.isInteger(targetRate) || targetRate < 3000 || targetRate > 384000)
        throw new Error('출력 샘플레이트가 올바르지 않습니다.');
    const length = Math.max(1, Math.round(buffer.length * targetRate / buffer.sampleRate));
    if (length * buffer.numberOfChannels > MAX_AUDIO_SAMPLES)
        throw new Error('출력 오디오 길이가 지원 한도를 넘습니다.');
    const context = createOfflineContext(buffer.numberOfChannels, length, targetRate), source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    return renderOffline(context);
}
export async function audioBufferToWav(buffer: AudioBuffer, bitDepth = 16, targetSampleRate?: number): Promise<Blob> {
    if (bitDepth !== 16 && bitDepth !== 24)
        throw new Error('PCM16 또는 PCM24만 지원합니다.');
    analyzeAudio(buffer);
    if (targetSampleRate !== undefined && (!Number.isInteger(targetSampleRate) || targetSampleRate < 3000 || targetSampleRate > 384000))
        throw new Error('출력 샘플레이트가 올바르지 않습니다.');
    const audio = targetSampleRate !== undefined && targetSampleRate !== buffer.sampleRate ? await resampleAudioBuffer(buffer, targetSampleRate) : buffer;
    const metrics = analyzeAudio(audio);
    if (metrics.peakLinear > 1 + 1e-6)
        throw new Error('PCM 범위를 넘는 샘플이 있습니다. 피크를 낮춰 노멀라이즈한 뒤 다시 시도해 주세요.');
    const bytesPerSample = bitDepth / 8, channels = audio.numberOfChannels, blockAlign = channels * bytesPerSample, dataLength = audio.length * blockAlign, padding = dataLength % 2;
    const output = new ArrayBuffer(44 + dataLength + padding), view = new DataView(output);
    const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i++)
        view.setUint8(offset + i, value.charCodeAt(i)); };
    text(0, 'RIFF');
    view.setUint32(4, 36 + dataLength + padding, true);
    text(8, 'WAVE');
    text(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, audio.sampleRate, true);
    view.setUint32(28, audio.sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    text(36, 'data');
    view.setUint32(40, dataLength, true);
    const data = Array.from({ length: channels }, (_, channel) => audio.getChannelData(channel));
    let offset = 44;
    for (let frame = 0; frame < audio.length; frame++)
        for (let channel = 0; channel < channels; channel++) {
            const sample = Math.max(-1, Math.min(1, data[channel][frame]));
            if (bitDepth === 16) {
                view.setInt16(offset, Math.round(sample * (sample < 0 ? 0x8000 : 0x7fff)), true);
                offset += 2;
            }
            else {
                const value = Math.round(sample * (sample < 0 ? 0x800000 : 0x7fffff));
                view.setUint8(offset, value & 255);
                view.setUint8(offset + 1, (value >> 8) & 255);
                view.setUint8(offset + 2, (value >> 16) & 255);
                offset += 3;
            }
        }
    return new Blob([output], { type: 'audio/wav' });
}
export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    try {
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
    }
    finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
