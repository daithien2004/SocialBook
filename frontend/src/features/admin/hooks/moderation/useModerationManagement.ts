import { useState } from 'react';
import { 
    useGetFlaggedPostsQuery, 
    useApprovePostMutation, 
    useRejectPostMutation,
    useBulkApprovePostsMutation,
    useBulkRejectPostsMutation
} from '@/features/admin/api/moderationApi';
import { useBanUserMutation } from '@/features/users/api/usersApi';
import { useModalStore } from '@/store/useModalStore';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

function getModerationErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

export function useModerationManagement() {
    const [page, setPage] = useState(1);
    const [reason, setReason] = useState<string>('');
    const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
    const limit = 10;

    const { data, isLoading, isFetching, refetch } = useGetFlaggedPostsQuery({ page, limit, reason: reason || undefined });
    const { openConfirm } = useModalStore();
    const [approvePost, { isLoading: isApproving }] = useApprovePostMutation();
    const [rejectPost, { isLoading: isRejecting }] = useRejectPostMutation();
    const [bulkApprove, { isLoading: isBulkApproving }] = useBulkApprovePostsMutation();
    const [bulkReject, { isLoading: isBulkRejecting }] = useBulkRejectPostsMutation();
    const [banUser, { isLoading: isBanning }] = useBanUserMutation();

    const posts = data?.data || [];
    const meta = data?.meta;

    const handleApprove = async (postId: string) => {
        try {
            await approvePost(postId).unwrap();
            toast.success('Bài viết đã được phê duyệt');
            setSelectedPostIds(prev => prev.filter(id => id !== postId));
            refetch();
        } catch (error: unknown) {
            toast.error(getModerationErrorMessage(error, 'Phê duyệt thất bại'));
        }
    };

    const handleReject = async (postId: string) => {
        try {
            await rejectPost(postId).unwrap();
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
            await bulkApprove(selectedPostIds).unwrap();
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
            await bulkReject(selectedPostIds).unwrap();
            toast.success(`Đã từ chối và xóa ${selectedPostIds.length} bài viết`);
            setSelectedPostIds([]);
            refetch();
        } catch (error: unknown) {
            toast.error(getModerationErrorMessage(error, 'Từ chối hàng loạt thất bại'));
        }
    };


    const handleBanUser = async (userId: string) => {
        try {
            await banUser(userId).unwrap();
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


    return {
        page,
        setPage,
        limit,
        reason,
        setReason: handleReasonChange,
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
