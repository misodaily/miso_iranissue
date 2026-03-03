from sqlalchemy import Column, String, Text, Integer, Float, DateTime, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class IssueCluster(Base):
    __tablename__ = "issue_clusters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    summary = Column(Text, nullable=True)
    classification = Column(String(50), nullable=True)
    sentiment = Column(String(20), nullable=True)
    risk_score = Column(Integer, nullable=True)
    articles_count = Column(Integer, default=0)
    key_sources = Column(JSON, default=list)  # top source names
    keywords = Column(JSON, default=list)

    first_seen_at = Column(DateTime(timezone=True), nullable=True)
    last_updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    articles = relationship("Article", back_populates="cluster")

    __table_args__ = (
        Index("ix_clusters_risk_score", "risk_score"),
        Index("ix_clusters_classification", "classification"),
        Index("ix_clusters_last_updated", "last_updated_at"),
    )

    def __repr__(self):
        return f"<IssueCluster id={self.id} title={self.title[:40]}>"
