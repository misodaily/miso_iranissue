from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

# Async engine (FastAPI)
async_engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)
AsyncSessionLocal = async_sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

# Sync engine (Celery workers)
sync_engine = create_engine(
    settings.sync_database_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)
SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()
