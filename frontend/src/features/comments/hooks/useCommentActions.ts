import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import {
    useDeleteCommentMutation,
    useEditCommentMutation,
    useLazyGetResolveParentQuery,
    usePostCreateMutation,
} from '@/features/comments/api/commentApi';
import { CommentItem, ResolveParentResponse } from '@/features/comments/types/comment.interface';
import { usePostToggleLikeMutation } from '@/features/likes/api/likeApi';

export interface UseCommentActionsOptions {
    comment: CommentItem;
    targetId: string;
    targetType: string;
    userId?: string;
}

export interface UseCommentActionsResult {
    isOwner: boolean;
    optimisticLikeCount: number;
    optimisticIsLiked: boolean;
    optimisticReplyCount: number;
    isEditing: boolean;
    editText: string;
    isReplying: boolean;
    replyText: string;
    showReplies: boolean;
    isEditingComment: boolean;
    isDeletingComment: boolean;
    isPostingReply: boolean;
    isResolvingParent: boolean;
    resolvedData: ResolveParentResponse | undefined;
    effectiveParentId: string;
    setIsEditing: (v: boolean) => void;
    setEditText: (v: string) => void;
    setIsReplying: (v: boolean) => void;
    setReplyText: (v: string) => void;
    setShowReplies: (v: boolean) => void;
    handleEditComment: () => Promise<void>;
    handleDeleteComment: () => Promise<void>;
    handleSubmitReply: () => Promise<void>;
    handleLikeComment: () => Promise<void>;
    handleReplyClick: () => void;
}

export function useCommentActions({
    comment,
    targetId,
    targetType,
    userId,
}: UseCommentActionsOptions): UseCommentActionsResult {
    const [showReplies, setShowReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [optimisticLikeCount, setOptimisticLikeCount] = useState(
        comment.likesCount ?? 0
    );
    const [optimisticIsLiked, setOptimisticIsLiked] = useState(
        comment.isLiked ?? false
    );
    const [optimisticReplyCount, setOptimisticReplyCount] = useState(
        comment.repliesCount ?? 0
    );

    const isOwner = comment.user.id === userId;
    const hasReplyCount = comment.repliesCount !== undefined;

    const [editComment, { isLoading: isEditingComment }] =
        useEditCommentMutation();
    const [deleteComment, { isLoading: isDeletingComment }] =
        useDeleteCommentMutation();
    const [postToggleLike] = usePostToggleLikeMutation();
    const [createComment, { isLoading: isPostingReply }] =
        usePostCreateMutation();

    const [
        triggerResolveParent,
        { data: resolvedData, isLoading: isResolvingParent },
    ] = useLazyGetResolveParentQuery();

    useEffect(() => {
        if (!showReplies || resolvedData) return;

        triggerResolveParent({
            targetId,
            parentId: comment.id,
            targetType,
        });
    }, [showReplies, resolvedData, triggerResolveParent, targetId, comment.id, targetType]);

    useEffect(() => {
        setOptimisticLikeCount(comment.likesCount ?? 0);
    }, [comment.likesCount]);

    useEffect(() => {
        setOptimisticIsLiked(comment.isLiked ?? false);
    }, [comment.isLiked]);

    useEffect(() => {
        if (hasReplyCount) {
            setOptimisticReplyCount(comment.repliesCount ?? 0);
        }
    }, [comment.repliesCount, hasReplyCount]);

    const handleReplyClick = useCallback(() => {
        setShowReplies(true);
        setIsReplying((prev) => !prev);
    }, []);

    const handleEditComment = useCallback(async () => {
        const content = editText.trim();
        if (!content || content === comment.content) {
            setIsEditing(false);
            return;
        }

        try {
            await editComment({
                id: comment.id,
                content,
                targetId,
                parentId: comment.parentId ?? null,
            }).unwrap();
            toast.success('Bình luận đã được chỉnh sửa!');
            setIsEditing(false);
        } catch (error: unknown) {
            const apiError = error as {
                status?: number;
                data?: { message?: string };
            };

            if (apiError?.status === 400 && apiError?.data?.message) {
                toast.error(`Sửa thất bại: ${apiError.data.message}`);
            } else if (apiError?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        }
    }, [editText, comment, targetId, editComment]);

    const handleDeleteComment = useCallback(async () => {
        try {
            await deleteComment({
                id: comment.id,
                targetId,
                parentId: comment.parentId ?? null,
            }).unwrap();
            toast.success('Bình luận đã được xóa!');
        } catch (error: unknown) {
            if ((error as { status?: number })?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        }
    }, [comment.id, comment.parentId, targetId, deleteComment]);

    const handleSubmitReply = useCallback(async () => {
        const content = replyText.trim();
        if (!content) return;

        try {
            await createComment({
                targetType,
                targetId,
                content,
                parentId: resolvedData?.parentId ?? comment.id,
            }).unwrap();

            setReplyText('');
            setShowReplies(true);
            setIsReplying(false);

            if (hasReplyCount) {
                setOptimisticReplyCount((prev) => prev + 1);
            }
        } catch (error: unknown) {
            console.log('Create reply failed:', error);
            toast.error(getErrorMessage(error));
        }
    }, [replyText, targetType, targetId, resolvedData, comment.id, hasReplyCount, createComment]);

    const handleLikeComment = useCallback(async () => {
        try {
            const nextLiked = !optimisticIsLiked;

            setOptimisticIsLiked(nextLiked);
            setOptimisticLikeCount((prev) =>
                nextLiked ? prev + 1 : Math.max(0, prev - 1)
            );

            await postToggleLike({
                targetId: comment.id,
                targetType: 'comment',
            }).unwrap();
        } catch (error) {
            setOptimisticIsLiked(comment.isLiked ?? false);
            setOptimisticLikeCount(comment.likesCount ?? 0);

            console.error('Like comment failed:', error);
        }
    }, [optimisticIsLiked, comment.id, comment.isLiked, comment.likesCount, postToggleLike]);

    const effectiveParentId = resolvedData?.parentId ?? comment.id;
    const level = resolvedData?.level;

    return {
        isOwner,
        optimisticLikeCount,
        optimisticIsLiked,
        optimisticReplyCount,
        isEditing,
        editText,
        isReplying,
        replyText,
        showReplies,
        isEditingComment,
        isDeletingComment,
        isPostingReply,
        isResolvingParent,
        resolvedData,
        effectiveParentId,
        setIsEditing,
        setEditText,
        setIsReplying,
        setReplyText,
        setShowReplies,
        handleEditComment,
        handleDeleteComment,
        handleSubmitReply,
        handleLikeComment,
        handleReplyClick,
    };
}
