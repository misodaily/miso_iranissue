"""
Alert notifier: Slack webhook + in-DB alert records.
"""
import logging
from typing import Optional, Dict
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def send_slack_notification(message: str, title: str = "🚨 Iran Dashboard Alert") -> bool:
    """Send notification to Slack webhook."""
    if not settings.slack_webhook_url:
        logger.debug("Slack webhook not configured, skipping")
        return False

    payload = {
        "text": f"*{title}*\n{message}",
        "username": "Iran Dashboard Bot",
        "icon_emoji": ":newspaper:",
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                settings.slack_webhook_url,
                json=payload,
                timeout=10.0,
            )
            if resp.status_code == 200:
                logger.info("Slack notification sent")
                return True
            else:
                logger.warning(f"Slack returned {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Slack notification error: {e}")
        return False


def format_risk_alert(article_title: str, risk_score: int, classification: str, source: str) -> str:
    """Format a risk alert message."""
    return (
        f"리스크 점수 {risk_score}/100이 임계값을 초과했습니다.\n"
        f"분류: {classification}\n"
        f"출처: {source}\n"
        f"제목: {article_title}"
    )
