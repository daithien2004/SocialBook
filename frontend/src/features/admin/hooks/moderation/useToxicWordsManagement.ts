import { useState } from 'react';
import {
    useGetToxicWordsQuery,
    useAddToxicWordMutation,
    useDeleteToxicWordMutation,
    AddToxicWordPayload
} from '../../api/toxicWordsApi';
import { toast } from 'sonner';
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
    } = useGetToxicWordsQuery({
        page,
        limit,
        search: search || undefined
    });

    const [addToxicWord, { isLoading: isAdding }] = useAddToxicWordMutation();
    const [deleteToxicWord, { isLoading: isDeleting }] = useDeleteToxicWordMutation();

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleSearch = (searchTerm: string) => {
        setSearch(searchTerm);
        setPage(1); // Reset to first page on new search
    };

    const handleAdd = async (payload: AddToxicWordPayload) => {
        try {
            await addToxicWord(payload).unwrap();
            toast.success('Thêm từ khoá thành công');
        } catch (error) {
            toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi thêm từ khoá');
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteToxicWord(id).unwrap();
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
