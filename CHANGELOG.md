# 변경 기록

## 0.1.0 — 2026. 10. 28.

- 브라우저 decode → Peak·RMS gain → 원본/결과 재생 → PCM16·PCM24 WAV 저장 흐름을 정리했습니다.
- 근사 LUFS와 외부 FFmpeg codec 경로를 제외하고 실제 지원하는 입력·출력 범위를 맞췄습니다.
- 무음·유한 sample·출력 peak 제한, RIFF padding·signed PCM, 출력 샘플레이트와 오류 처리를 보완했습니다.
- 새 파일·취소·비동기 처리의 이전 결과를 폐기하고 seek·재생 context·Blob URL cleanup을 수정했습니다.
- 한국어 조작 이름과 metadata, 권리 고지, 자동 회귀·독립 WAV 검사·CI를 추가했습니다.
- 짧은 clip과 나누어떨어지지 않는 길이의 파형에서도 마지막 sample을 포함하도록 가로 구간을 비율로 계산하고, 짧은 clip의 sample 반복 표시를 명시했습니다.
