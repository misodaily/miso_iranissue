"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DashboardStats } from "@/types";

const SENTIMENT_COLORS: Record<string, string> = {
  "긴장고조": "#ef4444",
  "완화": "#22c55e",
  "중립": "#94a3b8",
};

const CLASS_COLORS: Record<string, string> = {
  외교: "#3b82f6",
  군사: "#ef4444",
  제재: "#f97316",
  에너지: "#eab308",
  시장: "#14b8a6",
  기타: "#94a3b8",
};

interface Props {
  stats: DashboardStats | null;
}

function RiskMeter({ score }: { score: number }) {
  const color = score >= 80 ? "#7c3aed" : score >= 60 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#22c55e";
  const label = score >= 80 ? "매우 위험" : score >= 60 ? "위험" : score >= 40 ? "주의" : "안전";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <div
          className="absolute w-32 h-32 rounded-full border-8 border-gray-100"
          style={{ top: 0, left: 0 }}
        />
        <div
          className="absolute w-32 h-32 rounded-full border-8"
          style={{
            top: 0, left: 0,
            borderColor: `${color} ${color} transparent transparent`,
            transform: `rotate(${45}deg)`,
          }}
        />
      </div>
      <div className="text-center -mt-2">
        <div className="text-3xl font-bold" style={{ color }}>{score}</div>
        <div className="text-sm font-medium text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function RiskGauge({ stats }: Props) {
  if (!stats) return null;

  const classData = stats.classifications.map(c => ({
    name: c.name,
    value: c.count,
  }));

  const sentimentData = stats.sentiments.map(s => ({
    name: s.name,
    value: s.count,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h2 className="text-base font-semibold text-gray-900 mb-4">리스크 개요</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Risk Meter */}
        <div className="flex flex-col items-center py-2">
          <p className="text-xs text-gray-500 mb-3">평균 리스크 점수</p>
          <RiskMeter score={Math.round(stats.avg_risk_score)} />
        </div>

        {/* Classification Pie */}
        {classData.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1 text-center">이슈 분류</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={classData} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                  {classData.map(entry => (
                    <Cell key={entry.name} fill={CLASS_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sentiment Pie */}
        {sentimentData.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1 text-center">감성/톤</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={sentimentData} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                  {sentimentData.map(entry => (
                    <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
