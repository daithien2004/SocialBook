'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { commentQueries } from '../api/comment.queries';
import type { CommentItem } from '../types/comment.interface';

interface UseCommentListOptions {
  targetId: string;
  isCommentOpen: boolean;
  parentId: string | null;
  limit?: number;
}

export function useCommentList({
  targetId,
  isCommentOpen,
  parentId,
  limit = 20,
}: UseCommentListOptions) {
  const [page, setPage] = useState(1);
  const [allComments, setAllComments] = useState<CommentItem[]>([]);

  const { data, isLoading, isError, isFetching } = useQuery({
    ...commentQueries.byTarget({ targetId, parentId, page, limit }),
    enabled: isCommentOpen && !!targetId,
    placeholderData: keepPreviousData,
  });

  const isFirstLoading = isLoading || (isFetching && data === undefined);

  useEffect(() => {
    if (!isCommentOpen) return;
    if (isCommentOpen && targetId) {
      queueMicrotask(() => {
        setAllComments([]);
        setPage(1);
      });
    }
  }, [isCommentOpen, targetId, parentId, limit]);

  useEffect(() => {
    if (data?.comments) {
      queueMicrotask(() => {
        setAllComments((previous) =>
          page === 1 ? data.comments : [...previous, ...data.comments],
        );
      });
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (targetId && data?.hasMore) {
      setPage((previousPage) => previousPage + 1);
    }
  };

  return {
    comments: allComments,
    isLoading: isFirstLoading,
    isError,
    isFetching,
    hasMore: data?.hasMore ?? false,
    cursor: data?.nextCursor ?? undefined,
    loadMore: handleLoadMore,
  };
}
