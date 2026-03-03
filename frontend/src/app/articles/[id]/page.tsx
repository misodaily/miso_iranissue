import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Shield, Calendar, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { toKST, getRiskBgColor, getClassificationColor, getSentimentColor, getLanguageFlag } from "@/lib/utils";
import type { Article } from "@/types";

async function ArticleDetailContent({ id }: { id: number }) {
  let article: Article;
  try {
    article = await api.articles.get(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition mb-6">
        <ArrowLeft size={16} />
        대시보드로 돌아가기
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="flex items-center gap-1 text-sm text-gray-500">
            {getLanguageFlag(article.language)} {article.source}
          </span>
          {article.classification && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getClassificationColor(article.classification)}`}>
              {article.classification}
            </span>
          )}
          {article.sentiment && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getSentimentColor(article.sentiment)}`}>
              {article.sentiment}
            </span>
          )}
          {article.risk_score !== null && article.risk_score !== undefined && (
            <span className={`text-sm font-bold px-3 py-1 rounded-full ml-auto ${getRiskBgColor(article.risk_score)}`}>
              <Shield size={12} className="inline mr-1" />
              리스크 {article.risk_score}/100
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>게재: {toKST(article.published_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe size={14} />
            <span>수집: {toKST(article.collected_at)}</span>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      {article.summary_ko && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 mb-4">
          <h2 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1.5">
            <span>🤖</span> AI 분석 요약
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {article.summary_ko}
          </p>
        </div>
      )}

      {/* Risk Factors */}
      {article.risk_factors && article.risk_factors.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
            <Shield size={14} className="text-red-500" />
            리스크 근거
          </h2>
          <div className="space-y-2">
            {article.risk_factors.map((factor, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">{factor.weight}</span>
                </div>
                <p className="text-sm text-gray-700 pt-1.5">{factor.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-600 mb-2">태그</h2>
          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      {article.body && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3">기사 본문</h2>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <p className="whitespace-pre-line">{article.body}</p>
          </div>
        </div>
      )}

      {/* Source link */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition"
      >
        <Globe size={16} />
        원문 보기
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) notFound();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gray-900 text-white px-4 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold hover:text-blue-300 transition">
            🇺🇸🇮🇷 미국-이란 이슈 대시보드
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-300 text-sm">기사 상세</span>
        </div>
      </div>
      <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
        <ArticleDetailContent id={id} />
      </Suspense>
    </div>
  );
}
