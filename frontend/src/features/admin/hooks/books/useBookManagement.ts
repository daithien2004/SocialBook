import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { useDeleteBook } from '@/features/books/api/books.mutations';
import { bookQueries } from '@/features/books/api/books.queries';
import { useModalStore } from '@/store/useModalStore';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

type BookStatus = 'draft' | 'published' | 'completed';
type StatusFilter = BookStatus | 'all';

export function useBookManagement() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const { openDeleteBook } = useModalStore();

  const listQuery = useQuery({
    ...bookQueries.adminList({
      page,
      limit: 15,
      search: debouncedSearch || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    refetchOnMount: true,
  });

  const deleteBook = useDeleteBook();

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteBook.mutateAsync(id);
      toast.success('Xóa sách thành công');
      void listQuery.refetch();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Xóa sách thất bại');
    }
  };

  return {
    page, setPage,
    search, setSearch,
    statusFilter, setStatusFilter,
    books: listQuery.data?.data ?? [],
    pagination: listQuery.data?.meta,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    isDeleting: deleteBook.isPending,
    handleDelete,
    openDeleteBook,
  };
}