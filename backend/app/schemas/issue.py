from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class IssueClusterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    classification: Optional[str] = None
    sentiment: Optional[str] = None
    risk_score: Optional[int] = None
    articles_count: int = 0
    key_sources: List[str] = []
    keywords: List[str] = []
    first_seen_at: Optional[datetime] = None
    last_updated_at: Optional[datetime] = None


class IssueClusterDetail(IssueClusterOut):
    summary: Optional[str] = None
