import type { PaginationMetaData } from '@/lib/pagination.schema';

export type PaginationMeta = PaginationMetaData;

export type RawPaginationMeta = Partial<PaginationMeta> & {
  page?: number;
  limit?: number;
};

export interface PaginatedApiResult<T> {
  data: T[];
  meta: PaginationMeta;
}

