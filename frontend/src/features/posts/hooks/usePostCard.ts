'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MESSAGES } from '@/constants/messages';
import { usePostActions } from '@/features/posts/hooks/usePostActions';
import { Post } from '@/features/posts/types/post.interface';
import { useAppAuth } from '@/features/auth/hooks';
import { useModalStore } from '@/store/useModalStore';

interface UsePostCardOptions {
    post: Post;
}

export function usePostCard({ post }: UsePostCardOptions) {
    const { openEditPost, openSharePost, openPostComment, openConfirm } = useModalStore();
    const { user, isAuthenticated } = useAppAuth();
    const router = useRouter();

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

    const handleLike = useCallback(async () => {
        if (!isAuthenticated) {
            toast.info(MESSAGES.REQUIRE_LOGIN, {
                action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
            });
            return;
        }
        await toggleLike();
    }, [isAuthenticated, toggleLike, router]);

    const handleOpenShare = useCallback(() => {
        openSharePost({ postUrl, shareTitle, shareMedia });
    }, [openSharePost, postUrl, shareTitle, shareMedia]);

    const handleOpenComment = useCallback(() => {
        openPostComment({
            post,
            handleLike,
            commentCount: displayedCommentCount,
            likeStatus: isLiked,
            likeCount,
        });
    }, [openPostComment, post, handleLike, displayedCommentCount, isLiked, likeCount]);

    const handleOpenEdit = useCallback(() => openEditPost({ post }), [openEditPost, post]);
    
    const openDeleteConfirm = useCallback(() => {
        openConfirm({
            title: "Xóa bài viết?",
            description: "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài viết này chứ?",
            confirmText: "Xóa",
            variant: "destructive",
            onConfirm: async () => {
                await deletePost();
            }
        });
    }, [openConfirm, deletePost]);

    return {
        isOwner,
        displayedCommentCount,
        isLiked,
        likeCount,
        isDeleting,
        actions: {
            toggleLike: handleLike,
            handleOpenShare,
            handleOpenComment,
            handleOpenEdit,
            openDeleteConfirm,
        },
    };
}
