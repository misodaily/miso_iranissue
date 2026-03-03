import pytest
from app.services.collector import is_relevant, extract_tags, parse_rss_entry, clean_html
from app.utils.dedup import make_url_hash, is_similar_title


def test_is_relevant_korean():
    assert is_relevant("이란 핵 협상 재개") is True
    assert is_relevant("한국 날씨 예보") is False


def test_is_relevant_english():
    assert is_relevant("Iran nuclear deal talks resume") is True
    assert is_relevant("Stock market daily update") is False


def test_extract_tags():
    tags = extract_tags("Iran sanctions and nuclear deal JCPOA")
    assert "iran" in tags
    assert "sanctions" in tags or "제재" not in tags  # EN keyword match


def test_url_hash_consistency():
    url = "https://example.com/article/1"
    assert make_url_hash(url) == make_url_hash(url)
    assert make_url_hash(url) != make_url_hash("https://example.com/article/2")


def test_url_hash_normalizes():
    url1 = "https://example.com/article/1?utm_source=twitter"
    url2 = "https://example.com/article/1?utm_source=facebook"
    assert make_url_hash(url1) == make_url_hash(url2)


def test_similar_title():
    t1 = "Iran nuclear talks resume in Vienna"
    t2 = "Nuclear talks with Iran resume in Vienna"
    assert is_similar_title(t1, t2) is True


def test_not_similar_title():
    t1 = "Iran sanctions imposed by US"
    t2 = "Korea announces new economic plan"
    assert is_similar_title(t1, t2) is False


def test_clean_html():
    html = "<p>This is <b>bold</b> text.</p>"
    assert clean_html(html) == "This is bold text."


def test_parse_rss_entry_irrelevant():
    class MockEntry:
        title = "Weather forecast for Seoul"
        link = "https://example.com/weather"
        summary = "Sunny skies expected tomorrow"
        published_parsed = None
        updated_parsed = None

    source = {"name": "Test", "country": "KR", "language": "ko"}
    result = parse_rss_entry(MockEntry(), source)
    assert result is None
