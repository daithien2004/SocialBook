'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ListComments from '@/components/comment/ListComments';
import { usePostCreateMutation } from '@/features/comments/api/commentApi';
import { cn, formatDate } from '@/lib/utils';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useModalStore } from '@/store/useModalStore';
import { usePostComments } from '@/features/posts/hooks/usePostComments';
import { usePostActions } from '@/features/posts/hooks/usePostActions';

import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
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
import { useAppAuth } from '@/features/auth/hooks';

export default function ModalPostComment() {
    const { isPostCommentOpen, closePostComment, postCommentData, openSharePost } = useModalStore();
    const { theme } = useTheme();
    const [createComment, { isLoading: isPosting }] = usePostCreateMutation();

    const post = postCommentData?.post;
    const { user, isAuthenticated, isGuest } = useAppAuth();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        setCurrentImageIndex(0);
    }, [post?.id]);

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

    const handleShareClick = () => {
        openSharePost({
            postUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${post.id}`,
            shareTitle: post.content?.slice(0, 100) || 'Xem bài viết này',
            shareMedia: post.imageUrls?.[0] || '/abstract-book-pattern.png',
        });
    };

    return (
        <Dialog open={isPostCommentOpen} onOpenChange={(open) => !open && closePostComment()}>
            <DialogContent className="max-w-5xl h-[90vh] md:h-[85vh] p-0 gap-0 overflow-hidden border-border bg-card flex flex-col md:flex-row">
                <DialogHeader className="sr-only">
                    <DialogTitle>Bình luận cho bài viết của {post.user?.username}</DialogTitle>
                    <DialogDescription>Xem và chia sẻ bình luận về bài viết này</DialogDescription>
                </DialogHeader>

                {/* Left Side - Image (Hidden on Mobile) */}
                <div className="hidden md:flex md:w-1/2 items-center justify-center relative border-r border-border group/gallery">
                    {post?.imageUrls && post.imageUrls.length > 0 ? (
                        <>
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
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                            <div className="p-4 rounded-full bg-slate-900 border border-slate-800">
                                <Image
                                    src="/abstract-book-pattern.png"
                                    alt="Default"
                                    width={48}
                                    height={48}
                                    className="opacity-20"
                                />
                            </div>
                            <span className="text-sm font-medium">Không có hình ảnh</span>
                        </div>
                    )}
                </div>

                {/* Right Side - Comments & Info */}
                <div className="flex flex-col w-full md:w-1/2 h-full bg-card">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
                        <UserAvatar
                            src={post.user?.image}
                            name={post.user?.username}
                            size="md"
                            className="border border-border"
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate">
                                {post.user?.username}
                            </h4>
                            {post.book && (
                                <p className="text-xs font-medium text-sky-600 dark:text-sky-400 truncate">
                                    {post.book.title}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Post Content & Comments Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1">
                            <div className="p-4 pb-0">
                                {/* Post Content Section */}
                                <div className="mb-6 flex gap-3">
                                    <UserAvatar
                                        src={post.user?.image}
                                        name={post.user?.username}
                                        size="sm"
                                        className="shrink-0"
                                    />
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-bold text-foreground mr-2">
                                                {post.user?.username}
                                            </span>
                                            <span className="text-foreground leading-relaxed">
                                                {post.content}
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                            {formatDate(post.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <Separator className="mb-4 bg-slate-100 dark:bg-gray-800/50" />
                            </div>

                            {/* Comments List */}
                            <div className="px-4 pb-4">
                                <ListComments
                                    targetId={post.id}
                                    isCommentOpen={isPostCommentOpen}
                                    parentId={null}
                                    targetType={'post'}
                                    theme={theme as 'light' | 'dark' | undefined}
                                />
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-border bg-card shrink-0">
                        <div className="p-4 pb-3">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:text-rose-500 rounded-full"
                                        onClick={() => toggleLike()}
                                        aria-label={isLiked ? "Bỏ thích" : "Thích"}
                                    >
                                        <Heart className={cn("w-6 h-6 transition-all", isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-foreground')} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => commentInputRef.current?.focus()}
                                        className="rounded-full hover:text-slate-900 dark:hover:text-white"
                                        aria-label="Bình luận"
                                    >
                                        <MessageCircle className="w-6 h-6 text-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleShareClick}
                                        className="rounded-full hover:text-slate-900 dark:hover:text-white"
                                        aria-label="Chia sẻ"
                                    >
                                        <Send className="w-6 h-6 text-foreground" />
                                    </Button>
                                </div>
                                <p className="text-sm font-bold text-foreground">
                                    {likeCount || 0} lượt thích
                                </p>
                            </div>

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
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
