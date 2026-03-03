from datetime import datetime, timezone
import pytz

KST = pytz.timezone("Asia/Seoul")
UTC = timezone.utc


def to_utc(dt: datetime) -> datetime:
    """Ensure a datetime is in UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def to_kst_str(dt: datetime) -> str:
    """Convert UTC datetime to KST string for display."""
    if dt is None:
        return ""
    utc_dt = to_utc(dt)
    kst_dt = utc_dt.astimezone(KST)
    return kst_dt.strftime("%Y-%m-%d %H:%M KST")


def now_utc() -> datetime:
    return datetime.now(UTC)
