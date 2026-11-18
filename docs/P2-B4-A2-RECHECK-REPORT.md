# INVITE-P2-B4-A2 기존 Cloudflare 배포 관계 재점검

점검일: 2026-11-18 (KST)

기준 브랜치: `p2/b4-staging-readiness`

기준 SHA: `b43a9b5330f2965cfd90f15f338983c340974868`

## A. EXECUTIVE SUMMARY

- 최종 판정: **PARTIAL**
- Cloudflare 리소스는 읽기 전용으로 조회했다.
- `invite-trial`, `invite-p2-production`, `invite-p2-api`, 기존 D1 4개와 기존 Access 정책은 변경하지 않았다.
- `invite-p2-api`와 `invite-p2-production` D1 연결 관계는 확인됐다.
- staging 후보 리소스는 아직 존재하지 않는다.
- Pages 월간 build 사용량과 계정 전체 D1 row 사용량은 계속 **UNVERIFIED**다.

## B. EXISTING RESOURCE MAP

```text
invite-trial Pages
  GitHub: dumjeeckham-oss/mobile-wedding-invitation
  Production branch: p1/cloudflare-trial

invite-p2-production Pages
  GitHub 연결 없음
  Production branch: p2/custom-background

invite-p2-api Worker
  workers.dev: invite-p2-api.dong100center.workers.dev
  DB binding: DB → invite-p2-production
```

## C. PAGES DEPLOYMENT STATUS

### invite-trial

- Production URL: `https://24f06bac.invite-trial.pages.dev`
- 프로젝트 URL: `https://invite-trial.pages.dev`
- Production branch: `p1/cloudflare-trial`
- Production SHA: `ba58f3b`
- GitHub 연결: `dumjeeckham-oss/mobile-wedding-invitation`
- Build: `npm run build`
- Output: `dist`
- Pages 환경변수 이름: Production 설정 화면에서 표시 항목 없음
- Pages binding/Functions: 실제 binding 항목 없음
- 최근 Preview에는 후속 개발 브랜치 배포들이 존재하지만 Production은 변경되지 않았다.

### invite-p2-production

- Production URL: `https://1e8689fa.invite-p2-production.pages.dev`
- 프로젝트 URL: `https://invite-p2-production.pages.dev`
- Production branch 표시: `p2/custom-background`
- Production SHA: `943fc3f`
- GitHub 연결: 없음
- 프로젝트 환경변수 이름: 표시 항목 없음
- Pages binding/Functions: 실제 binding 항목 없음
- `/e/demo`: HTTP 200
- `/admin`: 정적 SPA 경로는 열릴 수 있으나 운영 관리자 인증은 별도 Access 설정 필요
- Pages `/api/*`: Worker API 라우팅으로 연결되지 않음

## D. WORKER ROUTING & AUTH

`invite-p2-api`:

- 최신 배포: `ecbf345d-944a-47c4-83d9-a57b63a8cc04`
- Domain: `invite-p2-api.dong100center.workers.dev`
- Custom domain: 없음
- Routes: 없음
- D1 binding: `DB`
- 공개 경로: `/api/public/events/{slug}`
- 관리자 경로: `/api/admin/*`
- Preview 경로: `/api/preview/events/{slug}`

읽기 전용 HTTP 확인:

- 공개 API: 200 JSON
- 관리자 API 무인증: 401
- Preview token 없는 접근: 404
- 공개 응답: `cache-control: no-store`

401은 Worker 내부 JWT fail-closed 증거이며 Cloudflare Access 보호 완료를 의미하지 않는다. 실제 관리자 Access 로그인은 확인되지 않았다.

## E. D1 BINDING MAP

| 이름 | ID 마스크 | 저장 크기 | 연결 Worker |
|---|---|---:|---|
| `invite-p2-production` | `68f7…992e6` | 65,536 bytes | `invite-p2-api.DB` |
| `case-scales` | `94a6…87e0` | 20,480 bytes | 확인되지 않음 |
| `dongbaek-kpi-supervision-production` | `058e…6ee2` | 638,976 bytes | 확인되지 않음 |
| `dongbaek-kpi-supervision-staging` | `b743…2c07` | 417,792 bytes | 확인되지 않음 |

기존 테이블 행·행사 내용·개인정보는 조회하지 않았다. Wrangler 목록의 `num_tables=0` 표시와 D1 대시보드 메타데이터의 table count 표시가 달라 table count는 **UNVERIFIED**로 기록한다.

## F. ACCESS STATUS

- `invite-p2-api`: Worker-specific Access 비보호 상태
- 확인되는 기존 Access application: 없음
- 공개 API: 공개 접근 가능
- 관리자 API: Worker 내부 JWT 검증으로 차단
- `/admin`: 정적 화면만으로는 관리자 보호가 완료되지 않음

관리자 운영에는 `/admin/*`와 `/api/admin/*`에 동일한 Access 경계를 적용하되, `/e/*`와 `/api/public/*`는 공개로 유지해야 한다. Worker 전체 Access는 공개 API까지 차단할 수 있으므로 사용하지 않는다. [Cloudflare Access 애플리케이션 유형](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/choose-application-type/)

## G. BILLING / FREE LIMITS

- Workers plan: **Free**
- Workers 요청량: 이전 대시보드 확인값 8 / 100,000 requests/day
- Workers Paid 활성: 확인되지 않음
- Zero Trust: `Teams Free Base` 확인
- D1 수: 4개
- D1 목록 저장 용량 합계: 약 1.06MB
- D1 계정 전체 rows read/write: **UNVERIFIED**
- Pages 월간 build 사용량: **UNVERIFIED**
- Access 실제 관리자 사용자 수: **UNVERIFIED**
- 실제 청구액·spending limit: **UNVERIFIED**

확인 경로:

- Workers & Pages → 프로젝트 → Deployments / Metrics
- Storage & databases → D1 → Metrics
- Zero Trust → Access → Applications / Billing
- Manage account → Billing → Subscriptions / Billable usage

공식 기준: [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/), [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/), [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)

## H. STAGING OPTIONS COMPARISON

| 기준 | A. 기존 `invite-p2-production` 활용 | B. 별도 `invite-p2-staging` |
|---|---|---|
| 기존 서비스 보호 | 낮음 | 높음 |
| 시험 데이터 격리 | 낮음 | 높음 |
| Access 구성 | 기존 경계와 충돌 | 새 경계 설계 가능 |
| 추가 리소스 | 없음 | Pages 1 + Worker 1 + D1 1 |
| 무료 한도 영향 | 낮음 | 추가 사용량 발생 |
| 롤백 | 운영과 결합 | staging만 rollback |
| 정식 전환 | 데이터 오염 위험 | 검증 후 별도 승인 |

권장: **B. 별도 staging**

## I. RECOMMENDED APPROVAL SCOPE

다음 세 리소스만 별도로 생성한다.

- Pages: `invite-p2-staging`
- Worker: `invite-p2-staging-api`
- D1: `invite-p2-staging-db`

Access는 관리자 경로에만 적용하고, 신규 D1에만 migration·합성 데이터를 사용한다. 기존 리소스에는 binding, migration, 배포, 정책 변경을 하지 않는다.

## J. REMAINING RISKS

- Pages 월간 build 잔여량 미확인
- 계정 전체 D1 row 사용량 미확인
- Access 관리자 사용자 수 미확인
- Worker 직접 URL에 대한 Cloudflare Access 미구성
- Pages `/api/*` same-origin 라우팅 미구성
- Wrangler D1 table count와 dashboard 표시 불일치

## K. FINAL VERDICT

**PARTIAL**

기존 배포 관계와 보호 대상은 확인됐고, 중복 staging 리소스가 아직 없다는 점도 확인됐다. 다만 비용·Access·same-origin의 일부 운영 수치가 미확인이라 즉시 배포 승인 상태로 판정하지 않는다. 신규 staging을 진행할 경우 별도 리소스 격리 방식으로 승인해야 한다.
