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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

                {post.isFlagged && (
                    <Alert className="mx-4 mb-4 overflow-hidden rounded-xl border border-amber-200/50 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-sm p-0">
                        <div className="flex items-stretch">
                            <div className="w-1.5 bg-amber-400 dark:bg-amber-600" />
                            <div className="flex-1 p-3.5">
                                <AlertTitle className="flex items-center gap-2 mb-1.5">
                                    <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                            <path d="M12 9v4" />
                                            <path d="M12 17h.01" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-amber-900 dark:text-amber-100 uppercase tracking-tight">
                                        Đang chờ phê duyệt
                                    </span>
                                </AlertTitle>
                                <AlertDescription>
                                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2.5 border border-amber-100 dark:border-amber-800/30">
                                        <p className="text-[13px] text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                                            {post.moderationReason || 'Bài viết chứa nội dung cần quản trị viên xem xét trước khi hiển thị công khai.'}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-[11px] text-amber-700/60 dark:text-amber-400/60 font-medium italic">
                                        * Chỉ bạn mới có thể thấy bài viết này trong lúc chờ kiểm duyệt.
                                    </p>
                                </AlertDescription>
                            </div>
                        </div>
                    </Alert>
                )}

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
