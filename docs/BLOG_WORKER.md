# 네이버 블로그 자동작성 VM 연동

관리자 **블로그작성** 탭에 넣은 설정을, 사이트 등록 시 연결한 **네이버 아이디가 있는 VM**이 가져와 블로그에 발행합니다.

---

## 1. 사전 설정

### 웹

1. `/admin/naver-accounts` — 네이버 아이디 등록
2. `/admin/register` — 사이트 등록 시 해당 네이버 계정 선택
3. `/admin/blog-writing` — 프롬프트·키워드·하루 발행 수·발행 방식 저장, **발행 사용** ON
4. 마스터 설정 — VM Worker API 토큰 (`COLLECTION_WORKER_SECRET`)

### VM

기존 서치어드바이저/수집 VM과 동일하게 `naver_id` + `naver_password` + `worker_token` 을 로컬에 둡니다.

- 블로그 작업은 **그 `naver_id`와 일치하는 사이트 설정만** 내려갑니다.
- 웹에 비밀번호를 저장했다면 job 응답에 `naverPassword`가 포함될 수 있습니다. **비어 있으면 VM 로컬 비밀번호를 사용**하세요.

---

## 2. 동작 요약

```
블로그작성 탭 저장 (키워드 대량 + 하루 N개)
  → keywordQueue 보관
  → 매일 최대 N개만 job 생성 (나머지는 다음날)

VM 폴링
  GET /api/blog-worker/jobs?naverId={내아이디}
  Authorization: Bearer {worker_token}

VM: 네이버 로그인 → 키워드·프롬프트·정보형/후기형으로 글 작성
  → 전화·사이트링크 본문 삽입
  → 발행

POST /api/blog-worker/jobs
  { results: [{ id, status: "completed"|"failed", postUrl? }] }
```

### 발행 시간

| publishMode | 의미 |
|-------------|------|
| `random` | job마다 `scheduledAt`이 하루 중 랜덤 시각 |
| `continuous` | 짧은 간격(약 3분) 순차 `scheduledAt` |

VM은 `scheduledAt` 이전에는 발행을 미루면 됩니다.

---

## 3. API

인증: `Authorization: Bearer {worker_token}`

### 대기 작업 조회

```
GET /api/blog-worker/jobs?naverId=abc123
```

`jobs[]` 주요 필드:

| 필드 | 설명 |
|------|------|
| `id` | 작업 ID |
| `keyword` | 작성 키워드 |
| `basePrompt` | 기본 프롬프트 |
| `writingStyle` | `info` \| `review` |
| `writingStyleLabel` | 정보형 / 후기형 |
| `phone` | 사이트 전화번호 (자동) |
| `siteLink` / `siteUrl` | 사이트 주소 (자동) |
| `brandName` | 상호 |
| `publishMode` | `random` \| `continuous` |
| `scheduledAt` | 권장 발행 시각 (ISO) |
| `naverPassword` | 웹에 저장된 경우만 |

### 클레임 (선택)

```
POST /api/blog-worker/jobs
{ "action": "claim", "ids": ["blog-..."] }
```

### 결과 보고

```
POST /api/blog-worker/jobs
{
  "results": [
    { "id": "blog-...", "status": "completed", "postUrl": "https://blog.naver.com/..." },
    { "id": "blog-...", "status": "failed", "error": "로그인 실패" }
  ]
}
```

---

## 4. 하루 발행 · 대량 키워드

- 키워드를 100개 넣어도 **하루 발행 개수**만큼만 당일 job이 됩니다.
- 소진된 키워드는 큐에서 제거되고, 남은 키워드는 **다음날** 한도만큼 이어서 배정됩니다.
- `publishedToday`는 KST 날짜 기준으로 자정에 리셋됩니다.
