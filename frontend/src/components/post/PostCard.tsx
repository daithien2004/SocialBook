'use client';

import { memo } from 'react';
import { Loader2, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
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
