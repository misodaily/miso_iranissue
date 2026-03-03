from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime


class ArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    source_country: Optional[str] = None
    title: str
    url: str
    language: Optional[str] = None
    published_at: Optional[datetime] = None
    collected_at: Optional[datetime] = None
    tags: List[str] = []
    classification: Optional[str] = None
    sentiment: Optional[str] = None
    risk_score: Optional[int] = None
    cluster_id: Optional[int] = None
    summary_ko: Optional[str] = None


class ArticleDetail(ArticleOut):
    body: Optional[str] = None
    summary_raw: Optional[str] = None
    risk_factors: List[Any] = []
    country_mentions: List[str] = []
    analyzed_at: Optional[datetime] = None
    analysis_error: Optional[str] = None


class ArticleListResponse(BaseModel):
    items: List[ArticleOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class ArticleFilter(BaseModel):
    q: Optional[str] = None
    source: Optional[str] = None
    language: Optional[str] = None
    classification: Optional[str] = None
    sentiment: Optional[str] = None
    min_risk: Optional[int] = None
    max_risk: Optional[int] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    cluster_id: Optional[int] = None
    page: int = 1
    page_size: int = 20
