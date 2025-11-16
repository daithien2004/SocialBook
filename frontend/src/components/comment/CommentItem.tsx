"use client";

import React, { useState } from "react";
import ListComments from "./ListComments";
import { Post } from "@/src/features/posts/types/post.interface";
import { type CommentItem as CommentItemType } from "@/src/features/comments/api/commentApi";

interface CommentItemProps {
    comment: CommentItemType;
    post: Post;
}

const CommentItemCard: React.FC<CommentItemProps> = (props) => {
    const { comment, post } = props; // ✅ destructure đúng
    const [showReplies, setShowReplies] = useState(false);

    return (
        <div className="flex items-start gap-3">
            {/* Avatar */}
            <img
                src={comment.user?.image ?? ""}
                alt=""
                className="w-7 h-7 rounded-full"
            />

            <div>
                {/* Nội dung */}
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-sm">
            <span className="font-semibold mr-2">
              {comment.user?.username}
            </span>
                        {comment.content}
                    </p>

                    <div className="flex gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                            {comment.likesCount} lượt thích
                        </p>
                        <p className="text-xs text-gray-500 cursor-pointer hover:underline underline-offset-2">
                            Thích
                        </p>
                        <p className="text-xs text-gray-500 cursor-pointer hover:underline underline-offset-2">
                            Trả lời
                        </p>
                    </div>
                </div>

                {/* REPLIES */}
                <div className="mt-1 ms-2">
                    {!showReplies && comment.repliesCount > 0 && (
                        <button
                            onClick={() => setShowReplies(true)}
                            className="text-xs text-gray-500 font-semibold"
                        >
                            Xem tất cả phản hồi ({comment.repliesCount})
                        </button>
                    )}

                    {showReplies && (
                        <div className="border-l border-gray-200 ms-3">
                            <ListComments
                                post={post}
                                isCommentOpen={true}
                                parentId={comment.id}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentItemCard;
