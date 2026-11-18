# INVITE P2-B1 설계안

상태: 설계 확정 초안

이 문서는 P2-A 기능을 원격 백업하고, 단일 관리자용 범용 모바일 초대장 시스템을 구현하기 위한 설계 기준이다. 이번 단계에서는 Worker, D1, Access, 이미지 저장소를 생성하거나 운영 활성화하지 않는다.

## 1. 기준선과 범위

- 저장소: `dumjeeckham-oss/mobile-wedding-invitation`
- 기준 브랜치: `p1/cloudflare-trial`
- P2-A 브랜치: `p2/event-core-map-video`
- P2-A 커밋: `fe3f15113fd0e0d42c9de8456d6b740236f8bdfc`
- P2-A 원격 백업: 완료
- P2-A 브랜치의 Cloudflare Pages 자동 배포: 하지 않음
- 관리자: 1명, 일반 이용자 회원가입 없음

## 2. P2-A 합성 기능 검증

개인정보 없는 합성 장소와 가상 YouTube ID를 사용했다.

| 항목 | 결과 |
|---|---|
| 네이버 대중교통 | `nmap://route/public` 생성 확인 |
| 네이버 차량 | `nmap://route/car` 생성 확인 |
| 카카오 대중교통 | `kakaomap://route?...by=PUB` 생성 확인 |
| 카카오 차량 | `kakaomap://route?...by=CAR` 생성 확인 |
| 좌표 없음 | 웹 지도 검색 fallback 확인 |
| YouTube watch | embed URL 변환 확인 |
| YouTube Shorts/youtu.be | embed URL 변환 확인 |
| 외부 동영상 도메인 | 차단 확인 |
| 잘못된 영상 ID | 차단 확인 |
| 앱 미설치 fallback | 앱 scheme 시도 후 웹 URL fallback 구현 확인 |

실제 네이버·카카오 앱 설치 상태에서의 앱 전환과 YouTube 영상의 실제 재생은 이 단계에서 확인하지 않았다. 따라서 이 항목은 구현 검증 기준으로는 PARTIAL이다.

## 3. 관리자 시스템 구조

### 공개 화면

- Pages 정적 프론트엔드가 `/e/{slug}`를 표시한다.
- 공개 API는 `publication_status = 'public'`인 행사만 반환한다.
- 초대장 응답에는 관리자 인증 정보, 비공개 행사, 내부 메모를 포함하지 않는다.
- 비공개·임시저장·보관 상태의 slug는 공개 API에서 404로 처리한다.

### 관리자 API

Cloudflare Worker의 `/api/admin/*`에서만 CRUD를 제공한다.

- `GET /api/admin/events`
- `POST /api/admin/events`
- `GET /api/admin/events/:id`
- `PATCH /api/admin/events/:id`
- `POST /api/admin/events/:id/clone`
- `DELETE /api/admin/events/:id` — 즉시 물리 삭제하지 않고 휴지통 상태로 전환
- `POST /api/admin/events/:id/publish`
- `POST /api/admin/events/:id/unpublish`
- `GET /api/admin/events/:id/preview-token`
- `GET /api/admin/organizations`
- `POST /api/admin/organizations`
- `PATCH /api/admin/organizations/:id`
- `POST /api/admin/logos`

관리자 화면은 P2-B2에서 구현하며, 서버 API의 권한 검사가 먼저 존재해야 한다. 클라이언트 메뉴를 숨기는 것만으로 인증을 대체하지 않는다.

## 4. 인증과 공개 접근 통제

1. 단일 관리자 이메일만 Cloudflare Access allowlist에 등록한다.
2. Worker가 `Cf-Access-Jwt-Assertion`을 수신한다.
3. Worker가 Access JWKS 서명을 서버 측에서 검증하고, issuer, audience, expiry, 관리자 이메일을 확인한다.
4. 검증 실패 시 모든 `/api/admin/*` 요청은 401/403으로 종료한다.
5. 공개 `/api/public/events/:slug`는 Access 인증을 요구하지 않지만, SQL 조건으로 public 상태만 조회한다.
6. preview token은 짧은 만료시간과 행사 ID 바인딩을 적용하며 관리자 API에서만 발급한다.

Cloudflare Access의 실제 계정 설정과 요금은 별도 승인 후 확인한다. 이번 단계에는 로그인·Access 정책을 활성화하지 않는다.

## 5. 단체와 로고 관리

### 요구사항

관리자 1명이 여러 단체를 등록하고, 같은 단체의 여러 행사에서 로고를 재사용한다. 개인 행사는 단체 없이 생성할 수 있다. 행사별 로고가 있으면 단체 기본 로고보다 우선한다.

### 로고 선택 우선순위

```text
logo_visible = false  -> 표시하지 않음
logo_visible = true && event.custom_logo_asset_id 존재 -> 행사별 로고
logo_visible = true && event.custom_logo_asset_id 없음 && organization.logo_asset_id 존재 -> 단체 기본 로고
그 외 -> 로고 없이 정상 표시
```

단체 기본 로고를 변경해도 과거 행사에서 행사별로 지정한 로고는 변하지 않는다. 기본 로고를 참조하는 행사만 최신 단체 로고를 사용한다.

### 표시 설정

- `top-center`: 상단 중앙
- `top-left`: 상단 왼쪽
- `bottom`: 하단
- `hidden`: 숨김
- 크기: `small`, `medium`, `large`
- 원본 비율 유지: CSS `object-fit: contain`, 고정 최대 박스 사용
- 투명 PNG/WebP 지원
- 제목·본문과 겹치지 않도록 로고 영역에 별도 레이아웃 높이 확보
- 모바일에서는 최대 너비/최대 높이를 더 작게 제한
- 데스크톱에서는 행사 콘텐츠 폭 안에서만 확대

### 업로드 정책

- 우선 허용: PNG, JPEG, WebP
- 파일당 최대 2MiB
- 파일 확장자가 아니라 MIME sniffing 및 이미지 디코딩으로 실제 콘텐츠 확인
- 픽셀 수 상한을 추가해 압축 폭탄 방지
- SVG는 1차 구현에서 비활성화한다. 지원 시 XML 파싱, 외부 참조·스크립트·이벤트 속성 제거, 허용 태그/속성 allowlist가 필요하다.
- 관리자 Access 인증과 행사/단체 소유권을 업로드 요청마다 확인한다.
- 동일 파일은 SHA-256 해시와 크기·MIME을 조합해 재사용 후보로 식별한다. 자동 삭제는 하지 않는다.
- 공개 응답에는 저장소 내부 키나 원본 업로드 경로를 노출하지 않고 서명된 공개 asset URL만 반환한다.

### 저장소 선택

| 방식 | 장점 | 위험/제약 | 결론 |
|---|---|---|---|
| Git 정적 asset | 단순, 기존 Pages와 일치 | 관리자 업로드·삭제에 부적합, 커밋/빌드 필요 | 초기 운영용 비추천 |
| D1 BLOB | 별도 저장소 없음 | 2MiB 로고를 행 수에 넣기 비효율적, DB 백업/응답 부담 | 메타데이터 전용 |
| R2 | 이미지 저장에 적합, 정적 asset과 분리 | 버킷·공개 URL·캐시 정책 필요, 별도 승인 필요 | P2-B2 이후 우선 검토 |
| 외부 이미지 CDN | 변환·최적화 가능 | 외부 계정·비용·개인정보 이전 | 사용하지 않음 |

P2-B2에서는 저장소를 생성하지 않고 인터페이스만 정의한다. 실제 R2 또는 다른 저장소 선택은 예상 파일 수와 계정 무료 한도를 확인한 뒤 별도 승인받는다.

## 6. 행사 데이터 모델

행사별 데이터와 디자인 설정을 독립적으로 보관한다.

필수 개념 필드:

- `event_id`, `slug`, `organization_id`
- `title`, `event_type`, `host`, `event_datetime`
- `venue`, `address`, `coordinates`
- `transportation_info`, `parking_info`, `map_settings`
- `video_url`, `video_title`
- `gallery`
- `font_settings`, `theme_settings`
- `publication_status`, `created_at`, `updated_at`
- `custom_logo_asset_id`, `logo_position`, `logo_size`, `logo_visible`

단체 필드:

- `organization_id`
- `name`
- `logo_asset_id` — 기본 로고, nullable
- `created_at`, `updated_at`

로고 자산 필드:

- `logo_asset_id`
- `organization_id`, nullable
- `storage_key`
- `mime_type`, `byte_size`, `width`, `height`
- `sha256`
- `created_at`, `deleted_at`

## 7. D1 논리 스키마

운영 DB를 생성하지 않고 다음 논리 스키마만 확정한다.

```sql
CREATE TABLE organizations (
  organization_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_asset_id TEXT REFERENCES logo_assets(logo_asset_id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE logo_assets (
  logo_asset_id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(organization_id),
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 2097152),
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE events (
  event_id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(organization_id),
  custom_logo_asset_id TEXT REFERENCES logo_assets(logo_asset_id),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  host TEXT NOT NULL,
  event_datetime TEXT,
  venue TEXT,
  address TEXT,
  coordinates_json TEXT,
  transportation_info TEXT,
  parking_info TEXT,
  map_settings_json TEXT NOT NULL,
  video_url TEXT,
  video_title TEXT,
  gallery_json TEXT NOT NULL,
  font_settings_json TEXT NOT NULL,
  theme_settings_json TEXT NOT NULL,
  logo_position TEXT NOT NULL DEFAULT 'hidden',
  logo_size TEXT NOT NULL DEFAULT 'medium',
  logo_visible INTEGER NOT NULL DEFAULT 0,
  publication_status TEXT NOT NULL DEFAULT 'draft',
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_events_public_slug ON events(slug, publication_status, deleted_at);
CREATE INDEX idx_events_organization ON events(organization_id, deleted_at);
```

실제 D1 적용 시 순환 FK는 migration 순서에 맞춰 처리한다. 행사 복제는 새 `event_id`, 새 slug, 새 timestamps를 생성하고, 갤러리·설정 JSON은 깊은 복사한다. 기본 로고 자산은 참조를 재사용하고, 행사별 로고도 참조만 복사한다.

## 8. 폰트와 테마 시스템

### 후보 검토

| 폰트 | 한글 지원 | 1차 라이선스 판단 | 적용 위치 |
|---|---|---|---|
| Noto Serif KR | 지원 | OFL 1.1 | 제목/본문 |
| 나눔명조 | 지원 | OFL 1.1 | 제목/본문 |
| 고운바탕 | 지원 | OFL 1.1 | 제목 |
| 함렛(Hahmlet) | 지원 | OFL 1.1 | 제목/본문 |
| Noto Sans KR | 지원 | OFL 1.1 | 본문 |
| Pretendard | 지원 | OFL 1.1 | 본문 |
| IBM Plex Sans KR | 지원 | OFL 계열 확인 후 고정 | 본문 |
| 나눔고딕 | 지원 | OFL 1.1 | 본문 |
| 고운돋움 | 지원 | OFL 1.1 | 본문 |
| 주아(Jua) | 지원 | OFL 1.1 | 제목 |
| 가애구(Gaegu) | 지원 | OFL 1.1 | 제목 |
| 나눔손글씨 붓 | 지원 | OFL 1.1 | 제목/장식 |

Google Fonts 저장소의 한국어 family와 OFL 고지를 기준으로 후보를 확인한다. Pretendard는 공식 저장소의 OFL 고지를 사용한다. 실제 도입 전에는 각 배포 패키지의 라이선스 파일을 저장소에 보관하고, 대표 한글·한자·숫자·구두점 샘플을 렌더링해 coverage를 자동 확인한다.

### 런타임 설정

- 행사별 `titleFont`, `bodyFont`, `titleSize`, `bodySize`, `themeColor`, `backgroundColor`
- 방문자는 선택된 행사 폰트만 로드
- 허용 폰트 ID allowlist 외 값은 기본 폰트로 대체
- 본문 최소 크기와 명도 대비 하한을 서버와 CSS 양쪽에서 제한
- 로고·폰트·테마가 제목과 겹치지 않도록 레이아웃 슬롯을 고정
- 웹폰트는 `font-display: swap`과 필요한 weight만 사용

## 9. 보안·운영 정책

- 관리자 API는 Access JWT를 서버에서 검증
- 모든 입력은 길이·열거값·URL·좌표·파일 MIME을 검증
- YouTube는 허용 host와 11자 video ID만 허용
- 지도 URL은 네이버·카카오 허용 host만 허용
- 비공개 행사 slug는 public API에서 조회하지 않음
- 삭제는 soft delete 후 보존 기간을 두고 별도 purge
- 행사 삭제 전 관리자 확인 및 audit log 기록
- 공개 API는 연락처·내부 메모·관리자 이메일·비공개 asset을 반환하지 않음
- 로고 업로드는 2MiB, 허용 MIME, 픽셀 수 상한, 이미지 디코딩 검증을 모두 통과해야 함
- Firebase는 P2-B1에서 활성화하거나 제거하지 않으며, 후속 의존성 정리 계획으로 관리

## 10. Cloudflare 무료 운영 검토

현재 공식 제한 기준:

- Pages Free: 계정당 100 projects, 월 500 builds, 프로젝트당 20,000 files, 파일당 25MiB
- Workers Free: 100,000 requests/day, invocation CPU 10ms, request당 subrequests 50
- D1 Free: 계정 10 databases, database당 500MiB, 계정 storage 5GiB, Free query subrequest 50
- D1 row read/write 일일 한도 초과 시 요청이 실패할 수 있으므로 관리자 대량 작업과 공개 read를 제한하고 경보를 둔다.

정적 공개 초대장만은 현재 Pages Free 범위에 적합하다. 관리자 API와 D1을 추가하면 Workers/D1 무료 한도와 Access 설정을 함께 모니터링해야 한다. 로고 저장은 이미지 수가 늘면 D1 BLOB보다 R2가 적합하지만, R2 생성·공개 버킷·캐시 설정은 별도 승인 대상이다. 이번 단계의 추가 비용은 0원이며, 실제 운영 비용은 이미지 저장량과 요청량을 측정한 후 산정한다.

## 11. P2-B2 구현 순서

1. 타입과 public/admin DTO를 분리
2. Worker 인증 middleware와 public event 조회 API 구현
3. D1 migration을 로컬 테스트용으로만 작성
4. 행사 CRUD·복제·slug 충돌 처리
5. 단체 CRUD와 로고 자산 메타데이터 인터페이스
6. 업로드 저장소 승인 후 PNG/JPEG/WebP 업로드 검증
7. 행사별 로고 우선순위와 반응형 렌더링
8. 폰트 allowlist·테마 편집·미리보기
9. 로컬 합성 데이터로 공개/비공개·권한·복제 회귀 테스트
10. 별도 승인 후에만 Cloudflare preview 또는 운영 리소스 적용

## 12. 결론

P2-A 원격 백업은 완료되었고, 이번 추가 요구사항을 포함한 P2-B1 설계가 확정되었다. 단체 로고는 단체 기본 자산과 행사별 override를 분리해 재사용성과 독립성을 동시에 확보한다. 실제 관리자 UI, Access, Worker, D1, 이미지 저장소 생성은 P2-B2 별도 승인 없이는 시작하지 않는다.

### 참고 자료

- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Workers pricing/limits: https://developers.cloudflare.com/workers/platform/pricing/ 및 https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- D1 free-tier enforcement: https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
- Google Fonts Noto Sans KR: https://github.com/google/fonts/blob/main/ofl/notosanskr/DESCRIPTION.en_us.html
- Google Fonts Hahmlet OFL: https://github.com/google/fonts/blob/main/ofl/hahmlet/OFL.txt
- Google Fonts Nanum Myeongjo OFL: https://github.com/google/fonts/blob/main/ofl/nanummyeongjo/OFL.txt
- Pretendard official repository: https://github.com/orioncactus/pretendard
