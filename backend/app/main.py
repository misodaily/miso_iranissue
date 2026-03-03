"""
Iran Dashboard - FastAPI Backend
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import async_engine, Base
from app.api import health, articles, issues, alerts

# Import models to register them with Base
import app.models  # noqa: F401

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tables are created via Alembic migrations (scripts/init_db.sh)
    logger.info("Application started")
    yield
    await async_engine.dispose()
    logger.info("Database connection closed")


app = FastAPI(
    title="Iran Dashboard API",
    description="Real-time US-Iran news monitoring and analysis",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(articles.router)
app.include_router(issues.router)
app.include_router(alerts.router)


@app.get("/")
async def root():
    return {"message": "Iran Dashboard API", "docs": "/docs"}
