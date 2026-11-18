# INVITE-P2-B4-A2 기존 Cloudflare 관계·비용 안전성 보고서

점검일: 2026-11-18 (KST)

## A. EXECUTIVE SUMMARY

- 최종 판정: **PARTIAL**
- 이번 점검은 Cloudflare 리소스 목록·설정·관계에 대한 읽기 전용 확인으로 수행했다.
- `invite-p2-api` → D1 `invite-p2-production` 연결은 확인됐다.
- `invite-p2-production`은 GitHub 연결 없는 Pages 프로젝트이며 `p2/custom-background`를 Production branch로 사용한다.
- `invite-p2-api`는 현재 Worker-specific Access로 보호되지 않는다.
- 기존 프로젝트를 staging으로 재사용하면 운영 페이지·API·D1이 같은 배포 경로를 공유하므로 권장하지 않는다.
- P2-B4-B는 별도 Pages·Worker·D1을 사용하는 격리 구성으로 승인하는 것이 안전하다.

## B. EXISTING RESOURCE MAP

```text
invite-trial Pages (GitHub 연결)
  └─ dumjeeckham-oss/mobile-wedding-invitation
     └─ Production: p1/cloudflare-trial / ba58f3b

invite-p2-production Pages (GitHub 미연결)
  └─ Production: p2/custom-background / 943fc3f

invite-p2-api Worker (workers.dev 단일 도메인)
  └─ binding DB → invite-p2-production D1
     ├─ /api/public/* : 공개 API 응답
     └─ /api/admin/*  : Worker JWT 검증 후 인증 필요
```

이번 점검에서 기존 Pages, Worker, D1, Access 정책은 변경하지 않았다.

## C. PAGES DEPLOYMENT STATUS

### invite-trial

- URL: `https://invite-trial.pages.dev`
- GitHub: `dumjeeckham-oss/mobile-wedding-invitation`
- Production branch: `p1/cloudflare-trial`
- Build: `npm run build`
- Output: `dist`
- 최신 Production SHA: `ba58f3b`
- 자동 배포: Enabled
- Pages 환경변수 이름: 현재 Production 설정 화면에서 표시되는 항목 없음
- Pages Functions/binding: 구성 항목은 있으나 실제 binding 항목 없음
- Preview는 기본 공개 상태

### invite-p2-production

- URL: `https://invite-p2-production.pages.dev`
- GitHub 연결: 없음
- Production branch 표시: `p2/custom-background`
- 최신 배포 SHA: `943fc3f`
- 최신 배포 URL: `https://1e8689fa.invite-p2-production.pages.dev`
- 프로젝트 환경변수 이름: 표시되는 항목 없음
- Pages Functions/binding: 실제 구성 항목 없음
- Preview는 기본 공개 상태

접근 확인:

- `/admin`: HTML은 열리지만 관리자 API 인증·연결 상태에 따라 실제 관리 기능은 별도 확인 필요
- `/e/demo`: HTTP 200
- `invite-p2-production.pages.dev/api/public/events/demo`: SPA HTML 반환. 공개 API는 현재 별도 Worker URL을 사용하며 Pages same-origin `/api` 라우팅은 연결되지 않음

## D. WORKER ROUTING & AUTH

`invite-p2-api` 확인 결과:

- URL: `https://invite-p2-api.dong100center.workers.dev`
- Custom domain: 없음
- Routes: 없음
- D1 binding: `DB`
- 연결 DB: `invite-p2-production` / ID `68f7…992e6`
- 최신 deployment version: `ecbf345d`
- 최신 배포 상태: Ready, 100%
- 최근 24시간 지표: invocations 10, CPU 약 3ms, errors 0

HTTP 확인:

- `/api/public/events/demo`: 200 JSON
- `/api/admin/events` 무인증: 401

401은 Worker 내부 JWT fail-closed 동작의 증거일 뿐, Cloudflare Access 보호 완료를 의미하지 않는다. 대시보드에서 명시적으로 “This Worker is not protected by Access” 상태가 확인됐다.

코드상 관리자 API는 Access JWT의 서명·issuer·audience·expiry·allowlist 이메일을 서버에서 다시 검증하도록 되어 있다. 실제 Access 로그인 성공과 원격 JWKS 검증은 아직 운영 환경에서 검증되지 않았다.

## E. D1 BINDING MAP

| 데이터베이스 | ID 마스크 | Wrangler 저장 크기 | Worker 연결 |
|---|---|---:|---|
| `invite-p2-production` | `68f7…992e6` | 65,536 bytes | `invite-p2-api.DB` |
| `case-scales` | `94a6…87e0` | 20,480 bytes | 확인되지 않음 |
| `dongbaek-kpi-supervision-production` | `058e…6ee2` | 638,976 bytes | 확인되지 않음 |
| `dongbaek-kpi-supervision-staging` | `b743…2c07` | 417,792 bytes | 확인되지 않음 |

기존 테이블 행·행사 내용·개인정보는 조회하지 않았다. Wrangler 목록의 `num_tables` 표시와 D1 대시보드의 `invite-p2-production` 메타데이터 표시가 일치하지 않아 테이블 수는 최종 확정하지 않고 **UNVERIFIED**로 남긴다.

## F. ACCESS STATUS

- `invite-p2-api`: Worker-specific Access 비보호
- 현재 Access 애플리케이션 목록: 확인되는 기존 정책 없음
- `/api/public/*`: 현재 Worker가 공개 응답
- `/api/admin/*`: Worker 내부 인증 실패 시 401
- `/admin`: Pages 정적 화면 자체는 공개될 수 있으므로, 운영 시 관리자 API와 동일한 Access 경계가 필요

Worker 전체 보호는 공개 API까지 차단할 수 있다. 공개 API와 관리자 API를 한 Worker에 둘 경우 path 예외 정책을 정확히 검증하거나, 관리자 Worker를 분리해야 한다. [Cloudflare Access Worker 보호 문서](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/choose-application-type/)

## G. BILLING / FREE LIMITS

- Workers plan: **Free**, 확인됨
- Workers 대시보드 요청량: 8 / 100,000 requests/day
- Workers Free: 100,000 requests/day, 10ms CPU/invocation
- D1 Free: 최대 10 DB, DB당 500MB, 계정 합계 5GB
- D1 account-wide rows read/written: **UNVERIFIED**
- Pages 월별 build 사용량: **UNVERIFIED**
- Access/Zero Trust: Teams Free Base 구독 확인
- 실제 청구액·spending limit·알림 설정: **UNVERIFIED**
- 현재 Pages 2개, D1 4개가 보이며 후보 staging 1세트를 추가하면 Pages 3개, D1 5개, Worker 2개가 된다.

공식 한도: [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/), [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/), [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)

비용 판정: **COST REVIEW REQUIRED**. 현재 Free 플랜은 확인됐지만 계정 전체 사용량과 spending limit이 완전히 확인되지 않았다.

## H. STAGING OPTIONS COMPARISON

| 기준 | A. `invite-p2-production` 재사용 | B. 별도 `invite-p2-staging` 생성 |
|---|---|---|
| 기존 서비스 보호 | 위험 | 높음 |
| 시험 데이터 격리 | 낮음 | 높음 |
| Access 구성 | 기존 경계와 충돌 가능 | 새 관리자 경계 설계 가능 |
| 리소스 추가 | 없음 | Pages 1, Worker 1, D1 1 |
| 무료 한도 영향 | 낮음 | DB·빌드·요청 한도 추가 사용 |
| 롤백 | 운영 배포와 결합 | staging만 폐기/rollback 가능 |
| 정식 전환 | 운영 오염 가능 | 검증 후 별도 승인으로 전환 |

권장: **B. 별도 staging**

## I. RECOMMENDED APPROVAL SCOPE

P2-B4-B 승인 범위는 다음으로 제한한다.

1. `invite-p2-staging` Pages 생성
2. `invite-p2-staging-api` Worker 생성
3. `invite-p2-staging-db` D1 생성 및 migration
4. 관리자 API 전용 Access 경계 구성
5. 공개 API·`/e/{slug}`·`/admin`의 same-origin 라우팅 확인
6. 합성 행사 데이터로 CRUD와 공개/비공개 전환 검증
7. Free 한도 및 비용 초과 시 중단

기존 `invite-trial`, `invite-p2-production`, `invite-p2-api`, 기존 4개 D1은 승인 범위에서 제외한다.

## J. REMAINING RISKS

- **높음:** Access 정책이 없어 관리자 운영용 외부 인증 경계가 미완성
- **중간:** Pages와 Worker가 same-origin으로 연결되지 않아 현재 `/api` 경로가 Pages에서 API로 라우팅되지 않음
- **중간:** Pages 월 build, D1 계정 전체 row usage, spending limit 미확인
- **중간:** 기존 D1 메타데이터의 table count 표시 불일치
- **낮음:** `invite-p2-production`의 프로젝트 환경변수·binding은 비어 있어 배포 시 일회성 빌드 환경변수 의존 가능성 있음

## K. FINAL VERDICT

**PARTIAL**

기존 Pages–Worker–D1 연결 관계는 충분히 확인됐고, 중복 리소스 생성 여부를 판단할 수 있다. 그러나 Access 보호와 계정 전체 비용 사용량이 미완료이므로 현재 상태를 운영 배포 승인 상태로 판정하지 않는다.

P2-B4-B는 기존 프로젝트를 재사용하지 않고 별도 staging 리소스로 격리하는 범위로 승인하는 것이 적절하다.
