import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { bookKeys } from '@/lib/query-keys';
import { GC_TIME, STALE_TIME } from '@/lib/query-constants';
import type {
  BookSummaryPage,
  GetAdminBooksParams,
  GetBooksParams,
} from '../schemas/book.schema';
import {
  getAdminBooks,
  getBookById,
  getBookBySlug,
  getBookStats,
  getBooks,
  getFilters,
  getTopReadBooks,
  getTrendingSearches,
} from './books.api';

export const bookQueries = {
  detail: (bookSlug: string) =>
    queryOptions({
      queryKey: bookKeys.detail(bookSlug),
      queryFn: () => getBookBySlug(bookSlug),
      staleTime: STALE_TIME.SEMI_STATIC,
      gcTime: GC_TIME.SEMI_STATIC,
    }),

  list: (params?: GetBooksParams) =>
    queryOptions({
      queryKey: bookKeys.list(params),
      queryFn: ({ signal }) => getBooks(params, signal),
      placeholderData: keepPreviousData,
      staleTime: STALE_TIME.SEMI_STATIC,
      gcTime: GC_TIME.SEMI_STATIC,
    }),

  infiniteList: (params?: Omit<GetBooksParams, 'page'>) => {
    const limit = params?.limit ?? 12;
    return {
      queryKey: bookKeys.list(params),
      queryFn: ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }): Promise<BookSummaryPage> =>
        getBooks({ ...params, page: pageParam, limit }, signal),
      initialPageParam: 1,
      getNextPageParam: (lastPage: BookSummaryPage) =>
        lastPage.meta.current < lastPage.meta.totalPages
          ? lastPage.meta.current + 1
          : undefined,
      staleTime: STALE_TIME.SEMI_STATIC,
      gcTime: GC_TIME.SEMI_STATIC,
    };
  },

  filters: () =>
    queryOptions({
      queryKey: bookKeys.filters(),
      queryFn: () => getFilters(),
      staleTime: STALE_TIME.STATIC,
      gcTime: GC_TIME.STATIC,
    }),

  adminList: (params?: GetAdminBooksParams) =>
    queryOptions({
      queryKey: bookKeys.adminList(params),
      queryFn: () => getAdminBooks(params),
    }),

  byId: (bookId: string) =>
    queryOptions({
      queryKey: bookKeys.byId(bookId),
      queryFn: () => getBookById(bookId),
    }),

  stats: (bookId: string) =>
    queryOptions({
      queryKey: bookKeys.stats(bookId),
      queryFn: () => getBookStats(bookId),
    }),

  trendingSearches: () =>
    queryOptions({
      queryKey: bookKeys.trendingSearches(),
      queryFn: () => getTrendingSearches(),
      staleTime: STALE_TIME.STATIC,
      gcTime: GC_TIME.STATIC,
    }),

  topRead: (params: { timeRange: string; limit?: number }) =>
    queryOptions({
      queryKey: bookKeys.topRead(params),
      queryFn: () => getTopReadBooks(params),
      staleTime: STALE_TIME.SEMI_STATIC,
      gcTime: GC_TIME.SEMI_STATIC,
    }),
};