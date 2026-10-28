let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

export function closeAudioContext() {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    sharedAudioContext.close();
    sharedAudioContext = null;
  }
}
