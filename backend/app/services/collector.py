"""
News collector: RSS feeds + NewsAPI
Respects robots.txt & ToS: only fetches metadata + excerpts from RSS
Full body only stored when freely available in feed
"""
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional
import httpx
import feedparser
from bs4 import BeautifulSoup

from app.config import get_settings
from app.utils.dedup import make_url_hash
from app.utils.timezone import to_utc

logger = logging.getLogger(__name__)
settings = get_settings()

# ── RSS Sources ────────────────────────────────────────────────
# Only sources that allow RSS syndication per their ToS
RSS_SOURCES = [
    {
        "name": "Reuters World",
        "url": "https://feeds.reuters.com/reuters/worldnews",
        "country": "US",
        "language": "en",
    },
    {
        "name": "BBC Middle East",
        "url": "http://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
        "country": "UK",
        "language": "en",
    },
    {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "country": "QA",
        "language": "en",
    },
    {
        "name": "AP News",
        "url": "https://rsshub.app/apnews/topics/apf-intlnews",
        "country": "US",
        "language": "en",
    },
    {
        "name": "Yonhap News",
        "url": "https://www.yonhapnewstv.co.kr/category/news/international/feed/",
        "country": "KR",
        "language": "ko",
    },
    {
        "name": "Yonhap RSS",
        "url": "https://www.yna.co.kr/rss/all.xml",
        "country": "KR",
        "language": "ko",
    },
    {
        "name": "VOA Persian",
        "url": "https://www.voanews.com/api/zk$opee_e/",
        "country": "US",
        "language": "fa",
    },
    {
        "name": "Guardian World",
        "url": "https://www.theguardian.com/world/rss",
        "country": "UK",
        "language": "en",
    },
    {
        "name": "Haaretz",
        "url": "https://www.haaretz.com/srv/haaretz-lat-en.xml",
        "country": "IL",
        "language": "en",
    },
]

# ── Korean keywords ──────────────────────────────────────────────
KO_KEYWORDS = [
    "이란", "미국", "제재", "호르무즈", "핵협상", "군사", "충돌",
    "트럼프", "테헤란", "걸프", "원유", "석유", "혁명수비대", "JCPOA",
]

# ── English keywords ─────────────────────────────────────────────
EN_KEYWORDS = [
    "iran", "usa", "us-iran", "sanctions", "hormuz", "nuclear deal",
    "jcpoa", "irgc", "tehran", "persian gulf", "us military",
    "islamic republic", "enrichment", "uranium",
]

ALL_KEYWORDS = KO_KEYWORDS + EN_KEYWORDS


def is_relevant(title: str, body: str = "") -> bool:
    """Check if article is relevant to US-Iran topic."""
    text = (title + " " + (body or "")).lower()
    return any(kw.lower() in text for kw in ALL_KEYWORDS)


def extract_tags(title: str, body: str = "") -> List[str]:
    """Extract matching keywords as tags."""
    text = (title + " " + (body or "")).lower()
    return [kw for kw in ALL_KEYWORDS if kw.lower() in text]


def clean_html(html: str) -> str:
    """Strip HTML tags from text."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "lxml")
    return soup.get_text(separator=" ", strip=True)[:2000]


def parse_rss_entry(entry: Dict, source_meta: Dict) -> Optional[Dict]:
    """Parse a feedparser entry into normalized article dict."""
    title = getattr(entry, "title", "").strip()
    url = getattr(entry, "link", "").strip()
    if not title or not url:
        return None

    # Extract body from summary or content
    body = ""
    if hasattr(entry, "content"):
        body = clean_html(entry.content[0].value if entry.content else "")
    elif hasattr(entry, "summary"):
        body = clean_html(entry.summary)

    if not is_relevant(title, body):
        return None

    # Parse published time
    published_at = None
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            published_at = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        except Exception:
            pass
    if published_at is None and hasattr(entry, "updated_parsed") and entry.updated_parsed:
        try:
            published_at = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
        except Exception:
            pass

    tags = extract_tags(title, body)

    return {
        "url_hash": make_url_hash(url),
        "source": source_meta["name"],
        "source_country": source_meta.get("country"),
        "title": title[:500],
        "url": url[:2000],
        "language": source_meta.get("language", "en"),
        "body": body or None,
        "summary_raw": (title + " " + body)[:500],
        "published_at": published_at,
        "tags": tags,
        "country_mentions": [],
        "is_relevant": True,
        "analysis_attempted": False,
    }


async def fetch_rss_source(source: Dict, client: httpx.AsyncClient) -> List[Dict]:
    """Fetch and parse a single RSS feed."""
    articles = []
    try:
        response = await client.get(
            source["url"],
            timeout=15.0,
            follow_redirects=True,
            headers={"User-Agent": "IranDashboard/1.0 (RSS reader; educational)"},
        )
        if response.status_code != 200:
            logger.warning(f"RSS {source['name']} returned {response.status_code}")
            return []

        feed = feedparser.parse(response.text)
        entries = feed.entries[: settings.max_articles_per_source]

        for entry in entries:
            parsed = parse_rss_entry(entry, source)
            if parsed:
                articles.append(parsed)

        logger.info(f"RSS {source['name']}: fetched {len(articles)} relevant articles")
    except Exception as e:
        logger.error(f"RSS fetch error [{source['name']}]: {e}")
    return articles


async def fetch_newsapi(client: httpx.AsyncClient) -> List[Dict]:
    """Fetch from NewsAPI.org (requires API key)."""
    if not settings.news_api_key:
        return []

    articles = []
    queries = ["iran sanctions", "iran nuclear", "iran us military", "iran hormuz"]
    seen_urls = set()

    for query in queries:
        try:
            resp = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": query,
                    "sortBy": "publishedAt",
                    "language": "en",
                    "pageSize": 20,
                    "apiKey": settings.news_api_key,
                },
                timeout=15.0,
            )
            data = resp.json()
            for item in data.get("articles", []):
                url = item.get("url", "")
                if url in seen_urls:
                    continue
                seen_urls.add(url)
                title = item.get("title", "")
                description = item.get("description", "") or ""
                body = description[:2000]

                if not is_relevant(title, body):
                    continue

                published_at = None
                if item.get("publishedAt"):
                    try:
                        published_at = datetime.fromisoformat(
                            item["publishedAt"].replace("Z", "+00:00")
                        )
                    except Exception:
                        pass

                source_name = item.get("source", {}).get("name", "NewsAPI")
                articles.append({
                    "url_hash": make_url_hash(url),
                    "source": source_name,
                    "source_country": "US",
                    "title": title[:500],
                    "url": url[:2000],
                    "language": "en",
                    "body": body or None,
                    "summary_raw": (title + " " + body)[:500],
                    "published_at": published_at,
                    "tags": extract_tags(title, body),
                    "country_mentions": [],
                    "is_relevant": True,
                    "analysis_attempted": False,
                })
        except Exception as e:
            logger.error(f"NewsAPI error [{query}]: {e}")

    logger.info(f"NewsAPI: fetched {len(articles)} relevant articles")
    return articles


async def collect_all() -> List[Dict]:
    """Main entry: collect from all sources."""
    all_articles = []
    seen_hashes = set()

    async with httpx.AsyncClient() as client:
        # RSS sources
        for source in RSS_SOURCES:
            items = await fetch_rss_source(source, client)
            for item in items:
                if item["url_hash"] not in seen_hashes:
                    seen_hashes.add(item["url_hash"])
                    all_articles.append(item)

        # NewsAPI (optional)
        newsapi_items = await fetch_newsapi(client)
        for item in newsapi_items:
            if item["url_hash"] not in seen_hashes:
                seen_hashes.add(item["url_hash"])
                all_articles.append(item)

    logger.info(f"Total collected: {len(all_articles)} unique relevant articles")
    return all_articles
