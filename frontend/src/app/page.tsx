"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/common/Header";
import ArticleFeed from "@/components/Dashboard/ArticleFeed";
import TimelineChart from "@/components/Dashboard/TimelineChart";
import EventTimeline from "@/components/Dashboard/EventTimeline";
import DailyBrief from "@/components/Dashboard/DailyBrief";
import CommentPanel from "@/components/Dashboard/CommentPanel";

type Tab = "timeline" | "feed";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "timeline", label: "주요 타임라인", emoji: "📊" },
  { id: "feed", label: "실시간 뉴스 피드", emoji: "📰" },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "timeline"
  );
  useEffect(() => {
    // keeping empty or basic health check if needed, but we don't need stats anymore.
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">

      {/* Risk index explanation */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-lg py-2 px-4 shadow-sm flex items-center gap-2">
        <span className="text-xl">💡</span>
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-blue-800">리스크 지수(Risk Score) 안내:</span> OpenAI 분석 기반으로 외교 단절, 군사 충돌, 경제 제재 등 각 위험 요소의 가중치를 종합 계산하여 산출된 0~100점 척도의 지표입니다.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center justify-center gap-2 px-6 py-3 md:px-4 md:py-2 w-full md:w-auto rounded-lg text-sm md:text-base font-semibold transition whitespace-nowrap ${activeTab === tab.id
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50"
              }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "timeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <TimelineChart />
            <EventTimeline />
          </div>
          <div className="contents lg:flex lg:flex-col lg:order-2 space-y-0 lg:space-y-6">
            <div className="order-1 lg:order-none w-full">
              <DailyBrief />
            </div>
            <div className="order-3 lg:order-none w-full flex-1">
              <CommentPanel />
            </div>
          </div>
        </div>
      )}
      {activeTab === "feed" && <ArticleFeed />}
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      <Header />
      <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
