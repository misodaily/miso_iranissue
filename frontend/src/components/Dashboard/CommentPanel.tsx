"use client";
import { useState } from "react";
import type { Comment, CommentSentiment } from "@/types";
import CommentComposer from "./CommentComposer";
import CommentList from "./CommentList";

const initialMockData: Comment[] = [
    {
        id: "m1",
        nickname: "익명A12",
        content: "호르무즈 해협 위기가 계속되면 에너지 가격이 폭등할 것 같아 걱정이네요. 빠른 외교적 해결이 필요합니다.",
        sentiment: "우려",
        likes: 24,
        likedByMe: false,
        createdAt: "10분 전",
        reported: false
    },
    {
        id: "m2",
        nickname: "익명 204",
        content: "현재 상황이 장기화될 가능성을 열어두고 대응안을 마련해야 할 듯.",
        sentiment: "중립",
        likes: 8,
        likedByMe: true,
        createdAt: "35분 전",
        reported: false
    }
];

export default function CommentPanel() {
    const [comments, setComments] = useState<Comment[]>(initialMockData);
    const [sortParam, setSortParam] = useState<"recent" | "likes">("recent");

    const handleAddComment = (content: string, sentiment: CommentSentiment) => {
        const newComment: Comment = {
            id: `c_${Date.now()}`,
            nickname: `익명${Math.floor(Math.random() * 900) + 100}`,
            content,
            sentiment,
            likes: 0,
            likedByMe: false,
            createdAt: "방금 전",
            reported: false
        };

        // Add to top optimistically
        setComments([newComment, ...comments]);
    };

    const handleToggleLike = (id: string) => {
        setComments(comments.map(c => {
            if (c.id === id) {
                const isLiking = !c.likedByMe;
                return {
                    ...c,
                    likedByMe: isLiking,
                    likes: isLiking ? c.likes + 1 : c.likes - 1
                };
            }
            return c;
        }));
    };

    const sortedComments = [...comments].sort((a, b) => {
        if (sortParam === "likes") {
            return b.likes - a.likes;
        }
        // Very basic sorting simulation treating "방금 전" as newest
        return a.id.localeCompare(b.id) * -1;
    });

    return (
        <div className="flex flex-col h-full mt-0">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <span>💬</span> 실시간 익명 반응
                </h2>

                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setSortParam("recent")}
                        className={`text-xs px-3 py-1 rounded-md transition font-medium ${sortParam === "recent" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        최신순
                    </button>
                    <button
                        onClick={() => setSortParam("likes")}
                        className={`text-xs px-3 py-1 rounded-md transition font-medium ${sortParam === "likes" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        공감순
                    </button>
                </div>
            </div>

            <CommentComposer onSubmit={handleAddComment} />

            <div className="flex-1 max-h-[520px] lg:max-h-none overflow-y-auto pr-1 pb-4">
                <CommentList comments={sortedComments} onLike={handleToggleLike} />
            </div>
        </div>
    );
}
