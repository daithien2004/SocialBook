import { useGetGenresQuery, useDeleteGenreMutation } from '@/features/genres/api/genreApi';
import { useModalStore } from '@/store/useModalStore';
import { Genre } from '@/features/genres/types/genre.interface';
import { useAdminListPage } from '@/features/admin/hooks/shared/useAdminListPage';

export function useGenreManagement() {
  const { openConfirm, openGenreModal } = useModalStore();

  const {
    page, setPage,
    search, setSearch,
    items: genres,
    meta,
    isLoading, isFetching, isDeleting,
    refetch,
    handleDelete,
  } = useAdminListPage<Genre>({
    useListQuery: useGetGenresQuery as never,
    useDeleteMutation: useDeleteGenreMutation as never,
    searchKey: 'name',
    successMessage: 'Xóa thể loại thành công!',
    errorMessage: (name) => `Xóa thể loại "${name}" thất bại!`,
  });

  return {
    page, setPage,
    search, setSearch,
    genres,
    meta,
    isLoading, isFetching, isDeleting,
    refetch,
    handleDelete,
    openGenreModal,
    openConfirm,
  };
}
