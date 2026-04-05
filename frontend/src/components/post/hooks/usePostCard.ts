'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { usePostActions } from '@/features/posts/hooks/usePostActions';
import { Post } from '@/features/posts/types/post.interface';
import { useAppAuth } from '@/features/auth/hooks';
import { useModalStore } from '@/store/useModalStore';

interface UsePostCardOptions {
    post: Post;
}

export function usePostCard({ post }: UsePostCardOptions) {
    const { openEditPost, openSharePost, openPostComment } = useModalStore();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);
    const { user } = useAppAuth();

    const { likeCount, isLiked, isDeleting, toggleLike, deletePost } = usePostActions({
        postId: post.id,
        initialLikeCount: post.totalLikes ?? 0,
        initialLikeStatus: post.likedByCurrentUser ?? false,
    });

    const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${post.id}`;
    const shareTitle = post.content?.slice(0, 100) || 'Xem bài viết này';
    const shareMedia = post.imageUrls?.[0] || '/abstract-book-pattern.png';
    const isOwner = post.user?.id === user?.id;
    const displayedCommentCount = post.totalComments ?? 0;

    const handleDelete = useCallback(async () => {
        try {
            await deletePost();
            setShowDeleteConfirm(false);
        } catch {
            // Error handled in hook
        }
    }, [deletePost]);

    const openDeleteImageConfirm = useCallback((imageUrl: string) => {
        setImageToDelete(imageUrl);
        setShowDeleteImageConfirm(true);
    }, []);

    const handleDeleteImage = useCallback(async () => {
        if (!imageToDelete) return;
        try {
            toast.success('Xóa ảnh thành công!');
            setShowDeleteImageConfirm(false);
            setImageToDelete(null);
        } catch {
            // Error handled
        }
    }, [imageToDelete]);

    const handleOpenShare = useCallback(() => {
        openSharePost({ postUrl, shareTitle, shareMedia });
    }, [openSharePost, postUrl, shareTitle, shareMedia]);

    const handleOpenComment = useCallback(() => {
        openPostComment({
            post,
            handleLike: toggleLike,
            commentCount: displayedCommentCount,
            likeStatus: isLiked,
            likeCount,
        });
    }, [openPostComment, post, toggleLike, displayedCommentCount, isLiked, likeCount]);

    const handleOpenEdit = useCallback(() => openEditPost({ post }), [openEditPost, post]);
    const openDeleteConfirm = useCallback(() => setShowDeleteConfirm(true), []);

    return {
        isOwner,
        displayedCommentCount,
        isLiked,
        likeCount,
        isDeleting,
        showDeleteConfirm,
        showDeleteImageConfirm,
        imageToDelete,
        actions: {
            toggleLike,
            handleDelete,
            openDeleteImageConfirm,
            handleDeleteImage,
            handleOpenShare,
            handleOpenComment,
            handleOpenEdit,
            openDeleteConfirm,
            setShowDeleteConfirm,
            setShowDeleteImageConfirm,
        },
    };
}
