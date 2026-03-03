"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "issue_clusters",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("classification", sa.String(50), nullable=True),
        sa.Column("sentiment", sa.String(20), nullable=True),
        sa.Column("risk_score", sa.Integer(), nullable=True),
        sa.Column("articles_count", sa.Integer(), default=0),
        sa.Column("key_sources", sa.JSON(), default=list),
        sa.Column("keywords", sa.JSON(), default=list),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_clusters_risk_score", "issue_clusters", ["risk_score"])
    op.create_index("ix_clusters_classification", "issue_clusters", ["classification"])
    op.create_index("ix_clusters_last_updated", "issue_clusters", ["last_updated_at"])

    op.create_table(
        "articles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("url_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("source_country", sa.String(10), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("url", sa.String(2000), nullable=False),
        sa.Column("language", sa.String(10), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("summary_raw", sa.Text(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("collected_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tags", sa.JSON(), default=list),
        sa.Column("country_mentions", sa.JSON(), default=list),
        sa.Column("summary_ko", sa.Text(), nullable=True),
        sa.Column("classification", sa.String(50), nullable=True),
        sa.Column("sentiment", sa.String(20), nullable=True),
        sa.Column("risk_score", sa.Integer(), nullable=True),
        sa.Column("risk_factors", sa.JSON(), default=list),
        sa.Column("analysis_raw", sa.JSON(), nullable=True),
        sa.Column("cluster_id", sa.Integer(), sa.ForeignKey("issue_clusters.id"), nullable=True),
        sa.Column("is_relevant", sa.Boolean(), default=True),
        sa.Column("analysis_attempted", sa.Boolean(), default=False),
        sa.Column("analysis_error", sa.String(500), nullable=True),
    )
    op.create_index("ix_articles_url_hash", "articles", ["url_hash"], unique=True)
    op.create_index("ix_articles_published_at", "articles", ["published_at"])
    op.create_index("ix_articles_risk_score", "articles", ["risk_score"])
    op.create_index("ix_articles_classification", "articles", ["classification"])
    op.create_index("ix_articles_source", "articles", ["source"])
    op.create_index("ix_articles_cluster_id", "articles", ["cluster_id"])

    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("article_id", sa.Integer(), sa.ForeignKey("articles.id"), nullable=True),
        sa.Column("cluster_id", sa.Integer(), sa.ForeignKey("issue_clusters.id"), nullable=True),
        sa.Column("alert_type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=True),
        sa.Column("threshold", sa.Integer(), nullable=True),
        sa.Column("extra_data", sa.JSON(), default=dict),
        sa.Column("notified", sa.Boolean(), default=False),
        sa.Column("notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "daily_briefs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("brief_date", sa.String(10), nullable=False, unique=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("articles_analyzed", sa.Integer(), default=0),
        sa.Column("avg_risk_score", sa.Integer(), nullable=True),
        sa.Column("top_classifications", sa.JSON(), default=list),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("daily_briefs")
    op.drop_table("alerts")
    op.drop_table("articles")
    op.drop_table("issue_clusters")
