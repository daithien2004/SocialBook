'use client';

import React, { useEffect, useState } from 'react';
import {
  CommentItem,
  useLazyGetCommentsByTargetQuery,
} from '@/features/comments/api/commentApi';
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
    theme = 'light', // Mặc định là sáng để tương thích ngược
    className = '',
  } = props;

  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allComments, setAllComments] = useState<CommentItem[]>([]);

  const [
    fetchComments,
    { data, isLoading, isError, isFetching, isUninitialized },
  ] = useLazyGetCommentsByTargetQuery();
  const isFirstLoading = isLoading || (isFetching && isUninitialized);

  // --- Logic Style động theo Theme ---
  const isDark = theme === 'dark';
  const textClass = isDark ? 'text-neutral-400' : 'text-gray-500';
  const errorClass = isDark ? 'text-red-400' : 'text-red-500';
  const linkClass = isDark
    ? 'text-blue-400 hover:text-blue-300'
    : 'text-indigo-600 hover:text-indigo-700';

  useEffect(() => {
    if (!isCommentOpen) return;
    if (isCommentOpen && targetId) {
      setAllComments([]);
      setCursor(undefined);
      fetchComments({ targetId: targetId, parentId, limit: 20 });
    }
  }, [isCommentOpen, targetId, parentId, fetchComments]);

  useEffect(() => {
    if (data?.comments) {
      setAllComments(data.comments);
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
    <div className={`flex-1 overflow-y-auto px-2 space-y-1 ${className}`}>
      {isFirstLoading && (
        <p className={`text-sm ${textClass} animate-pulse`}>
          Đang tải bình luận...
        </p>
      )}

      {isError && (
        <p className={`text-sm ${errorClass}`}>Có lỗi khi tải bình luận.</p>
      )}

      {!isFirstLoading && !isError && (
        <>
          {allComments.length ? (
            allComments.map((c) => (
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

          {data?.hasMore && (
            <div className="flex justify-start mt-3">
              <button
                disabled={isFetching || !cursor}
                onClick={handleLoadMore}
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
