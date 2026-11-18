# P2-B3-FIX1 로컬 E2E 보고서

기준선 `f59b9a8bb6dbe4cfd8a552abd4b1d0b7fb4bd5cf`에서 데이터 보존·CORS·로고·공개 DTO를 보완했다. 원격 Cloudflare 자원은 변경하지 않았다.

## 수정

- Worker 관리자 CORS를 명시적 허용 Origin 방식으로 변경. 미승인 preflight는 `403`, 로컬 허용 Origin은 `204`.
- 행사 `gallery`를 타입·API payload·D1 PATCH/clone·PublicEventDTO·렌더링까지 연결.
- 공개 초대장은 API가 반환한 행사별 갤러리만 표시.
- `top-center`, `top-left`, `bottom`, `hidden` 로고 위치를 실제 DOM 순서로 적용.
- 행사별 로고 URL, 단체 기본 로고 URL, 행사 override 우선순위를 공개 API와 프론트에서 일치시킴.
- React StrictMode 로딩 플래그와 낙관적 동시 수정 timestamp 전송 오류 수정.

## 실제 브라우저 E2E

합성 JWT와 로컬 Worker/D1에서 다음을 확인했다.

- 관리자 API 목록·행사 생성·저장·새로고침 재조회
- 배경·폰트·외부 로고 URL·갤러리 2장 저장
- 행사 공개 후 `/e/browser-e2e-event` 조회
- 공개 화면에서 갤러리 2장과 하단 로고 확인
- 행사 복제 후 갤러리 보존
- 수정 저장 후 기존 갤러리 보존
- 복제 행사에서 로고 숨김 후 이미지 DOM 미생성
- 비공개 전환 후 공개 URL 차단
- 공개 API DTO에서 내부 DB 필드 미노출

## 제한

브라우저 자동화 환경의 현재 viewport는 `565px`였으며, 360×800·390×844·768×1024·1440×900을 각각 강제한 별도 측정은 수행하지 못했다. 외부 이미지 실제 호스트 상태, 외부 지도 앱 이동, YouTube 재생도 미검증이다. 따라서 최종 판정은 `PARTIAL`이다.
