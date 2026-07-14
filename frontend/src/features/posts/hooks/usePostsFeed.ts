import { useCallback, useEffect, useState } from 'react';
import { useGetPostsQuery } from '../api/postApi';
import type { Post } from '../types/post.interface';
import { useIntersectionPagination } from '@/hooks/useIntersectionPagination';

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
  lastPostRef: (node: HTMLElement | null) => void;
}

export function usePostsFeed(options: UsePostsFeedOptions = {}): UsePostsFeedReturn {
  const { limit = 10 } = options;
  
  const [cursor, setCursor] = useState<string | undefined>(options.initialCursor);
  const [allPosts, setAllPosts] = useState<Post[]>([]);

  const { data, isLoading, error, isFetching, refetch } = useGetPostsQuery(
    { cursor, limit },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const hasMore = data?.meta?.hasMore ?? false;
  const nextCursor = data?.meta?.nextCursor;

  // Update allPosts when data changes
  useEffect(() => {
    const currentItems = data?.data ?? [];
    if (!currentItems.length && !hasMore) return;

    queueMicrotask(() => {
      setAllPosts((prev) => {
        if (cursor === undefined) {
          return currentItems;
        }

        // Deduplicate new posts
        const newPosts = currentItems.filter((post) => !prev.some((p) => p.id === post.id));
        return [...prev, ...newPosts];
      });
    });
  }, [data, cursor, hasMore]);

  useEffect(() => {
    const handlePostUpdated = (e: Event) => {
      const updatedPost = (e as CustomEvent<Post>).detail;
      setAllPosts((prev) =>
        prev.map((post) =>
          post.id === updatedPost.id
            ? {
                ...post,
                content: updatedPost.content,
                imageUrls: updatedPost.imageUrls,
                book: updatedPost.book,
                isFlagged: updatedPost.isFlagged,
                moderationReason: updatedPost.moderationReason,
                moderationStatus: updatedPost.moderationStatus,
              }
            : post
        )
      );
    };

    window.addEventListener('post-updated', handlePostUpdated);
    return () => {
      window.removeEventListener('post-updated', handlePostUpdated);
    };
  }, []);

  // Intersection Observer for infinite scroll using general hook
  const lastPostRef = useIntersectionPagination({
    onLoadMore: () => {
      if (nextCursor) {
        setCursor(nextCursor);
      }
    },
    isEnabled: hasMore && !isFetching && !!nextCursor,
    threshold: '100px',
  });

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
    lastPostRef,
  };
}
