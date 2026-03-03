export interface Article {
  id: number;
  source: string;
  source_country?: string;
  title: string;
  url: string;
  language?: string;
  published_at?: string;
  collected_at?: string;
  tags: string[];
  classification?: string;
  sentiment?: string;
  risk_score?: number;
  cluster_id?: number;
  summary_ko?: string;
  // Detail fields
  body?: string;
  risk_factors?: RiskFactor[];
  country_mentions?: string[];
  analyzed_at?: string;
  analysis_error?: string;
}

export interface RiskFactor {
  reason: string;
  weight: number;
}

export interface ArticleListResponse {
  items: Article[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface IssueCluster {
  id: number;
  title: string;
  classification?: string;
  sentiment?: string;
  risk_score?: number;
  articles_count: number;
  key_sources: string[];
  keywords: string[];
  first_seen_at?: string;
  last_updated_at?: string;
  summary?: string;
}

export interface Alert {
  id: number;
  article_id?: number;
  cluster_id?: number;
  alert_type: string;
  title: string;
  message: string;
  risk_score?: number;
  threshold?: number;
  notified: boolean;
  created_at?: string;
}

export interface DashboardStats {
  total_articles: number;
  analyzed_articles: number;
  avg_risk_score: number;
  high_risk_count: number;
  classifications: { name: string; count: number }[];
  sentiments: { name: string; count: number }[];
}

export interface TimelineEntry {
  hour: string;
  article_count: number;
  avg_risk: number;
  max_risk: number;
}

export type Classification = "외교" | "군사" | "제재" | "에너지" | "시장" | "기타";
export type Sentiment = "긴장고조" | "완화" | "중립";

export type CommentSentiment = "긴장" | "우려" | "중립" | "낙관" | null;

export interface Comment {
  id: string;
  nickname: string;
  content: string;
  sentiment: CommentSentiment;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
  reported: boolean;
}
