import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import type { CommentSentiment } from "@/types";

interface Props {
    onSubmit: (content: string, sentiment: CommentSentiment) => void;
}

const sentiments: { label: string; value: CommentSentiment; emoji: string; color: string }[] = [
    { label: "긴장", value: "긴장", emoji: "🔥", color: "text-red-600 bg-red-50 border-red-200" },
    { label: "우려", value: "우려", emoji: "😟", color: "text-orange-600 bg-orange-50 border-orange-200" },
    { label: "낙관", value: "낙관", emoji: "✨", color: "text-green-600 bg-green-50 border-green-200" },
    { label: "중립", value: "중립", emoji: "🤔", color: "text-gray-600 bg-gray-50 border-gray-200" }
];

export default function CommentComposer({ onSubmit }: Props) {
    const [content, setContent] = useState("");
    const [selectedSentiment, setSelectedSentiment] = useState<CommentSentiment>(null);

    const maxLength = 200;
    const isOverLimit = content.length > maxLength;
    const isDisabled = content.trim().length === 0 || isOverLimit;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isDisabled) return;

        onSubmit(content.trim(), selectedSentiment);
        setContent("");
        setSelectedSentiment(null);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <MessageSquarePlus size={16} className="text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-800">이슈에 대한 의견을 남겨보세요</h3>
            </div>

            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {sentiments.map((s) => (
                    <button
                        key={s.value}
                        type="button"
                        onClick={() => setSelectedSentiment(selectedSentiment === s.value ? null : s.value)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors ${selectedSentiment === s.value
                                ? s.color
                                : "text-gray-500 bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        {s.emoji} {s.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="저속한 표현은 숨김 처리될 수 있습니다. (익명으로 등록됩니다)"
                    className={`w-full text-sm p-3 rounded-lg border focus:outline-none focus:ring-1 transition-shadow resize-none h-20 bg-gray-50 focus:bg-white ${isOverLimit ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-400"
                        }`}
                />
                <div className={`absolute bottom-2 right-2 text-[10px] font-medium ${isOverLimit ? "text-red-500" : "text-gray-400"}`}>
                    {content.length}/{maxLength}
                </div>
            </div>

            <div className="mt-3 flex justify-end">
                <button
                    type="submit"
                    disabled={isDisabled}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    등록하기
                </button>
            </div>
        </form>
    );
}
