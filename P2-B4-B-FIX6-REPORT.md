# INVITE-P2-B4-B-FIX6 시험 배포 보고서

## A. EXECUTIVE SUMMARY

- 판정: **STAGING DEPLOYED — PARTIAL**
- 공개 초대장 staging은 배포 및 HTTPS 접근을 확인했다.
- 관리자 API는 Access 설정을 적용하지 않았으며, Worker 환경변수 미설정에 따른 fail-closed `401` 상태를 유지한다.
- 기존 운영 리소스에는 변경을 수행하지 않았다.

## B. APPROVAL SCOPE

- 배포 기준 코드: `fb645852b4591128a85ee84a1aa3040607f0ab8a`
- Pages 브랜치 메타데이터: `p2/b4-staging-final-gates`
- 합성 데이터만 사용했다.
- Workers Free 및 Teams Free 유지, 유료 전환·결제수단 변경 없음.

## C. CREATED RESOURCES

| Resource | Result |
|---|---|
| D1 | `invite-p2-staging-db` / `83fbcbee-14f5-44c8-854c-3fa5e521f4fa` |
| Worker | `invite-p2-staging-api` |
| Worker URL | `https://invite-p2-staging-api.dong100center.workers.dev` |
| Pages | `invite-p2-staging` |
| Pages URL | `https://invite-p2-staging.pages.dev/` |
| Deployment | `78a3b501-34d5-4ea7-a08a-07bad4e57ec1` |

## D. D1 MIGRATION & DATA

- `0001_init.sql`을 신규 D1에만 적용했다.
- 기존 D1 데이터 복사 없음.
- 합성 조직 및 행사 1건을 삽입했다.
- D1 실행 결과: 0.07 MB, 4 tables.
- 공개 상태로 복구된 합성 행사만 현재 조회 가능하다.

## E. WORKER DEPLOYMENT

- 신규 Worker 배포 성공.
- 신규 D1 binding만 연결했다.
- 직접 Worker 공개 API: `200`.
- 직접 Worker 관리자 API: 무인증 `401`.
- Preview 무인증 접근: `404`.

## F. ACCESS SECURITY

- 신규 Access 애플리케이션은 생성하지 않았다.
- 현재 Wrangler OAuth 토큰의 Access Apps and Policies 쓰기 권한이 `403 auth.forbidden`으로 거부됐다.
- 대시보드 Worker 보호 UI는 Worker 전체 트래픽 보호 방식이어서 `/api/public/*`까지 차단할 수 있으므로 적용하지 않았다.
- 따라서 관리자 Access 로그인과 관리자 CRUD는 검증·활성화하지 않았다.
- 관리자 API는 Access 환경변수가 없는 상태에서 fail-closed로 차단된다.

## G. PAGES DEPLOYMENT

- `npm run build` 성공.
- Pages Functions 포함 배포 확인.
- `STAGING_API_ORIGIN`을 신규 staging Worker로만 설정했다.
- `/api/*` 호출은 Pages 동일 출처에서 Worker로 전달된다.
- 기존 production Worker fallback은 사용하지 않는다.

## H. PUBLIC EVENT VERIFICATION

- Pages `/api/public/events/staging-demo`: `200`.
- Pages `/e/staging-demo`: `200`.
- 합성 행사 공개 데이터에 제목, 배경, 폰트, 갤러리 2장이 포함됨을 확인했다.
- 공개 상태를 private으로 바꾼 동안 공개 API는 `404`, 다시 public으로 복구 후 `200`이었다.
- 관리자 API: `401`.

## I. MOBILE / BROWSER

- 이번 원격 배포 단계에서는 실제 모바일 기기와 Access 로그인은 미검증이다.
- 기존 로컬 검증의 4개 viewport 및 빌드 검증은 기준선 보고서를 재사용한다.

## J. EXISTING RESOURCE PROTECTION

다음 리소스에는 수정·삭제·재배포·migration을 수행하지 않았다.

- `invite-trial`
- `invite-p2-production`
- `invite-p2-api`
- 기존 D1 4개
- 기존 Access 정책, DNS, R2

## K. REMAINING ISSUES

1. staging 관리자용 Access 애플리케이션 및 단일 관리자 정책을 구성해야 한다.
2. Access API 쓰기 권한 또는 대시보드에서 경로 오버라이드가 가능한 구성이 필요하다.
3. Access 적용 후 관리자 로그인, CRUD, Preview 토큰, 실제 모바일 검증을 다시 수행해야 한다.
4. Pages 월간 빌드 잔여량과 실제 청구 화면은 별도 대시보드 확인이 필요하다.

## L. COST IMPACT

- 신규 D1, Worker, Pages만 생성했다.
- 유료 플랜 전환 및 결제수단 변경 없음.
- R2와 기존 운영 리소스는 사용하지 않았다.
- 무료 한도 초과에 따른 서비스 제한 위험은 남아 있으며, 실제 청구 상태는 대시보드 권한 범위에서 별도 확인해야 한다.
