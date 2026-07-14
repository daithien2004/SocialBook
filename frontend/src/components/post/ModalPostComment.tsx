'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ListComments from '@/components/comment/ListComments';
import { usePostCreateMutation } from '@/features/comments/api/commentApi';
import { cn } from '@/lib/utils';
import { ShieldAlert, Info } from 'lucide-react';
import { useModalStore } from '@/store/useModalStore';
import { usePostComments } from '@/features/posts/hooks/usePostComments';
import { usePostActions } from '@/features/posts/hooks/usePostActions';
import { useAppAuth } from '@/features/auth/hooks';

import { UserAvatarWithInfo } from "@/components/common/UserAvatar";
import { PostActions } from '@/components/post/PostActions';
import { PostBookSection } from '@/components/post/PostBookSection';
import { PostImageGallery } from '@/components/post/PostImageGallery';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ModalPostComment() {
    const { isPostCommentOpen, closePostComment, postCommentData, openSharePost } = useModalStore();
    const router = useRouter();
    const { isAuthenticated } = useAppAuth();
    const [createComment] = usePostCreateMutation();

    const post = postCommentData?.post;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lastPostId, setLastPostId] = useState(post?.id);

    if (post?.id !== lastPostId) {
        setLastPostId(post?.id);
        setCurrentImageIndex(0);
    }

    const { isLiked, likeCount, toggleLike } = usePostActions({
        postId: post?.id ?? '',
        initialLikeCount: postCommentData?.likeCount ?? 0,
        initialLikeStatus: postCommentData?.likeStatus ?? false,
    });

    const {
        commentText,
        isSubmitting,
        commentInputRef,
        setCommentText,
        handleSubmitComment,
        handleKeyDown,
    } = usePostComments({
        postId: post?.id ?? '',
        createComment: async (params) => {
            await createComment(params).unwrap();
        },
    });

    if (!post) return null;

    const navigateToUser = () => {
        if (post?.user?.id) {
            router.push(`/users/${post.user.id}`);
        }
    };

    const handleShareClick = () => {
        openSharePost({
            postUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${post.id}`,
            shareTitle: post.content?.slice(0, 100) || 'Xem bài viết này',
            shareMedia: post.imageUrls?.[0] || '/abstract-book-pattern.png',
        });
    };

    const createdDate = new Date(post.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return (
        <Dialog open={isPostCommentOpen} onOpenChange={(open) => !open && closePostComment()}>
            <DialogContent className={cn(
                "w-[95vw] md:w-full h-[90vh] md:h-[85vh] p-0 gap-0 overflow-hidden border-border bg-card/95 flex flex-col md:flex-row rounded-2xl",
                post?.imageUrls && post.imageUrls.length > 0 ? "max-w-5xl" : "max-w-2xl mx-auto"
            )}>
                <DialogHeader className="sr-only">
                    <DialogTitle>Bình luận cho bài viết của {post.user?.username}</DialogTitle>
                    <DialogDescription>Xem và chia sẻ bình luận về bài viết này</DialogDescription>
                </DialogHeader>

                {/* Left Side - Image (Hidden on Mobile) */}
                {post?.imageUrls && post.imageUrls.length > 0 && (
                    <div className="hidden md:flex md:w-1/2 items-center justify-center relative border-r border-border group/gallery bg-slate-50 dark:bg-gray-900/30">
                        <Image
                            src={post.imageUrls[currentImageIndex]}
                            alt="Post content"
                            fill
                            sizes="50vw"
                            className="object-contain"
                            priority
                        />

                        {post.imageUrls.length > 1 && (
                            <>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => {
                                        if (currentImageIndex > 0) {
                                            setCurrentImageIndex((prev) => prev - 1);
                                        }
                                    }}
                                    disabled={currentImageIndex === 0}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md opacity-0 group-hover/gallery:opacity-100 transition-opacity disabled:hidden bg-white/80 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 border-none"
                                    aria-label="Ảnh trước"
                                >
                                    <span className="text-lg leading-none pb-1">‹</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => {
                                        if (currentImageIndex < post.imageUrls.length - 1) {
                                            setCurrentImageIndex((prev) => prev + 1);
                                        }
                                    }}
                                    disabled={currentImageIndex === post.imageUrls.length - 1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md opacity-0 group-hover/gallery:opacity-100 transition-opacity disabled:hidden bg-white/80 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 border-none"
                                    aria-label="Ảnh sau"
                                >
                                    <span className="text-lg leading-none pb-1">›</span>
                                </Button>

                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 rounded-full bg-black/20 backdrop-blur-[2px]">
                                    {post.imageUrls.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={cn(
                                                'h-1.5 rounded-full transition-all shadow-sm',
                                                index === currentImageIndex ? 'bg-white w-6' : 'bg-white/60 w-1.5 hover:bg-white/80'
                                            )}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Right Side - Comments & Info */}
                <div className={cn(
                    "flex flex-col h-full bg-card/95",
                    post?.imageUrls && post.imageUrls.length > 0 ? "w-full md:w-1/2" : "w-full"
                )}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                        <UserAvatarWithInfo
                            src={post.user?.image}
                            name={post.user?.username}
                            displayName={post.user?.username || post.user?.email || 'Người dùng ẩn danh'}
                            subtitle={createdDate}
                            onClick={post?.user?.id ? navigateToUser : undefined}
                        />
                    </div>

                    {/* Post Content & Comments Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1">
                            {/* Mobile Only Image Gallery */}
                            {post.imageUrls && post.imageUrls.length > 0 && (
                                <div className="md:hidden">
                                    <PostImageGallery images={post.imageUrls} />
                                </div>
                            )}

                            <div className="p-4 pb-0">
                                {/* Post Content */}
                                <div className="mb-6">
                                    <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">
                                        {post.content}
                                    </p>
                                </div>

                                {/* Book Section */}
                                {post.book && (
                                    <div className="pb-3">
                                        <PostBookSection book={post.book} />
                                    </div>
                                )}

                                {/* Moderation Alert */}
                                {post.isFlagged && (
                                    <Alert className="mb-6 overflow-hidden rounded-xl border border-amber-200/50 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-sm p-0 border-none">
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

                                <Separator className="mb-4 bg-slate-100 dark:bg-gray-800/50" />
                            </div>

                            {/* Comments List */}
                            <div className="px-4 pb-4">
                                <ListComments
                                    targetId={post.id}
                                    isCommentOpen={isPostCommentOpen}
                                    parentId={null}
                                    targetType={'post'}
                                />
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-border bg-card/95 shrink-0">
                        <PostActions
                            isLiked={isLiked}
                            likeCount={likeCount}
                            commentCount={postCommentData?.commentCount ?? 0}
                            onLike={toggleLike}
                            onComment={() => commentInputRef.current?.focus()}
                            onShare={handleShareClick}
                        />
                        <div className="px-4 pb-3 pt-2">
                            {isAuthenticated ? (
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1 flex gap-2">
                                        <Input
                                            ref={commentInputRef}
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Để lại cảm nghĩ của bạn..."
                                            className="flex-1 bg-slate-50 dark:bg-gray-900/50 border-none focus-visible:ring-1 focus-visible:ring-sky-500/30 rounded-full px-4 h-9 text-sm"
                                            onKeyDown={handleKeyDown}
                                        />
                                        <Button
                                            disabled={!commentText.trim() || isSubmitting}
                                            onClick={handleSubmitComment}
                                            size="sm"
                                            variant="ghost"
                                            className="font-bold text-sky-600 hover:text-sky-700 hover:bg-transparent px-2"
                                        >
                                            {isSubmitting ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : 'Đăng'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-2">
                                    <Link href="/login" className="text-sm text-sky-600 hover:text-sky-700 font-medium">
                                        Đăng nhập để bình luận
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
