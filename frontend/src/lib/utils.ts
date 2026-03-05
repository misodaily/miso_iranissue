import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function toKST(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return formatInTimeZone(date, "Asia/Seoul", "yyyy-MM-dd HH:mm");
  } catch {
    return dateStr;
  }
}

export function getRiskColor(score: number | undefined | null): string {
  if (!score) return "text-gray-400";
  if (score >= 80) return "text-purple-500";
  if (score >= 60) return "text-red-500";
  if (score >= 40) return "text-yellow-500";
  return "text-green-500";
}

export function getRiskBgColor(score: number | undefined | null): string {
  if (!score) return "bg-gray-100 text-gray-600";
  if (score >= 80) return "bg-purple-100 text-purple-800";
  if (score >= 60) return "bg-red-100 text-red-800";
  if (score >= 40) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

export function getSentimentColor(sentiment: string | undefined): string {
  if (sentiment === "긴장고조") return "text-red-600 bg-red-50";
  if (sentiment === "완화") return "text-green-600 bg-green-50";
  return "text-gray-600 bg-gray-50";
}

export function getClassificationColor(cls: string | undefined): string {
  const map: Record<string, string> = {
    외교: "bg-blue-100 text-blue-800",
    군사: "bg-red-100 text-red-800",
    제재: "bg-orange-100 text-orange-800",
    에너지: "bg-yellow-100 text-yellow-800",
    시장: "bg-teal-100 text-teal-800",
    기타: "bg-gray-100 text-gray-700",
  };
  return map[cls || "기타"] || map["기타"];
}

export function getLanguageFlag(lang: string | undefined): string {
  const map: Record<string, string> = {
    ko: "🇰🇷",
    en: "🇺🇸",
    fa: "🇮🇷",
    ar: "🇸🇦",
  };
  return map[lang || "en"] || "🌐";
}
