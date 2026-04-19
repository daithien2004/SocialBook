'use client';

import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { usePostCard } from '@/features/posts/hooks/usePostCard';
import { Post } from '@/features/posts/types/post.interface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { PostAuthorHeader } from './PostAuthorHeader';
import { PostActions } from './PostActions';
import { PostImageGallery } from './PostImageGallery';
import { PostBookSection } from './PostBookSection';

interface PostCardProps {
    post: Post;
}

const PostCard = memo(function PostCard({ post }: PostCardProps) {
    const {
        isOwner,
        displayedCommentCount,
        isLiked,
        likeCount,
        isDeleting,
        showDeleteConfirm,
        showDeleteImageConfirm,
        actions,
    } = usePostCard({ post });

    return (
        <>
            <Card className="w-full mb-5 overflow-hidden transition-shadow duration-200 hover:shadow-md border-slate-100 dark:border-gray-700 bg-white/95 dark:bg-[#1a1a1a]">
                <CardHeader className="p-4">
                    <PostAuthorHeader
                        post={post}
                        isOwner={isOwner}
                        onEdit={actions.handleOpenEdit}
                        onDelete={actions.openDeleteConfirm}
                    />
                </CardHeader>

                <CardContent className="p-4 pt-0">
                    <p className="text-[15px] leading-relaxed text-slate-800 dark:text-gray-200 whitespace-pre-wrap">
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
                        isOwner={isOwner}
                        onDeleteImage={actions.openDeleteImageConfirm}
                    />
                )}

                <PostActions
                    isLiked={isLiked}
                    likeCount={likeCount}
                    commentCount={displayedCommentCount}
                    onLike={actions.toggleLike}
                    onComment={actions.handleOpenComment}
                    onShare={actions.handleOpenShare}
                />

                <AlertDialog open={showDeleteConfirm} onOpenChange={actions.setShowDeleteConfirm}>
                    <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-gray-800">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-gray-100">
                                Xóa bài viết?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 dark:text-gray-400">
                                Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài viết này chứ?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-3">
                            <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800">
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    actions.handleDelete();
                                }}
                                disabled={isDeleting}
                                className={buttonVariants({ variant: 'destructive' })}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang xóa...</span>
                                    </>
                                ) : (
                                    'Xóa'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showDeleteImageConfirm} onOpenChange={actions.setShowDeleteImageConfirm}>
                    <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-gray-800">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-gray-100">
                                Xóa ảnh này?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 dark:text-gray-400">
                                Bạn có chắc chắn muốn xóa ảnh này khỏi bài viết không?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-3">
                            <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800">
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    actions.handleDeleteImage();
                                }}
                                className={buttonVariants({ variant: 'destructive' })}
                            >
                                Xóa
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>
        </>
    );
});

export default PostCard;
