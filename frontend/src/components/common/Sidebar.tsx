"use client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
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
  isDarkMode,
  setIsDarkMode,
  isCollapsed,
  setIsCollapsed,
  lastUpdate,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const bg = isDarkMode ? "bg-gray-800" : "bg-gray-200";
  const shadowOut = isDarkMode
    ? "shadow-[6px_6px_12px_#1a1a1a,-6px_-6px_12px_#404040]"
    : "shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]";

  return (
    <div
      className={cn(
        // Mobile: fixed overlay with slide animation
        "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out p-4 flex-shrink-0",
        // Desktop: static, part of flex layout
        "lg:static lg:z-auto lg:h-screen lg:translate-x-0",
        bg,
        // Mobile open/close
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        // Width
        isCollapsed ? "w-24" : "w-72 lg:w-64"
      )}
    >
      <div
        className={cn(
          "h-full rounded-3xl p-5 transition-colors duration-300 flex flex-col",
          isDarkMode
            ? "bg-gray-800 shadow-[15px_15px_30px_#1a1a1a,-15px_-15px_30px_#404040]"
            : "bg-gray-200 shadow-[15px_15px_30px_#bebebe,-15px_-15px_30px_#ffffff]"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex mb-8",
            isCollapsed
              ? "flex-col items-center gap-2"
              : "items-center justify-between"
          )}
        >
          {!isCollapsed && (
            <div
              className={cn(
                "px-3 py-2 rounded-xl flex-1 mr-2",
                bg,
                isDarkMode
                  ? "shadow-[inset_6px_6px_12px_#1a1a1a,inset_-6px_-6px_12px_#404040]"
                  : "shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]"
              )}
            >
              <p className="text-lg font-bold leading-tight">🇺🇸🇮🇷</p>
              <p
                className={cn(
                  "text-xs font-medium",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}
              >
                이슈 브리핑
              </p>
            </div>
          )}

          <div className={cn("flex gap-2", isCollapsed && "flex-col")}>
            {/* Mobile close button */}
            <button
              onClick={onMobileClose}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 lg:hidden",
                bg,
                isDarkMode ? "text-gray-400" : "text-gray-600",
                shadowOut
              )}
            >
              <X size={16} />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                bg,
                isDarkMode ? "text-yellow-400" : "text-gray-600",
                shadowOut
              )}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "w-10 h-10 rounded-full hidden lg:flex items-center justify-center transition-all duration-200 text-sm font-bold",
                bg,
                isDarkMode ? "text-gray-400" : "text-gray-600",
                shadowOut
              )}
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
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 font-medium",
                bg,
                activeItem === item.id
                  ? isDarkMode
                    ? "shadow-[inset_8px_8px_16px_#1a1a1a,inset_-8px_-8px_16px_#404040] text-blue-400"
                    : "shadow-[inset_8px_8px_16px_#bebebe,inset_-8px_-8px_16px_#ffffff] text-blue-600"
                  : isDarkMode
                    ? "text-gray-400 shadow-[6px_6px_12px_#1a1a1a,-6px_-6px_12px_#404040] hover:text-blue-400"
                    : "text-gray-600 shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] hover:text-blue-500",
                isCollapsed && "justify-center"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && (
                <span className="text-sm">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom: monitoring status */}
        <div
          className={cn(
            "mt-8 pt-6",
            isDarkMode ? "border-t border-gray-600" : "border-t border-gray-300"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl",
              isDarkMode
                ? "bg-gray-800 shadow-[inset_4px_4px_8px_#1a1a1a,inset_-4px_-4px_8px_#404040]"
                : "bg-gray-200 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]",
              isCollapsed && "justify-center"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0",
                isDarkMode
                  ? "bg-gray-800 shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#404040]"
                  : "bg-gray-200 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]"
              )}
            >
              🛡️
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  실시간 모니터링
                </p>
                <p
                  className={cn(
                    "text-xs truncate",
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  )}
                >
                  {lastUpdate}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg",
              isDarkMode
                ? "bg-gray-800 shadow-[inset_3px_3px_6px_#1a1a1a,inset_-3px_-3px_6px_#404040]"
                : "bg-gray-200 shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm animate-pulse flex-shrink-0" />
            {!isCollapsed && (
              <span
                className={cn(
                  "text-xs",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}
              >
                Online
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
