"use client";
import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { api } from "@/lib/api";

interface Brief {
  id: number;
  brief_date: string;
  content: string;
  articles_analyzed: number;
  avg_risk_score?: number;
  top_classifications: string[];
  created_at?: string;
}

export default function DailyBrief() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updateTimes, setUpdateTimes] = useState<{ last: string, next: string }>({ last: "", next: "" });

  useEffect(() => {
    const fetchBriefs = () => {
      (api.alerts.dailyBriefs(7) as Promise<Brief[]>)
        .then(setBriefs)
        .catch(console.error)
        .finally(() => {
          setLoading(false);
          const now = new Date();
          const next = new Date(now.getTime() + 14400000);
          setUpdateTimes({
            last: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            next: next.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          });
        });
    };

    fetchBriefs();
    // 4 hours in milliseconds = 4 * 60 * 60 * 1000 = 14400000
    const interval = setInterval(fetchBriefs, 14400000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;
  }

  if (briefs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center py-12 px-6 min-h-[120px]">
        <BookOpen size={48} className="text-gray-200" />
      </div>
    );
  }

  const brief = briefs[selected];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Date tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100">
        {briefs.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setSelected(i)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition border-b-2 ${i === selected
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {b.brief_date}
          </button>
        ))}
      </div>

      {/* Brief meta */}
      <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center gap-4">
        <div className="flex items-center gap-1.5 flex-1">
          <BookOpen size={14} className="text-blue-600" />
          <span className="text-xs text-blue-700 font-medium whitespace-nowrap">분석 기사 {brief.articles_analyzed}개</span>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
          {updateTimes.last && (
            <span className="text-gray-500 bg-white/50 px-2 py-1 rounded">최종 동기화: {updateTimes.last}</span>
          )}
          {updateTimes.next && (
            <span className="text-blue-600 font-medium bg-blue-100/50 px-2 py-1 rounded animate-pulse">다음 업데이트: {updateTimes.next}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
          {brief.content.replace(/^###\s(.*)$/gm, '🔹 $1').replace(/^##\s(.*)$/gm, '📌 $1')}
        </pre>
      </div>
    </div>
  );
}
