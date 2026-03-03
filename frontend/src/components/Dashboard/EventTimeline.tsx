"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { IssueCluster } from "@/types";
import { toKST, getClassificationColor, getSentimentColor } from "@/lib/utils";

const isMostlyEnglish = (text: string) => {
    if (!text) return false;
    // Count alphabet characters
    const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
    return englishCount > text.length * 0.3; // If more than 30% of string is English characters, assume English title
};

export default function EventTimeline() {
    const [clusters, setClusters] = useState<IssueCluster[]>([]);
    const [loading, setLoading] = useState(true);
    const [openingId, setOpeningId] = useState<number | null>(null);

    useEffect(() => {
        api.issues.list({ limit: 15 })
            .then(async (res) => {
                // Sort by last_updated_at descending
                const sorted = res.sort((a, b) =>
                    new Date(b.last_updated_at || "").getTime() - new Date(a.last_updated_at || "").getTime()
                );

                // Fetch details for each cluster to get the summary field
                const detailedClusters = await Promise.all(
                    sorted.map(async (cluster) => {
                        try {
                            const detail = await api.issues.get(cluster.id);
                            return { ...cluster, summary: detail.summary || cluster.summary };
                        } catch {
                            return cluster;
                        }
                    })
                );

                setClusters(detailedClusters);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleClusterClick = async (clusterId: number) => {
        if (openingId) return;
        setOpeningId(clusterId);
        try {
            const articles = await api.issues.articles(clusterId);
            if (articles && articles.length > 0) {
                // Open the most recent/first article external URL in new tab
                window.open(articles[0].url, "_blank");
            } else {
                alert("연결된 기사가 없습니다.");
            }
        } catch (e) {
            console.error("Failed to load articles for cluster", e);
            alert("기사 정보를 불러오는데 실패했습니다.");
        } finally {
            setOpeningId(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="w-2 h-full bg-gray-200 rounded-full"></div>
                            <div className="h-16 bg-gray-100 rounded-lg w-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (clusters.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col lg:h-full">
            <h2 className="text-base font-semibold text-gray-900 mb-4 shrink-0">주요 타임라인 (Key Events Timeline)</h2>
            <div className="max-h-[450px] lg:max-h-none lg:h-[calc(100vh-250px)] overflow-y-auto pr-2">
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 pb-2">
                    {clusters.map((cluster) => (
                        <div key={cluster.id} className="relative pl-5">
                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-50 border-4 border-white shadow-sm flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold text-gray-400">
                                        {toKST(cluster.last_updated_at)}
                                    </span>
                                    {cluster.classification && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getClassificationColor(cluster.classification)}`}>
                                            {cluster.classification}
                                        </span>
                                    )}
                                    {cluster.sentiment && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getSentimentColor(cluster.sentiment)}`}>
                                            {cluster.sentiment}
                                        </span>
                                    )}
                                </div>
                                <div
                                    onClick={() => handleClusterClick(cluster.id)}
                                    className={`group mt-0.5 cursor-pointer ${openingId === cluster.id ? 'opacity-50' : ''}`}
                                >
                                    <h3 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition leading-snug flex items-center gap-2">
                                        {cluster.title}
                                        {openingId === cluster.id && <span className="text-xs text-blue-500 animate-pulse">로딩 중...</span>}
                                    </h3>
                                </div>
                                {cluster.summary && isMostlyEnglish(cluster.title) && (
                                    <div
                                        onClick={() => handleClusterClick(cluster.id)}
                                        className="cursor-pointer mt-1"
                                    >
                                        <div className="bg-gray-50/80 hover:bg-gray-100 p-3 rounded-lg border border-gray-100 transition shadow-sm">
                                            <p className="text-[10px] font-bold text-blue-600 mb-1">💡 한글 번역/요약</p>
                                            <p className="text-xs text-gray-700 font-medium leading-relaxed">
                                                {cluster.summary}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
