"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, Clock } from "lucide-react";
import { api } from "@/lib/api";
import type { IssueCluster } from "@/types";
import { toKST, getRiskBgColor, getClassificationColor, getSentimentColor } from "@/lib/utils";

function IssueClusterCard({ cluster }: { cluster: IssueCluster }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-wrap gap-1.5">
          {cluster.classification && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getClassificationColor(cluster.classification)}`}>
              {cluster.classification}
            </span>
          )}
          {cluster.sentiment && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSentimentColor(cluster.sentiment)}`}>
              {cluster.sentiment}
            </span>
          )}
        </div>
        {cluster.risk_score !== null && cluster.risk_score !== undefined && (
          <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${getRiskBgColor(cluster.risk_score)}`}>
            {cluster.risk_score}
          </span>
        )}
      </div>

      <Link href={`/?tab=feed&cluster_id=${cluster.id}`}>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition mb-2">
          {cluster.title}
        </h3>
      </Link>

      {cluster.summary && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{cluster.summary}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {(cluster.keywords || []).slice(0, 5).map(kw => (
          <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{kw}</span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <Layers size={11} />
          <span>{cluster.articles_count}개 기사</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span>{toKST(cluster.last_updated_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function IssueCardList() {
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    api.issues.list({ limit: 30 })
      .then(setClusters)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? clusters.filter(c => c.classification === filter)
    : clusters;

  const classifications = [...new Set(clusters.map(c => c.classification).filter(Boolean))];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">필터:</span>
        <button
          onClick={() => setFilter("")}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${!filter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          전체
        </button>
        {classifications.map(cls => (
          <button
            key={cls}
            onClick={() => setFilter(filter === cls ? "" : cls!)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${filter === cls ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {cls}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Layers size={40} className="mx-auto mb-3 opacity-30" />
          <p>이슈 클러스터가 없습니다</p>
          <p className="text-sm mt-1">기사 분석이 완료되면 자동 생성됩니다</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(cluster => (
            <IssueClusterCard key={cluster.id} cluster={cluster} />
          ))}
        </div>
      )}
    </div>
  );
}
