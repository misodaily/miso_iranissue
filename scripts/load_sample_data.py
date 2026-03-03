#!/usr/bin/env python3
"""
Load sample data into the database for testing.
Run: python scripts/load_sample_data.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.article import Article
from app.models.issue import IssueCluster
from app.models.alert import Alert
from app.utils.dedup import make_url_hash

DB_URL = os.getenv("SYNC_DATABASE_URL", "postgresql://admin:secret@localhost:5432/iran_dashboard")

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

SAMPLE_ARTICLES = [
    {
        "source": "Reuters",
        "source_country": "US",
        "title": "Iran nuclear talks resume in Vienna amid tensions",
        "url": "https://example.com/reuters/1",
        "language": "en",
        "body": "Negotiations between Iran and world powers resumed in Vienna on Monday, with diplomats expressing cautious optimism about a potential agreement to revive the 2015 nuclear deal.",
        "published_at": datetime.now(timezone.utc) - timedelta(hours=2),
        "tags": ["이란", "핵협상", "JCPOA", "외교"],
        "summary_ko": "이란과 강대국들 간의 핵 협상이 비엔나에서 재개됐다. 외교관들은 2015년 핵합의 부활에 조심스러운 낙관론을 표명했다.",
        "classification": "외교",
        "sentiment": "완화",
        "risk_score": 45,
        "risk_factors": [
            {"reason": "협상 진전으로 긴장 완화 가능성", "weight": 25},
            {"reason": "과거 협상 실패 전례", "weight": 20},
        ],
        "is_relevant": True,
        "analysis_attempted": True,
    },
    {
        "source": "BBC Middle East",
        "source_country": "UK",
        "title": "US imposes new sanctions on Iranian oil exports",
        "url": "https://example.com/bbc/1",
        "language": "en",
        "body": "The United States announced sweeping new sanctions targeting Iran's oil exports, aiming to cut revenue to Tehran's government amid stalled nuclear talks.",
        "published_at": datetime.now(timezone.utc) - timedelta(hours=5),
        "tags": ["제재", "미국", "이란", "석유", "원유"],
        "summary_ko": "미국이 이란의 석유 수출을 겨냥한 새로운 제재를 발표했다. 핵 협상이 교착 상태에 빠진 가운데 이란 정부 수입을 줄이려는 조치다.",
        "classification": "제재",
        "sentiment": "긴장고조",
        "risk_score": 72,
        "risk_factors": [
            {"reason": "광범위한 에너지 제재로 경제적 압박 심화", "weight": 40},
            {"reason": "이란의 보복 가능성", "weight": 32},
        ],
        "is_relevant": True,
        "analysis_attempted": True,
    },
    {
        "source": "Al Jazeera",
        "source_country": "QA",
        "title": "Iran military conducts exercises near Strait of Hormuz",
        "url": "https://example.com/aljazeera/1",
        "language": "en",
        "body": "Iran's Revolutionary Guard Corps conducted large-scale military exercises near the Strait of Hormuz, demonstrating its ability to close the critical waterway.",
        "published_at": datetime.now(timezone.utc) - timedelta(hours=1),
        "tags": ["이란", "군사", "호르무즈", "혁명수비대", "IRGC"],
        "summary_ko": "이란 혁명수비대가 호르무즈 해협 인근에서 대규모 군사 훈련을 실시했다. 핵심 해상 통로를 봉쇄할 수 있는 능력을 과시했다.",
        "classification": "군사",
        "sentiment": "긴장고조",
        "risk_score": 85,
        "risk_factors": [
            {"reason": "전략적 해상 통로 위협으로 글로벌 에너지 공급 차질 우려", "weight": 45},
            {"reason": "미-이란 군사 충돌 위험 고조", "weight": 40},
        ],
        "is_relevant": True,
        "analysis_attempted": True,
    },
    {
        "source": "연합뉴스",
        "source_country": "KR",
        "title": "이란 핵 협상 타결 기대감에 국제 유가 하락",
        "url": "https://example.com/yonhap/1",
        "language": "ko",
        "body": "이란 핵 협상이 진전 조짐을 보이면서 국제 유가가 하락했다. 시장에서는 이란산 원유의 글로벌 시장 복귀 가능성을 반영하고 있다.",
        "published_at": datetime.now(timezone.utc) - timedelta(hours=3),
        "tags": ["이란", "핵협상", "에너지", "유가", "시장"],
        "summary_ko": "이란 핵 협상 진전 기대감에 국제 유가가 하락세를 보이고 있다. 이란산 원유의 시장 복귀 가능성이 반영된 움직임이다.",
        "classification": "에너지",
        "sentiment": "완화",
        "risk_score": 30,
        "risk_factors": [
            {"reason": "협상 불확실성 여전", "weight": 15},
            {"reason": "지역 긴장 지속", "weight": 15},
        ],
        "is_relevant": True,
        "analysis_attempted": True,
    },
    {
        "source": "Guardian",
        "source_country": "UK",
        "title": "Biden administration signals flexibility in Iran nuclear deal timeline",
        "url": "https://example.com/guardian/1",
        "language": "en",
        "body": "White House officials indicated greater flexibility in negotiations over Iran's nuclear program, suggesting a phased approach to sanctions relief could be acceptable.",
        "published_at": datetime.now(timezone.utc) - timedelta(hours=8),
        "tags": ["미국", "이란", "핵협상", "외교", "JCPOA"],
        "summary_ko": "바이든 행정부가 이란 핵 프로그램 협상에서 더 큰 유연성을 시사했다. 단계적 제재 해제 방식이 수용 가능하다는 입장을 표명했다.",
        "classification": "외교",
        "sentiment": "완화",
        "risk_score": 38,
        "risk_factors": [
            {"reason": "의회 내 강경파 반발 가능성", "weight": 20},
            {"reason": "이란 내부 정치적 저항", "weight": 18},
        ],
        "is_relevant": True,
        "analysis_attempted": True,
    },
]

SAMPLE_CLUSTERS = [
    {
        "title": "이란 핵협상 재개 및 JCPOA 부활 논의",
        "summary": "비엔나 협상을 중심으로 이란과 미국, 유럽 강대국들 간의 핵합의 재건 논의가 진행 중. 단계적 제재 해제가 핵심 쟁점.",
        "classification": "외교",
        "sentiment": "완화",
        "risk_score": 42,
        "articles_count": 3,
        "keywords": ["핵협상", "JCPOA", "이란", "외교", "제재 해제"],
        "key_sources": ["Reuters", "Guardian", "BBC"],
        "first_seen_at": datetime.now(timezone.utc) - timedelta(days=2),
    },
    {
        "title": "미국 對이란 에너지 제재 강화",
        "summary": "미국이 이란의 석유 수출을 겨냥한 추가 제재를 발동. 이란 경제에 압박을 가하며 협상 복귀를 압박하는 전략.",
        "classification": "제재",
        "sentiment": "긴장고조",
        "risk_score": 68,
        "articles_count": 2,
        "keywords": ["제재", "석유", "에너지", "이란", "미국"],
        "key_sources": ["BBC", "연합뉴스"],
        "first_seen_at": datetime.now(timezone.utc) - timedelta(hours=6),
    },
    {
        "title": "호르무즈 해협 군사 긴장",
        "summary": "이란 혁명수비대의 대규모 해협 훈련으로 지역 긴장 고조. 글로벌 에너지 공급로 위협 가능성 주목.",
        "classification": "군사",
        "sentiment": "긴장고조",
        "risk_score": 85,
        "articles_count": 1,
        "keywords": ["군사", "호르무즈", "이란", "혁명수비대", "IRGC"],
        "key_sources": ["Al Jazeera"],
        "first_seen_at": datetime.now(timezone.utc) - timedelta(hours=2),
    },
]


def load_sample():
    db = Session()
    try:
        # Create clusters
        cluster_map = {}
        for i, cd in enumerate(SAMPLE_CLUSTERS):
            existing = db.query(IssueCluster).filter(IssueCluster.title == cd["title"]).first()
            if not existing:
                c = IssueCluster(**cd)
                db.add(c)
                db.flush()
                cluster_map[i] = c.id
                print(f"  ✓ Cluster: {cd['title'][:50]}")
            else:
                cluster_map[i] = existing.id

        db.commit()

        # Create articles
        for i, ad in enumerate(SAMPLE_ARTICLES):
            url_hash = make_url_hash(ad["url"])
            existing = db.query(Article).filter(Article.url_hash == url_hash).first()
            if not existing:
                # Assign cluster by index logic
                cluster_idx = i % len(SAMPLE_CLUSTERS)
                a = Article(
                    url_hash=url_hash,
                    cluster_id=cluster_map.get(cluster_idx),
                    **{k: v for k, v in ad.items() if hasattr(Article, k)},
                )
                db.add(a)
                print(f"  ✓ Article: {ad['title'][:50]}")
            else:
                print(f"  ~ Skip (exists): {ad['title'][:50]}")

        db.commit()

        # Create sample alert
        high_risk = db.query(Article).filter(Article.risk_score >= 80).first()
        if high_risk:
            existing_alert = db.query(Alert).filter(Alert.article_id == high_risk.id).first()
            if not existing_alert:
                alert = Alert(
                    article_id=high_risk.id,
                    alert_type="risk_spike",
                    title=f"⚠️ 고위험 기사 감지 (리스크 {high_risk.risk_score}/100)",
                    message=f"출처: {high_risk.source}\n분류: {high_risk.classification}\n제목: {high_risk.title}",
                    risk_score=high_risk.risk_score,
                    threshold=70,
                )
                db.add(alert)
                db.commit()
                print(f"  ✓ Alert: {alert.title}")

        print("\n✅ Sample data loaded successfully!")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Loading sample data...")
    load_sample()
