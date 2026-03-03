from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://admin:secret@postgres:5432/iran_dashboard"
    sync_database_url: str = "postgresql://admin:secret@postgres:5432/iran_dashboard"

    # Redis / Celery
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # News API
    news_api_key: Optional[str] = None

    # Alert
    risk_alert_threshold: int = 70
    slack_webhook_url: Optional[str] = None

    # App
    log_level: str = "INFO"
    collection_interval_seconds: int = 300
    max_articles_per_source: int = 50

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
