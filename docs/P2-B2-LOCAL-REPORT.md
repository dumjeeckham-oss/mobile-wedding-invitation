# INVITE P2-B2 로컬 구현·검증 보고서

## 판정

**PARTIAL**

로컬 관리자·공개 행사 편집 흐름, Worker 인증/API, local D1 migration, 로고·배경·폰트 편집을 구현하고 검증했다. Cloudflare Access 실제 연결, 원격 Worker/D1/R2, 외부 지도 앱과 YouTube 실제 재생은 운영 리소스 금지 범위이므로 검증하지 않았다.

## 구현 결과

- `/admin`: 대시보드, 행사 관리, 단체 관리, 로고 관리, 디자인 설정
- `/e/{slug}`: 공개 상태 행사만 표시
- 행사 생성·수정·임시저장·복제·공개/비공개·휴지통/복구·링크 복사
- localStorage 기반 로컬 repository; 저장 실패 시 현재 draft 유지
- 로고 업로드: PNG/JPEG/WebP, 2MiB 제한, 브라우저 이미지 디코딩 검사
- 로고 외부 URL: HTTPS, 길이, credential URL, localhost 검사
- 행사별 로고 우선순위: custom → 단체 기본 → 없음
- 12종 한글 폰트 allowlist
- 12종 CSS 기반 배경 preset 및 fallback 아이보리
- 배경·폰트·테마·로고 실시간 미리보기
- `worker/index.ts`: 공개 조회와 관리자 API 분리
- `worker/auth.ts`: Access JWT RS256, JWKS, issuer/audience/expiry/email 확인
- `worker/preview.ts`: 행사 ID 바인딩 5분 미리보기 토큰
- `worker/migrations/0001_init.sql`: organizations, logo_assets, events
- `wrangler.local.toml`: 원격 바인딩 없는 local-only D1 설정

## 자동 검증

```text
npm run build                                  PASS
npx tsc ... worker/*.ts                        PASS
npx tsx --test tests/p2-b2.test.ts             6/6 PASS
git diff --check                               PASS
npm run lint                                   UNAVAILABLE (ESLint config absent in baseline)
```

자동 테스트 항목:

- 인증 헤더 없음
- 만료 JWT
- 관리자 이메일 불일치
- 잘못된 영상·로고 URL
- 로고 MIME·2MiB 검증
- 12종 배경 및 fallback
- 로고 custom/단체 기본/url/none 우선순위
- 행사 생성·복제·비공개 API 차단
- preview token 행사 바인딩·만료

## Local D1

Wrangler local persistence에서 migration을 적용했다.

- `0001_init.sql`: 7 commands successful
- 합성 organization/event insert 성공
- draft → public update 및 재조회 성공
- `navy-gold` 배경 설정 JSON 보존 확인
- 원격 D1 접근 및 `--remote` 사용 없음

## 브라우저 검증

로컬 preview에서 관리자와 공개 행사를 확인했다.

- 360×800: overflow 없음
- 390×844: overflow 없음
- 768×1024: overflow 없음
- 1440×900: overflow 없음
- 관리자 행사 편집 폼 표시
- 잘못된 YouTube URL 오류 메시지
- 배경 preset 선택 즉시 preview 반영
- 외부 로고 URL 설정 및 로고 오류 시 레이아웃 유지
- 공개 행사에 YouTube iframe 및 네이버/카카오 4개 길찾기 링크 표시
- 비공개 전환 후 `/e/{slug}` 직접 접근 차단
- 기존 갤러리 12개 및 PhotoSwipe 구조 유지

## 미검증·제한

- 실제 Cloudflare Access 계정/JWKS 연결
- 실제 Cloudflare Worker/D1/R2 생성·배포
- 네이버·카카오 앱 설치 상태에서의 scheme 전환
- YouTube 외부 영상의 실제 재생/삽입 정책
- 외부 이미지 URL의 실제 MIME 검증: 현재 서버 다운로드·프록시를 하지 않고 브라우저 `onError`로 숨김 처리
- 운영 저장소 영구 업로드

이번 단계에서는 Cloudflare Pages, Worker, D1, R2, Access 및 기존 운영 시스템을 변경하지 않았다.
