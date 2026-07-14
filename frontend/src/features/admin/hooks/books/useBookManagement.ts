import { useState } from 'react';
import { useDeleteBookMutation, useGetAdminBooksQuery } from '@/features/books/api/bookApi';
import { BookForAdmin } from '@/features/books/types/book.interface';
import { useModalStore } from '@/store/useModalStore';
import { useAdminListPage } from '@/features/admin/hooks/shared/useAdminListPage';

type BookStatus = 'draft' | 'published' | 'completed';
type StatusFilter = BookStatus | 'all';

export function useBookManagement() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { openDeleteBook } = useModalStore();

  const {
    page, setPage,
    search, setSearch,
    items: books,
    meta: pagination,
    isLoading, isFetching, isDeleting,
    error,
    handleDelete,
  } = useAdminListPage<BookForAdmin>({
    useListQuery: useGetAdminBooksQuery as never,
    useDeleteMutation: useDeleteBookMutation as never,
    searchKey: 'search',
    successMessage: 'Xóa sách thành công',
    errorMessage: 'Xóa sách thất bại',
    extraParams: {
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
  });

  return {
    page, setPage,
    search, setSearch,
    statusFilter, setStatusFilter,
    books,
    pagination,
    isLoading, isFetching,
    error,
    isDeleting,
    handleDelete,
    openDeleteBook,
  };
}
