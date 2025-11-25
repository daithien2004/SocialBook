"use client";

import React, { useEffect, useState } from "react";
import ListComments from "./ListComments";
import { Post } from "@/src/features/posts/types/post.interface";
import {
    type CommentItem as CommentItemType,
    useLazyGetResolveParentQuery,
    usePostCreateMutation, usePostToggleLikeMutation,
} from "@/src/features/comments/api/commentApi";

interface CommentItemProps {
    comment: CommentItemType;
    targetId: string
    targetType: string
}

const CommentItemCard: React.FC<CommentItemProps> = (props) => {
    const { comment, targetId ,targetType} = props;

    const [showReplies, setShowReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");

    const [postToggleLike, { isLoading: isPosting }] = usePostToggleLikeMutation();
    const [createComment, { isLoading: isPostingReply }] = usePostCreateMutation();

    const [
        triggerResolveParent,
        { data: resolvedData, isLoading: isResolvingParent },
    ] = useLazyGetResolveParentQuery();

    const handleShowReplies = () => {
        setShowReplies(true);
    };

    const handleReplyClick = () => {
        setShowReplies(true);
        setIsReplying((prev) => !prev);
    };

    // Gọi BE để resolve parent khi lần đầu mở replies
    useEffect(() => {
        if (!showReplies) return;

        // chỉ gọi nếu chưa resolve lần nào
        if (!resolvedData) {
            triggerResolveParent({
                targetId: targetId,
                parentId: comment.id,
                targetType: targetType,
            });
        }
    }, [showReplies, triggerResolveParent, targetId, comment.id, resolvedData, targetType]);

    // parentId chuẩn (dùng BE trả về, fallback comment.id cho chắc)
    const effectiveParentId = resolvedData?.parentId ?? comment.id;
    const level = resolvedData?.level; // 👈 lấy level từ backend

    const handleSubmitReply = async () => {
        const content = replyText.trim();
        if (!content) return;

        try {
            await createComment({
                targetType: targetType,
                targetId: targetId,
                content,
                parentId: effectiveParentId,
            }).unwrap();

            setReplyText("");
            setShowReplies(true);
            setIsReplying(false);
        } catch (e) {
            console.error("Create reply failed:", e);
        }
    };

    const handleLikeComment = async () => {
        try {
            await postToggleLike({
                targetId: comment.id,
                targetType: "comment",
                parentId: comment.parentId,
                postId: targetId,
            }).unwrap();
        } catch (e) {
            console.error("Like comment failed:", e);
        }
    };

    return (
        <div className="flex items-start justify-start gap-2">
            <img
                src={comment.userId?.image || "/user.png"}
                alt="HeHe"
                className="w-7 h-7 rounded-full"
            />

            <div>
                {/* Nội dung comment */}
                <div className="bg-gray-100 rounded-xl px-3 py-2">
                    <p className="text-sm text-black">
            <span className="font-semibold mr-2">
              {comment.userId?.username}
            </span>
                        {comment.content}
                    </p>

                    <div className="flex gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                            {comment.likesCount} lượt thích
                        </p>
                        <p  onClick={handleLikeComment}
                            className="text-xs text-gray-500 cursor-pointer hover:underline underline-offset-2">
                            Thích
                        </p>
                        <button
                            type="button"
                            onClick={handleReplyClick}
                            className="text-xs text-gray-500 cursor-pointer hover:underline underline-offset-2"
                        >
                            Trả lời
                        </button>
                    </div>
                </div>

                {/* REPLIES */}
                <div className="mt-1 ms-2">
                    {!showReplies && comment.repliesCount > 0 && (
                        <button
                            onClick={handleShowReplies}
                            className="text-xs text-gray-500 font-semibold"
                        >
                            Xem tất cả phản hồi ({comment.repliesCount})
                        </button>
                    )}

                    {showReplies && (
                        <div className="border-l border-gray-200 ms-3 space-y-2">
                            {/* Nếu đang resolve lần đầu */}
                            {isResolvingParent && !resolvedData && (
                                <p className="text-xs text-gray-400 px-2">
                                    Đang tải phản hồi...
                                </p>
                            )}

                            {/*
                Nếu đã có resolvedData và level KHÁC 3
                => mới render ListComments lồng bên dưới
              */}
                            {resolvedData && level !== 3 && (
                                <ListComments
                                    targetId = {targetId}
                                    isCommentOpen={true}
                                    parentId={effectiveParentId}
                                    targetType = {targetType}
                                />
                            )}

                            {/* Ô nhập reply: luôn hiện khi isReplying,
                  kể cả level = 3 (chỉ có textbox, không có list lồng thêm) */}
                            {isReplying && (
                                <div className="mt-1 ms-3 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Trả lời..."
                                        className="flex-1 border text-black border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        disabled={isPostingReply || !replyText.trim()}
                                        onClick={handleSubmitReply}
                                        className="text-xs text-indigo-600 font-semibold cursor-pointer hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isPostingReply ? "Đang gửi..." : "Gửi"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentItemCard;
