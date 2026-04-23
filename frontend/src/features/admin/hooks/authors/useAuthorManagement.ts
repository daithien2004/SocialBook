import { useState } from 'react';
import { useGetAuthorsQuery, useDeleteAuthorMutation } from '@/features/authors/api/authorApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useModalStore } from '@/store/useModalStore';
import { Author } from '@/features/authors/types/author.interface';
import { toast } from 'sonner';

export function useAuthorManagement() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const { openConfirm, openAuthorModal } = useModalStore();

    const { data, isLoading, isFetching, refetch } = useGetAuthorsQuery({
        page,
        pageSize: 15,
        name: debouncedSearch || undefined,
    }, {
        refetchOnMountOrArgChange: true,
    });

    const [deleteAuthor, { isLoading: isDeleting }] = useDeleteAuthorMutation();
    const authors: Author[] = data?.data || [];
    const meta = data?.meta;

    const handleDelete = async (id: string, name: string) => {
        try {
            await deleteAuthor(id).unwrap();
            toast.success('Xóa tác giả thành công');
            refetch();
        } catch (error) {
            console.error('Failed to delete author:', error);
            toast.error('Xóa tác giả thất bại!');
        }
    };

    return {
        page,
        setPage,
        search,
        setSearch,
        authors,
        meta,
        isLoading,
        isFetching,
        isDeleting,
        refetch,
        handleDelete,
        openAuthorModal,
        openConfirm
    };
}
