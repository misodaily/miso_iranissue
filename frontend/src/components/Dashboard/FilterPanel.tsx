"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ArticleFilters } from "@/lib/api";

interface Props {
  filters: ArticleFilters;
  onChange: (f: ArticleFilters) => void;
}

const CLASSIFICATIONS = ["외교", "군사", "제재", "에너지", "시장", "기타"];
const SENTIMENTS = ["긴장고조", "완화", "중립"];
const LANGUAGES = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "fa", label: "فارسی" },
  { value: "ar", label: "العربية" },
];

export default function FilterPanel({ filters, onChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [query, setQuery] = useState(filters.q || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, q: query || undefined, page: 1 });
  };

  const reset = () => {
    setQuery("");
    onChange({ page: 1, page_size: 20 });
  };

  const hasFilters = filters.q || filters.classification || filters.sentiment ||
    filters.language || filters.min_risk !== undefined || filters.max_risk !== undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="키워드 검색 (제목, 요약)..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          검색
        </button>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className={`px-3 py-2 border rounded-lg text-sm transition ${showAdvanced ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          <SlidersHorizontal size={16} />
        </button>
        {hasFilters && (
          <button type="button" onClick={reset} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition">
            <X size={16} />
          </button>
        )}
      </form>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 self-center">분류:</span>
        {CLASSIFICATIONS.map(cls => (
          <button
            key={cls}
            onClick={() => onChange({ ...filters, classification: filters.classification === cls ? undefined : cls, page: 1 })}
            className={`px-2.5 py-1 text-xs rounded-full font-medium transition ${
              filters.classification === cls
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">감성/톤</label>
            <select
              value={filters.sentiment || ""}
              onChange={e => onChange({ ...filters, sentiment: e.target.value || undefined, page: 1 })}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {SENTIMENTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">언어</label>
            <select
              value={filters.language || ""}
              onChange={e => onChange({ ...filters, language: e.target.value || undefined, page: 1 })}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">리스크 최소</label>
            <input
              type="number"
              min={0} max={100}
              value={filters.min_risk ?? ""}
              onChange={e => onChange({ ...filters, min_risk: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">리스크 최대</label>
            <input
              type="number"
              min={0} max={100}
              value={filters.max_risk ?? ""}
              onChange={e => onChange({ ...filters, max_risk: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
