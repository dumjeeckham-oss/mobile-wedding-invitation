# INVITE-P2-B3-FIX3 검증 보고서

## A. EXECUTIVE SUMMARY

- 판정: **PASS (viewport 검증 범위)** / **PARTIAL (전체 릴리스 준비)**
- 브랜치: `p2/viewport-final-verification`
- 기준 SHA: `4e2e2cf08dcd6ed0bbadf3cc79ab9ee63d096529`
- Chrome DevTools Protocol을 사용해 추가 의존성 설치 없이 네 viewport를 실제 브라우저에 적용했다.
- 관리자와 공개 초대장 각각 4개 화면의 PNG·JSON 측정 증거를 저장했다.
- 원격 Cloudflare 리소스는 생성하거나 변경하지 않았다.

## B. GITHUB SHA

- 시작 기준 브랜치: `p2/predeploy-verification`
- 시작 HEAD: `4e2e2cf08dcd6ed0bbadf3cc79ab9ee63d096529`
- 작업 브랜치: `p2/viewport-final-verification`
- 변경 예정 파일: CDP 검증 스크립트, viewport 증거, 본 보고서, 중간 산출물 ignore 규칙

## C. VIEWPORT TEST ENVIRONMENT

- 브라우저: 설치된 Google Chrome headless
- 자동화: Node 내장 WebSocket + Chrome DevTools Protocol
- 프론트: Vite `http://127.0.0.1:5182`
- API: 로컬 Wrangler Worker `http://127.0.0.1:8787`
- 데이터: 로컬 D1 `.wrangler-local`
- 관리자 화면: `VITE_ADMIN_REPOSITORY_MODE=local-test`
- 공개 화면: Worker 공개 API 조회
- 스크립트: [viewport-cdp.mjs](../scripts/viewport-cdp.mjs)

## D. 4 VIEWPORT SCREENSHOTS

측정 JSON과 PNG는 [최종 viewport 증거 폴더](../artifacts/p2-b3-fix3/viewports-final/)에 저장했다.

| 화면 | viewport | scrollWidth / clientWidth | 가로 넘침 | 주요 증거 |
|---|---:|---:|---|---|
| 관리자 | 360×800 | 360 / 360 | 없음 | heading, 6 buttons |
| 공개 | 360×800 | 345 / 345 | 없음 | heading, gallery, 3 images, 1 iframe, 지도 4링크 |
| 관리자 | 390×844 | 390 / 390 | 없음 | heading, 6 buttons |
| 공개 | 390×844 | 375 / 375 | 없음 | heading, gallery, 3 images, 1 iframe, 지도 4링크 |
| 관리자 | 768×1024 | 768 / 768 | 없음 | heading, 6 buttons |
| 공개 | 768×1024 | 753 / 753 | 없음 | heading, gallery, 3 images, 1 iframe, 지도 4링크 |
| 관리자 | 1440×900 | 1440 / 1440 | 없음 | heading, 6 buttons |
| 공개 | 1440×900 | 1425 / 1425 | 없음 | heading, gallery, 3 images, 1 iframe, 지도 4링크 |

공개 화면의 clientWidth가 viewport보다 15px 작은 것은 세로 스크롤바 영역이며, `scrollWidth === clientWidth`이므로 수평 overflow는 없다.

## E. ADMIN UI RESULTS

- 대시보드 heading과 행사 목록 표시: 확인
- 행사 관리·단체 관리·로고 관리·디자인 설정 메뉴 버튼: 확인
- 360px 화면에서도 버튼과 행사 카드가 잘리지 않음: 확인
- local-test 저장소를 통한 화면 검증임을 명시한다.
- API 모드의 관리자 저장 흐름은 별도 Access 설정 없이는 401로 fail-closed되며, 운영 저장 성공으로 간주하지 않았다.

## F. PUBLIC INVITATION RESULTS

합성 행사 `e2e-event`에 로컬 D1에서 다음 표시 데이터를 사용했다.

- 행사명·주최자·소개 문구
- 갤러리 이미지 2장과 로고 1장
- 네이버 대중교통/차량, 카카오 대중교통/차량 링크 4개
- YouTube 영상 iframe 1개와 대체 링크
- 지도 주소·교통·주차 안내

네 viewport 모두에서 행사 제목, 갤러리, 지도 섹션, iframe, 로고가 렌더링되었고 수평 overflow가 없었다. 지도 앱 실제 실행과 YouTube 외부 서비스의 실제 재생 성공 여부는 브라우저 렌더링 검증과 별도의 항목으로 남긴다.

## G. API & D1 REGRESSION

- `npm run build`: 성공
- Worker TypeScript 검사: 성공
- `tests/p2-b2.test.ts`: 8/8 통과
- 무인증 `/api/admin/events`: 401
- 공개 `/api/public/events/e2e-event`: 200
- 로컬 D1에서 `synthetic-event`를 일시적으로 private으로 전환한 뒤 공개 API: 404
- 검증 후 `synthetic-event` 상태를 public으로 복구
- 기존 gallery·logo·theme 데이터는 공개 응답과 화면에 유지

## H. SECURITY RESULTS

- 기존 Access JWT, issuer/audience/expiry, allowlist 검증 테스트: 8/8 회귀 통과
- 관리자 API 인증 실패: 401 확인
- 공개·관리자 API 분리: 유지
- 비공개 행사 공개 접근: 404 확인
- 로컬 테스트 인증은 브라우저 로컬 실행에만 사용했으며 운영 번들에 포함하지 않았다.
- Cloudflare Access 정책과 실제 모바일 기기 인증은 원격 자원 미생성으로 미검증이다.

## I. STAGING RESOURCE PLAN

승인 후 권장 이름:

- Pages: `invite-p2-staging`
- Worker: `invite-p2-staging-api`
- D1: `invite-p2-staging-db`

구성:

1. 기존 `invite-trial.pages.dev`와 운영 브랜치는 유지한다.
2. 시험 Worker와 D1은 별도 binding과 migration을 사용한다.
3. `/admin` 및 `/api/admin/*`만 Access allowlist로 보호한다.
4. `/e/*`, 정적 자산, `/api/public/*`는 공개로 둔다.
5. Pages same-origin `/api/*` 라우팅을 우선하고, Worker API가 정적 SPA fallback보다 먼저 처리되도록 한다.
6. 환경변수·JWKS·Access 관련 값은 Cloudflare Secrets에 저장하고 Git에 기록하지 않는다.
7. SPA 새로고침은 Pages `_redirects` 또는 Workers Static Assets 라우팅으로 `/index.html` fallback을 설정한다.

## J. REMAINING BLOCKERS

- 실제 모바일 기기에서 네이버·카카오 앱이 열리고 이동수단이 선택되는지 미검증
- 실제 YouTube 영상/Shorts 재생 및 삽입 제한 응답 미검증
- 현재 Cloudflare 계정의 실제 사용량·결제 보호 설정 미확인
- 원격 Access·Worker·D1 생성 및 배포는 별도 승인 필요

## K. FINAL VERDICT

**Viewport 검증은 PASS**다. 지정된 4개 viewport에서 관리자·공개 화면의 실제 측정값과 스크린샷을 모두 확보했고 수평 overflow가 없었다.

**전체 시험 배포 최종 준비는 PARTIAL**이다. 실제 모바일 앱/YouTube 동작과 원격 Cloudflare Access·자원 검증이 남아 있으므로, 별도 승인 전에는 원격 배포하지 않는다.
