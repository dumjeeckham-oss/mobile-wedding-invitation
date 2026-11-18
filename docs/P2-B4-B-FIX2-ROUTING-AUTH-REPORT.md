# INVITE-P2-B4-B-FIX2 로컬 인증·라우팅 사전 구현 보고서

기준 브랜치: `p2/b4-staging-deploy`

기준 커밋: `d071550`

작업 브랜치: `p2/b4-staging-routing-auth`

## A. EXECUTIVE SUMMARY

- 판정: **LOCAL READY — CLOUD VALIDATION PENDING**
- production 브라우저 API 호출을 상대 경로 `/api/*`로 전환했다.
- Pages Functions용 fail-closed API proxy를 추가했다.
- 개발 환경에서는 명시된 API origin 또는 로컬 Worker proxy만 사용한다.
- production Worker URL이나 테스트 JWT를 production bundle에 포함하지 않았다.
- Cloudflare Pages·Worker·D1·Access에는 변경이 없다.

## B. BASELINE & BRANCH

- Repository: `dumjeeckham-oss/mobile-wedding-invitation`
- Base commit: `d071550`
- New branch: `p2/b4-staging-routing-auth`
- 기존 dirty 파일 `.wrangler-production-dry-run/`, `tmp/`, `wrangler.production.toml`은 수정·삭제·커밋하지 않았다.

## C. ROUTING IMPLEMENTATION

변경 사항:

- `src/apiBase.ts`
  - production에서는 항상 빈 base를 반환해 상대 `/api/*`를 사용한다.
  - 개발 모드에서만 `VITE_ADMIN_API_BASE_URL`을 허용한다.
- `functions/api/[[path]].ts`
  - Pages `/api/*` catch-all Function을 추가했다.
- `functions/apiProxy.ts`
  - `STAGING_API_ORIGIN`이 없거나 안전한 HTTPS/localhost origin이 아니면 503으로 종료한다.
  - GET/POST/PATCH/DELETE 메서드, query string, body, status code를 전달한다.
  - `Cf-Access-Jwt-Assertion`을 포함한 필요한 헤더만 전달한다.
  - production Worker로 fallback하지 않는다.
- `vite.config.ts`
  - 로컬 개발에서 `/api/*`를 `VITE_ADMIN_API_BASE_URL` 또는 `http://127.0.0.1:8787`로 proxy한다.

## D. ACCESS AUTH DESIGN

기존 Worker 인증 검증을 유지한다.

- RS256 서명
- JWKS key id
- issuer
- audience
- expiration
- 허용 관리자 이메일
- JWT 누락·위조·만료 시 401

Pages Function은 브라우저가 받은 Access JWT header를 staging Worker로 전달한다. Secret이나 JWT를 URL에 넣지 않는다.

Cloudflare Access 실제 정책은 로컬에서 생성·변경하지 않았다. `/admin` 및 `/api/admin/*` 보호, `/e/*` 및 `/api/public/*` 공개 설정은 원격 staging에서 별도 검증해야 한다.

## E. PUBLIC / ADMIN ISOLATION

| 경로 | 의도된 보호 |
|---|---|
| `/e/{slug}` | 공개 |
| `/api/public/*` | 공개, 공개 행사만 반환 |
| `/admin/*` | Access 보호 필요 |
| `/api/admin/*` | Access + Worker JWT 검증 |
| `/api/preview/*` | 만료·행사 바인딩 preview token 필요 |

Worker 전체를 Access로 보호해 공개 API를 차단하는 구성은 사용하지 않는다. 실제 Access path policy 또는 관리자 전용 hostname/Worker 구성은 Cloudflare에서 검증해야 한다.

## F. LOCAL AUTH TESTS

기존 `tests/p2-b2.test.ts`에서 다음을 재검증했다.

- 인증 누락: 차단
- 변조 JWT: 차단
- 만료 JWT: 차단
- issuer/audience 불일치: 차단
- 관리자 이메일 불일치: 차단
- 공개·관리자 API 경로 분리: 통과
- preview token 행사 바인딩·만료: 통과

실제 Cloudflare Access 로그인은 로컬에서 재현하지 않았으며 **CLOUD VALIDATION PENDING**이다.

## G. SAME-ORIGIN TESTS

로컬 Worker `127.0.0.1:8787`과 Vite 서버 `127.0.0.1:5176`을 사용했다.

- `/api/admin/events` 직접 호출: 401
- Vite 상대 `/api/admin/events`: Worker 401 전달
- `/api/public/events/does-not-exist` 직접 호출: 404
- Vite 상대 `/api/public/events/does-not-exist`: Worker 404 전달
- `/admin` HTML fallback: 200
- `/e/demo` HTML fallback: 200
- production Worker URL fallback: 없음

프록시 단위 테스트: 3/3 통과

- HTTPS/localhost origin allowlist
- unsafe URL·credential 포함 URL 차단
- path/query/method/body/Access JWT 전달
- API origin 미설정 시 503 fail-closed

## H. REGRESSION TESTS

- `npm run build`: 성공
- TypeScript: 성공
- Worker Function TypeScript 검사: 성공
- 기존 자동 테스트: 9/9 통과
- routing/auth 추가 테스트: 3/3 통과
- `git diff --check`: 성공
- dist에서 production Worker URL·`ADMIN_TEST_JWT` marker: 미검출
- 12종 배경, 사용자 지정 배경, 폰트·로고·갤러리 계약: 기존 테스트 통과

## I. DEPLOYMENT CONFIGURATION PLAN

승인 후 staging에서는 다음 환경 설정만 사용한다.

- Pages Function env: `STAGING_API_ORIGIN=https://invite-p2-staging-api.<workers-domain>`
- 관리자 Access 정책: `/admin/*`, `/api/admin/*`
- 공개 예외: `/e/*`, `/api/public/*`
- Worker Secret: Access issuer/audience/JWKS/allowlist 및 preview secret
- D1 binding: 신규 `invite-p2-staging-db`만 연결

환경변수 값과 Secret은 Git에 저장하지 않는다. Pages Function proxy가 production Worker로 연결되는 기본값은 제공하지 않는다.

## J. REMAINING CLOUD VALIDATION

다음은 원격 staging 생성 후에만 검증 가능하다.

- 실제 Cloudflare Access 로그인
- 실제 Access JWT가 Pages Function을 거쳐 Worker에서 검증되는지
- `/admin` 및 `/api/admin/*` path 보호
- 공개 `/e/*`, `/api/public/*` 비로그인 접근
- Preview token과 비공개 행사 정보 차단
- 실제 Pages Function 배포 및 same-origin HTTPS

## K. EXISTING RESOURCE PROTECTION

이번 단계에서 다음 원격 리소스를 변경하지 않았다.

- `invite-trial`
- `invite-p2-production`
- `invite-p2-api`
- 기존 D1 4개
- 기존 Access 정책
- DNS, R2, GitHub Workflow

## L. FINAL VERDICT

**LOCAL READY — CLOUD VALIDATION PENDING**

로컬 same-origin proxy와 인증 경계 사전 구현은 완료됐다. 실제 Cloudflare Access 정책·Pages Function·staging Worker 연결은 원격 배포 승인 후에만 검증할 수 있으며, 그 전에는 운영 준비 완료로 판정하지 않는다.
