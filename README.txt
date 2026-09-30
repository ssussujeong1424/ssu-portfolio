PC-피그마 구현본

1. SETUP_ASSETS.bat 를 한 번 실행하세요.
   - Figma에서 읽은 원본 이미지/SVG를 img 폴더로 내려받습니다.
   - Figma MCP 이미지 주소는 임시 주소이므로 지금 받아 두는 것이 좋습니다.

2. VS Code에서 이 폴더를 열고 index.html을 Live Server로 실행하세요.

구현 기준
- PC: Figma PC-피그마 1920px 프레임의 좌표/폰트 크기/간격을 기준으로 배치
- Tablet: 1200px 이하에서 2열/세로 흐름으로 재배치
- Mobile: 767px 이하에서 대부분 1열 세로 흐름
- JS: 아직 효과 없음. js/script.js에 이후 요청 순서대로 추가

폰트
- Pretendard
- Cormorant Garamond
- Gowun Batang
