import { useGetAuthorsQuery, useDeleteAuthorMutation } from '@/features/authors/api/authorApi';
import { useModalStore } from '@/store/useModalStore';
import { Author } from '@/features/authors/types/author.interface';
import { useAdminListPage } from '@/features/admin/hooks/shared/useAdminListPage';

export function useAuthorManagement() {
  const { openConfirm, openAuthorModal } = useModalStore();

  const {
    page, setPage,
    search, setSearch,
    items: authors,
    meta,
    isLoading, isFetching, isDeleting,
    refetch,
    handleDelete,
  } = useAdminListPage<Author>({
    useListQuery: useGetAuthorsQuery as never,
    useDeleteMutation: useDeleteAuthorMutation as never,
    searchKey: 'name',
    successMessage: 'Xóa tác giả thành công',
    errorMessage: (name) => `Xóa tác giả "${name}" thất bại!`,
  });

  return {
    page, setPage,
    search, setSearch,
    authors,
    meta,
    isLoading, isFetching, isDeleting,
    refetch,
    handleDelete,
    openAuthorModal,
    openConfirm,
  };
}
