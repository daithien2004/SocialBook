import { useCallback, useEffect, useRef, useState } from 'react';
import { useGetPostsQuery } from '../api/postApi';
import type { Post } from '../types/post.interface';

interface UsePostsFeedOptions {
  limit?: number;
  initialCursor?: string;
}

interface UsePostsFeedReturn {
  posts: Post[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  observerTarget: React.RefObject<HTMLDivElement | null>;
}

export function usePostsFeed(options: UsePostsFeedOptions = {}): UsePostsFeedReturn {
  const { limit = 10 } = options;
  
  const [cursor, setCursor] = useState<string | undefined>(options.initialCursor);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error, isFetching, refetch } = useGetPostsQuery(
    { cursor, limit },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const items = data?.data ?? [];
  const hasMore = data?.meta?.hasMore ?? false;
  const nextCursor = data?.meta?.nextCursor;

  // Update allPosts when items change
  useEffect(() => {
    if (!items.length && !hasMore) return;

    setAllPosts((prev) => {
      if (cursor === undefined) {
        return items;
      }

      // Deduplicate new posts
      const newPosts = items.filter((post) => !prev.some((p) => p.id === post.id));
      return [...prev, ...newPosts];
    });
  }, [items, cursor, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isFetching && nextCursor) {
          setCursor(nextCursor);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isFetching, nextCursor]);

  const loadMore = useCallback(() => {
    if (hasMore && !isFetching && nextCursor) {
      setCursor(nextCursor);
    }
  }, [hasMore, isFetching, nextCursor]);

  const refresh = useCallback(() => {
    setCursor(undefined);
    setAllPosts([]);
    refetch();
  }, [refetch]);

  return {
    posts: allPosts,
    isLoading,
    isFetching,
    error,
    hasMore,
    loadMore,
    refresh,
    observerTarget,
  };
}
