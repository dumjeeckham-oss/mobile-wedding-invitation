# INVITE-P2-B4-B-FIX5 Cloudflare 비용·Access 자동 확인 보고서

기준 구현 SHA: `fb645852b4591128a85ee84a1aa3040607f0ab8a`

점검일: 2026-11-18 (KST)

## A. EXECUTIVE SUMMARY

- 최종 판정: **PARTIAL — SPECIFIC USER ACTION REQUIRED**
- Wrangler 인증과 계정 리소스 목록 조회는 자동화되어 확인됐다.
- Pages 월간 build 사용량·잔여량은 공식 Pages API/Wrangler에 계정 집계 지표가 없어 자동 확인 불가다.
- Access 좌석 조회 API는 존재하지만 현재 인증 scope에 필요한 `Access: Audit Logs Read`가 없어 자동 확인 불가다.
- 기존 리소스와 GitHub Workflow는 변경하지 않았다.
- staging 리소스 생성·배포는 실행하지 않았다.

## B. PAGES BUILD USAGE

### 자동 확인 결과

- 계정 Pages 프로젝트 수: 2개
  - `invite-trial`
  - `invite-p2-production`
- 프로젝트별 배포 목록: Wrangler로 조회 가능
- 프로젝트별 deployment 기록: 확인 가능
- 계정 전체 현재 월 build 사용량: **API NOT AVAILABLE**
- 계정 전체 잔여 build 수: **API NOT AVAILABLE**
- 조회 권한 부족: Pages 프로젝트·deployment 목록 조회 권한은 확인됨

Cloudflare Pages 공식 API 문서에는 프로젝트 목록과 프로젝트별 deployment 목록 endpoint는 있으나, 계정 전체 월간 build 사용량/잔여량 endpoint가 문서화되어 있지 않다. 프로젝트별 deployment 개수를 월간 계정 build 사용량으로 해석하지 않았다. [Pages API](https://developers.cloudflare.com/api/resources/pages/)

무료 한도는 공식 문서상 월 500 builds, 동시 1 build, build timeout 20분이다. [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)

### 확인 가능한 메뉴

Cloudflare Dashboard → Workers & Pages → 해당 Pages 프로젝트 → Deployments / Metrics

계정 전체 잔여량이 화면에도 없으면 Cloudflare 지원 또는 계정 billing/usage export가 필요하다.

## C. ACCESS USER COUNT

### 자동 확인 결과

- Zero Trust 구독: 이전 대시보드 확인값 `Teams Free Base`
- Access 애플리케이션 수: 이전 점검에서 기존 application 없음
- Access 사용자/seat 수: **PERMISSION LIMITED**
- 관리자 allowlist: 실제 이메일 값은 개인정보 보호상 조회·보고하지 않음
- 신규 staging Access 가능 여부: Free 플랜 범위는 문서 확인 필요, 실제 seat 잔여량은 미확인

Cloudflare 공식 Access Users API는 존재하지만 `Access: Audit Logs Read` 권한을 요구한다. 현재 Wrangler OAuth scope 출력에는 해당 권한이 포함되어 있지 않다. 따라서 애플리케이션 수와 좌석 수를 혼동하지 않았으며, 사용자 API를 조회하지 못한 것을 좌석 초과로 해석하지 않았다. [Access Users API](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/users/methods/list/)

### 최소 해결 방법

1. 계정 관리자에게 `Access: Audit Logs Read`가 포함된 별도 읽기 전용 API Token 발급 요청
2. 또는 Dashboard → Zero Trust → Access → Users / Billing에서 Access seat 수 확인
3. 관리자 수가 1명이라는 운영 정책은 사용자 확인으로 확정하되, 실제 과금 seat 수와 동일하다고 가정하지 않음

## D. D1 USAGE

- 기존 D1 수: 4개
- 목록 저장 크기 합계: 약 1.06MB
- `invite-p2-production`: 65,536 bytes
- 계정 전체 rows read/write: **UNVERIFIED**
- DB 목록과 개별 dashboard metric은 자동 계정 전체 row 집계가 아님
- 기존 D1 테이블 행·행사 내용·개인정보는 조회하지 않음

확인 경로: Dashboard → Storage & databases → D1 → Metrics

## E. BILLING RISK

- Workers Free: 확인됨
- Workers 요청량: 이전 확인값 8 / 100,000 requests/day
- Workers Paid 활성: 확인되지 않음
- `Teams Free Base`: 확인됨
- 실제 청구액: 자동 확인되지 않음
- Pages build 잔여량: 확인되지 않음
- Access seat 잔여량: 권한 제한
- 신규 리소스 생성 시 결제 요구: 실제 생성 전이므로 미검증

현재 증거만으로 추가 과금이 발생한다고 단정할 수 없다. 반대로 모든 비용 조건이 검증됐다고도 할 수 없다. 따라서 비용 판정은 **PARTIAL**이다.

무료 한도 초과 시 예상되는 요청/build 실패 위험과 실제 유료 전환 위험을 별도로 관리해야 한다. [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)

## F. API PERMISSION LIMITATIONS

현재 Wrangler OAuth scope로 확인된 범위:

- account read
- Pages/Workers/D1 리소스 목록 조회
- Worker deployment 목록 조회

확인되지 않은 범위:

- 계정 전체 Pages monthly build usage
- Access seat/user usage
- 계정 전체 D1 rows read/write aggregate
- spending limit 상세

인증 토큰·Secret·Cookie·관리자 이메일은 로그와 보고서에 출력하지 않았다.

## G. REQUIRED USER ACTIONS

자동화만으로 해결 가능한 문제가 아니다. 다음 중 최소 하나가 필요하다.

- Pages monthly usage/remaining builds가 표시되는 Dashboard 화면 확인
- `Access: Audit Logs Read`가 포함된 읽기 전용 API Token 발급
- Zero Trust Access → Users/Billing에서 실제 seat 수 확인
- Billing → Billable usage에서 현재 청구 가능 항목 확인
- D1 계정 Metrics에서 rows read/written aggregate 확인

위 정보가 확인되면 기존 승인 범위 내 staging 배포 재개 여부를 다시 판정할 수 있다.

## H. STAGING READINESS

- 신규 staging 리소스: 존재하지 않음
- `invite-p2-staging-api`: Worker does not exist 확인
- 기존 Pages 2개만 존재
- 기존 D1 4개만 존재
- 기존 리소스와 staging ID/binding 충돌 없음
- 비용 자동 확인: 부분 완료
- Access seat 자동 확인: 미완료

## I. FINAL VERDICT

**PARTIAL — SPECIFIC USER ACTION REQUIRED**

Pages monthly build와 Access seat usage는 현재 인증된 CLI/API만으로 확정할 수 없다. 이는 비용 초과나 유료 전환의 증거가 아니며, 각각 API 미제공과 권한 부족으로 구분된다.

이번 실행에서는 Cloudflare 리소스를 생성·수정·삭제·배포하지 않았다. `invite-trial`, `invite-p2-production`, `invite-p2-api`, 기존 D1 4개와 기존 Access 정책도 변경하지 않았다.
