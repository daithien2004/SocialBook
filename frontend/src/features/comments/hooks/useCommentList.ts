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

export function useCommentList({ targetId, isCommentOpen, parentId, limit = 20 }: UseCommentListOptions) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allComments, setAllComments] = useState<CommentItem[]>([]);

  const { data, isLoading, isError, isFetching } = useQuery({
    ...commentQueries.byTarget({ targetId, parentId, cursor, limit }),
    enabled: isCommentOpen && !!targetId,
    placeholderData: keepPreviousData,
  });

  const isFirstLoading = isLoading || (isFetching && data === undefined);

  useEffect(() => {
    if (!isCommentOpen) return;
    if (isCommentOpen && targetId) {
      queueMicrotask(() => {
        setAllComments([]);
        setCursor(undefined);
      });
    }
  }, [isCommentOpen, targetId, parentId, limit]);

  useEffect(() => {
    if (data?.comments) {
      queueMicrotask(() => {
        setAllComments(data.comments);
        setCursor(data.nextCursor ?? undefined);
      });
    }
  }, [data]);

  const handleLoadMore = () => {
    if (cursor && targetId && data?.hasMore) {
      setCursor(data.nextCursor ?? cursor);
    }
  };

  return {
    comments: allComments,
    isLoading: isFirstLoading,
    isError,
    isFetching,
    hasMore: data?.hasMore ?? false,
    cursor,
    loadMore: handleLoadMore,
  };
}