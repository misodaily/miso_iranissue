"""
Issue clustering: Groups similar articles into IssueCluster entities.
Uses keyword overlap + time proximity for MVP clustering.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from collections import Counter

from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.issue import IssueCluster

logger = logging.getLogger(__name__)

CLUSTER_TIME_WINDOW_HOURS = 48
CLUSTER_KEYWORD_OVERLAP_MIN = 2


def compute_keyword_overlap(tags1: List[str], tags2: List[str]) -> int:
    return len(set(t.lower() for t in tags1) & set(t.lower() for t in tags2))


def find_or_create_cluster(
    db: Session,
    article: Article,
) -> Optional[IssueCluster]:
    """
    Find an existing cluster for this article or create a new one.
    Matching criteria: same classification + keyword overlap >= 2 + within 48h window.
    """
    if not article.tags or not article.classification:
        return None

    cutoff = datetime.now(timezone.utc) - timedelta(hours=CLUSTER_TIME_WINDOW_HOURS)

    candidates = (
        db.query(IssueCluster)
        .filter(
            IssueCluster.classification == article.classification,
            IssueCluster.last_updated_at >= cutoff,
        )
        .order_by(IssueCluster.last_updated_at.desc())
        .limit(20)
        .all()
    )

    best_cluster = None
    best_overlap = 0
    for cluster in candidates:
        overlap = compute_keyword_overlap(article.tags, cluster.keywords or [])
        if overlap >= CLUSTER_KEYWORD_OVERLAP_MIN and overlap > best_overlap:
            best_overlap = overlap
            best_cluster = cluster

    if best_cluster:
        # Update cluster metadata
        existing_keywords = set(best_cluster.keywords or [])
        new_keywords = existing_keywords | set(article.tags)
        best_cluster.keywords = list(new_keywords)[:20]
        best_cluster.articles_count = (best_cluster.articles_count or 0) + 1

        # Update risk score (rolling max)
        if article.risk_score and (
            best_cluster.risk_score is None or article.risk_score > best_cluster.risk_score
        ):
            best_cluster.risk_score = article.risk_score

        # Update sentiment (most recent wins)
        if article.sentiment:
            best_cluster.sentiment = article.sentiment

        # Update key sources
        sources = set(best_cluster.key_sources or [])
        sources.add(article.source)
        best_cluster.key_sources = list(sources)[:10]

        db.commit()
        return best_cluster

    # Create new cluster
    cluster = IssueCluster(
        title=article.title[:300],
        summary=article.summary_ko,
        classification=article.classification,
        sentiment=article.sentiment,
        risk_score=article.risk_score,
        articles_count=1,
        keywords=list(article.tags)[:20],
        key_sources=[article.source],
        first_seen_at=article.published_at or datetime.now(timezone.utc),
    )
    db.add(cluster)
    db.commit()
    db.refresh(cluster)
    logger.info(f"Created new cluster: {cluster.title[:50]}")
    return cluster


def run_clustering(db: Session) -> int:
    """
    Process unassigned analyzed articles and assign to clusters.
    Returns count of articles processed.
    """
    unassigned = (
        db.query(Article)
        .filter(
            Article.cluster_id.is_(None),
            Article.analysis_attempted == True,
            Article.classification.isnot(None),
        )
        .order_by(Article.published_at.asc())
        .limit(200)
        .all()
    )

    count = 0
    for article in unassigned:
        cluster = find_or_create_cluster(db, article)
        if cluster:
            article.cluster_id = cluster.id
            count += 1

    db.commit()
    logger.info(f"Clustering: assigned {count} articles to clusters")
    return count
