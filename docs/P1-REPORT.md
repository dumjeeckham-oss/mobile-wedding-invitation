# INVITE-P1 분석 및 시험 배포 보고서

## 범위

이 브랜치는 `heejin-hwang/mobile-wedding-invitation`의 MIT 라이선스 원본을
Fork한 뒤, 정적 Vite 앱을 Cloudflare Pages에 시험 배포하기 위한 최소 변경만
포함한다. 관리자·다중 행사·참석 확인·데이터베이스는 구현하지 않는다.

## 원본 구조 및 기능 분류

- `src/App.tsx`: 메인, 안내문, 갤러리, 계좌, 위치, 방명록, 하단 액션바 조합 — KEEP
- `src/data.json`: 행사 데이터 단일 정적 JSON — CONFIG
- `src/assets/images` 및 `public`: 번들/정적 이미지 — KEEP
- `react-photoswipe-gallery`: 사진 갤러리 — KEEP
- `react-kakao-maps-sdk`: 카카오 지도 — CONFIG; 키가 없으면 안내 문구로 DISABLE
- `FloatingBar`: 좋아요(confetti), 주소 복사, 상단 이동 — KEEP
- 계좌 복사 및 KakaoPay/Toss 링크 — CONFIG
- Firebase: SDK 설정은 비어 있고 실제 저장 호출은 주석 처리 — DISABLE/LATER
- 방명록: 입력 UI만 있고 저장 호출은 주석 처리 — LATER

## 보안 및 비용 확인

- 저장소에서 실제 API 키나 Firebase 자격증명은 확인되지 않았다.
- `VITE_*` 값은 Vite 빌드 결과에 포함되므로 비밀값을 넣으면 안 된다. 카카오
  JavaScript 키는 도메인 제한을 설정하고 공개 키로만 사용한다.
- 원본 `package-lock.json` 기준 설치 시 오래된 ESLint 관련 npm deprecated 경고가
  있으나, P1에서는 동작 보존을 위해 대규모 업데이트를 하지 않는다.
- 방명록/좋아요를 활성화하려면 Firebase 같은 외부 저장소와 개인정보·스팸
  대응 설계가 필요하므로 P2 이후로 미룬다.

## Cloudflare Pages 시험 배포

Cloudflare Pages의 Git 연동 정적 배포를 우선 사용한다. 이 앱은 서버 런타임,
라우팅 함수, D1/R2/KV가 필요 없고 `npm run build`의 산출물 `dist`만 제공하면
되므로 원본 변경이 가장 적다.

권장 설정:

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 저장소의 lockfile과 호환되는 LTS 버전
- Environment variable: 선택적으로 `VITE_APP_KAKAOMAP_JAVASCRIPT_KEY`

키가 없을 때도 나머지 초대장은 표시되며, 지도 섹션은 안전한 안내 상태로
표시된다. 기존 Cloudflare 프로젝트·DNS·D1/R2/KV는 사용하지 않는다.

## P2 최소 수정안

1. `src/data.json`을 행사 공통 스키마로 유지하고 결혼식 전용 필드를 선택값으로
   분리한다.
2. 행사명·주최자·일시·장소·이미지·문구·연락처·테마·공유 메타데이터를 설정
   레이어로 이동한다.
3. 관리자 1명 인증과 행사 CRUD를 추가하되, 공개 초대장은 읽기 전용으로
   유지한다.
4. 행사별 공개 상태와 응답 저장을 추가한 뒤에만 방명록/참석 확인을 활성화한다.
5. 디자인 컴포넌트는 그대로 재사용하고, 결혼식 전용 섹션은 설정에 따라 숨긴다.

## 검증 기록

- `npm ci`: lockfile 기준 설치; npm deprecated 경고만 확인
- `npm run build`: TypeScript 및 Vite production build 성공
- 라이선스: `LICENSE` 보존
- 미실행: Cloudflare 계정 권한/프로젝트 생성 및 실제 브라우저 자동화 검증은
  계정 세션과 시험 프로젝트 선택이 필요하다.

## P1-FIX2 공개 데모 전환

- 실제 인물·장소·연락처·계좌 정보가 없는 가상 행사 문구로 `src/data.json`과
  `index.html`을 교체했다.
- 기존 사진과 썸네일·배경은 공개 트리에서 제거하고, 자체 제작 추상 이미지 4종을
  갤러리 12개 슬롯과 썸네일·배경에 사용했다.
- 계좌 섹션, 외부 지도 링크, 캘린더 등록은 공개 데모에서 비활성화했다.
- 갤러리 레이아웃과 PhotoSwipe 확대 기능은 유지했다.
- 원본 Git 이력은 재작성하지 않았다. 원본 커밋에는 이전 샘플 콘텐츠가 남아
  있으므로, 공개 배포는 현재 브랜치의 최신 트리만 대상으로 한다.
- `npm audit --omit=dev`의 기존 취약점은 대부분 미사용 Firebase 및 전이 의존성에
  해당하고, 현재 정적 브라우저 번들에는 Firebase·gRPC·protobuf 코드가 없다.
  대규모 업데이트는 P2로 보류했다.
