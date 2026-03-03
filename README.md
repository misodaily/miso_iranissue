# 🇺🇸🇮🇷 미국-이란 실시간 이슈 대시보드

실시간 뉴스 수집 → OpenAI 분석 → 웹 대시보드 모니터링 시스템

## 아키텍처

```
[Next.js 15 Dashboard :3000]
         ↕ REST API
[FastAPI Backend :8000] ←→ [PostgreSQL :5432]
         ↕
   [Redis :6379]
         ↕
[Celery Worker + Beat]  →  [OpenAI API]
                        →  [RSS Feeds / NewsAPI]
```

## 빠른 시작

### 1. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 열어 필수 값 입력:
# - OPENAI_API_KEY (필수)
# - POSTGRES_PASSWORD (권장 변경)
# - NEWS_API_KEY (선택, https://newsapi.org 무료 가입)
# - SLACK_WEBHOOK_URL (선택)
```

### 2. 전체 서비스 기동

```bash
docker compose up --build -d
```

### 3. DB 마이그레이션

```bash
# 방법 A: 스크립트 사용
bash scripts/init_db.sh

# 방법 B: 직접 실행
docker compose exec backend alembic upgrade head
```

### 4. 샘플 데이터 로드 (선택)

```bash
docker compose exec backend python /app/../scripts/load_sample_data.py
# 또는 로컬에서:
SYNC_DATABASE_URL=postgresql://admin:secret@localhost:5432/iran_dashboard \
  python scripts/load_sample_data.py
```

### 5. 접속 확인

| 서비스 | URL |
|--------|-----|
| 대시보드 | http://localhost:3000 |
| API 문서 | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| 헬스체크 | http://localhost:8000/health |

---

## 환경변수 전체 목록

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `POSTGRES_DB` | `iran_dashboard` | PostgreSQL 데이터베이스명 |
| `POSTGRES_USER` | `admin` | PostgreSQL 사용자 |
| `POSTGRES_PASSWORD` | *필수 설정* | PostgreSQL 비밀번호 |
| `OPENAI_API_KEY` | *필수* | OpenAI API 키 |
| `OPENAI_MODEL` | `gpt-4o-mini` | 사용할 OpenAI 모델 |
| `NEWS_API_KEY` | 선택 | newsapi.org API 키 |
| `RISK_ALERT_THRESHOLD` | `70` | 알림 발생 리스크 점수 임계값 |
| `SLACK_WEBHOOK_URL` | 선택 | Slack Incoming Webhook URL |
| `COLLECTION_INTERVAL_SECONDS` | `300` | 뉴스 수집 주기 (초) |
| `LOG_LEVEL` | `INFO` | 로그 레벨 |

---

## 프로젝트 구조

```
iran-war/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/              # DB 마이그레이션
│   ├── app/
│   │   ├── main.py           # FastAPI 진입점
│   │   ├── config.py         # 설정 (pydantic-settings)
│   │   ├── database.py       # SQLAlchemy 엔진/세션
│   │   ├── models/           # ORM 모델
│   │   │   ├── article.py    # Article
│   │   │   ├── issue.py      # IssueCluster
│   │   │   └── alert.py      # Alert, DailyBrief
│   │   ├── schemas/          # Pydantic 스키마
│   │   ├── api/              # FastAPI 라우터
│   │   │   ├── articles.py   # /api/articles
│   │   │   ├── issues.py     # /api/issues
│   │   │   ├── alerts.py     # /api/alerts
│   │   │   └── health.py     # /health
│   │   ├── services/
│   │   │   ├── collector.py  # RSS/NewsAPI 수집기
│   │   │   ├── analyzer.py   # OpenAI 분석 파이프라인
│   │   │   ├── clustering.py # 이슈 클러스터링
│   │   │   └── notifier.py   # Slack 알림
│   │   ├── workers/
│   │   │   ├── celery_app.py # Celery 설정 + Beat 스케줄
│   │   │   └── tasks.py      # 비동기 태스크
│   │   └── utils/
│   │       ├── dedup.py      # URL 해시, 중복 제거
│   │       └── timezone.py   # UTC/KST 변환
│   └── tests/
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/              # Next.js App Router
│       │   ├── page.tsx      # 메인 대시보드
│       │   └── articles/[id]/page.tsx  # 기사 상세
│       ├── components/
│       │   ├── Dashboard/    # 피드, 차트, 이슈 카드 등
│       │   └── common/       # Header 등
│       ├── lib/
│       │   ├── api.ts        # API 클라이언트
│       │   └── utils.ts      # 유틸리티
│       └── types/index.ts    # TypeScript 타입
└── scripts/
    ├── init_db.sh
    └── load_sample_data.py
```

---

## Celery 태스크 스케줄

| 태스크 | 주기 | 설명 |
|--------|------|------|
| `collect_and_store_news` | 5분 | RSS + NewsAPI 수집 |
| `analyze_pending_articles` | 2분 | OpenAI 분석 (배치 10개) |
| `run_clustering_task` | 5분 | 이슈 클러스터링 |
| `check_risk_alerts` | 2분 | 고위험 알림 생성 |
| `generate_daily_brief_task` | 매일 15:00 KST | 일일 브리핑 생성 |

---

## 뉴스 소스

RSS 피드 기반 수집 (이용약관 준수):

| 소스 | 국가 | 언어 |
|------|------|------|
| Reuters World | US | EN |
| BBC Middle East | UK | EN |
| Al Jazeera | QA | EN |
| The Guardian World | UK | EN |
| Yonhap News | KR | KO |
| Haaretz | IL | EN |

> **저작권 준수**: 원문 전체를 저장하지 않습니다. RSS에서 제공하는 제목, 요약, 메타데이터만 저장하며, 원문 링크를 통해 독자가 직접 접근합니다.

---

## 개발 가이드

### 로컬 백엔드 개발 (Docker 없이)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# DB/Redis는 Docker로 실행
docker compose up postgres redis -d

export DATABASE_URL="postgresql+asyncpg://admin:secret@localhost:5432/iran_dashboard"
export SYNC_DATABASE_URL="postgresql://admin:secret@localhost:5432/iran_dashboard"
export REDIS_URL="redis://localhost:6379/0"
export CELERY_BROKER_URL="redis://localhost:6379/0"
export CELERY_RESULT_BACKEND="redis://localhost:6379/1"
export OPENAI_API_KEY="your-key"

# DB 초기화
alembic upgrade head

# API 서버
uvicorn app.main:app --reload

# 워커 (다른 터미널)
celery -A app.workers.celery_app worker --loglevel=info

# 스케줄러 (다른 터미널)
celery -A app.workers.celery_app beat --loglevel=info
```

### 로컬 프론트엔드 개발

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### 테스트 실행

```bash
cd backend
pip install aiosqlite  # 테스트용 SQLite 드라이버
pytest -v
```

---

## API 명세

### GET /api/articles
기사 목록 조회 (필터/페이지네이션)

**Query Parameters:**
- `q` - 키워드 검색
- `source` - 출처 필터
- `language` - 언어 (`ko`, `en`, `fa`, `ar`)
- `classification` - 분류 (`외교`, `군사`, `제재`, `에너지`, `시장`, `기타`)
- `sentiment` - 감성 (`긴장고조`, `완화`, `중립`)
- `min_risk` / `max_risk` - 리스크 점수 범위 (0-100)
- `from_date` / `to_date` - 날짜 범위 (ISO8601)
- `cluster_id` - 클러스터 ID
- `page` / `page_size` - 페이지네이션

### GET /api/articles/stats
대시보드 통계 (전체 기사수, 분석완료, 평균 리스크 등)

### GET /api/articles/timeline?hours=72
시간대별 기사량/리스크 집계 (타임라인 차트용)

### GET /api/articles/{id}
기사 상세 (본문, 분석 결과, 리스크 근거 포함)

### GET /api/issues
이슈 클러스터 목록

### GET /api/issues/{id}/articles
클러스터에 속한 기사 목록

### GET /api/alerts
알림 목록

### POST /api/alerts/{id}/read
알림 읽음 처리

### GET /api/alerts/daily-briefs
일일 브리핑 목록

### GET /health
서비스 헬스체크 (DB + Redis 상태 포함)

---

## 운영 가이드

### 로그 확인

```bash
# 전체 로그
docker compose logs -f

# 워커 로그만
docker compose logs -f worker

# 특정 시간 이후
docker compose logs --since="2024-01-01T00:00:00"
```

### DB 백업

```bash
docker compose exec postgres pg_dump -U admin iran_dashboard > backup_$(date +%Y%m%d).sql
```

### 수동 태스크 실행

```bash
# 즉시 뉴스 수집
docker compose exec backend celery -A app.workers.celery_app call app.workers.tasks.collect_and_store_news

# 분석 실행
docker compose exec backend celery -A app.workers.celery_app call app.workers.tasks.analyze_pending_articles

# 일일 브리핑 수동 생성
docker compose exec backend celery -A app.workers.celery_app call app.workers.tasks.generate_daily_brief_task
```

### Celery 모니터링 (Flower)

```bash
docker compose exec worker celery -A app.workers.celery_app flower --port=5555
# → http://localhost:5555
```

---

## 남은 리스크 및 추가 개선안

### 단기 개선 (우선순위 높음)
- [ ] WebSocket/SSE로 실시간 푸시 알림
- [ ] OpenAI API 비용 최적화 (배치 API 활용)
- [ ] Nginx 리버스 프록시 + SSL 설정
- [ ] PostgreSQL full-text search (tsvector) 인덱스

### 중기 개선
- [ ] Elasticsearch 연동으로 고급 검색
- [ ] 이메일 알림 (SMTP)
- [ ] 사용자 인증 (JWT) + 개인 알림 설정
- [ ] 기사 감성 트렌드 예측 모델

### 장기 개선
- [ ] Kubernetes 배포 (Helm chart)
- [ ] Prometheus + Grafana 모니터링
- [ ] 멀티 지역 이슈 확장 (러-우크라, 중동 전반)
