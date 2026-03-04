export interface PaginationMeta {
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  cursor?: string;
}

export interface SortOptions<T extends string = string> {
  sortBy?: T;
  order?: 'asc' | 'desc';
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    current: page,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
