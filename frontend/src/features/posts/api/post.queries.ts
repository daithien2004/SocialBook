import { keepPreviousData } from '@tanstack/react-query';
import { postKeys } from '@/lib/query-keys';
import { GC_TIME, STALE_TIME } from '@/lib/query-constants';
import {
  getPostsByUser,
  getPostsFeed,
  getPostById,
  getTopActiveReaders,
  getTrendingBooks,
} from './post.api';
import type {
  PaginatedPostsResponse,
  PaginationParams,
  PaginationParamsByUser,
  Post,
  TopReader,
  TrendingBook,
} from '@/features/posts/schemas/post.schema';

export const postQueries = {
  feed(params?: PaginationParams) {
    return {
      queryKey: postKeys.list(params),
      queryFn: (): Promise<PaginatedPostsResponse> => getPostsFeed(params),
      placeholderData: keepPreviousData,
    };
  },
  infiniteFeed(limit = 10) {
    return {
      queryKey: postKeys.list({ limit }),
      queryFn: ({ pageParam }: { pageParam?: string }): Promise<PaginatedPostsResponse> =>
        getPostsFeed({ cursor: pageParam, limit }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: PaginatedPostsResponse) => lastPage.meta.nextCursor ?? undefined,
    };
  },
  byUser(params: PaginationParamsByUser) {
    return {
      queryKey: postKeys.byUser(params),
      queryFn: (): Promise<PaginatedPostsResponse> => getPostsByUser(params),
      placeholderData: keepPreviousData,
    };
  },
  infiniteByUser(args: { userId: string; limit?: number }) {
    const limit = args.limit ?? 10;
    return {
      queryKey: postKeys.byUser({ userId: args.userId, limit }),
      queryFn: ({ pageParam }: { pageParam?: string }): Promise<PaginatedPostsResponse> =>
        getPostsByUser({ userId: args.userId, cursor: pageParam, limit }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: PaginatedPostsResponse) => lastPage.meta.nextCursor ?? undefined,
    };
  },
  detail(args: { id: string; userId?: string }) {
    return {
      queryKey: postKeys.detail(args.id, args.userId),
      queryFn: (): Promise<Post> => getPostById(args),
    };
  },
  trendingBooks(params?: { days?: number; limit?: number }) {
    return {
      queryKey: postKeys.trendingBooks(params),
      queryFn: (): Promise<TrendingBook[]> => getTrendingBooks(params),
      staleTime: STALE_TIME.SEMI_STATIC,
      gcTime: GC_TIME.SEMI_STATIC,
    };
  },
  topReaders(params?: { days?: number; limit?: number }) {
    return {
      queryKey: postKeys.topReaders(params),
      queryFn: (): Promise<TopReader[]> => getTopActiveReaders(params),
      staleTime: STALE_TIME.SEMI_STATIC,
      gcTime: GC_TIME.SEMI_STATIC,
    };
  },
};