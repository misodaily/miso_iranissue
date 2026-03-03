import hashlib
from rapidfuzz import fuzz


def make_url_hash(url: str) -> str:
    """Create a stable hash from a URL (normalized)."""
    normalized = url.strip().lower().split("?")[0].rstrip("/")
    return hashlib.sha256(normalized.encode()).hexdigest()[:64]


def is_similar_title(title1: str, title2: str, threshold: int = 85) -> bool:
    """Check if two titles are similar enough to be considered duplicates."""
    return fuzz.token_sort_ratio(title1.lower(), title2.lower()) >= threshold


def make_content_hash(title: str, published_at: str = "") -> str:
    """Create a hash from title + date for near-duplicate detection."""
    combined = f"{title.strip().lower()}_{published_at}"
    return hashlib.md5(combined.encode()).hexdigest()
