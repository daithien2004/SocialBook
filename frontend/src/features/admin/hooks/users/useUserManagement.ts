import { useState } from 'react';
import { useBanUserMutation, useGetUsersQuery } from '@/features/users/api/usersApi';
import { useModalStore } from '@/store/useModalStore';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

export function useUserManagement() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { data, isLoading, isFetching, refetch } = useGetUsersQuery(
        `current=${page}&pageSize=${pageSize}`
    );
    const { openConfirm } = useModalStore();
    const [banUser, { isLoading: isBanning }] = useBanUserMutation();
    const users = data?.data || [];
    const total = data?.meta?.total || 0;
    const totalPages = data?.meta?.totalPages || Math.ceil(total / pageSize);

    const handleBan = async (id: string) => {
        try {
            await banUser(id).unwrap();
            toast.success('Cập nhật trạng thái người dùng thành công');
            refetch();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    };

    return {
        page,
        setPage,
        pageSize,
        setPageSize,
        users,
        total,
        totalPages,
        isLoading,
        isFetching,
        isBanning,
        handleBan,
        openConfirm
    };
}
