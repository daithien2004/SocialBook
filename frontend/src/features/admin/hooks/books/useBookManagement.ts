import { useState } from 'react';
import { useDeleteBookMutation, useGetAdminBooksQuery } from '@/features/books/api/bookApi';
import { BackendPagination, BookForAdmin } from '@/features/books/types/book.interface';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { useModalStore } from '@/store/useModalStore';

type BookStatus = 'draft' | 'published' | 'completed';
type StatusFilter = BookStatus | 'all';

export function useBookManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data, isLoading, isFetching, refetch } = useGetAdminBooksQuery({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  }, {
    refetchOnMountOrArgChange: true,
  });

  const [deleteBook, { isLoading: isDeleting }] = useDeleteBookMutation();
  const { openDeleteBook } = useModalStore();
  const books: BookForAdmin[] = data?.data || [];
  const pagination: BackendPagination | undefined = data?.meta;

  const handleDelete = async (id: string) => {
    try {
      await deleteBook(id).unwrap();
      toast.success('Xóa sách thành công');
      refetch();
    } catch (error) {
      console.error('Failed to delete book:', error);
      toast.error('Xóa sách thất bại');
    }
  };

  return {
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    books,
    pagination,
    isLoading,
    isFetching,
    isDeleting,
    handleDelete,
    openDeleteBook
  };
}
