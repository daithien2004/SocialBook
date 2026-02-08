'use client';

import ListComments from '@/components/comment/ListComments';
import { usePostCreateMutation } from '@/features/comments/api/commentApi';
import { Post } from '@/features/posts/types/post.interface';
import { getErrorMessage } from '@/lib/utils';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import SharePostModal from './SharePostModal';

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

interface ModalPostCommentProps {
    post: Post;
    isCommentOpen: boolean;
    closeCommentModal: () => void;
    handleLike: () => void;
    commentCount: number | undefined;
    likeStatus: boolean | undefined;
    likeCount: number | undefined;
}

const ModalPostComment: React.FC<ModalPostCommentProps> = (props) => {
    const { post, isCommentOpen, closeCommentModal } = props;

    const { theme } = useTheme();
    const [commentText, setCommentText] = useState('');
    const [createComment, { isLoading: isPosting }] = usePostCreateMutation();
    const commentInputRef = useRef<HTMLInputElement>(null);
    const [showShare, setShowShare] = useState(false);

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
            // Keep focus
            setTimeout(() => commentInputRef.current?.focus(), 0);
        } catch (e: any) {
            console.log('Create comment failed:', e);
            toast.error(getErrorMessage(e));
        }
    };

    return (
        <Dialog open={isCommentOpen} onOpenChange={(open) => !open && closeCommentModal()}>
            <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden border-slate-100 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] flex flex-col md:flex-row">
                <DialogHeader className="sr-only">
                    <DialogTitle>Bình luận cho bài viết của {post.userId?.username}</DialogTitle>
                    <DialogDescription>Xem và chia sẻ bình luận về bài viết này</DialogDescription>
                </DialogHeader>

                {/* Left Side - Image (Hidden on Mobile) */}
                <div className="hidden md:flex md:w-1/2 bg-slate-900 items-center justify-center relative">
                    {post?.imageUrls?.[0] ? (
                        <img
                            src={post.imageUrls[0]}
                            alt="Post content"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-slate-400 text-sm">
                            Không có hình ảnh
                        </div>
                    )}
                </div>

                {/* Right Side - Comments & Info */}
                <div className="flex flex-col w-full md:w-1/2 h-full">

                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-gray-800 shrink-0">
                        <Avatar className="h-9 w-9 border border-slate-200 dark:border-gray-700">
                            <AvatarImage src={post.userId?.image} className="object-cover" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">
                                {post.userId?.username}
                            </h4>
                            {post.bookId && (
                                <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                                    {post.bookId.title}
                                </p>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={closeCommentModal} className="md:hidden">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Post Content */}
                    <div className="p-4 text-sm text-slate-800 dark:text-gray-300 border-b border-slate-50 dark:border-gray-800/50 shrink-0 max-h-32 overflow-y-auto">
                        {post.content}
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-transparent">
                        <ListComments
                            targetId={post.id}
                            isCommentOpen={isCommentOpen}
                            parentId={null}
                            targetType={'post'}
                            theme={theme as 'light' | 'dark' | undefined}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-100 dark:border-gray-800 shrink-0 bg-white dark:bg-[#1a1a1a]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="hover:text-rose-500" onClick={props.handleLike}>
                                    <Heart className={`w-6 h-6 ${props.likeStatus ? 'fill-rose-500 text-rose-500' : ''}`} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => commentInputRef.current?.focus()}>
                                    <MessageCircle className="w-6 h-6" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setShowShare(true)}>
                                    <Send className="w-6 h-6 -rotate-45 mb-1" />
                                </Button>
                            </div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-gray-200">
                                {props.likeCount || 0} lượt thích
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                ref={commentInputRef}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Thêm bình luận..."
                                className="flex-1 bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-700"
                                onKeyDown={(e) => e.key === 'Enter' && onSubmitComment()}
                            />
                            <Button
                                disabled={!commentText.trim() || isPosting}
                                onClick={onSubmitComment}
                                size="sm"
                                className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                                variant="ghost"
                            >
                                Đăng
                            </Button>
                        </div>
                    </div>
                </div>

                <SharePostModal
                    isOpen={showShare}
                    onClose={() => setShowShare(false)}
                    postUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${post.id}`}
                    shareTitle={post.content?.slice(0, 100) || 'Xem bài viết này'}
                    shareMedia={post.imageUrls?.[0] || '/abstract-book-pattern.png'}
                />
            </DialogContent>
        </Dialog>
    );
};

export default ModalPostComment;
