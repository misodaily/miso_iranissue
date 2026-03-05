"use client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  lastUpdate: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  { id: "timeline", icon: "📊", label: "주요 타임라인" },
  { id: "feed", icon: "📰", label: "뉴스 피드" },
];

export default function Sidebar({
  activeItem,
  onItemClick,
  isCollapsed,
  setIsCollapsed,
  lastUpdate,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out p-4 flex-shrink-0 bg-gray-200",
        "lg:static lg:z-auto lg:h-screen lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-24" : "w-72 lg:w-64"
      )}
    >
      <div className="h-full rounded-3xl p-5 flex flex-col bg-gray-200 shadow-[15px_15px_30px_#bebebe,-15px_-15px_30px_#ffffff]">

        {/* Header */}
        <div className={cn("flex mb-8", isCollapsed ? "flex-col items-center gap-2" : "items-center justify-between")}>
          {!isCollapsed && (
            <div className="px-3 py-2 rounded-xl flex-1 mr-2 bg-gray-200 shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]">
              <p className="text-lg font-bold leading-tight">🇺🇸🇮🇷</p>
              <p className="text-xs font-medium text-gray-600">이슈 브리핑</p>
            </div>
          )}

          <div className={cn("flex gap-2", isCollapsed && "flex-col")}>
            <button
              onClick={onMobileClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 lg:hidden bg-gray-200 text-gray-600 shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]"
            >
              <X size={16} />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 rounded-full hidden lg:flex items-center justify-center transition-all duration-200 text-sm font-bold bg-gray-200 text-gray-600 shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]"
            >
              {isCollapsed ? "▶" : "◀"}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 font-medium bg-gray-200",
                activeItem === item.id
                  ? "shadow-[inset_8px_8px_16px_#bebebe,inset_-8px_-8px_16px_#ffffff] text-blue-600"
                  : "text-gray-600 shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] hover:text-blue-500",
                isCollapsed && "justify-center"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom: monitoring status */}
        <div className="mt-8 pt-6 border-t border-gray-300">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-gray-200 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]",
            isCollapsed && "justify-center"
          )}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-gray-200 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
              🛡️
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-700">실시간 모니터링</p>
                <p className="text-xs truncate text-gray-500">{lastUpdate}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg bg-gray-200 shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]",
            isCollapsed && "justify-center"
          )}>
            <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm animate-pulse flex-shrink-0" />
            {!isCollapsed && <span className="text-xs text-gray-500">Online</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
