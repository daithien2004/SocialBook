// ListComments.tsx
"use client"

import React, {useEffect, useState} from "react";
import {
    CommentItem,
    useLazyGetCommentsByTargetQuery,
} from "@/src/features/comments/api/commentApi";
import CommentItemCard from "@/src/components/comment/CommentItem";

interface ListCommentsProps {
    targetId: string
    isCommentOpen: boolean;
    parentId: string | null;
    targetType: string;
}

const ListComments:React.FC<ListCommentsProps> = (props) => {
    const {isCommentOpen, parentId, targetId, targetType} = props;

    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [allComments, setAllComments] = useState<CommentItem[]>([]);

    const [
        fetchComments,
        { data, isLoading, isError, isFetching, isUninitialized },
    ] = useLazyGetCommentsByTargetQuery();

    const isFirstLoading = isLoading || (isFetching && isUninitialized);

    useEffect(() => {
        if (!isCommentOpen) return;
        if (isCommentOpen && targetId) {
            setAllComments([]);
            setCursor(undefined);
            fetchComments({ targetId: targetId, parentId, limit: 20 });
        }
    }, [isCommentOpen, targetId, parentId, fetchComments]);

    useEffect(() => {
        if (data?.items) {
            setAllComments(data.items);
            setCursor(data.nextCursor ?? undefined);
        }
    }, [data]);

    const handleLoadMore = () => {
        if (cursor && targetId) {
            fetchComments({
                targetId: targetId,
                parentId,
                cursor,
                limit: 20,
            });
        }
    };

    return (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {isFirstLoading && (
                <p className="text-sm text-gray-500">
                    Đang tải bình luận...
                </p>
            )}
            {isError && (
                <p className="text-sm text-red-500">
                    Có lỗi khi tải bình luận.
                </p>
            )}

            {!isFirstLoading && !isError && (
                <>
                    {allComments.length ? (
                        allComments.map((c) => (
                            <CommentItemCard
                                key={c.id}
                                targetType = {targetType}
                                comment={c}
                                targetId={targetId}
                            />
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">Chưa có bình luận nào.</p>
                    )}

                    {data?.hasMore && (
                        <div className="flex justify-start mt-3">
                            <button
                                disabled={isFetching || !cursor}
                                onClick={handleLoadMore}
                                className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 disabled:opacity-50 cursor-pointer"
                            >
                                {isFetching
                                    ? "Đang tải thêm..."
                                    : "Xem thêm bình luận"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ListComments;
