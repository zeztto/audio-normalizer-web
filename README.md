# 오디오 노멀라이저

최종 갱신: 2026. 10. 28.

오디오 파일을 브라우저에서 decode하고 Peak 또는 RMS 레벨을 조정해 PCM16·PCM24 WAV로 저장하는 도구입니다. 파일을 서버로 보내거나 브라우저 저장소에 기록하지 않습니다. 새로고침하면 작업이 사라집니다.

## 사용

1. 오디오 파일을 선택하거나 끌어 놓습니다. 브라우저가 decode한 채널 수·샘플레이트·길이와 첫 채널 파형을 확인합니다.
2. 피크(Peak) 또는 실효값(RMS)과 목표 dBFS를 고르고 **노멀라이즈 적용**을 누릅니다.
3. 원본·처리 결과를 선택해 재생하고 현재 결과의 실제 Peak·RMS를 확인합니다. 재생 음량은 저장 파일의 gain을 바꾸지 않습니다.
4. 비트 깊이와 출력 샘플레이트를 선택해 **WAV 다운로드**를 누릅니다. 처리 전에도 decode한 원본을 WAV로 변환할 수 있습니다.

새 파일 선택은 이전 작업을 취소하고 결과를 지웁니다. 설정값만 바꾸면 현재 결과는 다시 처리되지 않으며, 결과에는 마지막으로 실제 적용한 방식과 목표가 표시됩니다.

## 지원 범위와 한계

- 입력은 0byte 초과·50MiB 이하이며, MIME이 있으면 `audio/*`여야 합니다. 실제 입력 codec 지원은 브라우저에 따릅니다. decode 과정에서 브라우저의 AudioContext 샘플레이트로 변환될 수 있으며 화면에는 decode된 값을 표시합니다. 파형은 첫 채널의 비율 구간을 표시하며, 샘플 수가 가로 픽셀보다 적으면 같은 샘플을 반복해 표시합니다.
- decode 이후 허용하는 범위는 1~32채널, 3,000~384,000Hz, 채널 합산 60,000,000 samples 이하입니다. 압축 파일의 decode 메모리를 사전에 정확히 알 수 없으므로 이 한도가 브라우저 decode 중의 자원 사용까지 보장하지 않습니다. 긴 파일은 짧게 나누어 사용하세요.
- Peak 목표는 −20~0dBFS, RMS 목표는 −30~−6dBFS입니다. 전체 파형에 같은 gain을 적용하며 증폭은 최대 +20dB, 출력 peak는 0dBFS 이하로 제한합니다. 큰 peak를 가진 파일은 RMS 목표에 도달하지 못할 수 있고 그 경우 화면에 안내합니다. 무음은 그대로 유지하며 NaN·Infinity sample은 거부합니다.
- RMS는 전체 채널의 sample 제곱평균입니다. LUFS·방송 표준 loudness·true peak·리미터·멀티밴드 처리는 제공하지 않습니다.
- 출력은 signed PCM16 또는 PCM24 little-endian WAV입니다. 샘플레이트는 decode된 원본 또는 44.1/48/88.2/96/192kHz 중 선택합니다. 브라우저가 해당 OfflineAudioContext 구성을 지원해야 하며 resampling은 Web Audio에서 수행합니다. 출력 sample 한도도 60,000,000입니다.
- 원본에 PCM 범위를 넘는 sample이 있으면 직접 WAV 변환을 거부합니다. 먼저 Peak를 낮춰 노멀라이즈하세요. sample 변환에는 양자화 오차가 있고 dither는 적용하지 않습니다.
- FFmpeg·외부 codec CDN·MP3/AAC/FLAC 내보내기는 포함하지 않습니다. 자동 외부통신은 없으며 현재 origin의 정적 asset과 로컬 Blob 다운로드만 사용합니다.
- 최신 Web Audio 지원 브라우저가 필요합니다. 브라우저·장치별 decode/resampling 차이가 있을 수 있으며 전문 음향 측정 장비를 대체하지 않습니다.

## 개발과 검증

Node.js 22.12 이상과 npm을 사용합니다. 독립 WAV decoder 자동 회귀에는 `python3`의 표준 `wave` 모듈이 필요하며 추가 Python package는 없습니다.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=high
npm run preview -- --host 127.0.0.1
```

자동 회귀는 무음·유한 sample·gain/클리핑 제한·bit depth·RIFF header·독립 signed-PCM decode·sample rate·실제 React hook/player의 새 파일 경쟁/seek/cleanup과 Blob URL 회수를 검사합니다. Node 환경의 Web Audio adapter는 결정적인 회귀를 위한 test model이며 실제 브라우저의 decode·DSP·재생 검증을 대신하지 않습니다. 실제 파일·녹음·생성 WAV·QA screenshot은 source에 포함하지 않습니다.

CI는 Node.js 22/Ubuntu에서 위 npm 검증을 수행합니다. 작성자 코드와 포함 component의 권리는 [LICENSE](LICENSE)와 [ATTRIBUTIONS.md](ATTRIBUTIONS.md)를 참고하세요.
