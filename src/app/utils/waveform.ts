export interface WaveformColumn {
  low: number;
  high: number;
  rms: number;
}

/** Proportional sample buckets; short buffers use sample-and-hold display. */
export function buildWaveformColumns(samples: Float32Array, width: number): WaveformColumn[] {
  if (samples.length === 0 || !Number.isFinite(width) || width < 1) return [];
  const columns = Math.floor(width);
  return Array.from({length: columns}, (_, x) => {
    const start = Math.floor(x * samples.length / columns);
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((x + 1) * samples.length / columns)));
    let low = 0, high = 0, sum = 0;
    for (let i = start; i < end; i++) {
      const value = samples[i];
      low = Math.min(low, value);
      high = Math.max(high, value);
      sum += value * value;
    }
    return {low, high, rms: Math.sqrt(sum / (end - start))};
  });
}
