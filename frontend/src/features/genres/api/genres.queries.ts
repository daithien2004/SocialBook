import { keepPreviousData } from '@tanstack/react-query';
import { genreKeys } from '@/lib/query-keys';
import { GC_TIME, STALE_TIME } from '@/lib/query-constants';
import { getAllGenres, getGenre, getGenres } from './genres.api';

export const genreQueries = {
  all: () => ({
    queryKey: genreKeys.all,
    queryFn: () => getAllGenres(),
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.STATIC,
  }),
  list: (params?: { page?: number; pageSize?: number; name?: string }) => ({
    queryKey: genreKeys.list(params),
    queryFn: () => getGenres(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.STATIC,
  }),
  detail: (id: string) => ({
    queryKey: genreKeys.detail(id),
    queryFn: () => getGenre(id),
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.STATIC,
  }),
};