# INVITE-P2-B4-B-FIX3 Staging 배포 전 최종 게이트 보고서

기준 브랜치: `p2/b4-staging-routing-auth`

기준 SHA: `dd992b6560f922c1256f99b8fbb706a5ef9b0cc3`

작업 브랜치: `p2/b4-staging-final-gates`

## A. EXECUTIVE SUMMARY

- 최종 판정: **PARTIAL**
- 로컬 프록시 보안 보완과 검증은 완료했다.
- 기존 Cloudflare 리소스는 변경하지 않았다.
- 실제 Access 정책·Pages Function 배포·staging Worker 연결은 아직 검증하지 않았다.
- 따라서 READY FOR STAGING DEPLOYMENT가 아니라 원격 Cloud Validation Pending으로 판정한다.

## B. BASELINE

- Repository: `dumjeeckham-oss/mobile-wedding-invitation`
- Base: `dd992b6560f922c1256f99b8fbb706a5ef9b0cc3`
- 기존 미추적 `.wrangler-production-dry-run/`, `tmp/`, `wrangler.production.toml`은 보존하고 커밋하지 않았다.

## C. PAGES PROXY SECURITY

`functions/apiProxy.ts`를 점검·보완했다.

- `STAGING_API_ORIGIN`이 없으면 503
- HTTPS origin 또는 localhost HTTP만 허용
- URL credential, path, query, hash가 포함된 origin 거부
- Host, Cookie, 임의 헤더를 전달하지 않음
- `Accept`, `Content-Type`, `Cf-Access-Jwt-Assertion`만 전달
- GET/HEAD/POST/PATCH/DELETE/OPTIONS만 허용
- PUT/TRACE 등 기타 메서드는 405
- path와 query string은 그대로 전달
- request body 및 upstream status code 전달
- proxy 응답에 `Cache-Control: no-store` 강제
- production Worker fallback 없음

인증 헤더는 사용자가 직접 넣을 수 있는 입력으로 취급한다. 신뢰 경계는 Pages Function이 아니라 staging Worker이며, Worker가 서명·issuer·audience·expiry·allowlist를 재검증해야 한다.

## D. ACCESS AUTH BOUNDARY

로컬 코드 기준 경계:

- `/admin/*`: Cloudflare Access로 보호해야 함
- `/api/admin/*`: Access 보호 + Worker JWT 검증
- `/e/*`: 공개
- `/api/public/*`: 공개
- `/api/preview/*`: 행사 바인딩·만료 preview token 필요

Worker 전체 Access로 공개 API를 차단하는 구성은 사용하지 않는다. 실제 path 정책 적용이 불안정하면 관리자 전용 hostname 또는 별도 관리자 Worker를 사용한다.

실제 Cloudflare Access 정책은 생성·변경하지 않았다.

## E. WORKER DIRECT ACCESS SECURITY

기존 Worker 읽기 전용 확인:

- 공개 API GET: 200
- 관리자 API 무인증: 401
- preview token 없는 요청: 404
- 공개 응답 `cache-control`: `no-store`

401은 Worker 내부 인증 차단을 증명하지만, 실제 Access 보호 완료를 의미하지 않는다. 직접 Worker URL에 대한 Access 경계는 Cloudflare에서 별도 확인해야 한다.

## F. COST GATE

- Workers Free: 확인
- Workers 사용량: 8 / 100,000 requests/day 확인
- Pages Free 한도: 공식 월 500 builds 기준
- 기존 D1: 4개, 신규 staging 추가 시 5개
- 저장 용량: 관측상 Free 한도 내
- 계정 전체 D1 rows read/write: **UNVERIFIED**
- Pages 실제 월간 build 잔여량: **UNVERIFIED**
- Access 관리자 사용자 수: **UNVERIFIED**
- 유료 플랜 전환: 실행하지 않음
- 결제수단 변경: 실행하지 않음

spending limit 미설정은 단독 차단 사유로 삼지 않았다. 단, 계정 전체 사용량이 확인되지 않아 비용 및 한도 초과에 따른 서비스 중단 위험은 CLOUD VALIDATION PENDING이다.

확인 메뉴:

- Workers & Pages → 프로젝트 → Deployments/Metrics
- Storage & databases → D1 → Metrics
- Zero Trust → Access → Applications / Billing
- Manage account → Billing → Subscriptions / Billable usage

공식 문서: [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/), [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/), [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)

## G. DEPLOYMENT CONFIGURATION

원격 배포 전 예상 설정:

- Pages Function env: `STAGING_API_ORIGIN`에 신규 staging Worker origin만 저장
- Worker binding: 신규 `invite-p2-staging-db`만 `DB`로 연결
- Worker Secret: Access issuer/audience/JWKS/관리자 allowlist/preview secret
- 공개 API: `/api/public/*`
- 관리자 API: `/api/admin/*`
- Preview: `/api/preview/*`
- 기존 production Worker URL을 환경변수 기본값으로 사용하지 않음

Pages Function은 빌드 산출물과 함께 배포되는지 실제 Pages preview에서 확인해야 한다.

## H. LOCAL TEST RESULTS

- `npm run build`: PASS
- TypeScript: PASS
- Pages Function TypeScript: PASS
- FIX2 routing/auth tests: 3/3 PASS
- 기존 자동 테스트: 9/9 PASS
- `git diff --check`: PASS
- proxy response `no-store`: PASS
- unsupported method 405: PASS
- dist 내 production Worker URL/test JWT marker: 미검출

## I. REMAINING CLOUD VALIDATION

실제 staging 배포 후에만 확인 가능:

- Cloudflare Access 로그인 성공
- `/admin` 및 `/api/admin/*` 보호
- JWT가 Pages Function에서 Worker까지 전달되고 검증됨
- `/e/{slug}`와 `/api/public/*` 비로그인 접근
- Worker 직접 URL 우회 차단
- preview 및 비공개 행사 정보 차단
- Pages Function의 실제 same-origin HTTPS 동작
- 계정 전체 Pages/D1 사용량 및 비용 상태

## J. NEXT DEPLOYMENT ACTIONS

1. 비용 대시보드 수치를 새로 확인
2. 신규 staging 리소스 이름과 ID가 기존과 다른지 확인
3. Pages Function 환경변수에 staging Worker origin만 설정
4. 새 D1에만 migration 적용
5. 관리자 Access 정책을 적용하고 공개 경로 예외를 확인
6. 합성 데이터로 관리자·공개 E2E 수행
7. 실패 시 기존 리소스로 fallback하지 않고 staging만 중단

## K. FINAL VERDICT

**PARTIAL**

로컬 보안·라우팅 게이트는 통과했다. 그러나 원격 Access와 Pages Function 검증이 남아 있으므로 실제 staging 배포 승인 완료 상태로 판정하지 않는다.

이번 작업에서 기존 `invite-trial`, `invite-p2-production`, `invite-p2-api`, 기존 D1 4개와 기존 Access 정책은 변경하지 않았다.
