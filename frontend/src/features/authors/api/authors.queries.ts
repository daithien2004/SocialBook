import { keepPreviousData } from '@tanstack/react-query';
import { authorKeys } from '@/lib/query-keys';
import { GC_TIME, STALE_TIME } from '@/lib/query-constants';
import { getAuthor, getAllAuthors, getAuthors } from './authors.api';

export const authorQueries = {
  all: () => ({
    queryKey: authorKeys.all,
    queryFn: () => getAllAuthors(),
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.STATIC,
  }),
  list: (params?: { page?: number; pageSize?: number; name?: string }) => ({
    queryKey: authorKeys.list(params),
    queryFn: () => getAuthors(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.STATIC,
  }),
  detail: (id: string) => ({
    queryKey: authorKeys.detail(id),
    queryFn: () => getAuthor(id),
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.STATIC,
  }),
};