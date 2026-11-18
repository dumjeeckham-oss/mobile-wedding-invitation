# INVITE-P2-B4-B-FIX1 비용 게이트 정밀화 보고서

점검 기준: `p2/b4-staging-deploy` / `65b2719`

## A. BLOCKER ROOT CAUSE

기존 중단 원인은 두 가지가 섞여 있었다.

1. **비용 확인 부족:** Pages 월간 build, 계정 전체 D1 rows read/write, Access 사용자 수를 확인하지 못했다.
2. **라우팅 미완성:** 현재 프론트엔드는 `VITE_ADMIN_API_BASE_URL`을 사용해 Worker를 별도 출처로 호출하며, Pages에 `/api/*` → Worker 라우팅이 구성되어 있지 않다.

첫 번째는 비용 위험과 서비스 중단 위험을 분리해 평가해야 한다. 두 번째는 Gate 1의 인증·same-origin 안전성 문제이므로 별도 차단 사유다.

## B. WORKERS FREE COST MODEL

- Workers 플랜: Free 확인
- 현재 요청량: 8 / 100,000 requests/day 확인
- 유료 Workers 플랜: 활성 상태 아님
- Workers Paid 전환: 실행하지 않음
- 결제수단 추가: 실행하지 않음
- spending limit: Free 플랜에서 무조건 필수 조건으로 취급하지 않음

Free 한도 초과는 자동 과금으로 단정하지 않고, 요청 실패·서비스 중단 위험으로 평가한다. Cloudflare 공식 문서상 Free 요청 한도는 100,000/day이며, 한도 초과 시 추가 요청이 실패할 수 있다. [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)

## C. PAGES FREE CAPACITY

- 기존 Pages 프로젝트: 2개
- Pages Free 공식 빌드 한도: 월 500 builds, 동시 1 build
- 실제 계정 월간 사용량: **UNVERIFIED**
- 시험용 프로젝트 추가 시 프로젝트 수는 Free 한도 내로 보이나, 월간 build 잔여량은 대시보드에서 확인해야 한다.

확인 경로: Cloudflare Dashboard → Workers & Pages → 해당 Pages 프로젝트 → Deployments/Metrics. 공식 기준은 [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)이다.

## D. D1 FREE CAPACITY

- 기존 D1: 4개
- 신규 staging DB 추가 시: 5개
- Free 공식 한도: 계정 10개 DB, DB당 500MB, 계정 합계 5GB
- 기존 목록 저장 크기 합계: 약 1.06MB 수준
- 계정 전체 rows read/write: **UNVERIFIED**
- 기존 초대장 D1 최근 관측값: rows read 15, rows written 25 (개별 DB 화면)

저장 용량은 관측상 충분하지만, 계정 전체 일일 row 사용량은 별도 확인이 필요하다. D1 무료 row 한도 초과는 과금으로 자동 전환되는 것이 아니라 요청 실패 위험으로 평가한다. [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 free-tier enforcement](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/)

확인 경로: Dashboard → Storage & databases → D1 → Account/database Metrics. 기존 D1의 테이블 행과 개인정보는 조회하지 않는다.

## E. ACCESS FREE ELIGIBILITY

- Billing 화면: `Teams Free Base` 구독 확인
- Workers Free 활성: 확인
- 실제 Access 관리자 사용자 수: **UNVERIFIED**
- 기존 Access 정책: 변경하지 않음
- 유료 Access 기능 활성화: 실행하지 않음

확인 경로: Dashboard → Zero Trust → Settings/Billing 및 Access → Applications. 사용자 수와 무료 범위가 확인되지 않은 상태에서 Access 유료 전환을 가정하지 않는다.

## F. AUTH & ROUTING SAFETY

현재 확인된 상태:

- Worker `/api/admin/*`: 내부 JWT 검증 실패 시 401
- Worker `/api/public/*`: 공개 응답
- Worker-specific Access: 비활성
- Pages `invite-p2-production`: Pages 환경변수·binding 없음
- Pages `/api/*`: Worker로 연결되지 않음
- 프론트 코드: `VITE_ADMIN_API_BASE_URL`로 외부 Worker 호출

따라서 Gate 1은 **FAIL/UNVERIFIED**다. 현재 상태로 staging을 배포하면 same-origin 요구를 충족하지 못하고, 관리자 페이지 보호와 관리자 API 보호가 서로 다른 출처·정책으로 남는다.

권장 최소 방향:

1. staging용 Pages와 Worker 사이에 `/api/*` same-origin 라우팅을 먼저 설계한다.
2. `/api/admin/*`와 `/admin`에 관리자 Access를 적용한다.
3. `/api/public/*`와 `/e/{slug}`는 공개로 유지한다.
4. Worker 내부 JWT 검증은 계속 유지한다.
5. 공개 API를 Worker 전체 Access 보호 뒤에 두지 않는다.

이 설계 변경·검증 없이 원격 리소스를 만들지 않는다.

## G. REVISED COST GATE

### 비용 위험

- Workers Free 유지: PASS
- 유료 플랜 전환 없음: PASS
- 유료 기능 없음: PASS
- 결제수단 추가 없음: PASS
- Pages 실제 월간 잔여량: UNVERIFIED
- D1 계정 전체 row 사용량: UNVERIFIED
- Access 무료 사용자 범위: UNVERIFIED

### 서비스 중단 위험

- Workers 100,000/day 초과: 요청 실패 가능
- D1 row read/write 한도 초과: 요청 실패 가능
- Pages build 한도 초과: 배포 지연/실패 가능

### 판정

spending limit 미설정만으로 차단하지 않는다. 그러나 계정 전체 사용량이 확인되지 않은 상태에서 신규 리소스를 만드는 것은 비용·중단 위험이 해소된 것으로 볼 수 없다. Gate 0는 **PARTIAL**, Gate 1은 **BLOCKED**다.

## H. STAGING DEPLOYMENT RESULT

- staging Pages 생성: 하지 않음
- staging Worker 생성: 하지 않음
- staging D1 생성: 하지 않음
- Access 생성/변경: 하지 않음
- staging URL: 없음
- 배포 SHA: 없음

## I. EXISTING RESOURCE PROTECTION

이번 작업에서 다음을 변경하지 않았다.

- `invite-trial`
- `invite-p2-production`
- `invite-p2-api`
- 기존 D1 4개
- 기존 Access 정책
- 기존 DNS, 도메인, R2
- 기존 GitHub Workflow

## J. FINAL VERDICT

**BLOCKED**

비용 게이트는 Workers Free의 실제 구조에 맞게 수정했다. 그러나 현재 코드와 Cloudflare 구성에는 same-origin 라우팅과 관리자 Access 경계가 실제로 검증되어 있지 않다. 이 문제를 해결·검증하기 전에는 승인된 staging 리소스도 생성하지 않는다.
