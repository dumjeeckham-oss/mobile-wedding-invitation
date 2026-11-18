# INVITE-P2-B3-FEATURE1 결과 보고서

## A. EXECUTIVE SUMMARY

- 판정: **PASS (로컬 구현·검증)**
- 작업 브랜치: `p2/custom-background`
- 기준 SHA: `7389c4e4ba6e351a0f1c411212de30afa5b22ac0`
- 기존 12종 프리셋을 유지하면서 행사별 외부 HTTPS 배경 URL, 표시 방식, 위치, 오버레이, fallback 색상을 추가했다.
- 파일 업로드는 PNG/JPEG/WebP·2MiB·실제 이미지 디코딩을 로컬에서 검증하고, 영구 저장은 수행하지 않는다.
- URL 테마 JSON을 로컬 D1에 저장하고 공개 API 재조회 및 화면 렌더링까지 확인했다.
- 원격 Cloudflare Pages, Worker, D1, Access, R2에는 변경이 없다.

## B. BRANCH & SHA

- 신규 브랜치: `p2/custom-background`
- 기준 브랜치: `p2/viewport-final-verification`
- 기준 HEAD 일치 확인: `7389c4e4ba6e351a0f1c411212de30afa5b22ac0`
- 주요 변경 파일:
  - `src/admin/types.ts`
  - `src/admin/validation.ts`
  - `src/admin/repository.ts`
  - `src/admin/AdminApp.tsx`
  - `src/admin/EventPublic.tsx`
  - `worker/validation.ts`
  - `tests/p2-b2.test.ts`
  - `scripts/viewport-cdp.mjs`

## C. CUSTOM BACKGROUND UI

관리자 행사 편집기의 배경 디자인 영역에 다음을 추가했다.

- 기본 배경 12종
- 외부 HTTPS 이미지 URL
- 이미지 파일 업로드
- `cover` / `contain`
- `top` / `center` / `bottom`
- 오버레이 0~80%
- fallback 색상
- 실시간 미리보기

로컬 관리자 화면에서 배경 소스, 12종 프리셋, 표시 방식, 기준 위치, 오버레이 슬라이더, fallback 색상 컨트롤을 접근성 트리와 화면으로 확인했다.

## D. IMAGE SPECIFICATION GUIDANCE

관리자 화면에 다음 안내를 표시한다.

- 모바일 권장 1080×1920px
- 고해상도 1440×2560px
- 가로형 1920×1080px
- WebP/JPG/PNG
- 권장 500KB 이하, 최대 2MB
- 세로 9:16 권장
- 중요한 글자·로고는 이미지에 직접 삽입하지 않도록 안내

파일 업로드는 로컬 미리보기와 `Image` 디코딩을 거치며, 저장 시에는 파일을 서버 자산으로 가장하지 않는다. 업로드 source는 서버 저장 전에 preset fallback으로 정규화되고 안내 메시지를 표시한다.

## E. URL VALIDATION

클라이언트와 Worker에서 모두 검사한다.

- HTTPS만 허용
- `javascript:`, `data:`, `file:` 차단
- URL 2048자 제한
- username/password 포함 URL 차단
- localhost·127.0.0.1·::1 차단
- SVG 업로드 차단
- 임의 CSS/HTML/스크립트 입력 없음

외부 URL은 서버에서 다운로드하거나 프록시하지 않는다. 따라서 SSRF 경로는 도입하지 않았으며, 외부 이미지 호스트의 추적 가능성은 관리자 안내·운영 정책에서 별도로 고지해야 한다.

## F. THEME DATA PERSISTENCE

기존 `themeSettings`와 호환되도록 다음 필드를 지원한다.

```text
backgroundSourceType
backgroundPresetId
backgroundImageUrl
backgroundImageAssetId
backgroundFit
backgroundPosition
backgroundOverlayOpacity
backgroundFallbackColor
```

기존 데이터에는 `classic-ivory`, `cover`, `center`, fallback 색상을 자동 적용한다. URL 테마를 로컬 D1의 기존 JSON 필드에 기록한 뒤 Worker 공개 API 재조회 결과에서 동일한 값을 확인했다. D1 schema 변경이나 원격 migration은 필요하지 않다.

이미지 로딩 실패 시 CSS `background-color` fallback이 남으며, URL이 유효하지 않거나 source가 upload인데 영구 자산이 없으면 preset 배경을 사용한다.

## G. RESPONSIVE PREVIEW

기존 Chrome CDP viewport 스크립트를 재사용하여 URL 배경 테마를 적용한 합성 행사에서 관리자·공개 화면을 각각 측정했다.

증거: [FEATURE1 viewport evidence](../artifacts/p2-b3-feature1/viewports/)

| viewport | 관리자 | 공개 | 수평 overflow |
|---|---|---|---|
| 360×800 | 확인 | 확인 | 없음 |
| 390×844 | 확인 | 확인 | 없음 |
| 768×1024 | 확인 | 확인 | 없음 |
| 1440×900 | 확인 | 확인 | 없음 |

공개 화면에서 갤러리, 지도 링크 4개, YouTube iframe, 로고와 URL 배경 테마를 함께 확인했다.

## H. REGRESSION TESTS

- `npx --yes tsx tests/p2-b2.test.ts`: **9/9 통과**
- `npm run build`: 성공
- Worker TypeScript 검사: 성공
- `git diff --check`: 성공
- 기존 12종 배경 fallback 회귀: 통과
- 기존 폰트·로고·갤러리 데이터: build 및 공개 화면 회귀 없음
- URL 저장·D1 재조회: 통과
- 기존 공개 행사 데이터의 preset fallback: 통과

## I. COST IMPACT

- R2 생성 없음
- 원격 D1/Worker/Pages 변경 없음
- 외부 이미지 URL은 방문자 브라우저가 직접 요청하므로 추가 Cloudflare 저장 비용 없음
- 외부 이미지 호스트의 트래픽·가용성·추적 위험은 남아 있음
- 파일 업로드 영구 저장은 구현하지 않아 저장소 비용이 발생하지 않음

## J. REMAINING BLOCKERS

- 원격 Cloudflare 환경에서 URL 배경 저장·재조회 미검증
- 외부 이미지 호스트가 실제로 허용하는 MIME/리디렉션/핫링크 정책 미검증
- 파일 업로드 영구 저장소 미연결
- 실제 모바일 기기에서 긴 행사 페이지의 배경 성능 미검증
- 운영 배포 및 Access 정책 변경은 별도 승인 필요

## K. FINAL VERDICT

**PASS** — 승인된 로컬 구현 범위와 검증 기준을 충족했다.

단, 이는 신규 브랜치의 로컬 구현·검증 PASS이며, Cloudflare 운영 배포 PASS를 의미하지 않는다. 운영 배포는 별도 승인 후 진행해야 한다.
