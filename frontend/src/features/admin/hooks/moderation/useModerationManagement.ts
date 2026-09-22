import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
    moderationQueries,
    useApprovePost, 
    useBulkApprovePosts,
    useBulkRejectPosts,
    useRejectPost
} from '@/features/admin/api/moderationApi';
import { useBanUser } from '@/features/users/api/users.mutations';
import { useModalStore } from '@/store/useModalStore';
import { getErrorMessage } from '@/lib/utils';

function getModerationErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

export function useModerationManagement() {
    const [page, setPage] = useState(1);
    const [reason, setReason] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
    const limit = 10;

    const { data, isLoading, isFetching, refetch } = useQuery({ 
        ...moderationQueries.flaggedPosts({ 
            page, limit, 
            reason: reason || undefined, 
            startDate: startDate || undefined, 
            endDate: endDate || undefined, 
            sortBy: sortBy || undefined 
        })
    });
    const { data: stats } = useQuery({ ...moderationQueries.stats() });
    const { openConfirm } = useModalStore();
    const { mutateAsync: approvePost, isPending: isApproving } = useApprovePost();
    const { mutateAsync: rejectPost, isPending: isRejecting } = useRejectPost();
    const { mutateAsync: bulkApprove, isPending: isBulkApproving } = useBulkApprovePosts();
    const { mutateAsync: bulkReject, isPending: isBulkRejecting } = useBulkRejectPosts();
    const { mutateAsync: banUser, isPending: isBanning } = useBanUser();

    const posts = data?.data || [];
    const meta = data?.meta;

    const handleApprove = async (postId: string) => {
        try {
            await approvePost(postId);
            toast.success('Bài viết đã được phê duyệt');
            setSelectedPostIds(prev => prev.filter(id => id !== postId));
            refetch();
        } catch (error: unknown) {
            toast.error(getModerationErrorMessage(error, 'Phê duyệt thất bại'));
        }
    };

    const handleReject = async (postId: string) => {
        try {
            await rejectPost(postId);
            toast.success('Bài viết đã bị từ chối và xóa');
            setSelectedPostIds(prev => prev.filter(id => id !== postId));
            refetch();
        } catch (error: unknown) {
            toast.error(getModerationErrorMessage(error, 'Từ chối thất bại'));
        }
    };

    const handleBulkApprove = async () => {
        if (selectedPostIds.length === 0) return;
        try {
            await bulkApprove(selectedPostIds);
            toast.success(`Đã phê duyệt ${selectedPostIds.length} bài viết`);
            setSelectedPostIds([]);
            refetch();
        } catch (error: unknown) {
            toast.error(getModerationErrorMessage(error, 'Phê duyệt hàng loạt thất bại'));
        }
    };

    const handleBulkReject = async () => {
        if (selectedPostIds.length === 0) return;
        try {
            await bulkReject(selectedPostIds);
            toast.success(`Đã từ chối và xóa ${selectedPostIds.length} bài viết`);
            setSelectedPostIds([]);
            refetch();
        } catch (error: unknown) {
            toast.error(getModerationErrorMessage(error, 'Từ chối hàng loạt thất bại'));
        }
    };


    const handleBanUser = async (userId: string) => {
        try {
            await banUser(userId);
            toast.success('Cập nhật trạng thái người dùng thành công');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    };

    const toggleSelectPost = (postId: string) => {
        setSelectedPostIds(prev => 
            prev.includes(postId) 
                ? prev.filter(id => id !== postId)
                : [...prev, postId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPostIds.length === posts.length) {
            setSelectedPostIds([]);
        } else {
            setSelectedPostIds(posts.map(post => post.id));
        }
    };

    const handleReasonChange = (newReason: string) => {
        setReason(newReason);
        setPage(1);
        setSelectedPostIds([]);
    };

    const clearFilters = () => {
        setReason('');
        setStartDate('');
        setEndDate('');
        setSortBy('newest');
        setPage(1);
        setSelectedPostIds([]);
    };

    return {
        page,
        setPage,
        limit,
        reason,
        setReason: handleReasonChange,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        sortBy,
        setSortBy,
        clearFilters,
        stats,
        posts,
        meta,
        selectedPostIds,
        toggleSelectPost,
        toggleSelectAll,
        isLoading,
        isFetching,
        isApproving,
        isRejecting,
        isBulkApproving,
        isBulkRejecting,
        isBanning,
        handleApprove,
        handleReject,
        handleBulkApprove,
        handleBulkReject,
        handleBanUser,
        openConfirm
    };
}
