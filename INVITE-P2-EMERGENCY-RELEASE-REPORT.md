# INVITE-P2-EMERGENCY-RELEASE 결과

## 1. 배포 결과

- 공개 URL: https://invite-p2-staging.pages.dev/e/jinbo-bucheon-2026-year-end
- slug: `jinbo-bucheon-2026-year-end`
- 배포 방식: 기존 Pages 배포와 staging D1에 합성 행사 보존 후 실제 행사 1건 추가
- 코드 변경: 없음
- 배포 코드 SHA: `fb645852b4591128a85ee84a1aa3040607f0ab8a`
- D1: `invite-p2-staging-db`에만 INSERT 수행

## 2. 게시 내용

- 제목: 2026 진보당 부천시지역위원회 송년회
- 날짜: 2026년 12월 6일
- 장소: 내고향 식당
- 주소: 부천시 길주로 273 2층
- 주최: 진보당 부천시지역위원회
- 안내: 회비 1인 2만원
- 로고: 사용자가 제공한 Wikimedia HTTPS SVG URL
- 지도: 네이버 대중교통·차량, 카카오 대중교통·차량 링크 표시
- 동영상: YouTube URL 미제공으로 비활성화. 임의 영상은 등록하지 않음

## 3. 검증

- 공개 API: HTTP 200
- 공개 행사 화면: HTTP 200
- 제목·날짜·장소·안내 문구: 브라우저 DOM에서 확인
- 로고 이미지: `complete=true`, natural size `533×176`
- 갤러리 이미지: 1장 로딩 확인
- 지도 링크: 4개 표시 확인
- 관리자 API 무인증: Access 로그인으로 리디렉션
- Worker 직접 관리자 API 무인증: HTTP 401 유지
- 기존 합성 행사: 삭제하지 않음

브라우저 시각 확인은 완료했지만, 현재 Chrome CDP 실행 제한으로 정확한 360×800·390×844·768×1024·1440×900 측정은 미완료다.

## 4. 로그인 오류 후속

관리자 API 인증 우회나 Access 정책 변경은 수행하지 않았다. 기존 `unauthorized` 원인은 Worker의 `ACCESS_ISSUER`, `ACCESS_AUDIENCE`, `ADMIN_EMAIL`, `ACCESS_JWKS_URL` 중 하나의 불일치·누락 또는 Pages Function의 JWT 전달 여부를 확인해야 한다.

## 5. 기존 리소스 보호

- 기존 Access 정책: 변경 없음
- `/api/admin/*` 인증: 유지
- 기존 Pages 프로젝트: 변경 없음
- 기존 Worker: 변경 없음
- 기존 D1 4개: 변경 없음
- 기존 행사 데이터: 삭제·초기화 없음
