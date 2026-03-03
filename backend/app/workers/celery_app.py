from celery import Celery
from celery.schedules import crontab
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "iran_dashboard",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
    beat_schedule={
        "collect-news": {
            "task": "app.workers.tasks.collect_and_store_news",
            "schedule": settings.collection_interval_seconds,
            "options": {"expires": settings.collection_interval_seconds - 10},
        },
        "analyze-pending": {
            "task": "app.workers.tasks.analyze_pending_articles",
            "schedule": 120,  # every 2 min
        },
        "run-clustering": {
            "task": "app.workers.tasks.run_clustering_task",
            "schedule": 300,  # every 5 min
        },
        "generate-daily-brief": {
            "task": "app.workers.tasks.generate_daily_brief_task",
            "schedule": crontab(hour=6, minute=0),  # 06:00 UTC = 15:00 KST
        },
        "check-risk-alerts": {
            "task": "app.workers.tasks.check_risk_alerts",
            "schedule": 120,
        },
    },
)
