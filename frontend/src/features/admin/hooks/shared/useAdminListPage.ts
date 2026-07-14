import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

interface PaginatedResult<T> {
  data: T[];
  meta?: {
    total?: number;
    totalPages?: number;
    page?: number;
    pageSize?: number;
  };
}

interface UseAdminListPageOptions<T> {
  useListQuery: (
    params: Record<string, unknown>,
    options?: { refetchOnMountOrArgChange?: boolean }
  ) => {
    data: PaginatedResult<T> | undefined;
    isLoading: boolean;
    isFetching: boolean;
    refetch: () => void;
    error?: unknown;
  };
  useDeleteMutation: () => [
    (id: string) => { unwrap: () => Promise<unknown> },
    { isLoading: boolean }
  ];
  pageSize?: number;
  searchKey?: string;
  successMessage: string;
  errorMessage: string | ((name: string) => string);
  extraParams?: Record<string, unknown>;
}

interface UseAdminListPageResult<T> {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  search: string;
  setSearch: (search: string) => void;
  items: T[];
  meta: PaginatedResult<T>['meta'];
  isLoading: boolean;
  isFetching: boolean;
  isDeleting: boolean;
  error: unknown;
  refetch: () => void;
  handleDelete: (id: string, name?: string) => Promise<void>;
}

export function useAdminListPage<T>({
  useListQuery,
  useDeleteMutation,
  pageSize = 15,
  searchKey = 'name',
  successMessage,
  errorMessage,
  extraParams = {},
}: UseAdminListPageOptions<T>): UseAdminListPageResult<T> {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const queryParams: Record<string, unknown> = {
    page,
    pageSize,
    limit: pageSize,
    ...extraParams,
    ...(debouncedSearch ? { [searchKey]: debouncedSearch } : {}),
  };

  const { data, isLoading, isFetching, error, refetch } = useListQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const [deleteFn, { isLoading: isDeleting }] = useDeleteMutation();

  const handleDelete = async (id: string, name = '') => {
    try {
      await deleteFn(id).unwrap();
      toast.success(successMessage);
      refetch();
    } catch (err: unknown) {
      const msg =
        typeof errorMessage === 'function'
          ? errorMessage(name)
          : errorMessage;
      toast.error(getErrorMessage(err) || msg);
    }
  };

  return {
    page,
    setPage,
    search,
    setSearch,
    items: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isFetching,
    isDeleting,
    error,
    refetch,
    handleDelete,
  };
}
