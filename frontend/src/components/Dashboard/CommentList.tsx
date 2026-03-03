import { MessageSquare } from "lucide-react";
import type { Comment } from "@/types";
import CommentItem from "./CommentItem";

interface Props {
    comments: Comment[];
    onLike: (id: string) => void;
}

export default function CommentList({ comments, onLike }: Props) {
    if (comments.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
                <MessageSquare size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">아직 등록된 의견이 없습니다.</p>
                <p className="text-xs mt-1 text-gray-400">가장 먼저 의견을 남겨보세요!</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} onLike={onLike} />
            ))}
        </div>
    );
}
