"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { ArticleFilters } from "@/lib/api";
import type { Article } from "@/types";
import ArticleCard from "./ArticleCard";
import FilterPanel from "./FilterPanel";

export default function ArticleFeed() {
  const [filters, setFilters] = useState<ArticleFilters>({});
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initial load when filters change
  useEffect(() => {
    let active = true;
    const fetchInitial = async () => {
      setIsInitialLoading(true);
      try {
        const result = await api.articles.list({ ...filters, page: 1, page_size: 20 });
        if (!active) return;
        setArticles(result.items);
        setTotal(result.total);
        setPage(1);
        setHasMore(1 < result.total_pages);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setIsInitialLoading(false);
      }
    };
    fetchInitial();
    return () => { active = false; };
  }, [filters]);

  // Polling every 10 seconds for new articles
  useEffect(() => {
    const interval = setInterval(async () => {
      setIsPolling(true);
      try {
        const result = await api.articles.list({ ...filters, page: 1, page_size: 20 });
        setArticles(prev => {
          // Find new articles (those with IDs not in prev)
          const newArticles = result.items.filter(item => !prev.some(p => p.id === item.id));
          if (newArticles.length > 0) {
            return [...newArticles, ...prev];
          }
          return prev;
        });
        setTotal(result.total); // Update total count slightly
      } catch (e) {
        console.error("Polling error", e);
      } finally {
        setIsPolling(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [filters]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || isInitialLoading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await api.articles.list({ ...filters, page: nextPage, page_size: 20 });
      setArticles(prev => {
        const newArticles = result.items.filter(item => !prev.some(p => p.id === item.id));
        return [...prev, ...newArticles];
      });
      setPage(nextPage);
      setHasMore(nextPage < result.total_pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [filters, page, loadingMore, hasMore, isInitialLoading]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-4">
      <FilterPanel filters={filters} onChange={setFilters} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          {isInitialLoading ? "로딩 중..." : `총 ${total.toLocaleString()}개 기사`}
          {isPolling && <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>}
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <RefreshCw size={12} className={isPolling ? "animate-spin text-blue-500" : ""} />
          10초 자동 업데이트
        </div>
      </div>

      {isInitialLoading && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
              <div className="h-3 bg-gray-200 rounded mb-2 w-1/3" />
              <div className="h-4 bg-gray-200 rounded mb-1" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!isInitialLoading && articles.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">📰</p>
          <p className="text-lg font-medium">검색 결과가 없습니다</p>
          <p className="text-sm mt-1">다른 키워드나 필터를 시도해보세요</p>
        </div>
      )}

      {!isInitialLoading && articles.length > 0 && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {articles.map(article => (
              <div key={article.id} className="animate-in fade-in slide-in-from-top-4 duration-500">
                <ArticleCard article={article} />
              </div>
            ))}
          </div>

          {/* Load More Sentinel */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                  <RefreshCw size={16} className="animate-spin text-blue-500" />
                  더 불러오는 중...
                </div>
              ) : (
                <div className="h-8" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
