from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.database import get_db
from app.models.alert import Alert, DailyBrief
from app.schemas.alert import AlertOut, DailyBriefOut

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertOut])
async def list_alerts(
    unread_only: bool = Query(False),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = []
    if unread_only:
        filters.append(Alert.notified == False)

    stmt = (
        select(Alert)
        .where(*filters if filters else [True])
        .order_by(Alert.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/count")
async def alert_count(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count()).select_from(Alert))).scalar_one()
    unread = (
        await db.execute(
            select(func.count()).select_from(Alert).where(Alert.notified == False)
        )
    ).scalar_one()
    return {"total": total, "unread": unread}


@router.post("/{alert_id}/read")
async def mark_alert_read(alert_id: int, db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timezone
    stmt = select(Alert).where(Alert.id == alert_id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    if alert:
        alert.notified = True
        alert.notified_at = datetime.now(timezone.utc)
        await db.commit()
    return {"status": "ok"}


@router.get("/daily-briefs", response_model=List[DailyBriefOut])
async def list_daily_briefs(
    limit: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(DailyBrief)
        .order_by(DailyBrief.brief_date.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
