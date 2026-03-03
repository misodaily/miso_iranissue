"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

export default function Header() {
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    const updateTime = () => setLastUpdate(new Date().toLocaleTimeString("ko-KR"));
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇺🇸🇮🇷</span>
            <div>
              <Link href="/" className="text-lg font-bold tracking-tight hover:text-blue-300 transition">
                미국-이란 이슈 브리핑
              </Link>
              <p className="text-xs text-gray-400">US-Iran Real-time Intelligence</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Activity size={12} className="text-green-400 animate-pulse" />
            <span className="hidden sm:inline">업데이트: {lastUpdate}</span>
            <span className="inline sm:hidden">{lastUpdate}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
