from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    article_id: Optional[int] = None
    cluster_id: Optional[int] = None
    alert_type: str
    title: str
    message: str
    risk_score: Optional[int] = None
    threshold: Optional[int] = None
    notified: bool = False
    created_at: Optional[datetime] = None


class DailyBriefOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    brief_date: str
    content: str
    articles_analyzed: int = 0
    avg_risk_score: Optional[int] = None
    top_classifications: list = []
    created_at: Optional[datetime] = None
