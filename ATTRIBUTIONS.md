# 출처와 라이선스

- 앱 작성자 코드는 [MIT License](LICENSE)를 적용합니다.
- 포함된 shadcn/ui component는 MIT이며 전문은 [shadcn-ui.txt](THIRD_PARTY_LICENSES/shadcn-ui.txt)에 유지합니다.
- 번들하는 React·React DOM·Lucide의 원 license도 `THIRD_PARTY_LICENSES/`에 유지합니다. 나머지 설치 패키지는 각 package의 고지를 따릅니다.
- 이 edition은 FFmpeg wrapper·core·WASM·CDN codec을 포함하거나 불러오지 않습니다. 파일 decode는 사용 중인 브라우저의 Web Audio에 맡기며 모든 입력 codec 지원을 보장하지 않습니다.
- favicon과 metadata SVG는 이 edition에서 작성한 vector입니다. 사진·상용 음원·사용자 녹음·QA 산출물을 배포하지 않습니다.
- 자동 회귀의 신호는 수학적으로 생성한 test-only 값이며 실제 음원에서 가져오지 않았습니다. 독립 WAV 검사는 test 과정에서만 Python 표준 `wave` 모듈을 사용합니다. 제품은 Python이나 별도 codec 서버를 사용하지 않습니다.

- 실제 production JS module graph와 CSS 의존성의 전문 고지는 [THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt)에 보존합니다. build는 이를 `dist/THIRD_PARTY_NOTICES.txt`로 복사하므로 정적 hosting 시 함께 배포하세요. Apache-2.0 등 각 의존성의 권리는 앱 MIT와 구분됩니다.
