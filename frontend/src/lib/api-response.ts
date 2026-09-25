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


export function unwrapApiResponse<T>(responseData: unknown): T {
  if (responseData && typeof responseData === 'object') {
    const res = responseData as Record<string, unknown>;
    if ('meta' in res || 'warning' in res) {
      return {
        data: res.data,
        meta: res.meta,
        warning: res.warning,
        message: res.message,
      } as T;
    }
    if ('data' in res && res.data !== undefined) {
      return res.data as T;
    }
  }
  return responseData as T;
}
