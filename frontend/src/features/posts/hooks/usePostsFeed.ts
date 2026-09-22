import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { postQueries } from '../api/post.queries';
import type { Post } from '../types/post.interface';
import { useIntersectionPagination } from '@/hooks/useIntersectionPagination';

interface UsePostsFeedOptions {
  limit?: number;
}

interface UsePostsFeedReturn {
  posts: Post[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  hasNextPage: boolean;
  hasMore: boolean;
  fetchNextPage: () => void;
  loadMore: () => void;
  refresh: () => void;
  lastPostRef: (node: HTMLElement | null) => void;
}

export function usePostsFeed(options: UsePostsFeedOptions = {}): UsePostsFeedReturn {
  const { limit = 10 } = options;

  const {
    data,
    isLoading,
    isFetching,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(postQueries.infiniteFeed(limit));

  const posts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const lastPostRef = useIntersectionPagination({
    onLoadMore: () => {
      if (hasNextPage && !isFetching) {
        void fetchNextPage();
      }
    },
    isEnabled: hasNextPage && !isFetching,
    threshold: '100px',
  });

  return {
    posts,
    isLoading,
    isFetching,
    error,
    hasNextPage,
    hasMore: hasNextPage,
    fetchNextPage,
    loadMore: () => {
      if (hasNextPage && !isFetching) {
        void fetchNextPage();
      }
    },
    refresh: () => {
      void refetch();
    },
    lastPostRef,
  };
}