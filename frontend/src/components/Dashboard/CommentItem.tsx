import { ThumbsUp, AlertCircle } from "lucide-react";
import type { Comment } from "@/types";

interface Props {
    comment: Comment;
    onLike: (id: string) => void;
}

const sentimentConfig = {
    "긴장": { emoji: "🔥", color: "text-red-600 bg-red-50 border-red-200" },
    "우려": { emoji: "😟", color: "text-orange-600 bg-orange-50 border-orange-200" },
    "낙관": { emoji: "✨", color: "text-green-600 bg-green-50 border-green-200" },
    "중립": { emoji: "🤔", color: "text-gray-600 bg-gray-50 border-gray-200" }
};

export default function CommentItem({ comment, onLike }: Props) {
    const handleReport = () => {
        alert("신고가 접수되었습니다. 관리자 검토 후 숨김 처리됩니다.");
    };

    const sentiment = comment.sentiment ? sentimentConfig[comment.sentiment] : null;

    return (
        <div className="py-4 border-b border-gray-100 last:border-0">
            <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {comment.nickname.charAt(2)}
                    </div>
                    <span className="text-xs font-bold text-gray-800">{comment.nickname}</span>
                    <span className="text-[10px] text-gray-400">{comment.createdAt}</span>
                </div>

                {sentiment && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sentiment.color}`}>
                        {sentiment.emoji} {comment.sentiment}
                    </span>
                )}
            </div>

            <p className="text-sm text-gray-700 mt-2 mb-3 leading-relaxed break-words whitespace-pre-wrap">
                {comment.content}
            </p>

            <div className="flex items-center justify-between">
                <button
                    onClick={() => onLike(comment.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-md transition ${comment.likedByMe
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                >
                    <ThumbsUp size={13} className={comment.likedByMe ? "fill-blue-600" : ""} />
                    {comment.likes > 0 && <span>{comment.likes}</span>}
                </button>

                <button
                    onClick={handleReport}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition px-2 py-1"
                >
                    <AlertCircle size={11} /> 신고
                </button>
            </div>
        </div>
    );
}
