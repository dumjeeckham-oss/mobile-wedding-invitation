# INVITE-P2-B3-FIX2 사전 배포 검증 보고서

## A. EXECUTIVE SUMMARY

- 판정: **PARTIAL**
- 작업 브랜치: `p2/predeploy-verification`
- 기준 커밋: `839f12e1858093a64373067d18249f43fb0cea6a`
- 로컬 Worker + 로컬 D1 공개 조회, 관리자 로컬 테스트 저장소 화면, 기존 자동 검증을 확인했다.
- Production build와 기존 보안·데이터 보존 테스트는 통과했다.
- 다만 현재 브라우저 자동화 도구에서 네 개의 지정 viewport를 강제할 수 없었고, 실제 모바일 기기에서 지도 앱/YouTube 재생을 확인하지 못했다. 따라서 모바일 최종 PASS나 실제 서비스 배포 승인으로 판정하지 않는다.
- 원격 Cloudflare Pages, Worker, D1, Access, R2, DNS에는 변경이 없다.

## B. GITHUB SHA

- 시작 시 `p2/admin-integration-fix1` HEAD와 기준 SHA가 일치했다.
- 새 브랜치 `p2/predeploy-verification`을 생성했다.
- 현재 HEAD: `839f12e1858093a64373067d18249f43fb0cea6a`
- 기준 브랜치와 작업 트리는 시작 시 clean이었다.
- FIX2에서 제품 코드 변경은 없고, 이 보고서만 추가했다.

## C. 4 VIEWPORT RESULTS

| viewport | 결과 | 근거 |
|---|---|---|
| 360×800 | 미검증 | 현재 연결된 브라우저 자동화 API에 viewport 설정 기능이 없고 Playwright `webcmd` 실행 파일도 설치되어 있지 않음 |
| 390×844 | 미검증 | 동일 |
| 768×1024 | 미검증 | 동일 |
| 1440×900 | 미검증 | 동일 |

현재 브라우저에서 생성한 증거는 1280×720 창의 로컬 화면이다. 관리자 대시보드에서 행사 1건과 공개 1건이 표시되었고, 공개 초대장에서 합성 갤러리 2장·더보기·하단 로고가 접근성 트리에 나타났다. 지정 네 viewport의 스크린샷 파일과 overflow 측정값은 생성하지 못했으므로 이 항목은 PASS로 표시하지 않는다.

## D. ADMIN & D1 E2E

로컬 실행:

- Worker: `wrangler dev --local --port 8787 --persist-to .wrangler-local`
- Vite 관리자 로컬 테스트 화면: `http://127.0.0.1:5181/admin`
- 공개 화면: `http://127.0.0.1:5181/e/e2e-event`

확인 결과:

- 로컬 D1의 공개 합성 행사 `e2e-event` 조회: HTTP 200
- 공개 응답에 제목, 행사 유형, 주최자, 지도 설정, 폰트·테마, 갤러리 데이터가 포함됨
- 관리자 API 무인증 호출: HTTP 401 `unauthorized`
- 관리자 UI API 모드에서는 Access 환경변수가 없는 로컬 Worker가 fail-closed로 동작함
- 로컬 테스트 저장소 모드에서는 관리자 대시보드가 정상 렌더링되고 행사 1건을 표시함
- 실제 브라우저 화면에서 공개 행사 제목, Gallery, 합성 이미지 2장, 더보기, 행사 로고를 확인함

이 세션에서는 새 원격/로컬 데이터 쓰기를 추가하지 않았다. 이전 FIX1에서 수행한 합성 데이터 E2E의 저장·재조회·공개·비공개·복제·갤러리 보존 결과는 `docs/P2-B3-FIX1-REPORT.md`와 자동 테스트로 재사용했다.

## E. MAP / VIDEO REAL DEVICE STATUS

- 네이버 차량 길찾기: PENDING — 실제 모바일 기기/앱 이동 미확인
- 네이버 대중교통: PENDING — 실제 모바일 기기/앱 이동 미확인
- 카카오맵 차량 길찾기: PENDING — 실제 모바일 기기/앱 이동 미확인
- 카카오맵 대중교통: PENDING — 실제 모바일 기기/앱 이동 미확인
- 지도 앱 미설치 웹 fallback: 코드·URL 생성 검토만 완료, 실제 기기 미확인
- YouTube 일반 영상: PENDING — 실제 재생 미확인
- YouTube Shorts: PENDING — 실제 재생 미확인
- 삽입 제한 시 대체 링크: 코드 경로 검토만 완료, 실제 영상 정책 응답 미확인

링크가 열리는 것과 목적지·이동수단이 실제로 선택되는 것은 별도 검증 대상이다.

## F. SECURITY CHECKS

자동 테스트 `tests/p2-b2.test.ts`: **8/8 통과**.

- 잘못된/만료/이메일 불일치 관리자 인증 거부
- 공개 응답과 관리자 응답 분리
- 관리자 CORS의 명시적 로컬 Origin 정책
- 공개 DTO의 내부 필드 제외
- URL·payload 검증
- Preview token 만료·행사 바인딩
- 공개 행사 조회와 비공개 접근 제어 경로

추가 로컬 확인:

- `/api/admin/events` 무인증: 401
- 공개 `/api/public/events/e2e-event`: 200
- 공개 API의 `Access-Control-Allow-Origin: *`는 공개 읽기 API 정책이며, 관리자 API 인증 CORS와 분리된다.
- 로컬 테스트 인증 모드는 `VITE_ADMIN_REPOSITORY_MODE=local-test`일 때만 선택되는 구조이며, 운영 기본값은 Worker API다.
- 실제 Access 정책, Preview token의 원격 만료 동작, 동시 수정의 원격 경로는 미배포 상태이므로 운영 검증 전제는 아니다.

## G. CLOUDFLARE STAGING DESIGN

권장 격리 구성:

1. 기존 `invite-trial.pages.dev`는 그대로 유지한다.
2. 승인 후 별도 Pages 시험 프로젝트를 만들거나, 기존 프로젝트의 Preview만 사용한다. 기존 운영 상태 보존을 최우선하면 별도 프로젝트가 더 안전하다.
3. 시험용 Worker와 시험용 D1을 별도 이름으로 생성한다. 운영 DB와 binding을 공유하지 않는다.
4. `/e/*`와 정적 자산은 공개하고 `/admin` 및 `/api/admin/*`는 동일한 Access 애플리케이션 정책으로 보호한다.
5. 공개 초대장의 `/api/public/*`는 Access 뒤에 두지 않는다.
6. 관리자 API는 Worker에서 JWT issuer, audience, expiry, JWKS 서명, allowlist 이메일을 다시 검증한다. Access는 인증 경계이지 Worker 권한 검사를 대체하지 않는다.
7. 초기 이미지 운영은 외부 HTTPS URL을 우선하고, R2는 별도 승인 전 생성하지 않는다.

Cloudflare 문서상 Worker 자체 보호는 Worker 전체 또는 preview deployments에 Access를 연결할 수 있으므로, 실제 구성 시 `/api/admin/*` 보호 범위와 공개 API 예외를 반드시 확인한다. [Cloudflare Access application types](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/choose-application-type/)

## H. FREE-TIER COST ANALYSIS

공식 문서 기준 확인값:

- Pages Free: 월 500 builds, 동시 1 build, 사이트 20,000 files, 단일 파일 25 MiB, preview deployments 무제한. [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- Workers Free: 하루 100,000 requests, 요청당 CPU 10 ms, 메모리 128 MB. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- D1 Free: 계정당 10개 DB, DB당 500 MB, 계정 총 5 GB, DB 읽기 subrequest는 invocation당 50. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- D1 무료 한도 초과 시 2026-09-01부터 일일 row read/write 한도를 초과한 쿼리가 실패할 수 있으므로, 같은 계정의 다른 프로젝트와 공유되는 사용량을 별도 확인해야 한다. [D1 free-tier enforcement](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/)
- Cloudflare One Free는 50명 미만 팀/PoC 대상의 무료 플랜으로 안내된다. [Zero Trust pricing](https://www.cloudflare.com/plans/zero-trust-services/)

현재 계정의 실제 사용량·결제 설정·남은 한도는 이 로컬 작업에서 읽지 못했으므로 **미확인**이다. 초기 계획은 R2·유료 API·Workers Paid를 사용하지 않는 것이며, 초과 시 새 기능보다 사용량 계측과 배포 중단을 우선한다.

## I. DEPLOYMENT / ROLLBACK PLAN

별도 승인을 받은 뒤에만 실행한다.

1. Git 브랜치와 SHA, clean 상태 확인
2. 시험용 Pages/Worker/D1 리소스 존재 여부 확인 후 신규 리소스 생성
3. 시험 D1에 migration 적용 및 schema 확인
4. Worker 변수·secret을 Dashboard/Wrangler secret으로 설정하고 소스에는 저장하지 않음
5. Access 애플리케이션을 `/admin`과 관리자 API 범위에만 적용하고 allowlist를 확인
6. Pages를 시험 저장소/브랜치에 연결하고 `npm run build`, output `dist` 설정
7. 관리자 로그인, CRUD, 공개/비공개, preview, 갤러리·로고·지도·영상 점검
8. 공개 `/e/{slug}` 새로고침과 404/비공개 차단 확인
9. 배포 SHA와 Worker/D1/Pages 리소스 이름 기록
10. 실패 시 Pages/Worker 버전은 이전 배포로 되돌리되, 이미 D1에 기록된 데이터는 별도 백업·복구 절차로 처리한다. 코드 롤백은 DB 데이터 롤백을 의미하지 않는다.

## J. RELEASE BLOCKERS

- 네 개의 지정 viewport별 실제 스크린샷·overflow 측정 미완료
- 실제 모바일 기기에서 네이버/카카오 길찾기와 YouTube/Shorts 재생 미완료
- 현재 Cloudflare 계정의 실제 무료 사용량·결제 보호 설정 미확인
- 원격 Access 정책·시험 Worker·D1을 아직 만들지 않았으므로 원격 인증·배포 동작 미검증
- 외부 이미지 호스트의 실제 장애/추적 동작 미확인

## K. FINAL VERDICT

**PARTIAL**

로컬 코드 빌드, TypeScript, 기존 보안 테스트, 로컬 공개 API/관리자 fail-closed 동작, 브라우저 기반 관리자·공개 화면 렌더링은 확인했다. 하지만 사용자가 요구한 네 viewport의 실제 스크린샷과 모바일 기기 기반 지도·동영상 검증이 없으므로 Cloudflare 시험 배포 준비 완료(PASS)로 판정하지 않는다. 다음 단계는 원격 자원을 만들지 않고, viewport 가능한 브라우저 자동화와 실제 모바일 기기 검증을 먼저 확보하는 것이다.
