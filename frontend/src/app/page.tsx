"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/common/Sidebar";
import ArticleFeed from "@/components/Dashboard/ArticleFeed";
import TimelineChart from "@/components/Dashboard/TimelineChart";
import EventTimeline from "@/components/Dashboard/EventTimeline";
import DailyBrief from "@/components/Dashboard/DailyBrief";
import CommentPanel from "@/components/Dashboard/CommentPanel";
import { Menu } from "lucide-react";

type Tab = "timeline" | "feed";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    const update = () => setLastUpdate(new Date().toLocaleTimeString("ko-KR"));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden bg-gray-200">
      {/* Mobile backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <Sidebar
        activeItem={activeTab}
        onItemClick={(id) => {
          setActiveTab(id as Tab);
          setIsMobileNavOpen(false);
        }}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        lastUpdate={lastUpdate}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 lg:overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 shadow-sm bg-gray-200">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 rounded-xl transition-all duration-200 flex-shrink-0 bg-gray-200 text-gray-600 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]"
          >
            <Menu size={20} />
          </button>
          <p className="text-sm font-bold text-gray-800">🇺🇸🇮🇷 이슈 브리핑</p>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="min-h-full rounded-2xl lg:rounded-3xl p-4 lg:p-8 flex flex-col bg-gray-200 shadow-[inset_10px_10px_20px_#bebebe,inset_-10px_-10px_20px_#ffffff]">

            {/* Risk index banner */}
            <div className="rounded-lg py-2 px-4 flex items-center gap-2 mb-4 lg:mb-6 shrink-0 bg-blue-50/50 border border-blue-100 shadow-sm">
              <span className="text-lg">💡</span>
              <p className="text-xs lg:text-sm text-gray-700">
                <span className="font-semibold text-blue-800">리스크 지수(Risk Score) 안내:</span>{" "}
                OpenAI 분석 기반으로 외교 단절, 군사 충돌, 경제 제재 등 각 위험 요소의 가중치를 종합 계산하여 산출된 0~100점 척도의 지표입니다.
              </p>
            </div>

            {/* Tab content */}
            {activeTab === "timeline" && (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-0">
                {/* Left column */}
                <div className="lg:col-span-2 order-2 lg:order-1 flex flex-col gap-4 lg:gap-6 min-h-0">
                  <div className="shrink-0">
                    <TimelineChart />
                  </div>
                  <div className="flex-1 min-h-0">
                    <EventTimeline />
                  </div>
                </div>

                {/* Right column */}
                <div className="contents lg:flex lg:flex-col lg:order-2 lg:gap-6 lg:min-h-0">
                  <div className="order-1 lg:order-none lg:shrink-0">
                    <DailyBrief />
                  </div>
                  <div className="order-3 lg:order-none lg:flex-1 lg:min-h-0">
                    <CommentPanel />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "feed" && <ArticleFeed />}
          </div>
        </div>
      </div>
    </div>
  );
}
