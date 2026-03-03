from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional, List

from app.database import get_db
from app.models.issue import IssueCluster
from app.models.article import Article
from app.schemas.issue import IssueClusterOut, IssueClusterDetail
from app.schemas.article import ArticleOut

router = APIRouter(prefix="/api/issues", tags=["issues"])


@router.get("", response_model=List[IssueClusterOut])
async def list_issues(
    classification: Optional[str] = None,
    min_risk: Optional[int] = Query(None, ge=0, le=100),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = []
    if classification:
        filters.append(IssueCluster.classification == classification)
    if min_risk is not None:
        filters.append(IssueCluster.risk_score >= min_risk)

    stmt = (
        select(IssueCluster)
        .where(and_(*filters) if filters else True)
        .order_by(IssueCluster.last_updated_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{cluster_id}", response_model=IssueClusterDetail)
async def get_issue(cluster_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(IssueCluster).where(IssueCluster.id == cluster_id)
    result = await db.execute(stmt)
    cluster = result.scalar_one_or_none()
    if not cluster:
        raise HTTPException(status_code=404, detail="Issue cluster not found")
    return cluster


@router.get("/{cluster_id}/articles", response_model=List[ArticleOut])
async def get_cluster_articles(
    cluster_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Article)
        .where(Article.cluster_id == cluster_id)
        .order_by(Article.published_at.desc().nullslast())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
