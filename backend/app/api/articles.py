from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timezone
import math

from app.database import get_db
from app.models.article import Article
from app.schemas.article import ArticleOut, ArticleDetail, ArticleListResponse

router = APIRouter(prefix="/api/articles", tags=["articles"])


@router.get("", response_model=ArticleListResponse)
async def list_articles(
    q: Optional[str] = Query(None, description="Keyword search"),
    source: Optional[str] = None,
    language: Optional[str] = None,
    classification: Optional[str] = None,
    sentiment: Optional[str] = None,
    min_risk: Optional[int] = Query(None, ge=0, le=100),
    max_risk: Optional[int] = Query(None, ge=0, le=100),
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    cluster_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = [Article.is_relevant == True]

    if q:
        filters.append(
            or_(
                Article.title.ilike(f"%{q}%"),
                Article.summary_ko.ilike(f"%{q}%"),
                Article.body.ilike(f"%{q}%"),
            )
        )
    if source:
        filters.append(Article.source == source)
    if language:
        filters.append(Article.language == language)
    if classification:
        filters.append(Article.classification == classification)
    if sentiment:
        filters.append(Article.sentiment == sentiment)
    if min_risk is not None:
        filters.append(Article.risk_score >= min_risk)
    if max_risk is not None:
        filters.append(Article.risk_score <= max_risk)
    if from_date:
        filters.append(Article.published_at >= from_date)
    if to_date:
        filters.append(Article.published_at <= to_date)
    if cluster_id:
        filters.append(Article.cluster_id == cluster_id)

    # Count
    count_q = select(func.count()).select_from(Article).where(and_(*filters))
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    # Paginate
    offset = (page - 1) * page_size
    stmt = (
        select(Article)
        .where(and_(*filters))
        .order_by(Article.published_at.desc().nullslast(), Article.collected_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    items = result.scalars().all()

    return ArticleListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size),
    )


@router.get("/stats")
async def article_stats(db: AsyncSession = Depends(get_db)):
    """Dashboard statistics."""
    total_stmt = select(func.count()).select_from(Article).where(Article.is_relevant == True)
    analyzed_stmt = select(func.count()).select_from(Article).where(
        Article.is_relevant == True, Article.analysis_attempted == True
    )
    avg_risk_stmt = select(func.avg(Article.risk_score)).where(Article.risk_score.isnot(None))
    high_risk_stmt = select(func.count()).select_from(Article).where(
        Article.risk_score >= 70
    )

    total = (await db.execute(total_stmt)).scalar_one()
    analyzed = (await db.execute(analyzed_stmt)).scalar_one()
    avg_risk_raw = (await db.execute(avg_risk_stmt)).scalar_one()
    high_risk = (await db.execute(high_risk_stmt)).scalar_one()

    avg_risk = round(float(avg_risk_raw), 1) if avg_risk_raw else 0

    # Classification distribution
    cls_stmt = select(Article.classification, func.count().label("cnt")).where(
        Article.classification.isnot(None)
    ).group_by(Article.classification).order_by(func.count().desc())
    cls_result = await db.execute(cls_stmt)
    classifications = [{"name": r[0], "count": r[1]} for r in cls_result.all()]

    # Sentiment distribution
    sent_stmt = select(Article.sentiment, func.count().label("cnt")).where(
        Article.sentiment.isnot(None)
    ).group_by(Article.sentiment)
    sent_result = await db.execute(sent_stmt)
    sentiments = [{"name": r[0], "count": r[1]} for r in sent_result.all()]

    return {
        "total_articles": total,
        "analyzed_articles": analyzed,
        "avg_risk_score": avg_risk,
        "high_risk_count": high_risk,
        "classifications": classifications,
        "sentiments": sentiments,
    }


@router.get("/timeline")
async def article_timeline(
    hours: int = Query(72, ge=1, le=720),
    db: AsyncSession = Depends(get_db),
):
    """Articles grouped by hour for timeline chart."""
    from sqlalchemy import text, bindparam
    from datetime import timedelta

    # Use Python-side cutoff to avoid INTERVAL parameter binding issues
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

    sql = text("""
        SELECT
            date_trunc('hour', published_at) AS hour,
            COUNT(*) AS article_count,
            AVG(risk_score) AS avg_risk,
            MAX(risk_score) AS max_risk
        FROM articles
        WHERE published_at >= :cutoff
          AND is_relevant = true
          AND published_at IS NOT NULL
        GROUP BY hour
        ORDER BY hour ASC
    """)

    result = await db.execute(sql, {"cutoff": cutoff})
    rows = result.fetchall()

    return [
        {
            "hour": row[0].isoformat() if row[0] else None,
            "article_count": row[1],
            "avg_risk": round(float(row[2]), 1) if row[2] else 0,
            "max_risk": row[3] or 0,
        }
        for row in rows
    ]


@router.get("/sources")
async def list_sources(db: AsyncSession = Depends(get_db)):
    """List all available sources."""
    stmt = (
        select(Article.source, Article.source_country, func.count().label("cnt"))
        .where(Article.is_relevant == True)
        .group_by(Article.source, Article.source_country)
        .order_by(func.count().desc())
    )
    result = await db.execute(stmt)
    return [{"source": r[0], "country": r[1], "count": r[2]} for r in result.all()]


@router.get("/{article_id}", response_model=ArticleDetail)
async def get_article(article_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Article).where(Article.id == article_id)
    result = await db.execute(stmt)
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article
