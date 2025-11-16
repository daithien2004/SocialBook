"use client"

import React, {useEffect, useState} from "react";
import {CommentItem, useLazyGetCommentsByTargetQuery} from "@/src/features/comments/api/commentApi";
import {Post} from "@/src/features/posts/types/post.interface";
import CommentItemCard from "@/src/components/comment/CommentItem";

interface ListCommentsProps {
    post: Post;
    isCommentOpen: boolean;
    parentId: string | null;
}

const ListComments:React.FC<ListCommentsProps> = (props) => {

    const { post, isCommentOpen, parentId} = props;
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [allComments, setAllComments] = useState<CommentItem[]>([]);
    const [isShowComment, setIsShowComment] = useState(isCommentOpen)

    const [
        fetchComments,
        { data, isLoading, isError, isFetching, isUninitialized },
    ] = useLazyGetCommentsByTargetQuery();

    const isFirstLoading = isLoading || (isFetching && isUninitialized);

    useEffect(() => {
        if (isShowComment && post?.id && !data) {
            fetchComments({ targetId: post.id, parentId, limit: 5 });
        }
    }, [isCommentOpen, post.id, parentId, fetchComments, isShowComment, data]);

    useEffect(() => {
        if (data?.items) {
            setAllComments((prev) => {
                const existed = new Set(prev.map((c) => c.id));
                return [
                    ...prev,
                    ...data.items.filter((c) => !existed.has(c.id)),
                ];
            });

            setCursor(data.nextCursor ?? undefined);
        }
    }, [data]);

    const handleLoadMore = () => {
        if (cursor && post?.id) {
            fetchComments({
                targetId: post.id,
                parentId,
                cursor,
                limit: 1,
            });
        }
    };

    return(
        <>
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
                                    comment={c}
                                    post={post}
                                />
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">Chưa có bình luận nào.</p>
                        )}

                        {/* Nút load thêm */}
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
        </>
    )
}
 export default ListComments