"""
Celery tasks: collection, analysis, clustering, alerts, briefings.
"""
import asyncio
import logging
from datetime import datetime, timezone, timedelta

from celery import shared_task
from sqlalchemy.orm import Session

from app.workers.celery_app import celery_app
from app.database import SyncSessionLocal
from app.models.article import Article
from app.models.alert import Alert, DailyBrief
from app.services.analyzer import analyze_article, generate_daily_brief
from app.services.clustering import run_clustering
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ─────────────────────────────────────────────────────────────
# 1. Collect & Store
# ─────────────────────────────────────────────────────────────
@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def collect_and_store_news(self):
    """Fetch news from all sources and persist new articles."""
    import asyncio
    from app.services.collector import collect_all

    try:
        # Run async collector in sync context
        articles_data = asyncio.run(collect_all())
    except Exception as exc:
        logger.error(f"Collection error: {exc}")
        raise self.retry(exc=exc)

    if not articles_data:
        logger.info("No new articles collected")
        return {"stored": 0}

    db: Session = SyncSessionLocal()
    stored = 0
    try:
        for data in articles_data:
            # Check for duplicate by url_hash
            exists = db.query(Article).filter(
                Article.url_hash == data["url_hash"]
            ).first()
            if exists:
                continue

            article = Article(**{k: v for k, v in data.items() if hasattr(Article, k)})
            db.add(article)
            stored += 1

        db.commit()
        logger.info(f"Stored {stored} new articles")
        return {"stored": stored}
    except Exception as exc:
        db.rollback()
        logger.error(f"DB store error: {exc}")
        raise
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# 2. Analyze Pending Articles
# ─────────────────────────────────────────────────────────────
@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def analyze_pending_articles(self, batch_size: int = 10):
    """Analyze articles that haven't been processed by OpenAI yet."""
    db: Session = SyncSessionLocal()
    analyzed = 0

    try:
        pending = (
            db.query(Article)
            .filter(Article.analysis_attempted == False, Article.is_relevant == True)
            .order_by(Article.collected_at.desc())
            .limit(batch_size)
            .all()
        )

        for article in pending:
            article.analysis_attempted = True
            try:
                result = analyze_article(
                    title=article.title,
                    body=article.body or article.summary_raw or "",
                    language=article.language or "en",
                )
                if result:
                    article.summary_ko = result.get("summary_ko")
                    article.classification = result.get("classification")
                    article.sentiment = result.get("sentiment")
                    article.risk_score = result.get("risk_score")
                    article.risk_factors = result.get("risk_factors", [])
                    article.analysis_raw = result.get("analysis_raw")
                    # Merge AI keywords into tags
                    ai_keywords = result.get("keywords", [])
                    existing_tags = set(article.tags or [])
                    article.tags = list(existing_tags | set(ai_keywords))
                    article.analyzed_at = datetime.now(timezone.utc)
                    analyzed += 1
                else:
                    article.analysis_error = "Empty result from OpenAI"
            except Exception as e:
                article.analysis_error = str(e)[:500]
                logger.error(f"Analysis failed for article {article.id}: {e}")

            db.commit()

        logger.info(f"Analyzed {analyzed}/{len(pending)} pending articles")
        return {"analyzed": analyzed, "total_pending": len(pending)}
    except Exception as exc:
        db.rollback()
        logger.error(f"analyze_pending_articles error: {exc}")
        raise
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# 3. Clustering
# ─────────────────────────────────────────────────────────────
@celery_app.task
def run_clustering_task():
    db: Session = SyncSessionLocal()
    try:
        count = run_clustering(db)
        return {"clustered": count}
    except Exception as exc:
        logger.error(f"Clustering error: {exc}")
        raise
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# 4. Risk Alerts
# ─────────────────────────────────────────────────────────────
@celery_app.task
def check_risk_alerts():
    """Create Alert records for high-risk articles not yet alerted."""
    db: Session = SyncSessionLocal()
    alerted = 0
    threshold = settings.risk_alert_threshold

    try:
        # Find high-risk articles without alerts in the last 2 hours
        cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
        alerted_article_ids = {
            a[0] for a in db.query(Alert.article_id).filter(
                Alert.article_id.isnot(None),
                Alert.created_at >= cutoff,
            ).all()
        }

        q = (
            db.query(Article)
            .filter(
                Article.risk_score >= threshold,
                Article.analyzed_at >= cutoff,
            )
        )
        if alerted_article_ids:
            q = q.filter(Article.id.notin_(list(alerted_article_ids)))
        high_risk = q.order_by(Article.risk_score.desc()).limit(10).all()

        for article in high_risk:
            alert = Alert(
                article_id=article.id,
                alert_type="risk_spike",
                title=f"⚠️ 고위험 기사 감지 (리스크 {article.risk_score}/100)",
                message=(
                    f"출처: {article.source}\n"
                    f"분류: {article.classification}\n"
                    f"제목: {article.title[:200]}\n"
                    f"요약: {(article.summary_ko or '')[:300]}"
                ),
                risk_score=article.risk_score,
                threshold=threshold,
            )
            db.add(alert)
            alerted += 1

        db.commit()

        if alerted > 0:
            logger.warning(f"Created {alerted} risk alerts (threshold={threshold})")
            # Try async slack notification in background
            try:
                asyncio.run(_send_slack_alerts(high_risk))
            except Exception:
                pass

        return {"alerts_created": alerted}
    except Exception as exc:
        db.rollback()
        logger.error(f"check_risk_alerts error: {exc}")
        raise
    finally:
        db.close()


async def _send_slack_alerts(articles):
    from app.services.notifier import send_slack_notification, format_risk_alert
    for article in articles[:3]:  # Max 3 Slack messages per run
        msg = format_risk_alert(
            article.title, article.risk_score, article.classification or "", article.source
        )
        await send_slack_notification(msg)


# ─────────────────────────────────────────────────────────────
# 5. Daily Brief
# ─────────────────────────────────────────────────────────────
@celery_app.task
def generate_daily_brief_task():
    """Generate and store daily briefing."""
    db: Session = SyncSessionLocal()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    try:
        # Check if already generated today
        existing = db.query(DailyBrief).filter(DailyBrief.brief_date == today).first()
        if existing:
            return {"status": "already_exists", "date": today}

        # Get today's analyzed articles
        cutoff = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
        articles = (
            db.query(Article)
            .filter(
                Article.analyzed_at >= cutoff,
                Article.summary_ko.isnot(None),
            )
            .order_by(Article.risk_score.desc())
            .limit(30)
            .all()
        )

        if not articles:
            return {"status": "no_articles", "date": today}

        # Build summary text
        summaries = []
        for a in articles:
            summaries.append(
                f"[{a.classification or '기타'}|{a.sentiment or '중립'}|{a.risk_score or 0}점] "
                f"{a.source}: {a.summary_ko or a.title}"
            )
        summary_text = "\n".join(summaries)

        scores = [a.risk_score for a in articles if a.risk_score is not None]
        avg_risk = int(sum(scores) / len(scores)) if scores else 0

        from collections import Counter
        cls_counter = Counter(a.classification for a in articles if a.classification)
        top_cls = [cls for cls, _ in cls_counter.most_common(3)]

        content = generate_daily_brief(summary_text, avg_risk, len(articles))

        brief = DailyBrief(
            brief_date=today,
            content=content,
            articles_analyzed=len(articles),
            avg_risk_score=avg_risk,
            top_classifications=top_cls,
        )
        db.add(brief)
        db.commit()

        logger.info(f"Daily brief generated for {today}")
        return {"status": "created", "date": today, "articles": len(articles)}
    except Exception as exc:
        db.rollback()
        logger.error(f"generate_daily_brief_task error: {exc}")
        raise
    finally:
        db.close()
