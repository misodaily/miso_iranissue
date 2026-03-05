"use client";
import { useState, useEffect } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import type { TimelineEntry } from "@/types";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";

function formatHour(isoStr: string) {
  try {
    return formatInTimeZone(parseISO(isoStr), "Asia/Seoul", "MM/dd HH:mm");
  } catch {
    return isoStr;
  }
}

export default function TimelineChart() {
  const [data, setData] = useState<TimelineEntry[]>([]);
  const [hours, setHours] = useState(72);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.articles.timeline(hours)
      .then(raw => setData(raw.map(d => ({ ...d, hour: formatHour(d.hour) }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hours]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">기사량 & 리스크 타임라인</h2>
        <div className="flex gap-2">
          {[24, 72, 168].map(h => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${hours === h ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {h === 24 ? "24h" : h === 72 ? "3일" : "7일"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[320px] lg:h-[280px] bg-gray-50 rounded-lg animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-[320px] lg:h-[280px] flex items-center justify-center text-gray-400">
          <p>데이터가 없습니다 (기사 수집 후 표시됩니다)</p>
        </div>
      ) : (
        <div className="h-[320px] lg:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 16, left: -8, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} width={28} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: number, name: string) => {
                  if (name === "기사 수") return [value, name];
                  return [`${value.toFixed(1)}`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="article_count" name="기사 수" fill="#3b82f6" radius={[2, 2, 0, 0]} opacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="avg_risk" name="평균 리스크" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="max_risk" name="최대 리스크" stroke="#7c3aed" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
