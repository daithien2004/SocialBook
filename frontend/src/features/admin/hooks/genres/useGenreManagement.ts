import { useState } from 'react';
import { useGetGenresQuery, useDeleteGenreMutation } from '@/features/genres/api/genreApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useModalStore } from '@/store/useModalStore';
import { Genre } from '@/features/genres/types/genre.interface';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

export function useGenreManagement() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const { openConfirm, openGenreModal } = useModalStore();

    const { data, isLoading, isFetching, refetch } = useGetGenresQuery({
        page,
        pageSize: 15,
        name: debouncedSearch || undefined,
    }, {
        refetchOnMountOrArgChange: true,
    });

    const [deleteGenre, { isLoading: isDeleting }] = useDeleteGenreMutation();
    const genres: Genre[] = data?.data || [];
    const meta = data?.meta;

    const handleDelete = async (id: string, name: string) => {
        try {
            await deleteGenre(id).unwrap();
            toast.success('Xóa thể loại thành công!');
            refetch();
        } catch (error: unknown) {
            console.error('Failed to delete genre:', error);
            toast.error(
                getErrorMessage(error) || `Xóa thể loại "${name}" thất bại!`
            );
        }
    };

    return {
        page,
        setPage,
        search,
        setSearch,
        genres,
        meta,
        isLoading,
        isFetching,
        isDeleting,
        refetch,
        handleDelete,
        openGenreModal,
        openConfirm
    };
}
