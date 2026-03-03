"use client";
import { DashboardStats } from "@/types";
import { TrendingUp, FileText, AlertTriangle, BarChart2 } from "lucide-react";

interface Props {
  stats: DashboardStats | null;
}

export default function StatsBar({ stats }: Props) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2 w-20" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "전체 기사",
      value: stats.total_articles.toLocaleString(),
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "분석 완료",
      value: stats.analyzed_articles.toLocaleString(),
      icon: BarChart2,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "평균 리스크",
      value: `${stats.avg_risk_score.toFixed(1)}`,
      sub: "/ 100",
      icon: TrendingUp,
      color: stats.avg_risk_score >= 60 ? "text-red-600" : stats.avg_risk_score >= 40 ? "text-yellow-600" : "text-green-600",
      bg: stats.avg_risk_score >= 60 ? "bg-red-50" : stats.avg_risk_score >= 40 ? "bg-yellow-50" : "bg-green-50",
    },
    {
      label: "고위험 기사",
      value: stats.high_risk_count.toLocaleString(),
      sub: "(70점+)",
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{item.label}</span>
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <item.icon size={16} className={item.color} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
            {item.sub && <span className="text-sm text-gray-400">{item.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
