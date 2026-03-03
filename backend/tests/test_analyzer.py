import pytest
from unittest.mock import patch, MagicMock
import json

from app.services.analyzer import analyze_article, CLASSIFICATIONS, SENTIMENTS


def make_mock_openai_response(content: dict):
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(content)
    mock_resp = MagicMock()
    mock_resp.choices = [mock_choice]
    return mock_resp


@patch("app.services.analyzer.OpenAI")
def test_analyze_article_success(mock_openai_cls):
    mock_client = MagicMock()
    mock_openai_cls.return_value = mock_client
    mock_client.chat.completions.create.return_value = make_mock_openai_response({
        "summary_ko": "이란이 핵협상을 재개했다.",
        "classification": "외교",
        "sentiment": "완화",
        "risk_score": 45,
        "risk_factors": [
            {"reason": "협상 진전", "weight": 20},
            {"reason": "제재 완화 논의", "weight": 25},
        ],
        "keywords": ["핵협상", "이란", "외교"],
    })

    with patch("app.services.analyzer.settings") as mock_settings:
        mock_settings.openai_api_key = "test-key"
        mock_settings.openai_model = "gpt-4o-mini"
        result = analyze_article("Iran nuclear talks resume", "Details about the talks", "en")

    assert result is not None
    assert result["classification"] == "외교"
    assert result["sentiment"] == "완화"
    assert result["risk_score"] == 45
    assert len(result["risk_factors"]) == 2


@patch("app.services.analyzer.OpenAI")
def test_analyze_article_invalid_classification(mock_openai_cls):
    mock_client = MagicMock()
    mock_openai_cls.return_value = mock_client
    mock_client.chat.completions.create.return_value = make_mock_openai_response({
        "summary_ko": "테스트",
        "classification": "UNKNOWN_CLASS",
        "sentiment": "중립",
        "risk_score": 50,
        "risk_factors": [],
        "keywords": [],
    })

    with patch("app.services.analyzer.settings") as mock_settings:
        mock_settings.openai_api_key = "test-key"
        mock_settings.openai_model = "gpt-4o-mini"
        result = analyze_article("Test", "Test body", "en")

    assert result["classification"] == "기타"  # Falls back to default


@patch("app.services.analyzer.OpenAI")
def test_analyze_article_risk_clamp(mock_openai_cls):
    mock_client = MagicMock()
    mock_openai_cls.return_value = mock_client
    mock_client.chat.completions.create.return_value = make_mock_openai_response({
        "summary_ko": "테스트",
        "classification": "군사",
        "sentiment": "긴장고조",
        "risk_score": 999,  # Should be clamped to 100
        "risk_factors": [],
        "keywords": [],
    })

    with patch("app.services.analyzer.settings") as mock_settings:
        mock_settings.openai_api_key = "test-key"
        mock_settings.openai_model = "gpt-4o-mini"
        result = analyze_article("Test", "Test body", "en")

    assert result["risk_score"] == 100


def test_analyze_article_no_api_key():
    with patch("app.services.analyzer.settings") as mock_settings:
        mock_settings.openai_api_key = ""
        result = analyze_article("Test", "Test body", "en")
    assert result is None
