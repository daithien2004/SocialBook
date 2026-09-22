import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/lib/utils';
import { useDeleteGenre } from '@/features/genres/api/genres.mutations';
import { genreQueries } from '@/features/genres/api/genres.queries';
import { useModalStore } from '@/store/useModalStore';

export function useGenreManagement() {
  const { openConfirm, openGenreModal } = useModalStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const listQuery = useQuery({
    ...genreQueries.list({
      page,
      pageSize: 15,
      name: debouncedSearch || undefined,
    }),
    refetchOnMount: true,
  });

  const deleteGenre = useDeleteGenre();

  const handleDelete = async (id: string, name = ''): Promise<void> => {
    try {
      await deleteGenre.mutateAsync(id);
      toast.success('Xóa thể loại thành công!');
      void listQuery.refetch();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || `Xóa thể loại "${name}" thất bại!`);
    }
  };

  return {
    page, setPage,
    search, setSearch,
    genres: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isDeleting: deleteGenre.isPending,
    refetch: listQuery.refetch,
    handleDelete,
    openGenreModal,
    openConfirm,
  };
}