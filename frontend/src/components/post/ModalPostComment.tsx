'use client';

import Image from 'next/image';
import ListComments from '@/components/comment/ListComments';
import { usePostCreateMutation } from '@/features/comments/api/commentApi';
import { Post } from '@/features/posts/types/post.interface';
import { getErrorMessage, cn } from '@/lib/utils';
import { Heart, MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useModalStore } from '@/store/useModalStore';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default function ModalPostComment() {
    const { isPostCommentOpen, closePostComment, postCommentData, openSharePost } = useModalStore();
    const { theme } = useTheme();
    const [commentText, setCommentText] = useState('');
    const [createComment, { isLoading: isPosting }] = usePostCreateMutation();
    const commentInputRef = useRef<HTMLInputElement>(null);

    const post = postCommentData?.post;
    const handleLike = postCommentData?.handleLike;
    const likeStatus = postCommentData?.likeStatus;
    const likeCount = postCommentData?.likeCount;

    useEffect(() => {
        if (!isPostCommentOpen) {
            setCommentText('');
        }
    }, [isPostCommentOpen]);

    if (!post) return null;

    const onSubmitComment = async () => {
        const content = commentText.trim();
        if (!content) return;

        try {
            await createComment({
                targetType: 'post',
                targetId: post.id,
                content,
                parentId: null,
            }).unwrap();

            setCommentText('');
            toast.success('Bình luận đã được gửi!');
            setTimeout(() => commentInputRef.current?.focus(), 0);
        } catch (e: any) {
            console.error('Create comment failed:', e);
            toast.error(getErrorMessage(e));
        }
    };

    const handleShareClick = () => {
        openSharePost({
            postUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${post.id}`,
            shareTitle: post.content?.slice(0, 100) || 'Xem bài viết này',
            shareMedia: post.imageUrls?.[0] || '/abstract-book-pattern.png',
        });
    };

    return (
        <Dialog open={isPostCommentOpen} onOpenChange={(open) => !open && closePostComment()}>
            <DialogContent className="max-w-5xl h-[90vh] md:h-[85vh] p-0 gap-0 overflow-hidden border-slate-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] flex flex-col md:flex-row">
                <DialogHeader className="sr-only">
                    <DialogTitle>Bình luận cho bài viết của {post.user?.username}</DialogTitle>
                    <DialogDescription>Xem và chia sẻ bình luận về bài viết này</DialogDescription>
                </DialogHeader>

                {/* Left Side - Image (Hidden on Mobile) */}
                <div className="hidden md:flex md:w-1/2 bg-slate-950 items-center justify-center relative border-r border-slate-100 dark:border-gray-800">
                    {post?.imageUrls?.[0] ? (
                        <Image
                            src={post.imageUrls[0]}
                            alt="Post content"
                            fill
                            sizes="50vw"
                            className="object-contain"
                            priority
                        />
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
                <div className="flex flex-col w-full md:w-1/2 h-full bg-white dark:bg-[#1a1a1a]">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-gray-800 shrink-0">
                        <Avatar className="h-10 w-10 border border-slate-200 dark:border-gray-700">
                            <AvatarImage src={post.user?.image} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 dark:bg-gray-800 text-slate-500">
                                {post.user?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-gray-100 truncate">
                                {post.user?.username}
                            </h4>
                            {post.book && (
                                <p className="text-xs font-medium text-sky-600 dark:text-sky-400 truncate">
                                    {post.book.title}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closePostComment}
                            className="rounded-full hover:bg-slate-100 dark:hover:bg-gray-800"
                            aria-label="Đóng"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </Button>
                    </div>

                    {/* Post Content & Comments Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1">
                            <div className="p-4 pb-0">
                                {/* Post Content Section */}
                                <div className="mb-6 flex gap-3">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={post.user?.image} className="object-cover" />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-bold text-slate-900 dark:text-gray-100 mr-2">
                                                {post.user?.username}
                                            </span>
                                            <span className="text-slate-800 dark:text-gray-200 leading-relaxed">
                                                {post.content}
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                            {new Date(post.createdAt || '').toLocaleDateString('vi-VN')}
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
                    <div className="border-t border-slate-100 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shrink-0">
                        <div className="p-4 pb-3">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:text-rose-500 rounded-full"
                                        onClick={() => handleLike?.(post.id)}
                                        aria-label={likeStatus ? "Bỏ thích" : "Thích"}
                                    >
                                        <Heart className={cn("w-6 h-6 transition-all", likeStatus ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-700 dark:text-gray-300')} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => commentInputRef.current?.focus()}
                                        className="rounded-full hover:text-slate-900 dark:hover:text-white"
                                        aria-label="Bình luận"
                                    >
                                        <MessageCircle className="w-6 h-6 text-slate-700 dark:text-gray-300" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleShareClick}
                                        className="rounded-full hover:text-slate-900 dark:hover:text-white"
                                        aria-label="Chia sẻ"
                                    >
                                        <Send className="w-6 h-6 text-slate-700 dark:text-gray-300 -rotate-45 mb-1" />
                                    </Button>
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-gray-100">
                                    {likeCount || 0} lượt thích
                                </p>
                            </div>

                            <div className="flex gap-3 items-center">
                                <Avatar className="h-8 w-8 border border-slate-100 dark:border-gray-800">
                                    <AvatarFallback className="text-[10px] bg-slate-100 dark:bg-gray-800">ME</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        ref={commentInputRef}
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Để lại cảm nghĩ của bạn..."
                                        className="flex-1 bg-slate-50 dark:bg-gray-900/50 border-none focus-visible:ring-1 focus-visible:ring-sky-500/30 rounded-full px-4 h-9 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSubmitComment()}
                                    />
                                    <Button
                                        disabled={!commentText.trim() || isPosting}
                                        onClick={onSubmitComment}
                                        size="sm"
                                        variant="ghost"
                                        className="font-bold text-sky-600 hover:text-sky-700 hover:bg-transparent px-2"
                                    >
                                        {isPosting ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : 'Đăng'}
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
