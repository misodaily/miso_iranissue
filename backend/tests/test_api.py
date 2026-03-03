import pytest
import pytest_asyncio
from datetime import datetime, timezone


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health/ready")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ready"


@pytest.mark.asyncio
async def test_list_articles_empty(client):
    resp = await client.get("/api/articles")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_article_stats(client):
    resp = await client.get("/api/articles/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_articles" in data
    assert "avg_risk_score" in data


@pytest.mark.asyncio
async def test_list_issues_empty(client):
    resp = await client.get("/api/issues")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_alerts_empty(client):
    resp = await client.get("/api/alerts")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_article_not_found(client):
    resp = await client.get("/api/articles/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_articles_filter(client, db_session):
    from app.models.article import Article
    from app.utils.dedup import make_url_hash

    article = Article(
        url_hash=make_url_hash("https://test.com/article1"),
        source="TestSource",
        title="Iran nuclear deal talks",
        url="https://test.com/article1",
        language="en",
        risk_score=75,
        classification="외교",
        is_relevant=True,
        analysis_attempted=True,
        published_at=datetime.now(timezone.utc),
    )
    db_session.add(article)
    await db_session.commit()

    resp = await client.get("/api/articles?q=nuclear")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp = await client.get("/api/articles?min_risk=80")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0

    resp = await client.get("/api/articles?classification=외교")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
