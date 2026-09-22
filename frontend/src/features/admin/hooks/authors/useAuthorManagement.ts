import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/lib/utils';
import { useDeleteAuthor } from '@/features/authors/api/authors.mutations';
import { authorQueries } from '@/features/authors/api/authors.queries';
import { useModalStore } from '@/store/useModalStore';

export function useAuthorManagement() {
  const { openConfirm, openAuthorModal } = useModalStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const listQuery = useQuery({
    ...authorQueries.list({
      page,
      pageSize: 15,
      name: debouncedSearch || undefined,
    }),
    refetchOnMount: true,
  });

  const deleteAuthor = useDeleteAuthor();

  const handleDelete = async (id: string, name = ''): Promise<void> => {
    try {
      await deleteAuthor.mutateAsync(id);
      toast.success('Xóa tác giả thành công');
      void listQuery.refetch();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || `Xóa tác giả "${name}" thất bại!`);
    }
  };

  return {
    page, setPage,
    search, setSearch,
    authors: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isDeleting: deleteAuthor.isPending,
    refetch: listQuery.refetch,
    handleDelete,
    openAuthorModal,
    openConfirm,
  };
}