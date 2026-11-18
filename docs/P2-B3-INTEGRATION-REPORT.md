# P2-B3 로컬 통합 검증 보고서

## 범위

기준선 `db1f90df73dca9898af5671fecdbcfe6c5610b48`에서 `p2/admin-api-d1-integration` 브랜치로 관리자 UI의 저장 경로를 Worker API/D1 Repository로 전환했다. 원격 Worker, D1, R2, Access 정책, Pages 배포는 변경하지 않았다.

## 구현

- `src/admin/repository.ts`: `AdminRepository`, Worker API Repository, local-test Repository.
- `src/admin/AdminApp.tsx`: 기본 API 저장, 서버 응답 재조회, 저장 실패 시 draft 유지, 업로드 저장 준비 중 안내.
- `src/admin/EventPublic.tsx`: `/api/public/events/:slug` 조회. 공개 API 외에는 렌더링하지 않음.
- `worker/index.ts`: 전체 행사 payload D1 저장/수정/복제, 단체 조회·수정, URL 로고 검증, slug 충돌, CORS, 공개 필드 제한.
- `worker/auth.ts`: 인증 파싱·JWKS·서명·issuer·audience·expiry 오류를 fail-closed 401로 처리.
- `wrangler.local.toml`: 로컬 Worker entrypoint와 D1 binding만 정의.

## 검증 결과

| 항목 | 결과 |
|---|---|
| `npm run build` | PASS |
| Worker TypeScript 검사 | PASS |
| `git diff --check` | PASS |
| P2-B2 회귀 테스트 6건 | PASS |
| 실제 로컬 Wrangler + D1 공개 API | PASS (`200`, CORS 확인) |
| 없는 slug | PASS (`404`) |
| 인증 없는 관리자 API | PASS (`401`) |
| 원격 자원/배포 | 수행하지 않음 |

## 제한

실제 Cloudflare Access 계정/JWKS와 원격 D1을 사용한 관리자 브라우저 E2E, 외부 지도 앱 전환, YouTube 실제 재생은 이번 단계에서 검증하지 않았다. 업로드 이미지는 R2가 연결되지 않아 파일 검증 후 저장하지 않는다. 따라서 운영 배포 준비 판정은 `PARTIAL`이다.

## 로컬 실행

1. `npx wrangler d1 migrations apply invite-local --local --config wrangler.local.toml --persist-to .wrangler-local`
2. `npx wrangler dev --local --port 8787 --config wrangler.local.toml --persist-to .wrangler-local`
3. 프론트 개발 환경에서 `VITE_ADMIN_API_BASE_URL=http://127.0.0.1:8787` 설정.
4. 관리자 API 인증은 합성 테스트 JWT를 사용하며, 운영 환경에는 테스트 토큰을 설정하지 않는다.
