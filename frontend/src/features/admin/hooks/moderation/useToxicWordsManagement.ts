import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toxicWordsQueries } from '@/features/admin/api/toxic-words.queries';
import { AddToxicWordPayload } from '@/features/admin/api/toxic-words.api';
import { useAddToxicWord, useDeleteToxicWord } from '@/features/admin/api/toxic-words.mutations';
import { getErrorMessage } from '@/lib/utils';

export function useToxicWordsManagement() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');

    const {
        data: toxicWordsData,
        isLoading,
        isFetching,
        refetch
    } = useQuery({
        ...toxicWordsQueries.list({
            page,
            limit,
            search: search || undefined
        })
    });

    const { mutateAsync: addToxicWord, isPending: isAdding } = useAddToxicWord();
    const { mutateAsync: deleteToxicWord, isPending: isDeleting } = useDeleteToxicWord();

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleSearch = (searchTerm: string) => {
        setSearch(searchTerm);
        setPage(1); // Reset to first page on new search
    };

    const handleAdd = async (payload: AddToxicWordPayload) => {
        try {
            await addToxicWord(payload);
            toast.success('Thêm từ khoá thành công');
        } catch (error) {
            toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi thêm từ khoá');
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteToxicWord(id);
            toast.success('Xoá từ khoá thành công');
            
            // Adjust page if we deleted the last item on the current page
            if (toxicWordsData?.data?.length === 1 && page > 1) {
                setPage(page - 1);
            }
        } catch (error) {
            toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi xoá từ khoá');
        }
    };

    return {
        // Data
        toxicWords: toxicWordsData?.data || [],
        meta: toxicWordsData?.meta,
        isLoading: isLoading || isFetching,
        
        // State
        page,
        search,
        
        // Handlers
        handlePageChange,
        handleSearch,
        handleAdd,
        handleDelete,
        
        // Loading states
        isAdding,
        isDeleting,
        refetch
    };
}
