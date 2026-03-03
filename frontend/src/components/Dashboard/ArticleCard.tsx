"use client";
import { ExternalLink, Clock, Globe } from "lucide-react";
import type { Article } from "@/types";
import { toKST, getRiskBgColor, getSentimentColor, getClassificationColor, getLanguageFlag } from "@/lib/utils";

interface Props {
  article: Article;
}

export default function ArticleCard({ article }: Props) {
  return (
    <div
      onClick={() => window.open(article.url, "_blank")}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition group cursor-pointer"
    >
      {/* Header badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500">{getLanguageFlag(article.language)} {article.source}</span>
        {article.classification && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getClassificationColor(article.classification)}`}>
            {article.classification}
          </span>
        )}
        {article.sentiment && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSentimentColor(article.sentiment)}`}>
            {article.sentiment}
          </span>
        )}
        {article.risk_score !== undefined && article.risk_score !== null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ml-auto ${getRiskBgColor(article.risk_score)}`}>
            리스크 {article.risk_score}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2 group-hover:text-blue-600 transition">
        {article.title}
      </h3>

      {/* AI Summary */}
      {article.summary_ko && (
        <div className="mb-2 max-h-[80px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
          <p className="text-xs text-gray-600 bg-blue-50 rounded px-2 py-1.5 border-l-2 border-blue-300">
            {article.summary_ko}
          </p>
        </div>
      )}

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {article.tags.slice(0, 5).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          <span>{toKST(article.published_at)}</span>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition"
          onClick={e => e.stopPropagation()}
        >
          <Globe size={11} /> 원문
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}
