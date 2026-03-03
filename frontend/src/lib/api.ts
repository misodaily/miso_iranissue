import type {
  Article,
  ArticleListResponse,
  IssueCluster,
  Alert,
  DashboardStats,
  TimelineEntry,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json();
}

export interface ArticleFilters {
  q?: string;
  source?: string;
  language?: string;
  classification?: string;
  sentiment?: string;
  min_risk?: number;
  max_risk?: number;
  from_date?: string;
  to_date?: string;
  cluster_id?: number;
  page?: number;
  page_size?: number;
}

export const api = {
  articles: {
    list: (filters: ArticleFilters = {}) =>
      fetchJSON<ArticleListResponse>("/api/articles", filters as Record<string, string | number | boolean | undefined>),
    get: (id: number) => fetchJSON<Article>(`/api/articles/${id}`),
    stats: () => fetchJSON<DashboardStats>("/api/articles/stats"),
    timeline: (hours = 72) => fetchJSON<TimelineEntry[]>("/api/articles/timeline", { hours }),
    sources: () => fetchJSON<{ source: string; country: string; count: number }[]>("/api/articles/sources"),
  },
  issues: {
    list: (params?: { classification?: string; min_risk?: number; limit?: number }) =>
      fetchJSON<IssueCluster[]>("/api/issues", params as Record<string, string | number | boolean | undefined>),
    get: (id: number) => fetchJSON<IssueCluster>(`/api/issues/${id}`),
    articles: (id: number) => fetchJSON<Article[]>(`/api/issues/${id}/articles`),
  },
  alerts: {
    list: (params?: { unread_only?: boolean; limit?: number }) =>
      fetchJSON<Alert[]>("/api/alerts", params as Record<string, string | number | boolean | undefined>),
    count: () => fetchJSON<{ total: number; unread: number }>("/api/alerts/count"),
    markRead: (id: number) =>
      fetch(`${BASE_URL}/api/alerts/${id}/read`, { method: "POST" }).then(r => r.json()),
    dailyBriefs: (limit = 7) =>
      fetchJSON("/api/alerts/daily-briefs", { limit }),
  },
  health: () => fetchJSON("/health"),
};
