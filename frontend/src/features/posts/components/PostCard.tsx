'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MESSAGES } from '@/constants/messages';
import { ShieldAlert, Info } from 'lucide-react';
import { usePostLike } from '@/features/posts/hooks/usePostLike';
import { useDeletePost } from '@/features/posts/api/post.mutations';
import { Post } from '@/features/posts/types/post.interface';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PostAuthorHeader } from './PostAuthorHeader';
import { PostActions } from './PostActions';
import { PostImageGallery } from './PostImageGallery';
import { PostBookSection } from './PostBookSection';
import { useAppAuth } from '@/features/auth/hooks';
import { useModalStore } from '@/store/useModalStore';
import { Action, Subject } from '@socialbook/shared';
import { subject } from '@casl/ability';

interface PostCardProps {
    post: Post;
}

const PostCard = memo(function PostCard({ post }: PostCardProps) {
    const { isAuthenticated, ability } = useAppAuth();
    const router = useRouter();
    
    const openEditPost = useModalStore(s => s.openEditPost);
    const openSharePost = useModalStore(s => s.openSharePost);
    const openPostComment = useModalStore(s => s.openPostComment);
    const openConfirm = useModalStore(s => s.openConfirm);

    const deletePostMutation = useDeletePost();

    const { likeCount, isLiked, toggleLike } = usePostLike({
        postId: post.id,
        initialLikeCount: post.likesCount ?? 0,
        initialLikeStatus: post.likedByCurrentUser ?? false,
    });

    const isOwner = ability?.can(Action.Update, subject(Subject.Post, { userId: post.user?.id || '' })) ?? false;
    const displayedCommentCount = post.commentsCount ?? 0;
    const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${post.id}`;
    const shareTitle = post.content?.slice(0, 100) || 'Xem bài viết này';
    const shareMedia = post.imageUrls?.[0] || '/abstract-book-pattern.png';

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
                await deletePostMutation.mutateAsync(post.id);
                toast.success(MESSAGES.POST_DELETE_SUCCESS);
            }
        });
    }, [openConfirm, deletePostMutation, post.id]);

    return (
        <>
            <Card className="w-full mb-5 overflow-hidden transition-shadow duration-200 hover:shadow-md border-border bg-card/95">
                <CardHeader className="p-4">
                    <PostAuthorHeader
                        post={post}
                        isOwner={isOwner}
                        onEdit={handleOpenEdit}
                        onDelete={openDeleteConfirm}
                    />
                </CardHeader>

                {post.isFlagged && (
                    <Alert className="mx-4 mb-4 overflow-hidden rounded-xl border border-amber-200/50 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500 p-0 border-none">
                        <div className="flex items-start gap-3 p-4">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-1">
                                <AlertTitle className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-0">
                                    Nội dung đang được xem xét
                                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-amber-200/50 dark:bg-amber-800/50 rounded-full font-bold">Moderation</span>
                                </AlertTitle>
                                <AlertDescription className="text-sm text-amber-700/90 dark:text-amber-400/90 leading-relaxed font-medium">
                                    {post.moderationReason || 'Bài viết này đang được kiểm duyệt do chứa nội dung không phù hợp.'}
                                </AlertDescription>
                                <div className="pt-2 flex items-center gap-1.5 text-[11px] text-amber-600/70 dark:text-amber-500/70 italic font-normal">
                                    <Info className="w-3 h-3" />
                                    <span>Chỉ có bạn mới nhìn thấy bài viết này cho đến khi được phê duyệt.</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200 dark:from-amber-800 dark:via-orange-700 dark:to-amber-800 opacity-50" />
                    </Alert>
                )}

                <CardContent className="px-4 pb-2 pt-0">
                    <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                        {post.content}
                    </p>
                </CardContent>

                {post.book && (
                    <div className="px-4 pb-3">
                        <PostBookSection book={post.book} />
                    </div>
                )}

                {post.imageUrls && post.imageUrls.length > 0 && (
                    <PostImageGallery
                        images={post.imageUrls}
                    />
                )}

                <PostActions
                    isLiked={isLiked}
                    likeCount={likeCount}
                    commentCount={displayedCommentCount}
                    onLike={handleLike}
                    onComment={handleOpenComment}
                    onShare={handleOpenShare}
                />
            </Card>
        </>
    );
});

export default PostCard;
