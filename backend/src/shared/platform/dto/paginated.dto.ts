import type { PaginationMeta } from '@/shared/domain/pagination.types';

export interface OffsetMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CursorMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Paginated<T, M = OffsetMeta | CursorMeta> {
  data: T[];
  meta: M;
}

export function paginated<T>(
  data: T[],
  meta: PaginationMeta,
): Paginated<T, OffsetMeta>;
export function paginated<T, M extends OffsetMeta | CursorMeta>(
  data: T[],
  meta: M,
): Paginated<T, M>;
export function paginated<T>(
  data: T[],
  meta: PaginationMeta | OffsetMeta | CursorMeta,
): Paginated<T> {
  if ('current' in meta) {
    return {
      data,
      meta: {
        page: meta.current,
        pageSize: meta.pageSize,
        total: meta.total,
        totalPages: meta.totalPages,
      },
    };
  }

  return { data, meta };
}

export function unpaginated<T>(data: T[]): Paginated<T, OffsetMeta> {
  const total = data.length;
  return paginated(data, {
    page: 1,
    pageSize: total,
    total,
    totalPages: total > 0 ? 1 : 0,
  });
}
