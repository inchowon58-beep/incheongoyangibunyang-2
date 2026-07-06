# SEO 대량 생성 VM 연동 가이드

관리자에서 **대량 등록**하면 키워드가 **접속한 도메인 기준** 서버 대기열에 저장됩니다.

| 접속 도메인 | 대기열 저장 | SEO 페이지 저장 |
|-------------|-------------|-----------------|
| 메인 (레거시) | `generation-queue.json` (Blob) | `pages.json` |
| 테넌트 (`gangnam11.eanimal.kr` 등) | Supabase `tenant_generation_jobs` | `tenant_seo_pages` |

VM 프로그램이 **설정한 시간(랜덤) 간격**마다 **해당 도메인의** API를 호출해 **한 번에 1개씩** SEO 페이지를 생성합니다.

생성 완료 시 **순위반영(웹문서 수집) 대기열**에도 자동 등록됩니다. (기존 collection-worker와 동일)

---

## 0. 멀티 테넌트 (서브도메인) — VM 필수 변경

### 핵심 규칙

**VM의 `api_base_url`은 대기열을 처리할 사이트 도메인과 동일해야 합니다.**

| VM이 호출하는 URL | 처리되는 대기열 | 생성되는 페이지 |
|-------------------|-----------------|-----------------|
| `https://demolishzone.yourdogzone.co.kr` | 메인 대기열 | 메인 사이트 |
| `https://gangnam11.eanimal.kr` | gangnam11 대기열 | gangnam11 전용 DB |

- gangnam11 대량 등록 → **gangnam11 URL로 VM 호출** → gangnam11에만 글 생성
- 메인 URL로 VM을 돌리면 **메인 대기열만** 처리 (gangnam11 대기열 무시)

### 여러 서브도메인 운영 시 (2가지 방식)

**방식 A — VM 1대, 사이트 순환 (권장)**

`worker_config.json`:

```json
{
  "worker_token": "여기에_토큰",
  "sites": [
    {
      "api_base_url": "https://demolishzone.yourdogzone.co.kr",
      "generation_interval_min_sec": 300,
      "generation_interval_max_sec": 600
    },
    {
      "api_base_url": "https://gangnam11.eanimal.kr",
      "generation_interval_min_sec": 300,
      "generation_interval_max_sec": 600
    }
  ],
  "collection_interval_sec": 60
}
```

루프에서 `sites` 배열을 돌며 각 `api_base_url`에 대해 jobs → generate-next 실행.

**방식 B — 서브도메인마다 VM 프로세스 1개**

- gangnam11용: `api_base_url = https://gangnam11.eanimal.kr`
- 메인용: `api_base_url = https://demolishzone.yourdogzone.co.kr`

### API 응답에 추가된 필드 (`tenant`)

`GET /api/seo-worker/jobs`, `POST /api/seo-worker/generate-next` 응답:

```json
{
  "tenant": {
    "isTenant": true,
    "siteConfigId": "uuid-...",
    "subdomain": "gangnam11.eanimal.kr"
  }
}
```

메인 사이트: `"isTenant": false`, `subdomain`: null

VM 로그에 `tenant.subdomain` 출력 권장 — 어느 사이트에 생성됐는지 확인용.

---

## 1. 관리자 — 대량 등록

| 방식 | 설명 |
|------|------|
| **개별 등록** | 키워드 1개 → 즉시 Gemini 생성 |
| **대량 등록 (텍스트)** | 한 줄에 1개, 또는 `,`로 구분 (최대 2000개) |
| **TXT 파일** | 위와 동일 형식의 `.txt` 업로드 |

- **gangnam11.eanimal.kr/admin** 에서 대량 등록 → gangnam11 전용 대기열
- **메인 /admin** 에서 대량 등록 → 메인 대기열

대량 등록은 **즉시 생성하지 않고** VM 대기열에만 넣습니다.

---

## 2. API 명세

인증: 기존 VM과 **동일한 토큰** (`COLLECTION_WORKER_SECRET` / 마스터 설정 VM Worker API 토큰)

### 2-1. 대기 키워드 조회

```
GET https://{해당사이트도메인}/api/seo-worker/jobs
Authorization: Bearer {토큰}
```

```json
{
  "count": 3,
  "summary": { "pending": 3, "processing": 0, "completed": 10, "failed": 0, "total": 13 },
  "tenant": { "isTenant": true, "siteConfigId": "...", "subdomain": "gangnam11.eanimal.kr" },
  "jobs": [
    { "id": "gen-...", "keyword": "은평구철거지원금", "requestedAt": "..." }
  ]
}
```

### 2-2. 다음 1개 생성 (VM이 주기적으로 호출)

```
POST https://{해당사이트도메인}/api/seo-worker/generate-next
Authorization: Bearer {토큰}
```

**성공 응답 예시**

```json
{
  "ok": true,
  "status": "created",
  "message": "SEO 페이지 생성 완료: 은평구 철거지원금",
  "page": { "id": "...", "slug": "...", "keyword": "...", "title": "..." },
  "remaining": 2,
  "collectionEnqueued": true,
  "tenant": { "isTenant": true, "subdomain": "gangnam11.eanimal.kr" }
}
```

**대기 없음**

```json
{ "ok": true, "status": "empty", "message": "대기 중인 키워드가 없습니다. (gangnam11.eanimal.kr)", "remaining": 0 }
```

**일일 한도 초과** — 키워드는 pending 유지, **429** + `shouldPause: true`

```json
{
  "ok": false,
  "status": "quota",
  "message": "오늘 SEO 페이지 생성 한도(30개)를 모두 사용했습니다. ...",
  "remaining": 20,
  "shouldPause": true,
  "retryAfterSec": 45234,
  "nextEligibleAt": "2026-07-06T15:00:00.000Z"
}
```

HTTP 헤더: `Retry-After: {retryAfterSec}` (KST 자정까지)

**VM 필수:** `shouldPause === true` 또는 `status === "quota"` 이면 `generate-next` 호출 중단하고 `retryAfterSec` 만큼 sleep.

---

## 3. VM 프로그램 권장 흐름

```
for each site in sites:   # 멀티 테넌트 시
  loop:
    1. GET {site.api_base_url}/api/seo-worker/jobs — shouldPause 확인
    2. shouldPause === true → retryAfterSec sleep 후 1번으로
    3. POST {site.api_base_url}/api/seo-worker/generate-next — 1개 생성
    4. status가 empty면 → 이 사이트는 짧게 스킵, 다음 사이트로
    5. status가 quota → retryAfterSec sleep
    6. random.uniform(min_sec, max_sec) 대기 후 반복
```

### 단일 사이트 worker_config.json 예시

```json
{
  "api_base_url": "https://gangnam11.eanimal.kr",
  "worker_token": "여기에_토큰",
  "generation_interval_min_sec": 300,
  "generation_interval_max_sec": 600,
  "collection_interval_sec": 60
}
```

### Python 루프 예시 (멀티 사이트)

```python
import random
import time
import requests

SITES = [
    "https://demolishzone.yourdogzone.co.kr",
    "https://gangnam11.eanimal.kr",
]
TOKEN = "your-token"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
MIN_WAIT = 300
MAX_WAIT = 600

while True:
    for api in SITES:
        try:
            status = requests.get(f"{api}/api/seo-worker/jobs", headers=HEADERS, timeout=60)
            status.raise_for_status()
            info = status.json()
            tenant = info.get("tenant") or {}
            label = tenant.get("subdomain") or api
            print(f"[{label}] pending:", info.get("count"))

            if info.get("shouldPause"):
                wait = int(info.get("retryAfterSec") or 3600)
                print(f"[{label}] quota pause — sleep {wait}s")
                time.sleep(wait)
                continue

            r = requests.post(f"{api}/api/seo-worker/generate-next", headers=HEADERS, timeout=180)
            data = r.json()
            print(f"[{label}]", data.get("message"), "remaining:", data.get("remaining"))

            if data.get("shouldPause") or data.get("status") == "quota":
                wait = int(data.get("retryAfterSec") or r.headers.get("Retry-After") or 3600)
                time.sleep(wait)
                continue
            if data.get("status") == "empty":
                continue
        except Exception as e:
            print(f"[{api}] error:", e)

        time.sleep(random.uniform(MIN_WAIT, MAX_WAIT))
```

---

## 4. 수집 VM과 함께 쓰기

| 작업 | API |
|------|-----|
| SEO 생성 | `POST {도메인}/api/seo-worker/generate-next` |
| 웹문서 수집 | `GET/POST {도메인}/api/collection-worker/jobs` |

수집도 **생성한 사이트 도메인** 기준으로 호출하는 것이 좋습니다.

---

## 5. Supabase 마이그레이션

테넌트 대기열 사용 전 SQL Editor에서 실행:

- `supabase/migrations/003_tenant_generation_queue.sql`

---

## 6. 주의사항

- 한 번에 **최대 2000개** 키워드 대량 등록
- **동시 생성 1개** (processing 중이면 VM은 busy)
- **일일 생성 한도** (`dailySeoLimit`) — 사이트 공통 한도 (테넌트별 분리 아님)
- Gemini 생성 **30초~2분** — VM `timeout` 180초 권장
- **gangnam11 대기열 → gangnam11 VM URL** / **메인 대기열 → 메인 VM URL** (혼용 금지)
