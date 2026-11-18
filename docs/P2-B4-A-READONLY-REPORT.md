# INVITE-P2-B4-A 읽기 전용 점검 보고서

점검일: 2026-11-18 (KST)

## A. EXECUTIVE SUMMARY

- 판정: **PARTIAL**
- 이번 B4-A 작업에서는 Cloudflare 원격 리소스에 대한 생성·수정·삭제·배포를 실행하지 않았다.
- 기준선 `p2/custom-background` / `943fc3f2ad54333dbc8eaa4c611a4e57fc57a2fc`를 확인했다.
- Cloudflare 계정은 인증되어 있고 Workers Free 플랜이 활성 상태다.
- 기존 `invite-trial`은 보존되어 있으며, 별도 Pages 프로젝트 `invite-p2-production`, Worker `invite-p2-api`, D1 `invite-p2-production`은 이번 점검 이전부터 존재하는 상태로 확인됐다.
- 새 관리자 운영 환경은 Access 보호 경로와 Pages-Worker same-origin 라우팅을 확정한 뒤에만 승인할 수 있다.

## B. GITHUB BASELINE

- Repository: `dumjeeckham-oss/mobile-wedding-invitation`
- 확인 브랜치: `p2/custom-background`
- 확인 HEAD: `943fc3f2ad54333dbc8eaa4c611a4e57fc57a2fc`
- 점검 브랜치: `p2/b4-staging-readiness`
- 로컬 소스 변경: 없음
- 작업 트리: 기존 미추적 배포 보조 파일 `.wrangler-production-dry-run/`, `tmp/`, `wrangler.production.toml`이 존재한다. 이번 점검에서 삭제·수정하지 않았다.
- 검증: `npm run build` 성공, P2-B2 자동 테스트 9/9 성공, Worker TypeScript 검사 성공, `git diff --check` 성공

## C. CLOUDFLARE ACCOUNT / PLAN

- Wrangler OAuth 인증 상태: 확인됨
- 계정 API 읽기 권한: 확인됨
- Workers 플랜: **Free**
- 대시보드 요청량: 8 / 100,000 requests/day
- Workers Free 기준: 100,000 requests/day, 10ms CPU/invocation, Worker 100개/account
- D1 Free 기준: 최대 10개 DB, DB당 500MB, 계정 합계 5GB, invocation당 무료 read subrequest 50개
- 공식 제한은 [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) 기준이다.

## D. EXISTING PAGES RESOURCES

| 프로젝트 | 상태 |
|---|---|
| `invite-trial` | 기존 GitHub 연결 Pages 프로젝트, `invite-trial.pages.dev` 보존 |
| `invite-p2-production` | 별도 Pages 프로젝트, Git 연결 없음 |

- `invite-trial` Production은 `p1/cloudflare-trial` / `ba58f3b` 배포를 유지한다.
- `invite-trial`에는 `p2/custom-background` / `943fc3f` Preview가 이미 존재한다.
- `invite-p2-production`에는 `p2/custom-background` / `943fc3f` Production 배포가 이미 존재한다.
- `invite-p2-production`의 최신 배포 URL: `https://1e8689fa.invite-p2-production.pages.dev`
- Pages Free의 공식 한도는 월 500 builds, 동시 1 build, build timeout 20분이다. 계정의 이번 달 실제 build 사용량은 대시보드에서 확인하지 못했으므로 **UNVERIFIED**다. [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)

## E. EXISTING WORKERS RESOURCES

대시보드 및 Wrangler 목록에서 다음 7개 애플리케이션이 확인됐다.

- Pages: `invite-trial`, `invite-p2-production`
- Worker: `invite-p2-api`
- 기존 다른 애플리케이션: `case-scales-api`, `misty-glitter-abb5`, `dongbaek-kpi-supervision-production`, `dongbaek-kpi-supervision-staging`

`invite-p2-api`:

- URL: `https://invite-p2-api.dong100center.workers.dev`
- 최신 배포 버전: `ecbf345d-944a-47c4-83d9-a57b63a8cc04`
- 공개 API GET: 200 JSON
- 관리자 API 무인증 GET: 401
- `invite-p2-admin-api`: 계정에 존재하지 않음
- Worker Access 애플리케이션: 현재 목록에서 확인되지 않음

## F. EXISTING D1 RESOURCES

읽기 전용 목록에서 총 4개 데이터베이스를 확인했다.

- `invite-p2-production` — `68f7b65c-667a-47bf-b95f-c7d0fbc992e6`
- `case-scales`
- `dongbaek-kpi-supervision-production`
- `dongbaek-kpi-supervision-staging`

기존 D1의 테이블 행과 개인정보는 조회하지 않았다. 신규 초대장 D1의 메타데이터 화면에서만 다음을 확인했다.

- storage used: 약 65.54KB
- tables: 4
- 최근 24시간 rows read: 15
- 최근 24시간 rows written: 25
- 최근 24시간 total queries: 12

계정 전체 D1 rows read/written의 일일 누적량은 데이터베이스별 화면만으로 확정하지 못해 **UNVERIFIED**다. D1 Free 한도 초과 시 요청이 다음 UTC 자정까지 실패할 수 있으므로, 배포 승인 전에 계정 전체 사용량 확인이 필요하다. [D1 Free-tier enforcement](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/)

## G. ACCESS / ZERO TRUST

- Workers & Pages 계정 화면의 Cloudflare Access 계정 설정은 현재 활성 애플리케이션 목록이 없는 상태로 보인다.
- Billing 화면에서 `Teams Free Base` 구독이 확인됐지만, 관리자 앱 정책은 별도로 존재하지 않는다.
- 현재 `invite-p2-api`에 Worker 전체를 보호하는 Access 구성이 없으므로 관리자 운영 준비는 완료되지 않았다.
- Worker 단위 Access는 해당 Worker의 모든 경로를 보호한다. 공개 API와 관리자 API를 같은 Worker에 두고 단순히 Worker 전체를 보호하면 공개 초대장 API도 차단될 수 있다. [Access application types](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/choose-application-type/)

권장안:

1. 공개 API Worker와 관리자 API Worker를 분리하고, 관리자 Worker만 Worker-specific Access로 보호한다.
2. 또는 승인된 도메인에서 `/api/admin/*`, `/api/preview/*`만 path-scoped Access로 보호하고 `/api/public/*`는 공개한다.
3. Pages와 API를 같은 출처로 운영하려면 `/api/*` 라우팅을 명시하고 SPA fallback보다 API 라우팅을 우선한다.

## H. BILLING & FREE-TIER HEADROOM

- Workers Free: **VERIFIED FREE**
- Zero Trust Teams Free Base: 활성 상태 확인
- Workers Paid 구독: 현재 구독 목록에서 활성 항목으로 확인되지 않음
- 현재 실제 청구액, 계정 전체 Pages build 잔여량, Workers spending limit 설정: **UNVERIFIED**
- 공식 Workers Paid는 월 $5 + 사용량이며, Free 초과 시 별도 동작이 적용된다. [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- 현 상태만으로 추가 고정비가 발생한다고 단정할 수는 없지만, Access 정책·Pages·D1·Worker를 새로 구성하기 전 Billing의 사용량/지출 한도 확인이 필요하다.

## I. STAGING ARCHITECTURE

승인 후 후보 이름:

- Pages: `invite-p2-staging`
- Worker: `invite-p2-staging-api`
- D1: `invite-p2-staging-db`

예정 경로:

- `/admin`
- `/api/admin/*`
- `/api/public/*`
- `/api/preview/*`
- `/e/{slug}`

선정안은 **Pages + 분리된 관리자 Worker + 공개 API Worker + D1** 구조다. 기존 `invite-trial`은 그대로 두고, 새 Pages/Worker/D1를 별도 리소스로 구성한다. R2는 초기에는 제외하고 외부 HTTPS 이미지 URL 방식을 유지한다.

단일 Worker + Static Assets는 리소스 수를 줄일 수 있으나, 현재 구조 변경 폭과 Access 경로 분리 위험이 커서 1차 시험에는 권장하지 않는다.

## J. DEPLOYMENT SAFETY

승인 후 순서:

1. 승인된 SHA 확인
2. 후보 리소스 이름 중복 재확인
3. 시험 D1 생성 및 migration 적용
4. Worker 환경변수/Secret 설정
5. 관리자 경로에만 Access 적용
6. Pages 연결 및 SPA/API 라우팅 확인
7. 관리자 CRUD와 공개 `/e/{slug}` 확인
8. 비용·사용량 확인

복구는 코드 배포 rollback과 D1 데이터 복구를 분리한다. D1에 쓰기 시작한 뒤에는 migration 백업·복구 절차와 합성 데이터 정책을 별도로 승인받아야 한다.

## K. ESTIMATED COST

- 현재 확인된 Workers 플랜 기준: Free 범위 내 시험 가능성이 높음
- 정확한 비용 판정: **COST REVIEW REQUIRED**
- 이유: 계정 전체 사용량, Pages 월 build 잔여, D1 전체 rows read/written, spend limit을 완전히 확인하지 못함
- R2·유료 API·기존 도메인 연결을 포함하지 않는 최소 시험 구성은 추가 고정비를 만들지 않는 방향이다.

## L. APPROVAL REQUIRED ACTIONS

다음 승인이 필요하다.

- `invite-p2-staging`, `invite-p2-staging-api`, `invite-p2-staging-db` 생성 승인
- 관리자 API 인증 구조 선택 승인: 분리 Worker 권장 또는 승인된 도메인의 path-scoped Access
- Access 정책과 관리자 이메일 allowlist 설정 승인
- D1 migration 및 합성 데모 데이터 입력 승인
- Pages 시험 배포 승인
- Billing/사용량 확인 결과에 따라 Free 초과 시 중단하는 비용 게이트 승인

## M. FINAL VERDICT

**PARTIAL**

기준선, 현재 리소스, Workers Free 상태, 신규 초대장 리소스 메타데이터, 로컬 빌드/테스트는 확인됐다. 그러나 관리자용 Access 정책이 없고, Pages 월 사용량·계정 전체 D1 누적량·spending limit이 확정되지 않았으므로 즉시 운영 배포 승인은 아니다.

이번 B4-A 작업 중 원격 리소스 쓰기 명령은 실행하지 않았다. 현재 존재하는 `invite-p2-production` Pages/Worker/D1는 이번 승인 게이트 이전 상태이며, `invite-trial` 및 기존 기관 프로젝트는 변경하지 않았다.
