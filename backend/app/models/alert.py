from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=True)
    cluster_id = Column(Integer, ForeignKey("issue_clusters.id"), nullable=True)
    alert_type = Column(String(50), nullable=False)  # risk_spike / new_cluster / daily_brief
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    risk_score = Column(Integer, nullable=True)
    threshold = Column(Integer, nullable=True)
    extra_data = Column(JSON, default=dict)
    notified = Column(Boolean, default=False)
    notified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DailyBrief(Base):
    __tablename__ = "daily_briefs"

    id = Column(Integer, primary_key=True, index=True)
    brief_date = Column(String(10), nullable=False, unique=True)  # YYYY-MM-DD
    content = Column(Text, nullable=False)
    articles_analyzed = Column(Integer, default=0)
    avg_risk_score = Column(Integer, nullable=True)
    top_classifications = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
