"use client";
import { useState, useEffect } from "react";
import { Bell, BellOff, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import type { Alert } from "@/types";
import { toKST, getRiskBgColor } from "@/lib/utils";

export default function AlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    api.alerts.list({ limit: 20 })
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: number) => {
    await api.alerts.markRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, notified: true } : a));
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-orange-500" />
          <h2 className="text-base font-semibold text-gray-900">알림</h2>
          {alerts.filter(a => !a.notified).length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {alerts.filter(a => !a.notified).length}
            </span>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <BellOff size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">알림이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border transition ${
                !alert.notified
                  ? "bg-orange-50 border-orange-200"
                  : "bg-gray-50 border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 line-clamp-1">{alert.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{toKST(alert.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {alert.risk_score && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${getRiskBgColor(alert.risk_score)}`}>
                      {alert.risk_score}
                    </span>
                  )}
                  {!alert.notified && (
                    <button
                      onClick={() => markRead(alert.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      읽음
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
