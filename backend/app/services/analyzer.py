"""
OpenAI analysis pipeline for articles.
Generates: Korean summary, classification, sentiment, risk score + factors.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Optional

from openai import OpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

CLASSIFICATIONS = ["외교", "군사", "제재", "에너지", "시장", "기타"]
SENTIMENTS = ["긴장고조", "완화", "중립"]

ANALYSIS_SYSTEM_PROMPT = """당신은 중동 정세 전문 분석가입니다.
주어진 뉴스 기사를 분석하여 다음 JSON 형식으로 응답하세요.
반드시 유효한 JSON만 반환하세요.

{
  "summary_ko": "기사의 핵심 내용을 3줄 이내로 요약 (한국어)",
  "classification": "외교|군사|제재|에너지|시장|기타 중 하나",
  "sentiment": "긴장고조|완화|중립 중 하나",
  "risk_score": 0~100 사이의 정수 (0=위험없음, 100=최고위험),
  "risk_factors": [
    {"reason": "리스크 근거 1", "weight": 0~50 사이 정수},
    {"reason": "리스크 근거 2", "weight": 0~50 사이 정수}
  ],
  "keywords": ["핵심 키워드1", "키워드2", "키워드3"]
}

분류 기준:
- 외교: 협상, 외교 관계, 성명, 유엔
- 군사: 군사 행동, 공격, 무기, 배치
- 제재: 경제 제재, 금융 제한, 수출입 통제
- 에너지: 석유, 가스, 호르무즈 해협
- 시장: 유가, 금융 시장, 경제 영향

리스크 점수 기준:
- 80-100: 즉각적 군사 충돌 위험
- 60-79: 긴장 심화, 충돌 가능성 있음
- 40-59: 외교적 긴장, 협상 교착
- 20-39: 일반적 긴장 상태
- 0-19: 완화, 협상 진전"""


def analyze_article(title: str, body: str, language: str = "en") -> Optional[Dict]:
    """
    Send article to OpenAI for analysis.
    Returns structured analysis dict or None on failure.
    """
    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not set, skipping analysis")
        return None

    client = OpenAI(api_key=settings.openai_api_key)

    # Truncate body to avoid token limits
    content_body = (body or "")[:3000]
    user_content = f"""제목: {title}

본문:
{content_body}

언어: {language}"""

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=600,
        )
        raw = response.choices[0].message.content
        result = json.loads(raw)

        # Validate and sanitize
        classification = result.get("classification", "기타")
        if classification not in CLASSIFICATIONS:
            classification = "기타"

        sentiment = result.get("sentiment", "중립")
        if sentiment not in SENTIMENTS:
            sentiment = "중립"

        risk_score = int(result.get("risk_score", 0))
        risk_score = max(0, min(100, risk_score))

        risk_factors = result.get("risk_factors", [])
        if not isinstance(risk_factors, list):
            risk_factors = []
        # Ensure max 2 factors
        risk_factors = risk_factors[:2]

        return {
            "summary_ko": result.get("summary_ko", ""),
            "classification": classification,
            "sentiment": sentiment,
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "keywords": result.get("keywords", []),
            "analysis_raw": result,
        }
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in OpenAI response: {e}")
        return None
    except Exception as e:
        logger.error(f"OpenAI analysis error: {e}")
        return None


DAILY_BRIEF_SYSTEM_PROMPT = """당신은 미국-이란 관계 전문 정보 분석가입니다.
오늘의 주요 기사들을 바탕으로 일일 브리핑을 한국어로 작성하세요.

형식:
## 오늘의 미국-이란 정세 브리핑

### 핵심 요약 (3줄)
...

### 주요 이슈별 동향
1. [이슈명]: ...
2. [이슈명]: ...

### 리스크 평가
- 종합 리스크: X/100
- 주요 위험 요소: ...

### 내일 주목 포인트
- ...

간결하고 객관적으로 작성하세요."""


def generate_daily_brief(articles_summary: str, avg_risk: int, article_count: int) -> str:
    """Generate daily briefing from article summaries."""
    if not settings.openai_api_key:
        return "OpenAI API 키가 설정되지 않아 브리핑을 생성할 수 없습니다."

    client = OpenAI(api_key=settings.openai_api_key)

    user_content = f"""오늘 수집된 기사 수: {article_count}
평균 리스크 점수: {avg_risk}/100

주요 기사 요약:
{articles_summary[:4000]}"""

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": DAILY_BRIEF_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Daily brief generation error: {e}")
        return f"브리핑 생성 실패: {e}"
