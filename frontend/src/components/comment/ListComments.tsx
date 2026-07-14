'use client';

import React from 'react';
import { useCommentList } from '@/features/comments/hooks/useCommentList';
import CommentItemCard from '@/components/comment/CommentItem';

interface ListCommentsProps {
    targetId: string;
    isCommentOpen: boolean;
    parentId: string | null;
    targetType: string;
    className?: string;
    depth?: number;
    onReplyAdded?: () => void;
    onReplyRemoved?: () => void;
}

const ListComments: React.FC<ListCommentsProps> = (props) => {
    const {
        isCommentOpen,
        parentId,
        targetId,
        targetType,
        className = '',
        depth = 1,
        onReplyAdded,
        onReplyRemoved,
    } = props;

    const {
        comments,
        isLoading,
        isError,
        isFetching,
        hasMore,
        loadMore,
    } = useCommentList({ targetId, isCommentOpen, parentId });

    return (
        <div className={`flex-1 overflow-y-auto px-2 space-y-1 ${className}`}>
            {isLoading && (
                <p className="text-sm text-muted-foreground animate-pulse">
                    Đang tải bình luận...
                </p>
            )}

            {isError && (
                <p className="text-sm text-destructive">Có lỗi khi tải bình luận.</p>
            )}

            {!isLoading && !isError && (
                <>
                    {comments.length ? (
                        comments.map((c) => (
                            <CommentItemCard
                                key={c.id}
                                targetType={targetType}
                                comment={c}
                                targetId={targetId}
                                depth={depth}
                                onReplyAdded={onReplyAdded}
                                onReplyRemoved={onReplyRemoved}
                            />
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p>
                    )}

                    {hasMore && (
                        <div className="flex justify-start mt-3">
                            <button
                                disabled={isFetching}
                                onClick={loadMore}
                                className="text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors text-primary hover:text-primary/80"
                            >
                                {isFetching ? 'Đang tải thêm...' : 'Xem thêm bình luận'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ListComments;
