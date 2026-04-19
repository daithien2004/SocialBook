'use client';

import React from 'react';
import { useCommentList } from '@/features/comments/hooks/useCommentList';
import CommentItemCard from '@/components/comment/CommentItem';

interface ListCommentsProps {
    targetId: string;
    isCommentOpen: boolean;
    parentId: string | null;
    targetType: string;
    theme?: 'light' | 'dark';
    className?: string;
}

const ListComments: React.FC<ListCommentsProps> = (props) => {
    const {
        isCommentOpen,
        parentId,
        targetId,
        targetType,
        theme = 'light',
        className = '',
    } = props;

    const {
        comments,
        isLoading,
        isError,
        isFetching,
        hasMore,
        loadMore,
    } = useCommentList({ targetId, isCommentOpen, parentId });

    const isDark = theme === 'dark';
    const textClass = isDark ? 'text-neutral-400' : 'text-gray-500';
    const errorClass = isDark ? 'text-red-400' : 'text-red-500';
    const linkClass = isDark
        ? 'text-blue-400 hover:text-blue-300'
        : 'text-indigo-600 hover:text-indigo-700';

    return (
        <div className={`flex-1 overflow-y-auto px-2 space-y-1 ${className}`}>
            {isLoading && (
                <p className={`text-sm ${textClass} animate-pulse`}>
                    Đang tải bình luận...
                </p>
            )}

            {isError && (
                <p className={`text-sm ${errorClass}`}>Có lỗi khi tải bình luận.</p>
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
                            />
                        ))
                    ) : (
                        <p className={`text-sm ${textClass}`}>Chưa có bình luận nào.</p>
                    )}

                    {hasMore && (
                        <div className="flex justify-start mt-3">
                            <button
                                disabled={isFetching}
                                onClick={loadMore}
                                className={`text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors ${linkClass}`}
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
