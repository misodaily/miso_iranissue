from sqlalchemy import (
    Column, String, Text, Integer, Float, DateTime,
    Boolean, JSON, Index, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    url_hash = Column(String(64), unique=True, nullable=False, index=True)

    # Source metadata
    source = Column(String(100), nullable=False)
    source_country = Column(String(10), nullable=True)  # KR, US, UK, QA, etc.
    title = Column(String(500), nullable=False)
    url = Column(String(2000), nullable=False)
    language = Column(String(10), nullable=True)  # ko, en, ar, etc.

    # Content (may be null for restricted sources)
    body = Column(Text, nullable=True)
    summary_raw = Column(Text, nullable=True)  # First 500 chars for dedup

    # Timestamps (UTC)
    published_at = Column(DateTime(timezone=True), nullable=True)
    collected_at = Column(DateTime(timezone=True), server_default=func.now())
    analyzed_at = Column(DateTime(timezone=True), nullable=True)

    # Tags / Keywords
    tags = Column(JSON, default=list)  # ["제재", "핵협상", ...]
    country_mentions = Column(JSON, default=list)  # ["US", "IR", ...]

    # OpenAI Analysis
    summary_ko = Column(Text, nullable=True)       # 3-line Korean summary
    classification = Column(String(50), nullable=True)  # 외교/군사/제재/에너지/시장
    sentiment = Column(String(20), nullable=True)  # 긴장고조/완화/중립
    risk_score = Column(Integer, nullable=True)    # 0-100
    risk_factors = Column(JSON, default=list)      # [{"reason": "...", "weight": 30}]
    analysis_raw = Column(JSON, nullable=True)     # full OpenAI response

    # Clustering
    cluster_id = Column(Integer, ForeignKey("issue_clusters.id"), nullable=True)

    # Processing flags
    is_relevant = Column(Boolean, default=True)
    analysis_attempted = Column(Boolean, default=False)
    analysis_error = Column(String(500), nullable=True)

    # Relations
    cluster = relationship("IssueCluster", back_populates="articles")

    __table_args__ = (
        Index("ix_articles_published_at", "published_at"),
        Index("ix_articles_risk_score", "risk_score"),
        Index("ix_articles_classification", "classification"),
        Index("ix_articles_source", "source"),
        Index("ix_articles_cluster_id", "cluster_id"),
    )

    def __repr__(self):
        return f"<Article id={self.id} source={self.source} title={self.title[:40]}>"
