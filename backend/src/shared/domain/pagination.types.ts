export interface PaginationMeta {
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

export interface PaginatedResult<
  T,
  M extends PaginationMeta | CursorMeta = PaginationMeta,
> {
  data: T[];
  meta: M;
}

export type CursorPaginatedResult<T> = PaginatedResult<T, CursorMeta>;

/** Parameters passed from an application query to an offset-paginated repository. */
export interface PageParams {
  offset: number;
  limit: number;
}

/** Internal repository result; HTTP metadata is built at the presentation boundary. */
export interface PageResult<T> {
  items: T[];
  total: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SortOptions<T extends string = string> {
  sortBy?: T;
  order?: 'asc' | 'desc';
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function paginate<TItem, TResponse>(
  items: TItem[],
  total: number,
  pagination: { actualPage: number; actualLimit: number },
  map: (items: TItem[]) => TResponse[],
): PaginatedResult<TResponse> {
  return {
    data: map(items),
    meta: buildPaginationMeta(
      pagination.actualPage,
      pagination.actualLimit,
      total,
    ),
  };
}
