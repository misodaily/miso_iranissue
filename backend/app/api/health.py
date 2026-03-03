from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db
import redis.asyncio as aioredis
from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check for all services."""
    status = {"status": "ok", "services": {}}

    # DB check
    try:
        await db.execute(text("SELECT 1"))
        status["services"]["database"] = "ok"
    except Exception as e:
        status["services"]["database"] = f"error: {e}"
        status["status"] = "degraded"

    # Redis check
    try:
        r = aioredis.from_url(settings.redis_url)
        await r.ping()
        await r.aclose()
        status["services"]["redis"] = "ok"
    except Exception as e:
        status["services"]["redis"] = f"error: {e}"
        status["status"] = "degraded"

    return status


@router.get("/health/ready")
async def readiness():
    return {"status": "ready"}
