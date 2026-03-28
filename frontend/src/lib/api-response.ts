export interface PaginationMeta {
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type RawPaginationMeta = Partial<PaginationMeta> & {
  page?: number;
  limit?: number;
};

export interface PaginatedApiResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export type ArrayResponse<T> =
  | T[]
  | {
      data?: T[];
      meta?: RawPaginationMeta;
    };

export type ObjectResponse<T> = { data?: T } | T;

export function normalizePaginationMeta(
  meta: RawPaginationMeta | undefined,
  itemCount: number
): PaginationMeta {
  const current = meta?.current ?? meta?.page ?? 1;
  const pageSize = meta?.pageSize ?? meta?.limit ?? itemCount;
  const total = meta?.total ?? itemCount;

  return {
    current,
    pageSize,
    total,
    totalPages:
      meta?.totalPages ?? (pageSize > 0 ? Math.ceil(total / pageSize) : 0),
  };
}

export function normalizeArrayResponse<T>(
  response: ArrayResponse<T>
): PaginatedApiResult<T> {
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: {
        current: 1,
        pageSize: response.length,
        total: response.length,
        totalPages: response.length > 0 ? 1 : 0,
      },
    };
  }

  const data = Array.isArray(response?.data) ? response.data : [];

  return {
    data,
    meta: normalizePaginationMeta(response?.meta, data.length),
  };
}

export function extractArrayData<T>(response: ArrayResponse<T>): T[] {
  return normalizeArrayResponse(response).data;
}

export function mapPaginatedResponse<TInput, TOutput>(
  response: ArrayResponse<TInput>,
  mapper: (item: TInput) => TOutput
): PaginatedApiResult<TOutput> {
  const normalized = normalizeArrayResponse(response);

  return {
    data: normalized.data.map(mapper),
    meta: normalized.meta,
  };
}

export function extractObjectData<T>(response: ObjectResponse<T>): T {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    response.data !== undefined
  ) {
    return response.data;
  }

  return response as T;
}
